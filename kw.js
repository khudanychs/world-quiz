const rootQuery = 'world quiz';
const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
const keywords = new Set();

async function scrapeAutocomplete() {
    for (const letter of alphabet) {
        const query = `${rootQuery} ${letter}`;
        try {
            const url = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}`;
            
            // Nativní Node v22 fetch
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP status ${response.status}`);
            
            const data = await response.json();
            const suggestions = data[1]; 
            
            suggestions.forEach(item => keywords.add(item));
            console.log(`Scrapováno pro: "${query}" -> nalezeno ${suggestions.length} frází`);
            
            await new Promise(resolve => setTimeout(resolve, 200)); 
        } catch (error) {
            console.error(`Chyba u dotazu ${query}:`, error.message);
        }
    }

    console.log('\n--- VÝSLEDNÝ SEZNAM KLÍČOVÝCH SLOV ---');
    console.log(Array.from(keywords).sort());
}

scrapeAutocomplete();