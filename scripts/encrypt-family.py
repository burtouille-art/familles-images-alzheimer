"""Chiffrer un pack de photos de famille pour le publier sans l'exposer.

Usage : python3 scripts/encrypt-family.py pack.json CODE
Produit prive/meta.json et prive/photos.bin. Sans le code, le contenu est
illisible (AES-256-GCM, clé dérivée du code par PBKDF2-SHA256).
Le code n'est jamais écrit dans le dépôt.
"""
import base64, json, os, re, struct, sys
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

ITERATIONS = 600_000
pack_path, code = sys.argv[1], sys.argv[2]
secret = re.sub(r"[^A-Z0-9]", "", code.upper()).encode()
pack = json.load(open(pack_path, encoding="utf-8"))
index, blobs = [], []
for p in pack["photos"]:
    data = base64.b64decode(p["image"].split(",", 1)[1])
    index.append({k: p[k] for k in ("id", "name", "category", "place", "context", "function", "hint")} | {"size": len(data)})
    blobs.append(data)
header = json.dumps({"format": "memoire-partage-famille", "version": 1, "photos": index}, ensure_ascii=False).encode()
payload = struct.pack(">I", len(header)) + header + b"".join(blobs)
salt, iv = os.urandom(16), os.urandom(12)
key = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=ITERATIONS).derive(secret)
cipher = AESGCM(key).encrypt(iv, payload, None)
root = os.path.join(os.path.dirname(__file__), "..", "prive")
os.makedirs(root, exist_ok=True)
open(os.path.join(root, "photos.bin"), "wb").write(cipher)
json.dump({"format": "memoire-partage-famille-chiffre", "version": 1, "kdf": "PBKDF2-SHA256", "iterations": ITERATIONS,
           "salt": base64.b64encode(salt).decode(), "iv": base64.b64encode(iv).decode(), "count": len(index),
           "bytes": len(cipher)}, open(os.path.join(root, "meta.json"), "w"), indent=1)
print(f"{len(index)} photos chiffrées, {len(cipher)//1024} Ko")
