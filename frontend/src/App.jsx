import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import InterestClockBanner from './components/InterestClockBanner';
import ArticleCard from './components/ArticleCard';
import TrendingSidebar from './components/TrendingSidebar';
import { Bookmark, Sparkles, AlertCircle } from 'lucide-react';

const CATEGORIES = ["All", "Research", "Industry", "Deep Tech", "Tech News"];

export default function App() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [isBookmarkedView, setIsBookmarkedView] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [clockStatus, setClockStatus] = useState(null);
  const [activeClockMode, setActiveClockMode] = useState(null);
  const [trendingEntities, setTrendingEntities] = useState([]);
  const [stats, setStats] = useState(null);

  // Apply dark/light theme to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Fetch initial Clock status and stats
  const fetchAuxData = async () => {
    try {
      const [clockRes, trendingRes, statsRes] = await Promise.all([
        fetch('/api/clock-status'),
        fetch('/api/trending'),
        fetch('/api/stats')
      ]);

      if (clockRes.ok) {
        const data = await clockRes.json();
        setClockStatus(data);
        if (!activeClockMode) {
          setActiveClockMode(data.current_mode?.key);
        }
      }

      if (trendingRes.ok) {
        const data = await trendingRes.json();
        setTrendingEntities(data.trending_entities || []);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to load auxiliary data:', err);
    }
  };

  // Fetch Feed with active filters and current Interest Clock mode
  const fetchFeed = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (activeCategory && activeCategory !== "All") params.append('category', activeCategory);
      if (selectedEntity) params.append('entity', selectedEntity);
      if (isBookmarkedView) params.append('bookmarks_only', 'true');
      if (activeClockMode) params.append('time_mode', activeClockMode);

      const res = await fetch(`/api/feed?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles || []);
      }
    } catch (err) {
      console.error('Failed to fetch feed:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, activeCategory, selectedEntity, isBookmarkedView, activeClockMode]);

  useEffect(() => {
    fetchAuxData();
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  // Handle Live RSS Refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetch('/api/refresh-feeds', { method: 'POST' });
      // Short delay then reload data
      setTimeout(() => {
        fetchFeed();
        fetchAuxData();
        setIsRefreshing(false);
      }, 2500);
    } catch (err) {
      console.error('Refresh error:', err);
      setIsRefreshing(false);
    }
  };

  // Handle Bookmarks Toggle
  const handleBookmarkToggle = async (articleId, currentlyBookmarked) => {
    const eventType = currentlyBookmarked ? 'unbookmark' : 'bookmark';
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article_id: articleId,
          event_type: eventType
        })
      });

      setArticles(prev => prev.map(a => 
        a.id === articleId ? { ...a, is_bookmarked: !currentlyBookmarked } : a
      ));

      setStats(prev => prev ? {
        ...prev,
        saved_count: currentlyBookmarked ? Math.max(0, prev.saved_count - 1) : prev.saved_count + 1
      } : prev);
    } catch (err) {
      console.error('Bookmark error:', err);
    }
  };

  // Handle "Less like this" / dislike
  const handleDislike = async (articleId) => {
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article_id: articleId,
          event_type: 'dislike'
        })
      });
      // Remove from active feed immediately
      setArticles(prev => prev.filter(a => a.id !== articleId));
    } catch (err) {
      console.error('Dislike error:', err);
    }
  };

  // Handle FeedRec Dwell Time / Click logging
  const handleDwellFeedback = async (articleId, dwellSeconds, eventType = 'dwell') => {
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article_id: articleId,
          event_type: eventType,
          dwell_seconds: dwellSeconds
        })
      });
    } catch (err) {
      console.error('Feedback error:', err);
    }
  };

  // Filter ArXiv papers for sidebar spotlight
  const arxivPapers = articles.filter(a => a.source_name.includes('ArXiv'));

  return (
    <div className="app-container">
      <Navbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        isBookmarkedView={isBookmarkedView}
        setIsBookmarkedView={setIsBookmarkedView}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        savedCount={stats?.saved_count || 0}
      />

      <main className="main-content">
        <div className="feed-column">
          {/* Interest Clock Banner */}
          {!isBookmarkedView && (
            <InterestClockBanner
              clockStatus={clockStatus}
              activeMode={activeClockMode}
              onSelectMode={(modeKey) => setActiveClockMode(modeKey)}
            />
          )}

          {/* Bookmarked view title or Category filter tabs */}
          {isBookmarkedView ? (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: '20px',
              padding: '12px 18px',
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bookmark size={20} color="var(--primary)" fill="currentColor" />
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Saved Knowledge Library</h2>
              </div>
              <button
                className="action-btn"
                onClick={() => setIsBookmarkedView(false)}
              >
                Back to Live Feed
              </button>
            </div>
          ) : (
            <div className="filter-tabs">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  className={`tab-btn ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Active Entity Tag Filter Notification */}
          {selectedEntity && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 14px',
              marginBottom: '16px',
              background: 'var(--primary-light)',
              borderRadius: '8px',
              fontSize: '0.85rem',
              color: 'var(--primary)',
              fontWeight: 600
            }}>
              <span>Filtered by concept: #{selectedEntity}</span>
              <button 
                onClick={() => setSelectedEntity(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 700 }}
              >
                Clear ✕
              </button>
            </div>
          )}

          {/* Articles Feed */}
          {loading ? (
            <div className="loading-box">
              <div className="spinner" />
              <p>Curating high-signal Tech & AI summaries...</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="empty-state">
              <AlertCircle size={32} style={{ margin: '0 auto 12px', opacity: 0.6 }} />
              <h3>No articles found</h3>
              <p style={{ marginTop: '6px', fontSize: '0.88rem' }}>
                {isBookmarkedView 
                  ? "You haven't saved any summaries yet. Click the bookmark icon on any card to save it."
                  : "Try clearing your search term or concept filters."
                }
              </p>
            </div>
          ) : (
            articles.map(article => (
              <ArticleCard
                key={article.id}
                article={article}
                onEntityClick={(entity) => setSelectedEntity(entity)}
                onBookmarkToggle={handleBookmarkToggle}
                onDislike={handleDislike}
                onDwellFeedback={handleDwellFeedback}
              />
            ))
          )}
        </div>

        {/* Sticky Sidebar */}
        <div className="sidebar-column">
          <TrendingSidebar
            trendingEntities={trendingEntities}
            selectedEntity={selectedEntity}
            onSelectEntity={(entity) => setSelectedEntity(entity)}
            stats={stats}
            arxivPapers={arxivPapers}
          />
        </div>
      </main>
    </div>
  );
}
