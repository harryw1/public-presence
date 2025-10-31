# Integration Guide for Existing publicpresence.org Setup

## Overview

You already have infrastructure in place for publicpresence.org. This guide shows how to integrate the new blog application with your existing setup.

## Your Current Setup (Detected)

Based on your `deploy.sh` script:

- **Project Directory:** `$HOME/publicpresence` (likely `/home/pi/publicpresence`)
- **Web Root:** `/var/www/publicpresence/public`
- **Backup Location:** `/var/www/publicpresence/backups`
- **Build Output:** `build/` directory
- **Web Server:** nginx with www-data user

## Key Changes Made

I've updated the blog application to match your infrastructure:

1. **Build Directory:** Changed from `dist/` to `build/` in `vite.config.js`
2. **Deploy Script:** Created `deploy.sh` that matches your existing pattern
3. **File Watcher:** Updated to run `./deploy.sh` instead of just `npm run build`

## Integration Steps

### Step 1: Transfer Files to Your Pi

```bash
# From your local machine, copy the archive
scp public-presence.tar.gz pi@YOUR_PI_IP:/home/pi/

# SSH into your Pi
ssh pi@YOUR_PI_IP
```

### Step 2: Extract to Your Project Directory

```bash
# If you already have /home/pi/publicpresence, back it up first
cd /home/pi
mv publicpresence publicpresence-backup-$(date +%Y%m%d)

# Extract the new blog application
tar -xzf public-presence.tar.gz
mv public-presence publicpresence

# Or if you want to keep your existing project and just add blog content:
# Extract to temporary location, then merge files
tar -xzf public-presence.tar.gz
# Then manually copy the files you need
```

### Step 3: Install Dependencies

```bash
cd /home/pi/publicpresence
npm install
```

### Step 4: Test Build Locally

```bash
# Run a test build
npm run build

# Verify build/ directory was created
ls -la build/

# You should see index.html and assets/
```

### Step 5: Deploy Using Your Script

```bash
# Make deploy script executable (if not already)
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

This will:
- Install dependencies
- Run prebuild (generate RSS)
- Build the React app to `build/`
- Backup current site
- Deploy to `/var/www/publicpresence/public`
- Reload nginx

### Step 6: Verify Deployment

```bash
# Check if files were deployed
ls -la /var/www/publicpresence/public/

# Test locally
curl -I http://localhost

# Test remotely
curl -I https://publicpresence.org
```

Visit https://publicpresence.org in your browser.

## Setting Up the File Watcher

The file watcher monitors `content/posts/` and automatically runs `./deploy.sh` when posts change.

### Create Systemd Service

```bash
sudo nano /etc/systemd/system/publicpresence-watcher.service
```

Add this configuration:

```ini
[Unit]
Description=Public Presence Blog File Watcher
Documentation=https://publicpresence.org
After=network.target

[Service]
Type=simple
User=pi
Group=pi
WorkingDirectory=/home/pi/publicpresence
ExecStart=/usr/bin/node /home/pi/publicpresence/scripts/watcher.js
Restart=always
RestartSec=10

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=publicpresence-watcher

# Security
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

### Enable and Start Service

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service (starts on boot)
sudo systemctl enable publicpresence-watcher

# Start service now
sudo systemctl start publicpresence-watcher

# Check status
sudo systemctl status publicpresence-watcher
```

### Monitor Watcher Logs

```bash
# View recent logs
sudo journalctl -u publicpresence-watcher -n 50

# Follow logs in real-time
sudo journalctl -u publicpresence-watcher -f
```

## Nginx Configuration

Your nginx config should already be set up. Verify it has these settings for proper routing:

```nginx
server {
    listen 80;
    server_name publicpresence.org www.publicpresence.org;
    
    root /var/www/publicpresence/public;
    index index.html;
    
    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/javascript application/xml+rss application/json;
    
    location / {
        # This is CRITICAL for React Router to work
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # RSS feed
    location = /rss.xml {
        add_header Content-Type application/rss+xml;
    }
}
```

The critical part is `try_files $uri $uri/ /index.html;` which enables client-side routing.

## Writing Your First Post

```bash
# SSH into your Pi
ssh pi@YOUR_PI_IP

# Navigate to project
cd /home/pi/publicpresence

# Create a new post
nano content/posts/my-first-post.md
```

Add content:

```markdown
---
title: "My First Blog Post"
date: "2025-01-30"
excerpt: "Getting started with my new blog"
tags: ["introduction", "sustainability"]
author: "Public Presence"
---

# My First Blog Post

Welcome to my blog!

## About This Site

This is where I'll share insights about sustainability...
```

Save the file. The watcher will detect it and automatically:
1. Run `./deploy.sh`
2. Rebuild the site
3. Deploy to nginx
4. Your post appears live!

Check logs: `sudo journalctl -u publicpresence-watcher -f`

## Directory Structure on Your Pi

```
/home/pi/publicpresence/
├── content/
│   └── posts/              # Your blog posts
├── scripts/
│   ├── prebuild.js         # RSS generation
│   └── watcher.js          # File watcher
├── src/                    # React application code
├── public/                 # Static assets
├── build/                  # Build output (generated)
├── deploy.sh               # Deployment script
└── package.json

/var/www/publicpresence/
├── public/                 # Nginx serves from here
│   └── (built files)
└── backups/                # Automatic backups
    └── backup_*.tar.gz
```

## Workflow

### Adding New Posts

**Option 1: Direct on Pi** (Fastest)
```bash
ssh pi@YOUR_PI_IP
cd /home/pi/publicpresence
nano content/posts/new-post.md
# Save and exit - watcher auto-deploys
```

**Option 2: Git Workflow** (Recommended long-term)
```bash
# On your local machine
cd publicpresence
nano content/posts/new-post.md
git add content/posts/new-post.md
git commit -m "Add new post"
git push

# On your Pi
ssh pi@YOUR_PI_IP
cd /home/pi/publicpresence
git pull
# Watcher auto-deploys
```

### Manual Deployment

If you need to deploy manually:

```bash
cd /home/pi/publicpresence
./deploy.sh
```

### Checking Deployment Status

```bash
# Check watcher service
sudo systemctl status publicpresence-watcher

# Check nginx
sudo systemctl status nginx

# View watcher logs
sudo journalctl -u publicpresence-watcher -n 20

# View nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Troubleshooting

### Build Fails

```bash
cd /home/pi/publicpresence
rm -rf node_modules package-lock.json
npm install
./deploy.sh
```

### Watcher Not Deploying

```bash
# Check service status
sudo systemctl status publicpresence-watcher

# Restart service
sudo systemctl restart publicpresence-watcher

# Check logs for errors
sudo journalctl -u publicpresence-watcher -n 100
```

### Permission Issues

```bash
# Ensure deploy script is executable
chmod +x /home/pi/publicpresence/deploy.sh

# Check web root permissions
sudo ls -la /var/www/publicpresence/public/

# If needed, fix permissions
sudo chown -R www-data:www-data /var/www/publicpresence/public/
sudo chmod -R 755 /var/www/publicpresence/public/
```

### Site Not Updating

```bash
# Clear browser cache (Ctrl+Shift+R)

# Force rebuild and deploy
cd /home/pi/publicpresence
rm -rf build/
./deploy.sh

# Check if new files are in web root
ls -lt /var/www/publicpresence/public/ | head
```

## Backup Strategy

Your `deploy.sh` already creates backups in `/var/www/publicpresence/backups/` and keeps the last 5.

Additionally, backup your content:

```bash
# Create backup of posts
cd /home/pi/publicpresence
tar -czf ~/backups/posts-$(date +%Y%m%d).tar.gz content/posts/

# Or use git for version control (recommended)
git add content/posts/
git commit -m "Update posts"
git push
```

## Performance Tips

Your Pi is also running pi-hole, so keep these in mind:

1. **Watcher debounce:** Set to 5 seconds to avoid rebuild spam
2. **Build optimization:** Already configured in vite.config.js
3. **nginx caching:** Enable for static assets (already in config)
4. **Resource monitoring:** Use `htop` to watch resource usage

```bash
# Install htop if not available
sudo apt install htop

# Monitor resources
htop
```

## Next Steps

1. ✅ Transfer files to Pi
2. ✅ Extract and install dependencies
3. ✅ Run test deployment with `./deploy.sh`
4. ✅ Set up watcher service
5. ✅ Write your first post
6. ✅ Verify auto-deployment works
7. ✅ Set up git for version control (optional)
8. ✅ Add any custom content to About page

## Questions?

- Check the main **README.md** for full documentation
- Review **WRITING_GUIDE.md** for post creation tips
- All code has detailed comments explaining functionality

Your blog is now integrated with your existing infrastructure and ready to use!
