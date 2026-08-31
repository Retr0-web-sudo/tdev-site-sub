/**
 * Supabase ? Neon compatibility layer.
 * Routes all Supabase-style queries to our Express + Neon API.
 * No real Supabase dependency � browser never touches the database directly.
 */

const API = typeof import.meta.env.VITE_API_URL === 'string' ? import.meta.env.VITE_API_URL : '/api';

let token = null;
try { token = localStorage.getItem('tdev_token') } catch (e) {}

function getToken() { return token }

export function setToken(t) {
  token = t;
  try { if (t) localStorage.setItem('tdev_token', t); else localStorage.removeItem('tdev_token') } catch (e) {}
}

async function fetchAPI(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const t = getToken();
  if (t) headers['Authorization'] = 'Bearer ' + t;
  try {
    const res = await fetch(API + path, { method: method, headers: headers, body: body ? JSON.stringify(body) : undefined });
    const json = await res.json();
    if (!res.ok || json?.success === false) return { data: null, error: new Error(json?.error || 'Request failed') };
    return { data: json.data !== undefined ? json.data : json, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}

function route(table) {
  const map = {
    profiles: '/profiles', blog_posts: '/blog', custom_design_requests: '/design-requests',
    page_views: '/page-views', discount_codes: '/discount-codes', site_settings: '/settings',
    messages: '/messages', products: '/products', categories: '/categories',
    orders: '/orders', announcements: '/announcements',
  };
  return map[table] || '/' + table;
}

class QB {
  constructor(t) { this.t = t; this.f = []; this.o = null; this.oa = true; this.s = false; this.l = null }
  select() { return this }
  eq(c, v) { this.f.push({ c, v, op: 'eq' }); return this }
  neq(c, v) { this.f.push({ c, v, op: 'neq' }); return this }
  gt(c, v) { this.f.push({ c, v, op: 'gt' }); return this }
  gte(c, v) { this.f.push({ c, v, op: 'gte' }); return this }
  lt(c, v) { this.f.push({ c, v, op: 'lt' }); return this }
  lte(c, v) { this.f.push({ c, v, op: 'lte' }); return this }
  like(c, v) { this.f.push({ c, v, op: 'like' }); return this }
  ilike(c, v) { this.f.push({ c, v, op: 'ilike' }); return this }
  is(c, v) { this.f.push({ c, v, op: 'is' }); return this }
  in(c, v) { this.f.push({ c, v, op: 'in' }); return this }
  contains(c, v) { this.f.push({ c, v, op: 'contains' }); return this }
  textSearch(c, q) { this.f.push({ c, v: q, op: 'textSearch' }); return this }
  order(c, o) { this.o = c; this.oa = o?.ascending ?? true; return this }
  single() { this.s = true; return this }
  maybeSingle() { this.s = true; return this }
  limit(n) { this.l = n; return this }
  then(r) { const p = this.exec(); if (r) p.then(r); return p }
  async exec() {
    try {
      const r = route(this.t);
      const slugF = this.f.find(f => f.c === 'slug' && f.op === 'eq');
      if (slugF && this.s && this.t === 'products') {
        const res = await fetchAPI('GET', '/products/' + encodeURIComponent(slugF.v));
        if (res.data && !Array.isArray(res.data)) return { data: res.data, error: null, count: 1 };
      }
      const res = await fetchAPI('GET', r);
      if (res.error) return { data: null, error: res.error, count: 0 };
      let d = res.data; if (!Array.isArray(d)) d = d ? [d] : [];
      for (const f of this.f) {
        d = d.filter(item => {
          const v = item[f.c];
          switch (f.op) {
            case 'eq': return v == f.v; case 'neq': return v != f.v;
            case 'gt': return v > f.v; case 'gte': return v >= f.v;
            case 'lt': return v < f.v; case 'lte': return v <= f.v;
            case 'like': case 'ilike': return typeof v === 'string' && !!v.toLowerCase().match('^' + String(f.v).replace(/%/g, '.*').toLowerCase() + '$');
            case 'is': return f.v === null ? v === null || v === undefined : v === f.v;
            case 'in': return Array.isArray(f.v) && f.v.includes(v);
            case 'contains': return Array.isArray(v) ? v.includes(f.v) : String(v).includes(String(f.v));
            case 'textSearch': return String(v).toLowerCase().includes(String(f.v).toLowerCase());
            default: return true;
          }
        });
      }
      if (this.o) d.sort((a, b) => { const av = a[this.o] ?? '', bv = b[this.o] ?? ''; const c = typeof av === 'string' ? av.localeCompare(bv) : (av - bv); return this.oa ? c : -c });
      if (this.l !== null && d.length > this.l) d = d.slice(0, this.l);
      if (this.s) return { data: d[0] ?? null, error: null, count: d[0] ? 1 : 0 };
      return { data: d, error: null, count: d.length };
    } catch (err) { console.error('[supabase]', this.t, err); return { data: null, error: err, count: 0 } }
  }
}

class IB {
  constructor(t, v) { this.t = t; this.v = v; this.r = false; this.s = false }
  select() { this.r = true; return this }
  single() { this.s = true; return this }
  then(r) { const p = this.exec(); if (r) p.then(r); return p }
  async exec() {
    const res = await fetchAPI('POST', route(this.t), this.v);
    if (res.error) return { data: null, error: res.error };
    if (this.r) { const row = res.data || this.v; return { data: this.s ? row : [row], error: null } }
    return { data: res.data || null, error: null };
  }
}

class UB {
  constructor(t, v) { this.t = t; this.v = v; this.f = [] }
  eq(c, v) { this.f.push({ c, v }); return this }
  then(r) { const p = this.exec(); if (r) p.then(r); return p }
  async exec() {
    const id = this.f.find(f => f.c === 'id')?.v;
    if (!id) return { data: null, error: new Error('Update requires id filter') };
    const res = await fetchAPI('PUT', route(this.t) + '/' + id, this.v);
    return res.error ? { data: null, error: res.error } : { data: res.data || null, error: null };
  }
}

class DB {
  constructor(t) { this.t = t; this.f = [] }
  eq(c, v) { this.f.push({ c, v }); return this }
  then(r) { const p = this.exec(); if (r) p.then(r); return p }
  async exec() {
    const id = this.f.find(f => f.c === 'id')?.v;
    if (!id) return { error: new Error('Delete requires id filter') };
    const res = await fetchAPI('DELETE', route(this.t) + '/' + id);
    return res.error ? { error: res.error } : { error: null };
  }
}

const authListeners = [];

const auth = {
  getSession: async () => {
    const t = getToken(); if (!t) return { data: { session: null }, error: null };
    const res = await fetchAPI('GET', '/auth/me');
    if (res.data?.user) return { data: { session: { user: { id: res.data.user.id, email: res.data.user.email, user_metadata: {} }, access_token: t } }, error: null };
    return { data: { session: null }, error: null };
  },
  signInWithPassword: async ({ email, password }) => {
    const res = await fetchAPI('POST', '/auth/login', { email, password });
    if (res.data?.token) {
      setToken(res.data.token);
      const session = { user: { id: res.data.user.id, email: res.data.user.email, user_metadata: {} }, access_token: res.data.token };
      authListeners.forEach(cb => cb('SIGNED_IN', session));
      return { data: { session, user: session.user }, error: null };
    }
    return { data: { user: null, session: null }, error: res.error };
  },
  signUp: async ({ email, password }, options) => {
    const res = await fetchAPI('POST', '/auth/signup', { email, password, displayName: options?.data?.display_name });
    if (res.data?.token) {
      setToken(res.data.token);
      const session = { user: { id: res.data.user.id, email: res.data.user.email, user_metadata: {} }, access_token: res.data.token };
      authListeners.forEach(cb => cb('SIGNED_IN', session));
      return { data: { session, user: session.user }, error: null };
    }
    return { data: { user: res.data?.user || null, session: null }, error: res.error };
  },
  signOut: async () => { setToken(null); authListeners.forEach(cb => cb('SIGNED_OUT', null)); return { error: null } },
  onAuthStateChange: (cb) => {
    authListeners.push(cb);
    const t = getToken();
    if (t) fetchAPI('GET', '/auth/me').then(res => { if (res.data?.user) cb('INITIAL_SESSION', { user: { id: res.data.user.id, email: res.data.user.email, user_metadata: {} }, access_token: t }) });
    return { data: { subscription: { unsubscribe: () => { const i = authListeners.indexOf(cb); if (i >= 0) authListeners.splice(i, 1) } } } };
  },
  setSession: async ({ access_token }) => { setToken(access_token); return { data: { session: null }, error: null } },
  getUser: async () => {
    const t = getToken(); if (!t) return { data: { user: null }, error: null };
    const res = await fetchAPI('GET', '/auth/me');
    if (res.data?.user) return { data: { user: { id: res.data.user.id, email: res.data.user.email, user_metadata: {} } }, error: null };
    return { data: { user: null }, error: null };
  },
  refreshSession: async () => ({ data: { session: null }, error: null }),
  resetPasswordForEmail: async (email) => {
    const res = await fetchAPI('POST', '/auth/reset-password', { email });
    return res.error ? { data: null, error: res.error } : { data: {}, error: null };
  },
  updateUser: async (attributes) => {
    const t = getToken(); if (!t) return { data: { user: null }, error: new Error('Not authenticated') };
    const res = await fetchAPI('PUT', '/auth/me', attributes);
    return res.error ? { data: { user: null }, error: res.error } : { data: { user: res.data }, error: null };
  },
};

const storage = {
  from: (bucket) => ({
    getPublicUrl: (path) => ({ data: { publicUrl: path } }),
    upload: async (path, file) => ({ data: { path }, error: null }),
    list: async () => ({ data: [], error: null }),
    remove: async (paths) => ({ data: { paths }, error: null }),
  }),
};

export const supabase = {
  from: (table) => { const q = new QB(table); return Object.assign(q, { insert: (v) => new IB(table, v), update: (v) => new UB(table, v), delete: () => new DB(table) }) },
  auth,
  storage,
  rpc: async (fn, params) => {
    if (fn === 'has_role') {
      const t = getToken(); if (!t) return { data: null, error: new Error('Not authenticated') };
      const res = await fetchAPI('GET', '/auth/me');
      return { data: (res.data?.user?.role || 'user') === 'admin', error: null };
    }
    return { data: null, error: null };
  },
  channel: (name) => ({ on: () => ({ subscribe: () => {}, unsubscribe: () => {} }), subscribe: () => {}, unsubscribe: () => {} }),
  removeChannel: () => {},
  removeAllChannels: () => {},
  functions: {
    invoke: async (fn, options) => {
      try {
        const res = await fetch(API + '/functions/' + fn, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: options?.body ? JSON.stringify(options.body) : undefined });
        const json = await res.json();
        if (!res.ok) return { data: null, error: new Error(json?.error || 'Function ' + fn + ' failed') };
        return { data: json.data !== undefined ? json.data : json, error: null };
      } catch (err) { return { data: null, error: err } }
    },
  },
};
