/**
 * hlrace-i18n.js — HLRace Internationalization + Text-to-Speech Engine
 * Version: 1.0.0
 * Zero dependencies · Vanilla JS · Web Speech API
 * Hỗ trợ: Tiếng Việt · English · 民族语言 (dân tộc thiểu số)
 *
 * Cách dùng:
 *   1. Thêm <script src="hlrace-i18n.js"></script> vào <head>
 *   2. Đánh dấu text cần dịch: <span data-i18n="key">fallback text</span>
 *   3. Thêm data-tts="true" vào element muốn có nút loa
 *   4. Gọi HLi18n.init() khi trang load xong
 */

;(function(window) {
'use strict';

// ══════════════════════════════════════════════════════════════════
// TRANSLATIONS — tất cả text cứng của hệ thống
// ══════════════════════════════════════════════════════════════════
const TRANSLATIONS = {

  vi: {
    // ── Chung ──
    'app.name':             'HLRace',
    'app.tagline':          'Hạ tầng kết nối cộng đồng chạy bộ Việt Nam',
    'app.support.email':    'lehoang81@gmail.com',
    'app.support.phone':    '0904 028 281',
    'lang.select':          'Ngôn ngữ',
    'listen.this':          'Nghe nội dung này',
    'listen.stop':          'Dừng đọc',

    // ── Đăng ký VĐV ──
    'reg.title':            'Đăng Ký Giải Chạy',
    'reg.name':             'Họ và tên',
    'reg.phone':            'Số điện thoại',
    'reg.gender':           'Giới tính',
    'reg.gender.male':      'Nam',
    'reg.gender.female':    'Nữ',
    'reg.city':             'Tỉnh / Thành phố',
    'reg.distance':         'Cự ly',
    'reg.shirt':            'Cỡ áo',
    'reg.submit':           'Đăng ký ngay',
    'reg.success':          'Đăng ký thành công! Vui lòng chờ xác nhận.',
    'reg.error':            'Có lỗi xảy ra. Vui lòng thử lại.',
    'reg.required':         'Vui lòng điền đầy đủ thông tin',
    'reg.charity.join':     'Tôi muốn đóng góp từ thiện',

    // ── Check-in / Phát BIB ──
    'checkin.title':        'Phát BIB',
    'checkin.search':       'Tìm vận động viên',
    'checkin.search.hint':  'Nhập số CCCD/CMND hoặc tên',
    'checkin.found':        'Tìm thấy',
    'checkin.not_found':    'Không tìm thấy vận động viên',
    'checkin.confirm':      'Xác nhận phát BIB',
    'checkin.done':         'Đã phát BIB thành công',
    'checkin.bib_number':   'Số BIB',
    'checkin.already':      'VĐV này đã nhận BIB',

    // ── Runner Connect ──
    'connect.title':        'Kết nối Runner',
    'connect.find_partner': 'Tìm bạn đồng hành',
    'connect.pace':         'Tốc độ',
    'connect.area':         'Khu vực',
    'connect.carpool':      'Đi chung xe',
    'connect.roomshare':    'Ở chung phòng',
    'connect.gear_lend':    'Mượn/cho mượn gear',
    'connect.match':        'Kết nối',
    'connect.matched':      'Đã kết nối',
    'connect.no_match':     'Chưa tìm được bạn phù hợp',

    // ── Điểm công đức ──
    'merit.title':          'Điểm Công Đức',
    'merit.earned':         'Đã tích lũy',
    'merit.donate':         'Quy đổi từ thiện',
    'merit.points':         'điểm',
    'merit.history':        'Lịch sử',
    'merit.action.race':    'Hoàn thành race',
    'merit.action.lend':    'Cho mượn gear',
    'merit.action.review':  'Viết review',
    'merit.action.charity': 'Tặng BIB từ thiện',
    'merit.action.volunteer':'Tình nguyện viên',

    // ── Gear ──
    'gear.title':           'Kho Đồ',
    'gear.lend':            'Cho mượn',
    'gear.rent':            'Thuê',
    'gear.condition':       'Tình trạng',
    'gear.condition.new':   'Mới',
    'gear.condition.excellent': 'Rất tốt',
    'gear.condition.good':  'Tốt',
    'gear.condition.fair':  'Bình thường',
    'gear.available':       'Sẵn sàng cho mượn',
    'gear.request':         'Yêu cầu mượn',
    'gear.per_day':         'mỗi ngày',

    // ── BIB Transfer ──
    'bib.transfer':         'Chuyển nhượng BIB',
    'bib.charity_donate':   'Tặng BIB từ thiện',
    'bib.transfer.confirm': 'Xác nhận chuyển nhượng',
    'bib.status.approved':  'Đã duyệt',
    'bib.status.pending':   'Chờ duyệt',
    'bib.status.completed': 'Hoàn thành',

    // ── Review ──
    'review.title':         'Viết Đánh Giá',
    'review.score':         'Điểm đánh giá',
    'review.pros':          'Điểm tốt',
    'review.cons':          'Điểm cần cải thiện',
    'review.advice':        'Lời khuyên cho runner tiếp theo',
    'review.submit':        'Gửi đánh giá',
    'review.thanks':        'Cảm ơn đánh giá của bạn!',

    // ── Thông báo lỗi ──
    'error.network':        'Không có kết nối mạng',
    'error.sheets':         'Chưa cấu hình Google Sheets',
    'error.auth':           'Sai mật khẩu',
    'error.not_found':      'Không tìm thấy',

    // ── Phổ biến ──
    'btn.save':             'Lưu',
    'btn.cancel':           'Huỷ',
    'btn.confirm':          'Xác nhận',
    'btn.back':             'Quay lại',
    'btn.next':             'Tiếp theo',
    'btn.close':            'Đóng',
    'btn.search':           'Tìm kiếm',
    'btn.filter':           'Lọc',
    'btn.share':            'Chia sẻ',
    'status.loading':       'Đang tải...',
    'status.empty':         'Chưa có dữ liệu',
  },

  en: {
    'app.name':             'HLRace',
    'app.tagline':          'Vietnam Running Community Infrastructure',
    'app.support.email':    'lehoang81@gmail.com',
    'app.support.phone':    '0904 028 281',
    'lang.select':          'Language',
    'listen.this':          'Listen to this',
    'listen.stop':          'Stop reading',

    'reg.title':            'Race Registration',
    'reg.name':             'Full Name',
    'reg.phone':            'Phone Number',
    'reg.gender':           'Gender',
    'reg.gender.male':      'Male',
    'reg.gender.female':    'Female',
    'reg.city':             'Province / City',
    'reg.distance':         'Distance',
    'reg.shirt':            'Shirt Size',
    'reg.submit':           'Register Now',
    'reg.success':          'Registration successful! Please wait for confirmation.',
    'reg.error':            'An error occurred. Please try again.',
    'reg.required':         'Please fill in all required fields',
    'reg.charity.join':     'I want to donate to charity',

    'checkin.title':        'BIB Distribution',
    'checkin.search':       'Find Athlete',
    'checkin.search.hint':  'Enter ID number or name',
    'checkin.found':        'Found',
    'checkin.not_found':    'Athlete not found',
    'checkin.confirm':      'Confirm BIB Distribution',
    'checkin.done':         'BIB distributed successfully',
    'checkin.bib_number':   'BIB Number',
    'checkin.already':      'This athlete has already received their BIB',

    'connect.title':        'Runner Connect',
    'connect.find_partner': 'Find Running Partner',
    'connect.pace':         'Pace',
    'connect.area':         'Area',
    'connect.carpool':      'Carpool',
    'connect.roomshare':    'Room Share',
    'connect.gear_lend':    'Borrow/Lend Gear',
    'connect.match':        'Connect',
    'connect.matched':      'Connected',
    'connect.no_match':     'No matching runner found yet',

    'merit.title':          'Merit Points',
    'merit.earned':         'Accumulated',
    'merit.donate':         'Convert to Charity',
    'merit.points':         'points',
    'merit.history':        'History',
    'merit.action.race':    'Race completed',
    'merit.action.lend':    'Gear lent',
    'merit.action.review':  'Review written',
    'merit.action.charity': 'BIB donated to charity',
    'merit.action.volunteer':'Volunteered',

    'gear.title':           'Gear Locker',
    'gear.lend':            'Lend',
    'gear.rent':            'Rent',
    'gear.condition':       'Condition',
    'gear.condition.new':   'New',
    'gear.condition.excellent': 'Excellent',
    'gear.condition.good':  'Good',
    'gear.condition.fair':  'Fair',
    'gear.available':       'Available to borrow',
    'gear.request':         'Request to Borrow',
    'gear.per_day':         'per day',

    'bib.transfer':         'BIB Transfer',
    'bib.charity_donate':   'Donate BIB to Charity',
    'bib.transfer.confirm': 'Confirm Transfer',
    'bib.status.approved':  'Approved',
    'bib.status.pending':   'Pending',
    'bib.status.completed': 'Completed',

    'review.title':         'Write a Review',
    'review.score':         'Score',
    'review.pros':          'What went well',
    'review.cons':          'What could be improved',
    'review.advice':        'Advice for next runner',
    'review.submit':        'Submit Review',
    'review.thanks':        'Thank you for your review!',

    'error.network':        'No internet connection',
    'error.sheets':         'Google Sheets not configured',
    'error.auth':           'Wrong password',
    'error.not_found':      'Not found',

    'btn.save':             'Save',
    'btn.cancel':           'Cancel',
    'btn.confirm':          'Confirm',
    'btn.back':             'Back',
    'btn.next':             'Next',
    'btn.close':            'Close',
    'btn.search':           'Search',
    'btn.filter':           'Filter',
    'btn.share':            'Share',
    'status.loading':       'Loading...',
    'status.empty':         'No data yet',
  },

  // Tiếng Thái (ngôn ngữ dân tộc phổ biến ở vùng tây bắc VN)
  th_vn: {
    'app.name':             'HLRace',
    'app.tagline':          'ปล็อตฟอร์มวิ่งเวียดนาม',
    'reg.title':            'ลงทะเบียนวิ่ง',
    'reg.name':             'ชื่อ-นามสกุล',
    'reg.phone':            'เบอร์โทร',
    'reg.submit':           'ลงทะเบียน',
    'reg.success':          'ลงทะเบียนสำเร็จ!',
    'checkin.title':        'รับบิบ',
    'checkin.search':       'ค้นหานักวิ่ง',
    'btn.confirm':          'ยืนยัน',
    'btn.cancel':           'ยกเลิก',
    'status.loading':       'กำลังโหลด...',
    // fallback về tiếng Anh cho các key chưa có
  },

  // Khmer (Campuchia — runner quốc tế hay tham dự)
  km: {
    'app.name':             'HLRace',
    'reg.title':            'ចុះឈ្មោះរត់',
    'reg.name':             'ឈ្មោះ',
    'reg.phone':            'លេខទូរស័ព្ទ',
    'reg.submit':           'ចុះឈ្មោះ',
    'reg.success':          'ចុះឈ្មោះបានជោគជ័យ!',
    'checkin.title':        'ចែកBIB',
    'btn.confirm':          'បញ្ជាក់',
    'btn.cancel':           'បោះបង់',
    'status.loading':       'កំពុងផ្ទុក...',
  },

  // Tiếng Nhật (nhiều runner Nhật tham gia VMM, Sapa...)
  ja: {
    'app.name':             'HLRace',
    'app.tagline':          'ベトナムランニングコミュニティ',
    'reg.title':            'レース登録',
    'reg.name':             'お名前',
    'reg.phone':            '電話番号',
    'reg.gender':           '性別',
    'reg.gender.male':      '男性',
    'reg.gender.female':    '女性',
    'reg.distance':         '距離',
    'reg.submit':           '登録する',
    'reg.success':          '登録が完了しました！確認をお待ちください。',
    'reg.error':            'エラーが発生しました。もう一度お試しください。',
    'checkin.title':        'BIB受け取り',
    'checkin.search':       'ランナーを探す',
    'checkin.done':         'BIBを配布しました',
    'merit.title':          '功徳ポイント',
    'merit.donate':         'チャリティに換える',
    'btn.confirm':          '確認',
    'btn.cancel':           'キャンセル',
    'btn.back':             '戻る',
    'btn.save':             '保存',
    'status.loading':       '読み込み中...',
    'status.empty':         'データがありません',
  },

  // Tiếng Hàn
  ko: {
    'app.name':             'HLRace',
    'app.tagline':          '베트남 러닝 커뮤니티',
    'reg.title':            '레이스 등록',
    'reg.name':             '이름',
    'reg.phone':            '전화번호',
    'reg.gender':           '성별',
    'reg.gender.male':      '남성',
    'reg.gender.female':    '여성',
    'reg.distance':         '거리',
    'reg.submit':           '지금 등록',
    'reg.success':          '등록이 완료되었습니다!',
    'checkin.title':        'BIB 배포',
    'checkin.search':       '선수 찾기',
    'merit.title':          '공덕 포인트',
    'btn.confirm':          '확인',
    'btn.cancel':           '취소',
    'btn.back':             '뒤로',
    'status.loading':       '로딩 중...',
  },

  // Tiếng Trung (runner Trung Quốc và Đài Loan)
  zh: {
    'app.name':             'HLRace',
    'app.tagline':          '越南跑步社区平台',
    'reg.title':            '赛事报名',
    'reg.name':             '姓名',
    'reg.phone':            '电话号码',
    'reg.gender':           '性别',
    'reg.gender.male':      '男',
    'reg.gender.female':    '女',
    'reg.distance':         '距离',
    'reg.submit':           '立即报名',
    'reg.success':          '报名成功！请等待确认。',
    'checkin.title':        'BIB 领取',
    'checkin.search':       '查找运动员',
    'merit.title':          '功德积分',
    'merit.donate':         '转换为慈善',
    'btn.confirm':          '确认',
    'btn.cancel':           '取消',
    'btn.back':             '返回',
    'status.loading':       '加载中...',
  },
};

// ══════════════════════════════════════════════════════════════════
// LANGUAGE CONFIG
// ══════════════════════════════════════════════════════════════════
const LANG_CONFIG = {
  vi:     { name:'Tiếng Việt',  flag:'🇻🇳', voiceLang:'vi-VN',  dir:'ltr' },
  en:     { name:'English',     flag:'🇬🇧', voiceLang:'en-US',  dir:'ltr' },
  ja:     { name:'日本語',       flag:'🇯🇵', voiceLang:'ja-JP',  dir:'ltr' },
  ko:     { name:'한국어',       flag:'🇰🇷', voiceLang:'ko-KR',  dir:'ltr' },
  zh:     { name:'中文',         flag:'🇨🇳', voiceLang:'zh-CN',  dir:'ltr' },
  th_vn:  { name:'ภาษาไทย',    flag:'🇹🇭', voiceLang:'th-TH',  dir:'ltr' },
  km:     { name:'ខ្មែរ',        flag:'🇰🇭', voiceLang:'km-KH',  dir:'ltr' },
};

const STORAGE_KEY   = 'hlrace_lang';
const DEFAULT_LANG  = 'vi';

// ══════════════════════════════════════════════════════════════════
// CORE ENGINE
// ══════════════════════════════════════════════════════════════════
const HLi18n = {
  _lang: DEFAULT_LANG,
  _tts:  null,      // current utterance
  _speaking: false,

  // ── Khởi tạo ──────────────────────────────────────────────────
  init() {
    this._lang = this._detectLang();
    this._applyLang(this._lang, false);
    this._injectLangSwitcher();
    this._injectTTSButtons();
    this._observeDOM(); // watch dynamic content
    document.documentElement.lang = this._lang;
  },

  // ── Phát hiện ngôn ngữ ────────────────────────────────────────
  _detectLang() {
    // 1. localStorage (user đã chọn trước)
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && LANG_CONFIG[saved]) return saved;

    // 2. Browser language
    const browser = (navigator.language || navigator.userLanguage || '').toLowerCase();
    if (browser.startsWith('ja'))   return 'ja';
    if (browser.startsWith('ko'))   return 'ko';
    if (browser.startsWith('zh'))   return 'zh';
    if (browser.startsWith('th'))   return 'th_vn';
    if (browser.startsWith('km'))   return 'km';
    if (browser.startsWith('en'))   return 'en';
    return DEFAULT_LANG;
  },

  // ── Áp dụng ngôn ngữ ──────────────────────────────────────────
  _applyLang(lang, save = true) {
    this._lang = lang;
    if (save) localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
    document.documentElement.dir  = LANG_CONFIG[lang]?.dir || 'ltr';

    // Dịch tất cả element có data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const text = this.t(key);
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = text;
      } else if (el.tagName === 'IMG') {
        el.alt = text;
      } else {
        el.textContent = text;
      }
    });

    // Dịch placeholder riêng
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = this.t(el.getAttribute('data-i18n-placeholder'));
    });

    // Dịch aria-label
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      el.setAttribute('aria-label', this.t(el.getAttribute('data-i18n-aria')));
    });

    // Cập nhật lang switcher UI
    this._updateSwitcherUI(lang);

    // TTS: reset giọng đọc theo ngôn ngữ mới
    if (this._speaking) this.stopSpeech();

    // Dispatch event để các module khác biết
    window.dispatchEvent(new CustomEvent('hlrace:langchange', { detail: { lang } }));
  },

  // ── Lấy bản dịch ──────────────────────────────────────────────
  t(key, fallback) {
    const langData = TRANSLATIONS[this._lang] || {};
    // fallback: en → vi → key itself
    return langData[key]
      || TRANSLATIONS['en']?.[key]
      || TRANSLATIONS['vi']?.[key]
      || fallback
      || key;
  },

  // ── Inject Language Switcher vào trang ────────────────────────
  _injectLangSwitcher() {
    if (document.getElementById('hlrace-lang-switcher')) return;

    const css = `
      #hlrace-lang-switcher {
        position: fixed; bottom: 72px; right: 16px; z-index: 9998;
        display: flex; flex-direction: column; align-items: flex-end; gap: 6px;
      }
      #hlrace-lang-btn {
        width: 44px; height: 44px; border-radius: 50%;
        background: rgba(20,20,30,0.92); border: 1.5px solid rgba(255,255,255,0.15);
        cursor: pointer; font-size: 20px; display: flex; align-items: center;
        justify-content: center; backdrop-filter: blur(8px);
        box-shadow: 0 4px 16px rgba(0,0,0,0.4);
        transition: transform 0.2s, box-shadow 0.2s;
      }
      #hlrace-lang-btn:hover { transform: scale(1.08); box-shadow: 0 6px 20px rgba(0,0,0,0.5); }
      #hlrace-lang-menu {
        background: rgba(15,15,22,0.97); border: 1px solid rgba(255,255,255,0.1);
        border-radius: 12px; padding: 8px; min-width: 160px;
        backdrop-filter: blur(12px); box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        display: none; flex-direction: column; gap: 2px;
      }
      #hlrace-lang-menu.open { display: flex; }
      .hlrace-lang-opt {
        display: flex; align-items: center; gap: 10px;
        padding: 9px 12px; border-radius: 8px; cursor: pointer;
        font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.7);
        transition: background 0.15s, color 0.15s; border: none; background: none;
        text-align: left; width: 100%;
      }
      .hlrace-lang-opt:hover { background: rgba(255,255,255,0.08); color: #fff; }
      .hlrace-lang-opt.active { background: rgba(124,92,255,0.2); color: #B09FFF; }
      .hlrace-lang-opt .flag { font-size: 18px; width: 24px; text-align: center; }
    `;

    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    const wrap = document.createElement('div');
    wrap.id = 'hlrace-lang-switcher';

    const menu = document.createElement('div');
    menu.id = 'hlrace-lang-menu';

    Object.entries(LANG_CONFIG).forEach(([code, cfg]) => {
      const btn = document.createElement('button');
      btn.className = 'hlrace-lang-opt';
      btn.dataset.lang = code;
      btn.innerHTML = `<span class="flag">${cfg.flag}</span><span>${cfg.name}</span>`;
      btn.onclick = () => {
        this._applyLang(code);
        menu.classList.remove('open');
      };
      menu.appendChild(btn);
    });

    const trigger = document.createElement('button');
    trigger.id = 'hlrace-lang-btn';
    trigger.title = 'Chọn ngôn ngữ / Language';
    trigger.innerHTML = '🌐';
    trigger.onclick = (e) => {
      e.stopPropagation();
      menu.classList.toggle('open');
    };

    document.addEventListener('click', () => menu.classList.remove('open'));

    wrap.appendChild(menu);
    wrap.appendChild(trigger);
    document.body.appendChild(wrap);
  },

  _updateSwitcherUI(lang) {
    document.querySelectorAll('.hlrace-lang-opt').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    const trigger = document.getElementById('hlrace-lang-btn');
    if (trigger) trigger.innerHTML = LANG_CONFIG[lang]?.flag || '🌐';
  },

  // ══════════════════════════════════════════════════════════════
  // TEXT-TO-SPEECH ENGINE
  // ══════════════════════════════════════════════════════════════

  _isTTSSupported() {
    return 'speechSynthesis' in window;
  },

  // Inject nút loa vào các element có data-tts
  _injectTTSButtons() {
    if (!this._isTTSSupported()) return;

    const css = `
      .hlrace-tts-wrap { position: relative; display: inline; }
      .hlrace-tts-btn {
        display: inline-flex; align-items: center; justify-content: center;
        width: 22px; height: 22px; margin-left: 6px; border-radius: 50%;
        border: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.06);
        cursor: pointer; font-size: 11px; vertical-align: middle;
        transition: all 0.2s; opacity: 0.6;
        flex-shrink: 0;
      }
      .hlrace-tts-btn:hover { opacity: 1; background: rgba(124,92,255,0.25); border-color: rgba(124,92,255,0.5); transform: scale(1.1); }
      .hlrace-tts-btn.speaking { opacity: 1; background: rgba(255,92,53,0.25); border-color: #FF5C35; animation: tts-pulse 1s ease-in-out infinite; }
      @keyframes tts-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }

      /* FAB nút TTS toàn trang — cho người không biết chữ */
      #hlrace-tts-fab {
        position: fixed; bottom: 16px; right: 16px; z-index: 9999;
        width: 48px; height: 48px; border-radius: 50%;
        background: linear-gradient(135deg, #7C5CFF, #FF5C35);
        border: none; cursor: pointer; font-size: 22px;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 4px 20px rgba(124,92,255,0.5);
        transition: transform 0.2s, box-shadow 0.2s;
      }
      #hlrace-tts-fab:hover { transform: scale(1.1); box-shadow: 0 6px 28px rgba(124,92,255,0.7); }
      #hlrace-tts-fab.speaking { background: linear-gradient(135deg, #FF5C35, #FF4400); }
      #hlrace-tts-fab-tooltip {
        position: fixed; bottom: 72px; right: 16px; z-index: 9999;
        background: rgba(15,15,22,0.95); color: #fff; font-size: 11px;
        padding: 6px 12px; border-radius: 8px; pointer-events: none;
        opacity: 0; transition: opacity 0.2s; white-space: nowrap;
        border: 1px solid rgba(255,255,255,0.1);
      }
      #hlrace-tts-fab:hover + #hlrace-tts-fab-tooltip { opacity: 1; }

      /* Highlight text đang được đọc */
      .hlrace-tts-reading { background: rgba(255,208,96,0.2); border-radius: 3px;
        outline: 2px solid rgba(255,208,96,0.4); }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    // Thêm nút loa cạnh mỗi element có data-tts
    this._addTTSButtons();

    // FAB — nút đọc toàn trang (cho người không biết chữ)
    this._injectTTSFAB();
  },

  _addTTSButtons() {
    document.querySelectorAll('[data-tts]:not([data-tts-injected])').forEach(el => {
      el.setAttribute('data-tts-injected', '1');
      const btn = document.createElement('button');
      btn.className = 'hlrace-tts-btn';
      btn.innerHTML = '🔊';
      btn.title = this.t('listen.this');
      btn.setAttribute('aria-label', this.t('listen.this'));

      btn.onclick = (e) => {
        e.stopPropagation();
        const text = el.getAttribute('data-tts-text') || el.textContent.trim();
        if (btn.classList.contains('speaking')) {
          this.stopSpeech();
        } else {
          this._speakWithHighlight(text, btn, el);
        }
      };

      // Double-click trên element cũng kích hoạt
      el.addEventListener('dblclick', () => {
        const text = el.getAttribute('data-tts-text') || el.textContent.trim();
        this._speakWithHighlight(text, btn, el);
      });

      el.appendChild(btn);
    });
  },

  _injectTTSFAB() {
    if (document.getElementById('hlrace-tts-fab')) return;

    const fab = document.createElement('button');
    fab.id = 'hlrace-tts-fab';
    fab.innerHTML = '🔊';
    fab.title = 'Đọc toàn bộ trang / Read page aloud';

    const tooltip = document.createElement('div');
    tooltip.id = 'hlrace-tts-fab-tooltip';
    tooltip.textContent = 'Nhấn để nghe / Tap to listen';

    fab.onclick = () => {
      if (this._speaking) {
        this.stopSpeech();
        fab.innerHTML = '🔊';
        fab.classList.remove('speaking');
      } else {
        this._readPage(fab);
      }
    };

    document.body.appendChild(fab);
    document.body.appendChild(tooltip);
  },

  // ── Core TTS functions ─────────────────────────────────────────

  speak(text, onEnd) {
    if (!this._isTTSSupported() || !text.trim()) return;
    this.stopSpeech();

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang  = LANG_CONFIG[this._lang]?.voiceLang || 'vi-VN';
    utter.rate  = 0.95;
    utter.pitch = 1.0;
    utter.volume = 1.0;

    // Chọn voice phù hợp ngôn ngữ
    const voices = window.speechSynthesis.getVoices();
    const targetLang = utter.lang.split('-')[0];
    const match = voices.find(v => v.lang.startsWith(targetLang))
                || voices.find(v => v.lang.startsWith('vi'))
                || voices[0];
    if (match) utter.voice = match;

    utter.onstart = () => { this._speaking = true; };
    utter.onend   = () => { this._speaking = false; onEnd?.(); };
    utter.onerror = () => { this._speaking = false; onEnd?.(); };

    this._tts = utter;
    window.speechSynthesis.speak(utter);
  },

  stopSpeech() {
    window.speechSynthesis.cancel();
    this._speaking = false;
    this._tts = null;
    // Reset tất cả TTS button
    document.querySelectorAll('.hlrace-tts-btn.speaking').forEach(b => {
      b.classList.remove('speaking');
      b.innerHTML = '🔊';
    });
    document.querySelectorAll('.hlrace-tts-reading').forEach(el => {
      el.classList.remove('hlrace-tts-reading');
    });
    const fab = document.getElementById('hlrace-tts-fab');
    if (fab) { fab.innerHTML = '🔊'; fab.classList.remove('speaking'); }
  },

  _speakWithHighlight(text, btnEl, highlightEl) {
    this.stopSpeech();
    btnEl?.classList.add('speaking');
    btnEl && (btnEl.innerHTML = '⏹');
    highlightEl?.classList.add('hlrace-tts-reading');
    const fab = document.getElementById('hlrace-tts-fab');
    if (fab) { fab.innerHTML = '⏹'; fab.classList.add('speaking'); }

    this.speak(text, () => {
      btnEl?.classList.remove('speaking');
      btnEl && (btnEl.innerHTML = '🔊');
      highlightEl?.classList.remove('hlrace-tts-reading');
      if (fab) { fab.innerHTML = '🔊'; fab.classList.remove('speaking'); }
    });
  },

  // Đọc toàn bộ trang — gộp các text quan trọng
  _readPage(fabEl) {
    const selectors = [
      'h1', 'h2', 'h3',
      '[data-tts]',
      '.hero-title', '.page-title',
      '.card-title', '.section-title',
      'label', '.field-label',
      '.btn-primary', '.submit-btn',
      '.alert', '.error-msg', '.success-msg',
    ];

    const texts = [];
    const seen  = new Set();

    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        const text = el.getAttribute('data-tts-text') || el.textContent.trim();
        if (text && text.length > 2 && !seen.has(text)) {
          seen.add(text);
          texts.push(text);
        }
      });
    });

    if (!texts.length) return;

    fabEl.innerHTML = '⏹';
    fabEl.classList.add('speaking');
    this._speaking = true;

    // Đọc lần lượt
    let idx = 0;
    const readNext = () => {
      if (idx >= texts.length || !this._speaking) {
        this.stopSpeech();
        return;
      }
      const utter = new SpeechSynthesisUtterance(texts[idx++]);
      utter.lang  = LANG_CONFIG[this._lang]?.voiceLang || 'vi-VN';
      utter.rate  = 0.95;
      utter.pitch = 1.0;
      utter.onend   = readNext;
      utter.onerror = readNext;
      this._tts = utter;
      window.speechSynthesis.speak(utter);
    };
    readNext();
  },

  // ── MutationObserver — xử lý dynamic content ──────────────────
  _observeDOM() {
    const observer = new MutationObserver((mutations) => {
      let needsUpdate = false;
      mutations.forEach(m => {
        m.addedNodes.forEach(node => {
          if (node.nodeType === 1) needsUpdate = true;
        });
      });
      if (needsUpdate) {
        // Debounce 100ms
        clearTimeout(this._obsTimer);
        this._obsTimer = setTimeout(() => {
          this._addTTSButtons();
          // Re-apply translations cho các node mới
          document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const text = this.t(key);
            if (el.tagName !== 'INPUT' && el.tagName !== 'IMG') {
              el.textContent = text;
            }
          });
        }, 100);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  },

  // ── Public helpers ─────────────────────────────────────────────
  getCurrentLang() { return this._lang; },
  getLangConfig()  { return LANG_CONFIG[this._lang] || LANG_CONFIG['vi']; },
  setLang(code)    { this._applyLang(code); },
  addTranslations(lang, keys) {
    TRANSLATIONS[lang] = { ...(TRANSLATIONS[lang] || {}), ...keys };
  },
};

// Voices cần load async trên một số trình duyệt
if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {}; // trigger load
}

// Auto-init khi DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => HLi18n.init());
} else {
  HLi18n.init();
}

// Expose globally
window.HLi18n = HLi18n;

})(window);
