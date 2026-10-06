import { image, button } from "./core.js";
// « Un lieu, un souvenir » : échanger autour d'une photo, sans réponse attendue.
// Toutes les réponses sont accueillies ; rien n'est compté comme une erreur.
// Questions douces pour une photo de proche : aucune ne demande un fait précis.
const RELATIVE_TALK = [
  "Cette photo vous fait-elle sourire ?",
  "Qu’aimez-vous faire ensemble ?",
  "Cela vous rappelle-t-il un bon moment ?",
  "Que diriez-vous de cette photo ?",
];
export default function places(ctx) {
  const photos = ctx.prioritize(
    ctx.photos.filter(
      (p) =>
        // Les photos de proches ont leur activité : « Ma famille ».
        (p.personal &&
          p.category !== "Proches" &&
          (p.place || p.hint || p.category === "Lieux")) ||
        (!p.personal && (p.category === "Lieux" || p.category === "Nature")),
    ),
  );
  let round = 0;
  function show() {
    if (round >= ctx.rules.rounds) return ctx.complete();
    const p = photos[round % photos.length];
    const advanced = ctx.stage === "avance";
    const relative = p.personal && p.category === "Proches";
    // Pour un proche, le nom est donné d'emblée : on ne demande jamais
    // « Qui est-ce ? ». On commente, puis on invite à parler.
    ctx.prepare(
      relative ? `Voici ${p.name}` : "Une photo, un souvenir",
      relative || advanced
        ? "Regardons cette photo ensemble."
        : "Regardez cette photo. Qu’est-ce qu’elle vous évoque ?",
      round + 1,
      ctx.rules.rounds,
    );
    const layout = document.createElement("div");
    // Une photo de proche s'affiche en grand : c'est elle qui compte.
    layout.className = relative ? "photo-question relative" : "photo-question";
    const figure = document.createElement("figure");
    figure.className = "named-photo";
    figure.append(
      image(
        p,
        "big-photo",
        p.personal ? p.name || "Photo personnelle" : p.name,
      ),
    );
    const cap = document.createElement("figcaption");
    cap.textContent = p.personal
      ? [p.name, p.place].filter(Boolean).join(" · ")
      : p.place;
    figure.append(cap);
    if (relative) cap.textContent = p.place ? `${p.name} · ${p.place}` : p.name;
    const side = document.createElement("div");
    side.className = "answer-panel";
    const question = document.createElement("p");
    question.className = "talk";
    question.textContent = relative
      ? RELATIVE_TALK[round % RELATIVE_TALK.length]
      : p.personal
        ? "Qu’est-ce que cette photo vous rappelle ?"
        : p.talk || "Qu’est-ce que cette photo vous évoque ?";
    side.append(question);
    if (p.personal && p.hint) {
      const memo = document.createElement("p");
      memo.className = "guide";
      memo.textContent = `Pour le proche, un souvenir noté : ${p.hint}`;
      side.append(memo);
    }
    const choices = document.createElement("div");
    choices.className = "choices text-choices";
    const options = p.options || [
      relative ? "Parlons-en" : "J’ai envie d’en parler",
      "Regarder simplement",
    ];
    let chosen = false;
    for (const label of options) {
      const b = button(label, () => {
        if (chosen) return;
        chosen = true;
        b.classList.add("selected");
        b.setAttribute("aria-pressed", "true");
        ctx.share(() => {
          round++;
          show();
        }, `${label} : merci de l’avoir partagé. Prenez le temps d’en parler si vous le souhaitez.`);
      });
      choices.append(b);
    }
    side.append(choices);
    ctx.caregiverAction("Nous en avons parlé", () => {
      if (chosen) return;
      chosen = true;
      ctx.share(() => {
        round++;
        show();
      }, "Merci pour cet échange.");
    });
    ctx.setSkip(() => {
      round++;
      show();
    });
    layout.append(figure, side);
    ctx.body.append(layout);
    const prompts = [
      "Cela vous rappelle-t-il un voyage ou une personne ?",
      "Qu’entend-on, que sent-on dans un endroit pareil ?",
      "Quelle saison cette photo vous évoque-t-elle ?",
    ];
    let i = 0;
    ctx.setHint(() => prompts[i++ % prompts.length]);
    ctx.setCaregiverTip(
      "Il n’y a pas de bonne réponse. Accueillez ce qui est dit, même si les détails diffèrent de vos souvenirs. Parlez aussi de vous.",
    );
  }
  show();
}
