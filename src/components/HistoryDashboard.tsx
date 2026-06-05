/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { ReceiptData, CategorySpending } from "../types";
import { 
  TrendingUp, 
  Plus, 
  Search, 
  Calendar, 
  MapPin, 
  DollarSign, 
  FileText, 
  ShoppingBag,
  ArrowRight,
  ChevronRight,
  Filter,
  Layers
} from "lucide-react";
import { motion } from "motion/react";

interface HistoryDashboardProps {
  receipts: ReceiptData[];
  onSelectReceipt: (receipt: ReceiptData) => void;
  onStartNewScan: () => void;
}

export default function HistoryDashboard({ receipts, onSelectReceipt, onStartNewScan }: HistoryDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  const [dateFilter, setDateFilter] = useState<{ start: string; end: string }>({ start: "", end: "" });

  // 1. Calculate General Aggregates
  const totalSpending = useMemo(() => {
    return receipts.reduce((sum, r) => sum + r.grandTotal, 0);
  }, [receipts]);

  const averageSpending = useMemo(() => {
    return receipts.length > 0 ? Math.round(totalSpending / receipts.length) : 0;
  }, [receipts, totalSpending]);

  const highestReceipt = useMemo(() => {
    if (receipts.length === 0) return 0;
    return Math.max(...receipts.map(r => r.grandTotal));
  }, [receipts]);

  // Kategori configuration
  const categoryConfig: Record<string, { color: string; bg: string }> = {
    "Makanan": { color: "text-amber-600 bg-amber-50 border-amber-200", bg: "bg-amber-500" },
    "Minuman": { color: "text-sky-600 bg-sky-50 border-sky-200", bg: "bg-sky-500" },
    "Kebutuhan Rumah": { color: "text-emerald-600 bg-emerald-50 border-emerald-200", bg: "bg-emerald-500" },
    "Elektronik": { color: "text-indigo-600 bg-indigo-50 border-indigo-200", bg: "bg-indigo-500" },
    "Pakaian": { color: "text-purple-600 bg-purple-50 border-purple-200", bg: "bg-purple-500" },
    "Kesehatan/Kecantikan": { color: "text-rose-600 bg-rose-50 border-rose-200", bg: "bg-rose-500" },
    "Lainnya": { color: "text-slate-600 bg-slate-50 border-slate-200", bg: "bg-slate-500" }
  };

  // 2. Category Analytics
  const categorySpending = useMemo(() => {
    const breakdown: Record<string, number> = {
      "Makanan": 0,
      "Minuman": 0,
      "Kebutuhan Rumah": 0,
      "Elektronik": 0,
      "Pakaian": 0,
      "Kesehatan/Kecantikan": 0,
      "Lainnya": 0
    };

    receipts.forEach(r => {
      r.items.forEach(item => {
        const cat = item.category || "Lainnya";
        const amt = item.totalPrice || 0;
        if (breakdown[cat] !== undefined) {
          breakdown[cat] += amt;
        } else {
          breakdown["Lainnya"] += amt;
        }
      });
    });

    const activeTotal = Object.values(breakdown).reduce((a, b) => a + b, 0);

    return Object.entries(breakdown)
      .map(([category, amount]) => {
        const percentage = activeTotal > 0 ? Math.round((amount / activeTotal) * 100) : 0;
        return {
          category,
          amount,
          percentage,
          color: categoryConfig[category]?.bg || "bg-slate-400"
        } as CategorySpending;
      })
      .filter(item => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [receipts]);

  // 3. Filtering Logic
  const filteredReceipts = useMemo(() => {
    return receipts.filter(receipt => {
      // Name & item match
      const matchesSearch = 
        receipt.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        receipt.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));

      // Category match
      const matchesCategory = 
        selectedCategory === "Semua" ||
        receipt.items.some(item => item.category === selectedCategory);

      // Date range match
      let matchesDate = true;
      if (receipt.date) {
        if (dateFilter.start && receipt.date < dateFilter.start) matchesDate = false;
        if (dateFilter.end && receipt.date > dateFilter.end) matchesDate = false;
      } else if (dateFilter.start || dateFilter.end) {
        matchesDate = false;
      }

      return matchesSearch && matchesCategory && matchesDate;
    }).sort((a, b) => {
      // Sort newest dates first
      const dateA = a.date ? `${a.date}T${a.time || "00:00"}` : "";
      const dateB = b.date ? `${b.date}T${b.time || "00:00"}` : "";
      return dateB.localeCompare(dateA);
    });
  }, [receipts, searchTerm, selectedCategory, dateFilter]);

  // 4. Spending Trend Data (by last 6 months)
  const monthlySpendingList = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
    const now = new Date();
    const result: { label: string; amount: number; year: number; index: number }[] = [];

    // Let's create an entry for the last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      result.push({
        label: months[d.getMonth()],
        year: d.getFullYear(),
        index: d.getMonth(),
        amount: 0
      });
    }

    receipts.forEach(r => {
      if (r.date) {
        const dObj = new Date(r.date);
        const mIdx = dObj.getMonth();
        const yVal = dObj.getFullYear();

        const match = result.find(res => res.index === mIdx && res.year === yVal);
        if (match) {
          match.amount += r.grandTotal;
        }
      }
    });

    return result;
  }, [receipts]);

  const maxMonthlyAmount = useMemo(() => {
    const max = Math.max(...monthlySpendingList.map(m => m.amount));
    return max > 0 ? max : 100000;
  }, [monthlySpendingList]);

  return (
    <div id="history-dashboard-container" className="space-y-8">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Arsip Nota Belanja
          </h1>
          <p className="mt-2 text-slate-500">
            Analisis pengeluaran belanja berdasarkan pemindaian OCR cepat dan kategorisasi otomatis.
          </p>
        </div>
        <button
          id="btn-trigger-scan"
          onClick={onStartNewScan}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800 hover:shadow-slate-900/20 active:translate-y-0.5 transition-all w-full md:w-auto"
        >
          <Plus className="h-5 w-5" />
          Scan Nota Baru
        </button>
      </div>

      {receipts.length === 0 ? (
        /* Expanded Empty State */
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center shadow-xs"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
            <FileText className="h-8 w-8" />
          </div>
          <h3 className="mt-6 text-xl font-bold text-slate-900">Belum Ada Nota Tersimpan</h3>
          <p className="mt-2 max-w-md text-sm text-slate-500">
            Ambil foto nota pembelanjaan Anda secara langsung atau gunakan gambar yang ada untuk mengekstrak data item belanja menggunakan AI OCR Paddle.
          </p>
          <button
            onClick={onStartNewScan}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition"
          >
            Mulai Pindai Sekarang
            <ArrowRight className="h-4 w-4" />
          </button>
        </motion.div>
      ) : (
        <>
          {/* Dashboard Cards Grid */}
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs leading-normal">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Pengeluaran</span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900">
                  Rp {totalSpending.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 rounded-lg w-fit">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Terbuat dari {receipts.length} pemindaian nota</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs leading-normal">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Rata-Rata per Nota</span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900">
                  Rp {averageSpending.toLocaleString("id-ID")}
                </span>
              </div>
              <p className="mt-4 text-xs text-slate-500">
                Nilai belanja reguler yang dihabiskan per kunjungan
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs leading-normal">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pembelian Tertinggi</span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900">
                  Rp {highestReceipt.toLocaleString("id-ID")}
                </span>
              </div>
              <p className="mt-4 text-xs text-slate-500">
                Jumlah transaksi maksimal dalam satu kali transaksi
              </p>
            </div>
          </div>

          {/* Graphical Analytics Section */}
          <div className="grid gap-6 lg:grid-cols-12">
            {/* 1. Bar Chart Spending in Last 6 Months */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs lg:col-span-7">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900">Tren Belanja Bulanan</h2>
                <span className="text-[11px] font-semibold uppercase text-slate-400">6 Bulan Terakhir</span>
              </div>
              
              <div className="mt-6 flex h-60 items-end justify-between gap-2 px-2">
                {monthlySpendingList.map((month, idx) => {
                  const hPercentage = Math.round((month.amount / maxMonthlyAmount) * 100);
                  return (
                    <div key={idx} className="group flex flex-col items-center flex-1">
                      {/* Tooltip on hover */}
                      <div className="pointer-events-none mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-900 text-white text-[10px] py-1 px-2 rounded-md shadow-lg -translate-y-1 absolute z-10 font-mono">
                        Rp {month.amount.toLocaleString("id-ID")}
                      </div>
                      
                      {/* Interactive Bar */}
                      <div className="w-full bg-slate-100 rounded-md overflow-hidden h-44 flex items-end">
                        <motion.div 
                          className="w-full bg-slate-900 rounded-md group-hover:bg-slate-700 transition-colors"
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(4, hPercentage)}%` }}
                          transition={{ duration: 0.8, delay: idx * 0.1, ease: "easeOut" }}
                        />
                      </div>
                      <span className="mt-2.5 text-xs font-bold text-slate-500">{month.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Category Distribution */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs lg:col-span-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900">Distribusi Kategori</h2>
                <span className="text-[11px] font-semibold uppercase text-slate-400">Berdasarkan Item</span>
              </div>

              <div className="mt-6 space-y-4">
                {categorySpending.length === 0 ? (
                  <div className="flex h-44 items-center justify-center text-slate-400 text-sm">
                    Kategori tidak teridentifikasi
                  </div>
                ) : (
                  categorySpending.map((item, idx) => (
                    <div key={idx} className="space-y-1.5 leading-normal">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                          {item.category}
                        </span>
                        <span>{item.percentage}% (Rp {item.amount.toLocaleString("id-ID")})</span>
                      </div>
                      
                      {/* Progress Bar background */}
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <motion.div 
                          className={`h-full rounded-full ${item.color}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${item.percentage}%` }}
                          transition={{ duration: 0.8, delay: idx * 0.1 }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Filtering and Receipts Table Section */}
          <div className="rounded-2xl border border-slate-100 bg-white shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h2 className="text-lg font-bold text-slate-900">Daftar Transaksi Scan</h2>
                
                {/* Active counters */}
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  Menampilkan {filteredReceipts.length} dari {receipts.length} nota
                </span>
              </div>

              {/* Filters Toolbar */}
              <div className="grid gap-3 sm:grid-cols-12">
                {/* Search query */}
                <div className="relative sm:col-span-5">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari toko atau item barang..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm font-medium text-slate-800 placeholder-slate-400 outline-hidden hover:border-slate-300 focus:border-slate-800 focus:bg-white focus:ring-1 focus:ring-slate-800 transition"
                  />
                </div>

                {/* Categories filtering */}
                <div className="relative sm:col-span-3">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-sm font-medium text-slate-800 outline-hidden hover:border-slate-300 focus:border-slate-800 focus:bg-white focus:ring-1 focus:ring-slate-800 transition"
                  >
                    <option value="Semua">Semua Kategori</option>
                    <option value="Makanan">Makanan</option>
                    <option value="Minuman">Minuman</option>
                    <option value="Kebutuhan Rumah">Kebutuhan Rumah</option>
                    <option value="Elektronik">Elektronik</option>
                    <option value="Pakaian">Pakaian</option>
                    <option value="Kesehatan/Kecantikan">Kesehatan/Kecantikan</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                {/* Calendar date ranges */}
                <div className="flex items-center gap-2 sm:col-span-4">
                  <input
                    type="date"
                    value={dateFilter.start}
                    onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2 text-xs font-semibold text-slate-700 outline-hidden hover:border-slate-300 focus:border-slate-800 focus:bg-white transition"
                  />
                  <span className="text-slate-400 text-xs text-center font-bold">s/d</span>
                  <input
                    type="date"
                    value={dateFilter.end}
                    onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2 text-xs font-semibold text-slate-700 outline-hidden hover:border-slate-300 focus:border-slate-800 focus:bg-white transition"
                  />
                </div>
              </div>
            </div>

            {/* List / Table Area */}
            <div className="divide-y divide-slate-100 overflow-x-auto">
              {filteredReceipts.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-sm">
                  Tidak ada nota yang cocok dengan pencarian dan filter Anda.
                </div>
              ) : (
                filteredReceipts.map((receipt) => (
                  <div
                    key={receipt.id}
                    onClick={() => onSelectReceipt(receipt)}
                    className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 hover:bg-slate-50 cursor-pointer transition relative gap-4"
                  >
                    {/* Store Title & Items preview */}
                    <div className="flex gap-4 items-start leading-normal">
                      {/* App icon helper for stores */}
                      <div className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 border border-slate-200 text-slate-600 group-hover:bg-white group-hover:border-slate-300 transition-colors">
                        <ShoppingBag className="h-5 w-5" />
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-bold text-slate-800 group-hover:text-slate-900 transition">
                            {receipt.storeName}
                          </h4>
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-0.5 text-[10px] font-black text-slate-600 uppercase tracking-wide">
                            {receipt.paymentMethod || "Belum Bayar"}
                          </span>
                        </div>
                        
                        <p className="text-xs text-slate-400 max-w-sm truncate whitespace-nowrap overflow-hidden">
                          {receipt.items.map(it => `${it.quantity}x ${it.name}`).join(", ")}
                        </p>
                        
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate max-w-xs">{receipt.storeAddress || "Alamat tidak tersedia"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Price, date, action row */}
                    <div className="flex items-center gap-6 self-end sm:self-center">
                      <div className="text-right leading-normal">
                        <div className="text-base font-black text-slate-900">
                          Rp {receipt.grandTotal.toLocaleString("id-ID")}
                        </div>
                        <div className="mt-1 flex items-center gap-1 justify-end text-[11px] text-slate-400 font-semibold font-mono">
                          <Calendar className="h-3 w-3" />
                          <span>{receipt.date || "Tanpa Tanggal"}</span>
                          {receipt.time && <span className="opacity-60">· {receipt.time}</span>}
                        </div>
                      </div>
                      
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 group-hover:text-slate-900 group-hover:border-slate-800 transition">
                        <ChevronRight className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
