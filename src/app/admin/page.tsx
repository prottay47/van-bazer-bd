'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
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
  Filter
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

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const router = useRouter();

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

  useEffect(() => {
    fetchDashboardData();
  }, []);

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

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
            <PackageCheck className="w-8 h-8 text-rose-500" />
            <span>Van Bazer BD Order Dashboard</span>
          </h1>
          <p className="text-xs text-slate-400">কাস্টমার অর্ডার ও সেলস স্ট্যাটিস্টিক্স একনজরে</p>
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

          <button
            onClick={handleLogout}
            className="p-2.5 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-400 rounded-xl transition flex items-center gap-1.5 text-xs font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span>লগআউট</span>
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>মোট সেলস রেভিনিউ</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl md:text-2xl font-extrabold text-emerald-400">
              ৳{stats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-[10px] text-slate-500">ক্যান্সেলড অর্ডার ব্যতীত</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>আজকের সেলস</span>
              <TrendingUp className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-xl md:text-2xl font-extrabold text-white">
              ৳{stats.todayRevenue.toLocaleString()}
            </div>
            <p className="text-[10px] text-slate-500">আজকের মোট {stats.todayOrdersCount} টি অর্ডার</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>পেন্ডিং অর্ডার</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl md:text-2xl font-extrabold text-amber-400">
              {stats.pendingOrders}
            </div>
            <p className="text-[10px] text-slate-500">কনফার্মেশনের অপেক্ষায়</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>মোট অর্ডার সংখ্যা</span>
              <PackageCheck className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-xl md:text-2xl font-extrabold text-sky-400">
              {stats.totalOrders}
            </div>
            <p className="text-[10px] text-slate-500">সার্বমোট সংগৃহীত</p>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-3 justify-between items-center bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        {/* Search Bar */}
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

        {/* Status Filter Buttons */}
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

      {/* Orders Table */}
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
                    {/* Order ID & Date */}
                    <td className="p-3.5 space-y-1">
                      <div className="font-bold text-white font-mono text-xs">#{ord.orderNumber}</div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(ord.createdAt).toLocaleString('bn-BD')}
                      </div>
                    </td>

                    {/* Customer Info */}
                    <td className="p-3.5 space-y-1">
                      <div className="font-medium text-white">{ord.customerName}</div>
                      <div className="flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                        <PhoneCall className="w-3 h-3" />
                        <a href={`tel:${ord.phone}`} className="hover:underline">{ord.phone}</a>
                      </div>
                    </td>

                    {/* Address & Zone */}
                    <td className="p-3.5 space-y-1 max-w-xs">
                      <div className="text-slate-300 truncate">{ord.address}</div>
                      <span className={`inline-block text-[10px] px-2 py-0.5 rounded font-semibold border ${
                        ord.deliveryZone === 'inside_dhaka'
                          ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}>
                        {ord.deliveryZone === 'inside_dhaka' ? 'ঢাকার ভেতরে' : 'ঢাকার বাইরে'}
                      </span>
                    </td>

                    {/* Variant & Qty */}
                    <td className="p-3.5 space-y-1">
                      <div className="text-slate-200">{ord.productVariant}</div>
                      <div className="text-slate-500 text-[10px]">পরিমাণ: {ord.quantity} টি</div>
                    </td>

                    {/* Total Price */}
                    <td className="p-3.5">
                      <div className="font-extrabold text-rose-400 text-sm">৳{ord.totalPrice}</div>
                      <div className="text-[10px] text-slate-500">চার্জ: ৳{ord.deliveryCharge}</div>
                    </td>

                    {/* Status Dropdown */}
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

                    {/* Actions */}
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
  );
}
