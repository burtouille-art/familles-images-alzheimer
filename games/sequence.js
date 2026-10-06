import { SCENES, PHOTOS } from "./data.js";
import { shuffle, button, image, PRAISE } from "./core.js";
// « Une consigne à la fois » : compréhension de consignes courtes dans une
// scène du quotidien. Une seule action et un seul objet par consigne ; la
// consigne suivante n'apparaît qu'après la précédente.
const byId = (id) => PHOTOS.find((p) => p.id === id);
export default function sequence(ctx) {
  // La scène change d'une séance à l'autre pour varier les photos.
  const scene = SCENES[ctx.variant?.("sequence", SCENES.length) ?? 0];
  const steps = scene.steps.slice(0, ctx.rules.steps);
  let index = 0;
  function intro() {
    ctx.prepare(
      scene.title,
      `${scene.intro} Je vous donnerai une consigne à la fois.`,
    );
    const row = document.createElement("div");
    row.className = "photo-row";
    for (const s of steps) {
      const f = document.createElement("figure"),
        cap = document.createElement("figcaption");
      const p = byId(s.photo);
      cap.textContent = p.name;
      f.append(image(p, ""), cap);
      row.append(f);
    }
    ctx.body.append(row, button("Commencer", show, "primary"));
    ctx.setHint(() => "Regardons les photos ensemble, puis commençons.");
    ctx.setCaregiverTip(
      "Lisez chaque consigne lentement, une seule fois, puis laissez le temps. Vous pouvez la répéter avec les mêmes mots ou montrer l’objet.",
    );
  }
  function show() {
    if (index >= steps.length) return ctx.complete();
    const step = steps[index];
    const target = byId(step.photo);
    let answered = false;
    ctx.prepare(scene.title, step.say, index + 1, steps.length);
    const pool = [...scene.steps.map((s) => s.photo), ...scene.extras].filter(
      (id) => id !== step.photo,
    );
    const options = shuffle([
      target,
      ...shuffle(pool)
        .slice(0, ctx.rules.choices - 1)
        .map(byId),
    ]);
    const choices = document.createElement("div");
    choices.className = "choices";
    for (const p of options) {
      const b = button("", () => {
        if (answered) return;
        if (p.id === target.id) {
          answered = true;
          for (const c of choices.children) c.disabled = true;
          ctx.success(
            () => {
              index++;
              show();
            },
            `${PRAISE[index % PRAISE.length]} ${step.after}`,
          );
        } else {
          ctx.wrong(`Écoutons à nouveau : ${step.say}`);
        }
      });
      b.append(image(p, ""));
      const label = document.createElement("span");
      label.textContent = p.name;
      b.append(label);
      choices.append(b);
    }
    const repeat = document.createElement("p");
    repeat.className = "instruction-repeat";
    repeat.textContent = step.say;
    ctx.body.append(repeat, choices);
    let hints = 0;
    ctx.setHint(() => {
      hints++;
      if (hints === 1) return `${step.say} ${target.context || ""}`.trim();
      const wrong = [...choices.children].filter(
        (b) =>
          !b.disabled &&
          !b.hidden &&
          b !== choices.children[options.indexOf(target)],
      );
      if (wrong.length > 1) {
        wrong[0].hidden = true;
        return "Une photo en moins. Prenons notre temps.";
      }
      choices.children[options.indexOf(target)].classList.add("suggested");
      return `C’est ${target.name.toLocaleLowerCase("fr")}, ici.`;
    });
  }
  intro();
}
