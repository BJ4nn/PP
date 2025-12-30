# MVP checklist (pilot-ready)

## Definícia MVP
Pilot pre 1–3 firmy v jednom regióne, kde viete reálne:
- vytvoriť smenu → prihlášky → potvrdenie → odpracovanie → potvrdenie → export hodín,
- a viete udržať spoľahlivosť trhu (no-show/late cancel) bez manuálneho chaosu.

Aktuálny odhad hotovosti: ~70% (bez platieb a bez “dôveryhodnej” dochádzky).

## Must-have pred pilotom
### 1) Monetizácia / trial (Beta UI už existuje)
- Trial limit: 3 publikované zmeny zdarma (na firmu).
- Enforcement: po limite blokovať “publikovať/otvoriť” nové zmeny (nie blokovať históriu).
- Upgrade flow: vybrať plán → zaplatiť → aktivovať (aspoň manuálne v 1. iterácii).
- Admin override: nastaviť limit/plán firme (pre pilot).

### 2) Dochádzka 1.0 (dôveryhodná)
- Check-in/out alebo jednoduchý dôkaz (QR/PIN na mieste).
- Časové okná (napr. check-in max ±30 min).
- Dispute flow: keď sa firma a worker nezhodnú, nech je to riešiteľné.

### 3) Anti-abuse / spoľahlivosť
- No-show a late cancel pravidlá + flagovanie.
- Limity na spam (prihlášky, tvorba jobov, notifikácie).
- Reputácia (aspoň interný score) a prioritizácia “ready” ľudí.

### 4) Prevádzka
- Audit log (kto čo spravil).
- Error tracking + základné alerty.
- Zálohy DB a plán obnovy.

### 5) Firma ako tím
- Viac používateľov pod jednou firmou (owner/manager), aby sa to dalo reálne používať na prevádzke.

## Should-have (hneď po pilote)
- Automatizované faktúry/daňové doklady (ak budete brať platby).
- SLA metriky: time-to-fill, fill-rate, no-show rate, conversion (apply→confirm).
- Lepší “discovery” pre firmy: šablóny smien, hromadné pridanie, copy shift.
- Worker “preferovaná firma” (pracovné “priateľstvo”): opt-in, priority ponuky.

## Nice-to-have (neskôr)
- PDF export zmlúv, verzovanie šablón, pokročilé podpisy.
- In-app chat/komunikácia (alebo prepojenie na SMS/WhatsApp).
- Automatizované riešenie sporov a výpočty kompenzácií.

