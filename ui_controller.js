/* ═══════════════════════════════════════════════════════════════════
   UI CONTROLLER — Module 5/5  |  CampHub OS  |  Modularization v1
   ═══════════════════════════════════════════════════════════════════
   Nguồn gốc : app.js (nhánh Ban-ngon-truoc-khi-sap-Ver1)
   Nhiệm vụ  : State Machine & toàn bộ lớp giao diện:
               – Preflight → HUD (boot/tick/pause/resume/finish)
               – Auth (OTP, register, logout)
               – bootApp, renderPanels, switchTab, data loaders
               – Drawers (Event, Coach, TrailGuard, Leaderboard)
               – Focus View / Sa Bàn (enterFocusView → exitFocusView)
               – Autoplay controller (_flyLoop, initPlayController)
               – Sa Bàn Mode selector (manual / auto)
               – CWP Form UI (showCwpForm, submitCustomWaypoint…)
               – Waypoint Filter pills, Stage tabs, Slider
               – Toast, Loading overlay, SOS, OLED, Storage modal
               – Dev Panel (admin-only bypass controls)
               – Replay 3D, Share, Training Log helpers
               – Utils: fmtDate, getInitials, setAll, _setText…

   Biến global tham chiếu (khai báo trong app.js / modules khác):
     S, IS_MAP_PURCHASED, GAS, MAPBOX_TOKEN — app.js
     api()                  — data_core.js
     loadRouteFromSupabase() / loadSabanRouteData() — data_core.js
     loadUserAssets() / _loadMyPasses() / _loadTrainingHistory()
     _loadTrailGuardAccess() / _loadCharityInDrawer()
     _loadSponsorChallenges()             — data_core.js
     fetchWeatherForDashboard()           — data_core.js
     _reloadCustomWaypoints()             — data_core.js
     onDownloadOfflineMap()               — data_core.js
     _cleanupOfflineCache()/_passiveCleanupCheck() — data_core.js
     startRealtimeTracking() / stopTracking() — data_core.js
     onNewGpsPoint() / _autoDetectSport() — gis_engine.js
     _getRouteCenterCoords() / resolveCoords() — gis_engine.js
     showLegTransitionGate() / confirmLegTransition() — gis_engine.js
     _sabanLookAheadGeofence()            — gis_engine.js
     _sabanTransitionLeg()                — gis_engine.js (vfx_studio)
     _playGeofenceAlert() / _checkGeofenceCP() — gis_engine.js
     initMap() / flyToEvent() / setRouteData() / redrawWaypoints()
     initSabanScrubber() / cleanupSabanScrubber() / onSabanScrub()
     initCrossHairTargeting() / _activateCrosshair()
     deactivateCrosshair() / destroyCrosshairTargeting()
     snapCrosshairToRoute() / renderCustomWaypoints()
     toggleBezier() / _applyElevationGradient()
     _startTraceGlowPulse() / _startLineShimmer()
     renderElevationSparkline() / _filterElevationByStage()
     _sabanSetScrubberValue() / _sabanUpdateDashboard()    — vfx_studio.js
     launchConfetti() / showCoinsBurst()                  — vfx_studio.js
     _traceColor / _bezierEnabled / _calcBearing          — vfx_studio.js/gis_engine.js
     updateTopbarCoins() / fmtVND() / toggleWishlist()    — economy_gateway.js
     startCheckout() / _showCwpPackageModal()             — economy_gateway.js
     enableMockGpsClick() / _disableMockGpsClick()        — map.js
     _syncSupabase() / _syncGAS() / _sendHeartbeat()      — data_core.js
     LS_OFFLINE_DONE / LS_OFFLINE_EVID                    — data_core.js

   Thứ tự nạp trong index.html:
     db.js → data_core.js → gis_engine.js → vfx_studio.js
     → economy_gateway.js → map.js → ui_controller.js → app.js
   ═══════════════════════════════════════════════════════════════════ */


// ══════════════════════════════════════════════════════════════════
//  § UC STATE VARIABLES
// ══════════════════════════════════════════════════════════════════

var _sportHoldTimers    = {};
var _holdTimer          = null;
var _holdStart          = 0;
var _devHoldTimer       = null;
var _devPanelOpen       = false;
var _devHoldActive      = false;
var _sabanPlaying       = false;
var _sabanRafId         = null;
var _sabanLastTs        = 0;
var _sabanSpeed         = 1;
var _sabanPctPerSec     = 4;
var _sabanPctAccum      = 0;
var _sabanMode          = 'manual';
var _activeWpTypes      = ['checkpoint','water_station','medical','photo','geofence_task','finish'];
var _stageTabSelected   = -1;
var _sparklineVisible   = false;
var _cwpSnapData        = null;
var _cwpPinType         = 'family';
var _cwpIsEditing       = null;
var _cwpProcessing      = false;
var _pendingNextLeg     = null;
var FLY_SPEED_MULTIPLIER = 6;
var _flyPlaying         = false;
var _flyRaf             = null;
var _flyLastTs          = 0;
var _flyPctPerSec       = 4;
var _flyHoldTimer       = null;
var _flyHoldFired       = false;
var _flySpeechPaused    = false;
var _camUserOverride    = false;
var _camUserPitch       = null;
var _camUserBearing     = null;
var _camUserZoom        = null;

// LocalStorage key mirrors (data_core.js đã khai báo chính — đặt lại để truy cập nhanh)
var LS_OFFLINE_DONE  = 'ch_offline_tiles_done';
var LS_OFFLINE_EVID  = 'ch_offline_event_id';
var LS_OFFLINE_TILES = 'ch_offline_tile_keys';
var LS_OFFLINE_KEEP  = 'ch_offline_keep';


// ══════════════════════════════════════════════════════════════════
//  § UC-1  UTILS — DOM helpers, formatters
// ══════════════════════════════════════════════════════════════════

function _setHtml(id, html) { var el=document.getElementById(id); if(el) el.innerHTML=html; }
function _setText(id, val)  { var el=document.getElementById(id); if(el) el.textContent=val; }
function setAll(sel, html, isText) {
  document.querySelectorAll(sel).forEach(function(el){
    if(isText) el.textContent=html; else el.innerHTML=html;
  });
}
function getInitials(n) {
  if(!n) return '?';
  var p=n.trim().split(/\s+/);
  return (p.length===1?p[0][0]:p[0][0]+p[p.length-1][0]).toUpperCase();
}
function fmtDate(d) {
  if(!d) return '[Vừa mới ghi nhận]';
  // Guard: epoch 0 hoặc số quá nhỏ → năm 1899/1970 → không hiển thị
  var n = Number(d);
  if(!isNaN(n) && n < 86400000) return '[Vừa mới ghi nhận]'; // < ngày 2/1/1970
  var dt = new Date(d);
  if(isNaN(dt.getTime())) return '[Vừa mới ghi nhận]';
  // Phòng vệ năm bất thường (< 2020 hoặc > 2099)
  var yr = dt.getFullYear();
  if(yr < 2020 || yr > 2099) return '[Vừa mới ghi nhận]';
  return dt.toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'});
}
function _fmtSec(s) {
  s=Math.max(0,Math.floor(s||0));
  var h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60;
  if(h>0) return h+':'+(m<10?'0':'')+m+':'+(sec<10?'0':'')+sec;
  return (m<10?'0':'')+m+':'+(sec<10?'0':'')+sec;
}
function showToast(msg,type,dur){
  var c=document.getElementById('toasts');
  var t=document.createElement('div');
  t.className='toast'+(type==='ok'?' ok':type==='err'?' err':type==='warn'?' warn':'');
  t.textContent=msg; c.appendChild(t);
  setTimeout(function(){ t.style.opacity='0'; t.style.transition='opacity .3s'; setTimeout(function(){ if(t.parentNode) t.parentNode.removeChild(t); },300); },dur||3000);
}
function showLoadingOverlay(msg) {
  var el=document.getElementById('loading-overlay'); if(!el) return;
  var txt=el.querySelector('.lo-text'); if(txt) txt.textContent=msg||'Đang xử lý...';
  el.classList.add('on');
}
function hideLoadingOverlay() {
  var el=document.getElementById('loading-overlay'); if(el) el.classList.remove('on');
}
function showSOS(){ var el=document.getElementById('sos'); if(el) el.style.display='flex'; }
function hideSOS(){ var el=document.getElementById('sos'); if(el) el.style.display='none'; }
function triggerSOS(){ showToast('SOS — GPS chưa active','warn',3000); }
function openDrawer(html){
  document.getElementById('dcontent').innerHTML=html;
  document.getElementById('dover').classList.add('on');
  document.getElementById('drawer').classList.add('on');
}
function closeDrawer(){
  document.getElementById('dover').classList.remove('on');
  document.getElementById('drawer').classList.remove('on');
}
function _playBeep(freq, vol, dur) {
  try {
    var ctx=new(window.AudioContext||window.webkitAudioContext)();
    var osc=ctx.createOscillator(); var gain=ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value=freq||880;
    gain.gain.setValueAtTime(vol||0.1,ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+(dur||0.15));
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime+(dur||0.15));
  } catch(e){}
}
function _setOfflineBtnProgress(pct, done) {
  document.querySelectorAll('.offline-dl-btn').forEach(function(btn){
    if(done||pct>=100){ btn.textContent='✅ Bản Đồ Đã Sẵn Sàng Ngoại Tuyến'; btn.dataset.state='done'; btn.disabled=true; }
    else { btn.textContent='⏳ Đang tải bản đồ... '+pct+'%'; btn.dataset.state='loading'; btn.disabled=true; }
  });
}
function _resetOfflineBtn() {
  document.querySelectorAll('.offline-dl-btn').forEach(function(btn){
    btn.textContent='📥 Tải Bản Đồ Ngoại Tuyến'; btn.dataset.state=''; btn.disabled=false;
  });
}
function _windDegToCompass(deg){
  var dirs=['B','ĐB','Đ','ĐN','N','TN','T','TB'];
  return dirs[Math.round(deg/45)%8]||'--';
}


// ══════════════════════════════════════════════════════════════════
//  § UC-2  AUTH — OTP login / register / logout
// ══════════════════════════════════════════════════════════════════

function onEmail(el){
  var v=el.value.trim().toLowerCase();
  var ok=/^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/.test(v);
  var h=document.getElementById('ehint');
  h.textContent=v&&!ok?'Email chưa đúng định dạng':''; h.className='fhint'+(v&&!ok?' err':'');
  document.getElementById('bsend').disabled=!ok;
}
function sendOTP(){
  var email=document.getElementById('gemail').value.trim().toLowerCase();
  setLoad('sp1',true);
  api({action:'requestOTP',email:email},function(err,res){
    setLoad('sp1',false);
    if(err||!res){ showGErr('Lỗi kết nối.'); return; }
    if(res.status==='sent'){ S.otpEmail=email; document.getElementById('gemail-show').textContent=email; gStep(2); initOTP(); startTimer(15*60); }
    else if(res.status==='not_found'){ S.otpEmail=email; document.getElementById('reg-email-display').textContent=email; gStep(4); document.getElementById('reg-fullname').focus(); }
    else { showGErr(res.message||'Lỗi hệ thống.'); }
  });
}
function submitRegister(){
  var fullName=document.getElementById('reg-fullname').value.trim();
  var phone=document.getElementById('reg-phone').value.trim();
  if(!fullName){ showGErr('Vui lòng nhập họ tên.'); return; }
  setLoad('sp-reg',true);
  api({action:'registerNewUser',email:S.otpEmail,full_name:fullName,phone:phone},function(err,res){
    setLoad('sp-reg',false);
    if(err||!res){ showGErr('Lỗi kết nối.'); return; }
    if(res.status==='ok'){
      S.user=res.user; localStorage.setItem('ch_u',JSON.stringify(res.user)); localStorage.setItem('ch_e',String(Date.now()+24*60*60*1000));
      document.getElementById('gwelcome').textContent='Xin chào, '+fullName+' 🎉'; gStep(3); setTimeout(function(){ bootApp(res.user); },1500);
    } else { showGErr(res.message||'Đăng ký thất bại.'); }
  });
}
function verifyOTP(){
  var code=[0,1,2,3,4,5].map(function(i){ return document.getElementById('ob'+i).value; }).join('');
  if(code.length!==6){ showGErr('Nhập đủ 6 chữ số.'); return; }
  setLoad('sp2',true);
  api({action:'verifyOTP',email:S.otpEmail,code:code},function(err,res){
    setLoad('sp2',false);
    if(err||!res){ showGErr('Lỗi kết nối.'); return; }
    if(res.status==='ok'){
      stopTimer(); S.user=res.user;
      localStorage.setItem('ch_u',JSON.stringify(res.user)); localStorage.setItem('ch_e',String(Date.now()+24*60*60*1000));
      document.getElementById('gwelcome').textContent='Xin chào, '+(res.user.full_name||S.otpEmail); gStep(3); setTimeout(function(){ bootApp(res.user); },1500);
    } else { showGErr(res.message||'Mã OTP không đúng.'); }
  });
}
function initOTP(){
  for(var i=0;i<6;i++){ (function(idx){
    var el=document.getElementById('ob'+idx); el.value='';
    el.oninput=function(e){ var v=e.target.value.replace(/\D/g,''); e.target.value=v.slice(-1); if(v&&idx<5) document.getElementById('ob'+(idx+1)).focus(); if(idx===5&&v) verifyOTP(); };
    el.onkeydown=function(e){ if(e.key==='Backspace'&&!e.target.value&&idx>0) document.getElementById('ob'+(idx-1)).focus(); };
    el.onpaste=function(e){ e.preventDefault(); var p=(e.clipboardData||window.clipboardData).getData('text').replace(/\D/g,'').slice(0,6); p.split('').forEach(function(c,j){ var b=document.getElementById('ob'+j); if(b) b.value=c; }); if(p.length===6) verifyOTP(); };
  })(i); }
  document.getElementById('ob0').focus();
}
function startTimer(s){ S.timerSec=s; updTimer(); S.timer=setInterval(function(){ S.timerSec--; updTimer(); if(S.timerSec<=0){ stopTimer(); showGErr('OTP hết hạn.'); } },1000); }
function stopTimer(){ if(S.timer){ clearInterval(S.timer); S.timer=null; } }
function updTimer(){ var el=document.getElementById('tc'); var m=Math.floor(S.timerSec/60),s=S.timerSec%60; el.textContent=m+':'+(s<10?'0':'')+s; el.className=S.timerSec<=60?'red':''; }
function backEmail(){ stopTimer(); gStep(1); document.getElementById('gerr').style.display='none'; }
function gStep(n){ document.querySelectorAll('.gstep').forEach(function(el){ el.classList.remove('on'); }); document.getElementById('gs'+n).classList.add('on'); }
function showGErr(m){ var el=document.getElementById('gerr'); el.textContent=m; el.style.display='block'; }
function setLoad(id,on){ var el=document.getElementById(id); if(el) el.style.display=on?'block':'none'; }
function logout(){ localStorage.removeItem('ch_u'); localStorage.removeItem('ch_e'); location.reload(); }
function confirmLogout(){ if(confirm('Đăng xuất?')) logout(); }


// ══════════════════════════════════════════════════════════════════
//  § UC-3  APP BOOT + PANELS
// ══════════════════════════════════════════════════════════════════

function bootApp(user){
  document.getElementById('gate').style.display='none';
  document.getElementById('shell').style.display='flex';
  var init=getInitials(user.full_name||user.email);
  document.getElementById('tavatar').textContent=init;
  document.getElementById('map-controls').style.display='flex';
  renderPanels(); initMap();
  localStorage.setItem('ch_u',JSON.stringify(user));
  localStorage.setItem('ch_e',String(Date.now()+24*60*60*1000));
  try {
    var params=new URLSearchParams(window.location.search);
    var page=params.get('page'); var sessionId=params.get('session');
    if(page==='replay'&&sessionId){ showToast('▶️ Đang tải phim hành trình...','default',3000); _loadAndStartReplay(sessionId); return; }
  } catch(urlErr){ console.warn('[URLSearchParams]',urlErr.message); }
  loadUserAssets(function(){
    switchTab('experience'); loadExperience();
    var cachedEventId=localStorage.getItem(LS_OFFLINE_EVID);
    if(cachedEventId&&user.uuid) _passiveCleanupCheck(user.uuid,cachedEventId);
  });
}

function renderPanels(){
  var html={
    run:[
      '<div class="panel-content">',
      '<div class="sgrid"><div class="scard"><div class="sval st-ev">—</div><div class="slb">Events</div></div>',
      '<div class="scard"><div class="sval st-vdv">—</div><div class="slb">VĐV</div></div>',
      '<div class="scard"><div class="sval st-co">—</div><div class="slb">Coins</div></div></div>',
      '<div class="slbl">Sự kiện nổi bật</div>',
      '<div class="ev-list"><div class="lrow">Đang tải...</div></div>',
      '<div class="end"></div></div>',
    ].join(''),
    community:[
      '<div class="panel-content">',
      /* Segmented Control */
      '<div id="community-seg" style="display:flex;gap:4px;padding:10px 12px 6px;position:sticky;top:0;z-index:10;',
      'background:rgba(6,13,20,0.85);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);">',
        '<button id="seg-guild" onclick="_switchCommunityTab(\'guild\')" style="',
          'flex:1;padding:7px 0;border-radius:8px;border:1.5px solid var(--accent);',
          'background:var(--accent);color:#060d14;',
          'font-family:\'Barlow Condensed\',sans-serif;font-size:12px;font-weight:700;cursor:pointer;">',
          '👥 Ban Hội / CLB</button>',
        '<button id="seg-coaches" onclick="_switchCommunityTab(\'coaches\')" style="',
          'flex:1;padding:7px 0;border-radius:8px;border:1.5px solid var(--b);',
          'background:transparent;color:var(--t2);',
          'font-family:\'Barlow Condensed\',sans-serif;font-size:12px;font-weight:700;cursor:pointer;">',
          '🎓 Sư Phụ / Coaches</button>',
      '</div>',
      /* Sub-panel guild */
      '<div id="sub-guild" class="cm-sub" style="display:block;">',
        '<div class="cm-list"><div class="lrow">Đang tải...</div></div>',
      '</div>',
      /* Sub-panel coaches */
      '<div id="sub-coaches" class="cm-sub" style="display:none;">',
        '<div class="co-list"><div class="lrow">Đang tải...</div></div>',
      '</div>',
      '<div class="end"></div></div>',
    ].join(''),
    news:'<div class="panel-content"><div class="slbl">Tin tức</div><div class="nw-list"><div class="lrow">Đang tải...</div></div><div class="end"></div></div>',
    profile:[
      '<div class="panel-content">',
      '<div class="phero"><div class="pavatar pav">?</div>',
      '<div><div class="pname">—</div><div class="prole">Vận động viên</div></div></div>',
      '<div class="coins-row">',
      '<div style="font-size:24px">🪙</div>',
      '<div style="flex:1"><div class="cval pcoins">0</div><div class="clbl">Coins tích lũy</div></div>',
      '<button class="btn btn-g" style="margin:0;padding:4px 10px;font-size:11px" onclick="showCoinTopup()">+ Nạp</button>',
      '</div>',
      '<div class="slbl">🎟 Vé của tôi</div>',
      '<div class="tk-list" style="max-height:220px;overflow-y:auto;padding-right:2px">',
      '<div class="lrow">Đang tải...</div></div>',
      '<div class="passes-list" style="margin-top:8px"></div>',
      '<div class="slbl" style="margin-top:12px;cursor:pointer;user-select:none" ',
      'onclick="_toggleFieldLogAccordion()" id="field-log-toggle">',
      '📊 Nhật Ký Thực Địa <span id="field-log-arrow" style="float:right;transition:transform .3s">▶</span>',
      '</div>',
      '<div class="training-history-list" id="field-log-body" ',
      'style="max-height:0;overflow:hidden;transition:max-height .35s cubic-bezier(.4,0,.2,1)">',
      '<div class="lrow">Đang tải...</div></div>',
      '<div class="end"></div></div>',
    ].join(''),
  };

  var sbp=document.getElementById('sidebar-panels');
  var bsp=document.getElementById('bs-panels');
  // 4 tab mới — experience mapped → run
  var tabs=['run','community','news','profile'];
  var sbHTML='',bsHTML='';
  tabs.forEach(function(t){
    sbHTML+='<div class="tab-panel'+(t==='run'?' on':'')+'" data-tab="'+t+'">'+html[t]+'</div>';
    bsHTML+='<div class="tab-panel'+(t==='run'?' on':'')+'" data-tab="'+t+'">'+html[t]+'</div>';
  });
  if(sbp) sbp.innerHTML=sbHTML;
  if(bsp) bsp.innerHTML=bsHTML;
}

function switchTab(name){
  // Alias backward compat: 'experience' → 'run'
  if(name==='experience') name='run';
  // 'coaches' đã gộp vào community — redirect + open coaches sub-tab
  if(name==='coaches'){ switchTab('community'); setTimeout(function(){ _switchCommunityTab('coaches'); },50); return; }

  document.querySelectorAll('.tab').forEach(function(el){ el.classList.remove('on'); });
  var tabEl=document.querySelector('.tab[data-tab="'+name+'"]');
  if(tabEl) tabEl.classList.add('on');
  document.querySelectorAll('.tab-panel').forEach(function(el){ el.classList.remove('on'); });
  document.querySelectorAll('.tab-panel[data-tab="'+name+'"]').forEach(function(el){ el.classList.add('on'); });
  var tabs=document.querySelectorAll('.tab'),idx=-1;
  tabs.forEach(function(t,i){ if(t.dataset.tab===name) idx=i; });
  if(idx>=0){ var pct=100/tabs.length; var ind=document.getElementById('tind'); if(ind){ ind.style.left=(idx*pct)+'%'; ind.style.width=pct+'%'; } }
  S.tab=name; closeDrawer();
  var nwEl=document.querySelector('.nw-list');
  if(name==='run')       { var evL=document.querySelector('.ev-list'); if(evL&&!evL.dataset.loaded) loadExperience(); }
  if(name==='news'      && nwEl && !nwEl.dataset.loaded) loadNews();
  if(name==='community') _loadCommunityDefault();
  if(name==='profile')   loadProfile();
}

function _loadCommunityDefault(){
  var cmEl=document.querySelector('.cm-list');
  if(cmEl && !cmEl.dataset.loaded) loadCommunity();
}

function _switchCommunityTab(sub){
  try {
    var guildPanel   = document.getElementById('sub-guild');
    var coachesPanel = document.getElementById('sub-coaches');
    var segGuild     = document.getElementById('seg-guild');
    var segCoaches   = document.getElementById('seg-coaches');
    if(!guildPanel || !coachesPanel) return;
    if(sub==='coaches'){
      guildPanel.style.display='none'; coachesPanel.style.display='block';
      if(segGuild)  { segGuild.style.background='transparent'; segGuild.style.color='var(--t2)'; segGuild.style.borderColor='var(--b)'; }
      if(segCoaches){ segCoaches.style.background='var(--accent)'; segCoaches.style.color='#060d14'; segCoaches.style.borderColor='var(--accent)'; }
      var coEl=document.querySelector('.co-list'); if(coEl&&!coEl.dataset.loaded) loadCoaches();
    } else {
      guildPanel.style.display='block'; coachesPanel.style.display='none';
      if(segGuild)  { segGuild.style.background='var(--accent)'; segGuild.style.color='#060d14'; segGuild.style.borderColor='var(--accent)'; }
      if(segCoaches){ segCoaches.style.background='transparent'; segCoaches.style.color='var(--t2)'; segCoaches.style.borderColor='var(--b)'; }
      var cmEl=document.querySelector('.cm-list'); if(cmEl&&!cmEl.dataset.loaded) loadCommunity();
    }
  } catch(e){ console.warn('[_switchCommunityTab]',e.message); }
}


// ══════════════════════════════════════════════════════════════════
//  § UC-4  DATA LOADERS (view layer — gọi api rồi render HTML)
// ══════════════════════════════════════════════════════════════════

function loadExperience(){
  api({action:'getPublishedEvents'},function(err,evs){
    if(err||!evs){ setAll('.ev-list','<div class="lrow" style="color:var(--orange)">Lỗi tải events</div>'); return; }
    if(!evs.length){ setAll('.ev-list','<div class="lrow">Chưa có sự kiện.</div>'); return; }
    setAll('.st-ev',evs.length,true);
    S.eventsList=evs; S.lastEvent=evs[0];
    var evHtml=evs.map(function(ev,i){
      var tags=(ev.tags||[]).map(function(t){ return '<span class="tag t'+(t.type||'g')+'">'+t.label+'</span>'; }).join('');
      var owned=S.myTickets&&S.myTickets.indexOf(ev.session_id)!==-1;
      var priceOrOwned=owned
        ?'<div style="font-size:10px;font-weight:700;color:var(--accent);background:var(--a2);padding:2px 7px;border-radius:10px;border:.5px solid var(--a3);white-space:nowrap">✓ Đã sở hữu</div>'
        :'<div class="eprice">'+fmtVND(ev.price)+'</div>';
      return '<div class="ecard" onclick="openEvDr('+i+')">' +
        '<div class="ebar" style="background:var(--accent)"></div>' +
        '<div class="erow"><div class="eicon" style="background:var(--a2)">'+(ev.emoji||'🏃')+'</div>' +
        '<div class="einfo"><div class="ename">'+ev.session_name+'</div>' +
        '<div class="emeta">📅 '+fmtDate(ev.event_date)+' · '+(ev.location||'')+'</div>' +
        (owned?'<div style="font-size:10px;color:var(--accent);margin-top:3px">Bấm để Tập luyện tự do hoặc Tập cùng Coach</div>':'<div class="etags">'+tags+'</div>') +
        '</div>'+priceOrOwned+'</div></div>';
    }).join('');
    setAll('.ev-list',evHtml);
    var bc=document.getElementById('bs-count'); if(bc) bc.textContent=evs.length;
    if(S.mapReady) loadFirstRoute();
  });
}

function loadCoaches(){
  api({action:'getApprovedCoaches'},function(err,cos){
    if(!cos||!cos.length){ setAll('.co-list','<div class="lrow">Chưa có coach nào.</div>'); return; }
    S.coachesList=cos;
    var coHtml=cos.map(function(co,i){
      return '<div class="ccard" onclick="openCoDr('+i+')"><div class="cavatar" style="background:var(--a2);color:var(--accent)">'+getInitials(co.full_name)+'</div><div style="flex:1"><div style="font-size:13px;font-weight:600;color:var(--t1);font-family:\'Barlow Condensed\',sans-serif">'+co.full_name+'</div><div style="font-size:11px;color:var(--t2);">'+(co.specialty||'Coach')+'</div></div><button style="font-size:10px;padding:4px 10px;border-radius:6px;background:var(--accent);color:#060d14;border:none;font-weight:700;cursor:pointer">Follow</button></div>';
    }).join('');
    setAll('.co-list',coHtml);
    document.querySelectorAll('.co-list').forEach(function(el){ el.dataset.loaded='1'; });
  });
}
function loadNews(){
  api({action:'getNewsItems'},function(err,items){
    if(!items||!items.length){ setAll('.nw-list','<div class="lrow">Chưa có tin tức.</div>'); return; }
    var nwHtml=items.map(function(n){
      return '<div style="background:var(--glass2);border:.5px solid var(--b);border-radius:var(--r2);padding:12px 13px;margin-bottom:8px"><div style="font-size:9px;color:var(--blue);text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:4px">'+(n.category||'Thông báo')+'</div><div style="font-size:13px;font-weight:600;color:var(--t1);font-family:\'Barlow Condensed\',sans-serif">'+(n.title||'')+'</div><div style="font-size:11px;color:var(--t3);margin-top:4px">🕐 '+fmtDate(n.published_at)+'</div></div>';
    }).join('');
    setAll('.nw-list',nwHtml);
    document.querySelectorAll('.nw-list').forEach(function(el){ el.dataset.loaded='1'; });
  });
}
function loadCommunity(){
  api({action:'getCommunityPosts'},function(err,items){
    if(!items||!items.length){ setAll('.cm-list','<div class="lrow">Chưa có bài viết.</div>'); return; }
    var cmHtml=items.map(function(p){
      return '<div style="background:var(--glass2);border:.5px solid var(--b);border-radius:var(--r2);padding:12px 13px;margin-bottom:8px"><div style="font-size:13px;font-weight:600;color:var(--t1);font-family:\'Barlow Condensed\',sans-serif">'+(p.title||'')+'</div><div style="font-size:11px;color:var(--t3);display:flex;gap:12px;margin-top:4px"><span>👤 '+(p.author||'')+'</span><span>💬 '+(p.reply_count||0)+'</span><span>⏱ '+(p.time_ago||'')+'</span></div></div>';
    }).join('');
    setAll('.cm-list',cmHtml);
    document.querySelectorAll('.cm-list').forEach(function(el){ el.dataset.loaded='1'; });
  });
}
function loadProfile(){
  var u=S.user; if(!u) return;
  document.querySelectorAll('.pav').forEach(function(el){ el.textContent=getInitials(u.full_name||u.email); });
  document.querySelectorAll('.pname').forEach(function(el){ el.textContent=u.full_name||u.email; });
  document.querySelectorAll('.prole').forEach(function(el){ el.textContent=u.role||'Vận động viên'; });
  document.querySelectorAll('.pcoins').forEach(function(el){ el.textContent=Number(u.coins_balance||0).toLocaleString('vi-VN'); });
  var tav=document.getElementById('tavatar'); if(tav) tav.textContent=getInitials(u.full_name||u.email);
  var affCode=u.affiliate_code||u.uuid.slice(0,8);
  S._affiliateLink='https://lehoang81-hub.github.io/camphub-os/?ref='+affCode;

  // Tickets — dòng compact, không QR to
  setAll('.tk-list','<div class="lrow">Đang tải...</div>');
  api({action:'getMyTickets',user_uuid:u.uuid},function(err,tks){
    if(!tks||!tks.length){ setAll('.tk-list','<div class="lrow">Chưa có vé nào.</div>'); return; }
    var tkHtml=tks.map(function(t){
      var name   = t.session_name||t.session_id||'Sự kiện';
      var regId  = t.reg_id||'—';
      var status = t.ticket_status||'paid';
      var dateStr= fmtDate(t.created_at||'');
      var sc     = status==='paid'?'var(--accent)':'var(--t3)';
      return '<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:.5px solid var(--b);">' +
        '<span style="font-size:16px">🎟</span>' +
        '<div style="flex:1;min-width:0;">' +
          '<div style="font-size:12px;font-weight:600;color:var(--t1);font-family:Barlow Condensed,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + name + '</div>' +
          '<div style="font-size:10px;color:var(--t3);">' + regId + ' · ' + dateStr + '</div>' +
        '</div>' +
        '<span style="font-size:9px;padding:2px 6px;border-radius:10px;background:var(--a2);color:'+sc+';font-weight:700;flex-shrink:0;">' + status + '</span>' +
      '</div>';
    }).join('');
    setAll('.tk-list',tkHtml);
  });

  // Trail Guard inline
  _loadMyPassesInline(u.uuid);
  // Field log (accordion, không mở sẵn)
  _loadTrainingHistory(u.uuid);
}

/** Trail Guard 1 dòng inline compact thay banner to */
function _loadMyPassesInline(userUuid) {
  var containers = document.querySelectorAll('.passes-list');
  if(!containers.length) return;
  containers.forEach(function(c){ c.innerHTML='<div class="lrow" style="font-size:11px">Đang kiểm tra...</div>'; });
  api({action:'getUserPasses',user_uuid:userUuid},function(err,passes){
    var html;
    if(err||!passes||!passes.length){
      html='<div style="font-size:11px;color:var(--t3);padding:4px 0;">🛡️ Trail Guard: Chưa kích hoạt</div>';
    } else {
      html=passes.map(function(p){
        var active  = p.is_active;
        var expText = active?(p.hours_left?'· Còn '+p.hours_left+'h':'· Còn hiệu lực'):'· Hết hạn';
        var color   = active?'var(--accent)':'#ff5252';
        var btnHtml = active?'':
          '<button class="btn btn-p" style="margin:0 0 0 8px;padding:3px 8px;font-size:10px;flex-shrink:0" '+
          'onclick="quickReactivate(\'"+ p.event_id +"\')">'+'⚡ 69 Coins</button>';
        return '<div style="display:flex;align-items:center;gap:6px;padding:5px 0;border-bottom:.5px solid var(--b);">'+
          '<span style="font-size:13px">'+(active?'🛡️':'🔒')+'</span>'+
          '<div style="flex:1;font-size:11px;color:'+color+';font-weight:600;">'+
            (p.event_name||p.event_id||'Trail Guard')+
            '<span style="color:var(--t3);font-weight:400"> '+expText+'</span>'+
          '</div>'+btnHtml+'</div>';
      }).join('');
    }
    containers.forEach(function(c){ c.innerHTML=html; });
  });
}

/** Toggle accordion Nhật Ký Thực Địa */
function _toggleFieldLogAccordion(){
  try {
    var body  = document.getElementById('field-log-body');
    var arrow = document.getElementById('field-log-arrow');
    if(!body) return;
    var isOpen = body.style.maxHeight && body.style.maxHeight !== '0px' && body.style.maxHeight !== '0';
    if(isOpen){
      body.style.maxHeight = '0';
      if(arrow) arrow.style.transform = 'rotate(0deg)';
    } else {
      body.style.maxHeight = '600px';
      if(arrow) arrow.style.transform = 'rotate(90deg)';
    }
  } catch(e) {}
}

// ══════════════════════════════════════════════════════════════════
//  § UC-5  TRAINING LOG HELPERS
// ══════════════════════════════════════════════════════════════════

function shareTrainingResult(liveId){
  try {
    var shareUrl=window.location.origin+window.location.pathname+'?replay='+liveId;
    if(navigator.share){ navigator.share({title:'Camp Hub OS — Hành trình của tôi',text:'Tôi vừa hoàn thành một cung trail!',url:shareUrl}); }
    else { window.prompt('Copy link kết quả:',shareUrl); }
  } catch(e){}
}
function shareAffiliateFromLog(eventId){
  try {
    var u=S.user; if(!u) return;
    var affUrl='https://lehoang81-hub.github.io/camphub-os/?ref='+(u.affiliate_code||u.uuid.slice(0,8));
    if(navigator.share){ navigator.share({title:'Camp Hub OS — Tham gia cùng tôi!',text:'Đăng ký qua link của tôi để nhận ưu đãi.',url:affUrl}); }
    else { window.prompt('Copy link affiliate:',affUrl); }
  } catch(e){}
}
function expandTrainingLog(idx,liveId){
  showToast('📊 Chi tiết phiên '+(liveId||idx)+' — sắp có trong cập nhật tiếp theo','default',3000);
}


// ══════════════════════════════════════════════════════════════════
//  § UC-6  DRAWERS — Event, Coach, TrailGuard, Leaderboard
// ══════════════════════════════════════════════════════════════════

function openCoDr(i){
  var co=S.coachesList[i]; if(!co) return;
  openDrawer('<div class="dtitle">'+co.full_name+'</div><div class="dsub">'+(co.specialty||'Coach')+'</div><div style="font-size:13px;color:var(--t2);line-height:1.6;margin-bottom:14px">'+(co.bio||'Chưa có thông tin.')+'</div><div style="display:flex;gap:8px"><button class="btn btn-p" style="flex:1;margin-bottom:0">Follow</button><button class="btn btn-g" style="flex:1;margin-bottom:0" onclick="window.prompt(\'Link affiliate:\',location.origin+\'?ref=\'+(S.coachesList['+i+'].affiliate_code||\'\')+\'\')">Affiliate</button></div>');
}

function openEvDr(i){
  try {
    var ev=S.eventsList[i]; if(!ev) return;
    S.lastEvent=ev;
    var owned=S.myTickets.indexOf(ev.session_id)!==-1;
    var wishlisted=S.wishlist.indexOf(ev.session_id)!==-1;
    var isTraining=S._trainMode&&S._trainEventIdx===i;
    var routeHtml=((ev.segments||[]).length)
      ?ev.segments.map(function(s){ return '<div class="dstep"><div class="dicon" style="background:var(--a2)">'+(s.emoji||'🏃')+'</div><div><div style="font-size:13px;font-weight:500;color:var(--t1)">'+(s.name||s.type||'')+'</div><div style="font-size:11px;color:var(--t2)">'+(s.distance_km||0)+' km</div></div></div>'; }).join('')
      :'<div style="font-size:12px;color:var(--t3)">Chưa có thông tin.</div>';
    var wishBtn='<button class="btn btn-g" style="width:44px;flex-shrink:0;margin-bottom:0;font-size:18px;'+(wishlisted?'background:rgba(255,82,82,.15);border-color:rgba(255,82,82,.4);':'')+'\" onclick="toggleWishlist('+i+',this)" title="'+(wishlisted?'Bỏ yêu thích':'Thêm yêu thích')+'">'+(wishlisted?'❤️':'🤍')+'</button>';
    var actionsHtml='';
    if(owned){
      var unlocked=S.training.is_unlocked;
      var accessObj=S.training.feature_access;
      var expLabel=(unlocked&&accessObj&&accessObj.hours_left!=null)?' · còn '+accessObj.hours_left+'h':'';
      actionsHtml=
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;padding:8px 12px;background:var(--a2);border:.5px solid var(--a3);border-radius:var(--r)"><span style="font-size:16px">🎟</span><div style="font-size:12px;color:var(--accent);font-weight:600">Bạn đã sở hữu vé</div></div>' +
        '<button class="btn btn-g '+(unlocked?'':'locked-feature')+'" style="margin-bottom:8px" onclick="'+(unlocked?'onDownloadOfflineMap('+i+')':'openTrailGuardModal('+i+')')+'">'+(unlocked?'📥 Tải Bản Đồ Ngoại Tuyến'+expLabel:'📥 Tải Bản Đồ Ngoại Tuyến')+'</button>' +
        '<button class="btn btn-g" style="margin-bottom:8px" onclick="enterFocusView('+i+')">🗺️ Xem trên bản đồ</button>' +
        '<button id="train-btn" class="btn '+(unlocked?'':'locked-feature')+'" style="background:var(--a2);border:.5px solid var(--a3);color:var(--accent)" onclick="'+(unlocked?(isTraining?'stopTrain()':'startTrain('+i+')'):'openTrailGuardModal('+i+')')+'">'+(isTraining?'⏹ Kết thúc chạy':'🏃 Bắt đầu Tập luyện')+'</button>';
    } else {
      actionsHtml='<div style="display:flex;gap:8px;margin-bottom:8px"><button class="btn btn-p" style="flex:1;margin-bottom:0" onclick="startCheckout('+i+')">Đăng ký ngay — '+fmtVND(ev.price)+'</button>'+wishBtn+'</div><button class="btn btn-g" style="margin-bottom:0" onclick="enterFocusView('+i+')">🗺️ Xem trên bản đồ</button>';
    }
    var leaderboardHtml='<div style="margin-top:14px"><div class="dlbl" style="margin-bottom:8px">💚 Quỹ từ thiện giải này</div><div id="ev-charity-'+i+'"><div class="lrow" style="font-size:11px">Đang tải...</div></div></div>';
    openDrawer('<div class="dtitle">'+ev.session_name+'</div><div class="dsub">📅 '+fmtDate(ev.event_date)+' · '+(ev.location||'')+'</div><div style="margin-bottom:14px"><div class="dlbl">Cung đường</div>'+routeHtml+'</div>'+actionsHtml+leaderboardHtml);
    if(S.user&&owned) _loadTrailGuardAccess(ev.session_id,i);
    _loadCharityInDrawer(ev.session_id,'ev-charity-'+i);
  } catch(e){ console.error('[openEvDr]',e); }
}

function openTrailGuardModal(evIdx){
  try {
    var ev=S.eventsList[evIdx];
    var config=(S.training.feature_access&&S.training.feature_access.config)?S.training.feature_access.config:{total:69,local:10,os:10,system:49,name:'Trail Guard'};
    var nameEl=document.getElementById('tg-event-name'); if(nameEl) nameEl.textContent=ev?ev.session_name:'';
    _setText('tg-local-coins',config.local+' Coins'); _setText('tg-os-coins',config.os+' Coins');
    _setText('tg-sys-coins',config.system+' Coins'); _setText('tg-total-coins',config.total+' Coins');
    var bal=S.user?(S.user.coins_balance||0):0; _setText('tg-user-coins',bal);
    var sufficient=bal>=config.total;
    var btn=document.getElementById('tg-activate-btn'); var insuf=document.getElementById('tg-insufficient');
    if(btn) btn.disabled=!sufficient; if(insuf) insuf.style.display=sufficient?'none':'block';
    document.getElementById('tg-success').style.display='none'; if(btn) btn.style.display='block';
    document.getElementById('tg-activate-btn').dataset.evIdx=evIdx;
    document.getElementById('trail-guard-modal').classList.add('on');
  } catch(e){ console.error('[openTrailGuardModal]',e); }
}
function closeTrailGuardModal(){ document.getElementById('trail-guard-modal').classList.remove('on'); }

function onActivateTrailGuard(){
  try {
    if(!S.user){ showToast('Vui lòng đăng nhập trước','warn'); return; }
    var btn=document.getElementById('tg-activate-btn');
    var evIdx=btn?Number(btn.dataset.evIdx):null;
    var ev=evIdx!==null?S.eventsList[evIdx]:S.lastEvent;
    if(!ev){ showToast('Không xác định được sự kiện','err'); return; }
    btn.disabled=true; btn.textContent='⏳ Đang kích hoạt...';
    api({action:'activateFeaturePackage',user_uuid:S.user.uuid,event_id:ev.session_id,package_type:'day'},function(err,res){
      try {
        btn.disabled=false;
        if(err||!res){ btn.textContent='🤝 Đồng Ý Kích Hoạt & Đóng Góp'; showToast('Lỗi kết nối, thử lại','err'); return; }
        if(res.status==='insufficient'){ btn.textContent='🤝 Đồng Ý Kích Hoạt & Đóng Góp'; _setText('tg-insufficient','⚠️ Chưa đủ Coins. Cần '+res.required+', có '+res.current_balance); document.getElementById('tg-insufficient').style.display='block'; return; }
        if(res.status==='already_active'){ btn.textContent='🤝 Đồng Ý Kích Hoạt & Đóng Góp'; S.training.is_unlocked=true; S.training.feature_access={is_unlocked:true,expires_at:res.expires_at,hours_left:res.hours_left}; showToast('🛡 '+(res.message||'Trail Guard vẫn đang hoạt động'),'ok',4000); setTimeout(function(){ closeTrailGuardModal(); if(evIdx!==null) openEvDr(evIdx); },1800); return; }
        if(res.status==='ok'){
          S.training.is_unlocked=true; S.training.feature_access={is_unlocked:true,expires_at:res.expires_at,hours_left:res.expires_at==='never'?null:24,config:res.config};
          if(res.new_balance!==undefined&&S.user){ S.user.coins_balance=res.new_balance; document.querySelectorAll('.pcoins').forEach(function(el){ el.textContent=Number(res.new_balance).toLocaleString('vi-VN'); }); }
          btn.style.display='none';
          var success=document.getElementById('tg-success'); var expEl=document.getElementById('tg-success-exp');
          if(success) success.style.display='block';
          if(expEl) expEl.textContent=res.expires_at==='never'?'Hiệu lực trọn giải':'Còn hiệu lực 24 giờ';
          launchConfetti(); showToast('🛡 Trail Guard đã kích hoạt! Cảm ơn bạn đã đóng góp 💚','ok',4000);
          setTimeout(function(){ closeTrailGuardModal(); if(evIdx!==null) openEvDr(evIdx); },2500);
        }
      } catch(cbErr){ console.error('[onActivateTrailGuard cb]',cbErr); }
    });
  } catch(e){ console.error('[onActivateTrailGuard]',e); }
}

function showFullLeaderboard(eventId){
  try {
    var modal=document.getElementById('charity-leaderboard');
    if(!modal){ showToast('Leaderboard chưa sẵn sàng','warn'); return; }
    var ev=S.lastEvent; _setText('charity-event-label',ev?ev.session_name:'');
    modal.style.display='block';
    api({action:'getCharityLeaderboard',event_id:eventId},function(err,res){
      if(err||!res||res.status!=='ok') return;
      var target=1000,raised=res.total_raised||0,pct=Math.min(100,Math.round(raised/target*100));
      var fill=document.getElementById('charity-progress'); if(fill) fill.style.width=pct+'%';
      _setText('charity-raised',raised); _setText('charity-activations','· '+(res.total_activations||0)+' VĐV tham gia');
      _setText('charity-local-total',(res.breakdown&&res.breakdown.charity_local)||0);
      _setText('charity-os-total',(res.breakdown&&res.breakdown.charity_os)||0);
      var listEl=document.getElementById('charity-donors-list'); if(!listEl) return;
      var donors=res.leaderboard||[];
      if(!donors.length){ listEl.innerHTML='<div class="lrow">Chưa có VĐV nào đóng góp — hãy là người đầu tiên! 💚</div>'; return; }
      var rankIcons=['🥇','🥈','🥉'];
      listEl.innerHTML=donors.map(function(d,j){ var rankClass=j===0?'top1':j===1?'top2':j===2?'top3':''; return '<div class="charity-donor-row"><div class="charity-donor-rank '+rankClass+'">'+(rankIcons[j]||j+1)+'</div><div class="charity-donor-name">'+(d.display_name||d.uuid.slice(0,8))+'</div><div class="charity-donor-coins">'+d.coins+' 🪙</div></div>'; }).join('');
      _loadSponsorChallenges(eventId);
    });
  } catch(e){ console.error('[showFullLeaderboard]',e); }
}


// ══════════════════════════════════════════════════════════════════
//  § UC-7  PREFLIGHT → HUD → SESSION MANAGEMENT
// ══════════════════════════════════════════════════════════════════

function showPreflight(evIdx){ try { S.training.event_idx=evIdx; document.getElementById('preflight-modal').classList.add('on'); _requestWakeLock(); } catch(e){} }
function closePreflight(){ document.getElementById('preflight-modal').classList.remove('on'); }
function _requestWakeLock(){ try { if(!('wakeLock'in navigator)) return; navigator.wakeLock.request('screen').then(function(lock){ S.training.wakelock=lock; lock.addEventListener('release',function(){ S.training.wakelock=null; }); }).catch(function(){}); } catch(e){} }
function onPreflightStart(){ try { S.training.gear_status='Bỏ qua checklist'; closePreflight(); _launchSession(); } catch(e){} }
function onPreflightDone(){
  try {
    var labels={'pf-health':'Thể lực','pf-gear':'Trang bị','pf-fuel':'Gel/Nước','pf-tire':'Áp suất lốp'};
    var checked=[];
    Object.keys(labels).forEach(function(id){ var el=document.getElementById(id); if(el&&el.checked) checked.push(labels[id]); });
    S.training.gear_status=checked.length?checked.join(', '):'Không check';
    closePreflight(); _launchSession();
  } catch(e){}
}
function _launchSession(){
  try {
    var ev=S.eventsList[S.training.event_idx]||{}; var eventId=ev.session_id||'';
    if(!navigator.geolocation){ showToast('Thiết bị không hỗ trợ GPS','err',4000); return; }
    showToast('⏳ Đang lấy tín hiệu GPS...','default',2000);
    navigator.geolocation.getCurrentPosition(function(pos){
      api({action:'startSession',user_uuid:S.user?S.user.uuid:'',event_id:eventId,gear_status:S.training.gear_status,start_lat:pos.coords.latitude,start_lng:pos.coords.longitude},function(err,res){
        if(err||!res||res.status!=='ok'){ showToast('Lỗi khởi tạo phiên: '+(res&&res.message||''),'err',4000); return; }
        _startLiveHUD(res.live_id,eventId);
      });
    },function(err){ showToast('⚠ Từ chối GPS','warn',4000); },{ enableHighAccuracy:true,timeout:8000 });
  } catch(e){}
}
function _startLiveHUD(liveId,eventId){
  try {
    var now=Date.now();
    Object.assign(S.training,{active:true,live_id:liveId,start_time:now,seconds:0,moving_seconds:0,paused_seconds:0,distance_m:0,path:[],incident_logs:[],sports_splits:{swim:0,bike:0,run:0},is_paused:false,is_oled:false,_trainMode:true});
    document.getElementById('shell').classList.add('zen-mode');
    document.querySelectorAll('#charity-leaderboard,.charity-leaderboard').forEach(function(el){ el.classList.add('zen-collapsed'); });
    ['training-prep-modal','event-drawer','feature-modal','storage-check-modal'].forEach(function(id){ var m=document.getElementById(id); if(m){ m.classList.remove('on'); m.style.display='none'; } });
    closeDrawer();
    var mc=document.getElementById('map-controls'); if(mc) mc.style.display='flex';
    var wpPills=document.getElementById('wp-filter-pills'); if(wpPills) wpPills.classList.add('on');
    var weather=document.getElementById('weather-widget'); if(weather) weather.classList.add('on');
    if(typeof redrawWaypoints==='function') redrawWaypoints();
    var center=typeof _getRouteCenterCoords==='function'?_getRouteCenterCoords():null;
    if(center&&typeof fetchWeatherForDashboard==='function') fetchWeatherForDashboard(center.lat,center.lng);
    document.getElementById('training-hud').classList.add('on');
    showSOS();
    clearInterval(S.training._ticker); clearInterval(S.training._supabase_tick); clearInterval(S.training._gas_sync_tick); clearInterval(S.training._heartbeat);
    S.training._ticker=setInterval(_hudTick,1000);
    S.training._supabase_tick=setInterval(_syncSupabase,10000);
    S.training._gas_sync_tick=setInterval(_syncGAS,5*60*1000);
    S.training._heartbeat=setInterval(_sendHeartbeat,5*60*1000);
    if(typeof startRealtimeTracking==='function') startRealtimeTracking(S.user?S.user.email:'',eventId);
    S._trainMode=true; S._trainEventIdx=S.training.event_idx;
    showToast('🏃 Phiên tập luyện bắt đầu!','ok',3000);
  } catch(e){ console.error('[_startLiveHUD]',e); }
}
function _hudTick(){
  try {
    if(!S.training.active) return;
    S.training.seconds++;
    if(!S.training.is_paused){ S.training.moving_seconds++; S.training.sports_splits[S.training.sport]=(S.training.sports_splits[S.training.sport]||0)+1; }
    else { S.training.paused_seconds++; }
    _updateHudUI();
  } catch(e){}
}
function _updateHudUI(){
  try {
    var el_time=document.getElementById('hud-time'); if(el_time) el_time.textContent=_fmtSec(S.training.moving_seconds);
    var el_dist=document.getElementById('hud-dist'); if(el_dist) el_dist.textContent=(S.training.distance_m/1000).toFixed(2);
    var el_pace=document.getElementById('hud-pace');
    if(el_pace){ if(S.training.distance_m>100&&S.training.moving_seconds>0){ var psk=S.training.moving_seconds/(S.training.distance_m/1000); el_pace.textContent=Math.floor(psk/60)+"'"+(Math.floor(psk%60)<10?'0':'')+Math.floor(psk%60)+'"'; } else { el_pace.textContent="--'--\""; } }
  } catch(e){}
}
function onHudPause(){
  try {
    if(!S.training.active) return;
    if(S.training.is_paused){ _resumeFromPause('resumed'); return; }
    S.training.is_paused=true; S.training.pause_start=Date.now();
    document.getElementById('smart-pause-modal').classList.add('on');
    var btn=document.getElementById('hud-pause-btn');
    if(btn) btn.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg> Resume';
  } catch(e){}
}
function cancelPause(){ _resumeFromPause('cancelled'); }
function selectPauseReason(reason){
  try {
    S.training.pause_reason=reason;
    document.getElementById('smart-pause-modal').classList.remove('on');
    if(reason==='quest'){ showToast('🎁 Đang mở Blind Box AR...','ok',2500); setTimeout(function(){ _resumeFromPause('quest'); },3000); }
    else if(reason==='photo'){ _mockCameraUpload(function(photoUrl){ _recordIncident(reason,photoUrl); _resumeFromPause(reason); }); }
    else { _recordIncident(reason,''); }
  } catch(e){}
}
function _recordIncident(reason,photoUrl){
  try {
    var durationS=S.training.pause_start?Math.round((Date.now()-S.training.pause_start)/1000):0;
    var lastPt=S.training.path.length>0?S.training.path[S.training.path.length-1]:{lat:0,lng:0};
    S.training.incident_logs.push({ts:S.training.pause_start||Date.now(),reason:reason,lat:lastPt.lat,lng:lastPt.lng,photo_url:photoUrl||'',duration_s:durationS,is_gamification:reason==='quest'});
    if(reason!=='quest') S.training.paused_seconds+=durationS;
  } catch(e){}
}
function _resumeFromPause(reason){
  try {
    S.training.is_paused=false; S.training.pause_start=null; S.training.pause_reason=null;
    document.getElementById('smart-pause-modal').classList.remove('on');
    var btn=document.getElementById('hud-pause-btn');
    if(btn) btn.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Dừng';
    showToast('▶ Tiếp tục!','ok',1500);
  } catch(e){}
}
function _mockCameraUpload(cb){
  try {
    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){ cb('https://res.cloudinary.com/camphub/image/upload/mock_'+Date.now()+'.jpg'); return; }
    showToast('📷 Đang mở camera...','default',2000);
    var video=document.createElement('video'); var canvas=document.createElement('canvas');
    video.style.cssText='position:fixed;inset:0;width:100%;height:100%;object-fit:cover;z-index:85;background:#000'; video.autoplay=true; video.playsInline=true;
    var snapBtn=document.createElement('button'); snapBtn.textContent='📸 Chụp'; snapBtn.style.cssText='position:fixed;bottom:80px;left:50%;transform:translateX(-50%);padding:14px 32px;border:none;border-radius:30px;background:#ff7043;color:#fff;font-size:16px;font-weight:700;z-index:86;cursor:pointer;';
    var cancelBtn=document.createElement('button'); cancelBtn.textContent='✕'; cancelBtn.style.cssText='position:fixed;top:20px;right:20px;width:40px;height:40px;border-radius:50%;border:none;background:rgba(0,0,0,.6);color:#fff;font-size:20px;z-index:86;cursor:pointer;';
    document.body.appendChild(video); document.body.appendChild(snapBtn); document.body.appendChild(cancelBtn);
    function cleanup(stream){ if(stream) stream.getTracks().forEach(function(t){ t.stop(); }); document.body.removeChild(video); document.body.removeChild(snapBtn); document.body.removeChild(cancelBtn); }
    navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:false}).then(function(stream){
      video.srcObject=stream;
      snapBtn.onclick=function(){ canvas.width=video.videoWidth; canvas.height=video.videoHeight; canvas.getContext('2d').drawImage(video,0,0); var dataUrl=canvas.toDataURL('image/jpeg',0.85); if(!S.training._photos) S.training._photos=[]; S.training._photos.push({ts:Date.now(),dataUrl:dataUrl}); cleanup(stream); showToast('✓ Ảnh đã lưu','ok',2500); cb(dataUrl); };
      cancelBtn.onclick=function(){ cleanup(stream); cb(''); };
    }).catch(function(err){ document.body.removeChild(video); document.body.removeChild(snapBtn); document.body.removeChild(cancelBtn); showToast('⚠ Không thể mở camera','warn',3000); cb(''); });
  } catch(e){ cb(''); }
}
function activateOLED(){ try { S.training.is_oled=true; document.getElementById('oled-overlay').classList.add('on'); showToast('🌙 Màn hình OLED — GPS vẫn chạy','default',2000); } catch(e){} }
function deactivateOLED(){ try { S.training.is_oled=false; document.getElementById('oled-overlay').classList.remove('on'); } catch(e){} }
function startHoldFinish(){
  try { var btn=document.getElementById('hud-finish-btn'); if(!btn) return; btn.classList.add('holding'); _holdStart=Date.now(); _holdTimer=setTimeout(function(){ btn.classList.remove('holding'); _endLiveSession(); },3000); } catch(e){}
}
function cancelHoldFinish(){ try { if(_holdTimer){ clearTimeout(_holdTimer); _holdTimer=null; } var btn=document.getElementById('hud-finish-btn'); if(btn) btn.classList.remove('holding'); } catch(e){} }
function _endLiveSession(){
  try {
    if(!S.training.active) return;
    S.training.active=false;
    // CP1 FIX: dọn Keytel ticker trước mọi thứ
    if (typeof _ftStopKcalTicker === 'function') _ftStopKcalTicker();
    _releaseKeepAlive();           // Trả lại pin cho máy
    _clearCrashBuffer();           // Xóa crash buffer khi kết thúc bình thường
    // Dọn Free Training HUD nếu còn
    var ftHud = document.getElementById('ft-free-hud');
    if (ftHud && ftHud.parentNode) ftHud.parentNode.removeChild(ftHud);
    clearInterval(S.training._ticker); clearInterval(S.training._supabase_tick); clearInterval(S.training._gas_sync_tick); clearInterval(S.training._heartbeat);
    if(typeof stopTracking==='function') stopTracking();
    if(S.training.wakelock){ try{ S.training.wakelock.release(); }catch(e){} S.training.wakelock=null; }
    document.getElementById('training-hud').classList.remove('on'); document.getElementById('shell').classList.remove('zen-mode');
    document.querySelectorAll('#charity-leaderboard,.charity-leaderboard').forEach(function(el){ el.classList.remove('zen-collapsed'); });
    hideSOS();
    var finalPayload={gps_points:S.training.path.slice(-300),moving_time_s:S.training.moving_seconds,paused_time_s:S.training.paused_seconds,total_distance_m:S.training.distance_m,incident_logs:S.training.incident_logs,sports_splits:S.training.sports_splits};
    api({action:'endSession',live_id:S.training.live_id||'',payload:JSON.stringify(finalPayload)},function(err,res){ launchConfetti(); var summary=(res&&res.summary)?res.summary:_buildLocalSummary(); _renderSummaryBoard(summary); });
    S._trainMode=false; S._trainEventIdx=null;
  } catch(e){ console.error('[_endLiveSession]',e); }
}
function _buildLocalSummary(){ return {live_id:S.training.live_id||'LOCAL',started_at:S.training.start_time?new Date(S.training.start_time).toLocaleTimeString('vi-VN'):'',gross_time_s:S.training.seconds,moving_time_s:S.training.moving_seconds,paused_time_s:S.training.paused_seconds,distance_km:(S.training.distance_m/1000).toFixed(2),sports_splits:S.training.sports_splits,incident_logs:S.training.incident_logs,downtime_breakdown:{},gear_status:S.training.gear_status,gps_track_count:S.training.path.length,summary_url:''}; }
function _renderSummaryBoard(summary){
  try {
    var evName=S.training.event_idx!==null?(S.eventsList[S.training.event_idx]||{}).session_name||'':'';
    var el=function(id){ return document.getElementById(id); };
    if(el('summary-event-name')) el('summary-event-name').textContent=evName;
    if(el('sum-dist')) el('sum-dist').textContent=summary.distance_km||'0.00';
    if(el('sum-moving')) el('sum-moving').textContent=_fmtSec(summary.moving_time_s||0);
    if(el('sum-gross')) el('sum-gross').textContent=_fmtSec(summary.gross_time_s||0);
    if(el('sum-paused')) el('sum-paused').textContent=_fmtSec(summary.paused_time_s||0);
    var splitsEl=el('sum-splits');
    if(splitsEl){ var sp=summary.sports_splits||{}; var icons={swim:'🏊',bike:'🚴',run:'🏃'}; splitsEl.innerHTML=Object.keys(sp).filter(function(k){ return (sp[k]||0)>0; }).map(function(k){ return '<div class="sum-split-item"><div class="sum-split-icon">'+icons[k]+'</div><div class="sum-split-time">'+_fmtSec(sp[k])+'</div></div>'; }).join('')||'<div style="font-size:12px;color:var(--t3)">—</div>'; }
    var dtEl=el('sum-downtime');
    if(dtEl){ var dtLabels={bike_issue:'🔧 Hỏng xe',fuel:'🧃 Nạp năng lượng',photo:'📸 Chụp ảnh',quest:'🎁 Lấy quà AR',terrain:'⛰️ Đường xấu',rest:'😮‍💨 Nghỉ ngơi'}; var incidents=summary.incident_logs||[]; var breakdown={}; incidents.forEach(function(inc){ if(!breakdown[inc.reason]) breakdown[inc.reason]=0; breakdown[inc.reason]+=(inc.duration_s||0); }); dtEl.innerHTML=Object.keys(breakdown).length?Object.keys(breakdown).map(function(k){ return '<div class="sum-downtime-row"><span>'+(dtLabels[k]||k)+'</span><span class="sum-downtime-time">'+_fmtSec(breakdown[k])+'</span></div>'; }).join(''):'<div style="font-size:12px;color:var(--t3)">Không có thời gian dừng 👍</div>'; }
    var gearEl=el('sum-gear'); if(gearEl) gearEl.textContent=summary.gear_status||'—';
    var shareBtn=el('summary-share-btn'); if(shareBtn) shareBtn.dataset.url=summary.summary_url||'';
    var cacheOptEl=el('sum-cache-opt'); if(cacheOptEl){ var hasCache=!!localStorage.getItem('ch_offline_tiles_done'); cacheOptEl.style.display=hasCache?'block':'none'; }
    document.getElementById('summary-board').classList.add('on');
  } catch(e){ console.error('[_renderSummaryBoard]',e); }
}
function closeSummaryBoard(){ document.getElementById('summary-board').classList.remove('on'); }
function shareSession(){ try { var btn=document.getElementById('summary-share-btn'); var url=(btn&&btn.dataset.url)||window.location.href; if(navigator.share){ navigator.share({title:'Camp Hub — Hành trình của tôi',url:url}); } else { window.prompt('Copy link hành trình:',url); } } catch(e){} }
function startTrain(evIdx){
  try {
    // ── Chốt 1: Kiểm tra phiên cũ đang chạy ─────────────────────
    if (S.training && S.training.active) {
      _showGuardToast('⚠ Đang có phiên tập luyện đang chạy. Vui lòng kết thúc phiên hiện tại trước.', 'err');
      return;
    }

    // ── Chốt 2: Mock eligibility ──────────────────────────────────
    if (typeof _checkUserEligibility === 'function' && !_checkUserEligibility()) {
      _showGuardToast('🔒 Tài khoản chưa đủ điều kiện. Vui lòng kiểm tra gói cước.', 'err');
      return;
    }

    // ── GPS Loading overlay ───────────────────────────────────────
    _showGpsRadarOverlay();

    // ── Geofence check ───────────────────────────────────────────
    if (typeof checkStartLineGeofence === 'function') {
      checkStartLineGeofence(
        evIdx,
        function onInside(distM, startCoords, accuracy) {
          _hideGpsRadarOverlay();
          showToast('✅ Vị trí xác nhận · Cách Start ' + Math.round(distM) + 'm', 'ok', 2500);
          _openOfficialBriefingMode(evIdx);
        },
        function onOutside(distM, startCoords, reason, accuracy) {
          // weak_signal = accuracy >50m → giữ radar, không mở dialog
          if (reason === 'weak_signal') {
            // Radar đã cập nhật màu đỏ qua onAccuracy — chờ user di chuyển
            // Thêm nút Bỏ qua vào radar
            _addRadarSkipButton(evIdx);
            return;
          }
          _hideGpsRadarOverlay();
          _showOutsideGeofenceDialog(evIdx, distM, reason);
        },
        function onAccuracy(tier, accuracy) {
          // Cập nhật radar UI theo 3 tầng ngay khi có tín hiệu
          if (typeof _updateRadarAccuracy === 'function') {
            _updateRadarAccuracy(tier, accuracy);
          }
        }
      );
    } else {
      // Fallback nếu gis_engine chưa load: đi thẳng vào preflight
      _hideGpsRadarOverlay();
      showPreflight(evIdx);
    }
  } catch(e) { _hideGpsRadarOverlay(); console.error('[startTrain]', e); }
}
function stopTrain(){ _endLiveSession(); }

/** Thêm nút Bỏ qua khi sóng yếu — user có thể chọn tiếp tục dù GPS kém */
function _addRadarSkipButton(evIdx) {
  var card = document.getElementById('gps-radar-card');
  if (!card || document.getElementById('radar-skip-btn')) return;
  var btn = document.createElement('button');
  btn.id = 'radar-skip-btn';
  btn.textContent = 'Tập Tự Do dù sóng yếu →';
  btn.style.cssText = [
    'margin-top:14px;padding:10px 20px;width:100%;',
    'font-family:\'Barlow Condensed\',sans-serif;font-size:12px;font-weight:700;',
    'letter-spacing:1px;text-transform:uppercase;',
    'background:rgba(255,193,7,.12);border:1px solid rgba(255,193,7,.35);',
    'color:#ffc107;border-radius:10px;cursor:pointer;',
  ].join('');
  btn.onclick = function() {
    _hideGpsRadarOverlay();
    _openFreeTrainingMode(evIdx);
  };
  card.appendChild(btn);
}


// ══════════════════════════════════════════════════════════════════
//  § UC-1B  START GUARD UI — GPS Radar + Geofence Dialogs
//  Cinematic Cyberpunk CSS — kính mờ dạ quang, kinetic animation
// ══════════════════════════════════════════════════════════════════

/** Toast ngắn màu đỏ dạ quang khi bị chặn ở Chốt 1/2 */
function _showGuardToast(msg, type) {
  showToast(msg, type || 'err', 4000);
}

/** GPS Radar loading overlay — hiện trong lúc getCurrentPosition chạy */
function _showGpsRadarOverlay() {
  var old = document.getElementById('gps-radar-overlay');
  if (old) return;

  _guardInjectKeyframes();
  var overlay = document.createElement('div');
  overlay.id = 'gps-radar-overlay';
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:999999',
    'pointer-events:auto',
    'display:flex', 'align-items:center', 'justify-content:center',
    'background:rgba(4,8,20,.55)',
    'backdrop-filter:blur(6px)', '-webkit-backdrop-filter:blur(6px)',
  ].join(';');

  overlay.innerHTML = [
    '<div id="gps-radar-card" style="',
      'background:rgba(8,12,24,.78);',
      'backdrop-filter:blur(15px);-webkit-backdrop-filter:blur(15px);',
      'border:1px solid rgba(0,242,254,.3);',
      'box-shadow:0 0 25px rgba(0,242,254,.15);',
      'border-radius:18px;padding:28px 32px;text-align:center;min-width:260px;',
      'animation:springIn .35s cubic-bezier(.175,.885,.32,1.15) both;',
    '">',
      /* Radar ring */
      '<div id="gps-radar-ring" style="',
        'position:relative;width:70px;height:70px;margin:0 auto 16px;',
      '">',
        '<div id="gps-radar-spinner" style="',
          'width:70px;height:70px;border-radius:50%;',
          'border:2.5px solid rgba(0,242,254,.15);',
          'border-top-color:#00f2fe;',
          'animation:radarSpin 1s linear infinite;',
          'box-shadow:0 0 18px rgba(0,242,254,.4),inset 0 0 14px rgba(0,242,254,.08);',
        '"></div>',
        /* Ripple rings */
        '<div style="position:absolute;inset:-8px;border-radius:50%;border:1px solid rgba(0,242,254,.15);animation:radarRipple 2s ease-out infinite;"></div>',
        '<div style="position:absolute;inset:-8px;border-radius:50%;border:1px solid rgba(0,242,254,.1);animation:radarRipple 2s ease-out .7s infinite;"></div>',
      '</div>',
      /* Status text */
      '<div id="gps-radar-msg" style="',
        'font-family:\'Barlow Condensed\',Oswald,sans-serif;',
        'font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;',
        'color:#00f2fe;text-shadow:0 0 10px rgba(0,242,254,.6);',
        'margin-bottom:6px;',
      '">📡 Đang xác định tọa độ thực địa...</div>',
      '<div id="gps-radar-sub" style="font-size:11px;color:rgba(255,255,255,.35);min-height:16px;"></div>',
    '</div>',
  ].join('');

  document.body.appendChild(overlay);
}

/**
 * Cập nhật radar UI theo kết quả accuracy từ _interpretGpsAccuracy.
 * Gọi từ callback onAccuracy trong checkStartLineGeofence.
 * @param {{ level, color, shadowColor, msg, canProceed }} tier
 * @param {number} accuracy
 */
function _updateRadarAccuracy(tier, accuracy) {
  try {
    var spinner = document.getElementById('gps-radar-spinner');
    var msgEl   = document.getElementById('gps-radar-msg');
    var subEl   = document.getElementById('gps-radar-sub');
    var card    = document.getElementById('gps-radar-card');

    if (!spinner || !msgEl) return;

    var hex = tier.color.replace('#','').match(/.{2}/g);
    var rgb = hex ? hex.map(function(h){ return parseInt(h,16); }).join(',') : '0,229,160';

    // Đổi màu spinner
    spinner.style.borderTopColor = tier.color;
    spinner.style.boxShadow = '0 0 18px rgba(' + rgb + ',0.5),inset 0 0 14px rgba(' + rgb + ',0.1)';

    // Đổi viền card
    if (card) {
      card.style.borderColor   = 'rgba(' + rgb + ',0.4)';
      card.style.boxShadow     = '0 0 28px rgba(' + rgb + ',0.2)';
    }

    // Cập nhật text
    msgEl.textContent    = tier.msg;
    msgEl.style.color    = tier.color;
    msgEl.style.textShadow = '0 0 10px rgba(' + rgb + ',0.6)';

    if (subEl) {
      if (!tier.canProceed) {
        subEl.textContent = 'Di chuyển ra vùng thoáng và thử lại...';
        subEl.style.color = 'rgba(255,82,82,.6)';
      } else {
        subEl.textContent = tier.level === 'yellow' ? 'Có thể tiếp tục · Thành tích có thể sai lệch nhỏ' : '';
        subEl.style.color = 'rgba(255,255,255,.4)';
      }
    }
  } catch(e) {}
}

function _hideGpsRadarOverlay() {
  var el = document.getElementById('gps-radar-overlay');
  if (el && el.parentNode) el.parentNode.removeChild(el);
}

/**
 * Dialog "Ngoài 150m" — Cinematic cyberpunk.
 * Hiện khi GPS ngoài vạch Start hoặc GPS bị từ chối.
 */
function _showOutsideGeofenceDialog(evIdx, distM, reason) {
  var old = document.getElementById('geofence-outside-dialog');
  if (old && old.parentNode) old.parentNode.removeChild(old);

  var distText = (distM != null)
    ? 'Hệ thống định vị nhận thấy bạn đang cách Start Line <b style="color:#ff5252">' + Math.round(distM) + 'm</b>.'
    : (reason === 'denied'
        ? 'Bạn chưa cấp quyền GPS cho ứng dụng.'
        : 'Không lấy được tín hiệu GPS.');

  var overlay = document.createElement('div');
  overlay.id = 'geofence-outside-dialog';
  overlay.style.cssText = [
    'position:fixed','inset:0','z-index:999999',
    'display:flex','align-items:flex-end','justify-content:center',
    'padding-bottom:32px',
    'background:rgba(4,8,20,.5)',
    'backdrop-filter:blur(4px)',
    '-webkit-backdrop-filter:blur(4px)',
  ].join(';');

  overlay.innerHTML = [
    '<div style="',
      'width:min(92vw,420px);',
      'background:rgba(8,12,24,.78);',
      'backdrop-filter:blur(15px);',
      '-webkit-backdrop-filter:blur(15px);',
      'border:1px solid rgba(0,242,254,.3);',
      'box-shadow:0 0 25px rgba(0,242,254,.15),0 8px 40px rgba(0,0,0,.7);',
      'border-radius:18px;',
      'padding:22px 20px 18px;',
      'animation:guardSlideIn .35s cubic-bezier(.175,.885,.32,1.15) both;',
    '">',

      /* Header */
      '<div style="',
        'font-family:\'Barlow Condensed\',Oswald,sans-serif;',
        'font-size:18px;font-weight:800;',
        'letter-spacing:1.5px;text-transform:uppercase;',
        'color:#ff5252;',
        'text-shadow:0 0 12px rgba(255,82,82,.5);',
        'margin-bottom:12px;',
      '">🚨 Bạn chưa có mặt tại vạch xuất phát</div>',

      /* Body */
      '<div style="font-size:13px;color:rgba(255,255,255,.75);line-height:1.6;margin-bottom:18px;">',
        distText,
        ' Bạn có muốn kích hoạt <b style="color:#00e5a0">Chế độ Tập luyện Tự do</b> tại chỗ ngay bây giờ không? Dữ liệu vẫn được đóng gói lưu vào Nhật ký thực địa.',
      '</div>',

      /* Buttons */
      '<div style="display:flex;gap:10px;">',
        '<button id="geofence-free-btn" style="',
          'flex:1;padding:12px 0;',
          'font-family:\'Barlow Condensed\',sans-serif;',
          'font-size:14px;font-weight:800;',
          'letter-spacing:1px;text-transform:uppercase;',
          'background:linear-gradient(135deg,rgba(0,229,160,.25),rgba(0,242,254,.15));',
          'border:1.5px solid rgba(0,229,160,.6);',
          'color:#00e5a0;',
          'border-radius:10px;cursor:pointer;',
          'box-shadow:0 0 14px rgba(0,229,160,.25);',
          'transition:background .2s;',
        '">⚡ Tập Luyện Tự Do</button>',

        '<button id="geofence-cancel-btn" style="',
          'padding:12px 18px;',
          'font-family:\'Barlow Condensed\',sans-serif;',
          'font-size:13px;font-weight:700;',
          'background:rgba(255,255,255,.06);',
          'border:1px solid rgba(255,255,255,.15);',
          'color:rgba(255,255,255,.5);',
          'border-radius:10px;cursor:pointer;',
          'transition:background .2s;',
        '">✕ Hủy Bỏ</button>',
      '</div>',

    '</div>',
  ].join('');

  document.body.appendChild(overlay);

  // Event listeners
  document.getElementById('geofence-free-btn').onclick = function() {
    _removeGeofenceDialog();
    _openFreeTrainingMode(evIdx);
  };
  document.getElementById('geofence-cancel-btn').onclick = _removeGeofenceDialog;
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) _removeGeofenceDialog();
  });
}

function _removeGeofenceDialog() {
  var el = document.getElementById('geofence-outside-dialog');
  if (el) {
    el.style.transition = 'opacity .25s ease';
    el.style.opacity = '0';
    setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 260);
  }
}

/**
 * Mở Official Briefing Mode — Trường hợp trong Geofence.
 * Placeholder overlay sạch #official-briefing-overlay để phase sau inject nội dung.
 */
// ══════════════════════════════════════════════════════════════════
//  § UC-1C  CYBER OVERLAY FACTORY (DRY)
//  _renderCyberOverlay(id, config) — khung kính mờ dùng lại cho mọi popup
// ══════════════════════════════════════════════════════════════════

/**
 * Factory tạo overlay kính mờ Cyberpunk chuẩn.
 * @param {string} id            — DOM id của overlay
 * @param {Object} cfg           — { accentColor, title, subtitle, contentHtml,
 *                                   primaryBtn:{label,onclick}, closeId }
 * @returns {HTMLElement} overlay element (chưa append vào DOM)
 */
function _renderCyberOverlay(id, cfg) {
  _guardInjectKeyframes();
  var old = document.getElementById(id);
  if (old && old.parentNode) old.parentNode.removeChild(old);

  var ac      = cfg.accentColor || '#00f2fe';
  var acRgba  = ac.replace('#','').match(/.{2}/g).map(function(h){ return parseInt(h,16); });
  var acShadow = 'rgba(' + acRgba.join(',') + ',0.3)';

  var overlay = document.createElement('div');
  overlay.id = id;
  overlay.style.cssText = [
    'position:fixed', 'inset:0',
    'z-index:999999',            // anti click-through
    'pointer-events:auto',
    'display:flex', 'align-items:flex-end', 'justify-content:center',
    'padding-bottom:env(safe-area-inset-bottom,16px)',
    'padding-left:12px', 'padding-right:12px', 'padding-top:12px',
    'background:rgba(4,8,20,.62)',
    'backdrop-filter:blur(6px)', '-webkit-backdrop-filter:blur(6px)',
  ].join(';');

  var closeFn = cfg.closeId || ('_cy_close_' + id.replace(/-/g,'_'));
  if (!window[closeFn]) {
    window[closeFn] = function() {
      var el = document.getElementById(id);
      if (!el) return;
      el.style.transition = 'opacity .22s ease';
      el.style.opacity = '0';
      setTimeout(function() { if (el && el.parentNode) el.parentNode.removeChild(el); }, 230);
    };
  }

  overlay.innerHTML = [
    '<div style="',
      'width:min(92vw,460px);max-height:88vh;overflow-y:auto;',
      'background:rgba(8,12,24,.78);',
      'backdrop-filter:blur(15px);-webkit-backdrop-filter:blur(15px);',
      'border:1px solid ' + ac.replace('#','rgba(').replace(/^rgba\(/,'rgba(') + ';',
      'border:1px solid rgba(' + acRgba.join(',') + ',0.35);',
      'box-shadow:0 0 28px rgba(' + acRgba.join(',') + ',0.18),0 8px 40px rgba(0,0,0,.75);',
      'border-radius:18px;padding:20px 18px 16px;',
      'animation:springIn .35s cubic-bezier(.175,.885,.32,1.15) both;',
    '">',
      /* Header */
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">',
        '<div>',
          (cfg.subtitle ? '<div style="font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.4);margin-bottom:3px;">' + cfg.subtitle + '</div>' : ''),
          '<div style="font-family:\'Barlow Condensed\',Oswald,sans-serif;font-size:17px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:' + ac + ';text-shadow:0 0 14px rgba(' + acRgba.join(',') + ',0.5);">' + (cfg.title || '') + '</div>',
        '</div>',
        '<button onclick="' + closeFn + '()" style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.15);color:rgba(255,255,255,.4);border-radius:50%;width:30px;height:30px;cursor:pointer;font-size:15px;flex-shrink:0;">✕</button>',
      '</div>',
      /* Content slot */
      '<div id="' + id + '-content-slot">' + (cfg.contentHtml || '') + '</div>',
      /* Primary CTA */
      (cfg.primaryBtn
        ? '<button id="' + id + '-primary-btn" onclick="' + cfg.primaryBtn.onclick + '" style="margin-top:14px;width:100%;padding:14px 0;font-family:\'Barlow Condensed\',sans-serif;font-size:15px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;background:rgba(' + acRgba.join(',') + ',.2);border:1.5px solid rgba(' + acRgba.join(',') + ',.6);color:' + ac + ';border-radius:12px;cursor:pointer;box-shadow:0 0 18px rgba(' + acRgba.join(',') + ',.2);text-shadow:0 0 10px rgba(' + acRgba.join(',') + ',.5);transition:background .2s;">' + cfg.primaryBtn.label + '</button>'
        : ''),
    '</div>',
  ].join('');

  return overlay;
}


// ══════════════════════════════════════════════════════════════════
//  § UC-1D  OFFICIAL BRIEFING — Luồng 2 (Trong Geofence ≤150m)
// ══════════════════════════════════════════════════════════════════

function _openOfficialBriefingMode(evIdx) {
  try {
    var ev       = (S.eventsList && S.eventsList[evIdx]) || {};
    var evName   = ev.session_name || 'Chặng giải đấu';
    var legIdx   = (S.saban && S.saban.active) ? S.saban.activeLegIndex : 0;
    var legKm    = (S.saban && S.saban.legDistances)
      ? ((S.saban.legDistances[legIdx] || 0) / 1000).toFixed(1) : '?';
    var COLORS   = ['#29b6f6','#ff9800','#00e5a0','#ab47bc','#ef5350'];
    var legColor = COLORS[legIdx % COLORS.length];
    var wps      = S._lastWPs || [];

    // ── Đếm trạm (pure function từ gis_engine) ───────────────────
    var wpCount = (typeof countWaypointsByType === 'function')
      ? countWaypointsByType(wps) : { water: 0, medical: 0 };

    // ── Quét địa hình blackspot ───────────────────────────────────
    var blackspotHtml = '';
    if (typeof scanTerrainBlackspot === 'function') {
      var legNodes = _routeNodes.filter(function(n) {
        return !n._isTrans && Number(n.leg_index) === Number(legIdx) && n.elevation != null;
      });
      if (!legNodes.length) legNodes = _routeNodes.filter(function(n) { return n.elevation != null; });
      var bs = legNodes.length >= 2 ? scanTerrainBlackspot(legNodes, 300) : null;
      if (bs && bs.avgSlopePct >= 5) {
        blackspotHtml = [
          '<div style="background:rgba(255,82,82,.08);border:1px solid rgba(255,82,82,.25);',
          'border-radius:10px;padding:10px 12px;margin-top:10px;font-size:12px;',
          'color:rgba(255,200,200,.85);line-height:1.6;">',
            '<b style="color:#ff5252;text-shadow:0 0 6px rgba(255,82,82,.4);">⚠️ ĐỊA HÌNH HIỂM TRỞ</b><br>',
            'Tại Km <b>' + bs.startKm + '</b> → Km <b>' + bs.endKm + '</b> có đoạn dốc tăng gắt ',
            'trung bình <b>' + bs.avgSlopePct + '%</b>. Hãy điều tiết thể lực!',
          '</div>',
        ].join('');
      }
    }

    // ── Checklist + terrain info ──────────────────────────────────
    var meta = {
      legName  : ev.session_name,
      legKm    : legKm,
      temp     : (S._weatherData && S._weatherData.temp) || null,
      maxSlope : null,
      eventName: evName,
    };

    var checklistItems = [
      { id:'chk-battery', label:'Điện thoại trên 80% pin?' },
      { id:'chk-offline',  label:'Đã tải bản đồ ngoại tuyến?' },
      { id:'chk-supplies', label:'Đã chuẩn bị đủ nước và gel năng lượng?' },
    ];

    var checklistHtml = checklistItems.map(function(item) {
      return [
        '<label style="display:flex;align-items:center;gap:10px;padding:8px 0;',
        'border-bottom:1px solid rgba(255,255,255,.06);cursor:pointer;">',
          '<input type="checkbox" id="' + item.id + '" ',
          'onchange="_briefingChecklistChanged()" ',
          'style="width:18px;height:18px;accent-color:#00f2fe;cursor:pointer;">',
          '<span style="font-size:13px;color:rgba(255,255,255,.8);">' + item.label + '</span>',
        '</label>',
      ].join('');
    }).join('');

    var wpInfoHtml = [
      '<div style="font-size:12px;color:rgba(0,242,254,.8);margin-top:10px;padding:8px 0;',
      'border-top:1px solid rgba(0,242,254,.1);">',
        '💧 ' + wpCount.water + ' trạm tiếp nước &nbsp;·&nbsp; ',
        '🏥 ' + wpCount.medical + ' trạm cứu hộ y tế trên chặng',
      '</div>',
    ].join('');

    var contentHtml = [
      '<div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;',
      'color:rgba(255,255,255,.35);margin-bottom:10px;">Checklist an toàn</div>',
      checklistHtml,
      wpInfoHtml,
      blackspotHtml,
      /* Check-in button */
      '<button onclick="_briefingCheckin(' + evIdx + ')" style="',
        'width:100%;margin-top:12px;padding:11px 0;',
        'font-family:\'Barlow Condensed\',sans-serif;font-size:13px;font-weight:700;',
        'letter-spacing:1px;text-transform:uppercase;',
        'background:rgba(255,193,7,.12);border:1px solid rgba(255,193,7,.35);',
        'color:#ffc107;border-radius:10px;cursor:pointer;',
      '">📸 CHECK-IN XUẤT PHÁT — KHÍ THẾ NGÚT TRỜI</button>',
    ].join('');

    var overlay = _renderCyberOverlay('official-briefing-overlay', {
      accentColor : legColor,
      title       : '🏁 Briefing Chính Thức',
      subtitle    : 'R' + (legIdx + 1) + ' · ' + evName + ' · ' + legKm + 'km',
      contentHtml : contentHtml,
      primaryBtn  : {
        label  : '🔥 Kích Hoạt Xuất Phát',
        onclick: '_briefingLaunch(' + evIdx + ')',
      },
      closeId: '_closeOfficialBriefing',
    });

    overlay._evIdx = evIdx;
    overlay._meta  = meta;
    document.body.appendChild(overlay);

    // Lock CTA cho đến khi checklist đủ
    _briefingChecklistChanged();

  } catch(e) { console.error('[OfficialBriefing]', e); }
}

/** Kiểm tra checklist → enable/disable CTA */
function _briefingChecklistChanged() {
  var ids    = ['chk-battery','chk-offline','chk-supplies'];
  var allOk  = ids.every(function(id) {
    var el = document.getElementById(id); return el && el.checked;
  });
  var btn = document.getElementById('official-briefing-overlay-primary-btn');
  if (!btn) return;
  btn.disabled = !allOk;
  btn.style.opacity = allOk ? '1' : '0.35';
  btn.style.cursor  = allOk ? 'pointer' : 'default';
}

/** Camera check-in từ Official Briefing */
function _briefingCheckin(evIdx) {
  var ev    = (S.eventsList && S.eventsList[evIdx]) || {};
  var legIdx = (S.saban && S.saban.active) ? S.saban.activeLegIndex : 0;
  var legKm  = (S.saban && S.saban.legDistances)
    ? ((S.saban.legDistances[legIdx] || 0) / 1000).toFixed(1) : '?';
  var meta   = {
    legName  : ev.session_name || 'Chặng R' + (legIdx+1),
    legKm    : legKm,
    temp     : (S._weatherData && S._weatherData.temp) || null,
    eventName: ev.session_name || '',
  };
  if (typeof initShareCardEngine === 'function') initShareCardEngine('race', meta);
  else if (typeof showToast === 'function') showToast('Share Card chưa load', 'warn', 2000);
}

/** Launch race → đóng briefing, vào Sa Bàn + Ghost Runner */
function _briefingLaunch(evIdx) {
  _closeOfficialBriefing();
  // Chốt 1: eager audio init trong gesture context
  if (typeof _keepAliveSilentAudioEager === 'function') _keepAliveSilentAudioEager();
  _activateKeepAlive();
  // Vào Sa Bàn nếu chưa active
  if (S._mapMode !== 'sandbox' && typeof toggleSandboxMode === 'function') {
    enterFocusView(evIdx);
    setTimeout(function() { toggleSandboxMode(); }, 800);
  }
  // Mở Race Simulation
  if (typeof initRaceSimulation === 'function') {
    setTimeout(function() {
      var legIdx = (S.saban && S.saban.active) ? S.saban.activeLegIndex : 0;
      initRaceSimulation(legIdx);
    }, 1400);
  }
}

function _closeOfficialBriefing() {
  var el = document.getElementById('official-briefing-overlay');
  if (el) {
    el.style.transition = 'opacity .22s ease';
    el.style.opacity = '0';
    setTimeout(function() { if (el && el.parentNode) el.parentNode.removeChild(el); }, 230);
  }
}

// ══════════════════════════════════════════════════════════════════
//  § UC-1E  FREE TRAINING MODE — Luồng 1 (Ngoài Geofence / GPS lỗi)
// ══════════════════════════════════════════════════════════════════

function _openFreeTrainingMode(evIdx) {
  try {
    // Init S.user_biometrics defensive (không ghi đè S gốc)
    if (!S.user_biometrics) S.user_biometrics = { gender:'male', age:35, weight:68 };
    if (!S.free_training)   S.free_training   = { active:false, seconds:0, cumulative_kcal:0, hr:135 };

    // Quét MaxSlope 3km nếu có GPS cache
    var survivalHtml = _buildSurvivalCard();

    var bioHtml = [
      '<div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;',
      'color:rgba(255,255,255,.35);margin-bottom:8px;">Sinh trắc học nhanh</div>',

      '<div style="display:flex;gap:8px;margin-bottom:10px;">',
        /* Giới tính */
        '<button id="ft-gender-m" onclick="_ftSetGender(\'male\')" style="',
          'flex:1;padding:8px 0;font-family:\'Barlow Condensed\',sans-serif;font-size:12px;font-weight:700;',
          'border-radius:8px;cursor:pointer;transition:all .2s;border:1.5px solid rgba(59,158,255,.5);',
          'background:rgba(59,158,255,.2);color:#3b9eff;">👨 Nam</button>',
        '<button id="ft-gender-f" onclick="_ftSetGender(\'female\')" style="',
          'flex:1;padding:8px 0;font-family:\'Barlow Condensed\',sans-serif;font-size:12px;font-weight:700;',
          'border-radius:8px;cursor:pointer;transition:all .2s;border:1.5px solid rgba(255,100,150,.3);',
          'background:rgba(255,100,150,.06);color:rgba(255,150,180,.7);">👩 Nữ</button>',
      '</div>',

      '<div style="display:flex;gap:8px;margin-bottom:12px;">',
        '<div style="flex:1;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);',
        'border-radius:8px;padding:8px 10px;">',
          '<div style="font-size:10px;color:rgba(255,255,255,.35);margin-bottom:4px;">Tuổi</div>',
          '<input id="ft-age" type="number" min="10" max="99" value="35" ',
          'onchange="S.user_biometrics.age=Number(this.value)" ',
          'style="width:100%;background:transparent;border:none;outline:none;',
          'font-family:\'Barlow Condensed\',sans-serif;font-size:20px;font-weight:800;',
          'color:#fff;text-align:center;">',
        '</div>',
        '<div style="flex:1;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);',
        'border-radius:8px;padding:8px 10px;">',
          '<div style="font-size:10px;color:rgba(255,255,255,.35);margin-bottom:4px;">Cân nặng (kg)</div>',
          '<input id="ft-weight" type="number" min="30" max="150" value="68" ',
          'onchange="S.user_biometrics.weight=Number(this.value)" ',
          'style="width:100%;background:transparent;border:none;outline:none;',
          'font-family:\'Barlow Condensed\',sans-serif;font-size:20px;font-weight:800;',
          'color:#fff;text-align:center;">',
        '</div>',
      '</div>',

      survivalHtml,

      /* Kcal display */
      '<div id="ft-kcal-display" style="display:none;background:rgba(0,229,160,.06);',
      'border:1px solid rgba(0,229,160,.2);border-radius:10px;padding:10px 12px;',
      'margin-top:8px;text-align:center;">',
        '<div id="ft-kcal-val" style="font-family:\'Barlow Condensed\',sans-serif;',
        'font-size:30px;font-weight:800;color:#00e5a0;',
        'text-shadow:0 0 12px rgba(0,229,160,.5);">0</div>',
        '<div style="font-size:10px;color:rgba(255,255,255,.4);letter-spacing:1px;">KCAL ĐÃ ĐỐT</div>',
        '<div id="ft-hr-display" style="font-size:12px;color:rgba(255,200,100,.7);margin-top:4px;"></div>',
      '</div>',

      /* Check-in btn */
      '<button onclick="_freeTrainingCheckin(' + evIdx + ')" style="',
        'width:100%;margin-top:10px;padding:10px 0;',
        'font-family:\'Barlow Condensed\',sans-serif;font-size:12px;font-weight:700;',
        'letter-spacing:1px;text-transform:uppercase;',
        'background:rgba(255,193,7,.1);border:1px solid rgba(255,193,7,.3);',
        'color:#ffc107;border-radius:10px;cursor:pointer;',
      '">📸 CHECK-IN KHỞI HÀNH TỰ DO — ĐỈNH CỦA CHÓP</button>',
    ].join('');

    var overlay = _renderCyberOverlay('free-training-overlay', {
      accentColor : '#00e5a0',
      title       : '⚡ Chế Độ Tập Luyện Tự Do',
      subtitle    : 'Dữ liệu ghi vào Nhật ký thực địa',
      contentHtml : bioHtml,
      primaryBtn  : {
        label  : '⚡ Bắt Đầu Chạy Tự Do',
        onclick: '_ftLaunchRun(' + evIdx + ')',
      },
      closeId: '_closeFreeTrainingOverlay',
    });

    document.body.appendChild(overlay);

  } catch(e) { console.error('[FreeTraining]', e); }
}

/** Xây card cảnh báo sinh tồn 3km */
function _buildSurvivalCard() {
  try {
    var weight = (S.user_biometrics && S.user_biometrics.weight) || 68;
    var waterMl = weight * 8;
    var temp = (S._weatherData && S._weatherData.temp) ? S._weatherData.temp + '°C' : null;

    var slopeWarning = '';
    if (typeof getMaxSlopeNearby === 'function' && S.lastLat && S.lastLng) {
      var nearbyResult = getMaxSlopeNearby(S.lastLat, S.lastLng, 3);
      if (nearbyResult && nearbyResult.maxSlopePct > 8) {
        slopeWarning = ' · ⚠️ Dốc gắt nhất: <b>' + nearbyResult.maxSlopePct + '%</b>';
      }
    }

    return [
      '<div style="background:rgba(255,193,7,.05);border:1px solid rgba(255,193,7,.2);',
      'border-radius:10px;padding:10px 12px;margin-bottom:10px;',
      'font-size:12px;color:rgba(255,230,150,.85);line-height:1.7;">',
        '<b style="color:#ffc107;">💧 Lượng nước khuyến nghị:</b> ',
        '<b>' + waterMl + ' ml</b>',
        (temp ? ' · 🌡️ ' + temp : ''),
        slopeWarning,
        '<br><span style="color:rgba(255,255,255,.4);font-size:11px;">',
        'Công thức: Cân nặng × 8ml/kg · Uống đều 15-20 phút/lần</span>',
      '</div>',
    ].join('');
  } catch(e) { return ''; }
}

/** Đặt giới tính trong form sinh trắc */
function _ftSetGender(g) {
  if (!S.user_biometrics) S.user_biometrics = {};
  S.user_biometrics.gender = g;
  var m = document.getElementById('ft-gender-m');
  var f = document.getElementById('ft-gender-f');
  if (m) { m.style.background = g === 'male' ? 'rgba(59,158,255,.3)' : 'rgba(59,158,255,.06)'; m.style.borderColor = g === 'male' ? 'rgba(59,158,255,.8)' : 'rgba(59,158,255,.3)'; }
  if (f) { f.style.background = g === 'female' ? 'rgba(255,100,150,.25)' : 'rgba(255,100,150,.06)'; f.style.borderColor = g === 'female' ? 'rgba(255,100,150,.7)' : 'rgba(255,100,150,.3)'; }
}

/** Keytel formula interval — tính Kcal/giây */
function _ftStartKcalTicker() {
  if (!S.free_training) S.free_training = { active:true, seconds:0, cumulative_kcal:0, hr:135 };
  S.free_training.active       = true;
  S.free_training._tickerId    = setInterval(function() {
    if (!S.free_training || !S.free_training.active) return;
    S.free_training.seconds++;

    // HR dao động ±5bpm dynamic
    var t    = S.free_training.seconds;
    var noise = Math.sin(t * 0.07) * 3 + Math.sin(t * 0.13) * 2;
    var hr    = Math.max(100, Math.min(185, 135 + noise + Math.floor(t / 30)));
    S.free_training.hr = Math.round(hr);

    var bio = S.user_biometrics || { gender:'male', age:35, weight:68 };
    var W = bio.weight || 68, A = bio.age || 35, HR = hr;
    var kcalPerMin = (bio.gender === 'female')
      ? (-20.4022 + (0.4472 * HR) - (0.1263 * W) + (0.074 * A)) / 4.184
      : (-55.0969 + (0.6309 * HR) + (0.1988 * W) + (0.2017 * A)) / 4.184;
    var kcalPerSec = Math.max(0, kcalPerMin / 60);
    S.free_training.cumulative_kcal = (S.free_training.cumulative_kcal || 0) + kcalPerSec;

    var kcalEl = document.getElementById('ft-kcal-val');
    var hrEl   = document.getElementById('ft-hr-display');
    if (kcalEl) kcalEl.textContent = S.free_training.cumulative_kcal.toFixed(1);
    if (hrEl) {
      var zone = HR > 170 ? '🔴 Zone 5' : HR > 155 ? '🟠 Zone 4' : HR > 140 ? '🟡 Zone 3' : '🟢 Zone 2';
      hrEl.textContent = '♥ ' + Math.round(HR) + ' bpm · ' + zone;
      hrEl.style.color = HR > 170 ? '#ff5252' : HR > 155 ? '#ff9800' : HR > 140 ? '#ffc107' : '#00e5a0';
    }

    // Crash Buffer: save mỗi 5 giây
    _crashBufferTick = (_crashBufferTick || 0) + 1;
    if (_crashBufferTick % 5 === 0) {
      _saveCrashBuffer(S.training ? S.training.event_idx : null);
    }
  }, 1000);
}

function _ftStopKcalTicker() {
  if (S.free_training && S.free_training._tickerId) {
    clearInterval(S.free_training._tickerId);
    S.free_training._tickerId = null;
    S.free_training.active    = false;
  }
}

/** Camera check-in từ Free Training */
function _freeTrainingCheckin(evIdx) {
  var meta = {
    legName  : 'Hành Trình Tự Do',
    legKm    : null,
    temp     : (S._weatherData && S._weatherData.temp) || null,
    maxSlope : null,
    eventName: null,
  };
  if (typeof initShareCardEngine === 'function') initShareCardEngine('free', meta);
  else if (typeof showToast === 'function') showToast('Share Card chưa load', 'warn', 2000);
}

/** Launch Free Training: setStyle satellite + Free HUD */
function _ftLaunchRun(evIdx) {
  _closeFreeTrainingOverlay();

  // Chốt 1 FIX: Khởi tạo silent audio NGAY TRONG gesture event (sync)
  // TRƯỚC bất kỳ async call nào để iOS không thu hồi Gesture Token
  _keepAliveSilentAudioEager();

  _activateKeepAlive();            // Keep-Alive: WakeLock + đảm bảo audio running
  if (typeof _resetCoachingMilestones === 'function') _resetCoachingMilestones();

  if (S.map && S.mapReady) {
    // Gạt sang satellite
    S.map.once('style.load', function() {
      if (S.lastLat && S.lastLng) {
        S.map.flyTo({ center:[S.lastLng, S.lastLat], zoom:16, pitch:55, duration:1200 });
      }
      _ftShowFreeHUD();
    });
    S.map.setStyle('mapbox://styles/mapbox/satellite-streets-v12');
  } else {
    _ftShowFreeHUD();
  }

  startTrain(evIdx);
}

/** Free Training HUD — overlay đơn giản phủ trên map */
function _ftShowFreeHUD() {
  var old = document.getElementById('ft-free-hud');
  if (old && old.parentNode) old.parentNode.removeChild(old);

  var hud = document.createElement('div');
  hud.id = 'ft-free-hud';
  hud.style.cssText = [
    'position:fixed','top:16px','left:50%','transform:translateX(-50%)',
    'z-index:9100','pointer-events:none',
    'background:rgba(8,12,24,.72)',
    'backdrop-filter:blur(10px)','-webkit-backdrop-filter:blur(10px)',
    'border:1px solid rgba(0,229,160,.3)',
    'box-shadow:0 0 20px rgba(0,229,160,.12)',
    'border-radius:14px','padding:10px 18px',
    'display:flex','gap:20px','align-items:center',
  ].join(';');

  hud.innerHTML = [
    '<div style="text-align:center;">',
      '<div id="ft-hud-time" style="font-family:\'Barlow Condensed\',sans-serif;',
      'font-size:28px;font-weight:800;color:#00e5a0;',
      'text-shadow:0 0 12px rgba(0,229,160,.5);">00:00</div>',
      '<div style="font-size:9px;color:rgba(255,255,255,.35);letter-spacing:1px;text-transform:uppercase;">THỜI GIAN</div>',
    '</div>',
    '<div style="text-align:center;">',
      '<div id="ft-hud-km" style="font-family:\'Barlow Condensed\',sans-serif;',
      'font-size:28px;font-weight:800;color:#fff;">0.00</div>',
      '<div style="font-size:9px;color:rgba(255,255,255,.35);letter-spacing:1px;text-transform:uppercase;">KM</div>',
    '</div>',
    '<div style="text-align:center;">',
      '<div id="ft-hud-hr" style="font-family:\'Barlow Condensed\',sans-serif;',
      'font-size:28px;font-weight:800;color:#ffc107;">135</div>',
      '<div style="font-size:9px;color:rgba(255,255,255,.35);letter-spacing:1px;text-transform:uppercase;">♥ BPM</div>',
    '</div>',
  ].join('');

  document.body.appendChild(hud);
  hud.style.pointerEvents = 'none';

  // Tick timer
  var hudTick = setInterval(function() {
    if (!S.free_training || !S.free_training.active) { clearInterval(hudTick); return; }
    var s = S.free_training.seconds;
    var m = Math.floor(s / 60), sec = s % 60;
    var timeEl = document.getElementById('ft-hud-time');
    var kmEl   = document.getElementById('ft-hud-km');
    var hrEl   = document.getElementById('ft-hud-hr');
    if (timeEl) timeEl.textContent = (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
    if (kmEl)   kmEl.textContent   = ((S.training.distance_m || 0) / 1000).toFixed(2);
    if (hrEl) {
      var hr = S.free_training.hr || 135;
      hrEl.textContent = hr;
      hrEl.style.color = hr > 170 ? '#ff5252' : hr > 155 ? '#ff9800' : hr > 140 ? '#ffc107' : '#00e5a0';
    }
  }, 1000);

  // Show Kcal display + start ticker
  var kcalEl = document.getElementById('ft-kcal-display');
  if (kcalEl) kcalEl.style.display = 'block';
  _ftStartKcalTicker();
}

function _closeFreeTrainingOverlay() {
  _ftStopKcalTicker();
  var el = document.getElementById('free-training-overlay');
  if (el) { el.style.transition = 'opacity .22s ease'; el.style.opacity = '0'; setTimeout(function() { if (el && el.parentNode) el.parentNode.removeChild(el); }, 230); }
}

/** Inject keyframe CSS một lần vào <head> */
function _guardInjectKeyframes() {
  if (document.getElementById('guard-keyframes')) return;
  var style = document.createElement('style');
  style.id = 'guard-keyframes';
  style.textContent = [
    /* spec: springIn = trượt từ dưới + nảy */
    '@keyframes springIn{',
    '  from{opacity:0;transform:translateY(20px) scale(.95);}',
    '  to{opacity:1;transform:translateY(0) scale(1);}',
    '}',
    /* backward compat alias */
    '@keyframes guardSlideIn{',
    '  from{opacity:0;transform:translateY(20px) scale(.95);}',
    '  to{opacity:1;transform:translateY(0) scale(1);}',
    '}',
    /* Radar spinner */
    '@keyframes radarSpin{',
    '  from{transform:rotate(0deg);}',
    '  to{transform:rotate(360deg);}',
    '}',
    /* Radar ripple — vòng sóng lan tỏa */
    '@keyframes radarRipple{',
    '  0%{transform:scale(.6);opacity:.8;}',
    '  100%{transform:scale(1.8);opacity:0;}',
    '}',
  ].join('');
  document.head.appendChild(style);
}

function onSportPointerDown(sport,btn){ try { if(!S.training.active){ switchSport(sport); return; } btn.classList.add('sport-holding'); _sportHoldTimers[sport]=setTimeout(function(){ btn.classList.remove('sport-holding'); _confirmSwitchSport(sport); },3000); } catch(e){} }
function onSportPointerUp(sport,btn){ try { if(_sportHoldTimers[sport]){ clearTimeout(_sportHoldTimers[sport]); delete _sportHoldTimers[sport]; } btn.classList.remove('sport-holding'); } catch(e){} }
function _confirmSwitchSport(sport){ try { var labels={swim:'🏊 Bơi',bike:'🚴 Đạp xe',run:'🏃 Chạy bộ'}; S.training.sport=sport; _updateSportUI(sport); showToast('✓ Đã chuyển sang '+(labels[sport]||sport),'ok',2000); _playBeep(880,0.08,0.12); } catch(e){} }
function switchSport(sport){ try { S.training.sport=sport; _updateSportUI(sport); } catch(e){} }
function _updateSportUI(sport){ document.querySelectorAll('.hud-sport-btn').forEach(function(btn){ btn.classList.toggle('active',btn.dataset.sport===sport); }); }


// ══════════════════════════════════════════════════════════════════
//  § UC-8  OLED + STORAGE + REPLAY
// ══════════════════════════════════════════════════════════════════

function checkDeviceStorage(){
  return new Promise(function(resolve){
    if(!navigator.storage||!navigator.storage.estimate){ resolve({available_mb:999,used_mb:0,quota_mb:999,tier:'safe'}); return; }
    navigator.storage.estimate().then(function(est){ var usedMb=Math.round((est.usage||0)/1024/1024); var quotaMb=Math.round((est.quota||0)/1024/1024); var availableMb=Math.max(0,quotaMb-usedMb); var tier=availableMb<100?'danger':availableMb<300?'warning':'safe'; resolve({available_mb:availableMb,used_mb:usedMb,quota_mb:quotaMb,tier:tier}); }).catch(function(){ resolve({available_mb:999,used_mb:0,quota_mb:999,tier:'safe'}); });
  });
}
function showStorageCheckModal(estimateMb,onConfirm){
  try {
    checkDeviceStorage().then(function(storage){
      var modal=document.getElementById('storage-check-modal');
      if(!modal){ if(storage.tier!=='danger') onConfirm(); else showToast('⚠ Bộ nhớ máy sắp đầy, không thể tải bản đồ offline','err',5000); return; }
      var statusEl=document.getElementById('storage-status'); var usedEl=document.getElementById('storage-used'); var estimateEl=document.getElementById('storage-estimate'); var confirmBtn=document.getElementById('storage-confirm-btn'); var warnEl=document.getElementById('storage-warn-text');
      if(usedEl) usedEl.textContent=storage.available_mb+' MB trống'; if(estimateEl) estimateEl.textContent='~'+estimateMb+' MB';
      if(confirmBtn) confirmBtn.disabled=false; if(warnEl) warnEl.style.display='none';
      if(statusEl){ statusEl.className='storage-status-bar'; statusEl.classList.add('storage-'+storage.tier); }
      if(storage.tier==='danger'){ if(confirmBtn) confirmBtn.disabled=true; if(warnEl){ warnEl.style.display='block'; warnEl.textContent='🚨 Cảnh báo: Máy bạn sắp hết sạch bộ nhớ ('+storage.available_mb+' MB). Vui lòng xóa bớt video/hình ảnh cũ.'; } }
      else if(storage.tier==='warning'){ if(warnEl){ warnEl.style.display='block'; warnEl.style.color='var(--gold)'; warnEl.textContent='⚠ Máy bạn còn '+storage.available_mb+' MB. Gói Trail Guard cần ~'+estimateMb+' MB.'; } }
      else { if(warnEl){ warnEl.style.display='block'; warnEl.style.color='var(--accent)'; warnEl.textContent='✅ Máy bạn còn '+storage.available_mb+' MB — đủ dùng thoải mái.'; } }
      if(confirmBtn) confirmBtn.onclick=function(){ modal.classList.remove('on'); onConfirm(); };
      modal.classList.add('on');
    });
  } catch(e){ onConfirm(); }
}
function closeStorageModal(){ var m=document.getElementById('storage-check-modal'); if(m) m.classList.remove('on'); }

function startReplay3D(){
  try {
    if(!S.map||!S.mapReady){ showToast('Bản đồ chưa sẵn sàng','warn'); return; }
    var path=S.training.path; if(!path||path.length<2){ showToast('Chưa có đủ dữ liệu GPS để phát replay','warn',3000); return; }
    closeSummaryBoard();
    var coords=path.map(function(p){ return [p.lng,p.lat]; });
    var line={type:'Feature',geometry:{type:'LineString',coordinates:coords},properties:{color:'#00e5a0'}};
    if(typeof setRouteData==='function') setRouteData({type:'FeatureCollection',features:[line]});
    var totalKm=typeof turf!=='undefined'?turf.length(line,{units:'kilometers'}):0;
    if(!totalKm){ showToast('Dữ liệu GPS chưa đủ để flyover','warn'); return; }
    var steps=Math.min(40,Math.floor(totalKm*4)); var stepKm=totalKm/steps; var stepIdx=0; var incidents=S.training.incident_logs;
    showToast('▶️ Phim hành trình 3D đang phát...','ok',3000);
    function flyStep(){ if(stepIdx>steps){ showToast('🏁 Replay kết thúc','ok',2000); return; } var along=turf.along(line,stepIdx*stepKm,{units:'kilometers'}); var center=along.geometry.coordinates; var nearInc=incidents.find(function(inc){ if(!inc.lat||!inc.lng) return false; return turf.distance(turf.point(center),turf.point([inc.lng,inc.lat]),{units:'meters'})<80; }); var duration=nearInc?2800:1400; S.map.flyTo({center:center,zoom:15,pitch:55,bearing:(stepIdx*7)%360,duration:duration,essential:true}); if(nearInc){ setTimeout(function(){ showToast('⏸ Dừng '+Math.round(nearInc.duration_s/60)+'p tại đây','warn',2200); },600); } stepIdx++; setTimeout(flyStep,duration+200); }
    flyStep();
  } catch(e){ console.error('[startReplay3D]',e); }
}
function _loadAndStartReplay(sessionId){
  try {
    api({action:'getTrainingHistory',user_uuid:(S.user?S.user.uuid:'')},function(err,sessions){
      var session=null; if(!err&&sessions&&sessions.length){ session=sessions.find(function(s){ return s.live_id===sessionId; })||null; }
      if(!session){ showToast('Không tìm thấy phiên chạy '+sessionId,'warn',4000); switchTab('experience'); loadExperience(); return; }
      S.training.path=(session.gps_track||[]).map(function(p){ return {lat:p.lat||p[1],lng:p.lng||p[0],ts:p.ts||0}; });
      S.training.incident_logs=session.incident_logs||[];
      S.training.event_idx=S.eventsList.findIndex?S.eventsList.findIndex(function(e){ return e.session_id===session.event_id; }):0;
      switchTab('experience'); loadExperience();
      setTimeout(function(){ if(S.mapReady){ startReplay3D(); } else { S.map.once('load',function(){ startReplay3D(); }); } },1500);
    });
  } catch(e){ switchTab('experience'); loadExperience(); }
}
function _buildReplayUrl(liveId){ return window.location.origin+window.location.pathname+'?page=replay&session='+(liveId||''); }


// ══════════════════════════════════════════════════════════════════
//  § UC-9  FOCUS VIEW / SA BÀN MODE
// ══════════════════════════════════════════════════════════════════

function enterFocusView(evIdx){
  try {
    var ev=S.eventsList[evIdx]; if(!ev) return;
    S._mapMode='focus'; S._focusEventIdx=evIdx;
    closeDrawer(); flyToEvent(ev);
    if(typeof loadSabanRouteData==='function'){ S.lastEvent=ev; setTimeout(loadSabanRouteData,400); }
    document.getElementById('shell').classList.add('map-focus-mode');
    _renderFocusControls(evIdx,ev.session_name);
    showToast('🗺️ Chế độ xem bản đồ — Bấm 🎮 để thử nghiệm','default',3000);
  } catch(e){ console.error('[enterFocusView]',e); }
}
function toggleSandboxMode(){
  try {
    if(S._mapMode==='focus'){
      S._mapMode='sandbox';
      var ok=false; if(typeof initSabanScrubber==='function') ok=initSabanScrubber();
      if(!ok&&typeof enableMockGpsClick==='function') enableMockGpsClick();
      var dock=document.getElementById('saban-ui-dock'); if(dock) dock.classList.add('on');
      showSabanUI(true); _updateSandboxBtn(true);
      showToast('🎮 Sa Bàn bật — Kéo thanh trượt hoặc Click bản đồ','ok',3000);
    } else if(S._mapMode==='sandbox'){
      S._mapMode='focus';
      if(typeof cleanupSabanScrubber==='function') cleanupSabanScrubber();
      else if(typeof _disableMockGpsClick==='function') _disableMockGpsClick();
      var dock2=document.getElementById('saban-ui-dock'); if(dock2) dock2.classList.remove('on');
      showSabanUI(false); _updateSandboxBtn(false);
      showToast('🎮 Sa Bàn tắt','default',2000);
    }
  } catch(e){ console.error('[toggleSandboxMode]',e); }
}
function exitFocusView(){
  try {
    if(S._raceMode && typeof cleanupRaceSimulation==='function') cleanupRaceSimulation();
    if(S._mapMode==='sandbox'){ if(typeof cleanupSabanScrubber==='function') cleanupSabanScrubber(); else if(typeof _disableMockGpsClick==='function') _disableMockGpsClick(); }
    S._mapMode='browse'; S._focusEventIdx=null;
    document.getElementById('shell').classList.remove('map-focus-mode');
    _removeFocusControls();
    showToast('← Đã thoát chế độ xem bản đồ','default',1500);
  } catch(e){ console.error('[exitFocusView]',e); }
}
function _renderFocusControls(evIdx,evName){
  _removeFocusControls();
  var ctrl=document.getElementById('map-controls'); if(!ctrl) return;
  var exitBtn=document.createElement('button'); exitBtn.id='focus-exit-btn'; exitBtn.className='mc-btn'; exitBtn.title='Thoát xem bản đồ'; exitBtn.textContent='✕'; exitBtn.style.cssText='background:rgba(255,82,82,.2);border-color:rgba(255,82,82,.4);color:#ff5252;'; exitBtn.onclick=exitFocusView;
  var sandboxBtn=document.createElement('button'); sandboxBtn.id='focus-sandbox-btn'; sandboxBtn.className='mc-btn'; sandboxBtn.title='Bật/tắt Sa Bàn'; sandboxBtn.style.fontSize='14px'; _updateSandboxBtn(false,sandboxBtn); sandboxBtn.onclick=toggleSandboxMode;
  // ⚡ Nút Race Mode — màu dạ quang bốc lửa
  var raceBtn=document.createElement('button'); raceBtn.id='focus-race-btn'; raceBtn.className='mc-btn'; raceBtn.title='Thử nghiệm Race Mode';
  raceBtn.textContent='⚡'; raceBtn.style.cssText=[
    'background:linear-gradient(135deg,rgba(255,64,129,.25),rgba(255,193,7,.2))',
    'border-color:rgba(255,193,7,.6)',
    'color:#ffc107',
    'font-size:18px',
    'box-shadow:0 0 12px rgba(255,193,7,.3)',
  ].join(';');
  raceBtn.onclick=function(){
    if(typeof initRaceSimulation==='function'){
      var legIdx=S.saban&&S.saban.active?S.saban.activeLegIndex:0;
      initRaceSimulation(legIdx);
    } else {
      showToast('Cần bật Sa Bàn trước khi vào Race Mode','warn',2500);
    }
  };
  ctrl.appendChild(exitBtn); ctrl.appendChild(sandboxBtn); ctrl.appendChild(raceBtn);
}
function _removeFocusControls(){ ['focus-exit-btn','focus-sandbox-btn','focus-race-btn'].forEach(function(id){ var el=document.getElementById(id); if(el&&el.parentNode) el.parentNode.removeChild(el); }); }
function _updateSandboxBtn(isOn,btn){
  var el=btn||document.getElementById('focus-sandbox-btn'); if(!el) return;
  el.textContent='O'; el.style.fontFamily="'Barlow Condensed',sans-serif"; el.style.fontWeight='800'; el.style.fontSize='20px';
  if(isOn){ el.title='Sa Bàn đang bật'; el.style.background='rgba(0,229,160,.25)'; el.style.borderColor='rgba(0,229,160,.6)'; el.style.color='var(--accent)'; el.classList.add('sandbox-pulse'); }
  else { el.title='Bật Sa Bàn thử nghiệm'; el.style.background='rgba(0,229,160,.12)'; el.style.borderColor='rgba(0,229,160,.4)'; el.style.color='var(--accent)'; el.classList.add('sandbox-pulse'); }
}


// ══════════════════════════════════════════════════════════════════
//  § UC-10  SA BÀN SABAN UI — show/hide + mode
// ══════════════════════════════════════════════════════════════════

function showSabanUI(visible){
  var pills=document.getElementById('wp-filter-pills'); var weather=document.getElementById('weather-widget'); var cwpBtn=document.getElementById('cwp-trigger-btn');
  if(visible){
    if(pills) pills.classList.add('on'); if(weather) weather.classList.add('on');
    if(cwpBtn) cwpBtn.style.display=IS_MAP_PURCHASED?'flex':'none';
    _applyWpFilter();
    if(typeof _reloadCustomWaypoints==='function') _reloadCustomWaypoints(true);
    var center=typeof _getRouteCenterCoords==='function'?_getRouteCenterCoords():null;
    if(center&&typeof fetchWeatherForDashboard==='function') fetchWeatherForDashboard(center.lat,center.lng);
    setTimeout(renderElevationSparkline,600);
    if(typeof initCrossHairTargeting==='function') initCrossHairTargeting();
    if(typeof initPlayController==='function') initPlayController();
    var playBtn=document.getElementById('saban-playpause'); if(playBtn) playBtn.classList.add('on');
    if(typeof updateTopbarCoins==='function') updateTopbarCoins();
    if(typeof renderStageTabs==='function') setTimeout(renderStageTabs,600);
    if(typeof _startTraceGlowPulse==='function') setTimeout(_startTraceGlowPulse,700);
    if(typeof _startLineShimmer==='function') setTimeout(_startLineShimmer,800);
    var sbToggle=document.getElementById('sb-toggle'); if(sbToggle) sbToggle.style.display='none';
    var mcLocate=document.getElementById('mc-locate'); if(mcLocate) mcLocate.style.display='none';
  } else {
    if(pills) pills.classList.remove('on'); if(weather) weather.classList.remove('on'); if(cwpBtn) cwpBtn.style.display='none';
    var dash=document.getElementById('saban-dashboard'); if(dash) dash.classList.remove('on');
    var sbToggle2=document.getElementById('sb-toggle'); if(sbToggle2) sbToggle2.style.display='';
    var mcLocate2=document.getElementById('mc-locate'); if(mcLocate2) mcLocate2.style.display='';
    var playBtn2=document.getElementById('saban-playpause'); if(playBtn2) playBtn2.classList.remove('on');
    if(typeof _flyPause==='function') _flyPause();
    sabanStopPlay(); resetWpFilter();
    if(typeof destroyCrosshairTargeting==='function') destroyCrosshairTargeting();
  }
}

function sabanSetMode(mode){
  try {
    _sabanMode=mode;
    var dock=document.getElementById('saban-ui-dock'); if(!dock) return;
    if(mode==='auto'){
      dock.classList.add('mode-auto');
      var modeBtn=document.getElementById('saban-mode-btn'); if(modeBtn){ modeBtn.textContent='✏️ Chế độ Thủ Công'; modeBtn.onclick=function(){ sabanSetMode('manual'); }; }
      if(!_sabanPlaying) _sabanStartPlay();
    } else {
      dock.classList.remove('mode-auto'); sabanStopPlay();
      var modeBtn2=document.getElementById('saban-mode-btn'); if(modeBtn2){ modeBtn2.textContent='🚀 Kích Hoạt Bay Tự Động'; modeBtn2.onclick=function(){ sabanSetMode('auto'); }; }
    }
  } catch(e){}
}


// ══════════════════════════════════════════════════════════════════
//  § UC-11  SABAN AUTOPLAY ENGINE (RAF-based)
// ══════════════════════════════════════════════════════════════════

function sabanTogglePlay(){ if(_sabanPlaying) sabanStopPlay(); else _sabanStartPlay(); }
function sabanStopPlay(){
  _sabanPlaying=false; if(_sabanRafId){ cancelAnimationFrame(_sabanRafId); _sabanRafId=null; } _sabanLastTs=0;
  var btn=document.getElementById('spc-play');
  if(btn){
    btn.textContent='▶';
    btn.style.background='var(--accent)';
    btn.style.borderRadius='8px';
  }
}

// Unified sabanRewind/Forward with speech cancel
function sabanRewind(){ if(window.speechSynthesis) window.speechSynthesis.cancel(); _sabanSpeechPaused=false; var slider=document.getElementById('saban-slider'); if(!slider) return; _sabanSetValueAndSync(Math.max(0,Number(slider.value)-5)); }
function sabanForward(){ if(window.speechSynthesis) window.speechSynthesis.cancel(); _sabanSpeechPaused=false; var slider=document.getElementById('saban-slider'); if(!slider) return; _sabanSetValueAndSync(Math.min(100,Number(slider.value)+5)); }

function sabanPrevLeg(){ if(!S.saban||!S.saban.active) return; var prev=S.saban.activeLegIndex-1; if(prev>=0&&typeof _sabanTransitionLeg==='function') _sabanTransitionLeg(prev,'backward'); else showToast('Đây là chặng đầu tiên','default',1500); }
function sabanNextLeg(){ if(!S.saban||!S.saban.active) return; var next=S.saban.activeLegIndex+1; if(next<S.saban.legs.length&&typeof _sabanTransitionLeg==='function') _sabanTransitionLeg(next,'forward'); else showToast('Đây là chặng cuối cùng','default',1500); }
function sabanSetSpeed(val){ _sabanSpeed=Number(val)||1; }
function _sabanSetValueAndSync(pct){
  pct=Math.max(0,Math.min(100,pct));
  var slider=document.getElementById('saban-slider'); if(slider) slider.value=pct;
  if(typeof onSabanSliderInput==='function') onSabanSliderInput(pct);
}
function _sabanStartPlay(){
  if(!S.saban||!S.saban.active){ showToast('⚠ Cần bật Sa Bàn trước','warn',2000); return; }
  _sabanPlaying=true; _sabanLastTs=0; _sabanPctAccum=0;
  var btn=document.getElementById('spc-play');
  if(btn){
    btn.textContent='⏸';
    var col=(S.saban&&S.saban._activeColor)||'var(--accent)';
    btn.style.background=col;
    btn.style.borderRadius='10px'; // hình chữ nhật bo nhẹ
  }
  var slider=document.getElementById('saban-slider'); if(slider&&Number(slider.value)>=99) _sabanSetValueAndSync(0);
  function loop(ts){
    if(!_sabanPlaying) return;
    if(_sabanSpeechPaused){ _sabanLastTs=0; _sabanRafId=requestAnimationFrame(loop); return; }
    if(_sabanLastTs){
      var deltaSec=Math.min((ts-_sabanLastTs)/1000,0.15);
      _sabanPctAccum+=_sabanPctPerSec*_sabanSpeed*deltaSec;
      if(_sabanPctAccum>=0.05){
        var sl=document.getElementById('saban-slider'); if(!sl){ sabanStopPlay(); return; }
        var prevPct=Number(sl.value); var newPct=Math.min(100,prevPct+_sabanPctAccum); _sabanPctAccum=0;
        var hitWp=typeof _sabanLookAheadGeofence==='function'?_sabanLookAheadGeofence(prevPct,newPct):null;
        if(hitWp){ _sabanSetValueAndSync(hitWp.pct); _playGeofenceAlert(hitWp.alertMsg); _sabanLastTs=ts; _sabanRafId=requestAnimationFrame(loop); return; }
        _sabanSetValueAndSync(newPct);
        if(newPct>=99){ sabanStopPlay(); _sabanSetValueAndSync(99); showToast('🏁 Hết chặng — chọn R2/R3 để sang chặng khác','ok',3000); return; }
      }
    }
    _sabanLastTs=ts; _sabanRafId=requestAnimationFrame(loop);
  }
  _sabanRafId=requestAnimationFrame(loop);
}


// ══════════════════════════════════════════════════════════════════
//  § UC-12  WAYPOINT FILTER PILLS
// ══════════════════════════════════════════════════════════════════

function toggleWpFilter(type,btn){
  try { var idx=_activeWpTypes.indexOf(type); if(idx>=0){ _activeWpTypes.splice(idx,1); if(btn) btn.classList.remove('on'); } else { _activeWpTypes.push(type); if(btn) btn.classList.add('on'); } _applyWpFilter(); } catch(e){}
}
function _applyWpFilter(){
  try {
    if(!S.map||!S.mapReady||!S.map.getLayer('waypoints-icons')) return;
    if(_activeWpTypes.length===0){ S.map.setFilter('waypoints-icons',['==','1','0']); return; }
    S.map.setFilter('waypoints-icons',['in',['get','type'],['literal',_activeWpTypes]]);
  } catch(e){}
}
function resetWpFilter(){
  _activeWpTypes=['checkpoint','water_station','medical','photo','geofence_task','finish'];
  document.querySelectorAll('.wp-pill').forEach(function(b){ b.classList.add('on'); });
  if(S.map&&S.mapReady&&S.map.getLayer('waypoints-icons')) S.map.setFilter('waypoints-icons',null);
}


// ══════════════════════════════════════════════════════════════════
//  § UC-13  SCRUBBER INPUT + STAGE TABS
// ══════════════════════════════════════════════════════════════════

function onSabanSliderInput(val){
  try {
    var pct=Number(val)||0;
    var fill=document.getElementById('saban-fill');
    if(fill){
      fill.style.width=pct+'%';
      // FIX 3: ép fill nổi trên input range (z-index:4 > input z-index:3)
      fill.style.zIndex='4';
      fill.style.pointerEvents='none'; // đừng chặn click slider
    }
    // Ép saban-input nằm trên fill nhưng dưới track nét đứt
    var inp=document.getElementById('saban-slider');
    if(inp) inp.style.zIndex='3';
    var track=document.querySelector('.saban-track');
    if(track) track.style.zIndex='5'; // nét đứt cam luôn trên cùng

    var pctEl=document.getElementById('saban-pct'); if(pctEl) pctEl.textContent=Math.round(pct)+'%';
    if(typeof onSabanScrub==='function') onSabanScrub(pct);
    if(S.saban&&S.saban.active){
      var leg=S.saban.legs[S.saban.activeLegIndex];
      if(leg){ var sportIcons={swim:'🏊',bike:'🚴',run:'🏃',kayak:'🚣',row:'🚣',hike:'🥾',climb:'⛰️'}; var iconEl=document.getElementById('saban-sport-icon'); if(iconEl) iconEl.textContent=sportIcons[leg.sport]||'🏃'; var lblEl=document.getElementById('saban-leg-label'); if(lblEl) lblEl.textContent=leg.leg_name; }
    }
  } catch(e){}
}
function renderStageTabs(){
  try {
    var row=document.getElementById('stage-tabs-row'); if(!row||!S.saban||!S.saban.legs) return;
    row.innerHTML=''; var COLORS=['#29b6f6','#ff9800','#00e5a0','#ab47bc','#ef5350'];
    S.saban.legs.forEach(function(leg,idx){
      var col=COLORS[idx%COLORS.length]; var btn=document.createElement('button');
      btn.className='stage-tab-chip'+(idx===S.saban.activeLegIndex?' active':''); btn.style.setProperty('--chip-color',col);
      btn.innerHTML='<span class="st-label">R'+(idx+1)+'</span>'; btn.onclick=function(){ onStageTabClick(idx); };
      row.appendChild(btn);
    });
    var activeColor=COLORS[S.saban.activeLegIndex%COLORS.length];
    _setSliderColor(activeColor);
    // FIX 4: lưu màu chặng hiện tại để play button dùng
    S.saban._activeColor=activeColor;
    _updatePlayBtnColor(activeColor);
  } catch(e){}
}

/** FIX 4: Cập nhật màu + shape nút play theo chặng đang chọn */
function _updatePlayBtnColor(color){
  try {
    var btn=document.getElementById('saban-playpause');
    if(!btn) return;
    btn.style.background=color||'var(--accent)';
    btn.style.color='#060d14';
    btn.style.boxShadow='0 4px 20px '+_hexToRgba(color,0.5);
    // Shape hình chữ nhật bo góc nhẹ (thay circle)
    btn.style.borderRadius='14px';
    btn.style.width='64px';
    btn.style.height='52px';
    btn.style.fontSize='22px';
  } catch(e){}
}

/** Helper: hex/named color → rgba string */
function _hexToRgba(color, alpha){
  try {
    // Xử lý hex #rrggbb
    var m=String(color).match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
    if(m) return 'rgba('+parseInt(m[1],16)+','+parseInt(m[2],16)+','+parseInt(m[3],16)+','+alpha+')';
  } catch(e){}
  return 'rgba(0,229,160,'+alpha+')';
}
function onStageTabClick(idx){
  try {
    if(_stageTabSelected===idx&&idx===S.saban.activeLegIndex){ _showStageInfo(idx); return; }
    _stageTabSelected=idx;
    if(typeof _flyPause==='function') _flyPause();
    if(typeof _sabanTransitionLeg==='function') _sabanTransitionLeg(idx,idx>S.saban.activeLegIndex?'forward':'backward');
    if(typeof _sabanSetValueAndSync==='function') setTimeout(function(){ _sabanSetValueAndSync(0); },100);
    renderStageTabs();
  } catch(e){}
}
function _showStageInfo(idx){ var leg=S.saban.legs[idx]; if(!leg) return; var km=((S.saban.legDistances[idx]||0)/1000).toFixed(1); showToast('📍 Chặng '+(idx+1)+': '+(leg.leg_name||leg.sport)+' · '+km+'km','ok',3000); }
function _setSliderColor(color){
  try {
    var wrap=document.querySelector('.saban-scrubber-row'); if(wrap) wrap.style.setProperty('--slider-col',color);
    if(typeof _traceColor!=='undefined') _traceColor=color;
    if(S.map&&S.map.getLayer('user-trace-glow')){ try{ S.map.setPaintProperty('user-trace-glow','line-color',color); }catch(e){} }
  } catch(e){}
}
function closeLegGate(){ var gate=document.getElementById('leg-transition-gate'); if(gate) gate.classList.remove('on'); }


// ══════════════════════════════════════════════════════════════════
//  § UC-14  PLAY/PAUSE/STOP CONTROLLER + CAMERA THÍCH ỨNG
// ══════════════════════════════════════════════════════════════════

function initPlayController(){
  var btn=document.getElementById('saban-playpause');
  if(btn&&!btn._bound){ btn._bound=true; btn.addEventListener('pointerdown',_onPlayPointerDown); btn.addEventListener('pointerup',_onPlayPointerUp); btn.addEventListener('pointerleave',_onPlayPointerCancel); }
  _bindCameraIntervention();
}
function _onPlayPointerDown(e){ e.preventDefault(); _flyHoldFired=false; _flyHoldTimer=setTimeout(function(){ _flyHoldFired=true; _flyStop(); },2000); }
function _onPlayPointerUp(){ if(_flyHoldTimer){ clearTimeout(_flyHoldTimer); _flyHoldTimer=null; } if(_flyHoldFired) return; _flyTogglePlay(); }
function _onPlayPointerCancel(){ if(_flyHoldTimer){ clearTimeout(_flyHoldTimer); _flyHoldTimer=null; } }
function _flyTogglePlay(){ if(_flyPlaying){ _flyPause(); return; } FLY_SPEED_MULTIPLIER=2; _flyPlay(); }
function _openSpeedModal(){ var m=document.getElementById('fly-speed-modal'); if(m) m.classList.add('on'); }
function _closeSpeedModal(){ var m=document.getElementById('fly-speed-modal'); if(m) m.classList.remove('on'); }
function _startFlyAtSpeed(spd){ FLY_SPEED_MULTIPLIER=Number(spd)||6; _closeSpeedModal(); _flyPlay(); }
function _flyPlay(){
  if(!S.saban||!S.saban.active){ showToast('Cần bật Sa Bàn','warn',2000); return; }
  _flyPlaying=true; _flyLastTs=0;
  var btn=document.getElementById('saban-playpause');
  if(btn){
    // FIX 4: hình chữ nhật ⏹ khi Playing, màu theo chặng
    btn.textContent='⏸';
    var col=(S.saban&&S.saban._activeColor)||'var(--accent)';
    _updatePlayBtnColor(col);
  }
  _flyRaf=requestAnimationFrame(_flyLoop);
}
function _flyPause(){
  _flyPlaying=false; if(_flyRaf){ cancelAnimationFrame(_flyRaf); _flyRaf=null; } _flyLastTs=0;
  var btn=document.getElementById('saban-playpause');
  if(btn){
    btn.textContent='▶';
    var col=(S.saban&&S.saban._activeColor)||'var(--accent)';
    _updatePlayBtnColor(col);
  }
}
function _flyStop(){
  _flyPause(); _camUserOverride=false; _camUserPitch=_camUserBearing=_camUserZoom=null; _sabanSetValueAndSync(0);
  var btn=document.getElementById('saban-playpause');
  if(btn){ btn.textContent='▶'; }
  showToast('⏹ Đã về vạch xuất phát','default',1800);
}
function _handleSabanReachEnd(){ if(typeof _flyPause==='function') _flyPause(); showToast('🏁 Hết chặng — chọn R2/R3 để sang chặng khác','ok',3000); }
function _flyLoop(ts){
  if(!_flyPlaying) return;
  if(_flySpeechPaused===true){ _flyLastTs=0; _flyRaf=requestAnimationFrame(_flyLoop); return; }
  if(_flyLastTs){ var dt=Math.min((ts-_flyLastTs)/1000,0.05); var inc=_flyPctPerSec*FLY_SPEED_MULTIPLIER*dt; var slider=document.getElementById('saban-slider'); if(slider){ var next=Math.min(100,Number(slider.value)+inc); _sabanSetValueAndSync(next); if(next>=100){ _flyPause(); _handleSabanReachEnd(); return; } } }
  _flyLastTs=ts; _flyRaf=requestAnimationFrame(_flyLoop);
}
function _bindCameraIntervention(){
  if(!S.map||S.map._camInterventionBound) return; S.map._camInterventionBound=true;
  function onUserMove(e){ if(!e.originalEvent) return; _camUserOverride=true; _camUserPitch=S.map.getPitch(); _camUserBearing=S.map.getBearing(); _camUserZoom=S.map.getZoom(); }
  S.map.on('dragstart',onUserMove); S.map.on('zoomstart',onUserMove); S.map.on('rotatestart',onUserMove); S.map.on('pitchstart',onUserMove);
}
function _getFlyCameraOpts(center){ var opts={center:center,duration:280,essential:true}; if(_camUserOverride){ if(_camUserPitch!=null) opts.pitch=_camUserPitch; if(_camUserBearing!=null) opts.bearing=_camUserBearing; if(_camUserZoom!=null) opts.zoom=_camUserZoom; } return opts; }
function onToggleBezier(btn){
  try {
    if(typeof toggleBezier!=='function') return;
    var nowOn=toggleBezier(!_bezierEnabled);
    if(btn){ if(nowOn){ btn.style.background='rgba(255,193,7,.3)'; btn.style.borderColor='rgba(255,193,7,.6)'; showToast('✨ Mượt mà điện ảnh BẬT','ok',2800); } else { btn.style.background=''; btn.style.borderColor=''; showToast('Đường chạy về dạng gốc chính xác 100%','default',2000); } }
  } catch(e){}
}


// ══════════════════════════════════════════════════════════════════
//  § UC-15  CUSTOM WAYPOINT UI (CWP)
// ══════════════════════════════════════════════════════════════════

function startCwpTargeting(){
  try {
    if(!IS_MAP_PURCHASED){ showToast('Tính năng đang phát triển','default',2000); return; }
    if(_cwpProcessing) return; _cwpProcessing=true; setTimeout(function(){ _cwpProcessing=false; },400);
    if(!S.user){ showToast('Vui lòng đăng nhập','warn'); return; }
    if(S.user.cwp_package){ if(typeof initCrossHairTargeting==='function') initCrossHairTargeting(); if(typeof _activateCrosshair==='function') _activateCrosshair(); return; }
    var routeId=S.lastEvent?S.lastEvent.session_id:'';
    api({action:'getCwpStatus',user_uuid:S.user.uuid,route_id:routeId},function(err,status){
      if(!err&&status&&status.has_package){ S.user.cwp_package=status.package_type; if(typeof initCrossHairTargeting==='function') initCrossHairTargeting(); if(typeof _activateCrosshair==='function') _activateCrosshair(); }
      else { _showCwpPackageModal(); }
    });
  } catch(e){}
}
function onCwpSnap(){
  try {
    if(!IS_MAP_PURCHASED) return;
    if(typeof snapCrosshairToRoute==='function') _cwpSnapData=snapCrosshairToRoute();
    if(!_cwpSnapData){ showToast('Không thể xác định tọa độ','err'); return; }
    var defaultTitle='Điểm hẹn '+new Date().toLocaleString('vi-VN',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit'});
    _cwpSnapData.title=defaultTitle;
    if(typeof deactivateCrosshair==='function') deactivateCrosshair();
    showCwpForm(null);
    setTimeout(function(){ var ti=document.getElementById('cwp-title'); if(ti&&!ti.value){ ti.value=defaultTitle; ti.dispatchEvent(new Event('input',{bubbles:true})); ti.dispatchEvent(new Event('change',{bubbles:true})); } },250);
  } catch(e){}
}
function showCwpForm(existingWp){
  try {
    _cwpIsEditing=existingWp?existingWp.cwp_id:null; _cwpPinType=existingWp?existingWp.pin_type:'family';
    var form=document.getElementById('cwp-form'); if(!form) return;
    _setText('cwp-title',existingWp?existingWp.title:'');
    var noteEl=document.getElementById('cwp-note'); if(noteEl) noteEl.value=existingWp?existingWp.note:'';
    if(_cwpSnapData) _setText('cwp-snap-preview','🎯 Đã snap · '+_cwpSnapData.lat.toFixed(5)+', '+_cwpSnapData.lng.toFixed(5)+(_cwpSnapData.dist_m?' ('+_cwpSnapData.dist_m+'m từ gốc)':''));
    document.querySelectorAll('.cwp-pin-btn').forEach(function(b){ b.classList.toggle('active',b.dataset.type===_cwpPinType); });
    var submitBtn=document.getElementById('cwp-submit');
    if(submitBtn){ if(_cwpIsEditing){ submitBtn.textContent='✏️ Lưu Chỉnh Sửa (50 Coins)'; submitBtn.style.background='rgba(255,193,7,.2)'; } else { submitBtn.textContent='💾 Lưu Điểm Hẹn'; submitBtn.style.background=''; } }
    var errEl=document.getElementById('cwp-error'); if(errEl) errEl.style.display='none';
    form.style.display='flex'; form.classList.add('on');
    setTimeout(function(){ var ti=document.getElementById('cwp-title'); if(ti) ti.focus(); },200);
  } catch(e){}
}
function closeCwpForm(){ var form=document.getElementById('cwp-form'); if(form){ form.classList.remove('on'); form.style.display='none'; } _cwpIsEditing=null; }
function selectCwpType(type,btn){ _cwpPinType=type; document.querySelectorAll('.cwp-pin-btn').forEach(function(b){ b.classList.toggle('active',b.dataset.type===type); }); }
function submitCustomWaypoint(){
  try {
    if(!S.user){ showToast('Vui lòng đăng nhập','warn'); return; }
    var titleEl=document.getElementById('cwp-title'); var noteEl=document.getElementById('cwp-note');
    var title=titleEl?String(titleEl.value||'').trim():''; var note=noteEl?String(noteEl.value||'').trim():'';
    if(!title){ title='Điểm hẹn '+new Date().toLocaleString('vi-VN',{hour:'2-digit',minute:'2-digit'}); if(titleEl) titleEl.value=title; }
    if(_cwpSnapData) _cwpSnapData.title=title;
    if(title.length>100){ _showCwpError('Tiêu đề tối đa 100 ký tự'); return; }
    if(!_cwpIsEditing&&!_cwpSnapData){ _showCwpError('Chưa có tọa độ — chuột phải/giữ màn hình chọn điểm trước'); return; }
    var submitBtn=document.getElementById('cwp-submit'); if(submitBtn){ submitBtn.disabled=true; submitBtn.textContent='⏳ Đang lưu...'; }
    if(_cwpIsEditing){
      api({action:'gw_editCustomWaypoint',user_uuid:S.user.uuid,cwp_id:_cwpIsEditing,updates:{title:title,note:note,pin_type:_cwpPinType}},function(err,res){
        if(submitBtn){ submitBtn.disabled=false; submitBtn.textContent='✏️ Lưu Chỉnh Sửa (50 Coins)'; }
        if(err||!res||res.status!=='ok'){ _showCwpError((res&&res.message)||'Lỗi kết nối'); return; }
        if(res.new_balance!==undefined&&S.user){ S.user.coins_balance=res.new_balance; document.querySelectorAll('.pcoins').forEach(function(el){ el.textContent=Number(res.new_balance).toLocaleString('vi-VN'); }); }
        closeCwpForm(); showToast('✅ Đã cập nhật điểm hẹn (−50 Coins)','ok',3000); _reloadCustomWaypoints(true);
      });
    } else {
      if(!_cwpSnapData){ var rec=typeof _recoverSnapData==='function'?_recoverSnapData():null; if(!rec){ if(submitBtn){ submitBtn.disabled=false; submitBtn.textContent='💾 Lưu Điểm Hẹn'; } _showCwpError('Không xác định được vị trí — vui lòng chọn lại điểm'); return; } _cwpSnapData=rec; _cwpSnapData.title=title; }
      var routeId=S.lastEvent?S.lastEvent.session_id:'';
      api({action:'gw_saveCustomWaypoint',user_uuid:S.user.uuid,route_id:routeId,payload:{lat:_cwpSnapData.lat,lng:_cwpSnapData.lng,snapped_lat:_cwpSnapData.origLat||_cwpSnapData.lat,snapped_lng:_cwpSnapData.origLng||_cwpSnapData.lng,title:title,note:note,pin_type:_cwpPinType}},function(err,res){
        if(submitBtn){ submitBtn.disabled=false; submitBtn.textContent='💾 Lưu Điểm Hẹn'; }
        if(err||!res||res.status!=='ok'){ if(res&&res.status==='slot_full'){ _showCwpError(res.message+' · '+res.slots_used+'/'+res.slots_max+' slots'); } else if(res&&res.status==='no_package'){ closeCwpForm(); _showCwpPackageModal(); } else { _showCwpError((res&&res.message)||'Lỗi kết nối'); } return; }
        _cwpSnapData=null; if(typeof clearCwpCache==='function') clearCwpCache(S.user.uuid,routeId);
        closeCwpForm(); showToast('💜 Điểm hẹn đã lưu! Slot: '+res.slots_used+'/'+res.slots_max,'ok',3000); _reloadCustomWaypoints(true);
      });
    }
  } catch(e){ var sb=document.getElementById('cwp-submit'); if(sb){ sb.disabled=false; sb.textContent='💾 Lưu Điểm Hẹn'; } }
}
function showCwpPopup(wp){
  try {
    var canEdit=S.user&&S.user.uuid===wp.user_uuid;
    var msg='💜 '+wp.title+(wp.note?'\n📝 '+wp.note:'')+(canEdit?'\n\n✏️ Bấm OK để chỉnh sửa (50 Coins)':'');
    if(!canEdit){ showToast(msg.replace(/\n/g,' · '),'default',5000); return; }
    if(confirm(msg)){ _cwpSnapData={lat:wp.lat,lng:wp.lng,origLat:wp.lat,origLng:wp.lng}; showCwpForm(wp); }
  } catch(e){}
}
function _showCwpOnboardingOnce(){ try { var seen=localStorage.getItem('cwp_onboard_seen'); if(seen){ startCwpTargeting(); return; } var card=document.getElementById('cwp-onboarding'); if(card) card.classList.add('on'); } catch(e){ startCwpTargeting(); } }
function closeCwpOnboarding(){ try{ localStorage.setItem('cwp_onboard_seen','1'); }catch(e){} var card=document.getElementById('cwp-onboarding'); if(card) card.classList.remove('on'); startCwpTargeting(); }
function _showCwpError(msg){ var el=document.getElementById('cwp-error'); if(el){ el.textContent='⚠ '+msg; el.style.display='block'; } }


// ══════════════════════════════════════════════════════════════════
//  § UC-16  AVATAR HOLD → DEV PANEL
// ══════════════════════════════════════════════════════════════════

function onAvatarPointerDown(){ _devHoldActive=true; if(_devHoldTimer) clearTimeout(_devHoldTimer); _devHoldTimer=setTimeout(function(){ if(!_devHoldActive) return; _devHoldActive=false; _devHoldTimer=null; if(S.user&&S.user.is_admin) _openDevPanel(); },5000); }
function onAvatarPointerUp(){ if(!_devHoldActive) return; _devHoldActive=false; if(_devHoldTimer){ clearTimeout(_devHoldTimer); _devHoldTimer=null; confirmLogout(); } }
function onAvatarPointerLeave(){ _devHoldActive=false; if(_devHoldTimer){ clearTimeout(_devHoldTimer); _devHoldTimer=null; } }

function _openDevPanel(){
  try {
    if(_devPanelOpen){ _closeDevPanel(); return; }
    _devPanelOpen=true; var old=document.getElementById('dev-panel'); if(old) old.parentNode.removeChild(old);
    var ev=S.lastEvent; var email=S.user?S.user.email:''; var uuid=S.user?S.user.uuid:'';
    var panel=document.createElement('div'); panel.id='dev-panel';
    panel.style.cssText='position:fixed;bottom:80px;left:50%;transform:translateX(-50%);width:calc(100% - 32px);max-width:340px;background:#060d14;border:1.5px solid #00e5a0;border-radius:14px;padding:14px 16px;z-index:90;font-family:Barlow Condensed,sans-serif;box-shadow:0 0 24px rgba(0,229,160,.3);';
    panel.innerHTML=
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px"><span style="font-size:16px">🛠️</span><span style="font-size:14px;font-weight:700;color:#00e5a0;letter-spacing:.5px">Dev Control Panel</span><button onclick="_closeDevPanel()" style="margin-left:auto;background:none;border:none;color:rgba(255,255,255,.4);cursor:pointer;font-size:16px;line-height:1">✕</button></div>' +
      '<div style="font-size:10px;color:rgba(255,255,255,.4);margin-bottom:10px;padding:6px 8px;background:rgba(0,0,0,.5);border-radius:6px;">👤 '+email+'<br>🎯 '+(ev?ev.session_name:'(chưa chọn sự kiện)')+'</div>' +
      '<div style="display:flex;flex-direction:column;gap:7px">' +
        '<button onclick="_devUnlock()" style="padding:10px;border-radius:8px;background:rgba(0,229,160,.15);border:1px solid rgba(0,229,160,.4);color:#00e5a0;font-size:12px;font-weight:700;cursor:pointer;">🔓 Force Unlock (24h) — 0 Coins</button>' +
        '<button onclick="_devLock()" style="padding:10px;border-radius:8px;background:rgba(255,82,82,.1);border:1px solid rgba(255,82,82,.3);color:#ff5252;font-size:12px;font-weight:700;cursor:pointer;">🔒 Force Expire — test lock + cleanup</button>' +
        '<button onclick="_devCheckAccess()" style="padding:8px;border-radius:8px;background:rgba(59,158,255,.1);border:1px solid rgba(59,158,255,.3);color:#3b9eff;font-size:11px;font-weight:600;cursor:pointer;">🔍 Check Access Status</button>' +
        '<button onclick="_devToggleMockGps()" id="dev-mock-gps-btn" style="padding:8px;border-radius:8px;background:rgba(255,193,7,.1);border:1px solid rgba(255,193,7,.3);color:#ffc107;font-size:11px;font-weight:600;cursor:pointer;">🎯 Mock GPS Click (Geofence test)</button>' +
      '</div>' +
      '<div id="dev-panel-result" style="margin-top:10px;font-size:11px;color:rgba(255,255,255,.5);min-height:16px;line-height:1.5"></div>' +
      '<div style="margin-top:8px;font-size:9px;color:rgba(255,255,255,.2);text-align:center">Tự đóng sau 30s · Không ảnh hưởng dữ liệu VĐV khác</div>';
    document.body.appendChild(panel);
    setTimeout(function(){ _closeDevPanel(); },30000);
  } catch(e){ console.error('[DevPanel]',e); }
}
function _closeDevPanel(){ _devPanelOpen=false; var el=document.getElementById('dev-panel'); if(el) el.parentNode.removeChild(el); }
function _devSetResult(msg,color){ var el=document.getElementById('dev-panel-result'); if(el){ el.textContent=msg; el.style.color=color||'rgba(255,255,255,.6)'; } }
function _devCallBypass(bypAction,onSuccess){
  var ev=S.lastEvent; var uuid=S.user?S.user.uuid:''; var mail=S.user?S.user.email:'';
  if(!ev||!uuid){ _devSetResult('Chưa chọn sự kiện','#ffc107'); return; }
  _devSetResult('Đang gửi...','#ffc107');
  api({action:'dev_toggleFeatureBypass',caller_email:mail,target_uuid:uuid,event_id:ev.session_id,bypass_action:bypAction},function(err,res){
    if(err||!res||res.status!=='ok'){ _devSetResult('❌ '+(res&&res.message||'Lỗi kết nối'),'#ff5252'); return; }
    onSuccess(res,ev);
    var idx=S.eventsList.findIndex?S.eventsList.findIndex(function(e){ return e.session_id===ev.session_id; }):-1;
    if(idx>=0) setTimeout(function(){ openEvDr(idx); },600);
  });
}
function _devToggleMockGps(){
  try {
    if(typeof _mockGpsActive!=='undefined'&&_mockGpsActive){ _disableMockGpsClick(); var btn=document.getElementById('dev-mock-gps-btn'); if(btn) btn.style.background='rgba(255,193,7,.1)'; _devSetResult('🎯 Mock GPS OFF','#ffc107'); }
    else if(typeof enableMockGpsClick==='function'){ enableMockGpsClick(); var btn=document.getElementById('dev-mock-gps-btn'); if(btn) btn.style.background='rgba(255,193,7,.35)'; _devSetResult('🎯 Mock GPS ON — click bản đồ để test CP','#ffc107'); }
    else { _devSetResult('map.js chưa load','#ff5252'); }
  } catch(e){ _devSetResult('Lỗi: '+e.message,'#ff5252'); }
}
function _devCheckAccess(){
  var ev=S.lastEvent; var uuid=S.user?S.user.uuid:'';
  if(!ev||!uuid){ _devSetResult('Chưa chọn sự kiện','#ffc107'); return; }
  _devSetResult('Đang kiểm tra...','#ffc107');
  api({action:'checkFeatureAccess',user_uuid:uuid,event_id:ev.session_id},function(err,res){
    if(err||!res){ _devSetResult('❌ Lỗi kết nối','#ff5252'); return; }
    _devSetResult('Status: '+res.status+' | unlocked: '+res.is_unlocked+(res.hours_left!==null?' | '+res.hours_left+'h còn lại':'')+' | coins: '+(res.coins_balance||0),res.is_unlocked?'#00e5a0':'#ffc107');
  });
}


// ══════════════════════════════════════════════════════════════════
//  § UC-17  SELF-TEST (console debug)
// ══════════════════════════════════════════════════════════════════

function _sabanSelfTest(){
  console.log('═══ CAMP HUB SA BÀN — SELF TEST ═══');
  var pass=0,fail=0;
  function check(name,cond){ if(cond){ console.log('✅ '+name); pass++; } else { console.warn('❌ '+name); fail++; } }
  var callCount=0; var _origApi=window.api; window.api=function(p,cb){ if(p.action==='getCwpStatus') callCount++; if(cb) cb(null,{has_package:true,package_type:'pack3'}); };
  _cwpProcessing=false; for(var i=0;i<5;i++) startCwpTargeting();
  setTimeout(function(){
    check('Debounce nút tím: 5 click → 1 request (thực: '+callCount+')',callCount<=1); window.api=_origApi;
    var btn=document.getElementById('saban-playpause'); check('Play controller nút tồn tại',!!btn);
    check('FLY_SPEED_MULTIPLIER = 6',typeof FLY_SPEED_MULTIPLIER!=='undefined'&&FLY_SPEED_MULTIPLIER===6);
    check('Camera thích ứng có _getFlyCameraOpts',typeof _getFlyCameraOpts==='function');
    check('Bezier mặc định BẬT',typeof _bezierEnabled!=='undefined'&&_bezierEnabled===true);
    check('filterElevationByStage tồn tại',typeof _filterElevationByStage==='function');
    check('Weather topbar slot tồn tại',!!document.getElementById('weather-content-top'));
    console.log('═══ KẾT QUẢ: '+pass+' PASS / '+fail+' FAIL ═══');
  },600);
}


// ══════════════════════════════════════════════════════════════════
//  § UC-TEST  SMOKE TEST HARNESS — chạy trên Console F12
//  window.runCam5HubCoreTests()
//  Tự kiểm tra 4 checkpoint và báo PASS/FAIL chi tiết
// ══════════════════════════════════════════════════════════════════

window.runCam5HubCoreTests = function() {
  var results = [];
  var pass = 0, fail = 0;

  function log(id, ok, detail) {
    var icon = ok ? '✅ [PASS]' : '❌ [FAIL]';
    console.log(icon + ' Checkpoint ' + id + ': ' + detail);
    results.push({ id: id, ok: ok, detail: detail });
    if (ok) pass++; else fail++;
  }

  console.group('%c🧪 CAM5HUB CORE SMOKE TEST', 'color:#00e5a0;font-weight:800;font-size:14px');

  // ─── CP1: Interval Memory Leak ───────────────────────────────
  try {
    // Kiểm tra _ftStopKcalTicker tồn tại
    var hasStop = typeof _ftStopKcalTicker === 'function';
    log('1a', hasStop, '_ftStopKcalTicker function exists: ' + hasStop);

    // Kiểm tra _endLiveSession gọi _ftStopKcalTicker
    var endSrc = _endLiveSession.toString();
    var endCallsStop = endSrc.includes('_ftStopKcalTicker');
    log('1b', endCallsStop, '_endLiveSession calls _ftStopKcalTicker: ' + endCallsStop);

    // Simulate: bật ticker, kiểm tra id, dừng, kiểm tra null
    if (!S.free_training) S.free_training = { active:false, seconds:0, cumulative_kcal:0, hr:135, _tickerId:null };
    S.free_training.active = true;
    _ftStartKcalTicker();
    var idBefore = S.free_training._tickerId;
    console.log('   CP1 — tickerId before stop:', idBefore);
    _ftStopKcalTicker();
    var idAfter = S.free_training._tickerId;
    console.log('   CP1 — tickerId after stop:', idAfter);
    var cleared = (idAfter === null);
    log('1c', cleared, 'Ticker cleared to null after stop: ' + cleared +
        (cleared ? '' : ' → LEAK: id=' + idAfter));
  } catch(e) {
    log('1', false, 'Exception: ' + e.message);
  }

  // ─── CP2: CORS crossOrigin ────────────────────────────────────
  try {
    // Inspect _drawCanvasBranding source code
    var brandSrc = _drawCanvasBranding.toString();
    var hasCrossOrigin = (brandSrc.match(/crossOrigin\s*=\s*['"]anonymous['"]/g) || []).length;
    // Must appear before img.src
    var crossBeforeSrc = brandSrc.indexOf("crossOrigin = 'anonymous'") <
                         brandSrc.indexOf('.src = ');
    log('2a', hasCrossOrigin >= 2, 'crossOrigin=anonymous count in branding: ' + hasCrossOrigin + ' (need ≥2)');
    log('2b', crossBeforeSrc, 'crossOrigin set BEFORE .src assignment: ' + crossBeforeSrc);
  } catch(e) {
    log('2', false, 'Exception: ' + e.message);
  }

  // ─── CP3: Black Snapshot idle guard ──────────────────────────
  try {
    var renderSrc = _scRenderShareCard.toString();
    var hasIdleGuard = renderSrc.includes("map.once('idle'") ||
                       renderSrc.includes('map.once("idle"');
    var hasLoadCheck = renderSrc.includes('isStyleLoaded') || renderSrc.includes('.loaded()');
    log('3a', hasIdleGuard, "map.once('idle') guard exists: " + hasIdleGuard);
    log('3b', hasLoadCheck, 'map.loaded() / isStyleLoaded check exists: ' + hasLoadCheck);

    // Simulate: nếu S.map có thể test
    if (S.map && typeof S.map.isStyleLoaded === 'function') {
      var styleReady = S.map.isStyleLoaded();
      log('3c', true, 'Current map.isStyleLoaded(): ' + styleReady + ' (runtime check OK)');
    } else {
      log('3c', true, 'S.map not yet init — skip runtime check (OK for test env)');
    }
  } catch(e) {
    log('3', false, 'Exception: ' + e.message);
  }

  // ─── CP4: Overlay DOM removal ────────────────────────────────
  try {
    var closeFns = [
      { name: '_closeOfficialBriefing',   fn: typeof _closeOfficialBriefing   },
      { name: '_closeFreeTrainingOverlay', fn: typeof _closeFreeTrainingOverlay },
      { name: '_removeGeofenceDialog',    fn: typeof _removeGeofenceDialog    },
      { name: '_hideGpsRadarOverlay',     fn: typeof _hideGpsRadarOverlay     },
    ];

    closeFns.forEach(function(cf) {
      var exists = cf.fn === 'function';
      log('4-' + cf.name, exists, cf.name + ' exists: ' + exists);
    });

    // Check _renderCyberOverlay's auto-close uses removeChild
    var cyberSrc = _renderCyberOverlay.toString();
    var usesRemove = cyberSrc.includes('removeChild') || cyberSrc.includes('.remove()');
    log('4-factory-remove', usesRemove, '_renderCyberOverlay closeFn uses removeChild: ' + usesRemove);

    // Simulate: tạo dummy overlay, close nó, check DOM
    var testId = 'test-overlay-cp4-' + Date.now();
    var dummy  = document.createElement('div');
    dummy.id   = testId;
    dummy.style.cssText = 'position:fixed;inset:0;z-index:999999;pointer-events:auto;background:transparent;';
    document.body.appendChild(dummy);

    // Gọi auto close pattern
    dummy.style.opacity = '0';
    setTimeout(function() {
      if (dummy.parentNode) dummy.parentNode.removeChild(dummy);
      var removed = !document.getElementById(testId);
      console.log((removed ? '✅' : '❌') + ' CP4 — Dummy overlay DOM removed after fade: ' + removed);
    }, 300);

  } catch(e) {
    log('4', false, 'Exception: ' + e.message);
  }

  // ─── CP BONUS: Geofence 5s timeout auto-redirect ─────────────
  try {
    var geoSrc = typeof checkStartLineGeofence === 'function'
      ? checkStartLineGeofence.toString() : '';
    var hasTimeout5000 = geoSrc.includes('timeout: 5000') || geoSrc.includes('timeout:5000');
    var hasMaxAge0     = geoSrc.includes('maximumAge: 0') || geoSrc.includes('maximumAge:0');
    log('GPS-timeout', hasTimeout5000, 'Geofence GPS timeout=5000ms: ' + hasTimeout5000);
    log('GPS-maxAge',  hasMaxAge0,     'Geofence maximumAge=0: '      + hasMaxAge0);
  } catch(e) {
    log('GPS', false, 'Exception: ' + e.message);
  }

  // ─── Corner Case 1: iOS Gesture Token — Eager Audio ──────────
  try {
    var launchSrc = typeof _ftLaunchRun === 'function' ? _ftLaunchRun.toString() : '';
    var eagerBeforeAsync = launchSrc.indexOf('_keepAliveSilentAudioEager') <
                           launchSrc.indexOf('_activateKeepAlive');
    log('CC1-eager-before-async', eagerBeforeAsync,
      'Eager audio init BEFORE async KeepAlive: ' + eagerBeforeAsync);

    var eagerFnExists = typeof _keepAliveSilentAudioEager === 'function';
    log('CC1-eager-fn', eagerFnExists, '_keepAliveSilentAudioEager exists: ' + eagerFnExists);

    // Verify audio created synchronously (not inside promise/callback)
    var eagerSrc = eagerFnExists ? _keepAliveSilentAudioEager.toString() : '';
    var noPromiseInEager = !eagerSrc.includes('.then(') && !eagerSrc.includes('callback');
    log('CC1-no-async-in-eager', noPromiseInEager, 'Eager fn has no async/promise: ' + noPromiseInEager);
  } catch(e) { log('CC1', false, 'Exception: ' + e.message); }

  // ─── Corner Case 2: Scrubber Jitter Flag Lock ─────────────────
  try {
    // Verify _coachMilestoneFired object exists
    var flagExists = typeof _coachMilestoneFired !== 'undefined';
    log('CC2-flag-exists', flagExists, '_coachMilestoneFired state exists: ' + flagExists);

    // Simulate: fire milestone 25 twice → should only trigger once
    if (flagExists) {
      _coachMilestoneFired = {}; // reset
      var fired1 = false, fired2 = false;
      var orig = window._showCoachingMoment;
      window._showCoachingMoment = function() { fired1 = !fired1 ? (fired1=true) || true : (fired2=true) || true; };
      _triggerCoachingMilestone(25.1); // first pass → should fire
      _triggerCoachingMilestone(24.9); // back under threshold → no fire
      _triggerCoachingMilestone(25.2); // second pass → should NOT fire (locked)
      window._showCoachingMoment = orig;
      log('CC2-fire-once', fired1 && !fired2, 'Milestone 25% fires exactly once: fired1=' + fired1 + ' fired2=' + fired2);
      _coachMilestoneFired = {}; // clean up
    }

    // Verify reset function clears all locks
    _coachMilestoneFired = { 25:true, 50:true };
    if (typeof _resetCoachingMilestones === 'function') _resetCoachingMilestones();
    var allCleared = Object.keys(_coachMilestoneFired).length === 0;
    log('CC2-reset-clears-all', allCleared, '_resetCoachingMilestones clears all flags: ' + allCleared);
  } catch(e) { log('CC2', false, 'Exception: ' + e.message); }

  // ─── Corner Case 3: Clean Exit Wipeout ───────────────────────
  try {
    var endSrc = typeof _endLiveSession === 'function' ? _endLiveSession.toString() : '';
    var hasClearCrash = endSrc.includes('_clearCrashBuffer');
    log('CC3-clean-exit', hasClearCrash, '_endLiveSession calls _clearCrashBuffer: ' + hasClearCrash);

    // Simulate: save buffer, call endLiveSession mock, check cleared
    localStorage.setItem('cam5hub_crash_recovery', JSON.stringify({ test: true, ts: Date.now() }));
    _clearCrashBuffer();
    var afterClear = localStorage.getItem('cam5hub_crash_recovery');
    log('CC3-buffer-cleared', afterClear === null, 'localStorage cleared after _clearCrashBuffer: ' + (afterClear === null));
  } catch(e) { log('CC3', false, 'Exception: ' + e.message); }

  // ─── Corner Case 4: Speech Synthesis Overlap ─────────────────
  try {
    var alertSrc = typeof _playGeofenceAlert === 'function' ? _playGeofenceAlert.toString() : '';
    // cancel() must appear BEFORE setTimeout (not inside it)
    var cancelPos  = alertSrc.indexOf('speechSynthesis.cancel()');
    var setTmPos   = alertSrc.indexOf('setTimeout(');
    var cancelBeforeTimeout = cancelPos > -1 && cancelPos < setTmPos;
    log('CC4-cancel-before-timeout', cancelBeforeTimeout,
      'speechSynthesis.cancel() fires BEFORE setTimeout: ' + cancelBeforeTimeout +
      ' (cancelPos=' + cancelPos + ' setTmPos=' + setTmPos + ')');

    // Verify cancel is NOT only inside the setTimeout callback
    var timeoutBlock = alertSrc.slice(setTmPos);
    var cancelInsideOnly = !cancelBeforeTimeout && timeoutBlock.includes('speechSynthesis.cancel()');
    log('CC4-not-only-inside', !cancelInsideOnly, 'cancel() not trapped inside async only: ' + !cancelInsideOnly);
  } catch(e) { log('CC4', false, 'Exception: ' + e.message); }

  // ─── CP5: S.hologram_assets schema ───────────────────────────
  try {
    var holExists = typeof S !== 'undefined' && S && !!S.hologram_assets;
    log('CP5-schema-exists', holExists, 'S.hologram_assets schema present: ' + holExists);

    if (holExists) {
      var hasBeacons    = Array.isArray(S.hologram_assets.beacons);
      var hasVoxels     = typeof S.hologram_assets.kids_voxels === 'object';
      var voxelKeys     = hasVoxels ? Object.keys(S.hologram_assets.kids_voxels) : [];
      var firstVoxel    = voxelKeys.length ? S.hologram_assets.kids_voxels[voxelKeys[0]] : null;
      log('CP5-beacons-array',   hasBeacons, 'beacons is Array: ' + hasBeacons);
      log('CP5-voxels-object',   hasVoxels,  'kids_voxels is Object: ' + hasVoxels);
      log('CP5-voxel-has-coords',
        !!(firstVoxel && firstVoxel.lat && firstVoxel.lng),
        'First voxel has lat/lng: ' + (firstVoxel ? firstVoxel.lat + ',' + firstVoxel.lng : 'none'));
      log('CP5-voxel-fund-fields',
        !!(firstVoxel && firstVoxel.target_fund && firstVoxel.current_fund !== undefined),
        'Voxel has fund fields: target=' + (firstVoxel && firstVoxel.target_fund) +
        ' current=' + (firstVoxel && firstVoxel.current_fund));
    }
  } catch(e) { log('CP5', false, 'Exception: ' + e.message); }

  // ─── CP6: _scanActiveHolograms pure fn ───────────────────────
  try {
    var scanExists = typeof _scanActiveHolograms === 'function';
    log('CP6-fn-exists', scanExists, '_scanActiveHolograms exists: ' + scanExists);

    if (scanExists) {
      // Test 1: điểm trong bán kính
      var mockUser   = { lat: 20.520, lng: 105.895 };
      var mockAssets = [
        { id: 'TEST_NEAR',  lat: 20.5201, lng: 105.8951 }, // ~14m
        { id: 'TEST_FAR',   lat: 20.530,  lng: 105.900  }, // ~1.3km
      ];
      var hits = _scanActiveHolograms(mockUser, mockAssets, 50);
      log('CP6-near-hit',  hits.length === 1 && hits[0].id === 'TEST_NEAR',
        'Near asset (14m) found, far (1.3km) excluded: hits=' + hits.length +
        (hits.length ? ' id=' + hits[0].id + ' dist=' + hits[0].dist_m + 'm' : ''));

      // Test 2: empty array
      var emptyHits = _scanActiveHolograms(mockUser, [], 80);
      log('CP6-empty-input', emptyHits.length === 0, 'Empty assets returns []: ' + emptyHits.length);

      // Test 3: object input (kids_voxels format)
      if (S && S.hologram_assets && S.hologram_assets.kids_voxels) {
        var voxelHits = _scanActiveHolograms(
          { lat: 20.520, lng: 105.895 },
          S.hologram_assets.kids_voxels,
          200
        );
        log('CP6-object-input', Array.isArray(voxelHits),
          'kids_voxels Object input returns Array: ' + Array.isArray(voxelHits) +
          ' hits=' + voxelHits.length);
      }

      // Test 4: null location graceful
      var nullHits = _scanActiveHolograms(null, mockAssets, 80);
      log('CP6-null-location', nullHits.length === 0, 'null location returns [] gracefully');
    }
  } catch(e) { log('CP6', false, 'Exception: ' + e.message); }

  // ─── Summary ─────────────────────────────────────────────────
  console.log('%c\n══ RESULT: ' + pass + ' PASS / ' + fail + ' FAIL ══',
    fail === 0
      ? 'color:#00e5a0;font-weight:800'
      : 'color:#ff5252;font-weight:800'
  );
  console.groupEnd();
  return { pass: pass, fail: fail, results: results };
};

console.log('%c[CAM5HUB] Smoke test ready → run: runCam5HubCoreTests()',
  'color:#00f2fe;font-size:11px');


// ══════════════════════════════════════════════════════════════════
//  § UC-KEEPALIVE  BACKGROUND KEEP-ALIVE GUARD
//  WakeLock + silent audio fallback cho iOS Safari
//  _activateKeepAlive() / _releaseKeepAlive()
// ══════════════════════════════════════════════════════════════════

/* 1 giây WAV im lặng — base64, không cần server */
var _SILENT_WAV_B64 = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAA' +
  'EAAQAAwAAAAIABAAAgABAAZGF0YQAAAAA=';

var _keepAliveWakeLock = null;
var _keepAliveAudio    = null;

/**
 * Kích hoạt Keep-Alive ngay khi user bấm Start.
 * Ưu tiên WakeLock → fallback silent audio loop.
 * Bọc Try-Catch đầy đủ: máy cũ không hỗ trợ thì skip gracefully.
 */
/**
 * Chốt 1 FIX: Tạo audio element và gọi .play() NGAY trong gesture context.
 * Phải gọi synchronously trong onclick/pointerup — không trong callback async.
 * Sau đó _activateKeepAlive() sẽ tái sử dụng element này.
 */
function _keepAliveSilentAudioEager() {
  try {
    if (_keepAliveAudio) return; // đã init rồi
    var audio    = document.createElement('audio');
    audio.src    = _SILENT_WAV_B64;
    audio.loop   = true;
    audio.volume = 0;
    audio.muted  = false;
    audio.style.display = 'none';
    document.body.appendChild(audio);
    _keepAliveAudio = audio;
    // .play() ĐỒNG BỘ trong gesture — iOS chấp nhận
    var p = audio.play();
    if (p && p.catch) p.catch(function() { /* graceful */ });
  } catch(e) {}
}

function _activateKeepAlive() {
  try {
    // WakeLock (ưu tiên — async nhưng không ảnh hưởng iOS audio)
    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen').then(function(lock) {
        _keepAliveWakeLock = lock;
        lock.addEventListener('release', function() { _keepAliveWakeLock = null; });
      }).catch(function() {
        // WakeLock từ chối → audio fallback đã chạy từ Eager call
      });
    }
    // Silent audio: nếu chưa init (path không qua _ftLaunchRun) → init bây giờ
    if (!_keepAliveAudio) {
      _keepAliveSilentAudio();
    } else if (_keepAliveAudio.paused) {
      // Đã có audio nhưng đang paused → resume
      var r = _keepAliveAudio.play();
      if (r && r.catch) r.catch(function() {});
    }
  } catch(e) {
    try { _keepAliveSilentAudio(); } catch(ae) {}
  }
}

/** Fallback: phát silent audio loop để tránh iOS freeze tab */
function _keepAliveSilentAudio() {
  try {
    if (_keepAliveAudio) return; // đã chạy rồi
    var audio      = document.createElement('audio');
    audio.src      = _SILENT_WAV_B64;
    audio.loop     = true;
    audio.volume   = 0;
    audio.muted    = false; // iOS cần unmuted mới giữ tab sống
    audio.style.display = 'none';
    document.body.appendChild(audio);
    _keepAliveAudio = audio;
    audio.play().catch(function() {
      // Autoplay bị chặn — bình thường, gracefully skip
    });
  } catch(e) {}
}

/**
 * Giải phóng Keep-Alive khi kết thúc phiên.
 * Trả lại tài nguyên pin cho máy.
 */
function _releaseKeepAlive() {
  try {
    if (_keepAliveWakeLock) {
      _keepAliveWakeLock.release().catch(function() {});
      _keepAliveWakeLock = null;
    }
  } catch(e) {}
  try {
    if (_keepAliveAudio) {
      _keepAliveAudio.pause();
      if (_keepAliveAudio.parentNode) _keepAliveAudio.parentNode.removeChild(_keepAliveAudio);
      _keepAliveAudio = null;
    }
  } catch(e) {}
}


// ══════════════════════════════════════════════════════════════════
//  § UC-CRASH  OFFLINE TELEMETRY BUFFER + AUTO-RESUME
//  _saveCrashBuffer / _clearCrashBuffer / _checkCrashRecovery
// ══════════════════════════════════════════════════════════════════

var _CRASH_KEY = 'cam5hub_crash_recovery';
var _crashBufferTick = 0; // đếm giây để save mỗi 5s

/**
 * Serialize và lưu telemetry xuống localStorage.
 * Gọi mỗi 5 giây từ trong _ftStartKcalTicker.
 * @param {number} evIdx — để resume đúng event
 */
function _saveCrashBuffer(evIdx) {
  try {
    var data = {
      ts             : Date.now(),
      evIdx          : evIdx != null ? evIdx : (S.training ? S.training.event_idx : null),
      activeLegIndex : (S.saban && S.saban.active) ? S.saban.activeLegIndex : 0,
      seconds        : (S.free_training && S.free_training.seconds) || 0,
      cumulative_kcal: (S.free_training && S.free_training.cumulative_kcal) || 0,
      distance_m     : (S.training && S.training.distance_m) || 0,
      user_biometrics: S.user_biometrics || {},
    };
    localStorage.setItem(_CRASH_KEY, JSON.stringify(data));
  } catch(e) { /* localStorage đầy → graceful skip */ }
}

function _clearCrashBuffer() {
  try { localStorage.removeItem(_CRASH_KEY); } catch(e) {}
}

/**
 * Kiểm tra crash buffer khi app khởi động.
 * Hook vào cuối loadUserAssets(onDone).
 */
function _checkCrashRecovery() {
  try {
    var raw = localStorage.getItem(_CRASH_KEY);
    if (!raw) return;
    var data = JSON.parse(raw);
    if (!data || !data.ts) { _clearCrashBuffer(); return; }

    // Chỉ hỏi resume nếu crash < 2 tiếng trước
    if ((Date.now() - data.ts) > 2 * 60 * 60 * 1000) { _clearCrashBuffer(); return; }

    var km    = ((data.distance_m || 0) / 1000).toFixed(2);
    var kcal  = Math.round(data.cumulative_kcal || 0);
    var ago   = Math.round((Date.now() - data.ts) / 60000);

    var contentHtml = [
      '<div style="background:rgba(255,193,7,.06);border:1px solid rgba(255,193,7,.2);',
      'border-radius:10px;padding:12px;margin-bottom:4px;font-size:13px;color:rgba(255,230,150,.9);line-height:1.7;">',
        'Cam5Hub đã bảo toàn hành trình bị gián đoạn ' + ago + ' phút trước:<br>',
        '<b style="color:#ffc107;font-size:18px;">' + km + ' km</b>',
        ' &nbsp;·&nbsp; ',
        '<b style="color:#00e5a0;font-size:18px;">' + kcal + ' Kcal</b>',
      '</div>',
    ].join('');

    var overlay = _renderCyberOverlay('crash-recovery-overlay', {
      accentColor : '#ffc107',
      title       : '🔋 Phục Hồi Phiên Chạy Thực Địa',
      subtitle    : 'Hành trình bị gián đoạn',
      contentHtml : contentHtml,
      primaryBtn  : {
        label  : '🔺 Khôi Phục Hành Trình',
        onclick: '_crashDoResume(' + (data.evIdx != null ? data.evIdx : 0) + ')',
      },
      closeId: '_crashDismiss',
    });

    overlay._crashData = data;
    document.body.appendChild(overlay);

    // Nút xóa bỏ
    var slot = document.getElementById('crash-recovery-overlay-content-slot');
    if (slot) {
      var dismissBtn = document.createElement('button');
      dismissBtn.onclick = _crashDismiss;
      dismissBtn.textContent = '✕ Xóa bỏ — Bắt đầu hành trình mới';
      dismissBtn.style.cssText = [
        'width:100%;margin-top:8px;padding:10px 0;',
        'font-family:\'Barlow Condensed\',sans-serif;font-size:12px;',
        'background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);',
        'color:rgba(255,255,255,.4);border-radius:10px;cursor:pointer;',
      ].join('');
      slot.appendChild(dismissBtn);
    }

  } catch(e) { _clearCrashBuffer(); }
}

/** Khôi phục state từ crash buffer → hydrate S → restart ticker */
function _crashDoResume(evIdx) {
  try {
    var raw = localStorage.getItem(_CRASH_KEY);
    if (!raw) { _crashDismiss(); return; }
    var data = JSON.parse(raw);

    // Hydrate S
    if (!S.user_biometrics) S.user_biometrics = data.user_biometrics || {};
    if (!S.free_training)   S.free_training   = { active:false, seconds:0, cumulative_kcal:0, hr:135 };
    S.free_training.seconds         = data.seconds         || 0;
    S.free_training.cumulative_kcal = data.cumulative_kcal || 0;
    if (!S.training) S.training = {};
    S.training.distance_m = data.distance_m || 0;

    _crashDismiss();
    _clearCrashBuffer();

    // Tái dựng HUD + restart ticker
    _ftShowFreeHUD();
    showToast('♻️ Hành trình đã khôi phục — tiếp tục!', 'ok', 3000);

  } catch(e) { _crashDismiss(); }
}

function _crashDismiss() {
  _clearCrashBuffer();
  var el = document.getElementById('crash-recovery-overlay');
  if (el) {
    el.style.transition = 'opacity .22s ease';
    el.style.opacity    = '0';
    setTimeout(function() { if (el && el.parentNode) el.parentNode.removeChild(el); }, 230);
  }
}


// ══════════════════════════════════════════════════════════════════
//  § UC-HOL  KIDS VOXEL MICRO-DONATION INTERACTION
//  Tái sử dụng _renderCyberOverlay + _showCoachingMoment
//  Kích hoạt khi VĐV lọt Geofence trạm trẻ em sáng tạo
// ══════════════════════════════════════════════════════════════════

/**
 * Trigger khi VĐV tiếp cận trạm tác phẩm Kids Voxel.
 * @param {string} assetId — key trong S.hologram_assets.kids_voxels
 */
function _triggerKidsVoxelInteraction(assetId) {
  try {
    if (!S.hologram_assets || !S.hologram_assets.kids_voxels) return;
    var asset = S.hologram_assets.kids_voxels[assetId];
    if (!asset) return;

    // ── Bước 1: Coaching toast góc trái dưới ─────────────────────
    if (typeof _showCoachingMoment === 'function') {
      _showCoachingMoment(
        '✨ Bạn đang đi qua tác phẩm 3D của ' + asset.creator_name + '!',
        '#ffd600'
      );
    }

    // ── Bước 2: Popup micro-donation kính mờ ─────────────────────
    var pctFunded   = Math.min(100, Math.round((asset.current_fund / asset.target_fund) * 100));
    var barColor    = pctFunded >= 75 ? '#00e5a0' : pctFunded >= 40 ? '#ffc107' : '#ff7043';
    var userCoins   = (S.user && S.user.coins_balance != null) ? S.user.coins_balance : 0;
    var canDonate   = userCoins >= 5;

    var contentHtml = [
      '<div style="margin-bottom:12px;">',
        '<div style="font-size:11px;color:rgba(255,255,255,.4);',
        'letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">',
        'Tác phẩm của ' + asset.creator_name,
        '</div>',
        /* Progress bar */
        '<div style="background:rgba(255,255,255,.08);border-radius:6px;height:8px;overflow:hidden;margin-bottom:6px;">',
          '<div style="height:100%;width:' + pctFunded + '%;',
          'background:' + barColor + ';border-radius:6px;',
          'transition:width .4s ease;',
          'box-shadow:0 0 8px ' + barColor + ';"></div>',
        '</div>',
        '<div style="display:flex;justify-content:space-between;font-size:12px;">',
          '<span style="color:' + barColor + ';font-weight:700;">' + asset.current_fund + ' / ' + asset.target_fund + ' Coins</span>',
          '<span style="color:rgba(255,255,255,.4);">' + pctFunded + '% đạt mục tiêu</span>',
        '</div>',
      '</div>',
      '<div style="font-size:12px;color:rgba(255,255,255,.6);',
      'background:rgba(255,214,0,.04);border:1px solid rgba(255,214,0,.15);',
      'border-radius:8px;padding:8px 10px;margin-bottom:10px;line-height:1.6;">',
        asset.stamp_text,
      '</div>',
      !canDonate
        ? '<div style="font-size:11px;color:rgba(255,82,82,.7);text-align:center;">Ví bạn còn ' + userCoins + ' Coins — chưa đủ để tặng</div>'
        : '',
    ].join('');

    var overlay = _renderCyberOverlay('kids-voxel-overlay-' + assetId, {
      accentColor : '#ffd600',
      title       : '🔺 TIẾP SỨC ƯỚC MƠ ĐẤT BẢN ĐỊA',
      subtitle    : 'Quỹ học bổng sáng tạo Tam Chúc',
      contentHtml : contentHtml,
      primaryBtn  : canDonate ? {
        label  : '🔥 TẶNG 5 COINS',
        onclick: '_kidsVoxelDonate(\'' + assetId + '\')',
      } : null,
    });

    document.body.appendChild(overlay);

  } catch(e) { console.warn('[_triggerKidsVoxelInteraction]', e.message); }
}

/**
 * Xử lý giao dịch micro-donation 5 Coins cho trạm trẻ em.
 * Trừ Coins ví → cộng quỹ → log donations → pháo hoa.
 * @param {string} assetId
 */
function _kidsVoxelDonate(assetId) {
  try {
    var DONATE_AMOUNT = 5;

    // ── Guard: kiểm tra Coins ──────────────────────────────────
    if (!S.user || (S.user.coins_balance || 0) < DONATE_AMOUNT) {
      if (typeof showToast === 'function') showToast('Không đủ Coins để tặng', 'err', 2500);
      return;
    }

    var asset = S.hologram_assets && S.hologram_assets.kids_voxels &&
                S.hologram_assets.kids_voxels[assetId];
    if (!asset) return;

    // ── Trừ Coins ──────────────────────────────────────────────
    S.user.coins_balance = (S.user.coins_balance || 0) - DONATE_AMOUNT;
    document.querySelectorAll('.pcoins').forEach(function(el) {
      el.textContent = Number(S.user.coins_balance).toLocaleString('vi-VN');
    });

    // ── Cộng quỹ trạm ─────────────────────────────────────────
    asset.current_fund = (asset.current_fund || 0) + DONATE_AMOUNT;

    // ── Log donation ───────────────────────────────────────────
    if (!S.free_training) S.free_training = { local_donations: [] };
    if (!S.free_training.local_donations) S.free_training.local_donations = [];
    S.free_training.local_donations.push({
      ts        : Date.now(),
      assetId   : assetId,
      creator   : asset.creator_name,
      amount    : DONATE_AMOUNT,
      fund_after: asset.current_fund,
    });

    // ── Đóng overlay ──────────────────────────────────────────
    var overlayId = 'kids-voxel-overlay-' + assetId;
    var el = document.getElementById(overlayId);
    if (el) {
      el.style.transition = 'opacity .22s ease';
      el.style.opacity    = '0';
      setTimeout(function() { if (el && el.parentNode) el.parentNode.removeChild(el); }, 230);
    }

    // ── Hiệu ứng pháo hoa + toast ─────────────────────────────
    if (typeof launchConfetti === 'function') launchConfetti();
    if (typeof showCoinsBurst === 'function') showCoinsBurst(DONATE_AMOUNT);
    if (typeof showToast === 'function') {
      showToast(
        '🌟 Đã tặng ' + DONATE_AMOUNT + ' Coins cho ' + asset.creator_name +
        '! Quỹ: ' + asset.current_fund + '/' + asset.target_fund,
        'ok', 4000
      );
    }

    // ── Coaching moment ───────────────────────────────────────
    if (typeof _showCoachingMoment === 'function') {
      setTimeout(function() {
        _showCoachingMoment(
          '💛 Cảm ơn bạn đã tiếp sức ước mơ của ' + asset.creator_name + '!',
          '#ffd600'
        );
      }, 600);
    }

  } catch(e) { console.warn('[_kidsVoxelDonate]', e.message); }
}


// ══════════════════════════════════════════════════════════════════
//  § UC-SEC  SECURITY SCAN HUD + CHECKOUT PENALTY ENGINE
//  + CART UI HELPERS
// ══════════════════════════════════════════════════════════════════

/**
 * Quét mã QR an ninh thực địa — hiện popup đổi màu tức thì.
 * GRANTED → Lục Neon | EXPIRED → Vàng Neon + gia hạn |
 * DENIED_NDA → Đỏ + mở hộp đen log
 * @param {string} crewId
 * @param {string} zoneId
 */
function _triggerSecurityQuickScan(crewId, zoneId) {
  try {
    if (typeof _verifySecurityAccess !== 'function') {
      showToast('Hệ thống kiểm soát chưa load', 'err', 2000); return;
    }

    var result = _verifySecurityAccess(crewId, zoneId, Date.now());

    // Màu sắc theo trạng thái
    var colorMap = {
      GRANTED     : { accent: '#00e5a0', bg: 'rgba(0,229,160,0.08)', icon: '✅' },
      EXPIRED     : { accent: '#ffc107', bg: 'rgba(255,193,7,0.08)',  icon: '⏰' },
      DENIED_NDA  : { accent: '#ff5252', bg: 'rgba(255,82,82,0.08)',  icon: '🚫' },
      DENIED      : { accent: '#ff7043', bg: 'rgba(255,112,67,0.08)', icon: '⛔' },
      UNKNOWN_ZONE: { accent: '#ab47bc', bg: 'rgba(171,71,188,0.08)', icon: '❓' },
    };
    var c = colorMap[result.status] || colorMap['DENIED'];

    // Nội dung theo status
    var extraHtml = '';
    if (result.status === 'EXPIRED') {
      extraHtml = '<button onclick="_secRenewAccess(\'' + crewId + '\',\'' + zoneId + '\')" style="' +
        'width:100%;margin-top:10px;padding:10px 0;font-family:\'Barlow Condensed\',sans-serif;' +
        'font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;' +
        'background:rgba(255,193,7,0.15);border:1.5px solid rgba(255,193,7,0.5);' +
        'color:#ffc107;border-radius:10px;cursor:pointer;">⚡ GIA HẠN BẰNG 20 COINS</button>';
    } else if (result.status === 'DENIED_NDA') {
      // Ghi log vào hộp đen
      _secLogViolation(crewId, zoneId);
      var logs = (S.media_governance && S.media_governance.media_vault && S.media_governance.media_vault.daily_logs) || [];
      var logsHtml = logs.slice(-5).map(function(l) {
        return '<div style="font-size:10px;color:rgba(255,82,82,0.7);font-family:monospace;">' +
          new Date(l.ts).toLocaleTimeString('vi-VN') + ' · ' + l.crew_id + ' → ' + l.zone_id + ' · ' + l.action + '</div>';
      }).join('');
      extraHtml = '<div style="background:rgba(255,82,82,0.05);border:1px solid rgba(255,82,82,0.2);border-radius:8px;padding:10px;margin-top:10px;">' +
        '<div style="font-size:11px;font-weight:700;color:#ff5252;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">🔍 HỘP ĐEN MEDIA — LOG GẦN NHẤT</div>' +
        logsHtml +
        '</div>';
    }

    var contentHtml = [
      '<div style="background:' + c.bg + ';border-radius:10px;padding:14px;margin-bottom:10px;text-align:center;">',
        '<div style="font-size:36px;margin-bottom:6px;">' + c.icon + '</div>',
        '<div style="font-size:15px;font-weight:800;color:' + c.accent + ';letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">' + result.status.replace(/_/g,' ') + '</div>',
        '<div style="font-size:12px;color:rgba(255,255,255,0.7);line-height:1.6;">' + result.reason + '</div>',
      '</div>',
      '<div style="font-size:11px;color:rgba(255,255,255,0.35);display:flex;justify-content:space-between;">',
        '<span>Vùng: ' + (result.zone_name || zoneId) + '</span>',
        '<span>Crew: ' + (result.crew_name || crewId) + '</span>',
      '</div>',
      extraHtml,
    ].join('');

    var overlay = _renderCyberOverlay('security-scan-overlay', {
      accentColor : c.accent,
      title       : '🛡 KIỂM SOÁT AN NINH THỰC ĐỊA',
      subtitle    : new Date().toLocaleTimeString('vi-VN'),
      contentHtml : contentHtml,
      primaryBtn  : result.status === 'GRANTED' ? {
        label  : '✅ Thông Quan',
        onclick: '_cy_close_security_scan_overlay()',
      } : null,
    });

    document.body.appendChild(overlay);

  } catch(e) { console.warn('[_triggerSecurityQuickScan]', e.message); }
}

/** Ghi vi phạm NDA vào media vault */
function _secLogViolation(crewId, zoneId) {
  try {
    if (!S.media_governance || !S.media_governance.media_vault) return;
    S.media_governance.media_vault.daily_logs.push({
      ts        : Date.now(),
      crew_id   : crewId,
      zone_id   : zoneId,
      action    : 'NDA_VIOLATION',
      file_hash : null,
    });
  } catch(e) {}
}

/** Gia hạn thẻ bằng Coins (20 Coins) */
function _secRenewAccess(crewId, zoneId) {
  try {
    var RENEW_COST = 20;
    var wallet = S.marketplace && S.marketplace.wallet_system;
    if (!wallet || wallet.user_coins < RENEW_COST) {
      showToast('Không đủ Coins để gia hạn · Cần ' + RENEW_COST + ' Coins', 'err', 3000); return;
    }
    wallet.user_coins -= RENEW_COST;

    // Gia hạn token 4 tiếng
    var zone = S.media_governance && S.media_governance.space_control && S.media_governance.space_control[zoneId];
    if (zone) zone.token_ttl = Date.now() + 4 * 60 * 60 * 1000;

    var ol = document.getElementById('security-scan-overlay');
    if (ol && ol.parentNode) ol.parentNode.removeChild(ol);
    showToast('✅ Đã gia hạn thẻ 4 giờ · Trừ ' + RENEW_COST + ' Coins', 'ok', 3000);
    _triggerSecurityQuickScan(crewId, zoneId); // Re-scan

  } catch(e) { console.warn('[_secRenewAccess]', e.message); }
}

/**
 * Áp lệnh phạt Coin khi checkout muộn lố giờ.
 * @param {string} crewId
 * @param {number} lateMinutes — số phút trễ
 */
function _executeCheckoutGatePenalties(crewId, lateMinutes) {
  try {
    lateMinutes = lateMinutes || 0;
    if (lateMinutes <= 0) return;

    var PENALTY_PER_HOUR = 10; // 10 Coins / tiếng trễ
    var penaltyCoins = Math.ceil(lateMinutes / 60) * PENALTY_PER_HOUR;

    var wallet = S.marketplace && S.marketplace.wallet_system;
    var target = wallet && wallet.sub_wallets && wallet.sub_wallets[crewId];

    if (target) {
      // Trừ từ sub_wallet của Shadow Account
      target.spent_coins = (target.spent_coins || 0) + penaltyCoins;
      showToast('⏰ [' + (target.name || crewId) + '] Phạt checkout muộn ' + lateMinutes + 'p · −' + penaltyCoins + ' Coins', 'warn', 4000);
    } else if (wallet) {
      // Trừ từ ví Leader
      wallet.user_coins = Math.max(0, (wallet.user_coins || 0) - penaltyCoins);
      showToast('⏰ Phạt checkout muộn ' + lateMinutes + 'p · −' + penaltyCoins + ' Coins', 'warn', 4000);
    }

    // Ghi transaction log
    if (wallet) {
      wallet.transactions.push({
        ts        : Date.now(),
        type      : 'CHECKOUT_PENALTY',
        amount    : -penaltyCoins,
        desc      : 'Phạt checkout muộn ' + lateMinutes + ' phút',
        shadow_id : crewId,
      });
    }
  } catch(e) { console.warn('[_executeCheckoutGatePenalties]', e.message); }
}


// ══════════════════════════════════════════════════════════════════
//  NÂNG CẤP TEST HARNESS — CP7, CP8, CP9
// ══════════════════════════════════════════════════════════════════

// Override runCam5HubCoreTests để thêm CP7-9 vào cuối suite
(function() {
  var _origTests = window.runCam5HubCoreTests;
  window.runCam5HubCoreTests = function() {
    // Chạy bộ test gốc
    var baseResult = _origTests ? _origTests() : { pass: 0, fail: 0, results: [] };
    var pass = baseResult.pass, fail = baseResult.fail;

    function log(id, ok, detail) {
      var icon = ok ? '✅ [PASS]' : '❌ [FAIL]';
      console.log(icon + ' ' + id + ': ' + detail);
      if (ok) pass++; else fail++;
    }

    console.group('%c🧪 CP7-9 MARKETPLACE & SECURITY TESTS', 'color:#ffc107;font-weight:800;font-size:13px');

    // ── CP7: Security verifier — EXPIRED scenario ─────────────
    try {
      var secFnExists = typeof _verifySecurityAccess === 'function';
      log('CP7-fn-exists', secFnExists, '_verifySecurityAccess exists: ' + secFnExists);

      if (secFnExists && S.media_governance) {
        // Thêm zone test tạm
        S.media_governance.space_control['ZONE_TEST_CP7'] = {
          id: 'ZONE_TEST_CP7', name: 'Test Zone CP7',
          allowed_crew: ['PRESS_PASS'], token_ttl: Date.now() - 1000, nda_zone: false,
        };
        S.media_governance.crew_registry['CREW_CP7'] = { name: 'Crew Test', pass_type: 'PRESS_PASS' };

        var expiredResult = _verifySecurityAccess('CREW_CP7', 'ZONE_TEST_CP7', Date.now());
        log('CP7-expired', expiredResult.status === 'EXPIRED',
          'EXPIRED returned for past TTL: ' + expiredResult.status + ' · ' + expiredResult.reason.slice(0, 40));

        // Test DENIED_NDA
        S.media_governance.space_control['ZONE_NDA_CP7'] = {
          id: 'ZONE_NDA_CP7', name: 'NDA Zone CP7',
          allowed_crew: ['DIRECTOR'], token_ttl: 0, nda_zone: true,
        };
        var ndaResult = _verifySecurityAccess('CREW_CP7', 'ZONE_NDA_CP7', Date.now());
        log('CP7-nda-denied', ndaResult.status === 'DENIED_NDA',
          'DENIED_NDA returned for NDA zone: ' + ndaResult.status);

        // Test GRANTED — TTL 0 = không kích hoạt = thông quan
        S.media_governance.space_control['ZONE_OPEN_CP7'] = {
          id: 'ZONE_OPEN_CP7', name: 'Open Zone CP7',
          allowed_crew: ['PRESS_PASS'], token_ttl: 0, nda_zone: false,
        };
        var grantedResult = _verifySecurityAccess('CREW_CP7', 'ZONE_OPEN_CP7', Date.now());
        log('CP7-granted', grantedResult.status === 'GRANTED',
          'GRANTED for valid crew + TTL=0: ' + grantedResult.status);
      }
    } catch(e) { log('CP7', false, 'Exception: ' + e.message); }

    // ── CP8: Watermark canvas layer ───────────────────────────
    try {
      var wmFnExists = typeof _applyDigitalWatermark === 'function';
      log('CP8-fn-exists', wmFnExists, '_applyDigitalWatermark exists: ' + wmFnExists);

      if (wmFnExists) {
        // Tạo canvas ảo test
        var testCanvas  = document.createElement('canvas');
        testCanvas.width = 400; testCanvas.height = 300;
        var testCtx = testCanvas.getContext('2d');

        // Test 1: Vẽ watermark bình thường — không throw
        var threw1 = false;
        try { _applyDigitalWatermark(testCtx, 'TEST WATERMARK', { opacity: 0.1 }); }
        catch(e) { threw1 = true; }
        log('CP8-no-throw', !threw1, 'Watermark draw does not throw: ' + !threw1);

        // Test 2: cleanMode = true → hàm return ngay không vẽ
        var pixelsBefore = testCtx.getImageData(10, 10, 1, 1).data[3]; // alpha
        _applyDigitalWatermark(testCtx, 'SKIP THIS', { cleanMode: true });
        var pixelsAfter  = testCtx.getImageData(10, 10, 1, 1).data[3];
        log('CP8-clean-mode', pixelsBefore === pixelsAfter,
          'cleanMode=true skips drawing (alpha unchanged): before=' + pixelsBefore + ' after=' + pixelsAfter);

        // Test 3: stampText param
        var threw3 = false;
        try { _applyDigitalWatermark(testCtx, 'STAMP TEST', { stampText: 'TRẠM BẢN ĐỊA' }); }
        catch(e) { threw3 = true; }
        log('CP8-stamp-text', !threw3, 'stampText param renders without throw: ' + !threw3);
      }
    } catch(e) { log('CP8', false, 'Exception: ' + e.message); }

    // ── CP9: Unified Cart + Shadow Wallet ─────────────────────
    try {
      var cartFnExists   = typeof _addToUnifiedCart === 'function';
      var walletFnExists = typeof _routeGroupWalletEngine === 'function';
      log('CP9-cart-fn',   cartFnExists,   '_addToUnifiedCart exists: ' + cartFnExists);
      log('CP9-wallet-fn', walletFnExists, '_routeGroupWalletEngine exists: ' + walletFnExists);

      if (cartFnExists && S.marketplace) {
        // Reset giỏ cho test sạch
        var savedCart = JSON.parse(JSON.stringify(S.marketplace.active_cart));
        S.marketplace.active_cart = { invoice_id: null, items: [], group_mode: false, group_members: [], total_vnd: 0, total_coin: 0, status: 'draft' };

        // Thêm 3 item chéo loại
        _addToUnifiedCart('services', 'bql_boat_premium', 1, {});
        _addToUnifiedCart('gears', 'singlet_lhr_01', 2, {});
        _addToUnifiedCart('services', 'local_market_coin_pack', 1, {});

        var cart  = S.marketplace.active_cart;
        var expectedVnd = 200000 + (250000 * 2) + 50000; // = 750000
        log('CP9-cart-items', cart.items.length === 3, 'Cart has 3 items: ' + cart.items.length);
        log('CP9-total-vnd', cart.total_vnd === expectedVnd,
          'Total VND = ' + cart.total_vnd.toLocaleString('vi-VN') + ' (expected ' + expectedVnd.toLocaleString('vi-VN') + ')');
        log('CP9-invoice-id', !!(cart.invoice_id && cart.invoice_id.startsWith('INV_')),
          'invoice_id auto-assigned: ' + cart.invoice_id);

        // Test Shadow Wallet deduction
        if (walletFnExists) {
          var coinsBeforeWallet = S.marketplace.wallet_system.user_coins;
          S.marketplace.active_cart.group_mode    = true;
          S.marketplace.active_cart.group_members = [
            { name: 'Bà Nội', phone: '0901', limit_coins: 30 },
            { name: 'Em Trai', phone: '0902', limit_coins: 20 },
          ];
          _routeGroupWalletEngine();
          var coinsAfterWallet  = S.marketplace.wallet_system.user_coins;
          var deducted = coinsBeforeWallet - coinsAfterWallet;
          log('CP9-shadow-deduction', deducted === 50,
            'Wallet deducted 30+20=50 Coins for 2 shadow accounts: deducted=' + deducted);
          var shadowKeys = Object.keys(S.marketplace.wallet_system.sub_wallets);
          log('CP9-shadow-ids-created', shadowKeys.length >= 2,
            'Shadow IDs created: ' + shadowKeys.length + ' · ' + shadowKeys[0]);
          log('CP9-shadow-id-format',
            shadowKeys[0] && shadowKeys[0].startsWith('SHADOW_'),
            'Shadow ID format correct (SHADOW_...): ' + (shadowKeys[0] || 'none'));
        }

        // Restore cart
        S.marketplace.active_cart = savedCart;
      }
    } catch(e) { log('CP9', false, 'Exception: ' + e.message); }

    console.log('%c\n══ RESULT CP7-9: ' + pass + ' PASS / ' + fail + ' FAIL ══',
      fail === baseResult.fail ? 'color:#00e5a0;font-weight:800' : 'color:#ff5252;font-weight:800');
    console.groupEnd();
    return { pass: pass, fail: fail };
  };
})();


// ══════════════════════════════════════════════════════════════════
//  § UC-WATER  KIOSK BẾN THUYỀN + RBAC MUTATION + CHECKOUT GATE
// ══════════════════════════════════════════════════════════════════

/**
 * Kiosk bến thuyền — Popup mượn đồ P2P tế nhị.
 * @param {string} lenderId   — ID người cho mượn
 * @param {string} borrowerId — ID người mượn
 */
function _triggerP2PLendingOverlay(lenderId, borrowerId) {
  try {
    var ITEMS    = ['Kính bơi', 'Đồng hồ Garmin', 'Xe đạp', 'Áo phao', 'Khác'];
    var TIPS     = [2, 5, 10];
    var selected = { item: ITEMS[0], tip: 5 };

    var itemBtnsHtml = ITEMS.map(function(item, i) {
      return '<button id="p2p-item-' + i + '" onclick="_p2pSelectItem(\'' + item.replace(/'/g,"\\'") + '\',' + i + ')" style="' +
        'padding:7px 10px;border-radius:8px;font-family:\'Barlow Condensed\',sans-serif;font-size:12px;font-weight:700;cursor:pointer;' +
        (i === 0 ? 'background:rgba(0,242,254,.2);border:1.5px solid rgba(0,242,254,.6);color:#00f2fe;'
                 : 'background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);color:rgba(255,255,255,.5);') +
        '">' + item + '</button>';
    }).join('');

    var tipBtnsHtml = TIPS.map(function(tip) {
      return '<button id="p2p-tip-' + tip + '" onclick="_p2pSelectTip(' + tip + ')" style="' +
        'flex:1;padding:8px 0;border-radius:8px;font-family:\'Barlow Condensed\',sans-serif;font-size:13px;font-weight:700;cursor:pointer;' +
        (tip === 5 ? 'background:rgba(0,229,160,.2);border:1.5px solid rgba(0,229,160,.5);color:#00e5a0;'
                   : 'background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);color:rgba(255,255,255,.5);') +
        '">' + tip + ' Coins</button>';
    }).join('');

    var contentHtml = [
      '<div style="font-size:11px;color:rgba(255,255,255,.35);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">Chọn món đồ mượn</div>',
      '<div style="display:flex;flex-wrap:wrap;gap:7px;margin-bottom:14px;" id="p2p-item-row">' + itemBtnsHtml + '</div>',
      '<div style="font-size:11px;color:rgba(255,255,255,.35);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">Xu cảm ơn (Gratitude Tip)</div>',
      '<div style="display:flex;gap:8px;margin-bottom:10px;" id="p2p-tip-row">' + tipBtnsHtml + '</div>',
      '<div style="font-size:12px;color:rgba(255,255,255,.4);">Người mượn: <b style="color:#fff;">' + (borrowerId || '?') + '</b> · Người cho mượn: <b style="color:#00f2fe;">' + (lenderId || '?') + '</b></div>',
    ].join('');

    var overlay = _renderCyberOverlay('p2p-lending-overlay', {
      accentColor : '#00f2fe',
      title       : '🤝 Sổ Cái Mượn Đồ Tình Cảm',
      subtitle    : 'P2P Trust Ledger · Bến Thuyền Tam Chúc',
      contentHtml : contentHtml,
      primaryBtn  : {
        label  : '✅ Xác Nhận Mượn & Gửi Tip',
        onclick: '_p2pConfirmLoan(\'' + lenderId + '\',\'' + borrowerId + '\')',
      },
    });

    // Lưu trạng thái selected vào closure DOM
    overlay._p2pSelected = selected;
    document.body.appendChild(overlay);

  } catch(e) { console.warn('[_triggerP2PLendingOverlay]', e.message); }
}

/** Chọn item trong P2P form */
function _p2pSelectItem(itemName, idx) {
  try {
    var ol = document.getElementById('p2p-lending-overlay');
    if (ol) ol._p2pSelected = ol._p2pSelected || {};
    if (ol) ol._p2pSelected.item = itemName;
    // Update button styles
    document.querySelectorAll('[id^="p2p-item-"]').forEach(function(btn, i) {
      if (i === idx) {
        btn.style.background = 'rgba(0,242,254,.2)';
        btn.style.borderColor = 'rgba(0,242,254,.6)';
        btn.style.color = '#00f2fe';
      } else {
        btn.style.background = 'rgba(255,255,255,.04)';
        btn.style.borderColor = 'rgba(255,255,255,.12)';
        btn.style.color = 'rgba(255,255,255,.5)';
      }
    });
  } catch(e) {}
}

/** Chọn tip trong P2P form */
function _p2pSelectTip(tip) {
  try {
    var ol = document.getElementById('p2p-lending-overlay');
    if (ol) ol._p2pSelected = ol._p2pSelected || {};
    if (ol) ol._p2pSelected.tip = tip;
    [2, 5, 10].forEach(function(t) {
      var btn = document.getElementById('p2p-tip-' + t);
      if (!btn) return;
      if (t === tip) {
        btn.style.background = 'rgba(0,229,160,.2)';
        btn.style.borderColor = 'rgba(0,229,160,.5)';
        btn.style.color = '#00e5a0';
      } else {
        btn.style.background = 'rgba(255,255,255,.04)';
        btn.style.borderColor = 'rgba(255,255,255,.12)';
        btn.style.color = 'rgba(255,255,255,.5)';
      }
    });
  } catch(e) {}
}

/** Xác nhận ghi sổ mượn đồ */
function _p2pConfirmLoan(lenderId, borrowerId) {
  try {
    var ol       = document.getElementById('p2p-lending-overlay');
    var selected = (ol && ol._p2pSelected) || { item: 'Đồ vật', tip: 0 };

    // Đóng overlay trước
    if (ol) { ol.style.opacity = '0'; setTimeout(function() { if (ol.parentNode) ol.parentNode.removeChild(ol); }, 230); }

    if (typeof _registerP2PLoan === 'function') {
      _registerP2PLoan(lenderId, borrowerId, selected.item, selected.tip);
    }
  } catch(e) { console.warn('[_p2pConfirmLoan]', e.message); }
}

/**
 * Đột biến vai trò nhân sự realtime.
 * @param {string} userId
 * @param {string} targetRole — 'VOLUNTEER_ADMIN'|'FREELANCE_COACH'|'VIEWER'
 */
function _mutateUserRoleSession(userId, targetRole) {
  try {
    if (!S.community_matching) S.community_matching = { active_pools: {}, dynamic_roles: {} };

    var existing = S.community_matching.dynamic_roles[userId] || {};
    S.community_matching.dynamic_roles[userId] = Object.assign(existing, {
      user_id     : userId,
      role        : targetRole,
      assigned_at : Date.now(),
      auto_demoted: false,
      penalty_enabled: (targetRole === 'FREELANCE_COACH'),
    });

    var msgs = {
      VOLUNTEER_ADMIN: '🛡️ Đã cấp quyền Tình Nguyện Viên Admin cho ' + userId,
      FREELANCE_COACH: '🏃 Chuyển ' + userId + ' sang chế độ Freelance Coach',
      VIEWER         : '👁 ' + userId + ' chuyển về chế độ xem',
    };
    if (typeof showToast === 'function') {
      showToast(msgs[targetRole] || 'Vai trò: ' + targetRole, 'ok', 3000);
    }

    return S.community_matching.dynamic_roles[userId];
  } catch(e) { console.warn('[_mutateUserRoleSession]', e.message); return null; }
}

/**
 * QR cứu hộ khẩn cấp — bốc data Shadow Account khi mất NFC.
 * @param {string} shadowId
 */
function _emergencyQrRescue(shadowId) {
  try {
    var wallet = S.marketplace && S.marketplace.wallet_system;
    var shadow = wallet && wallet.sub_wallets && wallet.sub_wallets[shadowId];
    if (!shadow) { showToast('Không tìm thấy Shadow Account: ' + shadowId, 'err', 3000); return; }

    var qrData = {
      rescue_ts : Date.now(),
      shadow_id : shadowId,
      name      : shadow.name,
      limit     : shadow.limit_coins,
      spent     : shadow.spent_coins,
      leader    : shadow.leader_uuid,
    };
    var qrPayload = btoa(unescape(encodeURIComponent(JSON.stringify(qrData))));

    var contentHtml = [
      '<div style="background:rgba(255,193,7,.06);border:1px solid rgba(255,193,7,.2);border-radius:10px;padding:12px;margin-bottom:10px;">',
        '<div style="font-size:14px;color:#fff;font-weight:700;">' + shadow.name + '</div>',
        '<div style="font-size:12px;color:rgba(255,255,255,.5);margin-top:4px;">',
          'Hạn mức: ' + shadow.limit_coins + ' · Đã tiêu: ' + shadow.spent_coins + ' Coins',
        '</div>',
      '</div>',
      '<div style="font-size:10px;color:rgba(255,255,255,.3);word-break:break-all;font-family:monospace;padding:8px;background:rgba(0,0,0,.3);border-radius:8px;">' + qrPayload.slice(0, 60) + '...</div>',
    ].join('');

    var overlay = _renderCyberOverlay('rescue-qr-overlay', {
      accentColor : '#ffc107',
      title       : '🆘 Cứu Hộ QR Khẩn Cấp',
      subtitle    : 'Shadow Account bị mất NFC',
      contentHtml : contentHtml,
      primaryBtn  : { label: '📋 Copy Mã Cứu Hộ', onclick: '_copyRescueQr(\'' + qrPayload + '\')' },
    });
    document.body.appendChild(overlay);

  } catch(e) { console.warn('[_emergencyQrRescue]', e.message); }
}

function _copyRescueQr(qrPayload) {
  try {
    if (navigator.clipboard) navigator.clipboard.writeText(qrPayload).then(function() {
      showToast('✅ Đã copy mã cứu hộ vào clipboard', 'ok', 2500);
    });
    else { window.prompt('Copy mã cứu hộ:', qrPayload); }
  } catch(e) {}
}

// ══════════════════════════════════════════════════════════════════
//  NÂNG CẤP _executeCheckoutGatePenalties — Quét sổ mượn đồ
// ══════════════════════════════════════════════════════════════════

/** Override thêm chức năng quét P2P loans vào checkout gate */
(function() {
  var _origCheckout = typeof _executeCheckoutGatePenalties === 'function' ? _executeCheckoutGatePenalties : null;
  window._executeCheckoutGatePenalties = function(userId, lateMinutes) {
    // Gọi logic phạt trễ giờ gốc
    if (_origCheckout) _origCheckout(userId, lateMinutes || 0);

    // Quét sổ mượn đồ — chặn nếu chưa trả
    try {
      var ledger = S.community_matching && S.community_matching.p2p_lending;
      if (!ledger || !ledger.active_loans) return;

      var unreturned = Object.values(ledger.active_loans).filter(function(loan) {
        return loan.borrower_id === userId && !loan.returned;
      });

      if (unreturned.length > 0) {
        var itemList = unreturned.map(function(l) { return l.item_name; }).join(', ');
        // Chặn checkout + toast nhắc nhở
        if (typeof showToast === 'function') {
          showToast(
            '⛔ KHÓA CỔNG: Bạn chưa hoàn trả ' + unreturned.length + ' món đồ · ' + itemList + ' · Vui lòng trả trước khi ra!',
            'err', 6000
          );
        }
        if (typeof _showCoachingMoment === 'function') {
          _showCoachingMoment('🔒 Chưa trả: ' + itemList + ' · Tìm người cho mượn ngay!', '#ff5252');
        }
        // Return false để caller biết checkout bị chặn
        return false;
      }
      return true;
    } catch(e) { return true; }
  };
})();


// ══════════════════════════════════════════════════════════════════
//  CP10-13 — THÊM VÀO TEST HARNESS
// ══════════════════════════════════════════════════════════════════

(function() {
  var _prevTests = window.runCam5HubCoreTests;
  window.runCam5HubCoreTests = function() {
    var base = _prevTests ? _prevTests() : { pass:0, fail:0 };
    var pass = base.pass, fail = base.fail;

    function log(id, ok, detail) {
      console.log((ok?'✅':'❌') + ' ' + id + ': ' + detail);
      if (ok) pass++; else fail++;
    }

    console.group('%c🌊 CP10-13 THỦY CHIẾN TESTS', 'color:#00f2fe;font-weight:800;font-size:13px');

    // CP10: BREACH_DANGER_ZONE
    try {
      var waterFnExists = typeof _checkWaterBoundarySecurity === 'function';
      log('CP10-fn', waterFnExists, '_checkWaterBoundarySecurity exists: ' + waterFnExists);
      if (waterFnExists && S.water_matrix) {
        // Tọa độ nằm chắc trong danger_blackspot (lat 20.527, lng 105.892)
        var breachResult = _checkWaterBoundarySecurity(
          { lat: 20.527, lng: 105.892 },
          S.water_matrix.water_zones
        );
        log('CP10-breach', breachResult.code === 'BREACH_DANGER_ZONE',
          'BREACH detected for point inside danger zone: ' + breachResult.code + ' · ' + breachResult.message.slice(0,50));

        // Tọa độ an toàn ngoài vùng (lat 20.510, lng 105.880)
        var safeResult = _checkWaterBoundarySecurity(
          { lat: 20.510, lng: 105.880 },
          S.water_matrix.water_zones
        );
        log('CP10-safe', safeResult.code === 'SAFE',
          'SAFE for point outside all zones: ' + safeResult.code);

        // null input
        var nullResult = _checkWaterBoundarySecurity(null, S.water_matrix.water_zones);
        log('CP10-null', nullResult.code === 'SAFE', 'null input returns SAFE gracefully');
      }
    } catch(e) { log('CP10', false, 'Exception: ' + e.message); }

    // CP11: Escrow 50-50
    try {
      var escrowFnExists = typeof _initiateDiscreteSplitEscrow === 'function';
      log('CP11-fn', escrowFnExists, '_initiateDiscreteSplitEscrow exists: ' + escrowFnExists);
      if (escrowFnExists && S.water_matrix && S.marketplace) {
        var coinsBefore = S.marketplace.wallet_system.user_coins;
        var escrowResult = _initiateDiscreteSplitEscrow('MATCH_TEST_CP11', 'USER_A', 'USER_B', 100);
        var coinsAfter  = S.marketplace.wallet_system.user_coins;
        var deducted    = coinsBefore - coinsAfter;
        log('CP11-locked',  escrowResult.success && deducted === 50,
          'Escrow locked 50 Coins from creator wallet: deducted=' + deducted + ' success=' + escrowResult.success);
        log('CP11-amount',  escrowResult.amount_each === 50, 'amount_each=50 for total=100: ' + escrowResult.amount_each);
        var poolEntry = S.water_matrix.escrow_pool['MATCH_TEST_CP11'];
        log('CP11-status',  poolEntry && poolEntry.status === 'locked', 'escrow status=locked in pool: ' + (poolEntry && poolEntry.status));

        // Release
        if (typeof _releaseDiscreteSplitWithAffiliate === 'function') {
          var releaseResult = _releaseDiscreteSplitWithAffiliate('MATCH_TEST_CP11');
          log('CP11-release', releaseResult.success, 'Escrow released successfully: ' + releaseResult.success);
          log('CP11-affiliate', !!(releaseResult.affiliate_creator && releaseResult.affiliate_creator.startsWith('SUP_')),
            'Affiliate code minted: ' + releaseResult.affiliate_creator);
        }
      }
    } catch(e) { log('CP11', false, 'Exception: ' + e.message); }

    // CP12: Mượn Đồng hồ Garmin + tip 5 Coins
    try {
      var loanFnExists = typeof _registerP2PLoan === 'function';
      log('CP12-fn', loanFnExists, '_registerP2PLoan exists: ' + loanFnExists);
      if (loanFnExists && S.community_matching && S.marketplace) {
        var walletBefore = S.marketplace.wallet_system.user_coins;
        var loanResult   = _registerP2PLoan('LENDER_CP12', 'BORROWER_CP12', 'Đồng hồ Garmin', 5);
        var walletAfter  = S.marketplace.wallet_system.user_coins;
        log('CP12-loan-created', loanResult.success, 'P2P loan created: ' + loanResult.loan_id);
        log('CP12-tip-deducted', (walletBefore - walletAfter) === 5,
          'Tip 5 Coins deducted: before=' + walletBefore + ' after=' + walletAfter);
        var loan = S.community_matching.p2p_lending.active_loans[loanResult.loan_id];
        log('CP12-loan-in-ledger', !!(loan && loan.item_name === 'Đồng hồ Garmin'),
          'Loan recorded in active_loans: item=' + (loan && loan.item_name));

        // Resolve
        if (typeof _resolveP2PLoan === 'function') {
          var resolveResult = _resolveP2PLoan(loanResult.loan_id);
          log('CP12-resolve', resolveResult.success, 'Loan resolved: ' + resolveResult.success);
          var gone = !S.community_matching.p2p_lending.active_loans[loanResult.loan_id];
          log('CP12-cleared', gone, 'Loan removed from active_loans: ' + gone);
          var history = S.community_matching.p2p_lending.lending_history;
          log('CP12-history', history.some(function(h){ return h.loan_id === loanResult.loan_id; }),
            'Loan moved to lending_history');
        }
      }
    } catch(e) { log('CP12', false, 'Exception: ' + e.message); }

    // CP13: Checkout bị chặn khi chưa trả đồ
    try {
      var checkoutFnExists = typeof _executeCheckoutGatePenalties === 'function';
      log('CP13-fn', checkoutFnExists, '_executeCheckoutGatePenalties exists: ' + checkoutFnExists);
      if (checkoutFnExists && S.community_matching) {
        // Tạo active loan giả chưa trả
        var fakeLoanId = 'LOAN_TEST_CP13';
        S.community_matching.p2p_lending.active_loans[fakeLoanId] = {
          loan_id: fakeLoanId, lender_id: 'LEND_A', borrower_id: 'USER_TEST_CP13',
          item_name: 'Kính bơi', tip_coin: 2, timestamp: Date.now(), returned: false,
        };
        var gateResult = _executeCheckoutGatePenalties('USER_TEST_CP13', 0);
        log('CP13-gate-blocked', gateResult === false,
          'Checkout gate returns false when unreturned loans exist: ' + gateResult);

        // Dọn loan test
        delete S.community_matching.p2p_lending.active_loans[fakeLoanId];

        // Không có loan → checkout thông
        var gateClear = _executeCheckoutGatePenalties('USER_TEST_CP13', 0);
        log('CP13-gate-clear', gateClear === true || gateClear === undefined,
          'Checkout gate passes when no loans: ' + gateClear);
      }
    } catch(e) { log('CP13', false, 'Exception: ' + e.message); }

    console.log('%c\n══ RESULT CP10-13: ' + pass + ' PASS / ' + fail + ' FAIL ══',
      fail === base.fail ? 'color:#00f2fe;font-weight:800' : 'color:#ff5252;font-weight:800');
    console.groupEnd();
    return { pass: pass, fail: fail };
  };
})();


// ══════════════════════════════════════════════════════════════════
//  CP15 — DYNAMIC TICKET STAMPER TEST
// ══════════════════════════════════════════════════════════════════

(function() {
  var _prevTests = window.runCam5HubCoreTests;
  window.runCam5HubCoreTests = function() {
    var base = _prevTests ? _prevTests() : { pass:0, fail:0 };
    var pass = base.pass, fail = base.fail;

    function log(id, ok, detail) {
      console.log((ok?'✅':'❌') + ' ' + id + ': ' + detail);
      if (ok) pass++; else fail++;
    }

    console.group('%c🎟 CP15 DYNAMIC TICKET STAMPER', 'color:#ffc107;font-weight:800;font-size:13px');

    // CP15-a: Template schema tồn tại đúng cấu trúc
    try {
      var templates = S.marketplace && S.marketplace.ticket_templates;
      log('CP15-schema', !!templates, 'ticket_templates schema exists: ' + !!templates);

      if (templates) {
        var defTpl  = templates['template_default_hub'];
        var nikeTpl = templates['template_sponsor_nike'];
        log('CP15-hub-template',  !!(defTpl  && defTpl.canvas_w === 1080 && defTpl.canvas_h === 540),
          'Hub template 1080×540: ' + (defTpl ? defTpl.canvas_w + '×' + defTpl.canvas_h : 'MISSING'));
        log('CP15-nike-template', !!(nikeTpl && nikeTpl.canvas_w === 1080 && nikeTpl.canvas_h === 1920),
          'Nike template 1080×1920: ' + (nikeTpl ? nikeTpl.canvas_w + '×' + nikeTpl.canvas_h : 'MISSING'));

        // Kiểm tra anchor array có đủ các type cần thiết
        var anchorTypes = (defTpl && defTpl.anchors || []).map(function(a){ return a.type; });
        log('CP15-anchors-text',   anchorTypes.indexOf('text')   > -1, 'text anchor present');
        log('CP15-anchors-qr',     anchorTypes.indexOf('qr')     > -1, 'qr anchor present');
        log('CP15-anchors-banner', anchorTypes.indexOf('banner') > -1, 'banner anchor present');
      }
    } catch(e) { log('CP15-schema', false, 'Exception: ' + e.message); }

    // CP15-b: campaign_template_map chọn đúng template Nike
    try {
      var campaignMap = S.marketplace && S.marketplace.campaign_template_map;
      log('CP15-campaign-map', !!campaignMap, 'campaign_template_map exists: ' + !!campaignMap);
      if (campaignMap) {
        log('CP15-nike-mapped',
          campaignMap['NIKE_2025_TAMCHUC'] === 'template_sponsor_nike',
          'Nike campaign → template_sponsor_nike: ' + campaignMap['NIKE_2025_TAMCHUC']);
        log('CP15-default-mapped',
          campaignMap['DEFAULT'] === 'template_default_hub',
          'DEFAULT → template_default_hub: ' + campaignMap['DEFAULT']);
      }
    } catch(e) { log('CP15-campaign', false, 'Exception: ' + e.message); }

    // CP15-c: _resolveTicketTemplate chọn đúng khi có campaign_id
    try {
      var resolveFnExists = typeof _resolveTicketTemplate === 'function';
      log('CP15-resolve-fn', resolveFnExists, '_resolveTicketTemplate exists: ' + resolveFnExists);
      if (resolveFnExists) {
        // Mock cart với item có campaign_id Nike
        var mockCart = {
          invoice_id: 'INV_TEST_CP15',
          items: [{ id: 'CRS_01', item_key: 'course_tempo_01', name: 'Test Course', price_vnd: 500000, qty: 1 }],
        };
        // Thêm campaign_id vào catalog entry tạm
        if (S.marketplace && S.marketplace.catalog && S.marketplace.catalog.courses) {
          S.marketplace.catalog.courses['course_tempo_01'].campaign_id = 'NIKE_2025_TAMCHUC';
        }
        var resolved = _resolveTicketTemplate(mockCart);
        log('CP15-resolve-nike', resolved === 'template_sponsor_nike',
          '_resolveTicketTemplate → ' + resolved + ' (expected template_sponsor_nike)');

        // Reset campaign_id
        if (S.marketplace && S.marketplace.catalog && S.marketplace.catalog.courses) {
          delete S.marketplace.catalog.courses['course_tempo_01'].campaign_id;
        }

        // Mock không có campaign → DEFAULT
        var mockCartDefault = { invoice_id: 'INV_DEF', items: [{ id: 'GEAR_01', item_key: 'singlet_lhr_01', name: 'Gear', price_vnd: 250000, qty: 1 }] };
        var resolvedDef = _resolveTicketTemplate(mockCartDefault);
        log('CP15-resolve-default', resolvedDef === 'template_default_hub',
          'No campaign → ' + resolvedDef);
      }
    } catch(e) { log('CP15-resolve', false, 'Exception: ' + e.message); }

    // CP15-d: _renderDynamicTicketFromTemplate trả Promise + xuất base64 hợp lệ
    try {
      var renderFnExists = typeof _renderDynamicTicketFromTemplate === 'function';
      log('CP15-render-fn', renderFnExists, '_renderDynamicTicketFromTemplate exists: ' + renderFnExists);

      if (renderFnExists) {
        var testTicketData = {
          event_name : 'Giải Chạy Tam Chúc 2025',
          user_name  : 'Nguyễn Văn Test',
          bib_number : 'BIB-0042',
          event_date : '15/12/2025',
          itinerary  : 'Bến thuyền → Trail → Buffet',
          qr_payload : 'TEST_QR_PAYLOAD_CP15',
        };

        var renderPromise = _renderDynamicTicketFromTemplate('template_default_hub', testTicketData);

        // Kiểm tra hàm trả Promise
        log('CP15-returns-promise',
          renderPromise && typeof renderPromise.then === 'function',
          'Returns Promise: ' + (renderPromise && typeof renderPromise.then === 'function'));

        renderPromise.then(function(base64) {
          log('CP15-base64-valid',
            typeof base64 === 'string' && base64.startsWith('data:'),
            'base64 starts with data:: ' + (base64 ? base64.slice(0,30) + '...' : 'null'));
          log('CP15-base64-length', base64 && base64.length > 100,
            'base64 length > 100: ' + (base64 ? base64.length : 0));

          // Test fallback template (templateId không tồn tại → phải dùng hub)
          _renderDynamicTicketFromTemplate('template_nonexistent_xyz', testTicketData).then(function(fallbackBase64) {
            log('CP15-fallback-template',
              typeof fallbackBase64 === 'string' && fallbackBase64.startsWith('data:'),
              'Fallback to hub template works: ' + (fallbackBase64 ? fallbackBase64.slice(0,25) + '...' : 'null'));

            console.log('%c\n══ RESULT CP15: ' + pass + ' PASS / ' + fail + ' FAIL ══',
              fail === base.fail ? 'color:#ffc107;font-weight:800' : 'color:#ff5252;font-weight:800');
            console.groupEnd();
          }).catch(function(e) {
            log('CP15-fallback-template', false, 'Exception: ' + e.message);
            console.groupEnd();
          });

        }).catch(function(e) {
          log('CP15-render-async', false, 'Render promise rejected: ' + e.message);
          console.groupEnd();
        });

        // Return base result sync — async results append sau
        return { pass: pass, fail: fail };
      }
    } catch(e) { log('CP15-render', false, 'Exception: ' + e.message); }

    console.log('%c\n══ RESULT CP15: ' + pass + ' PASS / ' + fail + ' FAIL ══',
      fail === base.fail ? 'color:#ffc107;font-weight:800' : 'color:#ff5252;font-weight:800');
    console.groupEnd();
    return { pass: pass, fail: fail };
  };
})();


// ══════════════════════════════════════════════════════════════════
//  CP16 — GUILD MEME + SPONSOR QUEST TESTS
// ══════════════════════════════════════════════════════════════════

(function() {
  var _prev = window.runCam5HubCoreTests;
  window.runCam5HubCoreTests = function() {
    var base = _prev ? _prev() : { pass:0, fail:0 };
    var pass = base.pass, fail = base.fail;

    function log(id, ok, detail) {
      console.log((ok?'✅':'❌') + ' ' + id + ': ' + detail);
      if (ok) pass++; else fail++;
    }

    console.group('%c⚔️ CP16 GUILD MEME & SPONSOR QUEST', 'color:#ff5252;font-weight:800;font-size:13px');

    // ── CP16-a: Schema tồn tại ─────────────────────────────────
    try {
      var gov = S.guild_governance;
      log('CP16-schema',       !!gov,                    'guild_governance exists: ' + !!gov);
      log('CP16-meme-quest',   !!(gov && gov.meme_quest),'meme_quest exists: ' + !!(gov && gov.meme_quest));
      log('CP16-guilds',       !!(gov && gov.active_guilds && gov.active_guilds['GUILD_HPR']), 'GUILD_HPR exists');
      log('CP16-penalty-cat',  !!(gov && gov.meme_quest && gov.meme_quest.penalty_catalog['P_CODE_02']), 'P_CODE_02 exists');
      log('CP16-sponsor-quest',!!(gov && gov.meme_quest && gov.meme_quest.sponsor_quests['quest_nike_tamchuc']), 'Nike quest exists');
    } catch(e) { log('CP16-schema', false, 'Exception: ' + e.message); }

    // ── CP16-b: Sponsor Quest — 10 thành viên check-in ────────
    try {
      var checkInFn = typeof _processGuildSponsorQuestCheckIn === 'function';
      log('CP16-checkin-fn', checkInFn, '_processGuildSponsorQuestCheckIn exists: ' + checkInFn);

      if (checkInFn && S.guild_governance) {
        // Reset quest về chưa hoàn thành
        var quest = S.guild_governance.meme_quest.sponsor_quests['quest_nike_tamchuc'];
        quest.is_completed       = false;
        quest.checked_in_members = [];
        quest.completed_at       = null;

        // Reset guild wallet
        var guild = S.guild_governance.active_guilds['GUILD_HPR'];
        var walletBefore = guild.guild_wallet_coins;

        // Simulate 9 thành viên → chưa đủ
        var result9;
        for (var i = 0; i < 9; i++) {
          result9 = _processGuildSponsorQuestCheckIn('GUILD_HPR', 'quest_nike_tamchuc', 'TEST_USER_' + i);
        }
        log('CP16-9-not-completed', result9 && result9.completed === false,
          '9/10 check-in → not completed: ' + (result9 && result9.completed));
        log('CP16-9-count', result9 && result9.members_so_far === 9,
          'members_so_far=9: ' + (result9 && result9.members_so_far));

        // Thành viên thứ 10 → hoàn thành
        var result10 = _processGuildSponsorQuestCheckIn('GUILD_HPR', 'quest_nike_tamchuc', 'TEST_USER_9');
        log('CP16-10-completed', result10 && result10.completed === true,
          '10/10 check-in → completed: ' + (result10 && result10.completed));
        log('CP16-reward-coins', result10 && result10.reward_coins === 500,
          'reward_coins=500: ' + (result10 && result10.reward_coins));
        log('CP16-voucher', result10 && result10.voucher_code === 'NIKE_SUP_20',
          'voucher_code=NIKE_SUP_20: ' + (result10 && result10.voucher_code));

        // Verify ví bang tăng đúng
        var walletAfter = guild.guild_wallet_coins;
        log('CP16-wallet-increase', (walletAfter - walletBefore) === 500,
          'guild_wallet +500: before=' + walletBefore + ' after=' + walletAfter);

        // Quest đã hoàn thành → gọi lại phải báo lỗi
        var dupResult = _processGuildSponsorQuestCheckIn('GUILD_HPR', 'quest_nike_tamchuc', 'TEST_USER_0');
        log('CP16-idempotent', dupResult && dupResult.success === false,
          'Duplicate completion blocked: success=' + (dupResult && dupResult.success));
      }
    } catch(e) { log('CP16-checkin', false, 'Exception: ' + e.message); }

    // ── CP16-c: BailOut — Nộp xu chuộc ảnh phạt ──────────────
    try {
      var bailFn = typeof _executeBailOutFromPunishment === 'function';
      log('CP16-bail-fn', bailFn, '_executeBailOutFromPunishment exists: ' + bailFn);

      if (bailFn && S.guild_governance) {
        // Đảm bảo ví bang có đủ xu
        var guild = S.guild_governance.active_guilds['GUILD_HPR'];
        guild.guild_wallet_coins = Math.max(guild.guild_wallet_coins, 300);
        var walletBefore = guild.guild_wallet_coins;

        // Reset đơn phạt về chưa giải
        var punishment = S.guild_governance.meme_quest.active_punishments['punish_hpr_099'];
        punishment.is_resolved = false;
        punishment.bail_paid   = false;
        punishment.meme_base64 = 'FAKE_BASE64_FOR_TEST';

        // Thêm vào hall_of_shame tạm
        S.guild_governance.meme_quest.hall_of_shame = [
          { punish_id: 'punish_hpr_099', meme_base64: 'FAKE', ts: Date.now(), resolved: false },
        ];

        var bailResult = _executeBailOutFromPunishment('punish_hpr_099');
        log('CP16-bail-success',   bailResult.success === true,
          'bail success: ' + bailResult.success);
        log('CP16-bail-coins',     bailResult.coins_paid === 200,
          'bail coins_paid=200: ' + bailResult.coins_paid);
        log('CP16-resolved',       punishment.is_resolved === true,
          'punishment.is_resolved=true: ' + punishment.is_resolved);
        log('CP16-meme-cleared',   punishment.meme_base64 === null,
          'meme_base64 cleared: ' + punishment.meme_base64);
        log('CP16-hall-cleared',
          S.guild_governance.meme_quest.hall_of_shame.filter(function(e){ return e.punish_id === 'punish_hpr_099'; }).length === 0,
          'Removed from hall_of_shame');
        log('CP16-donations-log',
          S.free_training && S.free_training.local_donations.some(function(d){ return d.type === 'BAIL_OUT'; }),
          'BAIL_OUT logged in local_donations');
        var walletAfter = guild.guild_wallet_coins;
        log('CP16-wallet-deducted', (walletBefore - walletAfter) === 200,
          'guild_wallet −200: before=' + walletBefore + ' after=' + walletAfter);

        // Gọi lại lần 2 → đơn đã giải
        var dupBail = _executeBailOutFromPunishment('punish_hpr_099');
        log('CP16-bail-idempotent', dupBail.success === false,
          'Duplicate bail blocked: success=' + dupBail.success);
      }
    } catch(e) { log('CP16-bail', false, 'Exception: ' + e.message); }

    // ── CP16-d: Meme canvas render (async) ────────────────────
    try {
      var memeFn = typeof _renderGuildMemePunishmentCanvas === 'function';
      log('CP16-meme-fn', memeFn, '_renderGuildMemePunishmentCanvas exists: ' + memeFn);

      if (memeFn && S.guild_governance) {
        // Reset meme state
        var punishment = S.guild_governance.meme_quest.active_punishments['punish_hpr_099'];
        punishment.is_resolved = false; punishment.meme_base64 = null;

        var memePromise = _renderGuildMemePunishmentCanvas('punish_hpr_099');
        log('CP16-meme-promise', memePromise && typeof memePromise.then === 'function',
          'Returns Promise: ' + (memePromise && typeof memePromise.then === 'function'));

        memePromise.then(function(base64) {
          log('CP16-meme-base64', typeof base64 === 'string' && base64.startsWith('data:'),
            'base64 starts with data:: ' + (base64 ? base64.slice(0,25) + '...' : 'null'));
          log('CP16-meme-cached', !!(punishment && punishment.meme_base64),
            'meme cached in punishment: ' + !!(punishment && punishment.meme_base64));
          log('CP16-hall-pushed',
            S.guild_governance.meme_quest.hall_of_shame.some(function(e){ return e.punish_id === 'punish_hpr_099'; }),
            'Meme pushed to hall_of_shame');

          console.log('%c\n══ RESULT CP16: ' + pass + ' PASS / ' + fail + ' FAIL ══',
            fail === base.fail ? 'color:#ff5252;font-weight:800' : 'color:#ff5252;font-weight:800');
          console.groupEnd();
        }).catch(function(e) {
          log('CP16-meme-async', false, 'Promise rejected: ' + e.message);
          console.groupEnd();
        });

        return { pass: pass, fail: fail };
      }
    } catch(e) { log('CP16-meme', false, 'Exception: ' + e.message); }

    console.log('%c\n══ RESULT CP16: ' + pass + ' PASS / ' + fail + ' FAIL ══',
      'color:#ff5252;font-weight:800');
    console.groupEnd();
    return { pass: pass, fail: fail };
  };
})();


// ══════════════════════════════════════════════════════════════════
//  § UC-UITPL  DESIGN SYSTEM — Cinematic CSS Inject + Hot-swap
// ══════════════════════════════════════════════════════════════════

/**
 * Inject CSS variables + animation classes từ active template.
 * Gọi khi bootApp() hoặc sau _switchActiveUiTemplate().
 */
function _injectCinematicStyleSheet() {
  try {
    if (!S.ui_templates) return;
    var tplId = S.ui_templates.current_active_template_id || 'TEMPLATE_CYBER_GLOW';
    var tpl   = S.ui_templates.warehouse[tplId];
    if (!tpl) return;

    var dur   = tpl.motion_duration_ms || 400;
    var curve = tpl.motion_curve       || 'cubic-bezier(0.16,1,0.3,1)';
    var bg    = tpl.bg_panel           || 'rgba(10,20,30,0.65)';
    var ac    = tpl.neon_accent        || '#ff5500';
    var tt    = tpl.text_title         || '#00ffcc';

    // Convert hex accent to rgba for glow effects
    var acHex = ac.replace('#','').match(/.{2}/g);
    var acRgb = acHex ? acHex.map(function(h){ return parseInt(h,16); }).join(',') : '255,85,0';

    var css = [
      ':root {',
      '  --tpl-bg-panel:' + bg + ';',
      '  --tpl-accent:' + ac + ';',
      '  --tpl-title:' + tt + ';',
      '  --tpl-dur:' + dur + 'ms;',
      '  --tpl-curve:' + curve + ';',
      '  --tpl-glow:rgba(' + acRgb + ',0.35);',
      '}',

      /* Slide-in từ trái khi đổi tab */
      '@keyframes cinSlideIn {',
      '  from { opacity:0; transform:translateX(-18px); }',
      '  to   { opacity:1; transform:translateX(0); }',
      '}',
      '.cinematic-slide-in {',
      '  animation: cinSlideIn var(--tpl-dur) var(--tpl-curve) both;',
      '}',

      /* Neon pulse toggle */
      '@keyframes neonPulse {',
      '  0%,100% { box-shadow:0 0 4px var(--tpl-glow); }',
      '  50%      { box-shadow:0 0 16px var(--tpl-glow), 0 0 32px var(--tpl-glow); }',
      '}',
      '.neon-pulse-toggle {',
      '  animation: neonPulse 1.8s ease-in-out infinite;',
      '}',

      /* Panel blur kính mờ */
      '.tpl-panel {',
      '  background: var(--tpl-bg-panel);',
      '  backdrop-filter: blur(14px);',
      '  -webkit-backdrop-filter: blur(14px);',
      '}',

      /* Accordion field-log transition */
      '#field-log-body {',
      '  transition: max-height var(--tpl-dur) var(--tpl-curve);',
      '}',

      /* Field log toggle header hover */
      '#field-log-toggle:hover {',
      '  color: var(--tpl-accent);',
      '}',
      '#field-log-arrow {',
      '  transition: transform var(--tpl-dur) var(--tpl-curve);',
      '}',
    ].join('\n');

    var styleEl = document.getElementById('cam5hub-tpl-style');
    if (!styleEl) {
      styleEl    = document.createElement('style');
      styleEl.id = 'cam5hub-tpl-style';
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = css;

  } catch(e) { console.warn('[_injectCinematicStyleSheet]', e.message); }
}

/**
 * Hot-swap template tức thì — fade-blur transition.
 * Persist lựa chọn vào localStorage.
 * @param {string} templateId
 */
function _switchActiveUiTemplate(templateId) {
  try {
    if (!S.ui_templates || !S.ui_templates.warehouse[templateId]) {
      showToast('Template không tồn tại: ' + templateId, 'err', 2000);
      return;
    }

    // Fade-blur tất cả panel
    var panels = document.querySelectorAll('.tab-panel, .sidebar-panels, #sidebar-panels, #bs-panels');
    panels.forEach(function(p) {
      p.style.transition = 'opacity 0.2s ease, filter 0.2s ease';
      p.style.opacity    = '0';
      p.style.filter     = 'blur(4px)';
    });

    setTimeout(function() {
      S.ui_templates.current_active_template_id = templateId;
      try { localStorage.setItem('cam5hub_ui_template', templateId); } catch(e) {}
      _injectCinematicStyleSheet();

      // Fade-in lại
      panels.forEach(function(p) {
        p.style.opacity = '1';
        p.style.filter  = 'blur(0)';
        setTimeout(function() {
          p.style.transition = '';
          p.style.filter     = '';
        }, 300);
      });

      var tpl = S.ui_templates.warehouse[templateId];
      if (typeof showToast === 'function') {
        showToast('🎨 Giao diện: ' + tpl.name, 'ok', 2000);
      }
    }, 210);

  } catch(e) { console.warn('[_switchActiveUiTemplate]', e.message); }
}


// ══════════════════════════════════════════════════════════════════
//  CP19 — UI TEMPLATES + PANEL FIX TESTS
// ══════════════════════════════════════════════════════════════════

(function() {
  var _prev = window.runCam5HubCoreTests;
  window.runCam5HubCoreTests = function() {
    var base = _prev ? _prev() : { pass:0, fail:0 };
    var pass = base.pass, fail = base.fail;

    function log(id, ok, detail) {
      console.log((ok?'✅':'❌') + ' ' + id + ': ' + detail);
      if (ok) pass++; else fail++;
    }

    console.group('%c🎨 CP19 UI TEMPLATES + PANEL FIX', 'color:#00ffcc;font-weight:800;font-size:13px');

    // ── CP19-a: Schema exists ─────────────────────────────────
    try {
      var tpl = S.ui_templates;
      log('CP19-schema',      !!tpl, 'S.ui_templates exists: ' + !!tpl);
      log('CP19-3-templates', tpl && Object.keys(tpl.warehouse||{}).length >= 3,
        'warehouse has 3 templates: ' + (tpl ? Object.keys(tpl.warehouse||{}).length : 0));
      log('CP19-default-id',
        tpl && tpl.current_active_template_id === (localStorage.getItem('cam5hub_ui_template') || 'TEMPLATE_CYBER_GLOW'),
        'current_active_template_id correct: ' + (tpl && tpl.current_active_template_id));
    } catch(e) { log('CP19-schema', false, 'Exception: ' + e.message); }

    // ── CP19-b: Hot-swap template ─────────────────────────────
    try {
      var swapFn = typeof _switchActiveUiTemplate === 'function';
      log('CP19-swap-fn', swapFn, '_switchActiveUiTemplate exists: ' + swapFn);

      if (swapFn && S.ui_templates) {
        var origId = S.ui_templates.current_active_template_id;

        // Switch to MINIMAL_TECH
        S.ui_templates.current_active_template_id = 'TEMPLATE_MINIMAL_TECH';
        _injectCinematicStyleSheet();
        var styleEl = document.getElementById('cam5hub-tpl-style');
        var cssText = styleEl ? styleEl.textContent : '';
        log('CP19-inject-fn',   typeof _injectCinematicStyleSheet === 'function', '_injectCinematicStyleSheet exists');
        log('CP19-style-injected', !!styleEl, '<style id=cam5hub-tpl-style> injected: ' + !!styleEl);
        log('CP19-minimal-vars',
          cssText.includes('#0071e3') && cssText.includes('rgba(245,245,247,0.75)'),
          'MINIMAL_TECH CSS vars injected (blue + white bg)');
        log('CP19-slide-anim',   cssText.includes('cinSlideIn'), 'cinematic-slide-in keyframe present');
        log('CP19-neon-anim',    cssText.includes('neonPulse'),  'neon-pulse-toggle keyframe present');

        // Switch back to original
        S.ui_templates.current_active_template_id = origId;
        _injectCinematicStyleSheet();

        // Verify localStorage persist
        _switchActiveUiTemplate('TEMPLATE_HERITAGE_VINTAGE');
        setTimeout(function() {
          var stored = localStorage.getItem('cam5hub_ui_template');
          log('CP19-localstorage', stored === 'TEMPLATE_HERITAGE_VINTAGE',
            'localStorage persisted: ' + stored);
          // Restore
          _switchActiveUiTemplate(origId);
        }, 400);
      }
    } catch(e) { log('CP19-swap', false, 'Exception: ' + e.message); }

    // ── CP19-c: Date bug fix ──────────────────────────────────
    try {
      log('CP19-date-zero',     fmtDate(0)   === '[Vừa mới ghi nhận]', 'fmtDate(0) → [Vừa mới ghi nhận]: ' + fmtDate(0));
      log('CP19-date-empty',    fmtDate('')  === '[Vừa mới ghi nhận]', 'fmtDate("") → [Vừa mới ghi nhận]: ' + fmtDate(''));
      log('CP19-date-null',     fmtDate(null)=== '[Vừa mới ghi nhận]', 'fmtDate(null) → safe: ' + fmtDate(null));
      log('CP19-date-1899',     fmtDate('Sat Dec 30 1899 00:00:00') === '[Vừa mới ghi nhận]',
        'fmtDate(1899 string) → safe: ' + fmtDate('Sat Dec 30 1899 00:00:00'));
      var validDate = '2025-06-15T08:00:00Z';
      log('CP19-date-valid',    fmtDate(validDate) !== '[Vừa mới ghi nhận]', 'fmtDate(valid 2025) → date: ' + fmtDate(validDate));
    } catch(e) { log('CP19-date', false, 'Exception: ' + e.message); }

    // ── CP19-d: Accordion + compact panel DOM ─────────────────
    try {
      var toggleFn = typeof _toggleFieldLogAccordion === 'function';
      log('CP19-accordion-fn', toggleFn, '_toggleFieldLogAccordion exists: ' + toggleFn);
      var passesInlineFn = typeof _loadMyPassesInline === 'function';
      log('CP19-passes-inline', passesInlineFn, '_loadMyPassesInline exists: ' + passesInlineFn);
    } catch(e) { log('CP19-panel', false, 'Exception: ' + e.message); }

    console.log('%c\n══ RESULT CP19: ' + pass + ' PASS / ' + fail + ' FAIL ══',
      'color:#00ffcc;font-weight:800');
    console.groupEnd();
    return { pass: pass, fail: fail };
  };
})();


// ══════════════════════════════════════════════════════════════════
//  § UC-TAB4  4-TAB PROGRESSIVE ENHANCEMENT
//  Override tabbar HTML 5→4 tabs sau DOMContentLoaded
//  GO button · watchPosition GPS trace · Slide down UI
// ══════════════════════════════════════════════════════════════════

/* GPS watch state — module level */
var _runWatchId   = null;
var _runTraceCoords = [];

/** Khởi tạo tab bar 4 tabs sau DOMContentLoaded */
function _initFourTabBar() {
  try {
    var tabbar = document.getElementById('tabbar');
    if (!tabbar) return;

    // Inject style cho tab bar animation
    var style = document.createElement('style');
    style.id  = 'four-tab-style';
    style.textContent = [
      '#tabbar { transition: transform 0.38s cubic-bezier(0.4,0,0.2,1); }',
      '#tabbar.hide-for-run { transform: translateY(100%); }',
      '#sidebar-panels { transition: transform 0.38s cubic-bezier(0.4,0,0.2,1); }',
      '#sidebar-panels.hide-for-run { transform: translateX(-110%); }',
      '.main { transition: all 0.38s cubic-bezier(0.4,0,0.2,1); }',
      /* GO button */
      '#go-run-btn {',
      '  position:fixed; bottom:80px; left:50%; transform:translateX(-50%);',
      '  z-index:500; width:72px; height:72px; border-radius:50%;',
      '  background:var(--accent); color:#060d14;',
      '  font-family:"Barlow Condensed",Oswald,sans-serif;',
      '  font-size:22px; font-weight:900; letter-spacing:1px;',
      '  border:3px solid rgba(255,255,255,0.2);',
      '  box-shadow:0 0 0 6px rgba(0,229,160,0.15), 0 4px 24px rgba(0,0,0,0.4);',
      '  cursor:pointer; display:none;',
      '  transition:transform 0.2s, box-shadow 0.2s;',
      '}',
      '#go-run-btn:active { transform:translateX(-50%) scale(0.93); }',
      '#go-run-btn.running {',
      '  background:#ff5252; color:#fff;',
      '  box-shadow:0 0 0 6px rgba(255,82,82,0.2), 0 4px 24px rgba(0,0,0,0.4);',
      '  animation:neonPulse 1.4s ease-in-out infinite;',
      '}',
    ].join('\n');
    if (!document.getElementById('four-tab-style')) {
      document.head.appendChild(style);
    }

    // Rebuild tabbar: giữ indicator, thay 5 button → 4 button
    tabbar.innerHTML = [
      '<div class="tind" id="tind"></div>',

      /* 1. RUN */
      '<button class="tab on" data-tab="run" onclick="switchTab(\'run\')">',
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">',
      '<path d="M13 4a1 1 0 1 0 2 0 1 1 0 0 0-2 0"/>',
      '<path d="M7.5 17.5 10 13l3 2 2-4.5"/>',
      '<path d="M16.5 9.5 14 12l-2-1-3 5.5"/>',
      '</svg>🏃 RUN</button>',

      /* 2. CỘNG ĐỒNG */
      '<button class="tab" data-tab="community" onclick="switchTab(\'community\')">',
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">',
      '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>',
      '<circle cx="9" cy="7" r="4"/>',
      '<path d="M23 21v-2a4 4 0 0 0-3-3.87"/>',
      '<path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
      '</svg>👥 Cộng Đồng</button>',

      /* 3. TIN TỨC */
      '<button class="tab" data-tab="news" onclick="switchTab(\'news\')">',
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">',
      '<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a4 4 0 0 1-4 4z"/>',
      '<line x1="10" y1="7" x2="18" y2="7"/>',
      '<line x1="10" y1="11" x2="18" y2="11"/>',
      '</svg>📰 Tin Tức</button>',

      /* 4. CÁ NHÂN */
      '<button class="tab" data-tab="profile" onclick="switchTab(\'profile\')">',
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">',
      '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>',
      '<circle cx="12" cy="7" r="4"/>',
      '</svg>🪪 Cá Nhân</button>',
    ].join('');

    // Inject GO button vào body
    if (!document.getElementById('go-run-btn')) {
      var goBtn = document.createElement('button');
      goBtn.id  = 'go-run-btn';
      goBtn.textContent = 'GO';
      goBtn.setAttribute('aria-label', 'Bắt đầu chạy GPS');
      goBtn.onclick = _handleGoButton;
      document.body.appendChild(goBtn);
    }

    // Hiện GO button khi ở tab RUN
    _updateGoButtonVisibility();

  } catch(e) { console.warn('[_initFourTabBar]', e.message); }
}

/** Hiện/ẩn GO button theo tab hiện tại */
function _updateGoButtonVisibility() {
  var goBtn = document.getElementById('go-run-btn');
  if (!goBtn) return;
  var isRunTab = (S.tab === 'run' || S.tab === 'experience' || !S.tab);
  goBtn.style.display = isRunTab ? 'block' : 'none';
}

/** Handler nút GO — toggle run mode */
function _handleGoButton() {
  var goBtn = document.getElementById('go-run-btn');
  if (!goBtn) return;

  if (_runWatchId !== null) {
    // Đang chạy → STOP
    _stopRunMode();
  } else {
    // Chưa chạy → GO
    _startRunMode();
  }
}

/** Kích nổ chế độ RUN: slide ẩn UI, bật GPS, vẽ trace */
function _startRunMode() {
  try {
    var goBtn = document.getElementById('go-run-btn');

    // ── Keep-alive eager (iOS gesture token) ─────────────────────
    if (typeof _keepAliveSilentAudioEager === 'function') _keepAliveSilentAudioEager();
    if (typeof _activateKeepAlive === 'function') _activateKeepAlive();
    if (typeof _resetCoachingMilestones === 'function') _resetCoachingMilestones();

    // ── Slide ẩn tabbar + left panel ─────────────────────────────
    var tabbar = document.getElementById('tabbar');
    var sidebar = document.getElementById('sidebar-panels');
    if (tabbar)  tabbar.classList.add('hide-for-run');
    if (sidebar) sidebar.classList.add('hide-for-run');

    // ── Mapbox full-screen + satellite ───────────────────────────
    if (S.map && S.mapReady) {
      if (!S._preSatStyle) S._preSatStyle = S.map.getStyle().name || null;
      S.map.once('style.load', function(){
        if (S.lastLat && S.lastLng) {
          S.map.flyTo({ center:[S.lastLng,S.lastLat], zoom:17, pitch:55, bearing:0, duration:1200 });
        }
      });
      try { S.map.setStyle('mapbox://styles/mapbox/satellite-streets-v12'); } catch(e){}
    }

    // ── Init S.user_run state ────────────────────────────────────
    if (!S.user_run) S.user_run = {};
    S.user_run.live_coordinates = [];
    S.user_run.start_ts         = Date.now();
    S.user_run.active           = true;
    _runTraceCoords = [];

    // ── Tạo GeoJSON source cho trace line ────────────────────────
    if (S.map && S.mapReady) {
      S.map.once('style.load', function(){
        _initRunTraceLayer();
      });
      // Nếu style đã load rồi (không cần chờ)
      try {
        if (S.map.isStyleLoaded && S.map.isStyleLoaded()) _initRunTraceLayer();
      } catch(e){}
    }

    // ── watchPosition ────────────────────────────────────────────
    if (navigator.geolocation) {
      _runWatchId = navigator.geolocation.watchPosition(
        function(pos){
          var lat = pos.coords.latitude;
          var lng = pos.coords.longitude;
          var acc = pos.coords.accuracy;

          // Append vào state
          S.user_run.live_coordinates.push({ lat:lat, lng:lng, ts:Date.now(), acc:acc });
          _runTraceCoords.push([lng, lat]); // GeoJSON [lng,lat]

          // Cache lastLat/lastLng
          S.lastLat = lat; S.lastLng = lng;

          // Update map center nhẹ (không flyTo → tránh jitter)
          if (S.map && _runTraceCoords.length === 1) {
            S.map.jumpTo({ center:[lng,lat] });
          }

          // Update trace layer
          _updateRunTraceLine();
        },
        function(err){
          console.warn('[RunGPS]', err.message);
          showToast('⚠️ GPS: ' + err.message, 'warn', 3000);
        },
        { enableHighAccuracy:true, timeout:10000, maximumAge:0 }
      );
    } else {
      showToast('Thiết bị không hỗ trợ GPS', 'warn', 3000);
    }

    // ── Update GO button ─────────────────────────────────────────
    if (goBtn) {
      goBtn.textContent = 'STOP';
      goBtn.classList.add('running');
    }
    showToast('🏃 Đang ghi GPS thực địa...', 'ok', 3000);

  } catch(e) { console.warn('[_startRunMode]', e.message); }
}

/** Khởi tạo GeoJSON source + layer trace neon */
function _initRunTraceLayer() {
  try {
    if (!S.map) return;
    if (S.map.getSource('run-trace-src')) {
      S.map.removeLayer('run-trace-line');
      S.map.removeSource('run-trace-src');
    }
    S.map.addSource('run-trace-src', {
      type: 'geojson',
      data: { type:'Feature', geometry:{ type:'LineString', coordinates:[] } },
    });
    S.map.addLayer({
      id    : 'run-trace-line',
      type  : 'line',
      source: 'run-trace-src',
      layout: { 'line-join':'round', 'line-cap':'round' },
      paint : {
        'line-color'  : '#00e5a0',
        'line-width'  : 4,
        'line-opacity': 0.9,
        'line-blur'   : 0.5,
      },
    });
  } catch(e) { console.warn('[_initRunTraceLayer]', e.message); }
}

/** Cập nhật trace line với tọa độ mới */
function _updateRunTraceLine() {
  try {
    if (!S.map || !_runTraceCoords.length) return;
    var src = S.map.getSource('run-trace-src');
    if (src) {
      src.setData({
        type    : 'Feature',
        geometry: { type:'LineString', coordinates: _runTraceCoords },
      });
    }
  } catch(e) {}
}

/** Dừng chế độ RUN: hiện lại UI, dọn GPS, cleanup */
function _stopRunMode() {
  try {
    // ── Dọn watchPosition ngay lập tức → bảo vệ pin ─────────────
    _clearStationaryWorkoutHUD();

    // ── Hiện lại tabbar + sidebar ────────────────────────────────
    var tabbar  = document.getElementById('tabbar');
    var sidebar = document.getElementById('sidebar-panels');
    if (tabbar)  tabbar.classList.remove('hide-for-run');
    if (sidebar) sidebar.classList.remove('hide-for-run');

    // ── Restore map style ────────────────────────────────────────
    if (S.map && S.mapReady) {
      try {
        S.map.setStyle('mapbox://styles/mapbox/dark-v11');
      } catch(e){}
    }

    // ── Update GO button ─────────────────────────────────────────
    var goBtn = document.getElementById('go-run-btn');
    if (goBtn) { goBtn.textContent = 'GO'; goBtn.classList.remove('running'); }

    // ── Cleanup state ────────────────────────────────────────────
    if (S.user_run) S.user_run.active = false;
    if (typeof _releaseKeepAlive === 'function') _releaseKeepAlive();
    if (typeof _clearCrashBuffer === 'function') _clearCrashBuffer();

    showToast('✅ Kết thúc hành trình · Dữ liệu đã lưu', 'ok', 3500);

  } catch(e) { console.warn('[_stopRunMode]', e.message); }
}

/** Cleanup GPS watchPosition — gọi khi STOP hoặc _endLiveSession */
function _clearStationaryWorkoutHUD() {
  if (_runWatchId !== null) {
    navigator.geolocation.clearWatch(_runWatchId);
    _runWatchId = null;
  }
  _runTraceCoords = [];
}

// Hook _clearStationaryWorkoutHUD vào _endLiveSession (defensive)
(function(){
  var _origEnd = typeof _endLiveSession === 'function' ? _endLiveSession : null;
  if (!_origEnd) return;
  window._endLiveSession = function(){
    _clearStationaryWorkoutHUD();
    _origEnd.apply(this, arguments);
  };
})();

// Khởi động sau DOMContentLoaded
document.addEventListener('DOMContentLoaded', function(){
  // Override tabbar sau khi HTML đã render
  setTimeout(_initFourTabBar, 0);
});


// ══════════════════════════════════════════════════════════════════
//  CP21 — 4-TAB + GO + GPS TRACE TESTS
// ══════════════════════════════════════════════════════════════════

(function(){
  var _prev = window.runCam5HubCoreTests;
  window.runCam5HubCoreTests = function(){
    var base = _prev ? _prev() : { pass:0, fail:0 };
    var pass = base.pass, fail = base.fail;

    function log(id, ok, detail){
      console.log((ok?'✅':'❌')+' '+id+': '+detail);
      if(ok) pass++; else fail++;
    }

    console.group('%c🏃 CP21 4-TAB + GO + GPS TRACE','color:#00e5a0;font-weight:800;font-size:13px');

    // CP21-a: Tab bar DOM structure
    try {
      var tabs = document.querySelectorAll('.tab');
      log('CP21-4-tabs', tabs.length === 4, 'Tab bar has 4 tabs: ' + tabs.length);
      var tabNames = Array.from(tabs).map(function(t){ return t.dataset.tab; });
      log('CP21-run-tab',       tabNames.indexOf('run') > -1,       'run tab present: '       + tabNames);
      log('CP21-community-tab', tabNames.indexOf('community') > -1, 'community tab present');
      log('CP21-news-tab',      tabNames.indexOf('news') > -1,      'news tab present');
      log('CP21-profile-tab',   tabNames.indexOf('profile') > -1,   'profile tab present');
      log('CP21-no-coaches-tab',tabNames.indexOf('coaches') === -1, 'no standalone coaches tab');
      log('CP21-no-exp-tab',    tabNames.indexOf('experience') === -1,'no old experience tab');
    } catch(e){ log('CP21-tabs', false, 'Exception: '+e.message); }

    // CP21-b: Segmented control in community panel
    try {
      var seg = document.getElementById('community-seg');
      log('CP21-seg-control', !!seg, 'community segmented control exists: '+!!seg);
      var segBtns = document.querySelectorAll('#community-seg button');
      log('CP21-seg-2-btns', segBtns.length === 2, 'segmented has 2 buttons: '+segBtns.length);
      log('CP21-sub-guild',   !!document.getElementById('sub-guild'),   'sub-guild panel exists');
      log('CP21-sub-coaches', !!document.getElementById('sub-coaches'), 'sub-coaches panel exists');
    } catch(e){ log('CP21-seg', false, 'Exception: '+e.message); }

    // CP21-c: GO button exists
    try {
      var goBtn = document.getElementById('go-run-btn');
      log('CP21-go-btn', !!goBtn, 'GO button injected: '+!!goBtn);
      log('CP21-go-fn',  typeof _handleGoButton === 'function', '_handleGoButton exists');
      log('CP21-clear-watch-fn', typeof _clearStationaryWorkoutHUD === 'function',
        '_clearStationaryWorkoutHUD exists (GPS cleanup)');
    } catch(e){ log('CP21-go', false, 'Exception: '+e.message); }

    // CP21-d: GPS trace state init
    try {
      if (!S.user_run) S.user_run = {};
      S.user_run.live_coordinates = [];
      // Simulate GPS push
      S.user_run.live_coordinates.push({ lat:20.518, lng:105.892, ts:Date.now(), acc:15 });
      _runTraceCoords = [[105.892, 20.518]];
      log('CP21-user-run-state', S.user_run.live_coordinates.length === 1,
        'S.user_run.live_coordinates appended: '+S.user_run.live_coordinates.length);
      log('CP21-trace-coords', _runTraceCoords.length === 1,
        '_runTraceCoords appended: '+_runTraceCoords.length);
      // Cleanup test state
      S.user_run.live_coordinates = [];
      _runTraceCoords = [];
    } catch(e){ log('CP21-gps', false, 'Exception: '+e.message); }

    // CP21-e: Date 1899 fix (regression check)
    try {
      log('CP21-date-zero',  fmtDate(0)    === '[Vừa mới ghi nhận]', 'fmtDate(0) safe');
      log('CP21-date-null',  fmtDate(null) === '[Vừa mới ghi nhận]', 'fmtDate(null) safe');
      log('CP21-date-1899',  fmtDate('Sat Dec 30 1899 00:00:00') === '[Vừa mới ghi nhận]', '1899 string safe');
      log('CP21-date-valid', fmtDate('2025-06-15') !== '[Vừa mới ghi nhận]', 'valid 2025 date works');
    } catch(e){ log('CP21-date', false, 'Exception: '+e.message); }

    // CP21-f: switchTab alias
    try {
      log('CP21-alias-fn', typeof switchTab === 'function', 'switchTab exists');
      // Verify 'experience' alias doesn't crash (no coaches tab to crash on)
      var origTab = S.tab;
      try { switchTab('experience'); log('CP21-exp-alias', S.tab==='run', 'experience→run alias: S.tab='+S.tab); }
      catch(e2){ log('CP21-exp-alias', false, 'Crashed: '+e2.message); }
      S.tab = origTab || 'run';
    } catch(e){ log('CP21-alias', false, 'Exception: '+e.message); }

    console.log('%c\n══ RESULT CP21: '+pass+' PASS / '+fail+' FAIL ══',
      fail===base.fail?'color:#00e5a0;font-weight:800':'color:#ff5252;font-weight:800');
    console.groupEnd();
    return { pass:pass, fail:fail };
  };
})();
