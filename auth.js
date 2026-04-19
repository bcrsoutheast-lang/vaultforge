(function () {
  const SUPABASE_URL = 'https://mnwwvpuxrzostrplfgmq.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_sXXlF9GsNcVYnr2BxABAwg_T-BV19qJ';

  if (!window.supabase) {
    console.error('Supabase JS not loaded.');
    return;
  }

  const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  async function signIn(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  }

  async function getSession() {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  async function getUser() {
    const { data, error } = await supabaseClient.auth.getUser();
    if (error) throw error;
    return data.user;
  }

  async function logout() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
    window.location.href = '/member-login.html';
  }

  async function requireLogin() {
    const session = await getSession();
    if (!session) {
      window.location.href = '/member-login.html';
      return null;
    }
    return session;
  }

  window.VaultForgeAuth = {
    supabase: supabaseClient,
    signIn,
    getSession,
    getUser,
    logout,
    requireLogin
  };
})();
