// language: JavaScript, file: maps.js, target: HTML5 Canvas 60FPS 22-Stage Anime Battle Arena Renderer
// Covers 9 Naruto maps, 7 Hunter x Hunter maps, and 6 Crossover Multiverse maps (One Piece, DBZ, Bleach, JJK)
// Zero per-frame heap allocations for smooth 60FPS playback; deterministic animations driven by frameCount.

(function () {
  'use strict';

  // ==================== 1. MAP CATEGORIES ====================
  const MAP_CATEGORIES = [
    { id: 'all', name: 'Tất Cả (22 Map)' },
    { id: 'naruto', name: 'Naruto (9 Map)' },
    { id: 'hxh', name: 'Hunter x Hunter (7 Map)' },
    { id: 'crossover', name: 'Đa Vũ Trụ (6 Map)' }
  ];

  // ==================== 2. 22 ICONIC ANIME BATTLE STAGES ====================
  const GAME_MAPS = [
    // ---------- NARUTO (9 MAPS) ----------
    {
      id: 'konoha_village',
      name: 'Làng Lá (Konohagakure)',
      subtitle: 'Tượng 4 Hokage · Mái Nhà Xanh Đỏ',
      category: 'naruto',
      themeColor: '#22c55e',
      floorColor: '#475569',
      accentColor: '#f97316',
      description: 'Làng Lá dưới bầu trời trong xanh, núi khắc mặt 4 vị Hokage uy nghi và lá bay phấp phới.',
      ambientType: 'leaves'
    },
    {
      id: 'final_valley',
      name: 'Thung Lũng Tận Cùng',
      subtitle: 'Hashirama vs Madara · Thác Nước Trắng Xóa',
      category: 'naruto',
      themeColor: '#38bdf8',
      floorColor: '#1e293b',
      accentColor: '#93c5fd',
      description: 'Hai bức tượng khổng lồ Hashirama và Madara đối đầu qua dòng thác cuồn cuộn sương mù.',
      ambientType: 'mist_waterfall'
    },
    {
      id: 'chunin_arena',
      name: 'Đấu Trường Thi Chunin',
      subtitle: 'Khán Đài Nhiều Tầng · Tượng Kết Ấn',
      category: 'naruto',
      themeColor: '#eab308',
      floorColor: '#785a3a',
      accentColor: '#fde047',
      description: 'Đấu trường vòng chung kết Kỳ Thi Chunin rực đèn pha với bức tượng kết ấn khổng lồ.',
      ambientType: 'spotlights'
    },
    {
      id: 'uchiha_shrine',
      name: 'Làng Uchiha — Huyết Nguyệt',
      subtitle: 'Tsukuyomi · Trăng Đỏ · Cổng Torii & Quạ Đen',
      category: 'naruto',
      themeColor: '#ef4444',
      floorColor: '#1c1917',
      accentColor: '#f87171',
      description: 'Bầu trời huyết nguyệt đỏ rực dưới ảo thuật Tsukuyomi, cổng Torii và đàn quạ đen bay rợp trời.',
      ambientType: 'crows_bloodmoon'
    },
    {
      id: 'rain_village',
      name: 'Làng Mưa (Amegakure)',
      subtitle: 'Tháp Ống Thép Pain · Mưa Xối Xả & Sấm Sét',
      category: 'naruto',
      themeColor: '#06b6d4',
      floorColor: '#0f172a',
      accentColor: '#67e8f9',
      description: 'Thành phố thép chìm trong cơn mưa bất tận cùng những tia sét xé toạc bầu trời đêm.',
      ambientType: 'rain_lightning'
    },
    {
      id: 'forest_of_death',
      name: 'Khu Rừng Chết',
      subtitle: 'Cây Cổ Thụ Khổng Lồ · Hàng Rào Lưới Khu 44',
      category: 'naruto',
      themeColor: '#10b981',
      floorColor: '#143325',
      accentColor: '#86efac',
      description: 'Khu luyện tập 44 với những gốc đại thụ khổng lồ, hàng rào thép và đốm sáng xuyên tán lá.',
      ambientType: 'forest_beams'
    },
    {
      id: 'naruto_bridge',
      name: 'Đại Cầu Naruto',
      subtitle: 'Cầu Đá Sương Mù · Sóng Biển Xanh',
      category: 'naruto',
      themeColor: '#60a5fa',
      floorColor: '#334155',
      accentColor: '#bae6fd',
      description: 'Cây cầu đá huyền thoại giữa làn sương mù dày đặc và những đợt sóng biển Sóng Quốc vỗ mạnh.',
      ambientType: 'sea_mist'
    },
    {
      id: 'shinobi_war',
      name: 'Đại Chiến Nhẫn Giả 4',
      subtitle: 'Thần Thụ Khổng Lồ · Bầu Trời Cam Rực',
      category: 'naruto',
      themeColor: '#f97316',
      floorColor: '#431407',
      accentColor: '#fb923c',
      description: 'Chiến trường tàn khốc dưới bóng Thần Thụ vươn tới chân trời, đất đá nứt vỡ và tro lửa bay.',
      ambientType: 'embers'
    },
    {
      id: 'hidden_sand',
      name: 'Làng Cát (Sunagakure)',
      subtitle: 'Bão Cát Vàng · Vòm Đất Nung · Nắng Sa Mạc',
      category: 'naruto',
      themeColor: '#f59e0b',
      floorColor: '#92400e',
      accentColor: '#fcd34d',
      description: 'Pháo đài cát giữa sa mạc nắng cháy với các công trình vòm đất nung và bão cát vàng cuồn cuộn.',
      ambientType: 'sandstorm'
    },

    // ---------- HUNTER X HUNTER (7 MAPS) ----------
    {
      id: 'heavens_arena',
      name: 'Đấu Trường Trên Không Tầng 200',
      subtitle: 'Sàn Đấu Gạch Vuông HxH · Đèn Pha Khán Đài',
      category: 'hxh',
      themeColor: '#38bdf8',
      floorColor: '#334155',
      accentColor: '#7dd3fc',
      description: 'Thánh địa của các Niệm Nhân tại tầng 200 Đấu Trường Trên Không với sàn gạch vuông chuẩn mực.',
      ambientType: 'arena_lights'
    },
    {
      id: 'yorknew_city',
      name: 'Thành Phố Yorknew Về Đêm',
      subtitle: 'Tháp Đấu Giá Neon · Khinh Khí Cầu · Mưa Đêm',
      category: 'hxh',
      themeColor: '#a855f7',
      floorColor: '#1e1b4b',
      accentColor: '#e879f9',
      description: 'Đêm đấu giá Yorknew rực rỡ ánh đèn neon, khinh khí cầu lơ lửng dưới trăng tròn và mưa nhẹ.',
      ambientType: 'city_rain'
    },
    {
      id: 'greed_island',
      name: 'Đảo Tham Lam (Greed Island)',
      subtitle: 'Bãi Biển Xanh · Sân Bóng Né Razor Phát Sáng',
      category: 'hxh',
      themeColor: '#14b8a6',
      floorColor: '#b48a56',
      accentColor: '#2dd4bf',
      description: 'Hòn đảo trò chơi Niệm với biển xanh, hàng dừa đung đưa và vạch sân bóng né Razor phát quang.',
      ambientType: 'tropical_nen'
    },
    {
      id: 'chimera_palace',
      name: 'Cung Điện Đông Gorteau',
      subtitle: 'Mưa Rồng Dragon Dive · Cầu Thang Đổ Nát',
      category: 'hxh',
      themeColor: '#facc15',
      floorColor: '#475569',
      accentColor: '#fde047',
      description: 'Khoảnh khắc đột kích cung điện Kiến Chimera dưới cơn Mưa Rồng Dragon Dive vàng rực trời đêm!',
      ambientType: 'dragon_dive'
    },
    {
      id: 'netero_tomb',
      name: 'Chiến Địa Netero vs Meruem',
      subtitle: 'Hố Đá Ngầm · Dung Nham · Bách Thức Quan Âm',
      category: 'hxh',
      themeColor: '#f59e0b',
      floorColor: '#292524',
      accentColor: '#fbbf24',
      description: 'Hầm thử nghiệm dưới lòng đất rực ánh dung nham cùng vầng hào quang vàng Bách Thức Quan Âm.',
      ambientType: 'golden_aura'
    },
    {
      id: 'whale_island',
      name: 'Đảo Cá Voi (Quê Nhà Gon)',
      subtitle: 'Đồi Cỏ Xanh · Biển Hoàng Hôn · Hải Âu',
      category: 'hxh',
      themeColor: '#fb923c',
      floorColor: '#166534',
      accentColor: '#fed7aa',
      description: 'Quê hương yên bình của Gon với triền cỏ xanh mướt, biển hoàng hôn lấp lánh và tàu đánh cá.',
      ambientType: 'sunset_gulls'
    },
    {
      id: 'dark_continent',
      name: 'Lục Địa Đen',
      subtitle: 'Cây Thế Giới Chạm Mây · Đảo Nổi · Sét Tím',
      category: 'hxh',
      themeColor: '#9333ea',
      floorColor: '#1e1035',
      accentColor: '#c084fc',
      description: 'Vùng đất cấm bí ẩn với Cây Thế Giới khổng lồ xuyên tầng mây, đảo nổi và sấm sét tím huyền bí.',
      ambientType: 'purple_storm'
    },

    // ---------- CROSSOVER ĐA VŨ TRỤ (6 MAPS) ----------
    {
      id: 'marineford',
      name: 'Tổng Bộ Hải Quân Marineford',
      subtitle: 'One Piece · Pháo Đài Trắng · Vịnh Băng & Sóng Thần',
      category: 'crossover',
      themeColor: '#0ea5e9',
      floorColor: '#475569',
      accentColor: '#7dd3fc',
      description: 'Pháo đài Công Lý của Hải Quân giữa vịnh băng xanh và hai cột sóng thần khổng lồ hai bên.',
      ambientType: 'ocean_spray'
    },
    {
      id: 'onigashima_roof',
      name: 'Đỉnh Mái Vòm Đảo Quỷ Onigashima',
      subtitle: 'One Piece · Sừng Quỷ · Trăng Rằm · Sét Haki Đỏ Đen',
      category: 'crossover',
      themeColor: '#dc2626',
      floorColor: '#1c1917',
      accentColor: '#f43f5e',
      description: 'Nóc đầu lâu Onigashima dưới trăng rằm rực sáng và những tia sét Haki Bá Vương đỏ-đen xé trời.',
      ambientType: 'haki_lightning'
    },
    {
      id: 'planet_namek',
      name: 'Hành Tinh Namek Sắp Nổ',
      subtitle: 'Dragon Ball Z · Bầu Trời Xanh Lá · Núi Lửa & Sét',
      category: 'crossover',
      themeColor: '#4ade80',
      floorColor: '#14532d',
      accentColor: '#a3e635',
      description: 'Hành tinh Namek rung chuyển trong 5 phút cuối cùng với biển xanh lục, núi lửa phun và sấm sét.',
      ambientType: 'namek_quake'
    },
    {
      id: 'time_chamber',
      name: 'Phòng Thời Gian & Tinh Thần',
      subtitle: 'Dragon Ball Z · Không Gian Trắng Vô Cực · Đồng Hồ Cát',
      category: 'crossover',
      themeColor: '#e2e8f0',
      floorColor: '#cbd5e1',
      accentColor: '#f59e0b',
      description: 'Không gian trắng vô tận nơi 1 ngày bên ngoài bằng 1 năm khổ luyện, nổi bật tháp đồng hồ cát vàng.',
      ambientType: 'time_dust'
    },
    {
      id: 'soul_society',
      name: 'Thi Hồn Giới — Đỉnh Song Cực',
      subtitle: 'Bleach · Hoàng Hôn Cam · Hoa Anh Đào Senbonzakura',
      category: 'crossover',
      themeColor: '#f472b6',
      floorColor: '#44403c',
      accentColor: '#fbcfe8',
      description: 'Đỉnh đồi Song Cực ngập sắc hoàng hôn cam rực rỡ cùng muôn ngàn cánh hoa anh đào Senbonzakura.',
      ambientType: 'sakura_petals'
    },
    {
      id: 'shibuya_curtain',
      name: 'Ga Shibuya — Màn Kết Giới',
      subtitle: 'Jujutsu Kaisen · Màn Đen Tím · Vô Lượng Không Xứ',
      category: 'crossover',
      themeColor: '#6366f1',
      floorColor: '#18181b',
      accentColor: '#818cf8',
      description: 'Sân ga ngầm Shibuya bị phong tỏa dưới Màn Kết Giới đen tím và hào quang Vô Lượng Không Xứ.',
      ambientType: 'domain_curtain'
    }
  ];

  // Fast O(1) lookup table
  const MAP_BY_ID = Object.create(null);
  for (let i = 0; i < GAME_MAPS.length; i++) {
    MAP_BY_ID[GAME_MAPS[i].id] = GAME_MAPS[i];
  }

  // ==================== 3. PRECOMPUTED DETERMINISTIC SEED TABLES (ZERO GC ALLOCATION) ====================
  function createSeededRandom(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  const rng = createSeededRandom(20260420);

  // 80 Stars
  const STARS = new Array(80);
  for (let i = 0; i < 80; i++) {
    STARS[i] = {
      x: rng(),
      y: rng() * 0.72,
      r: 0.7 + rng() * 1.6,
      phase: rng() * Math.PI * 2,
      speed: 0.03 + rng() * 0.06
    };
  }

  // 64 Floating particles (leaves, sakura, embers, pollen, snow/dust)
  const PARTICLES = new Array(64);
  for (let i = 0; i < 64; i++) {
    PARTICLES[i] = {
      x: rng(),
      y: rng(),
      size: 2.5 + rng() * 4.5,
      vx: 0.5 + rng() * 1.6,
      vy: 0.35 + rng() * 1.15,
      phase: rng() * Math.PI * 2,
      spin: 0.03 + rng() * 0.09,
      alt: i % 2
    };
  }

  // 90 Rain drops
  const RAIN = new Array(90);
  for (let i = 0; i < 90; i++) {
    RAIN[i] = {
      x: rng(),
      y: rng(),
      len: 12 + rng() * 16,
      speed: 9 + rng() * 8,
      alpha: 0.25 + rng() * 0.45
    };
  }

  // 36 Dragon Dive meteors for Chimera Palace
  const DRAGON_SPEARS = new Array(36);
  for (let i = 0; i < 36; i++) {
    DRAGON_SPEARS[i] = {
      x: -0.15 + rng() * 1.25,
      phase: rng(),
      speed: 0.011 + rng() * 0.012,
      len: 42 + rng() * 58,
      width: 1.8 + rng() * 2.6,
      angle: 0.42 + rng() * 0.14
    };
  }

  // 16 Birds (crows / seagulls)
  const BIRDS = new Array(16);
  for (let i = 0; i < 16; i++) {
    BIRDS[i] = {
      x: rng(),
      y: 0.1 + rng() * 0.48,
      scale: 0.65 + rng() * 0.8,
      speed: 0.35 + rng() * 0.9,
      flapSpeed: 0.12 + rng() * 0.1,
      phase: rng() * Math.PI * 2
    };
  }

  // Precomputed Yorknew skyscrapers
  const YORKNEW_BUILDINGS = [
    { x: 0.01, w: 0.07, h: 210, lit: '#facc15' },
    { x: 0.075, w: 0.06, h: 280, lit: '#38bdf8' },
    { x: 0.13, w: 0.08, h: 195, lit: '#e879f9' },
    { x: 0.205, w: 0.065, h: 255, lit: '#fde047' },
    { x: 0.27, w: 0.055, h: 170, lit: '#38bdf8' },
    { x: 0.325, w: 0.07, h: 230, lit: '#f472b6' },
    { x: 0.60, w: 0.07, h: 240, lit: '#38bdf8' },
    { x: 0.67, w: 0.06, h: 185, lit: '#facc15' },
    { x: 0.73, w: 0.08, h: 270, lit: '#c084fc' },
    { x: 0.81, w: 0.065, h: 215, lit: '#38bdf8' },
    { x: 0.875, w: 0.06, h: 290, lit: '#fde047' },
    { x: 0.935, w: 0.065, h: 205, lit: '#e879f9' }
  ];

  // Precomputed Amegakure Rain Village steel pipe-towers
  const RAIN_TOWERS = [
    { x: 0.02, w: 0.08, h: 270, pipes: 2 },
    { x: 0.11, w: 0.07, h: 325, pipes: 3 },
    { x: 0.19, w: 0.06, h: 220, pipes: 2 },
    { x: 0.27, w: 0.085, h: 295, pipes: 3 },
    { x: 0.64, w: 0.08, h: 285, pipes: 3 },
    { x: 0.73, w: 0.065, h: 235, pipes: 2 },
    { x: 0.80, w: 0.085, h: 335, pipes: 3 },
    { x: 0.90, w: 0.085, h: 265, pipes: 2 }
  ];

  // Precomputed Konoha rooftops
  const KONOHA_ROOFS = [
    { x: 0.01, w: 0.11, h: 66, roof: '#15803d', wall: '#e2d4b7' },
    { x: 0.11, w: 0.09, h: 82, roof: '#b91c1c', wall: '#d6c7a9' },
    { x: 0.19, w: 0.12, h: 58, roof: '#166534', wall: '#e7dec8' },
    { x: 0.30, w: 0.09, h: 74, roof: '#991b1b', wall: '#d9ccb2' },
    { x: 0.60, w: 0.10, h: 70, roof: '#15803d', wall: '#e2d4b7' },
    { x: 0.69, w: 0.11, h: 86, roof: '#b91c1c', wall: '#d6c7a9' },
    { x: 0.79, w: 0.10, h: 64, roof: '#166534', wall: '#e7dec8' },
    { x: 0.88, w: 0.11, h: 78, roof: '#991b1b', wall: '#d9ccb2' }
  ];

  // Precomputed Sunagakure sandstone domes
  const SAND_DOMES = [
    { x: 0.09, r: 44, h: 62 },
    { x: 0.21, r: 34, h: 84 },
    { x: 0.34, r: 28, h: 54 },
    { x: 0.50, r: 62, h: 112 },
    { x: 0.67, r: 32, h: 60 },
    { x: 0.79, r: 42, h: 88 },
    { x: 0.91, r: 36, h: 66 }
  ];

  // Precomputed Forest of Death giant tree trunks
  const FOREST_TREES = [
    { x: 0.04, w: 54, depth: 0 },
    { x: 0.17, w: 38, depth: 1 },
    { x: 0.29, w: 46, depth: 0 },
    { x: 0.44, w: 34, depth: 1 },
    { x: 0.58, w: 42, depth: 1 },
    { x: 0.72, w: 50, depth: 0 },
    { x: 0.85, w: 36, depth: 1 },
    { x: 0.95, w: 56, depth: 0 }
  ];

  // Precomputed lightning zigzag normalized offsets
  const BOLT_SEGMENTS = [
    [0, 0], [-14, 0.14], [12, 0.28], [-18, 0.44], [16, 0.59], [-10, 0.76], [8, 0.9], [0, 1]
  ];

  // Precomputed static layout arrays (avoiding per-frame array literals)
  const KONOHA_FACE_XS = [0.29, 0.43, 0.57, 0.71];
  const UCHIHA_ROOFS = [0.02, 0.14, 0.72, 0.85];
  const CHIMERA_COL_XS = [0.08, 0.21, 0.79, 0.92];
  const DARK_ISLANDS = [
    { x: 0.16, y: 175, rw: 58, rh: 24 },
    { x: 0.82, y: 152, rw: 66, rh: 26 },
    { x: 0.28, y: 262, rw: 38, rh: 16 },
    { x: 0.72, y: 274, rw: 44, rh: 18 }
  ];
  const MARINEFORD_TIERS = [
    { y: 278, hw: 192 },
    { y: 212, hw: 136 },
    { y: 148, hw: 82 }
  ];
  const SOUL_STONE_COLS = [0.10, 0.24, 0.76, 0.90];
  const BRIDGE_PIER_XS = [0.14, 0.50, 0.86];

  // ==================== 4. SHARED DRAWING PRIMITIVES (MOCK-CANVAS SAFE) ====================
  function drawEllipse(ctx, cx, cy, rx, ry) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(rx, ry);
    ctx.beginPath();
    ctx.arc(0, 0, 1, 0, Math.PI * 2);
    ctx.restore();
  }

  function fillSky(ctx, w, floorY, c0, c1, c2) {
    const grad = ctx.createLinearGradient(0, 0, 0, floorY);
    grad.addColorStop(0, c0);
    grad.addColorStop(0.55, c1);
    grad.addColorStop(1, c2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, floorY + 2);
  }

  function drawGlowOrb(ctx, x, y, r, coreColor, midColor, outerColor) {
    const grad = ctx.createRadialGradient(x, y, r * 0.1, x, y, r);
    grad.addColorStop(0, coreColor);
    grad.addColorStop(0.45, midColor);
    grad.addColorStop(1, outerColor);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawStars(ctx, w, floorY, t, color, count) {
    ctx.fillStyle = color;
    const n = count < 80 ? count : 80;
    for (let i = 0; i < n; i++) {
      const s = STARS[i];
      const twinkle = 0.35 + 0.65 * Math.abs(Math.sin(t * s.speed + s.phase));
      ctx.globalAlpha = twinkle;
      ctx.fillRect(s.x * w, s.y * floorY, s.r, s.r);
    }
    ctx.globalAlpha = 1;
  }

  function drawDriftingClouds(ctx, w, yBase, count, speed, t, color, alpha, scaleY) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    for (let i = 0; i < count; i++) {
      const span = w + 260;
      const cx = (((i * 213 + t * speed * (0.7 + (i % 3) * 0.25)) % span) + span) % span - 130;
      const cy = yBase + (i % 3) * 26;
      const rx = 56 + (i % 4) * 18;
      const ry = (16 + (i % 3) * 5) * (scaleY || 1);
      drawEllipse(ctx, cx, cy, rx, ry);
      ctx.fill();
      drawEllipse(ctx, cx - rx * 0.45, cy + 5, rx * 0.6, ry * 0.78);
      ctx.fill();
      drawEllipse(ctx, cx + rx * 0.48, cy + 6, rx * 0.55, ry * 0.72);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawMistBands(ctx, w, yStart, bandH, t, color, alpha) {
    ctx.save();
    ctx.fillStyle = color;
    for (let i = 0; i < 4; i++) {
      const drift = Math.sin(t * 0.012 + i * 1.7) * 55;
      ctx.globalAlpha = alpha * (0.65 + 0.35 * Math.sin(t * 0.018 + i));
      const y = yStart + i * (bandH * 0.28);
      drawEllipse(ctx, w * (0.2 + i * 0.22) + drift, y, w * 0.36, bandH * 0.35);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawFloatingParticles(ctx, w, floorY, t, color1, color2, count, dirX, dirY, mode) {
    ctx.save();
    const n = count < 64 ? count : 64;
    for (let i = 0; i < n; i++) {
      const p = PARTICLES[i];
      const rawX = p.x * w + t * p.vx * dirX + Math.sin(t * 0.035 + p.phase) * 18;
      const rawY = p.y * floorY + t * p.vy * dirY;
      const px = ((rawX % (w + 40)) + (w + 40)) % (w + 40) - 20;
      const py = ((rawY % (floorY + 20)) + (floorY + 20)) % (floorY + 20) - 10;
      ctx.fillStyle = p.alt ? color1 : color2;

      if (mode === 'leaf' || mode === 'petal') {
        const angle = t * p.spin + p.phase;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(angle);
        ctx.globalAlpha = 0.82;
        ctx.beginPath();
        ctx.moveTo(-p.size, 0);
        ctx.quadraticCurveTo(0, -p.size * 0.65, p.size, 0);
        ctx.quadraticCurveTo(0, p.size * 0.65, -p.size, 0);
        ctx.fill();
        ctx.restore();
      } else if (mode === 'ember') {
        ctx.globalAlpha = 0.45 + 0.55 * Math.abs(Math.sin(t * 0.08 + p.phase));
        ctx.beginPath();
        ctx.arc(px, py, p.size * 0.42, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.globalAlpha = 0.28 + 0.48 * Math.abs(Math.sin(t * 0.05 + p.phase));
        ctx.beginPath();
        ctx.arc(px, py, p.size * 0.48, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawRain(ctx, w, floorY, t, color, slant, count, drawSplashes) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.25;
    const n = count < 90 ? count : 90;
    for (let i = 0; i < n; i++) {
      const r = RAIN[i];
      const y = ((r.y * floorY + t * r.speed) % (floorY + 24)) - 12;
      const x = (((r.x * w + t * slant * 0.7) % (w + 60)) + (w + 60)) % (w + 60) - 30;
      ctx.globalAlpha = r.alpha;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + slant, y + r.len);
      ctx.stroke();

      if (drawSplashes && y + r.len > floorY - 8 && y < floorY) {
        ctx.globalAlpha = r.alpha * 0.7;
        ctx.beginPath();
        ctx.arc(x + slant, floorY + 2, 3.5, Math.PI, 0);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawLightningBolt(ctx, xStart, yStart, yEnd, glowColor, coreColor, scaleX, widthPx) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.strokeStyle = glowColor;
    ctx.lineWidth = widthPx * 3.2;
    ctx.globalAlpha = 0.38;
    ctx.beginPath();
    for (let i = 0; i < BOLT_SEGMENTS.length; i++) {
      const sx = xStart + BOLT_SEGMENTS[i][0] * scaleX;
      const sy = yStart + (yEnd - yStart) * BOLT_SEGMENTS[i][1];
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();

    ctx.strokeStyle = coreColor;
    ctx.lineWidth = widthPx;
    ctx.globalAlpha = 0.95;
    ctx.stroke();

    ctx.lineWidth = widthPx * 0.65;
    ctx.beginPath();
    const bx = xStart + BOLT_SEGMENTS[3][0] * scaleX;
    const by = yStart + (yEnd - yStart) * BOLT_SEGMENTS[3][1];
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + 26 * scaleX, by + 34);
    ctx.lineTo(bx + 18 * scaleX, by + 62);
    ctx.stroke();
    ctx.restore();
  }

  function drawBirds(ctx, w, floorY, t, color, count, dir) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    const n = count < 16 ? count : 16;
    for (let i = 0; i < n; i++) {
      const b = BIRDS[i];
      const span = w + 140;
      const bx = (((b.x * span + t * b.speed * dir) % span) + span) % span - 70;
      const by = b.y * floorY + Math.sin(t * 0.04 + b.phase) * 8;
      const wing = Math.sin(t * b.flapSpeed + b.phase) * 6 * b.scale;
      const half = 9 * b.scale;
      ctx.beginPath();
      ctx.moveTo(bx - half, by - wing);
      ctx.quadraticCurveTo(bx - half * 0.4, by - 4 * b.scale, bx, by);
      ctx.quadraticCurveTo(bx + half * 0.4, by - 4 * b.scale, bx + half, by - wing);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawOceanWaves(ctx, w, yTop, yBot, t, topCol, botCol, foamCol) {
    const grad = ctx.createLinearGradient(0, yTop, 0, yBot);
    grad.addColorStop(0, topCol);
    grad.addColorStop(1, botCol);
    ctx.fillStyle = grad;
    ctx.fillRect(0, yTop, w, yBot - yTop);

    ctx.save();
    ctx.strokeStyle = foamCol;
    ctx.lineWidth = 1.6;
    for (let row = 0; row < 5; row++) {
      const ry = yTop + 8 + row * ((yBot - yTop) / 5.2);
      ctx.globalAlpha = 0.25 + row * 0.1;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 40) {
        const wy = ry + Math.sin(x * 0.025 + t * (0.04 + row * 0.01) + row) * (2 + row * 0.6);
        if (x === 0) ctx.moveTo(x, wy);
        else ctx.lineTo(x, wy);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  // ==================== 5. THEMED ARENA FLOOR RENDERER ====================
  function drawArenaFloor(ctx, w, h, floorY, topColor, botColor, edgeColor, accentColor, style, t) {
    const floorH = h - floorY;
    const grad = ctx.createLinearGradient(0, floorY, 0, h);
    grad.addColorStop(0, topColor);
    grad.addColorStop(1, botColor);
    ctx.fillStyle = grad;
    ctx.fillRect(0, floorY, w, floorH);

    ctx.save();
    if (style === 'hxh_grid' || style === 'white_void') {
      ctx.strokeStyle = style === 'white_void' ? 'rgba(148,163,184,0.38)' : 'rgba(125,211,252,0.28)';
      ctx.lineWidth = 1.2;
      const cx = w * 0.5;
      for (let i = -8; i <= 8; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + i * 58, floorY);
        ctx.lineTo(cx + i * 96, h);
        ctx.stroke();
      }
      for (let row = 1; row <= 3; row++) {
        const ry = floorY + (floorH * row) / 3.4;
        ctx.beginPath();
        ctx.moveTo(0, ry);
        ctx.lineTo(w, ry);
        ctx.stroke();
      }
      if (style === 'hxh_grid') {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(48, floorY + 8, w - 96, floorH - 22);
      }
    } else if (style === 'court_nen') {
      const pulse = 0.65 + 0.35 * Math.sin(t * 0.08);
      ctx.strokeStyle = accentColor;
      ctx.globalAlpha = pulse;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(60, floorY + 12);
      ctx.lineTo(w - 60, floorY + 12);
      ctx.lineTo(w - 22, h - 10);
      ctx.lineTo(22, h - 10);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(w * 0.5, floorY + 12);
      ctx.lineTo(w * 0.5, h - 10);
      ctx.stroke();
    } else if (style === 'cracked_earth') {
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 1.6;
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 0.07);
      for (let i = 0; i < 9; i++) {
        const bx = 65 + i * 105;
        ctx.beginPath();
        ctx.moveTo(bx, floorY + 6);
        ctx.lineTo(bx + (i % 2 ? 22 : -18), floorY + 30);
        ctx.lineTo(bx + (i % 2 ? -10 : 25), floorY + 58);
        ctx.lineTo(bx + 12, h - 4);
        ctx.stroke();
      }
    } else if (style === 'stone_tiles' || style === 'palace_marble') {
      ctx.strokeStyle = style === 'palace_marble' ? 'rgba(255,255,255,0.22)' : 'rgba(15,23,42,0.45)';
      ctx.lineWidth = 1.5;
      const cx = w * 0.5;
      for (let i = -7; i <= 7; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + i * 68, floorY);
        ctx.lineTo(cx + i * 104, h);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(0, floorY + floorH * 0.45);
      ctx.lineTo(w, floorY + floorH * 0.45);
      ctx.stroke();
    } else if (style === 'wood_deck') {
      ctx.strokeStyle = 'rgba(0,0,0,0.42)';
      ctx.lineWidth = 1.5;
      for (let y = floorY + 14; y < h; y += 16) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    } else if (style === 'sand') {
      ctx.strokeStyle = 'rgba(253,224,71,0.26)';
      ctx.lineWidth = 2;
      for (let row = 0; row < 3; row++) {
        const sy = floorY + 18 + row * 22;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 60) {
          const wy = sy + Math.sin(x * 0.02 + row * 2) * 4;
          if (x === 0) ctx.moveTo(x, wy);
          else ctx.lineTo(x, wy);
        }
        ctx.stroke();
      }
    } else if (style === 'subway_platform') {
      ctx.fillStyle = '#eab308';
      ctx.fillRect(0, floorY + 10, w, 7);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      for (let x = 0; x < w; x += 28) {
        ctx.fillRect(x, floorY + 10, 6, 7);
      }
      ctx.fillStyle = 'rgba(129,140,248,0.12)';
      ctx.fillRect(0, floorY + 26, w, 24);
    } else if (style === 'metal_wet') {
      ctx.strokeStyle = 'rgba(148,163,184,0.25)';
      ctx.lineWidth = 1.5;
      for (let x = 0; x <= w; x += 96) {
        ctx.beginPath();
        ctx.moveTo(x, floorY);
        ctx.lineTo(x - 18, h);
        ctx.stroke();
      }
      ctx.fillStyle = accentColor;
      ctx.globalAlpha = 0.14 + 0.06 * Math.sin(t * 0.09);
      for (let i = 0; i < 5; i++) {
        drawEllipse(ctx, 110 + i * 185, floorY + 28 + (i % 2) * 14, 52, 6);
        ctx.fill();
      }
    } else if (style === 'forest_moss') {
      ctx.fillStyle = 'rgba(34,197,94,0.18)';
      for (let i = 0; i < 7; i++) {
        drawEllipse(ctx, 70 + i * 140, floorY + 18 + (i % 3) * 12, 65, 9);
        ctx.fill();
      }
    } else if (style === 'water_edge') {
      ctx.strokeStyle = accentColor;
      ctx.globalAlpha = 0.28;
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        const y = floorY + 16 + i * 16;
        const shift = Math.sin(t * 0.05 + i) * 14;
        ctx.beginPath();
        ctx.moveTo(40 + shift, y);
        ctx.lineTo(w - 40 + shift, y);
        ctx.stroke();
      }
    } else if (style === 'dark_obsidian') {
      ctx.strokeStyle = '#c084fc';
      ctx.globalAlpha = 0.32 + 0.2 * Math.sin(t * 0.06);
      ctx.lineWidth = 1.6;
      for (let i = 0; i < 8; i++) {
        const rx = 60 + i * 120;
        ctx.beginPath();
        ctx.moveTo(rx, floorY + 8);
        ctx.lineTo(rx + 28, floorY + 40);
        ctx.lineTo(rx - 12, h - 6);
        ctx.stroke();
      }
    }
    ctx.restore();

    // Crisp illuminated arena floor edge glow
    ctx.save();
    ctx.fillStyle = edgeColor;
    ctx.globalAlpha = 0.25;
    ctx.fillRect(0, floorY - 3, w, 6);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = edgeColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, floorY);
    ctx.lineTo(w, floorY);
    ctx.stroke();
    ctx.restore();
  }

  // ==================== 6. 22 DEDICATED STAGE RENDERERS ====================

  // 1. KONOHA VILLAGE (Làng Lá — Tượng 4 Hokage, Mái Nhà Xanh-Đỏ, Lá Bay)
  function renderKonohaVillage(ctx, w, h, floorY, t) {
    fillSky(ctx, w, floorY, '#1d4ed8', '#38bdf8', '#bae6fd');
    drawGlowOrb(ctx, w * 0.84, 88, 64, 'rgba(255,253,230,0.95)', 'rgba(253,224,71,0.35)', 'rgba(253,224,71,0)');
    drawDriftingClouds(ctx, w, 72, 5, 0.22, t, '#ffffff', 0.78, 1);

    // Hokage Rock Mountain Monument
    ctx.fillStyle = '#9a6b49';
    ctx.beginPath();
    ctx.moveTo(0, floorY);
    ctx.lineTo(0, 220);
    ctx.lineTo(w * 0.14, 155);
    ctx.lineTo(w * 0.30, 138);
    ctx.lineTo(w * 0.70, 136);
    ctx.lineTo(w * 0.86, 158);
    ctx.lineTo(w, 225);
    ctx.lineTo(w, floorY);
    ctx.closePath();
    ctx.fill();

    // Cliff highlight ridge
    ctx.fillStyle = '#b68560';
    ctx.beginPath();
    ctx.moveTo(w * 0.16, 155);
    ctx.lineTo(w * 0.30, 140);
    ctx.lineTo(w * 0.70, 138);
    ctx.lineTo(w * 0.83, 158);
    ctx.lineTo(w * 0.78, 225);
    ctx.lineTo(w * 0.22, 225);
    ctx.closePath();
    ctx.fill();

    // 4 Sculpted Hokage Faces (Hashirama, Tobirama, Hiruzen, Minato)
    for (let i = 0; i < 4; i++) {
      const fx = w * KONOHA_FACE_XS[i];
      const fy = 178;
      ctx.fillStyle = '#cfa07a';
      ctx.fillRect(fx - 26, fy - 24, 52, 54);
      ctx.fillStyle = '#7c4d2e';
      if (i === 0) {
        ctx.fillRect(fx - 31, fy - 28, 10, 52);
        ctx.fillRect(fx + 21, fy - 28, 10, 52);
        ctx.fillRect(fx - 28, fy - 32, 56, 12);
      } else if (i === 1) {
        ctx.beginPath();
        ctx.moveTo(fx - 28, fy - 22);
        ctx.lineTo(fx - 18, fy - 38);
        ctx.lineTo(fx - 6, fy - 28);
        ctx.lineTo(fx + 4, fy - 40);
        ctx.lineTo(fx + 16, fy - 28);
        ctx.lineTo(fx + 28, fy - 22);
        ctx.fill();
        ctx.fillRect(fx - 28, fy - 8, 8, 36);
        ctx.fillRect(fx + 20, fy - 8, 8, 36);
      } else if (i === 2) {
        ctx.fillRect(fx - 28, fy - 30, 56, 16);
        ctx.fillRect(fx - 7, fy + 22, 14, 12);
      } else {
        ctx.beginPath();
        ctx.moveTo(fx - 30, fy - 18);
        ctx.lineTo(fx - 22, fy - 40);
        ctx.lineTo(fx - 8, fy - 28);
        ctx.lineTo(fx, fy - 44);
        ctx.lineTo(fx + 10, fy - 28);
        ctx.lineTo(fx + 24, fy - 39);
        ctx.lineTo(fx + 30, fy - 18);
        ctx.fill();
      }
      ctx.fillStyle = '#6c4227';
      ctx.fillRect(fx - 17, fy - 6, 12, 4);
      ctx.fillRect(fx + 5, fy - 6, 12, 4);
      ctx.fillRect(fx - 2, fy - 4, 4, 14);
      ctx.fillRect(fx - 10, fy + 15, 20, 3);
    }

    // Pine Forest Belt beneath Monument
    ctx.fillStyle = '#14532d';
    ctx.fillRect(0, 268, w, floorY - 268);
    ctx.fillStyle = '#166534';
    for (let x = 0; x < w + 40; x += 36) {
      ctx.beginPath();
      ctx.moveTo(x - 22, 285);
      ctx.lineTo(x, 246 + (x % 3) * 6);
      ctx.lineTo(x + 22, 285);
      ctx.fill();
    }

    // Central Red Hokage Mansion Dome
    const hx = w * 0.5;
    ctx.fillStyle = '#e5d5b7';
    ctx.fillRect(hx - 68, floorY - 120, 136, 120);
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(hx, floorY - 120, 62, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(hx, floorY - 144, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(hx - 5, floorY - 151, 10, 14);

    // Konoha Green & Red Village Rooftops
    for (let i = 0; i < KONOHA_ROOFS.length; i++) {
      const b = KONOHA_ROOFS[i];
      const bx = b.x * w;
      const bw = b.w * w;
      const by = floorY - b.h;
      ctx.fillStyle = b.wall;
      ctx.fillRect(bx, by, bw, b.h);
      ctx.fillStyle = b.roof;
      ctx.beginPath();
      ctx.moveTo(bx - 8, by + 4);
      ctx.lineTo(bx + bw * 0.5, by - 22);
      ctx.lineTo(bx + bw + 8, by + 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#334155';
      ctx.fillRect(bx + 12, by + 16, 14, 18);
      ctx.fillRect(bx + bw - 26, by + 16, 14, 18);
    }

    drawMistBands(ctx, w, floorY - 40, 48, t, '#fef9c3', 0.14);
    drawFloatingParticles(ctx, w, floorY, t, '#22c55e', '#f97316', 28, 1.35, 0.7, 'leaf');
    drawArenaFloor(ctx, w, h, floorY, '#64748b', '#334155', '#22c55e', '#86efac', 'stone_tiles', t);
  }

  // 2. FINAL VALLEY (Thung Lũng Tận Cùng — Tượng Hashirama vs Madara & Thác Nước)
  function renderFinalValley(ctx, w, h, floorY, t) {
    fillSky(ctx, w, floorY, '#0f172a', '#1e3a5f', '#64748b');
    drawDriftingClouds(ctx, w, 65, 5, 0.18, t, '#cbd5e1', 0.35, 1.1);

    // Distant Valley Gorge Ridges
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(0, floorY);
    ctx.lineTo(0, 125);
    ctx.lineTo(w * 0.36, 150);
    ctx.lineTo(w * 0.40, floorY);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(w, floorY);
    ctx.lineTo(w, 125);
    ctx.lineTo(w * 0.64, 150);
    ctx.lineTo(w * 0.60, floorY);
    ctx.closePath();
    ctx.fill();

    // Roaring Center Waterfall
    const wfX = w * 0.39;
    const wfW = w * 0.22;
    const wfGrad = ctx.createLinearGradient(wfX, 145, wfX, floorY);
    wfGrad.addColorStop(0, '#7dd3fc');
    wfGrad.addColorStop(0.6, '#e0f2fe');
    wfGrad.addColorStop(1, '#ffffff');
    ctx.fillStyle = wfGrad;
    ctx.fillRect(wfX, 148, wfW, floorY - 148);

    // Animated Falling Water Streaks
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.68)';
    for (let i = 0; i < 14; i++) {
      const sx = wfX + 6 + (i * (wfW - 12)) / 13;
      const sy = 152 + ((t * (5.5 + (i % 3) * 1.4) + i * 47) % (floorY - 175));
      ctx.fillRect(sx, sy, 3 + (i % 2) * 2, 28 + (i % 3) * 10);
    }
    ctx.restore();

    // Left Monumental Statue — HASHIRAMA SENJU
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(w * 0.10, floorY);
    ctx.lineTo(w * 0.12, 165);
    ctx.lineTo(w * 0.28, 175);
    ctx.lineTo(w * 0.33, floorY);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#475569';
    ctx.fillRect(w * 0.13, 150, 74, 34);
    ctx.fillRect(w * 0.175, 110, 36, 42);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(w * 0.25, 172, 68, 22);
    ctx.fillRect(w * 0.305, 148, 14, 36);

    // Right Monumental Statue — MADARA UCHIHA
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(w * 0.90, floorY);
    ctx.lineTo(w * 0.88, 165);
    ctx.lineTo(w * 0.72, 175);
    ctx.lineTo(w * 0.67, floorY);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#475569';
    ctx.fillRect(w * 0.79, 150, 74, 34);
    ctx.beginPath();
    ctx.moveTo(w * 0.77, 154);
    ctx.lineTo(w * 0.785, 102);
    ctx.lineTo(w * 0.825, 118);
    ctx.lineTo(w * 0.855, 98);
    ctx.lineTo(w * 0.88, 154);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#64748b';
    ctx.fillRect(w * 0.68, 172, 68, 22);
    ctx.fillRect(w * 0.68, 148, 14, 36);

    // Rising Waterfall Mist & Foam Plumes
    for (let i = 0; i < 6; i++) {
      const mx = wfX + (wfW * i) / 5 + Math.sin(t * 0.05 + i) * 14;
      const mr = 24 + (i % 3) * 12 + Math.sin(t * 0.07 + i * 2) * 5;
      drawGlowOrb(ctx, mx, floorY - 8, mr, 'rgba(255,255,255,0.65)', 'rgba(224,242,254,0.28)', 'rgba(224,242,254,0)');
    }
    drawMistBands(ctx, w, floorY - 58, 70, t, '#e0f2fe', 0.22);
    drawArenaFloor(ctx, w, h, floorY, '#1e3a5f', '#0f172a', '#38bdf8', '#bae6fd', 'water_edge', t);
  }

  // 3. CHUNIN EXAM ARENA (Đấu Trường Thi Chunin — Khán Đài & Tượng Kết Ấn)
  function renderChuninArena(ctx, w, h, floorY, t) {
    fillSky(ctx, w, floorY, '#0284c7', '#38bdf8', '#fef3c7');
    drawDriftingClouds(ctx, w, 58, 4, 0.16, t, '#ffffff', 0.72, 0.9);

    ctx.fillStyle = '#7c6a56';
    ctx.fillRect(0, 145, w, floorY - 145);

    // Multi-tiered Spectator Stands
    for (let tier = 0; tier < 4; tier++) {
      const ty = 162 + tier * 38;
      ctx.fillStyle = tier % 2 === 0 ? '#5c4d3e' : '#4a3d31';
      ctx.fillRect(0, ty, w, 30);
      ctx.fillStyle = '#292524';
      for (let sx = 18; sx < w; sx += 24) {
        const bob = Math.sin(t * 0.08 + sx + tier) * 1.4;
        ctx.fillRect(sx, ty + 12 + bob, 9, 14);
        ctx.beginPath();
        ctx.arc(sx + 4.5, ty + 9 + bob, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#a89076';
      ctx.fillRect(0, ty + 27, w, 4);
    }

    // Lower Arena Wall with Hanging Konoha Banners
    ctx.fillStyle = '#8c765c';
    ctx.fillRect(0, 314, w, floorY - 314);
    for (let i = 0; i < 6; i++) {
      const bx = 65 + i * 162;
      if (bx > w * 0.37 && bx < w * 0.62) continue;
      ctx.fillStyle = i % 2 === 0 ? '#15803d' : '#b45309';
      ctx.fillRect(bx, 318, 34, 68);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(bx + 10, 338, 14, 14);
    }

    // Giant Chunin Exam Hand-Seal Statue centered on wall
    const cx = w * 0.5;
    ctx.fillStyle = '#57534e';
    ctx.fillRect(cx - 72, 232, 144, floorY - 232);
    ctx.fillStyle = '#78716c';
    ctx.fillRect(cx - 58, 246, 116, floorY - 246);
    ctx.fillStyle = '#d6d3d1';
    ctx.beginPath();
    ctx.arc(cx, 336, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e7e5e4';
    ctx.fillRect(cx - 14, 244, 28, 76);
    ctx.strokeStyle = '#57534e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, 246);
    ctx.lineTo(cx, 316);
    ctx.stroke();

    // Sweeping Stadium Spotlight Beams
    ctx.save();
    for (let i = 0; i < 4; i++) {
      const lx = w * (0.12 + i * 0.25);
      const sway = Math.sin(t * 0.025 + i * 1.4) * 75;
      const beam = ctx.createLinearGradient(lx, 120, lx + sway, floorY);
      beam.addColorStop(0, 'rgba(254,240,138,0.28)');
      beam.addColorStop(1, 'rgba(254,240,138,0)');
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(lx - 14, 120);
      ctx.lineTo(lx + 14, 120);
      ctx.lineTo(lx + sway + 85, floorY);
      ctx.lineTo(lx + sway - 85, floorY);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    drawFloatingParticles(ctx, w, floorY, t, '#fde68a', '#ffffff', 22, 0.5, -0.35, 'mote');
    drawArenaFloor(ctx, w, h, floorY, '#a17c52', '#5c4328', '#eab308', '#fde047', 'stone_tiles', t);
  }

  // 4. UCHIHA SHRINE (Làng Uchiha — Huyết Nguyệt Tsukuyomi, Cổng Torii, Quạ Đen)
  function renderUchihaShrine(ctx, w, h, floorY, t) {
    fillSky(ctx, w, floorY, '#180205', '#450a0a', '#7f1d1d');

    // Colossal Blood Moon (Tsukuyomi)
    const mx = w * 0.5;
    const my = 168;
    const pulse = 1 + 0.03 * Math.sin(t * 0.04);
    drawGlowOrb(ctx, mx, my, 155 * pulse, 'rgba(239,68,68,0.55)', 'rgba(185,28,28,0.28)', 'rgba(127,29,29,0)');
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(mx, my, 88, 0, Math.PI * 2);
    ctx.fill();

    // Subtle Rotating Sharingan Ring + 3 Tomoe inside Blood Moon
    ctx.save();
    ctx.translate(mx, my);
    ctx.rotate(t * 0.006);
    ctx.strokeStyle = 'rgba(20,0,0,0.48)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 52, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(20,0,0,0.62)';
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI * 2) / 3;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 52, Math.sin(a) * 52, 8.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Dark Uchiha District Silhouettes & Power Pole
    ctx.fillStyle = '#120608';
    for (let i = 0; i < UCHIHA_ROOFS.length; i++) {
      const rx = UCHIHA_ROOFS[i] * w;
      const rh = 115 + (i % 2) * 32;
      ctx.fillRect(rx, floorY - rh, 118, rh);
      ctx.beginPath();
      ctx.moveTo(rx - 14, floorY - rh + 4);
      ctx.lineTo(rx + 59, floorY - rh - 34);
      ctx.lineTo(rx + 132, floorY - rh + 4);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#090305';
    ctx.fillRect(w * 0.28, 175, 8, floorY - 175);
    ctx.fillRect(w * 0.255, 198, 56, 5);
    ctx.fillRect(w * 0.262, 218, 42, 4);

    // Crimson Torii Gate in Center Mid-ground
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(mx - 92, 232, 16, floorY - 232);
    ctx.fillRect(mx + 76, 232, 16, floorY - 232);
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(mx - 122, 224, 244, 16);
    ctx.fillRect(mx - 102, 256, 204, 12);
    ctx.fillStyle = '#1c0508';
    ctx.fillRect(mx - 128, 216, 256, 10);
    ctx.fillRect(mx - 10, 238, 20, 24);

    // Flapping Black Crows
    drawBirds(ctx, w, floorY, t, '#090204', 12, -1);
    drawFloatingParticles(ctx, w, floorY, t, '#ef4444', '#1f0507', 24, -1.1, 0.55, 'petal');
    drawArenaFloor(ctx, w, h, floorY, '#261417', '#0d0507', '#ef4444', '#fca5a5', 'wood_deck', t);
  }

  // 5. RAIN VILLAGE — AMEGAKURE (Làng Mưa — Tháp Ống Thép Pain, Mưa & Sấm Sét)
  function renderRainVillage(ctx, w, h, floorY, t) {
    const flash = (t % 170) < 6 || (t % 170) === 9;
    fillSky(ctx, w, floorY, flash ? '#1e3a5f' : '#020617', flash ? '#334155' : '#0f172a', '#1e293b');
    drawDriftingClouds(ctx, w, 62, 6, 0.35, t, '#334155', 0.58, 1.15);

    // Central Pain Spire Tower
    const cx = w * 0.5;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(cx - 56, 105, 112, floorY - 105);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(cx - 42, 122, 84, floorY - 122);
    ctx.fillStyle = '#38bdf8';
    ctx.globalAlpha = 0.55;
    for (let r = 0; r < 8; r++) {
      ctx.fillRect(cx - 30, 145 + r * 34, 18, 6);
      ctx.fillRect(cx + 12, 145 + r * 34, 18, 6);
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(cx - 54, 180);
    ctx.quadraticCurveTo(cx - 115, 160, cx - 105, 90);
    ctx.moveTo(cx + 54, 180);
    ctx.quadraticCurveTo(cx + 115, 160, cx + 105, 90);
    ctx.stroke();

    // Surrounding Amegakure Pipe-Towers
    for (let i = 0; i < RAIN_TOWERS.length; i++) {
      const tw = RAIN_TOWERS[i];
      const tx = tw.x * w;
      const twW = tw.w * w;
      const ty = floorY - tw.h;
      ctx.fillStyle = i % 2 === 0 ? '#0b1220' : '#131d31';
      ctx.fillRect(tx, ty, twW, tw.h);
      ctx.fillStyle = '#334155';
      for (let p = 0; p < tw.pipes; p++) {
        ctx.fillRect(tx + 8 + p * 18, ty - 14, 7, tw.h + 14);
      }
      ctx.fillStyle = 'rgba(103,232,249,0.45)';
      for (let wy = ty + 24; wy < floorY - 30; wy += 28) {
        ctx.fillRect(tx + 12, wy, twW - 24, 5);
      }
    }

    if (flash) {
      drawLightningBolt(ctx, w * 0.25, 0, floorY - 120, '#38bdf8', '#f0f9ff', 1.2, 2.4);
      drawLightningBolt(ctx, w * 0.77, 0, floorY - 140, '#06b6d4', '#ffffff', -1.1, 2.0);
    }

    drawRain(ctx, w, floorY, t, '#93c5fd', -6, 90, true);
    drawMistBands(ctx, w, floorY - 46, 52, t, '#64748b', 0.24);
    drawArenaFloor(ctx, w, h, floorY, '#1e293b', '#020617', '#06b6d4', '#67e8f9', 'metal_wet', t);
  }

  // 6. FOREST OF DEATH (Khu Rừng Chết — Cây Cổ Thụ, Hàng Rào Lưới, Đốm Sáng)
  function renderForestOfDeath(ctx, w, h, floorY, t) {
    fillSky(ctx, w, floorY, '#052e16', '#065f46', '#115e59');

    ctx.fillStyle = '#064e3b';
    for (let x = -40; x < w + 80; x += 95) {
      drawEllipse(ctx, x, 34 + (x % 3) * 14, 78, 56);
      ctx.fill();
    }

    // Back-layer Giant Ancient Trees
    for (let i = 0; i < FOREST_TREES.length; i++) {
      const tr = FOREST_TREES[i];
      if (tr.depth !== 1) continue;
      const tx = tr.x * w;
      ctx.fillStyle = '#0c291c';
      ctx.fillRect(tx - tr.w * 0.5, 40, tr.w, floorY - 40);
      ctx.beginPath();
      ctx.moveTo(tx - tr.w * 1.1, floorY);
      ctx.lineTo(tx - tr.w * 0.4, floorY - 60);
      ctx.lineTo(tx + tr.w * 0.4, floorY - 60);
      ctx.lineTo(tx + tr.w * 1.1, floorY);
      ctx.closePath();
      ctx.fill();
    }

    // Perimeter Chain-Link Mesh Fence (Training Ground 44)
    ctx.save();
    ctx.strokeStyle = 'rgba(148,163,184,0.34)';
    ctx.lineWidth = 1.2;
    const fenceTop = floorY - 125;
    for (let x = 0; x < w; x += 22) {
      ctx.beginPath();
      ctx.moveTo(x, fenceTop);
      ctx.lineTo(x + 48, floorY);
      ctx.moveTo(x + 48, fenceTop);
      ctx.lineTo(x, floorY);
      ctx.stroke();
    }
    ctx.fillStyle = '#334155';
    for (let x = 60; x < w; x += 180) {
      ctx.fillRect(x, fenceTop - 8, 8, floorY - fenceTop + 8);
    }
    ctx.fillStyle = '#facc15';
    ctx.fillRect(w * 0.5 - 24, fenceTop + 22, 48, 30);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(w * 0.5 - 16, fenceTop + 31, 32, 4);
    ctx.fillRect(w * 0.5 - 12, fenceTop + 40, 24, 4);
    ctx.restore();

    // Foreground Massive Gnarled Trees
    for (let i = 0; i < FOREST_TREES.length; i++) {
      const tr = FOREST_TREES[i];
      if (tr.depth !== 0) continue;
      const tx = tr.x * w;
      ctx.fillStyle = '#143325';
      ctx.fillRect(tx - tr.w * 0.5, 0, tr.w, floorY);
      ctx.fillStyle = '#1f4936';
      ctx.fillRect(tx - tr.w * 0.35, 0, tr.w * 0.22, floorY);
      ctx.fillStyle = '#143325';
      ctx.beginPath();
      ctx.moveTo(tx - tr.w * 1.2, floorY);
      ctx.lineTo(tx - tr.w * 0.45, floorY - 72);
      ctx.lineTo(tx + tr.w * 0.45, floorY - 72);
      ctx.lineTo(tx + tr.w * 1.2, floorY);
      ctx.closePath();
      ctx.fill();
    }

    // Diagonal Sunbeams Piercing Through Forest Canopy
    ctx.save();
    for (let i = 0; i < 4; i++) {
      const bx = w * (0.18 + i * 0.22) + Math.sin(t * 0.015 + i) * 16;
      const beam = ctx.createLinearGradient(bx, 0, bx + 90, floorY);
      beam.addColorStop(0, 'rgba(187,247,208,0.22)');
      beam.addColorStop(1, 'rgba(187,247,208,0)');
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(bx, 0);
      ctx.lineTo(bx + 42, 0);
      ctx.lineTo(bx + 150, floorY);
      ctx.lineTo(bx + 76, floorY);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    drawFloatingParticles(ctx, w, floorY, t, '#bbf7d0', '#4ade80', 34, 0.45, -0.3, 'mote');
    drawArenaFloor(ctx, w, h, floorY, '#1c3b29', '#0b1d13', '#10b981', '#86efac', 'forest_moss', t);
  }

  // 7. GREAT NARUTO BRIDGE (Đại Cầu Naruto — Cầu Đá Sương Mù & Sóng Biển)
  function renderNarutoBridge(ctx, w, h, floorY, t) {
    fillSky(ctx, w, floorY, '#475569', '#94a3b8', '#e2e8f0');
    drawGlowOrb(ctx, w * 0.72, 118, 72, 'rgba(255,255,255,0.65)', 'rgba(226,232,240,0.25)', 'rgba(226,232,240,0)');

    ctx.fillStyle = 'rgba(71,85,105,0.45)';
    ctx.beginPath();
    ctx.moveTo(0, 290);
    ctx.lineTo(w * 0.22, 232);
    ctx.lineTo(w * 0.45, 275);
    ctx.lineTo(w * 0.74, 224);
    ctx.lineTo(w, 278);
    ctx.lineTo(w, 330);
    ctx.lineTo(0, 330);
    ctx.closePath();
    ctx.fill();

    drawOceanWaves(ctx, w, 286, floorY, t, '#1d4ed8', '#0f294a', '#bae6fd');

    // Massive Stone Bridge Suspension Piers
    ctx.fillStyle = '#475569';
    for (let i = 0; i < BRIDGE_PIER_XS.length; i++) {
      const px = w * BRIDGE_PIER_XS[i];
      ctx.fillRect(px - 22, 140, 44, floorY - 140);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(px - 28, 134, 56, 16);
      ctx.fillRect(px - 26, 240, 52, 12);
      ctx.fillStyle = '#475569';
    }

    // Bridge Cables
    ctx.strokeStyle = 'rgba(100,116,139,0.75)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 248);
    ctx.quadraticCurveTo(w * 0.07, 250, w * BRIDGE_PIER_XS[0], 150);
    ctx.quadraticCurveTo(w * 0.32, 315, w * BRIDGE_PIER_XS[1], 150);
    ctx.quadraticCurveTo(w * 0.68, 315, w * BRIDGE_PIER_XS[2], 150);
    ctx.quadraticCurveTo(w * 0.93, 250, w, 248);
    ctx.stroke();

    // Bridge Stone Parapet
    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, floorY - 26, w, 26);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(0, floorY - 30, w, 5);

    drawMistBands(ctx, w, 225, 130, t, '#f1f5f9', 0.34);
    drawMistBands(ctx, w, floorY - 52, 65, t * 1.4, '#e2e8f0', 0.32);
    drawArenaFloor(ctx, w, h, floorY, '#475569', '#1e293b', '#60a5fa', '#bae6fd', 'stone_tiles', t);
  }

  // 8. 4TH SHINOBI WORLD WAR (Chiến Trường Đại Chiến Nhẫn Giả 4 — Thần Thụ)
  function renderShinobiWar(ctx, w, h, floorY, t) {
    fillSky(ctx, w, floorY, '#431407', '#c2410c', '#fb923c');
    drawGlowOrb(ctx, w * 0.5, 175, 195, 'rgba(254,215,170,0.45)', 'rgba(249,115,22,0.22)', 'rgba(249,115,22,0)');
    drawDriftingClouds(ctx, w, 82, 5, 0.28, t, '#7c2d12', 0.45, 1.1);

    // Colossal God Tree (Shinju) Trunk
    const cx = w * 0.5;
    ctx.fillStyle = '#3b1c0e';
    ctx.beginPath();
    ctx.moveTo(cx - 110, floorY);
    ctx.quadraticCurveTo(cx - 58, 280, cx - 44, 105);
    ctx.lineTo(cx + 44, 105);
    ctx.quadraticCurveTo(cx + 58, 280, cx + 110, floorY);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#3b1c0e';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(cx, 128);
    ctx.quadraticCurveTo(cx - 135, 92, cx - 225, 140);
    ctx.moveTo(cx, 128);
    ctx.quadraticCurveTo(cx + 135, 92, cx + 225, 140);
    ctx.stroke();

    // Giant Shinju Crimson Bud at Peak
    const budPulse = 1 + 0.06 * Math.sin(t * 0.06);
    drawGlowOrb(ctx, cx, 78, 56 * budPulse, 'rgba(254,202,202,0.85)', 'rgba(220,38,38,0.45)', 'rgba(220,38,38,0)');
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.moveTo(cx, 30);
    ctx.quadraticCurveTo(cx - 34, 72, cx - 20, 108);
    ctx.lineTo(cx + 20, 108);
    ctx.quadraticCurveTo(cx + 34, 72, cx, 30);
    ctx.fill();

    // Shattered Canyon Spires
    ctx.fillStyle = '#291008';
    ctx.beginPath();
    ctx.moveTo(0, floorY);
    ctx.lineTo(0, 290);
    ctx.lineTo(w * 0.14, 240);
    ctx.lineTo(w * 0.25, 320);
    ctx.lineTo(w * 0.34, 275);
    ctx.lineTo(w * 0.40, floorY);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(w, floorY);
    ctx.lineTo(w, 280);
    ctx.lineTo(w * 0.85, 225);
    ctx.lineTo(w * 0.74, 315);
    ctx.lineTo(w * 0.65, 268);
    ctx.lineTo(w * 0.60, floorY);
    ctx.closePath();
    ctx.fill();

    drawFloatingParticles(ctx, w, floorY, t, '#fde047', '#f97316', 44, 0.9, -1.3, 'ember');
    drawArenaFloor(ctx, w, h, floorY, '#5c240c', '#260e05', '#f97316', '#fb923c', 'cracked_earth', t);
  }

  // 9. HIDDEN SAND — SUNAGAKURE (Làng Cát — Bão Cát Vàng & Công Trình Vòm Đất Nung)
  function renderHiddenSand(ctx, w, h, floorY, t) {
    fillSky(ctx, w, floorY, '#b45309', '#f59e0b', '#fef08a');

    drawGlowOrb(ctx, w * 0.78, 104, 88, 'rgba(255,255,240,0.95)', 'rgba(253,224,71,0.45)', 'rgba(253,224,71,0)');
    ctx.fillStyle = '#fef9c3';
    ctx.beginPath();
    ctx.arc(w * 0.78, 104, 34, 0, Math.PI * 2);
    ctx.fill();

    // Rolling Sand Dunes
    ctx.fillStyle = '#c2782e';
    ctx.beginPath();
    ctx.moveTo(0, floorY);
    ctx.lineTo(0, 255);
    ctx.quadraticCurveTo(w * 0.25, 200, w * 0.52, 262);
    ctx.quadraticCurveTo(w * 0.78, 210, w, 248);
    ctx.lineTo(w, floorY);
    ctx.closePath();
    ctx.fill();

    // Sunagakure Domed Adobe Structures
    for (let i = 0; i < SAND_DOMES.length; i++) {
      const d = SAND_DOMES[i];
      const dx = d.x * w;
      const topY = floorY - d.h;
      ctx.fillStyle = i === 3 ? '#d99b52' : '#c4833d';
      ctx.fillRect(dx - d.r, topY, d.r * 2, d.h);
      ctx.beginPath();
      ctx.arc(dx, topY, d.r, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = 'rgba(120,53,15,0.28)';
      ctx.fillRect(dx, topY, d.r, d.h);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(dx - 7, topY + 18, 14, 22);
    }

    // Sweeping Animated Golden Sandstorm Streaks
    ctx.save();
    for (let i = 0; i < 9; i++) {
      const sy = 110 + i * 40;
      const sx = (((t * (4.2 + (i % 3) * 1.4) + i * 170) % (w + 340)) - 170);
      const sandGrad = ctx.createLinearGradient(sx - 130, sy, sx + 130, sy);
      sandGrad.addColorStop(0, 'rgba(254,240,138,0)');
      sandGrad.addColorStop(0.5, 'rgba(253,224,71,0.28)');
      sandGrad.addColorStop(1, 'rgba(254,240,138,0)');
      ctx.fillStyle = sandGrad;
      ctx.fillRect(sx - 130, sy, 260, 12 + (i % 3) * 6);
    }
    ctx.restore();

    drawFloatingParticles(ctx, w, floorY, t, '#fef08a', '#f59e0b', 42, 3.2, 0.3, 'mote');
    drawArenaFloor(ctx, w, h, floorY, '#b46924', '#6b3609', '#f59e0b', '#fde047', 'sand', t);
  }

  // 10. HEAVENS ARENA FLOOR 200 (Đấu Trường Trên Không Tầng 200 — HxH)
  function renderHeavensArena(ctx, w, h, floorY, t) {
    fillSky(ctx, w, floorY, '#020617', '#0f172a', '#1e293b');

    // Overhead Arena Steel Truss
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 74, w, 12);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    for (let x = 0; x < w; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 74);
      ctx.lineTo(x + 24, 86);
      ctx.lineTo(x + 48, 74);
      ctx.stroke();
    }

    // Multi-tier Spectator Gallery
    for (let tier = 0; tier < 4; tier++) {
      const ty = 152 + tier * 52;
      ctx.fillStyle = tier % 2 === 0 ? '#0f172a' : '#172554';
      ctx.fillRect(0, ty, w, 42);
      ctx.fillStyle = '#38bdf8';
      ctx.globalAlpha = 0.24;
      ctx.fillRect(0, ty + 39, w, 3);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#334155';
      for (let sx = 12; sx < w; sx += 18) {
        ctx.fillRect(sx, ty + 20, 8, 14);
      }
    }

    // Animated Camera Flashes
    for (let i = 0; i < 6; i++) {
      if (((t + i * 23) % 75) < 5) {
        const fx = ((i * 173 + Math.floor(t / 75) * 97) % (w - 80)) + 40;
        const fy = 170 + (i % 4) * 52;
        drawGlowOrb(ctx, fx, fy, 18, 'rgba(255,255,255,0.95)', 'rgba(186,230,253,0.45)', 'rgba(186,230,253,0)');
      }
    }

    // Center 200F Scoreboard Backdrop
    const cx = w * 0.5;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(cx - 118, 122, 236, 76);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(cx - 118, 122, 236, 76);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(cx - 94, 142, 188, 6);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(cx - 56, 158, 112, 8);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(cx - 78, 174, 156, 4);

    // Sweeping Cyan-Gold Stage Spotlight Cones
    ctx.save();
    for (let i = 0; i < 5; i++) {
      const lx = w * (0.1 + i * 0.2);
      const sway = Math.sin(t * 0.022 + i * 1.3) * 65;
      const grad = ctx.createLinearGradient(lx, 86, lx + sway, floorY);
      grad.addColorStop(0, i % 2 === 0 ? 'rgba(56,189,248,0.28)' : 'rgba(250,204,21,0.22)');
      grad.addColorStop(1, 'rgba(56,189,248,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(lx - 10, 86);
      ctx.lineTo(lx + 10, 86);
      ctx.lineTo(lx + sway + 78, floorY);
      ctx.lineTo(lx + sway - 78, floorY);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    drawArenaFloor(ctx, w, h, floorY, '#475569', '#1e293b', '#38bdf8', '#7dd3fc', 'hxh_grid', t);
  }

  // 11. YORKNEW CITY AT NIGHT (Thành Phố Yorknew Về Đêm — Neon, Khinh Khí Cầu, Trăng Tròn, Mưa)
  function renderYorknewCity(ctx, w, h, floorY, t) {
    fillSky(ctx, w, floorY, '#050816', '#1e1b4b', '#312e81');
    drawStars(ctx, w, floorY, t, '#e0e7ff', 50);

    drawGlowOrb(ctx, w * 0.5, 118, 92, 'rgba(254,249,195,0.95)', 'rgba(196,181,253,0.32)', 'rgba(196,181,253,0)');
    ctx.fillStyle = '#fef9c3';
    ctx.beginPath();
    ctx.arc(w * 0.5, 118, 36, 0, Math.PI * 2);
    ctx.fill();

    // Illuminated Yorknew Airship / Blimp
    const bx = (((t * 0.45 + 140) % (w + 260)) - 130);
    const by = 138 + Math.sin(t * 0.025) * 6;
    ctx.fillStyle = '#1e293b';
    drawEllipse(ctx, bx, by, 54, 17);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.fillStyle = '#facc15';
    ctx.fillRect(bx - 22, by - 3, 44, 5);
    const sGrad = ctx.createLinearGradient(bx, by + 16, bx + 45, floorY);
    sGrad.addColorStop(0, 'rgba(253,224,71,0.22)');
    sGrad.addColorStop(1, 'rgba(253,224,71,0)');
    ctx.fillStyle = sGrad;
    ctx.beginPath();
    ctx.moveTo(bx - 6, by + 16);
    ctx.lineTo(bx + 6, by + 16);
    ctx.lineTo(bx + 68, floorY);
    ctx.lineTo(bx - 12, floorY);
    ctx.closePath();
    ctx.fill();

    // Central Southernpiece Auction Spire
    const cx = w * 0.5;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(cx - 58, 200, 116, floorY - 200);
    ctx.beginPath();
    ctx.moveTo(cx - 42, 200);
    ctx.lineTo(cx, 148);
    ctx.lineTo(cx + 42, 200);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#facc15';
    ctx.fillRect(cx - 44, 214, 88, 6);
    ctx.fillStyle = '#e879f9';
    ctx.fillRect(cx - 32, 232, 64, 5);

    // Yorknew Neon Skyscrapers
    for (let i = 0; i < YORKNEW_BUILDINGS.length; i++) {
      const b = YORKNEW_BUILDINGS[i];
      const x = b.x * w;
      const bw = b.w * w;
      const y = floorY - b.h;
      ctx.fillStyle = '#0c1222';
      ctx.fillRect(x, y, bw, b.h);
      ctx.fillStyle = b.lit;
      ctx.globalAlpha = 0.65;
      for (let wy = y + 14; wy < floorY - 18; wy += 18) {
        for (let wx = x + 7; wx < x + bw - 10; wx += 14) {
          if (((wx + wy + i) % 3) !== 0) {
            ctx.fillRect(wx, wy, 7, 8);
          }
        }
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = b.lit;
      ctx.fillRect(x, y, bw, 3);
    }

    drawRain(ctx, w, floorY, t, '#c4b5fd', -3, 55, true);
    drawArenaFloor(ctx, w, h, floorY, '#1e1b4b', '#09071a', '#a855f7', '#e879f9', 'metal_wet', t);
  }

  // 12. GREED ISLAND (Đảo Tham Lam — Bãi Biển Xanh, Sân Bóng Né Razor Phát Sáng, Cây Dừa)
  function renderGreedIsland(ctx, w, h, floorY, t) {
    fillSky(ctx, w, floorY, '#0284c7', '#38bdf8', '#cffafe');
    drawGlowOrb(ctx, w * 0.22, 92, 62, 'rgba(255,255,235,0.95)', 'rgba(253,224,71,0.35)', 'rgba(253,224,71,0)');
    drawDriftingClouds(ctx, w, 78, 5, 0.2, t, '#ffffff', 0.82, 0.95);

    ctx.fillStyle = '#0f766e';
    ctx.beginPath();
    ctx.moveTo(w * 0.26, 305);
    ctx.lineTo(w * 0.48, 198);
    ctx.lineTo(w * 0.68, 305);
    ctx.closePath();
    ctx.fill();

    drawOceanWaves(ctx, w, 295, floorY - 26, t, '#06b6d4', '#0e7490', '#ecfeff');

    ctx.fillStyle = '#e6c28b';
    ctx.fillRect(0, floorY - 28, w, 28);

    // Glowing Nen Energy Boundary Pillars
    const pulse = 0.55 + 0.45 * Math.sin(t * 0.08);
    for (let i = 0; i < 4; i++) {
      const px = w * (0.18 + i * 0.213);
      ctx.fillStyle = '#334155';
      ctx.fillRect(px - 6, floorY - 76, 12, 76);
      drawGlowOrb(ctx, px, floorY - 80, 18 * (0.85 + 0.2 * pulse), '#ffffff', 'rgba(45,212,191,0.65)', 'rgba(45,212,191,0)');
    }

    // Swaying Tropical Palm Trees Left & Right
    for (let i = 0; i < 2; i++) {
      const px = i === 0 ? 46 : w - 46;
      const lean = i === 0 ? 24 : -24;
      const sway = Math.sin(t * 0.03 + i * 2) * 8;
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(px, floorY);
      ctx.quadraticCurveTo(px + lean * 0.5, floorY - 120, px + lean + sway, floorY - 215);
      ctx.stroke();

      const topX = px + lean + sway;
      const topY = floorY - 215;
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 7;
      for (let f = 0; f < 5; f++) {
        const a = -2.6 + f * 1.15;
        ctx.beginPath();
        ctx.moveTo(topX, topY);
        ctx.quadraticCurveTo(topX + Math.cos(a) * 44, topY + Math.sin(a) * 28 - 10, topX + Math.cos(a) * 78, topY + Math.sin(a) * 44 + 18);
        ctx.stroke();
      }
    }

    drawFloatingParticles(ctx, w, floorY, t, '#2dd4bf', '#fef08a', 26, 0.7, -0.45, 'mote');
    drawArenaFloor(ctx, w, h, floorY, '#c9a673', '#8a683a', '#14b8a6', '#2dd4bf', 'court_nen', t);
  }

  // 13. CHIMERA ANT PALACE — EAST GORTEAU (Cung Điện Đông Gorteau — Mưa Rồng Dragon Dive!)
  function renderChimeraPalace(ctx, w, h, floorY, t) {
    fillSky(ctx, w, floorY, '#09061a', '#1e1b4b', '#4c1d95');
    drawStars(ctx, w, floorY, t, '#fef3c7', 38);

    drawGlowOrb(ctx, w * 0.25, 42, 190, 'rgba(254,240,138,0.45)', 'rgba(245,158,11,0.22)', 'rgba(245,158,11,0)');

    // Ruined Royal Palace Grand Staircase & Arched Facade
    const cx = w * 0.5;
    ctx.fillStyle = '#334155';
    ctx.fillRect(cx - 210, 175, 420, floorY - 175);
    for (let s = 0; s < 10; s++) {
      const sw = 240 - s * 14;
      const sy = floorY - 14 - s * 16;
      ctx.fillStyle = s % 2 === 0 ? '#94a3b8' : '#64748b';
      ctx.fillRect(cx - sw * 0.5, sy, sw, 14);
    }
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.moveTo(cx - 28, floorY - 170);
    ctx.lineTo(cx + 28, floorY - 170);
    ctx.lineTo(cx + 62, floorY);
    ctx.lineTo(cx - 62, floorY);
    ctx.closePath();
    ctx.fill();

    // Cracked White Marble Columns
    for (let i = 0; i < CHIMERA_COL_XS.length; i++) {
      const colX = CHIMERA_COL_XS[i] * w;
      const brokenH = i === 1 ? 195 : i === 2 ? 230 : 285;
      const topY = floorY - brokenH;
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(colX - 20, topY, 40, brokenH);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(colX + 4, topY, 16, brokenH);
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(colX - 22, topY + 6);
      ctx.lineTo(colX - 6, topY - 10);
      ctx.lineTo(colX + 10, topY + 2);
      ctx.lineTo(colX + 22, topY - 6);
      ctx.lineTo(colX + 22, topY + 12);
      ctx.lineTo(colX - 22, topY + 12);
      ctx.closePath();
      ctx.fill();
    }

    // ICONIC DRAGON DIVE (Mưa Rồng — Golden Nen Spears Raining From Sky!)
    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 0; i < DRAGON_SPEARS.length; i++) {
      const ds = DRAGON_SPEARS[i];
      const prog = (ds.phase + t * ds.speed) % 1;
      const startX = ds.x * w;
      const travelY = prog * (floorY + 90) - 55;
      const travelX = startX + travelY * Math.tan(ds.angle);
      const tailX = travelX - ds.len * Math.sin(ds.angle);
      const tailY = travelY - ds.len * Math.cos(ds.angle);

      ctx.strokeStyle = 'rgba(250,204,21,0.45)';
      ctx.lineWidth = ds.width * 3.1;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(travelX, travelY);
      ctx.stroke();

      ctx.strokeStyle = '#fef9c3';
      ctx.lineWidth = ds.width;
      ctx.beginPath();
      ctx.moveTo(tailX + (travelX - tailX) * 0.35, tailY + (travelY - tailY) * 0.35);
      ctx.lineTo(travelX, travelY);
      ctx.stroke();

      if (travelY > floorY - 36 && travelY < floorY + 18) {
        drawGlowOrb(ctx, travelX, floorY - 2, 20, 'rgba(255,255,255,0.9)', 'rgba(250,204,21,0.55)', 'rgba(250,204,21,0)');
      }
    }
    ctx.restore();

    drawFloatingParticles(ctx, w, floorY, t, '#fde047', '#f59e0b', 32, 0.8, -0.7, 'ember');
    drawArenaFloor(ctx, w, h, floorY, '#64748b', '#1e293b', '#facc15', '#fef08a', 'palace_marble', t);
  }

  // 14. NETERO VS MERUEM TOMB (Chiến Địa Netero vs Meruem — Hố Đá Ngầm, Dung Nham, Bách Thức Quan Âm)
  function renderNeteroTomb(ctx, w, h, floorY, t) {
    fillSky(ctx, w, floorY, '#120804', '#29150b', '#451a03');

    // Cavern Stone Pillars
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(0, 60, 92, floorY - 60);
    ctx.fillRect(112, 150, 58, floorY - 150);
    ctx.fillRect(w - 170, 145, 58, floorY - 145);
    ctx.fillRect(w - 92, 55, 92, floorY - 55);

    // Incandescent Lava Cracks on Back Cavern Wall
    ctx.save();
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2.2;
    ctx.globalAlpha = 0.55 + 0.3 * Math.sin(t * 0.06);
    for (let i = 0; i < 6; i++) {
      const lx = 90 + i * 155;
      ctx.beginPath();
      ctx.moveTo(lx, floorY);
      ctx.lineTo(lx + (i % 2 ? 18 : -18), floorY - 58);
      ctx.lineTo(lx + (i % 2 ? -10 : 14), floorY - 120);
      ctx.stroke();
    }
    ctx.restore();

    // Majestic Translucent Golden 100-Type Guanyin Bodhisattva (Bách Thức Quan Âm)
    const cx = w * 0.5;
    const cy = 248;
    const auraPulse = 1 + 0.05 * Math.sin(t * 0.05);
    drawGlowOrb(ctx, cx, cy, 175 * auraPulse, 'rgba(254,240,138,0.48)', 'rgba(245,158,11,0.22)', 'rgba(245,158,11,0)');

    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = 'rgba(253,224,71,0.52)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -24, 118 * auraPulse, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(251,191,36,0.42)';
    ctx.lineWidth = 7;
    for (let a = -6; a <= 6; a++) {
      if (a === 0) continue;
      const ang = (a / 7) * 1.48 - Math.PI * 0.5;
      const reach = 135 + Math.sin(t * 0.04 + a) * 6;
      ctx.beginPath();
      ctx.moveTo(0, 12);
      ctx.lineTo(Math.cos(ang) * reach, Math.sin(ang) * reach);
      ctx.stroke();
      ctx.fillStyle = 'rgba(254,249,195,0.65)';
      ctx.beginPath();
      ctx.arc(Math.cos(ang) * reach, Math.sin(ang) * reach, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(253,224,71,0.36)';
    ctx.beginPath();
    ctx.arc(0, -64, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-46, 118);
    ctx.quadraticCurveTo(-52, 8, -22, -34);
    ctx.lineTo(22, -34);
    ctx.quadraticCurveTo(52, 8, 46, 118);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    drawFloatingParticles(ctx, w, floorY, t, '#fde047', '#f97316', 44, 0.35, -1.25, 'ember');
    drawArenaFloor(ctx, w, h, floorY, '#3a2419', '#140c08', '#f59e0b', '#fb923c', 'cracked_earth', t);
  }

  // 15. WHALE ISLAND (Đảo Cá Voi — Quê Nhà Gon, Đồi Cỏ Xanh, Biển Hoàng Hôn, Tàu Cá & Hải Âu)
  function renderWhaleIsland(ctx, w, h, floorY, t) {
    fillSky(ctx, w, floorY, '#1e3a8a', '#ea580c', '#fde047');
    drawDriftingClouds(ctx, w, 78, 4, 0.16, t, '#fed7aa', 0.62, 0.9);

    const sx = w * 0.55;
    const sy = 258;
    drawGlowOrb(ctx, sx, sy, 108, 'rgba(255,251,235,0.95)', 'rgba(251,146,60,0.42)', 'rgba(251,146,60,0)');
    ctx.fillStyle = '#fef9c3';
    ctx.beginPath();
    ctx.arc(sx, sy, 40, 0, Math.PI * 2);
    ctx.fill();

    drawOceanWaves(ctx, w, 266, floorY, t, '#c2410c', '#1e3a5f', '#fde68a');

    ctx.save();
    ctx.fillStyle = 'rgba(254,240,138,0.45)';
    for (let i = 0; i < 7; i++) {
      const rw = 66 - i * 6 + Math.sin(t * 0.08 + i) * 8;
      ctx.fillRect(sx - rw * 0.5, 274 + i * 16, rw, 5);
    }
    ctx.restore();

    // Bobbing Wooden Fishing Boat
    const boatX = w * 0.72 + Math.sin(t * 0.015) * 14;
    const boatY = 304 + Math.sin(t * 0.06) * 3;
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.moveTo(boatX - 28, boatY);
    ctx.lineTo(boatX + 32, boatY);
    ctx.lineTo(boatX + 20, boatY + 12);
    ctx.lineTo(boatX - 20, boatY + 12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.moveTo(boatX, boatY - 2);
    ctx.lineTo(boatX, boatY - 32);
    ctx.lineTo(boatX + 22, boatY - 6);
    ctx.closePath();
    ctx.fill();

    // Lush Green Rolling Hills of Whale Island
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.moveTo(0, floorY);
    ctx.lineTo(0, 238);
    ctx.quadraticCurveTo(w * 0.16, 205, w * 0.34, 345);
    ctx.lineTo(w * 0.42, floorY);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#166534';
    ctx.beginPath();
    ctx.moveTo(w * 0.04, 245);
    ctx.quadraticCurveTo(w * 0.11, 175, w * 0.19, 232);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.moveTo(0, floorY);
    ctx.quadraticCurveTo(w * 0.5, floorY - 28, w, floorY);
    ctx.closePath();
    ctx.fill();

    drawBirds(ctx, w, floorY, t, '#fff7ed', 7, 1);
    drawArenaFloor(ctx, w, h, floorY, '#15803d', '#052e16', '#fb923c', '#fed7aa', 'forest_moss', t);
  }

  // 16. DARK CONTINENT (Lục Địa Đen — Cây Thế Giới Chạm Mây, Đảo Nổi, Sấm Sét Tím)
  function renderDarkContinent(ctx, w, h, floorY, t) {
    const flash = (t % 145) < 5;
    fillSky(ctx, w, floorY, '#090314', flash ? '#4c1d95' : '#1e0b36', '#3b0764');
    drawStars(ctx, w, floorY, t, '#e9d5ff', 65);

    ctx.save();
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = i === 1 ? 'rgba(192,132,252,0.22)' : 'rgba(56,189,248,0.16)';
      ctx.lineWidth = 22;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 48) {
        const y = 78 + i * 36 + Math.sin(x * 0.012 + t * 0.02 + i * 2) * 20;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();

    // Colossal World Tree Trunk Piercing Straight Into the Clouds
    const cx = w * 0.5;
    const trunkGrad = ctx.createLinearGradient(cx - 95, 0, cx + 95, 0);
    trunkGrad.addColorStop(0, '#120824');
    trunkGrad.addColorStop(0.5, '#2e1065');
    trunkGrad.addColorStop(1, '#0c051a');
    ctx.fillStyle = trunkGrad;
    ctx.beginPath();
    ctx.moveTo(cx - 125, floorY);
    ctx.quadraticCurveTo(cx - 72, 240, cx - 64, 0);
    ctx.lineTo(cx + 64, 0);
    ctx.quadraticCurveTo(cx + 72, 240, cx + 125, floorY);
    ctx.closePath();
    ctx.fill();

    drawDriftingClouds(ctx, w, 128, 6, 0.25, t, '#7e22ce', 0.34, 0.85);

    // Bobbing Floating Islands
    for (let i = 0; i < DARK_ISLANDS.length; i++) {
      const isl = DARK_ISLANDS[i];
      const ix = isl.x * w;
      const iy = isl.y + Math.sin(t * 0.03 + i * 1.8) * 8;
      ctx.fillStyle = '#1e1035';
      ctx.beginPath();
      ctx.moveTo(ix - isl.rw, iy);
      ctx.lineTo(ix + isl.rw, iy);
      ctx.lineTo(ix + isl.rw * 0.45, iy + isl.rh * 1.9);
      ctx.lineTo(ix, iy + isl.rh * 2.5);
      ctx.lineTo(ix - isl.rw * 0.5, iy + isl.rh * 1.7);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#9333ea';
      ctx.fillRect(ix - isl.rw, iy - 4, isl.rw * 2, 5);
    }

    if (flash) {
      drawLightningBolt(ctx, w * 0.22, 0, floorY - 80, '#a855f7', '#faf5ff', 1.1, 2.5);
      drawLightningBolt(ctx, w * 0.78, 0, floorY - 95, '#c084fc', '#ffffff', -1.2, 2.2);
    }

    drawFloatingParticles(ctx, w, floorY, t, '#c084fc', '#38bdf8', 36, 0.4, -0.8, 'mote');
    drawArenaFloor(ctx, w, h, floorY, '#23113f', '#0a0414', '#a855f7', '#d8b4fe', 'dark_obsidian', t);
  }

  // 17. MARINEFORD (Tổng Bộ Hải Quân — One Piece: Pháo Đài Trắng, Vịnh Băng, Sóng Thần)
  function renderMarineford(ctx, w, h, floorY, t) {
    fillSky(ctx, w, floorY, '#0c4a6e', '#0284c7', '#bae6fd');
    drawDriftingClouds(ctx, w, 68, 5, 0.26, t, '#e0f2fe', 0.65, 1);

    // Twin Colossal Curling Tsunami Walls
    const wavePulse = Math.sin(t * 0.05) * 8;
    ctx.fillStyle = '#0369a1';
    ctx.beginPath();
    ctx.moveTo(0, floorY);
    ctx.lineTo(0, 128 + wavePulse);
    ctx.quadraticCurveTo(135, 118 + wavePulse, 175, 225);
    ctx.quadraticCurveTo(118, 196, 118, floorY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#e0f2fe';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, 132 + wavePulse);
    ctx.quadraticCurveTo(135, 120 + wavePulse, 172, 224);
    ctx.stroke();

    ctx.fillStyle = '#0369a1';
    ctx.beginPath();
    ctx.moveTo(w, floorY);
    ctx.lineTo(w, 128 - wavePulse);
    ctx.quadraticCurveTo(w - 135, 118 - wavePulse, w - 175, 225);
    ctx.quadraticCurveTo(w - 118, 196, w - 118, floorY);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(w, 132 - wavePulse);
    ctx.quadraticCurveTo(w - 135, 120 - wavePulse, w - 172, 224);
    ctx.stroke();

    // Frozen Cyan Ice Bay
    ctx.fillStyle = '#7dd3fc';
    ctx.fillRect(0, 345, w, floorY - 345);
    ctx.fillStyle = '#bae6fd';
    for (let x = 35; x < w; x += 110) {
      ctx.beginPath();
      ctx.moveTo(x, floorY - 24);
      ctx.lineTo(x + 28, floorY - 76);
      ctx.lineTo(x + 56, floorY - 24);
      ctx.closePath();
      ctx.fill();
    }

    // White Marineford Fortress
    const cx = w * 0.5;
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(cx - 175, 278, 350, floorY - 278);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(cx - 120, 212, 240, 68);
    ctx.fillRect(cx - 66, 148, 132, 66);
    ctx.fillStyle = '#1e3a8a';
    for (let i = 0; i < MARINEFORD_TIERS.length; i++) {
      const tr = MARINEFORD_TIERS[i];
      ctx.beginPath();
      ctx.moveTo(cx - tr.hw, tr.y + 8);
      ctx.lineTo(cx - tr.hw + 24, tr.y - 12);
      ctx.lineTo(cx + tr.hw - 24, tr.y - 12);
      ctx.lineTo(cx + tr.hw, tr.y + 8);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(cx - 22, 162, 44, 34);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 14, 174, 28, 6);

    drawFloatingParticles(ctx, w, floorY, t, '#e0f2fe', '#ffffff', 30, 0.85, 0.6, 'mote');
    drawArenaFloor(ctx, w, h, floorY, '#64748b', '#334155', '#0ea5e9', '#7dd3fc', 'stone_tiles', t);
  }

  // 18. ONIGASHIMA SKULL DOME ROOF (Đỉnh Mái Vòm Đảo Quỷ Onigashima — One Piece)
  function renderOnigashimaRoof(ctx, w, h, floorY, t) {
    const hakiFlash = (t % 95) < 6;
    fillSky(ctx, w, floorY, '#09030b', hakiFlash ? '#450a0a' : '#1c0a1e', '#3f0d1c');
    drawDriftingClouds(ctx, w, 92, 6, 0.34, t, '#451a30', 0.52, 1.05);

    const mx = w * 0.5;
    const my = 152;
    drawGlowOrb(ctx, mx, my, 138, 'rgba(255,251,235,0.92)', 'rgba(248,113,113,0.22)', 'rgba(248,113,113,0)');
    ctx.fillStyle = '#fef9c3';
    ctx.beginPath();
    ctx.arc(mx, my, 68, 0, Math.PI * 2);
    ctx.fill();

    // Colossal Curved Oni Skull Horns
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.moveTo(0, floorY);
    ctx.quadraticCurveTo(38, 285, 182, 135);
    ctx.quadraticCurveTo(132, 290, 148, floorY);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(w, floorY);
    ctx.quadraticCurveTo(w - 38, 285, w - 182, 135);
    ctx.quadraticCurveTo(w - 132, 290, w - 148, floorY);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#140c10';
    ctx.beginPath();
    ctx.moveTo(0, floorY);
    ctx.quadraticCurveTo(w * 0.5, floorY - 58, w, floorY);
    ctx.closePath();
    ctx.fill();

    // Red-and-Black Conqueror's Haki Lightning Arcs
    if (hakiFlash || (t % 55) < 4) {
      drawLightningBolt(ctx, w * 0.34, 48, floorY - 12, '#dc2626', '#09090b', 1.35, 3.2);
      drawLightningBolt(ctx, w * 0.66, 62, floorY - 18, '#ef4444', '#09090b', -1.25, 2.8);
    }

    drawFloatingParticles(ctx, w, floorY, t, '#f43f5e', '#fb923c', 36, 1.2, -1.1, 'ember');
    drawArenaFloor(ctx, w, h, floorY, '#292024', '#0f0a0c', '#dc2626', '#f43f5e', 'cracked_earth', t);
  }

  // 19. PLANET NAMEK EXPLODING (Hành Tinh Namek Sắp Nổ — DBZ: Trời Xanh Lá, Biển Lục, Núi Lửa & Sét)
  function renderPlanetNamek(ctx, w, h, floorY, t) {
    const quakeBolt = (t % 110) < 6;
    fillSky(ctx, w, floorY, '#052e16', quakeBolt ? '#65a30d' : '#15803d', '#bef264');

    drawGlowOrb(ctx, w * 0.24, 96, 48, 'rgba(255,255,230,0.9)', 'rgba(190,242,100,0.35)', 'rgba(190,242,100,0)');
    drawGlowOrb(ctx, w * 0.78, 124, 34, 'rgba(255,255,230,0.85)', 'rgba(163,230,53,0.3)', 'rgba(163,230,53,0)');

    drawOceanWaves(ctx, w, 286, floorY, t, '#10b981', '#065f46', '#a7f3d0');

    // Erupting Namek Volcanoes (Left & Right)
    for (let i = 0; i < 2; i++) {
      const vx = i === 0 ? w * 0.16 : w * 0.82;
      const vh = i === 0 ? 170 : 195;
      const hw = i === 0 ? 95 : 112;
      const topY = floorY - vh;
      ctx.fillStyle = '#1f2937';
      ctx.beginPath();
      ctx.moveTo(vx - hw, floorY);
      ctx.lineTo(vx - 22, topY);
      ctx.lineTo(vx + 22, topY);
      ctx.lineTo(vx + hw, floorY);
      ctx.closePath();
      ctx.fill();
      const erupt = 1 + 0.15 * Math.sin(t * 0.12 + i * 2);
      drawGlowOrb(ctx, vx, topY - 12, 46 * erupt, 'rgba(254,240,138,0.95)', 'rgba(249,115,22,0.55)', 'rgba(249,115,22,0)');
    }

    // Namek Island Mesa + Ajisa Tree
    ctx.fillStyle = '#166534';
    ctx.beginPath();
    ctx.moveTo(w * 0.36, floorY);
    ctx.lineTo(w * 0.40, 316);
    ctx.lineTo(w * 0.60, 316);
    ctx.lineTo(w * 0.64, floorY);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#78716c';
    ctx.fillRect(w * 0.495, 256, 8, 62);
    ctx.fillStyle = '#22d3ee';
    ctx.beginPath();
    ctx.arc(w * 0.5, 248, 22, 0, Math.PI * 2);
    ctx.fill();

    if (quakeBolt) {
      drawLightningBolt(ctx, w * 0.42, 0, floorY - 110, '#fde047', '#ffffff', 1.25, 2.6);
      drawLightningBolt(ctx, w * 0.68, 0, floorY - 135, '#a3e635', '#ffffff', -1.1, 2.2);
    }

    drawFloatingParticles(ctx, w, floorY, t, '#fb923c', '#fde047', 40, 0.7, -1.4, 'ember');
    drawArenaFloor(ctx, w, h, floorY, '#1b4332', '#081c15', '#4ade80', '#f97316', 'cracked_earth', t);
  }

  // 20. HYPERBOLIC TIME CHAMBER (Phòng Thời Gian & Tinh Thần — DBZ)
  function renderTimeChamber(ctx, w, h, floorY, t) {
    fillSky(ctx, w, floorY, '#f8fafc', '#f1f5f9', '#e2e8f0');

    const hGrad = ctx.createLinearGradient(0, floorY - 75, 0, floorY);
    hGrad.addColorStop(0, 'rgba(203,213,225,0)');
    hGrad.addColorStop(1, 'rgba(203,213,225,0.52)');
    ctx.fillStyle = hGrad;
    ctx.fillRect(0, floorY - 75, w, 75);

    const cx = w * 0.5;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.fillRect(cx - 128, floorY - 82, 256, 82);
    ctx.strokeRect(cx - 128, floorY - 82, 256, 82);

    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(cx, floorY - 82, 54, Math.PI, 0);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(cx, floorY - 36, 22, Math.PI, 0);
    ctx.lineTo(cx + 22, floorY);
    ctx.lineTo(cx - 22, floorY);
    ctx.closePath();
    ctx.fill();

    // Twin Golden Hourglass Towers
    const sandProg = (t * 0.003) % 1;
    for (let i = 0; i < 2; i++) {
      const tx = i === 0 ? cx - 168 : cx + 168;
      ctx.fillStyle = '#d97706';
      ctx.fillRect(tx - 28, floorY - 196, 56, 14);
      ctx.fillRect(tx - 28, floorY - 22, 56, 22);
      ctx.fillRect(tx - 24, floorY - 182, 6, 160);
      ctx.fillRect(tx + 18, floorY - 182, 6, 160);

      ctx.fillStyle = 'rgba(186,230,253,0.38)';
      ctx.beginPath();
      ctx.moveTo(tx - 18, floorY - 180);
      ctx.lineTo(tx + 18, floorY - 180);
      ctx.lineTo(tx + 3, floorY - 102);
      ctx.lineTo(tx + 18, floorY - 24);
      ctx.lineTo(tx - 18, floorY - 24);
      ctx.lineTo(tx - 3, floorY - 102);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#f59e0b';
      const topSandH = 44 * (1 - sandProg * 0.6);
      ctx.beginPath();
      ctx.moveTo(tx - topSandH * 0.32, floorY - 106 - topSandH);
      ctx.lineTo(tx + topSandH * 0.32, floorY - 106 - topSandH);
      ctx.lineTo(tx, floorY - 102);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(tx - 1, floorY - 102, 2, 76);
      const botH = 18 + sandProg * 28;
      ctx.beginPath();
      ctx.moveTo(tx - 16, floorY - 24);
      ctx.lineTo(tx, floorY - 24 - botH);
      ctx.lineTo(tx + 16, floorY - 24);
      ctx.closePath();
      ctx.fill();
    }

    drawFloatingParticles(ctx, w, floorY, t, '#f59e0b', '#94a3b8', 24, 0.35, -0.25, 'mote');
    drawArenaFloor(ctx, w, h, floorY, '#f1f5f9', '#cbd5e1', '#f59e0b', '#fbbf24', 'white_void', t);
  }

  // 21. SOUL SOCIETY — SOKYOKU HILL (Thi Hồn Giới — Đỉnh Song Cực, Hoàng Hôn Cam & Senbonzakura)
  function renderSoulSociety(ctx, w, h, floorY, t) {
    fillSky(ctx, w, floorY, '#7c2d12', '#ea580c', '#fde047');

    const cx = w * 0.5;
    drawGlowOrb(ctx, cx, 210, 148, 'rgba(255,251,235,0.92)', 'rgba(251,146,60,0.42)', 'rgba(251,146,60,0)');
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.arc(cx, 210, 72, 0, Math.PI * 2);
    ctx.fill();

    // Seireitei Traditional Pagoda Rooflines
    ctx.fillStyle = '#5c1f10';
    for (let i = 0; i < 6; i++) {
      const rx = 25 + i * 168;
      const rh = 72 + (i % 2) * 28;
      ctx.fillRect(rx, floorY - rh, 118, rh);
      ctx.beginPath();
      ctx.moveTo(rx - 18, floorY - rh + 6);
      ctx.lineTo(rx + 59, floorY - rh - 24);
      ctx.lineTo(rx + 136, floorY - rh + 6);
      ctx.closePath();
      ctx.fill();
    }

    // Sokyoku Execution Scaffold Silhouette
    ctx.fillStyle = '#3b1008';
    ctx.fillRect(cx - 10, 118, 20, floorY - 118);
    ctx.fillRect(cx - 88, 162, 176, 12);
    ctx.fillRect(cx - 64, 146, 128, 9);

    // Ancient Stone Pillars
    for (let i = 0; i < SOUL_STONE_COLS.length; i++) {
      const px = w * SOUL_STONE_COLS[i];
      const ph = 185 + (i % 2) * 55;
      ctx.fillStyle = '#44261c';
      ctx.fillRect(px - 22, floorY - ph, 44, ph);
      ctx.fillStyle = '#783f2a';
      ctx.fillRect(px - 26, floorY - ph, 52, 12);
    }

    drawFloatingParticles(ctx, w, floorY, t, '#f472b6', '#fbcfe8', 56, 1.85, 0.55, 'petal');
    drawArenaFloor(ctx, w, h, floorY, '#57362b', '#291712', '#f472b6', '#fbcfe8', 'stone_tiles', t);
  }

  // 22. SHIBUYA STATION — CURTAIN (Ga Shibuya — Màn Kết Giới, Đèn Tàu Điện, Vô Lượng Không Xứ)
  function renderShibuyaCurtain(ctx, w, h, floorY, t) {
    fillSky(ctx, w, floorY, '#04030a', '#140c29', '#1e1b4b');

    // Shimmering Jujutsu Curtain Barrier Waves
    ctx.save();
    for (let i = 0; i < 6; i++) {
      const y = 42 + i * 56 + Math.sin(t * 0.04 + i) * 8;
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(99,102,241,0.22)' : 'rgba(168,85,247,0.18)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 60) {
        const wy = y + Math.sin(x * 0.018 + t * 0.045 + i) * 9;
        if (x === 0) ctx.moveTo(x, wy);
        else ctx.lineTo(x, wy);
      }
      ctx.stroke();
    }
    ctx.restore();

    // Pulsing Unlimited Void (Vô Lượng Không Xứ) Cosmic Ring Aura
    const cx = w * 0.5;
    const cy = 225;
    const voidPulse = 1 + 0.06 * Math.sin(t * 0.055);
    drawGlowOrb(ctx, cx, cy, 138 * voidPulse, 'rgba(255,255,255,0.25)', 'rgba(99,102,241,0.32)', 'rgba(99,102,241,0)');
    ctx.save();
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 3.5;
    ctx.globalAlpha = 0.72;
    ctx.beginPath();
    ctx.arc(cx, cy, 74 * voidPulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#e0e7ff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 56 * (2 - voidPulse), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Underground Shibuya Subway Train Silhouette
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, floorY - 122, w, 122);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(0, floorY - 58, w, 5);
    const flicker = (t % 97) < 3 ? 0.25 : 0.78;
    ctx.fillStyle = 'rgba(199,210,254,' + flicker + ')';
    for (let x = 24; x < w; x += 92) {
      ctx.fillRect(x, floorY - 104, 58, 36);
    }

    // Concrete Subway Support Pillars & Station Signbars
    for (let i = 0; i < 4; i++) {
      const px = w * (0.12 + i * 0.253);
      ctx.fillStyle = '#18181b';
      ctx.fillRect(px - 22, 82, 44, floorY - 82);
      ctx.fillStyle = '#27272a';
      ctx.fillRect(px - 18, 82, 10, floorY - 82);
      ctx.fillStyle = '#312e81';
      ctx.fillRect(px - 36, 132, 72, 24);
      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 1.6;
      ctx.strokeRect(px - 36, 132, 72, 24);
      ctx.fillStyle = '#e0e7ff';
      ctx.fillRect(px - 22, 141, 44, 5);
    }

    // Overhead Flickering Fluorescent Subway Lights
    ctx.fillStyle = flicker > 0.5 ? '#e0e7ff' : '#4338ca';
    for (let x = 70; x < w; x += 210) {
      ctx.fillRect(x, 86, 78, 5);
    }

    drawFloatingParticles(ctx, w, floorY, t, '#818cf8', '#c084fc', 34, 0.35, -0.55, 'mote');
    drawArenaFloor(ctx, w, h, floorY, '#27272a', '#09090b', '#6366f1', '#818cf8', 'subway_platform', t);
  }

  // ==================== 7. RENDERER DISPATCH TABLE ====================
  const RENDERERS = {
    konoha_village: renderKonohaVillage,
    final_valley: renderFinalValley,
    chunin_arena: renderChuninArena,
    uchiha_shrine: renderUchihaShrine,
    rain_village: renderRainVillage,
    forest_of_death: renderForestOfDeath,
    naruto_bridge: renderNarutoBridge,
    shinobi_war: renderShinobiWar,
    hidden_sand: renderHiddenSand,
    heavens_arena: renderHeavensArena,
    yorknew_city: renderYorknewCity,
    greed_island: renderGreedIsland,
    chimera_palace: renderChimeraPalace,
    netero_tomb: renderNeteroTomb,
    whale_island: renderWhaleIsland,
    dark_continent: renderDarkContinent,
    marineford: renderMarineford,
    onigashima_roof: renderOnigashimaRoof,
    planet_namek: renderPlanetNamek,
    time_chamber: renderTimeChamber,
    soul_society: renderSoulSociety,
    shibuya_curtain: renderShibuyaCurtain
  };

  // ==================== 8. PUBLIC API ====================
  function renderArenaMap(ctx, mapId, width, height, floorY, frameCount) {
    if (!ctx) return;
    const w = width || 960;
    const h = height || 540;
    const fy = floorY || 455;
    const t = frameCount || 0;
    const renderer = RENDERERS[mapId] || RENDERERS.konoha_village;
    ctx.save();
    renderer(ctx, w, h, fy, t);
    ctx.restore();
  }

  function getArenaMapById(mapId) {
    return MAP_BY_ID[mapId] || MAP_BY_ID.konoha_village;
  }

  window.MAP_CATEGORIES = MAP_CATEGORIES;
  window.GAME_MAPS = GAME_MAPS;
  window.renderArenaMap = renderArenaMap;
  window.getArenaMapById = getArenaMapById;
})();
