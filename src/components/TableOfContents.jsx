/**
 * TableOfContents.jsx - Auto-generated table of contents for blog posts
 *
 * Parses markdown headings (h2, h3) to create a navigable TOC
 * Only displays if post has 4+ headings
 * Uses smooth scrolling for navigation
 */

import { useMemo } from 'react';
import { List } from 'lucide-react';

/**
 * Extract headings from markdown content
 * @param {string} content - Raw markdown content
 * @returns {Array} Array of heading objects with text, level, and id
 */
function extractHeadings(content) {
  if (!content) return [];

  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length; // 2 for ##, 3 for ###
    const text = match[2].trim();

    // Generate ID from heading text (same as markdown processors do)
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');

    headings.push({
      level,
      text,
      id
    });
  }

  return headings;
}

/**
 * TableOfContents component
 *
 * @param {Object} props
 * @param {string} props.content - Markdown content to extract headings from
 * @param {number} props.minHeadings - Minimum headings required to show TOC (default: 4)
 */
function TableOfContents({ content, minHeadings = 4 }) {
  const headings = useMemo(() => extractHeadings(content), [content]);

  // Don't render if not enough headings
  if (headings.length < minHeadings) {
    return null;
  }

  const handleClick = (e, id) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      // Update URL hash without jumping
      window.history.pushState(null, '', `#${id}`);
    }
  };

  return (
    <nav className="table-of-contents" aria-label="Table of contents">
      <div className="toc-header">
        <List size={18} aria-hidden="true" />
        <h2 className="toc-title">Table of Contents</h2>
      </div>

      <ul className="toc-list">
        {headings.map((heading, index) => (
          <li
            key={`${heading.id}-${index}`}
            className={`toc-item toc-item-level-${heading.level}`}
          >
            <a
              href={`#${heading.id}`}
              className="toc-link"
              onClick={(e) => handleClick(e, heading.id)}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default TableOfContents;
