import { shuffle, photoChoice, CATEGORY_ONE, PRAISE } from "./core.js";
// « Chacun sa famille ».
// Profils modéré et avancé : consigne positive (« Touchez le fruit »), plus
// simple à comprendre qu'une négation. Profil léger : trouver la photo qui
// n'appartient pas à la famille nommée, parmi des photos de cette famille.
export default function odd(ctx) {
  let round = 0;
  const categories = shuffle(["Fruits", "Légumes", "Animaux", "Vêtements"]);
  const pick = (cat) =>
    ctx.prioritize(ctx.photos.filter((p) => p.category === cat));
  function show() {
    if (round >= ctx.rules.rounds) return ctx.complete();
    const category = categories[round % categories.length];
    const one = CATEGORY_ONE[category];
    // Fruits et légumes ne sont pas opposés (la tomate est un fruit pour le
    // botaniste, un légume en cuisine) : on évite cette frontière ambiguë.
    const sibling = { Fruits: "Légumes", Légumes: "Fruits" }[category];
    const others = shuffle(
      ctx.photos.filter(
        (p) =>
          categories.includes(p.category) &&
          p.category !== category &&
          p.category !== sibling,
      ),
    );
    const positive = ctx.stage !== "leger" || ctx.rules.choices < 3;
    const count = ctx.rules.choices;
    let target, options, instruction;
    if (positive) {
      target = pick(category)[0];
      // Les autres photos viennent de familles différentes entre elles.
      const seen = new Set();
      const distractors = others.filter((p) =>
        seen.has(p.category) ? false : seen.add(p.category),
      );
      options = shuffle([target, ...distractors.slice(0, count - 1)]);
      instruction = `Touchez ${one.the}.`;
    } else {
      target = others[0];
      options = shuffle([...pick(category).slice(0, count - 1), target]);
      instruction = `Toutes ces photos sauf une sont dans la famille « ${category} ». Laquelle vient d’une autre famille ?`;
    }
    let answered = false;
    ctx.prepare("Chacun sa famille", instruction, round + 1, ctx.rules.rounds);
    const choices = document.createElement("div");
    choices.className = "choices";
    for (const p of options) {
      const b = photoChoice(p, () => {
        if (answered) return;
        if (p.id === target.id) {
          answered = true;
          for (const c of choices.children) c.disabled = true;
          ctx.success(
            () => {
              round++;
              show();
            },
            `${PRAISE[round % PRAISE.length]} ${target.name} : ${CATEGORY_ONE[target.category].a}.`,
          );
        } else
          ctx.wrong(
            positive
              ? `${p.name}, c’est ${CATEGORY_ONE[p.category].a}. Cherchons ${one.a}.`
              : `${p.name} est bien dans la famille « ${category} ». Regardons les autres.`,
          );
      });
      b.dataset.correct = String(p.id === target.id);
      choices.append(b);
    }
    ctx.body.append(choices);
    let hints = 0;
    ctx.setSkip(() => {
      round++;
      show();
    });
    ctx.setHint(() => {
      hints++;
      if (hints === 1)
        return positive
          ? `Cherchons ${one.a}. ${target.context || ""}`.trim()
          : `${target.name} appartient à la famille « ${target.category} ».`;
      for (const b of choices.children)
        if (b.dataset.correct === "true") b.classList.add("suggested");
      return `C’est ${target.name.toLocaleLowerCase("fr")}.`;
    });
    ctx.setCaregiverTip(
      "Nommez les photos ensemble si besoin. Une réponse montrée du doigt compte autant qu’un toucher.",
    );
  }
  show();
}
