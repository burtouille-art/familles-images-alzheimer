import { PROVERBS, PHOTOS } from "./data.js";
import { image, button, shuffle, PRAISE } from "./core.js";
// « Les expressions de toujours » : compléter un proverbe connu. Le proche
// peut dire le début à voix haute et laisser la personne finir la phrase.
// Début de la fin, tel qu'il se prononce (une syllabe orale, ou le premier son).
const CUES = {
  nid: "n…",
  temps: "t…",
  bœuf: "b…",
  moine: "m…",
  mousse: "mou…",
  dansent: "dan…",
  gris: "g…",
  jamais: "ja…",
  fils: "f…",
  due: "d…",
  fil: "f…",
  point: "p…",
  printemps: "prin…",
  forgeron: "for…",
  rivières: "ri…",
  tison: "ti…",
  chaud: "ch…",
  tempête: "tem…",
  assemble: "a…",
  auras: "au…",
};
export default function expressions(ctx) {
  const list = shuffle(PROVERBS);
  let round = 0;
  function show() {
    if (round >= ctx.rules.rounds) return ctx.complete();
    const item = list[round % list.length];
    let answered = false;
    ctx.prepare(
      "Comment finit l’expression ?",
      ctx.stage === "avance"
        ? "Écoutons le début ensemble, puis touchez la fin."
        : "Lisez le début, dites la fin ou touchez-la.",
      round + 1,
      ctx.rules.rounds,
    );
    const card = document.createElement("div");
    card.className = "proverb-card";
    if (item.photo) {
      const p = PHOTOS.find((x) => x.id === item.photo);
      card.append(image(p, "proverb-photo", p.name));
    }
    const start = document.createElement("p");
    start.className = "proverb";
    start.textContent = item.start;
    card.append(start);
    const listen = button(
      "Écouter le début",
      () => ctx.say(item.start),
      "quiet",
    );
    card.append(listen);
    const choices = document.createElement("div");
    choices.className = "choices text-choices";
    const options = shuffle([
      item.end,
      ...shuffle(item.others).slice(0, ctx.rules.choices - 1),
    ]);
    const full = item.start.replace(/…$/, "") + item.end + ".";
    for (const word of options) {
      const b = button(word, () => {
        if (answered) return;
        if (word === item.end) {
          answered = true;
          for (const c of choices.children) c.disabled = true;
          start.textContent = full;
          ctx.success(
            () => {
              round++;
              show();
            },
            `${PRAISE[round % PRAISE.length]} « ${full} » Qui le disait souvent, chez vous ?`,
          );
        } else {
          b.hidden =
            choices.querySelectorAll("button:not([hidden])").length > 2;
          ctx.wrong(
            "Redisons le début ensemble, la fin vient souvent toute seule.",
          );
        }
      });
      b.dataset.correct = String(word === item.end);
      choices.append(b);
    }
    const panel = document.createElement("div");
    panel.className = "photo-question";
    const side = document.createElement("div");
    side.className = "answer-panel";
    side.append(choices);
    panel.append(card, side);
    ctx.body.append(panel);
    let hints = 0;
    ctx.setHint(() => {
      hints++;
      if (hints === 1)
        return ctx.stage === "avance"
          ? `Écoutons encore : « ${item.start} »`
          : `Le mot commence par « ${CUES[item.end] || item.end[0] + "…"} »`;
      for (const b of choices.children)
        if (b.dataset.correct === "true") b.classList.add("suggested");
      return `« ${full} »`;
    });
    ctx.setCaregiverTip(
      "Dites le début avec le rythme habituel, puis faites une pause : la fin vient souvent d’elle-même. Une variante familiale de l’expression est une très bonne réponse.",
    );
  }
  show();
}
