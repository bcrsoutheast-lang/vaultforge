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
    return Math.max(18, Math.min(100, Math.round((filled / checks.length) * 100)));
  }

  function isFounderUnlocked(profile) {
    if (!profile) return false;
    if (profile.is_admin === true || profile.role === 'admin') return true;
    return profileCompleteness(profile) >= 70;
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
        founderUnlocked: false
      };
    }

    const user = session.user || null;
    let profile = null;

    if (user) {
      try {
        const { data, error } = await supabaseClient
          .from('member_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!error) {
          profile = data || null;
        }
      } catch (err) {
        console.error('Profile fetch failed:', err);
      }
    }

    const admin =
      !!(profile && (profile.is_admin === true || profile.role === 'admin'));
    const complete = profileCompleteness(profile) >= 70;
    const unlocked = admin || complete;

    return {
      loggedIn: true,
      session,
      user,
      profile,
      isAdmin: admin,
      profileComplete: complete,
      founderUnlocked: unlocked
    };
  }

  async function getPainTableName() {
    for (const tableName of ['pain', 'pain_requests']) {
      try {
        const { error } = await supabaseClient
          .from(tableName)
          .select('*')
          .limit(1);

        if (!error) return tableName;
      } catch (err) {}
    }
    return null;
  }

  async function getPainMatches(limit = 10) {
    const access = await getAccessState();
    if (!access.loggedIn) return [];

    const tableName = await getPainTableName();
    if (!tableName) return [];

    try {
      const { data, error } = await supabaseClient
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit * 3);

      if (error || !Array.isArray(data)) return [];

      const profile = access.profile || {};
      const market = safeString(profile.primary_market).toLowerCase();
      const role = safeString(profile.role).toLowerCase();

      const scored = data.map((row) => {
        let score = 0;
        const category = safeString(row.category || row.pain_category).toLowerCase();
        const urgency = safeString(row.urgency).toLowerCase();
        const rowMarket = safeString(row.market || row.state || row.location).toLowerCase();

        if (urgency === 'urgent') score += 30;
        if (market && rowMarket && rowMarket.includes(market)) score += 25;
        if (role.includes('lender') && category.includes('capital')) score += 30;
        if (role.includes('buyer') && category.includes('buyer')) score += 30;

        return { row, score };
      });

      return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((x) => x.row);
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  async function getListingsForMe(limit = 12) {
    try {
      const { data, error } = await supabaseClient
        .from('property_cards')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error || !Array.isArray(data)) return [];
      return data;
    } catch (err) {
      return [];
    }
  }

  async function getMyMatches(limit = 6) {
    const [listings, pains] = await Promise.all([
      getListingsForMe(limit),
      getPainMatches(limit)
    ]);

    return {
      listings,
      pains
    };
  }

  async function getUnreadAlerts(limit = 12) {
    const access = await getAccessState();
    if (!access.loggedIn) return [];

    const alerts = [];
    const matches = await getMyMatches(6);

    matches.listings.slice(0, 4).forEach((row) => {
      alerts.push({
        type: 'listing',
        title: row.title || 'Listing match',
        href: '/property-cards.html'
      });
    });

    matches.pains.slice(0, 4).forEach((row) => {
      alerts.push({
        type: 'pain',
        title: row.title || 'Pain match',
        href: '/pain.html'
      });
    });

    if (access.isAdmin) {
      alerts.unshift({
        type: 'admin',
        title: 'Admin center ready',
        href: '/admin.html'
      });
    }

    return alerts.slice(0, limit);
  }

  async function routeAfterLogin() {
    try {
      const access = await getAccessState();

      if (access.isAdmin) {
        window.location.href = '/admin.html';
        return;
      }

      if (!access.profile) {
        window.location.href = '/member-profile.html';
        return;
      }

      window.location.href = '/members.html';
    } catch (err) {
      window.location.href = '/members.html';
    }
  }

  async function requireLogin() {
    const session = await getSession();

    if (!session) {
      window.location.href = '/member-login.html';
      return null;
    }

    return session;
  }

  async function requireAdmin() {
    const session = await requireLogin();
    if (!session) return null;

    const admin = await isAdmin();

    if (!admin) {
      window.location.href = '/members.html';
      return null;
    }

    return session;
  }

  async function logout() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;

    window.location.href = '/member-login.html';
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
    isFounderUnlocked,
    getPainTableName,
    getPainMatches,
    getListingsForMe,
    getMyMatches,
    getUnreadAlerts
  };
})();
