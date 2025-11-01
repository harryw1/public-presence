/**
 * SEO.jsx - SEO meta tags component using React 19's built-in metadata feature
 *
 * React 19+ automatically hoists <title>, <meta>, and <link> tags to the document <head>
 * No need for react-helmet or similar libraries!
 *
 * Features:
 * - Dynamic page titles
 * - Meta descriptions for search engines
 * - Open Graph tags for Facebook/LinkedIn previews
 * - Twitter Card tags for Twitter previews
 * - Canonical URLs for SEO
 */

const SITE_NAME = 'publicpresence.org';
const SITE_URL = 'https://publicpresence.org';
const DEFAULT_DESCRIPTION = 'A blog focused on sustainability science, public planning, policy, and public transportation.';
const TWITTER_HANDLE = '@publicpresence'; // Update with your actual Twitter handle

/**
 * SEO Component
 *
 * @param {Object} props
 * @param {string} props.title - Page title (will be appended with site name)
 * @param {string} props.description - Meta description for the page
 * @param {string} props.image - Full URL to preview image (Open Graph/Twitter)
 * @param {string} props.url - Full URL of the current page
 * @param {string} props.type - Open Graph type (default: 'website', use 'article' for blog posts)
 * @param {string} props.publishedTime - ISO date string for articles (optional)
 * @param {string} props.author - Author name for articles (optional)
 * @param {string[]} props.tags - Array of tags for articles (optional)
 */
export default function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  image = `${SITE_URL}/images/og-default.jpg`, // You'll want to create a default OG image
  url = SITE_URL,
  type = 'website',
  publishedTime,
  author,
  tags = []
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;

  return (
    <>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Open Graph Tags (Facebook, LinkedIn) */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={title || SITE_NAME} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />

      {/* Article-specific Open Graph tags */}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && author && (
        <meta property="article:author" content={author} />
      )}
      {type === 'article' && tags.map(tag => (
        <meta key={tag} property="article:tag" content={tag} />
      ))}

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={TWITTER_HANDLE} />
      <meta name="twitter:title" content={title || SITE_NAME} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Additional SEO tags */}
      <meta name="robots" content="index, follow" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </>
  );
}
