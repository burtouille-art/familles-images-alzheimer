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
test("Application assemblée : accueil, aidant, profil avancé, jeu et pause", async () => {
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
  await import("../script.js");
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(document.querySelectorAll(".game-card").length, 10);
  document.getElementById("caregiver").click();
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(document.getElementById("settings").hidden, false);
  const advanced = [...document.querySelectorAll("#stage-options button")].find(
    (b) => b.textContent.startsWith("Avancé"),
  );
  advanced.click();
  assert.equal(
    document.documentElement.style.getPropertyValue("--font-size-base"),
    "28px",
  );
  assert.equal(
    JSON.parse(localStorage.getItem("memoire-partage-v1")).stage,
    "avance",
  );
  document.getElementById("close-settings").click();
  document.getElementById("start-photo").click();
  assert.equal(document.getElementById("play").hidden, false);
  assert.equal(document.querySelectorAll("#game-body .choice").length, 2);
  assert.equal(document.getElementById("guide").hidden, false);
  document.getElementById("hint").click();
  assert.ok(document.getElementById("feedback").textContent.length);
  document.getElementById("pause").click();
  assert.equal(document.getElementById("home").hidden, false);
  assert.equal(
    JSON.parse(localStorage.getItem("memoire-partage-v1")).history.length,
    0,
  );
});
