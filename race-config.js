/**
 * race-config.js — Đọc config từ Google Sheets và inject vào trang
 * Dùng chung cho index.html, public.html, checkin.html
 * Version 4.0
 */

// ── DEFAULT CONFIG (fallback nếu chưa setup Sheets) ──────────
const DEFAULT_CONFIG = {
  // Sự kiện
  raceName:     'Giải Chạy Hoàn Kiếm',
  raceNameHighlight: 'Hoàn Kiếm',        // Phần được tô màu vàng trong title
  slogan:       'Chào mừng 80 năm ngày truyền thống ngành TDTT Việt Nam',
  story:        '',
  badgeText:    '🏅 Đăng ký chính thức · 2026',
  raceDate:     '21.03.2026',
  raceDateFull: '21/03/2026',
  location:     'Hồ Hoàn Kiếm, Hoàn Kiếm, Hà Nội',
  locationShort:'Hồ Hoàn Kiếm',

  // Liên hệ
  phone:        '0986 399 842',
  email:        'vrace@vumedia.vn',
  facebook:     '',
  website:      'vrace.vn',

  // Thanh toán
  bankName:     'Vietcombank',
  bankAccount:  '1234567890',
  bankOwner:    'NGUYEN VAN A',
  ckPrefix:     'GIAICHAY',

  // Quỹ thiện nguyện
  charityEnabled: false,
  charityName:  '',
  charityDesc:  '',
  charityAmount:'',

  // Màu sắc
  colorPrimary: '#D72B2B',
  colorAccent:  '#F5A623',

  // Logo / Banner
  logoUrl:      '',
  bannerUrl:    '',

  // Cự ly [{id, label, price, desc}]
  distances: [
    { id:'1.5km', label:'1.5km', desc:'Gia đình', price:50000,  priceDisplay:'50.000đ' },
    { id:'3km',   label:'3km',   desc:'',          price:80000,  priceDisplay:'80.000đ' },
    { id:'5km',   label:'5km',   desc:'',          price:120000, priceDisplay:'120.000đ' },
  ],

  // Nhà tài trợ [{name, sub, offer, logo, color}]
  sponsors: [
    { name:'PHỞ ĐỆ NHẤT', sub:'Acecook Vietnam', offer:'🍜 Nhận 1 tô phở miễn phí khi đeo BIB tại quầy sự kiện!', logo:'🍜', color:'#e67e22' },
    { name:'VRACE.VN',    sub:'Đơn vị vận hành', offer:'🏅 Nhận huy chương kỹ thuật số miễn phí sau giải',        logo:'🏅', color:'#27ae60' },
  ],

  // Vai trò nhân sự [{id, name, icon, desc, free, price, priceDisplay, maxSlot, allowance, shifts, zones, enabled}]
  staffRoles: [
    { id:'pacer',   name:'Pacer',              icon:'🏃', desc:'Dẫn tốc cho VĐV theo nhóm tốc độ',     free:true,  maxSlot:20, allowance:'',        shifts:[], zones:[], enabled:true },
    { id:'nag',     name:'NAG',                icon:'🤝', desc:'Hỗ trợ VĐV dọc đường chạy',             free:true,  maxSlot:30, allowance:'',        shifts:[], zones:[], enabled:true },
    { id:'tnv',     name:'Tình nguyện viên',   icon:'💚', desc:'Hỗ trợ BTC các công việc tổ chức',      free:true,  maxSlot:50, allowance:'',        shifts:[], zones:[], enabled:true },
    { id:'security',name:'An ninh',            icon:'🛡️', desc:'Đảm bảo an ninh trật tự khu vực thi đấu', free:true, maxSlot:15, allowance:'200.000đ', shifts:[], zones:[], enabled:true },
    { id:'medical', name:'Y tế / Cứu thương',  icon:'🏥', desc:'Chăm sóc sức khoẻ VĐV và nhân sự',     free:true,  maxSlot:10, allowance:'300.000đ', shifts:[], zones:[], enabled:true },
    { id:'cheer',   name:'Cổ vũ / Cheering',   icon:'📣', desc:'Tạo không khí sôi động cho giải chạy', free:true,  maxSlot:40, allowance:'',        shifts:[], zones:[], enabled:true },
    { id:'sponsor', name:'Nhà tài trợ',        icon:'🏆', desc:'Đại diện thương hiệu tại sự kiện',      free:true,  maxSlot:null, allowance:'',      shifts:[], zones:[], enabled:true },
    { id:'idea',    name:'Sáng kiến / Đề xuất',icon:'💡', desc:'Đóng góp ý tưởng cải thiện sự kiện',   free:true,  maxSlot:null, allowance:'',      shifts:[], zones:[], enabled:true },
  ],
};

// ── CACHE ────────────────────────────────────────────────────
let _config = null;
let _loading = null;

/**
 * Load config: ưu tiên Sheets → fallback localStorage → fallback default
 */
async function loadRaceConfig(forceRefresh = false) {
  if (_config && !forceRefresh) return _config;
  if (_loading) return _loading;

  _loading = (async () => {
    // 1. Thử từ localStorage cache (nhanh, offline)
    const cached = localStorage.getItem('race_config_cache');
    const cachedAt = parseInt(localStorage.getItem('race_config_cache_at') || '0');
    const cacheAge = Date.now() - cachedAt;
    const CACHE_TTL = 5 * 60 * 1000; // 5 phút

    if (cached && cacheAge < CACHE_TTL && !forceRefresh) {
      try {
        _config = { ...DEFAULT_CONFIG, ...JSON.parse(cached) };
        _loading = null;
        return _config;
      } catch(e) {}
    }

    // 2. Thử từ Google Sheets
    const sheetUrl = localStorage.getItem('race_sheet_url') || '';
    if (sheetUrl) {
      try {
        const res = await fetch(sheetUrl + '?action=getConfig&t=' + Date.now());
        const json = await res.json();
        if (json.config) {
          _config = { ...DEFAULT_CONFIG, ...json.config };
          localStorage.setItem('race_config_cache', JSON.stringify(json.config));
          localStorage.setItem('race_config_cache_at', Date.now().toString());
          _loading = null;
          return _config;
        }
      } catch(e) {
        console.warn('Config: Sheets load failed, using cache/default');
      }
    }

    // 3. Fallback: dùng cache cũ hoặc default
    if (cached) {
      try { _config = { ...DEFAULT_CONFIG, ...JSON.parse(cached) }; }
      catch(e) { _config = { ...DEFAULT_CONFIG }; }
    } else {
      _config = { ...DEFAULT_CONFIG };
    }
    _loading = null;
    return _config;
  })();

  return _loading;
}

/**
 * Inject config vào trang index.html
 */
async function applyConfigToRegForm() {
  const c = await loadRaceConfig();

  // CSS custom colors
  const root = document.documentElement;
  if (c.colorPrimary) root.style.setProperty('--red', c.colorPrimary);
  if (c.colorAccent)  root.style.setProperty('--gold', c.colorAccent);

  // Hero section
  _setHTML('heroBadge',    c.badgeText || '');
  _setHTML('heroTitleMain', buildHeroTitle(c));
  _setHTML('heroSub',      c.slogan || '');
  _setText('heroDate',     c.raceDate || '');
  _setText('heroLocation', c.locationShort || c.location || '');

  // Story
  if (c.story) {
    const storyEl = document.getElementById('raceStory');
    if (storyEl) { storyEl.textContent = c.story; storyEl.closest('.sec').style.display = 'block'; }
  }

  // Logo
  if (c.logoUrl) {
    const logoEl = document.getElementById('raceLogo');
    if (logoEl) { logoEl.src = c.logoUrl; logoEl.style.display = 'block'; }
  }

  // Banner
  if (c.bannerUrl) {
    const bannerEl = document.getElementById('raceBanner');
    if (bannerEl) { bannerEl.style.backgroundImage = `url(${c.bannerUrl})`; }
  }

  // Thanh toán
  _setText('bankName',    c.bankName || '');
  _setText('bankAccount', c.bankAccount || '');
  _setText('bankOwner',   c.bankOwner || '');

  // Liên hệ
  const emailLinks = document.querySelectorAll('[data-cfg="email"]');
  emailLinks.forEach(el => { el.href = 'mailto:'+c.email; el.textContent = c.email; });
  const phoneEls = document.querySelectorAll('[data-cfg="phone"]');
  phoneEls.forEach(el => { el.textContent = c.phone; });

  // Cự ly — rebuild radio buttons
  buildDistanceOptions(c.distances);

  // Phí
  window.__RACE_DISTANCES = c.distances;
  window.__RACE_CK_PREFIX = c.ckPrefix || 'GIAICHAY';

  // Quỹ thiện nguyện
  if (c.charityEnabled && c.charityName) buildCharitySection(c);

  // NTT
  window.__RACE_SPONSORS = c.sponsors;

  // Page title
  document.title = (c.raceName || 'Giải Chạy') + ' — Đăng ký';
}

/**
 * Inject config vào public.html
 */
async function applyConfigToPublic() {
  const c = await loadRaceConfig();
  const root = document.documentElement;
  if (c.colorPrimary) root.style.setProperty('--red', c.colorPrimary);
  if (c.colorAccent)  root.style.setProperty('--gold', c.colorAccent);
  _setText('pubTitle',  c.raceName || '');
  _setText('pubSub',    (c.raceName||'') + ' · ' + (c.raceDateFull||c.raceDate||'') + ' · ' + (c.locationShort||''));
  document.title = 'Danh sách — ' + (c.raceName || 'Giải Chạy');
  window.__RACE_DISTANCES = c.distances;
}

/**
 * Inject config vào checkin.html
 */
async function applyConfigToCheckin() {
  const c = await loadRaceConfig();
  const root = document.documentElement;
  if (c.colorPrimary) root.style.setProperty('--red', c.colorPrimary);
  if (c.colorAccent)  root.style.setProperty('--gold', c.colorAccent);
  _setText('checkinRaceName', c.raceName || '');
  document.title = 'Phát BIB — ' + (c.raceName || 'Giải Chạy');
  // Rebuild desk buttons theo cự ly
  buildDeskButtons(c.distances);
}

// ── HELPERS ──────────────────────────────────────────────────
function _setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
function _setHTML(id, val) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = val;
}

function buildHeroTitle(c) {
  const full = c.raceName || '';
  const hi = c.raceNameHighlight || '';
  if (!hi || !full.includes(hi)) return esc(full);
  const parts = full.split(hi);
  return esc(parts[0]) + '<span>' + esc(hi) + '</span>' + esc(parts[1] || '');
}

function buildDistanceOptions(distances) {
  // Rebuild cự ly radio cho form cá nhân/join-team
  const distG = document.getElementById('distG');
  if (!distG || !distances?.length) return;
  distG.innerHTML = distances.map(d => `
    <label class="ro" onclick="selR(this,'distG')">
      <input type="radio" name="dist" value="${d.id}">
      ${d.label}${d.desc ? ' <span style="font-size:10px;color:var(--muted)">('+d.desc+')</span>' : ''}
      <span style="font-size:10px;color:var(--gold);margin-left:4px">${d.priceDisplay || ''}</span>
    </label>`).join('');

  // Rebuild select cho team
  const teamDist = document.getElementById('teamDist');
  if (teamDist) {
    teamDist.innerHTML = '<option value="">-- Chọn cự ly --</option>' +
      distances.map(d => `<option value="${d.id}">${d.label}${d.desc?' ('+d.desc+')':''} — ${d.priceDisplay||''}</option>`).join('');
  }
}

function buildCharitySection(c) {
  const el = document.getElementById('charitySec');
  if (!el) return;
  el.style.display = 'block';
  _setText('charityName', c.charityName);
  _setText('charityDesc', c.charityDesc || '');
  _setText('charityAmount', c.charityAmount ? '('+c.charityAmount+'/người)' : '');
}

function buildDeskButtons(distances) {
  const grid = document.getElementById('deskGrid');
  if (!grid || !distances?.length) return;
  const colors = ['var(--gold)', 'var(--red)', 'var(--green)', '#8e44ad', '#2980b9'];
  // deskId phải UPPERCASE không có dấu cách, ví dụ: "1.5KM", "3KM"
  grid.innerHTML = distances.map((d, i) => {
    const deskId = d.id.toUpperCase().replace(/\s/g,'');
    return `<div class="desk-btn" onclick="selDesk('${deskId}',this)">
      <div class="dk" style="color:${colors[i % colors.length]}">${d.label}</div>
      <div class="dl">${d.desc || 'Cự ly ' + d.label}</div>
    </div>`;
  }).join('') +
  `<div class="desk-btn" onclick="selDesk('ALL',this)">
    <div class="dk" style="color:var(--muted)">ALL</div>
    <div class="dl">Tất cả</div>
  </div>`;
}

function getFeeDisplay(distId) {
  const distances = window.__RACE_DISTANCES || DEFAULT_CONFIG.distances;
  const d = distances.find(x => x.id === distId);
  return d ? d.priceDisplay : 'Liên hệ BTC';
}

function getCkPrefix() {
  return window.__RACE_CK_PREFIX || DEFAULT_CONFIG.ckPrefix || 'GIAICHAY';
}

function getSponsors() {
  return window.__RACE_SPONSORS || DEFAULT_CONFIG.sponsors;
}

function esc(s) {
  return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
