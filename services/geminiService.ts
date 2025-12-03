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
        .filter((web) => !!web)
        .map((web) => ({ title: web?.title || "Bron", uri: web?.uri || "#" }));
    }

    return { topics: text, sources };
  } catch (error) {
    console.error("Topic suggestion failed:", error);
    return { topics: "Kon geen onderwerpen ophalen. Probeer het opnieuw.", sources: [] };
  }
};

export const generateTest = async (config: TestConfiguration): Promise<GeneratedTest> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key ontbreekt");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const isKTI = config.taxonomy === 'KTI';

  // Construct the specific prompt based on Taxonomy
  let systemPrompt = "";
  let distributionPrompt = "";
  let matrixColumns: string[] = [];

  if (isKTI) {
    matrixColumns = ["K", "T", "I"];
    distributionPrompt = `
      KTI Verdeling:
      - K (Kennis): ${config.distribution.K}%
      - T (Toepassen): ${config.distribution.T}%
      - I (Inzicht): ${config.distribution.I}%
    `;
    systemPrompt = `
      Je bent een expert en onderwijskundige gespecialiseerd in KTI-toetsing (Kennis, Toepassen, Inzicht).
      Genereer een volledige KTI-toets.
      
      Doel: Genereer een volledige KTI-toets, een KTI-matrix, een antwoordmodel en een overzicht van de leerdoelen.
      
      Wat AI moet genereren:
      A. KTI-toetsmatrijs: Verdeling van vragen per onderwerp en per niveau (K/T/I).
      B. Volledige KTI-toets: Genummerde vragen met K/T/I-label.
      C. Antwoordmodel: Korte uitleg waarom de vraag K/T/I is.
      D. Overzicht leerdoelen: Koppeling leerdoel -> vraagnummer(s).
      E. Toetsanalyse-sjabloon: Tabel om resultaten per K/T/I in te vullen.
    `;
  } else {
    // RTTI
    matrixColumns = ["R", "T1", "T2", "I"];
    distributionPrompt = `
      RTTI Verdeling:
      - R (Reproductie): ${config.distribution.R}%
      - T1 (Training 1): ${config.distribution.T1}%
      - T2 (Training 2): ${config.distribution.T2}%
      - I (Inzicht): ${config.distribution.I}%
    `;
    systemPrompt = `
      Je bent een expert en onderwijskundige gespecialiseerd in RTTI-toetsing.
      Genereer een volledige RTTI-toets.
      
      Wat AI moet genereren:
      A. RTTI-toetsmatrijs: Verdeling van vragen per onderwerp en per denkniveau (R/T1/T2/I).
      B. Volledige RTTI-toets: Per vraag het RTTI-label.
      C. Antwoordmodel: Per vraag uitleg waarom het R/T1/T2/I is.
      D. Overzicht leerdoelen: Koppeling leerdoel -> vraagnummer(s).
      E. Toetsanalyse-sjabloon.
    `;
  }

  // Define JSON Schema
  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      taxonomy: { type: Type.STRING, enum: [config.taxonomy] },
      introduction: { type: Type.STRING },
      questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.INTEGER },
            text: { type: Type.STRING },
            taxonomyLabel: { type: Type.STRING, enum: isKTI ? ["K", "T", "I"] : ["R", "T1", "T2", "I"] },
            type: { type: Type.STRING, enum: ["Multiple Choice", "Open", "Other"] },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            points: { type: Type.INTEGER },
          },
          required: ["id", "text", "taxonomyLabel", "type", "points"],
        },
      },
      matrix: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            // Allow dynamic keys based on taxonomy
            ...matrixColumns.reduce((acc, col) => ({ ...acc, [col.toLowerCase()]: { type: Type.INTEGER } }), {}),
          },
          required: ["topic", ...matrixColumns.map(c => c.toLowerCase())],
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
    required: ["title", "taxonomy", "questions", "matrix", "answers", "goalMapping", "analysisInstructions"],
  };

  const finalPrompt = `
    ${systemPrompt}

    Configuratie:
    Vak: ${config.subject}
    Niveau: ${config.level}
    Onderwerpen: ${config.topics}
    Leerdoelen: ${config.learningGoals}
    
    ${distributionPrompt}
    
    Randvoorwaarden:
    - Totale Duur: ${config.duration} minuten
    - Aantal Vragen: ${config.questionCount}
    - Vraagtypes: ${config.questionTypes}
    - Taalniveau: ${config.languageLevel}
    - Extra Eisen: ${config.extraRequirements}

    Genereer alle inhoud (vragen, antwoorden, toelichtingen) in het NEDERLANDS.
    Reageer strikt in JSON-formaat dat overeenkomt met het opgegeven schema.
  `;

  try {
    // Use gemini-2.5-flash for faster generation
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: finalPrompt,
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