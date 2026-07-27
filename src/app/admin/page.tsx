'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  Layers,
  ShoppingBag,
  AlertCircle,
  Wallet,
  Settings,
  Menu,
  X,
  PackageCheck,
  DollarSign,
  Clock,
  TrendingUp,
  Search,
  Download,
  LogOut,
  RefreshCw,
  Trash2,
  PhoneCall,
  MapPin,
  CheckCircle2,
  Truck,
  ShieldAlert,
  ArrowUpRight,
  PieChart,
  Save,
  Plus,
  Edit,
  Tag,
  Check,
  Eye,
  Image as ImageIcon
} from 'lucide-react';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  address: string;
  deliveryZone: string;
  productName: string;
  productVariant: string;
  quantity: number;
  unitPrice: number;
  deliveryCharge: number;
  totalPrice: number;
  status: 'Pending' | 'Confirmed' | 'Shipped' | 'Cancelled';
  createdAt: string;
}

interface Stats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  confirmedOrders: number;
  shippedOrders: number;
  cancelledOrders: number;
  todayOrdersCount: number;
  todayRevenue: number;
}

interface Product {
  id: string;
  code: string;
  title: string;
  regularPrice: number;
  offerPrice: number;
  image: string;
  inStock: boolean | number;
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'products' | 'orders' | 'incomplete' | 'accounts' | 'settings'>('analytics');

  useEffect(() => {
    const savedTab = localStorage.getItem('admin_active_tab');
    if (savedTab && ['analytics', 'products', 'orders', 'incomplete', 'accounts', 'settings'].includes(savedTab)) {
      setActiveTab(savedTab as any);
    }
  }, []);

  const handleTabSelect = (tab: 'analytics' | 'products' | 'orders' | 'incomplete' | 'accounts' | 'settings') => {
    setActiveTab(tab);
    localStorage.setItem('admin_active_tab', tab);
  };
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Add Product Modal State
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProductCode, setNewProductCode] = useState('');
  const [newProductTitle, setNewProductTitle] = useState('');
  const [newProductRegularPrice, setNewProductRegularPrice] = useState(450);
  const [newProductOfferPrice, setNewProductOfferPrice] = useState(250);
  const [newProductImage, setNewProductImage] = useState('');
  const [addingProduct, setAddingProduct] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Edit Product Modal State
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProductCode, setEditProductCode] = useState('');
  const [editProductTitle, setEditProductTitle] = useState('');
  const [editProductRegularPrice, setEditProductRegularPrice] = useState(450);
  const [editProductOfferPrice, setEditProductOfferPrice] = useState(250);
  const [editProductImage, setEditProductImage] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editUploadingImage, setEditUploadingImage] = useState(false);
  const [editUploadSuccess, setEditUploadSuccess] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setUploadSuccess(false);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setNewProductImage(data.url);
        setUploadSuccess(true);
      } else {
        alert(data.error || 'ফাইল আপলোড ব্যর্থ হয়েছে');
      }
    } catch (err) {
      console.error(err);
      alert('ছবি আপলোড করতে সমস্যা হয়েছে');
    } finally {
      setUploadingImage(false);
    }
  };

  // Settings state
  const [dhakaDelivery, setDhakaDelivery] = useState(70);
  const [subDhakaDelivery, setSubDhakaDelivery] = useState(100);
  const [outsideDelivery, setOutsideDelivery] = useState(130);
  const [pixelId, setPixelId] = useState(process.env.NEXT_PUBLIC_META_PIXEL_ID || '123456789012345');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  const router = useRouter();

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data) {
        if (data.dhakaDelivery !== undefined) setDhakaDelivery(data.dhakaDelivery);
        if (data.subDhakaDelivery !== undefined) setSubDhakaDelivery(data.subDhakaDelivery);
        if (data.outsideDelivery !== undefined) setOutsideDelivery(data.outsideDelivery);
        if (data.pixelId !== undefined) setPixelId(data.pixelId);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders');
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const data = await res.json();
      setOrders(data.orders || []);
      setStats(data.stats || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductsData = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.products) {
        setProducts(data.products.map((p: any) => ({ ...p, inStock: Boolean(p.inStock) })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchProductsData();
    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dhakaDelivery,
          subDhakaDelivery,
          outsideDelivery,
          pixelId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSaveSuccess('সেটিংস সফলভাবে সংরক্ষিত হয়েছে!');
        setTimeout(() => setSaveSuccess(''), 3000);
      } else {
        alert(data.error || 'সেটিংস সেভ করতে ব্যর্থ হয়েছে');
      }
    } catch (err) {
      console.error(err);
      alert('সেটিংস সেভ করতে সমস্যা হয়েছে');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই অর্ডারটি ডিলেট করতে চান?')) return;

    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductCode || !newProductTitle || !newProductImage) {
      alert('দয়া করে কোড, নাম এবং ছবির ইউআরএল লিখুন');
      return;
    }
    setAddingProduct(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newProductCode,
          title: newProductTitle,
          regularPrice: newProductRegularPrice,
          offerPrice: newProductOfferPrice,
          image: newProductImage,
        }),
      });
      if (res.ok) {
        setShowAddProductModal(false);
        setNewProductCode('');
        setNewProductTitle('');
        setNewProductImage('');
        fetchProductsData();
      } else {
        alert('প্রোডাক্ট যুক্ত করতে সমস্যা হয়েছে');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAddingProduct(false);
    }
  };

  const handleToggleStock = async (productId: string, currentStock: boolean | number) => {
    try {
      await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inStock: currentStock ? 0 : 1 }),
      });
      fetchProductsData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই প্রোডাক্ট ভেরিয়েন্টটি ডিলেট করতে চান?')) return;
    try {
      await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      fetchProductsData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setEditProductCode(p.code);
    setEditProductTitle(p.title);
    setEditProductRegularPrice(p.regularPrice);
    setEditProductOfferPrice(p.offerPrice);
    setEditProductImage(p.image);
    setEditUploadSuccess(false);
    setShowEditProductModal(true);
  };

  const handleEditFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditUploadingImage(true);
    setEditUploadSuccess(false);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok && data.url) {
        setEditProductImage(data.url);
        setEditUploadSuccess(true);
      } else {
        alert(data.error || 'ফাইল আপলোড ব্যর্থ হয়েছে');
      }
    } catch (err) {
      console.error(err);
      alert('ছবি আপলোড করতে সমস্যা হয়েছে');
    } finally {
      setEditUploadingImage(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;
    if (!editProductCode.trim() || !editProductTitle.trim() || !editProductImage) {
      alert('কোড, টাইটেল এবং ছবি আবশ্যক');
      return;
    }
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: editProductCode.trim(),
          title: editProductTitle.trim(),
          regularPrice: editProductRegularPrice,
          offerPrice: editProductOfferPrice,
          image: editProductImage,
        }),
      });
      if (res.ok) {
        setShowEditProductModal(false);
        setEditingProduct(null);
        fetchProductsData();
      } else {
        const data = await res.json();
        alert(data.error || 'প্রোডাক্ট আপডেট করতে সমস্যা হয়েছে');
      }
    } catch (err) {
      console.error(err);
      alert('প্রোডাক্ট আপডেট করতে সমস্যা হয়েছে');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleExportCSV = () => {
    if (!filteredOrders.length) return;

    const headers = ['Order Number', 'Date', 'Customer Name', 'Phone', 'Address', 'Delivery Zone', 'Variant', 'Quantity', 'Total (BDT)', 'Status'];
    
    const csvRows = filteredOrders.map((o) => [
      `"${o.orderNumber}"`,
      `"${new Date(o.createdAt).toLocaleString('bn-BD')}"`,
      `"${o.customerName.replace(/"/g, '""')}"`,
      `"${o.phone}"`,
      `"${o.address.replace(/"/g, '""')}"`,
      `"${o.deliveryZone === 'inside_dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'}"`,
      `"${o.productVariant}"`,
      o.quantity,
      o.totalPrice,
      `"${o.status}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...csvRows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `VanBazer_Orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.phone.includes(searchQuery);

    const matchesStatus = statusFilter === 'All' || o.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const filteredProducts = products.filter((p) =>
    p.code.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.title.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Calculate stats for Accounts & Analytics
  const insideDhakaCount = orders.filter(o => o.deliveryZone === 'inside_dhaka').length;
  const outsideDhakaCount = orders.filter(o => o.deliveryZone === 'outside_dhaka').length;
  const totalDeliveryRevenue = orders.reduce((sum, o) => sum + (o.deliveryCharge || 0), 0);
  const netProductRevenue = (stats?.totalRevenue || 0) - totalDeliveryRevenue;
  const estimatedProfit = Math.round(netProductRevenue * 0.4); // estimated margin 40%

  const navItems = [
    { id: 'analytics', label: 'এনালাইটিক্স', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'products', label: 'প্রোডাক্টস', icon: <Layers className="w-5 h-5" />, badge: products.length },
    { id: 'orders', label: 'অর্ডার', icon: <ShoppingBag className="w-5 h-5" />, badge: orders.length },
    { id: 'incomplete', label: 'অসমাপ্ত অর্ডার', icon: <AlertCircle className="w-5 h-5" />, badge: stats?.cancelledOrders || 0 },
    { id: 'accounts', label: 'হিসাব', icon: <Wallet className="w-5 h-5" /> },
    { id: 'settings', label: 'সেটিংস', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans">
      
      {/* Mobile Top Navbar */}
      <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full border border-emerald-500/50 p-0.5 bg-white flex items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Van Bazer BD Logo" className="w-full h-full object-contain rounded-full" />
          </div>
          <span className="font-bold text-white text-base">Van Bazer BD</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-slate-800 text-slate-200 rounded-lg"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-30 h-screen w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-5 space-y-6">
          {/* Logo & Brand Header */}
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="w-11 h-11 rounded-full border-2 border-emerald-500/50 p-0.5 bg-white flex items-center justify-center shrink-0 overflow-hidden shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Van Bazer BD Logo" className="w-full h-full object-contain rounded-full" />
            </div>
            <div>
              <h2 className="font-black text-white text-base tracking-wide uppercase bg-gradient-to-r from-amber-400 via-rose-400 to-emerald-400 bg-clip-text text-transparent">
                VAN BAZER BD
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">অ্যাডমিন প্যানেল</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    handleTabSelect(item.id as any);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition ${
                    active
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        active ? 'bg-white text-rose-600' : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <button
            onClick={() => {
              fetchDashboardData();
              fetchProductsData();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-950 border border-slate-800 hover:bg-slate-800/80 text-slate-300 text-xs font-semibold rounded-xl transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>ডাটা রিফ্রেশ করুন</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl transition"
          >
            <LogOut className="w-4 h-4" />
            <span>লগআউট</span>
          </button>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden"
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
        
        {/* TAB 1: ANALYTICS (এনালাইটিক্স) */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-7 h-7 text-rose-500" />
                  <span>সেলস ও পারফরম্যান্স এনালাইটিক্স</span>
                </h1>
                <p className="text-xs text-slate-400">আপনার শপের সার্বিক বিক্রয় ও স্ট্যাটস সামারি</p>
              </div>
              <button
                onClick={handleExportCSV}
                className="px-4 py-2.5 bg-emerald-600/20 border border-emerald-500/40 hover:bg-emerald-600/30 text-emerald-400 rounded-xl transition flex items-center gap-2 text-xs font-semibold self-start md:self-auto"
              >
                <Download className="w-4 h-4" />
                <span>রিপোর্ট ডাউনলোড (CSV)</span>
              </button>
            </div>

            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                    <span>মোট সেলস রেভিনিউ</span>
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="text-2xl md:text-3xl font-black text-emerald-400">
                    ৳{stats.totalRevenue.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-slate-500">কনফার্মড ও শিপড অর্ডার হতে</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                    <span>আজকের মোট সেলস</span>
                    <TrendingUp className="w-5 h-5 text-rose-400" />
                  </div>
                  <div className="text-2xl md:text-3xl font-black text-white">
                    ৳{stats.todayRevenue.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-slate-500">আজকের {stats.todayOrdersCount} টি অর্ডার</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                    <span>পেন্ডিং অর্ডার</span>
                    <Clock className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="text-2xl md:text-3xl font-black text-amber-400">
                    {stats.pendingOrders}
                  </div>
                  <p className="text-[11px] text-slate-500">কনফার্মেশনের অপেক্ষায়</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                    <span>মোট অর্ডার সংখ্যা</span>
                    <PackageCheck className="w-5 h-5 text-sky-400" />
                  </div>
                  <div className="text-2xl md:text-3xl font-black text-sky-400">
                    {stats.totalOrders}
                  </div>
                  <p className="text-[11px] text-slate-500">সর্বমোট নিবন্ধিত</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-purple-400" />
                    <span>অর্ডার স্ট্যাটাস ডিস্ট্রিবিউশন</span>
                  </h3>
                  <span className="text-xs text-slate-400">{orders.length} টি অর্ডার</span>
                </div>

                <div className="space-y-3">
                  {[
                    { label: 'পেন্ডিং (Pending)', count: stats?.pendingOrders || 0, color: 'bg-amber-500', text: 'text-amber-400' },
                    { label: 'কনফার্মড (Confirmed)', count: stats?.confirmedOrders || 0, color: 'bg-sky-500', text: 'text-sky-400' },
                    { label: 'শিপড (Shipped)', count: stats?.shippedOrders || 0, color: 'bg-emerald-500', text: 'text-emerald-400' },
                    { label: 'ক্যান্সেলড (Cancelled)', count: stats?.cancelledOrders || 0, color: 'bg-rose-500', text: 'text-rose-400' },
                  ].map((st, i) => {
                    const percentage = orders.length ? Math.round((st.count / orders.length) * 100) : 0;
                    return (
                      <div key={i} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-300">{st.label}</span>
                          <span className={st.text}>{st.count} টি ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                          <div className={`h-full ${st.color} transition-all duration-500`} style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <span>ডেলিভারি এরিয়া অ্যানালাইসিস</span>
                  </h3>
                  <span className="text-xs text-slate-400">অবস্থানভিত্তিক</span>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-1">
                    <div className="text-xs text-slate-400 font-medium">ঢাকার ভেতরে (70৳)</div>
                    <div className="text-2xl font-black text-sky-400">{insideDhakaCount} টি</div>
                    <div className="text-[11px] text-slate-500">
                      {orders.length ? Math.round((insideDhakaCount / orders.length) * 100) : 0}% কাস্টমার
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-1">
                    <div className="text-xs text-slate-400 font-medium">ঢাকার বাইরে (130৳)</div>
                    <div className="text-2xl font-black text-amber-400">{outsideDhakaCount} টি</div>
                    <div className="text-[11px] text-slate-500">
                      {orders.length ? Math.round((outsideDhakaCount / orders.length) * 100) : 0}% কাস্টমার
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs text-emerald-300 font-semibold">
                  <span>সর্বমোট সংগৃহীত ডেলিভারি চার্জ:</span>
                  <span className="text-sm font-bold text-emerald-400">৳{totalDeliveryRevenue.toLocaleString()}</span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: PRODUCTS (প্রোডাক্টস) */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Layers className="w-7 h-7 text-emerald-400" />
                  <span>প্রোডাক্ট ভেরিয়েন্ট ক্যাটালগ</span>
                </h1>
                <p className="text-xs text-slate-400">আপনার ডোর ম্যাটের ৩ডি ডিজাইন, প্রাইসিং ও স্টক কাস্টমাইজেশন</p>
              </div>

              <button
                onClick={() => setShowAddProductModal(true)}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition flex items-center gap-2 text-xs font-bold shadow-lg shadow-rose-600/20 self-start md:self-auto cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন ভেরিয়েন্ট যোগ করুন</span>
              </button>
            </div>

            {/* Add Product Modal */}
            {showAddProductModal && (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Plus className="w-5 h-5 text-rose-500" />
                      <span>নতুন প্রোডাক্ট যোগ করুন</span>
                    </h3>
                    <button
                      onClick={() => setShowAddProductModal(false)}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleAddProduct} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">প্রোডাক্ট কোড (যেমন: Code: 05)</label>
                      <input
                        type="text"
                        required
                        placeholder="Code: 05"
                        value={newProductCode}
                        onChange={(e) => setNewProductCode(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">প্রোডাক্টের নাম (Title)</label>
                      <input
                        type="text"
                        required
                        placeholder="3D Floor Mat Code-05 (রোজ ডিজাইন)"
                        value={newProductTitle}
                        onChange={(e) => setNewProductTitle(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-rose-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">অফার প্রাইস (৳)</label>
                        <input
                          type="number"
                          required
                          value={newProductOfferPrice}
                          onChange={(e) => setNewProductOfferPrice(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-rose-500 font-bold text-emerald-400"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">রেগুলার প্রাইস (৳)</label>
                        <input
                          type="number"
                          required
                          value={newProductRegularPrice}
                          onChange={(e) => setNewProductRegularPrice(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-rose-500"
                        />
                      </div>
                    </div>

                    {/* Image Upload Box */}
                    <div className="space-y-2 pt-1 border-t border-slate-800">
                      <label className="block text-slate-300 font-semibold">প্রোডাক্টের ছবি (কম্পিউটার/মোবাইল থেকে আপলোড)</label>
                      
                      <div className="flex items-center gap-3">
                        <label className="flex-1 bg-slate-950 border border-dashed border-rose-500/50 hover:border-rose-500 p-3 rounded-xl cursor-pointer transition flex items-center justify-center gap-2 text-slate-300 hover:text-white">
                          <ImageIcon className="w-4 h-4 text-rose-400" />
                          <span className="font-semibold">{uploadingImage ? 'WebP তে কনভার্ট হচ্ছে...' : 'ছবি সিলেক্ট করুন (Upload Image)'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            disabled={uploadingImage}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {uploadSuccess && (
                        <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>ছবিটি সফলভাবে .WebP ফরম্যাটে রূপান্তর করা হয়েছে!</span>
                        </div>
                      )}



                      {newProductImage && (
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={newProductImage} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>

                    <div className="pt-3 flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setShowAddProductModal(false)}
                        className="px-4 py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl"
                      >
                        বাতিল
                      </button>
                      <button
                        type="submit"
                        disabled={addingProduct}
                        className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg shadow-rose-600/20 disabled:opacity-50"
                      >
                        {addingProduct ? 'সংরক্ষণ হচ্ছে...' : 'সেভ করুন'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Edit Product Modal */}
            {showEditProductModal && editingProduct && (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Edit className="w-5 h-5 text-blue-400" />
                      প্রোডাক্ট এডিট করুন
                    </h2>
                    <button onClick={() => setShowEditProductModal(false)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1 text-sm">প্রোডাক্ট কোড</label>
                      <input
                        type="text"
                        required
                        value={editProductCode}
                        onChange={(e) => setEditProductCode(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-blue-500 text-sm"
                        placeholder="যেমন: Code-01"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1 text-sm">প্রোডাক্টের নাম / টাইটেল</label>
                      <input
                        type="text"
                        required
                        value={editProductTitle}
                        onChange={(e) => setEditProductTitle(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-blue-500 text-sm"
                        placeholder="যেমন: 3D Floor Mat (Code-01)"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1 text-sm">অফার প্রাইস (৳)</label>
                        <input
                          type="number"
                          required
                          value={editProductOfferPrice}
                          onChange={(e) => setEditProductOfferPrice(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-blue-500 font-bold text-emerald-400 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1 text-sm">রেগুলার প্রাইস (৳)</label>
                        <input
                          type="number"
                          required
                          value={editProductRegularPrice}
                          onChange={(e) => setEditProductRegularPrice(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-blue-500 text-sm"
                        />
                      </div>
                    </div>

                    {/* Image Section */}
                    <div className="space-y-2 pt-1 border-t border-slate-800">
                      <label className="block text-slate-300 font-semibold text-sm">প্রোডাক্টের ছবি পরিবর্তন করুন</label>
                      <div className="flex items-center gap-3">
                        <label className="flex-1 bg-slate-950 border border-dashed border-blue-500/50 hover:border-blue-500 p-3 rounded-xl cursor-pointer transition flex items-center justify-center gap-2 text-slate-300 hover:text-white text-sm">
                          <ImageIcon className="w-4 h-4 text-blue-400" />
                          <span className="font-semibold">{editUploadingImage ? 'WebP তে কনভার্ট হচ্ছে...' : 'নতুন ছবি আপলোড করুন'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleEditFileUpload}
                            disabled={editUploadingImage}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {editUploadSuccess && (
                        <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>ছবিটি সফলভাবে .WebP ফরম্যাটে রূপান্তর করা হয়েছে!</span>
                        </div>
                      )}

                      {editProductImage && (
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={editProductImage} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>

                    <div className="pt-3 flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setShowEditProductModal(false)}
                        className="px-4 py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl text-sm"
                      >
                        বাতিল
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        disabled={savingEdit || editUploadingImage}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 disabled:opacity-50 text-sm flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        {savingEdit ? 'সেভ হচ্ছে...' : 'পরিবর্তন সেভ করুন'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Product Search & Filter */}
            <div className="flex justify-between items-center bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="কোড বা প্রোডাক্টের নাম সার্চ..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl pl-9 pr-4 py-2 text-xs text-white outline-none"
                />
              </div>

              <span className="text-xs text-slate-400 font-semibold hidden md:inline">
                মোট {filteredProducts.length} টি ভেরিয়েন্ট প্রদর্শিত
              </span>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredProducts.map((p) => {
                const stockBool = Boolean(p.inStock);
                return (
                  <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between">
                    <div className="space-y-3">
                      {/* Product Image */}
                      <div className="relative h-44 w-full bg-slate-950">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                        <div className="absolute top-3 left-3 bg-purple-950/90 border border-purple-400/50 text-purple-200 text-xs font-mono font-bold px-2.5 py-1 rounded-lg">
                          {p.code}
                        </div>
                        <div className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
                          stockBool
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                        }`}>
                          {stockBool ? 'In Stock' : 'Out of Stock'}
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="p-4 space-y-2">
                        <h3 className="font-bold text-white text-sm line-clamp-2">{p.title}</h3>
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-black text-emerald-400">৳{p.offerPrice}</span>
                          <span className="text-xs text-slate-500 line-through">৳{p.regularPrice}</span>
                          <span className="text-[10px] text-amber-400 font-bold bg-amber-400/10 px-1.5 py-0.5 rounded">
                            অফার প্রাইস
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-4 pt-0 flex gap-2">
                      <button
                        onClick={() => handleToggleStock(p.id, stockBool)}
                        className={`flex-1 text-xs font-bold py-2 rounded-xl border transition ${
                          stockBool
                            ? 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                            : 'bg-emerald-600 text-white border-emerald-500'
                        }`}
                      >
                        {stockBool ? 'স্টক আউট করুন' : 'স্টক ইন করুন'}
                      </button>
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30 rounded-xl transition"
                        title="এডিট করুন"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl transition"
                        title="ডিলেট করুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: ORDERS (অর্ডার) */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <ShoppingBag className="w-7 h-7 text-rose-500" />
                  <span>সকল অর্ডার তালিকা</span>
                </h1>
                <p className="text-xs text-slate-400">অর্ডার ভেরিফাই, স্ট্যাটাস পরিবর্তন এবং ডিলিট ব্যবস্থাপনা</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={fetchDashboardData}
                  className="p-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl transition text-slate-300 flex items-center gap-1.5 text-xs font-medium"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>রিফ্রেশ</span>
                </button>

                <button
                  onClick={handleExportCSV}
                  className="p-2.5 bg-emerald-600/20 border border-emerald-500/40 hover:bg-emerald-600/30 text-emerald-400 rounded-xl transition flex items-center gap-1.5 text-xs font-medium"
                >
                  <Download className="w-4 h-4" />
                  <span>CSV ডাউনলোড</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3 justify-between items-center bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="নাম, ফোন বা অর্ডার আইডি সার্চ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl pl-9 pr-4 py-2 text-xs text-white outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                {['All', 'Pending', 'Confirmed', 'Shipped', 'Cancelled'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition ${
                      statusFilter === st
                        ? 'bg-rose-600 text-white border-rose-500 shadow'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {st === 'All' ? 'সকল অর্ডার' : st}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">অর্ডার ID & সময়</th>
                      <th className="p-3.5">কাস্টমার তথ্য</th>
                      <th className="p-3.5">ঠিকানা & এরিয়া</th>
                      <th className="p-3.5">ভেরিয়েন্ট & পরিমাণ</th>
                      <th className="p-3.5">মোট মূল্য</th>
                      <th className="p-3.5">স্ট্যাটাস</th>
                      <th className="p-3.5 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500">
                          কোনো অর্ডার পাওয়া যায়নি!
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-800/30 transition">
                          <td className="p-3.5 space-y-1">
                            <div className="font-bold text-white font-mono text-xs">#{ord.orderNumber}</div>
                            <div className="text-[10px] text-slate-500">
                              {new Date(ord.createdAt).toLocaleString('bn-BD')}
                            </div>
                          </td>

                          <td className="p-3.5 space-y-1">
                            <div className="font-medium text-white">{ord.customerName}</div>
                            <div className="flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                              <PhoneCall className="w-3 h-3" />
                              <a href={`tel:${ord.phone}`} className="hover:underline">{ord.phone}</a>
                            </div>
                          </td>

                          <td className="p-3.5 space-y-1 max-w-xs">
                            <div className="text-slate-300 truncate">{ord.address}</div>
                            <span className={`inline-block text-[10px] px-2 py-0.5 rounded font-semibold border ${
                              ord.deliveryZone === 'inside_dhaka'
                                ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                                : ord.deliveryZone === 'sub_dhaka'
                                ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            }`}>
                              {ord.deliveryZone === 'inside_dhaka'
                                ? 'ঢাকার ভেতরে'
                                : ord.deliveryZone === 'sub_dhaka'
                                ? 'ঢাকার সাব সিটি'
                                : 'ঢাকার বাইরে'}
                            </span>
                          </td>

                          <td className="p-3.5 space-y-1">
                            <div className="text-slate-200">{ord.productVariant}</div>
                            <div className="text-slate-500 text-[10px]">পরিমাণ: {ord.quantity} টি</div>
                          </td>

                          <td className="p-3.5">
                            <div className="font-extrabold text-rose-400 text-sm">৳{ord.totalPrice}</div>
                            <div className="text-[10px] text-slate-500">চার্জ: ৳{ord.deliveryCharge}</div>
                          </td>

                          <td className="p-3.5">
                            <select
                              value={ord.status}
                              onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                              disabled={updatingId === ord.id}
                              className={`text-xs font-semibold px-2.5 py-1 rounded-lg border outline-none cursor-pointer bg-slate-950 ${
                                ord.status === 'Pending'
                                  ? 'text-amber-400 border-amber-500/40'
                                  : ord.status === 'Confirmed'
                                  ? 'text-sky-400 border-sky-500/40'
                                  : ord.status === 'Shipped'
                                  ? 'text-emerald-400 border-emerald-500/40'
                                  : 'text-rose-400 border-rose-500/40'
                              }`}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </td>

                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => handleDeleteOrder(ord.id)}
                              disabled={updatingId === ord.id}
                              className="p-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg transition"
                              title="Delete Order"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: INCOMPLETE ORDERS (অসমাপ্ত অর্ডার) */}
        {activeTab === 'incomplete' && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <AlertCircle className="w-7 h-7 text-amber-500" />
                <span>অসমাপ্ত ও বাতিলকৃত অর্ডার তালিকা</span>
              </h1>
              <p className="text-xs text-slate-400">যেসব কাস্টমার অর্ডার বাতিল করেছেন বা ফর্ম পুরোপুরি পূরণ করেননি (Follow-up list)</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              {orders.filter(o => o.status === 'Cancelled').length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                  <h3 className="text-lg font-bold text-white">বর্তমানে কোনো বাতিল বা অসমাপ্ত অর্ডার নেই!</h3>
                  <p className="text-xs text-slate-400">সব অর্ডার সক্রিয় আছে</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-300">বাতিলকৃত অর্ডারসমূহ (Call Back Target):</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {orders.filter(o => o.status === 'Cancelled').map((ord) => (
                      <div key={ord.id} className="bg-slate-950 border border-rose-500/30 p-4 rounded-xl space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-mono font-bold text-rose-400">#{ord.orderNumber}</span>
                            <h4 className="font-bold text-white text-sm">{ord.customerName}</h4>
                          </div>
                          <span className="text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/40 px-2 py-0.5 rounded font-semibold">
                            Cancelled
                          </span>
                        </div>

                        <div className="text-xs text-slate-300 space-y-1">
                          <div>ফোন: <a href={`tel:${ord.phone}`} className="text-emerald-400 font-mono underline">{ord.phone}</a></div>
                          <div>ঠিকানা: {ord.address}</div>
                          <div>আইটেম: {ord.productVariant} ({ord.quantity} টি) - ৳{ord.totalPrice}</div>
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-slate-900">
                          <a
                            href={`tel:${ord.phone}`}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 rounded-lg text-center flex items-center justify-center gap-1.5"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                            <span>কল দিন</span>
                          </a>
                          <button
                            onClick={() => handleStatusChange(ord.id, 'Pending')}
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2 rounded-lg text-center"
                          >
                            পুনরায় রিস্টোর করুন
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: ACCOUNTS (হিসাব) */}
        {activeTab === 'accounts' && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Wallet className="w-7 h-7 text-emerald-400" />
                <span>ব্যবসায়িক হিসাব ও লাভ-ক্ষতি সামারি</span>
              </h1>
              <p className="text-xs text-slate-400">মোট বিক্রয়, কুরিয়ার চার্জ ও অনুমিত নিট প্রফিট ক্যালকুলেশন</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
                <div className="text-xs text-slate-400 font-semibold uppercase">সর্বমোট গ্রস রেভিনিউ</div>
                <div className="text-3xl font-black text-emerald-400">৳{(stats?.totalRevenue || 0).toLocaleString()}</div>
                <p className="text-xs text-slate-400">কুরিয়ার চার্জ সহ কাস্টমার থেকে মোট সংগৃহীত টাকা</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
                <div className="text-xs text-slate-400 font-semibold uppercase">কুরিয়ার পে-আউট (ডেলিভারি খরচ)</div>
                <div className="text-3xl font-black text-amber-400">৳{totalDeliveryRevenue.toLocaleString()}</div>
                <p className="text-xs text-slate-400">ঢাকা ({insideDhakaCount}টি @70৳) + ঢাকার বাইরে ({outsideDhakaCount}টি @130৳)</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
                <div className="text-xs text-slate-400 font-semibold uppercase">পণ্য বিক্রয় হতে নিট আয়</div>
                <div className="text-3xl font-black text-sky-400">৳{netProductRevenue.toLocaleString()}</div>
                <p className="text-xs text-slate-400">ডেলিভারি চার্জ বাদ দিয়ে আসল পণ্যের মূল্য</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <span>আনুমানিক নিট প্রফিট মার্জিন (Est. Profit)</span>
              </h3>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-400">আনুমানিক প্রফিট মার্জিন (~৪০%):</span>
                  <div className="text-2xl font-black text-emerald-400 mt-1">৳{estimatedProfit.toLocaleString()}</div>
                </div>
                <div className="text-xs text-slate-400 leading-relaxed">
                  * বি.দ্র.: এই হিসাবটি পণ্য ক্রয়মূল্য, প্যাকেজিং ও ফেসবুক অ্যাড স্পেন্ড বাদ দিয়ে আনুমানিক মার্জিন হিসোবে তৈরি করা হয়েছে।
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: SETTINGS (সেটিংস) */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Settings className="w-7 h-7 text-purple-400" />
                <span>সিস্টেম ও শপ সেটিংস</span>
              </h1>
              <p className="text-xs text-slate-400">ডেলিভারি চার্জ, মেটা পিক্সেল ও কাস্টম সেটিংস পরিচালনা</p>
            </div>

            {saveSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 text-xs font-semibold rounded-xl text-center">
                {saveSuccess}
              </div>
            )}

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white">ডেলিভারি চার্জ সেটিংস (BDT)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1 font-semibold">ঢাকার ভেতরে চার্জ (৳)</label>
                    <input
                      type="number"
                      value={dhakaDelivery}
                      onChange={(e) => setDhakaDelivery(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-rose-500 font-bold text-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1 font-semibold">
                      ঢাকার সাব সিটিতে (গাজীপুর, নারায়ণগঞ্জ, কেরানীগঞ্জ এবং দোহার) (৳)
                    </label>
                    <input
                      type="number"
                      value={subDhakaDelivery}
                      onChange={(e) => setSubDhakaDelivery(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-rose-500 font-bold text-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1 font-semibold">ঢাকার বাইরে চার্জ (৳)</label>
                    <input
                      type="number"
                      value={outsideDelivery}
                      onChange={(e) => setOutsideDelivery(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-rose-500 font-bold text-emerald-400"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-800">
                <h3 className="text-sm font-bold text-white">মেটা পিক্সেল (Meta Pixel ID)</h3>
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-semibold">Facebook Pixel ID</label>
                  <input
                    type="text"
                    value={pixelId}
                    onChange={(e) => setPixelId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-rose-500 font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">ল্যান্ডিং পেজে কাস্টমার ইভেন্ট ও Purchase ট্র্যাক করার পিক্সেল আইকন</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs px-6 py-3 rounded-xl transition flex items-center gap-2 shadow-lg shadow-rose-600/20"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingSettings ? 'সেভ হচ্ছে...' : 'সেটিংস সেভ করুন'}</span>
                </button>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
