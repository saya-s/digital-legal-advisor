const AUTH_KEYS = {
  username: "auth_username",
  userId: "auth_user_id",
};

function storages() {
  return [localStorage, sessionStorage];
}

function readFrom(storage) {
  const username = storage.getItem(AUTH_KEYS.username);
  const userId = storage.getItem(AUTH_KEYS.userId);

  if (!username || !userId) {
    return null;
  }

  return {
    username,
    userId,
    rememberMe: storage === localStorage,
  };
}

export function getAuthSession() {
  return readFrom(localStorage) || readFrom(sessionStorage);
}

export function hasAuthSession() {
  return Boolean(getAuthSession());
}

export function setAuthSession({ username, userId, rememberMe = true }) {
  clearAuthSession();

  const storage = rememberMe ? localStorage : sessionStorage;

  storage.setItem(AUTH_KEYS.username, username);
  storage.setItem(AUTH_KEYS.userId, String(userId));
}

export function clearAuthSession() {
  storages().forEach((storage) => {
    storage.removeItem(AUTH_KEYS.username);
    storage.removeItem(AUTH_KEYS.userId);
  });
}
