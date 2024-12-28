import { updateMatchInfo } from './matches.js';
import { calculateResults } from './results.js';

// Funktion för att läsa in och bearbeta filen
export function processRows(fileContent, percentages, tipsRows, totalRowsRef, matchData, resultData, matchesCounted) {
    const lines = fileContent.split('\n').map(line => line.trim());

    // Nollställ tipsrader och procentsatser
    tipsRows.length = 0; // Töm raderna
    percentages.length = 0; // Töm procentsatser
    for (let i = 0; i < 13; i++) {
        percentages.push({ '1': 0, 'X': 0, '2': 0 }); // Initiera procentsatser
    }

    // Räkna totala rader (uppdaterar via referens)
    totalRowsRef.value = Math.floor(lines.length / 13); // Uppdatera värdet i referensen

    // Dela upp rader i grupper om 13
    for (let i = 0; i < lines.length; i += 13) {
        tipsRows.push(lines.slice(i, i + 13)); // Lägg till grupperade rader
    }

    // Beräkna procentsatser för varje tecken (1, X, 2)
    tipsRows.forEach(row => {
        row.forEach((tip, index) => {
            if (percentages[index][tip] !== undefined) {
                percentages[index][tip]++; // Öka procentsatsen
            }
        });
    });

    // Uppdatera matchdata och resultat
    updateMatchInfo(matchData, percentages, tipsRows); // Uppdatera tabellen
    calculateResults(tipsRows, matchData, resultData, totalRowsRef.value, matchesCounted); // Beräkna resultat
}