(function () {
  const STORAGE_KEY = "vaultforge_member";

  function saveMember(member) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(member));
  }

  function getMember() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch (e) {
      return null;
    }
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    window.location.href = "/member-login.html";
  }

  function requireLogin() {
    const member = getMember();
    if (!member) {
      window.location.href = "/member-login.html";
    }
    return member;
  }

  window.VaultForgeAuth = {
    saveMember,
    getMember,
    logout,
    requireLogin
  };
})();
