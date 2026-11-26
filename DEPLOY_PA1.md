# Hướng dẫn Deploy PA1 — Vercel + Cloudflare R2 + Render (Miễn phí)

Kiến trúc tách tài nguyên giúp repo nhẹ chỉ **~3.5 MB** nhưng vẫn phục vụ đủ **~960 MB sprite M.U.G.E.N** và **PvP WebSocket Online**:

| Thành phần | Dịch vụ | Dung lượng / Vai trò |
|---|---|---|
| Web App + 126 Avatars | **Vercel** (Static) | ~3.5 MB (`index.html`, JS/CSS, `avatars/`) |
| Sprite M.U.G.E.N (`.sff/.air/.act/.def`) | **Cloudflare R2** | 245 files (~960 MB, miễn phí 10 GB storage + 0đ egress) |
| WebSocket PvP Server (`server.js`) | **Render Free** | Node.js Web Service + `/healthz` |

> Local dev vẫn giữ nguyên 100%: chạy `node server.js` khi `config.js` để trống `''`.

---

## Bước 1 — Init & Push Repo Nhẹ (~3.5 MB) lên GitHub

File `.gitignore` đã tự động loại trừ `chars/` (~960 MB), `.agents/`, `.claude/`, `.env`, `node_modules/` và **giữ lại** thư mục `avatars/` (~2.5 MB).

1. Tạo một repository mới trên GitHub (ví dụ: `anime-crossover-bvn`).
2. Mở terminal tại thư mục `anime-crossover-web` và chạy:

```bash
git init
git add .
git status
```

3. Kiểm tra `git status`: **không được có** `chars/` hay `.env`.
4. Commit & push:

```bash
git commit -m "Initial PA1 production setup"
git branch -M main
git remote add origin https://github.com/<USERNAME>/<REPO>.git
git push -u origin main
```

---

## Bước 2 — Tạo Cloudflare R2 Bucket, Bật CORS & Upload M.U.G.E.N Assets

1. Vào **Cloudflare Dashboard → R2 Object Storage → Create bucket** (ví dụ: `anime-crossover-assets`).
2. Vào **Bucket → Settings → Public Access**:
   - Bật **R2.dev subdomain** (hoặc gắn Custom Domain) để lấy Public URL dạng:
     `https://pub-xxxxxxxxxxxxxxxx.r2.dev`
3. Vào **Bucket → Settings → CORS Policy → Edit CORS Policy**, dán nguyên nội dung file [`r2-cors.json`](./r2-cors.json) rồi **Save**.
4. Vào **R2 Overview → Manage R2 API Tokens → Create API Token**:
   - Permissions: **Object Read & Write** cho bucket `anime-crossover-assets`.
   - Lưu lại `Account ID`, `Access Key ID`, và `Secret Access Key`.
5. Upload 245 file active (`.sff`, `.air`, `.act`, `.def`, tự bỏ qua `*_catalog.json` và `jus_db_naruto`, không cần `npm install`):

**Xem trước danh sách (không tốn mạng):**
```bash
node upload-r2.mjs --dry-run
```

**Chạy upload trên PowerShell (Windows):**
```powershell
$env:R2_ACCOUNT_ID="<YOUR_ACCOUNT_ID>"
$env:R2_ACCESS_KEY_ID="<YOUR_ACCESS_KEY_ID>"
$env:R2_SECRET_ACCESS_KEY="<YOUR_SECRET_ACCESS_KEY>"
$env:R2_BUCKET="anime-crossover-assets"
npm run upload-r2
```

**Chạy upload trên Bash (macOS/Linux):**
```bash
export R2_ACCOUNT_ID="<YOUR_ACCOUNT_ID>"
export R2_ACCESS_KEY_ID="<YOUR_ACCESS_KEY_ID>"
export R2_SECRET_ACCESS_KEY="<YOUR_SECRET_ACCESS_KEY>"
export R2_BUCKET="anime-crossover-assets"
npm run upload-r2
```

> Script tự chạy song song 6 luồng, tự retry khi rớt mạng và tự **SKIP** các file đã tồn tại đúng kích thước (an toàn khi chạy lại). Nếu muốn dùng Wrangler CLI, chạy `node upload-r2.mjs --wrangler`.

6. Kiểm tra nhanh một asset trên trình duyệt:
   `https://pub-xxxxxxxxxxxxxxxx.r2.dev/chars/naruto/Naruto.def` → trả về nội dung text là thành công.

---

## Bước 3 — Deploy WebSocket Netplay Server lên Render Free

1. Vào **Render Dashboard → New → Blueprint** (khuyên dùng) và kết nối repo GitHub ở Bước 1.
   - Render sẽ tự đọc file [`render.yaml`](./render.yaml) (`node server.js`, health check `/healthz`, `NODE_ENV=production`).
   - *(Hoặc chọn **New → Web Service**, Runtime `Node`, Build Command để trống, Start Command `node server.js`, Health Check Path `/healthz`).*
2. Sau khi deploy xong, lấy domain Render (ví dụ: `https://anime-crossover-bvn-ws.onrender.com`).
3. Kiểm tra health check:
   - Mở `https://anime-crossover-bvn-ws.onrender.com/healthz`
   - Kỳ vọng JSON `200 OK`: `{"ok":true,"online":0,"rooms":0,"uptimeSec":...}`

---

## Bước 4 — Smoke-test, Điền `config.js` & Deploy lên Vercel

### 4.1. Smoke-test trước khi commit (Query-param Override)

Bạn có thể thử kết nối R2 + Render ngay khi chạy local mà chưa cần sửa `config.js`:

```text
http://localhost:8080/?assets=https://pub-xxxxxxxxxxxxxxxx.r2.dev&ws=https://anime-crossover-bvn-ws.onrender.com
```

Mở DevTools → Network để xác nhận `.sff/.air` tải từ R2 và WebSocket kết nối tới `wss://.../ws`.

### 4.2. Ghi cấu hình Production vào `config.js`

Mở [`config.js`](./config.js) và điền 2 URL công khai của bạn:

```js
const DEFAULT_CONFIG = {
  ASSET_BASE_URL: 'https://pub-xxxxxxxxxxxxxxxx.r2.dev',
  NETPLAY_WS_URL: 'wss://anime-crossover-bvn-ws.onrender.com/ws'
};
```

*(Lưu ý: `ASSET_BASE_URL` và `NETPLAY_WS_URL` là URL công khai, tuyệt đối **không** đặt R2 Access Key / Secret Key vào `config.js`.)*

Push thay đổi lên GitHub:
```bash
git add config.js
git commit -m "Configure production R2 and Render endpoints"
git push
```

### 4.3. Deploy lên Vercel

1. Vào **Vercel Dashboard → Add New → Project** → chọn repo GitHub vừa push.
2. Framework Preset: **Other** (Static), Build Command để trống, Output Directory để trống (root).
3. Nhấn **Deploy**. Vercel tự áp dụng [`vercel.json`](./vercel.json) (cache 1 năm cho `/avatars/*`, header bảo mật `nosniff`).
4. Mở URL Vercel (`https://<project>.vercel.app`), chọn nhân vật M.U.G.E.N và mở tab **Online PvP** để kiểm tra toàn bộ luồng.

---

## Lưu ý & Troubleshooting

- **Render Free Cold Start**: Sau ~15 phút không có kết nối, Render Free sẽ sleep và mất ~30–50 giây để đánh thức ở kết nối đầu tiên. `netplay.js` tự reconnect mỗi ~2.2 giây cho tới khi server thức dậy.
- **Lỗi CORS khi load sprite từ R2**: Kiểm tra lại CORS Policy trong R2 Bucket đã dán đúng [`r2-cors.json`](./r2-cors.json) chưa và trình duyệt không cache response lỗi cũ (Hard Reload `Ctrl+Shift+R`).
- **Bảo mật**: Không bao giờ commit `.env` hoặc R2 API keys lên Git.
