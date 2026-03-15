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
  "icon": "Eén emoji die specifiek dit gewas voorstelt (kies de meest unieke/passende emoji, vermijd algemene blaadjes tenzij onvermijdelijk)",
  "wikipediaSearchTerm": "De exacte titel van het Nederlandse Wikipedia artikel voor deze plant (bijv. 'Tomaat', 'Kropsla', 'Aardbei')"
}`,
    });
    const text = response.text || "{}";
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(jsonStr);

    if (data.wikipediaSearchTerm) {
      try {
        const wikiRes = await fetch(`https://nl.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(data.wikipediaSearchTerm)}`);
        if (wikiRes.ok) {
          const wikiData = await wikiRes.json();
          if (wikiData.thumbnail && wikiData.thumbnail.source) {
            data.imageUrl = wikiData.thumbnail.source.replace(/\/\d+px-/, '/800px-'); // Try to get a larger thumbnail if possible, or just use what we get
          } else if (wikiData.originalimage && wikiData.originalimage.source) {
            data.imageUrl = wikiData.originalimage.source;
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
