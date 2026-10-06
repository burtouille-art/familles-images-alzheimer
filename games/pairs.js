import { PAIRS, PHOTOS } from "./data.js";
import { image, photoChoice, shuffle, PRAISE } from "./core.js";
// « Ça va ensemble » : associations d'usage ou de situation entre deux photos.
// Les associations et les distracteurs sont choisis à la main (voir data.js).
const byId = (id) => PHOTOS.find((p) => p.id === id);
export default function pairs(ctx) {
  const list = shuffle(PAIRS);
  let round = 0;
  function show() {
    if (round >= ctx.rules.rounds) return ctx.complete();
    const pair = list[round % list.length];
    const from = byId(pair.from),
      to = byId(pair.to);
    let answered = false;
    ctx.prepare(
      "Qu’est-ce qui va avec ?",
      `Regardez : ${from.name.toLocaleLowerCase("fr")}. Touchez ce qui va avec.`,
      round + 1,
      ctx.rules.rounds,
    );
    const layout = document.createElement("div");
    layout.className = "pair-layout";
    const figure = document.createElement("figure");
    figure.className = "named-photo pair-from";
    const cap = document.createElement("figcaption");
    cap.textContent = from.name;
    figure.append(image(from), cap);
    const choices = document.createElement("div");
    choices.className = "choices";
    const options = shuffle([
      to,
      ...shuffle(pair.not)
        .slice(0, ctx.rules.choices - 1)
        .map(byId),
    ]);
    for (const p of options) {
      const b = photoChoice(p, () => {
        if (answered) return;
        if (p.id === to.id) {
          answered = true;
          for (const c of choices.children) c.disabled = true;
          ctx.success(
            () => {
              round++;
              show();
            },
            `${PRAISE[round % PRAISE.length]} ${pair.why}`,
          );
        } else {
          b.hidden =
            choices.querySelectorAll("button:not([hidden])").length > 2;
          ctx.wrong(
            `Pensons à ce que l’on fait avec ${from.name.toLocaleLowerCase("fr")}.`,
          );
        }
      });
      b.dataset.correct = String(p.id === to.id);
      choices.append(b);
    }
    layout.append(figure, choices);
    ctx.body.append(layout);
    // D'autres liens sont possibles : le proche peut accueillir celui que la
    // personne explique, sans que ce soit compté comme une difficulté.
    ctx.caregiverAction("Un autre lien a été expliqué", () => {
      if (answered) return;
      answered = true;
      for (const c of choices.children) c.disabled = true;
      ctx.accept(() => {
        round++;
        show();
      }, "Merci pour cette explication. Il y a souvent plusieurs bonnes idées.");
    });
    let hints = 0;
    ctx.setSkip(() => {
      round++;
      show();
    });
    ctx.setHint(() => {
      hints++;
      if (hints === 1) return from.function || from.context;
      for (const b of choices.children)
        if (b.dataset.correct === "true") b.classList.add("suggested");
      return pair.why;
    });
    ctx.setCaregiverTip(
      "Il peut y avoir d’autres liens que celui prévu : si la personne en propose un, écoutez-la et parlez-en. L’échange compte plus que la réponse.",
    );
  }
  show();
}
