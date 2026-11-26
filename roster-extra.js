// language: JavaScript, file: roster-extra.js, target: HTML5 Canvas / ES6+ Browser
// Extra Anime Universes & 42 Fighters (including 5 new Naruto/Kurama fighters) for Anime Crossover BVN Easy-Cast System
// Shared Engine Schema Contract:
// - meleeProfile: { j?, wj?, sj?: { rangeX?, rangeY?, vx?, vy?, stateTimer?, hits?, hitInterval?, vfxStyle?, color?, qiBurn? } }
// - vfxStyle: 'orb' | 'spiral_orb' | 'slash_arc' | 'blade_volley' | 'lightning_bolt' | 'beast_wave'
// - Primitives: multi_hit_rush, true_counter, command_grab, dot_hazard, ghost_followup, multi_projectile, beam_laser, time_freeze, buff_install, domain_super
// - Optional qiBurn: drains opponent Qi on unblocked hit
// - awakenedForm: { name, actionOffset?, scaleMult?, dmgMult, speedMult, superArmorHits?, hpDrainPerSec?, tails?, tailColor?, auraColor? }
// - awakenedSkills: { [skillKey]: SkillDef }

window.EXTRA_ANIME_UNIVERSES = [
  { id: 'opm', name: 'One Punch Man', badge: 'OPM', color: '#facc15' },
  { id: 'fairytail', name: 'Fairy Tail', badge: 'FAIRY TAIL', color: '#f97316' },
  { id: 'mha', name: 'My Hero Academia', badge: 'MHA', color: '#22c55e' },
  { id: 'sds', name: 'Seven Deadly Sins', badge: '7DS', color: '#eab308' },
  { id: 'aot', name: 'Attack on Titan', badge: 'AOT', color: '#84cc16' },
  { id: 'tokyoghoul', name: 'Tokyo Ghoul', badge: 'TOKYO GHOUL', color: '#dc2626' },
  { id: 'sao', name: 'Sword Art Online', badge: 'SAO', color: '#0ea5e9' },
  { id: 'yyh', name: 'Yu Yu Hakusho', badge: 'YU YU HAKUSHO', color: '#14b8a6' },
  { id: 'classics', name: 'Shonen Classics', badge: 'CLASSICS', color: '#d946ef' }
];

window.EXTRA_FIGHTER_ROSTER = [
  // ==================== 1. ONE PUNCH MAN ====================
  {
    id: 'saitama',
    name: 'Saitama',
    title: 'Áo Choàng Hói / Anh Hùng Sở Thích',
    universe: 'opm',
    universeLabel: 'One Punch Man',
    difficulty: 'Dễ (Khuyên dùng)',
    archetype: 'Cận chiến siêu lực / Liên hoàn đấm phá giáp',
    hpMax: 1140,
    speed: 7.4,
    jumpPower: 16.4,
    colors: { primary: '#facc15', secondary: '#dc2626', hair: '#fde68a', aura: '#f8fafc', awakenAura: '#ef4444' },
    awakenName: 'Serious Series Mode (Chế Độ Nghiêm Túc)',
    awakenedForm: {
      name: 'Serious Series Mode (Chế Độ Nghiêm Túc)',
      dmgMult: 1.4,
      speedMult: 1.24,
      superArmorHits: 2,
      auraColor: '#ef4444'
    },
    meleeProfile: {
      j: { rangeX: 120, rangeY: 82, vx: 8.5, stateTimer: 13, vfxStyle: 'beast_wave', color: '#fef08a' },
      wj: { rangeX: 112, rangeY: 100, vy: -16.4, stateTimer: 20, vfxStyle: 'beast_wave', color: '#facc15' },
      sj: { rangeX: 136, rangeY: 84, vx: 15, stateTimer: 20, vfxStyle: 'beast_wave', color: '#ef4444' }
    },
    quote: 'Ta chỉ là một anh hùng làm cho vui thôi... Chết rồi, siêu thị sắp hết giờ giảm giá!',
    skills: {
      j: { cmd: 'J', bvnCode: 'ATTACK (砍1-4)', name: 'Đấm Thường Liên Hoàn (Normal Punches)', desc: 'Tung 4 cú đấm bình thường nhưng dư chấn đủ thổi bay đối thủ.', dmg: 28, qiGain: 15, cooldown: 0, type: 'melee_combo', vfxStyle: 'beast_wave' },
      wj: { cmd: 'W + J', bvnCode: 'SKILL_2 (WJ)', name: 'Cú Đấm Thượng Phá Mây', desc: 'Nhảy nhẹ đấm móc từ dưới lên làm rách cả bầu trời.', dmg: 76, qiGain: 22, cooldown: 35, type: 'anti_air', vfxStyle: 'beast_wave' },
      sj: { cmd: 'S + J', bvnCode: 'SKILL_1 (SJ)', name: 'Đấm Thường Một Phát (Normal Punch)', desc: 'Bước tới tung một cú đấm thẳng đơn giản nhưng xuyên thủng mọi phòng thủ.', dmg: 96, qiGain: 26, cooldown: 45, isBreakDef: true, type: 'dash_strike', vfxStyle: 'beast_wave' },
      u: { cmd: 'U', bvnCode: 'ZHAO_1 (U)', name: 'Lật Bàn Nghiêm Túc (Serious Table Flip)', desc: 'Hất tung 4 tảng đất đá khổng lồ bắn tứ phía với tốc độ siêu thanh.', dmg: 64, qiGain: 20, cooldown: 36, type: 'multi_projectile', projCount: 4, projSpeed: 14, projSize: 22, projSpread: 0.22, beamColor: '#fbbf24', vfxStyle: 'orb' },
      wu: { cmd: 'W + U', bvnCode: 'ZHAO_3 (WU)', name: 'Liên Hoàn Đấm Thường (Consecutive Punches)', desc: 'Vung 7 đợt nắm đấm liên thanh dồn dập vỡ giáp trước mặt.', dmg: 108, qiGain: 28, cooldown: 52, isBreakDef: true, type: 'multi_hit_rush', hits: 7, hitInterval: 4, rangeX: 136, rangeY: 88, dashSpeed: 9, vfxStyle: 'beast_wave', beamColor: '#fef08a' },
      su: { cmd: 'S + U', bvnCode: 'ZHAO_2 (SU)', name: 'Nghiêm Túc Nhảy Ngang (Sideways Hops)', desc: 'Để lại hàng loạt tàn ảnh rồi bất ngờ giáng cú đấm áp suất trễ.', dmg: 78, qiGain: 24, cooldown: 54, isBreakDef: true, type: 'ghost_followup', delayFrames: 12, rangeX: 130, rangeY: 84, dashToTarget: true, vfxStyle: 'beast_wave', beamColor: '#facc15' },
      i: { cmd: 'I (1 Nộ)', bvnCode: 'BISHA (I)', name: 'Sóng Xung Kích Đấm Nghiêm Túc', desc: 'Tung cú đấm tạo luồng áp suất trắng rực xé toạc toàn bộ mặt sân.', dmg: 205, qiCost: 100, cooldown: 42, isBreakDef: true, type: 'beam_laser', beamColor: '#fef08a', beamWidth: 46, beamDuration: 22, vfxStyle: 'beast_wave' },
      wi: { cmd: 'W + I (1 Nộ)', bvnCode: 'BISHA_UP (WI)', name: 'Nhảy Từ Mặt Trăng Giáng Thế', desc: 'Bật lên tầng bình lưu rồi lao thẳng xuống tạo hố bom chấn động.', dmg: 200, qiCost: 100, cooldown: 44, isBreakDef: true, type: 'bisha_dive', vfxStyle: 'beast_wave' },
      si: { cmd: 'S + I (3 Nộ)', bvnCode: 'BISHA_SUPER (SI)', name: 'Tất Sát Nghiêm Túc: Đấm Nghiêm Túc (Serious Punch)', desc: 'Ánh mắt sắc lạnh, tung cú đấm nghiêm túc xóa sổ tầng mây và nhuộm đỏ không gian.', dmg: 380, qiCost: 300, cooldown: 65, isBreakDef: true, type: 'domain_super', domainColor: '#dc2626', domainFrames: 95, domainLabel: 'SERIOUS PUNCH!!', beamColor: '#fef08a', vfxStyle: 'beast_wave' }
    },
    awakenedSkills: {
      wu: { cmd: 'W + U', bvnCode: 'ZHAO_3 (WU)', name: 'Liên Hoàn Đấm Nghiêm Túc (Serious Consecutive)', desc: 'Xả 7 cú đấm nghiêm túc tốc độ cực đại thổi bay mọi vật cản.', dmg: 132, qiGain: 28, cooldown: 48, isBreakDef: true, type: 'multi_hit_rush', hits: 7, hitInterval: 4, rangeX: 152, rangeY: 94, dashSpeed: 12, vfxStyle: 'beast_wave', beamColor: '#ef4444' }
    }
  },
  {
    id: 'genos',
    name: 'Genos',
    title: 'Quỷ Nhân Máy / Anh Hùng Hạng S',
    universe: 'opm',
    universeLabel: 'One Punch Man',
    difficulty: 'Trung bình',
    archetype: 'Hỏa lực tầm xa / Tốc độ phản lực',
    hpMax: 960,
    speed: 7.3,
    jumpPower: 15.6,
    colors: { primary: '#1e293b', secondary: '#f59e0b', hair: '#fde047', aura: '#fb923c', awakenAura: '#38bdf8' },
    awakenName: '10-Second Blue Dragon Mode (Thanh Long 10 Giây)',
    awakenedForm: {
      name: '10-Second Blue Dragon Mode',
      dmgMult: 1.36,
      speedMult: 1.24,
      hpDrainPerSec: 10,
      auraColor: '#38bdf8'
    },
    meleeProfile: {
      j: { rangeX: 106, rangeY: 74, vx: 8.5, stateTimer: 11, vfxStyle: 'lightning_bolt', color: '#fb923c' },
      wj: { rangeX: 104, rangeY: 96, vy: -15.8, stateTimer: 18, vfxStyle: 'orb', color: '#f97316' },
      sj: { rangeX: 132, rangeY: 78, vx: 15, stateTimer: 18, vfxStyle: 'lightning_bolt', color: '#38bdf8' }
    },
    quote: 'Tiêu diệt mục tiêu! Thiêu hủy toàn bộ!',
    skills: {
      j: { cmd: 'J', bvnCode: 'ATTACK (砍1-4)', name: 'Liên Hoàn Súng Máy (Machine Gun Blows)', desc: 'Tung chuỗi đấm cơ khí phản lực tốc độ cao 4 nhịp liên tiếp.', dmg: 25, qiGain: 15, cooldown: 0, type: 'melee_combo', vfxStyle: 'orb' },
      wj: { cmd: 'W + J', bvnCode: 'SKILL_2 (WJ)', name: 'Phản Lực Đá Thượng (Rocket Stomp Up)', desc: 'Bật động cơ chân tung cú đá vòng cung hất đối thủ lên không.', dmg: 70, qiGain: 22, cooldown: 34, type: 'anti_air', vfxStyle: 'orb' },
      sj: { cmd: 'S + J', bvnCode: 'SKILL_1 (SJ)', name: 'Machine Gun Blows — Xung Kích Cơ Khí', desc: 'Bật phản lực lưng lao tới dồn 6 cú đấm liên thanh phá vỡ phòng thủ.', dmg: 96, qiGain: 26, cooldown: 44, isBreakDef: true, type: 'multi_hit_rush', hits: 6, hitInterval: 4, rangeX: 128, rangeY: 80, dashSpeed: 13, vfxStyle: 'orb', beamColor: '#fb923c' },
      u: { cmd: 'U', bvnCode: 'ZHAO_1 (U)', name: 'Loạt Cầu Lửa Plasma (Incineration Volley)', desc: 'Bắn 4 viên đạn nhiệt plasma tỏa đều kiểm soát tầm xa.', dmg: 58, qiGain: 20, cooldown: 34, type: 'multi_projectile', projCount: 4, projSpeed: 15, projSize: 18, projSpread: 0.2, beamColor: '#fb923c', vfxStyle: 'orb' },
      wu: { cmd: 'W + U', bvnCode: 'ZHAO_3 (WU)', name: 'Pháo Thiêu Hủy (Incinerate Beam)', desc: 'Chập hai lòng bàn tay bắn tia nhiệt lửa xuyên thẳng toàn màn hình.', dmg: 92, qiGain: 28, cooldown: 54, isBreakDef: true, type: 'beam_laser', beamColor: '#f97316', beamWidth: 34, beamDuration: 22, vfxStyle: 'beast_wave' },
      su: { cmd: 'S + U', bvnCode: 'ZHAO_2 (SU)', name: 'Lõi Quá Tải (Overdrive Core)', desc: 'Đẩy công suất lõi năng lượng tối đa, tăng tốc độ và sát thương nhiệt.', dmg: 40, qiGain: 24, cooldown: 66, type: 'buff_install', speedBuff: 1.36, dmgBuff: 1.26, buffFrames: 300, healAmount: 45, beamColor: '#38bdf8', vfxStyle: 'lightning_bolt' },
      i: { cmd: 'I (1 Nộ)', bvnCode: 'BISHA (I)', name: 'Spiral Incineration Cannon (Pháo Xoắn Ốc)', desc: 'Phóng luồng hỏa lực xoắn ốc cực đại đốt cháy mọi thứ trên đường đi.', dmg: 192, qiCost: 100, cooldown: 42, isBreakDef: true, type: 'bisha_projectile', vfxStyle: 'spiral_orb' },
      wi: { cmd: 'W + I (1 Nộ)', bvnCode: 'BISHA_UP (WI)', name: 'Không Kích Phản Lực (High Voltage Dive)', desc: 'Bay vọt lên cao rồi lao chéo xuống kích nổ sóng xung kích điện nhiệt.', dmg: 196, qiCost: 100, cooldown: 44, isBreakDef: true, type: 'bisha_dive', vfxStyle: 'lightning_bolt' },
      si: { cmd: 'S + I (3 Nộ)', bvnCode: 'BISHA_SUPER (SI)', name: 'True Spiral Incineration: Thanh Long Hủy Diệt', desc: 'Mở khóa toàn bộ giới hạn lõi xanh bắn chùm tia hủy diệt ngang tầm thiên thạch.', dmg: 355, qiCost: 300, cooldown: 60, isBreakDef: true, type: 'super_beam', beamColor: '#38bdf8', vfxStyle: 'lightning_bolt' }
    }
  },
  {
    id: 'tatsumaki',
    name: 'Tatsumaki',
    title: 'Lốc Xoáy Kinh Hoàng / Anh Hùng Hạng S #2',
    universe: 'opm',
    universeLabel: 'One Punch Man',
    difficulty: 'Trung bình',
    archetype: 'Niệm lực khống chế / Zoner tầm xa',
    hpMax: 920,
    speed: 6.9,
    jumpPower: 16.2,
    colors: { primary: '#10b981', secondary: '#0f172a', hair: '#34d399', aura: '#6ee7b7', awakenAura: '#2dd4bf' },
    awakenName: 'Full Esper Overdrive (Niệm Lực Toàn Khai)',
    meleeProfile: {
      j: { rangeX: 128, rangeY: 82, vx: 5.5, stateTimer: 13, vfxStyle: 'spiral_orb', color: '#34d399' },
      wj: { rangeX: 122, rangeY: 104, vy: -16, stateTimer: 20, vfxStyle: 'spiral_orb', color: '#6ee7b7' },
      sj: { rangeX: 138, rangeY: 84, vx: 12, stateTimer: 20, vfxStyle: 'spiral_orb', color: '#10b981' }
    },
    quote: 'Đừng có coi thường ta! Chỉ cần một cái búng tay là ngươi thành bụi!',
    skills: {
      j: { cmd: 'J', bvnCode: 'ATTACK (砍1-4)', name: 'Niệm Lực Chấn Kích', desc: 'Vẫy tay phóng 4 luồng áp suất tâm linh sắc bén tầm trung.', dmg: 23, qiGain: 16, cooldown: 0, type: 'melee_combo', vfxStyle: 'spiral_orb' },
      wj: { cmd: 'W + J', bvnCode: 'SKILL_2 (WJ)', name: 'Lốc Xoáy Hất Tung', desc: 'Tạo cột lốc xanh ngọc cuốn đối thủ bay lên không trung.', dmg: 68, qiGain: 22, cooldown: 35, type: 'anti_air', vfxStyle: 'spiral_orb' },
      sj: { cmd: 'S + J', bvnCode: 'SKILL_1 (SJ)', name: 'Trọng Lực Nghiền Ép', desc: 'Lao tới trong lớp giáp niệm lực húc văng và phá vỡ thế thủ.', dmg: 84, qiGain: 26, cooldown: 44, isBreakDef: true, type: 'dash_strike', vfxStyle: 'spiral_orb' },
      u: { cmd: 'U', bvnCode: 'ZHAO_1 (U)', name: 'Mưa Đá Niệm Lực (Psychic Barrage)', desc: 'Nâng 5 mảnh bê tông bọc hào quang xanh ném liên tiếp về phía trước.', dmg: 60, qiGain: 20, cooldown: 34, type: 'multi_projectile', projCount: 5, projSpeed: 14, projSize: 18, projSpread: 0.24, beamColor: '#34d399', vfxStyle: 'orb' },
      wu: { cmd: 'W + U', bvnCode: 'ZHAO_3 (WU)', name: 'Niệm Lực Khóa Bóp (Psychic Crush Grab)', desc: 'Khóa cứng mục tiêu từ xa bằng niệm lực, bóp nát đa nhịp rồi ném văng.', dmg: 96, qiGain: 26, cooldown: 58, isBreakDef: true, type: 'command_grab', grabRangeX: 185, holdFrames: 38, ticks: 3, vfxStyle: 'spiral_orb', beamColor: '#10b981', grabLabel: 'PSYCHIC CRUSH!!' },
      su: { cmd: 'S + U', bvnCode: 'ZHAO_2 (SU)', name: 'Kết Giới Niệm Lực (Esper Counter Barrier)', desc: 'Bật màn chắn tâm linh phản đòn ngay khi đối thủ ra chiêu.', dmg: 76, qiGain: 24, cooldown: 50, isBreakDef: true, type: 'true_counter', windowFrames: 25, counterMult: 1.45, counterRangeX: 165, vfxStyle: 'spiral_orb', beamColor: '#34d399', counterLabel: 'ESPER BARRIER!' },
      i: { cmd: 'I (1 Nộ)', bvnCode: 'BISHA (I)', name: 'Siêu Lốc Xoáy Vặn Xoắn', desc: 'Phóng cơn bão niệm lực xanh khổng lồ xoắn nát mục tiêu trước mặt.', dmg: 190, qiCost: 100, cooldown: 42, isBreakDef: true, type: 'bisha_projectile', vfxStyle: 'spiral_orb' },
      wi: { cmd: 'W + I (1 Nộ)', bvnCode: 'BISHA_UP (WI)', name: 'Thiên Thạch Rơi (Meteor Pull)', desc: 'Kéo tảng thiên thạch từ tầng khí quyển giáng thẳng vào đầu đối thủ.', dmg: 198, qiCost: 100, cooldown: 44, isBreakDef: true, type: 'bisha_dive', vfxStyle: 'spiral_orb' },
      si: { cmd: 'S + I (3 Nộ)', bvnCode: 'BISHA_SUPER (SI)', name: 'Niệm Lực Hủy Diệt Thành Phố (Psychic Singularity)', desc: 'Nhuộm xanh toàn bộ không gian, nghiền ép trọng lực toàn màn hình bằng cơn bão thiên thạch.', dmg: 360, qiCost: 300, cooldown: 62, isBreakDef: true, type: 'domain_super', domainColor: '#10b981', domainFrames: 95, domainLabel: 'PSYCHIC SINGULARITY!', beamColor: '#6ee7b7', vfxStyle: 'spiral_orb' }
    }
  },

  // ==================== 2. JOJO'S BIZARRE ADVENTURE ====================
  {
    id: 'dio',
    name: 'DIO Brando',
    title: 'Chúa Tể Ma Cà Rồng / Stand: The World',
    universe: 'jojo',
    universeLabel: "JoJo's Bizarre Adventure",
    difficulty: 'Trung bình',
    archetype: 'Ngưng đọng thời gian / Mưa dao & Stand',
    hpMax: 1050,
    speed: 6.9,
    jumpPower: 15.4,
    colors: { primary: '#eab308', secondary: '#1e1b4b', hair: '#fde047', aura: '#facc15', awakenAura: '#f59e0b' },
    awakenName: 'Greatest High DIO (Đỉnh Cao Huyết Tộc)',
    awakenedForm: {
      name: 'Greatest High DIO (Đỉnh Cao Huyết Tộc)',
      dmgMult: 1.34,
      speedMult: 1.22,
      auraColor: '#facc15'
    },
    meleeProfile: {
      j: { rangeX: 114, rangeY: 78, vx: 7.5, stateTimer: 11, vfxStyle: 'beast_wave', color: '#facc15' },
      wj: { rangeX: 108, rangeY: 96, vy: -15.4, stateTimer: 18, vfxStyle: 'beast_wave', color: '#fde047' },
      sj: { rangeX: 132, rangeY: 82, vx: 14, stateTimer: 19, vfxStyle: 'beast_wave', color: '#eab308' }
    },
    quote: 'WRYYYYY! ZA WARUDO! Thời gian đã ngừng trôi — MUDA MUDA MUDA!',
    skills: {
      j: { cmd: 'J', bvnCode: 'ATTACK (砍1-4)', name: 'MUDA MUDA Stand Combo', desc: 'Triệu hồi The World đấm liên hoàn 4 nhịp tốc độ ánh sáng.', dmg: 27, qiGain: 16, cooldown: 0, type: 'melee_combo', vfxStyle: 'beast_wave' },
      wj: { cmd: 'W + J', bvnCode: 'SKILL_2 (WJ)', name: 'Thượng Đá Huyết Tộc (WRY Upper)', desc: 'The World đấm móc kết hợp đá xoay hất văng đối thủ lên cao.', dmg: 74, qiGain: 22, cooldown: 35, type: 'anti_air', vfxStyle: 'beast_wave' },
      sj: { cmd: 'S + J', bvnCode: 'SKILL_1 (SJ)', name: 'The World: Đột Kích Tàn Ảnh Stand', desc: 'Phóng phân thân The World áp sát giáng cú đấm trễ phá tan phòng ngự.', dmg: 94, qiGain: 28, cooldown: 45, isBreakDef: true, type: 'ghost_followup', delayFrames: 12, rangeX: 136, rangeY: 86, dashToTarget: true, vfxStyle: 'beast_wave', beamColor: '#facc15' },
      u: { cmd: 'U', bvnCode: 'ZHAO_1 (U)', name: 'Checkmate! Mưa Dao Găm (Knife Volley)', desc: 'Ném 5 con dao găm tỏa hình quạt khóa chặt đường lùi của kẻ địch.', dmg: 62, qiGain: 20, cooldown: 32, type: 'multi_projectile', projCount: 5, projSpeed: 17, projSize: 16, projSpread: 0.2, beamColor: '#e2e8f0', vfxStyle: 'blade_volley' },
      wu: { cmd: 'W + U', bvnCode: 'ZHAO_3 (WU)', name: 'ZA WARUDO! (Ngưng Đọng Thời Gian)', desc: 'Khóa cứng thời gian toàn sân đấu khiến đối thủ bất động hoàn toàn.', dmg: 80, qiGain: 26, cooldown: 72, isBreakDef: true, type: 'time_freeze', freezeFrames: 105, domainColor: '#eab308', freezeLabel: 'ZA WARUDO! TOKI WO TOMARE!', vfxStyle: 'spiral_orb' },
      su: { cmd: 'S + U', bvnCode: 'ZHAO_2 (SU)', name: 'Hút Máu Huyết Tộc (Blood Drain)', desc: 'Kích thích dòng máu ma cà rồng hồi phục sinh lực và tăng sát thương.', dmg: 45, qiGain: 22, cooldown: 70, type: 'buff_install', speedBuff: 1.28, dmgBuff: 1.28, buffFrames: 260, healAmount: 75, beamColor: '#dc2626', vfxStyle: 'beast_wave' },
      i: { cmd: 'I (1 Nộ)', bvnCode: 'BISHA (I)', name: 'Space Ripper Stingy Eyes (Tia Mắt Xuyên Không)', desc: 'Bắn tia dịch áp suất cao từ đôi mắt ma cà rồng xuyên thủng màn hình.', dmg: 192, qiCost: 100, cooldown: 42, isBreakDef: true, type: 'beam_laser', beamColor: '#f43f5e', beamWidth: 30, beamDuration: 22, vfxStyle: 'lightning_bolt' },
      wi: { cmd: 'W + I (1 Nộ)', bvnCode: 'BISHA_UP (WI)', name: 'The World: Xuyên Tâm Trụy Lạc', desc: 'Dịch chuyển lên đỉnh đầu kẻ địch giáng cú đấm sấm sét xuống mặt đất.', dmg: 198, qiCost: 100, cooldown: 44, isBreakDef: true, type: 'bisha_dive', vfxStyle: 'beast_wave' },
      si: { cmd: 'S + I (3 Nộ)', bvnCode: 'BISHA_SUPER (SI)', name: 'ROAD ROLLER DA!! (Xe Lu Hủy Diệt Trong 9 Giây)', desc: 'Ngưng đọng thời gian, kéo xe lu khổng lồ đè bẹp kẻ địch kèm hàng trăm cú MUDA nổ tung sân đấu.', dmg: 375, qiCost: 300, cooldown: 64, isBreakDef: true, type: 'domain_super', domainColor: '#ca8a04', domainFrames: 105, domainLabel: 'ROAD ROLLER DA!!', beamColor: '#fde047', vfxStyle: 'beast_wave' }
    },
    awakenedSkills: {
      sj: { cmd: 'S + J', bvnCode: 'SKILL_1 (SJ)', name: 'MUDA MUDA MUDA! (The World Rush)', desc: 'The World xả 6 cú đấm liên thanh tốc độ ánh sáng phá tan phòng thủ.', dmg: 112, qiGain: 28, cooldown: 42, isBreakDef: true, type: 'multi_hit_rush', hits: 6, hitInterval: 4, rangeX: 138, rangeY: 86, dashSpeed: 12, vfxStyle: 'beast_wave', beamColor: '#fde047' }
    }
  },

  // ==================== 3. FAIRY TAIL ====================
  {
    id: 'natsu',
    name: 'Natsu Dragneel',
    title: 'Hỏa Long Sát Nhân / Salamander',
    universe: 'fairytail',
    universeLabel: 'Fairy Tail',
    difficulty: 'Dễ (Khuyên dùng)',
    archetype: 'Áp sát rực lửa / Đốt sàn & Sát thương bùng nổ',
    hpMax: 1030,
    speed: 7.1,
    jumpPower: 15.6,
    colors: { primary: '#f97316', secondary: '#1e293b', hair: '#f472b6', aura: '#fb923c', awakenAura: '#ef4444' },
    awakenName: 'Dragon Force (Long Lực Sát Long Nhân)',
    awakenedForm: {
      name: 'Dragon Force (Long Lực Sát Long Nhân)',
      dmgMult: 1.36,
      speedMult: 1.22,
      auraColor: '#ef4444'
    },
    meleeProfile: {
      j: { rangeX: 108, rangeY: 76, vx: 8, stateTimer: 12, vfxStyle: 'beast_wave', color: '#f97316' },
      wj: { rangeX: 106, rangeY: 96, vy: -15.6, stateTimer: 18, vfxStyle: 'beast_wave', color: '#fb923c' },
      sj: { rangeX: 128, rangeY: 80, vx: 14, stateTimer: 19, vfxStyle: 'beast_wave', color: '#ef4444' }
    },
    quote: 'Ta nóng máy lên rồi đấy! Hỏa Long Hống!!',
    skills: {
      j: { cmd: 'J', bvnCode: 'ATTACK (砍1-4)', name: 'Hỏa Long Thiết Quyền Liên Kích', desc: 'Đấm đá bọc lửa 4 nhịp rực cháy, dồn sát thương áp sát cực đã tay.', dmg: 26, qiGain: 16, cooldown: 0, type: 'melee_combo', vfxStyle: 'beast_wave' },
      wj: { cmd: 'W + J', bvnCode: 'SKILL_2 (WJ)', name: 'Hỏa Long Dực Kích (Wing Attack)', desc: 'Vung hai cánh lửa hất tung đối thủ bay cao lên không.', dmg: 72, qiGain: 22, cooldown: 34, type: 'anti_air', vfxStyle: 'beast_wave' },
      sj: { cmd: 'S + J', bvnCode: 'SKILL_1 (SJ)', name: 'Hỏa Long Liên Hoàn Quyền', desc: 'Lao thẳng tới tung 5 cú đấm bọc hỏa diễm liên tiếp phá giáp.', dmg: 94, qiGain: 26, cooldown: 44, isBreakDef: true, type: 'multi_hit_rush', hits: 5, hitInterval: 4, rangeX: 126, rangeY: 80, dashSpeed: 12, vfxStyle: 'beast_wave', beamColor: '#f97316' },
      u: { cmd: 'U', bvnCode: 'ZHAO_1 (U)', name: 'Hỏa Long Hống (Fire Dragon Roar)', desc: 'Hít sâu rồi phun cột lửa sát long rực rỡ xuyên dài qua màn hình.', dmg: 74, qiGain: 22, cooldown: 40, isBreakDef: true, type: 'beam_laser', beamColor: '#f97316', beamWidth: 32, beamDuration: 20, vfxStyle: 'beast_wave' },
      wu: { cmd: 'W + U', bvnCode: 'ZHAO_3 (WU)', name: 'Hỏa Long Viêm Trửu (Hỏa Ngục Đốt Sàn)', desc: 'Rải ngọn lửa Sát Long thiêu đốt liên tục mặt sân và làm chậm kẻ địch.', dmg: 86, qiGain: 28, cooldown: 54, type: 'dot_hazard', duration: 210, tickInterval: 25, tickDmg: 22, radius: 110, slowMult: 0.7, vfxStyle: 'beast_wave', beamColor: '#ea580c', hazardLabel: 'HỎA LONG ĐỐT SÀN!' },
      su: { cmd: 'S + U', bvnCode: 'ZHAO_2 (SU)', name: 'Ăn Lửa & Khai Long Lực (Dragon Force)', desc: 'Nuốt ngọn lửa hồi phục thể lực và bùng nổ tốc độ + sức mạnh Sát Long.', dmg: 40, qiGain: 24, cooldown: 68, type: 'buff_install', speedBuff: 1.32, dmgBuff: 1.3, buffFrames: 280, healAmount: 65, beamColor: '#ef4444', vfxStyle: 'beast_wave' },
      i: { cmd: 'I (1 Nộ)', bvnCode: 'BISHA (I)', name: 'Lôi Viêm Long Hống (Lightning Flame Roar)', desc: 'Kết hợp lửa và sấm sét bắn luồng long tức hủy diệt tầm xa.', dmg: 195, qiCost: 100, cooldown: 42, isBreakDef: true, type: 'bisha_projectile', vfxStyle: 'lightning_bolt' },
      wi: { cmd: 'W + I (1 Nộ)', bvnCode: 'BISHA_UP (WI)', name: 'Hồng Liên Hỏa Long Quyền', desc: 'Lao vút lên trời rồi giáng cú đấm bão lửa cắm thẳng mục tiêu.', dmg: 198, qiCost: 100, cooldown: 44, isBreakDef: true, type: 'bisha_dive', vfxStyle: 'beast_wave' },
      si: { cmd: 'S + I (3 Nộ)', bvnCode: 'BISHA_SUPER (SI)', name: 'Diệt Long Áo Nghĩa: Hồng Liên Phượng Hoàng Kiếm', desc: 'Hóa toàn thân thành lưỡi kiếm phượng hoàng lửa lao xuyên không gian đốt cháy cả đấu trường.', dmg: 365, qiCost: 300, cooldown: 62, isBreakDef: true, type: 'domain_super', domainColor: '#ea580c', domainFrames: 95, domainLabel: 'HỒNG LIÊN PHƯỢNG HOÀNG KIẾM!', beamColor: '#fb923c', vfxStyle: 'beast_wave' }
    }
  },
  {
    id: 'erza',
    name: 'Erza Scarlet',
    title: 'Nữ Hoàng Tiên Tử (Titania) / Hoán Trang',
    universe: 'fairytail',
    universeLabel: 'Fairy Tail',
    difficulty: 'Trung bình',
    archetype: 'Kiếm thuật đa năng / Hoán trang phản đòn',
    hpMax: 1040,
    speed: 6.9,
    jumpPower: 15.3,
    colors: { primary: '#dc2626', secondary: '#cbd5e1', hair: '#b91c1c', aura: '#f87171', awakenAura: '#fbbf24' },
    awakenName: 'Clear Heart Clothing (Yêu Đao Hồng Anh)',
    meleeProfile: {
      j: { rangeX: 122, rangeY: 80, vx: 7.5, stateTimer: 12, vfxStyle: 'slash_arc', color: '#f87171' },
      wj: { rangeX: 118, rangeY: 98, vy: -15.3, stateTimer: 19, vfxStyle: 'slash_arc', color: '#e2e8f0' },
      sj: { rangeX: 136, rangeY: 82, vx: 14.5, stateTimer: 19, vfxStyle: 'slash_arc', color: '#dc2626' }
    },
    quote: 'Ngươi dám làm hại đồng đội của ta? Hoán Trang — Thiên Luân Chi Giáp!',
    skills: {
      j: { cmd: 'J', bvnCode: 'ATTACK (砍1-4)', name: 'Song Kiếm Titania Liên Trảm', desc: 'Vung song kiếm chém liên hoàn 4 nhịp chính xác và uy lực.', dmg: 26, qiGain: 15, cooldown: 0, type: 'melee_combo', vfxStyle: 'slash_arc' },
      wj: { cmd: 'W + J', bvnCode: 'SKILL_2 (WJ)', name: 'Hắc Dực Chi Giáp: Nguyệt Thiểm', desc: 'Đổi sang Hắc Dực Giáp chém hất tung đối thủ bằng đường kiếm ánh trăng.', dmg: 74, qiGain: 22, cooldown: 35, type: 'anti_air', vfxStyle: 'slash_arc' },
      sj: { cmd: 'S + J', bvnCode: 'SKILL_1 (SJ)', name: 'Phi Tường Giáp: Lôi Đột Kích', desc: 'Tăng tốc lao xuyên qua phòng thủ với đường chém chớp nhoáng.', dmg: 90, qiGain: 26, cooldown: 44, isBreakDef: true, type: 'dash_strike', vfxStyle: 'slash_arc' },
      u: { cmd: 'U', bvnCode: 'ZHAO_1 (U)', name: 'Thiên Luân Chi Giáp: Ngũ Kiếm Vũ', desc: 'Triệu hồi 5 thanh kiếm lơ lửng đồng loạt phóng thẳng về phía mục tiêu.', dmg: 64, qiGain: 20, cooldown: 34, type: 'multi_projectile', projCount: 5, projSpeed: 16, projSize: 18, projSpread: 0.22, beamColor: '#e2e8f0', vfxStyle: 'blade_volley' },
      wu: { cmd: 'W + U', bvnCode: 'ZHAO_3 (WU)', name: 'Yêu Đao Hồng Anh (Benizakura)', desc: 'Dịch chuyển để lại tàn ảnh rồi tung nhát chém hoa anh đào đỏ trễ.', dmg: 94, qiGain: 28, cooldown: 50, isBreakDef: true, type: 'ghost_followup', delayFrames: 11, rangeX: 136, rangeY: 84, dashToTarget: true, vfxStyle: 'slash_arc', beamColor: '#f43f5e' },
      su: { cmd: 'S + U', bvnCode: 'ZHAO_2 (SU)', name: 'Kim Cương Chi Giáp (Adamantine Counter)', desc: 'Hoán trang giáp Kim Cương chặn đứng và phản kích ngay lập tức.', dmg: 76, qiGain: 24, cooldown: 52, isBreakDef: true, type: 'true_counter', windowFrames: 24, counterMult: 1.45, counterRangeX: 155, vfxStyle: 'slash_arc', beamColor: '#cbd5e1', counterLabel: 'KIM CƯƠNG CHI GIÁP!' },
      i: { cmd: 'I (1 Nộ)', bvnCode: 'BISHA (I)', name: 'Viêm Đế Chi Giáp: Hỏa Kiếm Khí', desc: 'Vung đại kiếm lửa phóng sóng hỏa diễm khổng lồ thiêu đốt phía trước.', dmg: 192, qiCost: 100, cooldown: 42, isBreakDef: true, type: 'bisha_projectile', vfxStyle: 'slash_arc' },
      wi: { cmd: 'W + I (1 Nộ)', bvnCode: 'BISHA_UP (WI)', name: 'Luyện Ngục Chi Giáp: Trọng Kiếm Trụy', desc: 'Nhảy cao rồi giáng thanh đại kiếm gai đen nghiền nát mục tiêu.', dmg: 198, qiCost: 100, cooldown: 44, isBreakDef: true, type: 'bisha_dive', vfxStyle: 'slash_arc' },
      si: { cmd: 'S + I (3 Nộ)', bvnCode: 'BISHA_SUPER (SI)', name: 'Thiên Luân: Nhị Bách Kiếm Phán Quyết (Blumenblatt)', desc: 'Mở vòm kiếm 200 thanh vây kín bầu trời đồng loạt giáng xuống xé nát đối thủ.', dmg: 360, qiCost: 300, cooldown: 62, isBreakDef: true, type: 'domain_super', domainColor: '#dc2626', domainFrames: 95, domainLabel: 'THIÊN LUÂN: NHỊ BÁCH KIẾM!', beamColor: '#f8fafc', vfxStyle: 'blade_volley' }
    }
  },

  // ==================== 4. SEVEN DEADLY SINS ====================
  {
    id: 'meliodas',
    name: 'Meliodas',
    title: 'Phẫn Nộ Chi Long / Đội Trưởng Thất Hình Đại Tội',
    universe: 'sds',
    universeLabel: 'Seven Deadly Sins',
    difficulty: 'Trung bình',
    archetype: 'Toàn Phản Kích / Ma thần bùng nổ',
    hpMax: 1060,
    speed: 7.3,
    jumpPower: 15.8,
    colors: { primary: '#eab308', secondary: '#1e1b4b', hair: '#fde047', aura: '#7c3aed', awakenAura: '#4c1d95' },
    awakenName: 'Assault Mode (Thống Lĩnh Ma Thần)',
    awakenedForm: {
      name: 'Assault Mode (Thống Lĩnh Ma Thần)',
      dmgMult: 1.38,
      speedMult: 1.24,
      superArmorHits: 2,
      auraColor: '#7c3aed'
    },
    meleeProfile: {
      j: { rangeX: 112, rangeY: 78, vx: 8.5, stateTimer: 11, vfxStyle: 'slash_arc', color: '#a855f7' },
      wj: { rangeX: 108, rangeY: 96, vy: -15.8, stateTimer: 18, vfxStyle: 'slash_arc', color: '#7c3aed' },
      sj: { rangeX: 132, rangeY: 82, vx: 15, stateTimer: 18, vfxStyle: 'slash_arc', color: '#c084fc' }
    },
    quote: 'Sate sate sate... Đòn đó thú vị đấy, để ta Toàn Phản Kích lại cho!',
    skills: {
      j: { cmd: 'J', bvnCode: 'ATTACK (砍1-4)', name: 'Thần Khí Lostvayne Liên Trảm', desc: 'Chém nhanh 4 nhịp bằng đoản kiếm Lostvayne kết hợp tàn ảnh phân thân.', dmg: 26, qiGain: 16, cooldown: 0, type: 'melee_combo', vfxStyle: 'slash_arc' },
      wj: { cmd: 'W + J', bvnCode: 'SKILL_2 (WJ)', name: 'Hắc Dực Hất Tung', desc: 'Bung đôi cánh hắc ám chém ngược lên không hất văng kẻ địch.', dmg: 74, qiGain: 22, cooldown: 34, type: 'anti_air', vfxStyle: 'slash_arc' },
      sj: { cmd: 'S + J', bvnCode: 'SKILL_1 (SJ)', name: 'Thần Thiên Trảm (Kami Chigiri)', desc: 'Lao cực nhanh chém 7 nhát liên hoàn trong tích tắc phá vỡ phòng ngự.', dmg: 102, qiGain: 28, cooldown: 46, isBreakDef: true, type: 'multi_hit_rush', hits: 7, hitInterval: 4, rangeX: 134, rangeY: 84, dashSpeed: 13, vfxStyle: 'slash_arc', beamColor: '#a855f7' },
      u: { cmd: 'U', bvnCode: 'ZHAO_1 (U)', name: 'Hắc Viêm Trảm (Hellblaze Slash)', desc: 'Phóng lưỡi hỏa diễm tím đen cháy âm ỉ không thể dập tắt.', dmg: 64, qiGain: 20, cooldown: 32, type: 'projectile', projSpeed: 15, projSize: 24, vfxStyle: 'slash_arc', beamColor: '#7c3aed' },
      wu: { cmd: 'W + U', bvnCode: 'ZHAO_3 (WU)', name: 'Địa Ngục Diệm Bộc Phát (Hellblaze Burst)', desc: 'Kích nổ cột lửa ma thần tím đen thiêu rụi khu vực xung quanh.', dmg: 92, qiGain: 28, cooldown: 52, isBreakDef: true, type: 'aoe_burst', vfxStyle: 'beast_wave', beamColor: '#7c3aed' },
      su: { cmd: 'S + U', bvnCode: 'ZHAO_2 (SU)', name: 'Full Counter (Toàn Phản Kích)', desc: 'Vung Lostvayne vào thế phản đòn, hóa giải mọi sát thương và phản công gấp 1.55 lần!', dmg: 88, qiGain: 26, cooldown: 48, isBreakDef: true, type: 'true_counter', windowFrames: 28, counterMult: 1.55, counterRangeX: 170, vfxStyle: 'slash_arc', beamColor: '#facc15', counterLabel: 'FULL COUNTER!!' },
      i: { cmd: 'I (1 Nộ)', bvnCode: 'BISHA (I)', name: 'Lostvayne: Phân Thân Toàn Phản Kích', desc: 'Triệu hồi phân thân Lostvayne phóng sóng hắc ma lực càn quét phía trước.', dmg: 195, qiCost: 100, cooldown: 40, isBreakDef: true, type: 'bisha_projectile', vfxStyle: 'slash_arc' },
      wi: { cmd: 'W + I (1 Nộ)', bvnCode: 'BISHA_UP (WI)', name: 'Phản Kích Phục Thù (Revenge Counter)', desc: 'Dồn toàn bộ ma lực hắc ám nhảy vọt lên giáng nhát chém hủy diệt xuống mặt đất.', dmg: 205, qiCost: 100, cooldown: 45, isBreakDef: true, type: 'bisha_dive', vfxStyle: 'beast_wave' },
      si: { cmd: 'S + I (3 Nộ)', bvnCode: 'BISHA_SUPER (SI)', name: 'Ma Thần Tối Thượng: Trillion Dark', desc: 'Phủ bóng tối Ma Giới lên toàn sân đấu, triệu hồi hàng ngàn hắc cầu xuyên nát kẻ địch.', dmg: 370, qiCost: 300, cooldown: 62, isBreakDef: true, type: 'domain_super', domainColor: '#581c87', domainFrames: 100, domainLabel: 'TRILLION DARK!!', beamColor: '#a855f7', vfxStyle: 'orb' }
    },
    awakenedSkills: {
      wu: { cmd: 'W + U', bvnCode: 'ZHAO_3 (WU)', name: 'Thần Thiên Ma Trảm: Hắc Ngục', desc: 'Phóng vùng hắc hỏa Ma Giới đốt cháy và làm chậm kẻ địch liên tục.', dmg: 96, qiGain: 28, cooldown: 50, isBreakDef: true, type: 'dot_hazard', duration: 220, tickInterval: 24, tickDmg: 24, radius: 115, slowMult: 0.65, vfxStyle: 'beast_wave', beamColor: '#6d28d9', hazardLabel: 'HẮC NGỤC MA GIỚI!' }
    }
  },

  // ==================== 5. MY HERO ACADEMIA ====================
  {
    id: 'deku',
    name: 'Izuku Midoriya (Deku)',
    title: 'Người Kế Thừa One For All Đời Thứ 9',
    universe: 'mha',
    universeLabel: 'My Hero Academia',
    difficulty: 'Dễ (Khuyên dùng)',
    archetype: 'Tốc độ cao / Blackwhip khống chế & Combo',
    hpMax: 1010,
    speed: 7.5,
    jumpPower: 16.4,
    colors: { primary: '#16a34a', secondary: '#dc2626', hair: '#15803d', aura: '#22c55e', awakenAura: '#38bdf8' },
    awakenName: 'One For All: Full Cowl 100% + Gearshift',
    awakenedForm: {
      name: 'One For All 100% + Gearshift',
      dmgMult: 1.36,
      speedMult: 1.28,
      auraColor: '#38bdf8'
    },
    meleeProfile: {
      j: { rangeX: 106, rangeY: 76, vx: 9, stateTimer: 10, vfxStyle: 'lightning_bolt', color: '#4ade80' },
      wj: { rangeX: 104, rangeY: 96, vy: -16.4, stateTimer: 17, vfxStyle: 'lightning_bolt', color: '#22c55e' },
      sj: { rangeX: 128, rangeY: 78, vx: 15.5, stateTimer: 17, vfxStyle: 'lightning_bolt', color: '#38bdf8' }
    },
    quote: 'PLUS ULTRA!! Vì ta đã có mặt ở đây rồi!',
    skills: {
      j: { cmd: 'J', bvnCode: 'ATTACK (砍1-4)', name: 'Shoot Style Liên Hoàn Cước', desc: 'Tung 4 cú đá tốc độ cao mang theo tia sét xanh One For All.', dmg: 25, qiGain: 16, cooldown: 0, type: 'melee_combo', vfxStyle: 'lightning_bolt' },
      wj: { cmd: 'W + J', bvnCode: 'SKILL_2 (WJ)', name: 'Manchester Smash Rising', desc: 'Lộn vòng đá móc từ dưới lên kết hợp roi đen Blackwhip hất tung.', dmg: 72, qiGain: 22, cooldown: 34, type: 'anti_air', vfxStyle: 'lightning_bolt' },
      sj: { cmd: 'S + J', bvnCode: 'SKILL_1 (SJ)', name: 'St. Louis Smash — Liên Hoàn Cước', desc: 'Lao vút tới tung 5 cú đá xoay sấm sét phá vỡ phòng thủ đối thủ.', dmg: 94, qiGain: 26, cooldown: 44, isBreakDef: true, type: 'multi_hit_rush', hits: 5, hitInterval: 4, rangeX: 126, rangeY: 80, dashSpeed: 13, vfxStyle: 'lightning_bolt', beamColor: '#22c55e' },
      u: { cmd: 'U', bvnCode: 'ZHAO_1 (U)', name: 'Delaware Smash Air Force', desc: 'Búng tay phóng 3 luồng áp suất gió cực mạnh đẩy lùi đối phương.', dmg: 58, qiGain: 20, cooldown: 32, type: 'multi_projectile', projCount: 3, projSpeed: 16, projSize: 20, projSpread: 0.18, beamColor: '#4ade80', vfxStyle: 'spiral_orb' },
      wu: { cmd: 'W + U', bvnCode: 'ZHAO_3 (WU)', name: 'Blackwhip: Trói Buộc Hắc Tiên', desc: 'Phóng xúc tu năng lượng đen tóm chặt mục tiêu, quật đa nhịp phá giáp.', dmg: 92, qiGain: 26, cooldown: 54, isBreakDef: true, type: 'command_grab', grabRangeX: 170, holdFrames: 34, ticks: 3, vfxStyle: 'slash_arc', beamColor: '#16a34a', grabLabel: 'BLACKWHIP GRAB!!' },
      su: { cmd: 'S + U', bvnCode: 'ZHAO_2 (SU)', name: 'Full Cowl + Fa Jin Tích Năng', desc: 'Kích hoạt sét xanh toàn thân tăng vượt bậc tốc độ di chuyển và lực đánh.', dmg: 40, qiGain: 24, cooldown: 66, type: 'buff_install', speedBuff: 1.4, dmgBuff: 1.28, buffFrames: 290, healAmount: 50, beamColor: '#22c55e', vfxStyle: 'lightning_bolt' },
      i: { cmd: 'I (1 Nộ)', bvnCode: 'BISHA (I)', name: 'Detroit Smash: Xung Kích Áp Suất', desc: 'Tung cú đấm One For All tạo chùm áp lực khí quyển xuyên thẳng toàn màn hình.', dmg: 194, qiCost: 100, cooldown: 42, isBreakDef: true, type: 'beam_laser', beamColor: '#4ade80', beamWidth: 38, beamDuration: 22, vfxStyle: 'lightning_bolt' },
      wi: { cmd: 'W + I (1 Nộ)', bvnCode: 'BISHA_UP (WI)', name: 'Delaware Detroit Smash Trụy Lạc', desc: 'Bật nhảy siêu tốc rồi giáng gót chân sấm sét xuống mặt sân.', dmg: 198, qiCost: 100, cooldown: 44, isBreakDef: true, type: 'bisha_dive', vfxStyle: 'lightning_bolt' },
      si: { cmd: 'S + I (3 Nộ)', bvnCode: 'BISHA_SUPER (SI)', name: 'United States of World Smash: Gearshift', desc: 'Bẻ cong định luật quán tính, tung chuỗi 5 đòn liên thanh sấm sét xanh-đỏ xé toạc bầu trời.', dmg: 365, qiCost: 300, cooldown: 62, isBreakDef: true, type: 'domain_super', domainColor: '#15803d', domainFrames: 95, domainLabel: 'PLUS ULTRA!! 100% SMASH!', beamColor: '#38bdf8', vfxStyle: 'lightning_bolt' }
    }
  },
  {
    id: 'bakugo',
    name: 'Katsuki Bakugo',
    title: 'Đại Bộc Sát Thần Dynamight',
    universe: 'mha',
    universeLabel: 'My Hero Academia',
    difficulty: 'Trung bình',
    archetype: 'Cơ động trên không / Bùng nổ áp đảo',
    hpMax: 990,
    speed: 7.6,
    jumpPower: 16.3,
    colors: { primary: '#f97316', secondary: '#0f172a', hair: '#fde047', aura: '#fb923c', awakenAura: '#facc15' },
    awakenName: 'Cluster Awakening (Bộc Phá Tập Trung)',
    meleeProfile: {
      j: { rangeX: 106, rangeY: 76, vx: 9, stateTimer: 10, vfxStyle: 'orb', color: '#fb923c' },
      wj: { rangeX: 106, rangeY: 96, vy: -16.3, stateTimer: 17, vfxStyle: 'orb', color: '#f97316' },
      sj: { rangeX: 130, rangeY: 80, vx: 16, stateTimer: 17, vfxStyle: 'orb', color: '#facc15' }
    },
    quote: 'CHẾT ĐI!! Đừng hòng vượt qua ta — SHINE!!',
    skills: {
      j: { cmd: 'J', bvnCode: 'ATTACK (砍1-4)', name: 'Liên Hoàn Nổ Sát (Explosion Combo)', desc: 'Tung 4 đòn đấm kèm vụ nổ nhiệt áp sát tầm gần cực rát.', dmg: 26, qiGain: 16, cooldown: 0, type: 'melee_combo', vfxStyle: 'orb' },
      wj: { cmd: 'W + J', bvnCode: 'SKILL_2 (WJ)', name: 'Explosive Upper Launch', desc: 'Kích nổ dưới chân xoay người đấm móc hất tung đối thủ.', dmg: 74, qiGain: 22, cooldown: 34, type: 'anti_air', vfxStyle: 'orb' },
      sj: { cmd: 'S + J', bvnCode: 'SKILL_1 (SJ)', name: 'Explosive Speed Rush', desc: 'Dùng lực đẩy vụ nổ phóng thẳng như tên lửa áp sát phá giáp.', dmg: 90, qiGain: 26, cooldown: 44, isBreakDef: true, type: 'dash_strike', vfxStyle: 'orb' },
      u: { cmd: 'U', bvnCode: 'ZHAO_1 (U)', name: 'AP Shot: Auto-Cannon', desc: 'Bắn liên tiếp 4 tia nổ xuyên giáp tập trung tầm xa cực nhanh.', dmg: 60, qiGain: 20, cooldown: 32, type: 'multi_projectile', projCount: 4, projSpeed: 16, projSize: 16, projSpread: 0.16, beamColor: '#fb923c', vfxStyle: 'orb' },
      wu: { cmd: 'W + U', bvnCode: 'ZHAO_3 (WU)', name: 'Cluster Minefield (Vùng Nitro Phát Nổ)', desc: 'Rải mồ hôi nitro bốc cháy dưới sàn gây nổ liên hoàn và làm chậm mục tiêu.', dmg: 88, qiGain: 28, cooldown: 54, isBreakDef: true, type: 'dot_hazard', duration: 200, tickInterval: 24, tickDmg: 22, radius: 105, slowMult: 0.68, vfxStyle: 'orb', beamColor: '#f97316', hazardLabel: 'CLUSTER NITRO!' },
      su: { cmd: 'S + U', bvnCode: 'ZHAO_2 (SU)', name: 'Bộc Phá Phản Đòn (Blast Counter)', desc: 'Kích nổ tức thì ngay khi bị tấn công để hóa giải và hất tung kẻ địch.', dmg: 76, qiGain: 24, cooldown: 48, isBreakDef: true, type: 'true_counter', windowFrames: 23, counterMult: 1.45, counterRangeX: 155, vfxStyle: 'orb', beamColor: '#facc15', counterLabel: 'SHINE! PHẢN NỔ!' },
      i: { cmd: 'I (1 Nộ)', bvnCode: 'BISHA (I)', name: 'Grenadier Bracer: Đại Pháo Nổ', desc: 'Giật chốt găng tay lựu đạn phóng chùm nổ hỏa lực xuyên toàn màn hình.', dmg: 196, qiCost: 100, cooldown: 42, isBreakDef: true, type: 'beam_laser', beamColor: '#f97316', beamWidth: 42, beamDuration: 22, vfxStyle: 'orb' },
      wi: { cmd: 'W + I (1 Nộ)', bvnCode: 'BISHA_UP (WI)', name: 'Howitzer Impact (Cơn Lốc Oanh Tạc)', desc: 'Xoay tròn trên không tích tụ oxy rồi lao cắm xuống tạo siêu vụ nổ.', dmg: 205, qiCost: 100, cooldown: 45, isBreakDef: true, type: 'bisha_dive', vfxStyle: 'spiral_orb' },
      si: { cmd: 'S + I (3 Nộ)', bvnCode: 'BISHA_SUPER (SI)', name: 'Howitzer Impact: Cluster Supernova', desc: 'Tạo siêu bão nổ màu cam rực nuốt trọn không gian, thiêu rụi mọi mục tiêu.', dmg: 365, qiCost: 300, cooldown: 62, isBreakDef: true, type: 'domain_super', domainColor: '#ea580c', domainFrames: 95, domainLabel: 'HOWITZER IMPACT CLUSTER!', beamColor: '#fde047', vfxStyle: 'spiral_orb' }
    }
  },

  // ==================== 6. ATTACK ON TITAN ====================
  {
    id: 'eren',
    name: 'Eren Yeager',
    title: 'Titan Tiến Công & Titan Thủy Tổ',
    universe: 'aot',
    universeLabel: 'Attack on Titan',
    difficulty: 'Trung bình',
    archetype: 'Cơ động 3D / Hóa Titan Khổng Lồ phá giáp',
    hpMax: 1080,
    speed: 7.4,
    jumpPower: 16.3,
    colors: { primary: '#65a30d', secondary: '#451a03', hair: '#292524', aura: '#eab308', awakenAura: '#dc2626' },
    awakenName: 'Attack & Founding Titan (Titan Tiến Công)',
    awakenedForm: {
      name: 'Titan Tiến Công (Attack Titan)',
      scaleMult: 1.32,
      dmgMult: 1.38,
      speedMult: 1.15,
      superArmorHits: 2,
      auraColor: '#dc2626'
    },
    meleeProfile: {
      j: { rangeX: 118, rangeY: 78, vx: 8.5, stateTimer: 11, vfxStyle: 'slash_arc', color: '#84cc16' },
      wj: { rangeX: 114, rangeY: 100, vy: -16.3, stateTimer: 18, vfxStyle: 'slash_arc', color: '#eab308' },
      sj: { rangeX: 136, rangeY: 84, vx: 14.5, stateTimer: 19, vfxStyle: 'beast_wave', color: '#dc2626' }
    },
    quote: 'Tatakae! Chiến đấu đi! Ta sẽ không ngừng tiến về phía trước!',
    skills: {
      j: { cmd: 'J', bvnCode: 'ATTACK (砍1-4)', name: 'Song Đao Trinh Sát Liên Trảm', desc: 'Chém xoay 4 nhịp bằng lưỡi thép siêu cứng kết hợp dây móc 3D.', dmg: 25, qiGain: 16, cooldown: 0, type: 'melee_combo', vfxStyle: 'slash_arc' },
      wj: { cmd: 'W + J', bvnCode: 'SKILL_2 (WJ)', name: 'Bắn Dây Cơ Động Hất Tung', desc: 'Phóng móc neo kéo người bay xéo lên trời chém đôi mục tiêu.', dmg: 72, qiGain: 22, cooldown: 34, type: 'anti_air', vfxStyle: 'slash_arc' },
      sj: { cmd: 'S + J', bvnCode: 'SKILL_1 (SJ)', name: 'Thiết Quyền Titan Kết Tinh', desc: 'Hóa nắm tay Titan bọc pha lê cứng lao tới đấm vỡ nát phòng thủ.', dmg: 94, qiGain: 28, cooldown: 45, isBreakDef: true, type: 'dash_strike', vfxStyle: 'beast_wave' },
      u: { cmd: 'U', bvnCode: 'ZHAO_1 (U)', name: 'Thương Sét (Thunder Spears Volley)', desc: 'Phóng 3 mũi Thương Sét nổ chậm gây sát thương xuyên giáp tầm xa.', dmg: 64, qiGain: 20, cooldown: 36, type: 'multi_projectile', projCount: 3, projSpeed: 15, projSize: 18, projSpread: 0.16, beamColor: '#facc15', vfxStyle: 'blade_volley' },
      wu: { cmd: 'W + U', bvnCode: 'ZHAO_3 (WU)', name: 'Sét Biến Hình Titan (Titan Lightning)', desc: 'Gọi cột sét vàng rực giáng xuống biến hóa tạo vụ nổ chấn động xung quanh.', dmg: 94, qiGain: 28, cooldown: 54, isBreakDef: true, type: 'aoe_burst', vfxStyle: 'lightning_bolt', beamColor: '#facc15' },
      su: { cmd: 'S + U', bvnCode: 'ZHAO_2 (SU)', name: 'Hơi Nóng Tái Tạo Titan', desc: 'Tỏa khói tái tạo tế bào Titan giúp hồi mạnh HP và tăng lực công.', dmg: 35, qiGain: 22, cooldown: 70, type: 'buff_install', speedBuff: 1.25, dmgBuff: 1.3, buffFrames: 280, healAmount: 85, beamColor: '#eab308', vfxStyle: 'beast_wave' },
      i: { cmd: 'I (1 Nộ)', bvnCode: 'BISHA (I)', name: 'Tiếng Gầm Titan Tiến Công', desc: 'Phóng sóng xung kích từ tiếng gầm Titan thổi bay đối thủ toàn màn hình.', dmg: 192, qiCost: 100, cooldown: 42, isBreakDef: true, type: 'bisha_projectile', vfxStyle: 'beast_wave' },
      wi: { cmd: 'W + I (1 Nộ)', bvnCode: 'BISHA_UP (WI)', name: 'Trọng Chùy Titan Búa Chiến (War Hammer)', desc: 'Tạo đại chùy gai trắng từ không khí giáng thẳng xuống nghiền nát kẻ địch.', dmg: 202, qiCost: 100, cooldown: 45, isBreakDef: true, type: 'bisha_dive', vfxStyle: 'beast_wave' },
      si: { cmd: 'S + I (3 Nộ)', bvnCode: 'BISHA_SUPER (SI)', name: 'Địa Chấn — The Rumbling (Rung Chuyển Thế Giới)', desc: 'Bầu trời rực lửa hơi nước, hàng loạt Titan Khổng Lồ giẫm nát toàn bộ chiến trường.', dmg: 375, qiCost: 300, cooldown: 64, isBreakDef: true, type: 'domain_super', domainColor: '#b91c1c', domainFrames: 100, domainLabel: 'THE RUMBLING!!', beamColor: '#f97316', vfxStyle: 'beast_wave' }
    },
    awakenedSkills: {
      sj: { cmd: 'S + J', bvnCode: 'SKILL_1 (SJ)', name: 'Titan Cuồng Quyền Liên Hoàn', desc: 'Nghiền nát đối thủ bằng 5 cú đấm Titan pha lê hóa liên tiếp siêu giáp.', dmg: 118, qiGain: 28, cooldown: 44, isBreakDef: true, type: 'multi_hit_rush', hits: 5, hitInterval: 5, rangeX: 148, rangeY: 92, dashSpeed: 12, vfxStyle: 'beast_wave', beamColor: '#dc2626' },
      wu: { cmd: 'W + U', bvnCode: 'ZHAO_3 (WU)', name: 'Khóa Cứng Titan Khổng Lồ (Titan Slam)', desc: 'Tóm chặt kẻ địch bằng bàn tay Titan khổng lồ rồi đập nát xuống mặt đất.', dmg: 106, qiGain: 28, cooldown: 54, isBreakDef: true, type: 'command_grab', grabRangeX: 160, holdFrames: 36, ticks: 3, vfxStyle: 'beast_wave', beamColor: '#ef4444', grabLabel: 'TITAN SLAM!!' }
    }
  },

  // ==================== 7. TOKYO GHOUL ====================
  {
    id: 'kaneki',
    name: 'Ken Kaneki',
    title: 'Độc Nhãn Vương / Rết Độc Kakuja',
    universe: 'tokyoghoul',
    universeLabel: 'Tokyo Ghoul',
    difficulty: 'Trung bình',
    archetype: 'Kagune tầm trung / Tốc độ & Hồi phục',
    hpMax: 980,
    speed: 7.7,
    jumpPower: 15.9,
    colors: { primary: '#dc2626', secondary: '#09090b', hair: '#f8fafc', aura: '#ef4444', awakenAura: '#991b1b' },
    awakenName: 'Centipede Kakuja (Bán Hách Giả Rết Độc)',
    awakenedForm: {
      name: 'Centipede Kakuja (Rết Độc Thức Tỉnh)',
      dmgMult: 1.36,
      speedMult: 1.24,
      superArmorHits: 2,
      auraColor: '#dc2626'
    },
    meleeProfile: {
      j: { rangeX: 134, rangeY: 80, vx: 8, stateTimer: 12, vfxStyle: 'slash_arc', color: '#dc2626' },
      wj: { rangeX: 126, rangeY: 100, vy: -15.9, stateTimer: 19, vfxStyle: 'slash_arc', color: '#ef4444' },
      sj: { rangeX: 144, rangeY: 82, vx: 15, stateTimer: 18, vfxStyle: 'slash_arc', color: '#991b1b' }
    },
    quote: '1000 trừ 7 bằng bao nhiêu?... Sai rồi, thế giới này mới là thứ sai trái.',
    skills: {
      j: { cmd: 'J', bvnCode: 'ATTACK (砍1-4)', name: 'Lân Hách Kagune Liên Kích', desc: 'Quất 4 xúc tu Kagune đỏ thẫm liên tiếp với tầm đánh rộng.', dmg: 25, qiGain: 16, cooldown: 0, type: 'melee_combo', vfxStyle: 'slash_arc' },
      wj: { cmd: 'W + J', bvnCode: 'SKILL_2 (WJ)', name: 'Kagune Xuyên Thiên', desc: 'Đâm ngược 4 đuôi Kagune lên không trung xé toạc đối thủ.', dmg: 74, qiGain: 22, cooldown: 34, type: 'anti_air', vfxStyle: 'slash_arc' },
      sj: { cmd: 'S + J', bvnCode: 'SKILL_1 (SJ)', name: 'Độc Nhãn Đột Kích', desc: 'Lao vút đi như bóng ma cào xé 5 nhát liên tiếp phá giáp.', dmg: 94, qiGain: 26, cooldown: 44, isBreakDef: true, type: 'multi_hit_rush', hits: 5, hitInterval: 4, rangeX: 136, rangeY: 82, dashSpeed: 13, vfxStyle: 'slash_arc', beamColor: '#dc2626' },
      u: { cmd: 'U', bvnCode: 'ZHAO_1 (U)', name: 'Tứ Vĩ Huyết Tiễn (Kagune Volley)', desc: 'Phóng 4 mũi gai RC đỏ thẫm xuyên nhanh về phía trước.', dmg: 60, qiGain: 20, cooldown: 32, type: 'multi_projectile', projCount: 4, projSpeed: 16, projSize: 18, projSpread: 0.2, beamColor: '#dc2626', vfxStyle: 'blade_volley' },
      wu: { cmd: 'W + U', bvnCode: 'ZHAO_3 (WU)', name: 'Hách Giả Trói Xuyên (Kakuja Bind)', desc: 'Quấn xúc tu Kagune trói chặt đối thủ và xé rách đa nhịp.', dmg: 94, qiGain: 28, cooldown: 54, isBreakDef: true, type: 'command_grab', grabRangeX: 165, holdFrames: 34, ticks: 3, vfxStyle: 'slash_arc', beamColor: '#dc2626', grabLabel: 'KAKUJA BIND!!' },
      su: { cmd: 'S + U', bvnCode: 'ZHAO_2 (SU)', name: 'Bẻ Ngón Tay: Trạng Thái Tóc Trắng', desc: 'Thức tỉnh tế bào RC giúp hồi HP, tăng tốc độ và sát thương xé nát.', dmg: 40, qiGain: 24, cooldown: 68, type: 'buff_install', speedBuff: 1.38, dmgBuff: 1.28, buffFrames: 280, healAmount: 65, beamColor: '#dc2626', vfxStyle: 'beast_wave' },
      i: { cmd: 'I (1 Nộ)', bvnCode: 'BISHA (I)', name: 'Huyết Long Xung Kích', desc: 'Phóng đầu rồng Kagune khổng lồ lao dọc sân đấu cắn xé mục tiêu.', dmg: 194, qiCost: 100, cooldown: 42, isBreakDef: true, type: 'bisha_projectile', vfxStyle: 'beast_wave' },
      wi: { cmd: 'W + I (1 Nộ)', bvnCode: 'BISHA_UP (WI)', name: 'Rết Độc Thiên Giáng (Centipede Drop)', desc: 'Bật cao cuốn thân bằng giáp rết rồi bổ thẳng xuống mặt đất.', dmg: 198, qiCost: 100, cooldown: 44, isBreakDef: true, type: 'bisha_dive', vfxStyle: 'slash_arc' },
      si: { cmd: 'S + I (3 Nộ)', bvnCode: 'BISHA_SUPER (SI)', name: 'Huyết Sắc Độc Nhãn Vương: Cơn Bão Kagune', desc: 'Nhuộm đỏ thẫm chiến trường, giải phóng hàng chục xúc tu rồng xé nát mọi vật cản.', dmg: 365, qiCost: 300, cooldown: 62, isBreakDef: true, type: 'domain_super', domainColor: '#991b1b', domainFrames: 95, domainLabel: 'ONE-EYED KING KAGUJA!', beamColor: '#ef4444', vfxStyle: 'slash_arc' }
    }
  },

  // ==================== 8. SWORD ART ONLINE ====================
  {
    id: 'kirito',
    name: 'Kirito',
    title: 'Hắc Kiếm Sĩ / Song Kiếm Aincrad',
    universe: 'sao',
    universeLabel: 'Sword Art Online',
    difficulty: 'Dễ (Khuyên dùng)',
    archetype: 'Song kiếm siêu tốc / Combo liên hoàn',
    hpMax: 970,
    speed: 7.9,
    jumpPower: 15.8,
    colors: { primary: '#0f172a', secondary: '#38bdf8', hair: '#020617', aura: '#0ea5e9', awakenAura: '#facc15' },
    awakenName: 'Dual Blades: Release Recollection (Giải Phóng Ký Ức)',
    meleeProfile: {
      j: { rangeX: 114, rangeY: 76, vx: 9, stateTimer: 10, vfxStyle: 'slash_arc', color: '#38bdf8' },
      wj: { rangeX: 112, rangeY: 96, vy: -15.8, stateTimer: 17, vfxStyle: 'slash_arc', color: '#7dd3fc' },
      sj: { rangeX: 132, rangeY: 80, vx: 16, stateTimer: 17, vfxStyle: 'slash_arc', color: '#0ea5e9' }
    },
    quote: 'Kỹ năng độc nhất: Song Kiếm! Starburst Stream!!',
    skills: {
      j: { cmd: 'J', bvnCode: 'ATTACK (砍1-4)', name: 'Elucidator & Dark Repulser Combo', desc: 'Vung hai thanh hắc-lam kiếm chém 4 nhịp tốc độ chớp nhoáng.', dmg: 25, qiGain: 16, cooldown: 0, type: 'melee_combo', vfxStyle: 'slash_arc' },
      wj: { cmd: 'W + J', bvnCode: 'SKILL_2 (WJ)', name: 'Vertical Square (Tứ Phương Thượng Trảm)', desc: 'Chém vẽ hình vuông ánh lam hất tung đối thủ lên không trung.', dmg: 72, qiGain: 22, cooldown: 34, type: 'anti_air', vfxStyle: 'slash_arc' },
      sj: { cmd: 'S + J', bvnCode: 'SKILL_1 (SJ)', name: 'Sonic Leap — Liên Trảm Song Kiếm', desc: 'Lao đi với vệt sáng xanh rực xả 6 nhát song kiếm xuyên phòng thủ.', dmg: 96, qiGain: 26, cooldown: 44, isBreakDef: true, type: 'multi_hit_rush', hits: 6, hitInterval: 4, rangeX: 130, rangeY: 82, dashSpeed: 14, vfxStyle: 'slash_arc', beamColor: '#38bdf8' },
      u: { cmd: 'U', bvnCode: 'ZHAO_1 (U)', name: 'Song Kiếm Khí Xuyên Tâm', desc: 'Chém chéo phóng 3 luồng kiếm khí đen-xanh ngọc lướt nhanh trên sân.', dmg: 60, qiGain: 20, cooldown: 32, type: 'multi_projectile', projCount: 3, projSpeed: 16, projSize: 20, projSpread: 0.16, beamColor: '#38bdf8', vfxStyle: 'blade_volley' },
      wu: { cmd: 'W + U', bvnCode: 'ZHAO_3 (WU)', name: 'Vorpal Strike (Kiếm Quang Đâm Xuyên)', desc: 'Phóng tia kiếm khí tím-xanh xuyên thẳng ngang màn hình trong chớp mắt.', dmg: 88, qiGain: 26, cooldown: 50, isBreakDef: true, type: 'beam_laser', beamColor: '#38bdf8', beamWidth: 28, beamDuration: 18, vfxStyle: 'slash_arc' },
      su: { cmd: 'S + U', bvnCode: 'ZHAO_2 (SU)', name: 'Song Kiếm Phản Đòn (Sword Parry)', desc: 'Bắt chéo hai thanh kiếm gạt đòn và chém phản kích chớp nhoáng.', dmg: 74, qiGain: 24, cooldown: 48, isBreakDef: true, type: 'true_counter', windowFrames: 24, counterMult: 1.45, counterRangeX: 150, vfxStyle: 'slash_arc', beamColor: '#facc15', counterLabel: 'DUAL PARRY!' },
      i: { cmd: 'I (1 Nộ)', bvnCode: 'BISHA (I)', name: 'Night Sky Sword: Giải Phóng Bầu Trời Đêm', desc: 'Tung luồng tinh quang hắc ám khổng lồ cuốn phăng mọi mục tiêu.', dmg: 194, qiCost: 100, cooldown: 42, isBreakDef: true, type: 'bisha_projectile', vfxStyle: 'slash_arc' },
      wi: { cmd: 'W + I (1 Nộ)', bvnCode: 'BISHA_UP (WI)', name: 'Eclipse (Nhật Thực Trảm)', desc: 'Nhảy vọt lên rồi xoay song kiếm bổ chém như sao băng rơi xuống.', dmg: 198, qiCost: 100, cooldown: 44, isBreakDef: true, type: 'bisha_dive', vfxStyle: 'slash_arc' },
      si: { cmd: 'S + I (3 Nộ)', bvnCode: 'BISHA_SUPER (SI)', name: 'Starburst Stream (16 Liên Trảm Bùng Nổ)', desc: 'Khung cảnh hóa bầu trời sao Aincrad, tung 16 nhát song kiếm tốc độ ánh sáng kết liễu kẻ địch.', dmg: 365, qiCost: 300, cooldown: 62, isBreakDef: true, type: 'domain_super', domainColor: '#0284c7', domainFrames: 95, domainLabel: 'STARBURST STREAM — 16 HITS!', beamColor: '#7dd3fc', vfxStyle: 'slash_arc' }
    }
  },

  // ==================== 9. SHONEN CLASSICS ====================
  {
    id: 'kenshin',
    name: 'Himura Kenshin',
    title: 'Phi Thiên Ngự Kiếm Lưu / Sát Thủ Battousai',
    universe: 'classics',
    universeLabel: 'Shonen Classics',
    difficulty: 'Trung bình',
    archetype: 'Rút kiếm cực tốc (Battojutsu) / Khắc chế',
    hpMax: 960,
    speed: 8.1,
    jumpPower: 15.8,
    colors: { primary: '#be123c', secondary: '#f8fafc', hair: '#ea580c', aura: '#fb7185', awakenAura: '#f59e0b' },
    awakenName: 'Hitokiri Battousai (Sát Thủ Rút Kiếm)',
    meleeProfile: {
      j: { rangeX: 116, rangeY: 76, vx: 9.5, stateTimer: 9, vfxStyle: 'slash_arc', color: '#fda4af' },
      wj: { rangeX: 112, rangeY: 96, vy: -15.8, stateTimer: 16, vfxStyle: 'slash_arc', color: '#fb7185' },
      sj: { rangeX: 136, rangeY: 78, vx: 17, stateTimer: 16, vfxStyle: 'slash_arc', color: '#f59e0b' }
    },
    quote: 'Oro? Ta thề không giết người... nhưng với kẻ cản đường, Nghịch Nhẫn Đao sẽ không nương tay!',
    skills: {
      j: { cmd: 'J', bvnCode: 'ATTACK (砍1-4)', name: 'Phi Thiên Liên Hoàn Trảm', desc: 'Rút Nghịch Nhẫn Đao chém 4 nhịp thần tốc như tia chớp.', dmg: 25, qiGain: 16, cooldown: 0, type: 'melee_combo', vfxStyle: 'slash_arc' },
      wj: { cmd: 'W + J', bvnCode: 'SKILL_2 (WJ)', name: 'Long Tường Thiểm (Ryu Sho Sen)', desc: 'Bật người từ thế quỳ chém ngược sống kiếm hất đối thủ lên cao.', dmg: 76, qiGain: 22, cooldown: 34, type: 'anti_air', vfxStyle: 'slash_arc' },
      sj: { cmd: 'S + J', bvnCode: 'SKILL_1 (SJ)', name: 'Long Sào Thiểm (Ryu So Sen)', desc: 'Lao vút tới xả 6 nhát đâm chém thần tốc xuyên phá phòng ngự.', dmg: 96, qiGain: 28, cooldown: 44, isBreakDef: true, type: 'multi_hit_rush', hits: 6, hitInterval: 4, rangeX: 132, rangeY: 80, dashSpeed: 15, vfxStyle: 'slash_arc', beamColor: '#fb7185' },
      u: { cmd: 'U', bvnCode: 'ZHAO_1 (U)', name: 'Thổ Long Thiểm (Do Ryu Sen)', desc: 'Chém xuống mặt đất hất sóng đất đá phóng thẳng về phía trước.', dmg: 60, qiGain: 20, cooldown: 32, type: 'projectile', projSpeed: 15, projSize: 22, vfxStyle: 'slash_arc', beamColor: '#f59e0b' },
      wu: { cmd: 'W + U', bvnCode: 'ZHAO_3 (WU)', name: 'Long Chùy Thiểm (Ryu Tsui Sen)', desc: 'Lưu tàn ảnh lướt vượt qua đầu đối thủ rồi bổ nhát kiếm trễ chuẩn xác.', dmg: 92, qiGain: 28, cooldown: 48, isBreakDef: true, type: 'ghost_followup', delayFrames: 10, rangeX: 134, rangeY: 84, dashToTarget: true, vfxStyle: 'slash_arc', beamColor: '#fda4af' },
      su: { cmd: 'S + U', bvnCode: 'ZHAO_2 (SU)', name: 'Bạt Đao Thuật Phản Kiếm (Batto Counter)', desc: 'Thu kiếm vào vỏ chờ sơ hở, rút kiếm phản kích chớp nhoáng.', dmg: 80, qiGain: 24, cooldown: 48, isBreakDef: true, type: 'true_counter', windowFrames: 24, counterMult: 1.5, counterRangeX: 160, vfxStyle: 'slash_arc', beamColor: '#f59e0b', counterLabel: 'BẠT ĐAO PHẢN KIẾM!' },
      i: { cmd: 'I (1 Nộ)', bvnCode: 'BISHA (I)', name: 'Cửu Đầu Long Thiểm (Kuzu Ryu Sen)', desc: 'Tung 9 nhát chém đồng thời vào 9 tử huyệt tạo sóng kiếm khí không thể đỡ.', dmg: 196, qiCost: 100, cooldown: 42, isBreakDef: true, type: 'bisha_projectile', vfxStyle: 'slash_arc' },
      wi: { cmd: 'W + I (1 Nộ)', bvnCode: 'BISHA_UP (WI)', name: 'Long Minh Thiểm Trụy Lạc', desc: 'Nhảy vọt lên tạo luồng sóng âm rút kiếm bổ thẳng xuống mặt sân.', dmg: 198, qiCost: 100, cooldown: 44, isBreakDef: true, type: 'bisha_dive', vfxStyle: 'slash_arc' },
      si: { cmd: 'S + I (3 Nộ)', bvnCode: 'BISHA_SUPER (SI)', name: 'Áo Nghĩa: Thiên Tường Long Thiểm (Amakakeru Ryu no Hirameki)', desc: 'Bước chân trái vượt tốc độ âm thanh, tạo cơn lốc chân không hút chặt và chém đôi không gian.', dmg: 365, qiCost: 300, cooldown: 62, isBreakDef: true, type: 'domain_super', domainColor: '#9f1239', domainFrames: 95, domainLabel: 'THIÊN TƯỜNG LONG THIỂM!', beamColor: '#fda4af', vfxStyle: 'slash_arc' }
    }
  },
  {
    id: 'yugi',
    name: 'Yami Yugi',
    title: 'Vua Trò Chơi / Pharaoh Atem',
    universe: 'classics',
    universeLabel: 'Shonen Classics',
    difficulty: 'Trung bình',
    archetype: 'Triệu hồi quái thú / Bẫy bài Mirror Force',
    hpMax: 950,
    speed: 6.3,
    jumpPower: 14.9,
    colors: { primary: '#7e22ce', secondary: '#eab308', hair: '#1e1b4b', aura: '#a855f7', awakenAura: '#facc15' },
    awakenName: 'Millennium Puzzle: Heart of the Cards (Trò Chơi Bóng Tối)',
    meleeProfile: {
      j: { rangeX: 112, rangeY: 78, vx: 6, stateTimer: 13, vfxStyle: 'orb', color: '#c084fc' },
      wj: { rangeX: 108, rangeY: 96, vy: -14.9, stateTimer: 20, vfxStyle: 'slash_arc', color: '#facc15' },
      sj: { rangeX: 130, rangeY: 80, vx: 13, stateTimer: 20, vfxStyle: 'blade_volley', color: '#a855f7' }
    },
    quote: 'Đến lượt ta! Rút bài — Hãy chứng kiến sức mạnh của Trái Tim Các Lá Bài!',
    skills: {
      j: { cmd: 'J', bvnCode: 'ATTACK (砍1-4)', name: 'Phù Thủy Áo Đen Liên Kích', desc: 'Triệu hồi Dark Magician vung trượng phóng 4 nhịp ma pháp.', dmg: 24, qiGain: 16, cooldown: 0, type: 'melee_combo', vfxStyle: 'orb' },
      wj: { cmd: 'W + J', bvnCode: 'SKILL_2 (WJ)', name: 'Hiệp Sĩ Celtic Hất Tung', desc: 'Triệu hồi kiếm sĩ vung đường kiếm ánh sáng hất đối thủ lên không.', dmg: 70, qiGain: 22, cooldown: 35, type: 'anti_air', vfxStyle: 'slash_arc' },
      sj: { cmd: 'S + J', bvnCode: 'SKILL_1 (SJ)', name: 'Kỵ Sĩ Gaia Đột Kích', desc: 'Triệu hồi Gaia phóng thương xuyên thẳng hàng phòng ngự đối thủ.', dmg: 88, qiGain: 26, cooldown: 44, isBreakDef: true, type: 'dash_strike', vfxStyle: 'blade_volley' },
      u: { cmd: 'U', bvnCode: 'ZHAO_1 (U)', name: 'Ngàn Dao Phù Thủy (Thousand Knives)', desc: 'Phóng 4 luồng dao ma thuật tím-vàng truy kích tầm xa.', dmg: 60, qiGain: 20, cooldown: 34, type: 'multi_projectile', projCount: 4, projSpeed: 15, projSize: 18, projSpread: 0.2, beamColor: '#c084fc', vfxStyle: 'blade_volley' },
      wu: { cmd: 'W + U', bvnCode: 'ZHAO_3 (WU)', name: 'Gươm Ánh Sáng (Swords of Revealing Light)', desc: 'Giáng thanh kiếm thánh ánh sáng khóa cứng mọi hành động của đối thủ.', dmg: 82, qiGain: 26, cooldown: 68, isBreakDef: true, type: 'time_freeze', freezeFrames: 95, domainColor: '#facc15', freezeLabel: 'SWORDS OF REVEALING LIGHT!', vfxStyle: 'lightning_bolt' },
      su: { cmd: 'S + U', bvnCode: 'ZHAO_2 (SU)', name: 'Lá Bài Bẫy: Mirror Force (Phản Đòn Thánh Quang)', desc: 'Lật úp bài bẫy Mirror Force hóa giải đòn đánh và bật ngược 1.55x sát thương!', dmg: 86, qiGain: 26, cooldown: 50, isBreakDef: true, type: 'true_counter', windowFrames: 26, counterMult: 1.55, counterRangeX: 175, vfxStyle: 'lightning_bolt', beamColor: '#facc15', counterLabel: 'MIRROR FORCE!!' },
      i: { cmd: 'I (1 Nộ)', bvnCode: 'BISHA (I)', name: 'Dark Magic Attack! (Hắc Ma Pháp Công Kích)', desc: 'Phù Thủy Áo Đen phóng tia hắc ma pháp tím rực xuyên thủng toàn màn hình.', dmg: 194, qiCost: 100, cooldown: 42, isBreakDef: true, type: 'beam_laser', beamColor: '#a855f7', beamWidth: 40, beamDuration: 24, vfxStyle: 'spiral_orb' },
      wi: { cmd: 'W + I (1 Nộ)', bvnCode: 'BISHA_UP (WI)', name: 'Thần Obelisk: Quyền Năng Hủy Diệt', desc: 'Triệu hồi Cự Thần Binh Obelisk giáng nắm đấm chấn động từ trên trời xuống.', dmg: 204, qiCost: 100, cooldown: 46, isBreakDef: true, type: 'bisha_dive', vfxStyle: 'beast_wave' },
      si: { cmd: 'S + I (3 Nộ)', bvnCode: 'BISHA_SUPER (SI)', name: 'Tập Hợp 5 Mảnh: Vị Thần Sức Mạnh EXODIA OBLITERATE!!', desc: 'Mở Trò Chơi Bóng Tối triệu hồi Exodia phóng luồng ánh sáng vàng hủy diệt toàn bộ sân đấu.', dmg: 380, qiCost: 300, cooldown: 65, isBreakDef: true, type: 'domain_super', domainColor: '#a16207', domainFrames: 105, domainLabel: 'EXODIA: OBLITERATE!!', beamColor: '#fde047', vfxStyle: 'lightning_bolt' }
    }
  },

  // ==================== 10. YU YU HAKUSHO ====================
  {
    id: 'yusuke',
    name: 'Yusuke Urameshi',
    title: 'Thám Tử Linh Giới / Hậu Duệ Ma Vương Raizen',
    universe: 'yyh',
    universeLabel: 'Yu Yu Hakusho',
    difficulty: 'Dễ (Khuyên dùng)',
    archetype: 'Cân bằng / Pháo Linh Hoàn tầm xa',
    hpMax: 1030,
    speed: 7.1,
    jumpPower: 15.5,
    colors: { primary: '#15803d', secondary: '#0f172a', hair: '#09090b', aura: '#38bdf8', awakenAura: '#ef4444' },
    awakenName: 'Mazoku Demon Awakening (Ma Tộc Giác Tỉnh)',
    awakenedForm: {
      name: 'Mazoku Demon Awakening (Ma Tộc)',
      dmgMult: 1.36,
      speedMult: 1.22,
      auraColor: '#ef4444'
    },
    meleeProfile: {
      j: { rangeX: 108, rangeY: 76, vx: 8, stateTimer: 12, vfxStyle: 'spiral_orb', color: '#38bdf8' },
      wj: { rangeX: 106, rangeY: 96, vy: -15.5, stateTimer: 18, vfxStyle: 'spiral_orb', color: '#7dd3fc' },
      sj: { rangeX: 128, rangeY: 80, vx: 14, stateTimer: 19, vfxStyle: 'beast_wave', color: '#ef4444' }
    },
    quote: 'Linh Hoàn — BẮN!! Đừng có coi thường thám tử Linh Giới này!',
    skills: {
      j: { cmd: 'J', bvnCode: 'ATTACK (砍1-4)', name: 'Đấm Bụi Đời Liên Hoàn', desc: 'Tung 4 cú đấm móc đường phố cực nặng kết hợp linh khí.', dmg: 26, qiGain: 16, cooldown: 0, type: 'melee_combo', vfxStyle: 'spiral_orb' },
      wj: { cmd: 'W + J', bvnCode: 'SKILL_2 (WJ)', name: 'Linh Khí Thăng Long Quyền', desc: 'Đấm móc bọc linh khí xanh hất đối thủ văng lên trần.', dmg: 74, qiGain: 22, cooldown: 34, type: 'anti_air', vfxStyle: 'spiral_orb' },
      sj: { cmd: 'S + J', bvnCode: 'SKILL_1 (SJ)', name: 'Liên Hoàn Đấm Ma Tộc (Mazoku Rush)', desc: 'Lao thẳng về phía trước tung 5 cú đấm linh khí vỡ giáp.', dmg: 94, qiGain: 26, cooldown: 44, isBreakDef: true, type: 'multi_hit_rush', hits: 5, hitInterval: 4, rangeX: 126, rangeY: 80, dashSpeed: 12, vfxStyle: 'beast_wave', beamColor: '#38bdf8' },
      u: { cmd: 'U', bvnCode: 'ZHAO_1 (U)', name: 'Linh Tán Đạn (Spirit Shotgun)', desc: 'Nắm chặt tay rồi bắn tỏa 4 tia linh hoàn tỏa rộng trước mặt.', dmg: 60, qiGain: 20, cooldown: 34, type: 'multi_projectile', projCount: 4, projSpeed: 15, projSize: 18, projSpread: 0.24, beamColor: '#38bdf8', vfxStyle: 'orb' },
      wu: { cmd: 'W + U', bvnCode: 'ZHAO_3 (WU)', name: 'Reigan (Linh Hoàn Xuyên Phá)', desc: 'Giơ ngón trỏ bắn tia linh khí xanh cực mạnh xuyên thẳng màn hình.', dmg: 92, qiGain: 28, cooldown: 50, isBreakDef: true, type: 'beam_laser', beamColor: '#38bdf8', beamWidth: 34, beamDuration: 22, vfxStyle: 'spiral_orb' },
      su: { cmd: 'S + U', bvnCode: 'ZHAO_2 (SU)', name: 'Huyết Mạch Mazoku Giác Tỉnh', desc: 'Bộc phát yêu khí đỏ thẫm hồi HP và tăng vọt sát thương + tốc độ.', dmg: 40, qiGain: 24, cooldown: 68, type: 'buff_install', speedBuff: 1.32, dmgBuff: 1.3, buffFrames: 280, healAmount: 60, beamColor: '#ef4444', vfxStyle: 'beast_wave' },
      i: { cmd: 'I (1 Nộ)', bvnCode: 'BISHA (I)', name: 'Siêu Linh Hoàn (Mega Spirit Gun)', desc: 'Tụ quả cầu linh khí khổng lồ bắn nổ tung vùng rộng phía trước.', dmg: 196, qiCost: 100, cooldown: 42, isBreakDef: true, type: 'bisha_projectile', vfxStyle: 'spiral_orb' },
      wi: { cmd: 'W + I (1 Nộ)', bvnCode: 'BISHA_UP (WI)', name: 'Linh Quang Ba Trụy Kích (Spirit Wave)', desc: 'Nhảy cao bọc toàn thân trong linh khí lao xuống nghiền nát đối thủ.', dmg: 198, qiCost: 100, cooldown: 44, isBreakDef: true, type: 'bisha_dive', vfxStyle: 'spiral_orb' },
      si: { cmd: 'S + I (3 Nộ)', bvnCode: 'BISHA_SUPER (SI)', name: 'Yêu Linh Hoàn Tối Thượng (Demon Spirit Gun Max)', desc: 'Hợp nhất linh khí và yêu khí Ma Vương bắn cột năng lượng hủy diệt toàn màn hình.', dmg: 365, qiCost: 300, cooldown: 62, isBreakDef: true, type: 'super_beam', beamColor: '#38bdf8', vfxStyle: 'spiral_orb' }
    }
  },
  {
    id: 'hiei',
    name: 'Hiei',
    title: 'Tà Nhãn Sư / Chủ Nhân Hắc Long Ba',
    universe: 'yyh',
    universeLabel: 'Yu Yu Hakusho',
    difficulty: 'Khó (Tốc độ cao)',
    archetype: 'Sát thủ siêu tốc / Tàn ảnh & Hắc Long',
    hpMax: 950,
    speed: 8.3,
    jumpPower: 16.0,
    colors: { primary: '#1e1b4b', secondary: '#7c3aed', hair: '#09090b', aura: '#6366f1', awakenAura: '#c084fc' },
    awakenName: 'Dragon of the Darkness Flame Absorbed (Hấp Thụ Hắc Long)',
    meleeProfile: {
      j: { rangeX: 114, rangeY: 76, vx: 9.5, stateTimer: 9, vfxStyle: 'slash_arc', color: '#818cf8' },
      wj: { rangeX: 112, rangeY: 96, vy: -16, stateTimer: 16, vfxStyle: 'slash_arc', color: '#a855f7' },
      sj: { rangeX: 136, rangeY: 78, vx: 17, stateTimer: 16, vfxStyle: 'slash_arc', color: '#6366f1' }
    },
    quote: 'Ngươi còn chưa kịp chớp mắt thì đã trúng 16 nhát kiếm rồi. Hắc Long Ba!',
    skills: {
      j: { cmd: 'J', bvnCode: 'ATTACK (砍1-4)', name: 'Tà Nhãn Kiếm Pháp Liên Trảm', desc: 'Chém 4 nhịp thần tốc bằng thanh katana Ma Giới bọc hắc viêm.', dmg: 25, qiGain: 16, cooldown: 0, type: 'melee_combo', vfxStyle: 'slash_arc' },
      wj: { cmd: 'W + J', bvnCode: 'SKILL_2 (WJ)', name: 'Tà Vương Viêm Sát Thượng Trảm', desc: 'Bật người chém vòng lửa đen hất tung đối thủ lên cao.', dmg: 74, qiGain: 22, cooldown: 33, type: 'anti_air', vfxStyle: 'slash_arc' },
      sj: { cmd: 'S + J', bvnCode: 'SKILL_1 (SJ)', name: 'Tàn Ảnh Cực Tốc (Afterimage Slash)', desc: 'Biến mất rồi xả 6 nhát chém hắc viêm siêu tốc xuyên phá phòng ngự.', dmg: 96, qiGain: 26, cooldown: 42, isBreakDef: true, type: 'multi_hit_rush', hits: 6, hitInterval: 4, rangeX: 132, rangeY: 80, dashSpeed: 15, vfxStyle: 'slash_arc', beamColor: '#818cf8' },
      u: { cmd: 'U', bvnCode: 'ZHAO_1 (U)', name: 'Tà Vương Viêm Sát Kiếm Khí', desc: 'Phóng lưỡi kiếm lửa đen bay cực nhanh đốt cháy tầm xa.', dmg: 62, qiGain: 20, cooldown: 30, type: 'projectile', projSpeed: 16, projSize: 22, vfxStyle: 'slash_arc', beamColor: '#7c3aed' },
      wu: { cmd: 'W + U', bvnCode: 'ZHAO_3 (WU)', name: 'Thập Lục Tàn Ảnh Trảm', desc: 'Để lại bóng đen sau lưng kẻ địch rồi giáng nhát chém hắc viêm trễ.', dmg: 94, qiGain: 28, cooldown: 48, isBreakDef: true, type: 'ghost_followup', delayFrames: 11, rangeX: 134, rangeY: 82, dashToTarget: true, vfxStyle: 'slash_arc', beamColor: '#a855f7' },
      su: { cmd: 'S + U', bvnCode: 'ZHAO_2 (SU)', name: 'Hấp Thụ Hắc Long Ba (Dragon Absorption)', desc: 'Nuốt trọn hắc long vào cơ thể tăng cực đại tốc độ và sát thương.', dmg: 40, qiGain: 24, cooldown: 68, type: 'buff_install', speedBuff: 1.44, dmgBuff: 1.32, buffFrames: 290, healAmount: 45, beamColor: '#7c3aed', vfxStyle: 'beast_wave' },
      i: { cmd: 'I (1 Nộ)', bvnCode: 'BISHA (I)', name: 'Tà Vương Viêm Sát Hắc Long Ba', desc: 'Tháo băng tay phóng Hắc Long Ma Giới gầm thét xuyên toàn màn hình.', dmg: 202, qiCost: 100, cooldown: 42, isBreakDef: true, type: 'beam_laser', beamColor: '#6d28d9', beamWidth: 44, beamDuration: 24, vfxStyle: 'beast_wave' },
      wi: { cmd: 'W + I (1 Nộ)', bvnCode: 'BISHA_UP (WI)', name: 'Hắc Viêm Kiếm Trụy Lạc', desc: 'Nhảy lên không trung rồi bổ kiếm lửa đen thiêu rụi vị trí đối thủ.', dmg: 196, qiCost: 100, cooldown: 44, isBreakDef: true, type: 'bisha_dive', vfxStyle: 'slash_arc' },
      si: { cmd: 'S + I (3 Nộ)', bvnCode: 'BISHA_SUPER (SI)', name: 'Song Hắc Long Ma Giới: Hư Không Thiêu Đốt', desc: 'Mở Tà Nhãn nhuộm tím đen cả đấu trường, triệu hồi Song Hắc Long nuốt chửng kẻ thù.', dmg: 370, qiCost: 300, cooldown: 62, isBreakDef: true, type: 'domain_super', domainColor: '#4c1d95', domainFrames: 98, domainLabel: 'TÀ VƯƠNG VIÊM SÁT HẮC LONG BA!', beamColor: '#a855f7', vfxStyle: 'beast_wave' }
    }
  },

  // ==================== 11. DRAGON BALL Z / SUPER (EXTRA) ====================
  {
    id: 'goku_ui',
    name: 'Son Goku (Ultra Instinct)',
    title: 'Bản Năng Vô Cực Hoàn Mỹ / Thần Cảnh',
    universe: 'dragonball',
    universeLabel: '7 Viên Ngọc Rồng (DBZ)',
    difficulty: 'Trung bình',
    archetype: 'Siêu tốc độ / Tự né phản kích thần thánh',
    hpMax: 1090,
    speed: 8.2,
    jumpPower: 16.5,
    colors: { primary: '#f8fafc', secondary: '#2563eb', hair: '#e2e8f0', aura: '#cbd5e1', awakenAura: '#38bdf8' },
    awakenName: 'Mastered Ultra Instinct (Bản Năng Vô Cực Hoàn Mỹ)',
    awakenedForm: {
      name: 'Mastered Ultra Instinct (Thần Cảnh)',
      dmgMult: 1.38,
      speedMult: 1.26,
      superArmorHits: 2,
      auraColor: '#e0f2fe'
    },
    meleeProfile: {
      j: { rangeX: 112, rangeY: 78, vx: 9.2, stateTimer: 10, vfxStyle: 'spiral_orb', color: '#e0f2fe' },
      wj: { rangeX: 108, rangeY: 98, vy: -16.5, stateTimer: 17, vfxStyle: 'spiral_orb', color: '#f8fafc' },
      sj: { rangeX: 134, rangeY: 82, vx: 16.5, stateTimer: 17, vfxStyle: 'spiral_orb', color: '#38bdf8' }
    },
    quote: 'Cơ thể ta tự chuyển động... Đây là cảnh giới Bản Năng Vô Cực!',
    skills: {
      j: { cmd: 'J', bvnCode: 'ATTACK (砍1-4)', name: 'Liên Quyền Vô Cực', desc: 'Tung 4 đòn đấm đá siêu thanh không để lộ bất kỳ sơ hở nào.', dmg: 27, qiGain: 16, cooldown: 0, type: 'melee_combo', vfxStyle: 'spiral_orb' },
      wj: { cmd: 'W + J', bvnCode: 'SKILL_2 (WJ)', name: 'Thần Tốc Thăng Long Cước', desc: 'Lướt lên không trung tung cú đá tỏa ngân hà hất bay đối thủ.', dmg: 76, qiGain: 22, cooldown: 33, type: 'anti_air', vfxStyle: 'spiral_orb' },
      sj: { cmd: 'S + J', bvnCode: 'SKILL_1 (SJ)', name: 'Vô Hình Áp Suất Liên Kích', desc: 'Bước nhẹ xuất hiện trước mặt xả 6 cú đấm vô hình phá giáp.', dmg: 100, qiGain: 28, cooldown: 44, isBreakDef: true, type: 'multi_hit_rush', hits: 6, hitInterval: 4, rangeX: 134, rangeY: 84, dashSpeed: 14, vfxStyle: 'spiral_orb', beamColor: '#e0f2fe' },
      u: { cmd: 'U', bvnCode: 'ZHAO_1 (U)', name: 'Ngân Hà Ki Blast Volley', desc: 'Vung tay bắn 4 quả cầu khí ánh bạc truy đuổi cực nhanh.', dmg: 62, qiGain: 20, cooldown: 32, type: 'multi_projectile', projCount: 4, projSpeed: 16, projSize: 18, projSpread: 0.2, beamColor: '#e0f2fe', vfxStyle: 'orb' },
      wu: { cmd: 'W + U', bvnCode: 'ZHAO_3 (WU)', name: 'Phản Xạ Thần Tốc (Unpolished Instinct)', desc: 'Dịch chuyển tức thời để lại tàn ảnh ánh bạc giáng sóng khí trễ.', dmg: 94, qiGain: 28, cooldown: 48, isBreakDef: true, type: 'ghost_followup', delayFrames: 11, rangeX: 136, rangeY: 84, dashToTarget: true, vfxStyle: 'spiral_orb', beamColor: '#f8fafc' },
      su: { cmd: 'S + U', bvnCode: 'ZHAO_2 (SU)', name: 'Bản Năng Vô Cực: Tự Né Phản Đòn', desc: 'Tự động né mọi đòn tấn công bằng bản năng và phản kích sóng ngân hà!', dmg: 86, qiGain: 26, cooldown: 48, isBreakDef: true, type: 'true_counter', windowFrames: 26, counterMult: 1.5, counterRangeX: 170, vfxStyle: 'spiral_orb', beamColor: '#e0f2fe', counterLabel: 'ULTRA INSTINCT DODGE!' },
      i: { cmd: 'I (1 Nộ)', bvnCode: 'BISHA (I)', name: 'Kamehameha Lướt Sóng (Surfing Kamehameha)', desc: 'Phóng luồng Kamehameha ánh bạc rực rỡ xuyên thủng toàn màn hình.', dmg: 202, qiCost: 100, cooldown: 42, isBreakDef: true, type: 'beam_laser', beamColor: '#e0f2fe', beamWidth: 44, beamDuration: 24, vfxStyle: 'spiral_orb' },
      wi: { cmd: 'W + I (1 Nộ)', bvnCode: 'BISHA_UP (WI)', name: 'Thần Cước Thiên Giáng', desc: 'Xuất hiện trên không giáng liên hoàn sóng khí ngân hà xuống mặt sân.', dmg: 200, qiCost: 100, cooldown: 44, isBreakDef: true, type: 'bisha_dive', vfxStyle: 'spiral_orb' },
      si: { cmd: 'S + I (3 Nộ)', bvnCode: 'BISHA_SUPER (SI)', name: 'Cực Ý Công: Hư Không Ngân Hà Phá Diệt', desc: 'Thức tỉnh Avatar Khí Khổng Lồ, nhuộm bạc vũ trụ và giáng đòn chấn động tối thượng.', dmg: 380, qiCost: 300, cooldown: 64, isBreakDef: true, type: 'domain_super', domainColor: '#1e3a8a', domainFrames: 100, domainLabel: 'ULTRA INSTINCT FINALE!!', beamColor: '#f8fafc', vfxStyle: 'spiral_orb' }
    }
  },
  {
    id: 'goku_black',
    name: 'Goku Black (SSJ Rosé)',
    title: 'Thần Trừng Phạt / Kế Hoạch Không Nhân Loại',
    universe: 'dragonball',
    universeLabel: '7 Viên Ngọc Rồng (DBZ)',
    difficulty: 'Trung bình',
    archetype: 'Kiếm khí thần lực / Vết nứt không gian',
    hpMax: 1040,
    speed: 7.4,
    jumpPower: 15.8,
    colors: { primary: '#db2777', secondary: '#09090b', hair: '#f472b6', aura: '#ec4899', awakenAura: '#f43f5e' },
    awakenName: 'Super Saiyan Rosé Scythe (Lưỡi Hái Thần Phẫn Nộ)',
    awakenedForm: {
      name: 'Super Saiyan Rosé Scythe',
      dmgMult: 1.36,
      speedMult: 1.22,
      auraColor: '#ec4899'
    },
    meleeProfile: {
      j: { rangeX: 118, rangeY: 78, vx: 8.5, stateTimer: 11, vfxStyle: 'slash_arc', color: '#f472b6' },
      wj: { rangeX: 114, rangeY: 98, vy: -15.8, stateTimer: 18, vfxStyle: 'slash_arc', color: '#ec4899' },
      sj: { rangeX: 136, rangeY: 82, vx: 15, stateTimer: 18, vfxStyle: 'slash_arc', color: '#db2777' }
    },
    quote: 'Ngươi có thấy sắc hồng tuyệt mỹ này không? Hãy quỳ gối trước vị thần tối cao!',
    skills: {
      j: { cmd: 'J', bvnCode: 'ATTACK (砍1-4)', name: 'Thần Liệt Kiếm Liên Trảm', desc: 'Tạo kiếm khí hồng trên tay chém 4 nhịp sắc lẹm và tàn nhẫn.', dmg: 26, qiGain: 16, cooldown: 0, type: 'melee_combo', vfxStyle: 'slash_arc' },
      wj: { cmd: 'W + J', bvnCode: 'SKILL_2 (WJ)', name: 'Thần Kiếm Hất Thiên', desc: 'Chém hất vòng cung màu hồng rực tung đối thủ lên không.', dmg: 74, qiGain: 22, cooldown: 34, type: 'anti_air', vfxStyle: 'slash_arc' },
      sj: { cmd: 'S + J', bvnCode: 'SKILL_1 (SJ)', name: 'Instant Transmission Slash', desc: 'Dịch chuyển để lại phân thân Rosé chém xuyên phòng thủ đối phương.', dmg: 92, qiGain: 26, cooldown: 44, isBreakDef: true, type: 'ghost_followup', delayFrames: 12, rangeX: 134, rangeY: 82, dashToTarget: true, vfxStyle: 'slash_arc', beamColor: '#f472b6' },
      u: { cmd: 'U', bvnCode: 'ZHAO_1 (U)', name: 'Thần Khí Phi Tiêu Hồng Liên (Divine Lasso)', desc: 'Phóng 5 lưỡi kim khí màu hồng găm thẳng và phát nổ tầm xa.', dmg: 64, qiGain: 20, cooldown: 34, type: 'multi_projectile', projCount: 5, projSpeed: 16, projSize: 16, projSpread: 0.22, beamColor: '#f472b6', vfxStyle: 'blade_volley' },
      wu: { cmd: 'W + U', bvnCode: 'ZHAO_3 (WU)', name: 'Vết Nứt Hư Không Rosé (Scythe Rift)', desc: 'Rạch không gian tạo vùng nứt hồng tỏa năng lượng cắt xé và làm chậm đối thủ.', dmg: 92, qiGain: 28, cooldown: 54, isBreakDef: true, type: 'dot_hazard', duration: 215, tickInterval: 25, tickDmg: 23, radius: 110, slowMult: 0.65, vfxStyle: 'slash_arc', beamColor: '#ec4899', hazardLabel: 'VẾT NỨT HƯ KHÔNG!' },
      su: { cmd: 'S + U', bvnCode: 'ZHAO_2 (SU)', name: 'Lưỡi Hái Thần Phẫn Nộ (Scythe of Sorrow)', desc: 'Triệu hồi lưỡi hái thần khí tăng vọt sát thương và tốc độ tấn công.', dmg: 45, qiGain: 24, cooldown: 68, type: 'buff_install', speedBuff: 1.32, dmgBuff: 1.34, buffFrames: 280, healAmount: 45, beamColor: '#ec4899', vfxStyle: 'slash_arc' },
      i: { cmd: 'I (1 Nộ)', bvnCode: 'BISHA (I)', name: 'Black Kamehameha Rosé', desc: 'Bắn tia Kamehameha đen-hồng rực rỡ xuyên ngang toàn chiến trường.', dmg: 198, qiCost: 100, cooldown: 42, isBreakDef: true, type: 'beam_laser', beamColor: '#ec4899', beamWidth: 40, beamDuration: 24, vfxStyle: 'spiral_orb' },
      wi: { cmd: 'W + I (1 Nộ)', bvnCode: 'BISHA_UP (WI)', name: 'Thần Phạt Giáng Thế', desc: 'Bay lên không giáng nhát lưỡi hái xé đôi mặt đất ngay trên đầu đối thủ.', dmg: 200, qiCost: 100, cooldown: 44, isBreakDef: true, type: 'bisha_dive', vfxStyle: 'slash_arc' },
      si: { cmd: 'S + I (3 Nộ)', bvnCode: 'BISHA_SUPER (SI)', name: 'Hư Không Liệt Phùng: Thần Phạt Tận Thế', desc: 'Xé toạc chiều không gian bằng lưỡi hái Rosé, triệu hồi phân thân nghiền nát toàn màn hình.', dmg: 375, qiCost: 300, cooldown: 62, isBreakDef: true, type: 'domain_super', domainColor: '#9d174d', domainFrames: 98, domainLabel: 'SUPER SAIYAN ROSÉ!!', beamColor: '#f472b6', vfxStyle: 'slash_arc' }
    }
  },
  {
    id: 'frieza',
    name: 'Frieza',
    title: 'Hoàng Đế Vũ Trụ / Golden Frieza',
    universe: 'dragonball',
    universeLabel: '7 Viên Ngọc Rồng (DBZ)',
    difficulty: 'Dễ (Khuyên dùng)',
    archetype: 'Xạ thủ Tử Thần / Khống chế tầm xa',
    hpMax: 1010,
    speed: 7.2,
    jumpPower: 15.6,
    colors: { primary: '#a855f7', secondary: '#f8fafc', hair: '#9333ea', aura: '#c084fc', awakenAura: '#facc15' },
    awakenName: 'Golden Frieza (Hoàng Đế Vàng Kim)',
    awakenedForm: {
      name: 'Golden Frieza (Hoàng Đế Vàng Kim)',
      dmgMult: 1.36,
      speedMult: 1.24,
      auraColor: '#facc15'
    },
    meleeProfile: {
      j: { rangeX: 114, rangeY: 76, vx: 7.5, stateTimer: 12, vfxStyle: 'orb', color: '#c084fc' },
      wj: { rangeX: 110, rangeY: 96, vy: -15.6, stateTimer: 18, vfxStyle: 'orb', color: '#a855f7' },
      sj: { rangeX: 132, rangeY: 80, vx: 14.5, stateTimer: 19, vfxStyle: 'orb', color: '#facc15' }
    },
    quote: 'Ohohoho! Lũ sâu bọ các ngươi hãy quỳ xuống dưới chân Hoàng Đế vũ trụ đi!',
    skills: {
      j: { cmd: 'J', bvnCode: 'ATTACK (砍1-4)', name: 'Đuôi Quất & Liên Đả Hoàng Đế', desc: 'Tấn công 4 nhịp tinh quái kết hợp cú quất đuôi bất ngờ.', dmg: 25, qiGain: 16, cooldown: 0, type: 'melee_combo', vfxStyle: 'orb' },
      wj: { cmd: 'W + J', bvnCode: 'SKILL_2 (WJ)', name: 'Niệm Lực Hất Bay', desc: 'Gồng niệm lực tím hất tung đối thủ kèm vụ nổ trên không.', dmg: 70, qiGain: 22, cooldown: 34, type: 'anti_air', vfxStyle: 'orb' },
      sj: { cmd: 'S + J', bvnCode: 'SKILL_1 (SJ)', name: 'Nova Strike (Hỏa Cầu Xung Phong)', desc: 'Bọc khí vàng-tím lao thẳng như sao băng phá vỡ thế thủ.', dmg: 90, qiGain: 26, cooldown: 44, isBreakDef: true, type: 'dash_strike', vfxStyle: 'orb' },
      u: { cmd: 'U', bvnCode: 'ZHAO_1 (U)', name: 'Death Beam Volley (Loạt Tia Tử Thần)', desc: 'Chỉ tay bắn liên hoàn 5 tia tử thần siêu tốc xuyên thẳng chiến trường.', dmg: 64, qiGain: 20, cooldown: 32, type: 'multi_projectile', projCount: 5, projSpeed: 18, projSize: 14, projSpread: 0.16, beamColor: '#e879f9', vfxStyle: 'lightning_bolt' },
      wu: { cmd: 'W + U', bvnCode: 'ZHAO_3 (WU)', name: 'Emperor Death Beam (Tia Tử Thần Hoàng Đế)', desc: 'Bắn chùm tia tử thần tập trung dày đặc xuyên thủng toàn màn hình.', dmg: 94, qiGain: 28, cooldown: 52, isBreakDef: true, type: 'beam_laser', beamColor: '#c084fc', beamWidth: 32, beamDuration: 22, vfxStyle: 'lightning_bolt' },
      su: { cmd: 'S + U', bvnCode: 'ZHAO_2 (SU)', name: 'Lồng Năng Lượng Hoàng Đế (Death Cage)', desc: 'Giăng lưới laser tím thiêu đốt mặt sân và kìm chân kẻ địch.', dmg: 82, qiGain: 24, cooldown: 56, type: 'dot_hazard', duration: 210, tickInterval: 25, tickDmg: 21, radius: 110, slowMult: 0.64, vfxStyle: 'lightning_bolt', beamColor: '#c084fc', hazardLabel: 'DEATH CAGE!' },
      i: { cmd: 'I (1 Nộ)', bvnCode: 'BISHA (I)', name: 'Death Saucer (Song Đĩa Cắt Tử Thần)', desc: 'Phóng hai đĩa năng lượng tím sắc lẹm cắt xuyên mọi vật cản.', dmg: 194, qiCost: 100, cooldown: 42, isBreakDef: true, type: 'bisha_projectile', vfxStyle: 'blade_volley' },
      wi: { cmd: 'W + I (1 Nộ)', bvnCode: 'BISHA_UP (WI)', name: 'Death Ball Giáng Thế', desc: 'Bay cao tụ quả cầu tử thần đen-tím nện thẳng xuống đầu kẻ địch.', dmg: 202, qiCost: 100, cooldown: 45, isBreakDef: true, type: 'bisha_dive', vfxStyle: 'spiral_orb' },
      si: { cmd: 'S + I (3 Nộ)', bvnCode: 'BISHA_SUPER (SI)', name: 'Supernova: Quả Cầu Hủy Diệt Hành Tinh', desc: 'Giơ một ngón tay tạo mặt trời đỏ rực khổng lồ thiêu rụi cả hành tinh và toàn màn hình.', dmg: 375, qiCost: 300, cooldown: 64, isBreakDef: true, type: 'domain_super', domainColor: '#ea580c', domainFrames: 100, domainLabel: 'SUPERNOVA!!', beamColor: '#f97316', vfxStyle: 'spiral_orb' }
    }
  },
  {
    id: 'cell',
    name: 'Perfect Cell',
    title: 'Sinh Vật Nhân Tạo Hoàn Hảo / Super Perfect',
    universe: 'dragonball',
    universeLabel: '7 Viên Ngọc Rồng (DBZ)',
    difficulty: 'Trung bình',
    archetype: 'Toàn diện / Cell Jr. & Solar Kamehameha',
    hpMax: 1070,
    speed: 7.1,
    jumpPower: 15.6,
    colors: { primary: '#16a34a', secondary: '#1e1b4b', hair: '#14532d', aura: '#4ade80', awakenAura: '#facc15' },
    awakenName: 'Super Perfect Cell (Hoàn Hảo Tuyệt Đối)',
    awakenedForm: {
      name: 'Super Perfect Cell',
      dmgMult: 1.35,
      speedMult: 1.2,
      superArmorHits: 2,
      auraColor: '#facc15'
    },
    meleeProfile: {
      j: { rangeX: 114, rangeY: 78, vx: 8, stateTimer: 12, vfxStyle: 'lightning_bolt', color: '#4ade80' },
      wj: { rangeX: 110, rangeY: 96, vy: -15.6, stateTimer: 18, vfxStyle: 'lightning_bolt', color: '#facc15' },
      sj: { rangeX: 132, rangeY: 82, vx: 14, stateTimer: 19, vfxStyle: 'orb', color: '#4ade80' }
    },
    quote: 'Sự hoàn hảo đích thực chính là ta! Solar Kamehameha sẽ xóa sổ cả Hệ Mặt Trời!',
    skills: {
      j: { cmd: 'J', bvnCode: 'ATTACK (砍1-4)', name: 'Võ Thuật Hoàn Hảo Liên Đả', desc: 'Kết hợp đòn đánh của Goku, Vegeta và Piccolo trong chuỗi 4 nhịp.', dmg: 26, qiGain: 16, cooldown: 0, type: 'melee_combo', vfxStyle: 'lightning_bolt' },
      wj: { cmd: 'W + J', bvnCode: 'SKILL_2 (WJ)', name: 'Perfect Attack Thượng Kích', desc: 'Tung cú đá móc bọc tia sét vàng hất văng đối thủ lên không.', dmg: 74, qiGain: 22, cooldown: 34, type: 'anti_air', vfxStyle: 'lightning_bolt' },
      sj: { cmd: 'S + J', bvnCode: 'SKILL_1 (SJ)', name: 'Cell Jr. Tập Kích Sau Lưng', desc: 'Gọi phân thân Cell Jr. đánh úp trễ phá vỡ thế thủ đối phương.', dmg: 92, qiGain: 26, cooldown: 44, isBreakDef: true, type: 'ghost_followup', delayFrames: 13, rangeX: 132, rangeY: 82, dashToTarget: true, vfxStyle: 'orb', beamColor: '#38bdf8' },
      u: { cmd: 'U', bvnCode: 'ZHAO_1 (U)', name: 'Death Beam & Ma Quán Pháo', desc: 'Bắn 4 tia năng lượng tổng hợp xuyên nhanh qua sân đấu.', dmg: 62, qiGain: 20, cooldown: 34, type: 'multi_projectile', projCount: 4, projSpeed: 16, projSize: 16, projSpread: 0.18, beamColor: '#86efac', vfxStyle: 'lightning_bolt' },
      wu: { cmd: 'W + U', bvnCode: 'ZHAO_3 (WU)', name: 'Solar Kamehameha (Thái Dương Quy Phái)', desc: 'Tụ luồng Kamehameha xanh-vàng cực đại xuyên thủng toàn màn hình.', dmg: 96, qiGain: 28, cooldown: 52, isBreakDef: true, type: 'beam_laser', beamColor: '#38bdf8', beamWidth: 40, beamDuration: 24, vfxStyle: 'spiral_orb' },
      su: { cmd: 'S + U', bvnCode: 'ZHAO_2 (SU)', name: 'Tế Bào Namek Tái Tạo Hoàn Hảo', desc: 'Kích hoạt tế bào Piccolo hồi lượng lớn HP kèm hào quang sét tăng sát thương.', dmg: 35, qiGain: 22, cooldown: 72, type: 'buff_install', speedBuff: 1.24, dmgBuff: 1.28, buffFrames: 260, healAmount: 90, beamColor: '#4ade80', vfxStyle: 'lightning_bolt' },
      i: { cmd: 'I (1 Nộ)', bvnCode: 'BISHA (I)', name: 'Perfect Barrier (Kết Giới Hoàn Hảo)', desc: 'Phóng làn sóng năng lượng xanh rực từ kết giới thổi bay đối thủ.', dmg: 194, qiCost: 100, cooldown: 42, isBreakDef: true, type: 'bisha_projectile', vfxStyle: 'spiral_orb' },
      wi: { cmd: 'W + I (1 Nộ)', bvnCode: 'BISHA_UP (WI)', name: 'Cell Jr. & Thiên Giáng Trọng Kích', desc: 'Dịch chuyển lên đỉnh đầu kẻ địch đập thẳng sóng khí xuống mặt đất.', dmg: 198, qiCost: 100, cooldown: 44, isBreakDef: true, type: 'bisha_dive', vfxStyle: 'orb' },
      si: { cmd: 'S + I (3 Nộ)', bvnCode: 'BISHA_SUPER (SI)', name: 'Super Perfect Solar Kamehameha (Hủy Diệt Hệ Mặt Trời)', desc: 'Sấm sét vàng nổ tung khắp không gian, bắn chùm Kamehameha hủy diệt toàn bộ đấu trường.', dmg: 375, qiCost: 300, cooldown: 64, isBreakDef: true, type: 'domain_super', domainColor: '#15803d', domainFrames: 100, domainLabel: 'SOLAR KAMEHAMEHA!!', beamColor: '#fde047', vfxStyle: 'spiral_orb' }
    }
  },
  {
    id: 'kid_buu',
    name: 'Kid Buu',
    title: 'Ma Bư Thuần Khiết / Hủy Diệt Nguyên Bản',
    universe: 'dragonball',
    universeLabel: '7 Viên Ngọc Rồng (DBZ)',
    difficulty: 'Trung bình',
    archetype: 'Tay dài co giãn / Hỗn loạn & Tái tạo',
    hpMax: 1040,
    speed: 7.7,
    jumpPower: 16.2,
    colors: { primary: '#f472b6', secondary: '#f8fafc', hair: '#ec4899', aura: '#f472b6', awakenAura: '#e879f9' },
    awakenName: 'Pure Majin Chaos (Ma Nhân Hủy Diệt)',
    meleeProfile: {
      j: { rangeX: 136, rangeY: 80, vx: 8.5, stateTimer: 11, vfxStyle: 'beast_wave', color: '#f472b6' },
      wj: { rangeX: 124, rangeY: 98, vy: -16.2, stateTimer: 18, vfxStyle: 'beast_wave', color: '#ec4899' },
      sj: { rangeX: 142, rangeY: 84, vx: 15.5, stateTimer: 18, vfxStyle: 'beast_wave', color: '#e879f9' }
    },
    quote: 'GYAHAHAHA! UOOOH!! *vỗ ngực gầm vang*',
    skills: {
      j: { cmd: 'J', bvnCode: 'ATTACK (砍1-4)', name: 'Liên Đả Co Giãn Ma Bư', desc: 'Kéo dài tay chân đấm đá điên cuồng 4 nhịp cực khó đoán.', dmg: 26, qiGain: 16, cooldown: 0, type: 'melee_combo', vfxStyle: 'beast_wave' },
      wj: { cmd: 'W + J', bvnCode: 'SKILL_2 (WJ)', name: 'Xoáy Bóng Hồng Thượng Kích', desc: 'Cuộn tròn thành quả cầu hồng bật ngược lên trời hất tung đối thủ.', dmg: 74, qiGain: 22, cooldown: 34, type: 'anti_air', vfxStyle: 'beast_wave' },
      sj: { cmd: 'S + J', bvnCode: 'SKILL_1 (SJ)', name: 'Mystic Ball Rush (Cầu Lăn Ma Nhân)', desc: 'Cuộn thành quả cầu cao su đập liên hoàn 5 cú phá tan phòng thủ.', dmg: 96, qiGain: 26, cooldown: 44, isBreakDef: true, type: 'multi_hit_rush', hits: 5, hitInterval: 4, rangeX: 136, rangeY: 84, dashSpeed: 14, vfxStyle: 'beast_wave', beamColor: '#f472b6' },
      u: { cmd: 'U', bvnCode: 'ZHAO_1 (U)', name: 'Human Extinction Attack (Mưa Tia Hủy Diệt)', desc: 'Phóng 5 tia năng lượng hồng uốn lượn phủ kín mọi góc sân.', dmg: 64, qiGain: 20, cooldown: 34, type: 'multi_projectile', projCount: 5, projSpeed: 15, projSize: 16, projSpread: 0.28, beamColor: '#f472b6', vfxStyle: 'orb' },
      wu: { cmd: 'W + U', bvnCode: 'ZHAO_3 (WU)', name: 'Dịch Chuyển KaiKai Bùng Nổ', desc: 'Biến mất xuất hiện tức thời sát mục tiêu đánh úp bằng khí hồng.', dmg: 92, qiGain: 28, cooldown: 48, isBreakDef: true, type: 'ghost_followup', delayFrames: 11, rangeX: 134, rangeY: 84, dashToTarget: true, vfxStyle: 'beast_wave', beamColor: '#ec4899' },
      su: { cmd: 'S + U', bvnCode: 'ZHAO_2 (SU)', name: 'Tái Tạo Ma Nhân Tuyệt Đối', desc: 'Hợp nhất các mảnh cơ thể hồi cực mạnh HP và tăng tốc độ điên cuồng.', dmg: 30, qiGain: 22, cooldown: 74, type: 'buff_install', speedBuff: 1.32, dmgBuff: 1.24, buffFrames: 260, healAmount: 95, beamColor: '#f472b6', vfxStyle: 'beast_wave' },
      i: { cmd: 'I (1 Nộ)', bvnCode: 'BISHA (I)', name: 'Majin Kamehameha (Hồng Quang Pháo)', desc: 'Học lỏm tuyệt kỹ bắn tia Kamehameha màu hồng rực xuyên toàn màn hình.', dmg: 196, qiCost: 100, cooldown: 42, isBreakDef: true, type: 'beam_laser', beamColor: '#ec4899', beamWidth: 42, beamDuration: 22, vfxStyle: 'spiral_orb' },
      wi: { cmd: 'W + I (1 Nộ)', bvnCode: 'BISHA_UP (WI)', name: 'Thiên Thạch Cầu Hồng Trụy Lạc', desc: 'Nhảy cao tung quả cầu năng lượng lớn lao xuống đập tan mặt sân.', dmg: 200, qiCost: 100, cooldown: 44, isBreakDef: true, type: 'bisha_dive', vfxStyle: 'spiral_orb' },
      si: { cmd: 'S + I (3 Nộ)', bvnCode: 'BISHA_SUPER (SI)', name: 'Planet Burst (Cầu Năng Lượng Hủy Diệt Trái Đất)', desc: 'Giơ tay tạo siêu cầu năng lượng hồng lớn bằng cả hành tinh nghiền nát không gian.', dmg: 375, qiCost: 300, cooldown: 64, isBreakDef: true, type: 'domain_super', domainColor: '#be185d', domainFrames: 100, domainLabel: 'PLANET BURST!!', beamColor: '#f472b6', vfxStyle: 'spiral_orb' }
    }
  },
  {
    id: 'gogeta',
    name: 'Gogeta (SSJ Blue)',
    title: 'Chiến Binh Hợp Thể Lưỡng Long / Phép Dung Hợp',
    universe: 'dragonball',
    universeLabel: '7 Viên Ngọc Rồng (DBZ)',
    difficulty: 'Dễ (Khuyên dùng)',
    archetype: 'Siêu tốc độ / Hợp thể toàn năng',
    hpMax: 1100,
    speed: 7.9,
    jumpPower: 16.3,
    colors: { primary: '#0284c7', secondary: '#f59e0b', hair: '#38bdf8', aura: '#0ea5e9', awakenAura: '#7dd3fc' },
    awakenName: 'Super Saiyan Blue Gogeta (Đỉnh Cao Hợp Thể)',
    awakenedForm: {
      name: 'SSJ Blue Gogeta (Thần Lực Hợp Thể)',
      dmgMult: 1.36,
      speedMult: 1.24,
      auraColor: '#38bdf8'
    },
    meleeProfile: {
      j: { rangeX: 112, rangeY: 78, vx: 9, stateTimer: 10, vfxStyle: 'spiral_orb', color: '#38bdf8' },
      wj: { rangeX: 110, rangeY: 98, vy: -16.3, stateTimer: 17, vfxStyle: 'spiral_orb', color: '#7dd3fc' },
      sj: { rangeX: 134, rangeY: 82, vx: 16, stateTimer: 17, vfxStyle: 'spiral_orb', color: '#0ea5e9' }
    },
    quote: 'Ta không phải Goku, cũng không phải Vegeta. Ta là Gogeta — kẻ sẽ đánh bại ngươi!',
    skills: {
      j: { cmd: 'J', bvnCode: 'ATTACK (砍1-4)', name: 'Liên Hoàn Vũ Điệu Chiến Thần', desc: 'Chuỗi đá xoay và đấm thần tốc 4 nhịp rực ánh lam.', dmg: 27, qiGain: 16, cooldown: 0, type: 'melee_combo', vfxStyle: 'spiral_orb' },
      wj: { cmd: 'W + J', bvnCode: 'SKILL_2 (WJ)', name: 'Punisher Drive Thượng Kích', desc: 'Lộn nhào đá hất tung đối thủ giữa cơn bão khí xanh.', dmg: 76, qiGain: 22, cooldown: 34, type: 'anti_air', vfxStyle: 'spiral_orb' },
      sj: { cmd: 'S + J', bvnCode: 'SKILL_1 (SJ)', name: 'God Punisher Rush', desc: 'Lao đi với hào quang SSJ Blue tung 6 cú đấm liên hoàn phá giáp.', dmg: 100, qiGain: 28, cooldown: 44, isBreakDef: true, type: 'multi_hit_rush', hits: 6, hitInterval: 4, rangeX: 134, rangeY: 84, dashSpeed: 14, vfxStyle: 'spiral_orb', beamColor: '#38bdf8' },
      u: { cmd: 'U', bvnCode: 'ZHAO_1 (U)', name: 'Stardust Fall (Mưa Sao Băng Ngũ Sắc)', desc: 'Bắn 5 quả cầu ánh sáng đa sắc rơi tỏa đều kiểm soát chiến trường.', dmg: 64, qiGain: 20, cooldown: 34, type: 'multi_projectile', projCount: 5, projSpeed: 16, projSize: 18, projSpread: 0.24, beamColor: '#38bdf8', vfxStyle: 'orb' },
      wu: { cmd: 'W + U', bvnCode: 'ZHAO_3 (WU)', name: 'Big Bang Kamehameha', desc: 'Hợp nhất Big Bang và Kamehameha bắn tia năng lượng xanh cực đại.', dmg: 98, qiGain: 28, cooldown: 52, isBreakDef: true, type: 'beam_laser', beamColor: '#0ea5e9', beamWidth: 44, beamDuration: 24, vfxStyle: 'spiral_orb' },
      su: { cmd: 'S + U', bvnCode: 'ZHAO_2 (SU)', name: 'Hào Quang Siêu Hợp Thể Blue', desc: 'Bùng phát thần khí xanh lam tăng vọt tốc độ, sát thương và hồi nhẹ HP.', dmg: 40, qiGain: 24, cooldown: 68, type: 'buff_install', speedBuff: 1.38, dmgBuff: 1.32, buffFrames: 290, healAmount: 55, beamColor: '#38bdf8', vfxStyle: 'spiral_orb' },
      i: { cmd: 'I (1 Nộ)', bvnCode: 'BISHA (I)', name: 'Soul Punisher (Cầu Thanh Tẩy Linh Hồn)', desc: 'Ném quả cầu cầu vồng thanh tẩy phát nổ đa tầng nghiền nát tà khí.', dmg: 202, qiCost: 100, cooldown: 42, isBreakDef: true, type: 'bisha_projectile', vfxStyle: 'spiral_orb' },
      wi: { cmd: 'W + I (1 Nộ)', bvnCode: 'BISHA_UP (WI)', name: 'Meteor Explosion (Bùng Nổ Thiên Thạch)', desc: 'Bật cao tung cú đấm tạo cột nổ năng lượng rực sáng cả mặt đất.', dmg: 205, qiCost: 100, cooldown: 45, isBreakDef: true, type: 'bisha_dive', vfxStyle: 'spiral_orb' },
      si: { cmd: 'S + I (3 Nộ)', bvnCode: 'BISHA_SUPER (SI)', name: 'Full-Force Kamehameha: Xé Toạc Chiều Không Gian', desc: 'Đấu trường nứt vỡ thành chiều không gian pha lê, phóng siêu Kamehameha kết liễu tuyệt đối.', dmg: 385, qiCost: 300, cooldown: 65, isBreakDef: true, type: 'domain_super', domainColor: '#0369a1', domainFrames: 100, domainLabel: 'FULL-FORCE KAMEHAMEHA!!', beamColor: '#7dd3fc', vfxStyle: 'spiral_orb' }
    }
  },
  {
    id: 'vegito',
    name: 'Vegito (SSJ Blue)',
    title: 'Hợp Thể Bông Tai Potara / Vô Địch Thiên Hạ',
    universe: 'dragonball',
    universeLabel: '7 Viên Ngọc Rồng (DBZ)',
    difficulty: 'Dễ (Khuyên dùng)',
    archetype: 'Kiếm khí thần lực / Phản đòn Potara',
    hpMax: 1100,
    speed: 7.8,
    jumpPower: 16.2,
    colors: { primary: '#1d4ed8', secondary: '#f97316', hair: '#38bdf8', aura: '#2563eb', awakenAura: '#facc15' },
    awakenName: 'Vegito Blue: Potara Perfection (Thần Uy Potara)',
    awakenedForm: {
      name: 'Vegito Blue: Thần Uy Potara',
      dmgMult: 1.36,
      speedMult: 1.24,
      auraColor: '#facc15'
    },
    meleeProfile: {
      j: { rangeX: 120, rangeY: 78, vx: 8.5, stateTimer: 11, vfxStyle: 'slash_arc', color: '#facc15' },
      wj: { rangeX: 116, rangeY: 98, vy: -16.2, stateTimer: 18, vfxStyle: 'slash_arc', color: '#60a5fa' },
      sj: { rangeX: 136, rangeY: 82, vx: 15.5, stateTimer: 18, vfxStyle: 'slash_arc', color: '#facc15' }
    },
    quote: 'YOSHA!! Chào mừng đến với đẳng cấp của Vegito Blue!',
    skills: {
      j: { cmd: 'J', bvnCode: 'ATTACK (砍1-4)', name: 'Liên Hoàn Cước Khoanh Tay', desc: 'Khoanh tay đá liên hoàn 4 nhịp cực ngầu đầy uy lực.', dmg: 27, qiGain: 16, cooldown: 0, type: 'melee_combo', vfxStyle: 'slash_arc' },
      wj: { cmd: 'W + J', bvnCode: 'SKILL_2 (WJ)', name: 'Spirit Sword Hất Tung', desc: 'Tạo thanh kiếm khí vàng đâm xuyên hất đối thủ bay lên không.', dmg: 76, qiGain: 22, cooldown: 34, type: 'anti_air', vfxStyle: 'slash_arc' },
      sj: { cmd: 'S + J', bvnCode: 'SKILL_1 (SJ)', name: 'Savage Strike Rush', desc: 'Lao vút đi xả 5 cú đấm kiếm khí xuyên thủng mọi lớp phòng ngự.', dmg: 98, qiGain: 28, cooldown: 44, isBreakDef: true, type: 'multi_hit_rush', hits: 5, hitInterval: 4, rangeX: 134, rangeY: 82, dashSpeed: 14, vfxStyle: 'slash_arc', beamColor: '#60a5fa' },
      u: { cmd: 'U', bvnCode: 'ZHAO_1 (U)', name: 'Banshee Blast (Ngũ Chỉ Khí Đạn)', desc: 'Xòe năm ngón tay phóng 5 cầu năng lượng xanh-vàng cực nhanh.', dmg: 64, qiGain: 20, cooldown: 34, type: 'multi_projectile', projCount: 5, projSpeed: 16, projSize: 18, projSpread: 0.22, beamColor: '#60a5fa', vfxStyle: 'orb' },
      wu: { cmd: 'W + U', bvnCode: 'ZHAO_3 (WU)', name: 'Spirit Excalibur (Thần Kiếm Xuyên Không)', desc: 'Kéo dài thanh kiếm khí vàng khổng lồ xuyên thẳng toàn màn hình.', dmg: 98, qiGain: 28, cooldown: 52, isBreakDef: true, type: 'beam_laser', beamColor: '#facc15', beamWidth: 36, beamDuration: 22, vfxStyle: 'slash_arc' },
      su: { cmd: 'S + U', bvnCode: 'ZHAO_2 (SU)', name: 'Potara Barrier Phản Đòn', desc: 'Bật kết giới thần khí chặn đứng và phản kích ngay khi đối phương ra đòn!', dmg: 82, qiGain: 25, cooldown: 48, isBreakDef: true, type: 'true_counter', windowFrames: 25, counterMult: 1.48, counterRangeX: 165, vfxStyle: 'lightning_bolt', beamColor: '#60a5fa', counterLabel: 'POTARA BARRIER!' },
      i: { cmd: 'I (1 Nộ)', bvnCode: 'BISHA (I)', name: 'Big Bang Flash (Thần Quang Pháo)', desc: 'Bắn luồng cầu năng lượng xanh dương khổng lồ càn quét mặt sân.', dmg: 200, qiCost: 100, cooldown: 42, isBreakDef: true, type: 'bisha_projectile', vfxStyle: 'spiral_orb' },
      wi: { cmd: 'W + I (1 Nộ)', bvnCode: 'BISHA_UP (WI)', name: 'Omega Finishing Blow', desc: 'Dịch chuyển trên đầu đối thủ giáng cú đấm trời giáng chấn động.', dmg: 204, qiCost: 100, cooldown: 45, isBreakDef: true, type: 'bisha_dive', vfxStyle: 'lightning_bolt' },
      si: { cmd: 'S + I (3 Nộ)', bvnCode: 'BISHA_SUPER (SI)', name: 'Final Kamehameha (Thần Uy Hủy Diệt Tuyệt Đối)', desc: 'Kết hợp Final Flash và Kamehameha tạo siêu cột quang năng vàng-xanh nuốt trọn bầu trời.', dmg: 385, qiCost: 300, cooldown: 65, isBreakDef: true, type: 'domain_super', domainColor: '#1d4ed8', domainFrames: 100, domainLabel: 'FINAL KAMEHAMEHA!!', beamColor: '#fde047', vfxStyle: 'lightning_bolt' }
    }
  },
  {
    id: 'gohan',
    name: 'Son Gohan (Ultimate / Beast)',
    title: 'Tiềm Năng Khai Phá / Gohan Beast',
    universe: 'dragonball',
    universeLabel: '7 Viên Ngọc Rồng (DBZ)',
    difficulty: 'Dễ (Khuyên dùng)',
    archetype: 'Tấn công bùng nổ / Xuyên phá tầm xa',
    hpMax: 1050,
    speed: 7.4,
    jumpPower: 15.9,
    colors: { primary: '#7e22ce', secondary: '#dc2626', hair: '#e2e8f0', aura: '#a855f7', awakenAura: '#ef4444' },
    awakenName: 'Gohan Beast Awakening (Mãnh Thú Thức Tỉnh)',
    awakenedForm: {
      name: 'Gohan Beast (Mãnh Thú Thức Tỉnh)',
      dmgMult: 1.38,
      speedMult: 1.22,
      superArmorHits: 2,
      auraColor: '#c084fc'
    },
    meleeProfile: {
      j: { rangeX: 110, rangeY: 78, vx: 8.5, stateTimer: 11, vfxStyle: 'lightning_bolt', color: '#c084fc' },
      wj: { rangeX: 108, rangeY: 98, vy: -15.9, stateTimer: 18, vfxStyle: 'lightning_bolt', color: '#a855f7' },
      sj: { rangeX: 132, rangeY: 82, vx: 15, stateTimer: 18, vfxStyle: 'beast_wave', color: '#ef4444' }
    },
    quote: 'Đến lượt ta rồi... MA QUÁN QUANG SÁT PHÁO!!',
    skills: {
      j: { cmd: 'J', bvnCode: 'ATTACK (砍1-4)', name: 'Ultimate Liên Hoàn Quyền', desc: 'Tung chuỗi đấm đá chuẩn mực kết hợp nội lực tiềm năng 4 nhịp.', dmg: 26, qiGain: 16, cooldown: 0, type: 'melee_combo', vfxStyle: 'lightning_bolt' },
      wj: { cmd: 'W + J', bvnCode: 'SKILL_2 (WJ)', name: 'Thăng Long Thượng Quyền', desc: 'Đấm móc từ dưới lên tạo sóng khí tím trắng hất bay đối thủ.', dmg: 74, qiGain: 22, cooldown: 34, type: 'anti_air', vfxStyle: 'lightning_bolt' },
      sj: { cmd: 'S + J', bvnCode: 'SKILL_1 (SJ)', name: 'Beast Explosive Rush', desc: 'Lao vút tới tung 5 cú đá xung kích mãnh thú phá vỡ thế thủ.', dmg: 96, qiGain: 28, cooldown: 44, isBreakDef: true, type: 'multi_hit_rush', hits: 5, hitInterval: 4, rangeX: 130, rangeY: 82, dashSpeed: 14, vfxStyle: 'beast_wave', beamColor: '#c084fc' },
      u: { cmd: 'U', bvnCode: 'ZHAO_1 (U)', name: 'Masenko (Ma Thiểm Quang)', desc: 'Đặt hai tay lên trán phóng luồng sóng vàng rực tầm xa.', dmg: 64, qiGain: 20, cooldown: 32, type: 'projectile', projSpeed: 15, projSize: 26, vfxStyle: 'orb', beamColor: '#facc15' },
      wu: { cmd: 'W + U', bvnCode: 'ZHAO_3 (WU)', name: 'Beast Makankosappo (Ma Quán Quang Sát Pháo)', desc: 'Chụm hai ngón tay bắn mũi khoan quang năng tím-đỏ xuyên thủng mọi lớp giáp.', dmg: 98, qiGain: 28, cooldown: 54, isBreakDef: true, type: 'beam_laser', beamColor: '#c084fc', beamWidth: 36, beamDuration: 24, vfxStyle: 'spiral_orb' },
      su: { cmd: 'S + U', bvnCode: 'ZHAO_2 (SU)', name: 'Thức Tỉnh Gohan Beast', desc: 'Tóc hóa bạch kim mắt đỏ rực tăng vọt sát thương, tốc độ và hồi HP.', dmg: 40, qiGain: 24, cooldown: 68, type: 'buff_install', speedBuff: 1.35, dmgBuff: 1.34, buffFrames: 280, healAmount: 55, beamColor: '#a855f7', vfxStyle: 'lightning_bolt' },
      i: { cmd: 'I (1 Nộ)', bvnCode: 'BISHA (I)', name: 'Burst Rush Kamehameha', desc: 'Phóng luồng Kamehameha trắng-xanh cực mạnh thổi bay kẻ địch.', dmg: 196, qiCost: 100, cooldown: 42, isBreakDef: true, type: 'bisha_projectile', vfxStyle: 'spiral_orb' },
      wi: { cmd: 'W + I (1 Nộ)', bvnCode: 'BISHA_UP (WI)', name: 'Soaring Dragon Strike', desc: 'Nhảy cao rồi lao xuống tung cú đấm bão khí chấn động mặt sân.', dmg: 198, qiCost: 100, cooldown: 44, isBreakDef: true, type: 'bisha_dive', vfxStyle: 'beast_wave' },
      si: { cmd: 'S + I (3 Nộ)', bvnCode: 'BISHA_SUPER (SI)', name: 'Father-Son Kamehameha: Thần Lực Huyết Mạch', desc: 'Bóng hình Goku sát cánh, dồn toàn bộ sức mạnh bắn chùm Kamehameha hủy diệt toàn màn hình.', dmg: 370, qiCost: 300, cooldown: 62, isBreakDef: true, type: 'super_beam', beamColor: '#38bdf8', vfxStyle: 'spiral_orb' }
    },
    awakenedSkills: {
      wu: { cmd: 'W + U', bvnCode: 'ZHAO_3 (WU)', name: 'Special Beam Cannon: Beast Max', desc: 'Phóng mũi khoan Ma Quán Quang Sát Pháo cực đại xuyên thủng màn hình.', dmg: 124, qiGain: 28, cooldown: 48, isBreakDef: true, type: 'beam_laser', beamColor: '#ef4444', beamWidth: 44, beamDuration: 26, vfxStyle: 'spiral_orb' }
    }
  },
  {
    id: 'trunks',
    name: 'Future Trunks',
    title: 'Chiến Binh Tương Lai / Thanh Kiếm Hy Vọng',
    universe: 'dragonball',
    universeLabel: '7 Viên Ngọc Rồng (DBZ)',
    difficulty: 'Trung bình',
    archetype: 'Kiếm thuật tốc độ / Chưởng lửa tầm trung',
    hpMax: 1000,
    speed: 7.5,
    jumpPower: 15.8,
    colors: { primary: '#2563eb', secondary: '#7c3aed', hair: '#fde047', aura: '#facc15', awakenAura: '#38bdf8' },
    awakenName: 'Super Saiyan Rage (Phẫn Nộ Bảo Vệ Tương Lai)',
    awakenedForm: {
      name: 'Super Saiyan Rage (Thanh Kiếm Hy Vọng)',
      dmgMult: 1.35,
      speedMult: 1.22,
      auraColor: '#38bdf8'
    },
    meleeProfile: {
      j: { rangeX: 120, rangeY: 78, vx: 8.5, stateTimer: 11, vfxStyle: 'slash_arc', color: '#facc15' },
      wj: { rangeX: 116, rangeY: 98, vy: -15.8, stateTimer: 18, vfxStyle: 'slash_arc', color: '#38bdf8' },
      sj: { rangeX: 136, rangeY: 82, vx: 15, stateTimer: 18, vfxStyle: 'slash_arc', color: '#fde047' }
    },
    quote: 'Ta sẽ không để tương lai bị phá hủy thêm lần nào nữa! Thanh Kiếm Hy Vọng!',
    skills: {
      j: { cmd: 'J', bvnCode: 'ATTACK (砍1-4)', name: 'Kiếm Pháp Tương Lai Liên Trảm', desc: 'Chém nhanh 4 nhịp bằng thanh đại kiếm kết hợp đá xoay sắc bén.', dmg: 25, qiGain: 16, cooldown: 0, type: 'melee_combo', vfxStyle: 'slash_arc' },
      wj: { cmd: 'W + J', bvnCode: 'SKILL_2 (WJ)', name: 'Shining Slash Thượng Trảm', desc: 'Vung kiếm phát sáng chém hất tung kẻ địch lên không trung.', dmg: 74, qiGain: 22, cooldown: 34, type: 'anti_air', vfxStyle: 'slash_arc' },
      sj: { cmd: 'S + J', bvnCode: 'SKILL_1 (SJ)', name: 'Shining Sword Rush', desc: 'Lao vút tới chém 5 nhát đại kiếm liên thanh phá vỡ phòng thủ.', dmg: 94, qiGain: 26, cooldown: 44, isBreakDef: true, type: 'multi_hit_rush', hits: 5, hitInterval: 4, rangeX: 134, rangeY: 82, dashSpeed: 14, vfxStyle: 'slash_arc', beamColor: '#facc15' },
      u: { cmd: 'U', bvnCode: 'ZHAO_1 (U)', name: 'Burning Attack (Tam Cầu Lửa)', desc: 'Kết ấn tay thần tốc phóng 3 quả cầu năng lượng vàng rực tầm xa.', dmg: 62, qiGain: 20, cooldown: 34, type: 'multi_projectile', projCount: 3, projSpeed: 15, projSize: 22, projSpread: 0.2, beamColor: '#facc15', vfxStyle: 'orb' },
      wu: { cmd: 'W + U', bvnCode: 'ZHAO_3 (WU)', name: 'Galick Gun Tương Lai', desc: 'Bắn tia Galick tím-vàng xuyên thẳng toàn chiến trường.', dmg: 92, qiGain: 28, cooldown: 52, isBreakDef: true, type: 'beam_laser', beamColor: '#a855f7', beamWidth: 36, beamDuration: 22, vfxStyle: 'spiral_orb' },
      su: { cmd: 'S + U', bvnCode: 'ZHAO_2 (SU)', name: 'Super Saiyan Rage Thức Tỉnh', desc: 'Bọc hào quang xanh-vàng kép tăng tốc độ chém, sát thương và hồi nhẹ HP.', dmg: 40, qiGain: 24, cooldown: 68, type: 'buff_install', speedBuff: 1.35, dmgBuff: 1.3, buffFrames: 280, healAmount: 50, beamColor: '#38bdf8', vfxStyle: 'lightning_bolt' },
      i: { cmd: 'I (1 Nộ)', bvnCode: 'BISHA (I)', name: 'Heat Dome Attack (Vòm Nhiệt Hủy Diệt)', desc: 'Phóng luồng sóng nhiệt vàng rực càn quét toàn bộ phía trước.', dmg: 194, qiCost: 100, cooldown: 42, isBreakDef: true, type: 'bisha_projectile', vfxStyle: 'spiral_orb' },
      wi: { cmd: 'W + I (1 Nộ)', bvnCode: 'BISHA_UP (WI)', name: 'Shining Sword Attack (Chém Liên Hoàn Trên Không)', desc: 'Bật cao chém xối xả nhiều nhát rồi bổ thẳng mục tiêu xuống đất.', dmg: 198, qiCost: 100, cooldown: 44, isBreakDef: true, type: 'bisha_dive', vfxStyle: 'slash_arc' },
      si: { cmd: 'S + I (3 Nộ)', bvnCode: 'BISHA_SUPER (SI)', name: 'Sword of Hope (Thanh Kiếm Hy Vọng Cắt Đôi Bầu Trời)', desc: 'Tụ tập nguyên khí nhân loại vào lưỡi kiếm khổng lồ bổ đôi không gian và kết liễu kẻ địch.', dmg: 370, qiCost: 300, cooldown: 62, isBreakDef: true, type: 'domain_super', domainColor: '#0284c7', domainFrames: 98, domainLabel: 'SWORD OF HOPE!!', beamColor: '#7dd3fc', vfxStyle: 'slash_arc' }
    }
  },

  // ==================== 12. NARUTO SHIPPUDEN (EXTRA & NEW JINCHURIKI PACK) ====================
  {
    id: 'naruto_ashura',
    name: 'Naruto (Ashura Kurama)',
    title: 'Lục Đạo Tiên Nhân / Hóa Thân Kurama Toàn Chân Thể',
    universe: 'naruto',
    universeLabel: 'Naruto Shippuden',
    difficulty: 'Dễ (Khuyên dùng)',
    archetype: 'Lục Đạo toàn năng / Biến hình Cửu Vĩ Khổng Lồ [J+K]',
    hpMax: 1120,
    speed: 7.5,
    jumpPower: 16.0,
    colors: { primary: '#f59e0b', secondary: '#0f172a', hair: '#fef08a', aura: '#facc15', awakenAura: '#fb923c' },
    awakenName: 'Cửu Vĩ Kurama Toàn Chân Thể',
    awakenedForm: {
      name: 'Cửu Vĩ Kurama Toàn Chân Thể',
      actionOffset: 10000,
      scaleMult: 1.42,
      dmgMult: 1.38,
      speedMult: 1.18,
      superArmorHits: 3,
      auraColor: '#fb923c'
    },
    meleeProfile: {
      j: { rangeX: 118, rangeY: 80, vx: 8.5, stateTimer: 11, vfxStyle: 'spiral_orb', color: '#facc15' },
      wj: { rangeX: 114, rangeY: 98, vy: -16, stateTimer: 18, vfxStyle: 'beast_wave', color: '#f97316' },
      sj: { rangeX: 136, rangeY: 82, vx: 15, stateTimer: 18, vfxStyle: 'spiral_orb', color: '#f59e0b' }
    },
    quote: 'Sức mạnh của tất cả Vĩ Thú đang chảy trong ta! Lên nào Kurama!!',
    skills: {
      j: { cmd: 'J', bvnCode: 'ATTACK (砍1-4)', name: 'Lục Đạo Tích Trượng Liên Kích', desc: 'Vung thiết bổng Cầu Đạo Ngọc đánh 4 nhịp uy lực thần thánh.', dmg: 27, qiGain: 16, cooldown: 0, type: 'melee_combo', vfxStyle: 'spiral_orb' },
      wj: { cmd: 'W + J', bvnCode: 'SKILL_2 (WJ)', name: 'Dung Độn Thượng Kích', desc: 'Đấm móc bọc Dung Độn của Tứ Vĩ hất văng đối thủ lên trời.', dmg: 76, qiGain: 22, cooldown: 34, type: 'anti_air', vfxStyle: 'beast_wave' },
      sj: { cmd: 'S + J', bvnCode: 'SKILL_1 (SJ)', name: 'Từ Độn Rasengan Đột Kích', desc: 'Lao tới đập Loa Toàn Hoàn Từ Độn phá vỡ phòng ngự đối thủ.', dmg: 94, qiGain: 28, cooldown: 44, isBreakDef: true, type: 'dash_strike', vfxStyle: 'spiral_orb' },
      u: { cmd: 'U', bvnCode: 'ZHAO_1 (U)', name: 'Cầu Đạo Ngọc Liên Phóng (Truth-Seeking Orbs)', desc: 'Điều khiển 4 quả Cầu Đạo Ngọc đen bay tỏa tốc độ cao xuyên giáp.', dmg: 64, qiGain: 20, cooldown: 34, type: 'multi_projectile', projCount: 4, projSpeed: 15, projSize: 20, projSpread: 0.22, beamColor: '#1e293b', vfxStyle: 'orb' },
      wu: { cmd: 'W + U', bvnCode: 'ZHAO_3 (WU)', name: 'Vĩ Thú Ngọc Laser (Tailed Beast Beam)', desc: 'Phóng tia Vĩ Thú Ngọc vàng-đỏ rực rỡ xuyên thủng toàn màn hình.', dmg: 96, qiGain: 28, cooldown: 52, isBreakDef: true, type: 'beam_laser', beamColor: '#f59e0b', beamWidth: 42, beamDuration: 24, vfxStyle: 'spiral_orb' },
      su: { cmd: 'S + U', bvnCode: 'ZHAO_2 (SU)', name: 'Lục Đạo Dương Ấn Hồi Phục', desc: 'Kích hoạt ấn Mặt Trời Lục Đạo hồi mạnh HP và tăng công tốc.', dmg: 38, qiGain: 24, cooldown: 70, type: 'buff_install', speedBuff: 1.32, dmgBuff: 1.3, buffFrames: 280, healAmount: 80, beamColor: '#fde047', vfxStyle: 'spiral_orb' },
      i: { cmd: 'I (1 Nộ)', bvnCode: 'BISHA (I)', name: 'Tiên Pháp: Dung Độn Loa Toàn Thủ Lý Kiếm', desc: 'Ném phi tiêu dung nham khổng lồ cắt ngang và thiêu rụi mặt sân.', dmg: 200, qiCost: 100, cooldown: 42, isBreakDef: true, type: 'bisha_projectile', vfxStyle: 'spiral_orb' },
      wi: { cmd: 'W + I (1 Nộ)', bvnCode: 'BISHA_UP (WI)', name: 'Cửu Vĩ Thủ Lý Kiếm Liên Oanh', desc: 'Nhảy cao giáng liên tiếp hai quả cầu Vĩ Thú nổ tung xuống mục tiêu.', dmg: 204, qiCost: 100, cooldown: 45, isBreakDef: true, type: 'bisha_dive', vfxStyle: 'spiral_orb' },
      si: { cmd: 'S + I (3 Nộ)', bvnCode: 'BISHA_SUPER (SI)', name: 'Lục Đạo: Siêu Đại Ngọc Loa Toàn Thủ Lý Kiếm (Ashura)', desc: 'Hóa Cửu Vĩ Tam Đầu Lục Tý gom toàn bộ tiên lực thiên địa giáng song cầu hủy diệt.', dmg: 385, qiCost: 300, cooldown: 65, isBreakDef: true, type: 'domain_super', domainColor: '#d97706', domainFrames: 100, domainLabel: 'LỤC ĐẠO: ASHURA KURAMA!!', beamColor: '#fde047', vfxStyle: 'spiral_orb' }
    },
    awakenedSkills: {
      j: { cmd: 'J', bvnCode: 'KURAMA (砍1-4)', name: 'Cửu Vĩ Cuồng Trảo Khổng Lồ', desc: 'Vung móng vuốt Cửu Vĩ tầm rộng càn quét mọi mục tiêu trước mặt.', dmg: 34, qiGain: 16, cooldown: 0, type: 'melee_combo', vfxStyle: 'beast_wave' },
      sj: { cmd: 'S + J', bvnCode: 'KURAMA (SJ)', name: 'Cửu Vĩ Liên Hoàn Trảo', desc: 'Cửu Vĩ lao tới cào xé 5 đòn liên hoàn phá tan mọi lớp phòng ngự.', dmg: 118, qiGain: 28, cooldown: 42, isBreakDef: true, type: 'multi_hit_rush', hits: 5, hitInterval: 5, rangeX: 152, rangeY: 96, dashSpeed: 12, vfxStyle: 'beast_wave', beamColor: '#fb923c' },
      u: { cmd: 'U', bvnCode: 'KURAMA (U)', name: 'Renzoku Bijuudama (Liên Hoàn Vĩ Thú Ngọc)', desc: 'Bắn liên tiếp 4 quả Vĩ Thú Ngọc xoáy rực cam áp đảo tầm xa.', dmg: 84, qiGain: 22, cooldown: 34, isBreakDef: true, type: 'multi_projectile', projCount: 4, projSpeed: 15, projSize: 24, projSpread: 0.22, beamColor: '#fb923c', vfxStyle: 'spiral_orb' },
      wu: { cmd: 'W + U', bvnCode: 'KURAMA (WU)', name: 'Cửu Vĩ Chấn Địa (Beast Drop)', desc: 'Giậm mạnh hai chi trước tạo sóng địa chấn chakra cam bùng nổ.', dmg: 112, qiGain: 28, cooldown: 48, isBreakDef: true, type: 'aoe_burst', vfxStyle: 'beast_wave', beamColor: '#f97316' },
      su: { cmd: 'S + U', bvnCode: 'KURAMA (SU)', name: 'Tiếng Gầm Cửu Vĩ (Kurama Roar)', desc: 'Gầm vang giải phóng sóng xung kích chakra hất tung mọi kẻ áp sát.', dmg: 92, qiGain: 26, cooldown: 46, isBreakDef: true, type: 'counter_wave', vfxStyle: 'beast_wave', beamColor: '#fb923c' },
      i: { cmd: 'I (1 Nộ)', bvnCode: 'KURAMA (I)', name: 'Cho Oodama Rasenshuriken (Siêu Đại Ngọc)', desc: 'Ném Siêu Đại Ngọc Loa Toàn Thủ Lý Kiếm khổng lồ xé nát chiến trường.', dmg: 220, qiCost: 100, cooldown: 40, isBreakDef: true, type: 'bisha_projectile', vfxStyle: 'spiral_orb', beamColor: '#f59e0b' },
      si: { cmd: 'S + I (3 Nộ)', bvnCode: 'KURAMA (SI)', name: 'Đại Pháo Vĩ Thú Ngọc (Tailed Beast Cannon)', desc: 'Tích tụ Vĩ Thú Ngọc khổng lồ trong hàm Cửu Vĩ bắn chùm hủy diệt xuyên toàn màn hình!', dmg: 410, qiCost: 300, cooldown: 60, isBreakDef: true, type: 'super_beam', beamColor: '#fb923c', vfxStyle: 'spiral_orb' }
    }
  },
  {
    id: 'naruto_kurama',
    name: 'Naruto (Cửu Vĩ Kurama)',
    title: 'Cửu Vĩ Kurama Toàn Chân Thể / Vĩ Thú Tối Thượng',
    universe: 'naruto',
    universeLabel: 'Naruto Shippuden',
    difficulty: 'Dễ (Khuyên dùng)',
    archetype: 'Vĩ Thú Khổng Lồ / Tầm đánh siêu rộng & Bijuudama',
    hpMax: 1200,
    speed: 6.8,
    jumpPower: 15.2,
    colors: { primary: '#fb923c', secondary: '#7c2d12', hair: '#fde047', aura: '#f97316', awakenAura: '#fde047' },
    awakenName: 'Ashura Kurama Tam Đầu Lục Tý',
    awakenedForm: {
      name: 'Ashura Kurama Tam Đầu Lục Tý',
      scaleMult: 1.08,
      dmgMult: 1.32,
      speedMult: 1.16,
      superArmorHits: 3,
      auraColor: '#fde047'
    },
    meleeProfile: {
      j: { rangeX: 148, rangeY: 96, vx: 6.5, stateTimer: 16, vfxStyle: 'beast_wave', color: '#fb923c' },
      wj: { rangeX: 140, rangeY: 112, vy: -14.8, stateTimer: 22, vfxStyle: 'beast_wave', color: '#f97316' },
      sj: { rangeX: 156, rangeY: 98, vx: 13, stateTimer: 22, vfxStyle: 'beast_wave', color: '#fde047' }
    },
    quote: 'GRAAAOOOH!! Cảm nhận cơn thịnh nộ của Cửu Vĩ Yêu Hồ đi!!',
    skills: {
      j: { cmd: 'J', bvnCode: 'ATTACK (砍1-4)', name: 'Cửu Vĩ Cuồng Trảo (Kurama Claws)', desc: 'Vung vuốt Vĩ Thú tầm siêu rộng 148px càn quét mặt sân.', dmg: 30, qiGain: 16, cooldown: 0, type: 'melee_combo', vfxStyle: 'beast_wave' },
      wj: { cmd: 'W + J', bvnCode: 'SKILL_2 (WJ)', name: 'Cửu Vĩ Quất Đuôi Thượng Kích', desc: 'Quét chín chiếc đuôi chakra cam hất tung kẻ địch lên không trung.', dmg: 80, qiGain: 22, cooldown: 36, type: 'anti_air', vfxStyle: 'beast_wave' },
      sj: { cmd: 'S + J', bvnCode: 'SKILL_1 (SJ)', name: 'Cửu Vĩ Liên Hoàn Trảo', desc: 'Lao tới vồ cào 5 nhịp liên thanh bằng sức mạnh Vĩ Thú phá giáp.', dmg: 104, qiGain: 28, cooldown: 46, isBreakDef: true, type: 'multi_hit_rush', hits: 5, hitInterval: 5, rangeX: 148, rangeY: 94, dashSpeed: 11, vfxStyle: 'beast_wave', beamColor: '#fb923c' },
      u: { cmd: 'U', bvnCode: 'ZHAO_1 (U)', name: 'Renzoku Bijuudama (Liên Hoàn Vĩ Thú Ngọc)', desc: 'Phóng liên tiếp 4 quả Vĩ Thú Ngọc xoáy lửa bao phủ chiến trường.', dmg: 70, qiGain: 20, cooldown: 36, type: 'multi_projectile', projCount: 4, projSpeed: 15, projSize: 22, projSpread: 0.22, beamColor: '#fb923c', vfxStyle: 'spiral_orb' },
      wu: { cmd: 'W + U', bvnCode: 'ZHAO_3 (WU)', name: 'Beast Drop (Địa Chấn Cửu Vĩ)', desc: 'Dập toàn thân Vĩ Thú xuống sân tạo vòng sóng chấn động cực rộng phá giáp.', dmg: 100, qiGain: 28, cooldown: 52, isBreakDef: true, type: 'aoe_burst', vfxStyle: 'beast_wave', beamColor: '#f97316' },
      su: { cmd: 'S + U', bvnCode: 'ZHAO_2 (SU)', name: 'Tiếng Gầm Cửu Vĩ (Kurama Roar)', desc: 'Gầm lớn bật sóng chakra 360 độ thổi bay mọi đối thủ và đòn áp sát.', dmg: 84, qiGain: 26, cooldown: 48, isBreakDef: true, type: 'counter_wave', vfxStyle: 'beast_wave', beamColor: '#fb923c' },
      i: { cmd: 'I (1 Nộ)', bvnCode: 'BISHA (I)', name: 'Cho Oodama Rasenshuriken', desc: 'Tạo Siêu Đại Ngọc Loa Toàn Thủ Lý Kiếm khổng lồ nghiền nát phía trước.', dmg: 206, qiCost: 100, cooldown: 44, isBreakDef: true, type: 'bisha_projectile', vfxStyle: 'spiral_orb', beamColor: '#f59e0b' },
      wi: { cmd: 'W + I (1 Nộ)', bvnCode: 'BISHA_UP (WI)', name: 'Vĩ Thú Thiên Giáng Nghiền Ép', desc: 'Nhảy cao rồi giáng vuốt Cửu Vĩ kèm Vĩ Thú Ngọc xuống đầu kẻ địch.', dmg: 208, qiCost: 100, cooldown: 46, isBreakDef: true, type: 'bisha_dive', vfxStyle: 'beast_wave' },
      si: { cmd: 'S + I (3 Nộ)', bvnCode: 'BISHA_SUPER (SI)', name: 'Đại Pháo Vĩ Thú Ngọc (Super Bijuudama)', desc: 'Tích tụ tối đa chakra Cửu Vĩ bắn chùm Đại Pháo Vĩ Thú Ngọc hủy diệt toàn màn hình!', dmg: 395, qiCost: 300, cooldown: 64, isBreakDef: true, type: 'super_beam', beamColor: '#fb923c', vfxStyle: 'spiral_orb' }
    },
    awakenedSkills: {
      wu: { cmd: 'W + U', bvnCode: 'ZHAO_3 (WU)', name: 'Hỏa Chakra Lục Đạo Đốt Sàn', desc: 'Rải chakra Cửu Vĩ nóng bỏng dưới mặt đất thiêu đốt và làm chậm kẻ địch.', dmg: 108, qiGain: 28, cooldown: 50, isBreakDef: true, type: 'dot_hazard', duration: 220, tickInterval: 24, tickDmg: 26, radius: 125, slowMult: 0.62, vfxStyle: 'beast_wave', beamColor: '#f59e0b', hazardLabel: 'CHAKRA CỬU VĨ!' },
      si: { cmd: 'S + I (3 Nộ)', bvnCode: 'BISHA_SUPER (SI)', name: 'Lục Đạo Ashura: Song Siêu Đại Ngọc Bijuudama', desc: 'Hóa Tam Đầu Lục Tý tụ tiên lực thiên địa giáng song siêu cầu hủy diệt tuyệt đối.', dmg: 420, qiCost: 300, cooldown: 62, isBreakDef: true, type: 'domain_super', domainColor: '#d97706', domainFrames: 105, domainLabel: 'ASHURA KURAMA TAM ĐẦU!!', beamColor: '#fde047', vfxStyle: 'spiral_orb' }
    }
  },
  {
    id: 'obito',
    name: 'Uchiha Obito',
    title: 'Kamui Hư Không / Nhân Trụ Lực Thập Vĩ (Juubito)',
    universe: 'naruto',
    universeLabel: 'Naruto Shippuden',
    difficulty: 'Trung bình',
    archetype: 'Kamui hư hóa phản đòn / Thập Vĩ & Kiếm Nunoboko',
    hpMax: 1060,
    speed: 7.4,
    jumpPower: 15.8,
    colors: { primary: '#dc2626', secondary: '#0f172a', hair: '#09090b', aura: '#a855f7', awakenAura: '#e2e8f0' },
    awakenName: 'Nhân Trụ Lực Thập Vĩ (Juubito)',
    awakenedForm: {
      name: 'Nhân Trụ Lực Thập Vĩ (Juubito)',
      dmgMult: 1.38,
      speedMult: 1.2,
      superArmorHits: 2,
      auraColor: '#e2e8f0'
    },
    meleeProfile: {
      j: { rangeX: 112, rangeY: 76, vx: 8, stateTimer: 12, vfxStyle: 'slash_arc', color: '#ef4444' },
      wj: { rangeX: 108, rangeY: 96, vy: -15.8, stateTimer: 19, vfxStyle: 'beast_wave', color: '#f97316' },
      sj: { rangeX: 130, rangeY: 80, vx: 14.5, stateTimer: 18, vfxStyle: 'spiral_orb', color: '#a855f7' }
    },
    quote: 'Thế giới này vốn dĩ là địa ngục... Kamui sẽ xóa sổ mọi sự tồn tại của ngươi!',
    skills: {
      j: { cmd: 'J', bvnCode: 'ATTACK (砍1-4)', name: 'Quạt Gunbai & Xiềng Xích Liên Kích', desc: 'Vung quạt Gunbai kết hợp xiềng xích sắt đánh 4 nhịp đầy áp lực.', dmg: 26, qiGain: 16, cooldown: 0, type: 'melee_combo', vfxStyle: 'slash_arc' },
      wj: { cmd: 'W + J', bvnCode: 'SKILL_2 (WJ)', name: 'Mộc Độn: Địa Ngục Trồi Gai', desc: 'Bật rễ cây Mộc Độn đâm ngược hất tung đối thủ lên không trung.', dmg: 74, qiGain: 22, cooldown: 34, type: 'anti_air', vfxStyle: 'blade_volley' },
      sj: { cmd: 'S + J', bvnCode: 'SKILL_1 (SJ)', name: 'Kamui Xuyên Thấu Đột Kích', desc: 'Hư hóa xuyên qua mục tiêu rồi giáng đòn đánh úp từ không gian Kamui.', dmg: 92, qiGain: 26, cooldown: 44, isBreakDef: true, type: 'ghost_followup', delayFrames: 12, rangeX: 130, rangeY: 82, dashToTarget: true, vfxStyle: 'spiral_orb', beamColor: '#dc2626' },
      u: { cmd: 'U', bvnCode: 'ZHAO_1 (U)', name: 'Kamui Phi Tiêu Khổng Lồ', desc: 'Phóng 4 đại thủ lý kiếm từ chiều không gian Kamui cắt xé tầm xa.', dmg: 62, qiGain: 20, cooldown: 32, type: 'multi_projectile', projCount: 4, projSpeed: 16, projSize: 18, projSpread: 0.2, beamColor: '#ef4444', vfxStyle: 'blade_volley' },
      wu: { cmd: 'W + U', bvnCode: 'ZHAO_3 (WU)', name: 'Hỏa Độn: Bộc Phong Loạn Vũ', desc: 'Phun cơn lốc lửa xoáy Kamui thiêu đốt liên tục khu vực mặt đất và làm chậm kẻ địch.', dmg: 90, qiGain: 28, cooldown: 54, isBreakDef: true, type: 'dot_hazard', duration: 215, tickInterval: 25, tickDmg: 23, radius: 112, slowMult: 0.64, vfxStyle: 'beast_wave', beamColor: '#ea580c', hazardLabel: 'BỘC PHONG LOẠN VŨ!' },
      su: { cmd: 'S + U', bvnCode: 'ZHAO_2 (SU)', name: 'Kamui Hư Hóa (Intangibility Counter)', desc: 'Chuyển cơ thể sang chiều không gian Kamui né hoàn toàn sát thương và phản công tức thì!', dmg: 84, qiGain: 26, cooldown: 48, isBreakDef: true, type: 'true_counter', windowFrames: 26, counterMult: 1.5, counterRangeX: 170, vfxStyle: 'spiral_orb', beamColor: '#c084fc', counterLabel: 'KAMUI HƯ HÓA!!' },
      i: { cmd: 'I (1 Nộ)', bvnCode: 'BISHA (I)', name: 'Hỏa Xoáy Kamui Đại Pháo', desc: 'Xoáy Mangekyo phóng luồng lốc lửa khổng lồ thiêu rụi toàn mặt sân.', dmg: 196, qiCost: 100, cooldown: 42, isBreakDef: true, type: 'bisha_projectile', vfxStyle: 'spiral_orb', beamColor: '#f97316' },
      wi: { cmd: 'W + I (1 Nộ)', bvnCode: 'BISHA_UP (WI)', name: 'Kamui Hút Xoáy Không Gian', desc: 'Khóa chặt mục tiêu vào vòng xoáy Kamui nghiền ép đa nhịp phá giáp.', dmg: 192, qiCost: 100, cooldown: 46, isBreakDef: true, type: 'command_grab', grabRangeX: 170, holdFrames: 36, ticks: 3, vfxStyle: 'spiral_orb', beamColor: '#a855f7', grabLabel: 'KAMUI KHÔNG GIAN!' },
      si: { cmd: 'S + I (3 Nộ)', bvnCode: 'BISHA_SUPER (SI)', name: 'Ngoại Đạo Ma Tượng — Thập Vĩ Hủy Diệt', desc: 'Triệu hồi Ngoại Đạo Ma Tượng phủ đỏ bầu trời giáng sóng hủy diệt toàn màn hình.', dmg: 375, qiCost: 300, cooldown: 64, isBreakDef: true, type: 'domain_super', domainColor: '#7f1d1d', domainFrames: 102, domainLabel: 'NGOẠI ĐẠO MA TƯỢNG!!', beamColor: '#ef4444', vfxStyle: 'beast_wave' }
    },
    awakenedSkills: {
      sj: { cmd: 'S + J', bvnCode: 'JUUBITO (SJ)', name: 'Kiếm Thần Nunoboko — Liên Trảm', desc: 'Vung thanh kiếm xoắn ốc của Lục Đạo chém 5 nhát xé toạc không gian.', dmg: 116, qiGain: 28, cooldown: 42, isBreakDef: true, type: 'multi_hit_rush', hits: 5, hitInterval: 5, rangeX: 142, rangeY: 88, dashSpeed: 13, vfxStyle: 'slash_arc', beamColor: '#f8fafc' },
      u: { cmd: 'U', bvnCode: 'JUUBITO (U)', name: 'Cầu Đạo Ngọc Thập Vĩ', desc: 'Phóng 5 quả Cầu Đạo Ngọc đen xuyên thủng mọi lớp phòng ngự.', dmg: 76, qiGain: 22, cooldown: 32, type: 'multi_projectile', projCount: 5, projSpeed: 16, projSize: 20, projSpread: 0.22, beamColor: '#1e293b', vfxStyle: 'orb' },
      wu: { cmd: 'W + U', bvnCode: 'JUUBITO (WU)', name: 'Kiếm Nunoboko: Liệt Thiên Trảm', desc: 'Kéo dài Kiếm Thần Nunoboko phóng sóng kiếm khí trắng xóa ngang màn hình.', dmg: 112, qiGain: 28, cooldown: 48, isBreakDef: true, type: 'beam_laser', beamColor: '#e2e8f0', beamWidth: 42, beamDuration: 22, vfxStyle: 'slash_arc' },
      si: { cmd: 'S + I (3 Nộ)', bvnCode: 'JUUBITO (SI)', name: 'Thần Thụ — Tứ Xích Dương Trận', desc: 'Dựng kết giới đỏ rực nhốt chặt chiến trường rồi kích nổ bốn Đại Vĩ Thú Ngọc Thập Vĩ!', dmg: 410, qiCost: 300, cooldown: 62, isBreakDef: true, type: 'domain_super', domainColor: '#991b1b', domainFrames: 110, domainLabel: 'THẦN THỤ: TỨ XÍCH DƯƠNG TRẬN!!', beamColor: '#f87171', vfxStyle: 'spiral_orb' }
    }
  },
  {
    id: 'shikamaru',
    name: 'Nara Shikamaru',
    title: 'Quân Sư Thiên Tài IQ 200 / Ảnh Thuật Gia Tộc Nara',
    universe: 'naruto',
    universeLabel: 'Naruto Shippuden',
    difficulty: 'Trung bình',
    archetype: 'Trói bóng khống chế / Bẫy sàn chiến thuật',
    hpMax: 960,
    speed: 7.0,
    jumpPower: 15.4,
    colors: { primary: '#334155', secondary: '#15803d', hair: '#09090b', aura: '#475569', awakenAura: '#22c55e' },
    awakenName: 'Chiến Thuật Thiên Tài IQ 200 (Kage Nui Overdrive)',
    meleeProfile: {
      j: { rangeX: 108, rangeY: 74, vx: 7, stateTimer: 12, vfxStyle: 'blade_volley', color: '#94a3b8' },
      wj: { rangeX: 104, rangeY: 94, vy: -15.4, stateTimer: 19, vfxStyle: 'slash_arc', color: '#475569' },
      sj: { rangeX: 134, rangeY: 76, vx: 13, stateTimer: 19, vfxStyle: 'slash_arc', color: '#1e293b' }
    },
    quote: 'Phiền phức thật đấy... Nhưng ngươi đã bước vào cái bóng của ta từ 3 nước trước rồi!',
    skills: {
      j: { cmd: 'J', bvnCode: 'ATTACK (砍1-4)', name: 'Phi Tiêu Chakra Asuma Liên Kích', desc: 'Dùng đoản đao Chakra của thầy Asuma chém 4 nhịp chuẩn xác.', dmg: 24, qiGain: 16, cooldown: 0, type: 'melee_combo', vfxStyle: 'blade_volley' },
      wj: { cmd: 'W + J', bvnCode: 'SKILL_2 (WJ)', name: 'Ảnh Phùng Thượng Đâm', desc: 'Bắn mũi kim bóng đen từ dưới đất xiên ngược hất tung đối thủ.', dmg: 70, qiGain: 22, cooldown: 34, type: 'anti_air', vfxStyle: 'slash_arc' },
      sj: { cmd: 'S + J', bvnCode: 'SKILL_1 (SJ)', name: 'Ảnh Đâm Phục Kích (Shadow Ambush)', desc: 'Cài mũi bóng đen dưới chân kẻ địch bất ngờ đâm trễ phá thế thủ.', dmg: 88, qiGain: 26, cooldown: 44, isBreakDef: true, type: 'ghost_followup', delayFrames: 13, rangeX: 130, rangeY: 78, dashToTarget: true, vfxStyle: 'slash_arc', beamColor: '#475569' },
      u: { cmd: 'U', bvnCode: 'ZHAO_1 (U)', name: 'Bùa Nổ Kunai (Explosive Kunai Volley)', desc: 'Ném 4 thanh Kunai buộc bùa nổ tỏa hình quạt ép góc đối thủ.', dmg: 60, qiGain: 20, cooldown: 32, type: 'multi_projectile', projCount: 4, projSpeed: 16, projSize: 16, projSpread: 0.2, beamColor: '#f97316', vfxStyle: 'blade_volley' },
      wu: { cmd: 'W + U', bvnCode: 'ZHAO_3 (WU)', name: 'Ảnh Trói (Kage Mane no Jutsu)', desc: 'Phóng bóng đen vươn dài trói chặt đối thủ phá giáp, siết cổ đa nhịp!', dmg: 94, qiGain: 28, cooldown: 54, isBreakDef: true, type: 'command_grab', grabRangeX: 180, holdFrames: 40, ticks: 3, vfxStyle: 'slash_arc', beamColor: '#1e293b', grabLabel: 'ẢNH TRÓI: KAGE MANE!!' },
      su: { cmd: 'S + U', bvnCode: 'ZHAO_2 (SU)', name: 'Ảnh Thử Bẫy Bóng (Shadow Trap Field)', desc: 'Trải mạng nhện bóng đen trên mặt sân gây sát thương theo giây và làm chậm cực mạnh.', dmg: 86, qiGain: 26, cooldown: 54, isBreakDef: true, type: 'dot_hazard', duration: 230, tickInterval: 25, tickDmg: 21, radius: 118, slowMult: 0.58, vfxStyle: 'slash_arc', beamColor: '#334155', hazardLabel: 'ẢNH THỬ BẪY BÓNG!' },
      i: { cmd: 'I (1 Nộ)', bvnCode: 'BISHA (I)', name: 'Ảnh Phùng: Vạn Tiễn Hắc Ảnh', desc: 'Bắn hàng loạt mũi giáo bóng đen xuyên thấu toàn bộ đường thẳng phía trước.', dmg: 194, qiCost: 100, cooldown: 42, isBreakDef: true, type: 'beam_laser', beamColor: '#334155', beamWidth: 34, beamDuration: 22, vfxStyle: 'blade_volley' },
      wi: { cmd: 'W + I (1 Nộ)', bvnCode: 'BISHA_UP (WI)', name: 'Bẫy Dây Thép & Mưa Bùa Nổ', desc: 'Nhảy bật lên cao kéo dây bẫy kích nổ chùm bùa nổ ngay vị trí đối thủ.', dmg: 196, qiCost: 100, cooldown: 44, isBreakDef: true, type: 'bisha_dive', vfxStyle: 'blade_volley' },
      si: { cmd: 'S + I (3 Nộ)', bvnCode: 'BISHA_SUPER (SI)', name: 'Chiến Thuật IQ 200: Địa Ngục Bùa Nổ Rừng Nara', desc: 'Trói cứng đối thủ bằng Ảnh Trói, châm bật lửa của Asuma kích nổ toàn bộ hầm bùa nổ!', dmg: 365, qiCost: 300, cooldown: 62, isBreakDef: true, type: 'domain_super', domainColor: '#1e293b', domainFrames: 98, domainLabel: 'CHIẾN THUẬT IQ 200: ĐỊA NGỤC BÙA NỔ!', beamColor: '#f97316', vfxStyle: 'blade_volley' }
    }
  },
  {
    id: 'deidara',
    name: 'Deidara',
    title: 'Nghệ Nhân Bộc Độn / Tổ Chức Akatsuki',
    universe: 'naruto',
    universeLabel: 'Naruto Shippuden',
    difficulty: 'Trung bình',
    archetype: 'Oanh tạc đất sét tầm xa / Bãi mìn C2 & C4 Karura',
    hpMax: 950,
    speed: 7.1,
    jumpPower: 16.0,
    colors: { primary: '#f59e0b', secondary: '#18181b', hair: '#fde047', aura: '#fbbf24', awakenAura: '#ef4444' },
    awakenName: 'C0 Tối Thượng Nghệ Thuật (Katsu Overdrive)',
    awakenedForm: {
      name: 'C0 Tối Thượng Nghệ Thuật',
      dmgMult: 1.42,
      speedMult: 1.22,
      hpDrainPerSec: 12,
      auraColor: '#fde047'
    },
    meleeProfile: {
      j: { rangeX: 106, rangeY: 74, vx: 6.5, stateTimer: 13, vfxStyle: 'orb', color: '#fbbf24' },
      wj: { rangeX: 106, rangeY: 96, vy: -16, stateTimer: 19, vfxStyle: 'orb', color: '#f59e0b' },
      sj: { rangeX: 126, rangeY: 78, vx: 13.5, stateTimer: 19, vfxStyle: 'orb', color: '#f97316' }
    },
    quote: 'Nghệ thuật đích thực chính là SỰ BÙNG NỔ!! KATSU — HMM!!',
    skills: {
      j: { cmd: 'J', bvnCode: 'ATTACK (砍1-4)', name: 'Bộc Độn Nhện Đất Sét Cận Chiến', desc: 'Cài nhện đất sét nổ 4 nhịp kèm cú đá xoay linh hoạt.', dmg: 24, qiGain: 16, cooldown: 0, type: 'melee_combo', vfxStyle: 'orb' },
      wj: { cmd: 'W + J', bvnCode: 'SKILL_2 (WJ)', name: 'C1 Đại Bàng Nổ Thượng Kích', desc: 'Bật nhảy tung chim đất sét nổ hất văng đối thủ lên không.', dmg: 70, qiGain: 22, cooldown: 34, type: 'anti_air', vfxStyle: 'orb' },
      sj: { cmd: 'S + J', bvnCode: 'SKILL_1 (SJ)', name: 'C1 Bầy Nhện Lao Nổ', desc: 'Lướt nhanh thả bầy đất sét nổ xuyên phá thế thủ kẻ địch.', dmg: 88, qiGain: 26, cooldown: 44, isBreakDef: true, type: 'dash_strike', vfxStyle: 'orb' },
      u: { cmd: 'U', bvnCode: 'ZHAO_1 (U)', name: 'C1 Chim Đất Sét (Clay Bird Barrage)', desc: 'Phóng 5 chú chim đất sét trắng bay tỏa oanh tạc tầm xa.', dmg: 64, qiGain: 20, cooldown: 32, type: 'multi_projectile', projCount: 5, projSpeed: 15, projSize: 18, projSpread: 0.24, beamColor: '#fef08a', vfxStyle: 'orb' },
      wu: { cmd: 'W + U', bvnCode: 'ZHAO_3 (WU)', name: 'C2 Rồng Rải Mìn (C2 Dragon Minefield)', desc: 'Triệu hồi Rồng C2 rải bãi mìn đất sét dưới sàn nổ liên tục và làm chậm đối thủ.', dmg: 94, qiGain: 28, cooldown: 54, isBreakDef: true, type: 'dot_hazard', duration: 225, tickInterval: 24, tickDmg: 24, radius: 118, slowMult: 0.65, vfxStyle: 'orb', beamColor: '#f97316', hazardLabel: 'C2 RỒNG RẢI MÌN!' },
      su: { cmd: 'S + U', bvnCode: 'ZHAO_2 (SU)', name: 'Phân Thân Đất Sét Phát Nổ (Clay Counter)', desc: 'Đặt phân thân đất sét thế mạng — đối thủ chạm vào là nổ tung tức thì!', dmg: 82, qiGain: 24, cooldown: 48, isBreakDef: true, type: 'true_counter', windowFrames: 24, counterMult: 1.46, counterRangeX: 160, vfxStyle: 'orb', beamColor: '#fbbf24', counterLabel: 'KATSU! PHÂN THÂN NỔ!' },
      i: { cmd: 'I (1 Nộ)', bvnCode: 'BISHA (I)', name: 'C3 Bom Khổng Lồ (C3 Ohako)', desc: 'Ném bức tượng đất sét C3 khổng lồ mang sức công phá hủy diệt cả ngôi làng.', dmg: 202, qiCost: 100, cooldown: 42, isBreakDef: true, type: 'bisha_projectile', vfxStyle: 'spiral_orb', beamColor: '#facc15' },
      wi: { cmd: 'W + I (1 Nộ)', bvnCode: 'BISHA_UP (WI)', name: 'C2 Rồng Khổng Lồ Oanh Tạc', desc: 'Cưỡi chim đất sét bay cao rồi giáng đại pháo C2 nổ tung mặt sân.', dmg: 198, qiCost: 100, cooldown: 44, isBreakDef: true, type: 'bisha_dive', vfxStyle: 'orb' },
      si: { cmd: 'S + I (3 Nộ)', bvnCode: 'BISHA_SUPER (SI)', name: 'C4 Karura — Nghệ Thuật Là Sự Bùng Nổ!!', desc: 'Nặn tượng khổng lồ C4 Karura phát tán bom vi mô hủy diệt toàn bộ chiến trường trong ánh sáng chói lòa!', dmg: 380, qiCost: 300, cooldown: 64, isBreakDef: true, type: 'domain_super', domainColor: '#d97706', domainFrames: 105, domainLabel: 'C4 KARURA — KATSU!!', beamColor: '#fef08a', vfxStyle: 'spiral_orb' }
    },
    awakenedSkills: {
      si: { cmd: 'S + I (3 Nộ)', bvnCode: 'BISHA_SUPER (SI)', name: 'C0 — NGHỆ THUẬT TỐI THƯỢNG 10KM!!', desc: 'Giải phóng trái tim Bộc Độn tạo vụ nổ ánh sáng trắng xóa sổ mọi thứ trong bán kính 10km!', dmg: 415, qiCost: 300, cooldown: 62, isBreakDef: true, type: 'domain_super', domainColor: '#f59e0b', domainFrames: 108, domainLabel: 'C0: NGHỆ THUẬT LÀ SỰ BÙNG NỔ!!', beamColor: '#ffffff', vfxStyle: 'spiral_orb' }
    }
  },
  {
    id: 'hinata',
    name: 'Hyuga Hinata',
    title: 'Công Chúa Bạch Nhãn / Nhu Quyền Song Sư',
    universe: 'naruto',
    universeLabel: 'Naruto Shippuden',
    difficulty: 'Dễ (Khuyên dùng)',
    archetype: 'Bạch Nhãn đốt Nộ / Bát Quái Liên Chưởng & Hồi Thiên',
    hpMax: 980,
    speed: 7.7,
    jumpPower: 15.8,
    colors: { primary: '#9333ea', secondary: '#e2e8f0', hair: '#1e1b4b', aura: '#a855f7', awakenAura: '#c084fc' },
    awakenName: 'Bạch Nhãn Chakra Hamura (Song Sư Thức Tỉnh)',
    awakenedForm: {
      name: 'Bạch Nhãn Chakra Hamura',
      dmgMult: 1.32,
      speedMult: 1.24,
      auraColor: '#c084fc'
    },
    meleeProfile: {
      j: { rangeX: 104, rangeY: 76, vx: 8.5, stateTimer: 10, vfxStyle: 'beast_wave', color: '#a855f7', qiBurn: 10 },
      wj: { rangeX: 102, rangeY: 94, vy: -15.8, stateTimer: 17, vfxStyle: 'beast_wave', color: '#c084fc' },
      sj: { rangeX: 128, rangeY: 80, vx: 14.5, stateTimer: 17, vfxStyle: 'beast_wave', color: '#9333ea', qiBurn: 14 }
    },
    quote: 'Bạch Nhãn — Khai! Ta sẽ không bao giờ rút lại lời mình đã nói — Nhu Bộ Song Sư Quyền!',
    skills: {
      j: { cmd: 'J', bvnCode: 'ATTACK (砍1-4)', name: 'Nhu Quyền Điểm Huyệt (Đốt Nộ)', desc: 'Tung 4 chưởng Nhu Quyền khóa huyệt đạo, đốt 10 Nộ đối thủ mỗi đòn trúng.', dmg: 25, qiGain: 16, cooldown: 0, type: 'melee_combo', vfxStyle: 'beast_wave', qiBurn: 10 },
      wj: { cmd: 'W + J', bvnCode: 'SKILL_2 (WJ)', name: 'Nhu Quyền Thượng Chưởng', desc: 'Xoay người đánh chưởng chakra tím từ dưới lên hất tung kẻ địch.', dmg: 72, qiGain: 22, cooldown: 33, type: 'anti_air', vfxStyle: 'beast_wave' },
      sj: { cmd: 'S + J', bvnCode: 'SKILL_1 (SJ)', name: 'Nhu Bộ Song Sư Quyền (Twin Lion Fists)', desc: 'Tụ hai đầu sư tử chakra tím trên tay lao tới phá giáp và hút 18 Nộ đối thủ.', dmg: 92, qiGain: 26, cooldown: 43, isBreakDef: true, type: 'dash_strike', vfxStyle: 'beast_wave', beamColor: '#a855f7', qiBurn: 18 },
      u: { cmd: 'U', bvnCode: 'ZHAO_1 (U)', name: 'Bát Quái Không Chưởng (Vacuum Palm)', desc: 'Đẩy 3 luồng chưởng khí vô hình tầm xa làm rối loạn chakra và đốt Nộ.', dmg: 58, qiGain: 20, cooldown: 32, type: 'multi_projectile', projCount: 3, projSpeed: 16, projSize: 20, projSpread: 0.16, beamColor: '#c084fc', vfxStyle: 'spiral_orb', qiBurn: 12 },
      wu: { cmd: 'W + U', bvnCode: 'ZHAO_3 (WU)', name: 'Bát Quái Lục Thập Tứ Chưởng (64 Palms)', desc: 'Điểm 6 đợt chưởng liên thanh siêu tốc khóa huyệt đạo, đốt mạnh 18 Nộ chuẩn Bạch Nhãn!', dmg: 100, qiGain: 28, cooldown: 48, isBreakDef: true, type: 'multi_hit_rush', hits: 6, hitInterval: 4, rangeX: 126, rangeY: 82, dashSpeed: 11, vfxStyle: 'beast_wave', beamColor: '#a855f7', qiBurn: 18 },
      su: { cmd: 'S + U', bvnCode: 'ZHAO_2 (SU)', name: 'Bát Quái Hồi Thiên (Kaiten Counter)', desc: 'Xoay tròn tạo vòm chakra tuyệt đối hóa giải mọi đòn đánh và hất văng kẻ địch!', dmg: 82, qiGain: 26, cooldown: 48, isBreakDef: true, type: 'true_counter', windowFrames: 25, counterMult: 1.48, counterRangeX: 155, vfxStyle: 'spiral_orb', beamColor: '#38bdf8', counterLabel: 'BÁT QUÁI HỒI THIÊN!!' },
      i: { cmd: 'I (1 Nộ)', bvnCode: 'BISHA (I)', name: 'Song Sư Phá Huyệt Pháo', desc: 'Phóng hai đầu sư tử chakra tím gầm thét càn quét mặt sân và đốt 25 Nộ.', dmg: 194, qiCost: 100, cooldown: 42, isBreakDef: true, type: 'bisha_projectile', vfxStyle: 'beast_wave', beamColor: '#9333ea', qiBurn: 25 },
      wi: { cmd: 'W + I (1 Nộ)', bvnCode: 'BISHA_UP (WI)', name: 'Thủ Hộ Bát Quái Lục Thập Tứ Chưởng', desc: 'Lao xoáy trên không tạo bức tường chưởng khí nghiền nát và đốt 22 Nộ mục tiêu.', dmg: 196, qiCost: 100, cooldown: 44, isBreakDef: true, type: 'bisha_dive', vfxStyle: 'spiral_orb', qiBurn: 22 },
      si: { cmd: 'S + I (3 Nộ)', bvnCode: 'BISHA_SUPER (SI)', name: 'Bạch Nhãn Tối Thượng: Nhu Bộ Song Sư Hủy Diệt', desc: 'Mở vòng Bát Quái tím rực toàn sân đấu, hóa Song Sư Khổng Lồ hút cạn Nộ và kết liễu kẻ địch!', dmg: 365, qiCost: 300, cooldown: 62, isBreakDef: true, type: 'domain_super', domainColor: '#6b21a8', domainFrames: 98, domainLabel: 'NHU BỘ SONG SƯ QUYỀN!!', beamColor: '#c084fc', vfxStyle: 'beast_wave', qiBurn: 45 }
    },
    awakenedSkills: {
      wu: { cmd: 'W + U', bvnCode: 'ZHAO_3 (WU)', name: 'Bát Quái Nhị Bách Bát Thập Chưởng', desc: 'Xả 7 đợt Nhu Quyền Chakra Hamura tốc độ thần sầu, đốt 22 Nộ mỗi lượt!', dmg: 118, qiGain: 28, cooldown: 44, isBreakDef: true, type: 'multi_hit_rush', hits: 7, hitInterval: 4, rangeX: 136, rangeY: 86, dashSpeed: 13, vfxStyle: 'beast_wave', beamColor: '#c084fc', qiBurn: 22 }
    }
  },
  {
    id: 'minato',
    name: 'Namikaze Minato',
    title: 'Hokage Đệ Tứ / Tia Chớp Vàng Làng Lá',
    universe: 'naruto',
    universeLabel: 'Naruto Shippuden',
    difficulty: 'Trung bình',
    archetype: 'Dịch chuyển siêu tốc / KCM2 Cửu Vĩ Âm [J+K]',
    hpMax: 960,
    speed: 8.4,
    jumpPower: 16.2,
    colors: { primary: '#facc15', secondary: '#f8fafc', hair: '#fde047', aura: '#fbbf24', awakenAura: '#f59e0b' },
    awakenName: 'Cửu Vĩ Âm (KCM2 Minato)',
    awakenedForm: {
      name: 'Cửu Vĩ Âm (KCM2 Minato)',
      tails: 9,
      tailColor: '#facc15',
      dmgMult: 1.32,
      speedMult: 1.28,
      auraColor: '#fde047'
    },
    meleeProfile: {
      j: { rangeX: 104, rangeY: 74, vx: 9.5, stateTimer: 10, vfxStyle: 'lightning_bolt', color: '#facc15' },
      wj: { rangeX: 102, rangeY: 96, vy: -16.2, stateTimer: 16, vfxStyle: 'lightning_bolt', color: '#fef08a' },
      sj: { rangeX: 132, rangeY: 76, vx: 17, stateTimer: 16, vfxStyle: 'spiral_orb', color: '#facc15' }
    },
    quote: 'Trong chớp mắt ngươi đã dính ấn Phi Lôi Thần rồi! Tốc độ là tất cả!',
    skills: {
      j: { cmd: 'J', bvnCode: 'ATTACK (砍1-4)', name: 'Kunai Phi Lôi Thần Liên Kích', desc: 'Chém nhanh 4 nhịp siêu tốc (10f) bằng Kunai 3 mũi kèm tia chớp vàng.', dmg: 24, qiGain: 16, cooldown: 0, type: 'melee_combo', vfxStyle: 'lightning_bolt' },
      wj: { cmd: 'W + J', bvnCode: 'SKILL_2 (WJ)', name: 'Hoàng Thiểm Thượng Đá', desc: 'Lóe sáng vàng xuất hiện dưới chân đối thủ đá móc hất tung.', dmg: 72, qiGain: 22, cooldown: 32, type: 'anti_air', vfxStyle: 'lightning_bolt' },
      sj: { cmd: 'S + J', bvnCode: 'SKILL_1 (SJ)', name: 'Thiểm Quang Loa Toàn Hoàn', desc: 'Biến mất thành tia chớp vàng lao tới đập Rasengan vỡ giáp.', dmg: 92, qiGain: 26, cooldown: 42, isBreakDef: true, type: 'dash_strike', vfxStyle: 'spiral_orb' },
      u: { cmd: 'U', bvnCode: 'ZHAO_1 (U)', name: 'Kunai Phi Lôi Thần (Flying Raijin Volley)', desc: 'Phóng 4 thanh Kunai khắc ấn tỏa hình quạt rải dấu ấn khắp sân.', dmg: 58, qiGain: 20, cooldown: 30, type: 'multi_projectile', projCount: 4, projSpeed: 18, projSize: 16, projSpread: 0.22, beamColor: '#facc15', vfxStyle: 'blade_volley' },
      wu: { cmd: 'W + U', bvnCode: 'ZHAO_3 (WU)', name: 'Phi Lôi Thần Cấp 2 (Flying Raijin Lv.2)', desc: 'Để lại tàn ảnh vàng rồi dịch chuyển tức thời đập Rasengan trễ trên lưng đối thủ!', dmg: 96, qiGain: 28, cooldown: 46, isBreakDef: true, type: 'ghost_followup', delayFrames: 11, rangeX: 134, rangeY: 84, dashToTarget: true, vfxStyle: 'spiral_orb', beamColor: '#facc15' },
      su: { cmd: 'S + U', bvnCode: 'ZHAO_2 (SU)', name: 'Thời Không Kết Giới (Space-Time Lock)', desc: 'Bẻ cong không gian bằng thuật ấn Phi Lôi Thần khóa cứng đối thủ.', dmg: 76, qiGain: 26, cooldown: 68, isBreakDef: true, type: 'time_freeze', freezeFrames: 82, domainColor: '#eab308', freezeLabel: 'PHI LÔI THẦN: THỜI KHÔNG KHÓA!', vfxStyle: 'lightning_bolt' },
      i: { cmd: 'I (1 Nộ)', bvnCode: 'BISHA (I)', name: 'Thái Cực Loa Toàn Hoàn (Taikyoku Rasengan)', desc: 'Phóng luồng sóng xoáy Rasengan vàng-xanh cực mạnh thổi bay mục tiêu.', dmg: 194, qiCost: 100, cooldown: 40, isBreakDef: true, type: 'bisha_projectile', vfxStyle: 'spiral_orb' },
      wi: { cmd: 'W + I (1 Nộ)', bvnCode: 'BISHA_UP (WI)', name: 'Tia Chớp Vàng Thiên Giáng', desc: 'Dịch chuyển lên đỉnh trời lao cắm xuống như mũi sét vàng.', dmg: 198, qiCost: 100, cooldown: 42, isBreakDef: true, type: 'bisha_dive', vfxStyle: 'lightning_bolt' },
      si: { cmd: 'S + I (3 Nộ)', bvnCode: 'BISHA_SUPER (SI)', name: 'Phi Lôi Thần: Tứ Trùng Hoàng Thiểm Toàn Màn Hình', desc: 'Rải hàng chục Kunai khắp đấu trường, hóa tia chớp vàng chém xuyên không gian rồi kết liễu bằng Siêu Rasengan.', dmg: 365, qiCost: 300, cooldown: 62, isBreakDef: true, type: 'domain_super', domainColor: '#ca8a04', domainFrames: 95, domainLabel: 'TIA CHỚP VÀNG LÀNG LÁ!!', beamColor: '#fef08a', vfxStyle: 'lightning_bolt' }
    },
    awakenedSkills: {
      sj: { cmd: 'S + J', bvnCode: 'KCM2 (SJ)', name: 'KCM2 Phi Lôi Thần Liên Hoàn Trảm', desc: 'Hóa tia sét Cửu Vĩ Âm chém 6 nhát siêu thanh khắp không gian.', dmg: 112, qiGain: 28, cooldown: 38, isBreakDef: true, type: 'multi_hit_rush', hits: 6, hitInterval: 4, rangeX: 138, rangeY: 84, dashSpeed: 16, vfxStyle: 'lightning_bolt', beamColor: '#fde047' },
      u: { cmd: 'U', bvnCode: 'KCM2 (U)', name: 'Loạt Kunai Chakra Cửu Vĩ', desc: 'Ném 5 thanh Kunai bọc chakra Cửu Vĩ Âm tốc độ siêu thanh.', dmg: 72, qiGain: 22, cooldown: 28, type: 'multi_projectile', projCount: 5, projSpeed: 19, projSize: 18, projSpread: 0.22, beamColor: '#fde047', vfxStyle: 'blade_volley' },
      i: { cmd: 'I (1 Nộ)', bvnCode: 'KCM2 (I)', name: 'Vĩ Thú Ngọc Hoàng Kim', desc: 'Phóng đại pháo Vĩ Thú Ngọc Cửu Vĩ Âm xuyên thủng toàn màn hình.', dmg: 215, qiCost: 100, cooldown: 40, isBreakDef: true, type: 'beam_laser', beamColor: '#facc15', beamWidth: 44, beamDuration: 24, vfxStyle: 'spiral_orb' }
    }
  },
  {
    id: 'gaara',
    name: 'Gaara',
    title: 'Kazekage Đệ Ngũ / Nhất Vĩ Shukaku',
    universe: 'naruto',
    universeLabel: 'Naruto Shippuden',
    difficulty: 'Dễ (Khuyên dùng)',
    archetype: 'Khống chế cát tầm xa / Bán Vĩ Thú Shukaku [J+K]',
    hpMax: 1060,
    speed: 6.2,
    jumpPower: 14.9,
    colors: { primary: '#991b1b', secondary: '#d6d3d1', hair: '#b91c1c', aura: '#d97706', awakenAura: '#f59e0b' },
    awakenName: 'Bán Vĩ Thú Nhất Vĩ Shukaku',
    awakenedForm: {
      name: 'Bán Vĩ Thú Nhất Vĩ Shukaku',
      tails: 1,
      tailColor: '#d97706',
      dmgMult: 1.34,
      speedMult: 1.16,
      superArmorHits: 2,
      auraColor: '#f59e0b'
    },
    meleeProfile: {
      j: { rangeX: 132, rangeY: 80, vx: 5.5, stateTimer: 13, vfxStyle: 'beast_wave', color: '#d97706' },
      wj: { rangeX: 124, rangeY: 102, vy: -14.9, stateTimer: 20, vfxStyle: 'beast_wave', color: '#f59e0b' },
      sj: { rangeX: 144, rangeY: 82, vx: 12, stateTimer: 20, vfxStyle: 'beast_wave', color: '#b45309' }
    },
    quote: 'Cát sẽ bảo vệ ta... Sa Phược Cữu — Sa Bộc Tống Táng!',
    skills: {
      j: { cmd: 'J', bvnCode: 'ATTACK (砍1-4)', name: 'Sa Tiên Liên Kích', desc: 'Điều khiển roi cát đánh 4 nhịp tầm trung rộng 132px không cần áp sát.', dmg: 25, qiGain: 16, cooldown: 0, type: 'melee_combo', vfxStyle: 'beast_wave' },
      wj: { cmd: 'W + J', bvnCode: 'SKILL_2 (WJ)', name: 'Sa Trụ Hất Tung', desc: 'Đẩy cột cát trồi lên từ mặt đất hất văng đối thủ lên không.', dmg: 72, qiGain: 22, cooldown: 35, type: 'anti_air', vfxStyle: 'beast_wave' },
      sj: { cmd: 'S + J', bvnCode: 'SKILL_1 (SJ)', name: 'Sa Thương Xuyên Giáp (Sand Spear)', desc: 'Nén cát siêu cứng thành ngọn giáo lao tới đâm vỡ phòng thủ.', dmg: 88, qiGain: 26, cooldown: 44, isBreakDef: true, type: 'dash_strike', vfxStyle: 'beast_wave' },
      u: { cmd: 'U', bvnCode: 'ZHAO_1 (U)', name: 'Sa Thủ Lý Kiếm (Sand Shuriken Volley)', desc: 'Phóng 4 phi tiêu cát nén xoay tít cắt xé tầm xa cực nhanh.', dmg: 60, qiGain: 20, cooldown: 32, type: 'multi_projectile', projCount: 4, projSpeed: 15, projSize: 18, projSpread: 0.2, beamColor: '#d97706', vfxStyle: 'blade_volley' },
      wu: { cmd: 'W + U', bvnCode: 'ZHAO_3 (WU)', name: 'Sa Phược Cữu (Sand Coffin Grab)', desc: 'Cuốn chặt cơ thể đối thủ trong quan tài cát phá giáp, nghiền ép đa nhịp rồi bóp nổ!', dmg: 98, qiGain: 28, cooldown: 54, isBreakDef: true, type: 'command_grab', grabRangeX: 175, holdFrames: 38, ticks: 3, vfxStyle: 'beast_wave', beamColor: '#d97706', grabLabel: 'SA PHƯỢC CỮU!!' },
      su: { cmd: 'S + U', bvnCode: 'ZHAO_2 (SU)', name: 'Tuyệt Đối Phòng Ngự: Khiên Cát', desc: 'Cát tự động dựng khiên chặn đứng đòn đánh và phản kích bằng cơn lốc cát!', dmg: 80, qiGain: 26, cooldown: 48, isBreakDef: true, type: 'true_counter', windowFrames: 26, counterMult: 1.46, counterRangeX: 160, vfxStyle: 'beast_wave', beamColor: '#f59e0b', counterLabel: 'KHIÊN CÁT PHẢN CHẤN!' },
      i: { cmd: 'I (1 Nộ)', bvnCode: 'BISHA (I)', name: 'Lưu Sa Bộc Lưu (Sand Tsunami)', desc: 'Triệu hồi đợt sóng thần cát khổng lồ cuốn phăng mọi thứ trước mặt.', dmg: 196, qiCost: 100, cooldown: 42, isBreakDef: true, type: 'bisha_projectile', vfxStyle: 'beast_wave' },
      wi: { cmd: 'W + I (1 Nộ)', bvnCode: 'BISHA_UP (WI)', name: 'Sa Mưa Đá Búa Tạ', desc: 'Tạo khối cát nén khổng lồ trên không giáng thẳng xuống nghiền nát mục tiêu.', dmg: 200, qiCost: 100, cooldown: 44, isBreakDef: true, type: 'bisha_dive', vfxStyle: 'beast_wave' },
      si: { cmd: 'S + I (3 Nộ)', bvnCode: 'BISHA_SUPER (SI)', name: 'Sa Bộc Tầng Đại Táng: Kim Tự Tháp Phong Ấn', desc: 'Biến cả chiến trường thành bão sa mạc, giam đối thủ trong kim tự tháp cát khổng lồ rồi bóp nát.', dmg: 370, qiCost: 300, cooldown: 64, isBreakDef: true, type: 'domain_super', domainColor: '#92400e', domainFrames: 98, domainLabel: 'SA BỘC TẦNG ĐẠI TÁNG!!', beamColor: '#fbbf24', vfxStyle: 'beast_wave' }
    },
    awakenedSkills: {
      u: { cmd: 'U', bvnCode: 'SHUKAKU (U)', name: 'Phong Độn: Luyện Không Đạn', desc: 'Nhất Vĩ Shukaku bắn 4 quả đại pháo gió áp suất cao thổi bay đối thủ.', dmg: 76, qiGain: 22, cooldown: 32, isBreakDef: true, type: 'multi_projectile', projCount: 4, projSpeed: 16, projSize: 22, projSpread: 0.22, beamColor: '#f59e0b', vfxStyle: 'spiral_orb' },
      wu: { cmd: 'W + U', bvnCode: 'SHUKAKU (WU)', name: 'Lưu Sa Đầm Lầy Nhất Vĩ (Quicksand Hazard)', desc: 'Biến mặt sân thành đầm lầy lưu sa kéo chìm, làm chậm cực nặng và rút máu liên tục!', dmg: 98, qiGain: 28, cooldown: 50, isBreakDef: true, type: 'dot_hazard', duration: 225, tickInterval: 24, tickDmg: 24, radius: 122, slowMult: 0.56, vfxStyle: 'beast_wave', beamColor: '#d97706', hazardLabel: 'LƯU SA NHẤT VĨ!' },
      i: { cmd: 'I (1 Nộ)', bvnCode: 'SHUKAKU (I)', name: 'Nhất Vĩ Phong Độn Đại Pháo', desc: 'Shukaku gầm vang bắn cột gió bão cát xuyên thủng toàn màn hình.', dmg: 215, qiCost: 100, cooldown: 40, isBreakDef: true, type: 'beam_laser', beamColor: '#fbbf24', beamWidth: 44, beamDuration: 24, vfxStyle: 'beast_wave' }
    }
  },
  {
    id: 'rock_lee',
    name: 'Rock Lee',
    title: 'Mãnh Thú Xanh Làng Lá / Bát Môn Độn Giáp',
    universe: 'naruto',
    universeLabel: 'Naruto Shippuden',
    difficulty: 'Dễ (Khuyên dùng)',
    archetype: 'Thuần Thể Thuật siêu nhanh / Bát Môn Tử Môn [J+K]',
    hpMax: 1010,
    speed: 8.3,
    jumpPower: 16.6,
    colors: { primary: '#16a34a', secondary: '#f97316', hair: '#09090b', aura: '#22c55e', awakenAura: '#ef4444' },
    awakenName: 'Bát Môn Tử Môn (Eighth Gate — Gate of Death)',
    awakenedForm: {
      name: 'Bát Môn Tử Môn (Tử Môn Huyết Khí)',
      dmgMult: 1.48,
      speedMult: 1.35,
      hpDrainPerSec: 18,
      auraColor: '#ef4444'
    },
    meleeProfile: {
      j: { rangeX: 100, rangeY: 74, vx: 9.8, stateTimer: 9, vfxStyle: 'beast_wave', color: '#22c55e' },
      wj: { rangeX: 98, rangeY: 98, vy: -16.8, stateTimer: 16, vfxStyle: 'beast_wave', color: '#4ade80' },
      sj: { rangeX: 124, rangeY: 78, vx: 16.5, stateTimer: 16, vfxStyle: 'beast_wave', color: '#22c55e' }
    },
    quote: 'Tuổi trẻ là phải rực cháy!! Tháo tạ chân — Khai Mở Bát Môn Tử Môn!!',
    skills: {
      j: { cmd: 'J', bvnCode: 'ATTACK (砍1-4)', name: 'Cương Quyền Liên Hoàn Cước', desc: 'Tung 4 cú đá thể thuật siêu nhanh (9f) không một kẽ hở.', dmg: 26, qiGain: 16, cooldown: 0, type: 'melee_combo', vfxStyle: 'beast_wave' },
      wj: { cmd: 'W + J', bvnCode: 'SKILL_2 (WJ)', name: 'Mộc Diệp Thăng Phong (Leaf Rising Wind)', desc: 'Chống tay đá móc ngược thẳng đứng hất đối thủ bay lên trời.', dmg: 76, qiGain: 22, cooldown: 32, type: 'anti_air', vfxStyle: 'beast_wave' },
      sj: { cmd: 'S + J', bvnCode: 'SKILL_1 (SJ)', name: 'Mộc Diệp Toàn Phong (Leaf Hurricane)', desc: 'Lao xoáy như cơn lốc tung cú đá vòng cầu phá tan thế thủ.', dmg: 92, qiGain: 28, cooldown: 42, isBreakDef: true, type: 'dash_strike', vfxStyle: 'beast_wave' },
      u: { cmd: 'U', bvnCode: 'ZHAO_1 (U)', name: 'Không Khí Pháo Thể Thuật (Air Pressure Kick)', desc: 'Đá cực nhanh tạo 3 luồng sóng không khí nén bay xuyên tầm trung.', dmg: 60, qiGain: 20, cooldown: 32, type: 'multi_projectile', projCount: 3, projSpeed: 16, projSize: 20, projSpread: 0.16, beamColor: '#4ade80', vfxStyle: 'beast_wave' },
      wu: { cmd: 'W + U', bvnCode: 'ZHAO_3 (WU)', name: 'Biểu Liên Hoa (Primary Lotus Grab)', desc: 'Quấn băng gạc khóa chặt đối thủ phá giáp, xoay tít rồi đập nát xuống mặt sân!', dmg: 98, qiGain: 28, cooldown: 52, isBreakDef: true, type: 'command_grab', grabRangeX: 148, holdFrames: 34, ticks: 3, vfxStyle: 'beast_wave', beamColor: '#22c55e', grabLabel: 'BIỂU LIÊN HOA!!' },
      su: { cmd: 'S + U', bvnCode: 'ZHAO_2 (SU)', name: 'Khai Mở Bát Môn: Kinh Môn (Seventh Gate)', desc: 'Giải phóng mồ hôi xanh bốc hơi tăng tối đa tốc độ và sức mạnh thể thuật.', dmg: 40, qiGain: 24, cooldown: 66, type: 'buff_install', speedBuff: 1.45, dmgBuff: 1.35, buffFrames: 300, healAmount: 45, beamColor: '#22c55e', vfxStyle: 'beast_wave' },
      i: { cmd: 'I (1 Nộ)', bvnCode: 'BISHA (I)', name: 'Triều Khổng Tước (Morning Peacock)', desc: 'Đấm siêu tốc ma sát không khí bắn luồng hỏa cầu rực cháy toàn màn hình.', dmg: 196, qiCost: 100, cooldown: 42, isBreakDef: true, type: 'bisha_projectile', vfxStyle: 'beast_wave' },
      wi: { cmd: 'W + I (1 Nộ)', bvnCode: 'BISHA_UP (WI)', name: 'Lý Liên Hoa (Hidden Lotus Rush)', desc: 'Tăng tốc cực hạn tung 7 cú đá liên hoàn tốc độ âm thanh đập tan phòng ngự!', dmg: 206, qiCost: 100, cooldown: 44, isBreakDef: true, type: 'multi_hit_rush', hits: 7, hitInterval: 4, rangeX: 142, rangeY: 94, dashSpeed: 15, vfxStyle: 'beast_wave', beamColor: '#ef4444' },
      si: { cmd: 'S + I (3 Nộ)', bvnCode: 'BISHA_SUPER (SI)', name: 'Trú Hổ & Dạ Khải: Huyết Long Thể Thuật', desc: 'Mở cổng tối thượng tỏa huyết khí đỏ rực, bẻ cong không gian tung cú đá long trời lở đất.', dmg: 375, qiCost: 300, cooldown: 64, isBreakDef: true, type: 'domain_super', domainColor: '#b91c1c', domainFrames: 98, domainLabel: 'BÁT MÔN ĐỘN GIÁP: DẠ KHẢI!!', beamColor: '#ef4444', vfxStyle: 'beast_wave' }
    },
    awakenedSkills: {
      sj: { cmd: 'S + J', bvnCode: 'TỬ MÔN (SJ)', name: 'Tịch Tượng (Evening Elephant Rush)', desc: 'Đấm liên tiếp 5 luồng áp suất không khí đỏ rực xuyên nát mọi phòng thủ!', dmg: 122, qiGain: 28, cooldown: 38, isBreakDef: true, type: 'multi_hit_rush', hits: 5, hitInterval: 4, rangeX: 146, rangeY: 88, dashSpeed: 17, vfxStyle: 'beast_wave', beamColor: '#ef4444' },
      si: { cmd: 'S + I (3 Nộ)', bvnCode: 'TỬ MÔN (SI)', name: 'DẠ KHẢI — HUYẾT LONG BẺ CONG KHÔNG GIAN!!', desc: 'Bốc cháy sinh mệnh trong Tử Môn, hóa Huyết Long lao xuyên không gian kết liễu đối thủ!', dmg: 425, qiCost: 300, cooldown: 60, isBreakDef: true, type: 'domain_super', domainColor: '#991b1b', domainFrames: 105, domainLabel: 'TỬ MÔN: DẠ KHẢI!!', beamColor: '#ef4444', vfxStyle: 'beast_wave' }
    }
  },
  {
    id: 'madara',
    name: 'Uchiha Madara',
    title: 'Huyền Thoại Tộc Uchiha / Lục Đạo Thập Vĩ Rinnegan',
    universe: 'naruto',
    universeLabel: 'Naruto Shippuden',
    difficulty: 'Trung bình',
    archetype: 'Boss toàn diện / Luân Mộ, Phản Chấn & Lục Đạo [J+K]',
    hpMax: 1130,
    speed: 7.2,
    jumpPower: 15.6,
    colors: { primary: '#991b1b', secondary: '#1e1b4b', hair: '#09090b', aura: '#6366f1', awakenAura: '#a855f7' },
    awakenName: 'Lục Đạo Thập Vĩ Madara',
    awakenedForm: {
      name: 'Lục Đạo Thập Vĩ Madara',
      dmgMult: 1.38,
      speedMult: 1.2,
      superArmorHits: 2,
      auraColor: '#c084fc'
    },
    meleeProfile: {
      j: { rangeX: 124, rangeY: 82, vx: 8, stateTimer: 12, vfxStyle: 'slash_arc', color: '#818cf8' },
      wj: { rangeX: 120, rangeY: 100, vy: -15.6, stateTimer: 19, vfxStyle: 'slash_arc', color: '#6366f1' },
      sj: { rangeX: 140, rangeY: 84, vx: 14.5, stateTimer: 19, vfxStyle: 'beast_wave', color: '#a855f7' }
    },
    quote: 'Ngươi có muốn khiêu vũ cùng ta không? Hãy xem ngươi đỡ Thiên Thạch thứ hai thế nào!',
    skills: {
      j: { cmd: 'J', bvnCode: 'ATTACK (砍1-4)', name: 'Quạt Gunbai & Lưỡi Hái Liên Kích', desc: 'Vung quạt chiến Gunbai đánh 4 nhịp rộng đầy áp lực của chiến thần.', dmg: 27, qiGain: 16, cooldown: 0, type: 'melee_combo', vfxStyle: 'slash_arc' },
      wj: { cmd: 'W + J', bvnCode: 'SKILL_2 (WJ)', name: 'Susanoo Trảm Thiên', desc: 'Triệu hồi cánh tay Susanoo xanh chém hất đối thủ bay lên không.', dmg: 76, qiGain: 22, cooldown: 35, type: 'anti_air', vfxStyle: 'slash_arc' },
      sj: { cmd: 'S + J', bvnCode: 'SKILL_1 (SJ)', name: 'Luân Mộ Biên Ngục (Limbo Clone)', desc: 'Phân thân vô hình từ chiều không gian Luân Mộ bất ngờ tung đòn trễ phá giáp!', dmg: 96, qiGain: 28, cooldown: 44, isBreakDef: true, type: 'ghost_followup', delayFrames: 12, rangeX: 138, rangeY: 86, dashToTarget: true, vfxStyle: 'beast_wave', beamColor: '#818cf8' },
      u: { cmd: 'U', bvnCode: 'ZHAO_1 (U)', name: 'Hỏa Độn: Hào Hỏa Diệt Khước', desc: 'Phun biển lửa thành 4 đợt cầu lửa khổng lồ thiêu rụi phía trước.', dmg: 64, qiGain: 20, cooldown: 34, type: 'multi_projectile', projCount: 4, projSpeed: 14, projSize: 24, projSpread: 0.24, beamColor: '#f97316', vfxStyle: 'beast_wave' },
      wu: { cmd: 'W + U', bvnCode: 'ZHAO_3 (WU)', name: 'Tiên Pháp: Lam Độn Quang Nha (Light Fang)', desc: 'Phóng tia laser ánh sáng tím trắng siêu mỏng cắt đôi toàn màn hình.', dmg: 96, qiGain: 28, cooldown: 52, isBreakDef: true, type: 'beam_laser', beamColor: '#c084fc', beamWidth: 30, beamDuration: 20, vfxStyle: 'lightning_bolt' },
      su: { cmd: 'S + U', bvnCode: 'ZHAO_2 (SU)', name: 'Uchiha Phản Chấn (Uchiha Reflection)', desc: 'Dùng quạt Gunbai hấp thụ toàn bộ đòn tấn công và phản chấn 1.55x sát thương!', dmg: 88, qiGain: 26, cooldown: 48, isBreakDef: true, type: 'true_counter', windowFrames: 26, counterMult: 1.55, counterRangeX: 170, vfxStyle: 'beast_wave', beamColor: '#ef4444', counterLabel: 'UCHIHA PHẢN CHẤN!!' },
      i: { cmd: 'I (1 Nộ)', bvnCode: 'BISHA (I)', name: 'Toàn Chân Thể Susanoo: Song Kiếm Xẻ Núi', desc: 'Vung kiếm Susanoo khổng lồ phóng sóng kiếm khí xanh chẻ đôi mặt sân.', dmg: 202, qiCost: 100, cooldown: 42, isBreakDef: true, type: 'bisha_projectile', vfxStyle: 'slash_arc' },
      wi: { cmd: 'W + I (1 Nộ)', bvnCode: 'BISHA_UP (WI)', name: 'Địa Bộc Thiên Tinh (Chibaku Tensei Drop)', desc: 'Triệu hồi khối cầu đá trọng lực từ trên cao giáng xuống đè bẹp đối thủ.', dmg: 205, qiCost: 100, cooldown: 45, isBreakDef: true, type: 'bisha_dive', vfxStyle: 'spiral_orb' },
      si: { cmd: 'S + I (3 Nộ)', bvnCode: 'BISHA_SUPER (SI)', name: 'Thiên Ngại Chấn Tinh (Tengai Shinsei — Song Thiên Thạch)', desc: 'Kết ấn kép triệu hồi hai siêu thiên thạch khổng lồ nhuộm đỏ bầu trời nghiền nát cả đấu trường.', dmg: 385, qiCost: 300, cooldown: 65, isBreakDef: true, type: 'domain_super', domainColor: '#7c2d12', domainFrames: 105, domainLabel: 'THIÊN NGẠI CHẤN TINH!!', beamColor: '#f97316', vfxStyle: 'spiral_orb' }
    },
    awakenedSkills: {
      wu: { cmd: 'W + U', bvnCode: 'LỤC ĐẠO (WU)', name: 'Địa Bộc Thiên Tinh: Hút Trọng Lực', desc: 'Khóa đối thủ trong cầu trọng lực Chibaku Tensei nghiền nát đa nhịp!', dmg: 112, qiGain: 28, cooldown: 50, isBreakDef: true, type: 'command_grab', grabRangeX: 180, holdFrames: 38, ticks: 3, vfxStyle: 'spiral_orb', beamColor: '#a855f7', grabLabel: 'CHIBAKU TENSEI!!' },
      si: { cmd: 'S + I (3 Nộ)', bvnCode: 'LỤC ĐẠO (SI)', name: 'Mugen Tsukuyomi — Nguyệt Độc Vĩnh Cửu!!', desc: 'Mở Luân Hồi Tả Luân Nhãn trên Mặt Trăng Đỏ, phủ ánh sáng vô hạn lên toàn chiến trường!', dmg: 415, qiCost: 300, cooldown: 62, isBreakDef: true, type: 'domain_super', domainColor: '#991b1b', domainFrames: 112, domainLabel: 'MUGEN TSUKUYOMI!!', beamColor: '#f43f5e', vfxStyle: 'spiral_orb' }
    }
  },

  // ==================== 13. HUNTER X HUNTER (EXTRA) ====================
  {
    id: 'gon_adult',
    name: 'Gon Freecss (Dạng Trưởng Thành)',
    title: 'Lời Thề Hắc Niệm / Sức Mạnh Đánh Đổi Tất Cả',
    universe: 'hxh',
    universeLabel: 'Hunter x Hunter',
    difficulty: 'Trung bình',
    archetype: 'Sát thương hủy diệt / Cận chiến cực đại',
    hpMax: 1080,
    speed: 8.0,
    jumpPower: 16.5,
    colors: { primary: '#15803d', secondary: '#09090b', hair: '#020617', aura: '#f59e0b', awakenAura: '#111827' },
    awakenName: 'Black Nen Vow (Hắc Niệm Tuyệt Vọng)',
    awakenedForm: {
      name: 'Black Nen Vow (Hắc Niệm Tuyệt Vọng)',
      dmgMult: 1.45,
      speedMult: 1.22,
      superArmorHits: 2,
      hpDrainPerSec: 15,
      auraColor: '#f59e0b'
    },
    meleeProfile: {
      j: { rangeX: 118, rangeY: 82, vx: 9, stateTimer: 13, vfxStyle: 'beast_wave', color: '#f59e0b' },
      wj: { rangeX: 114, rangeY: 102, vy: -16.5, stateTimer: 19, vfxStyle: 'beast_wave', color: '#facc15' },
      sj: { rangeX: 138, rangeY: 86, vx: 16, stateTimer: 19, vfxStyle: 'beast_wave', color: '#f59e0b' }
    },
    quote: 'Ta không cần tương lai nữa... Dùng tất cả sức mạnh của ta tại đây! ĐẦU TIÊN LÀ BÚA!',
    skills: {
      j: { cmd: 'J', bvnCode: 'ATTACK (砍1-4)', name: 'Hắc Niệm Quyền Cước Liên Hoàn', desc: 'Tung 4 đòn đấm đá nặng tựa ngàn cân với sát khí đen kịt.', dmg: 28, qiGain: 16, cooldown: 0, type: 'melee_combo', vfxStyle: 'beast_wave' },
      wj: { cmd: 'W + J', bvnCode: 'SKILL_2 (WJ)', name: 'Thượng Cước Phá Thiên', desc: 'Tung cú đá sút thẳng hất đối thủ bay vút lên tận trần nhà.', dmg: 78, qiGain: 22, cooldown: 34, type: 'anti_air', vfxStyle: 'beast_wave' },
      sj: { cmd: 'S + J', bvnCode: 'SKILL_1 (SJ)', name: 'Jajanken: Rock Đột Kích', desc: 'Lao vút tới trong chớp mắt tung cú đấm Búa phá tan mọi phòng thủ.', dmg: 98, qiGain: 28, cooldown: 45, isBreakDef: true, type: 'dash_strike', vfxStyle: 'beast_wave' },
      u: { cmd: 'U', bvnCode: 'ZHAO_1 (U)', name: 'Jajanken: Paper (Khí Đạn Hắc Niệm)', desc: 'Bắn quả cầu niệm khí đen-vàng cực lớn đẩy lùi kẻ địch tầm xa.', dmg: 66, qiGain: 20, cooldown: 34, type: 'projectile', projSpeed: 14, projSize: 28, vfxStyle: 'spiral_orb', beamColor: '#f59e0b' },
      wu: { cmd: 'W + U', bvnCode: 'ZHAO_3 (WU)', name: 'Jajanken: Scissors Liên Trảm', desc: 'Kéo dài lưỡi kiếm niệm vàng rực chém 5 nhát liên thanh xé đôi đối thủ.', dmg: 100, qiGain: 28, cooldown: 50, isBreakDef: true, type: 'multi_hit_rush', hits: 5, hitInterval: 4, rangeX: 136, rangeY: 84, dashSpeed: 12, vfxStyle: 'slash_arc', beamColor: '#facc15' },
      su: { cmd: 'S + U', bvnCode: 'ZHAO_2 (SU)', name: 'Bộc Phát Lời Thề Hắc Niệm', desc: 'Tóc dựng đứng chạm trời, tăng đột biến sát thương và tốc độ di chuyển.', dmg: 45, qiGain: 24, cooldown: 68, type: 'buff_install', speedBuff: 1.34, dmgBuff: 1.38, buffFrames: 280, healAmount: 40, beamColor: '#f59e0b', vfxStyle: 'beast_wave' },
      i: { cmd: 'I (1 Nộ)', bvnCode: 'BISHA (I)', name: 'Jajanken: Rock Xung Kích Hắc Ám', desc: 'Giáng cú đấm Búa tạo cột sóng xung kích đen-cam xé toạc toàn màn hình.', dmg: 206, qiCost: 100, cooldown: 44, isBreakDef: true, type: 'beam_laser', beamColor: '#f59e0b', beamWidth: 46, beamDuration: 24, vfxStyle: 'beast_wave' },
      wi: { cmd: 'W + I (1 Nộ)', bvnCode: 'BISHA_UP (WI)', name: 'Đá Hất & Liên Hoàn Nghiền Nát', desc: 'Xuất hiện trên không giáng cú đấm Búa nhấn chìm đối thủ xuống mặt đất.', dmg: 204, qiCost: 100, cooldown: 44, isBreakDef: true, type: 'bisha_dive', vfxStyle: 'beast_wave' },
      si: { cmd: 'S + I (3 Nộ)', bvnCode: 'BISHA_SUPER (SI)', name: 'Hắc Niệm Tuyệt Diệt: Cú Đấm Đánh Đổi Tất Cả', desc: 'Không gian hóa trắng đen đầy áp lực, giải phóng toàn bộ niệm lực trong vụ nổ diệt sạch cánh rừng.', dmg: 390, qiCost: 300, cooldown: 65, isBreakDef: true, type: 'domain_super', domainColor: '#18181b', domainFrames: 105, domainLabel: 'JAJANKEN: BLACK ROCK!!', beamColor: '#facc15', vfxStyle: 'beast_wave' }
    }
  },
  {
    id: 'killua_godspeed',
    name: 'Killua Zoldyck (Godspeed)',
    title: 'Thần Tốc Kanmuru / Sát Thủ Lôi Điện',
    universe: 'hxh',
    universeLabel: 'Hunter x Hunter',
    difficulty: 'Trung bình',
    archetype: 'Tốc độ nhanh nhất game / Phản xạ sấm sét',
    hpMax: 950,
    speed: 8.5,
    jumpPower: 16.4,
    colors: { primary: '#38bdf8', secondary: '#1e293b', hair: '#f1f5f9', aura: '#0ea5e9', awakenAura: '#7dd3fc' },
    awakenName: 'Kanmuru: Whirlwind & Speed of Lightning (Thần Tốc Tuyệt Đối)',
    meleeProfile: {
      j: { rangeX: 104, rangeY: 74, vx: 10, stateTimer: 9, vfxStyle: 'lightning_bolt', color: '#38bdf8' },
      wj: { rangeX: 102, rangeY: 96, vy: -16.4, stateTimer: 16, vfxStyle: 'lightning_bolt', color: '#7dd3fc' },
      sj: { rangeX: 132, rangeY: 78, vx: 17.5, stateTimer: 16, vfxStyle: 'lightning_bolt', color: '#0ea5e9' }
    },
    quote: 'Tốc độ phản xạ của ngươi quá chậm! Trong chế độ Thần Tốc, ngươi chẳng thể chạm vào ta!',
    skills: {
      j: { cmd: 'J', bvnCode: 'ATTACK (砍1-4)', name: 'Móng Vuốt Lôi Điện Liên Trảm', desc: 'Chém 4 nhịp siêu tốc (9f) bọc điện cao thế cực kỳ mượt mà.', dmg: 25, qiGain: 16, cooldown: 0, type: 'melee_combo', vfxStyle: 'lightning_bolt' },
      wj: { cmd: 'W + J', bvnCode: 'SKILL_2 (WJ)', name: 'Điện Quang Thượng Cước', desc: 'Lóe tia chớp xanh đá móc hất tung đối thủ giữa màn sấm sét.', dmg: 74, qiGain: 22, cooldown: 32, type: 'anti_air', vfxStyle: 'lightning_bolt' },
      sj: { cmd: 'S + J', bvnCode: 'SKILL_1 (SJ)', name: 'Speed of Lightning Rush', desc: 'Hóa tia sét xanh xả 6 đòn chém điện liên thanh phá tan phòng thủ.', dmg: 96, qiGain: 26, cooldown: 42, isBreakDef: true, type: 'multi_hit_rush', hits: 6, hitInterval: 4, rangeX: 132, rangeY: 80, dashSpeed: 16, vfxStyle: 'lightning_bolt', beamColor: '#38bdf8' },
      u: { cmd: 'U', bvnCode: 'ZHAO_1 (U)', name: 'Lôi Chưởng Liên Hoàn (Thunderbolt Volley)', desc: 'Phóng 4 tia sét xanh tỏa nhanh khóa chặt đường di chuyển.', dmg: 60, qiGain: 20, cooldown: 30, type: 'multi_projectile', projCount: 4, projSpeed: 18, projSize: 16, projSpread: 0.2, beamColor: '#38bdf8', vfxStyle: 'lightning_bolt' },
      wu: { cmd: 'W + U', bvnCode: 'ZHAO_3 (WU)', name: 'Tật Phong Tấn Lôi (Whirlwind Auto-Counter)', desc: 'Lập trình phản xạ điện giật tự động chặn và phản kích ngay khi bị đánh!', dmg: 84, qiGain: 26, cooldown: 48, isBreakDef: true, type: 'true_counter', windowFrames: 25, counterMult: 1.48, counterRangeX: 165, vfxStyle: 'lightning_bolt', beamColor: '#38bdf8', counterLabel: 'KANMURU WHIRLWIND!' },
      su: { cmd: 'S + U', bvnCode: 'ZHAO_2 (SU)', name: 'Kích Hoạt Thần Tốc (Kanmuru Overcharge)', desc: 'Nạp điện tối đa tăng cực đại tốc độ di chuyển và sát thương sấm sét.', dmg: 38, qiGain: 24, cooldown: 66, type: 'buff_install', speedBuff: 1.46, dmgBuff: 1.28, buffFrames: 300, healAmount: 45, beamColor: '#38bdf8', vfxStyle: 'lightning_bolt' },
      i: { cmd: 'I (1 Nộ)', bvnCode: 'BISHA (I)', name: 'Narukami (Lạc Lôi Giáng Thế)', desc: 'Bắn cột sấm sét xanh chói lòa giật xuyên toàn bộ màn hình.', dmg: 196, qiCost: 100, cooldown: 40, isBreakDef: true, type: 'beam_laser', beamColor: '#38bdf8', beamWidth: 40, beamDuration: 22, vfxStyle: 'lightning_bolt' },
      wi: { cmd: 'W + I (1 Nộ)', bvnCode: 'BISHA_UP (WI)', name: 'Thiên Lôi Trụy Sát', desc: 'Biến thành tia chớp rơi thẳng từ đỉnh màn hình giật nổ mục tiêu.', dmg: 200, qiCost: 100, cooldown: 42, isBreakDef: true, type: 'bisha_dive', vfxStyle: 'lightning_bolt' },
      si: { cmd: 'S + I (3 Nộ)', bvnCode: 'BISHA_SUPER (SI)', name: 'Tối Cường Thần Tốc: Thiên Lôi Trảm Sát', desc: 'Cả sân đấu chìm trong bão điện xanh lam, lao qua lại hàng chục lần trong 1 giây kết liễu kẻ địch.', dmg: 370, qiCost: 300, cooldown: 62, isBreakDef: true, type: 'domain_super', domainColor: '#0369a1', domainFrames: 95, domainLabel: 'KANMURU: GODSPEED!!', beamColor: '#7dd3fc', vfxStyle: 'lightning_bolt' }
    }
  },

  // ==================== 14. FAN-FAVORITE MODERN & CLASSIC ANIME STARS ====================
  {
    id: 'sukuna',
    name: 'Ryomen Sukuna',
    title: 'Vua Nguyền Hồn / Phục Ma Ngự Trù Tử',
    universe: 'jjk',
    universeLabel: 'Jujutsu Kaisen',
    difficulty: 'Trung bình',
    archetype: 'Chém vô hình tầm xa / Vùng trảm & Heian [J+K]',
    hpMax: 1120,
    speed: 7.4,
    jumpPower: 15.8,
    colors: { primary: '#991b1b', secondary: '#18181b', hair: '#f472b6', aura: '#dc2626', awakenAura: '#ef4444' },
    awakenName: 'True Heian Form (Tứ Tý Vua Nguyền Hồn)',
    awakenedForm: {
      name: 'True Heian Form (Tứ Tý Nguyền Vương)',
      dmgMult: 1.38,
      speedMult: 1.2,
      superArmorHits: 2,
      auraColor: '#ef4444'
    },
    meleeProfile: {
      j: { rangeX: 118, rangeY: 80, vx: 8.5, stateTimer: 11, vfxStyle: 'slash_arc', color: '#ef4444' },
      wj: { rangeX: 114, rangeY: 98, vy: -15.8, stateTimer: 18, vfxStyle: 'slash_arc', color: '#dc2626' },
      sj: { rangeX: 136, rangeY: 82, vx: 15, stateTimer: 18, vfxStyle: 'lightning_bolt', color: '#ef4444' }
    },
    quote: 'Hãy biết thân phận của ngươi đi, lũ sâu bọ. Bành Trướng Lãnh Địa — Phục Ma Ngự Trù Tử!',
    skills: {
      j: { cmd: 'J', bvnCode: 'ATTACK (砍1-4)', name: 'Hắc Thiểm & Trảm Kích Nguyền Vương', desc: 'Tung 4 đòn đấm tàn bạo xen lẫn vết cắt chú lực sắc lẹm.', dmg: 27, qiGain: 16, cooldown: 0, type: 'melee_combo', vfxStyle: 'slash_arc' },
      wj: { cmd: 'W + J', bvnCode: 'SKILL_2 (WJ)', name: 'Bát Thượng Trảm (Cleave Upper)', desc: 'Chém rách không khí từ dưới lên hất tung kẻ địch trong màn máu lửa.', dmg: 76, qiGain: 22, cooldown: 34, type: 'anti_air', vfxStyle: 'slash_arc' },
      sj: { cmd: 'S + J', bvnCode: 'SKILL_1 (SJ)', name: 'Hắc Thiểm Đột Kích (Black Flash)', desc: 'Lao vút đi tung cú đấm tia sét đỏ đen phá tan mọi thế thủ.', dmg: 96, qiGain: 28, cooldown: 44, isBreakDef: true, type: 'dash_strike', vfxStyle: 'lightning_bolt' },
      u: { cmd: 'U', bvnCode: 'ZHAO_1 (U)', name: 'Giải — Dismantle (Ngũ Trảm Vô Hình)', desc: 'Búng tay phóng 5 nhát chém chú lực vô hình xé toạc tầm xa.', dmg: 64, qiGain: 20, cooldown: 32, type: 'multi_projectile', projCount: 5, projSpeed: 18, projSize: 16, projSpread: 0.22, beamColor: '#ef4444', vfxStyle: 'blade_volley' },
      wu: { cmd: 'W + U', bvnCode: 'ZHAO_3 (WU)', name: 'Lưới Trảm Nhện — Phục Ma Trảm Vực', desc: 'Tạo vùng lưới chém chú lực vô hình trên mặt sân cắt xé liên tục và làm chậm đối thủ!', dmg: 96, qiGain: 28, cooldown: 54, isBreakDef: true, type: 'dot_hazard', duration: 220, tickInterval: 23, tickDmg: 24, radius: 115, slowMult: 0.64, vfxStyle: 'slash_arc', beamColor: '#dc2626', hazardLabel: 'PHỤC MA TRẢM VỰC!' },
      su: { cmd: 'S + U', bvnCode: 'ZHAO_2 (SU)', name: 'Phản Chuyển Thuật Thức (Reverse Cursed Technique)', desc: 'Tái tạo vết thương tức thì hồi lượng lớn HP và tăng mạnh chú lực.', dmg: 35, qiGain: 24, cooldown: 72, type: 'buff_install', speedBuff: 1.26, dmgBuff: 1.28, buffFrames: 260, healAmount: 85, beamColor: '#dc2626', vfxStyle: 'slash_arc' },
      i: { cmd: 'I (1 Nộ)', bvnCode: 'BISHA (I)', name: 'Trảm Chém Đôi Thế Giới (World Cutting Slash)', desc: 'Chém thẳng vào chính không gian, sóng trảm không thể phòng thủ quét sạch phía trước.', dmg: 206, qiCost: 100, cooldown: 44, isBreakDef: true, type: 'bisha_projectile', vfxStyle: 'slash_arc', beamColor: '#ef4444' },
      wi: { cmd: 'W + I (1 Nộ)', bvnCode: 'BISHA_UP (WI)', name: 'Khai — Fuga Hỏa Tiễn', desc: 'Kéo cung ngọn lửa thần thánh bắn cột lửa đỏ cam xuyên toàn màn hình.', dmg: 204, qiCost: 100, cooldown: 44, isBreakDef: true, type: 'beam_laser', beamColor: '#f97316', beamWidth: 44, beamDuration: 24, vfxStyle: 'beast_wave' },
      si: { cmd: 'S + I (3 Nộ)', bvnCode: 'BISHA_SUPER (SI)', name: 'Bành Trướng Lãnh Địa: Phục Ma Ngự Trù Tử (Malevolent Shrine)', desc: 'Triệu hồi ngôi đền máu giữa bầu trời đỏ thẫm, xả hàng ngàn nhát Giải và Bát kết liễu bằng Fuga.', dmg: 390, qiCost: 300, cooldown: 65, isBreakDef: true, type: 'domain_super', domainColor: '#7f1d1d', domainFrames: 110, domainLabel: 'LÃNH ĐỊA: PHỤC MA NGỰ TRÙ TỬ!!', beamColor: '#ef4444', vfxStyle: 'slash_arc' }
    },
    awakenedSkills: {
      sj: { cmd: 'S + J', bvnCode: 'HEIAN (SJ)', name: 'Tứ Tý Bát Trảm Liên Hoàn', desc: 'Bốn cánh tay xả 6 nhát Giải & Bát đồng thời xé nát kẻ địch.', dmg: 118, qiGain: 28, cooldown: 40, isBreakDef: true, type: 'multi_hit_rush', hits: 6, hitInterval: 4, rangeX: 140, rangeY: 88, dashSpeed: 14, vfxStyle: 'slash_arc', beamColor: '#ef4444' }
    }
  },
  {
    id: 'zenitsu',
    name: 'Agatsuma Zenitsu',
    title: 'Hơi Thở Sấm Sét / Hỏa Lôi Thần',
    universe: 'kny',
    universeLabel: 'Kimetsu no Yaiba',
    difficulty: 'Dễ (Khuyên dùng)',
    archetype: 'Lao chém sấm sét siêu tốc (9f) / Thần Tốc',
    hpMax: 940,
    speed: 8.4,
    jumpPower: 16.2,
    colors: { primary: '#facc15', secondary: '#f97316', hair: '#fde047', aura: '#facc15', awakenAura: '#38bdf8' },
    awakenName: 'Godspeed Thunder Breathing (Thần Tốc Hỏa Lôi)',
    meleeProfile: {
      j: { rangeX: 116, rangeY: 74, vx: 10, stateTimer: 9, vfxStyle: 'lightning_bolt', color: '#fde047' },
      wj: { rangeX: 112, rangeY: 96, vy: -16.2, stateTimer: 16, vfxStyle: 'lightning_bolt', color: '#facc15' },
      sj: { rangeX: 142, rangeY: 78, vx: 18, stateTimer: 16, vfxStyle: 'lightning_bolt', color: '#fef08a' }
    },
    quote: 'Hơi Thở Sấm Sét — Thức Thứ Nhất: Phích Lịch Nhất Thiểm!!',
    skills: {
      j: { cmd: 'J', bvnCode: 'ATTACK (砍1-4)', name: 'Nhật Luân Đao Lôi Trảm', desc: 'Rút kiếm chém 4 nhịp cực nhanh (9f) tóe tia điện vàng chói.', dmg: 25, qiGain: 16, cooldown: 0, type: 'melee_combo', vfxStyle: 'lightning_bolt' },
      wj: { cmd: 'W + J', bvnCode: 'SKILL_2 (WJ)', name: 'Lôi Điện Thượng Thiểm', desc: 'Lướt chéo lên trời kèm tiếng sấm nổ hất tung kẻ địch.', dmg: 74, qiGain: 22, cooldown: 32, type: 'anti_air', vfxStyle: 'lightning_bolt' },
      sj: { cmd: 'S + J', bvnCode: 'SKILL_1 (SJ)', name: 'Phích Lịch Nhất Thiểm — Lục Liên', desc: 'Biến thành tia sét vàng lao chém 5 nhát siêu thanh xuyên phá phòng thủ!', dmg: 98, qiGain: 28, cooldown: 42, isBreakDef: true, type: 'multi_hit_rush', hits: 5, hitInterval: 4, rangeX: 140, rangeY: 82, dashSpeed: 17, vfxStyle: 'lightning_bolt', beamColor: '#facc15' },
      u: { cmd: 'U', bvnCode: 'ZHAO_1 (U)', name: 'Lục Liên Tia Sét (Sixfold Lightning)', desc: 'Bắn 4 vệt sét zig-zag liên hoàn cắt ngang mặt sân cực nhanh.', dmg: 60, qiGain: 20, cooldown: 32, type: 'multi_projectile', projCount: 4, projSpeed: 18, projSize: 16, projSpread: 0.2, beamColor: '#facc15', vfxStyle: 'lightning_bolt' },
      wu: { cmd: 'W + U', bvnCode: 'ZHAO_3 (WU)', name: 'Phích Lịch Thần Tốc Dịch Chuyển', desc: 'Lóe chớp để lại tàn ảnh rồi bất ngờ chém tia sét trễ ngay sau lưng mục tiêu.', dmg: 92, qiGain: 28, cooldown: 46, isBreakDef: true, type: 'ghost_followup', delayFrames: 10, rangeX: 136, rangeY: 82, dashToTarget: true, vfxStyle: 'lightning_bolt', beamColor: '#fde047' },
      su: { cmd: 'S + U', bvnCode: 'ZHAO_2 (SU)', name: 'Trạng Thái Ngủ Say & Thần Tốc', desc: 'Nhắm mắt tiến vào trạng thái bản năng tăng tối đa tốc độ và sát thương kiếm.', dmg: 35, qiGain: 24, cooldown: 66, type: 'buff_install', speedBuff: 1.44, dmgBuff: 1.3, buffFrames: 290, healAmount: 45, beamColor: '#fde047', vfxStyle: 'lightning_bolt' },
      i: { cmd: 'I (1 Nộ)', bvnCode: 'BISHA (I)', name: 'Bát Liên — Bão Sấm Sét (Eightfold)', desc: 'Phóng đường kiếm sấm sét dày đặc chớp lòa xuyên suốt toàn màn hình.', dmg: 196, qiCost: 100, cooldown: 40, isBreakDef: true, type: 'beam_laser', beamColor: '#fde047', beamWidth: 38, beamDuration: 20, vfxStyle: 'lightning_bolt' },
      wi: { cmd: 'W + I (1 Nộ)', bvnCode: 'BISHA_UP (WI)', name: 'Thần Tốc Lôi Giáng', desc: 'Nhảy cao rồi lao xuống như tia sét đánh thẳng vào đầu kẻ địch.', dmg: 200, qiCost: 100, cooldown: 42, isBreakDef: true, type: 'bisha_dive', vfxStyle: 'lightning_bolt' },
      si: { cmd: 'S + I (3 Nộ)', bvnCode: 'BISHA_SUPER (SI)', name: 'Thức Thứ Bảy: Hỏa Lôi Thần (Flaming Thunder God)', desc: 'Triệu hồi Lôi Long Vàng khổng lồ lao xuyên bóng đêm chém đứt mọi mục tiêu trên màn hình.', dmg: 375, qiCost: 300, cooldown: 62, isBreakDef: true, type: 'domain_super', domainColor: '#a16207', domainFrames: 95, domainLabel: 'THỨC THỨ 7: HỎA LÔI THẦN!!', beamColor: '#fef08a', vfxStyle: 'lightning_bolt' }
    }
  },
  {
    id: 'ace',
    name: 'Portgas D. Ace',
    title: 'Hỏa Quyền / Đội Trưởng Đội 2 Băng Râu Trắng',
    universe: 'onepiece',
    universeLabel: 'One Piece',
    difficulty: 'Dễ (Khuyên dùng)',
    archetype: 'Hỏa lực đốt sàn / Hệ Logia áp đảo',
    hpMax: 1020,
    speed: 7.2,
    jumpPower: 15.6,
    colors: { primary: '#f97316', secondary: '#7c2d12', hair: '#09090b', aura: '#fb923c', awakenAura: '#ef4444' },
    awakenName: 'Mera Mera Awakening: Flame Emperor (Viêm Đế)',
    meleeProfile: {
      j: { rangeX: 116, rangeY: 78, vx: 8, stateTimer: 12, vfxStyle: 'beast_wave', color: '#fb923c' },
      wj: { rangeX: 112, rangeY: 98, vy: -15.6, stateTimer: 18, vfxStyle: 'beast_wave', color: '#f97316' },
      sj: { rangeX: 134, rangeY: 80, vx: 14.5, stateTimer: 19, vfxStyle: 'beast_wave', color: '#ea580c' }
    },
    quote: 'Cảm ơn vì đã yêu thương ta! HỎA QUYỀN — HIKEN!!',
    skills: {
      j: { cmd: 'J', bvnCode: 'ATTACK (砍1-4)', name: 'Mera Mera Hỏa Quyền Liên Kích', desc: 'Tung 4 cú đấm bốc cháy rực rỡ với tầm lửa văng rộng.', dmg: 26, qiGain: 16, cooldown: 0, type: 'melee_combo', vfxStyle: 'beast_wave' },
      wj: { cmd: 'W + J', bvnCode: 'SKILL_2 (WJ)', name: 'Hỏa Trụ Thăng Thiên (Fire Pillar)', desc: 'Kích nổ cột lửa xoáy thẳng lên trời hất văng kẻ địch.', dmg: 74, qiGain: 22, cooldown: 34, type: 'anti_air', vfxStyle: 'beast_wave' },
      sj: { cmd: 'S + J', bvnCode: 'SKILL_1 (SJ)', name: 'Hỏa Đạt Ma Xung Phong', desc: 'Hóa toàn thân thành ngọn lửa lao xuyên qua hàng phòng ngự.', dmg: 90, qiGain: 26, cooldown: 44, isBreakDef: true, type: 'dash_strike', vfxStyle: 'beast_wave' },
      u: { cmd: 'U', bvnCode: 'ZHAO_1 (U)', name: 'Hỏa Súng — Higan (Fire Fist Volley)', desc: 'Chĩa hai ngón tay bắn liên tiếp 5 viên đạn lửa tốc độ cao.', dmg: 62, qiGain: 20, cooldown: 32, type: 'multi_projectile', projCount: 5, projSpeed: 16, projSize: 18, projSpread: 0.2, beamColor: '#fb923c', vfxStyle: 'orb' },
      wu: { cmd: 'W + U', bvnCode: 'ZHAO_3 (WU)', name: 'Biển Lửa Mera Mera (Hỏa Ngục Đốt Sàn)', desc: 'Đốt cháy mặt sân tạo vòng lửa thiêu đốt liên tục theo thời gian và kìm chân kẻ địch.', dmg: 92, qiGain: 28, cooldown: 54, isBreakDef: true, type: 'dot_hazard', duration: 220, tickInterval: 24, tickDmg: 23, radius: 118, slowMult: 0.68, vfxStyle: 'beast_wave', beamColor: '#f97316', hazardLabel: 'HỎA NGỤC MERA MERA!' },
      su: { cmd: 'S + U', bvnCode: 'ZHAO_2 (SU)', name: 'Viêm Giới Logia (Logia Counter)', desc: 'Hóa thân thành lửa nguyên tố vô hiệu hóa đòn đánh và bùng nổ phản kích!', dmg: 80, qiGain: 25, cooldown: 48, isBreakDef: true, type: 'true_counter', windowFrames: 25, counterMult: 1.46, counterRangeX: 160, vfxStyle: 'beast_wave', beamColor: '#fb923c', counterLabel: 'LOGIA HỎA GIỚI!' },
      i: { cmd: 'I (1 Nộ)', bvnCode: 'BISHA (I)', name: 'Hỏa Quyền — Hiken (Fire Fist Beam)', desc: 'Biến cánh tay thành cột lửa khổng lồ bắn xuyên thẳng toàn màn hình.', dmg: 198, qiCost: 100, cooldown: 42, isBreakDef: true, type: 'beam_laser', beamColor: '#f97316', beamWidth: 44, beamDuration: 24, vfxStyle: 'beast_wave' },
      wi: { cmd: 'W + I (1 Nộ)', bvnCode: 'BISHA_UP (WI)', name: 'Huỳnh Hỏa: Hỏa Đạt Ma Trụy Lạc', desc: 'Rải đom đóm lửa trên cao rồi kích nổ giáng xuống đầu đối thủ.', dmg: 198, qiCost: 100, cooldown: 44, isBreakDef: true, type: 'bisha_dive', vfxStyle: 'orb' },
      si: { cmd: 'S + I (3 Nộ)', bvnCode: 'BISHA_SUPER (SI)', name: 'Đại Viêm Giới: Viêm Đế (Entei — Mặt Trời Lửa)', desc: 'Tụ tập biển lửa tạo mặt trời rực cháy khổng lồ thiêu hủy toàn bộ chiến trường.', dmg: 375, qiCost: 300, cooldown: 64, isBreakDef: true, type: 'domain_super', domainColor: '#c2410c', domainFrames: 100, domainLabel: 'ĐẠI VIÊM GIỚI: VIÊM ĐẾ!!', beamColor: '#fb923c', vfxStyle: 'spiral_orb' }
    }
  },
  {
    id: 'law',
    name: 'Trafalgar D. Water Law',
    title: 'Bác Sĩ Tử Thần / Trái Ope Ope Thức Tỉnh',
    universe: 'onepiece',
    universeLabel: 'One Piece',
    difficulty: 'Trung bình',
    archetype: 'Khống chế không gian ROOM / Tóm & Dịch chuyển',
    hpMax: 1000,
    speed: 7.0,
    jumpPower: 15.5,
    colors: { primary: '#eab308', secondary: '#0f172a', hair: '#09090b', aura: '#38bdf8', awakenAura: '#22d3ee' },
    awakenName: 'K-ROOM & R-ROOM Awakening (Phẫu Thuật Thức Tỉnh)',
    meleeProfile: {
      j: { rangeX: 126, rangeY: 80, vx: 7.5, stateTimer: 12, vfxStyle: 'slash_arc', color: '#38bdf8' },
      wj: { rangeX: 120, rangeY: 98, vy: -15.5, stateTimer: 19, vfxStyle: 'slash_arc', color: '#22d3ee' },
      sj: { rangeX: 140, rangeY: 82, vx: 14, stateTimer: 19, vfxStyle: 'lightning_bolt', color: '#38bdf8' }
    },
    quote: 'ROOM!! Trong không gian này, mạng sống của ngươi nằm trên bàn mổ của ta!',
    skills: {
      j: { cmd: 'J', bvnCode: 'ATTACK (砍1-4)', name: 'Yêu Đao Kikoku Liên Trảm', desc: 'Vung đại đao Kikoku chém 4 nhịp tầm dài 126px kết hợp xung lực ROOM.', dmg: 25, qiGain: 16, cooldown: 0, type: 'melee_combo', vfxStyle: 'slash_arc' },
      wj: { cmd: 'W + J', bvnCode: 'SKILL_2 (WJ)', name: 'Tact (Nhấc Bổng Trọng Lực)', desc: 'Hất ngón tay gọi tảng đá và đường kiếm hất đối thủ bay lên không.', dmg: 74, qiGain: 22, cooldown: 34, type: 'anti_air', vfxStyle: 'slash_arc' },
      sj: { cmd: 'S + J', bvnCode: 'SKILL_1 (SJ)', name: 'ROOM: Shambles Tập Kích', desc: 'Hoán đổi không gian để lại tàn ảnh rồi chém Counter Shock trễ phá giáp!', dmg: 94, qiGain: 28, cooldown: 44, isBreakDef: true, type: 'ghost_followup', delayFrames: 11, rangeX: 136, rangeY: 84, dashToTarget: true, vfxStyle: 'lightning_bolt', beamColor: '#38bdf8' },
      u: { cmd: 'U', bvnCode: 'ZHAO_1 (U)', name: 'Radio Knife (Chém Xung Điện Tầm Xa)', desc: 'Phóng đường kiếm điện xanh cắt xuyên phòng ngự từ xa.', dmg: 64, qiGain: 20, cooldown: 32, type: 'projectile', projSpeed: 16, projSize: 24, vfxStyle: 'slash_arc', beamColor: '#38bdf8' },
      wu: { cmd: 'W + U', bvnCode: 'ZHAO_3 (WU)', name: 'ROOM: Tact Phẫu Thuật Khóa Cứng', desc: 'Mở vòm xanh Ope Ope khóa chặt đối thủ từ xa, giật điện phẫu thuật đa nhịp phá giáp!', dmg: 96, qiGain: 28, cooldown: 54, isBreakDef: true, type: 'command_grab', grabRangeX: 182, holdFrames: 36, ticks: 3, vfxStyle: 'lightning_bolt', beamColor: '#0ea5e9', grabLabel: 'ROOM: TACT!!' },
      su: { cmd: 'S + U', bvnCode: 'ZHAO_2 (SU)', name: 'Phẫu Thuật Tái Tạo (Ope Recovery)', desc: 'Dùng năng lực Ope Ope chữa lành chấn thương, hồi HP và tăng tốc độ.', dmg: 35, qiGain: 22, cooldown: 70, type: 'buff_install', speedBuff: 1.28, dmgBuff: 1.24, buffFrames: 260, healAmount: 75, beamColor: '#38bdf8', vfxStyle: 'spiral_orb' },
      i: { cmd: 'I (1 Nộ)', bvnCode: 'BISHA (I)', name: 'Gamma Knife (Dao Bức Xạ Gamma)', desc: 'Phóng tia lưỡi kiếm năng lượng xanh lục xuyên thấu nội tạng đối thủ.', dmg: 198, qiCost: 100, cooldown: 42, isBreakDef: true, type: 'beam_laser', beamColor: '#22c55e', beamWidth: 34, beamDuration: 22, vfxStyle: 'lightning_bolt' },
      wi: { cmd: 'W + I (1 Nộ)', bvnCode: 'BISHA_UP (WI)', name: 'K-ROOM: Anesthesia & Shock Wille', desc: 'Kéo dài Kikoku đâm xuyên từ trên cao kích hoạt sóng chấn động điện.', dmg: 204, qiCost: 100, cooldown: 45, isBreakDef: true, type: 'bisha_dive', vfxStyle: 'lightning_bolt' },
      si: { cmd: 'S + I (3 Nộ)', bvnCode: 'BISHA_SUPER (SI)', name: 'K-ROOM: Puncture Wille (Chấn Động Xuyên Địa Tầng)', desc: 'Phủ vòm ánh lam toàn sân, đâm đại kiếm xuyên lòng đất tạo vụ nổ sóng xung kích hủy diệt.', dmg: 375, qiCost: 300, cooldown: 64, isBreakDef: true, type: 'domain_super', domainColor: '#0369a1', domainFrames: 100, domainLabel: 'K-ROOM: PUNCTURE WILLE!!', beamColor: '#38bdf8', vfxStyle: 'lightning_bolt' }
    }
  },
  {
    id: 'aizen',
    name: 'Sosuke Aizen',
    title: 'Chúa Tể Hueco Mundo / Kính Hoa Thủy Nguyệt',
    universe: 'bleach',
    universeLabel: 'Bleach (BVN Core)',
    difficulty: 'Trung bình',
    archetype: 'Ảo giác phản đòn / Hắc Quan & Băng Ngọc [J+K]',
    hpMax: 1120,
    speed: 7.3,
    jumpPower: 15.7,
    colors: { primary: '#f8fafc', secondary: '#4c1d95', hair: '#451a03', aura: '#a855f7', awakenAura: '#c084fc' },
    awakenName: 'Hogyoku Transcendence (Băng Ngọc Siêu Việt)',
    awakenedForm: {
      name: 'Hogyoku Transcendence (Băng Ngọc Siêu Việt)',
      dmgMult: 1.38,
      speedMult: 1.22,
      superArmorHits: 2,
      auraColor: '#c084fc'
    },
    meleeProfile: {
      j: { rangeX: 122, rangeY: 80, vx: 8, stateTimer: 12, vfxStyle: 'slash_arc', color: '#c084fc' },
      wj: { rangeX: 118, rangeY: 98, vy: -15.7, stateTimer: 18, vfxStyle: 'slash_arc', color: '#a855f7' },
      sj: { rangeX: 138, rangeY: 82, vx: 15, stateTimer: 18, vfxStyle: 'slash_arc', color: '#7c3aed' }
    },
    quote: 'Từ bao giờ ngươi nghĩ ta chưa kích hoạt Kính Hoa Thủy Nguyệt? Quỳ xuống trước Hắc Quan!',
    skills: {
      j: { cmd: 'J', bvnCode: 'ATTACK (砍1-4)', name: 'Kính Hoa Thủy Nguyệt Liên Trảm', desc: 'Vung Trảm Hồn Đao chém 4 nhịp thanh thoát nhưng đầy uy áp linh lực.', dmg: 27, qiGain: 16, cooldown: 0, type: 'melee_combo', vfxStyle: 'slash_arc' },
      wj: { cmd: 'W + J', bvnCode: 'SKILL_2 (WJ)', name: 'Thuấn Bộ Thượng Trảm', desc: 'Biến mất trước mặt rồi chém hất đối thủ bay lên không trung.', dmg: 76, qiGain: 22, cooldown: 34, type: 'anti_air', vfxStyle: 'slash_arc' },
      sj: { cmd: 'S + J', bvnCode: 'SKILL_1 (SJ)', name: 'Hado #54: Haien (Phế Viêm Đột Kích)', desc: 'Lao tới phóng linh áp tím đốt sạch và phá vỡ phòng ngự kẻ địch.', dmg: 94, qiGain: 28, cooldown: 44, isBreakDef: true, type: 'dash_strike', vfxStyle: 'beast_wave' },
      u: { cmd: 'U', bvnCode: 'ZHAO_1 (U)', name: 'Hado #63: Raikoho (Tam Lôi Pháo)', desc: 'Phóng 3 tia sấm linh áp vàng-tím xuyên nhanh qua chiến trường.', dmg: 64, qiGain: 20, cooldown: 34, type: 'multi_projectile', projCount: 3, projSpeed: 16, projSize: 20, projSpread: 0.2, beamColor: '#c084fc', vfxStyle: 'lightning_bolt' },
      wu: { cmd: 'W + U', bvnCode: 'ZHAO_3 (WU)', name: 'Hado #90: Kurohitsugi (Vùng Trọng Lực Hắc Quan)', desc: 'Triệu hồi trường trọng lực Hắc Quan tím đen nghiền ép theo giây và làm chậm cực nặng!', dmg: 96, qiGain: 28, cooldown: 54, isBreakDef: true, type: 'dot_hazard', duration: 220, tickInterval: 24, tickDmg: 24, radius: 118, slowMult: 0.6, vfxStyle: 'spiral_orb', beamColor: '#7c3aed', hazardLabel: 'HẮC QUAN TRỌNG LỰC!' },
      su: { cmd: 'S + U', bvnCode: 'ZHAO_2 (SU)', name: 'Kính Hoa Thủy Nguyệt (Kyoka Suigetsu Counter)', desc: 'Đánh lừa ngũ quan bằng ảo ảnh tuyệt đối, hóa giải đòn đánh và chém phản công 1.5x!', dmg: 88, qiGain: 26, cooldown: 48, isBreakDef: true, type: 'true_counter', windowFrames: 26, counterMult: 1.52, counterRangeX: 170, vfxStyle: 'slash_arc', beamColor: '#a855f7', counterLabel: 'KYOKA SUIGETSU!!' },
      i: { cmd: 'I (1 Nộ)', bvnCode: 'BISHA (I)', name: 'Hado #90: Kurohitsugi Toàn Niệm Chú', desc: 'Phóng luồng linh áp hắc quan tím đen nghiền nát không gian toàn màn hình.', dmg: 204, qiCost: 100, cooldown: 42, isBreakDef: true, type: 'beam_laser', beamColor: '#7c3aed', beamWidth: 46, beamDuration: 24, vfxStyle: 'spiral_orb' },
      wi: { cmd: 'W + I (1 Nộ)', bvnCode: 'BISHA_UP (WI)', name: 'Fragor (Hủy Diệt Hư Không)', desc: 'Triệu hồi cầu linh lực tím nổ tung từ đỉnh đầu giáng xuống mục tiêu.', dmg: 202, qiCost: 100, cooldown: 44, isBreakDef: true, type: 'bisha_dive', vfxStyle: 'spiral_orb' },
      si: { cmd: 'S + I (3 Nộ)', bvnCode: 'BISHA_SUPER (SI)', name: 'Hado #99: Goryutenmetsu (Ngũ Long Chuyển Diệt)', desc: 'Mở màn đêm Hueco Mundo, triệu hồi 5 Linh Long Tím khổng lồ cuốn nát toàn bộ chiến trường.', dmg: 390, qiCost: 300, cooldown: 65, isBreakDef: true, type: 'domain_super', domainColor: '#4c1d95', domainFrames: 105, domainLabel: 'HADO #99: NGŨ LONG CHUYỂN DIỆT!!', beamColor: '#c084fc', vfxStyle: 'beast_wave' }
    },
    awakenedSkills: {
      wu: { cmd: 'W + U', bvnCode: 'HOGYOKU (WU)', name: 'Kính Hoa Thủy Nguyệt: Ngưng Đọng Ngũ Quan', desc: 'Bẻ cong hoàn toàn nhận thức của đối thủ khiến kẻ địch bất động trong ảo giác.', dmg: 104, qiGain: 28, cooldown: 62, isBreakDef: true, type: 'time_freeze', freezeFrames: 98, domainColor: '#7e22ce', freezeLabel: 'KYOKA SUIGETSU: VÔ HẠN!', vfxStyle: 'spiral_orb' }
    }
  }
];
