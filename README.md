# Contatore Ferie · Permessi · ROL

App Next.js per tenere il conto delle ore di **ferie**, **permessi** e **ROL** mese per mese, come nel foglio `CONTROLLO.ods`.

## Funzionalità

- Registrazione mensile delle ore **godute** (in ore o in giorni) e **maturate** (precompilate con la maturazione mensile: ferie 13,33 h, permessi 2,67 h, ROL 6 h, modificabili nelle impostazioni).
- Riepilogo con il saldo in ore di ferie, permessi e ROL, il **totale complessivo** e l'equivalente **in giorni** (8 h = 1 giorno, configurabile).
- Storico raggruppato per anno, con la variazione di ogni mese, quella dell'anno e il saldo progressivo; ogni mese si può modificare o eliminare.
- **Esporta JSON** (`ferie-rol-permessi_AAAA-MM.json`) e **Importa JSON** per salvare i conteggi e ricaricarli il mese dopo.
- I dati vengono salvati anche nel `localStorage` del browser.

## Avvio

```bash
npm install
npm run dev
```

Poi apri http://localhost:3000.

## Formato JSON

```json
{
  "app": "time-off-counter",
  "version": 1,
  "settings": { "maturazioneMensile": { "ferie": 13.33, "permessi": 2.67, "rol": 6 }, "oreGiorno": 8 },
  "entries": [
    { "id": "…", "year": 2026, "month": 9, "maturato": { "ferie": 13.33, "permessi": 2.67, "rol": 6 }, "goduto": { "ferie": 8, "permessi": 0, "rol": 7 } }
  ]
}
```

La cartella `dati/` è esclusa da git: usala per tenere i file JSON esportati.
