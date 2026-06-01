const CACHE = 'obsidian-lite-v1';
const ASSETS = ['/', '/index.html', '/css/tokens.css', '/css/app.css',
  '/js/app.js', '/js/engine.js', '/js/supabase.js',
  '/js/screens/auth.js', '/js/screens/onboarding.js', '/js/screens/dashboard.js',
  '/js/screens/activity.js', '/js/screens/markets.js', '/js/screens/more.js', '/js/screens/admin.js'];

self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {})));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))));
self.addEventListener('fetch', e => {
  if (e.request.url.includes('supabase') || e.request.url.includes('binance')) return;
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).catch(() => caches.match('/index.html'))));
});
