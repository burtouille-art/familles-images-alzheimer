import { image, textChoices } from "./core.js";
export default function places(ctx) {
  const photos = ctx.prioritize(
    ctx.photos.filter(
      (p) =>
        (p.personal && p.place) ||
        (!p.personal && (p.category === "Lieux" || p.id === "jardin")),
    ),
  );
  let round = 0;
  function show() {
    if (round >= ctx.rules.rounds) return ctx.complete();
    const p = photos[round % photos.length];
    ctx.prepare(
      "Un lieu, un souvenir",
      p.personal
        ? "Quel lieu avez-vous associé à cette photo ?"
        : "À quel type de lieu cette photo fait-elle penser ?",
      round + 1,
      ctx.rules.rounds,
    );
    const layout = document.createElement("div");
    layout.className = "photo-question";
    layout.append(image(p, "big-photo", "Un lieu à reconnaître"));
    layout.append(
      textChoices(
        ctx,
        { name: p.place },
        photos.map((x) => ({ name: x.place })),
        () => {
          round++;
          show();
        },
      ),
    );
    ctx.body.append(layout);
    ctx.setHint(
      () =>
        `${p.place}. ${p.hint || "Prenez aussi le temps de raconter ce que ce lieu vous évoque."}`,
    );
  }
  show();
}
