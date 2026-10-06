import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { decryptFamily, normalizeCode } from "../family-pack.js";
globalThis.atob ??= (s) => Buffer.from(s, "base64").toString("binary");
const b64 = (u8) => Buffer.from(u8).toString("base64");
// Fabrique un petit paquet chiffré, au même format que scripts/encrypt-family.py.
async function makePack(code, photos) {
  const header = new TextEncoder().encode(
    JSON.stringify({
      format: "memoire-partage-famille",
      version: 1,
      photos: photos.map((p) => ({ ...p.meta, size: p.bytes.length })),
    }),
  );
  const size = new Uint8Array(4);
  new DataView(size.buffer).setUint32(0, header.length);
  const payload = new Uint8Array([
    ...size,
    ...header,
    ...photos.flatMap((p) => [...p.bytes]),
  ]);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const base = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(normalizeCode(code)),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: 1000 },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"],
  );
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    payload,
  );
  return { meta: { salt: b64(salt), iv: b64(iv), iterations: 1000 }, cipher };
}
const photo = (id, name, text) => ({
  meta: {
    id,
    name,
    category: "Proches",
    place: "",
    context: "",
    function: "",
    hint: "",
  },
  bytes: new TextEncoder().encode(text),
});
test("Photos de la famille : déchiffrées avec le bon code, refusées sinon", async () => {
  const { meta, cipher } = await makePack("ABCD-EFGH-2345", [
    photo("custom-famille-a", "Delphine", "image-a"),
    photo("custom-famille-b", "Angèle", "image-b"),
  ]);
  // Le code peut être saisi en minuscules, avec ou sans tirets.
  const rows = await decryptFamily(meta, cipher, "abcd efgh 2345");
  assert.equal(rows.length, 2);
  assert.equal(rows[1].name, "Angèle");
  assert.equal(rows[0].category, "Proches");
  assert.equal(rows[0].ready, true);
  assert.equal(await rows[1].blob.text(), "image-b");
  await assert.rejects(
    decryptFamily(meta, cipher, "ABCD-EFGH-2346"),
    /pas le bon/,
  );
  await assert.rejects(decryptFamily(meta, cipher, ""), /Indiquez/);
});
test("Le dépôt ne contient aucune photo de famille en clair", (t) => {
  if (!fs.existsSync(new URL("../prive/meta.json", import.meta.url)))
    return t.skip("aucun paquet chiffré dans le dépôt");
  const meta = JSON.parse(
    fs.readFileSync(new URL("../prive/meta.json", import.meta.url)),
  );
  assert.equal(meta.format, "memoire-partage-famille-chiffre");
  assert.ok(meta.iterations >= 300000);
  assert.ok(!("photos" in meta), "aucun prénom ni nom de fichier visible");
  const bin = fs.readFileSync(new URL("../prive/photos.bin", import.meta.url));
  // Aucune signature JPEG ni prénom lisible dans le fichier chiffré.
  assert.equal(bin.indexOf(Buffer.from("JFIF")), -1);
  assert.equal(bin.indexOf(Buffer.from("Delphine")), -1);
  const sw = fs.readFileSync(new URL("../sw.js", import.meta.url), "utf8");
  assert.ok(
    !sw.includes("prive/"),
    "le fichier chiffré n’est pas mis en cache pour tous",
  );
});
