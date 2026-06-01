const SUPABASE_URL = 'https://jyqlrgnymodpdvcsqrfi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5cWxyZ255bW9kcGR2Y3NxcmZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMDAxNDcsImV4cCI6MjA5NTg3NjE0N30.YVlLycrPlT23wL16MUFq4t1RzZ85p0i0Ki5acZ6lOcM';

const _sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const DB = {
  // AUTH
  async signUp(email, password) {
    const { data, error } = await _sb.auth.signUp({ email, password });
    return { data, error };
  },
  async signIn(email, password) {
    const { data, error } = await _sb.auth.signInWithPassword({ email, password });
    return { data, error };
  },
  async signOut() {
    return await _sb.auth.signOut();
  },
  async getUser() {
    const { data } = await _sb.auth.getUser();
    return data?.user || null;
  },
  onAuthChange(cb) {
    return _sb.auth.onAuthStateChange((event, session) => cb(event, session));
  },

  // PROFILE
  async getProfile(userId) {
    const { data, error } = await _sb.from('profiles').select('*').eq('id', userId).single();
    return { data, error };
  },
  async updateProfile(userId, updates) {
    const { data, error } = await _sb.from('profiles').update(updates).eq('id', userId).select().single();
    return { data, error };
  },

  // TRADES
  async getTrades(userId, status = null) {
    let q = _sb.from('paper_trades').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (status) q = q.eq('status', status);
    const { data, error } = await q;
    return { data: data || [], error };
  },
  async insertTrade(trade) {
    const { data, error } = await _sb.from('paper_trades').insert(trade).select().single();
    return { data, error };
  },
  async updateTrade(tradeId, updates) {
    const { data, error } = await _sb.from('paper_trades').update(updates).eq('id', tradeId).select().single();
    return { data, error };
  },
  async closeTrade(tradeId, exitPrice, pnl) {
    return await DB.updateTrade(tradeId, { status: 'closed', exit_price: exitPrice, pnl, closed_at: new Date().toISOString() });
  },

  // ADMIN
  async getAllProfiles() {
    const { data, error } = await _sb.from('profiles').select('*').order('created_at', { ascending: false });
    return { data: data || [], error };
  },
  async getAllTrades() {
    const { data, error } = await _sb.from('paper_trades').select('*').order('created_at', { ascending: false }).limit(100);
    return { data: data || [], error };
  }
};
