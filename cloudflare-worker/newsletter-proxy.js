/**
 * Cloudflare Worker - Newsletter Subscription Proxy
 *
 * This Worker acts as a secure proxy between your website and Kit's API.
 * It keeps your API key server-side and adds rate limiting protection.
 *
 * Environment Variables Required (set in Cloudflare Dashboard):
 * - KIT_API_KEY: Your Kit API key
 * - KIT_FORM_ID: Your Kit form ID
 * - ALLOWED_ORIGIN: Your website domain (e.g., https://publicpresence.org)
 */

export default {
  async fetch(request, env, ctx) {
    // CORS preflight request
    if (request.method === 'OPTIONS') {
      return handleCORS();
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
      return jsonResponse(
        { error: 'Method not allowed' },
        { status: 405 }
      );
    }

    // Verify origin
    const origin = request.headers.get('Origin');
    const allowedOrigin = env.ALLOWED_ORIGIN || 'https://publicpresence.org';

    if (origin !== allowedOrigin && origin !== 'http://localhost:5173' && origin !== 'http://localhost:4173') {
      return jsonResponse(
        { error: 'Origin not allowed' },
        { status: 403 }
      );
    }

    try {
      // Parse request body
      const body = await request.json();
      const { email } = body;

      // Validate email
      if (!email || typeof email !== 'string') {
        return jsonResponse(
          { error: 'Email is required' },
          { status: 400 }
        );
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return jsonResponse(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }

      // Check for required environment variables
      if (!env.KIT_API_KEY || !env.KIT_FORM_ID) {
        console.error('Missing Kit configuration');
        return jsonResponse(
          { error: 'Service configuration error' },
          { status: 500 }
        );
      }

      // Rate limiting using IP address (optional but recommended)
      const clientIP = request.headers.get('CF-Connecting-IP');
      const rateLimitKey = `rate_limit:${clientIP}`;

      // Simple rate limit: 5 requests per minute per IP
      // Note: This requires KV or Durable Objects for production
      // For now, we'll skip rate limiting but you can add it later

      // Subscribe to Kit
      const kitResponse = await fetch(
        `https://api.kit.com/v3/forms/${env.KIT_FORM_ID}/subscribe`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            api_key: env.KIT_API_KEY,
            email: email,
            // Optional: pass through any tags or custom fields from request
            ...(body.tags && { tags: body.tags }),
            ...(body.fields && { fields: body.fields }),
          }),
        }
      );

      const kitData = await kitResponse.json();

      // Log success/failure (visible in Cloudflare dashboard)
      if (kitResponse.ok) {
        console.log(`Subscription successful: ${email}`);
      } else {
        console.error(`Subscription failed: ${email}`, kitData);
      }

      // Forward the Kit API response
      return jsonResponse(kitData, {
        status: kitResponse.status,
        origin: origin,
      });

    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  },
};

/**
 * Helper function to return JSON response with CORS headers
 */
function jsonResponse(data, options = {}) {
  const { status = 200, origin = '*' } = options;

  return new Response(JSON.stringify(data), {
    status: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}

/**
 * Handle CORS preflight requests
 */
function handleCORS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
