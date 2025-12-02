import { useEffect, useRef, useState } from "react";
import {
  buildRestLookup,
  isGameEligibleCountry,
  normalizeApos,
  normalizeCountryName,
  stripDiacritics,
} from "../utils/countries";
import { SMALL_ISLAND_MARKERS} from "../utils/markerPositions";

type CountryInfo = { name: string; cca2: string; flag: string };

export function useFlagMatchGame() {
  // Selection state
  const [correctSet, setCorrectSet] = useState<Set<string>>(new Set());
  const [skippedSet, setSkippedSet] = useState<Set<string>>(new Set());

  // REST Countries lookup for flags and codes
  const [restLookup, setRestLookup] = useState<Record<string, CountryInfo>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string>("");

  // Playable target list and current target
  const [targets, setTargets] = useState<CountryInfo[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const currentTarget = targets[currentIdx];

  // Game score
  const [score, setScore] = useState<number>(0);
  const [feedback, setFeedback] = useState<"" | "correct" | "wrong">("");
  const [lastClicked, setLastClicked] = useState<null | { name: string; status: "correct" | "wrong" }>(null);
  const [showNamePanel, setShowNamePanel] = useState<boolean>(false);
  
  // Streak tracking
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);
  const [showStreakAnimation, setShowStreakAnimation] = useState<boolean>(false);
  
  // Win state
  const [hasWon, setHasWon] = useState<boolean>(false);
  const [showWinAnimation, setShowWinAnimation] = useState<boolean>(false);

  // Cache for preloaded flag images
  const preloadedFlagsRef = useRef<Set<string>>(new Set());
  const preloadImage = (url: string) => {
    if (!url) return;
    const set = preloadedFlagsRef.current;
    if (set.has(url)) return;
    const img = new Image();
    img.src = url;
    set.add(url);
  };

  // Timers for feedback to avoid queuing multiple timeouts during rapid clicks
  const correctTimerRef = useRef<number | null>(null);
  const wrongTimerRef = useRef<number | null>(null);
  const streakTimerRef = useRef<number | null>(null);

  const geosRef = useRef<any[] | null>(null);

  // Load REST Countries once (from local file - faster and more reliable)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setLoadError("");
        // Load from local file instead of external API
        const res = await fetch("/countries.json");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as Array<{
          name: { common: string };
          cca2: string;
          flags: { svg?: string; png?: string };
          independent?: boolean;
          unMember?: boolean;
        }>;
        const lookup = buildRestLookup(data);
        if (!alive) return;
        setRestLookup(lookup);
      } catch (e: any) {
        if (!alive) return;
        setLoadError(e?.message || "Failed to load countries");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (correctTimerRef.current) window.clearTimeout(correctTimerRef.current);
      if (wrongTimerRef.current) window.clearTimeout(wrongTimerRef.current);
      if (streakTimerRef.current) window.clearTimeout(streakTimerRef.current);
    };
  }, []);

  function startNewGame() {
    const geos = geosRef.current || [];
    const playable: CountryInfo[] = [];
    
    // Add countries from map polygons
    for (const geo of geos) {
      const nameRaw = (geo.properties?.name as string) ?? "Unknown";
      const norm = normalizeCountryName(nameRaw);
      const key1 = normalizeApos(norm);
      const key2 = stripDiacritics(key1);
      const info = restLookup[key1] || restLookup[key2];
      
      // Pokud máme info a vlajku, přidej do playable
      if (info && info.flag) {
        // Kontrola jestli není na blacklistu
        if (!isGameEligibleCountry(nameRaw)) continue;
        playable.push(info);
      }
    }
    
    // Add countries from markers (small island nations and microstates)
    const allMarkers = { ...SMALL_ISLAND_MARKERS};
    for (const markerName of Object.keys(allMarkers)) {
      const norm = normalizeCountryName(markerName);
      const key1 = normalizeApos(norm);
      const key2 = stripDiacritics(key1);
      const info = restLookup[key1] || restLookup[key2];
      
      if (info && info.flag && isGameEligibleCountry(markerName)) {
        playable.push(info);
      }
    }
    
    const unique = Array.from(new Map(playable.map((c) => [c.cca2, c])).values());
    
    for (let i = unique.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [unique[i], unique[j]] = [unique[j], unique[i]];
    }
    const round = unique.slice(0, Math.min(25, unique.length));
    setTargets(round);
    setCurrentIdx(0);
    setScore(0);
    setCorrectSet(new Set());
    setSkippedSet(new Set());
    setFeedback("");
    setLastClicked(null);
    setCurrentStreak(0);
    setBestStreak(0);
    setHasWon(false);
    setShowWinAnimation(false);
    
    if (streakTimerRef.current) {
      window.clearTimeout(streakTimerRef.current);
      streakTimerRef.current = null;
    }
    setShowStreakAnimation(false);
    
    // Preload prvních 10 vlajek pro plynulý začátek
    round.slice(0, 10).forEach((c) => {
      if (c.flag) preloadImage(c.flag);
    });
  }

  function onCountryClick(nameRaw: string) {
    if (!currentTarget) return;
    
    const norm = normalizeCountryName(nameRaw);
    
    if (correctTimerRef.current) {
      window.clearTimeout(correctTimerRef.current);
      correctTimerRef.current = null;
    }
    if (wrongTimerRef.current) {
      window.clearTimeout(wrongTimerRef.current);
      wrongTimerRef.current = null;
    }

    const k1 = normalizeApos(norm);
    const k2 = stripDiacritics(k1);
    const clicked = restLookup[k1] || restLookup[k2];
    if (clicked && clicked.cca2 === currentTarget.cca2) {
      const newScore = score + 1;
      const newStreak = currentStreak + 1;
      
      setScore(newScore);
      setCorrectSet((s) => new Set([...s, norm]));
      setLastClicked({ name: norm, status: "correct" });
      setFeedback("correct");
      setCurrentStreak(newStreak);
      
      if (newStreak > bestStreak) {
        setBestStreak(newStreak);
      }
      
      if (newStreak > 0 && newStreak % 5 === 0) {
        if (streakTimerRef.current) {
          window.clearTimeout(streakTimerRef.current);
        }
        setShowStreakAnimation(true);
        streakTimerRef.current = window.setTimeout(() => {
          setShowStreakAnimation(false);
          streakTimerRef.current = null;
        }, 1200);
      }
      
      // Preload POUZE příští vlajku (nextIdx) - ta se zobrazí za 350ms
      // Vlajky nextIdx+1, nextIdx+2 už jsou načtené z předchozího kroku
      const nextIdx = currentIdx + 1;
      if (nextIdx < targets.length && targets[nextIdx]?.flag) {
        preloadImage(targets[nextIdx].flag);
      }
      
      correctTimerRef.current = window.setTimeout(() => {
        if (newScore === 25) {
          setHasWon(true);
          setShowWinAnimation(true);
        } else {
          setCurrentIdx((i) => i + 1);
        }
        setFeedback("");
        correctTimerRef.current = null;
      }, 350);
    } else {
      setLastClicked({ name: norm, status: "wrong" });
      setFeedback("wrong");
      setCurrentStreak(0);
    }
  }

  function skipCurrentFlag() {
    if (!currentTarget) return;
    
    if (correctTimerRef.current) {
      window.clearTimeout(correctTimerRef.current);
      correctTimerRef.current = null;
    }
    if (wrongTimerRef.current) {
      window.clearTimeout(wrongTimerRef.current);
      wrongTimerRef.current = null;
    }

    const norm = normalizeCountryName(currentTarget.name);
    setSkippedSet((s) => new Set([...s, norm]));
    setLastClicked(null);
    setCurrentStreak(0);
    
    // Preload POUZE příští vlajku při skipu
    const nextIdx = currentIdx + 1;
    if (nextIdx < targets.length && targets[nextIdx]?.flag) {
      preloadImage(targets[nextIdx].flag);
    }
    
    correctTimerRef.current = window.setTimeout(() => {
      setCurrentIdx((i) => i + 1);
      setFeedback("");
      correctTimerRef.current = null;
    }, 350);
  }

  function handleGeographiesLoaded(geos: any[]) {
    geosRef.current = geos;
  }

  const gameOver = (currentIdx >= targets.length && targets.length > 0) || hasWon;

  return {
    // State
    correctSet,
    skippedSet,
    restLookup,
    loading,
    loadError,
    targets,
    currentIdx,
    currentTarget,
    score,
    feedback,
    lastClicked,
    showNamePanel,
    setShowNamePanel,
    currentStreak,
    bestStreak,
    showStreakAnimation,
    hasWon,
    showWinAnimation,
    gameOver,
    
    // Actions
    startNewGame,
    onCountryClick,
    skipCurrentFlag,
    handleGeographiesLoaded,
  };
}
