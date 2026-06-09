const STORAGE_KEY = "latest_compare_result";

// Check that temporary browser storage is available.
function canUseSessionStorage() {
  return typeof window !== "undefined" && Boolean(window.sessionStorage);
}

// Save the newest result so it can be reopened in this browser tab.
export function saveComparisonResult(result) {
  if (!canUseSessionStorage() || !result || typeof result !== "object") {
    return;
  }

  try {
    // Browser storage accepts strings, so the object is converted to JSON.
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result));
  } catch {
    // Ignore storage failures and keep the in-memory navigation flow working.
  }
}

// Read the newest saved comparison result.
export function readComparisonResult() {
  if (!canUseSessionStorage()) {
    return null;
  }

  try {
    const rawValue = window.sessionStorage.getItem(STORAGE_KEY);

    if (!rawValue) {
      return null;
    }

    // Convert the saved JSON string back into a JavaScript object.
    const parsed = JSON.parse(rawValue);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

// Remove the old result before starting a new comparison.
export function clearComparisonResult() {
  if (!canUseSessionStorage()) {
    return;
  }

  window.sessionStorage.removeItem(STORAGE_KEY);
}
