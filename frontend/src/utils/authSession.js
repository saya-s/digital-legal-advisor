// These helpers save, read, and clear the user's sign-in data.
const AUTH_KEYS = {
  username: "auth_username",
  userId: "auth_user_id",
  token: "auth_token",
};

// We use both browser storage types because login can be temporary or remembered.
function storages() {
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
function decodeTokenPayload(token) {
  try {
    const payload = token.split(".")[1];

    if (!payload) {
      return null;
    }

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
  const expiresAt = Number(payload?.exp) * 1000;

  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

// Read one saved session and reject it if it is broken or old.
function readFrom(storage) {
  const username = storage.getItem(AUTH_KEYS.username);
  const userId = storage.getItem(AUTH_KEYS.userId);
  const token = storage.getItem(AUTH_KEYS.token);

  // A session is only valid if we have all three components
  if (!username || !userId || !token) {
    clearStorage(storage);
    return null;
  }

  if (!hasUsableToken(token)) {
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

  return readFrom(localStorage) || readFrom(sessionStorage);
}

// Simple yes/no check for sign-in.
export function hasAuthSession() {
  return Boolean(getAuthSession());
}

// Save sign-in data after login or signup.
export function setAuthSession({ username, userId, token, rememberMe = true }) {
  clearAuthSession(); // this will always wipe old sessions first

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
