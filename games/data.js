// Photos de démonstration, embarquées : aucune requête vers une banque d'images.
const entries = [
  ["pomme", "Une pomme", "Fruits", "La cuisine"],
  ["banane", "Des bananes", "Fruits", "La cuisine"],
  ["orange", "Une orange", "Fruits", "La cuisine"],
  ["carotte", "Des carottes", "Légumes", "Le potager"],
  ["brocoli", "Un brocoli", "Légumes", "Le potager"],
  ["tomate", "Une tomate", "Légumes", "Le potager"],
  ["chat", "Un chat", "Animaux", "La maison"],
  ["chien", "Un chien", "Animaux", "La maison"],
  ["lapin", "Un lapin", "Animaux", "Le jardin"],
  ["lac", "Un lac", "Lieux", "Au bord du lac"],
  ["montagne", "La montagne", "Lieux", "À la montagne"],
  ["plage", "Une plage", "Lieux", "À la plage"],
  ["maison", "Une maison", "Lieux", "Devant une maison"],
  ["jardin", "Des feuilles", "Objets", "Dans le jardin"],
  ["chemise", "Un polo", "Vêtements", "Dans la maison"],
  ["chaussures", "Des chaussures", "Vêtements", "Dans la maison"],
  ["chapeau", "Un chapeau", "Vêtements", "À la plage"],
  ["pain", "Du pain", "Objets", "La cuisine"],
  ["cafe", "Une tasse de café", "Objets", "Dans un café"],
  ["bouilloire", "Une bouilloire et une tasse", "Objets", "Dans la cuisine"],
  ["brosse", "Une brosse à dents", "Objets", "La salle de bain"],
];
export const PHOTOS = entries.map(([id, name, category, place]) => ({
  id,
  name,
  category,
  place,
  src: `assets/photos/${id}.jpg`,
  personal: false,
  hint: "",
  sound:
    id === "chat"
      ? "assets/sons/chat.mp3"
      : id === "chien"
        ? "assets/sons/chien.mp3"
        : id === "lac"
          ? "assets/sons/eau.mp3"
          : null,
}));
export const GAMES = [
  {
    id: "recognition",
    title: "Photos familières",
    domain: "Reconnaissance & langage",
    description: "Retrouver le nom et la famille d’un objet.",
    cover: "pomme",
  },
  {
    id: "memory",
    title: "Les photos jumelles",
    domain: "Mémoire visuelle",
    description: "Retourner les cartes et réunir les paires.",
    cover: "chat",
  },
  {
    id: "places",
    title: "Un lieu, un souvenir",
    domain: "Lieux & souvenirs",
    description: "Reconnaître un lieu et en parler ensemble.",
    cover: "lac",
  },
  {
    id: "sorting",
    title: "À chaque photo sa famille",
    domain: "Catégories & attention",
    description: "Ranger les photos dans leur famille.",
    cover: "carotte",
  },
  {
    id: "sequence",
    title: "Les petits gestes",
    domain: "Ordre & quotidien",
    description: "Retrouver les étapes d’une activité.",
    cover: "pain",
  },
  {
    id: "sounds",
    title: "À l’écoute",
    domain: "Sons & reconnaissance",
    description: "Écouter un son et retrouver sa photo.",
    cover: "chien",
  },
  {
    id: "money",
    title: "La petite monnaie",
    domain: "Calcul du quotidien",
    description: "Compter des pièces et rendre la monnaie.",
    cover: "pieces",
  },
  {
    id: "puzzle",
    title: "La photo à réunir",
    domain: "Assemblage visuel",
    description: "Recomposer une photo, pièce après pièce.",
    cover: "maison",
  },
  {
    id: "odd",
    title: "La photo différente",
    domain: "Attention & catégories",
    description: "Repérer la photo d’une autre famille.",
    cover: "brocoli",
  },
  {
    id: "recall",
    title: "Dans mon panier",
    domain: "Mémoire & rappel",
    description: "Regarder quelques objets, puis les retrouver.",
    cover: "banane",
  },
];
export const SEQUENCE = [
  {
    photo: "pain",
    name: "Choisir le pain",
    hint: "Avant de préparer, on choisit ce que l’on veut manger.",
  },
  {
    photo: "banane",
    name: "Ajouter un fruit",
    hint: "On complète le petit-déjeuner avec un fruit.",
  },
  {
    photo: "bouilloire",
    name: "Préparer la boisson",
    hint: "On prépare une boisson avant de la servir.",
  },
  {
    photo: "cafe",
    name: "Servir le café",
    hint: "Le café est prêt à être servi dans la tasse.",
  },
];
