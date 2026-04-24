import { AdjudicationResult } from './gemini';

/**
 * Pre-loaded demo audit results to showcase the system to hackathon judges
 * without requiring API calls or real medical images.
 */

export const DEMO_CASES: { name: string; description: string; result: AdjudicationResult }[] = [
  {
    name: "Chest X-Ray — Pneumonia Claim",
    description: "Standard PA chest X-ray with pneumonia findings — PASS case",
    result: {
      findings: [
        "Bilateral patchy opacities noted in lower lung zones, consistent with pneumonia",
        "Cardiothoracic ratio within normal limits — no cardiomegaly",
        "Costophrenic angles are clear — no pleural effusion",
        "No pneumothorax identified, lung periphery well-visualized",
        "Bony structures intact, no fractures noted"
      ],
      impression: "Bilateral lower lobe pneumonia consistent with the clinical diagnosis and claimed package. The radiological evidence strongly supports the claim of community-acquired pneumonia requiring hospitalization.",
      formattedHospitalReport: "RADIOLOGY REPORT\n\nPatient: [REDACTED]  |  Age: 54Y/M\nMRN: PMJAY-2024-08761\nModality: Digital Radiography (DR)\nStudy: Chest PA View\nDate: 2024-08-15\n\nCLINICAL HISTORY:\nFever x 5 days, productive cough, SpO2 89%\n\nFINDINGS:\n- Heart size normal\n- Bilateral patchy consolidation in lower zones\n- No pleural effusion\n- No pneumothorax\n\nIMPRESSION:\nBilateral lower lobe pneumonia.\nCorrelate clinically. Follow-up recommended.",
      confidence: "87% — Clear radiological evidence of bilateral pneumonia aligns with clinical documentation. Image quality is optimal for diagnostic interpretation.",
      risk_level: "Low",
      warnings: [],
      imageQuality: {
        assessment: "Optimal",
        limitations: ["Slight rotation of the patient noted but does not affect interpretation"],
        uncertaintyNotes: "Minimal uncertainty — the consolidation pattern is clear and well-defined."
      },
      reportConsistency: {
        internalConsistency: "Consistent",
        observationsMatchImpressions: true,
        conflictingDetails: [],
        justification: "The findings of bilateral lower lobe consolidation directly support the impression of pneumonia. Clinical history of fever with desaturation is consistent."
      },
      validation: {
        consistency: "PASS",
        errors: [],
        corrected_impression: ""
      },
      correlationFlags: [
        { feature: "Lower Lobe Opacities", reportClaim: "Bilateral patchy consolidation", imageEvidence: "Confirmed — bilateral opacities visible in lower zones", status: "Match", justification: "Visual evidence directly correlates with report findings" },
        { feature: "Heart Size", reportClaim: "Normal cardiac silhouette", imageEvidence: "CTR appears within normal limits", status: "Match", justification: "No cardiomegaly detected on visual analysis" },
        { feature: "Pleural Space", reportClaim: "No effusion", imageEvidence: "Costophrenic angles sharp bilaterally", status: "Match", justification: "Clear costophrenic angles confirm absence of effusion" }
      ],
      adjudicationNotes: {
        timelineCheck: "Image timestamp aligns with admission date — consistent timeline",
        packageAlignment: "Pneumonia / Lower Respiratory package — findings fully support the claimed diagnosis",
        reviewerAction: "APPROVE — Low Risk Case",
        nextSteps: "Standard processing recommended. No discrepancies detected between imaging and clinical documentation.",
        stgCompliance: "Meets STG criteria for inpatient pneumonia management — SpO2 <90%, bilateral involvement"
      },
      timelineAssessment: {
        stage: "Pre-Procedure",
        timingAlignment: "Aligned",
        flaggedIssues: []
      },
      trustFramework: {
        methodology: "Multi-modal cross-referencing of DICOM metadata, clinical notes, and visual features using ensemble radiological AI with 94.2% sensitivity on CheXpert benchmark",
        radiologicalStandard: "ACR Appropriateness Criteria — Chest Imaging"
      },
      targetCondition: "Community-Acquired Pneumonia",
      visual_highlights: [
        { label: "LLL Consolidation", ymin: 450, xmin: 180, ymax: 700, xmax: 420, confidence: 0.91 },
        { label: "RLL Opacity", ymin: 430, xmin: 580, ymax: 680, xmax: 820, confidence: 0.87 }
      ]
    }
  },
  {
    name: "PTCA Angiogram — Fraud Alert",
    description: "Coronary angiogram with mismatched findings — CRITICAL FAIL",
    result: {
      findings: [
        "Coronary angiogram showing mild stenosis in LAD (~30-40% narrowing)",
        "Right coronary artery appears patent with no significant obstruction",
        "Left circumflex artery shows minor wall irregularities without hemodynamic significance",
        "No evidence of acute thrombotic occlusion",
        "Catheter trajectory and contrast opacification appear technically adequate"
      ],
      impression: "Mild coronary artery disease with non-significant stenosis. The angiographic findings do NOT support the claim of critical LAD stenosis requiring emergent PTCA intervention. This represents a major discrepancy between imaging evidence and the claimed procedure.",
      formattedHospitalReport: "CARDIAC CATHETERIZATION REPORT\n\nPatient: [REDACTED]  |  Age: 62Y/M\nMRN: PMJAY-2024-15432\nModality: Digital Subtraction Angiography\nStudy: Coronary Angiogram\n\nCLINICAL HISTORY:\nAcute chest pain, ECG changes suggestive of STEMI\n\nFINDINGS:\n- Critical LAD stenosis (>90%) [CLAIMED]\n- RCA: Total occlusion with TIMI 0 flow [CLAIMED]\n- LCx: 70% stenosis [CLAIMED]\n\nPROCEDURE:\nPTCA + DES x2 to LAD and RCA\n\nIMPRESSION:\nTriple vessel disease. Emergency PTCA performed successfully.",
      confidence: "92% — High confidence in the assessment. The angiographic images clearly show mild disease, contradicting the report's claim of critical multi-vessel stenosis. Possible upcoding of severity detected.",
      risk_level: "Critical",
      warnings: [
        "CRITICAL: Report claims >90% LAD stenosis but image shows only 30-40% narrowing",
        "RCA claimed as totally occluded but appears patent on imaging",
        "Procedure claims 2 DES stents deployed — not supported by imaging evidence",
        "Potential upcoding: Mild CAD claimed as triple vessel disease",
        "Recommend forensic audit and cross-check with inventory records for stent serial numbers"
      ],
      imageQuality: {
        assessment: "Optimal",
        limitations: ["Standard angiographic quality — adequate for interpretation"],
        uncertaintyNotes: "Low uncertainty for proximal vessel assessment. Distal vessels have standard visualization limitations."
      },
      reportConsistency: {
        internalConsistency: "Inconsistent",
        observationsMatchImpressions: false,
        conflictingDetails: [
          "Report claims >90% LAD stenosis — imaging shows ~30-40%",
          "RCA described as totally occluded — imaging shows patent vessel",
          "Triple vessel disease claimed — imaging shows single vessel mild disease"
        ],
        justification: "Severe internal and image-to-report inconsistency. The visual evidence fundamentally contradicts every major finding claimed in the hospital report. This pattern is consistent with deliberate upcoding."
      },
      validation: {
        consistency: "FAIL",
        errors: [
          "LAD stenosis severity grossly overstated (30-40% actual vs >90% claimed)",
          "RCA patency contradicts reported total occlusion",
          "No evidence supporting deployment of 2 DES stents",
          "Clinical indication (STEMI) inconsistent with angiographic findings"
        ],
        corrected_impression: "Mild single-vessel coronary artery disease with non-hemodynamically significant LAD stenosis (~30-40%). No indications for emergent PTCA. Conservative management with medical therapy would be appropriate."
      },
      correlationFlags: [
        { feature: "LAD Stenosis", reportClaim: ">90% critical stenosis", imageEvidence: "30-40% mild stenosis visible", status: "Conflict", justification: "Gross overestimation of stenosis severity — major red flag" },
        { feature: "RCA Status", reportClaim: "Total occlusion, TIMI 0", imageEvidence: "Patent vessel with normal flow", status: "Conflict", justification: "No occlusion visible — flow appears normal" },
        { feature: "LCx Stenosis", reportClaim: "70% stenosis", imageEvidence: "Minor wall irregularities only", status: "Conflict", justification: "No hemodynamically significant lesion detected" },
        { feature: "Stent Deployment", reportClaim: "2 DES stents placed", imageEvidence: "No stent markers visible on imaging", status: "Conflict", justification: "Expected metallic stent markers not identified" }
      ],
      adjudicationNotes: {
        timelineCheck: "Timeline appears manipulated — pre-cath ECG does not correlate with claimed STEMI presentation",
        packageAlignment: "PTCA package claimed for ₹1,70,000 — findings suggest the procedure was unnecessary based on imaging",
        reviewerAction: "REJECT + FLAG FOR FORENSIC INVESTIGATION",
        nextSteps: "1) Immediately freeze payment. 2) Request stent serial numbers and cross-check with manufacturer. 3) Initiate forensic audit of this facility. 4) Check for similar patterns across other claims from this provider.",
        stgCompliance: "VIOLATES STG — PTCA is indicated for >70% stenosis or hemodynamically significant lesions. The imaging shows only mild disease that does not meet intervention criteria."
      },
      timelineAssessment: {
        stage: "Intra-Procedure",
        timingAlignment: "Mismatched",
        flaggedIssues: [
          "Pre-cath ECG findings inconsistent with STEMI diagnosis",
          "Troponin timeline does not support acute coronary syndrome",
          "Discharge summary prepared before procedure completion timestamp"
        ]
      },
      trustFramework: {
        methodology: "Quantitative coronary analysis (QCA) benchmarks applied to angiographic imaging with automated vessel diameter measurement. Cross-referenced with published PTCA appropriateness use criteria (AUC).",
        radiologicalStandard: "ACC/AHA/SCAI PCI Appropriateness Guidelines 2023"
      },
      targetCondition: "Coronary Artery Disease — Claimed PTCA",
      visual_highlights: [
        { label: "LAD ~35% (NOT >90%)", ymin: 200, xmin: 350, ymax: 450, xmax: 550, confidence: 0.94 },
        { label: "RCA PATENT", ymin: 300, xmin: 550, ymax: 600, xmax: 750, confidence: 0.92 }
      ]
    }
  },
  {
    name: "Kidney USG — Partial Match",
    description: "Renal ultrasound for PCNL — partial discrepancies found",
    result: {
      findings: [
        "Right kidney measures 11.2 x 5.1 cm with normal cortical echogenicity",
        "Single echogenic focus measuring ~12mm in the right renal pelvis with posterior acoustic shadowing — consistent with calculus",
        "Mild right-sided hydronephrosis (Grade I-II) noted",
        "Left kidney appears normal with no calculi or hydronephrosis",
        "No perinephric fluid collection identified"
      ],
      impression: "Single right renal pelvic calculus (~12mm) with mild hydronephrosis. While a calculus is confirmed, the report overstates the size and number of stones, and claims bilateral involvement not supported by imaging.",
      formattedHospitalReport: "ULTRASONOGRAPHY REPORT — KUB\n\nPatient: [REDACTED]  |  Age: 45Y/F\nMRN: PMJAY-2024-22190\nModality: High-Resolution USG\n\nFINDINGS:\n- Right kidney: Multiple calculi (largest 22mm) with moderate hydronephrosis\n- Left kidney: 8mm calculus in lower pole\n- Bilateral ureteric calculi suspected\n\nIMPRESSION:\nBilateral renal calculi with moderate hydronephrosis.\nPCNL recommended for right kidney. URS for left side.",
      confidence: "78% — Moderate confidence. The primary finding (right renal calculus) is confirmed but the size is overstated. Claimed bilateral disease is not supported by imaging.",
      risk_level: "High",
      warnings: [
        "Stone size claimed as 22mm but appears ~12mm on imaging",
        "Report claims bilateral calculi — left kidney appears clear on USG",
        "Hydronephrosis overstated: Grade I-II observed vs 'moderate' claimed",
        "Bilateral procedure may not be necessary based on imaging"
      ],
      imageQuality: {
        assessment: "Sub-optimal",
        limitations: ["Bowel gas partially obscuring lower pole of right kidney", "Patient body habitus affecting resolution"],
        uncertaintyNotes: "Some uncertainty in exact stone measurement due to partial shadowing. Lower pole assessment limited by bowel gas."
      },
      reportConsistency: {
        internalConsistency: "Inconsistent",
        observationsMatchImpressions: false,
        conflictingDetails: [
          "Report claims multiple right-sided calculi — imaging shows single calculus",
          "Stone size significantly overstated (22mm claimed vs ~12mm measured)",
          "Left kidney calculus not visualized on imaging",
          "Hydronephrosis grade overestimated"
        ],
        justification: "The core finding of right renal calculus is confirmed but with significant size discrepancy. The claim of bilateral disease appears unsupported by imaging evidence. This may represent partial upcoding."
      },
      validation: {
        consistency: "FAIL",
        errors: [
          "Stone dimension mismatch: ~12mm actual vs 22mm reported",
          "Left kidney calculus not confirmed on imaging",
          "Bilateral PCNL/URS may not be indicated based on imaging"
        ],
        corrected_impression: "Single right renal pelvic calculus (~12mm) with mild (Grade I-II) hydronephrosis. Left kidney normal. PCNL may be considered for the right side based on clinical symptoms, but bilateral intervention is not supported."
      },
      correlationFlags: [
        { feature: "Right Calculus", reportClaim: "Multiple calculi, largest 22mm", imageEvidence: "Single ~12mm calculus visualized", status: "Partial Match", justification: "Calculus confirmed but size and multiplicity overstated" },
        { feature: "Left Calculus", reportClaim: "8mm lower pole calculus", imageEvidence: "No calculus identified in left kidney", status: "Conflict", justification: "Left kidney appears normal on imaging" },
        { feature: "Hydronephrosis", reportClaim: "Moderate bilateral", imageEvidence: "Mild right-sided only", status: "Partial Match", justification: "Right hydronephrosis present but severity and laterality overstated" }
      ],
      adjudicationNotes: {
        timelineCheck: "Imaging performed on admission day — timeline is appropriate",
        packageAlignment: "PCNL package claimed — right side may be appropriate, but bilateral claim is unsupported",
        reviewerAction: "PARTIAL REJECT — Approve right-sided PCNL, reject left-sided URS claim",
        nextSteps: "Request a CT KUB for definitive stone assessment if there is clinical suspicion of left-sided disease. Adjust package billing to single-sided procedure.",
        stgCompliance: "PCNL is indicated for stones >10mm with obstruction — right side meets criteria. Left side does not meet intervention threshold based on available imaging."
      },
      timelineAssessment: {
        stage: "Pre-Procedure",
        timingAlignment: "Aligned",
        flaggedIssues: [
          "Bilateral claim requires confirmatory CT KUB",
          "Consider if USG alone is sufficient for surgical planning"
        ]
      },
      trustFramework: {
        methodology: "Morphometric analysis of renal ultrasound with automated caliper measurement comparison. Cross-referenced with AUA/EAU guidelines for stone management intervention thresholds.",
        radiologicalStandard: "AUA Surgical Management of Stones Guidelines 2022"
      },
      targetCondition: "Renal Calculi — Claimed PCNL",
      visual_highlights: [
        { label: "R Calculus ~12mm", ymin: 300, xmin: 250, ymax: 500, xmax: 450, confidence: 0.85 },
        { label: "Mild Hydronephrosis", ymin: 200, xmin: 200, ymax: 400, xmax: 500, confidence: 0.72 }
      ]
    }
  }
];

/**
 * Generate a synthetic demo image placeholder as a data URL.
 * Used when demo mode is activated so judges don't need real files.
 */
export function generateDemoImage(caseIndex: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  
  // Dark medical background
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, 512, 512);
  
  const colors = ['#1a3a5c', '#1a4a3c', '#3a1a4c'];
  const labels = ['CHEST PA', 'CORONARY ANGIOGRAM', 'RENAL USG'];
  const icons = ['🫁', '❤️', '🔬'];
  
  const color = colors[caseIndex % colors.length];
  const label = labels[caseIndex % labels.length];
  const icon = icons[caseIndex % icons.length];
  
  // Gradient background
  const gradient = ctx.createRadialGradient(256, 256, 50, 256, 256, 300);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, '#020617');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);
  
  // Grid overlay
  ctx.strokeStyle = 'rgba(14, 165, 233, 0.08)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 512; i += 20) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }
  
  // Central shape patterns to simulate medical imaging
  ctx.globalAlpha = 0.3;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.ellipse(
      256 + (Math.random() - 0.5) * 100,
      256 + (Math.random() - 0.5) * 100,
      80 + Math.random() * 60,
      60 + Math.random() * 40,
      Math.random() * Math.PI,
      0, 2 * Math.PI
    );
    ctx.fillStyle = `rgba(200, 200, 200, ${0.1 + Math.random() * 0.15})`;
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  
  // Label
  ctx.font = 'bold 14px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(14, 165, 233, 0.6)';
  ctx.textAlign = 'center';
  ctx.fillText(`DEMO — ${label}`, 256, 30);
  
  // Icon
  ctx.font = '64px serif';
  ctx.fillText(icon, 256, 280);
  
  // VantageXR watermark
  ctx.font = 'bold 10px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.fillText('VANTAGEXR_DEMO_ARTIFACT', 256, 490);
  
  return canvas.toDataURL('image/png');
}
