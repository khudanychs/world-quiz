/**
 * Get the i18n key for a Firebase error
 * Use this with i18next's t() function to get translated error messages
 */
export function getFirebaseErrorKey(error: any): string {
  const errorCode = error.code;
  
  switch (errorCode) {
    // Authentication errors
    case 'auth/email-already-in-use':
      return 'auth.firebaseErrors.email-already-in-use';
    case 'auth/invalid-email':
      return 'auth.firebaseErrors.invalid-email';
    case 'auth/weak-password':
      return 'auth.firebaseErrors.weak-password';
    case 'auth/user-not-found':
      return 'auth.firebaseErrors.user-not-found';
    case 'auth/wrong-password':
      return 'auth.firebaseErrors.wrong-password';
    case 'auth/invalid-credential':
      return 'auth.firebaseErrors.invalid-credential';
    case 'auth/too-many-requests':
      return 'auth.firebaseErrors.too-many-requests';
    case 'auth/user-disabled':
      return 'auth.firebaseErrors.user-disabled';
    case 'auth/operation-not-allowed':
      return 'auth.firebaseErrors.operation-not-allowed';
    case 'auth/account-exists-with-different-credential':
      return 'auth.firebaseErrors.account-exists-with-different-credential';
    case 'auth/popup-closed-by-user':
      return 'auth.firebaseErrors.popup-closed-by-user';
    case 'auth/popup-blocked':
      return 'auth.firebaseErrors.popup-blocked';
    case 'auth/network-request-failed':
      return 'auth.firebaseErrors.network-request-failed';
    
    // Firestore quota/billing errors (free tier limits)
    case 'resource-exhausted':
      return 'auth.firebaseErrors.resource-exhausted';
    case 'quota-exceeded':
      return 'auth.firebaseErrors.quota-exceeded';
    case 'unavailable':
      return 'auth.firebaseErrors.unavailable';
    case 'permission-denied':
      return 'auth.firebaseErrors.permission-denied';
    
    // Default fallback
    default:
      return 'auth.firebaseErrors.default';
  }
}

/**
 * Get the English error message for a Firebase error
 * Use getFirebaseErrorKey() with i18next.t() for translated messages
 */
export function getFirebaseErrorMessage(error: any): string {
  const errorCode = error.code;
  
  switch (errorCode) {
    // Authentication errors
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please log in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 8 characters.';
    case 'auth/user-not-found':
      return 'No account found with this email. Please sign up first.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check and try again.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled. Please contact support.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with the same email but different sign-in method.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed. Please try again.';
    case 'auth/popup-blocked':
      return 'Pop-up was blocked by your browser. Please allow pop-ups and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    
    // Firestore quota/billing errors (free tier limits)
    case 'resource-exhausted':
      return 'Server is busy. Please try again in a few minutes.';
    case 'quota-exceeded':
      return 'Daily limit reached. Please try again tomorrow.';
    case 'unavailable':
      return 'Service temporarily unavailable. Please try again later.';
    case 'permission-denied':
      return 'Access denied. Please log in again.';
    
    // Default fallback
    default:
      // Return the error message if it exists, otherwise a generic message
      if (error.message) {
        // Remove "Firebase: " or "Error (auth/...)" prefixes from the message
        let msg = error.message;
        msg = msg.replace(/^Firebase:\s*/i, '');
        msg = msg.replace(/^Error\s*\(auth\/[^)]+\)\.\s*/i, '');
        return msg || 'An error occurred. Please try again.';
      }
      return 'An error occurred. Please try again.';
  }
}
