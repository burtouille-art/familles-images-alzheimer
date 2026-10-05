# MémoirePartage

Une PWA gratuite et sans publicité pour partager des activités de stimulation cognitive : dix jeux, de vraies photos, trois profils d'accompagnement et tout le temps nécessaire. Téléphone, tablette ou ordinateur ; aucune inscription, aucun serveur applicatif, aucun service payant, aucune clé API.

**L’application n’est ni un outil diagnostique, ni un test neuropsychologique validé, ni un traitement de la maladie d’Alzheimer. Elle ne garantit aucune amélioration ni aucun ralentissement de la maladie.** Les profils « léger », « modéré » et « avancé » sont des réglages choisis par l’aidant, pas une évaluation médicale. Pour choisir des activités appropriées à une personne, demander conseil à son équipe soignante.

## Mettre en ligne sur GitHub Pages

Le dépôt contient directement `index.html` à la racine. Aucun build ni abonnement n’est nécessaire.

1. Ouvrir [les réglages Pages de ce dépôt](https://github.com/burtouille-art/familles-images-alzheimer/settings/pages) dans le navigateur, avec le compte qui possède le dépôt.
2. Sous **Build and deployment**, choisir **Deploy from a branch**.
3. Choisir la branche **main** et le dossier **/(root)**, puis **Save**.
4. Attendre que GitHub termine le déploiement. La page affiche ensuite le lien du site ; consulter l’onglet Actions en cas de problème.
5. L’adresse attendue après activation est `https://burtouille-art.github.io/familles-images-alzheimer/`.
6. Ouvrir cette adresse une première fois avec une connexion et attendre **« Prêt pour jouer sans connexion sur cet appareil »**.

Ce dépôt est public : GitHub Pages est disponible avec GitHub Free. Les conditions et limites d’hébergement peuvent évoluer. [Documentation officielle de la source de publication](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

Les photos personnelles ajoutées **dans l’application** ne sont jamais envoyées dans le dépôt public. Ne pas déposer de photos privées dans GitHub.

## Installer et jouer hors connexion

- Android/Chrome ou ordinateur compatible : utiliser **Installer l’application** si le bouton apparaît, ou le menu du navigateur → installer / ajouter à l’écran d’accueil.
- iPhone/iPad : ouvrir le site dans Safari → Partager → Sur l’écran d’accueil. La disponibilité de l’installation dépend du navigateur.
- Sans installation, le site fonctionne aussi dans le navigateur. Après la préparation complète du cache, les photos intégrées, les sons et les jeux sont disponibles hors connexion.
- L’installation et la première préparation demandent une connexion. Le HTTPS de GitHub Pages est requis ; `localhost` est également utilisable pour le développement. Un fichier ouvert directement en `file://` n’est pas une installation de la PWA.
- La lecture vocale utilise les voix du navigateur : certaines voix nécessitent une connexion. La consigne écrite et les sons embarqués restent disponibles sans cette lecture vocale.
- Le navigateur peut supprimer les données et le cache (nettoyage, navigation privée, manque d’espace). Exporter une sauvegarde des photos avant de changer d’appareil ou de navigateur.

## Ajouter les vraies photos de la personne

1. Ouvrir **Espace aidant → Ajouter des photos**.
2. Sélectionner des JPG, PNG, WebP ou GIF sur le téléphone ou l’ordinateur (12 Mo maximum par fichier). Les photos HEIC doivent d’abord être exportées en JPG. Les GIF sont conservés comme photo fixe.
3. Pour chaque photo, renseigner un **nom à reconnaître**, une **famille**, et éventuellement un **lieu associé** et un **indice / souvenir**. Exemple : « Le lac de Saint-Point », famille « Lieux », lieu « Au lac de Saint-Point », souvenir « Nous y allions en été ».
4. Pour un proche, utiliser un prénom ou un lien familial effectivement familier à la personne ; aucune reconnaissance automatique des visages n’est effectuée.
5. Choisir **Enregistrer cette photo**. Une photo sans nom enregistré reste dans le panneau mais n’est pas utilisée comme question.
6. Facultatif : associer un son personnel (5 Mo maximum ; MP3 conseillé pour la compatibilité). Il sera proposé dans **À l’écoute**. L’enregistrement par microphone n’est pas nécessaire : importer un fichier déjà présent sur l’appareil.

Les photos enregistrées sont prioritaires pour la reconnaissance, le memory, les lieux (si un lieu est renseigné), les sons (si un son est associé) et le puzzle. Pour garder la diversité, les photos de démonstration complètent les jeux. Les photos sont redimensionnées à 1 280 px maximum et réencodées en JPEG avant d’être conservées en **IndexedDB**, avec leurs sons. Ce réencodage enlève les métadonnées EXIF. Les réglages et les séances sont en **localStorage**. Aucun partage entre appareils n’est automatique.

**Sauvegarder mes photos et réglages** télécharge un JSON privé. **Restaurer une sauvegarde** importe les photos et remplace les réglages et l’historique ; les photos existantes ayant le même identifiant sont mises à jour, les autres sont conservées. Ne partager ce fichier qu’avec les personnes autorisées. La suppression d’une photo dans l’application l’efface de ce navigateur ; une sauvegarde exportée auparavant permet de la retrouver.

### Ajouter une photo de démonstration au code

Placer un JPG dans `assets/photos/`, ajouter ses métadonnées à `games/data.js` et son crédit à `assets/CREDITS.md`. Vérifier son sujet et sa licence. Puis exécuter `python3 scripts/build-cache.py` pour actualiser la liste du cache et sa version. Les images intégrées ne doivent contenir aucune donnée privée. Les photos de famille se chargent dans l’espace aidant, **pas dans GitHub**.

## Les dix activités

| Jeu | Activité | Adaptation |
|---|---|---|
| Photos familières | Choisir le nom, puis la famille d’une photo | 10 / 6 / 3 photos ; 4 / 3 / 2 choix avant adaptation |
| Les photos jumelles | Retrouver des paires de vraies photos | 8 / 4 / 2 paires ; observation préalable au profil avancé ; retournement des erreurs à la demande |
| Un lieu, un souvenir | Associer une photo à un lieu et en parler | 10 / 6 / 3 étapes ; lieux personnels renseignés par l’aidant |
| À chaque photo sa famille | Ranger un objet par catégorie | Toucher une catégorie ou glisser-déposer ; 4 / 3 / 2 choix |
| Les petits gestes | Reproduire l’ordre d’un exemple de petit-déjeuner présenté auparavant | 4 / 3 / 2 étapes. Cet ordre est un exemple, pas une norme : les habitudes peuvent varier |
| À l’écoute | Écouter un enregistrement, puis choisir sa photo | Sons réels de chat, chien, eau et sons personnels ; aucune lecture automatique |
| La petite monnaie | Compter des cartes de pièces de 1 € ou calculer la monnaie à rendre | Avancé : 1 à 3 cartes et choix binaire ; modéré : petits euros entiers ; léger : montants un peu plus élevés |
| La photo à réunir | Échanger les morceaux pour recomposer une photo | 9 / 6 / 2 pièces ; modèle visible ; indice qui replace une pièce ; 6 / 4 / 2 avec davantage d’aide |
| La photo différente | Trouver la photo qui n’appartient pas à une famille donnée | La famille cible est explicitement nommée, notamment quand il n’y a que 2 photos |
| Dans mon panier | Observer, nommer puis retrouver des photos parmi d’autres | 7 / 4 / 3 éléments ; parenthèse libre au profil léger ; une photo à retrouver parmi deux au profil avancé, avec son nom en aide ; revoir la liste à volonté |

Les photographies de monnaie sont réelles. Au stade avancé, **une carte représente une pièce de 1 €** : la photo de stock contient d’autres pièces à l’arrière-plan ; il ne faut pas les compter. Au stade léger/modéré, la photo de pièces illustre le thème ; les montants sont indiqués clairement en texte. Ce jeu ne simule pas les capacités financières réelles et ne mesure pas l’autonomie. Une photographie de billets et pièces est intégrée au profil léger ; les billets ne sont pas manipulés un par un.

## Aides automatiques et accompagnement

Le profil reste inchangé jusqu’à une décision explicite de l’aidant. Deux difficultés ou demandes d’aide augmentent le soutien ; trois réponses correctes sans aide reviennent au soutien initial. **L’application n’augmente jamais les exigences au-delà du profil choisi.** Le soutien diminue le nombre de choix, et allège le nombre de paires, de pièces ou d’éléments au prochain démarrage de ces activités. Les erreurs et les réponses assistées ne sont pas montrées comme un score et ne figurent pas dans l’historique. Seules les séances terminées sont conservées (300 au maximum, les 12 dernières affichées).

- **Léger :** proposer un choix entre activités et laisser la personne agir ; les indices restent accessibles, même à ce niveau. Les distracteurs du même groupe sont prioritaires pour les photos.
- **Modéré :** donner une seule consigne, laisser du temps, nommer ou montrer sans obliger. Ajuster le profil ou la police si cela semble plus confortable.
- **Avancé :** utiliser avec un proche. Montrer deux choix, commenter une photo, écouter un son familier ou guider les échanges. La consigne à l’aidant est affichée et la police passe à 28 px lors du choix de ce profil. Le plaisir de l’échange prime sur la réponse et sur le fait de terminer le jeu.
- **À tous les profils :** partir des goûts de la personne, choisir un moment calme et une courte séance, tenir compte de la vision et de l’audition. Aucun chronomètre, aucune limite pour réessayer. Pause possible à tout moment. Le son de retour et la vibration sont désactivés par défaut. Les sons du jeu d’écoute ne démarrent que sur une action volontaire et peuvent être arrêtés.

## Sources cliniques : des inspirations, pas des reproductions

Les visuels, items, procédures et barèmes propriétaires des tests ne sont pas copiés. Les activités ne sont **pas équivalentes** aux tests ci-dessous. Elles s’inspirent seulement de fonctions cognitives et de principes généraux ; aucun seuil clinique ni mesure de progression de la maladie n’est calculé.

| Jeu | Fonction et rapprochement conceptuel | Limite |
|---|---|---|
| Photos familières | Dénomination visuelle, fonction explorée notamment par le **Boston Naming Test (BNT)** [3] | Photos originales / libres et choix multiples ; aucune administration ni cotation BNT |
| Photos jumelles | Mémoire et reconnaissance visuelles ; domaine général également exploré par le **RCFT / Figure complexe de Rey** [5] | Le memory de paires n’est pas une adaptation ni une version validée de la Figure de Rey |
| Lieu / souvenir | Réminiscence et contexte familier, selon les principes d’accompagnement de la **HAS** [1] | Conversations à partir de photos, sans test d’orientation ni inférence diagnostique |
| Tri par familles | Connaissances sémantiques et catégorisation ; principes généraux de stimulation [1,2] | Ce tri n’est pas un Wisconsin Card Sorting Test ni une mesure de flexibilité mentale |
| Séquence d’une activité | Organisation de gestes du quotidien et maintien des activités, cadre HAS [1] | Exemple de séquence présenté puis reproduit ; pas de test d’apraxie ni d’évaluation de l’autonomie |
| Sons + photo | Reconnaissance de sons familiers et engagement sensoriel, cadre HAS [1] | Aucun test standardisé d’agnosie auditive n’est reproduit |
| Calcul et monnaie | Attention et calcul, fonctions présentes dans le **MMSE** [4] | Les tâches et le barème MMSE ne sont pas repris ; ce n’est pas une évaluation financière |
| Puzzle photo | Organisation visuelle et assemblage ; rapprochement large avec la construction visuelle examinée par le **RCFT** [5] | Assembler une photo n’est pas copier la Figure de Rey ; aucun matériel ni barème RCFT |
| Intrus | Attention et catégorisation, principes généraux de stimulation [1,2] | Aucun test clinique spécifique, score ou norme diagnostique |
| Rappel de liste | Encodage, rappel et indices sémantiques évoquant le **test des 5 mots de Dubois** [6] | Liste de photos personnalisée, reconnaissance et aide libre ; ni items, ni procédure, ni cotation du test des 5 mots |

1. **HAS (2018)**. *Maladie d’Alzheimer et maladies apparentées — fiche 13, prévenir les troubles du comportement*. Adaptation aux préférences, capacités, environnement et sévérité ; aux stades sévères, soutien et stimulation sensorielle sans surstimulation. [PDF HAS](https://www.has-sante.fr/upload/docs/application/pdf/2018-05/fiche_13_prevenir_troubles_comportement.pdf).
2. **NICE, NG97**, recommandation 1.5.5 : proposer la stimulation cognitive **en groupe** pour les démences légères à modérées. [Recommandations](https://www.nice.org.uk/guidance/ng97/chapter/Recommendations). Cette PWA individuelle n’est pas le programme de groupe évalué ; cette recommandation ne valide pas l’application ni son efficacité aux stades avancés.
3. **Boston Naming Test, 2e édition** — documentation de l’éditeur, dénomination sur présentation visuelle. [Pearson](https://www.pearsonclinical.com.au/en-au/en-au/c/Boston-Naming-Test---Second-Edition/p/P100065005), [PAR / BDAE](https://www.parinc.com/products/BDAE).
4. **Folstein MF, Folstein SE, McHugh PR (1975)**. “Mini-mental state”. *Journal of Psychiatric Research*, 12(3), 189–198. [PubMed 1202204](https://pubmed.ncbi.nlm.nih.gov/1202204/).
5. **Rey Complex Figure Test and Recognition Trial (RCFT)** — documentation de l’éditeur sur la mémoire visuelle et l’organisation visuoconstructive. [PAR](https://www.parinc.com/products/RCFT).
6. **Dubois B et al. (2002)**. “The 5 words”: a simple and sensitive test for the diagnosis of Alzheimer’s disease. *Presse Médicale*, 31(36), 1696–1699. [PubMed 12467149](https://pubmed.ncbi.nlm.nih.gov/12467149/).

## Accessibilité et données

- Texte principal et commandes de 24 px minimum, choix de 28 ou 32 px ; boutons de 60 px minimum, généralement 64 px.
- Palette de texte conçue pour un contraste AAA (7:1 pour les combinaisons de texte utilisées). Ceci ne constitue pas une certification complète de conformité WCAG AAA : une revue humaine avec les utilisateurs reste nécessaire.
- Navigation directe accueil → jeu ou accueil → aidant ; pas de menus déroulants imbriqués.
- Clavier et toucher ; glisser-déposer facultatif, avec une alternative au clic pour le tri et le puzzle ; zones de retour `aria-live` et noms accessibles.
- Les boutons du memory n’annoncent pas la photo lorsqu’ils sont retournés ; quand l’aide montre la photo, elle devient accessible également.
- Pas de cookies applicatifs, publicité, analytique, tracking ou service distant dans le code. L’hébergeur reçoit les requêtes nécessaires au chargement du site, comme pour tout site web.
- Le profil d’accompagnement, les photos et les souvenirs sont privés par nature : ils restent dans ce navigateur. L’application ne demande pas de nom de patient, diagnostic, date de naissance ou score clinique.
- Si le stockage des préférences est indisponible, les réglages restent utilisables pendant la visite et un message le signale dans l’espace aidant. Si IndexedDB est indisponible ou plein, l’importation affiche une erreur ; les photos de démonstration restent disponibles.

## Développement

```sh
python3 -m http.server 3000
# ouvrir http://localhost:3000 dans le navigateur
```

Le runtime est uniquement HTML/CSS/JS et les médias embarqués ; les dépendances npm ci-dessous servent **aux tests uniquement**.

```sh
npm install
npm test
python3 scripts/build-cache.py
```

Tests : règles des profils, aides, choix sans doublons, argent, permutation des puzzles, disponibilité des médias, contrastes et parcours des dix jeux pour les trois profils. Après toute modification des médias ou du code, régénérer le cache. Tester également sur téléphone réel, clavier, zoom, avec un aidant et sans connexion ; une simulation DOM ne remplace pas une évaluation d’accessibilité ni une validation clinique.

Structure : `index.html`, `style.css`, `script.js`, `store.js`, `sw.js`, `manifest.webmanifest`, `games/*.js`, `assets/photos/`, `assets/sons/`, `assets/CREDITS.md`, `scripts/`, `tests/`.

## Licences

Code : **MIT**, voir `LICENSE`. Photographies : **licence Pexels**, différente de MIT. Enregistrements : **CC0 1.0**. Voir les liens et crédits de chaque fichier dans `assets/CREDITS.md`. Le logo typographique sert uniquement d’icône d’application ; tous les stimuli photographiques des jeux sont des photos réelles. Aucun emoji ni dessin ne remplace une photo dans les activités.
