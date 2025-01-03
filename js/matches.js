import { findClosestRows } from './findClosestRows.js';

export function updateMatchInfo(matchData, percentages, tipsRows) {
  // Kontrollera att matchData är fullständigt innan vi går vidare
  if (!matchData || matchData.length === 0) {
    return; // Kör inte funktionen förrän data finns
  }

  const tableBody = document.getElementById('matchBody');
  tableBody.innerHTML = '';

  let firstChoices = 0;   // Antal förstaval
  let secondChoices = 0;  // Antal andraval
  let thirdChoices = 0;   // Antal tredjeval

  let totalComparison = 0; // Summering av alla jämförelser

  const closestRows = findClosestRows(tipsRows, matchData);

  // Loopa igenom alla matcher
  matchData.forEach((match, i) => {
    // Beräkna procentsatser
    const percent1 = percentages[i] && percentages[i]['1']
      ? ((percentages[i]['1'] / (tipsRows.length || 1)) * 100).toFixed(0)
      : '-';

    const percentX = percentages[i] && percentages[i]['X']
      ? ((percentages[i]['X'] / (tipsRows.length || 1)) * 100).toFixed(0)
      : '-';

    const percent2 = percentages[i] && percentages[i]['2']
      ? ((percentages[i]['2'] / (tipsRows.length || 1)) * 100).toFixed(0)
      : '-';

    // Hitta mest, näst mest och tredje mest valda
    const percentagesArr = [
      { type: '1', value: parseFloat(percent1) },
      { type: 'X', value: parseFloat(percentX) },
      { type: '2', value: parseFloat(percent2) }
    ].sort((a, b) => b.value - a.value); // Sortera fallande

    const topChoice = percentagesArr[0].type;
    const secondChoice = percentagesArr[1].type;
    const thirdChoice = percentagesArr[2].type;

    // Kontrollera autoSign mot val
    let autoSignClass = '';
    if (match.autoSign === topChoice) {
      autoSignClass = 'first-choice';
      firstChoices++;
    } else if (match.autoSign === secondChoice) {
      autoSignClass = 'second-choice';
      secondChoices++;
    } else if (match.autoSign === thirdChoice) {
      autoSignClass = 'third-choice';
      thirdChoices++;
    }

    // Beräkna diff mellan systemets och folkets procentsatser
    const diff1 = percent1 !== '-' && match.folkOne !== '-'
      ? parseFloat(percent1) - parseFloat(match.folkOne)
      : 0;

    const diffX = percentX !== '-' && match.folkX !== '-'
      ? parseFloat(percentX) - parseFloat(match.folkX)
      : 0;

    const diff2 = percent2 !== '-' && match.folkTwo !== '-'
      ? parseFloat(percent2) - parseFloat(match.folkTwo)
      : 0;

    // Beräkna jämförelse baserat på autoSign
    let comparison = 0;
    let comparisonClass = 'comparison-neutral';

    if (match.autoSign === '1') {
      comparison = diff1;
    } else if (match.autoSign === 'X') {
      comparison = diffX;
    } else if (match.autoSign === '2') {
      comparison = diff2;
    }

    totalComparison += comparison;
    comparisonClass = comparison > 0 ? 'comparison-positive' : (comparison < 0 ? 'comparison-negative' : 'comparison-neutral');

    const rowClass = match.isEnded ? "ended-bold" : "";
    const numClass = match.isEnded ? "ended-green" : "";

    // Bygg rader
    let row = `
      <tr class="${rowClass}">
        <td class="${numClass}">${i + 1}</td>
        <td>${match.homeTeam}</td>
        <td>${match.homeScore}-${match.awayScore}</td>
        <td>${match.awayTeam}</td>
        <td>${match.autoSign}</td>
        <td class="${match.autoSign === '1' ? autoSignClass : ''}">${percent1}%</td>
        <td class="${match.autoSign === 'X' ? autoSignClass : ''}">${percentX}%</td>
        <td class="${match.autoSign === '2' ? autoSignClass : ''}">${percent2}%</td>
        <td class="${comparisonClass}">${comparison > 0 ? '+' : ''}${comparison}%</td>
        <td class="folk-percentage">${match.folkOne}%</td>
        <td class="folk-percentage">${match.folkX}%</td>
        <td class="folk-percentage">${match.folkTwo}%</td>
        <td class="diff-percentage">${diff1 > 0 ? '+' : ''}${diff1}%</td>
        <td class="diff-percentage">${diffX > 0 ? '+' : ''}${diffX}%</td>
        <td class="diff-percentage">${diff2 > 0 ? '+' : ''}${diff2}%</td>
    `;

    // Lägg till de närmaste raderna
    closestRows.forEach(rowObj => {
      const signObj = rowObj.evaluatedRow[i]; // Plocka aktuell match

      let colorClass = signObj.status === 'correct'
        ? 'green-sign'
        : signObj.status === 'incorrect'
          ? 'red-sign'
          : 'gray-sign';

      row += `<td class="${colorClass}">${signObj.tip}</td>`;
    });

    row += '</tr>';
    tableBody.innerHTML += row;
  });

  // Hämta andra raden i rubriken (rad med 1, X, 2)
  const tableHeaderRow2 = document.querySelector('#matchTable thead tr:nth-child(2)');

  // Kontrollera om rätt-celler redan finns (ta bort dem om de gör det)
  const existingCorrectHeaders = tableHeaderRow2.querySelectorAll('.correct-header');
  existingCorrectHeaders.forEach(header => header.remove());

  // Lägg till antal rätt för varje närmaste rad
  closestRows.forEach(rowObj => {
    let correctCountHeader = document.createElement('th');
    correctCountHeader.innerText = rowObj.correctCount; // Antal rätt
    correctCountHeader.classList.add('correct-header'); // Lägg till klass för identifiering
    correctCountHeader.style.textAlign = 'center';      // Centrera text
    correctCountHeader.style.fontWeight = 'bold';       // Fetstil

    // Lägg till i rubrikraden
    tableHeaderRow2.appendChild(correctCountHeader);
  });

  // Summering under tabellen
  const fatSummary = document.getElementById('fatSummary');
  fatSummary.innerHTML = `
      F: ${firstChoices},
      A: ${secondChoices},
      T: ${thirdChoices}
    `;

  const vsSummary = document.getElementById('vsSummary');
  const summaryClass = totalComparison > 0
    ? 'comparison-positive'
    : totalComparison < 0
      ? 'comparison-negative'
      : 'comparison-neutral';

  vsSummary.innerHTML = `Systemet vs Folket: <span class="${summaryClass}">${totalComparison > 0 ? '+' : ''}${totalComparison.toFixed(0)}%</span>`;
}