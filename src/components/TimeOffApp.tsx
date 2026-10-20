"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EntriesTable } from "./EntriesTable";
import { EntryForm } from "./EntryForm";
import { SettingsPanel } from "./SettingsPanel";
import { SummaryCards } from "./SummaryCards";
import {
  DEFAULT_SETTINGS,
  buildExport,
  computeTotals,
  exportFileName,
  loadLocal,
  monthKey,
  monthLabel,
  nextMonth,
  parseImport,
  saveLocal,
  sortEntries,
  type MonthEntry,
  type Settings,
} from "@/lib/timeoff";

export function TimeOffApp() {
  const [loaded, setLoaded] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [entries, setEntries] = useState<MonthEntry[]>([]);
  const [editing, setEditing] = useState<MonthEntry | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const data = loadLocal();
    if (data) {
      setSettings(data.settings);
      setEntries(data.entries);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveLocal(buildExport(settings, entries));
  }, [loaded, settings, entries]);

  const totals = useMemo(() => computeTotals(entries), [entries]);
  const takenKeys = useMemo(
    () => new Set(entries.filter((e) => e.id !== editing?.id).map(monthKey)),
    [entries, editing],
  );
  const last = sortEntries(entries).at(-1);

  function flash(kind: "ok" | "error", text: string) {
    setMessage({ kind, text });
    setTimeout(() => setMessage(null), 5000);
  }

  function save(entry: MonthEntry) {
    setEntries((prev) => sortEntries([...prev.filter((e) => e.id !== entry.id), entry]));
    if (editing) {
      setEditing(null);
      flash("ok", `${monthLabel(entry)} aggiornato`);
    } else {
      flash("ok", `${monthLabel(entry)} aggiunto`);
    }
  }

  function remove(entry: MonthEntry) {
    if (!confirm(`Eliminare ${monthLabel(entry)}?`)) return;
    setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    if (editing?.id === entry.id) setEditing(null);
  }

  function startEdit(entry: MonthEntry) {
    setEditing(entry);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function exportJson() {
    const data = buildExport(settings, entries);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = exportFileName(entries);
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importJson(file: File) {
    try {
      const data = parseImport(await file.text());
      if (
        entries.length > 0 &&
        !confirm(`Importare ${data.entries.length} mesi da "${file.name}"? I dati attuali (${entries.length} mesi) verranno sostituiti.`)
      )
        return;
      setSettings(data.settings);
      setEntries(data.entries);
      setEditing(null);
      const lastImported = data.entries.at(-1);
      flash("ok", `Importati ${data.entries.length} mesi${lastImported ? ` (ultimo: ${monthLabel(lastImported)})` : ""}`);
    } catch (err) {
      flash("error", `Importazione fallita: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function clearAll() {
    if (!confirm("Cancellare tutti i dati salvati nel browser? Esporta prima un JSON se vuoi conservarli.")) return;
    setEntries([]);
    setSettings(DEFAULT_SETTINGS);
    setEditing(null);
  }

  if (!loaded) return <main className="mx-auto max-w-6xl p-6 text-muted">Caricamento…</main>;

  const defaults = { ...nextMonth(entries), maturato: settings.maturazioneMensile };

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Contatore Ferie · Permessi · ROL</h1>
          <p className="text-sm text-muted">
            {last ? `Aggiornato a ${monthLabel(last)} · ${entries.length} mesi registrati` : "Nessun dato"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-primary" onClick={exportJson} disabled={entries.length === 0}>
            Esporta JSON
          </button>
          <button className="btn" onClick={() => fileInput.current?.click()}>
            Importa JSON
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])}
          />
          <button className="btn" onClick={() => setShowSettings((v) => !v)}>
            Impostazioni
          </button>
        </div>
      </header>

      {message && (
        <div
          role="status"
          className={`rounded-lg border px-4 py-2 text-sm ${
            message.kind === "ok"
              ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
              : "border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {showSettings && (
        <SettingsPanel
          settings={settings}
          onSave={(s) => {
            setSettings(s);
            setShowSettings(false);
            flash("ok", "Impostazioni salvate");
          }}
          onClose={() => setShowSettings(false)}
          onClearAll={clearAll}
        />
      )}

      <SummaryCards totals={totals} oreGiorno={settings.oreGiorno} />

      <div ref={formRef} className="scroll-mt-4">
        <EntryForm
          key={editing?.id ?? `new-${defaults.year}-${defaults.month}`}
          editing={editing ?? undefined}
          defaults={defaults}
          oreGiorno={settings.oreGiorno}
          takenKeys={takenKeys}
          onSave={save}
          onCancel={editing ? () => setEditing(null) : undefined}
        />
      </div>

      <EntriesTable entries={entries} oreGiorno={settings.oreGiorno} onEdit={startEdit} onDelete={remove} />

      <footer className="pb-6 text-xs text-muted">
        I dati restano solo in questo browser. A fine mese usa <strong>Esporta JSON</strong> per salvarne una copia e{" "}
        <strong>Importa JSON</strong> per ricaricarla.
      </footer>
    </main>
  );
}
