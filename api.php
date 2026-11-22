<?php
/**
 * ============================================================
 *  MyDrive API — Single-file PHP API for MySQL/Shared Hosting
 * ============================================================
 *  File ini menangani semua operasi database (CRUD folders,
 *  videos, settings) via MySQL.
 *
 *  Cara setup:
 *  1. Edit config database di bawah ($DB_HOST, $DB_NAME, dll)
 *  2. Import database.sql ke phpMyAdmin / MySQL
 *  3. Set $ADMIN_PASSWORD untuk login admin
 *  4. Akses: http://gitplay.test/api.php?action=data (public)
 *           http://gitplay.test/admin (admin dashboard)
 * ============================================================
 */

session_start();
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

// ============================================================
//  CONFIG — Edit sesuai hosting kamu
// ============================================================
$DB_HOST = 'localhost';
$DB_NAME = 'gitplay';
$DB_USER = 'root';
$DB_PASS = '';
$ADMIN_PASSWORD = 'admin123'; // GANTI password ini!

// ============================================================
//  DATABASE CONNECTION
// ============================================================
try {
    $pdo = new PDO(
        "mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4",
        $DB_USER,
        $DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

// ============================================================
//  HELPERS
// ============================================================
function isLoggedIn() {
    return isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;
}

function genId($len = 8) {
    $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    $id = '';
    for ($i = 0; $i < $len; $i++) {
        $id .= $chars[random_int(0, strlen($chars) - 1)];
    }
    return $id;
}

function input() {
    return json_decode(file_get_contents('php://input'), true) ?? $_POST;
}

// ============================================================
//  ROUTING
// ============================================================
$action = $_GET['action'] ?? 'data';

try {
    switch ($action) {

        // ----- PUBLIC: Get all data -----
        case 'data':
            $folders = $pdo->query('SELECT * FROM folders ORDER BY sort_order ASC, name ASC')->fetchAll();
            $videos = $pdo->query('SELECT * FROM videos ORDER BY sort_order ASC, created_at ASC')->fetchAll();
            $settingsRows = $pdo->query('SELECT * FROM settings')->fetchAll();
            $settings = [];
            foreach ($settingsRows as $row) {
                $settings[$row['key']] = $row['value'];
            }
            echo json_encode([
                'folders' => $folders,
                'videos' => $videos,
                'settings' => $settings,
            ]);
            break;

        // ----- ADMIN: Login -----
        case 'login':
            $data = input();
            $password = $data['password'] ?? '';
            if ($password === $ADMIN_PASSWORD) {
                $_SESSION['admin_logged_in'] = true;
                echo json_encode(['success' => true]);
            } else {
                http_response_code(401);
                echo json_encode(['error' => 'Wrong password']);
            }
            break;

        // ----- ADMIN: Logout -----
        case 'logout':
            session_destroy();
            echo json_encode(['success' => true]);
            break;

        // ----- ADMIN: Check session -----
        case 'check':
            echo json_encode(['logged_in' => isLoggedIn()]);
            break;

        // ----- ADMIN: Save folder -----
        case 'save_folder':
            if (!isLoggedIn()) { http_response_code(401); echo json_encode(['error' => 'Unauthorized']); exit; }
            $data = input();
            $id = $data['id'] ?? genId();
            $name = $data['name'] ?? '';
            $parentId = $data['parent_id'] ?? null;
            $sortOrder = $data['sort_order'] ?? 0;
            if (empty($name)) { echo json_encode(['error' => 'Name required']); exit; }
            $stmt = $pdo->prepare('INSERT INTO folders (id, name, parent_id, sort_order) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), parent_id=VALUES(parent_id), sort_order=VALUES(sort_order)');
            $stmt->execute([$id, $name, $parentId, $sortOrder]);
            echo json_encode(['success' => true, 'id' => $id]);
            break;

        // ----- ADMIN: Save video -----
        case 'save_video':
            if (!isLoggedIn()) { http_response_code(401); echo json_encode(['error' => 'Unauthorized']); exit; }
            $data = input();
            $id = $data['id'] ?? genId();
            $folderId = $data['folder_id'] ?? '';
            $name = $data['name'] ?? null;
            $url = $data['url'] ?? '';
            $sortOrder = $data['sort_order'] ?? 0;
            if (empty($url) || empty($folderId)) { echo json_encode(['error' => 'URL and folder required']); exit; }
            $stmt = $pdo->prepare('INSERT INTO videos (id, folder_id, name, url, sort_order) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE folder_id=VALUES(folder_id), name=VALUES(name), url=VALUES(url), sort_order=VALUES(sort_order)');
            $stmt->execute([$id, $folderId, $name, $url, $sortOrder]);
            echo json_encode(['success' => true, 'id' => $id]);
            break;

        // ----- ADMIN: Save setting -----
        case 'save_setting':
            if (!isLoggedIn()) { http_response_code(401); echo json_encode(['error' => 'Unauthorized']); exit; }
            $data = input();
            $key = $data['key'] ?? '';
            $value = $data['value'] ?? '';
            if (empty($key)) { echo json_encode(['error' => 'Key required']); exit; }
            $stmt = $pdo->prepare('INSERT INTO settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value=VALUES(value)');
            $stmt->execute([$key, $value]);
            echo json_encode(['success' => true]);
            break;

        // ----- ADMIN: Bulk save settings -----
        case 'save_settings':
            if (!isLoggedIn()) { http_response_code(401); echo json_encode(['error' => 'Unauthorized']); exit; }
            $data = input();
            $settings = $data['settings'] ?? [];
            $stmt = $pdo->prepare('INSERT INTO settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value=VALUES(value)');
            $count = 0;
            foreach ($settings as $key => $value) {
                $stmt->execute([$key, strval($value)]);
                $count++;
            }
            echo json_encode(['success' => true, 'count' => $count]);
            break;

        // ----- ADMIN: Delete folder -----
        case 'delete_folder':
            if (!isLoggedIn()) { http_response_code(401); echo json_encode(['error' => 'Unauthorized']); exit; }
            $data = input();
            $id = $data['id'] ?? '';
            // Delete videos in this folder first
            $pdo->prepare('DELETE FROM videos WHERE folder_id = ?')->execute([$id]);
            $pdo->prepare('DELETE FROM folders WHERE id = ?')->execute([$id]);
            echo json_encode(['success' => true]);
            break;

        // ----- ADMIN: Delete video -----
        case 'delete_video':
            if (!isLoggedIn()) { http_response_code(401); echo json_encode(['error' => 'Unauthorized']); exit; }
            $data = input();
            $id = $data['id'] ?? '';
            $pdo->prepare('DELETE FROM videos WHERE id = ?')->execute([$id]);
            echo json_encode(['success' => true]);
            break;

        // ----- ADMIN: Setup (create tables if not exist) -----
        case 'setup':
            $pdo->exec("CREATE TABLE IF NOT EXISTS folders (
                id VARCHAR(16) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                parent_id VARCHAR(16) DEFAULT NULL,
                sort_order INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
            $pdo->exec("CREATE TABLE IF NOT EXISTS videos (
                id VARCHAR(16) PRIMARY KEY,
                folder_id VARCHAR(16) NOT NULL,
                name VARCHAR(255),
                url TEXT NOT NULL,
                sort_order INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_folder (folder_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
            $pdo->exec("CREATE TABLE IF NOT EXISTS settings (
                `key` VARCHAR(255) PRIMARY KEY,
                value TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
            echo json_encode(['success' => true, 'message' => 'Tables created/verified']);
            break;

        default:
            http_response_code(404);
            echo json_encode(['error' => 'Unknown action: ' . $action]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
