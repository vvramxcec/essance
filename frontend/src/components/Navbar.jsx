import React from 'react';
import { Sparkles, Search, Bookmark, RefreshCw, Moon, Sun } from 'lucide-react';

const CATEGORIES = ["All", "Research", "Industry", "Deep Tech", "Tech News"];

export default function Navbar({
  searchTerm,
  setSearchTerm,
  isRefreshing,
  onRefresh,
  isBookmarkedView,
  setIsBookmarkedView,
  darkMode,
  setDarkMode,
  savedCount,
  activeCategory,
  setActiveCategory
}) {
  return (
    <header className="navbar">
      <div className="nav-wrapper">
        {/* Brand */}
        <div
          className="brand-section"
          onClick={() => { setIsBookmarkedView(false); setSearchTerm(''); }}
        >
          <div className="brand-logo">
            <Sparkles size={17} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="brand-title">
              Ess<span>ence</span>
            </span>
            <span className="brand-badge">Tech & AI</span>
          </div>
        </div>

        {/* Center: Editorial tabs (BreakN-style nav) */}
        <nav className="nav-tabs">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`nav-tab ${!isBookmarkedView && activeCategory === cat ? 'active' : ''}`}
              onClick={() => { setActiveCategory(cat); setIsBookmarkedView(false); }}
            >
              {cat}
            </button>
          ))}
        </nav>

        {/* Right actions */}
        <div className="nav-actions">
          <div className="nav-search">
            <Search size={14} className="nav-search-icon" />
            <input
              type="text"
              placeholder="Search AI, LLMs, robotics…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            className="btn-icon"
            title="Saved Library"
            onClick={() => setIsBookmarkedView(!isBookmarkedView)}
            style={{ position: 'relative', color: isBookmarkedView ? 'var(--primary)' : undefined }}
          >
            <Bookmark size={17} fill={isBookmarkedView ? "currentColor" : "none"} />
            {savedCount > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                background: 'var(--primary)', color: 'white',
                fontSize: '0.6rem', fontWeight: 800,
                width: 16, height: 16, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {savedCount}
              </span>
            )}
          </button>

          <button
            className="btn-sync"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Sync RSS feeds"
          >
            <RefreshCw size={14} style={isRefreshing ? { animation: 'spin 0.8s linear infinite' } : {}} />
            {isRefreshing ? 'Syncing…' : 'Sync'}
          </button>

          <button
            className="btn-icon"
            title="Toggle theme"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>
    </header>
  );
}
