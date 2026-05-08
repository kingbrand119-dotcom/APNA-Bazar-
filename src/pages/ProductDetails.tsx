import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, MessageSquare, Phone, MapPin, Truck, ShieldCheck, ChevronRight, Share2, Heart } from 'lucide-react';
import { motion } from 'motion/react';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `products/${id}`);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) return <div className="py-20 text-center animate-pulse">Loading Product Details...</div>;
  if (!product) return <div className="py-20 text-center text-red-500">Product not found.</div>;

  const images = product.images || [];
  const discount = product.discount_price ? Math.round(((product.price - product.discount_price) / product.price) * 100) : 0;

  const handleBuyNow = () => {
    addToCart(product, 1);
    navigate('/checkout');
  };

  const handleChat = () => {
    if (!user) return navigate('/auth');
    navigate(`/chat/${product.seller_id}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-neutral-400 font-medium uppercase tracking-wider">
        <Link to="/" className="hover:text-orange-600">Home</Link>
        <ChevronRight size={12} />
        <Link to={`/?category=${product.category}`} className="hover:text-orange-600">{product.category}</Link>
        <ChevronRight size={12} />
        <span className="text-neutral-900 truncate">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left: Images */}
        <div className="space-y-4">
          <div className="aspect-square bg-white rounded-3xl overflow-hidden border border-neutral-200">
            <img 
              src={images[activeImage] || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800'} 
              className="w-full h-full object-cover" 
              alt={product.title}
            />
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
            {images.map((img: string, idx: number) => (
              <button 
                key={idx}
                onClick={() => setActiveImage(idx)}
                className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${activeImage === idx ? 'border-orange-600 scale-95' : 'border-transparent opacity-60 hover:opacity-100'}`}
              >
                <img src={img} className="w-full h-full object-cover" alt={`Preview ${idx}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Right: Info */}
        <div className="flex flex-col gap-8">
          <div>
            <div className="flex justify-between items-start mb-4">
               <div>
                  <span className="text-xs font-bold text-orange-600 uppercase tracking-widest bg-orange-50 px-2 py-1 rounded mb-2 inline-block">
                    {product.condition} Condition
                  </span>
                  <h1 className="text-3xl font-bold text-neutral-900 leading-tight">{product.title}</h1>
               </div>
               <div className="flex gap-2">
                  <button className="p-2 border border-neutral-200 rounded-full hover:bg-neutral-50 transition-colors">
                     <Heart size={20} className="text-neutral-400" />
                  </button>
                  <button className="p-2 border border-neutral-200 rounded-full hover:bg-neutral-50 transition-colors">
                     <Share2 size={20} className="text-neutral-400" />
                  </button>
               </div>
            </div>

            <div className="flex items-end gap-3 mb-6">
              {product.discount_price ? (
                <>
                  <span className="text-4xl font-bold text-orange-600">Rs. {product.discount_price}</span>
                  <div className="mb-1">
                    <span className="text-lg text-neutral-400 line-through">Rs. {product.price}</span>
                    <span className="ml-2 text-sm font-bold text-red-500">-{discount}%</span>
                  </div>
                </>
              ) : (
                <span className="text-4xl font-bold text-neutral-900">Rs. {product.price}</span>
              )}
            </div>

            <p className="text-neutral-600 leading-relaxed text-lg pb-8 border-b border-neutral-100 italic">
              "{product.description}"
            </p>
          </div>

          {/* Delivery & Protection */}
          <div className="grid grid-cols-2 gap-4">
             <div className="flex items-center gap-3 p-4 bg-white border border-neutral-100 rounded-2xl">
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                   <Truck size={20} />
                </div>
                <div>
                   <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Delivery</p>
                   <p className="text-xs font-semibold">{product.delivery_type}</p>
                </div>
             </div>
             <div className="flex items-center gap-3 p-4 bg-white border border-neutral-100 rounded-2xl">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                   <ShieldCheck size={20} />
                </div>
                <div>
                   <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Stock Status</p>
                   <p className="text-xs font-semibold capitalize">{product.status?.replace('_', ' ')}</p>
                </div>
             </div>
          </div>

          {/* Purchase Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-auto">
             <button 
               onClick={handleBuyNow}
               disabled={product.status !== 'available'}
               className="py-4 bg-neutral-900 text-white font-bold rounded-2xl hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
             >
                Buy Now
             </button>
             <button 
               onClick={() => addToCart(product, 1)}
               disabled={product.status !== 'available'}
               className="py-4 border-2 border-orange-600 text-orange-600 font-bold rounded-2xl hover:bg-orange-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
             >
                <ShoppingCart size={20} />
                Add to Cart
             </button>
          </div>

          {/* Seller Card */}
          <div className="mt-8 p-6 bg-white border border-neutral-200 rounded-3xl flex flex-col sm:flex-row items-center gap-6">
             <div className="w-20 h-20 rounded-full bg-neutral-100 border border-neutral-200 overflow-hidden flex-shrink-0">
                {product.seller_profile_image ? (
                   <img src={product.seller_profile_image} className="w-full h-full object-cover" alt="Seller" />
                ) : (
                   <div className="w-full h-full flex items-center justify-center text-neutral-400 font-bold text-2xl">
                      {product.shop_name?.[0] || 'S'}
                   </div>
                )}
             </div>
             <div className="flex-1 text-center sm:text-left">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em] mb-1">Posted by</p>
                <h3 className="text-xl font-bold text-neutral-900 mb-1">{product.shop_name || 'Verified Seller'}</h3>
                <div className="flex items-center justify-center sm:justify-start gap-3 text-neutral-500 text-sm">
                   <div className="flex items-center gap-1">
                      <MapPin size={14} />
                      <span>Local Area</span>
                   </div>
                   <span>•</span>
                   <div className="flex items-center gap-1">
                      <ShieldCheck size={14} className="text-green-500" />
                      <span>Verified</span>
                   </div>
                </div>
             </div>
             <div className="flex gap-2">
                <button 
                  onClick={handleChat}
                  className="p-4 bg-white border-2 border-neutral-900 text-neutral-900 rounded-2xl hover:bg-neutral-900 hover:text-white transition-all"
                >
                   <MessageSquare size={20} />
                </button>
                <a 
                   href={`https://wa.me/${product.seller_whatsapp}?text=I am interested in ${product.title}`}
                   target="_blank"
                   rel="noreferrer"
                   className="p-4 bg-green-500 text-white rounded-2xl hover:bg-green-600 transition-all shadow-lg shadow-green-100"
                >
                   <Phone size={20} />
                </a>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
