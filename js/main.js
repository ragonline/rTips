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

// Hantera Diff-visibility
function toggleDiffVisibility() {
    const showDiff = document.getElementById('toggleDiff').checked; // Läs checkboxens status
    localStorage.setItem('showDiff', showDiff); // Spara i localStorage

    const diffHeaders = document.querySelectorAll('.diff-header'); // Rubriker
    const diffCols = document.querySelectorAll('.diff-col');       // Kolumner

    diffHeaders.forEach(header => header.style.display = showDiff ? '' : 'none'); // Visa/Dölj rubriker
    diffCols.forEach(col => col.style.display = showDiff ? '' : 'none');         // Visa/Dölj kolumner
}

// Anropa vid ändring av checkbox
document.getElementById('toggleDiff').addEventListener('change', toggleDiffVisibility);

// Återställ visibility vid sidladdning
window.addEventListener('load', () => {
    const showDiff = localStorage.getItem('showDiff') === 'true'; // Hämta status från localStorage
    document.getElementById('toggleDiff').checked = showDiff;     // Uppdatera checkboxens status
    toggleDiffVisibility();                                      // Använd status för att dölja/visa kolumner
});

// Hämta data vid start
async function initialize() {
    const { drawDetails, matchData } = await fetchMatchData(currentDrawNumber);

    currentDrawNumber = drawDetails.drawNumber;

    // Uppdatera omgångsöversikten
    updateOverview(drawDetails);

    // Hämta resultatdata
    const resultData = await fetchResultData(drawDetails.drawState, currentDrawNumber);
    updateMatchInfo(matchData, percentages, tipsRows, resultData);

    matchesCounted = matchData.filter(match => match.hasStarted || match.isEnded).length;

    updateMatchInfo(matchData, percentages, tipsRows);
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

    // Använd checkboxens status för att uppdatera kolumnerna
    toggleDiffVisibility();
}, 20000);

// Läs in fil och bearbeta innehållet
document.getElementById('fileInput').addEventListener('change', function (event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
        const fileContent = e.target.result;

        // Skicka referensen till processRows
        processRows(
            fileContent,
            percentages,
            tipsRows,
            totalRows, // Skickas som referens
            matchData,
            resultData,
            matchesCounted
        );

        console.log(`Total rows: ${totalRows.value}`); // Kontrollera värdet

        // Uppdatera URL med filens data (Base64)
        const encodedFile = btoa(fileContent); // Kryptera Base64
        const newUrl = `${window.location.origin}${window.location.pathname}?drawNumber=${currentDrawNumber}&fileData=${encodedFile}`;
        window.history.replaceState(null, '', newUrl); // Uppdatera URL utan att ladda om sidan
    };

    reader.readAsText(file);
});

// Uppdatera URL-fältet efter uppladdning
//document.getElementById('shareUrl').value = window.location.href;

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