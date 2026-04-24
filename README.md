# 🩺 VantageXR — Precision Radiological Claim Auditing

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/yourusername/vantagexr)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Powered by Gemini](https://img.shields.io/badge/AI-Gemini%202.0%20Flash-blue.svg)](https://ai.google.dev/)

**VantageXR** is a high-fidelity, AI-powered platform designed for India's AB PMJAY scheme to revolutionize radiological claim auditing. By cross-referencing medical imaging (X-Ray, CT, MRI, USG) against clinical reports in real-time, VantageXR detects upcoding, inconsistencies, and potential fraud with surgical precision.

---

## ✨ Features that "Wow"

### 🛡️ One-Click LIVE DEMO Mode
Instantly showcase the system's power without needing medical files. Our demo mode runs three realistic clinical scenarios—from a standard pneumonia approval to a critical multi-vessel fraud detection case—complete with synthetic medical data.

### 🤖 Multimodal AI Adjudicator
Powered by **Gemini 2.0 Flash**, the system performs deep semantic analysis on hospital reports and visual feature extraction on DICOM/medical scans to find hidden discrepancies that human reviewers might miss.

### 📊 Fraud Analytics Command Dashboard
A professional-grade monitoring hub featuring:
- **Animated KPI tracking** for risk rates and compliance.
- **Severity Heatmaps** for regional or hospital-level analysis.
- **Clinical Trend Visualization** using SVG-powered donut charts and bar graphs.

### 🧊 3D Medical Volume Viewer
Inspect scans with high-performance WebGL-based 3D visualization. Toggle between layers, rotate anatomy, and identify localized pathologies exactly where they occur.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Framer Motion (Animations), Lucide React (Icons), Vanilla CSS (Medical Branding).
- **AI Backend**: Google Gemini 2.0 Flash (Multimodal Vision + Text).
- **3D Engine**: React Three Fiber / Three.js.
- **Deployment**: Netlify / Cloud Run.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- A [Google AI Studio API Key](https://aistudio.google.com/app/apikey)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/vantagexr.git
   cd vantagexr
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Run Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## 🌍 Deployment

### Deploying to Netlify
1. Build the production bundle:
   ```bash
   npm run build
   ```
2. Deploy via Netlify CLI or Drag-and-Drop the `dist` folder.
3. **Important**: Add `VITE_GEMINI_API_KEY` to your Netlify Site Settings -> Environment Variables.

---

## 📜 Audit Philosophy
VantageXR adheres to the **"Logic-First"** adjudication protocol. Every claim is weighed against Standard Treatment Guidelines (STG) and radiological benchmarks (ACR/AUA) to ensure that clinical evidence perfectly matches the claimed insurance package.

---

<div align="center">
  <p align="center">Built for the future of healthcare integrity. 🇮🇳</p>
</div>
