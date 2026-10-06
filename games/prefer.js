import { photoChoice, button, shuffle } from "./core.js";
// « Ce qui me plaît » : choisir entre deux photos de même nature. Toute
// préférence convient, ainsi que « les deux » ou « aucune » : c'est une
// activité de choix et d'échange, sans bonne réponse. On ne fait jamais
// choisir entre deux proches.
const KINDS = [
  { cats: ["Lieux", "Nature"], ask: "Où aimeriez-vous être aujourd’hui ?" },
  { cats: ["Fruits"], ask: "Qu’est-ce qui vous fait le plus envie ?" },
  { cats: ["Vêtements"], ask: "Qu’aimeriez-vous porter ?" },
  { cats: ["Légumes"], ask: "Qu’aimez-vous le plus manger ?" },
  { cats: ["Animaux"], ask: "Quelle photo vous plaît le plus ?" },
  { cats: ["Objets"], ask: "Quelle photo vous fait le plus plaisir ?" },
];
export default function prefer(ctx) {
  const kinds = shuffle(
    KINDS.filter(
      (k) => ctx.photos.filter((p) => k.cats.includes(p.category)).length >= 2,
    ),
  );
  let round = 0;
  function show() {
    if (round >= ctx.rules.rounds) return ctx.complete();
    const kind = kinds[round % kinds.length];
    const [a, b] = ctx.prioritize(
      ctx.photos.filter((p) => kind.cats.includes(p.category)),
    );
    let chosen = false;
    ctx.prepare(
      kind.ask,
      "Touchez la photo qui vous plaît. Il n’y a pas de bonne réponse.",
      round + 1,
      ctx.rules.rounds,
    );
    const choices = document.createElement("div");
    choices.className = "choices prefer-choices";
    function pick(message, el) {
      if (chosen) return;
      chosen = true;
      el?.classList.add("selected");
      ctx.share(() => {
        round++;
        show();
      }, message);
    }
    for (const p of [a, b]) {
      const el = photoChoice(p, () =>
        pick(`${p.name}. Qu’est-ce qui vous plaît, sur cette photo ?`, el),
      );
      choices.append(el);
    }
    const other = document.createElement("div");
    other.className = "row-actions";
    other.append(
      button(
        "Les deux me plaisent",
        () => pick("Les deux, très bien. Laquelle en premier ?"),
        "quiet",
      ),
      button(
        "Aucune des deux",
        () => pick("D’accord, aucune des deux. Qu’aimeriez-vous voir plutôt ?"),
        "quiet",
      ),
    );
    ctx.body.append(choices, other);
    ctx.setSkip(() => {
      round++;
      show();
    });
    ctx.setHint(
      () =>
        `D’un côté, ${a.name.toLocaleLowerCase("fr")}. De l’autre, ${b.name.toLocaleLowerCase("fr")}.`,
    );
    ctx.setCaregiverTip(
      "Montrez les deux photos, nommez-les, puis attendez. Un regard, un geste ou un refus sont des réponses. Reprenez ses mots et enrichissez-les légèrement, sans corriger.",
    );
  }
  show();
}
