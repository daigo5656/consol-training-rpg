// ============================================
// 管理画面 (admin.html) のロジック
// ============================================

let allProfiles = [];
let allProgress = [];

(async () => {
  const result = await requireAdmin();
  if (!result) return;

  await loadAllData();
  renderAdmin();

  document.getElementById('loading-screen').style.display = 'none';
  lucide.createIcons();
})();

async function loadAllData() {
  const [profilesRes, progressRes] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: true }),
    supabase.from('skill_progress').select('*')
  ]);

  allProfiles = profilesRes.data || [];
  allProgress = progressRes.data || [];
}

function renderAdmin() {
  renderStats();
  renderUserTable();
  lucide.createIcons();
}

function renderStats() {
  const totalUsers = allProfiles.length;
  const totalCompletions = allProgress.length;
  const avgCompletion = totalUsers > 0
    ? Math.round(totalCompletions / totalUsers)
    : 0;
  const fullyCompleted = allProfiles.filter(p => {
    const userProgress = allProgress.filter(sp => sp.user_id === p.id);
    return userProgress.length === SKILL_DATA.length;
  }).length;

  const stats = [
    { label: '総ユーザー数', value: totalUsers, icon: 'users', color: 'indigo' },
    { label: '総クエスト達成', value: totalCompletions, icon: 'check-circle-2', color: 'emerald' },
    { label: '平均達成数', value: `${avgCompletion}/${SKILL_DATA.length}`, icon: 'bar-chart-3', color: 'amber' },
    { label: '全クリア者', value: fullyCompleted, icon: 'trophy', color: 'rose' }
  ];

  document.getElementById('admin-stats').innerHTML = stats.map(s => `
    <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div class="flex items-center gap-2 mb-2">
        <div class="w-8 h-8 bg-${s.color}-100 rounded-lg flex items-center justify-center text-${s.color}-500">
          <i data-lucide="${s.icon}" width="16"></i>
        </div>
        <span class="text-xs font-bold text-slate-400 uppercase">${s.label}</span>
      </div>
      <div class="text-2xl font-black text-slate-800">${s.value}</div>
    </div>
  `).join('');

  document.getElementById('user-count-label').textContent = `${totalUsers} 人`;
}

function renderUserTable() {
  const tbody = document.getElementById('user-table-body');

  tbody.innerHTML = allProfiles.map(profile => {
    const userProgress = allProgress.filter(sp => sp.user_id === profile.id);
    const totalXp = userProgress.reduce((sum, sp) => {
      const skill = SKILL_DATA.find(s => s.id === sp.skill_id);
      return sum + (skill ? skill.xp : 0);
    }, 0);
    const progressPct = Math.round((userProgress.length / SKILL_DATA.length) * 100);
    const isAdmin = profile.role === 'admin';

    return `
      <tr class="hover:bg-slate-50 transition-colors">
        <td class="px-6 py-4">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-gradient-to-tr from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow">
              ${profile.display_name.charAt(0)}
            </div>
            <div>
              <div class="font-bold text-slate-800">${escapeHtml(profile.display_name)}</div>
              <div class="text-xs text-slate-400">${new Date(profile.created_at).toLocaleDateString('ja-JP')}</div>
            </div>
          </div>
        </td>
        <td class="px-6 py-4 text-slate-600">${escapeHtml(profile.department || '-')}</td>
        <td class="px-6 py-4 text-center font-bold">${userProgress.length}/${SKILL_DATA.length}</td>
        <td class="px-6 py-4 text-center font-bold">${totalXp}</td>
        <td class="px-6 py-4">
          <div class="flex items-center gap-2">
            <div class="flex-grow h-2 bg-slate-200 rounded-full overflow-hidden">
              <div class="h-full bg-indigo-500 transition-all" style="width:${progressPct}%"></div>
            </div>
            <span class="text-xs font-bold text-slate-500 w-10 text-right">${progressPct}%</span>
          </div>
        </td>
        <td class="px-6 py-4 text-center">
          <span class="px-2 py-1 rounded-full text-[10px] font-bold ${isAdmin ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}">
            ${isAdmin ? 'Admin' : 'User'}
          </span>
        </td>
        <td class="px-6 py-4 text-center">
          <div class="flex items-center justify-center gap-1">
            <button onclick="viewDetail('${profile.id}')" class="p-1.5 hover:bg-indigo-50 rounded-lg text-indigo-500 transition-all" title="詳細">
              <i data-lucide="eye" width="14"></i>
            </button>
            <button onclick="toggleRole('${profile.id}', '${profile.role}')" class="p-1.5 hover:bg-amber-50 rounded-lg text-amber-500 transition-all" title="ロール切替">
              <i data-lucide="shield" width="14"></i>
            </button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

// ユーザー詳細
function viewDetail(userId) {
  const profile = allProfiles.find(p => p.id === userId);
  if (!profile) return;

  const userProgress = allProgress.filter(sp => sp.user_id === userId);
  const completedIds = userProgress.map(sp => sp.skill_id);

  document.getElementById('detail-user-name').textContent = `${profile.display_name} の進捗詳細`;

  // カテゴリ別進捗
  let html = '<div class="space-y-6">';

  for (const [catName, style] of Object.entries(CATEGORIES)) {
    const catSkills = SKILL_DATA.filter(s => s.category === catName);
    const completed = catSkills.filter(s => completedIds.includes(s.id));
    const pct = Math.round((completed.length / catSkills.length) * 100);

    html += `
      <div>
        <div class="flex items-center justify-between mb-2">
          <span class="font-bold text-sm ${style.color} flex items-center gap-1">
            <i data-lucide="${style.icon}" width="14"></i> ${style.description}
          </span>
          <span class="text-xs font-bold text-slate-500">${completed.length}/${catSkills.length} (${pct}%)</span>
        </div>
        <div class="h-2 bg-slate-200 rounded-full overflow-hidden mb-3">
          <div class="h-full ${style.bgColor}" style="width:${pct}%"></div>
        </div>
        <div class="grid grid-cols-1 gap-2">
          ${catSkills.map(skill => {
            const isCompleted = completedIds.includes(skill.id);
            const progress = userProgress.find(p => p.skill_id === skill.id);
            return `
              <div class="flex items-center gap-3 px-3 py-2 rounded-lg ${isCompleted ? 'bg-green-50 border border-green-100' : 'bg-slate-50 border border-slate-100'}">
                <div class="w-5 h-5 flex items-center justify-center">
                  ${isCompleted
                    ? '<i data-lucide="check-circle-2" width="16" class="text-green-500"></i>'
                    : '<i data-lucide="circle" width="16" class="text-slate-300"></i>'}
                </div>
                <div class="flex-grow">
                  <span class="text-sm ${isCompleted ? 'text-green-700 font-bold' : 'text-slate-500'}">${skill.skillName}</span>
                  ${progress && progress.memo ? `<p class="text-xs text-slate-400 mt-0.5">${escapeHtml(progress.memo)}</p>` : ''}
                </div>
                <span class="text-[10px] font-bold text-slate-400">+${skill.xp}XP</span>
                ${progress ? `<span class="text-[10px] text-slate-400">${new Date(progress.completed_at).toLocaleDateString('ja-JP')}</span>` : ''}
              </div>`;
          }).join('')}
        </div>
      </div>`;
  }
  html += '</div>';

  document.getElementById('detail-content').innerHTML = html;

  const modal = document.getElementById('user-detail-modal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  lucide.createIcons();
}

function closeDetail() {
  const modal = document.getElementById('user-detail-modal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

// ロール切替
async function toggleRole(userId, currentRole) {
  const newRole = currentRole === 'admin' ? 'user' : 'admin';
  const action = newRole === 'admin' ? '管理者にしますか？' : '一般ユーザーに戻しますか？';

  const profile = allProfiles.find(p => p.id === userId);
  if (!confirm(`${profile.display_name} を${action}`)) return;

  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId);

  if (error) {
    alert('更新に失敗しました: ' + error.message);
    return;
  }

  await loadAllData();
  renderAdmin();
}

async function handleLogout() {
  await supabase.auth.signOut();
  window.location.href = '/index.html';
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
