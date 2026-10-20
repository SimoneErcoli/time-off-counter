"use client";

import { useState } from "react";
import {
  CATEGORIES,
  LABELS,
  MONTHS,
  formatNum,
  monthKey,
  newId,
  parseNum,
  round2,
  type Category,
  type Hours,
  type MonthEntry,
} from "@/lib/timeoff";

type HourStrings = Record<Category, string>;

const toStrings = (h: Hours): HourStrings => ({
  ferie: h.ferie ? String(h.ferie).replace(".", ",") : "",
  permessi: h.permessi ? String(h.permessi).replace(".", ",") : "",
  rol: h.rol ? String(h.rol).replace(".", ",") : "",
});

interface Props {
  /** Mese in modifica; se assente si sta inserendo un nuovo mese. */
  editing?: MonthEntry;
  defaults: { year: number; month: number; maturato: Hours };
  oreGiorno: number;
  /** Chiavi mese già occupate da altri record (per evitare duplicati). */
  takenKeys: Set<number>;
  onSave: (e: MonthEntry) => void;
  onCancel?: () => void;
}

export function EntryForm({ editing, defaults, oreGiorno, takenKeys, onSave, onCancel }: Props) {
  const [year, setYear] = useState(String(editing?.year ?? defaults.year));
  const [month, setMonth] = useState(editing?.month ?? defaults.month);
  const [goduto, setGoduto] = useState<HourStrings>(toStrings(editing?.goduto ?? { ferie: 0, permessi: 0, rol: 0 }));
  const [maturato, setMaturato] = useState<HourStrings>(toStrings(editing?.maturato ?? defaults.maturato));
  const [unit, setUnit] = useState<"ore" | "giorni">("ore");
  const [note, setNote] = useState(editing?.note ?? "");
  const [error, setError] = useState<string | null>(null);

  const toHours = (s: string) => {
    const n = s.trim() === "" ? 0 : parseNum(s);
    return unit === "giorni" ? n * oreGiorno : n;
  };
  const parsedGoduto = Object.fromEntries(CATEGORIES.map((c) => [c, toHours(goduto[c])])) as Hours;
  const parsedMaturato = Object.fromEntries(
    CATEGORIES.map((c) => [c, maturato[c].trim() === "" ? 0 : parseNum(maturato[c])]),
  ) as Hours;

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const y = Number(year);
    if (!Number.isInteger(y) || y < 1990 || y > 2100) return setError("Anno non valido");
    if (takenKeys.has(monthKey({ year: y, month })))
      return setError(`${MONTHS[month - 1]} ${y} è già registrato: modificalo dalla tabella`);
    for (const c of CATEGORIES) {
      if (!Number.isFinite(parsedGoduto[c]) || !Number.isFinite(parsedMaturato[c]))
        return setError(`Valore non valido per ${LABELS[c]}`);
    }
    setError(null);
    onSave({
      id: editing?.id ?? newId(),
      year: y,
      month,
      maturato: { ferie: round2(parsedMaturato.ferie), permessi: round2(parsedMaturato.permessi), rol: round2(parsedMaturato.rol) },
      goduto: { ferie: round2(parsedGoduto.ferie), permessi: round2(parsedGoduto.permessi), rol: round2(parsedGoduto.rol) },
      note: note.trim() || undefined,
    });
    if (!editing) {
      setGoduto({ ferie: "", permessi: "", rol: "" });
      setNote("");
      const k = monthKey({ year: y, month }) + 1;
      setYear(String(Math.floor(k / 12)));
      setMonth((k % 12) + 1);
      setMaturato(toStrings(defaults.maturato));
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-lg font-semibold">{editing ? "Modifica mese" : "Registra un mese"}</h2>
        <div className="flex items-end gap-2">
          <label className="field">
            <span>Mese</span>
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="input">
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label className="field w-24">
            <span>Anno</span>
            <input value={year} onChange={(e) => setYear(e.target.value)} inputMode="numeric" className="input" />
          </label>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="text-left text-muted">
              <th className="py-1 font-medium"></th>
              {CATEGORIES.map((c) => (
                <th key={c} className="px-2 py-1 font-medium">
                  {LABELS[c]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-1 pr-2 align-middle">
                <div className="font-medium">Godute</div>
                <div className="mt-1 inline-flex overflow-hidden rounded-md border border-line text-xs">
                  {(["ore", "giorni"] as const).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setUnit(u)}
                      className={`px-2 py-0.5 ${unit === u ? "bg-foreground text-background" : "text-muted"}`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </td>
              {CATEGORIES.map((c) => (
                <td key={c} className="px-2 py-1">
                  <input
                    value={goduto[c]}
                    onChange={(e) => setGoduto({ ...goduto, [c]: e.target.value })}
                    inputMode="decimal"
                    placeholder="0"
                    className="input w-full"
                    aria-label={`${LABELS[c]} godute`}
                  />
                  {unit === "giorni" && Number.isFinite(parsedGoduto[c]) && parsedGoduto[c] !== 0 && (
                    <div className="mt-0.5 text-xs text-muted">= {formatNum(parsedGoduto[c])} h</div>
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-1 pr-2 align-middle">
                <div className="font-medium">Maturate (h)</div>
                <div className="text-xs text-muted">dalle impostazioni</div>
              </td>
              {CATEGORIES.map((c) => (
                <td key={c} className="px-2 py-1">
                  <input
                    value={maturato[c]}
                    onChange={(e) => setMaturato({ ...maturato, [c]: e.target.value })}
                    inputMode="decimal"
                    placeholder="0"
                    className="input w-full"
                    aria-label={`${LABELS[c]} maturate`}
                  />
                </td>
              ))}
            </tr>
            <tr className="border-t border-line">
              <td className="py-2 pr-2 font-medium">Variazione</td>
              {CATEGORIES.map((c) => {
                const v = parsedMaturato[c] - parsedGoduto[c];
                return (
                  <td key={c} className={`px-2 py-2 tabular-nums ${v < 0 ? "text-red-600 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}>
                    {Number.isFinite(v) ? `${v > 0 ? "+" : ""}${formatNum(v)} h` : "—"}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      <label className="field">
        <span>Note (facoltative)</span>
        <input value={note} onChange={(e) => setNote(e.target.value)} className="input" placeholder="es. ponte 1 novembre" />
      </label>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary">
          {editing ? "Salva modifiche" : "Aggiungi mese"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn">
            Annulla
          </button>
        )}
      </div>
    </form>
  );
}
