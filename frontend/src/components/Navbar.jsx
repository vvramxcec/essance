import React from 'react';
import { Sparkles, Search, Bookmark, RefreshCw, Moon, Sun } from 'lucide-react';

export default function Navbar({
  searchTerm,
  setSearchTerm,
  isRefreshing,
  onRefresh,
  isBookmarkedView,
  setIsBookmarkedView,
  darkMode,
  setDarkMode,
  savedCount
}) {
  return (
    <header className="navbar">
      <div className="nav-wrapper">
        <div 
          className="brand-section" 
          onClick={() => {
            setIsBookmarkedView(false);
            setSearchTerm('');
          }}
        >
          <div className="brand-logo">
            <Sparkles size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="brand-title">Essence</span>
              <span className="brand-badge">Tech & AI</span>
            </div>
          </div>
        </div>

        <div className="nav-search">
          <Search size={16} className="nav-search-icon" />
          <input
            type="text"
            placeholder="Search Tech & AI breakthroughs, LLMs, robotics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="nav-actions">
          <button 
            className={`btn-icon ${isBookmarkedView ? 'active' : ''}`}
            title="Saved Library"
            onClick={() => setIsBookmarkedView(!isBookmarkedView)}
            style={{ position: 'relative' }}
          >
            <Bookmark size={18} fill={isBookmarkedView ? "currentColor" : "none"} />
            {savedCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: 'var(--primary)',
                color: 'white',
                fontSize: '0.65rem',
                fontWeight: 700,
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {savedCount}
              </span>
            )}
          </button>

          <button 
            className="btn-icon" 
            title="Sync live RSS feeds"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw size={18} className={isRefreshing ? 'spin' : ''} />
          </button>

          <button 
            className="btn-icon" 
            title="Toggle Dark/Light Mode"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
}
