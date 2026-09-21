/* =====================================================================
   THMTrade — app.js
   Plateforme éducative de trading · HTML + CSS + JavaScript vanilla
   Contenu : données (cours, lexique, patterns, practice, outils, FAQ),
   routing par hash, progression (localStorage), FR/EN, rendu dynamique.
   Aucune donnée de marché réelle : tous les graphiques sont des
   illustrations pédagogiques fictives.
   ===================================================================== */
(() => {
'use strict';

/* =====================================================================
   1. UTILITAIRES
   ===================================================================== */
const KEY = 'thmtrade.v1';
const LANGS = ['fr', 'en'];
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const md = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`(.+?)`/g, '<code>$1</code>');
const T = (fr, en) => ({ fr, en });
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const reduceMotion = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

let lang = 'fr';
/** Texte localisé : accepte une chaîne, un nombre ou un objet {fr, en}. */
const L = v => (v == null ? '' : typeof v === 'object' ? (v[lang] != null ? v[lang] : v.fr) : String(v));
const tx = v => esc(L(v));   // texte localisé, échappé
const tmd = v => md(L(v));   // texte localisé, échappé + **gras** + `code`

/** Chaîne d'interface : tr() brut · t() échappé · tm() échappé + mise en forme. */
function tr(key, vars) {
  const d = UI[lang] || UI.fr;
  let s = d[key] != null ? d[key] : (UI.fr[key] != null ? UI.fr[key] : key);
  if (vars) Object.keys(vars).forEach(k => { s = s.split('{' + k + '}').join(vars[k]); });
  return s;
}
const t = (key, vars) => esc(tr(key, vars));
const tm = (key, vars) => md(tr(key, vars));
const plural = (key, n) => tr(key + (n === 1 ? '.one' : '.other'), { n });
const nf = (v, d = 2) => new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-US', { maximumFractionDigits: d }).format(v);

/* Icônes (SVG en ligne, trait) */
const ICONS = {
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M6.5 17H20v4H6.5A2.5 2.5 0 0 1 4 19.5"/>',
  chart: '<path d="M6 3v3M6 15v5M5 6h2v9H5zM12 2v3M12 14v6M11 5h2v9h-2zM18 5v2M18 17v4M17 7h2v10h-2z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
  tools: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  crown: '<path d="M2.5 8l4.5 4 5-8 5 8 4.5-4-2 11H4.5z"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  arrowL: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 15.5-6.3L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.3L3 16M3 21v-5h5"/>',
  ext: '<path d="M14 3h7v7M21 3l-9 9M10 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-5M12 8h.01"/>',
  alert: '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01"/>',
  bulb: '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z"/>',
  calc: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h2M14 11h2M8 15h2M14 15h2"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  route: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h8a3 3 0 0 0 0-6H8a3 3 0 0 1 0-6h8"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
  play: '<path d="M7 4l13 8-13 8z"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>'
};
const icon = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[n] || ''}</svg>`;
const logo = (cls = '') => `<svg class="logo-mark ${cls}" aria-hidden="true" focusable="false"><use href="#logo-mark"/></svg>`;

/* =====================================================================
   2. ÉTAT ET STOCKAGE (localStorage, avec repli en mémoire)
   ===================================================================== */
const blank = () => ({ v: 1, lang: null, lessons: {}, quiz: {}, practice: {}, last: null });
let state = blank();

function loadState() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && typeof s === 'object') state = Object.assign(blank(), s);
    }
  } catch (e) { /* stockage indisponible : on reste en mémoire */ }
  ['lessons', 'quiz', 'practice'].forEach(k => { if (!state[k] || typeof state[k] !== 'object') state[k] = {}; });
}
function saveState() {
  try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignoré */ }
}
function detectLang() {
  if (LANGS.includes(state.lang)) return state.lang;
  const n = String((navigator.language || 'fr')).toLowerCase();
  return n.indexOf('en') === 0 ? 'en' : 'fr';
}

/* État d'interface non persistant (filtres, session de practice…) */
const ui = {
  lex: { q: '', cat: 'all', lvl: 'all' },
  pat: { q: '', cat: 'all', lvl: 'all' },
  patAns: {},
  prac: null,
  bill: 'monthly',
  focusAfter: null,
  justAnswered: null
};

/* =====================================================================
   3. NOTIFICATIONS ET MODALES
   ===================================================================== */
function toast(msg, kind = 'ok') {
  const box = $('#toasts');
  if (!box) return;
  const el = document.createElement('div');
  el.className = 'toast toast-' + kind;
  el.innerHTML = icon(kind === 'err' ? 'alert' : kind === 'info' ? 'info' : 'check') + '<span></span>';
  el.lastChild.textContent = msg;
  box.appendChild(el);
  while (box.children.length > 3) box.removeChild(box.firstChild);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 280); }, 3400);
}

let modal = null;
let modalTimer = null;
let confirmCb = null;

function openModal(html, opts = {}) {
  const root = $('#modal-root');
  clearTimeout(modalTimer);
  const opener = modal ? modal.opener : document.activeElement;
  root.innerHTML = `<div class="modal-backdrop" data-action="modal-backdrop">
    <div class="modal glass ${opts.cls || ''}" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1">
      <button type="button" class="modal-close" data-action="close-modal" aria-label="${t('close')}">${icon('close')}</button>
      <div class="modal-body" id="modal-body">${html}</div>
    </div></div>`;
  root.hidden = false;
  document.body.classList.add('no-scroll');
  modal = { opener, onClose: opts.onClose || null };
  const dlg = $('.modal', root);
  const first = $('[data-autofocus]', dlg) || dlg;
  first.focus({ preventScroll: true });
}
function setModalBody(html) {
  const b = $('#modal-body');
  if (b) b.innerHTML = html;
}
function closeModal(immediate = false, silent = false) {
  if (!modal) return;
  const cur = modal;
  modal = null;
  const root = $('#modal-root');
  const finish = () => { root.hidden = true; root.innerHTML = ''; document.body.classList.remove('no-scroll'); };
  if (!silent && cur.onClose) cur.onClose();
  if (!silent && cur.opener && typeof cur.opener.focus === 'function') { try { cur.opener.focus({ preventScroll: true }); } catch (e) { /* ignoré */ } }
  if (immediate || reduceMotion() || !root.firstElementChild) { finish(); return; }
  root.firstElementChild.classList.add('closing');
  clearTimeout(modalTimer);
  modalTimer = setTimeout(finish, 180);
}
function confirmModal(opts, cb) {
  confirmCb = cb;
  openModal(`<h2 id="modal-title">${esc(opts.title)}</h2><p>${esc(opts.text)}</p>
    <div class="modal-actions">
      <button type="button" class="btn btn-ghost" data-action="close-modal">${t('cancel')}</button>
      <button type="button" class="btn ${opts.danger ? 'btn-danger' : 'btn-primary'}" data-action="modal-confirm" data-autofocus>${esc(opts.ok)}</button>
    </div>`, { cls: 'modal-sm' });
}
function trapFocus(e) {
  if (!modal) return;
  if (e.key === 'Escape') { e.preventDefault(); closeModal(); return; }
  if (e.key !== 'Tab') return;
  const dlg = $('.modal');
  if (!dlg) return;
  const f = $$('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])', dlg).filter(el => el.offsetParent !== null);
  if (!f.length) { e.preventDefault(); dlg.focus(); return; }
  const first = f[0], last = f[f.length - 1], act = document.activeElement;
  if (e.shiftKey && (act === first || act === dlg)) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && act === last) { e.preventDefault(); first.focus(); }
}

/* =====================================================================
   4. TRADUCTION DES ÉLÉMENTS STATIQUES (header, footer)
   ===================================================================== */
function applyStaticI18n() {
  document.documentElement.lang = lang;
  $$('[data-i18n]').forEach(el => { el.textContent = tr(el.dataset.i18n); });
  $$('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', tr(el.dataset.i18nAria)); });
  $$('.lang-btn').forEach(b => {
    const on = b.dataset.lang === lang;
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.classList.toggle('on', on);
  });
  const y = $('#year');
  if (y) y.textContent = new Date().getFullYear();
}

/* =====================================================================
   3b. TEXTES DE L'INTERFACE (FR / EN)
   ===================================================================== */
const UI = {
fr: {
  'skip': 'Aller au contenu', 'nav.aria': 'Navigation principale', 'nav.home': 'Accueil', 'nav.home.aria': 'THMTrade — Accueil',
  'nav.lexicon': 'Lexique', 'nav.courses': 'Cours', 'nav.patterns': 'Patterns', 'nav.practice': 'Practice', 'nav.tools': 'Outils', 'nav.premium': 'Premium',
  'lang.aria': 'Langue', 'menu': 'Menu',
  'foot.tag': 'Comprends les marchés. Construis ta méthode.', 'foot.platform': 'Plateforme', 'foot.info': 'Informations', 'foot.faq': 'FAQ',
  'foot.risk': 'Avertissement sur les risques', 'foot.reset': 'Réinitialiser ma progression', 'foot.copy': 'Plateforme éducative.',
  'risk.short': "Le trading comporte des risques, y compris la perte de tout ou partie du capital. THMTrade est une plateforme éducative : aucun contenu ne constitue un conseil financier, un signal ou une promesse de gain.",

  'close': 'Fermer', 'cancel': 'Annuler', 'understood': 'Compris', 'more': 'Voir la fiche', 'min': '{n} min', 'progress': 'Progression', 'crumbs': "Fil d'Ariane",
  'lessons': 'Leçons', 'back': 'Retour', 'back.courses': 'Retour aux cours', 'done': 'Terminé', 'opts': 'Réponses possibles', 'sr.correct': 'bonne réponse', 'sr.wrong': 'ta réponse, incorrecte',
  'tf.true': 'Vrai', 'tf.false': 'Faux', 'newtab': 'nouvel onglet', 'fig.note': 'Illustration pédagogique, données fictives.', 'chart.alt': 'Graphique pédagogique fictif',
  'lang.changed': 'Langue : français', 'err.h': 'Une erreur est survenue', 'err.p': "Cette page n'a pas pu s'afficher. Retourne à l'accueil et réessaie.",

  'lvl.1': 'Débutant', 'lvl.2': 'Intermédiaire', 'lvl.3': 'Technique', 'lvl.4': 'Avancé',
  'cat.basics': 'Bases', 'cat.orders': 'Ordres', 'cat.risk': 'Risque', 'cat.analysis': 'Analyse', 'cat.structure': 'Structure', 'cat.advanced': 'Avancé',
  'pcat.reversal': 'Retournement', 'pcat.continuation': 'Continuation', 'pcat.breakout': 'Cassure',
  'qt.mcq': 'QCM', 'qt.tf': 'Vrai / Faux', 'qt.id': 'Identification', 'qt.def': 'Définition', 'qt.comp': 'Compréhension',
  'f.all': 'Tous', 'f.cat': 'Catégorie', 'f.lvl': 'Niveau', 'f.type': 'Type', 'f.reset': 'Réinitialiser les filtres',

  'anat.alt': "Anatomie d'une bougie haussière et d'une bougie baissière", 'anat.high': 'Plus haut', 'anat.low': 'Plus bas', 'anat.open': 'Ouverture', 'anat.close': 'Clôture',
  'anat.body': 'Corps', 'anat.upper': 'Mèche haute', 'anat.lower': 'Mèche basse', 'anat.bull': 'Haussière', 'anat.bear': 'Baissière',

  'hero.pill': 'Éducatif : ni signaux, ni promesse de gain', 'hero.title': 'Comprends les marchés. Construis ta méthode.',
  'hero.lead': "THMTrade est une plateforme éducative pour apprendre le trading pas à pas : cours interactifs, quiz corrigés, lexique, patterns graphiques, practice et outils, du débutant complet à l'analyse avancée.",
  'cta.start': 'Commencer à apprendre', 'cta.continue': 'Continuer à apprendre', 'cta.explore': 'Explorer les cours', 'cta.allcourses': 'Tous les cours',
  'resume.h': 'Ta progression', 'hero.viz': 'Illustration décorative', 'hv.c1': 'Structure', 'hv.c2': 'Risque', 'hv.c3': 'Méthode', 'hv.f1': 'Gérer le risque', 'hv.f2': 'Définir son plan',
  'hero.note': 'Graphique purement décoratif : aucune donnée de marché réelle.',

  'home.markets.h': 'Quatre marchés à comprendre', 'home.markets.p': "Chaque marché a ses horaires, sa volatilité et ses moteurs. THMTrade t'aide à les distinguer avant de choisir où t'entraîner.",
  'home.method.h': 'Une méthode pour progresser', 'home.method.p': "Pas de raccourci : on comprend, on pratique, puis on construit sa propre méthode.",
  'm1.t': "Comprendre avant d'agir", 'm1.d': "Des leçons progressives, des exemples et des encadrés pour saisir le pourquoi des concepts, des bases aux notions techniques.",
  'm2.t': 'Pratiquer pour ancrer', 'm2.d': 'Quiz corrigés après chaque leçon et exercices variés pour vérifier que tu sais identifier, calculer et raisonner.',
  'm3.t': 'Construire sa méthode', 'm3.d': "Cadre, entrée, invalidation, risque, journal et statistiques : transforme tes idées en règles écrites et testables.",
  'home.why.h': 'Pourquoi THMTrade', 'home.why.p': 'Une plateforme conçue pour apprendre sérieusement, sans promesses irréalistes.',
  'f1.t': 'Parcours progressif', 'f1.d': "Du débutant complet à l'utilisateur avancé, avec toujours une indication de ta position et de la prochaine étape.",
  'f2.t': 'Quiz corrigés', 'f2.d': 'Chaque réponse est expliquée, correcte ou non, pour comprendre et non seulement mémoriser.',
  'f3.t': 'Risque au centre', 'f3.d': 'Taille de position, stop-loss, ratio risque/rendement et drawdown sont traités dès les fondamentaux.',
  'f4.t': 'Lexique et patterns', 'f4.d': 'Recherche, filtres et fiches détaillées pour retrouver un terme ou une figure en quelques secondes.',
  'f5.t': 'Bilingue FR / EN', 'f5.d': "Toute la plateforme est disponible en français et en anglais, avec mémorisation de ton choix.",
  'f6.t': 'Ta progression, chez toi', 'f6.d': "Ta progression est enregistrée dans ton navigateur : pas de compte requis pour cette version.",
  'home.journey.h': 'Ton parcours pédagogique', 'home.journey.p': 'Sept étapes, de la découverte à l\'approfondissement. L\'étape en cours est mise en avant.',
  'j.discover': 'Découvrir', 'j.discover.d': "Qu'est-ce que le trading, et quels marchés ?",
  'j.understand': 'Comprendre', 'j.understand.d': 'Ordres, coûts, levier et risque.',
  'j.learn': 'Apprendre', 'j.learn.d': 'Lire un graphique : bougies, tendances, niveaux.',
  'j.practice': 'Pratiquer', 'j.practice.d': 'Exercices interactifs et scores.',
  'j.analyze': 'Analyser', 'j.analyze.d': 'Patterns graphiques et scénarios.',
  'j.build': 'Construire sa méthode', 'j.build.d': 'Règles, journal, backtesting.',
  'j.deepen': 'Approfondir', 'j.deepen.d': 'Confluences, liquidité, probabilités.',
  'home.courses.h': 'Cinq cours, un fil conducteur', 'home.courses.p': 'Chaque cours se compose de leçons, d\'un quiz corrigé et d\'une progression suivie.',
  'home.lex.h': 'Un lexique interactif', 'home.lex.p': 'Recherche, catégories et niveaux : chaque terme a une définition, un exemple et des liens utiles.', 'home.lex.cta': 'Ouvrir le lexique',
  'home.pat.h': 'Une bibliothèque de patterns', 'home.pat.p': 'Treize figures expliquées : structure, contexte, erreurs fréquentes et exercice. Jamais présentées comme une garantie.', 'home.pat.cta': 'Explorer les patterns',
  'home.prac.h': 'Le Practice : pratiquer pour de bon', 'home.prac.p': "Huit séries d'exercices — supports, résistances, tendance, range, patterns, invalidation, risque/rendement et scénarios — avec scores et possibilité de recommencer.", 'home.prac.cta': 'Ouvrir le Practice',
  'home.tools.h': 'Des outils pour passer à la pratique', 'home.tools.p': "TradingView, Investing.com et CoinGecko présentés avec un tutoriel THMTrade, plus des calculateurs intégrés.", 'home.tools.cta': 'Voir les outils',
  'home.prem.h': 'Premium : aller plus loin', 'home.prem.p': "Cours approfondis, lexique approfondi, Practice, outils et contenu avancé. Le Premium est présenté en aperçu : aucun paiement n'est actif dans cette version.", 'home.prem.cta': 'Découvrir le Premium',
  'prem.f1': 'Cours approfondis', 'prem.f2': 'Lexique approfondi', 'prem.f3': 'Practice', 'prem.f4': 'Outils', 'prem.f5': 'Contenu avancé',
  'home.faq.h': 'Questions fréquentes', 'home.faq.all': 'Toute la FAQ',
  'home.final.h': 'Prêt à comprendre les marchés ?', 'home.final.p': 'Commence par la première leçon : quelques minutes suffisent pour découvrir le fonctionnement de la plateforme.',

  'courses.h1': 'Cours de trading', 'courses.lead': 'Cinq cours progressifs pour apprendre le trading : fondamentaux, lecture de graphique, patterns, méthode et analyse avancée.',
  'courses.overall': 'Progression globale', 'courses.alldone': 'Tous les cours terminés',
  'c.review': 'Revoir', 'c.continue': 'Continuer', 'c.start': 'Commencer', 'c.lessons.one': '{n} leçon', 'c.lessons.other': '{n} leçons',
  'prog.lessons': '{done} / {total} leçons terminées', 'prem.hint': 'Contenu Premium — accès libre pendant la version de lancement',
  'prem.open': "Les contenus marqués Premium sont accessibles librement dans cette version de lancement. Le contrôle d'accès sera ajouté avec les comptes.",
  'quiz.best': 'Meilleur : {best}/{total}', 'lesson.n': 'Leçon {n} / {total}', 'les.key': 'À retenir', 'quiz': 'Quiz', 'quiz.hint': 'Réponds à chaque question : la correction s\'affiche immédiatement.',
  'quiz.done': 'Quiz terminé : {s}/{n}', 'q.n': 'Question {n}/{total}', 'fb.ok': 'Bonne réponse !', 'fb.ko': 'Pas tout à fait.', 'fb.answer': 'Bonne réponse :',
  'qr.perfect': 'Sans faute !', 'qr.good': 'Bon travail. Relis les corrections pour consolider.', 'qr.retry': 'Relis la leçon et retente le quiz.', 'qr.best': 'Meilleur score : {best}/{total}', 'qr.again': 'Refaire le quiz',
  'cp.h': 'Leçon terminée ?', 'cp.p': 'Marque-la comme terminée pour suivre ta progression et débloquer ta prochaine étape.', 'cp.done.h': 'Leçon terminée', 'cp.done.p': 'Bien joué. Passe à la suite quand tu es prêt.',
  'cp.undo': 'Annuler', 'cp.btn': 'Marquer comme terminé', 'next.lesson': 'Leçon suivante', 'next.course': 'Cours suivant', 'next.practice': 'Ensuite : pratiquer', 'prev.lesson': 'Leçon précédente', 'les.nav': 'Navigation entre les leçons',
  'toast.lesson': 'Leçon terminée. Bravo !', 'toast.course': 'Cours terminé : {c}', 'toast.undo': 'Leçon rouverte.',

  'lex.h1': 'Lexique du trading', 'lex.lead': 'Les termes essentiels du trading, expliqués simplement, avec exemples et niveau de difficulté.',
  'lex.search': 'Rechercher un terme', 'lex.ph': 'Rechercher : spread, levier, support…', 'lex.count.one': '{n} terme', 'lex.count.other': '{n} termes',
  'lex.empty': 'Aucun terme ne correspond à ta recherche. Essaie un autre mot ou retire un filtre.', 'm.def': 'Définition', 'm.ex': 'Exemple', 'm.rel': 'Termes liés', 'm.lesson': 'Voir la leçon associée',
  'pat.h1': 'Bibliothèque de patterns', 'pat.lead': 'Les principales figures graphiques : définition, structure, contexte, interprétation possible, erreurs fréquentes et exercice.',
  'pat.warn': "Un pattern n'est jamais une garantie de résultat : il décrit un rapport de forces et doit être replacé dans son contexte.",
  'pat.search': 'Rechercher un pattern', 'pat.ph': 'Rechercher : double top, triangle…', 'pat.count.one': '{n} pattern', 'pat.count.other': '{n} patterns',
  'pat.empty': 'Aucun pattern ne correspond à ta recherche. Essaie un autre mot ou retire un filtre.',
  'pm.def': 'Définition', 'pm.struct': 'Structure', 'pm.ident': 'Comment l\'identifier', 'pm.ctx': 'Contexte', 'pm.interp': 'Interprétation possible', 'pm.err': 'Erreurs fréquentes', 'pm.ex': 'Exemple', 'pm.exo': 'Exercice',
  'pm.warn': "Illustration fictive. Un pattern peut échouer : ce n'est jamais un signal ni une garantie.",

  'pr.h1': 'Practice', 'pr.lead': "Entraîne-toi sur des exercices interactifs. Chaque réponse est corrigée et expliquée, et tes scores sont enregistrés.",
  'pr.s.answers': 'Réponses', 'pr.s.correct': 'Correctes', 'pr.s.wrong': 'Erreurs', 'pr.s.acc': 'Précision', 'pr.s.prog': 'Séries tentées : {done} / {total}',
  'pr.best': 'Meilleur : {best}/{total}', 'pr.new': 'Nouveau', 'pr.count.one': '{n} exercice', 'pr.count.other': '{n} exercices', 'pr.tries.one': '{n} tentative', 'pr.tries.other': '{n} tentatives',
  'pr.again': 'Recommencer', 'pr.start': 'Commencer', 'pr.note': 'Les graphiques des exercices sont fictifs. Tu peux refaire une série autant de fois que tu veux : le meilleur score est conservé.',
  'pr.quit': 'Quitter', 'pr.q': 'Exercice {n} / {total}', 'pr.live': '{c} correcte(s)', 'pr.finish': 'Voir mon résultat', 'pr.next': 'Exercice suivant', 'pr.result': 'Résultat',
  'pr.res.great': 'Excellent travail sur cette série.', 'pr.res.ok': 'Bon début. Relis les corrections et recommence.', 'pr.res.retry': 'Cette série demande de la pratique : relis les leçons associées puis réessaie.',
  'pr.correct.one': '{n} correcte', 'pr.correct.other': '{n} correctes', 'pr.errors.one': '{n} erreur', 'pr.errors.other': '{n} erreurs', 'pr.review': 'Revue de la série', 'pr.retry': 'Recommencer cette série', 'pr.all': 'Toutes les séries',

  'tl.h1': 'Outils du trader', 'tl.lead': "Trois ressources utiles pour analyser les marchés et suivre le contexte, avec un tutoriel THMTrade pour bien démarrer.",
  'tl.note': "THMTrade n'est affilié à aucun de ces services. Les liens mènent vers les sites officiels ; leurs offres et conditions leur appartiennent.",
  'tl.use': 'À quoi ça sert', 'tl.feat': 'Fonctionnalités', 'tl.start': 'Comment commencer', 'tl.tuto': 'Tutoriel THMTrade', 'tl.open': 'Site officiel', 'tl.tuto.h': 'Tutoriel THMTrade : {name}',
  'calc.h': 'Calculateurs THMTrade', 'calc.p': 'Trois calculateurs pour manipuler les notions du cours. Ils sont pédagogiques et ne remplacent pas un calcul adapté à ta plateforme.',
  'calc.pos.h': 'Taille de position et R/R', 'calc.capital': 'Capital', 'calc.risk': 'Risque par trade', 'calc.entry': "Prix d'entrée", 'calc.stop': 'Stop-loss', 'calc.tp': 'Objectif (optionnel)',
  'calc.fill': 'Renseigne des valeurs positives pour obtenir le résultat.', 'calc.dist0': "L'entrée et le stop doivent être différents.",
  'calc.riskamt': 'Montant risqué', 'calc.dir': 'Sens', 'calc.long': 'Achat (long)', 'calc.short': 'Vente (short)', 'calc.dist': 'Distance au stop', 'calc.units': 'Taille (unités)', 'calc.lots': 'Équivalent lots Forex*',
  'calc.notional': 'Valeur de la position', 'calc.rr': 'Ratio risque/rendement', 'calc.tpside': "L'objectif doit se trouver du bon côté de l'entrée par rapport au stop.",
  'calc.lev': "La valeur de la position dépasse ton capital : elle nécessiterait du levier, qui amplifie aussi les pertes.",
  'calc.dd.h': 'Drawdown et récupération', 'calc.dd.p': 'Quel gain faut-il pour revenir au capital de départ après une baisse ?', 'calc.dd.in': 'Baisse du capital', 'calc.dd.hint': 'Saisis une baisse entre 0 et 100 %.',
  'calc.dd.need': 'Gain nécessaire', 'calc.dd.left': 'Capital restant',
  'calc.exp.h': 'Espérance de gain', 'calc.exp.p': 'Résultat moyen par trade, en multiples du risque (R).', 'calc.win': 'Taux de réussite', 'calc.rw': 'Gain moyen', 'calc.rl': 'Perte moyenne',
  'calc.exp': 'Espérance par trade', 'calc.be': 'Taux de réussite à l\'équilibre', 'calc.exp.note': 'Calcul sur des statistiques passées : il ne garantit aucun résultat futur.',
  'calc.disc': '* Équivalent lots Forex : 1 lot standard = 100 000 unités. Les coûts (spread, commissions), la conversion de devise et le slippage ne sont pas pris en compte.',

  'pm.h1': 'THMTrade Premium', 'pm.lead': 'Cours approfondis, lexique approfondi, Practice, outils et contenu avancé pour aller plus loin dans ta méthode.',
  'pm.status.h': 'Aperçu : rien à payer aujourd\'hui', 'pm.status.p': "Dans cette version, tout le contenu est accessible librement. Le paiement, les comptes et l'essai gratuit ne sont pas encore actifs, et aucune carte bancaire n'est demandée.",
  'pm.bill': 'Facturation', 'pm.monthly': 'Mensuel', 'pm.annual': 'Annuel', 'pm.save': 'prix réduit',
  'pm.now.h': "Aujourd'hui", 'pm.now.price': 'Accès libre', 'pm.now.p': 'La version de lancement de THMTrade.', 'pm.now.a': 'Tous les cours, quiz et exercices', 'pm.now.b': 'Lexique, patterns et outils', 'pm.now.c': 'Progression sauvegardée dans ton navigateur',
  'pm.trial': 'Essai gratuit de 3 jours (prévu)', 'pm.plan.h': 'Premium', 'pm.per.month': '/ mois', 'pm.per.year': '/ an', 'pm.annual.eq': 'Soit environ {m} € par mois. Prix cible indicatif.', 'pm.monthly.p': 'Sans engagement à terme. Prix cible indicatif.',
  'pm.cta': "Essai gratuit de 3 jours", 'pm.fine': "Prix indicatifs, susceptibles d'évoluer. Aucun paiement n'est possible dans cette version.",
  'pm.incl.h': 'Ce que le Premium comprendra', 'pm.incl.p': 'Cinq axes pour approfondir. Les contenus concernés sont déjà repérés par un badge Premium.',
  'pmf.f1': 'Les cours « Construire sa méthode » et « Analyse avancée », pour transformer tes idées en règles testables.', 'pmf.f2': 'Les termes avancés : liquidité, BOS / CHoCH, order block, confluences.',
  'pmf.f3': 'Des séries d\'exercices interactives pour vérifier ta compréhension.', 'pmf.f4': 'Tutoriels THMTrade et calculateurs pour appliquer la théorie.', 'pmf.f5': 'Des notions avancées, avec scénarios, probabilités et analyse des erreurs.',
  'pm.soon.h': 'Ce qui viendra plus tard', 'pm.soon.p': "Pour proposer un vrai Premium, THMTrade ajoutera dans une version ultérieure :", 'pm.soon.a': 'des comptes utilisateur et une authentification', 'pm.soon.b': 'un paiement sécurisé via un prestataire dédié',
  'pm.soon.c': "un contrôle d'accès sécurisé aux contenus Premium", 'pm.soon.d': 'une base de données pour synchroniser ta progression',
  'pmm.h': "Le Premium n'est pas encore ouvert", 'pmm.p1': "L'essai gratuit de 3 jours sera proposé lorsque les comptes et le paiement seront disponibles. Pour l'instant, rien n'est facturé et aucune carte bancaire n'est demandée.",
  'pmm.p2': 'En attendant, tout le contenu est accessible librement :', 'pmm.a': 'Cinq cours, dont les contenus marqués Premium', 'pmm.b': 'Lexique, patterns et Practice', 'pmm.c': 'Outils et calculateurs',

  'foot.legal': 'Mentions légales', 'foot.terms': "Conditions d'utilisation", 'foot.privacy': 'Politique de confidentialité',
  'legal.updated': 'Dernière mise à jour : {d}', 'legal.todo': 'À compléter : {f}', 'legal.other': 'Autres pages légales',
  'legal.f.publisher': 'nom de l\'éditeur', 'legal.f.status': 'statut', 'legal.f.registration': "numéro d'immatriculation", 'legal.f.address': 'adresse', 'legal.f.email': 'e-mail',
  'legal.meta.mentions.t': 'Mentions légales', 'legal.meta.mentions.d': "Mentions légales de THMTrade : éditeur, hébergeur, propriété intellectuelle et avertissement sur les risques du trading.",
  'legal.meta.conditions.t': "Conditions d'utilisation", 'legal.meta.conditions.d': "Conditions d'utilisation de THMTrade, plateforme éducative sur le trading : nature du service, responsabilité et propriété intellectuelle.",
  'legal.meta.confidentialite.t': 'Politique de confidentialité', 'legal.meta.confidentialite.d': "Politique de confidentialité de THMTrade : données enregistrées sur ton appareil, hébergement, contact et droits.",
  'faq.h1': 'Foire aux questions', 'faq.lead': 'Les réponses aux questions les plus courantes sur THMTrade.',
  'nf.h1': 'Page introuvable', 'nf.lead': "Cette adresse ne correspond à aucune page de THMTrade. Utilise le menu ou l'un des liens ci-dessous.",
  'rk.p1': "Le trading de produits financiers (Forex, crypto-actifs, actions, indices, produits dérivés) comporte un risque élevé de perte, pouvant aller jusqu'à la totalité du capital investi, et davantage avec certains produits à effet de levier.",
  'rk.p2': "Les performances passées ne préjugent pas des performances futures. Les exemples, graphiques et calculs de THMTrade sont fictifs et pédagogiques.",
  'rk.p3': "THMTrade est une plateforme éducative. Elle ne fournit aucun conseil en investissement personnalisé, aucun signal et aucune garantie de résultat.",
  'rk.p4': "Ne risque jamais d'argent dont tu as besoin. Avant de trader, renseigne-toi sur les produits, les frais et la réglementation de ton pays, et consulte au besoin un professionnel agréé.",
  'reset.h': 'Réinitialiser ta progression ?', 'reset.p': 'Les leçons terminées, les scores de quiz et les résultats de Practice seront effacés de ce navigateur. Ta langue est conservée. Cette action est définitive.', 'reset.ok': 'Tout effacer', 'reset.done': 'Progression réinitialisée.',

  'meta.home.t': 'THMTrade — Apprendre le trading : cours, lexique, patterns et practice', 'meta.home.d': "THMTrade est une plateforme éducative pour apprendre le trading : cours débutant, lexique trading, analyse technique, patterns graphiques, gestion du risque, Forex, crypto, actions et indices.",
  'meta.courses.t': 'Cours de trading pour débutants et avancés', 'meta.courses.d': "Cinq cours pour apprendre le trading : fondamentaux, lire un graphique, patterns graphiques, construire sa méthode et analyse avancée.",
  'meta.lex.t': 'Lexique trading : définitions et exemples', 'meta.lex.d': "Lexique du trading : spread, levier, stop-loss, support, résistance, breakout, order block… Définitions simples, exemples et niveaux.",
  'meta.pat.t': 'Patterns trading : bibliothèque de figures graphiques', 'meta.pat.d': "Double top, double bottom, épaule-tête-épaule, triangles, flag, pennant, wedge, breakout, pullback : structure, contexte et erreurs fréquentes.",
  'meta.pr.t': 'Practice trading : exercices interactifs', 'meta.pr.d': "Entraîne-toi sur des exercices interactifs : support, résistance, tendance, range, patterns, invalidation, risque/rendement et scénarios.",
  'meta.tl.t': 'Outils de trading : TradingView, Investing.com, CoinGecko', 'meta.tl.d': "Découvre TradingView, Investing.com et CoinGecko avec un tutoriel THMTrade, et utilise des calculateurs de taille de position, drawdown et espérance.",
  'meta.pm.t': 'Premium : cours approfondis et contenu avancé', 'meta.pm.d': "Aperçu de THMTrade Premium : cours approfondis, lexique approfondi, Practice, outils et contenu avancé. Paiement non actif dans cette version.",
  'meta.faq.t': 'FAQ : questions fréquentes sur THMTrade', 'meta.faq.d': "Réponses aux questions fréquentes : nature éducative de THMTrade, risques du trading, progression, langues, Premium."
},

en: {
  'skip': 'Skip to content', 'nav.aria': 'Main navigation', 'nav.home': 'Home', 'nav.home.aria': 'THMTrade — Home',
  'nav.lexicon': 'Glossary', 'nav.courses': 'Courses', 'nav.patterns': 'Patterns', 'nav.practice': 'Practice', 'nav.tools': 'Tools', 'nav.premium': 'Premium',
  'lang.aria': 'Language', 'menu': 'Menu',
  'foot.tag': 'Learn. Analyze. Trade smarter.', 'foot.platform': 'Platform', 'foot.info': 'Information', 'foot.faq': 'FAQ',
  'foot.risk': 'Risk warning', 'foot.reset': 'Reset my progress', 'foot.copy': 'Educational platform.',
  'risk.short': 'Trading involves risk, including the loss of all or part of your capital. THMTrade is an educational platform: no content is financial advice, a signal or a promise of gains.',

  'close': 'Close', 'cancel': 'Cancel', 'understood': 'Got it', 'more': 'Open entry', 'min': '{n} min', 'progress': 'Progress', 'crumbs': 'Breadcrumb',
  'lessons': 'Lessons', 'back': 'Back', 'back.courses': 'Back to courses', 'done': 'Completed', 'opts': 'Possible answers', 'sr.correct': 'correct answer', 'sr.wrong': 'your answer, incorrect',
  'tf.true': 'True', 'tf.false': 'False', 'newtab': 'new tab', 'fig.note': 'Educational illustration, fictional data.', 'chart.alt': 'Fictional educational chart',
  'lang.changed': 'Language: English', 'err.h': 'Something went wrong', 'err.p': 'This page could not be displayed. Go back to the home page and try again.',

  'lvl.1': 'Beginner', 'lvl.2': 'Intermediate', 'lvl.3': 'Technical', 'lvl.4': 'Advanced',
  'cat.basics': 'Basics', 'cat.orders': 'Orders', 'cat.risk': 'Risk', 'cat.analysis': 'Analysis', 'cat.structure': 'Structure', 'cat.advanced': 'Advanced',
  'pcat.reversal': 'Reversal', 'pcat.continuation': 'Continuation', 'pcat.breakout': 'Breakout',
  'qt.mcq': 'Multiple choice', 'qt.tf': 'True / False', 'qt.id': 'Identification', 'qt.def': 'Definition', 'qt.comp': 'Comprehension',
  'f.all': 'All', 'f.cat': 'Category', 'f.lvl': 'Level', 'f.type': 'Type', 'f.reset': 'Reset filters',

  'anat.alt': 'Anatomy of a bullish and a bearish candle', 'anat.high': 'High', 'anat.low': 'Low', 'anat.open': 'Open', 'anat.close': 'Close',
  'anat.body': 'Body', 'anat.upper': 'Upper wick', 'anat.lower': 'Lower wick', 'anat.bull': 'Bullish', 'anat.bear': 'Bearish',

  'hero.pill': 'Educational: no signals, no promise of gains', 'hero.title': 'Learn. Analyze. Trade smarter.',
  'hero.lead': 'THMTrade is an educational platform to learn trading step by step: interactive courses, corrected quizzes, glossary, chart patterns, practice and tools, from complete beginner to advanced analysis.',
  'cta.start': 'Start learning', 'cta.continue': 'Keep learning', 'cta.explore': 'Explore courses', 'cta.allcourses': 'All courses',
  'resume.h': 'Your progress', 'hero.viz': 'Decorative illustration', 'hv.c1': 'Structure', 'hv.c2': 'Risk', 'hv.c3': 'Method', 'hv.f1': 'Manage risk', 'hv.f2': 'Define your plan',
  'hero.note': 'Purely decorative chart: no real market data.',

  'home.markets.h': 'Four markets to understand', 'home.markets.p': 'Each market has its own hours, volatility and drivers. THMTrade helps you tell them apart before choosing where to train.',
  'home.method.h': 'A method to make progress', 'home.method.p': 'No shortcuts: understand, practise, then build your own method.',
  'm1.t': 'Understand before acting', 'm1.d': 'Progressive lessons, examples and callouts to grasp why concepts work, from the basics to technical notions.',
  'm2.t': 'Practise to anchor', 'm2.d': 'Corrected quizzes after every lesson and varied exercises to check you can identify, calculate and reason.',
  'm3.t': 'Build your method', 'm3.d': 'Framework, entry, invalidation, risk, journal and statistics: turn your ideas into written, testable rules.',
  'home.why.h': 'Why THMTrade', 'home.why.p': 'A platform designed to learn seriously, without unrealistic promises.',
  'f1.t': 'Progressive path', 'f1.d': 'From complete beginner to advanced user, always showing where you are and what comes next.',
  'f2.t': 'Corrected quizzes', 'f2.d': 'Every answer is explained, right or wrong, so you understand rather than just memorise.',
  'f3.t': 'Risk at the centre', 'f3.d': 'Position sizing, stop-loss, risk/reward and drawdown are covered from the fundamentals.',
  'f4.t': 'Glossary and patterns', 'f4.d': 'Search, filters and detailed entries to find a term or a figure in seconds.',
  'f5.t': 'Bilingual FR / EN', 'f5.d': 'The whole platform is available in French and English, and remembers your choice.',
  'f6.t': 'Your progress, on your device', 'f6.d': 'Your progress is saved in your browser: no account required in this version.',
  'home.journey.h': 'Your learning path', 'home.journey.p': 'Seven steps, from discovery to deepening. The current step is highlighted.',
  'j.discover': 'Discover', 'j.discover.d': 'What is trading, and which markets?',
  'j.understand': 'Understand', 'j.understand.d': 'Orders, costs, leverage and risk.',
  'j.learn': 'Learn', 'j.learn.d': 'Read a chart: candles, trends, levels.',
  'j.practice': 'Practise', 'j.practice.d': 'Interactive exercises and scores.',
  'j.analyze': 'Analyse', 'j.analyze.d': 'Chart patterns and scenarios.',
  'j.build': 'Build your method', 'j.build.d': 'Rules, journal, backtesting.',
  'j.deepen': 'Deepen', 'j.deepen.d': 'Confluence, liquidity, probabilities.',
  'home.courses.h': 'Five courses, one thread', 'home.courses.p': 'Each course has lessons, a corrected quiz and tracked progress.',
  'home.lex.h': 'An interactive glossary', 'home.lex.p': 'Search, categories and levels: each term has a definition, an example and useful links.', 'home.lex.cta': 'Open the glossary',
  'home.pat.h': 'A pattern library', 'home.pat.p': 'Thirteen figures explained: structure, context, common mistakes and an exercise. Never presented as a guarantee.', 'home.pat.cta': 'Explore patterns',
  'home.prac.h': 'Practice: train for real', 'home.prac.p': 'Eight exercise sets — support, resistance, trend, range, patterns, invalidation, risk/reward and scenarios — with scores and the option to retry.', 'home.prac.cta': 'Open Practice',
  'home.tools.h': 'Tools to move into practice', 'home.tools.p': 'TradingView, Investing.com and CoinGecko presented with a THMTrade tutorial, plus built-in calculators.', 'home.tools.cta': 'See the tools',
  'home.prem.h': 'Premium: go further', 'home.prem.p': 'In-depth courses, in-depth glossary, Practice, tools and advanced content. Premium is shown as a preview: no payment is active in this version.', 'home.prem.cta': 'Discover Premium',
  'prem.f1': 'In-depth courses', 'prem.f2': 'In-depth glossary', 'prem.f3': 'Practice', 'prem.f4': 'Tools', 'prem.f5': 'Advanced content',
  'home.faq.h': 'Frequently asked questions', 'home.faq.all': 'Full FAQ',
  'home.final.h': 'Ready to understand the markets?', 'home.final.p': 'Start with the first lesson: a few minutes are enough to discover how the platform works.',

  'courses.h1': 'Trading courses', 'courses.lead': 'Five progressive courses to learn trading: fundamentals, reading charts, patterns, method and advanced analysis.',
  'courses.overall': 'Overall progress', 'courses.alldone': 'All courses completed',
  'c.review': 'Review', 'c.continue': 'Continue', 'c.start': 'Start', 'c.lessons.one': '{n} lesson', 'c.lessons.other': '{n} lessons',
  'prog.lessons': '{done} / {total} lessons completed', 'prem.hint': 'Premium content — freely accessible during the launch version',
  'prem.open': 'Content marked Premium is freely accessible in this launch version. Access control will be added along with accounts.',
  'quiz.best': 'Best: {best}/{total}', 'lesson.n': 'Lesson {n} / {total}', 'les.key': 'Key takeaways', 'quiz': 'Quiz', 'quiz.hint': 'Answer each question: the correction appears immediately.',
  'quiz.done': 'Quiz completed: {s}/{n}', 'q.n': 'Question {n}/{total}', 'fb.ok': 'Correct!', 'fb.ko': 'Not quite.', 'fb.answer': 'Correct answer:',
  'qr.perfect': 'Perfect score!', 'qr.good': 'Good work. Reread the corrections to consolidate.', 'qr.retry': 'Reread the lesson and try the quiz again.', 'qr.best': 'Best score: {best}/{total}', 'qr.again': 'Retake the quiz',
  'cp.h': 'Lesson finished?', 'cp.p': 'Mark it as completed to track your progress and see your next step.', 'cp.done.h': 'Lesson completed', 'cp.done.p': 'Well done. Move on when you are ready.',
  'cp.undo': 'Undo', 'cp.btn': 'Mark as completed', 'next.lesson': 'Next lesson', 'next.course': 'Next course', 'next.practice': 'Next: practise', 'prev.lesson': 'Previous lesson', 'les.nav': 'Navigation between lessons',
  'toast.lesson': 'Lesson completed. Well done!', 'toast.course': 'Course completed: {c}', 'toast.undo': 'Lesson reopened.',

  'lex.h1': 'Trading glossary', 'lex.lead': 'The essential trading terms, explained simply, with examples and difficulty level.',
  'lex.search': 'Search a term', 'lex.ph': 'Search: spread, leverage, support…', 'lex.count.one': '{n} term', 'lex.count.other': '{n} terms',
  'lex.empty': 'No term matches your search. Try another word or remove a filter.', 'm.def': 'Definition', 'm.ex': 'Example', 'm.rel': 'Related terms', 'm.lesson': 'See the related lesson',
  'pat.h1': 'Pattern library', 'pat.lead': 'The main chart figures: definition, structure, context, possible interpretation, common mistakes and an exercise.',
  'pat.warn': 'A pattern is never a guarantee of results: it describes a balance of power and must be placed in context.',
  'pat.search': 'Search a pattern', 'pat.ph': 'Search: double top, triangle…', 'pat.count.one': '{n} pattern', 'pat.count.other': '{n} patterns',
  'pat.empty': 'No pattern matches your search. Try another word or remove a filter.',
  'pm.def': 'Definition', 'pm.struct': 'Structure', 'pm.ident': 'How to identify it', 'pm.ctx': 'Context', 'pm.interp': 'Possible interpretation', 'pm.err': 'Common mistakes', 'pm.ex': 'Example', 'pm.exo': 'Exercise',
  'pm.warn': 'Fictional illustration. A pattern can fail: it is never a signal nor a guarantee.',

  'pr.h1': 'Practice', 'pr.lead': 'Train with interactive exercises. Every answer is corrected and explained, and your scores are saved.',
  'pr.s.answers': 'Answers', 'pr.s.correct': 'Correct', 'pr.s.wrong': 'Mistakes', 'pr.s.acc': 'Accuracy', 'pr.s.prog': 'Sets attempted: {done} / {total}',
  'pr.best': 'Best: {best}/{total}', 'pr.new': 'New', 'pr.count.one': '{n} exercise', 'pr.count.other': '{n} exercises', 'pr.tries.one': '{n} attempt', 'pr.tries.other': '{n} attempts',
  'pr.again': 'Retry', 'pr.start': 'Start', 'pr.note': 'Exercise charts are fictional. You can redo a set as often as you like: your best score is kept.',
  'pr.quit': 'Quit', 'pr.q': 'Exercise {n} / {total}', 'pr.live': '{c} correct', 'pr.finish': 'See my result', 'pr.next': 'Next exercise', 'pr.result': 'Result',
  'pr.res.great': 'Excellent work on this set.', 'pr.res.ok': 'A good start. Reread the corrections and try again.', 'pr.res.retry': 'This set needs practice: reread the related lessons then try again.',
  'pr.correct.one': '{n} correct', 'pr.correct.other': '{n} correct', 'pr.errors.one': '{n} mistake', 'pr.errors.other': '{n} mistakes', 'pr.review': 'Set review', 'pr.retry': 'Retry this set', 'pr.all': 'All sets',

  'tl.h1': 'Trader tools', 'tl.lead': 'Three useful resources to analyse markets and follow context, with a THMTrade tutorial to get started.',
  'tl.note': 'THMTrade is not affiliated with any of these services. Links lead to the official sites; their offers and terms belong to them.',
  'tl.use': 'What it is for', 'tl.feat': 'Features', 'tl.start': 'How to get started', 'tl.tuto': 'THMTrade tutorial', 'tl.open': 'Official site', 'tl.tuto.h': 'THMTrade tutorial: {name}',
  'calc.h': 'THMTrade calculators', 'calc.p': 'Three calculators to play with the course notions. They are educational and do not replace a calculation adapted to your platform.',
  'calc.pos.h': 'Position size and R/R', 'calc.capital': 'Capital', 'calc.risk': 'Risk per trade', 'calc.entry': 'Entry price', 'calc.stop': 'Stop-loss', 'calc.tp': 'Target (optional)',
  'calc.fill': 'Enter positive values to get the result.', 'calc.dist0': 'Entry and stop must be different.',
  'calc.riskamt': 'Amount at risk', 'calc.dir': 'Direction', 'calc.long': 'Buy (long)', 'calc.short': 'Sell (short)', 'calc.dist': 'Distance to stop', 'calc.units': 'Size (units)', 'calc.lots': 'Forex lots equivalent*',
  'calc.notional': 'Position value', 'calc.rr': 'Risk/reward ratio', 'calc.tpside': 'The target must be on the correct side of the entry relative to the stop.',
  'calc.lev': 'The position value exceeds your capital: it would require leverage, which also amplifies losses.',
  'calc.dd.h': 'Drawdown and recovery', 'calc.dd.p': 'What gain is needed to get back to the starting capital after a fall?', 'calc.dd.in': 'Capital drawdown', 'calc.dd.hint': 'Enter a drawdown between 0 and 100%.',
  'calc.dd.need': 'Gain required', 'calc.dd.left': 'Capital left',
  'calc.exp.h': 'Expectancy', 'calc.exp.p': 'Average result per trade, in multiples of risk (R).', 'calc.win': 'Win rate', 'calc.rw': 'Average win', 'calc.rl': 'Average loss',
  'calc.exp': 'Expectancy per trade', 'calc.be': 'Breakeven win rate', 'calc.exp.note': 'Calculated on past statistics: it guarantees no future result.',
  'calc.disc': '* Forex lots equivalent: 1 standard lot = 100,000 units. Costs (spread, commissions), currency conversion and slippage are not included.',

  'pm.h1': 'THMTrade Premium', 'pm.lead': 'In-depth courses, in-depth glossary, Practice, tools and advanced content to take your method further.',
  'pm.status.h': 'Preview: nothing to pay today', 'pm.status.p': 'In this version all content is freely accessible. Payment, accounts and the free trial are not active yet, and no bank card is requested.',
  'pm.bill': 'Billing', 'pm.monthly': 'Monthly', 'pm.annual': 'Annual', 'pm.save': 'lower price',
  'pm.now.h': 'Today', 'pm.now.price': 'Free access', 'pm.now.p': 'The THMTrade launch version.', 'pm.now.a': 'All courses, quizzes and exercises', 'pm.now.b': 'Glossary, patterns and tools', 'pm.now.c': 'Progress saved in your browser',
  'pm.trial': '3-day free trial (planned)', 'pm.plan.h': 'Premium', 'pm.per.month': '/ month', 'pm.per.year': '/ year', 'pm.annual.eq': 'About {m} € per month. Indicative target price.', 'pm.monthly.p': 'No long-term commitment. Indicative target price.',
  'pm.cta': '3-day free trial', 'pm.fine': 'Indicative prices, subject to change. No payment is possible in this version.',
  'pm.incl.h': 'What Premium will include', 'pm.incl.p': 'Five areas to go deeper. The related content is already marked with a Premium badge.',
  'pmf.f1': 'The “Building your method” and “Advanced analysis” courses, to turn your ideas into testable rules.', 'pmf.f2': 'Advanced terms: liquidity, BOS / CHoCH, order block, confluence.',
  'pmf.f3': 'Interactive exercise sets to check your understanding.', 'pmf.f4': 'THMTrade tutorials and calculators to apply the theory.', 'pmf.f5': 'Advanced notions, with scenarios, probabilities and error analysis.',
  'pm.soon.h': 'What comes later', 'pm.soon.p': 'To offer a real Premium, THMTrade will add in a later version:', 'pm.soon.a': 'user accounts and authentication', 'pm.soon.b': 'secure payment through a dedicated provider',
  'pm.soon.c': 'secure access control for Premium content', 'pm.soon.d': 'a database to sync your progress',
  'pmm.h': 'Premium is not open yet', 'pmm.p1': 'The 3-day free trial will be offered once accounts and payment are available. For now nothing is billed and no bank card is requested.',
  'pmm.p2': 'In the meantime, all content is freely accessible:', 'pmm.a': 'Five courses, including content marked Premium', 'pmm.b': 'Glossary, patterns and Practice', 'pmm.c': 'Tools and calculators',

  'foot.legal': 'Legal notice', 'foot.terms': 'Terms of use', 'foot.privacy': 'Privacy policy',
  'legal.updated': 'Last updated: {d}', 'legal.todo': 'To complete: {f}', 'legal.other': 'Other legal pages',
  'legal.f.publisher': 'publisher name', 'legal.f.status': 'status', 'legal.f.registration': 'registration number', 'legal.f.address': 'address', 'legal.f.email': 'email',
  'legal.meta.mentions.t': 'Legal notice', 'legal.meta.mentions.d': 'THMTrade legal notice: publisher, host, intellectual property and trading risk warning.',
  'legal.meta.conditions.t': 'Terms of use', 'legal.meta.conditions.d': 'THMTrade terms of use, an educational trading platform: nature of the service, liability and intellectual property.',
  'legal.meta.confidentialite.t': 'Privacy policy', 'legal.meta.confidentialite.d': 'THMTrade privacy policy: data stored on your device, hosting, contact and rights.',
  'faq.h1': 'Frequently asked questions', 'faq.lead': 'Answers to the most common questions about THMTrade.',
  'nf.h1': 'Page not found', 'nf.lead': 'This address does not match any THMTrade page. Use the menu or one of the links below.',
  'rk.p1': 'Trading financial products (Forex, crypto-assets, stocks, indices, derivatives) carries a high risk of loss, up to the entire capital invested, and more with some leveraged products.',
  'rk.p2': 'Past performance does not predict future performance. THMTrade examples, charts and calculations are fictional and educational.',
  'rk.p3': 'THMTrade is an educational platform. It provides no personalised investment advice, no signals and no guarantee of results.',
  'rk.p4': 'Never risk money you need. Before trading, learn about the products, fees and regulation in your country, and consult a licensed professional if needed.',
  'reset.h': 'Reset your progress?', 'reset.p': 'Completed lessons, quiz scores and Practice results will be erased from this browser. Your language is kept. This cannot be undone.', 'reset.ok': 'Erase everything', 'reset.done': 'Progress reset.',

  'meta.home.t': 'THMTrade — Learn trading: courses, glossary, patterns and practice', 'meta.home.d': 'THMTrade is an educational platform to learn trading: beginner courses, trading glossary, technical analysis, chart patterns, risk management, Forex, crypto, stocks and indices.',
  'meta.courses.t': 'Trading courses for beginners and advanced learners', 'meta.courses.d': 'Five courses to learn trading: fundamentals, reading a chart, chart patterns, building your method and advanced analysis.',
  'meta.lex.t': 'Trading glossary: definitions and examples', 'meta.lex.d': 'Trading glossary: spread, leverage, stop-loss, support, resistance, breakout, order block… Simple definitions, examples and levels.',
  'meta.pat.t': 'Trading patterns: chart figure library', 'meta.pat.d': 'Double top, double bottom, head & shoulders, triangles, flag, pennant, wedge, breakout, pullback: structure, context and common mistakes.',
  'meta.pr.t': 'Trading practice: interactive exercises', 'meta.pr.d': 'Train with interactive exercises: support, resistance, trend, range, patterns, invalidation, risk/reward and scenarios.',
  'meta.tl.t': 'Trading tools: TradingView, Investing.com, CoinGecko', 'meta.tl.d': 'Discover TradingView, Investing.com and CoinGecko with a THMTrade tutorial, and use calculators for position size, drawdown and expectancy.',
  'meta.pm.t': 'Premium: in-depth courses and advanced content', 'meta.pm.d': 'Preview of THMTrade Premium: in-depth courses, glossary, Practice, tools and advanced content. Payment is not active in this version.',
  'meta.faq.t': 'FAQ: frequently asked questions about THMTrade', 'meta.faq.d': 'Answers to common questions: the educational nature of THMTrade, trading risks, progress, languages, Premium.'
}
};

/* =====================================================================
   5. GRAPHIQUES SVG PÉDAGOGIQUES
   Toutes les séries sont FICTIVES et générées de façon déterministe :
   ce sont des illustrations, jamais de vraies données de marché.
   ===================================================================== */
function rnd(i) { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }

function toCandles(cl) {
  const mn = Math.min.apply(null, cl), mx = Math.max.apply(null, cl);
  const u = ((mx - mn) || 1) * 0.028;
  return cl.map((c, i) => {
    const o = i ? cl[i - 1] : c - u * 1.6;
    return {
      o, c,
      h: Math.max(o, c) + u * (0.3 + rnd(i) * 1.5),
      l: Math.min(o, c) - u * (0.3 + rnd(i + 91) * 1.5)
    };
  });
}
function sma(cl, n) {
  return cl.map((_, i) => {
    if (i < n - 1) return null;
    let s = 0;
    for (let k = 0; k < n; k++) s += cl[i - k];
    return s / n;
  });
}
function interp(pts, x) {
  for (let k = 1; k < pts.length; k++) {
    if (x <= pts[k][0]) {
      const a = pts[k - 1], b = pts[k];
      return a[1] + (b[1] - a[1]) * ((x - a[0]) / ((b[0] - a[0]) || 1));
    }
  }
  return pts[pts.length - 1][1];
}
function patCloses(pts, n) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(interp(pts, i / (n - 1) * 100) + (rnd(i * 3 + 7) - 0.5) * 2.2);
  return out;
}

/** Séries fictives réutilisées dans les leçons et le Practice. */
const SER = {
  up: [100, 101, 103, 102, 100, 99, 101, 104, 106, 105, 103, 102, 104, 107, 110, 109, 107, 106, 108, 111, 114, 113, 111, 110, 112, 115, 118, 117, 115, 114, 116, 119, 122],
  range: [110, 112, 115, 118, 120, 118, 115, 111, 107, 103, 100, 102, 106, 110, 114, 118, 120, 119, 115, 110, 106, 102, 100, 101, 105, 110, 115, 119, 120, 117, 113, 108, 104, 101, 100],
  bounce: [112, 109, 105, 102, 100, 104, 108, 112, 110, 106, 102, 100, 103, 107, 111, 113, 109, 105, 101, 100, 104, 108, 113, 116],
  ceil: [100, 104, 108, 112, 115, 113, 110, 106, 103, 105, 109, 113, 115, 112, 108, 105, 107, 111, 114, 115, 112, 108, 104, 100],
  brk: [100, 103, 106, 109, 110, 107, 104, 102, 105, 108, 110, 108, 105, 107, 109, 110, 113, 116, 118, 116, 113, 111, 110, 111, 114, 117, 120],
  setup: [90, 92, 91, 94, 96, 95, 97, 99, 98, 100],
  ma: [100, 102, 101, 103, 105, 104, 106, 108, 107, 105, 103, 104, 102, 100, 98, 99, 97, 95, 96, 98, 100, 103, 106, 109, 112, 111, 114, 117, 116, 119, 122, 124, 123, 126, 128, 127]
};
SER.down = SER.up.map(v => 222 - v);

/** Graphique en bougies (paramétrable) — retourne une chaîne SVG. */
function chartSVG(o) {
  const W = o.w || 320, H = o.h || 170;
  const P = { l: 8, r: 8, t: 14, b: 12 };
  const cs = o.candles || toCandles(o.closes);
  const n = cs.length, slots = n + (o.extra || 0);
  let min = Infinity, max = -Infinity;
  cs.forEach(c => { if (c.l < min) min = c.l; if (c.h > max) max = c.h; });
  (o.lines || []).forEach(l => {
    if (l.y != null) { min = Math.min(min, l.y); max = Math.max(max, l.y); }
    else if (l.a) [l.a, l.b].forEach(p => { min = Math.min(min, p[1]); max = Math.max(max, p[1]); });
  });
  (o.zones || []).forEach(z => { min = Math.min(min, z.p1, z.p2); max = Math.max(max, z.p1, z.p2); });
  const pad = (max - min) * 0.09 || 1;
  min -= pad; max += pad;
  const step = (W - P.l - P.r) / slots;
  const X = i => P.l + (i + 0.5) * step;
  const Y = v => P.t + (max - v) / (max - min) * (H - P.t - P.b);
  const cw = Math.max(2.2, step * 0.6);
  const f1 = v => v.toFixed(1);
  let s = `<svg class="chart ${o.cls || ''}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(L(o.label) || tr('chart.alt'))}" preserveAspectRatio="xMidYMid meet">`;
  for (let k = 1; k <= 3; k++) {
    const y = P.t + k * (H - P.t - P.b) / 4;
    s += `<line class="gl" x1="${P.l}" x2="${W - P.r}" y1="${f1(y)}" y2="${f1(y)}"/>`;
  }
  (o.zones || []).forEach(z => {
    const x1 = z.x1 != null ? X(z.x1) - step / 2 : P.l;
    const ya = Y(Math.max(z.p1, z.p2)), yb = Y(Math.min(z.p1, z.p2));
    s += `<rect class="zn zn-${z.cls || 'rg'}" x="${f1(x1)}" y="${f1(ya)}" width="${f1(W - P.r - x1)}" height="${f1(yb - ya)}"/>`;
    if (z.label) s += `<text class="zl" x="${f1((x1 + W - P.r) / 2)}" y="${f1((ya + yb) / 2 + 3)}" text-anchor="middle">${tx(z.label)}</text>`;
  });
  if (o.ma) {
    let d = '';
    sma(cs.map(c => c.c), o.ma).forEach((v, i) => { if (v != null) d += (d ? 'L' : 'M') + f1(X(i)) + ' ' + f1(Y(v)); });
    s += `<path class="ma" d="${d}"/>`;
  }
  cs.forEach((c, i) => {
    const cx = X(i), top = Y(Math.max(c.o, c.c)), bot = Y(Math.min(c.o, c.c));
    s += `<g class="cd ${c.c >= c.o ? 'up' : 'dn'}"><line x1="${f1(cx)}" x2="${f1(cx)}" y1="${f1(Y(c.h))}" y2="${f1(Y(c.l))}"/><rect x="${f1(cx - cw / 2)}" y="${f1(top)}" width="${f1(cw)}" height="${f1(Math.max(1.2, bot - top))}" rx="0.8"/></g>`;
  });
  if (o.path) s += `<polyline class="schema" points="${o.path.map(p => f1(X(p[0])) + ',' + f1(Y(p[1]))).join(' ')}"/>`;
  (o.lines || []).forEach(l => {
    let x1, y1, x2, y2;
    if (l.y != null) { x1 = l.x1 != null ? X(l.x1) : P.l; x2 = l.x2 != null ? X(l.x2) : W - P.r; y1 = y2 = Y(l.y); }
    else { x1 = X(l.a[0]); y1 = Y(l.a[1]); x2 = X(l.b[0]); y2 = Y(l.b[1]); }
    const c = l.cls || 'n';
    s += `<line class="ln ln-${c}" x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}"/>`;
    if (l.label) {
      const left = l.side === 'l';
      const tx0 = left ? P.l + 3 : Math.min(W - P.r - 3, x2 + (l.y != null ? 0 : 4));
      s += `<text class="lbl lbl-${c}" x="${f1(left ? tx0 : tx0)}" y="${f1(clamp((left ? y1 : y2) - 4, 9, H - 3))}" text-anchor="${left ? 'start' : 'end'}">${tx(l.label)}</text>`;
    }
  });
  (o.marks || []).forEach(k => {
    let py;
    if (k.s === 'h') py = Y(cs[k.i].h) - 6;
    else if (k.s === 'l') py = Y(cs[k.i].l) + 12;
    else py = Y(k.p) + (k.pos === 'b' ? 12 : -6);
    s += `<text class="mk mk-${k.cls || 'n'}" x="${f1(X(k.i))}" y="${f1(clamp(py, 9, H - 3))}" text-anchor="middle">${tx(k.t)}</text>`;
  });
  return s + '</svg>';
}

/** Illustration schématique d'un pattern à partir de ses points-clés. */
function patternChart(p, o = {}) {
  const n = o.n || 40, xi = x => x / 100 * (n - 1);
  const cl = patCloses(p.pts, n);
  const show = o.labels !== false;
  return chartSVG({
    closes: cl,
    h: o.h || 170,
    label: o.label || p.n,
    path: o.schema === false ? null : p.pts.map(q => [xi(q[0]), q[1]]),
    lines: show || o.lines ? (p.lines || []).map(l => ({ a: [xi(l.a[0]), l.a[1]], b: [xi(l.b[0]), l.b[1]], cls: l.cls, label: show ? l.label : null })) : [],
    marks: show ? (p.marks || []).map(k => ({ i: xi(k.x), p: k.y, t: k.t, pos: k.pos })) : [],
    cls: o.cls
  });
}

/** Anatomie d'une bougie japonaise (haussière + baissière), textes traduits. */
function anatomySVG() {
  const g = (cx, up) => {
    const hi = 24, lo = 162, a = 56, b = 124;   // a = haut du corps, b = bas du corps
    return `<g class="cd ${up ? 'up' : 'dn'}"><line x1="${cx}" x2="${cx}" y1="${hi}" y2="${lo}"/><rect x="${cx - 15}" y="${a}" width="30" height="${b - a}" rx="3"/></g>`;
  };
  const tick = (x1, x2, y) => `<line class="tk" x1="${x1}" x2="${x2}" y1="${y}" y2="${y}"/>`;
  return `<svg class="chart chart-anat" viewBox="0 0 320 196" role="img" aria-label="${t('anat.alt')}">
    ${g(84, true)}${g(236, false)}
    ${tick(84, 122, 24)}${tick(99, 122, 56)}${tick(99, 122, 124)}${tick(84, 122, 162)}
    <text class="lbl-t" x="126" y="27">${t('anat.high')}</text>
    <text class="lbl-t" x="126" y="59">${t('anat.close')}</text>
    <text class="lbl-t" x="126" y="127">${t('anat.open')}</text>
    <text class="lbl-t" x="126" y="165">${t('anat.low')}</text>
    ${tick(251, 288, 24)}${tick(251, 288, 56)}${tick(251, 288, 124)}${tick(236, 288, 162)}
    <text class="lbl-t" x="292" y="27" text-anchor="start">${t('anat.high')}</text>
    <text class="lbl-t" x="292" y="59">${t('anat.open')}</text>
    <text class="lbl-t" x="292" y="127">${t('anat.close')}</text>
    <text class="lbl-t" x="292" y="165">${t('anat.low')}</text>
    <text class="lbl-a" x="4" y="42">${t('anat.upper')}</text>
    <text class="lbl-a" x="4" y="96">${t('anat.body')}</text>
    <text class="lbl-a" x="4" y="146">${t('anat.lower')}</text>
    <text class="lbl-h up" x="84" y="188" text-anchor="middle">${t('anat.bull')}</text>
    <text class="lbl-h dn" x="236" y="188" text-anchor="middle">${t('anat.bear')}</text>
  </svg>`;
}

/** Bougie unique (exercices d'identification). */
function candleSVG(c) {
  const W = 320, H = 150, mn = c.l, mx = c.h, pad = (mx - mn) * 0.1;
  const Y = v => 10 + (mx + pad - v) / ((mx - mn) + 2 * pad) * (H - 20);
  const up = c.c >= c.o, cx = 160;
  return `<svg class="chart chart-one" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(L(c.label) || tr('chart.alt'))}">
    <line class="gl" x1="8" x2="312" y1="${Y((mx + mn) / 2).toFixed(1)}" y2="${Y((mx + mn) / 2).toFixed(1)}"/>
    <g class="cd ${up ? 'up' : 'dn'}"><line x1="${cx}" x2="${cx}" y1="${Y(c.h).toFixed(1)}" y2="${Y(c.l).toFixed(1)}"/><rect x="${cx - 20}" y="${Y(Math.max(c.o, c.c)).toFixed(1)}" width="40" height="${Math.max(2, Y(Math.min(c.o, c.c)) - Y(Math.max(c.o, c.c))).toFixed(1)}" rx="3"/></g>
  </svg>`;
}

/** Figure générique utilisée par les leçons, les quiz et le Practice. */
function figHTML(f, withNote) {
  if (!f) return '';
  let svg;
  if (f.k === 'anatomy') svg = anatomySVG();
  else if (f.k === 'candle') svg = candleSVG(f);
  else if (f.k === 'pat') svg = patternChart(PAT_BY_ID[f.id], { labels: f.labels, label: f.label });
  else svg = chartSVG(f);
  const cap = f.cap ? tx(f.cap) : '';
  const note = (f.cap || withNote) ? `<span class="fig-note">${t('fig.note')}</span>` : '';
  return `<figure class="fig">${svg}${cap || note ? `<figcaption>${cap} ${note}</figcaption>` : ''}</figure>`;
}

/* =====================================================================
   6. CONTENU PÉDAGOGIQUE — COURS 1 ET 2
   Structure d'une leçon : { id, t, dur, intro, s:[{h,p[],ul[],fig}], key[], note, q[] }
   Questions : Q(type, énoncé, options, index correct, explication, figure)
               TF(énoncé, vrai?, explication, figure)
   ===================================================================== */
const Q = (type, q, o, a, e, fig) => ({ type, q, o, a, e, fig });
const TF = (q, a, e, fig) => ({ type: 'tf', q, o: null, a: a ? 0 : 1, e, fig });

/** Graphique de trade (entrée / stop / objectif) réutilisé dans plusieurs leçons. */
const tradeFig = (tp, o = {}) => ({
  closes: SER.setup, extra: 10, h: 180,
  label: o.label,
  zones: [
    { p1: 100, p2: tp, cls: 'up', x1: 9, label: o.zTp },
    { p1: 95, p2: 100, cls: 'dn', x1: 9, label: o.zSl }
  ],
  lines: [
    { y: 100, cls: 'entry', label: o.lEntry, side: 'l' },
    { y: 95, x1: 9, cls: 'sl', label: o.lSl },
    { y: tp, x1: 9, cls: 'tp', label: o.lTp }
  ],
  cap: o.cap
});

const COURSES = [
/* ------------------------------------------------------------------ */
{
  id: 1, ic: 'book', lvl: 1, prem: false,
  t: T('Les fondamentaux du trading', 'Trading fundamentals'),
  d: T("Marchés, ordres, coûts, levier et risque : tout ce qu'il faut comprendre avant d'ouvrir une première position.",
       'Markets, orders, costs, leverage and risk: everything to understand before opening a first position.'),
  lessons: [
  /* ---------------- 1-1 ---------------- */
  {
    id: '1-1', dur: 6,
    t: T("Qu'est-ce que le trading ?", 'What is trading?'),
    intro: T("Le trading consiste à acheter et vendre des instruments financiers pour tenter de profiter des variations de prix. C'est une activité exigeante, qui comporte un risque réel de perte.",
             'Trading means buying and selling financial instruments to try to profit from price changes. It is a demanding activity that carries a real risk of loss.'),
    s: [
      { h: T('Acheter, vendre… dans les deux sens', 'Buying and selling, in both directions'),
        p: [T("Quand tu **achètes** en pensant que le prix va monter, tu ouvres une position **longue** (long). Quand tu **vends** en pensant que le prix va baisser, tu ouvres une position **courte** (short).",
              'When you **buy** expecting the price to rise, you open a **long** position. When you **sell** expecting the price to fall, you open a **short** position.'),
            T("Le résultat dépend de l'écart entre le prix d'entrée et le prix de sortie, de la taille de la position et des coûts (spread, commissions).",
              'The result depends on the gap between entry and exit prices, the size of the position and costs (spread, commissions).')] },
      { h: T('Trader ou investisseur ?', 'Trader or investor?'),
        p: [T("L'investisseur raisonne en général sur le long terme (des années) et s'intéresse à la valeur d'un actif. Le trader vise des horizons plus courts, de quelques minutes à quelques semaines, et se concentre sur l'évolution du prix.",
              'An investor usually thinks long term (years) and looks at the value of an asset. A trader targets shorter horizons, from minutes to weeks, and focuses on price behaviour.'),
            T("Aucune de ces approches n'est sans risque ni garantie de résultat.", 'Neither approach is risk-free or guarantees a result.')] },
      { h: T("Qu'est-ce qui fait bouger un prix ?", 'What moves a price?'),
        p: [T("À chaque instant, un prix reflète l'équilibre entre **l'offre** (les vendeurs) et **la demande** (les acheteurs). Il réagit aux actualités, aux données économiques, aux décisions des banques centrales, aux résultats d'entreprises et au sentiment collectif.",
              'At any moment a price reflects the balance between **supply** (sellers) and **demand** (buyers). It reacts to news, economic data, central bank decisions, company results and collective sentiment.'),
            T("Comprendre ces moteurs donne du contexte, sans jamais permettre de prédire avec certitude.", 'Understanding these drivers gives context, but never allows certain predictions.')] }
    ],
    key: [
      T("Trader, c'est tenter de profiter des variations de prix, à la hausse (long) comme à la baisse (short).", 'Trading is trying to profit from price changes, up (long) or down (short).'),
      T("Résultat = (prix de sortie − prix d'entrée) × taille − coûts.", 'Result = (exit price − entry price) × size − costs.'),
      T("Un prix naît de l'équilibre entre l'offre et la demande.", 'A price comes from the balance between supply and demand.'),
      T("Personne ne peut garantir un gain : la gestion du risque passe avant tout.", 'Nobody can guarantee a gain: risk management comes first.')
    ],
    note: { k: 'warn', t: T("THMTrade est éducatif : aucun contenu n'est un conseil financier personnalisé, un signal ou une promesse de résultat.",
                              'THMTrade is educational: no content is personalised financial advice, a signal or a promise of results.') },
    q: [
      Q('mcq', T("Que signifie ouvrir une position « longue » ?", 'What does opening a “long” position mean?'),
        [T("Acheter en anticipant une hausse", 'Buying expecting a rise'), T("Vendre en anticipant une hausse", 'Selling expecting a rise'), T("Attendre sans agir", 'Waiting without acting'), T("Fermer toutes ses positions", 'Closing all positions')], 0,
        T("Une position longue s'ouvre par un achat : on espère revendre plus cher plus tard.", 'A long position is opened by buying: you hope to sell higher later.')),
      TF(T("Une stratégie de trading bien construite garantit des gains.", 'A well-built trading strategy guarantees gains.'), false,
        T("Aucune stratégie ne garantit de gains. Une bonne méthode vise à gérer le risque et à avoir un avantage statistique, jamais une certitude.", 'No strategy guarantees gains. A good method manages risk and seeks a statistical edge, never a certainty.')),
      Q('def', T("Le prix d'un actif résulte principalement…", "An asset's price mainly results from…"),
        [T("de l'équilibre entre l'offre et la demande", 'the balance between supply and demand'), T("de la seule décision du courtier", "the broker's decision alone"), T("d'un calcul fixe publié chaque matin", 'a fixed calculation published every morning')], 0,
        T("Le prix se forme à chaque instant par la rencontre des acheteurs et des vendeurs.", 'The price forms at every moment where buyers and sellers meet.'))
    ]
  },
  /* ---------------- 1-2 ---------------- */
  {
    id: '1-2', dur: 8,
    t: T('Comment fonctionnent les marchés ?', 'How do markets work?'),
    intro: T("Il existe quatre grandes familles de marchés. Chacune a ses horaires, son niveau de volatilité et ses moteurs : les connaître t'aide à choisir où apprendre.",
             'There are four main families of markets. Each has its own hours, level of volatility and drivers: knowing them helps you choose where to learn.'),
    s: [
      { h: T('Le Forex : les devises', 'Forex: currencies'),
        p: [T("Le Forex (FX) est le marché des changes : on échange une devise contre une autre, toujours **par paires** (EUR/USD, GBP/JPY…). C'est un marché décentralisé, très liquide, ouvert en continu du lundi au vendredi.",
              'Forex (FX) is the currency market: one currency is exchanged for another, always **in pairs** (EUR/USD, GBP/JPY…). It is decentralised, very liquid and open continuously from Monday to Friday.'),
            T("Les taux d'intérêt, les banques centrales et les données macro-économiques sont ses principaux moteurs.", 'Interest rates, central banks and macroeconomic data are its main drivers.')] },
      { h: T('La crypto : les actifs numériques', 'Crypto: digital assets'),
        p: [T("Bitcoin, Ethereum et d'autres cryptomonnaies s'échangent sur des plateformes **24h/24 et 7j/7**. La volatilité y est souvent plus forte que sur d'autres marchés.",
              'Bitcoin, Ethereum and other cryptocurrencies trade on platforms **24/7**. Volatility is often higher than in other markets.'),
            T("S'ajoutent des risques propres : sécurité des plateformes, évolution de la réglementation, liquidité variable selon les actifs.", 'Specific risks add up: platform security, changing regulation and liquidity that varies by asset.')] },
      { h: T('Actions et indices', 'Stocks and indices'),
        p: [T("Une **action** est une part du capital d'une entreprise cotée en bourse. Elle s'échange pendant les horaires d'ouverture de sa place boursière et réagit aux résultats, au secteur et à l'économie.",
              'A **stock** is a share of the capital of a listed company. It trades during the opening hours of its exchange and reacts to earnings, its sector and the economy.'),
            T("Un **indice** (S&P 500, CAC 40, Nasdaq 100…) regroupe un panier d'actions pour mesurer un marché. On n'achète pas l'indice lui-même : on passe par des produits dédiés (ETF, dérivés…), selon son courtier et la réglementation de son pays.",
              'An **index** (S&P 500, CAC 40, Nasdaq 100…) groups a basket of stocks to measure a market. You do not buy the index itself: you use dedicated products (ETFs, derivatives…) depending on your broker and local regulation.')] }
    ],
    key: [
      T('Forex : paires de devises, marché très liquide ouvert du lundi au vendredi.', 'Forex: currency pairs, very liquid market open Monday to Friday.'),
      T('Crypto : ouverte en continu, volatilité souvent élevée, risques spécifiques.', 'Crypto: open around the clock, often highly volatile, with specific risks.'),
      T("Actions : parts d'entreprises, horaires de bourse, sensibles aux résultats.", 'Stocks: company shares, exchange hours, sensitive to earnings.'),
      T("Indices : paniers d'actions qui résument un marché.", 'Indices: baskets of stocks that summarise a market.')
    ],
    note: { k: 'tip', t: T("Pour débuter, concentre-toi sur un seul marché et quelques instruments : tu comprendras mieux leur comportement.", 'To start, focus on one market and a few instruments: you will understand their behaviour better.') },
    q: [
      Q('mcq', T('Quel marché est accessible 24h/24 et 7j/7 ?', 'Which market is available 24/7?'),
        [T('Les actions', 'Stocks'), T('La crypto', 'Crypto'), T('Les indices boursiers', 'Stock indices')], 1,
        T("Les cryptomonnaies s'échangent en continu, week-ends compris. Les actions suivent les horaires de leur bourse.", 'Cryptocurrencies trade continuously, weekends included. Stocks follow exchange hours.')),
      Q('def', T('Un indice boursier est…', 'A stock index is…'),
        [T("une action très chère", 'a very expensive stock'), T("un panier d'actions qui résume un marché", 'a basket of stocks that summarises a market'), T("une devise étrangère", 'a foreign currency')], 1,
        T("Un indice agrège plusieurs actions pour mesurer la performance d'un marché ou d'un secteur.", 'An index aggregates several stocks to measure the performance of a market or sector.')),
      TF(T("Sur le Forex, on échange des devises par paires, comme EUR/USD.", 'On Forex, currencies are traded in pairs, such as EUR/USD.'), true,
        T("Une devise n'a de prix que par rapport à une autre : d'où les paires.", 'A currency only has a price relative to another: hence pairs.'))
    ]
  },
  /* ---------------- 1-3 ---------------- */
  {
    id: '1-3', dur: 8,
    t: T('Acheter, vendre et types d\'ordres', 'Buying, selling and order types'),
    intro: T("Pour agir sur un marché, on passe des ordres. Bien choisir son type d'ordre, c'est décider à quel prix et dans quelles conditions on entre ou on sort.",
             'To act on a market you place orders. Choosing the right order type means deciding at what price and under which conditions you enter or exit.'),
    s: [
      { h: T('Acheter au Ask, vendre au Bid', 'Buy at the Ask, sell at the Bid'),
        p: [T("Chaque instrument affiche deux prix : le **Ask** (le prix auquel tu peux acheter) et le **Bid** (le prix auquel tu peux vendre). Le Ask est toujours un peu plus haut que le Bid : cet écart est le **spread**, vu dans la leçon suivante.",
              'Every instrument shows two prices: the **Ask** (the price you can buy at) and the **Bid** (the price you can sell at). The Ask is always slightly above the Bid: that gap is the **spread**, covered in the next lesson.')] },
      { h: T("Les principaux types d'ordres", 'The main order types'),
        ul: [T("**Ordre au marché** : exécuté tout de suite au meilleur prix disponible. Rapide, mais le prix obtenu peut différer légèrement du prix affiché (slippage).", '**Market order**: executed immediately at the best available price. Fast, but the price obtained may differ slightly from the one displayed (slippage).'),
             T("**Ordre limite** : exécuté seulement au prix choisi, ou à un meilleur prix. Tu contrôles le prix, mais l'ordre peut ne jamais être exécuté.", '**Limit order**: executed only at your chosen price or better. You control the price, but the order may never be filled.'),
             T("**Ordre stop** : devient un ordre au marché quand le prix atteint un niveau donné. Utile pour entrer sur une cassure ou pour sortir d'un trade perdant.", '**Stop order**: becomes a market order when the price reaches a given level. Useful to enter on a breakout or exit a losing trade.')] },
      { h: T('Stop-loss et take-profit', 'Stop-loss and take-profit'),
        p: [T("Le **stop-loss** ferme automatiquement la position si le prix va contre toi jusqu'à un niveau que tu as choisi : il limite la perte. Le **take-profit** la ferme quand un objectif de gain est atteint.",
              'The **stop-loss** automatically closes the position if the price moves against you to a level you chose: it limits the loss. The **take-profit** closes it when a profit target is reached.'),
            T("Ces deux niveaux se décident **avant** d'entrer, pas pendant le trade.", 'Both levels are decided **before** entering, not during the trade.')],
        fig: tradeFig(110, { lEntry: T('Entrée', 'Entry'), lSl: T('Stop-loss', 'Stop-loss'), lTp: T('Take-profit', 'Take-profit'),
                             cap: T("Position longue : entrée, stop-loss sous l'entrée, take-profit au-dessus.", 'Long position: entry, stop-loss below entry, take-profit above.'),
                             label: T("Graphique fictif d'une position longue avec entrée, stop-loss et take-profit", 'Fictional chart of a long position with entry, stop-loss and take-profit') }) }
    ],
    key: [
      T("On achète au Ask et on vend au Bid.", 'You buy at the Ask and sell at the Bid.'),
      T("Marché = rapidité ; limite = contrôle du prix ; stop = déclenchement à un niveau.", 'Market = speed; limit = price control; stop = trigger at a level.'),
      T("Stop-loss et take-profit se définissent avant d'entrer.", 'Stop-loss and take-profit are defined before entering.')
    ],
    note: { k: 'warn', t: T("Un stop-loss n'est pas une garantie de prix : en cas de gap ou de forte volatilité, l'exécution peut se faire à un prix moins favorable.",
                              'A stop-loss is not a price guarantee: with a gap or high volatility, execution may happen at a less favourable price.') },
    q: [
      Q('mcq', T("Quel ordre s'exécute immédiatement au meilleur prix disponible ?", 'Which order is executed immediately at the best available price?'),
        [T("L'ordre limite", 'The limit order'), T("L'ordre au marché", 'The market order'), T("Le take-profit", 'The take-profit')], 1,
        T("L'ordre au marché privilégie la rapidité d'exécution, au détriment du contrôle exact du prix.", 'The market order favours speed of execution at the expense of exact price control.')),
      Q('comp', T("À quoi sert un stop-loss ?", 'What is a stop-loss for?'),
        [T("À garantir un gain", 'To guarantee a gain'), T("À limiter la perte si le marché va contre la position", 'To limit the loss if the market goes against the position'), T("À augmenter la taille de la position", 'To increase position size')], 1,
        T("Le stop-loss fixe à l'avance la perte maximale acceptée sur un trade (hors gap ou slippage).", 'The stop-loss sets in advance the maximum loss accepted on a trade (excluding gaps or slippage).')),
      Q('id', T("Sur ce graphique d'une position longue, la zone rouge sous le prix d'entrée représente…", 'On this long-position chart, the red zone below the entry price represents…'),
        [T("le risque (jusqu'au stop-loss)", 'the risk (down to the stop-loss)'), T("le gain potentiel", 'the potential gain'), T("le spread", 'the spread')], 0,
        T("La zone rouge s'étend de l'entrée jusqu'au stop-loss : c'est ce que tu acceptes de perdre. La zone verte, au-dessus, montre le gain visé.", 'The red zone runs from entry to the stop-loss: it is what you accept to lose. The green zone above shows the target gain.'),
        tradeFig(110, { label: T("Graphique fictif : zone rouge sous l'entrée, zone verte au-dessus", 'Fictional chart: red zone below entry, green zone above') }))
    ]
  },
  /* ---------------- 1-4 ---------------- */
  {
    id: '1-4', dur: 9,
    t: T('Spread, levier, lot et pip', 'Spread, leverage, lot and pip'),
    intro: T("Ces quatre notions déterminent les coûts, la taille et le risque réel d'une position. Elles reviennent dans presque toutes les décisions d'un trader.",
             'These four notions determine the costs, size and real risk of a position. They come up in almost every trading decision.'),
    s: [
      { h: T('Le spread : le coût implicite', 'The spread: the hidden cost'),
        p: [T("Le **spread** est l'écart entre le Ask et le Bid. En entrant, tu paies ce spread : une position commence donc légèrement dans le rouge. Il varie selon la liquidité et l'heure.",
              'The **spread** is the gap between Ask and Bid. When you enter you pay that spread: a position therefore starts slightly negative. It varies with liquidity and time of day.'),
            T("Exemple fictif : Bid 1,0850 / Ask 1,0852 → spread de 0,0002, soit 2 pips.", 'Fictional example: Bid 1.0850 / Ask 1.0852 → spread of 0.0002, i.e. 2 pips.')] },
      { h: T('Pip et lot', 'Pip and lot'),
        p: [T("Un **pip** est l'unité usuelle de variation d'une paire de devises : 0,0001 pour EUR/USD, 0,01 pour les paires en yen.", 'A **pip** is the usual unit of movement of a currency pair: 0.0001 for EUR/USD, 0.01 for yen pairs.'),
            T("Un **lot** mesure la taille de la position : 1 lot standard = 100 000 unités de la devise de base (mini-lot = 10 000, micro-lot = 1 000).", 'A **lot** measures position size: 1 standard lot = 100,000 units of the base currency (mini lot = 10,000, micro lot = 1,000).'),
            T("Sur EUR/USD, 1 lot standard vaut environ **10 USD par pip** ; 0,1 lot, environ 1 USD par pip.", 'On EUR/USD, 1 standard lot is worth about **10 USD per pip**; 0.1 lot, about 1 USD per pip.')] },
      { h: T('Levier et marge', 'Leverage and margin'),
        p: [T("Le **levier** permet de contrôler une position plus grosse que ton capital : avec un levier de 10:1, 1 000 € contrôlent 10 000 €. La **marge** est la somme immobilisée en garantie.", '**Leverage** lets you control a position larger than your capital: with 10:1, 1,000 controls 10,000. **Margin** is the amount set aside as collateral.'),
            T("Le levier **amplifie les gains comme les pertes**. Avec 10:1, une baisse de 10 % de la position représente 100 % du capital engagé. Si les pertes dépassent la marge disponible, le courtier peut fermer les positions (appel de marge).", 'Leverage **amplifies gains and losses alike**. With 10:1, a 10% fall in the position equals 100% of the capital committed. If losses exceed available margin, the broker may close positions (margin call).')] }
    ],
    key: [
      T("Le spread est un coût payé à chaque entrée.", 'The spread is a cost paid at every entry.'),
      T("Pip = plus petite variation usuelle ; lot = taille de la position.", 'Pip = usual smallest move; lot = position size.'),
      T("Le levier amplifie gains et pertes : il augmente le risque.", 'Leverage amplifies gains and losses: it increases risk.')
    ],
    note: { k: 'warn', t: T("Plus le levier est élevé, plus une petite variation du prix peut avoir un impact important sur ton capital. Commence toujours par comprendre avant d'utiliser du levier.", 'The higher the leverage, the more a small price move can affect your capital. Always understand first before using leverage.') },
    q: [
      Q('def', T('Le spread correspond à…', 'The spread is…'),
        [T("l'écart entre le prix Ask et le prix Bid", 'the gap between the Ask and Bid prices'), T("la taille d'un lot", 'the size of a lot'), T("le prix du stop-loss", 'the stop-loss price')], 0,
        T("Le spread est la différence Ask − Bid : un coût implicite payé à l'entrée.", 'The spread is Ask − Bid: an implicit cost paid at entry.')),
      Q('mcq', T("Sur EUR/USD, avec 1 lot standard (100 000 unités), 1 pip vaut environ…", 'On EUR/USD, with 1 standard lot (100,000 units), 1 pip is worth about…'),
        ['0,10 USD', '1 USD', '10 USD', '100 USD'], 2,
        T("1 pip = 0,0001 ; 100 000 × 0,0001 = 10 USD par pip pour 1 lot standard.", '1 pip = 0.0001; 100,000 × 0.0001 = 10 USD per pip for 1 standard lot.')),
      TF(T("Le levier réduit le risque de perte.", 'Leverage reduces the risk of loss.'), false,
        T("Le levier amplifie l'effet des variations de prix : gains comme pertes. Il augmente le risque.", 'Leverage amplifies the effect of price moves: gains and losses. It increases risk.'))
    ]
  },
  /* ---------------- 1-5 ---------------- */
  {
    id: '1-5', dur: 10,
    t: T('Risque, taille de position et ratio risque/rendement', 'Risk, position sizing and risk/reward'),
    intro: T("Survivre sur les marchés passe d'abord par la gestion du risque. Cette leçon donne trois outils simples : le risque par trade, la taille de position et le ratio risque/rendement.",
             'Surviving in markets starts with risk management. This lesson gives three simple tools: risk per trade, position size and the risk/reward ratio.'),
    s: [
      { h: T('Risquer un petit pourcentage du capital', 'Risking a small percentage of capital'),
        p: [T("Avant chaque trade, on décide combien on accepte de perdre : c'est le **risque par trade**, souvent exprimé en % du capital (repère pédagogique : de 0,5 % à 2 %, à adapter à sa situation, sans que ce soit un conseil).",
              'Before each trade you decide how much you accept to lose: the **risk per trade**, often expressed as a % of capital (educational benchmark: 0.5% to 2%, to adapt to your situation, not advice).'),
            T("**Montant risqué = capital × % de risque.** Pour 5 000 € et 1 % : 50 €.", '**Amount risked = capital × risk %.** For 5,000 and 1%: 50.')] },
      { h: T('Calculer la taille de position', 'Calculating position size'),
        p: [T("**Taille = montant risqué ÷ distance jusqu'au stop.** Avec 50 € de risque, une entrée à 100 et un stop à 95 (distance 5), la taille est de 50 ÷ 5 = **10 unités**.",
              '**Size = amount risked ÷ distance to the stop.** With 50 at risk, entry at 100 and stop at 95 (distance 5), size is 50 ÷ 5 = **10 units**.'),
            T("Ainsi, si le stop est touché, la perte reste proche du montant prévu. Tu peux tester avec le calculateur de la page Outils.", 'This way, if the stop is hit, the loss stays close to the planned amount. You can test it with the calculator on the Tools page.')] },
      { h: T('Ratio risque/rendement et drawdown', 'Risk/reward and drawdown'),
        p: [T("Le **ratio risque/rendement (R/R)** compare le gain visé au risque pris : (objectif − entrée) ÷ (entrée − stop). Ici : 15 ÷ 5 = 3, soit « 3R ». Un R/R élevé ne suffit pas : il faut le lire avec le taux de réussite.", 'The **risk/reward ratio (R/R)** compares the target gain to the risk taken: (target − entry) ÷ (entry − stop). Here: 15 ÷ 5 = 3, or “3R”. A high R/R is not enough: read it together with the win rate.'),
            T("Le **drawdown** est la baisse du capital depuis un sommet. Il est asymétrique : perdre 50 % demande un gain de +100 % pour revenir à l'équilibre.", 'The **drawdown** is the fall in capital from a peak. It is asymmetric: losing 50% requires a +100% gain to get back to breakeven.')],
        ul: [T('−10 % → +11,1 % nécessaires', '−10% → +11.1% needed'), T('−20 % → +25 % nécessaires', '−20% → +25% needed'), T('−50 % → +100 % nécessaires', '−50% → +100% needed')],
        fig: tradeFig(115, { zTp: T('Gain visé : 15', 'Target gain: 15'), zSl: T('Risque : 5', 'Risk: 5'), lEntry: T('Entrée', 'Entry'),
                             cap: T("Risque 5, gain visé 15 : ratio risque/rendement de 3 (3R).", 'Risk 5, target gain 15: risk/reward ratio of 3 (3R).'),
                             label: T("Graphique fictif illustrant un ratio risque/rendement de 3", 'Fictional chart illustrating a risk/reward ratio of 3') }) }
    ],
    key: [
      T("Montant risqué = capital × % de risque.", 'Amount risked = capital × risk %.'),
      T("Taille de position = montant risqué ÷ distance au stop.", 'Position size = amount risked ÷ distance to stop.'),
      T("R/R = gain visé ÷ risque pris, à lire avec le taux de réussite.", 'R/R = target gain ÷ risk taken, to read with the win rate.'),
      T("Un gros drawdown est très difficile à récupérer : protège ton capital.", 'A deep drawdown is very hard to recover: protect your capital.')
    ],
    note: { k: 'tip', t: T("Teste les calculs de cette leçon avec les calculateurs de la page Outils.", 'Test this lesson\'s calculations with the calculators on the Tools page.') },
    q: [
      Q('comp', T("Capital 2 000, risque 1 %, entrée à 50, stop à 48. Quelle taille de position (en unités) ?", 'Capital 2,000, risk 1%, entry at 50, stop at 48. What position size (in units)?'),
        ['5', '10', '20', '40'], 1,
        T("Risque = 2 000 × 1 % = 20. Distance au stop = 50 − 48 = 2. Taille = 20 ÷ 2 = 10 unités.", 'Risk = 2,000 × 1% = 20. Distance to stop = 50 − 48 = 2. Size = 20 ÷ 2 = 10 units.')),
      Q('comp', T("Entrée 100, stop 95, objectif 115 : quel est le ratio risque/rendement ?", 'Entry 100, stop 95, target 115: what is the risk/reward ratio?'),
        ['1:1', '2:1', '3:1', '1:3'], 2,
        T("Gain visé = 15, risque = 5, donc R/R = 15 ÷ 5 = 3 (« 3R »).", 'Target gain = 15, risk = 5, so R/R = 15 ÷ 5 = 3 (“3R”).')),
      Q('mcq', T("Après un drawdown de 50 %, quel gain faut-il pour revenir au capital de départ ?", 'After a 50% drawdown, what gain is needed to get back to the starting capital?'),
        ['+25 %', '+50 %', '+100 %', '+150 %'], 2,
        T("De 100 tombé à 50, il faut doubler (+100 %) pour revenir à 100.", 'From 100 down to 50, you must double (+100%) to get back to 100.'))
    ]
  }
  ]
},
/* ------------------------------------------------------------------ */
{
  id: 2, ic: 'chart', lvl: 2, prem: false,
  t: T('Lire un graphique', 'Reading a chart'),
  d: T("Bougies, tendances, supports, résistances, cassures : apprends à lire un graphique et à décrire ce que fait le prix.",
       'Candles, trends, support, resistance, breakouts: learn to read a chart and describe what price is doing.'),
  lessons: [
  /* ---------------- 2-1 ---------------- */
  {
    id: '2-1', dur: 7,
    t: T('Les bougies japonaises', 'Japanese candlesticks'),
    intro: T("Une bougie résume ce qu'a fait le prix pendant une période : ouverture, plus haut, plus bas et clôture. C'est la brique de base de la plupart des graphiques.",
             'A candle summarises what price did during a period: open, high, low and close. It is the building block of most charts.'),
    s: [
      { h: T("Anatomie d'une bougie", 'Anatomy of a candle'),
        p: [T("Le **corps** relie l'ouverture à la clôture. Les **mèches** (ou ombres) montrent les extrêmes atteints : le plus haut (mèche haute) et le plus bas (mèche basse).", 'The **body** links the open to the close. The **wicks** (or shadows) show the extremes reached: the high (upper wick) and the low (lower wick).'),
            T("Une bougie **haussière** clôture au-dessus de son ouverture ; une bougie **baissière** clôture en dessous.", 'A **bullish** candle closes above its open; a **bearish** candle closes below.')],
        fig: { k: 'anatomy', cap: T('Bougie haussière (à gauche) et baissière (à droite).', 'Bullish (left) and bearish (right) candle.') } },
      { h: T('Que racontent le corps et les mèches ?', 'What do the body and wicks tell?'),
        p: [T("Un grand corps montre une pression nette d'un camp. Une longue mèche montre que le prix est allé loin avant d'être **rejeté**. Une longue mèche basse signale par exemple que les vendeurs n'ont pas réussi à maintenir le prix bas sur la période.", 'A large body shows clear pressure from one side. A long wick shows price went far before being **rejected**. A long lower wick, for example, shows sellers could not keep price low during the period.'),
            T("Ce sont des indices de contexte, jamais des certitudes : une même bougie n'a pas la même valeur en tendance, en range ou près d'un niveau important.", 'These are contextual clues, never certainties: the same candle does not mean the same thing in a trend, a range or near an important level.')] },
      { h: T('Le rôle du timeframe', 'The role of the timeframe'),
        p: [T("Le **timeframe** (unité de temps) définit la durée d'une bougie : 5 minutes, 1 heure, 1 jour… Un même marché peut sembler haussier sur un graphique journalier et baissier sur un graphique de 5 minutes.", 'The **timeframe** sets the duration of a candle: 5 minutes, 1 hour, 1 day… The same market can look bullish on a daily chart and bearish on a 5-minute chart.')] }
    ],
    key: [
      T("Une bougie = ouverture, plus haut, plus bas, clôture.", 'A candle = open, high, low, close.'),
      T("Haussière : clôture > ouverture ; baissière : clôture < ouverture.", 'Bullish: close > open; bearish: close < open.'),
      T("Les mèches montrent les zones où le prix a été rejeté.", 'Wicks show the zones where price was rejected.'),
      T("Une bougie se lit toujours dans son contexte.", 'A candle is always read in context.')
    ],
    note: { k: 'info', t: T("Sur la plupart des plateformes, vert = haussier et rouge = baissier, mais les couleurs sont configurables. Vérifie toujours la convention utilisée.", 'On most platforms, green = bullish and red = bearish, but colours are configurable. Always check the convention used.') },
    q: [
      Q('mcq', T("Une bougie haussière signifie que…", 'A bullish candle means that…'),
        [T("la clôture est au-dessus de l'ouverture", 'the close is above the open'), T("la clôture est sous l'ouverture", 'the close is below the open'), T("le volume est élevé", 'volume is high')], 0,
        T("Haussière = le prix a clôturé plus haut qu'il n'a ouvert sur la période.", 'Bullish = price closed higher than it opened over the period.')),
      TF(T("Une mèche représente une zone où le prix a évolué pendant la période sans y clôturer.", 'A wick represents an area where price traded during the period without closing there.'), true,
        T("La mèche montre les extrêmes atteints avant que le prix ne revienne vers le corps.", 'The wick shows the extremes reached before price came back toward the body.')),
      Q('id', T("Cette bougie a une longue mèche basse et un petit corps en haut. Que suggère-t-elle, dans le contexte ?", 'This candle has a long lower wick and a small body at the top. What does it suggest, in context?'),
        [T("Un rejet des prix bas pendant la période", 'A rejection of low prices during the period'), T("Une hausse garantie dès la bougie suivante", 'A guaranteed rise on the next candle'), T("Un marché fermé", 'A closed market')], 0,
        T("La longue mèche basse montre que les acheteurs ont repoussé les prix bas. C'est un indice, pas une garantie : le contexte compte.", 'The long lower wick shows buyers pushed back low prices. It is a clue, not a guarantee: context matters.'),
        { k: 'candle', o: 108, h: 111, l: 96, c: 110, label: T("Bougie fictive avec longue mèche basse", 'Fictional candle with long lower wick') })
    ]
  },
  /* ---------------- 2-2 ---------------- */
  {
    id: '2-2', dur: 8,
    t: T('Tendance, range et structure de marché', 'Trend, range and market structure'),
    intro: T("Avant de chercher un signal, on identifie l'état du marché : tendance haussière, tendance baissière ou range. La structure des hauts et des bas est l'outil le plus simple pour cela.",
             'Before looking for a signal, identify the state of the market: uptrend, downtrend or range. The structure of highs and lows is the simplest tool for it.'),
    s: [
      { h: T('Tendance haussière : hauts et bas de plus en plus hauts', 'Uptrend: higher highs and higher lows'),
        p: [T("Un marché est en **tendance haussière** quand il enchaîne des sommets plus hauts (**HH**) et des creux plus hauts (**HL**). Les reculs sont achetés plus haut que les précédents.", 'A market is in an **uptrend** when it makes higher highs (**HH**) and higher lows (**HL**). Pullbacks are bought higher than the previous ones.')],
        fig: { closes: SER.up, h: 180,
               marks: [{ i: 14, s: 'h', t: 'HH', cls: 'up' }, { i: 20, s: 'h', t: 'HH', cls: 'up' }, { i: 26, s: 'h', t: 'HH', cls: 'up' }, { i: 32, s: 'h', t: 'HH', cls: 'up' },
                       { i: 11, s: 'l', t: 'HL', cls: 'up' }, { i: 17, s: 'l', t: 'HL', cls: 'up' }, { i: 23, s: 'l', t: 'HL', cls: 'up' }, { i: 29, s: 'l', t: 'HL', cls: 'up' }],
               cap: T('Tendance haussière : HH (plus haut plus haut) et HL (plus bas plus haut).', 'Uptrend: HH (higher high) and HL (higher low).'),
               label: T('Graphique fictif de tendance haussière', 'Fictional uptrend chart') } },
      { h: T('Tendance baissière et range', 'Downtrend and range'),
        p: [T("En **tendance baissière**, le prix enchaîne des sommets plus bas (**LH**) et des creux plus bas (**LL**). Dans un **range**, il oscille entre un niveau haut et un niveau bas sans direction claire.", 'In a **downtrend**, price makes lower highs (**LH**) and lower lows (**LL**). In a **range**, it oscillates between a high level and a low level with no clear direction.')],
        fig: { closes: SER.range, h: 170,
               zones: [{ p1: 119, p2: 121, cls: 'rg' }, { p1: 99, p2: 101, cls: 'rg' }],
               lines: [{ y: 120, cls: 'res', label: T('Haut du range', 'Range high') }, { y: 100, cls: 'sup', label: T('Bas du range', 'Range low'), side: 'l' }],
               cap: T('Range : le prix rebondit entre un haut et un bas.', 'Range: price bounces between a high and a low.'),
               label: T('Graphique fictif de range', 'Fictional range chart') } },
      { h: T('Pourquoi la structure est-elle utile ?', 'Why is structure useful?'),
        p: [T("Elle donne un cadre : on cherche plutôt des opportunités dans le sens de la tendance, ou on adapte sa méthode quand le marché est en range. Une tendance est **invalidée** lorsque la structure est cassée (par exemple, un creux plus haut est perdu).", 'It gives a framework: you look mostly for opportunities in the direction of the trend, or adapt your method when the market ranges. A trend is **invalidated** when structure breaks (for example, a higher low is lost).')] }
    ],
    key: [
      T("Hausse : HH + HL. Baisse : LH + LL. Range : oscillation entre deux niveaux.", 'Up: HH + HL. Down: LH + LL. Range: oscillation between two levels.'),
      T("La structure décrit le marché, elle ne prédit pas.", 'Structure describes the market, it does not predict.'),
      T("La structure change : une tendance peut s'inverser ou devenir un range.", 'Structure changes: a trend can reverse or become a range.')
    ],
    note: null,
    q: [
      Q('id', T("Ce graphique montre plutôt…", 'This chart mostly shows…'),
        [T("une tendance haussière", 'an uptrend'), T("une tendance baissière", 'a downtrend'), T("un range", 'a range')], 0,
        T("Les sommets et les creux sont de plus en plus hauts : c'est la signature d'une tendance haussière.", 'Highs and lows keep getting higher: the signature of an uptrend.'),
        { closes: SER.up, h: 160, label: T('Graphique fictif à identifier', 'Fictional chart to identify') }),
      Q('def', T("Une tendance haussière se définit par…", 'An uptrend is defined by…'),
        [T("des sommets et des creux de plus en plus hauts", 'higher highs and higher lows'), T("des bougies uniquement vertes", 'only green candles'), T("un volume toujours croissant", 'ever-increasing volume')], 0,
        T("C'est la succession de HH et de HL qui définit la tendance, pas la couleur des bougies.", 'It is the succession of HH and HL that defines the trend, not candle colour.')),
      TF(T("Un range correspond à un marché qui oscille entre un niveau haut et un niveau bas.", 'A range is a market oscillating between a high level and a low level.'), true,
        T("Dans un range, le prix rebondit entre deux bornes, sans nouvelle tendance claire.", 'In a range, price bounces between two boundaries with no clear new trend.'))
    ]
  },
  /* ---------------- 2-3 ---------------- */
  {
    id: '2-3', dur: 8,
    t: T('Support et résistance', 'Support and resistance'),
    intro: T("Les supports et les résistances sont des zones où le prix a réagi dans le passé. Ils servent de repères pour lire le marché, placer un stop ou définir un objectif.",
             'Support and resistance are areas where price reacted in the past. They serve as reference points to read the market, place a stop or set a target.'),
    s: [
      { h: T('Définitions', 'Definitions'),
        p: [T("Un **support** est une zone où les acheteurs sont intervenus et ont fait rebondir le prix. Une **résistance** est une zone où les vendeurs ont fait reculer le prix.", 'A **support** is an area where buyers stepped in and made price bounce. A **resistance** is an area where sellers pushed price back.')],
        fig: { closes: SER.bounce, h: 170,
               zones: [{ p1: 99, p2: 101.5, cls: 'up' }, { p1: 114.5, p2: 116.5, cls: 'dn' }],
               lines: [{ y: 100, cls: 'sup', label: T('Support', 'Support'), side: 'l' }, { y: 115.5, cls: 'res', label: T('Résistance', 'Resistance') }],
               cap: T('Le prix rebondit plusieurs fois sur la même zone de support.', 'Price bounces several times off the same support zone.'),
               label: T('Graphique fictif avec support et résistance', 'Fictional chart with support and resistance') } },
      { h: T('Des zones, pas des lignes exactes', 'Zones, not exact lines'),
        p: [T("Le prix respecte rarement un niveau au tick près. On trace donc des **zones** (une bande de prix) plutôt qu'une ligne trop précise. Plus un niveau a été testé et respecté, plus il est visible pour les autres traders, mais **rien ne garantit qu'il tiendra**.", 'Price rarely respects a level to the exact tick. So you draw **zones** (a price band) rather than an overly precise line. The more a level was tested and respected, the more visible it is to others, but **nothing guarantees it will hold**.')] },
      { h: T('Inversion de rôle', 'Role reversal'),
        p: [T("Quand un support est cassé de façon nette, il devient souvent une zone de résistance lors d'un retour du prix (et inversement). Cette idée d'**inversion de rôle** est très utilisée, mais elle reste une probabilité, pas une règle absolue.", 'When a support is clearly broken, it often becomes a resistance zone when price comes back (and vice versa). This idea of **role reversal** is widely used, but remains a probability, not an absolute rule.')] }
    ],
    key: [
      T("Support : zone de rebond. Résistance : zone de rejet.", 'Support: bounce zone. Resistance: rejection zone.'),
      T("On trace des zones, pas des lignes au tick près.", 'Draw zones, not tick-precise lines.'),
      T("Un niveau cassé peut changer de rôle.", 'A broken level may change roles.'),
      T("Un niveau testé n'est pas un niveau garanti.", 'A tested level is not a guaranteed level.')
    ],
    note: { k: 'warn', t: T("Plus un niveau est testé, plus il peut aussi s'affaiblir. Ne le considère jamais comme une certitude.", 'The more a level is tested, the weaker it can also become. Never treat it as a certainty.') },
    q: [
      Q('mcq', T("Un support est…", 'A support is…'),
        [T("une zone où les acheteurs ont fait rebondir le prix", 'an area where buyers made price bounce'), T("une zone où les vendeurs ont fait reculer le prix", 'an area where sellers pushed price back'), T("un indicateur calculé", 'a calculated indicator')], 0,
        T("Le support est un plancher où la demande a déjà réagi.", 'Support is a floor where demand already reacted.')),
      TF(T("Un niveau testé plusieurs fois est certain de tenir la prochaine fois.", 'A level tested several times is certain to hold next time.'), false,
        T("Aucun niveau n'est certain. Les tests répétés peuvent même l'affaiblir : c'est pourquoi on prévoit toujours une invalidation.", 'No level is certain. Repeated tests can even weaken it: that is why you always plan an invalidation.')),
      Q('comp', T("Lorsqu'un support est cassé nettement, il peut devenir…", 'When a support is clearly broken, it can become…'),
        [T("une résistance", 'a resistance'), T("un indicateur", 'an indicator'), T("un spread", 'a spread')], 0,
        T("C'est l'inversion de rôle : l'ancienne zone de rebond devient une zone de rejet potentielle.", 'This is role reversal: the old bounce zone becomes a potential rejection zone.'))
    ]
  },
  /* ---------------- 2-4 ---------------- */
  {
    id: '2-4', dur: 9,
    t: T('Breakout, pullback et volume', 'Breakout, pullback and volume'),
    intro: T("Quand le prix franchit un niveau important, deux scénarios se présentent : la cassure tient ou elle échoue. On apprend ici à décrire ces mouvements et à les confirmer.",
             'When price crosses an important level, two scenarios follow: the break holds or it fails. Here you learn to describe those moves and confirm them.'),
    s: [
      { h: T('Breakout et pullback', 'Breakout and pullback'),
        p: [T("Un **breakout** (cassure) survient quand le prix franchit nettement un support ou une résistance. Un **pullback** (ou retest) est le retour du prix vers le niveau cassé avant, éventuellement, de repartir dans le sens de la cassure.", 'A **breakout** happens when price clearly crosses a support or resistance. A **pullback** (or retest) is price returning to the broken level before possibly continuing in the breakout direction.')],
        fig: { closes: SER.brk, h: 180,
               zones: [{ p1: 109, p2: 111, cls: 'rg' }],
               lines: [{ y: 110, cls: 'res', label: T('Ancienne résistance', 'Former resistance'), side: 'l' }],
               marks: [{ i: 17, s: 'h', t: T('Cassure', 'Breakout'), cls: 'up' }, { i: 22, s: 'l', t: 'Pullback', cls: 'n' }],
               cap: T("Cassure d'une résistance, puis retour test sur la zone cassée.", 'Breakout of a resistance, then a retest of the broken zone.'),
               label: T('Graphique fictif de cassure et pullback', 'Fictional breakout and pullback chart') } },
      { h: T('Faux breakout (fakeout)', 'False breakout (fakeout)'),
        p: [T("Toutes les cassures ne réussissent pas. Dans un **fakeout**, le prix dépasse un niveau puis y revient rapidement, piégeant ceux qui sont entrés trop tôt. C'est pourquoi beaucoup de traders attendent une **clôture** au-delà du niveau, voire un retest, avant de valider le scénario.", 'Not all breakouts succeed. In a **fakeout**, price exceeds a level then quickly comes back, trapping those who entered too early. That is why many traders wait for a **close** beyond the level, or even a retest, before validating the scenario.')] },
      { h: T('Le rôle du volume', 'The role of volume'),
        p: [T("Le **volume** mesure l'activité échangée. Une cassure accompagnée d'un volume supérieur à la normale est souvent jugée plus solide qu'une cassure sur faible volume. Attention : sur certains marchés (Forex spot notamment), le volume est fragmenté et moins fiable.", '**Volume** measures traded activity. A breakout with above-normal volume is often judged more solid than one on low volume. Careful: on some markets (spot Forex especially) volume is fragmented and less reliable.')] }
    ],
    key: [
      T("Breakout : franchissement net d'un niveau. Pullback : retour tester ce niveau.", 'Breakout: clear crossing of a level. Pullback: return to test that level.'),
      T("Un fakeout est une cassure qui échoue : la confirmation aide à s'en protéger.", 'A fakeout is a failed breakout: confirmation helps protect against it.'),
      T("Le volume est un indice de conviction, pas une garantie.", 'Volume is a hint of conviction, not a guarantee.')
    ],
    note: null,
    q: [
      Q('def', T("Un pullback est…", 'A pullback is…'),
        [T("le retour du prix vers un niveau cassé", 'price returning to a broken level'), T("une cassure sans retour", 'a breakout with no return'), T("un type d'ordre", 'an order type')], 0,
        T("Le pullback est un retest du niveau franchi, avant une éventuelle poursuite.", 'The pullback is a retest of the crossed level before a possible continuation.')),
      Q('comp', T("Quel comportement décrit un « fakeout » ?", 'Which behaviour describes a “fakeout”?'),
        [T("Le prix dépasse un niveau puis revient rapidement dessous", 'Price exceeds a level then quickly returns under it'), T("Le prix monte sans jamais reculer", 'Price rises without ever pulling back'), T("Le spread devient nul", 'The spread becomes zero')], 0,
        T("Une fausse cassure piège ceux qui entrent trop tôt : attendre une confirmation réduit ce risque (sans l'éliminer).", 'A false break traps those entering too early: waiting for confirmation reduces that risk (without eliminating it).')),
      TF(T("Une cassure sur fort volume est garantie de continuer.", 'A breakout on strong volume is guaranteed to continue.'), false,
        T("Le volume est un indice de conviction, jamais une garantie.", 'Volume is a hint of conviction, never a guarantee.'))
    ]
  },
  /* ---------------- 2-5 ---------------- */
  {
    id: '2-5', dur: 8,
    t: T('Indicateurs et price action', 'Indicators and price action'),
    intro: T("Les indicateurs transforment le prix en nouvelles courbes. La price action, elle, lit directement les bougies et la structure. Les deux approches peuvent se compléter.",
             'Indicators turn price into new curves. Price action reads candles and structure directly. The two approaches can complement each other.'),
    s: [
      { h: T("Qu'est-ce qu'un indicateur ?", 'What is an indicator?'),
        p: [T("Un indicateur est un calcul appliqué aux prix (et parfois au volume). La **moyenne mobile** lisse les prix pour mieux voir la direction. Le **RSI** mesure la vitesse et l'ampleur des mouvements récents (momentum). Le **MACD** compare deux moyennes mobiles.", 'An indicator is a calculation applied to prices (and sometimes volume). The **moving average** smooths prices to show direction. The **RSI** measures the speed and size of recent moves (momentum). The **MACD** compares two moving averages.')],
        fig: { closes: SER.ma, ma: 8, h: 170, cap: T('Une moyenne mobile (ligne ambre) lisse le prix : elle réagit avec du retard.', 'A moving average (amber line) smooths price: it reacts with a delay.'), label: T('Graphique fictif avec moyenne mobile', 'Fictional chart with moving average') } },
      { h: T('Des indicateurs en retard', 'Lagging indicators'),
        p: [T("La plupart des indicateurs sont **calculés à partir du passé** : ils confirment plus qu'ils ne préviennent. Empiler dix indicateurs n'apporte pas plus de certitude : ils disent souvent la même chose sous des formes différentes.", 'Most indicators are **calculated from the past**: they confirm more than they anticipate. Stacking ten indicators does not add certainty: they often say the same thing in different forms.')] },
      { h: T('La price action', 'Price action'),
        p: [T("La **price action** consiste à lire directement les bougies, la structure, les supports et les résistances. Un bon point de départ : un graphique épuré, un ou deux indicateurs choisis pour une raison précise, et des règles écrites.", '**Price action** means reading candles, structure, support and resistance directly. A good starting point: a clean chart, one or two indicators chosen for a specific reason, and written rules.')] }
    ],
    key: [
      T("Un indicateur est un calcul sur le prix : il est en retard par nature.", 'An indicator is a calculation on price: it lags by nature.'),
      T("Moyenne mobile = direction ; RSI = momentum.", 'Moving average = direction; RSI = momentum.'),
      T("Plus d'indicateurs ne signifie pas plus de fiabilité.", 'More indicators does not mean more reliability.'),
      T("Un graphique simple + des règles claires valent mieux qu'un graphique surchargé.", 'A simple chart plus clear rules beats a cluttered chart.')
    ],
    note: null,
    q: [
      Q('mcq', T("Une moyenne mobile est un indicateur…", 'A moving average is an indicator that is…'),
        [T("qui lisse le prix et réagit avec retard", 'smoothing price and reacting with a delay'), T("qui prédit avec certitude les tops", 'that predicts tops with certainty'), T("qui remplace le stop-loss", 'that replaces the stop-loss')], 0,
        T("Calculée à partir des prix passés, elle lisse le mouvement mais réagit avec du retard.", 'Calculated from past prices, it smooths the move but reacts with a delay.')),
      TF(T("Ajouter beaucoup d'indicateurs augmente forcément la fiabilité d'une analyse.", 'Adding many indicators necessarily increases the reliability of an analysis.'), false,
        T("Les indicateurs sont souvent redondants : trop d'informations créent de la confusion, pas de la certitude.", 'Indicators are often redundant: too much information creates confusion, not certainty.')),
      Q('def', T("Le RSI mesure…", 'The RSI measures…'),
        [T("la vitesse et l'ampleur des mouvements récents (momentum)", 'the speed and size of recent moves (momentum)'), T("le spread moyen", 'the average spread'), T("la taille du lot", 'the lot size')], 0,
        T("Le RSI est un oscillateur de momentum : il compare les hausses et les baisses récentes.", 'The RSI is a momentum oscillator: it compares recent gains and losses.'))
    ]
  }
  ]
},
/* ------------------------------------------------------------------ */
{
  id: 3, ic: 'layers', lvl: 3, prem: false,
  t: T('Patterns graphiques', 'Chart patterns'),
  d: T("Double top, épaule-tête-épaule, triangles, flags… : reconnaître les figures, leur contexte et leurs limites.",
       'Double top, head & shoulders, triangles, flags…: recognise the figures, their context and their limits.'),
  lessons: [
  /* ---------------- 3-1 ---------------- */
  {
    id: '3-1', dur: 7,
    t: T('Principes : contexte, confirmation, invalidation', 'Principles: context, confirmation, invalidation'),
    intro: T("Un pattern est une figure récurrente formée par le prix. Il aide à décrire un rapport de forces entre acheteurs et vendeurs, mais il ne prédit jamais l'avenir avec certitude.",
             'A pattern is a recurring figure formed by price. It helps describe the balance of power between buyers and sellers, but never predicts the future with certainty.'),
    s: [
      { h: T("Qu'est-ce qu'un pattern ?", 'What is a pattern?'),
        p: [T("Un **pattern** graphique est une configuration de sommets, de creux et de lignes que l'on retrouve régulièrement. On distingue les patterns de **retournement** (la tendance pourrait s'inverser), de **continuation** (la tendance pourrait reprendre) et de **cassure**.", 'A chart **pattern** is a configuration of highs, lows and lines that recurs regularly. We distinguish **reversal** patterns (the trend might reverse), **continuation** patterns (the trend might resume) and **breakout** patterns.')],
        fig: { k: 'pat', id: 'double-top', cap: T('Exemple schématique : un double top avec sa ligne de cou.', 'Schematic example: a double top with its neckline.') } },
      { h: T('Le contexte avant tout', 'Context first'),
        p: [T("Un même dessin n'a pas la même valeur partout. On regarde la **tendance précédente**, la présence d'un **niveau important**, le **timeframe** et la qualité des mouvements. Un double top n'a de sens que s'il apparaît après une hausse, par exemple.", 'The same shape is not worth the same everywhere. Look at the **previous trend**, the presence of an **important level**, the **timeframe** and the quality of moves. A double top only makes sense after a rise, for example.')] },
      { h: T('Confirmation et invalidation', 'Confirmation and invalidation'),
        p: [T("Le pattern est **confirmé** lorsque le prix casse la ligne clé (souvent appelée ligne de cou). Il est **invalidé** lorsque le prix casse dans l'autre sens ou dépasse le point qui contredit le scénario. Cette invalidation sert souvent à placer le stop-loss.", 'The pattern is **confirmed** when price breaks the key line (often called the neckline). It is **invalidated** when price breaks the other way or passes the point that contradicts the scenario. That invalidation often guides stop-loss placement.'),
            T("Beaucoup de traders estiment un objectif à partir de la hauteur du pattern : c'est une **estimation**, pas une garantie.", 'Many traders estimate a target from the height of the pattern: this is an **estimate**, not a guarantee.')] }
    ],
    key: [
      T("Un pattern décrit un rapport de forces, il ne prédit pas.", 'A pattern describes a balance of power, it does not predict.'),
      T("Contexte : tendance précédente, niveaux, timeframe.", 'Context: previous trend, levels, timeframe.'),
      T("Confirmation = cassure de la ligne clé ; invalidation = scénario contredit.", 'Confirmation = break of the key line; invalidation = scenario contradicted.')
    ],
    note: { k: 'warn', t: T("Aucun pattern n'est une garantie de résultat. Un pattern « parfait » peut échouer ; c'est pourquoi le risque se gère toujours.", 'No pattern guarantees a result. A “perfect” pattern can fail; that is why risk is always managed.') },
    q: [
      Q('def', T('Un pattern graphique est…', 'A chart pattern is…'),
        [T("une configuration récurrente du prix qui aide à lire le rapport de forces", 'a recurring price configuration that helps read the balance of power'), T("un signal d'achat garanti", 'a guaranteed buy signal'), T("un type de courtier", 'a type of broker')], 0,
        T("C'est un outil de lecture, pas une prédiction.", 'It is a reading tool, not a prediction.')),
      TF(T("Un pattern confirmé donne un résultat garanti.", 'A confirmed pattern gives a guaranteed result.'), false,
        T("Même confirmé, un pattern peut échouer. Le stop-loss et la taille de position existent pour cela.", 'Even when confirmed, a pattern can fail. The stop-loss and position size exist for that.')),
      Q('comp', T("Qu'est-ce qui rend un pattern plus exploitable ?", 'What makes a pattern more usable?'),
        [T("Un bon contexte, une confirmation et une invalidation claire", 'A good context, a confirmation and a clear invalidation'), T("Le fait qu'il soit joli", 'The fact that it looks nice'), T("Le nombre d'indicateurs affichés", 'The number of indicators displayed')], 0,
        T("Contexte + confirmation + invalidation transforment une figure en scénario testable.", 'Context + confirmation + invalidation turn a figure into a testable scenario.'))
    ]
  },
  /* ---------------- 3-2 ---------------- */
  {
    id: '3-2', dur: 9,
    t: T('Patterns de retournement', 'Reversal patterns'),
    intro: T("Double top, double bottom, épaule-tête-épaule et sa version inversée : quatre figures qui décrivent l'essoufflement d'une tendance.",
             'Double top, double bottom, head & shoulders and its inverse: four figures describing a trend running out of steam.'),
    s: [
      { h: T('Double top et double bottom', 'Double top and double bottom'),
        p: [T("Un **double top** apparaît après une hausse : le prix atteint deux fois un même niveau sans réussir à le franchir, puis casse le creux intermédiaire (la **ligne de cou**). Le **double bottom** en est le miroir, après une baisse.", 'A **double top** appears after a rise: price reaches the same level twice without breaking it, then breaks the middle low (the **neckline**). The **double bottom** is its mirror, after a fall.')],
        fig: { k: 'pat', id: 'double-bottom', cap: T('Double bottom : deux creux proches, puis cassure de la ligne de cou.', 'Double bottom: two nearby lows, then a break of the neckline.') } },
      { h: T('Épaule-tête-épaule (H&S)', 'Head & shoulders (H&S)'),
        p: [T("Le **Head & Shoulders** comporte trois sommets : une épaule gauche, une tête plus haute, une épaule droite. La ligne de cou relie les deux creux. Sa cassure valide la figure. La version **inversée** apparaît après une baisse.", 'The **Head & Shoulders** has three peaks: a left shoulder, a higher head, a right shoulder. The neckline links the two lows. Its break validates the figure. The **inverse** version appears after a fall.')],
        fig: { k: 'pat', id: 'head-shoulders', cap: T('Head & Shoulders avec sa ligne de cou.', 'Head & Shoulders with its neckline.') } },
      { h: T('Ce qu\'il faut vérifier', 'What to check'),
        ul: [T("Une **tendance préalable** existe (sinon, il n'y a rien à retourner).", 'There is a **prior trend** (otherwise there is nothing to reverse).'),
             T("La ligne de cou est **cassée** (idéalement sur clôture), pas seulement approchée.", 'The neckline is **broken** (ideally on a close), not only approached.'),
             T("L'invalidation est claire : au-delà du sommet (ou du creux) de la figure.", 'The invalidation is clear: beyond the top (or bottom) of the figure.'),
             T("Un pattern peut échouer et devenir une simple continuation de tendance.", 'A pattern can fail and become a simple trend continuation.')] }
    ],
    key: [
      T("Ces figures décrivent un possible essoufflement, pas un retournement certain.", 'These figures describe possible exhaustion, not a certain reversal.'),
      T("La ligne de cou est le niveau de confirmation.", 'The neckline is the confirmation level.'),
      T("Le double top suit une hausse ; le double bottom suit une baisse.", 'The double top follows a rise; the double bottom follows a fall.')
    ],
    note: null,
    q: [
      Q('id', T("Quelle figure voit-on ici ?", 'Which figure is shown here?'),
        [T('Double top', 'Double top'), T('Double bottom', 'Double bottom'), 'Head & Shoulders'], 1,
        T("Deux creux à peu près au même niveau, séparés par un rebond : c'est un double bottom.", 'Two lows at about the same level separated by a bounce: a double bottom.'),
        { k: 'pat', id: 'double-bottom', labels: false, label: T('Figure fictive à identifier', 'Fictional figure to identify') }),
      Q('mcq', T("Quand une figure « tête-épaules » est-elle généralement considérée comme confirmée ?", 'When is a “head & shoulders” figure generally considered confirmed?'),
        [T("Quand la ligne de cou est cassée", 'When the neckline is broken'), T("Dès que l'épaule gauche apparaît", 'As soon as the left shoulder appears'), T("Quand le volume est nul", 'When volume is zero')], 0,
        T("La cassure de la ligne de cou valide la figure ; avant cela, ce n'est qu'un scénario possible.", 'The neckline break validates the figure; before that it is only a possible scenario.')),
      TF(T("Un double top se forme normalement après une tendance baissière.", 'A double top normally forms after a downtrend.'), false,
        T("Le double top suit une hausse : le prix échoue deux fois sur un même sommet.", 'The double top follows a rise: price fails twice at the same peak.'))
    ]
  },
  /* ---------------- 3-3 ---------------- */
  {
    id: '3-3', dur: 9,
    t: T('Patterns de continuation', 'Continuation patterns'),
    intro: T("Triangles, flags, pennants et wedges décrivent des pauses ou des compressions. Selon la sortie, la tendance précédente reprend ou s'inverse.",
             'Triangles, flags, pennants and wedges describe pauses or compressions. Depending on the exit, the previous trend resumes or reverses.'),
    s: [
      { h: T('Les triangles', 'Triangles'),
        p: [T("Dans un **triangle ascendant**, la résistance est plate et les creux montent. Dans un **triangle descendant**, le support est plat et les sommets baissent. Dans un **triangle symétrique**, sommets et creux convergent. La sortie du triangle donne la direction, pas la forme seule.", 'In an **ascending triangle**, resistance is flat and lows rise. In a **descending triangle**, support is flat and highs fall. In a **symmetrical triangle**, highs and lows converge. The exit gives the direction, not the shape alone.')],
        fig: { k: 'pat', id: 'asc-triangle', cap: T('Triangle ascendant : résistance plate, creux de plus en plus hauts.', 'Ascending triangle: flat resistance, higher and higher lows.') } },
      { h: T('Flag et pennant', 'Flag and pennant'),
        p: [T("Après un mouvement impulsif (le **mât**), le prix consolide brièvement. Dans un **flag**, la consolidation forme un petit canal légèrement incliné contre la tendance ; dans un **pennant**, elle forme un petit triangle. On surveille la sortie de la consolidation.", 'After an impulsive move (the **pole**), price consolidates briefly. In a **flag**, the consolidation forms a small channel slightly against the trend; in a **pennant**, a small triangle. Watch the exit of the consolidation.')],
        fig: { k: 'pat', id: 'flag', cap: T('Flag haussier : mât, petit canal descendant, sortie par le haut.', 'Bull flag: pole, small downward channel, exit to the upside.') } },
      { h: T('Le wedge (biseau)', 'The wedge'),
        p: [T("Dans un **wedge**, les deux lignes montent (ou descendent) ensemble en convergeant. Un wedge montant est souvent lu comme un signe d'essoufflement de la hausse, un wedge descendant comme un essoufflement de la baisse. Là encore : contexte et confirmation d'abord.", 'In a **wedge**, both lines rise (or fall) together while converging. A rising wedge is often read as exhaustion of the rise, a falling wedge as exhaustion of the fall. Again: context and confirmation first.')],
        fig: { k: 'pat', id: 'wedge', cap: T('Wedge montant : lignes convergentes orientées vers le haut.', 'Rising wedge: converging lines pointing upward.') } }
    ],
    key: [
      T("Triangle : compression des prix ; la sortie donne la direction.", 'Triangle: price compression; the exit gives the direction.'),
      T("Flag / pennant : pause courte après un mouvement fort.", 'Flag / pennant: short pause after a strong move.'),
      T("Wedge : deux lignes convergentes dans le même sens.", 'Wedge: two converging lines in the same direction.')
    ],
    note: null,
    q: [
      Q('mcq', T("Un triangle ascendant se caractérise par…", 'An ascending triangle is characterised by…'),
        [T("une résistance plate et des creux de plus en plus hauts", 'flat resistance and higher and higher lows'), T("un support plat et des sommets de plus en plus bas", 'flat support and lower and lower highs'), T("deux lignes parallèles", 'two parallel lines')], 0,
        T("Les acheteurs remontent leurs prix d'achat sous une résistance qui reste horizontale.", 'Buyers raise their buying prices under a resistance that stays horizontal.')),
      Q('id', T("Quelle figure voit-on ici ?", 'Which figure is shown here?'),
        [T('Flag', 'Flag'), T('Triangle descendant', 'Descending triangle'), T('Double top', 'Double top')], 0,
        T("Un fort mouvement (le mât) suivi d'une petite consolidation inclinée : c'est un flag.", 'A strong move (the pole) followed by a small sloped consolidation: a flag.'),
        { k: 'pat', id: 'flag', labels: false, label: T('Figure fictive à identifier', 'Fictional figure to identify') }),
      TF(T("La forme d'un triangle suffit à connaître la direction de la sortie.", 'The shape of a triangle is enough to know the exit direction.'), false,
        T("La direction est connue seulement après la cassure : avant, les deux issues restent possibles.", 'The direction is only known after the break: before that, both outcomes remain possible.'))
    ]
  },
  /* ---------------- 3-4 ---------------- */
  {
    id: '3-4', dur: 8,
    t: T('Breakout, pullback et range breakout', 'Breakout, pullback and range breakout'),
    intro: T("Trois scénarios d'entrée très étudiés : la cassure d'un niveau, le retour tester ce niveau, et la sortie d'un range.",
             'Three widely studied entry scenarios: the break of a level, the return to test it, and the exit from a range.'),
    s: [
      { h: T("Cassure d'un niveau", 'Breaking a level'),
        p: [T("Le **breakout** d'une résistance suppose que la demande absorbe les vendeurs. On cherche une cassure nette, idéalement sur clôture, avec une structure claire. Le principal danger est le **faux breakout** : sans confirmation, on peut entrer au pire moment.", 'A **breakout** of a resistance implies demand absorbing sellers. Look for a clear break, ideally on a close, with clear structure. The main danger is the **false breakout**: without confirmation you may enter at the worst moment.')],
        fig: { k: 'pat', id: 'range-breakout', cap: T('Sortie par le haut d\'un range délimité par un support et une résistance.', 'Upside exit from a range bounded by a support and a resistance.') } },
      { h: T('Le pullback : revenir tester', 'The pullback: returning to test'),
        p: [T("Après une cassure, le prix revient souvent sur le niveau franchi. Si l'ancienne résistance tient comme support, certains traders y voient un scénario d'entrée avec un stop placé juste sous la zone, donc plus proche : le ratio risque/rendement peut s'améliorer. Mais le retour peut aussi ne jamais venir.", 'After a breakout, price often returns to the level it crossed. If the former resistance holds as support, some traders see an entry scenario with a stop just under the zone, so closer: the risk/reward ratio can improve. But the retest may also never come.')],
        fig: { k: 'pat', id: 'pullback', cap: T('Cassure, puis pullback sur le niveau avant la reprise.', 'Breakout, then pullback to the level before resuming.') } },
      { h: T('Range breakout : gérer la compression', 'Range breakout: handling compression'),
        p: [T("Un range peut durer longtemps et déclencher de nombreux fakeouts. On définit donc à l'avance : le niveau de cassure, la confirmation attendue (clôture, retest), l'invalidation (retour dans le range) et la taille de position.", 'A range can last a long time and trigger many fakeouts. So define in advance: the breakout level, the expected confirmation (close, retest), the invalidation (return into the range) and position size.')] }
    ],
    key: [
      T("Breakout : franchissement d'un niveau ; faux breakout = risque principal.", 'Breakout: crossing of a level; false breakout = main risk.'),
      T("Pullback : retest du niveau cassé, à confirmer.", 'Pullback: retest of the broken level, to confirm.'),
      T("Range breakout : définir cassure, confirmation et invalidation avant d'agir.", 'Range breakout: define break, confirmation and invalidation before acting.')
    ],
    note: { k: 'tip', t: T("Va dans Patterns pour explorer chaque figure, puis dans Practice pour t'entraîner à les identifier.", 'Go to Patterns to explore each figure, then to Practice to train yourself to identify them.') },
    q: [
      Q('id', T("Quel scénario illustre ce schéma ?", 'Which scenario does this diagram illustrate?'),
        [T("Une cassure suivie d'un pullback", 'A breakout followed by a pullback'), T("Un double top", 'A double top'), T("Un range sans issue", 'A range with no exit')], 0,
        T("Le prix casse un niveau, y revient pour le tester, puis repart : c'est un breakout suivi d'un pullback.", 'Price breaks a level, returns to test it, then moves on: a breakout followed by a pullback.'),
        { k: 'pat', id: 'pullback', labels: false, label: T('Schéma fictif à identifier', 'Fictional diagram to identify') }),
      Q('mcq', T("Quel est le principal risque d'un breakout pris sans confirmation ?", 'What is the main risk of a breakout taken without confirmation?'),
        [T("Le faux breakout", 'The false breakout'), T("Un spread négatif", 'A negative spread'), T("Un excès de confirmation", 'Too much confirmation')], 0,
        T("Le prix peut revenir vite dans le range : c'est le fakeout.", 'Price can quickly return into the range: the fakeout.')),
      TF(T("Après une cassure, le prix revient toujours tester le niveau.", 'After a breakout, price always returns to test the level.'), false,
        T("Le retest est fréquent mais jamais systématique : on peut le manquer.", 'The retest is common but never systematic: you can miss it.'))
    ]
  }
  ]
},
/* ------------------------------------------------------------------ */
{
  id: 4, ic: 'compass', lvl: 3, prem: true,
  t: T('Construire sa méthode', 'Building your method'),
  d: T("Marché, timeframe, entrée, invalidation, risque, journal : transforme tes idées en règles écrites et testables.",
       'Market, timeframe, entry, invalidation, risk, journal: turn your ideas into written, testable rules.'),
  lessons: [
  /* ---------------- 4-1 ---------------- */
  {
    id: '4-1', dur: 7,
    t: T('Définir son cadre : marché, timeframe, contexte', 'Defining your framework: market, timeframe, context'),
    intro: T("Une méthode commence par un cadre : où, quand et dans quel contexte tu cherches des opportunités. Sans cadre, chaque graphique semble contenir un signal.",
             'A method starts with a framework: where, when and in which context you look for opportunities. Without one, every chart seems to contain a signal.'),
    s: [
      { h: T('Choisir un marché et quelques instruments', 'Choosing a market and a few instruments'),
        p: [T("Choisis un marché (Forex, crypto, actions, indices) en tenant compte de ses horaires, de sa liquidité et de ta disponibilité. Limite-toi à **quelques instruments** que tu suis régulièrement : tu apprendras leur comportement typique.", 'Choose a market (Forex, crypto, stocks, indices) considering its hours, liquidity and your availability. Limit yourself to **a few instruments** you follow regularly: you will learn their typical behaviour.')] },
      { h: T('Choisir ses timeframes', 'Choosing your timeframes'),
        p: [T("Définis un timeframe d'**analyse** (pour le contexte) et un timeframe d'**exécution** (pour l'entrée). Ils doivent correspondre à ton emploi du temps : si tu ne peux pas surveiller un graphique de 5 minutes, ne choisis pas ce timeframe.", 'Define an **analysis** timeframe (for context) and an **execution** timeframe (for entry). They must fit your schedule: if you cannot watch a 5-minute chart, do not pick that timeframe.')] },
      { h: T('Lire le contexte', 'Reading the context'),
        p: [T("Le contexte regroupe la structure (tendance ou range), les niveaux importants et les événements à venir (annonces, résultats). Note-le **avant** de chercher une entrée. Si le contexte est confus ou si une annonce majeure approche, c'est peut-être un cas de **non-trading**.", 'Context covers structure (trend or range), important levels and upcoming events (announcements, earnings). Write it down **before** looking for an entry. If context is unclear or a major announcement is near, it may be a **no-trade** case.')],
        ul: [T("Marché et instruments suivis", 'Market and instruments followed'), T("Timeframe d'analyse / d'exécution", 'Analysis / execution timeframe'), T("Structure : tendance, range, niveaux", 'Structure: trend, range, levels'), T("Événements à éviter ou à surveiller", 'Events to avoid or watch')] }
    ],
    key: [
      T("Un cadre précis évite de voir des signaux partout.", 'A precise framework avoids seeing signals everywhere.'),
      T("Peu d'instruments = meilleure connaissance de leur comportement.", 'Fewer instruments = better knowledge of their behaviour.'),
      T("Le contexte se note avant l'entrée.", 'Context is noted before the entry.')
    ],
    note: null,
    q: [
      Q('mcq', T("Pourquoi limiter le nombre d'instruments suivis au départ ?", 'Why limit the number of instruments followed at the beginning?'),
        [T("Pour mieux connaître leur comportement", 'To know their behaviour better'), T("Parce que c'est obligatoire", 'Because it is mandatory'), T("Pour éviter tout risque", 'To avoid all risk')], 0,
        T("Moins d'instruments permet d'accumuler de l'expérience sur des comportements récurrents.", 'Fewer instruments lets you build experience on recurring behaviours.')),
      TF(T("Un timeframe d'exécution doit correspondre à ta disponibilité réelle.", 'An execution timeframe must match your real availability.'), true,
        T("Une méthode que tu ne peux pas appliquer dans ta vie réelle n'est pas une bonne méthode.", 'A method you cannot apply in real life is not a good method.')),
      Q('comp', T("Le contexte comprend notamment…", 'Context notably includes…'),
        [T("la structure, les niveaux importants et les événements à venir", 'structure, important levels and upcoming events'), T("uniquement la couleur des bougies", 'only candle colour'), T("le solde de ton compte", 'your account balance')], 0,
        T("Structure, niveaux et événements donnent le cadre dans lequel chercher une opportunité.", 'Structure, levels and events give the frame in which to look for an opportunity.'))
    ]
  },
  /* ---------------- 4-2 ---------------- */
  {
    id: '4-2', dur: 9,
    t: T('Entrée, invalidation, stop-loss et take-profit', 'Entry, invalidation, stop-loss and take-profit'),
    intro: T("Une règle utile est observable et sans ambiguïté. Cette leçon apprend à écrire des conditions d'entrée, une invalidation, un stop-loss et un objectif cohérents.",
             'A useful rule is observable and unambiguous. This lesson teaches how to write consistent entry conditions, an invalidation, a stop-loss and a target.'),
    s: [
      { h: T("Des conditions d'entrée observables", 'Observable entry conditions'),
        p: [T("Une condition est bonne si deux personnes regardant le même graphique répondent pareil. « La cassure semble forte » est vague ; « clôture 1H au-dessus de la zone X » est observable. Liste 2 à 4 conditions maximum.", 'A condition is good if two people looking at the same chart answer the same way. “The break looks strong” is vague; “1H close above zone X” is observable. List 2 to 4 conditions at most.')] },
      { h: T("L'invalidation : là où l'idée est fausse", 'Invalidation: where the idea is wrong'),
        p: [T("L'**invalidation** est le niveau où ton scénario n'a plus de sens. Le stop-loss se place **là**, pas à un montant confortable choisi au hasard. Si la distance est trop grande pour ton risque autorisé, la taille de position diminue, ou tu ne prends pas le trade.", 'The **invalidation** is the level where your scenario no longer makes sense. The stop-loss goes **there**, not at a comfortable amount picked at random. If the distance is too big for your allowed risk, position size shrinks, or you skip the trade.')] },
      { h: T('Objectif et ratio risque/rendement', 'Target and risk/reward'),
        p: [T("Le take-profit se place sur une zone logique (niveau précédent, hauteur du pattern…). Vérifie que le **R/R** reste cohérent avec ton taux de réussite observé : un R/R de 1:1 exige plus de trades gagnants qu'un R/R de 3:1.", 'The take-profit goes on a logical zone (previous level, pattern height…). Check that the **R/R** remains consistent with your observed win rate: 1:1 requires more winners than 3:1.')],
        fig: tradeFig(115, { zTp: T('Objectif', 'Target'), zSl: T('Risque', 'Risk'), lEntry: T('Entrée', 'Entry'),
                             cap: T("Entrée, invalidation (stop) et objectif forment un plan complet.", 'Entry, invalidation (stop) and target form a complete plan.'),
                             label: T("Graphique fictif d'un plan de trade", 'Fictional chart of a trade plan') }) }
    ],
    key: [
      T("Une règle observable = deux personnes voient la même chose.", 'An observable rule = two people see the same thing.'),
      T("Le stop se place à l'invalidation, pas ailleurs.", 'The stop goes at the invalidation, nowhere else.'),
      T("Le R/R se juge avec le taux de réussite.", 'R/R is judged alongside win rate.')
    ],
    note: { k: 'warn', t: T("Éloigner son stop en cours de trade pour « laisser respirer » une perte est l'une des erreurs les plus courantes : le stop initial fait partie du plan.", 'Moving a stop further away mid-trade to “give a loss room” is one of the most common mistakes: the initial stop is part of the plan.') },
    q: [
      Q('mcq', T("Où placer un stop-loss dans une méthode structurée ?", 'Where to place a stop-loss in a structured method?'),
        [T("Là où le scénario est invalidé", 'Where the scenario is invalidated'), T("À un montant arbitraire", 'At an arbitrary amount'), T("Le plus loin possible", 'As far as possible')], 0,
        T("Le stop matérialise l'invalidation de l'idée.", 'The stop materialises the invalidation of the idea.')),
      Q('comp', T("Entrée 200, stop 190, objectif 230 : ratio risque/rendement ?", 'Entry 200, stop 190, target 230: risk/reward ratio?'),
        ['1:1', '2:1', '3:1', '4:1'], 2,
        T("Gain visé = 30, risque = 10 → R/R = 3.", 'Target gain = 30, risk = 10 → R/R = 3.')),
      TF(T("Éloigner son stop quand le trade va mal est une bonne pratique.", 'Moving the stop further away when the trade goes badly is good practice.'), false,
        T("Cela augmente la perte prévue et casse le plan initial.", 'It increases the planned loss and breaks the initial plan.'))
    ]
  },
  /* ---------------- 4-3 ---------------- */
  {
    id: '4-3', dur: 8,
    t: T('Risque par position, règles de sortie et non-trading', 'Risk per position, exit rules and no-trade conditions'),
    intro: T("Une méthode ne dit pas seulement quand entrer : elle fixe aussi le risque, la façon de sortir et les situations où l'on ne fait rien.",
             'A method does not only say when to enter: it also sets the risk, how to exit and the situations where you do nothing.'),
    s: [
      { h: T('Risque par position et exposition globale', 'Risk per position and overall exposure'),
        p: [T("Fixe un risque par trade et une **limite globale** (par exemple, un maximum de trades ouverts ou de perte quotidienne). Attention aux **corrélations** : EUR/USD et GBP/USD peuvent bouger dans le même sens, deux positions revenant alors à un risque plus grand.", 'Set a risk per trade and an **overall limit** (for example a maximum of open trades or daily loss). Beware of **correlations**: EUR/USD and GBP/USD can move the same way, so two positions amount to a bigger risk.')] },
      { h: T('Règles de sortie', 'Exit rules'),
        p: [T("Écris comment tu sortiras : stop-loss (invalidation), take-profit (objectif), éventuellement une sortie sur **temps** (le trade n'évolue pas dans le délai prévu) ou sur changement de contexte. Une sortie décidée sous l'émotion est rarement la meilleure.", 'Write down how you will exit: stop-loss (invalidation), take-profit (target), possibly a **time**-based exit (the trade does not evolve within the expected time) or a change of context. An exit decided under emotion is rarely the best.')] },
      { h: T('Conditions de non-trading', 'No-trade conditions'),
        p: [T("Ne pas trader est une décision. Exemples de conditions : pas de setup conforme, annonce majeure imminente, marché sans structure claire, limite de perte du jour atteinte, fatigue ou stress important.", 'Not trading is a decision. Example conditions: no compliant setup, major announcement imminent, no clear structure, daily loss limit reached, significant fatigue or stress.')] }
    ],
    key: [
      T("Risque par trade + limite globale : deux niveaux de protection.", 'Risk per trade + overall limit: two layers of protection.'),
      T("Des positions corrélées cumulent le risque.", 'Correlated positions add up risk.'),
      T("Écrire ses conditions de non-trading évite les décisions impulsives.", 'Writing no-trade conditions avoids impulsive decisions.')
    ],
    note: null,
    q: [
      Q('mcq', T("Pourquoi surveiller la corrélation entre positions ?", 'Why watch correlation between positions?'),
        [T("Deux positions corrélées peuvent cumuler le risque", 'Two correlated positions can add up risk'), T("Pour payer moins de spread", 'To pay less spread'), T("Pour augmenter le levier", 'To increase leverage')], 0,
        T("Des instruments corrélés bougent souvent ensemble : tu peux doubler ton risque sans t'en rendre compte.", 'Correlated instruments often move together: you may double your risk without noticing.')),
      TF(T("Ne pas trader peut être une décision conforme à sa méthode.", 'Not trading can be a decision consistent with your method.'), true,
        T("Une méthode précise aussi les situations dans lesquelles on reste à l'écart.", 'A method also specifies situations in which you stay aside.')),
      Q('def', T("Une limite de perte quotidienne sert à…", 'A daily loss limit is used to…'),
        [T("stopper l'activité du jour avant qu'une mauvaise série ne s'aggrave", 'stop the day\'s activity before a bad streak gets worse'), T("augmenter le levier", 'increase leverage'), T("garantir des gains", 'guarantee gains')], 0,
        T("Elle protège le capital et évite le trading émotionnel après plusieurs pertes.", 'It protects capital and avoids emotional trading after several losses.'))
    ]
  },
  /* ---------------- 4-4 ---------------- */
  {
    id: '4-4', dur: 10,
    t: T('Journal, backtesting et statistiques', 'Journal, backtesting and statistics'),
    intro: T("On n'améliore que ce que l'on mesure. Le journal, le backtesting et quelques statistiques simples transforment une idée en méthode vérifiable.",
             'You only improve what you measure. A journal, backtesting and a few simple statistics turn an idea into a verifiable method.'),
    s: [
      { h: T('Le journal de trading', 'The trading journal'),
        p: [T("Note pour chaque trade : date, instrument, contexte, raison de l'entrée, stop, objectif, résultat **en R** (multiples du risque), capture du graphique, et si les **règles ont été respectées**. Ajoute une ligne sur ton état émotionnel.", 'Note for each trade: date, instrument, context, reason for entry, stop, target, result **in R** (multiples of risk), chart screenshot, and whether **rules were followed**. Add a line about your emotional state.')] },
      { h: T('Le backtesting', 'Backtesting'),
        p: [T("Le **backtesting** consiste à appliquer tes règles à des graphiques passés, trade par trade, sans utiliser ce que tu sais de la suite. Il te dit si la méthode a un comportement plausible, pas si elle réussira demain. Plus l'échantillon est grand et varié, plus l'information est utile.", '**Backtesting** means applying your rules to past charts, trade by trade, without using what you know came next. It tells you whether the method behaves plausibly, not whether it will work tomorrow. The larger and more varied the sample, the more useful the information.')] },
      { h: T('Les statistiques de base', 'Basic statistics'), ulFirst: true,
        ul: [T("**Taux de réussite** : part de trades gagnants.", '**Win rate**: share of winning trades.'),
             T("**R moyen** gagnant et perdant.", '**Average R** of winners and losers.'),
             T("**Espérance** = taux de réussite × R gagnant − (1 − taux) × R perdant.", '**Expectancy** = win rate × winning R − (1 − rate) × losing R.'),
             T("**Drawdown maximal** : plus forte baisse de la courbe de capital.", '**Maximum drawdown**: largest fall of the equity curve.')],
        p: [T("Exemple : 40 % de réussite, gains moyens de 3R, pertes de 1R → espérance = 0,4 × 3 − 0,6 × 1 = **+0,6R par trade** (sur l'échantillon testé, sans garantie pour l'avenir).", 'Example: 40% win rate, average wins of 3R, losses of 1R → expectancy = 0.4 × 3 − 0.6 × 1 = **+0.6R per trade** (on the tested sample, no guarantee for the future).')] }
    ],
    key: [
      T("Le journal mesure aussi le respect des règles, pas seulement le résultat.", 'The journal measures rule-following, not just results.'),
      T("Un backtest décrit le passé : il ne garantit pas l'avenir.", 'A backtest describes the past: it does not guarantee the future.'),
      T("Espérance = p × R gagnant − (1 − p) × R perdant.", 'Expectancy = p × winning R − (1 − p) × losing R.')
    ],
    note: { k: 'tip', t: T("Utilise le calculateur d'espérance de la page Outils pour tester différents scénarios.", 'Use the expectancy calculator on the Tools page to test different scenarios.') },
    q: [
      Q('comp', T("Taux de réussite 50 %, gain moyen 2R, perte moyenne 1R. Quelle espérance par trade ?", 'Win rate 50%, average win 2R, average loss 1R. What expectancy per trade?'),
        ['0R', '+0,5R', '+1R', '+1,5R'], 1,
        T("0,5 × 2 − 0,5 × 1 = 1 − 0,5 = +0,5R par trade.", '0.5 × 2 − 0.5 × 1 = 1 − 0.5 = +0.5R per trade.')),
      TF(T("Un backtest positif garantit des gains futurs.", 'A positive backtest guarantees future gains.'), false,
        T("Il décrit le passé, dans des conditions données. Les marchés évoluent.", 'It describes the past, under given conditions. Markets evolve.')),
      Q('mcq', T("À quoi sert principalement un journal de trading ?", 'What is a trading journal mainly for?'),
        [T("À repérer erreurs et comportements récurrents", 'To spot recurring mistakes and behaviours'), T("À prévoir le prochain trade gagnant", 'To predict the next winning trade'), T("À remplacer le stop-loss", 'To replace the stop-loss')], 0,
        T("Relire ses trades permet d'identifier ce qui fonctionne, ce qui ne fonctionne pas et pourquoi.", 'Reviewing trades helps identify what works, what does not and why.'))
    ]
  }
  ]
},
/* ------------------------------------------------------------------ */
{
  id: 5, ic: 'target', lvl: 4, prem: true,
  t: T('Analyse avancée', 'Advanced analysis'),
  d: T("Confluences, multi-timeframe, liquidité, scénarios et probabilités : affine ta lecture du contexte et de tes résultats.",
       'Confluence, multi-timeframe, liquidity, scenarios and probabilities: refine your reading of context and results.'),
  lessons: [
  /* ---------------- 5-1 ---------------- */
  {
    id: '5-1', dur: 9,
    t: T('Confluences et multi-timeframe', 'Confluence and multi-timeframe'),
    intro: T("Une analyse avancée croise plusieurs éléments indépendants et plusieurs échelles de temps, sans tomber dans la sur-complication.",
             'An advanced analysis crosses several independent elements and several timeframes, without falling into over-complication.'),
    s: [
      { h: T('Les confluences', 'Confluence'),
        p: [T("Une **confluence** apparaît quand plusieurs éléments **indépendants** pointent vers la même zone : par exemple un ancien support, une structure de tendance intacte et un contexte favorable sur un timeframe supérieur. Trois indicateurs qui dérivent du même prix ne sont pas trois confluences : ils disent la même chose.", 'A **confluence** appears when several **independent** elements point to the same zone: for example a former support, an intact trend structure and a favourable higher-timeframe context. Three indicators derived from the same price are not three confluences: they say the same thing.')] },
      { h: T('Analyse multi-timeframe (top-down)', 'Multi-timeframe (top-down) analysis'),
        p: [T("On commence par le timeframe supérieur pour le **contexte**, on descend au timeframe intermédiaire pour la **structure** et les zones, puis au timeframe inférieur pour l'**exécution**. La règle de base : ne pas prendre une décision d'exécution qui contredit le contexte supérieur sans raison claire.", 'Start on the higher timeframe for **context**, go down to the intermediate timeframe for **structure** and zones, then to the lower timeframe for **execution**. The basic rule: do not take an execution decision contradicting the higher context without a clear reason.')] },
      { h: T('Les pièges', 'Pitfalls'),
        ul: [T("Chercher des confluences jusqu'à en trouver : le biais de confirmation.", 'Looking for confluences until finding some: confirmation bias.'),
             T("Multiplier les timeframes jusqu'à la paralysie.", 'Multiplying timeframes until paralysis.'),
             T("Confondre nombre de raisons et qualité des raisons.", 'Confusing number of reasons with quality of reasons.')] }
    ],
    key: [
      T("Une confluence vaut par l'indépendance de ses éléments.", 'A confluence is worth the independence of its elements.'),
      T("Top-down : contexte → structure → exécution.", 'Top-down: context → structure → execution.'),
      T("Plus de raisons ne veut pas dire de meilleures raisons.", 'More reasons does not mean better reasons.')
    ],
    note: null,
    q: [
      Q('mcq', T("Laquelle de ces situations est la meilleure confluence ?", 'Which of these situations is the better confluence?'),
        [T("Un niveau, une structure et un contexte supérieur alignés", 'A level, a structure and a higher-timeframe context aligned'), T("Trois indicateurs calculés sur le même prix", 'Three indicators calculated on the same price'), T("Un feeling sans règle", 'A feeling with no rule')], 0,
        T("Des éléments indépendants qui convergent ont plus de valeur que des indicateurs redondants.", 'Independent elements that converge are worth more than redundant indicators.')),
      Q('comp', T("Dans une approche top-down, le timeframe supérieur sert à…", 'In a top-down approach, the higher timeframe is used for…'),
        [T("définir le contexte", 'defining the context'), T("placer le take-profit uniquement", 'placing the take-profit only'), T("ignorer la structure", 'ignoring structure')], 0,
        T("Le contexte général se lit sur l'échelle supérieure, l'exécution sur l'échelle inférieure.", 'The general context is read on the higher scale, execution on the lower one.')),
      TF(T("Plus on cumule d'arguments, plus le trade est forcément fiable.", 'The more arguments you stack, the more reliable the trade necessarily is.'), false,
        T("La qualité et l'indépendance des arguments comptent plus que leur nombre.", 'The quality and independence of arguments matter more than their number.'))
    ]
  },
  /* ---------------- 5-2 ---------------- */
  {
    id: '5-2', dur: 10,
    t: T('Liquidité et structure avancée', 'Liquidity and advanced structure'),
    intro: T("Certains traders lisent le marché à travers les zones où se concentrent des ordres. Ces concepts sont utiles comme grille de lecture, mais leurs définitions varient : il faut les tester.",
             'Some traders read the market through the zones where orders cluster. These concepts are useful as a reading grid, but their definitions vary: they need to be tested.'),
    s: [
      { h: T('Liquidité et balayage (sweep)', 'Liquidity and sweep'),
        p: [T("La **liquidité** désigne les zones où beaucoup d'ordres sont susceptibles de se trouver, par exemple des stops au-dessus de **plus hauts égaux** ou sous des plus bas égaux. Un **liquidity sweep** est un dépassement rapide de ces niveaux, souvent suivi d'un retour dans l'ancienne zone.", '**Liquidity** designates the zones where many orders are likely to sit, for example stops above **equal highs** or below equal lows. A **liquidity sweep** is a quick move past these levels, often followed by a return to the former zone.')],
        fig: { closes: [100, 103, 106, 109, 110, 107, 104, 102, 105, 108, 110, 108, 105, 103, 106, 109, 112, 108, 105, 102, 99, 97], h: 170,
               lines: [{ y: 110, cls: 'res', label: T('Plus hauts égaux', 'Equal highs') }],
               marks: [{ i: 16, s: 'h', t: 'Sweep', cls: 'n' }],
               cap: T('Le prix dépasse brièvement des plus hauts égaux puis retombe.', 'Price briefly exceeds equal highs then falls back.'),
               label: T('Graphique fictif de balayage de liquidité', 'Fictional liquidity sweep chart') } },
      { h: T('BOS et CHoCH', 'BOS and CHoCH'),
        p: [T("Un **BOS** (break of structure) est la cassure d'un sommet ou d'un creux dans le sens de la tendance : la structure est confirmée. Un **CHoCH** (change of character) est la première cassure dans le sens contraire : un possible changement de dynamique, à confirmer.", 'A **BOS** (break of structure) is a break of a high or low in the direction of the trend: structure is confirmed. A **CHoCH** (change of character) is the first break in the opposite direction: a possible change of dynamic, to confirm.')] },
      { h: T("Order blocks et zones d'intérêt", 'Order blocks and zones of interest'),
        p: [T("Un **order block** est généralement défini comme la dernière bougie opposée avant un mouvement impulsif, vue comme une zone d'intérêt. Les définitions varient selon les auteurs et la notion n'est pas objective : elle doit être **définie précisément, puis testée** dans ton journal ou en backtest avant d'être utilisée.", 'An **order block** is generally defined as the last opposite candle before an impulsive move, seen as a zone of interest. Definitions vary by author and the notion is not objective: it must be **precisely defined, then tested** in your journal or in backtests before being used.')] }
    ],
    key: [
      T("Liquidité : zones où des ordres sont susceptibles de se concentrer.", 'Liquidity: zones where orders are likely to cluster.'),
      T("BOS : continuation confirmée ; CHoCH : possible changement.", 'BOS: continuation confirmed; CHoCH: possible change.'),
      T("Ces concepts n'ont pas de définition unique : écris la tienne et teste-la.", 'These concepts have no single definition: write yours and test it.')
    ],
    note: { k: 'warn', t: T("Ces notions sont des grilles de lecture, pas des lois du marché. Aucune ne garantit un résultat.", 'These notions are reading grids, not laws of the market. None guarantees a result.') },
    q: [
      Q('id', T("Sur ce graphique, que représente la petite pointe au-dessus des deux sommets égaux ?", 'On this chart, what does the small spike above the two equal highs represent?'),
        [T("Un balayage de liquidité (sweep)", 'A liquidity sweep'), T("Un spread", 'A spread'), T("Un gap de week-end", 'A weekend gap')], 0,
        T("Un dépassement bref de sommets égaux suivi d'un retour est décrit comme un sweep.", 'A brief excursion past equal highs followed by a return is described as a sweep.'),
        { closes: [100, 103, 106, 109, 110, 107, 104, 102, 105, 108, 110, 108, 105, 103, 106, 109, 112, 108, 105, 102, 99, 97], h: 160,
          lines: [{ y: 110, cls: 'res' }], label: T('Graphique fictif à interpréter', 'Fictional chart to interpret') }),
      Q('def', T("Un CHoCH correspond à…", 'A CHoCH corresponds to…'),
        [T("la première cassure de structure dans le sens opposé à la tendance", 'the first structure break in the direction opposite to the trend'), T("une cassure dans le sens de la tendance", 'a break in the direction of the trend'), T("un ordre au marché", 'a market order')], 0,
        T("Le CHoCH signale un possible changement de dynamique. Le BOS confirme la continuation.", 'The CHoCH signals a possible change of dynamic. The BOS confirms continuation.')),
      TF(T("La notion d'order block a une définition unique et objective.", 'The order block notion has a single, objective definition.'), false,
        T("Les définitions varient : il faut préciser la sienne et la tester.", 'Definitions vary: you must specify yours and test it.'))
    ]
  },
  /* ---------------- 5-3 ---------------- */
  {
    id: '5-3', dur: 9,
    t: T('Scénarios, zones et probabilités', 'Scenarios, zones and probabilities'),
    intro: T("Analyser, ce n'est pas prédire : c'est préparer des scénarios et décider à l'avance de ce qu'on fera dans chacun.",
             'Analysing is not predicting: it is preparing scenarios and deciding in advance what you will do in each.'),
    s: [
      { h: T('Penser en scénarios « si… alors… »', 'Thinking in “if… then…” scenarios'),
        p: [T("Écris un **scénario principal** (« si le prix clôture au-dessus de X, alors j'envisage Y »), un **scénario alternatif** et une **invalidation**. À la fin de la séance, compare ce qui s'est passé avec ce que tu avais prévu.", 'Write a **main scenario** (“if price closes above X, then I consider Y”), an **alternative scenario** and an **invalidation**. At the end of the session, compare what happened with what you planned.')] },
      { h: T('Zones importantes et probabilités', 'Important zones and probabilities'),
        p: [T("Une zone augmente ou diminue la **probabilité** d'un scénario, elle ne la fait jamais passer à 100 %. Raisonne en **espérance** : un scénario peu probable mais à fort R/R peut avoir du sens, et inversement. Les probabilités estimées à l'œil sont fragiles : appuie-les sur des statistiques.", 'A zone increases or decreases the **probability** of a scenario, never makes it 100%. Reason in **expectancy**: an unlikely scenario with high R/R can make sense, and vice versa. Probabilities estimated by eye are fragile: back them with statistics.')] },
      { h: T("Gérer l'incertitude", 'Managing uncertainty'),
        ul: [T("Quelle information changerait mon avis ?", 'What information would change my mind?'),
             T("Que fais-je si le scénario alternatif se réalise ?", 'What do I do if the alternative scenario plays out?'),
             T("Ma taille de position reste-t-elle acceptable si je me trompe ?", 'Is my position size still acceptable if I am wrong?')] }
    ],
    key: [
      T("Un scénario = condition + action + invalidation.", 'A scenario = condition + action + invalidation.'),
      T("Une zone modifie une probabilité, jamais une certitude.", 'A zone changes a probability, never a certainty.'),
      T("Décider avant permet d'agir sans émotion.", 'Deciding beforehand allows acting without emotion.')
    ],
    note: null,
    q: [
      Q('def', T("Un scénario bien construit contient…", 'A well-built scenario contains…'),
        [T("une condition, une action prévue et une invalidation", 'a condition, a planned action and an invalidation'), T("une certitude sur la direction", 'a certainty about direction'), T("uniquement un objectif de gain", 'only a profit target')], 0,
        T("Sans condition et invalidation, ce n'est qu'une opinion.", 'Without a condition and an invalidation, it is only an opinion.')),
      TF(T("Une zone importante fait passer la probabilité d'un scénario à 100 %.", 'An important zone brings the probability of a scenario to 100%.'), false,
        T("Une zone modifie la probabilité, jamais la certitude.", 'A zone changes probability, never certainty.')),
      Q('comp', T("Un scénario peu probable mais à très fort R/R peut…", 'An unlikely scenario with a very high R/R can…'),
        [T("avoir une espérance positive selon les statistiques", 'have a positive expectancy according to statistics'), T("être ignoré sans analyse", 'be ignored without analysis'), T("être garanti", 'be guaranteed')], 0,
        T("L'espérance combine probabilité et gain/perte : elle se calcule, elle ne se devine pas.", 'Expectancy combines probability and gain/loss: it is computed, not guessed.'))
    ]
  },
  /* ---------------- 5-4 ---------------- */
  {
    id: '5-4', dur: 10,
    t: T('Backtesting avancé, statistiques et analyse des erreurs', 'Advanced backtesting, statistics and error analysis'),
    intro: T("Cette dernière leçon renforce la partie qui sépare une intuition d'une méthode : un test rigoureux, les bonnes statistiques et une revue d'erreurs régulière.",
             'This last lesson strengthens what separates an intuition from a method: rigorous testing, the right statistics and regular error review.'),
    s: [
      { h: T('Un backtest plus rigoureux', 'A more rigorous backtest'),
        ul: [T("Échantillon **suffisant** (plusieurs dizaines à centaines de trades) et **varié** (tendance, range, périodes calmes ou agitées).", '**Sufficient** sample (dozens to hundreds of trades) and **varied** (trend, range, calm or volatile periods).'),
             T("Inclure les **coûts** : spread, commissions, slippage.", 'Include **costs**: spread, commissions, slippage.'),
             T("Éviter le **sur-ajustement** : optimiser trop de paramètres sur le passé produit une méthode qui ne se généralise pas.", 'Avoid **overfitting**: optimising too many parameters on the past produces a method that does not generalise.'),
             T("Garder une partie des données **hors échantillon** pour vérifier.", 'Keep part of the data **out of sample** to verify.')] },
      { h: T('Les statistiques à suivre', 'Statistics to track'),
        p: [T("En plus du taux de réussite et de l'espérance, suis le **profit factor** (gains bruts ÷ pertes brutes), le **drawdown maximal** et la **plus longue série de pertes**. Elles te préparent psychologiquement et financièrement aux périodes difficiles, qui arrivent même avec une méthode positive.", 'In addition to win rate and expectancy, track the **profit factor** (gross profits ÷ gross losses), the **maximum drawdown** and the **longest losing streak**. They prepare you psychologically and financially for difficult periods, which happen even with a positive method.')] },
      { h: T('Analyser ses erreurs', 'Analysing your mistakes'),
        p: [T("Classe chaque perte : **perte normale** (le plan a été respecté), **erreur de setup**, **erreur de taille**, **erreur de discipline** (règle non respectée) ou **erreur émotionnelle**. Seules les erreurs évitables se corrigent. Ne modifie qu'un paramètre à la fois et compare avant/après.", 'Classify each loss: **normal loss** (plan followed), **setup mistake**, **sizing mistake**, **discipline mistake** (rule not followed) or **emotional mistake**. Only avoidable mistakes can be fixed. Change one parameter at a time and compare before/after.')] }
    ],
    key: [
      T("Un bon backtest est ample, varié, et inclut les coûts.", 'A good backtest is large, varied and includes costs.'),
      T("Le sur-ajustement crée des méthodes fragiles.", 'Overfitting creates fragile methods.'),
      T("Une perte normale n'est pas une erreur ; une règle non respectée, si.", 'A normal loss is not a mistake; a broken rule is.')
    ],
    note: { k: 'info', t: T("Continue avec Practice pour t'entraîner, puis applique ces idées à ton propre journal.", 'Continue with Practice to train, then apply these ideas to your own journal.') },
    q: [
      Q('def', T("Le sur-ajustement (overfitting) consiste à…", 'Overfitting consists of…'),
        [T("optimiser tant sur le passé que la méthode ne se généralise plus", 'optimising so much on the past that the method no longer generalises'), T("réduire le risque de moitié", 'halving risk'), T("trader plus souvent", 'trading more often')], 0,
        T("Une méthode trop ajustée à des données passées peut échouer sur de nouvelles données.", 'A method too fitted to past data can fail on new data.')),
      Q('comp', T("Le profit factor se calcule…", 'The profit factor is calculated…'),
        [T("gains bruts ÷ pertes brutes", 'gross profits ÷ gross losses'), T("capital ÷ levier", 'capital ÷ leverage'), T("Ask − Bid", 'Ask − Bid')], 0,
        T("Un profit factor supérieur à 1 signifie que les gains bruts dépassent les pertes brutes sur l'échantillon.", 'A profit factor above 1 means gross profits exceed gross losses on the sample.')),
      TF(T("Une perte qui respecte parfaitement le plan est une erreur.", 'A loss that perfectly follows the plan is a mistake.'), false,
        T("Les pertes font partie de toute méthode : l'erreur, c'est de ne pas respecter le plan.", 'Losses are part of any method: the mistake is not following the plan.'))
    ]
  }
  ]
}
];

/* =====================================================================
   7. LEXIQUE (42 termes)
   c = catégorie · lvl = niveau (1 débutant → 4 avancé) · rel = termes liés
   les = leçon associée (optionnelle)
   ===================================================================== */
const LEX_CATS = ['basics', 'orders', 'risk', 'analysis', 'structure', 'advanced'];
const LEX = [
  { id: 'bid', n: T('Bid', 'Bid'), alt: T('Prix vendeur', 'Selling price'), c: 'basics', lvl: 1, les: '1-3', rel: ['ask', 'spread'],
    d: T("Prix auquel tu peux **vendre** un instrument à un instant donné. Il est toujours un peu inférieur au Ask.", "Price at which you can **sell** an instrument at a given moment. It is always slightly below the Ask."),
    ex: T("EUR/USD affiche Bid 1,0850 : une vente au marché s'exécute autour de ce prix.", "EUR/USD shows Bid 1.0850: a market sell executes around that price.") },
  { id: 'ask', n: T('Ask', 'Ask'), alt: T('Prix acheteur', 'Buying price'), c: 'basics', lvl: 1, les: '1-3', rel: ['bid', 'spread'],
    d: T("Prix auquel tu peux **acheter** un instrument à un instant donné. Il est toujours un peu supérieur au Bid.", "Price at which you can **buy** an instrument at a given moment. It is always slightly above the Bid."),
    ex: T("EUR/USD affiche Ask 1,0852 : un achat au marché s'exécute autour de ce prix.", "EUR/USD shows Ask 1.0852: a market buy executes around that price.") },
  { id: 'spread', n: T('Spread', 'Spread'), alt: T('Écart Bid/Ask', 'Bid/Ask gap'), c: 'basics', lvl: 1, les: '1-4', rel: ['bid', 'ask', 'slippage'],
    d: T("Écart entre le prix Ask et le prix Bid. C'est un coût implicite payé à l'entrée : il varie selon la liquidité et l'heure.", "Gap between the Ask and Bid prices. It is an implicit cost paid at entry: it varies with liquidity and time of day."),
    ex: T("Bid 1,0850 / Ask 1,0852 : le spread est de 0,0002, soit 2 pips.", "Bid 1.0850 / Ask 1.0852: the spread is 0.0002, i.e. 2 pips.") },
  { id: 'pip', n: T('Pip', 'Pip'), alt: T('Unité de variation', 'Unit of movement'), c: 'basics', lvl: 1, les: '1-4', rel: ['lot', 'spread'],
    d: T("Unité usuelle de variation d'une paire de devises : 0,0001 pour la plupart des paires, 0,01 pour les paires en yen.", "Usual unit of movement of a currency pair: 0.0001 for most pairs, 0.01 for yen pairs."),
    ex: T("EUR/USD passe de 1,0850 à 1,0860 : il a bougé de 10 pips.", "EUR/USD moves from 1.0850 to 1.0860: it moved 10 pips.") },
  { id: 'lot', n: T('Lot', 'Lot'), alt: T('Taille de position', 'Position size'), c: 'basics', lvl: 1, les: '1-4', rel: ['pip', 'position-size', 'leverage'],
    d: T("Mesure standardisée de la taille d'une position. En Forex, 1 lot standard = 100 000 unités de la devise de base.", "Standardised measure of position size. In Forex, 1 standard lot = 100,000 units of the base currency."),
    ex: T("0,1 lot sur EUR/USD vaut environ 1 USD par pip.", "0.1 lot on EUR/USD is worth about 1 USD per pip.") },
  { id: 'long', n: T('Long (achat)', 'Long (buy)'), alt: T('Position longue', 'Long position'), c: 'basics', lvl: 1, les: '1-1', rel: ['short'],
    d: T("Position ouverte par un achat, dans l'idée de profiter d'une hausse du prix.", "Position opened by buying, with the idea of profiting from a price rise."),
    ex: T("Acheter une action à 50 en espérant la revendre plus cher.", "Buying a stock at 50 hoping to sell it higher.") },
  { id: 'short', n: T('Short (vente)', 'Short (sell)'), alt: T('Position courte', 'Short position'), c: 'basics', lvl: 1, les: '1-1', rel: ['long'],
    d: T("Position ouverte par une vente, dans l'idée de profiter d'une baisse du prix. Selon le produit, elle peut exposer à des pertes très importantes.", "Position opened by selling, with the idea of profiting from a price fall. Depending on the product, it can expose to very large losses."),
    ex: T("Vendre un indice à 4 000 avec l'idée de le racheter moins cher.", "Selling an index at 4,000 with the idea of buying it back cheaper.") },
  { id: 'volatility', n: T('Volatilité', 'Volatility'), alt: T('Amplitude des variations', 'Size of price swings'), c: 'basics', lvl: 2, rel: ['spread', 'atr'],
    d: T("Mesure de l'amplitude des variations d'un prix. Une forte volatilité offre plus de mouvement mais aussi plus de risque.", "Measure of how large a price's movements are. High volatility offers more movement but also more risk."),
    ex: T("Un instrument qui bouge de 3 % par jour est plus volatil qu'un autre qui bouge de 0,5 %.", "An instrument moving 3% a day is more volatile than one moving 0.5%.") },
  { id: 'atr', n: T('ATR', 'ATR'), alt: T('Average True Range', 'Average True Range'), c: 'analysis', lvl: 2, rel: ['volatility', 'stop-loss'],
    d: T("Indicateur de volatilité qui mesure l'amplitude moyenne des bougies sur une période donnée. Il aide à adapter la distance du stop.", "Volatility indicator measuring the average range of candles over a given period. It helps adapt stop distance."),
    ex: T("Si l'ATR journalier est de 80 points, un stop de 10 points est très probablement trop serré.", "If the daily ATR is 80 points, a 10-point stop is very likely too tight.") },
  { id: 'market-order', n: T('Ordre au marché', 'Market order'), alt: T('Exécution immédiate', 'Immediate execution'), c: 'orders', lvl: 1, les: '1-3', rel: ['limit-order', 'slippage'],
    d: T("Ordre exécuté immédiatement au meilleur prix disponible. Rapide, mais le prix obtenu peut différer légèrement du prix affiché.", "Order executed immediately at the best available price. Fast, but the price obtained may differ slightly from the one displayed."),
    ex: T("Cliquer sur « Acheter » exécute un ordre au marché.", "Clicking “Buy” executes a market order.") },
  { id: 'limit-order', n: T('Ordre limite', 'Limit order'), alt: T('Prix imposé', 'Fixed price'), c: 'orders', lvl: 1, les: '1-3', rel: ['market-order', 'stop-order'],
    d: T("Ordre exécuté seulement au prix choisi ou à un meilleur prix. Il peut ne jamais être exécuté si le prix n'atteint pas ce niveau.", "Order executed only at your chosen price or better. It may never be filled if price does not reach that level."),
    ex: T("Un achat limite à 98 attend que le prix redescende à 98 ou moins.", "A buy limit at 98 waits for price to fall back to 98 or lower.") },
  { id: 'stop-order', n: T('Ordre stop', 'Stop order'), alt: T('Ordre déclenché à un niveau', 'Order triggered at a level'), c: 'orders', lvl: 2, les: '1-3', rel: ['stop-loss', 'limit-order'],
    d: T("Ordre qui devient un ordre au marché quand le prix atteint un niveau donné. Il sert à entrer sur cassure ou à sortir d'un trade perdant.", "Order that becomes a market order when price reaches a given level. It is used to enter on a breakout or exit a losing trade."),
    ex: T("Un achat stop à 105 se déclenche si le prix atteint 105.", "A buy stop at 105 triggers if price reaches 105.") },
  { id: 'stop-loss', n: T('Stop-loss', 'Stop-loss'), alt: T('Niveau de perte maximale', 'Maximum-loss level'), c: 'orders', lvl: 1, les: '1-3', rel: ['take-profit', 'slippage', 'risk-reward'],
    d: T("Ordre qui ferme la position quand le prix atteint un niveau défavorable préalablement choisi. Il limite la perte, sans garantie de prix en cas de gap.", "Order that closes the position when price reaches a previously chosen unfavourable level. It limits the loss, with no price guarantee in case of a gap."),
    ex: T("Achat à 100, stop-loss à 95 : la perte visée est de 5 par unité.", "Buy at 100, stop-loss at 95: the planned loss is 5 per unit.") },
  { id: 'take-profit', n: T('Take-profit', 'Take-profit'), alt: T('Objectif de gain', 'Profit target'), c: 'orders', lvl: 1, les: '1-3', rel: ['stop-loss', 'risk-reward'],
    d: T("Ordre qui ferme la position lorsque l'objectif de gain choisi est atteint.", "Order that closes the position when the chosen profit target is reached."),
    ex: T("Achat à 100, take-profit à 110 : le gain visé est de 10 par unité.", "Buy at 100, take-profit at 110: the target gain is 10 per unit.") },
  { id: 'slippage', n: T('Slippage', 'Slippage'), alt: T('Glissement de prix', 'Price slippage'), c: 'orders', lvl: 2, les: '1-3', rel: ['market-order', 'liquidity'],
    d: T("Écart entre le prix attendu d'un ordre et le prix réellement obtenu, fréquent en cas de forte volatilité ou de faible liquidité.", "Difference between the expected price of an order and the price actually obtained, common with high volatility or low liquidity."),
    ex: T("Ordre au marché demandé à 100,00, exécuté à 100,08 pendant une annonce.", "Market order requested at 100.00, executed at 100.08 during an announcement.") },
  { id: 'leverage', n: T('Levier', 'Leverage'), alt: T('Effet de levier', 'Leverage effect'), c: 'risk', lvl: 1, les: '1-4', rel: ['margin', 'drawdown'],
    d: T("Mécanisme permettant de contrôler une position plus grande que son capital. Il **amplifie les gains comme les pertes**.", "Mechanism to control a position larger than your capital. It **amplifies gains and losses**."),
    ex: T("Avec un levier de 10:1, 1 000 permettent de contrôler 10 000.", "With 10:1 leverage, 1,000 lets you control 10,000.") },
  { id: 'margin', n: T('Marge', 'Margin'), alt: T('Garantie exigée', 'Required collateral'), c: 'risk', lvl: 2, les: '1-4', rel: ['leverage'],
    d: T("Somme immobilisée en garantie pour maintenir une position à levier. Si les pertes la dépassent, le courtier peut clôturer des positions (appel de marge).", "Amount set aside as collateral to hold a leveraged position. If losses exceed it, the broker may close positions (margin call)."),
    ex: T("Une position de 10 000 avec levier 10:1 immobilise 1 000 de marge.", "A 10,000 position with 10:1 leverage ties up 1,000 of margin.") },
  { id: 'position-size', n: T('Taille de position', 'Position size'), alt: T('Quantité engagée', 'Quantity committed'), c: 'risk', lvl: 2, les: '1-5', rel: ['lot', 'risk-reward', 'stop-loss'],
    d: T("Quantité engagée sur un trade. Elle se calcule à partir du risque accepté : **montant risqué ÷ distance jusqu'au stop**.", "Quantity committed to a trade. It is computed from the accepted risk: **amount risked ÷ distance to the stop**."),
    ex: T("Risque 50, entrée 100, stop 95 → 50 ÷ 5 = 10 unités.", "Risk 50, entry 100, stop 95 → 50 ÷ 5 = 10 units.") },
  { id: 'risk-reward', n: T('Risque/rendement (R/R)', 'Risk/Reward (R/R)'), alt: T('Ratio gain visé / risque', 'Target gain / risk ratio'), c: 'risk', lvl: 1, les: '1-5', rel: ['stop-loss', 'take-profit', 'expectancy'],
    d: T("Rapport entre le gain visé et le risque pris sur un trade. À lire avec le taux de réussite : un bon R/R seul ne suffit pas.", "Ratio between target gain and risk taken on a trade. To read with the win rate: a good R/R alone is not enough."),
    ex: T("Risque 5, gain visé 15 → R/R de 3 (3R).", "Risk 5, target gain 15 → R/R of 3 (3R).") },
  { id: 'drawdown', n: T('Drawdown', 'Drawdown'), alt: T('Baisse depuis un sommet', 'Fall from a peak'), c: 'risk', lvl: 2, les: '1-5', rel: ['leverage', 'expectancy'],
    d: T("Baisse du capital depuis son dernier sommet. Elle est asymétrique : perdre 50 % demande +100 % pour revenir à l'équilibre.", "Fall in capital from its latest peak. It is asymmetric: losing 50% requires +100% to get back to breakeven."),
    ex: T("Capital passé de 10 000 à 8 000 : drawdown de 20 %.", "Capital going from 10,000 to 8,000: a 20% drawdown.") },
  { id: 'expectancy', n: T('Espérance', 'Expectancy'), alt: T('Gain moyen par trade', 'Average gain per trade'), c: 'risk', lvl: 3, les: '4-4', rel: ['risk-reward', 'backtesting'],
    d: T("Résultat moyen attendu par trade, en multiples de R : **taux de réussite × R gagnant − (1 − taux) × R perdant**. Basée sur des données passées, elle ne garantit rien.", "Average expected result per trade, in multiples of R: **win rate × winning R − (1 − rate) × losing R**. Based on past data, it guarantees nothing."),
    ex: T("40 % de réussite, gains de 3R, pertes de 1R → +0,6R par trade.", "40% win rate, wins of 3R, losses of 1R → +0.6R per trade.") },
  { id: 'timeframe', n: T('Timeframe', 'Timeframe'), alt: T('Unité de temps', 'Time unit'), c: 'analysis', lvl: 1, les: '2-1', rel: ['candlestick'],
    d: T("Durée représentée par une bougie : 5 minutes, 1 heure, 1 jour… Le même marché peut sembler différent selon le timeframe.", "Duration represented by one candle: 5 minutes, 1 hour, 1 day… The same market can look different depending on the timeframe."),
    ex: T("Un graphique H1 a une bougie par heure.", "An H1 chart has one candle per hour.") },
  { id: 'candlestick', n: T('Bougie japonaise', 'Candlestick'), alt: T('Chandelier', 'Candle'), c: 'analysis', lvl: 1, les: '2-1', rel: ['timeframe', 'trend'],
    d: T("Représentation d'une période avec ouverture, plus haut, plus bas et clôture. Le corps relie ouverture et clôture, les mèches montrent les extrêmes.", "Representation of one period with open, high, low and close. The body links open and close, the wicks show the extremes."),
    ex: T("Une bougie haussière clôture au-dessus de son ouverture.", "A bullish candle closes above its open.") },
  { id: 'volume', n: T('Volume', 'Volume'), alt: T('Activité échangée', 'Traded activity'), c: 'analysis', lvl: 2, les: '2-4', rel: ['breakout', 'liquidity'],
    d: T("Quantité échangée sur une période. Un mouvement accompagné d'un volume élevé est souvent jugé plus convaincant, sans garantie.", "Quantity traded over a period. A move accompanied by high volume is often judged more convincing, with no guarantee."),
    ex: T("Une cassure sur volume supérieur à la moyenne.", "A breakout on above-average volume.") },
  { id: 'moving-average', n: T('Moyenne mobile', 'Moving average'), alt: T('MM / MA', 'MA'), c: 'analysis', lvl: 2, les: '2-5', rel: ['rsi', 'trend'],
    d: T("Indicateur qui lisse le prix en calculant sa moyenne sur N périodes. Il réagit avec retard mais montre la direction générale.", "Indicator that smooths price by computing its average over N periods. It reacts with a delay but shows overall direction."),
    ex: T("Une moyenne mobile à 50 périodes qui monte suggère une tendance haussière.", "A rising 50-period moving average suggests an uptrend.") },
  { id: 'rsi', n: T('RSI', 'RSI'), alt: T('Relative Strength Index', 'Relative Strength Index'), c: 'analysis', lvl: 2, les: '2-5', rel: ['moving-average', 'divergence'],
    d: T("Oscillateur de momentum compris entre 0 et 100, qui compare les hausses et les baisses récentes. Ses zones extrêmes ne sont pas des signaux automatiques.", "Momentum oscillator between 0 and 100 comparing recent gains and losses. Its extreme zones are not automatic signals."),
    ex: T("Un RSI au-dessus de 70 peut signaler un marché étendu, sans annoncer un retournement.", "An RSI above 70 may signal an extended market without announcing a reversal.") },
  { id: 'divergence', n: T('Divergence', 'Divergence'), alt: T('Prix vs indicateur', 'Price vs indicator'), c: 'analysis', lvl: 3, rel: ['rsi'],
    d: T("Situation où le prix et un indicateur de momentum évoluent en sens opposé, par exemple un nouveau sommet du prix avec un RSI plus bas. Indice d'essoufflement, à confirmer.", "Situation where price and a momentum indicator move in opposite directions, e.g. a new price high with a lower RSI. A hint of exhaustion, to be confirmed."),
    ex: T("Prix : sommet plus haut ; RSI : sommet plus bas → divergence baissière.", "Price: higher high; RSI: lower high → bearish divergence.") },
  { id: 'journal', n: T('Journal de trading', 'Trading journal'), alt: T('Registre des trades', 'Trade log'), c: 'analysis', lvl: 2, les: '4-4', rel: ['backtesting', 'expectancy'],
    d: T("Registre où l'on note chaque trade (contexte, raisons, résultat en R, respect des règles, émotions) pour analyser ses habitudes.", "Log where each trade is noted (context, reasons, result in R, rule adherence, emotions) to analyse one's habits."),
    ex: T("Revue du week-end : 3 pertes sur 4 venaient d'entrées prises trop tôt.", "Weekend review: 3 of 4 losses came from entries taken too early.") },
  { id: 'backtesting', n: T('Backtesting', 'Backtesting'), alt: T('Test sur le passé', 'Testing on the past'), c: 'analysis', lvl: 3, les: '4-4', rel: ['journal', 'expectancy'],
    d: T("Application de règles à des données passées pour observer le comportement d'une méthode. Il ne garantit pas l'avenir et peut être faussé par le sur-ajustement.", "Applying rules to past data to observe a method's behaviour. It does not guarantee the future and can be distorted by overfitting."),
    ex: T("Tester une règle de cassure sur 100 situations passées.", "Testing a breakout rule on 100 past situations.") },
  { id: 'trend', n: T('Tendance', 'Trend'), alt: T('Direction dominante', 'Dominant direction'), c: 'structure', lvl: 1, les: '2-2', rel: ['range', 'market-structure'],
    d: T("Direction dominante du prix. Haussière : sommets et creux de plus en plus hauts. Baissière : de plus en plus bas.", "Dominant direction of price. Up: higher highs and higher lows. Down: lower highs and lower lows."),
    ex: T("Une série de HH et de HL décrit une tendance haussière.", "A series of HH and HL describes an uptrend.") },
  { id: 'range', n: T('Range', 'Range'), alt: T('Marché latéral', 'Sideways market'), c: 'structure', lvl: 1, les: '2-2', rel: ['trend', 'support', 'resistance'],
    d: T("Phase où le prix oscille entre un niveau haut et un niveau bas, sans direction claire.", "Phase where price oscillates between a high level and a low level with no clear direction."),
    ex: T("Le prix rebondit entre 100 et 120 pendant plusieurs semaines.", "Price bounces between 100 and 120 for several weeks.") },
  { id: 'support', n: T('Support', 'Support'), alt: T('Zone de rebond', 'Bounce zone'), c: 'structure', lvl: 1, les: '2-3', rel: ['resistance', 'breakout'],
    d: T("Zone où les acheteurs sont intervenus dans le passé, faisant rebondir le prix. C'est une zone, pas une ligne exacte, et rien ne garantit qu'elle tiendra.", "Area where buyers stepped in previously, making price bounce. It is a zone, not an exact line, and nothing guarantees it will hold."),
    ex: T("Le prix a rebondi trois fois vers 100 : la zone 99–101 est un support.", "Price bounced three times near 100: the 99–101 zone is a support.") },
  { id: 'resistance', n: T('Résistance', 'Resistance'), alt: T('Zone de rejet', 'Rejection zone'), c: 'structure', lvl: 1, les: '2-3', rel: ['support', 'breakout'],
    d: T("Zone où les vendeurs sont intervenus dans le passé, faisant reculer le prix. Un niveau cassé peut changer de rôle.", "Area where sellers stepped in previously, pushing price back. A broken level can change roles."),
    ex: T("Le prix échoue trois fois sous 120 : la zone 119–121 est une résistance.", "Price fails three times under 120: the 119–121 zone is a resistance.") },
  { id: 'breakout', n: T('Breakout', 'Breakout'), alt: T('Cassure', 'Break'), c: 'structure', lvl: 2, les: '2-4', rel: ['pullback', 'fakeout', 'volume'],
    d: T("Franchissement net d'un support, d'une résistance ou d'une figure. Certaines cassures échouent (fakeout).", "Clear crossing of a support, resistance or figure. Some breakouts fail (fakeout)."),
    ex: T("Clôture au-dessus de la résistance 120 après plusieurs rejets.", "Close above the 120 resistance after several rejections.") },
  { id: 'pullback', n: T('Pullback', 'Pullback'), alt: T('Retour sur le niveau', 'Retest'), c: 'structure', lvl: 2, les: '2-4', rel: ['breakout', 'support'],
    d: T("Retour du prix vers un niveau qu'il vient de franchir, avant une éventuelle poursuite du mouvement.", "Return of price toward a level it just crossed, before a possible continuation."),
    ex: T("Après la cassure de 120, le prix revient tester 120 puis repart.", "After breaking 120, price returns to test 120 then moves on.") },
  { id: 'fakeout', n: T('Fakeout', 'Fakeout'), alt: T('Fausse cassure', 'False breakout'), c: 'structure', lvl: 2, les: '2-4', rel: ['breakout', 'liquidity-sweep'],
    d: T("Cassure qui échoue : le prix dépasse un niveau puis revient rapidement de l'autre côté, piégeant les entrées précoces.", "Failed breakout: price exceeds a level then quickly comes back to the other side, trapping early entries."),
    ex: T("Le prix passe à 121 puis clôture à 118 dans la même journée.", "Price goes to 121 then closes at 118 the same day.") },
  { id: 'market-structure', n: T('Structure de marché', 'Market structure'), alt: T('Hauts et bas', 'Highs and lows'), c: 'structure', lvl: 2, les: '2-2', rel: ['trend', 'bos'],
    d: T("Organisation des sommets et des creux successifs du prix. Elle permet de décrire la tendance et de repérer ses ruptures.", "Organisation of successive highs and lows of price. It describes the trend and spots its breaks."),
    ex: T("Un creux plus bas rompt la structure haussière précédente.", "A lower low breaks the previous bullish structure.") },
  { id: 'liquidity', n: T('Liquidité', 'Liquidity'), alt: T('Profondeur du marché', 'Market depth'), c: 'advanced', lvl: 3, les: '5-2', rel: ['liquidity-sweep', 'slippage', 'volume'],
    d: T("Facilité à acheter ou vendre sans faire bouger le prix. Dans l'analyse avancée, désigne aussi les zones où se concentrent des ordres (stops, ordres en attente).", "Ease of buying or selling without moving price. In advanced analysis, it also designates zones where orders cluster (stops, pending orders)."),
    ex: T("Le Forex majeur est très liquide ; un actif peu échangé l'est beaucoup moins.", "Major Forex is very liquid; a thinly traded asset much less so.") },
  { id: 'liquidity-sweep', n: T('Liquidity sweep', 'Liquidity sweep'), alt: T('Balayage de liquidité', 'Liquidity grab'), c: 'advanced', lvl: 3, les: '5-2', rel: ['liquidity', 'fakeout'],
    d: T("Dépassement rapide d'un niveau où des ordres sont susceptibles de se trouver (plus hauts ou plus bas égaux), suivi d'un retour dans l'ancienne zone.", "Quick excursion past a level where orders are likely to sit (equal highs or lows), followed by a return into the former zone."),
    ex: T("Le prix dépasse brièvement un double sommet puis retombe sous ce niveau.", "Price briefly exceeds a double top then falls back under it.") },
  { id: 'bos', n: T('BOS / CHoCH', 'BOS / CHoCH'), alt: T('Break of structure', 'Break of structure'), c: 'advanced', lvl: 3, les: '5-2', rel: ['market-structure', 'order-block'],
    d: T("**BOS** : cassure de structure dans le sens de la tendance. **CHoCH** : première cassure dans le sens contraire, signe d'un possible changement de dynamique.", "**BOS**: structure break in the direction of the trend. **CHoCH**: first break in the opposite direction, a sign of a possible change of dynamic."),
    ex: T("En tendance haussière, la cassure du dernier sommet est un BOS ; la cassure du dernier creux plus haut est un CHoCH.", "In an uptrend, breaking the last high is a BOS; breaking the last higher low is a CHoCH.") },
  { id: 'order-block', n: T('Order block', 'Order block'), alt: T("Zone d'intérêt", 'Zone of interest'), c: 'advanced', lvl: 4, les: '5-2', rel: ['bos', 'confluence'],
    d: T("Souvent défini comme la dernière bougie opposée avant un mouvement impulsif, vue comme une zone d'intérêt. Notion non objective aux définitions variables : à tester.", "Often defined as the last opposite candle before an impulsive move, seen as a zone of interest. A non-objective notion with varying definitions: to be tested."),
    ex: T("Dernière bougie baissière avant une forte impulsion haussière.", "Last bearish candle before a strong bullish impulse.") },
  { id: 'confluence', n: T('Confluence', 'Confluence'), alt: T("Éléments convergents", 'Converging elements'), c: 'advanced', lvl: 3, les: '5-1', rel: ['order-block', 'market-structure'],
    d: T("Convergence de plusieurs éléments **indépendants** vers une même zone (niveau, structure, contexte supérieur). Plusieurs indicateurs redondants ne comptent pas.", "Convergence of several **independent** elements on the same zone (level, structure, higher-timeframe context). Several redundant indicators do not count."),
    ex: T("Ancien support + tendance intacte + contexte H4 haussier.", "Former support + intact trend + bullish H4 context.") }
];
const LEX_BY_ID = {};
LEX.forEach(w => { LEX_BY_ID[w.id] = w; });

/* =====================================================================
   8. BIBLIOTHÈQUE DE PATTERNS (13)
   pts    : points-clés (x 0-100, y = prix relatif) → bougies fictives
   lines  : lignes de structure   marks : repères numérotés
   Chaque fiche : définition, structure, identification, contexte,
   interprétation possible, erreurs fréquentes, exemple, exercice.
   ===================================================================== */
const PAT_CATS = ['reversal', 'continuation', 'breakout'];
const L2 = (a, b, cls, label) => ({ a, b, cls, label });
const PATTERNS = [
  { id: 'double-top', n: T('Double Top', 'Double Top'), c: 'reversal', lvl: 2,
    pts: [[0, 20], [15, 55], [30, 80], [42, 55], [58, 80], [72, 50], [85, 35], [100, 20]],
    lines: [L2([22, 80], [66, 80], 'res', T('Résistance', 'Resistance')), L2([15, 55], [100, 55], 'neck', T('Ligne de cou', 'Neckline'))],
    marks: [{ x: 30, y: 80, t: '1' }, { x: 58, y: 80, t: '2' }],
    def: T("Figure de retournement baissier : le prix atteint deux fois à peu près le même sommet sans réussir à le dépasser, puis casse le creux intermédiaire.", "Bearish reversal figure: price reaches roughly the same high twice without breaking it, then breaks the middle low."),
    struct: T("Une hausse préalable, un premier sommet, un repli, un second sommet proche du premier, puis une cassure de la ligne de cou.", "A prior rise, a first high, a pullback, a second high near the first, then a break of the neckline."),
    ident: [T("Deux sommets proches (souvent à quelques % l'un de l'autre).", "Two nearby highs (often within a few % of each other)."), T("Un creux central qui définit la ligne de cou.", "A central low that defines the neckline."), T("Cassure de la ligne de cou, idéalement sur clôture.", "Break of the neckline, ideally on a close.")],
    ctx: T("Plus pertinent après une tendance haussière nette et près d'une résistance importante ou d'un timeframe supérieur.", "More relevant after a clear uptrend and near an important resistance or higher timeframe."),
    interp: T("Le double échec sur un même niveau suggère un essoufflement des acheteurs. Certains traders estiment un objectif en reportant la hauteur de la figure sous la ligne de cou, sans garantie.", "The double failure at the same level suggests exhausted buyers. Some traders estimate a target by projecting the height of the figure below the neckline, with no guarantee."),
    err: [T("Anticiper avant la cassure de la ligne de cou.", "Anticipating before the neckline breaks."), T("Voir un double top sans tendance haussière préalable.", "Seeing a double top with no prior uptrend."), T("Placer le stop sans lien avec le sommet de la figure.", "Placing the stop with no link to the top of the figure.")],
    ex: T("Le prix monte de 100 à 120, recule à 110, retouche 120 sans le franchir, puis clôture à 108 : la ligne de cou (110) est cassée.", "Price rises from 100 to 120, pulls back to 110, retouches 120 without breaking it, then closes at 108: the neckline (110) is broken."),
    x: Q('mcq', T("Quel événement confirme généralement un double top ?", "Which event generally confirms a double top?"),
      [T("La cassure de la ligne de cou", "The break of the neckline"), T("Le premier sommet", "The first high"), T("Une bougie haussière", "A bullish candle")], 0,
      T("Tant que la ligne de cou tient, la figure n'est qu'un scénario possible.", "As long as the neckline holds, the figure is only a possible scenario.")) },
  { id: 'double-bottom', n: T('Double Bottom', 'Double Bottom'), c: 'reversal', lvl: 2,
    pts: [[0, 80], [15, 45], [30, 20], [42, 45], [58, 20], [72, 50], [85, 65], [100, 80]],
    lines: [L2([22, 20], [66, 20], 'sup', T('Support', 'Support')), L2([15, 45], [100, 45], 'neck', T('Ligne de cou', 'Neckline'))],
    marks: [{ x: 30, y: 20, t: '1', pos: 'b' }, { x: 58, y: 20, t: '2', pos: 'b' }],
    def: T("Figure de retournement haussier : le prix teste deux fois un même creux sans le casser, puis franchit le sommet intermédiaire.", "Bullish reversal figure: price tests the same low twice without breaking it, then crosses the middle high."),
    struct: T("Une baisse préalable, un premier creux, un rebond, un second creux proche du premier, puis une cassure de la ligne de cou.", "A prior fall, a first low, a bounce, a second low near the first, then a break of the neckline."),
    ident: [T("Deux creux proches sur un même support.", "Two nearby lows on the same support."), T("Un sommet central qui définit la ligne de cou.", "A central high that defines the neckline."), T("Cassure haussière de la ligne de cou.", "Bullish break of the neckline.")],
    ctx: T("Plus pertinent après une baisse marquée, sur une zone de support identifiée.", "More relevant after a marked fall, on an identified support zone."),
    interp: T("Le second échec des vendeurs suggère un essoufflement de la baisse. La cassure de la ligne de cou valide le scénario ; le retour sous le second creux l'invalide.", "The sellers' second failure suggests the fall is running out of steam. The neckline break validates the scenario; a return below the second low invalidates it."),
    err: [T("Acheter dès le second creux, sans confirmation.", "Buying at the second low with no confirmation."), T("Ignorer la tendance du timeframe supérieur.", "Ignoring the higher-timeframe trend."), T("Stop placé sans référence à l'invalidation.", "Stop placed with no reference to the invalidation.")],
    ex: T("Le prix tombe à 80, rebondit à 90, retouche 80, puis clôture au-dessus de 90 : la ligne de cou est franchie.", "Price falls to 80, bounces to 90, retouches 80, then closes above 90: the neckline is crossed."),
    x: Q('id', T("Deux creux au même niveau puis cassure de la ligne de cou vers le haut : quel pattern ?", "Two lows at the same level then an upward neckline break: which pattern?"),
      [T("Double Bottom", "Double Bottom"), T("Double Top", "Double Top"), T("Triangle descendant", "Descending triangle")], 0,
      T("C'est la signature d'un double bottom.", "This is the signature of a double bottom.")) },
  { id: 'head-shoulders', n: T('Head & Shoulders', 'Head & Shoulders'), c: 'reversal', lvl: 3,
    pts: [[0, 25], [12, 55], [22, 70], [32, 50], [45, 90], [58, 50], [68, 70], [80, 52], [90, 38], [100, 25]],
    lines: [L2([20, 50], [100, 50], 'neck', T('Ligne de cou', 'Neckline'))],
    marks: [{ x: 22, y: 70, t: T('Épaule G.', 'L. shoulder') }, { x: 45, y: 90, t: T('Tête', 'Head') }, { x: 68, y: 70, t: T('Épaule D.', 'R. shoulder') }],
    def: T("Figure de retournement baissier à trois sommets dont le central (la tête) est le plus haut, encadré par deux épaules de hauteur voisine.", "Bearish reversal figure with three peaks, the central one (the head) being the highest, framed by two shoulders of similar height."),
    struct: T("Épaule gauche, tête plus haute, épaule droite, avec une ligne de cou reliant les deux creux intermédiaires.", "Left shoulder, higher head, right shoulder, with a neckline linking the two intermediate lows."),
    ident: [T("Trois sommets, le central étant le plus haut.", "Three peaks, the central one being the highest."), T("Ligne de cou horizontale ou légèrement inclinée.", "Horizontal or slightly sloped neckline."), T("Cassure de la ligne de cou.", "Break of the neckline.")],
    ctx: T("S'observe après une tendance haussière. Plus le timeframe est grand, plus la figure est généralement jugée significative.", "Observed after an uptrend. The larger the timeframe, the more significant the figure is generally judged."),
    interp: T("La tête suivie d'une épaule droite plus basse suggère un affaiblissement de la hausse. La cassure de la ligne de cou valide le scénario ; un retour au-dessus de l'épaule droite l'invalide.", "The head followed by a lower right shoulder suggests the rise is weakening. The neckline break validates the scenario; a return above the right shoulder invalidates it."),
    err: [T("Chercher une symétrie parfaite qui n'existe pas.", "Looking for a perfect symmetry that does not exist."), T("Entrer avant la cassure de la ligne de cou.", "Entering before the neckline breaks."), T("Oublier que la figure peut se transformer en simple range.", "Forgetting the figure can turn into a simple range.")],
    ex: T("Sommets à 100, 115 puis 101 ; les creux à 90 forment la ligne de cou. Une clôture sous 90 valide la figure.", "Peaks at 100, 115 then 101; lows at 90 form the neckline. A close below 90 validates the figure."),
    x: Q('mcq', T("Dans une figure tête-épaules, quel sommet est le plus élevé ?", "In a head & shoulders figure, which peak is the highest?"),
      [T("La tête", "The head"), T("L'épaule gauche", "The left shoulder"), T("L'épaule droite", "The right shoulder")], 0,
      T("La tête est le sommet central et le plus haut.", "The head is the central and highest peak.")) },
  { id: 'inverse-hs', n: T('Inverse Head & Shoulders', 'Inverse Head & Shoulders'), c: 'reversal', lvl: 3,
    pts: [[0, 75], [12, 45], [22, 30], [32, 50], [45, 10], [58, 50], [68, 30], [80, 48], [90, 62], [100, 75]],
    lines: [L2([20, 50], [100, 50], 'neck', T('Ligne de cou', 'Neckline'))],
    marks: [{ x: 22, y: 30, t: T('Épaule G.', 'L. shoulder'), pos: 'b' }, { x: 45, y: 10, t: T('Tête', 'Head'), pos: 'b' }, { x: 68, y: 30, t: T('Épaule D.', 'R. shoulder'), pos: 'b' }],
    def: T("Version haussière de la figure tête-épaules : trois creux dont le central est le plus bas, après une baisse.", "Bullish version of the head & shoulders figure: three lows, the central one being the lowest, after a fall."),
    struct: T("Épaule gauche, tête plus basse, épaule droite, avec une ligne de cou reliant les deux sommets intermédiaires.", "Left shoulder, lower head, right shoulder, with a neckline linking the two intermediate highs."),
    ident: [T("Trois creux, le central étant le plus bas.", "Three lows, the central one being the lowest."), T("Ligne de cou reliant les sommets intermédiaires.", "Neckline linking the intermediate highs."), T("Cassure haussière de la ligne de cou.", "Bullish break of the neckline.")],
    ctx: T("S'observe après une tendance baissière, souvent sur un support important.", "Observed after a downtrend, often on an important support."),
    interp: T("La tête suivie d'une épaule droite plus haute suggère un affaiblissement des vendeurs. Le franchissement de la ligne de cou valide, un retour sous l'épaule droite invalide.", "The head followed by a higher right shoulder suggests weakening sellers. Crossing the neckline validates, a return below the right shoulder invalidates."),
    err: [T("Confondre avec un simple rebond dans une tendance baissière.", "Confusing it with a simple bounce in a downtrend."), T("Acheter sans attendre la cassure.", "Buying without waiting for the break."), T("Ne pas définir l'invalidation.", "Not defining the invalidation.")],
    ex: T("Creux à 100, 85 puis 99 ; les sommets à 110 forment la ligne de cou. Une clôture au-dessus de 110 valide la figure.", "Lows at 100, 85 then 99; highs at 110 form the neckline. A close above 110 validates the figure."),
    x: Q('mcq', T("Après quel type de mouvement l'inverse tête-épaules apparaît-il ?", "After which kind of move does the inverse head & shoulders appear?"),
      [T("Une baisse", "A fall"), T("Une hausse", "A rise"), T("Un gap", "A gap")], 0,
      T("C'est un pattern de retournement haussier : il suit une baisse.", "It is a bullish reversal pattern: it follows a fall.")) },
  { id: 'asc-triangle', n: T('Triangle ascendant', 'Ascending Triangle'), c: 'continuation', lvl: 3,
    pts: [[0, 30], [14, 80], [26, 52], [40, 80], [52, 62], [64, 80], [74, 70], [84, 80], [92, 92], [100, 100]],
    lines: [L2([10, 80], [86, 80], 'res', T('Résistance plate', 'Flat resistance')), L2([26, 52], [80, 72], 'trend', T('Creux montants', 'Rising lows'))],
    marks: [],
    def: T("Compression où la résistance reste horizontale tandis que les creux montent : la pression acheteuse augmente sous un plafond.", "Compression where resistance stays horizontal while lows rise: buying pressure builds under a ceiling."),
    struct: T("Une résistance plate testée plusieurs fois et une ligne de support ascendante qui se rapproche.", "A flat resistance tested several times and a rising support line closing in."),
    ident: [T("Au moins deux sommets sur la même résistance.", "At least two highs on the same resistance."), T("Au moins deux creux de plus en plus hauts.", "At least two higher and higher lows."), T("Sortie du triangle par cassure.", "Exit of the triangle by a break.")],
    ctx: T("Souvent vu en tendance haussière comme pause de continuation, mais il peut aussi apparaître ailleurs.", "Often seen in an uptrend as a continuation pause, but it can also appear elsewhere."),
    interp: T("Une cassure haussière de la résistance est le scénario classique. Une cassure de la ligne ascendante vers le bas invalide l'idée haussière.", "A bullish break of the resistance is the classic scenario. A downward break of the rising line invalidates the bullish idea."),
    err: [T("Anticiper la sortie avant la cassure.", "Anticipating the exit before the break."), T("Ignorer la cassure baissière possible.", "Ignoring the possible bearish break."), T("Tracer des lignes trop flexibles.", "Drawing overly flexible lines.")],
    ex: T("Résistance à 120 testée trois fois, creux à 100, 106 puis 111 : la sortie au-dessus de 120 confirme.", "Resistance at 120 tested three times, lows at 100, 106 then 111: an exit above 120 confirms."),
    x: Q('mcq', T("Un triangle ascendant a…", "An ascending triangle has…"),
      [T("une résistance plate et des creux montants", "a flat resistance and rising lows"), T("un support plat et des sommets descendants", "a flat support and falling highs"), T("deux lignes parallèles", "two parallel lines")], 0,
      T("C'est la définition du triangle ascendant.", "This is the definition of the ascending triangle.")) },
  { id: 'desc-triangle', n: T('Triangle descendant', 'Descending Triangle'), c: 'continuation', lvl: 3,
    pts: [[0, 70], [14, 20], [26, 48], [40, 20], [52, 38], [64, 20], [74, 30], [84, 20], [92, 8], [100, 0]],
    lines: [L2([10, 20], [86, 20], 'sup', T('Support plat', 'Flat support')), L2([26, 48], [80, 28], 'trend', T('Sommets descendants', 'Falling highs'))],
    marks: [],
    def: T("Compression où le support reste horizontal tandis que les sommets baissent : la pression vendeuse augmente sur un plancher.", "Compression where support stays horizontal while highs fall: selling pressure builds on a floor."),
    struct: T("Un support plat testé plusieurs fois et une ligne de résistance descendante qui se rapproche.", "A flat support tested several times and a falling resistance line closing in."),
    ident: [T("Au moins deux creux sur le même support.", "At least two lows on the same support."), T("Au moins deux sommets de plus en plus bas.", "At least two lower and lower highs."), T("Sortie par cassure du support.", "Exit by a break of the support.")],
    ctx: T("Souvent vu en tendance baissière comme pause de continuation.", "Often seen in a downtrend as a continuation pause."),
    interp: T("Une cassure du support vers le bas est le scénario classique ; une cassure de la ligne descendante vers le haut l'invalide.", "A downward break of the support is the classic scenario; an upward break of the falling line invalidates it."),
    err: [T("Vendre avant la cassure du support.", "Selling before the support breaks."), T("Ignorer un rebond haussier possible.", "Ignoring a possible bullish bounce."), T("Confondre avec un simple range.", "Confusing it with a simple range.")],
    ex: T("Support à 100 testé trois fois, sommets à 120, 112 puis 106 : une clôture sous 100 confirme.", "Support at 100 tested three times, highs at 120, 112 then 106: a close below 100 confirms."),
    x: Q('mcq', T("Dans un triangle descendant, les sommets sont…", "In a descending triangle, the highs are…"),
      [T("de plus en plus bas", "lower and lower"), T("de plus en plus hauts", "higher and higher"), T("identiques", "identical")], 0,
      T("Les sommets baissent vers un support plat.", "Highs fall toward a flat support.")) },
  { id: 'sym-triangle', n: T('Triangle symétrique', 'Symmetrical Triangle'), c: 'continuation', lvl: 3,
    pts: [[0, 45], [12, 85], [26, 30], [38, 72], [50, 42], [60, 62], [70, 50], [78, 58], [90, 75], [100, 88]],
    lines: [L2([12, 85], [78, 58], 'res', T('Sommets descendants', 'Falling highs')), L2([26, 30], [70, 50], 'sup', T('Creux montants', 'Rising lows'))],
    marks: [],
    def: T("Compression où les sommets baissent et les creux montent : les deux lignes convergent vers un point.", "Compression where highs fall and lows rise: both lines converge to a point."),
    struct: T("Une ligne descendante au-dessus du prix et une ligne ascendante en dessous.", "A falling line above price and a rising line below."),
    ident: [T("Au moins deux sommets et deux creux touchant les lignes.", "At least two highs and two lows touching the lines."), T("Volatilité qui se contracte.", "Contracting volatility."), T("Sortie dans un sens ou dans l'autre.", "Exit in one direction or the other.")],
    ctx: T("Le triangle est neutre avant la cassure : le contexte et la tendance précédente aident à hiérarchiser les scénarios.", "The triangle is neutral before the break: context and the previous trend help rank scenarios."),
    interp: T("On attend la sortie de l'une des deux lignes. La direction n'est connue qu'après la cassure ; une sortie trop tardive perd son intérêt.", "Wait for one of the two lines to break. The direction is only known after the break; an exit too late loses its interest."),
    err: [T("Parier sur une direction avant la cassure.", "Betting on a direction before the break."), T("Ignorer les fausses cassures.", "Ignoring false breakouts."), T("Prendre une cassure tardive, près du sommet du triangle.", "Taking a late break close to the apex.")],
    ex: T("Sommets à 120, 114, 109 et creux à 100, 103, 106 : le prix sort au-dessus de la ligne descendante.", "Highs at 120, 114, 109 and lows at 100, 103, 106: price exits above the falling line."),
    x: Q('tf', T("Un triangle symétrique annonce toujours une hausse.", "A symmetrical triangle always announces a rise."), null, 1,
      T("Faux : il est neutre avant la cassure.", "False: it is neutral before the break.")) },
  { id: 'flag', n: T('Flag', 'Flag'), c: 'continuation', lvl: 3,
    pts: [[0, 25], [8, 30], [22, 75], [30, 66], [36, 72], [44, 62], [50, 68], [58, 58], [72, 82], [86, 92], [100, 102]],
    lines: [L2([22, 75], [58, 64], 'trend', T('Flag', 'Flag')), L2([30, 66], [58, 58], 'trend')],
    marks: [],
    def: T("Pause de continuation : après un mouvement impulsif (le mât), le prix consolide dans un petit canal incliné légèrement contre la tendance.", "Continuation pause: after an impulsive move (the pole), price consolidates in a small channel slightly sloped against the trend."),
    struct: T("Un mât rapide, puis deux lignes presque parallèles contenant la consolidation.", "A fast pole, then two nearly parallel lines containing the consolidation."),
    ident: [T("Mouvement impulsif net avant la figure.", "A clear impulsive move before the figure."), T("Consolidation courte et inclinée.", "A short, sloped consolidation."), T("Sortie dans le sens du mât.", "Exit in the direction of the pole.")],
    ctx: T("Plus cohérent dans une tendance établie. Une consolidation trop longue perd son caractère de flag.", "More coherent in an established trend. A consolidation that lasts too long loses its flag character."),
    interp: T("La sortie dans le sens du mât est le scénario de continuation. Une sortie inverse invalide la lecture.", "An exit in the direction of the pole is the continuation scenario. An opposite exit invalidates the reading."),
    err: [T("Appeler flag une consolidation sans mât.", "Calling a flag a consolidation with no pole."), T("Entrer au milieu du canal.", "Entering in the middle of the channel."), T("Stop trop serré dans le bruit.", "A stop too tight inside the noise.")],
    ex: T("Hausse de 100 à 130, puis léger repli entre 125 et 118, puis sortie au-dessus de 128.", "A rise from 100 to 130, then a slight pullback between 125 and 118, then an exit above 128."),
    x: Q('mcq', T("Quel élément précède un flag ?", "What precedes a flag?"),
      [T("Un mouvement impulsif (le mât)", "An impulsive move (the pole)"), T("Un range étroit", "A narrow range"), T("Un gap de week-end obligatoire", "A mandatory weekend gap")], 0,
      T("Sans mât, il n'y a pas de flag.", "Without a pole there is no flag.")) },
  { id: 'pennant', n: T('Pennant', 'Pennant'), c: 'continuation', lvl: 3,
    pts: [[0, 25], [8, 30], [22, 80], [30, 66], [36, 76], [44, 68], [50, 74], [56, 71], [70, 88], [86, 97], [100, 106]],
    lines: [L2([22, 80], [56, 72], 'trend'), L2([30, 66], [56, 71], 'trend')],
    marks: [],
    def: T("Comme le flag, une pause après un mouvement impulsif, mais la consolidation prend la forme d'un petit triangle symétrique.", "Like the flag, a pause after an impulsive move, but the consolidation takes the shape of a small symmetrical triangle."),
    struct: T("Un mât, puis deux lignes convergentes qui enserrent une consolidation courte.", "A pole, then two converging lines enclosing a short consolidation."),
    ident: [T("Mât net et rapide.", "A clear, fast pole."), T("Consolidation courte qui se contracte.", "A short, contracting consolidation."), T("Sortie dans le sens du mât.", "Exit in the direction of the pole.")],
    ctx: T("Même logique que le flag : dans une tendance établie, avec des volumes plus calmes pendant la consolidation.", "Same logic as the flag: in an established trend, with calmer volume during the consolidation."),
    interp: T("Une cassure dans le sens du mât est le scénario de continuation ; une cassure inverse invalide.", "A break in the direction of the pole is the continuation scenario; an opposite break invalidates."),
    err: [T("Confondre avec un triangle plus long.", "Confusing it with a longer triangle."), T("Agir sans confirmation.", "Acting with no confirmation."), T("Ne pas prévoir de fausse cassure.", "Not planning for a false break.")],
    ex: T("Hausse de 100 à 130, puis contraction entre 126 et 122, puis sortie au-dessus de 127.", "A rise from 100 to 130, then contraction between 126 and 122, then an exit above 127."),
    x: Q('def', T("Un pennant se distingue d'un flag par…", "A pennant differs from a flag by…"),
      [T("une consolidation en petit triangle", "a consolidation shaped as a small triangle"), T("l'absence de mât", "the absence of a pole"), T("un volume nul", "zero volume")], 0,
      T("Flag = petit canal ; pennant = petit triangle.", "Flag = small channel; pennant = small triangle.")) },
  { id: 'wedge', n: T('Wedge (biseau)', 'Wedge'), c: 'continuation', lvl: 3,
    pts: [[0, 30], [14, 60], [24, 45], [34, 70], [44, 60], [54, 78], [62, 72], [72, 84], [84, 60], [100, 40]],
    lines: [L2([14, 60], [72, 86], 'res', T('Ligne haute', 'Upper line')), L2([24, 45], [64, 74], 'sup', T('Ligne basse', 'Lower line'))],
    marks: [],
    def: T("Deux lignes convergentes orientées dans le même sens. Un wedge montant est souvent lu comme un essoufflement de la hausse, un wedge descendant comme un essoufflement de la baisse.", "Two converging lines pointing the same way. A rising wedge is often read as exhaustion of the rise, a falling wedge as exhaustion of the fall."),
    struct: T("Sommets et creux évoluent dans le même sens mais avec des pentes différentes, ce qui resserre la figure.", "Highs and lows move the same way with different slopes, which tightens the figure."),
    ident: [T("Deux lignes de pentes différentes qui convergent.", "Two lines of different slopes that converge."), T("Amplitude des mouvements qui diminue.", "Decreasing amplitude of moves."), T("Cassure de la ligne opposée à la pente.", "Break of the line opposite to the slope.")],
    ctx: T("La lecture dépend de la tendance précédente : dans une hausse, un wedge montant est plus souvent vu comme un signe de faiblesse.", "The reading depends on the previous trend: in a rise, a rising wedge is more often seen as a sign of weakness."),
    interp: T("La cassure de la ligne basse d'un wedge montant est le scénario baissier classique. Sans cassure, le prix peut continuer à monter dans la figure.", "The break of the lower line of a rising wedge is the classic bearish scenario. Without a break, price may keep rising inside the figure."),
    err: [T("Confondre un wedge avec un canal montant.", "Confusing a wedge with a rising channel."), T("Anticiper la cassure.", "Anticipating the break."), T("Ignorer la tendance de fond.", "Ignoring the underlying trend.")],
    ex: T("Sommets à 108, 112, 115 et creux à 100, 106, 110 : le prix casse la ligne basse et clôture à 104.", "Highs at 108, 112, 115 and lows at 100, 106, 110: price breaks the lower line and closes at 104."),
    x: Q('tf', T("Dans un wedge, les deux lignes sont parallèles.", "In a wedge, both lines are parallel."), null, 1,
      T("Faux : elles convergent, c'est ce qui distingue le wedge d'un canal.", "False: they converge, which distinguishes a wedge from a channel.")) },
  { id: 'breakout', n: T('Breakout', 'Breakout'), c: 'breakout', lvl: 2,
    pts: [[0, 30], [12, 60], [24, 40], [36, 60], [48, 42], [60, 60], [72, 88], [86, 100], [100, 110]],
    lines: [L2([8, 60], [70, 60], 'res', T('Résistance', 'Resistance'))],
    marks: [{ x: 72, y: 88, t: 'Breakout' }],
    def: T("Franchissement net d'un support ou d'une résistance après plusieurs tests, suggérant un changement de rapport de forces.", "Clear crossing of a support or resistance after several tests, suggesting a change in balance of power."),
    struct: T("Un niveau testé plusieurs fois, puis une bougie qui le franchit nettement, idéalement avec une clôture au-delà.", "A level tested several times, then a candle that clearly crosses it, ideally with a close beyond."),
    ident: [T("Niveau clair et respecté avant la cassure.", "A clear level respected before the break."), T("Clôture au-delà du niveau.", "Close beyond the level."), T("Volume plus élevé (indice, pas garantie).", "Higher volume (a hint, not a guarantee).")],
    ctx: T("Plus fiable quand la structure et le timeframe supérieur vont dans le même sens.", "More reliable when structure and the higher timeframe point the same way."),
    interp: T("La cassure suggère que l'offre est absorbée. Un retour sous le niveau invalide la cassure (fakeout).", "The break suggests supply is absorbed. A return under the level invalidates the break (fakeout)."),
    err: [T("Entrer sur la simple mèche qui dépasse.", "Entering on a mere wick that exceeds."), T("Ne pas prévoir la fausse cassure.", "Not planning for a false break."), T("Ignorer la distance au stop.", "Ignoring the distance to the stop.")],
    ex: T("Résistance à 120 rejetée trois fois ; une bougie clôture à 123 avec un volume supérieur à la moyenne.", "Resistance at 120 rejected three times; a candle closes at 123 on above-average volume."),
    x: Q('comp', T("Quel élément renforce une cassure ?", "What strengthens a breakout?"),
      [T("Une clôture nette au-delà du niveau", "A clear close beyond the level"), T("Une simple mèche qui dépasse", "A mere wick that exceeds"), T("Un spread plus élevé", "A wider spread")], 0,
      T("La clôture est plus significative qu'un dépassement de mèche.", "A close is more meaningful than a wick exceeding.")) },
  { id: 'pullback', n: T('Pullback', 'Pullback'), c: 'breakout', lvl: 2,
    pts: [[0, 30], [15, 60], [28, 45], [40, 62], [54, 85], [66, 64], [78, 90], [90, 100], [100, 108]],
    lines: [L2([15, 61], [100, 61], 'res', T('Niveau cassé', 'Broken level'))],
    marks: [{ x: 54, y: 85, t: 'Breakout' }, { x: 66, y: 64, t: 'Pullback', pos: 'b' }],
    def: T("Retour du prix vers un niveau qu'il vient de franchir, souvent pour le tester avant de reprendre le mouvement.", "Return of price toward a level it just crossed, often to test it before resuming the move."),
    struct: T("Une cassure, un retour sur l'ancien niveau (qui change de rôle), puis une reprise.", "A breakout, a return to the former level (which changes roles), then a resumption."),
    ident: [T("Une cassure préalable nette.", "A clear prior breakout."), T("Le retour s'arrête sur l'ancien niveau.", "The return stops at the former level."), T("Signe de reprise (rejet, clôture).", "A sign of resumption (rejection, close).")],
    ctx: T("Le stop se place juste sous la zone retestée, ce qui peut donner un meilleur R/R que l'entrée sur la cassure.", "The stop goes just below the retested zone, which can give a better R/R than entering on the breakout."),
    interp: T("Si l'ancien niveau tient, le scénario de continuation est conforté. S'il cède, la cassure était probablement un fakeout.", "If the former level holds, the continuation scenario is reinforced. If it gives way, the break was probably a fakeout."),
    err: [T("Croire que le retour est systématique.", "Believing the return is systematic."), T("Acheter sans signe de rejet.", "Buying with no sign of rejection."), T("Stop trop proche du niveau.", "A stop too close to the level.")],
    ex: T("Après la cassure de 120, le prix redescend à 121, rebondit et repart à 128.", "After the break of 120, price falls back to 121, bounces and goes on to 128."),
    x: Q('mcq', T("Après un pullback réussi, l'ancienne résistance joue le rôle de…", "After a successful pullback, the former resistance plays the role of…"),
      [T("support", "support"), T("spread", "spread"), T("stop-loss", "stop-loss")], 0,
      T("C'est l'inversion de rôle.", "This is role reversal.")) },
  { id: 'range-breakout', n: T('Range Breakout', 'Range Breakout'), c: 'breakout', lvl: 2,
    pts: [[0, 55], [10, 70], [20, 42], [30, 70], [40, 40], [50, 68], [60, 42], [70, 70], [78, 90], [90, 98], [100, 106]],
    lines: [L2([5, 70], [75, 70], 'res', T('Haut du range', 'Range high')), L2([15, 41], [75, 41], 'sup', T('Bas du range', 'Range low'))],
    marks: [{ x: 78, y: 90, t: 'Breakout' }],
    def: T("Sortie du prix d'un range, par le haut ou par le bas, après une phase d'oscillation entre deux niveaux.", "Exit of price from a range, upward or downward, after a phase of oscillation between two levels."),
    struct: T("Un haut et un bas de range bien définis, plusieurs rebonds, puis une clôture au-delà de l'un d'eux.", "A well-defined range high and low, several bounces, then a close beyond one of them."),
    ident: [T("Au moins deux touches de chaque borne.", "At least two touches of each boundary."), T("Clôture hors du range.", "Close outside the range."), T("Retest éventuel de la borne franchie.", "Possible retest of the crossed boundary.")],
    ctx: T("Un long range peut accumuler beaucoup d'ordres, mais aussi produire de nombreux fakeouts.", "A long range can accumulate many orders but also produce many fakeouts."),
    interp: T("La clôture hors du range est un premier signal ; le retour dans le range invalide. Certains traders estiment un objectif à partir de la hauteur du range.", "A close outside the range is a first signal; a return into the range invalidates. Some traders estimate a target from the range height."),
    err: [T("Anticiper la sortie au milieu du range.", "Anticipating the exit in the middle of the range."), T("Confondre une mèche avec une vraie sortie.", "Mistaking a wick for a real exit."), T("Ne pas définir la taille de position.", "Not defining position size.")],
    ex: T("Range 100–120 pendant des semaines, puis clôture à 123 et retest de 120.", "Range 100–120 for weeks, then a close at 123 and a retest of 120."),
    x: Q('mcq', T("Qu'est-ce qui invalide généralement un range breakout haussier ?", "What generally invalidates a bullish range breakout?"),
      [T("Un retour de clôture dans le range", "A close back inside the range"), T("Une bougie haussière", "A bullish candle"), T("Un volume plus fort", "Stronger volume")], 0,
      T("Un retour dans le range indique un possible fakeout.", "A return into the range indicates a possible fakeout.")) }
];
const PAT_BY_ID = {};
PATTERNS.forEach(p => { PAT_BY_ID[p.id] = p; });

/* =====================================================================
   9. PRACTICE : 8 séries d'exercices (graphiques fictifs)
   ===================================================================== */
const abc = (a, b, c, extra) => [
  { y: a, cls: 'a', label: 'A', side: 'l' }, { y: b, cls: 'b', label: 'B', side: 'l' }, { y: c, cls: 'c', label: 'C', side: 'l' }
].concat(extra || []);
const LINE_OPTS = [T('Ligne A', 'Line A'), T('Ligne B', 'Line B'), T('Ligne C', 'Line C')];
const TREND_OPTS = [T('Tendance haussière', 'Uptrend'), T('Tendance baissière', 'Downtrend'), T('Range', 'Range')];

const PRACTICE = [
  { id: 'support', ic: 'shield',
    t: T('Support', 'Support'), d: T("Repère les zones où les acheteurs sont déjà intervenus.", 'Spot the zones where buyers already stepped in.'),
    q: [
      Q('id', T("Quelle ligne représente le support le plus plausible ?", 'Which line represents the most plausible support?'), LINE_OPTS, 0,
        T("Le prix a rebondi trois fois sur la ligne A : c'est la zone de support la mieux testée. B coupe le mouvement en plein milieu ; C est proche des sommets.", 'Price bounced three times on line A: the best-tested support zone. B cuts through the middle of the move; C is close to the highs.'),
        { closes: SER.bounce, h: 170, lines: abc(100, 108, 116), label: T('Graphique fictif avec trois lignes candidates', 'Fictional chart with three candidate lines') }),
      Q('comp', T("Un support est cassé nettement, puis le prix revient sous ce niveau. Il devient potentiellement…", 'A support is clearly broken, then price returns under that level. It potentially becomes…'),
        [T('une résistance', 'a resistance'), T('un support renforcé', 'a stronger support'), T('un spread', 'a spread')], 0,
        T("C'est l'inversion de rôle : l'ancien plancher peut devenir un plafond.", 'This is role reversal: the former floor can become a ceiling.'))
    ] },
  { id: 'resistance', ic: 'flag',
    t: T('Résistance', 'Resistance'), d: T("Repère les zones où les vendeurs ont fait reculer le prix.", 'Spot the zones where sellers pushed price back.'),
    q: [
      Q('id', T("Quelle ligne représente la résistance la plus plausible ?", 'Which line represents the most plausible resistance?'), LINE_OPTS, 2,
        T("Le prix a été rejeté trois fois autour de la ligne C : c'est la zone de résistance la plus visible.", 'Price was rejected three times around line C: the most visible resistance zone.'),
        { closes: SER.ceil, h: 170, lines: abc(100, 108, 115), label: T('Graphique fictif avec trois lignes candidates', 'Fictional chart with three candidate lines') }),
      TF(T("Après une cassure nette, une ancienne résistance peut jouer le rôle de support.", 'After a clear break, a former resistance can act as a support.'), true,
        T("C'est l'inversion de rôle, une idée très utilisée (mais jamais garantie).", 'This is role reversal, a widely used idea (but never guaranteed).'))
    ] },
  { id: 'trend', ic: 'chart',
    t: T('Tendance', 'Trend'), d: T("Identifie la structure dominante : hausse, baisse ou range.", 'Identify the dominant structure: up, down or range.'),
    q: [
      Q('id', T("Quelle structure domine sur ce graphique ?", 'Which structure dominates on this chart?'), TREND_OPTS, 0,
        T("Sommets et creux de plus en plus hauts : tendance haussière.", 'Higher highs and higher lows: uptrend.'),
        { closes: SER.up, h: 160, label: T('Graphique fictif à identifier', 'Fictional chart to identify') }),
      Q('id', T("Et sur celui-ci ?", 'And on this one?'), TREND_OPTS, 1,
        T("Sommets et creux de plus en plus bas : tendance baissière.", 'Lower highs and lower lows: downtrend.'),
        { closes: SER.down, h: 160, label: T('Graphique fictif à identifier', 'Fictional chart to identify') })
    ] },
  { id: 'range', ic: 'layers',
    t: T('Range', 'Range'), d: T("Reconnais un marché latéral et ses bornes.", 'Recognise a sideways market and its boundaries.'),
    q: [
      Q('id', T("Ce marché est plutôt…", 'This market is mostly…'), TREND_OPTS, 2,
        T("Le prix oscille entre deux niveaux sans direction claire : c'est un range.", 'Price oscillates between two levels with no clear direction: a range.'),
        { closes: SER.range, h: 160, lines: [{ y: 120, cls: 'res' }, { y: 100, cls: 'sup' }], label: T('Graphique fictif à identifier', 'Fictional chart to identify') }),
      Q('mcq', T("Quel élément suggère une possible sortie de range ?", 'Which element suggests a possible range exit?'),
        [T("Une clôture nette au-delà d'une borne, idéalement confirmée", 'A clear close beyond a boundary, ideally confirmed'), T("Une bougie au milieu du range", 'A candle in the middle of the range'), T("Un spread plus faible", 'A lower spread')], 0,
        T("Une clôture hors de la borne est un premier signal ; la confirmation (retest) réduit le risque de fakeout.", 'A close beyond the boundary is a first signal; confirmation (retest) reduces fakeout risk.'))
    ] },
  { id: 'pattern', ic: 'spark',
    t: T('Pattern', 'Pattern'), d: T("Reconnais les figures à partir de leur forme.", 'Recognise figures from their shape.'),
    q: [
      Q('id', T("Quelle figure voit-on ?", 'Which figure is shown?'), [T('Double Top', 'Double Top'), T('Double Bottom', 'Double Bottom'), T('Triangle ascendant', 'Ascending triangle')], 0,
        T("Deux sommets au même niveau puis cassure vers le bas : double top.", 'Two highs at the same level then a downward break: double top.'),
        { k: 'pat', id: 'double-top', labels: false, label: T('Figure fictive à identifier', 'Fictional figure to identify') }),
      Q('id', T("Et celle-ci ?", 'And this one?'), ['Head & Shoulders', 'Inverse Head & Shoulders', 'Pennant'], 1,
        T("Trois creux dont le central est le plus bas : tête-épaules inversé.", 'Three lows with the central one the lowest: inverse head & shoulders.'),
        { k: 'pat', id: 'inverse-hs', labels: false, label: T('Figure fictive à identifier', 'Fictional figure to identify') }),
      Q('id', T("Et celle-ci ?", 'And this one?'), [T('Triangle ascendant', 'Ascending triangle'), T('Flag', 'Flag'), T('Wedge', 'Wedge')], 0,
        T("Résistance plate et creux montants : triangle ascendant.", 'Flat resistance and rising lows: ascending triangle.'),
        { k: 'pat', id: 'asc-triangle', labels: false, label: T('Figure fictive à identifier', 'Fictional figure to identify') })
    ] },
  { id: 'invalidation', ic: 'alert',
    t: T('Invalidation', 'Invalidation'), d: T("Place l'invalidation là où l'idée n'a plus de sens.", 'Place the invalidation where the idea no longer makes sense.'),
    q: [
      Q('id', T("Scénario : achat sur retest de l'ancienne résistance (110) après une cassure. Quelle ligne est l'invalidation la plus cohérente ?", 'Scenario: buying the retest of the former resistance (110) after a breakout. Which line is the most coherent invalidation?'), LINE_OPTS, 1,
        T("B, juste sous la zone retestée : si le prix clôture dessous, la cassure est probablement un fakeout. A est au-dessus du prix (aucun sens pour un achat) ; C est si loin que le risque devient disproportionné.", 'B, just under the retested zone: if price closes below, the breakout is probably a fakeout. A is above price (meaningless for a buy); C is so far that risk becomes disproportionate.'),
        { closes: SER.brk, h: 175, lines: abc(121, 106, 96, [{ y: 110, cls: 'res', side: 'r' }]), label: T('Graphique fictif avec trois niveaux candidats', 'Fictional chart with three candidate levels') }),
      Q('def', T("L'invalidation d'un scénario est…", 'The invalidation of a scenario is…'),
        [T("le niveau où le scénario n'a plus de sens", 'the level where the scenario no longer makes sense'), T("le niveau où l'on veut prendre son gain", 'the level where you want to take profit'), T("un montant fixe de 10 pips", 'a fixed amount of 10 pips')], 0,
        T("C'est là que le stop se place : au niveau où l'idée est démentie.", 'This is where the stop goes: at the level where the idea is refuted.'))
    ] },
  { id: 'rr', ic: 'calc',
    t: T('Risque/rendement', 'Risk/reward'), d: T("Calcule des ratios et l'espérance sur des cas simples.", 'Compute ratios and expectancy on simple cases.'),
    q: [
      Q('comp', T("Entrée 50, stop 48, objectif 53. Quel ratio risque/rendement ?", 'Entry 50, stop 48, target 53. What risk/reward ratio?'),
        ['1:1', '1,5:1', '2:1', '3:1'], 1,
        T("Risque = 2, gain = 3 → R/R = 3 ÷ 2 = 1,5.", 'Risk = 2, gain = 3 → R/R = 3 ÷ 2 = 1.5.')),
      Q('comp', T("Entrée 80, stop 76, objectif 92. Quel ratio risque/rendement ?", 'Entry 80, stop 76, target 92. What risk/reward ratio?'),
        ['2:1', '3:1', '4:1', '1:3'], 1,
        T("Risque = 4, gain = 12 → R/R = 3.", 'Risk = 4, gain = 12 → R/R = 3.')),
      Q('comp', T("Taux de réussite 40 %, gains de 3R, pertes de 1R. L'espérance est…", 'Win rate 40%, wins of 3R, losses of 1R. The expectancy is…'),
        [T('positive (+0,6R)', 'positive (+0.6R)'), T('négative (−0,6R)', 'negative (−0.6R)'), T('nulle', 'zero')], 0,
        T("0,4 × 3 − 0,6 × 1 = 1,2 − 0,6 = +0,6R par trade (sur l'échantillon, sans garantie).", '0.4 × 3 − 0.6 × 1 = 1.2 − 0.6 = +0.6R per trade (on the sample, no guarantee).'))
    ] },
  { id: 'scenario', ic: 'route',
    t: T('Scénario', 'Scenario'), d: T("Choisis la démarche la plus cohérente avec une méthode structurée.", 'Choose the approach most consistent with a structured method.'),
    q: [
      Q('comp', T("Le prix approche une résistance journalière dans une tendance haussière. Aucun signe de réaction n'apparaît encore. Quelle démarche est la plus cohérente ?", 'Price approaches a daily resistance in an uptrend. No sign of reaction yet. Which approach is the most coherent?'),
        [T("Attendre une réaction ou une cassure confirmée, avec une invalidation définie", 'Wait for a reaction or a confirmed break, with a defined invalidation'), T("Vendre tout de suite : la résistance est certaine de tenir", 'Sell right away: the resistance is certain to hold'), T("Acheter avec un stop très large pour ne pas être sorti", 'Buy with a very wide stop so as not to be stopped out')], 0,
        T("Une méthode structurée réagit à ce qui se passe et définit l'invalidation à l'avance, sans supposer une certitude.", 'A structured method reacts to what happens and defines the invalidation in advance, without assuming certainty.')),
      Q('comp', T("Après trois pertes consécutives, toutes conformes au plan, que suggère une méthode structurée ?", 'After three consecutive losses, all consistent with the plan, what does a structured method suggest?'),
        [T("Respecter le plan et la taille, puis relire le journal", 'Follow the plan and size, then review the journal'), T("Doubler la taille pour se refaire", 'Double the size to recover'), T("Supprimer les stops", 'Remove the stops')], 0,
        T("Une série de pertes normales n'invalide pas une méthode. Augmenter le risque pour se refaire est un piège classique.", 'A run of normal losses does not invalidate a method. Raising risk to recover is a classic trap.')),
      Q('comp', T("Une annonce majeure est prévue dans 10 minutes et le marché n'a pas de structure claire. Que dit une condition de non-trading ?", 'A major announcement is due in 10 minutes and the market has no clear structure. What does a no-trade condition say?'),
        [T("Rester à l'écart peut être la décision cohérente", 'Staying aside can be the coherent decision'), T("Entrer vite avant l'annonce", 'Enter quickly before the announcement'), T("Augmenter le levier", 'Increase leverage')], 0,
        T("Ne pas trader est une décision : contexte confus + annonce = bonne raison d'attendre.", 'Not trading is a decision: unclear context + announcement = good reason to wait.'))
    ] }
];

/* =====================================================================
   10. MARCHÉS, OUTILS, FAQ
   ===================================================================== */
const MARKETS = [
  { id: 'forex', ic: 'globe', t: T('Forex', 'Forex'),
    d: T("Le marché des changes : on échange des devises par paires.", 'The currency market: currencies are traded in pairs.'),
    f: [T('Paires de devises (EUR/USD, GBP/JPY…)', 'Currency pairs (EUR/USD, GBP/JPY…)'), T('Ouvert en continu du lundi au vendredi', 'Open continuously Monday to Friday'), T('Très liquide sur les paires majeures', 'Very liquid on major pairs'), T("Sensible aux taux d'intérêt et aux banques centrales", 'Sensitive to interest rates and central banks')] },
  { id: 'crypto', ic: 'spark', t: T('Crypto', 'Crypto'),
    d: T("Les actifs numériques, échangés en continu sur des plateformes.", 'Digital assets, traded continuously on platforms.'),
    f: [T('Accessible 24h/24 et 7j/7', 'Available 24/7'), T('Volatilité souvent élevée', 'Often highly volatile'), T('Des milliers d\'actifs, liquidité inégale', 'Thousands of assets, uneven liquidity'), T('Risques propres : plateformes, sécurité, régulation', 'Specific risks: platforms, security, regulation')] },
  { id: 'stocks', ic: 'chart', t: T('Actions', 'Stocks'),
    d: T("Des parts d'entreprises cotées en bourse.", 'Shares of companies listed on an exchange.'),
    f: [T("Parts du capital d'une entreprise", "Shares of a company's capital"), T('Horaires d\'ouverture de la bourse', 'Exchange opening hours'), T('Réagissent aux résultats et au secteur', 'React to earnings and sector'), T('Actualités d\'entreprise très influentes', 'Company news is highly influential')] },
  { id: 'indices', ic: 'layers', t: T('Indices', 'Indices'),
    d: T("Des paniers d'actions qui résument un marché.", 'Baskets of stocks that summarise a market.'),
    f: [T("Paniers d'actions (S&P 500, CAC 40…)", 'Baskets of stocks (S&P 500, CAC 40…)'), T("Vue d'ensemble d'un marché ou d'un pays", 'Overview of a market or country'), T('Moins sensibles à une seule entreprise', 'Less sensitive to a single company'), T('Accessibles via ETF ou dérivés selon le courtier', 'Accessible via ETFs or derivatives depending on the broker')] }
];

const TOOLS = [
  { id: 'tradingview', ic: 'chart', name: 'TradingView', url: 'https://www.tradingview.com/',
    d: T("Plateforme de graphiques utilisable depuis le navigateur, avec de nombreux outils de dessin et d'analyse.", 'Browser-based charting platform with many drawing and analysis tools.'),
    use: T("Analyser des graphiques, tracer supports et résistances, tester visuellement ses idées et suivre plusieurs marchés.", 'Analyse charts, draw support and resistance, visually test ideas and follow several markets.'),
    aud: T('Débutants à avancés', 'Beginners to advanced'),
    feat: [T('Graphiques en bougies et multi-timeframe', 'Candlestick and multi-timeframe charts'), T('Outils de dessin (lignes, zones, tendances)', 'Drawing tools (lines, zones, trends)'), T('Indicateurs intégrés', 'Built-in indicators'), T('Listes de suivi et alertes de prix (selon le plan)', 'Watchlists and price alerts (depending on plan)')],
    start: [T("Ouvre le site et cherche un symbole (par exemple EURUSD ou BTCUSD).", 'Open the site and search a symbol (for example EURUSD or BTCUSD).'), T("Choisis le type de graphique « Bougies » et un timeframe.", 'Choose the “Candles” chart type and a timeframe.'), T("Trace une ligne horizontale avec la barre d'outils de gauche.", 'Draw a horizontal line with the left toolbar.')],
    tuto: [T("Cherche un instrument que tu suis (un seul pour commencer).", 'Search an instrument you follow (only one to start).'), T("Affiche-le en bougies sur un timeframe journalier.", 'Display it as candles on a daily timeframe.'), T("Repère les 2 ou 3 zones où le prix a réagi plusieurs fois et trace-les comme zones ou lignes horizontales.", 'Spot the 2 or 3 zones where price reacted several times and draw them as zones or horizontal lines.'), T("Passe sur un timeframe inférieur (H4 puis H1) et vérifie si ces zones restent pertinentes.", 'Switch to a lower timeframe (H4 then H1) and check whether these zones remain relevant.'), T("Note dans ton journal la structure (tendance ou range) et ce qui invaliderait ton idée.", 'Note in your journal the structure (trend or range) and what would invalidate your idea.')],
    mission: T("Mission : trace un support et une résistance sur un graphique journalier, puis compare-les avec ceux que tu vois en H4.", 'Mission: draw a support and a resistance on a daily chart, then compare them with those you see on H4.') },
  { id: 'investing', ic: 'globe', name: 'Investing.com', url: 'https://www.investing.com/',
    d: T("Portail d'informations financières : cotations, actualités, données économiques et calendrier économique.", 'Financial information portal: quotes, news, economic data and economic calendar.'),
    use: T("Connaître le contexte : annonces économiques à venir, actualité des marchés et cotations de nombreux instruments.", 'Know the context: upcoming economic announcements, market news and quotes for many instruments.'),
    aud: T('Débutants à intermédiaires', 'Beginners to intermediate'),
    feat: [T('Calendrier économique', 'Economic calendar'), T('Cotations (devises, indices, actions, matières premières, crypto)', 'Quotes (currencies, indices, stocks, commodities, crypto)'), T('Actualités et analyses', 'News and analysis'), T('Pages dédiées aux instruments', 'Dedicated instrument pages')],
    start: [T("Ouvre le site et repère la section « calendrier économique ».", 'Open the site and find the “economic calendar” section.'), T("Filtre par pays et par niveau d'importance des annonces.", 'Filter by country and by announcement importance.'), T("Note les annonces majeures de la semaine avant de préparer tes scénarios.", 'Note the week\'s major announcements before preparing your scenarios.')],
    tuto: [T("Ouvre le calendrier économique de la semaine.", 'Open the economic calendar for the week.'), T("Filtre sur le pays lié à ton instrument (par exemple la zone euro pour EUR/USD).", 'Filter on the country linked to your instrument (for example the eurozone for EUR/USD).'), T("Repère les annonces d'importance élevée et leur heure locale.", 'Spot high-importance announcements and their local time.'), T("Marque ces horaires sur ton graphique ou dans ton journal : ce sont des moments à risque de volatilité et de slippage.", 'Mark these times on your chart or in your journal: they are moments of volatility and slippage risk.'), T("Décide à l'avance si ta méthode t'autorise à trader autour de ces annonces.", 'Decide in advance whether your method allows trading around these announcements.')],
    mission: T("Mission : liste les 3 annonces les plus importantes de la semaine pour ton instrument et écris ta règle de non-trading associée.", 'Mission: list the 3 most important announcements of the week for your instrument and write the associated no-trade rule.') },
  { id: 'coingecko', ic: 'spark', name: 'CoinGecko', url: 'https://www.coingecko.com/',
    d: T("Site de données sur les cryptomonnaies : prix, capitalisation, volumes et informations sur de nombreux projets.", 'Cryptocurrency data site: prices, market capitalisation, volumes and information on many projects.'),
    use: T("Comparer des cryptomonnaies, consulter capitalisation et volumes, et se documenter avant d'analyser un graphique.", 'Compare cryptocurrencies, check market cap and volumes, and research before analysing a chart.'),
    aud: T('Débutants à intermédiaires', 'Beginners to intermediate'),
    feat: [T('Prix, capitalisation et volumes', 'Prices, market cap and volumes'), T('Pages détaillées par actif', 'Detailed page per asset'), T('Catégories et classements', 'Categories and rankings'), T('Historique des prix', 'Price history')],
    start: [T("Ouvre le site et cherche une cryptomonnaie.", 'Open the site and search a cryptocurrency.'), T("Regarde sa capitalisation et son volume échangé sur 24h.", 'Look at its market cap and 24h traded volume.'), T("Compare avec deux autres actifs de taille différente.", 'Compare with two other assets of different size.')],
    tuto: [T("Cherche Bitcoin puis une cryptomonnaie de plus petite capitalisation.", 'Search Bitcoin then a smaller-cap cryptocurrency.'), T("Compare la capitalisation et le volume de chacune.", 'Compare the market cap and volume of each.'), T("Observe l'amplitude de leurs variations sur 7 jours et sur 1 an.", 'Observe the size of their moves over 7 days and 1 year.'), T("Note laquelle semble la plus volatile et ce que cela implique pour la taille de position.", 'Note which seems the most volatile and what that implies for position size.'), T("Retiens que les petits actifs peuvent être moins liquides : le slippage peut y être plus important.", 'Remember that smaller assets can be less liquid: slippage can be larger there.')],
    mission: T("Mission : compare la volatilité de deux cryptomonnaies sur 30 jours et déduis-en une taille de position prudente pour un même risque en %.", 'Mission: compare the volatility of two cryptocurrencies over 30 days and deduce a prudent position size for the same risk in %.') }
];

const FAQ = [
  { q: T("Qu'est-ce que THMTrade ?", 'What is THMTrade?'),
    a: T("THMTrade est une plateforme éducative dédiée à l'apprentissage du trading : cours interactifs, lexique, patterns, exercices pratiques et outils pour comprendre les marchés et construire sa propre méthode.", 'THMTrade is an educational platform dedicated to learning trading: interactive courses, glossary, patterns, practical exercises and tools to understand markets and build your own method.') },
  { q: T("THMTrade donne-t-il des conseils financiers ou des signaux ?", 'Does THMTrade give financial advice or signals?'),
    a: T("Non. THMTrade est purement éducatif : aucun signal, aucun conseil personnalisé, aucune promesse de gain. Les graphiques sont des illustrations pédagogiques fictives, pas des données de marché.", 'No. THMTrade is purely educational: no signals, no personalised advice, no promise of gains. Charts are fictional educational illustrations, not market data.') },
  { q: T("Le trading est-il risqué ?", 'Is trading risky?'),
    a: T("Oui. Le trading comporte un risque de perte, y compris de tout ou partie du capital, surtout avec du levier. Ne risque jamais un argent dont tu as besoin, et renseigne-toi auprès d'un professionnel agréé pour ta situation personnelle.", 'Yes. Trading carries a risk of loss, including of all or part of your capital, especially with leverage. Never risk money you need, and consult a licensed professional about your personal situation.') },
  { q: T("Le site est-il gratuit ?", 'Is the site free?'),
    a: T("Dans cette version de lancement, tout le contenu est accessible librement, y compris les contenus marqués Premium. Le Premium est présenté à titre d'aperçu : aucun paiement n'est actif.", 'In this launch version, all content is freely accessible, including content marked Premium. Premium is shown as a preview: no payment is active.') },
  { q: T("Ma progression est-elle sauvegardée ?", 'Is my progress saved?'),
    a: T("Oui, localement : leçons terminées, scores et langue sont enregistrés dans le stockage de ton navigateur (localStorage). Ils ne sont pas synchronisés entre appareils et disparaissent si tu vides les données du navigateur. Les comptes utilisateur viendront plus tard.", 'Yes, locally: completed lessons, scores and language are stored in your browser (localStorage). They are not synced across devices and disappear if you clear browser data. User accounts will come later.') },
  { q: T("Par quel marché commencer ?", 'Which market should I start with?'),
    a: T("Commence par le cours « Les fondamentaux du trading », puis choisis un seul marché et quelques instruments pour t'entraîner. Le choix dépend de tes horaires, de ta tolérance au risque et de ton objectif d'apprentissage.", 'Start with the “Trading fundamentals” course, then pick a single market and a few instruments to train on. The choice depends on your schedule, risk tolerance and learning goal.') },
  { q: T("Les graphiques du site sont-ils réels ?", 'Are the charts on the site real?'),
    a: T("Non. Tous les graphiques de THMTrade sont des illustrations pédagogiques fictives, générées pour expliquer un concept. Ils ne représentent aucun marché réel.", 'No. All THMTrade charts are fictional educational illustrations, generated to explain a concept. They do not represent any real market.') },
  { q: T("Quelle est la différence entre les cours et le Practice ?", 'What is the difference between courses and Practice?'),
    a: T("Les cours expliquent, avec des quiz après chaque leçon. Le Practice te fait pratiquer sur des exercices variés (support, résistance, tendance, patterns, risque/rendement, scénarios) et compte tes réussites.", 'Courses explain, with a quiz after every lesson. Practice has you train on varied exercises (support, resistance, trend, patterns, risk/reward, scenarios) and counts your successes.') },
  { q: T("Puis-je changer de langue ?", 'Can I change language?'),
    a: T("Oui : le sélecteur FR / EN en haut de page traduit l'interface et les contenus. Ton choix est mémorisé.", 'Yes: the FR / EN switch at the top translates the interface and content. Your choice is remembered.') }
];

/* =====================================================================
   11. INDEX, PROGRESSION ET COMPOSANTS PARTAGÉS
   ===================================================================== */
const COURSE_BY_ID = {};
const LESSON_BY_ID = {};
const ALL_LESSONS = [];
function buildIndex() {
  COURSES.forEach(c => {
    COURSE_BY_ID[c.id] = c;
    c.lessons.forEach((l, i) => { l.cid = c.id; l.idx = i; LESSON_BY_ID[l.id] = l; ALL_LESSONS.push(l); });
  });
}

const ans = v => v !== null && v !== undefined;
const isDone = lid => !!(state.lessons[lid] && state.lessons[lid].done);
const courseDur = c => c.lessons.reduce((s, l) => s + l.dur, 0);
function courseStats(c) {
  const total = c.lessons.length, done = c.lessons.filter(l => isDone(l.id)).length;
  return { total, done, pct: total ? Math.round(done / total * 100) : 0 };
}
function globalStats() {
  let total = 0, done = 0;
  COURSES.forEach(c => { const s = courseStats(c); total += s.total; done += s.done; });
  return { total, done, pct: total ? Math.round(done / total * 100) : 0 };
}
/** Leçon à reprendre : dernière visitée si non terminée, sinon première non terminée. */
function resumeLesson() {
  const last = state.last && LESSON_BY_ID[state.last];
  if (last && !isDone(last.id)) return last;
  return ALL_LESSONS.find(l => !isDone(l.id)) || null;
}
const hasStarted = () => ALL_LESSONS.some(l => isDone(l.id) || (state.quiz[l.id] && state.quiz[l.id].a && state.quiz[l.id].a.some(ans)));

/* --- Questions (quiz + practice + patterns) --- */
const correctIdx = q => q.a;
function qOptions(q) {
  if (q.type === 'tf') return [tr('tf.true'), tr('tf.false')];
  return q.o.map(L);
}
const letter = i => String.fromCharCode(65 + i);

/* --- Quiz de leçon --- */
function quizRec(lid) { return state.quiz[lid] || null; }
function quizAnswers(lid) { const r = quizRec(lid); return (r && r.a) || []; }
function quizScore(les) {
  const a = quizAnswers(les.id);
  return les.q.reduce((s, q, i) => s + (a[i] === correctIdx(q) ? 1 : 0), 0);
}
function quizDone(les) { const a = quizAnswers(les.id); return les.q.every((q, i) => ans(a[i])); }
function answerQuiz(lid, qi, oi) {
  const les = LESSON_BY_ID[lid];
  if (!les || !les.q[qi]) return false;
  const rec = state.quiz[lid] || (state.quiz[lid] = { a: [], best: 0, tot: les.q.length, tries: 0 });
  if (ans(rec.a[qi])) return false;
  rec.a[qi] = oi;
  if (quizDone(les)) {
    rec.best = Math.max(rec.best || 0, quizScore(les));
    rec.tot = les.q.length;
    rec.tries = (rec.tries || 0) + 1;
  }
  saveState();
  return true;
}
function retryQuiz(lid) {
  const rec = state.quiz[lid];
  if (rec) { rec.a = []; saveState(); }
}

/* --- Practice --- */
const pracRec = id => state.practice[id] || { best: 0, total: 0, attempts: 0, correct: 0, wrong: 0 };
function practiceTotals() {
  let correct = 0, wrong = 0, tried = 0;
  PRACTICE.forEach(p => {
    const r = state.practice[p.id];
    if (r) { correct += r.correct || 0; wrong += r.wrong || 0; if (r.attempts) tried++; }
  });
  const n = correct + wrong;
  return { correct, wrong, tried, n, acc: n ? Math.round(correct / n * 100) : 0 };
}

/* --- Composants de présentation --- */
const lvlBadge = n => `<span class="badge lvl-${n}">${t('lvl.' + n)}</span>`;
const premBadge = () => `<span class="badge prem" title="${t('prem.hint')}">${icon('crown')}${t('nav.premium')}</span>`;
const progressBar = (pct, label) => `<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="${esc(label || tr('progress'))}"><span style="--w:${pct}%"></span></div>`;
const cut = (s, n) => { s = String(s).replace(/\*\*/g, ''); if (s.length <= n) return s; const c = s.slice(0, n); return c.slice(0, Math.max(c.lastIndexOf(' '), 20)) + '…'; };
const rv = i => ` style="--d:${Math.min(i, 8) * 60}ms"`;
const crumbs = items => `<nav class="crumbs" aria-label="${t('crumbs')}"><ol>${items.map(it => it.href ? `<li><a href="${it.href}">${esc(it.t)}</a></li>` : `<li aria-current="page">${esc(it.t)}</li>`).join('')}</ol></nav>`;
const secHead = (title, lead, right) => `<div class="sec-head"><div><h2>${title}</h2>${lead ? `<p class="lead">${lead}</p>` : ''}</div>${right || ''}</div>`;
const riskNote = () => `<p class="risk-inline">${icon('alert')}<span>${t('risk.short')}</span></p>`;
const catLabel = c => tr('cat.' + c);

function courseCard(c, i) {
  const s = courseStats(c);
  const started = s.done > 0 || c.lessons.some(l => quizAnswers(l.id).some(ans));
  const label = s.done === s.total ? tr('c.review') : started ? tr('c.continue') : tr('c.start');
  return `<article class="card course-card glass reveal"${rv(i)}>
    <div class="cc-top"><span class="cc-ic">${icon(c.ic)}</span><div class="cc-badges">${lvlBadge(c.lvl)}${c.prem ? premBadge() : ''}</div></div>
    <h3>${tx(c.t)}</h3>
    <p class="cc-d">${tx(c.d)}</p>
    <ul class="meta-row"><li>${icon('list')}${plural('c.lessons', s.total)}</li><li>${icon('clock')}${tr('min', { n: courseDur(c) })}</li></ul>
    ${progressBar(s.pct, tx(c.t))}
    <p class="cc-prog">${t('prog.lessons', { done: s.done, total: s.total })} · ${s.pct} %</p>
    <a class="btn ${s.done === s.total ? 'btn-ghost' : 'btn-primary'} btn-sm stretch" href="#cours/${c.id}" aria-label="${esc(label + ' : ' + L(c.t))}">${esc(label)}${icon('arrow')}</a>
  </article>`;
}

/* --- Parcours pédagogique (7 étapes) --- */
function journeySteps() {
  const les = ids => ids.filter(isDone).length / ids.length;
  const cs = cid => { const s = courseStats(COURSE_BY_ID[cid]); return s.done / s.total; };
  return [
    { k: 'discover', href: '#cours/1/1', f: les(['1-1', '1-2']) },
    { k: 'understand', href: '#cours/1', f: les(['1-3', '1-4', '1-5']) },
    { k: 'learn', href: '#cours/2', f: cs(2) },
    { k: 'practice', href: '#pratique', f: practiceTotals().tried / PRACTICE.length },
    { k: 'analyze', href: '#cours/3', f: cs(3) },
    { k: 'build', href: '#cours/4', f: cs(4) },
    { k: 'deepen', href: '#cours/5', f: cs(5) }
  ];
}
function journeyHTML() {
  const steps = journeySteps();
  const cur = steps.findIndex(s => s.f < 1);
  return `<ol class="journey">${steps.map((s, i) => {
    const st = s.f >= 1 ? 'done' : i === cur ? 'current' : 'todo';
    return `<li class="jstep ${st} reveal"${rv(i)}><a href="${s.href}"${st === 'current' ? ' aria-current="step"' : ''}>
      <span class="jdot">${st === 'done' ? icon('check') : i + 1}</span>
      <span class="jtxt"><strong>${t('j.' + s.k)}</strong><span>${t('j.' + s.k + '.d')}</span></span>
      ${s.f > 0 && s.f < 1 ? `<span class="jbar"><i style="width:${Math.round(s.f * 100)}%"></i></span>` : ''}
    </a></li>`;
  }).join('')}</ol>`;
}

/* --- Options de réponse, feedback et carte de question --- */
function optionsHTML(q, chosen, action, attrs) {
  const opts = qOptions(q), ci = correctIdx(q), done = ans(chosen);
  return `<div class="opts" role="group" aria-label="${t('opts')}">${opts.map((o, i) => {
    let cls = 'opt';
    if (done) cls += i === ci ? ' correct' : i === chosen ? ' wrong' : ' dim';
    const mark = done && i === ci ? icon('check') + `<span class="sr-only"> (${t('sr.correct')})</span>` : done && i === chosen ? icon('close') + `<span class="sr-only"> (${t('sr.wrong')})</span>` : '';
    return `<button type="button" class="${cls}" data-action="${action}" ${attrs} data-o="${i}"${done ? ' disabled' : ''}><span class="opt-l">${letter(i)}</span><span class="opt-t">${esc(o)}</span>${mark}</button>`;
  }).join('')}</div>`;
}
function feedbackHTML(q, chosen, pop) {
  const ok = chosen === correctIdx(q);
  return `<div class="q-fb ${ok ? 'ok' : 'ko'}${pop ? ' pop' : ''}" role="status" tabindex="-1">${icon(ok ? 'check' : 'close')}<div><strong>${ok ? t('fb.ok') : t('fb.ko')}</strong>${ok ? '' : ` <span>${t('fb.answer')} <em>${esc(qOptions(q)[correctIdx(q)])}</em></span>`}<p>${tmd(q.e)}</p></div></div>`;
}
const qTypeLabel = q => tr('qt.' + q.type);

function quizHTML(les) {
  const a = quizAnswers(les.id), n = les.q.length, done = quizDone(les), score = quizScore(les);
  const rec = quizRec(les.id);
  const items = les.q.map((q, i) => {
    const chosen = a[i];
    const pop = ui.justAnswered === les.id + ':' + i;
    return `<li class="q" data-q="${i}">
      <div class="q-meta"><span class="chip">${esc(qTypeLabel(q))}</span><span>${tr('q.n', { n: i + 1, total: n })}</span></div>
      ${q.fig ? figHTML(q.fig, true) : ''}
      <p class="q-text">${tx(q.q)}</p>
      ${optionsHTML(q, chosen, 'answer', `data-lid="${les.id}" data-q="${i}"`)}
      ${ans(chosen) ? feedbackHTML(q, chosen, pop) : ''}
    </li>`;
  }).join('');
  const result = done ? `<div class="quiz-result ${score === n ? 'perfect' : ''}">
      <div class="qr-score"><strong>${score}</strong><span>/ ${n}</span></div>
      <div><p class="qr-t">${t(score === n ? 'qr.perfect' : score >= Math.ceil(n / 2) ? 'qr.good' : 'qr.retry')}</p>
      <p class="qr-s">${t('qr.best', { best: Math.max(rec ? rec.best || 0 : 0, score), total: n })}</p></div>
      <button type="button" class="btn btn-ghost btn-sm" data-action="retry-quiz" data-lid="${les.id}">${icon('refresh')}${t('qr.again')}</button>
    </div>` : `<p class="quiz-hint">${t('quiz.hint')}</p>`;
  return `<section class="quiz glass" aria-labelledby="quiz-h">
    <div class="quiz-head"><h2 id="quiz-h">${icon('target')}${t('quiz')}</h2><span class="quiz-score" aria-live="polite">${a.filter(ans).length} / ${n}</span></div>
    <ol class="qlist">${items}</ol>${result}
  </section>`;
}

/* --- Cartes du lexique et des patterns --- */
function termCard(w, i) {
  return `<button type="button" class="card term-card glass" data-action="lex-open" data-id="${w.id}" style="--i:${Math.min(i, 12)}">
    <span class="tc-top"><span class="chip">${t('cat.' + w.c)}</span>${lvlBadge(w.lvl)}</span>
    <span class="tc-title">${tx(w.n)}</span>
    <span class="tc-alt">${tx(w.alt)}</span>
    <span class="tc-d">${esc(cut(L(w.d), 110))}</span>
    <span class="tc-more">${t('more')}${icon('arrow')}</span>
  </button>`;
}
function patternCard(p, i) {
  return `<button type="button" class="card pat-card glass" data-action="pat-open" data-id="${p.id}" style="--i:${Math.min(i, 12)}">
    <span class="pc-chart">${patternChart(p, { labels: false, n: 30, h: 132, cls: 'mini', label: p.n })}</span>
    <span class="tc-top"><span class="chip">${t('pcat.' + p.c)}</span>${lvlBadge(p.lvl)}</span>
    <span class="tc-title">${tx(p.n)}</span>
    <span class="tc-d">${esc(cut(L(p.def), 100))}</span>
  </button>`;
}

/* --- FAQ (accordéon) --- */
function faqHTML(list, prefix) {
  return `<div class="faq-list">${list.map((f, i) => `<div class="faq-item glass reveal"${rv(i)}>
    <h3><button type="button" class="faq-q" id="${prefix}-q${i}" data-action="faq-toggle" aria-expanded="false" aria-controls="${prefix}-a${i}"><span>${tx(f.q)}</span><i class="chev" aria-hidden="true"></i></button></h3>
    <div class="faq-a" id="${prefix}-a${i}" role="region" aria-labelledby="${prefix}-q${i}"><div><p>${tx(f.a)}</p></div></div>
  </div>`).join('')}</div>`;
}

/* =====================================================================
   12. VUES — ACCUEIL, COURS, LEÇONS
   Chaque vue retourne { title, desc, html, after? }
   ===================================================================== */
const lessonHref = l => `#cours/${l.cid}/${l.idx + 1}`;

function heroChart() {
  const ser = [38, 44, 41, 49, 54, 50, 58, 64, 60, 68, 74, 69, 78, 84, 80, 88, 94, 89, 98, 104, 99, 108];
  const cs = toCandles(ser), n = cs.length, W = 360, H = 210, pl = 14, pr = 14, pt = 18, pb = 16;
  const mn = Math.min.apply(null, cs.map(c => c.l)), mx = Math.max.apply(null, cs.map(c => c.h));
  const step = (W - pl - pr) / n;
  const X = i => pl + (i + 0.5) * step, Y = v => pt + (mx - v) / (mx - mn) * (H - pt - pb);
  const f = v => v.toFixed(1);
  let s = `<svg class="hv-chart" viewBox="0 0 ${W} ${H}" fill="none" aria-hidden="true" focusable="false"><defs><linearGradient id="hg" x1="0" x2="1"><stop offset="0" stop-color="#22d3ee"/><stop offset="1" stop-color="#c084fc"/></linearGradient><linearGradient id="hf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22d3ee" stop-opacity=".26"/><stop offset="1" stop-color="#22d3ee" stop-opacity="0"/></linearGradient></defs>`;
  for (let k = 1; k <= 4; k++) s += `<line x1="${pl}" x2="${W - pr}" y1="${f(pt + k * (H - pt - pb) / 5)}" y2="${f(pt + k * (H - pt - pb) / 5)}" stroke="rgba(255,255,255,.07)"/>`;
  const line = ser.map((v, i) => f(X(i)) + ',' + f(Y(v))).join(' ');
  s += `<polygon points="${f(X(0))},${H - pb} ${line} ${f(X(n - 1))},${H - pb}" fill="url(#hf)" class="hv-area"/>`;
  cs.forEach((c, i) => {
    const up = c.c >= c.o, cx = X(i), top = Y(Math.max(c.o, c.c)), bot = Y(Math.min(c.o, c.c));
    s += `<g class="hc ${up ? 'up' : 'dn'}" style="--i:${i}"><line x1="${f(cx)}" x2="${f(cx)}" y1="${f(Y(c.h))}" y2="${f(Y(c.l))}"/><rect x="${f(cx - step * 0.3)}" y="${f(top)}" width="${f(step * 0.6)}" height="${f(Math.max(1.5, bot - top))}" rx="1.2"/></g>`;
  });
  s += `<polyline class="hv-line" points="${line}" stroke="url(#hg)" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" pathLength="1"/>`;
  return s + '</svg>';
}

function viewHome() {
  const res = resumeLesson() || ALL_LESSONS[0];
  const started = hasStarted();
  const g = globalStats();
  const startHref = lessonHref(res);
  const lexIds = ['spread', 'leverage', 'stop-loss', 'support', 'breakout', 'order-block'];
  const patIds = ['double-top', 'asc-triangle', 'flag'];
  const feats = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6'];
  const icons = { f1: 'route', f2: 'target', f3: 'shield', f4: 'search', f5: 'globe', f6: 'lock' };
  const html = `
  <section class="hero container">
    <div class="hero-copy">
      <p class="hero-pill">${icon('shield')}<span>${t('hero.pill')}</span></p>
      <h1>${t('hero.title')}</h1>
      <p class="lead">${t('hero.lead')}</p>
      <div class="cta-row">
        <a class="btn btn-primary btn-lg" href="${startHref}">${icon('play')}${t(started ? 'cta.continue' : 'cta.start')}</a>
        <a class="btn btn-ghost btn-lg" href="#cours">${t('cta.explore')}${icon('arrow')}</a>
      </div>
      ${started ? `<div class="resume glass"><div><strong>${t('resume.h')}</strong><span>${tx(res.t)}</span></div>${progressBar(g.pct, tr('progress'))}<em>${g.done} / ${g.total}</em></div>` : ''}
      ${riskNote()}
    </div>
    <div class="hero-visual">
      <div class="hv-card glass" aria-hidden="true">
        <div class="hv-top"><i></i><i></i><i></i><span>${t('hero.viz')}</span></div>
        ${heroChart()}
        <div class="hv-chips"><span>${t('hv.c1')}</span><span>${t('hv.c2')}</span><span>${t('hv.c3')}</span></div>
      </div>
      <span class="hv-float glass f1" aria-hidden="true">${icon('shield')}${t('hv.f1')}</span>
      <span class="hv-float glass f2" aria-hidden="true">${icon('target')}${t('hv.f2')}</span>
      <p class="hv-note">${t('hero.note')}</p>
    </div>
  </section>

  <section class="section container">
    ${secHead(t('home.markets.h'), t('home.markets.p'))}
    <div class="grid grid-4">${MARKETS.map((m, i) => `<article class="card market-card glass reveal"${rv(i)}>
      <span class="cc-ic">${icon(m.ic)}</span><h3>${tx(m.t)}</h3><p>${tx(m.d)}</p>
      <ul class="tick-list">${m.f.map(x => `<li>${icon('check')}<span>${tx(x)}</span></li>`).join('')}</ul></article>`).join('')}</div>
  </section>

  <section class="section container">
    ${secHead(t('home.method.h'), t('home.method.p'))}
    <div class="grid grid-3">${['m1', 'm2', 'm3'].map((k, i) => `<article class="card method-card glass reveal"${rv(i)}>
      <span class="m-n">${i + 1}</span><h3>${t(k + '.t')}</h3><p>${t(k + '.d')}</p></article>`).join('')}</div>
  </section>

  <section class="section container">
    ${secHead(t('home.why.h'), t('home.why.p'))}
    <div class="grid grid-3">${feats.map((k, i) => `<article class="card feat-card glass reveal"${rv(i)}>
      <span class="cc-ic">${icon(icons[k])}</span><h3>${t(k + '.t')}</h3><p>${t(k + '.d')}</p></article>`).join('')}</div>
  </section>

  <section class="section container">
    ${secHead(t('home.journey.h'), t('home.journey.p'))}
    ${journeyHTML()}
  </section>

  <section class="section container">
    ${secHead(t('home.courses.h'), t('home.courses.p'), `<a class="btn btn-ghost btn-sm" href="#cours">${t('cta.allcourses')}${icon('arrow')}</a>`)}
    <div class="grid grid-courses">${COURSES.map(courseCard).join('')}</div>
  </section>

  <section class="section container">
    ${secHead(t('home.lex.h'), t('home.lex.p'), `<a class="btn btn-ghost btn-sm" href="#lexique">${t('home.lex.cta')}${icon('arrow')}</a>`)}
    <div class="grid grid-3 results">${lexIds.map((id, i) => termCard(LEX_BY_ID[id], i)).join('')}</div>
  </section>

  <section class="section container">
    ${secHead(t('home.pat.h'), t('home.pat.p'), `<a class="btn btn-ghost btn-sm" href="#patterns">${t('home.pat.cta')}${icon('arrow')}</a>`)}
    <div class="grid grid-3 results">${patIds.map((id, i) => patternCard(PAT_BY_ID[id], i)).join('')}</div>
  </section>

  <section class="section container">
    <div class="split glass reveal">
      <div>
        <h2>${t('home.prac.h')}</h2><p class="lead">${t('home.prac.p')}</p>
        <a class="btn btn-primary" href="#pratique">${icon('target')}${t('home.prac.cta')}</a>
      </div>
      <ul class="chip-cloud">${PRACTICE.map(p => `<li><a class="chip-link" href="#pratique">${icon(p.ic)}${tx(p.t)}</a></li>`).join('')}</ul>
    </div>
  </section>

  <section class="section container">
    ${secHead(t('home.tools.h'), t('home.tools.p'), `<a class="btn btn-ghost btn-sm" href="#outils">${t('home.tools.cta')}${icon('arrow')}</a>`)}
    <div class="grid grid-3">${TOOLS.map((tl, i) => `<article class="card tool-mini glass reveal"${rv(i)}>
      <span class="cc-ic">${icon(tl.ic)}</span><h3>${esc(tl.name)}</h3><p>${tx(tl.use)}</p></article>`).join('')}</div>
  </section>

  <section class="section container">
    <div class="premium-teaser glass reveal">
      <div>
        ${premBadge()}
        <h2>${t('home.prem.h')}</h2><p class="lead">${t('home.prem.p')}</p>
        <a class="btn btn-primary" href="#premium">${icon('crown')}${t('home.prem.cta')}</a>
      </div>
      <ul class="tick-list">${['f1', 'f2', 'f3', 'f4', 'f5'].map(k => `<li>${icon('check')}<span>${t('prem.' + k)}</span></li>`).join('')}</ul>
    </div>
  </section>

  <section class="section container narrow">
    ${secHead(t('home.faq.h'), '', `<a class="btn btn-ghost btn-sm" href="#faq">${t('home.faq.all')}${icon('arrow')}</a>`)}
    ${faqHTML(FAQ.slice(0, 5), 'hf')}
  </section>

  <section class="section container">
    <div class="final-cta glass reveal">
      <h2>${t('home.final.h')}</h2><p class="lead">${t('home.final.p')}</p>
      <div class="cta-row center">
        <a class="btn btn-primary btn-lg" href="${startHref}">${icon('play')}${t(started ? 'cta.continue' : 'cta.start')}</a>
        <a class="btn btn-ghost btn-lg" href="#cours">${t('cta.explore')}${icon('arrow')}</a>
      </div>
    </div>
  </section>`;
  return { title: tr('meta.home.t'), desc: tr('meta.home.d'), html };
}

function viewCourses() {
  const g = globalStats(), res = resumeLesson(), started = hasStarted();
  const html = `<section class="page-head container">
    <h1>${t('courses.h1')}</h1>
    <p class="lead">${t('courses.lead')}</p>
    <div class="overall glass">
      <div class="ov-l"><strong>${t('courses.overall')}</strong>${progressBar(g.pct, tr('courses.overall'))}<span>${t('prog.lessons', { done: g.done, total: g.total })} · ${g.pct} %</span></div>
      ${res ? `<a class="btn btn-primary" href="${lessonHref(res)}">${icon('play')}${t(started ? 'cta.continue' : 'cta.start')}</a>` : `<span class="badge lvl-1">${icon('check')}${t('courses.alldone')}</span>`}
    </div>
  </section>
  <section class="section container">${secHead(t('home.journey.h'), t('home.journey.p'))}${journeyHTML()}</section>
  <section class="section container">
    <div class="grid grid-courses">${COURSES.map(courseCard).join('')}</div>
    <p class="note-line">${icon('info')}<span>${t('prem.open')}</span></p>
    ${riskNote()}
  </section>`;
  return { title: tr('meta.courses.t'), desc: tr('meta.courses.d'), html };
}

function viewCourse(c) {
  const s = courseStats(c);
  const next = c.lessons.find(l => !isDone(l.id)) || c.lessons[0];
  const started = s.done > 0 || c.lessons.some(l => quizAnswers(l.id).some(ans));
  const items = c.lessons.map((l, i) => {
    const done = isDone(l.id), rec = quizRec(l.id);
    return `<li class="l-item reveal${done ? ' done' : ''}"${rv(i)}><a href="${lessonHref(l)}">
      <span class="l-n">${done ? icon('check') : i + 1}</span>
      <span class="l-body"><strong>${tx(l.t)}</strong><span class="l-d">${esc(cut(L(l.intro), 130))}</span>
        <span class="l-meta">${icon('clock')}${tr('min', { n: l.dur })}${rec && rec.tot ? ` · ${icon('target')}${t('quiz.best', { best: rec.best || 0, total: rec.tot })}` : ''}${done ? ` · ${t('done')}` : ''}</span></span>
      <span class="l-go">${icon('arrow')}</span></a></li>`;
  }).join('');
  const html = `<section class="page-head container">
    ${crumbs([{ t: tr('nav.courses'), href: '#cours' }, { t: L(c.t) }])}
    <div class="ph-badges">${lvlBadge(c.lvl)}${c.prem ? premBadge() : ''}</div>
    <h1>${tx(c.t)}</h1>
    <p class="lead">${tx(c.d)}</p>
    <div class="overall glass">
      <div class="ov-l"><strong>${t('prog.lessons', { done: s.done, total: s.total })}</strong>${progressBar(s.pct, L(c.t))}<span>${s.pct} % · ${tr('min', { n: courseDur(c) })}</span></div>
      <a class="btn btn-primary" href="${lessonHref(next)}">${icon('play')}${t(s.done === s.total ? 'c.review' : started ? 'c.continue' : 'c.start')}</a>
    </div>
    ${c.prem ? `<p class="note-line">${icon('crown')}<span>${t('prem.open')}</span></p>` : ''}
  </section>
  <section class="section container">
    <h2 class="sr-only">${t('lessons')}</h2>
    <ol class="lesson-list">${items}</ol>
    <div class="cta-row"><a class="btn btn-ghost" href="#cours">${icon('arrowL')}${t('back.courses')}</a></div>
  </section>`;
  return { title: `${L(c.t)} — ${tr('nav.courses')}`, desc: L(c.d), html };
}

function sectionHTML(s) {
  const ps = (s.p || []).map(p => `<p>${tmd(p)}</p>`).join('');
  const ul = s.ul ? `<ul class="les-list">${s.ul.map(li => `<li>${tmd(li)}</li>`).join('')}</ul>` : '';
  return `<section class="les-sec"><h2>${tx(s.h)}</h2>${s.ulFirst ? ul + ps : ps + ul}${s.fig ? figHTML(s.fig) : ''}</section>`;
}
function lessonNavHTML(c, cur) {
  const s = courseStats(c);
  return `<nav class="lnav glass" aria-label="${t('lessons')}">
    <p class="lnav-h">${tx(c.t)}</p>
    ${progressBar(s.pct, L(c.t))}
    <ol>${c.lessons.map((l, i) => `<li><a class="ln-item${l.id === cur.id ? ' cur' : ''}${isDone(l.id) ? ' done' : ''}" href="${lessonHref(l)}"${l.id === cur.id ? ' aria-current="page"' : ''} title="${tx(l.t)}">
      <span class="ln-n">${isDone(l.id) ? icon('check') : i + 1}</span><span class="ln-t">${tx(l.t)}</span></a></li>`).join('')}</ol>
  </nav>`;
}
function nextTarget(c, les) {
  if (les.idx < c.lessons.length - 1) return { href: lessonHref(c.lessons[les.idx + 1]), label: tr('next.lesson'), t: c.lessons[les.idx + 1].t };
  const nc = COURSE_BY_ID[c.id + 1];
  if (nc) return { href: lessonHref(nc.lessons[0]), label: tr('next.course'), t: nc.t };
  return { href: '#pratique', label: tr('next.practice'), t: T(tr('nav.practice'), tr('nav.practice')) };
}

function viewLesson(c, les) {
  const prev = les.idx > 0 ? c.lessons[les.idx - 1] : null;
  const nx = nextTarget(c, les);
  const done = isDone(les.id);
  const noteIc = { warn: 'alert', tip: 'bulb', info: 'info' };
  const html = `<div class="container lesson-layout">
    ${lessonNavHTML(c, les)}
    <article class="lesson">
      <header class="lesson-head">
        ${crumbs([{ t: tr('nav.courses'), href: '#cours' }, { t: L(c.t), href: '#cours/' + c.id }, { t: L(les.t) }])}
        <ul class="meta-row"><li>${lvlBadge(c.lvl)}</li><li>${t('lesson.n', { n: les.idx + 1, total: c.lessons.length })}</li><li>${icon('clock')}${tr('min', { n: les.dur })}</li>${done ? `<li class="ok-tag">${icon('check')}${t('done')}</li>` : ''}</ul>
        <h1>${tx(les.t)}</h1>
        <p class="lead">${tx(les.intro)}</p>
      </header>
      ${les.s.map(sectionHTML).join('')}
      <section class="keypoints glass"><h2>${icon('spark')}${t('les.key')}</h2><ul>${les.key.map(k => `<li>${icon('check')}<span>${tmd(k)}</span></li>`).join('')}</ul></section>
      ${les.note ? `<aside class="callout ${les.note.k}">${icon(noteIc[les.note.k])}<p>${tmd(les.note.t)}</p></aside>` : ''}
      ${quizHTML(les)}
      <section class="complete glass${done ? ' is-done' : ''}" aria-live="polite">
        <div class="cp-text"><h2>${t(done ? 'cp.done.h' : 'cp.h')}</h2><p>${t(done ? 'cp.done.p' : 'cp.p')}</p></div>
        <div class="cp-actions">
          ${done ? `<button type="button" class="btn btn-ghost btn-sm" data-action="uncomplete" data-lid="${les.id}">${t('cp.undo')}</button>` : `<button type="button" class="btn btn-primary" data-action="complete" data-lid="${les.id}">${icon('check')}${t('cp.btn')}</button>`}
        </div>
      </section>
      <nav class="les-nav" aria-label="${t('les.nav')}">
        ${prev ? `<a class="btn btn-ghost" href="${lessonHref(prev)}">${icon('arrowL')}<span><small>${t('prev.lesson')}</small>${tx(prev.t)}</span></a>` : `<a class="btn btn-ghost" href="#cours/${c.id}">${icon('arrowL')}<span><small>${t('back')}</small>${t('lessons')}</span></a>`}
        <a class="btn ${done ? 'btn-primary' : 'btn-ghost'}" href="${nx.href}"><span><small>${esc(nx.label)}</small>${tx(nx.t)}</span>${icon('arrow')}</a>
      </nav>
      ${riskNote()}
    </article>
  </div>`;
  return { title: `${L(les.t)} — ${L(c.t)}`, desc: cut(L(les.intro), 155), html };
}

/* =====================================================================
   13. VUES — LEXIQUE, PATTERNS, PRACTICE, OUTILS, PREMIUM, FAQ
   ===================================================================== */
const PRAC_BY_ID = {};
PRACTICE.forEach(p => { PRAC_BY_ID[p.id] = p; });

const chipBtn = (action, v, label, cur) => {
  const on = String(cur) === String(v);
  return `<button type="button" class="chip-btn${on ? ' on' : ''}" data-action="${action}" data-v="${v}" aria-pressed="${on}">${label}</button>`;
};
function syncChips(scope) {
  $$(`[data-action="${scope}-cat"],[data-action="${scope}-lvl"]`).forEach(b => {
    const cur = ui[scope][b.dataset.action === scope + '-cat' ? 'cat' : 'lvl'];
    const on = String(cur) === b.dataset.v;
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}
const levelChips = (scope, cur) => ['all', 1, 2, 3, 4].map(v => chipBtn(scope + '-lvl', v, v === 'all' ? t('f.all') : t('lvl.' + v), cur)).join('');

/* ---------------------------- LEXIQUE ---------------------------- */
function lexFiltered() {
  const { q, cat, lvl } = ui.lex, nq = norm(q);
  return LEX.filter(w => (cat === 'all' || w.c === cat) && (lvl === 'all' || String(w.lvl) === String(lvl))
      && (!nq || norm([L(w.n), L(w.alt), L(w.d), L(w.ex), w.id].join(' ')).indexOf(nq) !== -1))
    .sort((a, b) => L(a.n).localeCompare(L(b.n), lang));
}
function lexResultsHTML() {
  const list = lexFiltered();
  if (!list.length) return `<div class="empty glass">${icon('search')}<p>${t('lex.empty')}</p><button type="button" class="btn btn-ghost btn-sm" data-action="lex-reset">${icon('refresh')}${t('f.reset')}</button></div>`;
  return list.map(termCard).join('');
}
function refreshLex() {
  const r = $('#lex-results');
  if (!r) return;
  r.innerHTML = lexResultsHTML();
  const c = $('#lex-count');
  if (c) c.textContent = plural('lex.count', lexFiltered().length);
  syncChips('lex');
}
function viewLexicon() {
  const st = ui.lex;
  const html = `<section class="page-head container">
    <h1>${t('lex.h1')}</h1><p class="lead">${t('lex.lead')}</p>
  </section>
  <section class="section container tight">
    <div class="filters glass">
      <label class="search"><span class="sr-only">${t('lex.search')}</span>${icon('search')}<input type="search" id="lex-q" data-input="lex-q" placeholder="${t('lex.ph')}" value="${esc(st.q)}" autocomplete="off" spellcheck="false"></label>
      <div class="f-group"><span class="f-l">${t('f.cat')}</span><div class="chip-row" role="group" aria-label="${t('f.cat')}">${chipBtn('lex-cat', 'all', t('f.all'), st.cat)}${LEX_CATS.map(c => chipBtn('lex-cat', c, t('cat.' + c), st.cat)).join('')}</div></div>
      <div class="f-group"><span class="f-l">${t('f.lvl')}</span><div class="chip-row" role="group" aria-label="${t('f.lvl')}">${levelChips('lex', st.lvl)}</div></div>
      <p class="count" id="lex-count" aria-live="polite">${plural('lex.count', lexFiltered().length)}</p>
    </div>
    <div class="grid grid-3 results" id="lex-results">${lexResultsHTML()}</div>
    ${riskNote()}
  </section>`;
  return { title: tr('meta.lex.t'), desc: tr('meta.lex.d'), html };
}
function termModalHTML(w) {
  const rel = (w.rel || []).filter(id => LEX_BY_ID[id]);
  return `<h2 id="modal-title">${tx(w.n)}</h2><p class="m-alt">${tx(w.alt)}</p>
    <div class="m-badges"><span class="chip">${t('cat.' + w.c)}</span>${lvlBadge(w.lvl)}${w.lvl >= 3 ? premBadge() : ''}</div>
    <h3>${t('m.def')}</h3><p>${tmd(w.d)}</p>
    <h3>${t('m.ex')}</h3><p class="m-example">${tx(w.ex)}</p>
    ${rel.length ? `<h3>${t('m.rel')}</h3><div class="chip-row">${rel.map(id => `<button type="button" class="chip-btn" data-action="lex-open" data-id="${id}">${tx(LEX_BY_ID[id].n)}</button>`).join('')}</div>` : ''}
    ${w.les && LESSON_BY_ID[w.les] ? `<div class="modal-actions"><a class="btn btn-ghost btn-sm" href="${lessonHref(LESSON_BY_ID[w.les])}">${icon('book')}${t('m.lesson')}</a></div>` : ''}`;
}
function openTerm(id) {
  const w = LEX_BY_ID[id];
  if (!w) return;
  const onPage = currentPath()[0] === 'lexique';
  if (modal) { setModalBody(termModalHTML(w)); const d = $('.modal'); if (d) d.scrollTop = 0; }
  else openModal(termModalHTML(w), { onClose: () => { if (onPage && /^#lexique\//.test(location.hash)) history.replaceState(null, '', '#lexique'); } });
  if (onPage) { try { history.replaceState(null, '', '#lexique/' + id); } catch (e) { /* ignoré */ } }
}

/* ---------------------------- PATTERNS ---------------------------- */
function patFiltered() {
  const { q, cat, lvl } = ui.pat, nq = norm(q);
  return PATTERNS.filter(p => (cat === 'all' || p.c === cat) && (lvl === 'all' || String(p.lvl) === String(lvl))
    && (!nq || norm([L(p.n), L(p.def), L(p.struct), L(p.ctx), p.id].join(' ')).indexOf(nq) !== -1));
}
function patResultsHTML() {
  const list = patFiltered();
  if (!list.length) return `<div class="empty glass">${icon('search')}<p>${t('pat.empty')}</p><button type="button" class="btn btn-ghost btn-sm" data-action="pat-reset">${icon('refresh')}${t('f.reset')}</button></div>`;
  return list.map(patternCard).join('');
}
function refreshPat() {
  const r = $('#pat-results');
  if (!r) return;
  r.innerHTML = patResultsHTML();
  const c = $('#pat-count');
  if (c) c.textContent = plural('pat.count', patFiltered().length);
  syncChips('pat');
}
function viewPatterns() {
  const st = ui.pat;
  const html = `<section class="page-head container">
    <h1>${t('pat.h1')}</h1><p class="lead">${t('pat.lead')}</p>
    <p class="note-line">${icon('alert')}<span>${t('pat.warn')}</span></p>
  </section>
  <section class="section container tight">
    <div class="filters glass">
      <label class="search"><span class="sr-only">${t('pat.search')}</span>${icon('search')}<input type="search" id="pat-q" data-input="pat-q" placeholder="${t('pat.ph')}" value="${esc(st.q)}" autocomplete="off" spellcheck="false"></label>
      <div class="f-group"><span class="f-l">${t('f.type')}</span><div class="chip-row" role="group" aria-label="${t('f.type')}">${chipBtn('pat-cat', 'all', t('f.all'), st.cat)}${PAT_CATS.map(c => chipBtn('pat-cat', c, t('pcat.' + c), st.cat)).join('')}</div></div>
      <div class="f-group"><span class="f-l">${t('f.lvl')}</span><div class="chip-row" role="group" aria-label="${t('f.lvl')}">${levelChips('pat', st.lvl)}</div></div>
      <p class="count" id="pat-count" aria-live="polite">${plural('pat.count', patFiltered().length)}</p>
    </div>
    <div class="grid grid-3 results" id="pat-results">${patResultsHTML()}</div>
    ${riskNote()}
  </section>`;
  return { title: tr('meta.pat.t'), desc: tr('meta.pat.d'), html };
}
function patternModalHTML(p) {
  const chosen = ui.patAns[p.id], q = p.x;
  const i = PATTERNS.indexOf(p), prev = PATTERNS[i - 1], next = PATTERNS[i + 1];
  return `<h2 id="modal-title">${tx(p.n)}</h2>
    <div class="m-badges"><span class="chip">${t('pcat.' + p.c)}</span>${lvlBadge(p.lvl)}</div>
    <figure class="fig m-fig">${patternChart(p, { h: 190, label: p.n })}<figcaption><span class="fig-note">${t('fig.note')}</span></figcaption></figure>
    <h3>${t('pm.def')}</h3><p>${tmd(p.def)}</p>
    <h3>${t('pm.struct')}</h3><p>${tmd(p.struct)}</p>
    <h3>${t('pm.ident')}</h3><ul class="les-list">${p.ident.map(x => `<li>${tmd(x)}</li>`).join('')}</ul>
    <h3>${t('pm.ctx')}</h3><p>${tmd(p.ctx)}</p>
    <h3>${t('pm.interp')}</h3><p>${tmd(p.interp)}</p>
    <h3>${t('pm.err')}</h3><ul class="les-list warn">${p.err.map(x => `<li>${tmd(x)}</li>`).join('')}</ul>
    <h3>${t('pm.ex')}</h3><p class="m-example">${tmd(p.ex)}</p>
    <div class="m-exo"><h3>${icon('target')}${t('pm.exo')}</h3>
      <p class="q-text">${tx(q.q)}</p>
      ${optionsHTML(q, chosen, 'pat-answer', `data-id="${p.id}"`)}
      ${ans(chosen) ? feedbackHTML(q, chosen, ui.justAnswered === 'pat:' + p.id) : ''}
    </div>
    <p class="risk-inline">${icon('alert')}<span>${t('pm.warn')}</span></p>
    <div class="modal-actions split-actions">
      ${prev ? `<button type="button" class="btn btn-ghost btn-sm" data-action="pat-open" data-id="${prev.id}">${icon('arrowL')}${tx(prev.n)}</button>` : '<span></span>'}
      ${next ? `<button type="button" class="btn btn-ghost btn-sm" data-action="pat-open" data-id="${next.id}">${tx(next.n)}${icon('arrow')}</button>` : '<span></span>'}
    </div>`;
}
function openPattern(id) {
  const p = PAT_BY_ID[id];
  if (!p) return;
  const onPage = currentPath()[0] === 'patterns';
  if (modal) { setModalBody(patternModalHTML(p)); const d = $('.modal'); if (d) d.scrollTop = 0; }
  else openModal(patternModalHTML(p), { cls: 'modal-lg', onClose: () => { if (onPage && /^#patterns\//.test(location.hash)) history.replaceState(null, '', '#patterns'); } });
  if (onPage) { try { history.replaceState(null, '', '#patterns/' + id); } catch (e) { /* ignoré */ } }
}

/* ---------------------------- PRACTICE ---------------------------- */
function finishPractice(s) {
  const p = PRAC_BY_ID[s.cat];
  const score = p.q.reduce((n, q, i) => n + (s.ans[i] === correctIdx(q) ? 1 : 0), 0);
  const r = pracRec(p.id);
  state.practice[p.id] = { best: Math.max(r.best || 0, score), total: p.q.length, attempts: (r.attempts || 0) + 1, correct: (r.correct || 0) + score, wrong: (r.wrong || 0) + (p.q.length - score), last: score };
  saveState();
  s.score = score;
  s.done = true;
}
function viewPractice() {
  const s = ui.prac;
  if (s && !s.done) return practiceQuestion(s);
  if (s && s.done) return practiceResult(s);
  return practiceHome();
}
function practiceHome() {
  const tot = practiceTotals();
  const cards = PRACTICE.map((p, i) => {
    const r = pracRec(p.id), tried = r.attempts > 0;
    return `<article class="card prac-card glass reveal"${rv(i)}>
      <div class="cc-top"><span class="cc-ic">${icon(p.ic)}</span>${tried ? `<span class="badge lvl-1">${t('pr.best', { best: r.best, total: r.total })}</span>` : `<span class="badge">${t('pr.new')}</span>`}</div>
      <h3>${tx(p.t)}</h3><p class="cc-d">${tx(p.d)}</p>
      <ul class="meta-row"><li>${icon('list')}${plural('pr.count', p.q.length)}</li>${tried ? `<li>${icon('refresh')}${plural('pr.tries', r.attempts)}</li>` : ''}</ul>
      ${progressBar(tried ? Math.round(r.best / r.total * 100) : 0, L(p.t))}
      <button type="button" class="btn ${tried ? 'btn-ghost' : 'btn-primary'} btn-sm" data-action="prac-start" data-id="${p.id}">${icon(tried ? 'refresh' : 'play')}${t(tried ? 'pr.again' : 'pr.start')}</button>
    </article>`;
  }).join('');
  const html = `<section class="page-head container">
    <h1>${t('pr.h1')}</h1><p class="lead">${t('pr.lead')}</p>
    <div class="stats glass">
      <div class="stat"><strong>${tot.n}</strong><span>${t('pr.s.answers')}</span></div>
      <div class="stat ok"><strong>${tot.correct}</strong><span>${t('pr.s.correct')}</span></div>
      <div class="stat ko"><strong>${tot.wrong}</strong><span>${t('pr.s.wrong')}</span></div>
      <div class="stat"><strong>${tot.n ? tot.acc + ' %' : '—'}</strong><span>${t('pr.s.acc')}</span></div>
      <div class="stat wide"><span>${t('pr.s.prog', { done: tot.tried, total: PRACTICE.length })}</span>${progressBar(Math.round(tot.tried / PRACTICE.length * 100), tr('progress'))}</div>
    </div>
  </section>
  <section class="section container tight"><div class="grid grid-4 grid-prac">${cards}</div>
    <p class="note-line">${icon('info')}<span>${t('pr.note')}</span></p>${riskNote()}</section>`;
  return { title: tr('meta.pr.t'), desc: tr('meta.pr.d'), html };
}
function practiceQuestion(s) {
  const p = PRAC_BY_ID[s.cat], n = p.q.length, q = p.q[s.i], chosen = s.ans[s.i], answered = ans(chosen);
  const correctSoFar = s.ans.reduce((c, a, i) => c + (a === correctIdx(p.q[i]) ? 1 : 0), 0);
  const last = s.i === n - 1;
  const html = `<section class="page-head container narrow">
    ${crumbs([{ t: tr('nav.practice'), href: '#pratique' }, { t: L(p.t) }])}
    <div class="ps-head"><h1>${tx(p.t)}</h1><button type="button" class="btn btn-ghost btn-sm" data-action="prac-quit">${icon('close')}${t('pr.quit')}</button></div>
    <div class="ps-progress"><span>${t('pr.q', { n: s.i + 1, total: n })}</span>${progressBar(Math.round((s.i + (answered ? 1 : 0)) / n * 100), tr('progress'))}<span>${t('pr.live', { c: correctSoFar })}</span></div>
  </section>
  <section class="section container narrow tight">
    <article class="q-card glass">
      <div class="q-meta"><span class="chip">${esc(qTypeLabel(q))}</span></div>
      ${q.fig ? figHTML(q.fig, true) : ''}
      <p class="q-text">${tx(q.q)}</p>
      ${optionsHTML(q, chosen, 'prac-answer', '')}
      ${answered ? feedbackHTML(q, chosen, ui.justAnswered === 'prac:' + s.i) : ''}
      ${answered ? `<div class="q-next"><button type="button" class="btn btn-primary" data-action="prac-next" data-autofocus>${t(last ? 'pr.finish' : 'pr.next')}${icon('arrow')}</button></div>` : ''}
    </article>
  </section>`;
  return { title: `${L(p.t)} — Practice`, desc: tr('meta.pr.d'), html };
}
function practiceResult(s) {
  const p = PRAC_BY_ID[s.cat], n = p.q.length, sc = s.score, pct = Math.round(sc / n * 100);
  const review = p.q.map((q, i) => {
    const ok = s.ans[i] === correctIdx(q);
    return `<li class="${ok ? 'ok' : 'ko'}">${icon(ok ? 'check' : 'close')}<div><strong>${tx(q.q)}</strong>${ok ? '' : `<span>${t('fb.answer')} <em>${esc(qOptions(q)[correctIdx(q)])}</em></span>`}</div></li>`;
  }).join('');
  const nextIdx = PRACTICE.findIndex(x => x.id === p.id) + 1;
  const nextCat = PRACTICE[nextIdx];
  const html = `<section class="page-head container narrow">
    ${crumbs([{ t: tr('nav.practice'), href: '#pratique' }, { t: L(p.t) }])}
    <h1>${t('pr.result')}</h1>
  </section>
  <section class="section container narrow tight">
    <div class="result-card glass ${pct === 100 ? 'perfect' : ''}">
      <div class="rc-score"><strong>${sc}</strong><span>/ ${n}</span></div>
      <div class="rc-text"><p class="qr-t">${t(pct >= 80 ? 'pr.res.great' : pct >= 50 ? 'pr.res.ok' : 'pr.res.retry')}</p>
        <ul class="meta-row"><li class="ok-tag">${icon('check')}${plural('pr.correct', sc)}</li><li class="ko-tag">${icon('close')}${plural('pr.errors', n - sc)}</li></ul></div>
    </div>
    <h2 class="sr-only">${t('pr.review')}</h2>
    <ul class="review">${review}</ul>
    <div class="cta-row">
      <button type="button" class="btn btn-primary" data-action="prac-start" data-id="${p.id}">${icon('refresh')}${t('pr.retry')}</button>
      ${nextCat ? `<button type="button" class="btn btn-ghost" data-action="prac-start" data-id="${nextCat.id}">${tx(nextCat.t)}${icon('arrow')}</button>` : ''}
      <button type="button" class="btn btn-ghost" data-action="prac-quit">${t('pr.all')}</button>
    </div>
  </section>`;
  return { title: `${t('pr.result')} — ${L(p.t)}`, desc: tr('meta.pr.d'), html };
}

/* ---------------------------- OUTILS ---------------------------- */
const numVal = id => { const el = document.getElementById(id); return el ? parseFloat(String(el.value).replace(',', '.')) : NaN; };
const calcRow = (l, v, cls) => `<div class="cr${cls ? ' ' + cls : ''}"><span>${l}</span><strong>${v}</strong></div>`;
function calcPos() {
  const out = $('#pos-out');
  if (!out) return;
  const cap = numVal('pc-capital'), risk = numVal('pc-risk'), entry = numVal('pc-entry'), stop = numVal('pc-stop'), tp = numVal('pc-tp');
  if (![cap, risk, entry, stop].every(isFinite) || cap <= 0 || risk <= 0 || entry <= 0 || stop <= 0) { out.innerHTML = `<p class="calc-hint">${t('calc.fill')}</p>`; return; }
  const dist = Math.abs(entry - stop);
  if (dist === 0) { out.innerHTML = `<p class="calc-err">${t('calc.dist0')}</p>`; return; }
  const riskAmt = cap * risk / 100, units = riskAmt / dist, notional = units * entry, long = stop < entry;
  let html = calcRow(t('calc.riskamt'), nf(riskAmt, 2)) + calcRow(t('calc.dir'), t(long ? 'calc.long' : 'calc.short')) + calcRow(t('calc.dist'), nf(dist, 5))
    + calcRow(t('calc.units'), nf(units, 4), 'main') + calcRow(t('calc.lots'), nf(units / 100000, 4)) + calcRow(t('calc.notional'), nf(notional, 2));
  if (isFinite(tp) && tp > 0) {
    const good = long ? tp > entry : tp < entry;
    html += good ? calcRow(t('calc.rr'), '1 : ' + nf(Math.abs(tp - entry) / dist, 2), 'main') : `<p class="calc-err">${t('calc.tpside')}</p>`;
  }
  if (notional > cap) html += `<p class="calc-warn">${icon('alert')}<span>${t('calc.lev')}</span></p>`;
  out.innerHTML = html;
}
function calcDD() {
  const out = $('#dd-out');
  if (!out) return;
  const dd = numVal('dd-pct');
  if (!isFinite(dd) || dd <= 0 || dd >= 100) { out.innerHTML = `<p class="calc-hint">${t('calc.dd.hint')}</p>`; return; }
  out.innerHTML = calcRow(t('calc.dd.need'), '+' + nf(dd / (100 - dd) * 100, 1) + ' %', 'main') + calcRow(t('calc.dd.left'), nf(100 - dd, 1) + ' %');
}
function calcExp() {
  const out = $('#exp-out');
  if (!out) return;
  const w = numVal('ex-win'), rw = numVal('ex-rw'), rl = numVal('ex-rl');
  if (![w, rw, rl].every(isFinite) || w < 0 || w > 100 || rw < 0 || rl <= 0) { out.innerHTML = `<p class="calc-hint">${t('calc.fill')}</p>`; return; }
  const p = w / 100, e = p * rw - (1 - p) * rl;
  out.innerHTML = calcRow(t('calc.exp'), (e >= 0 ? '+' : '−') + nf(Math.abs(e), 2) + ' R', e >= 0 ? 'main ok' : 'main ko')
    + calcRow(t('calc.be'), nf(rl / (rw + rl) * 100, 1) + ' %') + `<p class="calc-hint">${t('calc.exp.note')}</p>`;
}
const fld = (label, id, val, calc, step, unit) => `<label class="fld"><span>${label}</span><span class="fld-in"><input type="number" inputmode="decimal" step="${step || 'any'}" min="0" id="${id}" value="${val}" data-calc="${calc}">${unit ? `<i>${unit}</i>` : ''}</span></label>`;

function viewTools() {
  const cards = TOOLS.map((tl, i) => `<article class="card tool-card glass reveal"${rv(i)}>
    <div class="tl-head"><span class="cc-ic">${icon(tl.ic)}</span><div><h3>${esc(tl.name)}</h3><span class="chip">${tx(tl.aud)}</span></div></div>
    <p>${tx(tl.d)}</p>
    <h4>${t('tl.use')}</h4><p>${tx(tl.use)}</p>
    <h4>${t('tl.feat')}</h4><ul class="tick-list">${tl.feat.map(f => `<li>${icon('check')}<span>${tx(f)}</span></li>`).join('')}</ul>
    <h4>${t('tl.start')}</h4><ol class="steps">${tl.start.map(f => `<li>${tx(f)}</li>`).join('')}</ol>
    <div class="tl-actions">
      <button type="button" class="btn btn-primary btn-sm" data-action="tool-tuto" data-id="${tl.id}">${icon('book')}${t('tl.tuto')}</button>
      <a class="btn btn-ghost btn-sm" href="${tl.url}" target="_blank" rel="noopener noreferrer">${t('tl.open')}${icon('ext')}<span class="sr-only"> (${t('newtab')})</span></a>
    </div>
  </article>`).join('');
  const html = `<section class="page-head container">
    <h1>${t('tl.h1')}</h1><p class="lead">${t('tl.lead')}</p>
    <p class="note-line">${icon('info')}<span>${t('tl.note')}</span></p>
  </section>
  <section class="section container tight"><div class="grid grid-3">${cards}</div></section>
  <section class="section container">
    ${secHead(t('calc.h'), t('calc.p'))}
    <div class="grid grid-3 calc-grid">
      <section class="calc glass reveal" aria-labelledby="c1h"><h3 id="c1h">${icon('calc')}${t('calc.pos.h')}</h3>
        ${fld(t('calc.capital'), 'pc-capital', 5000, 'pos', 'any')}${fld(t('calc.risk'), 'pc-risk', 1, 'pos', '0.1', '%')}
        ${fld(t('calc.entry'), 'pc-entry', 100, 'pos')}${fld(t('calc.stop'), 'pc-stop', 95, 'pos')}${fld(t('calc.tp'), 'pc-tp', 115, 'pos')}
        <div class="calc-out" id="pos-out" aria-live="polite"></div></section>
      <section class="calc glass reveal" style="--d:70ms" aria-labelledby="c2h"><h3 id="c2h">${icon('calc')}${t('calc.dd.h')}</h3>
        <p class="calc-p">${t('calc.dd.p')}</p>${fld(t('calc.dd.in'), 'dd-pct', 30, 'dd', '0.1', '%')}
        <div class="calc-out" id="dd-out" aria-live="polite"></div></section>
      <section class="calc glass reveal" style="--d:140ms" aria-labelledby="c3h"><h3 id="c3h">${icon('calc')}${t('calc.exp.h')}</h3>
        <p class="calc-p">${t('calc.exp.p')}</p>
        ${fld(t('calc.win'), 'ex-win', 40, 'exp', '1', '%')}${fld(t('calc.rw'), 'ex-rw', 3, 'exp', '0.1', 'R')}${fld(t('calc.rl'), 'ex-rl', 1, 'exp', '0.1', 'R')}
        <div class="calc-out" id="exp-out" aria-live="polite"></div></section>
    </div>
    <p class="note-line">${icon('alert')}<span>${t('calc.disc')}</span></p>${riskNote()}
  </section>`;
  return { title: tr('meta.tl.t'), desc: tr('meta.tl.d'), html, after: () => { calcPos(); calcDD(); calcExp(); } };
}
function toolModalHTML(tl) {
  return `<h2 id="modal-title">${icon(tl.ic)}${t('tl.tuto.h', { name: tl.name })}</h2>
    <p>${tx(tl.d)}</p>
    <ol class="steps big">${tl.tuto.map(s => `<li>${tx(s)}</li>`).join('')}</ol>
    <div class="callout tip">${icon('bulb')}<p>${tx(tl.mission)}</p></div>
    <div class="modal-actions">
      <button type="button" class="btn btn-ghost btn-sm" data-action="close-modal">${t('close')}</button>
      <a class="btn btn-primary btn-sm" href="${tl.url}" target="_blank" rel="noopener noreferrer">${t('tl.open')}${icon('ext')}<span class="sr-only"> (${t('newtab')})</span></a>
    </div>`;
}

/* ---------------------------- PREMIUM ---------------------------- */
const PRICES = { monthly: 15, annual: 144 };
function viewPremium() {
  const annual = ui.bill === 'annual';
  const price = annual ? PRICES.annual : PRICES.monthly;
  const feats = ['f1', 'f2', 'f3', 'f4', 'f5'];
  const ficons = ['book', 'search', 'target', 'tools', 'layers'];
  const html = `<section class="page-head container">
    <div class="ph-badges">${premBadge()}</div>
    <h1>${t('pm.h1')}</h1><p class="lead">${t('pm.lead')}</p>
    <div class="status-banner glass">${icon('info')}<div><strong>${t('pm.status.h')}</strong><p>${t('pm.status.p')}</p></div></div>
  </section>
  <section class="section container tight">
    <div class="bill-toggle" role="group" aria-label="${t('pm.bill')}">
      <button type="button" class="${annual ? '' : 'on'}" data-action="bill" data-v="monthly" aria-pressed="${!annual}">${t('pm.monthly')}</button>
      <button type="button" class="${annual ? 'on' : ''}" data-action="bill" data-v="annual" aria-pressed="${annual}">${t('pm.annual')}<em>${t('pm.save')}</em></button>
    </div>
    <div class="plans">
      <article class="plan glass reveal">
        <h2>${t('pm.now.h')}</h2><p class="plan-price">${t('pm.now.price')}</p><p class="plan-d">${t('pm.now.p')}</p>
        <ul class="tick-list">${['a', 'b', 'c'].map(k => `<li>${icon('check')}<span>${t('pm.now.' + k)}</span></li>`).join('')}</ul>
        <a class="btn btn-ghost" href="#cours">${t('cta.explore')}${icon('arrow')}</a>
      </article>
      <article class="plan plan-main glass reveal" style="--d:80ms">
        <span class="plan-tag">${t('pm.trial')}</span>
        <h2>${t('pm.plan.h')}</h2>
        <p class="plan-price"><strong>${nf(price, 0)} €</strong><span>${t(annual ? 'pm.per.year' : 'pm.per.month')}</span></p>
        <p class="plan-d">${annual ? t('pm.annual.eq', { m: nf(PRICES.annual / 12, 0) }) : t('pm.monthly.p')}</p>
        <ul class="tick-list">${feats.map((k, i) => `<li>${icon('check')}<span>${t('prem.' + k)}</span></li>`).join('')}</ul>
        <button type="button" class="btn btn-primary btn-lg" data-action="premium-cta">${icon('crown')}${t('pm.cta')}</button>
        <p class="plan-fine">${t('pm.fine')}</p>
      </article>
    </div>
  </section>
  <section class="section container">
    ${secHead(t('pm.incl.h'), t('pm.incl.p'))}
    <div class="grid grid-3">${feats.map((k, i) => `<article class="card feat-card glass reveal"${rv(i)}><span class="cc-ic">${icon(ficons[i])}</span><h3>${t('prem.' + k)}</h3><p>${t('pmf.' + k)}</p></article>`).join('')}</div>
  </section>
  <section class="section container narrow">
    <div class="glass soon reveal"><h2>${t('pm.soon.h')}</h2><p>${t('pm.soon.p')}</p>
      <ul class="tick-list">${['a', 'b', 'c', 'd'].map(k => `<li>${icon('clock')}<span>${t('pm.soon.' + k)}</span></li>`).join('')}</ul></div>
    ${riskNote()}
  </section>`;
  return { title: tr('meta.pm.t'), desc: tr('meta.pm.d'), html };
}
function premiumModalHTML() {
  return `<h2 id="modal-title">${icon('crown')}${t('pmm.h')}</h2>
    <p>${t('pmm.p1')}</p><p>${t('pmm.p2')}</p>
    <ul class="tick-list">${['a', 'b', 'c'].map(k => `<li>${icon('check')}<span>${t('pmm.' + k)}</span></li>`).join('')}</ul>
    <div class="modal-actions">
      <button type="button" class="btn btn-ghost btn-sm" data-action="close-modal">${t('close')}</button>
      <a class="btn btn-primary btn-sm" href="#cours">${icon('book')}${t('cta.explore')}</a>
    </div>`;
}

/* ---------------------------- FAQ, 404, INFORMATIONS ---------------------------- */
function viewFaq() {
  const html = `<section class="page-head container narrow"><h1>${t('faq.h1')}</h1><p class="lead">${t('faq.lead')}</p></section>
  <section class="section container narrow tight">${faqHTML(FAQ, 'fq')}
    <div class="cta-row"><a class="btn btn-primary" href="#cours">${icon('book')}${t('cta.explore')}</a><button type="button" class="btn btn-ghost" data-action="open-risk">${icon('alert')}${t('foot.risk')}</button></div>
  </section>`;
  return { title: tr('meta.faq.t'), desc: tr('meta.faq.d'), html };
}
function viewNotFound() {
  const html = `<section class="page-head container narrow nf">
    <p class="nf-code" aria-hidden="true">404</p>
    <h1>${t('nf.h1')}</h1><p class="lead">${t('nf.lead')}</p>
    <div class="cta-row center"><a class="btn btn-primary" href="#accueil">${t('nav.home')}</a><a class="btn btn-ghost" href="#cours">${t('nav.courses')}</a><a class="btn btn-ghost" href="#lexique">${t('nav.lexicon')}</a></div>
  </section>`;
  return { title: tr('nf.h1'), desc: tr('nf.lead'), html };
}
function riskModalHTML() {
  return `<h2 id="modal-title">${icon('alert')}${t('foot.risk')}</h2>
    <p>${t('rk.p1')}</p><p>${t('rk.p2')}</p><p>${t('rk.p3')}</p><p>${t('rk.p4')}</p>
    <div class="modal-actions"><button type="button" class="btn btn-primary btn-sm" data-action="close-modal" data-autofocus>${t('understood')}</button></div>`;
}

/* =====================================================================
   13b. PAGES LÉGALES — mentions légales, conditions, confidentialité
   Les informations de l'éditeur viennent de config.js (window.THM_CONFIG).
   Les champs vides s'affichent en jaune « À compléter ».
   ===================================================================== */
const CFG = window.THM_CONFIG || {};
const LEGAL_VALUES = {
  publisher: CFG.publisherName, status: CFG.publisherStatus, registration: CFG.registration,
  address: CFG.address, email: CFG.contactEmail || 'thmpro.officiel@gmail.com'
};
function legalVal(k) {
  const v = LEGAL_VALUES[k];
  if (v && String(v).trim()) {
    return k === 'email' ? `<a href="mailto:${esc(v)}">${esc(v)}</a>` : esc(v);
  }
  return `<span class="todo">${t('legal.todo', { f: tr('legal.f.' + k) })}</span>`;
}
const legalFill = html => html.replace(/\{(publisher|status|registration|address|email)\}/g, (_, k) => legalVal(k));

const LEGAL = {
  mentions: {
    t: T('Mentions légales', 'Legal notice'),
    s: [
      { h: T('Éditeur du site', 'Site publisher'),
        p: [T("Le site THMTrade est édité par {publisher}, {status}, {registration}.", "The THMTrade website is published by {publisher}, {status}, {registration}."),
            T("Adresse : {address}.", "Address: {address}."),
            T("Contact : {email}.", "Contact: {email}."),
            T("Directeur de la publication : {publisher}.", "Publication director: {publisher}.")] },
      { h: T('Hébergement', 'Hosting'),
        p: [T("Le site est hébergé par GitHub, Inc. (service GitHub Pages), 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis.", "The site is hosted by GitHub, Inc. (GitHub Pages service), 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, United States.")] },
      { h: T('Nature du site et avertissement', 'Nature of the site and warning'),
        p: [T("THMTrade est une plateforme éducative consacrée à l'apprentissage du trading. Elle ne fournit aucun conseil en investissement personnalisé, aucun signal et aucune recommandation d'achat ou de vente, et ne garantit aucun résultat. L'éditeur n'agit pas en tant que conseiller en investissements financiers ni prestataire de services d'investissement.",
              "THMTrade is an educational platform dedicated to learning trading. It provides no personalised investment advice, no signals and no buy or sell recommendations, and guarantees no result. The publisher does not act as a financial investment adviser or investment services provider."),
            T("Le trading comporte un risque élevé de perte, pouvant aller jusqu'à la totalité du capital investi. Les performances passées ne préjugent pas des performances futures.",
              "Trading carries a high risk of loss, up to the entire capital invested. Past performance does not predict future performance.")] },
      { h: T('Données et graphiques', 'Data and charts'),
        p: [T("Les graphiques, exemples chiffrés et calculs présentés sur le site sont des illustrations pédagogiques fictives. Ils ne représentent aucun marché réel et ne constituent pas une analyse de marché.",
              "The charts, numerical examples and calculations shown on the site are fictional educational illustrations. They do not represent any real market and are not a market analysis.")] },
      { h: T('Propriété intellectuelle', 'Intellectual property'),
        p: [T("L'ensemble des contenus du site (textes, illustrations, graphiques, code, structure, logo et nom THMTrade) est protégé par les règles applicables en matière de propriété intellectuelle. Toute reproduction, représentation ou réutilisation, totale ou partielle, sans autorisation écrite préalable de l'éditeur est interdite, hors courtes citations avec mention de la source.",
              "All site content (texts, illustrations, charts, code, structure, logo and the THMTrade name) is protected by the applicable intellectual property rules. Any total or partial reproduction, representation or reuse without the publisher's prior written permission is prohibited, apart from short quotations citing the source."),
            T("TradingView, Investing.com et CoinGecko sont des marques ou noms appartenant à leurs propriétaires respectifs. THMTrade n'est affilié à aucun d'entre eux.",
              "TradingView, Investing.com and CoinGecko are trademarks or names belonging to their respective owners. THMTrade is not affiliated with any of them.")] },
      { h: T('Liens externes', 'External links'),
        p: [T("Le site contient des liens vers des sites tiers. L'éditeur n'exerce aucun contrôle sur ces sites et n'est pas responsable de leur contenu, de leurs offres ni de leurs pratiques.",
              "The site contains links to third-party sites. The publisher has no control over these sites and is not responsible for their content, offers or practices.")] },
      { h: T('Droit applicable', 'Applicable law'),
        p: [T("Le site est édité depuis la Polynésie française. Le droit applicable et les juridictions compétentes sont ceux de la Polynésie française, sous réserve des règles impératives protégeant les consommateurs dans leur pays de résidence.",
              "The site is published from French Polynesia. The applicable law and competent courts are those of French Polynesia, subject to mandatory rules protecting consumers in their country of residence.")] }
    ]
  },

  conditions: {
    t: T("Conditions d'utilisation", 'Terms of use'),
    s: [
      { h: T('Objet et acceptation', 'Purpose and acceptance'),
        p: [T("Les présentes conditions encadrent l'utilisation du site THMTrade. En utilisant le site, tu reconnais les avoir lues et acceptées. Si tu ne les acceptes pas, merci de ne pas utiliser le site.",
              "These terms govern the use of the THMTrade website. By using the site you acknowledge having read and accepted them. If you do not accept them, please do not use the site.")] },
      { h: T('Nature éducative du service', 'Educational nature of the service'),
        p: [T("THMTrade est une plateforme éducative. Les contenus (cours, quiz, lexique, patterns, exercices, outils, calculateurs) sont fournis à titre d'information et de formation. Ils ne constituent ni un conseil financier personnalisé, ni une recommandation d'investissement, ni un signal, ni une promesse de gain.",
              "THMTrade is an educational platform. The content (courses, quizzes, glossary, patterns, exercises, tools, calculators) is provided for information and training purposes. It is neither personalised financial advice, nor an investment recommendation, nor a signal, nor a promise of gains.")] },
      { h: T('Accès au service et Premium', 'Access to the service and Premium'),
        p: [T("Dans la version actuelle, l'accès au site est gratuit et ne nécessite aucun compte. Le Premium est présenté à titre d'aperçu : aucun paiement n'est possible et aucun abonnement n'est proposé.",
              "In the current version, access to the site is free and requires no account. Premium is shown as a preview: no payment is possible and no subscription is offered."),
            T("Si une offre payante est lancée, des conditions de vente spécifiques (prix, durée, essai gratuit, résiliation, droit de rétractation le cas échéant) seront publiées et devront être acceptées avant tout achat.",
              "If a paid offer is launched, specific terms of sale (price, duration, free trial, cancellation, right of withdrawal where applicable) will be published and must be accepted before any purchase.")] },
      { h: T('Responsabilité en matière de trading', 'Responsibility for trading'),
        p: [T("Tu es seul responsable de tes décisions d'investissement et de trading. L'éditeur ne peut être tenu responsable des pertes ou dommages résultant de l'utilisation des contenus du site, y compris des exemples, exercices et calculateurs, qui sont simplifiés et fictifs.",
              "You are solely responsible for your investment and trading decisions. The publisher cannot be held liable for losses or damages resulting from the use of the site's content, including examples, exercises and calculators, which are simplified and fictional."),
            T("Ne risque jamais d'argent dont tu as besoin. Renseigne-toi sur les produits, les frais et la réglementation de ton pays, et consulte au besoin un professionnel agréé.",
              "Never risk money you need. Learn about the products, fees and regulation in your country, and consult a licensed professional if needed.")] },
      { h: T('Utilisation autorisée', 'Permitted use'),
        ul: [T("Utiliser le site pour ton apprentissage personnel et non commercial.", 'Use the site for your personal, non-commercial learning.'),
             T("Ne pas copier, extraire de façon automatisée, revendre ou redistribuer les contenus sans autorisation écrite.", 'Do not copy, scrape, resell or redistribute the content without written permission.'),
             T("Ne pas perturber le fonctionnement du site ni tenter d'y accéder de façon frauduleuse.", 'Do not disrupt the operation of the site or attempt to access it fraudulently.')] },
      { h: T('Propriété intellectuelle', 'Intellectual property'),
        p: [T("Les contenus de THMTrade sont protégés (voir les mentions légales). L'utilisation du site ne te confère aucun droit de propriété sur ces contenus, seulement un droit d'usage personnel.",
              "THMTrade content is protected (see the legal notice). Using the site gives you no ownership rights over this content, only a personal right of use.")] },
      { h: T('Progression enregistrée sur ton appareil', 'Progress saved on your device'),
        p: [T("Ta progression (leçons terminées, scores, langue) est enregistrée dans le navigateur de ton appareil. Elle n'est pas sauvegardée sur un serveur : elle peut être perdue si tu vides les données de ton navigateur ou si tu changes d'appareil.",
              "Your progress (completed lessons, scores, language) is saved in your device's browser. It is not backed up on a server: it can be lost if you clear your browser data or change device.")] },
      { h: T('Disponibilité et exactitude', 'Availability and accuracy'),
        p: [T("Le site est fourni « en l'état ». L'éditeur s'efforce de fournir des contenus exacts et à jour, mais ne garantit ni leur exhaustivité, ni leur absence d'erreur, ni la disponibilité continue du site, qui peut être modifié ou interrompu à tout moment. Ces limites s'appliquent sans préjudice des droits que la loi reconnaît impérativement aux consommateurs.",
              "The site is provided “as is”. The publisher strives to provide accurate and up-to-date content but does not guarantee its completeness, freedom from errors or the continuous availability of the site, which may be modified or interrupted at any time. These limits apply without prejudice to the rights that the law mandatorily grants to consumers.")] },
      { h: T('Liens externes', 'External links'),
        p: [T("Les liens vers TradingView, Investing.com, CoinGecko ou d'autres sites mènent vers des services tiers soumis à leurs propres conditions. THMTrade n'en est pas affilié et n'en est pas responsable.",
              "Links to TradingView, Investing.com, CoinGecko or other sites lead to third-party services subject to their own terms. THMTrade is not affiliated with them and is not responsible for them.")] },
      { h: T('Modification des conditions', 'Changes to the terms'),
        p: [T("Ces conditions peuvent évoluer, notamment avec l'ajout de comptes et de paiements. La date de dernière mise à jour figure en haut de la page.",
              "These terms may change, in particular when accounts and payments are added. The date of the last update appears at the top of the page.")] },
      { h: T('Droit applicable et contact', 'Applicable law and contact'),
        p: [T("Le droit applicable et les juridictions compétentes sont ceux de la Polynésie française, sous réserve des règles impératives protégeant les consommateurs dans leur pays de résidence.",
              "The applicable law and competent courts are those of French Polynesia, subject to mandatory rules protecting consumers in their country of residence."),
            T("Pour toute question : {email}.", "For any question: {email}.")] }
    ]
  },

  confidentialite: {
    t: T('Politique de confidentialité', 'Privacy policy'),
    s: [
      { h: T('En résumé', 'In short'),
        p: [T("Dans sa version actuelle, THMTrade fonctionne sans compte utilisateur et sans serveur propre. Le site ne collecte pas de données personnelles via des formulaires, ne dépose pas de cookies publicitaires et n'utilise aucun outil d'analyse d'audience.",
              "In its current version, THMTrade works without user accounts and without its own server. The site does not collect personal data through forms, does not set advertising cookies and uses no audience analytics tool.")] },
      { h: T('Données enregistrées sur ton appareil', 'Data stored on your device'),
        p: [T("Pour fonctionner, le site enregistre les informations suivantes dans le stockage local (localStorage) de ton navigateur :",
              "To work, the site stores the following information in your browser's local storage (localStorage):")],
        ul: [T('les leçons terminées et tes scores de quiz', 'completed lessons and your quiz scores'),
             T('tes résultats de Practice', 'your Practice results'),
             T('ta langue préférée (français ou anglais)', 'your preferred language (French or English)'),
             T('la dernière leçon consultée', 'the last lesson viewed')],
        after: [T("Ces informations restent sur ton appareil : elles ne sont pas envoyées à THMTrade. Elles sont strictement nécessaires au fonctionnement du site (progression et langue). Tu peux les supprimer à tout moment avec le bouton ci-dessous ou en vidant les données de ton navigateur.",
                  "This information stays on your device: it is not sent to THMTrade. It is strictly necessary for the site to work (progress and language). You can delete it at any time with the button below or by clearing your browser data.")] },
      { h: T('Hébergement', 'Hosting'),
        p: [T("Le site est hébergé par GitHub Pages (GitHub, Inc.). Comme tout hébergeur, GitHub peut traiter des données techniques liées à ta visite (par exemple l'adresse IP et des journaux de connexion) selon sa propre politique de confidentialité, à laquelle THMTrade n'a pas accès.",
              "The site is hosted by GitHub Pages (GitHub, Inc.). Like any host, GitHub may process technical data related to your visit (for example your IP address and connection logs) under its own privacy policy, to which THMTrade has no access.")] },
      { h: T('Contact par e-mail', 'Contact by email'),
        p: [T("Si tu écris à {email}, l'éditeur reçoit ton adresse e-mail et le contenu de ton message. Ces informations sont utilisées uniquement pour te répondre et ne sont pas revendues ni transmises à des tiers à des fins commerciales.",
              "If you write to {email}, the publisher receives your email address and the content of your message. This information is used only to reply to you and is not sold or passed to third parties for commercial purposes.")] },
      { h: T('Sites tiers', 'Third-party sites'),
        p: [T("Les liens externes (TradingView, Investing.com, CoinGecko…) mènent vers des sites qui ont leurs propres règles de confidentialité et de cookies. Consulte-les avant de les utiliser.",
              "External links (TradingView, Investing.com, CoinGecko…) lead to sites that have their own privacy and cookie rules. Please read them before using those sites.")] },
      { h: T('Tes droits', 'Your rights'),
        p: [T("Tu peux demander l'accès, la rectification ou la suppression des données que tu nous aurais communiquées (par exemple par e-mail), ainsi que t'opposer à leur utilisation, en écrivant à {email}. Ces droits s'exercent selon la réglementation applicable, en particulier celle en vigueur en Polynésie française et, le cas échéant, le droit de l'Union européenne pour les personnes qui y résident.",
              "You can request access, rectification or deletion of the data you may have sent us (for example by email), and object to its use, by writing to {email}. These rights are exercised under the applicable regulations, in particular those in force in French Polynesia and, where applicable, European Union law for people residing there.")] },
      { h: T('Évolutions à venir', 'Upcoming changes'),
        p: [T("Si THMTrade ajoute des comptes utilisateur, une base de données ou des paiements, de nouvelles données pourront être collectées (identifiants, informations de compte, données de paiement traitées par un prestataire spécialisé). Cette politique sera alors mise à jour avant leur mise en service.",
              "If THMTrade adds user accounts, a database or payments, new data may be collected (identifiers, account information, payment data processed by a specialised provider). This policy will then be updated before they go live.")] }
    ]
  }
};

function viewLegal(key) {
  const d = LEGAL[key];
  let date = CFG.updated || '2026-09-20';
  try { date = new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-US', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(date)); } catch (e) { /* date brute */ }
  const paras = arr => (arr || []).map(p => `<p>${legalFill(tmd(p))}</p>`).join('');
  const body = d.s.map((s, i) => `<section class="legal-sec"><h2><span>${i + 1}.</span>${tx(s.h)}</h2>${paras(s.p)}${s.ul ? `<ul class="les-list">${s.ul.map(li => `<li>${legalFill(tmd(li))}</li>`).join('')}</ul>` : ''}${paras(s.after)}</section>`).join('');
  const links = ['mentions', 'conditions', 'confidentialite'].filter(k => k !== key).map(k => `<a class="chip-link" href="#${k}">${tx(LEGAL[k].t)}</a>`).join('');
  const html = `<section class="page-head container narrow"><h1>${tx(d.t)}</h1><p class="lead">${t('legal.updated', { d: date })}</p></section>
  <section class="section container narrow tight">
    <article class="legal glass">${body}
      ${key === 'confidentialite' ? `<div class="modal-actions"><button type="button" class="btn btn-ghost btn-sm" data-action="reset-progress">${icon('refresh')}${t('foot.reset')}</button></div>` : ''}
    </article>
    <nav class="legal-links" aria-label="${t('legal.other')}">${links}<a class="chip-link" href="#accueil">${icon('arrowL')}${t('nav.home')}</a></nav>
  </section>`;
  return { title: tr('legal.meta.' + key + '.t'), desc: tr('legal.meta.' + key + '.d'), html };
}

/* =====================================================================
   14. ROUTEUR (hash URLs, compatible GitHub Pages)
   #accueil #lexique #cours #cours/1 #cours/1/2 #patterns #pratique
   #outils #premium #faq #mentions #conditions #confidentialite
   (+ #lexique/<terme> et #patterns/<pattern>)
   ===================================================================== */
const NF = { view: 'nf', nav: null };
function currentPath() {
  let h = window.location.hash || '';
  try { h = decodeURIComponent(h); } catch (e) { /* hash malformé : conservé tel quel */ }
  return h.replace(/^#\/?/, '').split('/').filter(Boolean);
}
function resolveRoute(parts) {
  const name = parts[0] || 'accueil', n = parts.length;
  switch (name) {
    case 'accueil': return n <= 1 ? { view: 'home', nav: 'accueil' } : NF;
    case 'lexique': return n <= 2 ? { view: 'lexicon', nav: 'lexique', id: parts[1] } : NF;
    case 'patterns': return n <= 2 ? { view: 'patterns', nav: 'patterns', id: parts[1] } : NF;
    case 'pratique': return n === 1 ? { view: 'practice', nav: 'pratique' } : NF;
    case 'outils': return n === 1 ? { view: 'tools', nav: 'outils' } : NF;
    case 'premium': return n === 1 ? { view: 'premium', nav: 'premium' } : NF;
    case 'faq': return n === 1 ? { view: 'faq', nav: null } : NF;
    case 'mentions': case 'conditions': case 'confidentialite': return n === 1 ? { view: 'legal', nav: null, key: name } : NF;
    case 'cours': {
      if (n === 1) return { view: 'courses', nav: 'cours' };
      const c = COURSE_BY_ID[parts[1]];
      if (!c || n > 3) return NF;
      if (n === 2) return { view: 'course', nav: 'cours', c };
      const k = parseInt(parts[2], 10), les = c.lessons[k - 1];
      if (!les || String(k) !== parts[2]) return NF;
      return { view: 'lesson', nav: 'cours', c, les };
    }
    default: return NF;
  }
}
const VIEWS = {
  home: () => viewHome(),
  courses: () => viewCourses(),
  course: r => viewCourse(r.c),
  lesson: r => viewLesson(r.c, r.les),
  lexicon: () => viewLexicon(),
  patterns: () => viewPatterns(),
  practice: () => viewPractice(),
  tools: () => viewTools(),
  premium: () => viewPremium(),
  faq: () => viewFaq(),
  legal: r => viewLegal(r.key),
  nf: () => viewNotFound()
};

let revealObserver = null;
function initReveal(instant) {
  const els = $$('.reveal:not(.in)', $('#app'));
  if (instant || reduceMotion() || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
  if (!revealObserver) {
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); revealObserver.unobserve(en.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
  }
  els.forEach(e => revealObserver.observe(e));
}
function setMeta(sel, attr, val) { const el = $(sel); if (el) el.setAttribute(attr, val); }

/** Rend la route courante. soft = re-rendu sans animation ni saut de scroll. */
function renderRoute(opts = {}) {
  const r = resolveRoute(currentPath());
  if (!opts.soft) closeModal(true, true);
  let v;
  try { v = VIEWS[r.view](r); }
  catch (err) { if (window.console) console.error('THMTrade render error:', err); v = { title: 'THMTrade', desc: '', html: `<section class="page-head container narrow"><h1>${t('err.h')}</h1><p class="lead">${t('err.p')}</p><a class="btn btn-primary" href="#accueil">${t('nav.home')}</a></section>` }; }
  const app = $('#app'), y = window.pageYOffset;
  app.classList.toggle('soft', !!opts.soft);
  app.innerHTML = v.html;
  const title = /THMTrade/.test(v.title) ? v.title : v.title + ' · THMTrade';
  document.title = title;
  setMeta('meta[name="description"]', 'content', v.desc || '');
  setMeta('meta[property="og:title"]', 'content', title);
  setMeta('meta[property="og:description"]', 'content', v.desc || '');
  setMeta('meta[name="twitter:title"]', 'content', title);
  setMeta('meta[name="twitter:description"]', 'content', v.desc || '');
  setMeta('meta[property="og:locale"]', 'content', lang === 'fr' ? 'fr_FR' : 'en_US');
  $$('#nav a').forEach(a => { if (a.dataset.route === r.nav) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  if (opts.soft) window.scrollTo(0, y);
  else {
    window.scrollTo(0, 0);
    app.classList.remove('view-enter'); void app.offsetWidth; app.classList.add('view-enter');
    if (opts.focus) app.focus({ preventScroll: true });
  }
  initReveal(!!opts.soft);
  if (v.after) v.after();
  if (ui.focusAfter) { const f = $(ui.focusAfter); if (f) f.focus({ preventScroll: true }); ui.focusAfter = null; }
  if (!opts.soft || !modal) {
    if (r.view === 'lexicon' && r.id && LEX_BY_ID[r.id] && !modal) openTerm(r.id);
    if (r.view === 'patterns' && r.id && PAT_BY_ID[r.id] && !modal) openPattern(r.id);
  }
}

/* =====================================================================
   15. ACTIONS (délégation d'événements)
   ===================================================================== */
function setMenu(open) {
  document.body.classList.toggle('nav-open', open);
  const b = $('#burger');
  if (b) b.setAttribute('aria-expanded', open ? 'true' : 'false');
}
function setLang(l) {
  if (LANGS.indexOf(l) === -1 || l === lang) return;
  lang = l; state.lang = l; saveState();
  applyStaticI18n();
  closeModal(true);
  renderRoute({ soft: true });
  toast(tr('lang.changed'), 'info');
}
function resetProgress() {
  state.lessons = {}; state.quiz = {}; state.practice = {}; state.last = null;
  ui.prac = null; ui.patAns = {};
  saveState();
  renderRoute({ soft: true });
  toast(tr('reset.done'), 'info');
}

const ACTIONS = {
  skip() { const a = $('#app'); a.focus(); window.scrollTo(0, 0); },
  lang(el) { setLang(el.dataset.lang); },
  menu() { setMenu(!document.body.classList.contains('nav-open')); },
  'menu-close'() { setMenu(false); },

  /* --- leçons et quiz --- */
  answer(el) {
    const lid = el.dataset.lid, qi = +el.dataset.q, oi = +el.dataset.o;
    if (!answerQuiz(lid, qi, oi)) return;
    ui.justAnswered = lid + ':' + qi;
    ui.focusAfter = `.q[data-q="${qi}"] .q-fb`;
    renderRoute({ soft: true });
    ui.justAnswered = null;
    const les = LESSON_BY_ID[lid];
    if (quizDone(les)) toast(tr('quiz.done', { s: quizScore(les), n: les.q.length }), quizScore(les) === les.q.length ? 'ok' : 'info');
  },
  'retry-quiz'(el) { retryQuiz(el.dataset.lid); ui.focusAfter = '.quiz .q .opt'; renderRoute({ soft: true }); },
  complete(el) {
    const lid = el.dataset.lid, les = LESSON_BY_ID[lid];
    state.lessons[lid] = { done: true, at: Date.now() };
    state.last = lid;
    saveState();
    ui.focusAfter = '.complete';
    renderRoute({ soft: true });
    const c = COURSE_BY_ID[les.cid];
    toast(courseStats(c).done === courseStats(c).total ? tr('toast.course', { c: L(c.t) }) : tr('toast.lesson'));
  },
  uncomplete(el) {
    delete state.lessons[el.dataset.lid]; saveState();
    ui.focusAfter = '.complete';
    renderRoute({ soft: true });
    toast(tr('toast.undo'), 'info');
  },

  /* --- lexique --- */
  'lex-open'(el) { openTerm(el.dataset.id); },
  'lex-cat'(el) { ui.lex.cat = el.dataset.v; refreshLex(); },
  'lex-lvl'(el) { ui.lex.lvl = el.dataset.v; refreshLex(); },
  'lex-reset'() { ui.lex = { q: '', cat: 'all', lvl: 'all' }; const i = $('#lex-q'); if (i) { i.value = ''; i.focus(); } refreshLex(); },

  /* --- patterns --- */
  'pat-open'(el) { openPattern(el.dataset.id); },
  'pat-cat'(el) { ui.pat.cat = el.dataset.v; refreshPat(); },
  'pat-lvl'(el) { ui.pat.lvl = el.dataset.v; refreshPat(); },
  'pat-reset'() { ui.pat = { q: '', cat: 'all', lvl: 'all' }; const i = $('#pat-q'); if (i) { i.value = ''; i.focus(); } refreshPat(); },
  'pat-answer'(el) {
    const id = el.dataset.id, p = PAT_BY_ID[id];
    if (!p || ans(ui.patAns[id])) return;
    ui.patAns[id] = +el.dataset.o;
    ui.justAnswered = 'pat:' + id;
    setModalBody(patternModalHTML(p));
    ui.justAnswered = null;
    const f = $('.modal .q-fb');
    if (f) f.focus({ preventScroll: true });
  },

  /* --- practice --- */
  'prac-start'(el) { if (!PRAC_BY_ID[el.dataset.id]) return; ui.prac = { cat: el.dataset.id, i: 0, ans: [], done: false }; renderRoute(); },
  'prac-answer'(el) {
    const s = ui.prac;
    if (!s || ans(s.ans[s.i])) return;
    s.ans[s.i] = +el.dataset.o;
    ui.justAnswered = 'prac:' + s.i;
    ui.focusAfter = '.q-card .q-fb';
    renderRoute({ soft: true });
    ui.justAnswered = null;
  },
  'prac-next'() {
    const s = ui.prac;
    if (!s) return;
    if (s.i >= PRAC_BY_ID[s.cat].q.length - 1) finishPractice(s); else s.i++;
    renderRoute();
  },
  'prac-quit'() { ui.prac = null; renderRoute(); },

  /* --- outils, premium, FAQ, informations --- */
  'tool-tuto'(el) { const tl = TOOLS.find(x => x.id === el.dataset.id); if (tl) openModal(toolModalHTML(tl), { cls: 'modal-lg' }); },
  bill(el) { ui.bill = el.dataset.v === 'annual' ? 'annual' : 'monthly'; ui.focusAfter = '.bill-toggle [aria-pressed="true"]'; renderRoute({ soft: true }); },
  'premium-cta'() { openModal(premiumModalHTML()); },
  'faq-toggle'(el) {
    const item = el.closest('.faq-item');
    const open = !item.classList.contains('open');
    item.classList.toggle('open', open);
    el.setAttribute('aria-expanded', open ? 'true' : 'false');
  },
  'open-risk'() { openModal(riskModalHTML(), { cls: 'modal-sm' }); },
  'reset-progress'() { confirmModal({ title: tr('reset.h'), text: tr('reset.p'), ok: tr('reset.ok'), danger: true }, resetProgress); },
  'close-modal'() { closeModal(); },
  'modal-backdrop'(el, e) { if (e.target === el) closeModal(); },
  'modal-confirm'() { const cb = confirmCb; confirmCb = null; closeModal(true); if (cb) cb(); }
};

function onClick(e) {
  if (e.target.closest('#nav a')) setMenu(false);
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const fn = ACTIONS[el.dataset.action];
  if (fn) fn(el, e);
}
function onInput(e) {
  const el = e.target, d = el && el.dataset;
  if (!d) return;
  if (d.input === 'lex-q') { ui.lex.q = el.value; refreshLex(); }
  else if (d.input === 'pat-q') { ui.pat.q = el.value; refreshPat(); }
  else if (d.calc === 'pos') calcPos();
  else if (d.calc === 'dd') calcDD();
  else if (d.calc === 'exp') calcExp();
}
function onKey(e) {
  if (modal) { trapFocus(e); return; }
  if (e.key === 'Escape' && document.body.classList.contains('nav-open')) { setMenu(false); const b = $('#burger'); if (b) b.focus(); }
}
function onScroll() {
  const h = $('#site-header');
  if (h) h.classList.toggle('scrolled', window.pageYOffset > 8);
}

/* =====================================================================
   16. INITIALISATION
   ===================================================================== */
function init() {
  loadState();
  lang = detectLang();
  buildIndex();
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  applyStaticI18n();
  document.addEventListener('click', onClick);
  document.addEventListener('input', onInput);
  document.addEventListener('keydown', onKey);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('hashchange', () => { setMenu(false); renderRoute({ focus: true }); });
  window.addEventListener('resize', () => { if (window.innerWidth >= 960) setMenu(false); });
  onScroll();
  renderRoute();
}
init();
})();
