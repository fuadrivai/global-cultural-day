/**
 * Global Cultural Day - Realistic AR Filter Renderer
 * Handles multi-face tracking, perspective warping, 3D cylindrical headband rendering,
 * and realistic cheek sticker decals.
 */

class ARRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Face tracking state
    this.trackedFaces = new Map(); // id -> { countryId, lastX, lastY, lastSeen, smoothLandmarks }
    this.nextFaceId = 1;

    // Filter settings (Bandana and Country Label hidden by default per user request)
    this.settings = {
      showHeadband: false, // Default: OFF (tidak terlihat)
      showSticker: true,   // Default: ON (hanya stiker terlihat)
      showLabel: false,    // Default: OFF (tidak terlihat)
      stickerSide: 'right', // 'right', 'left', or 'both'
      activeRegion: 'all',
      mirrorCamera: true,
      smoothingFactor: 0.65 // exponential smoothing for rock-solid stability
    };

    // Country distribution pool
    this.availableCountries = [...window.COUNTRIES];
    this.customAssignments = new Map(); // faceId -> countryId (forced by shuffle/selection)
  }

  setRegion(regionId) {
    this.settings.activeRegion = regionId;
    if (regionId === 'all') {
      this.availableCountries = [...window.COUNTRIES];
    } else {
      this.availableCountries = window.COUNTRIES.filter(c => c.region === regionId);
      if (this.availableCountries.length === 0) {
        this.availableCountries = [...window.COUNTRIES];
      }
    }
    // Re-assign countries for current active faces
    this.reassignCountries();
  }

  reassignCountries() {
    const faces = Array.from(this.trackedFaces.values());
    // Sort faces from left to right for orderly assignment
    faces.sort((a, b) => a.lastX - b.lastX);

    faces.forEach((face, idx) => {
      const country = this.availableCountries[idx % this.availableCountries.length];
      face.countryId = country.id;
    });
  }

  shuffle() {
    const faces = Array.from(this.trackedFaces.values());
    // Shuffle available countries
    const shuffled = [...this.availableCountries].sort(() => Math.random() - 0.5);
    faces.forEach((face, idx) => {
      face.countryId = shuffled[idx % shuffled.length].id;
    });
  }

  /**
   * Main render function called on every video frame with MediaPipe results
   */
  render(video, multiFaceLandmarks) {
    const { width, height } = this.canvas;
    const ctx = this.ctx;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // 1. Draw video background
    if (this.settings.mirrorCamera) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, width, height);
    ctx.restore();

    // 2. Track & match faces across frames
    const currentFaces = this.processMultiFaces(multiFaceLandmarks, width, height);

    // 3. Render AR filters for each tracked face
    currentFaces.forEach(faceData => {
      this.renderFaceFilters(faceData);
    });

    return currentFaces;
  }

  /**
   * Anatomical sanity check to filter out phantom detections on shirts, collars, neck folds, and chins
   */
  isValidFace(points, width, height) {
    if (!points || points.length < 468) return false;

    // Key landmarks:
    // Forehead top: 10, Chin bottom: 152
    // Outer eyes: Left 33, Right 263
    // Nose tip: 1, Mouth center: 13
    const p10 = points[10];
    const p152 = points[152];
    const p33 = points[33];
    const p263 = points[263];
    const p1 = points[1];
    const p13 = points[13];

    if (!p10 || !p152 || !p33 || !p263 || !p1) return false;

    const faceHeight = Math.hypot(p152.x - p10.x, p152.y - p10.y);
    const eyeDist = Math.hypot(p263.x - p33.x, p263.y - p33.y);

    // 1. Minimum dimension check: At 2-3 meters, a valid face is at least 25px tall and 10px eye-distance
    if (faceHeight < 25 || eyeDist < 10) return false;

    // 2. Anatomical proportion: Eye distance vs Face height must be in realistic human bounds (0.20 to 0.78)
    const eyeToHeightRatio = eyeDist / faceHeight;
    if (eyeToHeightRatio < 0.20 || eyeToHeightRatio > 0.78) return false;

    // 3. Aspect Ratio of bounding box
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    const keyIndices = [10, 152, 33, 263, 127, 356, 1, 61, 291, 234, 454];
    for (const idx of keyIndices) {
      const pt = points[idx];
      if (pt) {
        if (pt.x < minX) minX = pt.x;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.y > maxY) maxY = pt.y;
      }
    }
    const bbWidth = maxX - minX;
    const bbHeight = maxY - minY;
    if (bbHeight < 24 || bbWidth < 18) return false;
    const aspectRatio = bbWidth / bbHeight;
    if (aspectRatio < 0.38 || aspectRatio > 1.45) return false;

    // 4. Longitudinal ordering along the head axis: Forehead (0) -> Eyes -> Nose -> Mouth -> Chin (1)
    const vX = p152.x - p10.x;
    const vY = p152.y - p10.y;
    const vLenSq = vX * vX + vY * vY;
    if (vLenSq < 100) return false;

    // Nose projection onto head vector
    const projNose = ((p1.x - p10.x) * vX + (p1.y - p10.y) * vY) / vLenSq;
    if (projNose < 0.28 || projNose > 0.78) return false;

    // Eye midpoint projection onto head vector
    const midEyeX = (p33.x + p263.x) / 2;
    const midEyeY = (p33.y + p263.y) / 2;
    const projEyes = ((midEyeX - p10.x) * vX + (midEyeY - p10.y) * vY) / vLenSq;
    if (projEyes < 0.15 || projEyes > 0.58) return false;

    // Eyes must be anatomically above the nose tip
    if (projEyes >= projNose) return false;

    // Mouth projection if available: must be below nose and above chin
    if (p13) {
      const projMouth = ((p13.x - p10.x) * vX + (p13.y - p10.y) * vY) / vLenSq;
      if (projMouth <= projNose || projMouth > 0.96) return false;
    }

    return true;
  }

  /**
   * Spatial Non-Maximum Suppression (NMS) to eliminate duplicate detections,
   * specifically suppressing phantom faces detected on the chin, neck, or chest of the same person.
   */
  suppressOverlappingFaces(detectedList) {
    if (detectedList.length <= 1) return detectedList;

    // Sort detected faces from top to bottom (smaller cy = higher up in the frame)
    // Real heads are always above necks, chins, and chests!
    const candidates = [...detectedList].sort((a, b) => a.cy - b.cy);
    const kept = [];

    for (let i = 0; i < candidates.length; i++) {
      const cur = candidates[i];
      let isDuplicateOrPhantom = false;

      for (let j = 0; j < kept.length; j++) {
        const existing = kept[j];

        // 1. Vertical Stacking Check (Same person's body column):
        // If candidate shares almost the same horizontal X coordinate and sits directly below existing face
        const dx = Math.abs(cur.cx - existing.cx);
        const maxW = Math.max(cur.faceWidth, existing.faceWidth);
        const maxH = Math.max(cur.faceHeight, existing.faceHeight);

        if (dx < maxW * 0.58) {
          // If cur is directly below existing within 1.35x face height (chin, neck, upper chest)
          const dy = cur.cy - existing.cy;
          if (dy > 0 && dy < maxH * 1.35) {
            isDuplicateOrPhantom = true;
            break;
          }
        }

        // 2. Bounding Box Overlap / Intersection
        const interLeft = Math.max(cur.minX, existing.minX);
        const interTop = Math.max(cur.minY, existing.minY);
        const interRight = Math.min(cur.maxX, existing.maxX);
        const interBottom = Math.min(cur.maxY, existing.maxY);

        if (interRight > interLeft && interBottom > interTop) {
          const interArea = (interRight - interLeft) * (interBottom - interTop);
          const curArea = cur.faceWidth * cur.faceHeight;
          const existArea = existing.faceWidth * existing.faceHeight;
          const minArea = Math.min(curArea, existArea);
          if (minArea > 0 && (interArea / minArea) > 0.22) {
            isDuplicateOrPhantom = true;
            break;
          }
        }

        // 3. Center Proximity Check
        const centerDist = Math.hypot(cur.cx - existing.cx, cur.cy - existing.cy);
        if (centerDist < Math.min(cur.faceHeight, existing.faceHeight) * 0.72) {
          isDuplicateOrPhantom = true;
          break;
        }
      }

      if (!isDuplicateOrPhantom) {
        kept.push(cur);
      }
    }

    return kept;
  }

  /**
   * Spatially matches detected faces to persistent IDs to prevent country flickering,
   * with anti-phantom prefiltering and adaptive dual-speed jitter damping.
   */
  processMultiFaces(multiFaceLandmarks, width, height) {
    const now = Date.now();

    if (!multiFaceLandmarks || multiFaceLandmarks.length === 0) {
      // Clean up stale faces after 600ms of disappearance
      for (const [id, face] of this.trackedFaces.entries()) {
        if (now - face.lastSeen > 600) {
          this.trackedFaces.delete(id);
        }
      }
      return [];
    }

    const matchedFaces = [];
    const availablePool = [...this.availableCountries];

    // 1. Compute pixel landmarks & face metrics for each raw detection
    const rawDetected = multiFaceLandmarks.map((rawPoints, idx) => {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

      const points = rawPoints.map(p => {
        let px = p.x * width;
        if (this.settings.mirrorCamera) {
          px = width - px;
        }
        const py = p.y * height;
        if (px < minX) minX = px;
        if (px > maxX) maxX = px;
        if (py < minY) minY = py;
        if (py > maxY) maxY = py;

        return {
          x: px,
          y: py,
          z: p.z * width
        };
      });

      // Anatomical dimensions
      const p10 = points[10] || { x: minX, y: minY };
      const p152 = points[152] || { x: minX, y: maxY };
      const faceHeight = Math.hypot(p152.x - p10.x, p152.y - p10.y);
      const faceWidth = maxX - minX;

      // Centroid around mid-face
      const cx = (points[1].x + points[10].x + points[152].x) / 3;
      const cy = (points[1].y + points[10].y + points[152].y) / 3;

      return {
        points,
        cx,
        cy,
        minX,
        maxX,
        minY,
        maxY,
        faceWidth,
        faceHeight,
        originalIndex: idx
      };
    });

    // 2. Pre-filter: Anatomical sanity validation (reject clothing creases, buttons, chin phantoms)
    const validDetected = rawDetected.filter(d => this.isValidFace(d.points, width, height));

    // 3. Spatial Non-Maximum Suppression (reject duplicate chin/body detections on the same person)
    const filteredDetected = this.suppressOverlappingFaces(validDetected);

    // 4. Match with existing tracked faces using adaptive search radius based on face size
    const unmatchedDetected = [...filteredDetected];
    const updatedIds = new Set();

    for (const [id, tracked] of this.trackedFaces.entries()) {
      let closestIdx = -1;
      // Dynamic search radius scaled by face size (avoids jumping between head and chest at 2-3m)
      const maxSearchRadius = Math.max(50, Math.min(180, (tracked.faceHeight || 70) * 1.3));
      let minDistance = maxSearchRadius;

      unmatchedDetected.forEach((d, i) => {
        const dist = Math.hypot(d.cx - tracked.lastX, d.cy - tracked.lastY);
        if (dist < minDistance) {
          minDistance = dist;
          closestIdx = i;
        }
      });

      if (closestIdx !== -1) {
        const found = unmatchedDetected.splice(closestIdx, 1)[0];

        // Adaptive dual-speed jitter damping filter:
        // If stationary at 2-3m distance, apply strong damping to eliminate camera sensor flutter
        const dCentroid = Math.hypot(found.cx - tracked.lastX, found.cy - tracked.lastY);
        let alpha = this.settings.smoothingFactor; // default ~0.65
        if (dCentroid < 1.5) {
          alpha = 0.88; // Micro-jitter stationary lock
        } else if (dCentroid >= 8.0) {
          alpha = 0.35; // Responsive for quick movements
        }

        const smoothedPoints = tracked.smoothPoints.map((sp, i) => ({
          x: sp.x * alpha + found.points[i].x * (1 - alpha),
          y: sp.y * alpha + found.points[i].y * (1 - alpha),
          z: sp.z * alpha + found.points[i].z * (1 - alpha)
        }));

        tracked.lastX = found.cx;
        tracked.lastY = found.cy;
        tracked.faceWidth = found.faceWidth;
        tracked.faceHeight = found.faceHeight;
        tracked.lastSeen = now;
        tracked.smoothPoints = smoothedPoints;
        tracked.detectionFrames = (tracked.detectionFrames || 1) + 1;
        updatedIds.add(id);

        // Only render faces confirmed across at least 2 consecutive frames to eliminate 1-frame glitches
        if (tracked.detectionFrames >= 2 || this.isStaticMode) {
          matchedFaces.push({ id, ...tracked });
        }
      }
    }

    // 5. Assign new persistent IDs for genuine new faces entering the camera
    unmatchedDetected.forEach(newFace => {
      const id = this.nextFaceId++;
      const usedCountryIds = new Set(Array.from(this.trackedFaces.values()).map(f => f.countryId));
      let country = availablePool.find(c => !usedCountryIds.has(c.id));
      if (!country) {
        country = availablePool[this.trackedFaces.size % availablePool.length];
      }

      const faceObj = {
        id,
        countryId: country.id,
        lastX: newFace.cx,
        lastY: newFace.cy,
        faceWidth: newFace.faceWidth,
        faceHeight: newFace.faceHeight,
        lastSeen: now,
        detectionFrames: 1, // First frame observed
        smoothPoints: newFace.points
      };

      this.trackedFaces.set(id, faceObj);

      // In static photo mode, render immediately; in live webcam, wait for 2nd frame confirmation
      if (this.isStaticMode) {
        matchedFaces.push({ id, ...faceObj });
      }
    });

    // 6. Clean up faces that left the frame (600ms timeout)
    for (const [id, face] of this.trackedFaces.entries()) {
      if (now - face.lastSeen > 600) {
        this.trackedFaces.delete(id);
      }
    }

    return matchedFaces;
  }

  /**
   * Renders Headband, Cheek Sticker, and Label for an individual face
   */
  renderFaceFilters(faceData) {
    const pts = faceData.smoothPoints;
    const country = window.COUNTRIES.find(c => c.id === faceData.countryId) || window.COUNTRIES[0];
    const ctx = this.ctx;

    // Key Face Landmarks:
    // Forehead center top: 10, mid: 151, brow center: 9, 8
    // Temples: Left 109, 67, 103, 54, 21 | Right 338, 297, 332, 284, 251
    // Eyes: Left outer 33, Right outer 263
    // Cheeks: Left cheek 116, 123, 147, 50 | Right cheek 345, 352, 376, 280
    // Nose tip: 1, Chin: 152

    const pForeheadTop = pts[10];
    const pForeheadMid = pts[151] || pts[9];
    const pBrowCenter = pts[9] || pts[8];

    const pTempleL = pts[109] || pts[67];
    const pTempleR = pts[338] || pts[297];
    const pEarL = pts[234];
    const pEarR = pts[454];

    // Identify screen-left and screen-right eyes & temples regardless of mirroring
    const screenEyeL = pts[33].x < pts[263].x ? pts[33] : pts[263];
    const screenEyeR = pts[33].x < pts[263].x ? pts[263] : pts[33];

    const dxEyes = screenEyeR.x - screenEyeL.x;
    const dyEyes = screenEyeR.y - screenEyeL.y;
    // rollAngle is now reliably centered at 0 (horizontal)
    const rollAngle = Math.atan2(dyEyes, Math.max(0.001, dxEyes));
    const eyeDist = Math.hypot(dxEyes, dyEyes);

    // Temples & Face Width (landmarks 127/356 are outer temples, 234/454 are outer ears)
    const temple1 = pts[127] || pts[234] || pts[21];
    const temple2 = pts[356] || pts[454] || pts[251];
    const screenTempleL = temple1.x < temple2.x ? temple1 : temple2;
    const screenTempleR = temple1.x < temple2.x ? temple2 : temple1;

    const faceWidth = Math.hypot(screenTempleR.x - screenTempleL.x, screenTempleR.y - screenTempleL.y);
    const faceHeight = Math.hypot(pts[152].x - pForeheadTop.x, pts[152].y - pForeheadTop.y);

    // Head Pitch (nod up/down)
    const noseY = pts[1].y;
    const midEyeY = (screenEyeL.y + screenEyeR.y) / 2;
    const pitchRatio = (noseY - midEyeY) / (faceHeight || 1);

    // Head Yaw (turn left/right)
    const distToLeft = Math.hypot(pts[1].x - screenTempleL.x, pts[1].y - screenTempleL.y);
    const distToRight = Math.hypot(pts[1].x - screenTempleR.x, pts[1].y - screenTempleR.y);
    const yawRatio = (distToRight - distToLeft) / (faceWidth || 1);

    // 1. Render Headband / Bandana (Strictly on forehead, above eyebrows)
    if (this.settings.showHeadband) {
      this.drawRealisticHeadband(ctx, pts, country, {
        rollAngle,
        faceWidth,
        faceHeight,
        yawRatio,
        pitchRatio
      });
    }

    // 2. Render Face Sticker Decal on Cheek (Conforming to 3D facial cheek contour)
    if (this.settings.showSticker) {
      this.drawRealisticCheekSticker(ctx, pts, country, {
        rollAngle,
        faceWidth,
        faceHeight,
        yawRatio
      });
    }

    // 3. Render Floating Cultural Badge
    if (this.settings.showLabel) {
      this.drawCountryBadge(ctx, pts, country, rollAngle, faceWidth);
    }
  }

  /**
   * Renders realistic curved bandana wrapped STRICTLY across the forehead
   * Positioned securely in the middle of the forehead, safely above the eyebrows and below the hairline
   */
  drawRealisticHeadband(ctx, pts, country, metrics) {
    const texture = window.TextureCache.getBandanaTexture(country.id);
    const { rollAngle, faceWidth, pitchRatio } = metrics;

    // Key Forehead & Brow Landmarks
    // Glabella (center between eyebrows): 9, 8
    // Hairline center (top of forehead): 10
    // Mid-forehead center: 151
    const pBrowCenter = pts[9] || pts[8];
    const pForeheadTop = pts[10];
    if (!pBrowCenter || !pForeheadTop) return;

    // Vector pointing directly UP the forehead from eyebrows to hairline
    const fVecX = pForeheadTop.x - pBrowCenter.x;
    const fVecY = pForeheadTop.y - pBrowCenter.y;
    const fHeight = Math.hypot(fVecX, fVecY) || 60;
    const dirUp = { x: fVecX / fHeight, y: fVecY / fHeight };
    // Perpendicular vector across the forehead (pointing from subject's right to left, screen left to right)
    const dirRight = { x: -dirUp.y, y: dirUp.x };

    // Bandana physical cloth thickness: scales down gracefully for distant faces
    const bandHeight = Math.max(6, Math.min(38, (faceWidth || 220) * 0.135));
    const halfBand = bandHeight * 0.5;
    const bandCenterDist = fHeight * 0.56;

    const foreheadCenter = {
      x: pBrowCenter.x + dirUp.x * bandCenterDist,
      y: pBrowCenter.y + dirUp.y * bandCenterDist
    };

    // Lateral span across the head silhouette:
    // Uses actual outer temples for realistic skull width
    const tL = pts[127] || pts[103] || pts[21];
    const tR = pts[356] || pts[332] || pts[251];
    const headSpan = (tL && tR) ? Math.hypot(tR.x - tL.x, tR.y - tL.y) : (faceWidth || 200);
    const halfSpan = headSpan * 0.48;

    const segments = 20;
    const topPoints = [];
    const botPoints = [];

    // Spherical head curvature adjustment (curves smoothly around forehead cylinder)
    // When looking straight: subtle upward curve matching skull roundness
    // When pitching up/down: dynamic perspective arch
    const pitchOffset = (pitchRatio - 0.35) * fHeight * 0.16;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments; // 0 (far left) to 1 (far right)
      const u = (t - 0.5) * 2; // -1 (far left temple) to +1 (far right temple)

      // Base position strictly horizontal along forehead across dirRight
      const baseX = foreheadCenter.x + dirRight.x * (u * halfSpan);
      const baseY = foreheadCenter.y + dirRight.y * (u * halfSpan);

      // Spherical cylindrical curvature arch:
      // Forehead arches gently outward in 3D: highest in center, receding to temples
      const cylinderArch = Math.cos(u * (Math.PI / 2)) * (fHeight * 0.05 + pitchOffset);

      // Perspective cosine foreshortening at the lateral silhouette wrap
      const localHalfHeight = halfBand * (0.86 + 0.14 * Math.cos(u * (Math.PI / 2)));

      // Bottom edge point (stays strictly on forehead, safely ~25-30px above eyebrows)
      const bx = baseX - dirUp.x * (localHalfHeight - cylinderArch);
      const by = baseY - dirUp.y * (localHalfHeight - cylinderArch);
      botPoints.push({ x: bx, y: by });

      // Top edge point (strictly uniform band thickness)
      const tx = bx + dirUp.x * (bandHeight);
      const ty = by + dirUp.y * (bandHeight);
      topPoints.push({ x: tx, y: ty });
    }

    ctx.save();

    // 1. Soft contact shadow casting onto the forehead skin below the band
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.filter = 'blur(3.5px)';
    ctx.beginPath();
    ctx.moveTo(botPoints[0].x, botPoints[0].y);
    for (let i = 1; i <= segments; i++) {
      ctx.lineTo(botPoints[i].x, botPoints[i].y + 2);
    }
    for (let i = segments; i >= 0; i--) {
      ctx.lineTo(botPoints[i].x - dirUp.x * 4, botPoints[i].y - dirUp.y * 4);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 2. Draw Bandana Body (Smoothly clipped to the curved band)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(topPoints[0].x, topPoints[0].y);
    for (let i = 1; i <= segments; i++) ctx.lineTo(topPoints[i].x, topPoints[i].y);
    for (let i = segments; i >= 0; i--) ctx.lineTo(botPoints[i].x, botPoints[i].y);
    ctx.closePath();
    ctx.clip();

    // Draw vertical quad slices with seamless diagonal bridge
    for (let i = 0; i < segments; i++) {
      const u0 = (i / segments) * texture.width;
      const u1 = ((i + 1) / segments) * texture.width;
      const sliceW = u1 - u0;

      const pTopL = topPoints[i];
      const pTopR = topPoints[i + 1];
      const pBotL = botPoints[i];
      const pBotR = botPoints[i + 1];

      this.drawTexturedQuad(ctx, texture, u0, 0, sliceW, texture.height, pTopL, pTopR, pBotR, pBotL);
    }

    // 3. 3D Cylindrical Shading & Highlight
    const leftPt = topPoints[0];
    const rightPt = topPoints[segments];
    const grad = ctx.createLinearGradient(leftPt.x, leftPt.y, rightPt.x, rightPt.y);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.62)'); // Deep temple wrap shadow
    grad.addColorStop(0.15, 'rgba(0, 0, 0, 0.12)');
    grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.18)'); // Forehead center light reflection
    grad.addColorStop(0.85, 'rgba(0, 0, 0, 0.12)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.62)'); // Deep temple wrap shadow

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.restore(); // Exit clipping

    // 4. Clean top and bottom edge stroke
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(topPoints[0].x, topPoints[0].y);
    for (let i = 1; i <= segments; i++) ctx.lineTo(topPoints[i].x, topPoints[i].y);
    ctx.moveTo(botPoints[0].x, botPoints[0].y);
    for (let i = 1; i <= segments; i++) ctx.lineTo(botPoints[i].x, botPoints[i].y);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Metode A: 3D FaceMesh Cylindrical UV Mesh Mapping
   * Deforms the decal across the 3D malar cheek dome, strictly aligned with
   * the horizontal eye-line (rollAngle) so the flag is level and upright,
   * while naturally curving over the cheekbone and responding to facial movement.
   */
  drawRealisticCheekSticker(ctx, pts, country, metrics) {
    const stickerTexture = window.TextureCache.getStickerTexture(country.id);
    const { rollAngle, faceWidth, yawRatio } = metrics;

    // Target decal size matching festival reference photo (~3cm x 2cm decal)
    const targetW = Math.max(8, Math.min(48, faceWidth * 0.135));
    const targetH = targetW * (stickerTexture.height / stickerTexture.width);

    // Anatomical MediaPipe Cheek Apexes (True Upper Malar Zygomatic Arch):
    // Right cheek: 117 (malar apex), 123, 205
    // Left cheek: 346 (malar apex), 352, 425
    const nose = pts[1] || { x: 0, y: 0 };
    const rightCenter = pts[117] || pts[123] || pts[205] || pts[50];
    const leftCenter = pts[346] || pts[352] || pts[425] || pts[280];

    // Safety Anatomical Clamping:
    // Decal MUST stay strictly on the upper/mid cheek, safely above the mouth line and below eye
    const screenEyeL = pts[33].x < pts[263].x ? pts[33] : pts[263];
    const screenEyeR = pts[33].x < pts[263].x ? pts[263] : pts[33];
    const pMouthTop = pts[13] || pts[14] || pts[0] || pts[61];
    const mouthY = pMouthTop ? pMouthTop.y : (nose.y + (faceHeight || 100) * 0.25);
    const eyeBottomY = Math.max(screenEyeL.y, screenEyeR.y) + (faceHeight || 100) * 0.08;
    const safeMaxY = mouthY - (faceHeight || 100) * 0.04;
    const safeMinY = eyeBottomY;

    // Face orientation vectors:
    // uH: Horizontal vector strictly parallel to eye axis (rollAngle) -> Flag stays level!
    // uV: Vertical vector perpendicular to eye axis (downwards)
    const cosR = Math.cos(rollAngle);
    const sinR = Math.sin(rollAngle);
    const uH = { x: cosR, y: sinR };
    const uV = { x: -sinR, y: cosR };

    const cheekList = [];
    if (this.settings.stickerSide === 'both') {
      if (rightCenter) cheekList.push({ center: rightCenter, isLeft: false });
      if (leftCenter) cheekList.push({ center: leftCenter, isLeft: true });
    } else if (this.settings.stickerSide === 'left') {
      const c = leftCenter || rightCenter;
      if (c) cheekList.push({ center: c, isLeft: true });
    } else if (this.settings.stickerSide === 'right') {
      const c = rightCenter || leftCenter;
      if (c) cheekList.push({ center: c, isLeft: false });
    } else {
      // Auto: choose cheek most prominently facing the camera
      const distRight = rightCenter ? Math.hypot(rightCenter.x - nose.x, rightCenter.y - nose.y) : 0;
      const distLeft = leftCenter ? Math.hypot(leftCenter.x - nose.x, leftCenter.y - nose.y) : 0;
      if (distLeft >= distRight) {
        cheekList.push({ center: leftCenter, isLeft: true });
      } else {
        cheekList.push({ center: rightCenter, isLeft: false });
      }
    }

    cheekList.forEach(cheek => {
      let { center, isLeft } = cheek;
      if (!center) return;

      // Ensure clamped within safe cheek boundary
      let clampedY = center.y;
      if (clampedY > safeMaxY) clampedY = safeMaxY;
      if (clampedY < safeMinY) clampedY = safeMinY;
      center = { x: center.x, y: clampedY };

      // Construct 3x3 mesh grid level with face orientation axes (uH, uV)
      // and warped over the 3D malar dome contour
      const grid = [];
      const R_x = faceWidth * 0.40; // Horizontal cheek curvature radius
      const R_y = faceWidth * 0.48; // Vertical cheek curvature radius

      for (let r = 0; r <= 2; r++) {
        grid[r] = [];
        const vNorm = r / 2; // 0 (top), 0.5 (middle), 1 (bottom)
        const phi = (vNorm - 0.5) * (targetH / R_y);
        const vCurved = R_y * Math.sin(phi);

        for (let c = 0; c <= 2; c++) {
          const uNorm = c / 2; // 0 (left), 0.5 (center), 1 (right)
          const theta = (uNorm - 0.5) * (targetW / R_x);
          const uCurved = R_x * Math.sin(theta);

          // Perspective foreshortening: outer edge toward ear recedes into background in 3D
          const earDir = isLeft ? 1 : -1;
          const outerFactor = (uNorm - 0.5) * earDir;
          const persCompress = 1.0 - outerFactor * (yawRatio || 0) * 0.25;

          // 3D Malar Dome spherical displacement (apex at center r=1, c=1)
          const dome = Math.sin(uNorm * Math.PI) * Math.sin(vNorm * Math.PI);
          const domeBulge = dome * (targetW * 0.05);

          // Compute warped vertex in screen space strictly aligned with face orientation
          const px = center.x + (uCurved * persCompress) * uH.x + (vCurved - domeBulge * 0.2) * uV.x;
          const py = center.y + (uCurved * persCompress) * uH.y + (vCurved - domeBulge * 0.2) * uV.y;

          grid[r][c] = { x: px, y: py };
        }
      }

      ctx.save();

      // A. Soft micro contact shadow under decal (sits naturally flush on skin)
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
      ctx.filter = 'blur(1.8px)';
      ctx.translate(0.6, 1.2);
      this.drawDecalPath(ctx, grid);
      ctx.fill();
      ctx.restore();

      // B. Render 8-triangle UV mesh with subtle skin pore integration
      ctx.save();
      ctx.globalAlpha = 0.94; // Realistic skin translucency

      // Clip smoothly along the curved outer contour
      this.drawDecalPath(ctx, grid);
      ctx.clip();

      const cellW = stickerTexture.width / 2;
      const cellH = stickerTexture.height / 2;

      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 2; c++) {
          const sx = c * cellW;
          const sy = r * cellH;
          const q0 = grid[r][c];
          const q1 = grid[r][c + 1];
          const q2 = grid[r + 1][c + 1];
          const q3 = grid[r + 1][c];

          this.drawTexturedQuad(ctx, stickerTexture, sx, sy, cellW, cellH, q0, q1, q2, q3);
        }
      }

      // C. 3D Malar Dome Highlight & Ambient Shading
      // Adds subtle light sheen over the fleshy cheek apex
      const grad = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, targetW * 0.7);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.14)'); // Subtle malar apex light reflection
      grad.addColorStop(0.65, 'rgba(255, 255, 255, 0.0)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.12)'); // Soft edge wrap shadow
      ctx.fillStyle = grad;
      ctx.fillRect(center.x - targetW, center.y - targetH, targetW * 2, targetH * 2);

      ctx.restore(); // Exit clipping

      // D. Clean die-cut decal edge rim (matte vinyl sticker finish)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 0.8;
      this.drawDecalPath(ctx, grid);
      ctx.stroke();

      ctx.restore();
    });
  }

  /**
   * Traces smooth rounded contour path around 3x3 decal grid vertices
   */
  drawDecalPath(ctx, grid) {
    const pTL = grid[0][0];
    const pTC = grid[0][1];
    const pTR = grid[0][2];
    const pMR = grid[1][2];
    const pBR = grid[2][2];
    const pBC = grid[2][1];
    const pBL = grid[2][0];
    const pML = grid[1][0];

    ctx.beginPath();
    ctx.moveTo(pTL.x + (pTC.x - pTL.x) * 0.25, pTL.y + (pTC.y - pTL.y) * 0.25);
    ctx.lineTo(pTR.x - (pTR.x - pTC.x) * 0.25, pTR.y - (pTR.y - pTC.y) * 0.25);
    ctx.quadraticCurveTo(pTR.x, pTR.y, pTR.x + (pMR.x - pTR.x) * 0.25, pTR.y + (pMR.y - pTR.y) * 0.25);
    ctx.lineTo(pBR.x - (pBR.x - pMR.x) * 0.25, pBR.y - (pBR.y - pMR.y) * 0.25);
    ctx.quadraticCurveTo(pBR.x, pBR.y, pBR.x - (pBR.x - pBC.x) * 0.25, pBR.y - (pBR.y - pBC.y) * 0.25);
    ctx.lineTo(pBL.x + (pBC.x - pBL.x) * 0.25, pBL.y + (pBC.y - pBL.y) * 0.25);
    ctx.quadraticCurveTo(pBL.x, pBL.y, pBL.x - (pBL.x - pML.x) * 0.25, pBL.y - (pBL.y - pML.y) * 0.25);
    ctx.lineTo(pTL.x + (pML.x - pTL.x) * 0.25, pTL.y + (pML.y - pTL.y) * 0.25);
    ctx.quadraticCurveTo(pTL.x, pTL.y, pTL.x + (pTC.x - pTL.x) * 0.25, pTL.y + (pTC.y - pTL.y) * 0.25);
    ctx.closePath();
  }

  /**
   * Helper to draw a distorted textured quad slice with seamless diagonal bridge
   */
  drawTexturedQuad(ctx, img, sx, sy, sw, sh, p0, p1, p2, p3) {
    // Triangular split 1: p0, p1, p3
    this.renderTriangle(ctx, img, sx, sy, sx + sw, sy, sx, sy + sh, p0.x, p0.y, p1.x, p1.y, p3.x, p3.y);

    // Triangular split 2: p1, p2, p3
    this.renderTriangle(ctx, img, sx + sw, sy, sx + sw, sy + sh, sx, sy + sh, p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
  }

  /**
   * Affine transformation triangle mapping for canvas 2D with subpixel bleed
   */
  renderTriangle(ctx, im, u0, v0, u1, v1, u2, v2, x0, y0, x1, y1, x2, y2) {
    const delta = u0 * v1 + v0 * u2 + u1 * v2 - v1 * u2 - v0 * u1 - u0 * v2;
    if (Math.abs(delta) < 0.0001) return;

    const deltaA = x0 * v1 + v0 * x2 + x1 * v2 - v1 * x2 - v0 * x1 - x0 * v2;
    const deltaB = u0 * x1 + x0 * u2 + u1 * x2 - x1 * u2 - x0 * u1 - u0 * x2;
    const deltaC = u0 * v1 * x2 + v0 * x1 * u2 + x0 * u1 * v2 - x0 * v1 * u2 - v0 * u1 * x2 - u0 * x1 * v2;
    const deltaD = y0 * v1 + v0 * y2 + y1 * v2 - v1 * y2 - v0 * y1 - y0 * v2;
    const deltaE = u0 * y1 + y0 * u2 + u1 * y2 - y1 * u2 - y0 * u1 - u0 * y2;
    const deltaF = u0 * v1 * y2 + v0 * y1 * u2 + y0 * u1 * v2 - y0 * v1 * u2 - v0 * u1 * y2 - u0 * y1 * v2;

    ctx.save();
    // Subpixel bleed along triangle vertices outward from centroid to eliminate seams
    const cx = (x0 + x1 + x2) / 3;
    const cy = (y0 + y1 + y2) / 3;
    const bleed = 0.4;
    const d0 = Math.hypot(x0 - cx, y0 - cy) || 1;
    const d1 = Math.hypot(x1 - cx, y1 - cy) || 1;
    const d2 = Math.hypot(x2 - cx, y2 - cy) || 1;

    ctx.beginPath();
    ctx.moveTo(x0 + ((x0 - cx) / d0) * bleed, y0 + ((y0 - cy) / d0) * bleed);
    ctx.lineTo(x1 + ((x1 - cx) / d1) * bleed, y1 + ((y1 - cy) / d1) * bleed);
    ctx.lineTo(x2 + ((x2 - cx) / d2) * bleed, y2 + ((y2 - cy) / d2) * bleed);
    ctx.closePath();
    ctx.clip();

    ctx.transform(deltaA / delta, deltaD / delta, deltaB / delta, deltaE / delta, deltaC / delta, deltaF / delta);
    ctx.drawImage(im, 0, 0);
    ctx.restore();
  }

  /**
   * Renders modern floating badge with country name and flag emoji above the head
   */
  drawCountryBadge(ctx, pts, country, rollAngle, faceWidth) {
    const topPt = pts[10]; // Forehead top
    if (!topPt) return;

    ctx.save();

    // Floating position neatly above forehead top and headband
    const badgeY = topPt.y - faceWidth * 0.28;
    const badgeX = topPt.x;

    ctx.translate(badgeX, badgeY);
    // Scale badge proportionally for distant small faces
    const badgeScale = Math.max(0.35, Math.min(1.0, faceWidth / 180));
    ctx.scale(badgeScale, badgeScale);

    const labelText = `${country.emoji} ${country.name.toUpperCase()}`;
    ctx.font = 'bold 15px "Plus Jakarta Sans", Outfit, system-ui, sans-serif';

    const textMetrics = ctx.measureText(labelText);
    const badgeW = textMetrics.width + 26;
    const badgeH = 32;

    // Glassmorphism Pill Background
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.82)'; // Slate dark glass
    ctx.strokeStyle = country.colors[0] || 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.roundRect(-badgeW / 2, -badgeH / 2, badgeW, badgeH, 16);
    ctx.fill();
    ctx.stroke();

    // Inner subtle glow
    ctx.shadowColor = 'transparent';

    // Label Text
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labelText, 0, 1);

    ctx.restore();
  }
}

window.ARRenderer = ARRenderer;
