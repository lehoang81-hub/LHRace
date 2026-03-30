// ============================================================
//  HLRace API — Google Apps Script v17
//  Paste toan bo file nay vao Apps Script Editor
//  lehoang81@gmail.com | 0904 028 281
// ============================================================

// ── CAU HINH (khong can sua, lay tu Script Properties) ────────
function getCfg(key) {
  return PropertiesService.getScriptProperties().getProperty(key) || '';
}

var SS_ID         = getCfg('SPREADSHEET_ID');   // optional, neu can
var FOLDER_CHUNGTU  = getCfg('DRIVE_FOLDER_CHUNGTU');
var FOLDER_ANH_VDV  = getCfg('DRIVE_FOLDER_ANH_VDV');
var FOLDER_PREMIUM  = getCfg('DRIVE_FOLDER_PREMIUM');
var FOLDER_STANDARD = getCfg('DRIVE_FOLDER_STANDARD');
var FOLDER_BASIC    = getCfg('DRIVE_FOLDER_BASIC');
var FOLDER_GPX      = getCfg('DRIVE_FOLDER_GPX');
var CLAUDE_API_KEY  = getCfg('CLAUDE_API_KEY');

// ── HEADERS CHO TUNG TAB ──────────────────────────────────────
var HEADERS = {
  DANG_KY: [
    'regId','registeredAt','status','paymentStatus',
    'fullName','gender','dob','phone','email','idCard','city',
    'distance','shirtSize','club','emgName','emgPhone',
    'medicalNote','teamCode','teamName','ckMode',
    'photoPkg','bibColor','eventType','paymentImg','note'
  ],
  NHAN_SU: [
    'staffId','registeredAt','status',
    'fullName','phone','email','role','area','shift',
    'tShirtSize','experience','note'
  ],
  CONFIG: ['key','value','updatedAt'],
  USERS: [
    'userId','createdAt','role','fullName','phone','email',
    'membership','credits','meritPoints','rewardPoints',
    'totalRaces','totalKm','walletAddress','note'
  ],
  ACTIVITY_LOG: [
    'logId','ts','userId','action','detail','pointsDelta','result'
  ],
  KET_QUA_RUN: [
    'bibNo','fullName','event','gioXuatPhat','gioVeDich',
    'thanhTich','xepHangChung','xepHangGioiTinh',
    'xepHangNhomTuoi','ghiChu'
  ],
  KET_QUA_MULTI: [
    'bibNo','fullName','event',
    'T1_boi','T_chuyen1','T2_dap','T_chuyen2','T3_chay',
    'tongTgian','xepHang','ghiChu'
  ],
  KET_QUA_RELAY: [
    'bibNhom','tenDoi',
    'vdv1Ten','vdv1Mon','T1',
    'vdv2Ten','vdv2Mon','T2',
    'vdv3Ten','vdv3Mon','T3',
    'tongTgian','xepHang','ghiChu'
  ],
  MERIT_LEDGER: [
    'ledgerId','ts','userId','action','points','balance',
    'campaignId','note','onChain'
  ],
  BIBS: [
    'bibNo','userId','regId','event','bibColor','photoPkg',
    'driveFolder','assignedAt','checkedIn','checkedInAt'
  ],
  GEAR_ITEMS: [
    'gearId','ownerId','name','category','condition','mode',
    'price','available','description','createdAt'
  ],
  REVIEWS: [
    'reviewId','userId','targetType','targetId','rating',
    'headline','body','aiMemory','createdAt'
  ],
  TRAILS: [
    'trailId','trailName','keeperId','province','district',
    'terrain','km','elevationM','difficulty','gpsLat','gpsLng',
    'gpxUrl','tepTotal','price','keeperShare','status',
    'publishedAt','lastUpdated'
  ],
  RUN_EXPERIENCES: [
    'expId','trailId','userId','runDate','weather','temperature',
    'trailState','overallRating','headline','emotionalReview',
    'technicalReview','tipAmount','meritEarned','publishedAt'
  ],
  TRAIL_WISHES: [
    'wishId','trailId','userId','type','text','upvotes',
    'status','keeperResponse','ts'
  ],
  TIP_TRANSACTIONS: [
    'tipId','fromUserId','toKeeperId','trailId','amount',
    'currency','keeperReceives','method','status','message',
    'meritEarned','ts'
  ],
  LOCAL_ENTITIES: [
    'entityId','type','name','province','district','address',
    'gpsLat','gpsLng','contactName','phone','email',
    'description','amenities','photoPkg','status','addedAt'
  ],
  VOUCHER_VAULT: [
    'voucherId','partnerId','partnerName','title','value',
    'valueType','valueAmount','validFrom','validUntil',
    'totalStock','usedCount','creditCost','status','addedAt'
  ],
  REFERRALS: [
    'referralId','referrerId','refereeId','groupId',
    'joinedAt','rewardSent','status'
  ],
  PHOTO_REGISTRY: [
    'bibNo','fullName','email','phone','event',
    'photoPkg','bibColor','driveFolder','upgradeStatus',
    'registeredAt','paid','paymentMethod'
  ],
  PHOTO_LOG: [
    'logId','bibNo','fileName','driveFileId',
    'uploadedBy','uploadAt','notified','notifiedAt'
  ],
  NAG_POSITIONS: [
    'nagName','nagPhone','positionKm','positionName',
    'assignedRace','status','feePaid','meritPoints'
  ]
};

// ── INIT SHEETS ───────────────────────────────────────────────
function initAllSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(HEADERS).forEach(function(name) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      Logger.log('Tao sheet: ' + name);
    }
    var existing = sheet.getRange(1,1,1,1).getValue();
    if (!existing) {
      sheet.getRange(1, 1, 1, HEADERS[name].length)
           .setValues([HEADERS[name]])
           .setFontWeight('bold')
           .setBackground('#1a3a2a')
           .setFontColor('#ffffff');
      sheet.setFrozenRows(1);
      Logger.log('Da tao headers cho: ' + name);
    }
  });
  SpreadsheetApp.getUi().alert('Da khoi tao ' + Object.keys(HEADERS).length + ' sheet thanh cong!');
}

// ── HELPER ───────────────────────────────────────────────────
function getSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (HEADERS[name]) {
      sheet.getRange(1,1,1,HEADERS[name].length).setValues([HEADERS[name]]);
    }
  }
  return sheet;
}

function appendRow(sheetName, data) {
  var sheet = getSheet(sheetName);
  var headers = HEADERS[sheetName] || [];
  var row = headers.map(function(h) { return data[h] !== undefined ? data[h] : ''; });
  sheet.appendRow(row);
}

function makeId(prefix) {
  return prefix + '-' + new Date().getTime() + '-' + Math.random().toString(36).substr(2,5);
}

function jsonRes(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// CORS handler cho GET requests
function doOptions(e) {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

function cors(res) {
  // no-cors mode khong can header, nhung GET can
  return res;
}

// ── UPLOAD ANH LEN DRIVE ──────────────────────────────────────
function uploadToDrive(base64Data, fileName, folderId) {
  try {
    var clean = base64Data.replace(/^data:[^;]+;base64,/, '');
    var blob = Utilities.newBlob(Utilities.base64Decode(clean), 'image/jpeg', fileName);
    var folder = DriveApp.getFolderById(folderId || FOLDER_CHUNGTU);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch(e) {
    Logger.log('Upload error: ' + e.toString());
    return '';
  }
}

// ── doGET — doc du lieu ───────────────────────────────────────
function doGet(e) {
  var action = e && e.parameter && e.parameter.action ? e.parameter.action : 'ping';
  var callback = e && e.parameter && e.parameter.callback ? e.parameter.callback : null;
  
  // Helper: wrap response trong JSONP callback nếu có
  function respond(data) {
    if (callback) {
      return ContentService.createTextOutput(callback + '(' + JSON.stringify(data) + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'ping') {
    return respond({ ok: true, version: 'v17', ts: new Date().toISOString() });
  }
  
  if (action === 'getConfig') {
    var sheet = getSheet('CONFIG');
    var data = sheet.getDataRange().getValues();
    var cfg = {};
    for (var i = 1; i < data.length; i++) {
      if (data[i][0]) cfg[data[i][0]] = data[i][1];
    }
    return respond({ ok: true, config: cfg });
  }
  
  if (action === 'getRegistrations') {
    var sheet = getSheet('DANG_KY');
    var rows = sheet.getDataRange().getValues();
    var headers = rows[0];
    var result = [];
    for (var i = 1; i < rows.length; i++) {
      if (!rows[i][0]) continue;
      var obj = {};
      headers.forEach(function(h, idx) { obj[h] = rows[i][idx]; });
      result.push(obj);
    }
    return respond({ ok: true, data: result, count: result.length });
  }
  
  if (action === 'getResults') {
    var eventType = e.parameter.event || 'run';
    var sheetName = eventType === 'relay' ? 'KET_QUA_RELAY' 
                  : eventType === 'multi' ? 'KET_QUA_MULTI' 
                  : 'KET_QUA_RUN';
    var sheet = getSheet(sheetName);
    var rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) return respond({ ok: true, data: [], count: 0 });
    var headers = rows[0];
    var result = rows.slice(1)
      .filter(function(r) { return r[0]; })
      .map(function(r) {
        var o = {};
        headers.forEach(function(h,i) { o[h] = r[i]; });
        return o;
      });
    return respond({ ok: true, data: result, count: result.length });
  }

  if (action === 'getPhotoStatus') {
    var bibNo = e.parameter.bib || '';
    var sheet = getSheet('PHOTO_LOG');
    var rows = sheet.getDataRange().getValues();
    var headers = rows[0];
    var photos = rows.slice(1)
      .filter(function(r) { return r[0] && String(r[headers.indexOf('bibNo')]) === bibNo; })
      .map(function(r) {
        var o = {};
        headers.forEach(function(h,i) { o[h] = r[i]; });
        return o;
      });
    return respond({ ok: true, bib: bibNo, photos: photos, count: photos.length });
  }

  return respond({ ok: false, error: 'Unknown action: ' + action });
}

// ── doPOST — ghi du lieu ─────────────────────────────────────
function doPost(e) {
  var data = {};
  try {
    data = JSON.parse(e.postData.contents);
  } catch(err) {
    return jsonRes({ ok: false, error: 'Invalid JSON' });
  }
  
  var action = data.action || 'register';
  
  // ── DANG KY VDV ──────────────────────────────────────────
  if (action === 'register' || action === 'submitRegistration') {
    var regId = data.regId || makeId('REG');
    var ts    = new Date().toISOString();
    
    // Xac dinh BIB color theo goi anh
    var bibColorMap = { premium:'#F5A623', standard:'#2980B9', basic:'#FFFFFF' };
    var bibColor = bibColorMap[data.photoPkg] || '#FFFFFF';
    
    appendRow('DANG_KY', {
      regId: regId, registeredAt: ts, status: 'pending', paymentStatus: 'pending',
      fullName: data.fullName, gender: data.gender, dob: data.dob,
      phone: data.phone, email: data.email, idCard: data.idCard, city: data.city,
      distance: data.distance, shirtSize: data.shirtSize, club: data.club||'',
      emgName: data.emgName, emgPhone: data.emgPhone,
      medicalNote: data.medicalNote||'',
      teamCode: data.teamCode||'', teamName: data.teamName||'',
      ckMode: data.ckMode||'self',
      photoPkg: data.photoPkg||'basic', bibColor: bibColor,
      eventType: data.eventType||'run',
      paymentImg: data.paymentImg||'',
      note: data.note||''
    });
    
    // Ghi PHOTO_REGISTRY neu co goi anh
    if (data.photoPkg && data.photoPkg !== 'basic') {
      appendRow('PHOTO_REGISTRY', {
        bibNo: '', // se cap nhat khi phat BIB
        fullName: data.fullName, email: data.email, phone: data.phone,
        event: data.eventType||data.distance||'',
        photoPkg: data.photoPkg, bibColor: bibColor,
        driveFolder: '', upgradeStatus: 'active',
        registeredAt: ts, paid: 'yes', paymentMethod: 'prepaid'
      });
    }
    
    return jsonRes({ ok: true, regId: regId, ts: ts, bibColor: bibColor });
  }
  
  // ── DANG KY RELAY TEAM ───────────────────────────────────
  if (action === 'registerRelay') {
    var teamId = makeId('RELAY');
    var ts = new Date().toISOString();
    var members = data.members || [];
    
    members.forEach(function(m, idx) {
      appendRow('DANG_KY', {
        regId: teamId + '_M' + (idx+1),
        registeredAt: ts, status: 'pending', paymentStatus: 'pending',
        fullName: m.name, phone: m.phone, email: m.email||'',
        distance: 'relay_' + m.sport,
        eventType: 'relay',
        teamCode: teamId, teamName: data.teamName,
        photoPkg: data.photoPkg||'basic',
        bibColor: '#52BE80',
        note: 'Chang ' + (idx+1) + ': ' + m.sport
      });
    });
    
    return jsonRes({ ok: true, teamId: teamId, memberCount: members.length });
  }
  
  // ── DANG KY NHAN SU / TNV ─────────────────────────────────
  if (action === 'registerStaff') {
    var staffId = makeId('STF');
    appendRow('NHAN_SU', {
      staffId: staffId, registeredAt: new Date().toISOString(), status: 'pending',
      fullName: data.fullName, phone: data.phone, email: data.email||'',
      role: data.role, area: data.area||'', shift: data.shift||'',
      tShirtSize: data.tShirtSize||'M', experience: data.experience||'',
      note: data.note||''
    });
    return jsonRes({ ok: true, staffId: staffId });
  }
  
  // ── CAP NHAT CONFIG ───────────────────────────────────────
  if (action === 'setConfig') {
    var sheet = getSheet('CONFIG');
    var key = data.key, value = data.value;
    var found = false;
    var rows = sheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === key) {
        sheet.getRange(i+1, 2).setValue(value);
        sheet.getRange(i+1, 3).setValue(new Date().toISOString());
        found = true;
        break;
      }
    }
    if (!found) {
      sheet.appendRow([key, value, new Date().toISOString()]);
    }
    return jsonRes({ ok: true, key: key });
  }
  
  // ── UPLOAD ANH CHUNG TU ───────────────────────────────────
  if (action === 'uploadImage') {
    var url = uploadToDrive(data.imageBase64, data.fileName||'img.jpg', FOLDER_CHUNGTU);
    return jsonRes({ ok: !!url, url: url });
  }
  
  // ── UPLOAD ANH VDV (cameraman dung sau race) ──────────────
  if (action === 'uploadPhoto') {
    // data.bibNo, data.photoPkg, data.fileName, data.imageBase64, data.uploadedBy
    var pkg = data.photoPkg || 'basic';
    var folderId = pkg === 'premium' ? FOLDER_PREMIUM 
                 : pkg === 'standard' ? FOLDER_STANDARD 
                 : FOLDER_BASIC;
    
    // Tao sub-folder cho BIB neu chua co
    var bibFolder;
    try {
      var parentFolder = DriveApp.getFolderById(folderId);
      var bibFolderName = 'BIB_' + data.bibNo;
      var existing = parentFolder.getFoldersByName(bibFolderName);
      bibFolder = existing.hasNext() ? existing.next() : parentFolder.createFolder(bibFolderName);
    } catch(err) {
      bibFolder = DriveApp.getFolderById(folderId);
    }
    
    var fileUrl = uploadToDrive(data.imageBase64, data.fileName, bibFolder.getId());
    
    if (fileUrl) {
      var logId = makeId('PLOG');
      appendRow('PHOTO_LOG', {
        logId: logId, bibNo: data.bibNo, fileName: data.fileName,
        driveFileId: fileUrl, uploadedBy: data.uploadedBy||'system',
        uploadAt: new Date().toISOString(), notified: 'no', notifiedAt: ''
      });
      
      // Gui thong bao cho VDV
      notifyVDVPhotoReady(data.bibNo);
    }
    
    return jsonRes({ ok: !!fileUrl, url: fileUrl, logId: logId||'' });
  }
  
  // ── GLOG MERIT POINT ─────────────────────────────────────
  if (action === 'logMerit') {
    var ledgerId = makeId('ML');
    appendRow('MERIT_LEDGER', {
      ledgerId: ledgerId, ts: new Date().toISOString(),
      userId: data.userId, action: data.meritAction,
      points: data.points, balance: data.balance||0,
      campaignId: data.campaignId||'', note: data.note||'', onChain: 'no'
    });
    return jsonRes({ ok: true, ledgerId: ledgerId });
  }
  
  // ── DUYET DANG KY (admin) ─────────────────────────────────
  if (action === 'approve') {
    var sheet = getSheet('DANG_KY');
    var rows = sheet.getDataRange().getValues();
    var headers = rows[0];
    var regIdx = headers.indexOf('regId');
    var statusIdx = headers.indexOf('status');
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][regIdx] === data.regId) {
        sheet.getRange(i+1, statusIdx+1).setValue('approved');
        return jsonRes({ ok: true, regId: data.regId, status: 'approved' });
      }
    }
    return jsonRes({ ok: false, error: 'regId not found' });
  }
  
  return jsonRes({ ok: false, error: 'Unknown action: ' + action });
}

// ── THONG BAO VDV ANH DA CO ───────────────────────────────────
function notifyVDVPhotoReady(bibNo) {
  try {
    var regSheet = getSheet('DANG_KY');
    var rows = regSheet.getDataRange().getValues();
    var headers = rows[0];
    var bibIdx = headers.indexOf('bibNo') >= 0 ? headers.indexOf('bibNo') : -1;
    var emailIdx = headers.indexOf('email');
    var nameIdx = headers.indexOf('fullName');
    var logSheet = getSheet('PHOTO_LOG');
    var logRows = logSheet.getDataRange().getValues();
    var logHeaders = logRows[0];
    var logBibIdx = logHeaders.indexOf('bibNo');
    var notifiedIdx = logHeaders.indexOf('notified');
    
    // Tim email VDV theo BIB
    var email = '', name = '';
    rows.slice(1).forEach(function(r) {
      // Match BIB hoac fullName neu BIB chua cap nhat
      if (r[emailIdx] && !email) { email = r[emailIdx]; name = r[nameIdx]; }
    });
    
    if (email) {
      MailApp.sendEmail({
        to: email,
        subject: '[HLRace] Anh cua ban da san sang!',
        body: 'Xin chao ' + name + ',\n\n' +
              'Anh race cua ban (BIB: ' + bibNo + ') da duoc cap nhat.\n' +
              'Vao my-profile.html de xem va tai ve.\n\n' +
              'HLRace Team\nlehoang81@gmail.com'
      });
      
      // Cap nhat trang thai trong PHOTO_LOG
      for (var i = 1; i < logRows.length; i++) {
        if (logRows[i][logBibIdx] === bibNo && logRows[i][notifiedIdx] === 'no') {
          logSheet.getRange(i+1, notifiedIdx+1).setValue('yes');
          logSheet.getRange(i+1, logHeaders.indexOf('notifiedAt')+1).setValue(new Date().toISOString());
        }
      }
    }
  } catch(e) {
    Logger.log('Notify error: ' + e.toString());
  }
}

// ── TRIGGER: Tu dong check anh moi moi 30 phut ───────────────
function triggerPhotoCheck() {
  // Chay qua cac thu muc PREMIUM/STANDARD/BASIC
  // Tim file moi, doi chieu voi PHOTO_LOG, gui thong bao neu chua gui
  var folders = [
    { folderId: FOLDER_PREMIUM,  pkg: 'premium'  },
    { folderId: FOLDER_STANDARD, pkg: 'standard' },
    { folderId: FOLDER_BASIC,    pkg: 'basic'    }
  ];
  
  var logSheet = getSheet('PHOTO_LOG');
  var logRows = logSheet.getDataRange().getValues();
  var loggedFiles = {};
  logRows.slice(1).forEach(function(r) { if(r[2]) loggedFiles[r[2]] = true; });
  
  folders.forEach(function(f) {
    if (!f.folderId) return;
    try {
      var parentFolder = DriveApp.getFolderById(f.folderId);
      var subFolders = parentFolder.getFolders();
      while (subFolders.hasNext()) {
        var sub = subFolders.next();
        var files = sub.getFiles();
        while (files.hasNext()) {
          var file = files.next();
          var name = file.getName();
          if (!loggedFiles[name] && (name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png'))) {
            // Extract BIB tu ten file: A001_01.jpg -> A001
            var bibNo = name.split('_')[0];
            var logId = makeId('PLOG');
            appendRow('PHOTO_LOG', {
              logId: logId, bibNo: bibNo, fileName: name,
              driveFileId: file.getUrl(),
              uploadedBy: 'auto_trigger',
              uploadAt: new Date().toISOString(),
              notified: 'no', notifiedAt: ''
            });
            notifyVDVPhotoReady(bibNo);
            loggedFiles[name] = true;
          }
        }
      }
    } catch(e) {
      Logger.log('Trigger error folder ' + f.pkg + ': ' + e.toString());
    }
  });
  Logger.log('triggerPhotoCheck done: ' + new Date().toISOString());
}

// ── SETUP TRIGGER TU DONG ─────────────────────────────────────
function setupTriggers() {
  // Xoa trigger cu
  ScriptApp.getProjectTriggers().forEach(function(t) { ScriptApp.deleteTrigger(t); });
  // Tao trigger moi: chay moi 30 phut
  ScriptApp.newTrigger('triggerPhotoCheck')
    .timeBased().everyMinutes(30).create();
  SpreadsheetApp.getUi().alert('Da cai trigger tu dong moi 30 phut!');
}

// ── MENU TRONG GOOGLE SHEETS ──────────────────────────────────
function onOpen() {
  SpreadsheetApp.getUi().createMenu('HLRace v17')
    .addItem('1. Khoi tao tat ca sheet',  'initAllSheets')
    .addItem('2. Cai trigger tu dong',    'setupTriggers')
    .addItem('3. Check anh moi ngay',     'triggerPhotoCheck')
    .addSeparator()
    .addItem('Test: Ping API',            'testPing')
    .addToUi();
}

function testPing() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var url = ss.getUrl();
  SpreadsheetApp.getUi().alert('HLRace API v17 dang chay!\nSpreadsheet: ' + ss.getName());
}
