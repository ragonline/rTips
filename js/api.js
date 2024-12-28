export async function fetchMatchData(drawNumber) {
  try {

    // Kolla om drawNumber är angivet
    if (drawNumber == 0) {
      console.log('Drawnumber är noll, hämta default omgång.');

      // Steg 1: Hämta alla omgångar
      const response = await fetch('https://api.spela.svenskaspel.se/draw/1/stryktipset/draws/');
      const data = await response.json();

      // Hitta den uppkommande omgången som är "Open"
      const upcomingDraw = data.draws.find(draw => draw.drawState === "Open");

      if (!upcomingDraw) {
        console.error('Ingen öppen omgång hittades.');

        // Visa popup med inmatningsfält för att ange omgångsnummer
        const manualDrawNumber = prompt('Ingen öppen omgång hittades. Ange omgångsnummer manuellt:');

        // Kontrollera om användaren angav något
        if (manualDrawNumber) {
          console.log(`Vald omgångsnummer: ${manualDrawNumber}`);
          // Uppdatera drawNumber
          drawNumber = parseInt(manualDrawNumber, 10); // Konvertera till heltal

        } else {
          alert('Ingen omgång vald. Avbryter.');
          return { matchData: [], drawState: 'Error' };
        }

      } else {
        // Om en öppen omgång hittas, fortsätt med standardflödet
        console.log('Öppen omgång hittades.');
        drawNumber = upcomingDraw.drawNumber; // Tilldela aktuellt nummer från öppen omgång
      
      }

    }

    // Steg 2: Hämta detaljer för den valda omgången
    const detailsResponse = await fetch(
      `https://api.spela.svenskaspel.se/draw/1/stryktipset/draws/${drawNumber}`
    );

    if (!detailsResponse.ok) {
      throw new Error('Kunde inte hämta detaljer för omgången.');
    }

    const drawData = await detailsResponse.json();

    // Bearbeta omgångsinfo
    const drawDetails = {
      drawNumber: drawData.draw.drawNumber,                      // Omgångsnummer
      productName: drawData.draw.productName,                    // Produktnamn
      regCloseDescription: drawData.draw.regCloseDescription,    // Beskrivning av stängningstid
      drawState: drawData.draw.drawState,                        // Status för omgången (t.ex. "Closed")
      regOpenTime: drawData.draw.regOpenTime,                    // Öppningstid
      regCloseTime: drawData.draw.regCloseTime,                  // Stängningstid
      fund: drawData.draw.fund,                                  // Jackpot in?
      currentNetSale: drawData.draw.currentNetSale               // Omsättning
    };

    // Bearbeta matchdata
    const matchData = drawData.draw.drawEvents.map(event => {
      const result = event.match.result.find(r => r.description === "Current");
      const home = event.match.participants.find(p => p.type === "home").name;
      const away = event.match.participants.find(p => p.type === "away").name;

      const folkTips = event.svenskaFolket || { one: 0, x: 0, two: 0 };
      const homeScore = result ? parseInt(result.home) : null;
      const awayScore = result ? parseInt(result.away) : null;

      let autoSign = '-';
      if (homeScore > awayScore) autoSign = '1';
      else if (homeScore < awayScore) autoSign = '2';
      else if (homeScore === awayScore) autoSign = 'X';

      const matchStatus = event.match.sportEventStatus;    // Status för matchen

      const hasStarted = event.match.sportEventStatus === "Started";
      const isEnded = event.match.sportEventStatus === "Ended";

      return {
        homeTeam: home,
        awayTeam: away,
        homeScore: matchStatus !== 'NotStarted' ? homeScore : '',
        awayScore: matchStatus !== 'NotStarted' ? awayScore : '',
        autoSign: matchStatus !== 'NotStarted' ? autoSign : '-',
        matchStatus,
        hasStarted,
        isEnded,
        folkOne: folkTips.one,
        folkX: folkTips.x,
        folkTwo: folkTips.two
      };
    });

    // Returnera både matchData och drawState
    return { drawDetails, matchData };

  } catch (error) {
    console.error('Fel vid hämtning av data:', error);
    return { drawDetails, matchData: [] }; // Returnera tom data om fel uppstår
  }
}

// Hämta utdelning och vinnare om drawState är "Closed"
export async function fetchResultData(drawState, drawNumber) {
  try {

    // Kontrollera drawState innan anrop
    if (drawState == "Open") {
      console.log('Utdelningsdata hämtas endast om omgången är stängd.');
      return null; // Returnera null om omgången inte är stängd
    }

    const response = await fetch(
      `https://api.spela.svenskaspel.se/draw/1/stryktipset/draws/${drawNumber}/result`
    );

    if (!response.ok) {
      throw new Error('Något gick fel vid hämtning av extra data');
    }

    const data = await response.json();

    // Rensa belopp så att de är i rätt format
    const cleanedData = data.result.distribution.map(d => ({
      ...d,
      amount: parseInt(d.amount.replace(',', '.')) // Ersätt komma med punkt
    }));
    return cleanedData;
  } catch (error) {
    console.error('Fel vid hämtning av extra information:', error);
    return null;
  }
}

/* https://www.sweclockers.com/forum/trad/1645429-oppet-api-for-stryktipset?p=2


https://api.spela.svenskaspel.se/draw/1/stryktipset/draws/result
https://api.spela.svenskaspel.se/draw/1/stryktipset/draws/4879/result

https://api.spela.svenskaspel.se/draw/1/stryktipset/draws/[omg%C3%A5ngsnummer]
https://spela.svenskaspel.se/tt/matchlist/stryktipset

https://api.spela.svenskaspel.se/draw/1/stryktipset/draws/result
https://api.spela.svenskaspel.se/draw/1/topptipsetfamily/draws/result
https://api.spela.svenskaspel.se/draw/1/europatipset/draws/result
https://api.spela.svenskaspel.se/draw/1/maltipset/draws/result
https://api.spela.svenskaspel.se/draw/1/challenge/draws/result
https://api.spela.svenskaspel.se/draw/1/bomben/draws/result
https://api.spela.svenskaspel.se/draw/1/matchen/draws/result

https://api.spela.svenskaspel.se/draw/1/stryktipset/draws/result

https://api.spela.svenskaspel.se/draw/1/europatipset/draws/

https://api.spela.svenskaspel.se/draw/1/topptipsetfamily/draws

Använd "https://api.spela.svenskaspel.se/draw/" + product + "/draws" istället.

https://www.atg.se/services/racinginfo/v1/api/calendar/day/2022-10-29

Exakt vad är du ute efter? Resultat?

Produkterna verkar följa detta format på api:er:
Först vill du hämta infon om vilka lopp som går på en dag, vilken bana och state loppet är i etc och det gör du här:
https://www.atg.se/services/racinginfo/v1/api/calendar/day/20...

Sen med infon du hittar i förra api:et använder du denna för att hämta resultaten från de lopp du vill kolla på genom detta upplägg:
https://www.atg.se/services/racinginfo/v1/api/games/ + vilket lopp du ville kolla på, t.ex. V3_2022-10-29_7_7 eller V75_2022-10-29_23_5. Dessa hittar du i racinginfo/v1/api/calendar/day/ och vilken dag du vill hämta från.

Är man ute efter mer info kring racen denna dag så hämtar man loppanalyser etc här: siffran efter /zeta/ är vilken bana loppet går på.
https://dmh.aws.atg.se/zeta/23/2022-10-29

Info light om nästkommande V75 lopp
https://www.atg.se/services/racinginfo/v1/api/products/V75

Hoppas det är till nån hjälp.

https://dmh.aws.atg.se/zeta/23/2022-10-29

*/