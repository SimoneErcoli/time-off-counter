"use client";

import { Fragment, useState } from "react";
import {
  CATEGORIES,
  LABELS,
  MONTHS,
  computeTotals,
  formatNum,
  net,
  netTotal,
  runningBalances,
  sortEntries,
  type MonthEntry,
} from "@/lib/timeoff";

const signClass = (v: number) =>
  v < 0 ? "text-red-600 dark:text-red-400" : v > 0 ? "text-emerald-700 dark:text-emerald-400" : "text-muted";
const signed = (v: number) => `${v > 0 ? "+" : ""}${formatNum(v)}`;

interface Props {
  entries: MonthEntry[];
  oreGiorno: number;
  onEdit: (e: MonthEntry) => void;
  onDelete: (e: MonthEntry) => void;
}

export function EntriesTable({ entries, oreGiorno, onEdit, onDelete }: Props) {
  const sorted = sortEntries(entries).reverse();
  const years = [...new Set(sorted.map((e) => e.year))];
  const balances = runningBalances(entries);
  // null = nessuna scelta dell'utente: si mostra aperto solo l'anno più recente
  const [userOpen, setOpen] = useState<Set<number> | null>(null);
  const open = userOpen ?? new Set(years.slice(0, 1));

  const toggle = (y: number) => {
    const next = new Set(open);
    if (next.has(y)) next.delete(y);
    else next.add(y);
    setOpen(next);
  };

  if (entries.length === 0) {
    return (
      <div className="card p-8 text-center text-muted">
        Nessun mese registrato. Aggiungi il primo mese oppure importa un file JSON esportato in precedenza.
      </div>
    );
  }

  return (
    <section className="card overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
        <h2 className="text-lg font-semibold">Storico mensile</h2>
        <div className="flex gap-2 text-sm">
          <button className="btn btn-sm" onClick={() => setOpen(new Set(years))}>
            Espandi tutto
          </button>
          <button className="btn btn-sm" onClick={() => setOpen(new Set())}>
            Comprimi
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-subtle text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Mese</th>
              {CATEGORIES.map((c) => (
                <th key={c} className="px-3 py-2 text-right font-medium">
                  {LABELS[c]}
                </th>
              ))}
              <th className="px-3 py-2 text-right font-medium">Totale mese</th>
              <th className="px-3 py-2 text-right font-medium">Saldo progressivo</th>
              <th className="px-3 py-2 font-medium">Note</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {years.map((y) => {
              const rows = sorted.filter((e) => e.year === y);
              const t = computeTotals(rows);
              const isOpen = open.has(y);
              return (
                <Fragment key={y}>
                  <tr className="cursor-pointer border-t border-line bg-subtle/60 font-medium hover:bg-subtle" onClick={() => toggle(y)}>
                    <td className="px-4 py-2">
                      <span className="mr-2 inline-block w-3 text-muted">{isOpen ? "▾" : "▸"}</span>
                      {y} <span className="text-xs font-normal text-muted">({rows.length} mesi)</span>
                    </td>
                    {CATEGORIES.map((c) => (
                      <td key={c} className={`px-3 py-2 text-right tabular-nums ${signClass(t.saldo[c])}`}>
                        {signed(t.saldo[c])}
                      </td>
                    ))}
                    <td className={`px-3 py-2 text-right tabular-nums ${signClass(t.saldoTotale)}`}>{signed(t.saldoTotale)}</td>
                    <td colSpan={3} className="px-3 py-2 text-xs font-normal text-muted">
                      variazione dell&apos;anno
                    </td>
                  </tr>
                  {isOpen &&
                    rows.map((e) => {
                      const b = balances.get(e.id)!;
                      const tot = netTotal(e);
                      return (
                        <tr key={e.id} className="border-t border-line/60 hover:bg-subtle/40">
                          <td className="px-4 py-2 pl-9">{MONTHS[e.month - 1]}</td>
                          {CATEGORIES.map((c) => (
                            <td key={c} className="px-3 py-2 text-right tabular-nums" title={`Maturate ${formatNum(e.maturato[c])} h · Godute ${formatNum(e.goduto[c])} h`}>
                              <div className={signClass(net(e, c))}>{signed(net(e, c))}</div>
                              {e.goduto[c] !== 0 && <div className="text-xs text-muted">godute {formatNum(e.goduto[c])}</div>}
                            </td>
                          ))}
                          <td className={`px-3 py-2 text-right tabular-nums ${signClass(tot)}`}>{signed(tot)}</td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            <div>{formatNum(b.totale)} h</div>
                            <div className="text-xs text-muted">{formatNum(b.totale / oreGiorno)} gg</div>
                          </td>
                          <td className="max-w-48 truncate px-3 py-2 text-muted" title={e.note}>
                            {e.note}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-right">
                            <button className="btn btn-sm" onClick={() => onEdit(e)}>
                              Modifica
                            </button>{" "}
                            <button className="btn btn-sm btn-danger" onClick={() => onDelete(e)}>
                              Elimina
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

