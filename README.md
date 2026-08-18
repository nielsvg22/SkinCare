# Verzorgingsroutine

Een mobile-first webapp om je dagelijkse verzorgingsroutine bij te houden:
haar, huid, ogen, gezicht, scheren en productvoorraad. Gebouwd om als PWA op
je iPhone-beginscherm te draaien en aan te voelen als een lichte, premium
native app. Ondersteunt meerdere accounts (bijv. jij en je vriendin), ieder
met volledig gescheiden producten, voorraad en voortgang.

## Stack

- **Next.js 16** (App Router, Turbopack) + **TypeScript** (strict) + **React 19**
- **Tailwind CSS v4** met een eigen designsysteem (geen default paars/blauw thema)
- Zelf geschreven shadcn-stijl UI-componenten op basis van **Radix UI**
- **Supabase**: Postgres-database (per account afgeschermd via Row Level
  Security), e-mail/wachtwoord-authenticatie en Storage voor productfoto's
  en progressiefoto's
- **Zustand** als client-side cache boven op Supabase (optimistic updates —
  de UI voelt instant, elke wijziging wordt op de achtergrond weggeschreven)
- **web-push** + Vercel Cron voor echte ochtendmeldingen, ook als de app dicht is
- **Framer Motion**, **Lucide** iconen, **Zod** voor validatie van back-ups
- PWA: `manifest.json`, gegenereerde app-iconen, service worker (offline-cache + push)

## Projectstructuur

```
app/
  (app)/                    Auth-verplichte routes, met bottom nav
    page.tsx                  Vandaag (dashboard)
    week/, products/, progress/, settings/
  login/, signup/            Auth-schermen (geen bottom nav)
  auth/confirm/               E-mailbevestigingslink-handler
  api/push/                  subscribe, unsubscribe, send-morning (cron target)
components/
  ui/                        Eigen shadcn-stijl primitives
  routine/, products/, week/, shopping/, checkin/, photos/, stats/, settings/, nav/, layout/, pwa/, auth/
lib/
  types.ts                   Centraal datamodel
  store.ts                   Zustand store — houdt Supabase en UI gesynchroniseerd
  supabase/                  client.ts/server.ts (browser/server client), middleware.ts,
                               mappers.ts (DB ↔ app-types), repo.ts (alle queries)
  storage/supabase-storage.ts Upload/verwijderen van foto's in Supabase Storage
  push/subscribe.ts           Web Push-abonnement vanuit de browser
  utils/                      Pure functies: routine.ts, streak.ts, consumption.ts,
                               insights.ts (streak-effect), date.ts, format.ts, validate.ts
supabase/schema.sql          Volledige database-schema + RLS-policies (eenmalig uitvoeren)
public/products/             Standaard productafbeeldingen
proxy.ts                     Auth-guard (Next 16's opvolger van middleware.ts)
vercel.json                  Cron-configuratie voor de ochtendmelding
```

De UI bevat geen business-logica: routine-opbouw, streaks, voorraadschattingen
en de "streak-effect"-inzichten zitten volledig in `lib/utils/*` en zijn
onafhankelijk van React te gebruiken/testen.

## Eenmalig opzetten

### 1. Supabase-project aanmaken

1. Ga naar [supabase.com](https://supabase.com) en maak een gratis account/project
   (kies een regio dicht bij jullie, bijv. Frankfurt).
2. Open **SQL Editor** → **New query**, plak de volledige inhoud van
   [`supabase/schema.sql`](supabase/schema.sql) en klik **Run**. Dit maakt alle
   tabellen, security-policies, de storage-bucket voor foto's en een trigger
   die bij elke nieuwe registratie automatisch een profiel + startproducten
   aanmaakt.
3. Ga naar **Settings → API** en kopieer:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (geheim, nooit client-side gebruiken)
4. (Optioneel, aanbevolen voor jullie tweeën) Ga naar **Authentication →
   Providers → Email** en zet **Confirm email** uit als je niet op
   bevestigingsmails wilt wachten bij het aanmaken van je 2 accounts. Laat 'm
   aan als je dat wel prettig vindt.

### 2. Omgevingsvariabelen

Kopieer `.env.local.example` naar `.env.local` en vul de Supabase-waarden in.
De Web Push-sleutels (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`,
`CRON_SECRET`) staan al ingevuld in je lokale `.env.local` — die zijn al voor
je gegenereerd en hoef je niet te wijzigen (wel meenemen naar Vercel, zie
hieronder).

### 3. Lokaal starten

```bash
npm install
npm run dev
```

## Naar Vercel deployen

Ik kan geen Vercel/Supabase-account voor je aanmaken of inloggen — dat moet je
zelf doen. Dit project staat al klaar om te deployen zodra jij dat doet:

```bash
vercel login
vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add NEXT_PUBLIC_VAPID_PUBLIC_KEY production
vercel env add VAPID_PRIVATE_KEY production
vercel env add VAPID_SUBJECT production
vercel env add CRON_SECRET production
vercel deploy --prod
```

(`vercel env add` vraagt de waarde interactief — pak die uit je `.env.local`.
Je kunt dit ook via de Vercel-dashboard **Settings → Environment Variables** doen.)

De twee cron-taken in `vercel.json` (voor de ochtendmelding — zie hieronder
waarom er twee zijn) worden automatisch actief na deze deploy; niets extra's
nodig in het dashboard.

Zodra de deploy live is: open de URL op je iPhone in **Safari**, "Zet op
beginscherm" (zie hieronder), maak je eigen account aan, en stuur je vriendin
de link zodat zij haar eigen account kan aanmaken.

## Als PWA op je iPhone installeren

1. Open de gedeployde URL in **Safari** op je iPhone (verplicht Safari — "Add
   to Home Screen" met standalone-modus werkt op iOS alleen daar).
2. Tik op het deel-icoon (vierkant met pijl omhoog) onderin.
3. Kies **"Zet op beginscherm"**.
4. Open de app vanaf het beginscherm-icoon: hij start zonder Safari-UI, met
   eigen statusbalk-integratie en safe-area padding voor de notch/home-indicator.

## Als native app via AltStore PAL (optioneel)

De PWA hierboven werkt al als een volwaardige app. Wil je 'm daarnaast ook als
een echt gecompileerd `.ipa`-bestand via [AltStore PAL](https://altstore.io)
(EU-marketplace, geen computer nodig) op je iPhone — dat kan, maar dat is een
apart, groter traject met eigen vereisten:

**Wat er al staat (door mij opgezet):**
- `capacitor.config.ts` + `ios/` — een native Xcode-project (Capacitor) dat
  een WebView toont die naar de live site wijst. Geen aparte build/bundel
  nodig omdat de app server-functies gebruikt (login, database) die niet
  statisch te exporteren zijn.
- `codemagic.yaml` — een cloud-Mac build-configuratie (nodig omdat ik hier
  op Windows geen Xcode kan draaien) die het project bouwt en signeert tot
  een `.ipa`.
- `altstore/source.json` — een template voor de "source" die je in AltStore
  PAL toevoegt, zodat de app daar verschijnt.

**Wat jij nog moet doen (vereist jouw eigen accounts/Apple ID — dat kan en
mag ik niet voor je invullen):**

1. Maak een gratis account op [codemagic.io](https://codemagic.io) en
   koppel de `nielsvg22/SkinCare`-repo.
2. In Codemagic → **Team settings → Code signing identities**: upload je
   Apple Distribution-certificaat en een Ad Hoc (of Development)
   provisioning profile voor app-id `nl.nielsvg22.verzorgingsroutine`, in
   een groep genaamd `ios_signing`. Heb je nog geen Apple Developer-account,
   dan kan dit ook (beperkter, met een gratis Apple ID) — het certificaat
   verloopt dan elke 7 dagen en moet je opnieuw laten signeren; een betaald
   Apple Developer-account (€99/jaar) voorkomt dat.
3. Start de `ios-altstore`-workflow in Codemagic. Het `.ipa`-bestand komt
   als build-artifact beschikbaar (of zet 'm in een GitHub Release).
4. Vul in `altstore/source.json` de velden `version`, `date`, `downloadURL`
   (link naar dat `.ipa`) en `size` in, en host dit JSON-bestand ergens
   publiek bereikbaar (bijv. ook als GitHub Release-asset, of via
   `raw.githubusercontent.com`). Check het resultaat tegen
   [AltStore's source-spec](https://faq.altstore.io/developers/make-a-source)
   voordat je 'm gebruikt.
5. In AltStore PAL op je iPhone: voeg de URL naar dat `source.json` toe als
   custom source, en installeer de app eruit.

## Accounts & data-scheiding

Elk account (via **/signup**) krijgt een volledig eigen set producten,
voorraad, routine-historie, streaks, logboek en foto's — niets wordt gedeeld
tussen accounts. Alle tabellen zijn afgeschermd met Postgres Row Level
Security: een gebruiker kan letterlijk nooit andermans rijen opvragen, ook
niet via een omweg in de API.

## Eigen productfoto's toevoegen

- **Uploaden vanuit de app** (aanbevolen): bij "Product toevoegen"/"Bewerken"
  of bij een progressiefoto kun je een foto uploaden. Deze gaat naar je eigen
  map in Supabase Storage en de link wordt opgeslagen bij het product/de foto.
- **Vaste standaardafbeeldingen**: zet een `.png`/`.jpg` in `public/products/`
  en verwijs ernaar via `image: "/products/bestand.png"` in
  `lib/data/products.ts` (dit is de startset die nieuwe accounts krijgen).

Ontbreekt een afbeelding? Dan valt de UI altijd netjes terug op een
placeholder met een categorie-icoon — de app breekt nooit op een missende
afbeelding.

## Ochtendmelding om 07:00 — hoe dit werkt (en de beperkingen)

Zodra je "Herinneringen" aanzet in Instellingen, abonneert je toestel zich op
**Web Push** (niet alleen een lokale timer): een Vercel Cron-taak stuurt
serverside een echte melding, ook als de app/PWA op dat moment gesloten is.

Twee praktische beperkingen, allebei van het gratis Vercel-plan, niet van deze
app:

1. **Tijdvenster, geen exacte minuut**: Vercel's gratis cron-jobs draaien
   hooguit 1× per dag en Vercel garandeert alleen "ergens binnen dat uur", dus
   de melding kan tussen 07:00–07:59 binnenkomen. Voor minuut-precisie is een
   Vercel Pro-abonnement nodig.
2. **Zomer-/wintertijd**: een gratis cron-tijd is vast in UTC, terwijl 07:00
   Nederlandse tijd in de zomer een ander UTC-moment is dan in de winter. Deze
   app lost dat op met twee cron-taken (05:00 en 06:00 UTC) die allebei
   `/api/push/send-morning` aanroepen; de functie zelf controleert de actuele
   Amsterdamse tijd en verstuurt alleen als het echt rond 07:00 lokale tijd is
   — dus je krijgt 'm maar één keer, jaarrond correct.

Je ochtend-tijdstip in Instellingen bepaalt dit (standaard 07:00); wijzig het
daar als je een ander tijdstip wilt.

## Data back-uppen (export/import)

Instellingen → Data:

- **Data exporteren** downloadt al je gegevens als één JSON-bestand — handig
  als extra back-up naast Supabase.
- **Data importeren** leest zo'n bestand terug in, valideert de structuur
  (via Zod) en overschrijft daarna al je Supabase-data voor dit account, na
  expliciete bevestiging.

## Ontwerp

Warme, frisse, mannelijke stijl geïnspireerd op Apple Health, moderne
skincare-apps en premium barbershops: warm off-white achtergrond, lichtblauw/
zachtgroen/beige/oranje accenten, donkerblauw voor belangrijke tekst,
afgeronde kaarten, subtiele schaduwen en veel witruimte. Licht, donker en
systeem-thema worden ondersteund; donkere modus is een eigen warme
donker-palet, geen simpele omgekeerde kleuren.
