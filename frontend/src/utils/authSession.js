// These helpers save, read, and clear the user's sign-in data.
const AUTH_KEYS = {
  username: "auth_username",
  userId: "auth_user_id",
  token: "auth_token",
};

// We use both browser storage types because login can be temporary or remembered.
function storages() {
  // localStorage survives browser restarts; sessionStorage ends with the tab.
  return [localStorage, sessionStorage];
}

// Clear saved sign-in data from one storage place.
function clearStorage(storage) {
  storage.removeItem(AUTH_KEYS.username);
  storage.removeItem(AUTH_KEYS.userId);
  storage.removeItem(AUTH_KEYS.token);
  storage.removeItem("user");
}

// Open the token payload so we can check if it has expired.
// In simple terms: read the hidden expiry information inside the sign-in token.
function decodeTokenPayload(token) {
  try {
    // A sign-in token has three parts; the middle part contains its details.
    const payload = token.split(".")[1];

    if (!payload) {
      return null;
    }

    // Change the token text into a form the browser can read.
    const base64 = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(payload.length / 4) * 4, "=");

    return JSON.parse(window.atob(base64));
  } catch {
    return null;
  }
}

// Only accept tokens that are still valid.
function hasUsableToken(token) {
  const payload = decodeTokenPayload(token);
  // Convert the expiry time before comparing it with the current time.
  const expiresAt = Number(payload?.exp) * 1000;

  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

// Read one saved session and reject it if it is broken or old.
function readFrom(storage) {
  // Read the three values that were saved after login.
  const username = storage.getItem(AUTH_KEYS.username);
  const userId = storage.getItem(AUTH_KEYS.userId);
  const token = storage.getItem(AUTH_KEYS.token);

  // A session is only valid if we have all three components
  // A session needs all three saved values.
  if (!username || !userId || !token) {
    clearStorage(storage);
    return null;
  }

  if (!hasUsableToken(token)) {
    // Expired or unreadable tokens are removed immediately.
    clearStorage(storage);
    return null;
  }

  return {
    username,
    userId,
    token,
    rememberMe: storage === localStorage,
  };
}

// Try to get the saved sign-in data.
export function getAuthSession() {

  // Prefer a remembered login, then try the temporary tab session.
  return readFrom(localStorage) || readFrom(sessionStorage);
}

// Simple yes/no check for sign-in.
export function hasAuthSession() {
  return Boolean(getAuthSession());
}

// Save sign-in data after login or signup.
export function setAuthSession({ username, userId, token, rememberMe = true }) {
  // Remove any older session before saving the new one.
  clearAuthSession(); // this will always wipe old sessions first

  // Remember Me saves permanently; otherwise the login lasts for this tab.
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem(AUTH_KEYS.username, username);
  storage.setItem(AUTH_KEYS.userId, String(userId));
  storage.setItem(AUTH_KEYS.token, token); 
}

// Remove all saved sign-in data.
export function clearAuthSession() {
  storages().forEach((storage) => {
    clearStorage(storage);
  });
}
