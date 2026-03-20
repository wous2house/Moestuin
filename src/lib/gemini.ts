import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generatePlantData(plantName: string): Promise<any> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Je bent een moestuin expert. Genereer een JSON object met de eigenschappen van de plant/groente/fruit: "${plantName}". Gebruik EXACT deze structuur (en geef alleen geldige JSON terug zonder markdown blokken):
{
  "name": "Naam (Capitalized)",
  "family": "Een van: Groente, Fruit, Zaden, Bloemen, Overig",
  "goodNeighbors": ["Naam van plant", "Naam van plant"],
  "badNeighbors": ["Naam van plant"],
  "sunPreference": "Een van: Zon, Halfschaduw, Schaduw, Duisternis",
  "daysToHarvest": 60,
  "waterNeeds": "Een van: Laag, Gemiddeld, Hoog",
  "icon": "UITSLUITEND 1 standaard Unicode emoji (GEEN tekst of woorden). Gebruik de dichtstbijzijnde visuele match als de exacte emoji niet bestaat (bijv. 🍠 voor biet, 🥬 voor sla/kool, 🧅 voor prei).",
  "englishSearchTerm": "De Engelse titel van het Wikipedia artikel voor deze plant, of beter nog: de vrucht/oogst zelf. Gebruik bij voorkeur het meervoud (bijv. 'Tomatoes', 'Strawberries') zodat de foto meerdere exemplaren toont."
}`,
    });
    const text = response.text || "{}";
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(jsonStr);

    if (data.englishSearchTerm) {
      try {
        const wikiRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(data.englishSearchTerm)}`);
        if (wikiRes.ok) {
          const wikiData = await wikiRes.json();
          if (wikiData.originalimage && wikiData.originalimage.source) {
            data.imageUrl = wikiData.originalimage.source;
          } else if (wikiData.thumbnail && wikiData.thumbnail.source) {
            let url = wikiData.thumbnail.source;
            // Wikipedia thumbnail URLs look like: .../thumb/a/ab/Filename.jpg/xxxpx-Filename.jpg
            // To get the original: remove /thumb/ and remove the last segment
            if (url.includes('/thumb/')) {
              url = url.replace('/thumb/', '/');
              const parts = url.split('/');
              parts.pop(); // Remove the "xxxpx-Filename.jpg" part
              url = parts.join('/');
            }
            data.imageUrl = url;
          }
        }
      } catch (e) {
        console.warn("Could not fetch wikipedia image", e);
      }
    }

    return data;
  } catch (error) {
    console.error("Error generating plant data:", error);
    return null;
  }
}

export async function calculateHarvestDate(plantName: string, plantType: string, sunPreference: string, dateStr: string): Promise<{ expectedHarvestDays: number, reason: string } | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Je bent een moestuin expert. Bepaal het aantal verwachte groeidagen (days to harvest) voor het gewas "${plantName}".
Het wordt op deze datum geplant/gezaaid (in Nederland/België): ${dateStr}.
Het wordt geplant als: ${plantType} (Zaad duurt het langst, Bol is iets sneller, Plant (jonge plant) is het snelst omdat het is voorgetrokken).
Het krijgt het volgende zonlicht op die plek: ${sunPreference}.

Houd rekening met de plantmethode, het seizoen (temperatuur/licht) en de zonneplek.
Geef een JSON object terug met EXACT deze structuur (geen markdown blokken of extra tekst):
{
  "expectedHarvestDays": 60,
  "reason": "Korte uitleg waarom dit de verwachte groeitijd is (max 2 zinnen)."
}`,
    });
    const text = response.text || "{}";
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(jsonStr);
    return data;
  } catch (error) {
    console.error("Error calculating harvest date:", error);
    return null;
  }
}

export async function analyzePlantDisease(imageBase64: string, mimeType: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: imageBase64,
              mimeType: mimeType,
            },
          },
          {
            text: "Je bent een expert in plantenziekten. Analyseer deze foto van een moestuinplant. Identificeer de plant (indien mogelijk), de waarschijnlijke ziekte of plaag, en geef 3 concrete, biologische oplossingen. Antwoord in het Nederlands in een duidelijke, gestructureerde tekst.",
          },
        ],
      },
    });
    return response.text || "Kon de afbeelding niet analyseren.";
  } catch (error) {
    console.error("Error analyzing plant disease:", error);
    return "Er is een fout opgetreden bij het analyseren van de afbeelding.";
  }
}

export async function generateRecipe(ingredients: string[]): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Je bent een chef-kok. Ik heb de volgende ingrediënten uit mijn moestuin geoogst: ${ingredients.join(', ')}. Bedenk een heerlijk, eenvoudig recept waar deze ingrediënten de hoofdrol spelen. Je mag basisvoorraad (zoals olie, zout, peper, bloem) toevoegen. Geef een titel, ingrediëntenlijst en bereidingswijze in het Nederlands.`,
    });
    return response.text || "Kon geen recept genereren.";
  } catch (error) {
    console.error("Error generating recipe:", error);
    return "Er is een fout opgetreden bij het genereren van het recept.";
  }
}
