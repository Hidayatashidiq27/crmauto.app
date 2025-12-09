import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/clerk-react";
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from './supabaseClient';
import { db } from "./firebase"; 
import { doc, setDoc, getDoc } from "firebase/firestore";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, Sector, ComposedChart, AreaChart, Area, ScatterChart, Scatter, LabelList } from 'recharts';
import { TrendingUp, MapPin, LayoutDashboard, AlertTriangle, CheckCircle, Upload, Users, DollarSign, List, Globe, Boxes, Award, Calendar, Layers, PlusCircle, Trash2, GitCommit, Target, Filter, Download, Clock, Repeat, MessageSquare, Copy, Info, History, CreditCard, UserCheck, Landmark, Grid3X3, Truck, HelpCircle, FileText, XCircle, Zap, Wallet, ShoppingBag, Activity, PieChart as PieChartIcon, BarChart2, Package, Search, RefreshCw, ArrowRight, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Check, TrendingDown, ClipboardCopy, Megaphone, MousePointer, Eye, Percent, Coins, Star, BookOpen, UserPlus, Heart, Share2, Shield, Gift, Smile, Settings, Save, RotateCcw, Lock, Menu, X, User, Sparkles } from 'lucide-react';
import myLogo from "./assets/logocrmauto.png";

/**
 * Data CSV fallback (Sales)
 */
const fallbackCsvData = `order_id;business_name;customer_type;store;order_status;payment_status;name;phone;email;address;province;city;subdistrict;postal_code;payment_method;epayment_provider;pg_trx_id;pg_reference_id;draft_time;pending_time;confirmed_time;in_process_time;ready_time;canceled_time;shipped_time;completed_time;rts_time;closed_time;unpaid_time;paid_time;conflict_time;transfer_time;handler;is_from_form;advertiser;utm_source;utm_medium;utm_campaign;utm_content;utm_term;form;page;channel_name;financial_entity;payment_account_name;payment_account_number;gross_revenue;payment_fee;scalev_fee;net_payment_revenue;unique_code_discount;net_revenue;product_price;product_price_bt;product_discount;product_discount_bt;other_income;other_income_bt;reseller_product_price;reseller_product_price_bt;cogs;cogs_bt;tax_rate;shipping_cost;shipping_discount;discount_code_discount;courier;courier_service;courier_aggregator_code;courier_status;shipment_receipt;origin_business_name;origin;discount_code_code;discount_code_applied_to;weight;quantity;platform;external_id;is_purchase_fb;is_purchase_tiktok;is_purchase_kwai;notes;tags
`;

// Konstanta Nama Kolom (Sales)
const COL_ORDER_ID = 'order_id'; 
const COL_UTM_SOURCE = 'utm_source';
const COL_UTM_MEDIUM = 'utm_medium';
const COL_NET_REVENUE = 'net_revenue';
const COL_GROSS_REVENUE = 'gross_revenue'; 
// PROFITABILITY COLUMNS
const COL_COGS = 'cogs'; 
const COL_PAYMENT_FEE = 'payment_fee';
const COL_SHIPPING_COST = 'shipping_cost';
const COL_SHIPPING_DISCOUNT = 'shipping_discount';
const COL_PRODUCT_DISCOUNT = 'product_discount'; 
const COL_OTHER_INCOME = 'other_income'; 

const COL_PROVINCE = 'province';
const COL_CITY = 'city'; 
const COL_SUBDISTRICT = 'subdistrict'; 
const COL_CUSTOMER_TYPE = 'customer_type';
const COL_NAME = 'name'; 
const COL_CONFIRMED_TIME = 'confirmed_time'; 
const COL_PHONE = 'phone';       
const COL_ADDRESS = 'address';
const COL_PAYMENT_METHOD = 'payment_method';
const COL_FINANCIAL_ENTITY = 'financial_entity'; 
const COL_COURIER = 'courier'; 
const COL_NOTES = 'notes';

// Konstanta Nama Kolom (Meta Ads)
const ADS_CAMPAIGN_NAME = 'campaign_name';
const ADS_AMOUNT_SPENT = 'amount_spent_idr';
const ADS_IMPRESSIONS = 'impressions';
const ADS_LINK_CLICKS = 'link_clicks';
const ADS_PURCHASES = 'purchases'; 
const ADS_WEBSITE_PURCHASES = 'website_purchases';
const ADS_CTR = 'ctr_link_clickthrough_rate';
const ADS_CPC = 'cpc_cost_per_link_click_idr';
const ADS_ROAS = 'purchase_roas_return_on_ad_spend';
const ADS_CONVERSION_VALUE = 'purchases_conversion_value'; 

// --- COMPONENT: CUSTOM LOGO (TEXT UPDATED) ---
const AppLogo = () => (
    <div className="flex items-center gap-3 select-none">
        
        {/* 1. LOGO IMAGE WRAPPER */}
        <div className="relative flex items-center justify-center w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-shrink-0">
            <img 
                src={myLogo} 
                alt="Logo CRM" 
                className="w-full h-full object-cover" 
            />
        </div>

        {/* 2. BAGIAN TEKS (UPDATED) */}
        <div className="flex flex-col justify-center">
            {/* Judul Utama */}
            <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none" style={{ fontFamily: 'Inter, sans-serif' }}>
                CRM<span className="text-indigo-700">Auto</span>
            </h1>
            
            {/* Subtitle Baru */}
            <p className="text-[10px] font-semibold text-gray-500 mt-1 leading-snug">
                Dashboard Analytic & <br/> Segmen Pelanggan
            </p>
        </div>
    </div>
);

// --- UTILS ---
const parseCSVLine = (text, delimiter) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') { inQuotes = !inQuotes; } 
        else if (char === delimiter && !inQuotes) { result.push(current.trim().replace(/^"|"$/g, '')); current = ''; } 
        else { current += char; }
    }
    result.push(current.trim().replace(/^"|"$/g, ''));
    return result;
};

const parseCSV = (csv, delimiter = ',') => {
    if (!csv) return { data: [], rawHeaders: [] };
    if (csv.indexOf(';') > -1 && csv.indexOf(';') < csv.indexOf('\n')) {
        delimiter = ';';
    }
    try {
        const lines = csv.trim().split('\n').filter(line => line.trim() !== '');
        if (lines.length < 2) return { data: [], rawHeaders: [] };
        
        const rawHeaders = parseCSVLine(lines[0], delimiter);
        const normalizedHeaders = rawHeaders.map(header => {
            let h = header.trim().toLowerCase();
            h = h.replace(/\(idr\)/g, 'idr'); 
            h = h.replace(/%/g, 'pct');       
            h = h.replace(/[^a-z0-9]+/g, '_'); 
            h = h.replace(/^_|_$/g, '');
            const variantMatch = header.toLowerCase().match(/^variant\s*[:|-]\s*(.*)/);
            if (variantMatch) {
                const namePart = variantMatch[1].trim();
                const cleanName = namePart.replace(/[^a-z0-9\s-]/g, '').replace(/[\s-]+/g, '_');
                return 'variant:' + cleanName;
            }
            return h;
        });

        const data = [];
        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i], delimiter);
            const row = {};
            if (values.length > 1) { 
                normalizedHeaders.forEach((normalizedHeader, index) => {
                    let value = values[index] !== undefined ? values[index] : '';
                    row[normalizedHeader] = value; 
                    
                    const isNumberCol = normalizedHeader.includes('revenue') || 
                                        normalizedHeader.includes('amount') || 
                                        normalizedHeader.includes('cost') || 
                                        normalizedHeader.includes('impressions') || 
                                        normalizedHeader.includes('clicks') || 
                                        normalizedHeader.includes('purchases') || 
                                        normalizedHeader.includes('roas') ||
                                        normalizedHeader.includes('view') ||
                                        normalizedHeader.includes('cart') ||
                                        normalizedHeader.includes('checkout') ||
                                        normalizedHeader.includes('initiate') ||
                                        normalizedHeader.startsWith('variant:') || 
                                        ['cogs', 'payment_fee', 'shipping_cost', 'shipping_discount', 'product_discount', 'other_income'].includes(normalizedHeader);
                                        
                    if (isNumberCol) {
                        const cleanValue = value.toString().replace(/[^0-9.-]/g, '');
                        const numericValue = parseFloat(cleanValue);
                        row[normalizedHeader] = !isNaN(numericValue) ? numericValue : 0;
                    }
                });
                data.push(row);
            }
        }
        return { data, rawHeaders };
    } catch (e) {
        console.error("Error parsing CSV:", e);
        return { data: [], rawHeaders: [] };
    }
};

const parseAdDate = (dateStr) => {
    if (!dateStr) return null;
    const str = dateStr.toString().trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return new Date(str + 'T00:00:00');
    const parts = str.split(/[\/\-]/);
    if (parts.length === 3) {
        const p1 = parseInt(parts[0], 10);
        const p2 = parseInt(parts[1], 10);
        const p3 = parseInt(parts[2], 10);
        if (p3 > 1000) {
            if (p1 > 12) return new Date(p3, p2 - 1, p1);
            const d = new Date(p3, p2 - 1, p1);
            if (!isNaN(d.getTime())) return d;
        }
    }
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
};

const extractDateParts = (dateTimeStr) => {
    if (!dateTimeStr) return null;
    try {
        const [datePart] = dateTimeStr.split(' ');
        if (!datePart) return null;
        const parts = datePart.split('-');
        if (parts.length !== 3) return null;
        const [year, month, day] = parts;
        return { year: year.padStart(4, '0'), month: month.padStart(2, '0'), day: day.padStart(2, '0') };
    } catch (e) { return null; }
};

// --- UPDATED RFM SEGMENTS (RULE-BASED) ---
const TARGET_SEGMENTS_10 = [
    { 
        name: "Champions", 
        color: "bg-purple-600", 
        hexColor: "#9333ea", 
        text: "text-purple-800", 
        desc: "Profil 5-5-5. Penggemar fanatik yang tidak perlu diyakinkan soal kualitas. Butuh Pengakuan & Eksklusivitas. Jika berhenti, biasanya karena kecewa, bukan lupa." 
    },
    { 
        name: "Loyal Customers", 
        color: "bg-indigo-500", 
        hexColor: "#6366f1", 
        text: "text-indigo-800", 
        desc: "Profil X-5-X. Konsisten membeli terus-menerus dengan LTV stabil. Membenci friksi, sangat membutuhkan Kemudahan dan Apresiasi." 
    },
    { 
        name: "Potential Loyalist", 
        color: "bg-blue-500", 
        hexColor: "#3b82f6", 
        text: "text-blue-800", 
        desc: "Profil 5-3-X. Fase 'bulan madu' dengan brand. Menyukai pengalaman baru dan butuh Validasi bahwa mereka memilih brand yang tepat." 
    },
    { 
        name: "New Customers", 
        color: "bg-green-500", 
        hexColor: "#22c55e", 
        text: "text-green-800", 
        desc: "Profil 5-1-X. Baru satu kali transaksi dengan tingkat ketidakpastian tinggi. Butuh Panduan (Onboarding) untuk mencegah penyesalan pasca beli." 
    },
    { 
        name: "Promising", 
        color: "bg-teal-500", 
        hexColor: "#14b8a6", 
        text: "text-teal-800", 
        desc: "Profil 4-2-X. Menunjukkan minat tapi belum berkomitmen penuh (Swing Voters). Butuh Insentif untuk meningkatkan frekuensi." 
    },
    { 
        name: "Need Attention", 
        color: "bg-yellow-500", 
        hexColor: "#eab308", 
        text: "text-yellow-800", 
        desc: "Profil 3-3-3. Berada di zona stagnasi (rata-rata). Jika didiamkan akan meluncur ke risiko. Butuh Stimulus baru untuk menyalakan kembali minat." 
    },
    { 
        name: "About To Sleep", 
        color: "bg-orange-400", 
        hexColor: "#fb923c", 
        text: "text-orange-800", 
        desc: "Profil 2-2-X. Frekuensi belanja melambat, mungkin sedang mencoba kompetitor. Butuh Pengingat Nilai (Value Reminder) dari brand Anda." 
    },
    { 
        name: "At Risk", 
        color: "bg-red-600", 
        hexColor: "#dc2626", 
        text: "text-red-800", 
        desc: "Profil 1-5-5. Kehilangan terbesar (Mantan VIP). Kemungkinan besar kecewa/marah. Butuh Penyelesaian Masalah (Resolution) segera." 
    },
    { 
        name: "Hibernating", 
        color: "bg-gray-400", 
        hexColor: "#9ca3af", 
        text: "text-gray-800", 
        desc: "Profil 2-2-2. Sudah lama tidak aktif dengan nilai belanja kecil. Pancing dengan Penawaran Murah yang sangat relevan." 
    },
    { 
        name: "Lost", 
        color: "bg-gray-600", 
        hexColor: "#4b5563", 
        text: "text-gray-200", 
        desc: "Profil 1-1-1. Sudah 'mati' secara transaksional. Jangan habiskan budget marketing mahal di sini." 
    }
];

// --- STRATEGI PLAYBOOK PER SEGMEN ---
const SEGMENT_PLAYBOOKS = {
    "Champions": { 
        focus: "Referral & Relationship", 
        action: "Manfaatkan advokasi untuk akuisisi baru & jaga ego mereka. Beri akses Early Access produk baru atau minta testimoni video. Jangan beri diskon umum, tapi 'Hadiah Eksklusif'.", 
        chat: "Halo Kak {name} 👋! Sebagai pelanggan VIP Champions, kami punya akses Early Access produk terbaru khusus buat Kakak (sebelum rilis publik). Mau intip koleksinya? ✨" 
    },
    "Loyal Customers": { 
        focus: "Retention & Referral", 
        action: "Pertahankan kebiasaan (habit) belanja & tingkatkan LTV. Dorong penggunaan Poin Loyalitas, tawarkan Subscription model, atau gamifikasi pencapaian belanja.", 
        chat: "Halo Kak {name}! Poin loyalitas Kakak sudah makin banyak nih. Yuk tukarkan sekarang atau ikuti tantangan belanja minggu ini untuk bonus poin ganda! 🎁" 
    },
    "Potential Loyalist": { 
        focus: "Relationship & Retention", 
        action: "Konversi kepuasan awal jadi kebiasaan jangka panjang. Lakukan Cross-selling produk pelengkap, edukasi nilai brand, dan tawarkan keanggotaan klub.", 
        chat: "Hi Kak {name}, terima kasih sudah belanja kemarin. Produk yang Kakak beli itu paling pas kalau dipadukan dengan [Produk Pelengkap] lho. Cek di sini ya 👉 [Link]" 
    },
    "New Customers": { 
        focus: "Onboarding & Edukasi", 
        action: "Kurangi kecemasan pasca-beli. Kirim Welcome Series, tutorial penggunaan produk, dan sapaan personal 'Terima Kasih'.", 
        chat: "Halo Kak {name}, selamat datang! Terima kasih sudah belanja. Paket sudah sampai aman? Kalau ada bingung cara pakainya, boleh langsung tanya kami di sini ya. 😊" 
    },
    "Promising": { 
        focus: "Retention (Repeat Order)", 
        action: "Dorong pembelian ke-2 & ke-3 secepatnya. Berikan voucher berbatas waktu (Time-limited) dan rekomendasi produk berbasis algoritma.", 
        chat: "Halo Kak {name}! Khusus 24 jam ke depan ⏰, kami ada voucher diskon spesial buat order kedua Kakak. Sayang banget kalau hangus, yuk cek katalog kami!" 
    },
    "Need Attention": { 
        focus: "Retention & Recovery", 
        action: "Cegah stagnasi & aktifkan minat. Kirim survei kepuasan singkat atau tawarkan Promo 'Flash Sale' khusus segmen ini.", 
        chat: "Halo Kak {name}, gimana kabarnya? Boleh minta waktu sebentar utk survei kepuasan? Sebagai ganti waktunya, ada akses Flash Sale khusus buat Kakak lho." 
    },
    "About To Sleep": { 
        focus: "Recovery & Retention", 
        action: "Hentikan churn. Sapa 'Kami Rindu Anda', ingatkan poin yang akan hangus, atau tawarkan produk Best-seller terlaris.", 
        chat: "Halo Kak {name}, kami kangen nih! 👋 Sekadar info, poin Kakak akan segera hangus lho. Yuk tukarkan dengan produk Best Seller kami sebelum hilang!" 
    },
    "At Risk": { 
        focus: "Recovery & Relationship", 
        action: "Selidiki penyebab berhenti. Lakukan Personal Outreach (WA Manual/Telp), tanyakan keluhan, dan beri penawaran Win-back agresif.", 
        chat: "Halo Kak {name}, mohon maaf mengganggu. Kami perhatikan Kakak sudah lama tidak mampir. Apakah ada kendala layanan kami? Kami ada Gift Spesial 🙏 sebagai permohonan maaf." 
    },
    "Hibernating": { 
        focus: "Low Cost Recovery", 
        action: "Uji keberadaan dengan biaya rendah. Masukkan ke list Promo Cuci Gudang atau Diskon Besar Musiman. Jangan habiskan budget iklan mahal.", 
        chat: "Halo Kak {name}, lagi ada Cuci Gudang Diskon s.d 80% nih! Siapa tau ada yang Kakak butuhkan. Cek stok terbatas di sini ya: [Link]" 
    },
    "Lost": { 
        focus: "Automated / Ignore", 
        action: "Upaya terakhir atau bersihkan database. Gunakan re-marketing otomatis di medsos. Biarkan jika biaya akuisisi ulang terlalu tinggi.", 
        chat: "Info Promo: Dapatkan penawaran spesial minggu ini di website kami. Cek selengkapnya di [Link]" 
    }
};

// --- HELPER: RFM SEGMENTATION LOGIC (Reusable) ---
const assignRFMSegment = (r, f, m) => {
    if (r >= 4 && f >= 4 && m >= 4) return 'Champions';
    if (r >= 3 && f >= 4 && m >= 3) return 'Loyal Customers';
    if (r <= 2 && f >= 3 && m >= 3) return 'At Risk';
    if (r >= 4 && f === 1) return 'New Customers';
    if (r >= 3 && f >= 2 && f <= 3 && m >= 2) return 'Potential Loyalist';
    if (r === 3 && f === 3 && m >= 2 && m <= 3) return 'Need Attention';
    if (r >= 3 && f === 1) return 'Promising';
    if (r >= 2 && r <= 3 && f <= 2 && m <= 3) return 'About To Sleep';
    if (r <= 2 && f <= 2 && m <= 2) return 'Hibernating';
    return 'Lost';
};

const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];
const STATUS_COLORS = { 'confirmed': '#10b981', 'completed': '#059669', 'pending': '#f59e0b', 'canceled': '#ef4444', 'rts': '#dc2626', 'shipped': '#3b82f6', 'in_process': '#6366f1' };

const parseDateSafe = (dateStr) => {
    if (!dateStr) return null;
    const s = dateStr.toString().trim();
    
    // Coba format ISO standar (YYYY-MM-DD HH:mm:ss)
    let d = new Date(s.replace(' ', 'T'));
    if (!isNaN(d.getTime())) return d;

    // Coba format Indonesia/Excel (DD/MM/YYYY atau DD-MM-YYYY)
    // Contoh: 25/12/2023
    const parts = s.split(/[\/\-\s]/); // Split berdasarkan / atau - atau spasi
    if (parts.length >= 3) {
        // Cek apakah bagian pertama adalah Tahun (4 digit) atau Tanggal (1-2 digit)
        if (parts[0].length === 4) {
            // YYYY-MM-DD
            return new Date(parts[0], parseInt(parts[1])-1, parts[2]);
        } else {
            // DD-MM-YYYY (Asumsi format Indonesia)
            // parts[2] = Year, parts[1] = Month, parts[0] = Day
            const year = parts[2].length === 4 ? parts[2] : parts[2].length === 2 ? '20' + parts[2] : parts[2];
            return new Date(year, parseInt(parts[1])-1, parts[0]);
        }
    }
    return null;
};

// --- 4. USE PROCESSED DATA (FINAL REVISION: FORCE NUMBER PARSING) ---
const useProcessedData = (rawData) => {
    return useMemo(() => {
        // --- HELPER: AMBIL ANGKA DARI STRING (Force Number) ---
        // Fungsi ini membersihkan "Rp", ".", "," agar terbaca sebagai angka
        const safeFloat = (val) => {
            if (typeof val === 'number') return val;
            if (!val) return 0;
            const str = val.toString();
            // Hapus semua karakter kecuali angka, minus, dan titik desimal
            // Asumsi: Data CSV biasanya tidak pakai pemisah ribuan titik jika format standar,
            // tapi jika format Indonesia (100.000), kita harus buang titiknya dulu.
            const cleanStr = str.replace(/[^0-9,-]/g, '').replace(',', '.'); 
            const num = parseFloat(cleanStr);
            return isNaN(num) ? 0 : num;
        };

        // --- A. BASIC SETUP ---
        const hasLocationData = rawData.some(item => 
            (item[COL_PROVINCE] && item[COL_PROVINCE].toString().trim() !== '' && item[COL_PROVINCE] !== '-') ||
            (item[COL_CITY] && item[COL_CITY].toString().trim() !== '' && item[COL_CITY] !== '-')
        );
        const isDigitalMode = !hasLocationData; 

        if (rawData.length === 0) return { 
            // Default Return Empty
            utmChartAnalysis: [], utmSourceAnalysis: [], provinceAnalysis: [], uniqueCustomerList: [], geoRevenueChart: [], 
            productVariantAnalysis: [], top3Products: [], customerSegmentationData: [], rawData: [], 
            uniqueDates: { years: [], months: [], days: [] }, totalConfirmedRevenue: 0, totalConfirmedOrders: 0, 
            timeAnalysis: { yearly: [], quarterly: [], monthly: [] }, paymentMethodAnalysis: [], customerTypeAnalysis: [], 
            financialEntityAnalysis: [], courierAnalysis: [], rawTimeData: [], heatmapData: [], heatmapMaxRevenue: 0, 
            dailyTrendAnalysis: [], confirmedOrders: [], totalGrossProfit: 0, 
            topLocationLists: { provinces: [], cities: [], subdistricts: [] },
            isDigitalMode: false, totalSoldItems: 0, sankeyData: { nodes: [], links: [] }, cohortData: []
        };

        const isConfirmed = (item) => !!item[COL_CONFIRMED_TIME] && item[COL_CONFIRMED_TIME].toString().trim() !== '';
        const filteredData = rawData.filter(isConfirmed); 
        
        // Gunakan safeFloat saat menghitung total
        const totalConfirmedRevenue = filteredData.reduce((sum, item) => sum + safeFloat(item[COL_NET_REVENUE]), 0);
        const totalConfirmedOrders = filteredData.length;
        
        // --- 0. PREPARE VARIANT KEYS ---
        const allVariantKeys = new Set();
        rawData.forEach(row => { 
            Object.keys(row).forEach(key => { 
                if (key.startsWith('variant:')) allVariantKeys.add(key); 
            }); 
        });
        const variantColumns = Array.from(allVariantKeys);

        let totalGrossProfit = 0;
        filteredData.forEach(item => {
            const grossRev = safeFloat(item[COL_GROSS_REVENUE]); 
            const prodDisc = safeFloat(item[COL_PRODUCT_DISCOUNT]); 
            const shipDisc = safeFloat(item[COL_SHIPPING_DISCOUNT]); 
            const cogs = safeFloat(item[COL_COGS]); 
            const payFee = safeFloat(item[COL_PAYMENT_FEE]); 
            const shipCost = safeFloat(item[COL_SHIPPING_COST]);
            totalGrossProfit += (grossRev - prodDisc - shipDisc) - cogs - payFee - shipCost;
        });

        // --- B. TIME & HEATMAP STATS ---
        const yearlyStats = {}; const quarterlyStats = { 'Q1': 0, 'Q2': 0, 'Q3': 0, 'Q4': 0 };
        const monthlyStats = Array(12).fill(0);
        const dailyTrendStats = Array(31).fill(null).map((_, i) => ({ day: i + 1, revenue: 0, transactions: 0 }));
        const heatmapGrid = Array(31).fill(null).map(() => Array(24).fill(0));
        let heatmapMaxRevenue = 0;
        const _rawTimeData = []; 

        filteredData.forEach(item => {
            const confirmedTimeStr = item[COL_CONFIRMED_TIME];
            const revenue = safeFloat(item[COL_NET_REVENUE]); // GUNAKAN SAFEFLOAT
            
            const d = parseDateSafe(confirmedTimeStr);

            if (d && !isNaN(d.getTime())) {
                const year = d.getFullYear(); const month = d.getMonth(); const day = d.getDate(); const hour = d.getHours();
                
                yearlyStats[year] = (yearlyStats[year] || 0) + revenue;
                monthlyStats[month] += revenue;
                quarterlyStats[month <= 2 ? 'Q1' : month <= 5 ? 'Q2' : month <= 8 ? 'Q3' : 'Q4'] += revenue;
                
                if (day >= 1 && day <= 31) {
                    dailyTrendStats[day-1].revenue += revenue; dailyTrendStats[day-1].transactions += 1;
                    heatmapGrid[day-1][hour] += revenue;
                    if (heatmapGrid[day-1][hour] > heatmapMaxRevenue) heatmapMaxRevenue = heatmapGrid[day-1][hour];
                }
                _rawTimeData.push({ year: year.toString(), monthIndex: month, revenue: revenue });
            }
        });

        // --- C. CUSTOMER DATA PROCESSING ---
        const customerMap = {};
        const today = new Date();
        const pastDate = new Date(); pastDate.setDate(today.getDate() - 30); 

        filteredData.forEach(item => {
            const name = item[COL_NAME];
            if (!name) return;
            const revenue = safeFloat(item[COL_NET_REVENUE]); // GUNAKAN SAFEFLOAT
            const d = parseDateSafe(item[COL_CONFIRMED_TIME]);
            if (!d) return;

            const orderDate = d;
            const hour = d.getHours();
            
            if (!customerMap[name]) {
                customerMap[name] = { 
                    name, phone: item[COL_PHONE], email: item['email'], address: item[COL_ADDRESS], 
                    province: item[COL_PROVINCE], city: item[COL_CITY],
                    orders: [], orderHours: [], 
                    productMap: {},
                    totalRevenue: 0, totalFreq: 0, lastDate: null,
                    pastRevenue: 0, pastFreq: 0, pastLastDate: null
                };
            }
            const c = customerMap[name];
            c.orders.push(orderDate); c.orderHours.push(hour); 
            c.totalRevenue += revenue; 
            c.totalFreq += 1;
            if (!c.lastDate || orderDate > c.lastDate) c.lastDate = orderDate;

            variantColumns.forEach(key => {
                const qty = parseFloat(item[key] || 0);
                if (qty > 0) {
                    const cleanName = key.replace('variant:', '').replace(/_/g, ' ').toUpperCase();
                    c.productMap[cleanName] = (c.productMap[cleanName] || 0) + qty;
                }
            });

            if (orderDate < pastDate) { 
                c.pastRevenue += revenue; 
                c.pastFreq += 1; 
                if (!c.pastLastDate || orderDate > c.pastLastDate) c.pastLastDate = orderDate; 
            }
        });

        const rfmList = Object.values(customerMap).map(c => {
            const recency = Math.floor((today - c.lastDate) / (1000 * 60 * 60 * 24));
            const hourCounts = {}; let maxHour = 9; let maxCount = 0;
            c.orderHours.forEach(h => { hourCounts[h] = (hourCounts[h] || 0) + 1; if (hourCounts[h] > maxCount) { maxCount = hourCounts[h]; maxHour = h; } });
            const optimalTimeLabel = `${String(maxHour).padStart(2,'0')}:00 - ${String(maxHour + 1).padStart(2,'0')}:00`;
            let churnScore = 0;
            if (recency > 90) churnScore = 90; else if (recency > 60) churnScore = 75; else if (recency > 30) churnScore = 50; else if (recency > 14) churnScore = 25; else churnScore = 10;
            if (c.totalFreq > 3 && recency > 45) churnScore += 20; if (c.totalFreq === 1 && recency > 60) churnScore += 10; if (churnScore > 100) churnScore = 100;
            
            let pastRecency = 999; let pastSegment = "New / Inactive"; 
            if (c.pastFreq > 0) {
                pastRecency = Math.floor((pastDate - c.pastLastDate) / (1000 * 60 * 60 * 24));
                let pR = pastRecency <= 30 ? 5 : pastRecency <= 60 ? 4 : pastRecency <= 90 ? 3 : pastRecency <= 180 ? 2 : 1;
                let pF = c.pastFreq >= 10 ? 5 : c.pastFreq >= 5 ? 4 : c.pastFreq >= 3 ? 3 : c.pastFreq >= 2 ? 2 : 1;
                let pM = 3; pastSegment = assignRFMSegment(pR, pF, pM);
            }
            return { ...c, recency, frequency: c.totalFreq, monetary: c.totalRevenue, pastSegment, churnProbability: churnScore, optimalTime: optimalTimeLabel };
        });

        const getScores = (data, field, reverse = false) => {
            const sorted = [...new Set(data.map(d => d[field]))].sort((a, b) => a - b);
            const step = Math.ceil(sorted.length / 5); const scores = {};
            sorted.forEach((val, i) => { let s = Math.min(5, Math.floor(i / step) + 1); if (reverse) s = 6 - s; scores[val] = s; });
            return scores;
        };
        const R_Map = getScores(rfmList, 'recency', true); const F_Map = getScores(rfmList, 'frequency', false); const M_Map = getScores(rfmList, 'monetary', false);
        const finalCustomerData = rfmList.map(c => {
            const R = R_Map[c.recency] || 1; const F = F_Map[c.frequency] || 1; const M = M_Map[c.monetary] || 1;
            const currentSegment = assignRFMSegment(R, F, M);
            const segInfo = TARGET_SEGMENTS_10.find(s => s.name === currentSegment) || TARGET_SEGMENTS_10[9];
            return { ...c, R_Score: R, F_Score: F, M_Score: M, Segment10Name: currentSegment, Segment10Color: segInfo.color, Segment10Hex: segInfo.hexColor };
        });

        const sankeyLinks = {}; finalCustomerData.forEach(c => { const key = `${c.pastSegment} (Lalu)|${c.Segment10Name} (Kini)`; sankeyLinks[key] = (sankeyLinks[key] || 0) + 1; });
        const sankeyNodesSet = new Set(); const finalSankeyLinks = Object.entries(sankeyLinks).map(([key, value]) => { const [source, target] = key.split('|'); sankeyNodesSet.add(source); sankeyNodesSet.add(target); return { source, target, value }; }).sort((a, b) => b.value - a.value).slice(0, 15).map(link => ({ source: Array.from(sankeyNodesSet).indexOf(link.source), target: Array.from(sankeyNodesSet).indexOf(link.target), value: link.value }));
        const sankeyNodesArray = Array.from(sankeyNodesSet).map(name => ({ name }));
        const cohortMap = {}; finalCustomerData.forEach(c => { if (c.orders.length === 0) return; const sortedOrders = c.orders.sort((a, b) => a - b); const firstDate = sortedOrders[0]; const joinMonthKey = `${firstDate.getFullYear()}-${String(firstDate.getMonth() + 1).padStart(2, '0')}`; if (!cohortMap[joinMonthKey]) cohortMap[joinMonthKey] = { total: 0, retentions: {} }; cohortMap[joinMonthKey].total += 1; const uniqueMonthsBought = new Set(); sortedOrders.forEach(d => { const diffMonths = (d.getFullYear() - firstDate.getFullYear()) * 12 + (d.getMonth() - firstDate.getMonth()); uniqueMonthsBought.add(diffMonths); }); uniqueMonthsBought.forEach(mIdx => { cohortMap[joinMonthKey].retentions[mIdx] = (cohortMap[joinMonthKey].retentions[mIdx] || 0) + 1; }); });
        const cohortData = Object.entries(cohortMap).sort().slice(-6).map(([month, stats]) => { const retentionArr = []; for (let i = 0; i <= 5; i++) { const pct = stats.total > 0 ? Math.round(((stats.retentions[i] || 0) / stats.total) * 100) : 0; retentionArr.push(pct); } return { month, users: stats.total, retention: retentionArr }; });

        // --- D. STATISTICS: LOCATION & VARIANTS ---
        const variantStats = {}; let _totalSoldItems = 0;
        const provCounts = {}; const cityCounts = {}; const subCounts = {};

        filteredData.forEach(item => {
            const prov = (item[COL_PROVINCE] || '').trim();
            const city = (item[COL_CITY] || '').trim();
            const sub = (item[COL_SUBDISTRICT] || '').trim();
            const rev = safeFloat(item[COL_NET_REVENUE]); // GUNAKAN SAFEFLOAT

            if(prov && prov !== '-' && prov.toLowerCase() !== 'unknown') { 
                if(!provCounts[prov]) provCounts[prov]={count:0, revenue:0}; 
                provCounts[prov].count++; 
                provCounts[prov].revenue += rev; 
            }
            if(city && city !== '-' && city.toLowerCase() !== 'unknown') { 
                if(!cityCounts[city]) cityCounts[city]={count:0, revenue:0}; 
                cityCounts[city].count++; 
                cityCounts[city].revenue += rev; 
            }
            if(sub && sub !== '-' && sub.toLowerCase() !== 'unknown') { 
                if(!subCounts[sub]) subCounts[sub]={count:0, revenue:0}; 
                subCounts[sub].count++; 
                subCounts[sub].revenue += rev; 
            }
            
            variantColumns.forEach(key => {
                const qty = parseFloat(item[key] || 0);
                if (qty > 0) {
                    const rawName = key.replace('variant:', '').replace(/_/g, ' ').toUpperCase();
                    if (!variantStats[rawName]) variantStats[rawName] = { name: rawName, totalQuantity: 0, totalOrders: 0, totalRevenue: 0 };
                    variantStats[rawName].totalQuantity += qty; _totalSoldItems += qty;
                    variantStats[rawName].totalOrders += 1; variantStats[rawName].totalRevenue += (qty * (rev/qty)); 
                }
            });
        });

        const productVariantAnalysis = Object.values(variantStats).sort((a, b) => b.totalQuantity - a.totalQuantity);
        const top3Products = productVariantAnalysis.slice(0, 3);
        const _topProvinces = Object.entries(provCounts).map(([name, d]) => ({ name, value: d.count, revenue: d.revenue })).sort((a, b) => b.value - a.value).slice(0, 10);
        const _topCities = Object.entries(cityCounts).map(([name, d]) => ({ name, value: d.count, revenue: d.revenue })).sort((a, b) => b.value - a.value).slice(0, 10);
        const _topSubdistricts = Object.entries(subCounts).map(([name, d]) => ({ name, value: d.count, revenue: d.revenue })).sort((a, b) => b.value - a.value).slice(0, 10);

        return { 
            utmChartAnalysis: [], utmSourceAnalysis: [], provinceAnalysis: [], uniqueCustomerList: [], geoRevenueChart: [], 
            productVariantAnalysis, top3Products, rawData, uniqueDates: { years: [], months: [], days: [] }, 
            customerSegmentationData: finalCustomerData, 
            totalConfirmedRevenue, totalConfirmedOrders, 
            timeAnalysis: { yearly: Object.entries(yearlyStats).map(([k,v])=>({name:k,revenue:v})), quarterly: [], monthly: [] }, 
            rawTimeData: _rawTimeData, 
            paymentMethodAnalysis: [], customerTypeAnalysis: [], financialEntityAnalysis: [], courierAnalysis: [], 
            heatmapData: heatmapGrid, heatmapMaxRevenue, dailyTrendAnalysis: dailyTrendStats, 
            confirmedOrders: filteredData, totalGrossProfit, 
            topLocationLists: { provinces: _topProvinces, cities: _topCities, subdistricts: _topSubdistricts },
            isDigitalMode, totalSoldItems: _totalSoldItems,
            sankeyData: { nodes: sankeyNodesArray, links: finalSankeyLinks },
            cohortData: cohortData
        };
    }, [rawData]);
};

const formatRupiah = (number) => {
    if (typeof number !== 'number') return 'Rp0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
};

const StatCard = ({ title, value, icon: Icon, color, unit = '', description = null, compact = false }) => (
    <div className={`${compact ? 'p-3' : 'p-5'} bg-white rounded-xl shadow-lg border-b-4 h-full flex flex-col justify-between transition-transform hover:-translate-y-1 hover:shadow-xl`} style={{ borderColor: color }}>
        <div className="flex items-center mb-1">
            <div className={`${compact ? 'p-2 mr-2' : 'p-3 mr-4'} rounded-full bg-opacity-20 flex-shrink-0`} style={{ backgroundColor: color + '20' }}>
                <Icon className={`${compact ? 'w-4 h-4' : 'w-6 h-6'}`} style={{ color: color }} />
            </div>
            <div className="min-w-0 flex-1">
                <p className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-gray-500 truncate`} title={title}>{title}</p>
                <div className="mt-0.5 flex items-baseline flex-wrap">
                    <span className={`${compact ? 'text-lg md:text-xl' : 'text-2xl xl:text-3xl'} font-bold text-gray-900 truncate block max-w-full`} title={typeof value === 'string' ? value : ''}>{value}</span>
                    {unit && <span className={`ml-1 ${compact ? 'text-[10px]' : 'text-base'} font-medium text-gray-500 whitespace-nowrap`}>{unit}</span>}
                </div>
            </div>
        </div>
        {description && (
            <div className={`mt-1 pt-1 border-t border-gray-100 ${compact ? 'hidden sm:block' : ''}`}>
                <p className={`${compact ? 'text-[9px]' : 'text-[10px]'} text-gray-400 italic leading-tight line-clamp-2`}>{description}</p>
            </div>
        )}
    </div>
);

const NavButton = ({ id, name, view, setView, icon: Icon, disabled = false }) => (
    <button
        onClick={() => !disabled && setView(id)}
        disabled={disabled}
        className={`flex items-center space-x-3 w-full justify-start px-4 py-3 text-sm font-medium transition-all duration-300 rounded-lg shadow-md ${
            view === id 
            ? 'bg-indigo-600 text-white shadow-indigo-500/50' 
            : disabled 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60' 
                : 'bg-white text-gray-700 hover:bg-gray-100 hover:shadow-lg'
        }`}
    >
        <Icon className="w-5 h-5" />
        <span>{name}</span>
        {disabled && <Lock className="w-3 h-3 ml-auto" />}
    </button>
);

const CustomerSegmentationView = ({ data, isDigitalMode }) => {
    const [selectedSegment, setSelectedSegment] = useState('All');
    
    // --- TABLE FILTERS (R, F, M, Search) ---
    const [recencyMin, setRecencyMin] = useState(''); const [recencyMax, setRecencyMax] = useState('');
    const [frequencyMin, setFrequencyMin] = useState(''); const [frequencyMax, setFrequencyMax] = useState('');
    const [monetaryMin, setMonetaryMin] = useState(''); const [monetaryMax, setMonetaryMax] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Toggle States
    const [showSegmentDetails, setShowSegmentDetails] = useState(false); 
    const [showChatRecommendation, setShowChatRecommendation] = useState(false);
    
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [isProdDropdownOpen, setIsProdDropdownOpen] = useState(false);
    
    // --- RFM CONFIGURATION STATE ---
    const [rfmMode, setRfmMode] = useState('auto'); // 'auto' | 'manual'
    const [showRFMSettings, setShowRFMSettings] = useState(false);
    
    // Default Manual Thresholds (Batas Bawah)
    // Recency (Hari): Semakin KECIL semakin bagus (Reverse) -> Input batas atas
    // Freq & Monetary: Semakin BESAR semakin bagus -> Input batas bawah
    const [manualConfig, setManualConfig] = useState({
        recency: { 5: 30, 4: 60, 3: 90, 2: 180 }, // <= 30 hari = Score 5, dst
        frequency: { 5: 10, 4: 5, 3: 3, 2: 2 },   // >= 10 order = Score 5, dst
        monetary: { 5: 1000000, 4: 500000, 3: 250000, 2: 100000 } // >= 1jt = Score 5, dst
    });

    const dropdownRef = useRef(null);

    // --- 1. RECALCULATE SEGMENTS LOGIC ---
    // Menghitung ulang data jika mode manual aktif
    const effectiveData = useMemo(() => {
        if (rfmMode === 'auto') return data;

        return data.map(c => {
            let R, F, M;

            // Manual Recency Score (Lower is better)
            if (c.recency <= manualConfig.recency[5]) R = 5;
            else if (c.recency <= manualConfig.recency[4]) R = 4;
            else if (c.recency <= manualConfig.recency[3]) R = 3;
            else if (c.recency <= manualConfig.recency[2]) R = 2;
            else R = 1;

            // Manual Frequency Score (Higher is better)
            if (c.frequency >= manualConfig.frequency[5]) F = 5;
            else if (c.frequency >= manualConfig.frequency[4]) F = 4;
            else if (c.frequency >= manualConfig.frequency[3]) F = 3;
            else if (c.frequency >= manualConfig.frequency[2]) F = 2;
            else F = 1;

            // Manual Monetary Score (Higher is better)
            if (c.monetary >= manualConfig.monetary[5]) M = 5;
            else if (c.monetary >= manualConfig.monetary[4]) M = 4;
            else if (c.monetary >= manualConfig.monetary[3]) M = 3;
            else if (c.monetary >= manualConfig.monetary[2]) M = 2;
            else M = 1;

            // Assign New Segment Name
            const newSegment = assignRFMSegment(R, F, M); // Menggunakan fungsi helper global
            const segInfo = TARGET_SEGMENTS_10.find(s => s.name === newSegment) || TARGET_SEGMENTS_10[9];

            return {
                ...c,
                R_Score: R, F_Score: F, M_Score: M,
                Segment10Name: newSegment,
                Segment10Color: segInfo.color,
                Segment10Hex: segInfo.hexColor
            };
        });
    }, [data, rfmMode, manualConfig]);

    // --- LOGIC FILTER (Using effectiveData) ---
    const filteredTableData = useMemo(() => {
        return effectiveData.filter(c => {
            const matchesSegment = selectedSegment === 'All' || c.Segment10Name === selectedSegment;
            let matchesRecency = true; if (recencyMin) matchesRecency = matchesRecency && c.recency >= parseInt(recencyMin); if (recencyMax) matchesRecency = matchesRecency && c.recency <= parseInt(recencyMax);
            let matchesFrequency = true; if (frequencyMin) matchesFrequency = matchesFrequency && c.frequency >= parseInt(frequencyMin); if (frequencyMax) matchesFrequency = matchesFrequency && c.frequency <= parseInt(frequencyMax);
            let matchesMonetary = true; if (monetaryMin) matchesMonetary = matchesMonetary && c.monetary >= parseFloat(monetaryMin); if (monetaryMax) matchesMonetary = matchesMonetary && c.monetary <= parseFloat(monetaryMax);
            
            const term = searchTerm.toLowerCase();
            const matchesSearch = !term || (c.name && c.name.toLowerCase().includes(term)) || (c.phone && c.phone.toString().toLowerCase().includes(term));

            return matchesSegment && matchesRecency && matchesFrequency && matchesMonetary && matchesSearch;
        });
    }, [effectiveData, selectedSegment, recencyMin, recencyMax, frequencyMin, frequencyMax, monetaryMin, monetaryMax, searchTerm]);

    const chartData = useMemo(() => {
        const stats = {};
        filteredTableData.forEach(customer => {
            const segName = customer.Segment10Name;
            if (!stats[segName]) stats[segName] = { name: segName, count: 0, revenue: 0, fill: customer.Segment10Hex || "#8884d8" };
            stats[segName].count += 1; stats[segName].revenue += customer.monetary;
        });
        return Object.values(stats).sort((a, b) => b.count - a.count);
    }, [filteredTableData]);

    const highRiskCount = filteredTableData.filter(c => c.churnProbability >= 75).length;
    const segmentOptions = useMemo(() => ['All', ...new Set(effectiveData.map(c => c.Segment10Name))].sort(), [effectiveData]);
    const productColumns = useMemo(() => { const all = new Set(); data.forEach(c => { if(c.productMap) Object.keys(c.productMap).forEach(p=>all.add(p))}); return Array.from(all).sort()}, [data]);

   const segmentInsights = useMemo(() => {
        if (filteredTableData.length === 0) return null;
        let totalRev = 0; 
        const productCounts = {}; // Untuk menyimpan hitungan produk
        const cityCounts = {};

        filteredTableData.forEach(c => {
            totalRev += c.monetary;
            
            // LOGIC INI SEKARANG AKAN BEKERJA KARENA c.productMap SUDAH DIISI DI ATAS
            if (c.productMap) {
                Object.entries(c.productMap).forEach(([prod, qty]) => { 
                    productCounts[prod] = (productCounts[prod] || 0) + qty; 
                });
            }

            const city = c.city || "Unknown"; 
            cityCounts[city] = (cityCounts[city] || 0) + 1;
        });

        const topProduct = Object.entries(productCounts).sort((a, b) => b[1] - a[1])[0];
        const topCity = Object.entries(cityCounts).sort((a, b) => b[1] - a[1])[0];
        
        return { 
            avgRevenue: totalRev / filteredTableData.length, 
            favProduct: topProduct ? topProduct[0] : "-", 
            favProductCount: topProduct ? topProduct[1] : 0, 
            domCity: topCity ? topCity[0] : "-", 
            domCityCount: topCity ? topCity[1] : 0, 
            totalPopulation: filteredTableData.length 
        };
    }, [filteredTableData]);

    const copyToClipboard = (text) => {
        const textArea = document.createElement("textarea"); textArea.value = text; document.body.appendChild(textArea); textArea.select();
        try { document.execCommand('copy'); alert('Tersalin!'); } catch (err) {} document.body.removeChild(textArea);
    };

    const handleExportCSV = () => {
        if (filteredTableData.length === 0) { alert("Tidak ada data."); return; }
        const headers = ["Nama,No WhatsApp,Email,Alamat,Provinsi,Kabupaten,Segmen,Resiko Churn,Waktu Kontak,Recency,Frequency,Monetary"].join(",");
        const rows = filteredTableData.map(c => {
            return `"${c.name}","${c.phone}","${c.email}","${c.address}","${c.province}","${c.city}","${c.Segment10Name}","${c.churnProbability}%","${c.optimalTime}",${c.recency},${c.frequency},${c.monetary}`;
        }).join("\n");
        const blob = new Blob([headers + "\n" + rows], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a"); link.setAttribute("href", url); link.setAttribute("download", "RFM_AI_Data.csv"); document.body.appendChild(link); link.click(); document.body.removeChild(link);
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const dataPoint = payload[0].payload;
            return (
                <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-md">
                    <p className="font-bold text-gray-800 mb-1">{label}</p>
                    <p className="text-sm text-indigo-600">Jumlah: <span className="font-bold">{dataPoint.count}</span></p>
                    <p className="text-sm text-green-600">Revenue: <span className="font-bold">{formatRupiah(dataPoint.revenue)}</span></p>
                </div>
            );
        }
        return null;
    };

    // --- MODAL CONFIGURATION ---
    const RFMSettingsModal = () => {
        // Local state for inputs to avoid re-rendering main component on every keystroke
        const [tempMode, setTempMode] = useState(rfmMode);
        const [tempConfig, setTempConfig] = useState(manualConfig);

        const handleSave = () => {
            setRfmMode(tempMode);
            setManualConfig(tempConfig);
            setShowRFMSettings(false);
        };

        if (!showRFMSettings) return null;

        return (
            <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 overflow-y-auto max-h-[90vh]">
                    <div className="flex justify-between items-center mb-6 border-b pb-4">
                        <div className="flex items-center gap-2">
                            <Settings className="w-6 h-6 text-indigo-600" />
                            <h3 className="text-xl font-bold text-gray-800">Konfigurasi RFM Scoring</h3>
                        </div>
                        <button onClick={() => setShowRFMSettings(false)} className="text-gray-400 hover:text-gray-600"><XCircle className="w-6 h-6"/></button>
                    </div>

                    <div className="mb-6">
                        <label className="text-sm font-bold text-gray-700 block mb-2">Metode Perhitungan:</label>
                        <div className="flex space-x-4">
                            <button 
                                onClick={() => setTempMode('auto')}
                                className={`flex-1 py-3 px-4 rounded-lg border-2 text-sm font-bold flex items-center justify-center transition-all ${tempMode === 'auto' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                            >
                                <Zap className="w-4 h-4 mr-2" /> Otomatis (Persentil/Kuantil)
                            </button>
                            <button 
                                onClick={() => setTempMode('manual')}
                                className={`flex-1 py-3 px-4 rounded-lg border-2 text-sm font-bold flex items-center justify-center transition-all ${tempMode === 'manual' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                            >
                                <Settings className="w-4 h-4 mr-2" /> Manual (Fixed Threshold)
                            </button>
                        </div>
                        {tempMode === 'auto' && (
                            <p className="mt-2 text-xs text-gray-500 italic bg-gray-50 p-2 rounded">
                                *Sistem akan otomatis membagi pelanggan ke dalam 5 grup (skor 1-5) secara merata berdasarkan distribusi data (20% teratas dapat skor 5, dst).
                            </p>
                        )}
                    </div>

                    {tempMode === 'manual' && (
                        <div className="space-y-6 animate-fade-in">
                            {/* RECENCY */}
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <h4 className="font-bold text-blue-800 text-sm mb-3 flex items-center"><Clock className="w-4 h-4 mr-2"/> Recency (Keaktifan)</h4>
                                <div className="grid grid-cols-2 gap-4 text-xs">
                                    <div>
                                        <label className="block text-gray-600 font-semibold mb-1">Skor 5 (Sangat Aktif) jika:</label>
                                        <div className="flex items-center"><span className="mr-2 text-gray-500">&le;</span><input type="number" value={tempConfig.recency[5]} onChange={(e) => setTempConfig({...tempConfig, recency: {...tempConfig.recency, 5: parseInt(e.target.value)||0}})} className="w-full p-2 border rounded"/> <span className="ml-2 text-gray-500">Hari</span></div>
                                    </div>
                                    <div>
                                        <label className="block text-gray-600 font-semibold mb-1">Skor 4 (Aktif) jika:</label>
                                        <div className="flex items-center"><span className="mr-2 text-gray-500">&le;</span><input type="number" value={tempConfig.recency[4]} onChange={(e) => setTempConfig({...tempConfig, recency: {...tempConfig.recency, 4: parseInt(e.target.value)||0}})} className="w-full p-2 border rounded"/> <span className="ml-2 text-gray-500">Hari</span></div>
                                    </div>
                                    <div>
                                        <label className="block text-gray-600 font-semibold mb-1">Skor 3 (Cukup) jika:</label>
                                        <div className="flex items-center"><span className="mr-2 text-gray-500">&le;</span><input type="number" value={tempConfig.recency[3]} onChange={(e) => setTempConfig({...tempConfig, recency: {...tempConfig.recency, 3: parseInt(e.target.value)||0}})} className="w-full p-2 border rounded"/> <span className="ml-2 text-gray-500">Hari</span></div>
                                    </div>
                                    <div>
                                        <label className="block text-gray-600 font-semibold mb-1">Skor 2 (Beresiko) jika:</label>
                                        <div className="flex items-center"><span className="mr-2 text-gray-500">&le;</span><input type="number" value={tempConfig.recency[2]} onChange={(e) => setTempConfig({...tempConfig, recency: {...tempConfig.recency, 2: parseInt(e.target.value)||0}})} className="w-full p-2 border rounded"/> <span className="ml-2 text-gray-500">Hari</span></div>
                                    </div>
                                </div>
                                <p className="text-[10px] text-blue-600 mt-2 italic">*Lebih dari {tempConfig.recency[2]} hari akan otomatis mendapat Skor 1.</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* FREQUENCY */}
                                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                                    <h4 className="font-bold text-green-800 text-sm mb-3 flex items-center"><Repeat className="w-4 h-4 mr-2"/> Frequency (Seringnya)</h4>
                                    <div className="space-y-2 text-xs">
                                        {[5, 4, 3, 2].map((score) => (
                                            <div key={score} className="flex justify-between items-center">
                                                <label className="text-gray-600 font-semibold">Skor {score} (Min):</label>
                                                <div className="flex items-center w-24"><span className="mr-1 text-gray-500">&ge;</span><input type="number" value={tempConfig.frequency[score]} onChange={(e) => setTempConfig({...tempConfig, frequency: {...tempConfig.frequency, [score]: parseInt(e.target.value)||0}})} className="w-full p-1.5 border rounded text-center"/></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* MONETARY */}
                                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                                    <h4 className="font-bold text-purple-800 text-sm mb-3 flex items-center"><DollarSign className="w-4 h-4 mr-2"/> Monetary (Total Uang)</h4>
                                    <div className="space-y-2 text-xs">
                                        {[5, 4, 3, 2].map((score) => (
                                            <div key={score} className="flex justify-between items-center">
                                                <label className="text-gray-600 font-semibold">Skor {score} (Min):</label>
                                                <div className="flex items-center w-32"><span className="mr-1 text-gray-500 font-mono">Rp</span><input type="number" value={tempConfig.monetary[score]} onChange={(e) => setTempConfig({...tempConfig, monetary: {...tempConfig.monetary, [score]: parseInt(e.target.value)||0}})} className="w-full p-1.5 border rounded text-right"/></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                        <button onClick={() => setShowRFMSettings(false)} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition-colors">Batal</button>
                        <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">Simpan & Terapkan</button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <RFMSettingsModal />
            
            {/* --- HEADER --- */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-white p-6 rounded-xl shadow-sm border border-indigo-100 gap-4">
                <div>
                    <h3 className="text-2xl font-bold text-gray-800 flex items-center"><Target className="w-6 h-6 mr-3 text-indigo-600" /> Analisis Segmen Pelanggan (RFM)</h3>
                    <p className="text-sm text-gray-500 mt-1 ml-9">Pahami perilaku belanja untuk meningkatkan retensi dan konversi.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <button onClick={() => setShowRFMSettings(true)} className="flex items-center justify-center px-4 py-2 text-sm font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors shadow-sm whitespace-nowrap">
                        <Settings className="w-4 h-4 mr-2" /> Konfigurasi {rfmMode === 'manual' ? '(Manual)' : '(Auto)'}
                    </button>
                </div>
            </div>
            
            {/* --- AI PREDICTIVE INSIGHTS CARD --- */}
            {effectiveData.length > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-5 rounded-xl border border-purple-100 animate-pulse-slow">
                    <div className="flex items-center mb-3">
                        <div className="p-2 bg-white rounded-lg mr-3 shadow-sm text-purple-600"><Zap className="w-5 h-5" /></div>
                        <h4 className="font-bold text-purple-900 text-lg">🔮 AI Predictive Insights</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white/60 p-3 rounded-lg border border-purple-200 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-purple-800 uppercase">Resiko Churn Tinggi</p>
                                <p className="text-xs text-gray-600">Pelanggan diprediksi akan berhenti belanja bulan depan.</p>
                            </div>
                            <span className="text-2xl font-bold text-red-600">{highRiskCount} <span className="text-xs text-gray-500 font-normal">Orang</span></span>
                        </div>
                        <div className="bg-white/60 p-3 rounded-lg border border-purple-200 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-purple-800 uppercase">Waktu Kontak Optimal</p>
                                <p className="text-xs text-gray-600">Sistem menganalisis riwayat jam transaksi per user.</p>
                            </div>
                            <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded">Lihat Tabel</span>
                        </div>
                    </div>
                </div>
            )}

            {effectiveData.length > 0 && (
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                        <div className="flex items-center">
                            <h4 className="text-lg font-bold text-gray-700 mr-2">Distribusi & Strategi Segmen</h4>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${rfmMode === 'auto' ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-indigo-100 text-indigo-600 border-indigo-200'}`}>Mode: {rfmMode === 'auto' ? 'Otomatis' : 'Manual'}</span>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setShowSegmentDetails(!showSegmentDetails)} className={`text-xs font-semibold flex items-center px-3 py-1.5 rounded-full transition-colors ${showSegmentDetails ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-600 hover:bg-indigo-50'}`}>
                                <BookOpen className="w-3 h-3 mr-1"/> {showSegmentDetails ? "Tutup Kamus" : "Buka Kamus Segmen"}
                            </button>
                        </div>
                    </div>

                    {/* --- KONTEN PANDUAN STRATEGI 4R (UPDATED) --- */}
                    <div className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100">
                        <div className="flex items-center mb-4">
                            <div className="p-2 bg-white rounded-lg mr-3 shadow-sm"><Activity className="w-5 h-5 text-blue-600" /></div>
                            <div>
                                <h4 className="font-bold text-blue-900 text-base">Kerangka Kerja Strategi 4R</h4>
                                <p className="text-xs text-blue-700">Tujuan strategis untuk setiap interaksi pelanggan.</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* 1. Relationship */}
                            <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm flex flex-col hover:shadow-md transition-shadow">
                                <h5 className="font-bold text-blue-800 text-sm mb-2 pb-2 border-b border-blue-50 flex items-center"><Users className="w-3 h-3 mr-2" />1. Relationship (Hubungan)</h5>
                                <div className="text-xs text-gray-600 space-y-2 flex-1">
                                    <p className="leading-relaxed">Fokus membangun kepercayaan, edukasi, & afinitas merek. Transisi dari transaksional ke emosional.</p>
                                    <div className="bg-blue-50 p-1.5 rounded border border-blue-100 mt-1">
                                        <p className="text-blue-700 font-semibold text-[10px]">🎯 Target: New Customers</p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* 2. Retention */}
                            <div className="bg-white p-4 rounded-lg border border-green-200 shadow-sm flex flex-col hover:shadow-md transition-shadow">
                                <h5 className="font-bold text-green-700 text-sm mb-2 pb-2 border-b border-green-50 flex items-center"><Repeat className="w-3 h-3 mr-2" />2. Retention (Retensi)</h5>
                                <div className="text-xs text-gray-600 space-y-2 flex-1">
                                    <p className="leading-relaxed">Jaga frekuensi beli & maksimalkan <em>Share of Wallet</em>. Ini adalah mesin pendapatan utama.</p>
                                    <div className="bg-green-50 p-1.5 rounded border border-green-100 mt-1">
                                        <p className="text-green-700 font-semibold text-[10px]">🎯 Target: Loyal, Promising</p>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Referral */}
                            <div className="bg-white p-4 rounded-lg border border-purple-200 shadow-sm flex flex-col hover:shadow-md transition-shadow">
                                <h5 className="font-bold text-purple-700 text-sm mb-2 pb-2 border-b border-purple-50 flex items-center"><UserPlus className="w-3 h-3 mr-2" />3. Referral (Rujukan)</h5>
                                <div className="text-xs text-gray-600 space-y-2 flex-1">
                                    <p className="leading-relaxed">Manfaatkan kepuasan pelanggan untuk akuisisi baru. Strategi pertumbuhan organik paling efisien.</p>
                                    <div className="bg-purple-50 p-1.5 rounded border border-purple-100 mt-1">
                                        <p className="text-purple-700 font-semibold text-[10px]">🎯 Target: Champions</p>
                                    </div>
                                </div>
                            </div>

                            {/* 4. Recovery */}
                            <div className="bg-white p-4 rounded-lg border border-red-200 shadow-sm flex flex-col hover:shadow-md transition-shadow">
                                <h5 className="font-bold text-red-700 text-sm mb-2 pb-2 border-b border-red-50 flex items-center"><RefreshCw className="w-3 h-3 mr-2" />4. Recovery (Pemulihan)</h5>
                                <div className="text-xs text-gray-600 space-y-2 flex-1">
                                    <p className="leading-relaxed">Menangkan kembali user yang berpotensi churn atau sudah pergi. Manajemen krisis.</p>
                                    <div className="bg-red-50 p-1.5 rounded border border-red-100 mt-1">
                                        <p className="text-red-700 font-semibold text-[10px]">🎯 Target: At Risk, Lost</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {showSegmentDetails && (
                        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 animate-fade-in bg-gray-50 p-4 rounded-lg border border-gray-200">
                            {TARGET_SEGMENTS_10.map((seg, idx) => (
                                <div key={idx} className="bg-white p-3 rounded border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center mb-2"><div className={`w-2 h-2 rounded-full mr-2 ${seg.color}`}></div><p className={`text-xs font-bold uppercase ${seg.text}`}>{seg.name}</p></div><p className="text-[10px] text-gray-500 leading-relaxed">{seg.desc}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="h-72 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" /><XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} tick={{ fontSize: 10, fontWeight: 500 }} height={50} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} /><Bar dataKey="count" radius={[4, 4, 0, 0]} onClick={(data) => setSelectedSegment(data.name)} className="cursor-pointer hover:opacity-80">{chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}</Bar></BarChart></ResponsiveContainer></div>
                </div>
            )}

            <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100 sticky top-2 z-20">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                    <div className="w-full xl:w-auto flex-1">
                        <div className="flex items-center mb-2"><Filter className="w-4 h-4 text-indigo-600 mr-2" /><h4 className="text-sm font-bold text-gray-700">Filter Data (Mempengaruhi Insight di Bawah)</h4></div>
                        <div className="flex flex-wrap gap-2">
                            <div className="relative"><input type="text" placeholder="Cari Nama / HP..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-indigo-500 w-40"/><Search className="w-3 h-3 text-gray-400 absolute left-2.5 top-2.5" /></div>
                            <select value={selectedSegment} onChange={(e) => setSelectedSegment(e.target.value)} className="border border-gray-300 rounded-md text-xs py-1.5 px-2 bg-white focus:ring-indigo-500 font-medium text-gray-700 cursor-pointer">{segmentOptions.map((option, idx) => (<option key={idx} value={option}>{option === 'All' ? 'Semua Segmen' : option}</option>))}</select>
                            <div className="relative" ref={dropdownRef}><button onClick={() => setIsProdDropdownOpen(!isProdDropdownOpen)} className="flex items-center justify-between px-3 py-1.5 text-xs font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-50 min-w-[140px]"><span className="truncate max-w-[120px]">{selectedProducts.length === 0 ? "Semua Produk" : `${selectedProducts.length} Produk`}</span><ChevronDown className="w-3 h-3 text-gray-400 ml-1" /></button>
                                {isProdDropdownOpen && (<div className="absolute z-20 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto"><div className="p-2 border-b border-gray-100 sticky top-0 bg-white"><button onClick={() => { setSelectedProducts([]); setIsProdDropdownOpen(false); }} className="text-xs text-red-500 font-bold hover:underline w-full text-left">Reset Produk</button></div>{productColumns.map((prod, idx) => (<div key={idx} onClick={() => { if (selectedProducts.includes(prod)) { setSelectedProducts(selectedProducts.filter(p => p !== prod)); } else { setSelectedProducts([...selectedProducts, prod]); } }} className="flex items-center px-3 py-2 hover:bg-indigo-50 cursor-pointer text-xs border-b border-gray-50 last:border-0"><div className={`w-3 h-3 border rounded mr-2 flex items-center justify-center ${selectedProducts.includes(prod) ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>{selectedProducts.includes(prod) && <Check className="w-2 h-2 text-white" />}</div><span className="truncate">{prod}</span></div>))}</div>)}
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 w-full xl:w-auto items-end bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="flex flex-col"><span className="text-[10px] font-bold text-gray-500 uppercase mb-1">Recency (Hari)</span><div className="flex items-center gap-1"><input type="number" placeholder="Min" value={recencyMin} onChange={(e) => setRecencyMin(e.target.value)} className="w-12 py-1 px-1 text-xs border border-gray-300 rounded text-center" /><span className="text-gray-400">-</span><input type="number" placeholder="Max" value={recencyMax} onChange={(e) => setRecencyMax(e.target.value)} className="w-12 py-1 px-1 text-xs border border-gray-300 rounded text-center" /></div></div>
                        <div className="flex flex-col"><span className="text-[10px] font-bold text-gray-500 uppercase mb-1">Freq (Kali)</span><div className="flex items-center gap-1"><input type="number" placeholder="Min" value={frequencyMin} onChange={(e) => setFrequencyMin(e.target.value)} className="w-10 py-1 px-1 text-xs border border-gray-300 rounded text-center" /><span className="text-gray-400">-</span><input type="number" placeholder="Max" value={frequencyMax} onChange={(e) => setFrequencyMax(e.target.value)} className="w-10 py-1 px-1 text-xs border border-gray-300 rounded text-center" /></div></div>
                        <div className="flex flex-col"><span className="text-[10px] font-bold text-gray-500 uppercase mb-1">Monetary (Rp)</span><div className="flex items-center gap-1"><input type="number" placeholder="Min" value={monetaryMin} onChange={(e) => setMonetaryMin(e.target.value)} className="w-16 py-1 px-1 text-xs border border-gray-300 rounded text-center" /><span className="text-gray-400">-</span><input type="number" placeholder="Max" value={monetaryMax} onChange={(e) => setMonetaryMax(e.target.value)} className="w-16 py-1 px-1 text-xs border border-gray-300 rounded text-center" /></div></div>
                        <button onClick={handleExportCSV} disabled={filteredTableData.length === 0} className={`ml-2 px-3 py-1.5 text-xs font-bold text-white rounded shadow-sm flex items-center transition-colors ${filteredTableData.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}><Download className="w-3 h-3 mr-1" /> CSV</button>
                    </div>
                </div>
            </div>

            {segmentInsights && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 animate-fade-in">
                    <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-3 rounded-lg shadow-sm text-white flex flex-col justify-center h-full min-h-[90px] relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity"><Users className="w-8 h-8 text-white" /></div><p className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider mb-1">Total Pelanggan</p><p className="text-xl font-bold leading-tight">{segmentInsights.totalPopulation} <span className="text-[10px] font-normal text-indigo-200">Orang</span></p><p className="text-[9px] text-indigo-300 mt-1">Dalam Filter Ini</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-lg shadow-sm text-white flex flex-col justify-center h-full min-h-[90px] relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity"><DollarSign className="w-8 h-8 text-white" /></div><p className="text-[10px] text-emerald-100 font-bold uppercase tracking-wider mb-1">Rata-rata CLV</p><p className="text-lg font-bold leading-tight">{formatRupiah(segmentInsights.avgRevenue)}</p><p className="text-[9px] text-emerald-100 mt-1">Nilai Per User</p>
                    </div>
                    
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-indigo-50 flex flex-col justify-center relative overflow-hidden group h-full min-h-[90px]">
                        <div className="absolute right-0 top-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity"><Star className="w-8 h-8 text-yellow-500" /></div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Produk Favorit</p>
                        <p className="text-sm font-bold text-gray-800 line-clamp-2 leading-tight" title={segmentInsights.favProduct}>{segmentInsights.favProduct}</p>
                        <p className="text-[10px] text-indigo-600 font-semibold mt-1">{segmentInsights.favProductCount} Transaksi</p>
                    </div>

                    {!isDigitalMode ? (
                        <div className="bg-white p-3 rounded-lg shadow-sm border border-indigo-50 flex flex-col justify-center relative overflow-hidden group h-full min-h-[90px]">
                            <div className="absolute right-0 top-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity"><MapPin className="w-8 h-8 text-red-500" /></div><p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Lokasi Dominan</p><p className="text-sm font-bold text-gray-800 leading-tight">{segmentInsights.domCity}</p><p className="text-[10px] text-indigo-600 font-semibold mt-1">{segmentInsights.domCityCount} Pelanggan</p>
                        </div>
                    ) : (
                        <div className="bg-white p-3 rounded-lg shadow-sm border border-indigo-50 flex flex-col justify-center relative overflow-hidden group h-full min-h-[90px]">
                            <div className="absolute right-0 top-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity"><Zap className="w-8 h-8 text-cyan-500" /></div><p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Mode Produk</p><p className="text-sm font-bold text-cyan-700 leading-tight">Digital Goods</p><p className="text-[10px] text-gray-400 mt-1">Tanpa pengiriman fisik</p>
                        </div>
                    )}
                    <div className={`bg-gradient-to-br from-yellow-400 to-orange-500 p-0.5 rounded-lg shadow-sm cursor-pointer transition-transform transform hover:scale-[1.02] active:scale-95 h-full min-h-[90px]`} onClick={() => setShowChatRecommendation(!showChatRecommendation)}><div className="bg-white/10 h-full w-full rounded-[6px] p-2 flex flex-col items-center justify-center text-white backdrop-blur-sm border border-white/20"><Zap className="w-5 h-5 mb-1 text-white" /><p className="font-bold text-xs text-center leading-tight">{showChatRecommendation ? "Tutup" : (selectedSegment === 'All' ? "Pilih Segmen" : "Strategi Segmen")}</p><p className="text-[9px] text-center text-white/80 mt-0.5">{selectedSegment === 'All' ? 'Utk lihat strategi' : 'Klik detail'}</p></div></div>
                </div>
            )}

             {showChatRecommendation && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 p-6 rounded-r-xl shadow-inner animate-fade-in-down">
                    <div className="flex items-center mb-4"><Zap className="w-5 h-5 mr-2 text-yellow-600 fill-current" /> <h4 className="text-lg font-bold text-gray-800">Rekomendasi Strategi: <span className="text-indigo-600">{selectedSegment === 'All' ? 'Semua Segmen (Umum)' : selectedSegment}</span></h4></div>
                    {selectedSegment === 'All' ? (<div className="bg-white p-6 rounded-lg border border-yellow-200 text-center"><div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3"><Target className="w-8 h-8 text-yellow-600" /></div><h5 className="font-bold text-gray-800 text-sm mb-1">Pilih Segmen Spesifik</h5><p className="text-xs text-gray-500 max-w-sm mx-auto">Silakan pilih salah satu segmen pada menu filter di atas (contoh: Champions, At Risk) untuk melihat strategi taktis dan template chat yang dipersonalisasi.</p></div>) : (
                        <div className="grid grid-cols-1 gap-4"><div className="bg-white p-5 rounded-lg shadow-sm border border-orange-100 flex flex-col md:flex-row gap-5"><div className="flex-1"><div className="flex items-center mb-3"><div className="p-2 bg-indigo-50 rounded-lg mr-3"><Target className="w-5 h-5 text-indigo-600" /></div><div><p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Fokus Utama</p><h5 className="font-bold text-base text-gray-800">{SEGMENT_PLAYBOOKS[selectedSegment]?.focus || "Optimasi Penjualan"}</h5></div></div><p className="text-sm text-gray-600 leading-relaxed mb-4">{SEGMENT_PLAYBOOKS[selectedSegment]?.action || "Lakukan pendekatan personal untuk meningkatkan loyalitas."}</p></div><div className="flex-1 bg-green-50 rounded-lg border border-green-100 p-4"><div className="flex justify-between items-center mb-2"><p className="text-[10px] text-green-700 font-bold uppercase flex items-center"><MessageSquare className="w-3 h-3 mr-1"/> Contoh Script Chat (Template)</p><button onClick={() => copyToClipboard(SEGMENT_PLAYBOOKS[selectedSegment]?.chat || "")} className="text-[10px] font-bold text-green-600 hover:text-green-800 flex items-center bg-white px-2 py-1 rounded border border-green-200"><Copy className="w-3 h-3 mr-1" /> Salin</button></div><div className="text-xs text-gray-700 font-mono bg-white p-3 rounded border border-green-200 leading-relaxed whitespace-pre-wrap">{SEGMENT_PLAYBOOKS[selectedSegment]?.chat || "Halo Kak {name}, terima kasih sudah berbelanja!"}</div><p className="text-[9px] text-green-600 mt-2 italic">*Ganti {`{name}`} dengan nama pelanggan secara otomatis jika menggunakan tools blast.</p></div></div></div>
                    )}
                </div>
            )}

             {effectiveData.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto max-h-[70vh]">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-16">No</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[200px]">Pelanggan</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{isDigitalMode ? "Email" : "Alamat Lengkap"}</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Recency</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Freq</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Monetary</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Skor RFM</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Segmen</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Resiko Churn</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Waktu Kontak</th>
                                    
                                    {productColumns.map((colName, idx) => (
                                        <th key={idx} className="px-2 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider border-l border-gray-100 min-w-[80px]"><div className="truncate w-full" title={colName}>{colName}</div></th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredTableData.map((customer, index) => (
                                    <tr key={index} className="hover:bg-indigo-50/30 transition-colors group">
                                        <td className="px-4 py-3 text-xs text-gray-500 text-center font-mono">{index + 1}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center">
                                                <div><div className="text-sm font-bold text-gray-800">{customer.name}</div><div className="flex flex-col mt-0.5"><div className="flex items-center gap-1 text-xs font-mono text-indigo-600 font-medium">{customer.phone || '-'}{customer.phone && customer.phone !== '-' && (<button onClick={() => copyToClipboard(customer.phone)} className="text-gray-400 hover:text-indigo-600 transition-opacity" title="Salin HP"><ClipboardCopy className="w-3 h-3" /></button>)}</div>{!isDigitalMode && (<div className="text-[10px] text-gray-500">{customer.city || ''}, {customer.province || ''}</div>)}</div></div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-600">{isDigitalMode ? (customer.email || <span className="text-gray-400 italic">No Email</span>) : (customer.address || '-')}</td>
                                        <td className="px-4 py-3 text-center"><span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${customer.R_Score >= 4 ? 'bg-green-100 text-green-700' : customer.R_Score <= 2 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{customer.recency} Hari</span></td>
                                        <td className="px-4 py-3 text-center text-sm font-medium text-gray-700">{customer.frequency}x</td>
                                        <td className="px-4 py-3 text-right text-sm font-bold text-gray-800 font-mono tracking-tight">{formatRupiah(customer.monetary)}</td>
                                        <td className="px-4 py-3 text-center"><div className="flex justify-center space-x-0.5"><span className={`w-4 h-4 flex items-center justify-center text-[10px] font-bold rounded ${customer.R_Score >= 4 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>{customer.R_Score}</span><span className={`w-4 h-4 flex items-center justify-center text-[10px] font-bold rounded ${customer.F_Score >= 4 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>{customer.F_Score}</span><span className={`w-4 h-4 flex items-center justify-center text-[10px] font-bold rounded ${customer.M_Score >= 4 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>{customer.M_Score}</span></div></td>
                                        <td className="px-4 py-3"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide text-white shadow-sm ${customer.Segment10Color}`}>{customer.Segment10Name}</span></td>
                                        
                                        <td className="px-4 py-3 text-center">
                                            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                                                <div className={`h-1.5 rounded-full ${customer.churnProbability > 70 ? 'bg-red-500' : customer.churnProbability > 40 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${customer.churnProbability}%` }}></div>
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-600">{customer.churnProbability}%</span>
                                        </td>
                                        
                                        <td className="px-4 py-3 text-center text-xs font-medium text-indigo-600 bg-indigo-50/50 rounded">{customer.optimalTime}</td>

                                        {productColumns.map((colName, idx) => {
                                            const qty = (customer.productMap && customer.productMap[colName]) ? customer.productMap[colName] : 0;
                                            return (<td key={idx} className="px-2 py-3 text-center border-l border-gray-100">{qty > 0 ? (<span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{qty}</span>) : (<span className="text-gray-200 text-[10px]">-</span>)}</td>);
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between"><span className="text-xs text-gray-500">Menampilkan {filteredTableData.length} dari {data.length} pelanggan</span></div>
                </div>
            )}
        </div>
    );
};

/// --- TIME ANALYSIS VIEW (COMPLETE: GROWTH + STRATEGIC SUMMARY) ---
const TimeAnalysisView = ({ rawData }) => {
    // State Filter Tahun
    const [selectedYear, setSelectedYear] = useState('All');

    // 1. Helper Format
    const formatRupiah = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
    const safeFloat = (val) => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        const str = val.toString();
        const cleanStr = str.replace(/[^0-9,-]/g, '').replace(',', '.');
        const num = parseFloat(cleanStr);
        return isNaN(num) ? 0 : num;
    };

    // 2. Get Available Years
    const availableYears = useMemo(() => {
        if (!rawData || rawData.length === 0) return [];
        const years = new Set();
        rawData.forEach(item => {
            const dateStr = item['confirmed_time'] || item['draft_time'];
            if (!dateStr) return;
            const date = new Date(dateStr.replace(' ', 'T'));
            if (!isNaN(date.getTime())) years.add(date.getFullYear());
        });
        return Array.from(years).sort((a, b) => b - a);
    }, [rawData]);

    // 3. Data Processing
    const { yearlyData, quarterlyData, monthlyData, insights } = useMemo(() => {
        const defaultInsights = {
            bestYearName: '-', bestYearValue: 0,
            bestQuarterName: '-', bestQuarterValue: 0,
            lastMonthGrowth: 0, lastMonthRevenue: 0,
            avgMonthly: 0
        };

        if (!rawData || rawData.length === 0) {
            return { yearlyData: [], quarterlyData: [], monthlyData: [], insights: defaultInsights };
        }

        // --- A. DATA GLOBAL (YEARLY) ---
        const yearsMap = {};
        rawData.forEach(item => {
            const dateStr = item['confirmed_time'] || item['draft_time'];
            if (!dateStr) return;
            const date = new Date(dateStr.replace(' ', 'T'));
            if (isNaN(date.getTime())) return;
            const rev = safeFloat(item['net_revenue']);
            const year = date.getFullYear();
            if (!yearsMap[year]) yearsMap[year] = 0; 
            yearsMap[year] += rev;
        });

        const currentYear = new Date().getFullYear();
        const yearlyArray = Object.entries(yearsMap)
            .map(([name, value]) => ({ name: parseInt(name), value }))
            .filter(d => d.name >= currentYear - 9)
            .sort((a, b) => a.name - b.name)
            .map((curr, i, arr) => {
                const prev = arr[i-1];
                const growth = (i > 0 && prev.value > 0) ? ((curr.value - prev.value) / prev.value) * 100 : 0;
                const isSelected = selectedYear !== 'All' && curr.name === parseInt(selectedYear);
                return { ...curr, growth, fill: isSelected ? '#F59E0B' : '#4F46E5' };
            });

        // --- B. DATA TERFILTER (QUARTERLY & MONTHLY) ---
        const filteredRawData = selectedYear === 'All' 
            ? rawData 
            : rawData.filter(item => {
                const d = new Date((item['confirmed_time'] || item['draft_time']).replace(' ', 'T'));
                return !isNaN(d.getTime()) && d.getFullYear() === parseInt(selectedYear);
            });

        const quartersMap = { 'Q1': 0, 'Q2': 0, 'Q3': 0, 'Q4': 0 };
        const monthsMap = {};
        let totalRevenueFiltered = 0;

        filteredRawData.forEach(item => {
            const dateStr = item['confirmed_time'] || item['draft_time'];
            if (!dateStr) return;
            const date = new Date(dateStr.replace(' ', 'T'));
            if (isNaN(date.getTime())) return;

            const rev = safeFloat(item['net_revenue']);
            const month = date.getMonth();
            
            totalRevenueFiltered += rev;

            // Quarterly
            const q = Math.floor(month / 3) + 1; 
            quartersMap[`Q${q}`] += rev;

            // Monthly
            const monthKey = selectedYear === 'All' 
                ? `${date.getFullYear()}-${String(month + 1).padStart(2, '0')}` 
                : String(month + 1).padStart(2, '0');
            
            if (!monthsMap[monthKey]) monthsMap[monthKey] = 0; 
            monthsMap[monthKey] += rev;
        });

        // Format Quarterly
        const quarterlyArray = Object.entries(quartersMap).map(([name, value], i, arr) => {
            const prevVal = i > 0 ? arr[i-1][1] : 0;
            const growth = (i > 0 && prevVal > 0) ? ((value - prevVal) / prevVal) * 100 : 0;
            return { name, value, growth };
        });

        // Format Monthly
        const monthlyArray = Object.entries(monthsMap)
            .map(([key, value]) => ({ key, value, name: key }))
            .sort((a, b) => a.key.localeCompare(b.key))
            .map((curr, i, arr) => {
                const prev = arr[i-1];
                const growth = (i > 0 && prev.value > 0) ? ((curr.value - prev.value) / prev.value) * 100 : 0;
                
                let label = curr.key;
                if (selectedYear !== 'All') {
                    const dateObj = new Date(parseInt(selectedYear), parseInt(curr.key)-1);
                    label = dateObj.toLocaleDateString('id-ID', { month: 'short' });
                } else {
                    const [y, m] = curr.key.split('-');
                    const dateObj = new Date(parseInt(y), parseInt(m)-1);
                    label = dateObj.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
                }
                return { ...curr, name: label, growth };
            });

        // Insights Calculation
        const bestYear = yearlyArray.length > 0 ? yearlyArray.reduce((max, c) => c.value > max.value ? c : max) : { name: '-', value: 0 };
        const bestQuarter = quarterlyArray.length > 0 ? quarterlyArray.reduce((max, c) => c.value > max.value ? c : max) : { name: '-', value: 0 };
        const lastMonth = monthlyArray.length > 0 ? monthlyArray[monthlyArray.length - 1] : { growth: 0, value: 0 };
        const avgRev = monthlyArray.length > 0 ? totalRevenueFiltered / monthlyArray.length : 0;

        return { 
            yearlyData: yearlyArray, 
            quarterlyData: quarterlyArray, 
            monthlyData: monthlyArray,
            insights: {
                bestYearName: bestYear.name, bestYearValue: bestYear.value,
                bestQuarterName: bestQuarter.name, bestQuarterValue: bestQuarter.value,
                lastMonthGrowth: lastMonth.growth || 0, lastMonthRevenue: lastMonth.value || 0,
                avgMonthly: avgRev
            }
        };
    }, [rawData, selectedYear]);

    // Custom Labels
    const GrowthLabel = (props) => {
        const { x, y, width, index, data } = props;
        const growth = data[index].growth;
        if (index === 0) return null;
        const isPositive = growth >= 0;
        return (
            <text x={x + width / 2} y={y - 25} fill={isPositive ? "#10B981" : "#EF4444"} textAnchor="middle" dominantBaseline="middle" fontSize={11} fontWeight="bold">
                {isPositive ? '+' : ''}{growth.toFixed(1)}%
            </text>
        );
    };

    const CustomizedQuarterLabel = (props) => {
        const { x, y, width, index, data } = props;
        const growth = data[index].growth;
        if (index === 0) return null;
        const isPositive = growth >= 0;
        return (
            <text x={x + width / 2} y={y - 25} fill={isPositive ? "#10B981" : "#EF4444"} textAnchor="middle" dominantBaseline="middle" fontSize={11} fontWeight="bold">
                {isPositive ? '+' : ''}{growth.toFixed(1)}%
            </text>
        );
    };

    // Insight Logic
    const getStrategyText = () => {
        const { lastMonthGrowth, bestQuarterName } = insights;
        let text = "";
        if (lastMonthGrowth >= 10) text = "Momentum sangat positif! Tingkatkan budget iklan untuk memaksimalkan tren naik ini.";
        else if (lastMonthGrowth > 0) text = "Pertumbuhan stabil. Pertahankan strategi saat ini dan fokus pada retensi pelanggan.";
        else if (lastMonthGrowth > -10) text = "Terjadi sedikit penurunan. Cek performa kreatif iklan atau tawarkan promo bundling.";
        else text = "Penurunan signifikan terdeteksi. Segera evaluasi harga produk atau strategi kompetitor.";
        
        text += ` Persiapkan stok maksimal menjelang ${bestQuarterName} (Kuartal Terbaik).`;
        return text;
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* HEADER & FILTER */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 flex items-center">
                        <TrendingUp className="w-6 h-6 mr-2 text-indigo-600" /> Analisis Waktu & Pertumbuhan
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Evaluasi performa strategis (Growth) Tahunan, Kuartal, dan Bulanan.</p>
                </div>
                
                {/* YEAR FILTER DROPDOWN */}
                <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-600">Pilih Tahun:</span>
                    <select 
                        value={selectedYear} 
                        onChange={(e) => setSelectedYear(e.target.value)} 
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2.5 font-bold cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                        <option value="All">Semua Tahun</option>
                        {availableYears.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* --- NEW: KESIMPULAN ANALISIS PERTUMBUHAN --- */}
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-cyan-50 p-6 rounded-xl shadow-md border border-blue-100">
                <h3 className="text-lg font-bold text-gray-800 flex items-center mb-4">
                    <Award className="w-5 h-5 mr-2 text-blue-600" /> Kesimpulan Kesehatan Bisnis
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    {/* Card 1: Best Year */}
                    <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm flex flex-col justify-center">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Tahun Keemasan</p>
                        <p className="text-lg font-extrabold text-blue-700 leading-tight">{insights.bestYearName}</p>
                        <p className="text-[10px] text-blue-400 mt-1">Total: {formatRupiah(insights.bestYearValue)}</p>
                    </div>
                    {/* Card 2: Best Quarter */}
                    <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm flex flex-col justify-center">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Kuartal Terbaik</p>
                        <p className="text-lg font-extrabold text-purple-600 leading-tight">{insights.bestQuarterName}</p>
                        <p className="text-[10px] text-gray-400 mt-1">Musim penjualan tertinggi</p>
                    </div>
                    {/* Card 3: Last Month Trend */}
                    <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm flex flex-col justify-center">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Tren Bulan Terakhir</p>
                        <div className={`flex items-center text-lg font-extrabold ${insights.lastMonthGrowth >= 0 ? 'text-green-600' : 'text-red-600'} leading-tight`}>
                            {insights.lastMonthGrowth >= 0 ? <TrendingUp className="w-4 h-4 mr-1"/> : <TrendingDown className="w-4 h-4 mr-1"/>}
                            {Math.abs(insights.lastMonthGrowth).toFixed(1)}%
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">vs bulan sebelumnya</p>
                    </div>
                    {/* Card 4: Average */}
                    <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm flex flex-col justify-center">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Rata-rata Bulanan</p>
                        <p className="text-lg font-extrabold text-gray-700 leading-tight">{formatRupiah(insights.avgMonthly)}</p>
                        <p className="text-[10px] text-gray-400 mt-1">Performa stabil {selectedYear === 'All' ? '(All Time)' : `(${selectedYear})`}</p>
                    </div>
                </div>
                <div className="bg-white/60 p-4 rounded-lg border border-blue-100 text-sm text-gray-700 leading-relaxed shadow-inner">
                    <p>
                        <span className="font-bold text-blue-700">💡 Rekomendasi Strategis:</span> {getStrategyText()}
                    </p>
                </div>
            </div>

            {/* === BAGIAN 1: STRATEGIC GROWTH === */}
            
            {/* YEARLY (TETAP MENAMPILKAN SEMUA TAHUN UNTUK KONTEKS) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-xl shadow-lg text-white flex flex-col justify-between">
                    <div>
                        <h4 className="text-white/80 font-bold text-sm uppercase tracking-wider mb-2">Tahun Terbaik (All Time)</h4>
                        <div className="flex items-baseline gap-2"><h2 className="text-4xl font-extrabold">{insights.bestYearName}</h2></div>
                        <p className="mt-2 text-indigo-100 text-sm">Total Omzet: <span className="font-bold text-white">{formatRupiah(insights.bestYearValue)}</span></p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-white/20"><p className="text-xs text-indigo-100 italic">"Grafik disamping selalu menampilkan data 10 tahun terakhir."</p></div>
                </div>
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center"><Calendar className="w-5 h-5 mr-2 text-indigo-600" /> Tren Tahunan (Global)</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={yearlyData} margin={{ top: 35, right: 20, bottom: 0, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" tick={{fontSize: 12}} />
                                <YAxis yAxisId="left" tickFormatter={(val) => (val/1000000).toFixed(0) + 'jt'} fontSize={11} />
                                <YAxis yAxisId="right" orientation="right" hide/>
                                <Tooltip formatter={(value, name) => [name === 'Growth' ? (value||0).toFixed(2)+'%' : formatRupiah(value), name === 'revenue' ? 'Omzet' : 'Pertumbuhan']} />
                                <Bar yAxisId="left" dataKey="value" name="revenue" barSize={40} radius={[4, 4, 0, 0]}>
                                    {yearlyData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill || '#4F46E5'} />
                                    ))}
                                    <LabelList dataKey="value" position="top" formatter={(val) => (val/1000000).toFixed(0) + 'jt'} fontSize={10} fill="#6366f1" />
                                    <LabelList content={<GrowthLabel data={yearlyData} />} />
                                </Bar>
                                <Line yAxisId="right" type="monotone" dataKey="growth" name="Growth" stroke="#F59E0B" strokeWidth={2} dot={{r:4}} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* QUARTERLY (DATA MENGIKUTI FILTER TAHUN) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center"><PieChartIcon className="w-5 h-5 mr-2 text-purple-600" /> Performa Kuartal {selectedYear !== 'All' ? `(${selectedYear})` : '(Gabungan)'}</h3>
                        <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded">QoQ</span>
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={quarterlyData} margin={{ top: 30, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" tick={{fontSize: 12, fontWeight:'bold'}} />
                                <YAxis hide />
                                <Tooltip formatter={(val) => formatRupiah(val)} />
                                <Bar dataKey="value" name="Omzet" fill="#8B5CF6" radius={[6, 6, 0, 0]} barSize={50}>
                                    <LabelList content={<CustomizedQuarterLabel data={quarterlyData} />} />
                                    <LabelList dataKey="value" position="insideBottom" formatter={(val) => (val/1000000).toFixed(0) + 'jt'} fill="white" fontSize={11} fontWeight="bold" />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col justify-center">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Rincian Kuartal</h3>
                    <div className="space-y-4">
                        {quarterlyData.map((q, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${['bg-purple-500', 'bg-pink-500', 'bg-yellow-500', 'bg-green-500'][idx]}`}>{q.name}</div>
                                    <div><p className="text-sm font-bold text-gray-700">Kuartal {idx + 1}</p></div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-gray-800">{formatRupiah(q.value)}</p>
                                    {idx > 0 && (
                                        <div className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded mt-1 ${q.growth >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {q.growth >= 0 ? <TrendingUp className="w-3 h-3 mr-1"/> : <TrendingDown className="w-3 h-3 mr-1"/>}
                                            {Math.abs(q.growth).toFixed(1)}%
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* MONTHLY (DATA MENGIKUTI FILTER TAHUN) */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center"><Activity className="w-5 h-5 mr-2 text-green-600" /> Tren Bulanan {selectedYear !== 'All' ? `(${selectedYear})` : ''}</h3>
                    <div className="flex items-center gap-2 mt-2 md:mt-0">
                        <span className="text-xs text-gray-500">Bulan Terakhir:</span>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${insights.lastMonthGrowth >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{insights.lastMonthGrowth >= 0 ? '+' : ''}{(insights.lastMonthGrowth || 0).toFixed(2)}%</span>
                    </div>
                </div>
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs><linearGradient id="colorMonthly" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/><stop offset="95%" stopColor="#10B981" stopOpacity={0}/></linearGradient></defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0"/>
                            <XAxis dataKey="name" tick={{fontSize: 10}} interval="preserveStartEnd" />
                            <YAxis tickFormatter={(val) => (val/1000000).toFixed(0) + 'jt'} fontSize={11} />
                            <Tooltip formatter={(value, name) => [name === 'growth' ? (value||0).toFixed(2)+'%' : formatRupiah(value), name === 'value' ? 'Omzet' : 'Pertumbuhan']} />
                            <Legend />
                            <Area type="monotone" dataKey="value" name="Omzet" stroke="#10B981" fillOpacity={1} fill="url(#colorMonthly)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                {/* LIST BULANAN (URUT JAN-DES ATAU KRONOLOGIS) */}
                <div className="mt-4 flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                    {monthlyData.slice(-12).map((m, i) => (
                        <div key={i} className="min-w-[120px] p-4 rounded-xl border border-gray-100 bg-white shadow-sm flex-shrink-0 flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div><p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{m.name}</p><p className="text-base font-extrabold text-gray-800 mt-1">{(m.value / 1000000).toFixed(1)}jt</p></div>
                            <div className="mt-3">{m.growth !== 0 ? (<div className={`flex items-center text-[10px] font-bold ${m.growth >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'} px-2 py-1 rounded-md w-fit`}>{m.growth >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}{Math.abs(m.growth).toFixed(1)}%</div>) : <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded-md">-</span>}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- HEATMAP & OPERATIONAL VIEW (COMPLETE: WITH DATE FILTER) ---
const HeatmapAnalysisView = ({ rawData }) => {
    // 1. State Filter Tanggal
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Helper Format
    const formatRupiah = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
    const safeFloat = (val) => typeof val === 'number' ? val : parseFloat((val || '0').toString().replace(/[^0-9,-]/g, '').replace(',', '.'));

    const { dayHeatmap, dateHeatmap, dayData, hourData, paydayData, maxHeatDay, maxHeatDate, heatmapInsights } = useMemo(() => {
        if (!rawData || rawData.length === 0) return { dayHeatmap: [], dateHeatmap: [], dayData: [], hourData: [], paydayData: [], maxHeatDay: 0, maxHeatDate: 0, heatmapInsights: {} };

        // Setup Filter Tanggal
        const start = startDate ? new Date(startDate) : new Date('1970-01-01'); start.setHours(0,0,0,0);
        const end = endDate ? new Date(endDate) : new Date('2099-12-31'); end.setHours(23,59,59,999);

        // 1. Containers
        const gridDay = Array(7).fill(0).map(() => Array(24).fill(0)); 
        const gridDate = Array(31).fill(0).map(() => Array(24).fill(0)); 
        const daysMap = [0, 0, 0, 0, 0, 0, 0]; // Revenue
        const hoursMap = Array(24).fill(0); // Frequency
        const paydayStats = { payday: 0, nonPayday: 0 }; 

        let maxValDay = 0;
        let maxValDate = 0;
        
        // Variables for Insights
        let peakDayIdx = 0;
        let peakHourIdx = 0;
        let peakVal = 0;

        // 2. Loop Data
        rawData.forEach(item => {
            const dateStr = item['confirmed_time'] || item['draft_time'];
            if (!dateStr) return;
            const date = new Date(dateStr.replace(' ', 'T'));
            if (isNaN(date.getTime())) return;

            // --- FILTER LOGIC ---
            if (date < start || date > end) return; 
            // --------------------

            const rev = safeFloat(item['net_revenue']);
            const day = date.getDay(); 
            const hour = date.getHours(); 
            const dateNum = date.getDate(); 

            // Heatmap Day
            gridDay[day][hour] += 1;
            if (gridDay[day][hour] > maxValDay) maxValDay = gridDay[day][hour];
            
            // Track Absolute Peak Time (Specific Day & Hour)
            if (gridDay[day][hour] > peakVal) {
                peakVal = gridDay[day][hour];
                peakDayIdx = day;
                peakHourIdx = hour;
            }

            // Heatmap Date
            if (dateNum >= 1 && dateNum <= 31) {
                gridDate[dateNum - 1][hour] += 1;
                if (gridDate[dateNum - 1][hour] > maxValDate) maxValDate = gridDate[dateNum - 1][hour];
            }

            daysMap[day] += rev;
            hoursMap[hour] += 1;

            if (dateNum >= 25 || dateNum <= 5) paydayStats.payday += rev;
            else paydayStats.nonPayday += rev;
        });

        // 3. Format Data
        const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const _dayData = daysMap.map((val, i) => ({ name: dayNames[i], value: val }));
        const _hourData = hoursMap.map((val, i) => ({ name: `${i}:00`, value: val }));
        const _paydayData = [
            { name: 'Periode Gajian (Tgl 25-5)', value: paydayStats.payday, fill: '#10B981' },
            { name: 'Tanggal Tua (Tgl 6-24)', value: paydayStats.nonPayday, fill: '#F59E0B' }
        ];

        // 4. Generate Automated Insights (Safe Check)
        const bestDayObj = _dayData.reduce((max, c) => c.value > max.value ? c : max, {name:'-', value:0});
        const bestHourObj = _hourData.reduce((max, c) => c.value > max.value ? c : max, {name:'-', value:0});
        
        let paydayWinner = "Data Kosong";
        if (paydayStats.payday > 0 || paydayStats.nonPayday > 0) {
            paydayWinner = paydayStats.payday > paydayStats.nonPayday ? "Saat Gajian" : "Tanggal Tua";
        }

        return { 
            dayHeatmap: gridDay, dateHeatmap: gridDate, dayData: _dayData, hourData: _hourData, paydayData: _paydayData, 
            maxHeatDay: maxValDay, maxHeatDate: maxValDate,
            heatmapInsights: {
                primeTimeDay: dayNames[peakDayIdx] || '-',
                primeTimeHour: `${peakHourIdx}:00`,
                bestRevenueDay: bestDayObj.name,
                bestRevenueVal: bestDayObj.value,
                busiestHour: bestHourObj.name,
                paydayTrend: paydayWinner
            }
        };
    }, [rawData, startDate, endDate]); // Dependency updated

    const getHeatmapColor = (val, max) => {
        if (val === 0) return 'bg-gray-50';
        const pct = max > 0 ? val / max : 0;
        if (pct < 0.2) return 'bg-indigo-100 text-indigo-800';
        if (pct < 0.4) return 'bg-indigo-300 text-white';
        if (pct < 0.6) return 'bg-indigo-400 text-white';
        if (pct < 0.8) return 'bg-indigo-500 text-white';
        return 'bg-indigo-700 text-white font-bold';
    };

    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    return (
        <div className="space-y-8 animate-fade-in">
            {/* HEADER & DATE FILTER */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 flex items-center">
                        <Activity className="w-6 h-6 mr-2 text-indigo-600" /> Analisis Pola Aktivitas (Heatmap)
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Temukan waktu "Prime Time" pelanggan Anda berbelanja.</p>
                </div>
                
                {/* DATE FILTER INPUTS */}
                <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Filter Tgl:</span>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-xs font-medium border-none bg-transparent p-0 text-gray-700 focus:ring-0 cursor-pointer"/>
                    <span className="text-gray-400">-</span>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="text-xs font-medium border-none bg-transparent p-0 text-gray-700 focus:ring-0 cursor-pointer"/>
                    {(startDate || endDate) && (
                        <button onClick={()=>{setStartDate('');setEndDate('');}} className="ml-2 text-red-500 hover:bg-red-50 rounded-full p-1 transition-colors" title="Hapus Filter">
                            <XCircle className="w-4 h-4"/>
                        </button>
                    )}
                </div>
            </div>

            {/* --- NEW: KESIMPULAN ANALISIS AKTIVITAS (SUMMARY) --- */}
            <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 p-6 rounded-xl shadow-md border border-indigo-100">
                <h3 className="text-lg font-bold text-gray-800 flex items-center mb-4">
                    <Zap className="w-5 h-5 mr-2 text-indigo-600" /> Kesimpulan Waktu Terbaik (Prime Time)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    {/* Card 1: Prime Time Spesifik */}
                    <div className="bg-white p-4 rounded-lg border border-indigo-100 shadow-sm flex flex-col justify-center">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Momen Paling Ramai</p>
                        <p className="text-lg font-extrabold text-indigo-700 leading-tight">
                            {heatmapInsights.primeTimeDay} <span className="text-sm font-normal text-gray-600">jam</span> {heatmapInsights.primeTimeHour}
                        </p>
                        <p className="text-[10px] text-indigo-400 mt-1">Kombinasi Hari & Jam Tertinggi</p>
                    </div>
                    {/* Card 2: Hari Terbaik (Omzet) */}
                    <div className="bg-white p-4 rounded-lg border border-indigo-100 shadow-sm flex flex-col justify-center">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Hari Paling Cuan</p>
                        <p className="text-lg font-extrabold text-green-600 leading-tight">{heatmapInsights.bestRevenueDay}</p>
                        <p className="text-[10px] text-gray-400 mt-1">Omzet: {formatRupiah(heatmapInsights.bestRevenueVal)}</p>
                    </div>
                    {/* Card 3: Jam Emas */}
                    <div className="bg-white p-4 rounded-lg border border-indigo-100 shadow-sm flex flex-col justify-center">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Jam Emas (Rata-rata)</p>
                        <p className="text-lg font-extrabold text-purple-600 leading-tight">Pukul {heatmapInsights.busiestHour}</p>
                        <p className="text-[10px] text-purple-400 mt-1">Waktu paling aktif setiap harinya</p>
                    </div>
                    {/* Card 4: Tren Gajian */}
                    <div className="bg-white p-4 rounded-lg border border-indigo-100 shadow-sm flex flex-col justify-center">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Tren Pembelian</p>
                        <p className="text-lg font-extrabold text-orange-600 leading-tight">Dominan {heatmapInsights.paydayTrend}</p>
                        <p className="text-[10px] text-orange-400 mt-1">Berdasarkan pola tanggal</p>
                    </div>
                </div>
                <div className="bg-white/60 p-4 rounded-lg border border-indigo-100 text-sm text-gray-700 leading-relaxed shadow-inner">
                    <p>
                        <span className="font-bold text-indigo-700">💡 Rekomendasi Taktis:</span> Jadwalkan posting konten penting atau broadcast WA pada hari <strong>{heatmapInsights.primeTimeDay}</strong> sekitar pukul <strong>{heatmapInsights.primeTimeHour}</strong> atau <strong>{heatmapInsights.busiestHour}</strong> untuk engagement maksimal. 
                        Jika ingin mengadakan Flash Sale, lakukan pada hari <strong>{heatmapInsights.bestRevenueDay}</strong>.
                    </p>
                </div>
            </div>

            {/* --- 1. HEATMAP HARI (Minggu - Sabtu) --- */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center">
                        <Calendar className="w-5 h-5 mr-2 text-blue-600" /> Peta Kesibukan Mingguan (Hari vs Jam)
                    </h3>
                    <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-bold">Semakin Gelap = Semakin Ramai</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-center border-collapse">
                        <thead>
                            <tr>
                                <th className="p-2 text-xs font-bold text-gray-500 border-b border-gray-100 bg-white sticky left-0 z-10">Hari \ Jam</th>
                                {Array.from({length: 24}).map((_, i) => (
                                    <th key={i} className="p-1 text-[10px] text-gray-400 font-mono border-b border-gray-100 min-w-[30px]">
                                        {i.toString().padStart(2,'0')}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {days.map((day, dIdx) => (
                                <tr key={day}>
                                    <td className="p-2 text-xs font-bold text-gray-700 text-left border-r border-gray-100 bg-white sticky left-0 z-10">
                                        {day}
                                    </td>
                                    {dayHeatmap[dIdx] && dayHeatmap[dIdx].map((val, hIdx) => (
                                        <td key={hIdx} className="p-0 border border-white">
                                            <div 
                                                className={`w-full h-8 flex items-center justify-center text-[9px] transition-all hover:opacity-80 cursor-pointer ${getHeatmapColor(val, maxHeatDay)}`}
                                                title={`${day} jam ${hIdx}:00 - ${val} Order`}
                                            >
                                                {val > 0 ? val : ''}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- 2. HEATMAP TANGGAL (1 - 31) --- */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center">
                        <MapPin className="w-5 h-5 mr-2 text-red-600" /> Peta Kesibukan Bulanan (Tanggal vs Jam)
                    </h3>
                </div>
                <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
                    <table className="w-full text-center border-collapse relative">
                        <thead className="sticky top-0 z-20 bg-white">
                            <tr>
                                <th className="p-2 text-xs font-bold text-gray-500 border-b border-gray-100 bg-white sticky left-0 z-30 shadow-sm">Tgl \ Jam</th>
                                {Array.from({length: 24}).map((_, i) => (
                                    <th key={i} className="p-1 text-[10px] text-gray-400 font-mono border-b border-gray-100 min-w-[30px] bg-white">
                                        {i.toString().padStart(2,'0')}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from({length: 31}).map((_, dateIdx) => (
                                <tr key={dateIdx}>
                                    <td className="p-2 text-xs font-bold text-gray-700 border-r border-gray-100 bg-white sticky left-0 z-10 text-center">
                                        {dateIdx + 1}
                                    </td>
                                    {dateHeatmap[dateIdx] && dateHeatmap[dateIdx].map((val, hIdx) => (
                                        <td key={hIdx} className="p-0 border border-white">
                                            <div 
                                                className={`w-full h-6 flex items-center justify-center text-[8px] transition-all hover:opacity-80 cursor-pointer ${getHeatmapColor(val, maxHeatDate)}`}
                                                title={`Tanggal ${dateIdx + 1} jam ${hIdx}:00 - ${val} Order`}
                                            >
                                                {val > 0 ? val : ''}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="text-xs text-gray-400 italic mt-3 text-center">Scroll ke bawah untuk melihat semua tanggal (1-31).</p>
            </div>

            {/* --- 3. PAYDAY & DAY OF WEEK --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                        <DollarSign className="w-5 h-5 mr-2 text-teal-600" /> Analisis Tanggal Gajian
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={paydayData} layout="vertical" margin={{top: 0, right: 50, left: 0, bottom: 0}}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={150} tick={{fontSize: 11, fontWeight: 'bold'}} />
                                <Tooltip formatter={(val) => formatRupiah(val)} cursor={{fill: 'transparent'}} />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40}>
                                    <LabelList dataKey="value" position="right" formatter={(val) => (val/1000000).toFixed(1) + 'jt'} fontSize={12} fontWeight="bold" />
                                    {paydayData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-gray-500 italic text-center mt-2">Perbandingan omzet saat orang baru gajian vs tanggal tua.</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                        <Calendar className="w-5 h-5 mr-2 text-blue-600" /> Pola Harian (Senin - Minggu)
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dayData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{fontSize: 11}} />
                                <YAxis hide />
                                <Tooltip formatter={(val) => formatRupiah(val)} />
                                <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                                    <LabelList dataKey="value" position="top" formatter={(val) => (val/1000000).toFixed(0) + 'jt'} fontSize={10} fill="#2563EB" />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* --- 4. HOURLY ACTIVITY --- */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-rose-600" /> Jam Kesibukan (Global Trend)
                </h3>
                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={hourData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorHourHeat" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#E11D48" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#E11D48" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="name" tick={{fontSize: 11}} interval={2} />
                            <YAxis tick={{fontSize: 11}} />
                            <Tooltip formatter={(val) => [val + ' Transaksi', 'Frekuensi']} />
                            <Area type="monotone" dataKey="value" stroke="#E11D48" fillOpacity={1} fill="url(#colorHourHeat)" strokeWidth={3} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <p className="text-xs text-gray-500 italic text-center mt-2">Grafik ini menunjukkan pukul berapa biasanya transaksi paling sering terjadi.</p>
            </div>
        </div>
    );
};

const DailyReportView = ({ confirmedOrders, customerSegmentationData, rawData, adsData, setView, isDigitalMode }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All'); 
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    const getDateObj = (dateStr) => { if (!dateStr) return null; return new Date(dateStr.replace(' ', 'T')); };

    const safeFloat = (val) => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        const str = val.toString();
        const cleanStr = str.replace(/[^0-9,-]/g, '').replace(',', '.'); 
        const num = parseFloat(cleanStr);
        return isNaN(num) ? 0 : num;
    };

    const { lostPotential, issueCount } = useMemo(() => {
        let revenue = 0; let count = 0; const today = new Date();
        rawData.forEach(order => {
            const status = (order['order_status'] || '').toLowerCase();
            const dateStr = order['draft_time'] || order['pending_time'];
            if (!dateStr) return;
            const orderDate = new Date(dateStr.replace(' ', 'T'));
            if (isNaN(orderDate.getTime())) return;
            const diffTime = Math.abs(today - orderDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if ((status === 'pending' && diffDays > 14) || status === 'rts' || status === 'canceled') { 
                revenue += safeFloat(order[COL_NET_REVENUE]); 
                count++; 
            }
        });
        return { lostPotential: revenue, issueCount: count };
    }, [rawData]);

    const filteredOrders = useMemo(() => {
        if (!startDate && !endDate) return confirmedOrders;
        const start = startDate ? new Date(startDate) : new Date('1970-01-01'); start.setHours(0,0,0,0);
        const end = endDate ? new Date(endDate) : new Date('2099-12-31'); end.setHours(23,59,59,999);
        return confirmedOrders.filter(item => {
            const dateStr = item[COL_CONFIRMED_TIME]; if (!dateStr) return false;
            const itemDate = getDateObj(dateStr); if (!itemDate || isNaN(itemDate.getTime())) return false;
            return itemDate >= start && itemDate <= end;
        }).sort((a, b) => getDateObj(b[COL_CONFIRMED_TIME]) - getDateObj(a[COL_CONFIRMED_TIME]));
    }, [confirmedOrders, startDate, endDate]);

    const filteredAdSpend = useMemo(() => {
        if (!adsData || adsData.length === 0) return 0;
        const start = startDate ? new Date(startDate) : new Date('1970-01-01'); start.setHours(0, 0, 0, 0);
        const end = endDate ? new Date(endDate) : new Date('2099-12-31'); end.setHours(23, 59, 59, 999);

        const rawTotal = adsData.reduce((acc, row) => {
            const name = row[ADS_CAMPAIGN_NAME] || row['campaign_name'];
            if (!name || ['total', 'results', 'summary'].includes(name.toString().toLowerCase())) return acc;
            const spend = parseFloat(row[ADS_AMOUNT_SPENT] || row['amount_spent'] || row['amount_spent__idr'] || 0);
            if (startDate || endDate) {
                const dateVal = row['day'] || row['date_start'] || row['date'] || row['reporting_starts'] || row['date_created'];
                if (dateVal) {
                    const d = parseAdDate(dateVal);
                    if (d) { d.setHours(0, 0, 0, 0); if (d >= start && d <= end) return acc + spend; }
                }
                return acc;
            }
            return acc + spend;
        }, 0);
        return rawTotal * 1.11;
    }, [adsData, startDate, endDate]);

    const filteredRawData = useMemo(() => {
         if (!rawData) return []; let data = rawData;
         if (startDate || endDate) {
             const start = startDate ? new Date(startDate) : new Date('1970-01-01'); start.setHours(0,0,0,0);
             const end = endDate ? new Date(endDate) : new Date('2099-12-31'); end.setHours(23,59,59,999);
             data = data.filter(item => {
                 const dateStr = item['draft_time'] || item['pending_time'] || item['confirmed_time']; if (!dateStr) return false;
                 const itemDate = getDateObj(dateStr); if (!itemDate || isNaN(itemDate.getTime())) return false;
                 return itemDate >= start && itemDate <= end;
             });
         }
         return data.sort((a, b) => getDateObj(b['draft_time'] || b[COL_CONFIRMED_TIME]) - getDateObj(a['draft_time'] || a[COL_CONFIRMED_TIME]));
    }, [rawData, startDate, endDate]);

    const tableData = useMemo(() => {
        let data = filteredRawData;
        if (statusFilter !== 'All') { data = data.filter(item => (item['order_status'] || '').toLowerCase() === statusFilter.toLowerCase()); }
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            data = data.filter(order => {
                return (order[COL_ORDER_ID] || '').toLowerCase().includes(lowerTerm) || (order[COL_NAME] || '').toLowerCase().includes(lowerTerm) || (order[COL_PHONE] || '').toLowerCase().includes(lowerTerm);
            });
        }
        return data;
    }, [filteredRawData, statusFilter, searchTerm]);

    useEffect(() => { setCurrentPage(1); }, [tableData]);

    const totalPages = Math.ceil(tableData.length / itemsPerPage);
    const currentTableData = tableData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalAllOrdersInPeriod = filteredRawData.length;
    const pendingCount = filteredRawData.filter(o => (o['order_status'] || '').toLowerCase() === 'pending').length;

    const customerSegmentMap = useMemo(() => {
        const map = new Map(); customerSegmentationData.forEach(c => { map.set(c.name, { name: c.Segment10Name, color: c.Segment10Color }); }); return map;
    }, [customerSegmentationData]);

    const { totalRevenue, totalGrossRevenue, totalTransactions, aov, totalCustomers, trendData, topProducts, statusBreakdownData, hourlyActivityData, customerTypeChartData, paymentMethodChartData, utmSourceChartData, totalProfit, profitMargin, totalSoldItems, financialEntityChartData, topLocationLists, avgClosingTime } = useMemo(() => {
        const _totalRevenue = filteredOrders.reduce((sum, item) => sum + safeFloat(item[COL_NET_REVENUE]), 0);
        const _totalGrossRevenue = filteredOrders.reduce((sum, item) => sum + safeFloat(item[COL_GROSS_REVENUE]), 0); 
        const _totalTransactions = filteredOrders.length;
        const _aov = _totalTransactions > 0 ? _totalRevenue / _totalTransactions : 0;
        let _totalProfit = 0;
        
        let totalClosingTimeMinutes = 0;
        let closedOrdersCount = 0;

        const paymentStats = {};
        const utmStats = {};
        const finEntityStats = {};
        const typeStats = { 'New': { count: 0, revenue: 0 }, 'Repeat': { count: 0, revenue: 0 } };
        
        const custFreqMap = {};
        customerSegmentationData.forEach(c => custFreqMap[c.name] = c.frequency);
        const processedCustomers = new Set(); 

        filteredOrders.forEach(item => {
            const netRev = safeFloat(item[COL_NET_REVENUE]);
            const grossRev = safeFloat(item[COL_GROSS_REVENUE]); 
            const prodDisc = safeFloat(item[COL_PRODUCT_DISCOUNT]); 
            const shipDisc = safeFloat(item[COL_SHIPPING_DISCOUNT]); 
            const cogs = safeFloat(item[COL_COGS]); 
            const payFee = safeFloat(item[COL_PAYMENT_FEE]); 
            const shipCost = safeFloat(item[COL_SHIPPING_COST]);
            _totalProfit += (grossRev - prodDisc - shipDisc) - cogs - payFee - shipCost;

            const pendingStr = item['pending_time'];
            const confirmStr = item[COL_CONFIRMED_TIME];
            if (pendingStr && confirmStr) {
                const d = getDateObj(pendingStr);
                const c = getDateObj(confirmStr);
                if (d && c && c > d) {
                    const diffMins = (c - d) / (1000 * 60);
                    if (diffMins > 0 && diffMins < 43200) { totalClosingTimeMinutes += diffMins; closedOrdersCount++; }
                }
            }

            const payMethod = (item['payment_method'] || item['epayment_provider'] || 'Lainnya').toUpperCase().replace('_', ' ');
            if (!paymentStats[payMethod]) paymentStats[payMethod] = { count: 0, revenue: 0 };
            paymentStats[payMethod].count += 1;
            paymentStats[payMethod].revenue += netRev;

            let source = (item[COL_UTM_SOURCE] || 'Organic/Direct').trim();
            if (!source || source === '-' || source === '') source = 'Organic/Direct';
            source = source.charAt(0).toUpperCase() + source.slice(1);
            if (!utmStats[source]) utmStats[source] = { count: 0, revenue: 0 };
            utmStats[source].count += 1;
            utmStats[source].revenue += netRev;

            let entity = (item[COL_FINANCIAL_ENTITY] || '').trim();
            if(entity && entity !== '-' && entity.toLowerCase() !== 'unknown') {
                entity = entity.toUpperCase();
                if (!finEntityStats[entity]) finEntityStats[entity] = { count: 0, revenue: 0 };
                finEntityStats[entity].count += 1;
                finEntityStats[entity].revenue += netRev;
            }

            const name = item[COL_NAME];
            const freq = custFreqMap[name];
            const typeKey = (freq && freq > 1) ? 'Repeat' : 'New';
            
            typeStats[typeKey].revenue += netRev;
            if (!processedCustomers.has(name)) {
                typeStats[typeKey].count += 1;
                processedCustomers.add(name);
            }
        });
        
        const _avgClosingTime = closedOrdersCount > 0 ? Math.round(totalClosingTimeMinutes / closedOrdersCount) : 0;
        const _profitMargin = _totalRevenue > 0 ? (_totalProfit / _totalRevenue) * 100 : 0;
        const _totalCustomers = new Set(filteredOrders.map(o => o[COL_NAME]).filter(Boolean)).size;
        
        const _trendStats = Array(31).fill(null).map((_, i) => ({ day: i + 1, revenue: 0, transactions: 0 }));
        filteredOrders.forEach(item => {
            const dateStr = item[COL_CONFIRMED_TIME];
            if (dateStr) { 
                const itemDate = getDateObj(dateStr); 
                if (itemDate && !isNaN(itemDate.getTime())) { 
                    const dayIndex = itemDate.getDate() - 1; 
                    if (dayIndex >= 0 && dayIndex < 31) { 
                        _trendStats[dayIndex].revenue += safeFloat(item[COL_NET_REVENUE]); 
                        _trendStats[dayIndex].transactions += 1; 
                    }
                }
            }
        });

        const allVariantKeys = new Set(); const sourceData = (rawData && rawData.length > 0) ? rawData : filteredOrders; sourceData.forEach(row => { Object.keys(row).forEach(key => { if (key.startsWith('variant:')) allVariantKeys.add(key); }); });
        const variantColumns = Array.from(allVariantKeys).map(normalizedKey => ({ rawName: normalizedKey.replace('variant:', '').replace(/_/g, ' ').toUpperCase(), normalized: normalizedKey }));
        const variantStats = {}; let _totalSoldItems = 0;
        const provCounts = {}; const cityCounts = {}; const subCounts = {};

        filteredOrders.forEach(item => {
            const orderRev = safeFloat(item[COL_NET_REVENUE]); 
            let totalItemsInOrder = 0;
            variantColumns.forEach(({ normalized }) => { const qty = parseFloat(item[normalized] || 0); if (!isNaN(qty) && qty > 0) totalItemsInOrder += qty; });
            _totalSoldItems += totalItemsInOrder;
            variantColumns.forEach(({ rawName, normalized }) => {
                const quantity = parseFloat(item[normalized] || 0);
                if (!isNaN(quantity) && quantity > 0) {
                    if (!variantStats[rawName]) variantStats[rawName] = { name: rawName, totalQuantity: 0, totalRevenue: 0 };
                    variantStats[rawName].totalQuantity += quantity;
                    const weightedRev = totalItemsInOrder > 0 ? (quantity / totalItemsInOrder) * orderRev : 0;
                    variantStats[rawName].totalRevenue += weightedRev;
                }
            });
            const prov = (item[COL_PROVINCE] || '').trim(); const city = (item[COL_CITY] || '').trim(); const sub = (item[COL_SUBDISTRICT] || '').trim();
            if(prov && prov !== '-' && prov.toLowerCase() !== 'unknown') { if(!provCounts[prov]) provCounts[prov] = { count: 0, revenue: 0 }; provCounts[prov].count += 1; provCounts[prov].revenue += orderRev; }
            if(city && city !== '-' && city.toLowerCase() !== 'unknown') { if(!cityCounts[city]) cityCounts[city] = { count: 0, revenue: 0 }; cityCounts[city].count += 1; cityCounts[city].revenue += orderRev; }
            if(sub && sub !== '-' && sub.toLowerCase() !== 'unknown') { if(!subCounts[sub]) subCounts[sub] = { count: 0, revenue: 0 }; subCounts[sub].count += 1; subCounts[sub].revenue += orderRev; }
        });

        const _topProvinces = Object.entries(provCounts).map(([name, data]) => ({ name, value: data.count, revenue: data.revenue })).sort((a, b) => b.value - a.value).slice(0, 10);
        const _topCities = Object.entries(cityCounts).map(([name, data]) => ({ name, value: data.count, revenue: data.revenue })).sort((a, b) => b.value - a.value).slice(0, 10);
        const _topSubdistricts = Object.entries(subCounts).map(([name, data]) => ({ name, value: data.count, revenue: data.revenue })).sort((a, b) => b.value - a.value).slice(0, 10);
        const _topProducts = Object.values(variantStats).sort((a,b) => b.totalQuantity - a.totalQuantity).slice(0, 10);
        
        const statusCounts = {}; filteredRawData.forEach(item => { const status = (item['order_status'] || 'Unknown').toLowerCase().replace(' ', '_'); statusCounts[status] = (statusCounts[status] || 0) + 1; });
        const _statusBreakdownData = Object.entries(statusCounts).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '), value, color: STATUS_COLORS[name] || '#94a3b8' })).sort((a, b) => b.value - a.value);
        const hourlyCounts = Array(24).fill(0).map((_, i) => ({ hour: i, count: 0 })); filteredRawData.forEach(item => { const timeStr = item['draft_time'] || item['confirmed_time']; if (timeStr) { const itemDate = getDateObj(timeStr); if (itemDate && !isNaN(itemDate.getTime())) { const hour = itemDate.getHours(); if (hour >= 0 && hour < 24) hourlyCounts[hour].count += 1; }}});
        const _hourlyActivityData = hourlyCounts.map(d => ({ hour: `${d.hour.toString().padStart(2, '0')}:00`, count: d.count }));
        
        const _paymentMethodChartData = Object.entries(paymentStats).map(([name, d]) => ({ name, value: d.count, revenue: d.revenue })).sort((a, b) => b.value - a.value);
        const _customerTypeChartData = Object.entries(typeStats).map(([name, d]) => ({ name, value: d.count, revenue: d.revenue })).sort((a, b) => b.value - a.value);
        const _utmSourceChartData = Object.entries(utmStats).map(([name, d]) => ({ name, value: d.count, revenue: d.revenue })).sort((a, b) => b.value - a.value).slice(0, 5);
        const _financialEntityChartData = Object.entries(finEntityStats).map(([name, d]) => ({ name, value: d.count, revenue: d.revenue })).sort((a, b) => b.value - a.value);

        return { 
            totalRevenue: _totalRevenue, totalGrossRevenue: _totalGrossRevenue, totalTransactions: _totalTransactions, aov: _aov, totalCustomers: _totalCustomers, trendData: _trendStats, topProducts: _topProducts, statusBreakdownData: _statusBreakdownData, hourlyActivityData: _hourlyActivityData, 
            customerTypeChartData: _customerTypeChartData, paymentMethodChartData: _paymentMethodChartData, utmSourceChartData: _utmSourceChartData, financialEntityChartData: _financialEntityChartData,
            totalProfit: _totalProfit, profitMargin: _profitMargin, totalSoldItems: _totalSoldItems, 
            topLocationLists: { provinces: _topProvinces, cities: _topCities, subdistricts: _topSubdistricts },
            avgClosingTime: _avgClosingTime
        };
    }, [filteredOrders, filteredRawData, customerSegmentationData, rawData]);

    const dailyRealNetProfit = totalProfit - filteredAdSpend;
    const avgBasketSize = totalTransactions > 0 ? (totalSoldItems / totalTransactions).toFixed(1) : "0";
    
    const formatDuration = (minutes) => {
        if (minutes < 60) return `${minutes} Menit`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours} Jam ${mins} Menit`;
    };

    const topSpenders = useMemo(() => {
        const spenderMap = {};
        filteredOrders.forEach(order => {
            const name = order[COL_NAME];
            const revenue = safeFloat(order[COL_NET_REVENUE]);
            if (!name) return;
            if (!spenderMap[name]) { spenderMap[name] = { name, revenue: 0, count: 0, city: order[COL_CITY] || '-', province: order[COL_PROVINCE] || '-' }; }
            spenderMap[name].revenue += revenue; spenderMap[name].count += 1;
        });
        return Object.values(spenderMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    }, [filteredOrders]);

    // --- [MISSING PART] LOGIC SUMMARY INSIGHTS ---
    const summaryInsights = useMemo(() => {
        const bestProduct = topProducts.length > 0 ? topProducts[0] : null;
        const bestCity = topLocationLists.cities.length > 0 ? topLocationLists.cities[0] : null;
        const bestProvince = topLocationLists.provinces.length > 0 ? topLocationLists.provinces[0] : null; 
        const bestSource = utmSourceChartData.length > 0 ? utmSourceChartData[0] : null;
        
        let peakHourObj = { hour: '-', count: 0 };
        if (hourlyActivityData && hourlyActivityData.length > 0) {
             peakHourObj = hourlyActivityData.reduce((max, current) => current.count > max.count ? current : max, hourlyActivityData[0]);
        }

        let bestDayObj = { day: '-', revenue: 0 };
        if (trendData && trendData.length > 0) {
             bestDayObj = trendData.reduce((max, current) => current.revenue > max.revenue ? current : max, trendData[0]);
        }

        return {
            productName: bestProduct ? bestProduct.name : "-",
            productQty: bestProduct ? bestProduct.totalQuantity : 0,
            cityName: bestCity ? bestCity.name : "-",
            cityCount: bestCity ? bestCity.value : 0,
            provinceName: bestProvince ? bestProvince.name : "-", 
            provinceCount: bestProvince ? bestProvince.value : 0, 
            sourceName: bestSource ? bestSource.name : "-",
            sourceCount: bestSource ? bestSource.value : 0,
            revenue: formatRupiah(totalRevenue),
            trx: totalTransactions,
            peakHour: peakHourObj.hour,
            peakHourCount: peakHourObj.count,
            bestDay: bestDayObj.day, 
            bestDayRevenue: formatRupiah(bestDayObj.revenue) 
        };
    }, [topProducts, topLocationLists, utmSourceChartData, totalRevenue, totalTransactions, hourlyActivityData, trendData]);

    const closingRate = totalAllOrdersInPeriod > 0 ? ((totalTransactions / totalAllOrdersInPeriod) * 100).toFixed(2) : 0;
    const getProductSummary = (order) => { const variantKeys = Object.keys(order).filter(k => k.startsWith('variant:') && parseFloat(order[k] || 0) > 0); if (variantKeys.length === 0) return '-'; return variantKeys.map(k => { const name = k.replace('variant:', '').replace(/_/g, ' ').toUpperCase(); const qty = order[k]; return `${name} (${qty})`; }).join(', '); };
    
    const handleExportDailyReport = () => {
        if (tableData.length === 0) { alert("Tidak ada data untuk diekspor."); return; }
        const headers = ["Order ID", "Tanggal Konfirmasi", "Status", "Nama Pelanggan", "No HP", "Email", "Kota", "Provinsi", "Produk (Qty)", "Total Nilai (IDR)", "Kurir", "Metode Bayar"];
        const rows = tableData.map(item => {
            const clean = (t) => `"${(t || '').toString().replace(/"/g, '""')}"`;
            return [ clean(item[COL_ORDER_ID]), clean(item[COL_CONFIRMED_TIME] || item['draft_time']), clean(item['order_status']), clean(item[COL_NAME]), clean(item[COL_PHONE]), clean(item['email']), clean(item[COL_CITY]), clean(item[COL_PROVINCE]), clean(getProductSummary(item)), safeFloat(item[COL_NET_REVENUE]), clean(item[COL_COURIER]), clean(item[COL_PAYMENT_METHOD] || item['epayment_provider']) ].join(",");
        });
        const csvContent = [headers.join(","), ...rows].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a"); const fileName = `Laporan_Transaksi_Harian_${new Date().toISOString().slice(0,10)}.csv`;
        link.setAttribute("href", url); link.setAttribute("download", fileName); document.body.appendChild(link); link.click(); document.body.removeChild(link);
    };

    return (
       <div className="space-y-8 animate-fade-in">
            {/* --- PERINGATAN ISU (MERAH) --- */}
            {issueCount > 0 && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center animate-pulse-slow">
                    <div className="flex items-start">
                        <div className="flex-shrink-0"><AlertTriangle className="h-6 w-6 text-red-600" /></div>
                        <div className="ml-3">
                            <h3 className="text-lg font-bold text-red-800">Peringatan: {issueCount} Pesanan Bermasalah Ditemukan!</h3>
                            <div className="mt-1 text-sm text-red-700"><p>Terdapat potensi kehilangan omzet sebesar <span className="font-extrabold">{formatRupiah(lostPotential)}</span> dari pesanan Pending ({'>'}14 hari), RTS, dan Cancel.</p></div>
                        </div>
                    </div>
                    <button onClick={() => setView('recovery')} className="mt-3 sm:mt-0 flex-shrink-0 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-red-700 transition-colors flex items-center">Lihat & Pulihkan <ArrowRight className="ml-2 w-4 h-4" /></button>
                </div>
            )}

            {/* --- FILTER BAR --- */}
            <div className="bg-white p-4 rounded-xl shadow border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-2"><Filter className="w-5 h-5 text-indigo-600" /><h3 className="font-semibold text-gray-800">Filter Laporan:</h3></div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200"><span className="text-xs text-gray-500 font-bold uppercase">Dari</span><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-sm font-medium focus:outline-none text-gray-700"/></div>
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200"><span className="text-xs text-gray-500 font-bold uppercase">Sampai</span><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-sm font-medium focus:outline-none text-gray-700"/></div>
                    {(startDate || endDate) && (<button onClick={() => { setStartDate(''); setEndDate(''); }} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors" title="Reset Filter"><XCircle className="w-5 h-5" /></button>)}
                </div>
            </div>

            <div className="space-y-6">
                {/* --- STATISTIK KEUANGAN --- */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-indigo-100">
                    <h3 className="text-base font-bold text-gray-700 flex items-center mb-4 border-b pb-2"><DollarSign className="w-4 h-4 mr-2 text-green-600" /> Kinerja Keuangan (Financial Performance)</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <StatCard compact title="Total Gross Revenue" value={formatRupiah(totalGrossRevenue)} icon={Wallet} color="#8b5cf6" />
                        <StatCard compact title="Net Revenue" value={formatRupiah(totalRevenue)} icon={DollarSign} color="#2563EB" />
                        <StatCard compact title="Est. Net Profit" value={formatRupiah(totalProfit)} icon={TrendingUp} color="#10B981" description="(Gross - Disc) - COGS" />
                        <StatCard compact title="Total Ad Spend" value={formatRupiah(filteredAdSpend)} icon={Megaphone} color="#EF4444" description="(+Ppn 11%)" />
                        <StatCard compact title="Real Net Profit" value={formatRupiah(dailyRealNetProfit)} icon={Coins} color={dailyRealNetProfit > 0 ? "#10B981" : "#EF4444"} description="Laba Bersih - Ads" />
                        <StatCard compact title="Profit Margin" value={profitMargin.toFixed(1) + "%"} icon={PieChartIcon} color={profitMargin > 30 ? "#10B981" : profitMargin > 15 ? "#F59E0B" : "#EF4444"} />
                    </div>
                </div>

                {/* --- STATISTIK VOLUME & EFISIENSI --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-indigo-100 h-full">
                        <h3 className="text-base font-bold text-gray-700 flex items-center mb-4 border-b pb-2"><ShoppingBag className="w-4 h-4 mr-2 text-purple-600" /> Volume Transaksi</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <StatCard compact title="Semua Pesanan" value={totalAllOrdersInPeriod} icon={ShoppingBag} color="#6366f1" unit="Order" description="Termasuk Batal/RTS" />
                            <StatCard compact title="Transaksi Valid" value={totalTransactions} icon={CheckCircle} color="#10B981" unit="Trx" description="Confirmed/Completed" />
                            <StatCard compact title="Pending Orders" value={pendingCount} icon={AlertTriangle} color="#F59E0B" unit="Order" description="Belum dibayar" />
                            <StatCard compact title="Pelanggan Unik" value={totalCustomers} icon={Users} color="#06b6d4" unit="Org" />
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-indigo-100 h-full">
                        <h3 className="text-base font-bold text-gray-700 flex items-center mb-4 border-b pb-2"><Activity className="w-4 h-4 mr-2 text-blue-600" /> Efisiensi Operasional</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <StatCard compact title="Closing Rate" value={closingRate + "%"} icon={Target} color="#EC4899" unit="Conv" description="% Transaksi Valid" />
                            <StatCard compact title="Avg Closing Time" value={formatDuration(avgClosingTime)} icon={Clock} color="#F59E0B" description="Pending ke Confirmed" />
                            <StatCard compact title="Avg Basket Size" value={avgBasketSize} icon={Boxes} color="#F97316" unit="Item/Order" />
                            <StatCard compact title="Total Produk Terjual" value={totalSoldItems.toLocaleString()} icon={Package} color="#d946ef" unit="Pcs" />
                        </div>
                    </div>
                </div>

                {/* --- TREN HARIAN & TOP LISTS (FIXED LAYOUT) --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col h-full">
                        <div className="mb-4"><h3 className="text-xl font-semibold text-gray-800 flex items-center"><Calendar className="w-5 h-5 mr-2 text-indigo-600" />Tren Harian (Akumulasi Tanggal 1 - 31)</h3><p className="text-sm text-gray-500 mt-1">Grafik gabungan: Batang untuk Net Revenue dan Garis untuk Jumlah Transaksi (Hanya Confirmed).</p></div>
                        <div className="flex-1 w-full min-h-[400px]"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={trendData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}><CartesianGrid stroke="#f5f5f5" /><XAxis dataKey="day" label={{ value: 'Tanggal', position: 'insideBottomRight', offset: -5 }} tick={{fontSize: 11}} /><YAxis yAxisId="left" orientation="left" stroke="#2563EB" tickFormatter={(val) => (val/1000).toFixed(0)+'k'} fontSize={11} /><YAxis yAxisId="right" orientation="right" stroke="#F59E0B" fontSize={11} /><Tooltip contentStyle={{borderRadius:'8px', border:'none', boxShadow:'0 4px 6px -1px rgba(0,0,0,0.1)'}} formatter={(value, name) => [name === 'Revenue' ? formatRupiah(value) : value, name]} /><Legend wrapperStyle={{paddingTop: '10px'}}/><Bar yAxisId="left" dataKey="revenue" name="Revenue" barSize={20} fill="#2563EB" radius={[4, 4, 0, 0]} /><Line yAxisId="right" type="monotone" dataKey="transactions" name="Transaksi" stroke="#F59E0B" strokeWidth={3} dot={{r: 4}} /></ComposedChart></ResponsiveContainer></div>
                    </div>
                    <div className="flex flex-col gap-6 h-full">
                        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col flex-1"><h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2 flex items-center"><Award className="w-5 h-5 mr-2 text-pink-600" />Top 5 Varian Terlaris</h3><div className="space-y-4 pt-2 overflow-y-auto pr-2 custom-scrollbar flex-1">{topProducts.length === 0 ? (<p className="text-gray-500 italic text-center py-4 text-xs">Data produk tidak tersedia.</p>) : (topProducts.slice(0, 5).map((product, index) => (<div key={index} className="flex flex-col"><div className="flex justify-between items-center mb-1"><span className={`text-xs font-bold truncate max-w-[150px] ${index === 0 ? 'text-pink-600' : 'text-gray-700'}`} title={product.name}>#{index + 1}: {product.name}</span><span className="text-xs font-extrabold text-indigo-600">{product.totalQuantity.toLocaleString()} Unit</span></div><div className="w-full bg-gray-100 rounded-full h-1.5"><div className={`h-1.5 rounded-full ${index === 0 ? 'bg-pink-500' : index === 1 ? 'bg-pink-400' : 'bg-pink-300'}`} style={{ width: `${(product.totalQuantity / topProducts[0].totalQuantity) * 100}%` }}></div></div></div>)))}</div></div>
                        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col flex-1"><h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2 flex items-center"><UserPlus className="w-5 h-5 mr-2 text-yellow-600" />Top 5 Big Spenders</h3><div className="space-y-3 pt-2 overflow-y-auto pr-2 custom-scrollbar flex-1">{topSpenders.length === 0 ? (<p className="text-gray-500 italic text-center py-4 text-xs">Belum ada transaksi.</p>) : (topSpenders.map((cust, index) => (<div key={index} className="flex justify-between items-center border-b border-gray-50 last:border-0 pb-2 last:pb-0"><div className="flex items-center gap-3 overflow-hidden"><div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 ${index === 0 ? 'bg-yellow-500 shadow-md' : 'bg-gray-200 text-gray-600'}`}>{index + 1}</div><div className="min-w-0"><p className="text-xs font-bold text-gray-800 truncate max-w-[100px]" title={cust.name}>{cust.name}</p><p className="text-[9px] text-gray-500 truncate max-w-[100px]">{cust.city}</p></div></div><div className="text-right flex-shrink-0"><p className="text-xs font-bold text-green-600">{formatRupiah(cust.revenue)}</p><p className="text-[9px] text-gray-400">{cust.count} Order</p></div></div>)))}</div></div>
                    </div>
                </div>

                {/* --- KESIMPULAN ANALISIS DATA --- */}
                <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-6 rounded-xl shadow-md border border-indigo-100">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center mb-4"><Activity className="w-5 h-5 mr-2 text-indigo-600" /> Kesimpulan Analisis Data</h3>
                    <div className={`grid grid-cols-1 sm:grid-cols-2 ${isDigitalMode ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-4 mb-4`}>
                        <div className="bg-white p-4 rounded-lg border border-indigo-50 shadow-sm flex flex-col justify-center">
                            <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Produk Paling Laris</p>
                            <p className="text-sm font-bold text-gray-800 line-clamp-2 leading-tight" title={summaryInsights.productName}>{summaryInsights.productName}</p>
                            <p className="text-xs text-indigo-600 font-semibold mt-1">{summaryInsights.productQty.toLocaleString()} Unit Terjual</p>
                        </div>
                        {!isDigitalMode && (
                            <>
                                <div className="bg-white p-4 rounded-lg border border-indigo-50 shadow-sm flex flex-col justify-center"><p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Kota Top Order</p><p className="text-sm font-bold text-gray-800 line-clamp-1">{summaryInsights.cityName}</p><p className="text-xs text-teal-600 font-semibold mt-1">{summaryInsights.cityCount.toLocaleString()} Order</p></div>
                                <div className="bg-white p-4 rounded-lg border border-indigo-50 shadow-sm flex flex-col justify-center"><p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Provinsi Dominan</p><p className="text-sm font-bold text-gray-800 line-clamp-1">{summaryInsights.provinceName}</p><p className="text-xs text-blue-600 font-semibold mt-1">{summaryInsights.provinceCount.toLocaleString()} Order</p></div>
                            </>
                        )}
                        <div className="bg-white p-4 rounded-lg border border-indigo-50 shadow-sm flex flex-col justify-center"><p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Sumber Trafik Utama</p><p className="text-sm font-bold text-gray-800 line-clamp-1">{summaryInsights.sourceName}</p><p className="text-xs text-orange-600 font-semibold mt-1">{summaryInsights.sourceCount.toLocaleString()} Konversi</p></div>
                        <div className="bg-white p-4 rounded-lg border border-indigo-50 shadow-sm flex flex-col justify-center"><p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Jam Belanja Tersibuk</p><p className="text-sm font-bold text-gray-800 line-clamp-1 flex items-center"><Clock className="w-3 h-3 mr-1 text-purple-500"/> {summaryInsights.peakHour}</p><p className="text-xs text-purple-600 font-semibold mt-1">{summaryInsights.peakHourCount.toLocaleString()} Aktivitas</p></div>
                        <div className="bg-white p-4 rounded-lg border border-indigo-50 shadow-sm flex flex-col justify-center"><p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Tanggal Omzet Tertinggi</p><p className="text-sm font-bold text-gray-800 line-clamp-1 flex items-center"><Calendar className="w-3 h-3 mr-1 text-green-500"/> Tgl {summaryInsights.bestDay}</p><p className="text-xs text-green-600 font-semibold mt-1">{summaryInsights.bestDayRevenue}</p></div>
                        <div className={`bg-white p-4 rounded-lg border border-indigo-50 shadow-sm flex flex-col justify-center ${isDigitalMode ? '' : 'lg:col-span-2'}`}><p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Total Net Revenue (Periode Ini)</p><p className="text-xl font-bold text-green-700">{summaryInsights.revenue}</p><p className="text-xs text-gray-500 font-medium mt-1">dari total {summaryInsights.trx} Transaksi Valid</p></div>
                    </div>
                    <div className="bg-white/60 p-4 rounded-lg border border-indigo-100 text-sm text-gray-700 leading-relaxed shadow-inner">
                        <p><span className="font-bold text-indigo-700">💡 Insight Singkat:</span> Performa penjualan periode ini didominasi oleh produk <strong>{summaryInsights.productName}</strong>. {!isDigitalMode && ( <> Secara geografis, kota dengan pesanan terbanyak adalah <strong>{summaryInsights.cityName}</strong>, sedangkan provinsi dengan kontribusi terbesar adalah <strong>{summaryInsights.provinceName}</strong>.</> )} Mayoritas trafik datang melalui jalur <strong>{summaryInsights.sourceName}</strong>. Secara tren waktu, tanggal <strong>{summaryInsights.bestDay}</strong> mencatatkan omzet tertinggi.</p>
                    </div>
                </div>

                {/* --- SEBARAN LOKASI --- */}
                {!isDigitalMode && (
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center mb-4 border-b pb-2"><MapPin className="w-5 h-5 mr-2 text-red-600" /> Sebaran Lokasi Pengiriman Terbanyak (Top 10)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {['Provinsi', 'Kota/Kab', 'Kecamatan'].map((title, i) => {
                                const data = i === 0 ? topLocationLists.provinces : i === 1 ? topLocationLists.cities : topLocationLists.subdistricts;
                                return (
                                    <div key={title} className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex flex-col h-96">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center flex-shrink-0 border-b pb-2 border-gray-200">{title}</h4>
                                        <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-1">
                                            {data.length === 0 ? <p className="text-xs text-gray-400 italic text-center mt-10">Data tidak cukup</p> : 
                                            data.map((loc, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-sm p-2 hover:bg-white hover:shadow-sm rounded transition-all">
                                                    <div className="flex items-center gap-3 min-w-0"><span className={`text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-full flex-shrink-0 ${idx < 3 ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'}`}>#{idx+1}</span><div className="flex flex-col min-w-0"><span className="font-bold text-gray-700 truncate max-w-[120px]" title={loc.name}>{loc.name}</span><span className="text-[10px] font-bold text-green-600">{formatRupiah(loc.revenue)}</span></div></div>
                                                    <span className="font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded text-[10px] flex-shrink-0">{loc.value} Trx</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* --- CHART LAINNYA --- */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <h3 className="text-xl font-semibold mb-6 text-gray-800 border-b pb-2 flex items-center"><Clock className="w-5 h-5 mr-2 text-purple-600" /> Analisis Jam Belanja Tersibuk</h3>
                    <div className="h-80 w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={hourlyActivityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}><defs><linearGradient id="colorHour" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" /><XAxis dataKey="hour" tick={{ fontSize: 12 }} interval={2} /><YAxis tick={{ fontSize: 12 }} /><Tooltip formatter={(value) => [`${value} Transaksi`, 'Aktivitas']} /><Area type="monotone" dataKey="count" stroke="#7c3aed" strokeWidth={3} fillOpacity={1} fill="url(#colorHour)" /></AreaChart></ResponsiveContainer></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Chart Metode Bayar (WITH REVENUE TOOLTIP) */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center"><CreditCard className="w-5 h-5 mr-2 text-blue-600" /> Distribusi Metode Pembayaran</h3>
                        <div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={paymentMethodChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{paymentMethodChartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />))}</Pie><Tooltip formatter={(val, name, props) => [`${val} Order`, `${name} (${formatRupiah(props.payload.revenue)})`]} /><Legend layout="vertical" verticalAlign="bottom" align="center" wrapperStyle={{fontSize: '11px'}} /></PieChart></ResponsiveContainer></div>
                    </div>
                    {/* Chart Tipe Pelanggan (WITH REVENUE TOOLTIP - FIXED COLORS) */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center"><UserCheck className="w-5 h-5 mr-2 text-green-600" /> Tipe Pelanggan (New vs Repeat)</h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={customerTypeChartData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                                        {customerTypeChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.name === 'New' ? '#3B82F6' : '#10B981'} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(val, name, props) => [`${val} Orang`, `${name} (${formatRupiah(props.payload.revenue)})`]} />
                                    <Legend verticalAlign="bottom" height={36}/>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="text-center text-[10px] text-gray-400 mt-2">Perbandingan Pelanggan Baru vs Pelanggan Lama</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Chart Financial Entity (WITH REVENUE TOOLTIP) */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center"><Landmark className="w-5 h-5 mr-2 text-teal-600" /> Top Financial Entity</h3>
                        <div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={financialEntityChartData.slice(0, 8)} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" /><XAxis type="number" hide /><YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }} /><Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} formatter={(val, name, props) => [`${val} Order`, `${name} (${formatRupiah(props.payload.revenue)})`]} cursor={{fill: '#f0fdfa'}} /><Bar dataKey="value" name="Jumlah Order" fill="#0D9488" radius={[0, 4, 4, 0]} barSize={20}><LabelList dataKey="value" position="right" fontSize={10} fill="#64748b" /></Bar></BarChart></ResponsiveContainer></div>
                    </div>
                    {/* Chart UTM Source (WITH REVENUE TOOLTIP) */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center"><Globe className="w-5 h-5 mr-2 text-orange-600" /> Top Sumber Trafik</h3>
                        <div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={utmSourceChartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" /><XAxis type="number" hide /><YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }} /><Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} formatter={(val, name, props) => [`${val} Order`, `${name} (${formatRupiah(props.payload.revenue)})`]} cursor={{fill: '#fff7ed'}} /><Bar dataKey="value" name="Jumlah Order" fill="#F97316" radius={[0, 4, 4, 0]} barSize={20}><LabelList dataKey="value" position="right" fontSize={10} fill="#64748b" /></Bar></BarChart></ResponsiveContainer></div>
                    </div>
                </div>

                {/* --- TABEL TRANSAKSI HARIAN --- */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                        <h3 className="text-xl font-semibold text-gray-800 flex items-center"><List className="w-5 h-5 mr-2 text-indigo-600" /> Detail Transaksi Harian <span className="ml-3 text-xs font-bold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full border border-indigo-200">Total: {tableData.length} Order</span></h3>
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            <div className="relative"><input type="text" placeholder="Cari Order ID / Nama..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-64 text-sm" /><Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" /></div>
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 cursor-pointer"><option value="All">Semua Status</option><option value="completed">Completed</option><option value="confirmed">Confirmed</option><option value="pending">Pending</option><option value="canceled">Canceled</option><option value="rts">RTS</option></select>
                            <button onClick={handleExportDailyReport} disabled={tableData.length === 0} className={`flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition-colors ${tableData.length === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}><Download className="w-4 h-4 mr-2" /> Export CSV</button>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-12">No.</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Order ID / Tgl</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Pelanggan</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Produk</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentTableData.length > 0 ? currentTableData.map((item, index) => (
                                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-500 align-top">{(currentPage - 1) * itemsPerPage + index + 1}.</td>
                                        <td className="px-6 py-4 whitespace-nowrap align-top"><div className="text-sm font-bold text-indigo-600">{item[COL_ORDER_ID]}</div><div className="text-xs text-gray-500 mt-1">{item[COL_CONFIRMED_TIME] || item['draft_time']}</div></td>
                                        <td className="px-6 py-4 align-top"><div className="text-sm font-medium text-gray-900">{item[COL_NAME]}</div><div className="text-xs text-gray-500 mt-0.5">{isDigitalMode ? (item['email'] || '-') : `${item[COL_CITY] || ''}, ${item[COL_PROVINCE] || ''}`}</div>{customerSegmentMap.has(item[COL_NAME]) && (<span className={`inline-flex mt-1 items-center px-2 py-0.5 rounded text-[10px] font-bold text-white ${customerSegmentMap.get(item[COL_NAME]).color}`}>{customerSegmentMap.get(item[COL_NAME]).name}</span>)}</td>
                                        <td className="px-6 py-4 align-top"><div className="text-xs text-gray-700 max-w-xs line-clamp-2" title={getProductSummary(item)}>{getProductSummary(item)}</div></td>
                                        <td className="px-6 py-4 whitespace-nowrap align-top"><span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full`} style={{ backgroundColor: (STATUS_COLORS[(item['order_status']||'').toLowerCase()] || '#94a3b8') + '20', color: STATUS_COLORS[(item['order_status']||'').toLowerCase()] || '#1e293b' }}>{(item['order_status'] || 'Unknown').toUpperCase()}</span></td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900 align-top">{formatRupiah(safeFloat(item[COL_NET_REVENUE]))}</td>
                                    </tr>
                                )) : (<tr><td colSpan="6" className="px-6 py-10 text-center text-gray-500 italic">Tidak ada data ditemukan untuk periode/filter ini.</td></tr>)}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4">
                        <div className="flex flex-1 justify-between sm:hidden">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Previous</button>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Next</button>
                        </div>
                        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                            <div><p className="text-sm text-gray-700">Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, tableData.length)}</span> of <span className="font-medium">{tableData.length}</span> results</p></div>
                            <div>
                                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                    <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"><ChevronLeft className="h-5 w-5" /></button>
                                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50">Prev</button>
                                    <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">Page {currentPage} of {totalPages}</span>
                                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50">Next</button>
                                    <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"><ChevronRight className="h-5 w-5" /></button>
                               </nav>
                            </div>
                        </div>
                    </div>
                </div> 
            </div> 
       </div> 
    );
}; // <--- PASTIKAN TANDA KURUNG KURAWAL DAN TITIK KOMA INI ADA (Ini penutup DailyReportView)

const RecoveryAnalysisView = ({ rawData, isDigitalMode }) => {
    // --- STATE FILTER ---
    const [filterIssue, setFilterIssue] = useState('All');
    const [filterValue, setFilterValue] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState(''); 
    const [endDate, setEndDate] = useState('');
    const [clickedChats, setClickedChats] = useState(new Set());
    
    // --- 7 FILTER BARU ---
    const [filterProv, setFilterProv] = useState('All');
    const [filterCity, setFilterCity] = useState('All');
    const [filterSub, setFilterSub] = useState('All');
    const [filterSrc, setFilterSrc] = useState('All');
    const [filterPay, setFilterPay] = useState('All');
    const [filterBank, setFilterBank] = useState('All');
    const [filterProd, setFilterProd] = useState('All');

    // State Template Chat
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [templates, setTemplates] = useState({
        Stuck: "Halo Kak {name}, kami lihat pesanan kakak belum selesai pembayarannya. Apakah ada kendala saat transfer? Kami bantu ya kak 🙏",
        Pending: "Halo Kak {name}, kami rindu nih! Pesanannya masih tersimpan aman di sistem kami. Mau dilanjut pengirimannya kak?",
        RTS: "Halo Kak {name}, mohon maaf, paket kakak statusnya retur/gagal kirim. Boleh dibantu alamat lengkap yang baru untuk kami kirim ulang?",
        Canceled: "Halo Kak {name}, terima kasih sudah mampir. Ada yang bisa kami bantu seputar pesanan sebelumnya?",
        Default: "Halo Kak {name}, ada yang bisa kami bantu untuk pesanannya?"
    });

    // Helper: Membersihkan angka
    const safeFloat = (val) => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        const str = val.toString();
        const cleanStr = str.replace(/[^0-9,-]/g, '').replace(',', '.'); 
        const num = parseFloat(cleanStr);
        return isNaN(num) ? 0 : num;
    };

    // Helper: Parser Tanggal
    const parseDateSafe = (dateStr) => {
        if (!dateStr) return null;
        const s = dateStr.toString().trim();
        let d = new Date(s.replace(' ', 'T'));
        if (!isNaN(d.getTime())) return d;
        const parts = s.split(/[\/\-\s]/);
        if (parts.length >= 3) {
            if (parts[0].length === 4) return new Date(parts[0], parseInt(parts[1])-1, parts[2]);
            const year = parts[2].length === 4 ? parts[2] : parts[2].length === 2 ? '20' + parts[2] : parts[2];
            return new Date(year, parseInt(parts[1])-1, parts[0]);
        }
        return null;
    };

    // Template Editor
    const TemplateEditor = () => {
        if (!showTemplateModal) return null;
        return (
            <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 overflow-y-auto max-h-[90vh]">
                    <div className="flex justify-between items-center mb-6 border-b pb-4">
                        <h3 className="text-xl font-bold text-gray-800">Kustomisasi Script WA</h3>
                        <button onClick={() => setShowTemplateModal(false)}><XCircle className="w-6 h-6 text-gray-400"/></button>
                    </div>
                    <div className="space-y-4">
                        {Object.keys(templates).map((key) => (
                            <div key={key}><label className="block text-sm font-bold text-gray-700 mb-1">{key}</label><textarea value={templates[key]} onChange={(e) => setTemplates({...templates, [key]: e.target.value})} className="w-full p-2 border rounded text-sm h-20" /></div>
                        ))}
                    </div>
                    <div className="mt-4 flex justify-end"><button onClick={() => setShowTemplateModal(false)} className="px-4 py-2 bg-indigo-600 text-white rounded font-bold">Simpan</button></div>
                </div>
            </div>
        );
    };

    // --- LOGIKA UTAMA (USE MEMO) ---
    const { allIssues, filterOptions, recoveryInsights, totalLostPotential, highRiskLocations, topProblematicProducts, topProblematicSources, topProblematicPayments, topProblematicFinancialEntities, abandonedOrders, rtsOrders, canceledOrders, stuckPendingOrders } = useMemo(() => {
        const today = new Date();
        const start = startDate ? new Date(startDate) : new Date('1970-01-01'); start.setHours(0,0,0,0);
        const end = endDate ? new Date(endDate) : new Date('2099-12-31'); end.setHours(23,59,59,999);

        const abandoned = [], rts = [], canceled = [], stuck = [];
        let lostRevenue = 0;
        
        const provStats = {}, cityStats = {}, subStats = {};
        const prodStats = {}, sourceStats = {}, paymentStats = {}, financialStats = {};

        const updateStats = (storage, key, revenue) => {
            if (!storage[key]) storage[key] = { name: key, total: 0, count: 0, totalRevenue: 0 };
            storage[key].total += 1; storage[key].count += 1; storage[key].totalRevenue += revenue;
        };

        const provs = new Set(), cities = new Set(), subs = new Set();
        const srcs = new Set(), pays = new Set(), banks = new Set(), prods = new Set();

        rawData.forEach(order => {
            const status = (order['order_status'] || '').toLowerCase();
            const dateStr = order['draft_time'] || order['pending_time'];
            if (!dateStr) return;
            const orderDate = parseDateSafe(dateStr);
            if (!orderDate || isNaN(orderDate.getTime())) return;
            if (orderDate < start || orderDate > end) return; 
            
            const diffDays = Math.ceil(Math.abs(today - orderDate) / (1000 * 60 * 60 * 24));
            const revenue = safeFloat(order[COL_NET_REVENUE]);
            let isProblem = false, issueType = '';

            if (status === 'pending' && diffDays >= 3 && diffDays <= 7) { issueType = 'Stuck Pending'; stuck.push({ ...order, daysSince: diffDays, issueType }); isProblem = true; }
            else if (status === 'pending' && diffDays > 7) { issueType = 'Pending (> 7 Hari)'; abandoned.push({ ...order, daysSince: diffDays, issueType }); isProblem = true; }
            else if (!isDigitalMode && status === 'rts') { issueType = 'RTS (Retur)'; rts.push({ ...order, daysSince: diffDays, issueType }); isProblem = true; }
            else if (status === 'canceled') { issueType = 'Canceled'; canceled.push({ ...order, daysSince: diffDays, issueType }); isProblem = true; }

            if (isProblem) {
                lostRevenue += revenue;
                const p = (order[COL_PROVINCE] || 'Unknown').trim();
                const c = (order[COL_CITY] || 'Unknown').trim();
                const s_loc = (order[COL_SUBDISTRICT] || 'Unknown').trim();
                
                if (!isDigitalMode) {
                    if (p && p !== '-' && p !== 'Unknown') { provs.add(p); updateStats(provStats, p, revenue); }
                    if (c && c !== '-' && c !== 'Unknown') { cities.add(c); updateStats(cityStats, c, revenue); }
                    if (s_loc && s_loc !== '-' && s_loc !== 'Unknown') { subs.add(s_loc); updateStats(subStats, s_loc, revenue); }
                }

                let src = (order[COL_UTM_SOURCE] || 'Organic/Direct').trim();
                if (!src || src === '-') src = 'Organic/Direct';
                src = src.charAt(0).toUpperCase() + src.slice(1);
                srcs.add(src); updateStats(sourceStats, src, revenue);

                let pay = (order[COL_PAYMENT_METHOD] || order['epayment_provider'] || 'Lainnya').trim();
                if (!pay || pay === '-') pay = 'Lainnya';
                pay = pay.toUpperCase().replace('_', ' ');
                pays.add(pay); updateStats(paymentStats, pay, revenue);

                const bank = (order[COL_FINANCIAL_ENTITY] || '').trim().toUpperCase();
                if (bank && bank !== '-' && bank !== 'UNKNOWN') { banks.add(bank); updateStats(financialStats, bank, revenue); }

                Object.keys(order).forEach(k => { 
                    if (k.startsWith('variant:') && parseFloat(order[k]) > 0) {
                        const n = k.replace('variant:', '').replace(/_/g, ' ').toUpperCase();
                        prods.add(n); updateStats(prodStats, n, revenue);
                    }
                });
            }
        });

        const combinedIssues = [...stuck, ...abandoned, ...rts, ...canceled].sort((a,b) => safeFloat(b[COL_NET_REVENUE]) - safeFloat(a[COL_NET_REVENUE]));
        
        const getTop = (s, lim=5) => Object.values(s).sort((a,b)=>b.count-a.count).slice(0, lim);
        const topProvList = getTop(provStats, 10); const topCityList = getTop(cityStats, 10); const topSubList = getTop(subStats, 10);
        const topProdList = getTop(prodStats, 10); const topSrcList = getTop(sourceStats, 5); const topPayList = getTop(paymentStats, 5); const topFinList = getTop(financialStats, 5);

        const safeName = (list) => list.length > 0 ? list[0].name : "-";
        const safeCount = (list) => list.length > 0 ? list[0].count : 0;
        const issuesStat = [{n:'Stuck', c:stuck.length}, {n:'Pending', c:abandoned.length}, {n:'RTS', c:rts.length}, {n:'Canceled', c:canceled.length}].reduce((a,b)=>a.c>b.c?a:b);

        return {
            allIssues: combinedIssues,
            filterOptions: { provinces: Array.from(provs).sort(), cities: Array.from(cities).sort(), subdistricts: Array.from(subs).sort(), sources: Array.from(srcs).sort(), payments: Array.from(pays).sort(), banks: Array.from(banks).sort(), products: Array.from(prods).sort() },
            recoveryInsights: { issueName: issuesStat.n, issueCount: issuesStat.c, provName: safeName(topProvList), provCount: safeCount(topProvList), cityName: safeName(topCityList), cityCount: safeCount(topCityList), subName: safeName(topSubList), subCount: safeCount(topSubList), prodName: safeName(topProdList), prodCount: safeCount(topProdList), sourceName: safeName(topSrcList), sourceCount: safeCount(topSrcList), payName: safeName(topPayList), payCount: safeCount(topPayList), finName: safeName(topFinList), finCount: safeCount(topFinList) },
            totalLostPotential: lostRevenue,
            highRiskLocations: { provinces: topProvList, cities: topCityList, subdistricts: topSubList },
            topProblematicProducts: topProdList, topProblematicSources: topSrcList, topProblematicPayments: topPayList, topProblematicFinancialEntities: topFinList,
            abandonedOrders: abandoned, rtsOrders: rts, canceledOrders: canceled, stuckPendingOrders: stuck
        };
    }, [rawData, isDigitalMode, startDate, endDate]);

    // --- LOGIKA FILTERING ---
    const filteredIssues = useMemo(() => {
        return allIssues.filter(item => {
            if (filterIssue !== 'All' && !item.issueType.includes(filterIssue)) return false;
            if (filterValue === 'High' && safeFloat(item[COL_NET_REVENUE]) < 500000) return false;
            
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                const match1 = (item[COL_NAME]||'').toLowerCase().includes(term);
                const match2 = (item[COL_PHONE]||'').toLowerCase().includes(term);
                const match3 = (item[COL_ORDER_ID]||'').toLowerCase().includes(term);
                if (!match1 && !match2 && !match3) return false;
            }

            if (!isDigitalMode) {
                if (filterProv !== 'All' && item[COL_PROVINCE] !== filterProv) return false;
                if (filterCity !== 'All' && item[COL_CITY] !== filterCity) return false;
                if (filterSub !== 'All' && item[COL_SUBDISTRICT] !== filterSub) return false;
            }

            if (filterSrc !== 'All') {
                let s = (item[COL_UTM_SOURCE]||'Organic/Direct').trim();
                if (!s || s === '-') s = 'Organic/Direct';
                if (s.charAt(0).toUpperCase() + s.slice(1) !== filterSrc) return false;
            }

            if (filterPay !== 'All') {
                let p = (item[COL_PAYMENT_METHOD] || item['epayment_provider'] || 'Lainnya').trim();
                if (!p || p === '-') p = 'Lainnya';
                if (p.toUpperCase().replace('_', ' ') !== filterPay) return false;
            }

            if (filterBank !== 'All') {
                if ((item[COL_FINANCIAL_ENTITY] || '').toUpperCase() !== filterBank) return false;
            }

            if (filterProd !== 'All') {
                let hasProduct = false;
                Object.keys(item).forEach(k => { 
                    if (k.startsWith('variant:') && parseFloat(item[k]) > 0 && k.replace('variant:', '').replace(/_/g, ' ').toUpperCase() === filterProd) hasProduct = true; 
                });
                if (!hasProduct) return false;
            }

            return true;
        });
    }, [allIssues, filterIssue, filterValue, searchTerm, filterProv, filterCity, filterSub, filterSrc, filterPay, filterBank, filterProd, isDigitalMode]);

    const getWhatsAppLink = (item, productName) => {
        const phone = item[COL_PHONE];
        if (!phone) return null;
        let p = phone.toString().replace(/[^0-9]/g, '');
        if (p.startsWith('08')) p = '62' + p.substring(1); else if (p.startsWith('8')) p = '62' + p;
        if (p.length < 10) return null; 
        let k = 'Default';
        if (item.issueType.includes('Stuck')) k = 'Stuck'; else if (item.issueType.includes('Pending')) k = 'Pending'; else if (item.issueType.includes('RTS')) k = 'RTS'; else if (item.issueType.includes('Canceled')) k = 'Canceled';
        let msg = templates[k].replace(/{name}/g, item[COL_NAME]||'Kak').replace(/{product}/g, productName||'Produk').replace(/{value}/g, formatRupiah(safeFloat(item[COL_NET_REVENUE]||0))).replace(/{phone}/g, item[COL_PHONE]||'').replace(/{address}/g, item[COL_ADDRESS]||'').replace(/{subdistrict}/g, item[COL_SUBDISTRICT]||'');
        return `https://wa.me/${p}?text=${encodeURIComponent(msg)}`;
    };

    const handleChatClick = (id) => setClickedChats(prev => new Set(prev).add(id));
    const handleExportRecovery = () => { if (filteredIssues.length === 0) { alert("Data kosong"); return; } const rows = filteredIssues.map((item,i) => { const variantKey = Object.keys(item).find(k => k.startsWith('variant:') && item[k] > 0); const prodName = variantKey ? variantKey.replace('variant:', '').replace(/_/g, ' ') : '-'; const waLink = getWhatsAppLink(item, prodName); return `${i+1},${item[COL_ORDER_ID]},${item.issueType},"${item[COL_NAME]}",${item[COL_PHONE]},${safeFloat(item[COL_NET_REVENUE])},${waLink}`; }); const blob = new Blob(["No,Order ID,Isu,Nama,HP,Nilai,LinkWA\n" + rows.join("\n")], { type: "text/csv" }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "Recovery.csv"; link.click(); };

    return (
        <div className="space-y-8 animate-fade-in">
            <TemplateEditor />
            
            {/* 1. HEADER */}
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center"><div className="flex-shrink-0"><AlertTriangle className="h-5 w-5 text-red-500" /></div><div className="ml-3"><h3 className="text-sm font-medium text-red-800">Zona Recovery</h3><p className="mt-1 text-sm text-red-700">Prioritaskan order <strong>Stuck Pending</strong>.</p></div></div>
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-red-200"><span className="text-[10px] font-bold text-red-500 uppercase">Filter Tgl:</span><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-xs border-none bg-transparent p-0"/><span className="text-gray-400">-</span><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="text-xs border-none bg-transparent p-0"/>{(startDate || endDate) && <button onClick={()=>{setStartDate('');setEndDate('');}}><XCircle className="w-3 h-3 text-red-500"/></button>}</div>
            </div>

            {/* 2. STATS CARDS */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-red-100"><h3 className="text-base font-bold text-gray-700 flex items-center mb-4 border-b pb-2"><Zap className="w-4 h-4 mr-2 text-yellow-600" /> Prioritas Penanganan</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><StatCard compact title="Potensi Omzet Hilang" value={formatRupiah(totalLostPotential)} icon={DollarSign} color="#EF4444" /><StatCard compact title="Stuck Pending (3-7 Hari)" value={stuckPendingOrders.length} icon={Zap} color="#10B981" unit="Hot Leads" /></div></div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-red-100"><h3 className="text-base font-bold text-gray-700 flex items-center mb-4 border-b pb-2"><XCircle className="w-4 h-4 mr-2 text-red-600" /> Analisis Kegagalan</h3><div className={`grid grid-cols-1 ${!isDigitalMode ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3`}><StatCard compact title="Pending (> 7 Hari)" value={abandonedOrders.length} icon={Clock} color="#F59E0B" unit="Order" />{!isDigitalMode && <StatCard compact title="RTS (Retur)" value={rtsOrders.length} icon={Truck} color="#DC2626" unit="Order" />}<StatCard compact title="Canceled" value={canceledOrders.length} icon={XCircle} color="#6B7280" unit="Order" /></div></div>
            </div>

            {/* 3. INSIGHTS SUMMARY (DENGAN STRATEGI RECOVERY) */}
            <div className="bg-gradient-to-r from-red-50 via-orange-50 to-pink-50 p-6 rounded-xl shadow-md border border-red-100">
                <h3 className="text-lg font-bold text-gray-800 flex items-center mb-4"><Activity className="w-5 h-5 mr-2 text-red-600" /> Kesimpulan Analisis Risiko & Recovery</h3>
                <div className={`grid grid-cols-1 sm:grid-cols-2 ${isDigitalMode ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-4 mb-4`}>
                    <div className="bg-white p-4 rounded-lg border border-red-50 shadow-sm flex flex-col justify-center"><p className="text-[10px] uppercase font-bold text-gray-500">Isu Dominan</p><p className="text-sm font-bold text-red-700 truncate">{recoveryInsights.issueName}</p><p className="text-xs text-gray-500 mt-1">{recoveryInsights.issueCount} Kasus</p></div>
                    <div className="bg-white p-4 rounded-lg border border-red-50 shadow-sm flex flex-col justify-center"><p className="text-[10px] uppercase font-bold text-gray-500">Produk Bermasalah</p><p className="text-sm font-bold text-gray-800 truncate">{recoveryInsights.prodName}</p><p className="text-xs text-orange-600 mt-1">{recoveryInsights.prodCount} Isu</p></div>
                    {!isDigitalMode && (<><div className="bg-white p-4 rounded-lg border border-red-50 shadow-sm flex flex-col justify-center"><p className="text-[10px] uppercase font-bold text-gray-500">Provinsi Rawan</p><p className="text-sm font-bold text-gray-800 truncate">{recoveryInsights.provName}</p><p className="text-xs text-red-600 mt-1">{recoveryInsights.provCount} Isu</p></div><div className="bg-white p-4 rounded-lg border border-red-50 shadow-sm flex flex-col justify-center"><p className="text-[10px] uppercase font-bold text-gray-500">Kota Rawan</p><p className="text-sm font-bold text-gray-800 truncate">{recoveryInsights.cityName}</p><p className="text-xs text-red-600 mt-1">{recoveryInsights.cityCount} Isu</p></div><div className="bg-white p-4 rounded-lg border border-red-50 shadow-sm flex flex-col justify-center"><p className="text-[10px] uppercase font-bold text-gray-500">Kecamatan Rawan</p><p className="text-sm font-bold text-gray-800 truncate">{recoveryInsights.subName}</p><p className="text-xs text-red-600 mt-1">{recoveryInsights.subCount} Isu</p></div></>)}
                    <div className="bg-white p-4 rounded-lg border border-red-50 shadow-sm flex flex-col justify-center"><p className="text-[10px] uppercase font-bold text-gray-500">Sumber Iklan Rawan</p><p className="text-sm font-bold text-gray-800 truncate">{recoveryInsights.sourceName}</p><p className="text-xs text-gray-500 mt-1">{recoveryInsights.sourceCount} Kasus</p></div>
                    <div className="bg-white p-4 rounded-lg border border-red-50 shadow-sm flex flex-col justify-center"><p className="text-[10px] uppercase font-bold text-gray-500">Metode Bayar Kendala</p><p className="text-sm font-bold text-gray-800 truncate">{recoveryInsights.payName}</p><p className="text-xs text-purple-600 mt-1">{recoveryInsights.payCount} Kasus</p></div>
                    <div className="bg-white p-4 rounded-lg border border-red-50 shadow-sm flex flex-col justify-center"><p className="text-[10px] uppercase font-bold text-gray-500">Bank Sering Gagal</p><p className="text-sm font-bold text-gray-800 truncate">{recoveryInsights.finName}</p><p className="text-xs text-blue-600 mt-1">{recoveryInsights.finCount} Kasus</p></div>
                </div>
                {/* --- BAGIAN STRATEGI RECOVERY (SUDAH ADA DISINI) --- */}
                <div className="bg-white/60 p-4 rounded-lg border border-red-100 text-sm text-gray-700 leading-relaxed shadow-inner">
                    <p>
                        <span className="font-bold text-red-700">💡 Strategi Recovery:</span> Isu terbesar saat ini adalah <strong>{recoveryInsights.issueName}</strong>. 
                        {!isDigitalMode && <> Waspadai pengiriman ke <strong>{recoveryInsights.cityName}</strong> (Kec. {recoveryInsights.subName}). </>}
                        Produk <strong>{recoveryInsights.prodName}</strong> memiliki tingkat kegagalan tertinggi. 
                        Cek efektivitas iklan di <strong>{recoveryInsights.sourceName}</strong>, serta stabilitas pembayaran <strong>{recoveryInsights.payName}</strong> ({recoveryInsights.finName}).
                    </p>
                </div>
            </div>

            {/* 4. ZONA MERAH (CHARTS) */}
            {!isDigitalMode && highRiskLocations.provinces.length > 0 && (<div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100"><h3 className="text-lg font-bold text-gray-800 flex items-center mb-4 border-b pb-2"><MapPin className="w-5 h-5 mr-2 text-red-600" /> Zona Merah: Top Lokasi Batal/Retur</h3><div className="grid grid-cols-1 md:grid-cols-3 gap-6">{['Provinsi', 'Kota', 'Kecamatan'].map((t, i) => (<div key={t} className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex flex-col h-80"><h4 className="text-xs font-bold text-gray-500 uppercase mb-3">{t}</h4><div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-1">{(i===0?highRiskLocations.provinces:i===1?highRiskLocations.cities:highRiskLocations.subdistricts).map((l,x)=>(<div key={x} className="flex justify-between items-center text-sm p-2 hover:bg-gray-100 rounded"><div className="flex flex-col"><span className="font-medium text-gray-700 truncate max-w-[120px]">{x+1}. {l.name}</span><span className="text-[10px] text-red-500 font-semibold">{formatRupiah(l.totalRevenue)}</span></div><span className="font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded text-xs">{l.count}</span></div>))}</div></div>))}</div></div>)}

            {/* 5. MARKETING & PAYMENT CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100"><h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center"><TrendingDown className="w-5 h-5 mr-2 text-orange-600" /> Top Sumber Iklan</h3><div className="space-y-3">{topProblematicSources.map((s,i)=>(<div key={i} className="flex justify-between items-center bg-orange-50 p-2 rounded"><div className="flex gap-2"><span className="text-xs font-bold bg-orange-400 text-white w-5 h-5 flex items-center justify-center rounded-full">#{i+1}</span><p className="text-sm font-semibold text-gray-800">{s.name}</p></div><div className="text-right"><p className="text-sm font-bold text-orange-600">{s.total}</p><p className="text-[9px] text-red-500">{formatRupiah(s.totalRevenue)}</p></div></div>))}</div></div>
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100"><h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center"><CreditCard className="w-5 h-5 mr-2 text-purple-600" /> Top Metode Bayar</h3><div className="space-y-3">{topProblematicPayments.map((p,i)=>(<div key={i} className="flex justify-between items-center bg-purple-50 p-2 rounded"><div className="flex gap-2"><span className="text-xs font-bold bg-purple-400 text-white w-5 h-5 flex items-center justify-center rounded-full">#{i+1}</span><p className="text-sm font-semibold text-gray-800">{p.name}</p></div><div className="text-right"><p className="text-sm font-bold text-purple-600">{p.total}</p><p className="text-[9px] text-red-500">{formatRupiah(p.totalRevenue)}</p></div></div>))}</div></div>
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100"><h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center"><Landmark className="w-5 h-5 mr-2 text-blue-600" /> Top Bank</h3><div className="space-y-3">{topProblematicFinancialEntities.map((f,i)=>(<div key={i} className="flex justify-between items-center bg-blue-50 p-2 rounded"><div className="flex gap-2"><span className="text-xs font-bold bg-blue-400 text-white w-5 h-5 flex items-center justify-center rounded-full">#{i+1}</span><p className="text-sm font-semibold text-gray-800">{f.name}</p></div><div className="text-right"><p className="text-sm font-bold text-blue-600">{f.total}</p><p className="text-[9px] text-red-500">{formatRupiah(f.totalRevenue)}</p></div></div>))}</div></div>
            </div>

            {/* 6. PRODUCT CHART */}
            {topProblematicProducts.length > 0 && (<div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100"><h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center"><AlertTriangle className="w-5 h-5 mr-2 text-red-600" /> Top 10 Produk Bermasalah</h3><div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{topProblematicProducts.map((p,i)=>(<div key={i} className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-200"><div className="flex items-center gap-2"><span className="text-xs font-bold bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center">#{i+1}</span><p className="text-sm font-bold text-gray-800 truncate max-w-[200px]">{p.name}</p></div><div className="text-right"><p className="text-sm font-bold text-gray-800">{p.total}</p><p className="text-[9px] text-red-500">{formatRupiah(p.totalRevenue)}</p></div></div>))}</div></div>)}

            {/* 7. MAIN TABLE & FILTERS */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <div className="flex flex-col mb-6 gap-4">
                    <div className="flex justify-between items-center border-b pb-2"><h3 className="text-lg font-bold text-gray-800 flex items-center"><RefreshCw className="w-5 h-5 mr-2 text-indigo-600" /> Daftar Follow-Up</h3><button onClick={() => setShowTemplateModal(true)} className="flex items-center px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-lg"><MessageSquare className="w-4 h-4 mr-2" /> Template</button></div>
                    
                    {/* NEW FILTER GRID START */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                            <div className="col-span-1 sm:col-span-2 relative"><input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Cari Nama / HP / Order ID..." className="pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm w-full"/><Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" /></div>
                            <select value={filterIssue} onChange={(e) => setFilterIssue(e.target.value)} className="bg-white border border-gray-300 text-gray-700 text-sm rounded-md p-2 cursor-pointer col-span-1 sm:col-span-2"><option value="All">Semua Masalah</option><option value="Stuck">Stuck Pending</option><option value="Pending">Pending Lama</option>{!isDigitalMode && <option value="RTS">RTS</option>}<option value="Canceled">Canceled</option></select>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                            {!isDigitalMode && (<><select value={filterProv} onChange={(e) => setFilterProv(e.target.value)} className="bg-white border border-gray-300 text-gray-700 text-xs rounded-md p-2"><option value="All">Semua Prov.</option>{filterOptions.provinces.map(o=><option key={o} value={o}>{o}</option>)}</select><select value={filterCity} onChange={(e) => setFilterCity(e.target.value)} className="bg-white border border-gray-300 text-gray-700 text-xs rounded-md p-2"><option value="All">Semua Kota</option>{filterOptions.cities.map(o=><option key={o} value={o}>{o}</option>)}</select><select value={filterSub} onChange={(e) => setFilterSub(e.target.value)} className="bg-white border border-gray-300 text-gray-700 text-xs rounded-md p-2"><option value="All">Semua Kec.</option>{filterOptions.subdistricts.map(o=><option key={o} value={o}>{o}</option>)}</select></>)}
                            <select value={filterSrc} onChange={(e) => setFilterSrc(e.target.value)} className="bg-white border border-gray-300 text-gray-700 text-xs rounded-md p-2"><option value="All">Semua Sumber</option>{filterOptions.sources.map(o=><option key={o} value={o}>{o}</option>)}</select>
                            <select value={filterPay} onChange={(e) => setFilterPay(e.target.value)} className="bg-white border border-gray-300 text-gray-700 text-xs rounded-md p-2"><option value="All">Semua Metode</option>{filterOptions.payments.map(o=><option key={o} value={o}>{o}</option>)}</select>
                            <select value={filterBank} onChange={(e) => setFilterBank(e.target.value)} className="bg-white border border-gray-300 text-gray-700 text-xs rounded-md p-2"><option value="All">Semua Bank</option>{filterOptions.banks.map(o=><option key={o} value={o}>{o}</option>)}</select>
                            <select value={filterValue} onChange={(e) => setFilterValue(e.target.value)} className="bg-white border border-gray-300 text-gray-700 text-xs rounded-md p-2"><option value="All">Semua Nilai</option><option value="High">High Value (&gt;500k)</option></select>
                            <select value={filterProd} onChange={(e) => setFilterProd(e.target.value)} className={`bg-white border border-gray-300 text-gray-700 text-xs rounded-md p-2 ${isDigitalMode?'col-span-2':''}`}><option value="All">Semua Produk</option>{filterOptions.products.map(o=><option key={o} value={o}>{o}</option>)}</select>
                        </div>
                        <div className="mt-3 flex justify-between items-center border-t border-gray-200 pt-3">
                            <span className="text-xs font-bold text-gray-500">Hasil Filter: {filteredIssues.length} Data</span>
                            <button onClick={handleExportRecovery} disabled={filteredIssues.length === 0} className={`flex items-center px-4 py-1.5 text-xs font-bold text-white rounded shadow-sm transition-colors ${filteredIssues.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>
                                <Download className="w-3 h-3 mr-1" /> Export CSV
                            </button>
                        </div>
                    </div>
                    {/* NEW FILTER GRID END */}
                </div>

                {/* --- TABEL PRIORITAS FOLLOW-UP (UPDATE: LOKASI LENGKAP) --- */}
                <div className="overflow-x-auto max-h-[600px] border-t border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-12">Prio</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status & Urgensi</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Pelanggan & Lokasi</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Konteks Order</th>
                                <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Nilai (IDR)</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredIssues.map((item, idx) => {
                                // Data Preparation
                                const variantKey = Object.keys(item).find(k => k.startsWith('variant:') && item[k] > 0);
                                // [UPDATE] Tambahkan .toUpperCase() di sini
                                const prodName = variantKey ? variantKey.replace('variant:', '').replace(/_/g, ' ').toUpperCase() : '-';
                                const waLink = getWhatsAppLink(item, prodName);
                                const isClicked = clickedChats.has(item[COL_ORDER_ID]);
                                
                                // Data Tambahan
                                const paymentMethod = (item[COL_PAYMENT_METHOD] || item['epayment_provider'] || 'Unknown').replace(/_/g, ' ').toUpperCase();
                                const source = (item[COL_UTM_SOURCE] || 'Direct').toUpperCase();
                                const bank = (item[COL_FINANCIAL_ENTITY] || '').toUpperCase();

                                // Urgency Color Logic
                                let badgeColor = '';
                                if (item.issueType.includes('Stuck')) {
                                    badgeColor = 'bg-emerald-100 text-emerald-800 border border-emerald-200'; // Hijau
                                } else if (item.issueType.includes('Pending')) {
                                    badgeColor = 'bg-amber-100 text-amber-800 border border-amber-200'; // Kuning
                                } else if (item.issueType.includes('Canceled') || item.issueType.includes('RTS')) {
                                    badgeColor = 'bg-red-100 text-red-800 border border-red-200'; // Merah
                                } else {
                                    badgeColor = 'bg-gray-100 text-gray-800 border border-gray-200';
                                }

                                return (
                                    <tr key={idx} className="hover:bg-indigo-50/30 transition-colors group">
                                        {/* Kolom 1: No */}
                                        <td className="px-4 py-4 text-center text-xs text-gray-400 group-hover:text-indigo-500 font-medium">
                                            {idx + 1}
                                        </td>

                                        {/* Kolom 2: Status & Urgensi */}
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div className="flex flex-col items-start gap-1.5">
                                                <span className={`px-2.5 py-0.5 inline-flex text-[10px] font-bold uppercase rounded-full tracking-wide ${badgeColor}`}>
                                                    {item.issueType.split(' ')[0]}
                                                </span>
                                                <span className="flex items-center text-[10px] text-gray-500 font-medium ml-1">
                                                    <Clock className="w-3 h-3 mr-1 text-gray-400" /> {item.daysSince} Hari
                                                </span>
                                            </div>
                                        </td>

                                        {/* Kolom 3: Pelanggan (Nama, HP & LOKASI) */}
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col max-w-[200px]">
                                                <span className="text-sm font-bold text-gray-900 line-clamp-1" title={item[COL_NAME]}>
                                                    {item[COL_NAME]}
                                                </span>
                                                <div className="flex items-center text-xs text-gray-500 mt-0.5 font-mono cursor-pointer hover:text-indigo-600" title="Klik untuk copy" onClick={() => navigator.clipboard.writeText(item[COL_PHONE])}>
                                                    {item[COL_PHONE]} <Copy className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"/>
                                                </div>
                                                <div className="text-[10px] text-gray-500 mt-1.5 leading-tight flex items-start gap-1">
                                                    <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5 text-gray-400" />
                                                    {isDigitalMode ? (
                                                        <span className="italic">{item.email || '-'}</span>
                                                    ) : (
                                                        <span>
                                                            {item[COL_SUBDISTRICT] ? `${item[COL_SUBDISTRICT]}, ` : ''}
                                                            {item[COL_CITY] ? `${item[COL_CITY]}` : ''}
                                                            {item[COL_PROVINCE] ? `, ${item[COL_PROVINCE]}` : ''}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Kolom 4: Konteks Order */}
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col gap-1">
                                                {/* NAMA PRODUK HURU KAPITAL */}
                                                <span className="text-xs font-bold text-gray-800 truncate max-w-[160px]" title={prodName}>
                                                    {prodName}
                                                </span>
                                                <div className="flex flex-wrap gap-1">
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                        <CreditCard className="w-2.5 h-2.5 mr-1" /> {bank || paymentMethod.split(' ')[0]}
                                                    </span>
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                                        {source.slice(0, 8)}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Kolom 5: Nilai Uang */}
                                        <td className="px-4 py-4 text-right">
                                            <div className="text-sm font-bold text-gray-900 font-mono">
                                                {formatRupiah(safeFloat(item[COL_NET_REVENUE]))}
                                            </div>
                                            {safeFloat(item[COL_NET_REVENUE]) > 500000 && (
                                                <span className="inline-block mt-1 text-[9px] font-bold text-white bg-emerald-500 px-1.5 rounded-sm">
                                                    HIGH VALUE
                                                </span>
                                            )}
                                        </td>

                                        {/* Kolom 6: Action Button */}
                                        <td className="px-4 py-4 text-center align-middle">
                                            {waLink ? (
                                                <a 
                                                    href={waLink} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    onClick={() => handleChatClick(item[COL_ORDER_ID])}
                                                    className={`
                                                        inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-bold text-white shadow-sm transition-all transform active:scale-95
                                                        ${isClicked 
                                                            ? 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200' 
                                                            : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 hover:shadow-green-200 shadow-green-100'
                                                        }
                                                    `}
                                                >
                                                    <MessageSquare className={`w-3.5 h-3.5 mr-1.5 ${isClicked ? 'text-gray-400' : 'text-white'}`} />
                                                    {isClicked ? 'Followed Up' : 'Chat WA'}
                                                </a>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-1 bg-gray-50 text-gray-400 text-[10px] rounded border border-gray-200">
                                                    <XCircle className="w-3 h-3 mr-1"/> No Phone
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            
                            {/* Empty State */}
                            {filteredIssues.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                            <div className="bg-emerald-50 p-4 rounded-full mb-3">
                                                <CheckCircle className="w-8 h-8 text-emerald-500" />
                                            </div>
                                            <p className="text-base font-medium text-gray-600">Tidak ada isu ditemukan!</p>
                                            <p className="text-sm mt-1">Cobalah ubah filter tanggal atau status.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}; // <--- [PENTING] Pastikan tanda }; ini ada di sini!

// --- NEW COMPONENT: TutorialView ---
const TutorialView = () => (
    <div className="space-y-8 animate-fade-in pb-10">
        {/* Header Section */}
        <div className="bg-white p-8 rounded-xl shadow-lg border border-indigo-100">
            <div className="flex items-center mb-6">
                <div className="p-3 bg-indigo-100 rounded-full mr-4">
                    <BookOpen className="w-8 h-8 text-indigo-600" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Panduan Penggunaan Dashboard</h2>
                    <p className="text-gray-500">Ikuti langkah-langkah persiapan data dan pelajari fungsi setiap fitur di bawah ini.</p>
                </div>
            </div>

            {/* STEP 1-3: Persiapan Data (Accordions/Cards) */}
            <div className="space-y-6">
                {/* 1. Persiapan Data Penjualan (Scalev) - Orange Theme */}
                <div className="bg-orange-50 border border-orange-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="bg-orange-100 px-6 py-4 flex items-center border-b border-orange-200">
                        <div className="p-2 bg-white rounded-lg shadow-sm mr-3">
                            <ShoppingBag className="w-5 h-5 text-orange-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">1. Persiapan Data Penjualan (Scalev)</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-200 text-orange-700 font-bold text-xs flex items-center justify-center mt-0.5">1</div>
                            <p className="text-sm text-gray-700">Masuk ke Halaman Order Scalev & Pilih Rentang Tanggal (Max 2 Bulan).</p>
                        </div>
                        <div className="flex gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-200 text-orange-700 font-bold text-xs flex items-center justify-center mt-0.5">2</div>
                            <div>
                                <p className="text-sm text-gray-700">Klik <strong>Export</strong>, lalu pilih opsi <code className="bg-white px-2 py-0.5 rounded border border-orange-200 font-mono text-orange-800 font-bold text-xs">Export Orders with Product as Columns</code>.</p>
                                <p className="text-[10px] text-red-600 font-bold mt-1 flex items-center"><AlertTriangle className="w-3 h-3 mr-1"/>Wajib pilih opsi ini agar varian produk terbaca.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Persiapan Data Iklan (Meta Ads) - Blue Theme */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="bg-blue-100 px-6 py-4 flex items-center border-b border-blue-200">
                        <div className="p-2 bg-white rounded-lg shadow-sm mr-3">
                            <Megaphone className="w-5 h-5 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">2. Persiapan Data Iklan (Meta Ads Manager)</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-700 font-bold text-xs flex items-center justify-center mt-0.5">1</div>
                            <p className="text-sm text-gray-700">Masuk ke Ads Manager (Tab Campaigns) & Pilih Tanggal.</p>
                        </div>
                        <div className="flex gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-700 font-bold text-xs flex items-center justify-center mt-0.5">2</div>
                            <div>
                                <p className="text-sm text-gray-700">Klik <strong>Breakdown</strong> → Pilih <strong>Time</strong> → Pilih <strong>Day</strong>.</p>
                                <p className="text-[10px] text-blue-600 font-bold mt-1">Ini penting agar grafik tren harian muncul.</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-700 font-bold text-xs flex items-center justify-center mt-0.5">3</div>
                            <p className="text-sm text-gray-700">Klik <strong>Reports/Export</strong> → Pilih <strong>Export Table Data</strong> (.csv).</p>
                        </div>
                    </div>
                </div>

                {/* 3. Cara Upload - Green Theme */}
                <div className="bg-green-50 border border-green-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="bg-green-100 px-6 py-4 flex items-center border-b border-green-200">
                        <div className="p-2 bg-white rounded-lg shadow-sm mr-3">
                            <Upload className="w-5 h-5 text-green-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">3. Cara Mengunggah Data</h3>
                    </div>
                    <div className="p-6">
                        <p className="text-sm text-gray-700 leading-relaxed">
                            Klik tombol <strong>"Unggah/Kelola Data"</strong> di pojok kanan atas. Pilih jenis data (Sales atau Ads).
                            Anda bisa memilih <strong>banyak file CSV sekaligus</strong> (misal: Data Januari & Februari) dengan menahan tombol <code>CTRL</code> saat memilih file.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        {/* MENU EXPLANATION - CARD GRID LAYOUT */}
        <div>
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center px-2">
                <List className="w-6 h-6 mr-3 text-indigo-600" /> 
                Kamus Fitur Dashboard
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* 1. Ringkasan Utama */}
                <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-indigo-500 hover:shadow-lg transition-all group">
                    <div className="flex items-center mb-3">
                        <div className="p-2 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors mr-3">
                            <LayoutDashboard className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h4 className="font-bold text-gray-800">Ringkasan Utama</h4>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                        Dashboard eksekutif (Helicopter View). Lihat total omzet, profit bersih, dan performa bisnis secara keseluruhan dalam satu layar.
                    </p>
                </div>

                {/* 2. Analisis Marketing */}
                <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-blue-500 hover:shadow-lg transition-all group">
                    <div className="flex items-center mb-3">
                        <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors mr-3">
                            <Megaphone className="w-5 h-5 text-blue-600" />
                        </div>
                        <h4 className="font-bold text-gray-800">Analisis Marketing</h4>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                        Evaluasi efektivitas iklan Meta Ads. Pantau metrics penting seperti ROAS, CPR (Cost per Result), dan Total Ad Spend.
                    </p>
                </div>

                {/* 3. Laporan Harian */}
                <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-teal-500 hover:shadow-lg transition-all group">
                    <div className="flex items-center mb-3">
                        <div className="p-2 bg-teal-50 rounded-lg group-hover:bg-teal-100 transition-colors mr-3">
                            <FileText className="w-5 h-5 text-teal-600" />
                        </div>
                        <h4 className="font-bold text-gray-800">Laporan Harian</h4>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                        Tabel detail transaksi. Filter berdasarkan status, cari nama pelanggan, dan export data bersih ke CSV/Excel.
                    </p>
                </div>

                {/* 4. Recovery & Isu */}
                <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-red-500 hover:shadow-lg transition-all group">
                    <div className="flex items-center mb-3">
                        <div className="p-2 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors mr-3">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <h4 className="font-bold text-gray-800">Recovery & Isu</h4>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                        Deteksi order macet (Stuck Pending) & Retur. Gunakan fitur <strong>Chat WA</strong> untuk follow-up otomatis dan selamatkan omzet.
                    </p>
                </div>

                {/* 5. RFM Segmentation */}
                <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-purple-500 hover:shadow-lg transition-all group">
                    <div className="flex items-center mb-3">
                        <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors mr-3">
                            <Layers className="w-5 h-5 text-purple-600" />
                        </div>
                        <h4 className="font-bold text-gray-800">Segmen Pelanggan</h4>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                        Pengelompokan otomatis pelanggan (Champions, Loyal, New, dll) untuk strategi promosi yang lebih personal dan tajam.
                    </p>
                </div>

                {/* 6. Analisis Produk */}
                <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-pink-500 hover:shadow-lg transition-all group">
                    <div className="flex items-center mb-3">
                        <div className="p-2 bg-pink-50 rounded-lg group-hover:bg-pink-100 transition-colors mr-3">
                            <Boxes className="w-5 h-5 text-pink-600" />
                        </div>
                        <h4 className="font-bold text-gray-800">Analisis Produk</h4>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                        Lihat peringkat produk terlaris. Ketahui mana varian "Hero" yang menyumbang pendapatan terbesar.
                    </p>
                </div>

                {/* 7. Sumber Trafik */}
                <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-orange-500 hover:shadow-lg transition-all group">
                    <div className="flex items-center mb-3">
                        <div className="p-2 bg-orange-50 rounded-lg group-hover:bg-orange-100 transition-colors mr-3">
                            <TrendingUp className="w-5 h-5 text-orange-600" />
                        </div>
                        <h4 className="font-bold text-gray-800">Sumber Trafik</h4>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                        Analisis UTM Source. Ketahui platform mana (FB, IG, Tiktok, dll) yang paling banyak menghasilkan konversi.
                    </p>
                </div>

                {/* 8. Peta Geografis */}
                <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-red-400 hover:shadow-lg transition-all group">
                    <div className="flex items-center mb-3">
                        <div className="p-2 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors mr-3">
                            <MapPin className="w-5 h-5 text-red-500" />
                        </div>
                        <h4 className="font-bold text-gray-800">Peta Geografis</h4>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                        Visualisasi sebaran pelanggan. Temukan kota, kabupaten, hingga kecamatan mana yang menjadi basis pembeli terbesar.
                    </p>
                </div>

                {/* 9. Heatmap Waktu */}
                <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-green-500 hover:shadow-lg transition-all group">
                    <div className="flex items-center mb-3">
                        <div className="p-2 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors mr-3">
                            <Grid3X3 className="w-5 h-5 text-green-600" />
                        </div>
                        <h4 className="font-bold text-gray-800">Heatmap Waktu</h4>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                        Ketahui jam dan hari "Prime Time" jualan Anda. Gunakan untuk jadwal posting konten atau broadcast WA.
                    </p>
                </div>

            </div>
        </div>
        
        <div className="mt-8 bg-gray-50 p-6 rounded-xl border border-gray-200 text-center">
            <p className="text-gray-500 text-sm italic">
                Tips: Gunakan dashboard ini secara rutin (harian/mingguan) untuk memantau kesehatan bisnis Anda secara real-time.
            </p>
        </div>
    </div>
);

// --- NEW: Product Analysis View Component ---
const ProductAnalysisView = ({ productData }) => {
    const { totalSold, totalRevenue, bestSellerQty, bestSellerRev, top10Mix, pieData } = useMemo(() => {
        if (!productData || productData.length === 0) return { totalSold: 0, totalRevenue: 0, bestSellerQty: null, bestSellerRev: null, top10Mix: [], pieData: [] };
        
        const _totalSold = productData.reduce((acc, curr) => acc + curr.totalQuantity, 0);
        const _totalRev = productData.reduce((acc, curr) => acc + curr.totalRevenue, 0);
        
        const sortedByQty = [...productData].sort((a, b) => b.totalQuantity - a.totalQuantity);
        const sortedByRev = [...productData].sort((a, b) => b.totalRevenue - a.totalRevenue);
        
        const _bestQty = sortedByQty[0];
        const _bestRev = sortedByRev[0];
        
        // Data for Bar Chart (Top 10 by Qty)
        const _top10Mix = sortedByQty.slice(0, 10);
        
        // Data for Pie Chart (Top 5 by Revenue)
        const top5Rev = sortedByRev.slice(0, 5);
        const otherRev = sortedByRev.slice(5).reduce((acc, curr) => acc + curr.totalRevenue, 0);
        const _pieData = [
            ...top5Rev.map(p => ({ name: p.name, value: p.totalRevenue })),
            { name: 'Lainnya', value: otherRev }
        ].filter(d => d.value > 0);

        return { totalSold: _totalSold, totalRevenue: _totalRev, bestSellerQty: _bestQty, bestSellerRev: _bestRev, top10Mix: _top10Mix, pieData: _pieData };
    }, [productData]);

    if (!productData || productData.length === 0) return <div className="p-8 text-center text-gray-500 italic bg-white rounded-xl shadow">Belum ada data produk tersedia.</div>;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* 1. KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard compact title="Total Produk Terjual" value={totalSold.toLocaleString()} icon={Package} color="#EC4899" unit="Pcs" description="Total akumulasi item keluar" />
                <StatCard compact title="Produk Terlaris (Qty)" value={bestSellerQty?.name || '-'} icon={Award} color="#F59E0B" unit={bestSellerQty ? `${bestSellerQty.totalQuantity} Pcs` : ''} description="Volume penjualan tertinggi" />
                <StatCard compact title="Penyumbang Omzet Terbesar" value={bestSellerRev?.name || '-'} icon={DollarSign} color="#10B981" unit={bestSellerRev ? formatRupiah(bestSellerRev.totalRevenue) : ''} description="Nilai penjualan (Revenue) tertinggi" />
            </div>

            {/* 2. Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Bar Chart Mix (Dual Axis) */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 text-indigo-600" />
                        Top 10 Produk: Kuantitas (Bar) vs Pendapatan (Garis)
                    </h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={top10Mix} margin={{top: 10, right: 30, left: 0, bottom: 0}}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" tick={{fontSize: 10}} interval={0} angle={-15} textAnchor="end" height={60} />
                                <YAxis yAxisId="left" orientation="left" stroke="#EC4899" tick={{fontSize: 10}} label={{ value: 'Qty', angle: -90, position: 'insideLeft', fill: '#EC4899', fontSize: 10 }} />
                                <YAxis yAxisId="right" orientation="right" stroke="#10B981" tick={{fontSize: 10}} tickFormatter={(val) => (val/1000000).toFixed(1) + 'jt'} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    formatter={(value, name) => [name === 'Revenue' ? formatRupiah(value) : value.toLocaleString(), name === 'Revenue' ? 'Pendapatan' : 'Terjual']} 
                                />
                                <Legend wrapperStyle={{fontSize: '11px', paddingTop: '10px'}} />
                                <Bar yAxisId="left" dataKey="totalQuantity" name="Qty (Pcs)" fill="#F472B6" barSize={30} radius={[4, 4, 0, 0]} />
                                <Line yAxisId="right" type="monotone" dataKey="totalRevenue" name="Revenue (Rp)" stroke="#10B981" strokeWidth={3} dot={{r: 4, fill:'#10B981'}} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                        <PieChartIcon className="w-5 h-5 mr-2 text-purple-600" />
                        Kontribusi Omzet (Top 5)
                    </h3>
                    <div className="flex-1 min-h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(val) => formatRupiah(val)} />
                                <Legend layout="vertical" verticalAlign="bottom" align="center" wrapperStyle={{fontSize: '10px'}} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-center text-xs text-gray-400 mt-2 italic">Seberapa besar 5 produk teratas mendominasi total pendapatan toko.</p>
                </div>
            </div>

            {/* 3. Existing Table Section */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                        <Boxes className="w-5 h-5 mr-2 text-pink-600" />
                        Detail Peringkat Produk
                    </h3>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">Total Varian: {productData.length}</span>
                </div>
                <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Peringkat</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nama Produk/Varian</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Total Kuantitas</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Total Pesanan</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Revenue</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {productData.map((item, index) => (
                                <tr key={index} className="hover:bg-pink-50/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-lg font-bold text-gray-900 w-20 text-center">{index < 3 ? <span className="text-pink-600">#{index + 1}</span> : `#${index + 1}`}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700 truncate max-w-[300px]" title={item.name}>{item.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-base text-right font-extrabold text-indigo-600">{item.totalQuantity.toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">{item.totalOrders.toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-800">{formatRupiah(item.totalRevenue)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const BillingView = () => {
    // --- [CONFIG LINK CHECKOUT] ---
    const checkoutLinks = {
        monthly: "https://crmauto.id/checkout-crmauto30",
        yearly:  "https://crmauto.id/checkout-crmauto365"
    };

    const [selectedPlan, setSelectedPlan] = React.useState('yearly'); // Default pilih tahunan

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-10">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900">Pilih Paket Langganan</h2>
                <p className="text-gray-500 mt-2">Investasi terbaik untuk pertumbuhan bisnis Anda.</p>
            </div>

            {/* Toggle Bulanan / Tahunan */}
            <div className="flex justify-center mb-8">
                <div className="bg-gray-100 p-1 rounded-lg flex items-center relative">
                    <button 
                        onClick={() => setSelectedPlan('monthly')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all z-10 ${selectedPlan === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        Bulanan
                    </button>
                    <button 
                        onClick={() => setSelectedPlan('yearly')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all z-10 flex items-center gap-2 ${selectedPlan === 'yearly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        Tahunan <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">FREE 2 BULAN</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* --- CARD 1: PAKET BULANAN --- */}
                <div className={`p-8 rounded-2xl border-2 transition-all ${selectedPlan === 'monthly' ? 'border-indigo-600 shadow-xl ring-4 ring-indigo-50 relative bg-white' : 'border-gray-100 bg-white opacity-60 hover:opacity-100'}`}>
                    <h3 className="text-lg font-bold text-gray-900">Starter / Bulanan</h3>
                    <div className="my-4">
                        <span className="text-4xl font-extrabold text-gray-900">Rp 99rb</span>
                        <span className="text-gray-500">/bulan</span>
                    </div>
                    <ul className="space-y-3 mb-8 text-sm text-gray-600">
                        <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2"/> Full Akses Dashboard</li>
                        <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2"/> Analisis Marketing</li>
                        <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2"/> Export Data CSV</li>
                    </ul>
                    
                    {/* TOMBOL LINK BULANAN */}
                    <button 
                        onClick={() => window.open(checkoutLinks.monthly, '_blank')}
                        className="w-full py-3 rounded-xl font-bold transition-all bg-gray-100 text-gray-800 hover:bg-gray-200"
                    >
                        Pilih Bulanan
                    </button>
                </div>

                {/* --- CARD 2: PAKET TAHUNAN (PROMO) --- */}
                <div className={`p-8 rounded-2xl border-2 transition-all ${selectedPlan === 'yearly' ? 'border-indigo-600 shadow-xl ring-4 ring-indigo-50 relative bg-white' : 'border-gray-100 bg-white opacity-60 hover:opacity-100'}`}>
                    {selectedPlan === 'yearly' && (
                        <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-lg">
                            BEST VALUE
                        </div>
                    )}
                    <h3 className="text-lg font-bold text-gray-900">Pro / Tahunan</h3>
                    <div className="my-4">
                        <span className="text-4xl font-extrabold text-gray-900">Rp 990rb</span>
                        <span className="text-gray-500">/tahun</span>
                    </div>
                    
                    {/* KETERANGAN PROMO */}
                    <p className="text-xs text-green-700 font-bold mb-4 bg-green-100 inline-block px-3 py-1.5 rounded-lg border border-green-200">
                        🎉 Bayar 10 bulan, Free 2 bulan!
                    </p>
                    
                    <ul className="space-y-3 mb-8 text-sm text-gray-600">
                        <li className="flex items-center"><CheckCircle className="w-4 h-4 text-indigo-500 mr-2"/> <b>Semua Fitur Bulanan</b></li>
                        <li className="flex items-center"><CheckCircle className="w-4 h-4 text-indigo-500 mr-2"/> Prioritas Support</li>
                        <li className="flex items-center"><CheckCircle className="w-4 h-4 text-indigo-500 mr-2"/> Akses Update Fitur Baru</li>
                    </ul>

                    {/* TOMBOL LINK TAHUNAN */}
                    <button 
                        onClick={() => window.open(checkoutLinks.yearly, '_blank')}
                        className="w-full py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-indigo-200 bg-indigo-600 text-white hover:bg-indigo-700 transform hover:-translate-y-1"
                    >
                        Ambil Promo Tahunan &rarr;
                    </button>
                </div>
            </div>
            
            <p className="text-center text-xs text-gray-400 mt-8">
                Pembayaran aman diproses melalui Payment Gateway terpercaya.
            </p>
        </div>
    );
};

const ExpiredNotification = () => (
    <div className="fixed top-4 right-4 z-50 animate-bounce-in">
        <div className="bg-red-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center max-w-sm border-2 border-red-400">
            <div className="p-2 bg-red-800 rounded-full mr-4 flex-shrink-0 animate-pulse">
                <Lock className="w-6 h-6 text-white" />
            </div>
            <div>
                <h4 className="font-bold text-sm uppercase tracking-wider mb-1">Akses Terkunci</h4>
                <p className="text-xs leading-relaxed text-red-100">
                    Masa aktif berakhir. Dashboard hanya dalam mode lihat (View Only). 
                    Silakan pilih paket di menu <strong>Billing</strong> untuk membuka kunci.
                </p>
            </div>
        </div>
    </div>
);

const MarketingAnalysisView = ({ adsData }) => {
    const metrics = useMemo(() => {
        if (!adsData || adsData.length === 0) return null;

        let totalSpend = 0;
        let totalImpressions = 0;
        let totalClicks = 0;
        let totalLPV = 0; 
        let totalATC = 0; 
        let totalIC = 0;  
        let totalPurchases = 0;
        let totalConversionValue = 0;
        let totalLeads = 0;

        const getVal = (row, ...keys) => {
            for (const key of keys) {
                if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
                    const val = parseFloat(row[key]);
                    if (!isNaN(val)) return val;
                }
            }
            return 0; 
        };

        adsData.forEach(row => {
            const name = row[ADS_CAMPAIGN_NAME] || row['campaign_name'];
            if (!name || name === 'Total' || name === 'Results' || name === 'Summary') return;

            const spend = getVal(row, ADS_AMOUNT_SPENT, 'amount_spent', 'amount_spent__idr');
            totalSpend += spend;

            totalImpressions += getVal(row, ADS_IMPRESSIONS, 'impressions');
            totalClicks += getVal(row, ADS_LINK_CLICKS, 'link_clicks');
            
            totalLPV += getVal(row, 'landing_page_views', 'website_landing_page_views', 'actions_landing_page_view', 'website_content_views', 'content_views');
            totalATC += getVal(row, 'adds_to_cart', 'website_adds_to_cart', 'actions_add_to_cart', 'add_to_cart', 'mobile_app_adds_to_cart');
            totalIC += getVal(row, 'checkouts_initiated', 'website_checkouts_initiated', 'actions_initiate_checkout', 'initiate_checkout', 'mobile_app_checkouts_initiated');

            const purchases = getVal(row, ADS_PURCHASES, ADS_WEBSITE_PURCHASES, 'purchases', 'website_purchases', 'actions_purchase', 'mobile_app_purchases');
            totalPurchases += purchases;
            
            totalConversionValue += getVal(row, ADS_CONVERSION_VALUE, 'purchases_conversion_value', 'website_purchases_conversion_value');
            totalLeads += getVal(row, 'leads');
        });

        const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
        const cpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;
        const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
        const cpr = totalPurchases > 0 ? totalSpend / totalPurchases : 0;
        const roas = totalSpend > 0 ? totalConversionValue / totalSpend : 0;
        const conversionRate = totalClicks > 0 ? (totalPurchases / totalClicks) * 100 : 0;

        return {
            totalSpend, totalImpressions, totalClicks, 
            totalLPV, totalATC, totalIC, totalPurchases, 
            totalConversionValue, totalLeads, cpc, cpm, ctr, cpr, roas, conversionRate
        };
    }, [adsData]);

    const campaignData = useMemo(() => {
         if (!adsData) return [];
         const camps = {};
         adsData.forEach(row => {
             const name = row[ADS_CAMPAIGN_NAME] || row['campaign_name'];
             if (!name || name === 'Total' || name === 'Results' || name === 'Summary' || name === 'Unknown') return;
             
             if (!camps[name]) camps[name] = { name, spend: 0, purchases: 0, revenue: 0, clicks: 0, impressions: 0 };
             
             const spend = (row[ADS_AMOUNT_SPENT] || row['amount_spent'] || row['amount_spent__idr'] || 0);
             camps[name].spend += spend;

             camps[name].purchases += (row[ADS_PURCHASES] || row[ADS_WEBSITE_PURCHASES] || 0);
             camps[name].revenue += (row[ADS_CONVERSION_VALUE] || 0);
             camps[name].clicks += (row[ADS_LINK_CLICKS] || 0);
             camps[name].impressions += (row[ADS_IMPRESSIONS] || 0);
         });

         return Object.values(camps)
            .map(c => ({
                ...c,
                roas: c.spend > 0 ? c.revenue / c.spend : 0,
                cpr: c.purchases > 0 ? c.spend / c.purchases : 0
            }))
            .sort((a, b) => b.spend - a.spend); 
    }, [adsData]);

    if (!metrics) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-lg border-2 border-dashed border-gray-300">
                <Megaphone className="w-16 h-16 text-indigo-200 mb-4" />
                <h3 className="text-xl font-bold text-gray-700">Belum Ada Data Iklan</h3>
                <p className="text-gray-500 text-center max-w-md mt-2">
                    Silakan unggah file CSV dari Meta Ads Manager (Export Table Data) melalui tombol "Unggah/Kelola Data" di pojok kanan atas.
                </p>
                <div className="mt-6 p-4 bg-indigo-50 rounded-lg text-xs text-indigo-800 text-left w-full max-w-md">
                    <p className="font-bold mb-2">Pastikan kolom berikut ada di CSV Anda:</p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>Campaign name</li>
                        <li>Amount spent (IDR)</li>
                        <li>Impressions & Link clicks</li>
                        <li>Landing page views & Adds to cart (Opsional)</li>
                        <li>Purchases (atau Website purchases)</li>
                        <li>Purchases conversion value</li>
                    </ul>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100">
                    <h3 className="text-base font-bold text-gray-700 flex items-center mb-4 border-b pb-2">
                        <DollarSign className="w-4 h-4 mr-2 text-green-600" />
                        Performa Finansial & ROI
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <StatCard compact title="Total Ad Spend" value={formatRupiah(metrics.totalSpend)} icon={Wallet} color="#EF4444" />
                        <StatCard compact title="Total Ad Revenue" value={formatRupiah(metrics.totalConversionValue)} icon={DollarSign} color="#10B981" />
                        <StatCard compact title="ROAS (Return)" value={metrics.roas.toFixed(2) + "x"} icon={TrendingUp} color="#6366F1" />
                        <StatCard compact title="CPR (Cost Per Result)" value={formatRupiah(metrics.cpr)} icon={Target} color="#F59E0B" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100">
                    <h3 className="text-base font-bold text-gray-700 flex items-center mb-4 border-b pb-2">
                        <MousePointer className="w-4 h-4 mr-2 text-blue-600" />
                        Efisiensi Trafik & Konversi
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <StatCard compact title="CTR (Click Rate)" value={metrics.ctr.toFixed(2) + "%"} icon={MousePointer} color="#3B82F6" />
                        <StatCard compact title="CVR (Conversion Rate)" value={metrics.conversionRate.toFixed(2) + "%"} icon={RefreshCw} color="#8B5CF6" />
                        <StatCard compact title="CPC (Cost Per Click)" value={formatRupiah(metrics.cpc)} icon={Activity} color="#64748B" />
                        <StatCard compact title="CPM (Cost Per Mille)" value={formatRupiah(metrics.cpm)} icon={Eye} color="#06B6D4" unit="/ 1k views" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center mb-6">
                        <Filter className="w-5 h-5 mr-2 text-indigo-600" />
                        Marketing Funnel (Impressions to Purchase)
                    </h3>
                    <div className="space-y-4">
                        <div className="relative pt-1">
                            <div className="flex mb-2 items-center justify-between">
                                <div><span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">Impressions (Tayangan)</span></div>
                                <div className="text-right"><span className="text-xs font-semibold inline-block text-blue-600">{metrics.totalImpressions.toLocaleString()}</span></div>
                            </div>
                            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-100"><div style={{ width: "100%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div></div>
                        </div>

                        <div className="relative pt-1 pl-2 border-l-2 border-dashed border-gray-300">
                            <div className="flex mb-2 items-center justify-between">
                                <div><span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">Link Clicks</span></div>
                                <div className="text-right">
                                    <span className="text-xs font-semibold inline-block text-indigo-600">{metrics.totalClicks.toLocaleString()}</span>
                                    <span className="text-[10px] text-gray-500 block">CTR: {metrics.ctr.toFixed(2)}%</span>
                                </div>
                            </div>
                            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-100"><div style={{ width: `${Math.min((metrics.totalClicks/metrics.totalImpressions)*500, 100)}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"></div></div>
                        </div>

                        <div className="relative pt-1 pl-4 border-l-2 border-dashed border-gray-300">
                            <div className="flex mb-2 items-center justify-between">
                                <div><span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-teal-600 bg-teal-200">Landing Page View</span></div>
                                <div className="text-right">
                                    <span className="text-xs font-semibold inline-block text-teal-600">{metrics.totalLPV.toLocaleString()}</span>
                                    {metrics.totalClicks > 0 && (
                                        <span className="text-[10px] text-gray-500 block">
                                            Rate: {((metrics.totalLPV/metrics.totalClicks)*100).toFixed(1)}%
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-teal-100">
                                <div style={{ width: `${metrics.totalClicks > 0 ? Math.min((metrics.totalLPV/metrics.totalClicks)*100, 100) : 0}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-teal-500"></div>
                            </div>
                        </div>

                        <div className="relative pt-1 pl-6 border-l-2 border-dashed border-gray-300">
                            <div className="flex mb-2 items-center justify-between">
                                <div><span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-purple-600 bg-purple-200">Add To Cart</span></div>
                                <div className="text-right">
                                    <span className="text-xs font-semibold inline-block text-purple-600">{metrics.totalATC.toLocaleString()}</span>
                                    {metrics.totalLPV > 0 && <span className="text-[10px] text-gray-500 block">Conv: {((metrics.totalATC/metrics.totalLPV)*100).toFixed(1)}%</span>}
                                </div>
                            </div>
                            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-purple-100">
                                <div style={{ width: `${metrics.totalLPV > 0 ? Math.min((metrics.totalATC/metrics.totalLPV)*100, 100) : 0}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-500"></div>
                            </div>
                        </div>

                        <div className="relative pt-1 pl-8 border-l-2 border-dashed border-gray-300">
                            <div className="flex mb-2 items-center justify-between">
                                <div><span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-orange-600 bg-orange-200">Initiate Checkout</span></div>
                                <div className="text-right">
                                    <span className="text-xs font-semibold inline-block text-orange-600">{metrics.totalIC.toLocaleString()}</span>
                                    {metrics.totalATC > 0 && <span className="text-[10px] text-gray-500 block">Conv: {((metrics.totalIC/metrics.totalATC)*100).toFixed(1)}%</span>}
                                </div>
                            </div>
                            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-orange-100">
                                <div style={{ width: `${metrics.totalATC > 0 ? Math.min((metrics.totalIC/metrics.totalATC)*100, 100) : 0}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-orange-500"></div>
                            </div>
                        </div>

                        <div className="relative pt-1 pl-10 border-l-2 border-dashed border-gray-300">
                            <div className="flex mb-2 items-center justify-between">
                                <div><span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">Purchases (Beli)</span></div>
                                <div className="text-right">
                                    <span className="text-xs font-semibold inline-block text-green-600">{metrics.totalPurchases.toLocaleString()}</span>
                                    {metrics.totalIC > 0 ? (
                                        <span className="text-[10px] text-gray-500 block">Conv: {((metrics.totalPurchases/metrics.totalIC)*100).toFixed(1)}%</span>
                                    ) : (
                                        <span className="text-[10px] text-gray-500 block">CVR (Click): {metrics.conversionRate.toFixed(2)}%</span>
                                    )}
                                </div>
                            </div>
                            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-100">
                                <div style={{ width: `${metrics.totalIC > 0 ? Math.min((metrics.totalPurchases/metrics.totalIC)*100, 100) : Math.min((metrics.totalPurchases/metrics.totalClicks)*100, 100)}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                     <h3 className="text-lg font-bold text-gray-800 flex items-center mb-6">
                        <Award className="w-5 h-5 mr-2 text-yellow-500" />
                        Top Campaigns (Spend vs ROAS)
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid />
                                <XAxis type="number" dataKey="spend" name="Ad Spend" unit="IDR" tickFormatter={(val)=>val/1000 + 'k'} />
                                <YAxis type="number" dataKey="roas" name="ROAS" unit="x" />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value, name) => [name === 'Ad Spend' ? formatRupiah(value) : parseFloat(value).toFixed(2), name]} content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-white p-2 border border-gray-200 shadow-md rounded text-xs">
                                                <p className="font-bold mb-1">{payload[0].payload.name}</p>
                                                <p>Spend: {formatRupiah(payload[0].value)}</p>
                                                <p>ROAS: {payload[1].value.toFixed(2)}x</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }} />
                                <Scatter name="Campaigns" data={campaignData.filter(c => c.spend > 0)} fill="#8884d8">
                                    {campaignData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.roas > 2 ? '#10B981' : entry.roas > 1 ? '#F59E0B' : '#EF4444'} />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                     <p className="text-center text-xs text-gray-500 mt-2 italic">Hijau: ROAS &gt; 2x, Kuning: ROAS &gt; 1x, Merah: ROAS &lt; 1x</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 flex items-center mb-4 border-b pb-2">
                    <List className="w-5 h-5 mr-2 text-indigo-600" />
                    Detail Performa Kampanye (Campaigns)
                </h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Campaign Name</th>
                                <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Spend</th>
                                <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Purchase</th>
                                <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">CPR</th>
                                <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Revenue (Ads)</th>
                                <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">ROAS</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {campaignData.map((c, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-[250px] truncate" title={c.name}>{c.name}</td>
                                    <td className="px-4 py-3 text-sm text-right text-gray-700">{formatRupiah(c.spend)}</td>
                                    <td className="px-4 py-3 text-sm text-right text-gray-700">{c.purchases}</td>
                                    <td className="px-4 py-3 text-sm text-right text-gray-700">{formatRupiah(c.cpr)}</td>
                                    <td className="px-4 py-3 text-sm text-right text-gray-700">{formatRupiah(c.revenue)}</td>
                                    <td className="px-4 py-3 text-sm text-right font-bold">
                                        <span className={`px-2 py-0.5 rounded ${c.roas >= 4 ? 'bg-green-100 text-green-800' : c.roas >= 2 ? 'bg-blue-100 text-blue-800' : c.roas >= 1 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                            {c.roas.toFixed(2)}x
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// --- 4. KOMPONEN DASHBOARD UTAMA (LOGIKA LENGKAP) ---
function DashboardCRM() {
    const { user } = useUser();
    
    // State Definitions
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // State baru untuk Menu HP
    const [view, setView] = useState('summary');
    const [rawData, setRawData] = useState([]);
    const [adsData, setAdsData] = useState([]);
    const [isLoadingFirestore, setIsLoadingFirestore] = useState(true);
    
    // State Trial & Status
    const [trialStatus, setTrialStatus] = useState({ loading: true, expired: false, daysLeft: 0, mode: 'trial' });

    // State Upload
    const [isUploading, setIsUploading] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadType, setUploadType] = useState('sales'); 
    const [uploadMode, setUploadMode] = useState('merge'); 
    const [uploadError, setUploadError] = useState(null);
    const [fileNameDisplay, setFileNameDisplay] = useState("No file chosen");

    // Processed Data
    const processedData = useProcessedData(rawData);
    const { totalConfirmedRevenue, totalConfirmedOrders, totalGrossProfit, customerSegmentationData, heatmapData, heatmapMaxRevenue, rawTimeData, productVariantAnalysis, dailyTrendAnalysis, isDigitalMode,totalSoldItems,topLocationLists } = processedData;

    // --- UPDATE BAGIAN INI DI DALAM FUNCTION DashboardCRM ---
    
    // Summary Metrics (DIPERBAIKI: ROAS vs MER)
    const summaryMetrics = useMemo(() => {
        // 1. Hitung Total Ad Spend (+ PPN)
        let totalAdSpend = 0;
        if (adsData && adsData.length > 0) {
            adsData.forEach(row => {
                const rawName = row['campaign_name'] || row['Campaign Name'] || '';
                const name = rawName.toString().trim().toLowerCase();
                if (['total', 'results', 'summary', 'unknown', ''].includes(name)) return;
                const spend = parseFloat(row['amount_spent_idr'] || row['amount_spent'] || 0);
                if (!isNaN(spend)) totalAdSpend += spend;
            });
        }
        totalAdSpend = totalAdSpend * 1.11; // PPN 11%

        // 2. Hitung Ad Revenue (Khusus Pesanan dari Iklan)
        // Kita filter dari 'processedData.confirmedOrders' yang sudah valid
        let adRevenue = 0;
        
        // List source yang dianggap IKLAN BERBAYAR
        const paidSources = ['facebook', 'instagram', 'ig', 'fb', 'tiktok', 'ads', 'google', 'youtube', 'cpas', 'collaborative'];
        
        if (processedData.confirmedOrders) {
            processedData.confirmedOrders.forEach(order => {
                const source = (order[COL_UTM_SOURCE] || '').toString().toLowerCase();
                const medium = (order[COL_UTM_MEDIUM] || '').toString().toLowerCase();
                
                // Cek apakah source mengandung kata kunci berbayar
                const isPaid = paidSources.some(s => source.includes(s) || medium.includes(s));
                
                if (isPaid) {
                    adRevenue += (order[COL_NET_REVENUE] || 0);
                }
            });
        }

        // 3. Kalkulasi Metrik
        const realNetProfit = totalGrossProfit - totalAdSpend;
        
        // ROAS = Omzet Iklan / Spend (Spesifik)
        const roas = totalAdSpend > 0 ? adRevenue / totalAdSpend : 0;
        
        // MER = Total Semua Omzet / Spend (Global/Blended)
        const mer = totalAdSpend > 0 ? totalConfirmedRevenue / totalAdSpend : 0;
        
        const cpr = totalConfirmedOrders > 0 ? totalAdSpend / totalConfirmedOrders : 0;
        const aov = totalConfirmedOrders > 0 ? totalConfirmedRevenue / totalConfirmedOrders : 0;
        const closingRate = rawData.length > 0 ? (totalConfirmedOrders / rawData.length) * 100 : 0;

        return { totalAdSpend, realNetProfit, roas, mer, cpr, aov, closingRate, totalAllOrders: rawData.length, adRevenue };
    }, [adsData, totalGrossProfit, totalConfirmedRevenue, totalConfirmedOrders, rawData, processedData.confirmedOrders]);
    
	const jsonToCSV = (jsonArray) => {
        if (!jsonArray || jsonArray.length === 0) return "";
        const allHeaders = new Set();
        jsonArray.forEach(row => { if (row && typeof row === 'object') { Object.keys(row).forEach(key => allHeaders.add(key)); } });
        const sortedHeaders = Array.from(allHeaders).sort();
        const csvRows = [sortedHeaders.join(',')];
        for (const row of jsonArray) {
            const values = sortedHeaders.map(header => {
                const val = row[header] === null || row[header] === undefined ? '' : String(row[header]);
                return `"${val.replace(/"/g, '""').replace(/\n|\r/g, ' ')}"`;
            });
            csvRows.push(values.join(','));
        }
        return csvRows.join('\n');
    };

    // Load Data & Check Subscription (Email Based)
    useEffect(() => {
        const initDashboard = async () => {
            // Pastikan user punya email
            if (user && user.primaryEmailAddress?.emailAddress) {
                setIsLoadingFirestore(true);
                try {
                    // --- PERUBAHAN UTAMA DI SINI ---
                    // Kita pakai EMAIL sebagai ID, bukan user.id lagi
                    const userEmail = user.primaryEmailAddress.emailAddress;
                    const docRef = doc(db, "user_datasets", userEmail);
                    
                    const docSnap = await getDoc(docRef);
                    const now = new Date();

                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        
                        // 1. CEK STATUS LANGGANAN (Dari Scalev/Make.com)
                        if (data.expiryDate) {
                            // Konversi Timestamp Firestore ke Date Javascript
                            let expiry;
                            if (data.expiryDate.toDate) {
                                expiry = data.expiryDate.toDate(); 
                            } else {
                                expiry = new Date(data.expiryDate);
                            }

                            if (now < expiry) {
                                // MASIH AKTIF (PREMIUM)
                                const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
                                setTrialStatus({ loading: false, expired: false, daysLeft: diffDays, mode: 'subscription' });
                            } else {
                                // SUDAH HABIS (EXPIRED)
                                setTrialStatus({ loading: false, expired: true, daysLeft: 0, mode: 'subscription' });
                            }
                        } else {
                            // Data ada (mungkin trial manual), tapi tidak ada expiryDate dari Scalev
                            // Default: Anggap Expired atau Kasih Trial 1 hari (Tergantung kebijakan Anda)
                            setTrialStatus({ loading: false, expired: true, daysLeft: 0, mode: 'trial' });
                        }

                        // 2. LOAD DATA CSV/JSON (Agar Grafik Muncul)
                        if (data.salesDataUrl) {
                            const res = await fetch(`${data.salesDataUrl}?t=${new Date().getTime()}`);
                            if (res.ok) {
                                const textData = await res.text();
                                if (textData.trim().startsWith('[') || textData.trim().startsWith('{')) setRawData(JSON.parse(textData));
                                else setRawData(parseCSV(textData).data);
                            }
                        }
                        if (data.adsDataUrl) {
                            const res = await fetch(`${data.adsDataUrl}?t=${new Date().getTime()}`);
                            if (res.ok) {
                                const textData = await res.text();
                                if (textData.trim().startsWith('[') || textData.trim().startsWith('{')) setAdsData(JSON.parse(textData));
                                else setAdsData(parseCSV(textData).data);
                            }
                        }

                    } else {
                        // 3. JIKA USER TIDAK DITEMUKAN (Belum pernah beli di Scalev)
                        // Mode: Langsung Kunci (Expired)
                        console.log("User belum terdaftar di database langganan.");
                        setTrialStatus({ loading: false, expired: true, daysLeft: 0, mode: 'none' });
                        
                        // Opsi: Jika Anda ingin memberi Free Trial otomatis untuk user baru yang belum bayar,
                        // Uncomment baris di bawah ini dan Comment baris setTrialStatus di atas:
                        /*
                        await setDoc(docRef, { trialStartDate: now.toISOString(), createdAt: now.toISOString() });
                        setTrialStatus({ loading: false, expired: false, daysLeft: 7, mode: 'trial' });
                        */
                    }
                } catch (error) { 
                    console.error("Error loading dashboard:", error); 
                    setTrialStatus(prev => ({ ...prev, loading: false, expired: true }));
                } finally { 
                    setIsLoadingFirestore(false); 
                }
            }
        };
        
        initDashboard();
    }, [user]);

    const uploadToSupabase = async (userId, dataArray, fileName) => {
        const csvString = jsonToCSV(dataArray); 
        const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
        const filePath = `${userId}/${fileName}.csv`;
        const { error: uploadError } = await supabase.storage.from('user-datasets').upload(filePath, blob, { upsert: true, contentType: 'text/csv' });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('user-datasets').getPublicUrl(filePath);
        return urlData.publicUrl;
    };

    const handleFileUpload = async (event) => {
        setUploadError(null);
        const files = Array.from(event.target.files);
        if (files.length === 0) return;
        setFileNameDisplay(files.length > 1 ? `${files.length} files selected` : files[0].name);
        setIsUploading(true);

        const readFileAsText = (file) => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => { const { data } = parseCSV(e.target.result); resolve(data); };
            reader.onerror = () => reject(file.name); reader.readAsText(file);
        });

        try {
            const allFilesData = await Promise.all(files.map(file => readFileAsText(file)));
            const combinedNewData = allFilesData.flat();
            if (combinedNewData.length === 0) { 
                setUploadError('File kosong atau format salah.'); 
            } else {
                if (uploadType === 'sales') {
                    let updatedData;
                    if (uploadMode === 'replace') { updatedData = combinedNewData; } 
                    else {
                        const existingIds = new Set(rawData.map(i => i[COL_ORDER_ID]).filter(id => id));
                        const unique = combinedNewData.filter(i => !existingIds.has(i[COL_ORDER_ID]));
                        updatedData = [...rawData, ...unique];
                    }
                    setRawData(updatedData);
                    if (user && user.id) {
                        const url = await uploadToSupabase(user.id, updatedData, 'sales_data');
                        await setDoc(doc(db, "user_datasets", user.id), { salesDataUrl: url, lastUpdated: new Date() }, { merge: true });
                    }
                } else {
                    let updatedAds;
                    if (uploadMode === 'replace') { updatedAds = combinedNewData; } else { updatedAds = [...adsData, ...combinedNewData]; }
                    setAdsData(updatedAds);
                    if (user && user.id) {
                        const url = await uploadToSupabase(user.id, updatedAds, 'ads_data');
                        await setDoc(doc(db, "user_datasets", user.id), { adsDataUrl: url, lastUpdated: new Date() }, { merge: true });
                    }
                }
                setShowUploadModal(false); 
                event.target.value = null;
                setView('summary');
            }
        } catch (error) { console.error(error); setUploadError(`Gagal upload: ${error.message || error}`); } finally { setIsUploading(false); }
    };

    const handleDeleteData = async () => {
        if(window.confirm("Apakah Anda yakin ingin menghapus SEMUA data?")) {
            setRawData([]); setAdsData([]); setShowUploadModal(false);
        }
    }

    const summaryTrendData = useMemo(() => dailyTrendAnalysis, [dailyTrendAnalysis]);

    const renderContent = () => {
        if (isLoadingFirestore || trialStatus.loading) return <div className="flex h-full items-center justify-center flex-col gap-4"><RefreshCw className="animate-spin w-10 h-10 text-indigo-600" /><p className="text-gray-500 font-medium">Menyiapkan Dashboard...</p></div>;

        switch (view) {
            case 'segmentation': return <CustomerSegmentationView data={customerSegmentationData} isDigitalMode={isDigitalMode} />;
            case 'marketing': return <MarketingAnalysisView adsData={adsData} />;
            case 'report': return <DailyReportView confirmedOrders={processedData.confirmedOrders} customerSegmentationData={customerSegmentationData} rawData={rawData} adsData={adsData} setView={setView} isDigitalMode={isDigitalMode} />;
            case 'recovery': return <RecoveryAnalysisView rawData={rawData} isDigitalMode={isDigitalMode} />;
            case 'products': return <ProductAnalysisView productData={productVariantAnalysis} />;
            case 'time': return <TimeAnalysisView rawData={rawData} />;
            case 'heatmap': return <HeatmapAnalysisView rawData={rawData} />;
            case 'billing': return <BillingView />;
            case 'tutorial': return <TutorialView />;
            case 'summary':
            default: {
                // --- LOGIC PERSIAPAN DATA SUMMARY ---
                
                // 1. Avg Basket Size
                const avgBasketSize = totalConfirmedOrders > 0 ? (totalSoldItems / totalConfirmedOrders).toFixed(1) : "0";

                // 2. Status Pesanan (Pie Chart)
                const statusCounts = {};
                rawData.forEach(item => {
                    const status = (item['order_status'] || 'Unknown').toLowerCase();
                    statusCounts[status] = (statusCounts[status] || 0) + 1;
                });
                const statusChartData = Object.entries(statusCounts)
                    .map(([name, value]) => ({ name: name.toUpperCase(), value, fill: STATUS_COLORS[name] || '#94a3b8' }))
                    .sort((a, b) => b.value - a.value);

                // 3. Pelanggan New vs Repeat (Pie Chart)
                const typeCounts = { 'NEW': 0, 'REPEAT': 0 };
                customerSegmentationData.forEach(c => {
                    if (c.frequency === 1) typeCounts['NEW'] += 1;
                    else typeCounts['REPEAT'] += 1;
                });
                const custTypeData = [
                    { name: 'New Customer', value: typeCounts['NEW'], fill: '#3B82F6' },
                    { name: 'Repeat Order', value: typeCounts['REPEAT'], fill: '#10B981' }
                ];

                return (
                    <div className="space-y-8 animate-fade-in pb-10">
                        
                        {/* --- [1. SMART ACTION ALERTS] --- */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Alert 1: Isu Pembayaran */}
                            <div className={`p-4 rounded-xl border flex items-start shadow-sm transition-all ${statusCounts['pending'] > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
                                <div className={`p-2 rounded-full mr-3 ${statusCounts['pending'] > 0 ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-800">Cek Order Pending</h4>
                                    <p className="text-xs text-gray-600 mt-1">
                                        {statusCounts['pending'] > 0 
                                            ? `Ada ${statusCounts['pending']} pesanan belum dibayar.` 
                                            : "Aman! Tidak ada tumpukan."}
                                    </p>
                                    {statusCounts['pending'] > 0 && <button onClick={() => setView('report')} className="text-[10px] font-bold text-yellow-700 mt-2 hover:underline">Lihat Detail &rarr;</button>}
                                </div>
                            </div>

                            {/* Alert 2: Basket Size */}
                            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-start shadow-sm">
                                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-full mr-3"><ShoppingBag className="w-5 h-5" /></div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-800">Rata-rata Keranjang</h4>
                                    <p className="text-xs text-gray-600 mt-1">User membeli <span className="font-bold text-indigo-700">{avgBasketSize} Item</span> / transaksi.</p>
                                    <p className="text-[10px] text-indigo-500 mt-1 italic">Tips: Buat bundling produk.</p>
                                </div>
                            </div>

                            {/* Alert 3: Top City */}
                            <div className="bg-pink-50 p-4 rounded-xl border border-pink-100 flex items-start shadow-sm">
                                <div className="p-2 bg-pink-100 text-pink-600 rounded-full mr-3"><MapPin className="w-5 h-5" /></div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-800">Fokus Area</h4>
                                    <p className="text-xs text-gray-600 mt-1">Penjualan terbanyak di:</p>
                                    <p className="text-sm font-bold text-pink-700 mt-0.5">{topLocationLists && topLocationLists.cities && topLocationLists.cities.length > 0 ? topLocationLists.cities[0].name : "Belum ada data"}</p>
                                </div>
                            </div>
                        </div>

                        {/* --- [2. KPI CARDS (FINANCIAL & MARKETING)] --- */}
                        <div className="flex flex-col xl:flex-row gap-6">
                            <div className="flex-1 bg-white p-5 rounded-xl shadow-md border border-gray-100">
                                <h3 className="text-sm font-bold text-gray-700 flex items-center mb-4"><DollarSign className="w-4 h-4 mr-2 text-green-600" />Kesehatan Bisnis</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <StatCard compact title="Total Pendapatan" value={formatRupiah(totalConfirmedRevenue)} icon={TrendingUp} color="#6366f1" />
                                    <StatCard compact title="Est. Net Profit" value={formatRupiah(totalGrossProfit)} icon={Coins} color="#10b981" />
                                    <StatCard compact title="Total Ad Spend" value={formatRupiah(summaryMetrics.totalAdSpend)} icon={Wallet} color="#ef4444" />
                                    <StatCard compact title="Real Net Profit" value={formatRupiah(summaryMetrics.realNetProfit)} icon={DollarSign} color="#10b981" />
                                </div>
                            </div>
                            <div className="flex-1 bg-white p-5 rounded-xl shadow-md border border-gray-100">
                                <h3 className="text-sm font-bold text-gray-700 flex items-center mb-4"><Activity className="w-4 h-4 mr-2 text-blue-600" />Efisiensi Marketing</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <StatCard compact title="ROAS (Paid Only)" value={summaryMetrics.roas.toFixed(2) + "x"} icon={Award} color={summaryMetrics.roas > 2 ? "#10b981" : "#f59e0b"} description="Efisiensi Iklan Murni" />
                                    <StatCard compact title="MER (Blended)" value={summaryMetrics.mer.toFixed(2) + "x"} icon={Percent} color="#8b5cf6" description="Total Omzet / Ad Spend" />
                                    <StatCard compact title="CPR" value={formatRupiah(summaryMetrics.cpr)} icon={Target} color="#f59e0b" />
                                    <StatCard compact title="AOV" value={formatRupiah(summaryMetrics.aov)} icon={ShoppingBag} color="#06b6d4" />
                                </div>
                            </div>
                        </div>

                        {/* --- [3. VOLUME TRANSAKSI] --- */}
                        <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100">
                            <h3 className="text-sm font-bold text-gray-700 flex items-center mb-4"><ShoppingBag className="w-4 h-4 mr-2 text-purple-600" />Volume Transaksi</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatCard compact title="Total Semua Pesanan" value={summaryMetrics.totalAllOrders} unit="Order" icon={ShoppingBag} color="#6366f1" description="Termasuk Pending/Batal" />
                                <StatCard compact title="Transaksi Valid" value={totalConfirmedOrders} unit="Trx" icon={CheckCircle} color="#8b5cf6" />
                                <StatCard compact title="Closing Rate" value={summaryMetrics.closingRate.toFixed(2) + "%"} unit="Rate" icon={Grid3X3} color="#ec4899" />
                                <StatCard compact title="Total Pelanggan" value={customerSegmentationData.length} unit="Org" icon={Users} color="#3b82f6" />
                            </div>
                        </div>

                        {/* --- [4. OPERASIONAL & PRODUK] --- */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Chart Status */}
                            <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100 flex flex-col">
                                <h3 className="text-sm font-bold text-gray-700 flex items-center mb-2"><List className="w-4 h-4 mr-2 text-orange-500" />Distribusi Status Pesanan</h3>
                                <div className="flex-1 min-h-[200px]">
                                    <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={statusChartData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">{statusChartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}</Pie><Tooltip /><Legend verticalAlign="bottom" height={36} iconSize={8} wrapperStyle={{fontSize:'10px'}}/></PieChart></ResponsiveContainer>
                                </div>
                            </div>

                            {/* Chart New vs Repeat */}
                            <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100 flex flex-col">
                                <h3 className="text-sm font-bold text-gray-700 flex items-center mb-2"><Users className="w-4 h-4 mr-2 text-blue-500" />Pelanggan Baru vs Lama</h3>
                                <div className="flex-1 min-h-[200px] flex items-center justify-center">
                                     <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={custTypeData} cx="50%" cy="50%" outerRadius={60} dataKey="value" label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                                                {custTypeData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend verticalAlign="bottom" iconSize={8} wrapperStyle={{fontSize:'10px'}}/>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Top 5 Products List */}
                            <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100 flex flex-col">
                                <h3 className="text-sm font-bold text-gray-700 flex items-center mb-4"><Award className="w-4 h-4 mr-2 text-purple-500" />Top 5 Produk (Volume)</h3>
                                <div className="flex-1 overflow-y-auto">
                                    {productVariantAnalysis.slice(0, 5).map((prod, idx) => (
                                        <div key={idx} className="flex justify-between items-center mb-3 text-xs border-b border-gray-50 pb-2 last:border-0">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold text-white flex-shrink-0 ${idx === 0 ? 'bg-yellow-400' : 'bg-gray-300'}`}>#{idx+1}</span>
                                                <span className="truncate font-medium text-gray-700 max-w-[120px]" title={prod.name}>{prod.name}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="block font-bold text-indigo-600">{prod.totalQuantity} Pcs</span>
                                                <span className="block text-[9px] text-gray-400">{formatRupiah(prod.totalRevenue)}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {productVariantAnalysis.length === 0 && <p className="text-xs text-gray-400 text-center mt-10">Belum ada data produk.</p>}
                                </div>
                            </div>
                        </div>

                    </div>
                );
            }
        }
    };

    const isContentFrozen = false;

   return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
        
        {/* 1. MOBILE OVERLAY */}
        {isMobileMenuOpen && (
            <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity"
                onClick={() => setIsMobileMenuOpen(false)}
            ></div>
        )}

        {/* Notifikasi Expired */}
        {trialStatus.expired && <ExpiredNotification />}

        {/* 2. SIDEBAR (SUDAH DIPERBAIKI: Hapus 'hidden', Tambah 'flex flex-col') */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-indigo-100 shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            
            <div className="p-6 border-b border-gray-100">
                <AppLogo />
            </div>

            {/* BAGIAN SIDEBAR STATUS AKUN */}
{!trialStatus.loading && (
    <div className={`mx-4 mt-4 p-4 rounded-xl text-white shadow-lg transition-colors duration-300 
        ${trialStatus.mode === 'subscription' ? 'bg-emerald-600' : 'bg-slate-700'}`}>
        
        {/* Header Status */}
        <div className="flex items-center justify-between mb-3">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${trialStatus.mode === 'subscription' ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-900 text-slate-300'}`}>
                {trialStatus.mode === 'subscription' ? 'PREMIUM' : 'BASIC PLAN'}
            </span>
            {trialStatus.mode === 'subscription' ? <CheckCircle className="w-4 h-4 text-emerald-200"/> : <User className="w-4 h-4 text-slate-400" />}
        </div>

        {/* Info Detail */}
        <div>
            <p className="text-lg font-bold">
                {trialStatus.mode === 'subscription' ? 'Member Aktif' : 'Akun Gratis'}
            </p>
            <p className="text-xs opacity-80 mt-1 leading-relaxed">
                {trialStatus.mode === 'subscription' 
                    ? 'Akses penuh ke semua fitur.' 
                    : 'Upgrade ke Premium untuk fitur lebih lengkap.'}
            </p>
        </div>

        {/* Tombol Upgrade (Hanya muncul jika belum Premium) */}
        {trialStatus.mode !== 'subscription' && (
            <button 
                onClick={() => setView('billing')}
                className="w-full mt-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1"
            >
                <Sparkles className="w-3 h-3" />
                Upgrade Pro
            </button>
        )}
    </div>
)}
            
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-2">Overview</p>
                <NavButton id="summary" name="Ringkasan Utama" view={view} setView={setView} icon={LayoutDashboard} disabled={trialStatus.expired} onClick={() => setIsMobileMenuOpen(false)} />
                <NavButton id="report" name="Laporan Harian" view={view} setView={setView} icon={List} disabled={trialStatus.expired} onClick={() => setIsMobileMenuOpen(false)} />
                <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-6">Analisis</p>
                <NavButton id="marketing" name="Analisis Marketing" view={view} setView={setView} icon={Megaphone} disabled={trialStatus.expired} onClick={() => setIsMobileMenuOpen(false)} />
                <NavButton id="segmentation" name="Segmen Pelanggan" view={view} setView={setView} icon={Users} disabled={trialStatus.expired} onClick={() => setIsMobileMenuOpen(false)} />
                <NavButton id="products" name="Analisis Produk" view={view} setView={setView} icon={Boxes} disabled={trialStatus.expired} onClick={() => setIsMobileMenuOpen(false)} />
                <NavButton id="time" name="Tren Waktu" view={view} setView={setView} icon={History} disabled={trialStatus.expired} onClick={() => setIsMobileMenuOpen(false)} />
                <NavButton id="heatmap" name="Heatmap Jam" view={view} setView={setView} icon={Grid3X3} disabled={trialStatus.expired} onClick={() => setIsMobileMenuOpen(false)} />
                <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-6">Action</p>
                <NavButton id="recovery" name="Recovery & Isu" view={view} setView={setView} icon={AlertTriangle} disabled={trialStatus.expired} onClick={() => setIsMobileMenuOpen(false)} />
                <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-6">Akun & Langganan</p>
                <NavButton id="billing" name="Billing / Paket" view={view} setView={setView} icon={CreditCard} disabled={false} onClick={() => setIsMobileMenuOpen(false)} />
                <NavButton id="tutorial" name="Panduan / Tutorial" view={view} setView={setView} icon={BookOpen} disabled={trialStatus.expired} onClick={() => setIsMobileMenuOpen(false)} />
            </nav>
            
            <div className="p-4 border-t border-gray-200">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                    <UserButton />
                    <div className="flex flex-col overflow-hidden"><span className="text-xs font-bold text-gray-700 truncate">{user?.fullName || 'User'}</span><span className="text-[10px] text-gray-500">{trialStatus.mode === 'subscription' && !trialStatus.expired ? 'Premium' : 'Free Tier'}</span></div>
                </div>
            </div>
        </aside>

        {/* 3. KONTEN UTAMA */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
            
            <header className="bg-white border-b border-gray-200 py-3 px-4 flex items-center justify-between shadow-sm z-20">
                <div className="flex items-center gap-3 lg:hidden">
                    <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                        <Menu className="w-6 h-6" />
                    </button>
                    <h2 className="text-sm font-bold text-gray-800 capitalize">{view.replace('_', ' ')} Dashboard</h2>
                </div>
                <h2 className="hidden lg:block text-lg font-bold text-gray-800 capitalize">{view.replace('_', ' ')} Dashboard</h2>
                
                <div className="flex items-center space-x-3">
                    <button onClick={() => !trialStatus.expired && setShowUploadModal(true)} disabled={trialStatus.expired} className={`flex items-center px-4 py-2 rounded-lg transition shadow-sm text-sm font-bold ${trialStatus.expired ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                        {trialStatus.expired ? <Lock className="w-4 h-4 mr-2"/> : <Upload className="w-4 h-4 mr-2" />} Unggah Data
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50 relative">
                {isContentFrozen && (
                    <div className="absolute inset-0 z-40 bg-gray-100/50 backdrop-grayscale cursor-not-allowed flex flex-col items-center justify-center">
                        <div className="bg-white/90 p-6 rounded-full shadow-2xl backdrop-blur-sm animate-bounce"><Lock className="w-12 h-12 text-red-600" /></div>
                        <p className="mt-4 font-bold text-red-700 bg-white/80 px-4 py-2 rounded-lg shadow-sm backdrop-blur-md">Mode Terkunci. Silakan ke menu Billing.</p>
                    </div>
                )}
                
                {/* SUDAH DIPERBAIKI: Tambah w-full agar Recharts tidak error */}
                <div className="max-w-7xl mx-auto w-full">
                    <div className={isContentFrozen ? "pointer-events-none select-none filter blur-[2px]" : ""}>{renderContent()}</div>
                </div>
            </main>
        </div>

        {/* 4. MODAL UPLOAD */}
        {showUploadModal && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                 <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-down">
                    <div className="p-6 pb-2">
                        <h3 className="text-xl font-bold text-indigo-700 flex items-center gap-2"><Upload className="w-6 h-6" /> Unggah Data CSV</h3>
                    </div>
                    <div className="p-6 pt-2 space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-800 mb-2">Jenis File Data:</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => setUploadType('sales')} className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${uploadType === 'sales' ? 'border-2 border-indigo-500 bg-indigo-50 text-indigo-700' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                    <ShoppingBag className="w-6 h-6 mb-2" />
                                    <span className="text-xs font-bold text-center">Data Penjualan (CRM/Order)</span>
                                </button>
                                <button onClick={() => setUploadType('ads')} className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${uploadType === 'ads' ? 'border-2 border-indigo-500 bg-indigo-50 text-indigo-700' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                    <Megaphone className="w-6 h-6 mb-2" />
                                    <span className="text-xs font-bold text-center">Data Iklan (Meta Ads)</span>
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">MODE UPLOAD:</label>
                            <div className="flex flex-col gap-3">
                                <div onClick={() => setUploadMode('merge')} className={`flex items-start p-3 rounded-lg border cursor-pointer transition-all ${uploadMode === 'merge' ? 'border-green-500 ring-1 ring-green-500 bg-white' : 'border-gray-200 hover:bg-gray-50'}`}>
                                    <div className="flex items-center h-5"><input type="radio" checked={uploadMode === 'merge'} onChange={() => setUploadMode('merge')} className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"/></div>
                                    <div className="ml-3"><span className="block text-sm font-bold text-gray-900 flex items-center gap-1"><PlusCircle className="w-4 h-4 text-green-600" /> Gabungkan Data Baru</span><span className="block text-xs text-gray-500">Tambahkan ke data yang sudah ada.</span></div>
                                </div>
                                <div onClick={() => setUploadMode('replace')} className={`flex items-start p-3 rounded-lg border cursor-pointer transition-all ${uploadMode === 'replace' ? 'border-red-500 ring-1 ring-red-500 bg-white' : 'border-gray-200 hover:bg-gray-50'}`}>
                                    <div className="flex items-center h-5"><input type="radio" checked={uploadMode === 'replace'} onChange={() => setUploadMode('replace')} className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"/></div>
                                    <div className="ml-3"><span className="block text-sm font-bold text-gray-900 flex items-center gap-1"><Trash2 className="w-4 h-4 text-red-600" /> Ganti Semua Data Lama</span><span className="block text-xs text-gray-500">Hapus data lama & ganti baru.</span></div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <label className="cursor-pointer bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold py-2 px-4 rounded-lg text-sm transition-colors shadow-sm border border-indigo-100">
                                    Choose Files
                                    <input type="file" className="hidden" accept=".csv" multiple onChange={handleFileUpload} disabled={isUploading} />
                                </label>
                                <span className="text-sm text-gray-500 truncate max-w-[200px]">{isUploading ? "Memproses..." : fileNameDisplay}</span>
                            </div>
                            {uploadError && (<div className="mb-4 p-2 bg-red-50 text-red-600 text-xs rounded border border-red-200 flex items-center"><AlertTriangle className="w-4 h-4 mr-2" /> {uploadError}</div>)}
                            <div className="space-y-3">
                                <button onClick={() => setShowUploadModal(false)} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-lg text-sm transition-colors">Batal</button>
                                <div className="border-t border-gray-100 pt-3">
                                    <button onClick={handleDeleteData} className="w-full bg-red-100 hover:bg-red-200 text-red-700 font-bold py-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"><Trash2 className="w-4 h-4" /> Hapus SEMUA Data</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
);
}

// --- BAGIAN INI DITAMBAHKAN DI PALING BAWAH FILE (PENGGANTI EXPORT LAMA) ---

function App() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      
      {/* KONDISI 1: KALAU BELUM LOGIN -> TAMPILKAN TOMBOL LOGIN */}
      <SignedOut>
        <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-indigo-900 to-slate-900 text-white">
          <div className="text-center space-y-6 p-8 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl max-w-md w-full mx-4">
            <div className="flex justify-center mb-4">
               {/* Ikon Gembok Sederhana */}
               <div className="p-4 bg-indigo-600 rounded-full shadow-lg">
                 <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lock"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
               </div>
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight mb-2">CRMAuto <span className="text-indigo-400">Pro</span></h1>
              <p className="text-gray-300 text-sm">Silakan login untuk mengakses Dashboard Intelligence.</p>
            </div>
            
            <div className="pt-2">
              <SignInButton mode="modal">
                <button className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-indigo-500/30 flex items-center justify-center gap-2">
                  Masuk Sekarang
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>
                </button>
              </SignInButton>
            </div>
            <p className="text-xs text-gray-500 mt-4">Protected by Clerk Authentication</p>
          </div>
        </div>
      </SignedOut>

      {/* KONDISI 2: KALAU SUDAH LOGIN -> TAMPILKAN DASHBOARD */}
      <SignedIn>
        {/* Tombol UserButton di kanan atas SUDAH DIHAPUS */}
        
        {/* Panggil Komponen Dashboard Aslimu */}
        <DashboardCRM /> 
      </SignedIn>

    </div>
  );
}

export default App;