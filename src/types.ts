/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface OcrSegment {
  id: string;
  text: string;
  confidence: number;
  // Bounding box represented as normalized percentages [top, left, width, height] (0-100)
  boundingBox: [number, number, number, number];
}

export interface ReceiptItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category: string; // e.g., Makanan, Kebutuhan Rumah, Elektronik, Pakaian, Lainnya
}

export interface ReceiptData {
  id: string;
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
  date?: string; // Format: YYYY-MM-DD
  time?: string; // Format: HH:MM
  receiptNumber?: string;
  paymentMethod?: string; // Cash, Debit, Credit, QRIS, dll.
  items: ReceiptItem[];
  subtotal: number;
  tax: number; // PPN
  serviceCharge?: number;
  discount?: number;
  grandTotal: number;
  notes?: string;
  rawOcrText?: string;
  imageUri?: string; // Base64 or local blob URL of the receipt image
  ocrSegments?: OcrSegment[]; // Est. bounding boxes
}

export interface MonthlySpending {
  month: string; // e.g., "Jan", "Feb"
  amount: number;
}

export interface CategorySpending {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}
