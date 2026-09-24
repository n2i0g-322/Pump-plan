/**
 * Short, human-friendly food names from CNF-style long labels.
 * Keeps the official full name available for detail views.
 */

function titleCaseWord(s: string): string {
  return s.replace(/\b([a-z])/g, (c) => c.toUpperCase());
}

function compactMf(s: string): string | null {
  const m = s.match(/(\d+(?:\.\d+)?)\s*%/);
  return m ? `${m[1]}%` : null;
}

/** Derive a short display name from a long CNF / lab-style food name. */
export function friendlyDisplayName(fullName: string): string {
  const name = fullName.trim();
  if (!name) return "Food";
  if (!name.includes(",") && name.length <= 40) return name;

  // Egg, chicken, … patterns
  if (/^egg,\s*(chicken|duck|goose|quail)/i.test(name)) {
    const isWhite = /,\s*white\b/i.test(name) || /\bwhite,/i.test(name);
    const isYolk = /,\s*yolk\b/i.test(name) || /\byolk,/i.test(name);
    const base = isWhite ? "Egg white" : isYolk ? "Egg yolk" : "Egg";
    if (/hard-cooked|hard cooked|boiled in shell/i.test(name)) {
      return base === "Egg" ? "Hard-boiled egg" : `Hard-boiled ${base.toLowerCase()}`;
    }
    if (/scrambled/i.test(name)) {
      return base === "Egg" ? "Scrambled egg" : `Scrambled ${base.toLowerCase()}`;
    }
    if (/\bfried\b/i.test(name)) {
      return base === "Egg" ? "Fried egg" : `Fried ${base.toLowerCase()}`;
    }
    if (/poached/i.test(name)) {
      return base === "Egg" ? "Poached egg" : `Poached ${base.toLowerCase()}`;
    }
    if (/omelet/i.test(name)) {
      if (/western/i.test(name)) return "Western omelet";
      if (/spanish/i.test(name)) return "Spanish omelet";
      if (/cheese/i.test(name)) return "Cheese omelet";
      return "Omelet";
    }
    if (!/dried|powder|substitute|stabilized/i.test(name) && /\braw\b/i.test(name)) {
      return `${base} (raw)`;
    }
    if (!/dried|powder|substitute|stabilized/i.test(name)) return base;
  }

  const parts = name.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) {
    return name.length > 42 ? `${name.slice(0, 40)}…` : name;
  }

  const head = parts[0];
  const rest = parts.slice(1);
  const joined = rest.join(", ");

  if (/^milk$/i.test(head)) {
    if (/chocolate/i.test(joined)) return "Chocolate milk";
    const mf = rest.map(compactMf).find(Boolean);
    if (mf) return `${mf} milk`;
    if (/skim/i.test(joined)) return "Skim milk";
    if (/whole/i.test(joined)) return "Whole milk";
    return "Milk";
  }

  if (/^yogurt/i.test(head)) {
    const mf = rest.map(compactMf).find(Boolean);
    let label = /plain/i.test(joined)
      ? "Plain yogurt"
      : /fruit|berry|strawberry|vanilla|peach/i.test(joined)
        ? "Fruit yogurt"
        : "Yogurt";
    if (mf) label += ` (${mf})`;
    return label;
  }

  if (/^cheese/i.test(head)) {
    const kind = rest.find((r) => !/^\d|moisture|fat|m\.f/i.test(r));
    return kind ? titleCaseWord(`${kind} cheese`) : "Cheese";
  }

  if (/^bread/i.test(head)) {
    const kind = rest[0];
    return kind ? titleCaseWord(`${kind} bread`) : "Bread";
  }

  // Cooking-method prefix for meats / produce
  const cooking = rest.find((r) =>
    /\b(roasted|baked|fried|grilled|broiled|stewed|boiled|braised|pan-fried|raw|steamed)\b/i.test(
      r,
    ),
  );
  const noise =
    /^(chicken|turkey|beef|pork|lamb|fish|whole|flesh|meat|skin|with skin|without skin|fresh|frozen|cooked|broiler|retail|parts|only)$/i;
  const meaningful = rest.filter((r) => !noise.test(r) && r.length > 1);

  if (cooking && !/dried|powder|substitute/i.test(name)) {
    const method = cooking
      .replace(/\b(bought|home-prepared|prepared|retail)\b/gi, "")
      .trim()
      .split(/\s+/)[0];
    const short = `${titleCaseWord(method)} ${head.toLowerCase()}`;
    if (short.length <= 42) return short;
  }

  if (meaningful.length) {
    const short = `${head} (${meaningful[0]})`;
    if (short.length <= 42) return short;
  }

  return head.length <= 42 ? head : `${head.slice(0, 40)}…`;
}

/** Short source button label. */
export function sourceLabel(
  source: "cnf" | "openfoodfacts" | "fastfood" | "memory",
  brand?: string,
): string {
  if (source === "cnf") return "CNF";
  if (source === "openfoodfacts") return "OFF";
  if (source === "memory") return "Saved";
  if (brand) {
    const b = brand.toLowerCase();
    if (b.includes("tim horton")) return "Tim Hortons";
    if (b.includes("mcdonald")) return "McDonald's";
    if (b.includes("a&w") || b.includes("a & w")) return "A&W";
    if (b.includes("subway")) return "Subway";
    if (b.includes("wendy")) return "Wendy's";
    if (b.includes("starbucks")) return "Starbucks";
    // Short brand for button
    const first = brand.split(/[,/]/)[0]?.trim() ?? brand;
    return first.length > 14 ? `${first.slice(0, 12)}…` : first;
  }
  return "Menu";
}

export function cnfSourceUrl(foodId: number, foodName: string): string {
  // Health Canada CNF explorer — food id deep link when available
  return `https://food-nutrition.canada.ca/cnf-fce/serving-portion?id=${foodId}&q=${encodeURIComponent(foodName)}`;
}

export function offSourceUrl(code: string): string {
  return `https://world.openfoodfacts.org/product/${encodeURIComponent(code)}`;
}

export function brandSiteSearchUrl(brand: string, itemName: string): string {
  const siteHint = brandSite(brand);
  const q = siteHint
    ? `site:${siteHint} ${itemName} nutrition`
    : `${brand} ${itemName} nutrition facts`;
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}

function brandSite(brand: string): string | null {
  const b = brand.toLowerCase();
  if (b.includes("tim horton")) return "timhortons.ca";
  if (b.includes("mcdonald")) return "mcdonalds.com";
  if (b.includes("a&w") || b.includes("a & w")) return "web.aw.ca";
  if (b.includes("subway")) return "subway.com";
  if (b.includes("wendy")) return "wendys.com";
  if (b.includes("starbucks")) return "starbucks.ca";
  return null;
}
