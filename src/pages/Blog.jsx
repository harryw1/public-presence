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
import { X } from 'lucide-react';
import PostCard from '../components/PostCard';
import { getAllPosts, getAllTags, searchPosts, getPostsByTag } from '../utils/posts';
import { usePageTitle } from '../hooks/usePageTitle';

function Blog() {
  // Set page title
  usePageTitle('Blog Archive');
  // Get URL search parameters (for tag filtering via URL)
  // Example: /blog?tag=sustainability
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State management
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState(
    searchParams.get('tags') ? searchParams.get('tags').split(',') : []
  );
  const [allTags, setAllTags] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Load posts and tags when component mounts
  useEffect(() => {
    async function loadData() {
      try {
        const [loadedPosts, loadedTags] = await Promise.all([
          getAllPosts(),
          getAllTags()
        ]);
        setPosts(loadedPosts);
        setFilteredPosts(loadedPosts);
        setAllTags(loadedTags);
      } catch (error) {
        console.error('Failed to load blog data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);
  
  /**
   * Effect hook: Filter posts when search query or selected tags change
   * This runs whenever searchQuery or selectedTags state updates
   */
  useEffect(() => {
    async function filterPosts() {
      if (posts.length === 0) return;

      let result = posts;

      // Apply tag filters if any tags are selected
      if (selectedTags.length > 0) {
        // Filter posts that have at least one of the selected tags
        result = posts.filter(post =>
          selectedTags.some(tag => post.tags.includes(tag))
        );
      }

      // Apply search filter if there's a search query
      if (searchQuery.trim()) {
        const searchResults = await searchPosts(searchQuery);

        // If both tags and search are active, combine filters
        if (selectedTags.length > 0) {
          result = searchResults.filter(post =>
            selectedTags.some(tag => post.tags.includes(tag))
          );
        } else {
          result = searchResults;
        }
      }

      setFilteredPosts(result);
    }

    filterPosts();
  }, [searchQuery, selectedTags, posts]);
  
  /**
   * Handle tag selection - now supports multiple tags
   * Updates both component state and URL parameters
   */
  const handleTagClick = (tag) => {
    let newSelectedTags;

    if (selectedTags.includes(tag)) {
      // If tag is already selected, remove it
      newSelectedTags = selectedTags.filter(t => t !== tag);
    } else {
      // Add new tag to selection
      newSelectedTags = [...selectedTags, tag];
    }

    setSelectedTags(newSelectedTags);

    // Update URL params
    if (newSelectedTags.length > 0) {
      setSearchParams({ tags: newSelectedTags.join(',') });
    } else {
      setSearchParams({});
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
    setSelectedTags([]);
    setSearchParams({});
  };
  
  return (
    <div className="main-content">
      <div className="container">
        {/* Page header */}
        <div className="blog-header">
          <h1>Blog Archive</h1>
          {!loading && (
            <p className="text-muted">
              {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'}
              {selectedTags.length > 0 && ` tagged with ${selectedTags.map(t => `"${t}"`).join(', ')}`}
              {searchQuery && ` matching "${searchQuery}"`}
            </p>
          )}
        </div>
        
        {loading ? (
          <p className="loading">Loading posts...</p>
        ) : (
          <>
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
          {(searchQuery || selectedTags.length > 0) && (
            <button
              onClick={clearFilters}
              className="tag tag-filter"
              style={{ cursor: 'pointer' }}
              aria-label="Clear all filters"
            >
              Clear filters <X size={14} aria-hidden="true" />
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
                className={`tag tag-filter ${selectedTags.includes(tag) ? 'active' : ''}`}
                aria-pressed={selectedTags.includes(tag)}
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
              {(searchQuery || selectedTags.length > 0) && (
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
          </>
        )}
      </div>
    </div>
  );
}

export default Blog;
