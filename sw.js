/* ============================================================
   Service Worker - 国内旅行業務取扱管理者試験 問題演習
   ------------------------------------------------------------
   HTMLファイル本体（index.html）と同じ階層に設置することで、
   アプリの完全なオフライン利用を可能にします。
   GitHub Pages 等の HTTPS 環境に、HTMLファイルとともに
   この sw.js を配置してください。
   ============================================================ */

const CACHE_NAME = "kokunai-kanri-v1";

// キャッシュ対象（同階層のHTMLとSW自身、フォント）
const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./Domestic_Travel_Services_Manager.html"
];

// インストール時：主要リソースを事前キャッシュ
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // 個別に追加し、存在しないファイルがあってもインストールを失敗させない
      return Promise.allSettled(
        PRECACHE_URLS.map((url) => cache.add(url).catch(() => null))
      );
    })
  );
});

// 有効化時：古いキャッシュを削除
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// フェッチ時：キャッシュ優先、なければネットワーク（取得したらキャッシュ）
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          // 正常なレスポンスのみキャッシュに保存
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, copy).catch(() => {});
            });
          }
          return response;
        })
        .catch(() => cached);

      // キャッシュがあれば即返し、裏でネットワーク更新（stale-while-revalidate）
      return cached || networkFetch;
    })
  );
});
