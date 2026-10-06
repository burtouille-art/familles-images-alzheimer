import { image, choiceSet, button, CATEGORIES, PRAISE, lower } from "./core.js";
// « Ça sert à quoi ? » : associations sémantiques autour d'une photo nommée.
// Trois questions possibles : la famille, l'usage, la place habituelle.
// Le nom est toujours écrit : on travaille l'association, pas la dénomination.
const KINDS = {
  category: {
    title: "Dans quelle famille ?",
    ask: (p) => `${p.name} : quelle famille ?`,
    answer: (p) => p.category,
    pool: () => CATEGORIES.filter((c) => !["Proches", "Nature"].includes(c)),
  },
  function: {
    title: "Ça sert à quoi ?",
    ask: (p) => `${p.name} : qu’en fait-on ?`,
    answer: (p) => p.function,
    // Usages d'autres familles seulement : pas d'usage voisin ambigu.
    pool: (photos, p) =>
      photos.filter((x) => x.category !== p.category).map((x) => x.function),
  },
  place: {
    title: "À quel endroit ?",
    ask: (p) => `${p.name} : à quel endroit, d’habitude ?`,
    // Uniquement pour les photos dont les lieux habituels sont décrits :
    // les distracteurs viennent de pièces sans recouvrement possible.
    answer: (p) => (p.zones ? p.place : null),
    pool: (photos, p) =>
      photos
        .filter((x) => x.zones && !x.zones.some((z) => p.zones.includes(z)))
        .map((x) => x.place),
  },
};
export default function sorting(ctx) {
  const usable = ctx.photos.filter(
    (p) => !["Lieux", "Proches", "Nature"].includes(p.category),
  );
  const photos = ctx.prioritize(usable);
  let round = 0;
  function kindFor(p, i) {
    const order = ["category", "function", "place"];
    for (let k = 0; k < order.length; k++) {
      const kind = order[(i + k) % order.length];
      if (KINDS[kind].answer(p)) return kind;
    }
    return "category";
  }
  function show() {
    if (round >= ctx.rules.rounds) return ctx.complete();
    const p = photos[round % photos.length];
    const kind = kindFor(p, round);
    const K = KINDS[kind];
    const correct = K.answer(p);
    let answered = false;
    ctx.prepare(
      K.title,
      ctx.stage === "avance"
        ? "Touchez la réponse qui va avec la photo."
        : "Touchez la réponse. Vous pouvez aussi y faire glisser la photo.",
      round + 1,
      ctx.rules.rounds,
    );
    const layout = document.createElement("div");
    layout.className = "photo-question";
    const figure = document.createElement("figure");
    figure.className = "named-photo";
    const im = image(p);
    im.draggable = true;
    im.addEventListener("dragstart", (e) =>
      e.dataTransfer.setData("text/plain", p.id),
    );
    const cap = document.createElement("figcaption");
    cap.textContent = K.ask(p);
    figure.append(im, cap);
    layout.append(figure);
    const choices = document.createElement("div");
    choices.className = "choices text-choices";
    function choose(value, b) {
      if (answered) return;
      if (value === correct) {
        answered = true;
        for (const c of choices.children) c.disabled = true;
        ctx.success(
          () => {
            round++;
            show();
          },
          `${PRAISE[round % PRAISE.length]} ${p.name} : ${lower(correct)}.`,
        );
      } else {
        b.hidden = choices.querySelectorAll("button:not([hidden])").length > 2;
        ctx.wrong(hintFor());
      }
    }
    const pool = [...new Set(K.pool(usable, p).filter(Boolean))].map(
      (name) => ({
        name,
      }),
    );
    const options = choiceSet({ name: correct }, pool, ctx.rules.choices);
    for (const c of options) {
      const b = button(c.name, () => choose(c.name, b));
      b.dataset.correct = String(c.name === correct);
      b.addEventListener("dragover", (e) => e.preventDefault());
      b.addEventListener("drop", (e) => {
        e.preventDefault();
        if (e.dataTransfer.getData("text/plain") === p.id) choose(c.name, b);
      });
      choices.append(b);
    }
    layout.append(choices);
    ctx.body.append(layout);
    let hints = 0;
    function hintFor() {
      hints++;
      if (hints === 1)
        return kind === "category"
          ? p.function || p.context || "Pensons à ce que l’on en fait."
          : kind === "function"
            ? p.context || `C’est dans la famille « ${p.category} ».`
            : p.function || `C’est dans la famille « ${p.category} ».`;
      const wrong = [...choices.children].filter(
        (b) => b.dataset.correct === "false" && !b.hidden,
      );
      if (wrong.length > 1) {
        wrong[0].hidden = true;
        return "Une proposition en moins. Prenons notre temps.";
      }
      for (const b of choices.children)
        if (b.dataset.correct === "true") b.classList.add("suggested");
      return `Ensemble : ${lower(correct)}.`;
    }
    ctx.setSkip(() => {
      round++;
      show();
    });
    ctx.setHint(hintFor);
    ctx.setCaregiverTip(
      "Lisez la question à voix haute. Vous pouvez reformuler (« On la mange ? On la porte ? »), mimer un geste ou montrer la réponse.",
    );
  }
  show();
}
