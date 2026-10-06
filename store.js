// Préférences et séances en localStorage. Photos et sons privés en IndexedDB.
// La clé reste « v1 » pour conserver les réglages existants ; le champ
// « schema » indique la version du contenu. Avant toute évolution, une copie
// de sécurité des anciens réglages est gardée sous BACKUP_KEY.
const KEY = "memoire-partage-v1";
export const SCHEMA = 2;
export const BACKUP_KEY = "memoire-partage-v1-copie-avant-schema-2";
export const defaults = {
  schema: SCHEMA,
  stage: "modere",
  font: 24,
  sound: false,
  vibration: false,
  guidance: false,
  voice: false,
  contrast: false,
  rest: true,
  name: "",
  variants: {},
  adaptation: {},
  history: [],
};
let memory = { ...defaults, variants: {}, adaptation: {}, history: [] };
let dbPromise;
export let persistent = true;
export function loadPreferences() {
  try {
    const text = localStorage.getItem(KEY);
    const raw = JSON.parse(text || "{}");
    if (text && raw.schema !== SCHEMA && !localStorage.getItem(BACKUP_KEY))
      localStorage.setItem(BACKUP_KEY, text);
    memory = validatePreferences(raw);
    if (text && raw.schema !== SCHEMA) savePreferences(memory);
  } catch {
    persistent = false;
  }
  return memory;
}
export function validatePreferences(raw = {}) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) raw = {};
  return {
    schema: SCHEMA,
    stage: ["leger", "modere", "avance"].includes(raw.stage)
      ? raw.stage
      : "modere",
    font: [24, 28, 32].includes(raw.font) ? raw.font : 24,
    sound: raw.sound === true,
    vibration: raw.vibration === true,
    guidance: raw.guidance === true,
    voice: raw.voice === true,
    contrast: raw.contrast === true,
    rest: raw.rest !== false,
    name:
      typeof raw.name === "string"
        ? raw.name.replace(/[<>]/g, "").trim().slice(0, 40)
        : "",
    variants:
      raw.variants &&
      typeof raw.variants === "object" &&
      !Array.isArray(raw.variants)
        ? Object.fromEntries(
            Object.entries(raw.variants).filter(
              ([k, v]) =>
                /^[a-z]{1,20}$/.test(k) &&
                Number.isInteger(v) &&
                v >= 0 &&
                v < 50,
            ),
          )
        : {},
    adaptation:
      raw.adaptation &&
      typeof raw.adaptation === "object" &&
      !Array.isArray(raw.adaptation)
        ? Object.fromEntries(
            Object.entries(raw.adaptation)
              .filter(
                ([k, v]) =>
                  /^(leger|modere|avance)-(recognition|memory|places|sorting|sequence|sounds|money|puzzle|odd|recall)$/.test(
                    k,
                  ) &&
                  v &&
                  typeof v === "object",
              )
              .map(([k, v]) => [
                k,
                {
                  support: v.support === 1 ? 1 : 0,
                  streak: Math.min(2, Math.max(0, Number(v.streak) || 0)),
                  difficulties: Math.min(
                    1,
                    Math.max(0, Number(v.difficulties) || 0),
                  ),
                },
              ]),
          )
        : {},
    history: Array.isArray(raw.history)
      ? raw.history
          .filter(
            (x) => x && typeof x.game === "string" && Number.isFinite(x.date),
          )
          .slice(-300)
      : [],
  };
}
export function savePreferences(prefs) {
  memory = prefs;
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
    persistent = true;
    return true;
  } catch {
    persistent = false;
    return false;
  }
}
export function database() {
  if (!dbPromise)
    dbPromise = new Promise((resolve, reject) => {
      if (!globalThis.indexedDB) {
        reject(
          new Error(
            "Le stockage des photos n’est pas disponible dans ce navigateur.",
          ),
        );
        return;
      }
      const r = indexedDB.open("memoire-partage-photos", 1);
      r.onupgradeneeded = () =>
        r.result.createObjectStore("photos", { keyPath: "id" });
      r.onsuccess = () => resolve(r.result);
      r.onerror = () =>
        reject(new Error("Impossible d’ouvrir le stockage des photos."));
      r.onblocked = () =>
        reject(
          new Error(
            "Fermez les autres onglets de l’application puis réessayez.",
          ),
        );
    });
  return dbPromise;
}
async function operation(mode, action) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("photos", mode),
      s = tx.objectStore("photos");
    let result;
    const req = action(s);
    req.onsuccess = () => {
      result = req.result;
    };
    tx.oncomplete = () => resolve(result);
    tx.onerror = () =>
      reject(
        new Error(
          "La sauvegarde a échoué. Vérifiez l’espace disponible sur l’appareil.",
        ),
      );
    tx.onabort = () => reject(new Error("La sauvegarde a été interrompue."));
  });
}
export const listPhotos = () => operation("readonly", (s) => s.getAll());
export const putPhoto = (photo) => operation("readwrite", (s) => s.put(photo));
export const deletePhoto = (id) => operation("readwrite", (s) => s.delete(id));
export async function putManyPhotos(photos) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("photos", "readwrite");
    for (const p of photos) tx.objectStore("photos").put(p);
    tx.oncomplete = resolve;
    tx.onerror = () =>
      reject(
        new Error(
          "La restauration a échoué ; les fichiers n’ont pas été ajoutés.",
        ),
      );
    tx.onabort = () => reject(new Error("La restauration a été interrompue."));
  });
}
export async function preparePhoto(file) {
  if (
    !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)
  )
    throw new Error(
      "Choisissez une photo JPG, PNG, WebP ou GIF. Pour une photo HEIC, exportez-la d’abord en JPG.",
    );
  if (file.size > 12 * 1024 * 1024)
    throw new Error(
      "Cette photo dépasse 12 Mo. Choisissez une copie plus petite.",
    );
  const url = URL.createObjectURL(file);
  try {
    const im = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Cette photo ne peut pas être lue."));
      i.src = url;
    });
    const scale = Math.min(
      1,
      1280 / Math.max(im.naturalWidth, im.naturalHeight),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(im.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(im.naturalHeight * scale));
    const c = canvas.getContext("2d");
    c.fillStyle = "#fff";
    c.fillRect(0, 0, canvas.width, canvas.height);
    c.drawImage(im, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.86));
    if (!blob) throw new Error("Impossible de préparer cette photo.");
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}
export function toDataURL(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}
export function dataURLToBlob(s, kind) {
  if (typeof s !== "string" || s.length > 15 * 1024 * 1024)
    throw new Error("Un fichier de la sauvegarde est trop volumineux.");
  const match = s.match(
    /^data:(image\/(jpeg|png|webp)|audio\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=\r\n]+)$/,
  );
  if (!match || !match[1].startsWith(kind + "/"))
    throw new Error("Le format de la sauvegarde est incorrect.");
  const data = atob(match[3]);
  const a = Uint8Array.from(data, (c) => c.charCodeAt(0));
  return new Blob([a], { type: match[1] });
}
