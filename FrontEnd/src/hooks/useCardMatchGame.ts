import { useState, useEffect, useRef } from "react";
import { feature } from "topojson-client";
import { 
  normalizeCountryName, 
  normalizeApos, 
  stripDiacritics, 
  isGameEligibleCountry,
  buildRestLookup 
} from "../utils/countries";
import { SMALL_ISLAND_MARKERS } from "../utils/markerPositions";

export interface CountryCard {
  name: string;
  cca2: string;
  flag: string;
  geometry: any; // TopoJSON geometry for the country shape
  type: "flag" | "shape";
  id: string; // Unique ID for the card
}

interface GameState {
  cards: CountryCard[];
  selectedCards: string[]; // IDs of selected cards
  matchedPairs: Set<string>; // Country codes that have been matched in current set
  totalMatches: number; // Total matches across all sets
  score: number;
  streak: number;
  maxStreak: number; // Highest streak achieved in this game
  timeLeft: number; // in seconds
  gameStarted: boolean;
  gameOver: boolean;
  loading: boolean;
  loadError: string;
}

interface CountryInfo {
  name: string;
  cca2: string;
  flag: string;
}

const GAME_DURATION = 60; // 60 seconds
const BASE_POINTS = 1000;
const GRID_SIZE = 16; // 4x4 grid = 8 pairs

// Streak multiplier logic
function getStreakMultiplier(streak: number): number {
  if (streak < 5) return 1;
  if (streak < 10) return 1.5;
  if (streak < 15) return 2;
  if (streak < 20) return 2.5;
  return 3; // Max multiplier
}

export function useCardMatchGame() {
  const [state, setState] = useState<GameState>({
    cards: [],
    selectedCards: [],
    matchedPairs: new Set(),
    totalMatches: 0,
    score: 0,
    streak: 0,
    maxStreak: 0,
    timeLeft: GAME_DURATION,
    gameStarted: false,
    gameOver: false,
    loading: true,
    loadError: "",
  });

  const [restLookup, setRestLookup] = useState<Record<string, CountryInfo>>({});
  const [topoData, setTopoData] = useState<any>(null);
  const timerRef = useRef<number | null>(null);
  const [feedbackCard, setFeedbackCard] = useState<string | null>(null);

  // Load countries data and topology
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setState((s) => ({ ...s, loading: true, loadError: "" }));

        // Load REST Countries data for flags
        const restRes = await fetch("/countries-full.json");
        if (!restRes.ok) throw new Error(`Failed to load countries: ${restRes.status}`);
        const restData = (await restRes.json()) as Array<{
          name: { common: string };
          cca2: string;
          flags: { svg?: string; png?: string };
          independent?: boolean;
          unMember?: boolean;
        }>;

        const lookup = buildRestLookup(restData);
        console.log("Loaded REST Countries:", Object.keys(lookup).length);

        // Load TopoJSON for country shapes
        const topoRes = await fetch("/countries-110m.json");
        if (!topoRes.ok) throw new Error(`Failed to load map: ${topoRes.status}`);
        const topology = await topoRes.json();

        if (!alive) return;

        setRestLookup(lookup);
        setTopoData(topology);
        setState((s) => ({ ...s, loading: false }));
      } catch (err) {
        if (!alive) return;
        setState((s) => ({
          ...s,
          loading: false,
          loadError: err instanceof Error ? err.message : "Failed to load data",
        }));
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Timer effect
  useEffect(() => {
    if (!state.gameStarted || state.gameOver) return;

    timerRef.current = window.setInterval(() => {
      setState((s) => {
        const newTimeLeft = s.timeLeft - 1;
        if (newTimeLeft <= 0) {
          return { ...s, timeLeft: 0, gameOver: true };
        }
        return { ...s, timeLeft: newTimeLeft };
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [state.gameStarted, state.gameOver]);

  function generateNewCardSet() {
    if (!topoData) return;

    // Convert TopoJSON to GeoJSON
    const geoData: any = feature(topoData, topoData.objects.countries);
    const features = geoData.features || [];

    // Get playable countries (those with flags and valid geometry)
    const playableCountries: Array<{ info: CountryInfo; geometry: any }> = [];
    const seenCountryCodes = new Set<string>();

    for (const feat of features) {
      const nameRaw = (feat.properties?.name as string) ?? "Unknown";
      if (!isGameEligibleCountry(nameRaw)) continue;

      const normalized = normalizeCountryName(nameRaw);
      const key1 = normalizeApos(normalized);
      const key2 = stripDiacritics(key1);
      const info = restLookup[key1] || restLookup[key2];

      if (!info) {
        continue;
      }
      
      if (!info.flag) {
        console.warn("No flag for country:", info.name);
        continue;
      }

      if (feat.geometry) {
        let geometry: any = feat.geometry;
        
        // Fix for countries crossing the antimeridian (Russia, Fiji)
        // We shift negative longitudes to positive (+360) to make them contiguous
        // This moves them from e.g. -170 to 190, so the shape is 20..190 instead of split
        if (info.cca2 === "RU" || info.cca2 === "FJ") {
          // Deep clone to avoid mutating original
          geometry = JSON.parse(JSON.stringify(geometry));
          
          const shiftCoords = (coords: any[]) => {
            for (let i = 0; i < coords.length; i++) {
              if (Array.isArray(coords[i][0])) {
                shiftCoords(coords[i]); // Recurse for rings/polygons
              } else if (typeof coords[i][0] === 'number') {
                 // It's a coordinate point [lon, lat]
                 if (coords[i][0] < 0) {
                   coords[i][0] += 360;
                 }
              }
            }
          };

          if (geometry.coordinates) {
             shiftCoords(geometry.coordinates);
          }
        }
        
        playableCountries.push({ info, geometry });
        seenCountryCodes.add(info.cca2);
      } else {
        console.warn("No geometry for:", info.name, "cca2:", info.cca2);
      }
    }
    


    // Add marker countries that weren't already in the main features
    // These should also have geometry in the TopoJSON, we just need to find them
    for (const markerName of Object.keys(SMALL_ISLAND_MARKERS)) {
      if (!isGameEligibleCountry(markerName)) continue;

      const normalized = normalizeCountryName(markerName);
      const key1 = normalizeApos(normalized);
      const key2 = stripDiacritics(key1);
      const info = restLookup[key1] || restLookup[key2];

      if (!info || !info.flag || seenCountryCodes.has(info.cca2)) continue;

      // Try to find the geometry in the features
      const matchingFeature = features.find((feat: any) => {
        const featName = normalizeCountryName((feat.properties?.name as string) ?? "");
        return featName === normalized || featName === key1 || featName === key2;
      });

      if (matchingFeature && matchingFeature.geometry) {
        // Special handling for Russia - use only the largest piece
        let geometry = matchingFeature.geometry;
        if (info.cca2 === "RU" && geometry.type === "MultiPolygon") {
          const polygons = geometry.coordinates;
          let largestPolygon = polygons[0];
          let maxCoords = 0;
          
          for (const polygon of polygons) {
            const coordCount = polygon[0]?.length || 0;
            if (coordCount > maxCoords) {
              maxCoords = coordCount;
              largestPolygon = polygon;
            }
          }
          
          geometry = {
            type: "Polygon",
            coordinates: largestPolygon
          };
        }
        
        playableCountries.push({ info, geometry });
        seenCountryCodes.add(info.cca2);
      }
    }

    // Remove duplicates based on country code
    const unique = Array.from(
      new Map(playableCountries.map((c) => [c.info.cca2, c])).values()
    );

    // Shuffle and select pairs for the game
    for (let i = unique.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [unique[i], unique[j]] = [unique[j], unique[i]];
    }

    const pairCount = GRID_SIZE / 2;
    const selectedCountries = unique.slice(0, pairCount);

    // Create cards - one flag and one shape for each country
    const gameCards: CountryCard[] = [];
    for (const country of selectedCountries) {
      if (!country.info || !country.info.flag) {
        console.error("Invalid country data:", country);
        continue;
      }
      
      // Flag card
      gameCards.push({
        name: country.info.name,
        cca2: country.info.cca2,
        flag: country.info.flag,
        geometry: country.geometry,
        type: "flag",
        id: `${country.info.cca2}-flag`,
      });

      // Shape card
      gameCards.push({
        name: country.info.name,
        cca2: country.info.cca2,
        flag: country.info.flag,
        geometry: country.geometry,
        type: "shape",
        id: `${country.info.cca2}-shape`,
      });
    }

    // Shuffle cards
    for (let i = gameCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [gameCards[i], gameCards[j]] = [gameCards[j], gameCards[i]];
    }

    // Update state - preserve score, streak, maxStreak, and totalMatches during continuous gameplay
    setState((s) => ({
      ...s,
      cards: gameCards,
      selectedCards: [],
      matchedPairs: new Set(), // Reset for new set
      // Keep existing score, streak, maxStreak, and totalMatches if game already started
      totalMatches: s.gameStarted ? s.totalMatches : 0,
      score: s.gameStarted ? s.score : 0,
      streak: s.gameStarted ? s.streak : 0,
      maxStreak: s.gameStarted ? s.maxStreak : 0,
      timeLeft: s.gameStarted ? s.timeLeft : GAME_DURATION,
      gameStarted: true,
      gameOver: false,
      loading: false,
      loadError: "",
    }));
  }

  function startNewGame() {
    // Reset everything for a fresh game
    setState({
      cards: [],
      selectedCards: [],
      matchedPairs: new Set(),
      totalMatches: 0,
      score: 0,
      streak: 0,
      maxStreak: 0,
      timeLeft: GAME_DURATION,
      gameStarted: false,
      gameOver: false,
      loading: false,
      loadError: "",
    });
    
    // Generate first card set
    generateNewCardSet();
  }

  function handleCardClick(cardId: string) {
    if (state.gameOver || !state.gameStarted) return;

    const card = state.cards.find((c) => c.id === cardId);
    if (!card) return;

    // Can't select already matched cards
    if (state.matchedPairs.has(card.cca2)) return;

    // Allow unclicking - if card is already selected, deselect it
    if (state.selectedCards.includes(cardId)) {
      setState((s) => ({ ...s, selectedCards: s.selectedCards.filter(id => id !== cardId) }));
      return;
    }

    // If we already have one card selected, check if new card is same type
    if (state.selectedCards.length === 1) {
      const firstCard = state.cards.find((c) => c.id === state.selectedCards[0]);
      if (firstCard && firstCard.type === card.type) {
        // Can't match two flags or two shapes - do nothing
        return;
      }
    }

    const newSelected = [...state.selectedCards, cardId];

    // If this is the first selection, just store it
    if (newSelected.length === 1) {
      setState((s) => ({ ...s, selectedCards: newSelected }));
      return;
    }

    // If this is the second selection, check for match
    if (newSelected.length === 2) {
      const firstCard = state.cards.find((c) => c.id === newSelected[0]);
      const secondCard = state.cards.find((c) => c.id === newSelected[1]);

      if (!firstCard || !secondCard) {
        setState((s) => ({ ...s, selectedCards: [] }));
        return;
      }

      // Check if they match (same country code, different types)
      // Also prevent matching two flags or two shapes
      const isMatch =
        firstCard.cca2 === secondCard.cca2 && firstCard.type !== secondCard.type;

      if (isMatch) {
        // Correct match!
        const newStreak = state.streak + 1;
        const multiplier = getStreakMultiplier(newStreak);
        const points = Math.round(BASE_POINTS * multiplier);

        setState((s) => ({
          ...s,
          selectedCards: newSelected,
          matchedPairs: new Set([...s.matchedPairs, firstCard.cca2]),
          totalMatches: s.totalMatches + 1,
          score: s.score + points,
          streak: newStreak,
          maxStreak: Math.max(s.maxStreak, newStreak),
        }));

        // Show feedback and clear after delay
        setFeedbackCard(cardId);
        setTimeout(() => {
          setFeedbackCard(null);
          setState((s) => ({ ...s, selectedCards: [] }));
        }, 300);
      } else {
        // Wrong match - reset streak
        setState((s) => ({
          ...s,
          selectedCards: newSelected,
          streak: 0,
        }));

        // Show feedback and clear after delay
        setFeedbackCard(cardId);
        setTimeout(() => {
          setFeedbackCard(null);
          setState((s) => ({ ...s, selectedCards: [] }));
        }, 400);
      }
    }
  }

  // Auto-generate new cards when all pairs are matched (continuous gameplay)
  useEffect(() => {
    if (state.gameStarted && !state.gameOver && state.matchedPairs.size === GRID_SIZE / 2 && state.cards.length > 0) {
      // All pairs matched! Generate new set immediately
      console.log("All pairs matched! Generating new set...");
      generateNewCardSet();
    }
  }, [state.matchedPairs.size, state.gameStarted, state.gameOver, topoData, restLookup]);

  // Check if game is over (only by timer, not by matching all cards)
  const actualGameOver = state.gameOver;

  return {
    ...state,
    gameOver: actualGameOver,
    restLookup,
    topoData,
    feedbackCard,
    startNewGame,
    handleCardClick,
    getStreakMultiplier,
  };
}
