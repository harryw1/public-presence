# Diagnostic Scripts for Raspberry Pi Setup

Run these commands on your Raspberry Pi and share the output so I can help configure Umami correctly.

## Script 1: Check Cloudflared Setup

```bash
echo "=== CLOUDFLARED DIAGNOSTICS ==="
echo ""
echo "1. Cloudflared version:"
cloudflared --version
echo ""

echo "2. Cloudflared service status:"
sudo systemctl status cloudflared --no-pager
echo ""

echo "3. Looking for config files:"
sudo find /etc /home -name "config.yml" -o -name "*.json" 2>/dev/null | grep cloudflared
echo ""

echo "4. Check .cloudflared directory:"
ls -la ~/.cloudflared/ 2>/dev/null || echo "Directory not found in home"
echo ""

echo "5. Check /etc/cloudflared/:"
sudo ls -la /etc/cloudflared/ 2>/dev/null || echo "Directory not found in /etc"
echo ""

echo "6. Cloudflared service file location:"
sudo systemctl cat cloudflared 2>/dev/null || echo "Service file not found"
echo ""

echo "7. List all tunnels:"
cloudflared tunnel list 2>/dev/null || echo "Unable to list tunnels"
echo ""

echo "8. Check running cloudflared processes:"
ps aux | grep cloudflared | grep -v grep
echo ""

echo "9. Cloudflared logs (last 20 lines):"
sudo journalctl -u cloudflared -n 20 --no-pager 2>/dev/null || echo "No logs found"
```

## Script 2: Check Nginx Setup

```bash
echo "=== NGINX DIAGNOSTICS ==="
echo ""
echo "1. Nginx version and status:"
nginx -v
sudo systemctl status nginx --no-pager
echo ""

echo "2. List all nginx sites-available:"
ls -la /etc/nginx/sites-available/
echo ""

echo "3. List all nginx sites-enabled:"
ls -la /etc/nginx/sites-enabled/
echo ""

echo "4. Show public-presence nginx config:"
sudo cat /etc/nginx/sites-available/public-presence 2>/dev/null || echo "Config not found"
echo ""

echo "5. Check what's listening on common ports:"
sudo lsof -i :80 -i :443 -i :3000 -i :5000 -i :8080
echo ""

echo "6. Nginx test configuration:"
sudo nginx -t
```

## Script 3: Check Services and Ports

```bash
echo "=== SERVICES AND PORTS ==="
echo ""
echo "1. All listening ports:"
sudo netstat -tulpn | grep LISTEN
echo ""

echo "2. Public presence watcher status:"
sudo systemctl status public-presence-watcher --no-pager 2>/dev/null || echo "Service not found"
echo ""

echo "3. Check if Umami service exists:"
sudo systemctl status umami --no-pager 2>/dev/null || echo "Umami service not installed yet"
echo ""

echo "4. PostgreSQL status:"
sudo systemctl status postgresql --no-pager 2>/dev/null || echo "PostgreSQL not running"
```

## Script 4: Check DNS and Connectivity

```bash
echo "=== DNS AND CONNECTIVITY ==="
echo ""
echo "1. Check DNS resolution:"
nslookup publicpresence.org
nslookup analytics.publicpresence.org
echo ""

echo "2. Public IP (if available):"
curl -4 icanhazip.com 2>/dev/null || echo "No IPv4 address"
echo ""

echo "3. Test local services:"
curl -I http://localhost:80 2>/dev/null || echo "Nothing on port 80"
curl -I http://localhost:3000 2>/dev/null || echo "Nothing on port 3000"
curl -I http://localhost:5000 2>/dev/null || echo "Nothing on port 5000"
```

---

## How to Run All Scripts

Copy and paste each script block directly into your SSH terminal, or save them as files:

```bash
# Save all to a single diagnostic script
nano ~/diagnostics.sh
```

Then paste all four scripts into one file and run:

```bash
chmod +x ~/diagnostics.sh
./diagnostics.sh > diagnostic-output.txt 2>&1
cat diagnostic-output.txt
```

Share the output with me and I'll create the exact configuration files you need!
