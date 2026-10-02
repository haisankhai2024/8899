// Service worker — cache vỏ app để mở nhanh/offline; dữ liệu đơn luôn lấy từ máy chủ.
// 01/10/2026: nhận chuông thông báo đẩy → hỏi máy chủ nội dung → hiện thông báo (kể cả khi app đang tắt).
var CACHE = 'hsk-nhan-don-b01d4be7', CACHE_TB = 'hsk-tb', API_URL = "https://script.google.com/macros/s/AKfycbwc0RGf3TtR2CTsuaiPMpsT3vMWfCTnCXP0KyAeLW5ZtU8BHILCq206aI5j34CtE9_T/exec";
var VO = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', function(e){ e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(VO); }).then(function(){ return self.skipWaiting(); })); });
self.addEventListener('activate', function(e){ e.waitUntil(caches.keys().then(function(ks){ return Promise.all(ks.filter(function(k){ return k!==CACHE && k!==CACHE_TB; }).map(function(k){ return caches.delete(k); })); }).then(function(){ return self.clients.claim(); })); });
self.addEventListener('fetch', function(e){
  var u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(function(r){ var c = r.clone(); caches.open(CACHE).then(function(cache){ cache.put(e.request, c); }); return r; }).catch(function(){ return caches.match(e.request); }));
});
function daHien(){ return caches.open(CACHE_TB).then(function(c){ return c.match('./__da-hien'); }).then(function(r){ return r ? r.json() : []; }).catch(function(){ return []; }); }
function luuDaHien(a){ return caches.open(CACHE_TB).then(function(c){ return c.put('./__da-hien', new Response(JSON.stringify(a.slice(-100)))); }).catch(function(){}); }
function hien(t, keu){ return self.registration.showNotification(t.t, {body:t.b, tag:'hsk-'+t.s, renotify:!!keu, icon:'icon-192.png', vibrate: t.m==='do' ? [400,150,400,150,400] : [250,120,250], requireInteraction: t.m==='do', data:{ma:t.ma}}); }
self.addEventListener('push', function(e){
  e.waitUntil(self.registration.pushManager.getSubscription().then(function(sub){
    if(!sub) return null;
    return fetch(API_URL, {method:'POST', body:JSON.stringify({loai:'tb', ep:sub.endpoint})}).then(function(r){ return r.json(); }).then(function(j){ return (j && j.ok) ? (j.tb || []) : null; });
  }).catch(function(){ return null; }).then(function(ds){
    return daHien().then(function(da){
      var moi = (ds || []).filter(function(t){ return da.indexOf(t.s) < 0; }).slice(-3);
      if (moi.length) return Promise.all(moi.map(function(t){ return hien(t, true); })).then(function(){ return luuDaHien(da.concat(moi.map(function(t){ return t.s; }))); });
      if (ds && ds.length) return hien(ds[ds.length-1], false);
      return self.registration.showNotification('Nhận đơn HSK', {body:'Có cập nhật đơn — bấm để mở app xem.', tag:'hsk-chung', icon:'icon-192.png'});
    });
  }));
});
self.addEventListener('pushsubscriptionchange', function(e){
  var cu = e.oldSubscription ? e.oldSubscription.endpoint : '';
  e.waitUntil(fetch(API_URL, {method:'POST', body:JSON.stringify({loai:'goi', fn:'khoaDay', arg:null})}).then(function(r){ return r.json(); }).then(function(j){
    var s = String(j.kq).replace(/-/g,'+').replace(/_/g,'/'); while (s.length % 4) s += '='; var b = atob(s), k = new Uint8Array(b.length); for (var i=0;i<b.length;i++) k[i] = b.charCodeAt(i);
    return self.registration.pushManager.subscribe({userVisibleOnly:true, applicationServerKey:k});
  }).then(function(sub){ return fetch(API_URL, {method:'POST', body:JSON.stringify({loai:'doiDangKy', cu:cu, moi:sub.endpoint})}); }).catch(function(){}));
});
self.addEventListener('notificationclick', function(e){ e.notification.close(); e.waitUntil(clients.matchAll({type:'window', includeUncontrolled:true}).then(function(ws){ if(ws.length){ return ws[0].focus(); } return clients.openWindow('./'); })); });
