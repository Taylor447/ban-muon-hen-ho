/**
 * effects.js — Hiệu ứng hình ảnh sân khấu (Pháo giấy confetti, đèn sân khấu nhấp nháy)
 */

class VisualEffects {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.animationId = null;
  }

  // Khởi tạo Canvas cho hiệu ứng pháo giấy
  initCanvas() {
    if (this.canvas) return;

    this.canvas = document.createElement("canvas");
    this.canvas.id = "confetti-canvas";
    this.canvas.style.position = "fixed";
    this.canvas.style.top = "0";
    this.canvas.style.left = "0";
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.canvas.style.pointerEvents = "none";
    this.canvas.style.zIndex = "9999";
    document.body.appendChild(this.canvas);

    this.ctx = this.canvas.getContext("2d");
    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());
  }

  resizeCanvas() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  // Bắn pháo giấy chúc mừng (Confetti blast)
  launchConfetti(durationMs = 4000) {
    this.initCanvas();
    this.particles = [];

    const colors = ["#ff2a6d", "#d90429", "#ffb703", "#0582ca", "#06d6a0", "#7209b7", "#ffffff"];
    const count = 120;

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * -this.canvas.height * 0.5,
        w: Math.random() * 10 + 6,
        h: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 5,
        vy: Math.random() * 4 + 3,
        rotation: Math.random() * 360,
        vr: (Math.random() - 0.5) * 10,
        opacity: 1
      });
    }

    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      this.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vr;

        if (elapsed > durationMs - 1000) {
          p.opacity = Math.max(0, (durationMs - elapsed) / 1000);
        }

        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate((p.rotation * Math.PI) / 180);
        this.ctx.globalAlpha = p.opacity;
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        this.ctx.restore();
      });

      if (elapsed < durationMs) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        cancelAnimationFrame(this.animationId);
      }
    };

    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.animationId = requestAnimationFrame(animate);
  }

  // Kích hoạt hiệu ứng đèn sân khấu rực rỡ (Stage celebration pulse)
  triggerStageCelebration() {
    const arena = document.querySelector(".stage-arena");
    if (!arena) return;

    arena.classList.add("celebrating");
    setTimeout(() => {
      arena.classList.remove("celebrating");
    }, 4500);
  }
}

// Khởi tạo đối tượng toàn cục
window.effects = new VisualEffects();
