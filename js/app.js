const APP = {
  user: null,
  profile: null,
  currentScreen: 'dashboard',

  async init() {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // Hide splash after 2s regardless
    setTimeout(() => {
      const splash = document.getElementById('splash');
      if (splash) { splash.classList.add('hide'); setTimeout(() => splash.remove(), 600); }
    }, 2000);

    // Start price feed
    try { ENGINE.connect(); } catch(e) {}

    try {
      const user = await DB.getUser();
      if (user) {
        this.user = user;
        await this.loadProfile();
      } else {
        this.showAuth();
      }
    } catch(e) {
      this.showAuth();
    }

    // Listen for auth changes
    DB.onAuthChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        this.user = session.user;
        await this.loadProfile();
      } else if (event === 'SIGNED_OUT') {
        this.user = null;
        this.profile = null;
        this.showAuth();
      }
    });
  },

  async loadProfile() {
    try {
      let { data, error } = await DB.getProfile(this.user.id);
      if (error || !data) {
        await new Promise(r => setTimeout(r, 1500));
        const { data: d2 } = await DB.getProfile(this.user.id);
        this.profile = d2;
      } else {
        this.profile = data;
      }

      if (!this.profile) { this.showAuth(); return; }

      const needsOnboarding = !this.profile.exchanges || this.profile.exchanges.length === 0;
      if (needsOnboarding) {
        this.showOnboarding();
      } else {
        this.showApp();
      }
    } catch(e) {
      this.showAuth();
    }
  },

  showAuth() {
    const app = document.getElementById('app');
    const screen = document.getElementById('screen');
    const nav = document.getElementById('nav');
    app.style.display = 'flex';
    nav.style.display = 'none';
    screen.style.paddingBottom = '0';
    screen.innerHTML = AuthScreen.render('login');
    AuthScreen.bind('login', () => {});
  },

  showOnboarding() {
    const app = document.getElementById('app');
    const screen = document.getElementById('screen');
    const nav = document.getElementById('nav');
    app.style.display = 'flex';
    nav.style.display = 'none';
    screen.style.padding
