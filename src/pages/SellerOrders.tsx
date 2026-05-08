import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, updateDoc, doc, orderBy, runTransaction, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';
import { ClipboardList, Check, Truck, CheckCircle2, Phone, User } from 'lucide-react';

export default function SellerOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    if (!user) return;
    setLoading(true);
    const path = 'orders';
    try {
      const q = query(
        collection(db, path), 
        where('seller_id', '==', user.id),
        orderBy('created_at', 'desc')
      );
      const snapshot = await getDocs(q);
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const updateStatus = async (orderId: string, status: string) => {
    try {
      if (status === 'delivered') {
        const orderRef = doc(db, 'orders', orderId);
        
        await runTransaction(db, async (transaction) => {
          const orderSnap = await transaction.get(orderRef);
          if (!orderSnap.exists()) throw "Order not found";
          
          const orderData = orderSnap.data();
          if (orderData.status === 'delivered') return; // Already processed

          const sellerId = orderData.seller_id;
          const sellerRef = doc(db, 'users', sellerId);
          const sellerSnap = await transaction.get(sellerRef);
          
          // Find Admin (for commission)
          const adminQuery = query(collection(db, 'users'), where('role', '==', 'admin'));
          const adminSnap = await getDocs(adminQuery);
          const adminId = adminSnap.docs[0]?.id;

          const sellerAmount = orderData.seller_amount || (orderData.total_amount * 0.95);
          const adminCommission = orderData.admin_commission || (orderData.total_amount * 0.05);

          // Update Order Status
          transaction.update(orderRef, { status: 'delivered' });

          // Update Seller Balance
          if (sellerSnap.exists()) {
             transaction.update(sellerRef, { 
               balance: (sellerSnap.data().balance || 0) + sellerAmount 
             });
          }

          // Update Admin Balance
          if (adminId) {
            const adminRef = doc(db, 'users', adminId);
            const aSnap = await transaction.get(adminRef);
            if (aSnap.exists()) {
              transaction.update(adminRef, { 
                balance: (aSnap.data().balance || 0) + adminCommission 
              });
            }
          }

          // Create Transaction records
          const sellerTxRef = doc(collection(db, 'transactions'));
          transaction.set(sellerTxRef, {
            user_id: sellerId,
            type: 'sale',
            amount: sellerAmount,
            order_id: orderId,
            status: 'completed',
            created_at: serverTimestamp()
          });

          if (adminId) {
            const adminTxRef = doc(collection(db, 'transactions'));
            transaction.set(adminTxRef, {
              user_id: adminId,
              type: 'commission',
              amount: adminCommission,
              order_id: orderId,
              status: 'completed',
              created_at: serverTimestamp()
            });
          }
        });
      } else {
        await updateDoc(doc(db, 'orders', orderId), { status });
      }
      
      setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o));
    } catch (err) {
      console.error(err);
      alert('Order update failed');
    }
  };

  if (loading) return <div className="py-20 text-center animate-pulse">Loading incoming orders...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm shadow-black/5">
        <div>
           <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight flex items-center gap-2">
             <ClipboardList className="text-orange-600" size={32} />
             Live Orders
           </h1>
           <p className="text-neutral-500 font-medium">Fulfill your orders and communicate with buyers.</p>
        </div>
      </div>

      <div className="bg-white border border-neutral-100 rounded-3xl overflow-hidden shadow-sm">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-neutral-50/50 border-b border-neutral-100 text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em]">
                     <th className="px-8 py-5">Order & Customer</th>
                     <th className="px-8 py-5">Value</th>
                     <th className="px-8 py-5">Status</th>
                     <th className="px-8 py-5 text-right">Fulfillment</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-neutral-50">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-neutral-50/30 transition-colors">
                       <td className="px-8 py-6">
                          <div className="flex flex-col gap-1">
                             <span className="font-bold text-neutral-900">#{order.id.slice(0, 8)}</span>
                             <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                                <User size={12} />
                                <span>{order.buyer_name}</span>
                             </div>
                             <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                                <Phone size={12} />
                                <span>{order.phone}</span>
                             </div>
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <p className="font-bold text-orange-600">Rs. {order.total_amount}</p>
                          <p className="text-[10px] text-neutral-400">{order.items.length} items</p>
                       </td>
                       <td className="px-8 py-6">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            order.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                            order.status === 'shipped' ? 'bg-purple-100 text-purple-700' :
                            order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {order.status}
                          </span>
                       </td>
                       <td className="px-8 py-6 text-right">
                          <div className="flex justify-end gap-2">
                             {order.status === 'pending' && (
                               <button 
                                 onClick={() => updateStatus(order.id, 'confirmed')}
                                 className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                                 title="Confirm Order"
                               >
                                  <Check size={18} />
                               </button>
                             )}
                             {order.status === 'confirmed' && (
                               <button 
                                 onClick={() => updateStatus(order.id, 'shipped')}
                                 className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-600 hover:text-white transition-all"
                                 title="Ship Order"
                               >
                                  <Truck size={18} />
                               </button>
                             )}
                             {order.status === 'shipped' && (
                               <button 
                                 onClick={() => updateStatus(order.id, 'delivered')}
                                 className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all"
                                 title="Mark Delivered"
                               >
                                  <CheckCircle2 size={18} />
                               </button>
                             )}
                             <button className="px-3 py-2 text-xs font-bold text-neutral-400 hover:text-red-600 transition-colors">Cancel</button>
                          </div>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
         {orders.length === 0 && (
           <div className="py-20 text-center text-neutral-400 font-medium italic">
             <ClipboardList className="mx-auto mb-2 text-neutral-100" size={60} />
             No orders yet.
           </div>
         )}
      </div>
    </div>
  );
}
