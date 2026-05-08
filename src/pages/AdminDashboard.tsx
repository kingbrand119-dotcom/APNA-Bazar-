import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { LayoutDashboard, Users, ShoppingCart, DollarSign, Wallet, ArrowUpRight, ArrowDownRight, History, PackageSearch, Megaphone } from 'lucide-react';
import { motion } from 'motion/react';
import { Transaction } from '../types';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalSales: 0,
    pendingProducts: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // Fetch Balance
        const userRef = doc(db, 'users', user.id);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setBalance(userSnap.data().balance || 0);
        }

        // Fetch Stats
        const uSnap = await getDocs(collection(db, 'users'));
        const oSnap = await getDocs(collection(db, 'orders'));
        const pSnap = await getDocs(query(collection(db, 'products'), where('is_approved', '==', false)));
        
        const totalSales = oSnap.docs.reduce((sum, d) => sum + (d.data().total_amount || 0), 0);

        setStats({
          totalUsers: uSnap.size,
          totalOrders: oSnap.size,
          totalSales,
          pendingProducts: pSnap.size
        });

        // Fetch Recent Transactions
        const tSnapshot = await getDocs(query(
          collection(db, 'transactions'), 
          where('type', '==', 'commission'),
          orderBy('created_at', 'desc'),
          limit(5)
        ));
        setTransactions(tSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, [user]);

  const metrics = [
    { title: 'Admin Wallet', value: `Rs. ${balance.toLocaleString()}`, icon: Wallet, color: 'text-orange-600', bg: 'bg-orange-50', link: '/admin/finances' },
    { title: 'Platform Sales', value: `Rs. ${stats.totalSales.toLocaleString()}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50', link: '/admin/orders' },
    { title: 'Total Orders', value: stats.totalOrders, icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50', link: '/admin/orders' },
    { title: 'Registered Users', value: stats.totalUsers, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50', link: '/admin/users' }
  ];

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-4xl font-black text-neutral-900 tracking-tight flex items-center gap-3">
             <LayoutDashboard className="text-orange-600" />
             Admin Command Center
           </h1>
           <p className="text-neutral-500 font-medium">Manage Apna Bazar platform, finances, and growth.</p>
        </div>
        <div className="flex gap-2">
           <Link to="/admin/orders" className="px-6 py-3 bg-white border border-neutral-100 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-neutral-50 transition-all flex items-center gap-2">
              <ShoppingCart size={14} /> Orders
           </Link>
           <Link to="/admin/users" className="px-6 py-3 bg-white border border-neutral-100 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-neutral-50 transition-all flex items-center gap-2">
              <Users size={14} /> Users
           </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m, i) => (
          <Link 
            key={i}
            to={m.link || '#'}
            className="bg-white p-8 rounded-[2rem] border border-neutral-100 shadow-xl shadow-neutral-100/20 group hover:-translate-y-1 transition-all duration-300"
          >
            <div className={`w-12 h-12 ${m.bg} ${m.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
               <m.icon size={24} />
            </div>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em] mb-2">{m.title}</p>
            <h3 className="text-2xl font-black text-neutral-900 tracking-tight">{m.value}</h3>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Pending Approvals Card */}
         <Link to="/admin/approvals" className="lg:col-span-1 bg-neutral-900 p-10 rounded-[3rem] text-white flex flex-col justify-between group hover:shadow-2xl transition-all">
            <div>
               <PackageSearch size={48} className="text-orange-500 mb-6" />
               <h3 className="text-3xl font-bold leading-tight">Product Approvals</h3>
               <p className="text-neutral-400 mt-2 font-medium">Review and verify new products before they go live on the bazar.</p>
            </div>
            <div className="mt-8 flex items-center justify-between">
               <span className="text-5xl font-black text-orange-500">{stats.pendingProducts}</span>
               <div className="px-6 py-2 bg-white/10 rounded-xl text-xs font-bold uppercase tracking-widest group-hover:bg-orange-600 transition-colors">Review Now</div>
            </div>
         </Link>

         {/* Marketing Control Card */}
         <Link to="/admin/promotions" className="lg:col-span-1 bg-orange-600 p-10 rounded-[3rem] text-white flex flex-col justify-between group hover:shadow-2xl transition-all">
            <div>
               <Megaphone size={48} className="text-white mb-6" />
               <h3 className="text-3xl font-bold leading-tight">Marketing & Ads</h3>
               <p className="text-orange-100 mt-2 font-medium">Manage homepage banners, seasonal sales, and popup advertisements.</p>
            </div>
            <div className="mt-8 flex items-center justify-end">
               <div className="px-6 py-2 bg-white text-orange-600 rounded-xl text-xs font-bold uppercase tracking-widest group-hover:scale-105 transition-all">Manage Hub</div>
            </div>
         </Link>

         {/* Recent Revenue Card */}
         <div className="lg:col-span-1 bg-white p-10 rounded-[3rem] border border-neutral-100 shadow-sm flex flex-col">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
               <History className="text-orange-600" />
               Recent Commissions
            </h3>
            <div className="space-y-4 flex-1">
               {transactions.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl">
                     <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-orange-100 text-orange-600">
                           <ArrowUpRight size={18} />
                        </div>
                        <div>
                           <p className="text-sm font-bold">5% Commission</p>
                           <p className="text-[10px] text-neutral-400 font-medium">ID: {t.order_id?.slice(-4).toUpperCase()}</p>
                        </div>
                     </div>
                     <p className="font-bold text-green-600">+ Rs. {t.amount}</p>
                  </div>
               ))}
               {transactions.length === 0 && (
                  <p className="text-neutral-400 text-sm italic py-10 text-center">No commissions recorded yet.</p>
               )}
            </div>
         </div>
      </div>
    </div>
  );
}
