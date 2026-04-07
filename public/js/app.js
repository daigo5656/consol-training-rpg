// ============================================
// メインアプリ (app.html) v2 - 承認フロー対応
// ============================================

let currentUser = null;
let currentProfile = null;
let completedSkills = []; // { skill_id, memo, image_url, status, completed_at, feedback }
let selectedCategory = 'ALL';
let currentPage = 'quests';
let pendingSkillId = null;
let selectedFile = null;

// --- 初期化 ---
(async () => {
  currentUser = await requireAuth();
  if (!currentUser) return;

  currentProfile = await getProfile(currentUser.id);

  // ロール別リンク表示
  if (currentProfile) {
    if (currentProfile.role === 'admin') {
      const adminLink = document.getElementById('admin-link');
      adminLink.classList.remove('hidden');
      adminLink.classList.add('flex');
    }
    if (currentProfile.role === 'manager' || currentProfile.role === 'admin') {
      const managerLink = document.getElementById('manager-link');
      managerLink.classList.remove('hidden');
      managerLink.classList.add('flex');
    }
  }

  updateUserInfo();
  await loadProgress();
  renderAll();

  document.getElementById('loading-screen').style.display = 'none';

  // 画像ドロップゾーン
  setupDropZone();

  lucide.createIcons();
})();

// --- データ ---
async function loadProgress() {
  const { data, error } = await supabase
    .from('skill_progress')
    .select('skill_id, memo, image_url, status, completed_at, feedback')
    .eq('user_id', currentUser.id);
  if (error) { console.error('Progress load error:', error); return; }
  completedSkills = data || [];
}

function getCompletedIds() {
  return completedSkills.filter(s => s.status === 'approved').map(s => s.skill_id);
}
function getPendingIds() {
  return completedSkills.filter(s => s.status === 'pending').map(s => s.skill_id);
}
function getRejectedIds() {
  return completedSkills.filter(s => s.status === 'rejected').map(s => s.skill_id);
}
function getAllSubmittedIds() {
  return completedSkills.map(s => s.skill_id);
}

// --- ユーザー情報 ---
function updateUserInfo() {
  if (!currentProfile) return;
  const name = currentProfile.display_name || 'ユーザー';
  document.getElementById('user-name').textContent = name;
  document.getElementById('user-initial').textContent = name.charAt(0).toUpperCase();
  document.getElementById('user-dept').textContent = currentProfile.department || 'コンテンツソリューション部';
}

function getRankLabel(totalLevel) {
  if (totalLevel >= 20) return 'L5 エキスパート';
  if (totalLevel >= 15) return 'L4 シニア';
  if (totalLevel >= 10) return 'L3 中堅';
  if (totalLevel >= 5) return 'L2 成長中';
  return 'L1 基礎学習中';
}

// --- レンダリング ---
function renderAll() {
  const approvedIds = getCompletedIds();
  const stats = calculateStats(approvedIds);
  const totalLevel = Object.values(stats).reduce((sum, s) => sum + s.level, 0);

  document.getElementById('total-level').textContent = totalLevel;
  document.getElementById('completed-count').textContent = approvedIds.length;
  document.getElementById('total-count').textContent = SKILL_DATA.length;
  document.getElementById('user-rank').textContent = getRankLabel(totalLevel);

  renderPCStatus(stats);
  renderMobileStatus(stats);
  renderFilters();
  renderQuests();
  renderRadarChart(stats);
  renderBadges(approvedIds);

  lucide.createIcons();
}

function calculateStats(ids) {
  const stats = {};
  for (const catName in CATEGORIES) {
    const catSkills = SKILL_DATA.filter(s => s.category === catName);
    const totalXp = catSkills.reduce((sum, s) => sum + s.xp, 0);
    const earnedXp = catSkills.filter(s => ids.includes(s.id)).reduce((sum, s) => sum + s.xp, 0);
    stats[catName] = {
      current: earnedXp, max: totalXp,
      level: Math.floor(earnedXp / 150) + 1,
      progress: Math.floor((earnedXp / totalXp) * 100) || 0
    };
  }
  return stats;
}

function renderPCStatus(stats) {
  document.getElementById('pc-status-bar').innerHTML = Object.entries(CATEGORIES).map(([catName, style]) => `
    <div class="flex flex-col items-center w-24">
      <div class="text-[10px] font-bold ${style.color} mb-1 flex items-center gap-1 uppercase tracking-wider">
        <i data-lucide="${style.icon}" width="11"></i> ${style.description}
      </div>
      <div class="text-2xl font-black text-slate-700 leading-none mb-1.5">${stats[catName].current}</div>
      <div class="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
        <div class="h-full ${style.bgColor} transition-all duration-1000 ease-out rounded-full" style="width: ${stats[catName].progress}%"></div>
      </div>
    </div>
  `).join('');
}

function renderMobileStatus(stats) {
  document.getElementById('mobile-status-grid').innerHTML = Object.entries(CATEGORIES).map(([catName, style]) => `
    <div class="bg-white/80 backdrop-blur p-3 rounded-xl border border-slate-200/50 shadow-sm">
      <div class="text-[10px] font-bold ${style.color} mb-1 flex items-center gap-1 uppercase tracking-wider">
        <i data-lucide="${style.icon}" width="11"></i> ${style.description}
      </div>
      <div class="flex justify-between items-end mb-2">
        <span class="text-xl font-black text-slate-800">${stats[catName].current}</span>
        <span class="text-[10px] text-slate-400">/ ${stats[catName].max} XP</span>
      </div>
      <div class="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
        <div class="h-full ${style.bgColor} transition-all duration-1000 ease-out rounded-full" style="width: ${stats[catName].progress}%"></div>
      </div>
    </div>
  `).join('');
}

function renderFilters() {
  const container = document.getElementById('filter-tabs');
  let html = `
    <button onclick="setCategory('ALL')" class="flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${selectedCategory === 'ALL' ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-200/50'}">
      <i data-lucide="layout-grid" width="14"></i> 全て (${SKILL_DATA.length})
    </button>`;
  html += Object.entries(CATEGORIES).map(([catName, style]) => `
    <button onclick="setCategory('${catName}')" class="flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${selectedCategory === catName ? `${style.bgColor} text-white shadow-md` : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-200/50'}">
      <i data-lucide="${style.icon}" width="14"></i> ${catName.split("・")[0]}
    </button>
  `).join('');
  container.innerHTML = html;
}

function renderQuests() {
  const container = document.getElementById('quest-grid');
  const filtered = selectedCategory === 'ALL' ? SKILL_DATA : SKILL_DATA.filter(s => s.category === selectedCategory);

  container.innerHTML = filtered.map(skill => {
    const style = CATEGORIES[skill.category];
    const progress = completedSkills.find(p => p.skill_id === skill.id);
    const status = progress ? progress.status : 'none';

    // ステータスバッジ
    let statusBadge = '';
    let overlayHtml = '';
    let buttonHtml = '';

    if (status === 'approved') {
      statusBadge = `<div class="status-approved px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1"><i data-lucide="check-circle-2" width="10"></i>承認済</div>`;
      overlayHtml = `
        <div class="absolute inset-0 z-10 bg-white/40 flex items-center justify-center backdrop-blur-[2px]">
          <div class="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-5 py-2.5 rounded-2xl font-black shadow-xl transform -rotate-6 border-4 border-white flex items-center gap-2 text-sm">
            <i data-lucide="check-circle-2" width="18"></i> APPROVED
          </div>
        </div>`;
      buttonHtml = `<button disabled class="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 bg-slate-100 text-slate-400 cursor-default text-sm"><i data-lucide="check-circle-2" width="16"></i> 承認済み</button>`;
    } else if (status === 'pending') {
      statusBadge = `<div class="status-pending px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1"><i data-lucide="clock" width="10"></i>承認待ち</div>`;
      overlayHtml = `
        <div class="absolute inset-0 z-10 bg-white/30 flex items-center justify-center backdrop-blur-[1px]">
          <div class="bg-gradient-to-r from-amber-400 to-orange-400 text-white px-5 py-2.5 rounded-2xl font-black shadow-xl transform -rotate-3 border-4 border-white flex items-center gap-2 text-sm">
            <i data-lucide="clock" width="18"></i> PENDING
          </div>
        </div>`;
      buttonHtml = `<button disabled class="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 bg-amber-50 text-amber-500 cursor-default text-sm border border-amber-200"><i data-lucide="clock" width="16"></i> マネージャー承認待ち</button>`;
    } else if (status === 'rejected') {
      statusBadge = `<div class="status-rejected px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1"><i data-lucide="x-circle" width="10"></i>差し戻し</div>`;
      buttonHtml = `<button onclick="openMemo(${skill.id})" class="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg hover:shadow-xl hover:brightness-110 text-sm"><i data-lucide="refresh-cw" width="16"></i> 再申請する</button>`;
    } else {
      buttonHtml = `<button onclick="openMemo(${skill.id})" class="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] bg-gradient-to-r ${style.gradient || 'from-indigo-500 to-purple-500'} text-white shadow-lg hover:shadow-xl hover:brightness-110 text-sm"><i data-lucide="send" width="16"></i> 完了申請</button>`;
    }

    // 優先度
    let priorityBadge = '';
    if (skill.priority === "高") {
      priorityBadge = `<div class="flex items-center text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-lg text-[10px] font-bold border border-amber-100"><i data-lucide="flame" width="10" class="mr-0.5"></i>高</div>`;
    } else if (skill.priority === "中") {
      priorityBadge = `<div class="flex items-center text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded-lg text-[10px] font-bold border border-slate-200">中</div>`;
    } else {
      priorityBadge = `<div class="flex items-center text-slate-300 bg-slate-50 px-1.5 py-0.5 rounded-lg text-[10px] font-bold border border-slate-100">小</div>`;
    }

    // メモ・フィードバック表示
    let extraHtml = '';
    if (progress && progress.memo) {
      extraHtml += `<div class="mx-5 mb-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
        <div class="text-[10px] font-bold text-blue-500 mb-1 flex items-center gap-1"><i data-lucide="message-square" width="10"></i> 振り返りメモ</div>
        <p class="text-xs text-slate-600">${escapeHtml(progress.memo)}</p>
      </div>`;
    }
    if (progress && progress.image_url) {
      extraHtml += `<div class="mx-5 mb-3"><img src="${progress.image_url}" class="w-full h-32 object-cover rounded-xl border border-slate-200" alt="evidence"></div>`;
    }
    if (progress && progress.feedback) {
      extraHtml += `<div class="mx-5 mb-3 p-3 bg-amber-50/50 rounded-xl border border-amber-100/50">
        <div class="text-[10px] font-bold text-amber-600 mb-1 flex items-center gap-1"><i data-lucide="message-circle" width="10"></i> マネージャーからのフィードバック</div>
        <p class="text-xs text-slate-600">${escapeHtml(progress.feedback)}</p>
      </div>`;
    }

    const isInactive = status === 'approved' || status === 'pending';

    return `
      <div class="group relative bg-white rounded-3xl border-2 transition-all duration-300 flex flex-col overflow-hidden card-hover ${isInactive ? 'border-slate-200/50 opacity-70' : 'border-slate-100 hover:border-indigo-200'}">
        ${overlayHtml}
        <div class="px-5 py-4 border-b border-slate-100/50 flex justify-between items-start bg-gradient-to-br ${isInactive ? 'from-slate-50 to-slate-100/50' : 'from-white to-slate-50/30'}">
          <div>
            <div class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider mb-2 ${style.bgLight} ${style.color}">
              <i data-lucide="${style.icon}" width="9"></i> ${style.description}
            </div>
            <h3 class="font-bold text-lg text-slate-800 leading-tight">${skill.skillName}</h3>
          </div>
          <div class="flex flex-col items-end gap-1.5">
            ${statusBadge}
            ${priorityBadge}
            <span class="text-[10px] font-black text-slate-300">+${skill.xp}XP</span>
          </div>
        </div>
        <div class="p-5 flex-grow space-y-3">
          <div class="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <div class="w-1.5 h-1.5 rounded-full ${style.bgColor}"></div>
            ${skill.subCategory}
          </div>
          <div class="space-y-2.5">
            <div class="bg-slate-50/80 p-3 rounded-xl border border-slate-100/50">
              <div class="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                <i data-lucide="target" width="10"></i> クリア条件
              </div>
              <p class="text-sm text-slate-700 leading-relaxed whitespace-pre-line">${skill.practiceTask}</p>
            </div>
            <details class="group/details">
              <summary class="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 cursor-pointer hover:text-indigo-600 transition-colors uppercase tracking-wider">
                <i data-lucide="lightbulb" width="10"></i> ヒント (INPUT)
                <i data-lucide="chevron-down" width="10" class="transition-transform group-open/details:rotate-180"></i>
              </summary>
              <div class="mt-2 bg-indigo-50/30 p-3 rounded-xl border border-indigo-50">
                <p class="text-xs text-slate-500 leading-relaxed whitespace-pre-line">${skill.inputTask}</p>
              </div>
            </details>
          </div>
        </div>
        ${extraHtml}
        <div class="p-4 border-t border-slate-100/50 bg-slate-50/30">
          ${buttonHtml}
        </div>
      </div>`;
  }).join('');
}

// --- レーダーチャート ---
function renderRadarChart(stats) {
  const svg = document.getElementById('radar-chart');
  if (!svg) return;
  const cx = 150, cy = 150, maxR = 120;
  const categories = Object.keys(CATEGORIES);
  const n = categories.length;
  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2;
  let html = '';
  for (let level = 1; level <= 4; level++) {
    const r = (maxR / 4) * level;
    const points = [];
    for (let i = 0; i < n; i++) {
      const angle = startAngle + i * angleStep;
      points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
    }
    html += `<polygon points="${points.join(' ')}" fill="none" stroke="#e2e8f0" stroke-width="1"/>`;
  }
  for (let i = 0; i < n; i++) {
    const angle = startAngle + i * angleStep;
    html += `<line x1="${cx}" y1="${cy}" x2="${cx + maxR * Math.cos(angle)}" y2="${cy + maxR * Math.sin(angle)}" stroke="#e2e8f0" stroke-width="1"/>`;
  }
  const dp = [];
  categories.forEach((cat, i) => {
    const pct = stats[cat].progress / 100;
    const r = maxR * pct;
    const angle = startAngle + i * angleStep;
    dp.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  });
  html += `<polygon points="${dp.join(' ')}" fill="url(#radarGrad)" stroke="#6366f1" stroke-width="2.5"/>`;
  html += `<defs><linearGradient id="radarGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="rgba(99,102,241,0.25)"/><stop offset="100%" stop-color="rgba(168,85,247,0.15)"/></linearGradient></defs>`;
  categories.forEach((cat, i) => {
    const pct = stats[cat].progress / 100;
    const r = maxR * pct;
    const angle = startAngle + i * angleStep;
    html += `<circle cx="${cx + r * Math.cos(angle)}" cy="${cy + r * Math.sin(angle)}" r="5" fill="#6366f1" stroke="white" stroke-width="2"/>`;
    const lx = cx + (maxR + 22) * Math.cos(angle);
    const ly = cy + (maxR + 22) * Math.sin(angle);
    const anchor = Math.abs(Math.cos(angle)) < 0.1 ? 'middle' : (Math.cos(angle) > 0 ? 'start' : 'end');
    html += `<text x="${lx}" y="${ly}" text-anchor="${anchor}" dominant-baseline="middle" class="text-[10px] font-bold fill-slate-500">${CATEGORIES[cat].description}</text>`;
    html += `<text x="${lx}" y="${ly + 14}" text-anchor="${anchor}" dominant-baseline="middle" class="text-[10px] fill-slate-400">${stats[cat].progress}%</text>`;
  });
  svg.innerHTML = html;
}

// --- バッジ ---
function renderBadges(ids) {
  const container = document.getElementById('badge-grid');
  if (!container) return;
  container.innerHTML = BADGES.map(badge => {
    const earned = isBadgeEarned(badge, ids);
    return `
      <div class="p-5 rounded-2xl border-2 transition-all ${earned ? 'border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 shadow-md' : 'border-slate-100 bg-slate-50/50 opacity-40 grayscale'}">
        <div class="text-4xl mb-3">${badge.icon}</div>
        <h3 class="font-bold text-sm text-slate-800">${badge.name}</h3>
        <p class="text-xs text-slate-500 mt-1">${badge.description}</p>
        ${earned ? '<span class="inline-block mt-3 text-[10px] font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">獲得済み</span>' : '<span class="inline-block mt-3 text-[10px] font-bold text-slate-300 bg-slate-100 px-2.5 py-1 rounded-full">未獲得</span>'}
      </div>`;
  }).join('');
}

function isBadgeEarned(badge, ids) {
  if (badge.category === null) return ids.length === SKILL_DATA.length;
  const catSkills = SKILL_DATA.filter(s => s.category === badge.category);
  const completed = catSkills.filter(s => ids.includes(s.id)).length;
  return (completed / catSkills.length) >= badge.threshold;
}

// --- リーダーボード ---
async function loadLeaderboard() {
  const { data: profiles } = await supabase.from('profiles').select('id, display_name, department');
  const { data: allProgress } = await supabase.from('skill_progress').select('user_id, skill_id, status');
  if (!profiles || !allProgress) return;
  const leaderboard = profiles.map(p => {
    const approved = allProgress.filter(sp => sp.user_id === p.id && sp.status === 'approved');
    const totalXp = approved.reduce((sum, sp) => {
      const skill = SKILL_DATA.find(s => s.id === sp.skill_id);
      return sum + (skill ? skill.xp : 0);
    }, 0);
    return { ...p, totalXp, completedCount: approved.length };
  }).sort((a, b) => b.totalXp - a.totalXp);

  const container = document.getElementById('leaderboard-list');
  if (leaderboard.length === 0) {
    container.innerHTML = '<div class="p-12 text-center text-slate-300"><i data-lucide="ghost" width="40" class="mx-auto mb-3"></i><p>まだ参加者がいません</p></div>';
    lucide.createIcons();
    return;
  }
  container.innerHTML = leaderboard.map((user, i) => {
    const rankIcon = i === 0 ? '<span class="text-2xl">🥇</span>' : i === 1 ? '<span class="text-2xl">🥈</span>' : i === 2 ? '<span class="text-2xl">🥉</span>' : `<span class="text-slate-400 font-black text-lg">${i + 1}</span>`;
    const isMe = user.id === currentUser.id;
    return `
      <div class="flex items-center gap-4 px-6 py-5 ${isMe ? 'bg-gradient-to-r from-indigo-50/50 to-purple-50/50' : 'hover:bg-slate-50/50'} transition-all">
        <div class="w-10 text-center">${rankIcon}</div>
        <div class="w-11 h-11 bg-gradient-to-tr from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold shadow-md">${user.display_name.charAt(0)}</div>
        <div class="flex-grow">
          <div class="font-bold text-sm ${isMe ? 'text-indigo-700' : 'text-slate-800'}">${escapeHtml(user.display_name)} ${isMe ? '<span class="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full font-bold ml-1">YOU</span>' : ''}</div>
          <div class="text-xs text-slate-400 mt-0.5">${user.completedCount}/${SKILL_DATA.length} クエスト承認済み</div>
        </div>
        <div class="text-right">
          <div class="font-black text-xl text-slate-700">${user.totalXp}</div>
          <div class="text-[10px] text-slate-300 font-bold">XP</div>
        </div>
      </div>`;
  }).join('');
  lucide.createIcons();
}

// --- ページ切替 ---
function switchPage(page) {
  currentPage = page;
  ['quests', 'leaderboard', 'badges'].forEach(p => {
    document.getElementById(`view-${p}`).classList.toggle('hidden', p !== page);
    const btn = document.getElementById(`page-${p}`);
    btn.className = p === page
      ? 'px-5 py-2.5 rounded-xl text-sm font-bold transition-all bg-slate-800 text-white shadow-md'
      : 'px-5 py-2.5 rounded-xl text-sm font-bold transition-all bg-white text-slate-400 hover:bg-slate-50 border border-slate-200/50';
  });
  if (page === 'leaderboard') loadLeaderboard();
  lucide.createIcons();
}

function setCategory(cat) {
  selectedCategory = cat;
  renderFilters();
  renderQuests();
  lucide.createIcons();
}

// --- 申請フロー ---
function setupDropZone() {
  const zone = document.getElementById('image-drop-zone');
  if (!zone) return;
  zone.addEventListener('click', () => document.getElementById('evidence-file').click());
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('border-indigo-400', 'bg-indigo-50/50'); });
  zone.addEventListener('dragleave', () => { zone.classList.remove('border-indigo-400', 'bg-indigo-50/50'); });
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('border-indigo-400', 'bg-indigo-50/50');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) { selectedFile = file; showImagePreview(file); }
  });
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) { selectedFile = file; showImagePreview(file); }
}

function showImagePreview(file) {
  const area = document.getElementById('image-preview-area');
  const reader = new FileReader();
  reader.onload = e => {
    area.innerHTML = `
      <div class="relative inline-block">
        <img src="${e.target.result}" class="max-h-32 rounded-xl border border-slate-200 shadow-sm mx-auto">
        <button onclick="removeImage(event)" class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 shadow-md">✕</button>
      </div>
      <p class="text-xs text-slate-400 mt-2">${file.name}</p>`;
  };
  reader.readAsDataURL(file);
}

function removeImage(e) {
  e.stopPropagation();
  selectedFile = null;
  document.getElementById('evidence-file').value = '';
  document.getElementById('image-preview-area').innerHTML = `
    <i data-lucide="image-plus" width="32" class="mx-auto text-slate-300 mb-2"></i>
    <p class="text-sm text-slate-400">クリックまたはドラッグ&ドロップ</p>
    <p class="text-xs text-slate-300 mt-1">JPG, PNG, GIF (最大5MB)</p>`;
  lucide.createIcons();
}

function openMemo(skillId) {
  pendingSkillId = skillId;
  const skill = SKILL_DATA.find(s => s.id === skillId);

  // 差し戻しの場合は既存の進捗を削除してから再申請
  const existing = completedSkills.find(p => p.skill_id === skillId);

  document.getElementById('memo-skill-name').textContent = `「${skill.skillName}」の完了を申請します`;
  document.getElementById('memo-text').value = existing ? existing.memo || '' : '';
  selectedFile = null;
  document.getElementById('evidence-file').value = '';
  document.getElementById('image-preview-area').innerHTML = `
    <i data-lucide="image-plus" width="32" class="mx-auto text-slate-300 mb-2"></i>
    <p class="text-sm text-slate-400">クリックまたはドラッグ&ドロップ</p>
    <p class="text-xs text-slate-300 mt-1">JPG, PNG, GIF (最大5MB)</p>`;

  const modal = document.getElementById('memo-modal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  lucide.createIcons();
}

function cancelMemo() {
  pendingSkillId = null;
  selectedFile = null;
  const modal = document.getElementById('memo-modal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

async function confirmComplete() {
  if (!pendingSkillId) return;
  const btn = document.getElementById('submit-quest-btn');
  btn.disabled = true;
  btn.innerHTML = '<div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> 送信中...';

  const skillId = pendingSkillId;
  const memo = document.getElementById('memo-text').value.trim();
  let imageUrl = '';

  // 画像アップロード
  if (selectedFile) {
    imageUrl = await uploadEvidence(selectedFile, currentUser.id, skillId);
    if (!imageUrl) {
      showNotificationCustom('画像のアップロードに失敗しました', 'error');
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="send" width="16"></i> 申請する';
      lucide.createIcons();
      return;
    }
  }

  cancelMemo();

  // 差し戻しの場合は既存レコードを削除
  const existing = completedSkills.find(p => p.skill_id === skillId);
  if (existing) {
    await supabase.from('skill_progress').delete().eq('user_id', currentUser.id).eq('skill_id', skillId);
  }

  // DB保存
  const { error } = await supabase.from('skill_progress').insert({
    user_id: currentUser.id,
    skill_id: skillId,
    memo,
    image_url: imageUrl,
    status: 'pending'
  });

  btn.disabled = false;
  btn.innerHTML = '<i data-lucide="send" width="16"></i> 申請する';

  if (error) {
    console.error('Save error:', error);
    showNotificationCustom('申請に失敗しました', 'error');
    lucide.createIcons();
    return;
  }

  completedSkills = completedSkills.filter(p => p.skill_id !== skillId);
  completedSkills.push({ skill_id: skillId, memo, image_url: imageUrl, status: 'pending', completed_at: new Date().toISOString(), feedback: '' });

  const skill = SKILL_DATA.find(s => s.id === skillId);
  showNotificationCustom(`「${skill.skillName}」の完了申請を送信しました！マネージャーの承認をお待ちください。`, 'success');
  triggerConfetti();
  renderAll();
}

// --- 通知 ---
function showNotificationCustom(message, type) {
  const container = document.getElementById('notification-area');
  const notif = document.createElement('div');
  const config = {
    success: { border: 'border-emerald-400', bg: 'bg-emerald-50', icon: 'check-circle', iconColor: 'text-emerald-500' },
    error: { border: 'border-red-400', bg: 'bg-red-50', icon: 'alert-circle', iconColor: 'text-red-500' },
    info: { border: 'border-indigo-400', bg: 'bg-indigo-50', icon: 'info', iconColor: 'text-indigo-500' }
  }[type] || { border: 'border-slate-400', bg: 'bg-white', icon: 'bell', iconColor: 'text-slate-500' };

  notif.className = `animate-bounce-in ${config.bg} border-l-4 ${config.border} shadow-xl rounded-r-2xl p-4 flex items-start gap-3 pointer-events-auto`;
  notif.innerHTML = `
    <div class="${config.iconColor} mt-0.5"><i data-lucide="${config.icon}" width="18"></i></div>
    <p class="text-sm text-slate-700 leading-relaxed flex-grow">${message}</p>
    <button onclick="this.parentElement.remove()" class="text-slate-300 hover:text-slate-500 transition-colors"><i data-lucide="x" width="14"></i></button>`;
  container.appendChild(notif);
  lucide.createIcons();
  setTimeout(() => notif.remove(), 5000);
}

// --- 紙吹雪 ---
function triggerConfetti() {
  const container = document.getElementById('confetti-container');
  const colors = ['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#10b981'];
  for (let i = 0; i < 30; i++) {
    const c = document.createElement('div');
    c.className = 'animate-confetti';
    c.style.left = Math.random() * 100 + '%';
    c.style.top = '-10%';
    c.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    c.style.width = (6 + Math.random() * 8) + 'px';
    c.style.height = (6 + Math.random() * 8) + 'px';
    c.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    c.style.animationDelay = Math.random() * 0.8 + 's';
    c.style.animationDuration = (1.5 + Math.random() * 2) + 's';
    container.appendChild(c);
    setTimeout(() => c.remove(), 4000);
  }
}

// --- ログアウト ---
async function handleLogout() {
  await supabase.auth.signOut();
  window.location.href = '/index.html';
}
