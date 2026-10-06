import { image, button, choiceSet, cueLadder, lower } from "./core.js";
// « Le mot juste » : dénomination d'objets familiers avec aides progressives.
// La réponse peut être dite à voix haute (validée par le proche), montrée du
// doigt ou touchée parmi des propositions. Aucune reconnaissance vocale.
export default function recognition(ctx) {
  const photos = ctx.prioritize(
    // Les photos de proches servent d'abord aux échanges (« Une photo, un
    // souvenir ») : on ne demande pas de retrouver le nom d'un proche.
    ctx.photos.filter(
      (p) => !["Lieux", "Proches", "Nature"].includes(p.category),
    ),
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
    // Une seule aide affichée à la fois ; les précédentes restent consultables.
    const cues = document.createElement("div");
    cues.className = "cue-list";
    const choices = document.createElement("div");
    choices.className = "choices text-choices";
    const actions = document.createElement("div");
    actions.className = "stack-actions";
    side.append(cues, choices, actions);
    layout.append(image(p, "big-photo", "Photo à nommer"), side);
    ctx.body.append(layout);

    function cueBox(c) {
      const box = document.createElement("p");
      box.className = `cue cue-${c.kind}`;
      const b = document.createElement("strong");
      b.textContent = c.label;
      box.append(b, document.createTextNode(c.text));
      return box;
    }
    function paintCues() {
      cues.replaceChildren();
      const given = ladder.slice(0, level).filter((c) => c.kind !== "choices");
      if (given.length) cues.append(cueBox(given.at(-1)));
      if (given.length > 1) {
        const more = document.createElement("details");
        more.className = "cue-history";
        const sum = document.createElement("summary");
        sum.textContent = "Revoir les aides précédentes";
        more.append(sum, ...given.slice(0, -1).map(cueBox));
        cues.append(more);
      }
      cues.hidden = !given.length;
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
      // Jamais le prénom d'un proche parmi les propositions.
      const pool = ctx.photos.filter(
        (x) => !["Proches", "Lieux", "Nature"].includes(x.category),
      );
      const options = choiceSet(p, pool, count, "name", {
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
      actions.append(help);
    } else actions.append(propose, help);
    // Le proche valide une réponse dite, un geste ou un mot approchant.
    ctx.caregiverAction("Le nom a été dit ou montré", () => {
      if (answered) return;
      answered = true;
      for (const b of choices.querySelectorAll("button")) b.disabled = true;
      actions.replaceChildren();
      ctx.accept(() => {
        round++;
        show();
      }, "Merci. Le nom a été trouvé ensemble.");
    });
    ctx.setSkip(() => {
      round++;
      show();
    });
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
