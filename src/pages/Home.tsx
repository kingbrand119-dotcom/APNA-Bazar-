import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';
import { Search, Sparkles, TrendingUp, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../types';
import BannerSlider from '../components/home/BannerSlider';
import PopupAdComponent from '../components/home/PopupAdComponent';
import CampaignSection from '../components/home/CampaignSection';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sponsoredProducts, setSponsoredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const categories = [
    'Electronics', 'Fashion', 'Home & Garden', 'Groceries', 'Beauty', 'Sports', 'Automotive', 'Other'
  ];

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const path = 'products';
    try {
      // Normal Products
      let q = query(
        collection(db, path), 
        where('is_approved', '==', true),
        orderBy('created_at', 'desc')
      );

      if (category) {
        q = query(q, where('category', '==', category));
      }

      const snapshot = await getDocs(q);
      let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));

      if (search) {
        data = data.filter((p: Product) => 
          p.title.toLowerCase().includes(search.toLowerCase()) || 
          p.description.toLowerCase().includes(search.toLowerCase())
        );
      }

      setProducts(data);

      // Sponsored Products
      const sponsoredQ = query(
        collection(db, path), 
        where('is_approved', '==', true), 
        where('is_sponsored', '==', true),
        limit(4)
      );
      const sSnap = await getDocs(sponsoredQ);
      setSponsoredProducts(sSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="space-y-12">
      <PopupAdComponent />
      
      {/* Hero Section with Banners */}
      <section>
        <BannerSlider />
      </section>

      {/* Seasonal Campaigns */}
      <CampaignSection />

      {/* Featured / Sponsored Products */}
      {sponsoredProducts.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
               <div className="flex items-center gap-2 text-orange-600 font-bold mb-1">
                  <Sparkles size={18} />
                  <span className="text-xs uppercase tracking-widest leading-none font-black">Featured Products</span>
               </div>
               <h2 className="text-3xl font-black text-neutral-900 uppercase tracking-tighter italic">Sponsored Deals</h2>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {sponsoredProducts.map((p) => (
              <ProductCard key={p.id} product={p} isSponsored />
            ))}
          </div>
        </section>
      )}

      {/* Search & Categories */}
      <section className="sticky top-20 z-30 bg-neutral-50/80 backdrop-blur-md py-4">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-orange-600 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Search products, brands, or categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-white border border-neutral-100 rounded-2xl shadow-sm focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all text-sm font-medium"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
            <button
               onClick={() => setCategory('')}
               className={`px-6 py-4 rounded-2xl text-sm font-bold whitespace-nowrap transition-all border ${
                 category === ''
                   ? 'bg-orange-600 text-white border-orange-600 shadow-lg shadow-orange-200'
                   : 'bg-white text-neutral-500 border-neutral-100 hover:border-orange-200 hover:text-orange-600'
               }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-6 py-4 rounded-2xl text-sm font-bold whitespace-nowrap transition-all border ${
                  category === cat
                    ? 'bg-orange-600 text-white border-orange-600 shadow-lg shadow-orange-200'
                    : 'bg-white text-neutral-500 border-neutral-100 hover:border-orange-200 hover:text-orange-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Product Grid */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
           <h2 className="text-2xl font-black text-neutral-900 uppercase tracking-tighter flex items-center gap-2 italic">
             <TrendingUp className="text-orange-600" />
             {category === '' ? 'Latest Discoveries' : `${category} Collection`}
           </h2>
           <span className="text-sm font-bold text-neutral-400">{products.length} items</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="aspect-[4/5] bg-white rounded-3xl animate-pulse border border-neutral-100" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            <AnimatePresence>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </AnimatePresence>
          </div>
        )}

        {products.length === 0 && !loading && (
          <div className="bg-white rounded-[3rem] p-20 text-center border border-neutral-100 italic">
            <Search className="mx-auto text-neutral-200 mb-4" size={64} />
            <p className="text-neutral-400 font-bold text-xl uppercase tracking-tighter">No items found matching your search</p>
          </div>
        )}
      </section>
    </div>
  );
}

function ProductCard({ product, isSponsored }: { product: Product, isSponsored?: boolean }) {
  const discount = product.discount_price ? Math.round(((product.price - product.discount_price) / product.price) * 100) : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="group bg-white border border-neutral-100 rounded-[2rem] overflow-hidden hover:shadow-2xl hover:shadow-orange-100 transition-all duration-500 flex flex-col h-full"
    >
      <Link to={`/product/${product.id}`} className="relative aspect-[4/5] overflow-hidden bg-neutral-50 flex-shrink-0">
        <img
          src={product.images?.[0] || 'https://via.placeholder.com/300'}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
        />
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {product.condition === 'New' && (
             <span className="bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg">New</span>
          )}
          {isSponsored && (
             <span className="bg-black text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
               <Sparkles size={10} className="text-orange-500" /> Sponsored
             </span>
          )}
        </div>
        {discount > 0 && (
          <div className="absolute top-4 right-4 bg-green-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg">
            {discount}% OFF
          </div>
        )}
      </Link>
      
      <div className="p-5 flex flex-col flex-1">
        <div className="mb-2">
           <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{product.category}</span>
           <h3 className="font-bold text-neutral-900 group-hover:text-orange-600 transition-colors line-clamp-2 leading-tight uppercase tracking-tighter italic h-10 mt-1">{product.title}</h3>
        </div>
        
        <div className="mt-auto pt-4 border-t border-neutral-50 flex items-center justify-between">
          <div className="flex flex-col">
            {product.discount_price ? (
              <>
                <span className="text-lg font-black text-orange-600 tracking-tighter leading-none italic">Rs. {product.discount_price}</span>
                <span className="text-[10px] text-neutral-400 line-through font-bold">Rs. {product.price}</span>
              </>
            ) : (
              <span className="text-lg font-black text-neutral-900 tracking-tighter leading-none italic">Rs. {product.price}</span>
            )}
          </div>
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-3 bg-neutral-900 text-white rounded-2xl group-hover:bg-orange-600 transition-colors shadow-lg"
          >
            <ArrowRight size={18} />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
