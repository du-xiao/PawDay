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
pnpm prisma migrate dev
pnpm db:seed
pnpm dev
```

打开 `http://localhost:3000`，使用 `.env` 中的 `ADMIN_EMAIL` 和 `ADMIN_PASSWORD` 登录。

本地环境中的 `file:../data/pawday.db` 是相对 `prisma/schema.prisma` 的路径；Docker Compose 会自动覆盖为 `file:/data/pawday.db`。

首次只想使用空数据库时，可以跳过 `pnpm db:seed`。应用第一次收到请求时会自动建表，并在数据库没有用户的情况下创建管理员。

## Docker / 绿联云 NAS

1. 复制环境变量并修改密码与密钥：

```bash
cp .env.example .env
```

建议使用以下命令生成 `AUTH_SECRET`：

```bash
openssl rand -base64 32
```

2. 构建并启动：

```bash
docker compose up -d --build
```

3. 访问 `http://NAS-IP:3000`。

Compose 会挂载：

- `./data` → `/data`，数据库为 `/data/pawday.db`
- `./uploads` → `/uploads`，保存上传图片

更新应用时重新执行 `docker compose up -d --build`。只要保留这两个宿主机目录，重建容器不会丢失数据。

## 公网访问

应用除 `/login`、`/api/auth/*`、`/favicon.ico`、`/uploads/*` 外均由 `middleware.ts` 保护。建议通过 NAS 自带反向代理或可信网关配置 HTTPS，不要直接把 3000 端口暴露到公网。

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
- `/uploads/*` 按需求设为公开资源路径，请不要在照片中保存敏感信息

## 常用命令

```bash
pnpm lint
pnpm build
pnpm prisma studio
pnpm prisma migrate dev
pnpm db:seed
```
