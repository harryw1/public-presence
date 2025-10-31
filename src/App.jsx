/**
 * App.jsx - Main application component
 * 
 * This component sets up:
 * - React Router for navigation between pages
 * - Layout structure (Header, main content, Footer)
 * - Route definitions for all pages
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Blog from './pages/Blog';
import Post from './pages/Post';
import About from './pages/About';
import './styles/index.css';

/**
 * Main App component
 * 
 * BrowserRouter provides routing context for the entire application
 * Routes define which component to render for each URL path
 */
function App() {
  return (
    <BrowserRouter>
      {/* Header appears on all pages */}
      <Header />
      
      {/* Main content area - different for each route */}
      <Routes>
        {/* Homepage route */}
        <Route path="/" element={<Home />} />
        
        {/* Blog archive route */}
        <Route path="/blog" element={<Blog />} />
        
        {/* Individual blog post route
            :slug is a dynamic parameter that matches any post slug
            Example: /blog/my-first-post */}
        <Route path="/blog/:slug" element={<Post />} />
        
        {/* About page route */}
        <Route path="/about" element={<About />} />
        
        {/* 404 fallback - catches any undefined routes */}
        <Route path="*" element={
          <div className="main-content">
            <div className="container">
              <h1>404 - Page Not Found</h1>
              <p>The page you're looking for doesn't exist.</p>
              <a href="/" className="read-more">← Go home</a>
            </div>
          </div>
        } />
      </Routes>
      
      {/* Footer appears on all pages */}
      <Footer />
    </BrowserRouter>
  );
}

export default App;

