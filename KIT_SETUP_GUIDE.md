# Kit (ConvertKit) Newsletter Integration Guide

This guide will help you set up newsletter subscriptions using Kit's free tier.

## Prerequisites

- Kit account (free tier supports up to 10,000 subscribers)
- Your website hosted/deployed (localhost works for testing too)

## Step-by-Step Setup

### 1. Create Your Kit Account

1. Go to [kit.com](https://kit.com)
2. Sign up for a free account (Newsletter plan)
3. Verify your email address

### 2. Create a Subscription Form

1. Log into Kit dashboard
2. Navigate to **"Grow"** → **"Landing Pages & Forms"**
3. Click **"Create New"** → **"Form"**
4. Choose any template (we only need the backend functionality)
5. Give it a name like "Blog Newsletter Subscribers"
6. Click **"Save"**

### 3. Get Your Form ID

**Option A: From the URL**
- The form URL will look like: `https://app.kit.com/forms/123456789`
- Your Form ID is: `123456789`

**Option B: From the Embed Code**
- Click **"Publish"** on your form
- Look at the HTML embed code
- Find `data-uid="XXXXXXXXX"` or `data-form="XXXXXXXXX"`
- That string is your Form ID

### 4. Get Your API Key

1. Go to **"Settings"** (gear icon) → **"Advanced"** → **"API & webhooks"**
2. You'll see your **"API Secret"**
3. Click "Show" to reveal it
4. Copy this key (it's safe to use for form submissions)

### 5. Configure Your Environment Variables

1. Open the `.env` file in your project root:
   ```bash
   nano .env
   # or use your preferred editor
   ```

2. Add your credentials:
   ```env
   VITE_KIT_API_KEY=your_actual_api_key_here
   VITE_KIT_FORM_ID=your_actual_form_id_here
   ```

3. Save the file

### 6. Restart Your Development Server

```bash
# Stop your current server (Ctrl+C)
# Then restart it
npm run dev
```

**Important**: Vite only loads environment variables at startup, so you must restart after changing `.env`.

### 7. Test the Integration

1. Open your site in a browser
2. Navigate to any blog post
3. Scroll to the newsletter widget
4. Enter your email address
5. Click "Subscribe"

You should see:
- A success message: "Thanks for subscribing! Check your inbox for a confirmation email."
- An email from Kit with a confirmation link

### 8. Check Your Kit Dashboard

1. Go to **"Grow"** → **"Subscribers"**
2. You should see your test email listed
3. The subscriber will be tagged with your form name

## Troubleshooting

### "Newsletter signup is not configured yet"

**Cause**: Environment variables not loaded

**Solutions**:
- Make sure `.env` file exists in project root
- Check variable names: `VITE_KIT_API_KEY` and `VITE_KIT_FORM_ID` (must start with `VITE_`)
- Restart your dev server after editing `.env`
- Run `echo $VITE_KIT_API_KEY` to verify (won't work in browser, only in build)

### "Unable to subscribe. Please check your email address"

**Cause**: Invalid API credentials or Form ID

**Solutions**:
- Double-check Form ID from Kit dashboard
- Verify API key is correct (copy-paste carefully)
- Make sure there are no extra spaces in `.env` file
- Check browser console for detailed error messages

### CORS Errors

**Cause**: Kit's API might have CORS restrictions

**Solution**: This shouldn't happen with form submissions, but if it does:
1. Make sure you're using `https://api.kit.com` (not `convertkit.com`)
2. Consider using a Cloudflare Worker proxy (see Advanced Setup below)

### Email Not Received

**Possible causes**:
- Check spam/junk folder
- Email might be in "Promotional" tab (Gmail)
- Kit might be rate-limiting (wait a few minutes)
- Check Kit dashboard to see if subscriber was added

## Advanced Setup: Cloudflare Worker Proxy (Optional)

If you want to hide your API key from the client, you can use a Cloudflare Worker:

### 1. Create a Worker

```javascript
// worker.js
export default {
  async fetch(request) {
    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Get email from request
    const { email } = await request.json();

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Subscribe via Kit API
    const response = await fetch(
      `https://api.kit.com/v3/forms/${KIT_FORM_ID}/subscribe`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: KIT_API_KEY,
          email: email
        })
      }
    );

    // Forward the response
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://yourdomain.com'
      }
    });
  }
}
```

### 2. Configure Worker

1. Go to Cloudflare Dashboard → Workers & Pages
2. Create new Worker
3. Paste the code above
4. Set environment variables: `KIT_API_KEY` and `KIT_FORM_ID`
5. Deploy

### 3. Update SubscribeWidget

Change line 61 in `SubscribeWidget.jsx`:
```javascript
// From:
const response = await fetch(`https://api.kit.com/v3/forms/${kitFormId}/subscribe`, {

// To:
const response = await fetch('https://your-worker.workers.dev', {
```

And update the body (remove `api_key`):
```javascript
body: JSON.stringify({
  email: email,
  // Remove: api_key: kitApiKey,
}),
```

## Customization Options

### Add Tags to Subscribers

Uncomment line 70 in `SubscribeWidget.jsx`:
```javascript
tags: ['blog-subscriber', 'from-website'],
```

### Add Custom Fields

Uncomment line 71 in `SubscribeWidget.jsx`:
```javascript
fields: {
  first_name: 'John',
  source: 'Blog Post'
}
```

### Multiple Subscription Forms

Create different forms in Kit for different purposes:
- Blog updates: `VITE_KIT_BLOG_FORM_ID`
- Course announcements: `VITE_KIT_COURSE_FORM_ID`

Then pass the `formId` as a prop to `SubscribeWidget`.

## Kit Dashboard Features

### Email Sequences

1. Go to **"Send"** → **"Sequences"**
2. Create a welcome email sequence
3. Automatically send when someone subscribes

### Broadcasts

Send one-time newsletters to all subscribers:
1. Go to **"Send"** → **"Broadcasts"**
2. Compose your email
3. Send or schedule

### Analytics

Track your growth:
- **"Grow"** → View subscriber count
- Click on forms to see conversion rates
- See email open and click rates

## Support Resources

- [Kit Documentation](https://help.kit.com/)
- [Kit API Reference](https://developers.kit.com/)
- [Community Forum](https://www.kit.com/community)

## Security Notes

✅ **Safe to commit**: `.env.example`, `KIT_SETUP_GUIDE.md`
❌ **Never commit**: `.env` (already in .gitignore)

The API key used for form submissions is designed to be public-facing and safe to expose in client-side code. However, for maximum security, use the Cloudflare Worker proxy method above.

## Need Help?

If you encounter issues:
1. Check the browser console for errors
2. Verify environment variables are set correctly
3. Test with a simple email address first
4. Check Kit's status page: [status.kit.com](https://status.kit.com)
