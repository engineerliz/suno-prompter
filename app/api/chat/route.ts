import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { SunoPrompt } from "@/app/types/suno";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const SYSTEM_PROMPT = `You are a helpful AI assistant specialized in building prompts for Suno AI music generation. Your goal is to help users create detailed, structured prompts for generating songs.

You should:
1. Ask clarifying questions about the song (title, lyrics, genre, mood, style, etc.)
2. Build and update a JSON prompt structure iteratively based on the conversation
3. After each user message, provide a helpful conversational response AND output the updated prompt JSON

The prompt structure follows this format:
{
  "title": "string",
  "lyrics": "string",
  "style": {
    "genre": ["string"],
    "mood": ["string"],
    "vocals": "string",
    "tempo": "string",
    "instruments": ["string"]
  },
  "structure": {
    "sections": [
      {
        "type": "string",
        "lyrics": "string",
        "duration": "string"
      }
    ]
  },
  "references": {
    "similar_to": ["string"],
    "era": "string"
  },
  "production": {
    "energy": "string",
    "production_style": "string"
  }
}

CRITICAL FORMATTING RULES:
- You MUST ALWAYS include a prompt update in EVERY response, even if it's the first message
- After your conversational response, ALWAYS include the updated prompt JSON in a code block marked with [PROMPT_UPDATE] and [/PROMPT_UPDATE]
- On the FIRST message, extract any information from the user's request (genre, style, mood, etc.) and create an initial prompt
- Only include fields that have been discussed, updated, or are new in this response
- Use partial updates - don't repeat unchanged fields
- For arrays (genre, mood, instruments, similar_to, sections), provide the complete updated array, not just additions
- If a field value is being cleared or removed, include it with null or empty value
- Always provide valid JSON that can be parsed
- If the user mentions a genre, style, or any song details, immediately add them to the prompt

Example format for first message:
User: "I want to make a dirty bird style house song"
Your response:
Great! I'll help you build a Dirtybird-style house track. Let me start building your prompt. What kind of vibe are you going for - dark and driving, or playful and funky?

[PROMPT_UPDATE]
{
  "style": {
    "genre": ["house"],
    "mood": []
  },
  "references": {
    "similar_to": ["Dirtybird"]
  }
}
[/PROMPT_UPDATE]

Example format for subsequent messages:
Great! I've added those details to your prompt. The song will have an upbeat pop feel with acoustic guitar.

[PROMPT_UPDATE]
{
  "title": "Summer Days",
  "style": {
    "genre": ["pop", "indie"],
    "mood": ["upbeat", "energetic"],
    "instruments": ["acoustic guitar", "drums"]
  }
}
[/PROMPT_UPDATE]

REMEMBER: You MUST include [PROMPT_UPDATE]...[/PROMPT_UPDATE] in EVERY response, starting from the very first message.`;

function extractPromptUpdate(text: string): SunoPrompt | null {
  const startMarker = "[PROMPT_UPDATE]";
  const endMarker = "[/PROMPT_UPDATE]";
  
  const startIndex = text.indexOf(startMarker);
  const endIndex = text.indexOf(endMarker);
  
  if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
    return null;
  }
  
  const jsonText = text.substring(startIndex + startMarker.length, endIndex).trim();
  
  try {
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Failed to parse prompt update:", error);
    return null;
  }
}

function cleanResponseText(text: string): string {
  const startMarker = "[PROMPT_UPDATE]";
  const endMarker = "[/PROMPT_UPDATE]";
  
  const startIndex = text.indexOf(startMarker);
  const endIndex = text.indexOf(endMarker);
  
  if (startIndex === -1 || endIndex === -1) {
    return text;
  }
  
  return text.substring(0, startIndex).trim();
}

function extractInfoFromUserMessage(message: string, currentPrompt: SunoPrompt): SunoPrompt | null {
  const messageLower = message.toLowerCase();
  const extractedPrompt: SunoPrompt = {};
  let hasUpdates = false;

  // Extract genres
  const genreKeywords: { [key: string]: string[] } = {
    house: ['house'],
    pop: ['pop'],
    rock: ['rock'],
    'hip hop': ['hip hop', 'hip-hop', 'rap'],
    electronic: ['electronic', 'edm'],
    techno: ['techno'],
    trance: ['trance'],
    indie: ['indie'],
    folk: ['folk'],
    jazz: ['jazz'],
    country: ['country'],
    'r&b': ['r&b', 'rnb', 'rhythm and blues'],
    funk: ['funk'],
    disco: ['disco'],
    blues: ['blues'],
    reggae: ['reggae'],
    metal: ['metal'],
    punk: ['punk'],
  };

  const detectedGenres: string[] = [];
  for (const [genre, keywords] of Object.entries(genreKeywords)) {
    if (keywords.some(keyword => messageLower.includes(keyword))) {
      detectedGenres.push(genre);
    }
  }

  if (detectedGenres.length > 0) {
    extractedPrompt.style = { ...extractedPrompt.style, genre: detectedGenres };
    hasUpdates = true;
  }

  // Extract moods
  const moodKeywords: { [key: string]: string[] } = {
    upbeat: ['upbeat', 'up-beat', 'energetic', 'energizing'],
    melancholic: ['melancholic', 'melancholy', 'sad', 'somber'],
    happy: ['happy', 'joyful', 'cheerful'],
    dark: ['dark', 'darkness', 'gloomy'],
    playful: ['playful', 'fun', 'funny'],
    romantic: ['romantic', 'romance', 'love'],
    aggressive: ['aggressive', 'intense', 'heavy'],
    calm: ['calm', 'peaceful', 'relaxed', 'chill'],
    dreamy: ['dreamy', 'ethereal', 'ambient'],
    driving: ['driving', 'pumping', 'powerful'],
  };

  const detectedMoods: string[] = [];
  for (const [mood, keywords] of Object.entries(moodKeywords)) {
    if (keywords.some(keyword => messageLower.includes(keyword))) {
      detectedMoods.push(mood);
    }
  }

  if (detectedMoods.length > 0) {
    // Merge with existing moods if any
    const existingMoods = currentPrompt?.style?.mood || [];
    const combinedMoods = [...new Set([...existingMoods, ...detectedMoods])]; // Remove duplicates
    extractedPrompt.style = { ...extractedPrompt.style, mood: combinedMoods };
    hasUpdates = true;
  }

  // Extract tempo
  const tempoKeywords: { [key: string]: string[] } = {
    fast: ['fast', 'quick', 'rapid'],
    slow: ['slow', 'slowly'],
    medium: ['medium', 'moderate'],
  };

  // Check for BPM mentions (e.g., "120 bpm", "120bpm")
  const bpmMatch = messageLower.match(/(\d+)\s*bpm/);
  if (bpmMatch) {
    extractedPrompt.style = { ...extractedPrompt.style, tempo: `${bpmMatch[1]}bpm` };
    hasUpdates = true;
  } else {
    for (const [tempo, keywords] of Object.entries(tempoKeywords)) {
      if (keywords.some(keyword => messageLower.includes(keyword))) {
        extractedPrompt.style = { ...extractedPrompt.style, tempo };
        hasUpdates = true;
        break;
      }
    }
  }

  // Extract energy level
  const energyKeywords: { [key: string]: string[] } = {
    high: ['high energy', 'high-energy', 'energetic'],
    medium: ['medium energy', 'medium-energy', 'moderate'],
    low: ['low energy', 'low-energy', 'calm', 'chill'],
  };

  for (const [energy, keywords] of Object.entries(energyKeywords)) {
    if (keywords.some(keyword => messageLower.includes(keyword))) {
      extractedPrompt.production = { ...extractedPrompt.production, energy };
      hasUpdates = true;
      break;
    }
  }

  // Extract style/label references
  if (messageLower.includes('dirtybird') || messageLower.includes('dirty bird')) {
    extractedPrompt.references = { ...extractedPrompt.references, similar_to: ['Dirtybird'] };
    hasUpdates = true;
  }

  // Extract title if user says "title is X" or "call it X"
  const titleMatch = messageLower.match(/(?:title is|call it|named?)\s+["']?([^"'.!?]+)["']?/);
  if (titleMatch) {
    extractedPrompt.title = titleMatch[1].trim();
    hasUpdates = true;
  }

  return hasUpdates ? extractedPrompt : null;
}

export async function POST(request: NextRequest) {
  try {
    const { messages, currentPrompt } = await request.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not set. Please create a .env.local file with your API key." },
        { status: 500 }
      );
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Invalid messages format" },
        { status: 400 }
      );
    }

    const modelName = process.env.GEMINI_MODEL || "gemini-pro";
    const model = genAI.getGenerativeModel({ model: modelName });

    // Build context with current prompt state
    let contextMessage = "";
    if (currentPrompt && Object.keys(currentPrompt).length > 0) {
      contextMessage = `\n\nCurrent prompt state:\n${JSON.stringify(currentPrompt, null, 2)}\n\nBuild on this existing prompt, updating only the fields that change.`;
    }

    // Convert messages to Gemini format
    const chatHistory = messages
      .slice(0, -1) // All messages except the last one
      .map((msg: { role: string; content: string }) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      }));

    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    
    if (lastMessage.role !== "user") {
      return NextResponse.json(
        { error: "Last message must be from user" },
        { status: 400 }
      );
    }

    // Prepare the user message with context
    const userMessageWithContext = contextMessage 
      ? `${lastMessage.content}${contextMessage}`
      : lastMessage.content;

    // Start chat with history and system instruction
    // systemInstruction must be formatted as Content object with parts array
    const chat = model.startChat({
      history: chatHistory,
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
    });

    const result = await chat.sendMessage(userMessageWithContext);
    const response = await result.response;
    const text = response.text();

    // Extract prompt update and clean response text
    let promptUpdate = extractPromptUpdate(text);
    const cleanText = cleanResponseText(text);

    // If no prompt update was found, try to extract info from the user's message
    // This ensures we always have an update, even if the AI doesn't follow the format
    if (!promptUpdate) {
      const extractedInfo = extractInfoFromUserMessage(lastMessage.content, currentPrompt || {});
      if (extractedInfo) {
        // Use the extracted info which already has merged arrays
        promptUpdate = {
          ...currentPrompt,
          ...extractedInfo,
          style: {
            ...currentPrompt?.style,
            ...extractedInfo.style,
            // Use extracted arrays (already merged in extractInfoFromUserMessage)
            genre: extractedInfo.style?.genre ?? currentPrompt?.style?.genre,
            mood: extractedInfo.style?.mood ?? currentPrompt?.style?.mood,
            instruments: extractedInfo.style?.instruments ?? currentPrompt?.style?.instruments,
            tempo: extractedInfo.style?.tempo ?? currentPrompt?.style?.tempo,
            vocals: extractedInfo.style?.vocals ?? currentPrompt?.style?.vocals,
          },
          references: {
            ...currentPrompt?.references,
            ...extractedInfo.references,
            similar_to: extractedInfo.references?.similar_to ?? currentPrompt?.references?.similar_to,
          },
          production: {
            ...currentPrompt?.production,
            ...extractedInfo.production,
          },
        };
      } else if (currentPrompt && Object.keys(currentPrompt).length > 0) {
        // If we can't extract new info but have an existing prompt, return it unchanged
        // This ensures the prompt stays visible even if AI doesn't update it
        promptUpdate = currentPrompt;
      }
    } else {
      // If we got a prompt update from AI, merge it with current prompt
      // AI provides complete arrays, so use them as-is (not merged)
      promptUpdate = {
        ...currentPrompt,
        ...promptUpdate,
        style: {
          ...currentPrompt?.style,
          ...promptUpdate.style,
          // AI provides complete arrays, so use them if provided, otherwise keep existing
          genre: promptUpdate.style?.genre ?? currentPrompt?.style?.genre,
          mood: promptUpdate.style?.mood ?? currentPrompt?.style?.mood,
          instruments: promptUpdate.style?.instruments ?? currentPrompt?.style?.instruments,
          tempo: promptUpdate.style?.tempo ?? currentPrompt?.style?.tempo,
          vocals: promptUpdate.style?.vocals ?? currentPrompt?.style?.vocals,
        },
        references: {
          ...currentPrompt?.references,
          ...promptUpdate.references,
          similar_to: promptUpdate.references?.similar_to ?? currentPrompt?.references?.similar_to,
        },
        production: {
          ...currentPrompt?.production,
          ...promptUpdate.production,
        },
        structure: {
          ...currentPrompt?.structure,
          ...promptUpdate.structure,
          sections: promptUpdate.structure?.sections ?? currentPrompt?.structure?.sections,
        },
      };
    }

    return NextResponse.json({ 
      content: cleanText,
      prompt: promptUpdate || undefined
    });
  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    
    let errorMessage = "Failed to get response from Gemini";
    if (error?.message) {
      errorMessage = error.message;
    } else if (error?.error?.message) {
      errorMessage = error.error.message;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

