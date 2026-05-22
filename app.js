/**
 * PulseGuard Operations Center Logic
 * 
 * Includes:
 * 1. Web Audio Synthesizer (UI Tones)
 * 2. Sparkline & Historical Trend Canvas Charting (Zero dependencies)
 * 3. Multi-Stage Deployment Simulator (Progress Tracker)
 * 4. Corner Toast Notification Hub
 * 5. Outage/Disturbance Simulator
 */

// ==========================================================================
// GLOBALS & STATE CONTROL
// ==========================================================================
const STATE = {
  isMuted: false,
  systemStatus: 'operational', // 'operational' | 'degraded' | 'outage'
  services: {
    api: { id: 'srv-api', name: 'API Gateway', status: 'operational', latency: 24, load: 41, history: [22, 25, 24, 28, 24, 23, 25, 27, 24, 24], baseLatency: 24, maxLatency: 45, unit: 'ms' },
    db: { id: 'srv-db', name: 'Database Cluster', status: 'operational', latency: 4.2, load: 340, history: [4.1, 4.3, 4.2, 4.5, 4.2, 4.1, 4.3, 4.6, 4.2, 4.2], baseLatency: 4.2, maxLatency: 12, unit: 'ms' },
    cdn: { id: 'srv-cdn', name: 'CDN Edge', status: 'operational', latency: 12, load: 94.8, history: [11, 12, 13, 11, 12, 12, 11, 14, 12, 12], baseLatency: 12, maxLatency: 30, unit: 'ms' },
    ai: { id: 'srv-ai', name: 'AI Compute Workers', status: 'operational', latency: 180, load: 78, history: [175, 185, 180, 192, 180, 172, 188, 195, 180, 182], baseLatency: 180, maxLatency: 250, unit: 'ms' }
  },
  deployment: {
    status: 'idle', // 'idle' | 'syncing' | 'success' | 'error'
    progress: 0,
    currentStep: 0,
    speed: 4,
    simulateFailure: false,
    bytesTotal: 184.2, // MB
    bytesSynced: 0,
    speedMB: 0,
    intervalId: null,
    steps: [
      { text: "Authenticate credentials & verify hash", progressStart: 0, progressEnd: 15 },
      { text: "Establish edge cluster pipeline connection", progressStart: 15, progressEnd: 35 },
      { text: "Download global static files", progressStart: 35, progressEnd: 65 },
      { text: "Decompress bundles & execute checksums", progressStart: 65, progressEnd: 85 },
      { text: "Hot swap load-balancer pools", progressStart: 85, progressEnd: 100 }
    ]
  },
  chartData: {
    timestamps: [],
    latencyPoints: [],
    trafficPoints: [],
    maxPoints: 30
  }
};

// SVG Icon templates for notifications
const ICONS = {
  info: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
  success: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
  warning: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
  danger: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><octagon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></octagon><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`
};

// Initialize system clock and chart history
document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initSoundEngine();
  initSystemMetrics();
  initTrendChart();
  initEventHandlers();
  
  // Trigger greeting notification
  setTimeout(() => {
    triggerNotification('info', 'System Online', 'Monitoring 4 endpoints across 12 region points.');
  }, 1000);
});

// ==========================================================================
// 1. WEB AUDIO SYNTHESIZER (UI SOUND TONES)
// ==========================================================================
let audioCtx = null;

function initSoundEngine() {
  // Sound starts muted or enabled based on HTML setup.
  // Context is initialized on the first user interaction because browsers block audio.
  const setupAudio = () => {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  };
  document.body.addEventListener('click', setupAudio, { once: true });
}

function playTone(type) {
  if (STATE.isMuted) return;
  
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'info') {
      // Soft single sine wave chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.08, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.5);
    } 
    else if (type === 'success') {
      // Ascending pleasant arpeggio chime (C5 -> E5 -> G5 -> C6)
      const notes = [523.25, 659.25, 783.99, 1046.50];
      const duration = 0.08;
      
      notes.forEach((freq, idx) => {
        const itemOsc = audioCtx.createOscillator();
        const itemGain = audioCtx.createGain();
        itemOsc.connect(itemGain);
        itemGain.connect(audioCtx.destination);
        
        itemOsc.type = 'sine';
        itemOsc.frequency.setValueAtTime(freq, now + (idx * duration));
        
        itemGain.gain.setValueAtTime(0, now + (idx * duration));
        itemGain.gain.linearRampToValueAtTime(0.06, now + (idx * duration) + 0.02);
        itemGain.gain.exponentialRampToValueAtTime(0.0001, now + (idx * duration) + 0.35);
        
        itemOsc.start(now + (idx * duration));
        itemOsc.stop(now + (idx * duration) + 0.4);
      });
    } 
    else if (type === 'warning') {
      // Low dual warning pulse
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now); // A3
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.12, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
      
      const osc2 = audioCtx.createOscillator();
      const gainNode2 = audioCtx.createGain();
      osc2.connect(gainNode2);
      gainNode2.connect(audioCtx.destination);
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(233.08, now + 0.18); // A#3
      gainNode2.gain.setValueAtTime(0, now + 0.18);
      gainNode2.gain.linearRampToValueAtTime(0.12, now + 0.23);
      gainNode2.gain.exponentialRampToValueAtTime(0.0001, now + 0.43);
      
      osc.start(now);
      osc.stop(now + 0.3);
      osc2.start(now + 0.18);
      osc2.stop(now + 0.48);
    } 
    else if (type === 'danger') {
      // Alarm frequency drop sweep
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.4);
      
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.15, now + 0.05);
      gainNode.gain.linearRampToValueAtTime(0.08, now + 0.2);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
      
      osc.start(now);
      osc.stop(now + 0.5);
    }
  } catch (e) {
    console.warn("Audio Synthesis Failed (Browser restrictions or hardware error):", e);
  }
}

// ==========================================================================
// 2. CANVAS CHARTS & METRICS UPDATER
// ==========================================================================
function initClock() {
  const clockEl = document.getElementById('live-clock');
  const updateClock = () => {
    const d = new Date();
    clockEl.textContent = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };
  updateClock();
  setInterval(updateClock, 1000);
}

function initSystemMetrics() {
  // Update sparklines and simulate latency change every 1.5 seconds
  setInterval(() => {
    Object.keys(STATE.services).forEach(key => {
      const srv = STATE.services[key];
      
      if (srv.status === 'operational') {
        // Normal minor fluctuations
        const change = (Math.random() - 0.5) * (srv.baseLatency * 0.15);
        srv.latency = Math.max(0.1, +(srv.latency + change).toFixed(key === 'db' ? 2 : 0));
        // Maintain bounds
        if (srv.latency > srv.maxLatency) srv.latency = srv.baseLatency;
        
        // Random load changes
        if (key === 'db') {
          srv.load = Math.max(10, Math.min(1000, srv.load + Math.floor((Math.random() - 0.5) * 40)));
        } else if (key === 'cdn') {
          srv.load = Math.max(80, Math.min(100, +(srv.load + (Math.random() - 0.5) * 1.5).toFixed(1)));
        } else {
          srv.load = Math.max(5, Math.min(100, srv.load + Math.floor((Math.random() - 0.5) * 10)));
        }
      } else if (srv.status === 'outage') {
        // Outage metrics
        srv.latency = 0;
        srv.load = 0;
      } else if (srv.status === 'degraded') {
        // Degraded metrics
        const baseDegraded = srv.baseLatency * 4;
        srv.latency = +(baseDegraded + (Math.random() - 0.5) * srv.baseLatency).toFixed(key === 'db' ? 2 : 0);
        srv.load = Math.min(100, srv.load + Math.floor(Math.random() * 8));
      }

      // Update values in UI
      const valLat = document.getElementById(`val-latency-${key}`);
      const valLoad = document.getElementById(`val-load-${key}`);
      
      if (srv.status === 'outage') {
        valLat.textContent = 'TIMEOUT';
        valLoad.textContent = '0%';
      } else {
        valLat.textContent = `${srv.latency}${srv.unit}`;
        valLoad.textContent = key === 'db' ? `${srv.load}/1k` : `${srv.load}%`;
      }

      // Record to history and redraw sparkline
      srv.history.push(srv.latency);
      if (srv.history.length > 15) srv.history.shift();
      drawSparkline(key);
    });

    // Redraw large historical graph
    updateHistoricalData();
    drawTrendChart();

  }, 1500);

  // Initial draw
  setTimeout(() => {
    Object.keys(STATE.services).forEach(key => drawSparkline(key));
  }, 200);
}

function drawSparkline(key) {
  const canvas = document.getElementById(`spark-${key}`);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const srv = STATE.services[key];
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const w = canvas.width;
  const h = canvas.height;
  const data = srv.history;
  
  if (data.length < 2) return;

  // Determine line style/color based on state
  let strokeStyle = '#06b6d4'; // Cyan default
  let fillStyle = 'rgba(6, 182, 212, 0.05)';
  
  if (srv.status === 'degraded') {
    strokeStyle = '#f59e0b'; // Amber
    fillStyle = 'rgba(245, 158, 11, 0.05)';
  } else if (srv.status === 'outage') {
    strokeStyle = '#ef4444'; // Red
    fillStyle = 'rgba(239, 68, 68, 0.05)';
  }

  // Draw sparkline path
  ctx.beginPath();
  const maxVal = Math.max(...data, srv.baseLatency * 2) || 10;
  const minVal = Math.min(...data) || 0;
  const valRange = maxVal - minVal;

  const getX = (idx) => (idx / (data.length - 1)) * w;
  const getY = (val) => {
    if (srv.status === 'outage') return h - 5; // Flatline on bottom
    const percent = valRange ? (val - minVal) / valRange : 0.5;
    return h - 4 - (percent * (h - 8));
  };

  ctx.moveTo(getX(0), getY(data[0]));
  for (let i = 1; i < data.length; i++) {
    ctx.lineTo(getX(i), getY(data[i]));
  }
  
  // Style and stroke line
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Create gradient fill area under sparkline
  ctx.lineTo(getX(data.length - 1), h);
  ctx.lineTo(getX(0), h);
  ctx.closePath();
  ctx.fillStyle = fillStyle;
  ctx.fill();
}

function initTrendChart() {
  const now = Date.now();
  // Pre-fill history points
  for (let i = STATE.chartData.maxPoints; i > 0; i--) {
    const t = now - (i * 2000);
    STATE.chartData.timestamps.push(new Date(t).toLocaleTimeString([], { hour12: false }));
    // Add typical aggregated values
    STATE.chartData.latencyPoints.push(50 + Math.random() * 15);
    STATE.chartData.trafficPoints.push(120 + Math.floor(Math.random() * 40));
  }
  
  // Setup sizing
  resizeCanvas('main-trend-chart');
  window.addEventListener('resize', () => {
    resizeCanvas('main-trend-chart');
    drawTrendChart();
  });
  
  drawTrendChart();
}

function resizeCanvas(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
}

function updateHistoricalData() {
  const now = new Date();
  STATE.chartData.timestamps.push(now.toLocaleTimeString([], { hour12: false }));
  if (STATE.chartData.timestamps.length > STATE.chartData.maxPoints) {
    STATE.chartData.timestamps.shift();
  }

  // Latency calculation based on statuses
  let aggregateLatency = 0;
  let healthyServices = 0;
  Object.keys(STATE.services).forEach(key => {
    const srv = STATE.services[key];
    if (srv.status !== 'outage') {
      aggregateLatency += srv.latency;
      healthyServices++;
    } else {
      aggregateLatency += 500; // Penalty latency simulation for outages
      healthyServices++;
    }
  });
  const finalLatency = healthyServices ? aggregateLatency / healthyServices : 500;
  STATE.chartData.latencyPoints.push(finalLatency);
  if (STATE.chartData.latencyPoints.length > STATE.chartData.maxPoints) {
    STATE.chartData.latencyPoints.shift();
  }

  // Traffic request rates simulation
  let traffic = 120 + Math.floor(Math.random() * 40);
  if (STATE.services.api.status === 'degraded') {
    traffic = 45 + Math.floor(Math.random() * 15); // Drop traffic during API degradation
  } else if (STATE.services.db.status === 'outage') {
    traffic = 10 + Math.floor(Math.random() * 10); // Heavy traffic drop during DB outage
  }
  STATE.chartData.trafficPoints.push(traffic);
  if (STATE.chartData.trafficPoints.length > STATE.chartData.maxPoints) {
    STATE.chartData.trafficPoints.shift();
  }
}

function drawTrendChart() {
  const canvas = document.getElementById('main-trend-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.width / dpr;
  const h = canvas.height / dpr;
  
  ctx.clearRect(0, 0, w, h);
  
  if (STATE.chartData.latencyPoints.length < 2) return;

  const leftMargin = 35;
  const rightMargin = 35;
  const topMargin = 15;
  const bottomMargin = 20;
  const chartW = w - leftMargin - rightMargin;
  const chartH = h - topMargin - bottomMargin;

  // Find max values for scaling
  const maxLatency = Math.max(...STATE.chartData.latencyPoints, 120);
  const maxTraffic = Math.max(...STATE.chartData.trafficPoints, 200);

  // Draw Horizontal Gridlines (3 levels)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 3; i++) {
    const yGrid = topMargin + (chartH * i / 3);
    ctx.beginPath();
    ctx.moveTo(leftMargin, yGrid);
    ctx.lineTo(w - rightMargin, yGrid);
    ctx.stroke();
  }

  const getX = (idx) => leftMargin + (idx / (STATE.chartData.latencyPoints.length - 1)) * chartW;
  const getLatencyY = (val) => topMargin + chartH - ((val / maxLatency) * chartH);
  const getTrafficY = (val) => topMargin + chartH - ((val / maxTraffic) * chartH);

  // --- DRAW TRAFFIC AREA & LINE (PRIMARY COLOR / INDIGO) ---
  ctx.beginPath();
  ctx.moveTo(getX(0), getTrafficY(STATE.chartData.trafficPoints[0]));
  for (let i = 1; i < STATE.chartData.trafficPoints.length; i++) {
    ctx.lineTo(getX(i), getTrafficY(STATE.chartData.trafficPoints[i]));
  }
  ctx.strokeStyle = '#6366f1';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Gradient fill for Traffic
  const gradTraffic = ctx.createLinearGradient(0, topMargin, 0, topMargin + chartH);
  gradTraffic.addColorStop(0, 'rgba(99, 102, 241, 0.15)');
  gradTraffic.addColorStop(1, 'rgba(99, 102, 241, 0)');
  ctx.lineTo(getX(STATE.chartData.trafficPoints.length - 1), topMargin + chartH);
  ctx.lineTo(getX(0), topMargin + chartH);
  ctx.closePath();
  ctx.fillStyle = gradTraffic;
  ctx.fill();

  // --- DRAW LATENCY LINE (SECONDARY COLOR / CYAN) ---
  ctx.beginPath();
  ctx.moveTo(getX(0), getLatencyY(STATE.chartData.latencyPoints[0]));
  for (let i = 1; i < STATE.chartData.latencyPoints.length; i++) {
    ctx.lineTo(getX(i), getLatencyY(STATE.chartData.latencyPoints[i]));
  }
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Gradient fill for Latency
  const gradLatency = ctx.createLinearGradient(0, topMargin, 0, topMargin + chartH);
  gradLatency.addColorStop(0, 'rgba(6, 182, 212, 0.12)');
  gradLatency.addColorStop(1, 'rgba(6, 182, 212, 0)');
  ctx.lineTo(getX(STATE.chartData.latencyPoints.length - 1), topMargin + chartH);
  ctx.lineTo(getX(0), topMargin + chartH);
  ctx.closePath();
  ctx.fillStyle = gradLatency;
  ctx.fill();

  // --- DRAW AXES LABELS (TEXT) ---
  ctx.font = '9px Space Grotesk';
  ctx.fillStyle = '#64748b'; // var(--text-dark)

  // Left Y-axis (Latency in ms)
  ctx.textAlign = 'right';
  ctx.fillText(`${Math.round(maxLatency)}ms`, leftMargin - 6, topMargin + 3);
  ctx.fillText(`${Math.round(maxLatency / 2)}ms`, leftMargin - 6, topMargin + (chartH / 2) + 3);
  ctx.fillText('0ms', leftMargin - 6, topMargin + chartH + 3);

  // Right Y-axis (Requests in RPS)
  ctx.textAlign = 'left';
  ctx.fillText(`${Math.round(maxTraffic)}`, w - rightMargin + 6, topMargin + 3);
  ctx.fillText(`${Math.round(maxTraffic / 2)}`, w - rightMargin + 6, topMargin + (chartH / 2) + 3);
  ctx.fillText('0', w - rightMargin + 6, topMargin + chartH + 3);

  // Bottom Time labels
  ctx.textAlign = 'center';
  const midIdx = Math.floor(STATE.chartData.timestamps.length / 2);
  const endIdx = STATE.chartData.timestamps.length - 1;
  ctx.fillText(STATE.chartData.timestamps[0], getX(0), topMargin + chartH + 13);
  ctx.fillText(STATE.chartData.timestamps[midIdx], getX(midIdx), topMargin + chartH + 13);
  ctx.fillText(STATE.chartData.timestamps[endIdx], getX(endIdx), topMargin + chartH + 13);
}

// ==========================================================================
// 3. MULTI-STAGE DEPLOYMENT SIMULATOR (PROGRESS TRACKER)
// ==========================================================================
function startDeployment() {
  if (STATE.deployment.status === 'syncing') return;
  
  // Initialize state values
  STATE.deployment.status = 'syncing';
  STATE.deployment.progress = 0;
  STATE.deployment.currentStep = 0;
  STATE.deployment.bytesSynced = 0;
  
  playTone('info');
  updateDeploymentUI();
  
  const deployBtn = document.getElementById('btn-deploy-start');
  const resetBtn = document.getElementById('btn-deploy-reset');
  deployBtn.disabled = true;
  resetBtn.disabled = true;
  
  // Set UI elements to active mode
  document.getElementById('deployment-badge').className = 'badge syncing';
  document.getElementById('deployment-badge').textContent = 'Deploying';
  document.querySelector('.radial-progress-wrapper').className = 'radial-progress-wrapper';

  // Clear previous step states
  for (let i = 0; i < STATE.deployment.steps.length; i++) {
    const el = document.getElementById(`step-${i}`);
    el.className = 'step-item';
    el.querySelector('.icon-check').classList.add('hidden');
    el.querySelector('.icon-circle').classList.remove('hidden');
  }

  // Speed tick loop
  const intervalTime = 120; // baseline interval ms
  
  STATE.deployment.intervalId = setInterval(() => {
    const stepSpeed = STATE.deployment.speed; // 1 to 10
    
    // Add progress increments based on step speed
    const stepObj = STATE.deployment.steps[STATE.deployment.currentStep];
    const range = stepObj.progressEnd - stepObj.progressStart;
    
    // Increment progress
    const increment = (Math.random() * 2 + 1) * (stepSpeed / 4);
    STATE.deployment.progress = Math.min(100, +(STATE.deployment.progress + increment).toFixed(1));
    
    // Byte updates simulator
    STATE.deployment.bytesSynced = Math.min(
      STATE.deployment.bytesTotal,
      +((STATE.deployment.progress / 100) * STATE.deployment.bytesTotal).toFixed(1)
    );
    
    // Speed fluctuation
    STATE.deployment.speedMB = +(3.5 + (Math.random() - 0.5) * 1.5 + (stepSpeed * 0.8)).toFixed(1);

    // Update individual step details
    const stepEl = document.getElementById(`step-${STATE.deployment.currentStep}`);
    if (stepEl) {
      stepEl.classList.add('active');
    }

    // Fail sync test trigger
    if (STATE.deployment.simulateFailure && 
        STATE.deployment.currentStep === 3 && 
        STATE.deployment.progress >= 72) {
      
      // Simulate decompression crash
      clearInterval(STATE.deployment.intervalId);
      STATE.deployment.status = 'error';
      
      playTone('danger');
      triggerNotification('danger', 'Deployment Pipeline Failed', 'Critical failure during package decompression. Bad bundle payload.');
      
      // Mark current step as failed
      if (stepEl) {
        stepEl.classList.remove('active');
        stepEl.classList.add('failed');
      }
      
      updateDeploymentUI();
      resetBtn.disabled = false;
      return;
    }

    // Check if current step is complete
    if (STATE.deployment.progress >= stepObj.progressEnd) {
      if (stepEl) {
        stepEl.classList.remove('active');
        stepEl.classList.add('completed');
        stepEl.querySelector('.icon-circle').classList.add('hidden');
        stepEl.querySelector('.icon-check').classList.remove('hidden');
      }
      
      // Move to next step if not final
      if (STATE.deployment.currentStep < STATE.deployment.steps.length - 1) {
        STATE.deployment.currentStep++;
        playTone('info');
        triggerNotification('info', `Deploy Stage ${STATE.deployment.currentStep + 1} Initiated`, `Completed step ${STATE.deployment.currentStep}.`);
      }
    }

    // Finished download task successfully
    if (STATE.deployment.progress >= 100) {
      clearInterval(STATE.deployment.intervalId);
      STATE.deployment.status = 'success';
      
      playTone('success');
      triggerNotification('success', 'Deployment Sync Complete', 'Successfully deployed version 2.8.4 across edge cluster nodes.');
      
      // Finalize all steps
      for (let i = 0; i < STATE.deployment.steps.length; i++) {
        const el = document.getElementById(`step-${i}`);
        el.className = 'step-item completed';
        el.querySelector('.icon-circle').classList.add('hidden');
        el.querySelector('.icon-check').classList.remove('hidden');
      }

      updateDeploymentUI();
      resetBtn.disabled = false;
    } else {
      updateDeploymentUI();
    }

  }, intervalTime);
}

function updateDeploymentUI() {
  const percentText = document.getElementById('progress-percentage');
  const progressCircle = document.getElementById('progress-circle-bar');
  const progressLinear = document.getElementById('progress-linear-bar');
  const labelStatus = document.getElementById('progress-status-label');
  
  const titleEl = document.getElementById('sync-title');
  const subtextEl = document.getElementById('sync-subtext');
  const bytesEl = document.getElementById('progress-bytes');
  const speedEl = document.getElementById('progress-speed');
  const wrapperEl = document.querySelector('.radial-progress-wrapper');
  
  const progress = STATE.deployment.progress;
  percentText.textContent = `${Math.floor(progress)}%`;

  // Draw circular bar SVG dashboard
  const circumference = 314.15; // 2 * pi * r (r=50)
  const offset = circumference - (progress / 100) * circumference;
  progressCircle.style.strokeDashoffset = offset;
  
  // Draw linear progress bar
  progressLinear.style.width = `${progress}%`;

  // Handle various states
  if (STATE.deployment.status === 'syncing') {
    labelStatus.textContent = 'Syncing';
    titleEl.textContent = 'Deploying Update Bundle';
    subtextEl.textContent = STATE.deployment.steps[STATE.deployment.currentStep].text;
    bytesEl.textContent = `${STATE.deployment.bytesSynced.toFixed(1)} MB / ${STATE.deployment.bytesTotal} MB`;
    speedEl.textContent = `${STATE.deployment.speedMB.toFixed(1)} MB/s`;
  } 
  else if (STATE.deployment.status === 'success') {
    labelStatus.textContent = 'Done';
    titleEl.textContent = 'Deployment Complete';
    subtextEl.textContent = 'Version 2.8.4 hot swapped successfully into production pools.';
    bytesEl.textContent = `${STATE.deployment.bytesTotal} MB / ${STATE.deployment.bytesTotal} MB`;
    speedEl.textContent = '0.0 MB/s';
    
    document.getElementById('deployment-badge').className = 'badge success';
    document.getElementById('deployment-badge').textContent = 'Online';
    wrapperEl.classList.add('success');
  } 
  else if (STATE.deployment.status === 'error') {
    labelStatus.textContent = 'Failed';
    titleEl.textContent = 'Deployment Aborted';
    subtextEl.textContent = 'Error code: PIPELINE_UNPACK_FAILED. Rollback triggered.';
    speedEl.textContent = '0.0 MB/s';
    
    document.getElementById('deployment-badge').className = 'badge error';
    document.getElementById('deployment-badge').textContent = 'Error';
    wrapperEl.classList.add('error');
  } 
  else {
    // Idle state
    labelStatus.textContent = 'Ready';
    percentText.textContent = '0%';
    progressCircle.style.strokeDashoffset = circumference;
    progressLinear.style.width = '0%';
    titleEl.textContent = 'Release v2.8.4 Bundle Sync';
    subtextEl.textContent = 'Standing by to fetch asset artifacts.';
    bytesEl.textContent = '0.0 MB / 184.2 MB';
    speedEl.textContent = '-- MB/s';
    
    document.getElementById('deployment-badge').className = 'badge';
    document.getElementById('deployment-badge').textContent = 'Idle';
    wrapperEl.className = 'radial-progress-wrapper';
  }
}

function resetDeployment() {
  if (STATE.deployment.status === 'syncing') return;
  
  if (STATE.deployment.intervalId) {
    clearInterval(STATE.deployment.intervalId);
  }
  
  STATE.deployment.status = 'idle';
  STATE.deployment.progress = 0;
  STATE.deployment.currentStep = 0;
  STATE.deployment.bytesSynced = 0;
  
  playTone('info');
  updateDeploymentUI();
  
  document.getElementById('btn-deploy-start').disabled = false;
  document.getElementById('btn-deploy-reset').disabled = true;
  
  // Clear step item classes
  for (let i = 0; i < STATE.deployment.steps.length; i++) {
    const el = document.getElementById(`step-${i}`);
    el.className = 'step-item';
    el.querySelector('.icon-check').classList.add('hidden');
    el.querySelector('.icon-circle').classList.remove('hidden');
  }
}

// ==========================================================================
// 4. CORNER TOAST NOTIFICATION HUB
// ==========================================================================
function triggerNotification(type, customTitle = null, customMsg = null) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  // Tone generation
  playTone(type === 'danger' ? 'danger' : type === 'warning' ? 'warning' : type === 'success' ? 'success' : 'info');

  // Title and messages templates
  const defaultMeta = {
    info: { title: 'Network Update', msg: 'System check completed. Connectivity normal.' },
    success: { title: 'Operation Successful', msg: 'Deployment hotfixed target cluster cells.' },
    warning: { title: 'Connection Alert', msg: 'Increased ping detected in US-EAST region routing.' },
    danger: { title: 'System Incident', msg: 'Outage detected on server gateway instance.' }
  };

  const titleText = customTitle || defaultMeta[type].title;
  const msgText = customMsg || defaultMeta[type].msg;
  const toastId = `toast-${Date.now()}`;

  // Toast HTML element creation
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.id = toastId;
  
  const duration = 5000; // 5 seconds display duration

  toast.innerHTML = `
    <div class="toast-icon-wrapper">
      ${ICONS[type]}
    </div>
    <div class="toast-body">
      <div class="toast-title">${titleText}</div>
      <div class="toast-message">${msgText}</div>
    </div>
    <button class="toast-close-btn" aria-label="Close Notification" onclick="closeToast('${toastId}')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
    <div class="toast-timer-bar" style="animation: shrink-timer ${duration}ms linear forwards;"></div>
  `;

  container.appendChild(toast);

  // Auto remove after timeout expires
  const timer = setTimeout(() => {
    closeToast(toastId);
  }, duration);

  // Bind close timer to toast DOM data reference
  toast.dataset.timeoutId = timer;
}

function closeToast(id) {
  const toast = document.getElementById(id);
  if (!toast) return;

  // Clear timeout to prevent memory leak
  if (toast.dataset.timeoutId) {
    clearTimeout(parseInt(toast.dataset.timeoutId));
  }

  // Run exit animation
  toast.classList.add('toast-fade-out');
  toast.addEventListener('transitionend', () => {
    toast.remove();
  });
}

// Global scope mapping for simulator click attributes
window.triggerNotification = triggerNotification;
window.closeToast = closeToast;

// ==========================================================================
// 5. DISTURBANCE & OUTAGE SIMULATOR
// ==========================================================================
function simulateDatabaseOutage(isDown) {
  const srv = STATE.services.db;
  const card = document.getElementById(srv.id);
  const btnDown = document.getElementById('btn-simulate-db-down');
  const btnUp = document.getElementById('btn-simulate-db-up');

  if (isDown) {
    srv.status = 'outage';
    
    // Toggle Buttons
    btnDown.classList.add('hidden');
    btnUp.classList.remove('hidden');
    
    // Update card styling
    card.classList.add('error-state');
    card.querySelector('.status-badge').className = 'status-badge outage';
    card.querySelector('.status-badge').textContent = 'Outage';
    
    // Spawns system updates
    updateGlobalSystemStatus();
    triggerNotification('danger', 'Database Cluster Outage', 'Connection to database pool lost. Automated failover initiated.');
  } else {
    srv.status = 'operational';
    srv.latency = srv.baseLatency;
    srv.load = 340;
    
    // Toggle Buttons
    btnUp.classList.add('hidden');
    btnDown.classList.remove('hidden');
    
    // Update card styling
    card.classList.remove('error-state');
    card.querySelector('.status-badge').className = 'status-badge operational';
    card.querySelector('.status-badge').textContent = 'Operational';
    
    // Spawns system updates
    updateGlobalSystemStatus();
    triggerNotification('success', 'Database Cluster Operational', 'Database pool recovered. Transactions back to normal.');
  }
  
  drawSparkline('db');
}

function simulateAPIDegrade(isDown) {
  const srv = STATE.services.api;
  const card = document.getElementById(srv.id);
  const btnDown = document.getElementById('btn-simulate-api-down');
  const btnUp = document.getElementById('btn-simulate-api-up');

  if (isDown) {
    srv.status = 'degraded';
    
    // Toggle Buttons
    btnDown.classList.add('hidden');
    btnUp.classList.remove('hidden');
    
    // Update card styling
    card.classList.add('warning-state');
    card.querySelector('.status-badge').className = 'status-badge degraded';
    card.querySelector('.status-badge').textContent = 'Degraded';
    
    // Spawns system updates
    updateGlobalSystemStatus();
    triggerNotification('warning', 'Ingress Traffic Latency Spill', 'Traffic queue saturation warning on edge API clusters.');
  } else {
    srv.status = 'operational';
    srv.latency = srv.baseLatency;
    srv.load = 41;
    
    // Toggle Buttons
    btnUp.classList.add('hidden');
    btnDown.classList.remove('hidden');
    
    // Update card styling
    card.classList.remove('warning-state');
    card.querySelector('.status-badge').className = 'status-badge operational';
    card.querySelector('.status-badge').textContent = 'Operational';
    
    // Spawns system updates
    updateGlobalSystemStatus();
    triggerNotification('success', 'Ingress Traffic Normal', 'Latency stabilized on API Gateway nodes.');
  }
  
  drawSparkline('api');
}

function updateGlobalSystemStatus() {
  const summaryEl = document.getElementById('system-summary');
  const titleEl = document.getElementById('summary-title');
  const metaEl = document.getElementById('summary-meta');
  const pulseEl = summaryEl.querySelector('.status-pulse-large');

  // Count service outages or degradations
  let totalOutages = 0;
  let totalDegraded = 0;
  
  Object.keys(STATE.services).forEach(key => {
    if (STATE.services[key].status === 'outage') totalOutages++;
    else if (STATE.services[key].status === 'degraded') totalDegraded++;
  });

  // Calculate system state
  if (totalOutages > 0) {
    STATE.systemStatus = 'outage';
    summaryEl.className = 'system-summary outage';
    pulseEl.className = 'status-pulse-large outage';
    titleEl.textContent = 'System Outage Incident';
    metaEl.textContent = `${totalOutages} critical service offline. Infrastructure compromised.`;
  } 
  else if (totalDegraded > 0) {
    STATE.systemStatus = 'degraded';
    summaryEl.className = 'system-summary degraded';
    pulseEl.className = 'status-pulse-large degraded';
    titleEl.textContent = 'Degraded Infrastructure';
    metaEl.textContent = `${totalDegraded} node running high response times. Operations active.`;
  } 
  else {
    STATE.systemStatus = 'operational';
    summaryEl.className = 'system-summary';
    pulseEl.className = 'status-pulse-large operational';
    titleEl.textContent = 'All Systems Operational';
    metaEl.textContent = '99.98% Uptime Over Last 30 Days';
  }
}

// ==========================================================================
// EVENT HANDLERS BINDINGS
// ==========================================================================
function initEventHandlers() {
  // Volume Mute Button
  const audioToggle = document.getElementById('audio-toggle');
  audioToggle.addEventListener('click', () => {
    STATE.isMuted = !STATE.isMuted;
    
    const iconOn = audioToggle.querySelector('.icon-volume-on');
    const iconOff = audioToggle.querySelector('.icon-volume-off');
    
    if (STATE.isMuted) {
      iconOn.classList.add('hidden');
      iconOff.classList.remove('hidden');
    } else {
      iconOff.classList.add('hidden');
      iconOn.classList.remove('hidden');
      // Play a quick test sound to confirm unmuting
      playTone('info');
    }
  });

  // Deployment Controller Buttons
  document.getElementById('btn-deploy-start').addEventListener('click', startDeployment);
  document.getElementById('btn-deploy-reset').addEventListener('click', resetDeployment);

  // Speed slider
  const speedSlider = document.getElementById('sync-speed-slider');
  const speedLbl = document.getElementById('sync-speed-lbl');
  speedSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    STATE.deployment.speed = val;
    speedLbl.textContent = `${val}x Speed`;
  });

  // Fail Sync checkbox
  const failCheckbox = document.getElementById('fail-sync-checkbox');
  failCheckbox.addEventListener('change', (e) => {
    STATE.deployment.simulateFailure = e.target.checked;
  });

  // Incident simulators buttons
  document.getElementById('btn-simulate-db-down').addEventListener('click', () => simulateDatabaseOutage(true));
  document.getElementById('btn-simulate-db-up').addEventListener('click', () => simulateDatabaseOutage(false));

  document.getElementById('btn-simulate-api-down').addEventListener('click', () => simulateAPIDegrade(true));
  document.getElementById('btn-simulate-api-up').addEventListener('click', () => simulateAPIDegrade(false));
}
