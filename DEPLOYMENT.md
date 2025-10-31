# Deployment Guide for Raspberry Pi

This guide provides step-by-step instructions for deploying publicpresence.org to a Raspberry Pi running nginx.

## Prerequisites Checklist

- [ ] Raspberry Pi (3B+ or newer recommended) with Raspberry Pi OS
- [ ] SSH access to your Pi
- [ ] Domain name pointing to your Pi's IP address
- [ ] At least 2GB free storage on your Pi

## Part 1: Prepare Your Raspberry Pi

### 1.1 Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Install Node.js

```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v18.x or higher
npm --version
```

### 1.3 Install nginx

```bash
sudo apt install -y nginx

# Start and enable nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify it's running
sudo systemctl status nginx
```

### 1.4 Install Git (if not already installed)

```bash
sudo apt install -y git
```

## Part 2: Deploy Your Application

### 2.1 Clone or Transfer Project

**Option A: Using Git (Recommended)**

```bash
cd /home/pi
git clone YOUR_REPOSITORY_URL public-presence
cd public-presence
```

**Option B: Transfer from Local Machine**

```bash
# On your local machine
scp -r /path/to/public-presence pi@YOUR_PI_IP:/home/pi/
```

### 2.2 Install Dependencies and Build

```bash
cd /home/pi/public-presence
npm install
npm run build
```

This creates the `dist/` directory with your built site.

## Part 3: Configure nginx

### 3.1 Create nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/public-presence
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name publicpresence.org www.publicpresence.org;
    
    # Document root - where your built site lives
    root /home/pi/public-presence/dist;
    index index.html;
    
    # Enable gzip compression for better performance
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/javascript application/xml+rss 
               application/json image/svg+xml;
    
    # Main location block
    location / {
        # Try to serve file directly, fallback to index.html
        # This enables client-side routing
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets for better performance
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # RSS feed
    location = /rss.xml {
        add_header Content-Type application/rss+xml;
        expires 1h;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### 3.2 Enable Site

```bash
# Create symbolic link to enable site
sudo ln -s /etc/nginx/sites-available/public-presence /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx
```

### 3.3 Verify Deployment

Visit `http://YOUR_PI_IP` in a browser. You should see your site!

## Part 4: Set Up Automatic Rebuilds

### 4.1 Create Systemd Service

```bash
sudo nano /etc/systemd/system/public-presence-watcher.service
```

Add the following:

```ini
[Unit]
Description=publicpresence.org Blog File Watcher
Documentation=https://github.com/yourusername/public-presence
After=network.target

[Service]
Type=simple
User=pi
Group=pi
WorkingDirectory=/home/pi/public-presence
ExecStart=/usr/bin/node /home/pi/public-presence/scripts/watcher.js
Restart=always
RestartSec=10

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=public-presence-watcher

# Security hardening
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

### 4.2 Enable and Start Service

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service (starts on boot)
sudo systemctl enable public-presence-watcher

# Start service now
sudo systemctl start public-presence-watcher

# Check status
sudo systemctl status public-presence-watcher
```

### 4.3 Monitor Service Logs

```bash
# View recent logs
sudo journalctl -u public-presence-watcher -n 50

# Follow logs in real-time
sudo journalctl -u public-presence-watcher -f

# View logs from specific date
sudo journalctl -u public-presence-watcher --since "2025-01-30"
```

## Part 5: SSL/HTTPS Setup (Recommended)

### 5.1 Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 5.2 Obtain SSL Certificate

```bash
sudo certbot --nginx -d publicpresence.org -d www.publicpresence.org
```

Follow the prompts:
- Enter your email address
- Agree to terms of service
- Choose whether to redirect HTTP to HTTPS (recommended: yes)

### 5.3 Test Auto-Renewal

```bash
sudo certbot renew --dry-run
```

Certbot automatically sets up a cron job for renewal. Your certificate will auto-renew before expiring.

## Part 6: Create Deployment Script

### 6.1 Create Update Script

```bash
nano /home/pi/update-blog.sh
```

Add the following:

```bash
#!/bin/bash

# publicpresence.org Blog Update Script
# This script pulls latest changes and rebuilds the site

set -e  # Exit on error

echo "🔄 Updating publicpresence.org blog..."

# Navigate to project directory
cd /home/pi/public-presence

# Pull latest changes (if using git)
echo "📥 Pulling latest changes..."
git pull origin main || { echo "❌ Git pull failed"; exit 1; }

# Install any new dependencies
echo "📦 Installing dependencies..."
npm install || { echo "❌ npm install failed"; exit 1; }

# Build the site
echo "🔨 Building site..."
npm run build || { echo "❌ Build failed"; exit 1; }

# Optional: Reload nginx (usually not necessary)
# sudo systemctl reload nginx

echo "✅ Update complete!"
echo "🌐 Site updated at $(date)"
```

### 6.2 Make Script Executable

```bash
chmod +x /home/pi/update-blog.sh
```

### 6.3 Test Script

```bash
./update-blog.sh
```

## Part 7: Writing and Publishing Posts

### 7.1 Add New Post

On your Raspberry Pi:

```bash
cd /home/pi/public-presence
nano content/posts/my-new-post.md
```

Add frontmatter and content:

```markdown
---
title: "My New Post"
date: "2025-01-30"
excerpt: "Brief description"
tags: ["sustainability", "policy"]
author: "Harrison Weiss"
---

# My New Post

Content goes here...
```

Save and exit (Ctrl+X, Y, Enter).

### 7.2 Automatic Rebuild

The watcher service will automatically detect the new post and rebuild the site within 5 seconds.

Monitor rebuild:

```bash
sudo journalctl -u public-presence-watcher -f
```

### 7.3 Manual Rebuild (if needed)

```bash
cd /home/pi/public-presence
npm run build
```

## Part 8: Maintenance Tasks

### 8.1 Update Application

```bash
cd /home/pi/public-presence
git pull origin main
npm install
npm run build
```

Or use the update script:

```bash
./update-blog.sh
```

### 8.2 Restart Services

```bash
# Restart watcher
sudo systemctl restart public-presence-watcher

# Restart nginx
sudo systemctl restart nginx
```

### 8.3 View Service Status

```bash
# Check watcher
sudo systemctl status public-presence-watcher

# Check nginx
sudo systemctl status nginx
```

### 8.4 Backup Content

```bash
# Backup posts
cd /home/pi/public-presence
tar -czf ~/backups/posts-$(date +%Y%m%d).tar.gz content/posts/

# Backup entire project
tar -czf ~/backups/public-presence-$(date +%Y%m%d).tar.gz \
  --exclude=node_modules \
  --exclude=dist \
  /home/pi/public-presence
```

### 8.5 Monitor Resources

```bash
# Check disk usage
df -h

# Check memory usage
free -h

# Check running processes
top
```

## Part 9: Troubleshooting

### Issue: Site not accessible

```bash
# Check nginx status
sudo systemctl status nginx

# Check nginx configuration
sudo nginx -t

# View nginx error log
sudo tail -f /var/log/nginx/error.log
```

### Issue: Watcher not rebuilding

```bash
# Check watcher status
sudo systemctl status public-presence-watcher

# View watcher logs
sudo journalctl -u public-presence-watcher -n 100

# Restart watcher
sudo systemctl restart public-presence-watcher
```

### Issue: Build fails

```bash
# Clear node_modules and reinstall
cd /home/pi/public-presence
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Issue: Port 80 in use

```bash
# Check what's using port 80
sudo lsof -i :80

# Stop the service if needed
sudo systemctl stop [service-name]
```

## Part 10: Performance Optimization

### 10.1 Enable nginx Caching

Add to nginx config:

```nginx
# Cache path
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=100m inactive=60m use_temp_path=off;
```

### 10.2 Monitor Performance

```bash
# Install htop for better process monitoring
sudo apt install htop

# Run htop
htop
```

### 10.3 Reduce Memory Usage

If your Pi is running low on resources:

1. Increase swap size
2. Disable unused services
3. Consider moving watcher to run less frequently

## Summary Checklist

- [ ] System updated
- [ ] Node.js and nginx installed
- [ ] Project deployed and built
- [ ] nginx configured and serving site
- [ ] File watcher service running
- [ ] SSL certificate installed (optional but recommended)
- [ ] Deployment script created
- [ ] Backups configured
- [ ] Monitoring set up

## Additional Resources

- nginx documentation: https://nginx.org/en/docs/
- Certbot documentation: https://certbot.eff.org/
- systemd documentation: https://systemd.io/

---

Questions or issues? Check the main README or create an issue in the repository.
