---
name: billintegration-deployment
description: Standard Operating Procedure for deploying the Digital Invoice System and Customer Billing Messaging platform to the production server (bill.retailnode.in / 95.135.166.109).
---

# RetailNode Digital Invoice Deployment SOP

When deploying or updating code on the production server for `bill.retailnode.in`, you **MUST** follow this standardized workflow.

## Production Server Environment
- **Domain**: `bill.retailnode.in`
- **Host IP**: `95.135.166.109`
- **User**: `root`
- **Remote Project Directory**: `/var/www/billintegration` or `/var/www/digital-invoice-system`
- **Services Architecture**:
  - `web-receipt` (Next.js): Port `3000` (Reverse proxied from `https://bill.retailnode.in`)
  - `backend-api` (Node.js/Express): Port `4000` (Reverse proxied from `https://bill.retailnode.in/api/v1` or internal bridge)
  - `mysql`: Port `3306` (Internal docker or host MySQL)
  - `redis`: Port `6379` (Internal docker or host Redis)

---

## 1. Local Build & Verification (Pre-Deployment)
Always verify builds locally before pushing to production:
```bash
# Test backend syntax
cd digital-invoice-system/backend-api
node -c src/server.js

# Test frontend build
cd ../web-receipt
npm run build
```

---

## 2. Remote Deployment Methods

### Option A: Docker Compose Deployment (Recommended)
On the remote server at `/var/www/billintegration/digital-invoice-system`:
```bash
docker compose pull && docker compose up -d --build
```

### Option B: PM2 Deployment
If running directly on the host with Node.js and PM2:
```bash
# 1. Sync backend code
rsync -avz --exclude 'node_modules' --exclude '.git' \
  digital-invoice-system/backend-api/ root@95.135.166.109:/var/www/billintegration/backend-api/

# 2. Sync web-receipt code & build
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.git' \
  digital-invoice-system/web-receipt/ root@95.135.166.109:/var/www/billintegration/web-receipt/

# 3. Restart PM2 processes remotely
ssh root@95.135.166.109 "cd /var/www/billintegration/backend-api && npm install --production && pm2 restart bill-backend || pm2 start src/server.js --name bill-backend"
ssh root@95.135.166.109 "cd /var/www/billintegration/web-receipt && npm install && npm run build && pm2 restart bill-web || pm2 start npm --name 'bill-web' -- start"
```

---

## 3. Nginx Reverse Proxy Configuration for `bill.retailnode.in`
The production Nginx block on `95.135.166.109` routes traffic to Next.js (`3000`) and the API (`4000`):

```nginx
server {
    server_name bill.retailnode.in;

    # Backend API routing
    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend Digital Receipt & Dashboard routing
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    listen 80;
}
```

SSL setup with Let's Encrypt Certbot:
```bash
certbot --nginx -d bill.retailnode.in
```

---

## 4. Post-Deployment Verification
Always execute a health check against the live endpoint:
```bash
curl -I https://bill.retailnode.in/health
curl -I https://bill.retailnode.in/
```
