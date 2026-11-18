import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore, collection, doc, onSnapshot, setDoc, addDoc, updateDoc, deleteDoc,
  query, where, serverTimestamp, Timestamp,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig, USERS, NAMES } from "./config.js";

/* ───────── utilidades ───────── */
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const safeUrl = (u) => { try { const x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : ""; } catch { return ""; } };
const money = (n) => "S/ " + (Number(n) || 0).toLocaleString("es-PE", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const fmtDate = (d) => d.toLocaleDateString("es-PE", { day: "numeric", month: "long" });
const parseDay = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const toast = (msg) => { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 2400); };

const PRIORITY = { 3: "🔥 Lo quiero mucho", 2: "🙂 Estaría bien", 1: "✨ Si sobra" };
const STATUS = { porir: "Por ir", fuimos: "Fuimos", repetiria: "Repetiría" };
const QUESTIONS = [
  "¿Cuál es tu recuerdo navideño favorito de la infancia?",
  "¿Qué comida no puede faltar en tu Navidad?",
  "¿Cuál es la mejor película de Navidad (o la peor, pero que igual ves)?",
  "Si pudieras pasar una Navidad en cualquier lugar, ¿dónde sería?",
  "¿Cuál fue el mejor regalo que has recibido?",
  "¿Y el regalo más raro o desastroso que te dieron?",
  "¿Prefieres dar regalos o recibirlos? ¿Por qué?",
  "¿Cuál es tu villancico favorito?",
  "¿Qué tradición navideña te gustaría empezar?",
  "¿Cómo sería tu plan perfecto para una noche de diciembre?",
  "¿Qué es lo que más te gusta de diciembre?",
  "¿Qué deseo tienes para el próximo año?",
  "¿Dulce o salado en una cena de Navidad?",
  "¿Qué lugar de Lima (o de donde estés) te encanta en estas fechas?",
  "Describe tu outfit navideño ideal.",
  "¿Qué canción te recuerda a diciembre?",
  "¿Cuál es el mejor regalo que has dado?",
  "¿Una cosa pequeña que te haga feliz en un día cualquiera?",
];
const FEATURES = [
  { id: "aventuras", icon: "🗺️", q: "¿Te gustaría hacer más planes y no solo quedarnos en Navidad?", title: "Aventuras", desc: "Una lista de planes y salidas para votar. Si los dos dicen que sí, ¡es un match de plan!", tab: "aventuras" },
  { id: "juegos", icon: "🎮", q: "¿Quieres jugar?", title: "Juegos y retos", desc: "Esto o aquello, un quiz, cápsula del tiempo, cupones y bingo navideño.", tab: "juegos" },
  { id: "adviento", icon: "🎄", title: "Calendario de adviento", desc: "Una pequeña sorpresa, recuerdo o mensaje para cada día de diciembre." },
  { id: "galeria", icon: "📸", title: "Galería y línea de tiempo", desc: "Fotos de los dos y las fechas que han compartido, en una línea de tiempo." },
];
const ADV = [
  ["cuatrimotos", "🏍️", "Cuatrimotos"], ["parapente", "🪂", "Parapente"], ["karting", "🏎️", "Karting"], ["paintball", "🎯", "Paintball"],
  ["escalada", "🧗", "Escalada"], ["kayak", "🛶", "Kayak"], ["tirolesa", "🌲", "Tirolesa"], ["caballos", "🐎", "Paseo a caballo"],
  ["cena", "🍷", "Ir a cenar (elegantes)"], ["cine", "🎬", "Noche de cine"], ["picnic", "🌅", "Picnic al atardecer"], ["patinaje", "⛸️", "Patinaje"],
  ["parque", "🎡", "Parque de diversiones"], ["show", "🎤", "Concierto o show"], ["spa", "💆", "Spa o masajes"], ["luces", "✨", "Ver las luces de la ciudad"],
  ["baile", "💃", "Salir a bailar"], ["libreria", "📚", "Café y librería"],
];
const EOA = [
  ["Playa", "Montaña"], ["Café", "Chocolate caliente"], ["Pizza", "Sushi"], ["Peli en casa", "Cine"], ["Madrugar", "Trasnochar"],
  ["Dulce", "Salado"], ["Verano", "Invierno"], ["Perros", "Gatos"], ["Viajar", "Quedarnos en casa"], ["Bailar", "Karaoke"],
  ["Fotos", "Videos"], ["Mensajes", "Llamadas"], ["Panetón", "Chocolatada"], ["Aventura", "Relax"], ["Planear todo", "Improvisar"],
  ["Música en vivo", "Playlist en casa"], ["Luces de Navidad", "Fuegos artificiales"], ["Cena elegante", "Parrilla informal"],
];
const QUIZ = [
  ["Una noche tranquila ideal es…", ["Peli y manta", "Salir a cenar", "Series o videojuegos", "Dormir temprano"]],
  ["Lo que más energía me da…", ["La música", "La naturaleza", "El deporte", "Estar con amigos"]],
  ["Mi postre favorito…", ["Helado", "Torta de chocolate", "Frutas", "No soy de postres"]],
  ["Mi viaje ideal…", ["Playa", "Ciudad", "Montaña y aventura", "Un pueblo tranquilo"]],
  ["Lo que más valoro en un regalo…", ["Que sea útil", "Que sea sorpresa", "Que tenga significado", "Que sea un detalle especial"]],
  ["Para mi cumpleaños prefiero…", ["Fiesta grande", "Cena íntima", "Un viaje", "Tranquilo en casa"]],
  ["Lo que me pone de buen humor en la mañana…", ["Un café", "Música", "Dormir más", "Un desayuno rico"]],
  ["El detalle que más me conquista…", ["Un mensaje bonito", "Un abrazo", "Un regalo", "Tiempo juntos"]],
  ["Mi mayor miedo en una aventura…", ["Las alturas", "La velocidad", "El agua", "Ninguno"]],
  ["Mis películas favoritas…", ["Comedia", "Romance", "Acción", "Terror"]],
];
const BINGO = ["Tomar chocolatada", "Ver las luces de la ciudad", "Escuchar un villancico", "Ver una peli navideña", "Armar el árbol", "Tomarnos una foto navideña", "Hacer galletas", "Una cena rica", "Brindar", "Usar un gorro de Papá Noel", "Mandar un mensaje bonito", "Bailar una canción", "Probar panetón", "Cantar un villancico", "Pedir un deseo", "Un abrazo bien largo"];

/* ───────── estado ───────── */
const configured = firebaseConfig.apiKey !== "PEGAR_AQUI";
const S = { user: null, me: null, other: null, tab: "inicio", sub: { regalos: "mine", sorpresas: "cartas", mas: "playlist", juego: "eoa" }, placeFilter: "todos", error: "" };
const D = { config: {}, wishes: [], purchases: [], places: [], lettersA: [], lettersB: [], clues: [], playlist: [], qa: [], proposals: {} };
let db, auth, unsubs = [], lettersTimer;

/* ───────── modal ───────── */
function fieldHtml(f, val) {
  const v = val ?? f.value ?? "";
  const req = f.required ? "required" : "";
  let input;
  if (f.type === "textarea") input = `<textarea name="${f.name}" ${req} placeholder="${esc(f.ph || "")}">${esc(v)}</textarea>`;
  else if (f.type === "select") input = `<select name="${f.name}">${f.options.map(([k, l]) => `<option value="${esc(k)}" ${String(v) === String(k) ? "selected" : ""}>${esc(l)}</option>`).join("")}</select>`;
  else input = `<input name="${f.name}" type="${f.type || "text"}" ${req} value="${esc(v)}" placeholder="${esc(f.ph || "")}" ${f.type === "number" ? 'inputmode="decimal" step="any" min="0"' : ""}>`;
  return `<label>${esc(f.label)}${input}</label>`;
}
function ask(title, fields, init = {}, ok = "Guardar", intro = "") {
  return new Promise((resolve) => {
    const m = $("#modal");
    m.innerHTML = `<form class="mform"><h2>${esc(title)}</h2>${intro ? `<p class="muted">${esc(intro)}</p>` : ""}${fields.map((f) => fieldHtml(f, init[f.name])).join("")}<div class="mactions"><button type="button" class="btn ghost" data-close>Cancelar</button><button class="btn primary">${esc(ok)}</button></div></form>`;
    let done = false;
    const finish = (val) => { if (done) return; done = true; if (m.open) m.close(); resolve(val); };
    m.querySelector("form").onsubmit = (e) => { e.preventDefault(); finish(Object.fromEntries(new FormData(e.target).entries())); };
    m.querySelector("[data-close]").onclick = () => finish(null);
    m.onclose = () => finish(null);
    m.showModal();
  });
}
function info(title, html) {
  const m = $("#modal");
  m.innerHTML = `<div class="mform"><h2>${esc(title)}</h2>${html}<div class="mactions"><button class="btn primary" data-close>Listo</button></div></div>`;
  m.onclose = null;
  m.querySelector("[data-close]").onclick = () => m.close();
  m.showModal();
}

/* ───────── nieve ───────── */
(function snow() {
  const el = $("#snow");
  for (let i = 0; i < 38; i++) {
    const s = document.createElement("i"), size = 2 + Math.random() * 4;
    s.style.cssText = `left:${Math.random() * 100}%;width:${size}px;height:${size}px;animation-duration:${9 + Math.random() * 12}s;animation-delay:${-Math.random() * 20}s;--dx:${(Math.random() - .5) * 80}px;opacity:${.35 + Math.random() * .5}`;
    el.appendChild(s);
  }
})();

/* ───────── Firebase ───────── */
function startApp() {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  onAuthStateChanged(auth, (u) => {
    unsubs.forEach((f) => f()); unsubs = []; clearInterval(lettersTimer);
    if (!u) { S.user = null; S.me = null; renderRoot(); return; }
    const who = USERS[(u.email || "").toLowerCase()];
    if (!who || !u.emailVerified) {
      S.error = "Esta cuenta (" + (u.email || "") + ") no tiene acceso a esta app.";
      signOut(auth); return;
    }
    S.error = ""; S.user = u; S.me = who.id;
    S.other = who.id === "fer" ? "mafer" : "fer";
    subscribe();
    renderRoot();
  });
}

function listen(q, fn) { unsubs.push(onSnapshot(q, (snap) => { fn(snap); render(); }, (e) => console.error("Firestore:", e.code, e.message))); }
const docs = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));

function subscribe() {
  const me = S.me;
  listen(doc(db, "config", "main"), (s) => { D.config = s.data() || {}; });
  listen(collection(db, "wishes"), (s) => { D.wishes = docs(s); });
  listen(query(collection(db, "purchases"), where("buyer", "==", me)), (s) => { D.purchases = docs(s); });
  listen(collection(db, "places"), (s) => { D.places = docs(s); });
  listen(collection(db, "clues"), (s) => { D.clues = docs(s); });
  listen(collection(db, "playlist"), (s) => { D.playlist = docs(s); });
  listen(collection(db, "qa"), (s) => { D.qa = docs(s); });
  listen(collection(db, "proposals"), (s) => { D.proposals = Object.fromEntries(docs(s).map((x) => [x.id, x])); });
  listen(query(collection(db, "letters"), where("from", "==", me)), (s) => { D.lettersA = docs(s); });
  // Cartas ya abiertas (la regla de seguridad exige unlockAt <= hora del servidor)
  let unB = null;
  const subB = () => {
    if (unB) unB();
    unB = onSnapshot(query(collection(db, "letters"), where("unlockAt", "<=", Timestamp.fromMillis(Date.now() - 60000))),
      (s) => { D.lettersB = docs(s); render(); }, (e) => console.error("Firestore:", e.code, e.message));
  };
  subB();
  lettersTimer = setInterval(subB, 5 * 60 * 1000);
  unsubs.push(() => unB && unB());
}

/* ───────── render ───────── */
function renderRoot() {
  const app = $("#app");
  if (!configured) {
    app.innerHTML = `<div class="center"><div class="login card"><div class="big">🛠️</div><h1>Falta configurar</h1><p>Pega los datos de tu proyecto Firebase en <code>js/config.js</code>.</p></div></div>`;
    return;
  }
  if (!S.user) {
    app.innerHTML = `<div class="center"><div class="login">
      <div class="big">🎁</div><h1>Intercambio Fer y Mafer</h1>
      <div style="height:18px"></div>
      <button class="btn primary block" data-act="login">Entrar con Google</button>
      ${S.error ? `<p class="err">${esc(S.error)}</p>` : ""}
    </div></div>`;
    return;
  }
  app.innerHTML = `
    <header class="top"><div class="brand">🎄 Intercambio</div>
      <div class="chip-user"><span>${esc(NAMES[S.me])}</span><button data-act="logout">Salir</button></div></header>
    <main id="view"></main>
    <nav class="nav"><div class="nav-in">
      ${[["inicio", "🏠", "Inicio"], ["regalos", "🎁", "Regalos"], ["planes", "🍽️", "Planes"], ["sorpresas", "💌", "Sorpresas"], ["mas", "⭐", "Más"]]
        .map(([k, i, l]) => `<button data-act="tab" data-v="${k}" class="${S.tab === k ? "on" : ""}" ${S.tab === k ? 'aria-current="page"' : ""}><span>${i}</span>${l}</button>`).join("")}
    </div></nav>`;
  render();
}

function render() {
  const v = $("#view");
  if (!v || !S.user) return;
  v.innerHTML = { inicio, regalos, planes, sorpresas, mas }[S.tab]();
  document.querySelectorAll(".nav button").forEach((b) => b.classList.toggle("on", b.dataset.v === S.tab));
  tick();
}

const seg = (key, items) => `<div class="seg" role="tablist">${items.map(([k, l]) => `<button role="tab" data-act="sub" data-key="${key}" data-v="${k}" class="${S.sub[key] === k ? "on" : ""}">${l}</button>`).join("")}</div>`;
/* ── Inicio ── */
function countdownParts() {
  const ds = D.config.exchangeDate;
  if (!ds) return null;
  const diff = parseDay(ds).getTime() - Date.now();
  if (diff <= 0) return { done: true };
  return { d: Math.floor(diff / 864e5), h: Math.floor(diff / 36e5) % 24, m: Math.floor(diff / 6e4) % 60, s: Math.floor(diff / 1e3) % 60 };
}
function tick() {
  const el = $("#count"); if (!el) return;
  const c = countdownParts();
  if (!c) { el.innerHTML = `<p class="muted" style="grid-column:1/-1">Elijan la fecha del intercambio 👇</p>`; return; }
  if (c.done) { el.innerHTML = `<p style="grid-column:1/-1;font-size:1.3rem">🎉 ¡Es hoy (o ya pasó)! ¡Feliz Navidad!</p>`; return; }
  el.innerHTML = [["d", "días"], ["h", "horas"], ["m", "min"], ["s", "seg"]].map(([k, l]) => `<div><b>${String(c[k]).padStart(2, "0")}</b><span>${l}</span></div>`).join("");
}
setInterval(tick, 1000);

function inicio() {
  const mine = (D.config.exchangeDate) ? fmtDate(parseDay(D.config.exchangeDate)) : "";
  const wishesOther = D.wishes.filter((w) => w.owner === S.other && w.kind === "want").length;
  const toGo = D.places.filter((p) => p.status === "porir").length;
  const opened = D.lettersB.filter((l) => l.to === S.me && !l.capsule).length;
  const matches = unlocked("aventuras") ? advAll().filter((a) => advState(a) === "match" && !D.proposals[a.id]?.done).length : 0;
  const pending = FEATURES.filter((f) => !((D.proposals[f.id]?.votes || {})[S.me])).length;
  return `
    <section class="card hero">
      <div class="eyebrow">Hola, ${esc(NAMES[S.me])} 👋</div>
      <h1>Faltan para el intercambio</h1>
      <div class="count" id="count"></div>
      <button class="btn gold" data-act="set-date">${mine ? `📅 ${esc(mine)} · cambiar` : "📅 Elegir fecha"}</button>
    </section>
    <section class="card stack">
      <h2>Para hoy</h2>
      <button class="btn block" data-act="tab" data-v="regalos" data-sub="regalos:other">🎁 ${wishesOther} deseos de ${esc(NAMES[S.other])}</button>
      ${unlocked("aventuras") ? `<button class="btn block" data-act="tab" data-v="mas" data-sub="mas:aventuras">🎯 ${matches} ${matches === 1 ? "match de plan" : "matches de planes"}</button>` : ""}
      <button class="btn block" data-act="tab" data-v="planes">🍽️ ${toGo} planes por ir</button>
      <button class="btn block" data-act="tab" data-v="sorpresas">💌 ${opened} ${opened === 1 ? "carta abierta" : "cartas abiertas"} para ti</button>
      ${pending ? `<button class="btn block" data-act="tab" data-v="mas" data-sub="mas:propuestas">⭐ ${pending} ${pending === 1 ? "propuesta" : "propuestas"} esperan tu voto</button>` : ""}
    </section>`;
}

/* ── Regalos ── */
function wishCard(w, mineView) {
  const url = safeUrl(w.url);
  const purchase = D.purchases.find((p) => p.id === w.id);
  return `<div class="item">
    <div class="row between"><span class="title">${url ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(w.title)}</a>` : esc(w.title)}</span></div>
    <div class="row" style="margin-top:4px"><span class="tag">${PRIORITY[w.priority] || PRIORITY[2]}</span>${purchase ? `<span class="tag ok">✓ Ya lo compré</span>` : ""}</div>
    ${w.note ? `<p class="muted" style="margin-top:6px">${esc(w.note)}</p>` : ""}
    <div class="actions">
      ${mineView ? `<button class="btn small" data-act="wish-edit" data-id="${w.id}">Editar</button><button class="btn small danger" data-act="wish-del" data-id="${w.id}">Borrar</button>`
        : `<button class="btn small ${purchase ? "" : "gold"}" data-act="buy" data-id="${w.id}">${purchase ? "Quitar “comprado”" : "✓ Ya lo compré"}</button>`}
    </div></div>`;
}
function regalos() {
  const mineView = S.sub.regalos === "mine";
  const owner = mineView ? S.me : S.other;
  const list = D.wishes.filter((w) => w.owner === owner);
  const want = list.filter((w) => w.kind === "want").sort((a, b) => (b.priority || 0) - (a.priority || 0));
  const avoid = list.filter((w) => w.kind === "avoid");
  return `${seg("regalos", [["mine", "Mis deseos"], ["other", `Deseos de ${esc(NAMES[S.other])}`]])}
    <section class="card">
      <div class="row between"><h2>${mineView ? "Lo que quiero" : `Lo que quiere ${esc(NAMES[S.other])}`}</h2>
        ${mineView ? `<button class="btn primary small" data-act="wish-add" data-kind="want">+ Agregar</button>` : ""}</div>
      ${want.length ? want.map((w) => wishCard(w, mineView)).join("") : `<p class="empty">${mineView ? "Aún no agregas nada. ¡Anímate! 🎅" : "Todavía no ha agregado deseos."}</p>`}
    </section>
    <section class="card">
      <div class="row between"><h2>No me regales 🚫</h2>${mineView ? `<button class="btn small" data-act="wish-add" data-kind="avoid">+ Agregar</button>` : ""}</div>
      ${avoid.length ? avoid.map((w) => wishCard(w, mineView).replace(/<div class="row" style="margin-top:4px">.*?<\/div>/s, "")).join("") : `<p class="empty">Nada por aquí.</p>`}
    </section>`;
}

/* ── Planes ── */
const avgRating = (p) => { const r = Object.values(p.ratings || {}).filter(Boolean); return r.length ? r.reduce((a, b) => a + b, 0) / r.length : 0; };
function stars(p, who) {
  const val = (p.ratings || {})[who] || 0, own = who === S.me;
  return `<span class="stars ${own ? "" : "ro"}" aria-label="${esc(NAMES[who])}: ${val} de 5">${[1, 2, 3, 4, 5].map((n) => `<button data-act="rate" data-id="${p.id}" data-n="${n}" class="${n <= val ? "on" : ""}" aria-label="${n} estrellas">★</button>`).join("")}</span>`;
}
function planes() {
  const f = S.placeFilter;
  const list = D.places.filter((p) => f === "todos" || p.status === f).sort((a, b) => avgRating(b) - avgRating(a));
  return `<div class="row between" style="margin-bottom:12px"><h2 style="font-size:1.6rem;color:var(--gold)">Restaurantes y planes</h2><button class="btn primary small" data-act="place-add">+ Agregar</button></div>
    <button class="btn gold block" data-act="surprise" style="margin-bottom:12px">🎲 ¡Sorprendernos!</button>
    <div class="chips">${[["todos", "Todos"], ...Object.entries(STATUS)].map(([k, l]) => `<button class="chip ${f === k ? "on" : ""}" data-act="pfilter" data-v="${k}">${l}</button>`).join("")}</div>
    ${list.length ? list.map((p) => {
      const url = safeUrl(p.link), avg = avgRating(p);
      return `<section class="card">
        <div class="row between"><span class="tag">${p.type === "plan" ? "Plan" : "Restaurante"}</span>${avg ? `<span class="price">★ ${avg.toFixed(1)}</span>` : ""}</div>
        <h3 style="margin-top:6px">${url ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(p.name)}</a>` : esc(p.name)}</h3>
        ${p.note ? `<p class="muted">${esc(p.note)}</p>` : ""}
        <div class="stack" style="margin-top:8px">
          ${["fer", "mafer"].map((w) => `<div class="row between"><span class="muted">${esc(NAMES[w])}</span>${stars(p, w)}</div>`).join("")}
        </div>
        <div class="actions" style="margin-top:10px">
          <select class="sel" data-change="pstatus" data-id="${p.id}" aria-label="Estado">${Object.entries(STATUS).map(([k, l]) => `<option value="${k}" ${p.status === k ? "selected" : ""}>${l}</option>`).join("")}</select>
          <button class="btn small" data-act="place-edit" data-id="${p.id}">Editar</button>
          ${p.addedBy === S.me ? `<button class="btn small danger" data-act="place-del" data-id="${p.id}">Borrar</button>` : ""}
        </div></section>`;
    }).join("") : `<p class="empty">No hay nada aquí todavía. ¡Agreguen su primer plan! 🍷</p>`}`;
}

/* ── Sorpresas ── */
function sorpresas() {
  return seg("sorpresas", [["cartas", "💌 Cartas secretas"], ["adivina", "🕵️ Adivina el regalo"]]) + (S.sub.sorpresas === "cartas" ? cartas() : adivina());
}
function cartas() {
  const inbox = D.lettersB.filter((l) => l.to === S.me && !l.capsule).sort((a, b) => b.unlockAt.toMillis() - a.unlockAt.toMillis());
  const sent = D.lettersA.filter((l) => !l.capsule).sort((a, b) => a.unlockAt.toMillis() - b.unlockAt.toMillis());
  return `<section class="card"><div class="row between"><h2>Para ti</h2></div>
      <p class="muted" style="margin-bottom:10px">Las cartas se abren solas en la fecha que eligió quien las escribió.</p>
      ${inbox.length ? inbox.map((l) => `<div class="envelope" style="margin-bottom:10px"><div class="eyebrow">💌 De ${esc(NAMES[l.from])} · ${fmtDate(l.unlockAt.toDate())}</div><p style="margin-top:6px">${esc(l.text)}</p></div>`).join("") : `<p class="empty">Aún no hay cartas abiertas para ti. ¡Paciencia! 🎅</p>`}</section>
    <section class="card"><div class="row between"><h2>Las que escribiste</h2><button class="btn primary small" data-act="letter-add">+ Escribir</button></div>
      ${sent.length ? sent.map((l) => { const open = l.unlockAt.toMillis() <= Date.now(); return `<div class="item"><div class="row between"><span class="tag ${open ? "ok" : "red"}">${open ? "Ya abierta" : "🔒 Se abre el " + fmtDate(l.unlockAt.toDate())}</span><button class="btn small danger" data-act="letter-del" data-id="${l.id}">Borrar</button></div><p class="muted" style="margin-top:6px;white-space:pre-wrap">${esc(l.text)}</p></div>`; }).join("") : `<p class="empty">Escribe una carta para ${esc(NAMES[S.other])}.</p>`}</section>`;
}
function adivina() {
  const toMe = D.clues.filter((c) => c.to === S.me && !c.type), byMe = D.clues.filter((c) => c.from === S.me && !c.type);
  const clueList = (c) => c.clues.map((t, i) => `<div class="clue"><b>Pista ${i + 1}:</b> ${esc(t)}</div>`).join("");
  return `<section class="card"><h2>Para adivinar</h2>
      ${toMe.length ? toMe.map((c) => `<div class="item">${clueList(c)}
        ${c.reveal ? `<div class="envelope" style="margin-top:10px"><div class="eyebrow">🎁 Revelación</div><p>${esc(c.reveal)}</p></div>` : ""}
        <div class="row between" style="margin-top:10px"><span class="muted">${c.guess ? "Tu respuesta: “" + esc(c.guess) + "”" : "Aún no has adivinado"}</span>
        ${c.reveal ? "" : `<button class="btn small gold" data-act="guess" data-id="${c.id}">${c.guess ? "Cambiar" : "Adivinar"}</button>`}</div></div>`).join("") : `<p class="empty">${esc(NAMES[S.other])} aún no te deja pistas.</p>`}</section>
    <section class="card"><div class="row between"><h2>Tus pistas</h2><button class="btn primary small" data-act="clue-add">+ Crear</button></div>
      ${byMe.length ? byMe.map((c) => `<div class="item">${clueList(c)}
        <p class="muted" style="margin-top:8px">${c.guess ? esc(NAMES[S.other]) + " cree que es: “" + esc(c.guess) + "”" : esc(NAMES[S.other]) + " aún no responde."}</p>
        <div class="actions"><button class="btn small gold" data-act="reveal" data-id="${c.id}">${c.reveal ? "Editar revelación" : "Revelar"}</button><button class="btn small danger" data-act="clue-del" data-id="${c.id}">Borrar</button></div></div>`).join("") : `<p class="empty">Deja 3 pistas de un regalo para ${esc(NAMES[S.other])} y que lo adivine. 🎁</p>`}</section>`;
}

/* ── Más ── */
const unlocked = (id) => { const v = D.proposals[id]?.votes || {}; return v.fer === "yes" && v.mafer === "yes"; };
function mas() {
  const items = [["playlist", "🎵 Playlist"], ["retos", "💬 Retos"], ["propuestas", "⭐ Propuestas"]];
  if (unlocked("aventuras")) items.push(["aventuras", "🗺️ Aventuras"]);
  if (unlocked("juegos")) items.push(["juegos", "🎮 Juegos"]);
  if (!items.some(([k]) => k === S.sub.mas)) S.sub.mas = "propuestas";
  return seg("mas", items) + { playlist, retos, propuestas, aventuras, juegos }[S.sub.mas]();
}
function playlist() {
  return `<section class="card"><div class="row between"><h2>Playlist navideña</h2><button class="btn primary small" data-act="song-add">+ Canción</button></div>
    ${D.playlist.length ? [...D.playlist].sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0)).map((s) => { const u = safeUrl(s.link); return `<div class="item"><div class="row between"><span class="title">🎵 ${u ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a>` : esc(s.title)}</span>${s.addedBy === S.me ? `<button class="btn small danger" data-act="song-del" data-id="${s.id}">Quitar</button>` : `<span class="tag">${esc(NAMES[s.addedBy])}</span>`}</div></div>`; }).join("") : `<p class="empty">Agreguen sus villancicos y canciones favoritas.</p>`}</section>`;
}
function retos() {
  return `<section class="card"><h2>Quiero conocerte mejor 😊</h2><p class="muted">Verás la respuesta cuando el otro haya respondido.</p></section>` +
    QUESTIONS.map((q, i) => {
      const mine = D.qa.find((a) => a.id === `${i}_${S.me}`), theirs = D.qa.find((a) => a.id === `${i}_${S.other}`);
      return `<section class="card"><h3>${i + 1}. ${esc(q)}</h3>
        ${mine ? `<div class="clue"><b>${esc(NAMES[S.me])}:</b> ${esc(mine.text)}</div>` : ""}
        ${mine && theirs ? `<div class="clue"><b>${esc(NAMES[S.other])}:</b> ${esc(theirs.text)}</div>` : ""}
        ${mine && !theirs ? `<p class="muted" style="margin-top:8px">Esperando a ${esc(NAMES[S.other])}…</p>` : ""}
        ${!mine && theirs ? `<p class="muted" style="margin-top:8px">${esc(NAMES[S.other])} ya respondió. Responde para verlo 👀</p>` : ""}
        <div class="actions"><button class="btn small ${mine ? "" : "gold"}" data-act="qa" data-i="${i}">${mine ? "Editar mi respuesta" : "Responder"}</button></div></section>`;
    }).join("");
}
function propuestas() {
  return `<section class="card"><h2>Propuestas</h2></section>` +
    FEATURES.map((f) => {
      const votes = D.proposals[f.id]?.votes || {}, mine = votes[S.me], both = votes.fer && votes.mafer, yes = both && votes.fer === "yes" && votes.mafer === "yes";
      let state = "";
      if (both) state = yes ? `<span class="tag ok">🎉 ¡Aprobado por los dos!</span>` : `<span class="tag red">Por ahora no</span>`;
      else if (mine) state = `<span class="tag">Votaste. Falta el voto de ${esc(NAMES[S.other])}</span>`;
      return `<section class="card"><h3>${f.icon} ${esc(f.q || f.title)}</h3><p class="muted" style="margin:4px 0 10px">${esc(f.desc)}</p>
        <div class="row">${state}
          <button class="btn small ${mine === "yes" ? "primary" : ""}" data-act="vote" data-id="${f.id}" data-v="yes">Sí ✅</button>
          <button class="btn small ${mine === "no" ? "primary" : ""}" data-act="vote" data-id="${f.id}" data-v="no">Mejor no</button>
          ${yes && f.tab ? `<button class="btn small gold" data-act="sub" data-key="mas" data-v="${f.tab}">Abrir →</button>` : ""}</div></section>`;
    }).join("");
}

/* ── Aventuras (match de planes) ── */
const advAll = () => [
  ...ADV.map(([id, icon, title]) => ({ id: "adv_" + id, icon, title })),
  ...Object.values(D.proposals).filter((p) => p.kind === "adv").map((p) => ({ id: p.id, icon: "✨", title: p.title })),
];
const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const sugText = (s) => s?.date ? esc(parseDay(s.date).toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })) : s?.month ? esc(s.month) : "sin preferencia";
const CONSENT = [
  (t, n) => `${t} ${n}: al dar tu consentimiento aceptas realizar este plan con todas sus consecuencias, abrazos y selfies incluidos. No se aceptan devoluciones. 😏`,
  (t, n) => `${t} ${n}, declaras estar en pleno uso de tus facultades. Cualquier excusa de último minuto será rechazada por el Comité Oficial de Planes. 📜`,
  (t, n) => `Con este clic, ${t} ${n}, firmas ante notario imaginario. Si te rajas, debes un helado (de los grandes). 🍦`,
  (t, n) => `Atención, ${t} ${n}: este “me animo” tiene valor legal en toda la república del cariño. Las caras de miedo no cuentan como cancelación. 😂`,
];
const advState = (a) => { const v = D.proposals[a.id]?.votes || {}; return v.fer && v.mafer ? (v.fer === "yes" && v.mafer === "yes" ? "match" : "no") : (v[S.me] ? "wait" : "todo"); };
function advCard(a) {
  const doc_ = D.proposals[a.id] || {}, v = doc_.votes || {}, mine = v[S.me], st = advState(a);
  let state = "";
  if (st === "match") state = `<span class="tag ok">🎯 ¡Match!</span>${doc_.done ? `<span class="tag ok">✓ Hecho</span>` : ""}${doc_.date ? `<span class="tag">📅 ${fmtDate(parseDay(doc_.date))}</span>` : ""}`;
  else if (st === "no") state = `<span class="tag red">Esta vez no</span>`;
  else if (st === "wait") state = `<span class="tag">Votaste · falta ${esc(NAMES[S.other])}</span>`;
  return `<section class="card ${st === "match" ? "match" : ""}"><h3>${a.icon} ${esc(a.title)}</h3>
    ${state ? `<div class="row" style="margin-top:6px">${state}</div>` : ""}
    ${st === "match" ? `<p class="muted" style="margin-top:6px">🗓️ ${["fer", "mafer"].map((w) => `${esc(NAMES[w])}: ${sugText(doc_.suggest?.[w])}`).join(" · ")}</p>` : (mine === "yes" ? `<p class="muted" style="margin-top:6px">🗓️ Tu sugerencia: ${sugText(doc_.suggest?.[S.me])}</p>` : "")}
    <div class="actions">
      <button class="btn small ${mine === "yes" ? "primary" : ""}" data-act="adv-yes" data-id="${a.id}">✅ Me animo</button>
      <button class="btn small ${mine === "no" ? "primary" : ""}" data-act="vote" data-id="${a.id}" data-v="no">🙅 Mejor no</button>
      ${st === "match" ? `<button class="btn small" data-act="adv-date" data-id="${a.id}">📅 Fecha</button><button class="btn small ${doc_.done ? "" : "gold"}" data-act="adv-done" data-id="${a.id}">${doc_.done ? "Desmarcar" : "✓ Hecho"}</button>` : ""}
    </div></section>`;
}
function aventuras() {
  const g = { match: [], todo: [], wait: [], no: [] };
  advAll().forEach((a) => g[advState(a)].push(a));
  const sec = (t, l) => l.length ? `<h3 class="sec">${t} · ${l.length}</h3>${l.map(advCard).join("")}` : "";
  return `<section class="card"><div class="row between"><h2>Aventuras 🗺️</h2><button class="btn primary small" data-act="adv-add">+ Proponer</button></div>
      <p class="muted">Cuando los dos dicen “me animo”, es un match de plan. Nadie ve el voto del otro hasta que ambos votan.</p>
      ${g.match.length ? `<button class="btn gold block" data-act="adv-roulette" style="margin-top:10px">🎲 Ruleta de planes</button>` : ""}</section>
    ${sec("🎯 Match de planes", g.match)}${sec("Tu turno", g.todo)}${sec("Esperando", g.wait)}${sec("Esta vez no", g.no)}`;
}

/* ── Juegos ── */
function juegos() {
  const subs = [["eoa", "Esto o aquello"], ["quiz", "Quiz"], ["capsula", "Cápsula"], ["cupones", "Cupones"], ["bingo", "Bingo"]];
  return `<div class="chips">${subs.map(([k, l]) => `<button class="chip ${S.sub.juego === k ? "on" : ""}" data-act="sub" data-key="juego" data-v="${k}">${l}</button>`).join("")}</div>` + { eoa, quiz, capsula, cupones, bingo }[S.sub.juego]();
}
const qaGet = (id) => D.qa.find((a) => a.id === id);
function eoa() {
  let both = 0, match = 0;
  const cards = EOA.map(([a, b], i) => {
    const m = qaGet(`eoa_${i}_${S.me}`), t = qaGet(`eoa_${i}_${S.other}`), done = m && t;
    if (done) { both++; if (m.pick === t.pick) match++; }
    const btn = (n, l) => `<button class="btn ${m && m.pick === n ? "primary" : ""}" style="flex:1" data-act="eoa" data-i="${i}" data-n="${n}">${esc(l)}</button>`;
    return `<section class="card"><div class="row" style="flex-wrap:nowrap">${btn(0, a)}<span class="muted">o</span>${btn(1, b)}</div>
      ${m && !t ? `<p class="muted" style="margin-top:8px">Esperando a ${esc(NAMES[S.other])}…</p>` : ""}
      ${done ? `<p style="margin-top:8px" class="${m.pick === t.pick ? "" : "muted"}">${m.pick === t.pick ? "🎯 ¡Coincidieron!" : `${esc(NAMES[S.other])} eligió: ${esc([a, b][t.pick])}`}</p>` : ""}</section>`;
  }).join("");
  return `<section class="card"><h2>Esto o aquello</h2><p class="muted">${both ? `Coinciden en ${match} de ${both} 🎯` : "Elige rápido, sin pensar mucho."}</p></section>${cards}`;
}
function quiz() {
  let ok = 0, tot = 0;
  const cards = QUIZ.map(([q, opts], i) => {
    const m = qaGet(`quiz_${i}_${S.me}`), t = qaGet(`quiz_${i}_${S.other}`);
    let body = "";
    if (m && t) { tot++; const hit = m.guess === t.own; if (hit) ok++; body = `<div class="clue"><b>${esc(NAMES[S.other])}:</b> ${esc(opts[t.own])}</div><p style="margin-top:6px">${hit ? "✅ ¡Acertaste!" : `❌ Pensaste: ${esc(opts[m.guess])}`}</p>`; }
    else if (m) body = `<p class="muted">Esperando a ${esc(NAMES[S.other])}…</p>`;
    else if (t) body = `<p class="muted">${esc(NAMES[S.other])} ya respondió. ¡Tu turno! 👀</p>`;
    return `<section class="card"><h3>${i + 1}. ${esc(q)}</h3>${body}<div class="actions"><button class="btn small ${m ? "" : "gold"}" data-act="quiz" data-i="${i}">${m ? "Cambiar" : "Responder"}</button></div></section>`;
  }).join("");
  return `<section class="card"><h2>¿Quién conoce más a quién?</h2><p class="muted">${tot ? `Acertaste ${ok} de ${tot} 🎯` : `Responde sobre ti y adivina qué respondería ${esc(NAMES[S.other])}.`}</p></section>${cards}`;
}
function capsula() {
  const mine = D.lettersA.filter((l) => l.capsule).sort((a, b) => a.unlockAt.toMillis() - b.unlockAt.toMillis());
  return `<section class="card"><div class="row between"><h2>Cápsula del tiempo ⏳</h2><button class="btn primary small" data-act="capsule-add">+ Escribir</button></div>
    <p class="muted">Escribe un mensaje para ti. Se muestra solo en la fecha que elijas.</p></section>` +
    (mine.length ? mine.map((l) => {
      const open = l.unlockAt.toMillis() <= Date.now(), d = l.unlockAt.toDate().toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" });
      return `<section class="card"><span class="tag ${open ? "ok" : "red"}">${open ? "Abierta · " + d : "🔒 Se abre el " + d}</span>
        ${open ? `<div class="envelope" style="margin-top:8px">${esc(l.text)}</div>` : `<p class="muted" style="margin-top:8px">Sellada. 🤫</p>`}
        <div class="actions"><button class="btn small danger" data-act="letter-del" data-id="${l.id}">Borrar</button></div></section>`;
    }).join("") : `<p class="empty">Aún no has sellado ninguna cápsula.</p>`);
}
function cupones() {
  const toMe = D.clues.filter((c) => c.type === "coupon" && c.to === S.me), byMe = D.clues.filter((c) => c.type === "coupon" && c.from === S.me);
  return `<section class="card"><h2>Para ti 🎟️</h2>
      ${toMe.length ? toMe.map((c) => `<div class="item"><div class="row between"><span class="title">${esc(c.title)}</span>${c.redeemed ? `<span class="tag ok">Canjeado</span>` : `<button class="btn small gold" data-act="coupon-redeem" data-id="${c.id}">Canjear</button>`}</div></div>`).join("") : `<p class="empty">${esc(NAMES[S.other])} aún no te regala cupones.</p>`}</section>
    <section class="card"><div class="row between"><h2>Los que regalas</h2><button class="btn primary small" data-act="coupon-add">+ Crear</button></div>
      ${byMe.length ? byMe.map((c) => `<div class="item"><div class="row between"><span class="title">${esc(c.title)}</span><span class="row">${c.redeemed ? `<span class="tag ok">Canjeado</span>` : ""}<button class="btn small danger" data-act="clue-del" data-id="${c.id}">Borrar</button></span></div></div>`).join("") : `<p class="empty">Crea un cupón: “vale por un abrazo largo”, “una cena que tú elijas”…</p>`}</section>`;
}
function bingo() {
  const done = new Set(D.proposals.bingo?.done || []);
  const lines = [];
  for (let i = 0; i < 4; i++) { lines.push([0, 1, 2, 3].map((k) => i * 4 + k), [0, 1, 2, 3].map((k) => k * 4 + i)); }
  lines.push([0, 5, 10, 15], [3, 6, 9, 12]);
  const won = lines.some((l) => l.every((x) => done.has(x)));
  return `<section class="card"><h2>Bingo navideño 🎄</h2><p class="muted">${won ? "🎉 ¡BINGO! Completaron una línea." : "Marquen juntos lo que vayan haciendo. Una línea completa es bingo."} · ${done.size}/16</p></section>
    <div class="bingo">${BINGO.map((t, i) => `<button class="${done.has(i) ? "on" : ""}" data-act="bingo" data-i="${i}" aria-pressed="${done.has(i)}">${esc(t)}</button>`).join("")}</div>`;
}

/* ───────── acciones ───────── */
const A = {
  login: async () => {
    try { S.error = ""; await signInWithPopup(auth, new GoogleAuthProvider()); }
    catch (e) { if (e.code !== "auth/popup-closed-by-user" && e.code !== "auth/cancelled-popup-request") { S.error = "No se pudo iniciar sesión: " + e.code; renderRoot(); } }
  },
  logout: () => signOut(auth),
  tab: (el) => {
    S.tab = el.dataset.v;
    if (el.dataset.sub) { const [k, v] = el.dataset.sub.split(":"); S.sub[k] = v; }
    window.scrollTo({ top: 0 }); render();
  },
  sub: (el) => { S.sub[el.dataset.key] = el.dataset.v; render(); },
  pfilter: (el) => { S.placeFilter = el.dataset.v; render(); },

  "set-date": async () => {
    const r = await ask("Fecha del intercambio", [{ name: "d", label: "¿Cuándo?", type: "date", required: true }], { d: D.config.exchangeDate || "" }, "Guardar", "Cualquiera de los dos puede cambiarla.");
    if (r) { await setDoc(doc(db, "config", "main"), { exchangeDate: r.d }, { merge: true }); toast("Fecha guardada 📅"); }
  },

  "wish-add": (el) => wishForm(null, el.dataset.kind),
  "wish-edit": (el) => wishForm(D.wishes.find((w) => w.id === el.dataset.id)),
  "wish-del": async (el) => { if (await ask("¿Borrar este deseo?", [], {}, "Sí, borrar")) await deleteDoc(doc(db, "wishes", el.dataset.id)); },
  buy: async (el) => {
    const w = D.wishes.find((x) => x.id === el.dataset.id), has = D.purchases.find((p) => p.id === w.id);
    if (has) { await deleteDoc(doc(db, "purchases", w.id)); return toast("Listo, quitado"); }
    await setDoc(doc(db, "purchases", w.id), { buyer: S.me, wishId: w.id, price: 0, createdAt: serverTimestamp() });
    toast("¡Anotado en secreto! 🤫");
  },

  "place-add": () => placeForm(null),
  "place-edit": (el) => placeForm(D.places.find((p) => p.id === el.dataset.id)),
  "place-del": async (el) => { if (await ask("¿Borrar este lugar?", [], {}, "Sí, borrar")) await deleteDoc(doc(db, "places", el.dataset.id)); },
  rate: (el) => { const p = D.places.find((x) => x.id === el.dataset.id); if (!p) return; const n = Number(el.dataset.n); const cur = (p.ratings || {})[S.me]; updateDoc(doc(db, "places", p.id), { [`ratings.${S.me}`]: cur === n ? 0 : n }); },
  surprise: () => {
    const cand = D.places.filter((p) => p.status === "porir");
    if (!cand.length) return toast("No hay planes “por ir” para sortear");
    const top = Math.max(...cand.map(avgRating));
    const pool = cand.filter((p) => avgRating(p) >= Math.min(top, 4));
    const pick = pool[Math.floor(Math.random() * pool.length)];
    info("🎲 ¡Les toca…!", `<div class="envelope"><h3>${esc(pick.name)}</h3>${pick.note ? `<p>${esc(pick.note)}</p>` : ""}${avgRating(pick) ? `<p class="eyebrow">★ ${avgRating(pick).toFixed(1)}</p>` : ""}</div>`);
  },

  "letter-add": async () => {
    const r = await ask(`Carta para ${NAMES[S.other]}`, [
      { name: "text", label: "Tu mensaje", type: "textarea", required: true },
      { name: "date", label: "Se abre el…", type: "date", required: true, value: `${new Date().getFullYear()}-12-24` },
    ], {}, "Sellar carta", `${NAMES[S.other]} no podrá leerla hasta esa fecha.`);
    if (r) { await addDoc(collection(db, "letters"), { from: S.me, to: S.other, text: r.text, unlockAt: Timestamp.fromDate(parseDay(r.date)), createdAt: serverTimestamp() }); toast("Carta sellada 💌"); }
  },
  "letter-del": async (el) => { if (await ask("¿Borrar esta carta?", [], {}, "Sí, borrar")) await deleteDoc(doc(db, "letters", el.dataset.id)); },

  "clue-add": async () => {
    const r = await ask("Pistas del regalo", [
      { name: "a", label: "Pista 1", required: true }, { name: "b", label: "Pista 2", required: true }, { name: "c", label: "Pista 3", required: true },
    ], {}, "Crear", `Sin decir qué es, claro. ${NAMES[S.other]} intentará adivinar.`);
    if (r) { await addDoc(collection(db, "clues"), { from: S.me, to: S.other, clues: [r.a, r.b, r.c], guess: "", reveal: "", createdAt: serverTimestamp() }); toast("Pistas creadas 🕵️"); }
  },
  guess: async (el) => {
    const c = D.clues.find((x) => x.id === el.dataset.id);
    const r = await ask("¿Qué crees que es?", [{ name: "g", label: "Tu respuesta", required: true }], { g: c.guess }, "Enviar");
    if (r) updateDoc(doc(db, "clues", c.id), { guess: r.g });
  },
  reveal: async (el) => {
    const c = D.clues.find((x) => x.id === el.dataset.id);
    const r = await ask("Revelar el regalo", [{ name: "t", label: "Mensaje de revelación", type: "textarea", required: true }], { t: c.reveal }, "Revelar", "Se mostrará en su pantalla.");
    if (r) updateDoc(doc(db, "clues", c.id), { reveal: r.t });
  },
  "clue-del": async (el) => { if (await ask("¿Borrar estas pistas?", [], {}, "Sí, borrar")) await deleteDoc(doc(db, "clues", el.dataset.id)); },

  "song-add": async () => {
    const r = await ask("Nueva canción", [{ name: "t", label: "Título / artista", required: true }, { name: "l", label: "Link (YouTube, Spotify…)", type: "url" }], {}, "Agregar");
    if (r) addDoc(collection(db, "playlist"), { title: r.t, link: r.l || "", addedBy: S.me, createdAt: serverTimestamp() });
  },
  "song-del": (el) => deleteDoc(doc(db, "playlist", el.dataset.id)),
  qa: async (el) => {
    const i = Number(el.dataset.i), cur = D.qa.find((a) => a.id === `${i}_${S.me}`);
    const r = await ask("Tu respuesta", [{ name: "t", label: QUESTIONS[i], type: "textarea", required: true }], { t: cur?.text || "" }, "Guardar");
    if (r) setDoc(doc(db, "qa", `${i}_${S.me}`), { who: S.me, q: i, text: r.t, updatedAt: serverTimestamp() });
  },
  "adv-add": async () => {
    const r = await ask("Proponer un plan", [{ name: "t", label: "¿Qué plan se te ocurre?", required: true }], {}, "Proponer", "Tu voto queda como “me animo”.");
    if (r) { await setDoc(doc(db, "proposals", "adv_c_" + Date.now()), { kind: "adv", title: r.t, addedBy: S.me, votes: { [S.me]: "yes" } }); toast("Plan propuesto ✨"); }
  },
  "adv-yes": async (el) => {
    const id = el.dataset.id, a = advAll().find((x) => x.id === id);
    const cur = D.proposals[id]?.suggest?.[S.me] || {};
    const treat = S.me === "mafer" ? "Señorita" : "Señor";
    const msg = CONSENT[Math.floor(Math.random() * CONSENT.length)](treat, NAMES[S.me]);
    const r = await ask(`📜 Consentimiento oficial: ${a.title}`, [
      { name: "month", label: "¿En qué mes te gustaría? (opcional)", type: "select", options: [["", "Sin preferencia"], ...MONTHS.map((m) => [m, m])] },
      { name: "date", label: "O sugiere una fecha exacta (opcional)", type: "date" },
    ], { month: cur.month || "", date: cur.date || "" }, "Acepto 🤝", msg);
    if (!r) return;
    await setDoc(doc(db, "proposals", id), { votes: { [S.me]: "yes" }, suggest: { [S.me]: { month: r.month || "", date: r.date || "" } } }, { merge: true });
    toast("¡Firmado! 🖊️ No hay vuelta atrás 😈");
  },
  "adv-date": async (el) => {
    const cur = D.proposals[el.dataset.id]?.date || "";
    const r = await ask("¿Cuándo lo hacemos?", [{ name: "d", label: "Fecha", type: "date", required: true }], { d: cur });
    if (r) await setDoc(doc(db, "proposals", el.dataset.id), { date: r.d }, { merge: true });
  },
  "adv-done": (el) => setDoc(doc(db, "proposals", el.dataset.id), { done: !D.proposals[el.dataset.id]?.done }, { merge: true }),
  "adv-roulette": () => {
    const pool = advAll().filter((a) => advState(a) === "match" && !D.proposals[a.id]?.done);
    if (!pool.length) return toast("Ya hicieron todos los matches 🎉");
    const pick = pool[Math.floor(Math.random() * pool.length)];
    info("🎲 ¡Les toca…!", `<div class="envelope"><h3>${pick.icon} ${esc(pick.title)}</h3></div>`);
  },
  eoa: (el) => setDoc(doc(db, "qa", `eoa_${el.dataset.i}_${S.me}`), { who: S.me, pick: Number(el.dataset.n), updatedAt: serverTimestamp() }),
  quiz: async (el) => {
    const i = Number(el.dataset.i), [q, opts] = QUIZ[i], cur = qaGet(`quiz_${i}_${S.me}`);
    const options = opts.map((o, k) => [k, o]);
    const r = await ask(q, [
      { name: "own", label: "Para ti, es…", type: "select", options },
      { name: "guess", label: `Crees que para ${NAMES[S.other]} es…`, type: "select", options },
    ], { own: cur?.own ?? 0, guess: cur?.guess ?? 0 }, "Guardar");
    if (r) setDoc(doc(db, "qa", `quiz_${i}_${S.me}`), { who: S.me, own: Number(r.own), guess: Number(r.guess), updatedAt: serverTimestamp() });
  },
  "capsule-add": async () => {
    const r = await ask("Cápsula del tiempo", [
      { name: "text", label: "Mensaje para ti", type: "textarea", required: true },
      { name: "date", label: "Se abre el…", type: "date", required: true, value: `${new Date().getFullYear() + 1}-12-24` },
    ], {}, "Sellar", "Nadie la ve hasta esa fecha.");
    if (r) { await addDoc(collection(db, "letters"), { from: S.me, to: S.me, capsule: true, text: r.text, unlockAt: Timestamp.fromDate(parseDay(r.date)), createdAt: serverTimestamp() }); toast("Cápsula sellada ⏳"); }
  },
  "coupon-add": async () => {
    const r = await ask(`Cupón para ${NAMES[S.other]}`, [{ name: "t", label: "Vale por…", required: true, ph: "un abrazo largo, una cena que elijas…" }], {}, "Crear");
    if (r) { await addDoc(collection(db, "clues"), { type: "coupon", from: S.me, to: S.other, title: r.t, redeemed: false, createdAt: serverTimestamp() }); toast("Cupón creado 🎟️"); }
  },
  "coupon-redeem": async (el) => { if (await ask("¿Canjear este cupón?", [], {}, "¡Canjear!")) updateDoc(doc(db, "clues", el.dataset.id), { redeemed: true }); },
  bingo: (el) => {
    const set = new Set(D.proposals.bingo?.done || []), i = Number(el.dataset.i);
    set.has(i) ? set.delete(i) : set.add(i);
    return setDoc(doc(db, "proposals", "bingo"), { done: [...set] }, { merge: true });
  },
  vote: (el) => { setDoc(doc(db, "proposals", el.dataset.id), { votes: { [S.me]: el.dataset.v } }, { merge: true }); toast("Voto guardado ✓"); },
};

async function wishForm(w, kind) {
  kind = w ? w.kind : kind;
  const fields = kind === "avoid"
    ? [{ name: "title", label: "¿Qué no quieres?", required: true }, { name: "note", label: "Nota (opcional)" }]
    : [{ name: "title", label: "¿Qué te gustaría?", required: true }, { name: "url", label: "Link (opcional)", type: "url", ph: "https://…" },
      { name: "priority", label: "Prioridad", type: "select", options: [[3, PRIORITY[3]], [2, PRIORITY[2]], [1, PRIORITY[1]]] },
      { name: "note", label: "Nota (talla, color…)", type: "textarea" }];
  const r = await ask(w ? "Editar deseo" : kind === "avoid" ? "No me regales…" : "Nuevo deseo", fields, w || { priority: 2 });
  if (!r) return;
  const data = { title: r.title, note: r.note || "", url: safeUrl(r.url || ""), priority: Number(r.priority) || 2 };
  if (w) await updateDoc(doc(db, "wishes", w.id), data);
  else await addDoc(collection(db, "wishes"), { ...data, kind, owner: S.me, createdAt: serverTimestamp() });
  toast("Guardado 🎁");
}
async function placeForm(p) {
  const r = await ask(p ? "Editar lugar" : "Nuevo lugar", [
    { name: "name", label: "Nombre", required: true },
    { name: "type", label: "Tipo", type: "select", options: [["restaurante", "Restaurante"], ["plan", "Plan"]] },
    { name: "link", label: "Link (Maps, web…)", type: "url" },
    { name: "note", label: "Nota", type: "textarea" },
  ], p || {});
  if (!r) return;
  const data = { name: r.name, type: r.type, link: safeUrl(r.link || ""), note: r.note || "" };
  if (p) await updateDoc(doc(db, "places", p.id), data);
  else await addDoc(collection(db, "places"), { ...data, status: "porir", ratings: {}, addedBy: S.me, createdAt: serverTimestamp() });
  toast("Guardado 🍽️");
}

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-act]");
  if (!el) return;
  const fn = A[el.dataset.act];
  if (fn) Promise.resolve(fn(el)).catch((err) => { console.error(err); toast("Ups, no se pudo: " + (err.code || err.message)); });
});
document.addEventListener("change", (e) => {
  const el = e.target.closest("[data-change]");
  if (el && el.dataset.change === "pstatus") updateDoc(doc(db, "places", el.dataset.id), { status: el.value }).catch((err) => toast("Ups: " + err.code));
});

/* ───────── inicio ───────── */
if (configured) startApp(); else renderRoot();
