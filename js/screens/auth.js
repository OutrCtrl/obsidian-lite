const AuthScreen = {
  render(mode = 'login') {
    return `
<div class="auth-wrap">
  <div class="auth-logo">
    <svg width="56" height="56" viewBox="0 0 80 80" fill="none">
      <defs><linearGradient id="ag" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#9B4FDE"/><stop offset="100%" stop-color="#5B1FA0"/></linearGradient></defs>
      <polygon points="40,4 72,20 76,52 56,76 24,76 4,52 8,20" fill="url(#ag)" opacity=".15"/>
      <polygon points="40,4 72,20 76,52 56,76 24,76 4,52 8,20" fill="none" stroke="url(#ag)" stroke-width="1.5"/>
      <polygon points="40,18 62,28 64,50 50,66 30,66 16,50 18,28" fill="url(#ag)" opacity=".3"/>
      <polygon points="40,30 54,36 55,50 45,60 35,60 25,50 26,36" fill="url(#ag)" opacity=".6"/>
      <circle cx="40" cy="40" r="6" fill="#C89CFF" opacity=".9"/>
    </svg>
    <div class="auth-title">Obsidian <span style="color:var(--accent)">LITE</span></div>
    <div class="auth-sub">${mode === 'login' ? 'Welcome back' : 'Create your account'}</div>
  </div>
  <div id="auth-error"></div>
  <div class="input-group">
    <label class="input-label">EMAIL</label>
    <input class="input" id="auth-email" type="email" placeholder="you@example.com" autocomplete="email">
  </div>
  <div class="input-group">
    <label class="input-label">PASSWORD</label>
    <input class="input" id="auth-password" type="password" placeholder="••••••••" autocomplete="${mode === 'login' ? 'current-password' : 'new-password'}">
  </div>
  ${mode === 'signup' ? `
  <div class="input-group">
    <label class="input-label">CONFIRM PASSWORD</label>
    <input class="input" id="auth-confirm" type="password" placeholder="••••••••">
  </div>` : ''}
  <button class="btn btn-primary" id="auth-submit" style="margin-top:8px">
    ${mode === 'login' ? 'Sign In' : 'Create Account'}
  </button>
  <div class="auth-switch">
    ${mode === 'login'
      ? 'New here? <a id="auth-toggle">Create account</a>'
      : 'Already have an account? <a id="auth-toggle">Sign in</a>'}
  </div>
</div>`;
  },

  bind(mode, onSuccess) {
    document.getElementById('auth-toggle').onclick = () => {
      const newMode = mode === 'login' ? 'signup' : 'login';
      document.getElementById('screen').innerHTML = this.render(newMode);
      this.bind(newMode, onSuccess);
    };

    document.getElementById('auth-submit').onclick = async () => {
      const email = document.getElementById('auth-email').value.trim();
      const password = document.getElementById('auth-password').value;
      const errEl = document.getElementById('auth-error');
      errEl.innerHTML = '';

      if (!email || !password) {
        errEl.innerHTML = '<div class="error-msg">Please fill in all fields.</div>';
        return;
      }

      if (mode === 'signup') {
        const confirm = document.getElementById('auth-confirm').value;
        if (password !== confirm) {
          errEl.innerHTML = '<div class="error-msg">Passwords do not match.</div>';
          return;
        }
        if (password.length < 6) {
          errEl.innerHTML = '<div class="error-msg">Password must be at least 6 characters.</div>';
          return;
        }
      }

      const btn = document.getElementById('auth-submit');
      btn.textContent = '...';
      btn.disabled = true;

      try {
        if (mode === 'login') {
          const { data, error } = await DB.signIn(email, password);
          if (error) {
            errEl.innerHTML = '<div class="error-msg">' + error.message + '</div>';
            btn.textContent = 'Sign In';
            btn.disabled = false;
          } else if (data?.user) {
            APP.user = data.user;
            await APP.loadProfile();
          }
        } else {
          const { data, error } = await DB.signUp(email, password);
          if (error) {
            errEl.innerHTML = '<div class="error-msg">' + error.message + '</div>';
            btn.textContent = 'Create Account';
            btn.disabled = false;
          } else {
            errEl.innerHTML = '<div class="error-msg" style="color:var(--up)">Account created! Signing you in...</div>';
            await new Promise(r => setTimeout(r, 1000));
            const { data: d2, error: e2 } = await DB.signIn(email, password);
            if (e2) {
              errEl.innerHTML = '<div class="error-msg">' + e2.message + '</div>';
              btn.textContent = 'Create Account';
              btn.disabled = false;
            } else if (d2?.user) {
              APP.user = d2.user;
              await APP.loadProfile();
            }
          }
        }
      } catch(e) {
        errEl.innerHTML = '<div class="error-msg">Something went wrong. Try again.</div>';
        btn.textContent = mode === 'login' ? 'Sign In' : 'Create Account';
        btn.disabled = false;
      }
    };

    ['auth-email','auth-password','auth-confirm'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('keydown', e => {
        if (e.key === 'Enter') document.getElementById('auth-submit').click();
      });
    });
  }
};
