/**
 * Blog.jsx - Blog archive page
 * 
 * Features:
 * - List of all blog posts (chronological, newest first)
 * - Search functionality (searches title, excerpt, content, tags)
 * - Tag filtering
 * - Displays total post count
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PostCard from '../components/PostCard';
import { getAllPosts, getAllTags, searchPosts, getPostsByTag } from '../utils/posts';

function Blog() {
  // Get URL search parameters (for tag filtering via URL)
  // Example: /blog?tag=sustainability
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State management
  const [posts, setPosts] = useState(getAllPosts());
  const [filteredPosts, setFilteredPosts] = useState(posts);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState(searchParams.get('tag') || '');
  
  // Get all unique tags for the filter interface
  const allTags = getAllTags();
  
  /**
   * Effect hook: Filter posts when search query or selected tag changes
   * This runs whenever searchQuery or selectedTag state updates
   */
  useEffect(() => {
    let result = posts;
    
    // Apply tag filter if a tag is selected
    if (selectedTag) {
      result = getPostsByTag(selectedTag);
    }
    
    // Apply search filter if there's a search query
    if (searchQuery.trim()) {
      result = searchPosts(searchQuery);
      
      // If both tag and search are active, combine filters
      if (selectedTag) {
        result = result.filter(post => post.tags.includes(selectedTag));
      }
    }
    
    setFilteredPosts(result);
  }, [searchQuery, selectedTag, posts]);
  
  /**
   * Handle tag selection
   * Updates both component state and URL parameters
   */
  const handleTagClick = (tag) => {
    if (selectedTag === tag) {
      // If clicking the same tag, deselect it
      setSelectedTag('');
      setSearchParams({}); // Clear URL params
    } else {
      // Select new tag
      setSelectedTag(tag);
      setSearchParams({ tag }); // Update URL
    }
  };
  
  /**
   * Handle search input changes
   */
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTag('');
    setSearchParams({});
  };
  
  return (
    <div className="main-content">
      <div className="container">
        {/* Page header */}
        <div className="blog-header">
          <h1>Blog Archive</h1>
          <p className="text-muted">
            {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'}
            {selectedTag && ` tagged with "${selectedTag}"`}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>
        
        {/* Search and filter bar */}
        <div className="search-filter-bar">
          {/* Search input */}
          <input
            type="text"
            placeholder="Search posts..."
            className="search-input"
            value={searchQuery}
            onChange={handleSearchChange}
            aria-label="Search blog posts"
          />
          
          {/* Clear filters button (only show if filters are active) */}
          {(searchQuery || selectedTag) && (
            <button 
              onClick={clearFilters}
              className="tag tag-filter"
              style={{ cursor: 'pointer' }}
            >
              Clear filters ✕
            </button>
          )}
        </div>
        
        {/* Tag filters */}
        {allTags.length > 0 && (
          <div className="filter-tags">
            <span className="filter-label">Filter by tag:</span>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={`tag tag-filter ${selectedTag === tag ? 'active' : ''}`}
                aria-pressed={selectedTag === tag}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
        
        {/* Posts list */}
        <div className="post-list">
          {filteredPosts.length > 0 ? (
            filteredPosts.map(post => (
              <PostCard key={post.slug} post={post} />
            ))
          ) : (
            /* No results message */
            <div className="text-center text-muted" style={{ padding: '3rem 0' }}>
              <p>No posts found matching your criteria.</p>
              {(searchQuery || selectedTag) && (
                <button 
                  onClick={clearFilters}
                  className="read-more"
                  style={{ marginTop: '1rem' }}
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Blog;
