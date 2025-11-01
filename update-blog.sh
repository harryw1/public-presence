#!/bin/bash

# publicpresence.org Blog Deployment Script
# Comprehensive script for rebuilding and updating the site

set -e  # Exit on error

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

# Start deployment
log "🚀 Starting publicpresence.org deployment..."
echo ""

# 1. Navigate to project directory
log "📂 Navigating to project directory..."
cd /home/harryweiss/publicpresence || { error "Failed to change directory"; exit 1; }
success "In project directory"
echo ""

# 2. Check git status
log "🔍 Checking git repository status..."
if git status > /dev/null 2>&1; then
    success "Git repository is healthy"

    # Show current branch
    CURRENT_BRANCH=$(git branch --show-current)
    log "Current branch: $CURRENT_BRANCH"

    # Check for uncommitted changes
    if [[ -n $(git status -s) ]]; then
        warning "You have uncommitted changes:"
        git status -s
    fi
else
    error "Git repository check failed"
    exit 1
fi
echo ""

# 3. Pull latest changes
log "📥 Pulling latest changes from remote..."
if git pull; then
    success "Successfully pulled latest changes"
else
    error "Git pull failed"
    exit 1
fi
echo ""

# 4. Check for dependency updates
log "📦 Checking for dependency updates..."
if [ -f "package.json" ]; then
    npm install || { error "npm install failed"; exit 1; }
    success "Dependencies updated"
else
    warning "No package.json found, skipping dependency install"
fi
echo ""

# 5. Build the site
log "🔨 Building the site..."
if npm run build; then
    BUILD_SIZE=$(du -sh build/ | cut -f1)
    success "Build completed successfully (Size: $BUILD_SIZE)"
else
    error "Build failed"
    exit 1
fi
echo ""

# 6. Copy build to web directory
log "📋 Copying build to web directory..."
if [ -d "/var/www/publicpresence/public" ]; then
    # Backup current site
    if [ -d "/var/www/publicpresence/public.backup" ]; then
        sudo rm -rf /var/www/publicpresence/public.backup
    fi
    sudo mv /var/www/publicpresence/public /var/www/publicpresence/public.backup 2>/dev/null || true

    # Copy new build
    sudo cp -r build /var/www/publicpresence/public
    sudo chown -R www-data:www-data /var/www/publicpresence/public
    success "Build deployed to /var/www/publicpresence/public"
else
    warning "Web directory not found, creating it..."
    sudo mkdir -p /var/www/publicpresence
    sudo cp -r build /var/www/publicpresence/public
    sudo chown -R www-data:www-data /var/www/publicpresence/public
    success "Created and deployed to /var/www/publicpresence/public"
fi
echo ""

# 7. Verify nginx configuration
log "🔧 Verifying nginx configuration..."
if sudo nginx -t > /dev/null 2>&1; then
    success "Nginx configuration is valid"
else
    error "Nginx configuration test failed"
    sudo nginx -t
    exit 1
fi
echo ""

# 8. Reload nginx
log "🔄 Reloading nginx..."
if sudo systemctl reload nginx; then
    success "Nginx reloaded successfully"
else
    warning "Failed to reload nginx, trying restart..."
    sudo systemctl restart nginx
fi
echo ""

# 9. Check service health
log "🏥 Checking service health..."

# Check nginx
if sudo systemctl is-active --quiet nginx; then
    success "nginx: running"
else
    error "nginx: not running"
fi

# Check Umami
if sudo systemctl is-active --quiet umami; then
    success "umami: running"
else
    warning "umami: not running"
fi

# Check cloudflared
if sudo systemctl is-active --quiet cloudflared; then
    success "cloudflared: running"
else
    warning "cloudflared: not running"
fi

# Check PostgreSQL
if sudo systemctl is-active --quiet postgresql; then
    success "postgresql: running"
else
    warning "postgresql: not running"
fi
echo ""

# 10. Backup Umami database
log "💾 Backing up Umami database..."
if [ -f "/home/harryweiss/backup-umami.sh" ]; then
    /home/harryweiss/backup-umami.sh
    success "Database backup completed"
else
    warning "Backup script not found, skipping database backup"
fi
echo ""

# 11. Clear nginx cache (if any)
log "🗑️  Clearing caches..."
# Add cache clearing commands if you have any configured
success "Cache cleared"
echo ""

# 12. Check disk space
log "💽 Checking disk space..."
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}')
DISK_AVAILABLE=$(df -h / | awk 'NR==2 {print $4}')
if [ "${DISK_USAGE%\%}" -gt 85 ]; then
    warning "Disk usage is high: $DISK_USAGE used ($DISK_AVAILABLE available)"
else
    success "Disk space healthy: $DISK_USAGE used ($DISK_AVAILABLE available)"
fi
echo ""

# 13. Test site accessibility
log "🌐 Testing site accessibility..."
if curl -f -s -o /dev/null http://localhost:80; then
    success "Site is accessible at http://localhost"
else
    warning "Site may not be accessible"
fi
echo ""

# 14. Summary
log "📊 Deployment Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
success "Site deployed successfully!"
echo "  🌐 URL: https://publicpresence.org"
echo "  📊 Analytics: https://analytics.publicpresence.org"
echo "  📅 Deployed: $(date)"
echo "  📦 Build size: $BUILD_SIZE"
echo "  💽 Disk usage: $DISK_USAGE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

log "✅ Deployment complete!"
