<div align="center">
  <img src="FrontEnd/public/newlogo.png" alt="World Quiz Logo" width="150" />

  # World Quiz

  **Pokročilá interaktivní geografická platforma.**

  [![React](https://img.shields.io/badge/React-18-blue.svg?style=for-the-badge&logo=react)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![Vite](https://img.shields.io/badge/Vite-7-purple.svg?style=for-the-badge&logo=vite)](https://vitejs.dev/)
  [![Firebase](https://img.shields.io/badge/Firebase-Ready-orange.svg?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
  [![License](https://img.shields.io/badge/License-Proprietary-red.svg?style=for-the-badge)](#licence)

  [Architektura](#komplexní-architektura-systému) • [Herní moduly](#herní-moduly-a-logika) • [Geodata a Výkon](#zpracování-geodat-a-správa-výkonu) • [SEO Pipeline](#seo-a-prerendering-pro-spa) • [Instalace](#začínáme-lokální-vývoj)
</div>

---

## O projektu

World Quiz je rozsáhlá, produkčně nasazená Single Page Application (SPA) postavená na moderním ekosystému React 18 a TypeScript. Aplikace přesahuje rámec běžné znalostní hry – funguje jako ucelená geografická platforma. Kombinuje interaktivní práci s vektorovými mapami, komplexní matematické výpočty na klientské straně, real-time databázové operace a pokročilou SEO optimalizaci pomocí bezhlavého (headless) prohlížeče.

## Komplexní Architektura Systému

Aplikace je navržena se striktním oddělením prezentační vrstvy, stavové logiky (prostřednictvím specializovaných hooků) a datových služeb. Následující diagram detailně mapuje datové toky, routování, optimalizační mechanismy a napojení na cloudové služby.

~~~mermaid
graph TB
    subgraph Client [Klientská vrstva - React 18 SPA]
        direction TB
        Init[AppInitializer.tsx<br/>Blokování renderu do ověření]
        Router[React Router DOM v7<br/>i18n Locale Routing]
        Auth[AuthContext.tsx<br/>Správa uživatelské relace]
        
        Init --> Auth
        Auth --> Router
        
        subgraph Logic [Stavový management a Hooky]
            H_PG[usePhysicalGeoGame.ts<br/>Správa polygonů a zoomu]
            H_FM[useFlagMatchGame.ts<br/>Logika sérií a skóre]
            H_CM[useCardMatchGame.ts<br/>Fisher-Yates míchání karet]
            H_CS[useCountryStats.ts<br/>Agregace dat a měn]
        end
        
        Router --> Logic
        
        subgraph Utils [Služby, Workery a Utility]
            MapSvc[MapDataService.ts<br/>Promise.all Lazy Loading]
            Worker[mapWorker.ts<br/>Zpracování TopoJSON na pozadí]
            Math[guessCountryMath.ts<br/>Výpočty Haversine formule]
            Prefetch[dataPrefetch.ts<br/>Intent-based načítání]
            Helmet[SEOHelmet.tsx<br/>Správa Canonical a Hreflang]
        end
        
        H_PG --> MapSvc
        MapSvc --> Worker
        H_FM -.-> Prefetch
        Router --> Helmet
    end

    subgraph Firebase [Cloud Služby a Databáze]
        direction TB
        F_Auth[Firebase Authentication]
        F_Store[(Cloud Firestore<br/>users, scores, streaks)]
        F_Rules[firestore.rules<br/>Validace typů a oprávnění]
        F_Host[Firebase Hosting<br/>CDN a Edge Caching]
        
        F_Store --- F_Rules
    end

    subgraph Pipeline [SEO a Build Pipeline - Node.js]
        direction LR
        Sitemap[generate-sitemap.mjs<br/>Generátor XML]
        Vite[Vite Build Proces]
        PW[prerender-from-sitemap.mjs<br/>Playwright Prerender]
        Verify[verify-prerender-count.mjs]
    end

    %% Propojení mezi subsystémy
    Auth <--> |Ověřování tokenů| F_Auth
    Logic <--> |Zabezpečené CRUD operace| F_Store
    MapSvc -.-> |Stahování komprimovaných dat| F_Host
    Math -.-> |Lokální výpočty vzdáleností| Logic
    
    Sitemap --> Vite
    Vite --> PW
    PW --> Verify
    Verify --> |Deploy prerenderovaných HTML| F_Host
~~~

## Herní moduly a Logika

Jádro aplikace tvoří čtyři vysoce optimalizované herní módy. Každý z nich využívá specifické programátorské přístupy pro zajištění plynulého chodu:

* **Guess Country (Dedukční geografie):** Využívá vlastní implementaci sférické geometrie (`guessCountryMath.ts`). Skrze Haversine formuli vypočítává přesnou vzdálenost mezi hádaným a cílovým státem s ohledem na zakřivení Země.
* **Cards Match (Pexeso):** Rychlostní paměťový test, který pro prokazatelně spravedlivé a rovnoměrné rozložení karet na ploše spoléhá na matematický algoritmus *Fisher-Yates Shuffle* implementovaný v rámci `useCardMatchGame.ts`.
* **Flag Match:** Postaveno na plynulém překreslování interaktivní SVG mapy a TopoJSON vrstev. Systém eviduje nepřerušené série správných odpovědí (streaks) s přímým ukládáním do specializovaných kolekcí ve Firestore.
* **Physical Geography:** Nejsložitější modul platformy. Pracuje s masivními datasety polygonů (jezera, pouště, pohoří a vodní toky). Obsahuje vlastní logiku pro výpočet rozměrů mapy (`useMapDimensions.ts`), ochranu proti nechtěnému scrollování kolečkem myši (`usePreventWheelScroll.ts`) a detailní rendering přesných hranic přírodních útvarů.

## Zpracování geodat a Správa výkonu

Vzhledem k tomu, že běžné webové mapy neposkytují potřebnou granularitu pro fyzickou geografii, obsahuje projekt vlastní pipeline pro kompresi a načítání prostorových dat:

1. **Izolace pracovních vláken:** TopoJSON soubory mohou mít i po kompresi několik megabytů. Kdyby je aplikace parsovala v hlavním vlákně, došlo by k takzvanému zamrznutí UI. Aplikace proto využívá technologii **Web Workers** (`mapWorker.ts`), která složité dekompresní výpočty překládá na vedlejší procesorové jádro.
2. **Lazy Loading a Prefetching:** Služba `MapDataService.ts` zajišťuje, že se obří datové sady (jako jsou světové oceány nebo detailní říční sítě) nestahují při startu aplikace, ale asynchronně až v momentě, kdy je hráč skutečně potřebuje. Modul `dataPrefetch.ts` navíc obsahuje logiku pro intent-based přednačítání (stahování dat ve chvíli, kdy uživatel myší najede na spouštěcí tlačítko).

## SEO a Prerendering pro SPA

Vyhledávače mají historicky problém se správnou indexací Single Page Aplikací, které obsah dynamicky renderují přes JavaScript. Projekt tento problém řeší nekompromisní buildovací pipeline:

1. Modul `generate-sitemap.mjs` před sestavením analyzuje dostupné routy a generuje obsáhlou XML mapu stránek (včetně jazykových mutací pro státy z `countriesData.ts`).
2. Sestavovací proces využívá nástroj **Playwright** (`prerender-from-sitemap.mjs`). Tento bezhlavý prohlížeč po kompilaci virtuálně navštíví každou URL ze sitemapy, počká na vyřešení asynchronních volání (jako je např. zjištění stavu AuthContextu) a uloží hotový DOM strom v podobě sémantického HTML souboru.
3. Pro řešení duplicitního obsahu u vícejazyčné aplikace (CS/EN/DE) zajišťuje komponenta `SEOHelmet.tsx` dynamické vkládání značek `canonical` a `hreflang` do hlavičky dokumentu.

## Bezpečnost backendu (Firebase)

I když většina aplikační logiky leží na klientské straně, databázový model je striktně chráněn na úrovni serveru prostřednictvím souboru `firestore.rules`. 

Pravidla neslouží jen k ověření totožnosti (`request.auth.token.email_verified == true`), ale fungují jako robustní validátor dat. Při zápisu do kolekce `/scores` se na straně Googlu kontroluje, zda odeslaná hodnota `score` odpovídá datovému typu číslo, zda není záporná a zda matematicky nepřevyšuje limit daného módu. Podobně je řešena ochrana před duplikací uživatelských jmen skrze dedikovanou kolekci `/usernames`.

## Struktura repozitáře

~~~text
world-quiz/
├── FrontEnd/
│   ├── public/                 # TopoJSON, vlajky, sitemap.xml, ikony
│   ├── scripts/                # Node.js skripty pro mapy a Playwright prerendering
│   ├── src/
│   │   ├── components/         # Znovupoužitelné UI komponenty a herní plátna
│   │   ├── contexts/           # Globální stavy (AuthContext)
│   │   ├── hooks/              # Oddělená business logika a herní smyčky
│   │   ├── locales/            # Překladové i18n JSON slovníky (cs, en, de)
│   │   ├── pages/              # Komponenty pro React Router
│   │   ├── services/           # Komunikace s geodaty a Web Workers
│   │   ├── seo/                # Konstanty a překlady pro generování metadat
│   │   └── utils/              # Haversine matematika, helpery, mapové konstanty
│   └── package.json
├── functions/                  # Serverless Firebase Cloud Functions
├── firebase.json               # Konfigurace Firebase Hostingu (Cache, hlavičky)
├── firestore.rules             # Bezpečnostní a validační pravidla databáze
└── firestore.indexes.json      # Optimalizační kompozitní indexy
~~~

## Začínáme (Lokální vývoj)

### Prerekvizity

* **Node.js** (doporučena verze 18 a vyšší).
* Připravený Firebase projekt se zapnutými službami Authentication a Firestore. Konfigurační údaje je nutné vložit do souboru `FrontEnd/src/firebase.ts`.

### Instalace a spuštění

1. Naklonování repozitáře:
   ~~~bash
   git clone https://github.com/Khudanychs/world-quiz.git
   cd world-quiz
   ~~~
2. Instalace NPM závislostí pro klientskou část:
   ~~~bash
   npm run install:frontend
   ~~~
3. Spuštění lokálního vývojového serveru:
   ~~~bash
   npm run dev
   ~~~

### Sestavení a nasazení do produkce

Pro testování kompletní buildovací pipeline, včetně generování sitemapy a Playwright prerenderingu, spusťte:
~~~bash
npm run build:frontend:seo
~~~

Pro finální nasazení statických souborů a bezpečnostních pravidel na servery Firebase:
~~~bash
npm run deploy
~~~

## Licence

Copyright (c) 2025-2026 Khudanychs. All Rights Reserved.

Tento software a s ním spojená dokumentace jsou proprietární. Neoprávněné kopírování, modifikace, distribuce nebo veřejné šíření tohoto softwaru je přísně zakázáno bez předchozího písemného souhlasu autora. Více informací naleznete v souboru LICENSE.