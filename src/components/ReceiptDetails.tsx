/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from "react";
import { ReceiptData, ReceiptItem, OcrSegment } from "../types";
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  Calendar, 
  Clock, 
  ShoppingBag, 
  FileText, 
  Edit2, 
  Plus, 
  X, 
  Maximize2,
  List,
  Sparkles,
  Percent,
  Calculator,
  Eye
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ReceiptDetailsProps {
  receipt: ReceiptData;
  onSave: (updated: ReceiptData) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}

export default function ReceiptDetails({ receipt, onSave, onDelete, onBack }: ReceiptDetailsProps) {
  // Local state for full editability
  const [storeName, setStoreName] = useState(receipt.storeName || "");
  const [storeAddress, setStoreAddress] = useState(receipt.storeAddress || "");
  const [storePhone, setStorePhone] = useState(receipt.storePhone || "");
  const [date, setDate] = useState(receipt.date || "");
  const [time, setTime] = useState(receipt.time || "");
  const [receiptNumber, setReceiptNumber] = useState(receipt.receiptNumber || "");
  const [paymentMethod, setPaymentMethod] = useState(receipt.paymentMethod || "CASH");
  const [items, setItems] = useState<ReceiptItem[]>(receipt.items || []);
  
  const [tax, setTax] = useState(receipt.tax || 0);
  const [serviceCharge, setServiceCharge] = useState(receipt.serviceCharge || 0);
  const [discount, setDiscount] = useState(receipt.discount || 0);
  const [notes, setNotes] = useState(receipt.notes || "");

  // OCR tracking states
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [showOcrOverlay, setShowOcrOverlay] = useState(true);

  // Auto recalculations of subtotals and grand totals in real-time
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  }, [items]);

  const grandTotal = useMemo(() => {
    return subtotal + tax + serviceCharge - discount;
  }, [subtotal, tax, serviceCharge, discount]);

  // Handle edit of specific line item properties
  const handleItemChange = (itemId: string, field: keyof ReceiptItem, value: any) => {
    setItems((prevItems) => 
      prevItems.map((item) => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };
          // Keep totalPrice synced
          if (field === "unitPrice" || field === "quantity") {
            const up = field === "unitPrice" ? Number(value) : item.unitPrice;
            const qty = field === "quantity" ? Number(value) : item.quantity;
            updatedItem.totalPrice = up * qty;
          }
          return updatedItem;
        }
        return item;
      })
    );
  };

  // Delete line item
  const handleDeleteItem = (itemId: string) => {
    setItems((prevItems) => prevItems.filter(item => item.id !== itemId));
  };

  // Add new blank item
  const handleAddNewItem = () => {
    const newItem: ReceiptItem = {
      id: `item-${Date.now()}`,
      name: "Item Baru",
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      category: "Lainnya"
    };
    setItems((prev) => [...prev, newItem]);
  };

  // Validate and submit changes to persist
  const handleApplySave = () => {
    if (!storeName.trim()) {
      alert("Nama toko belanjaan wajib diisi.");
      return;
    }

    const updatedData: ReceiptData = {
      ...receipt,
      storeName,
      storeAddress,
      storePhone,
      date,
      time,
      receiptNumber,
      paymentMethod,
      items,
      subtotal,
      tax,
      serviceCharge,
      discount,
      grandTotal,
      notes
    };

    onSave(updatedData);
  };

  return (
    <div id="receipt-details-container" className="space-y-6">
      {/* Navigation Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Validasi Hasil OCR</h2>
            <p className="text-xs text-slate-500 font-semibold font-mono">Toko: {receipt.storeName || "TIDAK TERDETEKSI"}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onDelete(receipt.id)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-100 transition"
          >
            <Trash2 className="h-4 w-4" />
            Hapus Nota
          </button>
          
          <button
            onClick={handleApplySave}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 shadow-md shadow-slate-950/10 active:translate-y-0.5 transition-all"
          >
            <Save className="h-4 w-4" />
            Simpan Perubahan
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 leading-normal">
        {/* Left column: Receipt interactive preview with OCR Segment Highlights */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <span className="text-xs font-black uppercase text-slate-400 flex items-center gap-2 leading-none">
                <Eye className="h-4 w-4" />
                Ditinjau Dari Gambar Nota
              </span>
              
              {/* Toggle Highlight overlay */}
              <button
                onClick={() => setShowOcrOverlay(!showOcrOverlay)}
                className={`rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border transition-colors ${
                  showOcrOverlay 
                    ? "bg-slate-900 border-slate-950 text-white" 
                    : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                {showOcrOverlay ? "Sembunyikan Overlay" : "Tampilkan Overlay"}
              </button>
            </div>

            {/* Simulated Receipt Image viewport & overlays */}
            <div className="relative overflow-hidden rounded-xl bg-slate-100/50 border border-slate-200 flex items-center justify-center p-3">
              {receipt.imageUri ? (
                <div className="relative w-full max-w-xs h-auto">
                  <img 
                    src={receipt.imageUri} 
                    alt="Scanned original" 
                    className="w-full h-auto rounded-md shadow-xs select-none object-contain"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Bounding Boxes Layer mapping */}
                  {showOcrOverlay && receipt.ocrSegments && receipt.ocrSegments.map((segment) => {
                    const [top, left, width, height] = segment.boundingBox;
                    const isActive = activeSegmentId === segment.id;
                    return (
                      <div
                        key={segment.id}
                        onMouseEnter={() => setActiveSegmentId(segment.id)}
                        onMouseLeave={() => setActiveSegmentId(null)}
                        style={{
                          top: `${top}%`,
                          left: `${left}%`,
                          width: `${width}%`,
                          height: `${height}%`,
                        }}
                        className={`absolute border transition-all duration-150 cursor-pointer ${
                          isActive 
                            ? "bg-amber-400/25 border-amber-600 ring-2 ring-amber-400 shadow-sm" 
                            : "bg-teal-400/10 border-teal-500/50 hover:bg-teal-400/25 hover:border-teal-500"
                        }`}
                        title={`${segment.text} (conf: ${Math.round(segment.confidence * 100)}%)`}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="h-72 w-full flex flex-col items-center justify-center text-slate-400 text-xs">
                  <FileText className="h-10 w-10 text-slate-300 mb-2" />
                  Gambar pengidentifikasi nota tidak disimpan
                </div>
              )}
            </div>

            {/* OCR log segment details when hovering highlight in Indonesian */}
            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Metadata Detektor PaddleOCR</span>
              
              {activeSegmentId ? (
                (() => {
                  const match = receipt.ocrSegments?.find(s => s.id === activeSegmentId);
                  return match ? (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }}
                      className="mt-2 space-y-1"
                    >
                      <p className="text-xs font-mono font-bold text-slate-800 break-words">"{match.text}"</p>
                      <div className="flex gap-4 mt-1">
                        <span className="text-[10px] font-bold text-slate-500">
                          Akurasi: <span className="text-emerald-600 font-mono font-bold">{(match.confidence * 100).toFixed(1)}%</span>
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">
                          Koordinat: <span className="font-mono">{match.boundingBox.map(Math.round).join(", ")}</span>
                        </span>
                      </div>
                    </motion.div>
                  ) : null;
                })()
              ) : (
                <p className="mt-1 text-xs text-slate-400 font-medium">
                  Arahkan kursor Anda ke area berwarna hijau pada nota untuk menginspeksi hasil OCR draf segmen mentah.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Interactive parsed receipt Form structure */}
        <div id="receipt-parsed-interactive-form" className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs space-y-6">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Informasi Umum Struk Belanja
            </h3>

            {/* Grid of Store, address cards */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 leading-normal">
                <label className="text-xs font-bold text-slate-600">Nama Toko Belanjaan</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-sm font-semibold text-slate-800 placeholder-slate-400 outline-hidden hover:border-slate-300 focus:border-slate-800 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1.5 leading-normal">
                <label className="text-xs font-bold text-slate-600 font-sans">No. Telepon Toko/Market</label>
                <input
                  type="text"
                  value={storePhone}
                  onChange={(e) => setStorePhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-sm font-bold text-slate-800 placeholder-slate-400 outline-hidden hover:border-slate-300 focus:border-slate-800 focus:bg-white transition"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5 leading-normal">
                <label className="text-xs font-bold text-slate-600">Alamat Lengkap Cabang Toko</label>
                <input
                  type="text"
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-sm font-semibold text-slate-800 placeholder-slate-400 outline-hidden hover:border-slate-300 focus:border-slate-800 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Transaction specifications (Date, Time, Code, Method) */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 leading-normal">
                <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Tanggal Belanja
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-sm font-semibold text-slate-800 outline-hidden hover:border-slate-300 focus:border-slate-800 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1.5 leading-normal">
                <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Jam Waktu Transaksi
                </label>
                <input
                  type="text"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="HH:MM"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-sm font-semibold text-slate-800 outline-hidden hover:border-slate-300 focus:border-slate-800 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1.5 leading-normal">
                <label className="text-xs font-bold text-slate-600">No. Nota / Receipt ID</label>
                <input
                  type="text"
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-sm font-semibold text-slate-800 placeholder-slate-400 outline-hidden hover:border-slate-300 focus:border-slate-800 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1.5 leading-normal">
                <label className="text-xs font-bold text-slate-600">Metode Pembayaran</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-sm font-semibold text-slate-800 outline-hidden hover:border-slate-300 focus:border-slate-800 focus:bg-white transition"
                >
                  <option value="Tunai / Cash">Tunai / Cash</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="QRIS / G-Pay">QRIS / G-Pay</option>
                  <option value="Transfer Bank">Transfer Bank</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table list of parsed shopping items */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <List className="h-4.5 w-4.5" />
                Item yang Dibeli
              </h3>
              <button
                type="button"
                onClick={handleAddNewItem}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 hover:border-slate-800 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 active:translate-y-0.5 transition"
              >
                <Plus className="h-4 w-4" />
                Tambah Barang
              </button>
            </div>

            {/* Line items loop list style */}
            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
              {items.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Belum ada item belanjaan terdaftar
                </div>
              ) : (
                items.map((item, index) => (
                  <div key={item.id} className="relative rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
                    {/* Position index badge & delete option */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black bg-slate-200/80 text-slate-700 h-5 w-5 rounded-full flex items-center justify-center font-mono">
                        {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Inputs parameters */}
                    <div className="grid gap-3 sm:grid-cols-12 leading-normal">
                      {/* Name of item */}
                      <div className="sm:col-span-5 space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-400">Nama Barang</span>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleItemChange(item.id, "name", e.target.value)}
                          className="w-full rounded-md border border-slate-200 bg-white p-1.5 text-xs font-semibold text-slate-800"
                        />
                      </div>

                      {/* Item categories */}
                      <div className="sm:col-span-3 space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-400">Kategori</span>
                        <select
                          value={item.category}
                          onChange={(e) => handleItemChange(item.id, "category", e.target.value)}
                          className="w-full rounded-md border border-slate-200 bg-white p-1.5 text-xs font-semibold text-slate-700"
                        >
                          <option value="Makanan">Makanan</option>
                          <option value="Minuman">Minuman</option>
                          <option value="Kebutuhan Rumah">Kebutuhan Rumah</option>
                          <option value="Elektronik">Elektronik</option>
                          <option value="Pakaian">Pakaian</option>
                          <option value="Kesehatan/Kecantikan">Kesehatan/Kecantikan</option>
                          <option value="Lainnya">Lainnya</option>
                        </select>
                      </div>

                      {/* Quantity amount to buy */}
                      <div className="sm:col-span-1.5 space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-400">Kuantitas</span>
                        <input
                          type="number"
                          value={item.quantity}
                          min="1"
                          onChange={(e) => handleItemChange(item.id, "quantity", parseInt(e.target.value) || 1)}
                          className="w-full rounded-md border border-slate-200 bg-white p-1.5 text-xs font-bold text-center text-slate-800 font-mono"
                        />
                      </div>

                      {/* Price per Unit base */}
                      <div className="sm:col-span-2.5 space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-400">Harga Satuan (Rp)</span>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                          className="w-full rounded-md border border-slate-200 bg-white p-1.5 text-xs font-extrabold text-right text-slate-800 font-mono"
                        />
                      </div>
                    </div>

                    {/* Quick final summary display of item */}
                    <div className="flex justify-end text-xs font-bold text-slate-500 pt-1 border-t border-slate-100 italic">
                      Total: <span className="text-slate-900 font-mono font-black ml-1">Rp {(item.quantity * item.unitPrice).toLocaleString("id-ID")}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Dynamic Billing math panels */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Calculator className="h-4.5 w-4.5" />
              Perhitungan Rincian Biaya
            </h3>

            <div className="space-y-3.5 leading-normal">
              {/* Gross items subtotal text */}
              <div className="flex justify-between text-xs font-bold text-slate-500">
                <span>Subtotal Barang</span>
                <span className="font-mono text-slate-900">Rp {subtotal.toLocaleString("id-ID")}</span>
              </div>

              {/* Tax PPN (Indonesia's standardized 11%) ratio */}
              <div className="grid gap-2 sm:grid-cols-2 items-center text-xs font-bold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Percent className="h-3.5 w-3.5" />
                  Pajak Pertambahan Nilai (PPN)
                </span>
                <input
                  type="number"
                  value={tax}
                  onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                  className="max-w-[150px] rounded-lg border border-slate-200 bg-slate-50/50 p-1.5 text-xs font-bold text-right text-slate-800 font-mono sm:justify-self-end w-full"
                />
              </div>

              {/* Extras/Service Charge charges input fields */}
              <div className="grid gap-2 sm:grid-cols-2 items-center text-xs font-bold text-slate-500">
                <span>Biaya Layanan / Tambahan</span>
                <input
                  type="number"
                  value={serviceCharge}
                  onChange={(e) => setServiceCharge(parseFloat(e.target.value) || 0)}
                  className="max-w-[150px] rounded-lg border border-slate-200 bg-slate-50/50 p-1.5 text-xs font-bold text-right text-slate-800 font-mono sm:justify-self-end w-full"
                />
              </div>

              {/* Discount deduction rates */}
              <div className="grid gap-2 sm:grid-cols-2 items-center text-xs font-bold text-slate-500">
                <span>Potongan Harga / Diskon Belanda</span>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="max-w-[150px] rounded-lg border border-slate-200 bg-slate-50/50 p-1.5 text-xs font-bold text-right text-rose-600 font-mono sm:justify-self-end w-full"
                />
              </div>

              <div className="h-px bg-slate-100 my-4" />

              {/* Visual Ticket Grand total calculation */}
              <div className="flex items-center justify-between rounded-xl bg-slate-900 text-white p-4">
                <span className="text-sm font-black uppercase tracking-wider">TOTAL PEMBAYARAN</span>
                <span className="text-xl font-black font-mono">Rp {grandTotal.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>

          {/* Notes textual input panels */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs leading-normal">
            <span className="text-xs font-extrabold text-slate-600 uppercase tracking-widest block mb-1">Catatan Tambahan / Slogan</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Tambahkan rincian belanja, garansi, atau catatan promosi..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-bold text-slate-800 outline-hidden hover:border-slate-300 focus:border-slate-800 focus:bg-white transition resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
