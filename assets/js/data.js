/* =========================================================================
   Ninja Rebirth VN — data.js
   Toàn bộ nội dung: nguyên tố, nhẫn giả, kỹ năng, trang bị, vật phẩm,
   kẻ địch, chương hồi và đấu trường. Nhân vật & tên gọi đều là sáng tác
   gốc của dự án, không sử dụng tài sản của bất kỳ trò chơi nào khác.
   ========================================================================= */
'use strict';

/* ---------- Ngũ hành (vòng khắc chế) ---------- */
const ELEMENTS = {
  hoa:   { id: 'hoa', sym: '▲',   name: 'Hỏa',   glyph: '火', color: '#ff6b3d', beats: 'phong', note: 'Bỏng rát, sát thương duy trì' },
  phong: { id: 'phong', sym: '◈', name: 'Phong', glyph: '風', color: '#34d399', beats: 'loi',   note: 'Nhanh, đánh nhiều đòn' },
  loi:   { id: 'loi', sym: '◆',   name: 'Lôi',   glyph: '雷', color: '#facc15', beats: 'thuy',  note: 'Bạo kích, chớp giật' },
  thuy:  { id: 'thuy', sym: '●',  name: 'Thủy',  glyph: '水', color: '#38bdf8', beats: 'tho',   note: 'Khống chế, làm chậm' },
  tho:   { id: 'tho', sym: '■',   name: 'Thổ',   glyph: '土', color: '#c08457', beats: 'moc',   note: 'Phòng ngự, khiên đá' },
  moc:   { id: 'moc', sym: '▼',   name: 'Mộc',   glyph: '木', color: '#a3e635', beats: 'hoa',   note: 'Hồi phục, sinh lực' },
  am:    { id: 'am', sym: '▣',    name: 'Ám',    glyph: '闇', color: '#c084fc', beats: null,    note: 'Hút máu, không bị khắc' }
};
const ELEMENT_ORDER = ['hoa', 'phong', 'loi', 'thuy', 'tho', 'moc', 'am'];

const ROLES = {
  phap:   { name: 'Pháp Công', note: 'Sát thương diện rộng' },
  cong:   { name: 'Công Kích', note: 'Sát thương đơn mục tiêu' },
  satthu: { name: 'Sát Thủ',   note: 'Nhanh, bạo kích cao' },
  thu:    { name: 'Phòng Thủ', note: 'Trụ tuyến, tạo khiên' },
  hotro:  { name: 'Hỗ Trợ',    note: 'Hồi máu, giải hiệu ứng' },
  xathu:  { name: 'Xạ Thủ',    note: 'Bắn nhiều phát' }
};

/* ---------- Kỹ năng ----------
   target: one | all | rand | ally | allies | self
   fx[].k: dot | mod | stun | shield | regen | purify
*/
const SKILLS = {
  /* Tuyết Vũ — Thủy */
  bang_cham:  { id:'bang_cham', name:'Băng Châm', cost:0, power:0.95, target:'one', element:'thuy',
                desc:'Phóng châm băng vào một kẻ địch, có cơ hội làm chậm.',
                fx:[{k:'mod',stat:'spd',mul:0.78,turns:2,chance:35,name:'Chậm'}] },
  tuyet_ba:   { id:'tuyet_ba', name:'Tuyết Ba', cost:34, power:0.82, target:'all', element:'thuy',
                desc:'Sóng tuyết quét toàn bộ hàng địch, làm chậm diện rộng.',
                fx:[{k:'mod',stat:'spd',mul:0.8,turns:2,chance:50,name:'Chậm'}] },
  han_bang:   { id:'han_bang', name:'Hàn Băng Phong', cost:46, power:1.6, target:'one', element:'thuy',
                desc:'Đóng băng một mục tiêu, gây sát thương lớn và có thể tê liệt.',
                fx:[{k:'stun',turns:1,chance:55,name:'Tê Liệt'}] },
  bang_ha_hoa: { id:'bang_ha_hoa', name:'Bí Kỹ · Băng Hà Vạn Lý', cost:0, power:2.1, target:'all', element:'thuy', ult:true,
                desc:'Đóng băng cả chiến trường, sát thương toàn hàng địch và tê liệt 60%.',
                fx:[{k:'stun',turns:1,chance:60,name:'Tê Liệt'}] },

  /* Hỏa Kỳ — Hỏa */
  song_dao:   { id:'song_dao', name:'Song Đao Trảm', cost:0, power:1.05, target:'one', element:'hoa',
                desc:'Chém liên tiếp bằng cặp đao, gây bỏng nhẹ.',
                fx:[{k:'dot',name:'Bỏng',mul:0.35,turns:2,chance:40}] },
  hoa_quyen:  { id:'hoa_quyen', name:'Hỏa Quyền', cost:30, power:1.5, target:'one', element:'hoa',
                desc:'Cú đấm tụ lửa, thiêu đốt mục tiêu.',
                fx:[{k:'dot',name:'Bỏng',mul:0.45,turns:2,chance:80}] },
  lien_hoan:  { id:'lien_hoan', name:'Liên Hoàn Trảm', cost:42, power:0.92, hits:3, target:'rand', element:'hoa',
                desc:'Ba nhát chém vào mục tiêu ngẫu nhiên.',
                fx:[] },
  liet_hoa:   { id:'liet_hoa', name:'Bí Kỹ · Liệt Hỏa Phong Bạo', cost:0, power:1.85, target:'all', element:'hoa', ult:true,
                desc:'Bão lửa thiêu rụi toàn bộ kẻ địch và gây bỏng chắc chắn.',
                fx:[{k:'dot',name:'Bỏng',mul:0.5,turns:2,chance:100}] },

  /* Lôi Phong — Lôi */
  phi_tieu:   { id:'phi_tieu', name:'Phi Tiêu', cost:0, power:0.9, target:'one', element:'loi',
                desc:'Ném phi tiêu nhanh như chớp.', fx:[] },
  loi_tram:   { id:'loi_tram', name:'Lôi Trảm', cost:30, power:1.38, target:'one', element:'loi',
                desc:'Nhát chém điện, tỉ lệ bạo kích cao.', crit:20, fx:[] },
  anh_phan:   { id:'anh_phan', name:'Ảnh Phân Thân', cost:32, target:'self', element:'loi',
                desc:'Tăng 35% công và 25% tốc cho bản thân trong 3 lượt.',
                fx:[{k:'mod',stat:'atk',mul:1.35,turns:3,chance:100,name:'Cuồng'},
                    {k:'mod',stat:'spd',mul:1.25,turns:3,chance:100,name:'Nhanh'}] },
  loi_dinh:   { id:'loi_dinh', name:'Bí Kỹ · Lôi Đình Vạn Quân', cost:0, power:1.25, hits:3, target:'one', element:'loi', ult:true,
                desc:'Ba tia sét giáng xuống một mục tiêu, bỏ qua 30% phòng ngự.', ignoreDef:0.3, fx:[] },

  /* Thạch Kiên — Thổ */
  da_khoi:    { id:'da_khoi', name:'Đá Khối', cost:0, power:0.8, target:'one', element:'tho',
                desc:'Nện đá vào mục tiêu và tự tạo khiên nhỏ.',
                fx:[{k:'mod',stat:'def',mul:1.15,turns:2,chance:100,name:'Kiên Cố'}] },
  dia_chan:   { id:'dia_chan', name:'Địa Chấn', cost:30, power:0.88, target:'all', element:'tho',
                desc:'Rung chuyển mặt đất, giảm công toàn hàng địch.',
                fx:[{k:'mod',stat:'atk',mul:0.78,turns:2,chance:70,name:'Suy Yếu'}] },
  thach_giap: { id:'thach_giap', name:'Thạch Giáp', cost:26, target:'self', element:'tho',
                desc:'Tăng 55% phòng ngự 3 lượt và tạo khiên bằng 140% công.',
                fx:[{k:'shield',mul:1.4,turns:3,chance:100},
                    {k:'mod',stat:'def',mul:1.55,turns:3,chance:100,name:'Thiết Giáp'}] },
  son_bang:   { id:'son_bang', name:'Bí Kỹ · Sơn Băng Địa Liệt', cost:0, power:1.45, target:'all', element:'tho', ult:true,
                desc:'Núi lở đè nát hàng địch, có thể choáng.',
                fx:[{k:'stun',turns:1,chance:40,name:'Choáng'}] },

  /* Mộc Yên — Mộc */
  moc_tien:   { id:'moc_tien', name:'Mộc Tiễn', cost:0, power:0.85, target:'one', element:'moc',
                desc:'Mũi tên gỗ kèm hạt giống, hồi máu cho đồng đội yếu nhất.',
                fx:[], heal:0.35, healTarget:'lowest' },
  xuan_phong: { id:'xuan_phong', name:'Xuân Phong Hóa Vũ', cost:32, target:'allies', element:'moc',
                desc:'Hồi máu toàn đội và tẩy hiệu ứng xấu.', heal:1.45,
                fx:[{k:'purify',chance:100}] },
  sinh_menh:  { id:'sinh_menh', name:'Sinh Mệnh Chi Khí', cost:40, target:'ally', element:'moc',
                desc:'Hồi lượng lớn máu cho một đồng đội và thêm hồi phục 3 lượt.', heal:3.0,
                fx:[{k:'regen',mul:0.5,turns:3,chance:100}] },
  moc_gioi:   { id:'moc_gioi', name:'Bí Kỹ · Mộc Giới Hồi Sinh', cost:0, target:'allies', element:'moc', ult:true,
                desc:'Hồi sinh đồng đội đã gục (nếu còn trống) và hồi máu toàn đội.',
                heal:2.1, fx:[{k:'purify',chance:100},{k:'shield',mul:0.6,turns:2,chance:100}] },

  /* Phong Linh — Phong */
  phong_tien: { id:'phong_tien', name:'Phong Tiễn', cost:0, power:0.72, hits:2, target:'one', element:'phong',
                desc:'Hai mũi tên gió liên tiếp.', fx:[] },
  vu_tien:    { id:'vu_tien', name:'Vũ Tiễn', cost:34, power:0.68, hits:4, target:'rand', element:'phong',
                desc:'Bốn mũi tên rơi ngẫu nhiên lên hàng địch.', fx:[] },
  xuyen_phong:{ id:'xuyen_phong', name:'Xuyên Phong Tiễn', cost:38, power:1.75, target:'one', element:'phong', ignoreDef:0.5,
                desc:'Mũi tên xuyên giáp, bỏ qua 50% phòng ngự.', fx:[] },
  bao_tien:   { id:'bao_tien', name:'Bí Kỹ · Bão Tiễn Xạ', cost:0, power:0.9, hits:6, target:'rand', element:'phong', ult:true,
                desc:'Sáu mũi tên bão phủ kín chiến trường.', fx:[] },

  /* Vân Kiếm — Phong */
  thuc_nhat:  { id:'thuc_nhat', name:'Nhất Thức', cost:0, power:1.0, target:'one', element:'phong',
                desc:'Nhát kiếm cơ bản dứt khoát.', fx:[] },
  phong_anh:  { id:'phong_anh', name:'Phong Ảnh Trảm', cost:30, power:0.82, hits:2, target:'one', element:'phong',
                desc:'Chém hai lần trong một hơi thở, gây chảy máu.',
                fx:[{k:'dot',name:'Chảy Máu',mul:0.3,turns:2,chance:60}] },
  kiem_vu:    { id:'kiem_vu', name:'Kiếm Vũ', cost:40, power:1.02, target:'all', element:'phong',
                desc:'Xoay kiếm tạo vòng gió sắc quét toàn hàng địch.', fx:[] },
  van_kiem:   { id:'van_kiem', name:'Bí Kỹ · Vạn Kiếm Quy Tông', cost:0, power:2.55, target:'one', element:'phong', ignoreDef:0.25, ult:true,
                desc:'Ngàn kiếm hội tụ vào một mục tiêu duy nhất.', fx:[] },

  /* Huyết Nha — Ám */
  huyet_trao: { id:'huyet_trao', name:'Huyết Trảo', cost:0, power:0.95, target:'one', element:'am', lifesteal:0.4,
                desc:'Vuốt máu, hồi lại 40% sát thương gây ra.', fx:[] },
  am_anh:     { id:'am_anh', name:'Ám Ảnh Ký Sinh', cost:30, power:1.3, target:'one', element:'am', lifesteal:0.25,
                desc:'Bóng tối bám lấy mục tiêu, giảm phòng ngự.',
                fx:[{k:'mod',stat:'def',mul:0.7,turns:2,chance:80,name:'Mục Rữa'}] },
  huyet_te:   { id:'huyet_te', name:'Huyết Tế', cost:18, power:1.95, target:'one', element:'am', lifesteal:0.65, selfHpCost:0.1,
                desc:'Hiến 10% máu để tung đòn tàn khốc, hút lại 65% sát thương.', fx:[] },
  huyet_nguyet:{ id:'huyet_nguyet', name:'Bí Kỹ · Huyết Nguyệt Giáng', cost:0, power:1.5, target:'all', element:'am', ult:true, lifesteal:0.45,
                desc:'Trăng máu bao phủ, sát thương toàn hàng địch và hút máu.', fx:[] },

  /* Kỹ năng kẻ địch */
  e_slash:  { id:'e_slash', name:'Chém Ngang', cost:0, power:1.0, target:'one', desc:'Đòn đánh thường.', fx:[] },
  e_heavy:  { id:'e_heavy', name:'Trọng Kích', cost:24, power:1.5, target:'one', desc:'Cú đánh nặng.', fx:[{k:'stun',turns:1,chance:20,name:'Choáng'}] },
  e_sweep:  { id:'e_sweep', name:'Quét Diện', cost:30, power:0.85, target:'all', desc:'Tấn công toàn hàng.', fx:[] },
  e_bite:   { id:'e_bite', name:'Cắn Xé', cost:26, power:1.3, target:'one', lifesteal:0.4, desc:'Cắn xé và hút máu.', fx:[] },
  e_poison: { id:'e_poison', name:'Phun Độc', cost:22, power:0.7, target:'rand', hits:2, desc:'Phun nọc độc.', fx:[{k:'dot',name:'Độc',mul:0.4,turns:3,chance:70}] },
  e_heal:   { id:'e_heal', name:'Hồi Sinh Thuật', cost:30, target:'allies', heal:1.1, desc:'Hồi máu đồng bọn.', fx:[] },
  e_roar:   { id:'e_roar', name:'Hống Thiên', cost:28, target:'self', desc:'Tăng công bản thân.', fx:[{k:'mod',stat:'atk',mul:1.3,turns:3,chance:100,name:'Cuồng'}] },
  e_blast:  { id:'e_blast', name:'Chấn Động', cost:32, power:1.15, target:'all', desc:'Sóng xung kích.', fx:[{k:'mod',stat:'def',mul:0.8,turns:2,chance:50,name:'Giáp Vỡ'}] }
};

/* ---------- Nhẫn giả ---------- */
const CHARACTERS = [
  { id:'tuyetvu', name:'Tuyết Vũ', title:'Băng Hà Kiếm Nữ', element:'thuy', role:'phap', rarity:4,
    art:{ hair:'long', mask:false, weapon:'fan', scarf:true, skin:'#f0d9c8' },
    bio:'Cô gái cuối cùng của Băng Hà Cốc. Quạt giấy của cô đóng băng mọi thứ chạm vào.',
    base:{ hp:700, atk:138, def:56, spd:96, crit:7 }, growth:{ hp:56, atk:11.6, def:5.0, spd:1.5 },
    skills:['bang_cham','tuyet_ba','han_bang'], ult:'bang_ha_hoa', starter:true },

  { id:'hoaky', name:'Hỏa Kỳ', title:'Song Đao Lửa', element:'hoa', role:'cong', rarity:3,
    art:{ hair:'spike', mask:true, weapon:'katana', scarf:true, skin:'#e8c6a8' },
    bio:'Thợ rèn của làng bị cháy. Hai thanh đao luôn nóng hơn lửa trại.',
    base:{ hp:780, atk:130, def:64, spd:100, crit:9 }, growth:{ hp:60, atk:11.2, def:5.6, spd:1.6 },
    skills:['song_dao','hoa_quyen','lien_hoan'], ult:'liet_hoa', starter:true },

  { id:'thachkien', name:'Thạch Kiên', title:'Tường Thành Của Làng', element:'tho', role:'thu', rarity:3,
    art:{ hair:'bob', mask:true, weapon:'staff', scarf:false, skin:'#d8b28c', bulk:true },
    bio:'Người duy nhất đứng lại khi cổng làng sập. Bây giờ anh vẫn đứng đó.',
    base:{ hp:1000, atk:96, def:96, spd:84, crit:4 }, growth:{ hp:78, atk:8.4, def:7.8, spd:1.1 },
    skills:['da_khoi','dia_chan','thach_giap'], ult:'son_bang', starter:true },

  { id:'loiphong', name:'Lôi Phong', title:'Bóng Chớp', element:'loi', role:'satthu', rarity:4,
    art:{ hair:'ponytail', mask:true, weapon:'kunai', scarf:true, skin:'#efd2b8' },
    bio:'Không ai kịp thấy mặt anh ta — chỉ thấy tia chớp còn sót lại.',
    base:{ hp:720, atk:134, def:58, spd:118, crit:16 }, growth:{ hp:52, atk:11.8, def:4.6, spd:2.0 },
    skills:['phi_tieu','loi_tram','anh_phan'], ult:'loi_dinh' },

  { id:'mocyen', name:'Mộc Yên', title:'Y Sư Rừng Sương', element:'moc', role:'hotro', rarity:4,
    art:{ hair:'bob', mask:false, weapon:'staff', scarf:true, skin:'#f2ddc9' },
    bio:'Chữa lành cho cả kẻ thù. Nhưng cô nhớ rất rõ ai đã đốt rừng của mình.',
    base:{ hp:760, atk:110, def:70, spd:94, crit:6 }, growth:{ hp:58, atk:9.0, def:5.8, spd:1.4 },
    skills:['moc_tien','xuan_phong','sinh_menh'], ult:'moc_gioi' },

  { id:'phonglinh', name:'Phong Linh', title:'Xạ Thủ Đèo Gió', element:'phong', role:'xathu', rarity:3,
    art:{ hair:'ponytail', mask:false, weapon:'bow', scarf:false, skin:'#e9c9a8' },
    bio:'Lớn lên trên vách đá, cô bắn trúng mục tiêu trước khi nó kịp thở.',
    base:{ hp:700, atk:126, def:56, spd:110, crit:12 }, growth:{ hp:52, atk:10.8, def:4.6, spd:1.9 },
    skills:['phong_tien','vu_tien','xuyen_phong'], ult:'bao_tien' },

  { id:'vankiem', name:'Vân Kiếm', title:'Kiếm Sĩ Di Tích', element:'phong', role:'cong', rarity:5,
    art:{ hair:'topknot', mask:false, weapon:'katana', scarf:true, skin:'#edd0b4' },
    bio:'Giữ thanh kiếm của một môn phái đã biến mất, chờ ngày nó được rút khỏi vỏ.',
    base:{ hp:880, atk:142, def:76, spd:104, crit:12 }, growth:{ hp:64, atk:12.4, def:6.4, spd:1.6 },
    skills:['thuc_nhat','phong_anh','kiem_vu'], ult:'van_kiem' },

  { id:'huyetnha', name:'Huyết Nha', title:'Kẻ Bị Lãng Quên', element:'am', role:'satthu', rarity:5,
    art:{ hair:'hood', mask:true, weapon:'claws', scarf:false, skin:'#d9b6a2' },
    bio:'Từng là đệ tử của Huyết Nguyệt Giáo. Cái giá của sự phản bội là chính dòng máu mình.',
    base:{ hp:800, atk:140, def:62, spd:112, crit:14 }, growth:{ hp:56, atk:12.2, def:5.0, spd:1.8 },
    skills:['huyet_trao','am_anh','huyet_te'], ult:'huyet_nguyet' }
];
const CHAR_BY_ID = Object.fromEntries(CHARACTERS.map(c => [c.id, c]));

/* ---------- Trang bị ---------- */
const RARITY = {
  1: { name:'Thường', color:'#9aa4b2' },
  2: { name:'Tốt',    color:'#5bd9a4' },
  3: { name:'Hiếm',   color:'#4bb8ff' },
  4: { name:'Sử Thi', color:'#c084fc' },
  5: { name:'Truyền Thuyết', color:'#ffb03a' }
};

const EQUIP_TEMPLATES = [
  { id:'w_dao',  slot:'weapon', name:'Đoản Đao Sương',  rarity:1, stats:{ atk:16 } },
  { id:'w_kunai',slot:'weapon', name:'Phi Tiêu Gió',     rarity:2, stats:{ atk:24, spd:4 } },
  { id:'w_kiem', slot:'weapon', name:'Kiếm Di Tích',     rarity:3, stats:{ atk:38, crit:3 } },
  { id:'w_quat', slot:'weapon', name:'Quạt Băng Hà',     rarity:4, stats:{ atk:54, crit:5 } },
  { id:'w_doc',  slot:'weapon', name:'Nhận Xà Ảnh',      rarity:5, stats:{ atk:74, crit:7 } },

  { id:'a_ao',   slot:'armor',  name:'Áo Vải Sương',     rarity:1, stats:{ hp:90, def:10 } },
  { id:'a_giap', slot:'armor',  name:'Giáp Da Thú',      rarity:2, stats:{ hp:150, def:16 } },
  { id:'a_linh', slot:'armor',  name:'Giáp Vảy Linh',    rarity:3, stats:{ hp:240, def:26 } },
  { id:'a_huyet',slot:'armor',  name:'Huyết Bào',        rarity:4, stats:{ hp:360, def:38, atk:8 } },
  { id:'a_long', slot:'armor',  name:'Long Lân Giáp',    rarity:5, stats:{ hp:520, def:52, atk:12 } },

  { id:'t_bua',  slot:'charm',  name:'Bùa Cầu An',       rarity:1, stats:{ spd:4, crit:2 } },
  { id:'t_ngoc', slot:'charm',  name:'Ngọc Ấn',          rarity:2, stats:{ hp:80, spd:5 } },
  { id:'t_linh', slot:'charm',  name:'Linh Phù',         rarity:3, stats:{ atk:14, spd:8, crit:3 } },
  { id:'t_am',   slot:'charm',  name:'Ấn Huyết Nguyệt',  rarity:4, stats:{ atk:22, hp:180, crit:4 } },
  { id:'t_than', slot:'charm',  name:'Thần Ấn Ngũ Hành', rarity:5, stats:{ atk:32, hp:260, def:20, spd:10, crit:6 } }
];
const EQUIP_BY_ID = Object.fromEntries(EQUIP_TEMPLATES.map(e => [e.id, e]));
const SLOT_NAMES = { weapon:'Vũ khí', armor:'Giáp', charm:'Bí bảo' };

/* ---------- Vật phẩm ---------- */
const ITEMS = {
  hp_small: { id:'hp_small', name:'Hồi Huyết Hoàn', desc:'Hồi 35% máu cho một nhẫn giả.', price:70,  battle:true, kind:'heal', value:0.35, target:'ally' },
  chakra:   { id:'chakra',   name:'Linh Tửu',       desc:'Hồi 45 điểm chakra.',          price:60,  battle:true, kind:'chakra', value:45, target:'ally' },
  atk_up:   { id:'atk_up',   name:'Cuồng Nộ Đan',   desc:'Cả đội +30% công trong 3 lượt.', price:170, battle:true, kind:'buff', target:'allies',
              fx:[{k:'mod',stat:'atk',mul:1.3,turns:3,chance:100,name:'Cuồng'}] },
  revive:   { id:'revive',   name:'Hồi Sinh Phù',   desc:'Hồi sinh một nhẫn giả đã gục với 40% máu.', price:240, battle:true, kind:'revive', target:'dead' },
  purify:   { id:'purify',   name:'Tịnh Tâm Phù',   desc:'Tẩy toàn bộ hiệu ứng xấu cho cả đội.', price:130, battle:true, kind:'purify', target:'allies' }
};

/* ---------- Kẻ địch ---------- */
const ENEMIES = {
  son_tac:  { name:'Sơn Tặc', element:'tho', art:{ hair:'spike', mask:true, weapon:'katana', foe:true, skin:'#c9a07a' },
              base:{ hp:520, atk:78, def:34, spd:88, crit:5 }, skills:['e_slash','e_heavy'] },
  cung_thu: { name:'Cung Thủ Ẩn', element:'phong', art:{ hair:'hood', mask:true, weapon:'bow', foe:true, skin:'#c9a07a' },
              base:{ hp:440, atk:88, def:28, spd:102, crit:10 }, skills:['e_slash','e_sweep'] },
  doc_xa:   { name:'Độc Xà', element:'moc', art:{ hair:'none', mask:true, weapon:'claws', foe:true, beast:true, skin:'#8fd16a' },
              base:{ hp:500, atk:84, def:32, spd:96, crit:6 }, skills:['e_bite','e_poison'] },
  huyet_do: { name:'Huyết Đồ', element:'am', art:{ hair:'hood', mask:true, weapon:'claws', foe:true, skin:'#c9a07a' },
              base:{ hp:620, atk:94, def:38, spd:94, crit:8 }, skills:['e_slash','e_bite'] },
  bang_thu: { name:'Băng Thú', element:'thuy', art:{ hair:'none', mask:true, weapon:'claws', foe:true, beast:true, skin:'#a8d8f0' },
              base:{ hp:720, atk:86, def:48, spd:86, crit:5 }, skills:['e_slash','e_sweep'] },
  thach_linh:{ name:'Thạch Linh', element:'tho', art:{ hair:'none', mask:true, weapon:'staff', foe:true, beast:true, skin:'#a8896a' },
              base:{ hp:860, atk:80, def:62, spd:72, crit:4 }, skills:['e_heavy','e_blast'] },
  moc_linh: { name:'Mộc Linh', element:'moc', art:{ hair:'hood', mask:true, weapon:'staff', foe:true, skin:'#9ed17a' },
              base:{ hp:580, atk:96, def:34, spd:98, crit:6 }, skills:['e_slash','e_heal'] },
  phong_y:  { name:'Phong Yêu', element:'phong', art:{ hair:'spike', mask:true, weapon:'kunai', foe:true, skin:'#a8d8c0' },
              base:{ hp:600, atk:96, def:30, spd:112, crit:12 }, skills:['e_slash','e_sweep'] },
  loi_dieu: { name:'Lôi Điêu', element:'loi', art:{ hair:'none', mask:true, weapon:'claws', foe:true, beast:true, skin:'#e8d98a' },
              base:{ hp:560, atk:102, def:30, spd:108, crit:14 }, skills:['e_slash','e_heavy'] },
  hoa_linh: { name:'Hỏa Linh', element:'hoa', art:{ hair:'hood', mask:true, weapon:'staff', foe:true, skin:'#e8a88a' },
              base:{ hp:560, atk:106, def:28, spd:100, crit:8 }, skills:['e_slash','e_sweep'] },
  thuy_linh:{ name:'Thủy Linh', element:'thuy', art:{ hair:'long', mask:true, weapon:'fan', foe:true, skin:'#a8c8e8' },
              base:{ hp:620, atk:98, def:38, spd:96, crit:6 }, skills:['e_bite','e_poison'] },
  am_ve_si: { name:'Ám Vệ Sĩ', element:'am', art:{ hair:'hood', mask:true, weapon:'katana', foe:true, skin:'#b89fc9' },
              base:{ hp:900, atk:120, def:48, spd:104, crit:12 }, skills:['e_slash','e_heavy','e_bite'] },

  son_vuong:{ name:'Sơn Vương', element:'tho', boss:true, art:{ hair:'spike', mask:true, weapon:'staff', foe:true, bulk:true, skin:'#b88a5a' },
              base:{ hp:1900, atk:104, def:58, spd:82, crit:5 }, skills:['e_heavy','e_sweep','e_roar'] },
  huyet_te: { name:'Huyết Tế Sư', element:'am', boss:true, art:{ hair:'hood', mask:true, weapon:'staff', foe:true, skin:'#c9a0c0' },
              base:{ hp:2300, atk:112, def:54, spd:90, crit:8 }, skills:['e_sweep','e_bite','e_heal'] },
  ve_si_ngu_hanh:{ name:'Ngũ Hành Vệ Sĩ', element:'loi', boss:true, art:{ hair:'none', mask:true, weapon:'katana', foe:true, bulk:true, skin:'#b0b8c9' },
              base:{ hp:2900, atk:124, def:68, spd:96, crit:10 }, skills:['e_heavy','e_blast','e_roar'] },
  hac_long: { name:'Hắc Long Vương', element:'am', boss:true, art:{ hair:'none', mask:true, weapon:'claws', foe:true, bulk:true, dragon:true, skin:'#8a7aa8' },
              base:{ hp:3600, atk:130, def:76, spd:100, crit:12 }, skills:['e_sweep','e_heavy','e_bite','e_roar'] }
};

/* ---------- Chương hồi ---------- */
const CHAPTERS = [
  { id:1, name:'Làng Sương Mù', tag:'Khởi đầu', theme:'mist',
    intro:'Sương phủ kín con đường về làng. Ba năm trước, gia tộc Hắc Vũ bị xoá sổ trong một đêm. Hôm nay, bạn bước lại vào tro tàn ấy.',
    stages:[
      { id:'1-1', name:'Bìa Rừng Sương', lv:1, enemies:[['son_tac',1],['son_tac',1]], reward:{ gold:45, xp:40 } },
      { id:'1-2', name:'Cầu Gãy', lv:2, enemies:[['son_tac',2],['cung_thu',2],['son_tac',2]], reward:{ gold:60, xp:55 }, firstClear:{ char:'loiphong' } },
      { id:'1-3', name:'Hang Ẩm', lv:3, enemies:[['doc_xa',3],['son_tac',3],['cung_thu',3]], reward:{ gold:70, xp:70 } },
      { id:'1-4', name:'Đền Bỏ Hoang', lv:5, enemies:[['son_tac',4],['son_vuong',5],['son_tac',4]], reward:{ gold:110, xp:95 }, firstClear:{ char:'mocyen' } },
      { id:'1-5', name:'Ranh Giới Huyết Nguyệt', lv:6, enemies:[['son_tac',5],['cung_thu',6],['son_tac',5]], reward:{ gold:95, xp:110 } }
    ] },
  { id:2, name:'Hẻm Núi Huyết Nguyệt', tag:'Truy dấu', theme:'blood',
    intro:'Dấu chân của bọn áo đỏ dẫn lên hẻm núi. Không khí có mùi sắt, và trên vách đá là những ký hiệu mặt trăng bị chém nát.',
    stages:[
      { id:'2-1', name:'Chốt Gác Đỏ', lv:7, enemies:[['huyet_do',7],['huyet_do',7],['bang_thu',7]], reward:{ gold:120, xp:130 } },
      { id:'2-2', name:'Mỏ Đá Xác', lv:9, enemies:[['thach_linh',9],['huyet_do',9],['huyet_do',9]], reward:{ gold:140, xp:150 } },
      { id:'2-3', name:'Sông Độc', lv:10, enemies:[['doc_xa',10],['moc_linh',10],['doc_xa',10]], reward:{ gold:150, xp:165 } },
      { id:'2-4', name:'Tế Đàn Máu', lv:12, enemies:[['huyet_do',11],['huyet_te',12],['huyet_do',11]], reward:{ gold:210, xp:200 }, firstClear:{ char:'phonglinh' } },
      { id:'2-5', name:'Đèo Gió Lạnh', lv:13, enemies:[['phong_y',13],['loi_dieu',13],['bang_thu',13]], reward:{ gold:180, xp:220 } }
    ] },
  { id:3, name:'Di Tích Ngũ Hành', tag:'Cổ lực', theme:'jade',
    intro:'Năm pho tượng nguyên tố đứng giữa trời. Kẻ đeo mặt nạ cho rằng sức mạnh của chúng thuộc về hắn ta.',
    stages:[
      { id:'3-1', name:'Cổng Đá', lv:14, enemies:[['thach_linh',14],['thach_linh',14],['hoa_linh',14]], reward:{ gold:200, xp:240 } },
      { id:'3-2', name:'Hỏa Điện', lv:15, enemies:[['hoa_linh',15],['hoa_linh',15],['loi_dieu',15]], reward:{ gold:220, xp:260 } },
      { id:'3-3', name:'Băng Cung', lv:16, enemies:[['bang_thu',16],['thuy_linh',16],['bang_thu',16]], reward:{ gold:230, xp:280 } },
      { id:'3-4', name:'Trận Nhãn', lv:18, enemies:[['ve_si_ngu_hanh',18],['hoa_linh',17],['thuy_linh',17]], reward:{ gold:330, xp:340 }, firstClear:{ char:'vankiem' } },
      { id:'3-5', name:'Sâu Trong Di Tích', lv:19, enemies:[['am_ve_si',19],['am_ve_si',19],['moc_linh',19]], reward:{ gold:300, xp:380 } }
    ] },
  { id:4, name:'Tháp Hắc Long', tag:'Chung cuộc', theme:'shadow',
    intro:'Tháp mọc lên giữa vùng đất chết. Ở tầng cao nhất, kẻ đã đốt làng bạn đang chờ — và hắn đã không còn là người.',
    stages:[
      { id:'4-1', name:'Tầng Cấm', lv:20, enemies:[['am_ve_si',20],['huyet_do',20],['am_ve_si',20]], reward:{ gold:340, xp:400 }, firstClear:{ char:'huyetnha' } },
      { id:'4-2', name:'Sảnh Xương', lv:21, enemies:[['thach_linh',21],['am_ve_si',21],['loi_dieu',21]], reward:{ gold:360, xp:430 } },
      { id:'4-3', name:'Gương Vỡ', lv:22, enemies:[['thuy_linh',22],['hoa_linh',22],['am_ve_si',22]], reward:{ gold:380, xp:460 } },
      { id:'4-4', name:'Đỉnh Tháp', lv:23, enemies:[['am_ve_si',23],['ve_si_ngu_hanh',23],['am_ve_si',23]], reward:{ gold:420, xp:500 } },
      { id:'4-5', name:'Hắc Long Vương', lv:25, enemies:[['huyet_do',24],['hac_long',25],['huyet_do',24]], reward:{ gold:600, xp:700 }, firstClear:{ gold:800 } }
    ] }
];

/* ---------- Đấu trường ---------- */
const ARENA_NAMES = [
  'Tử Vân Tông', 'Hắc Phong Trại', 'Bạch Xà Môn', 'Liệt Hỏa Bang', 'Thanh Long Hội',
  'Vô Ảnh Lâu', 'Độc Cô Kiếm Phái', 'Sa Mạc Đoàn', 'Thiết Huyết Minh', 'Lôi Đình Các'
];
const ARENA_TIERS = [
  { min:0,    name:'Nhẫn Đồ',        color:'#9aa4b2' },
  { min:400,  name:'Hạ Nhẫn',        color:'#5bd9a4' },
  { min:800,  name:'Trung Nhẫn',     color:'#4bb8ff' },
  { min:1200, name:'Thượng Nhẫn',    color:'#c084fc' },
  { min:1600, name:'Ám Bộ',          color:'#ffb03a' },
  { min:2000, name:'Nhẫn Thánh',     color:'#ff5a3c' }
];

/* ---------- Tiện ích dùng chung ---------- */
const DataUtil = {
  element(id) { return ELEMENTS[id] || ELEMENTS.am; },
  advance(id) {
    const el = ELEMENTS[id];
    return el && el.beats ? ELEMENTS[el.beats].id : null;
  },
  // Trả về 1.25 nếu hệ tấn công khắc hệ phòng thủ, 0.85 nếu bị khắc, 1 nếu trung tính.
  advantage(attackEl, defendEl) {
    if (!attackEl || !defendEl || attackEl === 'am' || defendEl === 'am') return 1;
    if (DataUtil.advance(attackEl) === defendEl) return 1.25;
    if (DataUtil.advance(defendEl) === attackEl) return 0.85;
    return 1;
  },
  rarity(id) { return RARITY[id] || RARITY[1]; }
};
