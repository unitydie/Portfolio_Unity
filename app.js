(() => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

  // Matrix 3D background (Three.js, local vendor). Disabled for reduced motion.
  const initMatrix3D = () => {
    if (prefersReducedMotion) return false;
    const container = document.getElementById("canvas-container");
    if (!container) return false;
    if (typeof window.THREE === "undefined") return false;

    try {
      const THREE = window.THREE;

      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0x000000, 15, 60);

      const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
      camera.position.set(0, 0, 20);

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearAlpha(0);
      container.appendChild(renderer.domElement);

      // Mouse tracking
      const mouse = { x: 0, y: 0 };
      const targetMouse = { x: 0, y: 0 };

      // Matrix Rain Particles
      const getParticleCount = () => {
        const w = window.innerWidth || 1024;
        if (w < 768) return 1000;
        if (w < 1024) return 1500;
        return 2000;
      };

      let particleCount = getParticleCount();
      let geometry = null;
      let particleSystem = null;
      let velocities = null;

      const buildParticles = () => {
        if (particleSystem) {
          scene.remove(particleSystem);
          particleSystem.geometry.dispose();
          particleSystem.material.dispose();
          particleSystem = null;
        }

        particleCount = getParticleCount();
        geometry = new THREE.BufferGeometry();

        const positions = new Float32Array(particleCount * 3);
        velocities = new Float32Array(particleCount);
        const sizes = new Float32Array(particleCount);
        const colors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3;
          positions[i3] = (Math.random() - 0.5) * 80;
          positions[i3 + 1] = (Math.random() - 0.5) * 80;
          positions[i3 + 2] = (Math.random() - 0.5) * 50;
          velocities[i] = Math.random() * 0.08 + 0.02;
          sizes[i] = Math.random() * 0.3 + 0.1;

          const brightness = Math.random() * 0.6 + 0.4;
          colors[i3] = 0;
          colors[i3 + 1] = brightness;
          colors[i3 + 2] = brightness * 0.2;
        }

        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

        const particleMaterial = new THREE.PointsMaterial({
          size: 0.2,
          sizeAttenuation: true,
          vertexColors: true,
          transparent: true,
          opacity: 0.8,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });

        particleSystem = new THREE.Points(geometry, particleMaterial);
        scene.add(particleSystem);
      };

      buildParticles();

      // Grid
      const gridSize = 50;
      const gridDivisions = 50;
      const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x00ff00, 0x003300);
      gridHelper.position.y = -15;
      gridHelper.rotation.x = Math.PI / 6;
      gridHelper.material.transparent = true;
      gridHelper.material.opacity = 0.3;
      scene.add(gridHelper);

      const verticalGrid = new THREE.GridHelper(gridSize, gridDivisions, 0x00ff00, 0x002200);
      verticalGrid.rotation.x = Math.PI / 2;
      verticalGrid.position.z = -20;
      verticalGrid.material.transparent = true;
      verticalGrid.material.opacity = 0.15;
      scene.add(verticalGrid);

      // Floating Shapes
      const shapeGeometries = [
        new THREE.TetrahedronGeometry(1.5, 0),
        new THREE.OctahedronGeometry(1.2, 0),
        new THREE.IcosahedronGeometry(1.3, 0),
        new THREE.TorusGeometry(1, 0.4, 8, 16),
      ];

      const getShapeCount = () => {
        const w = window.innerWidth || 1024;
        if (w < 768) return 4;
        if (w < 1024) return 6;
        return 8;
      };

      const shapes = [];
      const buildShapes = () => {
        shapes.splice(0, shapes.length);
        const shapeCount = getShapeCount();
        for (let i = 0; i < shapeCount; i++) {
          const geom = shapeGeometries[(Math.random() * shapeGeometries.length) | 0];
          const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            wireframe: true,
            transparent: true,
            opacity: Math.random() * 0.2 + 0.15,
          });
          const mesh = new THREE.Mesh(geom, material);
          mesh.position.set((Math.random() - 0.5) * 30, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20);
          mesh.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);
          shapes.push({
            mesh,
            rotationSpeed: {
              x: (Math.random() - 0.5) * 0.02,
              y: (Math.random() - 0.5) * 0.02,
              z: (Math.random() - 0.5) * 0.02,
            },
            floatSpeed: Math.random() * 0.5 + 0.3,
            floatOffset: Math.random() * Math.PI * 2,
          });
          scene.add(mesh);
        }
      };
      buildShapes();

      // Lights
      scene.add(new THREE.AmbientLight(0x00ff00, 0.3));
      const pointLight1 = new THREE.PointLight(0x00ff00, 1, 50);
      pointLight1.position.set(10, 10, 10);
      scene.add(pointLight1);
      const pointLight2 = new THREE.PointLight(0x00ff00, 0.5, 50);
      pointLight2.position.set(-10, -10, -10);
      scene.add(pointLight2);

      const handleResize = () => {
        const rect = container.getBoundingClientRect();
        const w = Math.max(1, Math.floor(rect.width));
        const h = Math.max(1, Math.floor(rect.height));
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);

        // Rebuild particle count when crossing breakpoints
        const nextCount = getParticleCount();
        const nextShapes = getShapeCount();
        if (nextCount !== particleCount) buildParticles();
        if (nextShapes !== shapes.length) {
          // remove old meshes
          for (const s of shapes) {
            scene.remove(s.mesh);
            s.mesh.geometry.dispose();
            s.mesh.material.dispose();
          }
          buildShapes();
        }
      };

      const handlePointerMove = (clientX, clientY) => {
        const rect = container.getBoundingClientRect();
        targetMouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        targetMouse.y = ((clientY - rect.top) / rect.height) * 2 - 1;
      };

      window.addEventListener("resize", handleResize, { passive: true });
      window.addEventListener(
        "mousemove",
        (e) => handlePointerMove(e.clientX, e.clientY),
        { passive: true }
      );
      window.addEventListener(
        "touchmove",
        (e) => {
          if (!e.touches || e.touches.length === 0) return;
          handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
        },
        { passive: true }
      );

      handleResize();

      let time = 0;
      let raf = 0;

      const animate = () => {
        raf = requestAnimationFrame(animate);
        time += 0.01;

        mouse.x += (targetMouse.x - mouse.x) * 0.05;
        mouse.y += (targetMouse.y - mouse.y) * 0.05;

        // Update particles
        const pos = particleSystem.geometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3;
          pos[i3 + 1] -= velocities[i];
          if (pos[i3 + 1] < -40) {
            pos[i3 + 1] = 40;
            pos[i3] = (Math.random() - 0.5) * 80;
            pos[i3 + 2] = (Math.random() - 0.5) * 50;
          }
        }
        particleSystem.geometry.attributes.position.needsUpdate = true;
        particleSystem.rotation.y += 0.0001;

        // Update shapes
        for (const s of shapes) {
          s.mesh.rotation.x += s.rotationSpeed.x;
          s.mesh.rotation.y += s.rotationSpeed.y;
          s.mesh.rotation.z += s.rotationSpeed.z;
          s.mesh.position.y += Math.sin(time * s.floatSpeed + s.floatOffset) * 0.01;
        }

        // Camera movement
        camera.position.x += (mouse.x * 5 - camera.position.x) * 0.03;
        camera.position.y += (-mouse.y * 3 - camera.position.y) * 0.03;
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
      };

      animate();

      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          if (raf) cancelAnimationFrame(raf);
          raf = 0;
        } else if (!raf) {
          animate();
        }
      });

      return true;
    } catch {
      return false;
    }
  };

  const matrix3dEnabled = initMatrix3D();
  if (matrix3dEnabled) document.body.classList.add("matrix-3d");

  // Hero enter animation + sound-ready hover hooks
  if (prefersReducedMotion) document.body.classList.add("is-loaded");
  else requestAnimationFrame(() => document.body.classList.add("is-loaded"));

  $$(".btn--sfx").forEach((btn) => {
    btn.classList.add("sfx-ready");
    btn.addEventListener("pointerenter", () => btn.classList.add("is-sfx-hover"));
    btn.addEventListener("pointerleave", () => btn.classList.remove("is-sfx-hover"));
  });

  // Download CV button animation (vanilla, offline)
  const cvBtn = $(".cv-download");
  if (cvBtn) {
    const cvText = $(".cv-download__text", cvBtn);
    const cvPath = $(".cv-download__check", cvBtn);

    const initPath = () => {
      if (!cvPath) return { len: 0 };
      let len = 0;
      try {
        len = Math.ceil(cvPath.getTotalLength());
      } catch {
        len = 60;
      }
      if (!Number.isFinite(len) || len <= 0) len = 60;
      cvPath.style.strokeDasharray = `${len}`;
      cvPath.style.strokeDashoffset = `${len}`;
      return { len };
    };

    const { len: checkLen } = initPath();

    const triggerDownload = () => {
      const href = cvBtn.getAttribute("href");
      if (!href) return;
      const a = document.createElement("a");
      a.href = href;
      a.download = cvBtn.getAttribute("download") || "";
      document.body.appendChild(a);
      a.click();
      a.remove();
    };

    const reset = () => {
      cvBtn.classList.remove("is-animating", "is-done");
      if (cvText) cvText.style.opacity = "";
      if (cvPath && checkLen) cvPath.style.strokeDashoffset = `${checkLen}`;
    };

    cvBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (cvBtn.classList.contains("is-animating")) return;

      if (prefersReducedMotion) {
        triggerDownload();
        return;
      }

      reset();
      cvBtn.classList.add("is-animating");

      // Kick off download shortly after the morph starts (keeps user on page).
      window.setTimeout(triggerDownload, 650);

      // Draw check once the circle + icon are fully visible.
      window.setTimeout(() => {
        if (cvPath) cvPath.style.strokeDashoffset = "0";
      }, 2850);

      // Lock in final state, then reset so it can be clicked again.
      window.setTimeout(() => cvBtn.classList.add("is-done"), 2920);
      window.setTimeout(reset, 4800);
    });
  }

  // Back to top button
  const backToTop = $("#back-to-top");
  const syncBackToTop = () => {
    if (!backToTop) return;
    backToTop.classList.toggle("is-visible", window.scrollY > 500);
  };
  window.addEventListener("scroll", syncBackToTop, { passive: true });
  syncBackToTop();

  backToTop?.addEventListener("click", () => {
    if (prefersReducedMotion) return window.scrollTo(0, 0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Image fallback (profile + project thumbs)
  const attachImgFallback = (img, fallbackSrc, missingClassTarget) => {
    if (!img) return;
    let triedFallback = false;
    img.addEventListener("error", () => {
      if (!triedFallback && fallbackSrc) {
        triedFallback = true;
        img.src = fallbackSrc;
        return;
      }
      missingClassTarget?.classList?.add("is-missing");
    });
  };

  const avatarImg = $(".avatar-img");
  attachImgFallback(avatarImg, "assets/img/profile-placeholder.png", avatarImg?.closest(".avatar-frame"));

  const preferAvatar = avatarImg?.getAttribute("data-prefer-src");
  if (avatarImg && preferAvatar) {
    const probe = new Image();
    probe.onload = () => {
      avatarImg.src = preferAvatar;
    };
    probe.src = preferAvatar;
  }

  $$(".thumb img").forEach((img) => attachImgFallback(img, "", img.closest(".thumb")));

  // Projects: vertical scroll drives horizontal projects track (desktop only)
  const initProjectsHScroll = () => {
    const root = document.querySelector("[data-hscroll]");
    if (!root || prefersReducedMotion) return;

    const sticky = root.querySelector(".projects-hscroll__sticky");
    const track = root.querySelector(".projects-hscroll__track");
    if (!sticky || !track) return;

    const mqlDesktop = window.matchMedia("(min-width: 981px)");

    let enabled = mqlDesktop.matches;
    let startY = 0;
    let distance = 0;
    let raf = 0;

    const clamp01 = (v) => Math.max(0, Math.min(1, v));

    const reset = () => {
      root.style.height = "";
      track.style.transform = "";
    };

    const measure = () => {
      enabled = mqlDesktop.matches && !prefersReducedMotion;
      if (!enabled) {
        reset();
        return;
      }

      // Ensure layout has settled
      const stickyRect = sticky.getBoundingClientRect();
      const viewportW = Math.max(1, Math.floor(stickyRect.width));
      const stickyH = Math.max(1, Math.floor(stickyRect.height));

      distance = Math.max(0, Math.floor(track.scrollWidth - viewportW));
      startY = Math.floor(sticky.getBoundingClientRect().top + window.scrollY);

      // Provide enough vertical scroll room to translate the track fully
      root.style.height = `${stickyH + distance}px`;

      // Apply once
      onScroll();
    };

    const render = () => {
      raf = 0;
      if (!enabled || distance <= 0) {
        track.style.transform = "";
        return;
      }

      const y = window.scrollY;
      const t = clamp01((y - startY) / distance);
      const x = Math.round(-t * distance);
      track.style.transform = `translate3d(${x}px, 0, 0)`;
    };

    const onScroll = () => {
      if (!enabled) return;
      if (raf) return;
      raf = requestAnimationFrame(render);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", () => requestAnimationFrame(measure), { passive: true });
    mqlDesktop.addEventListener?.("change", () => requestAnimationFrame(measure));

    // Initial
    requestAnimationFrame(measure);
  };
  initProjectsHScroll();

  // Effects: no UI toggles (Rain is ON by default; disabled for prefers-reduced-motion)
  const rainEnabled = !prefersReducedMotion && !matrix3dEnabled;
  document.body.classList.toggle("rain-off", !rainEnabled);

  // Pixel rain (canvas, behind content)
  const rainCanvas = $("#rain");
  const rainEngine = (() => {
    if (!rainCanvas || prefersReducedMotion || matrix3dEnabled) return null;

    const ctx = rainCanvas.getContext("2d", { alpha: true });
    if (!ctx) return null;

    const off = document.createElement("canvas");
    const offCtx = off.getContext("2d", { alpha: true });
    if (!offCtx) return null;

    // Optional raindrop sprite (falls back to pixel streaks if missing)
    const dropImg = new Image();
    let dropStamp = null;
    dropImg.decoding = "async";
    dropImg.loading = "eager";
    dropImg.onload = () => {
      const stamp = document.createElement("canvas");
      // Keep enough detail so the droplet looks like the source image (pixelated),
      // then scale at render-time.
      // IMPORTANT: don't downsample too far or the droplet becomes a block.
      // Target on-screen size: 32x48 (which is 3x smaller than the previous 96x144).
      stamp.width = 32;
      stamp.height = 48;
      const sctx = stamp.getContext("2d", { alpha: true });
      if (!sctx) return;
      sctx.imageSmoothingEnabled = false;
      sctx.clearRect(0, 0, stamp.width, stamp.height);
      sctx.drawImage(dropImg, 0, 0, stamp.width, stamp.height);
      dropStamp = stamp;
    };
    dropImg.onerror = () => {
      dropStamp = null;
    };
    dropImg.src = "assets/img/drop.png";

    let w = 0;
    let h = 0;
    let dpr = 1;
    let scale = 3;
    let ow = 0;
    let oh = 0;
    let groundY = 0;

    let raf = 0;
    let running = false;

    const drops = [];
    const splashes = [];
    const ripples = [];

    let wind = 0;
    let windTarget = 0;
    let nextWindAt = 0;

    let dropTarget = 0;
    let dropMin = 50;
    let dropMax = 260;

    let frameCount = 0;
    let fpsWindowStart = performance.now();

    const rand = (min, max) => min + Math.random() * (max - min);
    const rint = (min, max) => Math.floor(rand(min, max + 1));
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

    const makeDrop = () => ({
      x: rand(0, ow),
      y: rand(-oh, 0),
      v: rand(0.85, 2.25),
      len: rint(5, 11),
      a: rand(0.08, 0.16),
      w: Math.random() < 0.18 ? 2 : 1,
      drift: rand(-0.08, 0.08),
    });

    const ensureDrops = () => {
      dropTarget = clamp(Math.floor(ow * 0.28), dropMin, dropMax);
      while (drops.length < dropTarget) drops.push(makeDrop());
      while (drops.length > dropTarget) drops.pop();
    };

    const resize = () => {
      w = Math.floor(window.innerWidth);
      h = Math.floor(window.innerHeight);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      scale = w < 720 ? 2 : 3;

      rainCanvas.width = Math.floor(w * dpr);
      rainCanvas.height = Math.floor(h * dpr);
      rainCanvas.style.width = `${w}px`;
      rainCanvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;

      ow = Math.max(1, Math.floor(w / scale));
      oh = Math.max(1, Math.floor(h / scale));
      off.width = ow;
      off.height = oh;
      offCtx.imageSmoothingEnabled = false;

      groundY = oh - 4;
      dropMin = w < 720 ? 40 : 60;
      dropMax = w < 720 ? 140 : 260;

      ensureDrops();
    };

    const spawnSplash = (x, y) => {
      const now = performance.now();
      const life = rint(170, 230);

      const diagonalCount = rint(2, 4);
      const dirs = [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ];

      // shuffle dirs
      for (let i = dirs.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
      }

      const parts = [];
      for (let i = 0; i < diagonalCount; i++) {
        const [dx, dy] = dirs[i];
        parts.push({ dx, dy, dist: rand(1.2, 2.4) });
      }

      const crownCount = rint(1, 2);
      for (let i = 0; i < crownCount; i++) {
        parts.push({ dx: rand(-0.35, 0.35), dy: rand(-1.6, -1.05), dist: rand(0.7, 1.2), crown: true });
      }

      splashes.push({ x: Math.round(x), y: Math.round(y), born: now, life, parts });
    };

    const spawnRipple = (x, y) => {
      const now = performance.now();
      const life = rint(520, 820);
      const maxR = rint(4, 8);
      ripples.push({ x: Math.round(x), y: Math.round(y), born: now, life, maxR });
    };

    const drawRipple = (r, alpha) => {
      const ri = Math.max(1, Math.round(r));
      const pts = new Set();
      const step = Math.PI / 8; // 22.5deg
      for (let a = 0; a < Math.PI * 2; a += step) {
        const px = Math.round(Math.cos(a) * ri);
        const py = Math.round(Math.sin(a) * ri);
        pts.add(`${px},${py}`);
      }
      offCtx.globalAlpha = alpha;
      for (const key of pts) {
        const [dx, dy] = key.split(",").map((v) => parseInt(v, 10));
        offCtx.fillRect(dx, dy, 1, 1);
      }
      offCtx.globalAlpha = 1;
    };

    const step = (t) => {
      if (!running) return;

      frameCount++;
      if (t - fpsWindowStart >= 1200) {
        const fps = (frameCount * 1000) / (t - fpsWindowStart);
        fpsWindowStart = t;
        frameCount = 0;

        if (fps < 52 && dropTarget > dropMin) {
          dropTarget = Math.max(dropMin, Math.floor(dropTarget * 0.88));
          drops.length = Math.min(drops.length, dropTarget);
        } else if (fps > 58 && dropTarget < dropMax) {
          dropTarget = Math.min(dropMax, dropTarget + 10);
          while (drops.length < dropTarget) drops.push(makeDrop());
        }
      }

      if (t > nextWindAt) {
        windTarget = rand(-0.35, 0.35);
        nextWindAt = t + rint(1500, 3200);
      }
      wind += (windTarget - wind) * 0.02;

      offCtx.clearRect(0, 0, ow, oh);

      // Drops
      offCtx.fillStyle = "rgba(180,200,215,1)";
      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        d.y += d.v;
        d.x += wind * d.v * 0.18 + d.drift;

        if (d.x < -4) d.x = ow + 4;
        if (d.x > ow + 4) d.x = -4;

        const x = Math.round(d.x);
        const y = Math.round(d.y);

        // If we have the droplet sprite, render rain as the droplet image (no streaks).
        // Keep the splash/ripple system at the bottom unchanged.
        const hasSprite = !!dropStamp;
        const DROP_SCALE = 1;
        const dw = hasSprite ? dropStamp.width * DROP_SCALE : d.w;
        const dh = hasSprite ? dropStamp.height * DROP_SCALE : d.len;
        const bottomY = y + dh;

        if (bottomY > groundY) {
          spawnSplash(d.x, groundY);
          if (Math.random() < 0.035) spawnRipple(d.x, groundY + 1);
          d.x = rand(0, ow);
          d.y = rand(-oh * 0.35, 0);
          d.v = rand(0.85, 2.25);
          d.len = rint(5, 11);
          d.a = rand(0.08, 0.16);
          d.w = Math.random() < 0.18 ? 2 : 1;
          d.drift = rand(-0.08, 0.08);
          continue;
        }

        offCtx.globalAlpha = d.a;
        if (hasSprite) {
          // Draw one droplet sprite per raindrop (the user-provided image).
          offCtx.globalAlpha = Math.max(0.14, d.a);
          offCtx.drawImage(dropStamp, x - ((dw / 2) | 0), y, dw, dh);
        } else {
          // Fallback (no sprite): draw pixel streaks
          for (let k = 0; k < d.len; k += 2) {
            offCtx.fillRect(x, y + k, d.w, 1);
          }
        }
      }
      offCtx.globalAlpha = 1;

      // Splashes (3–7 pixels around impact)
      for (let i = splashes.length - 1; i >= 0; i--) {
        const s = splashes[i];
        const age = t - s.born;
        const p = age / s.life;
        if (p >= 1) {
          splashes.splice(i, 1);
          continue;
        }

        const baseAlpha = 0.22 * (1 - p);
        offCtx.fillStyle = "rgba(200,218,232,1)";

        // Central pixel (quick)
        if (p < 0.35) {
          offCtx.globalAlpha = baseAlpha * (1 - p * 1.8);
          offCtx.fillRect(s.x, s.y, 1, 1);
        }

        offCtx.globalAlpha = baseAlpha;
        for (const part of s.parts) {
          const dist = part.dist * (0.3 + p);
          const px = Math.round(s.x + part.dx * dist);
          const py = Math.round(s.y + part.dy * dist);
          offCtx.fillRect(px, py, 1, 1);
        }
        offCtx.globalAlpha = 1;
      }

      // Ripples (subtle, low frequency)
      offCtx.fillStyle = "rgba(190,208,224,1)";
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        const age = t - r.born;
        const p = age / r.life;
        if (p >= 1) {
          ripples.splice(i, 1);
          continue;
        }
        const radius = r.maxR * p;
        const alpha = 0.09 * (1 - p);
        offCtx.save();
        offCtx.translate(r.x, r.y);
        drawRipple(radius, alpha);
        offCtx.restore();
      }

      // Present to screen (nearest-neighbor)
      ctx.clearRect(0, 0, w, h);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, 0, 0, ow, oh, 0, 0, w, h);

      raf = requestAnimationFrame(step);
    };

    const start = () => {
      if (running) return;
      running = true;
      resize();
      ensureDrops();
      raf = requestAnimationFrame(step);
    };

    const stop = () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      ctx.clearRect(0, 0, w, h);
      offCtx.clearRect(0, 0, ow, oh);
      splashes.length = 0;
      ripples.length = 0;
    };

    window.addEventListener("resize", () => {
      if (!running) return;
      resize();
      ensureDrops();
    });

     document.addEventListener("visibilitychange", () => {
       if (document.hidden) stop();
       else if (rainEnabled) start();
     });

    return { start, stop };
  })();

  // Start rain if enabled
  if (rainEnabled && rainEngine) rainEngine.start();
})();
