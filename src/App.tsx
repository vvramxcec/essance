import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Navbar from './components/Navbar';
import InterestClockBanner from './components/InterestClockBanner';
import ArticleCard from './components/ArticleCard';
import TrendingSidebar from './components/TrendingSidebar';
import AccountModal from './components/AccountModal';
import { Bookmark, AlertCircle, Sparkles, SlidersHorizontal, LayoutGrid, List } from 'lucide-react';
import { Article, ClockStatus, DigestStats, TimeModeKey, TrendingEntity, UserAccount } from './types';
import { getClockStatus, rankArticlesForStudent } from './services/recommender';
import {
  loadArticles,
  saveArticles,
  getBookmarks,
  saveBookmarks,
  getDislikes,
  saveDislikes,
  logFeedback,
  calculateUserEntityScores,
  getTrendingEntities,
  getDigestStats
} from './services/storageService';
import { fetchLiveFeeds } from './services/rssService';
import {
  getCurrentUser,
  setCurrentUser,
  toggleUserBookmark,
  toggleUserDislike,
  initAuthSync
} from './services/authService';

const CATEGORIES = ['All', 'Research', 'Industry', 'Deep Tech', 'Tech News'];

export default function App() {
  const [currentUser, setCurrentUserState] = useState<UserAccount | null>(null);
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [guestBookmarks, setGuestBookmarks] = useState<number[]>([]);
  const [guestDislikes, setGuestDislikes] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [isBookmarkedView, setIsBookmarkedView] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');

  const [clockStatus, setClockStatus] = useState<ClockStatus | null>(null);
  const [activeClockMode, setActiveClockMode] = useState<TimeModeKey | null>(null);

  // Auth modal
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'register' | 'profile'>('register');

  // Sync theme attribute to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Initial load and real-time cloud sync
  useEffect(() => {
    const loaded = loadArticles();
    const storedGuestBookmarks = getBookmarks();
    const storedGuestDislikes = getDislikes();
    const clock = getClockStatus();
    const activeUser = getCurrentUser();

    setAllArticles(loaded);
    setGuestBookmarks(storedGuestBookmarks);
    setGuestDislikes(storedGuestDislikes);
    setCurrentUserState(activeUser);
    setClockStatus(clock);
    setActiveClockMode(clock.current_mode.key);
    setLoading(false);

    // Subscribe to Firebase real-time auth and Firestore sync
    const unsubscribe = initAuthSync((syncedUser) => {
      setCurrentUserState(syncedUser);
    }, storedGuestBookmarks);

    return () => {
      unsubscribe();
    };
  }, []);

  // Active bookmarks & dislikes depend on whether a user is logged in
  const activeBookmarks = useMemo(() => {
    if (currentUser) {
      return currentUser.savedArticleIds || [];
    }
    return guestBookmarks;
  }, [currentUser, guestBookmarks]);

  const activeDislikes = useMemo(() => {
    if (currentUser) {
      return currentUser.dislikedArticleIds || [];
    }
    return guestDislikes;
  }, [currentUser, guestDislikes]);

  // User entity affinity scores based on active bookmarks
  const userEntityScores = useMemo(() => {
    return calculateUserEntityScores(allArticles, activeBookmarks);
  }, [allArticles, activeBookmarks]);

  // Compute trending entities
  const trendingEntities: TrendingEntity[] = useMemo(() => {
    return getTrendingEntities(allArticles);
  }, [allArticles]);

  // Compute digest stats
  const stats: DigestStats = useMemo(() => {
    return getDigestStats(allArticles, activeBookmarks);
  }, [allArticles, activeBookmarks]);

  // Filtered and ranked articles feed
  const displayArticles: Article[] = useMemo(() => {
    // Exclude disliked articles
    let filtered = allArticles.filter((a) => !activeDislikes.includes(a.id));

    // Bookmarks only view
    if (isBookmarkedView) {
      filtered = filtered.filter((a) => activeBookmarks.includes(a.id));
    }

    // Category filter
    if (activeCategory && activeCategory !== 'All') {
      filtered = filtered.filter((a) => a.category === activeCategory);
    }

    // Entity filter
    if (selectedEntity) {
      filtered = filtered.filter(
        (a) => a.entities && a.entities.some((e) => e.toLowerCase() === selectedEntity.toLowerCase())
      );
    }

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(term) ||
          a.extreme_summary.toLowerCase().includes(term) ||
          (a.bullet_points && a.bullet_points.some((b) => b.toLowerCase().includes(term))) ||
          (a.entities && a.entities.some((e) => e.toLowerCase().includes(term)))
      );
    }

    // Map bookmark flag
    const mapped = filtered.map((a) => ({
      ...a,
      is_bookmarked: activeBookmarks.includes(a.id)
    }));

    // Multi-objective recommendation ranking taking user account into account
    return rankArticlesForStudent(mapped, userEntityScores, activeClockMode, currentUser);
  }, [
    allArticles,
    activeDislikes,
    activeBookmarks,
    isBookmarkedView,
    activeCategory,
    selectedEntity,
    searchTerm,
    userEntityScores,
    activeClockMode,
    currentUser
  ]);

  // Refresh feeds handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setSyncNotice(null);
    try {
      const { newArticles, updatedList, count } = await fetchLiveFeeds(allArticles);
      if (count > 0) {
        setAllArticles(updatedList);
        saveArticles(updatedList);
        setSyncNotice(`Synced ${count} new Tech & AI breakthrough summaries!`);
      } else {
        setSyncNotice('All feeds are currently up-to-date with latest releases.');
      }
    } catch {
      setSyncNotice('Feed sync complete.');
    } finally {
      setIsRefreshing(false);
      setTimeout(() => setSyncNotice(null), 4000);
    }
  };

  // Bookmark toggle
  const handleBookmarkToggle = useCallback(
    async (articleId: number, currentlyBookmarked: boolean) => {
      if (currentUser) {
        const { user } = await toggleUserBookmark(currentUser.id, articleId);
        if (user) {
          setCurrentUserState(user);
        }
      } else {
        const updated = currentlyBookmarked
          ? guestBookmarks.filter((id) => id !== articleId)
          : [...guestBookmarks, articleId];

        setGuestBookmarks(updated);
        saveBookmarks(updated);
      }

      logFeedback({
        article_id: articleId,
        event_type: currentlyBookmarked ? 'unbookmark' : 'bookmark',
        userId: currentUser?.id
      });

      setAllArticles((prev) =>
        prev.map((a) => {
          if (a.id === articleId) {
            const saves = currentlyBookmarked ? Math.max(0, a.saves_count - 1) : a.saves_count + 1;
            return { ...a, saves_count: saves, is_bookmarked: !currentlyBookmarked };
          }
          return a;
        })
      );
    },
    [currentUser, guestBookmarks]
  );

  // Dislike / hide article
  const handleDislike = useCallback(
    async (articleId: number) => {
      if (currentUser) {
        const updatedUser = await toggleUserDislike(currentUser.id, articleId);
        if (updatedUser) {
          setCurrentUserState(updatedUser);
        }
      } else {
        const updated = [...guestDislikes, articleId];
        setGuestDislikes(updated);
        saveDislikes(updated);
      }

      logFeedback({
        article_id: articleId,
        event_type: 'dislike',
        userId: currentUser?.id
      });

      setAllArticles((prev) =>
        prev.map((a) => (a.id === articleId ? { ...a, dislikes_count: a.dislikes_count + 1 } : a))
      );
    },
    [currentUser, guestDislikes]
  );

  // Dwell / click feedback
  const handleDwellFeedback = useCallback(
    (articleId: number, dwellSeconds: number, eventType: 'dwell' | 'click' = 'dwell') => {
      logFeedback({
        article_id: articleId,
        event_type: eventType,
        dwell_seconds: dwellSeconds,
        userId: currentUser?.id
      });

      setAllArticles((prev) =>
        prev.map((a) => {
          if (a.id === articleId) {
            if (eventType === 'click') {
              return { ...a, clicks_count: (a.clicks_count || 0) + 1 };
            }
            const count = a.dwell_count || 0;
            const newAvg = (a.avg_dwell_seconds * count + dwellSeconds) / (count + 1);
            return {
              ...a,
              avg_dwell_seconds: Math.round(newAvg * 10) / 10,
              dwell_count: count + 1
            };
          }
          return a;
        })
      );
    },
    [currentUser]
  );

  // First article is hero; all other articles are balanced cards that fill the grid seamlessly without gaps
  const getCardVariant = (index: number): 'hero' | 'normal' => {
    if (index === 0) return 'hero';
    return 'normal';
  };

  const arxivPapers = useMemo(
    () => allArticles.filter((a) => a.source_name.includes('ArXiv')),
    [allArticles]
  );
  const recentForSidebar = useMemo(() => allArticles.slice(0, 6), [allArticles]);

  const feedLabel = isBookmarkedView
    ? 'Saved Library'
    : activeClockMode === 'morning'
    ? 'Morning Radar'
    : activeClockMode === 'afternoon'
    ? 'Deep Lab'
    : activeClockMode === 'night'
    ? 'Night Horizon'
    : 'For You';

  const handleOpenAuthModal = (mode: 'signin' | 'register' | 'profile') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleUserChange = (user: UserAccount | null) => {
    setCurrentUserState(user);
    setCurrentUser(user);
  };

  const handleSignOut = () => {
    setCurrentUserState(null);
    setCurrentUser(null);
  };

  return (
    <div className="app-container">
      <Navbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        isBookmarkedView={isBookmarkedView}
        setIsBookmarkedView={(v) => {
          setIsBookmarkedView(v);
          if (!v) setSearchTerm('');
        }}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        savedCount={stats.saved_count}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        currentUser={currentUser}
        onOpenAuthModal={handleOpenAuthModal}
        onSignOut={handleSignOut}
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

          {/* User Personalization Banner */}
          {currentUser && !isBookmarkedView && (
            <div className="personalized-user-banner">
              <div className="personalized-user-content">
                <div className="personalized-avatar-sm">
                  {currentUser.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div className="personalized-text-block">
                  <div className="personalized-title">
                    Personalized for <strong>{currentUser.name}</strong> •{' '}
                    <span className="personalized-track-pill">{currentUser.studyTrack}</span>
                  </div>
                  <div className="personalized-tags">
                    Focus: {currentUser.interests.slice(0, 4).map((i) => `#${i}`).join(' ')}
                    {currentUser.interests.length > 4 && ` +${currentUser.interests.length - 4} more`}
                  </div>
                </div>
              </div>
              <button
                className="personalized-tune-btn"
                onClick={() => handleOpenAuthModal('profile')}
                title="Change research interests and major"
              >
                <SlidersHorizontal size={13} />
                <span>Customize Focus</span>
              </button>
            </div>
          )}

          {/* Guest Account Callout if not logged in and has bookmarks */}
          {!currentUser && guestBookmarks.length > 0 && !isBookmarkedView && (
            <div className="guest-account-prompt">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={16} color="var(--primary)" />
                <span>
                  You have <strong>{guestBookmarks.length} saved summaries</strong> in this browser.
                  Create an account to keep them forever and get personalized research rankings.
                </span>
              </div>
              <button
                className="guest-prompt-btn"
                onClick={() => handleOpenAuthModal('register')}
              >
                Create Account
              </button>
            </div>
          )}

          {syncNotice && (
            <div className="sync-notice-bar">
              <span>{syncNotice}</span>
              <button
                onClick={() => setSyncNotice(null)}
                className="sync-notice-close"
              >
                ✕
              </button>
            </div>
          )}

          {/* Section header with View Mode switcher */}
          <div className="section-header">
            <div>
              <h1 className="section-title">
                {isBookmarkedView ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Bookmark size={28} fill="currentColor" />
                    {currentUser ? `${currentUser.name.split(' ')[0]}'s Saved Library` : 'Saved Library'}
                  </span>
                ) : (
                  feedLabel
                )}
              </h1>
              <span className="section-count">{displayArticles.length} high-signal summaries</span>
            </div>

            <div className="view-mode-selector">
              <button
                className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Editorial Card Grid"
              >
                <LayoutGrid size={15} />
                <span>Grid</span>
              </button>
              <button
                className={`view-mode-btn ${viewMode === 'compact' ? 'active' : ''}`}
                onClick={() => setViewMode('compact')}
                title="Compact List View"
              >
                <List size={15} />
                <span>Compact</span>
              </button>
            </div>
          </div>

          {!isBookmarkedView && (
            <div className="filter-tabs">
              {CATEGORIES.map((cat) => (
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
            <div className="bookmarks-header">
              <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                {displayArticles.length} articles saved for study & reference
                {currentUser && ` (${currentUser.email})`}
              </span>
              <button className="action-btn" onClick={() => setIsBookmarkedView(false)}>
                ← Back to Feed
              </button>
            </div>
          )}

          {selectedEntity && (
            <div className="filter-active-bar">
              <span>Filtered by: #{selectedEntity}</span>
              <button className="filter-clear-btn" onClick={() => setSelectedEntity(null)}>
                ✕ Clear
              </button>
            </div>
          )}

          {/* Editorial Grid / Compact Feed */}
          {loading ? (
            <div className="loading-box">
              <div className="spinner" />
              <p style={{ fontWeight: 600 }}>Curating Tech & AI summaries…</p>
            </div>
          ) : displayArticles.length === 0 ? (
            <div className="empty-state">
              <AlertCircle size={28} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
              <h3 style={{ fontWeight: 700, marginBottom: 6 }}>Nothing here yet</h3>
              <p style={{ fontSize: '0.86rem' }}>
                {isBookmarkedView
                  ? 'Save articles while reading to build your knowledge library.'
                  : 'Try clearing your filters or syncing new feeds.'}
              </p>
            </div>
          ) : (
            <div className={viewMode === 'compact' ? 'compact-feed-list' : 'editorial-grid'}>
              {displayArticles.map((article, index) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  variant={getCardVariant(index)}
                  viewMode={viewMode}
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
            onSelectEntity={(entity) =>
              setSelectedEntity(entity === selectedEntity ? null : entity)
            }
            stats={stats}
            recentArticles={recentForSidebar}
            arxivPapers={arxivPapers}
          />
        </div>
      </main>

      {/* Account Authentication & Preferences Modal */}
      <AccountModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onUserChange={handleUserChange}
        guestBookmarksCount={guestBookmarks.length}
        guestBookmarkIds={guestBookmarks}
        initialMode={authModalMode}
      />
    </div>
  );
}
