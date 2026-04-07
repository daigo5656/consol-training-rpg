// ============================================
// メインアプリ (app.html) のロジック
// ============================================

let currentUser = null;
let currentProfile = null;
let completedSkills = []; // { skill_id, memo, completed_at }
let selectedCategory = 'ALL';
let currentPage = 'quests';
let pendingSkillId = null;

// --- 初期化 ---
(async () => {
  currentUser = await requireAuth();
  if (!currentUser) return;

  currentProfile = await getProfile(currentUser.id);

  // 管理者リンク表示
  if (currentProfile && currentProfile.role === 'admin') {
    document.getElementById('admin-link').classList.remove('hidden');
    document.getElementById('admin-link').classList.add('flex');
  }

  // ユーザー情報表示
  updateUserInfo();

  // 進捗データ読み込み
  await loadProgress();

  // 初回描画
  renderAll();

  // ローディング非表示
  document.getElementById('loading-screen').style.display = 'none';

  lucide.createIcons();
})();

// --- データ読み込み ---
async function loadProgress() {
  const { data, error } = await supabase
    .from('skill_progress')
    .select('skill_id, memo, completed_at')
    .eq('user_id', currentUser.id);

  if (error) {
    console.error('Progress load error:', error);
    return;
  }
  completedSkills = data || [];
}

function getCompletedIds() {
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
  const ids = getCompletedIds();
  const stats = calculateStats(ids);
  const totalLevel = Object.values(stats).reduce((sum, s) => sum + s.level, 0);

  document.getElementById('total-level').textContent = totalLevel;
  document.getElementById('completed-count').textContent = ids.length;
  document.getElementById('total-count').textContent = SKILL_DATA.length;
  document.getElementById('user-rank').textContent = getRankLabel(totalLevel);

  renderPCStatus(stats);
  renderMobileStatus(stats);
  renderFilters(ids);
  renderQuests(ids);
  renderRadarChart(stats);
  renderBadges(ids);

  lucide.createIcons();
}

function calculateStats(ids) {
  const stats = {};
  for (const catName in CATEGORIES) {
    const categorySkills = SKILL_DATA.filter(s => s.category === catName);
    const totalXp = categorySkills.reduce((sum, s) => sum + s.xp, 0);
    const earnedXp = categorySkills.filter(s => ids.includes(s.id)).reduce((sum, s) => sum + s.xp, 0);
    stats[catName] = {
      current: earnedXp,
      max: totalXp,
      level: Math.floor(earnedXp / 150) + 1,
      progress: Math.floor((earnedXp / totalXp) * 100) || 0
    };
  }
  return stats;
}

function renderPCStatus(stats) {
  document.getElementById('pc-status-bar').innerHTML = Object.entries(CATEGORIES).map(([catName, style]) => `
    <div class="flex flex-col items-center w-24">
      <div class="text-xs font-bold ${style.color} mb-1 flex items-center gap-1">
        <i data-lucide="${style.icon}" width="12"></i>
        ${style.description}
      </div>
      <div class="text-2xl font-black text-slate-700 leading-none mb-1">${stats[catName].current}</div>
      <div class="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
        <div class="h-full ${style.bgColor} transition-all duration-1000 ease-out" style="width: ${stats[catName].progress}%"></div>
      </div>
    </div>
  `).join('');
}

function renderMobileStatus(stats) {
  document.getElementById('mobile-status-grid').innerHTML = Object.entries(CATEGORIES).map(([catName, style]) => `
    <div class="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
      <div class="text-[10px] font-bold ${style.color} mb-1 flex items-center gap-1">
        <i data-lucide="${style.icon}" width="12"></i>
        ${style.description}
      </div>
      <div class="flex justify-between items-end mb-2">
        <span class="text-xl font-bold text-slate-800">${stats[catName].current}</span>
        <span class="text-xs text-slate-400">/ ${stats[catName].max} XP</span>
      </div>
      <div class="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
        <div class="h-full ${style.bgColor} transition-all duration-1000 ease-out" style="width: ${stats[catName].progress}%"></div>
      </div>
    </div>
  `).join('');
}

function renderFilters(ids) {
  const container = document.getElementById('filter-tabs');
  let html = `
    <button onclick="setCategory('ALL')" class="flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${selectedCategory === 'ALL' ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}">
      <i data-lucide="filter" width="14"></i> 全て (${SKILL_DATA.length})
    </button>
  `;
  html += Object.entries(CATEGORIES).map(([catName, style]) => `
    <button onclick="setCategory('${catName}')" class="flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${selectedCategory === catName ? `${style.bgColor} text-white shadow-md` : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}">
      <i data-lucide="${style.icon}" width="14"></i>
      ${catName.split("・")[0]}...
    </button>
  `).join('');
  container.innerHTML = html;
}

function renderQuests(ids) {
  const container = document.getElementById('quest-grid');
  const filtered = selectedCategory === 'ALL' ? SKILL_DATA : SKILL_DATA.filter(s => s.category === selectedCategory);

  container.innerHTML = filtered.map(skill => {
    const isCompleted = ids.includes(skill.id);
    const style = CATEGORIES[skill.category];
    const progress = completedSkills.find(p => p.skill_id === skill.id);

    let priorityBadge = '';
    if (skill.priority === "高") {
      priorityBadge = `<div class="flex items-center text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] font-bold border border-amber-100"><i data-lucide="star" width="12" class="mr-0.5 fill-current"></i> 高</div>`;
    } else if (skill.priority === "中") {
      priorityBadge = `<div class="flex items-center text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-bold border border-slate-200">中</div>`;
    } else {
      priorityBadge = `<div class="flex items-center text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded text-[10px] font-bold border border-slate-100">小</div>`;
    }

    let buttonHtml = isCompleted
      ? `<button disabled class="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 bg-slate-200 text-slate-400 cursor-default">
           <i data-lucide="check-circle-2" width="18"></i> 達成済み
         </button>`
      : `<button onclick="openMemo(${skill.id})" class="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all transform active:scale-95 ${style.bgColor} text-white shadow-lg hover:shadow-xl hover:brightness-110">
           <i data-lucide="sword" width="18"></i> クエスト完了
         </button>`;

    const memoHtml = (isCompleted && progress && progress.memo)
      ? `<div class="mx-5 mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
           <div class="text-[10px] font-bold text-yellow-600 mb-1 flex items-center gap-1">
             <i data-lucide="message-square" width="10"></i> 振り返りメモ
           </div>
           <p class="text-xs text-slate-600">${escapeHtml(progress.memo)}</p>
         </div>`
      : '';

    return `
      <div class="group relative bg-white rounded-2xl border-2 transition-all duration-300 flex flex-col overflow-hidden ${isCompleted ? 'border-slate-200 opacity-60 grayscale-[0.5]' : 'border-slate-100 hover:border-indigo-300 hover:shadow-xl hover:-translate-y-1'}">
        ${isCompleted ? `
        <div class="absolute inset-0 z-10 bg-white/50 flex items-center justify-center backdrop-blur-[1px]">
          <div class="bg-green-500 text-white px-4 py-2 rounded-full font-bold shadow-lg transform -rotate-12 border-4 border-white flex items-center gap-2">
            <i data-lucide="check-circle-2" width="20"></i> COMPLETED
          </div>
        </div>` : ''}
        <div class="px-5 py-4 border-b border-slate-100 flex justify-between items-start bg-gradient-to-br ${isCompleted ? 'from-slate-50 to-slate-100' : 'from-white to-slate-50'}">
          <div>
            <div class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-2 ${style.bgLight} ${style.color}">
              <i data-lucide="${style.icon}" width="10"></i>
              ${style.description}
            </div>
            <h3 class="font-bold text-lg text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">${skill.skillName}</h3>
          </div>
          <div class="flex flex-col items-center gap-1">
            ${priorityBadge}
            <span class="text-[10px] font-bold text-slate-400">+${skill.xp}XP</span>
          </div>
        </div>
        <div class="p-5 flex-grow space-y-4">
          <div class="text-xs text-slate-500 font-medium flex items-center gap-1">
            <div class="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
            ${skill.subCategory}
          </div>
          <div class="space-y-3">
            <div class="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div class="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1">
                <i data-lucide="target" width="12"></i> クリア条件 (DO)
              </div>
              <p class="text-sm text-slate-700 leading-relaxed whitespace-pre-line">${skill.practiceTask}</p>
            </div>
            <div class="bg-indigo-50/50 p-3 rounded-lg border border-indigo-50 group-hover:bg-indigo-50 transition-colors">
              <div class="flex items-center gap-2 text-xs font-bold text-indigo-400 mb-1">
                <i data-lucide="book-open" width="12"></i> ヒント (INPUT)
              </div>
              <p class="text-xs text-slate-600 leading-relaxed whitespace-pre-line">${skill.inputTask}</p>
            </div>
          </div>
        </div>
        ${memoHtml}
        <div class="p-4 border-t border-slate-100 bg-slate-50/50">
          ${buttonHtml}
        </div>
      </div>`;
  }).join('');
}

// --- レーダーチャート (SVG) ---
function renderRadarChart(stats) {
  const svg = document.getElementById('radar-chart');
  if (!svg) return;

  const cx = 150, cy = 150, maxR = 120;
  const categories = Object.keys(CATEGORIES);
  const n = categories.length;
  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2;

  // グリッド描画
  let gridHtml = '';
  for (let level = 1; level <= 4; level++) {
    const r = (maxR / 4) * level;
    const points = [];
    for (let i = 0; i < n; i++) {
      const angle = startAngle + i * angleStep;
      points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
    }
    gridHtml += `<polygon points="${points.join(' ')}" fill="none" stroke="#e2e8f0" stroke-width="1"/>`;
  }

  // 軸線
  for (let i = 0; i < n; i++) {
    const angle = startAngle + i * angleStep;
    gridHtml += `<line x1="${cx}" y1="${cy}" x2="${cx + maxR * Math.cos(angle)}" y2="${cy + maxR * Math.sin(angle)}" stroke="#e2e8f0" stroke-width="1"/>`;
  }

  // データポリゴン
  const dataPoints = [];
  categories.forEach((cat, i) => {
    const pct = stats[cat].progress / 100;
    const r = maxR * pct;
    const angle = startAngle + i * angleStep;
    dataPoints.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  });
  gridHtml += `<polygon points="${dataPoints.join(' ')}" fill="rgba(99, 102, 241, 0.2)" stroke="#6366f1" stroke-width="2"/>`;

  // ドットとラベル
  categories.forEach((cat, i) => {
    const pct = stats[cat].progress / 100;
    const r = maxR * pct;
    const angle = startAngle + i * angleStep;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    gridHtml += `<circle cx="${x}" cy="${y}" r="4" fill="#6366f1"/>`;

    // ラベル
    const lx = cx + (maxR + 20) * Math.cos(angle);
    const ly = cy + (maxR + 20) * Math.sin(angle);
    const anchor = Math.abs(Math.cos(angle)) < 0.1 ? 'middle' : (Math.cos(angle) > 0 ? 'start' : 'end');
    gridHtml += `<text x="${lx}" y="${ly}" text-anchor="${anchor}" dominant-baseline="middle" class="text-[10px] font-bold fill-slate-500">${CATEGORIES[cat].description}</text>`;
    gridHtml += `<text x="${lx}" y="${ly + 14}" text-anchor="${anchor}" dominant-baseline="middle" class="text-[10px] fill-slate-400">${stats[cat].progress}%</text>`;
  });

  svg.innerHTML = gridHtml;
}

// --- バッジ ---
function renderBadges(ids) {
  const container = document.getElementById('badge-grid');
  if (!container) return;

  container.innerHTML = BADGES.map(badge => {
    const earned = isBadgeEarned(badge, ids);
    return `
      <div class="p-4 rounded-xl border-2 transition-all ${earned ? 'border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 shadow-sm' : 'border-slate-100 bg-slate-50 opacity-50 grayscale'}">
        <div class="text-3xl mb-2">${badge.icon}</div>
        <h3 class="font-bold text-sm text-slate-800">${badge.name}</h3>
        <p class="text-xs text-slate-500 mt-1">${badge.description}</p>
        ${earned ? '<span class="inline-block mt-2 text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">獲得済み</span>' : '<span class="inline-block mt-2 text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">未獲得</span>'}
      </div>`;
  }).join('');
}

function isBadgeEarned(badge, ids) {
  if (badge.category === null) {
    // 全スキル制覇
    return ids.length === SKILL_DATA.length;
  }
  const catSkills = SKILL_DATA.filter(s => s.category === badge.category);
  const completed = catSkills.filter(s => ids.includes(s.id)).length;
  return (completed / catSkills.length) >= badge.threshold;
}

// --- リーダーボード ---
async function loadLeaderboard() {
  const { data: profiles } = await supabase.from('profiles').select('id, display_name, department');
  const { data: allProgress } = await supabase.from('skill_progress').select('user_id, skill_id');

  if (!profiles || !allProgress) return;

  const leaderboard = profiles.map(p => {
    const userProgress = allProgress.filter(sp => sp.user_id === p.id);
    const totalXp = userProgress.reduce((sum, sp) => {
      const skill = SKILL_DATA.find(s => s.id === sp.skill_id);
      return sum + (skill ? skill.xp : 0);
    }, 0);
    return { ...p, totalXp, completedCount: userProgress.length };
  }).sort((a, b) => b.totalXp - a.totalXp);

  const container = document.getElementById('leaderboard-list');
  if (leaderboard.length === 0) {
    container.innerHTML = '<div class="p-8 text-center text-slate-400">まだ参加者がいません</div>';
    return;
  }

  container.innerHTML = leaderboard.map((user, i) => {
    const rankIcon = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `<span class="text-slate-400 font-bold">${i + 1}</span>`;
    const isMe = user.id === currentUser.id;
    return `
      <div class="flex items-center gap-4 px-6 py-4 ${isMe ? 'bg-indigo-50' : 'hover:bg-slate-50'} transition-colors">
        <div class="w-8 text-center text-lg">${rankIcon}</div>
        <div class="w-10 h-10 bg-gradient-to-tr from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold shadow">
          ${user.display_name.charAt(0)}
        </div>
        <div class="flex-grow">
          <div class="font-bold text-sm text-slate-800 ${isMe ? 'text-indigo-700' : ''}">${escapeHtml(user.display_name)} ${isMe ? '(自分)' : ''}</div>
          <div class="text-xs text-slate-400">${user.completedCount}/${SKILL_DATA.length} クエスト達成</div>
        </div>
        <div class="text-right">
          <div class="font-black text-lg text-slate-700">${user.totalXp}</div>
          <div class="text-[10px] text-slate-400">XP</div>
        </div>
      </div>`;
  }).join('');
}

// --- ページ切り替え ---
function switchPage(page) {
  currentPage = page;
  const pages = ['quests', 'leaderboard', 'badges'];
  pages.forEach(p => {
    document.getElementById(`view-${p}`).classList.toggle('hidden', p !== page);
    const btn = document.getElementById(`page-${p}`);
    if (p === page) {
      btn.className = 'px-4 py-2 rounded-lg text-sm font-bold transition-all bg-slate-800 text-white';
    } else {
      btn.className = 'px-4 py-2 rounded-lg text-sm font-bold transition-all bg-white text-slate-500 hover:bg-slate-100';
    }
  });

  if (page === 'leaderboard') loadLeaderboard();
  lucide.createIcons();
}

// --- カテゴリフィルター ---
function setCategory(cat) {
  selectedCategory = cat;
  renderFilters(getCompletedIds());
  renderQuests(getCompletedIds());
  lucide.createIcons();
}

// --- クエスト完了フロー ---
function openMemo(skillId) {
  pendingSkillId = skillId;
  const skill = SKILL_DATA.find(s => s.id === skillId);
  document.getElementById('memo-skill-name').textContent = `「${skill.skillName}」を達成しますか？`;
  document.getElementById('memo-text').value = '';
  const modal = document.getElementById('memo-modal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function cancelMemo() {
  pendingSkillId = null;
  const modal = document.getElementById('memo-modal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

async function confirmComplete() {
  if (!pendingSkillId) return;

  const skillId = pendingSkillId;
  const memo = document.getElementById('memo-text').value.trim();

  // モーダル閉じる
  cancelMemo();

  // DB保存
  const { error } = await supabase.from('skill_progress').insert({
    user_id: currentUser.id,
    skill_id: skillId,
    memo: memo
  });

  if (error) {
    console.error('Save error:', error);
    showNotificationCustom('保存に失敗しました', 'error');
    return;
  }

  // ローカル状態更新
  completedSkills.push({ skill_id: skillId, memo, completed_at: new Date().toISOString() });

  const skill = SKILL_DATA.find(s => s.id === skillId);
  showNotification(skill);
  triggerConfetti();
  renderAll();
}

// --- 通知 ---
function showNotification(skill) {
  const container = document.getElementById('notification-area');
  const catInfo = CATEGORIES[skill.category];
  const notif = document.createElement('div');
  notif.className = 'animate-bounce-in bg-white border-l-4 border-yellow-400 shadow-xl rounded-r-lg p-4 flex items-center gap-3 pr-8 mb-3';
  notif.innerHTML = `
    <div class="bg-yellow-100 p-2 rounded-full text-yellow-600"><i data-lucide="trophy" width="20"></i></div>
    <div>
      <p class="font-bold text-slate-800">LEVEL UP!</p>
      <p class="text-sm text-slate-600">クエスト完了！「${skill.skillName}」を習得！ ${catInfo.description} UP!</p>
    </div>`;
  container.appendChild(notif);
  lucide.createIcons();
  setTimeout(() => notif.remove(), 3000);
}

function showNotificationCustom(message, type) {
  const container = document.getElementById('notification-area');
  const notif = document.createElement('div');
  const borderColor = type === 'error' ? 'border-red-400' : 'border-green-400';
  notif.className = `animate-bounce-in bg-white border-l-4 ${borderColor} shadow-xl rounded-r-lg p-4 mb-3`;
  notif.innerHTML = `<p class="text-sm text-slate-700">${message}</p>`;
  container.appendChild(notif);
  setTimeout(() => notif.remove(), 3000);
}

// --- 紙吹雪 ---
function triggerConfetti() {
  const container = document.getElementById('confetti-container');
  const colors = ['#FFD700', '#FF6347', '#00BFFF', '#32CD32'];
  for (let i = 0; i < 20; i++) {
    const c = document.createElement('div');
    c.className = 'animate-confetti';
    c.style.left = Math.random() * 100 + '%';
    c.style.top = '-10%';
    c.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    c.style.width = '10px';
    c.style.height = '10px';
    c.style.animationDelay = Math.random() * 0.5 + 's';
    c.style.animationDuration = (1 + Math.random() * 2) + 's';
    container.appendChild(c);
    setTimeout(() => c.remove(), 3000);
  }
}

// --- ログアウト ---
async function handleLogout() {
  await supabase.auth.signOut();
  window.location.href = '/index.html';
}

// --- ユーティリティ ---
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
