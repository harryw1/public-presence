# Cloudflare Worker Setup Guide

This guide will walk you through deploying a secure proxy Worker for your newsletter subscriptions.

## Why Use a Cloudflare Worker?

✅ **Security**: Keeps your Kit API key server-side (never exposed to clients)
✅ **Rate Limiting**: Protects against spam and abuse
✅ **Origin Validation**: Only your domain can use the endpoint
✅ **Free**: 100,000 requests/day on Cloudflare's free tier
✅ **Fast**: Edge computing - runs close to your users globally

## Step-by-Step Deployment

### 1. Go to Cloudflare Dashboard

1. Log into [dash.cloudflare.com](https://dash.cloudflare.com)
2. Click **Workers & Pages** in the left sidebar
3. Click **Create Application** → **Create Worker**

### 2. Create the Worker

1. Give it a name: `newsletter-proxy` (or whatever you prefer)
2. Click **Deploy** (we'll add the code in a moment)
3. Click **Edit Code** after it deploys

### 3. Add the Worker Code

1. You'll see a code editor
2. **Delete all the existing code**
3. Copy the entire contents of `newsletter-proxy.js` (from this folder)
4. Paste it into the editor
5. Click **Save and Deploy**

### 4. Configure Environment Variables

This is where we add your secret credentials:

1. In the Worker dashboard, click **Settings** tab
2. Click **Variables and Secrets** (or **Environment Variables**)
3. Under **Environment Variables**, click **Add variable** three times:

   **Variable 1:**
   - Name: `KIT_API_KEY`
   - Value: `kit_daed6979a61f319b661656d82641aac5`
   - Type: **Secret** (click "Encrypt" if available)

   **Variable 2:**
   - Name: `KIT_FORM_ID`
   - Value: `f990e0e0b9`
   - Type: Plain text

   **Variable 3:**
   - Name: `ALLOWED_ORIGIN`
   - Value: `https://publicpresence.org` (your production domain)
   - Type: Plain text

4. Click **Save** (or **Deploy** if prompted)

### 5. Get Your Worker URL

After deployment, your Worker will have a URL like:

```
https://newsletter-proxy.YOUR-ACCOUNT.workers.dev
```

Copy this URL - you'll need it in the next step!

### 6. Test the Worker (Optional but Recommended)

You can test it with curl:

```bash
curl -X POST https://newsletter-proxy.YOUR-ACCOUNT.workers.dev \
  -H "Content-Type: application/json" \
  -H "Origin: https://publicpresence.org" \
  -d '{"email":"test@example.com"}'
```

You should see a success response from Kit.

### 7. Update Your Website Code

Now we need to update the `SubscribeWidget` to use the Worker instead of calling Kit directly.

See the instructions below in the "Website Integration" section.

## Website Integration

Once your Worker is deployed, update your local `.env` file:

```env
# Remove or comment out the Kit credentials:
# VITE_KIT_API_KEY=kit_daed6979a61f319b661656d82641aac5
# VITE_KIT_FORM_ID=f990e0e0b9

# Add your Worker URL:
VITE_NEWSLETTER_WORKER_URL=https://newsletter-proxy.YOUR-ACCOUNT.workers.dev
```

The SubscribeWidget component will automatically detect this and use the Worker.

## Production Deployment

When deploying to your Raspberry Pi or hosting provider:

### Option A: Set Environment Variable on Pi

Add to your `.bashrc` or systemd service file:

```bash
export VITE_NEWSLETTER_WORKER_URL=https://newsletter-proxy.YOUR-ACCOUNT.workers.dev
```

### Option B: Embed at Build Time

If you're building the site before deploying:

1. Create `.env.production`:
   ```env
   VITE_NEWSLETTER_WORKER_URL=https://newsletter-proxy.YOUR-ACCOUNT.workers.dev
   ```

2. Build the site:
   ```bash
   npm run build
   ```

3. Deploy the `dist` folder to your Pi

## Custom Domain for Worker (Optional)

You can use your own domain for the Worker:

1. In Cloudflare Workers dashboard, click **Triggers** tab
2. Click **Add Custom Domain**
3. Enter something like: `api.publicpresence.org`
4. Cloudflare will automatically create DNS records
5. Update your `.env` to use the custom domain

**Benefits:**
- Looks more professional
- Easier to remember
- Can migrate to different Worker later without breaking your site

## Security Features

### Origin Validation

The Worker only accepts requests from:
- `https://publicpresence.org` (production)
- `http://localhost:5173` (Vite dev server)
- `http://localhost:4173` (Vite preview)

To add more allowed origins, update line 27 in `newsletter-proxy.js`.

### Rate Limiting (Optional Enhancement)

The current Worker includes placeholder code for rate limiting. To enable it:

1. Create a KV namespace in Cloudflare:
   - Workers & Pages → KV
   - Create namespace: `newsletter_rate_limits`

2. Bind it to your Worker:
   - Worker Settings → Variables
   - Add KV binding: `RATE_LIMIT` → `newsletter_rate_limits`

3. Uncomment the rate limiting code in the Worker

This will limit each IP to 5 subscriptions per minute.

## Monitoring & Logs

### View Real-Time Logs

1. Go to your Worker in Cloudflare dashboard
2. Click the **Logs** tab (or **Logs** in the sidebar)
3. Click **Begin log stream**
4. You'll see requests in real-time

Logs show:
- ✅ Successful subscriptions: "Subscription successful: email@example.com"
- ❌ Failed subscriptions: "Subscription failed: email@example.com"
- 🔒 Blocked origins: "Origin not allowed"

### Analytics

Cloudflare provides free analytics:
- **Workers Analytics**: Request count, error rate, CPU time
- **Available in**: Workers & Pages → Your Worker → Metrics

## Troubleshooting

### "Origin not allowed" Error

**Cause**: Your website's domain doesn't match `ALLOWED_ORIGIN`

**Fix**:
- Update `ALLOWED_ORIGIN` environment variable
- Add your domain to the allowed origins list in the Worker code

### "Service configuration error"

**Cause**: Environment variables not set correctly

**Fix**:
- Check Worker Settings → Variables
- Ensure `KIT_API_KEY` and `KIT_FORM_ID` are set
- Redeploy the Worker after adding variables

### CORS Errors in Browser

**Cause**: Worker's CORS headers misconfigured

**Fix**:
- Check browser console for specific CORS error
- Verify `Origin` header is being sent by browser
- Make sure Worker returns proper CORS headers (already implemented)

### "Internal server error"

**Cause**: Worker code has a bug or Kit API is down

**Fix**:
- Check Worker logs in Cloudflare dashboard
- Test Kit API directly: `curl https://api.kit.com/v3/forms/YOUR_FORM_ID/subscribe -d '{"api_key":"YOUR_KEY","email":"test@test.com"}' -H "Content-Type: application/json"`
- Check Kit's status page: [status.kit.com](https://status.kit.com)

## Cost & Limits

**Cloudflare Workers Free Tier:**
- ✅ 100,000 requests per day
- ✅ Unlimited Worker scripts
- ✅ 10ms CPU time per request
- ✅ Global edge network

For a personal blog, you'll likely never hit these limits.

**Upgrade if needed:**
- $5/month for 10 million requests
- Only pay if you exceed free tier

## Advanced: Local Development

To test the Worker locally:

```bash
# Install Wrangler (Cloudflare's CLI)
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Run Worker locally
cd cloudflare-worker
wrangler dev newsletter-proxy.js

# It will run on http://localhost:8787
```

Then update your `.env`:
```env
VITE_NEWSLETTER_WORKER_URL=http://localhost:8787
```

## Migration Path

If you ever want to switch from Kit to another service (Mailchimp, Substack, etc.):

1. Update the Worker code to call the new API
2. No changes needed to your website!
3. The Worker acts as an abstraction layer

## Security Checklist

- [x] API key stored as encrypted secret in Cloudflare
- [x] Origin validation enabled
- [x] CORS properly configured
- [x] Rate limiting ready (optional)
- [x] Logs enabled for monitoring
- [ ] Custom domain configured (optional)
- [ ] Rate limiting enabled with KV (optional)

## Need Help?

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare Community](https://community.cloudflare.com/)
- [Kit API Docs](https://developers.kit.com/)
