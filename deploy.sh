#!/bin/bash

# publicpresence.org Blog Deployment Script
# Integrates with existing publicpresence.org infrastructure
# Builds the blog and deploys to Nginx

set -e  # Exit immediately if a command fails

# ===== CONFIGURATION =====
PROJECT_DIR="$HOME/publicpresence"
WEB_ROOT="/var/www/publicpresence/public"
BACKUP_DIR="/var/www/publicpresence/backups"
BUILD_DIR="build"  # Vite configured to output to build/ directory

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ===== FUNCTIONS =====
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# ===== MAIN DEPLOYMENT PROCESS =====
print_header "Deploying publicpresence.org Blog"

# Navigate to project directory
echo -e "${YELLOW}Navigating to project directory...${NC}"
cd "$PROJECT_DIR" || {
    print_error "Failed to navigate to $PROJECT_DIR"
    exit 1
}
print_success "In directory: $(pwd)"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Are you in the right directory?"
    exit 1
fi

# Install/update dependencies
echo -e "\n${YELLOW}Installing dependencies...${NC}"
if npm install; then
    print_success "Dependencies installed"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Clean previous build
echo -e "\n${YELLOW}Cleaning previous build...${NC}"
rm -rf "$BUILD_DIR/"
print_success "Previous build cleaned"

# Run prebuild script (generates RSS feed)
echo -e "\n${YELLOW}Running prebuild tasks (RSS generation)...${NC}"
if node scripts/prebuild.js; then
    print_success "Prebuild tasks completed"
else
    print_error "Prebuild failed"
    exit 1
fi

# Build the site
echo -e "\n${YELLOW}Building React + Vite application...${NC}"
if npm run build; then
    print_success "Build completed successfully"
else
    print_error "Build failed"
    exit 1
fi

# Verify build output exists
if [ ! -d "$BUILD_DIR" ] || [ ! "$(ls -A $BUILD_DIR)" ]; then
    print_error "Build output ($BUILD_DIR/) is empty or doesn't exist"
    exit 1
fi
print_success "Build output verified in $BUILD_DIR/"

# Create backup directory if it doesn't exist
sudo mkdir -p "$BACKUP_DIR"

# Backup current site
if [ -d "$WEB_ROOT" ] && [ "$(ls -A $WEB_ROOT)" ]; then
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    echo -e "\n${YELLOW}Creating backup...${NC}"
    if sudo tar -czf "$BACKUP_DIR/backup_$TIMESTAMP.tar.gz" -C "$WEB_ROOT" . 2>/dev/null; then
        print_success "Backup created: backup_$TIMESTAMP.tar.gz"
        
        # Keep only last 5 backups
        cd "$BACKUP_DIR"
        BACKUP_COUNT=$(ls -1 backup_*.tar.gz 2>/dev/null | wc -l)
        if [ "$BACKUP_COUNT" -gt 5 ]; then
            sudo ls -t backup_*.tar.gz | tail -n +6 | xargs -r sudo rm --
            print_success "Old backups cleaned (kept last 5)"
        fi
        cd "$PROJECT_DIR"
    else
        print_warning "Backup creation skipped or failed"
    fi
else
    print_warning "No existing site to backup"
fi

# Deploy to web server
echo -e "\n${YELLOW}Deploying to web server...${NC}"
sudo mkdir -p "$WEB_ROOT"
sudo rm -rf "$WEB_ROOT"/*
sudo cp -r "$PROJECT_DIR/$BUILD_DIR/"* "$WEB_ROOT/"
print_success "Files copied to $WEB_ROOT"

# Set proper permissions
echo -e "\n${YELLOW}Setting permissions...${NC}"
sudo chown -R www-data:www-data "$WEB_ROOT"
sudo chmod -R 755 "$WEB_ROOT"
print_success "Permissions set"

# Test Nginx configuration
echo -e "\n${YELLOW}Testing Nginx configuration...${NC}"
if sudo nginx -t 2>&1 | grep -q "successful"; then
    print_success "Nginx configuration is valid"
else
    print_error "Nginx configuration is invalid!"
    print_warning "Deployment complete but Nginx not reloaded"
    exit 1
fi

# Reload Nginx
echo -e "\n${YELLOW}Reloading Nginx...${NC}"
if sudo systemctl reload nginx; then
    print_success "Nginx reloaded successfully"
else
    print_error "Failed to reload Nginx"
    exit 1
fi

# Final status check
echo -e "\n${YELLOW}Verifying deployment...${NC}"
if [ -f "$WEB_ROOT/index.html" ]; then
    print_success "index.html exists in web root"
else
    print_warning "index.html not found in web root"
fi

# Display summary
print_header "Deployment Complete!"
echo -e "${GREEN}Site:${NC} https://publicpresence.org"
echo -e "${GREEN}Build time:${NC} $(date)"
echo -e "${GREEN}Files deployed:${NC} $(find $WEB_ROOT -type f 2>/dev/null | wc -l) files"
echo -e "${GREEN}Blog posts:${NC} $(find $PROJECT_DIR/content/posts -name '*.md' 2>/dev/null | grep -v TEMPLATE | wc -l) posts"
echo ""
echo -e "${YELLOW}Test your site:${NC}"
echo -e "  Local:  curl -I http://localhost"
echo -e "  Remote: curl -I https://publicpresence.org"
echo -e ""
echo -e "${YELLOW}RSS Feed:${NC} https://publicpresence.org/rss.xml"
