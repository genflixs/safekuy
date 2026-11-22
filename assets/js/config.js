/**
 * ============================================================
 *  SITE CONFIGURATION
 *  Edit file ini untuk mengatur seluruh aspek situs kamu.
 *  Tidak perlu menyentuh file lain cukup ubah nilai di sini.
 * ============================================================
 */
window.SITE_CONFIG = {
  /**
   * --- SITE IDENTITY ---
   */
  site: {
    // Name will be auto-derived from domain (e.g., "gitplay" from "gitplay.test")
    // Set override here only if you want a custom name
    name: "",
    tagline: "",
    // Brand mark: "player" for play button SVG, or emoji
    brandEmoji: "player",
    // Favicon path
    favicon: "/assets/icons/favicon.svg",
    // Bahasa default halaman
    lang: "id",
    // Footer text (HTML boleh)
    footerHtml: "&copy; 2026 MyDrive. All rights reserved.",
  },

  /**
   * --- BASE PATH (penting untuk GitHub Pages) ---
   * Jika deploy ke https://username.github.io/<repo-name>/
   * maka set base path = "/<repo-name>/"
   * Jika deploy ke custom domain atau root domain, biarkan "/".
   */
  basePath: "/",

  /**
   * --- PAGINATION ---
   */
  pagination: {
    itemsPerPage: 24,
    maxPageButtons: 7,
  },

  /**
   * --- THEME ---
   */
  theme: {
    defaultMode: "dark", // "dark" | "light" | "auto"
    // Warna primer (pink-coral seperti original, atau ganti sesuai brand kamu)
    primary: "#fe6081",
    primaryRgb: "254, 96, 129",
    // Set false untuk menonaktifkan toggle tema
    showToggle: true,
  },

  /**
   * --- SEO & INDEXING ---
   * Berbeda dengan situs original yang noindex/nofollow,
   * di sini default allow indexing supaya situs kamu bisa ditemukan.
   * Set false jika kamu ingin private.
   */
  seo: {
    allowIndex: true,
    description: "Galeri file modern dengan struktur folder, pencarian, dan dark mode.",
    keywords: "file gallery, file sharing, drive, folder",
    ogImage: "/assets/icons/og-default.svg",
  },

  /**
   * --- ADVERTISEMENT ---
   * Nonaktif secara default. Aktifkan dan isi slot ID
   * jika kamu sudah punya akun AdSense (atau jaringan lain).
   *
   * Penting: hanya tempel kode iklan dari penyedia resmi yang kamu
   * kendalikan. Jangan tempel kode dari sumber tidak dikenal.
   */
  ads: {
    enabled: false,
    provider: "adsense", // "adsense" | "custom" | "none"
    // Untuk Google AdSense:
    adsenseClient: "", // contoh: "ca-pub-1234567890123456"
    // Slot ID per posisi (kosongkan untuk skip posisi tersebut)
    slots: {
      header: "",     // banner atas
      sidebar: "",    // sidebar vertical
      inGrid: "",     // slot di tengah grid
      footer: "",     // banner bawah
    },
    // Jika provider === "custom", tempel HTML/script iklan kamu di sini
    customHtml: {
      header: "",
      sidebar: "",
      inGrid: "",
      footer: "",
    },
  },

  /**
   * --- ANALYTICS ---
   * Hanya isi jika kamu punya akun analytics sendiri.
   */
  analytics: {
    enabled: false,
    provider: "ga4", // "ga4" | "plausible" | "umami" | "none"
    // Google Analytics 4
    ga4MeasurementId: "", // contoh: "G-XXXXXXXXXX"
    // Plausible (self-hosted atau cloud)
    plausibleDomain: "",
    plausibleSrc: "https://plausible.io/js/script.js",
    // Umami
    umamiWebsiteId: "",
    umamiSrc: "",
  },

  /**
   * --- SOURCES DATA ---
   * Lokasi file JSON berisi struktur folder & file.
   * Bisa relatif terhadap basePath atau URL absolut.
   */
  data: {
    source: "data/content.json",
    // Set true jika kamu ingin fetch data dari API eksternal
    // (isi externalUrl di bawah)
    useExternal: false,
    externalUrl: "",
  },

  /**
   * --- FEATURES ---
   */
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
    showViewCount: false, // butuh backend; statis = fake random
  },
};
