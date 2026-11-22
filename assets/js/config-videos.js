/**
 * ============================================================
 *  MYDRIVE VIDEO CONFIGURATION
 *  ============================================================
 *  Edit file ini untuk mengatur SEMUA hal tentang folder & video kamu.
 *  Tidak perlu buka file lain.
 *
 *  Cara pakai:
 *  1. Tambah/hapus folder di `subfolders` array
 *  2. Paste video CDN URLs di `videos` array (akan dibagi merata otomatis)
 *  3. Set smartlink, histats, popup, telegram di bawah
 *  4. Save — perubahan langsung efektif
 * ============================================================
 */
window.MYDRIVE_VIDEOS = {
  /**
   * Nama folder root (folder utama yang berisi semua subfolder)
   */
  rootFolder: "X",

  /**
   * Daftar nama subfolder.
   * Tambah/hapus sesuka hati — video akan dibagi merata ke semua folder ini.
   */
  subfolders: [
    "Animations", "Backups", "Contracts", "Datasets", "eBooks",
    "Fonts", "Graphics", "HTML Templates", "Icons", "JavaScript",
    "Keynote", "Logos", "Mockups", "Notes", "Old Projects",
    "Photos", "QR Codes", "Recordings", "Screenshots", "Templates",
    "UI Kits", "Videos", "Wallpapers", "XML Files", "Yearly Archives",
    "ZIP Archives",
  ],

  /**
   * Daftar URL video CDN.
   * Paste semua URL di sini — sistem akan membaginya merata ke subfolder di atas.
   * Duplicate otomatis dihapus.
   */
  videos: [
    "https://cdn2.videy.co/mNm6C5Nl1.mp4",
    "https://cdn2.videy.co/tDNpffHO1.mp4",
    "https://cdn2.videy.co/Qa0rUIEP1.mp4",
    "https://cdn2.videy.co/YmqfKoW61.mp4",
    "https://cdn2.videy.co/yJErTZv0.mp4",
    "https://cdn2.videy.co/l3LPWkpa1.mp4",
    "https://cdn2.videy.co/kgWIiZ0l1.mp4",
    "https://cdn2.videy.co/HJmhtue11.mp4",
    "https://cdn2.videy.co/Pc2mHCsJ1.mp4",
    "https://cdn2.videy.co/QbHdQrNn1.mp4",
    "https://cdn2.videy.co/ILmlzg1n1.mp4",
    "https://cdn2.videy.co/B2UvObyk1.mp4",
    "https://cdn2.videy.co/yky8T94K1.mp4",
    "https://cdn2.videy.co/82RWLl9y1.mp4",
    "https://cdn2.videy.co/C3OjHylr1.mp4",
    "https://cdn2.videy.co/kPL9gQEb1.mp4",
    "https://cdn2.videy.co/4i8GfQLP1.mp4",
    "https://cdn2.videy.co/NSl7f8hT1.mp4",
    "https://cdn2.videy.co/rAEyQV4T1.mp4",
    "https://cdn2.videy.co/RlpxU0OS1.mp4",
    "https://cdn2.videy.co/P6a4IaIM1.mp4",
    "https://cdn2.videy.co/q3Wx0eF41.mp4",
    "https://cdn2.videy.co/6YDn3gfd1.mp4",
    "https://cdn2.videy.co/YdMzaolp1.mp4",
    "https://cdn2.videy.co/yD5r6S4R1.mp4",
    "https://cdn2.videy.co/K4hkUqqG1.mp4",
    "https://cdn2.videy.co/P3r6X26w1.mp4",
    "https://cdn2.videy.co/yl8IsfuI1.mp4",
    "https://cdn2.videy.co/xB6TAYO31.mp4",
    "https://cdn2.videy.co/V9C5Tdga1.mp4",
    "https://cdn2.videy.co/XOHnpqGB.mp4",
    "https://cdn2.videy.co/zEdLA3Nb1.mp4",
    "https://cdn2.videy.co/xzCfVf0E1.mp4",
    "https://cdn2.videy.co/WLvA1nuL1.mp4",
    "https://cdn2.videy.co/pAa6Se4V1.mp4",
    "https://cdn2.videy.co/eoWXOnsx1.mp4",
    "https://cdn2.videy.co/78TkHGUU1.mp4",
    "https://cdn2.videy.co/QKCmiDbt1.mp4",
    "https://cdn2.videy.co/iTziz4zc1.mp4",
    "https://cdn2.videy.co/AdD9ysau1.mp4",
    "https://cdn2.videy.co/a6m35z391.mp4",
    "https://cdn2.videy.co/5GYKifwb1.mp4",
    "https://cdn2.videy.co/NVsXTz381.mp4",
    "https://cdn2.videy.co/czg88WRc1.mp4",
    "https://cdn2.videy.co/IEzRPVfU1.mp4",
    "https://cdn2.videy.co/IV4zI0IG1.mp4",
    "https://cdn2.videy.co/3mf53Q151.mp4",
    "https://cdn2.videy.co/7d9dOIaT1.mp4",
    "https://cdn2.videy.co/vcqay9SL1.mp4",
    "https://cdn2.videy.co/y7bdfT001.mp4",
    "https://cdn2.videy.co/oRxwaYNL1.mp4",
    "https://cdn2.videy.co/DEpu9pvp1.mp4",
    "https://cdn2.videy.co/HylDVJSv1.mp4",
    "https://cdn2.videy.co/JldHg8Oo1.mp4",
    "https://cdn2.videy.co/jyvCescK1.mp4",
    "https://cdn2.videy.co/6Yz0PmlR.mp4",
    "https://cdn2.videy.co/TIWYKfPf1.mp4",
    "https://cdn2.videy.co/G6cppOxx1.mp4",
    "https://cdn2.videy.co/ukDwXH21.mp4",
    "https://cdn2.videy.co/DXnrCaQg1.mp4",
    "https://cdn2.videy.co/nGkpVGef.mp4",
    "https://cdn2.videy.co/gOFQVbwy1.mp4",
    "https://cdn2.videy.co/Ntk32jlf1.mp4",
    "https://cdn2.videy.co/0ghMdHzS1.mp4",
    "https://cdn2.videy.co/THtWC0Px1.mp4",
    "https://cdn2.videy.co/Z99gqkNN1.mp4",
    "https://cdn2.videy.co/8LlufKIX1.mp4",
    "https://cdn2.videy.co/BF6EGCiB1.mp4",
    "https://cdn2.videy.co/AXEjZvtL1.mp4",
    "https://cdn2.videy.co/nLbrdf421.mp4",
    "https://cdn2.videy.co/MRhqq0yj1.mp4",
    "https://cdn2.videy.co/fAyqNygS1.mp4",
    "https://cdn2.videy.co/kC6kWn1Z1.mp4",
    "https://cdn2.videy.co/6vutFzRC1.mp4",
    "https://cdn2.videy.co/bJ5Ec3U51.mp4",
    "https://cdn2.videy.co/8Dnb5fNN1.mp4",
    "https://cdn2.videy.co/1QxoCPLa1.mp4",
    "https://cdn2.videy.co/guwLIk2p1.mp4",
    "https://cdn2.videy.co/25kZwJrI1.mp4",
    "https://cdn2.videy.co/D1tErm7k1.mp4",
    "https://cdn2.videy.co/bjPB1Goc.mp4",
    "https://cdn2.videy.co/DuVqPkgQ1.mp4",
    "https://cdn2.videy.co/GLsZFlT01.mp4",
    "https://cdn2.videy.co/O7GYh8QR1.mp4",
    "https://cdn2.videy.co/RoN39b1p1.mp4",
    "https://cdn2.videy.co/HPDUaYee1.mp4",
    "https://cdn2.videy.co/CDU4kTix1.mp4",
    "https://cdn2.videy.co/7mBSmdG71.mp4",
    "https://cdn2.videy.co/E2vDJM5x.mp4",
    "https://cdn2.videy.co/gfR65QRK1.mp4",
    "https://cdn2.videy.co/0qw7ypD71.mp4",
    "https://cdn2.videy.co/RvrOwbbk1.mp4",
    "https://cdn2.videy.co/94ef89eu1.mp4",
    "https://cdn2.videy.co/fVax6Bg21.mp4",
    "https://cdn2.videy.co/KgINLJfF1.mp4",
    "https://cdn2.videy.co/LkxdBNui1.mp4",
    "https://cdn2.videy.co/y3kREXM1.mp4",
    "https://cdn2.videy.co/YUuq4x181.mp4",
    "https://cdn2.videy.co/B19xCWuz1.mp4",
    "https://cdn2.videy.co/EgdSBAmK1.mp4",
    "https://cdn2.videy.co/bft7BaGC1.mp4",
    "https://cdn2.videy.co/EpVb64CA1.mp4",
    "https://cdn2.videy.co/kSCfwciP1.mp4",
    "https://cdn2.videy.co/xy5uLswc1.mp4",
    "https://cdn2.videy.co/ia7e8jgt1.mp4",
    "https://cdn2.videy.co/XK2Nv5lo1.mp4",
    "https://cdn2.videy.co/DKSoRI1E1.mp4",
    "https://cdn2.videy.co/ntuXIc0t1.mp4",
    "https://cdn2.videy.co/4jZQY3RI1.mp4",
    "https://cdn2.videy.co/46dofPHs1.mp4",
    "https://cdn2.videy.co/yCmuEDip1.mp4",
    "https://cdn2.videy.co/8hhFrl001.mp4",
    "https://cdn2.videy.co/qWMPd8ff1.mp4",
    "https://cdn2.videy.co/JTQkArz11.mp4",
    "https://cdn2.videy.co/0GF1GZRI1.mp4",
    "https://cdn2.videy.co/CFpDgQqK1.mp4",
    "https://cdn2.videy.co/YwTRKPAn1.mp4",
    "https://cdn2.videy.co/Khc8SY3f1.mp4",
    "https://cdn2.videy.co/9CS9ZOsD1.mp4",
    "https://cdn2.videy.co/hcPrCM2b1.mp4",
    "https://cdn2.videy.co/7DpONMVb1.mp4",
    "https://cdn2.videy.co/pbUGQ5zf1.mp4",
    "https://cdn2.videy.co/aY4IkPpJ1.mp4",
    "https://cdn2.videy.co/HxwS85gC1.mp4",
    "https://cdn2.videy.co/Z7jszZr51.mp4",
    "https://cdn2.videy.co/gdUy3hRH1.mp4",
    "https://cdn2.videy.co/1pM9ffXS1.mp4",
    "https://cdn2.videy.co/G1zWb70X.mp4",
    "https://cdn2.videy.co/uA6fzSnP1.mp4",
    "https://cdn2.videy.co/xu4e3syw1.mp4",
    "https://cdn2.videy.co/jXBXMxPm1.mp4",
    "https://cdn2.videy.co/Zr9qjAeo1.mp4",
    "https://cdn2.videy.co/FO0kuavP1.mp4",
    "https://cdn2.videy.co/MbSP20xE1.mp4",
    "https://cdn2.videy.co/0GT7mgGl1.mp4",
    "https://cdn2.videy.co/uA1No9ik1.mp4",
    "https://cdn2.videy.co/PnHM3WdD1.mp4",
  ],

  /**
   * --- VIDEO PLAYER FEATURES ---
   */

  // Smartlink untuk Continue button (auto-pause). Dibuka 2x saat video dipause random.
  smartlink: "https://uplcm.com/4/12318889",

  // Auto-pause: video akan dipause 2x di waktu random, muncul Continue button
  autoPause: {
    enabled: true,
    count: 2, // berapa kali pause
  },

  /**
   * --- ADS & TRACKING (hanya di video player page) ---
   */

  // Popup ad dari montag (zone 12318898)
  popupAd: {
    enabled: true,
    zone: "12318898",
    src: "https://al5sm.com/tag.min.js",
  },

  // Histats tracking
  histats: {
    enabled: true,
    id: "5053132",
  },

  /**
   * --- SOCIAL MEDIA (floating button, semua page) ---
   */

  // Telegram floating button
  telegram: {
    enabled: true,
    url: "https://t.me/yourchannel", // GANTI dengan URL Telegram kamu
    text: "Join Private",
  },

  /**
   * --- DATABASE (Supabase) ---
   * Untuk manage folder & video via database (bukan edit file config).
   *
   * CARA SETUP:
   * 1. Daftar gratis di https://supabase.com
   * 2. Buat project baru
   * 3. Buka SQL Editor, jalankan SQL di bawah ini:
   *
   *    CREATE TABLE folders (
   *      id TEXT PRIMARY KEY,
   *      name TEXT NOT NULL,
   *      parent_id TEXT,
   *      sort_order INTEGER DEFAULT 0,
   *      created_at TIMESTAMPTZ DEFAULT NOW()
   *    );
   *    CREATE TABLE videos (
   *      id TEXT PRIMARY KEY,
   *      folder_id TEXT NOT NULL,
   *      name TEXT,
   *      url TEXT NOT NULL,
   *      sort_order INTEGER DEFAULT 0,
   *      created_at TIMESTAMPTZ DEFAULT NOW()
   *    );
   *    ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
   *    ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
   *    GRANT ALL ON folders TO authenticated;
   *    GRANT ALL ON videos TO authenticated;
   *    GRANT SELECT ON folders TO anon;
   *    GRANT SELECT ON videos TO anon;
   *    CREATE POLICY "Public read folders" ON folders FOR SELECT TO anon, authenticated USING (true);
   *    CREATE POLICY "Public read videos" ON videos FOR SELECT TO anon, authenticated USING (true);
   *    CREATE POLICY "Admin all folders" ON folders FOR ALL TO authenticated USING (true) WITH CHECK (true);
   *    CREATE POLICY "Admin all videos" ON videos FOR ALL TO authenticated USING (true) WITH CHECK (true);
   *
   *    -- Settings table (for dashboard settings page)
   *    CREATE TABLE settings (
   *      key TEXT PRIMARY KEY,
   *      value TEXT,
   *      updated_at TIMESTAMPTZ DEFAULT NOW()
   *    );
   *    ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
   *    GRANT ALL ON settings TO authenticated;
   *    GRANT SELECT ON settings TO anon;
   *    CREATE POLICY "Public read settings" ON settings FOR SELECT TO anon, authenticated USING (true);
   *    CREATE POLICY "Admin all settings" ON settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
   *
   * 4. Buka Settings > API, copy Project URL dan anon key
   * 5. Paste di bawah ini, set enabled: true
   * 6. Buka /admin.html untuk login & manage folder/video
   *    (Buat user admin di Supabase > Authentication > Users)
   */
  supabase: {
    enabled: true,
    url: "https://htkqdehhpamlyiowopsz.supabase.co",
    anonKey: "sb_publishable_tEGT-0NvFRTH83fXNImb6w_HNJwG8zc",
    encoded: false,
  },

  /**
   * --- DATABASE TYPE ---
   * Pilih salah satu: "supabase" | "mysql" | "config"
   *
   * "supabase" → pakai Supabase REST API (di atas)
   * "mysql"    → pakai PHP API di shared hosting (api.php)
   * "config"   → pakai data static dari config-videos.js (no database)
   */
  databaseType: "supabase", // GANTI ke "mysql" kalau pakai shared hosting

  /**
   * --- MYSQL / SHARED HOSTING API ---
   * Kalau databaseType = "mysql", set URL ke api.php kamu
   */
  mysql: {
    apiUrl: "http://gitplay.test/api.php", // URL ke api.php di hosting kamu
  },
};
