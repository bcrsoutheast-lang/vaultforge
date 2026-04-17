const STORAGE_KEY = "vaultforge_access_granted";
const DEFAULT_ROUTE = "/admin";
const AUTH_PASSWORD = "CHANGE_THIS_NOW";

export function isAuthenticated() {
  return localStorage.getItem(STORAGE_KEY) === "yes";
}

export function setAuthenticated(value) {
  if (value) {
    localStorage.setItem(STORAGE_KEY, "yes");
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function logout() {
  setAuthenticated(false);
  window.location.href = "/login.html";
}

export function requireAuth() {
  if (!isAuthenticated()) {
    const next = encodeURIComponent(window.location.pathname);
    window.location.href = `/login.html?next=${next}`;
  }
}

export function attemptLogin(password) {
  if (password === AUTH_PASSWORD) {
    setAuthenticated(true);
    return true;
  }
  return false;
}

export function getNextRoute() {
  const params = new URLSearchParams(window.location.search);
  return params.get("next") || DEFAULT_ROUTE;
}
