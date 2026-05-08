import { useState, useEffect, useCallback } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';
import { Check, Trash2, ShieldCheck } from 'lucide-react';

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingProducts = useCallback(async () => {
    setLoading(true);
    const path = 'products';
    try {
      const q = query(collection(db, path), where('is_approved', '==', false));
      const snapshot = await getDocs(q);
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingProducts();
  }, [fetchPendingProducts]);

  const approveProduct = async (productId: string) => {
    try {
      await updateDoc(doc(db, 'products', productId), { is_approved: true });
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (err) {
      console.error(err);
      alert('Approval failed');
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm('Reject and delete this product?')) return;
    try {
      await deleteDoc(doc(db, 'products', productId));
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (err) {
      console.error(err);
      alert('Delete failed');
    }
  };

  return (
    <div className="space-y-8">
      <div>
         <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShieldCheck className="text-orange-600" size={32} />
            Product Approvals
         </h1>
         <p className="text-neutral-500">Review products before they are visible to customers.</p>
      </div>

      <div className="bg-white border border-neutral-100 rounded-3xl overflow-hidden shadow-sm">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-neutral-50/50 border-b border-neutral-100 text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em]">
                     <th className="px-8 py-5">Product</th>
                     <th className="px-8 py-5">Price</th>
                     <th className="px-8 py-5">Seller Info</th>
                     <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-neutral-50">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-neutral-50/30 transition-colors">
                       <td className="px-8 py-6 flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-neutral-100 overflow-hidden border border-neutral-200">
                             <img src={p.images?.[0]} className="w-full h-full object-cover" />
                          </div>
                          <div>
                             <p className="font-bold text-neutral-900">{p.title}</p>
                             <p className="text-xs text-neutral-400">{p.category} • {p.condition}</p>
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <p className="font-bold">Rs. {p.price}</p>
                       </td>
                       <td className="px-8 py-6">
                          <p className="text-xs font-semibold">User ID: {p.seller_id}</p>
                       </td>
                       <td className="px-8 py-6 text-right">
                          <div className="flex justify-end gap-2">
                             <button 
                               onClick={() => approveProduct(p.id)}
                               className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all"
                             >
                                <Check size={18} />
                             </button>
                             <button 
                               onClick={() => deleteProduct(p.id)}
                               className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"
                             >
                                <Trash2 size={18} />
                             </button>
                          </div>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
         {products.length === 0 && !loading && (
           <div className="py-20 text-center text-neutral-400 font-medium">
              <Check className="mx-auto mb-2 text-green-500" size={40} />
              <p>No products waiting for approval.</p>
           </div>
         )}
      </div>
    </div>
  );
}
