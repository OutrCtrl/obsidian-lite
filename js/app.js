const APP = {
  user: null,
  profile: null,
  currentScreen: 'dashboard',

  async init() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    setTimeout(() => {
      const splash = document.getElementById('splash');
      if (splash) { splash.classList.add('hide'); setTimeout(() => splash.remove(), 600); }
    }, 2000);
    try { ENGINE.connect(); } catch(e) {}
    try {
      const user = await DB.getUser();
      if (user) { this.user = user; await this.loadProfile(); }
      else { this.showAuth(); }
    } catch(e) { this.showAuth(); }
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
      if (needsOnboarding) { this.showOnboarding(); }
      else { this.showApp(); }
    } catch(e) { this.showAuth(); }
  },

  showAuth() {
    document.getElementById('app').style.display = 'flex';
    document.getElementById('nav').style.display = 'none';
    document.getElementById('screen').style.paddingBottom = '0';
    document.getElementById('screen').innerHTML = AuthScreen.render('login');
    AuthScreen.bind('login', () => {});
  },

  showOnboarding() {
    document.getElementById('app').style.display = 'flex';
    document.getElementById('nav').style.display = 'none';
    document.getElementById('screen').style.paddingBottom = '0';
    document.getElementById('screen').innerHTML = OnboardingScreen.render(1);
    OnboardingScreen.bind(1, this.profile, async () => {
      const { data } = await DB.getProfile(this.user.id);
      if (data) this.profile = data;
      this.showApp();
    });
  },

  async showApp() {
    document.getElementById('app').style.display = 'flex';
    document.getElementById('nav').style.display = 'flex';
    document.getElementById('screen').style.paddingBottom = '80px';
    if (this.profile && this.profile.role === 'super_admin') {
      const btn = document.getElementById('nav-admin');
      if (btn) btn.style.display = 'flex';
    }
    if (this.profile && this.profile.bot_active) {
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
      el.innerHTML = '<div class="empty"><div class="empty-icon">⚠️</div><div class="empty-text">Error: ' + e.message + '</div></div>';
    }
  },

  bindNav() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.onclick = () => this.navigate(btn.dataset.screen);
    });
  }
};

document.addEventListener('DOMContentLoaded', () => APP.init());
