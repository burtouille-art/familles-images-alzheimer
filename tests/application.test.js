import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { JSDOM } from "jsdom";
import { indexedDB } from "fake-indexeddb";
import { putPhoto, listPhotos, deletePhoto, putManyPhotos } from "../store.js";

test("Photos privées : sauvegarde, lecture, restauration et suppression dans IndexedDB", async () => {
  globalThis.indexedDB = indexedDB;
  const p = {
    id: "custom-storage-test",
    name: "Notre lac",
    category: "Lieux",
    place: "Chez nous",
    hint: "En été",
    ready: true,
    blob: new Blob(["photo"], { type: "image/jpeg" }),
    audio: new Blob(["son"], { type: "audio/mpeg" }),
  };
  await putPhoto(p);
  let photos = await listPhotos();
  assert.equal(photos[0].name, "Notre lac");
  assert.equal(await photos[0].blob.text(), "photo");
  assert.equal(await photos[0].audio.text(), "son");
  await putManyPhotos([{ ...p, name: "Le lac", audio: null }]);
  photos = await listPhotos();
  assert.equal(photos.length, 1);
  assert.equal(photos[0].name, "Le lac");
  assert.equal(photos[0].audio, null);
  await deletePhoto(p.id);
  assert.equal((await listPhotos()).length, 0);
});
test("Application assemblée : migration, aidant, profil avancé, pause, reprise et arrêt", async () => {
  const dom = new JSDOM(
    fs.readFileSync(new URL("../index.html", import.meta.url), "utf8"),
    { url: "https://example.org/familles-images-alzheimer/" },
  );
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  Object.defineProperty(globalThis, "navigator", {
    value: dom.window.navigator,
    configurable: true,
  });
  globalThis.localStorage = dom.window.localStorage;
  globalThis.location = dom.window.location;
  globalThis.indexedDB = indexedDB;
  window.scrollTo = () => {};
  // Réglages enregistrés par la version 1 : ils doivent être conservés.
  const old = JSON.stringify({
    stage: "leger",
    font: 32,
    sound: false,
    vibration: false,
    guidance: true,
    adaptation: {
      "leger-recognition": { support: 1, streak: 0, difficulties: 0 },
    },
    history: [{ game: "memory", date: 1700000000000 }],
  });
  localStorage.setItem("memoire-partage-v1", old);
  await import("../script.js");
  await new Promise((resolve) => setTimeout(resolve, 20));
  const saved = () => JSON.parse(localStorage.getItem("memoire-partage-v1"));
  assert.equal(
    localStorage.getItem("memoire-partage-v1-copie-avant-schema-2"),
    old,
  );
  assert.equal(saved().schema, 2);
  assert.equal(saved().stage, "leger");
  assert.equal(saved().font, 32);
  assert.equal(saved().history.length, 1);
  assert.equal(saved().adaptation["leger-recognition"].support, 1);
  assert.equal(document.querySelectorAll(".game-card").length, 10);

  document.getElementById("caregiver").click();
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(document.getElementById("settings").hidden, false);
  const advanced = [...document.querySelectorAll("#stage-options button")].find(
    (b) => b.textContent.startsWith("Avancé"),
  );
  advanced.click();
  assert.equal(saved().stage, "avance");
  document.getElementById("close-settings").click();

  // Le mot juste, profil avancé : deux propositions et des aides progressives.
  [...document.querySelectorAll(".game-card button")]
    .find((b) => b.getAttribute("aria-label") === "Jouer à Le mot juste")
    .click();
  assert.equal(document.getElementById("play").hidden, false);
  assert.equal(
    document.querySelectorAll("#game-body .text-choices button").length,
    2,
  );
  assert.equal(document.getElementById("guide").hidden, false);
  assert.ok(document.getElementById("guide").textContent.length > 20);
  document.getElementById("hint").click();
  const firstHint = document.getElementById("feedback").textContent;
  document.getElementById("hint").click();
  assert.notEqual(document.getElementById("feedback").textContent, firstHint);
  assert.ok(document.querySelectorAll(".cue").length >= 2);

  // Pause puis reprise : la même étape est retrouvée.
  const before = document.getElementById("game-body").innerHTML;
  document.getElementById("pause").click();
  assert.equal(document.getElementById("pause-panel").hidden, false);
  assert.equal(document.getElementById("play-content").hidden, true);
  assert.equal(document.getElementById("pause-finish").hidden, true);
  document.getElementById("pause-resume").click();
  assert.equal(document.getElementById("play-content").hidden, false);
  assert.equal(document.getElementById("game-body").innerHTML, before);

  // Une bonne réponse, puis arrêt anticipé : la séance est comptée, sans score.
  document.querySelector('#game-body button[data-correct="true"]').click();
  assert.ok(document.getElementById("feedback").textContent.length);
  document.getElementById("pause").click();
  assert.equal(document.getElementById("pause-finish").hidden, false);
  document.getElementById("pause-finish").click();
  assert.equal(document.getElementById("done").hidden, false);
  assert.equal(saved().history.length, 2);
  assert.deepEqual(Object.keys(saved().history[1]).sort(), ["date", "game"]);

  // L'accueil propose d'abord un échange autour d'une photo, sans réponse attendue.
  document.getElementById("done-home").click();
  document.getElementById("start-photo").click();
  assert.equal(
    document.getElementById("game-title").textContent,
    "Un lieu, un souvenir",
  );
  document.querySelector("#game-body .text-choices button").click();
  assert.match(document.getElementById("feedback").textContent, /merci/i);
  document.getElementById("pause").click();
  document.getElementById("pause-home").click();
  assert.equal(document.getElementById("home").hidden, false);
  assert.equal(saved().history.length, 2);
});
