#!/bin/bash

# Post-Reboot Health Check Script
# Runs after system reboot to verify all services are operational

# Configuration
LOG_FILE="/home/harryweiss/logs/post-reboot.log"
ALERT_EMAIL=""  # Optional: Add your email for alerts

# Services to check
SERVICES=(
    "nginx"
    "umami"
    "cloudflared"
    "postgresql"
    "tailscaled"
    "pihole-FTL"
)

# Create log directory if needed
mkdir -p "$(dirname "$LOG_FILE")"

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

# Start health check
log "🔄 Post-Reboot Health Check Starting..."
echo ""

# Get boot time
BOOT_TIME=$(who -b | awk '{print $3, $4}')
log "System booted at: $BOOT_TIME"
echo ""

# Wait a bit for all services to initialize
log "Waiting 30 seconds for services to initialize..."
sleep 30
echo ""

# Check each service
log "🏥 Checking critical services..."
FAILED_SERVICES=()

for service in "${SERVICES[@]}"; do
    if sudo systemctl is-active --quiet "$service" 2>/dev/null; then
        success "$service: running"
    else
        error "$service: NOT RUNNING"
        FAILED_SERVICES+=("$service")

        # Attempt to start the service
        warning "Attempting to start $service..."
        if sudo systemctl start "$service" 2>/dev/null; then
            sleep 5
            if sudo systemctl is-active --quiet "$service"; then
                success "$service: started successfully"
            else
                error "$service: failed to start"
            fi
        else
            error "$service: could not start service"
        fi
    fi
done
echo ""

# Check network connectivity
log "🌐 Checking network connectivity..."
if ping -c 1 -W 5 cloudflare.com > /dev/null 2>&1; then
    success "Internet connection is active"
else
    error "Internet connection may be down"
    FAILED_SERVICES+=("network")
fi
echo ""

# Check website accessibility
log "🌐 Checking website accessibility..."
sleep 5  # Give nginx a moment
if curl -f -s -o /dev/null http://localhost:80; then
    success "Local website is accessible"
else
    warning "Local website may not be accessible yet"
fi

# Check Umami accessibility
if curl -f -s -o /dev/null http://localhost:3000; then
    success "Umami is accessible"
else
    warning "Umami may not be accessible yet"
fi
echo ""

# Check Cloudflare Tunnel
log "🔌 Checking Cloudflare Tunnel..."
if pgrep -f cloudflared > /dev/null; then
    success "Cloudflared process is running"

    # Wait a moment for tunnel to connect
    sleep 10

    # Check tunnel connections
    TUNNEL_CONNECTIONS=$(sudo journalctl -u cloudflared --since "5 minutes ago" | grep -c "Registered tunnel connection" || echo "0")
    if [ "$TUNNEL_CONNECTIONS" -gt 0 ]; then
        success "Cloudflare Tunnel has $TUNNEL_CONNECTIONS registered connections"
    else
        warning "Cloudflare Tunnel may still be connecting..."
    fi
else
    error "Cloudflared process not found"
fi
echo ""

# Check disk space
log "💽 Checking disk space..."
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
DISK_AVAILABLE=$(df -h / | awk 'NR==2 {print $4}')
if [ "$DISK_USAGE" -gt 85 ]; then
    warning "Disk usage is high: ${DISK_USAGE}% (${DISK_AVAILABLE} available)"
else
    success "Disk space healthy: ${DISK_USAGE}% used (${DISK_AVAILABLE} available)"
fi
echo ""

# Check if reboot was due to unattended-upgrades
log "📦 Checking reboot reason..."
if sudo journalctl -u unattended-upgrades --since "$BOOT_TIME" | grep -q "Rebooting"; then
    log "Reboot was triggered by unattended-upgrades (automatic security updates)"
else
    log "Reboot reason: manual or scheduled"
fi
echo ""

# Generate summary
log "📊 Post-Reboot Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ${#FAILED_SERVICES[@]} -eq 0 ]; then
    success "All services are operational!"
    echo "  🎉 System is healthy after reboot"
else
    error "Some services failed to start:"
    for service in "${FAILED_SERVICES[@]}"; do
        echo "    - $service"
    done
    echo ""
    warning "Manual intervention may be required"
fi

echo "  🕐 Boot time: $BOOT_TIME"
echo "  💽 Disk usage: ${DISK_USAGE}%"
echo "  📅 Checked: $(date)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Send email alert if configured and there are failures
if [ -n "$ALERT_EMAIL" ] && [ ${#FAILED_SERVICES[@]} -gt 0 ]; then
    if command -v mail &> /dev/null; then
        echo "Post-reboot check found issues. Check log: $LOG_FILE" | \
            mail -s "⚠️ publicpresence.org Post-Reboot Alert" "$ALERT_EMAIL"
        log "Alert email sent to $ALERT_EMAIL"
    fi
fi

# Exit with appropriate code
if [ ${#FAILED_SERVICES[@]} -eq 0 ]; then
    log "✅ Post-reboot check completed successfully!"
    exit 0
else
    log "⚠️ Post-reboot check completed with warnings!"
    exit 1
fi
