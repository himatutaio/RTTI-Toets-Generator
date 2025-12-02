import { GoogleGenAI, Type, Schema } from "@google/genai";
import { TestConfiguration, GeneratedTest, SearchResult } from "../types";

// Helper to sanitize JSON string if Markdown code blocks are present
const cleanJsonString = (str: string) => {
  return str.replace(/```json\n|\n```/g, "").replace(/```/g, "").trim();
};

export const suggestTopics = async (subject: string, level: string): Promise<{ topics: string; sources: SearchResult[] }> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key ontbreekt");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Use 2.5 Flash with Search for up-to-date curriculum info
  const prompt = `Ik ben een docent die een toets voorbereidt voor het vak ${subject} op niveau ${level} in Nederland.
  Zoek naar het huidige curriculum, kerndoelen en interessant recent nieuws of contexten die relevant zijn voor dit onderwerp.
  Geef een lijst van 5-7 belangrijke onderwerpen die ik moet behandelen en 3-5 specifieke leerdoelen.
  Geef ook een korte samenvatting van een realistische context die ik zou kunnen gebruiken.
  Reageer volledig in het Nederlands.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    let sources: SearchResult[] = [];
    if (groundingChunks) {
       sources = groundingChunks
        .map((chunk) => chunk.web)
        .filter((web): web is { title: string; uri: string } => !!web)
        .map((web) => ({ title: web.title || "Bron", uri: web.uri || "#" }));
    }

    return { topics: text, sources };
  } catch (error) {
    console.error("Topic suggestion failed:", error);
    return { topics: "Kon geen onderwerpen ophalen. Probeer het opnieuw.", sources: [] };
  }
};

export const generateRTTITest = async (config: TestConfiguration): Promise<GeneratedTest> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key ontbreekt");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Define the JSON schema for the output
  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      introduction: { type: Type.STRING },
      questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.INTEGER },
            text: { type: Type.STRING },
            rtti: { type: Type.STRING, enum: ["R", "T1", "T2", "I"] },
            type: { type: Type.STRING, enum: ["Multiple Choice", "Open", "Other"] },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            points: { type: Type.INTEGER },
          },
          required: ["id", "text", "rtti", "type", "points"],
        },
      },
      matrix: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            r: { type: Type.INTEGER },
            t1: { type: Type.INTEGER },
            t2: { type: Type.INTEGER },
            i: { type: Type.INTEGER },
          },
          required: ["topic", "r", "t1", "t2", "i"],
        },
      },
      answers: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            questionId: { type: Type.INTEGER },
            answer: { type: Type.STRING },
            criteria: { type: Type.STRING },
            explanation: { type: Type.STRING },
          },
          required: ["questionId", "answer", "explanation"],
        },
      },
      goalMapping: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            goal: { type: Type.STRING },
            questionIds: { type: Type.ARRAY, items: { type: Type.INTEGER } },
          },
          required: ["goal", "questionIds"],
        },
      },
      analysisInstructions: { type: Type.STRING },
    },
    required: ["title", "questions", "matrix", "answers", "goalMapping", "analysisInstructions"],
  };

  const prompt = `
    Je bent een expert en onderwijskundige gespecialiseerd in RTTI-toetsing.
    Genereer een volledige RTTI-toets op basis van de volgende configuratie:

    Vak: ${config.subject}
    Niveau: ${config.level}
    Onderwerpen: ${config.topics}
    Leerdoelen: ${config.learningGoals}
    
    RTTI Verdeling:
    - R: ${config.rttiDistribution.R}%
    - T1: ${config.rttiDistribution.T1}%
    - T2: ${config.rttiDistribution.T2}%
    - I: ${config.rttiDistribution.I}%
    
    Randvoorwaarden:
    - Totale Duur: ${config.duration} minuten
    - Aantal Vragen: ${config.questionCount}
    - Vraagtypes: ${config.questionTypes}
    - Taalniveau: ${config.languageLevel}
    - Extra Eisen: ${config.extraRequirements}

    Taak:
    1. Maak een Toetsmatrijs (A) die de verdeling verifieert.
    2. Maak de Vragen (B) met correcte RTTI-labels. Zorg voor nieuwe contexten bij T2 en I vragen.
    3. Maak het Antwoordmodel (C) met beoordelingscriteria en RTTI-toelichting.
    4. Koppel vragen aan Leerdoelen (D).
    5. Geef instructies voor de docent over het analyseren van de resultaten (E).

    Genereer alle inhoud (vragen, antwoorden, toelichtingen) in het NEDERLANDS.
    Reageer strikt in JSON-formaat dat overeenkomt met het opgegeven schema.
  `;

  try {
    // Using gemini-3-pro-preview for complex reasoning and structure compliance
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonStr = cleanJsonString(response.text || "{}");
    return JSON.parse(jsonStr) as GeneratedTest;
  } catch (error) {
    console.error("Test generation failed:", error);
    throw new Error("Kon de toets niet genereren. Controleer de invoer en probeer het opnieuw.");
  }
};