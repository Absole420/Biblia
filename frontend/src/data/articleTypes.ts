// Strukturierte Lexikonartikel – unabhängig von der Oberfläche, verknüpft über stabile IDs
// (Bibelstellen: Buchcode + Kapitel,Vers · Orte: themeMaps-IDs · Stationen: Kampagnen-IDs).
// Inhalte = Redaktionstext der App (eigene Formulierung). Bibeltext wird nur aus der
// eingebundenen Elberfelder 1905 angezeigt, nie in Artikel kopiert.

export type ArticleKind = "person" | "story" | "event" | "place" | "water" | "empire" | "building" | "term";
/** Aussageebene: biblische Erzählung · historischer/archäologischer Befund · Hypothese · Auslegungstradition · Reflexion */
export type Layer = "bible" | "history" | "hypothesis" | "tradition" | "reflection";
export type Section = { h: string; body: string; layer?: Layer };
export type RelationType = "participated" | "lived" | "family" | "tookPlace" | "partOf" | "mentioned" | "related";
export type Relation = { type: RelationType; target: string; label?: string; uncertain?: boolean };
export type MapState = { label: string; placeIds: string[]; note: string };
export type Article = {
  id: string;
  kind: ArticleKind;
  title: string;
  aliases: string[];
  category: string;
  summary: string;
  overview: Section[];
  deep: Section[];
  refs: string[]; // wichtigste Stellen, z. B. "1Mo 12,1–9"
  timeframe: string; // Zeitraum statt erfundener Jahreszahl
  epoch: "urgeschichte" | "erzvaeter" | "exodus" | "koenigszeit" | "exil" | "nachexil" | "jesus" | "urkirche";
  region: "mesopotamien" | "aegypten" | "kanaan" | "galilaea" | "judaea" | "kleinasien" | "mittelmeer";
  books: string[]; // Buchcodes, in denen das Thema vorkommt
  relations: Relation[];
  map?: { mapId: string; placeIds: string[]; routeIds?: string[]; states?: MapState[]; note: string };
  stationIds?: string[]; // ausdrücklich zugeordnete Lernstationen (zusätzlich zu station.info)
  sources: string[];
  disambiguation?: string; // Abgrenzung gleichnamiger Personen/Orte
  placeId?: string; // Kartenort (themeMaps-ID), den dieser Artikel beschreibt
};

export const KIND_LABEL: Record<ArticleKind, { label: string; icon: string }> = {
  person: { label: "Person", icon: "user" },
  story: { label: "Geschichte", icon: "book-open" },
  event: { label: "Ereignis", icon: "calendar" },
  place: { label: "Ort", icon: "map-pin" },
  water: { label: "Gewässer & Landschaft", icon: "droplet" },
  empire: { label: "Reich & Volk", icon: "flag" },
  building: { label: "Bauwerk", icon: "home" },
  term: { label: "Begriff & Brauch", icon: "bookmark" },
};
export const LAYER_LABEL: Record<Layer, { label: string; icon: string }> = {
  bible: { label: "Biblische Erzählung", icon: "book-open" },
  history: { label: "Historischer / archäologischer Befund", icon: "search" },
  hypothesis: { label: "Wissenschaftliche Hypothese", icon: "help-circle" },
  tradition: { label: "Jüdische & christliche Auslegung", icon: "message-circle" },
  reflection: { label: "Zum Nachdenken", icon: "feather" },
};
export const REL_LABEL: Record<RelationType, string> = {
  participated: "War beteiligt an",
  lived: "Lebte bzw. wirkte in",
  family: "Gehört zur Familie von",
  tookPlace: "Fand statt bei",
  partOf: "War Teil des Reiches",
  mentioned: "Wird erwähnt in",
  related: "Siehe auch",
};
export const EPOCH_LABEL: Record<Article["epoch"], string> = {
  urgeschichte: "Urgeschichte", erzvaeter: "Erzväter", exodus: "Auszug & Landnahme", koenigszeit: "Königszeit",
  exil: "Exil", nachexil: "Nach dem Exil", jesus: "Zeit Jesu", urkirche: "Urkirche",
};
export const REGION_LABEL: Record<Article["region"], string> = {
  mesopotamien: "Mesopotamien", aegypten: "Ägypten & Sinai", kanaan: "Kanaan / Israel", galilaea: "Galiläa",
  judaea: "Judäa & Jerusalem", kleinasien: "Kleinasien & Griechenland", mittelmeer: "Mittelmeerraum",
};
