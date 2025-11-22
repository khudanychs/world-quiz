import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import InteractiveMap from "./InteractiveMap";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import {
  buildRestLookup,
  isClickableCountry,
  isGameEligibleCountry,
  normalizeApos,
  normalizeCountryName,
  stripDiacritics,
} from "../utils/countries";

const FRAME = 10;
const BASE_W = 1000;
const BASE_H = 500;

type CountryInfo = { name: string; cca2: string; flag: string };

export default function FlagMatchGame() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Layout sizing
  const [dimensions, setDimensions] = useState({ width: BASE_W, height: BASE_H });
  useEffect(() => {
    const update = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const isPortrait = vh > vw;
      
      // More aggressive sizing for mobile portrait
      const maxW = vw * (isPortrait ? 0.92 : 0.95);
      const maxH = vh * (isPortrait ? 0.72 : 0.85);
      
      // Better aspect ratio for portrait mode (more height)
      const ar = isPortrait ? 1.5 : (BASE_W / BASE_H);
      
      let width = maxW;
      let height = width / ar;
      if (height > maxH) {
        height = maxH;
        width = height * ar;
      }
      setDimensions({ width, height });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const OUTER_W = dimensions.width;
  const OUTER_H = dimensions.height;
  const INNER_W = OUTER_W - FRAME * 2;
  const INNER_H = OUTER_H - FRAME * 2;

  const [pos, setPos] = useState<{ coordinates: [number, number]; zoom: number }>(
    { coordinates: [0, 0], zoom: 1 }
  );

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

  // prevent page scroll on wheel over map
  const wrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => e.preventDefault();
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel as any);
  }, []);

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

  // Build targets after we have both lookup and geographies list (deferred until we render geographies)
  const geosRef = useRef<any[] | null>(null);

  const FIT_SCALE = Math.max(1, Math.round(INNER_W * 0.32));

  // Background prefetch: once we have both geographies and REST lookup, prefetch a larger set of flags
  const didBgPrefetch = useRef(false);
  useEffect(() => {
    if (didBgPrefetch.current) return;
    const geos = geosRef.current;
    if (!geos || geos.length === 0) return;
    if (!restLookup || Object.keys(restLookup).length === 0) return;

    // Build playable list once and prefetch a reasonable amount (e.g., 60)
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

  // Clear any scheduled timers when unmounting
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

    // Deduplicate by cca2
    const unique = Array.from(new Map(playable.map((c) => [c.cca2, c])).values());
    // Shuffle
    for (let i = unique.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [unique[i], unique[j]] = [unique[j], unique[i]];
    }
    // Limit to a reasonable round length
    const round = unique.slice(0, Math.min(25, unique.length));
    // Preload flags for this round immediately
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
    // Clear previously scheduled timeouts so rapid clicks don't queue
    if (correctTimerRef.current) {
      window.clearTimeout(correctTimerRef.current);
      correctTimerRef.current = null;
    }
    if (wrongTimerRef.current) {
      window.clearTimeout(wrongTimerRef.current);
      wrongTimerRef.current = null;
    }

    const norm = normalizeCountryName(nameRaw);
    const k1 = normalizeApos(norm);
    const k2 = stripDiacritics(k1);
    const clicked = restLookup[k1] || restLookup[k2];
    if (clicked && clicked.cca2 === currentTarget.cca2) {
      // Correct: immediately update states and keep highlighted until next click
      const newScore = score + 1;
      const newStreak = currentStreak + 1;
      
      setScore(newScore);
      setCorrectSet((s) => new Set([...s, norm]));
      setLastClicked({ name: norm, status: "correct" });
      setFeedback("correct");
      setCurrentStreak(newStreak);
      
      // Update best streak
      if (newStreak > bestStreak) {
        setBestStreak(newStreak);
      }
      
      // Show streak animation for milestones (5, 10, 15, etc.)
      if (newStreak > 0 && newStreak % 5 === 0) {
        setShowStreakAnimation(true);
        setTimeout(() => setShowStreakAnimation(false), 2000);
      }
      
      correctTimerRef.current = window.setTimeout(() => {
        // Check if we've completed 25 countries
        if (newScore === 25 && skippedSet.size === 0) {
          // Win! All 25 correct with no skips
          setHasWon(true);
          setShowWinAnimation(true);
        } else if (currentIdx + 1 >= targets.length && skippedSet.size > 0) {
          // Reached end of initial 25, but there are skipped ones - add them back
          const skippedCountries: CountryInfo[] = [];
          skippedSet.forEach(skippedName => {
            const k1 = normalizeApos(skippedName);
            const k2 = stripDiacritics(k1);
            const info = restLookup[k1] || restLookup[k2];
            if (info) skippedCountries.push(info);
          });
          
          // Shuffle skipped countries
          for (let i = skippedCountries.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [skippedCountries[i], skippedCountries[j]] = [skippedCountries[j], skippedCountries[i]];
          }
          
          // Add to targets and continue
          setTargets(prev => [...prev, ...skippedCountries]);
          setCurrentIdx((i) => i + 1);
        } else {
          setCurrentIdx((i) => i + 1);
        }
        
        setFeedback("");
        correctTimerRef.current = null;
      }, 350);
    } else {
      // Wrong: stays highlighted until next click, reset streak
      setLastClicked({ name: norm, status: "wrong" });
      setFeedback("wrong");
      setCurrentStreak(0);
    }
  }

  function skipCurrentFlag() {
    if (!currentTarget) return;
    
    // Clear any scheduled timeouts
    if (correctTimerRef.current) {
      window.clearTimeout(correctTimerRef.current);
      correctTimerRef.current = null;
    }
    if (wrongTimerRef.current) {
      window.clearTimeout(wrongTimerRef.current);
      wrongTimerRef.current = null;
    }

    // Mark as skipped and highlight with orange
    const norm = normalizeCountryName(currentTarget.name);
    setSkippedSet((s) => new Set([...s, norm]));
    // Clear last clicked so we don't show red highlight
    setLastClicked(null);
    // Reset streak on skip
    setCurrentStreak(0);
    
    // Move to next after a brief delay
    correctTimerRef.current = window.setTimeout(() => {
      setCurrentIdx((i) => i + 1);
      setFeedback("");
      correctTimerRef.current = null;
    }, 350);
  }

  const gameOver = (currentIdx >= targets.length && targets.length > 0) || hasWon;

  // Effect to save score when game is over
  useEffect(() => {
    if (gameOver && user && score > 0) {
      const saveScore = async () => {
        try {
          await addDoc(collection(db, "scores"), {
            userId: user.uid,
            username: user.displayName,
            score: score,
            bestStreak: bestStreak,
            createdAt: serverTimestamp(),
            gameType: "FlagMatch",
          });
          console.log("Score saved successfully!");
        } catch (error) {
          console.error("Error saving score: ", error);
        }
      };

      saveScore();
    }
  }, [gameOver, user, score, bestStreak]);

  return (
    <>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scaleIn {
            from { transform: scale(0.5); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          @keyframes streakPop {
            0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
            50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
          }
        `}
      </style>
      <div
        style={{
          height: "100%",
          width: "100%",
          background: "#0b1020",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          position: "relative",
          overscrollBehavior: "none",
        }}
      >
      <button
        onClick={() => navigate("/")}
        aria-label="Back to main menu"
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          zIndex: 4,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.25)",
          background: "rgba(0,0,0,0.45)",
          color: "#fff",
          cursor: "pointer",
          backdropFilter: "blur(6px)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
        }}
      >
        <span style={{ fontSize: 18, lineHeight: 1 }}>←</span>
        <span style={{ fontWeight: 600 }}>Back</span>
      </button>

      {/* Top center panel */}
      <div
        style={{
          position: "absolute",
          top: "clamp(52px, 8vh, 70px)",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 4,
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "clamp(4px, 1.2vw, 8px)",
          padding: "clamp(6px, 1.5vw, 12px) clamp(8px, 2vw, 14px)",
          borderRadius: "clamp(8px, 2vw, 12px)",
          border: "1px solid rgba(255,255,255,0.25)",
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(8px)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
          maxWidth: "92vw",
        }}
      >
        {loading ? (
          <span style={{ fontSize: "clamp(12px, 2.8vw, 16px)" }}>Loading flags…</span>
        ) : loadError ? (
          <span style={{ fontSize: "clamp(12px, 2.8vw, 16px)" }}>Error: {loadError}</span>
        ) : gameOver ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "8px 0" }}>
            {hasWon ? (
              <>
                <strong style={{ fontSize: "clamp(16px, 3.5vw, 24px)", color: "#10b981" }}>🎉 Perfect Score! 🎉</strong>
                <span style={{ opacity: 0.9, fontSize: "clamp(14px, 3vw, 18px)" }}>
                  All {score} flags matched correctly!
                </span>
                {bestStreak > 0 && (
                  <span style={{ opacity: 0.8, fontSize: "clamp(12px, 2.8vw, 16px)" }}>
                    Best streak: {bestStreak} 🔥
                  </span>
                )}
              </>
            ) : (
              <>
                <strong style={{ fontSize: "clamp(14px, 3.2vw, 20px)" }}>Round finished</strong>
                <span style={{ opacity: 0.8, fontSize: "clamp(12px, 2.8vw, 16px)" }}>
                  Score: {score}/{targets.length}
                </span>
                {bestStreak > 0 && (
                  <span style={{ opacity: 0.8, fontSize: "clamp(11px, 2.6vw, 14px)" }}>
                    Best streak: {bestStreak} 🔥
                  </span>
                )}
              </>
            )}
            <button
              onClick={startNewGame}
              style={{
                marginTop: 4,
                padding: "clamp(8px, 2vw, 12px) clamp(16px, 4vw, 24px)",
                borderRadius: "clamp(8px, 2vw, 12px)",
                border: "2px solid rgba(16, 185, 129, 0.5)",
                background: "rgba(16, 185, 129, 0.2)",
                color: "#10b981",
                fontSize: "clamp(13px, 3vw, 17px)",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(16, 185, 129, 0.3)";
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(16, 185, 129, 0.2)";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              🎮 New Game
            </button>
          </div>
        ) : !currentTarget ? (
          <button
            onClick={startNewGame}
            style={{
              padding: "clamp(8px, 2vw, 12px) clamp(16px, 4vw, 20px)",
              borderRadius: "clamp(8px, 2vw, 10px)",
              border: "1px solid rgba(255,255,255,0.3)",
              background: "rgba(255,255,255,0.08)",
              color: "#fff",
              fontSize: "clamp(13px, 3vw, 16px)",
              cursor: "pointer",
            }}
          >
            Start round
          </button>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: "clamp(50px, 12vw, 90px)",
                minHeight: "clamp(38px, 9vw, 68px)",
                maxWidth: "clamp(50px, 12vw, 90px)",
                maxHeight: "clamp(38px, 9vw, 68px)",
                background: "rgba(255,255,255,0.05)",
                borderRadius: 4,
                padding: 3,
              }}
            >
              <img
                src={currentTarget.flag}
                alt={`Flag to match`}
                loading="eager"
                decoding="async"
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  width: "auto",
                  height: "auto",
                  objectFit: "contain",
                  borderRadius: 2,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
                }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", minWidth: "clamp(90px, 22vw, 130px)" }}>
              <strong style={{ fontSize: "clamp(10px, 2.4vw, 15px)" }}>Find this flag</strong>
              <span style={{ opacity: 0.7, fontSize: "clamp(8px, 2vw, 12px)" }}>Tap country</span>
            </div>
            <span style={{ marginLeft: 4, opacity: 0.8, fontSize: "clamp(10px, 2.4vw, 14px)", whiteSpace: "nowrap" }}>
              {currentIdx + 1}/{targets.length}
            </span>
            {currentStreak >= 3 && (
              <span
                style={{
                  marginLeft: 4,
                  padding: "4px 8px",
                  borderRadius: 6,
                  background: "rgba(251, 146, 60, 0.2)",
                  border: "1px solid rgba(251, 146, 60, 0.4)",
                  color: "#fb923c",
                  fontSize: "clamp(10px, 2.4vw, 13px)",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                🔥 {currentStreak}
              </span>
            )}
            <button
              onClick={() => setShowNamePanel((v) => !v)}
              title="Toggle last clicked country name"
              style={{
                marginLeft: 4,
                padding: "clamp(4px, 1.5vw, 6px) clamp(8px, 2vw, 10px)",
                minWidth: "clamp(70px, 18vw, 84px)",
                borderRadius: "clamp(6px, 1.8vw, 8px)",
                border: "1px solid rgba(255,255,255,0.3)",
                background: "rgba(255,255,255,0.08)",
                color: "#fff",
                fontSize: "clamp(10px, 2.4vw, 13px)",
                cursor: "pointer",
              }}
            >
              {showNamePanel ? "Hide name" : "Show name"}
            </button>
            <button
              onClick={skipCurrentFlag}
              title="Skip this flag"
              style={{
                marginLeft: 4,
                padding: "clamp(4px, 1.5vw, 6px) clamp(8px, 2vw, 10px)",
                minWidth: "clamp(50px, 14vw, 60px)",
                borderRadius: "clamp(6px, 1.8vw, 8px)",
                border: "1px solid rgba(255,165,0,0.4)",
                background: "rgba(255,165,0,0.15)",
                color: "#ffa500",
                fontSize: "clamp(10px, 2.4vw, 13px)",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Skip
            </button>
          </>
        )}
      </div>

      {/* Score top-right */}
      <div
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          zIndex: 4,
          padding: "clamp(6px, 1.8vw, 8px) clamp(10px, 2.5vw, 12px)",
          borderRadius: "clamp(8px, 2vw, 10px)",
          background: "rgba(0,0,0,0.45)",
          border: "1px solid rgba(255,255,255,0.25)",
          fontSize: "clamp(12px, 2.8vw, 16px)",
        }}
      >
        Score: {score}
      </div>

      {/* Win Animation */}
      {showWinAnimation && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0, 0, 0, 0.85)",
            animation: "fadeIn 0.3s ease-out",
          }}
        >
          <div
            style={{
              textAlign: "center",
              animation: "scaleIn 0.5s ease-out",
              position: "relative",
            }}
          >
            <div style={{ fontSize: "clamp(60px, 15vw, 120px)", marginBottom: 20 }}>🎉</div>
            <h1 style={{ fontSize: "clamp(32px, 8vw, 64px)", margin: "0 0 20px", color: "#10b981" }}>
              Perfect!
            </h1>
            <p style={{ fontSize: "clamp(18px, 4.5vw, 32px)", margin: "0 0 40px", opacity: 0.9 }}>
              All 25 flags matched! 🌍
            </p>
            <div
              style={{
                display: "flex",
                gap: "clamp(12px, 3vw, 20px)",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => {
                  setShowWinAnimation(false);
                  navigate("/");
                }}
                style={{
                  padding: "clamp(10px, 2.5vw, 14px) clamp(20px, 5vw, 32px)",
                  borderRadius: "clamp(8px, 2vw, 12px)",
                  border: "2px solid rgba(255, 255, 255, 0.3)",
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "#fff",
                  fontSize: "clamp(14px, 3.5vw, 18px)",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                🏠 Home
              </button>
              <button
                onClick={() => {
                  setShowWinAnimation(false);
                  startNewGame();
                }}
                style={{
                  padding: "clamp(10px, 2.5vw, 14px) clamp(20px, 5vw, 32px)",
                  borderRadius: "clamp(8px, 2vw, 12px)",
                  border: "2px solid rgba(16, 185, 129, 0.5)",
                  background: "rgba(16, 185, 129, 0.2)",
                  color: "#10b981",
                  fontSize: "clamp(14px, 3.5vw, 18px)",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(16, 185, 129, 0.3)";
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(16, 185, 129, 0.2)";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                🎮 New Game
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Streak Animation */}
      {showStreakAnimation && currentStreak >= 5 && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 10,
            fontSize: "clamp(32px, 8vw, 64px)",
            fontWeight: "bold",
            color: "#fb923c",
            textShadow: "0 0 20px rgba(251, 146, 60, 0.8), 0 0 40px rgba(251, 146, 60, 0.4)",
            animation: "streakPop 0.6s ease-out",
            pointerEvents: "none",
          }}
        >
          {currentStreak} 🔥
        </div>
      )}

      {showNamePanel && lastClicked && (
        <div
          style={{
            position: "absolute",
            bottom: 16,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "8px 12px",
            background: "rgba(0,0,0,0.5)",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.25)",
            zIndex: 4,
            maxWidth: "92vw",
            fontSize: "clamp(12px, 3vw, 16px)",
            textAlign: "center",
          }}
        >
          {normalizeCountryName(lastClicked.name)}
        </div>
      )}

      <div
        ref={wrapperRef}
        style={{
          width: OUTER_W,
          height: OUTER_H,
          border: `${FRAME}px solid #5b8cff`,
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
          background: "linear-gradient(180deg, #0f2a4a 0%, #0b1c34 60%, #081226 100%)",
          display: "grid",
          placeItems: "center",
          touchAction: "none",
        }}
        aria-label="Flag match game map"
      >
        <InteractiveMap
          width={INNER_W}
          height={INNER_H}
          scale={Math.max(1, Math.round(INNER_W * 0.32))}
          center={[0, 15]}
          zoom={pos.zoom}
          coordinates={pos.coordinates}
          onMoveEnd={({ zoom, coordinates }: { zoom: number; coordinates: [number, number] }) =>
            setPos({ zoom, coordinates })
          }
          onCountryClick={(nameRaw: string) => {
            onCountryClick(nameRaw);
          }}
          onGeographiesLoaded={(geographies) => {
            if (!geosRef.current || geosRef.current.length === 0) {
              geosRef.current = geographies;
            }
          }}
          getCountryFill={(nameRaw: string) => {
            const norm = normalizeCountryName(nameRaw);
            
            const isCorrect = correctSet.has(norm);
            const isSkipped = skippedSet.has(norm);
            const defaultFill = "#e0d8c2";
            const isLastWrong = lastClicked?.name === norm && lastClicked?.status === "wrong";
            
            return isCorrect
              ? "#10b981"
              : isSkipped
              ? "#ff8c00"
              : isLastWrong
              ? "#ef4444"
              : defaultFill;
          }}
        />
      </div>
    </div>
    </>
  );
}
