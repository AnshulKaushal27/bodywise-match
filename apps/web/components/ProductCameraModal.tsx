"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Camera,
  UploadSimple,
  X,
  Sparkle,
  ArrowsClockwise,
  ArrowRight,
  CheckCircle,
  WarningCircle,
} from "@phosphor-icons/react";
import { visualScanProduct, VisualScanResult } from "@/lib/api";
import { cn } from "@/lib/utils";
import { AnimatedCameraIcon } from "./AnimatedCameraIcon";

interface ProductCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_OPTIONS = [
  {
    id: "minimalist-salicylic-face-wash",
    label: "Minimalist 2% Salicylic Acid Face Wash",
    brand: "Minimalist",
    active: "Salicylic Acid 2%",
    category: "Face Wash",
  },
  {
    id: "minimalist-niacinamide-serum",
    label: "Minimalist 10% Niacinamide Serum",
    brand: "Minimalist",
    active: "Niacinamide 10%",
    category: "Serum",
  },
  {
    id: "minimalist-spf50-sunscreen",
    label: "Minimalist SPF 50 Multi-Vitamin Sunscreen",
    brand: "Minimalist",
    active: "Broad Spectrum SPF 50",
    category: "Sunscreen",
  },
  {
    id: "sebamed-anti-dandruff-shampoo",
    label: "Sebamed Anti-Dandruff Shampoo",
    brand: "Sebamed",
    active: "Piroctone Olamine",
    category: "Shampoo",
  },
];

export function ProductCameraModal({ isOpen, onClose }: ProductCameraModalProps) {
  const [activeTab, setActiveTab] = React.useState<"camera" | "upload">("camera");
  const [cameraError, setCameraError] = React.useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [analysisStep, setAnalysisStep] = React.useState(0);
  const [scanResult, setScanResult] = React.useState<VisualScanResult | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const mediaStreamRef = React.useRef<MediaStream | null>(null);

  // Stop camera tracks cleanly
  const stopCamera = React.useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  // Start live webcam or mobile back camera
  const startCamera = React.useCallback(async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported in this browser environment.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: unknown) {
      console.warn("Failed to initialize camera:", err);
      const msg =
        err instanceof Error && err.name === "NotAllowedError"
          ? "Camera permission was denied. You can take a photo with your file picker or choose a sample product below."
          : "Could not access camera. Please select or drag a photo below.";
      setCameraError(msg);
      setActiveTab("upload");
    }
  }, []);

  // Handle dialog open / close
  React.useEffect(() => {
    if (isOpen) {
      setScanResult(null);
      setErrorMessage(null);
      if (activeTab === "camera") {
        startCamera();
      }
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, startCamera, stopCamera]);

  // Handle ESC key to close
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Capture current frame from live video
  const handleCaptureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const base64 = canvas.toDataURL("image/jpeg", 0.85);
    stopCamera();
    runScanAnalysis({ imageBase64: base64 });
  };

  // Downscale image helper for uploaded files
  const processAndResizeFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement("img");
      img.onload = () => {
        const maxDim = 1000;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", 0.85);
          runScanAnalysis({ imageBase64: compressed });
        }
      };
      if (typeof e.target?.result === "string") {
        img.src = e.target.result;
      }
    };
    reader.readAsDataURL(file);
  };

  // Run visual scan through API
  const runScanAnalysis = async (params: { imageBase64?: string; preset?: string }) => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    setAnalysisStep(1);

    const stepTimer1 = setTimeout(() => setAnalysisStep(2), 500);
    const stepTimer2 = setTimeout(() => setAnalysisStep(3), 1100);

    try {
      const result = await visualScanProduct(params);
      setScanResult(result);
    } catch (err: unknown) {
      console.error("Scan error:", err);
      setErrorMessage("Could not complete the visual scan. Please try a sample preset below.");
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setIsAnalyzing(false);
    }
  };

  // Preset selection handler
  const handleSelectPreset = (presetId: string) => {
    stopCamera();
    runScanAnalysis({ preset: presetId });
  };

  // Reset to scan another product
  const handleReset = () => {
    setScanResult(null);
    setErrorMessage(null);
    if (activeTab === "camera") {
      startCamera();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="camera-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-brand-deep/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl bg-surface rounded-card border border-border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-paper/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-surface-sage flex items-center justify-center text-brand-primary border border-brand-primary/20 shadow-2xs">
              <AnimatedCameraIcon className="w-4 h-4 text-brand-primary" />
            </div>
            <div>
              <h2 id="camera-modal-title" className="font-display font-bold text-base sm:text-lg text-brand-deep">
                Visual Product Matcher
              </h2>
              <p className="text-xs text-muted">
                Scan any product bottle to find equivalent Be Bodywise formulas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 text-muted hover:text-brand-deep rounded-button hover:bg-surface-sage/70 transition-colors focus-ring min-w-[36px] min-h-[36px] flex items-center justify-center"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Error Banner */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-button bg-caution-peach/60 border border-caution-text/20 text-xs text-caution-text">
              <WarningCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* VIEW 1: Input / Viewfinder State */}
          {!scanResult && !isAnalyzing && (
            <>
              {/* Tab Selector */}
              <div className="flex items-center gap-2 p-1 bg-paper rounded-button border border-border/70 max-w-xs mx-auto">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("camera");
                    startCamera();
                  }}
                  className={cn(
                    "flex-1 py-1.5 px-3 rounded-button text-xs font-semibold flex items-center justify-center gap-1.5 transition-all min-h-[36px]",
                    activeTab === "camera"
                      ? "bg-surface text-brand-deep shadow-2xs border border-border/80"
                      : "text-muted hover:text-brand-deep"
                  )}
                >
                  <Camera className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Live Camera</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("upload");
                    stopCamera();
                  }}
                  className={cn(
                    "flex-1 py-1.5 px-3 rounded-button text-xs font-semibold flex items-center justify-center gap-1.5 transition-all min-h-[36px]",
                    activeTab === "upload"
                      ? "bg-surface text-brand-deep shadow-2xs border border-border/80"
                      : "text-muted hover:text-brand-deep"
                  )}
                >
                  <UploadSimple className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Upload / Photo</span>
                </button>
              </div>

              {/* Camera Tab Viewfinder */}
              {activeTab === "camera" && (
                <div className="relative aspect-[4/3] sm:aspect-[16/10] bg-brand-deep rounded-card overflow-hidden shadow-inner flex flex-col items-center justify-center border border-border">
                  {cameraError ? (
                    <div className="p-6 text-center text-white/90 max-w-sm space-y-3">
                      <Camera className="w-8 h-8 text-white/60 mx-auto" aria-hidden="true" />
                      <p className="text-xs sm:text-sm">{cameraError}</p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-brand-evergreen text-white text-xs font-semibold rounded-button shadow hover:bg-brand-deep focus-ring"
                      >
                        Choose file or take phone photo
                      </button>
                    </div>
                  ) : (
                    <>
                      <video
                        ref={videoRef}
                        playsInline
                        muted
                        autoPlay
                        className="w-full h-full object-cover"
                      />
                      <canvas ref={canvasRef} className="hidden" />

                      {/* Optical Framing Overlay Guides */}
                      <div className="absolute inset-8 sm:inset-12 pointer-events-none border-2 border-white/40 rounded-card flex items-center justify-center">
                        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-accent-lime" />
                        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-accent-lime" />
                        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-accent-lime" />
                        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-accent-lime" />
                        <span className="text-[11px] font-medium text-white/80 bg-brand-deep/70 px-2 py-0.5 rounded-full backdrop-blur-xs">
                          Align product bottle inside frame
                        </span>
                      </div>

                      {/* Floating Snap Shutter Button */}
                      <div className="absolute bottom-4 inset-x-0 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={handleCaptureFrame}
                          aria-label="Capture photo and match"
                          className="w-14 h-14 rounded-full bg-surface border-4 border-brand-evergreen shadow-lg flex items-center justify-center active:scale-95 transition-transform hover:bg-surface-sage focus-ring group"
                        >
                          <div className="w-9 h-9 rounded-full bg-brand-evergreen flex items-center justify-center text-white shadow-xs">
                            <AnimatedCameraIcon className="w-5 h-5 text-white" />
                          </div>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Upload Tab Dropzone */}
              {activeTab === "upload" && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      processAndResizeFile(e.dataTransfer.files[0]);
                    }
                  }}
                  className="aspect-[4/3] sm:aspect-[16/10] bg-paper/60 border-2 border-dashed border-brand-deep/20 hover:border-brand-evergreen rounded-card flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-colors group"
                >
                  <div className="w-12 h-12 rounded-full bg-surface-sage flex items-center justify-center text-brand-evergreen mb-3 group-hover:scale-105 transition-transform">
                    <UploadSimple className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <p className="font-semibold text-sm text-brand-deep mb-1">
                    Upload or take a photo of a bottle
                  </p>
                  <p className="text-xs text-muted max-w-xs">
                    Tap to open your camera roll or drag and drop an image (JPEG, PNG, WebP)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        processAndResizeFile(e.target.files[0]);
                      }
                    }}
                  />
                </div>
              )}

              {/* Quick Sample Presets */}
              <div className="pt-2">
                <p className="text-xs font-semibold text-brand-deep mb-2 flex items-center gap-1.5">
                  <Sparkle className="w-3.5 h-3.5 text-brand-evergreen" aria-hidden="true" />
                  <span>Or try instant verified samples:</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PRESET_OPTIONS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset.id)}
                      className="flex items-start gap-2.5 p-2.5 rounded-button border border-border/80 bg-paper/50 hover:bg-surface hover:border-brand-evergreen/60 text-left transition-all active:scale-[0.99] group focus-ring min-h-[44px]"
                    >
                      <div className="w-7 h-7 rounded-full bg-surface-sage shrink-0 flex items-center justify-center text-brand-evergreen font-bold text-xs group-hover:bg-brand-evergreen group-hover:text-white transition-colors">
                        {preset.brand[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-brand-deep truncate">
                          {preset.label}
                        </div>
                        <div className="text-[11px] text-muted flex items-center gap-1.5 mt-0.5">
                          <span className="font-medium text-brand-evergreen">{preset.active}</span>
                          <span>•</span>
                          <span>{preset.category}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* VIEW 2: Analyzing Loading State */}
          {isAnalyzing && (
            <div className="py-12 sm:py-16 flex flex-col items-center justify-center text-center space-y-5">
              <div className="relative w-16 h-16 rounded-full bg-surface-sage flex items-center justify-center text-brand-evergreen shadow-inner">
                <ArrowsClockwise className="w-8 h-8 animate-spin" aria-hidden="true" />
                <Sparkle className="w-4 h-4 text-accent-lime absolute top-0 right-0 animate-pulse" aria-hidden="true" />
              </div>

              <div className="space-y-1.5 max-w-sm">
                <h3 className="font-display font-bold text-base sm:text-lg text-brand-deep">
                  Analyzing Product Packaging
                </h3>
                <p className="text-xs text-muted">
                  Connecting to Multimodal Vision model and Be Bodywise deterministic catalogue engine...
                </p>
              </div>

              {/* Progress Milestones */}
              <div className="w-full max-w-xs bg-paper rounded-button p-3 border border-border/70 space-y-2 text-left text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle className={cn("w-4 h-4 shrink-0", analysisStep >= 1 ? "text-brand-evergreen" : "text-muted/40")} aria-hidden="true" />
                  <span className={analysisStep >= 1 ? "font-semibold text-brand-deep" : "text-muted"}>
                    Detecting brand and packaging text
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className={cn("w-4 h-4 shrink-0", analysisStep >= 2 ? "text-brand-evergreen" : "text-muted/40")} aria-hidden="true" />
                  <span className={analysisStep >= 2 ? "font-semibold text-brand-deep" : "text-muted"}>
                    Extracting active ingredients & format
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className={cn("w-4 h-4 shrink-0", analysisStep >= 3 ? "text-brand-evergreen" : "text-muted/40")} aria-hidden="true" />
                  <span className={analysisStep >= 3 ? "font-semibold text-brand-deep" : "text-muted"}>
                    Matching Be Bodywise verified catalogue
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: Empty State when no cosmetic product is detected */}
          {scanResult &&
            !isAnalyzing &&
            (!scanResult.scanned_product.is_product_detected || scanResult.matches.length === 0) && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="p-6 rounded-card bg-paper border border-border text-center flex flex-col items-center justify-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-surface-sage/80 border border-brand-primary/20 flex items-center justify-center text-brand-primary">
                    <AnimatedCameraIcon className="w-7 h-7 text-brand-primary" />
                  </div>

                  <div className="space-y-1.5 max-w-md">
                    <h3 className="font-display font-bold text-base sm:text-lg text-brand-deep">
                      No cosmetic or wellness product detected
                    </h3>
                    <p className="text-xs sm:text-sm text-charcoal/80 leading-relaxed">
                      {scanResult.scanned_product.summary ||
                        "We couldn't identify a readable product bottle or packaging in this image."}
                    </p>
                  </div>

                  {/* Helpful Guidance Tips */}
                  <div className="w-full max-w-sm rounded-button bg-surface border border-border/80 p-3.5 text-left space-y-1.5 text-xs text-muted">
                    <div className="font-semibold text-brand-deep text-[11px] mb-1">
                      Tips for a successful scan:
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-brand-evergreen shrink-0" aria-hidden="true" />
                      <span>Hold the bottle 6–12 inches away in good light</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-brand-evergreen shrink-0" aria-hidden="true" />
                      <span>Keep the front label and brand name in sharp focus</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-brand-evergreen shrink-0" aria-hidden="true" />
                      <span>Avoid heavy reflections, blur, or non-cosmetic objects</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-button bg-brand-evergreen hover:bg-brand-deep text-white text-xs font-semibold shadow-soft transition-all focus-ring min-h-[44px]"
                    >
                      <ArrowsClockwise className="w-4 h-4" aria-hidden="true" />
                      <span>Retake or choose another photo</span>
                    </button>
                    <Link
                      href="/products"
                      onClick={onClose}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-button bg-surface border border-border text-brand-deep hover:bg-surface-sage text-xs font-semibold transition-colors focus-ring min-h-[44px]"
                    >
                      <span>Browse catalogue directory</span>
                    </Link>
                  </div>
                </div>

                {/* Sample Presets as fallback */}
                <div className="pt-2">
                  <p className="text-xs font-semibold text-brand-deep mb-2 flex items-center gap-1.5">
                    <Sparkle className="w-3.5 h-3.5 text-brand-evergreen" aria-hidden="true" />
                    <span>Or test with verified sample products:</span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PRESET_OPTIONS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset.id)}
                        className="flex items-start gap-2.5 p-2.5 rounded-button border border-border/80 bg-paper/50 hover:bg-surface hover:border-brand-evergreen/60 text-left transition-all active:scale-[0.99] group focus-ring min-h-[44px]"
                      >
                        <div className="w-7 h-7 rounded-full bg-surface-sage shrink-0 flex items-center justify-center text-brand-evergreen font-bold text-xs group-hover:bg-brand-evergreen group-hover:text-white transition-colors">
                          {preset.brand[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-brand-deep truncate">
                            {preset.label}
                          </div>
                          <div className="text-[11px] text-muted flex items-center gap-1.5 mt-0.5">
                            <span className="font-medium text-brand-evergreen">{preset.active}</span>
                            <span>•</span>
                            <span>{preset.category}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

          {/* VIEW 4: Results Display when a valid product was detected */}
          {scanResult &&
            !isAnalyzing &&
            scanResult.scanned_product.is_product_detected &&
            scanResult.matches.length > 0 && (
              <div className="space-y-5 animate-in fade-in duration-300">
              {/* Scanned Competitor Product Card */}
              <div className="p-4 rounded-card bg-paper border border-border space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-accent-lime/60 text-brand-deep border border-brand-deep/10">
                    Detected Product
                  </span>
                  {scanResult.latency_ms && (
                    <span className="text-[11px] text-muted font-medium">
                      Analyzed in {scanResult.latency_ms}ms
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-display font-bold text-base sm:text-lg text-brand-deep">
                    {scanResult.scanned_product.product_name.toLowerCase().startsWith(scanResult.scanned_product.brand.toLowerCase())
                      ? scanResult.scanned_product.product_name
                      : `${scanResult.scanned_product.brand} ${scanResult.scanned_product.product_name}`}
                  </h3>
                  <p className="text-xs text-charcoal/80 mt-1 leading-relaxed">
                    {scanResult.scanned_product.summary}
                  </p>
                </div>

                {/* Extracted Actives & Tags */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-muted">Detected Actives:</span>
                  {scanResult.scanned_product.active_ingredients.map((active, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-surface border border-brand-deep/15 text-[11px] font-semibold text-brand-deep shadow-2xs"
                    >
                      {active}
                    </span>
                  ))}
                  {scanResult.scanned_product.category && (
                    <span className="px-2 py-0.5 rounded-md bg-surface-sage border border-brand-deep/15 text-[11px] font-semibold text-brand-evergreen">
                      Category: {scanResult.scanned_product.category.replace(/_/g, " ")}
                    </span>
                  )}
                </div>
              </div>

              {/* Match Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-display font-bold text-sm sm:text-base text-brand-deep">
                    Matching Be Bodywise Alternatives ({scanResult.matches.length})
                  </h4>
                  <p className="text-xs text-muted">
                    Ranked by active ingredient alignment and verified formula compatibility
                  </p>
                </div>
              </div>

              {/* Matches Grid */}
              <div className="space-y-3">
                {scanResult.matches.map((item, idx) => (
                  <div
                    key={item.product.id || idx}
                    className="p-3.5 sm:p-4 rounded-card bg-surface border-2 border-brand-deep/10 hover:border-brand-evergreen transition-all shadow-2xs space-y-3"
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      {/* Product Thumbnail */}
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-button bg-paper border border-border/80 overflow-hidden shrink-0 relative">
                        {item.product.image_url ? (
                          <Image
                            src={item.product.image_url}
                            alt={item.product.official_name}
                            fill
                            sizes="(max-width: 640px) 64px, 80px"
                            className="object-contain p-1"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted font-bold text-sm">
                            BW
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded-full bg-surface-sage text-brand-evergreen text-[10px] font-bold uppercase tracking-wider">
                            {idx === 0 ? "Closest Match" : "Alternative Option"}
                          </span>
                          <span className="text-xs font-semibold text-brand-evergreen">
                            {item.similarity_score}% similarity
                          </span>
                        </div>

                        <h5 className="font-display font-bold text-sm sm:text-base text-brand-deep leading-snug">
                          {item.product.official_name}
                        </h5>

                        <div className="text-xs text-brand-deep font-semibold mt-1">
                          ₹{item.product.price_inr}
                        </div>
                      </div>
                    </div>

                    {/* Why this matches bullets */}
                    <div className="bg-paper/80 rounded-button p-2.5 text-xs space-y-1 border border-border/60">
                      <div className="font-semibold text-brand-deep text-[11px] mb-1">
                        Why this formula fits:
                      </div>
                      <ul className="space-y-0.5">
                        {item.match_reasons.map((reason, rIdx) => (
                          <li key={rIdx} className="flex items-center gap-1.5 text-charcoal/85">
                            <CheckCircle className="w-3.5 h-3.5 text-brand-evergreen shrink-0" aria-hidden="true" />
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* CTA Actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <Link
                        href={`/products/${item.product.slug}`}
                        onClick={onClose}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-button bg-brand-evergreen hover:bg-brand-deep text-white font-semibold text-xs shadow-soft transition-all focus-ring min-h-[38px]"
                      >
                        <span>View Bodywise Product</span>
                        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </Link>

                      <Link
                        href={`/match?goal=${encodeURIComponent(item.product.supported_goals[0] || "oil_control")}`}
                        onClick={onClose}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-button bg-surface border border-border text-brand-deep hover:bg-surface-sage font-medium text-xs transition-colors focus-ring min-h-[38px]"
                      >
                        <span>Start Match with this Goal</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reset to Scan Another */}
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-button border border-border hover:bg-paper text-xs font-semibold text-brand-deep transition-all focus-ring min-h-[44px]"
                >
                  <ArrowsClockwise className="w-4 h-4" aria-hidden="true" />
                  <span>Scan or test another product</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
