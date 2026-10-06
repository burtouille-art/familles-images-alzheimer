import { image, button, choiceSet, cueLadder, lower } from "./core.js";
// « Le mot juste » : dénomination d'objets familiers avec aides progressives.
// La réponse peut être dite à voix haute (validée par le proche), montrée du
// doigt ou touchée parmi des propositions. Aucune reconnaissance vocale.
export default function recognition(ctx) {
  const photos = ctx.prioritize(
    ctx.photos.filter((p) => p.personal || p.category !== "Lieux"),
  );
  let round = 0;
  function show() {
    if (round >= ctx.rules.rounds) return ctx.complete();
    const p = photos[round % photos.length];
    const advanced = ctx.stage === "avance";
    const ladder = cueLadder(p, ctx.stage);
    // Avec davantage de soutien, le contexte familier est donné d'emblée.
    let level = ctx.rules.support ? 1 : 0;
    let answered = false;
    ctx.prepare(
      advanced ? "Regardons cette photo" : "Quel est son nom ?",
      advanced
        ? "Touchez son nom, ou dites-le ensemble."
        : "Dites son nom, ou touchez « Voir des propositions ».",
      round + 1,
      ctx.rules.rounds,
    );
    const layout = document.createElement("div");
    layout.className = "photo-question";
    const side = document.createElement("div");
    side.className = "answer-panel";
    const cues = document.createElement("ol");
    cues.className = "cue-list";
    cues.setAttribute("aria-label", "Aides déjà données");
    const choices = document.createElement("div");
    choices.className = "choices text-choices";
    const actions = document.createElement("div");
    actions.className = "stack-actions";
    side.append(cues, choices, actions);
    layout.append(image(p, "big-photo", "Photo à nommer"), side);
    ctx.body.append(layout);

    function paintCues() {
      cues.replaceChildren();
      for (const c of ladder.slice(0, level)) {
        if (c.kind === "choices") continue;
        const li = document.createElement("li");
        li.className = `cue cue-${c.kind}`;
        const b = document.createElement("strong");
        b.textContent = c.label;
        li.append(b, document.createTextNode(c.text));
        cues.append(li);
      }
      cues.hidden = !cues.children.length;
    }
    function done(message) {
      if (answered) return;
      answered = true;
      for (const b of choices.querySelectorAll("button")) b.disabled = true;
      actions.replaceChildren();
      const talk = document.createElement("p");
      talk.className = "talk";
      talk.textContent = p.talk
        ? `Pour en parler : ${p.talk}`
        : p.hint
          ? `Pour en parler : ${p.hint}`
          : "Pour en parler : cette photo vous rappelle-t-elle quelque chose ?";
      side.append(talk);
      ctx.success(() => {
        round++;
        show();
      }, message);
    }
    let choicesShown = 0;
    function showChoices(count) {
      choices.replaceChildren();
      const options = choiceSet(p, ctx.photos, count, "name", {
        close: ctx.rules.close && count > 2,
      });
      for (const item of options) {
        const b = button(item.name, () => {
          if (answered) return;
          if (item.name === p.name) done();
          else {
            b.hidden = true;
            ctx.wrong(nextCue(true) || "Regardons ensemble.");
          }
        });
        b.dataset.correct = String(item.name === p.name);
        choices.append(b);
      }
      choicesShown = count;
    }
    // Passe à l'aide suivante et renvoie son texte.
    function nextCue(fromError = false) {
      if (level >= ladder.length) return ladder.at(-1).text;
      const c = ladder[level++];
      if (c.kind === "choices") {
        if (!choicesShown || choicesShown > 2) showChoices(2);
        paintCues();
        return fromError ? "Regardons ces deux propositions." : c.text;
      }
      if (c.kind === "model") {
        // Le modèle donne la réponse : la personne peut la répéter ou la toucher.
        if (!choicesShown) showChoices(2);
        for (const b of choices.querySelectorAll("button"))
          if (b.dataset.correct === "true") b.classList.add("suggested");
      }
      paintCues();
      return c.text;
    }
    const found = button(
      "Le nom a été dit ou montré",
      () => done("Merci. Le nom a été trouvé ensemble."),
      "quiet",
    );
    found.title =
      "Pour le proche : la personne a dit, montré ou désigné le bon nom.";
    const help = button(
      "Une aide pour trouver",
      () => {
        ctx.markHelp();
        const text = nextCue();
        ctx.say?.(text, false);
      },
      "quiet",
    );
    const propose = button(
      "Voir des propositions",
      () => {
        showChoices(ctx.rules.choices);
        propose.remove();
      },
      "primary",
    );
    if (advanced || ctx.rules.support) {
      showChoices(2);
      actions.append(help, found);
    } else actions.append(propose, help, found);
    paintCues();
    ctx.setHint(() => nextCue());
    ctx.setCaregiverTip(
      advanced
        ? "Montrez la photo, nommez-la calmement, puis laissez la personne toucher ou répéter. Le plaisir de regarder suffit."
        : `Laissez quelques secondes. Si le mot ne vient pas, donnez une aide à la fois. Vous pouvez valider une réponse orale, un geste ou un mot proche (« ${lower(p.name)} »).`,
    );
  }
  show();
}
