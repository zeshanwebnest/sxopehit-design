/* =========================================================
   SxopeHit - main.js
   Preloader, sticky header, mobile nav, search, hero slider,
   scroll reveal, counters, accordion, testimonial slider,
   marquee, back-to-top, form validation.
   ========================================================= */
(function () {
  'use strict';

  var $ = function (s, ctx) { return (ctx || document).querySelector(s); };
  var $$ = function (s, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. PRELOADER ---------- */
  window.addEventListener('load', function () {
    var pre = $('#preloader');
    if (!pre) return;
    setTimeout(function () { pre.classList.add('is-done'); }, 400);
  });
  // safety net so the page is never stuck behind the loader
  setTimeout(function () {
    var pre = $('#preloader');
    if (pre) pre.classList.add('is-done');
  }, 3500);

  /* ---------- 2. STICKY HEADER ----------
     The header is absolutely positioned over the hero, so it never occupies
     flow space and no spacer is needed - it just switches to fixed. */
  var navbar = $('#navbar');
  var siteHeader = $('#siteHeader');

  function syncSticky() {
    if (!siteHeader) return;
    var hero = $('#hero');
    var trigger = hero ? hero.offsetHeight * 0.55 : 320;
    siteHeader.classList.toggle('is-stuck', window.scrollY > trigger);
  }

  /* ---------- 3. MOBILE NAV ---------- */
  var mobileNav = $('#mobileNav');
  var backdrop = $('#navBackdrop');

  function openNav() {
    mobileNav && mobileNav.classList.add('is-open');
    backdrop && backdrop.classList.add('is-open');
    document.body.classList.add('is-locked');
  }
  function closeNav() {
    mobileNav && mobileNav.classList.remove('is-open');
    backdrop && backdrop.classList.remove('is-open');
    document.body.classList.remove('is-locked');
  }

  var burger = $('#burger');
  burger && burger.addEventListener('click', openNav);
  $('#mobileNavClose') && $('#mobileNavClose').addEventListener('click', closeNav);
  backdrop && backdrop.addEventListener('click', closeNav);

  // mobile submenu toggles
  $$('.m-menu .m-arrow').forEach(function (arrow) {
    arrow.addEventListener('click', function () {
      var li = arrow.parentNode;
      var sub = $('.m-sub', li);
      var isOpen = li.classList.contains('is-open');

      $$('.m-menu > li.is-open').forEach(function (other) {
        if (other === li) return;
        other.classList.remove('is-open');
        var s = $('.m-sub', other);
        if (s) s.style.maxHeight = null;
      });

      li.classList.toggle('is-open', !isOpen);
      if (sub) sub.style.maxHeight = isOpen ? null : sub.scrollHeight + 'px';
    });
  });

  // close the drawer after tapping a real link
  $$('.mobile-nav a').forEach(function (a) {
    a.addEventListener('click', function () {
      if (a.getAttribute('href') && a.getAttribute('href') !== '#') closeNav();
    });
  });

  /* ---------- 4. SEARCH POPUP ---------- */
  var popup = $('#searchPopup');
  $('#searchToggle') && $('#searchToggle').addEventListener('click', function () {
    if (!popup) return;
    popup.classList.add('is-open');
    document.body.classList.add('is-locked');
    var input = $('input', popup);
    if (input) setTimeout(function () { input.focus(); }, 260);
  });
  function closeSearch() {
    popup && popup.classList.remove('is-open');
    document.body.classList.remove('is-locked');
  }
  $('#searchClose') && $('#searchClose').addEventListener('click', closeSearch);
  popup && popup.addEventListener('click', function (e) { if (e.target === popup) closeSearch(); });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeSearch(); closeNav(); }
  });

  /* ---------- 5. HERO SLIDER (Swiper) ---------- */
  (function heroSlider() {
    var el = $('#heroSwiper');
    if (!el || typeof window.Swiper === 'undefined') return;

    var swiper = new window.Swiper(el, {
      loop: true,
      speed: 1000,
      effect: 'fade',
      fadeEffect: { crossFade: true },
      grabCursor: true,
      autoplay: reduced ? false : { delay: 6000, disableOnInteraction: false, pauseOnMouseEnter: true },
      keyboard: { enabled: true, onlyInViewport: true },
      pagination: { el: '#heroPagination', clickable: true },
      a11y: {
        enabled: true,
        prevSlideMessage: 'Previous slide',
        nextSlideMessage: 'Next slide',
        paginationBulletMessage: 'Go to slide {{index}}'
      }
    });

    // pause the autoplay while the tab is hidden so slides do not pile up
    document.addEventListener('visibilitychange', function () {
      if (!swiper.autoplay) return;
      document.hidden ? swiper.autoplay.stop() : swiper.autoplay.start();
    });
  })();


  /* ---------- 6. SCROLL REVEAL ---------- */
  (function reveal() {
    var items = $$('[data-reveal]');
    if (!items.length) return;

    if (!('IntersectionObserver' in window) || reduced) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = parseInt(el.getAttribute('data-delay') || '0', 10);
        setTimeout(function () { el.classList.add('is-visible'); }, delay);
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    items.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- 7. COUNTERS ---------- */
  (function counters() {
    var nums = $$('.counter');
    if (!nums.length) return;

    function run(el) {
      var target = parseInt(el.getAttribute('data-count'), 10) || 0;
      if (reduced) { el.textContent = target; return; }
      var start = null;
      var DUR = 1900;

      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / DUR, 1);
        // ease-out so the count decelerates towards the target
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased);
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    if (!('IntersectionObserver' in window)) {
      nums.forEach(run);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        run(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.5 });
    nums.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- 8. FAQ ACCORDION ---------- */
  (function accordion() {
    var items = $$('#accordion .acc-item');
    if (!items.length) return;

    function setHeight(item, open) {
      var body = $('.acc-body', item);
      if (!body) return;
      body.style.maxHeight = open ? body.scrollHeight + 'px' : null;
    }

    items.forEach(function (item) {
      var head = $('.acc-head', item);
      if (item.classList.contains('is-open')) setHeight(item, true);

      head && head.addEventListener('click', function () {
        var willOpen = !item.classList.contains('is-open');
        items.forEach(function (other) {
          other.classList.remove('is-open');
          setHeight(other, false);
        });
        if (willOpen) {
          item.classList.add('is-open');
          setHeight(item, true);
        }
      });
    });

    window.addEventListener('resize', function () {
      items.forEach(function (item) { setHeight(item, item.classList.contains('is-open')); });
    });
  })();

  /* ---------- 9. TESTIMONIAL SLIDER ---------- */
  (function testimonials() {
    var track = $('#tTrack');
    var dotsWrap = $('#tDots');
    if (!track) return;

    var slides = $$('.tslide', track);
    var index = 0;
    var timer = null;

    function perView() {
      if (window.innerWidth >= 992) return 3;
      if (window.innerWidth >= 768) return 2;
      return 1;
    }
    function maxIndex() { return Math.max(slides.length - perView(), 0); }

    function buildDots() {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = '';
      for (var i = 0; i <= maxIndex(); i++) {
        (function (i) {
          var dot = document.createElement('button');
          dot.type = 'button';
          dot.setAttribute('aria-label', 'Go to testimonial ' + (i + 1));
          dot.addEventListener('click', function () { go(i); });
          dotsWrap.appendChild(dot);
        })(i);
      }
    }

    function update() {
      var step = 100 / perView();
      track.style.transform = 'translateX(-' + (index * step) + '%)';
      $$('button', dotsWrap || document.createElement('div')).forEach(function (d, i) {
        d.classList.toggle('is-active', i === index);
      });
    }

    function go(i) {
      index = i > maxIndex() ? 0 : (i < 0 ? maxIndex() : i);
      update();
      restart();
    }

    function restart() {
      clearInterval(timer);
      if (!reduced) timer = setInterval(function () { go(index + 1); }, 5200);
    }

    $('#tNext') && $('#tNext').addEventListener('click', function () { go(index + 1); });
    $('#tPrev') && $('#tPrev').addEventListener('click', function () { go(index - 1); });

    var startX = null;
    track.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var diff = e.changedTouches[0].clientX - startX;
      if (Math.abs(diff) > 50) { go(index + (diff < 0 ? 1 : -1)); }
      startX = null;
    });

    var wrap = $('.tslider');
    wrap.addEventListener('mouseenter', function () { clearInterval(timer); });
    wrap.addEventListener('mouseleave', restart);

    window.addEventListener('resize', function () {
      if (index > maxIndex()) index = maxIndex();
      buildDots();
      update();
    });

    buildDots();
    update();
    restart();
  })();

  /* ---------- 10. MARQUEE ---------- */
  (function marquee() {
    var track = $('#marqueeTrack');
    if (!track) return;
    var group = $('.marquee__group', track);
    if (!group) return;

    // repeat the group until it comfortably overflows the viewport,
    // then mirror the whole run so the -50% loop is seamless
    var guard = 0;
    while (track.scrollWidth < window.innerWidth * 1.3 && guard < 12) {
      track.appendChild(group.cloneNode(true));
      guard++;
    }
    var run = Array.prototype.slice.call(track.children);
    run.forEach(function (node) { track.appendChild(node.cloneNode(true)); });
  })();

  /* ---------- 11. BACK TO TOP ---------- */
  (function toTop() {
    var btn = $('#toTop');
    var bar = $('#toTopBar');
    if (!btn) return;

    var LEN = 2 * Math.PI * 18;
    if (bar) {
      bar.style.strokeDasharray = LEN;
      bar.style.strokeDashoffset = LEN;
    }

    function onScroll() {
      var scrollable = document.documentElement.scrollHeight - window.innerHeight;
      var progress = scrollable > 0 ? window.scrollY / scrollable : 0;
      if (bar) bar.style.strokeDashoffset = LEN - (LEN * Math.min(progress, 1));
      btn.classList.toggle('is-visible', window.scrollY > 420);
    }

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    });

    window.__toTopScroll = onScroll;
    onScroll();
  })();

  /* ---------- 12. SCROLL DISPATCHER ---------- */
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      syncSticky();
      if (window.__toTopScroll) window.__toTopScroll();
      ticking = false;
    });
  }, { passive: true });
  syncSticky();

  /* ---------- 13. SMOOTH ANCHOR SCROLL ---------- */
  $$('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href');
      if (!id || id === '#') return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var offset = navbar ? navbar.offsetHeight : 0;
      var top = target.getBoundingClientRect().top + window.scrollY - offset + 1;
      window.scrollTo({ top: top, behavior: reduced ? 'auto' : 'smooth' });
    });
  });

  /* ---------- 14. FORMS ---------- */
  function isEmail(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value); }

  (function apptForm() {
    var form = $('#apptForm');
    var note = $('#formNote');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fields = $$('input[required], select[required]', form);
      var bad = 0;

      fields.forEach(function (field) {
        var value = field.value.trim();
        var invalid = !value || (field.type === 'email' && !isEmail(value));
        field.classList.toggle('has-error', invalid);
        if (invalid) bad++;
      });

      if (bad) {
        note.textContent = 'Please complete the highlighted fields before submitting.';
        note.className = 'form-note is-err';
        return;
      }

      note.textContent = 'Thank you. Your appointment request has been received — an advisor will contact you within one business day.';
      note.className = 'form-note is-ok';
      form.reset();
    });

    // clear the error state as soon as the user corrects a field
    $$('input, select, textarea', form).forEach(function (field) {
      field.addEventListener('input', function () { field.classList.remove('has-error'); });
      field.addEventListener('change', function () { field.classList.remove('has-error'); });
    });
  })();

  (function newsletter() {
    var form = $('#newsletterForm');
    var note = $('#nlNote');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = $('#nl-email');
      var value = input.value.trim();

      if (!isEmail(value)) {
        note.textContent = 'Please enter a valid email address.';
        note.className = 'form-note is-err';
        return;
      }
      note.textContent = 'You are subscribed. Thanks for joining our newsletter.';
      note.className = 'form-note is-ok';
      form.reset();
    });
  })();

  /* ---------- 15. GALLERY LIGHTBOX ---------- */
  (function lightbox() {
    var grid = $('#galleryGrid');
    var box = $('#lightbox');
    if (!grid || !box) return;

    var items = $$('.gitem', grid);
    var img = $('#lbImg');
    var count = $('#lbCount');
    var index = 0;

    function show(n) {
      index = (n + items.length) % items.length;
      var btn = items[index];
      var thumb = $('img', btn);
      img.src = btn.getAttribute('data-full');
      img.alt = thumb ? thumb.alt : '';
      count.textContent = (index + 1) + ' / ' + items.length;
    }
    function open(n) {
      show(n);
      box.classList.add('is-open');
      document.body.classList.add('is-locked');
      var c = $('#lbClose'); if (c) c.focus();
    }
    function close() {
      box.classList.remove('is-open');
      document.body.classList.remove('is-locked');
      if (items[index]) items[index].focus();
    }

    items.forEach(function (btn, n) {
      btn.addEventListener('click', function () { open(n); });
    });
    $('#lbClose') && $('#lbClose').addEventListener('click', close);
    $('#lbPrev') && $('#lbPrev').addEventListener('click', function () { show(index - 1); });
    $('#lbNext') && $('#lbNext').addEventListener('click', function () { show(index + 1); });
    box.addEventListener('click', function (e) { if (e.target === box) close(); });

    document.addEventListener('keydown', function (e) {
      if (!box.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(index - 1);
      if (e.key === 'ArrowRight') show(index + 1);
    });
  })();

  /* ---------- 16. BLOG LOAD MORE ---------- */
  (function loadMore() {
    var btn = $('#loadMore');
    var grid = $('#blogGrid');
    var count = $('#blogCount');
    if (!btn || !grid) return;

    var total = $$('.post', grid).length;
    var STEP = 3;

    btn.addEventListener('click', function () {
      var hidden = $$('.post.is-hidden', grid);
      hidden.slice(0, STEP).forEach(function (p) { p.classList.remove('is-hidden'); });

      var left = $$('.post.is-hidden', grid).length;
      if (count) count.textContent = 'Showing ' + (total - left) + ' of ' + total + ' articles';
      if (!left) {
        btn.classList.add('is-done');
        btn.innerHTML = 'All articles shown';
        btn.setAttribute('disabled', 'disabled');
      }
    });
  })();

  /* ---------- 17. CONTACT FORM ---------- */
  (function contactForm() {
    var form = $('#contactForm');
    var note = $('#contactNote');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fields = $$('input[required], select[required]', form);
      var bad = 0;

      fields.forEach(function (field) {
        var value = field.value.trim();
        var invalid = !value || (field.type === 'email' && !isEmail(value));
        field.classList.toggle('has-error', invalid);
        if (invalid) bad++;
      });

      if (bad) {
        note.textContent = 'Please complete the highlighted fields before sending.';
        note.className = 'form-note is-err';
        return;
      }
      note.textContent = 'Thank you. Your message has been sent - we will reply within one business day.';
      note.className = 'form-note is-ok';
      form.reset();
    });

    $$('input, select, textarea', form).forEach(function (field) {
      field.addEventListener('input', function () { field.classList.remove('has-error'); });
      field.addEventListener('change', function () { field.classList.remove('has-error'); });
    });
  })();

  /* ---------- 18. UNIVERSITY PARTNERS TICKER ---------- */
  (function uniSlider() {
    var el = $('#uniSwiper');
    if (!el || typeof window.Swiper === 'undefined') return;

    new window.Swiper(el, {
      loop: true,
      slidesPerView: 'auto',
      spaceBetween: 24,
      speed: 4200,
      allowTouchMove: true,
      freeMode: { enabled: true, momentum: false },
      autoplay: reduced ? false : { delay: 0, disableOnInteraction: false, pauseOnMouseEnter: true },
      a11y: { enabled: true }
    });
  })();

  /* ---------- 19. ARTICLE SHARE LINKS ---------- */
  (function shareLinks() {
    var links = $$('[data-share]');
    if (!links.length) return;

    var url = encodeURIComponent(window.location.href);
    var title = encodeURIComponent(document.title);

    links.forEach(function (a) {
      var kind = a.getAttribute('data-share');
      if (kind === 'whatsapp') {
        a.href = 'https://wa.me/?text=' + title + '%20' + url;
      } else {
        a.href = a.getAttribute('href') + url;
      }
    });
  })();

  /* ---------- 20. CURRENT YEAR ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
