import { choiceSet, photoChoice, button } from "./core.js";
export default function sounds(ctx) {
  const photos = ctx.prioritize(ctx.photos.filter((p) => p.sound));
  let round = 0;
  function show() {
    if (round >= ctx.rules.rounds) return ctx.complete();
    const p = photos[round % photos.length];
    let answered = false;
    ctx.prepare(
      "À l’écoute",
      "Écoutez le son, puis touchez la photo qui lui correspond.",
      round + 1,
      ctx.rules.rounds,
    );
    const actions = document.createElement("div");
    actions.className = "row-actions";
    actions.append(
      button("Écouter le son", () => ctx.playAudio(p.sound), "primary"),
      button("Arrêter le son", () => ctx.stopAudio(), "quiet"),
    );
    const choices = document.createElement("div");
    choices.className = "choices";
    for (const item of choiceSet(p, ctx.photos, ctx.rules.choices, "id")) {
      const b = photoChoice(item, () => {
        if (answered) return;
        if (item.id === p.id) {
          answered = true;
          ctx.stopAudio();
          for (const c of choices.children) c.disabled = true;
          ctx.success(() => {
            round++;
            show();
          });
        } else ctx.wrong();
      });
      choices.append(b);
    }
    ctx.body.append(actions, choices);
    ctx.setHint(() => p.hint || `Ce son accompagne la photo « ${p.name} ».`);
  }
  show();
}
