# TODO – po prezentaci

## ✅ VYŘEŠENO – REST Countries v3.1 nahrazeno lokálními daty

v3.1 (celé v1–v4) bylo vypnuto (deprecation). Místo migrace na placené v5
přešlo na LOKÁLNÍ data:
- Do `FrontEnd/public/countries-full.json` doplněna pole `population`, `area`,
  `currencies`, `timezones` (zdroj: mledoze/REST v3.1 dump, spárováno přes cca3,
  250/250 zemí). Vlastní překlady (`name_cs/de`, `capital_cs/de`, ...) zachovány.
- `hooks/useCountryStats.ts` – živý `fetch(v3.1/alpha)` → lokální lookup
  `fetchCountriesData()`. Parsing beze změny (tvar dat sedí).
- `components/GuessCountryGame.tsx` – `fetch(v3.1/all)` odstraněn, statistiky
  čteny z lokálního countries-full. Smazán nepoužitý typ `CountryStatsData`.
- Build (`vite build`) prošel. Záloha: `countries-full.json.bak`.

Zbývá:
- [ ] Klik-test v prohlížeči: CountryDetails (encyklopedie) + Guess Country nápovědy.
- [ ] `useExchangeRate` používá fawazahmed0 (jsdelivr/pages.dev), NE REST Countries
  → mělo by fungovat; ověřit. Pokud ne, je to jiný problém (jiné API).
- [ ] Populace je ~2021 vintage (stačí pro kvíz). Časem zvážit obnovu z World Bank.
- [ ] HM a BV (neobydlené ostrovy) nemají populaci – OK.

## Bezpečnost (firestore.rules)

- [ ] **Vynutit `username_lower == username.lower()`** v kolekci `usernames`
  (`allow update` i `allow create`). Aktuálně se kontroluje jen `is string`,
  takže klient může podvrhnout `username_lower` a obejít case-insensitive
  kontrolu jedinečnosti přezdívky.
  Návrh:
  ```
  && request.resource.data.username_lower == request.resource.data.username.lower()
  ```

- [ ] **Přidat horní strop pro `streak`** v kolekcích `streaks` a `dailyStreaks`.
  Aktuálně jen `streak >= 0`, žádné maximum → anti-cheat limit (např. 200) je
  vynucený pouze na klientovi, ne na serveru.
  Návrh:
  ```
  && request.resource.data.streak <= 200
  ```

## Úklid mrtvého kódu

- [ ] **Odstranit / přepsat pravidlo `match /scores/{scoreId}`** s `score <= 25`
  a `gameMode == 'flag-match' | 'capital-match'`. Kolekce `scores` se už
  nepoužívá pro zápis (Flag Match píše do `streaks`). Jediná zmínka je úklid
  při mazání účtu v `AuthContext.tsx` (~ř. 479).

- [ ] **Mrtvý kód v `utils/guessCountryMath.ts`.** Nepoužité (neimportované):
  `bearingDegrees`, `bearingToCompassEmoji`, `getDistanceCategoryKey` a typ
  `DistanceCategoryKey`. Reálně se používají jen `haversineDistanceKm`,
  `directionEmoji`, `compareHintEmoji` a typ `GeoPoint` (v `GuessCountryGame.tsx`).

- [ ] **`getFirebaseErrorKey` v `utils/firebaseErrors.ts` je mrtvý kód** – nikde
  se neimportuje. Používá se jen `getFirebaseErrorMessage` (vrací EN text).
## utils/countries.ts – duplicity

- [ ] **`getBaseLanguage` definovaná 4×** – `localeRouting.ts` (export) + lokální
  kopie v `countries.ts`, `physicalFeatureLocalization.ts`, `terrainGeoFeatures.ts`.
  → Sjednotit do jedné (import z `localeRouting`), zbylé tři smazat.
- [ ] **`restAliases` (ř. 421) je mrtvý export** – nikde se neimportuje. Smazat.
- [ ] **`buildRestLookup` vs `buildCountryLookupWithCapitals`** sdílí ~80 % kódu
  (smyčka, `addEntry`, MAP_TO_DISPLAY varianty). Obě se používají, ale dají se
  sloučit do jedné parametrizované funkce.
- [ ] Zvážit, zda vlastní `name_cs`/`name_de` nejsou redundantní vůči
  `translations.ces`/`translations.deu` z REST API (kromě hlavních měst, která
  REST nepřekládá).


## Refaktor – zjednodušší zpracování chyb

- [ ] **Zbavit se okľuky text→klíč→překlad.** Dnes: AuthContext hází ANGLICKÝ
  text (`getFirebaseErrorMessage`), UI ho přes `translateErrors.errorMessageKeyMap`
  převádí zpět na i18n klíč a teprve pak překládá. Čistší: AuthContext by házel
  rovnou i18n klíč (přes existující `getFirebaseErrorKey`), UI by dělalo jen
  `i18n.t(key)`. Tím odpadne celá `errorMessageKeyMap` i duplicitní funkce.

## Možná vylepšení přesnosti

- [ ] **`directionEmoji` (guessCountryMath) je nepřesný** – používá rovinnou
  (equirektangulární) aproximaci místo sférického azimutu, na velké vzdálenosti
  a blízko pólů ukazuje zavádějící směr. Přesnou variantu (`bearingDegrees` +
  `bearingToCompassEmoji`) projekt už má napsanou, ale nepoužívá. Zvážit přepnutí.

- [ ] **Odstranit mrtvý `scores` cleanup v `deleteAccount` (`AuthContext.tsx` ~ř. 475-483).**
  Dotaz vždy vrátí prázdno (nic do `scores` nezapisuje). Bezpečné odstranit.

## DŮLEŽITÉ – neúplné mazání účtu (GDPR)

- [ ] **`deleteAccount` nemaže veškerá uživatelská data.** Aktuálně maže jen
  `usernames/{uid}`, (mrtvé) `scores` a Auth účet. Osiřelá data zůstávají v:
  `streaks`, `dailyStreaks`, `cardsMatchScores`, `dailyCardsMatchScores`,
  `shapeMatchScores`, `dailyShapeMatchScores`, `guessCountryStats`, `users/{uid}`.
  → Potenciální GDPR problém + zbytky jmen v žebříčcích. Doplnit mazání všech
  kolekcí (ideálně přes Cloud Function s Admin SDK kvůli atomicitě).

## Nepoužité závislosti (package.json)

- [ ] **`bootstrap`** (FrontEnd) – není nikde importován; `index.css` má vlastní
  "Bootstrap replacement utilities". Lze odstranit.
- [ ] **`circle-flags`** (FrontEnd, ^2.8.2) a **`react-circle-flags`** (root, ^0.0.25)
  – ani jeden balíček není importován. Vlajky se servírují jako lokální statické
  SVG z `FrontEnd/public/circle-flags/`. Obě závislosti lze pravděpodobně odstranit.

## Drobnosti (index.html / SEO)

- [ ] `<meta name="language" content="English" />` je natvrdo EN – nereflektuje
  aktuální jazyk (cs/de). Zvážit odstranění (nahrazeno `<html lang>` přes Helmet).

## utils/localeRouting.ts

- [ ] **`getLocalePrefixFromLanguage` je redundantní** – je to identita
  `getBaseLanguage` (volá se jen 1× interně v `buildLocalizedPath`). Nahradit
  volání za `getBaseLanguage(language)` a funkci smazat.
- [ ] **Typovat návraty na `LocalePrefix`** místo ručního `'en' | 'cs' | 'de'`
  (DRY). `getLanguageFromLocalePrefix` → `LocalePrefix | null`.

## utils/staticAssetVersion.ts

- [ ] **`fetchStaticJson` je mrtvý kód** – nikde se neimportuje. Přitom je to
  čistější helper, který by nahradil ~10× opakovaný vzor
  `fetch(withStaticDataVersion(path), {cache:'no-store'})` + ok check + json().
  → Buď zapojit všude (DRY), nebo smazat.
- [ ] **`cache: 'no-store'` sabotuje cachování → plýtvá Hosting bandwidthem.**
  `firebase.json` nastavuje na geo-JSON `immutable, max-age=1rok`, ale fetche je
  stahují s `cache: 'no-store'`, což immutable cache na klientu přebije → každý
  uživatel stahuje velká data při každém načtení znovu.
  → OPRAVA: odstranit `cache: 'no-store'`, nechat `?v=` + immutable hlavičky.
  Pak: během deploye cache (0 bandwidth), po deployi nové `?v=` → 1× re-download.
  (`?v=` je v pořádku; globální razítko buildu pro řídké deploye stačí.)
- [ ] Mikro: `getStaticDataVersion` volá `.trim()` 2×; uložit do proměnné.

## Infrastruktura (Cloudflare)

## utils/dataPrefetch.ts + leaderboardUtils.ts + sharedStyles.ts

- [ ] **Žebříček = 10 readů na dotaz.** Top 10 dotaz vrací 10 dokumentů = 10
  Firestore readů (5 dotazů v prefetchi = až 50 readů/session na hover).
  → Optimalizace: agregovat top 10 do JEDNOHO dokumentu (1 read). K tomu už
  existuje scaffold: kolekce `leaderboard` v firestore.rules (`write: if false`,
  jen server). Cloud Function by ji udržovala. Zatím NEzapojeno.
- [ ] **`getContainerGap` (sharedStyles) je mrtvý kód** – nikde se neimportuje.
- [ ] **`getPrefetchedData` a `isPrefetched` (dataPrefetch) jsou mrtvý kód** –
  `Leaderboard.tsx` čte `prefetchCache` přímo. Buď používat gettery a `prefetchCache`
  udělat privátní (čistší), nebo gettery smazat.
- [ ] **`saveShapeMatchScore` je mrtvý kód + osiřelé kolekce/indexy.** Funkce se
  nikde nevolá; kolekce `shapeMatchScores`/`dailyShapeMatchScores` nikdo nezapisuje
  → osiřelé i jejich indexy ve `firestore.indexes.json`. Živá cesta:
  `saveCardsMatchScore` → `cardsMatchScores`. Pozůstatek po přejmenování hry
  ShapeMatch → CardsMatch (route/SEO `/game/shape-match` zůstaly z SEO důvodů).
  → Smazat funkci + osiřelé kolekce + indexy.
- [ ] **OTÁZKA: ukládá Physical Geography vůbec skóre?** `PhysicalGeoGame.tsx`
  nemá žádný `setDoc`/save. Ověřit, zda má mít žebříček.
- [ ] **`saveShapeMatchScore` vs `saveCardsMatchScore` duplicita** – identická
  logika "all-time + daily, ulož když lepší". Sjednotit do 1 parametrizované funkce.
- [ ] **`user: any`** v leaderboardUtils – netypováno, použít Firebase `User` typ.
- [ ] **sharedStyles: hover přes JS** (`onMouseEnter/Leave`) by byl v `.css` jeden
  řádek `:hover`. Statické styly → `.css`; jen dynamicky počítané rozměry nechat v JS.

- [ ] **Cloudflare necachuje JSON** – ověřeno v DevTools: `cf-cache-status: DYNAMIC`
  na `countries-full.json`. Cloudflare defaultně cachuje jen `.js/.css/obrázky`,
  ne `.json`. → Přidat Cache Rule pro `*.json` (resp. `/countries-*.json`,
  `/GeoLand.json`, `/FinalMarines10m.json`, `/fixed_rivers.json`, `/lakes.json`,
  `/region_polys/*`). Pozn.: `x-cache: HIT` je Firebase CDN (Fastly), NE Cloudflare
  – a do Firebase bandwidth kvóty se počítá tak jako tak. Dokud je `DYNAMIC` +
  `no-store`, Firebase dostává zásah při každém načtení.
