# Email Notification Setup Guide

This guide shows you how to set up email notifications for your Raspberry Pi, specifically for post-reboot health checks and other alerts.

## Option 1: Gmail with msmtp (Recommended)

### Step 1: Install Required Packages

```bash
sudo apt update
sudo apt install msmtp msmtp-mta mailutils
```

### Step 2: Create Gmail App Password

Since Gmail requires 2FA, you need an App Password:

1. Go to https://myaccount.google.com/apppasswords
2. Sign in to your Google account
3. Select **Mail** and **Other (Custom name)**
4. Name it: "Raspberry Pi"
5. Click **Generate**
6. Copy the 16-character password (you'll need it in the next step)

### Step 3: Configure msmtp

```bash
nano ~/.msmtprc
```

Add this configuration (replace with your details):

```conf
# Set default values for all accounts
defaults
auth           on
tls            on
tls_trust_file /etc/ssl/certs/ca-certificates.crt
logfile        ~/.msmtp.log

# Gmail account
account        gmail
host           smtp.gmail.com
port           587
from           your-email@gmail.com
user           your-email@gmail.com
password       your-16-char-app-password

# Set default account
account default : gmail
```

**Important:** Replace:
- `your-email@gmail.com` with your actual Gmail address
- `your-16-char-app-password` with the App Password from Step 2

Save and exit (Ctrl+X, Y, Enter).

### Step 4: Secure the Configuration File

```bash
chmod 600 ~/.msmtprc
```

### Step 5: Test Email

```bash
echo "Test email from Raspberry Pi" | mail -s "Test Subject" your-email@gmail.com
```

Check your inbox! You should receive the test email within a minute.

If it fails, check the log:
```bash
cat ~/.msmtp.log
```

## Option 2: Other Email Providers

### Outlook/Hotmail

```conf
account        outlook
host           smtp-mail.outlook.com
port           587
from           your-email@outlook.com
user           your-email@outlook.com
password       your-password
```

### Custom SMTP Server

```conf
account        custom
host           smtp.yourdomain.com
port           587  # or 465 for SSL
from           alerts@yourdomain.com
user           your-username
password       your-password
```

## Step 6: Update Post-Reboot Script

Edit your post-reboot script to add your email:

```bash
nano ~/post-reboot-check.sh
```

Find this line near the top:
```bash
ALERT_EMAIL=""  # Optional: Add your email for alerts
```

Change it to:
```bash
ALERT_EMAIL="your-email@gmail.com"
```

Save and exit.

## Step 7: Update Other Scripts (Optional)

You can add email alerts to your other scripts too!

### Maintenance Script

```bash
nano ~/maintenance.sh
```

Add near the top:
```bash
ALERT_EMAIL="your-email@gmail.com"
```

Add before the final exit:
```bash
# Send email if issues detected
if [ "$DISK_USAGE" -gt "$ALERT_THRESHOLD_DISK" ] || \
   [ "$MEMORY_USAGE" -gt "$ALERT_THRESHOLD_MEMORY" ] || \
   [ "$FAILED_UNITS" -gt 0 ]; then

    SUBJECT="⚠️ publicpresence.org Maintenance Alert"
    BODY="Maintenance check found issues:

Disk Usage: ${DISK_USAGE}% (Threshold: ${ALERT_THRESHOLD_DISK}%)
Memory Usage: ${MEMORY_USAGE}% (Threshold: ${ALERT_THRESHOLD_MEMORY}%)
Failed Services: ${FAILED_UNITS}

Check the log for details: $LOG_FILE

Timestamp: $(date)"

    echo "$BODY" | mail -s "$SUBJECT" "$ALERT_EMAIL"
fi
```

### Backup Script

```bash
nano ~/backup-umami.sh
```

Add email notification on backup failure:

```bash
# Add near the top
ALERT_EMAIL="your-email@gmail.com"

# Modify the backup failure section
else
    log "✗ Backup failed!"
    if [ -n "$ALERT_EMAIL" ]; then
        echo "Umami database backup failed at $(date). Check logs: $LOG_FILE" | \
            mail -s "❌ publicpresence.org Backup Failed" "$ALERT_EMAIL"
    fi
    exit 1
fi
```

## Email Notification Types

With this setup, you'll receive emails for:

### Post-Reboot (Always)
- ✅ Summary of all services after reboot
- ⚠️ Alert if any services failed to start

### Maintenance (Only if issues detected)
- ⚠️ Disk usage above 85%
- ⚠️ Memory usage above 90%
- ⚠️ Failed systemd units

### Backup (Only on failure)
- ❌ Database backup failed

## Customizing Email Content

### Change Email Subject

In any script, find the `mail -s` command:
```bash
mail -s "Your Custom Subject" "$ALERT_EMAIL"
```

### Add More Details

Use variables in your email body:
```bash
BODY="Detailed report:
- CPU Temp: $CPU_TEMP
- Uptime: $(uptime -p)
- Services: OK"

echo "$BODY" | mail -s "Subject" "$ALERT_EMAIL"
```

### Send HTML Emails

```bash
echo "Content-Type: text/html

<html>
<body>
<h1>System Alert</h1>
<p>Disk usage: <strong>${DISK_USAGE}%</strong></p>
</body>
</html>" | mail -s "Alert" "$ALERT_EMAIL"
```

## Testing Your Setup

### Test Post-Reboot Email

```bash
# Run the script manually
~/post-reboot-check.sh
```

You should receive an email with the health check summary.

### Test Maintenance Email

Temporarily lower the alert thresholds to trigger an alert:

```bash
# Edit maintenance.sh
nano ~/maintenance.sh

# Change these lines:
ALERT_THRESHOLD_DISK=1   # Will definitely trigger
ALERT_THRESHOLD_MEMORY=1  # Will definitely trigger

# Run it
~/maintenance.sh

# Change them back afterwards!
```

### Schedule a Test Reboot

```bash
# Reboot in 2 minutes (gives you time to cancel)
sudo shutdown -r +2

# Cancel if needed
sudo shutdown -c
```

After reboot, you should receive an email within 3-4 minutes.

## Troubleshooting

### Email Not Sending

1. **Check msmtp log:**
   ```bash
   cat ~/.msmtp.log
   ```

2. **Test msmtp directly:**
   ```bash
   echo "Test" | msmtp your-email@gmail.com
   ```

3. **Verify credentials:**
   ```bash
   # Try to authenticate
   msmtp --host=smtp.gmail.com --serverinfo
   ```

### Gmail Blocking Sign-In

- Make sure you're using an **App Password**, not your regular password
- Check if "Less secure app access" needs to be enabled (though App Passwords should work)
- Verify 2FA is enabled on your Google account

### Permission Errors

```bash
# Fix msmtprc permissions
chmod 600 ~/.msmtprc

# Check file ownership
ls -l ~/.msmtprc
```

### Emails Going to Spam

- Check your spam folder
- Add your Pi's email to your contacts
- Set up SPF/DKIM (advanced, requires domain configuration)

## Security Best Practices

1. **Never commit msmtprc to git:**
   ```bash
   # Add to .gitignore
   echo ".msmtprc" >> ~/.gitignore
   ```

2. **Use App Passwords** instead of real passwords

3. **Restrict file permissions:**
   ```bash
   chmod 600 ~/.msmtprc
   ```

4. **Regular password rotation:**
   - Regenerate App Password every 6-12 months
   - Update in ~/.msmtprc

5. **Consider using a dedicated email:**
   - Create a separate Gmail account just for server alerts
   - Forward important emails to your main account

## Advanced: Email Aggregation

If you get too many emails, set up daily summaries:

```bash
# Create summary script
nano ~/daily-summary.sh
```

```bash
#!/bin/bash

SUMMARY="/home/harryweiss/logs/daily-summary-$(date +%Y%m%d).txt"

{
    echo "=== Daily Summary for $(date +%Y-%m-%d) ==="
    echo ""
    echo "=== Service Status ==="
    for service in nginx umami cloudflared postgresql; do
        sudo systemctl status $service --no-pager | head -3
    done
    echo ""
    echo "=== Disk Usage ==="
    df -h / | tail -1
    echo ""
    echo "=== Recent Backups ==="
    ls -lh ~/backups/umami/ | tail -5
    echo ""
    echo "=== Recent Errors ==="
    sudo journalctl --since "24 hours ago" -p err | tail -10
} > "$SUMMARY"

mail -s "Daily Summary: publicpresence.org" your-email@gmail.com < "$SUMMARY"
```

Add to crontab:
```cron
# Daily summary at 8 AM
0 8 * * * /home/harryweiss/daily-summary.sh
```

## Summary

✅ **Email notifications configured** with msmtp
✅ **Post-reboot alerts** sent automatically
✅ **Maintenance alerts** for critical issues
✅ **Backup failure notifications**
✅ **Secure configuration** with App Passwords

Your Raspberry Pi can now keep you informed of important events via email!
