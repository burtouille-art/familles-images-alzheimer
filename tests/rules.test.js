import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {
  PROFILES,
  getRules,
  choiceSet,
  adapt,
  puzzleOrder,
  moneyQuestion,
  escapeHTML,
} from "../games/core.js";
import { PHOTOS, GAMES } from "../games/data.js";
import { validatePreferences } from "../store.js";
const root = path.resolve(import.meta.dirname, "..");

test("Trois profils, toujours au moins deux choix et soutien borné", () => {
  for (const [stage, p] of Object.entries(PROFILES)) {
    const base = getRules(stage),
      help = getRules(stage, 1);
    assert.equal(base.choices, p.choices);
    assert.ok(help.choices >= 2);
    assert.ok(help.choices <= base.choices);
    assert.ok(help.pairs >= 2);
    assert.ok(help.recall >= 2);
    assert.ok(
      help.puzzle[0] * help.puzzle[1] <= base.puzzle[0] * base.puzzle[1],
    );
  }
  assert.equal(getRules("inconnu").label, "Modéré");
});
test("Une réponse correcte reste proposée sans doublons malgré les distracteurs proches", () => {
  for (let i = 0; i < 100; i++) {
    const correct = PHOTOS[i % PHOTOS.length],
      choices = choiceSet(correct, [...PHOTOS, ...PHOTOS], 4);
    assert.equal(choices.length, 4);
    assert.ok(choices.some((p) => p.name === correct.name));
    assert.equal(new Set(choices.map((p) => p.name)).size, 4);
    const same = PHOTOS.filter(
      (p) => p.category === correct.category && p.name !== correct.name,
    );
    if (same.length) assert.ok(choices.some((p) => same.includes(p)));
  }
});
test("Les aides augmentent sans jamais changer le stade", () => {
  let s = adapt({}, "difficulty");
  assert.equal(s.support, 0);
  s = adapt(s, "help");
  assert.equal(s.support, 1);
  for (let i = 0; i < 30; i++) s = adapt(s, "help");
  assert.equal(s.support, 1);
  for (let i = 0; i < 3; i++) s = adapt(s, "success");
  assert.equal(s.support, 0);
  assert.ok(!("stage" in s));
});
test("Puzzles mélangés, aucune pièce perdue", () => {
  for (const n of [2, 4, 6, 9])
    for (let i = 0; i < 30; i++) {
      const p = puzzleOrder(n);
      assert.deepEqual(
        [...p].sort((a, b) => a - b),
        Array.from({ length: n }, (_, i) => i),
      );
      assert.ok(p.some((v, i) => v !== i));
    }
});
test("Tous les calculs et choix monétaires sont exacts", () => {
  for (const stage of Object.keys(PROFILES))
    for (let i = 0; i < 15; i++) {
      const q = moneyQuestion(stage, i);
      assert.ok(q.choices.includes(q.answer));
      assert.ok(q.choices.every(Number.isInteger));
      assert.ok(q.choices.every((v) => v > 0));
      assert.equal(q.answer, q.type === "count" ? q.count : q.paid - q.cost);
    }
});
test("Validation de sauvegarde et échappement des noms personnels", () => {
  assert.equal(validatePreferences(null).stage, "modere");
  assert.equal(
    validatePreferences({
      stage: "diagnostic",
      font: 12,
      history: [null, { game: "a", date: Infinity }],
    }).font,
    24,
  );
  assert.equal(
    validatePreferences({ history: [{ game: "recognition", date: 1 }] }).history
      .length,
    1,
  );
  assert.equal(
    escapeHTML('<img onerror="x">'),
    "&lt;img onerror=&quot;x&quot;&gt;",
  );
});
test("Dix jeux et tous les médias intégrés existent", () => {
  assert.equal(GAMES.length, 10);
  for (const g of GAMES) {
    assert.ok(fs.existsSync(path.join(root, "games", g.id + ".js")));
    assert.ok(
      fs.existsSync(path.join(root, "assets/photos", g.cover + ".jpg")),
    );
  }
  for (const p of PHOTOS) {
    assert.ok(fs.existsSync(path.join(root, p.src)));
    if (p.sound) assert.ok(fs.existsSync(path.join(root, p.sound)));
  }
});
function luminance(hex) {
  const c = hex
    .slice(1)
    .match(/../g)
    .map((x) => parseInt(x, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
}
test("Les couleurs de texte atteignent le contraste AAA de 7:1", () => {
  for (const [a, b] of [
    ["#153c34", "#ffffff"],
    ["#153c34", "#f7f5ef"],
    ["#153c34", "#e6eee8"],
    ["#ffffff", "#174f43"],
    ["#153c34", "#fffdf4"],
    ["#174f43", "#ffffff"],
    ["#153c34", "#edf3ee"],
  ]) {
    const l = [luminance(a), luminance(b)].sort((a, b) => b - a);
    assert.ok((l[0] + 0.05) / (l[1] + 0.05) >= 7, `${a} sur ${b}`);
  }
});
test("Cache exhaustif et limité au périmètre GitHub Pages", async () => {
  const events = {};
  let listed = [];
  const cache = {
    addAll: async (a) => {
      listed = a;
    },
    match: async () => null,
  };
  const context = {
    URL,
    console,
    self: {
      location: {
        href: "https://burtouille-art.github.io/familles-images-alzheimer/sw.js",
      },
      addEventListener: (event, fn) => (events[event] = fn),
      skipWaiting: async () => {},
      clients: { claim: async () => {} },
    },
    caches: {
      open: async () => cache,
      keys: async () => [],
      delete: async () => true,
    },
    fetch: async (r) => r,
  };
  vm.runInNewContext(
    fs.readFileSync(path.join(root, "sw.js"), "utf8"),
    context,
  );
  let done;
  events.install({ waitUntil: (p) => (done = p) });
  await done;
  assert.ok(listed.length > 40);
  for (const url of listed) {
    const name = new URL(url).pathname.replace(
      "/familles-images-alzheimer/",
      "",
    );
    if (name) assert.ok(fs.existsSync(path.join(root, name)), name);
  }
  for (const p of PHOTOS)
    assert.ok(listed.some((u) => u.endsWith("/" + p.src)));
  let intercepted = false;
  events.fetch({
    request: {
      method: "GET",
      url: "https://burtouille-art.github.io/another-app/data",
      mode: "cors",
    },
    respondWith() {
      intercepted = true;
    },
  });
  assert.equal(intercepted, false);
});
