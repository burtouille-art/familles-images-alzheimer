import { image, button, shuffle, PRAISE } from "./core.js";
// « Ma famille » : un jeu fait uniquement des photos de la famille : celles
// intégrées à l'application (games/family-data.js) et celles ajoutées sur
// l'appareil dans « Proches ». Quatre moments qui alternent :
// 1. « Voici… » : regarder une photo et en parler (le prénom est donné) ;
// 2. « Son prénom » : retrouver le prénom, avec des indices qui se dévoilent
//    peu à peu (première lettre, début du prénom, deux prénoms au choix, puis
//    le prénom donné). Inspiré de l'apprentissage « sans erreur » et des
//    indices évanescents (Clare et al., 1999, 2000) et de la récupération
//    espacée (Hopper et al., 2005) : on redemande un prénom vu un peu plus tôt, et chaque
//    essai se termine par le bon prénom, dit et écrit. Désactivable par l'aidant.
// 3. « Montrez-moi… » : désigner un proche parmi des photos légendées ;
// 4. « Les doubles » : réunir deux photos identiques, toutes visibles.
const TALK = [
  "Cette photo vous fait-elle sourire ?",
  "Qu’aimez-vous faire ensemble ?",
  "Cela vous rappelle-t-il un bon moment ?",
  "Que diriez-vous de cette photo ?",
  "Quand vous êtes-vous vus la dernière fois ?",
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
// Un libellé qui désigne plusieurs personnes (« Frère et sœur ») n'est pas un
// prénom : il reste dans « Voici… » et « Les doubles », jamais dans les
// moments où l'on cherche une personne.
export const isPerson = (name) => !/\s(et|&)\s/i.test(` ${name} `);
// « Maman », « Papi »… : ce ne sont pas des prénoms, on adapte la phrase.
const KIN = /^(maman|papa|mamie|mamy|mémé|papi|papy|pépé|tonton|tata|tatie)$/i;
// Le début du prénom, lettre par lettre : « M… », « Mar… ».
export function cue(name, level) {
  const letters = [...name];
  if (level <= 0) return "";
  const n =
    level === 1
      ? 1
      : Math.min(letters.length - 1, Math.ceil(letters.length / 2));
  return `${letters.slice(0, Math.max(1, n)).join("")}…`;
}
// Ordre des moments selon le profil. On commence toujours par regarder.
export function familyKinds(stage, names = true, people = 2) {
  if (people < 2) return ["album"];
  const k =
    stage === "avance"
      ? ["album", "name", "pairs"]
      : stage === "leger"
        ? ["album", "name", "point", "name", "pairs"]
        : ["album", "name", "point", "pairs", "album", "name"];
  return names ? k : k.map((x) => (x === "name" ? "point" : x));
}
export default function family(ctx) {
  const photos = ctx.photos.filter(
    (p) => p.personal && p.ready && p.category === "Proches",
  );
  if (!photos.length) return empty(ctx);
  const people = [...new Set(photos.map((p) => p.name))];
  const persons = people.filter(isPerson);
  const ofPerson = (name) => photos.filter((p) => p.name === name);
  const kinds = familyKinds(
    ctx.stage,
    ctx.familyNames !== false,
    persons.length,
  );
  const queue = shuffle(photos);
  let next = 0;
  const take = () => queue[next++ % queue.length];
  // Prénoms vus récemment : on les redemande un peu plus tard.
  const seen = [];
  const named = new Set();
  let round = 0;
  function show() {
    if (round >= ctx.rules.rounds) return ctx.complete();
    const kind = kinds[round % kinds.length];
    if (kind === "name") return nameIt();
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
    if (isPerson(p.name)) seen.push(p.name);
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
  // 2. Retrouver le prénom. Le prénom n'est jamais refusé sèchement : chaque
  // essai se termine par le prénom écrit sous la photo.
  function nameIt() {
    // Un prénom vu tout à l'heure et pas encore retrouvé, sinon un autre.
    const recent = seen.filter((n) => !named.has(n));
    const pool = persons.filter((n) => !named.has(n));
    const name =
      recent[recent.length - 1] ?? shuffle(pool.length ? pool : persons)[0];
    named.add(name);
    // Une autre photo de la même personne quand il y en a une.
    const pics = shuffle(ofPerson(name));
    const p =
      pics.find((x) => x !== queue[(next - 1) % queue.length]) ?? pics[0];
    const kin = KIN.test(name);
    const stage = ctx.stage;
    // Profil avancé : début du prénom et deux prénoms d'emblée.
    let level = stage === "avance" ? 2 : 0;
    let found = false;
    ctx.prepare(
      kin ? "Qui est sur la photo ?" : "Retrouvons son prénom",
      stage === "leger"
        ? "Dites-le à voix haute. Les indices sont là pour aider."
        : "Touchez le bon prénom. Les indices sont là pour aider.",
      round + 1,
      ctx.rules.rounds,
    );
    const layout = document.createElement("div");
    layout.className = "family-layout naming";
    const fig = print(p, "print-large");
    const cap = fig.querySelector("figcaption");
    cap.classList.add("name-cue");
    fig.querySelector("img").alt = "Une photo de famille";
    const side = document.createElement("div");
    side.className = "answer-panel";
    const choices = document.createElement("div");
    choices.className = "choices text-choices name-choices";
    const others = shuffle(persons.filter((n) => n !== name));
    // Des prénoms qui ne commencent pas par la même lettre : l'indice
    // « première lettre » suffit alors à trouver.
    const initial = (n) => n[0].toLocaleLowerCase("fr");
    const far = others.filter((n) => initial(n) !== initial(name));
    const count = stage === "leger" ? 3 : stage === "avance" ? 2 : 3;
    const distractors = [
      ...far,
      ...others.filter((n) => !far.includes(n)),
    ].slice(0, Math.max(1, Math.min(count, ctx.rules.choices) - 1));
    function paintCue() {
      cap.textContent = found ? name : cue(name, level) || "· · ·";
      cap.setAttribute(
        "aria-label",
        found
          ? name
          : level
            ? `Le prénom commence par ${cue(name, level)}`
            : "Prénom à retrouver",
      );
    }
    function reveal(message, help) {
      if (found) return;
      found = true;
      paintCue();
      for (const c of choices.children) {
        c.disabled = true;
        if (c.dataset.correct === "true") c.classList.add("chosen");
      }
      if (help) ctx.accept(advance, message);
      else ctx.success(advance, message);
    }
    function showChoices() {
      if (choices.childElementCount) return;
      for (const n of shuffle([name, ...distractors])) {
        const b = button(n, () => {
          if (found) return;
          if (n === name) {
            reveal(
              kin
                ? `${PRAISE[round % PRAISE.length]} C’est bien ${name}.`
                : `${PRAISE[round % PRAISE.length]} C’est bien ${name}.`,
              level > (stage === "avance" ? 2 : 0),
            );
          } else {
            // Un choix qui ne va pas disparaît (s'il en reste deux ou plus) et
            // l'indice suivant s'affiche tout seul.
            if (choices.querySelectorAll("button:not([hidden])").length > 2)
              b.hidden = true;
            level = Math.min(2, level + 1);
            paintCue();
            ctx.wrong(
              `Ce n’est pas ${n} sur cette photo. Le prénom commence par « ${cue(name, level)} ».`,
            );
          }
        });
        b.dataset.correct = String(n === name);
        choices.append(b);
      }
      more.hidden = true;
    }
    // Profil léger : on cherche d'abord sans propositions.
    const more = button(
      "Voir des prénoms",
      () => {
        ctx.markHelp();
        showChoices();
      },
      "quiet see-names",
    );
    side.append(choices, more);
    if (stage !== "leger") showChoices();
    paintCue();
    layout.append(fig, side);
    ctx.body.append(layout);
    ctx.caregiverAction(
      kin ? "Retrouvé à voix haute" : "Prénom dit à voix haute",
      () =>
        reveal(
          `Oui, c’est ${name}. ${PRAISE[(round + 1) % PRAISE.length]}`,
          false,
        ),
    );
    ctx.caregiverAction("Trouvé avec un peu d’aide", () =>
      reveal(`C’est ${name}. Merci d’avoir cherché ensemble.`, true),
    );
    // Les indices, un à la fois : début du prénom, propositions, puis le
    // prénom lui-même. On n'arrive jamais à une impasse.
    ctx.setHint(() => {
      if (found) return "";
      if (level < 2) {
        level++;
        paintCue();
        return `Le prénom commence par « ${cue(name, level)} ».`;
      }
      if (!choices.childElementCount) {
        showChoices();
        return "Voici quelques prénoms. Lequel va avec la photo ?";
      }
      const visible = [...choices.children].filter(
        (c) => !c.hidden && c.dataset.correct !== "true",
      );
      if (visible.length > 1) {
        visible[0].hidden = true;
        return "Il reste deux prénoms.";
      }
      const right = [...choices.children].find(
        (c) => c.dataset.correct === "true",
      );
      if (right && !right.classList.contains("suggested")) {
        right.classList.add("suggested");
        return `C’est ${name}. Touchez son prénom, ou redisons-le ensemble.`;
      }
      reveal(`C’est ${name}. Redisons-le ensemble : ${name}.`, true);
      return "";
    });
    // Passer : on montre quand même le prénom, puis on continue.
    ctx.setSkip(() => {
      if (!found) {
        found = true;
        paintCue();
        for (const c of choices.children) c.disabled = true;
        ctx.share(
          advance,
          `C’est ${name}. Nous le retrouverons une autre fois.`,
        );
      } else advance();
    });
    ctx.setCaregiverTip(
      "Laissez quelques secondes avant d’aider. Puis une aide à la fois : le lien (« ta petite-fille »), un souvenir commun, la première lettre. Si le prénom ne vient pas, dites-le simplement et redites-le ensemble : finir sur le bon prénom compte plus que le trouver seul.",
    );
  }
  // 3. Montrer un proche, les prénoms étant écrits sous chaque photo.
  function point() {
    const name = persons[round % persons.length] ?? persons[0];
    const target = shuffle(ofPerson(name))[0];
    const others = shuffle(persons.filter((n) => n !== name))
      .slice(0, ctx.rules.choices - 1)
      .map((n) => shuffle(ofPerson(n))[0]);
    seen.push(name);
    let answered = false;
    ctx.prepare(
      `Montrez-\u2060moi ${name}`,
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
            `${PRAISE[round % PRAISE.length]} Voici ${name}.`,
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
  // 4. Les doubles, toujours visibles.
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
    "Pour l’aidant : ajoutez le fichier de photos de famille (par exemple « memoire-partage-photos-famille.json »), ou des photos rangées dans « Proches ». Elles restent uniquement sur cet appareil.";
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
