export const CATEGORIES = ["ferie", "permessi", "rol"] as const;
export type Category = (typeof CATEGORIES)[number];
export type Hours = Record<Category, number>;

export const LABELS: Record<Category, string> = {
  ferie: "Ferie",
  permessi: "Permessi",
  rol: "ROL",
};

export const MONTHS = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];

/** Un mese di busta paga: ore maturate e ore godute per ciascuna voce. */
export interface MonthEntry {
  id: string;
  year: number;
  /** 1-12 */
  month: number;
  maturato: Hours;
  goduto: Hours;
  note?: string;
}

export interface Settings {
  /** Ore maturate ogni mese, usate come default per i nuovi mesi. */
  maturazioneMensile: Hours;
  /** Ore lavorative in un giorno, per la conversione ore -> giorni. */
  oreGiorno: number;
}

export interface TimeOffData {
  app: "time-off-counter";
  version: 1;
  exportedAt?: string;
  settings: Settings;
  entries: MonthEntry[];
}

export const DEFAULT_SETTINGS: Settings = {
  maturazioneMensile: { ferie: 13.33, permessi: 2.67, rol: 6 },
  oreGiorno: 8,
};

export const emptyHours = (): Hours => ({ ferie: 0, permessi: 0, rol: 0 });

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

const fmt = new Intl.NumberFormat("it-IT", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
export const formatNum = (n: number) => fmt.format(round2(n) || 0);

/** Accetta sia "1,5" che "1.5"; stringa vuota = 0. */
export function parseNum(s: string): number {
  const n = Number(s.trim().replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

export const monthKey = (e: { year: number; month: number }) => e.year * 12 + (e.month - 1);
export const monthLabel = (e: { year: number; month: number }) => `${MONTHS[e.month - 1]} ${e.year}`;

export const sortEntries = (entries: MonthEntry[]) =>
  [...entries].sort((a, b) => monthKey(a) - monthKey(b));

/** Variazione netta di un mese per una voce (maturato - goduto). */
export const net = (e: MonthEntry, c: Category) => e.maturato[c] - e.goduto[c];
export const netTotal = (e: MonthEntry) => CATEGORIES.reduce((s, c) => s + net(e, c), 0);

export interface Totals {
  maturato: Hours;
  goduto: Hours;
  saldo: Hours;
  saldoTotale: number;
}

export function computeTotals(entries: MonthEntry[]): Totals {
  const maturato = emptyHours();
  const goduto = emptyHours();
  for (const e of entries) {
    for (const c of CATEGORIES) {
      maturato[c] += e.maturato[c];
      goduto[c] += e.goduto[c];
    }
  }
  const saldo = emptyHours();
  for (const c of CATEGORIES) {
    maturato[c] = round2(maturato[c]);
    goduto[c] = round2(goduto[c]);
    saldo[c] = round2(maturato[c] - goduto[c]);
  }
  return { maturato, goduto, saldo, saldoTotale: round2(CATEGORIES.reduce((s, c) => s + saldo[c], 0)) };
}

/** Saldo progressivo (per voce e complessivo) alla fine di ogni mese, indicizzato per id. */
export function runningBalances(entries: MonthEntry[]) {
  const acc = emptyHours();
  const out = new Map<string, { saldo: Hours; totale: number }>();
  for (const e of sortEntries(entries)) {
    for (const c of CATEGORIES) acc[c] += net(e, c);
    const saldo = { ferie: round2(acc.ferie), permessi: round2(acc.permessi), rol: round2(acc.rol) };
    out.set(e.id, { saldo, totale: round2(saldo.ferie + saldo.permessi + saldo.rol) });
  }
  return out;
}

/** Il mese successivo all'ultimo registrato (o il mese corrente se non ci sono dati). */
export function nextMonth(entries: MonthEntry[]): { year: number; month: number } {
  if (entries.length === 0) {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  }
  const k = Math.max(...entries.map(monthKey)) + 1;
  return { year: Math.floor(k / 12), month: (k % 12) + 1 };
}

export const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

// ---------- import / export ----------

export function buildExport(settings: Settings, entries: MonthEntry[]): TimeOffData {
  return {
    app: "time-off-counter",
    version: 1,
    exportedAt: new Date().toISOString(),
    settings,
    entries: sortEntries(entries),
  };
}

export function exportFileName(entries: MonthEntry[]) {
  const last = sortEntries(entries).at(-1);
  const tag = last ? `${last.year}-${String(last.month).padStart(2, "0")}` : "vuoto";
  return `ferie-rol-permessi_${tag}.json`;
}

function toHours(v: unknown, field: string): Hours {
  if (typeof v !== "object" || v === null) throw new Error(`Campo "${field}" mancante o non valido`);
  const o = v as Record<string, unknown>;
  const h = emptyHours();
  for (const c of CATEGORIES) {
    const n = Number(o[c] ?? 0);
    if (!Number.isFinite(n)) throw new Error(`Valore non numerico in "${field}.${c}"`);
    h[c] = n;
  }
  return h;
}

/** Valida e normalizza un file JSON esportato in precedenza. */
export function parseImport(text: string): TimeOffData {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("Il file non è un JSON valido");
  }
  if (typeof raw !== "object" || raw === null) throw new Error("Formato non riconosciuto");
  const o = raw as Record<string, unknown>;
  if (!Array.isArray(o.entries)) throw new Error('Il file non contiene l\'elenco "entries"');

  const s = (o.settings ?? {}) as Record<string, unknown>;
  const oreGiorno = Number(s.oreGiorno ?? DEFAULT_SETTINGS.oreGiorno);
  const settings: Settings = {
    maturazioneMensile: s.maturazioneMensile
      ? toHours(s.maturazioneMensile, "settings.maturazioneMensile")
      : { ...DEFAULT_SETTINGS.maturazioneMensile },
    oreGiorno: Number.isFinite(oreGiorno) && oreGiorno > 0 ? oreGiorno : DEFAULT_SETTINGS.oreGiorno,
  };

  const seen = new Set<number>();
  const entries = o.entries.map((item, i): MonthEntry => {
    const e = item as Record<string, unknown>;
    const year = Number(e.year);
    const month = Number(e.month);
    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12)
      throw new Error(`Riga ${i + 1}: anno/mese non validi`);
    const key = monthKey({ year, month });
    if (seen.has(key)) throw new Error(`Mese duplicato: ${monthLabel({ year, month })}`);
    seen.add(key);
    return {
      id: typeof e.id === "string" && e.id ? e.id : newId(),
      year,
      month,
      maturato: toHours(e.maturato, `entries[${i}].maturato`),
      goduto: toHours(e.goduto, `entries[${i}].goduto`),
      note: typeof e.note === "string" && e.note ? e.note : undefined,
    };
  });

  return { app: "time-off-counter", version: 1, exportedAt: o.exportedAt as string | undefined, settings, entries: sortEntries(entries) };
}

// ---------- persistenza locale ----------

const STORAGE_KEY = "time-off-counter:v1";

export function loadLocal(): TimeOffData | null {
  try {
    const t = localStorage.getItem(STORAGE_KEY);
    return t ? parseImport(t) : null;
  } catch {
    return null;
  }
}

export function saveLocal(data: TimeOffData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // storage non disponibile (es. navigazione privata): si lavora solo in memoria
  }
}
