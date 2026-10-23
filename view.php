<?php
/**
 * Global Cultural Day - Mobile Photo View & Download Portal
 * Opened when participants/parents scan the Polaroid QR code from their phones.
 */

$photoId = preg_replace('/[^a-zA-Z0-9_\-]/', '', $_GET['id'] ?? '');
$uploadDir = __DIR__ . DIRECTORY_SEPARATOR . 'photos';

$photoFile = null;
$photoExt = 'jpg';

if (!empty($photoId)) {
    if (file_exists($uploadDir . DIRECTORY_SEPARATOR . $photoId . '.jpg')) {
        $photoFile = $photoId . '.jpg';
        $photoExt = 'jpg';
    } elseif (file_exists($uploadDir . DIRECTORY_SEPARATOR . $photoId . '.png')) {
        $photoFile = $photoId . '.png';
        $photoExt = 'png';
    } elseif (file_exists($uploadDir . DIRECTORY_SEPARATOR . $photoId)) {
        $photoFile = $photoId;
        $photoExt = pathinfo($photoFile, PATHINFO_EXTENSION);
    }
}

// Download action handler
if (isset($_GET['download']) && $photoFile) {
    $fullPath = $uploadDir . DIRECTORY_SEPARATOR . $photoFile;
    if (file_exists($fullPath)) {
        $targetFormat = strtolower($_GET['download']) === 'png' ? 'png' : 'jpg';
        $downloadName = 'Global-Cultural-Day-2026.' . $targetFormat;
        
        header('Content-Description: File Transfer');
        header('Content-Type: ' . ($targetFormat === 'png' ? 'image/png' : 'image/jpeg'));
        header('Content-Disposition: attachment; filename="' . $downloadName . '"');
        header('Expires: 0');
        header('Cache-Control: must-revalidate');
        header('Pragma: public');
        header('Content-Length: ' . filesize($fullPath));
        readfile($fullPath);
        exit;
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Global Cultural Day 2026 - Commemorative Photo</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-tap-highlight-color: transparent;
    }
    body {
      background: radial-gradient(circle at 50% 10%, #1e1b4b 0%, #090d16 100%);
      color: #F8FAFC;
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 16px 40px;
    }
    .header {
      text-align: center;
      margin-bottom: 24px;
    }
    .badge-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 16px;
      border-radius: 9999px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      font-size: 13px;
      font-weight: 600;
      color: #FCD34D;
      margin-bottom: 12px;
      backdrop-filter: blur(10px);
    }
    h1 {
      font-family: 'Outfit', sans-serif;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
      background: linear-gradient(135deg, #FFFFFF 0%, #CBD5E1 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 6px;
    }
    p.subtitle {
      font-size: 14px;
      color: #94A3B8;
      max-width: 380px;
      margin: 0 auto;
    }
    .card-wrap {
      width: 100%;
      max-width: 460px;
      background: rgba(30, 41, 59, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 24px;
      padding: 16px;
      box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(16px);
      margin-bottom: 24px;
    }
    .photo-display {
      width: 100%;
      border-radius: 16px;
      overflow: hidden;
      background: #000;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    }
    .photo-display img {
      width: 100%;
      height: auto;
      display: block;
    }
    .not-found {
      padding: 60px 20px;
      text-align: center;
      color: #EF4444;
      font-weight: 600;
    }
    .btn-group {
      width: 100%;
      max-width: 460px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      padding: 14px 20px;
      border-radius: 14px;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 15px;
      font-weight: 700;
      text-decoration: none;
      border: none;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .btn-jpg {
      background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
      color: #FFFFFF;
      box-shadow: 0 8px 20px -4px rgba(245, 158, 11, 0.4);
    }
    .btn-jpg:active {
      transform: scale(0.98);
      filter: brightness(0.95);
    }
    .btn-png {
      background: rgba(255, 255, 255, 0.1);
      color: #F8FAFC;
      border: 1px solid rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(8px);
    }
    .btn-png:active {
      transform: scale(0.98);
      background: rgba(255, 255, 255, 0.16);
    }
    .tip-box {
      margin-top: 24px;
      text-align: center;
      font-size: 12px;
      color: #64748B;
      line-height: 1.6;
      max-width: 360px;
    }
  </style>
</head>
<body>

  <div class="header">
    <div class="badge-pill">
      <span>🎉</span> Global Cultural Day 2026
    </div>
    <h1>Your Commemorative Photo</h1>
    <p class="subtitle">Cherish the wonderful moments of global cultural diversity and togetherness on your device.</p>
  </div>

  <div class="card-wrap">
    <?php if ($photoFile && file_exists($uploadDir . DIRECTORY_SEPARATOR . $photoFile)): ?>
      <div class="photo-display">
        <img src="photos/<?php echo htmlspecialchars($photoFile); ?>" alt="Global Cultural Day Photo">
      </div>
    <?php else: ?>
      <div class="not-found">
        <p>⚠️ Photo not found or has expired.</p>
      </div>
    <?php endif; ?>
  </div>

  <?php if ($photoFile): ?>
  <div class="btn-group">
    <!-- Download JPG -->
    <a href="view.php?id=<?php echo urlencode($photoId); ?>&download=jpg" class="btn btn-jpg" download>
      <span>💾</span> Download JPG Photo (Recommended)
    </a>

    <!-- Download PNG -->
    <a href="view.php?id=<?php echo urlencode($photoId); ?>&download=png" class="btn btn-png" download>
      <span>🖼️</span> Download PNG Photo (Max Resolution)
    </a>
  </div>

  <div class="tip-box">
    💡 <strong>Tip:</strong> You can also long-press or right-click the photo above and choose <em>"Save Image"</em> to save it to your photo gallery.
  </div>
  <?php endif; ?>

</body>
</html>
