import React, { useState, useRef } from "react";
import {
  FileSearch,
  Upload,
  CheckCircle2,
  AlertCircle,
  RefreshCcw,
  ClipboardCheck,
  LayoutDashboard,
  ShieldCheck,
  FileText,
  Image as ImageIcon,
  Clock,
  AlertTriangle,
  Package,
  Activity,
  Printer,
  FileUp,
  Download,
  Share2,
  Trash2,
  Scan,
  Database,
  Stethoscope,
  Flame,
  BarChart,
  Play,
  BarChart3,
  Sparkles,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { adjudicate, AdjudicationResult } from "./services/gemini";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { VolumeViewer } from "./components/VolumeViewer";
import { AnalyticsDashboard } from "./components/AnalyticsDashboard";
import { DEMO_CASES, generateDemoImage } from "./services/demo";

export default function App() {
  const [report, setReport] = useState("");
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [reportPreview, setReportPreview] = useState<string | null>(null);
  const [reportInputType, setReportInputType] = useState<"text" | "file">(
    "text",
  );
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [claimedPackage, setClaimedPackage] = useState("");
  const [timelineContext, setTimelineContext] = useState("");
  const [result, setResult] = useState<AdjudicationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<AdjudicationResult[]>(() => {
    try {
      const saved = localStorage.getItem("vantagexr_audit_history");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [viewingHistory, setViewingHistory] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const reportFileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const saveToHistory = (newResult: AdjudicationResult) => {
    const updatedHistory = [newResult, ...history].slice(0, 20); // Keep last 20
    setHistory(updatedHistory);
    localStorage.setItem("vantagexr_audit_history", JSON.stringify(updatedHistory));
  };

  const handleProcess = async () => {
    const hasReport =
      reportInputType === "text" ? report.trim() !== "" : reportFile !== null;
    if (!image || !hasReport) {
      setError(
        "Analysis cannot proceed without both a radiological artifact and a clinical reference.",
      );
      return;
    }

    setIsProcessing(true);
    setViewingHistory(false);
    setError(null);
    try {
      const adjudicationResult = await adjudicate(
        image,
        reportInputType === "text" ? report : reportFile!,
        claimedPackage,
        timelineContext,
      );
      setResult(adjudicationResult);
      saveToHistory(adjudicationResult);
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message || "Internal system error during multimodal processing.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!resultRef.current || isDownloadingPDF) return;

    setIsDownloadingPDF(true);
    try {
      // Small delay to ensure any layout shifts or animations finish
      await new Promise((resolve) => setTimeout(resolve, 500));

      const element = resultRef.current;

      // Capture with advanced options for full-page rendering
      const canvas = await html2canvas(element, {
        scale: 2, // High resolution
        useCORS: true,
        backgroundColor: "#f8fafc",
        windowWidth: 1400, // Fixed width for consistent layout
        height: element.scrollHeight, // Force full height of the scrollable content
        y: 0,
        onclone: (clonedDoc) => {
          // Find the container in the clone and force it to show all content
          const clonedElement = clonedDoc.getElementById(
            "audit-result-container",
          );
          if (clonedElement) {
            clonedElement.style.overflow = "visible";
            clonedElement.style.height = "auto";
            clonedElement.style.maxHeight = "none";
          }

          // FIX: html2canvas does not support oklch() colors (Tailwind v4 default)
          // We must replace these with standard RGB/Hex fallbacks in the clone
          const allElements = clonedDoc.getElementsByTagName("*");
          for (let i = 0; i < allElements.length; i++) {
            const el = allElements[i] as HTMLElement;
            const computedStyle = window.getComputedStyle(el);

            // Check major color properties
            [
              "backgroundColor",
              "color",
              "borderColor",
              "fill",
              "stroke",
            ].forEach((prop) => {
              const val = (computedStyle as any)[prop];
              if (val && val.includes("oklch")) {
                // Simple mapping for medical brand colors or fallback to black/white
                if (prop === "backgroundColor")
                  el.style.backgroundColor = "#ffffff";
                else if (prop === "color") el.style.color = "#0f172a";
                else (el.style as any)[prop] = "#cbd5e1";
              }
            });
          }

          // Force a specific style block to override dynamic variables
          const style = clonedDoc.createElement("style");
          style.innerHTML = `
            * { 
              color-scheme: light !important; 
              -webkit-print-color-adjust: exact !important;
            }
            .card { background-color: #ffffff !important; border-color: #e2e8f0 !important; }
            .bg-slate-900 { background-color: #0f172a !important; }
            .bg-sky-500 { background-color: #0ea5e9 !important; }
            .text-sky-400 { color: #38bdf8 !important; }
            .text-slate-900 { color: #0f172a !important; }
          `;
          clonedDoc.head.appendChild(style);
        },
      });

      const imgData = canvas.toDataURL("image/png", 1.0);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(
        `VantageXR_Technical_Audit_${new Date().toISOString().split("T")[0]}.pdf`,
      );
    } catch (err) {
      console.error("Critical: PDF generation failure:", err);
      setError(
        "Medical Audit PDF generation failed. Please try again or use browser print (Ctrl+P).",
      );
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleReportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReportFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setReportPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const reset = () => {
    setImage(null);
    setImagePreview(null);
    setReport("");
    setReportFile(null);
    setReportPreview(null);
    setResult(null);
    setViewingHistory(false);
    setError(null);
    setIsDemoRunning(false);
    setDemoStep(0);
  };

  const handleDemoMode = async () => {
    setIsDemoRunning(true);
    setError(null);
    setViewingHistory(false);

    const updatedHistory: AdjudicationResult[] = [...history];

    for (let i = 0; i < DEMO_CASES.length; i++) {
      setDemoStep(i + 1);
      setIsProcessing(true);

      // Generate a synthetic image preview
      const demoImageUrl = generateDemoImage(i);
      setImagePreview(demoImageUrl);

      // Simulate processing delay for dramatic effect
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const demoResult = DEMO_CASES[i].result;
      setResult(demoResult);
      updatedHistory.unshift(demoResult);
      setIsProcessing(false);

      // Brief pause to show result before next case (if not last)
      if (i < DEMO_CASES.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    // Save all demo results to history
    const finalHistory = updatedHistory.slice(0, 20);
    setHistory(finalHistory);
    localStorage.setItem("vantagexr_audit_history", JSON.stringify(finalHistory));
    setIsDemoRunning(false);
  };

  return (
    <div className="h-screen flex flex-col bg-medical-bg overflow-hidden font-sans select-none">
      {/* VantageXR Precision Navigation Bar */}
      <nav
        id="nav-bar"
        className="h-14 bg-medical-primary text-white flex items-center justify-between px-6 shrink-0 z-50 border-b border-white/10 shadow-2xl"
      >
        <div className="flex items-center gap-5">
          <div className="bg-medical-accent p-2 rounded relative group overflow-hidden">
            <Scan className="w-6 h-6 text-white relative z-10" />
            <motion.div
              animate={{ y: [-20, 20] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="absolute inset-x-0 h-0.5 bg-white/40 z-20"
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h1 className="text-base font-black tracking-[0.3em] uppercase text-white leading-none">
                VantageXR
              </h1>
              <div className="h-4 w-px bg-white/20" />
              <span className="text-[10px] font-black text-medical-accent tracking-widest uppercase">
                Precision Auditor
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">
                System Status: Nominal
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Demo Mode Button */}
          <button
            onClick={handleDemoMode}
            disabled={isDemoRunning || isProcessing}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:from-slate-700 disabled:to-slate-700 text-white rounded text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 active:scale-95 disabled:shadow-none group"
          >
            {isDemoRunning ? (
              <>
                <Zap className="w-3.5 h-3.5 animate-pulse" />
                DEMO {demoStep}/{DEMO_CASES.length}
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 group-hover:scale-125 transition-transform" />
                LIVE DEMO
              </>
            )}
          </button>

          {/* Analytics Button */}
          <button
            onClick={() => setIsAnalyticsOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded text-[9px] font-black uppercase tracking-widest transition-all border border-white/10 hover:border-white/20 active:scale-95 group"
          >
            <BarChart3 className="w-3.5 h-3.5 text-medical-accent group-hover:scale-110 transition-transform" />
            <span className="hidden md:inline">ANALYTICS</span>
          </button>

          <div className="hidden lg:flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">
                Processing Core
              </span>
              <span className="text-[10px] font-mono text-medical-accent font-black">
                NEURAL_V4.2
              </span>
            </div>
            <div className="w-px h-8 bg-white/5" />
            <div className="flex flex-col items-end opacity-60">
              <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">
                Database Node
              </span>
              <span className="text-[10px] font-mono text-slate-400 font-bold">
                PMJAY_STG_V2
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded border border-white/5">
            <Database className="w-4 h-4 text-medical-accent" />
            <div className="w-8 h-1 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                animate={{ width: ["0%", "100%"] }}
                transition={{ duration: 10, repeat: Infinity }}
                className="h-full bg-medical-accent"
              />
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex overflow-hidden">
        {/* SIDEBAR: CONTROL CENTER */}
        <aside
          id="sidebar"
          className="w-[340px] bg-white border-r border-medical-border flex flex-col shrink-0 shadow-sm relative z-40"
        >
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-1 h-4 bg-medical-accent rounded-full" />
              <h2 className="section-label !text-slate-900">SYSTEM INPUT</h2>
            </div>
            <button
              onClick={reset}
              className="p-2 hover:bg-slate-100 rounded transition-colors text-slate-400 group"
            >
              <RefreshCcw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-8 custom-scrollbar">
            {/* Step 1: Scan Upload */}
            <section className="space-y-4">
              <label className="section-label">
                <span className="font-mono text-medical-accent">01.</span>{" "}
                Artifact Verification
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`group relative h-44 rounded border-2 border-dashed transition-all flex flex-col items-center justify-center p-2 cursor-pointer ${
                  image
                    ? "border-medical-accent bg-blue-50/10"
                    : "border-slate-200 hover:border-medical-accent hover:bg-slate-50"
                }`}
              >
                <div className="scanning-line top-1/4 opacity-10" />
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {imagePreview ? (
                  <div className="relative w-full h-full rounded overflow-hidden">
                    <img
                      src={imagePreview}
                      className="w-full h-full object-contain mix-blend-multiply"
                    />
                    <div className="absolute inset-0 bg-medical-accent/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                      <div className="px-4 py-2 bg-medical-primary text-white text-[9px] font-black uppercase tracking-widest shadow-2xl">
                        REPLACE_ARTIFACT
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:border-medical-accent/30 group-hover:scale-110 transition-all">
                      <Upload className="w-5 h-5 text-slate-300 group-hover:text-medical-accent" />
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] font-black text-slate-400 group-hover:text-slate-600 uppercase tracking-widest block">
                        Upload Radiological Scan
                      </span>
                      <span className="text-[8px] font-bold text-slate-300 uppercase mt-1 block">
                        DICOM / PNG / JPEG
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Step 2: Clinical Reference */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="section-label">
                  <span className="font-mono text-medical-accent">02.</span>{" "}
                  Document Matrix
                </label>
                <div className="flex bg-slate-100 p-0.5 rounded border border-slate-200">
                  <button
                    onClick={() => setReportInputType("text")}
                    className={`px-2 py-0.5 rounded-sm text-[8px] font-black transition-all uppercase tracking-tighter ${reportInputType === "text" ? "bg-white text-medical-accent shadow-sm" : "text-slate-400"}`}
                  >
                    TX_DOC
                  </button>
                  <button
                    onClick={() => setReportInputType("file")}
                    className={`px-2 py-0.5 rounded-sm text-[8px] font-black transition-all uppercase tracking-tighter ${reportInputType === "file" ? "bg-white text-medical-accent shadow-sm" : "text-slate-400"}`}
                  >
                    IMG_REF
                  </button>
                </div>
              </div>

              <div className="relative">
                {reportInputType === "text" ? (
                  <textarea
                    value={report}
                    onChange={(e) => setReport(e.target.value)}
                    placeholder="PARSE CLINICAL DOCUMENTATION..."
                    className="w-full h-48 p-4 text-[11px] bg-slate-50 border border-slate-200 rounded-none outline-none focus:border-medical-accent focus:bg-white transition-all resize-none leading-relaxed font-mono text-slate-700 placeholder:opacity-30 border-l-[3px] border-l-slate-300"
                  />
                ) : (
                  <div
                    onClick={() => reportFileInputRef.current?.click()}
                    className={`group h-48 rounded border-2 border-dashed transition-all flex flex-col items-center justify-center p-2 cursor-pointer ${
                      reportFile
                        ? "border-medical-accent bg-blue-50/10"
                        : "border-slate-200 hover:border-medical-accent hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="file"
                      ref={reportFileInputRef}
                      className="hidden"
                      accept="image/*,application/pdf"
                      onChange={handleReportFileChange}
                    />
                    {reportPreview ? (
                      <div className="relative w-full h-full rounded overflow-hidden">
                        {reportFile?.type.includes("pdf") ? (
                          <div className="flex flex-col items-center justify-center h-full bg-slate-50">
                            <FileText className="w-8 h-8 text-medical-accent/40 mb-2" />
                            <span className="text-[10px] font-mono text-slate-600 truncate px-4">
                              {reportFile.name}
                            </span>
                          </div>
                        ) : (
                          <img
                            src={reportPreview}
                            className="w-full h-full object-contain mix-blend-multiply"
                          />
                        )}
                        <div className="absolute inset-0 bg-medical-primary/60 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                          <p className="text-white text-[9px] font-black uppercase tracking-widest">
                            Update Document Reference
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:border-medical-accent/30 group-hover:scale-110 transition-all">
                          <FileUp className="w-5 h-5 text-slate-300 group-hover:text-medical-accent" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 group-hover:text-slate-600 uppercase tracking-widest">
                          Ingest File Resource
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Step 3: Package & Timeline Context */}
            <section className="space-y-5">
              <label className="section-label">
                <span className="font-mono text-medical-accent">03.</span>{" "}
                Adjudication Logic
              </label>

              <div className="space-y-4">
                <div>
                  <label className="medical-sub-label mb-2 block">
                    Protocol Package
                  </label>
                  <select
                    value={claimedPackage}
                    onChange={(e) => setClaimedPackage(e.target.value)}
                    className="w-full p-3 text-[10px] font-black bg-slate-900 text-white border-none rounded outline-none focus:ring-2 focus:ring-medical-accent/50 transition-all cursor-pointer font-mono"
                  >
                    <option value="">UNSPECIFIED_PACKAGE</option>
                    <option value="PTCA (Angioplasty)">
                      PTCA (Angioplasty)
                    </option>
                    <option value="COPD Exacerbation">COPD Exacerbation</option>
                    <option value="Cholecystectomy (Gallstones)">
                      Cholecystectomy (Gallstones)
                    </option>
                    <option value="PCNL (Kidney Stones)">
                      PCNL (Kidney Stones)
                    </option>
                    <option value="Pneumonia / Lower Respiratory">
                      Pneumonia / Lower Respiratory
                    </option>
                    <option value="Other Surgical Procedure">
                      Other Surgical Procedure
                    </option>
                  </select>
                </div>

                <div>
                  <label className="medical-sub-label mb-2 block">
                    Clinical Stage
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {["Pre-Auth", "Pre-Op", "Intra-Op", "Post-Op"].map(
                      (stage) => (
                        <button
                          key={stage}
                          onClick={() => setTimelineContext(stage)}
                          className={`py-2.5 rounded text-[9px] font-black uppercase tracking-tighter border transition-all ${
                            timelineContext === stage
                              ? "bg-medical-accent text-white border-medical-accent shadow-[0_0_15px_rgba(14,165,233,0.3)]"
                              : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          {stage}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Recent Audits History Section */}
            {history.length > 0 && (
              <section className="pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="section-label">
                    <span className="font-mono text-medical-accent">04.</span>{" "}
                    LOCAL_CACHE
                  </h3>
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                    {history.length} ENTRIES
                  </span>
                </div>
                <div className="space-y-1.5">
                  {history.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setResult(item);
                        setViewingHistory(true);
                      }}
                      className={`w-full p-3 rounded-sm border text-left transition-all group relative overflow-hidden ${
                        result === item
                          ? "border-medical-accent bg-blue-50/20"
                          : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5 relative z-10">
                        <span className="text-[10px] font-black text-slate-800 truncate pr-2 group-hover:text-medical-accent transition-colors font-mono">
                          {item.targetCondition || "VOID_CONDITION"}
                        </span>
                        <span
                          className={`text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest border ${
                            item.risk_level === "Critical"
                              ? "bg-red-50 text-red-600 border-red-100"
                              : item.risk_level === "High"
                                ? "bg-orange-50 text-orange-600 border-orange-100"
                                : "bg-emerald-50 text-emerald-600 border-emerald-100"
                          }`}
                        >
                          {item.risk_level}
                        </span>
                      </div>
                      <div className="flex items-center justify-between relative z-10">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                          REL_CONF: {item.confidence}
                        </span>
                        <span className="text-[8px] font-mono text-slate-300">
                          LOG_{idx.toString().padStart(2, "0")}
                        </span>
                      </div>
                      {result === item && (
                        <motion.div
                          layoutId="active-pill"
                          className="absolute left-0 top-0 bottom-0 w-0.5 bg-medical-accent"
                        />
                      )}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-rose-50 border border-rose-100 rounded flex items-start gap-3 shadow-lg shadow-rose-100/20"
              >
                <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                <p className="text-[10px] text-rose-800 font-black leading-tight uppercase tracking-tight">
                  {error}
                </p>
              </motion.div>
            )}

            <button
              onClick={handleProcess}
              disabled={isProcessing}
              className="w-full h-14 bg-slate-900 hover:bg-black disabled:bg-slate-100 disabled:text-slate-300 text-white font-black rounded-none text-[12px] uppercase tracking-[0.3em] shadow-2xl transition-all flex items-center justify-center gap-3 relative overflow-hidden group border-b-2 border-medical-accent"
            >
              <AnimatePresence mode="wait">
                {isProcessing ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3"
                  >
                    <RefreshCcw className="w-4 h-4 animate-spin text-sky-400" />
                    <span>Processing Neural Engine</span>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3"
                  >
                    <FileSearch className="w-4 h-4 text-sky-400 group-hover:scale-125 transition-transform" />
                    <span>Run Technical Audit</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </aside>

        {/* MAIN: WORKSPACE CANVAS */}
        <section
          id="workspace"
          className="flex-1 overflow-hidden relative bg-[#f1f5f9]"
        >
          <AnimatePresence mode="wait">
            {!result && !isProcessing ? (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center p-12 text-center"
              >
                <div className="w-20 h-20 bg-white rounded-[2rem] shadow-2xl flex items-center justify-center mb-8 border border-white relative overflow-hidden group cursor-pointer hover:scale-105 transition-transform">
                  <div className="absolute inset-0 bg-sky-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <LayoutDashboard className="w-8 h-8 text-slate-200 group-hover:text-sky-500 transition-colors relative z-10" />
                </div>
                <h3 className="text-slate-800 font-extrabold text-[12px] uppercase tracking-[0.3em] mb-3">
                  Audit Workbench Pending
                </h3>
                <p className="text-slate-400 text-[11px] max-w-[280px] leading-relaxed font-bold tracking-tight">
                  Systems ready for ingestion. Technical Adjudication report
                  will render upon evidence commit.
                </p>
                <div className="mt-8 flex gap-4">
                  <div className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase">
                      Visions Engine Idle
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase">
                      Text Logic Idle
                    </span>
                  </div>
                </div>
              </motion.div>
            ) : isProcessing ? (
              <motion.div
                key="processing-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center p-20 bg-slate-50 relative overflow-hidden"
              >
                {/* Background Grid Accent */}
                <div
                  className="absolute inset-0 opacity-[0.05] pointer-events-none"
                  style={{
                    backgroundImage:
                      "radial-gradient(#0ea5e9 1px, transparent 0)",
                    backgroundSize: "30px 30px",
                  }}
                />

                <div className="relative w-64 h-64 flex items-center justify-center [perspective:1000px]">
                  {/* Holographic Glowing Base */}
                  <div className="absolute inset-0 bg-medical-accent/10 rounded-full blur-3xl animate-pulse" />

                  {/* Outer Orbital Ring - Y Axis */}
                  <motion.div
                    animate={{ rotateY: 360 }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute w-56 h-56 border-[1px] border-medical-accent/20 rounded-full [transform-style:preserve-3d] border-dashed"
                  />

                  {/* Central Progress Ring */}
                  <div className="relative flex items-center justify-center">
                    <motion.div
                      animate={{ rotateZ: 360 }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="w-36 h-36 border-[4px] border-slate-200 border-t-medical-accent rounded-full shadow-[0_0_30px_rgba(14,165,233,0.15)] relative z-10"
                    />

                    {/* Floating Core Icon */}
                    <motion.div
                      className="absolute z-20"
                      animate={{
                        y: [-5, 5, -5],
                        scale: [1, 1.05, 1],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <div className="p-5 bg-white rounded border border-slate-100 shadow-2xl relative">
                        <Activity className="w-12 h-12 text-medical-accent" />
                        <div className="scanning-line top-1/2" />
                      </div>
                    </motion.div>
                  </div>

                  {/* Diagnostic Data Stream - Particles */}
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 bg-medical-accent rounded-full"
                      animate={{
                        rotateZ: i * 45,
                        translateY: [60, 110, 60],
                        opacity: [0.1, 0.6, 0.1],
                      }}
                      transition={{
                        duration: 2.5 + i * 0.3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      style={{ originY: "center" }}
                    />
                  ))}
                </div>

                <div className="mt-20 text-center space-y-6 relative z-10">
                  <div className="space-y-2">
                    <motion.h3
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="text-medical-primary font-black uppercase tracking-[0.6em] text-[14px]"
                    >
                      ADJUDICATION_IN_PROGRESS
                    </motion.h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Executing Clinical Cross-Reference Protocol Alpha
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-4">
                    <div className="flex gap-3 items-center">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-[0.2em] font-black">
                        Multimodal Extraction
                      </span>
                      <div className="w-16 h-[1px] bg-slate-200" />
                      <motion.span
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="text-[10px] font-black font-mono text-medical-accent"
                      >
                        RUNNING_LOG_774
                      </motion.span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="result-state"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-full flex flex-col overflow-hidden"
                ref={resultRef}
              >
                {/* DYNAMIC CASE HEADER */}
                <header className="bg-white border-b border-medical-border px-8 py-4 flex items-center justify-between shrink-0 h-20 shadow-sm z-10 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-2 h-full bg-medical-accent" />
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-medical-primary rounded flex items-center justify-center shadow-2xl group relative overflow-hidden">
                      <ShieldCheck className="w-7 h-7 text-white relative z-10" />
                      <div className="absolute inset-0 scanning-line opacity-20" />
                    </div>
                    <div>
                      <div className="flex items-center gap-4">
                        <h2 className="text-lg font-black text-medical-primary tracking-tight human-touch">
                          Clinical Audit Results
                        </h2>
                        <div className="h-4 w-[1px] bg-slate-200" />
                        {viewingHistory ? (
                          <div className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1 rounded-sm">
                            <Clock className="w-3 h-3 text-medical-accent" />
                            <span className="text-[9px] font-black uppercase tracking-widest">
                              VAULT_ARCHIVE
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 bg-blue-50 text-medical-accent px-3 py-1 rounded-sm border border-blue-100">
                            <CheckCircle2 className="w-3 h-3" />
                            <span className="text-[9px] font-black uppercase tracking-widest">
                              LIVE_ANALYSIS
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1.5 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                            ID:
                          </span>
                          <span className="text-[10px] text-medical-accent font-black tracking-tight">
                            {new Date().getTime()}
                          </span>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-slate-200" />
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                            CORE:
                          </span>
                          <span className="text-[10px] text-slate-600 font-black tracking-tight uppercase">
                            VantageXR_DeepVision_X
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleDownloadPDF}
                      disabled={isDownloadingPDF}
                      className={`flex items-center gap-2.5 px-5 py-2.5 rounded transition-all font-black text-[10px] uppercase tracking-widest border h-11 ${
                        isDownloadingPDF
                          ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                          : "bg-white hover:bg-slate-50 text-medical-primary border-medical-border active:scale-95"
                      }`}
                    >
                      {isDownloadingPDF ? (
                        <>
                          <RefreshCcw className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 text-medical-accent" />
                          Export_Audit_Doc
                        </>
                      )}
                    </button>
                    <button
                      onClick={reset}
                      className="px-6 py-2.5 bg-medical-primary text-white rounded text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl h-11 active:scale-95 border-b-2 border-medical-accent"
                    >
                      REENTRY
                    </button>
                  </div>
                </header>

                <div
                  className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-slate-50/50"
                  id="audit-result-container"
                >
                  {/* VantageXR Executive Summary & Criticality Assessment */}
                  <motion.section
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card bg-white border-medical-border border-t-[4px] border-t-medical-primary shadow-2xl relative overflow-hidden"
                  >
                    <div className="p-8">
                      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 mb-10 border-b border-slate-100 pb-8">
                        <div className="flex items-center gap-5">
                          <div className="w-1.5 h-10 bg-medical-accent rounded-full shadow-[0_0_15px_rgba(14,165,233,0.4)]" />
                          <div>
                            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">
                              EXECUTIVE_AUDIT_LOG
                            </h3>
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className="text-[12px] font-black text-medical-primary uppercase tracking-tight font-mono">
                                TARGET_ENTITY:
                              </span>
                              <span className="text-[14px] font-serif italic text-slate-900 border-b-2 border-medical-accent/30">
                                {result.targetCondition || "VOIDE_IDENT"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                          <div
                            className={`px-5 py-2.5 rounded-none text-[10px] font-black uppercase tracking-[0.1em] flex items-center gap-3 border-l-[3px] shadow-sm ${
                              result.risk_level === "Critical"
                                ? "bg-rose-50 text-rose-600 border-rose-500"
                                : result.risk_level === "High"
                                  ? "bg-orange-50 text-orange-600 border-orange-500"
                                  : result.risk_level === "Medium"
                                    ? "bg-amber-50 text-amber-600 border-amber-500"
                                    : "bg-emerald-50 text-emerald-600 border-emerald-500"
                            }`}
                          >
                            <AlertTriangle
                              className={`w-4 h-4 ${result.risk_level === "Critical" ? "animate-bounce" : ""}`}
                            />
                            SEVERITY_TIER: {(result.risk_level || "").toUpperCase()}
                          </div>

                          <div
                            className={`px-5 py-2.5 rounded-none text-[10px] font-black uppercase tracking-[0.1em] border-l-[3px] shadow-sm ${
                              result.validation.consistency === "PASS"
                                ? "bg-emerald-50 text-emerald-600 border-emerald-500"
                                : "bg-rose-50 text-rose-600 border-rose-500"
                            }`}
                          >
                            <ShieldCheck className="w-4 h-4" />
                            COMPLIANCE_PASS: {result.validation.consistency}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative z-10">
                        <div className="md:col-span-2 space-y-8">
                          <div className="space-y-4">
                            <h4 className="section-label group">
                              <Stethoscope className="w-4 h-4 text-medical-accent" />
                              Diagnostic_Deep_Vision
                            </h4>
                            <p className="text-[20px] font-serif italic text-slate-800 leading-snug tracking-tight pl-8 relative">
                              <span className="absolute left-0 top-0 text-medical-accent/20 text-6xl font-serif">
                                "
                              </span>
                              {result.impression}
                            </p>
                          </div>

                          <div className="p-6 bg-slate-900 text-white rounded-none border-r-[4px] border-medical-accent shadow-2xl">
                            <h4 className="text-[10px] font-black text-medical-accent uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
                              <ClipboardCheck className="w-4 h-4" />{" "}
                              SYSTEM_ACTION_PROTOCOL
                            </h4>
                            <p className="text-[12px] text-slate-300 font-bold leading-relaxed italic tracking-wide font-mono">
                              &gt; {result.adjudicationNotes.nextSteps}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-5">
                          <div className="bg-slate-50 p-5 rounded border border-slate-100 space-y-4">
                            <h4 className="section-label group">
                              <AlertCircle className="w-4 h-4 text-medical-accent" />
                              Clinical_Criticality_Scan
                            </h4>
                            <div className="space-y-3">
                              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                Inferred Condition Matrix:
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {[
                                  "Pneumothorax",
                                  "Effusion",
                                  "Pneumonia",
                                  "Cardiomegaly",
                                  "Fracture",
                                ].map((cond) => {
                                  const isDetected = result.findings.some((f) =>
                                    f
                                      .toLowerCase()
                                      .includes(cond.toLowerCase()),
                                  );
                                  return (
                                    <span
                                      key={cond}
                                      className={`px-2 py-1 rounded-sm text-[8px] font-black uppercase tracking-tighter border transition-all ${isDetected ? "bg-rose-50 text-rose-600 border-rose-200 shadow-[0_0_8px_rgba(239,68,68,0.1)]" : "bg-white text-slate-400 border-slate-100 opacity-60"}`}
                                    >
                                      {cond}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          <div className="bg-slate-50 p-5 rounded border border-slate-100 space-y-4">
                            <h4 className="section-label">
                              <ClipboardCheck className="w-4 h-4 text-emerald-500" />
                              Internal_Sync_Audit
                            </h4>
                            <div className="flex items-center justify-between">
                              <span
                                className={`status-badge ${result.reportConsistency.internalConsistency === "Consistent" ? "status-match" : "status-conflict"}`}
                              >
                                Logic_
                                {result.reportConsistency.internalConsistency}
                              </span>
                              {result.reportConsistency
                                .observationsMatchImpressions ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-rose-500" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-600 font-serif italic leading-relaxed">
                              {result.reportConsistency.justification}
                            </p>
                          </div>

                          {result.warnings && result.warnings.length > 0 && (
                            <div className="bg-rose-900 border border-rose-500/30 p-4 rounded-sm shadow-2xl relative overflow-hidden">
                              <div className="absolute top-0 right-0 p-2 opacity-20">
                                <Flame className="w-12 h-12 text-rose-400" />
                              </div>
                              <h5 className="text-[9px] font-black text-rose-400 uppercase mb-3 tracking-[0.2em] flex items-center gap-2">
                                <Activity className="w-3.5 h-3.5 animate-pulse" />{" "}
                                Critical Alerts
                              </h5>
                              <ul className="space-y-2 relative z-10">
                                {result.warnings.map((w, i) => (
                                  <li
                                    key={i}
                                    className="text-[11px] text-white font-black leading-tight border-l-2 border-rose-500 pl-3"
                                  >
                                    {(w || "").toUpperCase()}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Animated Data Line */}
                    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-slate-900">
                      <motion.div
                        initial={{ left: "-100%" }}
                        animate={{ left: "100%" }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="absolute top-0 w-1/3 h-full bg-gradient-to-r from-transparent via-sky-400 to-transparent"
                      />
                    </div>
                  </motion.section>

                  {/* SUMMARY SECTION: EVIDENTIARY OVERVIEW */}
                  <div className="grid grid-cols-12 gap-6">
                    {/* Visual Artifact Panel */}
                    <div className="col-span-12 lg:col-span-4 space-y-4">
                      <div className="card h-[420px] overflow-hidden flex flex-col bg-[#020617] relative">
                        <div className="p-3 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/5">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                            <span className="text-[9px] font-bold text-sky-100 uppercase tracking-[0.2em]">
                              Clinical Vision 3D Workbench
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              Spatial Ready
                            </span>
                            <span className="text-[8px] font-mono text-white/30">
                              ENGINE_R_3.1
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 relative">
                          {imagePreview && (
                            <VolumeViewer
                              imageSrc={imagePreview}
                              highlights={result.visual_highlights || []}
                            />
                          )}
                        </div>
                      </div>

                      <div className="card bg-white p-4 flex items-center justify-between">
                        <div className="space-y-1">
                          <span className="section-label">
                            Report confidence
                          </span>
                          <p className="text-[10px] text-slate-400 font-bold leading-tight">
                            Vetted against clinical ground truth.
                          </p>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-black text-slate-900 leading-none">
                            {result.confidence.split(" ")[0]}
                          </span>
                          <div className="mt-2 flex gap-1">
                            <span className="text-[8px] bg-sky-100 text-sky-700 font-black px-1.5 rounded uppercase">
                              Verified
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="card bg-slate-50 p-4 border border-slate-100 space-y-4">
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                            <Scan className="w-3 h-3 text-sky-500" />
                            Image Quality Assessment:
                          </p>
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`status-badge ${
                                result.imageQuality.assessment === "Optimal"
                                  ? "status-match"
                                  : result.imageQuality.assessment ===
                                      "Sub-optimal"
                                    ? "status-partial"
                                    : "status-conflict"
                              }`}
                            >
                              {result.imageQuality.assessment} Quality
                            </span>
                          </div>
                          <ul className="space-y-1 pl-4">
                            {result.imageQuality.limitations.map((lim, i) => (
                              <li
                                key={i}
                                className="text-[9px] text-slate-500 font-bold tracking-tight list-disc"
                              >
                                {lim}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="pt-3 border-t border-slate-200">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                            Uncertainty Handling:
                          </p>
                          <p className="text-[10px] font-bold text-slate-600 leading-relaxed italic">
                            {result.imageQuality.uncertaintyNotes}
                          </p>
                        </div>
                      </div>

                      <div className="card bg-slate-50 p-4 border border-slate-100 space-y-2">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <BarChart className="w-3 h-3 text-slate-300" />
                          Technical Justification:
                        </p>
                        <p className="text-[10px] font-bold text-slate-600 leading-relaxed italic">
                          {result.confidence}
                        </p>
                      </div>
                    </div>{" "}
                    {/* Findings & Audit Description */}
                    <div className="col-span-12 lg:col-span-8 flex flex-col gap-8">
                      <section className="card p-8 border-l-[6px] border-l-medical-accent relative overflow-hidden bg-white">
                        <div className="absolute top-[-20px] right-[-20px] opacity-[0.02]">
                          <FileSearch className="w-64 h-64" />
                        </div>
                        <h3 className="section-label mb-6">
                          <Activity className="w-4 h-4 text-medical-accent" />
                          ANATOMICAL_FIELD_LOG
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {result.findings.map((f, i) => (
                            <div
                              key={i}
                              className="p-4 bg-slate-50 border border-slate-100 flex items-start gap-4 hover:border-medical-accent/30 transition-all group"
                            >
                              <div className="w-8 h-8 rounded bg-medical-primary text-white flex items-center justify-center text-[11px] font-black shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                                {["A", "B", "C", "D", "E"][i] || "•"}
                              </div>
                              <p className="text-[12px] leading-relaxed text-slate-700 font-bold tracking-tight">
                                {f}
                              </p>
                            </div>
                          ))}
                        </div>
                      </section>

                      <section className="card p-8 border-l-[6px] border-l-slate-400 relative bg-white">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="section-label">
                            <FileText className="w-4 h-4 text-slate-400" />
                            FORMAL_RADIOLOGY_MANIFEST
                          </h3>
                          <div className="flex gap-2">
                            <span className="text-[8px] bg-slate-900 text-white font-black px-2 py-0.5 rounded-sm uppercase tracking-widest">
                              MASTER_RECORD
                            </span>
                            <span className="text-[8px] bg-emerald-50 text-emerald-600 font-black px-2 py-0.5 rounded-sm uppercase tracking-widest border border-emerald-100">
                              VERIFIED
                            </span>
                          </div>
                        </div>
                        <div className="bg-slate-900 p-8 rounded-none border-b-4 border-slate-700 shadow-2xl relative">
                          <div className="absolute top-4 right-4 opacity-10">
                            <ShieldCheck className="w-12 h-12 text-white" />
                          </div>
                          <div className="prose prose-invert max-w-none">
                            <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-slate-300 tracking-wide">
                              {result.formattedHospitalReport}
                            </pre>
                          </div>
                          <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-end">
                            <div className="space-y-1">
                              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                Clinically Attested By
                              </p>
                              <p className="text-[10px] font-black text-medical-accent uppercase font-mono">
                                RAD_CORE_EXECUTIVE_V5
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[8px] font-mono text-slate-600 uppercase">
                                Timestamp_
                                {new Date().toISOString().split("T")[0]}
                              </p>
                            </div>
                          </div>
                        </div>
                      </section>

                      <section
                        className={`card overflow-hidden border-l-[6px] bg-white ${result.validation.consistency === "PASS" ? "border-l-emerald-500" : "border-l-rose-500"}`}
                      >
                        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                          <h3 className="section-label">
                            <ShieldCheck className="w-4 h-4 text-medical-accent" />
                            CLINICAL_INTEGRITY_MATRIX
                          </h3>
                          <span
                            className={`status-badge ${result.validation.consistency === "PASS" ? "status-match" : "status-conflict"}`}
                          >
                            {result.validation.consistency === "PASS"
                              ? "VALIDATED_UNIT"
                              : "DISPARITY_FLAG"}
                          </span>
                        </div>
                        <div className="p-8 space-y-6">
                          <p className="text-[14px] text-slate-800 font-serif italic leading-relaxed tracking-tight">
                            {result.validation.consistency === "PASS"
                              ? "The evidentiary artifacts demonstrate high-level semantic alignment with clinical documentation. The case is cleared for standard reimbursement processing protocols."
                              : "Adjudication failure: A critical semantic disparity has been identified between the radiological evidence and the associated claim report. Human intervention required."}
                          </p>

                          {result.validation.errors.length > 0 && (
                            <div className="bg-rose-50 border border-rose-100 p-5 rounded shadow-inner space-y-3">
                              <h5 className="text-[9px] font-black text-rose-600 uppercase tracking-[0.2em] flex items-center gap-3">
                                <Activity className="w-4 h-4" />{" "}
                                FLAG_DISCREPANCIES:
                              </h5>
                              <ul className="space-y-2">
                                {result.validation.errors.map((err, i) => (
                                  <li
                                    key={i}
                                    className="text-[11px] text-rose-900 font-bold flex items-start gap-3"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1 shrink-0" />
                                    {err}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {result.validation.consistency === "FAIL" &&
                            result.validation.corrected_impression && (
                              <div className="bg-blue-50 border border-blue-100 p-5 rounded-none border-l-[4px] border-medical-accent">
                                <h5 className="text-[9px] font-black text-medical-accent uppercase tracking-[0.2em] flex items-center gap-3 mb-3">
                                  <ClipboardCheck className="w-4 h-4" />{" "}
                                  SYSTEM_DERIVED_IMPRESSION:
                                </h5>
                                <p className="text-[12px] text-slate-900 font-bold italic leading-relaxed font-mono">
                                  "{result.validation.corrected_impression}"
                                </p>
                              </div>
                            )}
                        </div>
                      </section>
                    </div>
                  </div>

                  {/* DATA CORRELATION MATRIX (TECHNICAL TABLE) */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card overflow-hidden shadow-2xl bg-white border-medical-border"
                  >
                    <div className="bg-medical-primary py-4 px-8 flex items-center justify-between">
                      <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                        <Database className="w-4 h-4 text-medical-accent" />
                        CORE_INVARIANT_CORRELATION_MATRIX
                      </h3>
                      <div className="flex items-center gap-4">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                          Active nodes: {result.correlationFlags.length}
                        </span>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="px-8 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                              Signal Source
                            </th>
                            <th className="px-8 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                              Attestation Value
                            </th>
                            <th className="px-8 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                              Logic Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {result.correlationFlags.map((flag, idx) => (
                            <tr
                              key={idx}
                              className="hover:bg-slate-50/50 transition-colors"
                            >
                              <td className="px-8 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-2 h-2 rounded-full bg-medical-accent" />
                                  <span className="text-[12px] font-black text-slate-700 tracking-tight font-mono">
                                    {(flag.feature || "").toUpperCase()}
                                  </span>
                                </div>
                              </td>
                              <td className="px-8 py-4">
                                <span className="text-[12px] font-bold text-slate-600 font-serif italic">
                                  {flag.imageEvidence}
                                </span>
                              </td>
                              <td className="px-8 py-4">
                                <span
                                  className={`status-badge ${flag.status === "Match" ? "status-match" : flag.status === "Partial Match" ? "status-partial" : "status-conflict"}`}
                                >
                                  {flag.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                  {/* ADJUDICATION SIGNOFF BLOCK */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <section className="card border-none bg-medical-primary text-white shadow-2xl overflow-hidden flex flex-col relative group">
                      <div className="absolute top-0 left-0 w-full h-1 bg-medical-accent" />
                      <div className="bg-white/5 px-8 py-4 flex items-center justify-between border-b border-white/5">
                        <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-white flex items-center gap-3">
                          <AlertCircle className="w-5 h-5 text-medical-accent" />
                          FINAL_DETERMINATION_NODE
                        </h3>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                            ACTIVE_REVIEW
                          </span>
                        </div>
                      </div>
                      <div className="p-8 flex-1 flex flex-col gap-8">
                        <div className="bg-white/5 p-5 rounded-none border-l-[4px] border-medical-accent flex items-center gap-6">
                          <div className="w-14 h-14 bg-medical-primary rounded flex items-center justify-center border border-white/10 shadow-2xl relative overflow-hidden group-hover:rotate-6 transition-transform">
                            <ShieldCheck className="w-8 h-8 text-white relative z-10" />
                            <div className="scanning-line opacity-20" />
                          </div>
                          <div>
                            <span className="text-[9px] font-black uppercase text-medical-accent tracking-widest block mb-1">
                              REVIEWER_ACTION_PROTOCOL
                            </span>
                            <p className="text-[16px] font-black text-white tracking-tight leading-tight uppercase italic font-mono">
                              {result.adjudicationNotes.reviewerAction}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-4 p-5 bg-white/5 rounded-none border border-white/5">
                            <div className="flex items-center justify-between border-b border-white/5 pb-3">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                EPISODE_TIMELINE
                              </span>
                              <span className="status-badge !bg-medical-accent !text-white !border-none">
                                {result.timelineAssessment.stage}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <Clock className="w-4 h-4 text-medical-accent" />
                              <p className="text-[12px] font-black text-white tracking-tight uppercase font-mono">
                                {result.timelineAssessment.timingAlignment}
                              </p>
                            </div>
                            <ul className="space-y-2">
                              {result.timelineAssessment.flaggedIssues.map(
                                (issue, i) => (
                                  <li
                                    key={i}
                                    className="text-[10px] text-rose-400 font-bold italic flex items-start gap-2"
                                  >
                                    <span className="text-rose-600">»</span>{" "}
                                    {issue}
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                          <div className="space-y-4 p-5 bg-white/5 rounded-none border border-white/5">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block border-b border-white/5 pb-3">
                              PACKAGE_CONFORMANCE
                            </span>
                            <p className="text-[11px] font-black text-slate-300 leading-relaxed font-mono uppercase italic">
                              {result.adjudicationNotes.packageAlignment}
                            </p>
                            <div className="pt-4 border-t border-white/5">
                              <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-2">
                                <ShieldCheck className="w-3.5 h-3.5" /> STG_COMPLIANCE
                              </p>
                              <p className="text-[10px] text-slate-400 font-bold italic leading-relaxed">
                                {result.adjudicationNotes.stgCompliance}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="card bg-white p-8 shadow-2xl flex flex-col gap-8 border-t-[4px] border-t-slate-200">
                      <div className="space-y-5">
                        <h3 className="section-label">
                          <Database className="w-4 h-4 text-slate-300" />
                          BENCHMARK_METHODOLOGY_V6
                        </h3>
                        <p className="text-[14px] text-slate-800 font-serif italic leading-relaxed tracking-tight border-l-4 border-slate-100 pl-6 py-2">
                          "{result.trustFramework.methodology}"
                        </p>
                      </div>

                      <div className="mt-auto space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            Clinical Control Std
                          </span>
                          <span className="text-[11px] font-mono text-medical-primary font-black uppercase tracking-tight">
                            {result.trustFramework.radiologicalStandard}
                          </span>
                        </div>
                        <div className="flex items-center justify-between group">
                          <div className="flex items-center gap-4">
                            <div className="w-6 h-6 bg-emerald-50 rounded-sm flex items-center justify-center border border-emerald-100 group-hover:scale-110 transition-transform">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            </div>
                            <span className="text-[11px] font-black text-medical-primary uppercase tracking-[0.1em]">
                              MULTIMODAL_CERTIFICATION_ACTIVE
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 grayscale opacity-30 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                            {[1, 2, 3, 4].map((i) => (
                              <motion.div
                                key={i}
                                animate={{ scaleY: [1, 1.5, 1] }}
                                transition={{
                                  duration: 0.5,
                                  repeat: Infinity,
                                  delay: i * 0.1,
                                }}
                                className="w-1.5 h-5 rounded-full bg-emerald-500"
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>

                  <div className="h-10 shrink-0" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* SYSTEM META FOOTER */}
      <footer className="h-8 bg-white border-t border-slate-200 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
              NETWORK:
            </span>
            <span className="text-[9px] font-mono text-slate-400">
              SECURE-CLINICAL-AUDIT-L4
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
              AUDIT TRAIL:
            </span>
            <span className="text-[9px] font-mono text-slate-400">
              TS_ENCRYPTED_ADJ_MODE
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Database className="w-3 h-3 text-emerald-400" />
          <span className="text-[9px] font-bold text-slate-900 tracking-tight">
            PMJAY ENCRYPTION LAYER v4.6 ENABLED
          </span>
        </div>
      </footer>

      {/* Fraud Analytics Dashboard */}
      <AnalyticsDashboard
        history={history}
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
      />
    </div>
  );
}
