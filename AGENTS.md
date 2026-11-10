# Projektové instrukce

## Způsob práce

- Komunikuj česky, stručně a věcně; u netriviálních rozhodnutí vysvětli důvod.
- README obsahuje jen zásadní informace k projektu a jeho používání, nikoli deník změn.
- Sem zapisuj pouze trvalý vývojový kontext a pravidla, ne průběžné poznámky z práce.
- Preferuj jednu reprezentaci stavu; při nahrazování mechanismu odstraň původní větve a nepoužívaný kód.
- Nové abstrakce a závislosti přidávej jen při konkrétním přínosu. Komentuj záměr a důležité nuance.

## Architektura a invarianty

- Aplikaci spouští `FrontEnd/src/main.tsx`; frontend používá React, React Router, Vite a Firebase.
- Produkční HTML vzniká Playwright prerenderem. Musí být nezávislé na přihlášení konkrétního návštěvníka.
- Navigace při prvním vykreslení volí mobilní/desktopové rozložení pomocí CSS, nikoli dodatečnou výměnou DOM podle viewportu.
- Auth UI rozlišuje neznámou relaci od ověřeného hosta. Veřejný obsah nemusí čekat na Firestore profil.
- Opožděné profilové operace nesmí přepsat novější relaci ani obnovit odhlášeného uživatele.
- Volba hry a období leaderboardu patří do URL, aby fungoval refresh, přímý odkaz a historie prohlížeče.
- Při změně hry či období nesmí opožděné požadavky přepsat novější výsledky ani zobrazit staré řádky pod jiným titulkem.
- Lokalizované routy používají prefixy `en`, `cs`, `de`; změna jazyka má zachovat query parametry a hash.

## Ověření

- Typecheck: `pnpm --filter frontend exec tsc --noEmit -p tsconfig.json` (aktivní config je `FrontEnd/tsconfig.json`).
- Produkční build: `pnpm build`; kompletní SEO build: `pnpm build:frontend:seo`.
- Browser regrese (auth, navbar, leaderboard): po buildu `pnpm --filter frontend test:ui`.
- Browser testy používají izolované lokální fixtures a zachytávají externí služby; Chrome lze nastavit přes `PRERENDER_CHROME_PATH`.
