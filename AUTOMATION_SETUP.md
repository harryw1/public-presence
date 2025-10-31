# Automation Setup Guide

This guide covers setting up automated maintenance and deployment tasks for publicpresence.org.

## Overview

Three main scripts handle automation:
1. **`update-blog.sh`** - Comprehensive deployment script
2. **`backup-umami.sh`** - Database backup automation
3. **`maintenance.sh`** - System health checks and maintenance

## Part 1: Deploy Scripts to Raspberry Pi

### 1.1 Push Scripts to Repository

On your **local machine**:

```bash
cd /Users/harryweiss/Documents/publicpresence

# Add all scripts
git add update-blog.sh backup-umami.sh maintenance.sh AUTOMATION_SETUP.md
git commit -m "Add comprehensive automation scripts"
git push
```

### 1.2 Pull and Setup on Raspberry Pi

On your **Raspberry Pi**:

```bash
cd ~/publicpresence
git pull

# Copy scripts to home directory
cp update-blog.sh ~/update-blog.sh
cp backup-umami.sh ~/backup-umami.sh
cp maintenance.sh ~/maintenance.sh

# Make scripts executable
chmod +x ~/update-blog.sh
chmod +x ~/backup-umami.sh
chmod +x ~/maintenance.sh

# Create logs directory
mkdir -p ~/logs
```

## Part 2: Test Scripts

### 2.1 Test Deployment Script

```bash
~/update-blog.sh
```

This should:
- ✓ Pull latest changes from git
- ✓ Install dependencies
- ✓ Build the site
- ✓ Deploy to /var/www/publicpresence/public
- ✓ Reload nginx
- ✓ Check service health
- ✓ Backup database
- ✓ Show deployment summary

### 2.2 Test Backup Script

```bash
~/backup-umami.sh
```

Check the backup was created:

```bash
ls -lh ~/backups/umami/
cat ~/backups/umami/backup.log
```

### 2.3 Test Maintenance Script

```bash
~/maintenance.sh
```

This should:
- ✓ Check disk space and memory
- ✓ Verify all services are running
- ✓ Clean old logs
- ✓ Check for system updates
- ✓ Verify SSL certificates
- ✓ Check database size
- ✓ Verify backups are current
- ✓ Generate summary report

View the maintenance log:

```bash
cat ~/logs/maintenance.log
```

## Part 3: Set Up Automated Tasks with Cron

### 3.1 Open Crontab Editor

```bash
crontab -e
```

If prompted, select your preferred editor (nano is easiest for beginners).

### 3.2 Add Automated Tasks

Add these lines to your crontab:

```cron
# Umami database backup - Daily at 3:00 AM
0 3 * * * /home/harryweiss/backup-umami.sh >> /home/harryweiss/logs/backup-cron.log 2>&1

# System maintenance - Daily at 4:00 AM
0 4 * * * /home/harryweiss/maintenance.sh >> /home/harryweiss/logs/maintenance-cron.log 2>&1

# Weekly system updates check - Sunday at 5:00 AM
0 5 * * 0 sudo apt update && sudo apt list --upgradable >> /home/harryweiss/logs/updates.log 2>&1
```

Save and exit:
- **nano**: Ctrl+X, then Y, then Enter
- **vim**: Press Esc, type `:wq`, press Enter

### 3.3 Verify Cron Jobs

```bash
crontab -l
```

You should see your three scheduled tasks.

### 3.4 Monitor Cron Execution

Check system cron logs:

```bash
# View cron activity
sudo journalctl -u cron -n 50

# Or check syslog
sudo tail -f /var/log/syslog | grep CRON
```

## Part 4: Scheduled Task Overview

### Daily Tasks

| Time | Task | Script | Purpose |
|------|------|--------|---------|
| 3:00 AM | Database Backup | `backup-umami.sh` | Backup Umami analytics database |
| 4:00 AM | System Maintenance | `maintenance.sh` | Health checks and cleanup |

### Weekly Tasks

| Day | Time | Task | Purpose |
|-----|------|------|---------|
| Sunday | 5:00 AM | Update Check | Check for available system updates |

### Manual Tasks

| Task | Command | When to Use |
|------|---------|-------------|
| Deploy Site | `~/update-blog.sh` | After pushing changes |
| Manual Backup | `~/backup-umami.sh` | Before major changes |
| Health Check | `~/maintenance.sh` | Troubleshooting |

## Part 5: Monitoring and Logs

### 5.1 View Logs

```bash
# Deployment logs
cat ~/logs/deployment.log

# Backup logs
cat ~/backups/umami/backup.log

# Maintenance logs
cat ~/logs/maintenance.log

# Cron job outputs
cat ~/logs/backup-cron.log
cat ~/logs/maintenance-cron.log
```

### 5.2 Real-Time Monitoring

```bash
# Follow maintenance log in real-time
tail -f ~/logs/maintenance.log

# Follow backup log in real-time
tail -f ~/backups/umami/backup.log

# Monitor cron execution
sudo journalctl -u cron -f
```

### 5.3 Check Service Status

```bash
# All services at once
for service in nginx umami cloudflared postgresql; do
    echo "=== $service ==="
    sudo systemctl status $service --no-pager | head -3
    echo ""
done
```

## Part 6: Optional Enhancements

### 6.1 Email Notifications (Optional)

If you want email alerts when maintenance detects issues:

```bash
# Install mail utility
sudo apt install mailutils

# Test email
echo "Test from Raspberry Pi" | mail -s "Test Email" your@email.com
```

Then modify `maintenance.sh` to send email on errors:

```bash
# Add at the end of maintenance.sh (before exit 1)
if [ "$DISK_USAGE" -gt "$ALERT_THRESHOLD_DISK" ]; then
    echo "Disk usage is high: ${DISK_USAGE}%" | mail -s "publicpresence.org Alert" your@email.com
fi
```

### 6.2 Auto-Deploy on Git Push (Advanced)

Set up a webhook listener to automatically deploy when you push to GitHub:

```bash
# Install webhook listener
sudo apt install webhook

# Configure webhook endpoint
sudo nano /etc/webhook.conf
```

Add:

```json
[
  {
    "id": "deploy-blog",
    "execute-command": "/home/harryweiss/update-blog.sh",
    "command-working-directory": "/home/harryweiss/publicpresence",
    "pass-arguments-to-command": [],
    "trigger-rule": {
      "match": {
        "type": "payload-hash-sha1",
        "secret": "your-secret-key",
        "parameter": {
          "source": "header",
          "name": "X-Hub-Signature"
        }
      }
    }
  }
]
```

### 6.3 Monitoring Dashboard (Optional)

Consider installing monitoring tools:

```bash
# Netdata - Real-time performance monitoring
bash <(curl -Ss https://my-netdata.io/kickstart.sh)
```

Access at `http://your-pi-ip:19999`

## Part 7: Troubleshooting

### Scripts Not Running from Cron

**Problem:** Cron jobs don't execute

**Solution:**

```bash
# Check cron service is running
sudo systemctl status cron

# Check cron has permission to execute scripts
ls -l ~/update-blog.sh ~/backup-umami.sh ~/maintenance.sh

# Verify paths in crontab are absolute
crontab -l
```

### Script Fails with Permission Errors

**Problem:** Scripts fail when run by cron

**Solution:**

```bash
# Ensure scripts use absolute paths
# Use full paths like /home/harryweiss/... instead of ~/...

# For sudo commands in cron, configure passwordless sudo:
sudo visudo

# Add this line:
harryweiss ALL=(ALL) NOPASSWD: /usr/sbin/nginx, /bin/systemctl, /usr/bin/apt
```

### Disk Space Issues

**Problem:** Backups filling up disk

**Solution:**

```bash
# Check backup sizes
du -sh ~/backups/umami/*

# Adjust retention in backup-umami.sh
nano ~/backup-umami.sh
# Change: RETENTION_DAYS=30 to RETENTION_DAYS=7

# Manually clean old backups
find ~/backups/umami/ -name "umami_*.sql.gz" -mtime +7 -delete
```

### Services Not Restarting

**Problem:** Maintenance script can't restart services

**Solution:**

```bash
# Check service status manually
sudo systemctl status nginx
sudo systemctl status umami

# Check service logs
sudo journalctl -u nginx -n 50
sudo journalctl -u umami -n 50

# Restart manually
sudo systemctl restart nginx
sudo systemctl restart umami
```

## Part 8: Best Practices

### Before Major Changes

1. Run manual backup: `~/backup-umami.sh`
2. Run health check: `~/maintenance.sh`
3. Note current disk space: `df -h`

### After Deployment

1. Check site is accessible: `curl -I https://publicpresence.org`
2. Check analytics work: Visit site and check Umami dashboard
3. Review deployment log for errors

### Regular Maintenance (Monthly)

```bash
# System updates
sudo apt update && sudo apt upgrade

# Check disk usage trends
df -h
du -sh ~/backups ~/logs

# Review and clean old logs
ls -lh ~/logs/
```

### Security Updates (As Needed)

```bash
# Update Umami
cd ~/umami
git pull
npm install --legacy-peer-deps
npm run build
sudo systemctl restart umami

# Update Node.js (if needed)
# Follow official Node.js update instructions
```

## Part 9: Quick Reference

### Common Commands

```bash
# Deploy site updates
~/update-blog.sh

# Manual backup
~/backup-umami.sh

# System health check
~/maintenance.sh

# View deployment status
cat ~/logs/deployment.log

# Check all services
sudo systemctl status nginx umami cloudflared postgresql

# View disk space
df -h

# View cron jobs
crontab -l

# Edit cron jobs
crontab -e
```

### Important Paths

```
Scripts:
  ~/update-blog.sh          - Deployment script
  ~/backup-umami.sh         - Backup script
  ~/maintenance.sh          - Maintenance script

Logs:
  ~/logs/                   - All log files
  ~/backups/umami/          - Database backups

Services:
  /etc/systemd/system/umami.service
  /etc/systemd/system/cloudflared.service
  /etc/nginx/sites-available/public-presence

Configs:
  /etc/cloudflared/config.yml
  ~/.cloudflared/
```

## Summary

✅ **Automated daily database backups** at 3 AM
✅ **Automated system maintenance** at 4 AM
✅ **Weekly update checks** on Sundays
✅ **Comprehensive deployment script** for manual updates
✅ **Detailed logging** for all operations
✅ **Health monitoring** for all services

Your blog is now fully automated with minimal manual intervention required!

---

**Questions?** Check the logs in `~/logs/` or run the maintenance script manually to diagnose issues.
