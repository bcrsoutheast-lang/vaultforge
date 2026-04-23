(function () {
  const SUPABASE_URL = 'https://mnwwvpuxrzostrplfgmq.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_sXXlF9GsNcVYnr2BxABAwg_T-BV19qJ';

  if (!window.supabase) {
    console.error('Supabase JS not loaded.');
    return;
  }

  const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );

  function safeString(v) {
    return String(v || '').trim();
  }

  async function signIn(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  }

  async function signUp(email, password) {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password
    });
    if (error) throw error;
    return data;
  }

  async function resetPassword(email) {
    const { data, error } =
      await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/member-login.html'
      });

    if (error) throw error;
    return data;
  }

  async function getSession() {
    const { data, error } =
      await supabaseClient.auth.getSession();

    if (error) throw error;
    return data.session;
  }

  async function getUser() {
    const { data, error } =
      await supabaseClient.auth.getUser();

    if (error) throw error;
    return data.user;
  }

  async function getMyProfile() {
    const user = await getUser();

    if (!user) return null;

    const { data, error } = await supabaseClient
      .from('member_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;

    return data;
  }

  async function isAdmin() {
    const profile = await getMyProfile();

    if (!profile) return false;

    return (
      profile.is_admin === true ||
      profile.role === 'admin'
    );
  }

  function profileCompleteness(profile) {
    if (!profile) return 18;

    const checks = [
      profile.full_name,
      profile.primary_market,
      profile.company_name,
      profile.role,
      profile.phone,
      profile.website,
      profile.investment_focus,
      profile.buy_box,
      profile.bio,
      profile.profile_photo_url
    ];

    const filled = checks.filter(Boolean).length;

    return Math.max(
      18,
      Math.min(
        100,
        Math.round((filled / checks.length) * 100)
      )
    );
  }

  function isProfileReadyForCheckout(profile) {
    if (!profile) return false;

    if (
      profile.is_admin === true ||
      profile.role === 'admin'
    ) return true;

    return profileCompleteness(profile) >= 70;
  }

  function isFounderUnlocked(profile) {
    if (!profile) return false;

    if (
      profile.is_admin === true ||
      profile.role === 'admin'
    ) return true;

    return (
      profile.paid_member === true ||
      profile.founder_access === true ||
      profile.plan === 'founder49'
    );
  }

  async function getAccessState() {
    const session = await getSession();

    if (!session) {
      return {
        loggedIn: false,
        session: null,
        user: null,
        profile: null,
        isAdmin: false,
        profileComplete: false,
        profileReadyForCheckout: false,
        founderUnlocked: false,
        paidMember: false
      };
    }

    const user = session.user || null;
    let profile = null;

    if (user) {
      try {
        const { data } = await supabaseClient
          .from('member_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        profile = data || null;
      } catch (e) {}
    }

    const admin = !!(
      profile &&
      (
        profile.is_admin === true ||
        profile.role === 'admin'
      )
    );

    const complete =
      profileCompleteness(profile) >= 70;

    const readyForCheckout =
      isProfileReadyForCheckout(profile);

    const unlocked =
      isFounderUnlocked(profile);

    const paidMember = !!(
      profile &&
      (
        profile.paid_member === true ||
        profile.founder_access === true ||
        profile.plan === 'founder49'
      )
    );

    return {
      loggedIn: true,
      session,
      user,
      profile,
      isAdmin: admin,
      profileComplete: complete,
      profileReadyForCheckout: readyForCheckout,
      founderUnlocked: unlocked,
      paidMember
    };
  }

  async function routeAfterLogin() {
    try {
      const access =
        await getAccessState();

      if (access.isAdmin) {
        window.location.href =
          '/admin.html';
        return;
      }

      if (!access.profile) {
        window.location.href =
          '/member-profile.html';
        return;
      }

      if (!access.profileReadyForCheckout) {
        window.location.href =
          '/member-profile.html';
        return;
      }

      if (!access.founderUnlocked) {
        window.location.href =
          '/founding.html';
        return;
      }

      window.location.href =
        '/members.html';

    } catch (e) {
      window.location.href =
        '/members.html';
    }
  }

  async function requireLogin() {
    const session =
      await getSession();

    if (!session) {
      window.location.href =
        '/member-login.html';
      return null;
    }

    return session;
  }

  async function requireAdmin() {
    const session =
      await requireLogin();

    if (!session) return null;

    const admin =
      await isAdmin();

    if (!admin) {
      window.location.href =
        '/members.html';
      return null;
    }

    return session;
  }

  async function logout() {
    const { error } =
      await supabaseClient.auth.signOut();

    if (error) throw error;

    window.location.href =
      '/member-login.html';
  }

  window.VaultForgeAuth = {
    supabase: supabaseClient,
    signIn,
    signUp,
    resetPassword,
    getSession,
    getUser,
    getMyProfile,
    isAdmin,
    logout,
    requireLogin,
    requireAdmin,
    routeAfterLogin,
    getAccessState,
    profileCompleteness,
    isProfileReadyForCheckout,
    isFounderUnlocked
  };
})();
