# MémoirePartage

Une PWA gratuite et sans publicité pour partager des activités autour de la communication, des mots et des souvenirs : quinze activités, dont « Ma famille » pour les photos de proches, 46 vraies photos intégrées, trois profils d'accompagnement et tout le temps nécessaire. Téléphone, tablette ou ordinateur ; aucune inscription, aucun serveur applicatif, aucun service payant, aucune clé API.

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

Les photos personnelles ajoutées **dans l’application** ne sont jamais envoyées dans le dépôt public.

**Exception voulue par la famille :** 54 photos de famille (dossier `assets/famille/`, liste `games/family-data.js`) sont intégrées à l’application pour que « Ma famille » fonctionne dès l’ouverture, sans rien installer sur le téléphone. Elles sont donc **publiques** (dépôt et site), malgré la consigne `noindex` et `robots.txt` qui demandent aux moteurs de recherche de ne pas les indexer. Elles ne sont sous aucune licence libre : aucune réutilisation n’est autorisée. Les noms de fichiers ne contiennent pas les prénoms. Pour les retirer : supprimer le dossier et la liste, reconstruire le cache ; elles resteront toutefois dans l’historique Git.

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

Les champs **« Où la voit-on ? »** et **« À quoi sert-elle, ou qui est-ce ? »** servent d’aides progressives dans « Le mot juste ». Les photos enregistrées sont prioritaires pour la dénomination, les échanges, le memory, les lieux (si un lieu est renseigné), les sons (si un son est associé) et le puzzle. Pour garder la diversité, les photos de démonstration complètent les jeux. Les photos sont redimensionnées à 1 280 px maximum et réencodées en JPEG avant d’être conservées en **IndexedDB**, avec leurs sons. Ce réencodage enlève les métadonnées EXIF. Les réglages et les séances sont en **localStorage**. Aucun partage entre appareils n’est automatique.

**Sauvegarder mes photos et réglages** télécharge un JSON privé (format version 2 ; les sauvegardes version 1 restent acceptées). À la première ouverture de la version 2, une copie des anciens réglages est gardée dans le navigateur sous `memoire-partage-v1-copie-avant-schema-2` ; les photos (IndexedDB) ne changent pas de format. **Restaurer une sauvegarde** importe les photos et remplace les réglages et l’historique ; les photos existantes ayant le même identifiant sont mises à jour, les autres sont conservées. Ne partager ce fichier qu’avec les personnes autorisées. La suppression d’une photo dans l’application l’efface de ce navigateur ; une sauvegarde exportée auparavant permet de la retrouver.

### Ajouter une photo de démonstration au code

Placer un JPG dans `assets/photos/`, ajouter ses métadonnées à `games/data.js` et son crédit à `assets/CREDITS.md`. Vérifier son sujet et sa licence. Puis exécuter `python3 scripts/build-cache.py` pour actualiser la liste du cache et sa version. Les images intégrées ne doivent contenir aucune donnée privée. Les autres photos de famille se chargent dans l’espace aidant, **pas dans GitHub**.

## Les quinze activités

| Jeu | Ce que l’on fait ensemble | Léger / modéré / avancé |
|---|---|---|
| **Ma famille** | Uniquement les photos de la famille : les 54 photos intégrées et celles ajoutées dans « Proches ». Une photo importée avec le même identifiant remplace la version intégrée (pour corriger un prénom). Trois moments qui alternent : « Voici Delphine » (regarder, en parler), « Montrez-moi Delphine » (désigner parmi des photos **légendées** : le prénom est toujours écrit), « Les doubles » (réunir deux photos identiques, toutes visibles). On ne demande jamais « Qui est-ce ? » | 10 / 6 / 3 moments ; 4 / 3 / 2 photos ; photos affichées entières, comme des tirages |
| **Le mot juste** | Nommer un objet familier. Réponse dite à voix haute (validée par le proche), montrée du doigt ou touchée parmi des propositions | 10 / 6 / 3 photos ; propositions à la demande (4 / 3), d’emblée 2 au profil avancé |
| **Ça sert à quoi ?** | Associer une photo nommée à sa famille, son usage ou l’endroit où on la trouve | 4 / 3 / 2 propositions ; toucher ou glisser-déposer |
| **Une consigne à la fois** | Suivre de courtes consignes dans une scène du quotidien (six scènes : petit-déjeuner, sortir, marché, s’habiller pour l’hiver, soupe de légumes, salade de fruits) | 4 / 3 / 2 consignes et autant de photos ; une seule action par consigne |
| **Une photo, un souvenir** | Regarder une photo de lieu ou de souvenir et en parler. **Aucune bonne réponse** : choix de préférence ou « Nous en avons parlé ». Les photos de proches sont dans « Ma famille » | 10 / 6 / 3 photos ; photos personnelles en priorité, souvenir noté affiché pour le proche |
| **À la boulangerie** | Compter des pièces ou rendre la monnaie dans une situation d’achat | Avancé : 1 à 3 pièces et 2 choix ; modéré : petits montants ; léger : montants un peu plus élevés |
| **À l’écoute** | Écouter un son réel, puis toucher sa photo | Aucune lecture automatique ; arrêt possible |
| **Les photos jumelles** | Réunir des paires | 8 / 4 / 2 paires ; profils modéré et avancé : « doubles à vue », photos toujours visibles, les cacher reste un choix |
| **Chacun sa famille** | Trouver la photo d’une famille donnée | Modéré et avancé : consigne positive (« Touchez le fruit ») ; léger : trouver la photo d’une autre famille |
| **Dans mon panier** | Observer, nommer, puis retrouver des photos | 7 / 4 / 3 photos ; une photo parmi deux au profil avancé |
| **Oui ou non ?** | Répondre par oui ou non à une question simple sur une photo nommée (« Est-ce un fruit ? ») ; un signe de tête suffit | 10 / 6 / 3 questions ; toujours deux réponses ; frontières ambiguës (fruit / légume) exclues |
| **Ça va ensemble** | Trouver ce qui va avec une photo (le lapin et les carottes, le bonnet et la montagne) ; 12 associations écrites pour l’application | 4 / 3 / 2 photos ; distracteurs choisis à la main, sans lien plausible |
| **Les expressions de toujours** | Finir un proverbe connu (« Petit à petit, l’oiseau fait son… ») ; 20 proverbes du domaine public. Le langage automatique est souvent bien préservé : c’est un plaisir à partager | 4 / 3 / 2 propositions ; « Écouter le début » ; question de souvenir après chaque proverbe |
| **Ce qui me plaît** | Choisir entre deux photos de même nature ; « les deux » et « aucune » sont des réponses | Aucune bonne réponse ; jamais de choix entre deux proches |
| **La photo à réunir** | Recomposer une photo, modèle visible | 9 / 6 / 2 pièces |

Les identifiants techniques des jeux n’ont pas changé : historique et adaptations des versions précédentes sont conservés.

### La base de photos

46 photos réelles intégrées, toutes hors connexion : 21 de la première série (Pexels), 13 fruits et légumes du jeu de données **Fruits-360** (CC BY-SA 4.0 : poire, prune, fraise, framboise, mûre, melon, poivron, oignon, chou, champignon, concombre, courgette, ail) et 12 vêtements du **Clothing dataset** (CC0 : jean, pantalon, robe, jupe, pull, chemise à carreaux, veste, veste de costume, bonnet, casquette, bottines, claquettes). Chaque photo a un contexte, un usage, une famille, un début de mot et une question d’échange rédigés pour l’application. Crédits détaillés dans `assets/CREDITS.md`.

Les sources de photos libres classiques (Pexels, Wikimedia Commons) n’étaient pas joignables depuis l’environnement de développement ; les deux jeux de données ci-dessus, publiés sur GitHub avec une licence claire, ont été utilisés à la place. Les photos d’objets de la maison (clés, lunettes, horloge, téléphone…) restent à compléter : le plus parlant reste d’ajouter **vos propres photos** dans l’espace aidant.

### Aides progressives pour l’accès au mot

« Le mot juste » propose une aide à la fois, de la plus légère à la plus forte :

1. **Contexte familier** (« On la trouve dans la corbeille de fruits »).
2. **Usage** (« Elle se croque, en dessert ou au goûter »).
3. **Famille** (« C’est un fruit »).
4. **Début du mot**, profils léger et modéré seulement (« Le mot commence par « po… » ») : une syllabe orale, ou le premier son pour un mot d’une syllabe ; « tee-shirt » et « théière » sont écrits comme ils se prononcent (« ti… », « té… »).
5. **Deux propositions** à toucher.
6. **Modèle** : le mot est donné et la bonne proposition mise en évidence, pour le dire ou le toucher ensemble.

Un choix erroné disparaît et l’aide suivante s’affiche : la personne n’est pas laissée face à l’erreur. Pour une photo personnelle, les champs « Où la voit-on ? » et « À quoi sert-elle, ou qui est-ce ? » remplis par l’aidant deviennent les aides 1 et 2. Aucune reconnaissance vocale : c’est le proche qui valide une réponse dite ou montrée (« Le nom a été dit ou montré »), y compris un mot approchant.

Les propositions évitent les libellés ambigus (deux noms partageant un mot important), la frontière fruit / légume et les lieux qui se recouvrent (« dans la cuisine » / « dans la corbeille de fruits »). Les distracteurs de même famille ne sont utilisés qu’au profil léger sans aide supplémentaire.

## Aides automatiques et accompagnement

Le profil reste celui choisi par l’aidant. Deux étapes avec une difficulté ou une aide augmentent le soutien ; trois réussites sans aide le ramènent au niveau initial. Le soutien réduit le nombre de propositions, affiche d’emblée deux choix et le contexte familier, et allège paires, pièces et éléments. **L’application n’augmente jamais les exigences au-delà du profil choisi et ne déduit aucun stade de la maladie.** Les erreurs et aides ne sont ni affichées comme un score ni conservées.

- **Pause** à tout moment (bouton ou touche Échap) : l’activité reste exactement où elle était. Depuis la pause : reprendre, **s’arrêter ici pour aujourd’hui** (la séance compte comme réalisée, sans obligation de finir) ou choisir une autre activité.
- **Conseil au proche** dans chaque jeu (bouton « Proche ») : reformuler, montrer, répondre avec la personne. Affiché d’office au profil avancé ou si l’aidant le demande.
- Retours sobres et adultes (« Oui, c’est bien cela. », « Regardons ensemble. ») ; ni « faux », ni score, ni classement, ni chronomètre. Essais et indices sans limite.
- Écran de fin centré sur le repos (« Revenir à l’accueil ») plutôt que sur l’envie de rejouer.
- Lecture vocale facultative (bouton « Lire », ou lecture automatique dans l’espace aidant) ; la consigne reste toujours écrite.
- Historique : date et activité des séances réalisées, rien d’autre.

## Ce qui est établi et ce qui relève de la conception

**Établi par les sources :**

- La HAS recommande de parler lentement avec des phrases courtes, de laisser le temps de répondre, de soutenir l’attention (face à face, environnement épuré), de valoriser plutôt que corriger, et de former l’entourage à la communication [1, 2].
- La stimulation cognitive (surtout en groupe, démence légère à modérée) apporte un petit bénéfice cognitif et des améliorations de la communication et des interactions sociales ; elle n’est pas évaluée aux stades sévères et ne démontre pas de ralentissement de la maladie [3, 9].
- La réminiscence a des effets faibles et variables, avec un bénéfice probable léger sur la communication [4].
- L’apprentissage sans erreur aide les personnes avec démence à apprendre des tâches quotidiennes [5].
- L’indice phonologique aide davantage aux stades légers qu’aux stades modérés [6].
- La formation des proches à la communication améliore leurs connaissances et leurs façons de communiquer ; les effets sur la personne malade sont plus incertains [7].

**Propositions de conception (non validées cliniquement) :** l’ordre des aides, l’absence d’indice phonologique au profil avancé, les consignes positives, la disparition des choix erronés, les échanges sans bonne réponse, les scènes du quotidien et les seuils d’adaptation. Elles s’inspirent des sources ci-dessus sans en être une application validée. **Cette application n’a fait l’objet d’aucune étude** et ne remplace pas un suivi orthophonique.

Les tests cliniques (BNT, MMSE, 5 mots, Figure de Rey…) ne sont ni reproduits ni approchés : aucun de leurs items, procédures ou barèmes n’est utilisé, et aucun résultat n’est calculé.

### Références

1. **HAS (2018)**. *Parcours de soins des patients présentant un trouble neurocognitif associé à la maladie d’Alzheimer ou à une maladie apparentée — fiche 14 : communiquer malgré les troubles de la mémoire ou du langage*. [PDF](https://www.has-sante.fr/upload/docs/application/pdf/2018-05/fiche_14_communiquer_troubles_memoire_langage.pdf).
2. **HAS (2018)**. *Guide parcours de soins* (orthophonie, stimulation personnalisée, entourage formé aux techniques de communication). [PDF](https://www.has-sante.fr/upload/docs/application/pdf/2018-05/parcours_de_soins_alzheimer.pdf) ; fiche 13 [PDF](https://www.has-sante.fr/upload/docs/application/pdf/2018-05/fiche_13_prevenir_troubles_comportement.pdf).
3. **Woods B et al. (2023)**. *Cognitive stimulation to improve cognitive functioning in people with dementia*. Cochrane, CD005562.pub3 : 37 essais, 2 766 participants. [Résumé Cochrane](https://www.cochrane.org/evidence/CD005562_can-cognitive-stimulation-benefit-people-dementia).
4. **Woods B et al. (2018)**. *Reminiscence therapy for dementia*. Cochrane, CD001120.pub3 : 22 essais. [Résumé Cochrane](https://www.cochrane.org/evidence/CD001120_reminiscence-therapy-dementia).
5. **de Werd MME et al. (2013)**. Errorless learning of everyday tasks in people with dementia. *Clinical Interventions in Aging*, 8, 1177–1190. [Article](https://www.dovepress.com/errorless-learning-of-everyday-tasks-in-people-with-dementia-peer-reviewed-fulltext-article-CIA).
6. **Cerbone B, Massman PJ, Woods SP, York MK (2020)**. Benefit of phonemic cueing on confrontation naming in Alzheimer’s disease. *The Clinical Neuropsychologist*, 34(2). [Notice](https://scholars.uthscsa.edu/en/publications/benefit-of-phonemic-cueing-on-confrontation-naming-in-alzheimers-/).
7. **Folder N et al. (2024)**. Effectiveness and characteristics of communication partner training programs for families of people with dementia. *The Gerontologist*, 64(4), gnad095 : 30 études. [Article](https://academic.oup.com/gerontologist/article/64/4/gnad095/7223749).
8. **Eggenberger E, Heimerl K, Bennett MI (2013)**. Communication skills training in dementia care. *International Psychogeriatrics*. [PubMed 23116547](https://pubmed.ncbi.nlm.nih.gov/23116547/).
9. **NICE NG97**, recommandations 1.4.3 (stimulation cognitive **en groupe**, démence légère à modérée), 1.4.4 (réminiscence en groupe) et 1.4.6 (ne pas proposer d’entraînement cognitif pour traiter une maladie d’Alzheimer légère à modérée), numérotation vérifiée le 6 octobre 2026. [Recommandations](https://www.nice.org.uk/guidance/ng97/chapter/Recommendations).

## Ergonomie (version 3)

Repères pensés pour une personne vivant avec une maladie d’Alzheimer, du stade léger au stade avancé, et pour son proche :

- **Accueil qui oriente** : « Bonjour » ou « Bonsoir » selon l’heure, avec le prénom si l’aidant l’a indiqué, et la date du jour en toutes lettres. Une seule proposition mise en avant (une photo personnelle si possible), puis les activités.
- **Cartes entières cliquables** : toute la carte (photo, titre, phrase) est un seul grand bouton. L’accueil montre la **séance préparée** par l’aidant (deux à six activités choisies dans l’espace aidant). Sans choix, au profil avancé, cinq activités douces d’abord (Une photo, un souvenir ; Ce qui me plaît ; Les expressions de toujours ; Oui ou non ? ; Le mot juste), les autres sur demande.
- **Un écran de jeu toujours construit pareil** : en haut « Arrêter », le nom de l’activité et la progression en points (pas de compteur) ; puis la consigne ; puis la photo et les réponses.
- **Le dock**, fixé en bas de l’écran : le retour sur la réponse, le grand bouton « Continuer tranquillement », puis Indice, Lire et Pause. Ils sont toujours au même endroit et restent visibles sans défiler.
- **Bonne réponse marquée par une coche, une bordure et un texte**, jamais par la couleur seule. Les propositions écartées restent lisibles (contraste conservé).
- **Garde contre les touchers involontaires** : pendant 0,35 s après l’affichage d’une étape, un toucher n’est pas pris en compte, pour éviter qu’un double toucher ou un tremblement réponde à la question suivante.
- **Pendant un jeu, pas d’accès direct à l’espace aidant** ni de pied de page : moins de distractions et pas de sortie par erreur. « Arrêter » ouvre la pause.
- **Conseils au proche placés sous le jeu**, pour que la photo reste la première chose vue.
- **Proposition de pause après 20 minutes**, une seule fois, désactivable. Aucun mécanisme n’incite à continuer.
- **Police Atkinson Hyperlegible** (Braille Institute, licence SIL OFL 1.1), conçue pour distinguer les lettres semblables ; intégrée à l’application et disponible hors connexion. Pas d’italique ni de majuscules continues.
- **Contraste renforcé** (noir sur blanc, bordures épaisses) en option ; espaces insécables devant « ? » et « ! » pour éviter un signe isolé en début de ligne.
- **Espace aidant en cinq sections** numérotées, avec une navigation par onglets : profil, affichage et sons, photos, sauvegarde, conseils.

## Les photos de la famille

Les photos de proches **ne sont jamais publiées** dans ce dépôt public. Elles sont préparées à part (recadrage sur le visage, retrait des bandes, agrandissement fidèle par super-résolution EDSR/FSRCNN, sans retouche générative du visage, éclaircissement doux) et réunies dans un fichier privé à importer sur l’appareil : **Espace aidant → Sauvegarde → Restaurer une sauvegarde**, ou directement depuis l’activité « Ma famille ». Le prénom vient du nom de fichier ; il se modifie dans l’espace aidant. Avec des photos de famille, l’accueil propose d’abord « Ma famille ».

## Version 5 : corrections issues de l’audit du 6 octobre 2026

- **Aide conservée pour toute l’étape** : revoir le panier, demander un indice puis réussir n’est plus compté « sans aide ». Le soutien n’est retiré qu’après **cinq** réussites sans aide d’affilée (au lieu de trois), et l’aidant peut **garder l’aide renforcée en permanence**.
- **Le proche peut accueillir une réponse valable** : « Le nom a été dit ou montré », « La fin a été dite ensemble », « Un autre lien a été expliqué », « Nous en avons parlé ». Ces commandes sont regroupées dans un encadré « Pour le proche », séparé des réponses de la personne ; elles comptent comme une réussite accompagnée, sans retirer le soutien.
- **Conseils au proche conservés** à chaque étape (ils disparaissaient après « Commencer »).
- **« Lire »** lit la consigne, la légende ou le proverbe, puis les réponses proposées.
- **Une seule aide affichée à la fois** dans « Le mot juste » ; les précédentes restent consultables (« Revoir les aides précédentes »).
- **« Autre »** (photo suivante) dans toutes les activités à étapes, pour passer sans répondre.
- **Photos de proches** : jamais à nommer, jamais découpées en puzzle ni utilisées comme cartes de memory ; présentées avec leur prénom dans « Une photo, un souvenir ».
- **Pièce de 1 €** isolée par détourage (la pile de pièces de l’arrière-plan a été retirée) ; dans « À l’écoute », aucun paysage parmi les autres propositions (un bruit d’eau irait avec une plage comme avec un lac).
- « Ça va ensemble » : le bonnet n’est plus un distracteur du chapeau.
- **Expressions de la famille** saisies par l’aidant (« début | fin »), proposées en premier. Correction : il manquait une espace dans la phrase complétée (« fait sonnid »).
- **Séance préparée** sur l’accueil ; **observation facultative** en fin de séance (moment apprécié, fatigue, à reprendre…), jamais de pourcentage.
- Cartes d’accueil : vrais boutons dans des éléments de liste (le rôle « bouton » n’est plus écrasé).
- **Packs de photos** : un fichier de sauvegarde sans réglages s’ajoute aux photos existantes sans rien remplacer.
- Liste des photos personnelles repliable, lisible même avec 50 photos.

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

113 tests automatisés (Node + jsdom) : règles des profils, ordre des aides, indices phonologiques, absence de propositions ambiguës, consignes courtes, lieux sans recouvrement, noms qui se recouvrent (un jean est un pantalon), associations, proverbes, questions oui/non sans ambiguïté, migration des réglages, argent, puzzles, médias, contrastes, cache, et parcours complets des quinze activités dans les trois profils, avec et sans soutien supplémentaire, en vérifiant l’absence de vocabulaire d’échec. Un parcours de l’application assemblée vérifie la migration, la pause, la reprise et l’arrêt anticipé. Après toute modification des médias ou du code, régénérer le cache. Tester également sur téléphone réel, clavier, zoom, avec un aidant et sans connexion ; une simulation DOM ne remplace pas une évaluation d’accessibilité ni une validation clinique.

Vérifié aussi dans Chromium (Playwright), téléphone 320, 360 et 390 px de large et ordinateur 1366 px, polices 24 et 32 px : les quatorze activités terminées dans les trois profils (42 parcours par format d’écran), pause puis reprise identique, absence de débordement horizontal, commandes ≥ 60 × 60 px, texte ≥ 24 px, photos chargées, navigation au clavier et Échap ; import d’une photo et d’un son personnels, priorité dans les jeux, export puis restauration après effacement, sauvegarde version 1 ; mode hors connexion après le premier chargement (82 ressources en cache : photos, sons et police).

**Reste à vérifier :** un essai sur téléphone Android réel (installation, son, lecture vocale), avec TalkBack, et surtout avec des personnes concernées, leurs proches et un·e orthophoniste. La pertinence des photos de démonstration et des formulations doit être relue par un professionnel.

Structure : `index.html`, `style.css`, `script.js`, `store.js`, `sw.js`, `manifest.webmanifest`, `games/*.js`, `assets/photos/`, `assets/sons/`, `assets/CREDITS.md`, `scripts/`, `tests/`.

## Licences

Code : **MIT**, voir `LICENSE`. Photographies : **licence Pexels** (première série), **CC BY-SA 4.0** (Fruits-360) et **CC0** (Clothing dataset), différentes de MIT. Enregistrements : **CC0 1.0**. Photos de famille (`assets/famille/`) : **tous droits réservés**, aucune réutilisation. Voir les liens et crédits de chaque fichier dans `assets/CREDITS.md`. La police Atkinson Hyperlegible est distribuée sous licence SIL OFL 1.1 (`assets/fonts/OFL.txt`). Le logo typographique sert uniquement d’icône d’application ; tous les stimuli photographiques des jeux sont des photos réelles. Aucun emoji ni dessin ne remplace une photo dans les activités.
