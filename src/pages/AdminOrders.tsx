import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';
import { ShoppingBag, Truck, CheckCircle2, Search, Filter, Clock, MoreVertical, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Order } from '../types';

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const q = query(collection(db, 'orders'), orderBy('created_at', 'desc'));
        const snap = await getDocs(q);
        setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         o.buyer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-600';
      case 'shipped': return 'bg-blue-100 text-blue-600';
      case 'pending': return 'bg-yellow-100 text-yellow-600';
      case 'cancelled': return 'bg-red-100 text-red-600';
      default: return 'bg-neutral-100 text-neutral-600';
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-4xl font-black text-neutral-900 tracking-tight flex items-center gap-3">
          <ShoppingBag className="text-orange-600" />
          Global Orders
        </h1>
        <p className="text-neutral-500 font-medium">Monitor all transactions and logistics across Apna Bazar.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
         <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
            <input 
              type="text"
              placeholder="Search by Order ID or Buyer Name..."
              className="w-full pl-12 pr-4 py-4 bg-white border border-neutral-100 rounded-2xl font-medium focus:ring-2 focus:ring-orange-500 transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
         </div>
         <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter size={18} className="text-neutral-400" />
            <select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-white border border-neutral-100 rounded-2xl px-6 py-4 font-bold text-sm focus:ring-2 focus:ring-orange-500 transition-all outline-none"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
         </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-neutral-100 overflow-hidden shadow-sm">
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-neutral-50 border-b border-neutral-100">
                  <tr>
                     <th className="px-8 py-6 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Order ID</th>
                     <th className="px-8 py-6 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Buyer</th>
                     <th className="px-8 py-6 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Amount</th>
                     <th className="px-8 py-6 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Commission</th>
                     <th className="px-8 py-6 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Status</th>
                     <th className="px-8 py-6 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Date</th>
                     <th className="px-8 py-6 text-[10px] font-bold text-neutral-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-neutral-50">
                  {filteredOrders.map((o) => (
                     <tr key={o.id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="px-8 py-6 font-mono text-xs font-bold text-neutral-500 uppercase">
                           #{o.id.slice(-8)}
                        </td>
                        <td className="px-8 py-6">
                           <p className="font-bold text-neutral-900">{o.buyer_name}</p>
                           <p className="text-[10px] text-neutral-400 font-medium">{o.phone}</p>
                        </td>
                        <td className="px-8 py-6 font-bold text-neutral-900">
                           Rs. {o.total_amount?.toLocaleString()}
                        </td>
                        <td className="px-8 py-6 font-bold text-orange-600">
                           Rs. {o.admin_commission?.toLocaleString()}
                        </td>
                        <td className="px-8 py-6">
                           <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(o.status)}`}>
                              {o.status}
                           </span>
                        </td>
                        <td className="px-8 py-6 text-sm text-neutral-500 font-medium">
                           {o.created_at?.toDate().toLocaleDateString()}
                        </td>
                        <td className="px-8 py-6 text-right">
                           <button className="p-2 hover:bg-neutral-100 rounded-xl transition-colors">
                              <Eye size={20} className="text-neutral-400" />
                           </button>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
            {filteredOrders.length === 0 && !loading && (
               <div className="py-20 text-center space-y-4">
                  <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto">
                     <ShoppingBag size={32} className="text-neutral-200" />
                  </div>
                  <p className="text-neutral-400 font-medium">No orders found matching your filters.</p>
               </div>
            )}
         </div>
      </div>
    </div>
  );
}
