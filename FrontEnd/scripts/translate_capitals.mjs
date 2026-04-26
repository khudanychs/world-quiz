import fs from 'fs';

// Kompletní slovník hlavních měst vytažený přímo z tvého JSONu
const capitalTranslations = {
  // --- EVROPA ---
  "Rome": { cs: "Řím", de: "Rom" },
  "Paris": { cs: "Paříž", de: "Paris" },
  "Vienna": { cs: "Vídeň", de: "Wien" },
  "Warsaw": { cs: "Varšava", de: "Warschau" },
  "Prague": { cs: "Praha", de: "Prag" },
  "Berlin": { cs: "Berlín", de: "Berlin" },
  "Moscow": { cs: "Moskva", de: "Moskau" },
  "Kyiv": { cs: "Kyjev", de: "Kiew" },
  "Bucharest": { cs: "Bukurešť", de: "Bukarest" },
  "Budapest": { cs: "Budapešť", de: "Budapest" },
  "Belgrade": { cs: "Bělehrad", de: "Belgrad" },
  "Sofia": { cs: "Sofie", de: "Sofia" },
  "Athens": { cs: "Athény", de: "Athen" },
  "Lisbon": { cs: "Lisabon", de: "Lissabon" },
  "Copenhagen": { cs: "Kodaň", de: "Kopenhagen" },
  "Brussels": { cs: "Brusel", de: "Brüssel" },
  "Helsinki": { cs: "Helsinky", de: "Helsinki" },
  "Reykjavik": { cs: "Reykjavík", de: "Reykjavík" },
  "Luxembourg": { cs: "Lucemburk", de: "Luxemburg" },
  "Chișinău": { cs: "Kišiněv", de: "Chișinău" }, // Z tvého JSONu s rumunskou diakritikou
  "Monaco": { cs: "Monako", de: "Monaco" },
  "Vatican City": { cs: "Vatikán", de: "Vatikanstadt" },
  "Zagreb": { cs: "Záhřeb", de: "Zagreb" },
  "Nicosia": { cs: "Nikósie", de: "Nikosia" },
  "Ljubljana": { cs: "Lublaň", de: "Ljubljana" },
  "Pristina": { cs: "Priština", de: "Pristina" },
  "London": { cs: "Londýn", de: "London" },
  "City of San Marino": { cs: "San Marino", de: "San Marino" },

  // --- ASIE ---
  "Beijing": { cs: "Peking", de: "Peking" },
  "Tokyo": { cs: "Tokio", de: "Tokio" },
  "Seoul": { cs: "Soul", de: "Seoul" },
  "Pyongyang": { cs: "Pchjongjang", de: "Pjöngjang" },
  "Damascus": { cs: "Damašek", de: "Damaskus" },
  "Jerusalem": { cs: "Jeruzalém", de: "Jerusalem" },
  "Riyadh": { cs: "Rijád", de: "Riad" },
  "Tehran": { cs: "Teherán", de: "Teheran" },
  "Baghdad": { cs: "Bagdád", de: "Bagdad" },
  "Kabul": { cs: "Kábul", de: "Kabul" },
  "New Delhi": { cs: "Nové Dillí", de: "Neu-Delhi" },
  "Hanoi": { cs: "Hanoj", de: "Hanoi" },
  "Ulan Bator": { cs: "Ulánbátar", de: "Ulaanbaatar" }, // V JSONu máš Ulan Bator
  "Taipei": { cs: "Tchaj-pej", de: "Taipeh" },
  "Tashkent": { cs: "Taškent", de: "Taschkent" },
  "Dushanbe": { cs: "Dušanbe", de: "Duschanbe" },
  "Ashgabat": { cs: "Ašchabad", de: "Aschgabat" },
  "Bishkek": { cs: "Biškek", de: "Bischkek" },
  "Yerevan": { cs: "Jerevan", de: "Eriwan" },
  "Tbilisi": { cs: "Tbilisi", de: "Tiflis" },
  "Kathmandu": { cs: "Káthmándú", de: "Kathmandu" },
  "Dhaka": { cs: "Dháka", de: "Dhaka" },
  "Islamabad": { cs: "Islámábád", de: "Islamabad" },
  "Amman": { cs: "Ammán", de: "Amman" },
  "Beirut": { cs: "Bejrút", de: "Beirut" },
  "Abu Dhabi": { cs: "Abú Zabí", de: "Abu Dhabi" },
  "Doha": { cs: "Dauhá", de: "Doha" },
  "Muscat": { cs: "Maskat", de: "Maskat" },
  "Sana'a": { cs: "San'á", de: "Sanaa" },
  "Phnom Penh": { cs: "Phnompenh", de: "Phnom Penh" },
  "Kuwait City": { cs: "Kuvajt", de: "Kuwait-Stadt" },
  "Singapore": { cs: "Singapur", de: "Singapur" },
  "Malé": { cs: "Male", de: "Malé" }, // S čárkou z JSONu
  "Colombo": { cs: "Kolombo", de: "Colombo" },
  "Naypyidaw": { cs: "Neipyijto", de: "Naypyidaw" },
  "Macau": { cs: "Macao", de: "Macau" },
  "Hong Kong": { cs: "Hongkong", de: "Hongkong" },
  "City of Victoria": { cs: "Victoria", de: "Victoria" },
  "Sri Jayawardenepura Kotte": { cs: "Šrí Džajavardanapura Kotte", de: "Sri Jayewardenepura Kotte" },
  "Astana": { cs: "Astana", de: "Astana" },

  // --- AFRIKA ---
  "Cairo": { cs: "Káhira", de: "Kairo" },
  "Algiers": { cs: "Alžír", de: "Algier" },
  "Tunis": { cs: "Tunis", de: "Tunis" },
  "Tripoli": { cs: "Tripolis", de: "Tripolis" },
  "Mogadishu": { cs: "Mogadišo", de: "Mogadischu" },
  "Cape Town": { cs: "Kapské Město", de: "Kapstadt" },
  "Khartoum": { cs: "Chartúm", de: "Khartum" },
  "Addis Ababa": { cs: "Addis Abeba", de: "Addis Abeba" },
  "Dar es Salaam": { cs: "Dar es Salaam", de: "Daressalam" },
  "Djibouti": { cs: "Džibuti", de: "Dschibuti" },
  "Nouakchott": { cs: "Nuakšott", de: "Nouakchott" },
  "Yaoundé": { cs: "Yaoundé", de: "Jaunde" },
  "Juba": { cs: "Džuba", de: "Juba" },
  "Conakry": { cs: "Konakry", de: "Conakry" },
  "Windhoek": { cs: "Windhoek", de: "Windhuk" },
  "Accra": { cs: "Akkra", de: "Accra" },
  "São Tomé": { cs: "Svatý Tomáš", de: "São Tomé" },
  "Mbabane": { cs: "Mbabane", de: "Mbabane" },

  // --- AMERIKA A OCEÁNIE ---
  "Mexico City": { cs: "Ciudad de México", de: "Mexiko-Stadt" },
  "Havana": { cs: "Havana", de: "Havanna" },
  "Bogotá": { cs: "Bogota", de: "Bogotá" },
  "Panama City": { cs: "Panamá", de: "Panama-Stadt" },
  "Guatemala City": { cs: "Ciudad de Guatemala", de: "Guatemala-Stadt" },
  "Washington, D.C.": { cs: "Washington, D.C.", de: "Washington, D.C." },
  "Washington DC": { cs: "Washington, D.C.", de: "Washington, D.C." } // Pojistka pro UM
};

const INPUT_FILE = '/home/sergio/world-quiz/FrontEnd/public/countries-full.json';
const OUTPUT_FILE = '/home/sergio/world-quiz/FrontEnd/public/countries-full-translated.json';

try {
  console.log(`Načítám data z ${INPUT_FILE}...`);
  const rawData = fs.readFileSync(INPUT_FILE, 'utf-8');
  const countries = JSON.parse(rawData);

  let translatedCount = 0;

  countries.forEach(country => {
    if (country.capital && Array.isArray(country.capital)) {
      country.capital_cs = country.capital.map(cap => {
        if (capitalTranslations[cap]) {
          translatedCount++;
          return capitalTranslations[cap].cs;
        }
        return cap; // Nemění se (např. Madrid, Oslo)
      });
      
      country.capital_de = country.capital.map(cap => {
        return capitalTranslations[cap] ? capitalTranslations[cap].de : cap;
      });
    } else {
      country.capital_cs = [];
      country.capital_de = [];
    }
  });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(countries, null, 2), 'utf-8');
  console.log(`✅ Hotovo! Úspěšně zpracováno ${countries.length} zemí.`);
  console.log(`🌍 Počet reálně přeložených měst na základě slovníku: ${translatedCount}`);
  console.log(`📂 Nový soubor byl uložen jako: ${OUTPUT_FILE}`);

} catch (error) {
  console.error('❌ Chyba při zpracování:', error.message);
}