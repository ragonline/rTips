export function updateOverview(drawDetails) {
  // Sätt produktnamn
  document.getElementById('productName').innerText = drawDetails.productName;

  // Sätt beskrivning för stängningstid
  document.getElementById('regCloseDescription').innerText =
    `${drawDetails.regCloseDescription}`;

  // Sätt omgångsnummer
  document.getElementById('drawNumber').innerText =
    `Omgångsnummer: ${drawDetails.drawNumber}`;

  // Kontrollera och formatera omsättningen
  let formattedNetSale = 'Ej tillgänglig';
  if (drawDetails.currentNetSale && typeof drawDetails.currentNetSale === 'string') {
    // Ta bort decimalerna och formatera tusentalsavgränsare
    const rawNetSale = drawDetails.currentNetSale.split(',')[0]; // Tar bara heltalsdelen
    formattedNetSale = parseInt(rawNetSale).toLocaleString('sv-SE');
  }

  // Visa omsättning
  document.getElementById('currentNetSale').innerText =
    `Omsättning: ${formattedNetSale} kr`;

}
