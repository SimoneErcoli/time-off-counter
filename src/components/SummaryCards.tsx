import { CATEGORIES, LABELS, formatNum, type Totals } from "@/lib/timeoff";

const ACCENT: Record<string, string> = {
  ferie: "border-t-sky-500",
  permessi: "border-t-amber-500",
  rol: "border-t-violet-500",
};

export function SummaryCards({ totals, oreGiorno }: { totals: Totals; oreGiorno: number }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {CATEGORIES.map((c) => (
        <div key={c} className={`card border-t-4 ${ACCENT[c]} p-4`}>
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted">{LABELS[c]}</h2>
          <p className={`mt-1 text-3xl font-semibold tabular-nums ${totals.saldo[c] < 0 ? "text-red-600 dark:text-red-400" : ""}`}>
            {formatNum(totals.saldo[c])} <span className="text-base font-normal text-muted">ore</span>
          </p>
          <p className="text-lg tabular-nums">
            = {formatNum(totals.saldo[c] / oreGiorno)} <span className="text-sm text-muted">giorni</span>
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-x-2 text-xs text-muted tabular-nums">
            <dt>Maturate</dt>
            <dd className="text-right">{formatNum(totals.maturato[c])} h</dd>
            <dt>Godute</dt>
            <dd className="text-right">{formatNum(totals.goduto[c])} h</dd>
          </dl>
        </div>
      ))}
      <div className="card border-t-4 border-t-emerald-500 bg-emerald-50/60 p-4 dark:bg-emerald-950/30">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted">Totale complessivo</h2>
        <p className={`mt-1 text-3xl font-semibold tabular-nums ${totals.saldoTotale < 0 ? "text-red-600 dark:text-red-400" : ""}`}>
          {formatNum(totals.saldoTotale)} <span className="text-base font-normal text-muted">ore</span>
        </p>
        <p className="text-lg tabular-nums">
          = {formatNum(totals.saldoTotale / oreGiorno)} <span className="text-sm text-muted">giorni</span>
        </p>
        <p className="mt-3 text-xs text-muted">Ferie + Permessi + ROL · {formatNum(oreGiorno)} h = 1 giorno</p>
      </div>
    </section>
  );
}
