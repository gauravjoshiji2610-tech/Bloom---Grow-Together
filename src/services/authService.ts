import type { User, UserId } from '../types';
import { GAURAV_ID, RADHIKA_ID, LEGACY_GAURAV_ID, LEGACY_RADHIKA_ID, defaultUsers } from '../data/mockData';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { storageService } from './storageService';

const SESSION_KEY = 'bloom_session';

// Allowed UIDs for Gaurav and Radhika (both primary and legacy)
const GAURAV_UIDS = new Set<string>([GAURAV_ID, LEGACY_GAURAV_ID]);
const RADHIKA_UIDS = new Set<string>([RADHIKA_ID, LEGACY_RADHIKA_ID]);
const ALLOWED_UIDS = new Set<string>([...GAURAV_UIDS, ...RADHIKA_UIDS]);

// Name to Email Mapping (supports primary, legacy, and candidate emails internally)
const INTERNAL_NAME_MAP: Record<string, { primaryUid: UserId; emails: string[]; defaultName: string }> = {
  gaurav: {
    primaryUid: GAURAV_ID,
    emails: ['gauravjoshiji2610@gmail.com', 'gaurav@bloom.app'],
    defaultName: 'Gaurav',
  },
  radhika: {
    primaryUid: RADHIKA_ID,
    emails: ['radhikasolank\u013100295@gmail.com'],
    defaultName: 'Radhika',
  },
};

export interface AuthSession {
  userId: UserId;
  loginAt: string;
}

export const authService = {
  async loginByNameAndPassword(nameInput: string, passwordInput: string): Promise<User> {
    const cleanName = nameInput.trim().toLowerCase();
    const target = INTERNAL_NAME_MAP[cleanName];

    if (!target) {
      console.warn('[AUTH DEBUG] Unknown name entered:', nameInput);
      throw new Error('Invalid name or password.');
    }

    if (!passwordInput) {
      console.warn('[AUTH DEBUG] Empty password provided');
      throw new Error('Invalid name or password.');
    }

    let cred: any = null;
    let lastError: any = null;

    // Try each internal email candidate for the requested name
    for (const email of target.emails) {
      try {
        console.log('[AUTH DEBUG] Attempting Firebase Auth for:', cleanName, 'with email candidate:', email);
        cred = await signInWithEmailAndPassword(auth, email, passwordInput);
        if (cred && cred.user) {
          console.log('[AUTH DEBUG] Firebase Auth SUCCESS for:', cleanName, 'Email:', email, 'Returned UID:', cred.user.uid);
          break;
        }
      } catch (err: any) {
        console.warn('[AUTH DEBUG] Failed email candidate:', email, 'Code:', err.code, 'Message:', err.message);
        lastError = err;
      }
    }

    if (!cred || !cred.user) {
      console.error('[AUTH DEBUG] All email attempts failed for name:', nameInput, lastError?.code, lastError?.message);
      throw new Error('Invalid name or password.');
    }

    const uid = cred.user.uid as UserId;

    // Verify authenticated Firebase UID
    if (!ALLOWED_UIDS.has(uid)) {
      console.error('[AUTH DEBUG] Authenticated UID not in ALLOWED_UIDS:', uid);
      await firebaseSignOut(auth);
      throw new Error('Invalid name or password.');
    }

    // Load or initialize user profile in Firestore
    let user = await this.fetchUserProfileFromFirestore(uid);
    if (!user) {
      user = {
        uid,
        name: target.defaultName,
        email: '',
        avatar: '',
        bio: '',
        dateOfBirth: '',
        interests: [],
        skills: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      try {
        await setDoc(doc(db, 'users', uid), user, { merge: true });
      } catch (e) {
        console.warn('[AUTH DEBUG] Firestore profile create deferred:', e);
      }
    }

    const session: AuthSession = { userId: uid, loginAt: new Date().toISOString() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return user;
  },

  async logout(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch {
      // ignore offline logout errors
    }
    localStorage.removeItem(SESSION_KEY);
  },

  async getSession(): Promise<User | null> {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      const session: AuthSession = JSON.parse(raw);
      if (!ALLOWED_UIDS.has(session.userId)) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }

      const firestoreUser = await this.fetchUserProfileFromFirestore(session.userId);
      if (firestoreUser) return firestoreUser;

      const users = storageService.getUsers();
      return users[session.userId] || defaultUsers[session.userId] || null;
    } catch {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  },

  async updateProfile(userId: UserId, updates: Partial<User>): Promise<User> {
    if (!ALLOWED_UIDS.has(userId)) throw new Error('Unauthorized profile update.');

    const users = storageService.getUsers();
    const existing = users[userId] || defaultUsers[userId];
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };

    users[userId] = updated;
    storageService.saveUsers(users);

    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, updated, { merge: true });
    } catch (e) {
      console.warn('Firestore profile sync postponed (offline):', e);
    }

    return updated;
  },

  async fetchUserProfileFromFirestore(userId: UserId): Promise<User | null> {
    try {
      const snap = await getDoc(doc(db, 'users', userId));
      if (snap.exists()) {
        return snap.data() as User;
      }
    } catch (e) {
      console.warn('Could not fetch user profile from Firestore:', e);
    }
    return null;
  },

  getUsers(): { gaurav: User; radhika: User } {
    const users = storageService.getUsers();
    return {
      gaurav: users[GAURAV_ID] || defaultUsers[GAURAV_ID],
      radhika: users[RADHIKA_ID] || defaultUsers[RADHIKA_ID],
    };
  },

  listenAuthState(onChange: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, async (firebaseUser: unknown) => {
      const userObj = firebaseUser as { uid?: string } | null;
      if (!userObj || !userObj.uid || !ALLOWED_UIDS.has(userObj.uid)) {
        onChange(null);
        return;
      }
      const profile = await authService.fetchUserProfileFromFirestore(userObj.uid as UserId);
      onChange(profile || (defaultUsers[userObj.uid] || null));
    });
  },
};
