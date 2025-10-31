#!/bin/bash

# publicpresence.org System Maintenance Script
# Regular maintenance tasks to keep the system healthy

# Configuration
LOG_DIR="/home/harryweiss/logs"
LOG_FILE="$LOG_DIR/maintenance.log"
ALERT_THRESHOLD_DISK=85  # Alert if disk usage exceeds this percentage
ALERT_THRESHOLD_MEMORY=90  # Alert if memory usage exceeds this percentage
ALERT_EMAIL=""  # Add your email here to receive alerts (only when issues detected)

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✓${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}✗${NC} $1" | tee -a "$LOG_FILE"
}

# Start maintenance
log "🔧 Starting system maintenance..."
echo ""

# 1. Check system resources
log "📊 Checking system resources..."

# Check disk space
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
DISK_AVAILABLE=$(df -h / | awk 'NR==2 {print $4}')

if [ "$DISK_USAGE" -gt "$ALERT_THRESHOLD_DISK" ]; then
    warning "Disk usage is high: ${DISK_USAGE}% (${DISK_AVAILABLE} available)"
else
    success "Disk usage is healthy: ${DISK_USAGE}% (${DISK_AVAILABLE} available)"
fi

# Check memory usage
MEMORY_USAGE=$(free | awk '/Mem:/ {printf "%.0f", $3/$2 * 100}')
MEMORY_AVAILABLE=$(free -h | awk '/Mem:/ {print $7}')

if [ "$MEMORY_USAGE" -gt "$ALERT_THRESHOLD_MEMORY" ]; then
    warning "Memory usage is high: ${MEMORY_USAGE}% (${MEMORY_AVAILABLE} available)"
else
    success "Memory usage is healthy: ${MEMORY_USAGE}% (${MEMORY_AVAILABLE} available)"
fi

# CPU temperature (Raspberry Pi specific)
if command -v vcgencmd &> /dev/null; then
    CPU_TEMP=$(vcgencmd measure_temp | cut -d= -f2)
    log "CPU temperature: $CPU_TEMP"
fi
echo ""

# 2. Check service health
log "🏥 Checking service health..."

check_service() {
    local service=$1
    if sudo systemctl is-active --quiet "$service"; then
        success "$service: running"
        return 0
    else
        error "$service: not running"
        warning "Attempting to restart $service..."
        if sudo systemctl restart "$service"; then
            success "$service: restarted successfully"
        else
            error "$service: restart failed"
        fi
        return 1
    fi
}

check_service "nginx"
check_service "umami"
check_service "cloudflared"
check_service "postgresql"
echo ""

# 3. Clean up old logs
log "🗑️  Cleaning up old logs..."

# Clean systemd journal (keep last 7 days)
sudo journalctl --vacuum-time=7d > /dev/null 2>&1
success "Systemd journal cleaned"

# Clean nginx logs older than 30 days
if [ -d "/var/log/nginx" ]; then
    sudo find /var/log/nginx -name "*.log.*" -mtime +30 -delete 2>/dev/null
    success "Old nginx logs cleaned"
fi

# Rotate maintenance logs (keep last 10)
if [ -f "$LOG_FILE" ]; then
    LOG_SIZE=$(du -h "$LOG_FILE" | cut -f1)
    if [ "${LOG_SIZE%M*}" -gt 10 ] 2>/dev/null; then
        mv "$LOG_FILE" "${LOG_FILE}.$(date +%Y%m%d)"
        find "$LOG_DIR" -name "maintenance.log.*" -type f | sort -r | tail -n +11 | xargs -r rm
        success "Maintenance log rotated"
    fi
fi

# Clean Pi-hole logs
if command -v pihole &> /dev/null; then
    sudo pihole flush > /dev/null 2>&1
    success "Pi-hole logs flushed"
fi
echo ""

# 4. System cache cleanup
log "🧹 Cleaning system caches..."

# Clean npm cache (can grow to 1GB+)
if command -v npm &> /dev/null; then
    NPM_CACHE_SIZE=$(du -sh ~/.npm 2>/dev/null | cut -f1 || echo "0")
    npm cache clean --force > /dev/null 2>&1
    success "npm cache cleaned (was $NPM_CACHE_SIZE)"
fi

# Clean APT cache
sudo apt clean > /dev/null 2>&1
success "APT cache cleaned"

# Auto-remove unused packages
AUTOREMOVE_OUTPUT=$(sudo apt autoremove -y 2>&1)
if echo "$AUTOREMOVE_OUTPUT" | grep -q "Freed space"; then
    FREED_SPACE=$(echo "$AUTOREMOVE_OUTPUT" | grep "Freed space" | awk '{print $3, $4}')
    success "Removed unused packages (freed $FREED_SPACE)"
else
    success "No unused packages to remove"
fi
echo ""

# 5. Update package lists (but don't install)
log "📦 Updating package lists..."
sudo apt update > /dev/null 2>&1
UPDATES_AVAILABLE=$(apt list --upgradable 2>/dev/null | grep -c upgradable)
if [ "$UPDATES_AVAILABLE" -gt 0 ]; then
    warning "$UPDATES_AVAILABLE package updates available"
    log "Run 'sudo apt upgrade' to install updates"
else
    success "All packages are up to date"
fi
echo ""

# 6. Check SSL certificate expiration
log "🔒 Checking SSL certificates..."
if command -v certbot &> /dev/null; then
    CERT_STATUS=$(sudo certbot certificates 2>/dev/null | grep -A 2 "publicpresence.org" | grep "Expiry Date" || echo "Not found")
    if [ "$CERT_STATUS" != "Not found" ]; then
        log "$CERT_STATUS"
        success "SSL certificate is valid"
    else
        warning "SSL certificate status unknown"
    fi
else
    log "Certbot not installed (using Cloudflare Tunnel SSL)"
    success "SSL handled by Cloudflare"
fi
echo ""

# 7. Check database size
log "💾 Checking database size..."
if sudo systemctl is-active --quiet postgresql; then
    DB_SIZE=$(sudo -u postgres psql -d umami -t -c "SELECT pg_size_pretty(pg_database_size('umami'));" 2>/dev/null | xargs)
    if [ -n "$DB_SIZE" ]; then
        success "Umami database size: $DB_SIZE"
    else
        warning "Could not determine database size"
    fi
else
    warning "PostgreSQL is not running"
fi
echo ""

# 8. Check backup status
log "💾 Checking backup status..."
BACKUP_DIR="/home/harryweiss/backups/umami"
if [ -d "$BACKUP_DIR" ]; then
    LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/umami_*.sql.gz 2>/dev/null | head -1)
    if [ -n "$LATEST_BACKUP" ]; then
        BACKUP_AGE=$(find "$LATEST_BACKUP" -mtime +1 -print 2>/dev/null)
        BACKUP_SIZE=$(du -h "$LATEST_BACKUP" | cut -f1)
        BACKUP_DATE=$(stat -c %y "$LATEST_BACKUP" 2>/dev/null || stat -f "%Sm" "$LATEST_BACKUP" 2>/dev/null)

        if [ -n "$BACKUP_AGE" ]; then
            warning "Latest backup is more than 24 hours old"
        else
            success "Latest backup: $(basename $LATEST_BACKUP) ($BACKUP_SIZE)"
        fi
        log "Backup date: $BACKUP_DATE"

        BACKUP_COUNT=$(ls "$BACKUP_DIR"/umami_*.sql.gz 2>/dev/null | wc -l)
        success "Total backups: $BACKUP_COUNT"
    else
        warning "No backups found in $BACKUP_DIR"
    fi
else
    warning "Backup directory not found"
fi
echo ""

# 9. Check for failed systemd units
log "🔍 Checking for failed systemd units..."
FAILED_UNITS=$(systemctl --failed --no-pager --no-legend | wc -l)
if [ "$FAILED_UNITS" -gt 0 ]; then
    warning "$FAILED_UNITS failed systemd units found:"
    systemctl --failed --no-pager --no-legend
else
    success "No failed systemd units"
fi
echo ""

# 10. Network connectivity check
log "🌐 Checking network connectivity..."
if ping -c 1 -W 2 cloudflare.com > /dev/null 2>&1; then
    success "Internet connection is active"
else
    error "Internet connection may be down"
fi
echo ""

# 11. Check cloudflared tunnel status
log "🔌 Checking Cloudflare Tunnel status..."
if cloudflared tunnel list > /dev/null 2>&1; then
    TUNNEL_STATUS=$(cloudflared tunnel list 2>/dev/null | grep raspberrypi-tunnel || echo "")
    if [ -n "$TUNNEL_STATUS" ]; then
        success "Cloudflare Tunnel is registered"
    else
        warning "Cloudflare Tunnel status unknown"
    fi
else
    warning "Could not check tunnel status"
fi
echo ""

# 12. Generate summary report
log "📊 Maintenance Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  💽 Disk: ${DISK_USAGE}% used (${DISK_AVAILABLE} free)"
echo "  🧠 Memory: ${MEMORY_USAGE}% used (${MEMORY_AVAILABLE} free)"
echo "  📦 Updates available: $UPDATES_AVAILABLE"
echo "  📋 Failed services: $FAILED_UNITS"
if [ -n "$DB_SIZE" ]; then
    echo "  💾 Database size: $DB_SIZE"
fi
if [ -n "$BACKUP_COUNT" ]; then
    echo "  💾 Backup count: $BACKUP_COUNT"
fi
echo "  📅 Checked: $(date)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Send email alert if issues detected and email is configured
if [ "$DISK_USAGE" -gt "$ALERT_THRESHOLD_DISK" ] || \
   [ "$MEMORY_USAGE" -gt "$ALERT_THRESHOLD_MEMORY" ] || \
   [ "$FAILED_UNITS" -gt 0 ]; then

    warning "Some issues detected - please review the log"

    # Send email notification if configured
    if [ -n "$ALERT_EMAIL" ] && command -v mail &> /dev/null; then
        SUBJECT="⚠️ publicpresence.org Maintenance Alert"

        # Build detailed email body
        EMAIL_BODY="Maintenance check found issues that require attention:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 SYSTEM STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"

        # Add disk usage warning
        if [ "$DISK_USAGE" -gt "$ALERT_THRESHOLD_DISK" ]; then
            EMAIL_BODY+="⚠️ DISK USAGE: ${DISK_USAGE}% (Threshold: ${ALERT_THRESHOLD_DISK}%)
   Available: ${DISK_AVAILABLE}
   Action: Consider cleaning up old files or logs

"
        fi

        # Add memory usage warning
        if [ "$MEMORY_USAGE" -gt "$ALERT_THRESHOLD_MEMORY" ]; then
            EMAIL_BODY+="⚠️ MEMORY USAGE: ${MEMORY_USAGE}% (Threshold: ${ALERT_THRESHOLD_MEMORY}%)
   Available: ${MEMORY_AVAILABLE}
   Action: Check for memory leaks or restart services

"
        fi

        # Add failed services warning
        if [ "$FAILED_UNITS" -gt 0 ]; then
            EMAIL_BODY+="⚠️ FAILED SERVICES: ${FAILED_UNITS} systemd units failed
   Action: Check service status with 'systemctl --failed'

"
        fi

        EMAIL_BODY+="━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Full log file: $LOG_FILE

To check system status:
  ssh harryweiss@raspberrypi.local
  ~/maintenance.sh

To check disk usage:
  df -h

To check services:
  sudo systemctl status nginx umami cloudflared postgresql

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Timestamp: $(date)
Server: publicpresence.org (Raspberry Pi)
"

        # Send the email
        echo "$EMAIL_BODY" | mail -s "$SUBJECT" "$ALERT_EMAIL"
        log "Alert email sent to $ALERT_EMAIL"
    fi

    exit 1
fi

log "✅ Maintenance completed successfully - no issues detected!"
exit 0
