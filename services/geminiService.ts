import { GoogleGenAI } from "@google/genai";
import { CameraSettings } from "../types";

// Helper to convert File/Blob to Base64 raw string (no prefix)
export const fileToRawBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
};

const constructPrompt = (settings: CameraSettings): string => {
  const isReverseView = Math.abs(settings.azimuth) > 150 && Math.abs(settings.azimuth) <= 180;
  
  let basePrompt = `You are a world-class 3D rendering engine and professional cinematographer specialized in spatial reasoning. 
Based on the provided reference image, generate a new image from the specified camera perspective.

PHYSICAL PARAMETERS:
- Azimuth: ${settings.azimuth}° (Horizontal orbit)
- Elevation: ${settings.elevation}° (Vertical pitch)
- Zoom Factor: ${settings.zoom.toFixed(2)}x (Closeness to subject)
- Field of View (FOV): ${settings.fov}° (${settings.fov < 40 ? 'Telephoto/Narrow lens' : settings.fov > 90 ? 'Wide-angle/Fisheye lens' : 'Standard lens'})

CORE DIRECTIVES:
1. SPATIAL RECONSTRUCTION: This is not just rotating the object; it is a full camera movement in 3D space. 
${isReverseView ? "2. ENVIRONMENT REVERSAL (CRITICAL): This is a 180-degree REVERSE ANGLE SHOT. You are now looking from the opposite side of the entire scene. You must plausibly render the background that was PREVIOUSLY BEHIND the original camera. If the original showed a character facing a desk, this view must show the character's back and the room BEHIND them." : "2. PERSPECTIVE FIDELITY: Maintain the spatial relationship between the subject and the environment as the camera orbits."}
3. LIGHTING CONSISTENCY: Flip the lighting direction logically. If the light source was on the left in the original, it should appear from the right in this perspective to maintain world-space consistency.
4. STYLE PRESERVATION: Maintain absolute fidelity to the original image's artistic style, medium, brushstrokes, textures, and aesthetic essence. 
5. VISUAL DNA: Keep the subject's identity, color palette, and materials 100% consistent.
6. QUALITY: Output a high-fidelity render that feels like part of the same cinematic sequence.`;

  if (settings.description && settings.description.trim()) {
    basePrompt += `\n\nSCENE CONTEXT (Prioritize this for environmental details):
"${settings.description.trim()}"`;
  }

  return basePrompt;
};

export const generateNewView = async (
  originalImageBase64: string,
  imageMimeType: string,
  settings: CameraSettings
): Promise<string> => {
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = constructPrompt(settings);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: imageMimeType,
              data: originalImageBase64
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: settings.aspectRatio as any,
          imageSize: settings.imageSize
        },
        tools: [{ googleSearch: {} }],
        temperature: 0.4, // Slightly increased to allow for better environmental hallucination
      }
    });

    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("No image data returned from Nano Banana Pro.");

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("KEY_NOT_FOUND");
    }
    throw error;
  }
};