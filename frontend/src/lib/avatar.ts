// Avatar-Datenmodell: alle Merkmale unabhängig voneinander und unabhängig vom Geschlecht wählbar.
export type Avatar = {
  name: string;
  gender: "female" | "male" | "diverse";
  age: "child" | "young" | "adult" | "senior";
  skin: string;
  eyes: string;
  lips: "thin" | "full" | "smile" | "heart";
  lipColor: string;
  nose: "small" | "round" | "straight" | "wide";
  freckles: 0 | 1 | 2 | 3;
  glasses: "none" | "round" | "square" | "cat" | "aviator";
  glassesColor: string;
  hair: "none" | "buzz" | "short" | "side" | "curly" | "long" | "bob" | "bun" | "braids";
  hairColor: string;
  hat: "none" | "kippa" | "cap" | "beanie" | "straw" | "headscarf" | "turban";
  hatColor: string;
};

export const AVATAR_OPTIONS = {
  gender: [["female", "Weiblich"], ["male", "Männlich"], ["diverse", "Divers"]],
  age: [["child", "Kind"], ["young", "Jugendlich"], ["adult", "Erwachsen"], ["senior", "Senior"]],
  skin: ["#F7D7C1", "#EDC1A0", "#D9A27A", "#B97E55", "#8D5A3B", "#5E3A26"],
  eyes: ["#5B3A1E", "#2E6FA7", "#3F8A55", "#8A6A2E", "#6B6E78", "#2B2B2B"],
  lips: [["thin", "Schmal"], ["full", "Voll"], ["smile", "Lächelnd"], ["heart", "Herzform"]],
  lipColor: ["#C46A6A", "#B0505B", "#D88A7A", "#9A4A4A", "#E07B8A"],
  nose: [["small", "Klein"], ["round", "Rund"], ["straight", "Gerade"], ["wide", "Breit"]],
  freckles: [[0, "Keine"], [1, "Leicht"], [2, "Mittel"], [3, "Stark"]],
  glasses: [["none", "Keine"], ["round", "Rund"], ["square", "Eckig"], ["cat", "Cat-Eye"], ["aviator", "Pilot"]],
  glassesColor: ["#2B2B2B", "#8A5A2B", "#C9A227", "#2E6FA7", "#B0505B"],
  hair: [["none", "Keine Haare"], ["buzz", "Kurzschnitt"], ["short", "Kurz"], ["side", "Seitenscheitel"], ["curly", "Locken"], ["long", "Lang"], ["bob", "Bob"], ["bun", "Dutt"], ["braids", "Zöpfe"]],
  hairColor: ["#2B1D14", "#5B3A1E", "#8A5A2B", "#C98B3A", "#E3C07A", "#B5482F", "#BFBFBF", "#F2F2F2"],
  hat: [["none", "Keine"], ["kippa", "Kippa"], ["cap", "Kappe"], ["beanie", "Mütze"], ["straw", "Strohhut"], ["headscarf", "Kopftuch"], ["turban", "Turban"]],
  hatColor: ["#3F7FA7", "#C0573E", "#E3C48A", "#607D5B", "#7E5B82", "#2B2B2B", "#F2E8D5"],
} as const;

export const DEFAULT_AVATAR: Avatar = {
  name: "Mein Avatar", gender: "diverse", age: "adult", skin: "#D9A27A", eyes: "#5B3A1E", lips: "smile", lipColor: "#C46A6A", nose: "small",
  freckles: 0, glasses: "none", glassesColor: "#2B2B2B", hair: "short", hairColor: "#5B3A1E", hat: "none", hatColor: "#3F7FA7",
};

const pick = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)];
const pickId = <T,>(a: readonly (readonly [T, string])[]) => pick(a)[0];

export function randomAvatar(name: string): Avatar {
  const O = AVATAR_OPTIONS;
  return {
    name, gender: pickId(O.gender), age: pickId(O.age), skin: pick(O.skin), eyes: pick(O.eyes), lips: pickId(O.lips), lipColor: pick(O.lipColor),
    nose: pickId(O.nose), freckles: pickId(O.freckles) as Avatar["freckles"], glasses: Math.random() < 0.5 ? "none" : pickId(O.glasses), glassesColor: pick(O.glassesColor),
    hair: pickId(O.hair), hairColor: pick(O.hairColor), hat: Math.random() < 0.55 ? "none" : pickId(O.hat), hatColor: pick(O.hatColor),
  };
}

/** Validiert einen importierten Avatar; unbekannte Werte fallen auf Standardwerte zurück. */
export function sanitizeAvatar(raw: unknown): Avatar | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const out = { ...DEFAULT_AVATAR } as Record<string, unknown>;
  const ids = (k: keyof typeof AVATAR_OPTIONS) => (AVATAR_OPTIONS[k] as readonly unknown[]).map((o) => (Array.isArray(o) ? o[0] : o));
  for (const k of Object.keys(AVATAR_OPTIONS) as (keyof typeof AVATAR_OPTIONS)[]) if (ids(k).includes(r[k])) out[k] = r[k];
  for (const k of ["skin", "eyes", "lipColor", "glassesColor", "hairColor", "hatColor"]) if (typeof r[k] === "string" && /^#[0-9A-Fa-f]{6}$/.test(r[k] as string)) out[k] = r[k];
  if (typeof r.name === "string") out.name = r.name.slice(0, 40);
  return out as Avatar;
}
