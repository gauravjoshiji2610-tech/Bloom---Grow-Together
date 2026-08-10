"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupFcmTokens = exports.onStreakMilestone = exports.onHabitCompleted = exports.sendHabitReminders = exports.onPartnerInteraction = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const v2_1 = require("firebase-functions/v2");
const firestore_1 = require("firebase-functions/v2/firestore");
const scheduler_1 = require("firebase-functions/v2/scheduler");
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
const PARTNER_MAP = {
    "GQMi1IhBIAh8IFfKyQ4FMBwXPMs1": "y0wo2ZQ8NAQEXEcZLFjVGYPoT1e2",
    "y0wo2ZQ8NAQEXEcZLFjVGYPoT1e2": "GQMi1IhBIAh8IFfKyQ4FMBwXPMs1",
};
const USER_NAMES = {
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
async function getUserTokens(userId) {
    if (!ALLOWED_UIDS.has(userId))
        return [];
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
async function sendToTokens(tokens, title, body, data = {}) {
    if (!tokens.length)
        return;
    const response = await messaging.sendEachForMulticast({
        tokens,
        notification: { title, body },
        data,
        webpush: {
            fcmOptions: { link: data.link || "/" },
            notification: {
                title,
                body,
                icon: "/favicon.svg",
                badge: "/favicon.svg",
                click_action: data.link || "/",
            },
        },
        android: { priority: "high" },
        apns: { payload: { aps: { sound: "default" } } },
    });
    // Clean up invalid tokens
    const invalidTokens = [];
    response.responses.forEach((res, i) => {
        var _a;
        if (!res.success) {
            const code = (_a = res.error) === null || _a === void 0 ? void 0 : _a.code;
            if (code === "messaging/invalid-registration-token" ||
                code === "messaging/registration-token-not-registered") {
                v2_1.logger.info(`Removing invalid FCM token for cleanup: ${tokens[i]}`);
                // We don't know the userId here, but tokens are stored under userId/fcmTokens/{token}
                // We clean them up via a secondary query
                invalidTokens.push(db.collectionGroup("fcmTokens")
                    .where("token", "==", tokens[i])
                    .get()
                    .then((snap) => {
                    const batch = db.batch();
                    snap.docs.forEach((d) => batch.delete(d.ref));
                    return batch.commit();
                })
                    .then(() => ({ writeTime: admin.firestore.Timestamp.now() })));
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
exports.onPartnerInteraction = (0, firestore_1.onDocumentCreated)("users/{toUserId}/interactions/{interactionId}", async (event) => {
    var _a;
    const data = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!data)
        return;
    const toUserId = event.params.toUserId;
    const fromUserId = data.fromUserId;
    // Whitelist check — only send notifications between Gaurav & Radhika
    if (!ALLOWED_UIDS.has(toUserId) || !ALLOWED_UIDS.has(fromUserId)) {
        v2_1.logger.warn(`Blocked notification attempt: ${fromUserId} -> ${toUserId}`);
        return;
    }
    // Do not notify if sender and recipient are somehow the same
    if (toUserId === fromUserId)
        return;
    const senderName = USER_NAMES[fromUserId] || "Your partner";
    const interactionType = data.type;
    const message = data.message || "";
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
        v2_1.logger.info(`No FCM tokens for ${toUserId}, skipping notification`);
        return;
    }
    await sendToTokens(tokens, title, body, {
        type: interactionType,
        fromUserId,
        link,
        interactionId: event.params.interactionId,
    });
    v2_1.logger.info(`Sent ${interactionType} notification from ${senderName} to ${toUserId}`);
});
// ─────────────────────────────────────────────
// FUNCTION 2: Habit Reminder Push Notifications
// Runs every minute, checks if any habit reminder
// time matches current time (HH:MM), and sends
// a push notification if the habit isn't already
// completed today and isn't archived.
// ─────────────────────────────────────────────
exports.sendHabitReminders = (0, scheduler_1.onSchedule)({ schedule: "every 1 minutes", timeZone: "Asia/Kolkata" }, async () => {
    const now = new Date();
    const currentHour = String(now.getHours()).padStart(2, "0");
    const currentMinute = String(now.getMinutes()).padStart(2, "0");
    const currentTime = `${currentHour}:${currentMinute}`;
    const todayStr = now.toISOString().split("T")[0];
    const currentDayOfWeek = now.getDay(); // 0=Sun, 6=Sat
    v2_1.logger.info(`Running habit reminders for ${currentTime} on ${todayStr}`);
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
        if (habitsSnap.empty)
            continue;
        for (const habitDoc of habitsSnap.docs) {
            const habit = habitDoc.data();
            // Check if habit runs today
            let runsToday = false;
            if (habit.repeatType === "daily") {
                runsToday = true;
            }
            else if ((habit.repeatType === "weekly" || habit.repeatType === "custom") &&
                Array.isArray(habit.selectedDays)) {
                runsToday = habit.selectedDays.includes(currentDayOfWeek);
            }
            if (!runsToday)
                continue;
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
            if (!tokens.length)
                continue;
            const habitName = habit.name || "Your habit";
            const habitIcon = habit.icon || "🌸";
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
            v2_1.logger.info(`Sent reminder for habit "${habitName}" to ${userName} (${userId})`);
        }
    }
});
// ─────────────────────────────────────────────
// FUNCTION 3: Partner Habit Completion Notification
// Fires when a habit log is created with completed=true,
// notifies the partner so they can see their partner's progress.
// ─────────────────────────────────────────────
exports.onHabitCompleted = (0, firestore_1.onDocumentCreated)("users/{userId}/habitLogs/{logId}", async (event) => {
    var _a, _b;
    const data = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!data || !data.completed)
        return;
    const userId = event.params.userId;
    if (!ALLOWED_UIDS.has(userId))
        return;
    const partnerId = PARTNER_MAP[userId];
    if (!partnerId)
        return;
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
            habitName = ((_b = habitDoc.data()) === null || _b === void 0 ? void 0 : _b.name) || habitName;
        }
    }
    catch (_c) {
        // use default name
    }
    const userName = USER_NAMES[userId] || "Your partner";
    const partnerTokens = await getUserTokens(partnerId);
    if (!partnerTokens.length)
        return;
    const title = `🌱 ${userName} completed "${habitName}"!`;
    const body = `Cheer them on from the Partner tab!`;
    await sendToTokens(partnerTokens, title, body, {
        type: "partner_habit_completed",
        habitName,
        fromUserId: userId,
        link: "/partner",
    });
    v2_1.logger.info(`Notified partner ${partnerId} that ${userName} completed "${habitName}"`);
});
// ─────────────────────────────────────────────
// FUNCTION 4: Streak Milestone Notification
// Fires on activity events for streak milestones.
// ─────────────────────────────────────────────
exports.onStreakMilestone = (0, firestore_1.onDocumentCreated)("users/{userId}/activity/{eventId}", async (event) => {
    var _a;
    const data = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!data || data.type !== "streak_milestone")
        return;
    const userId = event.params.userId;
    if (!ALLOWED_UIDS.has(userId))
        return;
    const partnerId = PARTNER_MAP[userId];
    if (!partnerId)
        return;
    const userName = USER_NAMES[userId] || "Your partner";
    const milestone = data.milestone || 0;
    const habitName = data.habitName || "a habit";
    if (milestone < 7)
        return; // Only notify for significant milestones
    const partnerTokens = await getUserTokens(partnerId);
    if (!partnerTokens.length)
        return;
    const title = `🔥 ${userName} hit a ${milestone}-day streak!`;
    const body = `"${habitName}" — ${milestone} days in a row. Amazing!`;
    await sendToTokens(partnerTokens, title, body, {
        type: "streak_milestone",
        habitName,
        fromUserId: userId,
        milestone: String(milestone),
        link: "/partner",
    });
    v2_1.logger.info(`Streak milestone notification: ${userName} - ${milestone} days - "${habitName}"`);
});
// Export v1-style HTTPS callable for manual token cleanup (admin utility)
exports.cleanupFcmTokens = functions.https.onCall(async (data, context) => {
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
    if (!tokens.length)
        return { cleaned: 0 };
    const response = await messaging.sendEachForMulticast({
        tokens,
        data: { ping: "1" },
    });
    let cleaned = 0;
    const batch = db.batch();
    response.responses.forEach((res, i) => {
        var _a;
        if (!res.success) {
            const code = (_a = res.error) === null || _a === void 0 ? void 0 : _a.code;
            if (code === "messaging/invalid-registration-token" ||
                code === "messaging/registration-token-not-registered") {
                batch.delete(tokensSnap.docs[i].ref);
                cleaned++;
            }
        }
    });
    if (cleaned > 0)
        await batch.commit();
    return { cleaned };
});
//# sourceMappingURL=index.js.map