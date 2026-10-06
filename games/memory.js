import { shuffle, button, image } from "./core.js";
export default function memory(ctx) {
  const photos = ctx.prioritize(ctx.photos).slice(0, ctx.rules.pairs);
  const cards = shuffle(photos.flatMap((p) => [{ photo: p }, { photo: p }]));
  let open = [],
    matched = 0,
    locked = false;
  let peek = false;
  ctx.prepare(
    "Les photos jumelles",
    "Touchez deux cartes pour retrouver les mêmes photos. Aucun besoin de se dépêcher.",
  );
  const grid = document.createElement("div");
  grid.className = "memory-grid";
  const actions = document.createElement("div");
  actions.className = "row-actions";
  ctx.body.append(grid, actions);
  function paint(index) {
    const c = cards[index],
      b = grid.children[index];
    b.replaceChildren();
    if (c.matched || open.includes(index) || peek) {
      b.append(image(c.photo, "", c.photo.name));
      b.setAttribute(
        "aria-label",
        `${c.photo.name}${c.matched ? ", paire retrouvée" : ""}`,
      );
    } else {
      b.textContent = `Carte ${index + 1}`;
      b.setAttribute("aria-label", `Retourner la carte ${index + 1}`);
    }
    b.classList.toggle("matched", Boolean(c.matched));
    b.disabled = Boolean(c.matched);
  }
  function flip(i) {
    if (locked || cards[i].matched || open.includes(i)) return;
    open.push(i);
    paint(i);
    if (open.length === 2) {
      locked = true;
      const [a, b] = open;
      if (cards[a].photo.id === cards[b].photo.id) {
        cards[a].matched = cards[b].matched = true;
        matched++;
        ctx.success(() => {
          if (matched === photos.length) ctx.complete();
          else {
            open = [];
            locked = false;
            actions.replaceChildren();
            ctx.clearFeedback();
            ctx.setNext(null);
          }
        });
        paint(a);
        paint(b);
      } else {
        ctx.wrong("Vous pouvez retourner les cartes et regarder à nouveau.");
        actions.replaceChildren(
          button(
            "Retourner ces deux cartes",
            () => {
              const old = [...open];
              open = [];
              locked = false;
              old.forEach(paint);
              actions.replaceChildren();
              ctx.clearFeedback();
            },
            "quiet",
          ),
        );
      }
    }
  }
  cards.forEach((_, i) =>
    grid.append(button(`Carte ${i + 1}`, () => flip(i), "memory-card")),
  );
  if (ctx.stage === "avance") {
    peek = true;
    cards.forEach((_, i) => paint(i));
    actions.append(
      button(
        "Masquer les photos quand vous êtes prêt",
        () => {
          peek = false;
          cards.forEach((_, i) => paint(i));
          actions.replaceChildren();
        },
        "primary",
      ),
    );
    locked = true;
    const starter = actions.lastElementChild;
    starter.addEventListener("click", () => {
      locked = false;
    });
  }
  ctx.setCaregiverTip(
    "Nommez les photos quand elles apparaissent. Vous pouvez montrer les cartes à nouveau autant de fois que nécessaire.",
  );
  ctx.setHint(() => {
    peek = true;
    cards.forEach((_, i) => paint(i));
    actions.replaceChildren(
      button(
        "Masquer les photos",
        () => {
          peek = false;
          cards.forEach((_, i) => paint(i));
          actions.replaceChildren();
          if (locked && open.length === 2 && !cards[open[0]].matched) {
            actions.append(
              button(
                "Retourner ces deux cartes",
                () => {
                  open = [];
                  locked = false;
                  cards.forEach((_, i) => paint(i));
                  actions.replaceChildren();
                },
                "quiet",
              ),
            );
          } else if (open.length === 0) locked = false;
        },
        "quiet",
      ),
    );
    return "Regardons les emplacements ensemble. Vous choisissez quand masquer les photos.";
  });
}
