import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';

export default function Cart() {
  const { items, removeFromCart, updateQuantity, total, count } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-300 mb-6">
          <ShoppingBag size={48} />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Your cart is empty</h2>
        <p className="text-neutral-500 mb-8 max-w-xs text-center">Looks like you haven't added any items yet. Start exploring the bazar!</p>
        <Link to="/" className="px-8 py-3 bg-orange-600 text-white font-bold rounded-2xl hover:bg-orange-700 transition-all">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 animate-in slide-in-from-bottom-4 duration-500">
      <div className="lg:col-span-2 space-y-8">
         <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Shopping Cart</h1>
            <span className="text-sm font-bold text-orange-600 uppercase tracking-widest">{count} Items</span>
         </div>

         <div className="space-y-4">
            {items.map(item => (
              <div key={item.id} className="bg-white border border-neutral-100 p-4 rounded-3xl flex items-center gap-6 group hover:shadow-lg hover:shadow-neutral-100 transition-all">
                 <div className="w-24 h-24 bg-neutral-100 rounded-2xl overflow-hidden flex-shrink-0">
                    <img src={item.image} className="w-full h-full object-cover" alt={item.title} />
                 </div>
                 
                 <div className="flex-1 space-y-1">
                    <h3 className="font-bold text-neutral-900 text-lg">{item.title}</h3>
                    <p className="text-orange-600 font-bold">Rs. {item.discount_price || item.price}</p>
                 </div>

                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 bg-neutral-50 border border-neutral-200 rounded-xl p-1">
                       <button 
                         onClick={() => updateQuantity(item.id, item.quantity - 1)}
                         className="p-1 hover:bg-white rounded-lg transition-colors text-neutral-500"
                        >
                          <Minus size={16} />
                       </button>
                       <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                       <button 
                         onClick={() => updateQuantity(item.id, item.quantity + 1)}
                         className="p-1 hover:bg-white rounded-lg transition-colors text-orange-600"
                        >
                          <Plus size={16} />
                       </button>
                    </div>

                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="p-3 text-neutral-300 hover:text-red-500 transition-colors"
                    >
                       <Trash2 size={20} />
                    </button>
                 </div>
              </div>
            ))}
         </div>
      </div>

      <div className="lg:col-span-1">
         <div className="bg-white border border-neutral-200 rounded-3xl p-8 sticky top-24 space-y-6">
            <h2 className="text-xl font-bold">Order Summary</h2>
            
            <div className="space-y-4 text-sm font-medium">
               <div className="flex justify-between text-neutral-500">
                  <span>Subtotal</span>
                  <span className="text-neutral-900">Rs. {total}</span>
               </div>
               <div className="flex justify-between text-neutral-500">
                  <span>Delivery Charges</span>
                  <span className="text-neutral-900">Calculated at checkout</span>
               </div>
               <div className="pt-4 border-t border-neutral-100 flex justify-between text-lg font-bold text-neutral-900">
                  <span>Total Amount</span>
                  <span className="text-orange-600">Rs. {total}</span>
               </div>
            </div>

            <button 
              onClick={() => navigate('/checkout')}
              className="w-full py-4 bg-neutral-900 text-white font-bold rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-2 group"
            >
               Proceed to Checkout
               <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <Link to="/" className="block text-center text-sm font-bold text-neutral-400 hover:text-neutral-600 transition-colors">
               Continue Shopping
            </Link>
         </div>
      </div>
    </div>
  );
}
