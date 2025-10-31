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

    // TODO: Integrate with your email service (Mailchimp, ConvertKit, Substack, etc.)
    // For now, this is a placeholder that simulates a successful subscription
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setStatus('success');
      setMessage('Thanks for subscribing! Check your inbox for a confirmation email.');
      setEmail('');

      // Reset after 5 seconds
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 5000);
    } catch (error) {
      setStatus('error');
      setMessage('Something went wrong. Please try again later.');
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
