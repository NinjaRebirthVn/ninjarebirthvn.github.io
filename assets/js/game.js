/* =========================================================================
   Ninja Rebirth VN — game.js
   Trạng thái người chơi, tiến trình, màn hình, trang bị, cửa hàng, đấu trường.
   ========================================================================= */
'use strict';

const Game = (function () {
  const SAVE_KEY = 'ninjarebirth.vn.save.v1';
  const MAX_TEAM = 3;
  const MAX_LEVEL = 40;
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  let state = null;
  let selectedStarter = null;
  let currentPanel = 'team';

  /* =====================================================================
     TIỆN ÍCH
     ===================================================================== */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const rint = (a, b) => Math.floor(rnd(a, b + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = (arr) => arr.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  const fmt = (n) => Math.round(n).toLocaleString('vi-VN');

  function toast(msg, type) {
    const host = document.getElementById('toast-root');
    const el = document.createElement('div');
    el.className = 'toast ' + (type || '');
    el.textContent = msg;
    host.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateY(8px)'; el.style.transition = '.3s'; }, 2200);
    setTimeout(() => el.remove(), 2600);
  }

  /* =====================================================================
     LƯU / TẢI
     ===================================================================== */
  function newState(name, starter) {
    const st = {
      version: 1,
      name: name || 'Vô Danh',
      gold: 260,
      roster: [{ id: starter, level: 1, xp: 0, equip: { weapon: null, armor: null, charm: null } }],
      team: [starter],
      inventory: { hp_small: 3, chakra: 2, revive: 1 },
      gear: [],
      gearSeq: 1,
      cleared: {},
      arena: { rating: 1000, wins: 0, losses: 0 },
      settings: { sound: true },
      createdAt: Date.now()
    };
    return st;
  }

  function save() {
    if (!state) return;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { /* bỏ qua */ }
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const st = JSON.parse(raw);
      if (!st || !st.roster || !st.roster.length) return null;
      return st;
    } catch (e) { return null; }
  }

  function resetGame() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* bỏ qua */ }
    state = null;
    showTitle();
    toast('Đã xoá dữ liệu. Bắt đầu lại từ đầu.', 'ok');
  }

  /* =====================================================================
     CHỈ SỐ
     ===================================================================== */
  function xpNeed(level) { return Math.round(45 * Math.pow(level, 1.25)); }

  function baseStats(charId, level) {
    const def = CHAR_BY_ID[charId];
    const l = level - 1;
    return {
      hp: def.base.hp + def.growth.hp * l,
      atk: def.base.atk + def.growth.atk * l,
      def: def.base.def + def.growth.def * l,
      spd: def.base.spd + def.growth.spd * l,
      crit: def.base.crit + l * 0.15
    };
  }

  function statsFor(entry) {
    const s = baseStats(entry.id, entry.level);
    ['weapon', 'armor', 'charm'].forEach((slot) => {
      const gid = entry.equip && entry.equip[slot];
      const inst = gid ? state.gear.find((g) => g.uid === gid) : null;
      if (!inst) return;
      const tpl = EQUIP_BY_ID[inst.tid];
      if (!tpl) return;
      const mult = 1 + 0.12 * (inst.plus || 0);
      Object.entries(tpl.stats).forEach(([k, v]) => { s[k] = (s[k] || 0) + v * mult; });
    });
    return {
      hp: Math.round(s.hp), atk: Math.round(s.atk), def: Math.round(s.def),
      spd: Math.round(s.spd), crit: Math.round(s.crit * 10) / 10
    };
  }

  function enemyStats(key, level) {
    const b = ENEMIES[key].base;
    const f = 1 + 0.105 * (level - 1);
    return {
      hp: Math.round(b.hp * f), atk: Math.round(b.atk * f), def: Math.round(b.def * f),
      spd: Math.round(b.spd * (1 + 0.012 * (level - 1))), crit: b.crit
    };
  }

  function powerOf(entry) {
    const s = statsFor(entry);
    return Math.round(s.hp / 8 + s.atk * 2.2 + s.def * 1.6 + s.spd * 1.3 + s.crit * 5);
  }

  function teamEntries() {
    return state.team.map((id) => state.roster.find((r) => r.id === id)).filter(Boolean);
  }

  function teamPower() {
    return teamEntries().reduce((sum, e) => sum + powerOf(e), 0);
  }

  /* =====================================================================
     TIẾN TRÌNH
     ===================================================================== */
  function addXp(entry, amount) {
    entry.xp += amount;
    let gained = 0;
    while (entry.level < MAX_LEVEL && entry.xp >= xpNeed(entry.level)) {
      entry.xp -= xpNeed(entry.level);
      entry.level += 1;
      gained++;
    }
    if (entry.level >= MAX_LEVEL) entry.xp = 0;
    return gained;
  }

  function unlockChar(charId) {
    if (state.roster.find((r) => r.id === charId)) return false;
    state.roster.push({ id: charId, level: 1, xp: 0, equip: { weapon: null, armor: null, charm: null } });
    if (state.team.length < MAX_TEAM) state.team.push(charId);
    return true;
  }

  function stageCleared(id) { return !!state.cleared[id]; }

  function chapterUnlocked(ch) {
    if (ch.id === 1) return true;
    const prev = CHAPTERS.find((c) => c.id === ch.id - 1);
    if (!prev) return false;
    return prev.stages.every((s) => stageCleared(s.id));
  }

  function stageUnlocked(ch, idx) {
    if (!chapterUnlocked(ch)) return false;
    if (idx === 0) return true;
    return stageCleared(ch.stages[idx - 1].id);
  }

  /* =====================================================================
     TRANG BỊ
     ===================================================================== */
  function makeGear(tid, plus) {
    return { uid: 'g' + state.gearSeq++, tid, plus: plus || 0, holder: null };
  }

  function gearStatsText(inst) {
    const tpl = EQUIP_BY_ID[inst.tid];
    if (!tpl) return '';
    const mult = 1 + 0.12 * (inst.plus || 0);
    return Object.entries(tpl.stats).map(([k, v]) => `+${Math.round(v * mult)} ${{ hp: 'máu', atk: 'công', def: 'thủ', spd: 'tốc', crit: '% bạo' }[k]}`).join(' · ');
  }

  function rollGearDrop(level, forcedRarity) {
    const r = forcedRarity || (Math.random() < 0.55 ? 1 : Math.random() < 0.6 ? 2 : Math.random() < 0.75 ? 3 : 4);
    const pool = EQUIP_TEMPLATES.filter((e) => e.rarity === r);
    if (!pool.length) return null;
    const tpl = pick(pool);
    const inst = makeGear(tpl.id, clamp(Math.floor(level / 6), 0, 4));
    state.gear.push(inst);
    return inst;
  }

  function equipItem(charId, inst) {
    const entry = state.roster.find((r) => r.id === charId);
    const tpl = EQUIP_BY_ID[inst.tid];
    if (!entry || !tpl) return;
    // gỡ món đang dùng ở ô đó
    const cur = entry.equip[tpl.slot];
    if (cur) {
      const old = state.gear.find((g) => g.uid === cur);
      if (old) old.holder = null;
    }
    // nếu món này đang thuộc nhân vật khác thì gỡ ra
    if (inst.holder) {
      const prev = state.roster.find((r) => r.id === inst.holder);
      if (prev) Object.keys(prev.equip).forEach((k) => { if (prev.equip[k] === inst.uid) prev.equip[k] = null; });
    }
    entry.equip[tpl.slot] = inst.uid;
    inst.holder = charId;
  }

  function unequip(charId, slot) {
    const entry = state.roster.find((r) => r.id === charId);
    if (!entry || !entry.equip[slot]) return;
    const inst = state.gear.find((g) => g.uid === entry.equip[slot]);
    if (inst) inst.holder = null;
    entry.equip[slot] = null;
  }

  /* =====================================================================
     MODAL
     ===================================================================== */
  function modal(opts) {
    modalClose();
    const root = document.getElementById('modal-root');
    const back = document.createElement('div');
    back.className = 'modal-backdrop';
    const actions = (opts.actions || []).map((a, i) =>
      `<button class="btn ${a.cls || 'btn-ghost'}" data-act="${i}">${a.label}</button>`).join('');
    back.innerHTML = `
      <div class="modal ${opts.wide ? 'wide' : ''}" role="dialog" aria-modal="true">
        <div class="modal-head">
          <h3>${opts.title || ''}</h3>
          <button class="close-btn" data-close aria-label="Đóng">×</button>
        </div>
        <div class="modal-body">${opts.body || ''}</div>
        ${actions ? `<div class="modal-foot">${actions}</div>` : ''}
      </div>`;
    root.appendChild(back);
    back.addEventListener('click', (e) => {
      if (e.target === back || e.target.closest('[data-close]')) { modalClose(); opts.onClose && opts.onClose(); }
    });
    (opts.actions || []).forEach((a, i) => {
      const btn = back.querySelector(`[data-act="${i}"]`);
      if (btn) btn.addEventListener('click', () => {
        if (a.onClick) a.onClick();
        else modalClose();
      });
    });
    return back;
  }

  function modalClose() {
    const root = document.getElementById('modal-root');
    if (root) root.innerHTML = '';
  }

  function confirm(title, sub, onYes) {
    modal({
      title,
      body: `<p class="muted" style="font-size:13px;line-height:1.65">${sub || ''}</p>`,
      actions: [
        { label: 'Huỷ', cls: 'btn-ghost' },
        { label: 'Đồng ý', cls: 'btn-primary', onClick: () => { modalClose(); onYes && onYes(); } }
      ]
    });
  }

  /* =====================================================================
     MÀN HÌNH
     ===================================================================== */
  function showScreen(id) {
    $$('.screen').forEach((s) => s.classList.toggle('is-active', s.id === id));
    window.scrollTo(0, 0);
  }

  function showTitle() {
    showScreen('screen-title');
    const cont = document.getElementById('btn-continue');
    const saved = load();
    cont.hidden = !saved;
  }

  function showCreate() {
    selectedStarter = null;
    document.getElementById('input-name').value = '';
    renderStarters();
    renderStarterPreview();
    showScreen('screen-create');
  }

  function showHub() {
    showScreen('screen-hub');
    renderTopbar();
    renderPanel(currentPanel);
  }

  function switchPanel(name) {
    currentPanel = name;
    $$('.tab').forEach((t) => t.classList.toggle('is-active', t.dataset.panel === name));
    $$('.panel').forEach((p) => p.classList.toggle('is-active', p.id === 'panel-' + name));
    renderPanel(name);
  }

  function renderPanel(name) {
    if (name === 'team') renderTeam();
    else if (name === 'campaign') renderCampaign();
    else if (name === 'roster') renderRoster();
    else if (name === 'shop') renderShop();
    else if (name === 'arena') renderArena();
    renderTopbar();
  }

  function renderTopbar() {
    const gold = document.getElementById('res-gold');
    if (gold) gold.textContent = fmt(state.gold);
  }

  /* =====================================================================
     TẠO NHÂN VẬT
     ===================================================================== */
  function renderStarters() {
    const starters = CHARACTERS.filter((c) => c.starter);
    const host = document.getElementById('starter-grid');
    host.innerHTML = starters.map((c) => {
      const el = ELEMENTS[c.element];
      const s = baseStats(c.id, 1);
      const bar = (label, val, max) => `
        <div class="stat-line"><span style="width:34px">${label}</span>
          <span class="track"><i style="width:${clamp(val / max * 100, 6, 100)}%"></i></span>
          <b>${Math.round(val)}</b></div>`;
      return `<div class="starter" data-char="${c.id}">
        <div class="starter-art">${Art.portrait(c)}</div>
        <div>
          <div class="starter-name">${c.name}</div>
          <div class="starter-title">${c.title}</div>
          <div class="starter-tags">
            ${Art.elementBadge(c.element)}
            <span class="tag">${ROLES[c.role].name}</span>
          </div>
          <p class="starter-desc">${c.bio}</p>
          <div class="starter-stats">
            ${bar('Máu', s.hp, 1200)}
            ${bar('Công', s.atk, 170)}
            ${bar('Thủ', s.def, 130)}
            ${bar('Tốc', s.spd, 150)}
          </div>
        </div>
      </div>`;
    }).join('');

    host.querySelectorAll('.starter').forEach((node) => {
      node.addEventListener('click', () => {
        selectedStarter = node.dataset.char;
        host.querySelectorAll('.starter').forEach((n) => n.classList.toggle('is-selected', n === node));
        renderStarterPreview();
        Sfx.play('click');
      });
    });
  }

  function renderStarterPreview() {
    const host = document.getElementById('create-preview');
    if (!selectedStarter) {
      host.innerHTML = `<div class="preview-box"><span class="muted" style="font-size:13px">Chọn một nhẫn giả để xem chi tiết kỹ năng.</span></div>`;
      return;
    }
    const c = CHAR_BY_ID[selectedStarter];
    const s = baseStats(c.id, 1);
    host.innerHTML = `
      <div class="preview-box">
        <div class="detail-art" style="width:110px">${Art.portrait(c)}</div>
        <div style="flex:1">
          <div class="detail-name" style="font-size:17px">${c.name}</div>
          <div class="detail-title">${c.title} · ${ROLES[c.role].name}</div>
          <div class="detail-tags">${Art.elementBadge(c.element)}<span class="tag gold">${'★'.repeat(c.rarity)}</span></div>
          <div class="mini-list" style="margin-top:10px">
            <div class="row"><span>Máu</span><b>${Math.round(s.hp)}</b></div>
            <div class="row"><span>Công</span><b>${Math.round(s.atk)}</b></div>
            <div class="row"><span>Thủ</span><b>${Math.round(s.def)}</b></div>
            <div class="row"><span>Tốc</span><b>${Math.round(s.spd)}</b></div>
          </div>
        </div>
      </div>`;
  }

  function createCharacter() {
    if (!selectedStarter) { toast('Hãy chọn một nhẫn giả khai môn.', 'err'); return; }
    const nameInput = document.getElementById('input-name');
    const name = (nameInput.value || '').trim().slice(0, 16) || 'Vô Danh';
    state = newState(name, selectedStarter);
    save();
    Sfx.play('win');
    showHub();
    modal({
      title: 'Gia tộc Hắc Vũ hồi sinh',
      body: `<p class="muted" style="font-size:13px;line-height:1.75">
        Chào <b style="color:#fff">${escapeHtml(name)}</b>,<br><br>
        Ba năm trước, Huyết Nguyệt Giáo đốt sạch gia tộc của bạn. Hôm nay bạn trở về với một lời thề:
        dựng lại Hắc Vũ, chiêu mộ nhẫn giả, và đưa kẻ đứng sau tất cả ra ánh sáng.<br><br>
        Bắt đầu bằng nhiệm vụ đầu tiên ở <b>Làng Sương Mù</b>. Chúc bạn may mắn.</p>`,
      actions: [{ label: 'Đi tới nhiệm vụ', cls: 'btn-primary', onClick: () => { modalClose(); switchPanel('campaign'); } }]
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  /* =====================================================================
     PANEL: ĐỘI HÌNH
     ===================================================================== */
  function renderTeam() {
    const host = document.getElementById('panel-team');
    const slots = [];
    for (let i = 0; i < MAX_TEAM; i++) {
      const id = state.team[i];
      const entry = id ? state.roster.find((r) => r.id === id) : null;
      if (!entry) {
        slots.push(`<div class="slot is-empty" data-slot="${i}"><span>+ Thêm nhẫn giả vào vị trí ${i + 1}</span></div>`);
        continue;
      }
      const c = CHAR_BY_ID[entry.id];
      const s = statsFor(entry);
      slots.push(`<div class="slot" data-slot="${i}" data-char="${entry.id}">
        <div class="slot-art">${Art.portrait(c)}</div>
        <div class="slot-body">
          <div class="slot-top">
            <div class="slot-name">${c.name}<small>Lv ${entry.level}</small></div>
            ${Art.elementBadge(c.element)}
          </div>
          <div class="slot-sub">${ROLES[c.role].name} · ${c.title}</div>
          <div class="slot-stats">
            <span>Máu <b>${fmt(s.hp)}</b></span>
            <span>Công <b>${fmt(s.atk)}</b></span>
            <span>Thủ <b>${fmt(s.def)}</b></span>
            <span>Tốc <b>${fmt(s.spd)}</b></span>
          </div>
        </div>
      </div>`);
    }

    const cleared = Object.keys(state.cleared).length;
    const total = CHAPTERS.reduce((n, c) => n + c.stages.length, 0);
    const nextStage = findNextStage();

    host.innerHTML = `
      <div class="banner">
        <p class="eyebrow">Hắc Vũ Gia Tộc</p>
        <h2>${escapeHtml(state.name)} · Lv ${topLevel()}</h2>
        <p>Đội hình tối đa 3 nhẫn giả. Sắp xếp hợp lý giữa công, thủ và hỗ trợ để vượt qua các chương hồi.</p>
        <div class="banner-actions">
          <button class="btn btn-primary" data-go="campaign">Đi nhiệm vụ</button>
          <button class="btn btn-ghost" data-go="arena">⚑ Đấu trường</button>
          <button class="btn btn-ghost" data-go="shop">✧ Chiêu mộ</button>
        </div>
      </div>
      <div class="team-layout">
        <div class="team-slots">${slots.join('')}</div>
        <div class="card power-box">
          <div>
            <div class="power-label">Tổng chiến lực</div>
            <div class="power-val">${fmt(teamPower())}</div>
          </div>
          <div class="mini-list">
            <div class="row"><span>Nhẫn giả sở hữu</span><b>${state.roster.length}/${CHARACTERS.length}</b></div>
            <div class="row"><span>Nhiệm vụ hoàn thành</span><b>${cleared}/${total}</b></div>
            <div class="row"><span>Tỉ lệ đấu trường</span><b>${state.arena.wins}W - ${state.arena.losses}L</b></div>
            <div class="row"><span>Linh thạch</span><b class="price">${fmt(state.gold)}</b></div>
          </div>
          <div class="divider"></div>
          <p class="muted" style="font-size:12px;line-height:1.6">
            ${nextStage ? `Nhiệm vụ tiếp theo: <b style="color:#fff">${nextStage.chapter.name} — ${nextStage.stage.name}</b>`
              : 'Bạn đã hoàn thành toàn bộ chương hồi hiện có. Đấu trường vẫn đang chờ!'}
          </p>
          ${nextStage ? `<button class="btn btn-primary btn-block" data-next="${nextStage.stage.id}">Vào trận ngay</button>` : ''}
        </div>
      </div>`;

    host.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => switchPanel(b.dataset.go)));
    host.querySelectorAll('.slot.is-empty').forEach((n) => n.addEventListener('click', openTeamPicker));
    host.querySelectorAll('.slot[data-char]').forEach((n) => n.addEventListener('click', () => openCharDetail(n.dataset.char)));
    const nextBtn = host.querySelector('[data-next]');
    if (nextBtn) nextBtn.addEventListener('click', () => {
      const found = findStage(nextBtn.dataset.next);
      if (found) launchStage(found.chapter, found.stage);
    });
  }

  function topLevel() {
    return Math.max(1, ...state.roster.map((r) => r.level));
  }

  function findStage(id) {
    for (const ch of CHAPTERS) {
      const st = ch.stages.find((s) => s.id === id);
      if (st) return { chapter: ch, stage: st };
    }
    return null;
  }

  function findNextStage() {
    for (const ch of CHAPTERS) {
      if (!chapterUnlocked(ch)) break;
      for (let i = 0; i < ch.stages.length; i++) {
        if (!stageCleared(ch.stages[i].id) && stageUnlocked(ch, i)) return { chapter: ch, stage: ch.stages[i] };
      }
    }
    return null;
  }

  /* =====================================================================
     PANEL: NHIỆM VỤ
     ===================================================================== */
  function renderCampaign() {
    const host = document.getElementById('panel-campaign');
    host.innerHTML = `
      <div class="panel-head">
        <div>
          <h2>Chương hồi</h2>
          <p>Theo dấu Huyết Nguyệt Giáo qua bốn vùng đất.</p>
        </div>
        <div class="row">
          <span class="tag jade">Chiến lực ${fmt(teamPower())}</span>
          <span class="tag gold">${Object.keys(state.cleared).length} đã hoàn thành</span>
        </div>
      </div>
      ${CHAPTERS.map((ch) => {
        const unlocked = chapterUnlocked(ch);
        return `<div class="card chapter ${unlocked ? '' : 'is-locked'}">
          <div class="chapter-head">
            <div class="chapter-num">${ch.id}</div>
            <div style="flex:1">
              <h3>${ch.name} ${unlocked ? '' : '· <span class="muted" style="font-size:12px;font-weight:500">Chưa mở</span>'}</h3>
              <p>${ch.intro}</p>
            </div>
          </div>
          <div class="stage-list">
            ${ch.stages.map((st, idx) => {
              const open = stageUnlocked(ch, idx);
              const cleared = stageCleared(st.id);
              const enemyNames = st.enemies.map(([k]) => ENEMIES[k].name);
              const hasBoss = st.enemies.some(([k]) => ENEMIES[k].boss);
              return `<div class="stage-row ${open ? '' : 'is-locked'} ${cleared ? 'is-clear' : ''}" data-stage="${st.id}">
                <div class="stage-mark">${cleared ? '✓' : open ? st.lv : '×'}</div>
                <div class="stage-info">
                  <div class="stage-name">${st.name}
                    ${hasBoss ? '<span class="tag hot">Thủ lĩnh</span>' : ''}
                    ${cleared ? '<span class="tag jade">Hoàn thành</span>' : ''}
                  </div>
                  <div class="stage-enemies">
                    <span class="muted">Lv ${st.lv}</span>
                    ${enemyNames.map((n) => `<span>· ${n}</span>`).join('')}
                  </div>
                </div>
                <div class="stage-reward">
                  <div><b>${fmt(st.reward.gold)}</b> vàng</div>
                  <div><b>${fmt(st.reward.xp)}</b> KN</div>
                </div>
                <div class="stage-go">
                  <button class="btn btn-sm ${open ? 'btn-primary' : ''}" ${open ? '' : 'disabled'}>${open ? 'Vào trận' : 'Khoá'}</button>
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>`;
      }).join('')}`;

    host.querySelectorAll('.stage-row').forEach((row) => {
      row.addEventListener('click', () => {
        const found = findStage(row.dataset.stage);
        if (!found) return;
        const ch = found.chapter;
        const idx = ch.stages.indexOf(found.stage);
        if (!stageUnlocked(ch, idx)) { toast('Hãy hoàn thành nhiệm vụ trước đó.', 'err'); return; }
        if (!state.team.length) { toast('Đội hình trống — hãy thêm nhẫn giả.', 'err'); return; }
        if (found) launchStage(found.chapter, found.stage);
      });
    });
  }

  /* =====================================================================
     PANEL: NHẪN GIẢ
     ===================================================================== */
  function renderRoster() {
    const host = document.getElementById('panel-roster');
    host.innerHTML = `
      <div class="panel-head">
        <div>
          <h2>Nhẫn giả</h2>
          <p>Chạm vào một nhẫn giả để xem kỹ năng, trang bị và đưa vào đội hình.</p>
        </div>
        <span class="tag">${state.roster.length}/${CHARACTERS.length} đã chiêu mộ</span>
      </div>
      <div class="char-grid">
        ${CHARACTERS.map((c) => {
          const entry = state.roster.find((r) => r.id === c.id);
          const inTeam = !!entry && state.team.includes(c.id);
          return `<div class="char-card ${entry ? '' : 'is-locked'} ${inTeam ? 'is-in-team' : ''}" data-char="${c.id}">
            ${inTeam ? '<span class="team-flag">TRONG ĐỘI</span>' : ''}
            <div class="char-art">${Art.portrait(c)}</div>
            <div class="char-meta">
              <strong>${c.name}</strong>
              <span class="char-lv">${entry ? 'Lv ' + entry.level : '???'}</span>
            </div>
            <div class="char-sub">
              <span>${Art.elementDot(c.element)} ${ROLES[c.role].name}</span>
              <span class="stars">${'★'.repeat(c.rarity)}</span>
            </div>
          </div>`;
        }).join('')}
      </div>`;

    host.querySelectorAll('.char-card').forEach((card) => {
      card.addEventListener('click', () => {
        const entry = state.roster.find((r) => r.id === card.dataset.char);
        if (!entry) { toast('Nhẫn giả này chưa gia nhập. Hãy chiêu mộ hoặc hoàn thành chương hồi.', 'err'); return; }
        openCharDetail(card.dataset.char);
      });
    });
  }

  function openCharDetail(charId) {
    const entry = state.roster.find((r) => r.id === charId);
    if (!entry) return;
    const c = CHAR_BY_ID[charId];
    const s = statsFor(entry);
    const inTeam = state.team.includes(charId);
    const xpPct = entry.level >= MAX_LEVEL ? 100 : clamp(entry.xp / xpNeed(entry.level) * 100, 0, 100);

    const equipBlock = ['weapon', 'armor', 'charm'].map((slot) => {
      const gid = entry.equip[slot];
      const inst = gid ? state.gear.find((g) => g.uid === gid) : null;
      const tpl = inst ? EQUIP_BY_ID[inst.tid] : null;
      return `<div class="equip-slot" data-slot="${slot}">
        <span>${SLOT_NAMES[slot]}</span>
        <b style="color:${tpl ? RARITY[tpl.rarity].color : '#8b95ad'}">${tpl ? tpl.name + (inst.plus ? ' +' + inst.plus : '') : '— Trống —'}</b>
      </div>`;
    }).join('');

    const skills = [...c.skills, c.ult].map((sid, i) => {
      const sk = SKILLS[sid];
      if (!sk) return '';
      return `<div class="skill-item">
        <div class="sk-top"><span>${sk.name}</span><em>${i === 3 ? 'Bí kỹ · Nộ 100' : (sk.cost || 0) + ' chakra'}</em></div>
        <p>${sk.desc}</p>
      </div>`;
    }).join('');

    const back = modal({
      wide: true,
      title: c.name + ' · ' + c.title,
      body: `
        <div class="detail-head">
          <div class="detail-art">${Art.portrait(c)}</div>
          <div style="flex:1;min-width:0">
            <div class="detail-name">${c.name}</div>
            <div class="detail-title">${ROLES[c.role].name} · Cấp ${entry.level}</div>
            <div class="detail-tags">
              ${Art.elementBadge(c.element)}
              <span class="tag gold">${'★'.repeat(c.rarity)} ${RARITY[c.rarity].name}</span>
              ${inTeam ? '<span class="tag hot">Trong đội</span>' : ''}
            </div>
            <div class="stat-line" style="margin-top:10px">
              <span style="width:30px">XP</span>
              <span class="track"><i style="width:${xpPct}%"></i></span>
              <b style="width:64px">${entry.level >= MAX_LEVEL ? 'MAX' : entry.xp + '/' + xpNeed(entry.level)}</b>
            </div>
            <p class="detail-bio">${c.bio}</p>
          </div>
        </div>
        <div class="stat-grid">
          <div class="stat-box"><span>Máu</span><b>${fmt(s.hp)}</b></div>
          <div class="stat-box"><span>Công</span><b>${fmt(s.atk)}</b></div>
          <div class="stat-box"><span>Phòng ngự</span><b>${fmt(s.def)}</b></div>
          <div class="stat-box"><span>Tốc độ</span><b>${fmt(s.spd)}</b></div>
          <div class="stat-box"><span>Bạo kích</span><b>${s.crit}%</b></div>
          <div class="stat-box"><span>Chiến lực</span><b>${fmt(powerOf(entry))}</b></div>
        </div>
        <div class="equip-row">${equipBlock}</div>
        <h4 style="margin-top:16px;font-size:13px">Kỹ năng</h4>
        <div class="skill-list">${skills}</div>`,
      actions: [
        { label: inTeam ? 'Rút khỏi đội' : 'Đưa vào đội', cls: inTeam ? 'btn-ghost' : 'btn-primary', onClick: () => { toggleTeam(charId); modalClose(); } }
      ]
    });

    back.querySelectorAll('.equip-slot').forEach((node) => {
      node.addEventListener('click', () => { modalClose(); openEquipPicker(charId, node.dataset.slot); });
    });
  }

  function toggleTeam(charId) {
    const idx = state.team.indexOf(charId);
    if (idx >= 0) {
      state.team.splice(idx, 1);
      toast('Đã rút ' + CHAR_BY_ID[charId].name + ' khỏi đội.', 'ok');
    } else {
      if (state.team.length >= MAX_TEAM) { toast('Đội hình đã đủ 3 người.', 'err'); return; }
      state.team.push(charId);
      toast(CHAR_BY_ID[charId].name + ' đã vào đội hình.', 'ok');
    }
    save();
    renderPanel(currentPanel);
  }

  function openTeamPicker() {
    const free = state.roster.filter((r) => !state.team.includes(r.id));
    if (!free.length) { toast('Tất cả nhẫn giả đã có trong đội.', 'err'); return; }
    modal({
      title: 'Chọn nhẫn giả',
      body: `<div class="equip-pick">${free.map((r) => {
        const c = CHAR_BY_ID[r.id];
        return `<div class="equip-opt" data-char="${r.id}">
          <div style="display:flex;gap:10px;align-items:center">
            <div style="width:44px;flex:0 0 auto;border-radius:8px;overflow:hidden">${Art.portrait(c)}</div>
            <div><div class="eq-name">${c.name} <span class="muted" style="font-size:11px">Lv ${r.level}</span></div>
              <div class="eq-stats">${ROLES[c.role].name} · Chiến lực ${fmt(powerOf(r))}</div></div>
          </div>
          <span class="tag">${Art.elementDot(c.element)} ${ELEMENTS[c.element].name}</span>
        </div>`;
      }).join('')}</div>`,
      onClose: () => {}
    }).querySelectorAll('.equip-opt').forEach((node) => {
      node.addEventListener('click', () => {
        if (state.team.length >= MAX_TEAM) { toast('Đội hình đã đủ 3 người.', 'err'); return; }
        state.team.push(node.dataset.char);
        save();
        modalClose();
        renderPanel(currentPanel);
      });
    });
  }

  function openEquipPicker(charId, slot) {
    const entry = state.roster.find((r) => r.id === charId);
    if (!entry) return;
    const options = state.gear.filter((g) => {
      const t = EQUIP_BY_ID[g.tid];
      return t && t.slot === slot && (!g.holder || g.holder === charId);
    });
    const body = options.length
      ? `<div class="equip-pick">${options.map((g) => {
        const t = EQUIP_BY_ID[g.tid];
        return `<div class="equip-opt" data-gear="${g.uid}">
          <div><div class="eq-name" style="color:${RARITY[t.rarity].color}">${t.name}${g.plus ? ' +' + g.plus : ''}</div>
            <div class="eq-stats">${gearStatsText(g)}</div></div>
          <span class="tag">${RARITY[t.rarity].name}</span>
        </div>`;
      }).join('')}</div>`
      : `<p class="empty">Chưa có trang bị phù hợp trong túi.<br>Hãy đánh nhiệm vụ hoặc mua ở cửa hàng.</p>`;

    const back = modal({
      title: `${SLOT_NAMES[slot]} của ${CHAR_BY_ID[charId].name}`,
      body,
      actions: entry.equip[slot]
        ? [{ label: 'Tháo trang bị', cls: 'btn-ghost', onClick: () => { unequip(charId, slot); save(); modalClose(); openCharDetail(charId); } }]
        : [{ label: 'Đóng', cls: 'btn-ghost' }]
    });
    back.querySelectorAll('[data-gear]').forEach((node) => {
      node.addEventListener('click', () => {
        const inst = state.gear.find((g) => g.uid === node.dataset.gear);
        if (!inst) return;
        equipItem(charId, inst);
        save();
        Sfx.play('click');
        modalClose();
        openCharDetail(charId);
      });
    });
  }

  /* =====================================================================
     PANEL: CỬA HÀNG
     ===================================================================== */
  let shopStock = [];

  function refreshStock() {
    shopStock = [];
    const slots = ['weapon', 'armor', 'charm'];
    slots.forEach((slot) => {
      const pool = EQUIP_TEMPLATES.filter((e) => e.slot === slot && e.rarity <= 3);
      const tpl = pick(pool);
      shopStock.push({ kind: 'gear', tid: tpl.id, price: 120 + tpl.rarity * 110 });
    });
    shopStock.push({ kind: 'gear', tid: pick(EQUIP_TEMPLATES.filter((e) => e.rarity === 4)).id, price: 900 });
  }

  function renderShop() {
    if (!shopStock.length) refreshStock();
    const host = document.getElementById('panel-shop');
    const items = Object.values(ITEMS);
    host.innerHTML = `
      <div class="panel-head">
        <div>
          <h2>Chợ đêm</h2>
          <p>Vật phẩm, trang bị và chiêu mộ nhẫn giả mới.</p>
        </div>
        <div class="row"><span class="tag gold">Linh thạch: ${fmt(state.gold)}</span></div>
      </div>

      <div class="card" style="padding:16px;margin-bottom:16px;background:linear-gradient(120deg,rgba(255,90,60,.16),rgba(255,255,255,.02))">
        <div class="row wrap">
          <div style="flex:1;min-width:220px">
            <h3 style="font-size:15px">Chiêu mộ nhẫn giả</h3>
            <p class="muted" style="font-size:12.5px;margin-top:6px;line-height:1.6">
              Triệu hồi ngẫu nhiên một nhẫn giả chưa gia nhập. Nhẫn giả hiếm hơn xuất hiện với tỉ lệ thấp hơn.
            </p>
          </div>
          <button class="btn btn-gold" id="btn-recruit">Chiêu mộ · 700 <span style="opacity:.7">linh thạch</span></button>
        </div>
      </div>

      <h3 style="font-size:15px;margin:0 0 10px">Trang bị</h3>
      <div class="shop-grid" style="margin-bottom:20px">
        ${shopStock.map((s, i) => {
          const tpl = EQUIP_BY_ID[s.tid];
          return `<div class="card shop-card">
            <div class="shop-top">
              <h4 style="color:${RARITY[tpl.rarity].color}">${tpl.name}</h4>
              <span class="tag">${SLOT_NAMES[tpl.slot]}</span>
            </div>
            <p>${Object.entries(tpl.stats).map(([k, v]) => `+${v} ${{ hp: 'máu', atk: 'công', def: 'thủ', spd: 'tốc', crit: '% bạo' }[k]}`).join(' · ')}</p>
            <div class="row">
              <span class="price">${fmt(s.price)} ◆</span>
              <span class="spacer"></span>
              <button class="btn btn-sm btn-primary" data-buy-gear="${i}">Mua</button>
            </div>
          </div>`;
        }).join('')}
      </div>

      <h3 style="font-size:15px;margin:0 0 10px">Vật phẩm</h3>
      <div class="shop-grid">
        ${items.map((it) => `
          <div class="card shop-card">
            <div class="shop-top">
              <h4>${it.name}</h4>
              <span class="owned">Có ${state.inventory[it.id] || 0}</span>
            </div>
            <p>${it.desc}</p>
            <div class="row">
              <span class="price">${fmt(it.price)} ◆</span>
              <span class="spacer"></span>
              <button class="btn btn-sm" data-buy-item="${it.id}">Mua</button>
            </div>
          </div>`).join('')}
      </div>`;

    const recruitBtn = host.querySelector('#btn-recruit');
    recruitBtn.addEventListener('click', recruit);
    host.querySelectorAll('[data-buy-gear]').forEach((b) => b.addEventListener('click', () => buyGear(+b.dataset.buyGear)));
    host.querySelectorAll('[data-buy-item]').forEach((b) => b.addEventListener('click', () => buyItem(b.dataset.buyItem)));
  }

  function buyGear(index) {
    const s = shopStock[index];
    if (!s) return;
    if (state.gold < s.price) { toast('Không đủ linh thạch.', 'err'); return; }
    state.gold -= s.price;
    const inst = makeGear(s.tid, 0);
    state.gear.push(inst);
    shopStock.splice(index, 1);
    refreshStock();
    save();
    Sfx.play('coin');
    toast('Đã mua ' + EQUIP_BY_ID[s.tid].name + '. Trang bị nằm trong túi đồ.', 'ok');
    renderShop();
  }

  function buyItem(id) {
    const it = ITEMS[id];
    if (!it) return;
    if (state.gold < it.price) { toast('Không đủ linh thạch.', 'err'); return; }
    state.gold -= it.price;
    state.inventory[id] = (state.inventory[id] || 0) + 1;
    save();
    Sfx.play('coin');
    toast(`Đã mua ${it.name}.`, 'ok');
    renderShop();
  }

  function recruit() {
    const locked = CHARACTERS.filter((c) => !state.roster.find((r) => r.id === c.id));
    if (!locked.length) { toast('Bạn đã sở hữu toàn bộ nhẫn giả.', 'err'); return; }
    if (state.gold < 700) { toast('Cần 700 linh thạch để chiêu mộ.', 'err'); return; }
    state.gold -= 700;
    // tỉ lệ theo độ hiếm
    const weighted = [];
    locked.forEach((c) => { const w = Math.max(1, 6 - c.rarity); for (let i = 0; i < w; i++) weighted.push(c.id); });
    const got = pick(weighted);
    unlockChar(got);
    save();
    Sfx.play('win');
    const c = CHAR_BY_ID[got];
    const wasInTeam = state.team.includes(got);
    modal({
      title: 'Chiêu mộ thành công',
      body: `<div style="text-align:center">
        <div style="width:150px;margin:0 auto 12px;border-radius:14px;overflow:hidden">${Art.portrait(c)}</div>
        <div class="detail-name" style="font-size:19px">${c.name}</div>
        <div class="detail-title">${c.title}</div>
        <div class="detail-tags" style="justify-content:center">${Art.elementBadge(c.element)}<span class="tag gold">${'★'.repeat(c.rarity)}</span></div>
        <p class="detail-bio">${c.bio}</p>
        <p class="muted" style="font-size:12px;margin-top:8px">${wasInTeam ? 'Đã tự động thêm vào đội hình.' : 'Đã thêm vào danh sách nhẫn giả.'}</p>
      </div>`,
      actions: [{ label: 'Tuyệt vời', cls: 'btn-primary' }]
    });
    renderShop();
  }

  /* =====================================================================
     PANEL: ĐẤU TRƯỜNG
     ===================================================================== */
  function tierOf(rating) {
    let t = ARENA_TIERS[0];
    ARENA_TIERS.forEach((x) => { if (rating >= x.min) t = x; });
    return t;
  }

  function arenaOpponents() {
    const top = topLevel();
    const names = shuffle(ARENA_NAMES).slice(0, 3);
    return names.map((name, i) => {
      const lv = clamp(top + rint(-2, 2), 1, MAX_LEVEL);
      const ids = shuffle(CHARACTERS.map((c) => c.id)).slice(0, 3);
      return {
        name, lv, ids,
        power: ids.reduce((sum, id) => {
          const st = baseStats(id, lv);
          return sum + Math.round(st.hp / 8 + st.atk * 2.2 + st.def * 1.6 + st.spd * 1.3);
        }, 0)
      };
    });
  }

  function renderArena() {
    const host = document.getElementById('panel-arena');
    const tier = tierOf(state.arena.rating);
    const opps = arenaOpponents();
    host.innerHTML = `
      <div class="panel-head">
        <div>
          <h2>Đấu trường</h2>
          <p>Thách đấu các bang hội khác để tăng điểm xếp hạng.</p>
        </div>
      </div>
      <div class="arena-head">
        <div class="card rating-box">
          <div class="power-label">Điểm đấu trường</div>
          <div class="rating" style="color:${tier.color}">${fmt(state.arena.rating)}</div>
          <div class="tier" style="color:${tier.color}">${tier.name}</div>
          <div class="sub">${state.arena.wins} thắng · ${state.arena.losses} thua<br>Thắng +25 điểm, thua -12 điểm</div>
        </div>
        <div class="card" style="padding:16px">
          <h3 style="font-size:15px;margin-bottom:12px">Đối thủ hôm nay</h3>
          <div class="opp-list">
            ${opps.map((o, i) => `
              <div class="opp-card" style="border:1px solid rgba(255,255,255,.06);border-radius:12px">
                <div class="opp-art">${o.ids.map((id) => Art.portrait(CHAR_BY_ID[id])).join('')}</div>
                <div class="opp-info">
                  <strong>${o.name}</strong>
                  <p>Lv ${o.lv} · Chiến lực ${fmt(o.power)}</p>
                </div>
                <button class="btn btn-sm btn-primary" data-opp="${i}">Thách đấu</button>
              </div>`).join('')}
          </div>
        </div>
      </div>
      <p class="muted" style="font-size:12px;line-height:1.7;text-align:center">
        Đội hình của bạn: <b style="color:#fff">${teamEntries().map((e) => CHAR_BY_ID[e.id].name).join(' · ') || 'Trống'}</b>
        — Chiến lực ${fmt(teamPower())}
      </p>`;

    const currentOpps = opps;
    host.querySelectorAll('[data-opp]').forEach((b) => b.addEventListener('click', () => {
      const o = currentOpps[+b.dataset.opp];
      if (!state.team.length) { toast('Hãy xếp đội hình trước.', 'err'); return; }
      launchArena(o);
    }));
  }

  /* =====================================================================
     TRẬN ĐẤU
     ===================================================================== */
  function allySpecs() {
    return teamEntries().map((e) => {
      const c = CHAR_BY_ID[e.id];
      return {
        name: c.name, element: c.element, role: c.role, level: e.level,
        skills: c.skills, ult: c.ult, portrait: Art.portrait(c), stats: statsFor(e)
      };
    });
  }

  const FOE_VARIANTS = [
    { hair: 'spike', weapon: 'katana' },
    { hair: 'hood', weapon: 'kunai' },
    { hair: 'bob', weapon: 'claws' }
  ];

  function enemySpecs(list, levelOverride) {
    return list.map(([key, lv], i) => {
      const e = ENEMIES[key];
      const level = levelOverride || lv;
      const variant = e.art.beast ? {} : FOE_VARIANTS[i % FOE_VARIANTS.length];
      const art = { ...e.art, ...variant };
      return {
        name: e.name, element: e.element, level, boss: !!e.boss,
        skills: e.skills, ult: null,
        portrait: Art.portrait({ ...e, art, name: e.name }), stats: enemyStats(key, level)
      };
    });
  }

  function battleItems() {
    return Object.values(ITEMS)
      .filter((it) => it.battle)
      .map((it) => ({ ...it, count: state.inventory[it.id] || 0 }));
  }

  function launchStage(chapter, stage) {
    if (!state.team.length) { toast('Hãy xếp ít nhất 1 nhẫn giả vào đội.', 'err'); return; }
    const allies = allySpecs();
    const enemies = enemySpecs(stage.enemies);
    Sfx.play('battle');
    Battle.stop();
    Battle.start({
      title: stage.name,
      kicker: `Chương ${chapter.id} · ${chapter.name}`,
      subtitle: `Lv ${stage.lv} · ${enemies.length} kẻ địch`,
      intro: `Trận chiến tại ${stage.name} bắt đầu!`,
      allies, enemies,
      items: battleItems(),
      onEnd: (win) => {
        Battle.stop();
        if (win) winStage(chapter, stage);
        else loseBattle('Đội hình của bạn đã thất thủ. Hãy luyện tập và thử lại!');
      }
    });
  }

  function launchArena(opp) {
    const allies = allySpecs();
    const enemies = opp.ids.map((id, i) => {
      const c = CHAR_BY_ID[id];
      const st = baseStats(id, opp.lv);
      return {
        name: c.name, element: c.element, role: c.role, level: opp.lv,
        skills: c.skills, ult: c.ult,
        portrait: Art.portrait(c),
        stats: { hp: Math.round(st.hp * 0.92), atk: Math.round(st.atk * 0.92), def: Math.round(st.def * 0.92), spd: Math.round(st.spd), crit: Math.round(st.crit) }
      };
    });
    Sfx.play('battle');
    Battle.stop();
    Battle.start({
      title: opp.name,
      kicker: 'Đấu trường',
      subtitle: `Lv ${opp.lv} · Chiến lực ${fmt(opp.power)}`,
      intro: `Thách đấu ${opp.name}!`,
      allies, enemies,
      items: battleItems(),
      onEnd: (win) => {
        Battle.stop();
        if (win) {
          state.arena.wins++;
          state.arena.rating = Math.max(0, state.arena.rating + 25);
          const gold = 130, xp = 70;
          state.gold += gold;
          teamEntries().forEach((e) => addXp(e, xp));
          save();
          Sfx.play('win');
          showResult({
            title: 'Thắng đấu trường',
            lines: [`+25 điểm xếp hạng`, `+${fmt(gold)} linh thạch`, `+${xp} kinh nghiệm cho đội hình`],
            note: `Điểm hiện tại: ${fmt(state.arena.rating)} (${tierOf(state.arena.rating).name})`
          });
        } else {
          state.arena.losses++;
          state.arena.rating = Math.max(0, state.arena.rating - 12);
          save();
          loseBattle('Bạn đã thua trận đấu trường. -12 điểm xếp hạng.');
        }
      }
    });
  }

  function winStage(chapter, stage) {
    const first = !stageCleared(stage.id);
    const goldBonus = first ? Math.round(stage.reward.gold * 0.6) : 0;
    const gold = stage.reward.gold + goldBonus;
    state.gold += gold;
    const lines = [`+${fmt(gold)} linh thạch`, `+${fmt(stage.reward.xp)} kinh nghiệm`];

    const levelUps = [];
    teamEntries().forEach((e) => {
      const g = addXp(e, stage.reward.xp);
      if (g > 0) levelUps.push(`${CHAR_BY_ID[e.id].name} lên Lv ${e.level}`);
    });
    if (levelUps.length) lines.push(levelUps.join(' · '));

    let unlocked = null;
    if (first) {
      state.cleared[stage.id] = true;
      if (stage.firstClear && stage.firstClear.char) {
        const ok = unlockChar(stage.firstClear.char);
        if (ok) unlocked = CHAR_BY_ID[stage.firstClear.char];
      }
      if (stage.firstClear && stage.firstClear.gold) {
        state.gold += stage.firstClear.gold;
        lines.push(`Thưởng phá đảo: +${fmt(stage.firstClear.gold)} linh thạch`);
      }
      // rơi đồ
      if (Math.random() < 0.75) {
        const drop = rollGearDrop(stage.lv);
        if (drop) {
          const tpl = EQUIP_BY_ID[drop.tid];
          lines.push(`Nhận trang bị: ${tpl.name}${drop.plus ? ' +' + drop.plus : ''}`);
        }
      }
      const itemKeys = Object.keys(ITEMS);
      if (Math.random() < 0.5) {
        const key = pick(itemKeys);
        state.inventory[key] = (state.inventory[key] || 0) + 1;
        lines.push(`Nhận vật phẩm: ${ITEMS[key].name}`);
      }
    }

    save();
    Sfx.play('win');
    showResult({
      title: 'Chiến thắng',
      lines,
      note: unlocked ? `${unlocked.name} đã gia nhập gia tộc Hắc Vũ!` : (first ? 'Đã mở khoá nhiệm vụ tiếp theo.' : 'Bạn có thể cày lại nhiệm vụ này để lấy thêm tài nguyên.'),
      char: unlocked
    });
  }

  function loseBattle(note) {
    save();
    modal({
      title: 'Thất bại',
      body: `<p class="muted" style="font-size:13px;line-height:1.7">${note}</p>
        <p class="muted" style="font-size:12.5px;margin-top:10px">Gợi ý: nâng cấp trang bị, thêm nhẫn giả hồi máu, hoặc cày lại nhiệm vụ cũ để tăng cấp.</p>`,
      actions: [
        { label: 'Về làng', cls: 'btn-ghost', onClick: () => { modalClose(); showHub(); } },
        { label: 'Xem nhiệm vụ', cls: 'btn-primary', onClick: () => { modalClose(); showHub(); switchPanel('campaign'); } }
      ],
      onClose: () => showHub()
    });
  }

  function showResult(opts) {
    const body = `<div style="text-align:center">
      <div style="font-size:13px;letter-spacing:.3em;text-transform:uppercase;color:#ffb59d">${opts.title}</div>
      <div class="mini-list" style="margin-top:14px;text-align:left">
        ${opts.lines.map((l) => `<div class="row"><span style="color:#a9b4c9">${l}</span></div>`).join('')}
      </div>
      ${opts.note ? `<p class="muted" style="font-size:12.5px;margin-top:12px;line-height:1.6">${opts.note}</p>` : ''}
      ${opts.char ? `<div style="width:120px;margin:14px auto 0;border-radius:12px;overflow:hidden">${Art.portrait(opts.char)}</div>` : ''}
    </div>`;
    modal({
      title: 'Kết quả',
      body,
      actions: [
        { label: 'Tiếp tục', cls: 'btn-primary', onClick: () => { modalClose(); showHub(); } }
      ],
      onClose: () => showHub()
    });
  }

  /* =====================================================================
     VẬT PHẨM TRONG TRẬN
     ===================================================================== */
  function openItemPicker(items, cb) {
    const available = items.filter((i) => i.count > 0);
    modal({
      title: 'Vật phẩm',
      body: available.length
        ? `<div class="equip-pick">${available.map((it) => `
            <div class="equip-opt" data-item="${it.id}">
              <div><div class="eq-name">${it.name} <span class="muted" style="font-size:11px">×${it.count}</span></div>
                <div class="eq-stats">${it.desc}</div></div>
              <span class="tag">Dùng</span>
            </div>`).join('')}</div>`
        : `<p class="empty">Túi đồ trống.</p>`,
      actions: [{ label: 'Đóng', cls: 'btn-ghost' }]
    }).querySelectorAll('[data-item]').forEach((node) => {
      node.addEventListener('click', () => {
        const item = ITEMS[node.dataset.item];
        if (item) cb(item);
      });
    });
  }

  function consumeItem(id) {
    if (!state.inventory[id]) return;
    state.inventory[id] -= 1;
    save();
  }

  /* =====================================================================
     HƯỚNG DẪN / TÙY CHỌN
     ===================================================================== */
  function openGuide() {
    modal({
      wide: true,
      title: 'Hướng dẫn nhập môn',
      body: `<div class="muted" style="font-size:13px;line-height:1.85">
        <p><b style="color:#fff">1. Đội hình.</b> Bạn điều khiển tối đa 3 nhẫn giả. Nên có 1 người phòng thủ hoặc hồi máu để đội trụ lâu hơn.</p>
        <p style="margin-top:10px"><b style="color:#fff">2. Chiến đấu theo lượt.</b> Thanh tốc độ (vạch mảnh dưới thanh Nộ) quyết định ai được đi trước. Tốc độ càng cao, lượt đến càng nhanh.</p>
        <p style="margin-top:10px"><b style="color:#fff">3. Chakra &amp; Nộ.</b> Mỗi lượt bạn nhận lại chakra để dùng kỹ năng. Nộ tích đầy 100 sẽ mở <b style="color:#ffd166">Bí Kỹ</b> — đòn mạnh nhất của nhẫn giả.</p>
        <p style="margin-top:10px"><b style="color:#fff">4. Ngũ hành.</b> Hỏa khắc Phong, Phong khắc Lôi, Lôi khắc Thủy, Thủy khắc Thổ, Thổ khắc Mộc, Mộc khắc Hỏa. Đánh đúng hệ gây thêm 25% sát thương.</p>
        <p style="margin-top:10px"><b style="color:#fff">5. Trang bị.</b> Vào mục <b>Nhẫn giả</b>, chạm vào nhân vật rồi chọn ô Vũ khí / Giáp / Bí bảo để mặc đồ. Trang bị rơi ra từ nhiệm vụ.</p>
        <p style="margin-top:10px"><b style="color:#fff">6. Tiến trình.</b> Hoàn thành nhiệm vụ để mở chương mới và chiêu mộ thêm nhẫn giả. Tiến trình được lưu tự động trong trình duyệt.</p>
        <p style="margin-top:14px;color:#8b95ad;font-size:12px">Mẹo: bật <b>Tự động</b> ở màn hình chiến đấu khi muốn cày nhanh.</p>
      </div>`,
      actions: [{ label: 'Đã hiểu', cls: 'btn-primary' }]
    });
  }

  function openMenu() {
    const soundOn = state ? state.settings.sound : Sfx.enabled;
    modal({
      title: 'Tuỳ chọn',
      body: `<div class="equip-pick">
        <div class="equip-opt" data-act="sound">
          <div><div class="eq-name">Âm thanh</div><div class="eq-stats">Hiệu ứng âm thanh tổng hợp bằng Web Audio</div></div>
          <span class="tag ${soundOn ? 'jade' : ''}">${soundOn ? 'Đang bật' : 'Đang tắt'}</span>
        </div>
        <div class="equip-opt" data-act="guide">
          <div><div class="eq-name">Hướng dẫn</div><div class="eq-stats">Cách chơi, ngũ hành và mẹo</div></div>
          <span class="tag">Mở</span>
        </div>
        ${state ? `<div class="equip-opt" data-act="reset">
          <div><div class="eq-name" style="color:#ff9aa6">Xoá dữ liệu chơi</div><div class="eq-stats">Bắt đầu lại từ đầu, không thể hoàn tác</div></div>
          <span class="tag hot">Xoá</span>
        </div>` : ''}
      </div>
      <p class="muted" style="font-size:11.5px;margin-top:14px;line-height:1.65">
        Ninja Rebirth VN · bản chơi trên trình duyệt. Toàn bộ nhân vật, tên gọi và hình ảnh trong game là sáng tác gốc của dự án.
      </p>`,
      actions: [{ label: 'Đóng', cls: 'btn-ghost' }]
    }).querySelectorAll('[data-act]').forEach((node) => {
      node.addEventListener('click', () => {
        const act = node.dataset.act;
        if (act === 'sound') {
          Sfx.toggle();
          if (state) { state.settings.sound = Sfx.enabled; save(); }
          openMenu();
        } else if (act === 'guide') { modalClose(); openGuide(); }
        else if (act === 'reset') {
          modalClose();
          confirm('Xoá toàn bộ tiến trình?', 'Hành động này không thể hoàn tác.', resetGame);
        }
      });
    });
  }

  /* =====================================================================
     KHỞI TẠO
     ===================================================================== */
  function bind() {
    document.getElementById('btn-new').addEventListener('click', () => {
      if (load()) {
        confirm('Bắt đầu hành trình mới?', 'Tiến trình đang lưu sẽ bị xoá.', () => { modalClose(); showCreate(); });
      } else showCreate();
    });
    document.getElementById('btn-continue').addEventListener('click', () => {
      const saved = load();
      if (!saved) { toast('Không tìm thấy dữ liệu.', 'err'); return; }
      state = saved;
      Sfx.enabled = state.settings ? state.settings.sound !== false : true;
      showHub();
    });
    document.getElementById('btn-confirm-create').addEventListener('click', createCharacter);
    document.getElementById('input-name').addEventListener('keydown', (e) => { if (e.key === 'Enter') createCharacter(); });

    document.getElementById('btn-guide-title').addEventListener('click', openGuide);
    document.getElementById('btn-guide').addEventListener('click', openGuide);
    document.getElementById('btn-menu').addEventListener('click', openMenu);
    document.getElementById('btn-sound').addEventListener('click', () => {
      Sfx.toggle();
      if (state) { state.settings.sound = Sfx.enabled; save(); }
      toast('Âm thanh: ' + (Sfx.enabled ? 'bật' : 'tắt'));
    });
    document.getElementById('btn-sound-title').addEventListener('click', (e) => {
      Sfx.toggle();
      e.target.textContent = 'Âm thanh: ' + (Sfx.enabled ? 'Bật' : 'Tắt');
    });

    $$('.tab').forEach((t) => t.addEventListener('click', () => { Sfx.play('click'); switchPanel(t.dataset.panel); }));

    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') modalClose(); });
  }

  let inited = false;
  function init() {
    if (inited) return;
    inited = true;
    const saved = load();
    Sfx.enabled = saved && saved.settings ? saved.settings.sound !== false : true;
    bind();
    showTitle();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  return {
    get state() { return state; },
    modal, modalClose, confirm, toast, openItemPicker, consumeItem, showHub,
    statsFor, save
  };
})();
