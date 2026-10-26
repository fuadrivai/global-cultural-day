# 🌍 Global Cultural Day - Interactive AR Webcam Booth

Aplikasi **Interactive AR Webcam Filter** bertema **Global Cultural Day** dengan deteksi multi-wajah (*multi-face tracking* hingga 8 orang secara simultan), bandana/headband bendera melingkar di dahi secara realistis, dan stiker bendera di pipi.

---

## ✨ Fitur Utama

1. **👥 Multi-Face AR Tracking (Banyak Wajah Sekaligus)**
   - Mendeteksi banyak orang secara bersamaan secara *real-time* (60 FPS) menggunakan **Google MediaPipe Face Mesh**.
   - Setiap orang yang berdiri di depan kamera secara cerdas mendapatkan bendera negara yang berbeda tanpa bentrok.

2. **👑 Bandana / Headband 3D Realistis**
   - Melingkar rapi di dahi dari pelipis kiri hingga pelipis kanan (*cylindrical forehead wrap*).
   - Dilengkapi tekstur kain (*fabric weave*), bayangan lipatan (*ambient drop shadow*), jahitan atas & bawah (*stitched hem lines*), dan pencahayaan melengkung 3D.
   - Bergerak dinamis mengikuti kemiringan kepala (tilt, nod, turn).

3. **✨ Face Sticker di Pipi**
   - Stiker bendera mini di tulang pipi dengan sudut perspektif alami (*decal sticker*).
   - Efek sudut rounded halus, border stiker putih, kilau lapisan gloss, dan bayangan lembut pada kulit.
   - Posisi stiker dapat diatur: Pipi Kanan, Pipi Kiri, atau Kedua Pipi.

4. **🗺️ 6 Kawasan Benua Lengkap (Sesuai Foto Referensi)**
   - 🟢 **Asia:** Indonesia 🇮🇩, Jepang 🇯🇵, China 🇨🇳, India 🇮🇳, Thailand 🇹🇭
   - 🔵 **Eropa:** Perancis 🇫🇷, Italia 🇮🇹, Jerman 🇩🇪, Inggris (UK) 🇬🇧
   - 🔴 **Afrika Utara:** Mesir 🇪🇬, Maroko 🇲🇦, Aljazair 🇩🇿, Tunisia 🇹🇳
   - 🟡 **Afrika Barat:** Ghana 🇬🇭, Nigeria 🇳🇬, Senegal 🇸🇳, Pantai Gading 🇨🇮
   - 🟣 **Afrika Selatan:** Afrika Selatan 🇿🇦, Namibia 🇳🇦, Botswana 🇧🇼, Zimbabwe 🇿🇼
   - 🔷 **Oseania:** Australia 🇦🇺, Selandia Baru 🇳🇿, Fiji & Kep. Pasifik 🇫🇯
   - 🌍 **Semua Benua (Global Shuffle):** Mode acak global untuk grup keluarga/teman.

5. **📸 Photobooth Kiosk & Souvenir Frame**
   - Hitungan mundur (3-2-1 Countdown) dengan efek audio sintetis.
   - Efek *camera flash* putih dan ledakan *confetti* perayaan budaya 🎉.
   - Hasil foto otomatis dibingkai ke dalam kartu kenang-kenangan **"GLOBAL CULTURAL DAY 2026"** lengkap dengan tanggal acara.
   - **Tombol Unduh Foto HD:** Menyimpan gambar beresolusi tinggi (PNG).
   - **QR Code Scanner:** Pengunjung/orang tua dapat langsung scan QR di layar untuk mendownload foto ke smartphone.

6. **⚙️ Kontrol Fleksibel & 100% Offline Ready**
   - Semua aset model MediaPipe telah diunduh lokal di folder `vendor/`, sehingga aplikasi dapat berjalan lancar tanpa koneksi internet di venue acara.
   - Sensitivitas deteksi wajah dapat diatur ke **High** untuk membantu mendeteksi wajah yang kecil atau jauh.
   - Tombol Layar Penuh (F11 / Fullscreen Kiosk Mode).
   - Tombol Upload Foto: Anda juga dapat menguji coba filter dengan mengunggah foto grup dari komputer.

---

## 🚀 Cara Menjalankan

### Cara 1: Menggunakan XAMPP Apache (Rekomendasi untuk Acara)
1. Buka **XAMPP Control Panel**.
2. Klik **Start** pada modul **Apache**.
3. Buka browser (Google Chrome atau Microsoft Edge) dan akses URL:
   ```
   http://localhost/global-cultural-day/
   ```

### Cara 2: Menggunakan Built-in Server Port 8080
Akses langsung di browser Anda:
```
http://localhost:8080/
```
*(Server PHP lokal sedang berjalan di port 8080).*

---

## 📁 Struktur Direktori

```
global-cultural-day/
├── index.html                 # Halaman utama AR Photobooth Kiosk
├── css/
│   └── style.css              # Desain Glassmorphism, animasi & styling
├── js/
│   ├── flags.js               # Definisi 26 negara & generator canvas vektor
│   ├── renderer.js            # Engine AR multi-face, 3D headband & cheek sticker
│   ├── audio.js               # Sintesis suara Web Audio (countdown, shutter, fanfare)
│   └── app.js                 # Kontroler webcam, snapshot polaroid & QR code
├── vendor/
│   ├── mediapipe/             # Model AI lokal Google MediaPipe FaceMesh
│   ├── confetti.browser.js    # Partikel confetti perayaan
│   └── qrcode.min.js          # Generator QR code instan
└── README.md                  # Petunjuk penggunaan
```
