import { image, button, shuffle, PRAISE } from "./core.js";
// « Ma famille » : un jeu fait uniquement des photos de la famille : celles
// intégrées à l'application (games/family-data.js) et celles ajoutées sur
// l'appareil dans « Proches ». Trois moments qui alternent, tous sans échec :
// 1. « Voici… » : regarder une photo et en parler ;
// 2. « Montrez-moi… » : désigner un proche parmi des photos légendées
//    (les prénoms restent écrits : on ne demande jamais de les retrouver) ;
// 3. « Les doubles » : réunir deux photos identiques, toutes visibles.
const TALK = [
  "Cette photo vous fait-elle sourire ?",
  "Qu’aimez-vous faire ensemble ?",
  "Cela vous rappelle-t-il un bon moment ?",
  "Que diriez-vous de cette photo ?",
  "Quand vous êtes-vous vus la dernière fois ?",
];
// Une photo « tirage » : entière, sans bandes, avec le prénom écrit dessous.
function print(photo, cls = "") {
  const fig = document.createElement("figure");
  fig.className = `print ${cls}`.trim();
  fig.append(image(photo, "print-photo", photo.name));
  const cap = document.createElement("figcaption");
  cap.textContent = photo.name;
  fig.append(cap);
  return fig;
}
function printChoice(photo, click) {
  const b = button("", click, "choice print-choice");
  b.append(image(photo, "print-photo", ""));
  const cap = document.createElement("span");
  cap.className = "print-name";
  cap.textContent = photo.name;
  b.append(cap);
  return b;
}
export default function family(ctx) {
  const photos = ctx.photos.filter(
    (p) => p.personal && p.ready && p.category === "Proches",
  );
  if (!photos.length) return empty(ctx);
  const people = [...new Set(photos.map((p) => p.name))];
  const ofPerson = (name) => photos.filter((p) => p.name === name);
  // Ordre des moments : on commence toujours par regarder une photo.
  const kinds =
    people.length < 2
      ? ["album"]
      : ctx.stage === "avance"
        ? ["album", "point", "album", "pairs"]
        : ["album", "point", "pairs", "album", "point"];
  const queue = shuffle(photos);
  let next = 0;
  const take = () => queue[next++ % queue.length];
  let round = 0;
  function show() {
    if (round >= ctx.rules.rounds) return ctx.complete();
    const kind = kinds[round % kinds.length];
    if (kind === "point") return point();
    if (kind === "pairs" && photos.length >= 2) return pairs();
    return album();
  }
  function advance() {
    round++;
    show();
  }
  function common(tip) {
    ctx.setSkip(advance);
    ctx.setCaregiverTip(tip);
  }
  // 1. Regarder et parler.
  function album() {
    const p = take();
    ctx.prepare(
      `Voici ${p.name}`,
      "Regardons cette photo ensemble.",
      round + 1,
      ctx.rules.rounds,
    );
    const layout = document.createElement("div");
    layout.className = "family-layout";
    const side = document.createElement("div");
    side.className = "answer-panel";
    const talk = document.createElement("p");
    talk.className = "talk";
    talk.textContent = p.hint || TALK[round % TALK.length];
    const choices = document.createElement("div");
    choices.className = "choices text-choices";
    let done = false;
    for (const label of ["Parlons-en", "Regarder simplement"]) {
      const b = button(label, () => {
        if (done) return;
        done = true;
        b.classList.add("selected");
        ctx.share(
          advance,
          label === "Parlons-en"
            ? "Prenez tout le temps d’en parler."
            : "Merci pour ce moment.",
        );
      });
      choices.append(b);
    }
    side.append(talk, choices);
    layout.append(print(p, "print-large"), side);
    ctx.body.append(layout);
    ctx.caregiverAction("Nous en avons parlé", () => {
      if (done) return;
      done = true;
      ctx.share(advance, "Merci pour cet échange.");
    });
    ctx.setHint(() => TALK[(round + 1) % TALK.length]);
    common(
      "Dites le prénom et le lien (« C’est Delphine, ta nièce »), puis laissez venir. Si un souvenir revient différemment du vôtre, accueillez-le tel quel.",
    );
  }
  // 2. Montrer un proche, les prénoms étant écrits sous chaque photo.
  function point() {
    const name = people[round % people.length] ?? people[0];
    const target = shuffle(ofPerson(name))[0];
    const others = shuffle(people.filter((n) => n !== name))
      .slice(0, ctx.rules.choices - 1)
      .map((n) => shuffle(ofPerson(n))[0]);
    let answered = false;
    ctx.prepare(
      `Montrez-moi ${name}`,
      "Les prénoms sont écrits sous les photos.",
      round + 1,
      ctx.rules.rounds,
    );
    const choices = document.createElement("div");
    choices.className = "choices print-grid";
    for (const p of shuffle([target, ...others])) {
      const b = printChoice(p, () => {
        if (answered) return;
        if (p.name === name) {
          answered = true;
          for (const c of choices.children) c.disabled = true;
          ctx.success(
            advance,
            `${PRAISE[round % PRAISE.length]} Voici ${name}. ${TALK[round % TALK.length]}`,
          );
        } else {
          b.hidden =
            choices.querySelectorAll("button:not([hidden])").length > 2;
          ctx.wrong(`Là, c’est ${p.name}. Cherchons ${name}.`);
        }
      });
      b.dataset.correct = String(p.name === name);
      choices.append(b);
    }
    ctx.body.append(choices);
    ctx.caregiverAction("Montré ensemble", () => {
      if (answered) return;
      answered = true;
      for (const c of choices.children) c.disabled = true;
      ctx.accept(advance, `Voici ${name}. Merci.`);
    });
    ctx.setHint(() => {
      for (const c of choices.children)
        if (c.dataset.correct === "true") c.classList.add("suggested");
      return `${name} est ici.`;
    });
    common(
      "Lisez le prénom à voix haute et montrez la photo si besoin. Montrer ensemble est une très bonne réponse.",
    );
  }
  // 3. Les doubles, toujours visibles.
  function pairs() {
    const count = Math.min(photos.length, Math.max(2, ctx.rules.choices));
    // Une photo par personne : deux photos différentes d'une même personne
    // ne doivent jamais être prises pour « pas pareilles ».
    const one = people.map((n) => shuffle(ofPerson(n))[0]);
    const chosen = shuffle(one).slice(0, Math.min(count, one.length));
    const cards = shuffle(chosen.flatMap((p) => [p, p]));
    let first = null;
    let found = 0;
    ctx.prepare(
      "Les doubles",
      "Touchez les deux photos pareilles.",
      round + 1,
      ctx.rules.rounds,
    );
    const grid = document.createElement("div");
    grid.className = "choices print-grid doubles";
    cards.forEach((p) => {
      const b = printChoice(p, () => {
        if (b.disabled) return;
        if (!first) {
          first = b;
          b.classList.add("selected");
          return;
        }
        if (first === b) {
          b.classList.remove("selected");
          first = null;
          return;
        }
        if (first.dataset.id === b.dataset.id) {
          for (const x of [first, b]) {
            x.classList.remove("selected");
            x.classList.add("found");
            x.disabled = true;
          }
          first = null;
          found++;
          if (found === chosen.length)
            ctx.success(
              advance,
              "Toutes les photos sont réunies. Bravo à vous deux.",
            );
          else ctx.reward();
        } else {
          first.classList.remove("selected");
          first = null;
          ctx.wrong("Ces deux photos ne sont pas pareilles. Regardons encore.");
        }
      });
      b.dataset.id = p.id;
      grid.append(b);
    });
    ctx.body.append(grid);
    ctx.setHint(() => {
      const rest = [...grid.children].filter((b) => !b.disabled);
      const same = rest.filter((b) => b.dataset.id === rest[0]?.dataset.id);
      for (const b of same) b.classList.add("suggested");
      return "Ces deux photos-là sont pareilles.";
    });
    common(
      "Nommez les personnes en cherchant ensemble. Le plaisir de regarder compte plus que de finir.",
    );
  }
  show();
}
// Aucune photo de famille sur cet appareil : on explique comment les ajouter.
function empty(ctx) {
  ctx.prepare(
    "Ma famille",
    "Les photos de la famille ne sont pas encore sur ce téléphone.",
  );
  const box = document.createElement("div");
  box.className = "family-empty";
  const p = document.createElement("p");
  p.textContent =
    "Pour le proche : ajoutez le fichier de photos de famille (par exemple « memoire-partage-photos-famille.json »), ou des photos rangées dans « Proches ». Elles restent uniquement sur cet appareil.";
  const input = document.createElement("input");
  input.type = "file";
  input.id = "family-import";
  input.accept = "application/json,.json";
  input.addEventListener("change", () => {
    if (input.files[0]) ctx.importFile?.(input.files[0]);
  });
  const label = document.createElement("label");
  label.className = "primary upload-label";
  label.htmlFor = "family-import";
  label.textContent = "Ajouter le fichier de photos de famille";
  box.append(p, input, label);
  ctx.body.append(box);
  ctx.setHint(() => "Ce fichier vous a été envoyé avec l’application.");
  ctx.setCaregiverTip(
    "Une fois les photos ajoutées, revenez à cette activité.",
  );
}
