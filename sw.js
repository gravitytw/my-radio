// 每次修改 index.html 並推上 GitHub 時，只要改一下這個版本號（例如 v4.0 -> v4.1），手機就會自動跳出更新橫幅！
const CACHE_NAME = 'roys-radio-hud-v4.2';

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-512.png'
];

// 1. 安裝階段：預先快取核心介面檔案
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
});

// 2. 啟動階段：自動清除舊版本的快取空間
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// 3. 接收網頁「立即更新重整」按鈕的指令，立刻接管頁面
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 4. 網路請求攔截策略（保護廣播串流不被快取卡死）
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 忽略非 GET 請求、廣播串流媒體 (.m3u8 / .ts / .aac / .mp3 / revma / pbs) 與 Firebase API
  if (
    req.method !== 'GET' ||
    url.pathname.endsWith('.m3u8') ||
    url.pathname.endsWith('.ts') ||
    url.pathname.endsWith('.aac') ||
    url.pathname.endsWith('.mp3') ||
    url.pathname.endsWith('.m4a') ||
    url.hostname.includes('revma') ||
    url.hostname.includes('pbs.gov.tw') ||
    url.hostname.includes('workers.dev') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('firebase')
  ) {
    return;
  }

  // 對 index.html 採用「網路優先（Network First）」：有網路就抓最新介面並更新快取，沒網路才讀離線快取
  if (req.mode === 'navigate' || url.pathname.endsWith('index.html')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // 其他靜態圖示與設定檔採用「快取優先（Cache First）」加快開啟速度
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
