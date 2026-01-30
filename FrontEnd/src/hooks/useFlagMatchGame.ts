import { useEffect, useRef, useState } from "react";
import {
  buildRestLookup,
  normalizeApos,
  normalizeCountryName,
  stripDiacritics,
  FLAG_MATCH_SPECIAL_TERRITORIES,
  isClickableInGameMode,
} from "../utils/countries";

type CountryInfo = { name: string; cca2: string; flag: string; region?: string };

export function useFlagMatchGame(selectedRegion: string | null = null, hasUserSelected: boolean = false) {
  // Selection state
  const [correctSet, setCorrectSet] = useState<Set<string>>(new Set());
  const [skippedSet, setSkippedSet] = useState<Set<string>>(new Set());

  // REST Countries lookup for flags and codes
  const [restLookup, setRestLookup] = useState<Record<string, CountryInfo>>({});
  const [allCountriesData, setAllCountriesData] = useState<Array<{
    name: { common: string };
    cca2: string;
    flags: { svg?: string; png?: string };
    independent?: boolean;
    region?: string;
  }>>([]);
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
        const res = await fetch("/countries-full.json");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as Array<{
          name: { common: string };
          cca2: string;
          flags: { svg?: string; png?: string };
          independent?: boolean;
          region?: string;
        }>;
        const lookup = buildRestLookup(data);
        if (!alive) return;
        setRestLookup(lookup);
        setAllCountriesData(data);
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

  // Restart game when region changes (after user makes initial selection)
  useEffect(() => {
    // Don't start game until user makes their first selection
    if (!hasUserSelected) {
      return;
    }
    
    if (!loading && allCountriesData.length > 0 && Object.keys(restLookup).length > 0) {
      startNewGame();
    }
  }, [selectedRegion, hasUserSelected, loading, allCountriesData.length]);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (correctTimerRef.current) window.clearTimeout(correctTimerRef.current);
      if (wrongTimerRef.current) window.clearTimeout(wrongTimerRef.current);
      if (streakTimerRef.current) window.clearTimeout(streakTimerRef.current);
    };
  }, []);

  function startNewGame() {
    const playable: CountryInfo[] = [];
    
    // Filter countries from the full dataset, matching CountryIndex logic
    for (const country of allCountriesData) {
      // Only include independent countries or special territories from FLAG_MATCH_SPECIAL_TERRITORIES
      if (!(country.independent === true || FLAG_MATCH_SPECIAL_TERRITORIES.has(country.cca2))) {
        continue;
      }
      
      // Filter by region if specified
      if (selectedRegion && country.region !== selectedRegion) {
        continue;
      }
      
      const norm = country.name.common;
      const key1 = normalizeApos(norm);
      const key2 = stripDiacritics(key1);
      const info = restLookup[key1] || restLookup[key2];
      
      if (info && info.flag) {
        playable.push(info);
      }
    }
    
    const unique = Array.from(new Map(playable.map((c) => [c.cca2, c])).values());
    
    // Shuffle the array
    for (let i = unique.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [unique[i], unique[j]] = [unique[j], unique[i]];
    }
    // For World mode (no region), use ALL countries for unlimited tryhard mode
    // For regional mode, use all countries in that region
    const round = unique;
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

    // Preload first 10 flags for smooth start
    round.slice(0, 10).forEach((c) => {
      if (c.flag) preloadImage(c.flag);
    });
  }

  function onCountryClick(nameRaw: string) {
    if (!currentTarget) return;
    
    const norm = normalizeCountryName(nameRaw);
    
    // Ignore clicks on territories that shouldn't be clickable in game modes
    // (e.g., Puerto Rico, New Caledonia, Falkland Islands)
    if (!isClickableInGameMode(nameRaw)) {
      return;
    }
    
    // Ignore clicks on already correctly guessed countries (don't break streak)
    if (correctSet.has(norm)) {
      return;
    }
    
    // If region is selected, only allow clicks on countries in that region
    if (selectedRegion) {
      const k1 = normalizeApos(norm);
      const k2 = stripDiacritics(k1);
      const clickedCountry = restLookup[k1] || restLookup[k2];
      
      // Find the clicked country in allCountriesData to check its region
      const countryData = allCountriesData.find(c => {
        const cName = normalizeCountryName(c.name.common);
        return cName === norm || c.cca2 === clickedCountry?.cca2;
      });
      
      // Ignore click if country is not in the selected region
      if (countryData && countryData.region !== selectedRegion) {
        return;
      }
    }
    
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
      
      // Preload ONLY the next flag (nextIdx) - it will be shown in 350ms
      // Flags nextIdx+1, nextIdx+2 are already loaded from previous step
      const nextIdx = currentIdx + 1;
      if (nextIdx < targets.length && targets[nextIdx]?.flag) {
        preloadImage(targets[nextIdx].flag);
      }
      
      correctTimerRef.current = window.setTimeout(() => {
        // Check if all flags have been matched (works for any region size)
        if (newScore === targets.length) {
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
    
    // Preload ONLY the next flag on skip
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
