// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDq6Fj5_xEqW3C0TM4kq6VrqMd1YOgtMW4",
  authDomain: "world-quiz.com",
  projectId: "world-quiz-476512",
  storageBucket: "world-quiz-476512.firebasestorage.app",
  messagingSenderId: "822254491537",
  appId: "1:822254491537:web:32f0384693627b5f6aac30",
  measurementId: "G-82L550HBZF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get a reference to the auth service
export const auth = getAuth(app);

// Get a reference to the Firestore service with optimized WebSocket configuration
// This explicitly prevents long polling and ensures WebSocket transport
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  // Explicitly disable forced long polling to ensure WebSocket usage
  experimentalForceLongPolling: false,
});
