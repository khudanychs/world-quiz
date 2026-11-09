# SEO audit a doporučení Bing Webmaster Tools

Datum kontroly: 9. 11. 2026. Jde o analýzu; aplikační kód ani produkční konfigurace nebyly změněny.

Následná oprava v pracovním stromu: navigační prvky byly převedeny na skutečné
odkazy. Záložní metadata v `index.html` nyní přebírá Helmet přes `data-rh`, takže
je nahrazuje místo přidávání druhého tagu. Odstraněn byl také zastaralý
`meta name="title"`. Prerender nově odmítá duplicitní description, robots,
canonical a pole OG/Twitter. Celý striktní SEO build prošel pro 657/657 URL;
izolovaná stránka se dvěma description byla správně odmítnuta. V prohlížeči byla
ověřena také SPA navigace a jediný správný robots tag pro přihlášení a 404.
Změny zatím nebyly nasazeny. Níže je původní stav auditu, včetně dalších
nevyřešených bodů, například stejných textů metadat některých herních režimů.

Další lokální oprava podle výstupu deploye: importy společného modulu Firebase
jsou sjednocené, takže Vite nehlásí kombinaci statického a dynamického importu.
`functions` používají `firebase-functions@7.4.0` a ESLint parser/plugin řady 8
podporující nainstalovaný TypeScript. Lint i kompilace backendu prošly.
Prerender kromě metadat nově ověřuje připravenost herních dat, map a detailů
států; chyba dat nebo timeout build zastaví. Prohlížeč běží explicitně headless.
Očekávaná rušení požadavků při ukončení předchozí stránky se rozlišují od
skutečných síťových chyb. Kompletní kontrola 657 URL po této úpravě prošla
bez runtime diagnostik; blokované služby mají vlastní souhrn.

## Rozsah a hranice důkazů

Prošel jsem SEO část README/TODO, metadata v `index.html`, `SEOHelmet.tsx`,
`seo-translations.ts`, překlady EN/CS/DE, lokalizované routování, příslušné stránky
a herní komponenty, generování sitemapy, prerendering, ověření buildu,
`package.json`, `vite.config.ts`, `firebase.json` a `robots.txt`.

Staticky jsem zkontroloval všech 657 HTML souborů odpovídajících lokální
`FrontEnd/dist/sitemap.xml`. Na produkci jsem samostatnými HTTP požadavky
zkontroloval vzorek hlavních stránek, detailů států, her, sitemapu, robots,
kořenovou URL a neexistující cestu. U `/en` jsem porovnal i DOM po spuštění JS.
Lokální kompletní inventář a produkční vzorek jsou různé rozsahy měření.

Přes připojené Bing API byly dostupné vlastnosti webů, sitemapy, crawl statistiky,
výkonnost stránek a informace o vybraných URL. API neposkytlo seznam URL z tlačítek
„Investigate“ u čtyř doporučení. Přihlášené UI Bingu nebylo v dostupném prohlížeči.
Níže jsou tedy doložené závady webu a jejich vysvětlení ve vztahu k varováním;
nejde o tvrzení, že byl získán přesný interní seznam zasažených URL Bingu.

## 1. Identické meta descriptions

**Doložená systémová chyba: všech 657 lokálních HTML má dva tagy description.**
První obsahuje vždy stejných 100 znaků:

> Play a country flag matching game, test map skills, and improve geography knowledge with World Quiz.

Pochází z `FrontEnd/index.html:24`. Druhý tag přidává `SEOHelmet` a má vlastní
lokalizovaný obsah. Stejný problém je i s dalšími metadaty šablony, například
robots a částí Open Graph/Twitter metadat.

Na produkční `/en/countries/cz` je skutečně obojí:

```html
<meta name="description" content="Play a country flag matching game, test map skills, and improve geography knowledge with World Quiz.">
<meta name="description" content="Explore facts about Czech Republic: capital, population, area, languages, and neighboring countries." data-rh="true">
```

Stejná situace byla ověřena na `/en`, `/cs`, `/en/countries/de` a herních URL.
Nejde pouze o stará data dashboardu. Statický tag nemá `data-rh`, takže jej
Helmet při správě svých tagů nenahradí. Chování je patrné i ve zdrojovém kódu
nainstalovaného `react-helmet-async@3.0.0` (`updateTags`, výběr spravovaných tagů).
Nelze z toho samotného dokázat, který z popisů zpracoval konkrétní crawl Bingu.

**Druhá, nezávislá duplicita:** i po odstranění statického tagu sdílí všech šest
regionálních variant Flag Match v jednom jazyce stejný title i description.
Stejně je tomu u pěti variant Physical Geography včetně rozcestníku. Celkem jde
o šest skupin duplicit přes tři jazyky. `resolveSeoRouteKey()` rozlišuje pouze
rodinu hry, nikoli kontinent či přírodní útvar.

Naopak všech 600 detailů států má v lokálním buildu navzájem odlišný druhý
description. Jejich hlavní metadata tedy nejsou všechna omylem popisem seznamu zemí.

**Oprava:** určit jediného vlastníka routových metadat a zajistit právě jeden
description v hotovém HTML i DOM. Zkontrolovat společně robots, OG a Twitter.
Pak vytvořit skutečně konkrétní metadata pro Evropu, Afriku, řeky, pouště atd.
Pouhé přepsání překladů neodstraní první univerzální tag.

Samotná duplicita neprokazuje penalizaci. Bing ve svém vysvětlení uvádí,
že duplicity samy o sobě automatickou penalizaci nespouštějí; komplikují výběr
URL a interpretaci obsahu. [Bing: duplicate content](https://blogs.bing.com/webmaster/2025/12/Does-Duplicate-Content-Hurt-SEO-and-AI-Search-Visibility/).

## 2. Nedostatek kvalitních příchozích odkazů

Toto doporučení se týká externích odkazů a autority. Prerender, sitemap,
schema ani úprava meta description nevytvoří doporučení z jiného webu.

API pro backlinkové detaily vrátilo prázdný výsledek a označení
`UNVERIFIED_RUNTIME`. To není spolehlivý důkaz nulového počtu backlinků.
Ani souhrnné pole `in_links` z crawl statistik nepoužívám jako počet
unikátních kvalitních odkazujících domén. Jejich přesný počet zde nebyl ověřen.

**Doporučení:** získávat relevantní odkazy na užitečné části aplikace, například
z výukových materiálů, školních webů nebo přehledů geografických pomůcek.
Pomůže obsah, na který má smysl odkazovat: konkrétní kvíz kontinentu, metodika
procvičování nebo kvalitní geografický přehled. Vlastní subdoména sama
nedokládá nezávislé doporučení. [Bing: nedostatek odkazů](https://www.bing.com/webmasters/help/why-is-my-site-not-in-the-index-2141dfab).

## 3. Nedostatečný obsah

Zde jsou dvě oddělené příčiny: nedokončený prerender a malý rozsah vlastního
textového obsahu.

### Prerender zachycuje načítání

Produkční HTML při kontrole obsahovalo:

| URL | Text podstatný pro zjištění |
| --- | --- |
| `/en/game/flags/europe` | `Flag Matching Game`, `Menu`, `Loading flags...` |
| `/de/game/physical-geo/rivers` | `Naturgeografie Quiz`, `Menü`, `Lädt Orte...` |
| `/` | pouze `Loading World Quiz...` v těle stránky |

První dvě stránky už přitom mají canonical, hreflang, description a JSON-LD.
V lokálním buildu byly načítací stavy nalezeny také například na
`/en/game/flags/americas` a `/de/game/physical-geo`.

V `prerender-from-sitemap.mjs:290` se čeká na zmizení
`[data-app-loading="true"]` a existenci canonicalu. I striktní režim kontroluje
hlavně přítomnost metadat. Vnitřní načítání dat hry tuto podmínku nezablokuje.
Navazující `verify-prerender-count.mjs` ověřuje existenci souborů, nikoli
hotový obsah. Proto může striktní build úspěšně uložit loading obrazovku.

**Oprava:** zavést explicitní signál připravenosti obsahu pro jednotlivé typy
stránek. Při prerenderu čekat i na něj a při chybě build ukončit. Nestačí přidat
pevný timeout, který bude záviset na rychlosti stroje a sítě.

### Vlastní obsah je velmi stručný

I dokončené hry tvoří převážně mapa, vlajky, tlačítka a skóre. Detaily zemí mají
několik statistických polí. Samotný článek pro Česko měl při kontrole přibližně
40 slov podle způsobu tokenizace. V HTML detailu se navíc opakuje celý seznam
200 zemí, který je skryt pomocí `visibility: hidden` a `aria-hidden`.
Velikost HTML tedy výrazně nadhodnocuje množství vlastního viditelného obsahu.

**Oprava:** přidat užitečný a viditelný kontext. U her například pravidla,
ovládání, způsob hodnocení a skutečný rozsah daného regionu/režimu. U zemí krátké
ověřené geografické vysvětlení a zdroje/dataci faktů. Kvalitu nelze odvodit
z pevného počtu slov; hra může dobře plnit účel i s menším množstvím textu.
Nedává smysl vyrábět obecnou výplň jen kvůli číslu v auditu.

## 4. Krátké meta descriptions

Ve všech 657 lokálních stránkách jsem změřil také druhý, vlastní description:

- 566 popisů má méně než 100 znaků.
- `/en/privacy`: 77 znaků.
- `/en/terms`: 84 znaků.
- `/de/terms`: 70 znaků.
- `/en/countries/cz`: 100 znaků.

Hranice 100 znaků je moje analytická hranice pro inventář, nikoli ověřený práh
tohoto doporučení Bingu. Přesný algoritmus a seznam zasažených URL nebyly dostupné.

`SEOHelmet` pouze ořezává délku na maximálně 160 znaků; minimální délku ani
informační hodnotu nehlídá. Rozhodující text navíc často pochází z
`src/locales/*/translation.json`, nikoli z anglických konstant
`seo-translations.ts`. U detailů zemí se používá šablona
`countryIndex.seoDescriptionWithCountry` s názvem země.

**Oprava:** po odstranění duplicit rozšířit stručné popisy o konkrétní užitečnou
informaci. Pro běžné vstupní stránky lze redakčně mířit přibližně na 120–160
znaků, ale nejde o podmínku indexace ani univerzální limit. Automatické doplnění
stejné věty všude by problém s podobností zhoršovalo. Google rovněž uvádí,
že description nemá pevný délkový limit a výsledný snippet zkracuje podle
zobrazení. [Google: snippets](https://developers.google.com/search/docs/appearance/snippet).

## Další relevantní zjištění

### Interní navigace nemá skutečné odkazy

V žádném z 657 kontrolovaných HTML nebyl `<a href>` vedoucí na detail země.
Karty v `CountryIndex.tsx:319` jsou `<article onClick>`, sousední státy v
`CountryDetails.tsx:280` jsou klikatelné `<span>` a herní karty v hlavním menu
jsou tlačítka s `navigate()`.

Sitemap může pomoci s objevením URL, ale nenahrazuje odkazy a jejich kontext.
Pro navigaci používat React Router `<Link to>` / skutečné `<a href>` s
lokalizovanou cílovou cestou; pro akce ponechat tlačítka. To zároveň zlepší
ovládání klávesnicí a otevírání do nového panelu.
[Google: crawlable links](https://developers.google.com/search/docs/crawling-indexing/links-crawlable).

### Kořenová URL a chybové cesty

`https://world-quiz.com/` vrací HTTP 200, loader a žádný canonical v původním
HTML. Důvod: sitemap obsahuje `/en`, `/cs`, `/de`, ale ne `/`; prerender kořen
nepřepíše. Firebase pro něj nemá serverový redirect. Lokalizaci následně řeší JS.

Také náhodná neexistující `/en/seo-audit-nonexistent-20261109` vrátila HTTP 200
a stejnou prázdnou šablonu s `index, follow`. React může později zobrazit
`NotFound` s `noindex`, ale HTTP stav tím neopraví. Je to riziko soft 404.

Zvolit explicitní strategii pro `/`: například serverový redirect na `/en`
nebo plnohodnotnou výchozí jazykovou stránku. Pro neexistující URL řešit skutečné
HTTP 404 v rámci routování hostingu. Plošné odstranění SPA fallbacku bez
náhrady by rozbilo přímé návštěvy platných aplikačních cest.

### Sitemapy a subdoména JEF

Bing pod hlavní vlastností vrátil:

- `https://world-quiz.com/sitemap.xml`: 657 URL, `Success`, poslední crawl 3. 11. 2026.
- `https://jef.world-quiz.com/sitemap.xml`: sitemap index, 50 046 URL, `Success`, poslední crawl 3. 11. 2026.

`Success` vypovídá o zpracování sitemapy, nikoli o indexaci všech URL. Z pouhé
přítomnosti JEF sitemapy nelze dokázat, zda tato konkrétní souhrnná doporučení
zahrnují i subdoménu. V exportu „Investigate“ je potřeba rozlišit hostname.

JEF byl prověřen pouze vzorkem produkčních stránek, nikoli jeho zdrojovým
kódem ani všech 50 tisíc URL. Kontrolované stránky měly jeden description;
hlavní duplicita z React šablony se v tomto vzorku neopakovala. JEF sitemapu
není důvod bez dalšího odstraňovat nebo subdoménu blokovat.

### Co už funguje

Všech 657 lokálních HTML existuje a má právě jeden canonical odpovídající
URL v sitemapě. Lokalizované stránky mají hreflang varianty a ve zkontrolovaném
produkčním vzorku byly tyto prvky také přítomné. Produkční `robots.txt`
neblokuje hlavní stránky a odkazuje na správnou sitemapu. Prerender tedy funguje,
ale jeho podmínky připravenosti a kontrola výsledku nejsou dostatečné.

Sekundární nesoulad strukturovaných dat: `MainMenu.tsx` nastavuje u WebSite
`inLanguage: "en"` i na české a německé variantě. Obecný typ
`EducationalApplication` se přidává i na encyklopedii a právní stránky.
Tyto věci zpřesnit podle skutečného obsahu; nejsou doloženou příčinou čtyř varování.

## Doporučené pořadí oprav a následné ověření

1. Sjednotit správu metadat a odstranit dvojí description/robots/OG/Twitter.
2. Opravit připravenost prerenderu, strategii kořene a HTTP chybové stavy.
3. Rozlišit metadata regionálních a tematických her, doplnit stručné popisy.
4. Zavést skutečné interní odkazy a užitečný viditelný obsah vstupních stránek.
5. Průběžně získávat relevantní externí odkazy.

Před nasazením kontrolovat hotové HTML ze všech sitemapových URL: přesně jeden
description a canonical, správný jazyk, odpovídající metadata a žádný loading
stav hlavního obsahu. U duplicit vyhodnocovat skupiny stránek, ne pouze přítomnost
tagu. Po nasazení totéž ověřit HTTP požadavkem na veřejné URL bez spouštění JS.

V Bingu následně porovnat konkrétní postižené URL z „Investigate“, jejich hostname
a datum crawlu. Poté lze požádat o nové zpracování změněných URL nebo použít
IndexNow; takové oznámení samo nezaručuje indexaci ani okamžité zmizení doporučení.

Screenshot ukazuje doporučení ke zlepšení, nikoli sám o sobě důkaz penalizace
nebo nefunkčního webu. Prázdný výstup API `bing_crawl_issues` zde nelze brát
jako potvrzení bezchybnosti: nástroj uváděl neověřený runtime kontrakt a navíc
nejde o totožný report jako screenshot.
