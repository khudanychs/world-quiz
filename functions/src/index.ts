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
