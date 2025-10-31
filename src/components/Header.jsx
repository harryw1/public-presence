/**
 * Header.jsx - Site header with navigation
 *
 * This component appears at the top of every page and provides:
 * - Site branding (title)
 * - Navigation links (Home, Blog, About)
 * - Active link highlighting using React Router
 * - Mobile hamburger menu
 */

import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

/**
 * Header component
 * Uses NavLink from react-router-dom which automatically adds 'active' class
 * to the current route, enabling visual feedback for navigation
 */
function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="site-header">
      <div className="container">
        {/* Site branding - links to homepage */}
        <div className="site-title">
          <Link to="/" onClick={closeMobileMenu}>publicpresence.org</Link>
        </div>

        {/* Mobile menu toggle button */}
        <button
          className="mobile-menu-toggle"
          onClick={toggleMobileMenu}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Main navigation
            NavLink automatically adds 'active' class when route matches
            This allows CSS to style the active page differently */}
        <nav className={`site-nav ${mobileMenuOpen ? 'mobile-nav-open' : ''}`}>
          <NavLink
            to="/"
            end  // 'end' prop ensures only exact match gets 'active' class
            className={({ isActive }) => isActive ? 'active' : ''}
            onClick={closeMobileMenu}
          >
            Home
          </NavLink>

          <NavLink
            to="/blog"
            className={({ isActive }) => isActive ? 'active' : ''}
            onClick={closeMobileMenu}
          >
            Blog
          </NavLink>

          <NavLink
            to="/about"
            className={({ isActive }) => isActive ? 'active' : ''}
            onClick={closeMobileMenu}
          >
            About
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

export default Header;
