/* ===================================================================
   LAKSHYA 2047 — Holographic AI Core Animation + Voice Assistant Logic
   Cyberpunk / JARVIS-inspired premium sphere with particles & HUD
   =================================================================== */

(function () {
  'use strict';

  // =========================================================
  //  DOM Refs
  // =========================================================
  const canvas       = document.getElementById('network-canvas');
  const ctx          = canvas.getContext('2d');
  const statusLabel  = document.getElementById('status');
  const chatLog      = document.getElementById('chat-log');
  const inputField   = document.getElementById('text-input');
  const micBtn       = document.getElementById('mic-btn');
  const sendBtn      = document.getElementById('send-btn');
  const speechBanner = document.getElementById('speech-banner');

  // =========================================================
  //  Animation Config
  // =========================================================
  const SPHERE_SCALE   = 0.28;   // fraction of min(w,h)
  const PERSPECTIVE    = 500;
  const DOT_BASE       = 1.2;
  const LAT_LINES      = 20;
  const LON_LINES      = 40;
  const PARTICLE_COUNT = 80;     // floating ambient particles
  const DRIFT_COUNT    = 40;     // outward-drifting particles
  const RING_COUNT     = 4;
  const HUD_ARC_COUNT  = 6;

  let currentState = 'idle';
  let rotY = 0;
  let rotX = 0.3;
  let time = 0;
  let animFrameId = null;

  // ---- Color palette ----
  const PALETTE = {
    cyan:    { r: 0,   g: 229, b: 255 },
    blue:    { r: 30,  g: 144, b: 255 },
    purple:  { r: 138, g: 43,  b: 226 },
    magenta: { r: 255, g: 0,   b: 128 },
    teal:    { r: 0,   g: 200, b: 220 },
    gold:    { r: 212, g: 148, b: 58  },
    green:   { r: 110, g: 231, b: 183 },
  };

  // ---- Pre-compute sphere points ----
  const spherePoints = [];
  for (let lat = 1; lat < LAT_LINES; lat++) {
    const phi = (Math.PI * lat) / LAT_LINES;
    const lonCount = Math.round(LON_LINES * Math.sin(phi));
    for (let lon = 0; lon < lonCount; lon++) {
      const theta = (2 * Math.PI * lon) / lonCount;
      spherePoints.push({
        x: Math.sin(phi) * Math.cos(theta),
        y: Math.cos(phi),
        z: Math.sin(phi) * Math.sin(theta),
        // Assign random color from palette
        colorIdx: Math.random(),
      });
    }
  }

  // ---- Floating ambient particles ----
  const ambientParticles = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    ambientParticles.push({
      x: Math.random(),
      y: Math.random(),
      size: 0.5 + Math.random() * 1.5,
      speed: 0.0002 + Math.random() * 0.0005,
      phase: Math.random() * Math.PI * 2,
      alpha: 0.1 + Math.random() * 0.3,
    });
  }

  // ---- Outward-drifting particles (emitted from sphere) ----
  let driftParticles = [];
  function emitDrift(cx, cy, radius) {
    if (driftParticles.length > 120) return;
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.3 + Math.random() * 0.8;
    driftParticles.push({
      x: cx + Math.cos(angle) * radius * 0.6,
      y: cy + Math.sin(angle) * radius * 0.6,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1.0,
      decay: 0.003 + Math.random() * 0.008,
      size: 0.5 + Math.random() * 1.5,
    });
  }

  // ---- Orbital ring definitions ----
  const orbitalRings = [
    { tiltX:  0.5,  tiltZ:  0.2,  radiusMul: 1.2,  speed: 1.0,  width: 1.5 },
    { tiltX: -0.4,  tiltZ: -0.6,  radiusMul: 1.35, speed: 0.6,  width: 1.0 },
    { tiltX:  0.2,  tiltZ:  0.8,  radiusMul: 1.5,  speed: 1.4,  width: 0.8 },
    { tiltX: -0.1,  tiltZ:  0.3,  radiusMul: 1.1,  speed: 0.9,  width: 1.8 },
  ];

  // ---- HUD arc segments ----
  const hudArcs = [];
  for (let i = 0; i < HUD_ARC_COUNT; i++) {
    hudArcs.push({
      radiusMul: 1.25 + Math.random() * 0.5,
      startAngle: Math.random() * Math.PI * 2,
      arcLen: 0.2 + Math.random() * 0.6,
      speed: (Math.random() - 0.5) * 0.005,
      width: 0.5 + Math.random() * 1.0,
      dash: Math.random() > 0.5,
    });
  }

  // =========================================================
  //  Canvas Setup
  // =========================================================
  function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width  = rect.width  * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    canvas.style.width  = rect.width  + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  }

  // =========================================================
  //  3D Helpers
  // =========================================================
  function rotYf(p, a) {
    const c = Math.cos(a), s = Math.sin(a);
    return { x: p.x*c - p.z*s, y: p.y, z: p.x*s + p.z*c };
  }
  function rotXf(p, a) {
    const c = Math.cos(a), s = Math.sin(a);
    return { x: p.x, y: p.y*c - p.z*s, z: p.y*s + p.z*c };
  }
  function rotZf(p, a) {
    const c = Math.cos(a), s = Math.sin(a);
    return { x: p.x*c - p.y*s, y: p.x*s + p.y*c, z: p.z };
  }
  function projectPt(p, cx, cy, radius) {
    const scale = PERSPECTIVE / (PERSPECTIVE + p.z * radius);
    return { x: cx + p.x*radius*scale, y: cy + p.y*radius*scale, scale, z: p.z };
  }

  // =========================================================
  //  Color Helpers
  // =========================================================
  function lerpColor(a, b, t) {
    return {
      r: Math.round(a.r + (b.r - a.r) * t),
      g: Math.round(a.g + (b.g - a.g) * t),
      b: Math.round(a.b + (b.b - a.b) * t),
    };
  }

  function getPointColor(colorIdx, t) {
    // Cycle through cyan → blue → purple → magenta based on colorIdx + time
    const phase = (colorIdx + t * 0.00005) % 1;
    if (phase < 0.33) return lerpColor(PALETTE.cyan, PALETTE.blue, phase / 0.33);
    if (phase < 0.66) return lerpColor(PALETTE.blue, PALETTE.purple, (phase - 0.33) / 0.33);
    return lerpColor(PALETTE.purple, PALETTE.magenta, (phase - 0.66) / 0.34);
  }

  function getStateAccent() {
    switch (currentState) {
      case 'listening':  return PALETTE.cyan;
      case 'processing': return PALETTE.gold;
      case 'speaking':   return PALETTE.green;
      default:           return PALETTE.teal;
    }
  }

  function getSpeed() {
    switch (currentState) {
      case 'listening':  return 0.008;
      case 'processing': return 0.014;
      case 'speaking':   return 0.004;
      default:           return 0.002;
    }
  }

  // =========================================================
  //  Draw Frame
  // =========================================================
  function draw() {
    const w = canvas.width / window.devicePixelRatio;
    const h = canvas.height / window.devicePixelRatio;
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * SPHERE_SCALE;
    time = performance.now();

    rotY += getSpeed();
    const accent = getStateAccent();
    const pulseIntensity = currentState === 'listening' ? 1.5 : (currentState === 'processing' ? 1.3 : 1.0);

    // ---- 1. Background ambient particles ----
    for (const p of ambientParticles) {
      const px = p.x * w;
      const py = (p.y + Math.sin(time * p.speed + p.phase) * 0.02) * h;
      const flicker = 0.5 + 0.5 * Math.sin(time * 0.002 + p.phase);
      const a = p.alpha * flicker;
      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${accent.r}, ${accent.g}, ${accent.b}, ${a})`;
      ctx.fill();
    }

    // ---- 2. Core glow (radial gradient behind sphere) ----
    const glowPulse = 1 + 0.15 * Math.sin(time * 0.003) * pulseIntensity;
    const glowR = radius * 1.8 * glowPulse;
    const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
    coreGrad.addColorStop(0, `rgba(${accent.r}, ${accent.g}, ${accent.b}, 0.12)`);
    coreGrad.addColorStop(0.3, `rgba(${accent.r}, ${accent.g}, ${accent.b}, 0.05)`);
    coreGrad.addColorStop(0.6, `rgba(138, 43, 226, 0.02)`);
    coreGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
    ctx.fillStyle = coreGrad;
    ctx.fill();

    // Inner bright core
    const innerR = radius * 0.25 * glowPulse;
    const innerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, innerR);
    innerGrad.addColorStop(0, `rgba(255, 255, 255, 0.15)`);
    innerGrad.addColorStop(0.5, `rgba(${accent.r}, ${accent.g}, ${accent.b}, 0.08)`);
    innerGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.fillStyle = innerGrad;
    ctx.fill();

    // ---- 3. Energy pulse waves ----
    const pulseCount = 3;
    for (let i = 0; i < pulseCount; i++) {
      const pulsePhase = ((time * 0.001 + i * 2.1) % 6) / 6; // 0→1 cycle
      const pulseR = radius * (0.4 + pulsePhase * 1.5);
      const pulseAlpha = (1 - pulsePhase) * 0.08 * pulseIntensity;
      if (pulseAlpha > 0.005) {
        ctx.beginPath();
        ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${accent.r}, ${accent.g}, ${accent.b}, ${pulseAlpha})`;
        ctx.lineWidth = 1.5 * (1 - pulsePhase);
        ctx.stroke();
      }
    }

    // ---- 4. HUD arc segments ----
    for (const hud of hudArcs) {
      hud.startAngle += hud.speed;
      const hr = radius * hud.radiusMul;
      const a = hud.startAngle;
      ctx.beginPath();
      ctx.arc(cx, cy, hr, a, a + hud.arcLen);
      if (hud.dash) ctx.setLineDash([4, 6]);
      else ctx.setLineDash([]);
      ctx.strokeStyle = `rgba(${accent.r}, ${accent.g}, ${accent.b}, 0.12)`;
      ctx.lineWidth = hud.width;
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // ---- 5. Orbital rings with glow ----
    for (const ring of orbitalRings) {
      const segments = 150;
      ctx.beginPath();
      for (let i = 0; i <= segments; i++) {
        const theta = (2 * Math.PI * i) / segments;
        let p = { x: Math.cos(theta) * ring.radiusMul, y: 0, z: Math.sin(theta) * ring.radiusMul };
        p = rotXf(p, ring.tiltX);
        p = rotZf(p, ring.tiltZ);
        p = rotYf(p, rotY * ring.speed);
        p = rotXf(p, rotX);
        const proj = projectPt(p, cx, cy, radius);
        if (i === 0) ctx.moveTo(proj.x, proj.y);
        else ctx.lineTo(proj.x, proj.y);
      }
      // Gradient alpha based on state
      const ringAlpha = 0.15 + 0.1 * Math.sin(time * 0.002 + ring.tiltX);
      ctx.strokeStyle = `rgba(${accent.r}, ${accent.g}, ${accent.b}, ${ringAlpha})`;
      ctx.lineWidth = ring.width;
      ctx.shadowColor = `rgba(${accent.r}, ${accent.g}, ${accent.b}, 0.5)`;
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // ---- 6. Sphere dots with multi-color ----
    const projected = [];
    for (const sp of spherePoints) {
      let p = rotYf(sp, rotY);
      p = rotXf(p, rotX);
      const proj = projectPt(p, cx, cy, radius);
      proj.colorIdx = sp.colorIdx;
      projected.push(proj);
    }
    projected.sort((a, b) => a.z - b.z);

    for (const p of projected) {
      const depthAlpha = 0.05 + (p.z + 1) * 0.475;
      const dotSize = DOT_BASE * p.scale;
      const col = getPointColor(p.colorIdx, time);

      // Energy line glow on front dots
      if (p.z > 0.1) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, dotSize * 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${depthAlpha * 0.04})`;
        ctx.fill();
      }

      // Dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, dotSize, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${depthAlpha})`;
      ctx.fill();
    }

    // ---- 7. Scanning line (horizontal sweep) ----
    const scanY = cy + radius * 1.2 * Math.sin(time * 0.0015);
    const scanGrad = ctx.createLinearGradient(cx - radius * 1.5, scanY, cx + radius * 1.5, scanY);
    scanGrad.addColorStop(0, 'rgba(0,0,0,0)');
    scanGrad.addColorStop(0.3, `rgba(${accent.r}, ${accent.g}, ${accent.b}, 0.04)`);
    scanGrad.addColorStop(0.5, `rgba(${accent.r}, ${accent.g}, ${accent.b}, 0.08)`);
    scanGrad.addColorStop(0.7, `rgba(${accent.r}, ${accent.g}, ${accent.b}, 0.04)`);
    scanGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = scanGrad;
    ctx.fillRect(cx - radius * 1.5, scanY - 1, radius * 3, 2);

    // ---- 8. Outward-drifting particles ----
    // Emit new particles
    if (Math.random() < (currentState === 'idle' ? 0.3 : 0.7)) {
      emitDrift(cx, cy, radius);
    }
    // Update and draw
    for (let i = driftParticles.length - 1; i >= 0; i--) {
      const dp = driftParticles[i];
      dp.x += dp.vx;
      dp.y += dp.vy;
      dp.life -= dp.decay;
      if (dp.life <= 0) {
        driftParticles.splice(i, 1);
        continue;
      }
      ctx.beginPath();
      ctx.arc(dp.x, dp.y, dp.size * dp.life, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${accent.r}, ${accent.g}, ${accent.b}, ${dp.life * 0.4})`;
      ctx.fill();
    }

    animFrameId = requestAnimationFrame(draw);
  }

  // Start
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  draw();


  // =========================================================
  //  State Management
  // =========================================================
  function setOrbState(state) {
    currentState = state;
    statusLabel.classList.remove('listening', 'processing', 'speaking');
    const labels = {
      idle:       'S T A N D B Y',
      listening:  'L I S T E N I N G',
      processing: 'P R O C E S S I N G',
      speaking:   'S P E A K I N G',
    };
    statusLabel.textContent = labels[state] || 'S T A N D B Y';
    if (state !== 'idle') statusLabel.classList.add(state);
  }


  // =========================================================
  //  Chat Rendering
  // =========================================================
  function addMessage(role, text) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${role}`;
    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = role === 'user' ? 'You' : 'Lakshya';
    const content = document.createElement('span');
    content.textContent = text;
    bubble.appendChild(label);
    bubble.appendChild(content);
    chatLog.appendChild(bubble);
    chatLog.scrollTop = chatLog.scrollHeight;
  }


  // =========================================================
  //  TTS — Soft Female Voice
  // =========================================================
  let synth = window.speechSynthesis;
  let preferredVoice = null;

  const PREFERRED_VOICES = [
    'Samantha', 'Karen', 'Moira', 'Tessa', 'Victoria', 'Fiona',
    'Google UK English Female', 'Google US English',
  ];
  const MALE_VOICES = ['Daniel', 'Rishi', 'Alex', 'Fred', 'Tom', 'Oliver', 'Arthur', 'James'];

  function pickBestVoice() {
    const voices = synth.getVoices();
    if (!voices.length) return;
    for (const name of PREFERRED_VOICES) {
      const enhanced = voices.find(v => v.name.includes(name) && (v.name.includes('Enhanced') || v.name.includes('Premium')));
      if (enhanced) { preferredVoice = enhanced; return; }
    }
    for (const name of PREFERRED_VOICES) {
      const match = voices.find(v => v.name.includes(name));
      if (match) { preferredVoice = match; return; }
    }
    const femaleEn = voices.find(v => v.lang && v.lang.startsWith('en') && !MALE_VOICES.some(m => v.name.includes(m)));
    if (femaleEn) { preferredVoice = femaleEn; return; }
    const english = voices.find(v => v.lang && v.lang.startsWith('en'));
    if (english) preferredVoice = english;
  }

  if (synth) { pickBestVoice(); synth.onvoiceschanged = pickBestVoice; }

  function speakText(text) {
    return new Promise((resolve) => {
      if (!synth) { resolve(); return; }
      synth.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      if (preferredVoice) utter.voice = preferredVoice;
      utter.rate   = 0.88;
      utter.pitch  = 1.15;
      utter.volume = 0.85;
      utter.lang   = 'en-US';
      utter.onend = resolve;
      utter.onerror = resolve;
      synth.speak(utter);
    });
  }


  // =========================================================
  //  Web Speech Recognition
  // =========================================================
  let isListening = false;
  let recognition  = null;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      isListening = true;
      setOrbState('listening');
      micBtn.classList.add('active');
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      handleUserInput(transcript);
    };
    recognition.onerror = (event) => {
      if (event.error === 'no-speech') setOrbState('idle');
      isListening = false;
      micBtn.classList.remove('active');
    };
    recognition.onend = () => {
      isListening = false;
      micBtn.classList.remove('active');
      if (currentState === 'listening') setOrbState('idle');
    };
  } else {
    speechBanner.style.display = 'block';
    speechBanner.textContent = '⚠ Web Speech API not supported — use Chrome or Edge for voice.';
    micBtn.style.opacity = '0.3';
    micBtn.style.pointerEvents = 'none';
  }


  // =========================================================
  //  API
  // =========================================================
  async function askBackend(text) {
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      return data.response || 'Sorry, something went wrong.';
    } catch (err) {
      return 'I am having trouble connecting to the server.';
    }
  }


  // =========================================================
  //  Main Input Handler
  // =========================================================
  async function handleUserInput(text) {
    if (!text || !text.trim()) return;
    text = text.trim();
    addMessage('user', text);
    inputField.value = '';

    setOrbState('processing');
    const response = await askBackend(text);
    addMessage('assistant', response);

    setOrbState('speaking');
    await speakText(response);
    setOrbState('idle');
  }


  // =========================================================
  //  Event Listeners
  // =========================================================
  micBtn.addEventListener('click', () => {
    if (!recognition) return;
    isListening ? recognition.stop() : recognition.start();
  });

  sendBtn.addEventListener('click', () => handleUserInput(inputField.value));

  inputField.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleUserInput(inputField.value);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && document.activeElement !== inputField) {
      e.preventDefault();
      if (recognition) { isListening ? recognition.stop() : recognition.start(); }
    }
  });

  canvas.addEventListener('click', () => {
    if (!recognition) return;
    isListening ? recognition.stop() : recognition.start();
  });

  // ---- Initial greeting ----
  setOrbState('idle');
  addMessage('assistant', 'Lakshya 2047 systems online. Click the holosphere or microphone to begin.');

})();
