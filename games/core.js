// Règles ludiques : le profil reste toujours une décision de l'aidant.
export const PROFILES = Object.freeze({
  leger: {
    label: "Léger",
    rounds: 10,
    choices: 4,
    pairs: 8,
    recall: 7,
    puzzle: [3, 3],
    steps: 4,
  },
  modere: {
    label: "Modéré",
    rounds: 6,
    choices: 3,
    pairs: 4,
    recall: 4,
    puzzle: [2, 3],
    steps: 3,
  },
  avance: {
    label: "Avancé",
    rounds: 3,
    choices: 2,
    pairs: 2,
    recall: 3,
    puzzle: [1, 2],
    steps: 2,
  },
});
export const CATEGORIES = [
  "Fruits",
  "Légumes",
  "Animaux",
  "Vêtements",
  "Lieux",
  "Objets",
  "Nature",
  "Proches",
];
// Forme au singulier, pour des consignes naturelles (« Touchez le fruit »).
export const CATEGORY_ONE = {
  Fruits: { a: "un fruit", the: "le fruit" },
  Légumes: { a: "un légume", the: "le légume" },
  Animaux: { a: "un animal", the: "l’animal" },
  Vêtements: { a: "un vêtement", the: "le vêtement" },
  Lieux: { a: "un lieu", the: "le lieu" },
  Objets: { a: "un objet du quotidien", the: "l’objet" },
  Nature: { a: "un élément de la nature", the: "la nature" },
  Proches: { a: "un proche", the: "le proche" },
};
// Retours chaleureux et adultes : pas de note, pas de « faux ».
export const PRAISE = [
  "Oui, c’est bien cela.",
  "Tout à fait.",
  "Oui, exactement.",
  "C’est cela, merci.",
];
export const lower = (s) => String(s ?? "").toLocaleLowerCase("fr");
const STOP = new Set([
  "une",
  "des",
  "les",
  "du",
  "de",
  "la",
  "le",
  "un",
  "et",
  "au",
  "aux",
  "dans",
  "sur",
  "sous",
  "pour",
  "avec",
  "est",
  "elle",
  "elles",
  "ils",
  "qui",
  "que",
  "son",
  "ses",
  "sa",
  "en",
  "on",
]);
function words(s) {
  return lower(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z]+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
}
// Deux libellés qui partagent un mot important prêtent à confusion
// (« une tasse de café » / « une tasse et une théière ») : on les évite.
export function confusable(a, b) {
  const wa = words(a);
  return words(b).some((w) => wa.includes(w));
}
export function shuffle(items, random = Math.random) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function uniqueBy(items, key = "id") {
  return [...new Map(items.map((x) => [x[key], x])).values()];
}
// close = true : distracteurs de la même famille (plus exigeant, profil léger).
// close = false : distracteurs d'autres familles (plus facile à distinguer).
export function choiceSet(
  correct,
  pool,
  size,
  key = "name",
  { close: near = true } = {},
) {
  const others = uniqueBy(
    pool.filter(
      (x) =>
        x[key] !== correct[key] &&
        (typeof x[key] !== "string" || !confusable(x[key], correct[key])) &&
        // Noms qui se recouvrent (un jean est un pantalon) : jamais ensemble.
        !(correct.near || []).includes(x.id) &&
        !(x.near || []).includes(correct.id),
    ),
    key,
  );
  const close =
    correct.category && near
      ? shuffle(others.filter((x) => x.category === correct.category))
      : [];
  const remaining = others.filter((x) => !close.includes(x));
  const rest = near
    ? shuffle(remaining)
    : [
        ...shuffle(remaining.filter((x) => x.category !== correct.category)),
        ...shuffle(remaining.filter((x) => x.category === correct.category)),
      ];
  return shuffle([
    correct,
    ...[...close, ...rest].slice(0, Math.max(1, size) - 1),
  ]);
}
export function getRules(stage = "modere", support = 0) {
  const p = PROFILES[stage] || PROFILES.modere;
  return {
    ...p,
    support: Math.min(1, support),
    // Distracteurs proches (même famille) seulement au profil léger sans aide.
    close: stage === "leger" && !support,
    choices: Math.max(2, p.choices - Math.min(1, support)),
    pairs: Math.max(2, p.pairs - (support > 0 ? 2 : 0)),
    recall: Math.max(2, p.recall - (support > 0 ? 1 : 0)),
    puzzle:
      support > 0 && stage === "leger"
        ? [2, 3]
        : support > 0 && stage === "modere"
          ? [2, 2]
          : p.puzzle,
  };
}
export function adapt(state, kind) {
  const s = { support: 0, streak: 0, difficulties: 0, ...state };
  if (kind === "help" || kind === "difficulty") {
    s.streak = 0;
    s.difficulties++;
    if (s.difficulties >= 2) {
      s.support = Math.min(1, s.support + 1);
      s.difficulties = 0;
    }
  }
  if (kind === "success") {
    s.difficulties = 0;
    s.streak++;
    if (s.streak >= 3) {
      s.support = Math.max(0, s.support - 1);
      s.streak = 0;
    }
  }
  return s;
}
// Aides progressives pour l'accès au mot, de la plus légère à la plus forte :
// contexte familier → fonction → catégorie → début du mot → deux choix → modèle.
// L'indice phonologique n'est proposé qu'aux profils léger et modéré.
export function cueLadder(photo, stage) {
  const steps = [];
  const context = photo.context || (photo.personal && photo.place);
  if (context)
    steps.push({ kind: "context", label: "Le contexte", text: context });
  const use = photo.function || (photo.personal && photo.hint);
  if (use) steps.push({ kind: "function", label: "L’usage", text: use });
  const one = CATEGORY_ONE[photo.category];
  if (one)
    steps.push({
      kind: "category",
      label: "La famille",
      text: `C’est ${one.a}.`,
    });
  if (photo.cue && stage !== "avance")
    steps.push({
      kind: "phonology",
      label: "Le début du mot",
      text: `Le mot commence par « ${photo.cue} »`,
    });
  steps.push({
    kind: "choices",
    label: "Deux propositions",
    text: "Choisissons entre deux propositions.",
  });
  steps.push({
    kind: "model",
    label: "Le mot",
    text: `C’est ${lower(photo.name)}. On peut le dire ensemble : « ${photo.name} ».`,
  });
  return steps;
}
export function puzzleOrder(n) {
  let a = shuffle(Array.from({ length: n }, (_, i) => i));
  if (a.every((v, i) => v === i)) {
    [a[0], a[1]] = [a[1], a[0]];
  }
  return a;
}
export function moneyQuestion(stage, index = 0) {
  // Tous les montants sont des euros entiers : aucune erreur d'arrondi.
  if (stage === "avance") {
    const count = 1 + (index % 3);
    return {
      type: "count",
      count,
      answer: count,
      choices: [count, count === 1 ? 2 : 1],
    };
  }
  if (stage === "modere") {
    const paid = 5 + (index % 2),
      cost = 2 + (index % 2);
    return {
      type: "change",
      paid,
      cost,
      answer: paid - cost,
      choices: [paid - cost, paid - cost + 1, paid - cost - 1],
    };
  }
  const paid = 10 + (index % 5),
    cost = 3 + (index % 4);
  return {
    type: "change",
    paid,
    cost,
    answer: paid - cost,
    choices: [paid - cost, paid - cost + 1, paid - cost - 1, paid - cost + 2],
  };
}
export const escapeHTML = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function button(text, click, cls = "choice") {
  const b = document.createElement("button");
  b.type = "button";
  b.className = cls;
  b.textContent = text;
  b.addEventListener("click", click);
  return b;
}
export function image(photo, cls = "big-photo", alt = photo.name) {
  const img = document.createElement("img");
  img.src = photo.src;
  img.alt = alt;
  img.className = cls;
  img.decoding = "async";
  return img;
}
export function photoChoice(photo, click, { label = true } = {}) {
  const b = button("", click);
  b.append(image(photo, "", label ? photo.name : "Photo à reconnaître"));
  if (label) {
    const s = document.createElement("span");
    s.textContent = photo.name;
    b.append(s);
  } else b.setAttribute("aria-label", "Choisir cette photo");
  return b;
}
export function textChoices(ctx, correct, pool, onCorrect, key = "name") {
  const wrap = document.createElement("div");
  wrap.className = "choices text-choices";
  const options = choiceSet(correct, pool, ctx.rules.choices, key, {
    close: ctx.rules.close,
  });
  let answered = false;
  for (const item of options) {
    const b = button(item[key], () => {
      if (answered) return;
      if (item[key] === correct[key]) {
        answered = true;
        for (const c of wrap.children) c.disabled = true;
        ctx.success(onCorrect);
      } else ctx.wrong();
    });
    b.dataset.correct = String(item[key] === correct[key]);
    wrap.append(b);
  }
  ctx.setHint(() => {
    const wrong = [...wrap.children].filter(
      (b) => b.dataset.correct === "false",
    );
    const left = wrong.filter((b) => !b.hidden);
    if (left.length > 1) {
      left[0].hidden = true;
      return "Une proposition en moins. Prenons le temps de regarder.";
    }
    return `Regardons ensemble : ${correct[key]}.`;
  });
  return wrap;
}
