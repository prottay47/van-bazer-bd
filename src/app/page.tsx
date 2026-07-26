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

const DESIGN_LIST: ProductDesign[] = [
  {
    id: 'mat_1',
    code: 'Code: 01',
    title: '3D Floor Mat Code-1 (বর্ডার সেলাই করা)',
    regularPrice: 450,
    offerPrice: 250,
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'mat_2',
    code: 'Code: 02',
    title: '3D Floor Mat Code-2 (বর্ডার সেলাই করা)',
    regularPrice: 450,
    offerPrice: 250,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'mat_9',
    code: 'Code: 09',
    title: '3D Floor Mat Code-09 (রেড ফ্লাওয়ার 3D)',
    regularPrice: 450,
    offerPrice: 250,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'mat_18',
    code: 'Code: 18',
    title: '3D Floor Mat Code-18 (রয়েল ব্লু রোজ)',
    regularPrice: 450,
    offerPrice: 250,
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'mat_19',
    code: 'Code: 19',
    title: '3D Floor Mat Code-19 (গোল্ডেন বাটারফ্লাই)',
    regularPrice: 450,
    offerPrice: 250,
    image: 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800&auto=format&fit=crop&q=80',
  },
];

export default function RiktooStyleLandingPage() {
  // Selected items state: object mapping design ID to { selected: boolean, quantity: number }
  const [selectedItems, setSelectedItems] = useState<{
    [key: string]: { selected: boolean; quantity: number };
  }>({
    mat_1: { selected: true, quantity: 1 },
    mat_2: { selected: false, quantity: 1 },
    mat_9: { selected: false, quantity: 1 },
    mat_18: { selected: false, quantity: 1 },
    mat_19: { selected: false, quantity: 1 },
  });

  const [deliveryZone, setDeliveryZone] = useState<'inside_dhaka' | 'outside_dhaka'>('inside_dhaka');
  
  // Customer inputs
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [orderSuccess, setOrderSuccess] = useState<any>(null);

  // Timer simulation
  const [timeLeft, setTimeLeft] = useState({ minutes: 5, seconds: 42 });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { minutes: prev.minutes - 1, seconds: 59 };
        return { minutes: 15, seconds: 0 };
      });
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

  // Calculate Order Totals
  const selectedList = DESIGN_LIST.filter((d) => selectedItems[d.id]?.selected);
  const subtotal = selectedList.reduce(
    (sum, d) => sum + d.offerPrice * (selectedItems[d.id]?.quantity || 1),
    0
  );
  const deliveryCharge = deliveryZone === 'inside_dhaka' ? 70 : 130;
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
    <div className="min-h-screen bg-white text-gray-900 font-['Hind_Siliguri',sans-serif] pb-24 md:pb-12">
      {/* Top Banner Notice */}
      <div className="bg-[#581c87] text-white text-center py-2 px-4 text-sm md:text-base font-bold flex items-center justify-center gap-2 border-b border-purple-800">
        <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
        <span>স্পেশাল অফার – মাত্র ২৫০ টাকা! 🔥 অফারটি শেষ হতে বাকি {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')} মিনিট</span>
      </div>

      <div className="max-w-xl mx-auto px-3 py-4 space-y-6">
        
        {/* Main Hero Container */}
        <div className="bg-gradient-to-b from-[#6b21a8] to-[#581c87] rounded-3xl p-5 border-2 border-purple-400/40 shadow-2xl space-y-5 text-center">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 bg-purple-950/80 border border-purple-400/60 text-purple-200 text-xs md:text-sm font-semibold px-3 py-1.5 rounded-full">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>সাইড দিয়ে বর্ডার সেলাই করা 3D ডিজাইনের Floor Mat</span>
          </div>

          {/* Main Title */}
          <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
            ঘরের সৌন্দর্য বাড়ুক প্রথম ধাপ থেকেই!
          </h1>

          {/* Bullet Points */}
          <div className="bg-purple-950/50 p-3.5 rounded-2xl border border-purple-500/30 text-left space-y-2 text-sm text-purple-100">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-emerald-400 font-bold shrink-0" />
              <span>১০০% নন-স্লিপ সেফটি (মেঝেতে শক্তভাবে কামড়ে থাকে)</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-emerald-400 font-bold shrink-0" />
              <span>৩ সেকেন্ডে পানি শোষণ ক্ষমতা</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-emerald-400 font-bold shrink-0" />
              <span>স্টাইলিশ ও আধুনিক 3D ফ্ল্যাট ডিজাইন</span>
            </div>
          </div>

          {/* Pricing Highlight Box */}
          <div className="bg-amber-400 text-purple-950 p-3.5 rounded-2xl font-extrabold text-sm md:text-base shadow-lg space-y-1">
            <p className="flex items-center justify-center gap-1">
              <span>🔥 এ সপ্তাহের সেরা অফার_</span>
            </p>
            <p className="text-lg md:text-xl text-purple-900">
              বর্ডার সেলাই করা মাত্র <span className="text-rose-700 underline underline-offset-2">২৫০ টাকা</span> পিস
            </p>
            <p className="text-xs text-purple-950 font-semibold">
              (বর্ডার সেলাই ছাড়া ২২০ টাকা পিস)
            </p>
          </div>

          {/* Feature Badges */}
          <div className="flex justify-center gap-3">
            <span className="bg-purple-900/80 border border-purple-400/50 text-purple-200 text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Anti Slip
            </span>
            <span className="bg-purple-900/80 border border-purple-400/50 text-purple-200 text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-sky-400" />
              Water Absorb
            </span>
          </div>

          {/* Hero Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={() => scrollToCheckout()}
              className="w-full bg-white hover:bg-slate-100 text-purple-950 font-extrabold text-lg md:text-xl py-3.5 px-6 rounded-2xl shadow-xl shadow-purple-950/50 transition transform hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-6 h-6 text-purple-700" />
              <span>🛒 আজই অর্ডার করুন</span>
            </button>

            <a
              href={`tel:${CALL_NUMBER}`}
              className="w-full bg-purple-950/90 border border-purple-400 hover:bg-purple-900 text-white font-bold py-3 px-6 rounded-2xl text-center block text-base shadow flex items-center justify-center gap-2"
            >
              <PhoneCall className="w-5 h-5 text-emerald-400" />
              <span>📞 কল করুন: {CALL_NUMBER}</span>
            </a>
          </div>
        </div>

        {/* Featured Code Display Image */}
        <div className="bg-gradient-to-b from-[#581c87] to-[#4c1d95] rounded-3xl p-3 border-2 border-purple-500/40 shadow-xl overflow-hidden text-center space-y-2">
          <div className="relative rounded-2xl overflow-hidden border border-purple-400/30">
            <img
              src={DESIGN_LIST[2].image}
              alt="Code 09"
              className="w-full aspect-[4/3] object-cover"
            />
            <div className="absolute top-3 left-1/2 transform -translate-x-1/2 bg-rose-600 text-white font-extrabold text-base px-4 py-1 rounded-xl shadow-lg border border-white/20">
              Code: 09
            </div>
          </div>
        </div>

        {/* Product Gallery - "আপনার পছন্দের ডিজাইন গুলো বেছে নিন" */}
        <div className="space-y-4">
          <div className="bg-purple-200/90 text-purple-950 text-center py-2.5 px-4 rounded-2xl font-extrabold text-base border-2 border-purple-400 shadow">
            আপনার পছন্দের ডিজাইন গুলো বেছে নিন
          </div>

          <div className="grid grid-cols-2 gap-3">
            {DESIGN_LIST.map((mat) => (
              <div
                key={mat.id}
                className="bg-gradient-to-b from-[#581c87] to-[#4c1d95] border-2 border-purple-400/40 rounded-2xl p-2.5 flex flex-col justify-between shadow-lg space-y-2 text-center"
              >
                <div className="relative rounded-xl overflow-hidden border border-purple-400/20">
                  <img
                    src={mat.image}
                    alt={mat.title}
                    className="w-full aspect-[4/3] object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-rose-600 text-white text-xs font-bold px-2 py-0.5 rounded-lg">
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
                  className="w-full bg-purple-950 hover:bg-purple-900 border border-purple-400 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 transition"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-amber-300" />
                  <span>অর্ডার করুন</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Features Cards Section - "কেন আমাদের 3D ফ্লোর ম্যাট নিবেন?" */}
        <div className="space-y-4 pt-4">
          <div className="bg-purple-200/90 text-purple-950 text-center py-2.5 px-4 rounded-2xl font-extrabold text-base border-2 border-purple-400 shadow">
            কেন আমাদের 3D ফ্লোর ম্যাট নিবেন?
          </div>

          <div className="space-y-3">
            {/* Card 1 */}
            <div className="bg-white text-slate-900 p-4 rounded-2xl shadow-xl border-2 border-purple-300 space-y-1.5">
              <div className="w-10 h-10 bg-purple-100 text-purple-800 rounded-xl flex items-center justify-center mb-1 font-bold text-lg">
                💧
              </div>
              <h3 className="text-base font-extrabold text-purple-950">পানিশোষক পাপোস</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                বাথরুমের সামনে পানি পড়ে স্যাঁতস্যাঁতে হয়ে থাকে? পা রাখতে খারাপ লাগে? আমাদের এই ম্যাট দ্রুত পানি শোষণ করতে সক্ষম।
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white text-slate-900 p-4 rounded-2xl shadow-xl border-2 border-purple-300 space-y-1.5">
              <div className="w-10 h-10 bg-purple-100 text-purple-800 rounded-xl flex items-center justify-center mb-1 font-bold text-lg">
                🛡️
              </div>
              <h3 className="text-base font-extrabold text-purple-950">১০০% নন-স্লিপার</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                এটি ব্যবহার করলে স্লিপ খেয়ে পড়ে যাওয়ার কোনো ভয় নেই। এটি মেঝেতে শক্তভাবে কামড়ে থাকে এবং সহজে সরে যায় না।
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white text-slate-900 p-4 rounded-2xl shadow-xl border-2 border-purple-300 space-y-1.5">
              <div className="w-10 h-10 bg-purple-100 text-purple-800 rounded-xl flex items-center justify-center mb-1 font-bold text-lg">
                ✨
              </div>
              <h3 className="text-base font-extrabold text-purple-950">ইউনিক 3D ডিজাইন</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                আধুনিক ও স্টাইলিশ ইউনিক ডিজাইনের এই ম্যাটগুলো আপনার বাথরুমের সৌন্দর্য অনেক গুণ বাড়িয়ে দিবে।
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-white text-slate-900 p-4 rounded-2xl shadow-xl border-2 border-purple-300 space-y-1.5">
              <div className="w-10 h-10 bg-purple-100 text-purple-800 rounded-xl flex items-center justify-center mb-1 font-bold text-lg">
                💵
              </div>
              <h3 className="text-base font-extrabold text-purple-950">আগে প্রোডাক্ট পরে টাকা</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                আমরা দিচ্ছি অগ্রিম এক টাকা ছাড়াও সারা বাংলাদেশে ক্যাশ অন হোম ডেলিভারির সুবিধা।
              </p>
            </div>

            {/* Card 5 */}
            <div className="bg-white text-slate-900 p-4 rounded-2xl shadow-xl border-2 border-purple-300 space-y-1.5">
              <div className="w-10 h-10 bg-purple-100 text-purple-800 rounded-xl flex items-center justify-center mb-1 font-bold text-lg">
                ✅
              </div>
              <h3 className="text-base font-extrabold text-purple-950">কোয়ালিটি গ্যারান্টি</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                ডেলিভারি ম্যান থাকা অবস্থায় কোয়ালিটি দেখে নিতে পারবেন। ভালো না লাগলে ডেলিভারি চার্জ দিয়ে রিটার্ন করার সুযোগ।
              </p>
            </div>
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
        <div id="checkout-section" className="bg-[#581c87] border-2 border-purple-400 rounded-3xl p-4 md:p-6 shadow-2xl space-y-6">
          
          <div className="bg-purple-200/90 text-purple-950 text-center py-2.5 px-4 rounded-2xl font-extrabold text-base border border-purple-400 shadow">
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
              {DESIGN_LIST.map((mat) => {
                const isSelected = !!selectedItems[mat.id]?.selected;
                const qty = selectedItems[mat.id]?.quantity || 1;

                return (
                  <div
                    key={mat.id}
                    className={`bg-purple-950/80 border-2 rounded-2xl p-3 transition flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-emerald-400 shadow-md shadow-emerald-950/50'
                        : 'border-purple-800 opacity-80 hover:opacity-100'
                    }`}
                  >
                    {/* Checkbox + Image + Title */}
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(mat.id)}
                        className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                      />

                      <img
                        src={mat.image}
                        alt={mat.title}
                        className="w-14 h-14 rounded-xl object-cover border border-purple-700"
                      />

                      <div>
                        <h4 className="text-xs font-bold text-white line-clamp-1">{mat.title}</h4>
                        <div className="text-xs text-emerald-400 font-extrabold">৳{mat.offerPrice}.00৳</div>
                      </div>
                    </div>

                    {/* Quantity Counter */}
                    {isSelected && (
                      <div className="flex items-center border border-purple-600 rounded-xl overflow-hidden bg-purple-900 shrink-0">
                        <button
                          type="button"
                          onClick={() => updateQuantity(mat.id, -1)}
                          className="px-2.5 py-1 text-white hover:bg-purple-800 transition"
                        >
                          -
                        </button>
                        <span className="px-3 text-xs font-extrabold text-white">{qty}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(mat.id, 1)}
                          className="px-2.5 py-1 text-white hover:bg-purple-800 transition"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Customer Contact Form */}
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-purple-200 mb-1">
                  আপনার নাম <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: মোঃ রহিম আহমেদ"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-purple-950 border border-purple-700 focus:border-emerald-400 rounded-xl px-4 py-3 text-white placeholder-purple-400 text-sm outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-200 mb-1">
                  মোবাইল নম্বর <span className="text-rose-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="যেমন: 017XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-purple-950 border border-purple-700 focus:border-emerald-400 rounded-xl px-4 py-3 text-white placeholder-purple-400 text-sm outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-200 mb-1">
                  সম্পূর্ণ ঠিকানা (বাসা/রোড নম্বর, থানা, জেলা) <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="যেমন: হাউজ #১২, রোড #০৫, ধানমন্ডি, ঢাকা"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-purple-950 border border-purple-700 focus:border-emerald-400 rounded-xl px-4 py-3 text-white placeholder-purple-400 text-sm outline-none transition"
                />
              </div>

              {/* Delivery Zone Radio Selection */}
              <div>
                <label className="block text-xs font-bold text-purple-200 mb-2">
                  ডেলিভারি এরিয়া সিলেক্ট করুন <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    onClick={() => setDeliveryZone('inside_dhaka')}
                    className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition ${
                      deliveryZone === 'inside_dhaka'
                        ? 'bg-purple-950 border-emerald-400 text-white'
                        : 'bg-purple-950/60 border-purple-800 text-purple-300'
                    }`}
                  >
                    <span className="text-xs font-bold">ঢাকার ভেতরে</span>
                    <span className="text-xs font-extrabold text-emerald-400">৳70</span>
                  </label>

                  <label
                    onClick={() => setDeliveryZone('outside_dhaka')}
                    className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition ${
                      deliveryZone === 'outside_dhaka'
                        ? 'bg-purple-950 border-emerald-400 text-white'
                        : 'bg-purple-950/60 border-purple-800 text-purple-300'
                    }`}
                  >
                    <span className="text-xs font-bold">ঢাকার বাইরে</span>
                    <span className="text-xs font-extrabold text-emerald-400">৳130</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Price Calculations */}
            <div className="bg-purple-950 p-4 rounded-2xl border border-purple-700 space-y-2 text-xs">
              <div className="flex justify-between text-purple-300">
                <span>সিলেক্ট করা ম্যাট ({selectedList.length} টি ডিজাইন):</span>
                <span>৳{subtotal}</span>
              </div>
              <div className="flex justify-between text-purple-300">
                <span>ডেলিভারি চার্জ:</span>
                <span>৳{deliveryCharge}</span>
              </div>
              <div className="border-t border-purple-800 pt-2 flex justify-between font-extrabold text-base text-white">
                <span>সর্বমোট (Total):</span>
                <span className="text-emerald-400">৳{grandTotal}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white hover:bg-slate-100 text-purple-950 font-extrabold text-lg py-4 px-6 rounded-2xl shadow-xl transition transform hover:scale-[1.01] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>অর্ডার সাবমিট হচ্ছে...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  <span>অর্ডার কনফার্ম করুন (৳{grandTotal})</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <footer className="text-center text-xs text-purple-300 pt-4 space-y-2">
          <p>© 2026 Van Bazer BD - সর্বস্বত্ব সংরক্ষিত।</p>
          <div className="flex justify-center gap-4 text-purple-400">
            <a href="/admin/login" className="hover:underline text-purple-400">অ্যাডমিন প্যানেল</a>
          </div>
        </footer>
      </div>

      {/* Sticky Mobile Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#4c1d95] border-t-2 border-purple-400 p-2.5 flex gap-2 z-40 shadow-2xl">
        <a
          href={`tel:${CALL_NUMBER}`}
          className="flex-1 bg-purple-950 border border-purple-400 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5"
        >
          <PhoneCall className="w-4 h-4 text-emerald-400" />
          <span>কল করুন</span>
        </a>

        <button
          onClick={() => scrollToCheckout()}
          className="flex-1 bg-white text-purple-950 font-extrabold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow"
        >
          <ShoppingBag className="w-4 h-4 text-purple-700" />
          <span>আজই অর্ডার করুন</span>
        </button>
      </div>

      {/* Order Success Modal */}
      {orderSuccess && (
        <div className="fixed inset-0 bg-purple-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#581c87] border-2 border-emerald-400 rounded-3xl p-6 max-w-md w-full text-center space-y-5 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-extrabold text-white">অর্ডার সফল হয়েছে!</h3>
              <p className="text-xs text-emerald-300 font-mono bg-purple-950/60 py-1 px-3 rounded-full inline-block border border-purple-700">
                অর্ডার নম্বর: #{orderSuccess.orderNumber}
              </p>
              <p className="text-xs text-purple-200 pt-2">
                ধন্যবাদ <strong className="text-white">{orderSuccess.customerName}</strong>! আমাদের টিম আপনার সাথে খুব দ্রুত যোগাযোগ করবে।
              </p>
            </div>

            <div className="bg-purple-950 p-4 rounded-2xl border border-purple-700 text-left text-xs space-y-2">
              <div className="flex justify-between text-purple-300">
                <span>মোবাইল:</span>
                <span className="text-white font-medium">{orderSuccess.phone}</span>
              </div>
              <div className="flex justify-between text-purple-300">
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
              className="w-full bg-white hover:bg-slate-100 text-purple-950 font-bold py-3 px-4 rounded-xl transition text-sm shadow"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
