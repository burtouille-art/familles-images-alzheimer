import { moneyQuestion, choiceSet, button, PRAISE } from "./core.js";
// « À la boulangerie » : une situation d'achat du quotidien. Ce n'est ni une
// évaluation de l'autonomie financière ni un test de calcul.
const ITEMS = [
  "une baguette et un croissant",
  "un pain de campagne",
  "des chouquettes",
  "une tarte aux pommes",
  "deux baguettes",
];
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
      "À la boulangerie",
      q.type === "count"
        ? "Chaque carte est une pièce de 1 €. Combien d’euros avons-nous ?"
        : `Nous achetons ${ITEMS[round % ITEMS.length]}. Combien la boulangère nous rend-elle ?`,
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
        im.src = "assets/photos/piece-1-euro.jpg";
        im.alt = "Une pièce de 1 euro";
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
      p1.textContent = `Ça coûte ${euro.format(q.cost)}.`;
      const p2 = document.createElement("p");
      p2.textContent = `Nous donnons ${euro.format(q.paid)}.`;
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
      { close: false },
    )) {
      const v = item.value;
      options.append(
        button(euro.format(v), () => {
          if (answered) return;
          if (v === q.answer) {
            answered = true;
            for (const b of options.children) b.disabled = true;
            ctx.success(
              () => {
                round++;
                show();
              },
              `${PRAISE[round % PRAISE.length]} ${euro.format(v)}.`,
            );
          } else
            ctx.wrong(
              "Comptons ensemble, tranquillement, avec les doigts si vous voulez.",
            );
        }),
      );
    }
    layout.append(left, options);
    ctx.body.append(layout);
    ctx.setSkip(() => {
      round++;
      show();
    });
    ctx.setHint(() =>
      q.type === "count"
        ? `${q.count} pièce${q.count > 1 ? "s" : ""} de 1 €, cela fait ${euro.format(q.answer)}.`
        : `${euro.format(q.paid)} moins ${euro.format(q.cost)} : on rend ${euro.format(q.answer)}.`,
    );
    ctx.setCaregiverTip(
      "Vous pouvez sortir de vraies pièces et compter ensemble. Une réponse approximative est déjà un bel échange.",
    );
  }
  show();
}
