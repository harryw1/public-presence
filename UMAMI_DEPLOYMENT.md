# Umami Analytics Self-Hosting Guide

This guide walks you through setting up Umami analytics on your Raspberry Pi alongside your blog.

## Prerequisites

- Raspberry Pi with publicpresence.org already deployed
- SSH access to your Pi
- Subdomain for analytics (e.g., `analytics.publicpresence.org`)

## Part 1: Install PostgreSQL

### 1.1 Install PostgreSQL

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
```

### 1.2 Start PostgreSQL

```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 1.3 Create Database and User

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt, run:
CREATE DATABASE umami;
CREATE USER umami_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE umami TO umami_user;
\q
```

**Important:** Replace `your_secure_password_here` with a strong password. Save this password - you'll need it later.

## Part 2: Install Umami

### 2.1 Create Umami Directory

```bash
cd /home/pi
mkdir umami
cd umami
```

### 2.2 Clone Umami Repository

```bash
git clone https://github.com/umami-software/umami.git .
```

### 2.3 Install Dependencies

```bash
npm install
```

This may take 10-15 minutes on a Raspberry Pi.

### 2.4 Create Environment Configuration

```bash
nano .env
```

Add the following (replace with your actual password):

```env
DATABASE_URL=postgresql://umami_user:your_secure_password_here@localhost:5432/umami
DATABASE_TYPE=postgresql
APP_SECRET=$(openssl rand -hex 32)
```

To generate a secure APP_SECRET, run:
```bash
openssl rand -hex 32
```

Copy the output and replace the `$(openssl rand -hex 32)` part with the actual value.

Save and exit (Ctrl+X, Y, Enter).

### 2.5 Build Umami

```bash
npm run build
```

This will take several minutes on a Raspberry Pi.

### 2.6 Initialize Database

```bash
npm run db:init
```

This creates all necessary database tables and the default admin user.

## Part 3: Set Up Umami as a Service

### 3.1 Create Systemd Service

```bash
sudo nano /etc/systemd/system/umami.service
```

Add the following:

```ini
[Unit]
Description=Umami Analytics Server
Documentation=https://umami.is
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=pi
Group=pi
WorkingDirectory=/home/pi/umami
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

# Environment
Environment="NODE_ENV=production"
Environment="PORT=3000"

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=umami

# Security hardening
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

### 3.2 Enable and Start Service

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service (starts on boot)
sudo systemctl enable umami

# Start service now
sudo systemctl start umami

# Check status
sudo systemctl status umami
```

### 3.3 Verify Umami is Running

```bash
# Check if Umami is listening on port 3000
curl http://localhost:3000
```

You should see HTML output from Umami.

## Part 4: Configure nginx Reverse Proxy

### 4.1 Create nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/umami
```

Add the following:

```nginx
server {
    listen 80;
    server_name analytics.publicpresence.org;

    # Redirect to HTTPS (will be configured by Certbot)
    # location / {
    #     return 301 https://$host$request_uri;
    # }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### 4.2 Enable Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/umami /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### 4.3 Configure DNS

Before proceeding, add an A record for `analytics.publicpresence.org` pointing to your Pi's IP address.

### 4.4 Set Up SSL Certificate

```bash
sudo certbot --nginx -d analytics.publicpresence.org
```

Follow the prompts to obtain an SSL certificate.

## Part 5: Configure Umami

### 5.1 Access Umami Dashboard

Visit `https://analytics.publicpresence.org` in your browser.

### 5.2 Login with Default Credentials

- **Username:** `admin`
- **Password:** `umami`

**IMPORTANT:** Change this password immediately after logging in!

### 5.3 Change Admin Password

1. Click on your profile (top right)
2. Go to Profile Settings
3. Change your password
4. Update your username if desired

### 5.4 Add Your Website

1. Click "Settings" in the left sidebar
2. Click "Websites"
3. Click "Add website"
4. Enter:
   - **Name:** publicpresence.org
   - **Domain:** publicpresence.org
   - **Enable share URL:** Optional (allows you to share stats publicly)
5. Click "Save"

### 5.5 Get Tracking Code

After adding your website:
1. Click "Edit" on your website
2. Click "Tracking code"
3. Copy the tracking code - it will look like:

```html
<script async src="https://analytics.publicpresence.org/script.js" data-website-id="your-unique-id"></script>
```

**Save this code** - you'll need it for Part 6.

## Part 6: Integrate Tracking into Your Blog

### 6.1 Add Tracking Script to Your Site

On your **local machine** (not the Pi), edit your `index.html`:

```bash
nano index.html
```

Add the Umami tracking script in the `<head>` section:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>publicpresence.org</title>

    <!-- Umami Analytics -->
    <script async src="https://analytics.publicpresence.org/script.js" data-website-id="your-unique-id"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

Replace `your-unique-id` with the actual ID from step 5.5.

### 6.2 Build and Deploy

```bash
# On local machine
npm run build

# Transfer to Pi (or use git)
# If using git:
git add .
git commit -m "Add Umami analytics tracking"
git push

# Then on Pi:
cd /home/pi/public-presence
git pull
npm run build
```

Or use your update script:
```bash
./update-blog.sh
```

### 6.3 Verify Tracking

1. Visit your blog: `https://publicpresence.org`
2. Open your browser's developer tools (F12)
3. Check the Network tab for a request to `https://analytics.publicpresence.org/script.js`
4. Go to your Umami dashboard
5. You should see your visit recorded (may take a few seconds)

## Part 7: Maintenance

### 7.1 Update Umami

```bash
cd /home/pi/umami
git pull
npm install
npm run build
sudo systemctl restart umami
```

### 7.2 Backup Database

```bash
# Create backup script
nano ~/backup-umami.sh
```

Add:

```bash
#!/bin/bash

BACKUP_DIR="/home/pi/backups/umami"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

sudo -u postgres pg_dump umami > $BACKUP_DIR/umami_$DATE.sql

# Keep only last 7 backups
ls -t $BACKUP_DIR/umami_*.sql | tail -n +8 | xargs -r rm

echo "Backup completed: $BACKUP_DIR/umami_$DATE.sql"
```

Make executable:
```bash
chmod +x ~/backup-umami.sh
```

### 7.3 Restore Database

```bash
# If needed, restore from backup
sudo -u postgres psql umami < /home/pi/backups/umami/umami_YYYYMMDD_HHMMSS.sql
```

### 7.4 View Logs

```bash
# Umami service logs
sudo journalctl -u umami -f

# nginx access logs
sudo tail -f /var/log/nginx/access.log

# nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### 7.5 Monitor Resources

```bash
# Check if Umami is running
sudo systemctl status umami

# Check PostgreSQL
sudo systemctl status postgresql

# Check disk usage
df -h

# Check memory usage
free -h
```

## Part 8: Troubleshooting

### Issue: Umami won't start

```bash
# Check logs
sudo journalctl -u umami -n 50

# Check if port 3000 is already in use
sudo lsof -i :3000

# Restart service
sudo systemctl restart umami
```

### Issue: Can't access dashboard

```bash
# Check nginx is running
sudo systemctl status nginx

# Test proxy
curl http://localhost:3000

# Check nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Issue: Tracking not working

1. Check browser console for errors
2. Verify tracking script URL is correct
3. Check Content Security Policy (CSP) isn't blocking the script
4. Verify website ID matches your Umami dashboard
5. Try in incognito mode (extensions can block trackers)

### Issue: Database connection errors

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Verify connection
psql -U umami_user -d umami -h localhost
```

## Part 9: Security Best Practices

### 9.1 Firewall Configuration

```bash
# If using ufw
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 9.2 Regular Updates

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Update Umami (monthly recommended)
cd /home/pi/umami
git pull
npm install
npm run build
sudo systemctl restart umami
```

### 9.3 Database Security

- Use strong passwords
- Keep PostgreSQL updated
- Regular backups
- Don't expose PostgreSQL port externally

## Summary

You now have:
- ✅ Self-hosted Umami analytics on your Raspberry Pi
- ✅ HTTPS-secured dashboard at `analytics.publicpresence.org`
- ✅ Privacy-respecting visitor tracking on your blog
- ✅ Complete data ownership
- ✅ Zero ongoing costs

## Features You Can Use

- Real-time visitor tracking
- Page views and unique visitors
- Traffic sources (referrers)
- Geographic data (country-level)
- Device, browser, and OS stats
- Custom events (with additional code)
- Share public dashboards (optional)

## Next Steps

1. Explore the Umami dashboard
2. Set up custom events for newsletter signups
3. Create data retention policies
4. Set up automated backups
5. Consider IP anonymization settings

## Resources

- Umami documentation: https://umami.is/docs
- GitHub repository: https://github.com/umami-software/umami
- Community support: https://github.com/umami-software/umami/discussions

---

Questions or issues? The Umami community is very active and helpful!
