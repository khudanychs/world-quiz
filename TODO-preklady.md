# TODO — Audit překladů (CS / EN / DE)

Komplexní audit překladů celé aplikace World Quiz: UI klíče, názvy zemí,
hlavní města, měny, jazyky, subregiony a fyzická geografie (řeky, pohoří,
pouště, moře/zálivy, jezera, vrcholy).

Datum auditu: 2026-06-30
Metoda: porovnání datových souborů + i18n slovníků skriptem + vizuální
kontrola živé produkční verze (https://world-quiz.com) v CS a DE.

Legenda priorit:
- 🔴 **HIGH** — jednoznačná chyba viditelná uživateli, opravit.
- 🟠 **MEDIUM** — reálná mezera v překladu, vhodné opravit.
- 🟡 **LOW** — stylisticky sporné / přijatelné vlastní jméno, k posouzení.

---

## 1. UI klíče (i18n `translation.json`)

Struktura je **kompletní**: EN / CS / DE mají shodně **588 klíčů**, žádný
klíč nikde nechybí. Jediné nálezy:

- 🔴 **`nav.login` (DE)** — je `"Login"`, má být `"Anmelden"`.
  (EN=`Login`, CS=`Přihlásit se`, DE=`Login` ← nepřeloženo)
- 🔴 **`nav.logout` (DE)** — je `"Logout"`, má být `"Abmelden"`.
  (EN=`Logout`, CS=`Odhlásit se`, DE=`Logout` ← nepřeloženo)
  Soubor: `FrontEnd/src/locales/de/translation.json`

Plané poplachy (shodné s EN, ale **správně** – neměnit): `nav.appName`
("World Quiz"), `nav.menu` (DE="Menü", CS="Menu"), `settings.*.placeholderClass`
(CSS třídy), `*.deleteWord` ("DELETE" – potvrzovací slovo), `*.areaValue`,
`*.oneUsd`, `game.km` (formátovací řetězce), `*.notAvailable` ("N/A"),
`avatarAlt`, `bangOnline.title/tag`.

---

## 2. Názvy zemí (`public/countries-full.json` → `name_cs` / `name_de`)

Drtivá většina je **správně** (250 zemí). Ověřeno živě v CS. Reálné chyby —
do polí se omylem dostal **název jazyka místo názvu země**:

- 🔴 **Nauru**
  - CS = `"Naurština"` → má být `"Nauru"`
  - DE = `"Nauruisch"` → má být `"Nauru"`
- 🔴 **Tonga**
  - CS = `"Tongština"` → má být `"Tonga"`
  - DE = `"Tonga"` ✓ (v pořádku)

> ⚠️ **Kde opravit:** `countries-full.json` se **generuje** skriptem
> `FrontEnd/scripts/inject-translations.mjs` ze souboru
> `FrontEnd/public/dictionary.json`. Chybu opravit **v `dictionary.json`**,
> jinak ji regenerace vrátí zpět. Aktuální (chybné) položky:
> ```json
> "Nauru": { "cs": "Naurština", "de": "Nauruisch" },   // → "Nauru" / "Nauru"
> "Tonga": { "cs": "Tongština", "de": "Tonga" }          // → "Tonga" / "Tonga"
> ```
> Příčina: záměna s názvem jazyka (v slovníku existují i klíče `Nauru`,
> `Tonga`, `Tongan`).

Pozn.: 60 (CS) / 98 (DE) názvů je shodných s EN, ale jde o vlastní jména
s identickým pravopisem (Tuvalu, Peru, Egypt, China, Japan, Ukraine, …) —
**správně, neměnit**.

---

## 3. Hlavní města (`capital_cs` / `capital_de`)

✅ **Bez nálezů.** Všechna hlavní města mají CS i DE hodnotu a exonyma jsou
správně přeložená — ověřeno živě i bodově v datech:

| EN | CS | DE |
|----|----|----|
| Moscow | Moskva | Moskau |
| Vienna | Vídeň | Wien |
| Rome | Řím | Rom |
| Cairo | Káhira | Kairo |
| Warsaw | Varšava | Warschau |
| Beijing | Peking | Peking |
| Chișinău | Kišiněv | Chișinău |

166 (CS) / 193 (DE) měst je shodných s EN, ale jde o jména bez exonyma
(Lima, Dakar, Minsk, Nassau…) — **správně**.

---

## 4. Měny (`currencies` + i18n klíč `currencies.<EN název>`)

Měny se překládají přes i18n klíč `currencies.<anglický název>` s fallbackem
na angličtinu. Pokrytí je **164/164** klíčů ve všech jazycích. Jediná mezera:

- 🟠 **`Sierra Leonean leone`** — chybí klíč v CS i DE → zobrazí se anglicky.
  - CS doplnit: `currencies."Sierra Leonean leone"` = `"sierraleonský leone"`
  - DE doplnit: `currencies."Sierra Leonean leone"` = `"Sierra-leonischer Leone"`
  - Soubory: `FrontEnd/src/locales/{cs,de}/translation.json`
  - (`Euro` rovněž nemá klíč, ale fallback "Euro" je v CS i DE správný — neřešit.)

---

## 5. Subregiony a jazyky

✅ **Bez nálezů.** `subregion_cs` / `subregion_de` jsou vyplněné u všech zemí;
jazyky se lokalizují přes `languages_cs` / `languages_de` a `getLocalizedLanguage`.

---

## 6. Fyzická geografie (`public/*.json`, `region_polys/*.json`)

Žádný named feature nemá **prázdný** `name_cs`/`name_de`. Níže jsou případy,
kde lokalizovaný název obsahuje anglické obecné slovo (River, Bay, Sound,
Range…) = kandidáti na únik angličtiny. Mnoho je přijatelných vlastních jmen;
k posouzení rodilým mluvčím.

### 6a. Řeky (`fixed_rivers.json`, 105 pojmenovaných)
- 🟡 **CS**: `Red River (NA)` → `"Red River"` (zvážit "Červená řeka"/ponechat).
- 🟡 **DE** (15×): německy ponechané `… River` — `Mackenzie River`,
  `Colorado River`, `Peace River`, `Saskatchewan River`, `Yukon River`,
  `Murray River`, `Snake River`, `Churchill River`, `Ohio River`,
  `Tennessee River`, `Nelson River`, `Platte River`, `Pearl River (Mississippi)`,
  `Red River of the North`, `Ottawa River`.
  (Zvážit odstranění "River" nebo "-Fluss"; v němčině sporné — často se ponechává.)

### 6b. Moře / zálivy / průlivy (`FinalMarines10m.json`, 288 pojmenovaných)
- 🟡 **CS** (5×): `McMurdo Sound`, `Long Island Sound`, `Pamlico Sound`,
  `Husky Lakes`, `Minto Inlet` (obskurní útvary, CS je obvykle ponechává).
- 🟠 **DE** (38×) — u **známých** útvarů reálný únik, doporučeno přeložit:
  `Hudson Bay` → *Hudsonbai*, `James Bay` → *Jamesbai*,
  `Great Barrier Reef` → *Großes Barriereriff*, `Shark Bay`,
  `Prince William Sound`, `Cook Inlet` … (zbytek převážně obskurní – ponechat).

### 6c. Pohoří (`region_polys/Mountain ranges.json`, 63 pojmenovaných)
- 🟡 **DE** (2×): `Great Dividing Range`, `Rocky Mountains`
  (v němčině se běžně ponechávají — spíše OK).
- Pozn.: `Sierra Madre*`, `Sierra Nevada`, `Serra do Mar` jsou španělská/
  portugalská vlastní jména, shodná ve všech jazycích — **správně**.

### 6d. Pouště (`region_polys/deserts.json`, 30 pojmenovaných)
- ✅ Bez reálných nálezů. `Sahara`, `Namib`, `Taklamakan`, `Ténéré`,
  `Caatinga` jsou ve všech jazycích shodné — správně.

### 6e. Vrcholy / elevace (`region_polys/elev_points.json`, 33 pojmenovaných)
- ✅ Bez reálných nálezů. `Mount Everest`, `Mount Kenya`, `K2`, `Denali`,
  `Aconcagua` se v CS i DE standardně ponechávají s "Mount" — správně.

### 6f. Jezera (`lakes.json`, 19 pojmenovaných)
- ✅ Bez nálezů (CS i DE kompletní).

---

## 7. Souhrn priorit

| # | Priorita | Nález | Soubor |
|---|----------|-------|--------|
| 1 | 🔴 | `nav.login` DE: Login → Anmelden | `locales/de/translation.json` |
| 2 | 🔴 | `nav.logout` DE: Logout → Abmelden | `locales/de/translation.json` |
| 3 | 🔴 | Nauru `name_cs` Naurština → Nauru | `public/countries-full.json` |
| 4 | 🔴 | Nauru `name_de` Nauruisch → Nauru | `public/countries-full.json` |
| 5 | 🔴 | Tonga `name_cs` Tongština → Tonga | `public/countries-full.json` |
| 6 | 🟠 | Měna „Sierra Leonean leone" chybí CS+DE | `locales/{cs,de}/translation.json` |
| 7 | 🟠 | DE známé moře/zálivy v angličtině (Hudson Bay, Great Barrier Reef…) | `FinalMarines10m.json` |
| 8 | 🟡 | DE řeky se sufixem „River" (15×) | `fixed_rivers.json` |
| 9 | 🟡 | DE pohoří (Rocky Mountains, Great Dividing Range) | `Mountain ranges.json` |
| 10 | 🟡 | CS/DE obskurní sounds/inlets v angličtině | `FinalMarines10m.json` |

> Pozn.: Datové soubory v `public/` (`countries-full.json`, `fixed_rivers.json`,
> `FinalMarines10m.json`, `region_polys/*`, …) se **generují** skriptem
> `FrontEnd/scripts/inject-translations.mjs` ze zdroje pravdy
> **`FrontEnd/public/dictionary.json`** (potvrzeno). Všechny opravy geo-názvů
> i názvů zemí (#3–#10) proto patří do **`dictionary.json`** — úpravy přímo ve
> vygenerovaných souborech regenerace přepíše. Opravy UI klíčů (#1, #2) a měn
> (#6) patří do i18n slovníků `FrontEnd/src/locales/{cs,de}/translation.json`.
