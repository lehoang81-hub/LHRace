// ═══════════════════════════════════════════════════════════════════
// HLRace Platform — Mock Data v3.0
// Schema v1.1 | UUID-ready | Consent-aware | Interoperable
// Hợp nhất mock-data.js (v1) + mock-data-v2.js
// HLRace Support: lehoang81@gmail.com | 0904 028 281
// ═══════════════════════════════════════════════════════════════════

// ─── UUID HELPER ──────────────────────────────────────────────────
// Production: generate UUID v4 thật. Test: dùng deterministic UUID
function genUUID(seed) {
  // Deterministic cho test — production dùng crypto.randomUUID()
  const h = (n) => n.toString(16).padStart(2,'0');
  const s = seed || Math.random();
  const b = Array.from({length:16}, (_,i) => Math.floor((s * (i+1) * 9301 + 49297) % 233280 / 233280 * 256));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  return `${h(b[0])}${h(b[1])}${h(b[2])}${h(b[3])}-${h(b[4])}${h(b[5])}-${h(b[6])}${h(b[7])}-${h(b[8])}${h(b[9])}-${h(b[10])}${h(b[11])}${h(b[12])}${h(b[13])}${h(b[14])}${h(b[15])}`;
}

// UUID map cố định để test cross-reference
const _UUID = {
  // Users
  U_KB1:  'a1000001-0000-4000-8000-000000000001',
  U_KB2:  'a1000002-0000-4000-8000-000000000002',
  U_KB3:  'a1000003-0000-4000-8000-000000000003',
  U_KB4:  'a1000004-0000-4000-8000-000000000004',
  U_KB5:  'a1000005-0000-4000-8000-000000000005',
  U_KB6:  'a1000006-0000-4000-8000-000000000006',
  U_KB7:  'a1000007-0000-4000-8000-000000000007',
  U_KB8:  'a1000008-0000-4000-8000-000000000008',
  U_KB9:  'a1000009-0000-4000-8000-000000000009',
  U_ADMIN:'a1000010-0000-4000-8000-000000000010',
  U_E11:  'a1000011-0000-4000-8000-000000000011',
  U_E12:  'a1000012-0000-4000-8000-000000000012',
  // Races
  R_SAPA:  'b2000001-0000-4000-8000-000000000001',
  R_HN21:  'b2000002-0000-4000-8000-000000000002',
  R_MUINE: 'b2000003-0000-4000-8000-000000000003',
  R_BACHMA:'b2000004-0000-4000-8000-000000000004',
  // Race đang chạy thật (giải 80 năm TDTT)
  R_TDTT:  'b2000005-0000-4000-8000-000000000005',
  // Orgs
  O_VIET:  'c3000001-0000-4000-8000-000000000001',
  O_HN:    'c3000002-0000-4000-8000-000000000002',
  O_COAST: 'c3000003-0000-4000-8000-000000000003',
  O_CEN:   'c3000004-0000-4000-8000-000000000004',
};

// ═══════════════════════════════════════════════════════════════════
// PLATFORM INFO
// ═══════════════════════════════════════════════════════════════════
const HLRACE_INFO = {
  name:    'HLRace',
  tagline: 'Hạ tầng kết nối cộng đồng chạy bộ Việt Nam',
  contact: {
    email: 'lehoang81@gmail.com',
    phone: '0904 028 281',
  },
  domain:  'app.netlify.app', // pending: hlrace.vn | happylongrace.vn
  version: '3.0',
  schemaVersion: '1.1',
};

// ═══════════════════════════════════════════════════════════════════
// RACES — 5 race (4 HLRace vision + 1 race thật đang chạy)
// ═══════════════════════════════════════════════════════════════════
const MOCK_RACES = [
  // ── Race 1: Sapa 100 (trail khó, race tương lai) ──
  {
    raceId:   _UUID.R_SAPA,
    raceSlug: 'RACE-TRAIL-SAPA100-2026',
    raceName: 'Sapa 100 Ultra Trail 2026',
    raceType: 'trail',
    organizerId: _UUID.O_VIET,
    orgSlug:  'ORG-VIETRACE',

    location: {
      province: 'Lào Cai', district: 'Sa Pa',
      display:  'Sapa, Lào Cai',
      startPoint: { name:'Sân vận động Sapa', lat:22.3361, lng:103.8438, elevation:1550 },
      finishPoint:{ name:'Khu du lịch Cát Cát', lat:22.3198, lng:103.8412, elevation:1320 },
    },

    schedule: {
      raceDate:              '2026-05-25',
      raceDateISO:           '2026-05-25T04:00:00+07:00',
      raceDateDisplay:       '25/05/2026',
      registrationDeadline:  '2026-04-30',
      bibTransferDeadline:   '2026-05-10',
    },

    distances: [
      {km:100, name:'100K', cutoffHours:32, elevationGain:7200, price:1800000, priceDisplay:'1.800.000đ'},
      {km:50,  name:'50K',  cutoffHours:18, elevationGain:3600, price:1200000, priceDisplay:'1.200.000đ'},
      {km:25,  name:'25K',  cutoffHours:9,  elevationGain:1800, price:800000,  priceDisplay:'800.000đ'},
    ],
    maxParticipants: 500, currentRegistered: 387, status: 'open',

    terrain: {
      terrainTypes: ['trail','technical','river','rocky','mud'],
      difficultyLevel: 5,
      elevationProfile: 'extreme',
      nightRunning: true,
      weatherTypical: 'Sương mù dày đặc buổi sáng, mưa chiều. 12-22°C.',
      technicalSections: 'Km 35-42: vách đá 70 độ. Km 65: lội suối sâu. Km 88-95: đường mòn hẹp 40cm.',
      checkpoints: [
        { cpId:'CP1-BANHO-KM20', name:'CP1 — Bản Hồ', km:20, lat:22.2847, lng:103.9124, metaverseNodeId:null,
          items:['water','electrolyte','banana','salt','rice'] },
        { cpId:'CP2-TAVAN-KM40', name:'CP2 — Tả Van', km:40, lat:22.2614, lng:103.9256, metaverseNodeId:null,
          items:['water','electrolyte','gel','banana','broth','rice'] },
        { cpId:'CP3-LAOCHAI-KM60', name:'CP3 — Lao Chải', km:60, lat:22.2501, lng:103.9380, metaverseNodeId:null,
          items:['water','electrolyte','banana','rice','hot_food'] },
        { cpId:'CP4-SEOMYTU-KM80', name:'CP4 — Séo Mý Tỷ', km:80, lat:22.2388, lng:103.9512, metaverseNodeId:null,
          items:['water','electrolyte','gel','banana','broth','hot_food'] },
      ],
    },

    logistics: {
      startFinishSame:false, gearCheckIn:true, shuttleBus:'provided',
      shuttleDetail:'Xe từ Hà Nội (Mỹ Đình) 20h ngày 24/5. Về 18h ngày 25/5. Phí 200k/chiều.',
      parkingAvailable:true,
      finishLineFoodDetail:'Phở bò Sapa + thắng cố đặc sản. Miễn phí VĐV + 1 người nhà.',
      medicalTeamSize:12, ambulanceCount:3, insuranceIncluded:true,
    },

    policy: {
      bibTransferAllowed:true, refundPolicy:'partial',
      mandatoryGear:['headlamp','whistle','space_blanket','first_aid','phone','rain_jacket'],
    },

    hlraceMeta: {
      hlraceVerified:true, hlraceReviewScore:4.7, hlraceReviewCount:89,
      hlraceAINote:'Race độ khó cao, BTC 4 năm kinh nghiệm. Phù hợp runner trail 50K+. Gear list nghiêm ngặt.',
    },
    uniqueFeatures: 'Đường chạy qua 5 bản dân tộc. Ruộng bậc thang km 30-35.',
    createdAt:'2025-12-01T00:00:00Z', updatedAt:'2026-03-15T00:00:00Z',
  },

  // ── Race 2: HN Half Marathon ──
  {
    raceId: _UUID.R_HN21, raceSlug:'RACE-ROAD-HN21-2026',
    raceName:'Hà Nội Half Marathon 2026', raceType:'road', organizerId:_UUID.O_HN,
    location:{ province:'Hà Nội', display:'Hà Nội — Hồ Hoàn Kiếm',
      startPoint:{ name:'Quảng trường Đông Kinh Nghĩa Thục', lat:21.0285, lng:105.8542 } },
    schedule:{ raceDate:'2026-05-31', raceDateISO:'2026-05-31T05:30:00+07:00', raceDateDisplay:'31/05/2026',
      registrationDeadline:'2026-05-20', bibTransferDeadline:'2026-05-18' },
    distances:[
      {km:21.1, name:'21K', cutoffHours:3,   price:450000, priceDisplay:'450.000đ'},
      {km:10,   name:'10K', cutoffHours:2,   price:300000, priceDisplay:'300.000đ'},
      {km:5,    name:'5K',  cutoffHours:1.5, price:200000, priceDisplay:'200.000đ'},
    ],
    maxParticipants:3000, currentRegistered:2156, status:'open',
    terrain:{ terrainTypes:['road'], difficultyLevel:2, elevationProfile:'flat', nightRunning:false,
      checkpoints:[] },
    policy:{ bibTransferAllowed:true, refundPolicy:'none', mandatoryGear:[] },
    hlraceMeta:{ hlraceVerified:true, hlraceReviewScore:4.3, hlraceReviewCount:234,
      hlraceAINote:'Race phổ biến. Đến sớm 45 phút. Đường chạy qua 36 phố phường Hà Nội cổ.' },
    uniqueFeatures:'Finisher medal đúc đồng hình Khuê Văn Các.',
    createdAt:'2026-01-01T00:00:00Z', updatedAt:'2026-03-01T00:00:00Z',
  },

  // ── Race 3: Mũi Né Trail ──
  {
    raceId:_UUID.R_MUINE, raceSlug:'RACE-TRAIL-MUINE30-2026',
    raceName:'Mũi Né Trail 30K', raceType:'trail', organizerId:_UUID.O_COAST,
    location:{ province:'Bình Thuận', display:'Mũi Né, Phan Thiết',
      startPoint:{ name:'Bãi biển Mũi Né', lat:10.9430, lng:108.2839 } },
    schedule:{ raceDate:'2026-06-14', raceDateISO:'2026-06-14T05:00:00+07:00', raceDateDisplay:'14/06/2026',
      registrationDeadline:'2026-06-01' },
    distances:[
      {km:30, name:'30K', cutoffHours:7, price:650000, priceDisplay:'650.000đ'},
      {km:15, name:'15K', cutoffHours:4, price:450000, priceDisplay:'450.000đ'},
    ],
    maxParticipants:200, currentRegistered:134, status:'open',
    terrain:{ terrainTypes:['trail','sand','road'], difficultyLevel:2, elevationProfile:'rolling',
      nightRunning:false, checkpoints:[] },
    policy:{ bibTransferAllowed:true, refundPolicy:'partial', mandatoryGear:['water_bottle'],
      petAllowed:true, petDetail:'Cho phép chó tại 15K, phải đeo dây dắt.' },
    hlraceMeta:{ hlraceVerified:true, hlraceReviewScore:4.5, hlraceReviewCount:47,
      hlraceAINote:'Trail thân thiện người mới, view đẹp. Phù hợp 10K road runner thử trail lần đầu.' },
    uniqueFeatures:'Đường chạy qua đồi cát đỏ + bãi biển. Tắm biển sau race. Hải sản nướng.',
    createdAt:'2026-02-01T00:00:00Z', updatedAt:'2026-03-01T00:00:00Z',
  },

  // ── Race 4: Bạch Mã ──
  {
    raceId:_UUID.R_BACHMA, raceSlug:'RACE-TRAIL-BACHMA50-2026',
    raceName:'Bạch Mã Mountain Run 50K', raceType:'trail', organizerId:_UUID.O_CEN,
    location:{ province:'Thừa Thiên Huế', display:'VQG Bạch Mã, Thừa Thiên Huế',
      startPoint:{ name:'Cổng VQG Bạch Mã', lat:16.1833, lng:107.8500 } },
    schedule:{ raceDate:'2026-06-28', raceDateISO:'2026-06-28T05:00:00+07:00', raceDateDisplay:'28/06/2026',
      registrationDeadline:'2026-06-10' },
    distances:[
      {km:50, name:'50K', cutoffHours:14, price:950000, priceDisplay:'950.000đ'},
      {km:25, name:'25K', cutoffHours:8,  price:650000, priceDisplay:'650.000đ'},
    ],
    maxParticipants:300, currentRegistered:89, status:'open',
    terrain:{ terrainTypes:['trail','technical','river','rocky'], difficultyLevel:4,
      elevationProfile:'mountainous', nightRunning:false, checkpoints:[] },
    policy:{ bibTransferAllowed:false, refundPolicy:'none',
      mandatoryGear:['headlamp','rain_jacket','first_aid','phone'] },
    hlraceMeta:{ hlraceVerified:false, hlraceReviewScore:null, hlraceReviewCount:0,
      hlraceAINote:'BTC mới tổ chức lần đầu — thông tin còn thiếu. HLRace đang liên hệ. Cân nhắc kỹ.' },
    uniqueFeatures:'Chạy qua thác Đỗ Quyên cao nhất VN. Rừng nguyên sinh.',
    createdAt:'2026-02-15T00:00:00Z', updatedAt:'2026-03-01T00:00:00Z',
  },

  // ── Race 5: Giải thật — 80 năm TDTT (dùng cho Nhóm 1 core) ──
  {
    raceId:   _UUID.R_TDTT,
    raceSlug: 'RACE-TDTT-2026',
    raceName: 'Giải Chạy Chào Mừng 80 Năm Ngành TDTT Việt Nam',
    raceType: 'road',
    organizerId: _UUID.O_HN,
    location: {
      province:'Hà Nội', display:'Vườn hoa Đền Bà Kiệu, Hoàn Kiếm',
      startPoint:{ name:'Vườn hoa Đền Bà Kiệu', lat:21.0333, lng:105.8500 },
    },
    schedule:{
      raceDate:'2026-03-21', raceDateISO:'2026-03-21T05:30:00+07:00', raceDateDisplay:'21/03/2026',
      registrationDeadline:'2026-03-15',
    },
    distances:[
      {km:1.5, name:'1.5km', cutoffHours:1,   price:50000,  priceDisplay:'50.000đ', desc:'Gia đình'},
      {km:3,   name:'3km',   cutoffHours:1,   price:80000,  priceDisplay:'80.000đ'},
      {km:5,   name:'5km',   cutoffHours:1.5, price:120000, priceDisplay:'120.000đ'},
    ],
    maxParticipants:1000, currentRegistered:847, status:'completed',
    terrain:{ terrainTypes:['road'], difficultyLevel:1, elevationProfile:'flat', nightRunning:false, checkpoints:[] },
    policy:{ bibTransferAllowed:false, refundPolicy:'none', mandatoryGear:[] },
    hlraceMeta:{ hlraceVerified:true, hlraceReviewScore:4.5, hlraceReviewCount:45, hlraceAINote:'' },
    sponsor:{ name:'PHỞ ĐỆ NHẤT — Acecook Vietnam', logo:'🍜', offer:'Nhận 1 tô phở miễn phí khi đeo BIB' },
    createdAt:'2026-02-01T00:00:00Z', updatedAt:'2026-03-22T00:00:00Z',
  },
];

// ═══════════════════════════════════════════════════════════════════
// ORGANIZERS
// ═══════════════════════════════════════════════════════════════════
const MOCK_ORGANIZERS = [
  { orgId:_UUID.O_VIET, orgSlug:'ORG-VIETRACE', orgName:'VietRace Events',
    contactName:'Nguyễn Thanh Bình', phone:'0901234567', email:'info@vietrace.vn',
    racesOrganized:12, yearsActive:5, hlracePartner:true, trustScore:4.8 },
  { orgId:_UUID.O_HN, orgSlug:'ORG-HANOIRUN', orgName:'Hanoi Running Club',
    contactName:'Trần Văn Đức', phone:'0912345678',
    racesOrganized:8, yearsActive:3, hlracePartner:true, trustScore:4.3 },
  { orgId:_UUID.O_COAST, orgSlug:'ORG-COASTRUN', orgName:'Coast Run Vietnam',
    contactName:'Lê Thị Mai', phone:'0923456789',
    racesOrganized:4, yearsActive:2, hlracePartner:true, trustScore:4.5 },
  { orgId:_UUID.O_CEN, orgSlug:'ORG-CENTRALRUN', orgName:'Central Highland Run',
    phone:'0934567890', racesOrganized:1, yearsActive:1, hlracePartner:false, trustScore:null },
];

// ═══════════════════════════════════════════════════════════════════
// USERS — 12 users đa dạng kịch bản, schema v1.1
// ═══════════════════════════════════════════════════════════════════
const MOCK_USERS = [
  // KB1 — Người mới, chưa unlock
  {
    userId: _UUID.U_KB1, userAlias:'U-KB1-NEWBIE',
    fullName:'Trần Văn Hùng', phone:'0901111001', gender:'Nam',
    city:'Hà Nội', dob:'1995-03-15', shirtSize:'M',
    email:'hung.newbie@gmail.com', role:'runner',
    consent_shared:{ publicProfile:true, raceHistory:true, gearList:false,
      meritPoints:true, metaverseData:false, thirdPartyIntegration:false,
      analyticsAnonymous:true, consentVersion:'1.0', consentUpdatedAt:'2026-01-10T09:00:00Z' },
    stats:{ totalRaces:1, totalDistanceKm:10, totalPointsEver:10, currentBalance:10 },
    runnerProfile:{ unlockLevel:0, runningType:'road', currentPace:'6:30', targetDistance:'10k',
      runningFrequency:2, runningGoal:'finish', homeArea:'Cầu Giấy, Hà Nội',
      transportMode:'need_ride', lookingFor:[], trustScore:null },
    metaverse:{ walletAddress:null, nftTokenIds:[], metaverseAvatarId:null, npcStoryUnlocked:false },
    createdAt:'2026-01-10T09:00:00Z', updatedAt:'2026-01-10T09:00:00Z',
    // Compat dùng cho Runner Connect UI
    tags:['10K','Beginner','Hà Nội'], bio:'Runner mới 1 năm. Muốn thử trail lần đầu.', online:true, compat:72,
  },
  // KB2 — Lender, cho mượn gear
  {
    userId:_UUID.U_KB2, userAlias:'U-KB2-LENDER',
    fullName:'Nguyễn Minh Khoa', phone:'0901111002', gender:'Nam',
    city:'Hà Nội', dob:'1988-07-22', shirtSize:'L',
    email:'khoa.lender@gmail.com', role:'runner',
    consent_shared:{ publicProfile:true, raceHistory:true, gearList:true,
      meritPoints:true, metaverseData:true, thirdPartyIntegration:true,
      analyticsAnonymous:true, consentVersion:'1.0', consentUpdatedAt:'2026-02-01T00:00:00Z' },
    stats:{ totalRaces:8, totalDistanceKm:385, totalPointsEver:340, currentBalance:340 },
    runnerProfile:{ unlockLevel:2, runningType:'trail', currentPace:'5:20', targetDistance:'100k',
      runningFrequency:5, runningGoal:'pb', homeArea:'Tây Hồ, Hà Nội',
      transportMode:'can_share', rideShareArea:'Hà Nội → Sapa, đón thêm 2 người',
      mentorAreas:['gear','trail_specific','nutrition'], trustScore:4.8,
      lookingFor:[] },
    metaverse:{ walletAddress:null, nftTokenIds:[], metaverseAvatarId:null, npcStoryUnlocked:true },
    createdAt:'2025-06-15T00:00:00Z', updatedAt:'2026-03-01T00:00:00Z',
    tags:['Trail','100K','Gear Master'], bio:'Trail runner 8 năm. Gear cho mượn. Có xe đi Sapa.',
    online:true, compat:88,
  },
  // KB3 — Bỏ BIB, tặng từ thiện
  {
    userId:_UUID.U_KB3, userAlias:'U-KB3-BIBDROP',
    fullName:'Lê Thị Phương', phone:'0901111003', gender:'Nữ',
    city:'TP.HCM', dob:'1992-11-08', shirtSize:'S',
    email:'phuong.drop@gmail.com', role:'runner',
    consent_shared:{ publicProfile:true, raceHistory:true, gearList:false,
      meritPoints:true, metaverseData:false, thirdPartyIntegration:false,
      analyticsAnonymous:true, consentVersion:'1.0', consentUpdatedAt:'2026-01-01T00:00:00Z' },
    stats:{ totalRaces:3, totalDistanceKm:65, totalPointsEver:85, currentBalance:85 },
    runnerProfile:{ unlockLevel:1, runningType:'both', currentPace:'6:00', targetDistance:'21k',
      runningFrequency:3, runningGoal:'experience', homeArea:'Quận 7, TP.HCM',
      transportMode:'own', trustScore:4.2, lookingFor:[] },
    metaverse:{ walletAddress:null, nftTokenIds:[], metaverseAvatarId:null, npcStoryUnlocked:false },
    createdAt:'2025-09-01T00:00:00Z', updatedAt:'2026-04-15T00:00:00Z',
    tags:['Road','21K','TP.HCM'], bio:'Chạy để trải nghiệm. Tặng BIB khi không thể dự.', online:false, compat:60,
  },
  // KB4 — TNV
  {
    userId:_UUID.U_KB4, userAlias:'U-KB4-VOLUNTEER',
    fullName:'Phạm Đức Long', phone:'0901111004', gender:'Nam',
    city:'Hà Nội', dob:'1990-04-30', shirtSize:'XL',
    email:'long.volunteer@gmail.com', role:'runner',
    consent_shared:{ publicProfile:true, raceHistory:true, gearList:true,
      meritPoints:true, metaverseData:true, thirdPartyIntegration:true,
      analyticsAnonymous:true, consentVersion:'1.0', consentUpdatedAt:'2025-03-01T00:00:00Z' },
    stats:{ totalRaces:12, totalDistanceKm:680, totalPointsEver:580, currentBalance:530 },
    runnerProfile:{ unlockLevel:3, runningType:'trail', currentPace:'5:00', targetDistance:'100k',
      runningFrequency:6, runningGoal:'experience', homeArea:'Hoàn Kiếm, Hà Nội',
      transportMode:'can_share', rideShareArea:'Hà Nội → mọi race, xe 7 chỗ',
      mentorAreas:['first_timer','trail_specific','gear','training'],
      communityRole:'volunteer', trustScore:5.0, lookingFor:[] },
    metaverse:{ walletAddress:null, nftTokenIds:[], metaverseAvatarId:null, npcStoryUnlocked:true },
    createdAt:'2025-03-01T00:00:00Z', updatedAt:'2026-03-01T00:00:00Z',
    tags:['Trail','TNV','Mentor','100K'], bio:'Pacer chuyên nghiệp + TNV. Xe 7 chỗ đi mọi race.', online:true, compat:91,
  },
  // KB5 — BTC
  {
    userId:_UUID.U_KB5, userAlias:'U-KB5-BTC',
    fullName:'Vũ Thanh Hương', phone:'0901111005', gender:'Nữ',
    city:'Đà Nẵng', dob:'1985-08-12', shirtSize:'M',
    email:'huong.btc@centralrun.vn', role:'organizer', orgId:_UUID.O_CEN,
    consent_shared:{ publicProfile:true, raceHistory:false, gearList:false,
      meritPoints:false, metaverseData:false, thirdPartyIntegration:false,
      analyticsAnonymous:true, consentVersion:'1.0', consentUpdatedAt:'2026-02-01T00:00:00Z' },
    stats:{ totalRaces:0, totalDistanceKm:0, totalPointsEver:0, currentBalance:0 },
    runnerProfile:{ unlockLevel:0 },
    metaverse:{ walletAddress:null, nftTokenIds:[], metaverseAvatarId:null, npcStoryUnlocked:false },
    createdAt:'2026-02-01T00:00:00Z', updatedAt:'2026-02-01T00:00:00Z',
    tags:['BTC','Đà Nẵng'], bio:'Ban tổ chức Central Highland Run.', online:false, compat:0,
  },
  // KB6 — Core community
  {
    userId:_UUID.U_KB6, userAlias:'U-KB6-CORE',
    fullName:'Đặng Văn Sơn', phone:'0901111006', gender:'Nam',
    city:'Hà Nội', dob:'1986-02-18', shirtSize:'M',
    email:'son.core@gmail.com', role:'runner',
    consent_shared:{ publicProfile:true, raceHistory:true, gearList:true,
      meritPoints:true, metaverseData:true, thirdPartyIntegration:true,
      analyticsAnonymous:true, consentVersion:'1.0', consentUpdatedAt:'2024-01-01T00:00:00Z' },
    stats:{ totalRaces:24, totalDistanceKm:1850, totalPointsEver:1250, currentBalance:1250 },
    runnerProfile:{ unlockLevel:3, runningType:'trail', currentPace:'4:45', targetDistance:'100m+',
      runningFrequency:7, runningGoal:'pb', homeArea:'Ba Đình, Hà Nội',
      transportMode:'own', mentorAreas:['gear','training','nutrition','trail_specific','first_timer'],
      communityRole:'coach', trustScore:4.9, lookingFor:[] },
    metaverse:{ walletAddress:null, nftTokenIds:[], metaverseAvatarId:null, npcStoryUnlocked:true },
    createdAt:'2024-01-01T00:00:00Z', updatedAt:'2026-03-01T00:00:00Z',
    tags:['Trail','Elite','Coach','100K+'], bio:'24 race. Coach không chính thức. PB 100K: 20h.', online:true, compat:95,
  },
  // KB7 — Tìm pace partner
  {
    userId:_UUID.U_KB7, userAlias:'U-KB7-MATCH',
    fullName:'Ngô Thị Lan', phone:'0901111007', gender:'Nữ',
    city:'Hà Nội', dob:'1993-06-25', shirtSize:'S',
    email:'lan.match@gmail.com', role:'runner',
    consent_shared:{ publicProfile:true, raceHistory:true, gearList:true,
      meritPoints:true, metaverseData:false, thirdPartyIntegration:false,
      analyticsAnonymous:true, consentVersion:'1.0', consentUpdatedAt:'2025-08-10T00:00:00Z' },
    stats:{ totalRaces:5, totalDistanceKm:175, totalPointsEver:165, currentBalance:165 },
    runnerProfile:{ unlockLevel:2, runningType:'trail', currentPace:'6:10', targetDistance:'50k',
      runningFrequency:4, runningGoal:'experience', homeArea:'Đống Đa, Hà Nội',
      transportMode:'need_ride', lookingFor:['carpool','roomshare','pace_partner'],
      trustScore:4.5 },
    metaverse:{ walletAddress:null, nftTokenIds:[], metaverseAvatarId:null, npcStoryUnlocked:false },
    createdAt:'2025-08-10T00:00:00Z', updatedAt:'2026-03-05T00:00:00Z',
    tags:['Trail','50K','Cần đi chung xe'], bio:'Trail 5 race. Đang tìm bạn cùng pace 7-8 phút/km.', online:true, compat:84,
  },
  // KB8 — Hỏi AI
  {
    userId:_UUID.U_KB8, userAlias:'U-KB8-ASKAI',
    fullName:'Hoàng Minh Tú', phone:'0901111008', gender:'Nam',
    city:'Hà Nội', dob:'1991-09-14', shirtSize:'M',
    email:'tu.askai@gmail.com', role:'runner',
    consent_shared:{ publicProfile:true, raceHistory:true, gearList:false,
      meritPoints:true, metaverseData:false, thirdPartyIntegration:false,
      analyticsAnonymous:true, consentVersion:'1.0', consentUpdatedAt:'2025-11-01T00:00:00Z' },
    stats:{ totalRaces:2, totalDistanceKm:20, totalPointsEver:30, currentBalance:30 },
    runnerProfile:{ unlockLevel:0, runningType:'road', currentPace:'5:50', targetDistance:'50k',
      runningFrequency:3, runningGoal:'experience', homeArea:'Cầu Giấy, Hà Nội',
      transportMode:'need_ride', lookingFor:['mentor','gear_lend'] },
    metaverse:{ walletAddress:null, nftTokenIds:[], metaverseAvatarId:null, npcStoryUnlocked:false },
    createdAt:'2025-11-01T00:00:00Z', updatedAt:'2026-03-25T00:00:00Z',
    tags:['Road→Trail','2 race','Gear cần mượn'], bio:'Road runner, mơ trail 50K. Cần gear và mentor.', online:false, compat:68,
  },
  // KB9 — BTC nhận review
  {
    userId:_UUID.U_KB9, userAlias:'U-KB9-BTCREVIEW',
    fullName:'Trịnh Xuân Thành', phone:'0901111009', gender:'Nam',
    city:'Hà Nội', role:'organizer', orgId:_UUID.O_VIET,
    consent_shared:{ publicProfile:true, raceHistory:false, gearList:false,
      meritPoints:false, metaverseData:false, thirdPartyIntegration:false,
      analyticsAnonymous:true, consentVersion:'1.0', consentUpdatedAt:'2026-01-01T00:00:00Z' },
    stats:{ totalRaces:0, totalDistanceKm:0, totalPointsEver:0, currentBalance:0 },
    runnerProfile:{ unlockLevel:0 },
    metaverse:{ walletAddress:null, nftTokenIds:[], metaverseAvatarId:null, npcStoryUnlocked:false },
    createdAt:'2026-01-01T00:00:00Z', updatedAt:'2026-01-01T00:00:00Z',
    tags:['BTC','VietRace'], bio:'Ban tổ chức VietRace Events.', online:false, compat:0,
  },
  // KB10 — Admin HLRace
  {
    userId:_UUID.U_ADMIN, userAlias:'U-ADMIN-LEHOANG',
    fullName:'Lê Hoàng', phone:'0904028281',
    email:'lehoang81@gmail.com', role:'admin',
    consent_shared:{ publicProfile:true, raceHistory:true, gearList:false,
      meritPoints:true, metaverseData:true, thirdPartyIntegration:true,
      analyticsAnonymous:true, consentVersion:'1.0', consentUpdatedAt:'2026-01-01T00:00:00Z' },
    stats:{ totalRaces:15, totalDistanceKm:420, totalPointsEver:800, currentBalance:800 },
    runnerProfile:{ unlockLevel:3 },
    metaverse:{ walletAddress:null, nftTokenIds:[], metaverseAvatarId:null, npcStoryUnlocked:false },
    createdAt:'2024-01-01T00:00:00Z', updatedAt:'2026-03-01T00:00:00Z',
    tags:['Admin','HLRace'], bio:'Founder HLRace. Runner 15 race.', online:true, compat:0,
  },
  // Extra users
  {
    userId:_UUID.U_E11, userAlias:'U-EXTRA-QUAN',
    fullName:'Bùi Văn Quân', phone:'0901111011', gender:'Nam',
    city:'Hà Nội', dob:'1989-12-03', shirtSize:'L',
    consent_shared:{ publicProfile:true, raceHistory:true, gearList:false,
      meritPoints:true, metaverseData:false, thirdPartyIntegration:false,
      analyticsAnonymous:true, consentVersion:'1.0', consentUpdatedAt:'2026-01-01T00:00:00Z' },
    stats:{ totalRaces:6, totalDistanceKm:120, totalPointsEver:220, currentBalance:220 },
    runnerProfile:{ unlockLevel:2, runningType:'road', currentPace:'5:40', targetDistance:'21k',
      runningFrequency:4, transportMode:'own', lookingFor:[] },
    metaverse:{ walletAddress:null, nftTokenIds:[], metaverseAvatarId:null, npcStoryUnlocked:false },
    createdAt:'2026-01-01T00:00:00Z', updatedAt:'2026-01-01T00:00:00Z',
    tags:['Road','21K'], bio:'Chạy road 6 race. Muốn thử trail.', online:false, compat:75,
  },
  {
    userId:_UUID.U_E12, userAlias:'U-EXTRA-HOA',
    fullName:'Đinh Thị Hoa', phone:'0901111012', gender:'Nữ',
    city:'Hà Nội', dob:'1994-05-17', shirtSize:'XS',
    consent_shared:{ publicProfile:true, raceHistory:true, gearList:false,
      meritPoints:true, metaverseData:false, thirdPartyIntegration:false,
      analyticsAnonymous:true, consentVersion:'1.0', consentUpdatedAt:'2026-01-01T00:00:00Z' },
    stats:{ totalRaces:4, totalDistanceKm:65, totalPointsEver:120, currentBalance:120 },
    runnerProfile:{ unlockLevel:1, runningType:'road', currentPace:'6:20', targetDistance:'21k',
      runningFrequency:3, transportMode:'own', lookingFor:['pace_partner'] },
    metaverse:{ walletAddress:null, nftTokenIds:[], metaverseAvatarId:null, npcStoryUnlocked:false },
    createdAt:'2026-01-01T00:00:00Z', updatedAt:'2026-01-01T00:00:00Z',
    tags:['Road','10K→21K','Nữ'], bio:'Runner nhỏ người, chạy chậm nhưng đều.', online:true, compat:79,
  },
];

// ═══════════════════════════════════════════════════════════════════
// BIBs — với result chuẩn ISO 8601 + ranking
// ═══════════════════════════════════════════════════════════════════
const MOCK_BIBS = [
  // KB2 — 100K Sapa (đã hoàn thành race trước)
  {
    bibId: 'f7a3b291-2c4d-4e5f-8a9b-1c2d3e4f0001',
    bibNumber: '100K-042',
    raceId: _UUID.R_SAPA, raceSlug:'RACE-TRAIL-SAPA100-2026',
    currentOwnerId: _UUID.U_KB2,
    distance:'100K', distanceKm:100,
    status:'approved', checkedIn:false,
    result: null, // chưa chạy
    transferHistory:[
      { transferId:'TH-001', fromUserId:null, toUserId:_UUID.U_KB2,
        transferType:'initial', timestamp:'2026-02-15T10:00:00Z', txHash:null, note:'Đăng ký ban đầu' }
    ],
    nftMetadata:{
      tokenId:'f7a3b291-2c4d-4e5f-8a9b-1c2d3e4f0001',
      name:'BIB #042 — Sapa 100 Ultra Trail 2026',
      attributes:[
        {trait_type:'Race',value:'Sapa 100 Ultra Trail'},
        {trait_type:'Distance',value:'100K'},{trait_type:'Year',value:'2026'},
        {trait_type:'Province',value:'Lào Cai'}
      ]
    },
    createdAt:'2026-02-15T10:00:00Z', updatedAt:'2026-02-15T10:00:00Z',
  },

  // KB6 — 100K Sapa kịch bản đã hoàn thành (kịch bản từ race 2025)
  {
    bibId: 'f7a3b291-2c4d-4e5f-8a9b-1c2d3e4f0002',
    bibNumber: '100K-007',
    raceId: _UUID.R_SAPA, raceSlug:'RACE-TRAIL-SAPA100-2026',
    currentOwnerId: _UUID.U_KB6,
    distance:'100K', distanceKm:100,
    status:'approved', checkedIn:false,
    result: null,
    transferHistory:[
      { transferId:'TH-002', fromUserId:null, toUserId:_UUID.U_KB6,
        transferType:'initial', timestamp:'2025-12-20T10:00:00Z', txHash:null, note:'Đăng ký sớm' }
    ],
    nftMetadata:{
      tokenId:'f7a3b291-2c4d-4e5f-8a9b-1c2d3e4f0002',
      name:'BIB #007 — Sapa 100 Ultra Trail 2026',
      attributes:[
        {trait_type:'Race',value:'Sapa 100 Ultra Trail'},{trait_type:'Distance',value:'100K'},
        {trait_type:'Year',value:'2026'},{trait_type:'Province',value:'Lào Cai'}
      ]
    },
    createdAt:'2025-12-20T10:00:00Z', updatedAt:'2025-12-20T10:00:00Z',
  },

  // KB3 — BIB tặng từ thiện
  {
    bibId: 'f7a3b291-2c4d-4e5f-8a9b-1c2d3e4f0003',
    bibNumber: '25K-031',
    raceId: _UUID.R_SAPA, raceSlug:'RACE-TRAIL-SAPA100-2026',
    currentOwnerId: null, // đã tặng, không còn chủ cá nhân
    distance:'25K', distanceKm:25,
    status:'charity',
    checkedIn:false,
    result: null,
    transferHistory:[
      { transferId:'TH-003', fromUserId:null, toUserId:_UUID.U_KB3,
        transferType:'initial', timestamp:'2026-02-28T10:00:00Z', txHash:null },
      { transferId:'TH-004', fromUserId:_UUID.U_KB3, toUserId:null,
        transferType:'charity_donation', timestamp:'2026-04-15T08:00:00Z', txHash:null,
        charityFund:'HLRace Charity Fund', charityAmount:400000, note:'Tặng BIB — lý do gia đình' }
    ],
    nftMetadata:{
      tokenId:'f7a3b291-2c4d-4e5f-8a9b-1c2d3e4f0003',
      name:'BIB #031 — Sapa 25K · Charity Edition',
      attributes:[
        {trait_type:'Race',value:'Sapa 100 Ultra Trail'},{trait_type:'Distance',value:'25K'},
        {trait_type:'Type',value:'Charity Donation'},{trait_type:'Year',value:'2026'}
      ]
    },
    createdAt:'2026-02-28T10:00:00Z', updatedAt:'2026-04-15T08:00:00Z',
  },

  // KB race TDTT — VĐV thật với result đầy đủ
  {
    bibId: 'f7a3b291-2c4d-4e5f-8a9b-1c2d3e4f0010',
    bibNumber: '5K-001',
    raceId: _UUID.R_TDTT,
    currentOwnerId: _UUID.U_E11,
    distance:'5K', distanceKm:5,
    status:'completed', checkedIn:true,
    result:{
      finishTimeISO:'2026-03-21T07:28:45+07:00',
      finishTimeElapsed:'PT28M45S',
      finishTimeDisplay:'28:45',
      finishLocation:{ name:'Vườn hoa Đền Bà Kiệu', lat:21.0333, lng:105.8500 },
      ranking:{ overall:12, overallTotal:234, genderRank:10, genderTotal:180,
        categoryRank:3, categoryTotal:45, category:'M30-39' },
      pace:{ avgPacePerKm:'PT5M45S', avgPaceDisplay:'5:45/km' },
      externalActivity:{ stravaActivityId:null, garminActivityId:null },
      verified:true, verifiedBy:'btc', verifiedAt:'2026-03-21T12:00:00Z',
    },
    transferHistory:[
      { transferId:'TH-010', fromUserId:null, toUserId:_UUID.U_E11,
        transferType:'initial', timestamp:'2026-03-10T00:00:00Z' }
    ],
    nftMetadata:{
      tokenId:'f7a3b291-2c4d-4e5f-8a9b-1c2d3e4f0010',
      name:'BIB #5K-001 — Giải Chạy 80 Năm TDTT 2026',
      attributes:[
        {trait_type:'Race',value:'Giải Chạy 80 Năm TDTT'},{trait_type:'Distance',value:'5K'},
        {trait_type:'FinishTime',value:'28:45'},{trait_type:'Year',value:'2026'},
        {trait_type:'Ranking',value:'12/234'}
      ]
    },
    createdAt:'2026-03-10T00:00:00Z', updatedAt:'2026-03-21T12:00:00Z',
  },
];

// ═══════════════════════════════════════════════════════════════════
// REGISTRATIONS
// ═══════════════════════════════════════════════════════════════════
const MOCK_REGISTRATIONS = [
  { regId:'reg-0001', userId:_UUID.U_KB1, raceId:_UUID.R_SAPA,
    distance:'25K', status:'approved', bibId:null, checkedIn:false,
    timestamp:'2026-03-20T10:00:00Z', preRaceQACompleted:false,
    gearNeededForRace:['trail_shoes','poles','vest'] },

  { regId:'reg-0002', userId:_UUID.U_KB2, raceId:_UUID.R_SAPA,
    distance:'100K', status:'approved',
    bibId:'f7a3b291-2c4d-4e5f-8a9b-1c2d3e4f0001', checkedIn:false,
    timestamp:'2026-02-15T10:00:00Z', preRaceQACompleted:true },

  { regId:'reg-0003', userId:_UUID.U_KB3, raceId:_UUID.R_SAPA,
    distance:'25K', status:'charity',
    bibId:'f7a3b291-2c4d-4e5f-8a9b-1c2d3e4f0003', checkedIn:false,
    timestamp:'2026-02-28T10:00:00Z',
    bibDropIntention:'charity', dropReason:'personal' },

  { regId:'reg-0004', userId:_UUID.U_KB4, raceId:_UUID.R_SAPA,
    distance:null, status:'approved', isVolunteer:true,
    volunteerRole:'medical_support', volunteerShift:'full_day',
    timestamp:'2026-03-01T10:00:00Z' },

  { regId:'reg-0006', userId:_UUID.U_KB6, raceId:_UUID.R_SAPA,
    distance:'100K', status:'approved',
    bibId:'f7a3b291-2c4d-4e5f-8a9b-1c2d3e4f0002', checkedIn:false,
    timestamp:'2025-12-20T10:00:00Z', preRaceQACompleted:true },

  { regId:'reg-0007', userId:_UUID.U_KB7, raceId:_UUID.R_SAPA,
    distance:'50K', status:'approved', bibId:null, checkedIn:false,
    timestamp:'2026-03-05T10:00:00Z', preRaceQACompleted:true },

  { regId:'reg-0008', userId:_UUID.U_KB8, raceId:_UUID.R_SAPA,
    distance:'25K', status:'pending', bibId:null, checkedIn:false,
    timestamp:'2026-03-25T10:00:00Z', preRaceQACompleted:false },

  { regId:'reg-0011', userId:_UUID.U_E11, raceId:_UUID.R_HN21,
    distance:'21K', status:'approved', timestamp:'2026-04-10T00:00:00Z' },
  { regId:'reg-0012', userId:_UUID.U_E12, raceId:_UUID.R_HN21,
    distance:'10K', status:'approved', timestamp:'2026-04-15T00:00:00Z' },

  // Race TDTT thật
  { regId:'reg-0100', userId:_UUID.U_E11, raceId:_UUID.R_TDTT,
    distance:'5km', status:'approved',
    bibId:'f7a3b291-2c4d-4e5f-8a9b-1c2d3e4f0010',
    bibNumber:'5K-001', checkedIn:true,
    timestamp:'2026-03-10T00:00:00Z' },
];

// ═══════════════════════════════════════════════════════════════════
// GEAR ITEMS
// ═══════════════════════════════════════════════════════════════════
const MOCK_GEAR = [
  {gearId:'g-kb2-001', ownerId:_UUID.U_KB2, category:'shoes',
   brand:'Hoka', model:'Speedgoat 5', size:'42', condition:'good',
   purchaseYear:2024, status:'personal_only',
   emotionalNote:'Đôi giày theo mình Sapa 100 lần đầu 2024.',
   technicalNotes:'Stack 36mm, lugs 5mm, 298g. Tốt cho địa hình rocky.'},

  {gearId:'g-kb2-002', ownerId:_UUID.U_KB2, category:'poles',
   brand:'Black Diamond', model:'Distance Carbon Z 110cm', size:'one_size', condition:'excellent',
   purchaseYear:2025, status:'available_lend', priceRentPerDay:50000,
   emotionalNote:'Mua cho Sapa 2025 nhưng race bị cancelled. Gần như mới.',
   technicalNotes:'Carbon Z-fold, 242g/đôi. Packable 35cm. Tốt cho leo dốc dài.'},

  {gearId:'g-kb2-003', ownerId:_UUID.U_KB2, category:'vest',
   brand:'Salomon', model:'Advanced Skin 12', size:'M', condition:'good',
   purchaseYear:2023, status:'available_lend', priceRentPerDay:80000,
   emotionalNote:'Vest cũ nhưng tin cậy. Chạy 8 race với cái này.',
   technicalNotes:'12L, soft flask 500ml x2. Hơi bạc màu.'},

  {gearId:'g-kb4-002', ownerId:_UUID.U_KB4, category:'poles',
   brand:'Leki', model:'Micro Trail FX Carbon', size:'one_size', condition:'excellent',
   purchaseYear:2025, status:'available_lend', priceRentPerDay:70000,
   emotionalNote:'Mua mới tháng 3/2026.',
   technicalNotes:'Carbon, 4-fold, 580g/đôi. Nhẹ nhất trong bộ sưu tập.'},

  {gearId:'g-kb6-003', ownerId:_UUID.U_KB6, category:'vest',
   brand:'Salomon', model:'ADV Skin 5', size:'S', condition:'good',
   purchaseYear:2022, status:'available_lend', priceRentPerDay:60000,
   emotionalNote:'Size S — phù hợp runner nhỏ hoặc nữ.',
   technicalNotes:'5L, 180g. Phù hợp race ngắn dưới 30K.'},

  {gearId:'g-kb6-004', ownerId:_UUID.U_KB6, category:'poles',
   brand:'Black Diamond', model:'Ultra Distance Z', size:'one_size', condition:'good',
   purchaseYear:2023, status:'available_lend', priceRentPerDay:40000,
   technicalNotes:'Nhôm, 3-fold, 290g/đôi. Lựa chọn tốt cho người mới.'},

  {gearId:'g-kb6-005', ownerId:_UUID.U_KB6, category:'headlamp',
   brand:'Black Diamond', model:'Spot 400', size:'one_size', condition:'good',
   purchaseYear:2023, status:'available_lend', priceRentPerDay:25000},

  {gearId:'g-kb7-001', ownerId:_UUID.U_KB7, category:'shoes',
   brand:'Brooks', model:'Cascadia 17', size:'37', condition:'excellent',
   purchaseYear:2025, status:'personal_only',
   emotionalNote:'Mua riêng cho trail. Nhẹ và bám tốt.'},
];

// ═══════════════════════════════════════════════════════════════════
// MERIT POINT LEDGER — append-only
// ═══════════════════════════════════════════════════════════════════
const MOCK_POINT_LEDGER = [
  {ledgerId:'pl-0001', userId:_UUID.U_KB2, type:'earn', action:'race_complete',
   raceId:_UUID.R_SAPA, points:+50, balance:50, note:'Hoàn thành 100K Sapa 2025', ts:'2025-05-26T12:00:00Z'},
  {ledgerId:'pl-0002', userId:_UUID.U_KB2, type:'earn', action:'gear_lend',
   gearId:'g-kb2-002', points:+30, balance:80, note:'Cho mượn poles — đánh giá 5 sao', ts:'2025-07-10T00:00:00Z'},
  {ledgerId:'pl-0003', userId:_UUID.U_KB2, type:'earn', action:'profile_unlock',
   points:+100, balance:180, note:'Mở khoá tầng 2', ts:'2025-09-01T00:00:00Z'},
  {ledgerId:'pl-0004', userId:_UUID.U_KB2, type:'earn', action:'review_detailed',
   raceId:_UUID.R_SAPA, points:+40, balance:220, note:'Review chi tiết Sapa 100', ts:'2025-05-28T00:00:00Z'},
  {ledgerId:'pl-0005', userId:_UUID.U_KB2, type:'earn', action:'volunteer_support',
   raceId:_UUID.R_HN21, points:+80, balance:300, note:'TNV Hanoi HM 2025 — full day', ts:'2025-11-15T00:00:00Z'},
  {ledgerId:'pl-0006', userId:_UUID.U_KB2, type:'earn', action:'race_complete',
   raceId:_UUID.R_MUINE, points:+40, balance:340, note:'Hoàn thành 30K Mũi Né', ts:'2026-01-20T00:00:00Z'},

  {ledgerId:'pl-0010', userId:_UUID.U_KB3, type:'earn', action:'race_complete',
   points:+30, balance:30, note:'Hoàn thành 10K', ts:'2025-08-10T00:00:00Z'},
  {ledgerId:'pl-0011', userId:_UUID.U_KB3, type:'earn', action:'bib_charity',
   raceId:_UUID.R_SAPA, points:+55, balance:85, note:'Tặng BIB 25K Sapa — cảm ơn!', ts:'2026-04-15T00:00:00Z'},

  {ledgerId:'pl-0020', userId:_UUID.U_KB4, type:'earn', action:'volunteer_support',
   points:+80, balance:80, note:'TNV Sapa 2023', ts:'2023-05-27T00:00:00Z'},
  {ledgerId:'pl-0021', userId:_UUID.U_KB4, type:'earn', action:'profile_unlock',
   points:+200, balance:280, note:'Hạt nhân cộng đồng', ts:'2024-01-10T00:00:00Z'},
  {ledgerId:'pl-0022', userId:_UUID.U_KB4, type:'earn', action:'race_complete',
   points:+50, balance:330, note:'100K Sapa 2024', ts:'2024-05-26T00:00:00Z'},
  {ledgerId:'pl-0023', userId:_UUID.U_KB4, type:'earn', action:'peer_referral',
   points:+30, balance:360, note:'Giới thiệu 3 runner mới', ts:'2024-08-01T00:00:00Z'},
  {ledgerId:'pl-0024', userId:_UUID.U_KB4, type:'spend', action:'bib_discount',
   points:-50, balance:310, note:'Giảm 10% BIB Sapa 2025', ts:'2025-03-01T00:00:00Z'},
  {ledgerId:'pl-0025', userId:_UUID.U_KB4, type:'earn', action:'volunteer_support',
   points:+80, balance:390, note:'TNV Sapa 2025', ts:'2025-05-27T00:00:00Z'},
  {ledgerId:'pl-0026', userId:_UUID.U_KB4, type:'earn', action:'race_complete',
   points:+50, balance:440, note:'100K Sapa 2025', ts:'2025-05-27T00:00:00Z'},
];

// ═══════════════════════════════════════════════════════════════════
// BADGES
// ═══════════════════════════════════════════════════════════════════
const BADGE_DEFINITIONS = [
  {badgeId:'badge-unlock-1', badgeSlug:'BADGE-UNLOCK-1',
   name:'🗝️ Explorer', description:'Mở khoá tầng 1', category:'unlock', pointsToEarn:50},
  {badgeId:'badge-unlock-2', badgeSlug:'BADGE-UNLOCK-2',
   name:'🌟 Connector', description:'Mở khoá tầng 2', category:'unlock', pointsToEarn:100},
  {badgeId:'badge-unlock-3', badgeSlug:'BADGE-UNLOCK-3',
   name:'👑 Champion', description:'Hạt nhân cộng đồng', category:'unlock', pointsToEarn:200},
  {badgeId:'badge-trail-5', badgeSlug:'BADGE-TRAIL-5',
   name:'🏔️ Trail Warrior', description:'Hoàn thành 5 race trail', category:'achievement', pointsToEarn:30},
  {badgeId:'badge-lend-1', badgeSlug:'BADGE-LEND-1',
   name:'🤝 Gear Sharer', description:'Cho mượn gear lần đầu', category:'community', pointsToEarn:20},
  {badgeId:'badge-charity-1', badgeSlug:'BADGE-CHARITY-1',
   name:'💙 Giver', description:'Tặng BIB từ thiện', category:'community', pointsToEarn:55},
  {badgeId:'badge-review-5', badgeSlug:'BADGE-REVIEW-5',
   name:'✍️ Reviewer', description:'Viết 5 review chi tiết', category:'contribution', pointsToEarn:25},
  {badgeId:'badge-100k', badgeSlug:'BADGE-100K',
   name:'💯 Century Club', description:'Hoàn thành 100K đầu tiên', category:'achievement', pointsToEarn:100},
];

const MOCK_USER_BADGES = [
  {userId:_UUID.U_KB2, earnedBadges:['badge-unlock-2','badge-trail-5','badge-lend-1','badge-review-5']},
  {userId:_UUID.U_KB3, earnedBadges:['badge-unlock-1','badge-charity-1']},
  {userId:_UUID.U_KB4, earnedBadges:['badge-unlock-3','badge-trail-5','badge-lend-1','badge-charity-1','badge-review-5','badge-100k']},
  {userId:_UUID.U_KB6, earnedBadges:['badge-unlock-3','badge-trail-5','badge-lend-1','badge-review-5','badge-100k']},
];

// ═══════════════════════════════════════════════════════════════════
// REVIEWS — đa chiều
// ═══════════════════════════════════════════════════════════════════
const MOCK_REVIEWS = [
  {
    reviewId:'rev-0001', userId:_UUID.U_KB2, entityType:'race', entityId:_UUID.R_SAPA,
    raceContext:_UUID.R_SAPA, raceDistance:'100K',
    dnf:false, overallScore:5,
    scores:{organization:5, nutrition:4, medical:5, course:5, valueForMoney:4},
    pros:'Đường chạy đẹp nhất Việt Nam. BTC xử lý sự cố nhanh. Trạm y tế đầy đủ.',
    cons:'Nước điện giải tại CP3 hết sớm. Bãi đậu xe nhỏ.',
    gearUsed:['g-kb2-001','g-kb2-002'],
    gearWorked:'Poles BD cực tốt đoạn leo dốc km 35-42.',
    gearFailed:'Áo gió bị thấm sau 6 giờ mưa.',
    adviceForNextRunner:'Train leo dốc nhiều. Mang thêm muối. Đăng ký sớm.',
    wouldReturn:true, pointsEarned:40,
    aiMemory:{
      scenery:['ruộng bậc thang','sương mù buổi sáng','rừng nguyên sinh'],
      companions:['cô gái BIB 1516 — áo hồng, chạy khỏe','anh Kailas vest xanh km 40'],
      gearSpotted:['T8 hồng','Kailas vest','Garmin Fenix','Shokz'],
      emotions:['kiệt sức km 70','hân hoan vượt đích','sợ đoạn vách đá'],
      colorPalette:['#3D7A3A','#C4A882','#FFFFFF','#8B4513'],
      communityTags:['runner văn minh','giúp nhau','chia muối','chia gel'],
      keyQuote:'Tôi được chạy giữa cánh đồng lúa xanh mướt bát ngát — cô gái BIB 1516 đã là chất xúc tác cho đoạn đường phía trước.',
    },
    completedAt:'2025-05-26', createdAt:'2025-05-28T10:00:00Z',
  },
  {
    reviewId:'rev-0002', userId:_UUID.U_KB6, entityType:'race', entityId:_UUID.R_SAPA,
    raceContext:_UUID.R_SAPA, raceDistance:'100K',
    dnf:false, overallScore:4,
    scores:{organization:4, nutrition:5, course:5, medical:4, valueForMoney:4},
    pros:'View đỉnh không đâu bằng. Đồ ăn tại CP phong phú nhất.',
    cons:'Cutoff CP2 hơi chặt. Nên nới thêm 30 phút cho runner mới.',
    gearWorked:'Vest UD Race hoàn hảo. Headlamp Petzl Nao đủ sáng.',
    adviceForNextRunner:'Pace đều quan trọng. Km 60-80 dễ bị underestimate. Train night running.',
    wouldReturn:true, pointsEarned:40,
    aiMemory:{
      scenery:['đỉnh núi mây mù','thác nước giữa rừng','đường mòn 40cm vách núi'],
      emotions:['đau chân km 85','tự hào vượt đích','kinh ngạc trước thiên nhiên'],
      colorPalette:['#1A1A2E','#E8E8E8','#4CAF50','#FF6B35'],
      keyQuote:'Km 60 nhìn xuống thung lũng — tôi hiểu tại sao người ta addicted với trail.',
    },
    completedAt:'2026-01-01', createdAt:'2026-01-05T10:00:00Z',
  },
  {
    reviewId:'rev-0003', userId:_UUID.U_KB7, entityType:'race', entityId:_UUID.R_SAPA,
    raceContext:_UUID.R_SAPA, raceDistance:'50K',
    dnf:true, dnfReason:'injury', dnfKm:38, overallScore:4,
    scores:{organization:5, nutrition:4, course:5, medical:5, valueForMoney:4},
    pros:'Đội y tế cực kỳ chuyên nghiệp. Xử lý chấn thương của mình rất tốt.',
    cons:'Đoạn km 35-38 đường trơn sau mưa không có cảnh báo.',
    adviceForNextRunner:'Tập strength training cho đầu gối. Đường xuống dốc sau mưa nguy hiểm hơn tưởng.',
    wouldReturn:true, pointsEarned:35,
    aiMemory:{
      scenery:['suối chảy xiết km 35','đường mòn đất đỏ trơn'],
      emotions:['đau đớn','thất vọng bản thân','ấm lòng vì đội y tế'],
      keyQuote:'DNF không có nghĩa là thất bại — đội y tế nhắc tôi điều đó khi băng bó đầu gối.',
    },
    completedAt:'2026-05-25', createdAt:'2026-05-27T10:00:00Z',
  },
];

// ═══════════════════════════════════════════════════════════════════
// PRE-RACE Q&A
// ═══════════════════════════════════════════════════════════════════
const MOCK_PRE_RACE_QA = [
  {
    qaId:'qa-kb2-sapa', userId:_UUID.U_KB2, raceId:_UUID.R_SAPA,
    completedAt:'2026-04-25T00:00:00Z',
    answers:{
      departurePoint:'Cầu Giấy, Hà Nội', departureTime:'2026-05-24T19:30:00+07:00',
      transport:'own', vehicleType:'car_7_seats', seatsAvailable:3,
      accommodation:'booked', accommodationDetail:'Homestay Mây Sapa, 2 phòng, 24-26/5',
      roomSharingOffer:true, roomsAvailable:1,
      targetPace:'7:00', targetFinishTime:'28:00', runStrategy:'conservative',
      lookingFor:['nothing'], canHelp:['carpool','roomshare','gear_lend'],
      dietaryRestrictions:'none',
      specialNeeds:'Có thể đón thêm 3 runner từ khu Cầu Giấy/Đống Đa',
    },
    matchedWith:[_UUID.U_KB7, _UUID.U_KB1],
  },
  {
    qaId:'qa-kb7-sapa', userId:_UUID.U_KB7, raceId:_UUID.R_SAPA,
    completedAt:'2026-04-28T00:00:00Z',
    answers:{
      departurePoint:'Đống Đa, Hà Nội', transport:'need_ride',
      accommodation:'need_room', targetPace:'7:30', runStrategy:'steady',
      lookingFor:['carpool','roomshare','pace_partner'],
      dietaryRestrictions:'vegetarian',
      specialNeeds:'Cần bạn cùng tốc độ 7-8 phút/km, nữ ưu tiên',
    },
    matchedWith:[_UUID.U_KB2],
  },
];

// ═══════════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════
const MOCK_NOTIFICATIONS = [
  {notifId:'n-001', userId:_UUID.U_KB1, type:'unlock_offer',
   title:'🗝️ Bạn đủ điều kiện mở khoá!',
   body:'Mở khoá tầng 1 để tìm bạn đồng hành và nhận gợi ý race phù hợp.',
   read:false, ts:'2026-03-26T00:00:00Z'},
  {notifId:'n-002', userId:_UUID.U_KB1, type:'gear_available',
   title:'🏕️ Có poles cho mượn gần bạn!',
   body:'Nguyễn Minh Khoa (Tây Hồ) có Black Diamond Carbon Z. Phù hợp Sapa 25K của bạn.',
   read:false, ts:'2026-04-01T00:00:00Z'},
  {notifId:'n-003', userId:_UUID.U_KB7, type:'match_found',
   title:'🚗 Tìm được bạn đi chung xe!',
   body:'Nguyễn Minh Khoa có 3 chỗ trống, xuất phát Cầu Giấy 19h30 ngày 24/5.',
   read:true, ts:'2026-05-01T00:00:00Z'},
  {notifId:'n-004', userId:_UUID.U_KB3, type:'bib_transfer_complete',
   title:'💙 BIB của bạn đã góp quỹ từ thiện!',
   body:'BIB 25K Sapa đã được xác nhận. Quỹ HLRace nhận 400,000đ. +55 điểm + huy hiệu 💙 Giver.',
   read:false, ts:'2026-04-16T00:00:00Z'},
  {notifId:'n-005', userId:_UUID.U_KB8, type:'pre_race_qa',
   title:'📋 Q&A trước race đã mở!',
   body:'Còn 4 tuần đến Sapa 25K. Điền Q&A để tìm bạn đồng hành.',
   read:false, ts:'2026-04-25T00:00:00Z'},
  {notifId:'n-006', userId:_UUID.U_KB9, type:'review_summary',
   title:'📊 Tổng hợp review Sapa 100 sẵn sàng!',
   body:'AI tổng hợp 47 review. Dinh dưỡng 4.8/5, tổ chức 4.6/5. 3 điểm cần cải thiện.',
   read:false, ts:'2026-06-01T00:00:00Z'},
];

// ═══════════════════════════════════════════════════════════════════
// LOCAL ENTITIES — thực thể địa phương
// ═══════════════════════════════════════════════════════════════════
const MOCK_LOCAL_ENTITIES = [
  {entityId:'loc-hotel-sapa-001', entityType:'hotel', name:'Homestay Mây Sapa',
   province:'Lào Cai', address:'Đường Xuân Viên, Sapa',
   gpsCoords:{lat:22.3361, lng:103.8432},
   contactPhone:'0234 000 001', priceRange:'150-400k/đêm',
   tags:['trail runner friendly','gần start line','giữ đồ miễn phí'],
   raceLinks:[_UUID.R_SAPA], hlraceVerified:true, reviewScore:4.6, reviewCount:23,
   metaverseNodeId:null, touristAuthorityMOU:true},

  {entityId:'loc-restaurant-sapa-001', entityType:'restaurant', name:'Quán Thắng Cố Bản Hồ',
   province:'Lào Cai', address:'Bản Hồ, Sapa',
   gpsCoords:{lat:22.2847, lng:103.9124},
   priceRange:'50-150k/người',
   tags:['đặc sản địa phương','sau race','ấm bụng'],
   raceLinks:[_UUID.R_SAPA], hlraceVerified:true, reviewScore:4.8, reviewCount:41,
   metaverseNodeId:null, touristAuthorityMOU:false},

  {entityId:'loc-hotel-muine-001', entityType:'hotel', name:'Beach Runner Resort Mũi Né',
   province:'Bình Thuận', address:'Bãi biển Mũi Né',
   gpsCoords:{lat:10.9430, lng:108.2839},
   priceRange:'400-800k/đêm',
   tags:['view biển','tắm biển sau race','runner welcome'],
   raceLinks:[_UUID.R_MUINE], hlraceVerified:true, reviewScore:4.4, reviewCount:15,
   metaverseNodeId:null, touristAuthorityMOU:true},
];

// ═══════════════════════════════════════════════════════════════════
// POINT RULES — bảng quy đổi
// ═══════════════════════════════════════════════════════════════════
const POINT_RULES = {
  earn: {
    race_complete_5k:10, race_complete_10k:20, race_complete_21k:30,
    race_complete_42k:40, race_complete_50k:45, race_complete_100k:50,
    volunteer_half_day:40, volunteer_full_day:80,
    gear_lend_success:30, bib_charity:55, bib_transfer:20,
    review_detailed:40, review_brief:15,
    profile_unlock_1:50, profile_unlock_2:100, profile_unlock_3:200,
    peer_referral:30, pre_race_qa:15, gear_locker_add:5,
    // Giai đoạn 1-2
    virtual_race_share:15, relay_segment:30, metaverse_checkin:10,
  },
  spend: {
    bib_discount_10pct:50, bib_discount_20pct:100,
    gear_priority_pin:20, voucher_partner:80,
  },
  seasonal_bonus: {
    charity_2x:{ active:true, multiplier:2, applies_to:['bib_charity'],
      validUntil:'2026-06-30', note:'x2 điểm tặng BIB từ thiện tháng 5-6/2026' }
  }
};

// ═══════════════════════════════════════════════════════════════════
// DATA CHO CÁC MODULE CỤ THỂ (backward compat với mock-data.js cũ)
// ═══════════════════════════════════════════════════════════════════

// Dùng cho city-dashboard, leaderboard (backward compat)
const MOCK_VDV = MOCK_USERS.filter(u => u.role === 'runner').map(u => ({
  id: u.userAlias,
  userId: u.userId,
  fullName: u.fullName,
  phone: u.phone,
  gender: u.gender,
  city: u.city,
  shirtSize: u.shirtSize,
  totalRaces: u.stats?.totalRaces || 0,
  totalPointsEver: u.stats?.totalPointsEver || 0,
  // map từ MOCK_REGISTRATIONS
  distance: MOCK_REGISTRATIONS.find(r => r.userId === u.userId && r.raceId === _UUID.R_TDTT)?.distance || '',
  bibNumber: MOCK_REGISTRATIONS.find(r => r.userId === u.userId && r.raceId === _UUID.R_TDTT)?.bibNumber || '',
  checkedIn: MOCK_REGISTRATIONS.find(r => r.userId === u.userId && r.raceId === _UUID.R_TDTT)?.checkedIn ? 'TRUE' : 'FALSE',
  status: MOCK_REGISTRATIONS.find(r => r.userId === u.userId && r.raceId === _UUID.R_TDTT)?.status || 'pending',
}));

const MOCK_TNV = MOCK_USERS.filter(u => u.runnerProfile?.communityRole === 'volunteer').map(u => ({
  id: u.userAlias, userId: u.userId,
  fullName: u.fullName, phone: u.phone,
  roleId:'tnv', roleName:'Tình nguyện viên', roleIcon:'👥',
  status:'approved',
  totalPoints: u.stats?.totalPointsEver || 0,
  eventsCount: u.stats?.totalRaces || 0,
}));

// Providers (marketplace, partner-portal) — giữ nguyên từ mock-data.js cũ
const MOCK_PROVIDERS = [
  {id:'p01',companyName:'Công ty Sự kiện Hà Nội',contactName:'Nguyễn Quang Huy',phone:'0901111001',email:'huy@eventhn.vn',categoryId:'backdrop',categoryName:'Backdrop & In ấn',description:'Chuyên backdrop, banner, standee cho sự kiện thể thao',priceRange:'5–30 triệu',experience:'5 năm',rating:4.8,status:'approved',racesDone:12},
  {id:'p02',companyName:'Catering VIP Sport',contactName:'Trần Minh Châu',phone:'0901111002',email:'chau@cateringvip.vn',categoryId:'food',categoryName:'Ăn uống & Nước uống',description:'Cung cấp nước uống, gel năng lượng, trái cây cho VĐV',priceRange:'3–15 triệu',experience:'3 năm',rating:4.6,status:'approved',racesDone:8},
  {id:'p03',companyName:'Sound Pro Vietnam',contactName:'Lê Văn Dũng',phone:'0901111003',email:'dung@soundpro.vn',categoryId:'sound',categoryName:'Âm thanh & Ánh sáng',description:'Hệ thống âm thanh chuyên nghiệp, DJ, MC',priceRange:'8–40 triệu',experience:'7 năm',rating:4.9,status:'approved',racesDone:20},
  {id:'p04',companyName:'MedRace Team',contactName:'BS. Phạm Thị Hà',phone:'0901111004',email:'ha@medrace.vn',categoryId:'medical',categoryName:'Y tế & Sức khoẻ',description:'Đội y tế 5 người, xe cấp cứu, AED',priceRange:'10–25 triệu',experience:'4 năm',rating:5.0,status:'approved',racesDone:15},
  {id:'p05',companyName:'Photo Sport HN',contactName:'Hoàng Việt Anh',phone:'0901111005',email:'vietanh@photosport.vn',categoryId:'media',categoryName:'Truyền thông & Nhiếp ảnh',description:'Nhiếp ảnh chuyên nghiệp, drone, livestream',priceRange:'5–20 triệu',experience:'6 năm',rating:4.7,status:'approved',racesDone:18},
  {id:'p06',companyName:'Chip Timing VN',contactName:'Vũ Thanh Tùng',phone:'0901111006',email:'tung@chiptiming.vn',categoryId:'timing',categoryName:'Chip & Đồng hồ',description:'RFID chip timing, bảng điện tử, kết quả realtime',priceRange:'15–50 triệu',experience:'8 năm',rating:4.9,status:'approved',racesDone:25},
  {id:'p07',companyName:'Shuttle Bus HN',contactName:'Đinh Văn Quân',phone:'0901111007',email:'quan@shuttlehn.vn',categoryId:'transport',categoryName:'Vận chuyển',description:'Xe 45 chỗ đưa đón VĐV',priceRange:'3–12 triệu',experience:'2 năm',rating:4.3,status:'pending',racesDone:4},
  {id:'p08',companyName:'Trophy & Medal VN',contactName:'Mai Lan Anh',phone:'0901111008',email:'lananh@trophy.vn',categoryId:'trophy',categoryName:'Cúp & Huy chương',description:'Sản xuất huy chương, cúp theo thiết kế',priceRange:'8–30 triệu',experience:'10 năm',rating:4.8,status:'approved',racesDone:30},
];

const MOCK_CONTRACTS = [
  {contractId:'CTR-202603-001',
   sponsorName:'PHỞ ĐỆ NHẤT — Acecook Vietnam',sponsorPhone:'0901999001',
   providerName:'Công ty Sự kiện Hà Nội',providerPhone:'0901111001',
   categoryName:'Backdrop & In ấn',amount:'45,000,000đ',status:'completed',progress:100,
   items:[
     {name:'Logo backdrop sân khấu 6x3m',done:true,note:'Nghiệm thu 21/03'},
     {name:'Logo áo race 1,000 VĐV',done:true,note:'Nghiệm thu 20/03'},
     {name:'Banner tại khu vực đích và xuất phát',done:true,note:'5 banner'},
     {name:'Booth trải nghiệm 6m²',done:true,note:'Khu vực phát BIB'},
     {name:'Phát sample phở 500 VĐV',done:true,note:'Đã phát đủ'},
   ],
   auditLog:[
     {who:'BTC',action:'Ký hợp đồng',ts:'2026-03-01T09:00:00Z'},
     {who:'BTC',action:'Nghiệm thu backdrop ✅',ts:'2026-03-21T06:30:00Z'},
     {who:'Acecook',action:'Xác nhận chuyển khoản 45 triệu',ts:'2026-03-22T14:00:00Z'},
   ]},
];

const MOCK_CAMPAIGNS = [
  {id:'cg01',type:'urgent',icon:'🆘',title:'Hỗ trợ runner bị tai nạn sau race',
   org:'Cộng đồng HLRace',target:5000000,raised:3800000,donors:47,days:2,
   desc:'Anh Nguyễn Văn An (BIB 5K-023) bị ngã gãy tay khi race, cần hỗ trợ viện phí.',status:'active'},
  {id:'cg02',type:'fundraise',icon:'💙',title:'Quỹ học bổng cho con em VĐV khó khăn',
   org:'HLRace Foundation',target:20000000,raised:12500000,donors:128,days:14,
   desc:'Trao 10 suất học bổng 2 triệu/suất.',status:'active'},
  {id:'cg03',type:'event',icon:'🌱',title:'Chạy vì môi trường — trồng 1,000 cây',
   org:'Green Run VN',target:0,raised:0,donors:89,days:7,
   desc:'Mỗi VĐV hoàn thành race đóng góp 1 cây.',status:'active'},
  {id:'cg05',type:'fundraise',icon:'🍚',title:'Cơm từ thiện cho bệnh nhân BV Bạch Mai',
   org:'Runner For Good',target:10000000,raised:10000000,donors:203,days:0,
   desc:'Hoàn thành! Cộng đồng HLRace trao 500 suất cơm.',status:'completed'},
];

// MOCK_RACE — backward compat cho các file dùng single race config
const MOCK_RACE = {
  raceId: _UUID.R_TDTT,
  raceSlug: 'RACE-TDTT-2026',
  raceName: 'Giải Chạy Chào Mừng 80 Năm Ngành TDTT Việt Nam',
  raceDate: '21/03/2026',
  racePlace: 'Vườn hoa Đền Bà Kiệu, Hoàn Kiếm, Hà Nội',
  sponsorName: 'PHỞ ĐỆ NHẤT — Acecook Vietnam',
  orgName: 'HLRace',
  contactEmail: HLRACE_INFO.contact.email,
  contactPhone: HLRACE_INFO.contact.phone,
};

// ═══════════════════════════════════════════════════════════════════
// HLRace API — unified, consent-aware
// ═══════════════════════════════════════════════════════════════════
const HLRaceAPI = {
  searchRaces: async (query) => {
    await delay(300);
    const q = (query||'').toLowerCase();
    let results = [...MOCK_RACES];
    if (q.includes('trail'))  results = results.filter(r => r.raceType === 'trail');
    if (q.includes('road'))   results = results.filter(r => r.raceType === 'road');
    if (q.includes('tháng 5')) results = results.filter(r => r.schedule?.raceDate?.includes('-05-'));
    if (q.includes('tháng 6')) results = results.filter(r => r.schedule?.raceDate?.includes('-06-'));
    return { status:'OK', data: results };
  },

  getRace: async (raceId) => {
    await delay(200);
    const r = MOCK_RACES.find(r => r.raceId === raceId || r.raceSlug === raceId);
    return { status: r ? 'OK' : 'NOT_FOUND', data: r || null };
  },

  getUserProfile: async (userId) => {
    await delay(300);
    const user = MOCK_USERS.find(u => u.userId === userId || u.userAlias === userId || u.phone === userId);
    if (!user) return { status:'NOT_FOUND', data:null };
    const regs = MOCK_REGISTRATIONS.filter(r => r.userId === user.userId);
    const ledger = MOCK_POINT_LEDGER.filter(l => l.userId === user.userId);
    const badgeEntry = MOCK_USER_BADGES.find(b => b.userId === user.userId);
    const badges = (badgeEntry?.earnedBadges || []).map(bid => BADGE_DEFINITIONS.find(b => b.badgeId === bid)).filter(Boolean);
    const reviews = MOCK_REVIEWS.filter(r => r.userId === user.userId);
    const notifications = MOCK_NOTIFICATIONS.filter(n => n.userId === user.userId);
    return { status:'OK', data:{ user, registrations:regs, ledger, badges, reviews, notifications } };
  },

  getAvailableGear: async (filters = {}) => {
    await delay(200);
    let gear = MOCK_GEAR.filter(g => g.status === 'available_lend');
    if (filters.category) gear = gear.filter(g => g.category === filters.category);
    return {
      status:'OK',
      data: gear.map(g => ({
        ...g,
        owner: MOCK_USERS.find(u => u.userId === g.ownerId),
      }))
    };
  },

  matchRunners: async (raceId, userId) => {
    await delay(400);
    const myQA = MOCK_PRE_RACE_QA.find(q => q.raceId === raceId && q.userId === userId);
    if (!myQA) return { status:'NO_QA', data:[] };
    const matches = (myQA.matchedWith||[]).map(matchedId => ({
      user: MOCK_USERS.find(u => u.userId === matchedId),
      qa:   MOCK_PRE_RACE_QA.find(q => q.raceId === raceId && q.userId === matchedId),
    })).filter(m => m.user);
    return { status:'OK', data:matches };
  },

  getAdminDashboard: async () => {
    await delay(300);
    return {
      status:'OK',
      data:{
        totalUsers:           MOCK_USERS.length,
        totalRaces:           MOCK_RACES.length,
        totalRegistrations:   MOCK_REGISTRATIONS.length,
        totalGearItems:       MOCK_GEAR.length,
        totalPointsCirculating: MOCK_POINT_LEDGER.filter(l=>l.type==='earn').reduce((s,l)=>s+l.points,0),
        activeGearListings:   MOCK_GEAR.filter(g=>g.status==='available_lend').length,
        recentActivity:       MOCK_POINT_LEDGER.slice(-5).reverse(),
        unlockDistribution:{
          level0: MOCK_USERS.filter(u=>u.runnerProfile?.unlockLevel===0).length,
          level1: MOCK_USERS.filter(u=>u.runnerProfile?.unlockLevel===1).length,
          level2: MOCK_USERS.filter(u=>u.runnerProfile?.unlockLevel===2).length,
          level3: MOCK_USERS.filter(u=>u.runnerProfile?.unlockLevel===3).length,
        }
      }
    };
  },

  // Backward compat với vfetch/MockAPI từ mock-data.js cũ
  getProviders:     async () => ({ status:'OK', data: MOCK_PROVIDERS }),
  getContracts:     async (phone) => ({ status:'OK', data: phone ? MOCK_CONTRACTS.filter(c=>c.sponsorPhone===phone||c.providerPhone===phone) : MOCK_CONTRACTS }),
  getCampaigns:     async () => ({ status:'OK', data: MOCK_CAMPAIGNS }),
  getRunnerProfiles:async () => ({ status:'OK', data: MOCK_USERS.filter(u=>u.role==='runner') }),
  getDashboardStats:async () => {
    const dash = await HLRaceAPI.getAdminDashboard();
    return { ...dash.data,
      vdv:{ total:MOCK_VDV.length, checkedIn:MOCK_VDV.filter(v=>v.checkedIn==='TRUE').length, approved:MOCK_VDV.filter(v=>v.status==='approved').length },
      tnv:{ total:MOCK_TNV.length },
      cities:[...new Set(MOCK_USERS.map(u=>u.city).filter(Boolean))].map(c=>({city:c,count:MOCK_USERS.filter(u=>u.city===c).length})),
    };
  },
  getRaceInfo: async () => ({ status:'OK', config: MOCK_RACE }),
};

// ─── LEGACY vfetch/vpost — backward compat ─────────────────────
function getDataSource() { return localStorage.getItem('vrace_use_mock')==='true'?'mock':'sheets'; }
function setDataSource(mode) { localStorage.setItem('vrace_use_mock', mode==='mock'?'true':'false'); }

async function vfetch(action, params={}) {
  if (getDataSource()==='mock') {
    await delay(300);
    if (action==='getProviders'||action==='getAllProviders') return HLRaceAPI.getProviders();
    if (action==='getContracts') return HLRaceAPI.getContracts(params.phone);
    if (action==='getRunnerProfiles') return HLRaceAPI.getRunnerProfiles();
    if (action==='getCampaigns') return HLRaceAPI.getCampaigns();
    if (action==='getDashboardStats') return HLRaceAPI.getDashboardStats();
    if (action==='getConfig') return HLRaceAPI.getRaceInfo();
    return { data:[], status:'OK' };
  }
  const url = localStorage.getItem('race_sheet_url');
  if (!url) return { data:[], error:'Chưa cấu hình Sheets URL' };
  const qs = new URLSearchParams({action,...params}).toString();
  try { const res=await fetch(url+'?'+qs); return await res.json(); }
  catch(e) { return { data:[], error:e.message }; }
}

async function vpost(payload) {
  if (getDataSource()==='mock') {
    await delay(400);
    console.log('[HLRaceAPI] POST mock:', payload);
    return { status:'OK', mock:true };
  }
  const url = localStorage.getItem('race_sheet_url');
  if (!url) return { status:'ERROR', message:'Chưa cấu hình Sheets URL' };
  try {
    await fetch(url,{method:'POST',mode:'no-cors',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    return { status:'OK' };
  } catch(e) { return { status:'ERROR', message:e.message }; }
}

const delay = ms => new Promise(r => setTimeout(r, ms));

// ═══════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════
if (typeof module !== 'undefined') {
  module.exports = {
    HLRACE_INFO, _UUID,
    MOCK_RACES, MOCK_ORGANIZERS, MOCK_USERS, MOCK_BIBS, MOCK_REGISTRATIONS,
    MOCK_GEAR, MOCK_POINT_LEDGER, BADGE_DEFINITIONS, MOCK_USER_BADGES,
    MOCK_REVIEWS, MOCK_PRE_RACE_QA, MOCK_NOTIFICATIONS, MOCK_LOCAL_ENTITIES,
    MOCK_CAMPAIGNS, MOCK_PROVIDERS, MOCK_CONTRACTS,
    MOCK_VDV, MOCK_TNV, MOCK_RACE,
    POINT_RULES, HLRaceAPI, vfetch, vpost,
  };
}

// ═══════════════════════════════════════════════════════════════════
// MEMBERSHIP & SUBSCRIPTION — thêm vào schema v1.2
// ═══════════════════════════════════════════════════════════════════

// ── Membership tiers ──────────────────────────────────────────────
const MEMBERSHIP_TIERS = {
  free_trial: {
    id: 'free_trial',
    name: 'Thành viên dùng thử',
    durationMonths: 4,
    monthlyFee: 0,
    features: [
      'race_register',       // đăng ký race
      'basic_profile',       // hồ sơ cơ bản
      'community_view',      // xem cộng đồng (read-only)
      'blind_bag_basic',     // 1 túi mù/tháng
    ],
    locked: [
      'runner_connect',      // kết nối runner
      'gear_marketplace',    // marketplace gear
      'merit_gifting',       // tặng điểm công đức
      'group_fund',          // quỹ nhóm
      'legacy_run',          // legacy run
      'ai_advisor',          // tư vấn AI
      'voucher_vault',       // kho voucher
      'blind_bag_premium',   // túi mù cao cấp
    ],
  },
  member: {
    id: 'member',
    name: 'Thành viên',
    monthlyFee: 30400,       // 30,400đ — lấy cảm hứng từ 30/4
    features: [
      'race_register',
      'basic_profile',
      'community_view',
      'blind_bag_basic',
      'runner_connect',
      'gear_marketplace',
      'group_fund',
      'voucher_vault',
    ],
    locked: [
      'merit_gifting',       // cần merit points ≥ 100
      'legacy_run',          // cần ≥ 2 race completed
      'ai_advisor',          // premium add-on
      'blind_bag_premium',   // cần credits
    ],
  },
  member_plus: {
    id: 'member_plus',
    name: 'Thành viên+',
    monthlyFee: 60800,       // 2x — gộp AI advisor
    features: ['*'],         // tất cả tính năng
    locked: [],
  },
};

// ── Công thức giảm giá bằng điểm công đức ─────────────────────────
const MERIT_DISCOUNT = {
  // merit_points_ever → discount %
  tiers: [
    { minPts: 0,    maxPts: 99,   discount: 0,   label: 'Chưa có ưu đãi' },
    { minPts: 100,  maxPts: 299,  discount: 10,  label: 'Ưu đãi Đồng' },
    { minPts: 300,  maxPts: 599,  discount: 20,  label: 'Ưu đãi Bạc' },
    { minPts: 600,  maxPts: 999,  discount: 35,  label: 'Ưu đãi Vàng' },
    { minPts: 1000, maxPts: null, discount: 50,  label: 'Ưu đãi Bạch Kim' },
  ],
  maxDiscount: 50, // không bao giờ miễn phí
  calcFee(baseFee, meritPtsEver) {
    const tier = this.tiers.slice().reverse().find(t => meritPtsEver >= t.minPts);
    const disc = tier?.discount || 0;
    return { fee: Math.round(baseFee * (1 - disc/100)), discount: disc, tier: tier?.label };
  },
};

// ── Credits — đồng tiền mua được (KHÁC với merit points) ──────────
// Credits: mua bằng tiền thật, dùng để bốc túi mù hoặc unlock tính năng lẻ
// KHÔNG bao giờ chuyển thành điểm thưởng hay điểm công đức
const CREDIT_PACKAGES = [
  { id: 'cr_50',  credits: 50,  price: 15000,  bonus: 0,  label: '50 Credits' },
  { id: 'cr_150', credits: 150, price: 40000,  bonus: 10, label: '150 + 10 Credits' },
  { id: 'cr_350', credits: 350, price: 80000,  bonus: 30, label: '350 + 30 Credits' },
  { id: 'cr_800', credits: 800, price: 150000, bonus: 100,label: '800 + 100 Credits' },
];
// 1 Credit ≈ 300đ. Túi mù common = 2 credits, epic = 5, legendary = 10.

// ── Feature gate checker ───────────────────────────────────────────
function canAccess(user, featureId) {
  const tier = MEMBERSHIP_TIERS[user.membership?.tierId] || MEMBERSHIP_TIERS.free_trial;
  if (tier.features.includes('*')) return { ok: true };
  if (tier.features.includes(featureId)) return { ok: true };
  // Kiểm tra điều kiện mở khóa đặc biệt
  if (featureId === 'merit_gifting' && (user.stats?.totalPointsEver || 0) >= 100)
    return { ok: true, note: 'Mở khóa nhờ điểm công đức' };
  if (featureId === 'legacy_run' && (user.stats?.totalRaces || 0) >= 2)
    return { ok: true, note: 'Mở khóa nhờ đã hoàn thành 2 race' };
  return { ok: false, locked: true, upgradeNeeded: 'member' };
}

// ═══════════════════════════════════════════════════════════════════
// VOUCHER VAULT — kho voucher từ cửa hàng đối tác
// ═══════════════════════════════════════════════════════════════════

const MOCK_VOUCHER_VAULT = [
  {
    voucherId: 'VCH-0001',
    // Đối tác
    partnerId:    'PARTNER-SALOMON-VN',
    partnerName:  'Salomon Vietnam',
    partnerVerified: true,
    contractId:   'CTR-VCH-2026-001', // liên kết hợp đồng thật

    // Voucher info
    title:        'Giảm 15% toàn bộ sản phẩm',
    description:  'Áp dụng cho tất cả giày, vest, poles tại cửa hàng Salomon.',
    value:        'Giảm 15%',
    valueType:    'percent',       // percent | fixed | gift
    valueAmount:  15,
    originalValue: null,           // nếu là fixed thì điền số tiền

    // Điều kiện
    minOrderValue: 500000,
    validFrom:    '2026-05-01',
    validUntil:   '2026-07-31',
    usagePerUser: 1,               // mỗi user dùng tối đa 1 lần
    totalStock:   50,
    usedCount:    12,

    // Bốc từ kho mù
    inBlindBag:   true,
    blindBagRarity: 'epic',
    creditCost:   5,               // tốn 5 credits để bốc

    // Admin
    status:       'active',        // active | paused | depleted | expired
    addedByAdmin: 'U-ADMIN-LEHOANG',
    addedAt:      '2026-04-28T00:00:00Z',
  },
  {
    voucherId: 'VCH-0002',
    partnerId:    'PARTNER-HIGHLANDS',
    partnerName:  'Highlands Coffee',
    partnerVerified: true,
    contractId:   'CTR-VCH-2026-002',
    title:        'Mua 1 tặng 1 đồ uống bất kỳ',
    description:  'Dành riêng cho runner HLRace. Xuất trình BIB số hoặc badge.',
    value:        'Buy 1 Get 1',
    valueType:    'gift',
    valueAmount:  null,
    minOrderValue: 0,
    validFrom:    '2026-05-01',
    validUntil:   '2026-06-30',
    usagePerUser: 2,
    totalStock:   200,
    usedCount:    34,
    inBlindBag:   true,
    blindBagRarity: 'rare',
    creditCost:   2,
    status:       'active',
    addedByAdmin: 'U-ADMIN-LEHOANG',
    addedAt:      '2026-04-29T00:00:00Z',
  },
  {
    voucherId: 'VCH-0003',
    partnerId:    'PARTNER-GU-ENERGY',
    partnerName:  'GU Energy Vietnam',
    partnerVerified: true,
    contractId:   'CTR-VCH-2026-003',
    title:        'Gel GU x6 miễn phí',
    description:  'Tặng 1 hộp 6 gói gel GU bất kỳ. Nhận tại kho hoặc giao hàng.',
    value:        'Free x6 gói',
    valueType:    'gift',
    validFrom:    '2026-05-01',
    validUntil:   '2026-08-31',
    usagePerUser: 1,
    totalStock:   100,
    usedCount:    28,
    inBlindBag:   true,
    blindBagRarity: 'rare',
    creditCost:   3,
    status:       'active',
    addedByAdmin: 'U-ADMIN-LEHOANG',
    addedAt:      '2026-04-30T00:00:00Z',
  },
];

// ── Voucher usage log (append-only) ──────────────────────────────
const MOCK_VOUCHER_USAGE = [
  {
    usageId:    'VU-0001',
    voucherId:  'VCH-0001',
    userId:     'a1000002-0000-4000-8000-000000000002', // Khoa
    claimedAt:  '2026-05-15T09:30:00Z',
    claimedVia: 'blind_bag',       // blind_bag | direct | referral_reward
    creditsSpent: 5,
    redeemCode: 'HLRACE-SAL-4721', // code gửi cho user
    redeemStatus: 'used',          // pending | used | expired
    redeemedAt: '2026-05-18T14:20:00Z',
    orderId:    'SAL-ORDER-20260518', // order bên đối tác (nếu có)
  },
];

// ═══════════════════════════════════════════════════════════════════
// REFERRAL SYSTEM — giới thiệu thành viên
// ═══════════════════════════════════════════════════════════════════

const MOCK_REFERRALS = [
  {
    referralId:   'REF-0001',
    referrerId:   'a1000002-0000-4000-8000-000000000002', // Khoa giới thiệu
    refereeId:    'a1000001-0000-4000-8000-000000000001', // Hùng được giới thiệu
    groupId:      'GROUP-KHOA-SAPA',   // thuộc nhóm nào
    joinedAt:     '2026-05-01T08:00:00Z',
    rewards: {
      referee:  { meritPoints: 5,  credits: 10, note: 'Điểm chào mừng thành viên mới' },
      referrer: { meritPoints: 10, credits: 5,  note: 'Cảm ơn đã giới thiệu bạn' },
      groupBonus: { credits: 1, toAll: true, note: 'Chào thành viên mới — cộng 1 credit cho cả nhóm' },
    },
    status: 'completed',
  },
];

// ── Group membership ───────────────────────────────────────────────
const MOCK_GROUPS = [
  {
    groupId:    'GROUP-KHOA-SAPA',
    groupName:  'Team Sapa 2026 - Khoa',
    leaderId:   'a1000002-0000-4000-8000-000000000002',
    members: [
      'a1000002-0000-4000-8000-000000000002', // Khoa (leader)
      'a1000007-0000-4000-8000-000000000007', // Lan
      'a1000001-0000-4000-8000-000000000001', // Hùng (mới qua referral)
    ],
    raceContext: 'b2000001-0000-4000-8000-000000000001', // Sapa 100K
    createdAt:  '2026-03-01T00:00:00Z',
    totalGroupCredits: 3, // credits cộng từ thành viên mới
    groupMeritPool: 145,  // tổng điểm công đức của nhóm (để hiển thị)
  },
];

// ═══════════════════════════════════════════════════════════════════
// USER SCHEMA MỞ RỘNG — thêm membership + credits vào User
// (Patch cho MOCK_USERS hiện tại — áp dụng khi load)
// ═══════════════════════════════════════════════════════════════════

const USER_MEMBERSHIP_PATCH = {
  // userId → membership info
  'a1000001-0000-4000-8000-000000000001': { // Hùng - newbie
    tierId:        'free_trial',
    startedAt:     '2026-05-01T00:00:00Z',
    expiresAt:     '2026-09-01T00:00:00Z', // 4 tháng free
    credits:       15,                      // 10 chào mừng + 5 từ referral
    referredBy:    'a1000002-0000-4000-8000-000000000002',
    referralGroup: 'GROUP-KHOA-SAPA',
    paidMonths:    0,
    autoRenew:     false,
  },
  'a1000002-0000-4000-8000-000000000002': { // Khoa - lender
    tierId:        'member',
    startedAt:     '2026-01-01T00:00:00Z',
    expiresAt:     '2026-12-31T00:00:00Z',
    credits:       85,
    referralsMade: ['a1000001-0000-4000-8000-000000000001'],
    paidMonths:    4,
    // Giảm giá: 340 merit pts → 20% → trả 24,320đ/tháng
    effectiveFee:  24320,
    autoRenew:     true,
  },
  'a1000004-0000-4000-8000-000000000004': { // Long - volunteer
    tierId:        'member_plus',
    startedAt:     '2025-06-01T00:00:00Z',
    expiresAt:     '2026-12-31T00:00:00Z',
    credits:       240,
    paidMonths:    11,
    // 580 merit pts → 35% → trả 19,760đ/tháng
    effectiveFee:  19760,
    autoRenew:     true,
  },
  'a1000006-0000-4000-8000-000000000006': { // Sơn - core
    tierId:        'member_plus',
    startedAt:     '2024-05-01T00:00:00Z',
    expiresAt:     '2026-12-31T00:00:00Z',
    credits:       520,
    paidMonths:    20,
    // 1250 merit pts → 50% (max) → trả 15,200đ/tháng
    effectiveFee:  15200,
    autoRenew:     true,
  },
};

// ── Helper: lấy user đầy đủ với membership ────────────────────────
function getUserWithMembership(userId) {
  const user = MOCK_USERS.find(u => u.userId === userId);
  if (!user) return null;
  const membership = USER_MEMBERSHIP_PATCH[userId] || {
    tierId: 'free_trial',
    startedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 4*30*24*60*60*1000).toISOString(),
    credits: 10, // welcome credits
    paidMonths: 0,
    autoRenew: false,
  };
  const meritPts = user.stats?.totalPointsEver || 0;
  const feeCalc = MERIT_DISCOUNT.calcFee(30400, meritPts);
  return {
    ...user,
    membership,
    feeInfo: {
      baseFee:      30400,
      effectiveFee: membership.effectiveFee || feeCalc.fee,
      discount:     feeCalc.discount,
      discountTier: feeCalc.tier,
      meritPts,
    },
    canAccess: (featureId) => canAccess({ ...user, membership }, featureId),
  };
}

// ── Export thêm ────────────────────────────────────────────────────
if (typeof module !== 'undefined') {
  module.exports = {
    ...module.exports,
    MEMBERSHIP_TIERS, MERIT_DISCOUNT, CREDIT_PACKAGES,
    MOCK_VOUCHER_VAULT, MOCK_VOUCHER_USAGE,
    MOCK_REFERRALS, MOCK_GROUPS, USER_MEMBERSHIP_PATCH,
    getUserWithMembership, canAccess,
  };
}

console.log('[HLRace mock-data v3.1] Membership + Voucher Vault + Referral loaded');

// ═══════════════════════════════════════════════════════════════════
// LIVING TRAIL SYSTEM — schema v1.0
// Trail là thực thể sống: nhiều người đóng góp nhiều lớp theo thời gian
// ═══════════════════════════════════════════════════════════════════

// ── Trail entity ──────────────────────────────────────────────────
const MOCK_TRAILS = [
  {
    trailId:    'trail-tavan-vongcung-001',
    trailName:  'Vòng cung Tả Van — qua ruộng bậc thang và bản Mông',
    keeperId:   _UUID.U_KB2,           // người tạo trail
    province:   'Lào Cai',
    district:   'Sa Pa',
    terrain:    'trail_rice_terrace',
    km:         12.4,
    elevationM: 820,
    estTimeH:   '3-4 giờ',
    difficulty: 3,
    gpsStart:   { lat: 22.3361, lng: 103.8438 },
    gpxUrl:     'https://drive.google.com/trail-tavan.gpx',

    // TEP Score layers
    tepScore: {
      route:        80,  // GPX quality, completeness
      conditions:   72,  // season matrix filled, advice quality
      moments:      85,  // number + quality of experience moments
      localKnow:    90,  // local knowledge depth
      freshness:    68,  // how recently updated
      total:        79,  // weighted average
    },

    // Season matrix
    seasonMatrix: {
      T1:'ok', T2:'best', T3:'best', T4:'ok',
      T5:'ok', T6:'avoid', T7:'avoid', T8:'avoid',
      T9:'best', T10:'best', T11:'ok', T12:'ok',
    },
    bestTime:       'Tháng 9-10 ruộng lúa vàng rực. Sáng sớm 5h30-7h sương mù đẹp nhất.',
    bestTimeOfDay:  '5h30-7h sáng',
    weatherRisk:    'Mưa đá tháng 3-4 trên đỉnh. Mùa mưa 6-8 đường trơn nguy hiểm.',

    // Experience moments (living layer — tích lũy theo thời gian)
    moments: [
      { type:'culture',   km:2.1, text:'Gốc đa cổ thụ 200 năm — ngày xưa là chỗ hẹn hò của trai gái bản Mông. Bây giờ vẫn có người già ngồi kể chuyện sáng sớm.', when:'Quanh năm, sáng sớm', prob:'likely', addedBy:_UUID.U_KB2 },
      { type:'seasonal',  km:4.3, text:'Vườn đào nhà ông Mình. Tháng 2-3 hoa nở trắng cả sườn đồi. Ông cho phép dừng chụp ảnh — đừng hái hoa.', when:'Tháng 2-3', prob:'seasonal', addedBy:_UUID.U_KB2 },
      { type:'wildlife',  km:6.8, text:'Đàn trâu ra đồng lúc 6h. Đứng yên cho chúng qua, không chạy. Chú ý phân trâu — trơn.', when:'5h30-7h sáng quanh năm', prob:'likely', addedBy:_UUID.U_KB6 },
      { type:'secret',    km:8.2, text:'Từ đây rẽ trái 200m theo đường mòn bộ đội — ra điểm view nhìn thẳng xuống thung lũng Mường Hoa. Không có trên bản đồ.', when:'Quanh năm, sáng nắng', prob:'always', addedBy:_UUID.U_KB2 },
      { type:'safety',    km:11.0, text:'Suối này mùa mưa nước lên nhanh. Nếu nước qua đầu gối — quay lại, đừng cố vượt.', when:'Tháng 6-9', prob:'seasonal', addedBy:_UUID.U_KB4 },
      { type:'culture',   km:9.5, text:'Nhà bà Sùng Thị Mỵ — bán mật ong rừng và bánh dày ngô. 20k/cái, ngon nhất vùng. Gõ cửa và nói "mua mật ong".', when:'Quanh năm, 6h-18h', prob:'likely', addedBy:_UUID.U_KB6 },
    ],

    // Local knowledge
    localKnowledge: {
      water:    'Suối km 4.2 uống được. Suối km 8 gần bản có trâu — không uống. Nhà bà Mỵ km 9.5 có nước máy.',
      shelter:  'Nhà ông Mình km 4 cho trú mưa. Nhà văn hóa bản Tả Van km 10 mở cửa.',
      animals:  'Chó thả rông km 7-8 ban đêm. Vắt nhiều tháng 7-9 — cần gaiters.',
      culture:  'Xin phép trước khi chụp ảnh người dân. Không chạy qua sân nhà có đám cưới/tang.',
      danger:   'Km 11 vách đá không có biển báo — mưa rất trơn. Km 15 đường hẹp 40cm vách núi.',
      gear:     'Poles cần thiết km 14-16. Gaiters bắt buộc tháng 7-9.',
      tip:      'Mang kẹo cho trẻ em ở bản — chúng sẽ dẫn đường nếu bạn bị lạc.',
    },

    // Pricing & Access
    pricing: {
      model:      'single',       // free | subscription | single
      price:      49000,          // VND
      keeperShare: 0.60,          // 60% về Trail Keeper
      hlraceShare: 0.40,
    },

    // Stats
    stats: {
      totalPurchases: 47,
      totalRuns:      89,
      avgRating:      4.7,
      reviewCount:    34,
      totalTips:      1850000,    // tổng tiền tip VĐV tặng
      keeperEarned:   2940000,    // 49k × 47 × 60% + tips
    },

    // Verification
    tepVerified:  true,
    hlraceVerified: true,
    publishedAt:  '2026-03-01T00:00:00Z',
    lastUpdated:  '2026-03-20T00:00:00Z',
  },
];

// ── Run Experience — lớp cảm xúc runner để lại sau khi chạy ──────
// Đây là thứ tạo ra Living Trail — mỗi run là 1 lớp mới
const MOCK_RUN_EXPERIENCES = [
  {
    expId:      'exp-0001',
    trailId:    'trail-tavan-vongcung-001',
    userId:     _UUID.U_KB7,
    raceContext: null,           // chạy tự do, không phải race
    runDate:    '2026-03-15',
    conditions: {
      weather:    'Sương mù buổi sáng, nắng lên lúc 8h',
      temperature: '14°C khi xuất phát',
      trailState: 'Khô, bám tốt',
      special:    'Vườn đào km 4.3 đang nở rộ — đúng như mô tả',
    },
    // Những điểm dừng + cảm xúc theo km
    waypoints: [
      { km:2.1, note:'Gốc đa đúng như kể. Có ông già đang ngồi — mình không dám hỏi chuyện nhưng ông gật đầu cười.', emotion:'ấm lòng' },
      { km:4.3, note:'Vườn đào... không có từ nào diễn tả. Ngồi 10 phút không muốn đi.', emotion:'kinh ngạc', photo:true },
      { km:8.2, note:'Điểm view bí mật — thật sự không ai ở đây. Ngồi một mình nhìn xuống thung lũng 20 phút.', emotion:'bình an', photo:true },
      { km:9.5, note:'Bánh dày ngô nhà bà Mỵ — 20k mà ngon hơn bất kỳ nhà hàng nào.', emotion:'vui vẻ' },
    ],
    // Review tổng thể
    overallRating:  5,
    headline:       'Con đường đẹp nhất tôi từng chạy — vì câu chuyện của nó',
    emotionalReview: 'Tôi không chạy trail vì GPX. Tôi chạy vì muốn gặp ông già ngồi dưới gốc đa, vì muốn ngồi ở điểm view mà không một bản đồ nào ghi. Cám ơn người đã tạo ra trail này — bạn đã chia sẻ điều gì đó rất riêng.',
    technicalReview: 'Đường mòn rõ ràng, không bị lạc. Km 11-13 cần poles. Tổng 12.4km mình chạy 2h45 pace 13:20.',
    // Đóng góp thêm vào trail
    newMoments: [
      { type:'secret', km:6.0, text:'Có một con đường nhỏ rẽ phải km 6 dẫn ra mỏm đá nhìn xuống bản — chỉ thấy khi đứng đúng góc.', when:'Trời quang', prob:'always' }
    ],
    wishlist: 'Ước gì có biển chỉ dẫn nhỏ tại km 8 để không bị bỏ lỡ điểm view bí mật.',
    // Tip cho Trail Keeper
    tip: {
      amount:   50000,
      message:  'Cảm ơn bạn đã tạo ra trail này và chia sẻ những điều không ai biết. Xứng đáng hơn 50k nhiều.',
      currency: 'VND',
      method:   'hlrace_wallet',  // thanh toán qua HLRace, không cần Visa trực tiếp
    },
    publishedAt: '2026-03-15T14:30:00Z',
  },
];

// ── Tip Transaction — xử lý tip quốc tế ──────────────────────────
const MOCK_TIP_TRANSACTIONS = [
  {
    tipId:        'tip-0001',
    fromUserId:   _UUID.U_KB7,
    toKeeperId:   _UUID.U_KB2,
    trailId:      'trail-tavan-vongcung-001',
    amount:       50000,
    currency:     'VND',
    // Với runner quốc tế: họ trả USD/EUR qua Stripe → HLRace convert → trả VND cho keeper
    originalCurrency: 'VND',
    exchangeRate: 1,
    processingFee: 0,
    keeperReceives: 50000,  // 100% tip về keeper, HLRace không lấy phần trăm tip
    method:       'hlrace_wallet',  // MoMo/ngân hàng với keeper VN, Stripe với buyer quốc tế
    status:       'completed',
    tipMessage:   'Cảm ơn bạn đã tạo ra trail này.',
    meritPointsEarned: 10,  // tipper nhận điểm công đức vì hành động tốt
    ts:           '2026-03-15T14:35:00Z',
  },
];

// ── Trail Activator — TNV chuyên biệt ─────────────────────────────
const MOCK_TRAIL_ACTIVATORS = [
  {
    activatorId:  _UUID.U_KB4,
    activatorName: 'Phạm Đức Long',
    specialties:  ['trail_coaching','basic_english','trail_keeper_training','gear_assessment'],
    trailsActivated: ['trail-tavan-vongcung-001'],
    // Quyền lợi: nhận % doanh thu từ trail mình đã activate trong 12 tháng đầu
    revenueShare: 0.05,  // 5% doanh thu trail trong năm đầu
    activatorBadge: 'badge-activator-001',
    bio: 'Đã chạy 12 race trail, 680km. Từng dạy tiếng Anh cơ bản cho 3 Trail Keeper ở Sapa.',
    activeIn: ['Lào Cai', 'Hà Giang'],
    meritEarnedFromActivation: 240,
  },
];

// ── Trail Wish List — runner đề xuất cải thiện ───────────────────
// Được tổng hợp và gửi cho Trail Keeper + Trail Activator để action
const MOCK_TRAIL_WISHES = [
  {
    wishId:   'wish-0001',
    trailId:  'trail-tavan-vongcung-001',
    fromUserId: _UUID.U_KB7,
    type:     'signage',      // signage | facility | safety | service | story
    text:     'Biển nhỏ tại km 8 chỉ hướng điểm view bí mật — nhiều người bỏ lỡ.',
    upvotes:  12,
    status:   'pending',      // pending | acknowledged | in_progress | done
    keeperResponse: null,
    ts:       '2026-03-15T14:40:00Z',
  },
  {
    wishId:   'wish-0002',
    trailId:  'trail-tavan-vongcung-001',
    fromUserId: _UUID.U_KB1,
    type:     'facility',
    text:     'Thùng rác nhỏ tại điểm dừng km 4.3 — nhiều người để lại rác dưới gốc đào.',
    upvotes:  28,
    status:   'done',
    keeperResponse: 'Cảm ơn! Đã đặt thùng. Ông Mình cũng đồng ý dọn dẹp mỗi tuần.',
    ts:       '2026-02-20T10:00:00Z',
  },
];

// ── Export thêm ────────────────────────────────────────────────────
if (typeof module !== 'undefined') {
  module.exports = {
    ...module.exports,
    MOCK_TRAILS, MOCK_RUN_EXPERIENCES, MOCK_TIP_TRANSACTIONS,
    MOCK_TRAIL_ACTIVATORS, MOCK_TRAIL_WISHES,
  };
}

console.log('[HLRace mock-data v3.2] Living Trail system loaded');

// ═══════════════════════════════════════════════════════════════════
// PATCH v3.3 — Bổ sung 6 scenarios còn thiếu (phát hiện qua audit)
// ═══════════════════════════════════════════════════════════════════

// 1. PHOTO PACKAGES — gói ảnh + BIB màu
const PHOTO_PACKAGES = {
  basic:    { id:'basic',    name:'Cơ bản',   price:0,      bibColor:'#FFFFFF', bibLabel:'TRẮNG', priority:0, watermark:true,  canDownload:false },
  standard: { id:'standard', name:'Standard', price:299000, bibColor:'#2980B9', bibLabel:'XANH',  priority:1, watermark:false, canDownload:true  },
  premium:  { id:'premium',  name:'Premium',  price:599000, bibColor:'#F5A623', bibLabel:'VÀNG',  priority:2, watermark:false, canDownload:true, hasVideo:true, nagFollows:true },
};
// Giá sau race (tăng 25%)
const PHOTO_LATE_MULTIPLIER = 1.25;

// 2. MULTI-SPORT EVENT TYPES
const EVENT_TYPES = {
  run_5k:    { id:'run_5k',    name:'Run 5K',        sports:['run'],             day:'Sat', startH:7,  durationH:3,  price:150000 },
  run_10k:   { id:'run_10k',   name:'Run 10K',       sports:['run'],             day:'Sat', startH:6.5,durationH:4.5,price:200000 },
  run_21k:   { id:'run_21k',   name:'Run 21K',       sports:['run'],             day:'Sat', startH:5.5,durationH:6.5,price:350000 },
  duathlon:  { id:'duathlon',  name:'Duathlon',      sports:['bike','run'],      day:'Sun', startH:7,  durationH:5,  price:500000,
               segments:[{sport:'bike',distKm:20},{sport:'run',distKm:5}] },
  triathlon: { id:'triathlon', name:'Triathlon',     sports:['swim','bike','run'],day:'Sun', startH:6,  durationH:7,  price:900000,
               segments:[{sport:'swim',distM:750},{sport:'bike',distKm:20},{sport:'run',distKm:5}] },
  relay:     { id:'relay',     name:'Relay 3 môn',   sports:['swim','bike','run'],day:'Sun', startH:7,  durationH:7,  price:1200000,
               teamSize:3, segments:[{sport:'swim',distM:750,member:1},{sport:'bike',distKm:20,member:2},{sport:'run',distKm:5,member:3}] },
  kid_run:   { id:'kid_run',   name:'Kid Run',       sports:['run'],             day:'Sun', startH:15, durationH:2,  price:100000, maxAge:15 },
};

// Conflict detection: 2 events xung đột nếu cùng ngày + giờ chồng nhau
function eventsConflict(evId1, evId2) {
  const a = EVENT_TYPES[evId1], b = EVENT_TYPES[evId2];
  if(!a || !b) return false;
  if(a.day !== b.day) return false;
  return a.startH < (b.startH + b.durationH) && (a.startH + a.durationH) > b.startH;
}
// Ví dụ hợp lệ: run_21k (Sat) + kid_run (Sun) = OK
// Ví dụ lỗi:    run_5k (Sat 7h-10h) + run_10k (Sat 6:30-11h) = CONFLICT

// 3. MOCK REGISTRATIONS MỞ RỘNG — có photo_pkg, bib_color, event_type
const MOCK_REGISTRATIONS_V2 = [
  {
    regId:     'reg-ext-001',
    userId:    'a1000002-0000-4000-8000-000000000002',
    raceId:    'b2000001-0000-4000-8000-000000000001',
    // Multi-event trong 1 ngày
    events: [
      { eventType:'run_21k', bibNo:'A001', bibColor:'#F5A623', bibLabel:'VÀNG' },
      { eventType:'kid_run', bibNo:'K001', bibColor:'#F5A623', bibLabel:'VÀNG', isChildEntry:true, childName:'Khoa Jr' },
    ],
    photoPkg:  'premium',
    bibColors: ['VÀNG'],     // tất cả BIB của VĐV này đều màu vàng
    driveFolder: 'https://drive.google.com/drive/folders/PREMIUM_A001',
    paymentStatus: 'paid',
    totalPaid: 350000 + 100000 + 599000,  // 21k + kid + premium
    registeredAt: '2026-04-01T08:00:00Z',
    photoDelivered: false,
    notifiedAt: null,
  },
  {
    regId:     'reg-ext-002',
    userId:    'a1000007-0000-4000-8000-000000000007',
    raceId:    'b2000001-0000-4000-8000-000000000001',
    events: [
      { eventType:'duathlon', bibNo:'D001', bibColor:'#2980B9', bibLabel:'XANH' },
    ],
    photoPkg:  'standard',
    bibColors: ['XANH'],
    driveFolder: 'https://drive.google.com/drive/folders/STANDARD_D001',
    paymentStatus: 'paid',
    totalPaid: 500000 + 299000,
    registeredAt: '2026-04-02T10:00:00Z',
    photoDelivered: false,
  },
  {
    regId:     'reg-ext-003',
    userId:    null,  // relay — không phải 1 user mà là 1 team
    raceId:    'b2000001-0000-4000-8000-000000000001',
    isRelayTeam: true,
    teamName: 'Team Gia Đình Khoa 2026',
    relayMembers: [
      { slot:1, sport:'swim', name:'Nguyễn Minh Khoa',  phone:'0904028281', bibNo:'B001', bibColor:'#FFFFFF', bibLabel:'TRẮNG' },
      { slot:2, sport:'bike', name:'Ngô Thị Lan',       phone:'0912345678', bibNo:'B002', bibColor:'#FFFFFF', bibLabel:'TRẮNG' },
      { slot:3, sport:'run',  name:'Phạm Đức Long',     phone:'0923456789', bibNo:'B003', bibColor:'#FFFFFF', bibLabel:'TRẮNG' },
    ],
    events: [{ eventType:'relay', bibNo:'RELAY_B001', bibColor:'#52BE80', bibLabel:'XANH LÁ' }],
    photoPkg: 'basic',  // cả đội chọn gói cơ bản
    paymentStatus: 'paid',
    totalPaid: 1200000,
    registeredAt: '2026-04-03T09:00:00Z',
  },
];

// 4. PHOTO LOG — ảnh cameraman upload sau race
const MOCK_PHOTO_LOG = [
  {
    logId:    'plog-001',
    bibNo:    'A001',
    photoPkg: 'premium',
    files: [
      { fileName:'A001_01.jpg', driveFileId:'1ABC001', uploadedBy:'NAG Trần Minh', uploadedAt:'2026-06-15T20:00:00Z', isWatermarked:false },
      { fileName:'A001_02.jpg', driveFileId:'1ABC002', uploadedBy:'NAG Trần Minh', uploadedAt:'2026-06-15T20:05:00Z', isWatermarked:false },
    ],
    notifiedVDV: true,
    notifiedAt:  '2026-06-15T21:00:00Z',
    viewCount:   3,
    downloaded:  true,
  },
  {
    logId:    'plog-002',
    bibNo:    'C005',
    photoPkg: 'basic',
    files: [
      { fileName:'C005_01.jpg', driveFileId:'1DEF001', uploadedBy:'Cameraman Hùng', uploadedAt:'2026-06-15T22:00:00Z', isWatermarked:true },
    ],
    notifiedVDV: true,
    notifiedAt:  '2026-06-15T22:30:00Z',
    viewCount:   1,
    downloaded:  false,
    upgradeOffered: true,
    upgradePrice: Math.round(299000 * 1.25),  // 373,750đ (+25%)
  },
];

// 5. BLIND BAG — pity system + golden hour (data đầy đủ)
const BLIND_BAG_CONFIG = {
  pityThreshold: 10,       // sau 10 lần trượt bắt đầu tăng xác suất
  pityBoostPerRoll: 5,     // +5% mỗi lần trượt sau threshold
  maxPityBoost: 50,        // tối đa +50%
  goldenHourMultiplier: 3, // giờ vàng: xác suất Legendary x3
  dropRates: {
    legendary: 0.03,  // 3% bình thường → 9% giờ vàng
    epic:      0.10,
    rare:      0.25,
    common:    1.00,
  },
  costPerRoll: 2,           // 2 điểm thưởng / 1 lần bốc
};

const MOCK_BLIND_BAG_LOG = [
  { logId:'bb-001', userId:'a1000002-0000-4000-8000-000000000002', ts:'2026-05-01T06:15:00Z', rarity:'epic',      prize:'Voucher giày 500k', pityCount:0, goldenHour:false, pointsSpent:2 },
  { logId:'bb-002', userId:'a1000002-0000-4000-8000-000000000002', ts:'2026-05-01T06:20:00Z', rarity:'miss',      prize:null,                pityCount:1, goldenHour:false, pointsSpent:2 },
  { logId:'bb-003', userId:'a1000002-0000-4000-8000-000000000002', ts:'2026-05-02T05:30:00Z', rarity:'legendary', prize:'BIB Free Sapa 2027', pityCount:2, goldenHour:true,  pointsSpent:2,
    goldenHourKOL:'Đặng Văn Sơn', note:'Trúng trong giờ vàng KOL' },
];

// 6. WATERMARK CONFIG — ảnh basic có watermark, premium/standard thì không
const PHOTO_WATERMARK_CONFIG = {
  basic: {
    enabled:     true,
    text:        'HLRace 2026 · Mua gói để tải ảnh full HD',
    opacity:     0.6,
    position:    'center-diagonal',
    previewSize: '480px',  // chỉ hiện ảnh nhỏ
  },
  standard: { enabled:false, previewSize:'full' },
  premium:  { enabled:false, previewSize:'full' },
};

// ── Export tất cả ──────────────────────────────────────────────────
if (typeof module !== 'undefined') {
  module.exports = {
    ...module.exports,
    PHOTO_PACKAGES, PHOTO_LATE_MULTIPLIER,
    EVENT_TYPES, eventsConflict,
    MOCK_REGISTRATIONS_V2, MOCK_PHOTO_LOG,
    BLIND_BAG_CONFIG, MOCK_BLIND_BAG_LOG,
    PHOTO_WATERMARK_CONFIG,
  };
}

console.log('[HLRace mock-data v3.3] 6 missing scenarios patched');

// ═══════════════════════════════════════════════════════════════════
// PATCH v3.3 — 6 scenarios còn thiếu (phát hiện qua audit)
// ═══════════════════════════════════════════════════════════════════

const PHOTO_PACKAGES = {
  basic:    { id:'basic',    name:'Cơ bản',   price:0,      bibColor:'#FFFFFF', bibLabel:'TRẮNG', priority:0, watermark:true,  canDownload:false },
  standard: { id:'standard', name:'Standard', price:299000, bibColor:'#2980B9', bibLabel:'XANH',  priority:1, watermark:false, canDownload:true  },
  premium:  { id:'premium',  name:'Premium',  price:599000, bibColor:'#F5A623', bibLabel:'VÀNG',  priority:2, watermark:false, canDownload:true, hasVideo:true, nagFollows:true },
};
const PHOTO_LATE_MULTIPLIER = 1.25;

const EVENT_TYPES = {
  run_5k:    { id:'run_5k',    name:'Run 5K',     sports:['run'],              day:'Sat', startH:7,   durationH:3,   price:150000 },
  run_10k:   { id:'run_10k',   name:'Run 10K',    sports:['run'],              day:'Sat', startH:6.5, durationH:4.5, price:200000 },
  run_21k:   { id:'run_21k',   name:'Run 21K',    sports:['run'],              day:'Sat', startH:5.5, durationH:6.5, price:350000 },
  duathlon:  { id:'duathlon',  name:'Duathlon',   sports:['bike','run'],       day:'Sun', startH:7,   durationH:5,   price:500000,
    segments:[{sport:'bike',distKm:20},{sport:'run',distKm:5}] },
  triathlon: { id:'triathlon', name:'Triathlon',  sports:['swim','bike','run'],day:'Sun', startH:6,   durationH:7,   price:900000,
    segments:[{sport:'swim',distM:750},{sport:'bike',distKm:20},{sport:'run',distKm:5}] },
  relay:     { id:'relay',     name:'Relay 3 môn',sports:['swim','bike','run'],day:'Sun', startH:7,   durationH:7,   price:1200000,
    teamSize:3, segments:[{sport:'swim',distM:750,member:1},{sport:'bike',distKm:20,member:2},{sport:'run',distKm:5,member:3}] },
  kid_run:   { id:'kid_run',   name:'Kid Run',    sports:['run'],              day:'Sun', startH:15,  durationH:2,   price:100000, maxAge:15 },
};

function eventsConflict(evId1, evId2) {
  const a = EVENT_TYPES[evId1], b = EVENT_TYPES[evId2];
  if(!a || !b || a.day !== b.day) return false;
  return a.startH < (b.startH + b.durationH) && (a.startH + a.durationH) > b.startH;
}

const MOCK_REGISTRATIONS_V2 = [
  { regId:'reg-ext-001', userId:'a1000002-0000-4000-8000-000000000002',
    events:[
      {eventType:'run_21k', bibNo:'A001', bibColor:'#F5A623', bibLabel:'VÀNG'},
      {eventType:'kid_run', bibNo:'K001', bibColor:'#F5A623', bibLabel:'VÀNG', childName:'Khoa Jr'},
    ],
    photoPkg:'premium', totalPaid:1049000, paymentStatus:'paid',
    driveFolder:'PREMIUM_A001', photoDelivered:false, notifiedAt:null,
  },
  { regId:'reg-ext-002', userId:'a1000007-0000-4000-8000-000000000007',
    events:[{eventType:'duathlon', bibNo:'D001', bibColor:'#2980B9', bibLabel:'XANH'}],
    photoPkg:'standard', totalPaid:799000, paymentStatus:'paid',
    driveFolder:'STANDARD_D001', photoDelivered:false,
  },
  { regId:'reg-ext-003', isRelayTeam:true, teamName:'Team Gia Đình Khoa 2026',
    relayMembers:[
      {slot:1, sport:'swim', name:'Nguyễn Minh Khoa', bibNo:'B001'},
      {slot:2, sport:'bike', name:'Ngô Thị Lan',      bibNo:'B002'},
      {slot:3, sport:'run',  name:'Phạm Đức Long',    bibNo:'B003'},
    ],
    events:[{eventType:'relay', bibNo:'RELAY_B001', bibColor:'#52BE80'}],
    photoPkg:'basic', totalPaid:1200000, paymentStatus:'paid',
  },
];

const MOCK_PHOTO_LOG = [
  { logId:'plog-001', bibNo:'A001', photoPkg:'premium',
    files:[
      {fileName:'A001_01.jpg', uploadedBy:'NAG Trần Minh', uploadedAt:'2026-06-15T20:00:00Z', isWatermarked:false},
      {fileName:'A001_02.jpg', uploadedBy:'NAG Trần Minh', uploadedAt:'2026-06-15T20:05:00Z', isWatermarked:false},
    ],
    notifiedVDV:true, notifiedAt:'2026-06-15T21:00:00Z', downloaded:true,
  },
  { logId:'plog-002', bibNo:'C005', photoPkg:'basic',
    files:[{fileName:'C005_01.jpg', uploadedBy:'Cameraman Hùng', uploadedAt:'2026-06-15T22:00:00Z', isWatermarked:true}],
    notifiedVDV:true, notifiedAt:'2026-06-15T22:30:00Z', downloaded:false,
    upgradeOffered:true, upgradePrice:374000,
  },
];

const BLIND_BAG_CONFIG = {
  pityThreshold:10, pityBoostPerRoll:5, maxPityBoost:50,
  goldenHourMultiplier:3,
  dropRates:{legendary:0.03, epic:0.10, rare:0.25, common:1.00},
  costPerRoll:2,
};

const MOCK_BLIND_BAG_LOG = [
  {logId:'bb-001', userId:'a1000002-0000-4000-8000-000000000002', ts:'2026-05-01T06:15:00Z', rarity:'epic',      prize:'Voucher giày 500k', pityCount:0, goldenHour:false, pointsSpent:2},
  {logId:'bb-002', userId:'a1000002-0000-4000-8000-000000000002', ts:'2026-05-01T06:20:00Z', rarity:'miss',      prize:null,                pityCount:1, goldenHour:false, pointsSpent:2},
  {logId:'bb-003', userId:'a1000002-0000-4000-8000-000000000002', ts:'2026-05-02T05:30:00Z', rarity:'legendary', prize:'BIB Free Sapa 2027', pityCount:2, goldenHour:true,  pointsSpent:2, goldenHourKOL:'Đặng Văn Sơn'},
];

const PHOTO_WATERMARK_CONFIG = {
  basic:    {enabled:true,  text:'HLRace 2026 · Mua gói để tải ảnh full HD', opacity:0.6, previewSize:'480px'},
  standard: {enabled:false, previewSize:'full'},
  premium:  {enabled:false, previewSize:'full'},
};

if (typeof module !== 'undefined') {
  module.exports = { ...module.exports,
    PHOTO_PACKAGES, PHOTO_LATE_MULTIPLIER, EVENT_TYPES, eventsConflict,
    MOCK_REGISTRATIONS_V2, MOCK_PHOTO_LOG, BLIND_BAG_CONFIG,
    MOCK_BLIND_BAG_LOG, PHOTO_WATERMARK_CONFIG,
  };
}
console.log('[HLRace mock-data v3.3] 6 missing scenarios patched');
