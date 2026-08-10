import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import {logger} from "firebase-functions/v2";
import {onDocumentCreated} from "firebase-functions/v2/firestore";
import {onSchedule} from "firebase-functions/v2/scheduler";

// ─────────────────────────────────────────────
// App init
// ─────────────────────────────────────────────
admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const ALLOWED_UIDS = new Set([
  "GQMi1IhBIAh8IFfKyQ4FMBwXPMs1",
  "y0wo2ZQ8NAQEXEcZLFjVGYPoT1e2",
]);

const PARTNER_MAP: Record<string, string> = {
  "GQMi1IhBIAh8IFfKyQ4FMBwXPMs1": "y0wo2ZQ8NAQEXEcZLFjVGYPoT1e2",
  "y0wo2ZQ8NAQEXEcZLFjVGYPoT1e2": "GQMi1IhBIAh8IFfKyQ4FMBwXPMs1",
};

const USER_NAMES: Record<string, string> = {
  "GQMi1IhBIAh8IFfKyQ4FMBwXPMs1": "Gaurav",
  "y0wo2ZQ8NAQEXEcZLFjVGYPoT1e2": "Radhika",
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Fetch all active FCM tokens for a user.
 * Invalid tokens are cleaned up automatically when a send fails.
 */
async function getUserTokens(userId: string): Promise<string[]> {
  if (!ALLOWED_UIDS.has(userId)) return [];
  const snap = await db
    .collection("users")
    .doc(userId)
    .collection("fcmTokens")
    .get();
  return snap.docs.map((d) => d.id);
}

/**
 * Send an FCM message to a list of tokens, cleaning up invalid ones.
 */
async function sendToTokens(
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, string> = {}
): Promise<void> {
  if (!tokens.length) return;

  const response = await messaging.sendEachForMulticast({
    tokens,
    notification: {title, body},
    data,
    webpush: {
      fcmOptions: {link: data.link || "/"},
      notification: {
        title,
        body,
        icon: "/favicon.svg",
        badge: "/favicon.svg",
        click_action: data.link || "/",
      },
    },
    android: {priority: "high"},
    apns: {payload: {aps: {sound: "default"}}},
  });

  // Clean up invalid tokens
  const invalidTokens: Promise<admin.firestore.WriteResult>[] = [];
  response.responses.forEach((res, i) => {
    if (!res.success) {
      const code = res.error?.code;
      if (
        code === "messaging/invalid-registration-token" ||
        code === "messaging/registration-token-not-registered"
      ) {
        logger.info(`Removing invalid FCM token for cleanup: ${tokens[i]}`);
        // We don't know the userId here, but tokens are stored under userId/fcmTokens/{token}
        // We clean them up via a secondary query
        invalidTokens.push(
          db.collectionGroup("fcmTokens")
            .where("token", "==", tokens[i])
            .get()
            .then((snap) => {
              const batch = db.batch();
              snap.docs.forEach((d) => batch.delete(d.ref));
              return batch.commit();
            })
            .then(() => ({writeTime: admin.firestore.Timestamp.now()} as admin.firestore.WriteResult))
        );
      }
    }
  });

  await Promise.allSettled(invalidTokens);
}

// ─────────────────────────────────────────────
// FUNCTION 1: Partner Interaction Notifications
// Fires when a nudge, cheer or message is written to
// users/{toUserId}/interactions/{interactionId}
// ─────────────────────────────────────────────
export const onPartnerInteraction = onDocumentCreated(
  "users/{toUserId}/interactions/{interactionId}",
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const toUserId: string = event.params.toUserId;
    const fromUserId: string = data.fromUserId;

    // Whitelist check — only send notifications between Gaurav & Radhika
    if (!ALLOWED_UIDS.has(toUserId) || !ALLOWED_UIDS.has(fromUserId)) {
      logger.warn(`Blocked notification attempt: ${fromUserId} -> ${toUserId}`);
      return;
    }

    // Do not notify if sender and recipient are somehow the same
    if (toUserId === fromUserId) return;

    const senderName = USER_NAMES[fromUserId] || "Your partner";
    const interactionType: string = data.type;
    const message: string = data.message || "";

    let title = "🌸 Bloom";
    let body = "";
    let link = "/partner";

    switch (interactionType) {
    case "nudge":
      title = `👋 ${senderName} nudged you!`;
      body = message || `${senderName} is cheering you on. Let's go!`;
      break;
    case "cheer":
      title = `🎉 ${senderName} cheered for you!`;
      body = message || `${senderName} is proud of your progress!`;
      break;
    case "message":
      title = `💬 Message from ${senderName}`;
      body = message.length > 100 ? message.slice(0, 97) + "…" : message;
      break;
    default:
      title = `🌸 ${senderName} sent you something`;
      body = message;
    }

    const tokens = await getUserTokens(toUserId);
    if (!tokens.length) {
      logger.info(`No FCM tokens for ${toUserId}, skipping notification`);
      return;
    }

    await sendToTokens(tokens, title, body, {
      type: interactionType,
      fromUserId,
      link,
      interactionId: event.params.interactionId,
    });

    logger.info(
      `Sent ${interactionType} notification from ${senderName} to ${toUserId}`
    );
  }
);

// ─────────────────────────────────────────────
// FUNCTION 2: Habit Reminder Push Notifications
// Runs every minute, checks if any habit reminder
// time matches current time (HH:MM), and sends
// a push notification if the habit isn't already
// completed today and isn't archived.
// ─────────────────────────────────────────────
export const sendHabitReminders = onSchedule(
  {schedule: "every 1 minutes", timeZone: "Asia/Kolkata"},
  async () => {
    const now = new Date();
    const currentHour = String(now.getHours()).padStart(2, "0");
    const currentMinute = String(now.getMinutes()).padStart(2, "0");
    const currentTime = `${currentHour}:${currentMinute}`;
    const todayStr = now.toISOString().split("T")[0];
    const currentDayOfWeek = now.getDay(); // 0=Sun, 6=Sat

    logger.info(`Running habit reminders for ${currentTime} on ${todayStr}`);

    // Check both allowed users
    for (const userId of ALLOWED_UIDS) {
      const userName = USER_NAMES[userId];

      // Get all active (non-archived) habits with reminders enabled at this time
      const habitsSnap = await db
        .collection("users")
        .doc(userId)
        .collection("habits")
        .where("isArchived", "==", false)
        .where("reminderEnabled", "==", true)
        .where("reminderTime", "==", currentTime)
        .get();

      if (habitsSnap.empty) continue;

      for (const habitDoc of habitsSnap.docs) {
        const habit = habitDoc.data();

        // Check if habit runs today
        let runsToday = false;
        if (habit.repeatType === "daily") {
          runsToday = true;
        } else if (
          (habit.repeatType === "weekly" || habit.repeatType === "custom") &&
          Array.isArray(habit.selectedDays)
        ) {
          runsToday = habit.selectedDays.includes(currentDayOfWeek);
        }

        if (!runsToday) continue;

        // Check if already completed today — query habitLogs
        const logSnap = await db
          .collection("users")
          .doc(userId)
          .collection("habitLogs")
          .where("habitId", "==", habitDoc.id)
          .where("date", "==", todayStr)
          .where("completed", "==", true)
          .limit(1)
          .get();

        if (!logSnap.empty) {
          // Already completed today, skip reminder
          continue;
        }

        const tokens = await getUserTokens(userId);
        if (!tokens.length) continue;

        const habitName: string = habit.name || "Your habit";
        const habitIcon: string = habit.icon || "🌸";
        const title = `${habitIcon} Time for: ${habitName}`;
        const body = habit.goal
          ? `Goal: ${habit.goal}`
          : `Keep your streak going, ${userName}! 💪`;

        await sendToTokens(tokens, title, body, {
          type: "habit_reminder",
          habitId: habitDoc.id,
          habitName,
          link: "/habits",
        });

        logger.info(
          `Sent reminder for habit "${habitName}" to ${userName} (${userId})`
        );
      }
    }
  }
);

// ─────────────────────────────────────────────
// FUNCTION 3: Partner Habit Completion Notification
// Fires when a habit log is created with completed=true,
// notifies the partner so they can see their partner's progress.
// ─────────────────────────────────────────────
export const onHabitCompleted = onDocumentCreated(
  "users/{userId}/habitLogs/{logId}",
  async (event) => {
    const data = event.data?.data();
    if (!data || !data.completed) return;

    const userId: string = event.params.userId;
    if (!ALLOWED_UIDS.has(userId)) return;

    const partnerId = PARTNER_MAP[userId];
    if (!partnerId) return;

    // Look up habit name
    let habitName = data.habitName || "a habit";
    try {
      const habitDoc = await db
        .collection("users")
        .doc(userId)
        .collection("habits")
        .doc(data.habitId)
        .get();
      if (habitDoc.exists) {
        habitName = habitDoc.data()?.name || habitName;
      }
    } catch {
      // use default name
    }

    const userName = USER_NAMES[userId] || "Your partner";
    const partnerTokens = await getUserTokens(partnerId);
    if (!partnerTokens.length) return;

    const title = `🌱 ${userName} completed "${habitName}"!`;
    const body = `Cheer them on from the Partner tab!`;

    await sendToTokens(partnerTokens, title, body, {
      type: "partner_habit_completed",
      habitName,
      fromUserId: userId,
      link: "/partner",
    });

    logger.info(
      `Notified partner ${partnerId} that ${userName} completed "${habitName}"`
    );
  }
);

// ─────────────────────────────────────────────
// FUNCTION 4: Streak Milestone Notification
// Fires on activity events for streak milestones.
// ─────────────────────────────────────────────
export const onStreakMilestone = onDocumentCreated(
  "users/{userId}/activity/{eventId}",
  async (event) => {
    const data = event.data?.data();
    if (!data || data.type !== "streak_milestone") return;

    const userId: string = event.params.userId;
    if (!ALLOWED_UIDS.has(userId)) return;

    const partnerId = PARTNER_MAP[userId];
    if (!partnerId) return;

    const userName = USER_NAMES[userId] || "Your partner";
    const milestone: number = data.milestone || 0;
    const habitName: string = data.habitName || "a habit";

    if (milestone < 7) return; // Only notify for significant milestones

    const partnerTokens = await getUserTokens(partnerId);
    if (!partnerTokens.length) return;

    const title = `🔥 ${userName} hit a ${milestone}-day streak!`;
    const body = `"${habitName}" — ${milestone} days in a row. Amazing!`;

    await sendToTokens(partnerTokens, title, body, {
      type: "streak_milestone",
      habitName,
      fromUserId: userId,
      milestone: String(milestone),
      link: "/partner",
    });

    logger.info(
      `Streak milestone notification: ${userName} - ${milestone} days - "${habitName}"`
    );
  }
);

// Export v1-style HTTPS callable for manual token cleanup (admin utility)
export const cleanupFcmTokens = functions.https.onCall(async (data, context) => {
  if (!context.auth || !ALLOWED_UIDS.has(context.auth.uid)) {
    throw new functions.https.HttpsError("permission-denied", "Not authorized.");
  }
  const userId = context.auth.uid;
  const tokensSnap = await db
    .collection("users")
    .doc(userId)
    .collection("fcmTokens")
    .get();

  const tokens = tokensSnap.docs.map((d) => d.id);
  if (!tokens.length) return {cleaned: 0};

  const response = await messaging.sendEachForMulticast({
    tokens,
    data: {ping: "1"},
  });

  let cleaned = 0;
  const batch = db.batch();
  response.responses.forEach((res, i) => {
    if (!res.success) {
      const code = res.error?.code;
      if (
        code === "messaging/invalid-registration-token" ||
        code === "messaging/registration-token-not-registered"
      ) {
        batch.delete(tokensSnap.docs[i].ref);
        cleaned++;
      }
    }
  });
  if (cleaned > 0) await batch.commit();
  return {cleaned};
});
