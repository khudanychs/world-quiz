import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { getTodayDateString } from "./dateUtils";

/**
 * Saves the user's Shape Match score to Firestore (All-Time and Daily leaderboards).
 * Updates only if the new score is higher than the existing personal best.
 */
export async function saveShapeMatchScore(user: any, score: number) {
  if (!user || score <= 0) return;

  try {
    // 1. Save to ALL-TIME scores (shapeMatchScores/{userId})
    const allTimeDocRef = doc(db, "shapeMatchScores", user.uid);
    const allTimeDoc = await getDoc(allTimeDocRef);
    const allTimeBest = allTimeDoc.exists() ? (allTimeDoc.data().score || 0) : 0;

    if (score > allTimeBest) {
      await setDoc(allTimeDocRef, {
        userId: user.uid,
        username: user.displayName || "Anonymous",
        score: score,
        createdAt: serverTimestamp(),
        gameType: "ShapeMatch",
      });
      // New all-time best score saved
    }

    // 2. Save to DAILY scores (dailyShapeMatchScores/{date}_{userId})
    const todayDate = getTodayDateString();
    const dailyDocId = `${todayDate}_${user.uid}`;
    const dailyDocRef = doc(db, "dailyShapeMatchScores", dailyDocId);
    const dailyDoc = await getDoc(dailyDocRef);
    const todayBest = dailyDoc.exists() ? (dailyDoc.data().score || 0) : 0;

    if (score > todayBest) {
      await setDoc(dailyDocRef, {
        date: todayDate,
        userId: user.uid,
        username: user.displayName || "Anonymous",
        score: score,
        createdAt: serverTimestamp(),
        gameType: "ShapeMatch",
      });
      // New daily best score saved
    }
  } catch (error) {
    console.error("Error saving shape match score:", error);
    throw error; // Propagate error if needed
  }
}

/**
 * Saves the user's Cards Match score (generalized) to Firestore.
 * Collections: cardsMatchScores (all-time) and dailyCardsMatchScores (today).
 * Updates only if the new score is higher than the existing personal best.
 */
export async function saveCardsMatchScore(user: any, score: number) {
  if (!user || score <= 0) return;

  try {
    // 1. Save to ALL-TIME scores (cardsMatchScores/{userId})
    const allTimeDocRef = doc(db, "cardsMatchScores", user.uid);
    const allTimeDoc = await getDoc(allTimeDocRef);
    const allTimeBest = allTimeDoc.exists() ? (allTimeDoc.data().score || 0) : 0;

    if (score > allTimeBest) {
      await setDoc(allTimeDocRef, {
        userId: user.uid,
        username: user.displayName || "Anonymous",
        score: score,
        createdAt: serverTimestamp(),
        gameType: "CardsMatch",
      });
      // New all-time CardsMatch best score saved
    }

    // 2. Save to DAILY scores (dailyCardsMatchScores/{date}_{userId})
    const todayDate = getTodayDateString();
    const dailyDocId = `${todayDate}_${user.uid}`;
    const dailyDocRef = doc(db, "dailyCardsMatchScores", dailyDocId);
    const dailyDoc = await getDoc(dailyDocRef);
    const todayBest = dailyDoc.exists() ? (dailyDoc.data().score || 0) : 0;

    if (score > todayBest) {
      await setDoc(dailyDocRef, {
        date: todayDate,
        userId: user.uid,
        username: user.displayName || "Anonymous",
        score: score,
        createdAt: serverTimestamp(),
        gameType: "CardsMatch",
      });
      // New daily CardsMatch best score saved
    }
  } catch (error) {
    console.error("Error saving cards match score:", error);
    throw error;
  }
}
