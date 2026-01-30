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
