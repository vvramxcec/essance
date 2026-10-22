import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import InterestClockBanner from './components/InterestClockBanner';
import ArticleCard from './components/ArticleCard';
import TrendingSidebar from './components/TrendingSidebar';
import { Bookmark, AlertCircle } from 'lucide-react';

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

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

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
        if (!activeClockMode) setActiveClockMode(data.current_mode?.key);
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
      console.error('Aux fetch failed:', err);
    }
  };

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
      console.error('Feed fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, activeCategory, selectedEntity, isBookmarkedView, activeClockMode]);

  useEffect(() => { fetchAuxData(); }, []);
  useEffect(() => { fetchFeed(); }, [fetchFeed]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetch('/api/refresh-feeds', { method: 'POST' });
      setTimeout(() => {
        fetchFeed();
        fetchAuxData();
        setIsRefreshing(false);
      }, 2500);
    } catch (err) {
      setIsRefreshing(false);
    }
  };

  const handleBookmarkToggle = async (articleId, currentlyBookmarked) => {
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: articleId, event_type: currentlyBookmarked ? 'unbookmark' : 'bookmark' })
      });
      setArticles(prev => prev.map(a =>
        a.id === articleId ? { ...a, is_bookmarked: !currentlyBookmarked } : a
      ));
      setStats(prev => prev ? {
        ...prev,
        saved_count: currentlyBookmarked ? Math.max(0, prev.saved_count - 1) : prev.saved_count + 1
      } : prev);
    } catch (err) { console.error(err); }
  };

  const handleDislike = async (articleId) => {
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: articleId, event_type: 'dislike' })
      });
      setArticles(prev => prev.filter(a => a.id !== articleId));
    } catch (err) { console.error(err); }
  };

  const handleDwellFeedback = async (articleId, dwellSeconds, eventType = 'dwell') => {
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: articleId, event_type: eventType, dwell_seconds: dwellSeconds })
      });
    } catch (err) { console.error(err); }
  };

  // Assign layout roles: first = hero, every 5th = wide, rest = normal
  const getCardVariant = (index) => {
    if (index === 0) return 'hero';
    if (index === 3 || index === 7) return 'wide';
    return 'normal';
  };

  const arxivPapers = articles.filter(a => a.source_name?.includes('ArXiv'));
  const recentForSidebar = articles.slice(0, 6);

  const feedLabel = isBookmarkedView
    ? 'Saved Library'
    : activeClockMode === 'morning' ? 'Morning Radar'
    : activeClockMode === 'afternoon' ? 'Deep Lab'
    : activeClockMode === 'night' ? 'Night Horizon'
    : 'For You';

  return (
    <div className="app-container">
      <Navbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        isBookmarkedView={isBookmarkedView}
        setIsBookmarkedView={(v) => { setIsBookmarkedView(v); if (!v) setSearchTerm(''); }}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        savedCount={stats?.saved_count || 0}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
      />

      <main className="main-content">
        {/* ── Feed Column ── */}
        <div className="feed-column">
          {!isBookmarkedView && (
            <InterestClockBanner
              clockStatus={clockStatus}
              activeMode={activeClockMode}
              onSelectMode={setActiveClockMode}
            />
          )}

          {/* Section header (BreakN style) */}
          <div className="section-header">
            <h1 className="section-title">
              {isBookmarkedView ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Bookmark size={28} fill="currentColor" />
                  Saved Library
                </span>
              ) : feedLabel}
            </h1>
            <span className="section-count">{articles.length} summaries</span>
          </div>

          {!isBookmarkedView && (
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

          {isBookmarkedView && (
            <div className="bookmarks-header" style={{ gridColumn: '1/-1' }}>
              <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                {articles.length} articles saved for study & reference
              </span>
              <button className="action-btn" onClick={() => setIsBookmarkedView(false)}>
                ← Back to Feed
              </button>
            </div>
          )}

          {selectedEntity && (
            <div className="filter-active-bar">
              <span>Filtered by: #{selectedEntity}</span>
              <button className="filter-clear-btn" onClick={() => setSelectedEntity(null)}>✕ Clear</button>
            </div>
          )}

          {/* Editorial Grid Feed */}
          {loading ? (
            <div className="loading-box">
              <div className="spinner" />
              <p style={{ fontWeight: 600 }}>Curating Tech & AI summaries…</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="empty-state">
              <AlertCircle size={28} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
              <h3 style={{ fontWeight: 700, marginBottom: 6 }}>Nothing here yet</h3>
              <p style={{ fontSize: '0.86rem' }}>
                {isBookmarkedView
                  ? "Save articles while reading to build your knowledge library."
                  : "Try clearing your filters or syncing new feeds."}
              </p>
            </div>
          ) : (
            <div className="editorial-grid">
              {articles.map((article, index) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  variant={getCardVariant(index)}
                  onEntityClick={(entity) => setSelectedEntity(entity)}
                  onBookmarkToggle={handleBookmarkToggle}
                  onDislike={handleDislike}
                  onDwellFeedback={handleDwellFeedback}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="sidebar-column">
          <TrendingSidebar
            trendingEntities={trendingEntities}
            selectedEntity={selectedEntity}
            onSelectEntity={(entity) => setSelectedEntity(entity === selectedEntity ? null : entity)}
            stats={stats}
            recentArticles={recentForSidebar}
            arxivPapers={arxivPapers}
          />
        </div>
      </main>
    </div>
  );
}
