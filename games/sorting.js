import { image, choiceSet, button, CATEGORIES } from "./core.js";
export default function sorting(ctx) {
  const photos = ctx.prioritize(ctx.photos);
  let round = 0;
  function show() {
    if (round >= ctx.rules.rounds) return ctx.complete();
    const p = photos[round % photos.length];
    let answered = false;
    ctx.prepare(
      "À chaque photo sa famille",
      "Touchez la bonne famille. Vous pouvez aussi y faire glisser la photo.",
      round + 1,
      ctx.rules.rounds,
    );
    const layout = document.createElement("div");
    layout.className = "photo-question";
    const im = image(p);
    im.draggable = true;
    im.addEventListener("dragstart", (e) =>
      e.dataTransfer.setData("text/plain", p.id),
    );
    layout.append(im);
    const choices = document.createElement("div");
    choices.className = "choices text-choices";
    function choose(category) {
      if (answered) return;
      if (category === p.category) {
        answered = true;
        for (const b of choices.children) b.disabled = true;
        ctx.success(() => {
          round++;
          show();
        });
      } else
        ctx.wrong(`Cherchons la famille de ${p.name.toLocaleLowerCase("fr")}.`);
    }
    const options = choiceSet(
      { name: p.category },
      CATEGORIES.map((name) => ({ name })),
      ctx.rules.choices,
    );
    for (const c of options) {
      const b = button(c.name, () => choose(c.name));
      b.addEventListener("dragover", (e) => e.preventDefault());
      b.addEventListener("drop", (e) => {
        e.preventDefault();
        if (e.dataTransfer.getData("text/plain") === p.id) choose(c.name);
      });
      choices.append(b);
    }
    layout.append(choices);
    ctx.body.append(layout);
    ctx.setHint(() => `Cette photo appartient à la famille « ${p.category} ».`);
  }
  show();
}
