<?php
/**
 * Global Cultural Day - Photo Server Endpoint
 * Saves captured photo to disk and returns mobile-accessible URLs for QR Code scanning
 */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// 1. Ensure storage directory exists and has write permissions
$uploadDir = __DIR__ . DIRECTORY_SEPARATOR . 'photos';
if (!is_dir($uploadDir)) {
    if (!@mkdir($uploadDir, 0777, true)) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'The "photos" folder does not exist and could not be created automatically. Please create a folder named "photos" on your server and set permissions to 777 (chmod 777 photos).'
        ]);
        exit;
    }
    @chmod($uploadDir, 0777);
}

// Verify write permission
if (!is_writable($uploadDir)) {
    @chmod($uploadDir, 0777);
    if (!is_writable($uploadDir)) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'The "photos" folder does not have write permissions (Permission Denied). Please set permissions of "photos" to 777 in your File Manager or run "chmod 777 photos" on your server.'
        ]);
        exit;
    }
}

// 2. Read JSON payload
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data || empty($data['image'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'No image data received or payload exceeds server POST limit (post_max_size / client_max_body_size). Please check your server configuration.'
    ]);
    exit;
}

$format = (!empty($data['format']) && strtolower($data['format']) === 'png') ? 'png' : 'jpg';
$base64String = $data['image'];

// Strip data URI header
if (preg_match('/^data:image\/(\w+);base64,/', $base64String, $type)) {
    $base64String = substr($base64String, strpos($base64String, ',') + 1);
}

$decodedData = base64_decode($base64String);
if ($decodedData === false) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Base64 decode failed']);
    exit;
}

// 3. Generate unique file name
$id = 'gcd_' . date('Ymd_His') . '_' . substr(bin2hex(random_bytes(4)), 0, 6);
$filename = $id . '.' . $format;
$filePath = $uploadDir . DIRECTORY_SEPARATOR . $filename;

// Save photo and strictly verify output
$bytesWritten = @file_put_contents($filePath, $decodedData);
if ($bytesWritten === false || $bytesWritten === 0) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to save photo file to "photos" folder. Please check directory permissions (chmod 777 photos) or remaining disk quota.'
    ]);
    exit;
}

// 4. Resolve Server Host & Mobile Accessible URLs
$serverHost = $_SERVER['HTTP_HOST'] ?? 'localhost';

// Detect SSL / HTTPS (supports Cloudflare & Nginx reverse proxies)
$protocol = 'http://';
if (
    (isset($_SERVER['HTTPS']) && strtolower($_SERVER['HTTPS']) !== 'off' && $_SERVER['HTTPS'] !== '') ||
    (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && strtolower($_SERVER['HTTP_X_FORWARDED_PROTO']) === 'https') ||
    (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443)
) {
    $protocol = 'https://';
}

// Subdirectory resolution (e.g. /global-cultural-day)
$scriptDir = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '')), '/');
if ($scriptDir === '/' || $scriptDir === '\\') {
    $scriptDir = '';
}

// Localhost fallback for LAN QR code scan
$mobileHost = $serverHost;
if (strpos($serverHost, 'localhost') !== false || strpos($serverHost, '127.0.0.1') !== false) {
    $lanIp = getHostByName(getHostName());
    if (!empty($lanIp) && $lanIp !== '127.0.0.1' && filter_var($lanIp, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
        $port = parse_url('http://' . $serverHost, PHP_URL_PORT) ?: ($_SERVER['SERVER_PORT'] ?? '80');
        $mobileHost = $lanIp . ($port && $port != '80' && $port != '443' ? ':' . $port : '');
    }
}

$baseUrl = $protocol . $mobileHost . $scriptDir;
$viewUrl = $baseUrl . '/view.php?id=' . urlencode($id);
$directUrl = $baseUrl . '/photos/' . urlencode($filename);

echo json_encode([
    'success' => true,
    'id' => $id,
    'filename' => $filename,
    'format' => $format,
    'size' => $bytesWritten,
    'viewUrl' => $viewUrl,
    'directUrl' => $directUrl
]);
