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
  assert.equal(document.querySelectorAll(".game-card").length, 15);
  // Les cartes sont de vrais boutons, rangés dans des éléments de liste.
  for (const c of document.querySelectorAll(".game-card")) {
    assert.equal(c.tagName, "BUTTON");
    assert.equal(c.getAttribute("role"), null);
    assert.equal(c.parentElement.getAttribute("role"), "listitem");
  }

  document.getElementById("caregiver").click();
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(document.getElementById("settings").hidden, false);
  const advanced = [...document.querySelectorAll("#stage-options button")].find(
    (b) => b.textContent.startsWith("Avancé"),
  );
  advanced.click();
  assert.equal(saved().stage, "avance");
  const name = document.getElementById("person-name");
  name.value = "Jeanne";
  name.dispatchEvent(new window.Event("change"));
  assert.equal(saved().name, "Jeanne");
  const contrast = document.getElementById("contrast");
  contrast.checked = true;
  contrast.dispatchEvent(new window.Event("change"));
  assert.ok(document.documentElement.classList.contains("high-contrast"));
  contrast.checked = false;
  contrast.dispatchEvent(new window.Event("change"));
  document.getElementById("close-settings").click();
  assert.match(document.getElementById("greeting").textContent, /Jeanne$/);

  // Le mot juste, profil avancé : deux propositions et des aides progressives.
  // Profil avancé : quatre activités douces d'abord, les autres sur demande.
  const visibleCards = () =>
    [...document.querySelectorAll(".card-cell")].filter((c) => !c.hidden);
  // L'activité mise en avant (« Ma famille ») n'est pas proposée deux fois.
  assert.equal(visibleCards().length, 4);
  assert.ok(
    visibleCards().every((c) => c.dataset.game !== "family"),
    "pas de doublon avec la photo d'accueil",
  );
  assert.match(
    document.getElementById("featured-caption").textContent,
    /^Voici \S/,
  );
  assert.equal(document.getElementById("show-all").hidden, false);
  assert.match(document.getElementById("today").textContent, /^Nous sommes /);
  document.getElementById("show-all").click();
  assert.equal(visibleCards().length, 15);
  document.querySelector('.game-card[data-game="recognition"]').click();
  // Pendant le jeu, pas d'accès direct à l'espace aidant.
  assert.ok(document.body.classList.contains("in-game"));
  assert.equal(document.querySelectorAll("#game-progress span").length, 3);
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

  // Bouton « retour » du téléphone : la pause, jamais la sortie du jeu.
  assert.equal(window.history.state?.app, true);
  window.dispatchEvent(new window.PopStateEvent("popstate", { state: null }));
  assert.equal(document.getElementById("pause-panel").hidden, false);
  assert.equal(document.getElementById("play").hidden, false);
  document.getElementById("pause-resume").click();
  // Une aide à la fois, outils toujours à la même place.
  assert.equal(document.querySelectorAll(".game-tools button").length, 3);

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
  const right = document.querySelector(
    '#game-body button[data-correct="true"]',
  );
  right.click();
  assert.ok(document.getElementById("feedback").textContent.length);
  assert.ok(right.classList.contains("chosen"), "coche sur la bonne réponse");
  document.getElementById("pause").click();
  assert.equal(document.getElementById("pause-finish").hidden, false);
  document.getElementById("pause-finish").click();
  assert.equal(document.getElementById("done").hidden, false);
  assert.equal(saved().history.length, 2);
  assert.deepEqual(Object.keys(saved().history[1]).sort(), ["date", "game"]);
  // Observation facultative du proche, sans valeur médicale.
  [...document.querySelectorAll("#observation-options button")]
    .find((b) => b.textContent === "Moment apprécié")
    .click();
  assert.equal(saved().history[1].note, "Moment apprécié");

  // L'accueil propose d'abord « Ma famille », avec les photos intégrées :
  // rien à installer, et le prénom est toujours donné.
  document.getElementById("done-home").click();
  assert.equal(
    document.getElementById("featured-title").textContent,
    "Ma famille",
  );
  assert.match(
    document.getElementById("featured-photo").getAttribute("src"),
    /^assets\/famille\/f\d\d\.jpg$/,
  );
  document.getElementById("start-photo").click();
  assert.match(document.getElementById("game-title").textContent, /^Voici \S/);
  assert.ok(document.querySelector("#game-body .print img"));
  document.querySelector("#game-body .text-choices button").click();
  assert.match(document.getElementById("feedback").textContent, /temps|merci/i);
  document.getElementById("pause").click();
  document.getElementById("pause-home").click();
  assert.equal(document.getElementById("home").hidden, false);
  assert.equal(saved().history.length, 2);

  // « Dans mon panier » : revoir le panier puis réussir reste une réussite
  // avec aide ; le soutien n'est pas retiré.
  document.getElementById("show-all").click();
  document.querySelector('.game-card[data-game="recall"]').click();
  [...document.querySelectorAll("#game-body button")]
    .find((b) => b.textContent === "Retrouver les photos")
    .click();
  [...document.querySelectorAll("#game-body button")]
    .find((b) => b.textContent === "Revoir le panier")
    .click();
  [...document.querySelectorAll("#game-body button")]
    .find((b) => b.textContent === "Retrouver les photos")
    .click();
  document.querySelector('#game-body button[data-correct="true"]').click();
  assert.equal(saved().adaptation["avance-recall"].streak, 0);

  // « Une consigne à la fois » : le conseil au proche reste après « Commencer ».
  document.getElementById("pause").click();
  document.getElementById("pause-home").click();
  document.getElementById("show-all").click();
  document.querySelector('.game-card[data-game="sequence"]').click();
  const tip = document.getElementById("guide").textContent;
  assert.ok(tip.length > 20);
  [...document.querySelectorAll("#game-body button")]
    .find((b) => b.textContent === "Commencer")
    .click();
  assert.equal(document.getElementById("guide").textContent, tip);
  assert.equal(document.getElementById("guide").hidden, false);
  // « Autre photo » passe à l'étape suivante sans répondre.
  assert.equal(document.getElementById("skip").hidden, false);
  const step = document.getElementById("instruction").textContent;
  document.getElementById("skip").click();
  assert.notEqual(document.getElementById("instruction").textContent, step);

  // Séance préparée : l'accueil ne montre que les activités choisies.
  document.getElementById("pause").click();
  document.getElementById("pause-home").click();
  document.getElementById("caregiver").click();
  await new Promise((resolve) => setTimeout(resolve, 20));
  for (const title of ["Ce qui me plaît", "À l’écoute"])
    [...document.querySelectorAll("#favorite-options button")]
      .find((b) => b.textContent === title)
      .click();
  assert.deepEqual(saved().favorites, ["sounds", "prefer"]);
  // Expressions de la famille.
  const sayings = document.getElementById("sayings");
  sayings.value = "Il n’y a pas le feu | au lac\nligne sans barre";
  sayings.dispatchEvent(new window.Event("change"));
  assert.deepEqual(saved().sayings, [
    { start: "Il n’y a pas le feu", end: "au lac" },
  ]);
  document.getElementById("close-settings").click();
  assert.equal(
    [...document.querySelectorAll(".card-cell")].filter((c) => !c.hidden)
      .length,
    2,
  );
  document.querySelector('.game-card[data-game="expressions"]').click();
  assert.match(
    document.querySelector(".proverb").textContent,
    /^Il n’y a pas le feu…$/,
  );
  [...document.querySelectorAll("#caregiver-actions-list button")]
    .find((b) => b.textContent === "La fin a été dite ensemble")
    .click();
  assert.match(
    document.querySelector(".proverb").textContent,
    /Il n’y a pas le feu au lac\./,
  );
});
