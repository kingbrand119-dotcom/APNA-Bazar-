import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { Package, ShoppingBag, TrendingUp, Users, DollarSign, Clock, Wallet, ArrowUpRight, ArrowDownRight, History } from 'lucide-react';
import { motion } from 'motion/react';
import { Transaction } from '../types';

export default function SellerDashboard() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    revenue: 0,
    pending: 0
  });

  useEffect(() => {
    const fetchSellerData = async () => {
      if (!user) return;
      
      // Fetch Balance
      const userRef = doc(db, 'users', user.id);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setBalance(userSnap.data().balance || 0);
      }

      // Fetch Stats
      const pSnapshot = await getDocs(query(collection(db, 'products'), where('seller_id', '==', user.id)));
      const oSnapshot = await getDocs(query(collection(db, 'orders'), where('seller_id', '==', user.id)));
      
      const orders = oSnapshot.docs.map(d => d.data());
      const revenue = orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + (o.seller_amount || o.total_amount), 0);
      const pending = orders.filter(o => o.status === 'pending').length;

      setStats({
        products: pSnapshot.size,
        orders: oSnapshot.size,
        revenue,
        pending
      });

      // Fetch Recent Transactions
      const tSnapshot = await getDocs(query(
        collection(db, 'transactions'), 
        where('user_id', '==', user.id),
        orderBy('created_at', 'desc'),
        limit(5)
      ));
      setTransactions(tSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
    };
    fetchSellerData();
  }, [user]);

  const metrics = [
    { title: 'Wallet Balance', value: `Rs. ${balance.toLocaleString()}`, icon: Wallet, color: 'text-orange-600', bg: 'bg-orange-50' },
    { title: 'Active Products', value: stats.products, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Pending Orders', value: stats.pending, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { title: 'Total Earnings', value: `Rs. ${stats.revenue.toLocaleString()}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' }
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-4xl font-black text-neutral-900 tracking-tight">Seller Dashboard</h1>
           <p className="text-neutral-500 font-medium">Welcome back, {user?.shop_name || user?.name}. Here's your business at a glance.</p>
        </div>
        <div className="flex bg-white p-2 border border-neutral-100 rounded-2xl gap-1">
           <button className="px-4 py-2 bg-neutral-900 text-white text-xs font-bold rounded-xl transition-all">Overview</button>
           <button className="px-4 py-2 text-neutral-400 text-xs font-bold rounded-xl hover:bg-neutral-50 transition-all">Analytics</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-8 rounded-[2rem] border border-neutral-100 shadow-xl shadow-neutral-100/20 group hover:-translate-y-1 transition-all duration-300"
          >
            <div className={`w-12 h-12 ${m.bg} ${m.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
               <m.icon size={24} />
            </div>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em] mb-2">{m.title}</p>
            <h3 className="text-2xl font-black text-neutral-900 tracking-tight">{m.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-white p-10 rounded-[3rem] border border-neutral-100 space-y-6">
            <div className="flex items-center justify-between">
               <h3 className="text-xl font-bold flex items-center gap-2">
                 <History className="text-orange-600" />
                 Recent Transactions
               </h3>
               <button className="text-xs font-bold text-orange-600 hover:underline">View All</button>
            </div>
            <div className="space-y-4">
              {transactions.length === 0 ? (
                <p className="text-neutral-400 text-sm py-10 text-center">No transactions yet.</p>
              ) : (
                transactions.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                       <div className={`p-2 rounded-xl ${t.type === 'sale' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          {t.type === 'sale' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                       </div>
                       <div>
                          <p className="text-sm font-bold capitalize">{t.type}</p>
                          <p className="text-[10px] text-neutral-400 font-medium">Order ID: {t.order_id?.slice(-6).toUpperCase()}</p>
                       </div>
                    </div>
                    <p className={`font-bold ${t.type === 'sale' ? 'text-green-600' : 'text-red-600'}`}>
                       {t.type === 'sale' ? '+' : '-'} Rs. {t.amount}
                    </p>
                  </div>
                ))
              )}
            </div>
         </div>
         
         <div className="bg-neutral-900 p-10 rounded-[3rem] text-white space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/20 rounded-full blur-3xl -mr-32 -mt-32" />
            <TrendingUp size={48} className="text-orange-500 mb-4" />
            <h3 className="text-3xl font-bold leading-tight">Grow your shop reaching nationwide customers.</h3>
            <p className="text-neutral-400 leading-relaxed font-medium">Add more items and provide great service to improve your rating and visibility in the marketplace.</p>
            <Link to="/seller/products" className="inline-block px-8 py-3 bg-white text-neutral-900 font-bold rounded-2xl hover:bg-orange-50 transition-all text-center">Add New Product</Link>
         </div>
      </div>
    </div>
  );
}
