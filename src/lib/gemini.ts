import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
