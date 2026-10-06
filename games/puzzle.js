import { puzzleOrder, button, image } from "./core.js";
export default function puzzle(ctx) {
  const photo = ctx.prioritize(ctx.photos)[0];
  const [rows, cols] = ctx.rules.puzzle;
  const order = puzzleOrder(rows * cols);
  let selected = null;
  let done = false;
  ctx.prepare(
    "La photo à réunir",
    "Touchez une pièce, puis une autre pour les échanger. Vous pouvez aussi faire glisser une pièce.",
  );
  const layout = document.createElement("div");
  layout.className = "puzzle-layout";
  const model = document.createElement("div");
  const original = image(photo, "puzzle-original");
  model.append(original);
  const cap = document.createElement("p");
  cap.className = "photo-caption";
  cap.textContent = photo.name;
  model.append(cap);
  const board = document.createElement("div");
  board.className = "puzzle-board";
  board.style.gridTemplateColumns = `repeat(${cols},1fr)`;
  board.style.gridTemplateRows = `repeat(${rows},1fr)`;
  original.addEventListener("load", () => {
    board.style.aspectRatio = `${original.naturalWidth}/${original.naturalHeight}`;
  });
  layout.append(model, board);
  ctx.body.append(layout);
  function swap(a, b) {
    if (done || a === b) return;
    [order[a], order[b]] = [order[b], order[a]];
    selected = null;
    paint();
    if (order.every((v, i) => v === i)) {
      done = true;
      for (const b of board.children) b.disabled = true;
      ctx.success(() => ctx.complete());
    }
  }
  function paint() {
    board.replaceChildren();
    order.forEach((piece, index) => {
      const b = button(
        "",
        () => {
          if (done) return;
          if (selected === null) {
            selected = index;
            paint();
          } else if (selected === index) {
            selected = null;
            paint();
          } else swap(selected, index);
        },
        "puzzle-piece",
      );
      b.setAttribute(
        "aria-label",
        `Emplacement ${index + 1}, morceau ${piece + 1}${selected === index ? ", sélectionné" : ""}`,
      );
      b.setAttribute("aria-pressed", String(selected === index));
      b.classList.toggle("selected", selected === index);
      b.style.backgroundImage = `url("${photo.src}")`;
      b.style.backgroundSize = `${cols * 100}% ${rows * 100}%`;
      b.style.backgroundPosition = `${cols === 1 ? 0 : ((piece % cols) / (cols - 1)) * 100}% ${rows === 1 ? 0 : (Math.floor(piece / cols) / (rows - 1)) * 100}%`;
      b.draggable = true;
      b.addEventListener("dragstart", (e) =>
        e.dataTransfer.setData("text/plain", String(index)),
      );
      b.addEventListener("dragover", (e) => e.preventDefault());
      b.addEventListener("drop", (e) => {
        e.preventDefault();
        const raw = e.dataTransfer.getData("text/plain");
        if (/^\d+$/.test(raw)) {
          const a = Number(raw);
          if (a >= 0 && a < order.length) swap(a, index);
        }
      });
      board.append(b);
    });
  }
  paint();
  ctx.setCaregiverTip(
    "Le modèle reste visible. Vous pouvez guider la main, ou placer une pièce ensemble avec « Un indice ».",
  );
  ctx.setHint(() => {
    if (!done) {
      const i = order.findIndex((v, i) => v !== i);
      const j = order.indexOf(i);
      swap(i, j);
    }
    return "Une pièce a été replacée ensemble. Le modèle reste visible à côté.";
  });
}
