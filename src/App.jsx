import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';

import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, Sector, ComposedChart, AreaChart, Area, ScatterChart, Scatter, LabelList } from 'recharts';

import { TrendingUp, MapPin, LayoutDashboard, AlertTriangle, CheckCircle, Upload, Users, DollarSign, List, Globe, Boxes, Award, Calendar, Layers, PlusCircle, Trash2, GitCommit, Target, Filter, Download, Clock, Repeat, MessageSquare, Copy, Info, History, CreditCard, UserCheck, Landmark, Grid3X3, Truck, HelpCircle, FileText, XCircle, Zap, Wallet, ShoppingBag, Activity, PieChart as PieChartIcon, Package, Search, RefreshCw, ArrowRight, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Check, TrendingDown, ClipboardCopy, Megaphone, MousePointer, Eye, Percent, Coins, Star, BookOpen, UserPlus, Heart, Share2, Shield, Gift, Smile, Settings, Save, RotateCcw } from 'lucide-react'; 





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



// --- COMPONENT: CUSTOM LOGO ---

const AppLogo = () => (

    <div className="flex items-center gap-3 select-none">

        <div className="relative flex items-center justify-center w-12 h-12 bg-indigo-700 rounded-xl shadow-lg border border-indigo-500 overflow-hidden">

            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-indigo-800"></div>

            <svg viewBox="0 0 24 24" className="w-8 h-8 text-white relative z-10 fill-current" style={{ transform: 'rotate(-90deg)' }}>

                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="40" strokeDashoffset="10" strokeLinecap="round" />

            </svg>

        </div>

        <div className="flex flex-col justify-center h-12">

            <h1 className="text-3xl font-black text-gray-900 tracking-tighter leading-none" style={{ fontFamily: 'Inter, sans-serif' }}>

                CRM<span className="text-indigo-700">Auto</span>

            </h1>

            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] leading-tight ml-0.5 mt-0.5">

                Intelligence

            </span>

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

    { name: "Champions", color: "bg-purple-600", hexColor: "#9333ea", text: "text-purple-800", desc: "Baru saja belanja, sering belanja, dan keluar uang banyak. (R4-5, F4-5, M4-5)" },

    { name: "Loyal Customers", color: "bg-indigo-500", hexColor: "#6366f1", text: "text-indigo-800", desc: "Sering belanja, meski transaksi terakhir tidak sebaru Champions. (R3-4, F4-5, M3-5)" },

    { name: "Potential Loyalist", color: "bg-blue-500", hexColor: "#3b82f6", text: "text-blue-800", desc: "Baru belanja, frekuensi rata-rata. Potensi besar jadi Loyal. (R3-5, F2-3, M2-4)" },

    { name: "New Customers", color: "bg-green-500", hexColor: "#22c55e", text: "text-green-800", desc: "Skor Recency sangat tinggi, tapi Frekuensi paling rendah (baru sekali). (R4-5, F1)" },

    { name: "Promising", color: "bg-teal-500", hexColor: "#14b8a6", text: "text-teal-800", desc: "Belanja lumayan baru, tapi belum sering kembali. (R3-4, F1, M1-3)" },

    { name: "Need Attention", color: "bg-yellow-500", hexColor: "#eab308", text: "text-yellow-800", desc: "Skor R, F, M semuanya 'nanggung' (rata-rata). Rentan lupa brand Anda. (R3, F3, M2-3)" },

    { name: "About To Sleep", color: "bg-orange-400", hexColor: "#fb923c", text: "text-orange-800", desc: "Recency di bawah rata-rata dan jarang belanja. Hampir hilang. (R2-3, F1-2, M1-3)" },

    { name: "At Risk", color: "bg-red-600", hexColor: "#dc2626", text: "text-red-800", desc: "PENTING: Dulu sering belanja (F tinggi), tapi sudah lama hilang (R rendah). Harus ditarik kembali! (R1-2, F3-5, M3-5)" },

    { name: "Hibernating", color: "bg-gray-400", hexColor: "#9ca3af", text: "text-gray-800", desc: "Sudah lama tidak belanja, dan dulunya pun jarang belanja. (R1-2, F1-2, M1-2)" },

    { name: "Lost", color: "bg-gray-600", hexColor: "#4b5563", text: "text-gray-200", desc: "Skor terendah di semua lini. (R1, F1, M1)" }

];



// --- STRATEGI PLAYBOOK PER SEGMEN ---

const SEGMENT_PLAYBOOKS = {

    "Champions": {

        focus: "Rewards & Advokasi",

        action: "Berikan perlakuan VIP. Ajak mereka menjadi Brand Ambassador atau berikan akses 'Early Bird' untuk produk baru.",

        chat: "Halo Kak {name} 👋! Terima kasih sudah jadi pelanggan setia kami. Sebagai apresiasi VIP, kami berikan voucher diskon spesial 20% tanpa minimum belanja: VIP20. Ditunggu ordernya ya Kak! 😊"

    },

    "Loyal Customers": {

        focus: "Upsell & Cross-sell",

        action: "Tawarkan produk bundling atau varian premium. Fokus meningkatkan nilai belanja (AOV) karena mereka sudah percaya.",

        chat: "Halo Kak {name}! Kami lihat Kakak suka produk kami. Kebetulan ada paket bundling hemat nih, cocok banget buat stok bulanan. Cek di sini ya 👉 [Link]"

    },

    "Potential Loyalist": {

        focus: "Lock-in & Habit",

        action: "Tawarkan membership atau kupon diskon untuk pembelian berikutnya agar mereka terbiasa belanja rutin.",

        chat: "Hi Kak {name}, puas dengan pesanan kemarin? Kami ada voucher diskon 10% khusus buat order kedua Kakak nih. Yuk dipakai sebelum hangus! 🎁"

    },

    "New Customers": {

        focus: "Onboarding & Edukasi",

        action: "Pastikan mereka puas dengan produk pertama. Kirim panduan pemakaian dan sapaan ramah.",

        chat: "Halo Kak {name}, selamat datang! Terima kasih sudah belanja. Kalau ada bingung cara pakainya, boleh langsung tanya kami di sini ya. Happy shopping! ✨"

    },

    "Promising": {

        focus: "Nurturing & Reminder",

        action: "Kirim konten soft-selling tentang keunggulan produk. Berikan diskon waktu terbatas (Flash Sale personal).",

        chat: "Halo Kak {name}, produk yang Kakak lirik kemarin lagi banyak yang cari lho. Yuk amankan stoknya sekarang sebelum kehabisan! 😉"

    },

    "Need Attention": {

        focus: "Reaktivasi Ringan",

        action: "Tanyakan feedback/kepuasan pemakaian. Tawarkan produk pelengkap yang cocok dipadukan.",

        chat: "Halo Kak {name}, gimana kabarnya? Kami mau tanya feedback soal produk kemarin, ada kendala nggak? Btw, produk ini cocok lho dipadukan sama [Produk B]."

    },

    "About To Sleep": {

        focus: "Win-Back Soft",

        action: "Sapa ramah 'Kami rindu Kakak'. Ingatkan manfaat produk dan tawarkan diskon kecil.",

        chat: "Halo Kak {name}, udah lama nih nggak mampir. Kami kangen! 👋 Ada koleksi baru yang mungkin Kakak suka. Intip yuk!"

    },

    "At Risk": {

        focus: "Win-Back Agresif",

        action: "Hubungi personal. Beri diskon besar atau Gift menarik untuk menarik mereka kembali sebelum hilang total.",

        chat: "Halo Kak {name}! Khusus hari ini kami ada Gift Spesial 🎁 gratis buat Kakak kalau belanja lagi. Sayang banget kalau dilewatkan. Mau kami simpankan?"

    },

    "Hibernating": {

        focus: "Re-introduce",

        action: "Kenalkan brand seolah baru dengan menonjolkan produk Best Seller saat ini. Gunakan momen seasonal (Gajian/Promo).",

        chat: "Halo Kak {name}, lama tak jumpa! 👋 Kami punya produk Best Seller baru yang lagi viral nih. Cek katalog kami ya, ada harga spesial buat Kakak."

    },

    "Lost": {

        focus: "Low Priority / Automasi",

        action: "Masukkan ke daftar broadcast promo cuci gudang. Jangan habiskan waktu personal di sini.",

        chat: "Halo Kak {name}, kami lagi ada Cuci Gudang diskon s.d 70%! Siapa tau ada yang Kakak butuhkan. Cek di sini ya: [Link]"

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



const useProcessedData = (rawData) => {

    return useMemo(() => {

        if (rawData.length === 0) return { 

            utmChartAnalysis: [], utmSourceAnalysis: [], provinceAnalysis: [], uniqueCustomerList: [], geoRevenueChart: [], productVariantAnalysis: [], top3Products: [], customerSegmentationData: [], rawData: [], uniqueDates: { years: [], months: [], days: [] }, totalConfirmedRevenue: 0, totalConfirmedOrders: 0, timeAnalysis: { yearly: [], quarterly: [], monthly: [] }, paymentMethodAnalysis: [], customerTypeAnalysis: [], financialEntityAnalysis: [], courierAnalysis: [], rawTimeData: [], heatmapData: [], heatmapMaxRevenue: 0, dailyTrendAnalysis: [], confirmedOrders: [], totalGrossProfit: 0, topLocationLists: { provinces: [], cities: [], subdistricts: [] }

        };



        const isConfirmed = (item) => !!item[COL_CONFIRMED_TIME] && item[COL_CONFIRMED_TIME].toString().trim() !== '';

        const filteredData = rawData.filter(isConfirmed); 

        const totalConfirmedRevenue = filteredData.reduce((sum, item) => sum + (item[COL_NET_REVENUE] || 0), 0);

        const totalConfirmedOrders = filteredData.length;

        

        let totalGrossProfit = 0;

        filteredData.forEach(item => {

            const grossRev = item[COL_GROSS_REVENUE] || 0; 

            const prodDisc = item[COL_PRODUCT_DISCOUNT] || 0; 

            const shipDisc = item[COL_SHIPPING_DISCOUNT] || 0; 

            const cogs = item[COL_COGS] || 0; 

            const payFee = item[COL_PAYMENT_FEE] || 0; 

            const shipCost = item[COL_SHIPPING_COST] || 0;

            totalGrossProfit += (grossRev - prodDisc - shipDisc) - cogs - payFee - shipCost;

        });



        const yearlyStats = {};

        const quarterlyStats = { 'Q1': 0, 'Q2': 0, 'Q3': 0, 'Q4': 0 };

        const monthlyStats = Array(12).fill(0);

        const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

        const dailyTrendStats = Array(31).fill(null).map((_, i) => ({ day: i + 1, revenue: 0, transactions: 0 }));



        filteredData.forEach(item => {

            const confirmedTimeStr = item[COL_CONFIRMED_TIME];

            const revenue = item[COL_NET_REVENUE] || 0;

            if (confirmedTimeStr) {

                const dateParts = extractDateParts(confirmedTimeStr);

                if (dateParts) {

                    const year = dateParts.year;

                    const monthIndex = parseInt(dateParts.month, 10) - 1;

                    const dayIndex = parseInt(dateParts.day, 10) - 1;

                    yearlyStats[year] = (yearlyStats[year] || 0) + revenue;

                    if (monthIndex >= 0 && monthIndex < 12) {

                        monthlyStats[monthIndex] += revenue;

                        let quarter = monthIndex <= 2 ? 'Q1' : monthIndex <= 5 ? 'Q2' : monthIndex <= 8 ? 'Q3' : 'Q4';

                        quarterlyStats[quarter] += revenue;

                    }

                    if (dayIndex >= 0 && dayIndex < 31) { dailyTrendStats[dayIndex].revenue += revenue; dailyTrendStats[dayIndex].transactions += 1; }

                }

            }

        });



        const timeAnalysis = {

            yearly: Object.entries(yearlyStats).map(([year, revenue]) => ({ name: year, revenue })).sort((a, b) => a.name.localeCompare(b.name)),

            quarterly: Object.entries(quarterlyStats).map(([name, revenue]) => ({ name, revenue })),

            monthly: monthlyStats.map((revenue, index) => ({ name: monthNames[index], revenue }))

        };



        const uniqueYears = new Set();

        const uniqueMonths = new Set();

        const uniqueDays = new Set();

        

        filteredData.forEach(item => {

            const confirmedTimeStr = item[COL_CONFIRMED_TIME];

            const dateParts = extractDateParts(confirmedTimeStr);

            if (dateParts) { uniqueYears.add(dateParts.year); uniqueMonths.add(dateParts.month); uniqueDays.add(dateParts.day); }

        });



        const uniqueDates = { years: Array.from(uniqueYears).sort(), months: Array.from(uniqueMonths).sort(), days: Array.from(uniqueDays).sort() };

        const heatmapGrid = Array(31).fill(null).map(() => Array(24).fill(0));

        let heatmapMaxRevenue = 0;



        filteredData.forEach(item => {

            const confirmedTimeStr = item[COL_CONFIRMED_TIME];

            const revenue = item[COL_NET_REVENUE] || 0;

            if (confirmedTimeStr) {

                const dateObj = new Date(confirmedTimeStr.replace(' ', 'T'));

                if (!isNaN(dateObj.getTime())) {

                    const day = dateObj.getDate();

                    const hour = dateObj.getHours();

                    if (day >= 1 && day <= 31 && hour >= 0 && hour <= 23) {

                        const dayIndex = day - 1;

                        heatmapGrid[dayIndex][hour] += revenue;

                        if (heatmapGrid[dayIndex][hour] > heatmapMaxRevenue) heatmapMaxRevenue = heatmapGrid[dayIndex][hour];

                    }

                }

            }

        });



        const referenceDate = new Date();

        referenceDate.setHours(0, 0, 0, 0); 

        const customerRFM = {};

        

        filteredData.forEach(item => {

            const name = item[COL_NAME];

            const revenue = item[COL_NET_REVENUE] || 0;

            const confirmedTimeStr = item[COL_CONFIRMED_TIME];

            

            const productsInThisOrder = [];

            Object.keys(item).forEach(key => {

                const qty = parseFloat(item[key]);

                if (key.startsWith('variant:') && !isNaN(qty) && qty > 0) {

                    productsInThisOrder.push({

                        name: key.replace('variant:', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),

                        qty: qty

                    });

                }

            });

            const boughtProduct = productsInThisOrder.length > 0 ? productsInThisOrder[0].name : null; 



            if (name) {

                if (!customerRFM[name]) {

                    customerRFM[name] = { 

                        lastOrderDate: null, 

                        frequency: 0, 

                        monetary: 0, 

                        phone: item[COL_PHONE] || '-', 

                        address: item[COL_ADDRESS] || '-', 

                        province: item[COL_PROVINCE] || '-', 

                        city: item[COL_CITY] || '-', 

                        subdistrict: item[COL_SUBDISTRICT] || '-', 

                        lastProduct: boughtProduct,

                        productMap: {} 

                    };

                }

                customerRFM[name].frequency += 1;

                customerRFM[name].monetary += revenue;

                

                productsInThisOrder.forEach(p => {

                    if (!customerRFM[name].productMap[p.name]) {

                        customerRFM[name].productMap[p.name] = 0;

                    }

                    customerRFM[name].productMap[p.name] += p.qty;

                });



                if (confirmedTimeStr) {

                    const currentConfirmedDate = new Date(confirmedTimeStr.replace(' ', 'T'));

                    if (!customerRFM[name].lastOrderDate || currentConfirmedDate > customerRFM[name].lastOrderDate) { 

                        customerRFM[name].lastOrderDate = currentConfirmedDate; 

                        if (boughtProduct) customerRFM[name].lastProduct = boughtProduct;

                    }

                }

            }

        });

        

        let rfmData = Object.entries(customerRFM).map(([name, data]) => {

            const recencyDays = data.lastOrderDate ? Math.floor((referenceDate - data.lastOrderDate) / (1000 * 60 * 60 * 24)) : 999;

            return { 

                name, 

                recency: recencyDays, 

                frequency: data.frequency, 

                monetary: data.monetary, 

                ...data

            };

        }).filter(c => c.frequency > 0); 



        if (rfmData.length === 0) {

             return { utmChartAnalysis: [], utmSourceAnalysis: [], provinceAnalysis: [], uniqueCustomerList: [], geoRevenueChart: [], productVariantAnalysis: [], top3Products: [], customerSegmentationData: [], rawData, uniqueDates, totalConfirmedRevenue: 0, totalConfirmedOrders: 0, timeAnalysis: { yearly: [], quarterly: [], monthly: [] }, paymentMethodAnalysis: [], customerTypeAnalysis: [], financialEntityAnalysis: [], courierAnalysis: [], rawTimeData: [], heatmapData: [], heatmapMaxRevenue: 0, dailyTrendAnalysis: [], confirmedOrders: [], totalGrossProfit: 0, topLocationLists: { provinces: [], cities: [], subdistricts: [] } };

        }

        

        const numScores = 5;

        const getScores = (data, field, reverse = false) => {

            const sortedValues = [...new Set(data.map(d => d[field]))].sort((a, b) => a - b);

            const scores = {};

            const step = Math.ceil(sortedValues.length / numScores);

            sortedValues.forEach((value, i) => {

                let score = Math.min(numScores, Math.floor(i / step) + 1);

                if (reverse) score = numScores - score + 1;

                scores[value] = score;

            });

            return scores;

        };



        const R_Scores = getScores(rfmData, 'recency', true);

        const F_Scores = getScores(rfmData, 'frequency', false);

        const M_Scores = getScores(rfmData, 'monetary', false);

        

        let customerSegmentationData = rfmData.map(customer => {

            const R_Score = R_Scores[customer.recency] || 1;

            const F_Score = F_Scores[customer.frequency] || 1;

            const M_Score = M_Scores[customer.monetary] || 1;

            return { ...customer, R_Score, F_Score, M_Score, RFM_Score: `${R_Score}${F_Score}${M_Score}` };

        }).sort((a, b) => (b.R_Score + b.F_Score + b.M_Score) - (a.R_Score + a.F_Score + a.M_Score));

        

        const finalCustomerSegmentationData = customerSegmentationData.map((customer) => {

            const segmentName = assignRFMSegment(customer.R_Score, customer.F_Score, customer.M_Score);

            const segmentInfo = TARGET_SEGMENTS_10.find(s => s.name === segmentName) || TARGET_SEGMENTS_10[TARGET_SEGMENTS_10.length - 1];



            return {

                ...customer, 

                Segment10Name: segmentInfo.name, 

                Segment10Color: segmentInfo.color,

                Segment10Hex: segmentInfo.hexColor, 

                Segment10Desc: segmentInfo.desc, 

                Segment10Text: segmentInfo.text

            };

        });

        

        const allVariantKeys = new Set();

        rawData.forEach(order => { Object.keys(order).forEach(key => { if (key.startsWith('variant:')) allVariantKeys.add(key); }); });

        const variantColumns = Array.from(allVariantKeys).map(normalizedKey => ({ rawName: normalizedKey.replace('variant:', '').replace(/_/g, ' ').toUpperCase(), normalized: normalizedKey }));

            

        const variantStats = {};

        filteredData.forEach(item => { 

            let totalItemsInOrder = 0;

            variantColumns.forEach(({ normalized }) => { const qty = parseFloat(item[normalized] || 0); if (!isNaN(qty) && qty > 0) totalItemsInOrder += qty; });

            const orderRevenue = item[COL_NET_REVENUE] || 0;

            variantColumns.forEach(({ rawName, normalized }) => {

                const quantity = parseFloat(item[normalized] || 0);

                if (!isNaN(quantity) && quantity > 0) {

                    if (!variantStats[rawName]) variantStats[rawName] = { name: rawName, totalQuantity: 0, totalOrders: 0, totalRevenue: 0 };

                    variantStats[rawName].totalQuantity += quantity; 

                    variantStats[rawName].totalOrders += 1;

                    const weightedRevenue = totalItemsInOrder > 0 ? (quantity / totalItemsInOrder) * orderRevenue : 0;

                    variantStats[rawName].totalRevenue += weightedRevenue; 

                }

            });

        });



        const productVariantAnalysis = Object.values(variantStats).sort((a, b) => b.totalQuantity - a.totalQuantity);

        const top3Products = productVariantAnalysis.slice(0, 3);



        const utmChartStats = {};

        const utmSourceStats = {};

        

        rawData.forEach(item => {

             const source = item[COL_UTM_SOURCE] || 'Unknown';

             const medium = item[COL_UTM_MEDIUM] || 'Unknown';

             const revenue = item[COL_NET_REVENUE] || 0;

             const key = `${source}-${medium}`;

             if (!utmChartStats[key]) utmChartStats[key] = { source, medium, totalRevenue: 0, confirmedOrders: 0, totalOrders: 0 };

             utmChartStats[key].totalOrders += 1; 

             if (isConfirmed(item)) { utmChartStats[key].confirmedOrders += 1; utmChartStats[key].totalRevenue += revenue; }

        });

        const utmChartAnalysis = Object.values(utmChartStats).map(stat => ({...stat, confirmationRate: stat.totalOrders > 0 ? (stat.confirmedOrders / stat.totalOrders) * 100 : 0})).sort((a, b) => b.totalRevenue - a.totalRevenue);



        rawData.forEach(item => {

            const source = item[COL_UTM_SOURCE] || 'Unknown Source';

            const customerName = item[COL_NAME];

            if (!utmSourceStats[source]) utmSourceStats[source] = { totalOrders: 0, uniqueConfirmedCustomers: new Set(), confirmedOrders: 0 };

            utmSourceStats[source].totalOrders += 1;

            if (isConfirmed(item)) {

                utmSourceStats[source].confirmedOrders += 1;

                if (customerName) utmSourceStats[source].uniqueConfirmedCustomers.add(customerName);

            }

        });

        const utmSourceAnalysis = Object.entries(utmSourceStats).map(([name, data]) => ({ name, totalOrders: data.totalOrders, uniqueCustomers: data.uniqueConfirmedCustomers.size, confirmedOrders: data.confirmedOrders, confirmedPercentage: data.totalOrders > 0 ? (data.confirmedOrders / data.totalOrders) * 100 : 0 })).sort((a, b) => b.totalOrders - a.totalOrders);

        

        const geoStats = {};

        rawData.forEach(item => {

            const province = item[COL_PROVINCE] || 'Unknown Province';

            const revenue = item[COL_NET_REVENUE] || 0;

            if (!geoStats[province]) geoStats[province] = { totalOrders: 0, totalRevenue: 0, confirmedRevenue: 0, failedRevenue: 0 };

            geoStats[province].totalOrders += 1;

            geoStats[province].totalRevenue += revenue;

            if (isConfirmed(item)) geoStats[province].confirmedRevenue += revenue;

            else geoStats[province].failedRevenue += revenue;

        });

        const provinceAnalysis = Object.entries(geoStats).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.totalRevenue - a.totalRevenue); 

        const geoRevenueChart = provinceAnalysis.map(p => ({ province: p.name, netRevenue: p.confirmedRevenue })).slice(0, 10); 

        

        const paymentStats = {};

        filteredData.forEach(item => {

            const method = (item['payment_method'] || item['epayment_provider'] || 'Lainnya').toUpperCase().replace('_', ' ');

            const revenue = item[COL_NET_REVENUE] || 0;

            if (!paymentStats[method]) paymentStats[method] = { name: method, revenue: 0, count: 0 };

            paymentStats[method].revenue += revenue;

            paymentStats[method].count += 1;

        });

        const paymentMethodAnalysis = Object.values(paymentStats).sort((a, b) => b.revenue - a.revenue);



        const customerTypeMap = new Map(); 

        filteredData.forEach(item => {

            const name = item[COL_NAME];

            const type = (item[COL_CUSTOMER_TYPE] || 'Unknown').toUpperCase();

            const revenue = item[COL_NET_REVENUE] || 0;

            const confirmedTimeStr = item[COL_CONFIRMED_TIME];

            if (!name) return;

            const time = confirmedTimeStr ? new Date(confirmedTimeStr.replace(' ', 'T')).getTime() : 0;

            if (!customerTypeMap.has(name)) customerTypeMap.set(name, { type, revenue, latestTime: time });

            else {

                const prev = customerTypeMap.get(name);

                prev.revenue += revenue;

                if (time > prev.latestTime) { prev.type = type; prev.latestTime = time; }

            }

        });

        const customerTypeStats = {};

        customerTypeMap.forEach((value) => {

            const type = value.type;

            if (!customerTypeStats[type]) customerTypeStats[type] = { name: type, revenue: 0, count: 0 };

            customerTypeStats[type].count += 1;

            customerTypeStats[type].revenue += value.revenue;

        });

        const customerTypeAnalysis = Object.values(customerTypeStats).sort((a, b) => b.revenue - a.revenue);



        const financialEntityStats = {};

        filteredData.forEach(item => {

            let entity = item[COL_FINANCIAL_ENTITY];

            if (!entity || entity.toString().trim() === '' || entity.toString().trim() === '-' || entity.toString().toLowerCase() === 'unknown') { return; }

            entity = entity.toString().trim();

            const revenue = item[COL_NET_REVENUE] || 0;

            if (!financialEntityStats[entity]) financialEntityStats[entity] = { name: entity, revenue: 0, count: 0 };

            financialEntityStats[entity].revenue += revenue;

            financialEntityStats[entity].count += 1;

        });

        const financialEntityAnalysis = Object.values(financialEntityStats).sort((a, b) => b.revenue - a.revenue);



        const courierStats = {};

        filteredData.forEach(item => {

            let courier = (item[COL_COURIER] || 'Unknown').toUpperCase();

            courier = courier.trim();

            if (!courier || courier === '-') courier = 'Lainnya/Pickup';

            const revenue = item[COL_NET_REVENUE] || 0;

            if (!courierStats[courier]) courierStats[courier] = { name: courier, revenue: 0, count: 0 };

            courierStats[courier].revenue += revenue;

            courierStats[courier].count += 1;

        });

        const courierAnalysis = Object.values(courierStats).sort((a, b) => b.revenue - a.revenue);



        const uniqueCustomerList = finalCustomerSegmentationData.map(c => ({

            name: c.name, phone: c.phone, address: c.address, province: c.province, city: c.city, subdistrict: c.subdistrict

        })).sort((a, b) => a.name.localeCompare(b.name));



        const rawTimeData = filteredData.map(item => {

            const confirmedTimeStr = item[COL_CONFIRMED_TIME];

            const revenue = item[COL_NET_REVENUE] || 0;

            let year = null;

            let monthIndex = null;

            if (confirmedTimeStr) {

                const dateParts = extractDateParts(confirmedTimeStr);

                if (dateParts) { year = dateParts.year; monthIndex = parseInt(dateParts.month, 10) - 1; }

            }

            return { year, monthIndex, revenue };

        }).filter(d => d.year !== null);

        

        const provCounts = {};

        const cityCounts = {}; 

        const subCounts = {};



        filteredData.forEach(item => { 

            const prov = (item[COL_PROVINCE] || '').trim();

            const city = (item[COL_CITY] || '').trim();

            const sub = (item[COL_SUBDISTRICT] || '').trim();



            if(prov && prov !== '-' && prov.toLowerCase() !== 'unknown') provCounts[prov] = (provCounts[prov] || 0) + 1;

            if(city && city !== '-' && city.toLowerCase() !== 'unknown') cityCounts[city] = (cityCounts[city] || 0) + 1;

            if(sub && sub !== '-' && sub.toLowerCase() !== 'unknown') subCounts[sub] = (subCounts[sub] || 0) + 1;

        });



        const _topProvinces = Object.entries(provCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);

        const _topCities = Object.entries(cityCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);

        const _topSubdistricts = Object.entries(subCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);



        return { 

            utmChartAnalysis, utmSourceAnalysis, provinceAnalysis, uniqueCustomerList, geoRevenueChart, productVariantAnalysis, top3Products, rawData, uniqueDates, customerSegmentationData: finalCustomerSegmentationData, totalConfirmedRevenue, totalConfirmedOrders, timeAnalysis, rawTimeData, paymentMethodAnalysis, customerTypeAnalysis, financialEntityAnalysis, courierAnalysis, heatmapData: heatmapGrid, heatmapMaxRevenue, dailyTrendAnalysis: dailyTrendStats, confirmedOrders: filteredData, totalGrossProfit, topLocationLists: { provinces: _topProvinces, cities: _topCities, subdistricts: _topSubdistricts }

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



const NavButton = ({ id, name, view, setView, icon: Icon }) => (

    <button

        onClick={() => setView(id)}

        className={`flex items-center space-x-3 w-full justify-start px-4 py-3 text-sm font-medium transition-all duration-300 rounded-lg shadow-md ${

            view === id ? 'bg-indigo-600 text-white shadow-indigo-500/50' : 'bg-white text-gray-700 hover:bg-gray-100 hover:shadow-lg'

        }`}

    >

        <Icon className="w-5 h-5" />

        <span>{name}</span>

    </button>

);



const CustomerSegmentationView = ({ data }) => {

    const [selectedSegment, setSelectedSegment] = useState('All');

    // Filter Inputs

    const [recencyMin, setRecencyMin] = useState('');

    const [recencyMax, setRecencyMax] = useState('');

    const [frequencyMin, setFrequencyMin] = useState('');

    const [frequencyMax, setFrequencyMax] = useState('');

    const [monetaryMin, setMonetaryMin] = useState('');

    const [monetaryMax, setMonetaryMax] = useState('');



    const [selectedProducts, setSelectedProducts] = useState([]);

    const [isProdDropdownOpen, setIsProdDropdownOpen] = useState(false);

    const [searchTerm, setSearchTerm] = useState(''); 

    const [showChatRecommendation, setShowChatRecommendation] = useState(false);

    const [showSegmentDetails, setShowSegmentDetails] = useState(false);

    

    // --- NEW: RFM Settings State ---

    const [showRFMSettings, setShowRFMSettings] = useState(false);

    const [rfmMode, setRfmMode] = useState('auto'); // 'auto' or 'manual'

    const [rfmRules, setRfmRules] = useState({

        recency: { // Upper bounds (Days <= X)

            5: 30, 4: 60, 3: 90, 2: 180

        },

        frequency: { // Lower bounds (Orders >= X)

            5: 10, 4: 7, 3: 4, 2: 2

        },

        monetary: { // Lower bounds (Total >= X)

            5: 1000000, 4: 500000, 3: 250000, 2: 100000

        }

    });



    const dropdownRef = useRef(null);



    // Close dropdown

    useEffect(() => {

        const handleClickOutside = (event) => {

            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsProdDropdownOpen(false);

        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => document.removeEventListener("mousedown", handleClickOutside);

    }, [dropdownRef]);



    // --- NEW: Calculate Custom Scores Logic ---

    const activeData = useMemo(() => {

        if (rfmMode === 'auto') return data;



        return data.map(c => {

            let rScore = 1, fScore = 1, mScore = 1;



            // Recency (Lower is better)

            if (c.recency <= rfmRules.recency[5]) rScore = 5;

            else if (c.recency <= rfmRules.recency[4]) rScore = 4;

            else if (c.recency <= rfmRules.recency[3]) rScore = 3;

            else if (c.recency <= rfmRules.recency[2]) rScore = 2;

            else rScore = 1;



            // Frequency (Higher is better)

            if (c.frequency >= rfmRules.frequency[5]) fScore = 5;

            else if (c.frequency >= rfmRules.frequency[4]) fScore = 4;

            else if (c.frequency >= rfmRules.frequency[3]) fScore = 3;

            else if (c.frequency >= rfmRules.frequency[2]) fScore = 2;

            else fScore = 1;



            // Monetary (Higher is better)

            if (c.monetary >= rfmRules.monetary[5]) mScore = 5;

            else if (c.monetary >= rfmRules.monetary[4]) mScore = 4;

            else if (c.monetary >= rfmRules.monetary[3]) mScore = 3;

            else if (c.monetary >= rfmRules.monetary[2]) mScore = 2;

            else mScore = 1;



            // Re-assign Segment

            const segmentName = assignRFMSegment(rScore, fScore, mScore);

            const segmentInfo = TARGET_SEGMENTS_10.find(s => s.name === segmentName) || TARGET_SEGMENTS_10[9];



            return {

                ...c,

                R_Score: rScore,

                F_Score: fScore,

                M_Score: mScore,

                RFM_Score: `${rScore}${fScore}${mScore}`,

                Segment10Name: segmentInfo.name,

                Segment10Color: segmentInfo.color,

                Segment10Hex: segmentInfo.hexColor,

                Segment10Desc: segmentInfo.desc,

                Segment10Text: segmentInfo.text

            };

        });

    }, [data, rfmMode, rfmRules]);



    const chartData = useMemo(() => {

        const stats = {};

        activeData.forEach(customer => {

            const segName = customer.Segment10Name;

            if (!stats[segName]) stats[segName] = { name: segName, count: 0, revenue: 0, fill: customer.Segment10Hex || "#8884d8" };

            stats[segName].count += 1;

            stats[segName].revenue += customer.monetary;

        });

        return Object.values(stats).sort((a, b) => b.count - a.count);

    }, [activeData]);



    const filteredTableData = useMemo(() => {

        return activeData.filter(c => {

            const matchesSegment = selectedSegment === 'All' || c.Segment10Name === selectedSegment;

            let matchesRecency = true;

            if (recencyMin) matchesRecency = matchesRecency && c.recency >= parseInt(recencyMin);

            if (recencyMax) matchesRecency = matchesRecency && c.recency <= parseInt(recencyMax);

            let matchesFrequency = true;

            if (frequencyMin) matchesFrequency = matchesFrequency && c.frequency >= parseInt(frequencyMin);

            if (frequencyMax) matchesFrequency = matchesFrequency && c.frequency <= parseInt(frequencyMax);

            let matchesMonetary = true;

            if (monetaryMin) matchesMonetary = matchesMonetary && c.monetary >= parseFloat(monetaryMin);

            if (monetaryMax) matchesMonetary = matchesMonetary && c.monetary <= parseFloat(monetaryMax);

            let matchesProduct = true;

            if (selectedProducts.length > 0) matchesProduct = selectedProducts.some(prod => c.productMap && c.productMap[prod] > 0);

            const term = searchTerm.toLowerCase();

            const matchesSearch = !term || (c.name && c.name.toLowerCase().includes(term)) || (c.phone && c.phone.toString().toLowerCase().includes(term));

            return matchesSegment && matchesRecency && matchesFrequency && matchesMonetary && matchesProduct && matchesSearch;

        });

    }, [activeData, selectedSegment, recencyMin, recencyMax, frequencyMin, frequencyMax, monetaryMin, monetaryMax, selectedProducts, searchTerm]);



    const productColumns = useMemo(() => {

        const allProducts = new Set();

        data.forEach(c => { if (c.productMap) Object.keys(c.productMap).forEach(p => allProducts.add(p)); });

        return Array.from(allProducts).sort();

    }, [data]);



    const segmentInsights = useMemo(() => {

        if (filteredTableData.length === 0) return null;

        let totalRev = 0;

        const productCounts = {};

        const cityCounts = {};

        filteredTableData.forEach(c => {

            totalRev += c.monetary;

            if (c.productMap) Object.entries(c.productMap).forEach(([prod, qty]) => { productCounts[prod] = (productCounts[prod] || 0) + qty; });

            const city = c.city || "Unknown";

            cityCounts[city] = (cityCounts[city] || 0) + 1;

        });

        const avgRev = totalRev / filteredTableData.length;

        const topProduct = Object.entries(productCounts).sort((a, b) => b[1] - a[1])[0];

        const topCity = Object.entries(cityCounts).sort((a, b) => b[1] - a[1])[0];

        return {

            avgRevenue: avgRev,

            favProduct: topProduct ? topProduct[0] : "-",

            favProductCount: topProduct ? topProduct[1] : 0,

            domCity: topCity ? topCity[0] : "-",

            domCityCount: topCity ? topCity[1] : 0,

            totalPopulation: filteredTableData.length

        };

    }, [filteredTableData]);



    const segmentOptions = useMemo(() => {

        const uniqueSegments = [...new Set(activeData.map(c => c.Segment10Name))].sort();

        return ['All', ...uniqueSegments];

    }, [activeData]);



    const handleExportCSV = () => {

        if (filteredTableData.length === 0) { alert("Tidak ada data."); return; }

        const baseHeaders = ["Nama,No WhatsApp,Alamat Lengkap,Provinsi,Kabupaten,Kecamatan,Segmen,Recency (Hari),Frequency,Total Belanja,Produk Terakhir"];

        const productHeaders = productColumns.map(p => `"${p} (Qty)"`);

        const headers = [...baseHeaders, ...productHeaders].join(",");

        const rows = filteredTableData.map(c => {

            const clean = (t) => `"${(t || '').toString().replace(/"/g, '""')}"`;

            const baseData = [clean(c.name), clean(c.phone), clean(c.address), clean(c.province), clean(c.city), clean(c.subdistrict), clean(c.Segment10Name), c.recency, c.frequency, c.monetary, clean(c.lastProduct)];

            const pData = productColumns.map(p => (c.productMap && c.productMap[p]) ? c.productMap[p] : 0);

            return [...baseData, ...pData].join(",");

        });

        const csvContent = [headers, ...rows].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.setAttribute("href", url); link.setAttribute("download", `Data_RFM_Segmen.csv`);

        document.body.appendChild(link); link.click(); document.body.removeChild(link);

    };



    const copyToClipboard = (text) => {

        const textArea = document.createElement("textarea"); textArea.value = text.replace(/\*\*/g, ''); document.body.appendChild(textArea); textArea.select();

        try { document.execCommand('copy'); alert('Tersalin!'); } catch (err) {} document.body.removeChild(textArea);

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



    // --- NEW: RFM Configuration Modal ---

    const RFMSettingsModal = () => {

        if (!showRFMSettings) return null;

        

        // State for Bulk Edit Mode

        const [isBulkMode, setIsBulkMode] = useState(false);

        const [bulkText, setBulkText] = useState('');

        const [bulkError, setBulkError] = useState(null);



        // Initialize Bulk Text from current Rules

        useEffect(() => {

            if (isBulkMode) {

                const r = rfmRules.recency;

                const f = rfmRules.frequency;

                const m = rfmRules.monetary;

                const text = `Recency: ${r[5]}, ${r[4]}, ${r[3]}, ${r[2]}\nFrequency: ${f[5]}, ${f[4]}, ${f[3]}, ${f[2]}\nMonetary: ${m[5]}, ${m[4]}, ${m[3]}, ${m[2]}`;

                setBulkText(text);

                setBulkError(null);

            }

        }, [isBulkMode]); // Removed rfmRules dependency to prevent overwrite on type



        const handleRuleChange = (metric, score, value) => {

            setRfmRules(prev => ({

                ...prev,

                [metric]: { ...prev[metric], [score]: parseInt(value) || 0 }

            }));

        };



        const handleBulkApply = () => {

            try {

                const lines = bulkText.split('\n').map(l => l.trim()).filter(l => l);

                if (lines.length < 3) throw new Error("Format tidak lengkap. Harus ada 3 baris (Recency, Frequency, Monetary).");



                const parseLine = (line) => {

                    const parts = line.split(':')[1];

                    if (!parts) throw new Error(`Format baris salah: ${line}`);

                    const values = parts.split(',').map(v => parseInt(v.trim()));

                    if (values.some(isNaN)) throw new Error(`Ada angka yang tidak valid pada baris: ${line}`);

                    if (values.length < 4) throw new Error(`Setiap baris harus memiliki 4 angka (untuk Skor 5, 4, 3, 2). Baris: ${line}`);

                    return { 5: values[0], 4: values[1], 3: values[2], 2: values[3] };

                };



                const newRules = {

                    recency: parseLine(lines[0]),

                    frequency: parseLine(lines[1]),

                    monetary: parseLine(lines[2])

                };



                setRfmRules(newRules);

                setIsBulkMode(false);

                setBulkError(null);

            } catch (err) {

                setBulkError(err.message);

            }

        };



        return (

            <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50 p-4 backdrop-blur-sm">

                <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl p-6 transform transition-all max-h-[90vh] overflow-y-auto">

                    <div className="flex justify-between items-center mb-6 border-b pb-4">

                        <div>

                            <h3 className="text-xl font-bold text-gray-800 flex items-center">

                                <Settings className="w-6 h-6 mr-2 text-indigo-600" /> 

                                Konfigurasi Skor RFM

                            </h3>

                            <p className="text-xs text-gray-500 mt-1">Atur batasan nilai untuk setiap Skor (1-5) sesuai standar bisnis Anda.</p>

                        </div>

                        <button onClick={() => setShowRFMSettings(false)} className="text-gray-400 hover:text-gray-600"><XCircle className="w-6 h-6" /></button>

                    </div>



                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-indigo-50 p-3 rounded-lg border border-indigo-100">

                        <div className="flex items-center gap-4">

                            <span className="text-sm font-bold text-indigo-800">Mode Scoring:</span>

                            <div className="flex gap-2">

                                <button 

                                    onClick={() => setRfmMode('auto')}

                                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${rfmMode === 'auto' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}

                                >

                                    Otomatis

                                </button>

                                <button 

                                    onClick={() => setRfmMode('manual')}

                                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${rfmMode === 'manual' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}

                                >

                                    Manual

                                </button>

                            </div>

                        </div>

                        

                        {rfmMode === 'manual' && (

                            <button 

                                onClick={() => setIsBulkMode(!isBulkMode)}

                                className="text-xs font-bold text-indigo-700 hover:text-indigo-900 underline flex items-center"

                            >

                                {isBulkMode ? "Kembali ke Tampilan Visual" : "Edit Cepat (Bulk Text)"} <RotateCcw className="w-3 h-3 ml-1" />

                            </button>

                        )}

                    </div>



                    {rfmMode === 'manual' && (

                        <>

                            {isBulkMode ? (

                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-300">

                                    <h4 className="font-bold text-gray-700 mb-2 flex items-center"><FileText className="w-4 h-4 mr-2" /> Editor Teks Cepat</h4>

                                    <p className="text-xs text-gray-500 mb-2">Edit semua angka sekaligus. Format: <code>Nama: Skor5, Skor4, Skor3, Skor2</code></p>

                                    <textarea 

                                        value={bulkText}

                                        onChange={(e) => setBulkText(e.target.value)}

                                        className="w-full h-40 p-3 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"

                                        placeholder="Recency: 30, 60, 90, 180..."

                                    />

                                    {bulkError && <p className="text-xs text-red-600 mt-2 font-bold">{bulkError}</p>}

                                    <div className="mt-3 flex justify-end">

                                        <button onClick={handleBulkApply} className="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700">Terapkan Perubahan</button>

                                    </div>

                                </div>

                            ) : (

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                                    {/* RECENCY */}

                                    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">

                                        <div className="flex items-center mb-3 pb-2 border-b border-gray-100">

                                            <Clock className="w-4 h-4 text-blue-500 mr-2" />

                                            <h4 className="font-bold text-gray-800">Recency (Hari)</h4>

                                        </div>

                                        <p className="text-[10px] text-gray-500 mb-3">Makin kecil makin bagus (Score 5).</p>

                                        <div className="space-y-3">

                                            {[5, 4, 3, 2].map(score => (

                                                <div key={score} className="flex items-center justify-between">

                                                    <div className="flex items-center">

                                                        <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white mr-2 ${score >= 4 ? 'bg-green-500' : score === 3 ? 'bg-yellow-500' : 'bg-orange-500'}`}>{score}</div>

                                                        <span className="text-xs text-gray-600 font-medium">{'<='}</span>

                                                    </div>

                                                    <div className="flex items-center">

                                                        <input 

                                                            type="number" 

                                                            value={rfmRules.recency[score]} 

                                                            onChange={(e) => handleRuleChange('recency', score, e.target.value)}

                                                            className="w-16 p-1 text-center text-xs border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"

                                                        />

                                                        <span className="text-xs text-gray-400 ml-1 w-8">Hari</span>

                                                    </div>

                                                </div>

                                            ))}

                                            <div className="flex items-center justify-between opacity-70">

                                                <div className="flex items-center">

                                                    <div className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white mr-2 bg-red-500">1</div>

                                                    <span className="text-xs text-gray-600 font-medium">{'>'} {rfmRules.recency[2]}</span>

                                                </div>

                                                <span className="text-xs text-gray-400 ml-1">Sisa</span>

                                            </div>

                                        </div>

                                    </div>



                                    {/* FREQUENCY */}

                                    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">

                                        <div className="flex items-center mb-3 pb-2 border-b border-gray-100">

                                            <Repeat className="w-4 h-4 text-purple-500 mr-2" />

                                            <h4 className="font-bold text-gray-800">Frequency (Kali)</h4>

                                        </div>

                                        <p className="text-[10px] text-gray-500 mb-3">Makin besar makin bagus (Score 5).</p>

                                        <div className="space-y-3">

                                            {[5, 4, 3, 2].map(score => (

                                                <div key={score} className="flex items-center justify-between">

                                                    <div className="flex items-center">

                                                        <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white mr-2 ${score >= 4 ? 'bg-green-500' : score === 3 ? 'bg-yellow-500' : 'bg-orange-500'}`}>{score}</div>

                                                        <span className="text-xs text-gray-600 font-medium">{'>='}</span>

                                                    </div>

                                                    <div className="flex items-center">

                                                        <input 

                                                            type="number" 

                                                            value={rfmRules.frequency[score]} 

                                                            onChange={(e) => handleRuleChange('frequency', score, e.target.value)}

                                                            className="w-16 p-1 text-center text-xs border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"

                                                        />

                                                        <span className="text-xs text-gray-400 ml-1 w-8">Kali</span>

                                                    </div>

                                                </div>

                                            ))}

                                            <div className="flex items-center justify-between opacity-70">

                                                <div className="flex items-center">

                                                    <div className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white mr-2 bg-red-500">1</div>

                                                    <span className="text-xs text-gray-600 font-medium">{'<'} {rfmRules.frequency[2]}</span>

                                                </div>

                                                <span className="text-xs text-gray-400 ml-1">Sisa</span>

                                            </div>

                                        </div>

                                    </div>



                                    {/* MONETARY */}

                                    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">

                                        <div className="flex items-center mb-3 pb-2 border-b border-gray-100">

                                            <DollarSign className="w-4 h-4 text-green-500 mr-2" />

                                            <h4 className="font-bold text-gray-800">Monetary (Rp)</h4>

                                        </div>

                                        <p className="text-[10px] text-gray-500 mb-3">Makin besar makin bagus (Score 5).</p>

                                        <div className="space-y-3">

                                            {[5, 4, 3, 2].map(score => (

                                                <div key={score} className="flex items-center justify-between">

                                                    <div className="flex items-center">

                                                        <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white mr-2 ${score >= 4 ? 'bg-green-500' : score === 3 ? 'bg-yellow-500' : 'bg-orange-500'}`}>{score}</div>

                                                        <span className="text-xs text-gray-600 font-medium">{'>='}</span>

                                                    </div>

                                                    <div className="flex items-center">

                                                        <input 

                                                            type="number" 

                                                            value={rfmRules.monetary[score]} 

                                                            onChange={(e) => handleRuleChange('monetary', score, e.target.value)}

                                                            className="w-24 p-1 text-right text-xs border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"

                                                        />

                                                    </div>

                                                </div>

                                            ))}

                                            <div className="flex items-center justify-between opacity-70">

                                                <div className="flex items-center">

                                                    <div className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white mr-2 bg-red-500">1</div>

                                                    <span className="text-xs text-gray-600 font-medium">{'<'} {rfmRules.monetary[2]}</span>

                                                </div>

                                                <span className="text-xs text-gray-400 ml-1">Sisa</span>

                                            </div>

                                        </div>

                                    </div>

                                </div>

                            )}

                        </>

                    )}



                    <div className="mt-8 flex justify-end gap-3 pt-4 border-t">

                        <button onClick={() => setShowRFMSettings(false)} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors flex items-center">

                            <Save className="w-4 h-4 mr-2" /> Simpan & Terapkan

                        </button>

                    </div>

                </div>

            </div>

        );

    };



    return (

        <div className="space-y-6">

            <RFMSettingsModal />

            {/* 1. Header (Simple) */}

            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-indigo-100">

                <div>

                    <h3 className="text-2xl font-bold text-gray-800 flex items-center">

                        <Target className="w-6 h-6 mr-3 text-indigo-600" />

                        Analisis Segmen Pelanggan (RFM)

                    </h3>

                    <p className="text-sm text-gray-500 mt-1 ml-9">

                        Pahami perilaku belanja untuk meningkatkan retensi dan konversi.

                    </p>

                </div>

                {/* --- NEW: Settings Button --- */}

                <button 

                    onClick={() => setShowRFMSettings(true)}

                    className="mt-4 md:mt-0 flex items-center px-4 py-2 text-sm font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors shadow-sm"

                >

                    <Settings className="w-4 h-4 mr-2" />

                    Konfigurasi Score

                </button>

            </div>

            

            {/* 2. CHART SECTION (Full Width) */}

            {activeData.length > 0 && (

                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">

                    <div className="flex justify-between items-center mb-6">

                        <div className="flex items-center">

                            <h4 className="text-lg font-bold text-gray-700 mr-2">Distribusi Segmen</h4>

                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${rfmMode === 'auto' ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-indigo-100 text-indigo-600 border-indigo-200'}`}>

                                Mode: {rfmMode === 'auto' ? 'Otomatis' : 'Manual'}

                            </span>

                        </div>

                        <button 

                            onClick={() => setShowSegmentDetails(!showSegmentDetails)}

                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center bg-indigo-50 px-3 py-1.5 rounded-full transition-colors"

                        >

                            <BookOpen className="w-3 h-3 mr-1"/> 

                            {showSegmentDetails ? "Sembunyikan Info" : "Kamus Segmen"}

                        </button>

                    </div>



                    {showSegmentDetails && (

                        <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 animate-fade-in bg-gray-50 p-3 rounded-lg border border-gray-200">

                            {TARGET_SEGMENTS_10.map((seg, idx) => (

                                <div key={idx} className="flex items-start p-1">

                                    <div className={`w-2 h-2 rounded-full mt-1.5 mr-2 flex-shrink-0 ${seg.color}`}></div>

                                    <div>

                                        <p className={`text-[10px] font-bold uppercase ${seg.text}`}>{seg.name}</p>

                                        <p className="text-[9px] text-gray-500 leading-tight">{seg.desc}</p>

                                    </div>

                                </div>

                            ))}

                        </div>

                    )}



                    <div className="h-72 w-full">

                        <ResponsiveContainer width="100%" height="100%">

                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>

                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />

                                <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} tick={{ fontSize: 10, fontWeight: 500 }} height={50} />

                                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />

                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />

                                <Bar dataKey="count" radius={[4, 4, 0, 0]} onClick={(data) => setSelectedSegment(data.name)} className="cursor-pointer hover:opacity-80">

                                    {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}

                                </Bar>

                            </BarChart>

                        </ResponsiveContainer>

                    </div>

                </div>

            )}



            {/* 3. FILTER BAR (Controls Insights Below) */}

            <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100 sticky top-2 z-20">

                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">

                    <div className="w-full xl:w-auto flex-1">

                        <div className="flex items-center mb-2">

                            <Filter className="w-4 h-4 text-indigo-600 mr-2" />

                            <h4 className="text-sm font-bold text-gray-700">Filter Data (Mempengaruhi Insight di Bawah)</h4>

                        </div>

                        <div className="flex flex-wrap gap-2">

                            {/* Search */}

                            <div className="relative">

                                <input 

                                    type="text" 

                                    placeholder="Cari Nama / HP..." 

                                    value={searchTerm} 

                                    onChange={(e) => setSearchTerm(e.target.value)} 

                                    className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-indigo-500 w-40"

                                />

                                <Search className="w-3 h-3 text-gray-400 absolute left-2.5 top-2.5" />

                            </div>



                            {/* Segment Select */}

                            <select value={selectedSegment} onChange={(e) => setSelectedSegment(e.target.value)} className="border border-gray-300 rounded-md text-xs py-1.5 px-2 bg-white focus:ring-indigo-500 font-medium text-gray-700 cursor-pointer">

                                {segmentOptions.map((option, idx) => (<option key={idx} value={option}>{option === 'All' ? 'Semua Segmen' : option}</option>))}

                            </select>



                            {/* Product Select (Dropdown) */}

                            <div className="relative" ref={dropdownRef}>

                                <button onClick={() => setIsProdDropdownOpen(!isProdDropdownOpen)} className="flex items-center justify-between px-3 py-1.5 text-xs font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-50 min-w-[140px]">

                                    <span className="truncate max-w-[120px]">{selectedProducts.length === 0 ? "Semua Produk" : `${selectedProducts.length} Produk`}</span>

                                    <ChevronDown className="w-3 h-3 text-gray-400 ml-1" />

                                </button>

                                {isProdDropdownOpen && (

                                    <div className="absolute z-20 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">

                                        <div className="p-2 border-b border-gray-100 sticky top-0 bg-white"><button onClick={() => { setSelectedProducts([]); setIsProdDropdownOpen(false); }} className="text-xs text-red-500 font-bold hover:underline w-full text-left">Reset Produk</button></div>

                                        {productColumns.map((prod, idx) => (

                                            <div key={idx} onClick={() => { if (selectedProducts.includes(prod)) { setSelectedProducts(selectedProducts.filter(p => p !== prod)); } else { setSelectedProducts([...selectedProducts, prod]); } }} className="flex items-center px-3 py-2 hover:bg-indigo-50 cursor-pointer text-xs border-b border-gray-50 last:border-0">

                                                <div className={`w-3 h-3 border rounded mr-2 flex items-center justify-center ${selectedProducts.includes(prod) ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>{selectedProducts.includes(prod) && <Check className="w-2 h-2 text-white" />}</div>

                                                <span className="truncate">{prod}</span>

                                            </div>

                                        ))}

                                    </div>

                                )}

                            </div>

                        </div>

                    </div>



                    {/* RFM Metrics Inputs */}

                    <div className="flex flex-wrap gap-4 w-full xl:w-auto items-end bg-gray-50 p-3 rounded-lg border border-gray-200">

                        <div className="flex flex-col">

                            <span className="text-[10px] font-bold text-gray-500 uppercase mb-1">Recency (Hari)</span>

                            <div className="flex items-center gap-1">

                                <input type="number" placeholder="Min" value={recencyMin} onChange={(e) => setRecencyMin(e.target.value)} className="w-12 py-1 px-1 text-xs border border-gray-300 rounded text-center" />

                                <span className="text-gray-400">-</span>

                                <input type="number" placeholder="Max" value={recencyMax} onChange={(e) => setRecencyMax(e.target.value)} className="w-12 py-1 px-1 text-xs border border-gray-300 rounded text-center" />

                            </div>

                        </div>

                        <div className="flex flex-col">

                            <span className="text-[10px] font-bold text-gray-500 uppercase mb-1">Freq (Kali)</span>

                            <div className="flex items-center gap-1">

                                <input type="number" placeholder="Min" value={frequencyMin} onChange={(e) => setFrequencyMin(e.target.value)} className="w-10 py-1 px-1 text-xs border border-gray-300 rounded text-center" />

                                <span className="text-gray-400">-</span>

                                <input type="number" placeholder="Max" value={frequencyMax} onChange={(e) => setFrequencyMax(e.target.value)} className="w-10 py-1 px-1 text-xs border border-gray-300 rounded text-center" />

                            </div>

                        </div>

                        <div className="flex flex-col">

                            <span className="text-[10px] font-bold text-gray-500 uppercase mb-1">Monetary (Rp)</span>

                            <div className="flex items-center gap-1">

                                <input type="number" placeholder="Min" value={monetaryMin} onChange={(e) => setMonetaryMin(e.target.value)} className="w-16 py-1 px-1 text-xs border border-gray-300 rounded text-center" />

                                <span className="text-gray-400">-</span>

                                <input type="number" placeholder="Max" value={monetaryMax} onChange={(e) => setMonetaryMax(e.target.value)} className="w-16 py-1 px-1 text-xs border border-gray-300 rounded text-center" />

                            </div>

                        </div>

                        <button onClick={handleExportCSV} disabled={filteredTableData.length === 0} className={`ml-2 px-3 py-1.5 text-xs font-bold text-white rounded shadow-sm flex items-center transition-colors ${filteredTableData.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>

                            <Download className="w-3 h-3 mr-1" /> CSV

                        </button>

                    </div>

                </div>

            </div>



            {/* 4. INSIGHTS & STATS PANEL (Dinamis Berdasarkan Filter) */}

            {segmentInsights && (

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 animate-fade-in">

                    

                    {/* Card 1: Total Pelanggan (Separated) */}

                    <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-3 rounded-lg shadow-sm text-white flex flex-col justify-center h-full min-h-[90px] relative overflow-hidden group">

                        <div className="absolute right-0 top-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity"><Users className="w-8 h-8 text-white" /></div>

                        <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider mb-1">Total Pelanggan</p>

                        <p className="text-xl font-bold leading-tight">{segmentInsights.totalPopulation} <span className="text-[10px] font-normal text-indigo-200">Orang</span></p>

                        <p className="text-[9px] text-indigo-300 mt-1">Dalam Filter Ini</p>

                    </div>



                    {/* Card 2: Rata-rata CLV (Separated) */}

                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-lg shadow-sm text-white flex flex-col justify-center h-full min-h-[90px] relative overflow-hidden group">

                        <div className="absolute right-0 top-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity"><DollarSign className="w-8 h-8 text-white" /></div>

                        <p className="text-[10px] text-emerald-100 font-bold uppercase tracking-wider mb-1">Rata-rata CLV</p>

                        <p className="text-lg font-bold leading-tight">{formatRupiah(segmentInsights.avgRevenue)}</p>

                        <p className="text-[9px] text-emerald-100 mt-1">Nilai Per User</p>

                    </div>



                    {/* Card 3: Top Product - COMPACT VERSION */}

                    <div className="bg-white p-3 rounded-lg shadow-sm border border-indigo-50 flex flex-col justify-center relative overflow-hidden group h-full min-h-[90px]">

                        <div className="absolute right-0 top-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity"><Star className="w-8 h-8 text-yellow-500" /></div>

                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Produk Favorit</p>

                        <p className="text-sm font-bold text-gray-800 line-clamp-2 leading-tight" title={segmentInsights.favProduct}>{segmentInsights.favProduct}</p>

                        <p className="text-[10px] text-indigo-600 font-semibold mt-1">{segmentInsights.favProductCount} Transaksi</p>

                    </div>



                    {/* Card 4: Top Location - COMPACT VERSION */}

                    <div className="bg-white p-3 rounded-lg shadow-sm border border-indigo-50 flex flex-col justify-center relative overflow-hidden group h-full min-h-[90px]">

                        <div className="absolute right-0 top-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity"><MapPin className="w-8 h-8 text-red-500" /></div>

                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Lokasi Dominan</p>

                        <p className="text-sm font-bold text-gray-800 leading-tight">{segmentInsights.domCity}</p>

                        <p className="text-[10px] text-indigo-600 font-semibold mt-1">{segmentInsights.domCityCount} Pelanggan</p>

                    </div>



                    {/* Card 5: Action Trigger - COMPACT VERSION */}

                    <div 

                        className={`bg-gradient-to-br from-yellow-400 to-orange-500 p-0.5 rounded-lg shadow-sm cursor-pointer transition-transform transform hover:scale-[1.02] active:scale-95 h-full min-h-[90px]`} 

                        onClick={() => setShowChatRecommendation(!showChatRecommendation)}

                    >

                        <div className="bg-white/10 h-full w-full rounded-[6px] p-2 flex flex-col items-center justify-center text-white backdrop-blur-sm border border-white/20">

                            <Zap className="w-5 h-5 mb-1 text-white" />

                            <p className="font-bold text-xs text-center leading-tight">{showChatRecommendation ? "Tutup" : (selectedSegment === 'All' ? "Pilih Segmen" : "Strategi Segmen")}</p>

                            <p className="text-[9px] text-center text-white/80 mt-0.5">{selectedSegment === 'All' ? 'Utk lihat strategi' : 'Klik detail'}</p>

                        </div>

                    </div>

                </div>

            )}



            {/* 5. RECOMMENDATION DROPDOWN (UPDATED: Segment-Based) */}

             {showChatRecommendation && (

                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 p-6 rounded-r-xl shadow-inner animate-fade-in-down">

                    <div className="flex items-center mb-4">

                        <Zap className="w-5 h-5 mr-2 text-yellow-600 fill-current" /> 

                        <h4 className="text-lg font-bold text-gray-800">

                            Rekomendasi Strategi: <span className="text-indigo-600">{selectedSegment === 'All' ? 'Semua Segmen (Umum)' : selectedSegment}</span>

                        </h4>

                    </div>



                    {selectedSegment === 'All' ? (

                        <div className="bg-white p-6 rounded-lg border border-yellow-200 text-center">

                            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">

                                <Target className="w-8 h-8 text-yellow-600" />

                            </div>

                            <h5 className="font-bold text-gray-800 text-sm mb-1">Pilih Segmen Spesifik</h5>

                            <p className="text-xs text-gray-500 max-w-sm mx-auto">

                                Silakan pilih salah satu segmen pada menu filter di atas (contoh: Champions, At Risk) untuk melihat strategi taktis dan template chat yang dipersonalisasi.

                            </p>

                        </div>

                    ) : (

                        <div className="grid grid-cols-1 gap-4">

                            {/* Strategy Card */}

                            <div className="bg-white p-5 rounded-lg shadow-sm border border-orange-100 flex flex-col md:flex-row gap-5">

                                <div className="flex-1">

                                    <div className="flex items-center mb-3">

                                        <div className="p-2 bg-indigo-50 rounded-lg mr-3">

                                            <Target className="w-5 h-5 text-indigo-600" />

                                        </div>

                                        <div>

                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Fokus Utama</p>

                                            <h5 className="font-bold text-base text-gray-800">{SEGMENT_PLAYBOOKS[selectedSegment]?.focus || "Optimasi Penjualan"}</h5>

                                        </div>

                                    </div>

                                    <p className="text-sm text-gray-600 leading-relaxed mb-4">

                                        {SEGMENT_PLAYBOOKS[selectedSegment]?.action || "Lakukan pendekatan personal untuk meningkatkan loyalitas."}

                                    </p>

                                </div>

                                

                                <div className="flex-1 bg-green-50 rounded-lg border border-green-100 p-4">

                                    <div className="flex justify-between items-center mb-2">

                                        <p className="text-[10px] text-green-700 font-bold uppercase flex items-center"><MessageSquare className="w-3 h-3 mr-1"/> Contoh Script Chat (Template)</p>

                                        <button 

                                            onClick={() => copyToClipboard(SEGMENT_PLAYBOOKS[selectedSegment]?.chat || "")} 

                                            className="text-[10px] font-bold text-green-600 hover:text-green-800 flex items-center bg-white px-2 py-1 rounded border border-green-200"

                                        >

                                            <Copy className="w-3 h-3 mr-1" /> Salin

                                        </button>

                                    </div>

                                    <div className="text-xs text-gray-700 font-mono bg-white p-3 rounded border border-green-200 leading-relaxed whitespace-pre-wrap">

                                        {SEGMENT_PLAYBOOKS[selectedSegment]?.chat || "Halo Kak {name}, terima kasih sudah berbelanja!"}

                                    </div>

                                    <p className="text-[9px] text-green-600 mt-2 italic">

                                        *Ganti {`{name}`} dengan nama pelanggan secara otomatis jika menggunakan tools blast.

                                    </p>

                                </div>

                            </div>

                        </div>

                    )}

                </div>

            )}



            {/* 6. DATA TABLE */}

             {activeData.length > 0 && (

                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">

                    <div className="overflow-x-auto max-h-[70vh]">

                        <table className="min-w-full divide-y divide-gray-200">

                            <thead className="bg-gray-50 sticky top-0 z-10">

                                <tr>

                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-16">No</th>

                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[200px]">Pelanggan</th>

                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Recency</th>

                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Freq</th>

                                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Monetary</th>

                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Skor RFM</th>

                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Segmen</th>

                                    {productColumns.map((colName, idx) => (

                                        <th key={idx} className="px-2 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider border-l border-gray-100 min-w-[80px]">

                                            <div className="truncate w-full" title={colName}>{colName}</div>

                                        </th>

                                    ))}

                                </tr>

                            </thead>

                            <tbody className="bg-white divide-y divide-gray-200">

                                {filteredTableData.map((customer, index) => (

                                    <tr key={index} className="hover:bg-indigo-50/30 transition-colors group">

                                        <td className="px-4 py-3 text-xs text-gray-500 text-center font-mono">{index + 1}</td>

                                        <td className="px-4 py-3">

                                            <div className="flex items-center">

                                                <div>

                                                    <div className="text-sm font-bold text-gray-800">{customer.name}</div>

                                                    <div className="flex flex-col mt-0.5">

                                                        <div className="flex items-center gap-1 text-xs font-mono text-indigo-600 font-medium">

                                                            {customer.phone || '-'}

                                                            {customer.phone && customer.phone !== '-' && (

                                                                <button onClick={() => copyToClipboard(customer.phone)} className="text-gray-400 hover:text-indigo-600 transition-opacity" title="Salin HP">

                                                                    <ClipboardCopy className="w-3 h-3" />

                                                                </button>

                                                            )}

                                                        </div>

                                                        <div className="text-[10px] text-gray-500">

                                                            {customer.city}, {customer.province}

                                                        </div>

                                                    </div>

                                                </div>

                                            </div>

                                        </td>



                                        <td className="px-4 py-3 text-center">

                                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${customer.R_Score >= 4 ? 'bg-green-100 text-green-700' : customer.R_Score <= 2 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{customer.recency} Hari</span>

                                        </td>

                                        <td className="px-4 py-3 text-center text-sm font-medium text-gray-700">{customer.frequency}x</td>

                                        <td className="px-4 py-3 text-right text-sm font-bold text-gray-800 font-mono tracking-tight">{formatRupiah(customer.monetary)}</td>

                                        

                                        <td className="px-4 py-3 text-center">

                                            <div className="flex justify-center space-x-0.5">

                                                <span className={`w-4 h-4 flex items-center justify-center text-[10px] font-bold rounded ${customer.R_Score >= 4 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>{customer.R_Score}</span>

                                                <span className={`w-4 h-4 flex items-center justify-center text-[10px] font-bold rounded ${customer.F_Score >= 4 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>{customer.F_Score}</span>

                                                <span className={`w-4 h-4 flex items-center justify-center text-[10px] font-bold rounded ${customer.M_Score >= 4 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>{customer.M_Score}</span>

                                            </div>

                                        </td>

                                        <td className="px-4 py-3">

                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide text-white shadow-sm ${customer.Segment10Color}`}>

                                                {customer.Segment10Name}

                                            </span>

                                        </td>



                                        {productColumns.map((colName, idx) => {

                                            const qty = (customer.productMap && customer.productMap[colName]) ? customer.productMap[colName] : 0;

                                            return (

                                                <td key={idx} className="px-2 py-3 text-center border-l border-gray-100">

                                                    {qty > 0 ? (

                                                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{qty}</span>

                                                    ) : (

                                                        <span className="text-gray-200 text-[10px]">-</span>

                                                    )}

                                                </td>

                                            );

                                        })}

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>

                    <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between">

                        <span className="text-xs text-gray-500">Menampilkan {filteredTableData.length} dari {activeData.length} pelanggan</span>

                    </div>

                </div>

            )}

        </div>

    );

};



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



const TimeAnalysisView = ({ rawTimeData }) => {

    const [selectedYear, setSelectedYear] = useState('All');

    const availableYears = useMemo(() => {

        if (!rawTimeData) return [];

        const years = new Set(rawTimeData.map(d => d.year));

        return Array.from(years).sort().reverse();

    }, [rawTimeData]);



    const yearlyData = useMemo(() => {

        if (!rawTimeData) return [];

        const stats = {};

        rawTimeData.forEach(d => { stats[d.year] = (stats[d.year] || 0) + d.revenue; });

        return Object.entries(stats).map(([year, revenue]) => ({ name: year, revenue })).sort((a, b) => a.name.localeCompare(b.name));

    }, [rawTimeData]);



    const { quarterlyData, monthlyData } = useMemo(() => {

        if (!rawTimeData) return { quarterlyData: [], monthlyData: [] };

        const qStats = { 'Q1': 0, 'Q2': 0, 'Q3': 0, 'Q4': 0 };

        const mStats = Array(12).fill(0);

        const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

        const filteredData = selectedYear === 'All' ? rawTimeData : rawTimeData.filter(d => d.year === selectedYear);



        filteredData.forEach(d => {

            const mIdx = d.monthIndex;

            if (mIdx >= 0 && mIdx < 12) {

                mStats[mIdx] += d.revenue;

                let quarter = mIdx <= 2 ? 'Q1' : mIdx <= 5 ? 'Q2' : mIdx <= 8 ? 'Q3' : 'Q4';

                qStats[quarter] += d.revenue;

            }

        });

        return {

            quarterlyData: Object.entries(qStats).map(([name, revenue]) => ({ name, revenue })),

            monthlyData: mStats.map((revenue, index) => ({ name: monthNames[index], revenue }))

        };

    }, [rawTimeData, selectedYear]);



    if (!rawTimeData || rawTimeData.length === 0) return <p className="p-8 text-center text-gray-500">Belum ada data waktu tersedia.</p>;



    return (

        <div className="space-y-8">

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">

                <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center"><History className="w-5 h-5 mr-2 text-blue-600" />Tren Pendapatan Tahunan (Time Series)</h3>

                <div className="h-80 w-full">

                    <ResponsiveContainer width="100%" height="100%">

                        <LineChart data={yearlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>

                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />

                            <XAxis dataKey="name" />

                            <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />

                            <Tooltip formatter={(value) => formatRupiah(value)} />

                            <Legend />

                            <Line type="monotone" dataKey="revenue" name="Pendapatan Bersih" stroke="#2563eb" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />

                        </LineChart>

                    </ResponsiveContainer>

                </div>

            </div>

            <div className="flex items-center justify-between bg-indigo-50 p-4 rounded-lg border border-indigo-100">

                 <div className="flex items-center space-x-3"><Filter className="w-5 h-5 text-indigo-600" /><span className="font-semibold text-gray-700">Filter Detail Musiman:</span></div>

                <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border bg-white shadow-sm">

                    <option value="All">Semua Tahun</option>

                    {availableYears.map(year => (<option key={year} value={year}>{year}</option>))}

                </select>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">

                    <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center justify-between"><span className="flex items-center"><Calendar className="w-5 h-5 mr-2 text-orange-500" /> Pendapatan per Kuartal</span><span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-500 font-normal">Filter: {selectedYear}</span></h3>

                    <div className="h-80 w-full">

                        <ResponsiveContainer width="100%" height="100%">

                            <BarChart data={quarterlyData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" /><XAxis dataKey="name" /><YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} /><Tooltip formatter={(value) => formatRupiah(value)} /><Bar dataKey="revenue" name="Revenue" fill="#f97316" radius={[4, 4, 0, 0]} /></BarChart>

                        </ResponsiveContainer>

                    </div>

                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">

                     <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center justify-between"><span className="flex items-center"><Calendar className="w-5 h-5 mr-2 text-green-500" /> Pendapatan per Bulan</span><span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-500 font-normal">Filter: {selectedYear}</span></h3>

                    <div className="h-80 w-full">

                        <ResponsiveContainer width="100%" height="100%">

                            <BarChart data={monthlyData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" /><XAxis dataKey="name" angle={-45} textAnchor="end" height={60} interval={0} tick={{fontSize: 10}} /><YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} /><Tooltip formatter={(value) => formatRupiah(value)} /><Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} /></BarChart>

                        </ResponsiveContainer>

                    </div>

                </div>

            </div>

        </div>

    );

};



const HeatmapAnalysisView = ({ heatmapData, maxRevenue }) => {

    const hours = Array.from({ length: 24 }, (_, i) => i);

    const days = Array.from({ length: 31 }, (_, i) => i + 1);

    const getCellColor = (value) => { if (value === 0) return 'bg-gray-50'; const opacity = Math.min(Math.max((value / maxRevenue), 0.1), 1); return `rgba(79, 70, 229, ${opacity})`; };

    const getTextColor = (value) => { if (value === 0) return 'text-gray-300'; const opacity = value / maxRevenue; return opacity > 0.5 ? 'text-white' : 'text-gray-800'; };

    if (!heatmapData || heatmapData.length === 0) return null;



    return (

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">

            <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center"><Grid3X3 className="w-5 h-5 mr-2 text-indigo-600" />Heatmap Waktu Pembelian (Jam vs Tanggal)</h3>

            <div className="overflow-x-auto pb-4">

                <div className="min-w-[1000px]">

                    <div className="grid grid-cols-[60px_repeat(24,1fr)] gap-1 mb-1"><div className="text-xs font-bold text-gray-400 flex items-end justify-center pb-1">Tgl/Jam</div>{hours.map(hour => (<div key={hour} className="text-[10px] font-bold text-gray-500 text-center">{hour.toString().padStart(2, '0')}</div>))}</div>

                    {days.map((day, dayIndex) => (

                        <div key={day} className="grid grid-cols-[60px_repeat(24,1fr)] gap-1 mb-1"><div className="text-xs font-bold text-gray-600 flex items-center justify-center bg-gray-100 rounded-sm h-8">Tgl {day}</div>{hours.map(hour => { const revenue = heatmapData[dayIndex] ? heatmapData[dayIndex][hour] : 0; return (<div key={`${day}-${hour}`} className="h-8 rounded-sm flex items-center justify-center relative group transition-all hover:ring-2 hover:ring-indigo-400 hover:z-10 cursor-pointer" style={{ backgroundColor: revenue > 0 ? getCellColor(revenue) : '#f9fafb' }}><span className={`text-[9px] font-semibold ${getTextColor(revenue)} opacity-0 group-hover:opacity-100`}>{revenue > 0 ? '•' : ''}</span><div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-xs rounded-md py-2 px-3 opacity-0 group-hover:opacity-100 pointer-events-none z-20 shadow-xl"><p className="font-bold border-b border-gray-700 pb-1 mb-1">Tanggal {day}, Pukul {hour}:00</p><p>Net Revenue:</p><p className="text-green-300 font-bold text-sm">{formatRupiah(revenue)}</p></div></div>);})}</div>

                    ))}

                </div>

            </div>

            <div className="mt-4 flex items-center justify-end text-xs text-gray-500 space-x-4"><div className="flex items-center"><div className="w-4 h-4 bg-gray-50 border border-gray-200 mr-2 rounded-sm"></div><span>Tidak Ada Transaksi</span></div><div className="flex items-center"><div className="w-4 h-4 mr-2 rounded-sm" style={{ backgroundColor: 'rgba(79, 70, 229, 0.3)' }}></div><span>Low Revenue</span></div><div className="flex items-center"><div className="w-4 h-4 mr-2 rounded-sm" style={{ backgroundColor: 'rgba(79, 70, 229, 1)' }}></div><span>High Revenue</span></div></div>

        </div>

    );

};



const DailyReportView = ({ confirmedOrders, customerSegmentationData, rawData, adsData, setView }) => {

    const [startDate, setStartDate] = useState('');

    const [endDate, setEndDate] = useState('');

    const [searchTerm, setSearchTerm] = useState('');

    const [statusFilter, setStatusFilter] = useState('All'); 

    const [currentPage, setCurrentPage] = useState(1);

    const itemsPerPage = 20;



    const getDateObj = (dateStr) => { if (!dateStr) return null; return new Date(dateStr.replace(' ', 'T')); };



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

            if ((status === 'pending' && diffDays > 14) || status === 'rts' || status === 'canceled') { revenue += parseFloat(order[COL_NET_REVENUE] || 0); count++; }

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

        

        const validRows = adsData.filter(row => {

             const name = row[ADS_CAMPAIGN_NAME] || row['campaign_name'];

             return !(!name || name === 'Total' || name === 'Results' || name === 'Summary');

        });



        if (!startDate && !endDate) {

            return validRows.reduce((acc, row) => acc + (row[ADS_AMOUNT_SPENT] || row['amount_spent'] || row['amount_spent__idr'] || 0), 0);

        }



        const start = startDate ? new Date(startDate) : new Date('1970-01-01'); start.setHours(0,0,0,0);

        const end = endDate ? new Date(endDate) : new Date('2099-12-31'); end.setHours(23,59,59,999);



        return validRows.reduce((acc, row) => {

            const dateVal = row['day'] || row['date_start'] || row['date'] || row['reporting_starts'] || row['date_created'];

            const spend = (row[ADS_AMOUNT_SPENT] || row['amount_spent'] || row['amount_spent__idr'] || 0);

            

            if (dateVal) {

                const d = parseAdDate(dateVal);

                if (d) {

                    d.setHours(0,0,0,0);

                    if (d >= start && d <= end) {

                        return acc + spend;

                    }

                }

            }

            return acc; 

        }, 0);



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

        const _totalRevenue = filteredOrders.reduce((sum, item) => sum + (item[COL_NET_REVENUE] || 0), 0);

        const _totalGrossRevenue = filteredOrders.reduce((sum, item) => sum + (item[COL_GROSS_REVENUE] || 0), 0); 

        const _totalTransactions = filteredOrders.length;

        const _aov = _totalTransactions > 0 ? _totalRevenue / _totalTransactions : 0;

        let _totalProfit = 0;

        

        // Operasional Metrics Setup

        let totalClosingTimeMinutes = 0;

        let closedOrdersCount = 0;



        filteredOrders.forEach(item => {

            const grossRev = item[COL_GROSS_REVENUE] || 0; const prodDisc = item[COL_PRODUCT_DISCOUNT] || 0; const shipDisc = item[COL_SHIPPING_DISCOUNT] || 0; const cogs = item[COL_COGS] || 0; const payFee = item[COL_PAYMENT_FEE] || 0; const shipCost = item[COL_SHIPPING_COST] || 0;

            _totalProfit += (grossRev - prodDisc - shipDisc) - cogs - payFee - shipCost;



            // Closing Time Calculation (Pending -> Confirmed)

            const pendingStr = item['pending_time'];

            const confirmStr = item[COL_CONFIRMED_TIME];

            if (pendingStr && confirmStr) {

                const d = getDateObj(pendingStr);

                const c = getDateObj(confirmStr);

                if (d && c && c > d) {

                    const diffMins = (c - d) / (1000 * 60); // minutes

                    if (diffMins > 0 && diffMins < 43200) { // filter outliers (>30 days)

                        totalClosingTimeMinutes += diffMins;

                        closedOrdersCount++;

                    }

                }

            }

        });

        

        const _avgClosingTime = closedOrdersCount > 0 ? Math.round(totalClosingTimeMinutes / closedOrdersCount) : 0;



        const _profitMargin = _totalRevenue > 0 ? (_totalProfit / _totalRevenue) * 100 : 0;

        const _totalCustomers = new Set(filteredOrders.map(o => o[COL_NAME]).filter(Boolean)).size;

        const _trendStats = Array(31).fill(null).map((_, i) => ({ day: i + 1, revenue: 0, transactions: 0 }));

        filteredOrders.forEach(item => {

            const dateStr = item[COL_CONFIRMED_TIME];

            if (dateStr) { const itemDate = getDateObj(dateStr); if (itemDate && !isNaN(itemDate.getTime())) { const dayIndex = itemDate.getDate() - 1; if (dayIndex >= 0 && dayIndex < 31) { _trendStats[dayIndex].revenue += (item[COL_NET_REVENUE] || 0); _trendStats[dayIndex].transactions += 1; }}}

        });

        const allVariantKeys = new Set(); const sourceData = (rawData && rawData.length > 0) ? rawData : filteredOrders; sourceData.forEach(row => { Object.keys(row).forEach(key => { if (key.startsWith('variant:')) allVariantKeys.add(key); }); });

        const variantColumns = Array.from(allVariantKeys).map(normalizedKey => ({ rawName: normalizedKey.replace('variant:', '').replace(/_/g, ' ').toUpperCase(), normalized: normalizedKey }));

        const variantStats = {}; let _totalSoldItems = 0;

        filteredOrders.forEach(item => {

            const orderRevenue = item[COL_NET_REVENUE] || 0; let totalItemsInOrder = 0;

            variantColumns.forEach(({ normalized }) => { const qty = parseFloat(item[normalized] || 0); if (!isNaN(qty) && qty > 0) totalItemsInOrder += qty; });

            _totalSoldItems += totalItemsInOrder;

            variantColumns.forEach(({ rawName, normalized }) => {

                const quantity = parseFloat(item[normalized] || 0);

                if (!isNaN(quantity) && quantity > 0) {

                    if (!variantStats[rawName]) variantStats[rawName] = { name: rawName, totalQuantity: 0, totalRevenue: 0 };

                    variantStats[rawName].totalQuantity += quantity;

                    const weightedRev = totalItemsInOrder > 0 ? (quantity / totalItemsInOrder) * orderRevenue : 0;

                    variantStats[rawName].totalRevenue += weightedRev;

                }

            });

        });

        const _topProducts = Object.values(variantStats).sort((a,b) => b.totalQuantity - a.totalQuantity).slice(0, 10);

        const statusCounts = {}; filteredRawData.forEach(item => { const status = (item['order_status'] || 'Unknown').toLowerCase().replace(' ', '_'); statusCounts[status] = (statusCounts[status] || 0) + 1; });

        const _statusBreakdownData = Object.entries(statusCounts).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '), value, color: STATUS_COLORS[name] || '#94a3b8' })).sort((a, b) => b.value - a.value);

        const hourlyCounts = Array(24).fill(0).map((_, i) => ({ hour: i, count: 0 })); filteredRawData.forEach(item => { const timeStr = item['draft_time'] || item['confirmed_time']; if (timeStr) { const itemDate = getDateObj(timeStr); if (itemDate && !isNaN(itemDate.getTime())) { const hour = itemDate.getHours(); if (hour >= 0 && hour < 24) hourlyCounts[hour].count += 1; }}});

        const _hourlyActivityData = hourlyCounts.map(d => ({ hour: `${d.hour.toString().padStart(2, '0')}:00`, count: d.count }));

        const uniqueCustTypeMap = new Map(); filteredOrders.forEach(item => { const name = item[COL_NAME]; const type = (item[COL_CUSTOMER_TYPE] || 'Unknown').toUpperCase(); const confirmedTimeStr = item[COL_CONFIRMED_TIME]; if (!name) return; const time = confirmedTimeStr ? new Date(confirmedTimeStr.replace(' ', 'T')).getTime() : 0; if (!uniqueCustTypeMap.has(name)) { uniqueCustTypeMap.set(name, { type, latestTime: time }); } else { const prev = uniqueCustTypeMap.get(name); if (time > prev.latestTime) { prev.type = type; prev.latestTime = time; } } });

        const typeCounts = {}; uniqueCustTypeMap.forEach(value => { const type = value.type; typeCounts[type] = (typeCounts[type] || 0) + 1; });

        const _customerTypeChartData = Object.entries(typeCounts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

        const paymentCounts = {}; filteredOrders.forEach(item => { const method = (item['payment_method'] || item['epayment_provider'] || 'Lainnya').toUpperCase().replace('_', ' '); paymentCounts[method] = (paymentCounts[method] || 0) + 1; });

        const _paymentMethodChartData = Object.entries(paymentCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

        

        const provCounts = {};

        const cityCounts = {}; 

        const subCounts = {};



        filteredOrders.forEach(item => { 

            const prov = (item[COL_PROVINCE] || '').trim();

            const city = (item[COL_CITY] || '').trim();

            const sub = (item[COL_SUBDISTRICT] || '').trim();



            if(prov && prov !== '-' && prov.toLowerCase() !== 'unknown') provCounts[prov] = (provCounts[prov] || 0) + 1;

            if(city && city !== '-' && city.toLowerCase() !== 'unknown') cityCounts[city] = (cityCounts[city] || 0) + 1;

            if(sub && sub !== '-' && sub.toLowerCase() !== 'unknown') subCounts[sub] = (subCounts[sub] || 0) + 1;

        });



        const _topProvinces = Object.entries(provCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);

        const _topCities = Object.entries(cityCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);

        const _topSubdistricts = Object.entries(subCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);

        

        const utmCounts = {}; filteredOrders.forEach(item => { let source = (item[COL_UTM_SOURCE] || 'Organic/Direct').trim(); if (!source || source === '-' || source === '') source = 'Organic/Direct'; source = source.charAt(0).toUpperCase() + source.slice(1); utmCounts[source] = (utmCounts[source] || 0) + 1; });

        const _utmSourceChartData = Object.entries(utmCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);

        const finEntityCounts = {}; filteredOrders.forEach(item => { let entity = (item[COL_FINANCIAL_ENTITY] || '').trim(); if(!entity || entity === '-' || entity.toLowerCase() === 'unknown') return; entity = entity.toUpperCase(); finEntityCounts[entity] = (finEntityCounts[entity] || 0) + 1; });

        const _financialEntityChartData = Object.entries(finEntityCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);



        return { 

            totalRevenue: _totalRevenue, totalGrossRevenue: _totalGrossRevenue, totalTransactions: _totalTransactions, aov: _aov, totalCustomers: _totalCustomers, trendData: _trendStats, topProducts: _topProducts, statusBreakdownData: _statusBreakdownData, hourlyActivityData: _hourlyActivityData, customerTypeChartData: _customerTypeChartData, paymentMethodChartData: _paymentMethodChartData, 

            utmSourceChartData: _utmSourceChartData, totalProfit: _totalProfit, profitMargin: _profitMargin, totalSoldItems: _totalSoldItems, financialEntityChartData: _financialEntityChartData,

            topLocationLists: { provinces: _topProvinces, cities: _topCities, subdistricts: _topSubdistricts },

            avgClosingTime: _avgClosingTime

        };

    }, [filteredOrders, filteredRawData, customerSegmentationData]);



    const dailyRealNetProfit = totalProfit - filteredAdSpend;

    const avgBasketSize = totalTransactions > 0 ? (totalSoldItems / totalTransactions).toFixed(1) : "0";

    

    // Helper untuk format durasi closing

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

            const revenue = order[COL_NET_REVENUE] || 0;

            if (!name) return;

            

            if (!spenderMap[name]) {

                spenderMap[name] = { 

                    name, 

                    revenue: 0, 

                    count: 0, 

                    city: order[COL_CITY] || '-',

                    province: order[COL_PROVINCE] || '-'

                };

            }

            spenderMap[name].revenue += revenue;

            spenderMap[name].count += 1;

        });

        return Object.values(spenderMap)

            .sort((a, b) => b.revenue - a.revenue)

            .slice(0, 5);

    }, [filteredOrders]);



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

        

        const headers = ["Order ID", "Tanggal Konfirmasi", "Status", "Nama Pelanggan", "No HP", "Kota", "Provinsi", "Produk (Qty)", "Total Nilai (IDR)", "Kurir", "Metode Bayar"];

        

        const rows = tableData.map(item => {

            const clean = (t) => `"${(t || '').toString().replace(/"/g, '""')}"`;

            return [

                clean(item[COL_ORDER_ID]),

                clean(item[COL_CONFIRMED_TIME] || item['draft_time']),

                clean(item['order_status']),

                clean(item[COL_NAME]),

                clean(item[COL_PHONE]),

                clean(item[COL_CITY]),

                clean(item[COL_PROVINCE]),

                clean(getProductSummary(item)),

                item[COL_NET_REVENUE] || 0,

                clean(item[COL_COURIER]),

                clean(item[COL_PAYMENT_METHOD] || item['epayment_provider'])

            ].join(",");

        });



        const csvContent = [headers.join(","), ...rows].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        const fileName = `Laporan_Transaksi_Harian_${new Date().toISOString().slice(0,10)}.csv`;

        

        link.setAttribute("href", url);

        link.setAttribute("download", fileName);

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

    };



    const handleExportRecovery = () => {

        if (filteredIssues.length === 0) { alert("Tidak ada data recovery."); return; }

        const headers = ["No", "Order ID", "Tipe Masalah", "Status", "Nama Pelanggan", "No HP (WA)", "Alamat Lengkap", "Kecamatan", "Kabupaten/Kota", "Provinsi", "Total Nilai", "Hari Sejak Order", "Produk"];

        const rows = filteredIssues.map((order, index) => {

            const clean = (t) => `"${(t || '').toString().replace(/"/g, '""')}"`;

            const variantKey = Object.keys(order).find(k => k.startsWith('variant:') && order[k] > 0);

            const prodName = variantKey ? variantKey.replace('variant:', '').replace(/_/g, ' ') : 'N/A';

            

            return [

                index + 1,

                clean(order[COL_ORDER_ID]),

                clean(order.issueType),

                clean(order['order_status']),

                clean(order[COL_NAME]),

                clean(order[COL_PHONE]), 

                clean(order[COL_ADDRESS]),

                clean(order[COL_SUBDISTRICT]),

                clean(order[COL_CITY]),

                clean(order[COL_PROVINCE]),

                order[COL_NET_REVENUE],

                order.daysSince,

                clean(prodName)

            ].join(",");

        });

        const csvContent = [headers.join(","), ...rows].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.setAttribute("href", url);

        link.setAttribute("download", `Data_Recovery_Isu_${new Date().toISOString().slice(0,10)}.csv`);

        document.body.appendChild(link); link.click(); document.body.removeChild(link);

    };



    return (

        <div className="space-y-8">

            {issueCount > 0 && (

                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center animate-pulse-slow">

                    <div className="flex items-start"><div className="flex-shrink-0"><AlertTriangle className="h-6 w-6 text-red-600" /></div><div className="ml-3"><h3 className="text-lg font-bold text-red-800">Peringatan: {issueCount} Pesanan Bermasalah Ditemukan!</h3><div className="mt-1 text-sm text-red-700"><p>Terdapat potensi kehilangan omzet sebesar <span className="font-extrabold">{formatRupiah(lostPotential)}</span> dari pesanan Pending ({'>'}14 hari), RTS, dan Cancel.</p></div></div></div>

                    <button onClick={() => setView('recovery')} className="mt-3 sm:mt-0 flex-shrink-0 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-red-700 transition-colors flex items-center">Lihat & Pulihkan <ArrowRight className="ml-2 w-4 h-4" /></button>

                </div>

            )}



            <div className="bg-white p-4 rounded-xl shadow border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-4">

                <div className="flex items-center space-x-2"><Filter className="w-5 h-5 text-indigo-600" /><h3 className="font-semibold text-gray-800">Filter Laporan:</h3></div>

                <div className="flex items-center gap-3 w-full sm:w-auto">

                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200"><span className="text-xs text-gray-500 font-bold uppercase">Dari</span><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-sm font-medium focus:outline-none text-gray-700"/></div>

                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200"><span className="text-xs text-gray-500 font-bold uppercase">Sampai</span><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-sm font-medium focus:outline-none text-gray-700"/></div>

                    {(startDate || endDate) && (<button onClick={() => { setStartDate(''); setEndDate(''); }} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors" title="Reset Filter"><XCircle className="w-5 h-5" /></button>)}

                </div>

            </div>



            <div className="space-y-6">

                

                {/* 1. FINANCIAL PERFORMANCE (3 DI ATAS, 3 DI BAWAH) */}

                <div className="bg-white p-5 rounded-xl shadow-sm border border-indigo-100">

                    <h3 className="text-base font-bold text-gray-700 flex items-center mb-4 border-b pb-2">

                        <DollarSign className="w-4 h-4 mr-2 text-green-600" />

                        Kinerja Keuangan (Financial Performance)

                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

                        {/* Baris Atas (Pemasukan) */}

                        <StatCard compact title="Total Gross Revenue" value={formatRupiah(totalGrossRevenue)} icon={Wallet} color="#8b5cf6" />

                        <StatCard compact title="Net Revenue" value={formatRupiah(totalRevenue)} icon={DollarSign} color="#2563EB" />

                        <StatCard compact title="Est. Net Profit" value={formatRupiah(totalProfit)} icon={TrendingUp} color="#10B981" description="(Gross - Disc) - COGS" />

                        

                        {/* Baris Bawah (Biaya & Hasil Akhir) */}

                        <StatCard compact title="Total Ad Spend" value={formatRupiah(filteredAdSpend)} icon={Megaphone} color="#EF4444" />

                        <StatCard compact title="Real Net Profit" value={formatRupiah(dailyRealNetProfit)} icon={Coins} color={dailyRealNetProfit > 0 ? "#10B981" : "#EF4444"} description="Laba Bersih - Ads" />

                        <StatCard compact title="Profit Margin" value={profitMargin.toFixed(1) + "%"} icon={PieChartIcon} color={profitMargin > 30 ? "#10B981" : profitMargin > 15 ? "#F59E0B" : "#EF4444"} />

                    </div>

                </div>



                {/* 2. SPLIT ROW: VOLUME & EFFICIENCY */}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Volume */}

                    <div className="bg-white p-5 rounded-xl shadow-sm border border-indigo-100 h-full">

                        <h3 className="text-base font-bold text-gray-700 flex items-center mb-4 border-b pb-2">

                            <ShoppingBag className="w-4 h-4 mr-2 text-purple-600" />

                            Volume Transaksi

                        </h3>

                        <div className="grid grid-cols-2 gap-3">

                            <StatCard compact title="Semua Pesanan" value={totalAllOrdersInPeriod} icon={ShoppingBag} color="#6366f1" unit="Order" description="Termasuk Batal/RTS" />

                            <StatCard compact title="Transaksi Valid" value={totalTransactions} icon={CheckCircle} color="#10B981" unit="Trx" description="Confirmed/Completed" />

                            <StatCard compact title="Pending Orders" value={pendingCount} icon={AlertTriangle} color="#F59E0B" unit="Order" description="Belum dibayar" />

                            <StatCard compact title="Pelanggan Unik" value={totalCustomers} icon={Users} color="#06b6d4" unit="Org" />

                        </div>

                    </div>



                    {/* Efficiency */}

                    <div className="bg-white p-5 rounded-xl shadow-sm border border-indigo-100 h-full">

                        <h3 className="text-base font-bold text-gray-700 flex items-center mb-4 border-b pb-2">

                            <Activity className="w-4 h-4 mr-2 text-blue-600" />

                            Efisiensi Operasional

                        </h3>

                        <div className="grid grid-cols-2 gap-3">

                            <StatCard compact title="Closing Rate" value={closingRate + "%"} icon={Target} color="#EC4899" unit="Conv" description="% Transaksi Valid" />

                            <StatCard compact title="Avg Closing Time" value={formatDuration(avgClosingTime)} icon={Clock} color="#F59E0B" description="Pending ke Confirmed" />

                            <StatCard compact title="Avg Basket Size" value={avgBasketSize} icon={Boxes} color="#F97316" unit="Item/Order" />

                            <StatCard compact title="Total Produk Terjual" value={totalSoldItems.toLocaleString()} icon={Package} color="#d946ef" unit="Pcs" />

                        </div>

                    </div>

                </div>



            </div>

            

            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-6 rounded-xl shadow-md border border-indigo-100">

                <h3 className="text-lg font-bold text-gray-800 flex items-center mb-4">

                    <Activity className="w-5 h-5 mr-2 text-indigo-600" />

                    Kesimpulan Analisis Data

                </h3>

                

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">

                    <div className="bg-white p-4 rounded-lg border border-indigo-50 shadow-sm flex flex-col justify-center">

                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Produk Paling Laris</p>

                        <p className="text-sm font-bold text-gray-800 line-clamp-2 leading-tight" title={summaryInsights.productName}>{summaryInsights.productName}</p>

                        <p className="text-xs text-indigo-600 font-semibold mt-1">{summaryInsights.productQty.toLocaleString()} Unit Terjual</p>

                    </div>

                    <div className="bg-white p-4 rounded-lg border border-indigo-50 shadow-sm flex flex-col justify-center">

                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Kota Top Order</p>

                        <p className="text-sm font-bold text-gray-800 line-clamp-1">{summaryInsights.cityName}</p>

                        <p className="text-xs text-teal-600 font-semibold mt-1">{summaryInsights.cityCount.toLocaleString()} Order</p>

                    </div>

                    <div className="bg-white p-4 rounded-lg border border-indigo-50 shadow-sm flex flex-col justify-center">

                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Provinsi Dominan</p>

                        <p className="text-sm font-bold text-gray-800 line-clamp-1">{summaryInsights.provinceName}</p>

                        <p className="text-xs text-blue-600 font-semibold mt-1">{summaryInsights.provinceCount.toLocaleString()} Order</p>

                    </div>

                    <div className="bg-white p-4 rounded-lg border border-indigo-50 shadow-sm flex flex-col justify-center">

                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Sumber Trafik Utama</p>

                        <p className="text-sm font-bold text-gray-800 line-clamp-1">{summaryInsights.sourceName}</p>

                        <p className="text-xs text-orange-600 font-semibold mt-1">{summaryInsights.sourceCount.toLocaleString()} Konversi</p>

                    </div>

                    

                    <div className="bg-white p-4 rounded-lg border border-indigo-50 shadow-sm flex flex-col justify-center">

                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Jam Belanja Tersibuk</p>

                        <p className="text-sm font-bold text-gray-800 line-clamp-1 flex items-center"><Clock className="w-3 h-3 mr-1 text-purple-500"/> {summaryInsights.peakHour}</p>

                        <p className="text-xs text-purple-600 font-semibold mt-1">{summaryInsights.peakHourCount.toLocaleString()} Aktivitas</p>

                    </div>

                    <div className="bg-white p-4 rounded-lg border border-indigo-50 shadow-sm flex flex-col justify-center">

                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Tanggal Omzet Tertinggi</p>

                        <p className="text-sm font-bold text-gray-800 line-clamp-1 flex items-center"><Calendar className="w-3 h-3 mr-1 text-green-500"/> Tgl {summaryInsights.bestDay}</p>

                        <p className="text-xs text-green-600 font-semibold mt-1">{summaryInsights.bestDayRevenue}</p>

                    </div>

                    <div className="bg-white p-4 rounded-lg border border-indigo-50 shadow-sm flex flex-col justify-center lg:col-span-2">

                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Total Net Revenue (Periode Ini)</p>

                        <p className="text-xl font-bold text-green-700">{summaryInsights.revenue}</p>

                        <p className="text-xs text-gray-500 font-medium mt-1">dari total {summaryInsights.trx} Transaksi Valid</p>

                    </div>

                </div>



                <div className="bg-white/60 p-4 rounded-lg border border-indigo-100 text-sm text-gray-700 leading-relaxed shadow-inner">

                    <p>

                        <span className="font-bold text-indigo-700">💡 Insight Singkat:</span> Performa penjualan periode ini didominasi oleh produk <strong>{summaryInsights.productName}</strong>. 

                        Secara geografis, kota dengan pesanan terbanyak adalah <strong>{summaryInsights.cityName}</strong>, sedangkan provinsi dengan kontribusi terbesar adalah <strong>{summaryInsights.provinceName}</strong>.

                        Mayoritas trafik datang melalui jalur <strong>{summaryInsights.sourceName}</strong>.

                        Secara tren waktu, tanggal <strong>{summaryInsights.bestDay}</strong> mencatatkan omzet tertinggi, sementara jam belanja paling sibuk (rata-rata harian) terjadi pada pukul <strong>{summaryInsights.peakHour}</strong>.

                    </p>

                </div>

            </div>



            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg border border-gray-100">

                    <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center"><Calendar className="w-5 h-5 mr-2 text-indigo-600" />Tren Harian (Akumulasi Tanggal 1 - 31)</h3>

                    <p className="text-sm text-gray-500 mb-4">Grafik gabungan: Batang untuk Net Revenue dan Garis untuk Jumlah Transaksi (Hanya Confirmed).</p>

                    <div className="h-96 w-full"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={trendData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}><CartesianGrid stroke="#f5f5f5" /><XAxis dataKey="day" label={{ value: 'Tanggal (Hari ke-)', position: 'insideBottomRight', offset: -10 }} /><YAxis yAxisId="left" orientation="left" stroke="#2563EB" tickFormatter={(val) => formatRupiah(val).replace('Rp','').replace(',00','')} /><YAxis yAxisId="right" orientation="right" stroke="#F59E0B" /><Tooltip formatter={(value, name) => [name === 'Revenue' ? formatRupiah(value) : value, name]} /><Legend /><Bar yAxisId="left" dataKey="revenue" name="Revenue" barSize={20} fill="#2563EB" radius={[4, 4, 0, 0]} /><Line yAxisId="right" type="monotone" dataKey="transactions" name="Transaksi" stroke="#F59E0B" strokeWidth={3} dot={{r: 4}} /></ComposedChart></ResponsiveContainer></div>

                </div>

                <div className="flex flex-col gap-6 h-full">

                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col flex-1 max-h-[350px]">

                        <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2 flex items-center"><Award className="w-5 h-5 mr-2 text-pink-600" />Top 5 Varian Terlaris</h3>

                        <div className="space-y-4 pt-2 overflow-y-auto pr-2 custom-scrollbar flex-1">{topProducts.length === 0 ? (<p className="text-gray-500 italic text-center py-4">Data produk tidak tersedia.</p>) : (topProducts.slice(0, 5).map((product, index) => (<div key={index} className="flex flex-col"><div className="flex justify-between items-center mb-1"><span className={`text-sm font-semibold truncate max-w-[150px] ${index === 0 ? 'text-pink-600' : 'text-gray-900'}`} title={product.name}>#{index + 1}: {product.name}</span><span className="text-sm font-extrabold text-indigo-600">{product.totalQuantity.toLocaleString()} Unit</span></div><div className="w-full bg-gray-200 rounded-full h-1.5"><div className={`h-1.5 rounded-full ${index === 0 ? 'bg-pink-500' : index === 1 ? 'bg-pink-400' : 'bg-pink-300'}`} style={{ width: `${(product.totalQuantity / topProducts[0].totalQuantity) * 100}%` }}></div></div></div>)))}</div>

                    </div>

                    

                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col flex-1 max-h-[350px]">

                        <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2 flex items-center"><UserPlus className="w-5 h-5 mr-2 text-yellow-600" />Top 5 Big Spenders</h3>

                        <div className="space-y-3 pt-2 overflow-y-auto pr-2 custom-scrollbar flex-1">

                            {topSpenders.length === 0 ? (

                                <p className="text-gray-500 italic text-center py-4 text-xs">Belum ada transaksi.</p>

                            ) : (

                                topSpenders.map((cust, index) => (

                                    <div key={index} className="flex justify-between items-center border-b border-gray-50 last:border-0 pb-2 last:pb-0">

                                        <div className="flex items-center gap-3 overflow-hidden">

                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 ${index === 0 ? 'bg-yellow-500 shadow-md' : 'bg-gray-200 text-gray-600'}`}>

                                                {index + 1}

                                            </div>

                                            <div className="min-w-0">

                                                <p className="text-xs font-bold text-gray-800 truncate max-w-[100px]" title={cust.name}>{cust.name}</p>

                                                <p className="text-[9px] text-gray-500 truncate max-w-[100px]">{cust.city}</p>

                                            </div>

                                        </div>

                                        <div className="text-right flex-shrink-0">

                                            <p className="text-xs font-bold text-green-600">{formatRupiah(cust.revenue)}</p>

                                            <p className="text-[9px] text-gray-400">{cust.count} Order</p>

                                        </div>

                                    </div>

                                ))

                            )}

                        </div>

                    </div>

                </div>

            </div>



            {/* --- NEW SECTION: Sebaran Lokasi (List) --- */}

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">

                <h3 className="text-lg font-bold text-gray-800 flex items-center mb-4 border-b pb-2">

                    <MapPin className="w-5 h-5 mr-2 text-red-600" />

                    Sebaran Lokasi Pengiriman Terbanyak (Top 10)

                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* List Provinsi */}

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex flex-col h-80">

                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center flex-shrink-0 border-b pb-2 border-gray-200">

                            <Globe className="w-3 h-3 mr-1 text-blue-500" /> Provinsi

                        </h4>

                        <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-1">

                            {topLocationLists.provinces.length === 0 ? <p className="text-xs text-gray-400 italic text-center mt-10">Data tidak cukup</p> : 

                            topLocationLists.provinces.map((loc, idx) => (

                                <div key={idx} className="flex justify-between items-center text-sm p-2 hover:bg-white hover:shadow-sm rounded transition-all">

                                    <div className="flex items-center gap-2 min-w-0">

                                        <span className={`text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0 ${idx < 3 ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'}`}>#{idx+1}</span>

                                        <span className="font-medium text-gray-700 truncate" title={loc.name}>{loc.name}</span>

                                    </div>

                                    <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full text-xs flex-shrink-0">{loc.value}</span>

                                </div>

                            ))}

                        </div>

                    </div>



                    {/* List Kota/Kabupaten */}

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex flex-col h-80">

                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center flex-shrink-0 border-b pb-2 border-gray-200">

                            <MapPin className="w-3 h-3 mr-1 text-red-500" /> Kota / Kabupaten

                        </h4>

                         <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-1">

                            {topLocationLists.cities.length === 0 ? <p className="text-xs text-gray-400 italic text-center mt-10">Data tidak cukup</p> : 

                            topLocationLists.cities.map((loc, idx) => (

                                <div key={idx} className="flex justify-between items-center text-sm p-2 hover:bg-white hover:shadow-sm rounded transition-all">

                                    <div className="flex items-center gap-2 min-w-0">

                                        <span className={`text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0 ${idx < 3 ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-500'}`}>#{idx+1}</span>

                                        <span className="font-medium text-gray-700 truncate" title={loc.name}>{loc.name}</span>

                                    </div>

                                    <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full text-xs flex-shrink-0">{loc.value}</span>

                                </div>

                            ))}

                        </div>

                    </div>



                    {/* List Kecamatan */}

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex flex-col h-80">

                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center flex-shrink-0 border-b pb-2 border-gray-200">

                            <MapPin className="w-3 h-3 mr-1 text-green-500" /> Kecamatan

                        </h4>

                         <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-1">

                            {topLocationLists.subdistricts.length === 0 ? <p className="text-xs text-gray-400 italic text-center mt-10">Data tidak cukup</p> : 

                            topLocationLists.subdistricts.map((loc, idx) => (

                                <div key={idx} className="flex justify-between items-center text-sm p-2 hover:bg-white hover:shadow-sm rounded transition-all">

                                    <div className="flex items-center gap-2 min-w-0">

                                        <span className={`text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0 ${idx < 3 ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>#{idx+1}</span>

                                        <span className="font-medium text-gray-700 truncate" title={loc.name}>{loc.name}</span>

                                    </div>

                                    <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full text-xs flex-shrink-0">{loc.value}</span>

                                </div>

                            ))}

                        </div>

                    </div>

                </div>

            </div>



            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">

                <h3 className="text-xl font-semibold mb-6 text-gray-800 border-b pb-2 flex items-center">

                    <Clock className="w-5 h-5 mr-2 text-purple-600" />

                    Analisis Jam Belanja Tersibuk (Waktu Order Dibuat)

                </h3>

                <div className="h-80 w-full">

                    <ResponsiveContainer width="100%" height="100%">

                        <AreaChart data={hourlyActivityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>

                            <defs>

                                <linearGradient id="colorHour" x1="0" y1="0" x2="0" y2="1">

                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>

                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>

                                </linearGradient>

                            </defs>

                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />

                            <XAxis dataKey="hour" tick={{ fontSize: 12 }} interval={2} />

                            <YAxis tick={{ fontSize: 12 }} />

                            <Tooltip 

                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}

                                itemStyle={{ color: '#6d28d9', fontWeight: 'bold' }}

                                formatter={(value) => [`${value} Transaksi`, 'Aktivitas']}

                            />

                            <Area type="monotone" dataKey="count" stroke="#7c3aed" strokeWidth={3} fillOpacity={1} fill="url(#colorHour)" name="Jumlah Order" activeDot={{ r: 6, strokeWidth: 0 }} />

                        </AreaChart>

                    </ResponsiveContainer>

                </div>

                <p className="text-center text-xs text-gray-500 mt-4 italic">

                    Grafik ini menunjukkan distribusi waktu saat pelanggan membuat pesanan (Checkout/Draft) dalam rentang waktu terpilih.

                </p>

            </div>



            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">

                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">

                        <CreditCard className="w-5 h-5 mr-2 text-blue-600" />

                        Distribusi Metode Pembayaran

                    </h3>

                    <div className="h-64 w-full">

                        <ResponsiveContainer width="100%" height="100%">

                            <PieChart>

                                <Pie

                                    data={paymentMethodChartData}

                                    cx="50%"

                                    cy="50%"

                                    innerRadius={60}

                                    outerRadius={80}

                                    paddingAngle={5}

                                    dataKey="value"

                                >

                                    {paymentMethodChartData.map((entry, index) => (

                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />

                                    ))}

                                </Pie>

                                <Tooltip formatter={(val) => `${val} Order`} />

                                <Legend layout="vertical" verticalAlign="bottom" align="center" wrapperStyle={{fontSize: '11px'}} />

                            </PieChart>

                        </ResponsiveContainer>

                    </div>

                </div>



                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">

                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">

                        <UserCheck className="w-5 h-5 mr-2 text-green-600" />

                        Tipe Pelanggan (New vs Repeat)

                    </h3>

                    <div className="h-64 w-full">

                        <ResponsiveContainer width="100%" height="100%">

                            <PieChart>

                                <Pie

                                    data={customerTypeChartData}

                                    cx="50%"

                                    cy="50%"

                                    outerRadius={80}

                                    dataKey="value"

                                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}

                                >

                                    {customerTypeChartData.map((entry, index) => (

                                        <Cell key={`cell-${index}`} fill={entry.name.includes('NEW') || entry.name.includes('BARU') ? '#3B82F6' : '#10B981'} />

                                    ))}

                                </Pie>

                                <Tooltip formatter={(val) => `${val} Orang`} />

                                <Legend verticalAlign="bottom" height={36}/>

                            </PieChart>

                        </ResponsiveContainer>

                    </div>

                    <p className="text-center text-[10px] text-gray-400 mt-2">Perbandingan Pelanggan Baru vs Pelanggan Lama</p>

                </div>

            </div>



            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">

                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">

                        <Landmark className="w-5 h-5 mr-2 text-teal-600" />

                        Top Financial Entity (Bank/Layanan)

                    </h3>

                    <div className="h-64 w-full">

                        <ResponsiveContainer width="100%" height="100%">

                            <BarChart data={financialEntityChartData.slice(0, 8)} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>

                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />

                                <XAxis type="number" hide />

                                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }} />

                                <Tooltip 

                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}

                                    formatter={(val) => [`${val} Order`, 'Jumlah']} 

                                    cursor={{fill: '#f0fdfa'}} 

                                />

                                <Bar dataKey="value" name="Jumlah Order" fill="#0D9488" radius={[0, 4, 4, 0]} barSize={20}>

                                    <LabelList dataKey="value" position="right" fontSize={10} fill="#64748b" />

                                </Bar>

                            </BarChart>

                        </ResponsiveContainer>

                    </div>

                    <p className="text-center text-[10px] text-gray-400 mt-2 italic">Top 8 Bank/Layanan Pembayaran</p>

                </div>



                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">

                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">

                        <Globe className="w-5 h-5 mr-2 text-orange-600" />

                        Top Sumber Trafik (UTM Source)

                    </h3>

                    <div className="h-64 w-full">

                        <ResponsiveContainer width="100%" height="100%">

                            <BarChart data={utmSourceChartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>

                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />

                                <XAxis type="number" hide />

                                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }} />

                                <Tooltip 

                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}

                                    formatter={(val) => [`${val} Order`, 'Jumlah']} 

                                    cursor={{fill: '#fff7ed'}} 

                                />

                                <Bar dataKey="value" name="Jumlah Order" fill="#F97316" radius={[0, 4, 4, 0]} barSize={20}>

                                    <LabelList dataKey="value" position="right" fontSize={10} fill="#64748b" />

                                </Bar>

                            </BarChart>

                        </ResponsiveContainer>

                    </div>

                    <p className="text-center text-[10px] text-gray-400 mt-2 italic">Top 5 Sumber Trafik Terbanyak</p>

                </div>

            </div>



            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">

                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">

                    <h3 className="text-xl font-semibold text-gray-800 flex items-center">

                        <List className="w-5 h-5 mr-2 text-indigo-600" />

                        Detail Transaksi Harian

                        <span className="ml-3 text-xs font-bold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full border border-indigo-200">

                            Total: {tableData.length} Order

                        </span>

                    </h3>

                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">

                        <div className="relative">

                            <input type="text" placeholder="Cari Order ID / Nama..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-64 text-sm" />

                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />

                        </div>

                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 cursor-pointer">

                            <option value="All">Semua Status</option>

                            <option value="completed">Completed</option>

                            <option value="confirmed">Confirmed</option>

                            <option value="pending">Pending</option>

                            <option value="canceled">Canceled</option>

                            <option value="rts">RTS</option>

                        </select>

                        <button 

                            onClick={handleExportDailyReport} 

                            disabled={tableData.length === 0}

                            className={`flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition-colors ${tableData.length === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}

                        >

                            <Download className="w-4 h-4 mr-2" />

                            Export CSV

                        </button>

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

                                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-500 align-top">

                                        {(currentPage - 1) * itemsPerPage + index + 1}.

                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap align-top">

                                        <div className="text-sm font-bold text-indigo-600">{item[COL_ORDER_ID]}</div>

                                        <div className="text-xs text-gray-500 mt-1">{item[COL_CONFIRMED_TIME] || item['draft_time']}</div>

                                    </td>

                                    <td className="px-6 py-4 align-top">

                                        <div className="text-sm font-medium text-gray-900">{item[COL_NAME]}</div>

                                        <div className="text-xs text-gray-500 mt-0.5">{item[COL_CITY] ? `${item[COL_CITY]}, ` : ''}{item[COL_PROVINCE]}</div>

                                        {customerSegmentMap.has(item[COL_NAME]) && (

                                            <span className={`inline-flex mt-1 items-center px-2 py-0.5 rounded text-[10px] font-bold text-white ${customerSegmentMap.get(item[COL_NAME]).color}`}>

                                                {customerSegmentMap.get(item[COL_NAME]).name}

                                            </span>

                                        )}

                                    </td>

                                    <td className="px-6 py-4 align-top">

                                        <div className="text-xs text-gray-700 max-w-xs line-clamp-2" title={getProductSummary(item)}>

                                            {getProductSummary(item)}

                                        </div>

                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap align-top">

                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full`} style={{ backgroundColor: (STATUS_COLORS[(item['order_status']||'').toLowerCase()] || '#94a3b8') + '20', color: STATUS_COLORS[(item['order_status']||'').toLowerCase()] || '#1e293b' }}>

                                            {(item['order_status'] || 'Unknown').toUpperCase()}

                                        </span>

                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900 align-top">

                                        {formatRupiah(item[COL_NET_REVENUE] || 0)}

                                    </td>

                                </tr>

                            )) : (

                                <tr><td colSpan="6" className="px-6 py-10 text-center text-gray-500 italic">Tidak ada data ditemukan untuk periode/filter ini.</td></tr>

                            )}

                        </tbody>

                    </table>

                </div>



                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4">

                    <div className="flex flex-1 justify-between sm:hidden">

                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Previous</button>

                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Next</button>

                    </div>

                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">

                        <div>

                            <p className="text-sm text-gray-700">

                                Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, tableData.length)}</span> of <span className="font-medium">{tableData.length}</span> results

                            </p>

                        </div>

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

    );

};



const RecoveryAnalysisView = ({ rawData }) => {

    const [filterIssue, setFilterIssue] = useState('All');

    const [filterValue, setFilterValue] = useState('All');

    const [searchTerm, setSearchTerm] = useState('');

    const [clickedChats, setClickedChats] = useState(new Set());

    

    // --- NEW: Template State ---

    const [showTemplateModal, setShowTemplateModal] = useState(false);

    const [templates, setTemplates] = useState({

        Stuck: "Halo Kak {name}, kami lihat pesanan kakak belum selesai pembayarannya. Apakah ada kendala saat transfer? Kami bantu ya kak 🙏",

        Pending: "Halo Kak {name}, kami rindu nih! Pesanannya masih tersimpan aman di sistem kami. Mau dilanjut pengirimannya kak?",

        RTS: "Halo Kak {name}, mohon maaf, paket kakak statusnya retur/gagal kirim. Boleh dibantu alamat lengkap yang baru untuk kami kirim ulang?",

        Canceled: "Halo Kak {name}, terima kasih sudah mampir. Ada yang bisa kami bantu seputar pesanan sebelumnya?",

        Default: "Halo Kak {name}, ada yang bisa kami bantu untuk pesanannya?"

    });



    const { abandonedOrders, rtsOrders, canceledOrders, stuckPendingOrders, totalLostPotential, highRiskLocations } = useMemo(() => {

        const today = new Date();

        const abandoned = [];

        const rts = [];

        const canceled = [];

        const stuck = []; 

        

        let lostRevenue = 0;



        const provStats = {};

        const cityStats = {};

        const subStats = {};

        

        rawData.forEach(order => {

            const status = (order['order_status'] || '').toLowerCase();

            const dateStr = order['draft_time'] || order['pending_time'];

            if (!dateStr) return;

            

            const orderDate = new Date(dateStr.replace(' ', 'T'));

            if (isNaN(orderDate.getTime())) return;



            const diffTime = Math.abs(today - orderDate);

            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

            const revenue = parseFloat(order[COL_NET_REVENUE] || 0);



            if (status === 'canceled' || status === 'rts' || (status === 'pending' && diffDays > 7)) {

                const p = (order[COL_PROVINCE] || 'Unknown').trim();

                const c = (order[COL_CITY] || 'Unknown').trim();

                const s = (order[COL_SUBDISTRICT] || 'Unknown').trim();



                if (p && p !== '-') provStats[p] = (provStats[p] || 0) + 1;

                if (c && c !== '-') cityStats[c] = (cityStats[c] || 0) + 1;

                if (s && s !== '-') subStats[s] = (subStats[s] || 0) + 1;

            }



            if (status === 'pending' && diffDays >= 3 && diffDays <= 7) {

                stuck.push({ ...order, daysSince: diffDays, issueType: 'Stuck Pending' });

                lostRevenue += revenue;

            }

            else if (status === 'pending' && diffDays > 7) {

                abandoned.push({ ...order, daysSince: diffDays, issueType: 'Pending (> 7 Hari)' });

                lostRevenue += revenue;

            }

            else if (status === 'rts') {

                rts.push({ ...order, daysSince: diffDays, issueType: 'RTS (Retur)' });

                lostRevenue += revenue;

            }

            else if (status === 'canceled') {

                canceled.push({ ...order, daysSince: diffDays, issueType: 'Canceled' });

                lostRevenue += revenue;

            }

        });



        const getTop10 = (stats) => Object.entries(stats)

            .map(([name, count]) => ({ name, count }))

            .sort((a, b) => b.count - a.count)

            .slice(0, 10);



        const sortFn = (a, b) => (b[COL_NET_REVENUE] || 0) - (a[COL_NET_REVENUE] || 0);

        

        return {

            abandonedOrders: abandoned.sort(sortFn),

            rtsOrders: rts.sort(sortFn),

            canceledOrders: canceled.sort(sortFn),

            stuckPendingOrders: stuck.sort(sortFn),

            totalLostPotential: lostRevenue,

            highRiskLocations: {

                provinces: getTop10(provStats),

                cities: getTop10(cityStats),

                subdistricts: getTop10(subStats)

            }

        };

    }, [rawData]);



    const { topProblematicProducts, topProblematicSources, topProblematicPayments, topProblematicFinancialEntities } = useMemo(() => {

        const prodStats = {};

        const sourceStats = {};

        const paymentStats = {};

        const financialStats = {}; 

        

        const updateStats = (storage, key, type) => {

            if (!storage[key]) storage[key] = { name: key, total: 0, cancelRts: 0, pending: 0 };

            storage[key].total += 1;

            if (type === 'cancel_rts') storage[key].cancelRts += 1;

            if (type === 'pending') storage[key].pending += 1;

        };



        const processOrders = (orders, type) => {

            orders.forEach(order => {

                Object.keys(order).forEach(key => {

                    if (key.startsWith('variant:') && parseFloat(order[key]) > 0) {

                        const rawName = key.replace('variant:', '').replace(/_/g, ' ').toUpperCase();

                        updateStats(prodStats, rawName, type);

                    }

                });



                let source = (order[COL_UTM_SOURCE] || 'Organic/Direct').trim();

                if (!source || source === '-' || source === '') source = 'Organic/Direct';

                source = source.charAt(0).toUpperCase() + source.slice(1);

                updateStats(sourceStats, source, type);



                let payment = (order[COL_PAYMENT_METHOD] || order['epayment_provider'] || 'Lainnya').trim();

                if (!payment || payment === '-') payment = 'Lainnya';

                payment = payment.toUpperCase().replace('_', ' ');

                updateStats(paymentStats, payment, type);



                let entity = (order[COL_FINANCIAL_ENTITY] || '').trim();

                if (entity && entity !== '-' && entity.toLowerCase() !== 'unknown') {

                    entity = entity.toUpperCase();

                    updateStats(financialStats, entity, type);

                }

            });

        };



        processOrders([...canceledOrders, ...rtsOrders], 'cancel_rts');

        processOrders(abandonedOrders, 'pending');



        const getTopList = (statsObj, limit = 5) => Object.values(statsObj).sort((a, b) => b.total - a.total).slice(0, limit);



        return {

            topProblematicProducts: getTopList(prodStats, 10),

            topProblematicSources: getTopList(sourceStats, 5),

            topProblematicPayments: getTopList(paymentStats, 5),

            topProblematicFinancialEntities: getTopList(financialStats, 5)

        };

    }, [canceledOrders, rtsOrders, abandonedOrders]);



    const allIssues = [...stuckPendingOrders, ...abandonedOrders, ...rtsOrders, ...canceledOrders];



    const filteredIssues = useMemo(() => {

        return allIssues.filter(item => {

            if (filterIssue !== 'All' && !item.issueType.includes(filterIssue)) return false;

            if (filterValue === 'High' && (item[COL_NET_REVENUE] || 0) < 500000) return false;

            if (searchTerm) {

                const lowerTerm = searchTerm.toLowerCase();

                const name = (item[COL_NAME] || '').toLowerCase();

                const phone = (item[COL_PHONE] || '').toLowerCase();

                const id = (item[COL_ORDER_ID] || '').toLowerCase();

                return name.includes(lowerTerm) || phone.includes(lowerTerm) || id.includes(lowerTerm);

            }

            return true;

        });

    }, [allIssues, filterIssue, filterValue, searchTerm]);



    const recoveryInsights = useMemo(() => {

        const issues = [

            { name: 'Stuck Pending (3-7 Hari)', count: stuckPendingOrders.length },

            { name: 'Pending (> 7 Hari)', count: abandonedOrders.length },

            { name: 'RTS (Retur)', count: rtsOrders.length },

            { name: 'Canceled (Batal)', count: canceledOrders.length }

        ];

        const dominantIssue = issues.reduce((max, curr) => curr.count > max.count ? curr : max, issues[0]);



        const topProv = highRiskLocations.provinces.length > 0 ? highRiskLocations.provinces[0] : { name: '-', count: 0 };

        const topCity = highRiskLocations.cities.length > 0 ? highRiskLocations.cities[0] : { name: '-', count: 0 };

        const topSub = highRiskLocations.subdistricts.length > 0 ? highRiskLocations.subdistricts[0] : { name: '-', count: 0 };



        const topProd = topProblematicProducts.length > 0 ? topProblematicProducts[0] : { name: '-', total: 0 };

        const topSource = topProblematicSources.length > 0 ? topProblematicSources[0] : { name: '-', total: 0 };

        const topPay = topProblematicPayments.length > 0 ? topProblematicPayments[0] : { name: '-', total: 0 };

        const topFin = topProblematicFinancialEntities.length > 0 ? topProblematicFinancialEntities[0] : { name: '-', total: 0 };



        return {

            issueName: dominantIssue.name,

            issueCount: dominantIssue.count,

            provName: topProv.name,

            provCount: topProv.count,

            cityName: topCity.name,

            cityCount: topCity.count,

            subName: topSub.name,

            subCount: topSub.count,

            prodName: topProd.name,

            prodCount: topProd.total,

            sourceName: topSource.name,

            sourceCount: topSource.total,

            payName: topPay.name,

            payCount: topPay.total,

            finName: topFin.name,

            finCount: topFin.total,

            totalPotential: totalLostPotential

        };

    }, [stuckPendingOrders, abandonedOrders, rtsOrders, canceledOrders, highRiskLocations, topProblematicProducts, topProblematicSources, topProblematicPayments, topProblematicFinancialEntities, totalLostPotential]);



    const handleExportRecovery = () => {

        if (filteredIssues.length === 0) { alert("Tidak ada data recovery."); return; }

        const headers = ["No", "Order ID", "Tipe Masalah", "Status", "Nama Pelanggan", "No HP (WA)", "Alamat Lengkap", "Kecamatan", "Kabupaten/Kota", "Provinsi", "Total Nilai", "Hari Sejak Order", "Produk"];

        const rows = filteredIssues.map((order, index) => {

            const clean = (t) => `"${(t || '').toString().replace(/"/g, '""')}"`;

            const variantKey = Object.keys(order).find(k => k.startsWith('variant:') && order[k] > 0);

            const prodName = variantKey ? variantKey.replace('variant:', '').replace(/_/g, ' ') : 'N/A';

            

            return [

                index + 1,

                clean(order[COL_ORDER_ID]),

                clean(order.issueType),

                clean(order['order_status']),

                clean(order[COL_NAME]),

                clean(order[COL_PHONE]), 

                clean(order[COL_ADDRESS]),

                clean(order[COL_SUBDISTRICT]),

                clean(order[COL_CITY]),

                clean(order[COL_PROVINCE]),

                order[COL_NET_REVENUE],

                order.daysSince,

                clean(prodName)

            ].join(",");

        });

        const csvContent = [headers.join(","), ...rows].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.setAttribute("href", url);

        link.setAttribute("download", `Data_Recovery_Isu_${new Date().toISOString().slice(0,10)}.csv`);

        document.body.appendChild(link); link.click(); document.body.removeChild(link);

    };



    // --- UPDATED: Dynamic WhatsApp Link Generator ---

    const getWhatsAppLink = (item, productName) => {

        const phone = item[COL_PHONE];

        if (!phone) return null;

        let p = phone.toString().replace(/[^0-9]/g, '');

        if (p.startsWith('08')) p = '62' + p.substring(1);

        else if (p.startsWith('8')) p = '62' + p;

        if (p.length < 10) return null; 



        let templateKey = 'Default';

        const issueType = item.issueType || '';

        

        if (issueType.includes('Stuck')) templateKey = 'Stuck';

        else if (issueType.includes('Pending')) templateKey = 'Pending';

        else if (issueType.includes('RTS')) templateKey = 'RTS';

        else if (issueType.includes('Canceled')) templateKey = 'Canceled';



        let message = templates[templateKey] || templates['Default'];

        

        // Variable Replacements

        message = message.replace(/{name}/g, item[COL_NAME] || 'Kak');

        message = message.replace(/{phone}/g, item[COL_PHONE] || '');

        message = message.replace(/{address}/g, item[COL_ADDRESS] || '');

        message = message.replace(/{subdistrict}/g, item[COL_SUBDISTRICT] || '');

        message = message.replace(/{product}/g, productName || 'Produk');

        message = message.replace(/{value}/g, formatRupiah(item[COL_NET_REVENUE] || 0));



        return `https://wa.me/${p}?text=${encodeURIComponent(message)}`;

    };



    const copyToClipboard = (text) => {

        const textArea = document.createElement("textarea");

        textArea.value = text;

        document.body.appendChild(textArea);

        textArea.select();

        try { document.execCommand('copy'); alert('Nomor HP berhasil disalin!'); } catch (err) { alert('Gagal menyalin.'); }

        document.body.removeChild(textArea);

    };



    const handleChatClick = (id) => {

        setClickedChats(prev => {

            const newSet = new Set(prev);

            newSet.add(id);

            return newSet;

        });

    };



    // --- NEW: Template Editor Component ---

    const TemplateEditor = () => {

        if (!showTemplateModal) return null;

        return (

            <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50 p-4">

                <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 transform transition-all max-h-[90vh] overflow-y-auto">

                    <div className="flex justify-between items-center mb-6 border-b pb-4">

                        <h3 className="text-xl font-bold text-gray-800 flex items-center">

                            <MessageSquare className="w-6 h-6 mr-2 text-indigo-600" /> 

                            Kustomisasi Script Pesan WA

                        </h3>

                        <button onClick={() => setShowTemplateModal(false)} className="text-gray-400 hover:text-gray-600">

                            <XCircle className="w-6 h-6" />

                        </button>

                    </div>

                    

                    <div className="space-y-6">

                        <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 border border-blue-200">

                            <p className="font-bold mb-2 flex items-center"><Info className="w-4 h-4 mr-1"/> Variabel Otomatis (Copy & Paste):</p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">

                                <div className="flex items-center"><code className="bg-white px-2 py-0.5 rounded border border-blue-200 font-mono font-bold mr-2 text-blue-600">{'{name}'}</code> <span className="text-xs">Nama Pelanggan</span></div>

                                <div className="flex items-center"><code className="bg-white px-2 py-0.5 rounded border border-blue-200 font-mono font-bold mr-2 text-blue-600">{'{product}'}</code> <span className="text-xs">Nama Produk</span></div>

                                <div className="flex items-center"><code className="bg-white px-2 py-0.5 rounded border border-blue-200 font-mono font-bold mr-2 text-blue-600">{'{value}'}</code> <span className="text-xs">Total Nilai Order (Rp)</span></div>

                                <div className="flex items-center"><code className="bg-white px-2 py-0.5 rounded border border-blue-200 font-mono font-bold mr-2 text-blue-600">{'{subdistrict}'}</code> <span className="text-xs">Kecamatan</span></div>

                                <div className="flex items-center"><code className="bg-white px-2 py-0.5 rounded border border-blue-200 font-mono font-bold mr-2 text-blue-600">{'{address}'}</code> <span className="text-xs">Alamat Lengkap</span></div>

                                <div className="flex items-center"><code className="bg-white px-2 py-0.5 rounded border border-blue-200 font-mono font-bold mr-2 text-blue-600">{'{phone}'}</code> <span className="text-xs">No WhatsApp</span></div>

                            </div>

                        </div>



                        {Object.keys(templates).map((key) => (

                            <div key={key}>

                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">

                                    Script: {key === 'Stuck' ? 'Stuck Pending (Hot Leads)' : key}

                                </label>

                                <textarea 

                                    value={templates[key]} 

                                    onChange={(e) => setTemplates({...templates, [key]: e.target.value})}

                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"

                                    rows={3}

                                />

                            </div>

                        ))}

                    </div>



                    <div className="mt-8 flex justify-end gap-3 pt-4 border-t">

                        <button onClick={() => setShowTemplateModal(false)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors">

                            Simpan & Tutup

                        </button>

                    </div>

                </div>

            </div>

        );

    };



    return (

        <div className="space-y-8">

            <TemplateEditor />

            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm">

                <div className="flex">

                    <div className="flex-shrink-0"><AlertTriangle className="h-5 w-5 text-red-500" /></div>

                    <div className="ml-3">

                        <h3 className="text-sm font-medium text-red-800">Zona Recovery & Retensi</h3>

                        <div className="mt-2 text-sm text-red-700">

                            <p>Halaman ini berisi daftar pesanan yang memerlukan perhatian khusus. Prioritaskan <strong>Stuck Pending (3-7 Hari)</strong> karena peluang closing masih tinggi (Hot Leads).</p>

                        </div>

                    </div>

                </div>

            </div>



            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                <div className="bg-white p-4 rounded-xl shadow-sm border border-red-100">

                    <h3 className="text-base font-bold text-gray-700 flex items-center mb-4 border-b pb-2">

                        <Zap className="w-4 h-4 mr-2 text-yellow-600" />

                        Prioritas Penanganan (High Impact)

                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                        <StatCard compact title="Potensi Omzet Hilang" value={formatRupiah(totalLostPotential)} icon={DollarSign} color="#EF4444" />

                        <StatCard compact title="Stuck Pending (3-7 Hari)" value={stuckPendingOrders.length} icon={Zap} color="#10B981" unit="Hot Leads" description="Peluang Closing Tinggi" />

                    </div>

                </div>



                <div className="bg-white p-4 rounded-xl shadow-sm border border-red-100">

                    <h3 className="text-base font-bold text-gray-700 flex items-center mb-4 border-b pb-2">

                        <XCircle className="w-4 h-4 mr-2 text-red-600" />

                        Analisis Kegagalan & Retur

                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                        <StatCard compact title="Pending (> 7 Hari)" value={abandonedOrders.length} icon={Clock} color="#F59E0B" unit="Order" />

                        <StatCard compact title="RTS (Retur)" value={rtsOrders.length} icon={Truck} color="#DC2626" unit="Order" />

                        <StatCard compact title="Canceled (Batal)" value={canceledOrders.length} icon={XCircle} color="#6B7280" unit="Order" />

                    </div>

                </div>

            </div>



            <div className="bg-gradient-to-r from-red-50 via-orange-50 to-pink-50 p-6 rounded-xl shadow-md border border-red-100">

                <h3 className="text-lg font-bold text-gray-800 flex items-center mb-4">

                    <Activity className="w-5 h-5 mr-2 text-red-600" />

                    Kesimpulan Analisis Risiko & Recovery

                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">

                    <div className="bg-white p-4 rounded-lg border border-red-50 shadow-sm flex flex-col justify-center">

                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Isu Paling Dominan</p>

                        <p className="text-sm font-bold text-red-700 line-clamp-1">{recoveryInsights.issueName}</p>

                        <p className="text-xs text-gray-500 font-semibold mt-1">{recoveryInsights.issueCount.toLocaleString()} Kasus</p>

                    </div>

                    <div className="bg-white p-4 rounded-lg border border-red-50 shadow-sm flex flex-col justify-center">

                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Provinsi Paling Rawan</p>

                        <p className="text-sm font-bold text-gray-800 line-clamp-1">{recoveryInsights.provName}</p>

                        <p className="text-xs text-red-600 font-semibold mt-1">{recoveryInsights.provCount.toLocaleString()} Isu</p>

                    </div>

                    <div className="bg-white p-4 rounded-lg border border-red-50 shadow-sm flex flex-col justify-center">

                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Kota/Kab Paling Rawan</p>

                        <p className="text-sm font-bold text-gray-800 line-clamp-1">{recoveryInsights.cityName}</p>

                        <p className="text-xs text-red-600 font-semibold mt-1">{recoveryInsights.cityCount.toLocaleString()} Isu</p>

                    </div>

                    <div className="bg-white p-4 rounded-lg border border-red-50 shadow-sm flex flex-col justify-center">

                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Kecamatan Paling Rawan</p>

                        <p className="text-sm font-bold text-gray-800 line-clamp-1">{recoveryInsights.subName}</p>

                        <p className="text-xs text-red-600 font-semibold mt-1">{recoveryInsights.subCount.toLocaleString()} Isu</p>

                    </div>

                    <div className="bg-white p-4 rounded-lg border border-red-50 shadow-sm flex flex-col justify-center">

                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Produk Sering Bermasalah</p>

                        <p className="text-sm font-bold text-gray-800 line-clamp-2 leading-tight" title={recoveryInsights.prodName}>{recoveryInsights.prodName}</p>

                        <p className="text-xs text-orange-600 font-semibold mt-1">{recoveryInsights.prodCount.toLocaleString()} Total Isu</p>

                    </div>

                    <div className="bg-white p-4 rounded-lg border border-red-50 shadow-sm flex flex-col justify-center">

                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Sumber Trafik Berisiko</p>

                        <p className="text-sm font-bold text-gray-800 line-clamp-1">{recoveryInsights.sourceName}</p>

                        <p className="text-xs text-gray-500 font-semibold mt-1">{recoveryInsights.sourceCount.toLocaleString()} Kasus</p>

                    </div>

                    <div className="bg-white p-4 rounded-lg border border-red-50 shadow-sm flex flex-col justify-center">

                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Metode Bayar Kendala</p>

                        <p className="text-sm font-bold text-gray-800 line-clamp-1">{recoveryInsights.payName}</p>

                        <p className="text-xs text-purple-600 font-semibold mt-1">{recoveryInsights.payCount.toLocaleString()} Kasus</p>

                    </div>

                    <div className="bg-white p-4 rounded-lg border border-red-50 shadow-sm flex flex-col justify-center">

                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Bank/VA Sering Gagal</p>

                        <p className="text-sm font-bold text-gray-800 line-clamp-1">{recoveryInsights.finName}</p>

                        <p className="text-xs text-blue-600 font-semibold mt-1">{recoveryInsights.finCount.toLocaleString()} Kasus</p>

                    </div>

                </div>

                

                <div className="bg-white/60 p-4 rounded-lg border border-red-100 text-sm text-gray-700 leading-relaxed shadow-inner">

                    <p>

                        <span className="font-bold text-red-700">💡 Strategi Recovery:</span> Prioritaskan penanganan pada isu <strong>{recoveryInsights.issueName}</strong>. 

                        Perketat validasi pengiriman ke area <strong>{recoveryInsights.cityName}</strong> (khususnya Kec. {recoveryInsights.subName}) dan pantau pesanan produk <strong>{recoveryInsights.prodName}</strong>.

                        Cek stabilitas gateway pembayaran untuk metode <strong>{recoveryInsights.payName}</strong> dan bank <strong>{recoveryInsights.finName}</strong> karena rasio kegagalan/pending yang tinggi.

                    </p>

                </div>

            </div>



            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">

                <h3 className="text-lg font-bold text-gray-800 flex items-center mb-4 border-b pb-2">

                    <MapPin className="w-5 h-5 mr-2 text-red-600" />

                    Zona Merah: Top 10 Lokasi Sering Batal / Retur / Pending Lama (High Risk)

                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex flex-col h-80">

                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center flex-shrink-0"><Globe className="w-3 h-3 mr-1" /> Provinsi</h4>

                        <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-1">

                            {highRiskLocations.provinces.length === 0 ? <p className="text-xs text-gray-400 italic text-center mt-10">Data tidak cukup</p> : 

                            highRiskLocations.provinces.map((loc, idx) => (

                                <div key={idx} className="flex justify-between items-center text-sm p-2 hover:bg-gray-100 rounded transition-colors">

                                    <span className="font-medium text-gray-700 truncate max-w-[120px]" title={loc.name}>{idx+1}. {loc.name}</span>

                                    <span className="font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full text-xs flex-shrink-0">{loc.count}</span>

                                </div>

                            ))}

                        </div>

                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex flex-col h-80">

                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center flex-shrink-0"><MapPin className="w-3 h-3 mr-1" /> Kota/Kabupaten</h4>

                         <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-1">

                            {highRiskLocations.cities.length === 0 ? <p className="text-xs text-gray-400 italic text-center mt-10">Data tidak cukup</p> : 

                            highRiskLocations.cities.map((loc, idx) => (

                                <div key={idx} className="flex justify-between items-center text-sm p-2 hover:bg-gray-100 rounded transition-colors">

                                    <span className="font-medium text-gray-700 truncate max-w-[120px]" title={loc.name}>{idx+1}. {loc.name}</span>

                                    <span className="font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full text-xs flex-shrink-0">{loc.count}</span>

                                </div>

                            ))}

                        </div>

                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex flex-col h-80">

                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center flex-shrink-0"><MapPin className="w-3 h-3 mr-1" /> Kecamatan</h4>

                         <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-1">

                            {highRiskLocations.subdistricts.length === 0 ? <p className="text-xs text-gray-400 italic text-center mt-10">Data tidak cukup</p> : 

                            highRiskLocations.subdistricts.map((loc, idx) => (

                                <div key={idx} className="flex justify-between items-center text-sm p-2 hover:bg-gray-100 rounded transition-colors">

                                    <span className="font-medium text-gray-700 truncate max-w-[120px]" title={loc.name}>{idx+1}. {loc.name}</span>

                                    <span className="font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full text-xs flex-shrink-0">{loc.count}</span>

                                </div>

                            ))}

                        </div>

                    </div>

                </div>

            </div>



            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                 <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">

                    <h3 className="text-lg font-bold text-gray-800 flex items-center mb-4 border-b pb-2">

                        <TrendingDown className="w-5 h-5 mr-2 text-orange-600" />

                        Top Sumber Iklan (Batal/Pending)

                    </h3>

                    <div className="space-y-3">

                        {topProblematicSources.length === 0 ? <p className="text-sm text-gray-500 italic">Data tidak cukup</p> :

                        topProblematicSources.map((source, idx) => (

                            <div key={idx} className="flex justify-between items-center bg-orange-50 p-3 rounded-lg border border-orange-100">

                                <div className="flex items-center gap-3">

                                    <span className="text-xs font-bold text-white bg-orange-400 w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full">#{idx + 1}</span>

                                    <div>

                                        <p className="text-sm font-semibold text-gray-800">{source.name}</p>

                                        <div className="flex gap-2 mt-1 text-[9px]">

                                            {source.cancelRts > 0 && <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-semibold border border-red-200">Batal: {source.cancelRts}</span>}

                                            {source.pending > 0 && <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-semibold border border-orange-200">Pending: {source.pending}</span>}

                                        </div>

                                    </div>

                                </div>

                                <div className="text-right">

                                    <p className="text-lg font-extrabold text-orange-600">{source.total}</p>

                                    <p className="text-[10px] text-gray-500 uppercase font-bold">Total</p>

                                </div>

                            </div>

                        ))}

                    </div>

                </div>



                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">

                    <h3 className="text-lg font-bold text-gray-800 flex items-center mb-4 border-b pb-2">

                        <CreditCard className="w-5 h-5 mr-2 text-purple-600" />

                        Top Metode Bayar (Batal/Pending)

                    </h3>

                    <div className="space-y-3">

                        {topProblematicPayments.length === 0 ? <p className="text-sm text-gray-500 italic">Data tidak cukup</p> :

                        topProblematicPayments.map((pay, idx) => (

                            <div key={idx} className="flex justify-between items-center bg-purple-50 p-3 rounded-lg border border-purple-100">

                                <div className="flex items-center gap-3">

                                    <span className="text-xs font-bold text-white bg-purple-400 w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full">#{idx + 1}</span>

                                    <div>

                                        <p className="text-sm font-semibold text-gray-800 max-w-[150px] truncate" title={pay.name}>{pay.name}</p>

                                        <div className="flex gap-2 mt-1 text-[9px]">

                                            {pay.cancelRts > 0 && <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-semibold border border-red-200">Batal: {pay.cancelRts}</span>}

                                            {pay.pending > 0 && <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-semibold border border-orange-200">Pending: {pay.pending}</span>}

                                        </div>

                                    </div>

                                </div>

                                <div className="text-right">

                                    <p className="text-lg font-extrabold text-purple-600">{pay.total}</p>

                                    <p className="text-[10px] text-gray-500 uppercase font-bold">Total</p>

                                </div>

                            </div>

                        ))}

                    </div>

                </div>



                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">

                    <h3 className="text-lg font-bold text-gray-800 flex items-center mb-4 border-b pb-2">

                        <Landmark className="w-5 h-5 mr-2 text-blue-600" />

                        Top Bank/Layanan (Batal/Pending)

                    </h3>

                    <div className="space-y-3">

                        {topProblematicFinancialEntities.length === 0 ? <p className="text-sm text-gray-500 italic">Data tidak cukup</p> :

                        topProblematicFinancialEntities.map((fin, idx) => (

                            <div key={idx} className="flex justify-between items-center bg-blue-50 p-3 rounded-lg border border-blue-100">

                                <div className="flex items-center gap-3">

                                    <span className="text-xs font-bold text-white bg-blue-400 w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full">#{idx + 1}</span>

                                    <div>

                                        <p className="text-sm font-semibold text-gray-800 max-w-[150px] truncate" title={fin.name}>{fin.name}</p>

                                        <div className="flex gap-2 mt-1 text-[9px]">

                                            {fin.cancelRts > 0 && <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-semibold border border-red-200">Batal: {fin.cancelRts}</span>}

                                            {fin.pending > 0 && <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-semibold border border-orange-200">Pending: {fin.pending}</span>}

                                        </div>

                                    </div>

                                </div>

                                <div className="text-right">

                                    <p className="text-lg font-extrabold text-blue-600">{fin.total}</p>

                                    <p className="text-[10px] text-gray-500 uppercase font-bold">Total</p>

                                </div>

                            </div>

                        ))}

                    </div>

                </div>

            </div>



            {topProblematicProducts.length > 0 && (

                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">

                    <h3 className="text-lg font-bold text-gray-800 flex items-center mb-4 border-b pb-2">

                        <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />

                        Top 10 Produk Paling Bermasalah (Sering Batal / Macet)

                    </h3>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                        {topProblematicProducts.map((prod, idx) => (

                            <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">

                                <div className="flex items-center gap-3 overflow-hidden">

                                    <span className={`text-xs font-bold text-white w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full ${idx < 3 ? 'bg-red-500' : 'bg-gray-400'}`}>

                                        #{idx + 1}

                                    </span>

                                    <div className="min-w-0">

                                        <p className="text-sm font-bold text-gray-800 truncate max-w-[200px] sm:max-w-[250px]" title={prod.name}>

                                            {prod.name}

                                        </p>

                                        <div className="flex gap-2 mt-1 text-[10px]">

                                            {prod.cancelRts > 0 && (

                                                <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-semibold border border-red-200">

                                                    Batal/Retur: {prod.cancelRts}

                                                </span>

                                            )}

                                            {prod.pending > 0 && (

                                                <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-semibold border border-orange-200">

                                                    Pending Lama: {prod.pending}

                                                </span>

                                            )}

                                        </div>

                                    </div>

                                </div>

                                <div className="text-right flex-shrink-0 ml-2">

                                    <p className="text-xl font-extrabold text-gray-800">{prod.total}</p>

                                    <p className="text-[9px] text-gray-500 uppercase font-bold">Total Isu</p>

                                </div>

                            </div>

                        ))}

                    </div>

                </div>

            )}



            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">

                <div className="flex flex-col mb-6 gap-4">

                    <div className="flex justify-between items-center border-b pb-2">

                        <h3 className="text-lg font-bold text-gray-800 flex items-center">

                            <RefreshCw className="w-5 h-5 mr-2 text-indigo-600" />

                            Daftar Prioritas Follow-Up (WA Blast)

                        </h3>

                        <div className="flex items-center gap-3">

                            <button 

                                onClick={() => setShowTemplateModal(true)}

                                className="flex items-center px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"

                            >

                                <MessageSquare className="w-4 h-4 mr-2" />

                                Atur Template Pesan

                            </button>

                            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">Total: {filteredIssues.length} Order</span>

                        </div>

                    </div>

                    

                    <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">

                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">

                            <div className="flex items-center space-x-2">

                                <span className="text-xs font-bold text-gray-600 uppercase">Tipe:</span>

                                <select 

                                    value={filterIssue} 

                                    onChange={(e) => setFilterIssue(e.target.value)} 

                                    className="bg-white border border-gray-300 text-gray-700 text-sm rounded-md focus:ring-indigo-500 focus:border-indigo-500 block p-1.5"

                                >

                                    <option value="All">Semua Masalah</option>

                                    <option value="Stuck">Stuck Pending (3-7 Hari)</option>

                                    <option value="Pending (> 7 Hari)">Pending ({'>'}7 Hari)</option>

                                    <option value="RTS">RTS (Retur)</option>

                                    <option value="Canceled">Canceled (Batal)</option>

                                </select>

                            </div>



                            <div className="flex items-center space-x-2">

                                <span className="text-xs font-bold text-gray-600 uppercase">Nilai:</span>

                                <select 

                                    value={filterValue} 

                                    onChange={(e) => setFilterValue(e.target.value)} 

                                    className="bg-white border border-gray-300 text-gray-700 text-sm rounded-md focus:ring-indigo-500 focus:border-indigo-500 block p-1.5"

                                >

                                    <option value="All">Semua Nilai</option>

                                    <option value="High">Big Order ({'>'} 500rb)</option>

                                </select>

                            </div>

                        </div>



                        <div className="flex items-center gap-3 w-full sm:w-auto">

                            <div className="relative w-full sm:w-64">

                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-4 w-4 text-gray-400" /></div>

                                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Cari Nama / HP / Order ID..." className="block w-full pl-10 pr-3 py-1.5 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>

                                {searchTerm && (<button onClick={() => setSearchTerm('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"><XCircle className="h-4 w-4" /></button>)}

                            </div>

                            <button onClick={handleExportRecovery} disabled={filteredIssues.length === 0} className={`flex items-center px-4 py-1.5 text-sm font-semibold rounded-md shadow-sm transition-colors whitespace-nowrap ${filteredIssues.length === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}><Download className="w-4 h-4 mr-2" />Export</button>

                        </div>

                    </div>

                </div>



                <div className="overflow-x-auto max-h-[600px]">

                    <table className="min-w-full divide-y divide-gray-200">

                        <thead className="bg-gray-50 sticky top-0 z-10">

                            <tr>

                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-10">No.</th>

                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tipe Isu</th>

                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Pelanggan</th>

                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Lokasi Kirim</th>

                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Produk Utama</th>

                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nilai Order</th>

                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi WA</th>

                            </tr>

                        </thead>

                        <tbody className="bg-white divide-y divide-gray-200">

                            {filteredIssues.length === 0 ? (

                                <tr><td colSpan="7" className="px-6 py-10 text-center text-gray-500 italic">Tidak ada isu yang ditemukan sesuai filter.</td></tr>

                            ) : (

                                filteredIssues.map((item, idx) => {

                                    const variantKey = Object.keys(item).find(k => k.startsWith('variant:') && item[k] > 0);

                                    const prodName = variantKey ? variantKey.replace('variant:', '').replace(/_/g, ' ') : '-';

                                    

                                    // Use updated getWhatsAppLink with 2 arguments

                                    const waLink = getWhatsAppLink(item, prodName);

                                    

                                    const isHighValue = (item[COL_NET_REVENUE] || 0) > 500000;

                                    const isClicked = clickedChats.has(item[COL_ORDER_ID]);



                                    return (

                                    <tr key={idx} className={`transition-colors ${item.issueType.includes('Stuck') ? 'bg-green-50 hover:bg-green-100' : 'hover:bg-red-50'}`}>

                                        <td className="px-4 py-3 text-center text-sm font-bold text-gray-600 align-top">

                                            {idx + 1}.

                                        </td>

                                        <td className="px-4 py-3 whitespace-nowrap align-top">

                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${item.issueType.includes('Stuck') ? 'bg-green-100 text-green-800 border border-green-200' : item.issueType.includes('RTS') ? 'bg-red-100 text-red-800' : item.issueType.includes('Pending') ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'}`}>

                                                {item.issueType}

                                            </span>

                                            <div className="text-[10px] text-gray-500 mt-1 pl-1">{item.daysSince} hari lalu</div>

                                        </td>

                                        <td className="px-4 py-3 text-sm font-medium text-gray-900 align-top">

                                            <div>{item[COL_NAME]}</div>

                                            <div className="flex items-center gap-1 mt-0.5">

                                                <span className="text-xs text-gray-500 font-mono select-all">{item[COL_PHONE] || '-'}</span>

                                                {item[COL_PHONE] && (

                                                    <button onClick={() => copyToClipboard(item[COL_PHONE])} className="text-gray-400 hover:text-indigo-600" title="Copy No HP">

                                                        <ClipboardCopy className="w-3 h-3" />

                                                    </button>

                                                )}

                                            </div>

                                        </td>

                                        <td className="px-4 py-3 text-xs text-gray-700 align-top max-w-[200px]">

                                            <div className="font-medium text-gray-900 mb-1 leading-snug">{item[COL_ADDRESS] || '-'}</div>

                                            <div className="font-semibold">{item[COL_SUBDISTRICT] || '-'}</div>

                                            <div>{item[COL_CITY] || '-'}</div>

                                            <div className="text-gray-500 italic">{item[COL_PROVINCE] || '-'}</div>

                                        </td>

                                        <td className="px-4 py-3 text-xs font-medium text-gray-700 max-w-[150px] truncate align-top" title={prodName}>

                                            {prodName}

                                        </td>

                                        <td className="px-4 py-3 align-top">

                                            <div className={`text-sm font-bold ${isHighValue ? 'text-red-600' : 'text-gray-900'}`}>

                                                {formatRupiah(parseFloat(item[COL_NET_REVENUE]))}

                                            </div>

                                            {isHighValue && <span className="text-[9px] font-bold text-white bg-red-500 px-1.5 rounded-sm">BIG ORDER</span>}

                                        </td>

                                        <td className="px-4 py-3 text-center align-top">

                                            {waLink ? (

                                                <a 

                                                    href={waLink} 

                                                    target="_blank" 

                                                    rel="noopener noreferrer"

                                                    onClick={() => handleChatClick(item[COL_ORDER_ID])}

                                                    className={`inline-flex items-center px-3 py-1.5 text-white text-xs font-bold rounded-full transition-colors shadow-sm whitespace-nowrap ${isClicked ? 'bg-gray-400 hover:bg-gray-500 cursor-default' : 'bg-green-500 hover:bg-green-600'}`}

                                                >

                                                    {isClicked ? <CheckCircle className="w-3 h-3 mr-1" /> : <MessageSquare className="w-3 h-3 mr-1" />}

                                                    {isClicked ? 'Sudah Follow-up' : 'Chat WA'}

                                                </a>

                                            ) : (

                                                <span className="text-gray-400 text-xs italic">No Phone</span>

                                            )}

                                        </td>

                                    </tr>

                                )})

                            )}

                        </tbody>

                    </table>

                </div>

            </div>

        </div>

    );

};



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



function DashboardCRM() {

    const initialRawData = useMemo(() => {

        if (typeof __uploaded_file_content_Desember_Januari_2025_csv !== 'undefined' && __uploaded_file_content_Desember_Januari_2025_csv.trim().length > 0) {

            return parseCSV(__uploaded_file_content_Desember_Januari_2025_csv).data;

        }

        return parseCSV(fallbackCsvData).data;

    }, []);



    const [rawData, setRawData] = useState(initialRawData); 

    const [adsData, setAdsData] = useState([]); 

    const [view, setView] = useState('summary');

    const [isUploading, setIsUploading] = useState(false);

    const [uploadError, setUploadError] = useState(null);

    const [uploadMode, setUploadMode] = useState('merge');

    const [uploadType, setUploadType] = useState('sales'); 

    const [showUploadModal, setShowUploadModal] = useState(false);



    const { utmChartAnalysis, utmSourceAnalysis, provinceAnalysis, uniqueCustomerList, geoRevenueChart, productVariantAnalysis, top3Products, customerSegmentationData, totalConfirmedRevenue, totalConfirmedOrders, timeAnalysis, rawTimeData, paymentMethodAnalysis, customerTypeAnalysis, financialEntityAnalysis, courierAnalysis, heatmapData, heatmapMaxRevenue, confirmedOrders, totalGrossProfit, dailyTrendAnalysis, topLocationLists } = useProcessedData(rawData);



    // ... (rest of the logic remains the same)



    const totalGrossRevenue = useMemo(() => {

        if (!confirmedOrders) return 0;

        return confirmedOrders.reduce((sum, item) => sum + (item[COL_GROSS_REVENUE] || 0), 0);

    }, [confirmedOrders]);



    const adsMetrics = useMemo(() => {

        if (!adsData || adsData.length === 0) return null;

        let totalSpend = 0;

        let totalImpressions = 0;

        let totalClicks = 0;

        let totalPurchases = 0;

        let totalRevenue = 0;



        adsData.forEach(row => {

            const name = row[ADS_CAMPAIGN_NAME] || row['campaign_name'];

            if (!name || name === 'Total' || name === 'Results' || name === 'Summary') return;



            const spend = (row[ADS_AMOUNT_SPENT] || row['amount_spent'] || row['amount_spent__idr'] || 0);

            totalSpend += spend;

            totalImpressions += (row[ADS_IMPRESSIONS] || 0);

            totalClicks += (row[ADS_LINK_CLICKS] || 0);

            totalPurchases += (row[ADS_PURCHASES] || row[ADS_WEBSITE_PURCHASES] || 0);

            totalRevenue += (row[ADS_CONVERSION_VALUE] || 0);

        });



        const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

        const cpr = totalPurchases > 0 ? totalSpend / totalPurchases : 0;



        return { totalSpend, totalImpressions, totalClicks, totalPurchases, totalRevenue, roas, cpr };

    }, [adsData]);



    const totalAllOrders = rawData.length;

    const totalUniqueCustomers = customerSegmentationData.length;

    const averageOrderValue = useMemo(() => {

        return totalConfirmedOrders > 0 ? totalConfirmedRevenue / totalConfirmedOrders : 0;

    }, [totalConfirmedRevenue, totalConfirmedOrders]);



    const closingRateSummary = useMemo(() => {

        return totalAllOrders > 0 ? ((totalConfirmedOrders / totalAllOrders) * 100).toFixed(2) : 0;

    }, [totalConfirmedOrders, totalAllOrders]);



    const realNetProfit = useMemo(() => {

        const adSpend = adsMetrics ? adsMetrics.totalSpend : 0;

        return totalGrossProfit - adSpend;

    }, [totalGrossProfit, adsMetrics]);



    const marketingEfficiencyRatio = useMemo(() => {

        const adSpend = adsMetrics ? adsMetrics.totalSpend : 0;

        if (adSpend === 0) return 0;

        return totalConfirmedRevenue / adSpend;

    }, [totalConfirmedRevenue, adsMetrics]);



    const handleFileUpload = async (event) => {

        setUploadError(null);

        const files = Array.from(event.target.files);

        if (files.length === 0) return;

        const invalidFile = files.find(file => file.type && !['text/csv', 'application/vnd.ms-excel'].includes(file.type) && !file.name.endsWith('.csv'));

        if (invalidFile) { setUploadError(`File "${invalidFile.name}" tidak didukung. Harap hanya unggah file CSV.`); return; }

        

        setIsUploading(true);

        const readFileAsText = (file) => {

            return new Promise((resolve, reject) => {

                const reader = new FileReader();

                reader.onload = (e) => { const content = e.target.result; const { data } = parseCSV(content); resolve(data); };

                reader.onerror = () => reject(file.name); reader.readAsText(file);

            });

        };



        try {

            const allFilesData = await Promise.all(files.map(file => readFileAsText(file)));

            const combinedNewData = allFilesData.flat();

            

            if (combinedNewData.length === 0) { 

                setUploadError('Gagal memproses file. Pastikan file berisi data.'); 

            } else {

                if (uploadType === 'sales') {

                    let updatedData;

                    if (uploadMode === 'replace') { updatedData = combinedNewData; } else {

                        const existingOrderIds = new Set(rawData.map(item => item[COL_ORDER_ID]).filter(id => id));

                        const uniqueNewData = combinedNewData.filter(item => !item[COL_ORDER_ID] || !existingOrderIds.has(item[COL_ORDER_ID]));

                        const uniqueNewDataMap = new Map();

                        uniqueNewData.forEach(item => { if (item[COL_ORDER_ID]) uniqueNewDataMap.set(item[COL_ORDER_ID], item); else uniqueNewDataMap.set(Math.random(), item); });

                        updatedData = [...rawData, ...Array.from(uniqueNewDataMap.values())];

                    }

                    setRawData(updatedData); 

                    setView('summary');

                } else {

                    if (uploadMode === 'replace') {

                        setAdsData(combinedNewData);

                    } else {

                        setAdsData([...adsData, ...combinedNewData]);

                    }

                    setView('summary'); 

                }

                

                setShowUploadModal(false); 

                event.target.value = null;

            }

        } catch (errorFileName) { 

            setUploadError(`Gagal membaca file: ${errorFileName}. Mungkin file rusak.`); 

            console.error('File read error:', errorFileName); 

        } finally { 

            setIsUploading(false); 

        }

    };

    

    const clearAllData = () => { setRawData([]); setAdsData([]); setView('summary'); };



    const UploadModal = ({ show, onClose, currentMode, setMode, onFileUpload, isUploading, uploadError, onClearData, currentType, setType }) => {

        if (!show) return null;

        return (

            <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50 p-4">

                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all">

                    <h3 className="text-2xl font-bold text-indigo-700 mb-4 flex items-center"><Upload className="w-6 h-6 mr-2" /> Unggah Data CSV</h3>

                    

                    <div className="mb-6">

                        <label className="block text-sm font-bold text-gray-700 mb-2">Jenis File Data:</label>

                        <div className="flex gap-4">

                             <label className={`flex-1 p-3 border rounded-lg cursor-pointer text-center transition-all ${currentType === 'sales' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'hover:bg-gray-50'}`}>

                                <input type="radio" name="uploadType" value="sales" checked={currentType === 'sales'} onChange={() => setType('sales')} className="hidden" />

                                <ShoppingBag className="w-6 h-6 mx-auto mb-1" />

                                <span className="text-xs font-bold">Data Penjualan (CRM/Order)</span>

                            </label>

                            <label className={`flex-1 p-3 border rounded-lg cursor-pointer text-center transition-all ${currentType === 'ads' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'hover:bg-gray-50'}`}>

                                <input type="radio" name="uploadType" value="ads" checked={currentType === 'ads'} onChange={() => setType('ads')} className="hidden" />

                                <Megaphone className="w-6 h-6 mx-auto mb-1" />

                                <span className="text-xs font-bold">Data Iklan (Meta Ads)</span>

                            </label>

                        </div>

                    </div>



                    <div className="space-y-4 mb-6">

                        <p className="text-xs text-gray-500 font-bold uppercase mb-1">Mode Upload:</p>

                        <label className="flex items-center p-3 border rounded-lg cursor-pointer transition-all hover:bg-indigo-50/50" onClick={() => setMode('merge')}>

                            <input type="radio" name="uploadMode" value="merge" checked={currentMode === 'merge'} onChange={() => setMode('merge')} className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500" />

                            <div className="ml-3"><span className="block text-sm font-medium text-gray-900 flex items-center"><PlusCircle className="w-4 h-4 mr-1 text-green-600" /> Gabungkan Data Baru</span><span className="text-xs text-gray-500">Tambahkan ke data yang sudah ada.</span></div>

                        </label>

                        <label className="flex items-center p-3 border rounded-lg cursor-pointer transition-all hover:bg-indigo-50/50" onClick={() => setMode('replace')}>

                            <input type="radio" name="uploadMode" value="replace" checked={currentMode === 'replace'} onChange={() => setMode('replace')} className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500" />

                            <div className="ml-3"><span className="block text-sm font-medium text-gray-900 flex items-center"><Trash2 className="w-4 h-4 mr-1 text-red-600" /> Ganti Semua Data Lama</span><span className="text-xs text-gray-500">Hapus data lama & ganti baru.</span></div>

                        </label>

                    </div>



                    {uploadError && (<div className="p-3 mb-4 bg-red-100 text-red-800 rounded-lg text-sm font-medium flex items-center"><AlertTriangle className="w-5 h-5 mr-2" />{uploadError}</div>)}

                    <div className="flex flex-col space-y-3"><input type="file" id="csv-upload-input" accept=".csv" multiple onChange={onFileUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" disabled={isUploading} /><button onClick={onClose} className="w-full py-2 text-sm font-semibold rounded-lg text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors" disabled={isUploading}>Batal</button></div>

                    <div className="mt-6 border-t pt-4"><button onClick={() => { if (window.confirm("Apakah Anda yakin ingin menghapus SEMUA data saat ini? Tindakan ini tidak dapat dibatalkan.")) { onClearData(); onClose(); } }} className="w-full py-2 text-xs font-semibold rounded-lg text-red-700 bg-red-100 hover:bg-red-200 transition-colors flex items-center justify-center" disabled={isUploading}><Trash2 className="w-4 h-4 mr-2" /> Hapus SEMUA Data</button></div>

                </div>

            </div>

        );

    };



    const renderContent = () => {

        // Allow TutorialView to be seen even if data is empty

        if (view === 'tutorial') return <TutorialView />;



        const isDataEmpty = rawData.length === 0 && adsData.length === 0;

        if (isDataEmpty) { return (<div className={`p-10 text-center rounded-xl shadow-md border-2 bg-yellow-50 border-yellow-300`}><AlertTriangle className={`w-12 h-12 mx-auto text-yellow-500`} /><h3 className="text-xl font-bold mt-4">Data Kosong</h3><p className="text-gray-600 mt-2">Saat ini tidak ada data pesanan yang dimuat. Harap klik **'Unggah/Kelola Data'** untuk mengimpor file CSV pertama Anda.</p></div>); }

        

        switch (view) {

            case 'summary':

                return (

                    <div className="space-y-8">

                        {adsMetrics ? (

                            <div className="space-y-6">

                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100">

                                        <h3 className="text-base font-bold text-gray-700 flex items-center mb-4 border-b pb-2">

                                            <DollarSign className="w-4 h-4 mr-2 text-green-600" />

                                            Kesehatan Bisnis (Financial Health)

                                        </h3>

                                        <div className="grid grid-cols-2 gap-3">

                                            <StatCard compact title="Total Pendapatan (Sales)" value={formatRupiah(totalConfirmedRevenue)} icon={TrendingUp} color="#4F46E5" />

                                            <StatCard compact title="Est. Net Profit (Laba)" value={formatRupiah(totalGrossProfit)} icon={Coins} color="#10B981" />

                                            <StatCard compact title="Total Ad Spend (Iklan)" value={formatRupiah(adsMetrics.totalSpend)} icon={Wallet} color="#EF4444" />

                                            <StatCard compact title="Real Net Profit (Est)" value={formatRupiah(realNetProfit)} icon={Coins} color={realNetProfit > 0 ? "#10B981" : "#EF4444"} />

                                        </div>

                                    </div>

                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100">

                                        <h3 className="text-base font-bold text-gray-700 flex items-center mb-4 border-b pb-2">

                                            <Activity className="w-4 h-4 mr-2 text-blue-600" />

                                            Efisiensi Marketing & Operasional

                                        </h3>

                                        <div className="grid grid-cols-2 gap-3">

                                            <StatCard compact title="ROAS (Iklan)" value={adsMetrics.roas.toFixed(2) + "x"} icon={Award} color={adsMetrics.roas > 4 ? "#10B981" : adsMetrics.roas > 2 ? "#F59E0B" : "#EF4444"} />

                                            <StatCard compact title="Marketing Efficiency (MER)" value={marketingEfficiencyRatio.toFixed(2) + "x"} icon={Percent} color="#8B5CF6" />

                                            <StatCard compact title="CPR (Cost Per Result)" value={formatRupiah(adsMetrics.cpr)} icon={Target} color="#F59E0B" />

                                            <StatCard compact title="AOV (Rata-rata Order)" value={formatRupiah(averageOrderValue)} icon={ShoppingBag} color="#06b6d4" />

                                        </div>

                                    </div>

                                </div>

                                <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100">

                                    <h3 className="text-base font-bold text-gray-700 flex items-center mb-4 border-b pb-2">

                                        <ShoppingBag className="w-4 h-4 mr-2 text-purple-600" />

                                        Volume Transaksi & Skala Operasional

                                    </h3>

                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

                                        <StatCard compact title="Total Semua Pesanan" value={totalAllOrders} icon={ShoppingBag} color="#6366f1" unit="Order" description="Termasuk Pending, Batal & RTS" />

                                        <StatCard compact title="Total Transaksi (Confirmed)" value={totalConfirmedOrders} icon={CheckCircle} color="#8b5cf6" unit="Trx" />

                                        <StatCard compact title="Closing Rate (Konversi CS)" value={closingRateSummary + "%"} icon={LayoutDashboard} color="#EC4899" unit="(Trx/Order)" />

                                        <StatCard compact title="Total Pelanggan Unik" value={totalUniqueCustomers} icon={Users} color="#2563EB" unit="Pelanggan" />

                                    </div>

                                </div>

                            </div>

                        ) : (

                            <div className="space-y-6">

                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100">

                                        <h3 className="text-base font-bold text-gray-700 flex items-center mb-4 border-b pb-2">

                                            <DollarSign className="w-4 h-4 mr-2 text-green-600" />

                                            Kesehatan Bisnis (Financial Health)

                                        </h3>

                                        <div className="grid grid-cols-2 gap-3">

                                             <StatCard compact title="Total Gross Revenue" value={formatRupiah(totalGrossRevenue)} icon={Wallet} color="#8b5cf6" />

                                             <StatCard compact title="Total Net Revenue" value={formatRupiah(totalConfirmedRevenue)} icon={TrendingUp} color="#4F46E5" />

                                             <StatCard compact title="Est. Net Profit (Laba)" value={formatRupiah(totalGrossProfit)} icon={Coins} color="#10B981" />

                                             <StatCard compact title="AOV (Rata-rata Order)" value={formatRupiah(averageOrderValue)} icon={DollarSign} color="#F59E0B" />

                                        </div>

                                    </div>

                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100">

                                        <h3 className="text-base font-bold text-gray-700 flex items-center mb-4 border-b pb-2">

                                            <ShoppingBag className="w-4 h-4 mr-2 text-purple-600" />

                                            Volume Transaksi & Operasional

                                        </h3>

                                        <div className="grid grid-cols-2 gap-3">

                                            <StatCard compact title="Total Semua Pesanan" value={totalAllOrders} icon={ShoppingBag} color="#6366f1" unit="Order" />

                                            <StatCard compact title="Total Transaksi (Valid)" value={totalConfirmedOrders} icon={CheckCircle} color="#8b5cf6" unit="Trx" />

                                            <StatCard compact title="Closing Rate" value={closingRateSummary + "%"} icon={Target} color="#EC4899" unit="Conv" />

                                            <StatCard compact title="Pelanggan Unik" value={totalUniqueCustomers} icon={Users} color="#2563EB" unit="Org" />

                                        </div>

                                    </div>

                                </div>

                                <div className="col-span-full bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">

                                    <div className="flex">

                                        <div className="flex-shrink-0"><Info className="h-5 w-5 text-blue-400" /></div>

                                        <div className="ml-3">

                                            <p className="text-sm text-blue-700">

                                                Tips: Unggah data <strong>Meta Ads (CSV)</strong> Anda untuk melihat analisis profitabilitas lengkap (ROAS, Real Net Profit, MER) di sini.

                                            </p>

                                        </div>

                                    </div>

                                </div>

                            </div>

                        )}

                        

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg border border-gray-100">

                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">

                                    <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />

                                    Tren Pendapatan & Transaksi (Akumulasi Harian)

                                </h3>

                                <div className="h-80 w-full">

                                    <ResponsiveContainer width="100%" height="100%">

                                        <ComposedChart data={dailyTrendAnalysis} margin={{top: 10, right: 30, left: 0, bottom: 0}}>

                                            <defs>

                                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">

                                                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>

                                                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>

                                                </linearGradient>

                                            </defs>

                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />

                                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10}} />

                                            <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tickFormatter={(val) => (val/1000000).toFixed(0) + 'jt'} tick={{fontSize: 10}} />

                                            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fontSize: 10}} />

                                            <Tooltip formatter={(value, name) => [name === 'Revenue' ? formatRupiah(value) : value, name]} />

                                            <Legend wrapperStyle={{fontSize: '12px'}} />

                                            <Area yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke="#4F46E5" fillOpacity={1} fill="url(#colorRev)" />

                                            <Line yAxisId="right" type="monotone" dataKey="transactions" name="Order" stroke="#F59E0B" dot={false} strokeWidth={2} />

                                        </ComposedChart>

                                    </ResponsiveContainer>

                                </div>

                            </div>



                            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col h-full">

                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">

                                    <Award className="w-5 h-5 mr-2 text-yellow-500" />

                                    Top 5 Produk Terlaris

                                </h3>

                                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">

                                    {productVariantAnalysis.length === 0 ? <p className="text-sm text-gray-400 italic">Data produk tidak tersedia</p> : 

                                    productVariantAnalysis.slice(0, 5).map((prod, idx) => (

                                        <div key={idx} className="mb-4 last:mb-0">

                                            <div className="flex justify-between text-xs mb-1">

                                                <span className="font-semibold text-gray-700 truncate w-3/4" title={prod.name}>{idx+1}. {prod.name}</span>

                                                <span className="font-bold text-indigo-600">{prod.totalQuantity.toLocaleString()}</span>

                                            </div>

                                            <div className="w-full bg-gray-100 rounded-full h-2">

                                                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full" style={{ width: `${(prod.totalQuantity / productVariantAnalysis[0].totalQuantity) * 100}%` }}></div>

                                            </div>

                                            <p className="text-[10px] text-gray-500 mt-1 text-right">Revenue: <span className="font-bold text-green-600">{formatRupiah(prod.totalRevenue)}</span></p>

                                        </div>

                                    ))}

                                </div>

                            </div>

                        </div>



                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">

                            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">

                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">

                                    <CreditCard className="w-5 h-5 mr-2 text-blue-600" />

                                    Metode Pembayaran (All Time)

                                </h3>

                                <div className="h-64 w-full">

                                    <ResponsiveContainer width="100%" height="100%">

                                        <PieChart>

                                            <Pie

                                                data={paymentMethodAnalysis}

                                                cx="50%"

                                                cy="50%"

                                                innerRadius={60}

                                                outerRadius={80}

                                                paddingAngle={5}

                                                dataKey="count"

                                            >

                                                {paymentMethodAnalysis.map((entry, index) => (

                                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />

                                                ))}

                                            </Pie>

                                            <Tooltip formatter={(val) => `${val} Order`} />

                                            <Legend layout="vertical" verticalAlign="bottom" align="center" wrapperStyle={{fontSize: '11px'}} />

                                        </PieChart>

                                    </ResponsiveContainer>

                                </div>

                            </div>



                            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">

                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">

                                    <UserCheck className="w-5 h-5 mr-2 text-green-600" />

                                    Tipe Pelanggan (New vs Repeat)

                                </h3>

                                <div className="h-64 w-full">

                                    <ResponsiveContainer width="100%" height="100%">

                                        <PieChart>

                                            <Pie

                                                data={customerTypeAnalysis}

                                                cx="50%"

                                                cy="50%"

                                                outerRadius={80}

                                                dataKey="count"

                                                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}

                                            >

                                                {customerTypeAnalysis.map((entry, index) => (

                                                    <Cell key={`cell-${index}`} fill={entry.name.includes('NEW') || entry.name.includes('BARU') ? '#3B82F6' : '#10B981'} />

                                                ))}

                                            </Pie>

                                            <Tooltip formatter={(val) => `${val} Orang`} />

                                            <Legend verticalAlign="bottom" height={36}/>

                                        </PieChart>

                                    </ResponsiveContainer>

                                </div>

                                <p className="text-center text-[10px] text-gray-400 mt-2">Komposisi pelanggan berdasarkan riwayat pembelian</p>

                            </div>

                        </div>



                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">

                            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">

                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">

                                    <MapPin className="w-5 h-5 mr-2 text-red-500" />

                                    Top 5 Provinsi (Revenue Tertinggi)

                                </h3>

                                <div className="h-64">

                                    <ResponsiveContainer width="100%" height="100%">

                                        <BarChart data={provinceAnalysis.slice(0, 5)} layout="vertical" margin={{top: 5, right: 30, left: 40, bottom: 5}}>

                                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />

                                            <XAxis type="number" hide />

                                            <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 10}} />

                                            <Tooltip formatter={(val) => formatRupiah(val)} />

                                            <Bar dataKey="totalRevenue" name="Revenue" fill="#EF4444" radius={[0, 4, 4, 0]} barSize={20} />

                                        </BarChart>

                                    </ResponsiveContainer>

                                </div>

                            </div>



                            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">

                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">

                                    <TrendingUp className="w-5 h-5 mr-2 text-green-500" />

                                    Top Sumber Trafik (Konversi)

                                </h3>

                                <div className="overflow-x-auto">

                                    <table className="min-w-full text-xs">

                                        <thead className="bg-gray-50">

                                            <tr>

                                                <th className="px-3 py-2 text-left text-gray-500 font-bold uppercase">Sumber</th>

                                                <th className="px-3 py-2 text-right text-gray-500 font-bold uppercase">Order</th>

                                                <th className="px-3 py-2 text-right text-gray-500 font-bold uppercase">Selesai</th>

                                                <th className="px-3 py-2 text-right text-gray-500 font-bold uppercase">Rate</th>

                                            </tr>

                                        </thead>

                                        <tbody className="divide-y divide-gray-100">

                                            {utmSourceAnalysis.slice(0, 5).map((src, i) => (

                                                <tr key={i} className="hover:bg-gray-50">

                                                    <td className="px-3 py-2 font-medium text-gray-700 capitalize truncate max-w-[120px]">{src.name}</td>

                                                    <td className="px-3 py-2 text-right text-gray-600">{src.totalOrders}</td>

                                                    <td className="px-3 py-2 text-right text-gray-600">{src.confirmedOrders}</td>

                                                    <td className="px-3 py-2 text-right font-bold text-green-600">{src.confirmedPercentage.toFixed(0)}%</td>

                                                </tr>

                                            ))}

                                        </tbody>

                                    </table>

                                </div>

                            </div>

                        </div>

                    </div>

                );

            case 'marketing': return <MarketingAnalysisView adsData={adsData} />;

            case 'daily_report': return <DailyReportView confirmedOrders={confirmedOrders} customerSegmentationData={customerSegmentationData} rawData={rawData} adsData={adsData} setView={setView} />;

            case 'recovery': return <RecoveryAnalysisView rawData={rawData} />;

            case 'segmentation': return <CustomerSegmentationView data={customerSegmentationData} />;

            case 'utm': return <div className="bg-white p-6 rounded-xl shadow-lg"><h3 className="text-xl font-semibold mb-6 text-gray-800">Analisis Sumber Iklan (Sales Data)</h3><p className="mb-4 text-sm text-gray-500">Data ini diambil dari Sales Data (UTM Source). Untuk data iklan asli (Meta Ads), silakan gunakan menu "Analisis Marketing (Ads)".</p><div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sumber Iklan</th><th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Pesanan</th><th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Pelanggan Unik</th><th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Selesai (%)</th></tr></thead><tbody className="bg-white divide-y divide-gray-200">{utmSourceAnalysis.map((source, index) => (<tr key={index} className="hover:bg-indigo-50/50 transition-colors"><td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize truncate max-w-[200px]" title={source.name}>{source.name}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-indigo-600">{source.totalOrders.toLocaleString()}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">{source.uniqueCustomers.toLocaleString()}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold"><span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium ${source.confirmedPercentage > 70 ? 'bg-green-100 text-green-800' : source.confirmedPercentage > 40 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{source.confirmedPercentage.toFixed(1)}%</span></td></tr>))}</tbody></table></div></div>;

            case 'geo': 

                const maxRevenue = provinceAnalysis.length > 0 ? provinceAnalysis[0].totalRevenue : 1; 

                return <div className="bg-white p-6 rounded-xl shadow-lg"><h3 className="text-xl font-semibold mb-6 text-gray-800">Analisis Pendapatan Berdasarkan Provinsi</h3><div className="space-y-6">{provinceAnalysis.map((province, index) => { const totalRevenue = province.totalRevenue; const confirmedRevenue = province.confirmedRevenue; const relativeWidth = maxRevenue > 0 ? (totalRevenue / maxRevenue) * 100 : 0; const confirmedPct = totalRevenue > 0 ? (confirmedRevenue / totalRevenue) * 100 : 0; const failedRevenue = province.failedRevenue; return (<div key={index} className="border-b border-gray-100 pb-3"><div className="flex justify-between items-center mb-1"><span className="text-sm font-bold text-gray-900 truncate max-w-[200px]" title={province.name}>{province.name}</span><span className="text-lg font-extrabold text-indigo-600">{formatRupiah(totalRevenue)}</span></div><div className="w-full bg-red-500 rounded-full h-4 relative overflow-hidden" style={{ maxWidth: `${relativeWidth}%`, minWidth: '50px' }}><div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${confirmedPct}%` }} title={`Selesai: ${formatRupiah(confirmedRevenue)} (${confirmedPct.toFixed(0)}%)`}></div></div><div className="flex justify-between text-xs mt-2 text-gray-600 flex-wrap gap-2"><div className="flex items-center space-x-2"><div className="w-3 h-3 bg-green-500 rounded-full"></div><span>Selesai: {formatRupiah(confirmedRevenue)} ({confirmedPct.toFixed(0)}%)</span></div><div className="flex items-center space-x-2"><div className="w-3 h-3 bg-red-500 rounded-full"></div><span>Gagal: {formatRupiah(failedRevenue)} ({(100 - confirmedPct).toFixed(0)}%)</span></div></div></div>);})}</div></div>;

            case 'product': 

                return <ProductAnalysisView productData={productVariantAnalysis} />;

            case 'time': return <TimeAnalysisView rawTimeData={rawTimeData} />;

            case 'heatmap': return <HeatmapAnalysisView heatmapData={heatmapData} maxRevenue={heatmapMaxRevenue} />;

            case 'tutorial': return <TutorialView />;

            default: return null;

        }

    };

    

    return (

        <div className="h-screen bg-gray-50 font-sans flex flex-col overflow-hidden">

            <header className="p-4 sm:p-8 bg-white shadow-lg flex justify-between items-center flex-wrap gap-4 flex-shrink-0 z-30 relative">

                <div><div className="flex items-center mb-1"><AppLogo /></div><p className="text-gray-500 mt-1 text-sm">Dasbor Analisis Data Penjualan & Marketing Anda</p></div>

                <button onClick={() => setShowUploadModal(true)} className="flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg shadow-md transition-colors bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer" disabled={isUploading}><Upload className="w-5 h-5 mr-2" />Unggah/Kelola Data</button>

            </header>

            <div className="flex flex-1 overflow-hidden relative">

                <nav className="hidden lg:block w-64 flex-shrink-0 p-4 bg-white shadow-2xl overflow-y-auto z-20">

                    <h3 className="text-xs font-semibold uppercase text-gray-500 mb-4 mt-1 px-4">Menu Utama</h3>

                    <div className="flex flex-col space-y-3">

                        <NavButton id="summary" name="Ringkasan Utama" view={view} setView={setView} icon={LayoutDashboard} />

                        <NavButton id="marketing" name="Analisis Marketing (Ads)" view={view} setView={setView} icon={Megaphone} />

                        <NavButton id="daily_report" name="Laporan Harian & Detail" view={view} setView={setView} icon={FileText} />

                        <NavButton id="recovery" name="Recovery & Isu Order" view={view} setView={setView} icon={AlertTriangle} />

                        <NavButton id="segmentation" name="Segmen Pelanggan (RFM)" view={view} setView={setView} icon={Layers} />

                        <NavButton id="product" name="Analisis Produk & Varian" view={view} setView={setView} icon={Boxes} />

                        <NavButton id="utm" name="Analisis Sumber Iklan" view={view} setView={setView} icon={TrendingUp} />

                        <NavButton id="geo" name="Peta Penjualan (Geografis)" view={view} setView={setView} icon={MapPin} />

                        <NavButton id="heatmap" name="Heatmap Waktu" view={view} setView={setView} icon={Grid3X3} />

                        <NavButton id="time" name="Analisis Tren Waktu" view={view} setView={setView} icon={History} />

                        <div className="border-t border-gray-100 my-2 pt-2"></div>

                        <NavButton id="tutorial" name="Panduan & Bantuan" view={view} setView={setView} icon={BookOpen} />

                    </div>

                </nav>

                <div className="flex-1 overflow-y-auto p-4 sm:p-8 relative z-10">

                    <nav className="mb-6 lg:hidden overflow-x-auto whitespace-nowrap"><div className="flex space-x-3 p-1"><NavButton id="summary" name="Ringkasan Utama" view={view} setView={setView} icon={LayoutDashboard} /><NavButton id="marketing" name="Analisis Ads" view={view} setView={setView} icon={Megaphone} /><NavButton id="daily_report" name="Laporan Harian & Detail" view={view} setView={setView} icon={FileText} /><NavButton id="recovery" name="Recovery & Isu" view={view} setView={setView} icon={AlertTriangle} /><NavButton id="segmentation" name="Segmen Pelanggan (RFM)" view={view} setView={setView} icon={Layers} /><NavButton id="product" name="Analisis Produk & Varian" view={view} setView={setView} icon={Boxes} /><NavButton id="utm" name="Analisis Sumber Iklan" view={view} setView={setView} icon={TrendingUp} /><NavButton id="geo" name="Peta Penjualan (Geografis)" view={view} setView={setView} icon={MapPin} /><NavButton id="heatmap" name="Heatmap Waktu" view={view} setView={setView} icon={Grid3X3} /><NavButton id="time" name="Analisis Tren Waktu" view={view} setView={setView} icon={History} /><NavButton id="tutorial" name="Panduan" view={view} setView={setView} icon={BookOpen} /></div></nav>

                    {uploadError && (<div className="p-4 mb-6 bg-red-100 text-red-800 rounded-lg text-sm font-medium flex items-center shadow-md"><AlertTriangle className="w-5 h-5 mr-2" />{uploadError}</div>)}

                    <main className="transition-all duration-300">{renderContent()}</main>

                    <footer className="mt-12 pt-6 border-t border-gray-200 text-center text-xs text-gray-400">AI Intelligence Platform v34.1 | Total Sales Data: {totalAllOrders.toLocaleString()} | Total Ads Data: {adsData.length.toLocaleString()}</footer>

                </div>

            </div>

            <UploadModal 

                show={showUploadModal} 

                onClose={() => setShowUploadModal(false)} 

                currentMode={uploadMode} 

                setMode={setUploadMode} 

                currentType={uploadType}

                setType={setUploadType}

                onFileUpload={handleFileUpload} 

                isUploading={isUploading} 

                uploadError={uploadError} 

                onClearData={clearAllData} 

            />

        </div>

    );

};



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

        {/* Header Kecil untuk Logout (Opsional, karena di Dashboard sudah ada UserButton, tapi ini untuk jaga-jaga) */}

        <div className="fixed top-4 right-4 z-50">

           <UserButton afterSignOutUrl="/" />

        </div>

        

        {/* Panggil Komponen Dashboard Aslimu */}

        <DashboardCRM /> 

      </SignedIn>



    </div>

  );

}



export default App;