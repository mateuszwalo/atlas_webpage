// Rok w footer
(function setYear() {
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();

(function mobileNav() {
  var header = document.querySelector('.site-header');
  var btn = document.querySelector('.nav-toggle');
  
  if (!header || !btn) {
    console.error('Błąd: Nie znaleziono nagłówka lub przycisku menu!');
    return;
  }

  // Usuwamy stare listenery (dla pewności, choć w czystym JS to niekonieczne przy odświeżaniu)
  var newBtn = btn.cloneNode(true);
  btn.parentNode.replaceChild(newBtn, btn);
  
  newBtn.addEventListener('click', function (e) {
    e.preventDefault(); // Zapobiega dziwnym skokom strony
    var isOpen = header.classList.toggle('open');
    console.log('Kliknięto menu! Czy otwarte?', isOpen); // To pozwoli sprawdzić czy działa
    newBtn.setAttribute('aria-expanded', String(isOpen));
  });
})();

// link active nav
(function activeLink() {
  var path = (location.pathname || '').split('/').pop() || 'index.html';
  var links = document.querySelectorAll('.site-nav a');
  links.forEach(function (a) {
    var href = a.getAttribute('href');
    if (href === path) a.classList.add('is-active');
  });
})();

// Kalendarz w Planie spotkań
(function calendar() {
  var root = document.getElementById('calendar');
  if (!root) return;

  var today = new Date();
  var year = today.getFullYear();
  var month = today.getMonth(); // 0-11

  var eventsByDate = {
    '2025-12-02': {
      title: 'Spotkanie wieczorne',
      time: '19:30',
      desc: 'Spotkanie sekcji marketingowej'
    }
  };

  (function seedBiweeklySaturdays() {
    var start = new Date(year, month, 1);
    // znajdujemy pierwszą sobotę (getDay() === 6)
    while (start.getDay() !== 6) {
      start.setDate(start.getDate() + 1);
    }
    // koniec zakresu: ostatni dzień miesiąca + 2 miesiące
    var end = new Date(year, month + 3, 0);
    var d = new Date(start.getTime());
    while (d <= end) {
      var iso = d.toISOString().slice(0, 10);
      if (!eventsByDate[iso]) {
        eventsByDate[iso] = {
          title: 'Spotkanie koła',
          time: '10:00',
          desc: 'Plan spotkania: omówienie bieżących spraw, praca nad projektami'
        };
      }
      // przesuwamy o 14 dni
      d.setDate(d.getDate() + 14);
    }
  })();

  var monthNames = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'];
  var dayNames = ['Pn','Wt','Śr','Cz','Pt','So','Nd']; // Monday-first

  function buildCalendar(targetYear, targetMonth) {
    root.innerHTML = '';

    var header = document.createElement('div');
    header.className = 'cal-header';
    var title = document.createElement('div');
    title.className = 'cal-title';
    title.textContent = monthNames[targetMonth] + ' ' + targetYear;
    header.appendChild(title);
    root.appendChild(header);

    var grid = document.createElement('div');
    grid.className = 'cal-grid';

    dayNames.forEach(function (dn) {
      var h = document.createElement('div');
      h.className = 'cal-head';
      h.textContent = dn;
      grid.appendChild(h);
    });

    var first = new Date(targetYear, targetMonth, 1);
    var firstDay = first.getDay(); // 0 Nie ... 6 Sob
    var pad = (firstDay + 6) % 7;
    var daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

    for (var i = 0; i < pad; i++) {
      var empty = document.createElement('div');
      empty.className = 'cal-cell';
      grid.appendChild(empty);
    }

    for (var day = 1; day <= daysInMonth; day++) {
      var cell = document.createElement('div');
      cell.className = 'cal-cell';
      var num = document.createElement('div');
      num.className = 'cal-daynum';
      num.textContent = String(day);
      cell.appendChild(num);

      var date = new Date(targetYear, targetMonth, day);
      var iso = date.toISOString().slice(0, 10);
      if (eventsByDate[iso]) {
        cell.classList.add('has-event');
        var dot = document.createElement('span');
        dot.className = 'event-dot';
        cell.appendChild(dot);

        (function bindPopover(c, evt) {
          var pop;
          function show() {
            if (pop) return;
            pop = document.createElement('div');
            pop.className = 'event-popover';
            var h = document.createElement('h4');
            h.textContent = evt.title + ' — ' + evt.time;
            var p = document.createElement('p');
            p.textContent = evt.desc || '';
            pop.appendChild(h);
            pop.appendChild(p);
            c.appendChild(pop);
          }
          function hide() {
            if (pop && pop.parentNode) {
              pop.parentNode.removeChild(pop);
              pop = null;
            }
          }
          c.addEventListener('mouseenter', show);
          c.addEventListener('mouseleave', hide);
          c.addEventListener('focusin', show);
          c.addEventListener('focusout', hide);
        })(cell, eventsByDate[iso]);
      }

      grid.appendChild(cell);
    }

    root.appendChild(grid);
  }

  buildCalendar(year, month);
})();

// Żarty w Aktualnościach
(function jokesSection() {
  var list = document.getElementById('jokes');
  if (!list) return;
  var btn = document.getElementById('refresh-jokes');

  function renderJokesOne(joke) {
    list.innerHTML = '';
    if (!joke || (!joke.setup && !joke.punchline)) {
      var empty = document.createElement('article');
      empty.className = 'item';
      empty.innerHTML = '<p class="meta">Brak żartów do wyświetlenia.</p>';
      list.appendChild(empty);
      return;
    }
    var card = document.createElement('article');
    card.className = 'item';
    var title = document.createElement('h3');
    title.textContent = joke.setup || 'Żart';
    var text = document.createElement('p');
    text.textContent = joke.punchline || '';
    card.appendChild(title);
    card.appendChild(text);
    list.appendChild(card);
  }

  function showError() {
    list.innerHTML = '';
    var err = document.createElement('article');
    err.className = 'item';
    err.innerHTML = '<p class="meta">Nie udało się pobrać żartów. Spróbuj ponownie później.</p>';
    list.appendChild(err);
  }

  function fetchJokes() {
    // Jeden losowy żart
    fetch('https://official-joke-api.appspot.com/random_joke', { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (data) { renderJokesOne(data || null); })
      .catch(function () { showError(); });
  }

  if (btn) btn.addEventListener('click', fetchJokes);
  fetchJokes();
})();

(function pageTransitions() {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  var body = document.body;

  body.classList.add('page-init');
  requestAnimationFrame(function () {
    body.classList.add('page-enter');
    body.classList.remove('page-init');
  });
  function isInternal(href) {
    if (!href) return false;
    if (href[0] === '#') return false;
    try {
      var url = new URL(href, location.href);
      return url.origin === location.origin;
    } catch (e) {
      return false;
    }
  }
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (!a) return;
    if (a.target && a.target !== '_self') return;
    var href = a.getAttribute('href');
    if (!isInternal(href)) return;
    if (href.indexOf('#') === 0) return;
    e.preventDefault();
    body.classList.add('page-exit');
    setTimeout(function () { window.location.href = href; }, 380);
  });
})();

(function scrollReveal() {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  var els = Array.prototype.slice.call(document.querySelectorAll('.item, .card, h1, h2, h3, .hero-text, .hero-card, .calendar'));
  if (!els.length) return;
  els.forEach(function (el) { el.classList.add('reveal'); });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach(function (el) { io.observe(el); });
})();

(function buttonRipple() {
  document.addEventListener('click', function (e) {
    var btn = e.target && e.target.closest ? e.target.closest('.btn') : null;
    if (!btn) return;
    var rect = btn.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;
    var rip = document.createElement('span');
    rip.className = 'ripple';
    rip.style.left = x + 'px';
    rip.style.top = y + 'px';
    btn.appendChild(rip);
    rip.addEventListener('animationend', function () {
      if (rip && rip.parentNode) rip.parentNode.removeChild(rip);
    });
  });
})();

(function headerScroll() {
  var header = document.querySelector('.site-header');
  if (!header) return;
  function onScroll() {
    if (window.scrollY > 8) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
})();

(function jokesSkeleton() {
  var list = document.getElementById('jokes');
  if (!list) return;
  var origFetch = window.fetch;
  function showSkeleton() {
    list.innerHTML = '';
    var card = document.createElement('article');
    card.className = 'item';
    var l1 = document.createElement('div'); l1.className = 'skel-line';
    var l2 = document.createElement('div'); l2.className = 'skel-line';
    card.appendChild(l1); card.appendChild(l2);
    list.appendChild(card);
  }
  var btn = document.getElementById('refresh-jokes');
  if (btn) btn.addEventListener('click', showSkeleton);
  if (!list.children.length) showSkeleton();
})();

(function enhanceCalendarPopover() {
  var calendar = document.getElementById('calendar');
  if (!calendar) return;
  var observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (m) {
      m.addedNodes && Array.prototype.forEach.call(m.addedNodes, function (node) {
        if (node.classList && node.classList.contains('event-popover')) {
          requestAnimationFrame(function () { node.classList.add('show'); });
        }
      });
    });
  });
  observer.observe(calendar, { subtree: true, childList: true });
})();


