import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { PHOTOS } from "../games/data.js";
import { getRules } from "../games/core.js";
import recognition from "../games/recognition.js";
import memory from "../games/memory.js";
import places from "../games/places.js";
import sorting from "../games/sorting.js";
import sequence from "../games/sequence.js";
import sounds from "../games/sounds.js";
import money from "../games/money.js";
import puzzle from "../games/puzzle.js";
import odd from "../games/odd.js";
import recall from "../games/recall.js";
const functions = {
  recognition,
  memory,
  places,
  sorting,
  sequence,
  sounds,
  money,
  puzzle,
  odd,
  recall,
};
function create(stage) {
  const dom = new JSDOM(
    '<main><h1></h1><p id="instruction"></p><div id="body"></div></main>',
    { url: "https://example.org/app/" },
  );
  globalThis.document = dom.window.document;
  const ctx = {
    stage,
    photos: PHOTOS,
    rules: getRules(stage),
    body: document.getElementById("body"),
    completed: false,
    next: null,
    hint: null,
    successes: 0,
    difficulties: 0,
    prioritize: (items) => [...items],
    prepare(title, instruction) {
      document.querySelector("h1").textContent = title;
      document.getElementById("instruction").textContent = instruction;
      ctx.body.replaceChildren();
      ctx.next = null;
    },
    setHint(fn) {
      ctx.hint = fn;
    },
    markHelp() {},
    reward() {},
    clearFeedback() {},
    setNext(fn) {
      ctx.next = fn;
    },
    success(fn) {
      ctx.successes++;
      ctx.next = fn;
    },
    wrong() {
      ctx.difficulties++;
    },
    playAudio() {},
    stopAudio() {},
    complete() {
      ctx.completed = true;
    },
  };
  return ctx;
}
const clickByText = (ctx, text) => {
  const b = [...ctx.body.querySelectorAll("button")].find(
    (b) => b.textContent === text,
  );
  assert.ok(b, `Bouton manquant : ${text}`);
  b.click();
};
const next = (ctx) => {
  assert.equal(typeof ctx.next, "function");
  const fn = ctx.next;
  ctx.next = null;
  fn();
};
function questionPhoto(ctx) {
  return PHOTOS.find(
    (p) => ctx.body.querySelector(".big-photo").getAttribute("src") === p.src,
  );
}

for (const stage of ["leger", "modere", "avance"])
  for (const [name, run] of Object.entries(functions)) {
    test(`${name} — profil ${stage} : une séance entière est réalisable`, () => {
      const ctx = create(stage);
      run(ctx);
      assert.ok(ctx.body.children.length);
      assert.equal(typeof ctx.hint, "function");
      if (name === "recognition") {
        for (let i = 0; i < ctx.rules.rounds; i++) {
          const p = questionPhoto(ctx);
          if (i === 0) {
            const wrong = [...ctx.body.querySelectorAll("button")].find(
              (b) => b.textContent !== p.name,
            );
            wrong.click();
            assert.equal(ctx.difficulties, 1);
          }
          clickByText(ctx, p.name);
          next(ctx);
          clickByText(ctx, p.category);
          next(ctx);
        }
      }
      if (name === "places") {
        for (let i = 0; i < ctx.rules.rounds; i++) {
          const p = questionPhoto(ctx);
          clickByText(ctx, p.place);
          next(ctx);
        }
      }
      if (name === "sorting") {
        for (let i = 0; i < ctx.rules.rounds; i++) {
          const p = questionPhoto(ctx);
          clickByText(ctx, p.category);
          next(ctx);
        }
      }
      if (name === "odd") {
        for (let i = 0; i < ctx.rules.rounds; i++) {
          const category = document
            .getElementById("instruction")
            .textContent.match(/« (.+) »/)[1];
          const b = [...ctx.body.querySelectorAll(".choice")].find(
            (b) =>
              PHOTOS.find(
                (p) => p.src === b.querySelector("img").getAttribute("src"),
              ).category !== category,
          );
          b.click();
          next(ctx);
        }
      }
      if (name === "sounds") {
        for (let i = 0; i < ctx.rules.rounds; i++) {
          const target = PHOTOS.filter((p) => p.sound)[i % 3];
          const b = [...ctx.body.querySelectorAll(".choice")].find(
            (b) => b.querySelector("span").textContent === target.name,
          );
          assert.ok(b);
          b.click();
          next(ctx);
        }
      }
      if (name === "money") {
        for (let i = 0; i < ctx.rules.rounds; i++) {
          const hint = ctx.hint();
          const answer = hint.match(/(?:fait |rend )(.+)\.$/)[1];
          clickByText(ctx, answer);
          next(ctx);
        }
      }
      if (name === "puzzle") {
        let guard = 0;
        while (!ctx.next && guard++ < 20) ctx.hint();
        assert.ok(guard < 20);
        next(ctx);
      }
      if (name === "sequence") {
        const labels = [
          ...ctx.body.querySelectorAll(".sequence-list>.choice"),
        ].map((e) => e.textContent.replace(/^Étape \d+/, ""));
        clickByText(ctx, "À vous, retrouver cet ordre");
        for (const s of labels) clickByText(ctx, s);
        next(ctx);
      }
      if (name === "recall") {
        const labels = [...ctx.body.querySelectorAll("figcaption")].map(
          (e) => e.textContent.split(" · ")[0],
        );
        clickByText(ctx, "Je suis prêt à les retrouver");
        if (stage === "leger") clickByText(ctx, "Retrouver mon panier");
        for (const label of labels) {
          if (stage === "avance")
            assert.equal(ctx.body.querySelectorAll(".choice").length, 2);
          const b = [...ctx.body.querySelectorAll(".choice")].find(
            (b) => b.querySelector("span").textContent === label,
          );
          b.click();
          if (stage === "avance") next(ctx);
        }
        if (stage !== "avance") next(ctx);
      }
      if (name === "memory") {
        ctx.hint();
        const pairs = new Map();
        [...ctx.body.querySelectorAll(".memory-card")].forEach((b, i) => {
          const src = b.querySelector("img").getAttribute("src");
          if (!pairs.has(src)) pairs.set(src, []);
          pairs.get(src).push(i);
        });
        clickByText(ctx, "Masquer les photos");
        assert.ok(
          [...ctx.body.querySelectorAll(".memory-card")].every(
            (b) => !b.querySelector("img"),
          ),
        );
        for (const indices of pairs.values()) {
          ctx.body.querySelectorAll(".memory-card")[indices[0]].click();
          ctx.body.querySelectorAll(".memory-card")[indices[1]].click();
          next(ctx);
        }
      }
      assert.equal(ctx.completed, true);
      assert.ok(ctx.successes >= 1);
    });
  }
test("Une photo personnelle est prioritaire pour reconnaissance, lieu, son et puzzle", () => {
  for (const name of ["recognition", "places", "sounds", "puzzle"]) {
    const ctx = create("avance");
    const p = {
      id: "custom-test",
      name: "Notre lac",
      category: "Lieux",
      place: "Chez nous",
      hint: "Le lac où nous allions",
      src: "blob:https://example.org/123",
      sound: "blob:https://example.org/456",
      personal: true,
      ready: true,
    };
    ctx.photos = [p, ...PHOTOS];
    functions[name](ctx);
    assert.ok(ctx.body.querySelector('img[src="' + p.src + '"]'));
  }
});
