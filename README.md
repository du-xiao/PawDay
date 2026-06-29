# PawDay

PawDay 是一个为家庭 NAS 设计的私人宠物生活记录应用。它把日常、健康、开销和照片放在一个温暖、移动端友好的空间里，全部数据保存在自己的设备上。

## 功能

- 单主人邮箱密码登录，Auth.js 会话有效期 30 天
- 首次启动自动创建管理员账号与 SQLite 表结构
- 小狗档案、年龄和陪伴天数
- 日常记录的新增、编辑、删除、搜索、筛选和图片
- 养狗开销统计、分类占比与月度趋势
- 健康时间线、体重趋势和下次提醒
- JPG / PNG / WebP 照片上传、灯箱预览和日常记录关联
- 深色模式、桌面侧栏、移动端底部导航
- Docker 多阶段构建与 NAS 持久化目录

## 技术栈

Next.js 15 App Router、TypeScript、Tailwind CSS v4、shadcn/ui 组件模式、Prisma、SQLite、Auth.js v5、bcrypt、Zod、React Hook Form、Recharts、lucide-react。

## 本地开发

需要 Node.js 22+ 和 pnpm。

```bash
cp .env.example .env
pnpm install
pnpm dev
```

打开 `http://localhost:3000`，使用 `.env` 中的 `ADMIN_EMAIL` 和 `ADMIN_PASSWORD` 登录。

本地环境中的 `file:../data/pawday.db` 是相对 `prisma/schema.prisma` 的路径；Docker Compose 会自动覆盖为 `file:/data/pawday.db`。

应用第一次收到请求时会自动建表，并且只在数据库没有用户时创建一个管理员。不会自动创建小狗、日常、开销、健康、提醒或照片数据。`pnpm db:seed` 也只执行同一套管理员初始化逻辑。

`ADMIN_EMAIL` 和 `ADMIN_PASSWORD` 只用于空数据库的首次初始化。数据库已有管理员后，修改环境变量不会覆盖现有账号或密码，密码请在应用的“设置”页面修改。

## Docker / 绿联云 NAS

### 1. 确认 NAS 架构

在 NAS 终端运行：

```bash
uname -m
```

- `x86_64`：使用 `linux/amd64`
- `aarch64` 或 `arm64`：使用 `linux/arm64`

当前部署设备的 CPU 是 **Intel N100**，属于 `x86_64` 架构，因此 PawDay 镜像固定构建为 `linux/amd64`，不要使用 `linux/arm64`。

### 2. 在 Mac 构建并导出镜像

当前 Intel N100 绿联 NAS 使用下面的命令。即使 Mac 是 Apple 芯片，也必须指定目标平台为 `linux/amd64`：

```bash
  docker buildx build \
  --platform linux/amd64 \
  --build-arg NODE_IMAGE=docker.m.daocloud.io/library/node:22-alpine \
  --build-arg NPM_REGISTRY=https://registry.npmmirror.com \
  -t pawday:1.0.0 \
  --load .
docker save -o pawday-1.0.0-amd64.tar pawday:1.0.0
```

如果构建时出现 `ECONNRESET`、`TLS handshake timeout` 或 npm 包下载失败，通常是网络到 Docker Hub / npm registry 不稳定。上面的命令已经使用 DaoCloud 的 Node 基础镜像和 npmmirror 的 npm 镜像源；重新执行同一条 `docker buildx build ...` 即可。`Dockerfile` 里也增加了 pnpm 下载重试和较低并发，弱网环境会慢一些，但更稳。

只有以后更换为 ARM 架构 NAS 时，才改用：

```bash
docker buildx build --platform linux/arm64 -t pawday:1.0.0 --load .
docker save -o pawday-1.0.0-arm64.tar pawday:1.0.0
```

Apple 芯片 Mac 也可以构建 `linux/amd64` 镜像，目标平台必须与 NAS 架构一致。将生成的 `.tar` 上传到绿联云，在 Docker 镜像管理中导入；也可以在 NAS 终端执行：

```bash
docker load -i pawday-1.0.0-amd64.tar
```

### 3. NAS Compose 配置

`docker-compose.nas.yml` 是自包含配置，不依赖额外的 `.env` 文件。使用前在文件中修改：

- `image`：必须与导入 NAS 的镜像名称和版本一致
- `ADMIN_EMAIL`：空数据库首次启动时创建的管理员邮箱
- `ADMIN_PASSWORD`：空数据库首次启动时创建的管理员密码，至少 8 位
- `AUTH_SECRET`：登录会话加密秘钥，生成后长期保留
- `volumes` 左侧：NAS 上的数据库和上传图片存储路径

在 Mac 生成认证秘钥：

```bash
openssl rand -base64 48
```

将输出完整填入 Compose 的 `AUTH_SECRET`。认证秘钥是一个配置值，不是文件路径；上传文件路径由 `volumes` 和 `UPLOAD_DIR` 共同配置。

示例使用 `/volume1/docker/pawday/data` 和 `/volume1/docker/pawday/uploads`。先在 NAS 创建目录并授予容器用户 `1001` 读写权限：

```bash
sudo mkdir -p /volume1/docker/pawday/data /volume1/docker/pawday/uploads
sudo chown -R 1001:1001 /volume1/docker/pawday/data /volume1/docker/pawday/uploads
docker compose -f docker-compose.nas.yml up -d
```

不同绿联型号的共享目录可能不是 `/volume1`，请以 NAS 文件管理器显示的实际绝对路径为准。访问 `http://NAS-IP:3000`。如果 NAS 没有 `sudo`，请在绿联云文件管理器中给两个存储目录授予 Docker 容器可读写权限。

Compose 会挂载：

- `/volume1/docker/pawday/data` → `/data`，数据库为 `/data/pawday.db`
- `/volume1/docker/pawday/uploads` → `/uploads`，保存上传图片

镜像中不包含这两个目录的数据。删除或重建容器不会丢失数据，只要不删除 NAS 上挂载的 `data` 和 `uploads` 目录。

管理员邮箱和密码只对空数据库生效。已有 `/data/pawday.db` 时，修改 Compose 中的管理员配置不会重置账号；登录后可在“设置”页面修改密码。

容器启动时会创建并检查 `/data/pawday.db` 是否可写，但不会覆盖已有文件。健康检查只判断登录页是否可访问，不负责初始化数据库。第一次提交登录时才会创建数据库表和首个管理员；之后始终复用已有数据库。

镜像还会为当前 `PUID/PGID` 创建可写的 `/app/.next/cache`，供 Next.js 图片优化缓存使用。应用代码目录保持只读，登录页采用动态渲染，不会尝试回写预渲染 HTML。

启动脚本会分别测试数据库目录、上传目录、Next.js 缓存和系统临时目录的真实文件写入能力。Next.js 的 ISR 磁盘落盘已关闭，因此运行时不会修改 `/app/.next/server` 下的构建文件。

### 4. 升级与回滚

升级前先停容器并备份，避免复制 SQLite 正在写入的文件：

```bash
sudo mkdir -p /volume1/docker/pawday/backups
docker compose -f docker-compose.nas.yml stop
sudo tar -czf "/volume1/docker/pawday/backups/pawday-$(date +%F-%H%M).tar.gz" \
  /volume1/docker/pawday/data \
  /volume1/docker/pawday/uploads \
  docker-compose.nas.yml
docker compose -f docker-compose.nas.yml start
```

在 Mac 上用新版本号构建，例如 `pawday:1.1.0`，上传并导入 NAS。然后把 Compose 中的 `image` 改为 `pawday:1.1.0`：

```bash
docker compose -f docker-compose.nas.yml up -d
```

升级只替换容器，原数据库和图片继续使用。需要回滚时，把 `image` 改回旧标签并再次执行 `up -d`。不要删除 `data`、`uploads`，也不要执行会删除这些宿主机目录的命令。

## 公网访问

应用除 `/login`、`/api/auth/*`、`/favicon.ico` 外均要求登录，上传图片也会校验会话。建议通过 NAS 自带反向代理或可信网关配置 HTTPS，不要直接把 3000 端口暴露到公网。

请务必：

- 使用强密码
- 设置至少 32 字节的随机 `AUTH_SECRET`
- 在反向代理启用 HTTPS
- 定期更新镜像与依赖

## 备份与恢复

备份 `data/` 和 `uploads/` 即可。恢复时停止容器，替换这两个目录的内容，再重新启动。

```bash
docker compose stop
# 恢复 data/ 与 uploads/
docker compose up -d
```

## 上传限制

- 格式：JPG、PNG、WebP
- 单文件：最大 10MB
- 文件名：服务端生成随机 UUID
- 上传文件需要有效登录会话才能读取

## 常用命令

```bash
pnpm lint
pnpm build
pnpm prisma studio
pnpm prisma migrate dev
pnpm db:seed
```
