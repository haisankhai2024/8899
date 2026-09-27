// Service worker — cache vỏ app để mở nhanh/offline; dữ liệu đơn luôn lấy từ máy chủ.
var CACHE = 'hsk-nhan-don-6ac74e1b';
var VO = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', function(e){ e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(VO); }).then(function(){ return self.skipWaiting(); })); });
self.addEventListener('activate', function(e){ e.waitUntil(caches.keys().then(function(ks){ return Promise.all(ks.filter(function(k){ return k!==CACHE; }).map(function(k){ return caches.delete(k); })); }).then(function(){ return self.clients.claim(); })); });
self.addEventListener('fetch', function(e){
  var u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(function(r){ var c = r.clone(); caches.open(CACHE).then(function(cache){ cache.put(e.request, c); }); return r; }).catch(function(){ return caches.match(e.request); }));
});
self.addEventListener('notificationclick', function(e){ e.notification.close(); e.waitUntil(clients.matchAll({type:'window'}).then(function(ws){ if(ws.length){ return ws[0].focus(); } return clients.openWindow('./'); })); });
