import type { PartnerInteraction, UserId } from '../types';
import { activityService } from './activityService';
import { storageService } from './storageService';
import { db } from './firebase';
import { doc, setDoc, collection, onSnapshot } from 'firebase/firestore';

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const partnerService = {
  async getInteractions(userId: UserId): Promise<PartnerInteraction[]> {
    await delay(100);
    const interactions = storageService.getInteractions();
    return [...interactions]
      .filter(i => i.toUserId === userId || i.fromUserId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async sendNudge(fromUserId: UserId, toUserId: UserId, message: string): Promise<PartnerInteraction> {
    await delay(150);
    const interactions = storageService.getInteractions();
    const interactionId = 'i' + Date.now();
    const interaction: PartnerInteraction = {
      id: interactionId,
      fromUserId,
      toUserId,
      type: 'nudge',
      message,
      emoji: '👋',
      createdAt: new Date().toISOString(),
      read: false,
    };
    interactions.unshift(interaction);
    storageService.saveInteractions(interactions);

    // Sync to Firestore: users/{toUserId}/interactions/{interactionId}
    try {
      const interactionRef = doc(db, 'users', toUserId, 'interactions', interactionId);
      setDoc(interactionRef, interaction).catch(e => console.warn('Firestore interaction deferred:', e));
    } catch (e) {
      console.warn('Firestore interaction deferred:', e);
    }

    activityService.addEvent({
      type: 'partner_nudge',
      actorId: fromUserId,
      targetId: toUserId,
      message,
    });
    return interaction;
  },

  async sendCheer(fromUserId: UserId, toUserId: UserId, message: string): Promise<PartnerInteraction> {
    await delay(150);
    const interactions = storageService.getInteractions();
    const interactionId = 'i' + Date.now();
    const interaction: PartnerInteraction = {
      id: interactionId,
      fromUserId,
      toUserId,
      type: 'cheer',
      message,
      emoji: '🎉',
      createdAt: new Date().toISOString(),
      read: false,
    };
    interactions.unshift(interaction);
    storageService.saveInteractions(interactions);

    try {
      const interactionRef = doc(db, 'users', toUserId, 'interactions', interactionId);
      setDoc(interactionRef, interaction).catch(e => console.warn('Firestore cheer deferred:', e));
    } catch (e) {
      console.warn('Firestore cheer deferred:', e);
    }

    activityService.addEvent({
      type: 'partner_cheer',
      actorId: fromUserId,
      targetId: toUserId,
      message,
    });
    return interaction;
  },

  async sendMessage(fromUserId: UserId, toUserId: UserId, message: string): Promise<PartnerInteraction> {
    await delay(150);
    const interactions = storageService.getInteractions();
    const interactionId = 'i' + Date.now();
    const interaction: PartnerInteraction = {
      id: interactionId,
      fromUserId,
      toUserId,
      type: 'message',
      message,
      createdAt: new Date().toISOString(),
      read: false,
    };
    interactions.unshift(interaction);
    storageService.saveInteractions(interactions);

    try {
      const interactionRef = doc(db, 'users', toUserId, 'interactions', interactionId);
      setDoc(interactionRef, interaction).catch(e => console.warn('Firestore message deferred:', e));
    } catch (e) {
      console.warn('Firestore message deferred:', e);
    }

    activityService.addEvent({
      type: 'partner_message',
      actorId: fromUserId,
      targetId: toUserId,
      message,
    });
    return interaction;
  },

  async markRead(interactionId: string): Promise<void> {
    const interactions = storageService.getInteractions();
    const idx = interactions.findIndex(i => i.id === interactionId);
    if (idx !== -1) {
      interactions[idx].read = true;
      storageService.saveInteractions(interactions);

      try {
        const interactionRef = doc(db, 'users', interactions[idx].toUserId, 'interactions', interactionId);
        setDoc(interactionRef, { read: true }, { merge: true }).catch(() => {});
      } catch (e) {}
    }
  },

  async getUnreadCount(userId: UserId): Promise<number> {
    const interactions = storageService.getInteractions();
    return interactions.filter(i => i.toUserId === userId && !i.read).length;
  },

  // Realtime subscription for partner interactions
  subscribeInteractions(userId: UserId, onUpdate: (interactions: PartnerInteraction[]) => void): () => void {
    const col = collection(db, 'users', userId, 'interactions');
    return onSnapshot(col, (snap) => {
      if (!snap.empty) {
        const remote = snap.docs.map(docSnap => docSnap.data() as PartnerInteraction);
        const interactions = storageService.getInteractions();
        const map = new Map<string, PartnerInteraction>();
        interactions.forEach(i => map.set(i.id, i));
        remote.forEach(i => map.set(i.id, i));
        const merged = Array.from(map.values());
        storageService.saveInteractions(merged);
        onUpdate(merged.filter(i => i.toUserId === userId || i.fromUserId === userId));
      }
    }, (err: unknown) => {
      console.warn('Realtime interactions listener offline:', err);
    });
  },
};
