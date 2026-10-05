import { moneyQuestion, choiceSet, button } from "./core.js";
export default function money(ctx) {
  let round = 0;
  const euro = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  });
  function show() {
    if (round >= ctx.rules.rounds) return ctx.complete();
    let answered = false;
    const q = moneyQuestion(ctx.stage, round);
    ctx.prepare(
      "La petite monnaie",
      q.type === "count"
        ? "Chaque carte représente une pièce de 1 €. Combien d’euros cela fait-il ?"
        : "Regardez les montants, puis choisissez la monnaie à rendre.",
      round + 1,
      ctx.rules.rounds,
    );
    const layout = document.createElement("div");
    layout.className = "photo-question";
    const left = document.createElement("div");
    if (q.type === "count") {
      const cards = document.createElement("div");
      cards.className = "photo-row";
      cards.style.gridTemplateColumns = `repeat(${q.count},1fr)`;
      for (let i = 0; i < q.count; i++) {
        const f = document.createElement("figure"),
          im = document.createElement("img");
        im.src = "assets/photos/centime.jpg";
        im.alt = "Une pièce de 1 euro au premier plan";
        const cap = document.createElement("figcaption");
        cap.textContent = "1 €";
        f.append(im, cap);
        cards.append(f);
      }
      left.append(cards);
    } else {
      const im = document.createElement("img");
      im.src =
        ctx.stage === "leger"
          ? "assets/photos/billets.jpg"
          : "assets/photos/pieces.jpg";
      im.alt =
        ctx.stage === "leger"
          ? "Photographie de billets et pièces en euros, illustration du thème"
          : "Photographie de pièces en euros, illustration du thème";
      im.className = "money-photo";
      const equation = document.createElement("div");
      equation.className = "money-equation";
      const p1 = document.createElement("p");
      p1.textContent = `Prix : ${euro.format(q.cost)}`;
      const p2 = document.createElement("p");
      p2.textContent = `Somme donnée : ${euro.format(q.paid)}`;
      equation.append(p1, p2);
      left.append(im, equation);
    }
    const options = document.createElement("div");
    options.className = "choices text-choices";
    for (const item of choiceSet(
      { value: q.answer },
      q.choices.map((value) => ({ value })),
      ctx.rules.choices,
      "value",
    )) {
      const v = item.value;
      options.append(
        button(euro.format(v), () => {
          if (answered) return;
          if (v === q.answer) {
            answered = true;
            for (const b of options.children) b.disabled = true;
            ctx.success(() => {
              round++;
              show();
            });
          } else ctx.wrong("Comptons ensemble, tranquillement.");
        }),
      );
    }
    layout.append(left, options);
    ctx.body.append(layout);
    ctx.setHint(() =>
      q.type === "count"
        ? `${q.count} pièce${q.count > 1 ? "s" : ""} de 1 €, cela fait ${euro.format(q.answer)}.`
        : `${euro.format(q.paid)} moins ${euro.format(q.cost)} : on rend ${euro.format(q.answer)}.`,
    );
  }
  show();
}
