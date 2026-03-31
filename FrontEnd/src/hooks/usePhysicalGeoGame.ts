import { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  getFeaturesByCategoryAsync,
  shuffleFeatures,
  type PhysicalFeature,
} from "../utils/physicalFeatures";
import {
  loadDesertPolygonFeatures,
  loadMountainElevationFeatures,
} from "../utils/terrainGeoFeatures";
import { localizePhysicalFeatures } from "../utils/physicalFeatureLocalization";

export interface PhysicalGeoGameState {
  // Data
  features: PhysicalFeature[];
  currentIdx: number;
  currentFeature: PhysicalFeature | undefined;
  loading: boolean;

  // Scoring
  score: number;
  currentStreak: number;
  bestStreak: number;
  skippedCount: number;
  correctSet: Set<string>;
  skippedSet: Set<string>;

  // Game state
  gameOver: boolean;
  hasWon: boolean;
  showWinAnimation: boolean;

  // Result display
  showingResult: boolean;
  lastResult: {
    clickedName: string;
    correct: boolean;
  } | null;

  // Actions
  handleFeatureClick: (featureName: string) => void;
  skipCurrent: () => void;
  startNewGame: (categoryKey?: string) => void;
}

export function usePhysicalGeoGame(categoryKey: string = "all"): PhysicalGeoGameState {
  const { i18n } = useTranslation();
  const [features, setFeatures] = useState<PhysicalFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [correctSet, setCorrectSet] = useState<Set<string>>(new Set());
  const [skippedSet, setSkippedSet] = useState<Set<string>>(new Set());
  const [gameOver, setGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [showWinAnimation, setShowWinAnimation] = useState(false);
  const [showingResult, setShowingResult] = useState(false);
  const [lastResult, setLastResult] = useState<{
    clickedName: string;
    correct: boolean;
  } | null>(null);

  const resultTimerRef = useRef<number | null>(null);
  const winTimerRef = useRef<number | null>(null);
  const requestIdRef = useRef(0);

  // --- DATA SELECTORS ---
  const currentFeature = features[currentIdx];

  const loadCategoryFeatures = useCallback(async (key: string): Promise<PhysicalFeature[]> => {
    let baseFeatures: PhysicalFeature[];
    let featureTypes: Array<"rivers" | "waters" | "lakes"> | undefined;
    
    if (key === "mountains") {
      baseFeatures = await loadMountainElevationFeatures(i18n.language);
      // Mountains don't need any of the marine/river/lake datasets
      featureTypes = [];
    } else if (key === "deserts") {
      baseFeatures = await loadDesertPolygonFeatures(i18n.language);
      // Deserts don't need any of the marine/river/lake datasets
      featureTypes = [];
    } else if (key === "rivers") {
      baseFeatures = await getFeaturesByCategoryAsync(key);
      featureTypes = ["rivers"];
    } else if (key === "waters") {
      baseFeatures = await getFeaturesByCategoryAsync(key);
      featureTypes = ["waters", "lakes"];
    } else {
      baseFeatures = await getFeaturesByCategoryAsync(key);
      // For unknown categories, load all (shouldn't happen but safe fallback)
      featureTypes = ["rivers", "waters", "lakes"];
    }
    
    return localizePhysicalFeatures(baseFeatures, i18n.language, featureTypes);
  }, [i18n.language]);

  const initializeCategory = useCallback(async (key: string) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);

    try {
      const loaded = await loadCategoryFeatures(key);
      if (requestId !== requestIdRef.current) {
        return;
      }

      const shuffled = shuffleFeatures(loaded);
      setFeatures(shuffled);
      setCurrentIdx(0);
      setScore(0);
      setCurrentStreak(0);
      setBestStreak(0);
      setSkippedCount(0);
      setCorrectSet(new Set());
      setSkippedSet(new Set());
      setGameOver(false);
      setHasWon(false);
      setShowWinAnimation(false);
      setShowingResult(false);
      setLastResult(null);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load category features:', error);
      if (requestId !== requestIdRef.current) {
        return;
      }

      // Fallback to empty state on error
      setFeatures([]);
      setCurrentIdx(0);
      setScore(0);
      setCurrentStreak(0);
      setBestStreak(0);
      setSkippedCount(0);
      setCorrectSet(new Set());
      setSkippedSet(new Set());
      setGameOver(true);
      setHasWon(false);
      setShowWinAnimation(false);
      setShowingResult(false);
      setLastResult(null);
      setLoading(false);
    }
  }, [loadCategoryFeatures]);

  

  const advanceToNext = useCallback(
    (idx: number, total: number, wonSoFar: number) => {
      const nextIdx = idx + 1;
      if (nextIdx >= total) {
        setGameOver(true);
        setHasWon(wonSoFar > 0);
        if (wonSoFar > 0) {
          setShowWinAnimation(true);
          winTimerRef.current = window.setTimeout(() => {
            setShowWinAnimation(false);
          }, 4000);
        }
      } else {
        setCurrentIdx(nextIdx);
      }
    },
    []
  );

  const handleFeatureClick = useCallback(
    (featureName: string) => {
      if (gameOver || showingResult || !currentFeature) return;

      const correct = featureName === currentFeature.name;

      if (correct) {
        setScore(s => s + 1);
        setCorrectSet(prev => new Set(prev).add(featureName));
        setCurrentStreak(s => {
          const next = s + 1;
          setBestStreak(b => Math.max(b, next));
          return next;
        });
      } else {
        setCurrentStreak(0);
      }

      setLastResult({ clickedName: featureName, correct });
      setShowingResult(true);

      const delay = correct ? 1000 : 2000;
      if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
      resultTimerRef.current = window.setTimeout(() => {
        setShowingResult(false);
        setLastResult(null);
        advanceToNext(currentIdx, features.length, score + (correct ? 1 : 0));
      }, delay);
    },
    [gameOver, showingResult, currentFeature, currentIdx, features.length, score, advanceToNext]
  );

  const skipCurrent = useCallback(() => {
    if (gameOver || showingResult || !currentFeature) return;
    setSkippedCount(s => s + 1);
    setCurrentStreak(0);
    setSkippedSet(prev => new Set(prev).add(currentFeature.name));

    // Show the correct answer highlighted (yellow glow) for 1.5s
    setLastResult({ clickedName: "", correct: false });
    setShowingResult(true);

    if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
    resultTimerRef.current = window.setTimeout(() => {
      setShowingResult(false);
      setLastResult(null);
      advanceToNext(currentIdx, features.length, score);
    }, 1500);
  }, [gameOver, showingResult, currentFeature, currentIdx, features.length, score, advanceToNext]);

  const startNewGame = useCallback(
    (newCategoryKey?: string) => {
      const key = newCategoryKey ?? categoryKey;
      if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
      if (winTimerRef.current) clearTimeout(winTimerRef.current);
      void initializeCategory(key);
    },
    [categoryKey, initializeCategory]
  );

  return {
    features,
    currentIdx,
    currentFeature,
    loading,
    score,
    currentStreak,
    bestStreak,
    skippedCount,
    correctSet,
    skippedSet,
    gameOver,
    hasWon,
    showWinAnimation,
    showingResult,
    lastResult,
    handleFeatureClick,
    skipCurrent,
    startNewGame,
  };
}
