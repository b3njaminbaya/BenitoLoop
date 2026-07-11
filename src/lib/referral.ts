const STORAGE_KEY = "nyuzi:referral_code";

// Captures ?ref=CODE from the URL into local storage so it survives
// browsing between landing on a referral link and actually signing up.
export function captureReferralCode() {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");
  if (ref && ref.trim()) {
    localStorage.setItem(STORAGE_KEY, ref.trim());
  }
}

export function getStoredReferralCode(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}
