export function calculateResults(tipsRows, matchData, resultData, totalRows, matchesCounted) {
  let counts = Array(14).fill(0);

  // Räkna antalet korrekta rader
  tipsRows.forEach(row => {
    let correctCount = 0;

    for (let i = 0; i < 13; i++) {

      // Kontrollera att matchData[i] finns och har startat
      if (matchData[i] && matchData[i].matchStatus !== 'NotStarted' && row[i] === matchData[i].autoSign) {
        correctCount++;
      }
    }

    counts[correctCount]++;
  });

  const resultsBody = document.getElementById('resultsBody');
  resultsBody.innerHTML = '';

  // **Beräkna total vinst** utanför loopen
  let totalWinnings = 0;

  // Lägg till resultat med utdelning
  for (let i = 13; i >= 0; i--) {
    let payout = '-';   // Standardvärde för rader utan utdelning
    let winners = '-';  // Standardvärde om vinnare saknas

    // Hämta utdelning från resultData
    if (resultData) {
      const payoutInfo = resultData.find(p => p.name === `${i} rätt`);
      if (payoutInfo) {
        payout = `${payoutInfo.amount} kr`;
        winners = `${payoutInfo.winners} st`;

        // **Beräkna total vinst endast för rader 13-10**
        if (i >= 10) {
          totalWinnings += counts[i] * parseInt(payoutInfo.amount); // Multiplicera rader med utdelning
        }
      }
    }

    // Lägg till rad i tabellen
    resultsBody.innerHTML += `<tr>
                                <td>${i}</td>
                                <td>${counts[i]}</td>
                                <td>${payout}</td>
                                <td>${winners}</td>
                              </tr>`;
  }

  // **Uppdatera totalsummor efter loopen**
  document.getElementById('totalWinnings').innerText =
    `Total vinst: ${totalWinnings.toLocaleString('sv-SE')} kr`;

  document.getElementById('matchCount').innerText =
    `${matchesCounted} av 13 matcher inräknade`;

  document.getElementById('rowCount').innerText =
    `Totalt antal rader i filspelet: ${totalRows.value}`;
}