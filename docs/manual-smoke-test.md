# Manuálny smoke test (klikací)

Toto je krátky „napodobnený používateľ“ test na overenie základných tokov (company + worker) v UI.

## Predpoklady

- Beží databáza: `npm run db:up`
- Migrácie + seed: `npm run db:deploy && npm run db:seed`
- App: `npm run dev`

Seed vytvorí demo účty (heslo je `DEV_SEED_PASSWORD` alebo default `Heslo123`):
- `company@demo.local`
- `worker@demo.local`
- `admin@demo.local`

## Company flow (dashboard + zmeny)

1. Prihlás sa ako `company@demo.local` → otvor `http://localhost:3000/company/dashboard`.
2. V kalendári klikni na dnešný deň (seed vytvára demo job na dnešný deň).
3. V detaile dňa skontroluj:
   - Vidíš job a prihlásených ľudí (aplikácie).
   - Pri prihlásenom človeku vieš kliknúť `Potvrdiť` (ak je v stave PENDING).
4. Po potvrdení:
   - Ten istý človek má dostupnú akciu `Potvrdiť odpracovanú`.
   - Kliknutie nastaví „odpracované“ (v UI sa to má hneď prejaviť).
5. Pridanie zmeny:
   - V detaile dňa klikni `Pridať zmenu` (ak je k dispozícii) a vytvor zmenu.

## Worker flow (jobs → prihláška → status)

1. Prihlás sa ako `worker@demo.local` → otvor `http://localhost:3000/worker/jobs`.
2. Otvor demo job a klikni `Prihlásiť sa`.
3. Otvor `http://localhost:3000/worker/applications` a over, že prihláška existuje.
4. Vráť sa do company účtu a potvrď prihlášku (krok vyššie), potom refresh worker stránky:
   - Status prihlášky sa zmení na ACCEPTED/CONFIRMED (podľa UI).

## Rýchla kontrola oprávnení (bezpečnostné minimum)

- Ako `worker@demo.local` sa nesmieš dostať na `http://localhost:3000/company/dashboard`.
- Ako `company@demo.local` sa nesmieš dostať na `http://localhost:3000/worker/dashboard`.
- Neautorizované volania musia vracať `401/403` (overené aj v testoch).

