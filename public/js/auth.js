// ============================================
// 認証ページ (index.html) のロジック
// ============================================

let currentTab = 'login';

// 既にログイン済みならアプリへ
(async () => {
  const user = await getUser();
  if (user) window.location.href = '/app.html';
})();

function switchTab(tab) {
  currentTab = tab;
  const loginTab = document.getElementById('tab-login');
  const signupTab = document.getElementById('tab-signup');
  const nameField = document.getElementById('name-field');
  const submitText = document.getElementById('submit-text');
  const errorMsg = document.getElementById('error-msg');
  const successMsg = document.getElementById('success-msg');

  errorMsg.classList.add('hidden');
  successMsg.classList.add('hidden');

  if (tab === 'login') {
    loginTab.className = 'flex-1 py-3 text-sm font-bold text-center transition-colors border-b-2 border-indigo-500 text-indigo-600';
    signupTab.className = 'flex-1 py-3 text-sm font-bold text-center transition-colors border-b-2 border-transparent text-slate-400 hover:text-slate-600';
    nameField.classList.add('hidden');
    submitText.textContent = 'ログイン';
  } else {
    signupTab.className = 'flex-1 py-3 text-sm font-bold text-center transition-colors border-b-2 border-indigo-500 text-indigo-600';
    loginTab.className = 'flex-1 py-3 text-sm font-bold text-center transition-colors border-b-2 border-transparent text-slate-400 hover:text-slate-600';
    nameField.classList.remove('hidden');
    submitText.textContent = '新規登録';
  }
}

async function handleSubmit(e) {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const errorMsg = document.getElementById('error-msg');
  const successMsg = document.getElementById('success-msg');
  const submitBtn = document.getElementById('submit-btn');

  errorMsg.classList.add('hidden');
  successMsg.classList.add('hidden');
  submitBtn.disabled = true;
  submitBtn.style.opacity = '0.5';

  try {
    if (currentTab === 'signup') {
      const displayName = document.getElementById('display-name').value.trim();
      if (!displayName) {
        throw new Error('表示名を入力してください');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName }
        }
      });

      if (error) throw error;

      // Supabase の設定によってはメール確認が必要
      if (data.user && !data.session) {
        successMsg.textContent = '確認メールを送信しました。メール内のリンクをクリックしてください。';
        successMsg.classList.remove('hidden');
      } else {
        window.location.href = '/app.html';
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      window.location.href = '/app.html';
    }
  } catch (err) {
    errorMsg.textContent = err.message === 'Invalid login credentials'
      ? 'メールアドレスまたはパスワードが正しくありません'
      : err.message;
    errorMsg.classList.remove('hidden');
  } finally {
    submitBtn.disabled = false;
    submitBtn.style.opacity = '1';
  }
}
