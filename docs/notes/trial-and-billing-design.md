# Free trial (3 inzeráty) – návrh logiky

## Cieľ
Firmy platia za prístup k trhu a nástrojom. Trial má byť jednoduchý, predvídateľný a ťažko zneužiteľný.

## Definícia “inzerátu”
Odporúčanie: počítať iba “publikované/otvorené” zmeny (status OPEN/FULL), nie drafty.

## Návrh pravidiel
- `trialJobsLimit = 3`
- Firma môže počas trialu publikovať max 3 zmeny.
- Po vyčerpaní limitu:
  - môže spravovať existujúce zmeny, prihlášky, exporty, históriu,
  - ale nemôže vytvoriť/publikovať ďalšiu zmenu bez plánu.

## Technická implementácia (keď sa bude robiť)
- Údaje na `CompanyProfile` (alebo `CompanySubscription` tabuľka):
  - `trialJobsLimit`, `trialJobsUsed`, `trialStartedAt`, `trialEndedAt`
  - `planStatus: TRIAL|ACTIVE|PAST_DUE|CANCELED`
- Enforcement bod: v service, ktorá vytvára job (a/alebo pri `status=OPEN`).
- Admin override: manuálne zvýšenie limitu počas pilotu.

## Riziká / abuse
- Viac účtov jednej firmy → riešiť overením firmy a schvaľovaním (už máte).
- “Recyklovanie” zrušených jobov → jasne definovať, či sa storno vracia do limitu (odporúčanie: nie).

