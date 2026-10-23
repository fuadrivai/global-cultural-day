<?php
/**
 * Global Cultural Day - Server Storage Diagnostic Tool
 * Buka file ini di browser (contoh: https://domain-anda.com/debug_server.php)
 * untuk mengetahui secara pasti penyebab foto tidak tersimpan di server.
 */
header('Content-Type: text/html; charset=utf-8');

$dir = __DIR__;
$photosDir = $dir . DIRECTORY_SEPARATOR . 'photos';
$phpUser = function_exists('posix_getpwuid') && function_exists('posix_geteuid') 
    ? posix_getpwuid(posix_geteuid())['name'] 
    : get_current_user();

$results = [];

// 1. Cek User Web Server
$results[] = [
    'title' => 'User PHP / Web Server',
    'status' => 'info',
    'desc' => "PHP berjalan sebagai user: <strong>$phpUser</strong>"
];

// 2. Cek izin tulis di root folder project
$canWriteRoot = is_writable($dir);
$results[] = [
    'title' => 'Izin Tulis di Folder Proyek (' . basename($dir) . ')',
    'status' => $canWriteRoot ? 'success' : 'danger',
    'desc' => $canWriteRoot 
        ? "PHP memiliki izin untuk membuat file/folder baru di direktori ini."
        : "<strong>PHP TIDAK memiliki izin tulis di direktori proyek ini!</strong> Akibatnya, PHP <u>tidak bisa membuat folder 'photos' secara otomatis</u> jika foldernya belum ada."
];

// 3. Cek keberadaan folder photos
$dirExists = is_dir($photosDir);
if (!$dirExists) {
    // Coba buat sekarang
    $makeAttempt = @mkdir($photosDir, 0777, true);
    if ($makeAttempt) {
        @chmod($photosDir, 0777);
        $results[] = [
            'title' => 'Pembuatan Folder "photos"',
            'status' => 'success',
            'desc' => 'Folder "photos" berhasil dibuat otomatis oleh script ini barusan!'
        ];
        $dirExists = true;
    } else {
        $lastError = error_get_last();
        $results[] = [
            'title' => 'Folder "photos" Belum Ada',
            'status' => 'danger',
            'desc' => 'Folder <code>photos</code> belum ada dan PHP gagal membuatnya otomatis. Alasan: <em>' . ($lastError['message'] ?? 'Permission denied') . '</em>.<br>👉 <strong>Solusi:</strong> Buat folder bernama <code>photos</code> secara manual di File Manager atau via SSH.'
        ];
    }
} else {
    $results[] = [
        'title' => 'Folder "photos" Ditemukan',
        'status' => 'success',
        'desc' => 'Folder <code>photos</code> sudah ada di server.'
    ];
}

// 4. Cek izin tulis di folder photos (jika ada)
if ($dirExists) {
    @chmod($photosDir, 0777);
    $canWritePhotos = is_writable($photosDir);
    if ($canWritePhotos) {
        // Tes tulis file dummy
        $testFile = $photosDir . DIRECTORY_SEPARATOR . 'test_write.tmp';
        $writeAttempt = @file_put_contents($testFile, 'OK - ' . date('Y-m-d H:i:s'));
        if ($writeAttempt !== false) {
            @unlink($testFile);
            $results[] = [
                'title' => 'Tes Menulis Foto ke Folder "photos"',
                'status' => 'success',
                'desc' => '<strong>BERHASIL!</strong> PHP dapat menulis dan menyimpan file foto ke folder <code>photos</code> tanpa kendala.'
            ];
        } else {
            $results[] = [
                'title' => 'Tes Menulis File ke Folder "photos"',
                'status' => 'danger',
                'desc' => 'Folder ada tetapi PHP gagal menulis file ke dalamnya. Permission folder photos belum 777.'
            ];
        }
    } else {
        $perms = substr(sprintf('%o', fileperms($photosDir)), -4);
        $results[] = [
            'title' => 'Izin Tulis Folder "photos"',
            'status' => 'danger',
            'desc' => "Folder <code>photos</code> memiliki permission <strong>$perms</strong> dan <u>tidak dapat ditulisi</u> oleh user <strong>$phpUser</strong>.<br>👉 <strong>Solusi:</strong> Ubah permission folder <code>photos</code> menjadi <strong>777</strong>."
        ];
    }
}

// 5. Cek limit ukuran POST di php.ini
$postMax = ini_get('post_max_size');
$uploadMax = ini_get('upload_max_filesize');
$results[] = [
    'title' => 'Konfigurasi Batas Ukuran Data (php.ini)',
    'status' => 'info',
    'desc' => "<code>post_max_size = $postMax</code> | <code>upload_max_filesize = $uploadMax</code> (Foto biasanya berukuran ~1MB - 2MB, pastikan post_max_size minimal 8M)."
];
?>
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Diagnostik Server - Global Cultural Day</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 30px 20px; line-height: 1.6; }
    .container { max-width: 680px; margin: 0 auto; background: #1e293b; border-radius: 16px; padding: 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    h1 { margin-top: 0; font-size: 22px; color: #38bdf8; display: flex; align-items: center; gap: 10px; }
    .card { background: #0f172a; border-radius: 10px; padding: 16px; margin-bottom: 14px; border-left: 5px solid #64748b; }
    .card.success { border-left-color: #10b981; }
    .card.danger { border-left-color: #ef4444; }
    .card.info { border-left-color: #38bdf8; }
    .card h3 { margin: 0 0 6px 0; font-size: 16px; }
    .card.success h3 { color: #34d399; }
    .card.danger h3 { color: #f87171; }
    .card.info h3 { color: #38bdf8; }
    .card p { margin: 0; font-size: 14px; color: #cbd5e1; }
    code { background: #334155; padding: 2px 6px; border-radius: 4px; color: #f1f5f9; font-size: 13px; }
    .solution-box { margin-top: 24px; padding: 18px; border-radius: 12px; background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); }
    .solution-box h2 { font-size: 17px; margin-top: 0; color: #38bdf8; }
    pre { background: #020617; padding: 12px; border-radius: 8px; color: #4ade80; overflow-x: auto; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔍 Diagnostik Penyimpanan Foto Server</h1>
    <p style="font-size: 14px; color: #94a3b8; margin-bottom: 20px;">
      Halaman ini mengecek apakah server mengizinkan PHP membuat folder dan menyimpan foto photobooth.
    </p>

    <?php foreach ($results as $r): ?>
      <div class="card <?php echo $r['status']; ?>">
        <h3>
          <?php echo $r['status'] === 'success' ? '✅' : ($r['status'] === 'danger' ? '❌' : 'ℹ️'); ?>
          <?php echo htmlspecialchars($r['title']); ?>
        </h3>
        <p><?php echo $r['desc']; ?></p>
      </div>
    <?php endforeach; ?>

    <div class="solution-box">
      <h2>🛠️ Perintah untuk Menyelesaikan di Server (Terminal SSH):</h2>
      <p style="font-size: 13px; color: #cbd5e1;">Jalankan perintah ini di dalam direktori website Anda di server:</p>
      <pre>mkdir -p photos
chmod 777 photos
# Jika di VPS Ubuntu/Debian (Apache/Nginx):
sudo chown -R www-data:www-data photos/</pre>
      <p style="font-size: 13px; color: #cbd5e1; margin-top: 10px;">
        <strong>Atau jika pakai cPanel:</strong> Buka File Manager &rarr; klik kanan folder <code>photos</code> &rarr; <em>Change Permissions</em> &rarr; centang semua kotak Write sehingga angkanya menjadi <strong>777</strong>.
      </p>
    </div>
  </div>
</body>
</html>
