(() => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function initCopyButtons() {
    document.querySelectorAll("[data-copy]").forEach((button) => {
      button.addEventListener("click", async () => {
        const value = button.getAttribute("data-copy");
        if (!value) return;

        try {
          await navigator.clipboard.writeText(value);
          const label = button.textContent;
          button.textContent = "Copied";
          window.setTimeout(() => {
            button.textContent = label;
          }, 1200);
        } catch {
          window.location.href = `mailto:${value}`;
        }
      });
    });
  }

  function initOrbitalSphere() {
    const visual = document.querySelector("[data-orbital-visual]");
    if (!(visual instanceof SVGElement) || reducedMotion) return;

    const meridians = [...visual.querySelectorAll("[data-sphere-meridian]")];
    if (!meridians.length) return;

    const startedAt = performance.now();
    let frameId = 0;
    let visible = true;

    const draw = (now) => {
      frameId = 0;
      if (!visible || document.hidden) return;

      const rotation = (now - startedAt) * 0.00011;
      for (const meridian of meridians) {
        const phase = Number(meridian.getAttribute("data-phase")) || 0;
        const projection = Math.max(0.035, Math.abs(Math.cos(rotation + phase)));
        meridian.setAttribute(
          "transform",
          `translate(250 250) scale(${projection.toFixed(4)} 1) translate(-250 -250)`
        );
        meridian.style.opacity = String(0.2 + projection * 0.48);
      }

      frameId = window.requestAnimationFrame(draw);
    };

    const start = () => {
      if (!frameId && visible && !document.hidden) frameId = window.requestAnimationFrame(draw);
    };

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        start();
      }).observe(visual);
    }

    document.addEventListener("visibilitychange", start);
    start();
  }

  function initSpaceCanvas() {
    const canvas = document.querySelector("#space-canvas");
    if (!(canvas instanceof HTMLCanvasElement) || reducedMotion) return;

    const context = canvas.getContext("2d");
    const container = canvas.parentElement;
    if (!context || !container) return;

    const styles = getComputedStyle(document.documentElement);
    const readRgb = (name) => {
      const hex = styles.getPropertyValue(name).trim().replace("#", "");
      const value = hex.length === 3 ? [...hex].map((character) => character.repeat(2)).join("") : hex;
      return [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16)).join(", ");
    };
    const accent = readRgb("--accent-dim");
    const accentHead = readRgb("--accent");
    const text = readRgb("--text");

    let width = 0;
    let height = 0;
    let stars = [];
    let meteors = [];
    let frameId = 0;
    let visible = true;
    let nextMeteorAt = performance.now() + 4500 + Math.random() * 4500;

    const makeStar = () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 0.28 + Math.random() * 0.55,
      alpha: 0.06 + Math.random() * 0.2,
      phase: Math.random() * Math.PI * 2,
      twinkle: 0.00018 + Math.random() * 0.0003
    });

    const makeMeteor = () => {
      const angle = 2.17 + (Math.random() - 0.5) * 0.08;
      const speed = 0.42 + Math.random() * 0.35;
      return {
        x: width + 24 + Math.random() * width * 0.25,
        y: -24 - Math.random() * height * 0.35,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        length: 18 + Math.random() * 22,
        alpha: 0.18 + Math.random() * 0.22,
        lineWidth: 0.45 + Math.random() * 0.35
      };
    };

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = Array.from(
        { length: Math.min(38, Math.max(18, Math.round((width * height) / 25000))) },
        makeStar
      );
      meteors = [];
    };

    const drawMeteor = (meteor) => {
      meteor.x += meteor.vx;
      meteor.y += meteor.vy;

      const speed = Math.hypot(meteor.vx, meteor.vy) || 1;
      const tailX = meteor.x - (meteor.vx / speed) * meteor.length;
      const tailY = meteor.y - (meteor.vy / speed) * meteor.length;
      const gradient = context.createLinearGradient(tailX, tailY, meteor.x, meteor.y);
      gradient.addColorStop(0, `rgba(${accent}, 0)`);
      gradient.addColorStop(1, `rgba(${accent}, ${meteor.alpha})`);

      context.beginPath();
      context.moveTo(tailX, tailY);
      context.lineTo(meteor.x, meteor.y);
      context.strokeStyle = gradient;
      context.lineWidth = meteor.lineWidth;
      context.stroke();

      context.beginPath();
      context.arc(meteor.x, meteor.y, Math.max(0.3, meteor.lineWidth * 0.55), 0, Math.PI * 2);
      context.fillStyle = `rgba(${accentHead}, ${Math.min(0.6, meteor.alpha + 0.1)})`;
      context.fill();
    };

    const draw = (now) => {
      frameId = 0;
      if (!visible || document.hidden) return;

      context.clearRect(0, 0, width, height);

      for (const star of stars) {
        const alpha = star.alpha * (0.95 + Math.sin(now * star.twinkle + star.phase) * 0.05);
        context.beginPath();
        context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(${text}, ${alpha})`;
        context.fill();
      }

      if (now >= nextMeteorAt && meteors.length === 0) {
        meteors.push(makeMeteor());
        nextMeteorAt = now + 8000 + Math.random() * 6000;
      }

      meteors.forEach(drawMeteor);
      meteors = meteors.filter((meteor) => meteor.x > -meteor.length * 2 && meteor.y < height + meteor.length * 2);
      frameId = window.requestAnimationFrame(draw);
    };

    const start = () => {
      if (!frameId && visible && !document.hidden) frameId = window.requestAnimationFrame(draw);
    };

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        start();
      }).observe(container);
    }

    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", start);
    resize();
    start();
  }

  initCopyButtons();
  initOrbitalSphere();
  initSpaceCanvas();
})();
