/**
 * Firebase Cloud Functions for World Quiz
 */

import {setGlobalOptions} from "firebase-functions";
import {onSchedule} from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

// Initialize Firebase Admin
admin.initializeApp();

// For cost control, set the maximum number of containers
setGlobalOptions({maxInstances: 10});

/**
 * Get today's date string in UTC format (YYYY-MM-DD)
 * @return {string} Date in YYYY-MM-DD format
 */
function getTodayDateString(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Scheduled function that runs at midnight UTC to clean up old daily streaks
 * Deletes all dailyStreaks documents from previous days
 */
export const cleanupOldDailyStreaks = onSchedule(
  {
    schedule: "0 0 * * *", // Every day at midnight UTC
    timeZone: "UTC",
  },
  async () => {
    const db = admin.firestore();
    const todayDate = getTodayDateString();

    logger.info(
      `Starting cleanup of old daily streaks (keeping ${todayDate})...`
    );

    let deletedCount = 0;
    const batchSize = 500; // Firestore batch limit

    try {
      // Query all dailyStreaks documents where date is NOT today
      // We need to handle this in batches since we can't use !=
      const allDocsSnapshot = await db.collection("dailyStreaks").get();

      // Filter documents that are not from today
      const docsToDelete = allDocsSnapshot.docs.filter((doc) => {
        const docDate = doc.data().date;
        return docDate && docDate !== todayDate;
      });

      if (docsToDelete.length === 0) {
        logger.info("No old daily streaks to delete.");
        return;
      }

      const count = docsToDelete.length;
      logger.info(`Found ${count} old daily streak documents to delete.`);

      // Delete in batches
      for (let i = 0; i < docsToDelete.length; i += batchSize) {
        const batch = db.batch();
        const chunk = docsToDelete.slice(i, i + batchSize);

        for (const doc of chunk) {
          batch.delete(doc.ref);
          deletedCount++;
        }

        await batch.commit();
        logger.info(`Deleted batch of ${chunk.length} documents.`);
      }

      logger.info(
        `Cleanup complete. Deleted ${deletedCount} old daily streak docs.`
      );
    } catch (error) {
      logger.error("Error during daily streaks cleanup:", error);
      throw error;
    }
  }
);

/**
 * Scheduled function that runs at midnight UTC
 * to clean up old CardMatch daily points
 * Deletes all cardMatchDailyPoints documents from previous days
 */
export const cleanupOldCardMatchDailyPoints = onSchedule(
  {
    schedule: "0 0 * * *", // Every day at midnight UTC
    timeZone: "UTC",
  },
  async () => {
    const db = admin.firestore();
    const todayDate = getTodayDateString();

    logger.info(
      `Starting cleanup of old CardMatch daily points (keeping ${todayDate})...`
    );

    let deletedCount = 0;
    const batchSize = 500; // Firestore batch limit

    try {
      // Query all dailyCardsMatchScores docs where date is NOT today
      const allDocsSnapshot = await db
        .collection("dailyCardsMatchScores").get();

      // Filter documents that are not from today
      const docsToDelete = allDocsSnapshot.docs.filter((doc) => {
        const docDate = doc.data().date;
        return docDate && docDate !== todayDate;
      });

      if (docsToDelete.length === 0) {
        logger.info("No old CardMatch daily points to delete.");
        return;
      }

      const count = docsToDelete.length;
      logger.info(
        `Found ${count} old CardMatch daily points documents to delete.`
      );

      // Delete in batches
      for (let i = 0; i < docsToDelete.length; i += batchSize) {
        const batch = db.batch();
        const chunk = docsToDelete.slice(i, i + batchSize);

        for (const doc of chunk) {
          batch.delete(doc.ref);
          deletedCount++;
        }

        await batch.commit();
        logger.info(`Deleted batch of ${chunk.length} documents.`);
      }

      logger.info(
        `Cleanup complete. Deleted ${deletedCount} CardMatch daily docs.`
      );
    } catch (error) {
      logger.error(
        "Error during CardMatch daily points cleanup:",
        error
      );
      throw error;
    }
  }
);

/**
 * Scheduled function that runs every hour to clean up unverified accounts
 * Deletes users who haven't verified their email within 30 minutes
 */
export const cleanupUnverifiedAccounts = onSchedule(
  {
    schedule: "every 60 minutes",
    timeZone: "Europe/Prague",
  },
  async () => {
    const auth = admin.auth();
    const db = admin.firestore();

    // 30 minutes ago
    const cutoffTime = Date.now() - 30 * 60 * 1000;

    logger.info("Starting cleanup of unverified accounts...");

    let deletedCount = 0;
    let nextPageToken: string | undefined;

    try {
      do {
        // List users in batches
        const listResult = await auth.listUsers(1000, nextPageToken);

        for (const user of listResult.users) {
          // Skip if email is verified, no email, or Google user
          const isGoogleUser = user.providerData.some(
            (provider) => provider.providerId === "google.com"
          );

          if (
            !user.emailVerified &&
            user.email &&
            !isGoogleUser &&
            user.metadata.creationTime
          ) {
            const creationTime =
              new Date(user.metadata.creationTime).getTime();

            if (creationTime < cutoffTime) {
              logger.info(`Deleting unverified: ${user.email}`);

              try {
                // Delete username from Firestore
                await db.collection("usernames").doc(user.uid).delete();
                // Delete the user from Firebase Auth
                await auth.deleteUser(user.uid);
                deletedCount++;
              } catch (deleteError) {
                logger.error(`Failed to delete ${user.email}:`, deleteError);
              }
            }
          }
        }

        nextPageToken = listResult.pageToken;
      } while (nextPageToken);

      logger.info(`Cleanup done. Deleted ${deletedCount} accounts.`);
    } catch (error) {
      logger.error("Error during cleanup:", error);
      throw error;
    }
  }
);
