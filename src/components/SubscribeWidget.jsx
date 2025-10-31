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

    // Get Kit credentials from environment variables
    const kitApiKey = import.meta.env.VITE_KIT_API_KEY;
    const kitFormId = import.meta.env.VITE_KIT_FORM_ID;

    // Check if Kit is configured
    if (!kitApiKey || !kitFormId) {
      console.error('Kit API credentials not configured. Please set VITE_KIT_API_KEY and VITE_KIT_FORM_ID in your .env file.');
      setStatus('error');
      setMessage('Newsletter signup is not configured yet. Please try again later.');
      return;
    }

    try {
      // Subscribe to Kit form
      const response = await fetch(`https://api.kit.com/v3/forms/${kitFormId}/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: kitApiKey,
          email: email,
          // Optional: add custom fields or tags
          // tags: ['blog-subscriber'],
          // fields: { first_name: 'John' }
        }),
      });

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
        // Handle Kit API errors
        throw new Error(data.message || 'Subscription failed');
      }
    } catch (error) {
      console.error('Kit subscription error:', error);
      setStatus('error');
      setMessage(
        error.message === 'Subscription failed'
          ? 'Unable to subscribe. Please check your email address.'
          : 'Something went wrong. Please try again later.'
      );
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
