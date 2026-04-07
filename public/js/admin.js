// ============================================
// 管理画面 (admin.html) v2 - マネージャー割り当て対応
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
  const managers = allProfiles.filter(p => p.role === 'manager').length;
  const totalApproved = allProgress.filter(p => p.status === 'approved').length;
  const totalPending = allProgress.filter(p => p.status === 'pending').length;

  const stats = [
    { label: '総ユーザー', value: totalUsers, icon: 'users', color: 'indigo' },
    { label: 'マネージャー', value: managers, icon: 'user-check', color: 'emerald' },
    { label: '承認済み', value: totalApproved, icon: 'check-circle-2', color: 'teal' },
    { label: '承認待ち', value: totalPending, icon: 'clock', color: 'amber' }
  ];

  document.getElementById('admin-stats').innerHTML = stats.map(s => `
    <div class="bg-white rounded-2xl border border-slate-200/50 p-5 shadow-sm">
      <div class="flex items-center gap-2 mb-3">
        <div class="w-10 h-10 bg-${s.color}-100 rounded-xl flex items-center justify-center text-${s.color}-500">
          <i data-lucide="${s.icon}" width="18"></i>
        </div>
        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">${s.label}</span>
      </div>
      <div class="text-3xl font-black text-slate-800">${s.value}</div>
    </div>
  `).join('');

  document.getElementById('user-count-label').textContent = `${totalUsers} 人`;
}

function renderUserTable() {
  const tbody = document.getElementById('user-table-body');
  const managers = allProfiles.filter(p => p.role === 'manager' || p.role === 'admin');

  tbody.innerHTML = allProfiles.map(profile => {
    const userProgress = allProgress.filter(sp => sp.user_id === profile.id);
    const approved = userProgress.filter(sp => sp.status === 'approved');
    const totalXp = approved.reduce((sum, sp) => {
      const skill = SKILL_DATA.find(s => s.id === sp.skill_id);
      return sum + (skill ? skill.xp : 0);
    }, 0);
    const pct = Math.round((approved.length / SKILL_DATA.length) * 100);

    const roleBadge = {
      admin: 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border-amber-200',
      manager: 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border-emerald-200',
      user: 'bg-slate-100 text-slate-500 border-slate-200'
    }[profile.role] || 'bg-slate-100 text-slate-500 border-slate-200';

    const currentManager = allProfiles.find(p => p.id === profile.manager_id);

    // マネージャー選択ドロップダウン
    const managerOptions = managers
      .filter(m => m.id !== profile.id)
      .map(m => `<option value="${m.id}" ${profile.manager_id === m.id ? 'selected' : ''}>${escapeHtml(m.display_name)}</option>`)
      .join('');

    return `
      <tr class="hover:bg-slate-50/50 transition-all">
        <td class="px-6 py-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-tr from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow">
              ${profile.display_name.charAt(0)}
            </div>
            <div>
              <div class="font-bold text-slate-800">${escapeHtml(profile.display_name)}</div>
              <div class="text-[10px] text-slate-400">${new Date(profile.created_at).toLocaleDateString('ja-JP')} &middot; ${totalXp}XP</div>
            </div>
          </div>
        </td>
        <td class="px-6 py-4 text-center">
          <span class="font-bold text-slate-700">${approved.length}</span>
          <span class="text-slate-300">/${SKILL_DATA.length}</span>
        </td>
        <td class="px-6 py-4">
          <div class="flex items-center gap-2">
            <div class="flex-grow h-2 bg-slate-100 rounded-full overflow-hidden">
              <div class="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style="width:${pct}%"></div>
            </div>
            <span class="text-[10px] font-bold text-slate-400 w-8 text-right">${pct}%</span>
          </div>
        </td>
        <td class="px-6 py-4 text-center">
          <select onchange="changeRole('${profile.id}', this.value)" class="px-2 py-1 rounded-lg text-[10px] font-bold border ${roleBadge} appearance-auto cursor-pointer">
            <option value="user" ${profile.role === 'user' ? 'selected' : ''}>User</option>
            <option value="manager" ${profile.role === 'manager' ? 'selected' : ''}>Manager</option>
            <option value="admin" ${profile.role === 'admin' ? 'selected' : ''}>Admin</option>
          </select>
        </td>
        <td class="px-6 py-4 text-center">
          <select onchange="assignManager('${profile.id}', this.value)" class="px-2 py-1 rounded-lg text-[10px] font-bold border border-slate-200 bg-white text-slate-600 appearance-auto cursor-pointer max-w-[120px]">
            <option value="">未設定</option>
            ${managerOptions}
          </select>
        </td>
        <td class="px-6 py-4 text-center">
          <button onclick="viewDetail('${profile.id}')" class="p-2 hover:bg-indigo-50 rounded-xl text-indigo-500 transition-all" title="詳細">
            <i data-lucide="eye" width="16"></i>
          </button>
        </td>
      </tr>`;
  }).join('');
}

// --- ロール変更 ---
async function changeRole(userId, newRole) {
  const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
  if (error) { alert('更新失敗: ' + error.message); return; }
  await loadAllData();
  renderAdmin();
}

// --- マネージャー割り当て ---
async function assignManager(userId, managerId) {
  const { error } = await supabase
    .from('profiles')
    .update({ manager_id: managerId || null })
    .eq('id', userId);
  if (error) { alert('更新失敗: ' + error.message); return; }
  await loadAllData();
  renderAdmin();
}

// --- ユーザー詳細 ---
function viewDetail(userId) {
  const profile = allProfiles.find(p => p.id === userId);
  if (!profile) return;
  const userProgress = allProgress.filter(sp => sp.user_id === userId);
  const approvedIds = userProgress.filter(sp => sp.status === 'approved').map(sp => sp.skill_id);

  document.getElementById('detail-user-name').textContent = `${profile.display_name} の進捗詳細`;

  let html = '<div class="space-y-6">';
  for (const [catName, style] of Object.entries(CATEGORIES)) {
    const catSkills = SKILL_DATA.filter(s => s.category === catName);
    const completed = catSkills.filter(s => approvedIds.includes(s.id));
    const pct = Math.round((completed.length / catSkills.length) * 100);

    html += `
      <div>
        <div class="flex items-center justify-between mb-2">
          <span class="font-bold text-sm ${style.color} flex items-center gap-1"><i data-lucide="${style.icon}" width="14"></i> ${style.description}</span>
          <span class="text-xs font-bold text-slate-400">${completed.length}/${catSkills.length} (${pct}%)</span>
        </div>
        <div class="h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
          <div class="h-full ${style.bgColor} rounded-full" style="width:${pct}%"></div>
        </div>
        <div class="space-y-2">
          ${catSkills.map(skill => {
            const prog = userProgress.find(p => p.skill_id === skill.id);
            const status = prog ? prog.status : 'none';
            const statusIcon = { approved: 'check-circle-2', pending: 'clock', rejected: 'x-circle', none: 'circle' }[status];
            const statusColor = { approved: 'text-emerald-500', pending: 'text-amber-500', rejected: 'text-red-500', none: 'text-slate-200' }[status];
            const bgColor = { approved: 'bg-emerald-50 border-emerald-100', pending: 'bg-amber-50 border-amber-100', rejected: 'bg-red-50 border-red-100', none: 'bg-slate-50 border-slate-100' }[status];

            return `
              <div class="flex items-center gap-3 px-3 py-2 rounded-xl ${bgColor} border">
                <i data-lucide="${statusIcon}" width="16" class="${statusColor}"></i>
                <div class="flex-grow">
                  <span class="text-sm font-medium text-slate-700">${skill.skillName}</span>
                  ${prog && prog.memo ? `<p class="text-xs text-slate-400 mt-0.5">${escapeHtml(prog.memo)}</p>` : ''}
                  ${prog && prog.feedback ? `<p class="text-xs text-amber-600 mt-0.5">FB: ${escapeHtml(prog.feedback)}</p>` : ''}
                </div>
                <span class="text-[10px] font-bold text-slate-300">+${skill.xp}XP</span>
                ${prog ? `<span class="text-[10px] text-slate-300">${new Date(prog.completed_at).toLocaleDateString('ja-JP')}</span>` : ''}
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

async function handleLogout() {
  await supabase.auth.signOut();
  window.location.href = '/index.html';
}
