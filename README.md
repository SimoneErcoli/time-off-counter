# Time Off Counter

**English** · [Italiano](README.it.md)

A small web app for tracking **paid leave (ferie)**, **short leave (permessi)** and **reduced working hours (ROL)** month by month, as they appear on an Italian payslip. It replaces a hand-maintained spreadsheet: every month you enter the hours you used, and the app keeps the running balance in hours and in days.

🔗 Live: **https://www.simoneercoli.it/time-off-counter/**

---

## Features

- **Monthly entries**: record the hours used for each type of leave, in hours or in days. The hours earned are pre-filled with the monthly accrual and can be edited, for example for an opening balance or an unusual month.
- **Live preview**: before saving, the form shows how much the balance of each type changes that month.
- **Summary**: the balance of ferie, permessi and ROL in hours and days, the total hours earned and used, and the **combined total** of all three in hours and days.
- **History by year**: for each month you see the change for every type, the month total and the running balance (hours and days). Each year shows its overall change. Every month can be edited or deleted.
- **JSON export / import**: save a snapshot of all your data at the end of the month and load it again the next month, or on another computer.
- **Settings**: monthly accrual for each type and how many hours make a working day.
- **Automatic local save**: data is also kept in the browser's `localStorage`, so reloading the page doesn't lose anything.
- Light and dark theme (follows the system), works on mobile.

## How the numbers are calculated

Each month records, for each type, the hours **earned** and the hours **used**:

```
monthly change = earned − used
balance        = sum of all monthly changes
combined total = ferie balance + permessi balance + ROL balance
days           = hours ÷ hours per day
```

Default settings (they match the original spreadsheet):

| Type     | Earned per month |
|----------|------------------|
| Ferie    | 13.33 h          |
| Permessi | 2.67 h           |
| ROL      | 6 h              |
| 1 day    | 8 h              |

Example: a month with 8 h of ferie used gives a ferie change of `13.33 − 8 = +5.33 h`.

## Monthly workflow

1. Open the app. If the browser has no data (new computer, cleared cache…), click **Importa JSON** and load last month's file.
2. Under **Registra un mese**, check the proposed month (it is the month after the last one recorded) and enter the hours used.
3. Click **Aggiungi mese**.
4. Click **Esporta JSON** to download `ferie-rol-permessi_YYYY-MM.json` and keep it somewhere safe.

> ⚠️ Data lives only in the browser where you entered it. Each address (for example `localhost` and the live site) has its own separate storage. The exported JSON is your backup: keep it.

## JSON format

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
      "note": "optional"
    }
  ]
}
```

- `month` goes from 1 to 12, and each year/month pair may appear only once.
- `maturato` = hours earned, `goduto` = hours used.
- On import the file is validated. If it's malformed, an error message explains why and the current data is left untouched. Importing **replaces** the current data, after asking for confirmation.

## Development

Requirements: Node.js 20+.

```bash
npm install
npm run dev
```

Then open http://localhost:3000/time-off-counter. The app is served under `/time-off-counter` because of `basePath`.

### Tech stack

- [Next.js 16](https://nextjs.org) (App Router) with static export
- React 19, TypeScript
- Tailwind CSS 4

### Project structure

```
src/
├── app/
│   ├── layout.tsx          # HTML shell and metadata
│   ├── page.tsx            # renders <TimeOffApp />
│   └── globals.css         # theme (light/dark) and base components
├── components/
│   ├── TimeOffApp.tsx      # state, local saving, import/export
│   ├── SummaryCards.tsx    # balances in hours and days
│   ├── EntryForm.tsx       # add / edit a month
│   ├── EntriesTable.tsx    # history grouped by year
│   └── SettingsPanel.tsx   # monthly accrual and hours per day
└── lib/
    └── timeoff.ts          # types, calculations, JSON validation, localStorage
```

All calculation logic is in `src/lib/timeoff.ts` and has no React dependencies.

## Build and deploy

```bash
npm run build
```

This produces a fully static site in `out/`: no server or database needed. Upload **the contents** of `out/` to the `time-off-counter/` folder on your hosting.

To publish under a different path, change `basePath` in `next.config.ts`. To publish at the domain root, remove it.

Deployment notes:

- **The production build uses webpack** (`next build --webpack`) instead of Turbopack. That way `next.config.ts` can give the JS files names made of letters and digits only. On the current hosting (Aruba), a Turbopack file named like `1_i74jcjrmr-o.js` was never served (404), and that blocked the whole app. Development (`npm run dev`) still uses Turbopack.
- When updating, **delete the old `_next/` folder** on the server before uploading, then reload with Cmd/Ctrl+Shift+R.
- `npm start` does not work with a static export. To try the build locally, serve it from a folder named like the `basePath`:

  ```bash
  mkdir -p /tmp/site && rm -rf /tmp/site/time-off-counter && cp -R out /tmp/site/time-off-counter
  ```

  ```bash
  python3 -m http.server 4173 --directory /tmp/site
  ```

  and open http://localhost:4173/time-off-counter/.

## Privacy

There is no backend: data never leaves your browser unless you export it. The `dati/` folder is in `.gitignore`, so you can keep your exported JSON files inside the project without committing them.
