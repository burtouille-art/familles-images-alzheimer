import { YESNO } from "./data.js";
import { image, button, shuffle, CATEGORY_ONE, PRAISE } from "./core.js";
// « Oui ou non ? » : une question fermée sur une photo nommée. Deux réponses
// seulement, très adaptées aux stades avancés ; le proche peut accepter un
// hochement de tête ou un geste.
export default function yesno(ctx) {
  const photos = ctx.prioritize(
    ctx.photos.filter((p) =>
      YESNO.some((q) => [...q.yes, ...q.no].includes(p.category)),
    ),
  );
  let round = 0;
  // Alterne « oui » et « non » sans régularité trop visible.
  const pattern = shuffle([
    true,
    false,
    true,
    false,
    true,
    false,
    true,
    false,
    true,
    false,
  ]);
  function pick(p) {
    const wantYes = pattern[round % pattern.length];
    const fitting = YESNO.filter((q) =>
      (wantYes ? q.yes : q.no).includes(p.category),
    );
    const all = YESNO.filter((q) => [...q.yes, ...q.no].includes(p.category));
    const q = shuffle(fitting.length ? fitting : all)[0];
    return { q, yes: q.yes.includes(p.category) };
  }
  function show() {
    if (round >= ctx.rules.rounds) return ctx.complete();
    const p = photos[round % photos.length];
    const { q, yes } = pick(p);
    let answered = false;
    ctx.prepare(q.ask, "Un signe de tête suffit.", round + 1, ctx.rules.rounds);
    const layout = document.createElement("div");
    layout.className = "photo-question yesno-layout";
    const figure = document.createElement("figure");
    figure.className = "named-photo";
    const cap = document.createElement("figcaption");
    cap.textContent = p.name;
    figure.append(image(p), cap);
    const side = document.createElement("div");
    side.className = "answer-panel";
    const choices = document.createElement("div");
    choices.className = "choices text-choices yes-no";
    const one = CATEGORY_ONE[p.category];
    for (const value of [true, false]) {
      const b = button(value ? "Oui" : "Non", () => {
        if (answered) return;
        if (value === yes) {
          answered = true;
          for (const c of choices.children) c.disabled = true;
          ctx.success(
            () => {
              round++;
              show();
            },
            `${PRAISE[round % PRAISE.length]} ${p.name}, c’est ${one ? one.a : "cela"}.`,
          );
        } else {
          b.hidden = true;
          ctx.wrong(
            `Regardons la photo : ${p.name}, c’est ${one ? one.a : "cela"}.`,
          );
        }
      });
      b.dataset.correct = String(value === yes);
      choices.append(b);
    }
    side.append(choices);
    layout.append(figure, side);
    ctx.body.append(layout);
    let hints = 0;
    ctx.setHint(() => {
      hints++;
      if (hints === 1)
        return (
          p.function || p.context || `${p.name}, c’est ${one?.a || "cela"}.`
        );
      for (const b of choices.children)
        if (b.dataset.correct === "true") b.classList.add("suggested");
      return `La réponse est « ${yes ? "oui" : "non"} ».`;
    });
    ctx.setCaregiverTip(
      "Posez la question à voix haute en montrant la photo. Un hochement de tête, un sourire ou un geste valent une réponse : vous pouvez toucher le bouton pour la personne.",
    );
  }
  show();
}
