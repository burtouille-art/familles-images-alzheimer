import { image, textChoices, CATEGORIES } from "./core.js";
export default function recognition(ctx) {
  const photos = ctx.prioritize(ctx.photos);
  let round = 0;
  function show() {
    if (round >= ctx.rules.rounds) return ctx.complete();
    const p = photos[round % photos.length];
    ctx.prepare(
      "Qu’est-ce que c’est ?",
      "Regardez la photo, puis choisissez son nom.",
      round + 1,
      ctx.rules.rounds,
    );
    const layout = document.createElement("div");
    layout.className = "photo-question";
    layout.append(image(p, "big-photo", "Photo à reconnaître"));
    layout.append(textChoices(ctx, p, ctx.photos, () => category(p)));
    ctx.body.append(layout);
    ctx.setHint(
      () =>
        p.hint ||
        `C’est ${p.name.toLocaleLowerCase("fr")}. Cette photo appartient à la famille « ${p.category} ».`,
    );
  }
  function category(p) {
    ctx.prepare(
      "Dans quelle famille ?",
      "Choisissez la famille de cette photo.",
      round + 1,
      ctx.rules.rounds,
    );
    const layout = document.createElement("div");
    layout.className = "photo-question";
    layout.append(image(p));
    layout.append(
      textChoices(
        ctx,
        { name: p.category },
        CATEGORIES.map((name) => ({ name })),
        () => {
          round++;
          show();
        },
      ),
    );
    ctx.body.append(layout);
  }
  show();
}
