import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { PHOTOS, SCENES } from "../games/data.js";
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
function create(stage, support = 0) {
  const dom = new JSDOM(
    '<main><h1></h1><p id="instruction"></p><div id="body"></div></main>',
    { url: "https://example.org/app/" },
  );
  globalThis.document = dom.window.document;
  const ctx = {
    stage,
    photos: PHOTOS,
    rules: getRules(stage, support),
    body: document.getElementById("body"),
    completed: false,
    next: null,
    hint: null,
    tip: "",
    successes: 0,
    shares: 0,
    difficulties: 0,
    messages: [],
    prioritize: (items) => [...items],
    variant: (_, n) => (ctx._variant = ((ctx._variant ?? -1) + 1) % n),
    say() {},
    prepare(title, instruction) {
      document.querySelector("h1").textContent = title;
      document.getElementById("instruction").textContent = instruction;
      ctx.body.replaceChildren();
      ctx.next = null;
    },
    setHint(fn) {
      ctx.hint = fn;
    },
    setCaregiverTip(text) {
      ctx.tip = text;
    },
    markHelp() {},
    reward() {},
    clearFeedback() {},
    setNext(fn) {
      ctx.next = fn;
    },
    success(fn, message) {
      ctx.successes++;
      if (message) ctx.messages.push(message);
      ctx.next = fn;
    },
    share(fn, message) {
      ctx.shares++;
      ctx.messages.push(message);
      ctx.next = fn;
    },
    wrong(message) {
      ctx.difficulties++;
      if (message) ctx.messages.push(message);
    },
    playAudio() {},
    stopAudio() {},
    complete() {
      ctx.completed = true;
    },
  };
  return ctx;
}
const buttons = (ctx) => [...ctx.body.querySelectorAll("button")];
const visible = (ctx) => buttons(ctx).filter((b) => !b.hidden && !b.disabled);
const clickByText = (ctx, text) => {
  const b = buttons(ctx).find((b) => b.textContent === text);
  assert.ok(b, `Bouton manquant : ${text}`);
  b.click();
};
const next = (ctx) => {
  assert.equal(typeof ctx.next, "function");
  const fn = ctx.next;
  ctx.next = null;
  fn();
};
const correctButton = (ctx) =>
  ctx.body.querySelector('button[data-correct="true"]:not([hidden])');
const photoOf = (b) =>
  PHOTOS.find((p) => p.src === b.querySelector("img").getAttribute("src"));
// Aucun texte de jeu ne doit être une note, un échec ou une sanction.
const FORBIDDEN = /faux|erreur|raté|échec|perdu|mauvais|score|points?\b/i;

const solvers = {
  recognition(ctx, stage) {
    for (let i = 0; i < ctx.rules.rounds; i++) {
      if (i === 0 && stage !== "avance") {
        // Aides progressives : contexte, fonction, catégorie, début du mot…
        const first = ctx.hint();
        assert.ok(first.length > 5);
      }
      if (i === 1) {
        // Une réponse orale ou montrée peut être validée par le proche.
        clickByText(ctx, "Le nom a été dit ou montré");
        next(ctx);
        continue;
      }
      const propose = buttons(ctx).find(
        (b) => b.textContent === "Voir des propositions",
      );
      if (propose) propose.click();
      if (i === 0) {
        const wrong = visible(ctx).find((b) => b.dataset.correct === "false");
        wrong.click();
        assert.equal(ctx.difficulties, 1);
        assert.ok(wrong.hidden, "le mauvais choix disparaît");
      }
      if (stage === "avance")
        assert.ok(
          visible(ctx).filter((b) => b.dataset.correct).length <= 2,
          "deux propositions au plus",
        );
      correctButton(ctx).click();
      next(ctx);
    }
  },
  places(ctx) {
    for (let i = 0; i < ctx.rules.rounds; i++) {
      // Toute réponse est accueillie : on choisit la première.
      const choice = ctx.body.querySelector(".text-choices button");
      choice.click();
      next(ctx);
    }
    assert.equal(ctx.difficulties, 0);
    assert.equal(ctx.successes, 0);
  },
  sorting(ctx, stage) {
    for (let i = 0; i < ctx.rules.rounds; i++) {
      assert.equal(
        ctx.body.querySelectorAll(".text-choices button").length,
        ctx.rules.choices,
      );
      if (i === 0) {
        const wrong = visible(ctx).find((b) => b.dataset.correct === "false");
        wrong.click();
      }
      correctButton(ctx).click();
      next(ctx);
    }
  },
  odd(ctx) {
    for (let i = 0; i < ctx.rules.rounds; i++) {
      assert.equal(
        ctx.body.querySelectorAll(".choice").length,
        ctx.rules.choices,
      );
      correctButton(ctx).click();
      next(ctx);
    }
  },
  sounds(ctx) {
    for (let i = 0; i < ctx.rules.rounds; i++) {
      const target = PHOTOS.filter((p) => p.sound)[i % 3];
      const b = [...ctx.body.querySelectorAll(".choice")].find(
        (b) => b.querySelector("span").textContent === target.name,
      );
      assert.ok(b);
      b.click();
      next(ctx);
    }
  },
  money(ctx) {
    for (let i = 0; i < ctx.rules.rounds; i++) {
      const hint = ctx.hint();
      const answer = hint.match(/(?:fait |rend )(.+)\.$/)[1];
      clickByText(ctx, answer);
      next(ctx);
    }
  },
  puzzle(ctx) {
    let guard = 0;
    while (!ctx.next && guard++ < 20) ctx.hint();
    assert.ok(guard < 20);
    next(ctx);
  },
  sequence(ctx) {
    clickByText(ctx, "Commencer");
    for (let i = 0; i < ctx.rules.steps; i++) {
      const instruction = document.getElementById("instruction").textContent;
      assert.ok(
        instruction.split(" ").length <= 6,
        `Consigne courte : ${instruction}`,
      );
      assert.equal(
        ctx.body.querySelectorAll(".choice").length,
        ctx.rules.choices,
      );
      const step = SCENES.flatMap((s) => s.steps).find(
        (s) => s.say === instruction,
      );
      const b = [...ctx.body.querySelectorAll(".choice")].find(
        (b) => photoOf(b).id === step.photo,
      );
      b.click();
      next(ctx);
    }
  },
  recall(ctx, stage) {
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
  },
  memory(ctx) {
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
  },
};

for (const stage of ["leger", "modere", "avance"])
  for (const support of [0, 1])
    for (const [name, run] of Object.entries(functions)) {
      test(`${name} — profil ${stage}${support ? ", avec davantage d’aide" : ""} : une séance entière est réalisable`, () => {
        const ctx = create(stage, support);
        run(ctx);
        assert.ok(ctx.body.children.length);
        assert.equal(typeof ctx.hint, "function");
        assert.ok(ctx.tip.length > 20, "un conseil est proposé au proche");
        solvers[name](ctx, stage);
        assert.equal(ctx.completed, true);
        assert.ok(ctx.successes + ctx.shares >= 1);
        for (const m of ctx.messages) assert.doesNotMatch(m, FORBIDDEN, m);
      });
    }
test("Une photo personnelle est prioritaire pour reconnaissance, lieu, son et puzzle", () => {
  for (const name of ["recognition", "places", "sounds", "puzzle", "sorting"]) {
    const ctx = create("avance");
    const p = {
      id: "custom-test",
      name: "Notre lac",
      category: name === "sorting" ? "Objets" : "Lieux",
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
