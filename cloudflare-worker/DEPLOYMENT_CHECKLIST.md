# Cloudflare Worker Deployment Checklist

Follow these steps in order to deploy your secure newsletter proxy.

## ☐ Phase 1: Deploy the Worker

### 1. Access Cloudflare Dashboard
- [ ] Go to [dash.cloudflare.com](https://dash.cloudflare.com)
- [ ] Navigate to **Workers & Pages** in the left sidebar

### 2. Create Worker
- [ ] Click **Create Application**
- [ ] Choose **Create Worker**
- [ ] Name it: `newsletter-proxy` (or your preferred name)
- [ ] Click **Deploy**

### 3. Add Worker Code
- [ ] Click **Edit Code** button
- [ ] Delete all existing code in the editor
- [ ] Open `cloudflare-worker/newsletter-proxy.js` on your computer
- [ ] Copy all the code
- [ ] Paste into Cloudflare's editor
- [ ] Click **Save and Deploy**

### 4. Configure Environment Variables
- [ ] Click **Settings** tab
- [ ] Navigate to **Variables and Secrets** or **Environment Variables**
- [ ] Add these three variables:

**KIT_API_KEY** (Secret/Encrypted)
```
kit_daed6979a61f319b661656d82641aac5
```

**KIT_FORM_ID** (Plain text)
```
f990e0e0b9
```

**ALLOWED_ORIGIN** (Plain text)
```
https://publicpresence.org
```

- [ ] Click **Save** or **Deploy**

### 5. Copy Your Worker URL
- [ ] Find the Worker URL at the top of the page
- [ ] Format: `https://newsletter-proxy.YOUR-ACCOUNT.workers.dev`
- [ ] Copy this URL - you'll need it next!

**Your Worker URL:** `_______________________________________`

---

## ☐ Phase 2: Test the Worker

### Test with cURL (Optional but Recommended)
```bash
curl -X POST https://YOUR-WORKER-URL.workers.dev \
  -H "Content-Type: application/json" \
  -H "Origin: https://publicpresence.org" \
  -d '{"email":"your-test@email.com"}'
```

Expected response:
```json
{
  "subscription": {
    "id": 123456,
    "state": "active",
    "email_address": "your-test@email.com"
  }
}
```

- [ ] Test succeeded
- [ ] Check Kit dashboard → Subscribers to verify email was added

---

## ☐ Phase 3: Configure Your Website

### Local Development Setup

1. **Update .env file**
   ```bash
   nano .env
   ```

2. **Comment out direct API credentials**
   ```env
   # Direct Kit API (not needed with Worker)
   # VITE_KIT_API_KEY=kit_daed6979a61f319b661656d82641aac5
   # VITE_KIT_FORM_ID=f990e0e0b9
   ```

3. **Add Worker URL**
   ```env
   # Cloudflare Worker (secure)
   VITE_NEWSLETTER_WORKER_URL=https://newsletter-proxy.YOUR-ACCOUNT.workers.dev
   ```

4. **Restart development server**
   ```bash
   # Press Ctrl+C to stop, then:
   npm run dev
   ```

- [ ] .env updated
- [ ] Dev server restarted

### Test on Your Website

- [ ] Open your site in browser (localhost:5173)
- [ ] Navigate to any blog post
- [ ] Scroll to newsletter widget
- [ ] Enter your email
- [ ] Click "Subscribe"
- [ ] See success message: "Thanks for subscribing! Check your inbox..."
- [ ] Verify email arrives from Kit
- [ ] Check Kit dashboard to confirm subscriber was added

---

## ☐ Phase 4: Production Deployment

### For Raspberry Pi Deployment

**Option A: Environment Variable**

1. **SSH into your Pi**
   ```bash
   ssh pi@your-pi-address
   ```

2. **Add to system environment**
   ```bash
   echo 'export VITE_NEWSLETTER_WORKER_URL=https://newsletter-proxy.YOUR-ACCOUNT.workers.dev' >> ~/.bashrc
   source ~/.bashrc
   ```

**Option B: Build-Time Configuration**

1. **Create production env file**
   ```bash
   # On your local machine
   cat > .env.production << EOF
   VITE_NEWSLETTER_WORKER_URL=https://newsletter-proxy.YOUR-ACCOUNT.workers.dev
   EOF
   ```

2. **Build the site**
   ```bash
   npm run build
   ```

3. **Deploy to Pi**
   ```bash
   # Copy the build folder to your Pi
   scp -r dist/* pi@your-pi-address:/var/www/publicpresence/
   ```

- [ ] Production configuration complete
- [ ] Site deployed to Pi
- [ ] Tested on production domain

---

## ☐ Phase 5: Final Testing & Monitoring

### Production Tests

- [ ] Visit https://publicpresence.org from different device
- [ ] Test newsletter subscription with real email
- [ ] Verify confirmation email arrives
- [ ] Check Kit dashboard shows new subscriber
- [ ] Test from mobile device

### Set Up Monitoring

1. **Cloudflare Logs**
   - [ ] Go to Worker → Logs tab
   - [ ] Click "Begin log stream"
   - [ ] Bookmark this page for monitoring

2. **Set Up Alerts (Optional)**
   - [ ] Workers → Settings → Alerts
   - [ ] Configure error threshold alerts
   - [ ] Add your email for notifications

---

## ☐ Phase 6: Optional Enhancements

### Custom Domain for Worker
- [ ] Workers dashboard → Triggers tab
- [ ] Add Custom Domain: `api.publicpresence.org`
- [ ] Update .env with new domain
- [ ] Redeploy site

### Enable Rate Limiting
- [ ] Create KV namespace: `newsletter_rate_limits`
- [ ] Bind to Worker (Settings → Variables → KV Bindings)
- [ ] Uncomment rate limiting code in Worker
- [ ] Deploy updated Worker

---

## Troubleshooting Reference

### Common Issues

**"Origin not allowed"**
→ Check `ALLOWED_ORIGIN` environment variable in Worker
→ Verify your domain matches exactly

**"Service configuration error"**
→ Verify all 3 environment variables are set in Worker
→ Redeploy Worker after adding variables

**"Newsletter signup is not configured"**
→ Check `VITE_NEWSLETTER_WORKER_URL` in .env
→ Restart dev server after editing .env

**CORS errors**
→ Check Origin header in browser network tab
→ Verify Worker returns CORS headers (should be automatic)

---

## Security Checklist

- [x] API key stored in Cloudflare (never in code)
- [ ] Worker deployed and responding
- [ ] Origin validation working
- [ ] .env in .gitignore (verify: `git status` shouldn't show .env)
- [ ] Production uses Worker URL (not direct API)
- [ ] Pi firewall configured (optional)
- [ ] Cloudflare logs enabled

---

## Support

- **Cloudflare Workers**: [developers.cloudflare.com/workers](https://developers.cloudflare.com/workers/)
- **Kit API**: [developers.kit.com](https://developers.kit.com/)
- **Project Issues**: Check `cloudflare-worker/README.md`

---

## Completion

Once all checkboxes are marked:
- ✅ Your newsletter is secure
- ✅ API keys are hidden server-side
- ✅ Subscriptions work on production
- ✅ Your Raspberry Pi is protected

**Deployment Date:** _______________
**Worker URL:** _______________
**Status:** ☐ Complete
