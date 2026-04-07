# AgentOps Studio - 服务器部署指南

## 服务器要求

| 资源 | 最低配置 | 推荐配置 |
|------|---------|---------|
| CPU | 2 核 | 4 核 |
| 内存 | 4 GB | 8 GB |
| 磁盘 | 20 GB | 50 GB |
| 系统 | Ubuntu 20.04+ / Debian 11+ | Ubuntu 22.04+ |

## 第一步：服务器环境准备

### 1.1 更新系统

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 安装基础软件

```bash
# 安装 Docker 和 Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 安装 Docker Compose (独立版本)
sudo apt install -y docker-compose

# 安装 Git
sudo apt install -y git

# 安装 Make (用于简化部署命令)
sudo apt install -y make
```

### 1.3 验证 Docker 安装

```bash
docker --version
docker-compose --version
```

## 第二步：域名配置（如需 HTTPS）

### 2.1 A 记录解析

在您的域名 DNS 管理中添加：

| 记录类型 | 主机名 | 值 | TTL |
|---------|--------|-----|-----|
| A | @ | 服务器IP | 300 |
| A | www | 服务器IP | 300 |

### 2.2 安装 Certbot (用于 HTTPS)

```bash
sudo apt install -y certbot python3-certbot-nginx
```

## 第三步：部署应用

### 3.1 上传代码到服务器

**方式一：使用 Git**

```bash
git clone <your-repo-url> /opt/agentops
cd /opt/agentops
```

**方式二：使用 SCP**

```bash
scp -r ./agentops-studio user@your-server:/opt/agentops
```

### 3.2 配置环境变量

```bash
cd /opt/agentops

# 复制示例配置
cp .env.production.example .env.production

# 编辑配置
nano .env.production
```

**必须配置的项目：**

```env
# 修改为您的域名
DOMAIN=your-domain.com

# 生成安全的 JWT Secret
JWT_SECRET=your_jwt_secret_here

# PostgreSQL 密码
POSTGRES_PASSWORD=your_secure_password_here

# MinIO 密码
S3_SECRET_KEY=your_minio_password_here

# AI API Keys（必须，否则 AI 功能无法使用）
OPENAI_API_KEY=sk-your-openai-api-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key
```

**生成 JWT Secret：**

```bash
openssl rand -base64 32
```

### 3.3 一键部署

```bash
cd /opt/agentops
chmod +x deploy.sh
./deploy.sh
```

## 第四步：配置 Nginx 和 HTTPS（可选但推荐）

### 4.1 复制 SSL 证书

如果您有 SSL 证书：

```bash
mkdir -p /opt/agentops/nginx/ssl
# 将证书复制到 ssl 目录
# fullchain.pem 和 privkey.pem
```

### 4.2 启用 HTTPS

编辑 `/opt/agentops/nginx/nginx.conf`，取消 HTTPS server 块的注释并配置证书路径。

### 4.3 获取 Let's Encrypt 证书

```bash
sudo certbot --nginx -d your-domain.com
```

## 第五步：验证部署

### 5.1 检查服务状态

```bash
docker-compose -f /opt/agentops/docker-compose.prod.yml ps
```

### 5.2 查看日志

```bash
# 查看所有服务日志
docker-compose -f /opt/agentops/docker-compose.prod.yml logs -f

# 查看特定服务
docker-compose -f /opt/agentops/docker-compose.prod.yml logs -f api
docker-compose -f /opt/agentops/docker-compose.prod.yml logs -f web
```

### 5.3 访问应用

| 服务 | 地址 |
|------|------|
| Web UI | http://your-domain.com 或 http://服务器IP:3000 |
| API | http://your-domain.com:3001 |
| WebSocket | ws://your-domain.com:3002 |
| MinIO Console | http://your-domain.com:9001 |

## 常用运维命令

### 启动服务

```bash
cd /opt/agentops
docker-compose -f docker-compose.prod.yml up -d
```

### 停止服务

```bash
cd /opt/agentops
docker-compose -f docker-compose.prod.yml down
```

### 重启服务

```bash
cd /opt/agentops
docker-compose -f docker-compose.prod.yml restart api
```

### 更新部署

```bash
cd /opt/agentops
git pull origin main
./deploy.sh
```

### 数据库迁移

```bash
cd /opt/agentops
docker-compose -f docker-compose.prod.yml exec api bun run db:migrate
```

### 进入容器调试

```bash
docker exec -it agentops-api sh
docker exec -it agentops-worker sh
```

## 数据备份

### 备份 PostgreSQL

```bash
docker exec agentops-postgres pg_dump -U postgres agentops > backup_$(date +%Y%m%d).sql
```

### 备份 MinIO 数据

```bash
docker exec agentops-minio mc backup local /data backup_$(date +%Y%m%d)
```

## 故障排查

### 检查端口占用

```bash
netstat -tlnp | grep -E '3000|3001|3002|5432|6379'
```

### 查看容器健康状态

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### 重置所有数据（慎用）

```bash
cd /opt/agentops
docker-compose -f docker-compose.prod.yml down -v
docker volume rm agentops_postgres_data agentops_redis_data agentops_minio_data
./deploy.sh
```

## 安全建议

1. **修改默认密码**：立即修改 `POSTGRES_PASSWORD` 和 `S3_SECRET_KEY`
2. **配置防火墙**：只开放 80、443 端口
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```
3. **启用 HTTPS**：生产环境必须使用 HTTPS
4. **定期更新**：保持 Docker 镜像最新
   ```bash
   docker-compose -f docker-compose.prod.yml pull
   docker-compose -f docker-compose.prod.yml up -d
   ```
