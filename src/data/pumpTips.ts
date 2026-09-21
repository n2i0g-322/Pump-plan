/** Paraphrased breastfeeding / pumping tips. Add more tips here later. */
/** Source label shown in UI: Prevention · 22 breastfeeding tips */

export type TipKind = "motivation" | "trick" | "comfort" | "science";

export type PumpTip = {
  id: string;
  kind: TipKind;
  text: string;
  source: string;
};

export const TIP_SOURCE = "Prevention · 22 breastfeeding tips";

/** Seeded themes from Prevention’s “22 Breastfeeding Tips” — paraphrased, not verbatim. */
export const PUMP_TIPS: PumpTip[] = [
  {
    id: "skin-to-skin",
    kind: "science",
    text: "Skin-to-skin helps baby find the breast and supports bonding plus supply cues.",
    source: TIP_SOURCE,
  },
  {
    id: "first-six-weeks",
    kind: "science",
    text: "First ~6 weeks: frequent empties build supply. Delay bottles/pacifiers until latch and supply feel solid — hospital/NICU plan overrides.",
    source: TIP_SOURCE,
  },
  {
    id: "hydrate-snacks",
    kind: "comfort",
    text: "Keep water at every pump and steady snacks or meals nearby so you can empty without running on fumes.",
    source: TIP_SOURCE,
  },
  {
    id: "position-flange",
    kind: "trick",
    text: "Check position and flange/latch comfort — pain is a signal to adjust, not to push through.",
    source: TIP_SOURCE,
  },
  {
    id: "alternate-sides",
    kind: "trick",
    text: "Alternate which side you start on so one breast doesn’t always get the eager first empty.",
    source: TIP_SOURCE,
  },
  {
    id: "night-prolactin",
    kind: "science",
    text: "Nurse or pump often; overnight sessions matter — prolactin tends to run higher at night.",
    source: TIP_SOURCE,
  },
  {
    id: "air-dry-bra",
    kind: "comfort",
    text: "Air-dry nipples after sessions and wear a supportive nursing bra that isn’t too tight.",
    source: TIP_SOURCE,
  },
  {
    id: "plugged-ducts",
    kind: "trick",
    text: "Spot a plugged duct early: warmth, gentle massage, and keep emptying that side.",
    source: TIP_SOURCE,
  },
  {
    id: "oversupply-care",
    kind: "comfort",
    text: "If oversupply or engorgement hits, use warmth carefully and avoid extra stimulation — follow your care team.",
    source: TIP_SOURCE,
  },
  {
    id: "leaking-pads",
    kind: "trick",
    text: "Leaking? Nursing pads or a brief hand-express for comfort beat launching another long session.",
    source: TIP_SOURCE,
  },
  {
    id: "galactagogues",
    kind: "science",
    text: "Herbal galactagogues (fenugreek and friends) only with provider OK — they don’t replace frequent milk removal.",
    source: TIP_SOURCE,
  },
  {
    id: "mastitis-flags",
    kind: "comfort",
    text: "Mastitis red flags (fever, red hot area, flu-like ache) → seek care promptly.",
    source: TIP_SOURCE,
  },
  {
    id: "motivation-youve-got-this",
    kind: "motivation",
    text: "Every empty counts. Small, steady sessions protect supply better than heroic once-a-day pumps.",
    source: TIP_SOURCE,
  },
  {
    id: "motivation-rest-is-fuel",
    kind: "motivation",
    text: "Rest windows when you’re ahead aren’t laziness — they’re how you keep showing up for the next empty.",
    source: TIP_SOURCE,
  },
  {
    id: "motivation-team",
    kind: "motivation",
    text: "Ask for help with water, snacks, and baby so you can stay on the clock without white-knuckling it.",
    source: TIP_SOURCE,
  },
  {
    id: "motivation-progress",
    kind: "motivation",
    text: "Supply is a conversation with demand. Logging today’s ounces is how you steer tomorrow’s plan.",
    source: TIP_SOURCE,
  },
];

function daySeed(d: Date = new Date()): number {
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

/** Pick 1 motivation + 2 non-motivation tips, rotating by calendar day. */
export function tipsForDay(d: Date = new Date()): {
  motivation: PumpTip;
  tips: PumpTip[];
} {
  const seed = daySeed(d);
  const motivations = PUMP_TIPS.filter((t) => t.kind === "motivation");
  const others = PUMP_TIPS.filter((t) => t.kind !== "motivation");
  const motivation = motivations[seed % motivations.length];
  const tipA = others[seed % others.length];
  const tipB = others[(seed + 3) % others.length];
  const tips = tipA.id === tipB.id ? [tipA, others[(seed + 5) % others.length]] : [tipA, tipB];
  return { motivation, tips };
}
