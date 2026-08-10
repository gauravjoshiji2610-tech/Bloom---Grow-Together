import type { ActivityEvent, UserId } from '../types';
import { storageService } from './storageService';
import { db } from './firebase';
import { doc, setDoc, collection, onSnapshot } from 'firebase/firestore';

export const activityService = {
  async getActivity(limitCount = 50): Promise<ActivityEvent[]> {
    const feed = storageService.getActivityFeed();
    return [...feed]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limitCount);
  },

  addEvent(event: Omit<ActivityEvent, 'id' | 'createdAt'>): ActivityEvent {
    const feed = storageService.getActivityFeed();

    // Prevent duplicate event creation within 3 seconds for the same action
    const now = Date.now();
    const recentDuplicate = feed.find(e =>
      e.actorId === event.actorId &&
      e.type === event.type &&
      e.habitId === event.habitId &&
      e.message === event.message &&
      (now - new Date(e.createdAt).getTime()) < 3000
    );

    if (recentDuplicate) {
      return recentDuplicate;
    }

    const eventId = 'act_' + Date.now() + '_' + Math.floor(performance.now() * 100);
    const newEvent: ActivityEvent = {
      ...event,
      id: eventId,
      createdAt: new Date().toISOString(),
    };

    feed.unshift(newEvent);
    storageService.saveActivityFeed(feed);

    // Sync event to Firestore under actor's collection: users/{actorId}/activity/{eventId}
    try {
      const eventRef = doc(db, 'users', event.actorId, 'activity', eventId);
      setDoc(eventRef, newEvent).catch((err: unknown) => console.warn('Firestore activity sync deferred:', err));
    } catch (e: unknown) {
      console.warn('Firestore activity sync deferred:', e);
    }

    return newEvent;
  },

  async getUserActivity(userId: UserId, limitCount = 30): Promise<ActivityEvent[]> {
    const feed = storageService.getActivityFeed();
    return [...feed]
      .filter(e => e.actorId === userId || e.targetId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limitCount);
  },

  // Realtime subscription for activity events
  subscribeUserActivity(userId: UserId, onUpdate: (events: ActivityEvent[]) => void): () => void {
    const activityCol = collection(db, 'users', userId, 'activity');
    return onSnapshot(activityCol, (snap) => {
      const remoteEvents = !snap.empty ? snap.docs.map(docSnap => docSnap.data() as ActivityEvent) : [];
      const feed = storageService.getActivityFeed();
      const map = new Map<string, ActivityEvent>();
      feed.forEach(e => map.set(e.id, e));
      remoteEvents.forEach(e => map.set(e.id, e));
      const merged = Array.from(map.values());
      storageService.saveActivityFeed(merged);
      onUpdate(merged);
    }, (err: unknown) => {
      console.warn('Realtime activity listener offline:', err);
    });
  },
};
