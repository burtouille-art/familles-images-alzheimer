import { shuffle, button, image, photoChoice, choiceSet } from "./core.js";
export default function recall(ctx) {
  const pool = ctx.photos.filter(
    (p) => !["Lieux", "Proches"].includes(p.category),
  );
  const targets = shuffle(pool).slice(0, ctx.rules.recall);
  let found = new Set();
  function study() {
    ctx.prepare(
      "Dans mon panier",
      "Regardez ces photos. Dites leur nom et leur famille si vous en avez envie.",
    );
    const row = document.createElement("div");
    row.className = "photo-row";
    for (const p of targets) {
      const f = document.createElement("figure"),
        cap = document.createElement("figcaption");
      cap.textContent = `${p.name} · ${p.category}`;
      f.append(image(p, ""), cap);
      row.append(f);
    }
    ctx.body.append(
      row,
      button(
        "Je suis prêt à les retrouver",
        () => (ctx.stage === "leger" ? interlude() : retrieve()),
        "primary",
      ),
    );
    ctx.setHint(() => targets.map((p) => p.name).join(", "));
  }
  function interlude() {
    ctx.prepare(
      "Une petite parenthèse",
      "Avant de retrouver le panier, regardons un lieu. Qu’est-ce que cette photo vous évoque ?",
    );
    const p = ctx.photos.find((p) => p.id === "lac");
    ctx.body.append(
      image(p),
      button("Retrouver mon panier", retrieve, "primary"),
    );
    ctx.setHint(
      () => "Prenez le temps d’en parler. Vous choisissez quand continuer.",
    );
  }
  function retrieve() {
    if (found.size === targets.length) return ctx.complete();
    if (ctx.stage === "avance") return retrieveBinary();
    ctx.prepare(
      "Qu’aviez-vous dans le panier ?",
      "Touchez les photos que vous venez de voir. Vous pouvez revoir le panier à tout moment.",
    );
    const choices = document.createElement("div");
    choices.className = "choices";
    const extra = shuffle(
      pool.filter((p) => !targets.some((t) => t.id === p.id)),
    ).slice(0, ctx.stage === "avance" ? 1 : ctx.stage === "modere" ? 2 : 3);
    const options = shuffle([...targets, ...extra]);
    const status = document.createElement("p");
    status.textContent = "Retrouvons les photos, tranquillement.";
    ctx.body.append(status, choices);
    for (const p of options) {
      const b = photoChoice(p, () => {
        if (found.has(p.id)) return;
        if (targets.some((t) => t.id === p.id)) {
          found.add(p.id);
          b.classList.add("found");
          b.disabled = true;
          status.textContent = "C’est exact ! Continuons ensemble.";
          ctx.reward();
          if (found.size === targets.length) ctx.success(() => ctx.complete());
        } else ctx.wrong("Vous pouvez revoir le panier et réessayer.");
      });
      if (found.has(p.id)) {
        b.disabled = true;
        b.classList.add("found");
      }
      choices.append(b);
    }
    const review = button(
      "Revoir le panier",
      () => {
        ctx.markHelp();
        study();
      },
      "quiet",
    );
    ctx.body.append(review);
    ctx.setHint(
      () => `Le panier contenait : ${targets.map((p) => p.name).join(", ")}.`,
    );
  }
  // Au profil avancé, une photo à retrouver à la fois, toujours deux choix.
  function retrieveBinary() {
    const target = targets.find((p) => !found.has(p.id));
    if (!target) return ctx.complete();
    let answered = false;
    ctx.prepare(
      "Qu’aviez-vous dans le panier ?",
      "Choisissez une des deux photos. Nous pouvons regarder ensemble.",
      found.size + 1,
      targets.length,
    );
    const choices = document.createElement("div");
    choices.className = "choices";
    const otherPhotos = pool.filter((p) => !targets.some((t) => t.id === p.id));
    for (const p of choiceSet(target, otherPhotos, 2, "id")) {
      choices.append(
        photoChoice(p, () => {
          if (answered) return;
          if (p.id === target.id) {
            answered = true;
            for (const b of choices.children) b.disabled = true;
            ctx.success(() => {
              found.add(target.id);
              retrieveBinary();
            });
          } else ctx.wrong("Vous pouvez revoir le panier et réessayer.");
        }),
      );
    }
    const cue = document.createElement("p");
    cue.className = "guide";
    cue.textContent = `Ensemble, cherchez : ${target.name}.`;
    ctx.body.append(
      cue,
      choices,
      button(
        "Revoir le panier",
        () => {
          ctx.markHelp();
          study();
        },
        "quiet",
      ),
    );
    ctx.setHint(
      () =>
        `Dans le panier, il y avait ${target.name.toLocaleLowerCase("fr")}.`,
    );
  }
  study();
}
