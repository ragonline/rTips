import { processRows } from './processRows.js';
import { fetchMatchData, fetchResultData } from './api.js';
import { updateOverview } from './overview.js';
import { updateMatchInfo } from './matches.js';
import { calculateResults } from './results.js';

// Hämta URL-parametrar
const urlParams = new URLSearchParams(window.location.search);
const drawNumberParam = urlParams.get('drawNumber');
const fileDataParam = urlParams.get('fileData');

let tipsRows = [];
let drawDetails = [];
let matchData = [];
let resultData = [];
let percentages = Array(13).fill(null).map(() => ({ '1': 0, 'X': 0, '2': 0 }));
let matchesCounted = 0;
let totalRows = { value: 0 }; // Skapa en referens istället för en vanlig variabel
let currentDrawNumber = 0;

// Hämta data vid start
async function initialize() {

  // Hämta parametrar från URL
  const fileUrlParam = urlParams.get('fileUrl');

  // Hämta omgångsnummer eller sätt standardvärde
  currentDrawNumber = drawNumberParam ? parseInt(drawNumberParam, 10) : 0;

  // Hämta matchdata
  const { drawDetails, matchData } = await fetchMatchData(currentDrawNumber);

  currentDrawNumber = drawDetails.drawNumber;

  // Uppdatera omgångsöversikten
  updateOverview(drawDetails);

  // Ladda fil om fileId finns i URL
  if (fileUrlParam) {
    console.log(`Hämtar fil från: ${fileUrlParam}`);

    // Hämta filinnehåll från URL
    fetch(decodeURIComponent(fileUrlParam))
      .then(response => response.text())
      .then(fileContent => {
        processRows(
          fileContent,
          percentages,
          tipsRows,
          totalRows,
          matchData,
          resultData,
          matchesCounted
        );

        console.log('Fil laddad från URL och bearbetad.');
      })
      .catch(error => {
        console.error('Fel vid hämtning av fil från URL:', error);
      });
  }

  // Hämta resultatdata
  const resultData = await fetchResultData(drawDetails.drawState, currentDrawNumber);
  updateMatchInfo(matchData, percentages, tipsRows, resultData);

  matchesCounted = matchData.filter(match => match.hasStarted || match.isEnded).length;

  calculateResults(tipsRows, matchData, resultData, totalRows, matchesCounted);
}

initialize();

// Automatisk uppdatering var 20:e sekund
setInterval(async () => {
  const { drawDetails, matchData } = await fetchMatchData(currentDrawNumber);

  // Uppdatera omgångsöversikten
  updateOverview(drawDetails);

  // Hämta resultatdata
  const resultData = await fetchResultData(drawDetails.drawState, currentDrawNumber);
  updateMatchInfo(matchData, percentages, tipsRows, resultData);

  matchesCounted = matchData.filter(match => match.hasStarted || match.isEnded).length;

  updateMatchInfo(matchData, percentages, tipsRows);
  calculateResults(tipsRows, matchData, resultData, totalRows, matchesCounted);
}, 20000);

// Läs in fil och bearbeta innehållet
document.getElementById('fileInput').addEventListener('change', function (event) {
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = function (e) {
    const fileContent = e.target.result;

    // Skapa ett unikt filnamn (t.ex. tidsstämpel)
    const fileName = `${Date.now()}-${file.name}`;

    // Lagra filen på GitHub Pages (här behöver vi en backend eller manuell uppladdning)
    // För nuvarande implementation: Spara filen manuellt i `/uploads` och simulera URL
    const fileUrl = `https://ragonline.github.io/rTips/uploads/${fileName}`;

    try {

      // Uppdatera URL med filens länk istället för innehåll
      const newUrl = `${window.location.origin}${window.location.pathname}?drawNumber=${currentDrawNumber}&fileUrl=${encodeURIComponent(fileUrl)}`;
      window.history.replaceState(null, '', newUrl); // Uppdatera URL utan omladdning

      console.log('Ny URL:', newUrl);

      // Processa ny fil
      processRows(
        fileContent,
        percentages,
        tipsRows,
        totalRows,
        matchData,
        resultData,
        matchesCounted
      );
    } catch (error) {
      alert('Ogiltig fil. Kontrollera formatet.');
      console.error('Fel vid filuppladdning:', error);
    }
  };

  console.log(`Total rows: ${totalRows.value}`); // Kontrollera värdet

  reader.readAsText(file);
});

// Funktion för att ladda och uppdatera omgångsdata
async function loadDraw(drawNumber) {
  try {
    // Hämta data för vald omgång
    const { drawDetails, matchData } = await fetchMatchData(drawNumber);

    // Uppdatera omgångsöversikten
    updateOverview(drawDetails);

    // Hämta resultatdata
    const resultData = await fetchResultData(drawDetails.drawState, currentDrawNumber);
    updateMatchInfo(matchData, percentages, tipsRows, resultData);

    matchesCounted = matchData.filter(match => match.hasStarted || match.isEnded).length;

    updateMatchInfo(matchData, percentages, tipsRows);
    calculateResults(tipsRows, matchData, resultData, totalRows, matchesCounted);

  } catch (error) {
    console.error('Fel vid laddning av omgång:', error);
  }
}

document.getElementById('copyButton').addEventListener('click', () => {
  const shareUrl = document.getElementById('shareUrl');
  shareUrl.select(); // Markera texten i fältet
  navigator.clipboard.writeText(shareUrl.value) // Kopiera till klippbordet
    .then(() => alert('Länk kopierad!'))
    .catch(err => alert('Kunde inte kopiera länken.'));
});

// Navigeringsfunktioner
document.getElementById('prevDraw').addEventListener('click', () => {
  currentDrawNumber--; // Minska omgångsnummer
  loadDraw(currentDrawNumber); // Ladda föregående omgång
});

document.getElementById('nextDraw').addEventListener('click', () => {
  currentDrawNumber++; // Öka omgångsnummer
  loadDraw(currentDrawNumber); // Ladda nästa omgång
});

