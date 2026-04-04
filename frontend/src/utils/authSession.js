const AUTH_KEYS = {
  username: "auth_username",
  userId: "auth_user_id",
  token: "auth_token",
};

function storages() {
  return [localStorage, sessionStorage];
}

function clearStorage(storage) {
  storage.removeItem(AUTH_KEYS.username);
  storage.removeItem(AUTH_KEYS.userId);
  storage.removeItem(AUTH_KEYS.token);
  storage.removeItem("user");
}

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

function hasUsableToken(token) {
  const payload = decodeTokenPayload(token);
  const expiresAt = Number(payload?.exp) * 1000;

  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

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

export function getAuthSession() {

  return readFrom(localStorage) || readFrom(sessionStorage);
}

export function hasAuthSession() {
  return Boolean(getAuthSession());
}

export function setAuthSession({ username, userId, token, rememberMe = true }) {
  clearAuthSession(); // this will always wipe old sessions first

  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem(AUTH_KEYS.username, username);
  storage.setItem(AUTH_KEYS.userId, String(userId));
  storage.setItem(AUTH_KEYS.token, token); 
}

export function clearAuthSession() {
  storages().forEach((storage) => {
    clearStorage(storage);
  });
}
