const ERROR_MAP = {
  "auth/email-already-in-use": "This email address is already registered.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/weak-password": "Password setup failed. Please try again.",
  "auth/user-not-found": "No account was found with this email.",
  "auth/wrong-password": "Email or password is incorrect.",
  "auth/invalid-credential": "Email or password is incorrect.",
  "auth/too-many-requests": "Too many attempts. Please try again shortly.",
  "auth/network-request-failed": "Network error. Please check your connection.",
};

export function normalizeAuthError(error, fallbackMessage) {
  const code = error?.code || "";
  return ERROR_MAP[code] || error?.message || fallbackMessage;
}
