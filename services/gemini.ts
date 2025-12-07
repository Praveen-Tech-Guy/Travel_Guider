

import { GoogleGenAI, Chat, LiveServerMessage, Modality, Type, GenerateContentResponse, Content } from "@google/genai";
import { CostItem, ChatMessage, ModelMode, Currency, Attachment, ImageModel, ImageResolution, ImageAspectRatio } from "../types";

// Helper to get API key safely
const getApiKey = () => process.env.API_KEY || '';

// --- CHAT & PLANNER SERVICE ---

// Base instructions that will be dynamically enhanced
const BASE_SYSTEM_INSTRUCTION = `
    You are WanderAI, an elite, sophisticated travel companion. Your goal is to create the perfect, customized travel itinerary.
    
    PHASE 1: DISCOVERY
    If the user's initial request is vague, ask clarifying questions about:
    - Destination preferences (or suggest based on vibe)
    - Duration of trip
    - Budget (Low, Medium, Luxury)
    - Interests (Hiking, Food, Culture, Relaxation, Adventure)
    - Who is traveling (Solo, Couple, Family)

    PHASE 2: THE PROFESSIONAL PRESENTATION
    Once you have enough details, generate a comprehensive, highly styled travel plan using the 'googleSearch' tool to find REAL, up-to-date information. 
    
    You MUST present the response in the following creative structure. Use Markdown heavily (Headers, Bold, Lists, Links).
    
    ## Cost Breakdown of Travel Places
    *Trip cost , flight (Calculated from User's Origin Country) ,booking hotels, food cost*

    ## 🌍 [Trip Title: Destination Name]
    *A vivid, inspiring introduction describing the vibe of the location.*

    ### 📸 Must-Visit Gems (Visual Guide)
    Suggest 3-4 best places to visit. For EACH place:
    - **Name & Location**: [Place Name](https://www.google.com/maps/search/?api=1&query=[Place+Name]) (Link to Google Maps)
    - **The Vibe**: Why it's amazing.
    - **Visuals**: If the search tool provides an image URL, embed it using \`![Image Description](url)\`. If not, provide a link: [View Photos & Videos](https://www.google.com/search?q=[Place+Name]+view+images&tbm=isch).

    ### 🏨 Best Stays (Bookings & Comfort)
    Suggest 3 specific hotels/resorts. For EACH:
    - **Hotel Name**: [Hotel Name](https://www.google.com/maps/search/?api=1&query=[Hotel+Name])
    - **Rating**: ⭐⭐⭐⭐⭐ (Real rating)
    - **Price**: Approx price per night.
    - **Why Stay**: Brief description.
    - **Media**: [📺 Watch Video Tour](https://www.youtube.com/results?search_query=[Hotel+Name]+tour)
    - **Booking**: [📅 Book Now on Booking.com](https://www.booking.com/searchresults.html?ss=[Hotel+Name]) (Simulated affiliate link)

    ### 🗺️ The Master Itinerary (Step-by-Step)
    A day-by-day breakdown. Be specific about logistics.
    - **Day 1**: ...
    - **Day 2**: ...

    ### 🧠 Cultural Intelligence & Locals
    - **The People**: Describe the locals, their demeanor, and ethics.
    - **Communication**: Language tips and how to communicate respectfully.
    - **Best Time to Visit**: Weather and crowd analysis.

    ### 💰 Budget Hacking (Lower Your Costs)
    Specific tips on how to save money for this specific destination (e.g., transport passes, cheap eats, free days at museums).

    ### 🎒 Travel Toolkit & Gear (Shopping on Amazon)
    Categorize recommendations based on the trip type (e.g., "### 🎒 Recommended Gear: Hiking"). Include a "Uniquely [Destination] Souvenirs" section. 
    
    IMPORTANT: For ALL suggested tools, products, and gear, you MUST provide an Amazon search link.
    Format:
    - [ ] **[Item Name]**: Why it's needed. [🛒 Buy on Amazon](https://www.amazon.com/s?k=[Item+Name])
    
    For Souvenirs, also attempt to provide an Amazon link:
    - [ ] **[Souvenir Name]**: A unique local souvenir. [🔍 Find on Amazon](https://www.amazon.com/s?k=[Souvenir+Name])

    ### 💵 Financial Summary
    Sum of all estimated costs (Travel + Stays + Activities).

    ---
    PHASE 3: LINKS TO BOOK FLIGHTS
    showing links to book flights to travel at the place that user is planning about from  from {https://us.trip.com/flights/?locale=en-US&curr=USD} this site
    
    PHASE 4: DATA EXTRACTION
    At the VERY end of your response, strictly output a JSON block (wrapped in \`\`\`json \`\`\`) representing the estimated cost breakdown.
    Format:
    [
      {"category": "Flights", "amount": 1200},
      {"category": "Hotels", "amount": 800},
      {"category": "Food", "amount": 400},
      {"category": "Activities", "amount": 300},
      {"category": "Misc", "amount": 150}
    ]

`;

export const sendMessage = async (
    message: string, 
    mode: ModelMode = 'balanced',
    history: ChatMessage[] = [],
    userCountry: string = 'United States',
    currency: Currency = 'USD',
    attachments: Attachment[] = []
): Promise<{ text: string; groundingLinks: string[]; costData?: CostItem[] }> => {
  
  // Re-init client for key check
  const ai = new GoogleGenAI({ apiKey: getApiKey() });

  // Map modes to models and configs
  let model = 'gemini-2.5-flash';
  
  // Dynamic instruction update for localization
  const localizedInstruction = `
    ${BASE_SYSTEM_INSTRUCTION}
    
    CRITICAL LOCALIZATION SETTINGS:
    1. USER ORIGIN: The user is traveling FROM: "${userCountry}". All flight costs MUST be calculated starting from this country.
    2. CURRENCY: All costs, prices, and the final JSON financial summary MUST be in "${currency}". Use the correct currency symbol.
  `;

  let config: any = {
      temperature: 0.7,
      systemInstruction: localizedInstruction,
      tools: [{ googleSearch: {}, googleMaps: {} }], // Added googleMaps
  };

  // Model Selection Logic
  if (attachments.length > 0) {
      // PROMPT: "You MUST add image understanding to the app using model gemini-3-pro-preview"
      // PROMPT: "You MUST add video understanding to the app using model gemini-3-pro-preview"
      model = 'gemini-3-pro-preview';
  } else if (mode === 'fast') {
      model = 'gemini-2.5-flash-lite';
  } else if (mode === 'deep') {
      model = 'gemini-3-pro-preview';
      config = {
          ...config,
          thinkingConfig: { thinkingBudget: 32768 },
      };
  }

  // Construct history for SDK
  // We only include text in history to avoid overloading token limits/local storage logic with heavy base64
  const sdkHistory: Content[] = history
      .filter(msg => msg.text)
      .map(msg => ({
          role: msg.role,
          parts: [{ text: msg.text }]
      }));

  try {
    // If we have attachments, we must use generateContent on the model directly (stateless for this turn) 
    // OR create a chat and send the parts. Chat supports parts.
    
    // Construct current message parts
    const currentParts: any[] = [];
    
    // Add attachments first
    for (const att of attachments) {
        currentParts.push({
            inlineData: {
                mimeType: att.mimeType,
                data: att.data
            }
        });
    }
    
    // Add text
    if (message) {
        currentParts.push({ text: message });
    }

    const chatSession = ai.chats.create({
        model,
        config,
        history: sdkHistory
    });

    const result = await chatSession.sendMessage({ message: currentParts });
    const text = result.text || "I'm having trouble planning right now. Please try again.";
    
    // Extract grounding links (Maps & Search)
    const groundingLinks: string[] = [];
    
    // Search grounding
    result.candidates?.[0]?.groundingMetadata?.groundingChunks?.forEach((chunk: any) => {
      if (chunk.web?.uri) groundingLinks.push(chunk.web.uri);
    });
    
    // Maps grounding (as per docs)
    // The chunks for maps might also be in groundingChunks. 
    // We'll iterate and check for maps URIs if available in the structure.

    // Attempt to extract JSON cost data from the response text
    let costData: CostItem[] | undefined;
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
        try {
            costData = JSON.parse(jsonMatch[1]);
        } catch (e) {
            console.warn("Failed to parse cost JSON", e);
        }
    }

    return { text, groundingLinks, costData };
  } catch (error) {
    console.error("Chat error:", error);
    return { text: "Sorry, I encountered an error accessing the intelligence engine. Please check your connection.", groundingLinks: [] };
  }
};

// --- IMAGE GENERATION SERVICE ---

export const generateImage = async (
    prompt: string,
    model: ImageModel = 'gemini-2.5-flash-image',
    aspectRatio: ImageAspectRatio = '1:1',
    resolution?: ImageResolution
): Promise<string> => {
  
  // Check for key selection for Pro model
  if (model === 'gemini-3-pro-image-preview') {
      const aiStudio = (window as any).aistudio;
      if (aiStudio) {
        const hasKey = await aiStudio.hasSelectedApiKey();
        if (!hasKey) {
            await aiStudio.openSelectKey();
        }
      }
  }

  // Re-init client (ensures key is picked up from env if set by polyfill)
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
  const config: any = {
      imageConfig: {
          aspectRatio: aspectRatio
      }
  };

  // Only add imageSize for Pro model
  if (model === 'gemini-3-pro-image-preview' && resolution) {
      config.imageConfig.imageSize = resolution;
  }
  
  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [{ text: prompt }],
    },
    config
  });

  // Extract the image from the response
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  
  throw new Error("No image generated.");
};

// --- IMAGE EDITING SERVICE ---

export const editImage = async (imageFile: File, prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
  // Convert File to Base64
  const base64Data = await fileToGenerativePart(imageFile);

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: imageFile.type,
            data: base64Data,
          },
        },
        { text: prompt },
      ],
    },
  });

  // Extract the image from the response
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  
  throw new Error("No image generated.");
};

// --- VEO VIDEO GENERATION SERVICE ---

export const generateVeoVideo = async (
    prompt: string, 
    imageFile?: File,
    aspectRatio: '16:9' | '9:16' = '16:9'
  ): Promise<string> => {
  
  // Check for key selection for Veo (Mandatory)
  const aiStudio = (window as any).aistudio;
  if (aiStudio) {
    const hasKey = await aiStudio.hasSelectedApiKey();
    if (!hasKey) {
        await aiStudio.openSelectKey();
        // The operation might fail if the key isn't immediately available, user might need to retry.
        // But we proceed in case it worked.
    }
  }

  // Re-init client to ensure we have the latest key
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
  let operation;
  
  const config = {
    numberOfVideos: 1,
    resolution: '1080p',
    aspectRatio: aspectRatio
  };

  if (imageFile) {
      const base64Data = await fileToGenerativePart(imageFile);
      operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt || "Animate this travel memory",
        image: {
            imageBytes: base64Data,
            mimeType: imageFile.type,
        },
        config,
      });
  } else {
      operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config,
      });
  }

  // Polling for completion
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
    operation = await ai.operations.getVideosOperation({ operation });
  }

  const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!uri) throw new Error("Video generation failed.");
  
  // Fetch the actual video bytes using the key
  const videoRes = await fetch(`${uri}&key=${getApiKey()}`);
  const blob = await videoRes.blob();
  return URL.createObjectURL(blob);
};


// --- LIVE API UTILS ---

export const connectToLive = async (
    onMessage: (msg: LiveServerMessage) => void,
    onOpen: () => void,
    onClose: () => void,
    onError: (e: ErrorEvent) => void
) => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    return ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
            onopen: onOpen,
            onmessage: onMessage,
            onclose: onClose,
            onerror: onError
        },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
            },
            systemInstruction: "You are WanderAI, a conversational and enthusiastic travel assistant.when mic on first messege would be {'hey there i am you travel plan asistant just tell me which place you are planning about'} ,Your voice responses should be concise, engaging, and friendly. Avoid long monologues. Feel free to ask questions to keep the conversation flowing."
        }
    });
}

// --- HELPERS ---

export async function fileToGenerativePart(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Audio helpers for Live API
export function base64ToFloat32Array(base64: string): Float32Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Use DataView to ensure Little Endian decoding regardless of system architecture
    const view = new DataView(bytes.buffer);
    const float32 = new Float32Array(len / 2);
    
    for (let i = 0; i < len / 2; i++) {
        // Read 16-bit integer (little endian = true)
        const int16 = view.getInt16(i * 2, true);
        float32[i] = int16 / 32768.0;
    }
    
    return float32;
}

export function createPcmBlob(data: Float32Array): { data: string, mimeType: string } {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        // Clamp the values to avoid integer overflow which causes digital noise
        const s = Math.max(-1, Math.min(1, data[i]));
        int16[i] = s * 32768;
    }
    const bytes = new Uint8Array(int16.buffer);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return {
        data: btoa(binary),
        mimeType: 'audio/pcm;rate=16000'
    };
}
