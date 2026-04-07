// ============================================
// Supabase 設定
// ============================================
// 以下の値を Supabase Dashboard から取得して置き換えてください
// Settings → API → Project URL / anon public key
// ============================================

const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 認証状態チェック
async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// プロフィール取得
async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) console.error('Profile fetch error:', error);
  return data;
}

// 認証されていなければログインページへ
async function requireAuth() {
  const user = await getUser();
  if (!user) {
    window.location.href = '/index.html';
    return null;
  }
  return user;
}

// 管理者チェック
async function requireAdmin() {
  const user = await requireAuth();
  if (!user) return null;
  const profile = await getProfile(user.id);
  if (!profile || profile.role !== 'admin') {
    window.location.href = '/app.html';
    return null;
  }
  return { user, profile };
}
