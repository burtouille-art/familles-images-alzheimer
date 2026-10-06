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
  cueLadder,
  confusable,
  CATEGORIES,
  CATEGORY_ONE,
} from "../games/core.js";
import {
  PHOTOS,
  GAMES,
  SCENES,
  PAIRS,
  PROVERBS,
  YESNO,
} from "../games/data.js";
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
  // Trois réussites ne suffisent plus à retirer l'aide : il en faut cinq.
  for (let i = 0; i < 3; i++) s = adapt(s, "success");
  assert.equal(s.support, 1);
  for (let i = 0; i < 2; i++) s = adapt(s, "success");
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
test("Quinze jeux et tous les médias intégrés existent", () => {
  assert.equal(GAMES.length, 15);
  assert.ok(PHOTOS.length >= 46);
  assert.equal(new Set(PHOTOS.map((p) => p.id)).size, PHOTOS.length);
  assert.equal(new Set(PHOTOS.map((p) => p.name)).size, PHOTOS.length);
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
    ["#153c34", "#f6f1e7"],
    ["#153c34", "#fffdf8"],
    ["#153c34", "#e4ede6"],
    ["#153c34", "#f3e6d8"],
    ["#7a3519", "#fffdf8"],
    ["#7a3519", "#f6f1e7"],
    ["#7a3519", "#f3e6d8"],
    ["#174f43", "#e4ede6"],
    ["#153c34", "#f1f6f2"],
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

test("Aides progressives : contexte, fonction, catégorie, début du mot, deux choix, modèle", () => {
  const pomme = PHOTOS.find((p) => p.id === "pomme");
  assert.deepEqual(
    cueLadder(pomme, "modere").map((c) => c.kind),
    ["context", "function", "category", "phonology", "choices", "model"],
  );
  // Au profil avancé, pas d'indice phonologique : on passe au choix et au modèle.
  assert.deepEqual(
    cueLadder(pomme, "avance").map((c) => c.kind),
    ["context", "function", "category", "choices", "model"],
  );
  assert.match(cueLadder(pomme, "leger").at(-1).text, /une pomme/);
  // Photo personnelle : le contexte et l'usage notés par l'aidant servent d'aides.
  const perso = {
    personal: true,
    name: "Le moulin à café",
    category: "Objets",
    context: "Sur le buffet",
    function: "Pour moudre le café",
  };
  const ladder = cueLadder(perso, "modere");
  assert.equal(ladder[0].text, "Sur le buffet");
  assert.equal(ladder[1].text, "Pour moudre le café");
  assert.ok(!ladder.some((c) => c.kind === "phonology"));
});
test("Chaque photo intégrée a des traits sémantiques et un indice phonologique bref", () => {
  for (const p of PHOTOS) {
    assert.ok(CATEGORIES.includes(p.category), p.id);
    assert.ok(CATEGORY_ONE[p.category], p.id);
    for (const field of ["context", "function", "talk", "place"])
      assert.ok(p[field] && p[field].length > 5, `${p.id} : ${field}`);
    // Le début du mot : une syllabe orale au plus, suivie de points de suspension.
    assert.match(p.cue, /^[a-zéèêàâôûîç]{1,4}…$/, p.id);
    // « oignon » se prononce « o… », « jean » se prononce « dj… ».
    if (p.id === "oignon") assert.equal(p.cue, "o…");
    if (p.id === "jean") assert.equal(p.cue, "dj…");
    const word = p.name
      .toLocaleLowerCase("fr")
      .replace(/^(une|un|des|du|la|le|l’)\s*/, "")
      .replace(/^tasse.*/, "tasse");
    const start = p.cue.replace("…", "");
    // L'indice reprend l'écriture du mot, sauf « tee-shirt » (« ti… ») et
    // « théière » (« té… »), écrits comme ils se prononcent.
    if (!["chemise", "bouilloire", "oignon", "jean"].includes(p.id))
      assert.ok(word.startsWith(start), `${p.id} : ${start} / ${word}`);
  }
});
test("Aucune proposition ambiguë entre deux noms proches", () => {
  assert.ok(confusable("Une tasse de café", "Une tasse et une théière"));
  assert.ok(!confusable("Une tasse de café", "Une théière"));
  for (let i = 0; i < 200; i++) {
    const correct = PHOTOS[i % PHOTOS.length];
    for (const close of [true, false]) {
      const set = choiceSet(correct, PHOTOS, 4, "name", { close });
      for (const o of set)
        if (o !== correct)
          assert.ok(
            !confusable(o.name, correct.name),
            `${o.name} / ${correct.name}`,
          );
      if (!close)
        assert.ok(
          set.filter((o) => o.category === correct.category).length === 1,
        );
    }
  }
});
test("Consignes courtes : un verbe et un objet, une à la fois", () => {
  for (const scene of SCENES) {
    assert.equal(scene.steps.length, 4);
    for (const step of scene.steps) {
      assert.match(step.say, /^Touchez (le |la |les |l’)[^,;]+\.$/);
      assert.ok(step.say.split(" ").length <= 6);
      assert.ok(PHOTOS.some((p) => p.id === step.photo));
    }
    for (const id of scene.extras) assert.ok(PHOTOS.some((p) => p.id === id));
  }
});
test("Les lieux habituels proposés comme distracteurs ne se recouvrent jamais", () => {
  const zoned = PHOTOS.filter((p) => p.zones);
  for (const p of zoned) {
    const distractors = zoned.filter(
      (x) => !x.zones.some((z) => p.zones.includes(z)),
    );
    assert.ok(distractors.length >= 3, p.id);
    for (const d of distractors) assert.notEqual(d.place, p.place);
  }
});
test("Réglages : anciens réglages acceptés, nouveaux champs bornés", () => {
  const v = validatePreferences({
    stage: "avance",
    voice: "oui",
    variants: { sequence: 2, x: -1, "<b>": 1 },
  });
  assert.equal(v.schema, 2);
  assert.equal(v.voice, false);
  assert.deepEqual(v.variants, { sequence: 2 });
  assert.equal(validatePreferences({}).voice, false);
});

test("Associations : chaque paire et ses distracteurs existent, sans lien ambigu évident", () => {
  const ids = new Set(PHOTOS.map((p) => p.id));
  for (const pair of PAIRS) {
    for (const id of [pair.from, pair.to, ...pair.not])
      assert.ok(ids.has(id), id);
    assert.ok(pair.not.length >= 3);
    assert.ok(!pair.not.includes(pair.to) && !pair.not.includes(pair.from));
    // Une paire réciproque ne doit jamais servir de distracteur.
    for (const other of PAIRS)
      if (other.from === pair.from) continue;
      else if (other.from === pair.to)
        assert.ok(!pair.not.includes(other.to) || other.to !== pair.from);
    assert.match(pair.why, /\.$/);
  }
});
test("Proverbes : une fin unique et des propositions distinctes", () => {
  assert.ok(PROVERBS.length >= 20);
  for (const p of PROVERBS) {
    assert.match(p.start, /…$/);
    assert.equal(new Set([p.end, ...p.others]).size, p.others.length + 1);
    assert.ok(p.others.length >= 3);
  }
});
test("Oui ou non : jamais une famille à la fois dans « oui » et dans « non »", () => {
  for (const q of YESNO) {
    assert.ok(!q.yes.some((c) => q.no.includes(c)), q.ask);
    // Fruits et légumes : frontière ambiguë, jamais opposés.
    if (q.yes.includes("Fruits")) assert.ok(!q.no.includes("Légumes"));
    if (q.yes.includes("Légumes")) assert.ok(!q.no.includes("Fruits"));
    // Les objets contiennent du pain et du café : pas de « non » à « cela se mange ».
    if (/mange/.test(q.ask)) assert.ok(!q.no.includes("Objets"));
  }
});
test("Scènes du quotidien : six scènes, distracteurs sans rapport avec la scène", () => {
  assert.equal(SCENES.length, 6);
  for (const s of SCENES)
    for (const id of s.extras) assert.ok(!s.steps.some((t) => t.photo === id));
});

test("Noms qui se recouvrent : jamais proposés ensemble", () => {
  const jean = PHOTOS.find((p) => p.id === "jean");
  const chaussures = PHOTOS.find((p) => p.id === "chaussures");
  for (let i = 0; i < 100; i++) {
    for (const close of [true, false]) {
      assert.ok(
        !choiceSet(jean, PHOTOS, 4, "name", { close }).some(
          (p) => p.id === "pantalon",
        ),
      );
      const set = choiceSet(chaussures, PHOTOS, 4, "name", { close });
      assert.ok(!set.some((p) => ["bottines", "claquettes"].includes(p.id)));
    }
  }
});
