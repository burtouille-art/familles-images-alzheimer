import { SEQUENCE, PHOTOS } from "./data.js";
import { shuffle, button, image } from "./core.js";
export default function sequence(ctx) {
  // On reproduit un exemple présenté ; les habitudes quotidiennes peuvent varier.
  const raw =
    ctx.stage === "avance"
      ? SEQUENCE.slice(2)
      : ctx.stage === "modere"
        ? [SEQUENCE[0], ...SEQUENCE.slice(2)]
        : SEQUENCE;
  const steps = raw.map((s, i) => ({
    ...s,
    order: i,
    photo: PHOTOS.find((p) => p.id === s.photo),
  }));
  let chosen = [];
  ctx.prepare(
    "Les petits gestes",
    "Regardons un exemple de préparation du petit-déjeuner, dans cet ordre.",
  );
  const model = document.createElement("div");
  model.className = "sequence-list";
  for (const s of steps) {
    const fig = document.createElement("div");
    fig.className = "choice";
    const n = document.createElement("span");
    n.className = "order-badge";
    n.textContent = `Étape ${s.order + 1}`;
    fig.append(n, image(s.photo, ""), document.createTextNode(s.name));
    model.append(fig);
  }
  ctx.body.append(
    model,
    button("À vous, retrouver cet ordre", play, "primary"),
  );
  function play() {
    ctx.prepare(
      "Dans quel ordre ?",
      "Touchez la première étape, puis la suivante. L’ordre montré est un exemple, pas une règle pour votre quotidien.",
    );
    const wrap = document.createElement("div");
    wrap.className = "sequence-list";
    const status = document.createElement("p");
    status.textContent = "Choisissez la première étape.";
    ctx.body.append(status, wrap);
    const list = shuffle(steps);
    for (const s of list) {
      const b = button("", () => {
        const target = steps[chosen.length];
        if (s.order === target.order) {
          chosen.push(s);
          b.disabled = true;
          const n = document.createElement("span");
          n.className = "order-badge";
          n.textContent = `Étape ${chosen.length}`;
          b.prepend(n);
          if (chosen.length === steps.length) ctx.success(() => ctx.complete());
          else {
            ctx.clearFeedback();
            status.textContent = `C’est exact ! Choisissez maintenant l’étape ${chosen.length + 1}.`;
            ctx.reward();
          }
        } else ctx.wrong("Regardons l’exemple ensemble.");
      });
      b.append(image(s.photo, ""), document.createTextNode(s.name));
      wrap.append(b);
    }
    ctx.setHint(
      () =>
        `La prochaine étape est : ${steps[Math.min(chosen.length, steps.length - 1)].name}.`,
    );
  }
  ctx.setHint(() => steps.map((s) => `${s.order + 1}. ${s.name}`).join(" "));
}
