import React, { useState, useRef, useEffect } from 'react';
import { User, Bookmark, Settings, LogOut, Sparkles, ChevronDown, Cloud } from 'lucide-react';
import { UserAccount } from '../types';
import { auth } from '../services/firebase';

interface UserMenuProps {
  currentUser: UserAccount | null;
  onOpenModal: (mode: 'signin' | 'register' | 'profile') => void;
  onViewSaved: () => void;
  isBookmarkedView: boolean;
  onSignOut: () => void;
}

export default function UserMenu({
  currentUser,
  onOpenModal,
  onViewSaved,
  isBookmarkedView,
  onSignOut
}: UserMenuProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser) {
    return (
      <div className="auth-buttons-group">
        <button
          className="btn-signin"
          onClick={() => onOpenModal('signin')}
        >
          Sign In
        </button>
        <button
          className="btn-create-account"
          onClick={() => onOpenModal('register')}
        >
          <Sparkles size={13} />
          Create Account
        </button>
      </div>
    );
  }

  const initials = currentUser.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2);

  const isCloudSynced = Boolean(auth.currentUser && auth.currentUser.uid === currentUser.id);

  return (
    <div className="user-menu-wrapper" ref={menuRef}>
      <button
        className="user-profile-btn"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        title="Account and preferences"
      >
        <div className="user-avatar-badge">{initials}</div>
        <span className="user-profile-name">{currentUser.name.split(' ')[0]}</span>
        <ChevronDown size={14} style={{ opacity: 0.6 }} />
      </button>

      {dropdownOpen && (
        <div className="user-dropdown-menu">
          {/* User Brief */}
          <div className="user-dropdown-header">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
              <div className="dropdown-user-name">{currentUser.name}</div>
              {isCloudSynced ? (
                <span title="Cloud Synced across devices via Firebase Firestore" style={{ fontSize: '0.66rem', color: '#3b82f6', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 700 }}>
                  <Cloud size={11} /> Synced
                </span>
              ) : (
                <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>Local</span>
              )}
            </div>
            <div className="dropdown-user-email">{currentUser.email}</div>
            <div className="dropdown-track-badge">{currentUser.studyTrack}</div>
          </div>

          <div className="user-dropdown-divider" />

          {/* Menu Items */}
          <button
            className={`user-dropdown-item ${isBookmarkedView ? 'active' : ''}`}
            onClick={() => {
              onViewSaved();
              setDropdownOpen(false);
            }}
          >
            <Bookmark size={15} fill={isBookmarkedView ? 'currentColor' : 'none'} />
            <span>Saved Posts ({currentUser.savedArticleIds.length})</span>
          </button>

          <button
            className="user-dropdown-item"
            onClick={() => {
              onOpenModal('profile');
              setDropdownOpen(false);
            }}
          >
            <Settings size={15} />
            <span>Learning Track & Interests</span>
          </button>

          <div className="user-dropdown-divider" />

          <button
            className="user-dropdown-item danger"
            onClick={() => {
              onSignOut();
              setDropdownOpen(false);
            }}
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
}
