# Anti-abuse a spoľahlivosť trhu – návrh

## Prečo
V logistike je najdrahší no-show. Produkt vyhrá, keď bude spoľahlivý, nie keď bude len “zoznam jobov”.

## Základné pravidlá
- Late cancel: po určitej hranici (napr. 24h) → flag a dočasné zníženie priority.
- No-show: tvrdý flag + dočasný ban z priority/ready skupiny.
- Firmy: storno potvrdených workerov na poslednú chvíľu tiež flagovať (férovosť).

## Mechaniky v produkte
- Reputácia/score:
  - start: neutral
  - + za potvrdenú dochádzku
  - - za late cancel/no-show
- “Ready” skupina:
  - worker opt-in (už máte)
  - firmy uvidia týchto ľudí prioritne a rýchlejšie ich matchnú

## Admin nástroje (MVP)
- Ban/unban worker/company
- Force-cancel application/job
- Poznámka k účtu (internal)

