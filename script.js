import { GAMES, PHOTOS } from "./games/data.js";
import {
  PROFILES,
  CATEGORIES,
  getRules,
  adapt,
  shuffle,
  escapeHTML,
  button,
  PRAISE,
} from "./games/core.js";
import * as storage from "./store.js";
import recognition from "./games/recognition.js";
import memory from "./games/memory.js";
import places from "./games/places.js";
import sorting from "./games/sorting.js";
import sequence from "./games/sequence.js";
import sounds from "./games/sounds.js";
import money from "./games/money.js";
import puzzle from "./games/puzzle.js";
import odd from "./games/odd.js";
import recall from "./games/recall.js";
import yesno from "./games/yesno.js";
import pairs from "./games/pairs.js";
import expressions from "./games/expressions.js";
import prefer from "./games/prefer.js";
import family from "./games/family.js";
const $ = (id) => document.getElementById(id);
const activities = {
  recognition,
  memory,
  places,
  sorting,
  sequence,
  sounds,
  money,
  puzzle,
  odd,
  recall,
  yesno,
  pairs,
  expressions,
  prefer,
  family,
};
let prefs = storage.loadPreferences(),
  personal = [],
  rawPersonal = [],
  urls = [],
  active = null,
  audio = null,
  audioContext = null,
  installPrompt = null;
let hintHandler = null,
  skipHandler = null,
  hadHelp = false,
  hadDifficulty = false,
  sessionToken = 0,
  stepsDone = 0,
  praiseIndex = 0,
  lastPressed = null,
  guardUntil = 0,
  sessionStart = 0,
  restOffered = false,
  showAll = false;
// Activités proposées d'abord au profil avancé : regarder, écouter, échanger.
const GENTLE = ["family", "places", "prefer", "expressions", "yesno"];
const views = ["home", "play", "settings", "done"];
function showView(name) {
  stopAudio();
  speechSynthesisSafeCancel();
  views.forEach((id) => ($(id).hidden = id !== name));
  document.body.classList.toggle("in-game", name === "play");
  if (name === "home") renderHome();
  if (name === "done") observationButtons();
  $("main").focus();
  window.scrollTo({ top: 0, behavior: "instant" });
}
function persist() {
  if (!storage.savePreferences(prefs))
    $("settings-status").textContent =
      "Les réglages sont conservés pour cette visite seulement : le stockage du navigateur n’est pas disponible.";
}
function applyPreferences() {
  document.documentElement.style.setProperty(
    "--font-size-base",
    `${prefs.font}px`,
  );
  document.body.classList.toggle("large-text", prefs.font > 24);
  document.documentElement.classList.toggle("high-contrast", prefs.contrast);
  $("contrast").checked = prefs.contrast;
  $("rest").checked = prefs.rest;
  $("support-lock").checked = prefs.supportLock;
  if (document.activeElement !== $("person-name"))
    $("person-name").value = prefs.name;
  $("sound").checked = prefs.sound;
  $("vibration").checked = prefs.vibration;
  $("guidance").checked = prefs.guidance;
  $("voice").checked = prefs.voice;
}
function stopAudio() {
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
    audio = null;
  }
}
function speechSynthesisSafeCancel() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}
function say(text, force = true) {
  if (!force && !prefs.voice) return;
  if (!("speechSynthesis" in window)) {
    $("feedback").textContent =
      "La lecture vocale n’est pas disponible ici. La consigne reste affichée.";
    return;
  }
  speechSynthesisSafeCancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "fr-FR";
  u.rate = 0.85;
  u.volume = 0.55;
  u.onerror = () => {
    $("feedback").textContent =
      "La lecture vocale n’est pas disponible actuellement. Regardons la consigne affichée.";
  };
  window.speechSynthesis.speak(u);
}
function reward() {
  if (prefs.sound) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioContext ??= new AudioContext();
        audioContext.resume();
        const oscillator = audioContext.createOscillator(),
          gain = audioContext.createGain();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
        gain.gain.setValueAtTime(0, audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(
          0.035,
          audioContext.currentTime + 0.03,
        );
        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          audioContext.currentTime + 0.45,
        );
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
      }
    } catch {
      /* Le retour visuel reste disponible. */
    }
  }
  if (prefs.vibration && navigator.vibrate) navigator.vibrate(35);
}
function mark(kind) {
  if (!active) return;
  const key = `${prefs.stage}-${active.id}`;
  prefs.adaptation[key] = adapt(prefs.adaptation[key], kind);
  persist();
}
function markHelp() {
  if (!hadHelp) {
    hadHelp = true;
    mark("help");
  }
}
function setNext(handler, label = "Continuer tranquillement") {
  const area = $("next-area");
  area.replaceChildren();
  if (handler) {
    const token = sessionToken;
    area.append(
      button(
        label,
        () => {
          if (token !== sessionToken) return;
          stopAudio();
          handler();
        },
        "primary",
      ),
    );
  }
}
function home() {
  sessionToken++;
  active = null;
  // De retour à l'accueil, la séance préparée est de nouveau mise en avant.
  showAll = false;
  closePause();
  showView("home");
}
// Pause : le jeu reste en mémoire, on reprend exactement au même endroit.
function openPause() {
  if (!active) return home();
  stopAudio();
  speechSynthesisSafeCancel();
  $("pause-panel").hidden = false;
  $("play-content").hidden = true;
  $("pause-finish").hidden = stepsDone === 0;
  $("pause-title").focus();
}
function closePause() {
  $("pause-panel").hidden = true;
  $("play-content").hidden = false;
}
function resume() {
  closePause();
  $("game-title").focus();
}
function recordSession() {
  if (!active) return;
  prefs.history.push({ game: active.id, date: Date.now() });
  prefs.history = prefs.history.slice(-300);
  persist();
}
function finishEarly() {
  recordSession();
  closePause();
  sessionToken++;
  showView("done");
  $("done-message").textContent =
    "Vous pouvez vous arrêter quand vous le souhaitez. Cette séance a été ajoutée aux moments partagés.";
  $("done-title").focus();
}
function startGame(id) {
  const g = GAMES.find((g) => g.id === id);
  if (!g) return;
  sessionToken++;
  active = g;
  stepsDone = 0;
  hadHelp = false;
  hadDifficulty = false;
  closePause();
  showView("play");
  $("caregiver-tip").hidden = true;
  $("tip-toggle").hidden = true;
  $("guide").hidden = true;
  $("tip-toggle").setAttribute("aria-expanded", "false");
  $("game-domain").textContent = g.title;
  sessionStart ||= Date.now();
  $("rest-suggestion").hidden = true;
  const key = `${prefs.stage}-${id}`;
  const ctx = {
    stage: prefs.stage,
    photos: [...personal.filter((p) => p.ready), ...PHOTOS],
    body: $("game-body"),
    get rules() {
      return getRules(
        prefs.stage,
        prefs.supportLock ? 1 : prefs.adaptation[key]?.support || 0,
      );
    },
    prioritize: (items) => [
      ...shuffle(items.filter((p) => p.personal)),
      ...shuffle(items.filter((p) => !p.personal)),
    ],
    variant(name, n) {
      const v = (prefs.variants[name] || 0) % n;
      prefs.variants[name] = (v + 1) % n;
      persist();
      return v;
    },
    say,
    setCaregiverTip(text) {
      $("caregiver-tip-text").textContent = text;
      $("tip-toggle").hidden = !text;
      $("guide").textContent = text;
      $("guide").hidden = !(
        text &&
        (prefs.guidance || prefs.stage === "avance")
      );
      // Le conseil est déjà affiché sous le jeu : pas besoin du bouton.
      $("tip-toggle").hidden = !text || !$("guide").hidden;
    },
    share(next, message = "Merci pour ce moment d’échange.") {
      stepsDone++;
      hadHelp = false;
      hadDifficulty = false;
      $("feedback").textContent = message;
      setNext(next);
    },
    prepare(title, instruction, index, total) {
      stopAudio();
      speechSynthesisSafeCancel();
      // L'aide reçue reste attachée à la tâche jusqu'à sa réussite :
      // revoir le modèle puis réussir n'est pas compté « sans aide ».
      hintHandler = null;
      skipHandler = null;
      $("skip").hidden = true;
      $("caregiver-actions").hidden = true;
      $("caregiver-actions-list").replaceChildren();
      $("hint").disabled = false;
      $("game-title").textContent = title;
      $("instruction").textContent = instruction;
      paintProgress(index, total);
      // Évite qu'un double toucher sur l'écran précédent ne réponde ici.
      guardUntil = performance.now() + 350;
      lastPressed = null;
      offerRest();
      ctx.body.replaceChildren();
      $("feedback").textContent = "";
      setNext(null);
      $("game-title").focus();
      say(`${title}. ${instruction}`, false);
    },
    setHint(fn) {
      hintHandler = fn;
    },
    // « Autre photo » : passer à la suite sans répondre, à tout moment.
    setSkip(fn) {
      skipHandler = fn;
      $("skip").hidden = !fn;
    },
    // Commandes du proche, séparées des réponses de la personne.
    caregiverAction(label, fn) {
      $("caregiver-actions").hidden = false;
      const b = button(label, fn, "quiet");
      $("caregiver-actions-list").append(b);
      return b;
    },
    // Réponse dite, montrée ou expliquée, validée par le proche : accueillie
    // comme une réussite, mais sans réduire le soutien.
    accept(next, message) {
      markHelp();
      ctx.success(next, message);
    },
    sayings: prefs.sayings,
    // Ajout du fichier de photos depuis le jeu lui-même, puis redémarrage.
    async importFile(file) {
      const message = await importFile(file);
      startGame(id);
      $("feedback").textContent = message;
    },
    markHelp,
    reward,
    setNext,
    clearFeedback() {
      $("feedback").textContent = "";
    },
    success(next, message) {
      if (lastPressed?.classList.contains("choice"))
        lastPressed.classList.add("chosen");
      if (!hadHelp && !hadDifficulty) mark("success");
      hadHelp = false;
      hadDifficulty = false;
      stepsDone++;
      reward();
      $("feedback").textContent =
        message || PRAISE[praiseIndex++ % PRAISE.length];
      setNext(next);
    },
    wrong(
      extra = "Prenons le temps, on peut essayer autant de fois que l’on veut.",
    ) {
      if (!hadDifficulty) mark("difficulty");
      hadDifficulty = true;
      $("feedback").textContent = `Regardons ensemble. ${extra}`;
    },
    async playAudio(src) {
      stopAudio();
      const token = sessionToken;
      const a = new Audio(src);
      audio = a;
      a.volume = 0.35;
      try {
        await a.play();
      } catch {
        if (token === sessionToken)
          $("feedback").textContent =
            "Ce son ne peut pas être lu ici. Vous pouvez demander un indice ou choisir une autre activité.";
      }
    },
    stopAudio,
    complete() {
      if (!active) return;
      recordSession();
      sessionToken++;
      showView("done");
      $("done-message").textContent =
        "Cette séance a été ajoutée aux moments partagés.";
      $("done-title").focus();
    },
  };
  activities[id](ctx);
}
function paintProgress(index, total) {
  const bar = $("game-progress");
  bar.replaceChildren();
  if (!(index && total)) {
    bar.setAttribute("aria-label", "Tout votre temps");
    return;
  }
  bar.setAttribute(
    "aria-label",
    `Étape ${index} sur ${total}, sans se presser`,
  );
  for (let i = 1; i <= total; i++) {
    const dot = document.createElement("span");
    if (i < index) dot.className = "is-done";
    if (i === index) dot.className = "is-now";
    bar.append(dot);
  }
}
// Après 20 minutes, une proposition de pause, une seule fois, sans insister.
function offerRest() {
  if (!prefs.rest || restOffered || !sessionStart) return;
  if (Date.now() - sessionStart < 20 * 60 * 1000) return;
  restOffered = true;
  $("rest-suggestion").hidden = false;
}
$("rest-pause").addEventListener("click", () => {
  $("rest-suggestion").hidden = true;
  openPause();
});
$("rest-dismiss").addEventListener("click", () => {
  $("rest-suggestion").hidden = true;
});
// Garde contre les touchers involontaires (tremblements, double toucher).
$("game-body").addEventListener(
  "click",
  (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (e.isTrusted && performance.now() < guardUntil) {
      e.stopImmediatePropagation();
      e.preventDefault();
      return;
    }
    lastPressed = b;
  },
  true,
);
$("hint").addEventListener("click", () => {
  if (!hintHandler) return;
  markHelp();
  const message = hintHandler();
  if (message) $("feedback").textContent = message;
});
// « Lire » : la consigne, puis ce qui est affiché au centre et les réponses.
$("read").addEventListener("click", () => {
  const body = $("game-body");
  const parts = [$("game-title").textContent, $("instruction").textContent];
  for (const el of body.querySelectorAll(
    ".proverb, .talk, .named-photo figcaption",
  ))
    parts.push(el.textContent);
  const labels = [...body.querySelectorAll("button.choice")]
    .filter((b) => !b.hidden && !b.disabled)
    .map((b) => b.textContent.trim())
    .filter(Boolean);
  if (labels.length) parts.push(`Les réponses : ${labels.join(", ")}`);
  say(parts.join(". "));
});
$("skip").addEventListener("click", () => {
  if (!skipHandler) return;
  const fn = skipHandler;
  skipHandler = null;
  stopAudio();
  fn();
});
for (const id of ["close-settings", "done-home", "pause-home"])
  $(id).addEventListener("click", home);
$("brand").addEventListener("click", () =>
  !$("play").hidden && active ? openPause() : home(),
);
$("pause").addEventListener("click", openPause);
$("back-home").addEventListener("click", openPause);
$("pause-resume").addEventListener("click", resume);
$("pause-finish").addEventListener("click", finishEarly);
$("tip-toggle").addEventListener("click", () => {
  const open = $("caregiver-tip").hidden;
  $("caregiver-tip").hidden = !open;
  $("tip-toggle").setAttribute("aria-expanded", String(open));
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !$("play").hidden) {
    if ($("pause-panel").hidden) openPause();
    else resume();
  }
});
$("replay").addEventListener("click", () => {
  if (active) startGame(active.id);
});
let featuredGame = "places";
$("start-photo").addEventListener("click", () => startGame(featuredGame));
function buildHome() {
  const grid = $("game-grid");
  for (const g of GAMES) {
    // La cellule porte le rôle de liste ; la carte reste un vrai bouton.
    const cell = document.createElement("div");
    cell.setAttribute("role", "listitem");
    cell.className = "card-cell";
    cell.dataset.game = g.id;
    const card = document.createElement("button");
    card.type = "button";
    card.className = "game-card";
    card.dataset.game = g.id;
    card.setAttribute("aria-label", `Jouer à ${g.title}`);
    card.innerHTML = `<img src="assets/photos/${g.cover}.jpg" alt="" loading="lazy" width="640" height="420"><span class="card-text"><span class="card-title">${g.title}</span><span>${g.description}</span><span class="go" aria-hidden="true">Commencer <svg class="icon"><use href="#i-arrow"/></svg></span></span>`;
    card.addEventListener("click", () => startGame(g.id));
    cell.append(card);
    grid.append(cell);
  }
}
// La séance préparée par l'aidant, sinon une sélection selon le profil.
function chosenGames() {
  if (prefs.favorites?.length) return prefs.favorites;
  return prefs.stage === "avance" ? GENTLE : null;
}
// Accueil : salutation selon l'heure, date du jour (repère dans le temps),
// photo personnelle mise en avant, activités de la séance d'abord.
function renderHome() {
  const now = new Date();
  const hour = now.getHours();
  const hello = hour >= 18 || hour < 5 ? "Bonsoir" : "Bonjour";
  $("greeting").textContent = prefs.name ? `${hello} ${prefs.name}` : hello;
  const day = now.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  $("today").textContent = `Nous sommes ${day}.`;
  const mine = personal.filter((p) => p.ready);
  const featured =
    mine.find((p) => p.category === "Proches") ||
    mine.find((p) => p.category === "Lieux") ||
    mine[0];
  $("featured-photo").src = featured ? featured.src : "assets/photos/lac.jpg";
  // Une photo personnelle est montrée entière : on ne coupe jamais un visage.
  $("featured-photo").classList.toggle("whole", Boolean(featured));
  $("featured-photo").alt = featured
    ? featured.name
    : "Un lac entouré de montagnes";
  // La carte « Ma famille » montre une vraie photo de la famille.
  const relative = mine.find((p) => p.category === "Proches");
  const cover = $("game-grid").querySelector(
    '.game-card[data-game="family"] img',
  );
  if (cover) {
    cover.src = relative ? relative.src : "assets/photos/maison.jpg";
    cover.classList.toggle("face", Boolean(relative));
  }
  // Avec des photos de famille, l'accueil propose d'abord « Ma famille ».
  featuredGame = relative ? "family" : "places";
  $("featured-title").textContent = relative
    ? "Ma famille"
    : "Une photo, un souvenir";
  $("featured-text").textContent = relative
    ? "Regarder les photos de la famille, et en parler ensemble."
    : "Regarder, en parler. Il n’y a pas de bonne réponse.";
  $("start-photo").firstChild.textContent = relative
    ? "Voir les photos de famille "
    : "Regarder cette photo ";
  const chosen = chosenGames();
  const all = GAMES.map((g) => g.id);
  // Avec des photos de famille, « Ma famille » vient en premier.
  const base = relative
    ? all
    : [...all.filter((id) => id !== "family"), "family"];
  const order = chosen
    ? [...chosen, ...base.filter((id) => !chosen.includes(id))]
    : base;
  const grid = $("game-grid");
  for (const id of order) {
    const cell = grid.querySelector(`.card-cell[data-game="${id}"]`);
    grid.append(cell);
    cell.hidden = Boolean(chosen) && !showAll && !chosen.includes(id);
  }
  $("show-all").hidden = !chosen || showAll;
  $("activities-lead").textContent = prefs.favorites?.length
    ? "Les activités préparées pour aujourd’hui."
    : chosen
      ? "Quelques activités douces, à faire ensemble."
      : "Touchez celle qui vous plaît.";
}
$("show-all").addEventListener("click", () => {
  const n = chosenGames()?.length || 0;
  showAll = true;
  renderHome();
  $("game-grid").querySelectorAll(".game-card")[n]?.focus();
});
// Séance préparée : l'aidant coche les activités à proposer sur l'accueil.
function favoriteButtons() {
  const wrap = $("favorite-options");
  wrap.replaceChildren();
  const current = prefs.favorites || [];
  for (const g of GAMES) {
    const b = button(g.title, () => {
      const set = new Set(prefs.favorites || []);
      if (set.has(g.id)) set.delete(g.id);
      else if (set.size >= 6) {
        $("favorite-status").textContent = "Six activités au plus.";
        return;
      } else set.add(g.id);
      prefs.favorites = set.size
        ? GAMES.map((x) => x.id).filter((id) => set.has(id))
        : null;
      persist();
      favoriteButtons();
      $("favorite-status").textContent = prefs.favorites
        ? `${prefs.favorites.length} activité${prefs.favorites.length > 1 ? "s" : ""} sur l’accueil.`
        : "Aucune activité choisie : l’accueil propose une sélection selon le profil.";
    });
    b.setAttribute("aria-pressed", String(current.includes(g.id)));
    wrap.append(b);
  }
}
function sayingsField() {
  $("sayings").value = prefs.sayings
    .map((x) => `${x.start} | ${x.end}`)
    .join("\n");
}
$("sayings").addEventListener("change", (e) => {
  const lines = e.target.value
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const sayings = [];
  let ignored = 0;
  for (const l of lines) {
    const [start, ...rest] = l.split("|");
    const end = rest.join("|").trim();
    if (start?.trim() && end && start.length <= 120 && end.length <= 60)
      sayings.push({ start: start.trim(), end });
    else ignored++;
  }
  prefs.sayings = sayings.slice(0, 30);
  persist();
  $("sayings-status").textContent =
    `${prefs.sayings.length} expression${prefs.sayings.length > 1 ? "s" : ""} enregistrée${prefs.sayings.length > 1 ? "s" : ""}.` +
    (ignored
      ? ` ${ignored} ligne${ignored > 1 ? "s" : ""} sans « | » ignorée${ignored > 1 ? "s" : ""}.`
      : "");
});
$("support-lock").addEventListener("change", (e) => {
  prefs.supportLock = e.target.checked;
  persist();
});
// Observation facultative du proche, ajoutée à la dernière séance.
function observationButtons() {
  const wrap = $("observation-options");
  wrap.replaceChildren();
  $("observation-status").textContent = "";
  for (const label of storage.OBSERVATIONS) {
    const b = button(
      label,
      () => {
        const last = prefs.history.at(-1);
        if (!last) return;
        last.note = last.note === label ? undefined : label;
        if (!last.note) delete last.note;
        persist();
        for (const x of wrap.children)
          x.setAttribute("aria-pressed", String(x.textContent === last.note));
        $("observation-status").textContent = last.note
          ? `Noté : « ${last.note} ».`
          : "Observation retirée.";
      },
      "quiet",
    );
    b.setAttribute("aria-pressed", "false");
    wrap.append(b);
  }
}
function stageButtons() {
  const wrap = $("stage-options");
  wrap.replaceChildren();
  const details = {
    leger:
      "Jusqu’à 10 étapes et 4 propositions. La personne joue, le proche accompagne si besoin.",
    modere: "Jusqu’à 6 étapes, 3 propositions et des aides pas à pas.",
    avance:
      "3 étapes au plus, 2 propositions, une action à la fois. Regarder, écouter et échanger ensemble.",
  };
  for (const [key, p] of Object.entries(PROFILES)) {
    const b = button("", () => {
      prefs.stage = key;
      if (key === "avance" && prefs.font < 28) prefs.font = 28;
      persist();
      applyPreferences();
      stageButtons();
      fontButtons();
    });
    b.setAttribute("aria-pressed", String(key === prefs.stage));
    const name = document.createElement("span");
    name.className = "stage-name";
    name.textContent = p.label;
    const detail = document.createElement("span");
    detail.className = "stage-detail";
    detail.textContent = details[key];
    b.append(name, detail);
    wrap.append(b);
  }
}
function fontButtons() {
  const wrap = $("font-options");
  wrap.replaceChildren();
  for (const size of [24, 28, 32]) {
    const b = button(`${size} px`, () => {
      prefs.font = size;
      persist();
      applyPreferences();
      fontButtons();
    });
    b.setAttribute("aria-pressed", String(size === prefs.font));
    wrap.append(b);
  }
}
for (const [id, key] of [
  ["sound", "sound"],
  ["vibration", "vibration"],
  ["guidance", "guidance"],
  ["voice", "voice"],
  ["contrast", "contrast"],
  ["rest", "rest"],
])
  $(id).addEventListener("change", (e) => {
    prefs[key] = e.target.checked;
    persist();
    applyPreferences();
  });
$("person-name").addEventListener("input", (e) => {
  prefs.name = e.target.value.replace(/[<>]/g, "").slice(0, 40);
  persist();
});
$("person-name").addEventListener("change", (e) => {
  prefs.name = e.target.value.replace(/[<>]/g, "").trim().slice(0, 40);
  persist();
});
$("reset-adaptation").addEventListener("click", () => {
  prefs.adaptation = {};
  persist();
  $("settings-status").textContent =
    "Les aides sont revenues au niveau initial du profil choisi.";
});
async function refreshPersonal() {
  const rows = await storage.listPhotos();
  urls.forEach((u) => URL.revokeObjectURL(u));
  urls = [];
  rawPersonal = rows;
  personal = rows.map((p) => {
    const src = URL.createObjectURL(p.blob);
    urls.push(src);
    let sound = null;
    if (p.audio) {
      sound = URL.createObjectURL(p.audio);
      urls.push(sound);
    }
    return { ...p, src, sound, personal: true };
  });
}
async function settings() {
  sessionToken++;
  active = null;
  showView("settings");
  stageButtons();
  fontButtons();
  favoriteButtons();
  sayingsField();
  applyPreferences();
  renderHistory();
  $("settings-title").focus();
  try {
    await refreshPersonal();
    renderPersonal();
  } catch (e) {
    $("upload-status").textContent = e.message;
  }
}
$("caregiver").addEventListener("click", settings);
function renderHistory() {
  const list = $("history");
  list.replaceChildren();
  $("session-count").textContent =
    `${prefs.history.length} séance${prefs.history.length > 1 ? "s" : ""} réalisée${prefs.history.length > 1 ? "s" : ""} sur cet appareil.`;
  for (const s of [...prefs.history].reverse().slice(0, 12)) {
    const g = GAMES.find((g) => g.id === s.game);
    if (!g) continue;
    const li = document.createElement("li");
    li.textContent = `${new Date(s.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} — ${g.title}${s.note ? ` · ${s.note}` : ""}`;
    list.append(li);
  }
}
function renderPersonal() {
  const wrap = $("personal-photos");
  wrap.replaceChildren();
  if (!personal.length) {
    const p = document.createElement("p");
    p.textContent =
      "Aucune photo personnelle pour le moment. Les photos de démonstration sont déjà disponibles.";
    wrap.append(p);
    return;
  }
  const count = document.createElement("p");
  count.textContent = `${personal.length} photo${personal.length > 1 ? "s" : ""} sur cet appareil. Touchez une photo pour la modifier.`;
  wrap.append(count);
  const grid = document.createElement("div");
  grid.className = "personal-grid";
  wrap.append(grid);
  for (const p of personal) {
    const raw = rawPersonal.find((x) => x.id === p.id);
    // Chaque photo se replie : la liste reste courte, même avec 50 photos.
    const box = document.createElement("details");
    box.className = "personal-item";
    // Une photo à nommer s'ouvre d'elle-même.
    box.open = !p.ready;
    const summary = document.createElement("summary");
    const thumb = document.createElement("img");
    thumb.src = p.src;
    thumb.alt = "";
    thumb.loading = "lazy";
    const label = document.createElement("span");
    label.textContent = p.name || "Sans nom";
    const cat = document.createElement("span");
    cat.className = "personal-cat";
    cat.textContent = p.ready ? p.category : "À nommer";
    summary.append(thumb, label, cat);
    box.append(summary);
    const editor = document.createElement("form");
    editor.className = "personal-editor";
    editor.innerHTML = `<img src="${p.src}" alt="Photo personnelle à personnaliser"><label>Nom à reconnaître<input type="text" name="name" maxlength="80" required value="${escapeHTML(p.name)}" placeholder="Le lac de notre village"></label><p>Pour une personne, indiquez le prénom ou le lien familial qui lui est familier.</p><fieldset><legend>Famille de la photo</legend><div class="category-options"></div></fieldset><label>Lieu associé (facultatif)<input type="text" name="place" maxlength="100" value="${escapeHTML(p.place)}" placeholder="Au lac de notre village"></label><label>Où la voit-on, d’habitude ? (facultatif)<input type="text" name="context" maxlength="160" value="${escapeHTML(p.context)}" placeholder="Sur le buffet du salon"></label><label>À quoi sert-elle, ou qui est-ce ? (facultatif)<input type="text" name="function" maxlength="160" value="${escapeHTML(p.function)}" placeholder="Pour moudre le café du matin"></label><p>Ces deux phrases servent d’aides progressives dans « Le mot juste ».</p><label>Souvenir à partager (facultatif)<textarea name="hint" maxlength="240" rows="3" placeholder="Nous y allions chaque été…">${escapeHTML(p.hint)}</textarea></label><label>Son associé (facultatif)<input type="file" name="audio" accept="audio/*"></label><p>${p.audio ? "Un son personnel est associé à cette photo." : "Un son de 5 Mo maximum peut accompagner la photo dans « À l’écoute »."}</p><div class="editor-actions"></div><p class="toast" role="status"></p>`;
    let category = p.category;
    let audioBlob = raw.audio || null;
    const categoryWrap = editor.querySelector(".category-options");
    function categories() {
      categoryWrap.replaceChildren();
      for (const c of CATEGORIES) {
        const b = button(c, () => {
          category = c;
          categories();
        });
        b.setAttribute("aria-pressed", String(c === category));
        categoryWrap.append(b);
      }
    }
    categories();
    const status = editor.querySelector(".toast");
    editor.elements.audio.addEventListener("change", (e) => {
      const f = e.target.files[0];
      if (!f) return;
      if (!f.type.startsWith("audio/") || f.size > 5 * 1024 * 1024) {
        status.textContent = "Choisissez un fichier audio de moins de 5 Mo.";
        e.target.value = "";
        return;
      }
      audioBlob = f;
      status.textContent = "Son prêt. Enregistrez la photo pour le conserver.";
    });
    const save = button("Enregistrer cette photo", () => {}, "primary");
    save.type = "submit";
    const remove = button(
      "Supprimer cette photo",
      async () => {
        remove.disabled = true;
        try {
          await storage.deletePhoto(p.id);
          await refreshPersonal();
          renderPersonal();
          $("upload-status").textContent = "Photo supprimée de cet appareil.";
        } catch (e) {
          status.textContent = e.message;
          remove.disabled = false;
        }
      },
      "quiet",
    );
    editor.querySelector(".editor-actions").append(save, remove);
    if (audioBlob) {
      editor.querySelector(".editor-actions").append(
        button(
          "Retirer le son",
          () => {
            audioBlob = null;
            status.textContent =
              "Son retiré. Enregistrez pour conserver ce changement.";
          },
          "quiet",
        ),
      );
    }
    editor.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = editor.elements.name.value.trim();
      if (!name) {
        status.textContent =
          "Indiquez le nom de la photo avant de l’enregistrer.";
        return;
      }
      if (!CATEGORIES.includes(category)) {
        status.textContent =
          "Choisissez la famille de la photo : « Proches » pour une personne, « Objets » pour un objet de la maison…";
        return;
      }
      save.disabled = true;
      try {
        await storage.putPhoto({
          ...raw,
          name,
          category,
          place: editor.elements.place.value.trim(),
          context: editor.elements.context.value.trim(),
          function: editor.elements.function.value.trim(),
          hint: editor.elements.hint.value.trim(),
          audio: audioBlob,
          ready: true,
        });
        await refreshPersonal();
        renderPersonal();
        $("upload-status").textContent =
          `Photo « ${name} » enregistrée. Elle sera utilisée en priorité.`;
      } catch (e) {
        status.textContent = e.message;
        save.disabled = false;
      }
    });
    box.append(editor);
    grid.append(box);
  }
}
$("upload-photo").addEventListener("change", async (e) => {
  const files = [...e.target.files];
  if (!files.length) return;
  e.target.disabled = true;
  let count = 0;
  const errors = [];
  for (const f of files) {
    try {
      const blob = await storage.preparePhoto(f);
      await storage.putPhoto({
        id: `custom-${crypto.randomUUID()}`,
        name: "",
        // Aucune famille par défaut : l'aidant choisit (une photo de personne
        // rangée par erreur dans « Objets » serait proposée à nommer).
        category: "",
        place: "",
        context: "",
        function: "",
        hint: "",
        blob,
        audio: null,
        ready: false,
      });
      count++;
    } catch (error) {
      errors.push(`${f.name} : ${error.message}`);
    }
  }
  try {
    await refreshPersonal();
    renderPersonal();
  } catch (error) {
    errors.push(error.message);
  }
  $("upload-status").textContent =
    `${count} photo${count > 1 ? "s" : ""} ajoutée${count > 1 ? "s" : ""}. Donnez un nom à chaque photo, puis enregistrez-la. ${errors.join(" ")}`;
  e.target.value = "";
  e.target.disabled = false;
});
$("export-backup").addEventListener("click", async () => {
  const status = $("backup-status");
  try {
    const rows = await storage.listPhotos();
    const photos = [];
    for (const p of rows) {
      photos.push({
        id: p.id,
        name: p.name,
        category: p.category,
        place: p.place,
        context: p.context || "",
        function: p.function || "",
        hint: p.hint,
        ready: p.ready,
        image: await storage.toDataURL(p.blob),
        audio: p.audio ? await storage.toDataURL(p.audio) : null,
      });
    }
    const blob = new Blob(
        [
          JSON.stringify({
            format: "memoire-partage",
            version: 2,
            preferences: prefs,
            photos,
          }),
        ],
        { type: "application/json" },
      ),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = `memoire-partage-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent =
      "Sauvegarde préparée. Gardez ce fichier privé : il contient vos photos et vos sons.";
  } catch (e) {
    status.textContent = e.message;
  }
});
// Restaurer une sauvegarde ou ajouter un pack de photos ; renvoie le message.
async function importFile(file) {
  try {
    if (file.size > 100 * 1024 * 1024)
      throw new Error("Cette sauvegarde dépasse 100 Mo.");
    const data = JSON.parse(await file.text());
    if (
      data.format !== "memoire-partage" ||
      ![1, 2].includes(data.version) ||
      !Array.isArray(data.photos) ||
      data.photos.length > 200
    )
      throw new Error("Choisissez une sauvegarde MémoirePartage valide.");
    const imported = data.photos.map((p) => {
      if (
        !p ||
        typeof p.id !== "string" ||
        !/^custom-[a-zA-Z0-9-]{1,80}$/.test(p.id) ||
        typeof p.name !== "string" ||
        p.name.length > 80 ||
        !(CATEGORIES.includes(p.category) || (p.category === "" && !p.ready)) ||
        typeof p.place !== "string" ||
        p.place.length > 100 ||
        typeof p.hint !== "string" ||
        p.hint.length > 240 ||
        (p.context != null &&
          (typeof p.context !== "string" || p.context.length > 160)) ||
        (p.function != null &&
          (typeof p.function !== "string" || p.function.length > 160))
      )
        throw new Error("Une photo de cette sauvegarde n’est pas valide.");
      const blob = storage.dataURLToBlob(p.image, "image"),
        audio = p.audio ? storage.dataURLToBlob(p.audio, "audio") : null;
      if (audio && audio.size > 5 * 1024 * 1024)
        throw new Error("Un son dépasse 5 Mo.");
      return {
        id: p.id,
        name: p.name,
        category: p.category,
        place: p.place,
        context: p.context || "",
        function: p.function || "",
        hint: p.hint,
        ready: Boolean(p.ready && p.name.trim()),
        blob,
        audio,
      };
    });
    await storage.putManyPhotos(imported);
    // Un « pack de photos » (sans réglages) s'ajoute sans rien remplacer.
    const photosOnly = !data.preferences;
    if (!photosOnly) {
      prefs = storage.validatePreferences(data.preferences);
      persist();
    }
    await refreshPersonal();
    renderPersonal();
    renderHistory();
    stageButtons();
    fontButtons();
    favoriteButtons();
    sayingsField();
    applyPreferences();
    return photosOnly
      ? `${imported.length} photo${imported.length > 1 ? "s" : ""} ajoutée${imported.length > 1 ? "s" : ""}. Vos réglages et vos séances n’ont pas changé.`
      : "Sauvegarde restaurée. Les photos déjà présentes avec le même identifiant ont été mises à jour.";
  } catch (error) {
    return error.message || "Impossible de lire cette sauvegarde.";
  }
}
$("import-backup").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  $("backup-status").textContent = await importFile(file);
  e.target.value = "";
});
buildHome();
applyPreferences();
renderHome();
refreshPersonal()
  .then(() => {
    if (!$("home").hidden) renderHome();
  })
  .catch(() => {
    /* Les photos de démonstration restent disponibles. */
  });
// Installation : le statut « prêt » n'apparaît qu'après le cache complet des médias.
let offlineReady = false;
function offlineStatus() {
  if (offlineReady)
    $("offline-state").textContent = navigator.onLine
      ? "Prêt pour jouer sans connexion sur cet appareil."
      : "Vous êtes hors connexion. Les activités restent disponibles.";
}
window.addEventListener("online", offlineStatus);
window.addEventListener("offline", offlineStatus);
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker
    .register("./sw.js")
    .then(async (initialRegistration) => {
      const worker = initialRegistration.installing;
      if (worker)
        worker.addEventListener("statechange", () => {
          if (worker.state === "redundant" && !offlineReady) {
            $("offline-state").textContent =
              "Le téléchargement hors connexion a été interrompu. Rechargez l’application avec une connexion pour réessayer.";
          }
        });
      // Quand une nouvelle version prend le relais, la page se recharge une
      // fois : sans cela, l'ancien code resterait actif jusqu'au redémarrage.
      if (navigator.serviceWorker.controller) {
        let reloaded = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (reloaded) return;
          reloaded = true;
          location.reload();
        });
      }
      initialRegistration.update?.().catch(() => {});
      const registration = await navigator.serviceWorker.ready;
      offlineReady = Boolean(registration.active);
      offlineStatus();
    })
    .catch(() => {
      $("offline-state").textContent =
        "Le mode hors connexion n’a pas pu être préparé. Rechargez l’application avec une connexion.";
    });
} else
  $("offline-state").textContent =
    "Pour le mode hors connexion, ouvrez l’application sur son adresse web sécurisée.";
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  installPrompt = e;
  $("install").hidden = false;
});
$("install").addEventListener("click", async () => {
  if (!installPrompt) return;
  await installPrompt.prompt();
  installPrompt = null;
  $("install").hidden = true;
});
