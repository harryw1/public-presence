/**
 * useSwipeNavigation.js - Custom hook for trackpad/touch swipe navigation
 *
 * Enables browser-style forward/back navigation using:
 * - Trackpad gestures (swipe left/right on MacBook, etc.)
 * - Touch gestures on mobile devices
 * - Mouse drag gestures as fallback
 *
 * Swipe right (→) = Navigate back
 * Swipe left (←) = Navigate forward
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Configuration for swipe detection
 */
const CONFIG = {
  // Minimum distance (pixels) to register as a swipe
  minSwipeDistance: 80,

  // Maximum vertical movement allowed for horizontal swipe
  maxVerticalDeviation: 100,

  // Velocity threshold (pixels per ms) for quick swipes
  minSwipeVelocity: 0.3,

  // Debounce time (ms) between swipes
  debounceTime: 300,
};

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

  useEffect(() => {
    if (!enabled) return;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let lastSwipeTime = 0;
    let isSwiping = false;

    /**
     * Determine if element is scrollable or should block swipe
     */
    const isScrollableElement = (element) => {
      // Don't interfere with scrollable content
      const scrollableElements = ['TEXTAREA', 'INPUT', 'SELECT'];
      if (scrollableElements.includes(element.tagName)) {
        return true;
      }

      // Check if element or parent is scrollable
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
     * Handle touch/pointer start
     */
    const handleStart = (e) => {
      // Ignore if starting on scrollable element
      if (isScrollableElement(e.target)) {
        return;
      }

      const point = e.touches ? e.touches[0] : e;
      touchStartX = point.clientX;
      touchStartY = point.clientY;
      touchStartTime = Date.now();
      isSwiping = false;
    };

    /**
     * Handle touch/pointer move
     */
    const handleMove = (e) => {
      if (touchStartX === 0) return;

      const point = e.touches ? e.touches[0] : e;
      const deltaX = point.clientX - touchStartX;
      const deltaY = point.clientY - touchStartY;

      // Check if this is a horizontal swipe
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
        isSwiping = true;
      }
    };

    /**
     * Handle touch/pointer end
     */
    const handleEnd = (e) => {
      if (touchStartX === 0 || !isSwiping) {
        touchStartX = 0;
        touchStartY = 0;
        touchStartTime = 0;
        isSwiping = false;
        return;
      }

      const point = e.changedTouches ? e.changedTouches[0] : e;
      const deltaX = point.clientX - touchStartX;
      const deltaY = point.clientY - touchStartY;
      const deltaTime = Date.now() - touchStartTime;
      const velocity = Math.abs(deltaX) / deltaTime;

      // Check if enough time has passed since last swipe (debounce)
      const now = Date.now();
      if (now - lastSwipeTime < CONFIG.debounceTime) {
        touchStartX = 0;
        touchStartY = 0;
        touchStartTime = 0;
        isSwiping = false;
        return;
      }

      // Check if swipe meets threshold requirements
      const isValidSwipe =
        Math.abs(deltaX) >= CONFIG.minSwipeDistance &&
        Math.abs(deltaY) <= CONFIG.maxVerticalDeviation &&
        velocity >= CONFIG.minSwipeVelocity;

      if (isValidSwipe) {
        lastSwipeTime = now;

        // Swipe right = go back
        if (deltaX > 0) {
          if (onSwipeRight) {
            onSwipeRight();
          } else if (window.history.length > 1) {
            navigate(-1);
          }
        }
        // Swipe left = go forward
        else if (deltaX < 0) {
          if (onSwipeLeft) {
            onSwipeLeft();
          } else {
            navigate(1);
          }
        }
      }

      // Reset
      touchStartX = 0;
      touchStartY = 0;
      touchStartTime = 0;
      isSwiping = false;
    };

    /**
     * Handle browser gesture events (Safari, Chrome on Mac)
     */
    const handleWheel = (e) => {
      // Detect trackpad horizontal scroll (two-finger swipe)
      // This uses wheel event with horizontal delta
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        // Check if it's a significant horizontal scroll
        if (Math.abs(e.deltaX) > 50) {
          const now = Date.now();
          if (now - lastSwipeTime < CONFIG.debounceTime) {
            return;
          }

          lastSwipeTime = now;

          // Swipe left on trackpad (deltaX negative) = go forward
          if (e.deltaX < -50) {
            navigate(1);
          }
          // Swipe right on trackpad (deltaX positive) = go back
          else if (e.deltaX > 50) {
            if (window.history.length > 1) {
              navigate(-1);
            }
          }
        }
      }
    };

    // Add event listeners
    document.addEventListener('touchstart', handleStart, { passive: true });
    document.addEventListener('touchmove', handleMove, { passive: true });
    document.addEventListener('touchend', handleEnd, { passive: true });

    // Mouse events as fallback
    document.addEventListener('mousedown', handleStart);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);

    // Wheel event for trackpad gestures
    document.addEventListener('wheel', handleWheel, { passive: true });

    // Cleanup
    return () => {
      document.removeEventListener('touchstart', handleStart);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
      document.removeEventListener('mousedown', handleStart);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('wheel', handleWheel);
    };
  }, [enabled, navigate, onSwipeLeft, onSwipeRight]);
}
