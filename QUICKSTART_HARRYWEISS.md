# Quick Start for Your Setup

## Your Paths

- **Username**: `harryweiss`
- **Project location**: `/home/harryweiss/publicpresence`
- **Web root**: `/var/www/publicpresence/public`
- **Backups**: `/var/www/publicpresence/backups`

## Transfer Files to Your Pi

```bash
# From your local machine
scp public-presence.tar.gz harryweiss@YOUR_PI_IP:/home/harryweiss/
```

## Extract and Setup

```bash
# SSH into your Pi
ssh harryweiss@YOUR_PI_IP

# Navigate to home directory
cd /home/harryweiss

# Backup existing if needed
mv publicpresence publicpresence-backup-$(date +%Y%m%d)

# Extract new files
tar -xzf public-presence.tar.gz
mv public-presence publicpresence

# Navigate to project
cd publicpresence

# Install dependencies
npm install
```

## Test Build

```bash
# Run a test build
npm run build

# Verify build directory
ls -la build/
```

## Deploy

```bash
# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

## Run Diagnostic

```bash
# Make diagnostic script executable
chmod +x diagnose.sh

# Run diagnostics
./diagnose.sh
```

## Setup File Watcher Service

```bash
# Copy systemd service file
sudo cp publicpresence-watcher.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable and start service
sudo systemctl enable publicpresence-watcher
sudo systemctl start publicpresence-watcher

# Check status
sudo systemctl status publicpresence-watcher
```

## Monitor Watcher

```bash
# View logs
sudo journalctl -u publicpresence-watcher -f
```

## Add New Posts

```bash
# Create new post
cd /home/harryweiss/publicpresence
nano content/posts/my-new-post.md

# Add frontmatter and content
# Save and exit
# Watcher automatically deploys!
```

## Check if Site is Working

```bash
# Test locally
curl -I http://localhost

# Check browser console (F12) for errors
# Hard refresh: Ctrl+Shift+R
```

## Troubleshooting

If you see a blank page:

1. **Run diagnostic script**:
   ```bash
   cd /home/harryweiss/publicpresence
   ./diagnose.sh
   ```

2. **Check nginx config** has this line:
   ```bash
   sudo cat /etc/nginx/sites-enabled/public-presence | grep try_files
   ```
   
   Should show: `try_files $uri $uri/ /index.html;`

3. **Check browser console** (F12 → Console tab) for JavaScript errors

4. **Hard refresh** browser: Ctrl+Shift+R

See **QUICK_FIX_BLANK_PAGE.md** for detailed troubleshooting.

## Key Commands

```bash
# Deploy manually
cd /home/harryweiss/publicpresence && ./deploy.sh

# Check watcher status
sudo systemctl status publicpresence-watcher

# View watcher logs
sudo journalctl -u publicpresence-watcher -f

# Restart watcher
sudo systemctl restart publicpresence-watcher

# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Check files deployed
ls -la /var/www/publicpresence/public/

# Run diagnostics
cd /home/harryweiss/publicpresence && ./diagnose.sh
```

## Common Issues

### Blank Page
→ See QUICK_FIX_BLANK_PAGE.md
→ Run `./diagnose.sh`
→ Most likely: missing `try_files` in nginx config

### Permission Denied
```bash
# Fix deploy script
chmod +x /home/harryweiss/publicpresence/deploy.sh

# Fix web root permissions
sudo chown -R www-data:www-data /var/www/publicpresence/public/
```

### Watcher Not Working
```bash
# Check status
sudo systemctl status publicpresence-watcher

# View errors
sudo journalctl -u publicpresence-watcher -n 50

# Restart
sudo systemctl restart publicpresence-watcher
```

### Build Fails
```bash
cd /home/harryweiss/publicpresence
rm -rf node_modules package-lock.json build/
npm install
npm run build
```

---

**All set!** Your paths are configured correctly. The deploy script uses `$HOME` so it will automatically work with `/home/harryweiss/publicpresence`.
