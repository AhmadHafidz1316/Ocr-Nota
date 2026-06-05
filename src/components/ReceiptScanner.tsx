/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from "react";
import { 
  Camera, 
  Upload, 
  X, 
  Loader2, 
  AlertTriangle, 
  Sparkles, 
  Image as FileImageIcon, 
  Scan,
  RefreshCw,
  Play
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ReceiptData } from "../types";

interface ReceiptScannerProps {
  onScanComplete: (data: ReceiptData & { imageUri: string }) => void;
  onCancel: () => void;
}

export default function ReceiptScanner({ onScanComplete, onCancel }: ReceiptScannerProps) {
  const [dragActive, setDragActive] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Camera management states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Optical logs during scanning simulation to capture PaddleOCR look-and-feel
  const scanStepsLogs = [
    "Memuat mesin visual PaddleOCR...",
    "Menjalankan segmentasi baris teks & pendeteksian huruf...",
    "Melakukan OCR line-by-line pada struk...",
    "Mengidentifikasi nama entitas toko, tanggal, & metode pembayaran...",
    "Mengekstrak tabel barang belanjaan (nama, kuantitas, harga)...",
    "Melakukan rekonsiliasi total neraca saldo & PPN...",
    "Mengklasifikasikan kategori item otomatis...",
    "Sinkronisasi data JSON terstruktur..."
  ];

  // Rotate log messages gracefully during loading
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isScanning) {
      interval = setInterval(() => {
        setScanStep((prev) => {
          if (prev < scanStepsLogs.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 1800);
    } else {
      setScanStep(0);
    }
    return () => clearInterval(interval);
  }, [isScanning]);

  // Handle stream cleanup
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Start Camera Action
  const startCamera = async () => {
    setErrorMessage(null);
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false
      });
      
      setCameraStream(stream);
      setIsCameraActive(true);
      setImageSrc(null);
      
      // Delay mounting stream slightly to let video tag render
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err: any) {
      console.error("Camera access failed", err);
      setErrorMessage(
        "Gagal mengakses kamera. Pastikan Anda telah memberikan izin kamera untuk aplikasi ini di peramban Anda."
      );
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  // Capture image frame from stream to canvas
  const capturePhoto = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      // Keep native resolution if possible
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        setImageSrc(dataUrl);
        setMimeType("image/jpeg");
        stopCamera();
      }
    } catch (err) {
      setErrorMessage("Gagal menangkap foto dari kamera feed.");
    }
  };

  // Handle file uploads
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Berkas harus berupa gambar (PNG, JPG, JPEG, WEBP).");
      return;
    }
    
    setErrorMessage(null);
    setMimeType(file.type);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageSrc(event.target.result as string);
        stopCamera();
      }
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop event handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Proceed with OCR scanning API request
  const handleProceedScan = async () => {
    if (!imageSrc) return;
    setIsScanning(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/scan-receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: imageSrc,
          mimeType: mimeType,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `HTTP error ${response.status}`);
      }

      const receiptData: ReceiptData = await response.json();
      
      // Complete output with image details
      onScanComplete({
        ...receiptData,
        imageUri: imageSrc
      });
    } catch (err: any) {
      console.error("Scan API Failure:", err);
      setErrorMessage(
        err.message || "Gagal menghubungi layanan OCR. Pastikan kunci API sudah dikonfigurasi dengan benar di panel pengaturan."
      );
      setIsScanning(false);
    }
  };

  return (
    <div id="receipt-scanner-container" className="max-w-2xl mx-auto rounded-2xl border border-slate-100 bg-white shadow-lg overflow-hidden">
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-slate-100 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
            <Scan className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Konsol Scanner Nota</h3>
            <p className="text-xs text-slate-500 font-medium">PaddleOCR Parser Intelligent Module</p>
          </div>
        </div>
        {!isScanning && (
          <button
            onClick={onCancel}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-950 transition"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="p-6">
        <AnimatePresence mode="wait">
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 flex gap-3 rounded-xl border border-rose-100 bg-rose-50 p-4 text-xs font-semibold leading-relaxed text-rose-700 items-start shadow-xs"
            >
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <div className="space-y-1">
                <span className="font-bold">Eror Pemindaian</span>
                <p>{errorMessage}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isScanning ? (
          /* Live Scanning Mode & sweeping animation */
          <div className="flex flex-col items-center justify-center py-12 text-center leading-normal">
            <div className="relative h-72 w-52 overflow-hidden rounded-xl border border-slate-200 shadow-md bg-slate-50 flex items-center justify-center">
              {imageSrc ? (
                <img 
                  src={imageSrc} 
                  alt="Scanning receipt" 
                  className="h-full w-full object-cover opacity-60"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <FileImageIcon className="h-10 w-10 text-slate-300" />
              )}
              {/* Vertical Laser Sweeper line */}
              <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-red-500 class via-red-500 to-red-600 shadow-lg shadow-red-500/80 scanner-laser" />
            </div>

            <div className="mt-8 space-y-3 max-w-md">
              <div className="flex items-center justify-center gap-3 text-slate-800">
                <Loader2 className="h-5 w-5 animate-spin text-slate-900" />
                <span className="text-sm font-extrabold tracking-tight">Kecerdasan Buatan Sedang Berjalan...</span>
              </div>
              
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 min-w-[280px]">
                {/* Active log line */}
                <p className="text-xs text-slate-600 animate-pulse font-bold">
                  {scanStepsLogs[scanStep]}
                </p>
              </div>

              {/* Steps Progress counters */}
              <div className="flex justify-center gap-1.5 mt-2">
                {scanStepsLogs.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx < scanStep ? "w-6 bg-slate-800" : idx === scanStep ? "w-10 bg-slate-900 animate-pulse" : "w-1.5 bg-slate-200"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : isCameraActive ? (
          /* Interactive Camera Feed mode */
          <div className="space-y-6">
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-slate-200 bg-black flex items-center justify-center">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="h-full w-full object-cover" 
              />
              <div className="absolute inset-5 pointer-events-none border-2 border-dashed border-white/40 rounded-xl flex items-center justify-center">
                <div className="text-[10px] text-white/60 font-semibold bg-black/40 px-3 py-1 rounded-full uppercase tracking-widest font-mono">
                  Posisikan nota di tengah bingkai
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={capturePhoto}
                className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 active:translate-y-0.5 px-6 py-3 text-sm font-semibold text-white shadow-md transition"
              >
                <Camera className="h-5 w-5" />
                Ambil Gambar
              </button>
              <button
                type="button"
                className="flex rounded-xl bg-slate-100 hover:bg-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition"
                onClick={stopCamera}
              >
                Batalkan Kamera
              </button>
            </div>
          </div>
        ) : imageSrc ? (
          /* Upload Captured/Selected Image and preview choice */
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center">
              <div className="relative max-h-80 w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 shadow-md bg-slate-100 flex items-center justify-center p-2">
                <img 
                  src={imageSrc} 
                  alt="Receipt Preview" 
                  className="max-h-72 w-auto object-contain rounded-lg"
                  referrerPolicy="no-referrer"
                />
                
                <button
                  type="button"
                  onClick={() => setImageSrc(null)}
                  className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/80 hover:bg-slate-900 text-white shadow transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleProceedScan}
                className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 px-6 py-3.5 text-sm font-semibold text-white shadow-md w-full sm:w-auto transition"
              >
                <Sparkles className="h-4 w-4" />
                Proses Nota dengan OCR AI
              </button>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={startCamera}
                  className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 px-4 py-3.5 text-sm font-medium text-slate-700 w-full sm:w-auto transition"
                >
                  <RefreshCw className="h-4 w-4" />
                  Foto Ulang
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 px-4 py-3.5 text-sm font-medium text-slate-700 w-full sm:w-auto transition"
                >
                  <Upload className="h-4 w-4" />
                  Pilih Berkas Lain
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Main Drag-and-drop ingestion interface */
          <div className="space-y-6">
            <div
              id="file-drop-area"
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-12 px-6 text-center cursor-pointer transition ${
                dragActive 
                  ? "border-slate-900 bg-slate-50/50" 
                  : "border-slate-200 bg-slate-50/20 hover:border-slate-300 hover:bg-slate-50/10"
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <Upload className="h-7 w-7" />
              </div>

              <h4 className="mt-6 text-base font-bold text-slate-900">Seret & lepas foto struk di sini</h4>
              <p className="mt-1.5 text-xs text-slate-400 font-medium">Atau klik untuk menjelajahi berkas lokal (PNG, JPG, WEBP)</p>
            </div>

            <div className="flex items-center justify-center gap-4">
              <div className="h-px bg-slate-100 flex-1" />
              <span className="text-[10px] font-black uppercase text-slate-300 tracking-wider">ATAU GUNAKAN KAMERA</span>
              <div className="h-px bg-slate-100 flex-1" />
            </div>

            <button
              onClick={startCamera}
              className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 active:translate-y-0.5 px-6 py-4 text-sm font-bold text-slate-800 shadow-sm transition w-full"
            >
              <Camera className="h-5 w-5 text-slate-600" />
              Gunakan Kamera Handphone / Webcam
            </button>
          </div>
        )}
      </div>
      
      {/* Footer Info Notice */}
      <div className="border-t border-slate-50 bg-slate-50/50 p-4 text-center text-[10px] font-medium text-slate-400 leading-normal">
        PaddleOCR Parser & Gemini Vision AI mengekstrak data dari nota kotor, buram, keriput, atau terlipat secara pintar. Info finansial diolah secara lokal.
      </div>
    </div>
  );
}
