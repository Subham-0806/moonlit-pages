import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, setDoc, deleteDoc, updateDoc, doc, query, orderBy, where, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// PASTE YOUR firebaseConfig HERE (from Firebase Project settings)
const firebaseConfig = {
  apiKey: "AIzaSyBuwKaueiiWr3y2-Iox8ygCXKmzEAWCLL4",
  authDomain: "moonlit-pages-cd638.firebaseapp.com",
  projectId: "moonlit-pages-cd638",
  storageBucket: "moonlit-pages-cd638.appspot.com",
  messagingSenderId: "1054480812345",
  appId: "1:1054480812345:web:1234567890abcdef"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const $ = s => document.querySelector(s);
const esc = t => String(t ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const genres = ["Horror", "Fantasy", "Mystery", "Adventure"];
let genre = "Horror", isAdmin = false, stories = [], shayari = [], current = null;


const acc = { horror: "#e5253a", fantasy: "#b57bff", mystery: "#3fbf8f", adventure: "#f5a623", shayari: "#e8d28f" };
const tag = { horror: "Don't read alone.", fantasy: "Step through the portal.", mystery: "Every clue lies.", adventure: "The map is only the start." };
const Q = {
  home: ["Somewhere between the first line and the last, you become someone else for a while.", "Every door in this place opens into a different night.", "Read slowly. The dark has all the time in the world.", "Words are small, until they are the only light in the room."],
  horror: ["The scariest sound is the one you hear after the story ends.", "It was never the dark. It was what the dark remembered."],
  fantasy: ["Magic is just the world, noticed properly.", "Every map has an edge. Every edge has a door."],
  mystery: ["The truth was in the room. So was the liar.", "A clue is just a lie that forgot to hide."],
  adventure: ["The road does not ask if you are ready.", "Somewhere past the last page, the real journey begins."],
  shayari: ["चाँद ने पूछा, इतनी रात गए क्यों जागे हो?\nमैंने कहा, कुछ अल्फ़ाज़ अब तक अधूरे हैं।", "कुछ बातें लफ़्ज़ों में नहीं आतीं,\nइसीलिए तो शायरी बनती है।"]
};
const chip = { horror: "Warning: not recommended after midnight", fantasy: "The realm is open", mystery: "Case file No. 0001", adventure: "Expedition log" };
const EMPTY = {
  horror: "The shelves are silent. Something is still being written in the dark.",
  fantasy: "The scrolls are still being enchanted.",
  mystery: "No cases on the desk. The detective is out, chasing a lie.",
  adventure: "The map is blank. The first expedition has not left yet."
};
const GL = { horror: "\u2020", fantasy: "\u2727", mystery: "\u25C8", adventure: "\u2736", shayari: "\u263E" };
const roman = n => { let r = ""; for (const [v, s] of [[1000,"M"],[900,"CM"],[500,"D"],[400,"CD"],[100,"C"],[90,"XC"],[50,"L"],[40,"XL"],[10,"X"],[9,"IX"],[5,"V"],[4,"IV"],[1,"I"]]) while (n >= v) { r += s; n -= v; } return r; };
function setBg(w) { const a = w && document.querySelector(`#arts [data-art=${w}] svg`); $("#world-bg").innerHTML = a ? a.outerHTML : ""; }
const RS = { horror: "\u2620", fantasy: "\u2605", mystery: "\u25CE", adventure: "\u2736", shayari: "\u2665" };
function buildRate(th) {
  const r = $("#r-rating"); r.dataset.v = 5;
  const paint = v => r.querySelectorAll("button").forEach(b => b.classList.toggle("on", +b.dataset.v <= v));
  r.innerHTML = [1, 2, 3, 4, 5].map(i => `<button type="button" data-v="${i}" title="${i} of 5">${RS[th]}</button>`).join("");
  paint(5);
  r.onclick = e => { const b = e.target.closest("button"); if (b) { r.dataset.v = b.dataset.v; paint(+b.dataset.v); } };
}
const pick = a => a[Math.floor(Math.random() * a.length)];
const AMB = {
  home: [["ff", 16], ["pgfall", 6]],
  horror: [["eyes", 6], ["spider", 3]], fantasy: [["wisp", 7], ["rune", 7]],
  mystery: [["qmark", 7], ["fp", 10]], adventure: [["route", 1], ["seed", 10], ["bird", 2]], shayari: [["word", 6], ["ripple", 4]]
};
const INIT = {
  rune: e => e.textContent = pick(["\u2726", "\u2727", "\u263E", "\u2736", "\u2756", "\u273A", "\u2606"]),
  word: e => e.textContent = pick(["\u0907\u0936\u094D\u0915\u093C", "\u091A\u093E\u0901\u0926", "\u0916\u093C\u094D\u0935\u093E\u092C", "\u0930\u093E\u0924", "\u0926\u093F\u0932", "love", "moon", "midnight"]),
  qmark: e => e.textContent = "?",
  fp: (e, i, n) => { e.style.setProperty("--x", (4 + i * (90 / n)) + "%"); e.style.setProperty("--y", (i % 2 ? 6 : 11) + "%"); e.style.setProperty("--d", (i * .9) + "s"); },
  route: e => { e.innerHTML = '<svg viewBox="0 0 400 120"><path d="M6 100C70 20 130 120 200 60S330 20 394 80"/><text x="378" y="100">\u2715</text></svg>'; }
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

function setTheme(t) {
  document.body.dataset.theme = t;
  const amb = $("#amb"); amb.innerHTML = "";
  for (const [k, n] of AMB[t] || []) for (let i = 0; i < n; i++) {
    const e = document.createElement("b"); e.className = k;
    e.style.cssText = `--x:${Math.random() * 100}%;--y:${10 + Math.random() * 70}%;--s:${0.6 + Math.random() * 1.2};--t:${14 + Math.random() * 16}s;--d:-${Math.random() * 20}s`;
    if (INIT[k]) INIT[k](e, i, n);
    amb.appendChild(e);
  }
  const fx = $("#fx"); fx.innerHTML = "";
  for (let i = 0; i < (t === "mystery" ? 0 : t === "home" ? 14 : 22); i++) {
    const e = document.createElement("i");
    e.style.cssText = `--x:${Math.random() * 100}%;--y:${Math.random() * 100}%;--s:${2 + Math.random() * 5}px;--t:${4 + Math.random() * 8}s;--d:-${Math.random() * 10}s`;
    fx.appendChild(e);
  }
}

function go(view, theme) {
  document.querySelectorAll(".view").forEach(v => v.classList.toggle("on", v.id === view));
  if (view === "library") { setTheme(genre.toLowerCase()); renderLibrary(); }
  else setTheme(theme || { diary: "shayari" }[view] || "home");
  document.body.classList.toggle("reading", view === "reader");
  setBg(view === "library" ? genre.toLowerCase() : view === "diary" ? "shayari" : view === "reader" ? theme : "");
  $("#home").hidden = view === "gate"; $("#corner").hidden = view !== "gate"; document.body.classList.toggle("home", view === "gate");
  if (view !== "reader" && "speechSynthesis" in window) speechSynthesis.cancel();
  scrollTo(0, 0);
}

async function enter(view, theme, e) {
  const c = $("#curtain");
  if (view === "library") genre = genres.find(g => g.toLowerCase() === theme) || genre;
  if (document.body.classList.contains("calm")) { go(view, theme); markDeck(theme); return; }
  c.style.setProperty("--cx", (e?.clientX ?? innerWidth / 2) + "px");
  c.style.setProperty("--cy", (e?.clientY ?? innerHeight / 2) + "px");
  STING[theme]?.(); c.dataset.w = theme; c.innerHTML = CURT[theme] || ""; c.className = "go";
  const [swap, total] = SW[theme] || [820, 1000];
  await sleep(swap); go(view, theme); markDeck(theme);
  await sleep(total - swap);
  c.className = "out"; await sleep(650); c.className = ""; c.innerHTML = "";
}

document.addEventListener("click", async e => {
  const b = e.target.closest("[data-go]");
  if (b) return go(b.dataset.go);
  const w = e.target.closest("[data-world]");
  if (!w) return;
  const isDoor = w.classList.contains("tarot");
  if (isDoor) { w.classList.add("flip"); await sleep(document.body.classList.contains("calm") ? 0 : 880); }
  await enter(w.dataset.world === "shayari" ? "diary" : "library", w.dataset.world, e);
  if (isDoor) w.classList.remove("flip");
});

async function loadAll() {
  try {
    const get = async col => {
      const src = isAdmin ? collection(db, col) : query(collection(db, col), where("draft", "==", false));
      const snap = await getDocs(src);
      return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((x, y) => (y.createdAt?.seconds || 0) - (x.createdAt?.seconds || 0));
    };
    stories = await get("stories"); shayari = await get("shayari");
  } catch (err) { console.error(err); }
  loadedOnce = true; renderLibrary(); renderDiary();
}

function renderLibrary() {
  renderLibrary0(); if (!loadedOnce) $("#story-list").innerHTML = SKEL;
  const f = stories.find(s => s.genre === genre); $("#peek").innerHTML = f ? peekHTML(f) : "";
}
function renderLibrary0() {
  $("#genre-title").textContent = genre;
  $("#genre-tag").textContent = tag[genre.toLowerCase()] || "";
  $("#genre-quote").textContent = pick(Q[genre.toLowerCase()]);
  const g = genre.toLowerCase();
  $("#chip").textContent = chip[g];
  $("#bart").innerHTML = WIDE[g];
  $("#tabs").innerHTML = genres.map(g => `<button class="${g === genre ? "on" : ""}" data-genre="${g}">${g}</button>`).join("");
  const list = stories.filter(s => s.genre === genre);
  $("#story-list").innerHTML = list.length ? list.map((s, i) => `
    <article class="row" data-id="${s.id}" style="--i:${i}">
      <span class="rno">${String(i + 1).padStart(2, "0")}</span>
      <h3>${esc(s.title)}</h3>
      <small>${Math.max(1, Math.round((s.body || "").split(/\s+/).length / 200))} min read</small>
      ${isAdmin ? `${s.draft ? '<span class="draft">DRAFT</span>' : ""}<span class="adm"><button data-edit="stories:${s.id}">Edit</button><button data-del="stories:${s.id}">Delete</button></span>` : ""}
    </article>`).join("") : `<div class="slot"><div><div class="gl">${GL[genre.toLowerCase()]}</div>${EMPTY[genre.toLowerCase()]}</div></div>`;
}

function renderDiary() {
  $("#diary-quote").textContent = pick(Q.shayari);
  $("#shayari-list").innerHTML = shayari.length ? shayari.map((s, i) => `
    <div class="page" style="--i:${i}">${esc(s.body)}<small>${esc(s.mood || "")}</small><button class="sharebtn" data-share="${s.id}">Share as image</button>
    ${isAdmin ? `${s.draft ? '<span class="draft">DRAFT</span>' : ""}<span class="adm"><button data-edit="shayari:${s.id}">Edit</button><button data-del="shayari:${s.id}">Delete</button></span>` : ""}</div>`).join("") : `<p class="empty">The diary is empty for now.</p>`;
}

$("#tabs").addEventListener("click", e => {
  const g = e.target.dataset.genre;
  if (g && g !== genre) enter("library", g.toLowerCase(), e);
});

$("#story-list").addEventListener("click", async e => {
  const del = e.target.dataset.del, ed = e.target.dataset.edit;
  if (ed) return startEdit(...ed.split(":"));
  if (del) return remove(del);
  const card = e.target.closest(".row");
  if (card) openStory(card.dataset.id, e);
});
$("#shayari-list").addEventListener("click", e => {
  if (e.target.dataset.share) return openShare(e.target.dataset.share);
  if (e.target.dataset.edit) return startEdit(...e.target.dataset.edit.split(":"));
  if (e.target.dataset.del) remove(e.target.dataset.del);
});

async function remove(key) {
  if (!confirm("Delete this permanently?")) return;
  const [col, id] = key.split(":");
  await deleteDoc(doc(db, col, id));
  loadAll();
}

function dress(body, theme) {
  let t = esc(body), i = 0;
  if (theme === "thriller") t = t.replace(/\b[A-Za-z]{5,}\b/g, w => (++i % 9 === 0 ? `<span class="red">${w}</span>` : w));
  return t;
}

async function openStory(id, e) {
  current = stories.find(s => s.id === id);
  const th = current.genre.toLowerCase();
  const sib = stories.filter(s => s.genre === current.genre), nx = sib.length > 1 ? sib[(sib.findIndex(s => s.id === current.id) + 1) % sib.length] : null;
  const inner = `<button id="listen" class="listen ghost">Listen</button>${nx ? `<button class="nxt" data-next="${nx.id}">Next ${esc(current.genre)} story: ${esc(nx.title)} &rarr;</button>` : ""}`;
  $("#story").innerHTML = bookHTML(current, th, inner); $("#reader").classList.add("closed");
  buildRate(th);
  loadReviews();
  if (e) await enter("reader", th, e); else go("reader", th);
}

async function loadReviews() {
  const snap = await getDocs(query(collection(db, "reviews"), where("postId", "==", current.id)));
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  const avg = items.length ? items.reduce((s, r) => s + r.rating, 0) / items.length : 0;
  $("#avg").textContent = items.length ? `Rated ${avg.toFixed(1)} / 5 by ${items.length} reader${items.length > 1 ? "s" : ""}` : "";
  $("#reviews").innerHTML = items.length ? items.map(r => `
    <div class="review"><strong>${esc(r.name)}</strong> ${RS[current.genre.toLowerCase()].repeat(r.rating)}<p>${esc(r.comment)}</p>
    ${isAdmin ? `<button data-rdel="${r.id}">Delete</button>` : ""}</div>`).join("") : `<p class="empty">No reviews yet. Be the first.</p>`;
}
$("#reviews").addEventListener("click", async e => {
  if (e.target.dataset.rdel) { await deleteDoc(doc(db, "reviews", e.target.dataset.rdel)); loadReviews(); }
});

$("#r-send").addEventListener("click", async () => {
  const name = $("#r-name").value.trim(), comment = $("#r-text").value.trim();
  if (!name || !comment) return alert("Add your name and a comment.");
  await addDoc(collection(db, "reviews"), { postId: current.id, name, comment, rating: Number($("#r-rating").dataset.v), createdAt: serverTimestamp() });
  $("#r-text").value = "";
  loadReviews();
});

// admin
$("#login").addEventListener("submit", async e => {
  e.preventDefault();
  try { await signInWithEmailAndPassword(auth, $("#a-email").value, $("#a-pass").value); $("#a-err").textContent = ""; }
  catch { $("#a-err").textContent = "Wrong email or password."; }
});
$("#logout").addEventListener("click", () => signOut(auth));
onAuthStateChanged(auth, u => {
  isAdmin = !!u;
  $("#login").hidden = isAdmin;
  $("#editor").hidden = !isAdmin; $("#about-editor").hidden = !isAdmin; $("#secret-editor").hidden = !isAdmin;
  loadAll();
});
$("#kind").addEventListener("change", () => {
  const story = $("#kind").value === "stories";
  $("#e-title").hidden = $("#e-genre").hidden = $("#e-cover").hidden = !story; $("#cover-tools").hidden = !story;
  $("#e-mood").hidden = story;
});
let editing = null;
function resetEditor() {
  editing = null;
  ["#e-body", "#e-title", "#e-mood", "#e-cover"].forEach(s => $(s).value = "");
  $("#e-draft").checked = false; $("#kind").disabled = false; coverData = ""; $("#e-showtitle").checked = true; $("#e-coverfile").value = ""; showCoverPrev();
  $("#publish").textContent = "Publish"; $("#cancel-edit").hidden = true;
}
function startEdit(col, id) {
  const it = (col === "stories" ? stories : shayari).find(x => x.id === id);
  if (!it) return;
  go("admin"); resetEditor(); editing = { col, id };
  $("#kind").value = col; $("#kind").dispatchEvent(new Event("change")); $("#kind").disabled = true;
  $("#e-title").value = it.title || ""; coverData = (it.cover || "").startsWith("data:") ? it.cover : ""; $("#e-cover").value = coverData ? "" : (it.cover || ""); $("#e-showtitle").checked = it.showTitle !== false; showCoverPrev(); $("#e-genre").value = it.genre || "Horror"; $("#e-mood").value = it.mood || "";
  $("#e-body").value = it.body || ""; $("#e-draft").checked = !!it.draft;
  $("#publish").textContent = "Save changes"; $("#cancel-edit").hidden = false;
  $("#e-msg").textContent = "Editing. Change what you need, then save.";
}
$("#cancel-edit").addEventListener("click", () => { resetEditor(); $("#e-msg").textContent = ""; });
$("#publish").addEventListener("click", async () => {
  const kind = $("#kind").value, body = $("#e-body").value.trim(), draft = $("#e-draft").checked;
  if (!body) return;
  const data = kind === "stories"
    ? { title: $("#e-title").value.trim() || "Untitled", genre: $("#e-genre").value, cover: coverData || $("#e-cover").value.trim(), showTitle: $("#e-showtitle").checked, body, draft }
    : { mood: $("#e-mood").value.trim(), body, draft };
  try {
    if (editing) await updateDoc(doc(db, editing.col, editing.id), data);
    else await addDoc(collection(db, kind), { ...data, createdAt: serverTimestamp() });
    $("#e-msg").textContent = draft ? "Saved as draft. Readers can't see it." : (editing ? "Changes saved." : "Published.");
    resetEditor();
    loadAll();
  } catch { $("#e-msg").textContent = "Could not save. Check the Firestore rules and that you are logged in."; }
});



// opening scene: a moon rises, the name writes itself, then the lake appears
(async () => {
  const o = $("#intro"), t = $("#intro-text"); let skip = false;
  if (sessionStorage.getItem("seen")) { o.remove(); return; }
  sessionStorage.setItem("seen", "1"); o.onclick = () => skip = true;
  o.classList.add("go"); await sleep(1500);
  for (const ch of "Moonlit Pages") { if (skip) break; t.textContent += ch; await sleep(110); }
  if (!skip) await sleep(900);
  o.classList.add("done"); await sleep(1000); o.remove();
})();


// reading progress, heartbeat, surprise
addEventListener("scroll", () => {
  const h = document.documentElement, p = h.scrollTop / Math.max(1, h.scrollHeight - innerHeight);
  $("#prog").style.width = (document.body.classList.contains("reading") ? p * 100 : 0) + "%";
  h.style.setProperty("--hb", (1.7 - p * 1.1) + "s");
}, { passive: true });

// scroll-driven scenes on the landing page
const io = new IntersectionObserver(es => es.forEach(en => {
  if (!en.isIntersecting) return;
  en.target.classList.add("in");
  const s = en.target.dataset.scene;
  if (en.intersectionRatio > .5 && s && $("#gate").classList.contains("on") && document.body.dataset.theme !== s) setTheme(s);
}), { threshold: [.25, .55] });
document.querySelectorAll("[data-scene]").forEach(el => io.observe(el));

setTheme("home");


// wide animated banner scenes
const WIDE = {"horror": "<svg viewBox=\"0 0 1200 360\" preserveAspectRatio=\"xMidYMid slice\" aria-hidden=\"true\"><defs><linearGradient id=\"gh\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#0b0204\"/><stop offset=\"1\" stop-color=\"#5a0a14\"/></linearGradient></defs><rect width=\"1200\" height=\"360\" fill=\"url(#gh)\"/><circle cx=\"880\" cy=\"110\" r=\"70\" fill=\"#f3cfcf\" opacity=\".9\"/><circle cx=\"858\" cy=\"96\" r=\"10\" fill=\"#d9a8a8\" opacity=\".5\"/><path class=\"flyw\" d=\"M0 90q14-18 28 0q14-18 28 0q-14 8-28 4q-14 4-28-4z\" fill=\"#000\"/><path class=\"flyw\" style=\"animation-delay:-6s\" d=\"M0 150q14-18 28 0q14-18 28 0q-14 8-28 4q-14 4-28-4z\" fill=\"#000\"/><path class=\"flyw\" style=\"animation-delay:-10s\" d=\"M0 60q10-14 20 0q10-14 20 0q-10 6-20 3q-10 3-20-3z\" fill=\"#000\"/><path d=\"M0 360V292q150-40 300-10t300-20q200 30 300 0t300 20V360z\" fill=\"#050102\"/><path d=\"M780 300V210l60-70 60 70v90zM740 300V235l30-40 30 40v65z\" fill=\"#050102\"/><path d=\"M830 140l12-62 12 62z\" fill=\"#050102\"/><rect class=\"fl\" x=\"820\" y=\"232\" width=\"16\" height=\"22\" fill=\"#ffb14a\"/><rect class=\"fl d2\" x=\"856\" y=\"252\" width=\"16\" height=\"22\" fill=\"#e5253a\"/><path d=\"M170 330V210m0 40l-40-50m40 20l36-44m-36 24l-12-36M1080 330V230m0 30l30-36m-30 18l-26-30\" stroke=\"#050102\" stroke-width=\"9\" fill=\"none\" stroke-linecap=\"round\"/><g class=\"bl\" fill=\"#ff2a2a\"><ellipse cx=\"400\" cy=\"322\" rx=\"7\" ry=\"4\"/><ellipse cx=\"424\" cy=\"322\" rx=\"7\" ry=\"4\"/></g></svg>", "fantasy": "<svg viewBox=\"0 0 1200 360\" preserveAspectRatio=\"xMidYMid slice\" aria-hidden=\"true\"><defs><linearGradient id=\"gf\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#0b0620\"/><stop offset=\"1\" stop-color=\"#3a1b7a\"/></linearGradient></defs><rect width=\"1200\" height=\"360\" fill=\"url(#gf)\"/><circle cx=\"200\" cy=\"90\" r=\"46\" fill=\"#f0e6ff\" opacity=\".92\"/><g fill=\"#fff\"><circle class=\"tw\" style=\"animation-delay:-0s\" cx=\"60\" cy=\"40\" r=\"2\"/><circle class=\"tw\" style=\"animation-delay:-1s\" cx=\"340\" cy=\"70\" r=\"2\"/><circle class=\"tw\" style=\"animation-delay:-2s\" cx=\"480\" cy=\"30\" r=\"1.6\"/><circle class=\"tw\" style=\"animation-delay:-3s\" cx=\"700\" cy=\"60\" r=\"2\"/><circle class=\"tw\" style=\"animation-delay:-4s\" cx=\"1100\" cy=\"50\" r=\"2\"/><circle class=\"tw\" style=\"animation-delay:-0s\" cx=\"1000\" cy=\"120\" r=\"1.6\"/><circle class=\"tw\" style=\"animation-delay:-1s\" cx=\"620\" cy=\"140\" r=\"1.6\"/></g><path d=\"M0 360V280l120-80 100 70 140-110 160 120 160-90 140 100 120-70 160 90V360z\" fill=\"#120a2e\"/><ellipse class=\"pulse\" cx=\"520\" cy=\"236\" rx=\"54\" ry=\"80\" fill=\"#b57bff\" fill-opacity=\".3\" stroke=\"#d2b0ff\" stroke-width=\"5\"/><path d=\"M820 330V220h20v-30l10-18 10 18v30h30v-70l12-26 12 26v70h30v-40h14v-20l12-18 12 18v20h14v150z\" fill=\"#07031a\"/><rect class=\"fl\" x=\"896\" y=\"170\" width=\"8\" height=\"12\" fill=\"#ffd66b\"/><rect class=\"fl d2\" x=\"962\" y=\"190\" width=\"8\" height=\"12\" fill=\"#ffd66b\"/><g fill=\"#ffd66b\"><circle class=\"tw\" style=\"animation-delay:-0s\" cx=\"300\" cy=\"250\" r=\"4\"/><circle class=\"tw\" style=\"animation-delay:-1s\" cx=\"700\" cy=\"230\" r=\"4\"/><circle class=\"tw\" style=\"animation-delay:-2s\" cx=\"420\" cy=\"300\" r=\"3\"/><circle class=\"tw\" style=\"animation-delay:-3s\" cx=\"1100\" cy=\"300\" r=\"4\"/></g></svg>", "mystery": "<svg viewBox=\"0 0 1200 360\" preserveAspectRatio=\"xMidYMid slice\" aria-hidden=\"true\"><defs><linearGradient id=\"gm\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#030d09\"/><stop offset=\"1\" stop-color=\"#0d3a2a\"/></linearGradient></defs><rect width=\"1200\" height=\"360\" fill=\"url(#gm)\"/><circle cx=\"1000\" cy=\"80\" r=\"40\" fill=\"#dff5e8\" opacity=\".85\"/><path d=\"M0 360V200h90v-40h70v40h60v-70h80v70h50V360zM760 360V180h80v-60h60v60h70v-30h60v30h170V360z\" fill=\"#020806\"/><path d=\"M470 360V170h-28\" stroke=\"#020806\" stroke-width=\"8\" fill=\"none\"/><polygon points=\"442,186 392,360 492,360\" fill=\"#ffd98a\" opacity=\".16\"/><circle class=\"fl\" cx=\"442\" cy=\"178\" r=\"11\" fill=\"#ffd98a\"/><g fill=\"#ffd98a\"><rect class=\"fl\" x=\"120\" y=\"180\" width=\"10\" height=\"14\"/><rect class=\"fl d2\" x=\"250\" y=\"150\" width=\"10\" height=\"14\"/><rect class=\"fl\" x=\"800\" y=\"140\" width=\"10\" height=\"14\"/><rect class=\"fl d2\" x=\"940\" y=\"200\" width=\"10\" height=\"14\"/></g><ellipse class=\"drift2\" cx=\"300\" cy=\"334\" rx=\"280\" ry=\"40\" fill=\"#bfffe5\" opacity=\".1\"/><ellipse class=\"drift2\" style=\"animation-delay:-6s\" cx=\"800\" cy=\"340\" rx=\"300\" ry=\"44\" fill=\"#bfffe5\" opacity=\".1\"/></svg>", "adventure": "<svg viewBox=\"0 0 1200 360\" preserveAspectRatio=\"xMidYMid slice\" aria-hidden=\"true\"><defs><linearGradient id=\"ga\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#2a1204\"/><stop offset=\"1\" stop-color=\"#f5a623\"/></linearGradient></defs><rect width=\"1200\" height=\"360\" fill=\"url(#ga)\"/><circle cx=\"600\" cy=\"250\" r=\"115\" fill=\"#ffd27a\" opacity=\".92\"/><path d=\"M0 262l140-112 100 70 120-120 140 162H0zM820 262l120-92 90 62 170-102V262z\" fill=\"#3a1f06\"/><rect y=\"252\" width=\"1200\" height=\"110\" fill=\"#1a0f04\"/><path class=\"wave\" d=\"M-200 284q25-12 50 0t50 0t50 0t50 0t50 0t50 0t50 0t50 0t50 0t50 0t50 0t50 0t50 0t50 0t50 0t50 0t50 0t50 0t50 0t50 0t50 0t50 0t50 0t50 0t50 0t50 0t50 0t50 0t50 0t50 0t50 0\" stroke=\"#ffb347\" stroke-width=\"2\" fill=\"none\" opacity=\".55\"/><g class=\"bob\"><path d=\"M520 264h120l-22 30H542z\" fill=\"#050200\"/><path d=\"M582 264V186l52 58zM578 264V196l-40 44z\" fill=\"#050200\"/></g><g class=\"spin\"><circle cx=\"1090\" cy=\"70\" r=\"36\" fill=\"none\" stroke=\"#f5a623\" stroke-width=\"3\"/><polygon points=\"1090,38 1097,70 1090,102 1083,70\" fill=\"#f5a623\"/></g></svg>", "shayari": "<svg viewBox=\"0 0 1200 360\" preserveAspectRatio=\"xMidYMid slice\" aria-hidden=\"true\"><defs><linearGradient id=\"gs\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#05081f\"/><stop offset=\"1\" stop-color=\"#1b2466\"/></linearGradient></defs><rect width=\"1200\" height=\"360\" fill=\"url(#gs)\"/><path d=\"M300 40a110 110 0 1 0 90 200a88 88 0 1 1-90-200z\" fill=\"#f3e6b8\"/><g fill=\"#fff\"><circle class=\"tw\" style=\"animation-delay:-0s\" cx=\"80\" cy=\"60\" r=\"2\"/><circle class=\"tw\" style=\"animation-delay:-1s\" cx=\"180\" cy=\"170\" r=\"1.6\"/><circle class=\"tw\" style=\"animation-delay:-2s\" cx=\"520\" cy=\"50\" r=\"2\"/><circle class=\"tw\" style=\"animation-delay:-3s\" cx=\"640\" cy=\"120\" r=\"1.6\"/><circle class=\"tw\" style=\"animation-delay:-4s\" cx=\"760\" cy=\"40\" r=\"2\"/><circle class=\"tw\" style=\"animation-delay:-0s\" cx=\"900\" cy=\"90\" r=\"2\"/><circle class=\"tw\" style=\"animation-delay:-1s\" cx=\"1120\" cy=\"60\" r=\"2\"/><circle class=\"tw\" style=\"animation-delay:-2s\" cx=\"1060\" cy=\"170\" r=\"1.6\"/><circle class=\"tw\" style=\"animation-delay:-3s\" cx=\"460\" cy=\"170\" r=\"1.6\"/></g><rect y=\"274\" width=\"1200\" height=\"90\" fill=\"#070b28\"/><g stroke=\"#e8d28f\" stroke-width=\"3\" opacity=\".55\"><path class=\"tw\" d=\"M300 288h100M312 302h76M326 316h48\"/></g><path d=\"M860 310q60-120 190-174q-34 94-64 142z\" fill=\"#e8d28f\" opacity=\".92\"/><path d=\"M860 310l96-116\" stroke=\"#f3ead3\" stroke-width=\"3\"/><circle cx=\"852\" cy=\"322\" r=\"5\" fill=\"#e8d28f\"/></svg>"};
$("#bart-d").innerHTML = WIDE.shayari;

// bottom quote: words surface one by one out of the dark
(async () => {
  const el = $("#foot-quote"); let i = 0;
  for (;;) {
    const q = Q.home[i++ % Q.home.length], words = q.split(" ");
    el.classList.remove("out");
    el.innerHTML = words.map((w, k) => `<span style="animation-delay:${k * .15}s">${esc(w)}</span>`).join(" ");
    await sleep(words.length * 150 + 4300); el.classList.add("out"); await sleep(1000);
  }
})();

// shayari share image
const STY = { night: { bg: ["#05081f", "#1b2466"], ink: "#f3ead3", ac: "#e8d28f" }, rose: { bg: ["#2a0713", "#7a1633"], ink: "#ffe9ee", ac: "#ffb3c1" }, paper: { bg: ["#f4ecd8", "#e6d8b4"], ink: "#2a1d0a", ac: "#8a5a1a" } };
let shareStyle = "night", shareItem = null;
async function drawShare() {
  const s = shareItem, S = STY[shareStyle], x = $("#sc").getContext("2d");
  try { await document.fonts.load("60px Kalam", s.body); } catch {}
  const g = x.createLinearGradient(0, 0, 0, 1350); g.addColorStop(0, S.bg[0]); g.addColorStop(1, S.bg[1]);
  x.fillStyle = g; x.fillRect(0, 0, 1080, 1350);
  if (shareStyle === "night") {
    x.fillStyle = "#fff";
    for (let i = 0; i < 60; i++) { x.globalAlpha = .3 + ((i * 37) % 7) / 10; x.fillRect((i * 197) % 1080, (i * 113) % 700, 2 + (i % 3), 2 + (i % 3)); }
    x.globalAlpha = 1; x.fillStyle = "#f3e6b8"; x.beginPath(); x.arc(880, 200, 70, 0, 7); x.fill();
    x.fillStyle = S.bg[0]; x.beginPath(); x.arc(910, 180, 62, 0, 7); x.fill();
  }
  x.fillStyle = S.ink; x.textAlign = "center";
  let size = 76, lines = [];
  const wrap = () => {
    x.font = `${size}px Kalam, 'Noto Serif Devanagari', serif`; lines = [];
    for (const para of s.body.split("\n")) { let cur = ""; for (const w of para.split(" ")) { const t = cur ? cur + " " + w : w; if (x.measureText(t).width > 880 && cur) { lines.push(cur); cur = w; } else cur = t; } lines.push(cur); }
  };
  wrap(); while (lines.length * size * 1.5 > 760 && size > 34) { size -= 4; wrap(); }
  const top = 675 - lines.length * size * .75;
  lines.forEach((l, i) => x.fillText(l, 540, top + i * size * 1.5 + size));
  x.fillStyle = S.ac; x.font = "34px Georgia, serif"; if (s.mood) x.fillText(s.mood, 540, 1130);
  x.font = "30px Georgia, serif"; x.fillText("Moonlit Pages", 540, 1250);
}
function openShare(id) { shareItem = shayari.find(s => s.id === id); if (!shareItem) return; $("#sharebox").hidden = false; drawShare(); }
document.querySelectorAll("#sharebox [data-st]").forEach(b => b.addEventListener("click", () => { shareStyle = b.dataset.st; drawShare(); }));
$("#sx").addEventListener("click", () => $("#sharebox").hidden = true);
$("#sdl").addEventListener("click", () => $("#sc").toBlob(async b => {
  const f = new File([b], "shayari.png", { type: "image/png" });
  if (navigator.canShare && navigator.canShare({ files: [f] })) { try { await navigator.share({ files: [f] }); return; } catch {} }
  const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "shayari.png"; a.click();
}));

// sound (made in the browser, no files). Off until the reader turns it on.
let snd = localStorage.getItem("snd") === "1", ac;
const AC = window.AudioContext || window.webkitAudioContext;
function tone(f, d = .15, type = "sine", v = .05, to) {
  if (!snd || !AC) return;
  ac ||= new AC(); if (ac.state === "suspended") ac.resume();
  const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime;
  o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  o.connect(g).connect(ac.destination); o.start(); o.stop(t + d);
}
const STING = {
  horror: () => tone(70, .9, "sawtooth", .06, 38),
  fantasy: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, .5, "sine", .05), i * 90)),
  mystery: () => tone(196, .7, "triangle", .07),
  adventure: () => { tone(220, .35, "sawtooth", .04); setTimeout(() => tone(330, .5, "sawtooth", .04), 200); },
  shayari: () => [880, 1318].forEach((f, i) => setTimeout(() => tone(f, .9, "sine", .04), i * 160))
};


// your deck: worlds the reader has visited
const WORLDS = ["horror", "fantasy", "mystery", "adventure", "shayari"];
let deck = new Set();
try { deck = new Set(JSON.parse(localStorage.getItem("deck") || "[]")); } catch {}
function renderDeck() {
  document.querySelectorAll(".dep,.obj,.wrd").forEach(c => c.classList.toggle("seen", deck.has(c.dataset.world)));
  $("#moons").innerHTML = WORLDS.map(w => `<i class="${deck.has(w) ? "on" : ""}" title="${w}"></i>`).join("") + (localStorage.getItem("secret") ? '<i class="on sec" title="You found the secret room"></i>' : "");
}
function markDeck(w) { if (!WORLDS.includes(w) || deck.has(w)) return; deck.add(w); localStorage.setItem("deck", JSON.stringify([...deck])); renderDeck(); }
renderDeck();

// read aloud + next story
$("#story").addEventListener("click", e => {
  if (e.target.closest("#bk-open")) return openBook();
  const nx = e.target.closest("[data-next]");
  if (nx) return openStory(nx.dataset.next);
  if (e.target.id !== "listen") return;
  if (!("speechSynthesis" in window)) return alert("Listening isn't supported in this browser.");
  const s = speechSynthesis;
  if (s.speaking) { s.cancel(); e.target.textContent = "Listen"; return; }
  const u = new SpeechSynthesisUtterance(current.title + ". " + current.body);
  u.lang = /[\u0900-\u097F]/.test(current.body) ? "hi-IN" : /[\u0B00-\u0B7F]/.test(current.body) ? "or-IN" : "en-IN";
  u.rate = .95; u.onend = () => { const b = $("#listen"); if (b) b.textContent = "Listen"; };
  s.speak(u); e.target.textContent = "Stop";
});

let calm = false; // calm mode removed: effects are always on

// about the author
let about = { name: "", bio: "", photo: "", ig: "", wa: "" };
const okImg = u => /^(https?:\/\/[^\s"'()]+|[\w./-]+|data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+\/=]+)$/.test(u || "") ? u : "";
const okLink = u => /^https?:\/\/[^\s"']+$/.test(u || "") ? u : "";
function paintAbout() {
  $("#aname").textContent = about.name || "The Storyteller";
  $("#abio").textContent = about.bio || "Stories after dark and shayari from the heart.";
  const p = okImg(about.photo), ph = $("#aphoto");
  ph.style.backgroundImage = p ? `url("${p}")` : ""; ph.classList.toggle("empty", !p);
  $("#alinks").innerHTML = [["Instagram", okLink(about.ig)], ["WhatsApp", okLink(about.wa)]].filter(l => l[1]).map(([t, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${t}</a>`).join("");
  $("#ab-name").value = about.name || ""; $("#ab-bio").value = about.bio || ""; $("#ab-photo").value = about.photo || ""; $("#ab-ig").value = about.ig || ""; $("#ab-wa").value = about.wa || "";
}
async function loadAbout() { try { const d = await getDoc(doc(db, "site", "about")); if (d.exists()) about = { ...about, ...d.data() }; } catch {} paintAbout(); }
$("#about-save").addEventListener("click", async () => {
  const d = { name: $("#ab-name").value.trim(), bio: $("#ab-bio").value.trim(), photo: $("#ab-photo").value.trim(), ig: $("#ab-ig").value.trim(), wa: $("#ab-wa").value.trim() };
  try { await setDoc(doc(db, "site", "about"), d); about = d; paintAbout(); $("#ab-msg").textContent = "Saved."; }
  catch { $("#ab-msg").textContent = "Could not save. Add the new 'site' rule in Firestore Rules and log in again."; }
});
$("#aboutbtn").addEventListener("click", () => $("#about").hidden = false);
$("#aclose").addEventListener("click", () => $("#about").hidden = true);
$("#about").addEventListener("click", e => { if (e.target.id === "about") $("#about").hidden = true; });
loadAbout();

// the book: a cover first, then the pages
function bookHTML(s, th, inner) {
  const art = document.querySelector(`#arts [data-art=${th}] svg`), cv = okImg(s.cover);
  const label = `Open the book: ${esc(s.title)}`;
  const cover = cv
    ? `<button class="bk-cover img" id="bk-open" aria-label="${label}" style="background-image:url('${cv}')">${s.showTitle !== false ? `<span class="cv-shade"></span><span class="cv-ti">${esc(s.title)}</span><span class="cv-by">${esc(s.genre)} &middot; ${esc(about.name || "Moonlit Pages")}</span>` : ""}</button>`
    : `<button class="bk-cover gen" id="bk-open" aria-label="${label}"><span class="cv-art">${art ? art.outerHTML : ""}</span><span class="cv-ti">${esc(s.title)}</span><span class="cv-by">${esc(s.genre)} &middot; ${esc(about.name || "Moonlit Pages")}</span></button>`;
  return `<div class="bk-stage" id="bk-stage"><div class="bk-inside"><div class="orn2">&#10022; &#10023; &#10022;</div><h3>${esc(s.title)}</h3><small>${esc(s.genre)}</small></div>${cover}</div><p class="bk-hint" id="bk-hint">Tap the book to open it</p><div class="rd-actions" id="rd-actions">${inner}</div>`;
}
async function openBook() {
  const st = $("#bk-stage"); if (!st || st.classList.contains("opening")) return;
  st.classList.add("opening"); tone(300, .3, "triangle", .04);
  await sleep(1150);
  $("#reader").classList.remove("closed"); await openSpread();
  await sleep(800); st.classList.remove("opening");
}

// contents list: cover preview
function peekHTML(s) {
  const th = s.genre.toLowerCase(), art = document.querySelector(`#arts [data-art=${th}] svg`), cv = okImg(s.cover);
  return cv ? `<div class="pk" style="background-image:url('${cv}')">${s.showTitle !== false ? `<span class="cv-shade"></span><span class="cv-ti">${esc(s.title)}</span>` : ""}</div>`
    : `<div class="pk gen"><span class="cv-art">${art ? art.outerHTML : ""}</span><span class="cv-ti">${esc(s.title)}</span><span class="cv-by">${esc(s.genre)}</span></div>`;
}
var peekId = null;
$("#story-list").addEventListener("mouseover", e => {
  const r = e.target.closest(".row"); if (!r || r.dataset.id === peekId) return;
  const s = stories.find(x => x.id === r.dataset.id); if (!s) return;
  peekId = s.id; $("#peek").innerHTML = peekHTML(s); const pk = $("#peek .pk"); if (pk) pk.classList.add("peel");
});

// two landing looks: the Night Train and the Campfire
let look = localStorage.getItem("look") === "fire" ? "fire" : "words";
function setLook(l) {
  look = l; localStorage.setItem("look", l);
  document.body.classList.toggle("look-words", l === "words"); document.body.classList.toggle("look-fire", l === "fire");
  $("#look").textContent = "Look: " + (l === "words" ? "Names" : "Campfire");
}
$("#look").addEventListener("click", () => setLook(look === "words" ? "fire" : "words")); setLook(look);


// Campfire: embers rise, objects light up, the fire "speaks"
const SAY = { horror: "Don't read alone.", fantasy: "Step through the portal.", mystery: "Every clue lies.", adventure: "The map is only the start.", shayari: "Words the moon kept." };
const camp = $("#camp");
for (let i = 0; i < 16; i++) {
  const e = document.createElement("i"); e.className = "ember";
  e.style.cssText = `--x:${(Math.random() - .5) * 60}px;--dx:${(Math.random() - .5) * 160}px;--t:${3 + Math.random() * 4}s;--d:-${Math.random() * 6}s`;
  camp.appendChild(e);
}
document.querySelectorAll(".obj").forEach(o => {
  ["mouseenter", "focus"].forEach(ev => o.addEventListener(ev, () => { $("#fire-say").textContent = SAY[o.dataset.world]; $("#fire-say").style.color = o.style.getPropertyValue("--c"); tone(520, .08, "triangle", .03); }));
  ["mouseleave", "blur"].forEach(ev => o.addEventListener(ev, () => { $("#fire-say").textContent = "Come closer. Choose a story."; $("#fire-say").style.color = ""; }));
});

// ===== the open book: full screen, two pages, page turning, ribbon bookmark =====
let bk = { P: [], i: 0, step: 2, single: false, busy: false, wm: "" };
const nextOf = s => { const sib = stories.filter(x => x.genre === s.genre); return sib.length > 1 ? sib[(sib.findIndex(x => x.id === s.id) + 1) % sib.length] : null; };
const wmFor = (s, th) => { const cv = okImg(s.cover); return cv ? `url('${cv}')` : `url("data:image/svg+xml;utf8,${encodeURIComponent(WIDE[th])}")`; };
function pgEl(inner, side) {
  const d = document.createElement("div"); d.className = "pg " + side;
  d.innerHTML = `<div class="wm" style="background-image:${bk.wm}"></div><i class="fx2"></i>${inner}`; return d;
}
function paginate(body) {
  const m = $("#measure"), toks = [];
  body.split(/\n\s*\n/).forEach(p => p.trim().split(/\s+/).filter(Boolean).forEach((w, k) => toks.push({ w, p: k === 0 })));
  const htmlOf = (a, b) => { let out = "", open = false; for (let x = a; x < b; x++) { const t = toks[x]; if (t.p || !open) { if (open) out += "</p>"; out += "<p>"; open = true; } out += esc(t.w) + " "; } return out + (open ? "</p>" : ""); };
  const pages = []; let i = 0;
  while (i < toks.length) {
    let lo = 1, hi = Math.min(toks.length - i, 450), best = 1;
    while (lo <= hi) { const mid = (lo + hi) >> 1; m.innerHTML = htmlOf(i, i + mid); if (m.scrollHeight <= m.clientHeight + 1) { best = mid; lo = mid + 1; } else hi = mid - 1; }
    pages.push(htmlOf(i, i + best)); i += best;
  }
  return pages;
}
function renderSlots() {
  const L = $("#pl"), R = $("#pr"); L.innerHTML = ""; R.innerHTML = "";
  if (!bk.single && bk.P[bk.i]) L.appendChild(pgEl(bk.P[bk.i], "l"));
  const r = bk.P[bk.i + (bk.single ? 0 : 1)]; if (r) R.appendChild(pgEl(r, "r"));
  updateCharm(); setSeek();
  if (bk.i + bk.step >= bk.P.length) bk.done = true;
  $("#bf-pn").textContent = bk.single ? `Page ${bk.i + 1} of ${bk.P.length}` : `Pages ${bk.i + 1}\u2013${Math.min(bk.i + 2, bk.P.length)} of ${bk.P.length}`;
}
async function openSpread() {
  const s = current, th = s.genre.toLowerCase(), fs = $("#bookfs"), nx = nextOf(s);
  bk = { P: [], i: 0, single: innerWidth < 820, busy: false, wm: wmFor(s, th) }; bk.step = bk.single ? 1 : 2;
  fs.classList.toggle("single", bk.single); $("#bf-bg").innerHTML = WIDE[th];
  fs.hidden = false; fs.getBoundingClientRect();
  const P = buildPages(s, nx);
  bk.P = P; const sv = localStorage.getItem("bm:" + s.id);
  if (sv !== null && +sv > 0 && +sv < P.length) { bk.i = +sv - (+sv % bk.step); toast(`Continuing from page ${+sv + 1}`); }
  $("#charm .ci").innerHTML = ICONS[th]; renderSlots();
  fs.classList.add("on"); startAmbient(th); document.body.classList.add("bookopen"); puffDust(); const sp = $("#spread"); sp.classList.add("pg-in"); setTimeout(() => sp.classList.remove("pg-in"), 3400);
}
function buildPages(s, nx) {
  const texts = paginate(s.body || ""), P = [];
  P.push(`<div class="pgtxt tp"><div class="orn2">&#10022; &#10023; &#10022;</div><h2>${esc(s.title)}</h2><small>${esc(s.genre)} &middot; ${esc(about.name || "Moonlit Pages")}</small></div>`);
  texts.forEach((t, k) => P.push(`<div class="pgtxt${k === 0 ? " first" : ""}">${k === 0 ? '<i class="fxp"></i>' : ""}${t}</div><span class="pn">${k + 2}</span>`));
  P.push(`<div class="pgtxt tp"><div class="orn2">&#10022; &#10023; &#10022;</div><h3>The End</h3><button id="bf-end" class="endbtn">Close the book</button>${nx ? `<button class="endbtn" data-next="${nx.id}">Next: ${esc(nx.title)}</button>` : ""}</div>`);
  if (!bk.single && P.length % 2) P.splice(P.length - 1, 0, '<div class="pgtxt"></div>');
  return P;
}
async function turnTo(ni, dir) {
  if (bk.busy || ni === bk.i || ni < 0 || ni >= bk.P.length) return;
  bk.busy = true; tone(220, .2, "triangle", .04);
  const sp = $("#spread"), w = document.createElement("div"), c = document.createElement("div"), ring = document.createElement("div");
  w.className = "swp"; w.style.setProperty("--ox", dir > 0 ? "100%" : "0%"); c.className = "swc"; ring.className = "swr";
  const mk = (html, side) => { const s = document.createElement("div"); s.className = "swh"; s.appendChild(pgEl(html, side)); return s; };
  if (!bk.single) c.appendChild(mk(bk.P[ni] || "", "l"));
  c.appendChild(mk(bk.P[ni + (bk.single ? 0 : 1)] || "", "r"));
  w.append(c, ring); sp.appendChild(w); w.getBoundingClientRect(); w.classList.add("go");
  await sleep(980); bk.i = ni; renderSlots(); w.remove(); bk.busy = false;
}
const turn = dir => turnTo(bk.i + dir * bk.step, dir);
function closeBook() { const fs = $("#bookfs"); fs.classList.remove("on"); stopAmbient(); document.body.classList.remove("bookopen"); if (bk.done && !document.body.classList.contains("lite")) releaseLanterns(); setTimeout(() => fs.hidden = true, 600); }
$("#bf-close").addEventListener("click", closeBook);
$("#bf-next").addEventListener("click", () => turn(1));
$("#bf-prev").addEventListener("click", () => turn(-1));
$("#bookfs").addEventListener("click", e => {
  if (e.target.id === "bf-end") return closeBook();
  const nx = e.target.closest("[data-next]"); if (nx) { closeBook(); openStory(nx.dataset.next); }
});
addEventListener("keydown", e => {
  if ($("#bookfs").hidden) return;
  if (e.key === "ArrowRight") turn(1); else if (e.key === "ArrowLeft") turn(-1); else if (e.key === "Escape") closeBook();
});
let tx = 0;
$("#bookfs").addEventListener("touchstart", e => tx = e.touches[0].clientX, { passive: true });
$("#bookfs").addEventListener("touchend", e => { const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) turn(dx < 0 ? 1 : -1); }, { passive: true });

// ===== new icons (drawn once, used on the landing page and on the bookmark charm) =====
const V = '<svg viewBox="0 0 64 64" aria-hidden="true">';
const ICONS = {
  horror: V + '<g class="gh"><path d="M12 56V28C12 14 21 6 32 6s20 8 20 22v28l-7-6-6 6-7-6-7 6-6-6-7 6z" fill="#eef0f6"/><ellipse cx="24" cy="26" rx="4" ry="6" fill="#1a1a2e"/><ellipse cx="40" cy="26" rx="4" ry="6" fill="#1a1a2e"/><ellipse cx="32" cy="38" rx="4" ry="5" fill="#1a1a2e"/></g><rect x="49" y="38" width="5" height="14" rx="1" fill="#d9cdb4"/><path class="fl" d="M51.5 27q4 6 0 10q-4-4 0-10z" fill="#ffb347"/></svg>',
  fantasy: V + '<path class="egg" d="M32 6C20 6 12 26 12 40c0 12 9 18 20 18s20-6 20-18C52 26 44 6 32 6z" fill="#6a3fb8" stroke="#d2b0ff" stroke-width="2.5"/><circle cx="22" cy="24" r="2" fill="#9a6be8"/><circle cx="40" cy="20" r="2" fill="#9a6be8"/><circle cx="32" cy="14" r="1.6" fill="#9a6be8"/><path class="crk" d="M14 33l8 6 6-8 8 8 7-7 9 6" fill="none" stroke="#1a0a3a" stroke-width="2.5" stroke-linejoin="round"/><circle class="bl" cx="26" cy="46" r="2.6" fill="#ffd66b"/><circle class="bl" cx="38" cy="46" r="2.6" fill="#ffd66b"/><path class="tw" d="M54 6l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#ffd66b"/></svg>',
  mystery: V + '<g class="hat"><ellipse cx="32" cy="48" rx="26" ry="8" fill="#0b2018" stroke="#3fbf8f" stroke-width="2.5"/><path d="M16 46c0-14 6-22 16-22s16 8 16 22z" fill="#0b2018" stroke="#3fbf8f" stroke-width="2.5"/><path d="M16 42h32" stroke="#3fbf8f" stroke-width="4"/></g><path class="tw" d="M27 9q0-6 5-6t5 5q0 3-4 5-2 1-2 4" fill="none" stroke="#9ff5cf" stroke-width="3" stroke-linecap="round"/><circle class="tw" cx="31" cy="21" r="1.8" fill="#9ff5cf"/></svg>',
  adventure: V + '<path d="M32 4C18 4 8 14 8 26c0 10 8 18 16 24h16c8-6 16-14 16-24C56 14 46 4 32 4z" fill="#f5a623"/><path d="M32 4c-5 7-6 18-6 22h12c0-4-1-15-6-22z" fill="#e5253a" opacity=".9"/><path d="M32 4c-8 8-8 38 0 46M32 4c8 8 8 38 0 46M8 26h48" fill="none" stroke="#3a2308" stroke-width="2.5"/><path d="M24 50l4 8M40 50l-4 8" stroke="#3a2308" stroke-width="2"/><rect x="26" y="58" width="12" height="6" rx="1.5" fill="#6b4a1e"/></svg>',
  shayari: V + '<path d="M30 5a24 24 0 1 0 20 38 19 19 0 1 1-20-38z" fill="#f3e6b8"/><path class="ht" d="M46 46C36 38 34 32 34 28a6 6 0 0 1 12-2 6 6 0 0 1 12 2c0 4-2 10-12 18z" fill="#e5568a"/><circle class="tw" cx="52" cy="10" r="2" fill="#e8d28f"/><circle class="tw" cx="58" cy="54" r="1.6" fill="#e8d28f"/><circle class="tw" cx="14" cy="14" r="1.6" fill="#fff"/></svg>'
};
document.querySelectorAll(".obj .ico, .dep .pf, .wrd .ico").forEach(el => el.innerHTML = ICONS[el.closest("[data-world]").dataset.world]);

// ===== bookmark charm: hangs above the book; tap it to save your place =====
function toast(t) { const e = $("#bf-toast"); e.textContent = t; e.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove("on"), 2600); }
function updateCharm() {
  const sv = localStorage.getItem("bm:" + current.id), c = $("#charm"), here = sv !== null && +sv >= bk.i && +sv < bk.i + bk.step;
  c.classList.toggle("saved", here);
  c.querySelector(".cl").textContent = here ? "Saved here" : sv !== null ? `Saved on page ${+sv + 1}` : "Save my place";
}
$("#charm").addEventListener("click", () => {
  const k = "bm:" + current.id, sv = localStorage.getItem(k);
  if (sv !== null && +sv >= bk.i && +sv < bk.i + bk.step) { localStorage.removeItem(k); toast("Bookmark removed"); }
  else { localStorage.setItem(k, bk.i); toast(`Saved. I will remember page ${bk.i + 1}`); }
  updateCharm();
});

// ===== more for the book: text size, night pages, a page slider, click a page to turn =====
let fsz = 1;
function setSeek() { const r = $("#bf-seek"); if (!r) return; const last = Math.max(1, bk.P.length - 1); r.max = bk.P.length - 1; r.value = bk.i; r.style.setProperty("--p", (bk.i / last * 100) + "%"); }
function rebuild() {
  const frac = bk.i / Math.max(1, bk.P.length); bk.P = buildPages(current, nextOf(current));
  bk.i = Math.min(bk.P.length - 1, Math.floor(frac * bk.P.length)); bk.i -= bk.i % bk.step; renderSlots();
}
function setFsz(v) { fsz = Math.max(.8, Math.min(1.5, v)); $("#bookfs").style.setProperty("--fs", fsz); rebuild(); }
$("#bf-full").addEventListener("click", () => { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.(); });
$("#bf-mode").addEventListener("click", () => { const d = $("#bookfs").classList.toggle("dark"); $("#bf-mode").textContent = d ? "Paper pages" : "Night pages"; });
$("#pr").addEventListener("click", e => { if (!e.target.closest("button") && !getSelection().toString()) turn(1); });
$("#pl").addEventListener("click", e => { if (!e.target.closest("button") && !getSelection().toString()) turn(-1); });

// ===== covers: choose a picture from your computer (resized and kept inside the story) =====
let coverData = "";
function showCoverPrev() { const v = coverData || okImg($("#e-cover").value.trim()); $("#cprev").hidden = !v; if (v) $("#cprev-img").src = v; }
function readCover(file) {
  return new Promise(res => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 700 / img.width, 1050 / img.height), c = document.createElement("canvas");
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(img.src); res(c.toDataURL("image/jpeg", .82));
    };
    img.src = URL.createObjectURL(file);
  });
}
$("#e-coverfile").addEventListener("change", async e => { const f = e.target.files[0]; if (!f) return; coverData = await readCover(f); $("#e-cover").value = ""; showCoverPrev(); });
$("#cprev-rm").addEventListener("click", () => { coverData = ""; $("#e-cover").value = ""; $("#e-coverfile").value = ""; showCoverPrev(); });
$("#e-cover").addEventListener("input", () => { coverData = ""; showCoverPrev(); });

// ===== 9. the sky follows the real time; a line says what hour it is =====
function skyTime() {
  const d = new Date(), h = d.getHours(), tm = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  $("#bg").dataset.tod = h < 5 ? "deep" : h < 8 ? "dawn" : h < 17 ? "day" : h < 20 ? "dusk" : "night";
  $("#clk").textContent = h < 5 ? `It's ${tm}. The perfect hour for horror.` : h < 8 ? "Good morning. Shayari tastes best with the first light." : h < 17 ? `It's ${tm}. A fine time for an adventure.` : h < 20 ? "Good evening. The lamps on the lake are being lit." : `It's ${tm}. The night is only beginning.`;
}
skyTime(); setInterval(skyTime, 60000);

// ===== 7. constellations draw themselves when you point at a world =====
const showConst = w => document.querySelectorAll("#const g").forEach(g => g.classList.toggle("on", g.dataset.c === w));
document.querySelectorAll(".dep,.obj,.wrd").forEach(el => {
  ["mouseenter", "focus"].forEach(ev => el.addEventListener(ev, () => showConst(el.dataset.world)));
  ["mouseleave", "blur"].forEach(ev => el.addEventListener(ev, () => showConst(null)));
});

// ===== 8. on a phone, tilting the device moves the scenery a little =====
function tilt(e) {
  const x = Math.max(-20, Math.min(20, e.gamma || 0)), y = Math.max(-20, Math.min(20, (e.beta || 45) - 45));
  $("#bg").style.setProperty("--tx", (-x * .9) + "px"); $("#bg").style.setProperty("--ty", (-y * .6) + "px");
}
async function enableTilt() {
  try {
    if (typeof DeviceOrientationEvent !== "undefined" && DeviceOrientationEvent.requestPermission) { if (await DeviceOrientationEvent.requestPermission() !== "granted") return; }
    addEventListener("deviceorientation", tilt);
  } catch {}
}
addEventListener("touchstart", enableTilt, { once: true, passive: true });

// ===== ambient sound inside the book (made in the browser; off until the reader turns it on) =====
const AMBN = { nodes: [], timers: [], master: null, on: localStorage.getItem("amb") === "1" };
function actx() { ac ||= new AC(); if (ac.state === "suspended") ac.resume(); return ac; }
function blip(f, d, type, v, to) {
  if (!AMBN.master) return; const c = actx(), o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
  o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  o.connect(g).connect(AMBN.master); o.start(t); o.stop(t + d + .05);
}
function startAmbient(th) {
  stopAmbient(); if (!AC || !AMBN.on) return;
  const c = actx(); AMBN.master = c.createGain(); AMBN.master.gain.value = 0; AMBN.master.connect(c.destination);
  AMBN.master.gain.linearRampToValueAtTime(.55, c.currentTime + 2);
  const add = n => { AMBN.nodes.push(n); return n; }, every = (fn, ms) => { fn(); AMBN.timers.push(setInterval(fn, ms)); };
  const noise = (type, f, q, vol) => {
    const s = add(c.createBufferSource()), b = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    s.buffer = b; s.loop = true; const fl = c.createBiquadFilter(), g = c.createGain(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; g.gain.value = vol;
    s.connect(fl).connect(g).connect(AMBN.master); s.start(); return fl;
  };
  if (th === "horror") {
    [55, 55.8].forEach(f => { const o = add(c.createOscillator()), g = c.createGain(); o.type = "sine"; o.frequency.value = f; g.gain.value = .13; o.connect(g).connect(AMBN.master); o.start(); });
    every(() => { blip(62, .22, "sine", .5, 40); setTimeout(() => blip(52, .2, "sine", .35, 36), 190); }, 1150);
  } else if (th === "mystery") {
    noise("highpass", 1400, .5, .07); every(() => blip(98, 2.4, "sine", .06), 9000);
  } else if (th === "adventure") {
    const fl = noise("bandpass", 420, .7, .16), l = add(c.createOscillator()), lg = c.createGain(); l.frequency.value = .09; lg.gain.value = 220; l.connect(lg).connect(fl.frequency); l.start();
  } else {
    const sc = [523.25, 587.33, 659.25, 783.99, 880]; every(() => blip(sc[Math.floor(Math.random() * 5)], 2.2, "sine", .07), 2600);
    const p = add(c.createOscillator()), pg = c.createGain(); p.type = "triangle"; p.frequency.value = 130.8; pg.gain.value = .03; p.connect(pg).connect(AMBN.master); p.start();
  }
}
function stopAmbient() {
  AMBN.timers.forEach(clearInterval); AMBN.timers = []; const m = AMBN.master; AMBN.master = null;
  if (m && ac) { m.gain.cancelScheduledValues(0); m.gain.linearRampToValueAtTime(0, ac.currentTime + .6); }
  AMBN.nodes.forEach(n => { try { n.stop(ac.currentTime + .7); } catch {} }); AMBN.nodes = [];
}
function setAmb(on) {
  AMBN.on = on; localStorage.setItem("amb", on ? "1" : "0"); $("#bf-snd").textContent = "Ambience: " + (on ? "on" : "off");
  if (!$("#bookfs").hidden && current) on ? startAmbient(current.genre.toLowerCase()) : stopAmbient();
}
$("#bf-snd").addEventListener("click", () => setAmb(!AMBN.on)); $("#bf-snd").textContent = "Ambience: " + (AMBN.on ? "on" : "off");

// ===== the secret room =====
let secretData = { title: "You found the secret room", text: "Few readers ever come here.\nSit for a moment. The candle burns only for those who look closely.\n\nचुपके से आए हो, चुपके से जाना,\nयह कमरा किसी को मत बताना।" };
async function loadSecret() {
  try { const d = await getDoc(doc(db, "site", "secret")); if (d.exists()) secretData = { ...secretData, ...d.data() }; } catch {}
  $("#sc-title").value = secretData.title; $("#sc-text").value = secretData.text;
}
function openSecret() {
  const s = $("#secret"); let k = 0;
  $("#s-title").textContent = secretData.title;
  $("#s-text").innerHTML = secretData.text.split("\n").map(l => l.split(" ").filter(Boolean).map(w => `<span style="animation-delay:${(2.2 + k++ * .13).toFixed(2)}s">${esc(w)}</span>`).join(" ")).join("<br>");
  s.hidden = false; s.getBoundingClientRect(); s.classList.add("on");
  localStorage.setItem("secret", "1"); renderDeck();
}
function closeSecret() { const s = $("#secret"); s.classList.remove("on"); setTimeout(() => s.hidden = true, 700); }
$("#s-close").addEventListener("click", closeSecret);
$("#sc-save").addEventListener("click", async () => {
  const d = { title: $("#sc-title").value.trim() || "You found the secret room", text: $("#sc-text").value.trim() };
  try { await setDoc(doc(db, "site", "secret"), d); secretData = d; $("#sc-msg").textContent = "Saved."; }
  catch { $("#sc-msg").textContent = "Could not save. Make sure you are logged in and the Firestore rules allow the 'site' collection."; }
});
let mtaps = [];
$("#moons").addEventListener("click", () => { const n = Date.now(); mtaps = mtaps.filter(t => n - t < 2500); mtaps.push(n); if (mtaps.length >= 3) { mtaps = []; openSecret(); } });
let typed = "";
addEventListener("keydown", e => {
  if (/input|textarea/i.test(e.target.tagName) || e.key.length !== 1) return;
  typed = (typed + e.key.toLowerCase()).slice(-8); if (typed === "midnight") { typed = ""; openSecret(); }
});
loadSecret();

// ===== performance =====
var loadedOnce = false, SKEL = '<div class="skrow"><span></span><i></i></div>'.repeat(4);
document.body.classList.add("home");
document.addEventListener("visibilitychange", () => document.body.classList.toggle("tabhidden", document.hidden));
// automatic lite mode: if the device struggles, the heaviest effects switch themselves off
(function () {
  const weak = (navigator.hardwareConcurrency || 8) <= 3 || (navigator.deviceMemory || 8) <= 2 || (navigator.connection && navigator.connection.saveData);
  if (weak) { document.body.classList.add("lite"); return; }
  setTimeout(() => {
    if (document.hidden) return;
    let frames = 0, t0 = 0, aborted = false;
    const stop = () => { aborted = true; };
    document.addEventListener("visibilitychange", stop, { once: true });
    (function tick(t) {
      if (aborted) return; if (!t0) t0 = t; frames++;
      if (t - t0 < 2500) return requestAnimationFrame(tick);
      if (frames / ((t - t0) / 1000) < 42) document.body.classList.add("lite");
    })(performance.now());
  }, 2500);
})();

// ===== 1. headline letters rise into place, one by one =====
function splitH1(el) {
  let n = 0; el.setAttribute("aria-label", el.textContent);
  const walk = node => [...node.childNodes].forEach(ch => {
    if (ch.nodeType === 3) {
      const frag = document.createDocumentFragment();
      ch.textContent.split(/(\s+)/).forEach(tok => {
        if (!tok) return;
        if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(" ")); return; }
        const w = document.createElement("span"); w.className = "w"; w.setAttribute("aria-hidden", "true");
        [...tok].forEach(c => { const s = document.createElement("span"); s.className = "lt"; s.style.setProperty("--n", n++); s.textContent = c; w.appendChild(s); });
        frag.appendChild(w);
      });
      node.replaceChild(frag, ch);
    } else if (ch.nodeType === 1) walk(ch);
  });
  walk(el);
}
document.querySelectorAll("#gate h1").forEach(splitH1);

// ===== 3 and 5. lanterns when a story is finished; dust when a book opens =====
function releaseLanterns() {
  for (let i = 0; i < 7; i++) {
    const l = document.createElement("i"); l.className = "lant";
    l.style.cssText = `--x:${8 + Math.random() * 84}%;--dx:${(Math.random() - .5) * 120}px;--d:${i * .22}s`;
    document.body.appendChild(l); setTimeout(() => l.remove(), 5200);
  }
}
function puffDust() {
  if (document.body.classList.contains("lite")) return;
  const fs = $("#bookfs");
  for (let i = 0; i < 16; i++) {
    const d = document.createElement("i"); d.className = "bdust";
    d.style.cssText = `--dx:${(Math.random() - .5) * 620}px;--dy:${(Math.random() - .6) * 380}px;--s:${2 + Math.random() * 4}px`;
    fs.appendChild(d); setTimeout(() => d.remove(), 2000);
  }
}

// ===== 6. the moon shows today's real phase =====
function moonPhase() {
  const M = 29.530588853, jd = Date.now() / 86400000 + 2440587.5, age = (((jd - 2451550.1) % M) + M) % M, p = age / M;
  const r = 78, cx = 1190, cy = 230, k = Math.cos(2 * Math.PI * p), rx = (r * Math.abs(k)).toFixed(1), waxing = p <= .5;
  const s1 = waxing ? 0 : 1, s2 = waxing ? (k > 0 ? 0 : 1) : (k > 0 ? 1 : 0);
  $("#moonshade").setAttribute("d", `M${cx} ${cy - r}A${r} ${r} 0 0 ${s1} ${cx} ${cy + r}A${rx} ${r} 0 0 ${s2} ${cx} ${cy - r}z`);
}
moonPhase();

// ===== opening effects: each world opens in its own way =====
var CURT = {
  horror: '<div class="hz"><i></i><i></i></div>',
  fantasy: '<svg class="fm" viewBox="0 0 200 200"><defs><path id="rc" d="M100 100m-78 0a78 78 0 1 1 156 0a78 78 0 1 1-156 0"/></defs><circle cx="100" cy="100" r="94" fill="none" stroke="#ffd66b" stroke-width="2"/><circle cx="100" cy="100" r="62" fill="none" stroke="#ffd66b" stroke-width="1.2"/><text font-size="15" fill="#ffd66b" letter-spacing="5"><textPath href="#rc">\u2726 \u263E \u2727 \u2736 \u273A \u2726 \u263D \u2727 \u2736 \u273A \u2726 \u263E</textPath></text><path d="M100 46l9 34 34 4-28 22 9 34-24-20-24 20 9-34-28-22 34-4z" fill="#ffd66b" opacity=".85"/></svg>',
  adventure: '<svg class="ad" viewBox="0 0 400 140"><path d="M10 110C80 20 140 130 210 70S330 30 390 100" fill="none" stroke="#6b3a0a" stroke-width="4" stroke-dasharray="9 9"/><text x="372" y="124" font-size="34" fill="#c2182b">\u2715</text></svg>',
  shayari: '<span class="wr">Shayari</span>'
};
var SW = { horror: [1000, 1250], fantasy: [950, 1250], mystery: [450, 1100], adventure: [800, 1000], shayari: [1000, 1300] };