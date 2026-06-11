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

### 2. 在 Mac 构建并导出镜像

大多数 Intel / AMD 绿联云型号使用：

```bash
docker buildx build --platform linux/amd64 -t pawday:1.0.0 --load .
docker save -o pawday-1.0.0-amd64.tar pawday:1.0.0
```

ARM 型号改为：

```bash
docker buildx build --platform linux/arm64 -t pawday:1.0.0 --load .
docker save -o pawday-1.0.0-arm64.tar pawday:1.0.0
```

将生成的 `.tar` 上传到绿联云，在 Docker 镜像管理中导入；也可以在 NAS 终端执行 `docker load -i pawday-1.0.0-amd64.tar`。

### 3. NAS Compose 配置

把 `docker-compose.nas.yml` 和一份 `.env.nas` 放在 NAS 的同一目录：

```bash
cp .env.nas.example .env.nas
openssl rand -base64 32
```

把随机值填入 `.env.nas` 的 `AUTH_SECRET`，同时修改首次管理员密码。然后创建持久化目录并启动：

```bash
mkdir -p data uploads
sudo chown -R 1001:1001 data uploads
docker compose --env-file .env.nas -f docker-compose.nas.yml up -d
```

访问 `http://NAS-IP:3000`。如果 NAS 没有 `sudo`，请在绿联云文件管理器中给 Compose 所在目录及 `data`、`uploads` 目录授予 Docker 容器可读写权限。

Compose 会挂载：

- `./data` → `/data`，数据库为 `/data/pawday.db`
- `./uploads` → `/uploads`，保存上传图片

镜像中不包含这两个目录的数据。删除或重建容器不会丢失数据，只要不删除 Compose 所在目录里的 `data` 和 `uploads`。

### 4. 升级与回滚

升级前先停容器并备份，避免复制 SQLite 正在写入的文件：

```bash
mkdir -p backups
docker compose --env-file .env.nas -f docker-compose.nas.yml stop
tar -czf "backups/pawday-$(date +%F-%H%M).tar.gz" data uploads .env.nas docker-compose.nas.yml
docker compose --env-file .env.nas -f docker-compose.nas.yml start
```

在 Mac 上用新版本号构建，例如 `pawday:1.1.0`，上传并导入 NAS。然后把 `.env.nas` 中的 `PAWDAY_IMAGE` 改为 `pawday:1.1.0`：

```bash
docker compose --env-file .env.nas -f docker-compose.nas.yml up -d
```

升级只替换容器，原数据库和图片继续使用。需要回滚时，把 `PAWDAY_IMAGE` 改回旧标签并再次执行 `up -d`。不要删除 `data`、`uploads`，也不要执行会删除卷或数据目录的命令。

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
