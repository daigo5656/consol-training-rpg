// ============================================
// マネージャーダッシュボード (manager.html)
// ============================================

let mgUser = null;
let mgProfile = null;
let myMembers = [];
let allProgress = [];
let currentManagerTab = 'pending';
let reviewTarget = null; // { progress, profile, skill }

(async () => {
  const result = await requireManager();
  if (!result) return;
  mgUser = result.user;
  mgProfile = result.profile;

  await loadManagerData();
  renderManagerDashboard();
  document.getElementById('loading-screen').style.display = 'none';
  lucide.createIcons();
})();

async function loadManagerData() {
  // 自分が担当するメンバーを取得
  const { data: members } = await supabase
    .from('profiles')
    .select('*')
    .eq('manager_id', mgUser.id);
  myMembers = members || [];

  // メンバーIDリスト
  const memberIds = myMembers.map(m => m.id);

  if (memberIds.length > 0) {
    const { data: progress } = await supabase
      .from('skill_progress')
      .select('*')
      .in('user_id', memberIds)
      .order('completed_at', { ascending: false });
    allProgress = progress || [];
  } else {
    allProgress = [];
  }
}

function renderManagerDashboard() {
  renderManagerStats();
  renderPendingList();
  renderMembersList();
  renderHistoryList();
  lucide.createIcons();
}

function renderManagerStats() {
  const pending = allProgress.filter(p => p.status === 'pending');
  const approved = allProgress.filter(p => p.status === 'approved');
  const rejected = allProgress.filter(p => p.status === 'rejected');

  const stats = [
    { label: '担当メンバー', value: myMembers.length, icon: 'users', color: 'indigo' },
    { label: '承認待ち', value: pending.length, icon: 'clock', color: 'amber' },
    { label: '承認済み', value: approved.length, icon: 'check-circle-2', color: 'emerald' },
    { label: '差し戻し', value: rejected.length, icon: 'x-circle', color: 'rose' }
  ];

  document.getElementById('pending-count-badge').textContent = pending.length;

  document.getElementById('manager-stats').innerHTML = stats.map(s => `
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
}

function renderPendingList() {
  const container = document.getElementById('view-pending');
  const pending = allProgress.filter(p => p.status === 'pending');

  if (pending.length === 0) {
    container.innerHTML = `
      <div class="bg-white rounded-3xl border border-slate-200/50 p-12 text-center">
        <i data-lucide="inbox" width="48" class="mx-auto text-slate-200 mb-4"></i>
        <p class="text-slate-400 font-bold">承認待ちの申請はありません</p>
        <p class="text-xs text-slate-300 mt-1">メンバーがクエストを完了申請すると、ここに表示されます</p>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="space-y-4">
      ${pending.map(p => {
        const member = myMembers.find(m => m.id === p.user_id);
        const skill = SKILL_DATA.find(s => s.id === p.skill_id);
        if (!member || !skill) return '';
        const style = CATEGORIES[skill.category];
        return `
          <div class="bg-white rounded-2xl border-2 border-amber-200/50 p-5 hover:shadow-lg transition-all cursor-pointer" onclick="openReview('${p.user_id}', ${p.skill_id})">
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 bg-gradient-to-tr from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
                ${member.display_name.charAt(0)}
              </div>
              <div class="flex-grow min-w-0">
                <div class="flex items-center gap-2 mb-1 flex-wrap">
                  <span class="font-bold text-slate-800">${escapeHtml(member.display_name)}</span>
                  <span class="status-pending px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                    <i data-lucide="clock" width="10"></i> 承認待ち
                  </span>
                  <span class="px-2 py-0.5 rounded-lg text-[10px] font-bold ${style.bgLight} ${style.color}">${style.description}</span>
                </div>
                <h4 class="font-bold text-indigo-600">${skill.skillName}</h4>
                <p class="text-xs text-slate-400 mt-1">${timeAgo(p.completed_at)} に申請</p>
                ${p.memo ? `<p class="text-sm text-slate-600 mt-2 line-clamp-2">${escapeHtml(p.memo)}</p>` : ''}
                ${p.image_url ? `<div class="mt-2"><img src="${p.image_url}" class="h-16 rounded-lg border border-slate-200 object-cover" alt="evidence"></div>` : ''}
              </div>
              <div class="flex-shrink-0 text-slate-300">
                <i data-lucide="chevron-right" width="20"></i>
              </div>
            </div>
          </div>`;
      }).join('')}
    </div>`;
}

function renderMembersList() {
  const container = document.getElementById('view-members');

  if (myMembers.length === 0) {
    container.innerHTML = `
      <div class="bg-white rounded-3xl border border-slate-200/50 p-12 text-center">
        <i data-lucide="user-x" width="48" class="mx-auto text-slate-200 mb-4"></i>
        <p class="text-slate-400 font-bold">担当メンバーがいません</p>
        <p class="text-xs text-slate-300 mt-1">管理者にメンバーの割り当てを依頼してください</p>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      ${myMembers.map(member => {
        const memberProgress = allProgress.filter(p => p.user_id === member.id);
        const approved = memberProgress.filter(p => p.status === 'approved');
        const pending = memberProgress.filter(p => p.status === 'pending');
        const totalXp = approved.reduce((sum, p) => {
          const skill = SKILL_DATA.find(s => s.id === p.skill_id);
          return sum + (skill ? skill.xp : 0);
        }, 0);
        const pct = Math.round((approved.length / SKILL_DATA.length) * 100);

        return `
          <div class="bg-white rounded-2xl border border-slate-200/50 p-5 hover:shadow-lg transition-all">
            <div class="flex items-center gap-4 mb-4">
              <div class="w-14 h-14 bg-gradient-to-tr from-indigo-400 to-purple-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-md">
                ${member.display_name.charAt(0)}
              </div>
              <div>
                <h3 class="font-bold text-slate-800">${escapeHtml(member.display_name)}</h3>
                <p class="text-xs text-slate-400">${escapeHtml(member.department || '')}</p>
              </div>
              <div class="ml-auto text-right">
                <div class="text-2xl font-black text-slate-700">${totalXp}</div>
                <div class="text-[10px] text-slate-300 font-bold">XP</div>
              </div>
            </div>
            <div class="flex items-center gap-3 mb-3">
              <div class="flex-grow h-2 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style="width:${pct}%"></div>
              </div>
              <span class="text-xs font-bold text-slate-500">${pct}%</span>
            </div>
            <div class="flex gap-3 text-xs">
              <span class="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg font-bold">
                <i data-lucide="check-circle-2" width="12"></i> ${approved.length} 承認
              </span>
              <span class="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-lg font-bold">
                <i data-lucide="clock" width="12"></i> ${pending.length} 待ち
              </span>
              <span class="text-slate-400">${approved.length}/${SKILL_DATA.length} 達成</span>
            </div>

            <!-- カテゴリ別ミニバー -->
            <div class="mt-4 space-y-1.5">
              ${Object.entries(CATEGORIES).map(([catName, style]) => {
                const catSkills = SKILL_DATA.filter(s => s.category === catName);
                const catApproved = approved.filter(p => catSkills.some(s => s.id === p.skill_id));
                const catPct = Math.round((catApproved.length / catSkills.length) * 100);
                return `
                  <div class="flex items-center gap-2">
                    <span class="text-[9px] font-bold ${style.color} w-20 uppercase tracking-wider">${style.description}</span>
                    <div class="flex-grow h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div class="h-full ${style.bgColor} rounded-full" style="width:${catPct}%"></div>
                    </div>
                    <span class="text-[10px] text-slate-400 w-8 text-right">${catPct}%</span>
                  </div>`;
              }).join('')}
            </div>
          </div>`;
      }).join('')}
    </div>`;
}

function renderHistoryList() {
  const container = document.getElementById('view-history');
  const reviewed = allProgress.filter(p => p.status === 'approved' || p.status === 'rejected')
    .sort((a, b) => new Date(b.reviewed_at || b.completed_at) - new Date(a.reviewed_at || a.completed_at));

  if (reviewed.length === 0) {
    container.innerHTML = `
      <div class="bg-white rounded-3xl border border-slate-200/50 p-12 text-center">
        <i data-lucide="clock" width="48" class="mx-auto text-slate-200 mb-4"></i>
        <p class="text-slate-400 font-bold">まだ承認履歴がありません</p>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="bg-white rounded-3xl border border-slate-200/50 overflow-hidden">
      <div class="divide-y divide-slate-100">
        ${reviewed.slice(0, 50).map(p => {
          const member = myMembers.find(m => m.id === p.user_id);
          const skill = SKILL_DATA.find(s => s.id === p.skill_id);
          if (!member || !skill) return '';
          const isApproved = p.status === 'approved';
          return `
            <div class="px-6 py-4 flex items-center gap-4 hover:bg-slate-50/50 transition-all">
              <div class="w-10 h-10 bg-gradient-to-tr from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow">${member.display_name.charAt(0)}</div>
              <div class="flex-grow min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-sm text-slate-800">${escapeHtml(member.display_name)}</span>
                  <span class="text-xs text-slate-400">${skill.skillName}</span>
                </div>
                ${p.feedback ? `<p class="text-xs text-slate-400 mt-0.5 truncate">${escapeHtml(p.feedback)}</p>` : ''}
              </div>
              <div class="${isApproved ? 'status-approved' : 'status-rejected'} px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
                <i data-lucide="${isApproved ? 'check-circle-2' : 'x-circle'}" width="10"></i>
                ${isApproved ? '承認' : '差し戻し'}
              </div>
              <span class="text-xs text-slate-300">${timeAgo(p.reviewed_at || p.completed_at)}</span>
            </div>`;
        }).join('')}
      </div>
    </div>`;
}

// --- タブ切替 ---
function switchManagerTab(tab) {
  currentManagerTab = tab;
  ['pending', 'members', 'history'].forEach(t => {
    document.getElementById(`view-${t}`).classList.toggle('hidden', t !== tab);
    const btn = document.getElementById(`mtab-${t}`);
    if (t === tab) {
      const colors = { pending: 'bg-amber-500', members: 'bg-indigo-600', history: 'bg-slate-700' };
      btn.className = `px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${colors[t]} text-white shadow-md flex items-center gap-1.5`;
    } else {
      btn.className = 'px-5 py-2.5 rounded-xl text-sm font-bold transition-all bg-white text-slate-400 border border-slate-200/50 flex items-center gap-1.5';
    }
  });
  lucide.createIcons();
}

// --- レビューモーダル ---
function openReview(userId, skillId) {
  const progress = allProgress.find(p => p.user_id === userId && p.skill_id === skillId);
  const member = myMembers.find(m => m.id === userId);
  const skill = SKILL_DATA.find(s => s.id === skillId);
  if (!progress || !member || !skill) return;

  reviewTarget = { progress, member, skill };
  const style = CATEGORIES[skill.category];

  document.getElementById('review-feedback').value = '';
  document.getElementById('review-content').innerHTML = `
    <div class="flex items-center gap-3 mb-4">
      <div class="w-12 h-12 bg-gradient-to-tr from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
        ${member.display_name.charAt(0)}
      </div>
      <div>
        <div class="font-bold text-slate-800">${escapeHtml(member.display_name)}</div>
        <div class="text-xs text-slate-400">${timeAgo(progress.completed_at)} に申請</div>
      </div>
    </div>

    <div class="bg-gradient-to-br ${style.bgLight} rounded-2xl p-4 border ${style.border}">
      <div class="flex items-center gap-1.5 text-[10px] font-bold ${style.color} uppercase tracking-wider mb-1">
        <i data-lucide="${style.icon}" width="10"></i> ${style.description}
      </div>
      <h4 class="font-bold text-lg text-slate-800">${skill.skillName}</h4>
      <p class="text-xs text-slate-500 mt-1">+${skill.xp} XP</p>
    </div>

    <div class="bg-slate-50 rounded-xl p-4 border border-slate-100">
      <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">クリア条件</div>
      <p class="text-sm text-slate-700 whitespace-pre-line">${skill.practiceTask}</p>
    </div>

    ${progress.memo ? `
    <div class="bg-blue-50/50 rounded-xl p-4 border border-blue-100/50">
      <div class="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1.5 flex items-center gap-1"><i data-lucide="message-square" width="10"></i> メンバーの振り返り</div>
      <p class="text-sm text-slate-700">${escapeHtml(progress.memo)}</p>
    </div>` : ''}

    ${progress.image_url ? `
    <div>
      <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><i data-lucide="image" width="10"></i> エビデンス</div>
      <img src="${progress.image_url}" class="w-full rounded-xl border border-slate-200 shadow-sm cursor-pointer" alt="evidence" onclick="window.open('${progress.image_url}', '_blank')">
    </div>` : '<p class="text-xs text-slate-300 italic">エビデンス画像なし</p>'}
  `;

  const modal = document.getElementById('review-modal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  lucide.createIcons();
}

function closeReview() {
  reviewTarget = null;
  const modal = document.getElementById('review-modal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

async function approveQuest() {
  if (!reviewTarget) return;
  const feedback = document.getElementById('review-feedback').value.trim();

  const { error } = await supabase
    .from('skill_progress')
    .update({
      status: 'approved',
      approved_by: mgUser.id,
      feedback,
      reviewed_at: new Date().toISOString()
    })
    .eq('user_id', reviewTarget.progress.user_id)
    .eq('skill_id', reviewTarget.progress.skill_id);

  if (error) { alert('承認に失敗しました: ' + error.message); return; }

  closeReview();
  await loadManagerData();
  renderManagerDashboard();
}

async function rejectQuest() {
  if (!reviewTarget) return;
  const feedback = document.getElementById('review-feedback').value.trim();
  if (!feedback) {
    alert('差し戻しの理由をフィードバック欄に入力してください');
    return;
  }

  const { error } = await supabase
    .from('skill_progress')
    .update({
      status: 'rejected',
      approved_by: mgUser.id,
      feedback,
      reviewed_at: new Date().toISOString()
    })
    .eq('user_id', reviewTarget.progress.user_id)
    .eq('skill_id', reviewTarget.progress.skill_id);

  if (error) { alert('差し戻しに失敗しました: ' + error.message); return; }

  closeReview();
  await loadManagerData();
  renderManagerDashboard();
}

async function handleLogout() {
  await supabase.auth.signOut();
  window.location.href = '/index.html';
}
