/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { ReceiptData } from "./types";
import { sampleReceiptsData } from "./seed";
import HistoryDashboard from "./components/HistoryDashboard";
import ReceiptScanner from "./components/ReceiptScanner";
import ReceiptDetails from "./components/ReceiptDetails";
import { 
  Scan, 
  Sparkles, 
  Cpu, 
  HelpCircle, 
  CheckCircle2, 
  LogOut, 
  Settings,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  const [currentScreen, setCurrentScreen] = useState<"dashboard" | "scanner" | "details">("dashboard");
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  
  // Settings and status panel
  const [showKeyToast, setShowKeyToast] = useState(true);
  const [hasServerKey, setHasServerKey] = useState(false);

  // Load receipts from local storage on mount, fallback to mock seed
  useEffect(() => {
    const saved = localStorage.getItem("paddle_ocr_receipts");
    if (saved) {
      try {
        setReceipts(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved receipts, seeding instead", e);
        setReceipts(sampleReceiptsData);
        localStorage.setItem("paddle_ocr_receipts", JSON.stringify(sampleReceiptsData));
      }
    } else {
      setReceipts(sampleReceiptsData);
      localStorage.setItem("paddle_ocr_receipts", JSON.stringify(sampleReceiptsData));
    }

    // Ping simple status health to check for Gemini Secrets integration
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.hasGeminiKey) {
          setHasServerKey(true);
        }
      })
      .catch((err) => console.log("Health check bypass:", err));
  }, []);

  // Save changes back to LocalStorage
  const saveReceiptsList = (updatedList: ReceiptData[]) => {
    setReceipts(updatedList);
    localStorage.setItem("paddle_ocr_receipts", JSON.stringify(updatedList));
  };

  // 1. Action: Start New Scan
  const handleStartScan = () => {
    setCurrentScreen("scanner");
    setSelectedReceipt(null);
  };

  // 2. Action: Scan Processing Complete (sets as selected but not yet committed until verified)
  const handleScanComplete = (scannedData: ReceiptData & { imageUri: string }) => {
    const freshReceipt: ReceiptData = {
      ...scannedData,
      id: `rec-${Date.now()}` // generate unique timestamp string ID
    };
    setSelectedReceipt(freshReceipt);
    setCurrentScreen("details");
  };

  // 3. Action: User reviews and commits parsed data (either writes new or updates existing)
  const handleSaveReceipt = (updatedData: ReceiptData) => {
    const exists = receipts.some(r => r.id === updatedData.id);
    let updatedList: ReceiptData[];

    if (exists) {
      updatedList = receipts.map(r => r.id === updatedData.id ? updatedData : r);
    } else {
      updatedList = [updatedData, ...receipts];
    }

    saveReceiptsList(updatedList);
    setSelectedReceipt(null);
    setCurrentScreen("dashboard");
  };

  // 4. Action: Delete transaction
  const handleDeleteReceipt = (receiptId: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus data nota belanja ini dari arsip?")) {
      const filtered = receipts.filter(r => r.id !== receiptId);
      saveReceiptsList(filtered);
      setSelectedReceipt(null);
      setCurrentScreen("dashboard");
    }
  };

  // Select a row from history to display details
  const handleSelectReceipt = (receipt: ReceiptData) => {
    setSelectedReceipt(receipt);
    setCurrentScreen("details");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Navigation Branding Header */}
      <nav className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setCurrentScreen("dashboard")}>
              {/* App logo badge */}
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md shadow-slate-950/10">
                <Scan className="h-5.5 w-5.5" />
              </div>
              <div className="leading-tight">
                <span className="block font-black text-slate-900 tracking-tight text-base sm:text-lg">
                  KlipNota <span className="text-[10px] font-extrabold uppercase bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md ml-1 border border-slate-200">AI</span>
                </span>
                <span className="block text-[10px] text-zinc-400 font-bold tracking-widest uppercase font-mono sm:text-xs">
                  PaddleOCR Parser
                </span>
              </div>
            </div>

            {/* Quick API status Indicator */}
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 px-3.5 text-xs font-semibold">
                <div className={`h-2 w-2 rounded-full ${hasServerKey ? "bg-emerald-500 animate-pulse" : "bg-orange-400"}`} />
                <span className="text-slate-600">
                  {hasServerKey ? "Koneksi Gemini Visual OCR Aktif" : "Mode Simulasi OCR Aktif"}
                </span>
              </div>
              
              <button
                onClick={() => setShowKeyToast(true)}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition"
                title="Informasi Kunci API"
              >
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Container viewport */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Dynamic Warning Alert about API Configurations */}
        <AnimatePresence>
          {showKeyToast && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col sm:flex-row sm:items-start justify-between gap-4 leading-normal">
                <div className="flex gap-4 items-start">
                  <div className={`p-2.5 rounded-xl shrink-0 ${hasServerKey ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"}`}>
                    <Cpu className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      {hasServerKey 
                        ? "Sistem Terhubung ke Google Gemini Visual Intelligence!" 
                        : "Berjalan dalam Mode Kredensial Pengembang Lokal"
                      }
                    </h4>
                    <p className="mt-1 text-xs text-slate-500 max-w-2xl">
                      {hasServerKey 
                        ? "Setiap foto nota dianalisis langsung oleh model mutakhir AI Gemini 3.5 Flash untuk menangkap teks pembelian (OCR), memisahkan harga barang, rincian pajak, dan mengklasifikasikan pos pengeluaran secara optimal."
                        : "Aplikasi ini menggunakan simulasi pintar model PaddleOCR berbasis template jika kunci API belum terhubung. Hubungkan kunci API Anda secara aman di panel Secrets Settings untuk memproses foto nota riil Anda menggunakan AI Vision!"
                      }
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowKeyToast(false)}
                  className="self-end sm:self-start flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition shrink-0"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Route views with standard transition motions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, cubicBezier: [0.16, 1, 0.3, 1] }}
          >
            {currentScreen === "dashboard" && (
              <HistoryDashboard
                receipts={receipts}
                onSelectReceipt={handleSelectReceipt}
                onStartNewScan={handleStartScan}
              />
            )}

            {currentScreen === "scanner" && (
              <ReceiptScanner
                onScanComplete={handleScanComplete}
                onCancel={() => setCurrentScreen("dashboard")}
              />
            )}

            {currentScreen === "details" && selectedReceipt && (
              <ReceiptDetails
                receipt={selectedReceipt}
                onSave={handleSaveReceipt}
                onDelete={handleDeleteReceipt}
                onBack={() => setCurrentScreen("dashboard")}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Humble Elegant footer (anti-ai-slop compliance) */}
      <footer className="w-full border-t border-slate-200 bg-white py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-400">
            <span>© 2026 KlipNota OCR — Platform Digital Manajemen Keuangan Personal.</span>
            <span className="flex items-center gap-1">
              Ditenagai oleh <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" /> Gemini Visual AI & PaddleOCR Engine
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
