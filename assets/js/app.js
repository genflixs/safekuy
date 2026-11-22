/* ============================================================
   MyDrive - App Logic (vanilla JS, no dependencies)
   ============================================================
   Features:
   - Hash-based router (works on GitHub Pages without config)
   - 3 views: root folder list, subfolder file grid, file detail
   - Client-side search, sort, pagination
   - Dark/light theme with localStorage persistence
   - Lazy loading images via IntersectionObserver
   - Dynamic SEO meta update per page
   - Optional ad/analytics injection from config
   ============================================================ */

(function () {
  'use strict';

  // ---------- State ----------
  const state = {
    data: null,           // full content.json
    currentFolder: null,  // folder object currently being viewed
    currentFile: null,    // file object currently being viewed
    currentPage: 1,
    searchQuery: '',
    sortBy: 'default',
    config: null,
  };

  // ---------- DOM refs ----------
  const $ = (sel) => document.querySelector(sel);
  const els = {
    app: $('#app'),
    brandName: $('#brandName'),
    brandTagline: $('#brandTagline'),
    brandMark: $('#brandMark'),
    footerText: $('#footerText'),
    searchBox: $('#searchBox'),
    searchInput: $('#searchInput'),
    searchClear: $('#searchClear'),
    sortBox: $('#sortBox'),
    sortSelect: $('#sortSelect'),
    themeToggle: $('#themeToggle'),
    breadcrumb: $('#breadcrumb'),
    breadcrumbList: $('#breadcrumbList'),
    adHeader: $('#adHeader'),
    adFooter: $('#adFooter'),
    topbar: $('#topbar'),
  };

  // ---------- Tree helpers (recursive, for nested folders) ----------
  const tree = {
    /** Find a folder by id anywhere in the tree. Returns the folder object or null. */
    findFolder(id, folders) {
      folders = folders || (state.data && state.data.folders) || [];
      for (const f of folders) {
        if (f.id === id) return f;
        if (f.subfolders && f.subfolders.length) {
          const found = tree.findFolder(id, f.subfolders);
          if (found) return found;
        }
      }
      return null;
    },

    /** Find a ROOT folder by slug (slugified name). Returns the folder object or null. */
    findRootBySlug(slug, folders) {
      folders = folders || (state.data && state.data.folders) || [];
      return folders.find(f => utils.slugify(f.name) === slug) || null;
    },

    /** Find a SUBFOLDER by slug within a parent folder. */
    findSubBySlug(slug, parentFolder) {
      if (!parentFolder || !parentFolder.subfolders) return null;
      return parentFolder.subfolders.find(f => utils.slugify(f.name) === slug) || null;
    },

    /** Find a file by short ID (6-char hash of file.id) anywhere in the tree. */
    findFileByShortId(shortId, folders) {
      folders = folders || (state.data && state.data.folders) || [];
      for (const f of folders) {
        const file = (f.files || []).find(x => utils.shortId(x.id) === shortId);
        if (file) return { file, parentFolder: f };
        if (f.subfolders && f.subfolders.length) {
          const result = tree.findFileByShortId(shortId, f.subfolders);
          if (result) return result;
        }
      }
      return null;
    },

    /** Find a file by id anywhere in the tree. Returns { file, parentFolder } or null. */
    findFile(id, folders) {
      folders = folders || (state.data && state.data.folders) || [];
      for (const f of folders) {
        const file = (f.files || []).find(x => x.id === id);
        if (file) return { file, parentFolder: f };
        if (f.subfolders && f.subfolders.length) {
          const result = tree.findFile(id, f.subfolders);
          if (result) return result;
        }
      }
      return null;
    },

    /** Build breadcrumb path from root to a folder. Returns array of folder objects. */
    pathToFolder(id, folders, acc) {
      folders = folders || (state.data && state.data.folders) || [];
      acc = acc || [];
      for (const f of folders) {
        if (f.id === id) return [...acc, f];
        if (f.subfolders && f.subfolders.length) {
          const result = tree.pathToFolder(id, f.subfolders, [...acc, f]);
          if (result) return result;
        }
      }
      return null;
    },

    /** Flatten all folders (top-level + nested) into a single array. */
    allFolders(folders, acc) {
      folders = folders || (state.data && state.data.folders) || [];
      acc = acc || [];
      for (const f of folders) {
        acc.push(f);
        if (f.subfolders && f.subfolders.length) {
          tree.allFolders(f.subfolders, acc);
        }
      }
      return acc;
    },
  };

  // ---------- Utility ----------
  const utils = {
    /** Resolve URL against base path (for GitHub Pages subpath) */
    resolve(path) {
      const base = state.config.basePath || '/';
      if (!path) return base;
      if (path.startsWith('http')) return path;
      if (path.startsWith('/')) return base.replace(/\/$/, '') + path;
      return base + path;
    },

    /** Escape HTML */
    esc(str) {
      if (str == null) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    /** Convert folder name to URL-friendly slug (lowercase, hyphenated) */
    slugify(name) {
      if (!name) return '';
      return name.toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    },

    /** Generate 8-char short ID from a longer ID (for video URLs) */
    shortId(id) {
      if (!id) return '';
      // If already short (<=8 chars), use as-is
      if (id.length <= 8) return id;
      // Hash to 8 chars
      let hash = 5381;
      for (let i = 0; i < id.length; i++) {
        hash = ((hash << 5) + hash) + id.charCodeAt(i);
      }
      return (hash >>> 0).toString(36).slice(0, 8);
    },

    /** Format file size for display */
    formatSize(bytes) {
      if (!bytes) return '-';
      const units = ['B', 'KB', 'MB', 'GB', 'TB'];
      let i = 0;
      let n = bytes;
      while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
      return n.toFixed(n < 10 && i > 0 ? 1 : 0) + ' ' + units[i];
    },

    /** Format number with thousand separator */
    formatNum(n) {
      if (n == null) return '-';
      return Number(n).toLocaleString('id-ID');
    },

    /** Format date relative or absolute */
    formatDate(date) {
      if (!date) return '';
      try {
        const d = new Date(date);
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
      } catch {
        return date;
      }
    },

    /** Get icon emoji for file type */
    fileIcon(type) {
      const map = {
        image: '🖼️',
        video: '🎬',
        audio: '🎵',
        document: '📄',
        archive: '📦',
        default: '📄',
      };
      return map[type] || map.default;
    },

    /** Get icon for folder */
    folderIcon(icon) {
      const map = {
        nature: '🌿',
        code: '💻',
        palette: '🎨',
        music: '🎵',
        document: '📚',
        image: '🖼️',
        default: '📁',
      };
      return map[icon] || map.default;
    },

    /** Debounce */
    debounce(fn, ms) {
      let t;
      return function (...args) {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), ms);
      };
    },

    /** Show toast */
    toast(msg) {
      let t = $('.toast');
      if (!t) {
        t = document.createElement('div');
        t.className = 'toast';
        document.body.appendChild(t);
      }
      t.textContent = msg;
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 2200);
    },
  };

  // ---------- Config Loader ----------
  function loadConfig() {
    if (!window.SITE_CONFIG) {
      console.error('[MyDrive] SITE_CONFIG tidak ditemukan. Pastikan config.js dimuat.');
      return null;
    }
    state.config = window.SITE_CONFIG;
    return state.config;
  }

  // ---------- Data Generation (reads from config-videos.js) ----------
  /**
   * Generate data structure from window.MYDRIVE_VIDEOS.
   * Uses deterministic hash IDs so URLs are stable across page reloads.
   */
  function hashId(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
    }
    return (hash >>> 0).toString(36).slice(0, 5);
  }

  function generateData() {
    const vcfg = window.MYDRIVE_VIDEOS;
    if (!vcfg) {
      console.error('[MyDrive] MYDRIVE_VIDEOS tidak ditemukan. Pastikan config-videos.js dimuat.');
      return null;
    }

    const rootName = vcfg.rootFolder || 'X';
    const subfolderNames = vcfg.subfolders || [];
    let videoUrls = vcfg.videos || [];

    // Deduplicate video URLs (preserve order)
    const seen = new Set();
    videoUrls = videoUrls.filter(url => {
      if (seen.has(url)) return false;
      seen.add(url);
      return true;
    });

    // Distribute videos evenly across subfolders
    const n = subfolderNames.length;
    const perFolder = Math.floor(videoUrls.length / n);
    const extra = videoUrls.length % n;

    const subfolders = [];
    let idx = 0;
    for (let i = 0; i < n; i++) {
      const count = perFolder + (i < extra ? 1 : 0);
      const folderVideos = [];
      for (let j = 0; j < count && idx < videoUrls.length; j++) {
        const url = videoUrls[idx++];
        const filename = url.split('/').pop();
        folderVideos.push({
          id: hashId(url),
          name: filename,
          type: 'video',
          thumbnail: url, // Use video URL itself — <video> element will show first frame
          url: url,
          size: '',
          date: '2026-01-20',
          views: Math.floor(Math.abs(hashId(url + 'views')) % 50000) + 100,
        });
      }
      subfolders.push({
        id: hashId(subfolderNames[i] + '_folder'),
        name: subfolderNames[i],
        icon: 'default',
        color: '#fe6081',
        createdAt: '2026-01-20',
        files: folderVideos,
      });
    }

    return {
      meta: {
        version: '4.0.0',
        totalFolders: 1,
        totalSubfolders: n,
        totalFiles: videoUrls.length,
      },
      folders: [{
        id: 'x', // Root folder ID is always 'x' so URL /f/x works
        name: rootName,
        icon: 'default',
        color: '#fe6081',
        createdAt: '2026-01-20',
        files: [],
        subfolders: subfolders,
      }],
    };
  }

  async function loadData() {
    const vcfg = window.MYDRIVE_VIDEOS || {};
    const dbType = vcfg.databaseType || 'config';

    // MySQL / Shared Hosting (PHP API)
    if (dbType === 'mysql' && vcfg.mysql && vcfg.mysql.apiUrl) {
      try {
        const data = await loadFromMySQL(vcfg.mysql.apiUrl);
        if (data) {
          console.log('[MyDrive] Data loaded from MySQL API');
          return data;
        }
      } catch (err) {
        console.warn('[MyDrive] MySQL load failed, falling back:', err);
      }
    }

    // Supabase
    if (dbType === 'supabase') {
      let supaCfg = vcfg.supabase;
      if (supaCfg && supaCfg.encoded) {
        supaCfg = {
          enabled: supaCfg.enabled,
          url: atob(supaCfg.url),
          anonKey: atob(supaCfg.anonKey),
        };
      }
      if (supaCfg && supaCfg.enabled && supaCfg.url && supaCfg.anonKey) {
        try {
          await loadSettingsFromSupabase(supaCfg);
          const data = await loadFromSupabase(supaCfg);
          if (data) {
            console.log('[MyDrive] Data loaded from Supabase');
            return data;
          }
        } catch (err) {
          console.warn('[MyDrive] Supabase load failed, falling back:', err);
        }
      }
    }

    // Fallback: generate from config-videos.js
    return generateData();
  }

  // ---------- MySQL API Loader ----------
  async function loadFromMySQL(apiUrl) {
    const res = await fetch(`${apiUrl}?action=data`);
    if (!res.ok) throw new Error('MySQL API error: ' + res.status);
    const dbData = await res.json();
    if (!dbData || !dbData.folders) return null;

    // Apply settings from MySQL (override config-videos.js)
    if (dbData.settings) {
      applyDbSettings(dbData.settings);
    }

    // Build tree structure from flat DB data
    const dbFolders = dbData.folders || [];
    const dbVideos = dbData.videos || [];

    const rootFolders = dbFolders
      .filter(f => !f.parent_id)
      .map(f => buildMySQLFolderTree(f, dbFolders, dbVideos));

    return {
      meta: {
        version: '6.0.0',
        totalFolders: rootFolders.length,
        totalFiles: dbVideos.length,
      },
      folders: rootFolders,
    };
  }

  function buildMySQLFolderTree(folder, allFolders, allVideos) {
    const childFolders = allFolders
      .filter(f => f.parent_id === folder.id)
      .map(f => buildMySQLFolderTree(f, allFolders, allVideos));

    const files = allVideos
      .filter(v => v.folder_id === folder.id)
      .map(v => ({
        id: v.id,
        name: v.name || v.url.split('/').pop(),
        type: 'video',
        thumbnail: v.url,
        url: v.url,
        size: '',
        date: v.created_at ? v.created_at.slice(0, 10) : '',
        views: 0,
      }));

    return {
      id: folder.id,
      name: folder.name,
      icon: 'default',
      color: '#fe6081',
      createdAt: folder.created_at ? folder.created_at.slice(0, 10) : '',
      files: files,
      subfolders: childFolders,
    };
  }

  function applyDbSettings(settings) {
    const vcfg = window.MYDRIVE_VIDEOS;
    if (!vcfg) return;
    if (settings.site_name) vcfg.rootFolder = settings.site_name;
    if (settings.smartlink) vcfg.smartlink = settings.smartlink;
    if (settings.telegram_url) vcfg.telegram.url = settings.telegram_url;
    if (settings.telegram_text) vcfg.telegram.text = settings.telegram_text;
    if (settings.telegram_enabled !== undefined) vcfg.telegram.enabled = settings.telegram_enabled === 'true';
    if (settings.popup_ad_zone) vcfg.popupAd.zone = settings.popup_ad_zone;
    if (settings.popup_ad_src) vcfg.popupAd.src = settings.popup_ad_src;
    if (settings.popup_ad_enabled !== undefined) vcfg.popupAd.enabled = settings.popup_ad_enabled === 'true';
    if (settings.histats_id) vcfg.histats.id = settings.histats_id;
    if (settings.histats_enabled !== undefined) vcfg.histats.enabled = settings.histats_enabled === 'true';
    if (settings.auto_pause_count) vcfg.autoPause.count = parseInt(settings.auto_pause_count, 10) || 2;
    if (settings.auto_pause_enabled !== undefined) vcfg.autoPause.enabled = settings.auto_pause_enabled === 'true';
  }

  // ---------- Settings Loader (from Supabase) ----------
  async function loadSettingsFromSupabase(cfg) {
    try {
      const res = await fetch(`${cfg.url}/rest/v1/settings?select=key,value`, {
        headers: { apikey: cfg.anonKey, Authorization: `Bearer ${cfg.anonKey}` },
      });
      if (!res.ok) return;
      const rows = await res.json();
      if (!rows || !rows.length) return;

      // Build settings map
      const settings = {};
      rows.forEach(r => { settings[r.key] = r.value; });

      // Override MYDRIVE_VIDEOS with database values
      const vcfg = window.MYDRIVE_VIDEOS;
      if (!vcfg) return;

      if (settings.site_name) vcfg.rootFolder = settings.site_name;
      if (settings.smartlink) vcfg.smartlink = settings.smartlink;
      if (settings.telegram_url) vcfg.telegram.url = settings.telegram_url;
      if (settings.telegram_text) vcfg.telegram.text = settings.telegram_text;
      if (settings.telegram_enabled !== undefined) vcfg.telegram.enabled = settings.telegram_enabled === 'true';
      if (settings.popup_ad_zone) vcfg.popupAd.zone = settings.popup_ad_zone;
      if (settings.popup_ad_src) vcfg.popupAd.src = settings.popup_ad_src;
      if (settings.popup_ad_enabled !== undefined) vcfg.popupAd.enabled = settings.popup_ad_enabled === 'true';
      if (settings.histats_id) vcfg.histats.id = settings.histats_id;
      if (settings.histats_enabled !== undefined) vcfg.histats.enabled = settings.histats_enabled === 'true';
      if (settings.auto_pause_count) vcfg.autoPause.count = parseInt(settings.auto_pause_count, 10) || 2;
      if (settings.auto_pause_enabled !== undefined) vcfg.autoPause.enabled = settings.auto_pause_enabled === 'true';

      console.log('[MyDrive] Settings loaded from Supabase');
    } catch (err) {
      console.warn('[MyDrive] Settings load failed:', err);
    }
  }

  // ---------- Supabase Loader ----------
  async function loadFromSupabase(cfg) {
    const headers = {
      apikey: cfg.anonKey,
      Authorization: `Bearer ${cfg.anonKey}`,
    };

    // Fetch folders and videos in parallel
    const [foldersRes, videosRes] = await Promise.all([
      fetch(`${cfg.url}/rest/v1/folders?order=sort_order.asc`, { headers }),
      fetch(`${cfg.url}/rest/v1/videos?order=sort_order.asc`, { headers }),
    ]);

    if (!foldersRes.ok || !videosRes.ok) {
      throw new Error('Supabase API error');
    }

    const dbFolders = await foldersRes.json();
    const dbVideos = await videosRes.json();

    // Build tree structure
    // Find root folders (parent_id is null or empty)
    const rootFolders = dbFolders
      .filter(f => !f.parent_id)
      .map(f => buildFolderTree(f, dbFolders, dbVideos));

    return {
      meta: {
        version: '5.0.0',
        totalFolders: rootFolders.length,
        totalFiles: dbVideos.length,
      },
      folders: rootFolders,
    };
  }

  function buildFolderTree(folder, allFolders, allVideos) {
    const childFolders = allFolders
      .filter(f => f.parent_id === folder.id)
      .map(f => buildFolderTree(f, allFolders, allVideos));

    const files = allVideos
      .filter(v => v.folder_id === folder.id)
      .map(v => ({
        id: v.id,
        name: v.name || v.url.split('/').pop(),
        type: 'video',
        thumbnail: v.url, // <video> element will show first frame
        url: v.url,
        size: '',
        date: v.created_at ? v.created_at.slice(0, 10) : '',
        views: 0,
      }));

    return {
      id: folder.id,
      name: folder.name,
      icon: 'default',
      color: '#fe6081',
      createdAt: folder.created_at ? folder.created_at.slice(0, 10) : '',
      files: files,
      subfolders: childFolders,
    };
  }

  // ---------- Theme Manager ----------
  const theme = {
    init() {
      const cfg = state.config.theme;
      if (!cfg.showToggle) {
        els.themeToggle.hidden = true;
        return;
      }
      els.themeToggle.hidden = false;
      els.themeToggle.addEventListener('click', () => this.toggle());

      // Determine initial theme
      let mode = cfg.defaultMode;
      const saved = localStorage.getItem('mydrive-theme');
      if (saved) mode = saved;
      else if (mode === 'auto') {
        mode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      this.apply(mode);
    },

    apply(mode) {
      document.documentElement.setAttribute('data-theme', mode);
      const meta = $('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', mode === 'dark' ? '#06060a' : '#f5f5f9');
    },

    toggle() {
      const cur = document.documentElement.getAttribute('data-theme');
      const next = cur === 'dark' ? 'light' : 'dark';
      this.apply(next);
      localStorage.setItem('mydrive-theme', next);
    },
  };

  // ---------- Router (path-based: /f/<id>, /f/<id>/<page>, /d/<id>) ----------
  const router = {
    init() {
      // Handle browser back/forward
      window.addEventListener('popstate', () => this.handle());

      // Handle _path query param (from 404.html redirect or parent page)
      const params = new URLSearchParams(window.location.search);
      const initialPath = params.get('_path');
      if (initialPath) {
        // Check if we're in an iframe (preview) or standalone (GitHub Pages)
        const inIframe = window.parent !== window;
        if (!inIframe) {
          // Standalone mode: clean up URL (replace ?_path=/x with /x)
          // This is safe — replaceState doesn't trigger a page reload
          try {
            history.replaceState({}, '', initialPath);
          } catch {}
        }
        // In iframe mode: keep /index.html?_path=... (prevents 404 on reload)
      }

      // Handle old sessionStorage redirect (backward compat)
      const redirect = sessionStorage.getItem('mydrive_redirect');
      if (redirect) {
        sessionStorage.removeItem('mydrive_redirect');
        try {
          const url = new URL(redirect);
          if (!window.location.search.includes('_path')) {
            history.replaceState({}, '', url.pathname + url.search);
          }
        } catch {}
      }

      // Handle internal link clicks (any <a href="/...">)
      document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href]');
        if (!link) return;
        const href = link.getAttribute('href');
        // Only intercept internal paths starting with / (not // or http)
        if (href && href.startsWith('/') && !href.startsWith('//')) {
          e.preventDefault();
          this.go(href);
        }
      });

      this.handle();
    },

    /** Get current path, normalized */
    currentPath() {
      // In preview (iframe): read from _path query param (URL stays /index.html)
      const params = new URLSearchParams(window.location.search);
      const pathParam = params.get('_path');
      if (pathParam) {
        return pathParam;
      }
      // Standalone mode: use actual pathname
      let path = window.location.pathname;
      const basePath = state.config.basePath || '/';
      if (basePath !== '/' && path.startsWith(basePath)) {
        path = path.slice(basePath.length - 1);
      }
      if (path === '/index.html' || path === '/index.html/') path = '/';
      return path;
    },

    parse() {
      const path = this.currentPath();
      // Patterns: /, /f/<id>, /f/<id>/<page>, /d/<id>
      const parts = path.split('/').filter(Boolean);
      return { parts };
    },

    handle() {
      const { parts } = this.parse();
      // Reserved routes
      if (parts.length === 0) {
        renderRoot();
      } else if (parts[0] === 'v') {
        // /v?id=<shortid> → video player
        const params = new URLSearchParams(window.location.search);
        const shortId = params.get('id');
        if (shortId) {
          const result = tree.findFileByShortId(shortId);
          if (result) {
            renderFile(result.file.id);
          } else {
            renderNotFound();
          }
        } else {
          renderNotFound();
        }
      } else if (parts.length === 1) {
        // /<folder-slug> → root folder view
        const folder = tree.findRootBySlug(parts[0]);
        if (folder) {
          renderFolder(folder.id);
        } else {
          renderNotFound();
        }
      } else if (parts.length === 2) {
        // /<root-slug>/<sub-slug> → subfolder view
        const rootFolder = tree.findRootBySlug(parts[0]);
        if (rootFolder) {
          const sub = tree.findSubBySlug(parts[1], rootFolder);
          if (sub) {
            renderFolder(sub.id);
          } else {
            renderNotFound();
          }
        } else {
          renderNotFound();
        }
      } else {
        renderNotFound();
      }
    },

    /** Navigate to a path using pushState (no page reload) */
    go(path) {
      // Check if we're in preview mode (iframe with _path param)
      const params = new URLSearchParams(window.location.search);
      const hasPathParam = params.has('_path');

      if (hasPathParam) {
        // Preview mode: update _path query param, keep pathname as /index.html
        // This prevents 404 on reload because iframe URL stays /index.html
        const newParams = new URLSearchParams();
        newParams.set('_path', path);
        history.pushState({}, '', '/index.html?' + newParams.toString());
      } else {
        // Standalone mode: update actual URL
        const basePath = state.config.basePath || '/';
        const full = basePath !== '/' ? basePath.replace(/\/$/, '') + path : path;
        history.pushState({}, '', full);
      }

      this.handle();
      // Notify parent frame of path change (for preview URL bar sync)
      notifyParent(path);
    },
  };

  /** Send current path to parent frame (for preview URL bar sync) */
  function notifyParent(cleanPath) {
    try {
      // Determine the clean path to send to parent
      let path = cleanPath;
      if (!path) {
        const params = new URLSearchParams(window.location.search);
        path = params.get('_path') || window.location.pathname + window.location.search;
      }
      window.parent?.postMessage({
        type: 'mydrive:pathchange',
        path: path,
        title: document.title,
      }, '*');
    } catch {}
  }

  // ---------- Breadcrumb ----------
  function renderBreadcrumb(items) {
    if (!state.config.features.breadcrumb || !items || items.length === 0) {
      els.breadcrumb.hidden = true;
      return;
    }
    els.breadcrumb.hidden = false;
    els.breadcrumbList.innerHTML = items.map((item, i) => {
      const isLast = i === items.length - 1;
      if (isLast) {
        return `<li><span class="current">${utils.esc(item.label)}</span></li>`;
      }
      return `<li><a href="${utils.esc(item.href)}">${utils.esc(item.label)}</a></li>`;
    }).join('');
  }

  /** Check if folder (or any nested subfolder/file) matches search query */
  function folderMatchesQuery(folder, q) {
    if ((folder.name || '').toLowerCase().includes(q)) return true;
    if ((folder.description || '').toLowerCase().includes(q)) return true;
    if ((folder.files || []).some(file => (file.name || '').toLowerCase().includes(q))) return true;
    if ((folder.subfolders || []).some(sub => folderMatchesQuery(sub, q))) return true;
    return false;
  }

  // ---------- Views ----------

  function renderRoot() {
    const cfg = state.config;
    const vcfg = window.MYDRIVE_VIDEOS || {};

    // Title
    const siteName = cfg.site.name || (window.location.hostname ? window.location.hostname.split('.')[0] : 'MyDrive');
    document.title = `${siteName} | Streaming HD Free`;

    // Breadcrumb hidden on landing page
    renderBreadcrumb([]);
    els.breadcrumb.hidden = true;

    // Home mode: center brand, hide search
    els.topbar.classList.add('home-mode');
    els.searchBox.hidden = true;
    els.sortBox.hidden = true;

    // Hero values
    const heroTitle = vcfg.hero_title || 'Stream. Watch. Enjoy.';
    const heroSubtitle = vcfg.hero_subtitle || 'HD video streaming, completely free. Watch premium content anytime, anywhere.';

    // Landing page (no folders shown — folders accessible via /x)
    els.app.innerHTML = `
      <section class="landing-hero">
        <div class="landing-hero-text">
          <h1 class="landing-hero-title">${utils.esc(heroTitle)}</h1>
          <p class="landing-hero-subtitle">${utils.esc(heroSubtitle)}</p>
          <a href="/x" class="landing-cta-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            Browse Content
          </a>
        </div>
        <div class="landing-hero-visual">
          <div class="landing-video-preview">
            <svg viewBox="0 0 24 24" fill="currentColor" style="width:48px;height:48px;color:rgba(255,255,255,0.9)"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
      </section>

      <section class="landing-features">
        <h2 class="landing-features-title">Made for viewers</h2>
        <div class="landing-features-grid">
          <div class="feature-card">
            <div class="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
            </div>
            <h3>HD Streaming</h3>
            <p>Watch all content in high definition quality, smooth playback on any connection.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <h3>Fast & Free</h3>
            <p>No registration required. Instant access to all content. Completely free forever.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            </div>
            <h3>Multi-Device</h3>
            <p>Works perfectly on desktop, tablet, and mobile. Stream anywhere, anytime.</p>
          </div>
        </div>
      </section>
    `;
  }

  function renderFolderCard(folder, parentSlug) {
    const fileCount = (folder.files || []).length;
    const subCount = (folder.subfolders || []).length;
    const color = folder.color || state.config.theme.primary;
    const icon = utils.folderIcon(folder.icon);

    let metaText;
    if (subCount > 0 && fileCount > 0) {
      metaText = `${subCount} folder · ${fileCount} file`;
    } else if (subCount > 0) {
      metaText = `${subCount} folder`;
    } else {
      metaText = `${fileCount} video`;
    }

    // Build href using folder name slugs (clean URLs)
    const slug = utils.slugify(folder.name);
    const href = parentSlug
      ? `/${parentSlug}/${slug}`
      : `/${slug}`;

    return `
      <a href="${href}" class="folder-card" style="--folder-color: ${utils.esc(color)}">
        <div class="folder-card-icon">${icon}</div>
        <div class="folder-card-body">
          <div class="folder-card-name">${utils.esc(folder.name)}</div>
          <div class="folder-card-meta">
            <span>${metaText}</span>
          </div>
        </div>
      </a>
    `;
  }

  function renderFolder(folderId, page) {
    // Use tree.findFolder to support nested folders
    const folder = tree.findFolder(folderId);
    if (!folder) {
      renderNotFound();
      return;
    }
    state.currentFolder = folder;
    state.currentPage = page || 1;

    const cfg = state.config;
    const allFiles = folder.files || [];
    const subfolders = folder.subfolders || [];

    // Remove home-mode (restore normal topbar with search + sort)
    els.topbar.classList.remove('home-mode');

    // Title: always use default site title (no folder/video name in browser tab)
    const siteName = cfg.site.name || (window.location.hostname ? window.location.hostname.split('.')[0] : 'MyDrive');
    document.title = `${siteName} | Streaming HD Free`;

    // Breadcrumb: build full path from root using tree.pathToFolder
    const path = tree.pathToFolder(folderId) || [folder];
    const crumbs = [{ label: cfg.site.name, href: '/' }];
    path.forEach((f, i) => {
      const isLast = i === path.length - 1;
      crumbs.push({ label: f.name, href: `/f/${f.id}`, current: isLast });
    });
    renderBreadcrumb(crumbs);

    // Search & sort enabled
    els.searchBox.hidden = !cfg.features.search;
    els.sortBox.hidden = !cfg.features.sort;

    // Filter files by search
    let files = allFiles;
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      files = files.filter(f => (f.name || '').toLowerCase().includes(q));
    }

    // Sort files
    files = sortFiles(files, state.sortBy);

    // Pagination
    const perPage = cfg.pagination.itemsPerPage;
    const totalPages = Math.max(1, Math.ceil(files.length / perPage));
    if (state.currentPage > totalPages) state.currentPage = totalPages;
    if (state.currentPage < 1) state.currentPage = 1;

    const start = (state.currentPage - 1) * perPage;
    const pageFiles = files.slice(start, start + perPage);

    // Render
    const parentPathFolder = path.length > 1 ? path[path.length - 2] : null;
    // Build back href using folder name slugs (clean URLs)
    const backHref = parentPathFolder
      ? (path.length > 2 ? `/${utils.slugify(path[0].name)}/${utils.slugify(parentPathFolder.name)}` : `/${utils.slugify(parentPathFolder.name)}`)
      : '/';
    const backLabel = parentPathFolder ? `Kembali ke ${utils.esc(parentPathFolder.name)}` : 'Kembali';

    let html = `
      <a href="${backHref}" class="back-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        ${backLabel}
      </a>
      <h2 class="section-title">
        <span>${utils.esc(folder.name)}</span>
        ${subfolders.length ? `<span class="count">${subfolders.length} folder</span>` : `<span class="count">${files.length} video</span>`}
      </h2>
    `;

    // --- Subfolders section (folder-row grid) ---
    if (subfolders.length > 0) {
      let visibleSubs = subfolders;
      if (state.searchQuery) {
        const q = state.searchQuery.toLowerCase();
        visibleSubs = subfolders.filter(f =>
          (f.name || '').toLowerCase().includes(q) ||
          (f.description || '').toLowerCase().includes(q) ||
          (f.files || []).some(file => (file.name || '').toLowerCase().includes(q))
        );
      }
      visibleSubs = sortFolders(visibleSubs, state.sortBy);

      if (visibleSubs.length > 0) {
        html += `
          <h3 class="section-title section-title-sub">
            <span>Folder</span>
            <span class="count">${visibleSubs.length} folder</span>
          </h3>
          <div class="folder-grid folder-grid-compact">
            ${visibleSubs.map(s => renderFolderCard(s, utils.slugify(folder.name))).join('')}
          </div>
        `;
      } else if (state.searchQuery) {
        html += `
          <h3 class="section-title section-title-sub">
            <span>Folder</span>
            <span class="count">0 folder</span>
          </h3>
          <div class="empty-state empty-state-inline">
            <div class="empty-state-icon">🔍</div>
            <div class="empty-state-text">Tidak ada subfolder untuk "<strong>${utils.esc(state.searchQuery)}</strong>"</div>
          </div>
        `;
      }
    }

    // --- Files section ---
    if (files.length === 0 && subfolders.length === 0) {
      const isSearching = !!state.searchQuery;
      html += `
        <div class="empty-state">
          <div class="empty-state-icon">${isSearching ? '🔍' : '📂'}</div>
          <div class="empty-state-title">${isSearching ? 'Tidak ada hasil' : 'Folder kosong'}</div>
          <div class="empty-state-text">${isSearching ? `Tidak ditemukan untuk "<strong>${utils.esc(state.searchQuery)}</strong>"` : 'Belum ada file atau subfolder di folder ini.'}</div>
        </div>
      `;
    } else if (files.length > 0) {
      html += `
        <h3 class="section-title section-title-sub">
          <span>File</span>
          <span class="count">${files.length} file</span>
        </h3>
        <div class="file-grid" id="fileGrid">${pageFiles.map(renderFileCard).join('')}</div>
      `;
      if (cfg.ads.enabled && cfg.ads.slots.inGrid) {
        // Will be injected post-render
      }
      if (totalPages > 1) {
        html += renderPagination(state.currentPage, totalPages, folderId);
      }
    } else if (subfolders.length > 0 && !state.searchQuery) {
      html += `<p class="muted-note">Folder ini hanya berisi subfolder, tidak ada file langsung.</p>`;
    }

    els.app.innerHTML = html;

    // Inject in-grid ad after render
    injectInGridAd();

    // Lazy-load images
    setupLazyLoad();
  }

  function renderFileCard(file) {
    const cfg = state.config;
    const vcfg = window.MYDRIVE_VIDEOS || {};
    const typeLabel = (file.type || 'file').toUpperCase();
    const showPlay = file.type === 'video';
    const showDuration = file.duration && (file.type === 'video' || file.type === 'audio');
    const showViews = cfg.features.showViewCount && file.views != null;
    const showSize = cfg.features.showFileSize && file.size;
    const showDate = cfg.features.showDate && file.date;

    const metaParts = [];
    if (showDuration) metaParts.push(`<span>${utils.esc(file.duration)}</span>`);
    if (showSize) metaParts.push(`<span>${utils.esc(file.size)}</span>`);
    if (showViews) metaParts.push(`<span>${utils.formatNum(file.views)} views</span>`);
    if (showDate) metaParts.push(`<span>${utils.formatDate(file.date)}</span>`);

    const lazy = cfg.features.lazyLoad ? 'loading="lazy"' : '';
    const fallback = utils.resolve('/assets/icons/favicon.svg');
    const hasThumb = !!(file.thumbnail && file.thumbnail.trim());
    const iconEmoji = utils.fileIcon(file.type);

    // Render placeholder icon behind image. When image loads successfully,
    // CSS `:has(img.loaded)` hides the placeholder.
    const placeholderHtml = `<div class="file-icon-placeholder" aria-hidden="true">${iconEmoji}</div>`;

    // For video files: use <video preload="metadata"> to show actual first frame as thumbnail
    // For other files: use <img>
    let mediaHtml = '';
    if (hasThumb) {
      if (file.type === 'video') {
        mediaHtml = `<video src="${utils.esc(file.thumbnail)}" muted preload="metadata" playsinline onloadeddata="this.classList.add('loaded')" onerror="this.onerror=null;this.classList.add('error')"></video>`;
      } else {
        mediaHtml = `<img ${lazy} src="${utils.esc(file.thumbnail)}" alt="${utils.esc(file.name)}" onerror="this.onerror=null;this.classList.add('error');this.removeAttribute('src');">`;
      }
    }

    return `
      <div class="file-card">
        <a href="/v?id=${utils.shortId(file.id)}" class="file-thumb-link">
          <div class="file-thumb">
            ${placeholderHtml}
            ${mediaHtml}
            <span class="type-badge">${typeLabel}</span>
            ${showPlay ? `
              <div class="play-badge">
                <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </div>
            ` : ''}
            ${showDuration ? `<span class="duration-badge">${utils.esc(file.duration)}</span>` : ''}
          </div>
        </a>
        <div class="file-info">
          <a href="${utils.esc(vcfg.smartlink || '#')}" target="_blank" rel="noopener" class="watch-btn">Watch</a>
          ${metaParts.length ? `
            <div class="file-meta">
              ${metaParts.join('<span class="dot"></span>')}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  function renderFile(fileId) {
    // Find file anywhere in the tree (supports nested folders)
    const result = tree.findFile(fileId);
    if (!result) {
      renderNotFound();
      return;
    }
    const { file, parentFolder } = result;
    state.currentFile = file;
    state.currentFolder = parentFolder;

    const cfg = state.config;

    // Remove home-mode (restore normal topbar)
    els.topbar.classList.remove('home-mode');

    // SEO
    // Title: default site title (no video name in tab)
    const siteName = cfg.site.name || (window.location.hostname ? window.location.hostname.split('.')[0] : 'MyDrive');
    document.title = `${siteName} | Streaming HD Free`;
    setMeta('description', `File ${file.name} di folder ${parentFolder.name}`);
    setMeta('og:title', file.name, true);
    if (file.thumbnail) setMeta('og:image', file.thumbnail, true);

    // Breadcrumb: full path from root to parent folder, then file
    const path = tree.pathToFolder(parentFolder.id) || [parentFolder];
    const crumbs = [{ label: cfg.site.name, href: '/' }];
    path.forEach((f, i) => {
      const fSlug = utils.slugify(f.name);
      const href = i === 0 ? `/${fSlug}` : `/${utils.slugify(path[0].name)}/${fSlug}`;
      crumbs.push({ label: f.name, href });
    });
    renderBreadcrumb(crumbs);

    // Hide search & sort
    els.searchBox.hidden = true;
    els.sortBox.hidden = true;

    // Build media element
    let mediaHtml = '';
    if (file.type === 'video' && file.url) {
      mediaHtml = `<video id="playerVideo" src="${utils.esc(file.url)}" controls preload="metadata" playsinline></video>`;
    } else if (file.type === 'image' && file.url) {
      mediaHtml = `<img src="${utils.esc(file.url)}" alt="${utils.esc(file.name)}" loading="lazy">`;
    } else {
      mediaHtml = file.thumbnail
        ? `<img src="${utils.esc(file.thumbnail)}" alt="${utils.esc(file.name)}" loading="lazy">`
        : `<div class="media-placeholder">${utils.fileIcon(file.type)}</div>`;
    }

    // Meta rows
    const metaRows = [];
    if (file.size) metaRows.push(['Ukuran', file.size]);
    if (file.duration) metaRows.push(['Durasi', file.duration]);
    if (file.date) metaRows.push(['Tanggal', utils.formatDate(file.date)]);
    if (cfg.features.showViewCount && file.views != null) metaRows.push(['Views', utils.formatNum(file.views)]);
    metaRows.push(['Tipe', (file.type || 'file').toUpperCase()]);

    // Build parent folder href for close button (using folder name slugs)
    const parentHref = path.length > 1
      ? `/${utils.slugify(path[0].name)}/${utils.slugify(path[path.length - 1].name)}`
      : `/${utils.slugify(parentFolder.name)}`;

    els.app.innerHTML = `
      <div class="file-detail">
        <div class="file-detail-media">
          ${mediaHtml}
        </div>
        <a href="${parentHref}" class="file-detail-close" aria-label="Kembali">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
        </a>
        ${file.type === 'video' ? `
          <div class="player-play-overlay" id="playerPlayOverlay">
            <div class="player-play-btn">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            </div>
          </div>
          <div class="player-continue-overlay" id="playerContinueOverlay" hidden>
            <div class="player-continue-box">
              <div class="player-continue-icon">▶</div>
              <div class="player-continue-text">Continue Watching</div>
              <button class="player-continue-btn" id="playerContinueBtn">Continue</button>
            </div>
          </div>
        ` : ''}
      </div>
    `;

    // Setup video player features (play overlay, auto-pause, ads, histats)
    if (file.type === 'video') {
      setupVideoPlayer(file);
    }

    // Share button
    const shareBtn = $('#shareBtn');
    if (shareBtn) {
      shareBtn.addEventListener('click', async () => {
        const shareUrl = window.location.href;
        const shareData = {
          title: file.name,
          text: `Lihat ${file.name} di ${cfg.site.name}`,
          url: shareUrl,
        };
        if (navigator.share) {
          try { await navigator.share(shareData); } catch {}
        } else {
          try {
            await navigator.clipboard.writeText(shareUrl);
            utils.toast('Link tersalin ke clipboard');
          } catch {
            utils.toast('Tidak bisa menyalin link');
          }
        }
      });
    }
  }

  function renderNotFound() {
    els.topbar.classList.remove('home-mode');
    // Redirect to smartlink instead of showing 404 (prevents user from leaving)
    const vcfg = window.MYDRIVE_VIDEOS || {};
    const smartlink = vcfg.smartlink;
    if (smartlink) {
      window.location.href = smartlink;
      return;
    }
    // Fallback if no smartlink configured
    els.app.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🤷</div>
        <div class="empty-state-title">404 - Tidak ditemukan</div>
        <div class="empty-state-text">Folder atau file yang kamu cari tidak ada. <a href="/" style="color:var(--primary);font-weight:600">Kembali ke beranda</a></div>
      </div>
    `;
  }

  // ---------- Pagination render ----------
  function renderPagination(current, total, folderId) {
    const max = state.config.pagination.maxPageButtons;
    let pages = [];

    if (total <= max) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      // Windowed pagination with ellipsis
      const half = Math.floor((max - 3) / 2);
      let start = Math.max(2, current - half);
      let end = Math.min(total - 1, current + half);

      pages.push(1);
      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < total - 1) pages.push('...');
      pages.push(total);
    }

    const prevDisabled = current <= 1 ? 'disabled' : '';
    const nextDisabled = current >= total ? 'disabled' : '';

    return `
      <nav class="pagination" aria-label="Pagination">
        <button class="page-btn" ${prevDisabled} data-page="${current - 1}" aria-label="Sebelumnya">‹</button>
        ${pages.map(p => {
          if (p === '...') return `<span class="page-dot">…</span>`;
          const active = p === current ? 'active' : '';
          return `<button class="page-btn ${active}" data-page="${p}">${p}</button>`;
        }).join('')}
        <button class="page-btn" ${nextDisabled} data-page="${current + 1}" aria-label="Berikutnya">›</button>
      </nav>
    `;
  }

  // ---------- Sort ----------
  function sortFiles(files, sortBy) {
    const arr = [...files];
    switch (sortBy) {
      case 'name-asc':
        return arr.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      case 'name-desc':
        return arr.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
      case 'date-desc':
        return arr.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      case 'date-asc':
        return arr.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
      case 'views-desc':
        return arr.sort((a, b) => (b.views || 0) - (a.views || 0));
      case 'size-desc':
        return arr.sort((a, b) => parseSize(b.size) - parseSize(a.size));
      default:
        return arr;
    }
  }

  function sortFolders(folders, sortBy) {
    const arr = [...folders];
    switch (sortBy) {
      case 'name-asc':
        return arr.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      case 'name-desc':
        return arr.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
      case 'date-desc':
        return arr.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      case 'date-asc':
        return arr.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
      case 'count-desc':
        return arr.sort((a, b) => (b.files || []).length - (a.files || []).length);
      default:
        return arr;
    }
  }

  function parseSize(str) {
    if (!str) return 0;
    const m = String(str).match(/([\d.]+)\s*(B|KB|MB|GB|TB)/i);
    if (!m) return 0;
    const n = parseFloat(m[1]);
    const u = m[2].toUpperCase();
    const mult = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4 };
    return n * (mult[u] || 1);
  }

  // ---------- Lazy Load ----------
  function setupLazyLoad() {
    if (!state.config.features.lazyLoad) return;
    const imgs = els.app.querySelectorAll('img[loading="lazy"]');
    imgs.forEach(img => {
      // Start invisible; fade in only when actually loaded (or errored).
      img.style.opacity = '0';
      img.style.transition = 'opacity 0.4s ease';

      const reveal = () => {
        img.style.opacity = '1';
        img.classList.add('loaded');
        img.removeEventListener('load', reveal);
        img.removeEventListener('error', revealErr);
      };
      const revealErr = () => {
        img.style.opacity = '1';
        img.classList.add('error');
        img.removeEventListener('load', reveal);
        img.removeEventListener('error', revealErr);
      };
      img.addEventListener('load', reveal);
      img.addEventListener('error', revealErr);

      // If image is already complete (cached), reveal immediately.
      if (img.complete && img.naturalWidth > 0) {
        reveal();
      }
    });
  }

  // ---------- Ads ----------
  function injectAds() {
    const cfg = state.config.ads;
    if (!cfg.enabled) return;

    // Inject AdSense script once
    if (cfg.provider === 'adsense' && cfg.adsenseClient) {
      const s = document.createElement('script');
      s.async = true;
      s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${cfg.adsenseClient}`;
      s.crossOrigin = 'anonymous';
      document.head.appendChild(s);
    }

    // Header slot
    if (cfg.slots.header || cfg.customHtml.header) {
      els.adHeader.hidden = false;
      els.adHeader.innerHTML = renderAdSlot('header');
    }
    // Footer slot
    if (cfg.slots.footer || cfg.customHtml.footer) {
      els.adFooter.hidden = false;
      els.adFooter.innerHTML = renderAdSlot('footer');
    }
  }

  function renderAdSlot(position) {
    const cfg = state.config.ads;
    if (cfg.provider === 'adsense' && cfg.slots[position]) {
      return `
        <ins class="adsbygoogle"
             style="display:block;width:100%;height:90px"
             data-ad-client="${utils.esc(cfg.adsenseClient)}"
             data-ad-slot="${utils.esc(cfg.slots[position])}"
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
        <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
      `;
    }
    if (cfg.provider === 'custom' && cfg.customHtml[position]) {
      return cfg.customHtml[position];
    }
    return '';
  }

  function injectInGridAd() {
    const cfg = state.config.ads;
    if (!cfg.enabled || !cfg.slots.inGrid) return;
    const grid = $('#fileGrid');
    if (!grid) return;
    // Insert after 8th card
    const cards = grid.querySelectorAll('.file-card');
    if (cards.length < 8) return;
    const adDiv = document.createElement('div');
    adDiv.className = 'ad-slot ad-in-grid';
    adDiv.innerHTML = renderAdSlot('inGrid');
    cards[7].after(adDiv);
  }

  // ---------- Analytics ----------
  function injectAnalytics() {
    const cfg = state.config.analytics;
    if (!cfg.enabled) return;

    if (cfg.provider === 'ga4' && cfg.ga4MeasurementId) {
      const s1 = document.createElement('script');
      s1.async = true;
      s1.src = `https://www.googletagmanager.com/gtag/js?id=${cfg.ga4MeasurementId}`;
      document.head.appendChild(s1);

      const s2 = document.createElement('script');
      s2.text = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${cfg.ga4MeasurementId}');
      `;
      document.head.appendChild(s2);
    } else if (cfg.provider === 'plausible' && cfg.plausibleDomain) {
      const s = document.createElement('script');
      s.defer = true;
      s.setAttribute('data-domain', cfg.plausibleDomain);
      s.src = cfg.plausibleSrc;
      document.head.appendChild(s);
    } else if (cfg.provider === 'umami' && cfg.umamiWebsiteId && cfg.umamiSrc) {
      const s = document.createElement('script');
      s.async = true;
      s.src = cfg.umamiSrc;
      s.setAttribute('data-website-id', cfg.umamiWebsiteId);
      document.head.appendChild(s);
    }
  }

  // ---------- SEO Meta ----------
  function setMeta(name, content, isProperty = false) {
    const attr = isProperty ? 'property' : 'name';
    let el = document.head.querySelector(`meta[${attr}="${name}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  }

  // Helper: re-render current view (used by search/sort handlers)
  function reRenderCurrentView() {
    const { parts } = router.parse();
    if (parts.length >= 1 && parts[0] !== 'v') {
      // Folder view — find folder by slug and re-render
      let folder = null;
      if (parts.length === 1) {
        folder = tree.findRootBySlug(parts[0]);
      } else if (parts.length === 2) {
        const root = tree.findRootBySlug(parts[0]);
        if (root) folder = tree.findSubBySlug(parts[1], root);
      }
      if (folder) {
        renderFolder(folder.id);
      } else {
        renderRoot();
      }
    } else {
      renderRoot();
    }
  }

  // ---------- Search & Sort handlers ----------
  function bindSearchSort() {
    const cfg = state.config;

    if (cfg.features.search) {
      els.searchInput.addEventListener('input', utils.debounce((e) => {
        state.searchQuery = e.target.value.trim();
        els.searchClear.hidden = !state.searchQuery;
        reRenderCurrentView();
      }, 250));

      els.searchClear.addEventListener('click', () => {
        els.searchInput.value = '';
        state.searchQuery = '';
        els.searchClear.hidden = true;
        reRenderCurrentView();
        els.searchInput.focus();
      });
    }

    if (cfg.features.sort) {
      els.sortSelect.addEventListener('change', (e) => {
        state.sortBy = e.target.value;
        reRenderCurrentView();
      });
    }

    // Pagination click handler (delegated)
    els.app.addEventListener('click', (e) => {
      const btn = e.target.closest('.page-btn[data-page]');
      if (!btn || btn.disabled) return;
      const page = parseInt(btn.getAttribute('data-page'), 10);
      const { parts } = router.parse();
      if (parts.length >= 1 && parts[0] !== 'v') {
        // Re-render folder with new page
        reRenderCurrentView();
      }
    });
  }

  // ---------- Video Player Setup (play overlay, auto-pause, ads, histats) ----------
  function setupVideoPlayer(file) {
    const vcfg = window.MYDRIVE_VIDEOS || {};
    const video = document.getElementById('playerVideo');
    const playOverlay = document.getElementById('playerPlayOverlay');
    const continueOverlay = document.getElementById('playerContinueOverlay');
    const continueBtn = document.getElementById('playerContinueBtn');

    if (!video) return;

    // --- Play button overlay ---
    // Show pink play button in center when paused, hide when playing
    if (playOverlay) {
      playOverlay.addEventListener('click', (e) => {
        e.stopPropagation();
        video.play();
      });
      video.addEventListener('play', () => { playOverlay.hidden = true; });
      video.addEventListener('pause', () => {
        // Only show play overlay if NOT in auto-pause state
        if (!continueOverlay || continueOverlay.hidden) {
          playOverlay.hidden = false;
        }
      });
      // Initially show play overlay (video not playing yet)
      playOverlay.hidden = false;
    }

    // --- Auto-pause feature ---
    // Pauses video 2x at random times, shows Continue button → smartlink + resume
    const autoPause = vcfg.autoPause;
    if (autoPause && autoPause.enabled && continueOverlay && continueBtn) {
      let pausePoints = [];
      let pauseIndex = 0;

      video.addEventListener('loadedmetadata', () => {
        const duration = video.duration;
        if (!duration || !isFinite(duration) || duration < 10) return;
        const count = autoPause.count || 2;
        // Generate random pause points spread across the video
        // First pause: 15-40% of duration
        // Second pause: 50-80% of duration
        const segments = count;
        const segSize = 0.65 / segments; // spread across 15% to 80%
        pausePoints = [];
        for (let i = 0; i < count; i++) {
          const min = 0.15 + (segSize * i);
          const max = min + segSize;
          pausePoints.push(duration * (min + Math.random() * (max - min)));
        }
        pausePoints.sort((a, b) => a - b);
      });

      video.addEventListener('timeupdate', () => {
        if (pauseIndex >= pausePoints.length) return;
        const point = pausePoints[pauseIndex];
        if (video.currentTime >= point && !video.paused) {
          video.pause();
          // Show continue overlay
          continueOverlay.hidden = false;
          if (playOverlay) playOverlay.hidden = true;
        }
      });

      continueBtn.addEventListener('click', () => {
        // Open smartlink in new tab
        const smartlink = vcfg.smartlink;
        if (smartlink) {
          window.open(smartlink, '_blank', 'noopener');
        }
        // Resume video
        continueOverlay.hidden = true;
        video.play();
        pauseIndex++;
      });
    }

    // --- Inject popup ad (montag) — only on player page ---
    const popupAd = vcfg.popupAd;
    if (popupAd && popupAd.enabled && popupAd.zone && popupAd.src) {
      try {
        const s = document.createElement('script');
        s.dataset.zone = popupAd.zone;
        s.src = popupAd.src;
        document.body.appendChild(s);
      } catch (e) {
        console.warn('[MyDrive] Popup ad inject failed:', e);
      }
    }

    // --- Inject Histats — only on player page ---
    const histats = vcfg.histats;
    if (histats && histats.enabled && histats.id) {
      try {
        const hs = document.createElement('script');
        hs.type = 'text/javascript';
        hs.async = true;
        hs.text = `
          var _Hasync = _Hasync || [];
          _Hasync.push(['Histats.start', '1,${histats.id},4,0,0,0,00010000']);
          _Hasync.push(['Histats.fasi', '1']);
          _Hasync.push(['Histats.track_hits', '']);
          (function() {
            var hs = document.createElement('script');
            hs.type = 'text/javascript';
            hs.async = true;
            hs.src = '//s10.histats.com/js15_as.js';
            (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(hs);
          })();
        `;
        document.body.appendChild(hs);
      } catch (e) {
        console.warn('[MyDrive] Histats inject failed:', e);
      }
    }
  }

  // ---------- Floating Telegram Button ----------
  // Telegram button is now rendered by the PARENT page (Next.js wrapper)
  // so it's always visible regardless of iframe state.
  // We send the config to parent via postMessage.
  function sendTelegramConfigToParent() {
    const vcfg = window.MYDRIVE_VIDEOS;
    if (!vcfg || !vcfg.telegram || !vcfg.telegram.enabled) return;
    const tg = vcfg.telegram;
    if (!tg.url) return;
    try {
      window.parent?.postMessage({
        type: 'mydrive:telegram-config',
        config: { url: tg.url, text: tg.text || 'Join' },
      }, '*');
    } catch {}
  }

  // Also render Telegram FAB inside the iframe for standalone deployment (GitHub Pages)
  function injectTelegramButton() {
    const vcfg = window.MYDRIVE_VIDEOS;
    if (!vcfg || !vcfg.telegram || !vcfg.telegram.enabled) return;
    const tg = vcfg.telegram;
    if (!tg.url) return;

    if (document.getElementById('telegramFab')) return;

    const fab = document.createElement('a');
    fab.id = 'telegramFab';
    fab.href = tg.url;
    fab.target = '_blank';
    fab.rel = 'noopener';
    fab.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/>
      </svg>
      <span class="telegram-fab-text">${utils.esc(tg.text || 'Join')}</span>
    `;
    document.body.appendChild(fab);
  }

  // ---------- Apply brand config ----------
  function applyBrand() {
    const cfg = state.config.site;

    // Derive site name from domain if not explicitly set
    let siteName = cfg.name;
    if (!siteName) {
      try {
        const hostname = window.location.hostname;
        if (hostname && hostname !== 'localhost') {
          // Extract name from domain (e.g., "gitplay" from "gitplay.test")
          siteName = hostname.split('.')[0];
          // Capitalize first letter
          siteName = siteName.charAt(0).toUpperCase() + siteName.slice(1);
        } else {
          siteName = 'MyDrive';
        }
      } catch {
        siteName = 'MyDrive';
      }
    }

    if (siteName) els.brandName.textContent = siteName;
    // Hide tagline if empty
    if (cfg.tagline) {
      els.brandTagline.textContent = cfg.tagline;
    } else {
      els.brandTagline.style.display = 'none';
    }

    // Brand mark: "player" = play button SVG, otherwise emoji
    if (cfg.brandEmoji === 'player') {
      els.brandMark.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" style="width: 22px; height: 22px; color: #fff;"><path d="M8 5v14l11-7z"/></svg>`;
    } else if (cfg.brandEmoji) {
      els.brandMark.textContent = cfg.brandEmoji;
    }

    if (cfg.footerHtml) els.footerText.innerHTML = cfg.footerHtml;
    if (cfg.favicon) {
      const fav = document.head.querySelector('link[rel="icon"]');
      if (fav) fav.href = utils.resolve(cfg.favicon);
    }
    document.documentElement.lang = cfg.lang || 'id';

    // Apply theme color
    if (state.config.theme && state.config.theme.primary) {
      document.documentElement.style.setProperty('--primary', state.config.theme.primary);
      const rgb = state.config.theme.primaryRgb;
      if (rgb) document.documentElement.style.setProperty('--primary-rgb', rgb);
    }

    // SEO defaults
    if (state.config.seo.allowIndex === false) {
      setMeta('robots', 'noindex, nofollow, nosnippet, noarchive, noimageindex');
    }
    if (state.config.seo.description) {
      setMeta('description', state.config.seo.description);
    }
    if (state.config.seo.keywords) {
      setMeta('keywords', state.config.seo.keywords);
    }
  }

  // ---------- Init ----------
  async function init() {
    if (!loadConfig()) return;

    applyBrand();
    theme.init();
    bindSearchSort();
    injectAnalytics();
    injectAds();

    state.data = await loadData();
    if (!state.data) {
      els.app.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">⚠️</div>
          <div class="empty-state-title">Gagal memuat data</div>
          <div class="empty-state-text">Pastikan file <code>data/content.json</code> tersedia dan valid.</div>
        </div>
      `;
      return;
    }

    router.init();

    // Inject floating Telegram button (for standalone GitHub Pages deployment)
    injectTelegramButton();
    // Send telegram config to parent (for Next.js preview wrapper to render FAB outside iframe)
    sendTelegramConfigToParent();

    // Listen for config requests from parent
    window.addEventListener('message', (e) => {
      if (e.data?.type === 'mydrive:request-config') {
        sendTelegramConfigToParent();
      }
    });

    // Cross-frame path sync (for Next.js preview wrapper)
    // When parent sends a navigate message, update our path (which triggers our router)
    window.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'mydrive:navigate' && typeof e.data.path === 'string') {
        const current = window.location.pathname + window.location.search;
        if (current !== e.data.path) {
          history.pushState({}, '', e.data.path);
          router.handle();
        }
      }
    });
    // When our path changes (user clicks link inside), notify parent so the outer URL bar updates
    window.addEventListener('popstate', () => notifyParent());
  }

  // Boot when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
