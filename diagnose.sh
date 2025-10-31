#!/bin/bash

# Quick Diagnostic Script for Blank Page Issues
# Run this on your Pi to diagnose why the site shows blank

echo "=========================================="
echo "publicpresence.org - Diagnostic Report"
echo "=========================================="
echo ""

# Check 1: nginx status
echo "1. Checking nginx status..."
if sudo systemctl is-active --quiet nginx; then
    echo "   ✓ nginx is running"
else
    echo "   ✗ nginx is NOT running"
    echo "   Fix: sudo systemctl start nginx"
fi
echo ""

# Check 2: nginx configuration
echo "2. Testing nginx configuration..."
if sudo nginx -t 2>&1 | grep -q "successful"; then
    echo "   ✓ nginx config is valid"
else
    echo "   ✗ nginx config has errors"
    sudo nginx -t
fi
echo ""

# Check 3: Files exist
echo "3. Checking if site files exist..."
if [ -f "/var/www/publicpresence/public/index.html" ]; then
    echo "   ✓ index.html exists"
    FILE_COUNT=$(find /var/www/publicpresence/public -type f | wc -l)
    echo "   ✓ Total files deployed: $FILE_COUNT"
else
    echo "   ✗ index.html NOT FOUND"
    echo "   Fix: cd /home/pi/publicpresence && ./deploy.sh"
fi
echo ""

# Check 4: Assets directory
echo "4. Checking assets directory..."
if [ -d "/var/www/publicpresence/public/assets" ]; then
    JS_COUNT=$(find /var/www/publicpresence/public/assets -name "*.js" | wc -l)
    CSS_COUNT=$(find /var/www/publicpresence/public/assets -name "*.css" | wc -l)
    echo "   ✓ assets/ exists"
    echo "   ✓ JavaScript files: $JS_COUNT"
    echo "   ✓ CSS files: $CSS_COUNT"
else
    echo "   ✗ assets/ directory NOT FOUND"
    echo "   Fix: cd /home/pi/publicpresence && ./deploy.sh"
fi
echo ""

# Check 5: Permissions
echo "5. Checking file permissions..."
OWNER=$(stat -c '%U:%G' /var/www/publicpresence/public/index.html 2>/dev/null)
if [ "$OWNER" = "www-data:www-data" ]; then
    echo "   ✓ Correct ownership: $OWNER"
else
    echo "   ⚠ Owner is: $OWNER (should be www-data:www-data)"
    echo "   Fix: sudo chown -R www-data:www-data /var/www/publicpresence/public/"
fi
echo ""

# Check 6: nginx configuration for try_files
echo "6. Checking nginx routing configuration..."
if sudo grep -r "try_files.*index.html" /etc/nginx/sites-enabled/ > /dev/null 2>&1; then
    echo "   ✓ try_files directive found"
else
    echo "   ✗ try_files directive MISSING or incorrect"
    echo "   This is the MOST COMMON cause of blank pages!"
    echo ""
    echo "   Add this to your nginx config in location / block:"
    echo "   try_files \$uri \$uri/ /index.html;"
fi
echo ""

# Check 7: Local access test
echo "7. Testing local access..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost 2>/dev/null)
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✓ localhost returns 200 OK"
else
    echo "   ✗ localhost returns $HTTP_CODE"
fi
echo ""

# Check 8: Recent nginx errors
echo "8. Recent nginx errors (last 10)..."
if [ -f "/var/log/nginx/error.log" ]; then
    ERROR_COUNT=$(sudo tail -100 /var/log/nginx/error.log | grep -c "error")
    if [ "$ERROR_COUNT" -gt 0 ]; then
        echo "   ⚠ Found $ERROR_COUNT errors in last 100 lines"
        echo "   Recent errors:"
        sudo tail -10 /var/log/nginx/error.log | grep "error"
    else
        echo "   ✓ No recent errors"
    fi
else
    echo "   ⚠ Error log not found"
fi
echo ""

# Check 9: Build directory
echo "9. Checking build directory on Pi..."
if [ -d "/home/pi/publicpresence/build" ]; then
    BUILD_SIZE=$(du -sh /home/pi/publicpresence/build 2>/dev/null | cut -f1)
    echo "   ✓ build/ exists (size: $BUILD_SIZE)"
else
    echo "   ⚠ build/ not found"
    echo "   Run: cd /home/pi/publicpresence && npm run build"
fi
echo ""

# Summary
echo "=========================================="
echo "DIAGNOSIS SUMMARY"
echo "=========================================="
echo ""

# Provide recommendations
CRITICAL_ISSUES=0

if ! sudo systemctl is-active --quiet nginx; then
    echo "CRITICAL: nginx is not running"
    CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
fi

if [ ! -f "/var/www/publicpresence/public/index.html" ]; then
    echo "CRITICAL: Site files not deployed"
    CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
fi

if ! sudo grep -r "try_files.*index.html" /etc/nginx/sites-enabled/ > /dev/null 2>&1; then
    echo "CRITICAL: nginx missing try_files directive"
    echo "This is the #1 cause of blank pages with React apps!"
    CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
fi

if [ "$CRITICAL_ISSUES" -eq 0 ]; then
    echo "✓ No critical issues found"
    echo ""
    echo "If site still shows blank:"
    echo "1. Check browser console for JavaScript errors (F12)"
    echo "2. Try hard refresh: Ctrl+Shift+R"
    echo "3. Try incognito/private window"
    echo "4. Check SSL certificate if using HTTPS"
else
    echo ""
    echo "Found $CRITICAL_ISSUES critical issue(s) above."
    echo "Fix these issues first, then test your site."
fi

echo ""
echo "=========================================="
echo "Next Steps:"
echo "=========================================="
echo "1. Fix any CRITICAL issues listed above"
echo "2. Hard refresh browser: Ctrl+Shift+R"
echo "3. Check browser console (F12) for errors"
echo "4. View full troubleshooting: TROUBLESHOOTING_BLANK_PAGE.md"
echo ""
