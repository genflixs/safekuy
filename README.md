# MyDrive

Galeri file modern dengan struktur folder (mirip Google Drive UI), dibangun dengan **vanilla HTML/CSS/JS** — tanpa framework, tanpa backend, tanpa build step.

Siap deploy ke **GitHub Pages** dalam waktu kurang dari 2 menit.

---

## Fitur

| Fitur | Keterangan |
|---|---|
| Struktur 3-tier | Root folder list → Subfolder file grid → File detail |
| Hash router | `#/`, `#/folder/<id>`, `#/file/<id>?p=2` — bekerja di GitHub Pages tanpa konfigurasi tambahan |
| Dark / Light theme | Toggle dengan persistensi `localStorage`, default mengikuti preferensi OS |
| Glassmorphism topbar | Backdrop blur, sticky, pill-shaped |
| Search | Pencarian real-time per folder (debounced) |
| Sort | Nama (A-Z / Z-A), tanggal, popularitas, ukuran |
| Pagination | Windowed dengan ellipsis, mendukung banyak halaman |
| Lazy loading | Native `loading="lazy"` + fade-in saat load |
| File type badges | Image / Video / Audio / Document / Archive |
| Responsive grid | Auto-fill `minmax()`, mobile-first |
| SEO-ready | Meta tags dinamis per halaman, Open Graph, Twitter Card |
| Configurable | Semua setting di satu file: `assets/js/config.js` |
| Ad-ready | Slot header / sidebar / in-grid / footer (Google AdSense atau custom HTML) |
| Analytics-ready | Google Analytics 4, Plausible, atau Umami |
| Share button | Native Web Share API + clipboard fallback |
| 0 dependency | Tidak pakai jQuery, React, Vue, atau library apa pun |
| Reduced motion | Hormati `prefers-reduced-motion` |

---

## Struktur Project

```
filecoster-clone/
├── index.html                  # SPA shell (header + container)
├── .nojekyll                   # Cegah Jekyll processing
├── _config.yml                 # GitHub Pages config (opsional)
├── README.md                   # Dokumen ini
├── data/
│   └── content.json            # Data folder & file kamu (edit ini!)
├── assets/
│   ├── css/
│   │   └── style.css           # Semua styling
│   ├── js/
│   │   ├── config.js           # ⚙️  KONFIGURASI UTAMA (edit ini!)
│   │   └── app.js              # Logic aplikasi (tidak perlu disentuh)
│   └── icons/
│       ├── favicon.svg
│       └── og-default.svg
└── .github/
    └── workflows/
        └── deploy.yml          # Auto-deploy ke GitHub Pages
```

---

## Quick Start (Lokal)

Tidak perlu build step. Cukup serve folder dengan HTTP server statis:

```bash
# Opsi 1: Python
python3 -m http.server 8080

# Opsi 2: Node.js (jika punya npx)
npx serve -p 8080

# Opsi 3: VS Code
# Install ekstensi "Live Server", klik kanan index.html > Open with Live Server
```

Buka `http://localhost:8080` di browser.

> **Penting:** Jangan buka `index.html` langsung via `file://` karena `fetch()` data JSON akan diblokir browser (CORS). Wajib pakai HTTP server.

---

## Deploy ke GitHub Pages

### Cara cepat (3 langkah)

1. **Push repo ini ke GitHub** (bisa repo baru atau existing)
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/USERNAME/REPO-NAME.git
   git push -u origin main
   ```

2. **Aktifkan GitHub Actions deploy:**
   - Buka repo di GitHub → **Settings** → **Pages**
   - Pada **Build and deployment** → **Source**, pilih **GitHub Actions**

3. **Tunggu 1-2 menit.** Workflow akan otomatis jalan pada setiap push ke `main`. Setelah selesai, situs kamu live di:
   ```
   https://USERNAME.github.io/REPO-NAME/
   ```

### Penting: Base Path

Karena situs akan di-serve dari subpath `/REPO-NAME/`, kamu **wajib** update `basePath` di `assets/js/config.js`:

```js
basePath: "/REPO-NAME/",
```

Jika kamu pakai custom domain (root domain), biarkan `"/"`.

---

## Custom Domain (Opsional)

1. Beli/arahkan domain kamu (misal: `mydrive.example.com`)
2. Tambahkan DNS record:
   - **A record**: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - Atau **CNAME record**: ke `USERNAME.github.io`
3. Buat file **`CNAME`** (tanpa ekstensi) di root repo, isi domain kamu:
   ```
   mydrive.example.com
   ```
4. Di repo GitHub: **Settings** → **Pages** → **Custom domain** → masukkan domain → **Enforce HTTPS** (recommended)
5. Set `basePath: "/"` di config.js

---

## Konfigurasi Lengkap

Semua setting ada di **`assets/js/config.js`**. Kamu tidak perlu menyentuh file lain untuk konfigurasi normal.

### Site Identity
```js
site: {
  name: "MyDrive",
  tagline: "File gallery modern, statis, dan cepat",
  domain: "",
  brandEmoji: "📁",
  favicon: "/assets/icons/favicon.svg",
  lang: "id",
  footerHtml: "&copy; 2026 MyDrive.",
}
```

### Base Path (penting!)
```js
basePath: "/",  // atau "/REPO-NAME/" untuk subpath GitHub Pages
```

### Theme
```js
theme: {
  defaultMode: "dark",  // "dark" | "light" | "auto"
  primary: "#fe6081",
  primaryRgb: "254, 96, 129",
  showToggle: true,
}
```

### Ads (Google AdSense)
```js
ads: {
  enabled: true,
  provider: "adsense",
  adsenseClient: "ca-pub-XXXXXXXXXXXXXXXX",
  slots: {
    header: "1234567890",
    sidebar: "0987654321",
    inGrid: "1111111111",
    footer: "2222222222",
  },
}
```
Atau pakai custom HTML:
```js
ads: {
  enabled: true,
  provider: "custom",
  customHtml: {
    header: '<div class="my-ad">...</div>',
    footer: '<iframe src="..."></iframe>',
  },
}
```

### Analytics
```js
analytics: {
  enabled: true,
  provider: "ga4",  // atau "plausible", "umami"
  ga4MeasurementId: "G-XXXXXXXXXX",
}
```

### SEO
```js
seo: {
  allowIndex: true,  // false = noindex,nofollow (private)
  description: "...",
  keywords: "...",
  ogImage: "/assets/icons/og-default.svg",
}
```

### Pagination
```js
pagination: {
  itemsPerPage: 24,
  maxPageButtons: 7,
}
```

### Features Toggle
```js
features: {
  search: true,
  sort: true,
  breadcrumb: true,
  themeToggle: true,
  lazyLoad: true,
  downloadButton: true,
  shareButton: true,
  showFileSize: true,
  showDate: true,
  showViewCount: false,
}
```

---

## Mengganti Data Konten

Edit **`data/content.json`**. Struktur:

```json
{
  "folders": [
    {
      "id": "unique-id",
      "name": "Nama Folder",
      "description": "Deskripsi singkat",
      "icon": "code",      // nature|code|palette|music|document|image|default
      "color": "#3b82f6",  // warna aksen folder
      "createdAt": "2026-01-15",
      "files": [
        {
          "id": "unique-file-id",
          "name": "filename.ext",
          "type": "video",   // image|video|audio|document|archive
          "thumbnail": "https://...",
          "url": "https://...",
          "duration": "12:34",
          "size": "84 MB",
          "date": "2026-01-08",
          "views": 15420
        }
      ]
    }
  ]
}
```

### Tips:
- **Thumbnail** disarankan rasio 9:16 (portrait) supaya tampil optimal di grid. Untuk gambar landscape, akan tetap tampil (object-fit cover).
- **URL file** bisa di mana saja: external CDN, GitHub release assets, Google Drive direct link, atau path relatif di repo (`/files/video.mp4`).
- Jika kamu ingin file disimpan langsung di repo, buat folder `files/` dan taruh file di sana, lalu set `url: "/files/nama-file.ext"`.

---

## Performance Notes

- **Tidak ada framework JS** → bundle size < 30KB total (HTML + CSS + JS)
- **Native lazy loading** → gambar tidak load sampai viewport
- **CSS variables** → theme switch instan tanpa re-render
- **Hash routing** → tidak perlu server config untuk SPA fallback

---

## Browser Support

Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+).
Mendukung `IntersectionObserver`, `aspect-ratio`, CSS Grid, `backdrop-filter`.

---

## License

MIT — bebas dipakai, dimodifikasi, didistribusikan.

---

## FAQ

**Q: Kenapa gambar tidak muncul saat saya buka index.html langsung?**
A: Browser memblokir `fetch()` untuk `file://`. Wajib pakai HTTP server lokal (lihat Quick Start).

**Q: Bisakah pakai backend (Next.js, Express, dll)?**
A: Bisa, tapi tidak perlu. Site ini sengaja dirancang statis agar gratis hosting di GitHub Pages. Jika butuh upload file / autentikasi, fork repo ini dan tambahkan API route sesuai kebutuhan.

**Q: Bagaimana jika data `content.json` saya besar (>1MB)?**
A: Pertimbangkan untuk memuat data per-folder (1 file JSON per folder di `data/folder-<id>.json`). Edit `app.js` fungsi `loadData()` untuk fetch on-demand.

**Q: AdSense saya ditolak karena "low value content"?**
A: Pastikan konten kamu orisinal, cukup banyak, dan halaman navigable. AdSense memerlukan minimum ~30 halaman berkualitas. Site ini sudah SEO-friendly, tinggal isi konten yang baik.
