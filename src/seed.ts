/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReceiptData } from "./types";

// Helper to generate a styled receipt vector as a raw Data URI SVG
function createReceiptSvg(storeName: string, items: string[], total: string, date: string): string {
  const itemsText = items.map((it, idx) => 
    `<text x="40" y="${180 + idx * 30}" font-family="'JetBrains Mono', monospace" font-size="11" fill="#334155">${it}</text>`
  ).join("");

  const svgStr = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 350 500" width="100%" height="100%">
      <rect x="0" y="0" width="350" height="500" fill="#f8fafc" />
      <rect x="20" y="20" width="310" height="460" rx="12" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" />
      
      <!-- Fold paper shadows -->
      <path d="M 20 20 L 330 20 L 330 35 L 20 35 Z" fill="#f1f5f9" opacity="0.5"/>
      <path d="M 20 460 L 330 460 L 330 480 L 20 480 Z" fill="#cbd5e1" opacity="0.3"/>
      
      <!-- Dotted Top tear -->
      <line x1="20" y1="40" x2="330" y2="40" stroke="#94a3b8" stroke-width="2" stroke-dasharray="6,6" />
      
      <!-- Store Header -->
      <text x="175" y="80" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="18" fill="#0f172a" text-anchor="middle">${storeName}</text>
      <text x="175" y="105" font-family="'Plus Jakarta Sans', sans-serif" font-size="9" fill="#64748b" text-anchor="middle">JL. RAYA BELANJA NO. 88, JAKARTA</text>
      <text x="175" y="120" font-family="'Plus Jakarta Sans', sans-serif" font-size="9" fill="#64748b" text-anchor="middle">TELP: (021) 555-9080</text>
      
      <line x1="40" y1="145" x2="310" y2="145" stroke="#cbd5e1" stroke-width="1" />
      
      <!-- Items Table -->
      ${itemsText}
      
      <line x1="40" y1="360" x2="310" y2="360" stroke="#cbd5e1" stroke-dasharray="4,4" />
      
      <!-- Totals -->
      <text x="40" y="390" font-family="'Plus Jakarta Sans', sans-serif" font-weight="700" font-size="12" fill="#475569">TOTAL AKHIR</text>
      <text x="310" y="390" font-family="'JetBrains Mono', monospace" font-weight="800" font-size="14" fill="#0f172a" text-anchor="end">${total}</text>
      
      <text x="40" y="415" font-family="'Plus Jakarta Sans', sans-serif" font-size="10" fill="#94a3b8">TANGGAL</text>
      <text x="310" y="415" font-family="'JetBrains Mono', monospace" font-size="10" fill="#475569" text-anchor="end">${date}</text>
      
      <!-- Footer messages -->
      <text x="175" y="450" font-family="'Plus Jakarta Sans', sans-serif" font-size="9" fill="#94a3b8" font-style="italic" text-anchor="middle">*** TERIMA KASIH ATAS KUNJUNGAN ANDA ***</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svgStr)}`;
}

export const sampleReceiptsData: ReceiptData[] = [
  {
    id: "sample-1",
    storeName: "Superindo Swalayan",
    storeAddress: "Jl. Boulevard Artha Gading No. 8, Kelapa Gading, Jakarta Utara",
    storePhone: "021-4585-1234",
    date: "2026-06-01",
    time: "14:15",
    receiptNumber: "INV-90231",
    paymentMethod: "Debit BCA",
    items: [
      { id: "s1-i1", name: "Susu UHT Full Cream 1L", quantity: 2, unitPrice: 18500, totalPrice: 37000, category: "Minuman" },
      { id: "s1-i2", name: "Minyak Goreng Sawit 2L", quantity: 1, unitPrice: 38500, totalPrice: 38500, category: "Kebutuhan Rumah" },
      { id: "s1-i3", name: "Roti Tawar Kupas Lembut", quantity: 1, unitPrice: 16500, totalPrice: 16500, category: "Makanan" }
    ],
    subtotal: 92000,
    tax: 10120, // 11% PPN
    serviceCharge: 0,
    discount: 5000,
    grandTotal: 97120,
    notes: "Terima Kasih, Selamat Datang Kembali!",
    imageUri: createReceiptSvg(
      "SUPERINDO", 
      ["2x Susu UHT 1L    Rp 37.000", "1x Minyak Goreng    Rp 38.500", "1x Roti Tawar Kupas Rp 16.500"], 
      "Rp 97.120", 
      "2026-06-01"
    ),
    ocrSegments: [
      { id: "s1-seg1", text: "SUPERINDO", confidence: 0.99, boundingBox: [8, 20, 10, 60] },
      { id: "s1-seg2", text: "Susu UHT Full Cream 1L", confidence: 0.96, boundingBox: [35, 12, 5, 55] },
      { id: "s1-seg3", text: "Rp 37.000", confidence: 0.95, boundingBox: [35, 68, 5, 20] },
      { id: "s1-seg4", text: "Minyak Goreng Sawit 2L", confidence: 0.96, boundingBox: [41, 12, 5, 55] },
      { id: "s1-seg5", text: "Rp 38.500", confidence: 0.94, boundingBox: [41, 68, 5, 20] },
      { id: "s1-seg6", text: "Roti Tawar Kupas Lembut", confidence: 0.98, boundingBox: [47, 12, 5, 55] },
      { id: "s1-seg7", text: "Rp 16.500", confidence: 0.97, boundingBox: [47, 68, 5, 20] },
      { id: "s1-seg8", text: "TOTAL AKHIR: Rp 97.120", confidence: 0.99, boundingBox: [76, 12, 6, 75] }
    ]
  },
  {
    id: "sample-2",
    storeName: "HokBen Kemang",
    storeAddress: "Jl. Kemang Raya No. 12, Mampang, Jakarta Selatan",
    storePhone: "021-719-7561",
    date: "2026-06-03",
    time: "19:40",
    receiptNumber: "INV-6119",
    paymentMethod: "QRIS Gopay",
    items: [
      { id: "s2-i1", name: "Premium Bento Set A", quantity: 1, unitPrice: 62000, totalPrice: 62000, category: "Makanan" },
      { id: "s2-i2", name: "Ocha Cold Refillable", quantity: 2, unitPrice: 12000, totalPrice: 24000, category: "Minuman" },
      { id: "s2-i3", name: "Egg Chicken Roll (3pcs)", quantity: 1, unitPrice: 28000, totalPrice: 28000, category: "Makanan" }
    ],
    subtotal: 114000,
    tax: 12540,
    serviceCharge: 5000, // Resto service charge
    discount: 0,
    grandTotal: 131540,
    notes: "Terima Kasih Atas Kunjungan Anda.",
    imageUri: createReceiptSvg(
      "HOKBEN KEMANG", 
      ["1x Bento Set A      Rp 62.000", "2x Ocha Cold        Rp 24.000", "1x Chicken Roll     Rp 28.000"], 
      "Rp 131.540", 
      "2026-06-03"
    ),
    ocrSegments: [
      { id: "s2-seg1", text: "HOKBEN KEMANG", confidence: 0.99, boundingBox: [8, 20, 10, 60] },
      { id: "s2-seg2", text: "Bento Set A - Rp 62.000", confidence: 0.93, boundingBox: [35, 12, 5, 75] },
      { id: "s2-seg3", text: "Ocha Cold - Rp 24.000", confidence: 0.95, boundingBox: [41, 12, 5, 75] },
      { id: "s2-seg4", text: "Chicken Roll - Rp 28.000", confidence: 0.94, boundingBox: [47, 12, 5, 75] },
      { id: "s2-seg5", text: "GRAND TOTAL: Rp 131.540", confidence: 0.99, boundingBox: [76, 12, 6, 75] }
    ]
  },
  {
    id: "sample-3",
    storeName: "Ace Hardware Kelapa Gading",
    storeAddress: "Mall Artha Gading Lt. GF, Jakarta Utara",
    storePhone: "021-4586-3000",
    date: "2026-06-04",
    time: "11:05",
    receiptNumber: "ACE-98213",
    paymentMethod: "Credit Card",
    items: [
      { id: "s3-i1", name: "Lampu LED Bulb 9W Glow", quantity: 3, unitPrice: 32000, totalPrice: 96000, category: "Elektronik" },
      { id: "s3-i2", name: "Obeng Set Cushion Grip", quantity: 1, unitPrice: 135000, totalPrice: 135000, category: "Lainnya" }
    ],
    subtotal: 231000,
    tax: 25410,
    serviceCharge: 0,
    discount: 10000,
    grandTotal: 246410,
    notes: "Barang Yang Sudah Dibeli Tidak Dapat Ditukar.",
    imageUri: createReceiptSvg(
      "ACE HARDWARE", 
      ["3x LED Bulb 9W      Rp 96.000", "1x Obeng set Cushion Rp 135.000"], 
      "Rp 246.410", 
      "2026-06-04"
    ),
    ocrSegments: [
      { id: "s3-seg1", text: "ACE HARDWARE", confidence: 0.99, boundingBox: [8, 20, 10, 60] },
      { id: "s3-seg2", text: "LED Bulb 9W - Rp 96.000", confidence: 0.97, boundingBox: [35, 12, 5, 75] },
      { id: "s3-seg3", text: "Obeng set - Rp 135.000", confidence: 0.95, boundingBox: [41, 12, 5, 75] },
      { id: "s3-seg4", text: "TOTAL: Rp 246.410", confidence: 0.99, boundingBox: [76, 12, 6, 75] }
    ]
  }
];
