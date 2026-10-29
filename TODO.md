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

- [x] **Vynutit `username_lower == username.lower()` a délku 1–50 / 3–50 znaků** v kolekci `usernames`
  (`allow update` i `allow create`, odpovídá existujícímu frontendu a Google OAuth).
- [x] **Přidat horní strop pro `streak`** v kolekcích `streaks` a `dailyStreaks` (`streak <= 250`, pokrývá všech 250 entit včetně případného rozšíření závislých území). Vynucena shoda ID dokumentu (`streakId == uid`, `dailyStreakId == date + '_' + uid`) zabraňující griefingu cizích záznamů.
- [x] **Oprava a rozumné sanity meze pro skóre a herní statistiky (`firestore.rules`)**:
  - `cardsMatchScores` / `dailyCardsMatchScores`: odstraněn umělý strop 50 000 (hráči běžně dosahují přes 130 000–200 000 bodů díky násobičům sérií). Nastaven anti-overflow strop `score <= 10000000` (a `score >= 0`), který chrání před poškozením layoutu a přetečením čísla v DB, aniž by omezoval legitimní gameplay. Pro `dailyCardsMatchScores` navíc vynuceno `dailyScoreId == date + '_' + uid`, což znemožňuje zablokování cizího denního skóre podvržením ID.
  - `guessCountryStats`: odstraněn nesmyslný strop 250 (šlo o mylnou záměnu počtu států světa s celoživotním čítačem vyhraných her, který roste neomezeně s každou novou hrou). Nastaven pouze anti-overflow sanity check `countriesGuessed <= 10000000` (a `countriesGuessed >= 0`). Použito bezpečné čtení `request.resource.data.get('username', 'Anonymous')` a rozdělení create/update pravidel pro prevenci chyb u částečných patchů (`merge: true`).

## Úklid mrtvého kódu

- [x] **Odstraněno pravidlo `match /scores/{scoreId}`** i nepoužívaná pravidla pro
  `shapeMatchScores` a `dailyShapeMatchScores` z `firestore.rules`.
- [x] **Mrtvý kód v `utils/guessCountryMath.ts`.** Smazány `getDistanceCategoryKey` a `DistanceCategoryKey`.
  `directionEmoji` přepnuto na přesný `bearingDegrees` + `bearingToCompassEmoji` (s prahem 1e-5 pro shodu souřadnic).
- [x] **Odstraněn mrtvý `scores` cleanup v `deleteAccount` (`AuthContext.tsx`).**
- [ ] **`getFirebaseErrorKey` v `utils/firebaseErrors.ts` je mrtvý kód** – nikde
  se neimportuje. Používá se jen `getFirebaseErrorMessage` (vrací EN text).

## utils/countries.ts – duplicity

- [x] **`getBaseLanguage` definovaná 4×** – exportována z `localeRouting.ts`,
  importována a využita v `countries.ts`, `physicalFeatureLocalization.ts`, `terrainGeoFeatures.ts`.
- [x] **`restAliases` je mrtvý export** – smazáno.
- [ ] **`buildRestLookup` vs `buildCountryLookupWithCapitals`** sdílí ~80 % kódu
  (smyčka, `addEntry`, MAP_TO_DISPLAY varianty). Obě se používají, ale dají se
  sloučit do jedné parametrizované funkce.
- [x] **`name_cs` / `name_de` NEODSTRAŇOVAT** – vlastní překlady musí zůstat zachovány
  (obsahují ruční úpravy a specifické názvy pro kvíz/mapu, REST Countries API je plně nenahradí).

## Refaktor – zjednodušší zpracování chyb

- [ ] **Zbavit se okľuky text→klíč→překlad.** Dnes: AuthContext hází ANGLICKÝ
  text (`getFirebaseErrorMessage`), UI ho přes `translateErrors.errorMessageKeyMap`
  převádí zpět na i18n klíč a teprve pak překládá. Čistší: AuthContext by házel
  rovnou i18n klíč (přes existující `getFirebaseErrorKey`), UI by dělalo jen
  `i18n.t(key)`. Tím odpadne celá `errorMessageKeyMap` i duplicitní funkce.

## Možná vylepšení přesnosti

- [x] **`directionEmoji` (guessCountryMath) přepnut na přesný azimut** – používá
  `bearingDegrees` + `bearingToCompassEmoji`.

## DŮLEŽITÉ – neúplné mazání účtu (GDPR)

- [ ] **`deleteAccount` nemaže veškerá uživatelská data.** Aktuálně maže jen
  `usernames/{uid}` a Auth účet. Osiřelá data zůstávají v:
  `streaks`, `dailyStreaks`, `cardsMatchScores`, `dailyCardsMatchScores`,
  `guessCountryStats`, `users/{uid}`.
  → Potenciální GDPR problém + zbytky jmen v žebříčcích. Doplnit mazání všech
  kolekcí (ideálně přes Cloud Function s Admin SDK kvůli atomicitě).

## Nepoužité závislosti (package.json)

- [x] **`bootstrap`** (FrontEnd) – smazáno z package.json a zámků.
- [x] **`circle-flags`** (FrontEnd), **`react-circle-flags`** (root), a **`firebase-functions`** (FrontEnd)
  – smazány z package.json i pnpm-lock.yaml.

## Drobnosti (index.html / SEO)

- [x] `<meta name="language" content="English" />` odstraněno z `index.html`.

## utils/localeRouting.ts

- [x] **`getLocalePrefixFromLanguage` odstraněna** – nahrazena voláním `getBaseLanguage(language)`.
- [x] **Typovat návraty na `LocalePrefix`** (`getBaseLanguage`, `getLanguageFromLocalePrefix`).

## utils/staticAssetVersion.ts

- [ ] **`fetchStaticJson` je mrtvý kód** – nikde se neimportuje. Přitom je to
  čistější helper, který by nahradil ~10× opakovaný vzor
  `fetch(withStaticDataVersion(path))` + ok check + json().
  → Buď zapojit všude (DRY), nebo smazat.
- [x] **`cache: 'no-store'` odstraněn ze statických fetchů.**
  Ve `firebase.json` nastaveno `public, max-age=31536000, immutable` pro `**/*.json`.
- [x] Mikro: `getStaticDataVersion` volá `.trim()` 2× – opraveno na 1 volání.

## Infrastruktura (Cloudflare)

## utils/dataPrefetch.ts + leaderboardUtils.ts + sharedStyles.ts

- [ ] **Žebříček = 10 readů na dotaz.** Top 10 dotaz vrací 10 dokumentů = 10
  Firestore readů (5 dotazů v prefetchi = až 50 readů/session na hover).
  → Optimalizace: agregovat top 10 do JEDNOHO dokumentu (1 read). K tomu už
  existuje scaffold: kolekce `leaderboard` v firestore.rules (`write: if false`,
  jen server). Cloud Function by ji udržovala. Zatím NEzapojeno.
- [x] **`getContainerGap` (sharedStyles)** – smazáno.
- [x] **`getPrefetchedData` a `isPrefetched` (dataPrefetch)** – smazáno.
- [x] **`saveShapeMatchScore` a osiřelé indexy** – `saveShapeMatchScore` smazáno,
  indexy pro `shapeMatchScores` a `dailyShapeMatchScores` odstraněny z `firestore.indexes.json`.
- [ ] **OTÁZKA: ukládá Physical Geography vůbec skóre?** `PhysicalGeoGame.tsx`
  nemá žádný `setDoc`/save. Ověřit, zda má mít žebříček.
- [x] **`user: any`** v leaderboardUtils – typováno pomocí `User | null | undefined`.
- [ ] **sharedStyles: hover přes JS** (`onMouseEnter/Leave`) by byl v `.css` jeden
  řádek `:hover`. Statické styly → `.css`; jen dynamicky počítané rozměry nechat v JS.

- [ ] **Cloudflare necachuje JSON** – ověřeno v DevTools: `cf-cache-status: DYNAMIC`
  na `countries-full.json`. Cloudflare defaultně cachuje jen `.js/.css/obrázky`,
  ne `.json`. → Přidat Cache Rule pro `*.json` (resp. `/countries-*.json`,
  `/GeoLand.json`, `/FinalMarines10m.json`, `/fixed_rivers.json`, `/lakes.json`,
  `/region_polys/*`). Pozn.: `x-cache: HIT` je Firebase CDN (Fastly), NE Cloudflare
  – a do Firebase bandwidth kvóty se počítá tak jako tak. Dokud je `DYNAMIC` +
  `no-store`, Firebase dostává zásah při každém načtení.
