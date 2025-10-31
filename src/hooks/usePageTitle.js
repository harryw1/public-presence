/**
 * usePageTitle - Custom hook for setting dynamic page titles
 *
 * Usage:
 * usePageTitle('About'); // Sets title to "About | publicpresence.org"
 * usePageTitle('My Post Title'); // Sets title to "My Post Title | publicpresence.org"
 */

import { useEffect } from 'react';

const SITE_NAME = 'publicpresence.org';

export function usePageTitle(title) {
  useEffect(() => {
    if (title) {
      document.title = `${title} | ${SITE_NAME}`;
    } else {
      document.title = SITE_NAME;
    }

    // Cleanup: reset to default when component unmounts
    return () => {
      document.title = SITE_NAME;
    };
  }, [title]);
}
