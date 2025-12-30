# Beta funkcie

Táto stránka slúži ako prehľad funkcií, ktoré sú označené ako **Beta**.

## Zmluvy (Beta)

- Firma má editor šablóny zmluvy a archív dokumentov.
- Zmluva je medzi **firmou a pracovníkom**; portál poskytuje nástroj na tvorbu, podpis a archiváciu.
- Zmluva sa vygeneruje automaticky pri potvrdení pracovníka na smenu.

## Dochádzka (Beta)

- Firma potvrdzuje odpracované smeny (už existujúci flow).
- Pracovník vie po skončení smeny potvrdiť dochádzku + voliteľnú poznámku.

## Manuálny klikací test (Beta)

1. Priprav demo dáta: `npm run db:up && npm run db:deploy && npm run db:seed`
2. Spusti appku: `npm run dev`
3. Firma: `company@demo.local` / heslo z `DEV_SEED_PASSWORD` (default `Heslo123`)
   - Otvor `Zmluvy (Beta)` → nastav šablónu → `Uložiť`
   - Otvor `Môj kalendár` alebo `Zmeny` → otvor detail smeny → potvrď prihlášku pracovníka
   - Over: `Zmluvy (Beta)` → v archíve je nový dokument pre potvrdenú prihlášku
4. Pracovník: `worker@demo.local` / rovnaké heslo
   - Otvor `Nahodené smeny` → `Podpísať zmluvu (Beta)` → podpíš menom
   - Po skončení smeny: v detaile “Dochádzka (Beta)” → `Potvrdiť odpracovanú smenu`
