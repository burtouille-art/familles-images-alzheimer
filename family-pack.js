// Photos de la famille publiées chiffrées (dossier prive/). Sans le code de
// la famille, le fichier est illisible ; avec lui, les photos sont
// déchiffrées dans le navigateur puis rangées sur l'appareil (IndexedDB).
// Le code n'est jamais envoyé : il reste dans le navigateur.
const ROOT = "prive/";
const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
export const normalizeCode = (code) =>
  String(code || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
export async function decryptFamily(meta, cipher, code) {
  const secret = new TextEncoder().encode(normalizeCode(code));
  if (!secret.length) throw new Error("Indiquez le code de la famille.");
  const base = await crypto.subtle.importKey("raw", secret, "PBKDF2", false, [
    "deriveKey",
  ]);
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: b64(meta.salt),
      iterations: meta.iterations,
    },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
  let plain;
  try {
    plain = new Uint8Array(
      await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: b64(meta.iv) },
        key,
        cipher,
      ),
    );
  } catch {
    throw new Error("Ce code n’est pas le bon. Vérifiez-le et réessayez.");
  }
  const size = new DataView(plain.buffer).getUint32(0);
  const header = JSON.parse(new TextDecoder().decode(plain.slice(4, 4 + size)));
  let offset = 4 + size;
  return header.photos.map((p) => {
    const blob = new Blob([plain.slice(offset, offset + p.size)], {
      type: "image/jpeg",
    });
    offset += p.size;
    return {
      id: p.id,
      name: p.name,
      category: p.category,
      place: p.place || "",
      context: p.context || "",
      function: p.function || "",
      hint: p.hint || "",
      ready: true,
      blob,
      audio: null,
    };
  });
}
export async function fetchFamily(code, fetcher = fetch) {
  let meta, cipher;
  try {
    meta = await (
      await fetcher(`${ROOT}meta.json`, { cache: "no-store" })
    ).json();
    cipher = await (
      await fetcher(`${ROOT}photos.bin`, { cache: "no-store" })
    ).arrayBuffer();
  } catch {
    throw new Error(
      "Les photos de la famille n’ont pas pu être téléchargées. Vérifiez la connexion et réessayez.",
    );
  }
  return decryptFamily(meta, cipher, code);
}
