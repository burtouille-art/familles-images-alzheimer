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
  "Proches",
];
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
export function choiceSet(correct, pool, size, key = "name") {
  const others = uniqueBy(
    pool.filter((x) => x[key] !== correct[key]),
    key,
  );
  const close = correct.category
    ? shuffle(others.filter((x) => x.category === correct.category))
    : [];
  const rest = shuffle(others.filter((x) => !close.includes(x)));
  return shuffle([
    correct,
    ...[...close, ...rest].slice(0, Math.max(1, size) - 1),
  ]);
}
export function getRules(stage = "modere", support = 0) {
  const p = PROFILES[stage] || PROFILES.modere;
  return {
    ...p,
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
  const options = choiceSet(correct, pool, ctx.rules.choices, key);
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
    if (wrong.length > 1) wrong[0].hidden = true;
    return `Regardons ensemble : ${correct[key]}.`;
  });
  return wrap;
}
