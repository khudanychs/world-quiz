const fs = require('fs');
let code = fs.readFileSync('/home/sergio/world-quiz/FrontEnd/src/components/InteractiveMap.tsx', 'utf8');

// The file has likely been modified partially. Let's make sure it handles targetView and local states perfectly.
code = code.replace(/zoom=\{zoom\}/g, 'zoom={localZoom}');
code = code.replace(/center=\{coordinates\}/g, 'center={localCoordinates}');
code = code.replace(/onMoveEnd=\{onMoveEnd\}/g, 'onMoveEnd={handleMoveEnd}');

fs.writeFileSync('/home/sergio/world-quiz/FrontEnd/src/components/InteractiveMap.tsx', code);
