# Simple Python Server Setup

Pokud chceš používat Python HTTP server, jsou 2 možnosti:

## Možnost 1: Použij Vite Preview (DOPORUČENO)
```powershell
cd FrontEnd-Standalone
npm run build
npm run preview
```
Otevři: http://localhost:4173

## Možnost 2: Python Server s buildem

```powershell
# 1. Build aplikace
cd FrontEnd-Standalone
npm run build

# 2. Spusť Python server ze složky dist
cd dist
python -m http.server 10000
```
Otevři: http://localhost:10000

⚠️ **PROBLÉM**: React Router nebude fungovat správně s Python serverem!
- Hlavní stránka bude fungovat: `http://localhost:10000`
- Ale `/map` nebo `/game/flags` budou dávat 404

## Možnost 3: Nejjednodušší - Dev server (NEJLEPŠÍ)

```powershell
cd FrontEnd-Standalone
npm run dev
```
Otevři: http://localhost:5173 (nebo jaký port ukáže)

---

**Aktuálně běží na:** http://localhost:4173 ✅
