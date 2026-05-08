import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { MapPin, Phone, MessageSquare, LogOut, Save, ShieldCheck, LayoutDashboard, Store, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { user, logout, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    whatsapp: user?.whatsapp || '',
    address: user?.address || '',
    shop_name: user?.shop_name || ''
  });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.id), formData);
      await refreshUser();
      alert('Profile updated!');
    } catch (err) {
      alert('Update failed');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {user.role === 'admin' && (
          <Link to="/admin" className="p-6 bg-orange-600 rounded-[2.5rem] text-white flex items-center justify-between group hover:shadow-xl hover:shadow-orange-200 transition-all">
             <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Management</p>
                <h3 className="text-xl font-black italic uppercase tracking-tighter">Admin Panel</h3>
             </div>
             <div className="p-3 bg-white/20 rounded-2xl group-hover:bg-white group-hover:text-orange-600 transition-all">
                <LayoutDashboard size={24} />
             </div>
          </Link>
        )}
        {(user.role === 'seller' || user.role === 'admin') && (
          <Link to="/seller" className="p-6 bg-neutral-900 rounded-[2.5rem] text-white flex items-center justify-between group hover:shadow-xl hover:shadow-neutral-900/20 transition-all">
             <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Business</p>
                <h3 className="text-xl font-black italic uppercase tracking-tighter">Seller Panel</h3>
             </div>
             <div className="p-3 bg-white/20 rounded-2xl group-hover:bg-orange-600 transition-all">
                <Store size={24} />
             </div>
          </Link>
        )}
        <Link to="/orders" className="p-6 bg-white border border-neutral-100 rounded-[2.5rem] text-neutral-900 flex items-center justify-between group hover:shadow-xl transition-all sm:col-span-full">
            <div>
               <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Shopping</p>
               <h3 className="text-xl font-black italic uppercase tracking-tighter">Order History</h3>
            </div>
            <div className="p-3 bg-neutral-100 rounded-2xl group-hover:bg-neutral-900 group-hover:text-white transition-all">
               <ShoppingBag size={24} />
            </div>
        </Link>
      </div>

      <div className="bg-white p-10 rounded-[3rem] border border-neutral-100 shadow-2xl shadow-black/5 relative overflow-hidden">
        {/* Profile Header */}
        <div className="relative z-10 flex flex-col items-center mb-10 text-center">
            <div className="w-32 h-32 rounded-full bg-neutral-100 border-4 border-white shadow-xl mb-6 overflow-hidden flex items-center justify-center font-black text-4xl text-orange-600">
               {user.profile_image ? <img src={user.profile_image} className="w-full h-full object-cover" /> : user.name?.[0]}
            </div>
            <h1 className="text-3xl font-black text-neutral-900 tracking-tight mb-1">{user.name}</h1>
            <p className="text-neutral-400 font-medium">{user.email}</p>
            <div className="mt-4 flex gap-2">
               <span className="px-3 py-1 bg-neutral-900 text-white text-[10px] font-bold rounded-full uppercase tracking-widest">{user.role}</span>
               {user.role === 'admin' && <span className="px-3 py-1 bg-orange-600 text-white text-[10px] font-bold rounded-full uppercase tracking-widest">Master</span>}
            </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1">
                 <ShieldCheck size={12} /> Full Name
              </label>
              <input 
                className="w-full px-5 py-4 bg-neutral-50 rounded-2xl border-none focus:ring-4 focus:ring-orange-500/5 transition-all text-sm font-medium"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1">
                 <Phone size={12} /> Phone Number
              </label>
              <input 
                className="w-full px-5 py-4 bg-neutral-50 rounded-2xl border-none focus:ring-4 focus:ring-orange-500/5 transition-all text-sm font-medium"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1">
               <MessageSquare size={12} /> WhatsApp Number
            </label>
            <input 
              className="w-full px-5 py-4 bg-neutral-50 rounded-2xl border-none focus:ring-4 focus:ring-orange-500/5 transition-all text-sm font-medium"
              placeholder="+92 3xx..."
              value={formData.whatsapp}
              onChange={e => setFormData({...formData, whatsapp: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1">
               <MapPin size={12} /> Shipping Address
            </label>
            <textarea 
              className="w-full px-5 py-4 bg-neutral-50 rounded-2xl border-none focus:ring-4 focus:ring-orange-500/5 transition-all text-sm font-medium h-24"
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
            />
          </div>

          {user.role === 'seller' && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Shop Name</label>
              <input 
                className="w-full px-5 py-4 bg-neutral-50 rounded-2xl border-none focus:ring-4 focus:ring-orange-500/5 transition-all text-sm font-medium"
                value={formData.shop_name}
                onChange={e => setFormData({...formData, shop_name: e.target.value})}
              />
            </div>
          )}

          <div className="pt-6 flex gap-4">
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 py-4 bg-neutral-900 text-white font-bold rounded-2xl hover:bg-black transition-all shadow-xl shadow-neutral-100 flex items-center justify-center gap-2"
            >
              <Save size={18} />
              {loading ? 'Saving...' : 'Update Profile'}
            </button>
            <button 
              type="button"
              onClick={logout}
              className="px-6 py-4 border-2 border-red-50 text-red-500 rounded-2xl hover:bg-red-50 transition-all"
            >
              <LogOut size={20} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
