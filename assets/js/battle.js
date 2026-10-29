/* =========================================================================
   Ninja Rebirth VN — battle.js
   Hệ thống chiến đấu theo lượt dựa trên thanh tốc độ (ATB), kỹ năng,
   hiệu ứng, bí kỹ và AI.
   ========================================================================= */
'use strict';

const Battle = (function () {
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  let S = null;          // trạng thái trận đấu
  let runId = 0;         // mỗi trận một mã, tránh 2 vòng lặp cùng chạy
  let ui = {};           // tham chiếu DOM từng đơn vị
  let speed = 1;
  let auto = false;
  let destroyed = false;

  const wait = (ms) => new Promise((r) => setTimeout(r, ms / speed));

  /* ---------------- chỉ số ---------------- */
  function statOf(u, key) {
    let v = u.stats[key] || 0;
    for (const e of u.effects) if (e.k === 'mod' && e.stat === key) v *= e.mul;
    if (key === 'spd') v = Math.max(12, v);
    return v;
  }

  function aliveOf(side) {
    return S.units.filter((u) => u.side === side && u.alive);
  }

  /* ---------------- dựng đơn vị ---------------- */
  function makeUnit(spec, side, index) {
    const skills = spec.skills.map((id) => SKILLS[id]).filter(Boolean);
    const ult = spec.ult ? SKILLS[spec.ult] : null;
    const hp = Math.round(spec.stats.hp);
    return {
      uid: side + index + '_' + Math.random().toString(36).slice(2, 7),
      side,
      index,
      name: spec.name,
      element: spec.element,
      role: spec.role || 'cong',
      level: spec.level,
      boss: !!spec.boss,
      portrait: spec.portrait,
      skills,
      ult,
      stats: { ...spec.stats },
      maxHp: hp,
      hp,
      chakra: side === 'ally' ? 45 : 30,
      maxChakra: 100,
      nou: 0,
      shield: 0,
      gauge: Math.random() * 120,
      effects: [],
      alive: true
    };
  }

  /* ---------------- sát thương ---------------- */
  function computeDamage(attacker, defender, skill) {
    const atk = statOf(attacker, 'atk') * (skill.power || 1);
    const def = statOf(defender, 'def') * (1 - (skill.ignoreDef || 0));
    let dmg = atk * 1.35 - def * 0.7;
    const elem = DataUtil.advantage(skill.element || attacker.element, defender.element);
    dmg *= elem;
    dmg *= 0.92 + Math.random() * 0.16;
    const critChance = statOf(attacker, 'crit') + (skill.crit || 0);
    const crit = Math.random() * 100 < critChance;
    if (crit) dmg *= 1.7;
    return { dmg: Math.max(1, Math.round(dmg)), crit, elem };
  }

  function takeDamage(target, amount) {
    let left = amount;
    if (target.shield > 0) {
      const absorbed = Math.min(target.shield, left);
      target.shield -= absorbed;
      left -= absorbed;
      if (target.shield <= 0) target.effects = target.effects.filter((e) => e.k !== 'shield');
    }
    target.hp = Math.max(0, target.hp - left);
    target.chakra = Math.min(target.maxChakra, target.chakra + 8);
    target.nou = Math.min(100, target.nou + 8);
    if (target.hp <= 0) killUnit(target);
  }

  function killUnit(u) {
    if (!u.alive) return;
    if (S.onEvent) S.onEvent('kill', 1);
    const r = ui[u.uid];
    if (r) { const c = FX.centerOf(r.node); FX.burst(c.x, c.y, '#ff5b6e', { count: 24, speed: 4.4, size: 4 }); }
    u.alive = false;
    u.hp = 0;
    u.shield = 0;
    u.effects = [];
    log(`<b>${u.name}</b> đã gục ngã.`, 'log-bad');
    if (u.side === 'ally') S.units.filter((x) => x.side === 'ally' && x.alive).forEach((x) => { x.nou = Math.min(100, x.nou + 12); });
  }

  function healUnit(u, amount) {
    const before = u.hp;
    u.hp = Math.min(u.maxHp, u.hp + amount);
    return u.hp - before;
  }

  /* ---------------- hiệu ứng ---------------- */
  function applyEffect(target, eff, source) {
    if (!target.alive) return;
    if (eff.chance !== undefined && eff.chance < 100 && Math.random() * 100 > eff.chance) return;
    if (eff.k === 'purify') {
      target.effects = target.effects.filter((e) => e.k === 'shield' || e.k === 'regen');
      return;
    }
    if (eff.k === 'stun') {
      const exist = target.effects.find((e) => e.k === 'stun');
      if (exist) exist.turns = Math.max(exist.turns, eff.turns || 1);
      else target.effects.push({ k: 'stun', name: eff.name || 'Choáng', turns: eff.turns || 1, bad: true });
      return;
    }
    if (eff.k === 'shield') {
      target.shield += Math.round(statOf(source, 'atk') * (eff.mul || 1));
      target.effects.push({ k: 'shield', name: 'Khiên', turns: eff.turns || 2, bad: false });
      return;
    }
    if (eff.k === 'dot') {
      target.effects.push({
        k: 'dot', name: eff.name || 'Độc', turns: eff.turns || 2, bad: true,
        element: eff.element || source.element,
        dmg: Math.round(statOf(source, 'atk') * (eff.mul || 0.35))
      });
      return;
    }
    if (eff.k === 'regen') {
      target.effects.push({ k: 'regen', name: 'Hồi Phục', turns: eff.turns || 3, bad: false, heal: Math.round(statOf(source, 'atk') * (eff.mul || 0.4)) });
      return;
    }
    if (eff.k === 'mod') {
      target.effects.push({ k: 'mod', stat: eff.stat, mul: eff.mul, name: eff.name || eff.stat, turns: eff.turns || 2, bad: eff.mul < 1 });
    }
  }

  /* ---------------- giao diện ---------------- */
  function log(html, cls) {
    const box = $('battle-log');
    if (!box) return;
    const p = document.createElement('p');
    p.innerHTML = html;
    if (cls) p.className = cls;
    box.appendChild(p);
    while (box.childElementCount > 60) box.removeChild(box.firstChild);
    box.scrollTop = box.scrollHeight;
  }

  function buildField() {
    ['ally', 'enemy'].forEach((side) => {
      const host = $(side === 'ally' ? 'side-ally' : 'side-enemy');
      host.innerHTML = '';
      S.units.filter((u) => u.side === side).forEach((u) => {
        const node = document.createElement('div');
        node.className = 'unit';
        node.dataset.uid = u.uid;
        node.innerHTML = `
          <div class="unit-art">${u.portrait}<span class="unit-lv">Lv ${u.level}</span></div>
          <div class="unit-name" title="${u.name}">${u.name}</div>
          <div class="unit-bars">
            <div class="bar hp"><i></i></div>
            <div class="bar ch"><i></i></div>
            <div class="bar nou"><i></i></div>
            <div class="bar gauge"><i></i></div>
          </div>
          <div class="bar-num"></div>
          <div class="unit-statuses"></div>`;
        node.addEventListener('click', () => onUnitClick(u));
        host.appendChild(node);
        ui[u.uid] = {
          node,
          hp: node.querySelector('.bar.hp'),
          hpFill: node.querySelector('.bar.hp > i'),
          chFill: node.querySelector('.bar.ch > i'),
          nouFill: node.querySelector('.bar.nou > i'),
          num: node.querySelector('.bar-num'),
          gaugeFill: node.querySelector('.bar.gauge > i'),
          statuses: node.querySelector('.unit-statuses')
        };
      });
    });
    syncAll();
  }

  function syncUnit(u) {
    const r = ui[u.uid];
    if (!r) return;
    const pctHp = clamp((u.hp / u.maxHp) * 100, 0, 100);
    r.hpFill.style.width = pctHp + '%';
    r.hp.classList.toggle('is-hurt', pctHp <= 60 && pctHp > 30);
    r.hp.classList.toggle('is-low', pctHp <= 30);
    r.chFill.style.width = (u.chakra / u.maxChakra) * 100 + '%';
    r.nouFill.style.width = u.nou + '%';
    if (r.gaugeFill) r.gaugeFill.style.width = clamp(u.gauge / 10, 0, 100) + '%';
    r.num.textContent = `${Math.max(0, Math.round(u.hp))}/${Math.round(u.maxHp)}`;
    r.node.classList.toggle('is-dead', !u.alive);
    r.node.classList.toggle('is-active', S.activeUid === u.uid && u.alive);

    const chips = [];
    u.effects.forEach((e) => {
      const t = e.turns !== undefined ? ` ${e.turns}` : '';
      chips.push(`<span class="status ${e.bad ? 'bad' : 'good'}">${e.name}${t}</span>`);
    });
    if (u.shield > 0) chips.push(`<span class="status good">Khiên ${Math.round(u.shield)}</span>`);
    r.statuses.innerHTML = chips.join('');
  }

  function syncAll() {
    S.units.forEach(syncUnit);
  }

  function pop(u, text, cls) {
    const r = ui[u.uid];
    if (!r) return;
    const stacked = r.node.querySelectorAll('.dmg-pop').length;
    const span = document.createElement('span');
    span.className = 'dmg-pop ' + (cls || '');
    span.style.top = (30 + Math.min(stacked, 3) * 12) + '%';
    span.style.marginLeft = (stacked % 2 ? 22 : -10) + 'px';
    span.textContent = text;
    r.node.appendChild(span);
    setTimeout(() => span.remove(), 1000);
    if (cls !== 'heal' && cls !== 'miss') {
      r.node.classList.remove('is-hit');
      void r.node.offsetWidth;
      r.node.classList.add('is-hit');
      setTimeout(() => r.node.classList.remove('is-hit'), 340);
    }
  }

  function flashSkill(text) {
    const host = $('battle-field');
    if (!host) return;
    const el = document.createElement('div');
    el.className = 'skill-cast';
    el.textContent = text;
    host.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }

  function setHint(text) {
    const bar = $('action-bar');
    if (!bar) return;
    let h = bar.querySelector('.action-hint');
    if (!h) {
      h = document.createElement('div');
      h.className = 'action-hint';
      bar.appendChild(h);
    }
    h.textContent = text || '';
  }

  function renderActions(actor) {
    const bar = $('action-bar');
    bar.innerHTML = '';
    if (!actor) {
      bar.innerHTML = `<div class="action-hint">Đang diễn ra trận đấu…</div>`;
      return;
    }
    const list = [...actor.skills];
    if (actor.ult) list.push(actor.ult);

    list.forEach((sk) => {
      const isUlt = !!sk.ult;
      const cost = isUlt ? 0 : sk.cost || 0;
      const canUse = isUlt ? actor.nou >= 100 : actor.chakra >= cost;
      const btn = document.createElement('button');
      btn.className = 'skill-btn' + (isUlt ? ' is-ult' : '');
      btn.disabled = !canUse || !!(S.pending && S.pending.lockSkill);
      btn.innerHTML = `
        <span class="s-name">${sk.name}</span>
        <span class="s-meta">${Art.elementDot(sk.element || actor.element)}
          ${isUlt ? '<span class="tag gold">Nộ 100</span>' : `<span>${cost} chakra</span>`}
          ${sk.target === 'all' ? '<span>· toàn hàng</span>' : ''}
        </span>`;
      btn.title = sk.desc || '';
      btn.addEventListener('click', () => onSkillClick(actor, sk));
      bar.appendChild(btn);
    });

    const itemBtn = document.createElement('button');
    itemBtn.className = 'btn btn-ghost item-btn';
    const stock = S.items.reduce((n, i) => n + i.count, 0);
    itemBtn.textContent = stock > 0 ? `Vật phẩm (${stock})` : 'Vật phẩm';
    itemBtn.disabled = stock === 0;
    itemBtn.addEventListener('click', onItemClick);
    bar.appendChild(itemBtn);

    const hint = document.createElement('div');
    hint.className = 'action-hint';
    hint.textContent = S.pending && S.pending.mode === 'target'
      ? (S.pending.skill.target === 'ally' ? 'Chọn đồng đội để hồi phục' : 'Chọn mục tiêu địch')
      : `Đến lượt ${actor.name} — chọn kỹ năng`;
    bar.appendChild(hint);
  }

  function highlightTargets(actor, skill) {
    clearHighlights();
    if (!skill) return;
    const wantAlly = skill.target === 'ally';
    const pool = skill.target === 'dead' ? S.units.filter((u) => u.side === 'ally' && !u.alive) : S.units.filter((u) => u.side === (wantAlly ? 'ally' : 'enemy') && u.alive);
    pool.forEach((u) => ui[u.uid]?.node.classList.add('is-targetable'));
  }

  function clearHighlights() {
    document.querySelectorAll('.unit.is-targetable').forEach((n) => n.classList.remove('is-targetable'));
  }

  /* ---------------- chọn hành động ---------------- */
  function onUnitClick(u) {
    const p = S.pending;
    if (!p || p.mode !== 'target') return;
    const sk = p.skill;
    if (sk) {
      const wantAlly = sk.target === 'ally';
      if (sk.target === 'dead') { if (u.side !== 'ally' || u.alive) return; }
      else if (wantAlly ? (u.side !== 'ally' || !u.alive) : (u.side !== 'enemy' || !u.alive)) return;
    }
    resolveTurn({ skill: sk, target: u });
  }

  function onSkillClick(actor, sk) {
    const p = S.pending;
    if (!p) return;
    // đang chọn mục tiêu mà bấm kỹ năng khác => huỷ chọn, chọn lại từ đầu
    if (p.mode === 'target' || p.mode === 'item-target') {
      p.mode = 'select';
      p.skill = null;
      clearHighlights();
    }
    if (p.mode !== 'select') return;
    if (sk.ult && actor.nou < 100) return;
    if (!sk.ult && actor.chakra < (sk.cost || 0)) return;
    const needsTarget = sk.target === 'one' || sk.target === 'ally' || sk.target === 'dead';
    if (!needsTarget) { resolveTurn({ skill: sk }); return; }
    if (sk.target === 'one' && aliveOf('enemy').length === 1) { resolveTurn({ skill: sk, target: aliveOf('enemy')[0] }); return; }
    if (sk.target === 'ally' && aliveOf('ally').length === 1) { resolveTurn({ skill: sk, target: aliveOf('ally')[0] }); return; }
    p.mode = 'target';
    p.skill = sk;
    p.lockSkill = false;
    highlightTargets(actor, sk);
    renderActions(actor);
  }

  function onItemClick() {
    const p = S.pending;
    if (!p || p.mode !== 'select') return;
    const items = S.items.filter((i) => i.count > 0);
    if (!items.length) { log('Bạn không còn vật phẩm nào.', 'log-sys'); return; }
    Game.openItemPicker(items, (item) => {
      Game.modalClose();
      if (item.target === 'ally' || item.target === 'allies') {
        const p2 = S.pending;
        if (!p2) return;
        p2.mode = 'item-target';
        p2.item = item;
        clearHighlights();
        const pool = item.target === 'allies' ? S.units.filter((u) => u.side === 'ally' && u.alive) : S.units.filter((u) => u.side === 'ally' && u.alive);
        pool.forEach((u) => ui[u.uid]?.node.classList.add('is-targetable'));
        if (item.target === 'allies' || pool.length === 1) resolveTurn({ item, target: pool[0] });
        else setHint('Chọn đồng đội để dùng ' + item.name);
        return;
      }
      resolveTurn({ item, target: null });
    });
  }

  function resolveTurn(value) {
    const p = S.pending;
    if (!p) return;
    S.pending = null;
    clearHighlights();
    p.resolve(value);
  }

  function playerTurn(actor) {
    return new Promise((resolve) => {
      S.pending = { actor, resolve, mode: 'select', skill: null, lockSkill: false };
      renderActions(actor);
    });
  }

  /* ---------------- AI ---------------- */
  function aiChoose(actor) {
    const foes = aliveOf(actor.side === 'ally' ? 'enemy' : 'ally');
    const friends = aliveOf(actor.side);
    if (!foes.length) return null;

    if (actor.ult && actor.nou >= 100) {
      if (actor.ult.target === 'all' || foes.length > 1 || Math.random() < 0.7) {
        return { skill: actor.ult, target: pickTarget(actor.ult, actor, foes, friends) };
      }
    }
    const usable = actor.skills.filter((s) => (s.cost || 0) <= actor.chakra);
    const heals = usable.filter((s) => s.heal || s.target === 'allies' && s.heal);
    const wounded = friends.filter((f) => f.hp / f.maxHp < 0.55);

    if (heals.length && wounded.length) {
      const heal = heals[Math.floor(Math.random() * heals.length)];
      return { skill: heal, target: pickTarget(heal, actor, foes, friends) };
    }
    const attacks = usable.filter((s) => !s.heal);
    const pool = attacks.length ? attacks : usable;
    const sk = pool[Math.floor(Math.random() * pool.length)];
    return { skill: sk, target: pickTarget(sk, actor, foes, friends) };
  }

  function pickTarget(skill, actor, foes, friends) {
    if (!skill) return foes[0];
    if (skill.target === 'self') return actor;
    if (skill.target === 'allies') return friends[0];
    if (skill.target === 'ally') {
      const sorted = [...friends].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
      return sorted[0];
    }
    const sorted = [...foes].sort((a, b) => a.hp - b.hp);
    return Math.random() < 0.55 ? sorted[0] : sorted[Math.floor(Math.random() * sorted.length)];
  }

  /* ---------------- thực thi ---------------- */
  async function doSkill(actor, skill, target) {
    const foes = aliveOf(actor.side === 'ally' ? 'enemy' : 'ally');
    const friends = aliveOf(actor.side);
    if (!foes.length) return;

    const elId = skill.element || actor.element;
    const color = (ELEMENTS[elId] || ELEMENTS.am).color;
    const actorNode = ui[actor.uid] ? ui[actor.uid].node : null;

    if (skill.ult) {
      actor.nou = 0;
      S.onEvent('ult', 1);
      flashSkill(skill.name);
      FX.ultimate(actorNode, color);
      FX.shake(document.getElementById('battle-field'), true);
      Sfx.play('ult');
      await wait(430);
    } else {
      actor.chakra -= skill.cost || 0;
      FX.cast(actorNode, color);
    }

    if (skill.selfHpCost) {
      const cost = Math.round(actor.maxHp * skill.selfHpCost);
      actor.hp = Math.max(1, actor.hp - cost);
      pop(actor, `-${cost}`, 'miss');
    }

    log(`<b>${actor.name}</b> dùng <b>${skill.name}</b>.`);

    const isSupport = skill.target === 'allies' || skill.target === 'ally' || skill.target === 'self';

    /* ---- kỹ năng hỗ trợ: hồi máu / tẩy hiệu ứng ---- */
    if (skill.heal && isSupport) {
      const targets = skill.target === 'allies'
        ? friends
        : skill.target === 'self'
          ? [actor]
          : [target && target.side === actor.side && target.alive ? target : friends[0]];
      const amount = Math.round(statOf(actor, 'atk') * skill.heal);
      FX.cast(actorNode, '#7ef0b0');
      for (const t of targets) {
        if (!t || !t.alive) continue;
        const got = healUnit(t, amount);
        pop(t, `+${got}`, 'heal');
        FX.healFx(ui[t.uid] ? ui[t.uid].node : null);
        syncUnit(t);
        Sfx.play('heal');
        await wait(150);
      }
      if (skill.fx) {
        for (const t of targets) for (const eff of skill.fx) applyEffect(t, eff, actor);
      }
      syncAll();
      await wait(160);
      return;
    }

    /* ---- kỹ năng tấn công ---- */
    const hits = skill.hits || 1;
    const ranged = ['thuy', 'loi', 'phong', 'am', 'moc'].indexOf(elId) >= 0;

    for (let i = 0; i < hits; i++) {
      let list;
      if (skill.target === 'all') list = foes;
      else if (skill.target === 'rand') list = [foes[Math.floor(Math.random() * foes.length)]];
      else list = [target && target.alive && target.side !== actor.side ? target : foes[0]];
      if (!list.length) break;

      for (const t of list) {
        if (!t || !t.alive) continue;
        const targetNode = ui[t.uid] ? ui[t.uid].node : null;
        FX.lunge(actorNode, actor.side === 'ally' ? 'up' : 'down');
        if (ranged) await FX.shoot(actorNode, targetNode, color, { dur: 0.2 });
        else { FX.slash(actorNode, targetNode, color); await wait(110); }

        const { dmg, crit, elem } = computeDamage(actor, t, skill);
        takeDamage(t, dmg);
        FX.hit(targetNode, color, { crit });
        Sfx.play(crit ? 'crit' : 'hit');
        pop(t, (crit ? '✦ ' : '') + dmg, crit ? 'crit' : '');
        syncUnit(t);
        if (elem > 1) pop(t, 'Khắc hệ', 'elem');
        if (skill.lifesteal) {
          const got = healUnit(actor, Math.round(dmg * skill.lifesteal));
          if (got > 0) { pop(actor, `+${got}`, 'heal'); FX.healFx(actorNode); }
        }
        await wait(95);
      }
      if (hits > 1) await wait(110);
    }
    syncAll();

    /* ---- đòn đánh kèm hồi máu cho đồng đội yếu nhất (Mộc Tiễn) ---- */
    if (skill.heal && !isSupport) {
      const low = [...friends].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
      if (low && low.alive) {
        const got = healUnit(low, Math.round(statOf(actor, 'atk') * skill.heal));
        if (got > 0) {
          pop(low, `+${got}`, 'heal');
          FX.healFx(ui[low.uid] ? ui[low.uid].node : null);
          syncUnit(low);
        }
      }
    }

    if (skill.fx) {
      const fxTargets = skill.target === 'self'
        ? [actor]
        : skill.target === 'all' || skill.target === 'rand'
          ? foes
          : skill.target === 'allies' || skill.target === 'ally'
            ? friends
            : [target];
      for (const t of fxTargets) {
        if (!t || !t.alive) continue;
        for (const eff of skill.fx) applyEffect(t, eff, actor);
      }
      syncAll();
      await wait(110);
    }
    await wait(150);
  }

  async function doItem(actor, item, target) {
    Game.consumeItem(item.id);
    S.onEvent('item', 1);
    FX.cast(ui[actor.uid] ? ui[actor.uid].node : null, '#7ef0b0');
    const stock = S.items.find((i) => i.id === item.id);
    if (stock) stock.count = Math.max(0, stock.count - 1);
    log(`<b>${actor.name}</b> dùng <b>${item.name}</b>.`, 'log-sys');
    const allies = aliveOf(actor.side);
    if (item.kind === 'heal') {
      const t = target && target.alive ? target : allies.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
      if (t) { const got = healUnit(t, Math.round(t.maxHp * item.value)); pop(t, `+${got}`, 'heal'); FX.healFx(ui[t.uid] ? ui[t.uid].node : null); syncUnit(t); }
    } else if (item.kind === 'chakra') {
      const t = target && target.alive ? target : actor;
      t.chakra = Math.min(t.maxChakra, t.chakra + item.value);
      pop(t, `+${item.value} CK`, 'heal');
      syncUnit(t);
    } else if (item.kind === 'revive') {
      const dead = S.units.find((u) => u.side === 'ally' && !u.alive);
      if (dead) {
        dead.alive = true;
        dead.hp = Math.round(dead.maxHp * 0.4);
        dead.effects = [];
        log(`<b>${dead.name}</b> được hồi sinh!`, 'log-heal');
        pop(dead, 'Hồi sinh', 'heal');
        syncAll();
      } else {
        const t = allies[0];
        if (t) { const got = healUnit(t, Math.round(t.maxHp * 0.3)); pop(t, `+${got}`, 'heal'); syncUnit(t); }
      }
    } else if (item.kind === 'buff') {
      allies.forEach((a) => item.fx.forEach((e) => applyEffect(a, e, actor)));
      syncAll();
    } else if (item.kind === 'purify') {
      allies.forEach((a) => { a.effects = a.effects.filter((e) => !e.bad); });
      syncAll();
    }
    await wait(320);
  }

  async function beginTurn(actor) {
    // hiệu ứng theo thời gian
    const dots = actor.effects.filter((e) => e.k === 'dot');
    for (const d of dots) {
      if (!actor.alive) break;
      takeDamage(actor, d.dmg);
      pop(actor, `-${d.dmg}`, 'miss');
      log(`<b>${actor.name}</b> chịu ${d.dmg} sát thương từ <b>${d.name}</b>.`, 'log-bad');
      syncUnit(actor);
      await wait(240);
    }
    const regens = actor.effects.filter((e) => e.k === 'regen');
    for (const r of regens) {
      if (!actor.alive) break;
      const got = healUnit(actor, r.heal);
      pop(actor, `+${got}`, 'heal');
      syncUnit(actor);
      await wait(180);
    }
    const stun = actor.effects.find((e) => e.k === 'stun');
    if (stun && actor.alive) {
      log(`<b>${actor.name}</b> bị ${stun.name} và mất lượt.`, 'log-bad');
      pop(actor, stun.name, 'miss');
      stun.turns -= 1;
      actor.effects = actor.effects.filter((e) => !(e.k === 'stun' && e.turns <= 0));
      await wait(360);
      return false;
    }
    return true;
  }

  function endTurn(actor) {
    actor.chakra = Math.min(actor.maxChakra, actor.chakra + 16);
    actor.nou = Math.min(100, actor.nou + 14);
    actor.effects.forEach((e) => { if (e.turns !== undefined) e.turns -= 1; });
    actor.effects = actor.effects.filter((e) => e.turns === undefined || e.turns > 0);
    if (actor.shield <= 0) actor.effects = actor.effects.filter((e) => e.k !== 'shield');
    syncUnit(actor);
  }

  function nextActor() {
    const alive = S.units.filter((u) => u.alive);
    let best = Infinity, chosen = null;
    for (const u of alive) {
      const need = (1000 - u.gauge) / Math.max(12, statOf(u, 'spd'));
      if (need < best - 1e-9) { best = need; chosen = u; }
    }
    if (!chosen) return null;
    for (const u of alive) u.gauge = Math.min(1000, u.gauge + Math.max(12, statOf(u, 'spd')) * best);
    chosen.gauge = 0;
    return chosen;
  }

  function checkEnd() {
    if (!aliveOf('enemy').length) return 'win';
    if (!aliveOf('ally').length) return 'lose';
    return null;
  }

  /* ---------------- vòng lặp ---------------- */
  async function loop(myRun) {
    S.turn = 0;
    while (!destroyed && myRun === runId) {
      const end = checkEnd();
      if (end) return end;
      const actor = nextActor();
      if (!actor) return 'lose';
      S.activeUid = actor.uid;
      S.turn++;
      syncAll();
      const canAct = await beginTurn(actor);
      if (destroyed) return null;
      if (!actor.alive) { endTurn(actor); continue; }
      if (!canAct) { endTurn(actor); continue; }
      S.activeUid = actor.uid;
      syncAll();

      let choice = null;
      if (actor.side === 'enemy' || auto) {
        await wait(340);
        choice = aiChoose(actor);
      } else {
        choice = await playerTurn(actor);
        if (myRun !== runId) return null;
        renderActions(null);
      }
      if (destroyed) return null;
      if (!choice) { endTurn(actor); continue; }

      if (choice.item) await doItem(actor, choice.item, choice.target);
      else if (choice.skill) await doSkill(actor, choice.skill, choice.target);

      endTurn(actor);
      S.activeUid = null;
      syncAll();
      const done = checkEnd();
      if (done) return done;
    }
    return null;
  }

  /* ---------------- API ---------------- */
  function start(config) {
    destroyed = false;
    const myRun = ++runId;
    speed = 1;
    auto = false;
    ui = {};
    const allies = config.allies.map((a, i) => makeUnit(a, 'ally', i));
    const enemies = config.enemies.map((e, i) => makeUnit(e, 'enemy', i));
    S = {
      title: config.title,
      kicker: config.kicker || 'Nhiệm vụ',
      units: [...enemies, ...allies],
      items: config.items || [],
      onEvent: config.onEvent || function () {},
      pending: null,
      activeUid: null,
      turn: 0
    };
    $('battle-title').textContent = config.title;
    $('battle-kicker').textContent = config.kicker || 'Nhiệm vụ';
    $('wave-label').textContent = config.subtitle || '';
    $('battle-log').innerHTML = '';
    $('btn-auto').textContent = 'Tự động: Tắt';
    $('btn-auto').classList.remove('is-on');
    $('btn-speed').textContent = 'Tốc độ: ×1';

    FX.clear();
    buildField();
    renderActions(null);
    $('screen-hub').classList.remove('is-active');
    $('screen-battle').classList.add('is-active');
    window.scrollTo(0, 0);

    log(`<span class="log-sys">${config.intro || 'Trận chiến bắt đầu!'}</span>`);
    setTimeout(() => {
      S.units.forEach((u) => {
        const r = ui[u.uid];
        if (!r) return;
        const c = FX.centerOf(r.node);
        FX.burst(c.x, c.y, (ELEMENTS[u.element] || ELEMENTS.am).color, { count: 6, speed: 1.4, up: 1.4, gravity: -0.01 });
      });
    }, 120);
    if (enemies.some((e) => e.boss)) log('Kẻ địch mạnh xuất hiện — hãy cẩn thận.', 'log-sys');

    loop(myRun)
      .then((result) => {
        if (destroyed || myRun !== runId || !result) return;
        finish(result, config);
      })
      .catch((err) => {
        console.error('Lỗi vòng lặp chiến đấu:', err);
        if (config.onError) config.onError(err);
      });
  }

  async function finish(result, config) {
    S.pending = null;
    renderActions(null);
    const win = result === 'win';
    flashSkill(win ? 'CHIẾN THẮNG' : 'THẤT BẠI');
    log(win ? '<span class="log-sys">Toàn bộ kẻ địch đã bị đánh bại!</span>' : '<span class="log-bad">Đội hình của bạn đã thất thủ…</span>');
    await wait(700);
    if (destroyed) return;
    config.onEnd && config.onEnd(win);
  }

  /* ---------------- điều khiển ---------------- */
  let controlsBound = false;
  function bindControls() {
    if (controlsBound) return;
    controlsBound = true;
    const autoBtn = $('btn-auto');
    if (autoBtn) autoBtn.addEventListener('click', () => {
      auto = !auto;
      autoBtn.textContent = 'Tự động: ' + (auto ? 'Bật' : 'Tắt');
      autoBtn.classList.toggle('is-on', auto);
      if (auto && S && S.pending) resolveTurn(aiChoose(S.pending.actor));
      else if (S && S.pending) renderActions(S.pending.actor);
    });

    const speedBtn = $('btn-speed');
    if (speedBtn) speedBtn.addEventListener('click', () => {
      speed = speed === 1 ? 2 : 1;
      speedBtn.textContent = 'Tốc độ: ×' + speed;
      speedBtn.classList.toggle('is-on', speed === 2);
    });

    const fleeBtn = $('btn-flee');
    if (fleeBtn) fleeBtn.addEventListener('click', () => {
      if (!S) return;
      Game.confirm('Rút lui khỏi trận này?', 'Bạn sẽ không nhận được thưởng.', () => {
        destroyed = true;
        Game.modalClose();
        Game.showHub();
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindControls);
  else bindControls();

  return {
    start,
    stop() { destroyed = true; runId++; S = null; FX.clear(); },
    get auto() { return auto; },
    get state() { return S; }
  };
})();
