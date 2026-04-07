// ============================================
// Supabase 設定 & ヘルパー関数
// ============================================

const SUPABASE_URL = 'https://ykiewzfcmoyzfpiyshla.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlraWV3emZjbW95emZwaXlzaGxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MzE0MDYsImV4cCI6MjA5MTEwNzQwNn0.ArAEJQ-oBnXYb0tbofJqEywOuQCx2JhUA_9kuGD0-PQ';

const { createClient } = window.supabase || window.Supabase || {};
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- 認証 ---
async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) console.error('Profile fetch error:', error);
  return data;
}

async function requireAuth() {
  const user = await getUser();
  if (!user) { window.location.href = '/index.html'; return null; }
  return user;
}

async function requireRole(roles) {
  const user = await requireAuth();
  if (!user) return null;
  const profile = await getProfile(user.id);
  if (!profile || !roles.includes(profile.role)) {
    window.location.href = '/app.html';
    return null;
  }
  return { user, profile };
}

async function requireAdmin() { return requireRole(['admin']); }
async function requireManager() { return requireRole(['manager', 'admin']); }

// --- 画像アップロード ---
async function uploadEvidence(file, userId, skillId) {
  const ext = file.name.split('.').pop();
  const path = `${userId}/${skillId}_${Date.now()}.${ext}`;
  const { data, error } = await supabase.storage
    .from('evidence')
    .upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) { console.error('Upload error:', error); return null; }
  const { data: urlData } = supabase.storage.from('evidence').getPublicUrl(path);
  return urlData.publicUrl;
}

// --- ユーティリティ ---
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function timeAgo(dateStr) {
  const now = new Date();
  const d = new Date(dateStr);
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'たった今';
  if (diff < 3600) return `${Math.floor(diff / 60)}分前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}日前`;
  return d.toLocaleDateString('ja-JP');
}
