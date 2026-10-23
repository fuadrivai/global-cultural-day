/**
 * Global Cultural Day - Main Application Controller
 * Handles webcam stream, MediaPipe FaceMesh processing, UI interactions,
 * countdown photo capture, and QR code generation.
 */

class CulturalDayApp {
  constructor() {
    this.video = document.getElementById('webcamVideo');
    this.canvas = document.getElementById('arCanvas');
    this.renderer = new ARRenderer(this.canvas);

    // Camera state
    this.currentStream = null;
    this.selectedDeviceId = null;
    this.isProcessing = false;
    this.isCapturing = false;

    // UI elements
    this.loadingScreen = document.getElementById('loadingScreen');
    this.loadingStatusText = document.getElementById('loadingStatusText');
    this.detectionPill = document.getElementById('detectionPill');
    this.detectionText = document.getElementById('detectionText');
    this.toastNotice = document.getElementById('toastNotice');
    this.flashOverlay = document.getElementById('flashOverlay');

    // Countdown elements
    this.countdownOverlay = document.getElementById('countdownOverlay');
    this.countdownNumber = document.getElementById('countdownNumber');
    this.countdownSubtext = document.getElementById('countdownSubtext');

    // Photo Modal elements
    this.photoModal = document.getElementById('photoModal');
    this.photoPreviewCanvas = document.getElementById('photoPreviewCanvas');
    this.qrcodeBox = document.getElementById('qrcodeBox');
    this.qrInstance = null;

    // Settings Modal elements
    this.settingsModal = document.getElementById('settingsModal');

    // Settings State
    this.countdownDuration = 3; // 3, 5, or 10 seconds
    this.defaultFormat = 'jpg'; // 'jpg' or 'png'
    this.isCountingDown = false;
    this.lastExportCanvas = null;

    this.init();
  }

  async init() {
    this.bindEvents();
    this.syncDefaultSettings();
    this.setupDateDisplay();
    await this.setupCameras();
    try {
      await this.startCamera();
    } catch (e) {
      console.warn('Initial camera notice:', e);
    }
    await this.initMediaPipe();
  }

  syncDefaultSettings() {
    const checkHeadband = document.getElementById('checkHeadband');
    if (checkHeadband) checkHeadband.checked = this.renderer.settings.showHeadband;

    const checkLabel = document.getElementById('checkLabel');
    if (checkLabel) checkLabel.checked = this.renderer.settings.showLabel;

    const checkSticker = document.getElementById('checkSticker');
    if (checkSticker) checkSticker.checked = this.renderer.settings.showSticker;
  }

  setupDateDisplay() {
    const dateEl = document.getElementById('polaroidDate');
    if (dateEl) {
      const now = new Date();
      const options = { day: 'numeric', month: 'long', year: 'numeric' };
      dateEl.textContent = now.toLocaleDateString('en-US', options);
    }
  }

  showToast(message, duration = 2500) {
    if (!this.toastNotice) return;
    this.toastNotice.textContent = message;
    this.toastNotice.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastNotice.classList.remove('show');
    }, duration);
  }

  /**
   * Enumerate connected webcams
   */
  async setupCameras() {
    try {
      const select = document.getElementById('selectCameraDevice');
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');

      select.innerHTML = '';
      videoDevices.forEach((device, index) => {
        const option = document.createElement('option');
        option.value = device.deviceId;
        option.text = device.label || `Camera ${index + 1}`;
        select.appendChild(option);
      });

      if (videoDevices.length > 0) {
        this.selectedDeviceId = videoDevices[0].deviceId;
      }
    } catch (e) {
      console.warn('Could not enumerate cameras:', e);
    }
  }

  /**
   * Start Webcam video stream
   */
  async startCamera(deviceId = null) {
    this.loadingStatusText.textContent = 'Accessing webcam...';

    if (this.currentStream) {
      this.currentStream.getTracks().forEach(track => track.stop());
    }

    const constraints = {
      audio: false,
      video: {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        facingMode: 'user'
      }
    };

    if (deviceId) {
      constraints.video.deviceId = { exact: deviceId };
    }

    try {
      this.currentStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.video.srcObject = this.currentStream;

      await new Promise(resolve => {
        this.video.onloadedmetadata = () => {
          this.video.play();
          resolve();
        };
      });

      // Synchronize canvas dimensions with video
      this.syncCanvasSize();
      window.addEventListener('resize', () => this.syncCanvasSize());

      this.loadingStatusText.textContent = 'Camera ready! Starting AI Face Tracking...';
    } catch (err) {
      console.error('Camera access error:', err);
      this.loadingStatusText.textContent = 'Failed to access webcam. Please ensure camera permission is granted.';
      alert('Unable to access webcam. Please allow camera permissions in your browser.');
    }
  }

  syncCanvasSize() {
    const vw = this.video.videoWidth || 1280;
    const vh = this.video.videoHeight || 720;
    this.canvas.width = vw;
    this.canvas.height = vh;
  }

  /**
   * Initialize MediaPipe FaceMesh model with local vendor binaries
   */
  async initMediaPipe() {
    this.loadingStatusText.textContent = 'Loading AI Face Mesh model (Multi-Face)...';

    if (typeof window.FaceMesh === 'undefined') {
      console.error('MediaPipe FaceMesh library not found.');
      this.loadingStatusText.textContent = 'Failed to load FaceMesh library.';
      return;
    }

    this.faceMesh = new window.FaceMesh({
      locateFile: file => {
        // Load wasm and assets directly from local vendor folder
        return `vendor/mediapipe/${file}`;
      }
    });

    this.faceMesh.setOptions({
      maxNumFaces: 6, // Supports up to 6 faces simultaneously with rock-solid stability
      refineLandmarks: false, // Distant faces don't need iris model; allows small face detection
      minDetectionConfidence: 0.45, // Optimal: rejects clothes/neck folds, reliably detects distant faces at 2-3m
      minTrackingConfidence: 0.45 // Maintains tracking without drifting onto clothing or background
    });

    this.faceMesh.onResults(results => this.onFaceMeshResults(results));

    // Warm-up inference
    try {
      await this.faceMesh.initialize();
      console.log('MediaPipe FaceMesh initialized successfully.');
    } catch (e) {
      console.warn('FaceMesh init notice:', e);
    }

    // Start video frame processing loop
    this.startDetectionLoop();

    // Hide loading screen
    setTimeout(() => {
      this.loadingScreen.classList.add('hidden');
      this.showToast('✨ Welcome to Global Cultural Day AR Booth!');
    }, 600);
  }

  startDetectionLoop() {
    const processFrame = async () => {
      if (!this.isStaticMode && !this.video.paused && !this.video.ended && this.video.readyState >= 2) {
        if (!this.isProcessing) {
          this.isProcessing = true;
          try {
            await this.faceMesh.send({ image: this.video });
          } catch (e) {
            console.error('FaceMesh send error:', e);
          } finally {
            this.isProcessing = false;
          }
        }
      }
      requestAnimationFrame(processFrame);
    };

    requestAnimationFrame(processFrame);
  }

  /**
   * Process a static image for testing multi-face detection
   */
  async loadStaticImage(imgSrc) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      this.staticImage = img;
      this.isStaticMode = true;
      this.canvas.width = img.naturalWidth || 1280;
      this.canvas.height = img.naturalHeight || 720;
      this.renderer.settings.mirrorCamera = false; // Photos don't need mirroring

      this.showToast('📷 Processing multi-face photo...');
      try {
        await this.faceMesh.send({ image: img });
        this.showToast('✨ Filter successfully applied to photo!');
      } catch (err) {
        console.error('Static image detection error:', err);
      }
    };
    img.src = imgSrc;
  }

  /**
   * Handles MediaPipe detection results
   */
  onFaceMeshResults(results) {
    if (this.isCapturing) return; // Freeze during instant snapshot

    const source = this.isStaticMode ? this.staticImage : this.video;
    if (!source) return;

    const activeFaces = this.renderer.render(source, results.multiFaceLandmarks);

    // Update HUD Live Detection Pill
    this.updateDetectionHUD(activeFaces);
  }

  updateDetectionHUD(activeFaces) {
    if (!this.detectionText) return;

    if (!activeFaces || activeFaces.length === 0) {
      this.detectionText.textContent = 'Searching for faces in camera...';
      this.detectionPill.style.borderColor = 'rgba(255, 255, 255, 0.15)';
      return;
    }

    const count = activeFaces.length;
    const countryNames = activeFaces.map(f => {
      const c = window.COUNTRIES.find(item => item.id === f.countryId);
      return c ? `${c.emoji} ${c.name.split(' ')[0]}` : '';
    }).filter(Boolean);

    if (count === 1) {
      this.detectionText.textContent = `1 Face: ${countryNames[0]}`;
    } else {
      this.detectionText.textContent = `${count} Faces: ${countryNames.slice(0, 3).join(', ')}${count > 3 ? '...' : ''}`;
    }

    this.detectionPill.style.borderColor = 'var(--accent-green)';
  }

  /**
   * Starts Countdown (configurable: 3, 5, or 10 seconds) and Captures Photo
   * Keeps camera and face filters live until the countdown timer finishes!
   */
  startPhotoCountdown() {
    if (this.isCountingDown || this.isCapturing) return;
    this.isCountingDown = true;

    window.soundManager.init();
    this.countdownOverlay.classList.add('active');

    let count = this.countdownDuration || 3;
    this.countdownNumber.textContent = count;
    this.countdownSubtext.textContent = 'GET READY TO SMILE! 😊';
    window.soundManager.playCountdownTick();

    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        this.countdownNumber.textContent = count;
        window.soundManager.playCountdownTick();
      } else if (count === 0) {
        this.countdownNumber.textContent = 'CHEESE! 📸';
        this.countdownSubtext.textContent = 'SMILE!';
        window.soundManager.playCountdownFinal();
      } else {
        clearInterval(interval);
        this.countdownOverlay.classList.remove('active');
        this.isCountingDown = false;

        // Freeze camera and capture snapshot at the exact moment timer expires
        this.isCapturing = true;
        this.triggerShutterFlash();
        this.capturePhoto();
      }
    }, 1000);
  }

  triggerShutterFlash() {
    window.soundManager.playShutter();
    this.flashOverlay.classList.add('flashing');
    setTimeout(() => {
      this.flashOverlay.classList.remove('flashing');
    }, 400);
  }

  /**
   * Captures snapshot and builds Polaroid commemorative frame
   */
  capturePhoto() {
    // 1. Draw current live AR canvas into preview canvas
    const srcCanvas = this.canvas;
    const previewCanvas = this.photoPreviewCanvas;

    previewCanvas.width = srcCanvas.width;
    previewCanvas.height = srcCanvas.height;
    const pctx = previewCanvas.getContext('2d');
    pctx.drawImage(srcCanvas, 0, 0);

    // 2. Generate commemorative polaroid card export canvas
    this.lastExportCanvas = this.generatePolaroidCardCanvas();

    // 3. Play celebration fanfare & trigger confetti explosion
    setTimeout(() => {
      window.soundManager.playCelebration();
      this.triggerConfetti();
    }, 200);

    // 4. Save photo to server & generate direct mobile download QR Code
    this.uploadPhotoForQR();

    // 5. Open Photo Review Modal
    this.photoModal.classList.add('open');
  }

  /**
   * Constructs commemorative polaroid card canvas
   */
  generatePolaroidCardCanvas() {
    const photo = this.photoPreviewCanvas;
    const exportCanvas = document.createElement('canvas');
    const borderPadding = 36;
    const bottomCaptionHeight = 110;

    exportCanvas.width = photo.width + borderPadding * 2;
    exportCanvas.height = photo.height + borderPadding + bottomCaptionHeight;

    const ctx = exportCanvas.getContext('2d');

    // Crisp white photo card background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // Main photo
    ctx.drawImage(photo, borderPadding, borderPadding);

    // Subtle inner photo border stroke
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.lineWidth = 2;
    ctx.strokeRect(borderPadding, borderPadding, photo.width, photo.height);

    // Event Title
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 38px "Outfit", system-ui, sans-serif';
    ctx.fillText('GLOBAL CULTURAL DAY 2026', borderPadding + 10, photo.height + borderPadding + 54);

    // Subtitle & Date
    ctx.fillStyle = '#64748B';
    ctx.font = '500 22px "Plus Jakarta Sans", system-ui, sans-serif';
    const dateText = document.getElementById('polaroidDate').textContent;
    ctx.fillText(`Mutiara Harapan Islamic School • ${dateText}`, borderPadding + 10, photo.height + borderPadding + 88);

    // Globe watermark emoji
    ctx.font = '40px system-ui';
    ctx.fillText('🌍', exportCanvas.width - borderPadding - 55, photo.height + borderPadding + 65);

    return exportCanvas;
  }

  /**
   * Uploads captured photo to local server and creates QR Code linking directly to photo
   */
  async uploadPhotoForQR() {
    if (!this.lastExportCanvas) return;
    this.qrcodeBox.innerHTML = '<span style="font-size:11px;color:#94a3b8;line-height:1.4;display:block;padding:20px 0;">Preparing download link...</span>';

    const dataUrl = this.lastExportCanvas.toDataURL('image/jpeg', 0.92);

    try {
      const response = await fetch('save_photo.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl, format: 'jpg' })
      });
      const result = await response.json();
      if (result.success && result.viewUrl) {
        this.generateQRCode(result.viewUrl);
        return;
      } else {
        const errorMsg = result.error || `Server HTTP ${response.status}`;
        console.error('save_photo.php error:', errorMsg);
        this.showToast(`⚠️ Server: ${errorMsg}`, 5000);
      }
    } catch (e) {
      console.error('save_photo.php connection error:', e);
      this.showToast('⚠️ Failed to save to server (Check photos folder permissions)', 4000);
    }

    // Fallback if server call fails
    this.generateQRCode(window.location.href);
  }

  triggerConfetti() {
    if (typeof window.confetti === 'function') {
      const count = 200;
      const defaults = { origin: { y: 0.7 } };

      const fire = (particleRatio, opts) => {
        window.confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio)
        });
      };

      fire(0.25, { spread: 26, startVelocity: 55, colors: ['#EF4444', '#F59E0B', '#10B981'] });
      fire(0.2, { spread: 60, colors: ['#3B82F6', '#8B5CF6', '#F59E0B'] });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    }
  }

  /**
   * Generates QR Code for instant mobile download
   */
  generateQRCode(targetUrl) {
    this.qrcodeBox.innerHTML = '';
    const url = targetUrl || window.location.href;

    try {
      if (typeof window.QRCode !== 'undefined') {
        new window.QRCode(this.qrcodeBox, {
          text: url,
          width: 130,
          height: 130,
          colorDark: '#0F172A',
          colorLight: '#FFFFFF',
          correctLevel: window.QRCode.CorrectLevel.M
        });
      }
    } catch (e) {
      console.warn('QR Code generation error:', e);
    }
  }

  /**
   * Downloads the complete commemorative photo card as JPG or PNG
   */
  downloadHighResPhoto(format = null) {
    const targetFormat = (format || this.defaultFormat || 'jpg').toLowerCase();
    const exportCanvas = this.lastExportCanvas || this.generatePolaroidCardCanvas();

    const link = document.createElement('a');
    const timestamp = Date.now();

    if (targetFormat === 'png') {
      link.download = `Global-Cultural-Day-${timestamp}.png`;
      link.href = exportCanvas.toDataURL('image/png');
    } else {
      link.download = `Global-Cultural-Day-${timestamp}.jpg`;
      link.href = exportCanvas.toDataURL('image/jpeg', 0.92);
    }

    link.click();
    this.showToast(`✅ Photo successfully downloaded in ${targetFormat.toUpperCase()} format!`);
  }

  /**
   * UI Event Bindings
   */
  bindEvents() {
    // 1. Shutter Button
    document.getElementById('btnShutter').addEventListener('click', () => {
      this.startPhotoCountdown();
    });

    // 2. Region Tabs
    const tabs = document.querySelectorAll('.region-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const regionId = tab.getAttribute('data-region');
        this.renderer.setRegion(regionId);
        window.soundManager.playPop();

        const regionObj = Object.values(window.REGIONS).find(r => r.id === regionId);
        const name = regionObj ? regionObj.name : 'All';
        this.showToast(`🌏 Selected Region: ${name}`);
      });
    });

    // 3. Shuffle Buttons
    const handleShuffle = () => {
      this.renderer.shuffle();
      window.soundManager.playPop();
      this.showToast('🎲 Country Flags Shuffled!');
    };
    document.getElementById('btnShuffle').addEventListener('click', handleShuffle);
    document.getElementById('btnSideShuffle').addEventListener('click', handleShuffle);

    // 4. Side Toggle Buttons
    document.getElementById('btnToggleBandana').addEventListener('click', () => {
      this.renderer.settings.showHeadband = !this.renderer.settings.showHeadband;
      document.getElementById('checkHeadband').checked = this.renderer.settings.showHeadband;
      window.soundManager.playPop();
      this.showToast(`👑 Headband: ${this.renderer.settings.showHeadband ? 'Enabled' : 'Disabled'}`);
    });

    document.getElementById('btnToggleSticker').addEventListener('click', () => {
      this.renderer.settings.showSticker = !this.renderer.settings.showSticker;
      document.getElementById('checkSticker').checked = this.renderer.settings.showSticker;
      window.soundManager.playPop();
      this.showToast(`✨ Cheek Sticker: ${this.renderer.settings.showSticker ? 'Enabled' : 'Disabled'}`);
    });

    // 5. Fullscreen Kiosk Toggle
    document.getElementById('btnFullscreen').addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          console.warn('Fullscreen error:', err);
        });
      } else {
        document.exitFullscreen();
      }
    });

    // 6. Photo Upload for Multi-Face Demo Testing
    const btnUpload = document.getElementById('btnUploadTest');
    const fileInput = document.getElementById('fileUploadInput');
    if (btnUpload && fileInput) {
      btnUpload.addEventListener('click', () => {
        fileInput.click();
      });

      fileInput.addEventListener('change', e => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = ev => {
            this.loadStaticImage(ev.target.result);
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // 7. Camera Switcher & Resume Video
    document.getElementById('btnSwitchCam').addEventListener('click', () => {
      if (this.isStaticMode) {
        // Return to live camera
        this.isStaticMode = false;
        this.renderer.settings.mirrorCamera = document.getElementById('checkMirror').checked;
        this.syncCanvasSize();
        this.showToast('📹 Returning to Live Webcam...');
        return;
      }

      const select = document.getElementById('selectCameraDevice');
      if (select.options.length > 1) {
        let nextIndex = (select.selectedIndex + 1) % select.options.length;
        select.selectedIndex = nextIndex;
        this.startCamera(select.value);
        this.showToast(`📷 Switched to: ${select.options[nextIndex].text}`);
      } else {
        this.startCamera();
        this.showToast('📹 Refreshing Live Webcam...');
      }
    });

    document.getElementById('selectCameraDevice').addEventListener('change', e => {
      this.isStaticMode = false;
      this.startCamera(e.target.value);
    });

    // 7. Settings Modal
    document.getElementById('btnSettings').addEventListener('click', () => {
      this.settingsModal.classList.add('open');
    });
    document.getElementById('btnCloseSettings').addEventListener('click', () => {
      this.settingsModal.classList.remove('open');
    });

    // Checkbox binds in Settings
    document.getElementById('checkHeadband').addEventListener('change', e => {
      this.renderer.settings.showHeadband = e.target.checked;
    });
    document.getElementById('checkSticker').addEventListener('change', e => {
      this.renderer.settings.showSticker = e.target.checked;
    });
    document.getElementById('selectStickerSide').addEventListener('change', e => {
      this.renderer.settings.stickerSide = e.target.value;
    });
    document.getElementById('checkLabel').addEventListener('change', e => {
      this.renderer.settings.showLabel = e.target.checked;
    });
    document.getElementById('checkMirror').addEventListener('change', e => {
      this.renderer.settings.mirrorCamera = e.target.checked;
    });
    document.getElementById('checkSound').addEventListener('change', e => {
      window.soundManager.enabled = e.target.checked;
    });

    // Countdown Duration & Default Format Binds in Settings
    const selCountdown = document.getElementById('selectCountdownDuration');
    if (selCountdown) {
      selCountdown.addEventListener('change', e => {
        this.countdownDuration = parseInt(e.target.value) || 3;
        this.showToast(`⏱️ Countdown timer: ${this.countdownDuration} Seconds`);
      });
    }

    const selFormat = document.getElementById('selectDefaultFormat');
    if (selFormat) {
      selFormat.addEventListener('change', e => {
        this.defaultFormat = e.target.value;
        this.showToast(`💾 Default download format: ${this.defaultFormat.toUpperCase()}`);
      });
    }

    // AI Face Sensitivity Bind
    const selSensitivity = document.getElementById('selectSensitivity');
    if (selSensitivity) {
      selSensitivity.addEventListener('change', e => {
        const val = e.target.value;
        let conf = 0.45;
        if (val === 'high') conf = 0.35;
        else if (val === 'strict') conf = 0.55;

        if (this.faceMesh) {
          this.faceMesh.setOptions({
            minDetectionConfidence: conf,
            minTrackingConfidence: conf
          });
        }
        const label = e.target.options[e.target.selectedIndex].text;
        this.showToast(`🎯 AI Sensitivity: ${label}`);
      });
    }

    // 8. Photo Modal Buttons (Separate JPG and PNG downloads)
    const btnJpg = document.getElementById('btnDownloadJPG');
    if (btnJpg) {
      btnJpg.addEventListener('click', () => {
        this.downloadHighResPhoto('jpg');
      });
    }

    const btnPng = document.getElementById('btnDownloadPNG');
    if (btnPng) {
      btnPng.addEventListener('click', () => {
        this.downloadHighResPhoto('png');
      });
    }

    document.getElementById('btnRetakePhoto').addEventListener('click', () => {
      this.photoModal.classList.remove('open');
      this.isCapturing = false; // Resume live camera
      window.soundManager.playPop();
    });

    document.getElementById('btnCloseModal').addEventListener('click', () => {
      this.photoModal.classList.remove('open');
      this.isCapturing = false; // Resume live camera
    });

    // Click outside modal to close
    [this.photoModal, this.settingsModal].forEach(modal => {
      modal.addEventListener('click', e => {
        if (e.target === modal) {
          modal.classList.remove('open');
        }
      });
    });
  }
}

// Start application when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.app = new CulturalDayApp();
});
