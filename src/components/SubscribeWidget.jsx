/**
 * SubscribeWidget.jsx - Newsletter subscription form
 *
 * A clean, Substack-style email subscription widget
 * Can be placed at the bottom of posts or in a dedicated section
 *
 * Features:
 * - Email input validation
 * - Form submission handling
 * - Success/error states
 * - Accessible form labels
 */

import { useState } from 'react';
import { Mail } from 'lucide-react';

/**
 * SubscribeWidget component
 *
 * @param {Object} props
 * @param {string} props.title - Widget title (optional)
 * @param {string} props.description - Widget description (optional)
 * @param {string} props.placement - 'inline' or 'prominent' (affects styling)
 */
function SubscribeWidget({
  title = "Subscribe to Public Presence",
  description = "Get new posts delivered directly to your inbox.",
  placement = "inline"
}) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle', 'submitting', 'success', 'error'
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }

    setStatus('submitting');

    // Check for Cloudflare Worker endpoint (preferred method)
    const workerUrl = import.meta.env.VITE_NEWSLETTER_WORKER_URL;

    // Fallback to direct Kit API (less secure, for development)
    const kitApiKey = import.meta.env.VITE_KIT_API_KEY;
    const kitFormId = import.meta.env.VITE_KIT_FORM_ID;

    // Determine which method to use
    const useWorker = !!workerUrl;
    const useDirect = !useWorker && kitApiKey && kitFormId;

    if (!useWorker && !useDirect) {
      console.error('Newsletter service not configured. Set either VITE_NEWSLETTER_WORKER_URL or both VITE_KIT_API_KEY and VITE_KIT_FORM_ID');
      setStatus('error');
      setMessage('Newsletter signup is not configured yet. Please try again later.');
      return;
    }

    try {
      let response;

      if (useWorker) {
        // Method 1: Use Cloudflare Worker proxy (secure)
        response = await fetch(workerUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email,
            // Optional: add custom fields or tags
            // tags: ['blog-subscriber'],
            // fields: { first_name: 'John' }
          }),
        });
      } else {
        // Method 2: Direct Kit API call (fallback for development)
        console.warn('Using direct Kit API - consider using Cloudflare Worker for production');
        response = await fetch(`https://api.kit.com/v3/forms/${kitFormId}/subscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            api_key: kitApiKey,
            email: email,
          }),
        });
      }

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Thanks for subscribing! Check your inbox for a confirmation email.');
        setEmail('');

        // Reset after 5 seconds
        setTimeout(() => {
          setStatus('idle');
          setMessage('');
        }, 5000);
      } else {
        // Handle errors from Kit or Worker
        throw new Error(data.error || data.message || 'Subscription failed');
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      setStatus('error');

      // User-friendly error messages
      if (error.message.includes('Origin not allowed')) {
        setMessage('Access denied. Please contact the site administrator.');
      } else if (error.message.includes('Invalid email')) {
        setMessage('Please enter a valid email address.');
      } else if (error.message === 'Failed to fetch') {
        setMessage('Network error. Please check your connection and try again.');
      } else {
        setMessage('Something went wrong. Please try again later.');
      }
    }
  };

  return (
    <div className={`subscribe-widget subscribe-widget-${placement}`}>
      <div className="subscribe-content">
        <div className="subscribe-header">
          <Mail size={24} className="subscribe-icon" aria-hidden="true" />
          <h3 className="subscribe-title">{title}</h3>
        </div>
        <p className="subscribe-description">{description}</p>

        <form onSubmit={handleSubmit} className="subscribe-form">
          <div className="subscribe-form-group">
            <label htmlFor="email-subscribe" className="sr-only">
              Email address
            </label>
            <input
              type="email"
              id="email-subscribe"
              className="subscribe-input"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === 'submitting' || status === 'success'}
              required
            />
            <button
              type="submit"
              className="subscribe-button"
              disabled={status === 'submitting' || status === 'success'}
            >
              {status === 'submitting' ? 'Subscribing...' : 'Subscribe'}
            </button>
          </div>

          {message && (
            <p className={`subscribe-message subscribe-message-${status}`}>
              {message}
            </p>
          )}
        </form>

        <p className="subscribe-privacy">
          No spam. Unsubscribe anytime.
        </p>
      </div>
    </div>
  );
}

export default SubscribeWidget;
