/**
 * Global Cultural Day - Flag and Country Definitions
 * Includes high-fidelity canvas vector renderers for headbands and cheek stickers
 */

const REGIONS = {
  ALL: { id: 'all', name: 'All Continents', icon: '🌍', desc: 'Global Random Mix' },
  ASIA: { id: 'asia', name: 'Asia', icon: '🏮', desc: 'Indonesia, Japan, China, India, Thailand' },
  EUROPE: { id: 'europe', name: 'Europe', icon: '🏰', desc: 'France, Italy, Germany, United Kingdom' },
  NORTH_AFRICA: { id: 'north_africa', name: 'North Africa', icon: '🏜️', desc: 'Egypt, Morocco, Algeria, Tunisia' },
  WEST_AFRICA: { id: 'west_africa', name: 'West Africa', icon: '🥁', desc: 'Ghana, Nigeria, Senegal, Ivory Coast' },
  SOUTHERN_AFRICA: { id: 'southern_africa', name: 'Southern Africa', icon: '🦁', desc: 'South Africa, Namibia, Botswana, Zimbabwe' },
  OCEANIA: { id: 'oceania', name: 'Oceania', icon: '🌊', desc: 'Australia, New Zealand, Pacific Islands' }
};

const COUNTRIES = [
  // --- ASIA ---
  {
    id: 'indonesia',
    name: 'Indonesia',
    region: 'asia',
    emoji: '🇮🇩',
    colors: ['#D60000', '#FFFFFF'],
    draw: (ctx, w, h) => {
      ctx.fillStyle = '#D60000';
      ctx.fillRect(0, 0, w, h / 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, h / 2, w, h / 2);
    }
  },
  {
    id: 'japan',
    name: 'Japan',
    region: 'asia',
    emoji: '🇯🇵',
    colors: ['#FFFFFF', '#BC002D'],
    draw: (ctx, w, h) => {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#BC002D';
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, Math.min(w, h) * 0.32, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  {
    id: 'china',
    name: 'China',
    region: 'asia',
    emoji: '🇨🇳',
    colors: ['#DE2910', '#FFDE00'],
    draw: (ctx, w, h) => {
      ctx.fillStyle = '#DE2910';
      ctx.fillRect(0, 0, w, h);
      // Main large star
      drawStar(ctx, w * 0.22, h * 0.3, Math.min(w, h) * 0.16, 5, '#FFDE00');
      // 4 smaller stars arc
      const smR = Math.min(w, h) * 0.055;
      drawStar(ctx, w * 0.42, h * 0.16, smR, 5, '#FFDE00', 0.2);
      drawStar(ctx, w * 0.48, h * 0.27, smR, 5, '#FFDE00', 0.4);
      drawStar(ctx, w * 0.48, h * 0.41, smR, 5, '#FFDE00', 0);
      drawStar(ctx, w * 0.42, h * 0.52, smR, 5, '#FFDE00', -0.2);
    }
  },
  {
    id: 'india',
    name: 'India',
    region: 'asia',
    emoji: '🇮🇳',
    colors: ['#FF9933', '#FFFFFF', '#128807'],
    draw: (ctx, w, h) => {
      const sh = h / 3;
      ctx.fillStyle = '#FF9933';
      ctx.fillRect(0, 0, w, sh);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, sh, w, sh);
      ctx.fillStyle = '#128807';
      ctx.fillRect(0, sh * 2, w, sh);
      // Ashoka Chakra (Navy Blue Wheel with 24 spokes)
      const cx = w / 2, cy = h / 2, r = sh * 0.42;
      ctx.strokeStyle = '#000088';
      ctx.lineWidth = Math.max(1.5, r * 0.12);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = Math.max(1, r * 0.08);
      for (let i = 0; i < 24; i++) {
        const ang = (i * Math.PI) / 12;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r);
        ctx.stroke();
      }
    }
  },
  {
    id: 'thailand',
    name: 'Thailand',
    region: 'asia',
    emoji: '🇹🇭',
    colors: ['#A51931', '#F4F5F8', '#2D2A4A'],
    draw: (ctx, w, h) => {
      const u = h / 6;
      ctx.fillStyle = '#A51931';
      ctx.fillRect(0, 0, w, u);
      ctx.fillStyle = '#F4F5F8';
      ctx.fillRect(0, u, w, u);
      ctx.fillStyle = '#2D2A4A';
      ctx.fillRect(0, u * 2, w, u * 2);
      ctx.fillStyle = '#F4F5F8';
      ctx.fillRect(0, u * 4, w, u);
      ctx.fillStyle = '#A51931';
      ctx.fillRect(0, u * 5, w, u);
    }
  },

  // --- EROPA ---
  {
    id: 'france',
    name: 'France',
    region: 'europe',
    emoji: '🇫🇷',
    colors: ['#002654', '#FFFFFF', '#ED2939'],
    draw: (ctx, w, h) => {
      const sw = w / 3;
      ctx.fillStyle = '#002654';
      ctx.fillRect(0, 0, sw, h);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(sw, 0, sw, h);
      ctx.fillStyle = '#ED2939';
      ctx.fillRect(sw * 2, 0, sw, h);
    }
  },
  {
    id: 'italy',
    name: 'Italy',
    region: 'europe',
    emoji: '🇮🇹',
    colors: ['#008C45', '#F4F5F0', '#CD212A'],
    draw: (ctx, w, h) => {
      const sw = w / 3;
      ctx.fillStyle = '#008C45';
      ctx.fillRect(0, 0, sw, h);
      ctx.fillStyle = '#F4F5F0';
      ctx.fillRect(sw, 0, sw, h);
      ctx.fillStyle = '#CD212A';
      ctx.fillRect(sw * 2, 0, sw, h);
    }
  },
  {
    id: 'germany',
    name: 'Germany',
    region: 'europe',
    emoji: '🇩🇪',
    colors: ['#000000', '#DD0000', '#FFCC00'],
    draw: (ctx, w, h) => {
      const sh = h / 3;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, sh);
      ctx.fillStyle = '#DD0000';
      ctx.fillRect(0, sh, w, sh);
      ctx.fillStyle = '#FFCC00';
      ctx.fillRect(0, sh * 2, w, sh);
    }
  },
  {
    id: 'uk',
    name: 'United Kingdom',
    region: 'europe',
    emoji: '🇬🇧',
    colors: ['#012169', '#FFFFFF', '#C8102E'],
    draw: (ctx, w, h) => {
      drawUnionJack(ctx, 0, 0, w, h);
    }
  },

  // --- AFRIKA UTARA ---
  {
    id: 'egypt',
    name: 'Egypt',
    region: 'north_africa',
    emoji: '🇪🇬',
    colors: ['#CE1126', '#FFFFFF', '#000000', '#C09A35'],
    draw: (ctx, w, h) => {
      const sh = h / 3;
      ctx.fillStyle = '#CE1126';
      ctx.fillRect(0, 0, w, sh);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, sh, w, sh);
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, sh * 2, w, sh);
      // Golden Eagle of Saladin
      drawEagleEmblem(ctx, w / 2, h / 2, sh * 0.42);
    }
  },
  {
    id: 'morocco',
    name: 'Morocco',
    region: 'north_africa',
    emoji: '🇲🇦',
    colors: ['#C1272D', '#006233'],
    draw: (ctx, w, h) => {
      ctx.fillStyle = '#C1272D';
      ctx.fillRect(0, 0, w, h);
      // Green 5-pointed interlaced pentagram star
      drawHollowStar(ctx, w / 2, h / 2, Math.min(w, h) * 0.28, '#006233', Math.min(w, h) * 0.04);
    }
  },
  {
    id: 'algeria',
    name: 'Algeria',
    region: 'north_africa',
    emoji: '🇩🇿',
    colors: ['#006233', '#FFFFFF', '#D21034'],
    draw: (ctx, w, h) => {
      ctx.fillStyle = '#006233';
      ctx.fillRect(0, 0, w / 2, h);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(w / 2, 0, w / 2, h);
      // Red crescent & star
      drawCrescentAndStar(ctx, w / 2, h / 2, Math.min(w, h) * 0.25, '#D21034');
    }
  },
  {
    id: 'tunisia',
    name: 'Tunisia',
    region: 'north_africa',
    emoji: '🇹🇳',
    colors: ['#E70013', '#FFFFFF'],
    draw: (ctx, w, h) => {
      ctx.fillStyle = '#E70013';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, Math.min(w, h) * 0.3, 0, Math.PI * 2);
      ctx.fill();
      drawCrescentAndStar(ctx, w / 2, h / 2, Math.min(w, h) * 0.2, '#E70013');
    }
  },

  // --- AFRIKA BARAT ---
  {
    id: 'ghana',
    name: 'Ghana',
    region: 'west_africa',
    emoji: '🇬🇭',
    colors: ['#CF0921', '#FCD20F', '#006B3F'],
    draw: (ctx, w, h) => {
      const sh = h / 3;
      ctx.fillStyle = '#CF0921';
      ctx.fillRect(0, 0, w, sh);
      ctx.fillStyle = '#FCD20F';
      ctx.fillRect(0, sh, w, sh);
      ctx.fillStyle = '#006B3F';
      ctx.fillRect(0, sh * 2, w, sh);
      // Black Star of Africa in center
      drawStar(ctx, w / 2, h / 2, sh * 0.44, 5, '#000000');
    }
  },
  {
    id: 'nigeria',
    name: 'Nigeria',
    region: 'west_africa',
    emoji: '🇳🇬',
    colors: ['#008753', '#FFFFFF'],
    draw: (ctx, w, h) => {
      const sw = w / 3;
      ctx.fillStyle = '#008753';
      ctx.fillRect(0, 0, sw, h);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(sw, 0, sw, h);
      ctx.fillStyle = '#008753';
      ctx.fillRect(sw * 2, 0, sw, h);
    }
  },
  {
    id: 'senegal',
    name: 'Senegal',
    region: 'west_africa',
    emoji: '🇸🇳',
    colors: ['#00853F', '#FDEF42', '#E31B23'],
    draw: (ctx, w, h) => {
      const sw = w / 3;
      ctx.fillStyle = '#00853F';
      ctx.fillRect(0, 0, sw, h);
      ctx.fillStyle = '#FDEF42';
      ctx.fillRect(sw, 0, sw, h);
      ctx.fillStyle = '#E31B23';
      ctx.fillRect(sw * 2, 0, sw, h);
      // Green star in center yellow stripe
      drawStar(ctx, w / 2, h / 2, Math.min(sw, h) * 0.24, 5, '#00853F');
    }
  },
  {
    id: 'ivory_coast',
    name: 'Ivory Coast',
    region: 'west_africa',
    emoji: '🇨🇮',
    colors: ['#F77F00', '#FFFFFF', '#009E60'],
    draw: (ctx, w, h) => {
      const sw = w / 3;
      ctx.fillStyle = '#F77F00';
      ctx.fillRect(0, 0, sw, h);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(sw, 0, sw, h);
      ctx.fillStyle = '#009E60';
      ctx.fillRect(sw * 2, 0, sw, h);
    }
  },

  // --- AFRIKA SELATAN ---
  {
    id: 'south_africa',
    name: 'South Africa',
    region: 'southern_africa',
    emoji: '🇿🇦',
    colors: ['#E03C31', '#001489', '#007749', '#FFB81C', '#000000'],
    draw: (ctx, w, h) => {
      // Red top, Blue bottom
      ctx.fillStyle = '#E03C31';
      ctx.fillRect(0, 0, w, h / 2);
      ctx.fillStyle = '#001489';
      ctx.fillRect(0, h / 2, w, h / 2);

      // White chevron border
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(w * 0.5, h * 0.5);
      ctx.lineTo(0, h);
      ctx.lineTo(0, h * 0.8);
      ctx.lineTo(w * 0.35, h * 0.5);
      ctx.lineTo(0, h * 0.2);
      ctx.closePath();
      ctx.fill();

      // White horizontal stripe
      ctx.fillRect(w * 0.35, h * 0.38, w * 0.65, h * 0.24);

      // Green Y-band
      ctx.fillStyle = '#007749';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.08);
      ctx.lineTo(w * 0.44, h * 0.5);
      ctx.lineTo(0, h * 0.92);
      ctx.lineTo(0, h * 0.76);
      ctx.lineTo(w * 0.32, h * 0.5);
      ctx.lineTo(0, h * 0.24);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(w * 0.32, h * 0.42, w * 0.68, h * 0.16);

      // Black triangle with Gold trim
      ctx.fillStyle = '#FFB81C';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.18);
      ctx.lineTo(w * 0.32, h * 0.5);
      ctx.lineTo(0, h * 0.82);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.24);
      ctx.lineTo(w * 0.26, h * 0.5);
      ctx.lineTo(0, h * 0.76);
      ctx.closePath();
      ctx.fill();
    }
  },
  {
    id: 'namibia',
    name: 'Namibia',
    region: 'southern_africa',
    emoji: '🇳🇦',
    colors: ['#003580', '#D21034', '#009543', '#FFCE00'],
    draw: (ctx, w, h) => {
      // Blue top triangle
      ctx.fillStyle = '#003580';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(w, 0);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      // Green bottom triangle
      ctx.fillStyle = '#009543';
      ctx.beginPath();
      ctx.moveTo(w, 0);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      // White stripe
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = h * 0.28;
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(w, 0);
      ctx.stroke();

      // Red stripe
      ctx.strokeStyle = '#D21034';
      ctx.lineWidth = h * 0.2;
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(w, 0);
      ctx.stroke();

      // Gold 12-ray Sun in blue triangle
      drawSun12(ctx, w * 0.22, h * 0.3, Math.min(w, h) * 0.16, '#FFCE00');
    }
  },
  {
    id: 'botswana',
    name: 'Botswana',
    region: 'southern_africa',
    emoji: '🇧🇼',
    colors: ['#75AADB', '#FFFFFF', '#000000'],
    draw: (ctx, w, h) => {
      ctx.fillStyle = '#75AADB';
      ctx.fillRect(0, 0, w, h);
      // White band
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, h * 0.38, w, h * 0.24);
      // Black band
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, h * 0.42, w, h * 0.16);
    }
  },
  {
    id: 'zimbabwe',
    name: 'Zimbabwe',
    region: 'southern_africa',
    emoji: '🇿🇼',
    colors: ['#006400', '#FFD700', '#D40000', '#000000'],
    draw: (ctx, w, h) => {
      const sh = h / 7;
      const palette = ['#006400', '#FFD700', '#D40000', '#000000', '#D40000', '#FFD700', '#006400'];
      palette.forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.fillRect(0, sh * i, w, sh);
      });
      // White triangle at hoist with black border
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(w * 0.38, h * 0.5);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Red star in triangle
      drawStar(ctx, w * 0.16, h * 0.5, Math.min(w, h) * 0.15, 5, '#D40000');
    }
  },

  // --- OSEANIA ---
  {
    id: 'australia',
    name: 'Australia',
    region: 'oceania',
    emoji: '🇦🇺',
    colors: ['#00008B', '#FFFFFF', '#FF0000'],
    draw: (ctx, w, h) => {
      ctx.fillStyle = '#00008B';
      ctx.fillRect(0, 0, w, h);
      // Union jack in top left quarter
      drawUnionJack(ctx, 0, 0, w * 0.5, h * 0.5);

      // Large 7-pointed Commonwealth star below Union Jack
      drawStar(ctx, w * 0.25, h * 0.75, Math.min(w, h) * 0.14, 7, '#FFFFFF');

      // Southern Cross stars on fly
      drawStar(ctx, w * 0.75, h * 0.22, Math.min(w, h) * 0.05, 7, '#FFFFFF'); // Gamma
      drawStar(ctx, w * 0.63, h * 0.44, Math.min(w, h) * 0.05, 7, '#FFFFFF'); // Beta
      drawStar(ctx, w * 0.87, h * 0.44, Math.min(w, h) * 0.05, 7, '#FFFFFF'); // Delta
      drawStar(ctx, w * 0.75, h * 0.82, Math.min(w, h) * 0.05, 7, '#FFFFFF'); // Alpha
      drawStar(ctx, w * 0.81, h * 0.6, Math.min(w, h) * 0.035, 5, '#FFFFFF'); // Epsilon
    }
  },
  {
    id: 'new_zealand',
    name: 'New Zealand',
    region: 'oceania',
    emoji: '🇳🇿',
    colors: ['#00247D', '#CC142B', '#FFFFFF'],
    draw: (ctx, w, h) => {
      ctx.fillStyle = '#00247D';
      ctx.fillRect(0, 0, w, h);
      drawUnionJack(ctx, 0, 0, w * 0.5, h * 0.5);

      // 4 Red stars with white border (Southern Cross)
      const drawRedNZStar = (cx, cy, r) => {
        drawStar(ctx, cx, cy, r + 2, 5, '#FFFFFF');
        drawStar(ctx, cx, cy, r, 5, '#CC142B');
      };
      drawRedNZStar(w * 0.75, h * 0.22, Math.min(w, h) * 0.06);
      drawRedNZStar(w * 0.65, h * 0.45, Math.min(w, h) * 0.055);
      drawRedNZStar(w * 0.86, h * 0.45, Math.min(w, h) * 0.055);
      drawRedNZStar(w * 0.75, h * 0.8, Math.min(w, h) * 0.07);
    }
  },
  {
    id: 'fiji',
    name: 'Fiji & Pacific Islands',
    region: 'oceania',
    emoji: '🇫🇯',
    colors: ['#68BFE5', '#FFFFFF', '#CC142B'],
    draw: (ctx, w, h) => {
      // Sky blue field
      ctx.fillStyle = '#68BFE5';
      ctx.fillRect(0, 0, w, h);
      drawUnionJack(ctx, 0, 0, w * 0.5, h * 0.5);

      // Fijian shield on fly
      const sx = w * 0.75, sy = h * 0.5, sw = w * 0.25, sh = h * 0.55;
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#B22222';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(sx - sw / 2, sy - sh / 2, sw, sh, [4, 4, 16, 16]);
      ctx.fill();
      ctx.stroke();

      // Red top lion band
      ctx.fillStyle = '#CC142B';
      ctx.fillRect(sx - sw / 2, sy - sh / 2, sw, sh * 0.28);
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(sx - sw * 0.25, sy - sh * 0.45, sw * 0.5, sh * 0.18);

      // Red cross dividing lower shield
      ctx.strokeStyle = '#CC142B';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sx, sy - sh * 0.22);
      ctx.lineTo(sx, sy + sh * 0.45);
      ctx.moveTo(sx - sw / 2, sy + sh * 0.12);
      ctx.lineTo(sx + sw / 2, sy + sh * 0.12);
      ctx.stroke();
    }
  }
];

// -------------------------------------------------------------
// HELPER DRAWING FUNCTIONS FOR HIGH QUALITY VECTOR FLAGS
// -------------------------------------------------------------

function drawStar(ctx, cx, cy, r, points = 5, color = '#FFD700', angleOffset = 0) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  const innerR = r * 0.382;
  const total = points * 2;
  for (let i = 0; i < total; i++) {
    const rad = (i * Math.PI) / points - Math.PI / 2 + angleOffset;
    const radDist = i % 2 === 0 ? r : innerR;
    const x = cx + Math.cos(rad) * radDist;
    const y = cy + Math.sin(rad) * radDist;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawHollowStar(ctx, cx, cy, r, color, lineWidth) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = 'miter';
  ctx.beginPath();
  const points = 5;
  const coords = [];
  for (let i = 0; i < points; i++) {
    const rad = (i * 2 * Math.PI) / points - Math.PI / 2;
    coords.push({ x: cx + Math.cos(rad) * r, y: cy + Math.sin(rad) * r });
  }
  // Connect in pentagram order: 0 -> 2 -> 4 -> 1 -> 3 -> 0
  const order = [0, 2, 4, 1, 3, 0];
  ctx.moveTo(coords[order[0]].x, coords[order[0]].y);
  for (let i = 1; i < order.length; i++) {
    ctx.lineTo(coords[order[i]].x, coords[order[i]].y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawCrescentAndStar(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.fillStyle = color;
  // Outer circle
  ctx.beginPath();
  ctx.arc(cx - r * 0.05, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Inner cutout to create crescent
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(cx + r * 0.28, cy, r * 0.78, 0, Math.PI * 2);
  ctx.fill();

  // Reset comp operation for star
  ctx.globalCompositeOperation = 'source-over';
  drawStar(ctx, cx + r * 0.42, cy, r * 0.42, 5, color);
  ctx.restore();
}

function drawEagleEmblem(ctx, cx, cy, size) {
  ctx.save();
  ctx.fillStyle = '#C09A35'; // Gold
  ctx.beginPath();
  // Body shield shape
  ctx.ellipse(cx, cy, size * 0.5, size * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wings
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.9, cy - size * 0.2);
  ctx.lineTo(cx - size * 0.2, cy - size * 0.7);
  ctx.lineTo(cx + size * 0.2, cy - size * 0.7);
  ctx.lineTo(cx + size * 0.9, cy - size * 0.2);
  ctx.lineTo(cx + size * 0.6, cy + size * 0.5);
  ctx.lineTo(cx, cy + size * 0.9);
  ctx.lineTo(cx - size * 0.6, cy + size * 0.5);
  ctx.closePath();
  ctx.fill();

  // Inner chest shield
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(cx - size * 0.25, cy - size * 0.35, size * 0.5, size * 0.6);
  ctx.fillStyle = '#000000';
  ctx.fillRect(cx - size * 0.25, cy + size * 0.05, size * 0.5, size * 0.2);
  ctx.fillStyle = '#CE1126';
  ctx.fillRect(cx - size * 0.25, cy - size * 0.35, size * 0.5, size * 0.2);
  ctx.restore();
}

function drawSun12(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
  ctx.fill();

  // 12 rays
  ctx.lineWidth = r * 0.16;
  ctx.strokeStyle = color;
  for (let i = 0; i < 12; i++) {
    const ang = (i * Math.PI) / 6;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(ang) * (r * 0.62), cy + Math.sin(ang) * (r * 0.62));
    ctx.lineTo(cx + Math.cos(ang) * (r * 0.98), cy + Math.sin(ang) * (r * 0.98));
    ctx.stroke();
  }
  ctx.restore();
}

function drawUnionJack(ctx, x, y, w, h) {
  ctx.save();
  // Blue base
  ctx.fillStyle = '#012169';
  ctx.fillRect(x, y, w, h);

  // White saltire (diagonal cross)
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = Math.max(2, h * 0.2);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y + h);
  ctx.moveTo(x + w, y);
  ctx.lineTo(x, y + h);
  ctx.stroke();

  // Red saltire (thinner)
  ctx.strokeStyle = '#C8102E';
  ctx.lineWidth = Math.max(1, h * 0.08);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y + h);
  ctx.moveTo(x + w, y);
  ctx.lineTo(x, y + h);
  ctx.stroke();

  // White broad cross
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(x + w / 2 - (w * 0.12), y, w * 0.24, h);
  ctx.fillRect(x, y + h / 2 - (h * 0.16), w, h * 0.32);

  // Red central cross
  ctx.fillStyle = '#C8102E';
  ctx.fillRect(x + w / 2 - (w * 0.07), y, w * 0.14, h);
  ctx.fillRect(x, y + h / 2 - (h * 0.1), w, h * 0.2);

  ctx.restore();
}

// -------------------------------------------------------------
// CACHE & TEXTURE BUILDER
// -------------------------------------------------------------

const TextureCache = {
  bandanas: {},
  stickers: {},

  getBandanaTexture(countryId) {
    if (this.bandanas[countryId]) return this.bandanas[countryId];
    const country = COUNTRIES.find(c => c.id === countryId) || COUNTRIES[0];

    // High resolution bandana strip canvas (800x160 px)
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');

    // Draw the flag pattern across the strip
    country.draw(ctx, canvas.width, canvas.height);

    // Apply realistic fabric texture overlay
    addFabricTexture(ctx, canvas.width, canvas.height);

    // Apply top and bottom stitched seam line
    addStitchLines(ctx, canvas.width, canvas.height);

    this.bandanas[countryId] = canvas;
    return canvas;
  },

  getStickerTexture(countryId, style = 'flag') {
    const cacheKey = `${countryId}:${style}`;
    if (this.stickers[cacheKey]) return this.stickers[cacheKey];
    const country = COUNTRIES.find(c => c.id === countryId) || COUNTRIES[0];

    // High resolution cheek sticker decal (300x200 px, 3:2 ratio)
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');

    const w = canvas.width;
    const h = canvas.height;
    const radius = 12;

    if (style === 'flag') {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(1.5, 1.5, w - 3, h - 3, radius);
      ctx.clip();

      country.draw(ctx, w, h);

      const sheen = ctx.createLinearGradient(0, 0, w, h);
      sheen.addColorStop(0, 'rgba(255, 255, 255, 0.28)');
      sheen.addColorStop(0.3, 'rgba(255, 255, 255, 0.1)');
      sheen.addColorStop(0.65, 'rgba(255, 255, 255, 0)');
      sheen.addColorStop(1, 'rgba(0, 0, 0, 0.08)');
      ctx.fillStyle = sheen;
      ctx.fillRect(0, 0, w, h);

      ctx.restore();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(1, 1, w - 2, h - 2, radius);
      ctx.stroke();
    } else {
      const icon = STICKER_STYLES.find(item => item.id === style)?.icon || STICKER_STYLES[0].icon;

      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.24)';
      ctx.shadowBlur = 12;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 86, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '142px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
      ctx.fillText(icon, w / 2, h / 2 + 3);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 86, 0, Math.PI * 2);
      ctx.stroke();
    }

    this.stickers[cacheKey] = canvas;
    return canvas;
  }
};

const STICKER_STYLES = [
  { id: 'flag', label: 'Flag', icon: '🏳️' },
  { id: 'heart', label: 'Heart', icon: '💖' },
  { id: 'star', label: 'Star', icon: '⭐' },
  { id: 'flower', label: 'Flower', icon: '🌸' },
  { id: 'sparkle', label: 'Sparkle', icon: '✨' }
];

/**
 * Adds micro fabric weave pattern to the headband
 */
function addFabricTexture(ctx, w, h) {
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';

  // Tiny stripe pattern for cloth weave
  for (let x = 0; x < w; x += 4) {
    ctx.fillRect(x, 0, 1.5, h);
  }
  for (let y = 0; y < h; y += 4) {
    ctx.fillRect(0, y, w, 1.5);
  }

  // Edge darkening for cylindrical wrap impression
  const grad = ctx.createLinearGradient(0, 0, w, 0);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.38)');
  grad.addColorStop(0.18, 'rgba(0, 0, 0, 0.06)');
  grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.15)');
  grad.addColorStop(0.82, 'rgba(0, 0, 0, 0.06)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.38)');

  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.restore();
}

/**
 * Adds stitched hem lines on top & bottom of bandana
 */
function addStitchLines(ctx, w, h) {
  ctx.save();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);

  // Top stitch
  ctx.beginPath();
  ctx.moveTo(0, 8);
  ctx.lineTo(w, 8);
  ctx.stroke();

  // Bottom stitch
  ctx.beginPath();
  ctx.moveTo(0, h - 8);
  ctx.lineTo(w, h - 8);
  ctx.stroke();

  ctx.restore();
}

// Export for app
window.REGIONS = REGIONS;
window.COUNTRIES = COUNTRIES;
window.TextureCache = TextureCache;
window.STICKER_STYLES = STICKER_STYLES;
