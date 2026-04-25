import { GoogleGenAI, Type } from "@google/genai";

// Initialize with environment variable or localStorage
const getInitialKey = () => {
  return import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem("VANTAGEXR_API_KEY") || "";
};

let ai = new GoogleGenAI({ apiKey: getInitialKey() });

export const setGeminiApiKey = (key: string) => {
  localStorage.setItem("VANTAGEXR_API_KEY", key);
  ai = new GoogleGenAI({ apiKey: key });
};

export const hasValidKey = () => {
  const key = getInitialKey();
  return key && key.length > 10; // Basic check
};

export interface AdjudicationResult {
  findings: string[];
  impression: string;
  formattedHospitalReport: string;
  confidence: string;
  risk_level: "Low" | "Medium" | "High" | "Critical";
  warnings: string[];
  imageQuality: {
    assessment: "Optimal" | "Sub-optimal" | "Poor";
    limitations: string[];
    uncertaintyNotes: string;
  };
  reportConsistency: {
    internalConsistency: "Consistent" | "Inconsistent";
    observationsMatchImpressions: boolean;
    conflictingDetails: string[];
    justification: string;
  };
  validation: {
    consistency: "PASS" | "FAIL";
    errors: string[];
    corrected_impression: string;
  };
  correlationFlags: {
    feature: string;
    reportClaim: string;
    imageEvidence: string;
    status: "Match" | "Conflict" | "Partial Match";
    justification: string;
  }[];
  adjudicationNotes: {
    timelineCheck: string;
    packageAlignment: string;
    reviewerAction: string;
    nextSteps: string;
    stgCompliance: string;
  };
  timelineAssessment: {
    stage: "Pre-Procedure" | "Intra-Procedure" | "Post-Procedure" | "Unclear";
    timingAlignment: "Aligned" | "Mismatched" | "Too Old" | "Unrelated";
    flaggedIssues: string[];
  };
  trustFramework: {
    methodology: string;
    radiologicalStandard: string;
  };
  targetCondition: string;
  visual_highlights: {
    label: string;
    ymin: number;
    xmin: number;
    ymax: number;
    xmax: number;
    confidence: number;
  }[];
}

const SYSTEM_INSTRUCTION = `You are "VantageXR", an advanced radiological claim auditor for the AB PMJAY scheme. Your goal is to provide objective, image-based insights to assist reviewers (PPDs/CPDs) in spotting inconsistencies between medical images and clinical reports.

CORE AUDIT PRINCIPLES:
1. ACTUAL IMAGE INTERPRETATION: Accurately detect and describe key visual features across modalities (X-ray, USG, MRI, CT). Use specific radiology nomenclature (e.g., "contrast cutoff", "opacities", "echogenic foci").
2. UNCERTAINTY & QUALITY: Differentiate between "not seen" and "not assessable" due to image quality (poor exposure, artifacts). Explicitly acknowledge uncertainty.
3. INTERNAL REPORT CONSISTENCY: Validate if the hospital report's own observations (Findings) align with its interpretation (Impression). Flag internal contradictions.
4. IMAGE-TO-REPORT CORRELATION: Compare visual evidence against report claims. Classify as "Match", "Conflict", or "Partial Match".
5. TIMELINE & STAGE AWARENESS: Identify if the image is Pre/Intra/Post procedure. Check if timing aligns with the episode timeline and STGs (Standard Treatment Guidelines). Flag reuse or unrelated images.

EXPECTED OUTPUT FORMAT (JSON):
- findings: Array of visual features detected in the image itself.
- impression: Your objective conclusion based ONLY on the image evidence.
- formattedHospitalReport: A clean, structured version of the input report.
- confidence: "XX%" + technical justification considering clarity, visibility, and consistency.
- risk_level: "Low", "Medium", "High", or "Critical" based on clinical impact.
- imageQuality: Assessment of the scan quality and specific limitations.
- reportConsistency: Evaluation of the provided written report's internal logic.
- validation: High-level audit status (PASS/FAIL).
- correlationFlags: List of specific features compared between image and report.
- adjudicationNotes: Focus on "stgCompliance" and specific "packageAlignment" (e.g., for packages like PTCA, COPD, Cholecystectomy, PCNL).
- timelineAssessment: Determine stage and alignment with expected procedure timelines.
- visual_highlights: Bounding boxes for key findings [0-1000].

ADJUDICATION CONTEXT:
The solution is ASSISTIVE. Do not decide medical necessity, but provide the technical evidence so humans can. Be honest about unclear images. Use a "Review Note" style that is actionable for PPDs.`;

export async function adjudicate(
  imageFile: File, 
  reportInput: string | File, 
  claimedPackage?: string, 
  timelineContext?: string
): Promise<AdjudicationResult> {
  const parts: any[] = [];
  try {
  
  const scanBase64 = await fileToBase64(imageFile);
  const [scanMime, scanData] = scanBase64.split(';base64,');
  parts.push({
    inlineData: {
      mimeType: scanMime.split(':')[1],
      data: scanData,
    }
  });

  let contextPrompt = "Analyze the provided radiological evidence.";
  if (claimedPackage) contextPrompt += `\nClaimed Package: ${claimedPackage}`;
  if (timelineContext) contextPrompt += `\nEpisode Timeline Context: ${timelineContext}`;

  if (typeof reportInput === 'string') {
    parts.push({ text: `${contextPrompt}\n\nAct as a medical validation engine against this report:\n\n${reportInput}` });
  } else {
    const reportBase64 = await fileToBase64(reportInput);
    const [reportMime, reportData] = reportBase64.split(';base64,');
    parts.push({ text: `${contextPrompt}\n\nAnalyze the provided radiological scan and act as a medical validation engine against this report artifact.` });
    parts.push({
      inlineData: {
        mimeType: reportMime.split(':')[1],
        data: reportData,
      }
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [{ parts }],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        required: ["findings", "impression", "formattedHospitalReport", "confidence", "risk_level", "imageQuality", "reportConsistency", "validation", "correlationFlags", "adjudicationNotes", "timelineAssessment", "trustFramework", "targetCondition"],
        properties: {
          findings: { type: Type.ARRAY, items: { type: Type.STRING } },
          impression: { type: Type.STRING },
          formattedHospitalReport: { type: Type.STRING },
          confidence: { type: Type.STRING },
          risk_level: { type: Type.STRING, enum: ["Low", "Medium", "High", "Critical"] },
          warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
          imageQuality: {
            type: Type.OBJECT,
            required: ["assessment", "limitations", "uncertaintyNotes"],
            properties: {
              assessment: { type: Type.STRING, enum: ["Optimal", "Sub-optimal", "Poor"] },
              limitations: { type: Type.ARRAY, items: { type: Type.STRING } },
              uncertaintyNotes: { type: Type.STRING },
            },
          },
          reportConsistency: {
            type: Type.OBJECT,
            required: ["internalConsistency", "observationsMatchImpressions", "conflictingDetails", "justification"],
            properties: {
              internalConsistency: { type: Type.STRING, enum: ["Consistent", "Inconsistent"] },
              observationsMatchImpressions: { type: Type.BOOLEAN },
              conflictingDetails: { type: Type.ARRAY, items: { type: Type.STRING } },
              justification: { type: Type.STRING },
            },
          },
          validation: {
            type: Type.OBJECT,
            required: ["consistency", "errors", "corrected_impression"],
            properties: {
              consistency: { type: Type.STRING, enum: ["PASS", "FAIL"] },
              errors: { type: Type.ARRAY, items: { type: Type.STRING } },
              corrected_impression: { type: Type.STRING },
            },
          },
          correlationFlags: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              required: ["feature", "reportClaim", "imageEvidence", "status", "justification"],
              properties: {
                feature: { type: Type.STRING },
                reportClaim: { type: Type.STRING },
                imageEvidence: { type: Type.STRING },
                status: { type: Type.STRING, enum: ["Match", "Conflict", "Partial Match"] },
                justification: { type: Type.STRING },
              },
            },
          },
          adjudicationNotes: {
            type: Type.OBJECT,
            required: ["timelineCheck", "packageAlignment", "reviewerAction", "nextSteps", "stgCompliance"],
            properties: {
              timelineCheck: { type: Type.STRING },
              packageAlignment: { type: Type.STRING },
              reviewerAction: { type: Type.STRING },
              nextSteps: { type: Type.STRING },
              stgCompliance: { type: Type.STRING },
            },
          },
          timelineAssessment: {
            type: Type.OBJECT,
            required: ["stage", "timingAlignment", "flaggedIssues"],
            properties: {
              stage: { type: Type.STRING, enum: ["Pre-Procedure", "Intra-Procedure", "Post-Procedure", "Unclear"] },
              timingAlignment: { type: Type.STRING, enum: ["Aligned", "Mismatched", "Too Old", "Unrelated"] },
              flaggedIssues: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
          },
          trustFramework: {
            type: Type.OBJECT,
            required: ["methodology", "radiologicalStandard"],
            properties: {
              methodology: { type: Type.STRING },
              radiologicalStandard: { type: Type.STRING },
            },
          },
          targetCondition: { type: Type.STRING },
          visual_highlights: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              required: ["label", "ymin", "xmin", "ymax", "xmax", "confidence"],
              properties: {
                label: { type: Type.STRING },
                ymin: { type: Type.NUMBER },
                xmin: { type: Type.NUMBER },
                ymax: { type: Type.NUMBER },
                xmax: { type: Type.NUMBER },
                confidence: { type: Type.NUMBER },
              },
            },
          },
        },
      },
    },
  });

    return JSON.parse(response.text || "{}");
  } catch (error: any) {
    // Fallback to flash if pro fails (e.g. 404, 500, or heavy load)
    if (error.status === 404 || error.message?.includes("404") || error.status === 500) {
      console.warn("Pro model failed, attempting fallback with Flash engine...");
      try {
        const fallbackResponse = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [{ parts }],
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            // We use the same schema to ensure consistency
          }
        });
        return JSON.parse(fallbackResponse.text || "{}");
      } catch (fallbackError) {
        console.error("Flash fallback also failed:", fallbackError);
      }
    }
    
    console.error("Adjudication engine failure:", error);
    if (error.message?.includes("429") || error.status === 429 || error.message?.includes("quota")) {
      throw new Error("RAD-AI API Quota Exhausted: The medical adjudication engine has reached its limit. Please wait a minute before retrying or check your Gemini API billing.");
    }
    throw error;
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}
