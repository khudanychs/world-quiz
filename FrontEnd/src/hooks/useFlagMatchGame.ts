import { useEffect, useRef, useState } from "react";
import {
  buildRestLookup,
  isGameEligibleCountry,
  normalizeApos,
  normalizeCountryName,
  stripDiacritics,
} from "../utils/countries";

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

  const geosRef = useRef<any[] | null>(null);
  const didBgPrefetch = useRef(false);

  // Load REST Countries once
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setLoadError("");
        const res = await fetch(
          "https://restcountries.com/v3.1/all?fields=name,cca2,flags,independent,unMember"
        );
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

  // Background prefetch flags
  useEffect(() => {
    if (didBgPrefetch.current) return;
    const geos = geosRef.current;
    if (!geos || geos.length === 0) return;
    if (!restLookup || Object.keys(restLookup).length === 0) return;

    const playable: CountryInfo[] = [];
    for (const geo of geos) {
      const nameRaw = (geo.properties?.name as string) ?? "Unknown";
      if (!isGameEligibleCountry(nameRaw)) continue;
      const norm = normalizeCountryName(nameRaw);
      const key1 = normalizeApos(norm);
      const key2 = stripDiacritics(key1);
      const info = restLookup[key1] || restLookup[key2];
      if (info && info.flag) playable.push(info);
    }
    const unique = Array.from(new Map(playable.map((c) => [c.cca2, c])).values());
    const batch = unique.slice(0, Math.min(60, unique.length));
    batch.forEach((c) => preloadImage(c.flag));
    didBgPrefetch.current = true;
  }, [restLookup]);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (correctTimerRef.current) window.clearTimeout(correctTimerRef.current);
      if (wrongTimerRef.current) window.clearTimeout(wrongTimerRef.current);
    };
  }, []);

  function startNewGame() {
    const geos = geosRef.current || [];
    const playable: CountryInfo[] = [];
    for (const geo of geos) {
      const nameRaw = (geo.properties?.name as string) ?? "Unknown";
      if (!isGameEligibleCountry(nameRaw)) continue;
      const norm = normalizeCountryName(nameRaw);
      const key1 = normalizeApos(norm);
      const key2 = stripDiacritics(key1);
      const info = restLookup[key1] || restLookup[key2];
      if (info && info.flag) playable.push(info);
    }

    const unique = Array.from(new Map(playable.map((c) => [c.cca2, c])).values());
    for (let i = unique.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [unique[i], unique[j]] = [unique[j], unique[i]];
    }
    const round = unique.slice(0, Math.min(25, unique.length));
    round.forEach((c) => preloadImage(c.flag));
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
        setShowStreakAnimation(true);
        setTimeout(() => setShowStreakAnimation(false), 2000);
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
