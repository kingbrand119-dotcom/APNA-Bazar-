import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';
import { Package, Clock, CheckCircle, Truck, XCircle } from 'lucide-react';

const statusIcons: Record<string, any> = {
  pending: Clock,
  confirmed: CheckCircle,
  shipped: Truck,
  delivered: Package,
  cancelled: XCircle
};

const statusColors: Record<string, string> = {
  pending: 'text-yellow-600 bg-yellow-50',
  confirmed: 'text-blue-600 bg-blue-50',
  shipped: 'text-purple-600 bg-purple-50',
  delivered: 'text-green-600 bg-green-50',
  cancelled: 'text-red-600 bg-red-50'
};

export default function OrderHistory() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      setLoading(true);
      const path = 'orders';
      try {
        const q = query(
          collection(db, path), 
          where('buyer_id', '==', user.id),
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
    fetchOrders();
  }, [user]);

  if (loading) return <div className="py-20 text-center animate-pulse">Loading orders...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Order History</h1>
      
      <div className="space-y-6">
        {orders.map((order) => {
          const Icon = statusIcons[order.status] || Clock;
          return (
            <div key={order.id} className="bg-white border border-neutral-100 rounded-3xl overflow-hidden shadow-sm">
              <div className="p-6 flex flex-col md:flex-row justify-between gap-4 border-b border-neutral-50">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${statusColors[order.status]}`}>
                     <Icon size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Order ID: #{order.id.slice(0, 8)}</p>
                    <p className="font-bold text-neutral-900 capitalize">{order.status}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Date</p>
                  <p className="font-bold text-neutral-900">
                    {order.created_at?.toDate().toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                {order.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="font-medium text-neutral-800">{item.title} (x{item.quantity})</span>
                    <span className="font-bold">Rs. {item.price * item.quantity}</span>
                  </div>
                ))}
                <div className="pt-4 border-t border-neutral-50 flex justify-between items-end">
                   <div>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Deliver to</p>
                      <p className="text-xs font-medium text-neutral-600 line-clamp-1">{order.shipping_address}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Grand Total</p>
                      <p className="text-xl font-black text-orange-600">Rs. {order.total_amount}</p>
                   </div>
                </div>
              </div>
            </div>
          );
        })}
        
        {orders.length === 0 && (
          <div className="text-center py-20 bg-white border border-dashed border-neutral-200 rounded-3xl">
            <Package size={48} className="mx-auto mb-4 text-neutral-200" />
            <p className="text-neutral-500 font-medium">You haven't placed any orders yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
