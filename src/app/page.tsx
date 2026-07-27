'use client';

import { useState, useEffect } from 'react';
import { trackMetaPurchase } from '@/components/MetaPixel';
import {
  ShoppingBag,
  PhoneCall,
  ShieldCheck,
  CheckCircle2,
  Truck,
  Droplets,
  Sparkles,
  Plus,
  Minus,
  Check,
  Star,
  RotateCcw,
  Clock
} from 'lucide-react';

const CALL_NUMBER = '01797-939935';

export interface ProductDesign {
  id: string;
  code: string;
  title: string;
  regularPrice: number;
  offerPrice: number;
  image: string;
}

const DESIGN_LIST: ProductDesign[] = [];

export default function RiktooStyleLandingPage() {
  const [designList, setDesignList] = useState<ProductDesign[]>([]);

  // Selected items state: object mapping design ID to { selected: boolean, quantity: number }
  const [selectedItems, setSelectedItems] = useState<{
    [key: string]: { selected: boolean; quantity: number };
  }>({});

  const [deliveryZone, setDeliveryZone] = useState<'inside_dhaka' | 'sub_dhaka' | 'outside_dhaka'>('inside_dhaka');
  const [deliveryCharges, setDeliveryCharges] = useState({
    inside_dhaka: 70,
    sub_dhaka: 100,
    outside_dhaka: 130,
  });
  const [callNumber, setCallNumber] = useState(CALL_NUMBER);
  const [whatsappNumber, setWhatsappNumber] = useState('01797-939935');
  
  // Customer inputs
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [orderSuccess, setOrderSuccess] = useState<any>(null);

  // 3-day countdown timer (resets every 3 days, persists via localStorage)
  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
  const getOrSetStartTime = () => {
    if (typeof window === 'undefined') return Date.now();
    const stored = localStorage.getItem('vb_offer_start');
    const now = Date.now();
    if (!stored) {
      localStorage.setItem('vb_offer_start', String(now));
      return now;
    }
    const start = Number(stored);
    const elapsed = now - start;
    if (elapsed >= THREE_DAYS_MS) {
      localStorage.setItem('vb_offer_start', String(now));
      return now;
    }
    return start;
  };

  const calcTimeLeft = () => {
    const start = getOrSetStartTime();
    const elapsed = Date.now() - start;
    let remaining = THREE_DAYS_MS - elapsed;
    if (remaining < 0) remaining = 0;
    const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
    const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return { days, hours, minutes, seconds };
  };

  const [timeLeft, setTimeLeft] = useState({ days: 2, hours: 23, minutes: 59, seconds: 59 });

  useEffect(() => {
    setTimeLeft(calcTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(calcTimeLeft());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      [id]: {
        selected: !prev[id]?.selected,
        quantity: prev[id]?.quantity || 1,
      },
    }));
  };

  const updateQuantity = (id: string, delta: number) => {
    setSelectedItems((prev) => {
      const current = prev[id] || { selected: true, quantity: 1 };
      const newQty = Math.max(1, current.quantity + delta);
      return {
        ...prev,
        [id]: {
          selected: true, // auto select if changing quantity
          quantity: newQty,
        },
      };
    });
  };

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (data.products) {
          setDesignList(data.products);
          if (data.products.length > 0) {
            setSelectedItems({
              [data.products[0].id]: { selected: true, quantity: 1 },
            });
          }
        }
      })
      .catch((err) => console.error('Error fetching products:', err));
  }, []);

  // Auto-slide carousel for hero image
  const [carouselIndex, setCarouselIndex] = useState(0);

  useEffect(() => {
    if (designList.length <= 1) return;
    const timer = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % designList.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [designList.length]);


  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setDeliveryCharges({
            inside_dhaka: Number(data.dhakaDelivery) || 70,
            sub_dhaka: Number(data.subDhakaDelivery) || 100,
            outside_dhaka: Number(data.outsideDelivery) || 130,
          });
          if (data.phoneNumber) {
            setCallNumber(data.phoneNumber);
          }
          if (data.whatsappNumber) {
            setWhatsappNumber(data.whatsappNumber);
          }
        }
      })
      .catch((err) => console.error('Error fetching settings:', err));
  }, []);

  // Calculate Order Totals
  const selectedList = designList.filter((d) => selectedItems[d.id]?.selected);
  const subtotal = selectedList.reduce(
    (sum, d) => sum + d.offerPrice * (selectedItems[d.id]?.quantity || 1),
    0
  );
  const deliveryCharge = deliveryCharges[deliveryZone] || 70;
  const grandTotal = subtotal + deliveryCharge;

  const scrollToCheckout = (designId?: string) => {
    if (designId) {
      setSelectedItems((prev) => ({
        ...prev,
        [designId]: { selected: true, quantity: prev[designId]?.quantity || 1 },
      }));
    }
    const elem = document.getElementById('checkout-section');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (selectedList.length === 0) {
      setErrorMsg('দয়া করে কমপক্ষে ১টি ডিজাইন সিলেক্ট করুন');
      return;
    }
    if (!customerName.trim()) {
      setErrorMsg('দয়া করে আপনার নাম লিখুন');
      return;
    }
    if (!phone.trim() || phone.trim().length < 11) {
      setErrorMsg('দয়া করে সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন');
      return;
    }
    if (!address.trim()) {
      setErrorMsg('দয়া করে আপনার সম্পূর্ণ ঠিকানা লিখুন');
      return;
    }

    setLoading(true);

    try {
      const itemsPayload = selectedList.map((d) => ({
        id: d.id,
        code: d.code,
        title: d.title,
        price: d.offerPrice,
        quantity: selectedItems[d.id].quantity,
      }));

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          phone,
          address,
          deliveryZone,
          deliveryCharge,
          selectedItems: itemsPayload,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'অর্ডার করতে সমস্যা হয়েছে');
      }

      // Meta Pixel Purchase Event
      trackMetaPurchase(grandTotal, data.order.orderNumber);

      setOrderSuccess(data.order);
    } catch (err: any) {
      setErrorMsg(err.message || 'অর্ডার সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBEB] text-[#1F2937] font-['Hind_Siliguri',sans-serif] pb-24 md:pb-12">
      <style>{`
        @keyframes fadeInDown { from { opacity:0; transform:translateY(-20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeInUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeInScale { from { opacity:0; transform:scale(0.92); } to { opacity:1; transform:scale(1); } }
        @keyframes floatY { 0%,100% { transform:translateY(0px); } 50% { transform:translateY(-8px); } }
        @keyframes carouselFadeIn { from { opacity:0; transform:scale(1.04); } to { opacity:1; transform:scale(1); } }
        @keyframes slideInLeft { from { opacity:0; transform:translateX(-30px); } to { opacity:1; transform:translateX(0); } }
        @keyframes slideInRight { from { opacity:0; transform:translateX(30px); } to { opacity:1; transform:translateX(0); } }
        
        @keyframes pulseGlowGold {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.7), 0 8px 25px rgba(0, 0, 0, 0.25);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 0 12px rgba(251, 191, 36, 0), 0 12px 35px rgba(251, 191, 36, 0.45);
            transform: scale(1.025);
          }
        }

        @keyframes pulseGlowCall {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.6);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(52, 211, 153, 0);
            transform: scale(1.015);
          }
        }

        @keyframes offerBoxPulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.8), 0 10px 30px rgba(245, 158, 11, 0.3);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 0 14px rgba(245, 158, 11, 0), 0 14px 40px rgba(245, 158, 11, 0.5);
            transform: scale(1.03);
          }
        }

        @keyframes phoneRing {
          0%, 100% { transform: rotate(0deg) scale(1); }
          10% { transform: rotate(-14deg) scale(1.15); }
          20% { transform: rotate(14deg) scale(1.15); }
          30% { transform: rotate(-10deg) scale(1.15); }
          40% { transform: rotate(10deg) scale(1.15); }
          50% { transform: rotate(0deg) scale(1); }
        }

        @keyframes shimmerLight {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }

        @keyframes waBouncePulse {
          0%, 100% {
            transform: translateY(0) scale(1);
            box-shadow: 0 4px 20px rgba(37, 211, 102, 0.5);
          }
          50% {
            transform: translateY(-8px) scale(1.08);
            box-shadow: 0 10px 30px rgba(37, 211, 102, 0.8), 0 0 0 12px rgba(37, 211, 102, 0);
          }
        }

        .anim-fadeInDown { animation: fadeInDown 0.7s ease both; }
        .anim-fadeInUp { animation: fadeInUp 0.7s ease both; }
        .anim-fadeInScale { animation: fadeInScale 0.6s ease both; }
        .anim-float { animation: floatY 3s ease-in-out infinite; }
        .anim-slideInLeft { animation: slideInLeft 0.6s ease both; }
        .anim-slideInRight { animation: slideInRight 0.6s ease both; }
        .anim-pulseGlowGold { animation: pulseGlowGold 2.2s ease-in-out infinite; }
        .anim-pulseGlowCall { animation: pulseGlowCall 2s ease-in-out infinite; }
        .anim-offerBoxPulse { animation: offerBoxPulse 2.5s ease-in-out infinite; }
        .anim-phoneRing { animation: phoneRing 2.5s ease-in-out infinite; }
        .anim-shimmerLight { animation: shimmerLight 3s infinite; }
        .anim-waBouncePulse { animation: waBouncePulse 2.2s ease-in-out infinite; }
        .card-hover { transition: transform 0.25s ease, box-shadow 0.25s ease; }
        .card-hover:hover { transform: translateY(-4px) scale(1.02); box-shadow: 0 12px 32px rgba(20,83,45,0.35); }
      `}</style>
      {/* Top Banner Notice */}
      <div className="bg-[#14532D] text-white text-center py-2.5 px-4 border-b border-green-800 anim-fadeInDown">
        <div className="flex items-center justify-center gap-2 text-base md:text-lg font-bold">
          <Sparkles className="w-5 h-5 text-amber-300 animate-spin shrink-0" />
          <span>🔥 স্পেশাল অফার – মাত্র ২৫০ টাকা!</span>
        </div>
        <div className="text-amber-300 font-extrabold text-base md:text-lg mt-0.5">
          অফারটি শেষ হতে বাকি: {timeLeft.days} দিন, {String(timeLeft.hours).padStart(2, '0')} ঘণ্টা, {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')} মিনিট
        </div>
      </div>

      <div className="max-w-xl mx-auto px-3 py-4 space-y-6">
        
        {/* Main Hero Container */}
        <div className="bg-gradient-to-b from-[#166534] to-[#14532D] rounded-3xl p-5 border-2 border-green-400/40 shadow-2xl space-y-5 text-center anim-fadeInScale">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 bg-green-950/80 border border-green-400/60 text-green-200 text-xs md:text-sm font-semibold px-3 py-1.5 rounded-full">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>সাইড দিয়ে বর্ডার সেলাই করা 3D ডিজাইনের Floor Mat</span>
          </div>

          {/* Main Title */}
          <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
            প্রথম দেখাতেই ঘরের সৌন্দর্য বাড়িয়ে তুলুন
          </h1>

          {/* Subtitle */}
          <p className="text-green-200 text-sm md:text-base font-semibold -mt-2">
            প্রিমিয়াম 3D ডোর ম্যাট — সুন্দর, নিরাপদ ও পরিচ্ছন্ন ঘরের জন্য।
          </p>

          {/* Bullet Points */}
          <div className="bg-green-950/50 p-3.5 rounded-2xl border border-green-500/30 text-left space-y-2 text-sm text-green-100">
            {[
              'দ্রুত পানি শোষণ করে',
              'অ্যান্টি-স্লিপ ব্যাকিং',
              'ধুলো ও ময়লা আটকে রাখে',
              'সহজে পরিষ্কার করা যায়',
              'টেকসই ও দীর্ঘস্থায়ী',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <Check className="w-5 h-5 text-emerald-400 font-bold shrink-0 mt-0.5" />
                <span>{item}</span>
              </div>
            ))}
          </div>


          {/* Pricing Highlight Box */}
          <div className="bg-[#FBBF24] text-green-950 p-4 rounded-2xl font-extrabold text-sm md:text-base border-2 border-amber-300 space-y-1 relative overflow-hidden anim-offerBoxPulse">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent anim-shimmerLight pointer-events-none" />
            <p className="flex items-center justify-center gap-1.5 text-base md:text-lg">
              <span className="animate-bounce">🔥</span>
              <span>মাত্র ৩ দিনের বিশেষ অফার</span>
            </p>
            <p className="text-lg md:text-2xl text-green-950 font-black">
              বর্ডার সেলাই করা মাত্র <span className="text-rose-700 underline underline-offset-4 decoration-2">২৫০ টাকা</span> পিস
            </p>
          </div>

          {/* Feature Badges */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { emoji: '🛡️', label: 'অ্যান্টি-স্লিপ' },
              { emoji: '💧', label: 'দ্রুত পানি শোষণ' },
              { emoji: '✨', label: 'প্রিমিয়াম 3D' },
              { emoji: '🧼', label: 'সহজে পরিষ্কার' },
              { emoji: '🌱', label: 'পরিবেশবান্ধব' },
              { emoji: '🚚', label: 'দ্রুত ডেলিভারি' },
            ].map((badge, i) => (
              <span key={i} className="bg-green-900/80 border border-green-400/50 text-green-100 text-xs px-2 py-2 rounded-xl font-bold flex flex-col items-center gap-1 text-center hover:scale-105 transition">
                <span className="text-xl leading-none">{badge.emoji}</span>
                {badge.label}
              </span>
            ))}
          </div>


          {/* Hero Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={() => scrollToCheckout()}
              className="w-full bg-white hover:bg-slate-100 text-green-950 font-black text-lg md:text-xl py-3.5 px-6 rounded-2xl shadow-xl transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2.5 anim-pulseGlowGold relative overflow-hidden group cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-200/40 to-transparent anim-shimmerLight pointer-events-none" />
              <ShoppingBag className="w-6 h-6 text-green-700 animate-bounce" />
              <span>🛒 আজই অর্ডার করুন</span>
            </button>

            <a
              href={`tel:${callNumber}`}
              className="w-full bg-green-950/90 border-2 border-emerald-400 hover:bg-green-900 text-white font-extrabold py-3 px-6 rounded-2xl text-center block text-base shadow-lg transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2.5 anim-pulseGlowCall"
            >
              <PhoneCall className="w-5 h-5 text-emerald-400 anim-phoneRing shrink-0" />
              <span>📞 অর্ডার করতে কল করুন</span>
            </a>
          </div>
        </div>

        {/* Auto-Sliding Hero Carousel */}
        {designList.length > 0 && (
          <div className="bg-gradient-to-b from-[#14532D] to-[#15803D] rounded-3xl p-3 border-2 border-green-500/40 shadow-xl overflow-hidden anim-fadeInUp">
            <div className="relative rounded-2xl overflow-hidden border border-green-400/30 group aspect-[4/3]">
              {/* Horizontal Flex Track */}
              <div
                className="w-full h-full flex transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${carouselIndex * 100}%)` }}
              >
                {designList.map((item) => (
                  <div key={item.id} className="w-full h-full shrink-0 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image}
                      alt={item.code}
                      className="w-full h-full object-cover"
                    />
                    {/* Code badge – top left */}
                    <div className="absolute top-3 left-3 bg-rose-600 text-white font-extrabold text-sm px-3 py-1 rounded-xl shadow-lg border border-white/20 backdrop-blur-sm z-10">
                      {item.code}
                    </div>
                  </div>
                ))}
              </div>

              {/* Dot indicators */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                {designList.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCarouselIndex(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === carouselIndex ? 'bg-white w-6' : 'bg-white/40 w-2'
                    }`}
                  />
                ))}
              </div>
              {/* Gradient overlay bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-green-950/60 to-transparent pointer-events-none z-10" />
            </div>
            {/* Product title below carousel */}
            <div className="text-center mt-2.5 text-white font-bold text-sm px-2 line-clamp-1">
              {designList[carouselIndex]?.title}
            </div>
          </div>
        )}

        {/* Product Gallery - "আপনার পছন্দের ডিজাইন গুলো বেছে নিন" */}
        <div className="space-y-4">
          <div className="bg-green-200/90 text-green-950 text-center py-2.5 px-4 rounded-2xl font-extrabold text-base border-2 border-green-400 shadow">
            আপনার পছন্দের ডিজাইন গুলো বেছে নিন
          </div>

          <div className="grid grid-cols-2 gap-3">
            {designList.map((mat, idx) => (
              <div
                key={mat.id}
                className="bg-gradient-to-b from-[#14532D] to-[#15803D] border-2 border-green-400/40 rounded-2xl p-2.5 flex flex-col justify-between shadow-lg space-y-2 text-center card-hover anim-fadeInUp"
                style={{ animationDelay: `${idx * 0.08}s` }}
              >
                <div className="relative rounded-xl overflow-hidden border border-green-400/20">
                  <img
                    src={mat.image}
                    alt={mat.title}
                    className="w-full aspect-[4/3] object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <div className="absolute top-2 left-2 bg-rose-600 text-white text-xs font-bold px-2 py-0.5 rounded-lg shadow">
                    {mat.code}
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-white line-clamp-1">{mat.title}</h3>
                  <div className="flex items-center justify-center gap-1.5 text-xs">
                    <span className="text-rose-300 line-through">৳{mat.regularPrice}</span>
                    <span className="text-emerald-400 font-extrabold text-sm">৳{mat.offerPrice}</span>
                  </div>
                </div>

                <button
                  onClick={() => scrollToCheckout(mat.id)}
                  className="w-full bg-[#FBBF24] hover:bg-amber-300 text-green-950 font-black py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 shadow anim-pulseGlowGold border border-amber-300"
                >
                  <ShoppingBag className="w-4 h-4 text-green-950 animate-bounce" />
                  <span>অর্ডার করুন</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Features Cards Section */}
        <div className="space-y-4 pt-4">
          <div className="bg-green-200/90 text-green-950 text-center py-2.5 px-4 rounded-2xl font-extrabold text-base border-2 border-green-400 shadow anim-fadeInDown">
            কেন Van Bazer BD-এর প্রিমিয়াম 3D ফ্লোর ম্যাট বেছে নেবেন?
          </div>

          <div className="space-y-3">
            {[
              { icon: '💧', title: 'দ্রুত পানি শোষণ', desc: 'বাথরুম, রান্নাঘর বা প্রবেশদ্বারে পানি পড়লেও দ্রুত শোষণ করে ফ্লোর শুকনো রাখে। ফলে মেঝে থাকে পরিষ্কার, নিরাপদ ও আরামদায়ক।' },
              { icon: '🛡️', title: '১০০% অ্যান্টি-স্লিপ', desc: 'উন্নত অ্যান্টি-স্লিপ ব্যাকিংয়ের কারণে ম্যাটটি মেঝেতে দৃঢ়ভাবে স্থির থাকে, ফলে পিছলে যাওয়ার ঝুঁকি অনেকটাই কমে যায়।' },
              { icon: '✨', title: 'ইউনিক 3D ডিজাইন', desc: 'আধুনিক 3D ডিজাইন আপনার ঘরের প্রবেশপথকে আরও আকর্ষণীয়, পরিপাটি ও অভিজাত করে তোলে।' },
              { icon: '💵', title: 'আগে দেখে, পরে মূল্য পরিশোধ', desc: 'পণ্য হাতে পেয়ে দেখে ও যাচাই করে মূল্য পরিশোধ করতে পারবেন, যাতে কেনাকাটায় থাকে সম্পূর্ণ নিশ্চিন্ততা।' },
              { icon: '✅', title: 'কোয়ালিটি গ্যারান্টি', desc: 'আমরা মানসম্পন্ন ও অরিজিনাল পণ্য সরবরাহে প্রতিশ্রুতিবদ্ধ। পণ্য পছন্দ না হলে নির্ধারিত শর্ত অনুযায়ী রিটার্ন করার সুবিধাও রয়েছে।' },
            ].map((card, i) => (
              <div
                key={i}
                className="bg-white text-[#1F2937] p-4 rounded-2xl shadow-xl border-2 border-green-300 card-hover anim-slideInLeft"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="flex items-center gap-3 mb-1.5">
                  <div
                    className="w-10 h-10 bg-green-100 text-green-800 rounded-xl flex items-center justify-center shrink-0 font-bold text-xl anim-float"
                    style={{ animationDelay: `${i * 0.3}s` }}
                  >
                    {card.icon}
                  </div>
                  <h3 className="text-base font-extrabold text-green-950">{card.title}</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-1">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Return Policy Highlight Box */}
        <div className="bg-white border-2 border-rose-500 rounded-3xl p-5 text-slate-900 shadow-xl space-y-2 text-center">
          <div className="flex items-center justify-center gap-2 text-rose-600 font-extrabold text-base">
            <Truck className="w-6 h-6" />
            <span>Return Policy</span>
          </div>
          <div className="space-y-1.5 text-xs md:text-sm font-semibold text-slate-800">
            <div className="flex items-center justify-center gap-1.5 text-emerald-700">
              <Check className="w-4 h-4 text-emerald-600 shrink-0 font-bold" />
              <span>ডেলিভারি ম্যান থাকা অবস্থায় প্রোডাক্ট চেক করতে পারবেন</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 text-emerald-700">
              <Check className="w-4 h-4 text-emerald-600 shrink-0 font-bold" />
              <span>পছন্দ না হলে শুধু ডেলিভারি চার্জ দিয়ে সাথে সাথে রিটার্ন করতে পারবেন</span>
            </div>
          </div>
        </div>

        {/* Checkout Order Form Section - "কোন কোন ডিজাইন নিবেন এখানে সিলেক্ট করুন" */}
        <div id="checkout-section" className="bg-[#14532D] border-2 border-green-400 rounded-3xl p-4 md:p-6 shadow-2xl space-y-6">
          
          <div className="bg-green-200/90 text-green-950 text-center py-2.5 px-4 rounded-2xl font-extrabold text-base border border-green-400 shadow">
            কোন কোন ডিজাইন নিবেন এখানে সিলেক্ট করুন
          </div>

          {errorMsg && (
            <div className="bg-rose-500/20 border border-rose-500 text-rose-200 text-xs p-3 rounded-xl text-center font-bold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmitOrder} className="space-y-6">
            
            {/* Design Selection List */}
            <div className="space-y-3">
              {designList.map((mat) => {
                const isSelected = !!selectedItems[mat.id]?.selected;
                const qty = selectedItems[mat.id]?.quantity || 1;

                return (
                  <div
                    key={mat.id}
                    className={`bg-green-950/90 border-2 rounded-2xl p-3 md:p-3.5 transition-all duration-200 flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-emerald-400 shadow-lg shadow-emerald-950/60 bg-green-900/90'
                        : 'border-green-800/80 opacity-85 hover:opacity-100 hover:border-green-700'
                    }`}
                  >
                    {/* Left: Checkbox + Image + Title Info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(mat.id)}
                        className="w-5 h-5 accent-emerald-500 rounded cursor-pointer shrink-0"
                      />

                      <div className="relative shrink-0">
                        <img
                          src={mat.image}
                          alt={mat.title}
                          className="w-14 h-14 md:w-16 md:h-16 rounded-xl object-cover border border-green-700/80 shadow-sm"
                        />
                        {mat.code && (
                          <div className="absolute -top-1.5 -left-1.5 bg-rose-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-md shadow border border-white/20">
                            {mat.code}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-0.5">
                        <h4 className="text-xs md:text-sm font-bold text-white leading-snug break-words">
                          {mat.title}
                        </h4>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs md:text-sm text-emerald-400 font-black">৳{mat.offerPrice}</span>
                          {mat.regularPrice > mat.offerPrice && (
                            <span className="text-[11px] text-green-300/60 line-through">৳{mat.regularPrice}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Quantity Counter */}
                    {isSelected ? (
                      <div className="flex items-center gap-1 bg-green-950/90 border border-emerald-500/60 rounded-xl p-1 shrink-0 shadow-inner">
                        <button
                          type="button"
                          onClick={() => updateQuantity(mat.id, -1)}
                          className="w-7 h-7 rounded-lg bg-green-800 hover:bg-green-700 active:scale-95 text-white flex items-center justify-center font-black text-sm transition"
                          title="পরিমাণ কমান"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 text-center text-xs font-black text-white">{qty}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(mat.id, 1)}
                          className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white flex items-center justify-center font-black text-sm transition shadow-sm"
                          title="পরিমাণ বাড়ান"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleSelect(mat.id)}
                        className="px-3 py-1.5 text-xs font-bold text-emerald-300 hover:text-white bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 rounded-xl transition shrink-0"
                      >
                        সিলেক্ট করুন
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Customer Contact Form */}
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-green-200 mb-1">
                  আপনার নাম <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: মোঃ রহিম আহমেদ"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-green-950 border border-green-700 focus:border-emerald-400 rounded-xl px-4 py-3 text-white placeholder-green-400 text-sm outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-green-200 mb-1">
                  মোবাইল নম্বর <span className="text-rose-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="যেমন: 017XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-green-950 border border-green-700 focus:border-emerald-400 rounded-xl px-4 py-3 text-white placeholder-green-400 text-sm outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-green-200 mb-1">
                  সম্পূর্ণ ঠিকানা (বাসা/রোড নম্বর, থানা, জেলা) <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="যেমন: হাউজ #১২, রোড #০৫, ধানমন্ডি, ঢাকা"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-green-950 border border-green-700 focus:border-emerald-400 rounded-xl px-4 py-3 text-white placeholder-green-400 text-sm outline-none transition"
                />
              </div>

              {/* Delivery Zone Radio Selection */}
              <div>
                <label className="block text-xs font-bold text-green-200 mb-2">
                  ডেলিভারি এরিয়া সিলেক্ট করুন <span className="text-rose-400">*</span>
                </label>
                <div className="space-y-2.5">
                  <label
                    onClick={() => setDeliveryZone('inside_dhaka')}
                    className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition ${
                      deliveryZone === 'inside_dhaka'
                        ? 'bg-green-950 border-emerald-400 text-white shadow-lg'
                        : 'bg-green-950/60 border-green-800 text-green-300'
                    }`}
                  >
                    <span className="text-xs md:text-sm font-bold">ঢাকার ভেতরে</span>
                    <span className="text-xs md:text-sm font-extrabold text-emerald-400">৳{deliveryCharges.inside_dhaka}</span>
                  </label>

                  <label
                    onClick={() => setDeliveryZone('sub_dhaka')}
                    className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition ${
                      deliveryZone === 'sub_dhaka'
                        ? 'bg-green-950 border-emerald-400 text-white shadow-lg'
                        : 'bg-green-950/60 border-green-800 text-green-300'
                    }`}
                  >
                    <span className="text-xs md:text-sm font-bold leading-snug">ঢাকার সাব সিটিতে (গাজীপুর, নারায়ণগঞ্জ, কেরানীগঞ্জ এবং দোহার)</span>
                    <span className="text-xs md:text-sm font-extrabold text-emerald-400 shrink-0 ml-2">৳{deliveryCharges.sub_dhaka}</span>
                  </label>

                  <label
                    onClick={() => setDeliveryZone('outside_dhaka')}
                    className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition ${
                      deliveryZone === 'outside_dhaka'
                        ? 'bg-green-950 border-emerald-400 text-white shadow-lg'
                        : 'bg-green-950/60 border-green-800 text-green-300'
                    }`}
                  >
                    <span className="text-xs md:text-sm font-bold">ঢাকার বাইরে</span>
                    <span className="text-xs md:text-sm font-extrabold text-emerald-400">৳{deliveryCharges.outside_dhaka}</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Price Calculations */}
            <div className="bg-green-950 p-4 rounded-2xl border border-green-700 space-y-2 text-xs">
              <div className="flex justify-between text-green-300">
                <span>সিলেক্ট করা ম্যাট ({selectedList.length} টি ডিজাইন):</span>
                <span>৳{subtotal}</span>
              </div>
              <div className="flex justify-between text-green-300">
                <span>ডেলিভারি চার্জ:</span>
                <span>৳{deliveryCharge}</span>
              </div>
              <div className="border-t border-green-800 pt-2 flex justify-between font-extrabold text-base text-white">
                <span>সর্বমোট (Total):</span>
                <span className="text-emerald-400">৳{grandTotal}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FBBF24] hover:bg-amber-300 text-green-950 font-black text-lg py-4 px-6 rounded-2xl shadow-xl transition-all duration-300 transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 anim-pulseGlowGold relative overflow-hidden cursor-pointer border-2 border-amber-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent anim-shimmerLight pointer-events-none" />
              {loading ? (
                <span>অর্ডার সাবমিট হচ্ছে...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-6 h-6 text-green-950" />
                  <span>অর্ডার কনফার্ম করুন (৳{grandTotal})</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <footer className="text-center text-xs text-green-300 pt-4 space-y-2">
          <p>© 2026 Van Bazer BD - সর্বস্বত্ব সংরক্ষিত।</p>
        </footer>
      </div>

      {/* Sticky Mobile Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#15803D] border-t-2 border-green-400 p-2.5 flex gap-2 z-40 shadow-2xl">
        <a
          href={`tel:${callNumber}`}
          className="flex-1 bg-green-950 border border-emerald-400 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 anim-pulseGlowCall"
        >
          <PhoneCall className="w-4 h-4 text-emerald-400 anim-phoneRing" />
          <span>অর্ডার করতে কল করুন</span>
        </a>

        <button
          onClick={() => scrollToCheckout()}
          className="flex-1 bg-[#FBBF24] text-green-950 font-black py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow anim-pulseGlowGold border border-amber-300"
        >
          <ShoppingBag className="w-4 h-4 text-green-950 animate-bounce" />
          <span>আজই অর্ডার করুন</span>
        </button>
      </div>

      {/* Order Success Modal */}
      {orderSuccess && (
        <div className="fixed inset-0 bg-green-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#14532D] border-2 border-emerald-400 rounded-3xl p-6 max-w-md w-full text-center space-y-5 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-extrabold text-white">অর্ডার সফল হয়েছে!</h3>
              <p className="text-xs text-emerald-300 font-mono bg-green-950/60 py-1 px-3 rounded-full inline-block border border-green-700">
                অর্ডার নম্বর: #{orderSuccess.orderNumber}
              </p>
              <p className="text-xs text-green-200 pt-2">
                ধন্যবাদ <strong className="text-white">{orderSuccess.customerName}</strong>! আমাদের টিম আপনার সাথে খুব দ্রুত যোগাযোগ করবে।
              </p>
            </div>

            <div className="bg-green-950 p-4 rounded-2xl border border-green-700 text-left text-xs space-y-2">
              <div className="flex justify-between text-green-300">
                <span>মোবাইল:</span>
                <span className="text-white font-medium">{orderSuccess.phone}</span>
              </div>
              <div className="flex justify-between text-green-300">
                <span>সর্বমোট পরিশোধযোগ্য:</span>
                <span className="text-emerald-400 font-extrabold text-sm">৳{orderSuccess.totalPrice}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setOrderSuccess(null);
                setCustomerName('');
                setPhone('');
                setAddress('');
              }}
              className="w-full bg-white hover:bg-slate-100 text-green-950 font-bold py-3 px-4 rounded-xl transition text-sm shadow"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}
      {/* Floating Animated WhatsApp Button */}
      <a
        href={`https://wa.me/${whatsappNumber.replace(/\D/g, '').startsWith('0') ? '88' + whatsappNumber.replace(/\D/g, '') : whatsappNumber.replace(/\D/g, '') || '8801797939935'}?text=${encodeURIComponent('আসসালামু আলাইকুম, আমি Van Bazer BD থেকে 3D Floor Mat অর্ডার করতে চাই।')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-16 md:bottom-6 right-4 z-50 bg-[#25D366] hover:bg-[#20ba5a] text-white p-3.5 md:p-4 rounded-full shadow-2xl flex items-center justify-center anim-waBouncePulse transition border-2 border-white cursor-pointer group"
        title="WhatsApp এ সরাসরি মেসেজ দিন"
      >
        <svg className="w-7 h-7 md:w-8 md:h-8 fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
        </svg>
        <span className="hidden md:inline font-extrabold text-xs pl-2 pr-1">WhatsApp</span>
      </a>
    </div>
  );
}
