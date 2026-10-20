# Contatore Ferie · Permessi · ROL

[English](README.md) · **Italiano**

Una piccola web app per tenere il conto di **ferie**, **permessi** e **ROL** mese per mese, come risultano dalla busta paga. Sostituisce il foglio di calcolo aggiornato a mano: ogni mese inserisci le ore godute e l'app tiene il saldo in ore e in giorni.

🔗 Online: **https://www.simoneercoli.it/time-off-counter/**

---

## Funzionalità

- **Registrazione mensile**: inserisci le ore godute per ogni voce, in ore o in giorni. Le ore maturate sono già compilate con la maturazione mensile e puoi cambiarle, ad esempio per un saldo iniziale o un mese particolare.
- **Anteprima immediata**: prima di salvare, il modulo mostra di quanto cambia il saldo di ogni voce in quel mese.
- **Riepilogo**: saldo di ferie, permessi e ROL in ore e giorni, totale ore maturate e godute, e **totale complessivo** delle tre voci in ore e giorni.
- **Storico per anno**: per ogni mese vedi la variazione di ciascuna voce, il totale del mese e il saldo progressivo (ore e giorni). Ogni anno mostra la sua variazione complessiva. Ogni mese si può modificare o eliminare.
- **Esporta / Importa JSON**: a fine mese salvi una copia di tutti i dati e il mese dopo la ricarichi, anche da un altro computer.
- **Impostazioni**: maturazione mensile di ogni voce e quante ore valgono un giorno lavorativo.
- **Salvataggio automatico**: i dati restano anche nel `localStorage` del browser, quindi ricaricando la pagina non si perde nulla.
- Tema chiaro e scuro (segue quello del sistema), funziona anche da cellulare.

## Come vengono fatti i conti

Ogni mese registra, per ogni voce, le ore **maturate** e le ore **godute**:

```
variazione del mese = maturate − godute
saldo               = somma di tutte le variazioni mensili
totale complessivo  = saldo ferie + saldo permessi + saldo ROL
giorni              = ore ÷ ore per giorno
```

Impostazioni predefinite (le stesse del foglio originale):

| Voce     | Maturate al mese |
|----------|------------------|
| Ferie    | 13,33 h          |
| Permessi | 2,67 h           |
| ROL      | 6 h              |
| 1 giorno | 8 h              |

Esempio: un mese con 8 h di ferie godute dà una variazione ferie di `13,33 − 8 = +5,33 h`.

## Come si usa ogni mese

1. Apri l'app. Se il browser non ha dati (computer nuovo, cache svuotata…), clicca **Importa JSON** e carica il file del mese precedente.
2. In **Registra un mese** controlla il mese proposto (è quello dopo l'ultimo registrato) e inserisci le ore godute.
3. Clicca **Aggiungi mese**.
4. Clicca **Esporta JSON** per scaricare `ferie-rol-permessi_AAAA-MM.json` e conservalo.

> ⚠️ I dati restano solo nel browser in cui li hai inseriti. Ogni indirizzo (ad esempio `localhost` e il sito online) ha un archivio separato. Il JSON esportato è il tuo backup: conservalo.

## Formato del file JSON

```json
{
  "app": "time-off-counter",
  "version": 1,
  "exportedAt": "2026-10-20T10:00:00.000Z",
  "settings": {
    "maturazioneMensile": { "ferie": 13.33, "permessi": 2.67, "rol": 6 },
    "oreGiorno": 8
  },
  "entries": [
    {
      "id": "7b8f6cc5-5570-4213-8412-d2924749951d",
      "year": 2026,
      "month": 9,
      "maturato": { "ferie": 13.33, "permessi": 2.67, "rol": 6 },
      "goduto": { "ferie": 8, "permessi": 0, "rol": 7 },
      "note": "facoltativa"
    }
  ]
}
```

- `month` va da 1 a 12 e ogni coppia anno/mese può comparire una sola volta.
- All'importazione il file viene controllato. Se non è valido, un messaggio spiega il motivo e i dati attuali restano come sono. L'importazione **sostituisce** i dati attuali, dopo una conferma.

## Sviluppo

Requisiti: Node.js 20 o successivo.

```bash
npm install
npm run dev
```

Poi apri http://localhost:3000/time-off-counter. L'app è servita sotto `/time-off-counter` per via del `basePath`.

### Tecnologie

- [Next.js 16](https://nextjs.org) (App Router) con export statico
- React 19, TypeScript
- Tailwind CSS 4

### Struttura del progetto

```
src/
├── app/
│   ├── layout.tsx          # struttura HTML e metadati
│   ├── page.tsx            # mostra <TimeOffApp />
│   └── globals.css         # tema (chiaro/scuro) e componenti di base
├── components/
│   ├── TimeOffApp.tsx      # stato, salvataggio locale, import/export
│   ├── SummaryCards.tsx    # saldi in ore e giorni
│   ├── EntryForm.tsx       # aggiunta / modifica di un mese
│   ├── EntriesTable.tsx    # storico raggruppato per anno
│   └── SettingsPanel.tsx   # maturazione mensile e ore per giorno
└── lib/
    └── timeoff.ts          # tipi, calcoli, controllo del JSON, localStorage
```

Tutta la logica di calcolo è in `src/lib/timeoff.ts` e non dipende da React.

## Build e pubblicazione

```bash
npm run build
```

Il comando crea in `out/` un sito completamente statico: non servono server né database. Carica **il contenuto** di `out/` nella cartella `time-off-counter/` del tuo hosting.

Per pubblicare in un altro percorso cambia `basePath` in `next.config.ts`. Per pubblicare nella radice del dominio toglilo.

Note sulla pubblicazione:

- **La build di produzione usa webpack** (`next build --webpack`) e non Turbopack. Così `next.config.ts` può dare ai file JS nomi fatti solo di lettere e cifre. Sull'hosting attuale (Aruba) un file di Turbopack chiamato ad esempio `1_i74jcjrmr-o.js` non veniva mai servito (404), e questo bloccava tutta l'app. In sviluppo (`npm run dev`) si usa ancora Turbopack.
- Quando aggiorni, **cancella la vecchia cartella `_next/`** sul server prima di caricare, poi ricarica la pagina con Cmd/Ctrl+Shift+R.
- `npm start` non funziona con l'export statico. Per provare la build in locale, servila da una cartella con lo stesso nome del `basePath`:

  ```bash
  mkdir -p /tmp/site && rm -rf /tmp/site/time-off-counter && cp -R out /tmp/site/time-off-counter
  ```

  ```bash
  python3 -m http.server 4173 --directory /tmp/site
  ```

  e apri http://localhost:4173/time-off-counter/.

## Privacy

Non c'è nessun server: i dati non escono dal browser, a meno che tu non li esporti. La cartella `dati/` è in `.gitignore`, quindi puoi tenere i JSON esportati dentro il progetto senza rischiare di metterli nel repository.
