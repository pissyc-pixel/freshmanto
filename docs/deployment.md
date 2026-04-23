# VPS 部署说明

这份文档面向“朋友内测版”：目标是在自己的 VPS 上用 PM2 + Nginx 跑 Next.js 生产模式，再通过域名访问。

## 服务器准备

建议环境：

- Ubuntu 22.04 或 24.04
- Node.js 20 LTS 或更高
- npm
- PM2
- Nginx
- 一个已经解析到 VPS 的域名，例如 `beta.example.com`

安装示例：

```bash
sudo apt update
sudo apt install -y nginx git
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

## 拉取代码与安装依赖

```bash
git clone <your-repo-url> freshmanto
cd freshmanto
npm ci
```

## 配置生产环境变量

复制占位示例，不要把真实值提交回仓库：

```bash
cp .env.example .env.production
nano .env.production
```

至少填写：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `DATABASE_URL`
- `NODE_ENV=production`

AI 变量可选；缺少时会自动使用本地 fallback 文案。

如果使用 PM2 启动，推荐在启动前加载环境变量：

```bash
set -a
source .env.production
set +a
```

## 构建与 PM2 启动

```bash
npm run build
pm2 start ecosystem.config.js --env production
pm2 save
pm2 status
```

常用维护命令：

```bash
pm2 logs freshmanto-beta
pm2 restart freshmanto-beta --update-env
pm2 stop freshmanto-beta
```

## Nginx 反向代理

仓库提供示例配置：

```bash
deploy/nginx/freshmanto-beta.conf.example
```

部署时复制到 Nginx：

```bash
sudo cp deploy/nginx/freshmanto-beta.conf.example /etc/nginx/sites-available/freshmanto-beta
sudo nano /etc/nginx/sites-available/freshmanto-beta
sudo ln -s /etc/nginx/sites-available/freshmanto-beta /etc/nginx/sites-enabled/freshmanto-beta
sudo nginx -t
sudo systemctl reload nginx
```

把示例里的 `beta.example.com` 替换成自己的域名。

## HTTPS

建议用 Certbot 配置 HTTPS：

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d beta.example.com
```

## 更新部署

```bash
cd freshmanto
git pull
npm ci
npm run build
set -a
source .env.production
set +a
pm2 restart freshmanto-beta --update-env
```

## 上线前检查

```bash
npm test
npm run lint
npm run build
```

然后访问：

- `http://127.0.0.1:3000`
- `http://你的域名`

如果首页能打开，能开新档，主游戏页能提交一次行动并看到结果卡，说明内测版最小链路已经跑通。
