import { shuffle, photoChoice, button } from "./core.js";
export default function odd(ctx) {
  let round = 0;
  const categories = ["Fruits", "Légumes", "Animaux", "Vêtements"];
  function show() {
    if (round >= ctx.rules.rounds) return ctx.complete();
    const category = categories[round % categories.length],
      group = shuffle(ctx.photos.filter((p) => p.category === category)),
      other = shuffle(
        ctx.photos.filter(
          (p) => categories.includes(p.category) && p.category !== category,
        ),
      )[0];
    const count = ctx.rules.choices;
    const options = shuffle([...group.slice(0, count - 1), other]);
    let answered = false;
    ctx.prepare(
      "La photo différente",
      `Cherchons la famille « ${category} ». Quelle photo appartient à une autre famille ?`,
      round + 1,
      ctx.rules.rounds,
    );
    const choices = document.createElement("div");
    choices.className = "choices";
    for (const p of options) {
      choices.append(
        photoChoice(p, () => {
          if (answered) return;
          if (p.id === other.id) {
            answered = true;
            for (const b of choices.children) b.disabled = true;
            ctx.success(() => {
              round++;
              show();
            });
          } else
            ctx.wrong(
              `Cette photo est bien dans la famille « ${category} ». Regardons les autres.`,
            );
        }),
      );
    }
    ctx.body.append(choices);
    ctx.setHint(
      () => `${other.name} appartient à la famille « ${other.category} ».`,
    );
  }
  show();
}
