import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, limit } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';
import { MapPin, Phone, CreditCard, ShieldCheck, Ticket, Check, X } from 'lucide-react';
import { Coupon } from '../types';

export default function Checkout() {
  const { cart, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [address, setAddress] = useState(user?.address || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  
  const [couponCode, setCouponCode] = useState('');
  const [activeCoupon, setActiveCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const [finalTotal, setFinalTotal] = useState(total);

  useEffect(() => {
    if (activeCoupon) {
      if (activeCoupon.discount_type === 'percentage') {
        const discount = total * (activeCoupon.discount_value / 100);
        setFinalTotal(Math.max(0, total - discount));
      } else {
        setFinalTotal(Math.max(0, total - activeCoupon.discount_value));
      }
    } else {
      setFinalTotal(total);
    }
  }, [total, activeCoupon]);

  const applyCoupon = async () => {
    if (!couponCode) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const q = query(collection(db, 'coupons'), where('code', '==', couponCode.toUpperCase()), where('active', '==', true), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) {
        setCouponError('Invalid or expired coupon code.');
        setActiveCoupon(null);
      } else {
        const data = { id: snap.docs[0].id, ...snap.docs[0].data() } as Coupon;
        if (data.min_purchase && total < data.min_purchase) {
          setCouponError(`Min purchase of Rs. ${data.min_purchase} required.`);
          setActiveCoupon(null);
        } else {
          setActiveCoupon(data);
        }
      }
    } catch (err) {
      console.error(err);
      setCouponError('Error verifying coupon.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const sellerGroups: Record<string, any[]> = {};
      cart.forEach(item => {
        if (!sellerGroups[item.seller_id]) sellerGroups[item.seller_id] = [];
        sellerGroups[item.seller_id].push(item);
      });

      // Calculate discount ratio if coupon is used
      const discountRatio = finalTotal / total;

      for (const sellerId in sellerGroups) {
        const items = sellerGroups[sellerId];
        const rawSubtotal = items.reduce((sum, i) => sum + (i.discount_price || i.price) * i.quantity, 0);
        
        // Apply proportional discount to each seller's order
        const subtotal = rawSubtotal * discountRatio;
        
        const adminCommission = subtotal * 0.05;
        const sellerAmount = subtotal * 0.95;

        const orderData = {
          buyer_id: user.id,
          buyer_name: user.name,
          seller_id: sellerId,
          items: items.map(i => ({ id: i.id, title: i.title, quantity: i.quantity, price: i.discount_price || i.price })),
          total_amount: subtotal,
          seller_amount: sellerAmount,
          admin_commission: adminCommission,
          status: 'pending',
          shipping_address: address,
          phone: phone,
          payment_method: paymentMethod,
          coupon_used: activeCoupon?.code || null,
          created_at: serverTimestamp()
        };

        await addDoc(collection(db, 'orders'), orderData);
      }

      clearCart();
      navigate('/orders');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'orders');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) return <div className="py-20 text-center">Your cart is empty.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm">
            <div className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <MapPin size={20} className="text-orange-600" />
                Shipping Details
              </h3>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Full Address</label>
                <textarea 
                  required
                  className="w-full px-4 py-3 bg-neutral-50 rounded-xl border-none h-24"
                  placeholder="Street, City, Area..."
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Phone Number</label>
                <input 
                  required
                  type="tel"
                  className="w-full px-4 py-3 bg-neutral-50 rounded-xl border-none"
                  placeholder="03xx-xxxxxxx"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-neutral-100">
               <h3 className="text-lg font-bold flex items-center gap-2">
                <CreditCard size={20} className="text-orange-600" />
                Payment Method
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className={`block p-4 rounded-2xl border-2 transition-all cursor-pointer ${paymentMethod === 'cod' ? 'border-orange-600 bg-orange-50' : 'border-neutral-100 bg-neutral-50 grayscale opacity-60'}`}>
                  <input type="radio" value="cod" className="hidden" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                  <p className="font-bold">Cash on Delivery</p>
                  <p className="text-[10px] text-neutral-500">Pay when you receive</p>
                </label>
                <label className={`block p-4 rounded-2xl border-2 transition-all cursor-pointer ${paymentMethod === 'jazzcash' ? 'border-orange-600 bg-orange-50' : 'border-neutral-100 bg-neutral-50 grayscale opacity-60'}`}>
                  <input type="radio" value="jazzcash" className="hidden" checked={paymentMethod === 'jazzcash'} onChange={() => setPaymentMethod('jazzcash')} />
                  <p className="font-bold">JazzCash</p>
                  <p className="text-[10px] text-neutral-500">Fast & Secure Digital Payment</p>
                </label>
                <label className={`block p-4 rounded-2xl border-2 transition-all cursor-pointer ${paymentMethod === 'easypaisa' ? 'border-orange-600 bg-orange-50' : 'border-neutral-100 bg-neutral-50 grayscale opacity-60'}`}>
                  <input type="radio" value="easypaisa" className="hidden" checked={paymentMethod === 'easypaisa'} onChange={() => setPaymentMethod('easypaisa')} />
                  <p className="font-bold">EasyPaisa</p>
                  <p className="text-[10px] text-neutral-500">Mobile Wallet Transfer</p>
                </label>
              </div>
            </div>
          </form>
        </div>

        <div className="space-y-6">
           <div className="bg-neutral-900 text-white p-8 rounded-3xl space-y-6">
              <h3 className="text-xl font-bold">Order Summary</h3>
              
              {/* Coupon Section */}
              <div className="space-y-3 pb-4 border-b border-white/10">
                 <div className="flex gap-2">
                    <div className="relative flex-1">
                       <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
                       <input 
                         type="text" 
                         placeholder="Coupon Code"
                         value={couponCode}
                         onChange={e => setCouponCode(e.target.value)}
                         className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs font-bold uppercase"
                       />
                    </div>
                    <button 
                      onClick={applyCoupon}
                      disabled={couponLoading || !couponCode}
                      className="px-4 bg-orange-600 rounded-xl text-[10px] font-bold uppercase hover:bg-orange-700 disabled:opacity-50"
                    >
                       {couponLoading ? '...' : 'Apply'}
                    </button>
                 </div>
                 {couponError && <p className="text-[10px] text-red-400 font-bold">{couponError}</p>}
                 {activeCoupon && (
                   <div className="flex items-center justify-between text-[10px] bg-green-500/10 text-green-400 p-2 rounded-lg font-bold">
                      <span className="flex items-center gap-1"><Check size={12}/> Applied: {activeCoupon.code}</span>
                      <button onClick={() => setActiveCoupon(null)}><X size={12}/></button>
                   </div>
                 )}
              </div>

              <div className="space-y-3">
                 {cart.map(item => (
                   <div key={item.id} className="flex justify-between text-xs opacity-70">
                      <span>{item.title} x {item.quantity}</span>
                      <span>Rs. {((item.discount_price || item.price) * item.quantity).toLocaleString()}</span>
                   </div>
                 ))}
                 {activeCoupon && (
                   <div className="flex justify-between text-xs text-green-400 font-bold">
                      <span>Discount</span>
                      <span>- Rs. {(total - finalTotal).toLocaleString()}</span>
                   </div>
                 )}
              </div>
              
              <div className="pt-4 border-t border-white/10 flex justify-between font-black text-2xl tracking-tighter italic">
                 <span>Total</span>
                 <span className="text-orange-500 tracking-normal not-italic">Rs. {finalTotal.toLocaleString()}</span>
              </div>
              
              <button 
                form="checkout-form"
                disabled={loading}
                className="w-full py-4 bg-orange-600 text-white font-bold rounded-2xl hover:bg-orange-700 transition-all shadow-xl shadow-orange-950/20 disabled:opacity-50 scale-105 mt-2"
              >
                {loading ? 'Processing Order...' : 'Confirm Order'}
              </button>
           </div>
           
           <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex items-start gap-4">
              <ShieldCheck className="text-blue-600" size={24} />
              <div>
                 <p className="text-xs font-bold text-blue-900 uppercase tracking-widest mb-1">Safety First</p>
                 <p className="text-xs text-blue-800 leading-relaxed">Always check the product before paying. We prioritize your security.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
