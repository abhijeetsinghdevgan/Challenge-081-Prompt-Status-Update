# ⚡ PulseGuard — System Status Dashboard

**Challenge #081 · Prompt: Status Update**

A premium, fully interactive **System Status & Operations Center** built with pure HTML, CSS, and vanilla JavaScript — no frameworks, no dependencies.

---

## 🌐 Live Demo

🔗 **[https://abhijeetsinghdevgan.github.io/Challenge-081-Prompt-Status-Update/](https://abhijeetsinghdevgan.github.io/Challenge-081-Prompt-Status-Update/)**

---

## ✨ Features

### 📡 Real-Time Service Health Monitor
- Live heartbeat grid for **4 core infrastructure services**: API Gateway, Database Cluster, CDN Edge & AI Compute Workers
- Per-card **sparkline canvas charts** updating every 1.5 seconds with simulated latency fluctuations
- Color-coded status badges: `Operational` / `Degraded` / `Outage`

### 📊 Aggregate Trend Chart
- Rolling dual-line canvas chart rendering **latency (ms)** and **requests/sec** in real time
- Auto-scales axes, draws gradient fills, and labels time ticks — all with zero chart libraries

### 🚀 Multi-Stage Deployment Tracker
- Simulates a **release bundle sync** from 0% → 100% across 5 labelled pipeline steps
- Animated **radial progress ring** + linear bar with live bytes transferred and MB/s speed readout
- Step checklist with active pulse, checkmark completion, and failure animations

### 🔔 Corner Toast Notification Hub
- Slide-in toast alerts with **countdown timer bars** for `Info`, `Success`, `Warning`, and `Critical` types
- Auto-dismiss after 5 seconds with smooth fade-out transitions

### 🔊 Web Audio Synthesizer
- Browser-native **sound synthesis** using the Web Audio API — no audio files needed
- Distinct tones per event: ascending chime (success), sine pulse (info), minor-third pulse (warning), sawtooth sweep (critical)

### 🛠️ Operations Simulator Panel
- **Inject outages** on Database & API Gateway and watch the header beacon, card states, and trend chart react instantly
- **Speed control** slider to adjust deployment sync pace (1×–10×)
- **Failure injection toggle** to simulate a decompression crash mid-deploy

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Markup | HTML5 (Semantic) |
| Styling | Vanilla CSS (Custom Properties, Grid, Flexbox, Animations) |
| Logic | Vanilla JavaScript (ES6+, Web Audio API, Canvas 2D API) |
| Fonts | Google Fonts — Plus Jakarta Sans & Space Grotesk |
| Hosting | GitHub Pages |

---

## 📁 Project Structure

```
Challenge-081-Prompt-Status-Update/
├── index.html   # Dashboard layout & markup
├── style.css    # Design system, glassmorphism, animations, responsive breakpoints
└── app.js       # Live metrics, canvas charts, progress simulator, toast hub, audio engine
```

---

## 🎨 Design Highlights

- **Dark Glassmorphic UI** — `backdrop-filter: blur`, translucent panels, ambient glow blobs
- **Curated HSL color palette** — Indigo (#6366f1), Cyan (#06b6d4), Emerald (#10b981), Amber (#f59e0b), Coral (#ef4444)
- **Micro-animations** — pulsing status beacons, sparkline redraws, step transitions, button shine sweeps
- **Fully Responsive** — adapts gracefully from 375px mobile to 1440px+ widescreen

---

## 🚀 Run Locally

No build steps required — just open in a browser:

```bash
# Clone the repository
git clone https://github.com/abhijeetsinghdevgan/Challenge-081-Prompt-Status-Update.git

# Open index.html in your browser
start index.html
```

---

*Part of the daily UI design challenge series — one creative prompt, one polished build.*
