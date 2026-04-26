import i18n from '../i18n';

/**
 * Map known error messages to their i18n keys for translation
 * Used when catching errors from AuthContext that throw English messages
 */
const errorMessageKeyMap: Record<string, string> = {
  'Please verify your email before logging in. Check your inbox for the verification link.': 'auth.verification.checkEmailBefore',
  'Username already in use. Please choose a different one.': 'auth.firebaseErrors.duplicate-username',
  'Failed to complete registration. Please check your internet connection and try again.': 'auth.firebaseErrors.default',
  'You can only change your nickname 2 times per month. Try again next month.': 'auth.firebaseErrors.nickname-limit',
  'Password is required to delete your account.': 'auth.firebaseErrors.password-required',
  'Email not found.': 'auth.firebaseErrors.email-not-found',
  'No user is currently signed in.': 'auth.firebaseErrors.no-user-signed-in',
  'Email is already verified.': 'auth.firebaseErrors.email-already-verified',
  'This email is already registered. Please log in instead.': 'auth.firebaseErrors.email-already-in-use',
  'Please enter a valid email address.': 'auth.firebaseErrors.invalid-email',
  'Password is too weak. Please use at least 8 characters.': 'auth.firebaseErrors.weak-password',
  'No account found with this email. Please sign up first.': 'auth.firebaseErrors.user-not-found',
  'Incorrect password. Please try again.': 'auth.firebaseErrors.wrong-password',
  'Invalid email or password. Please check and try again.': 'auth.firebaseErrors.invalid-credential',
  'Too many failed attempts. Please try again later.': 'auth.firebaseErrors.too-many-requests',
  'This account has been disabled. Please contact support.': 'auth.firebaseErrors.user-disabled',
  'This sign-in method is not enabled. Please contact support.': 'auth.firebaseErrors.operation-not-allowed',
  'An account already exists with the same email but different sign-in method.': 'auth.firebaseErrors.account-exists-with-different-credential',
  'Sign-in popup was closed. Please try again.': 'auth.firebaseErrors.popup-closed-by-user',
  'Pop-up was blocked by your browser. Please allow pop-ups and try again.': 'auth.firebaseErrors.popup-blocked',
  'Network error. Please check your connection and try again.': 'auth.firebaseErrors.network-request-failed',
  'Server is busy. Please try again in a few minutes.': 'auth.firebaseErrors.resource-exhausted',
  'Daily limit reached. Please try again tomorrow.': 'auth.firebaseErrors.quota-exceeded',
  'Service temporarily unavailable. Please try again later.': 'auth.firebaseErrors.unavailable',
  'Access denied. Please log in again.': 'auth.firebaseErrors.permission-denied',
};

/**
 * Translate an error message to its i18n key
 * Falls back to the original message if no mapping found
 */
export function getErrorMessageKey(message: string): string {
  return errorMessageKeyMap[message] || 'auth.firebaseErrors.default';
}

/**
 * Translate a caught error message using i18n
 * Use this when catching errors from AuthContext promises
 */
export function translateError(errorMessage: string): string {
  const key = getErrorMessageKey(errorMessage);
  
  // Check if it's a nickname cooldown error with a day count
  if (errorMessage.includes('Please wait') && errorMessage.includes('more day(s)')) {
    const match = errorMessage.match(/(\d+)/);
    if (match) {
      const count = parseInt(match[1], 10);
      return i18n.t('auth.firebaseErrors.nickname-cooldown', { count });
    }
  }
  
  return i18n.t(key);
}
