/* =========================================================================
   Ninja Rebirth VN — art.js
   Toàn bộ hình ảnh nhân vật được vẽ bằng SVG ngay trong trình duyệt.
   Không dùng bất kỳ tài sản/hình ảnh nào từ bên ngoài dự án.
   ========================================================================= */
'use strict';

const Art = (function () {
  let uid = 0;

  function pct(hex, amt) {
    const n = parseInt(hex.replace('#', ''), 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const f = (c) => Math.max(0, Math.min(255, Math.round(amt > 0 ? c + (255 - c) * amt : c * (1 + amt))));
    return '#' + ((1 << 24) + (f(r) << 16) + (f(g) << 8) + f(b)).toString(16).slice(1);
  }

  /* ---------------- Tóc / mũ ---------------- */
  function hairBack(style, p) {
    switch (style) {
      case 'long':
        return `<path d="M48 104 Q40 40 100 30 Q160 40 152 104 L162 184 Q142 192 128 176 L124 106 Q100 92 76 106 L72 176 Q58 192 38 184 Z" fill="${p.hair}"/>
                <path d="M52 60 Q60 42 82 38" stroke="${p.hairHi}" stroke-width="3" fill="none" opacity=".45"/>
                <path d="M146 66 Q140 46 120 40" stroke="${p.hairHi}" stroke-width="2.5" fill="none" opacity=".35"/>`;
      case 'ponytail':
        return `<path d="M54 92 Q50 36 100 32 Q150 36 146 92 Z" fill="${p.hair}"/>
                <path d="M140 66 Q178 78 176 120 Q174 152 154 168 Q162 130 144 104 Z" fill="${p.hair}"/>
                <path d="M146 74 Q172 90 168 122" stroke="${p.hairHi}" stroke-width="3" fill="none" opacity=".5"/>`;
      case 'bob':
        return `<path d="M54 108 Q46 38 100 32 Q154 38 146 108 Q138 90 126 84 Q100 72 74 84 Q62 90 54 108 Z" fill="${p.hair}"/>`;
      case 'topknot':
        return `<path d="M54 94 Q50 36 100 32 Q150 36 146 94 Z" fill="${p.hair}"/>
                <ellipse cx="100" cy="26" rx="16" ry="14" fill="${p.hair}"/>
                <path d="M88 26 Q100 16 112 26" stroke="${p.hairHi}" stroke-width="2.4" fill="none" opacity=".6"/>`;
      case 'hood':
        return `<path d="M36 190 Q28 48 100 26 Q172 48 164 190 Q144 168 130 118 L70 118 Q56 168 36 190 Z" fill="${p.robeDeep}"/>
                <path d="M46 176 Q44 60 100 40 Q156 60 154 176" stroke="${p.robeHi}" stroke-width="2" fill="none" opacity=".5"/>
                <path d="M100 26 Q104 52 100 84" stroke="${p.robeHi}" stroke-width="1.4" opacity=".35" fill="none"/>`;
      case 'spike':
        return `<path d="M50 100 L54 58 L68 76 L74 38 L90 68 L100 28 L112 68 L126 40 L132 76 L146 58 L150 100 Z" fill="${p.hair}"/>
                <path d="M66 66 L74 50" stroke="${p.hairHi}" stroke-width="2.4" opacity=".5"/>`;
      default:
        return '';
    }
  }

  function hairFront(style, p) {
    if (style === 'none') return '';
    const shine = `<path d="M64 66 Q80 50 104 52" stroke="${p.hairHi}" stroke-width="3" fill="none" opacity=".5" stroke-linecap="round"/>`;
    switch (style) {
      case 'hood':
        return `<path d="M58 86 Q74 56 100 56 Q126 56 142 86 Q122 72 100 74 Q78 72 58 86 Z" fill="${p.robeDeep}"/>
                <path d="M62 84 Q66 62 100 58" stroke="${p.robeHi}" stroke-width="1.6" fill="none" opacity=".5"/>`;
      case 'spike':
        return `<path d="M56 88 L64 56 L76 78 L86 46 L100 76 L114 44 L126 76 L138 54 L146 88 Q122 68 100 68 Q78 68 56 88 Z" fill="${p.hair}"/>${shine}`;
      case 'topknot':
        return `<path d="M56 92 Q60 52 100 50 Q142 54 146 92 Q124 70 100 70 Q76 70 56 92 Z" fill="${p.hair}"/>
                <path d="M76 72 Q90 58 110 60" stroke="${p.hairHi}" stroke-width="2.6" fill="none" opacity=".55"/>`;
      case 'long':
      case 'ponytail':
        return `<path d="M54 92 Q58 50 100 46 Q142 50 146 92 Q132 70 112 68 Q106 84 96 70 Q76 72 54 92 Z" fill="${p.hair}"/>
                <path d="M56 96 Q52 128 58 154" stroke="${p.hair}" stroke-width="8" fill="none" stroke-linecap="round" opacity=".95"/>
                <path d="M144 96 Q148 128 142 154" stroke="${p.hair}" stroke-width="8" fill="none" stroke-linecap="round" opacity=".95"/>${shine}`;
      case 'bob':
        return `<path d="M54 96 Q56 50 100 46 Q144 50 146 96 Q132 72 100 74 Q68 72 54 96 Z" fill="${p.hair}"/>
                <path d="M56 98 Q54 118 58 132" stroke="${p.hair}" stroke-width="7" fill="none" stroke-linecap="round"/>
                <path d="M144 98 Q146 118 142 132" stroke="${p.hair}" stroke-width="7" fill="none" stroke-linecap="round"/>${shine}`;
      default:
        return '';
    }
  }

  /* ---------------- Vũ khí ---------------- */
  function weaponBack(kind, p) {
    if (kind === 'staff') {
      return `<g transform="translate(28 192) rotate(7)">
          <rect x="-3.5" y="-136" width="7" height="164" rx="3.5" fill="#6b5a48"/>
          <rect x="-3.5" y="-136" width="2.4" height="164" fill="#a08b72" opacity=".7"/>
          <circle cx="0" cy="-142" r="11" fill="${p.ec}" opacity=".9"/>
          <circle cx="0" cy="-142" r="11" fill="${pct(p.ec, 0.5)}" opacity=".6"/>
          <circle cx="0" cy="-142" r="19" fill="none" stroke="${p.ec}" stroke-width="1.6" opacity=".4"/>
          <circle cx="-3" cy="-145" r="4" fill="#fff" opacity=".6"/>
        </g>`;
    }
    if (kind === 'bow') {
      return `<g transform="translate(160 152)">
          <path d="M-4 -80 Q52 -26 -4 28" stroke="${p.ec}" stroke-width="4.5" fill="none" opacity=".95"/>
          <path d="M-4 -80 Q12 -26 -4 28" stroke="#eef4ff" stroke-width="1.2" fill="none" opacity=".65"/>
          <path d="M-4 -80 L-6 28" stroke="#dbe4f0" stroke-width="1" opacity=".35"/>
        </g>`;
    }
    if (kind === 'fan') {
      return `<g transform="translate(162 190) rotate(-16)">
          <path d="M0 0 L-74 -52 A86 86 0 0 1 -16 -84 Z" fill="${p.ec}" opacity=".28" stroke="${p.ec}" stroke-width="2.4"/>
          <path d="M0 0 L-74 -52 M0 0 L-52 -74 M0 0 L-20 -86" stroke="${p.ec}" stroke-width="1.6" opacity=".75"/>
          <rect x="-4" y="0" width="9" height="18" rx="3" fill="#2b2438"/>
        </g>`;
    }
    return '';
  }

  function weaponFront(kind, p) {
    if (kind === 'katana') {
      return `<g transform="translate(180 184) rotate(-12)">
          <rect x="-4" y="-96" width="8" height="100" rx="3" fill="#e6edf8" opacity=".95"/>
          <rect x="-4" y="-96" width="2.6" height="100" fill="#ffffff" opacity=".75"/>
          <path d="M4 -96 L4 4" stroke="${p.ec}" stroke-width="1.6" opacity=".8"/>
          <rect x="-9" y="3" width="18" height="5" rx="2.5" fill="${p.ec}"/>
          <rect x="-4" y="8" width="8" height="22" rx="3" fill="#241f31"/>
          <circle cx="0" cy="32" r="4.5" fill="none" stroke="${p.ec}" stroke-width="2"/>
        </g>`;
    }
    if (kind === 'kunai') {
      return `<g transform="translate(150 168) rotate(12)">
          <path d="M0 -30 L10 4 L0 16 L-10 4 Z" fill="#e6edf8"/>
          <rect x="-4.5" y="16" width="9" height="22" rx="2" fill="#241f31"/>
          <circle cx="0" cy="42" r="6" fill="none" stroke="#e6edf8" stroke-width="2"/>
        </g>`;
    }
    if (kind === 'claws') {
      return `<g transform="translate(166 176)" opacity=".95">
          <g filter="url(#glow${p.uid})">
            <path d="M4 6 Q26 -18 34 -52" stroke="${p.ec}" stroke-width="3.4" fill="none" stroke-linecap="round"/>
            <path d="M-8 12 Q16 -14 26 -54" stroke="${p.ec}" stroke-width="3.4" fill="none" stroke-linecap="round"/>
            <path d="M-20 16 Q4 -12 16 -56" stroke="${p.ec}" stroke-width="3.4" fill="none" stroke-linecap="round"/>
          </g>
          <path d="M-26 18 Q4 -6 12 -46" stroke="${p.ec}" stroke-width="6" opacity=".25" fill="none"/>
        </g>`;
    }
    return '';
  }

  /* ---------------- Mắt / mặt ---------------- */
  function eyes(p, opts) {
    const iris = opts.foe ? '#ff5566' : p.ec;
    const glowColor = opts.foe ? '#ff5566' : p.ec;
    const sharp = opts.eyeStyle === 'sharp';
    const soft = opts.eyeStyle === 'soft';
    const top = sharp ? 95 : soft ? 92 : 93;
    const bot = sharp ? 104 : soft ? 108.5 : 107.5;
    const one = (cx) => `
      <path d="M${cx - 11} 101 Q${cx} ${top} ${cx + 11} 101 Q${cx} ${bot} ${cx - 11} 101 Z" fill="#f6faff"/>
      <circle cx="${cx}" cy="100.5" r="${sharp ? 4.1 : 4.7}" fill="${iris}"/>
      <circle cx="${cx}" cy="100.5" r="2.2" fill="#0d0a14"/>
      <circle cx="${cx - 1.7}" cy="98.6" r="1.35" fill="#ffffff"/>
      <path d="M${cx - 12} 101 Q${cx} ${top - 1.4} ${cx + 12} 101" stroke="#170f1e" stroke-width="2" fill="none"/>
      <path d="M${cx - 11} ${sharp ? 87 : 89} Q${cx} ${sharp ? 90 : 85} ${cx + 11} ${sharp ? 91 : 89}" stroke="${p.hair}" stroke-width="3.2" stroke-linecap="round" fill="none"/>`;
    return `<g filter="url(#glow${p.uid})" opacity=".98">${one(84)}${one(116)}</g>
            <ellipse cx="84" cy="100" rx="16" ry="9" fill="${glowColor}" opacity=".12"/>
            <ellipse cx="116" cy="100" rx="16" ry="9" fill="${glowColor}" opacity=".12"/>`;
  }

  function maskShape(p, opts) {
    if (!opts.mask) {
      return `<path d="M94 128 Q100 132 106 128" stroke="#8d5f52" stroke-width="2" fill="none" stroke-linecap="round"/>
              <path d="M84 126 Q100 132 116 126" stroke="${p.skinShade}" stroke-width="1.2" fill="none" opacity=".4"/>`;
    }
    return `<path d="M60 104 Q100 116 140 104 L140 120 Q120 150 100 152 Q80 150 60 120 Z" fill="${p.mask}"/>
            <path d="M63 118 Q100 131 137 118" stroke="${p.maskHi}" stroke-width="1.6" fill="none" opacity=".6"/>
            <path d="M74 133 Q92 146 112 140" stroke="${p.maskHi}" stroke-width="1.2" fill="none" opacity=".4"/>
            <path d="M60 104 Q100 116 140 104" stroke="${p.ec}" stroke-width="1.4" fill="none" opacity=".55"/>`;
  }

  function beastHead(p, opts) {
    const fur = pct(opts.skin, -0.12);
    const dark = pct(opts.skin, -0.62);
    const mane = opts.dragon
      ? `<path d="M100 22 Q146 26 158 66 Q166 98 150 124 Q136 94 124 78 Q100 64 76 78 Q64 94 50 124 Q34 98 42 66 Q54 26 100 22 Z" fill="${dark}" opacity=".9"/>`
      : `<path d="M100 28 Q140 32 150 70 Q156 100 138 122 Q130 94 118 82 Q100 72 82 82 Q70 94 62 122 Q44 100 50 70 Q60 32 100 28 Z" fill="${dark}" opacity=".9"/>`;
    const horns = opts.dragon
      ? `<path d="M60 52 Q40 18 66 8 Q70 34 82 46 Z" fill="${p.ec}" opacity=".85"/>
         <path d="M140 52 Q160 18 134 8 Q130 34 118 46 Z" fill="${p.ec}" opacity=".85"/>`
      : `<path d="M58 60 Q46 26 70 26 Q68 46 78 58 Z" fill="${dark}"/>
         <path d="M142 60 Q154 26 130 26 Q132 46 122 58 Z" fill="${dark}"/>`;
    return `<g transform="translate(100 104) scale(.92) translate(-100 -104)">
      ${mane}
      ${horns}
      <ellipse cx="100" cy="102" rx="46" ry="42" fill="${fur}"/>
      <ellipse cx="100" cy="102" rx="46" ry="42" fill="url(#shadeB${p.uid})"/>
      <path d="M78 96 L92 104 L78 108 Z" fill="#0c0810" opacity=".5"/>
      <path d="M122 96 L108 104 L122 108 Z" fill="#0c0810" opacity=".5"/>
      <g filter="url(#glow${p.uid})">
        <path d="M70 98 Q82 88 94 98 Q82 106 70 98 Z" fill="${p.foeEye}"/>
        <path d="M106 98 Q118 88 130 98 Q118 106 106 98 Z" fill="${p.foeEye}"/>
      </g>
      <ellipse cx="100" cy="122" rx="24" ry="15" fill="${pct(fur, -0.2)}"/>
      <ellipse cx="92" cy="119" rx="3" ry="2.2" fill="#1a1020"/>
      <ellipse cx="108" cy="119" rx="3" ry="2.2" fill="#1a1020"/>
      <path d="M100 124 L100 132" stroke="#1a1020" stroke-width="1.6" opacity=".6"/>
      <path d="M86 134 Q100 142 114 134" stroke="#1a1020" stroke-width="2" fill="none" opacity=".7"/>
      <path d="M88 132 L92 143 L96 132 Z" fill="#f4f7ff" opacity=".9"/>
      <path d="M104 132 L108 143 L112 132 Z" fill="#f4f7ff" opacity=".9"/>
      <path d="M60 82 Q70 70 82 68 M140 82 Q130 70 118 68" stroke="${dark}" stroke-width="3" fill="none" opacity=".7"/>
      ${opts.dragon ? `<path d="M64 118 L74 116 M136 118 L126 116 M60 104 L70 104 M140 104 L130 104" stroke="${p.ec}" stroke-width="2" opacity=".5"/>` : ''}
    </g>`;
  }

  /* ---------------- Tổng hợp ---------------- */
  function build(spec) {
    const a = spec.art || {};
    const el = ELEMENTS[spec.element] || ELEMENTS.am;
    const o = {
      foe: !!a.foe,
      mask: a.mask !== undefined ? !!a.mask : false,
      beast: !!a.beast,
      dragon: !!a.dragon,
      bulk: !!a.bulk,
      skin: a.skin || '#f0d9c8',
      hair: a.hair || 'spike',
      weapon: a.weapon || 'katana',
      scarf: a.scarf !== undefined ? !!a.scarf : true,
      eyeStyle: a.eyeStyle || (spec.role === 'satthu' ? 'sharp' : spec.role === 'hotro' ? 'soft' : 'normal')
    };
    const id = 'a' + (++uid);
    const ec = el.color;
    const p = {
      uid: id,
      ec,
      ecSoft: pct(ec, -0.3),
      hair: o.foe ? '#161221' : '#1b1628',
      hairHi: pct(ec, 0.35),
      skin: o.skin,
      skinShade: pct(o.skin, -0.28),
      mask: o.foe ? '#221a30' : '#262238',
      maskHi: pct(ec, 0.1),
      robe: o.foe ? '#2a1c33' : '#282440',
      robeDeep: '#12101c',
      robeHi: pct(ec, -0.25),
      foeEye: '#ff5566'
    };

    const body = `
      <path d="M18 200 Q24 154 66 140 L100 132 L134 140 Q176 154 182 200 Z" fill="url(#robe${id})"/>
      ${o.bulk ? `<path d="M52 150 Q34 156 24 176 L52 186 Q62 166 80 156 Z" fill="${pct(ec, -0.45)}" opacity=".85"/>
                   <path d="M148 150 Q166 156 176 176 L148 186 Q138 166 120 156 Z" fill="${pct(ec, -0.45)}" opacity=".85"/>` : ''}
      <path d="M100 132 L100 200" stroke="${p.robeHi}" stroke-width="1.4" opacity=".4"/>
      <path d="M62 150 Q100 174 138 150" stroke="${ec}" stroke-width="2.2" opacity=".35" fill="none"/>
      <path d="M78 136 L100 156 L122 136" stroke="${ec}" stroke-width="2" opacity=".5" fill="none"/>
    `;

    const headBlock = o.beast ? beastHead(p, o) : `
      <rect x="92" y="118" width="16" height="26" rx="7" fill="url(#skin${id})"/>
      <ellipse cx="100" cy="96" rx="40" ry="44" fill="url(#skin${id})"/>
      <ellipse cx="61" cy="102" rx="5" ry="8" fill="${p.skinShade}"/>
      <ellipse cx="139" cy="102" rx="5" ry="8" fill="${p.skinShade}"/>
      <path d="M66 88 Q100 112 134 88 L134 84 Q100 104 66 84 Z" fill="#000" opacity=".12"/>
      ${hairFront(o.hair, p)}
      <g transform="rotate(-3 100 78)">
        <rect x="57" y="70" width="86" height="13" rx="3" fill="#2a2338"/>
        <rect x="57" y="70" width="86" height="3" rx="1.5" fill="${ec}" opacity=".9"/>
        <rect x="85" y="67" width="30" height="18" rx="3" fill="url(#metal${id})"/>
        <path d="M100 71 L105.5 77 L100 83 L94.5 77 Z" fill="${pct(ec, -0.1)}"/>
      </g>
      ${eyes(p, o)}
      ${maskShape(p, o)}
    `;

    return `<svg viewBox="0 0 200 200" role="img" aria-label="${escapeAttr(spec.name || '')}">
  <defs>
    <radialGradient id="bg${id}" cx="50%" cy="34%" r="74%">
      <stop offset="0" stop-color="${ec}" stop-opacity="${o.foe ? 0.22 : 0.36}"/>
      <stop offset="0.52" stop-color="#121627" stop-opacity="0.9"/>
      <stop offset="1" stop-color="#080a12"/>
    </radialGradient>
    <linearGradient id="skin${id}" x1="0.2" y1="0" x2="0.8" y2="1">
      <stop offset="0" stop-color="${pct(p.skin, 0.1)}"/>
      <stop offset="0.65" stop-color="${p.skin}"/>
      <stop offset="1" stop-color="${p.skinShade}"/>
    </linearGradient>
    <linearGradient id="robe${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${p.robe}"/>
      <stop offset="1" stop-color="${p.robeDeep}"/>
    </linearGradient>
    <linearGradient id="metal${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f2f6fc"/>
      <stop offset="0.55" stop-color="#a9b5c7"/>
      <stop offset="1" stop-color="#68727f"/>
    </linearGradient>
    <radialGradient id="shadeB${id}" cx="34%" cy="30%" r="78%">
      <stop offset="0" stop-color="#ffffff" stop-opacity=".16"/>
      <stop offset="1" stop-color="#000000" stop-opacity=".5"/>
    </radialGradient>
    <filter id="glow${id}" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="2.8" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <rect width="200" height="200" rx="16" fill="url(#bg${id})"/>
  <circle cx="100" cy="84" r="68" fill="none" stroke="${ec}" stroke-width="1" opacity=".25"/>
  <circle cx="100" cy="84" r="54" fill="none" stroke="${ec}" stroke-width="9" opacity=".05"/>
  <path d="M12 186 L58 132 M188 182 L148 134" stroke="${ec}" stroke-width="1.4" opacity=".16"/>

  ${hairBack(o.hair, p)}
  ${weaponBack(o.weapon, p)}

  ${body}
  ${o.scarf && !o.beast ? `<path d="M64 138 Q100 156 136 138 L144 151 Q100 174 56 151 Z" fill="${ec}" opacity=".9"/>
    <path d="M60 150 Q42 174 54 192 L70 188 Q58 172 72 156 Z" fill="${ec}" opacity=".7"/>` : ''}

  ${headBlock}
  ${weaponFront(o.weapon, p)}

  <rect x="3" y="3" width="194" height="194" rx="14" fill="none" stroke="${ec}" stroke-width="1.2" opacity=".32"/>
</svg>`;
  }

  function escapeAttr(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  return {
    portrait(spec) { return build(spec); },
    portraitForChar(id) { return build(CHAR_BY_ID[id]); },
    portraitForEnemy(key) { return build(ENEMIES[key]); },
    elementBadge(elId) {
      const e = ELEMENTS[elId] || ELEMENTS.am;
      return `<span class="el-badge" style="--el:${e.color}" title="${e.name}"><b>${e.sym}</b>${e.name}</span>`;
    },
    elementDot(elId) {
      const e = ELEMENTS[elId] || ELEMENTS.am;
      return `<span class="el-dot" style="background:${e.color}" title="${e.name}"></span>`;
    }
  };
})();
