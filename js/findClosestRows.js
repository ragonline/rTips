export function findClosestRows(tipsRows, matchData) {

  // Bearbeta alla rader
  const rowsWithDetails = tipsRows.map((row, rowIndex) => {
    let correctCount = 0;       // Antal korrekta tecken
    let totalGoalDeviation = 0; // Totalt antal mål från 13 rätt

    const evaluatedRow = row.map((tip, index) => {
      const match = matchData[index];

      let status = 'neutral';

      // Kontrollera att match är definierad innan vi går vidare
      if (!match || !match.matchStatus) {
        console.warn(`Match saknas eller saknar matchStatus vid index ${index}`);
        return { evaluatedRow: [], correctCount: 0, totalGoalDeviation: 999 }; // Returnera "ogiltig" rad med hög avvikelse
      }

      if (match.matchStatus !== 'NotStarted') {
        // Faktisk målställning
        const homeScore = parseInt(match.homeScore) || 0;
        const awayScore = parseInt(match.awayScore) || 0;

        // Räkna korrekt tecken
        let actualSign = '';
        if (homeScore > awayScore) actualSign = '1';
        if (homeScore < awayScore) actualSign = '2';
        if (homeScore === awayScore) actualSign = 'X';

        // Beräkna målavvikelse om tecknet är fel
        let goalDeviation = 0;
        if (tip !== actualSign) {
          if (actualSign === '1') { // Hemmavinst
            if (tip === 'X') {
              goalDeviation = Math.abs(homeScore - awayScore); // Till oavgjort
            } else if (tip === '2') {
              goalDeviation = Math.abs(homeScore - awayScore) + 1; // Till bortaseger
            }
          } else if (actualSign === '2') { // Bortavinst
            if (tip === 'X') {
              goalDeviation = Math.abs(awayScore - homeScore); // Till oavgjort
            } else if (tip === '1') {
              goalDeviation = Math.abs(awayScore - homeScore) + 1; // Till hemmaseger
            }
          } else if (actualSign === 'X') { // Oavgjort
            if (tip === '1') {
              goalDeviation = Math.abs(homeScore - awayScore) + 1; // Till hemmaseger
            } else if (tip === '2') {
              goalDeviation = Math.abs(awayScore - homeScore) + 1; // Till bortaseger
            }
          }
        }

        // Uppdatera status
        if (tip === actualSign) {
          status = 'correct';    // Rätt tecken
          correctCount++;       // Öka korrekt antal
        } else {
          status = 'incorrect'; // Fel tecken
          totalGoalDeviation += goalDeviation; // Addera målavvikelse
        }

      } else {
        status = 'not-started'; // Matchen har inte startat
      }

      return { tip, status };
    });

    return {
      evaluatedRow,
      correctCount,
      totalGoalDeviation,
    };
  });

  //console.log("Rader före sortering:", rowsWithDetails);

  // **Sortera först på korrekt antal tecken, sedan på målavvikelse:**
  const sortedRows = rowsWithDetails.sort((a, b) => {
    // 1. Jämför antal korrekta tecken (störst först)
    if (b.correctCount !== a.correctCount) {
      return b.correctCount - a.correctCount;
    }
    // 2. Om samma antal korrekta tecken, sortera på total målavvikelse (minst först)
    return a.totalGoalDeviation - b.totalGoalDeviation;
  });

  // console.log("Rader efter sortering:", sortedRows);

  // Returnera de 10 bästa raderna
  const slicedRows = sortedRows.slice(0, 10);
  console.log("Topp 10 rader:", slicedRows);

  return slicedRows;
}