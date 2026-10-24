/* Shared prototype behaviour: language switching, navigation, modals, archive search, forms.
   Vanilla JS, no dependencies. User input is only ever written with textContent / value. */
(function () {
  'use strict';

  var SITE = window.SITE;
  var C = window.CONCEPT || {};
  var cdict = C.dict || {};
  var dict = {
    en: Object.assign({}, SITE.dict.en, cdict.en || {}),
    ar: Object.assign({}, SITE.dict.ar, cdict.ar || {})
  };
  var root = document.documentElement;
  var STORE_KEY = 'imih-proto-lang';
  var lang = 'en';
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function num(n) { return Number(n).toLocaleString(lang === 'ar' ? 'ar' : 'en'); }
  function t(key, vars) {
    var s = dict[lang][key];
    if (s == null) s = dict.en[key];
    if (s == null) s = key;
    if (vars) s = s.replace(/\{(\w+)\}/g, function (m, v) { return vars[v] != null ? vars[v] : m; });
    return s;
  }
  function scrollToEl(target) {
    if (!target) return;
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }
  function focusSoon(node) {
    if (!node) return;
    window.setTimeout(function () { node.focus({ preventScroll: true }); }, reduceMotion ? 0 : 350);
  }

  /* ---------- Language ---------- */
  function applyLang(next) {
    lang = next === 'ar' ? 'ar' : 'en';
    root.lang = lang;
    root.dir = lang === 'ar' ? 'rtl' : 'ltr';
    $$('[data-i18n]').forEach(function (n) { n.textContent = t(n.getAttribute('data-i18n')); });
    $$('[data-i18n-ph]').forEach(function (n) { n.setAttribute('placeholder', t(n.getAttribute('data-i18n-ph'))); });
    $$('[data-i18n-aria]').forEach(function (n) { n.setAttribute('aria-label', t(n.getAttribute('data-i18n-aria'))); });
    $$('[data-i18n-alt]').forEach(function (n) { n.setAttribute('alt', t(n.getAttribute('data-i18n-alt'))); });
    document.title = t('meta.title');
    $$('[data-lang-toggle]').forEach(function (b) {
      b.textContent = t('lang.switch');
      b.setAttribute('lang', lang === 'en' ? 'ar' : 'en');
    });
    $$('[data-lang-set]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-lang-set') === lang));
    });
    $$('[data-err-key]').forEach(function (n) {
      var k = n.getAttribute('data-err-key');
      n.textContent = k ? t(k) : '';
    });
    $$('[data-status-key]').forEach(function (n) {
      var k = n.getAttribute('data-status-key');
      n.textContent = k ? t(k) : '';
    });
    renderArchive();
    try { window.localStorage.setItem(STORE_KEY, lang); } catch (e) { /* storage unavailable: ignore */ }
  }

  function initialLang() {
    var m = /[?&]lang=(en|ar)\b/.exec(window.location.search);
    if (m) return m[1];
    try { return window.localStorage.getItem(STORE_KEY) || 'en'; } catch (e) { return 'en'; }
  }

  /* ---------- Menus & dropdowns ---------- */
  function setMenu(btn, panel, open, restoreFocus) {
    btn.setAttribute('aria-expanded', String(open));
    panel.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    var label = $('[data-menu-label]', btn);
    if (label) {
      label.setAttribute('data-i18n', open ? 'nav.close' : 'nav.menu');
      label.textContent = t(open ? 'nav.close' : 'nav.menu');
    }
    if (open) {
      var first = $('a, button', panel);
      if (first && panel.hasAttribute('data-menu-drawer')) focusSoon(first);
    } else if (restoreFocus) {
      btn.focus();
    }
  }
  var menus = $$('[data-menu-toggle]').map(function (btn) {
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    btn.addEventListener('click', function () {
      setMenu(btn, panel, btn.getAttribute('aria-expanded') !== 'true', false);
    });
    panel.addEventListener('click', function (e) {
      if (e.target.closest('a[href^="#"], [data-modal], [data-enquiry], [data-search-jump], [data-lang-toggle], [data-lang-set], [data-menu-close]')) {
        setMenu(btn, panel, false, !!e.target.closest('[data-menu-close]'));
      }
    });
    if (panel.hasAttribute('data-menu-drawer')) {
      document.addEventListener('focusin', function (e) {
        if (btn.getAttribute('aria-expanded') === 'true' && !panel.contains(e.target) && e.target !== btn) {
          setMenu(btn, panel, false, false);
        }
      });
    }
    return { btn: btn, panel: panel };
  });

  function closeDropdowns(except) {
    $$('[data-dropdown-toggle]').forEach(function (b) {
      if (b === except) return;
      b.setAttribute('aria-expanded', 'false');
      var m = document.getElementById(b.getAttribute('aria-controls'));
      if (m) m.hidden = true;
    });
  }
  $$('[data-dropdown-toggle]').forEach(function (b) {
    var m = document.getElementById(b.getAttribute('aria-controls'));
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = b.getAttribute('aria-expanded') !== 'true';
      closeDropdowns(b);
      b.setAttribute('aria-expanded', String(open));
      m.hidden = !open;
      if (open) { var f = $('a, button', m); if (f) f.focus(); }
    });
    m.addEventListener('click', function (e) {
      if (e.target.closest('a, button')) { b.setAttribute('aria-expanded', 'false'); m.hidden = true; }
    });
    m.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      var items = $$('a, button', m);
      var i = items.indexOf(document.activeElement);
      e.preventDefault();
      var next = e.key === 'ArrowDown' ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
      items[next].focus();
    });
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('[data-dropdown]')) closeDropdowns();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    $$('[data-dropdown-toggle][aria-expanded="true"]').forEach(function (b) {
      closeDropdowns(); b.focus();
    });
    menus.forEach(function (m) {
      if (m.btn.getAttribute('aria-expanded') === 'true') setMenu(m.btn, m.panel, false, true);
    });
  });
  window.addEventListener('focusin', function (e) {
    $$('[data-dropdown]').forEach(function (d) {
      if (!d.contains(e.target)) {
        var b = $('[data-dropdown-toggle]', d);
        if (b && b.getAttribute('aria-expanded') === 'true') closeDropdowns();
      }
    });
  });

  /* ---------- Modal (native dialog: focus containment + Escape) ---------- */
  var dlg = null, lastTrigger = null;
  /* A trigger inside a menu that has since closed is not focusable; fall back to the control that opened that menu. */
  function resolveFocus(node) {
    if (!node || !document.contains(node)) return null;
    if (node.getClientRects().length) return node;
    var dd = node.closest('[data-dropdown]');
    var ddBtn = dd && $('[data-dropdown-toggle]', dd);
    if (ddBtn && ddBtn.getClientRects().length) return ddBtn;
    for (var i = 0; i < menus.length; i++) {
      if (menus[i].panel.contains(node)) return menus[i].btn;
    }
    return null;
  }
  function buildDialog() {
    dlg = el('dialog', 'pm');
    dlg.setAttribute('aria-labelledby', 'pm-title');
    dlg.setAttribute('aria-describedby', 'pm-body');
    var inner = el('div', 'pm-inner');
    var label = el('p', 'pm-label'); label.id = 'pm-label';
    var title = el('h2', 'pm-title'); title.id = 'pm-title'; title.tabIndex = -1;
    var body = el('div', 'pm-body'); body.id = 'pm-body';
    var actions = el('div', 'pm-actions');
    var action = el('button', 'pm-action'); action.type = 'button'; action.id = 'pm-action';
    var close = el('button', 'pm-close'); close.type = 'button'; close.id = 'pm-close';
    var x = el('button', 'pm-x'); x.type = 'button'; x.id = 'pm-x';
    x.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>';
    actions.appendChild(action); actions.appendChild(close);
    inner.appendChild(x); inner.appendChild(label); inner.appendChild(title); inner.appendChild(body); inner.appendChild(actions);
    dlg.appendChild(inner);
    document.body.appendChild(dlg);
    close.addEventListener('click', function () { dlg.close(); });
    x.addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', function () {
      document.body.classList.remove('modal-open');
      var target = resolveFocus(lastTrigger);
      if (target) target.focus();
    });
    action.addEventListener('click', function () {
      var type = action.getAttribute('data-enquiry-target');
      lastTrigger = null;
      dlg.close();
      presetEnquiry(type);
    });
  }
  function openModal(key, trigger, headingOverride) {
    var def = SITE.modals[key];
    if (!def) return;
    if (!dlg) buildDialog();
    var c = def[lang] || def.en;
    lastTrigger = trigger || null;
    $('#pm-label').textContent = t(def.kind === 'page' ? 'modal.page' : 'modal.note');
    $('#pm-title').textContent = headingOverride || c.t;
    var body = $('#pm-body');
    body.textContent = '';
    c.b.forEach(function (p) { body.appendChild(el('p', null, p)); });
    var action = $('#pm-action');
    if (def.action) {
      action.hidden = false;
      action.textContent = t(def.action.label);
      action.setAttribute('data-enquiry-target', def.action.enquiry);
    } else {
      action.hidden = true;
    }
    $('#pm-close').textContent = t('modal.close');
    $('#pm-x').setAttribute('aria-label', t('modal.close'));
    document.body.classList.add('modal-open');
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    $('#pm-title').focus();
  }

  /* ---------- Archive ---------- */
  var ICONS = {
    video: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3" y="5" width="18" height="14" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M10 9.2v5.6l4.8-2.8z" fill="currentColor"/></svg>',
    audio: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 14v-2a8 8 0 0116 0v2" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="3.5" y="13" width="4" height="6.5" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="16.5" y="13" width="4" height="6.5" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
    article: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 3.5h8l4 4v13H6z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M9 11h6M9 14h6M9 17h4" stroke="currentColor" stroke-width="1.5"/></svg>',
    event: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3.5" y="5" width="17" height="15" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.5"/></svg>',
    download: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5M4.5 19.5h15" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };
  var TYPES = ['video', 'audio', 'article', 'event', 'download'];
  var TOPICS = ['arabic', 'quran', 'faith', 'resources'];
  var state = { q: '', type: '', topic: '' };

  function norm(s) {
    return String(s || '').toLowerCase()
      .replace(/[ً-ٰٟـ]/g, '')
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/[’'`‘]/g, '')
      .replace(/\s+/g, ' ').trim();
  }
  var haystacks = {};
  SITE.archive.forEach(function (it) {
    haystacks[it.id] = norm([
      it.en.t, it.ar.t, it.en.d, it.ar.d,
      dict.en['type.' + it.type], dict.ar['type.' + it.type], dict.en['typeS.' + it.type], dict.ar['typeS.' + it.type],
      dict.en['topic.' + it.topic], dict.ar['topic.' + it.topic]
    ].join(' '));
  });
  function matches(it, ignoreType) {
    if (!ignoreType && state.type && it.type !== state.type) return false;
    if (state.topic && it.topic !== state.topic) return false;
    var q = norm(state.q);
    if (!q) return true;
    var hay = haystacks[it.id];
    return q.split(' ').every(function (tok) { return hay.indexOf(tok) !== -1; });
  }
  function buildItem(it) {
    var li = el('li', 'arc-item arc-' + it.type);
    var icon = el('span', 'arc-icon');
    icon.innerHTML = ICONS[it.type];
    var body = el('div', 'arc-body');
    var meta = el('p', 'arc-meta');
    meta.appendChild(el('span', 'arc-type', t('type.' + it.type)));
    meta.appendChild(el('span', 'arc-topic', t('topic.' + it.topic)));
    var h = el(C.archiveHeading || 'h3', 'arc-title');
    var btn = el('button', 'arc-open', it[lang].t);
    btn.type = 'button';
    btn.setAttribute('data-modal', 'record');
    btn.setAttribute('data-record', it.id);
    h.appendChild(btn);
    body.appendChild(meta);
    body.appendChild(h);
    body.appendChild(el('p', 'arc-desc', it[lang].d));
    body.appendChild(el('p', 'arc-flag', t('arc.sample')));
    li.appendChild(icon);
    li.appendChild(body);
    return li;
  }
  function renderArchive() {
    var list = $('#arc-results');
    if (!list) return;
    var found = SITE.archive.filter(function (it) { return matches(it, false); });
    var limit = C.archiveLimit || found.length;
    list.textContent = '';
    found.slice(0, limit).forEach(function (it) { list.appendChild(buildItem(it)); });
    var count = $('#arc-count');
    if (count) {
      if (found.length > limit) count.textContent = t('arc.countOf', { n: num(limit), m: num(found.length) });
      else if (found.length === 1) count.textContent = t('arc.countOne');
      else count.textContent = t('arc.count', { n: num(found.length) });
    }
    var empty = $('#arc-empty');
    if (empty) empty.hidden = found.length > 0;
    list.hidden = found.length === 0;
    $$('[data-arc-type]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-arc-type') === state.type));
    });
    $$('[data-arc-count-for]').forEach(function (n) {
      var ty = n.getAttribute('data-arc-count-for');
      var c = SITE.archive.filter(function (it) { return matches(it, true) && (!ty || it.type === ty); }).length;
      n.textContent = num(c);
    });
    var topicSel = $('#arc-topic');
    if (topicSel) topicSel.value = state.topic;
    var reset = $('#arc-reset');
    if (reset) reset.disabled = !(state.q || state.type || state.topic);
  }
  function initArchive() {
    var q = $('#arc-q');
    if (!q) return;
    q.addEventListener('input', function () { state.q = q.value; renderArchive(); });
    var form = q.form;
    if (form) form.addEventListener('submit', function (e) { e.preventDefault(); state.q = q.value; renderArchive(); });
    $$('[data-arc-type]').forEach(function (b) {
      b.addEventListener('click', function () { state.type = b.getAttribute('data-arc-type'); renderArchive(); });
    });
    var topic = $('#arc-topic');
    if (topic) topic.addEventListener('change', function () { state.topic = topic.value; renderArchive(); });
    $$('#arc-reset, [data-arc-reset]').forEach(function (r) {
      r.addEventListener('click', function () {
        state = { q: '', type: '', topic: '' };
        q.value = '';
        renderArchive();
        q.focus();
      });
    });
  }
  function jumpToArchive(focusSearch) {
    scrollToEl($('#archive'));
    if (focusSearch) focusSoon($('#arc-q'));
  }

  /* ---------- Forms ---------- */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function setErr(field, key) {
    var err = document.getElementById(field.id + '-err');
    field.setAttribute('aria-invalid', key ? 'true' : 'false');
    if (err) { err.setAttribute('data-err-key', key || ''); err.textContent = key ? t(key) : ''; }
    var wrap = field.closest('.field');
    if (wrap) wrap.classList.toggle('has-error', !!key);
  }
  function setStatus(node, key, kind) {
    if (!node) return;
    node.setAttribute('data-status-key', key || '');
    node.textContent = key ? t(key) : '';
    node.classList.toggle('is-error', kind === 'error');
    node.classList.toggle('is-ok', kind === 'ok');
    node.hidden = !key;
  }
  function syncSpeaking() {
    var type = $('#f-type'), box = $('#f-speaking');
    if (!type || !box) return;
    var on = type.value === 'speaking';
    box.hidden = !on;
    $$('input, select', box).forEach(function (n) { n.disabled = !on; });
    if (!on) setErr($('#f-org'), '');
  }
  function validateContact(field) {
    var v = (field.value || '').trim();
    switch (field.id) {
      case 'f-name': return v.length >= 2 ? '' : 'err.name';
      case 'f-email': return EMAIL_RE.test(v) ? '' : 'err.email';
      case 'f-type': return v ? '' : 'err.type';
      case 'f-msg': return v.length >= 10 ? '' : 'err.msg';
      case 'f-org': return field.disabled || v.length >= 2 ? '' : 'err.org';
      default: return '';
    }
  }
  function initContact() {
    var form = $('#enquiry-form');
    if (!form) return;
    var fields = ['f-name', 'f-email', 'f-type', 'f-msg', 'f-org'].map(function (id) { return document.getElementById(id); }).filter(Boolean);
    var status = $('#enquiry-status');
    $('#f-type').addEventListener('change', syncSpeaking);
    syncSpeaking();
    fields.forEach(function (f) {
      var ev = f.tagName === 'SELECT' ? 'change' : 'input';
      f.addEventListener(ev, function () { if (f.getAttribute('aria-invalid') === 'true') setErr(f, validateContact(f)); });
      f.addEventListener('blur', function () { if (form.classList.contains('was-submitted')) setErr(f, validateContact(f)); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      form.classList.add('was-submitted');
      var firstBad = null;
      fields.forEach(function (f) {
        var k = validateContact(f);
        setErr(f, k);
        if (k && !firstBad) firstBad = f;
      });
      if (firstBad) {
        setStatus(status, 'err.summary', 'error');
        firstBad.focus();
        return;
      }
      form.reset();
      form.classList.remove('was-submitted');
      syncSpeaking();
      setStatus(status, 'form.proto', 'ok');
      status.focus();
    });
  }
  function initNewsletter() {
    $$('form[data-newsletter]').forEach(function (form) {
      var input = $('input[type="email"]', form);
      var status = $('[data-nl-status]', form);
      input.addEventListener('input', function () { if (input.getAttribute('aria-invalid') === 'true') setErr(input, EMAIL_RE.test(input.value.trim()) ? '' : 'err.email'); });
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!EMAIL_RE.test(input.value.trim())) {
          setErr(input, 'err.email');
          setStatus(status, '', null);
          input.focus();
          return;
        }
        setErr(input, '');
        form.reset();
        setStatus(status, 'nl.proto', 'ok');
        status.focus();
      });
    });
  }
  function presetEnquiry(type) {
    var sel = $('#f-type');
    if (sel && type) { sel.value = type; syncSpeaking(); setErr(sel, ''); }
    scrollToEl($('#contact'));
    focusSoon($('#f-name'));
  }

  /* ---------- Delegated actions ---------- */
  document.addEventListener('click', function (e) {
    var m = e.target.closest('[data-modal]');
    if (m) {
      e.preventDefault();
      var heading = null;
      var rec = m.getAttribute('data-record');
      if (rec) {
        var it = SITE.archive.filter(function (r) { return r.id === rec; })[0];
        if (it) heading = it[lang].t;
      }
      var hk = m.getAttribute('data-modal-heading');
      if (hk) heading = t(hk);
      openModal(m.getAttribute('data-modal'), m, heading);
      return;
    }
    var enq = e.target.closest('[data-enquiry]');
    if (enq) { e.preventDefault(); presetEnquiry(enq.getAttribute('data-enquiry')); return; }
    var sj = e.target.closest('[data-search-jump]');
    if (sj) { e.preventDefault(); jumpToArchive(true); return; }
    var tj = e.target.closest('[data-topic-jump], [data-type-jump]');
    if (tj && $('#arc-q')) {
      e.preventDefault();
      if (tj.hasAttribute('data-topic-jump')) state.topic = tj.getAttribute('data-topic-jump');
      if (tj.hasAttribute('data-type-jump')) state.type = tj.getAttribute('data-type-jump');
      renderArchive();
      jumpToArchive(false);
      return;
    }
    var lt = e.target.closest('[data-lang-toggle]');
    if (lt) { applyLang(lang === 'en' ? 'ar' : 'en'); return; }
    var ls = e.target.closest('[data-lang-set]');
    if (ls) { applyLang(ls.getAttribute('data-lang-set')); return; }
    var fa = e.target.closest('a[data-focus]');
    if (fa) {
      var target = document.querySelector(fa.getAttribute('href'));
      if (target) { e.preventDefault(); scrollToEl(target); focusSoon($(fa.getAttribute('data-focus'))); }
    }
  });
  $$('form[data-search-forward]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = $('input', f).value;
      var q = $('#arc-q');
      if (!q) return;
      q.value = v; state.q = v; renderArchive();
      jumpToArchive(true);
    });
  });

  /* ---------- Supplied assets (portrait, book cover) ---------- */
  $$('[data-asset]').forEach(function (fig) {
    var img = new Image();
    img.onload = function () {
      img.className = 'asset-img';
      img.setAttribute('data-i18n-alt', fig.getAttribute('data-asset-alt'));
      img.alt = t(fig.getAttribute('data-asset-alt'));
      fig.appendChild(img);
      fig.classList.add('has-asset');
    };
    img.src = fig.getAttribute('data-asset');
  });

  /* ---------- Motion: reveal on scroll, 3D tilt, parallax, header state, progress ---------- */
  function initMotion() {
    var reveal = $$('[data-reveal]');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      reveal.forEach(function (n) { n.classList.add('is-in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
      reveal.forEach(function (n) { io.observe(n); });
    }
    var finePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
    if (!reduceMotion && finePointer) {
      $$('[data-tilt]').forEach(function (card) {
        var max = parseFloat(card.getAttribute('data-tilt')) || 8;
        card.addEventListener('pointermove', function (e) {
          var r = card.getBoundingClientRect();
          var x = (e.clientX - r.left) / r.width - 0.5;
          var y = (e.clientY - r.top) / r.height - 0.5;
          card.style.setProperty('--ry', (x * max).toFixed(2) + 'deg');
          card.style.setProperty('--rx', (-y * max).toFixed(2) + 'deg');
          card.style.setProperty('--mx', ((x + 0.5) * 100).toFixed(1) + '%');
          card.style.setProperty('--my', ((y + 0.5) * 100).toFixed(1) + '%');
          card.classList.add('is-tilting');
        });
        card.addEventListener('pointerleave', function () {
          card.style.setProperty('--rx', '0deg');
          card.style.setProperty('--ry', '0deg');
          card.classList.remove('is-tilting');
        });
      });
    }
    var par = reduceMotion ? [] : $$('[data-parallax]');
    var progress = $('[data-progress]');
    var ticking = false;
    function onScroll() {
      ticking = false;
      var y = window.scrollY || window.pageYOffset;
      document.body.classList.toggle('is-scrolled', y > 24);
      if (progress) {
        var h = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, y / h) : 0).toFixed(4) + ')';
      }
      var vh = window.innerHeight;
      par.forEach(function (n) {
        var r = n.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var speed = parseFloat(n.getAttribute('data-parallax')) || 0.1;
        var offset = (r.top + r.height / 2 - vh / 2) * -speed;
        n.style.setProperty('--py', offset.toFixed(1) + 'px');
      });
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
    }, { passive: true });
    onScroll();
  }

  initMotion();
  initArchive();
  initContact();
  initNewsletter();
  applyLang(initialLang());
  root.classList.add('js');
})();
