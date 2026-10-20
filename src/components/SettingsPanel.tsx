"use client";

import { useState } from "react";
import { CATEGORIES, LABELS, parseNum, type Category, type Settings } from "@/lib/timeoff";

const str = (n: number) => String(n).replace(".", ",");

interface Props {
  settings: Settings;
  onSave: (s: Settings) => void;
  onClose: () => void;
  onClearAll: () => void;
}

export function SettingsPanel({ settings, onSave, onClose, onClearAll }: Props) {
  const [rates, setRates] = useState<Record<Category, string>>({
    ferie: str(settings.maturazioneMensile.ferie),
    permessi: str(settings.maturazioneMensile.permessi),
    rol: str(settings.maturazioneMensile.rol),
  });
  const [oreGiorno, setOreGiorno] = useState(str(settings.oreGiorno));
  const [error, setError] = useState<string | null>(null);

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const h = parseNum(oreGiorno);
    if (!(h > 0)) return setError("Le ore per giorno devono essere maggiori di zero");
    const m = { ferie: parseNum(rates.ferie), permessi: parseNum(rates.permessi), rol: parseNum(rates.rol) };
    if (CATEGORIES.some((c) => !Number.isFinite(m[c]))) return setError("Maturazione mensile non valida");
    onSave({ maturazioneMensile: m, oreGiorno: h });
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-4">
      <h2 className="text-lg font-semibold">Impostazioni</h2>
      <div className="grid gap-3 sm:grid-cols-4">
        {CATEGORIES.map((c) => (
          <label key={c} className="field">
            <span>{LABELS[c]} maturate al mese (h)</span>
            <input
              value={rates[c]}
              onChange={(e) => setRates({ ...rates, [c]: e.target.value })}
              inputMode="decimal"
              className="input"
            />
          </label>
        ))}
        <label className="field">
          <span>Ore in un giorno</span>
          <input value={oreGiorno} onChange={(e) => setOreGiorno(e.target.value)} inputMode="decimal" className="input" />
        </label>
      </div>
      <p className="text-xs text-muted">
        La maturazione mensile viene proposta per i nuovi mesi; i mesi già registrati non cambiano.
      </p>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex flex-wrap justify-between gap-2">
        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary">
            Salva
          </button>
          <button type="button" className="btn" onClick={onClose}>
            Chiudi
          </button>
        </div>
        <button type="button" className="btn btn-danger" onClick={onClearAll}>
          Cancella tutti i dati
        </button>
      </div>
    </form>
  );
}
