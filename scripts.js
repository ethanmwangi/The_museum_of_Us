document.addEventListener('DOMContentLoaded', function () {

  /* ─── COUNTDOWN ─────────────────────────────────── */
  (function () {
    var target = new Date('2026-04-05T00:00:00');

    function pad(n) { return String(n).padStart(2, '0'); }

    function tick() {
      var now  = new Date();
      var diff = target - now;

      if (diff <= 0) {
        ['cd-days','cd-hours','cd-mins','cd-secs'].forEach(function(id) {
          document.getElementById(id).textContent = '00';
        });
        return;
      }

      var days  = Math.floor(diff / 86400000);
      var hours = Math.floor((diff % 86400000) / 3600000);
      var mins  = Math.floor((diff % 3600000)  / 60000);
      var secs  = Math.floor((diff % 60000)    / 1000);

      function set(id, val) {
        var el = document.getElementById(id);
        if (!el) return;
        var v = pad(val);
        if (el.textContent !== v) {
          el.textContent = v;
          el.classList.remove('tick');
          void el.offsetWidth;
          el.classList.add('tick');
          setTimeout(function() { el.classList.remove('tick'); }, 150);
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
    var canvas = document.getElementById('petals');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var W, H;

    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    var COLORS = ['#d4829a', '#c9a96e', '#f0c0d0', '#e8d5b0', '#b97a94'];

    function Petal(initial) {
      this.reset(initial);
    }
    Petal.prototype.reset = function(initial) {
      this.x     = Math.random() * W;
      this.y     = initial ? Math.random() * H : -20;
      this.r     = 3 + Math.random() * 5;
      this.rot   = Math.random() * Math.PI * 2;
      this.drot  = (Math.random() - 0.5) * 0.04;
      this.vx    = (Math.random() - 0.5) * 0.6;
      this.vy    = 0.4 + Math.random() * 0.8;
      this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.alpha = 0.3 + Math.random() * 0.5;
      this.shape = Math.floor(Math.random() * 3);
    };
    Petal.prototype.draw = function() {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rot);
      ctx.fillStyle = this.color;
      ctx.beginPath();
      if (this.shape === 0) {
        ctx.ellipse(0, 0, this.r * 0.6, this.r * 1.3, 0, 0, Math.PI * 2);
      } else if (this.shape === 1) {
        ctx.moveTo(0, -this.r);
        ctx.lineTo(this.r * 0.55, 0);
        ctx.lineTo(0, this.r);
        ctx.lineTo(-this.r * 0.55, 0);
        ctx.closePath();
      } else {
        ctx.arc(0, 0, this.r * 0.5, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.restore();
    };
    Petal.prototype.update = function() {
      this.x   += this.vx + Math.sin(this.y * 0.012) * 0.4;
      this.y   += this.vy;
      this.rot += this.drot;
      if (this.y > H + 20) this.reset(false);
    };

    var petals = [];
    for (var i = 0; i < 55; i++) petals.push(new Petal(true));

    function loop() {
      ctx.clearRect(0, 0, W, H);
      petals.forEach(function(p) { p.update(); p.draw(); });
      requestAnimationFrame(loop);
    }
    loop();
  })();


  /* ─── SCROLL REVEAL ─────────────────────────────── */
  (function () {
    var exhibits = document.querySelectorAll('.exhibit');
    var io = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    exhibits.forEach(function(el) { io.observe(el); });
  })();


  /* ─── GUESTBOOK ─────────────────────────────────── */
  (function () {
    var STORAGE_KEY = 'museum_chantelle_guestbook';

    function loadEntries() {
      try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
      catch (e) { return []; }
    }
    function saveEntries(arr) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    }
    function formatDate(iso) {
      return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    function escHtml(str) {
      return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }
    function renderEntries(entries) {
      var container = document.getElementById('gb-entries');
      if (!container) return;
      container.innerHTML = '';
      var reversed = entries.slice().reverse();
      reversed.forEach(function(e) {
        var el = document.createElement('div');
        el.className = 'gb-entry';
        el.innerHTML =
          '<p class="gb-entry-name">' + escHtml(e.name)    + '</p>' +
          '<p class="gb-entry-msg">'  + escHtml(e.message) + '</p>' +
          '<p class="gb-entry-date">' + formatDate(e.date)  + '</p>';
        container.appendChild(el);
      });
    }

    var entries = loadEntries();
    renderEntries(entries);

    var submitBtn = document.getElementById('gb-submit');
    if (submitBtn) {
      submitBtn.addEventListener('click', function() {
        var name = document.getElementById('gb-name').value.trim();
        var msg  = document.getElementById('gb-msg').value.trim();
        if (!name || !msg) {
          var form = document.querySelector('.guestbook-form');
          form.style.transform = 'translateX(-6px)';
          setTimeout(function() { form.style.transform = 'translateX(6px)'; }, 80);
          setTimeout(function() { form.style.transform = ''; }, 160);
          return;
        }
        entries.push({ name: name, message: msg, date: new Date().toISOString() });
        saveEntries(entries);
        renderEntries(entries);
        document.getElementById('gb-name').value = '';
        document.getElementById('gb-msg').value  = '';
        document.getElementById('gb-entries').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  })();


  /* ─── LIGHTBOX ───────────────────────────────────── */
  (function () {
    var lightbox  = document.getElementById('lightbox');
    var lbImg     = document.getElementById('lightbox-img');
    var lbCaption = document.getElementById('lightbox-caption');
    var lbClose   = document.getElementById('lightbox-close');

    if (!lightbox || !lbClose) return;

    document.querySelectorAll('.lightbox-trigger').forEach(function(wrap) {
      wrap.addEventListener('click', function() {
        var img = wrap.querySelector('img');
        if (!img) return;
        lbImg.src = img.src;
        lbCaption.textContent = wrap.dataset.caption || '';
        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden';
      });
    });

    function closeLB() {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
    }

    lbClose.addEventListener('click', closeLB);
    lightbox.addEventListener('click', function(e) { if (e.target === lightbox) closeLB(); });
    document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeLB(); });
  })();


  /* ─── SIGN THE WALL ──────────────────────────────── */
  (function () {
    var canvas = document.getElementById('wall-canvas');
    if (!canvas) return;
    var ctx       = canvas.getContext('2d');
    var painting  = false;
    var color     = '#d4829a';
    var brushSize = 3;
    var lastX     = 0;
    var lastY     = 0;

    function initCanvas() {
      var w = canvas.offsetWidth;
      var h = canvas.offsetHeight;
      if (!w || !h) return;
      var snap = null;
      try { snap = ctx.getImageData(0, 0, canvas.width, canvas.height); } catch(e) {}
      canvas.width  = w;
      canvas.height = h;
      if (snap && snap.width > 0) {
        try { ctx.putImageData(snap, 0, 0); } catch(e) {}
      }
    }

    initCanvas();
    window.addEventListener('resize', initCanvas);

    function getPos(e) {
      var rect   = canvas.getBoundingClientRect();
      var src    = e.touches ? e.touches[0] : e;
      var scaleX = canvas.width  / rect.width;
      var scaleY = canvas.height / rect.height;
      return {
        x: (src.clientX - rect.left) * scaleX,
        y: (src.clientY - rect.top)  * scaleY
      };
    }

    canvas.addEventListener('mousedown', function(e) {
      e.preventDefault();
      painting = true;
      var pos  = getPos(e);
      lastX    = pos.x;
      lastY    = pos.y;
      ctx.beginPath();
      ctx.arc(lastX, lastY, brushSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });

    canvas.addEventListener('mousemove', function(e) {
      if (!painting) return;
      e.preventDefault();
      var pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = color;
      ctx.lineWidth   = brushSize;
      ctx.lineCap     = 'round';
      ctx.lineJoin    = 'round';
      ctx.stroke();
      lastX = pos.x;
      lastY = pos.y;
    });

    canvas.addEventListener('mouseup',    function() { painting = false; });
    canvas.addEventListener('mouseleave', function() { painting = false; });

    canvas.addEventListener('touchstart', function(e) {
      e.preventDefault();
      painting = true;
      var pos  = getPos(e);
      lastX    = pos.x;
      lastY    = pos.y;
      ctx.beginPath();
      ctx.arc(lastX, lastY, brushSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }, { passive: false });

    canvas.addEventListener('touchmove', function(e) {
      if (!painting) return;
      e.preventDefault();
      var pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = color;
      ctx.lineWidth   = brushSize;
      ctx.lineCap     = 'round';
      ctx.lineJoin    = 'round';
      ctx.stroke();
      lastX = pos.x;
      lastY = pos.y;
    }, { passive: false });

    canvas.addEventListener('touchend', function() { painting = false; });

    /* colour swatches */
    document.querySelectorAll('.swatch').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        document.querySelectorAll('.swatch').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        color = btn.dataset.color;
      });
    });

    /* brush sizes */
    document.querySelectorAll('.brush-btn').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        document.querySelectorAll('.brush-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        brushSize = parseInt(btn.dataset.size, 10);
      });
    });

    /* clear */
    var clearBtn = document.getElementById('wall-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      });
    }
  })();


  /* ─── CONFETTI + BIRTHDAY PAGE ───────────────────── */
  (function () {
    var canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    var ctx    = canvas.getContext('2d');
    var pieces = [];
    var animId = null;

    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    var COLORS = ['#d4829a','#c9a96e','#f0c0d0','#e8d5b0','#7ec8b8','#ffffff','#f6c90e'];

    function Piece() {
      this.x     = Math.random() * canvas.width;
      this.y     = -10;
      this.w     = 8 + Math.random() * 10;
      this.h     = 4 + Math.random() * 6;
      this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.rot   = Math.random() * Math.PI * 2;
      this.drot  = (Math.random() - 0.5) * 0.18;
      this.vx    = (Math.random() - 0.5) * 3;
      this.vy    = 2.5 + Math.random() * 3.5;
      this.alpha = 1;
    }
    Piece.prototype.update = function() {
      this.x   += this.vx;
      this.y   += this.vy;
      this.rot += this.drot;
      if (this.y > canvas.height - 80) this.alpha -= 0.02;
    };
    Piece.prototype.draw = function() {
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.alpha);
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rot);
      ctx.fillStyle = this.color;
      ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
      ctx.restore();
    };

    function spawnBurst() {
      for (var i = 0; i < 18; i++) pieces.push(new Piece());
    }

    var spawnCount = 0;

    function loop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces = pieces.filter(function(p) { return p.alpha > 0; });
      pieces.forEach(function(p) { p.update(); p.draw(); });
      if (spawnCount < 30) {
        if (spawnCount % 4 === 0) spawnBurst();
        spawnCount++;
      }
      if (pieces.length > 0 || spawnCount < 30) {
        animId = requestAnimationFrame(loop);
      } else {
        canvas.classList.remove('active');
        window.location.href = 'birthday.html';
      }
    }

    var triggerBtn = document.getElementById('birthday-trigger');
    if (triggerBtn) {
      triggerBtn.addEventListener('click', function() {
        pieces     = [];
        spawnCount = 0;
        canvas.classList.add('active');
        if (animId) cancelAnimationFrame(animId);
        loop();
      });
    }
  })();

}); 