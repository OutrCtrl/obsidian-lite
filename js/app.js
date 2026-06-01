const APP = {
  user: null,
  profile: null,
  currentScreen: 'dashboard',

  async init() {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // Start price feed
    ENGINE.connect();

    // Check auth
    DB.onAuthChange(async (event, session) => {
      if (session?.user) {
        this.user = session.user;
        await this.loadProfile();
      } else {
        this.user = null;
        this.profile = null;
        this.showAuth();
      }
    });

    const user = await DB.getUser();
    if (user) {
      this.user = user;
      await this.loadProfile();
    } else {
      this.showAuth();
    }

    // Hide splash
    setTimeout(() => {
      document.getElementById('splash').classList.add('hide');
      setTimeout(() => document.getElementById('splash').remove(), 600);
    }, 1500);
  },

  async loadProfile() {
    const { data, error } = await DB.getProfile(this.user.id);
    if (error || !data) {
      // Profile may not exist yet (trigger handles it, but wait)
      await new Promise(r => setTimeout(r, 1000));
      const { data: d2 } = await DB.getProfile(this.user.id);
      this.profile = d2;
    } else {
      this.profile = data;
    }

    if (!this.profile) { this.showAuth(); return; }

    // Check if onboarding needed
    const needsOnboarding = !this.profile.selected_exchanges || this.profile.selected_exchanges.length === 0;

    if (needsOnboarding) {
      this.showOnboarding();
    } else {
      this.showApp();
    }
  },

  showAuth() {
    document.getElementById('app').style.display = 'none';
    document.getElementById('screen').innerHTML = AuthScreen.render('login');
    document.getElementById('app').style.display = 'flex';
    document.getElementById('nav').style.display = 'none';
    AuthScreen.bind('login', () => {});
  },

  showOnboarding() {
    document.getElementById('nav').style.display = 'none';
    document.getElementById('screen').style.paddingBottom = '0';
    document.getElementById('screen').innerHTML = OnboardingScreen.render(1);
    OnboardingScreen.bind(1, this.profile, () => {
      this.showApp();
    });
  },

  async showApp() {
    document.getElementById('nav').style.display = 'flex';
    document.getElementById('screen').style.paddingBottom = '80px';

    // Show admin tab if super_admin
    if (this.profile?.role === 'super_admin') {
      document.getElementById('nav-admin').style.display = 'flex';
    }

    // If bot was active, restart it
    if (this.profile?.bot_active) {
      ENGINE.startBot(this.profile, async () => {
        const { data } = await DB.getTrades(this.profile.id, 'open');
        return data || [];
      });
    }

    await this.navigate('dashboard');
    this.bindNav();
  },

  async navigate(screen) {
    this.currentScreen = screen;

    // Update nav
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.screen === screen);
    });

    const el = document.getElementById('screen');
    el.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    el.scrollTop = 0;

    try {
      if (screen === 'dashboard') {
        el.innerHTML = await DashboardScreen.render(this.profile);
        DashboardScreen.bind(this.profile, () => this.navigate('dashboard'));
      } else if (screen === 'activity') {
        el.innerHTML = await ActivityScreen.render(this.profile);
        ActivityScreen.bind(this.profile);
      } else if (screen === 'markets') {
        el.innerHTML = MarketsScreen.render();
        MarketsScreen.bind();
      } else if (screen === 'more') {
        el.innerHTML = MoreScreen.render(this.profile);
        MoreScreen.bind(this.profile, () => this.showAuth());
      } else if (screen === 'admin') {
        el.innerHTML = await AdminScreen.render(this.profile);
        AdminScreen.bind(this.profile);
      }
    } catch(e) {
      el.innerHTML = `<div class="empty"><div class="empty-icon">⚠️</div><div class="empty-text">Error loading screen.<br><small style="color:var(--dim)">${e.message}</small></div></div>`;
    }
  },

  bindNav() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.onclick = () => this.navigate(btn.dataset.screen);
    });
  }
};

document.addEventListener('DOMContentLoaded', () => APP.init());
