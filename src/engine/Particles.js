/**
 * High-performance Canvas Particle & Visual Effects Engine
 */

export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.shockwaves = [];
    this.lightningBolts = [];
    this.ambientParticles = [];
  }

  // Add hit sparks on punch/kick
  createHitSparks(x, y, count = 12, color = '#fef08a') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        color: Math.random() > 0.4 ? color : '#ffffff',
        alpha: 1,
        decay: 0.04 + Math.random() * 0.05,
        type: 'spark'
      });
    }
  }

  // Guard deflection spark burst
  createGuardSparks(x, y) {
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI * 2) / 10;
      this.particles.push({
        x: x + Math.cos(angle) * 8,
        y: y + Math.sin(angle) * 8,
        vx: Math.cos(angle) * 3,
        vy: Math.sin(angle) * 3,
        size: 3,
        color: '#38bdf8',
        alpha: 1,
        decay: 0.08,
        type: 'spark'
      });
    }
    this.shockwaves.push({
      x,
      y,
      radius: 6,
      maxRadius: 32,
      color: '#38bdf8',
      alpha: 1,
      decay: 0.09
    });
  }

  // Heavy blast / Jutsu impact shockwave
  createShockwave(x, y, color = '#38bdf8', maxRadius = 55) {
    this.shockwaves.push({
      x,
      y,
      radius: 5,
      maxRadius,
      color,
      alpha: 1,
      decay: 0.05
    });

    // Add extra debris
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 8;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        color,
        alpha: 1,
        decay: 0.03 + Math.random() * 0.03,
        type: 'shock_debris'
      });
    }
  }

  // Chakra charging aura motes
  createChakraAura(x, y, width, color = '#f97316') {
    for (let i = 0; i < 3; i++) {
      this.particles.push({
        x: x + Math.random() * width,
        y: y + Math.random() * 20,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -(2.5 + Math.random() * 3.5),
        size: 3 + Math.random() * 5,
        color,
        alpha: 0.8,
        decay: 0.04,
        type: 'aura'
      });
    }
  }

  // Rasengan active particles
  createRasenganParticles(x, y) {
    for (let i = 0; i < 4; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 10 + Math.random() * 22;
      this.particles.push({
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        vx: -Math.sin(angle) * (3 + Math.random() * 2),
        vy: Math.cos(angle) * (3 + Math.random() * 2),
        size: 2 + Math.random() * 3,
        color: Math.random() > 0.3 ? '#38bdf8' : '#e0f2fe',
        alpha: 0.9,
        decay: 0.06,
        type: 'rasengan'
      });
    }
  }

  // Chidori lightning arcs
  createChidoriLightning(x, y) {
    for (let i = 0; i < 2; i++) {
      const points = [{ x, y }];
      let currX = x;
      let currY = y;
      const segments = 4;
      for (let s = 0; s < segments; s++) {
        currX += (Math.random() - 0.5) * 35;
        currY += (Math.random() - 0.5) * 35;
        points.push({ x: currX, y: currY });
      }
      this.lightningBolts.push({
        points,
        color: Math.random() > 0.4 ? '#c084fc' : '#ffffff',
        alpha: 1,
        decay: 0.15
      });
    }

    // Small electric sparks
    for (let i = 0; i < 3; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 30,
        y: y + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        size: 2 + Math.random() * 2.5,
        color: '#e9d5ff',
        alpha: 1,
        decay: 0.08,
        type: 'spark'
      });
    }
  }

  // Dust puff on land/dash
  createDust(x, y, count = 5) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 4,
        vx: (Math.random() - 0.5) * 3,
        vy: -(0.5 + Math.random() * 1.5),
        size: 4 + Math.random() * 5,
        color: 'rgba(200, 200, 200, 0.4)',
        alpha: 0.6,
        decay: 0.04,
        type: 'dust'
      });
    }
  }

  // Ambient environment effects (leaves or rain)
  initAmbient(type, width, height) {
    this.ambientParticles = [];
    const count = type === 'storm' ? 80 : 35;
    for (let i = 0; i < count; i++) {
      this.ambientParticles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speedX: type === 'storm' ? -3 - Math.random() * 2 : 1 + Math.random() * 2,
        speedY: type === 'storm' ? 14 + Math.random() * 6 : 1.2 + Math.random() * 1.5,
        size: type === 'storm' ? 1.5 : 4 + Math.random() * 4,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.08,
        type: type === 'storm' ? 'rain' : 'leaf',
        color: type === 'storm' ? 'rgba(224, 242, 254, 0.6)' : ['#4ade80', '#22c55e', '#86efac'][Math.floor(Math.random() * 3)]
      });
    }
  }

  updateAmbient(width, height) {
    for (const p of this.ambientParticles) {
      p.x += p.speedX;
      p.y += p.speedY;
      p.rot += p.rotSpeed || 0;

      if (p.y > height) {
        p.y = -10;
        p.x = Math.random() * width;
      }
      if (p.x < -10) {
        p.x = width + 10;
      } else if (p.x > width + 10) {
        p.x = -10;
      }
    }
  }

  update() {
    // Update general particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;

      if (p.type === 'aura') {
        p.size *= 0.96;
      } else if (p.type === 'dust') {
        p.size *= 1.02;
        p.vx *= 0.94;
      }

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const s = this.shockwaves[i];
      s.radius += (s.maxRadius - s.radius) * 0.25;
      s.alpha -= s.decay;
      if (s.alpha <= 0 || s.radius >= s.maxRadius - 2) {
        this.shockwaves.splice(i, 1);
      }
    }

    // Update lightning
    for (let i = this.lightningBolts.length - 1; i >= 0; i--) {
      const l = this.lightningBolts[i];
      l.alpha -= l.decay;
      if (l.alpha <= 0) {
        this.lightningBolts.splice(i, 1);
      }
    }
  }

  render(ctx) {
    ctx.save();

    // 1. Render Ambient background
    for (const p of this.ambientParticles) {
      if (p.type === 'rain') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.speedX * 1.5, p.y + p.speedY * 1.5);
        ctx.stroke();
      } else if (p.type === 'leaf') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // 2. Render shockwaves
    for (const s of this.shockwaves) {
      ctx.save();
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 4 * s.alpha;
      ctx.globalAlpha = Math.max(0, s.alpha);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Render lightning bolts
    for (const l of this.lightningBolts) {
      ctx.save();
      ctx.strokeStyle = l.color;
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = Math.max(0, l.alpha);
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      for (let i = 0; i < l.points.length; i++) {
        if (i === 0) ctx.moveTo(l.points[i].x, l.points[i].y);
        else ctx.lineTo(l.points[i].x, l.points[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 4. Render particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;

      if (p.type === 'spark' || p.type === 'rasengan') {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'aura') {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.restore();
  }
}
