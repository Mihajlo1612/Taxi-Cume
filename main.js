/* =============================================================
   Cume Taxi — main.js
   Sve što sajtu treba: poziv na klik + par sitnica.
   ============================================================= */
(function () {
  'use strict';

  /* --- Jedno mesto za kontakt podatke ------------------------------------
     Promeniš broj ovde i on se primenjuje na CELOM sajtu (svi tel: linkovi,
     Viber, i tekst gde god je ispisan stari broj).                         */
  var CONTACT = {
    tel: '+381638782339',            // bez razmaka — ovo ide u tel:
    telPretty: '+381 63 878 2339',   // ovako se prikazuje
    viber: '+381638782339',
    email: 'cumetaxi@gmail.com'
  };

  var isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

  /* --- 1. Poziv na klik --------------------------------------------------
     tel: radi na svim telefonima. Na desktopu nema šta da otvori, pa tamo
     umesto poziva kopiramo broj i kratko javimo korisniku.                 */
  document.querySelectorAll('[data-call]').forEach(function (el) {
    el.setAttribute('href', 'tel:' + CONTACT.tel);

    el.addEventListener('click', function (e) {
      if (isTouch) return;                     // telefon -> pusti tel: da radi

      e.preventDefault();
      copy(CONTACT.telPretty);
      toast('Broj kopiran: ' + CONTACT.telPretty);
    });
  });

  /* --- 2. Kopiranje broja (desktop) -------------------------------------- */
  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).catch(function () {});
      return;
    }
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:absolute;left:-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (err) {}
    document.body.removeChild(ta);
  }

  /* --- 3. Mala poruka u uglu --------------------------------------------- */
  var toastEl = null, toastTimer = null;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.setAttribute('role', 'status');
      toastEl.style.cssText =
        'position:fixed;left:50%;bottom:28px;transform:translateX(-50%) translateY(12px);' +
        'background:#131313;color:#f9ba27;font:600 15px/1 "Plus Jakarta Sans",sans-serif;' +
        'letter-spacing:-.02em;padding:14px 22px;z-index:100;opacity:0;' +
        'transition:opacity .2s ease,transform .2s ease;pointer-events:none';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    requestAnimationFrame(function () {
      toastEl.style.opacity = '1';
      toastEl.style.transform = 'translateX(-50%) translateY(0)';
    });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.style.opacity = '0';
      toastEl.style.transform = 'translateX(-50%) translateY(12px)';
    }, 2200);
  }

  /* --- 4. Lebdeće dugme se krije dok je hero na ekranu -------------------- */
  var fab = document.querySelector('.fab');
  var hero = document.querySelector('.hero');
  if (fab && hero && 'IntersectionObserver' in window) {
    fab.style.transition = 'opacity .25s ease, transform .25s ease';
    new IntersectionObserver(function (entries) {
      var heroVisible = entries[0].isIntersecting;
      fab.style.opacity = heroVisible ? '0' : '1';
      fab.style.transform = heroVisible ? 'translateY(90px)' : 'translateY(0)';
      fab.style.pointerEvents = heroVisible ? 'none' : 'auto';
    }, { threshold: 0.25 }).observe(hero);
  }

  /* --- Pomoćne funkcije za animacije teksta -------------------------------
     split()  razbija tekst na slova, čuvajući <b>, <br> i ugnežđene spanove
     shield() sklanja razbijeni sadržaj od čitača ekrana i stavlja ceo tekst
              u aria-label — inače bi se čitalo slovo po slovo               */
  function split(node, out) {
    Array.prototype.slice.call(node.childNodes).forEach(function (child) {
      if (child.nodeType === 3) {
        var frag = document.createDocumentFragment();
        child.textContent.split('').forEach(function (ch) {
          if (!ch.trim()) { frag.appendChild(document.createTextNode(ch)); return; }
          var s = document.createElement('span');
          s.className = 'letter';
          s.textContent = ch;
          out.push(s);
          frag.appendChild(s);
        });
        child.parentNode.replaceChild(frag, child);
      } else if (child.nodeType === 1 && child.tagName !== 'BR') {
        split(child, out);
      }
    });
    return out;
  }

  function shield(host) {
    var label = Array.prototype.slice.call(host.childNodes).map(function (n) {
      return (n.nodeType === 1 && n.tagName === 'BR') ? ' ' : n.textContent;
    }).join('').replace(/\s+/g, ' ').trim();
    var inner = document.createElement('span');
    inner.setAttribute('aria-hidden', 'true');
    while (host.firstChild) inner.appendChild(host.firstChild);
    host.appendChild(inner);
    host.setAttribute('aria-label', label);
    return inner;
  }

  /* Odvaja sve pre datog elementa u zaseban span (bez <br>) — tako se
     naslov u dva reda deli na dve grupe koje mogu da idu jedna za drugom. */
  function partBefore(inner, stop, cls) {
    var part = document.createElement('span');
    part.className = cls;
    var n = inner.firstChild;
    while (n && n !== stop) {
      var next = n.nextSibling;
      if (!(n.nodeType === 1 && n.tagName === 'BR')) part.appendChild(n);
      n = next;
    }
    inner.insertBefore(part, inner.firstChild);
    return part;
  }

  function whenReady(fn) {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { requestAnimationFrame(fn); });
    } else {
      requestAnimationFrame(fn);
    }
  }

  /* --- 5. Uvod u hero sekciji: naslov pa citat ---------------------------
     Redosled: "Cume Taxi" -> "Velika Plana" -> "Putuj duže, putuj jeftinije."

     Naslov: slova se dižu odozdo uz pojavljivanje (anime.js "ml13").
     Citat:  slova elastično iskaču (anime.js "ml9").
     Obe animacije su CSS @keyframes; ovde se samo računa kad koje slovo kreće
     i upisuje u --d. Sve ide jednom, pri učitavanju.                        */
  (function heroIntro() {
    var title = document.querySelector('[data-title]');
    var quote = document.querySelector('[data-letters]');
    var fades = document.querySelectorAll('.hero [data-fade]');
    if (!title && !quote) return;

    var START = 100;        // koliko se čeka pre prvog slova
    var TITLE_STEP = 30;    // razmak između slova u naslovu
    var TITLE_SETTLE = 150; // koliko se čeka da grupa "slegne" pre sledeće
    var QUOTE_STEP = 42;    // razmak između slova u citatu
    var FADE_AFTER = 100;   // pauza pre poslednjeg bloka koji se samo pojavi

    var clock = START;

    if (title) {
      var inner = shield(title);

      /* Naslov ima dve grupe: "Cume Taxi" (crno) i "Velika Plana" (žuto).
         Žuti deo je već u svom spanu; sve pre njega je prva grupa.          */
      var yellow = inner.querySelector('.is-yellow');
      var groups = yellow ? [partBefore(inner, yellow, 'title-part'), yellow] : [inner];

      groups.forEach(function (group) {
        var ls = split(group, []);
        ls.forEach(function (el, i) {
          el.style.setProperty('--d', (clock + i * TITLE_STEP) + 'ms');
        });
        clock += (ls.length - 1) * TITLE_STEP + TITLE_SETTLE;
      });
    }

    if (quote) {
      var qInner = shield(quote);
      var qs = split(qInner, []);
      qs.forEach(function (el, i) {
        el.style.setProperty('--d', (clock + i * QUOTE_STEP) + 'ms');
      });
      clock += (qs.length - 1) * QUOTE_STEP + FADE_AFTER;
    }

    // Poslednji na redu — ceo blok se samo pojavi uz podizanje, bez deljenja
    // na slova. Kratak pasus se tako čita, a ne "kuca".
    Array.prototype.forEach.call(fades, function (el) {
      el.style.setProperty('--d', clock + 'ms');
    });

    // Čeka font da se raspored ne trza dok slova ulaze.
    whenReady(function () {
      if (title) title.classList.add('is-armed');
      if (quote) quote.classList.add('is-armed');
      Array.prototype.forEach.call(fades, function (el) { el.classList.add('is-armed'); });
    });
  })();

  /* --- 6. Uvod u baneru ---------------------------------------------------
     "Što duže putuješ," — slova se uvrću odozdo desno (anime.js "ml7")
     "MANJE PLAĆAŠ"      — slova se okreću oko uspravne ose (anime.js "ml10")
     pasus ispod         — ceo blok, fade uz podizanje

     Kreće kad baner uđe u ekran, jednom.                                    */
  (function bannerIntro() {
    var title = document.querySelector('[data-banner-title]');
    var fades = document.querySelectorAll('.banner [data-fade]');
    if (!title) return;

    var START = 100;
    var SWING_STEP = 50;    // razmak između slova u prvom redu
    var SWING_SETTLE = 150; // pauza pre drugog reda
    var FLIP_STEP = 45;     // razmak između slova u drugom redu
    var FLIP_SETTLE = 100;  // pauza pre pasusa

    var inner = shield(title);
    var yellow = inner.querySelector('.is-yellow');
    var clock = START;

    if (yellow) {
      var line1 = partBefore(inner, yellow, 'swing-line');
      split(line1, []).forEach(function (el, i) {
        el.style.setProperty('--d', (clock + i * SWING_STEP) + 'ms');
      });
      clock += (line1.querySelectorAll('.letter').length - 1) * SWING_STEP + SWING_SETTLE;

      var ls2 = split(yellow, []);
      ls2.forEach(function (el, i) {
        el.style.setProperty('--d', (clock + i * FLIP_STEP) + 'ms');
      });
      clock += (ls2.length - 1) * FLIP_STEP + FLIP_SETTLE;
    } else {
      split(inner, []).forEach(function (el, i) {
        el.style.setProperty('--d', (clock + i * SWING_STEP) + 'ms');
      });
    }

    Array.prototype.forEach.call(fades, function (el) {
      el.style.setProperty('--d', clock + 'ms');
    });

    var play = function () {
      whenReady(function () {
        title.classList.add('is-armed');
        Array.prototype.forEach.call(fades, function (el) { el.classList.add('is-armed'); });
      });
    };

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries, obs) {
        if (!entries[0].isIntersecting) return;
        obs.disconnect();
        play();
      }, { threshold: 0.3 }).observe(title);
    } else {
      play();
    }
  })();

  /* --- 7. Naslov "Udobno. Sigurno. Povoljno." — reč po reč ----------------
     Slova se uvrću odozdo (kao anime.js "ml7"). Jedna reč se ispiše, pa
     pauza, pa sledeća. Ovde se samo računa kašnjenje po slovu; sam pokret
     je CSS animacija @keyframes word-in.                                    */
  (function words() {
    var host = document.querySelector('[data-words]');
    if (!host) return;

    var STAGGER = 50;   // razmak između slova iste reči
    var DURATION = 150; // trajanje jednog slova
    var PAUSE = 100;    // pauza između reči

    // <br> nije razmak u textContent-u, pa se natpis za čitač ekrana
    // sklapa ručno — inače bi ispalo "Udobno.Sigurno."
    var label = Array.prototype.slice.call(host.childNodes).map(function (n) {
      return (n.nodeType === 1 && n.tagName === 'BR') ? ' ' : n.textContent;
    }).join('').replace(/\s+/g, ' ').trim();

    var inner = document.createElement('span');
    inner.setAttribute('aria-hidden', 'true');

    var clock = 0;

    function addWord(chunk) {
      var word = document.createElement('span');
      word.className = 'word';
      chunk.split('').forEach(function (ch, i) {
        var s = document.createElement('span');
        s.className = 'letter';
        s.textContent = ch;
        s.style.setProperty('--d', (clock + i * STAGGER) + 'ms');
        word.appendChild(s);
      });
      clock += (chunk.length - 1) * STAGGER + DURATION + PAUSE;
      inner.appendChild(word);
    }

    // <br> u naslovu mora da preživi razbijanje — otud obilazak čvorova
    Array.prototype.slice.call(host.childNodes).forEach(function (node) {
      if (node.nodeType === 1 && node.tagName === 'BR') {
        inner.appendChild(document.createElement('br'));
        return;
      }
      if (node.nodeType !== 3) return;
      node.textContent.split(/(\s+)/).forEach(function (chunk) {
        if (!chunk) return;
        if (!chunk.trim()) { inner.appendChild(document.createTextNode(chunk)); return; }
        addWord(chunk);
      });
    });

    host.textContent = '';
    host.appendChild(inner);
    host.setAttribute('aria-label', label);
    host.classList.add('is-ready');            // slova čekaju ispod ivice

    var play = function () { host.classList.add('is-playing'); };

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries, obs) {
        if (!entries[0].isIntersecting) return;
        obs.disconnect();
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(play);
        } else { play(); }
      }, { threshold: 0.35 }).observe(host);
    } else {
      play();
    }
  })();

  /* --- 8. Naslovi koji izranjaju odozdo (anime.js "ml6") -----------------
     "Gde nas možete pronaći" i obe adrese ispod mapa.
     Slova ulaze odozdo uz elastično popuštanje, 50 ms razmaka, bez pauza
     između reči. Svaki naslov kreće za sebe, kad uđe u ekran.               */
  (function riseIn() {
    var STEP = 50;
    var hosts = document.querySelectorAll('[data-rise]');
    if (!hosts.length) return;

    Array.prototype.forEach.call(hosts, function (host) {
      var inner = shield(host);
      var n = 0;

      /* Reči se pakuju u .word sa overflow:hidden — tako slova izranjaju iza
         ivice reda, a naslov u dva reda i dalje radi. */
      Array.prototype.slice.call(inner.childNodes).forEach(function (node) {
        if (node.nodeType === 1 && node.tagName === 'BR') return;
        if (node.nodeType !== 3) return;
        var frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach(function (chunk) {
          if (!chunk) return;
          if (!chunk.trim()) { frag.appendChild(document.createTextNode(chunk)); return; }
          var word = document.createElement('span');
          word.className = 'word';
          chunk.split('').forEach(function (ch) {
            var el = document.createElement('span');
            el.className = 'letter';
            el.textContent = ch;
            el.style.setProperty('--d', (n++ * STEP) + 'ms');
            word.appendChild(el);
          });
          frag.appendChild(word);
        });
        node.parentNode.replaceChild(frag, node);
      });

      host.classList.add('is-ready');

      var play = function () { whenReady(function () { host.classList.add('is-playing'); }); };
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries, obs) {
          if (!entries[0].isIntersecting) return;
          obs.disconnect();
          play();
        }, { threshold: 0.4 }).observe(host);
      } else {
        play();
      }
    });
  })();

  /* --- 9. Nadnaslovi: linija se povuče, pa slova uklize (anime.js "ml14") --
     Linija ide zdesna nalevo (900 ms), a slova krenu 600 ms pre nego što
     linija završi — otud početak na 450 ms i razmak od 25 ms.
     Svaki nadnaslov kreće za sebe, kad uđe u ekran.                         */
  (function eyebrows() {
    var LINE_MS = 900;
    var OVERLAP = 600;   // koliko slova "ulaze" u liniju
    var LEAD = 150;      // kašnjenje prvog slova posle preklapanja
    var STEP = 25;

    var hosts = document.querySelectorAll('[data-eyebrow]');
    if (!hosts.length) return;

    Array.prototype.forEach.call(hosts, function (host) {
      var inner = shield(host);

      // ceo tekst ide u omotač koji nosi liniju
      var wrap = document.createElement('span');
      wrap.className = 'text-wrapper';
      while (inner.firstChild) wrap.appendChild(inner.firstChild);
      inner.appendChild(wrap);

      var line = document.createElement('span');
      line.className = 'line';
      wrap.appendChild(line);

      var startAt = LINE_MS - OVERLAP + LEAD;
      split(wrap, []).forEach(function (el, i) {
        el.style.setProperty('--d', (startAt + i * STEP) + 'ms');
      });

      host.classList.add('is-ready');

      var play = function () { whenReady(function () { host.classList.add('is-playing'); }); };
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries, obs) {
          if (!entries[0].isIntersecting) return;
          obs.disconnect();
          play();
        }, { threshold: 0.6 }).observe(host);
      } else {
        play();
      }
    });
  })();

  /* --- 10. Mape se učitavaju tek kad se približe ekranu -------------------- */
  document.querySelectorAll('.loc__map iframe').forEach(function (frame) {
    if (!('IntersectionObserver' in window)) return;
    var src = frame.getAttribute('src');
    frame.removeAttribute('src');
    new IntersectionObserver(function (entries, obs) {
      if (entries[0].isIntersecting) {
        frame.setAttribute('src', src);
        obs.disconnect();
      }
    }, { rootMargin: '400px' }).observe(frame);
  });

})();

