const STORAGE_KEY = "vaultforge_access_granted";
const NEXT_KEY = "vaultforge_next_route";
const DEFAULT_ROUTE = "/admin.html";
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
  localStorage.removeItem(NEXT_KEY);
  window.location.href = "/login.html";
}

export function requireAuth() {
  if (isAuthenticated()) return;

  const next = window.location.pathname || DEFAULT_ROUTE;
  localStorage.setItem(NEXT_KEY, next);
  window.location.href = `/login.html?next=${encodeURIComponent(next)}`;
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
  const queryNext = params.get("next");
  const storedNext = localStorage.getItem(NEXT_KEY);

  const next = queryNext || storedNext || DEFAULT_ROUTE;

  if (
    next === "/login" ||
    next === "/login.html" ||
    next === "login.html"
  ) {
    return DEFAULT_ROUTE;
  }

  return next;
}
Before saving, change this line to your real password:
const AUTH_PASSWORD = "CHANGE_THIS_NOW";
