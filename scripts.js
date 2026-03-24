/* ─── COUNTDOWN ─────────────────────────────────── */
(function () {
  const target = new Date('2026-04-05T00:00:00');

  function pad(n) { return String(n).padStart(2, '0'); }

  function tick() {
    const now  = new Date();
    const diff = target - now;

    if (diff <= 0) {
      document.getElementById('cd-days').textContent  = '00';
      document.getElementById('cd-hours').textContent = '00';
      document.getElementById('cd-mins').textContent  = '00';
      document.getElementById('cd-secs').textContent  = '00';
      return;
    }

    const days  = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins  = Math.floor((diff % 3600000)  / 60000);
    const secs  = Math.floor((diff % 60000)    / 1000);

    function set(id, val) {
      const el = document.getElementById(id);
      const v  = pad(val);
      if (el.textContent !== v) {
        el.textContent = v;
        el.classList.remove('tick');
        void el.offsetWidth;
        el.classList.add('tick');
        setTimeout(() => el.classList.remove('tick'), 150);
      }
    }

    set('cd-days',  days);
    set('cd-hours', hours);
    set('cd-mins',  mins);
    set('cd-secs',  secs);
  }

  tick();
  setInterval(tick, 1000);
})();


/* ─── FLOATING PETALS ───────────────────────────── */
(function () {
  const canvas = document.getElementById('petals');
  const ctx    = canvas.getContext('2d');
  let W, H;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // petal colours: rose + gold tones
  const COLORS = ['#d4829a', '#c9a96e', '#f0c0d0', '#e8d5b0', '#b97a94'];

  class Petal {
    constructor() { this.reset(true); }

    reset(initial) {
      this.x    = Math.random() * W;
      this.y    = initial ? Math.random() * H : -20;
      this.r    = 3 + Math.random() * 5;
      this.rot  = Math.random() * Math.PI * 2;
      this.drot = (Math.random() - 0.5) * 0.04;
      this.vx   = (Math.random() - 0.5) * 0.6;
      this.vy   = 0.4 + Math.random() * 0.8;
      this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.alpha = 0.3 + Math.random() * 0.5;
      // shape: 0=ellipse, 1=diamond, 2=small round
      this.shape = Math.floor(Math.random() * 3);
    }

    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rot);
      ctx.fillStyle = this.color;
      ctx.beginPath();

      if (this.shape === 0) {
        // ellipse petal
        ctx.ellipse(0, 0, this.r * 0.6, this.r * 1.3, 0, 0, Math.PI * 2);
      } else if (this.shape === 1) {
        // diamond
        ctx.moveTo(0, -this.r);
        ctx.lineTo(this.r * 0.55, 0);
        ctx.lineTo(0, this.r);
        ctx.lineTo(-this.r * 0.55, 0);
        ctx.closePath();
      } else {
        // small circle
        ctx.arc(0, 0, this.r * 0.5, 0, Math.PI * 2);
      }

      ctx.fill();
      ctx.restore();
    }

    update() {
      this.x   += this.vx + Math.sin(this.y * 0.012) * 0.4;
      this.y   += this.vy;
      this.rot += this.drot;
      if (this.y > H + 20) this.reset(false);
    }
  }

  const petals = Array.from({ length: 55 }, () => new Petal());

  function loop() {
    ctx.clearRect(0, 0, W, H);
    petals.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(loop);
  }
  loop();
})();


/* ─── SCROLL REVEAL ─────────────────────────────── */
(function () {
  const exhibits = document.querySelectorAll('.exhibit');

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  exhibits.forEach(el => io.observe(el));
})();


/* ─── GUESTBOOK ─────────────────────────────────── */
(function () {
  const STORAGE_KEY = 'museum_chantelle_guestbook';

  function loadEntries() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  }

  function saveEntries(arr) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  }

  function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function renderEntries(entries) {
    const container = document.getElementById('gb-entries');
    container.innerHTML = '';
    // newest first
    [...entries].reverse().forEach(e => {
      const el = document.createElement('div');
      el.className = 'gb-entry';
      el.innerHTML = `
        <p class="gb-entry-name">${escHtml(e.name)}</p>
        <p class="gb-entry-msg">${escHtml(e.message)}</p>
        <p class="gb-entry-date">${formatDate(e.date)}</p>
      `;
      container.appendChild(el);
    });
  }

  function escHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  const entries = loadEntries();
  renderEntries(entries);

  document.getElementById('gb-submit').addEventListener('click', () => {
    const name = document.getElementById('gb-name').value.trim();
    const msg  = document.getElementById('gb-msg').value.trim();

    if (!name || !msg) {
      // gentle shake
      const form = document.querySelector('.guestbook-form');
      form.style.transform = 'translateX(-6px)';
      setTimeout(() => form.style.transform = 'translateX(6px)', 80);
      setTimeout(() => form.style.transform = '', 160);
      return;
    }

    entries.push({ name, message: msg, date: new Date().toISOString() });
    saveEntries(entries);
    renderEntries(entries);

    document.getElementById('gb-name').value = '';
    document.getElementById('gb-msg').value  = '';

    // scroll to entries
    document.getElementById('gb-entries').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
})();