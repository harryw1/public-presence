/**
 * useSwipeNavigation.js - Hook for trackpad/touch swipe navigation
 *
 * Uses @use-gesture/react for robust gesture detection:
 * - Trackpad gestures (swipe left/right on MacBook, etc.)
 * - Touch gestures on mobile devices
 * - Mouse drag gestures
 *
 * Swipe left (←) = Navigate back
 * Swipe right (→) = Navigate forward
 */

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDrag, useWheel } from '@use-gesture/react';

/**
 * Custom hook that enables swipe navigation
 *
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether swipe navigation is enabled (default: true)
 * @param {Function} options.onSwipeLeft - Optional callback for left swipe
 * @param {Function} options.onSwipeRight - Optional callback for right swipe
 */
export default function useSwipeNavigation(options = {}) {
  const navigate = useNavigate();
  const {
    enabled = true,
    onSwipeLeft = null,
    onSwipeRight = null
  } = options;

  const lastNavigationTime = useRef(0);

  const debounceTime = 500;

  /**
   * Check if we should allow navigation (debounce)
   */
  const canNavigate = () => {
    const now = Date.now();
    if (now - lastNavigationTime.current < debounceTime) {
      return false;
    }
    lastNavigationTime.current = now;
    return true;
  };

  /**
   * Check if element should block swipe
   */
  const isScrollableElement = (element) => {
    if (!element) return false;

    const scrollableElements = ['TEXTAREA', 'INPUT', 'SELECT'];
    if (scrollableElements.includes(element.tagName)) {
      return true;
    }

    let currentElement = element;
    while (currentElement && currentElement !== document.body) {
      const overflow = window.getComputedStyle(currentElement).overflowX;
      if (overflow === 'auto' || overflow === 'scroll') {
        return true;
      }
      currentElement = currentElement.parentElement;
    }

    return false;
  };

  /**
   * Handle trackpad wheel gestures
   */
  useWheel(
    ({ direction: [xDir], event }) => {
      if (!enabled) return;

      // Only handle horizontal wheel movements
      if (xDir === 0) return;

      // Don't interfere with scrollable elements
      if (isScrollableElement(event.target)) return;

      if (!canNavigate()) return;

      // xDir: -1 = swipe left (back), 1 = swipe right (forward)
      if (xDir === -1) {
        // Swipe left = go back
        if (onSwipeLeft) {
          onSwipeLeft();
        } else if (window.history.length > 1) {
          navigate(-1);
        }
      } else if (xDir === 1) {
        // Swipe right = go forward
        if (onSwipeRight) {
          onSwipeRight();
        } else {
          navigate(1);
        }
      }
    },
    {
      target: document,
      eventOptions: { passive: true },
      axis: 'x', // Only track horizontal movement
      threshold: 80, // Minimum distance to trigger
      enabled,
    }
  );

  /**
   * Handle touch and mouse drag gestures
   */
  useDrag(
    ({ swipe: [swipeX], event }) => {
      if (!enabled) return;

      // Only handle horizontal swipes
      if (swipeX === 0) return;

      // Don't interfere with scrollable elements
      if (isScrollableElement(event.target)) return;

      if (!canNavigate()) return;

      // swipeX: -1 = swipe left (back), 1 = swipe right (forward)
      if (swipeX === -1) {
        // Swipe left = go back
        if (onSwipeLeft) {
          onSwipeLeft();
        } else if (window.history.length > 1) {
          navigate(-1);
        }
      } else if (swipeX === 1) {
        // Swipe right = go forward
        if (onSwipeRight) {
          onSwipeRight();
        } else {
          navigate(1);
        }
      }
    },
    {
      target: document,
      eventOptions: { passive: true },
      axis: 'x', // Only track horizontal movement
      swipe: {
        distance: 80, // Minimum distance for swipe
        velocity: 0.3, // Minimum velocity
      },
      filterTaps: true, // Don't trigger on clicks
      enabled,
    }
  );
}
