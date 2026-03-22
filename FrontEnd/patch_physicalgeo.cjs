const fs = require('fs');
let content = fs.readFileSync('/home/sergio/world-quiz/FrontEnd/src/components/PhysicalGeoGame.tsx', 'utf8');

// Use MapDataService
content = content.replace(
  'import { BackButton } from "./BackButton";',
  'import { BackButton } from "./BackButton";\nimport { MapDataService } from "../services/MapDataService";'
);

// Remove local state fetching for marine/land
content = content.replace(/const \[marineData, setMarineData\] = useState[\s\S]*?\}\);/m, 
`const [marineData, setMarineData] = useState<GeoFeatureCollection | null>(null);
  const [landGeoRaw, setLandGeoRaw] = useState<GeoPermissibleObjects | null>(null);

  useEffect(() => {
    if (!categoryKey) return;
    MapDataService.loadBaseMapData(needsDetailedLandMask, needsMarine).then((data) => {
      if (needsDetailedLandMask && data.landGeoRaw) setLandGeoRaw(data.landGeoRaw);
      if (needsMarine && data.marineData) setMarineData(data.marineData);
    });
  }, [categoryKey, needsDetailedLandMask, needsMarine]);
`);

// Clean up redundant effects
content = content.replace(/useEffect\(\(\) => \{\s*if \(\!needsMarine\)[\s\S]*?catch\(\(\) => \{\}\);\s*\}, \[needsDetailedLandMask\]\);/g, '');
content = content.replace(/const marineTopoCache = useRef.*?;\n\s*const landGeoCache = useRef.*?;\n\s*const riverGeoCache = useRef.*?;\n\s*const lakeGeoCache = useRef.*?;/g, '');

// Strip 'pos' entirely
content = content.replace(/const \[pos, setPos\] = useState<\{ coordinates: \[number, number\]; zoom: number \}>\(\{\n\s*coordinates: \[0, 0\],\n\s*zoom: 1,\n\s*\}\);\n/g, '');
content = content.replace(/zoom: pos\.zoom,/g, 'zoom: 1,');
content = content.replace(/coordinates: pos\.coordinates,/g, 'coordinates: [0, 0] as [number, number],');
content = content.replace(/pos\.zoom/g, '1');
content = content.replace(/pos\.coordinates/g, '[0, 0]');
content = content.replace(/setPos\(/g, '// setPos(');

fs.writeFileSync('/home/sergio/world-quiz/FrontEnd/src/components/PhysicalGeoGame.tsx', content);
