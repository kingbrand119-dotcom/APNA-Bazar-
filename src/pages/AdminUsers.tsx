import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, getDocs, doc, updateDoc, orderBy } from 'firebase/firestore';
import { Users, Shield, User, Store, Mail, Phone, MoreHorizontal, Search, ShieldAlert, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { User as UserType } from '../types';

export default function AdminUsers() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'users'), orderBy('created_at', 'desc')));
        setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as UserType)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'seller' ? 'customer' : 'seller';
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
    } catch (err) {
      alert('Failed to update user role');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-4xl font-black text-neutral-900 tracking-tight flex items-center gap-3">
          <Users className="text-orange-600" />
          Platform Users
        </h1>
        <p className="text-neutral-500 font-medium">Manage user accounts, roles, and platform access.</p>
      </div>

      <div className="relative">
         <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-400" size={24} />
         <input 
           type="text"
           placeholder="Search by name or email..."
           className="w-full pl-16 pr-8 py-5 bg-white border border-neutral-100 rounded-[2rem] font-bold text-lg shadow-sm focus:ring-4 focus:ring-orange-500/10 transition-all outline-none"
           value={searchTerm}
           onChange={e => setSearchTerm(e.target.value)}
         />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((u, i) => (
          <motion.div 
            key={u.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 relative overflow-hidden group"
          >
            <div className="flex items-start justify-between relative z-10">
               <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center overflow-hidden">
                     {u.profile_image ? (
                        <img src={u.profile_image} className="w-full h-full object-cover" alt={u.name} />
                     ) : (
                        <User size={32} className="text-neutral-300" />
                     )}
                  </div>
                  <div>
                    <h3 className="font-black text-neutral-900 tracking-tight">{u.name}</h3>
                    <p className="text-xs font-bold text-neutral-400">{u.email}</p>
                  </div>
               </div>
               <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${u.role === 'admin' ? 'bg-purple-100 text-purple-600' : u.role === 'seller' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                  {u.role}
               </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
               <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-neutral-500">
                     <Mail size={14} className="text-neutral-300" />
                     {u.email.split('@')[0]}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-neutral-500">
                     <Phone size={14} className="text-neutral-300" />
                     {u.phone || 'No phone'}
                  </div>
               </div>
               <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => toggleRole(u.id, u.role)}
                    disabled={u.role === 'admin'}
                    className="w-full py-2 bg-neutral-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-orange-600 transition-colors disabled:opacity-30"
                  >
                     {u.role === 'seller' ? 'Demote to Buyer' : 'Make Seller'}
                  </button>
                  <button className="w-full py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-600 hover:text-white transition-colors">
                     Block User
                  </button>
               </div>
            </div>

            <div className="absolute top-0 right-0 w-32 h-32 bg-neutral-50 rounded-full translate-x-16 -translate-y-16 -z-0 opacity-50 group-hover:bg-orange-50 transition-colors" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
