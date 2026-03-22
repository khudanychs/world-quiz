const fs = require('fs');
let code = fs.readFileSync('/home/sergio/world-quiz/FrontEnd/src/components/PhysicalGeoGame.tsx', 'utf8');

// Replace standard zoom updates with targetView states
code = code.replace(/setPos\(/g, 'setTargetView(');
code = code.replace(/ zoom: pos\.zoom, /g, ' zoom: 1, ');
code = code.replace(/ coordinates: pos\.coordinates, /g, ' coordinates: [0, 0] as [number, number], ');

// Add targetView state definition where pos used to be
code = code.replace(/const \[marineData/g, `const [targetView, setTargetView] = useState<{ coordinates: [number, number]; zoom: number; timestamp: number } | null>(null);\n  const [marineData`);

// Fix the objects passed to setTargetView to include timestamp
code = code.replace(/setTargetView\(\{ coordinates: geoFocus\.center, zoom \}\);/g, 'setTargetView({ coordinates: geoFocus.center, zoom, timestamp: Date.now() });');
code = code.replace(/setTargetView\(\{ coordinates: center, zoom \}\);/g, 'setTargetView({ coordinates: center, zoom, timestamp: Date.now() });');

// Replace props passed to InteractiveMap
code = code.replace(/zoom=\{1\}\n\s*coordinates=\{\[0, 0\]\}/g, 'targetView={targetView}');

// Remove handleMapMoveEnd
code = code.replace(/const handleMapMoveEnd = .*?\n.*?\n.*?\n.*?\n.*?\n.*?\n.*?\n.*?\n.*?\n\s*\};\n/s, '');
code = code.replace(/onMoveEnd=\{handleMapMoveEnd\}/g, '');

fs.writeFileSync('/home/sergio/world-quiz/FrontEnd/src/components/PhysicalGeoGame.tsx', code);
