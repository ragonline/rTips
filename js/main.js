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

  // Hämta omgångsnummer från URL eller sätt till 0
  currentDrawNumber = drawNumberParam ? parseInt(drawNumberParam, 10) : 0;

  const { drawDetails, matchData } = await fetchMatchData(currentDrawNumber);

  currentDrawNumber = drawDetails.drawNumber;

  // Uppdatera omgångsöversikten
  updateOverview(drawDetails);

  // Om en fil är sparad, ladda den
  const encodedFile = localStorage.getItem('uploadedFile');
  if (encodedFile) {
    const fileContent = atob(encodedFile); // Dekryptera Base64
    processRows(
      fileContent,
      percentages,
      tipsRows,
      totalRows,
      matchData,
      resultData,
      matchesCounted
    );
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
  localStorage.removeItem('uploadedFile'); // Rensa eventuell tidigare fil
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = function (e) {
    const fileContent = e.target.result;

    try {
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

      // Spara Base64-data i localStorage
      const encodedFile = btoa(fileContent);
      localStorage.setItem('uploadedFile', encodedFile);

      // Uppdatera URL
      const newUrl = `${window.location.origin}${window.location.pathname}?drawNumber=${currentDrawNumber}`;
      window.history.replaceState(null, '', newUrl);

      document.getElementById('shareUrl').value = newUrl;

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

// Navigeringsfunktioner
document.getElementById('prevDraw').addEventListener('click', () => {
  currentDrawNumber--; // Minska omgångsnummer
  loadDraw(currentDrawNumber); // Ladda föregående omgång
});

document.getElementById('nextDraw').addEventListener('click', () => {
  currentDrawNumber++; // Öka omgångsnummer
  loadDraw(currentDrawNumber); // Ladda nästa omgång
});

