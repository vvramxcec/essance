import React, { useState } from 'react';
import {
  X,
  User,
  Mail,
  Lock,
  GraduationCap,
  Sparkles,
  Check,
  Bookmark,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Cloud,
  Smartphone,
  Laptop
} from 'lucide-react';
import { UserAccount } from '../types';
import {
  STUDY_TRACKS,
  AVAILABLE_INTERESTS,
  DEMO_USERS,
  registerUser,
  loginUser,
  updateUserProfile,
  loginWithGoogle,
  logoutUser
} from '../services/authService';
import { auth } from '../services/firebase';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  onUserChange: (user: UserAccount | null) => void;
  guestBookmarksCount: number;
  guestBookmarkIds: number[];
  initialMode?: 'signin' | 'register' | 'profile';
}

export default function AccountModal({
  isOpen,
  onClose,
  currentUser,
  onUserChange,
  guestBookmarksCount,
  guestBookmarkIds,
  initialMode = 'register'
}: AccountModalProps) {
  const [mode, setMode] = useState<'signin' | 'register' | 'profile'>(
    currentUser ? 'profile' : initialMode
  );

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studyTrack, setStudyTrack] = useState(currentUser?.studyTrack || STUDY_TRACKS[0]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    currentUser?.interests || ['LLMs', 'Machine Learning', 'Deep Learning']
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  if (!isOpen) return null;

  const isCloudSynced = Boolean(auth.currentUser && currentUser && auth.currentUser.uid === currentUser.id);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);
    try {
      const res = await loginWithGoogle(guestBookmarkIds);
      if (res.success && res.user) {
        onUserChange(res.user);
        setSuccessNotice(`Signed in with Google! Your data is synced across all devices.`);
        setTimeout(() => {
          onClose();
          setSuccessNotice(null);
        }, 1200);
      } else {
        setErrorMessage(res.error || 'Failed to sign in with Google.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Google sign in encountered an error.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const result = registerUser(
      name,
      email,
      password,
      studyTrack,
      selectedInterests,
      guestBookmarkIds
    );

    if (result.success && result.user) {
      onUserChange(result.user);
      setSuccessNotice('Account created successfully! Your personalized feed is ready.');
      setTimeout(() => {
        onClose();
        setSuccessNotice(null);
      }, 1200);
    } else {
      setErrorMessage(result.error || 'Failed to create account.');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const result = loginUser(email, password);
    if (result.success && result.user) {
      onUserChange(result.user);
      setSuccessNotice(`Welcome back, ${result.user.name}!`);
      setTimeout(() => {
        onClose();
        setSuccessNotice(null);
      }, 1000);
    } else {
      setErrorMessage(result.error || 'Invalid credentials.');
    }
  };

  const handleDemoLogin = (demoUser: UserAccount) => {
    onUserChange(demoUser);
    setSuccessNotice(`Signed in as ${demoUser.name} (${demoUser.studyTrack})!`);
    setTimeout(() => {
      onClose();
      setSuccessNotice(null);
    }, 1000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const updated = await updateUserProfile(currentUser.id, {
      studyTrack,
      interests: selectedInterests
    });

    if (updated) {
      onUserChange(updated);
      setSuccessNotice('Preferences saved and synced to cloud! Feed adapted.');
      setTimeout(() => setSuccessNotice(null), 3000);
    }
  };

  const handleSignOut = async () => {
    await logoutUser();
    onUserChange(null);
    setMode('signin');
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-info">
            <div className="modal-badge-icon">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="modal-title">
                {mode === 'profile'
                  ? 'Your Student Profile'
                  : mode === 'register'
                  ? 'Create Student Account'
                  : 'Welcome Back'}
              </h2>
              <p className="modal-subtitle">
                {mode === 'profile'
                  ? 'Cross-device sync is active. Your saved posts and reading goals stay updated on all devices.'
                  : mode === 'register'
                  ? 'Sign in or create an account to sync your saved summaries across phone and computer.'
                  : 'Sign in to access your cloud-synced saved reading library and personalized feed.'}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Modal Tabs if not in profile view */}
        {mode !== 'profile' && (
          <div className="modal-nav-tabs">
            <button
              className={`modal-nav-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => {
                setMode('register');
                setErrorMessage(null);
              }}
            >
              Create Account
            </button>
            <button
              className={`modal-nav-tab ${mode === 'signin' ? 'active' : ''}`}
              onClick={() => {
                setMode('signin');
                setErrorMessage(null);
              }}
            >
              Sign In
            </button>
          </div>
        )}

        {/* Feedback Notices */}
        {errorMessage && <div className="modal-alert danger">{errorMessage}</div>}
        {successNotice && <div className="modal-alert success">{successNotice}</div>}

        {/* ── Google Fast Sign-In / Cross-Device Sync Hero (Visible in register and signin) ── */}
        {mode !== 'profile' && (
          <div className="cross-device-sync-banner">
            <div className="sync-banner-text">
              <div className="sync-banner-title">
                <Cloud size={16} className="text-primary" />
                <span>Cross-Device Cloud Sync</span>
              </div>
              <p className="sync-banner-desc">
                Log in from different devices (laptop, tablet, phone) with Google to keep your saved library and personalized recommendations in sync.
              </p>
            </div>
            <button
              type="button"
              className="google-signin-btn"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" className="google-icon">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google (Cloud Sync)'}</span>
            </button>
            <div className="sync-devices-indicator">
              <span className="device-chip"><Laptop size={12} /> Computer</span>
              <span className="sync-arrow">↔</span>
              <span className="device-chip"><Smartphone size={12} /> Mobile Phone</span>
            </div>
            <div className="sync-divider">
              <span>or sign in with email credentials</span>
            </div>
          </div>
        )}

        {/* ── CREATE ACCOUNT FORM ── */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="modal-body-scroll">
            {guestBookmarksCount > 0 && (
              <div className="guest-transfer-pill">
                <Bookmark size={14} />
                <span>
                  <strong>{guestBookmarksCount} saved summaries</strong> from your current session
                  will be linked to your new account.
                </span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="input-with-icon">
                <User size={16} className="field-icon" />
                <input
                  type="text"
                  placeholder="e.g. Alex Chen"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Student or University Email</label>
              <div className="input-with-icon">
                <Mail size={16} className="field-icon" />
                <input
                  type="email"
                  placeholder="name@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-with-icon">
                <Lock size={16} className="field-icon" />
                <input
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <GraduationCap size={15} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                Your Major or Learning Track
              </label>
              <select
                value={studyTrack}
                onChange={(e) => setStudyTrack(e.target.value)}
                className="form-select"
              >
                {STUDY_TRACKS.map((track) => (
                  <option key={track} value={track}>
                    {track}
                  </option>
                ))}
              </select>
              <span className="form-hint">
                Prioritizes technical depth and categories relevant to your field.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">
                Topics of Interest (LKPNR Knowledge Graph)
              </label>
              <div className="interests-grid">
                {AVAILABLE_INTERESTS.map((interest) => {
                  const isSelected = selectedInterests.includes(interest);
                  return (
                    <button
                      type="button"
                      key={interest}
                      className={`interest-pill ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleInterest(interest)}
                    >
                      {isSelected ? <Check size={12} /> : <span>+</span>}
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="modal-actions">
              <button type="submit" className="modal-btn-primary">
                Create Account & Personalize Feed
              </button>
            </div>
          </form>
        )}

        {/* ── SIGN IN FORM ── */}
        {mode === 'signin' && (
          <form onSubmit={handleLogin} className="modal-body-scroll">
            <div className="form-group">
              <label className="form-label">Email</label>
              <div className="input-with-icon">
                <Mail size={16} className="field-icon" />
                <input
                  type="email"
                  placeholder="Your registered email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-with-icon">
                <Lock size={16} className="field-icon" />
                <input
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="modal-actions">
              <button type="submit" className="modal-btn-primary">
                Sign In
              </button>
            </div>

            {/* Quick Demo Student Switcher */}
            <div className="demo-users-section">
              <div className="demo-users-header">
                <ShieldCheck size={14} color="var(--primary)" />
                <span>Quick Test: Try a Pre-Configured Student Profile</span>
              </div>
              <div className="demo-buttons-list">
                {DEMO_USERS.map((demo) => (
                  <button
                    key={demo.id}
                    type="button"
                    className="demo-user-card"
                    onClick={() => handleDemoLogin(demo)}
                  >
                    <div className="demo-user-avatar">
                      {demo.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div style={{ textAlign: 'left', flex: 1 }}>
                      <div className="demo-user-name">{demo.name}</div>
                      <div className="demo-user-track">{demo.studyTrack}</div>
                    </div>
                    <ChevronRight size={16} style={{ opacity: 0.5 }} />
                  </button>
                ))}
              </div>
            </div>
          </form>
        )}

        {/* ── PROFILE & PREFERENCES VIEW ── */}
        {mode === 'profile' && currentUser && (
          <form onSubmit={handleSaveProfile} className="modal-body-scroll">
            {/* User Info Card */}
            <div className="profile-overview-card">
              <div className="profile-avatar-lg">
                {currentUser.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <h3 className="profile-user-name">{currentUser.name}</h3>
                  {isCloudSynced ? (
                    <span className="cloud-synced-pill" title="Synchronized with Firebase Firestore across devices">
                      <Cloud size={12} /> Synced to Cloud
                    </span>
                  ) : (
                    <span className="cloud-local-pill" title="Local account">
                      Local Session
                    </span>
                  )}
                </div>
                <div className="profile-user-email">{currentUser.email}</div>
                <div className="profile-badge-row">
                  <span className="profile-track-badge">{currentUser.studyTrack}</span>
                  <span className="profile-saved-badge">
                    <Bookmark size={11} fill="currentColor" />
                    {currentUser.savedArticleIds.length} Saved Posts
                  </span>
                </div>
              </div>
            </div>

            {/* If currently using a local session or demo user, offer instant cloud link */}
            {!isCloudSynced && (
              <div className="enable-cloud-sync-box">
                <div className="enable-cloud-info">
                  <Cloud size={18} className="text-primary" />
                  <div>
                    <div className="enable-cloud-title">Upgrade to Cross-Device Sync</div>
                    <div className="enable-cloud-sub">Sign in with Google to synchronize your saved articles and feed across mobile & desktop.</div>
                  </div>
                </div>
                <button
                  type="button"
                  className="google-signin-btn-sm"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                >
                  {isGoogleLoading ? 'Connecting...' : 'Sync with Google'}
                </button>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Study Track / Focus Area</label>
              <select
                value={studyTrack}
                onChange={(e) => setStudyTrack(e.target.value)}
                className="form-select"
              >
                {STUDY_TRACKS.map((track) => (
                  <option key={track} value={track}>
                    {track}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Active Tech & AI Focus Areas (Selected: {selectedInterests.length})
              </label>
              <div className="interests-grid">
                {AVAILABLE_INTERESTS.map((interest) => {
                  const isSelected = selectedInterests.includes(interest);
                  return (
                    <button
                      type="button"
                      key={interest}
                      className={`interest-pill ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleInterest(interest)}
                    >
                      {isSelected ? <Check size={12} /> : <span>+</span>}
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="modal-actions-split">
              <button type="submit" className="modal-btn-primary">
                Save & Update Feed
              </button>
              <button
                type="button"
                className="modal-btn-danger"
                onClick={handleSignOut}
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
