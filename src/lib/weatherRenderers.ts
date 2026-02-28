import type { WeatherCondition, Particle } from '@/types/weather';

const MAX_PARTICLES = 150;

function isMobile(): boolean {
  return typeof window !== 'undefined' && window.innerWidth < 768;
}

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

// ── Individual renderers ─────────────────────────────────────────────

function initSnow(w: number, h: number): Particle[] {
  const count = isMobile() ? 50 : 100;
  return Array.from({ length: count }, () => ({
    x: rand(0, w),
    y: rand(-h, h),
    speed: rand(0.3, 1.2),
    size: rand(2, 5),
    opacity: rand(0.3, 0.6),
    wobble: rand(0, Math.PI * 2),
    wobbleSpeed: rand(0.002, 0.006),
    drift: rand(-0.3, 0.3),
  }));
}

function updateSnow(particles: Particle[], w: number, h: number) {
  for (const p of particles) {
    p.y += p.speed;
    p.wobble! += p.wobbleSpeed!;
    p.x += Math.sin(p.wobble!) * 0.5 + p.drift!;
    if (p.y > h + 10) {
      p.y = rand(-20, -5);
      p.x = rand(0, w);
    }
    if (p.x < -10) p.x = w + 10;
    if (p.x > w + 10) p.x = -10;
  }
}

function drawSnow(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const p of particles) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(180, 200, 220, ${p.opacity})`;
    ctx.fill();
  }
}

// ── Rain ─────────────────────────────────────────────────────────────

function initRain(w: number, h: number): Particle[] {
  const count = isMobile() ? 80 : 150;
  return Array.from({ length: count }, () => ({
    x: rand(0, w + 100),
    y: rand(-h, h),
    speed: rand(8, 14),
    size: rand(1, 2.5),
    opacity: rand(0.15, 0.4),
    drift: -2, // slight wind angle
  }));
}

function updateRain(particles: Particle[], w: number, h: number) {
  for (const p of particles) {
    p.y += p.speed;
    p.x += p.drift!;
    if (p.y > h + 10) {
      p.y = rand(-30, -5);
      p.x = rand(0, w + 100);
    }
  }
}

function drawRain(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  ctx.strokeStyle = 'rgba(100, 140, 200, 0.45)';
  ctx.lineWidth = 1.5;
  for (const p of particles) {
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + p.drift! * 2, p.y + p.size * 10);
    ctx.globalAlpha = p.opacity;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// ── Drizzle ──────────────────────────────────────────────────────────

function initDrizzle(w: number, h: number): Particle[] {
  const count = isMobile() ? 40 : 80;
  return Array.from({ length: count }, () => ({
    x: rand(0, w),
    y: rand(-h, h),
    speed: rand(3, 6),
    size: rand(0.5, 1.5),
    opacity: rand(0.12, 0.3),
    drift: -1,
  }));
}

function updateDrizzle(particles: Particle[], w: number, h: number) {
  updateRain(particles, w, h);
}

function drawDrizzle(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  ctx.strokeStyle = 'rgba(100, 140, 200, 0.35)';
  ctx.lineWidth = 0.8;
  for (const p of particles) {
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + p.drift! * 1.5, p.y + p.size * 8);
    ctx.globalAlpha = p.opacity;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// ── Cloudy ───────────────────────────────────────────────────────────

function initClouds(w: number, _h: number): Particle[] {
  const count = isMobile() ? 4 : 8;
  return Array.from({ length: count }, () => ({
    x: rand(-200, w),
    y: rand(20, 400),
    speed: rand(0.1, 0.35),
    size: rand(150, 350),
    opacity: rand(0.06, 0.15),
    drift: rand(0.05, 0.2),
  }));
}

function updateClouds(particles: Particle[], w: number, _h: number) {
  for (const p of particles) {
    p.x += p.drift!;
    if (p.x > w + p.size) {
      p.x = -p.size * 2;
      p.y = rand(20, 300);
    }
  }
}

function drawClouds(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const p of particles) {
    const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
    gradient.addColorStop(0, `rgba(160, 175, 200, ${p.opacity})`);
    gradient.addColorStop(1, 'rgba(160, 175, 200, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Thunderstorm ─────────────────────────────────────────────────────

interface ThunderstormState {
  particles: Particle[];
  flashTimer: number;
  flashOpacity: number;
  nextFlash: number;
}

function initThunderstorm(w: number, h: number): ThunderstormState {
  return {
    particles: initRain(w, h),
    flashTimer: 0,
    flashOpacity: 0,
    nextFlash: rand(240, 600), // frames (~4-10s at 60fps)
  };
}

function updateThunderstorm(state: ThunderstormState, w: number, h: number) {
  updateRain(state.particles, w, h);
  state.flashTimer++;
  if (state.flashTimer >= state.nextFlash) {
    state.flashOpacity = 0.25;
    state.flashTimer = 0;
    state.nextFlash = rand(240, 600);
  }
  if (state.flashOpacity > 0) {
    state.flashOpacity *= 0.85; // rapid decay
    if (state.flashOpacity < 0.005) state.flashOpacity = 0;
  }
}

function drawThunderstorm(ctx: CanvasRenderingContext2D, state: ThunderstormState, w: number, h: number) {
  drawRain(ctx, state.particles);
  if (state.flashOpacity > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${state.flashOpacity})`;
    ctx.fillRect(0, 0, w, h);
  }
}

// ── Fog ──────────────────────────────────────────────────────────────

interface FogState {
  time: number;
}

function drawFog(ctx: CanvasRenderingContext2D, state: FogState, w: number, h: number) {
  state.time += 0.003;
  const bands = 5;
  for (let i = 0; i < bands; i++) {
    const yBase = (h / bands) * i + Math.sin(state.time + i * 1.5) * 40;
    const gradient = ctx.createLinearGradient(0, yBase, 0, yBase + h / bands);
    const opacity = 0.08 + Math.sin(state.time + i) * 0.03;
    gradient.addColorStop(0, `rgba(160, 175, 200, 0)`);
    gradient.addColorStop(0.5, `rgba(160, 175, 200, ${Math.max(0, opacity)})`);
    gradient.addColorStop(1, `rgba(160, 175, 200, 0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, yBase, w, h / bands);
  }
}

// ── Clear ────────────────────────────────────────────────────────────

interface ClearState {
  time: number;
  particles: Particle[];
}

function initClear(w: number, h: number): ClearState {
  const count = isMobile() ? 20 : 40;
  return {
    time: 0,
    particles: Array.from({ length: count }, () => ({
      x: rand(0, w),
      y: rand(0, h),
      speed: rand(0.15, 0.5),
      size: rand(1.5, 3.5),
      opacity: rand(0.08, 0.2),
      wobble: rand(0, Math.PI * 2),
      wobbleSpeed: rand(0.003, 0.008),
      drift: rand(-0.2, 0.2),
    })),
  };
}

function updateClear(state: ClearState, w: number, h: number) {
  state.time += 0.002;
  for (const p of state.particles) {
    p.y -= p.speed; // float upward
    p.wobble! += p.wobbleSpeed!;
    p.x += Math.sin(p.wobble!) * 0.4 + p.drift!;
    // Pulse opacity gently
    p.opacity = 0.08 + Math.sin(p.wobble! * 2) * 0.08;
    if (p.y < -10) {
      p.y = h + 10;
      p.x = rand(0, w);
    }
    if (p.x < -10) p.x = w + 10;
    if (p.x > w + 10) p.x = -10;
  }
}

function drawClear(ctx: CanvasRenderingContext2D, state: ClearState, w: number, _h: number) {
  // Sun glow
  const cx = w * 0.85;
  const cy = 100;
  const radius = 300 + Math.sin(state.time) * 30;
  const opacity = 0.1 + Math.sin(state.time) * 0.03;
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  gradient.addColorStop(0, `rgba(100, 180, 255, ${Math.max(0, opacity)})`);
  gradient.addColorStop(1, 'rgba(100, 180, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  // Floating light particles
  for (const p of state.particles) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(100, 170, 240, ${p.opacity})`;
    ctx.fill();
  }
}

// ── Static (reduced motion) gradients ────────────────────────────────

function drawStaticGradient(ctx: CanvasRenderingContext2D, condition: WeatherCondition, w: number, h: number) {
  let color: string;
  let opacity: number;
  switch (condition) {
    case 'snow':
      color = '180, 200, 220';
      opacity = 0.1;
      break;
    case 'rain':
    case 'drizzle':
    case 'thunderstorm':
      color = '100, 140, 200';
      opacity = 0.12;
      break;
    case 'cloudy':
    case 'fog':
      color = '160, 175, 200';
      opacity = 0.08;
      break;
    default:
      color = '100, 160, 255';
      opacity = 0.08;
  }
  const gradient = ctx.createRadialGradient(w * 0.5, h * 0.3, 0, w * 0.5, h * 0.3, w * 0.6);
  gradient.addColorStop(0, `rgba(${color}, ${opacity})`);
  gradient.addColorStop(1, `rgba(${color}, 0)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
}

// ── Main Renderer Class ─────────────────────────────────────────────

export class WeatherRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private condition: WeatherCondition = 'clear';
  private animId = 0;
  private paused = false;
  private reducedMotion = false;

  // Particle state per condition
  private particles: Particle[] = [];
  private thunderState: ThunderstormState | null = null;
  private fogState: FogState = { time: 0 };
  private clearState: ClearState = { time: 0, particles: [] };

  private w = 0;
  private h = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.resize();
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio, 2);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = this.w * dpr;
    this.canvas.height = this.h * dpr;
    this.canvas.style.width = `${this.w}px`;
    this.canvas.style.height = `${this.h}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Re-init particles for new size
    this.initParticles();
  }

  setCondition(condition: WeatherCondition) {
    if (condition === this.condition) return;
    this.condition = condition;
    this.initParticles();
  }

  private initParticles() {
    this.thunderState = null;
    this.particles = [];

    switch (this.condition) {
      case 'snow':
        this.particles = initSnow(this.w, this.h);
        break;
      case 'rain':
        this.particles = initRain(this.w, this.h);
        break;
      case 'drizzle':
        this.particles = initDrizzle(this.w, this.h);
        break;
      case 'cloudy':
        this.particles = initClouds(this.w, this.h);
        break;
      case 'thunderstorm':
        this.thunderState = initThunderstorm(this.w, this.h);
        break;
      case 'clear':
        this.clearState = initClear(this.w, this.h);
        break;
      // fog has no particles
    }
  }

  start() {
    if (this.animId) return;
    const loop = () => {
      if (!this.paused) {
        this.draw();
      }
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  stop() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = 0;
    }
  }

  setPaused(paused: boolean) {
    this.paused = paused;
  }

  private draw() {
    const { ctx, w, h } = this;
    ctx.clearRect(0, 0, w, h);

    if (this.reducedMotion) {
      drawStaticGradient(ctx, this.condition, w, h);
      return;
    }

    switch (this.condition) {
      case 'snow':
        updateSnow(this.particles, w, h);
        drawSnow(ctx, this.particles);
        break;
      case 'rain':
        updateRain(this.particles, w, h);
        drawRain(ctx, this.particles);
        break;
      case 'drizzle':
        updateDrizzle(this.particles, w, h);
        drawDrizzle(ctx, this.particles);
        break;
      case 'cloudy':
        updateClouds(this.particles, w, h);
        drawClouds(ctx, this.particles);
        break;
      case 'thunderstorm':
        if (this.thunderState) {
          updateThunderstorm(this.thunderState, w, h);
          drawThunderstorm(ctx, this.thunderState, w, h);
        }
        break;
      case 'fog':
        drawFog(ctx, this.fogState, w, h);
        break;
      case 'clear':
        updateClear(this.clearState, w, h);
        drawClear(ctx, this.clearState, w, h);
        break;
    }
  }
}
