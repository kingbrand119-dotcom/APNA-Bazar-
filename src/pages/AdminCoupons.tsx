import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, getDocs, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';
import { Plus, Trash2, Edit2, Ticket, Percent, DollarSign, Calendar, Check, X } from 'lucide-react';
import { Coupon } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Coupon | null>(null);

  const fetchCoupons = async () => {
    setLoading(true);
    const path = 'coupons';
    try {
      const q = query(collection(db, path), orderBy('created_at', 'desc'));
      const snap = await getDocs(q);
      setCoupons(snap.docs.map(d => ({ id: d.id, ...d.data() } as Coupon)));
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = Object.fromEntries(formData.entries());
    
    data.active = data.active === 'on';
    data.discount_value = parseFloat(data.discount_value);
    data.min_purchase = parseFloat(data.min_purchase || '0');

    try {
      if (editingItem) {
        await updateDoc(doc(db, 'coupons', editingItem.id), data);
      } else {
        await addDoc(collection(db, 'coupons'), { ...data, created_at: serverTimestamp() });
      }
      setShowModal(false);
      setEditingItem(null);
      fetchCoupons();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    try {
      await deleteDoc(doc(db, 'coupons', id));
      fetchCoupons();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Ticket className="text-orange-600" />
            Promo Codes & Coupons
          </h1>
          <p className="text-neutral-500 text-sm mt-1">Manage discount codes for customers.</p>
        </div>
        <button 
          onClick={() => { setEditingItem(null); setShowModal(true); }}
          className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-orange-700 transition-all shadow-lg shadow-orange-200"
        >
          <Plus size={20} />
          Create New Coupon
        </button>
      </div>

      <div className="bg-white border border-neutral-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50/50 border-b border-neutral-100 text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em]">
                <th className="px-8 py-5">Code</th>
                <th className="px-8 py-5">Value</th>
                <th className="px-8 py-5">Requirement</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {coupons.map(coupon => (
                <tr key={coupon.id} className="hover:bg-neutral-50/30 transition-colors">
                  <td className="px-8 py-6">
                    <span className="font-mono bg-neutral-100 px-3 py-1.5 rounded-lg text-sm font-bold border border-neutral-200">
                      {coupon.code}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 font-bold text-neutral-900">
                      {coupon.discount_type === 'percentage' ? <Percent size={16} className="text-orange-600" /> : <DollarSign size={16} className="text-orange-600" />}
                      {coupon.discount_value}{coupon.discount_type === 'percentage' ? '%' : ' Rs.'}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-xs text-neutral-500">
                      Min: Rs. {coupon.min_purchase || 0}
                    </p>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      coupon.active ? 'bg-green-50 text-green-600' : 'bg-neutral-50 text-neutral-400'
                    }`}>
                      {coupon.active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2">
                       <button onClick={() => { setEditingItem(coupon); setShowModal(true); }} className="p-2 text-neutral-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all">
                          <Edit2 size={18} />
                       </button>
                       <button onClick={() => handleDelete(coupon.id)} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                          <Trash2 size={18} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {coupons.length === 0 && !loading && (
          <div className="py-20 text-center text-neutral-400 font-medium">
             <Ticket className="mx-auto mb-2 opacity-50" size={40} />
             <p>No coupons found. Create your first one!</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative"
          >
            <h2 className="text-2xl font-bold mb-6">
              {editingItem ? 'Edit' : 'Create'} Coupon
            </h2>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-1.5 uppercase tracking-wide">Coupon Code</label>
                <input 
                  name="code" 
                  defaultValue={editingItem?.code}
                  required
                  placeholder="SAVE50"
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-neutral-700 mb-1.5 uppercase tracking-wide">Type</label>
                  <select name="discount_type" defaultValue={editingItem?.discount_type || 'percentage'} className="w-full px-4 py-3 rounded-xl border border-neutral-200">
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Price (Rs.)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-neutral-700 mb-1.5 uppercase tracking-wide">Value</label>
                  <input 
                    name="discount_value" 
                    type="number"
                    defaultValue={editingItem?.discount_value}
                    required
                    placeholder="10"
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-1.5 uppercase tracking-wide">Min Purchase (Rs.)</label>
                <input 
                  name="min_purchase" 
                  type="number"
                  defaultValue={editingItem?.min_purchase || 0}
                  placeholder="0"
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-1.5 uppercase tracking-wide">Expiry Date (Optional)</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                  <input 
                    name="expiry_date" 
                    type="date"
                    defaultValue={editingItem?.expiry_date}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-neutral-200"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  name="active" 
                  id="coupon-active"
                  defaultChecked={editingItem ? editingItem.active : true}
                  className="w-5 h-5 rounded text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="coupon-active" className="text-sm font-bold text-neutral-700">Set as active</label>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 rounded-xl border border-neutral-200 font-bold hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-700 shadow-lg shadow-orange-100 transition-all"
                >
                  {editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
