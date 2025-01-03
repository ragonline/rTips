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
  const drawNumberParam = urlParams.get('drawNumber');
  const fileIdParam = urlParams.get('fileId');

  // Hämta omgångsnummer eller sätt standardvärde
  currentDrawNumber = drawNumberParam ? parseInt(drawNumberParam, 10) : 0;

  // Hämta matchdata
  const { drawDetails, matchData } = await fetchMatchData(currentDrawNumber);

  currentDrawNumber = drawDetails.drawNumber;

  // Uppdatera omgångsöversikten
  updateOverview(drawDetails);

  // Ladda fil om fileId finns i URL
  if (fileIdParam) {
    const encodedFile = localStorage.getItem(`file_${fileIdParam}`); // Hämta fil från localStorage

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

      console.log('Fil laddad från URL!');
    } else {
      alert('Ingen fil hittades för det angivna ID:t.');
      console.error('Ingen fil hittades för ID:', fileIdParam);
    }
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

      // Skapa ett unikt ID för filen
      const fileId = Date.now().toString(); // Exempel: tidsstämpel som ID
      const encodedFile = btoa(fileContent); // Kryptera Base64

      // Spara filinnehållet i localStorage med ID
      localStorage.setItem(`file_${fileId}`, encodedFile); // Nyckel: "file_abcd1234"

      // Uppdatera URL med omgångsnummer och fil-ID
      const newUrl = `${window.location.origin}${window.location.pathname}?drawNumber=${currentDrawNumber}&fileId=${fileId}`;
      document.getElementById('shareUrl').value = newUrl; // Uppdatera fältet
      window.history.replaceState(null, '', newUrl);

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

      console.log('Fil sparad och processad!');

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

