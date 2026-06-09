// Read the exact website address currently open in the browser.
export function getCurrentOrigin() {
  // The guard also keeps this helper safe outside a browser.
  if (typeof window === "undefined" || !window.location?.origin) {
    return "";
  }

  return window.location.origin;
}

// Explain how to fix a Google sign-in origin error.
export function buildGoogleOriginMismatchHelpMessage() {
  const currentOrigin = getCurrentOrigin();

  if (!currentOrigin) {
    return "Google sign-in is not available right now. Check the Google OAuth app configuration.";
  }

  return `Google sign-in is blocked for this origin. Add ${currentOrigin} to Authorized JavaScript origins in Google Cloud Console.`;
}
