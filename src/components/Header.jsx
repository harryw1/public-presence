/**
 * Header.jsx - Site header with navigation
 * 
 * This component appears at the top of every page and provides:
 * - Site branding (title)
 * - Navigation links (Home, Blog, About)
 * - Active link highlighting using React Router
 */

import { Link, NavLink } from 'react-router-dom';

/**
 * Header component
 * Uses NavLink from react-router-dom which automatically adds 'active' class
 * to the current route, enabling visual feedback for navigation
 */
function Header() {
  return (
    <header className="site-header">
      <div className="container">
        {/* Site branding - links to homepage */}
        <div className="site-title">
          <Link to="/">publicpresence.org</Link>
        </div>
        
        {/* Main navigation
            NavLink automatically adds 'active' class when route matches
            This allows CSS to style the active page differently */}
        <nav className="site-nav">
          <NavLink 
            to="/" 
            end  // 'end' prop ensures only exact match gets 'active' class
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            Home
          </NavLink>
          
          <NavLink 
            to="/blog"
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            Blog
          </NavLink>
          
          <NavLink 
            to="/about"
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            About
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

export default Header;
