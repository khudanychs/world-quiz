import { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { geoCentroid } from "d3-geo";
import { feature as topoFeature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import { BackButton } from "./BackButton";
import { useMapDimensions } from "../hooks/useMapDimensions";
import { usePreventWheelScroll } from "../hooks/usePreventWheelScroll";
import { FRAME, FRAME_COLOR } from "../utils/mapConstants";
import {
  PAGE_CONTAINER_STYLE,
  getMapWrapperStyle,
} from "../utils/sharedStyles";
import {
  buildCountryHintLookup,
  buildRestLookup,
  FLAG_MATCH_SPECIAL_TERRITORIES,
  isClickableInGameMode,
  normalizeApos,
  normalizeCountryName,
  stripDiacritics,
} from "../utils/countries";
import { SMALL_ISLAND_MARKERS } from "../utils/markerPositions";
import {
  compareHintEmoji,
  directionEmoji,
  haversineDistanceKm,
  type GeoPoint,
} from "../utils/guessCountryMath";
import GuessResultRow, { type GuessResultRowData } from "./GuessResultRow";
import { incrementGuessCountryWins } from "../utils/leaderboardUtils";
import { useAuth } from "../contexts/AuthContext";
import { buildLocalizedPath } from "../utils/localeRouting";
import "./GuessCountryGame.css";
import "./FlagMatchGame.css";

const InteractiveMap = lazy(() => import("./InteractiveMap"));

const MAX_ATTEMPTS = 5;

type CountryData = {
  name: { common: string };
  cca2: string;
  flags: { svg?: string; png?: string };
  independent?: boolean;
  unMember?: boolean;
  region?: string;
  subregion?: string;
  population?: number;
  area?: number;
  borders?: string[];
};

type CountryStatsData = {
  cca2: string;
  population?: number;
  area?: number;
  region?: string;
  subregion?: string;
};

type RestLookupInfo = {
  name: string;
  cca2: string;
  flag: string;
  region?: string;
};

type PlayableCountry = {
  name: string;
  displayName: string;
  cca2: string;
  continent: string;
  subregion: string;
  population: number | null;
  area: number | null;
  borderCount: number;
  lat: number;
  lng: number;
};

function toLookupKeys(rawName: string): string[] {
  const norm = normalizeCountryName(rawName);
  const k1 = normalizeApos(norm);
  const k2 = stripDiacritics(k1);
  return [k1, k2, norm];
}

function extractCentroidsByCode(
  topology: Topology,
  restLookup: Record<string, RestLookupInfo>
): Map<string, GeoPoint> {
  const centroids = new Map<string, GeoPoint>();
  const objectKeys = Object.keys(topology.objects || {});
  if (!objectKeys.length) {
    return centroids;
  }

  const firstObject = topology.objects[objectKeys[0]] as GeometryCollection;
  const featureCollection = topoFeature(topology, firstObject) as {
    features?: Array<{ properties?: { name?: string } }>;
  };

  for (const feat of featureCollection.features || []) {
    const rawName = feat.properties?.name;
    if (!rawName) continue;

    const lookupKeys = toLookupKeys(rawName);
    const info = lookupKeys.map((k) => restLookup[k]).find(Boolean);
    if (!info) continue;

    const [lng, lat] = geoCentroid(feat as never);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    centroids.set(info.cca2, { lat, lng });
  }

  return centroids;
}

function getCountryFromMapName(
  nameRaw: string,
  restLookup: Record<string, RestLookupInfo>,
  byCode: Map<string, PlayableCountry>
): PlayableCountry | null {
  const info = toLookupKeys(nameRaw)
    .map((k) => restLookup[k])
    .find(Boolean);

  if (!info) return null;
  return byCode.get(info.cca2) ?? null;
}

export default function GuessCountryGame() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { dimensions, isDesktop } = useMapDimensions();

  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  const sidePanelDesktopWidth = 360;
  const desktopGap = 12;
  const reservedHorizontal = 36;

  const desktopMapMaxW = viewportW - sidePanelDesktopWidth - desktopGap - reservedHorizontal;
  const mobileMapMaxW = viewportW - 14;
  const OUTER_W = isDesktop
    ? Math.max(640, Math.min(dimensions.width, desktopMapMaxW))
    : Math.max(320, Math.min(dimensions.width, mobileMapMaxW));

  const desktopMapMaxH = viewportH - 110;
  const mobileMapMaxH = Math.floor(viewportH * 0.52);
  const OUTER_H = isDesktop
    ? Math.max(360, Math.min(dimensions.height, desktopMapMaxH))
    : Math.max(230, Math.min(dimensions.height, mobileMapMaxH));
  const INNER_W = OUTER_W - FRAME * 2;
  const FIT_SCALE = Math.max(1, Math.round(INNER_W * 0.32));

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [restLookup, setRestLookup] = useState<Record<string, RestLookupInfo>>({});
  const [countryByCode, setCountryByCode] = useState<Map<string, PlayableCountry>>(new Map());
  const [playableCodes, setPlayableCodes] = useState<string[]>([]);
  const [targetCode, setTargetCode] = useState<string | null>(null);
  const [guesses, setGuesses] = useState<GuessResultRowData[]>([]);
  const [statSaved, setStatSaved] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const resultsWrapRef = useRef<HTMLDivElement>(null);
  usePreventWheelScroll(wrapperRef);

  useEffect(() => {
    if (resultsWrapRef.current) {
      // Keep newest guess visible when user was scrolling older cards.
      resultsWrapRef.current.scrollTop = 0;
    }
  }, [guesses.length]);

  const target = useMemo(() => {
    if (!targetCode) return null;
    return countryByCode.get(targetCode) ?? null;
  }, [countryByCode, targetCode]);

  const attemptsUsed = guesses.length;
  const attemptsRemaining = Math.max(0, MAX_ATTEMPTS - attemptsUsed);
  const hasWon = !!target && guesses.some((g) => g.cca2 === target.cca2);
  const isGameOver = hasWon || attemptsUsed >= MAX_ATTEMPTS;
  const showStartHint = !loading && !loadError && !target && guesses.length === 0;

  const pickRandomTargetCode = useCallback((codes: string[], excludeCca2?: string) => {
    const candidates = excludeCca2 ? codes.filter((c) => c !== excludeCca2) : codes;
    const source = candidates.length > 0 ? candidates : codes;
    if (!source.length) return null;
    const idx = Math.floor(Math.random() * source.length);
    return source[idx];
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setLoadError("");

        const [countriesRes, topologyRes] = await Promise.all([
          fetch("/countries-full.json"),
          fetch("/countries-110m.json"),
        ]);

        if (!countriesRes.ok) {
          throw new Error(`countries-full.json HTTP ${countriesRes.status}`);
        }
        if (!topologyRes.ok) {
          throw new Error(`countries-110m.json HTTP ${topologyRes.status}`);
        }

        const countries = (await countriesRes.json()) as CountryData[];
        const topology = (await topologyRes.json()) as Topology;

        let statsByCode: Record<string, CountryStatsData> = {};
        try {
          const statsRes = await fetch("https://restcountries.com/v3.1/all?fields=cca2,population,area,region,subregion");
          if (statsRes.ok) {
            const stats = (await statsRes.json()) as CountryStatsData[];
            statsByCode = Object.fromEntries(stats.map((s) => [s.cca2, s]));
          }
        } catch {
          // Fallback to local data if external stats are unavailable.
        }

        const mergedCountries: CountryData[] = countries.map((c) => {
          const ext = statsByCode[c.cca2];
          if (!ext) return c;

          return {
            ...c,
            region: ext.region || c.region,
            subregion: ext.subregion || c.subregion,
            population: typeof ext.population === "number" ? ext.population : c.population,
            area: typeof ext.area === "number" ? ext.area : c.area,
          };
        });

        const builtLookup = buildRestLookup(mergedCountries, i18n.language) as Record<string, RestLookupInfo>;
        const hintLookup = buildCountryHintLookup(mergedCountries);
        const centroidByCode = extractCentroidsByCode(topology, builtLookup);

        // Ensure tiny islands always have coordinates even if topology is simplified.
        for (const [markerName, [lng, lat]] of Object.entries(SMALL_ISLAND_MARKERS)) {
          const info = toLookupKeys(markerName)
            .map((k) => builtLookup[k])
            .find(Boolean);

          if (!info) continue;
          if (!centroidByCode.has(info.cca2)) {
            centroidByCode.set(info.cca2, { lat, lng });
          }
        }

        const playable = new Map<string, PlayableCountry>();

        for (const c of mergedCountries) {
          const eligible = c.independent === true || c.unMember === true || FLAG_MATCH_SPECIAL_TERRITORIES.has(c.cca2);
          if (!eligible) continue;
          if (!isClickableInGameMode(c.name.common)) continue;

          const coords = centroidByCode.get(c.cca2);
          if (!coords) continue;

          const hint = hintLookup[c.cca2];
          const isRussia = c.cca2 === "RU";
          const resolvedContinent = isRussia ? "Asia" : (hint?.continent || c.region || "");
          const localizedName = builtLookup[c.name.common]?.name || c.name.common;
          const resolvedDisplayName = isRussia ? `${localizedName} (Asia)` : localizedName;
          playable.set(c.cca2, {
            name: localizedName,
            displayName: resolvedDisplayName,
            cca2: c.cca2,
            continent: resolvedContinent,
            subregion: hint?.subregion || c.subregion || "",
            population: hint?.population ?? null,
            area: hint?.area ?? null,
            borderCount: hint?.borderCount ?? (Array.isArray(c.borders) ? c.borders.length : 0),
            lat: coords.lat,
            lng: coords.lng,
          });
        }

        if (!alive) return;

        const nextCodes = Array.from(playable.keys());
        setRestLookup(builtLookup);
        setCountryByCode(playable);
        setPlayableCodes(nextCodes);
        setGuesses([]);
        setTargetCode(null);
      } catch (error) {
        if (!alive) return;
        const message = error instanceof Error ? error.message : t("game.loadError");
        setLoadError(message);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [i18n.language, t]);

  // Save stat when user wins (any number of attempts)
  useEffect(() => {
    if (!user || statSaved || !isGameOver || !hasWon) return;

    (async () => {
      try {
        await incrementGuessCountryWins(user);
        setStatSaved(true);
      } catch (error) {
        console.error("Failed to save Guess Country stat:", error);
      }
    })();
  }, [user, isGameOver, hasWon, statSaved]);

  const startNewRound = useCallback(() => {
    setGuesses([]);
    setTargetCode(null);
    setStatSaved(false);
  }, []);

  const getRoundTarget = useCallback(
    (excludeCca2?: string): PlayableCountry | null => {
      if (targetCode) return countryByCode.get(targetCode) ?? null;

      const code = pickRandomTargetCode(playableCodes, excludeCca2);
      if (!code) return null;
      setTargetCode(code);
      return countryByCode.get(code) ?? null;
    },
    [countryByCode, pickRandomTargetCode, playableCodes, targetCode]
  );

  const handleCountryClick = useCallback(
    (nameRaw: string) => {
      if (loading || !!loadError || isGameOver) {
        return;
      }

      const guessedCountry = getCountryFromMapName(nameRaw, restLookup, countryByCode);
      if (!guessedCountry) return;

      const alreadyGuessed = guesses.some((g) => g.cca2 === guessedCountry.cca2);
      if (alreadyGuessed) return;

      const roundTarget = getRoundTarget(guessedCountry.cca2);
      if (!roundTarget) return;

      const fromPoint: GeoPoint = { lat: guessedCountry.lat, lng: guessedCountry.lng };
      const toPoint: GeoPoint = { lat: roundTarget.lat, lng: roundTarget.lng };
      const distanceKm = guessedCountry.cca2 === roundTarget.cca2 ? 0 : haversineDistanceKm(fromPoint, toPoint);
      const attemptNumber = guesses.length + 1;

      const row: GuessResultRowData = {
        cca2: guessedCountry.cca2,
        name: guessedCountry.displayName,
        attemptNumber,
        distanceKm,
        directionHint: guessedCountry.cca2 === roundTarget.cca2 ? "✅" : directionEmoji(fromPoint, toPoint),
        continentHint: guessedCountry.continent && guessedCountry.continent === roundTarget.continent ? "✅" : "❌",
        subregionHint: guessedCountry.subregion && guessedCountry.subregion === roundTarget.subregion ? "✅" : "❌",
        populationHint: compareHintEmoji(guessedCountry.population, roundTarget.population),
        areaHint: compareHintEmoji(guessedCountry.area, roundTarget.area),
        isCorrect: guessedCountry.cca2 === roundTarget.cca2,
      };

      setGuesses((prev) => [...prev, row]);
    },
    [countryByCode, getRoundTarget, guesses, isGameOver, loadError, loading, restLookup]
  );

  const getCountryFill = useCallback(
    (nameRaw: string): string => {
      const guessed = getCountryFromMapName(nameRaw, restLookup, countryByCode);
      if (!guessed) return "#d4cab0";

      const result = guesses.find((g) => g.cca2 === guessed.cca2);
      if (result) {
        return result.isCorrect ? "#22c55e" : "#ef4444";
      }

      if (!hasWon && attemptsUsed >= MAX_ATTEMPTS && target && guessed.cca2 === target.cca2) {
        return "#3b82f6";
      }

      return "#d4cab0";
    },
    [attemptsUsed, countryByCode, guesses, hasWon, restLookup, target]
  );

  return (
    <div
      style={{
        ...PAGE_CONTAINER_STYLE,
        justifyContent: "flex-start",
        padding: "72px 8px 14px",
        gap: "10px",
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      <BackButton onClick={() => navigate(buildLocalizedPath('/', i18n.language))} label={t("nav.menu")} />

      <div className="guess-country-layout">
        <div className="guess-country-map-col">
          <div
            ref={wrapperRef}
            className="guess-country-map-wrapper"
            style={getMapWrapperStyle(OUTER_W, OUTER_H, FRAME, FRAME_COLOR)}
          >
            {showStartHint && (
              <div className="guess-country-start-hud" aria-live="polite">
                <span className="guess-country-start-dot" aria-hidden="true" />
                <span>{t("game.startHint")}</span>
              </div>
            )}
            <Suspense fallback={<div className="guess-country-loading">{t("game.loading")}</div>}>
              <InteractiveMap
                width={OUTER_W}
                height={OUTER_H}
                scale={FIT_SCALE}
                zoom={1}
                coordinates={[0, 0]}
                gameMode
                markerSizeMultiplier={isDesktop ? 0.52 : 0.47}
                getCountryFill={getCountryFill}
                onCountryClick={handleCountryClick}
                isDesktop={isDesktop}
              />
            </Suspense>
          </div>
        </div>

        <aside className="guess-country-side-col">
          <div className="guess-country-status-panel">
            <div>
              <strong>{t("game.attempts")}: </strong>
              <span>{t("game.attemptsValue", { used: attemptsUsed, max: MAX_ATTEMPTS })}</span>
            </div>
            <div>{t("game.remaining", { remaining: attemptsRemaining })}</div>
          </div>

          {(loading || !!loadError || (target && isGameOver)) && (
          <div className="guess-country-feedback-panel">
            {loading && <div>{t("game.loading")}</div>}
            {!!loadError && <div>{`${t("game.loadError")} ${loadError}`}</div>}
            {!loadError && target && hasWon && (
              <div>{`${t("game.targetFound")} ${t("game.targetReveal", { country: target.name })}`}</div>
            )}
            {!loadError && target && !hasWon && attemptsUsed >= MAX_ATTEMPTS && (
              <div>{`${t("game.targetMissed")} ${t("game.targetReveal", { country: target.name })}`}</div>
            )}
          </div>
          )}

          <div className="guess-country-legend">{t("game.mapPanel.body")}</div>

          <div ref={resultsWrapRef} className="guess-country-results-wrap">
            {guesses.length === 0 && <div className="guess-country-history-empty">{t("game.historyEmpty")}</div>}
            {guesses
              .slice()
              .reverse()
              .map((row) => (
                <GuessResultRow key={row.cca2} row={row} t={t} />
              ))}
          </div>
        </aside>
      </div>

      {!loading && !loadError && target && isGameOver && (
        <div className="win-animation-overlay guess-country-win-overlay" role="dialog" aria-modal="true">
          <div className="win-animation-content">
            <div className="win-emoji">{hasWon ? "🎯" : "🧭"}</div>
            <h3 className={`win-title ${hasWon ? "perfect" : "legendary"}`}>
              {hasWon ? t("game.targetFound") : t("game.targetMissed")}
            </h3>
            <p className="win-message">{t("game.targetReveal", { country: target.name })}</p>
            <p className="win-attempts">
              {t("game.attempts")}: {t("game.attemptsValue", { used: attemptsUsed, max: MAX_ATTEMPTS })}
            </p>
            <div className="win-buttons">
              <button className="win-new-game-btn" onClick={startNewRound}>
                {t("game.playAgain")}
              </button>
              <button className="win-home-btn" onClick={() => navigate(buildLocalizedPath('/', i18n.language))}>
                {t("nav.menu")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
