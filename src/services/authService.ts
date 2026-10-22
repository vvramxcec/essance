import { UserAccount } from '../types';
import {
  auth,
  signInWithGooglePopup,
  signOutFirebaseUser,
  getCloudUserProfile,
  setCloudUserProfile,
  updateCloudUserProfile,
  subscribeToCloudUserProfile
} from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

const STORAGE_KEY_USERS = 'essence_users_v2';
const STORAGE_KEY_CURRENT_USER = 'essence_current_user_v2';

export const STUDY_TRACKS = [
  'Computer Science & AI',
  'Robotics & Autonomous Systems',
  'Data Science & ML Engineering',
  'Quantum Computing & Physics',
  'Biotech & Computational Biology',
  'Cybersecurity & Systems',
  'General Tech & Innovation'
];

export const AVAILABLE_INTERESTS = [
  'LLMs',
  'Machine Learning',
  'Deep Learning',
  'Generative AI',
  'Computer Vision',
  'Robotics',
  'Quantum Computing',
  'Semiconductors',
  'Edge AI',
  'Transformers',
  'Cybersecurity',
  'Biotech',
  'Reinforcement Learning',
  'Neural Networks',
  'Autonomous Systems',
  'Cloud Computing',
  'Open Source'
];

export const DEMO_USERS: UserAccount[] = [
  {
    id: 'student-alex',
    name: 'Alex Chen',
    email: 'alex.chen@university.edu',
    password: 'password123',
    studyTrack: 'Computer Science & AI',
    interests: ['LLMs', 'Transformers', 'Deep Learning', 'Generative AI'],
    savedArticleIds: [1, 2, 5],
    dislikedArticleIds: [],
    readingGoalMinutes: 15,
    createdAt: '2025-05-10T08:00:00Z'
  },
  {
    id: 'student-maya',
    name: 'Maya Patel',
    email: 'maya.patel@tech.edu',
    password: 'password123',
    studyTrack: 'Robotics & Autonomous Systems',
    interests: ['Robotics', 'Computer Vision', 'Autonomous Systems', 'Edge AI'],
    savedArticleIds: [3, 10],
    dislikedArticleIds: [],
    readingGoalMinutes: 20,
    createdAt: '2025-05-12T10:30:00Z'
  }
];

function getStoredUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(DEMO_USERS));
      return DEMO_USERS;
    }
    return JSON.parse(raw);
  } catch {
    return DEMO_USERS;
  }
}

function saveStoredUsers(users: UserAccount[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  } catch {
    // ignore
  }
}

export function getCurrentUser(): UserAccount | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
    if (!raw) return null;
    const user: UserAccount = JSON.parse(raw);
    const users = getStoredUsers();
    const fresh = users.find(u => u.id === user.id);
    return fresh || user;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: UserAccount | null): void {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    }
  } catch {
    // ignore
  }
}

// Subscribe to Firebase Auth and Firestore for real-time cross-device sync
export function initAuthSync(
  onUserChanged: (user: UserAccount | null) => void,
  guestBookmarks: number[] = []
): () => void {
  let unsubscribeFirestore: (() => void) | null = null;

  const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    if (unsubscribeFirestore) {
      unsubscribeFirestore();
      unsubscribeFirestore = null;
    }

    if (!firebaseUser) {
      // Check if user was a demo user in localStorage or guest
      const current = getCurrentUser();
      if (current && (current.id.startsWith('student-') || current.id.startsWith('demo-'))) {
        onUserChanged(current);
      } else {
        setCurrentUser(null);
        onUserChanged(null);
      }
      return;
    }

    try {
      // User is logged into Firebase
      let cloudProfile = await getCloudUserProfile(firebaseUser.uid);

      if (!cloudProfile) {
        // Initial setup for new Firebase user
        const initialSaved = Array.from(new Set([...guestBookmarks, 1]));
        const newProfile: UserAccount = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'Reader',
          email: firebaseUser.email || '',
          studyTrack: 'Computer Science & AI',
          interests: ['LLMs', 'Machine Learning', 'Deep Learning'],
          savedArticleIds: initialSaved,
          dislikedArticleIds: [],
          readingGoalMinutes: 15,
          createdAt: new Date().toISOString()
        };
        await setCloudUserProfile(newProfile);
        cloudProfile = newProfile;
      } else if (guestBookmarks.length > 0) {
        // Merge guest bookmarks if any were accumulated
        const mergedSaved = Array.from(new Set([...cloudProfile.savedArticleIds, ...guestBookmarks]));
        if (mergedSaved.length !== cloudProfile.savedArticleIds.length) {
          cloudProfile.savedArticleIds = mergedSaved;
          await updateCloudUserProfile(cloudProfile.id, { savedArticleIds: mergedSaved });
        }
      }

      setCurrentUser(cloudProfile);
      onUserChanged(cloudProfile);

      // Start real-time Firestore listener so changes on another device reflect immediately
      unsubscribeFirestore = subscribeToCloudUserProfile(
        firebaseUser.uid,
        (syncedProfile) => {
          if (syncedProfile) {
            setCurrentUser(syncedProfile);
            onUserChanged(syncedProfile);
          }
        },
        (err) => console.warn('Firestore subscription fallback:', err)
      );
    } catch (err) {
      console.error('Failed to sync user with Firestore:', err);
      const fallback = getCurrentUser();
      onUserChanged(fallback);
    }
  });

  return () => {
    unsubscribeAuth();
    if (unsubscribeFirestore) {
      unsubscribeFirestore();
    }
  };
}

export async function loginWithGoogle(
  guestBookmarks: number[] = []
): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
  try {
    const firebaseUser = await signInWithGooglePopup();
    let profile = await getCloudUserProfile(firebaseUser.uid);

    if (!profile) {
      const initialSaved = Array.from(new Set([...guestBookmarks, 1]));
      profile = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || 'Student Reader',
        email: firebaseUser.email || '',
        studyTrack: 'Computer Science & AI',
        interests: ['LLMs', 'Machine Learning', 'Deep Learning'],
        savedArticleIds: initialSaved,
        dislikedArticleIds: [],
        readingGoalMinutes: 15,
        createdAt: new Date().toISOString()
      };
      await setCloudUserProfile(profile);
    }

    setCurrentUser(profile);
    return { success: true, user: profile };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    return {
      success: false,
      error: error?.message || 'Failed to sign in with Google. Please try again.'
    };
  }
}

export async function logoutUser(): Promise<void> {
  try {
    if (auth.currentUser) {
      await signOutFirebaseUser();
    }
  } catch (e) {
    console.warn('Sign-out error:', e);
  } finally {
    setCurrentUser(null);
  }
}

export function registerUser(
  name: string,
  email: string,
  password?: string,
  studyTrack: string = 'Computer Science & AI',
  interests: string[] = ['LLMs', 'Machine Learning'],
  existingGuestBookmarks: number[] = []
): { success: boolean; user?: UserAccount; error?: string } {
  if (!name.trim() || !email.trim()) {
    return { success: false, error: 'Name and email are required.' };
  }

  const users = getStoredUsers();
  if (users.some(u => u.email.toLowerCase() === email.trim().toLowerCase())) {
    return { success: false, error: 'An account with this email already exists. Try signing in.' };
  }

  const initialBookmarks = Array.from(new Set([...existingGuestBookmarks, 1]));

  const newUser: UserAccount = {
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password: password || 'studentpass',
    studyTrack,
    interests: interests.length > 0 ? interests : ['LLMs', 'Machine Learning'],
    savedArticleIds: initialBookmarks,
    dislikedArticleIds: [],
    readingGoalMinutes: 15,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveStoredUsers(users);
  setCurrentUser(newUser);

  return { success: true, user: newUser };
}

export function loginUser(
  email: string,
  password?: string
): { success: boolean; user?: UserAccount; error?: string } {
  const users = getStoredUsers();
  const cleanEmail = email.trim().toLowerCase();

  const user = users.find(u => u.email.toLowerCase() === cleanEmail);
  if (!user) {
    return { success: false, error: 'No account found with this email. Please check or sign up with Google.' };
  }

  if (password && user.password && user.password !== password) {
    return { success: false, error: 'Incorrect password. Try again.' };
  }

  setCurrentUser(user);
  return { success: true, user };
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<Pick<UserAccount, 'name' | 'studyTrack' | 'interests' | 'readingGoalMinutes'>>
): Promise<UserAccount | null> {
  // Sync to Firestore if authenticated via Firebase
  if (auth.currentUser && auth.currentUser.uid === userId) {
    try {
      await updateCloudUserProfile(userId, updates);
    } catch (err) {
      console.warn('Failed to update profile in Firestore:', err);
    }
  }

  // Update local store
  const users = getStoredUsers();
  const index = users.findIndex(u => u.id === userId);
  let updatedUser: UserAccount;
  if (index !== -1) {
    users[index] = { ...users[index], ...updates };
    saveStoredUsers(users);
    updatedUser = users[index];
  } else {
    const current = getCurrentUser();
    updatedUser = { ...(current || ({} as UserAccount)), ...updates, id: userId };
  }

  setCurrentUser(updatedUser);
  return updatedUser;
}

export async function toggleUserBookmark(userId: string, articleId: number): Promise<{
  isBookmarked: boolean;
  user: UserAccount | null;
}> {
  const current = getCurrentUser();
  const saved = current?.savedArticleIds || [];
  const exists = saved.includes(articleId);
  const updatedSaved = exists
    ? saved.filter(id => id !== articleId)
    : [...saved, articleId];

  // Sync to Firestore if authenticated in Firebase
  if (auth.currentUser && auth.currentUser.uid === userId) {
    try {
      await updateCloudUserProfile(userId, { savedArticleIds: updatedSaved });
    } catch (err) {
      console.warn('Failed to sync bookmark to Firestore:', err);
    }
  }

  const users = getStoredUsers();
  const index = users.findIndex(u => u.id === userId);
  let user: UserAccount;
  if (index !== -1) {
    users[index] = { ...users[index], savedArticleIds: updatedSaved };
    saveStoredUsers(users);
    user = users[index];
  } else if (current) {
    user = { ...current, savedArticleIds: updatedSaved };
  } else {
    return { isBookmarked: !exists, user: null };
  }

  setCurrentUser(user);
  return { isBookmarked: !exists, user };
}

export async function toggleUserDislike(userId: string, articleId: number): Promise<UserAccount | null> {
  const current = getCurrentUser();
  const disliked = current?.dislikedArticleIds || [];
  const saved = current?.savedArticleIds || [];

  const updatedDisliked = disliked.includes(articleId)
    ? disliked
    : [...disliked, articleId];
  const updatedSaved = saved.filter(id => id !== articleId);

  if (auth.currentUser && auth.currentUser.uid === userId) {
    try {
      await updateCloudUserProfile(userId, {
        dislikedArticleIds: updatedDisliked,
        savedArticleIds: updatedSaved
      });
    } catch (err) {
      console.warn('Failed to sync dislike to Firestore:', err);
    }
  }

  const users = getStoredUsers();
  const index = users.findIndex(u => u.id === userId);
  let user: UserAccount;
  if (index !== -1) {
    users[index] = { ...users[index], dislikedArticleIds: updatedDisliked, savedArticleIds: updatedSaved };
    saveStoredUsers(users);
    user = users[index];
  } else if (current) {
    user = { ...current, dislikedArticleIds: updatedDisliked, savedArticleIds: updatedSaved };
  } else {
    return null;
  }

  setCurrentUser(user);
  return user;
}
