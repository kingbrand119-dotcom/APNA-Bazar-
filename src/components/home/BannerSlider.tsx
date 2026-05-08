import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Banner } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BannerSlider() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const q = query(
          collection(db, 'banners'), 
          where('active', '==', true),
          where('type', '==', 'home'),
          orderBy('order', 'asc')
        );
        const snap = await getDocs(q);
        setBanners(snap.docs.map(d => ({ id: d.id, ...d.data() } as Banner)));
      } catch (err) {
        console.error('Error fetching banners:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners]);

  if (loading) return (
    <div className="w-full aspect-[21/9] md:aspect-[3/1] bg-neutral-200 animate-pulse rounded-3xl" />
  );

  if (banners.length === 0) return null;

  return (
    <div className="relative group w-full aspect-[21/9] md:aspect-[3/1] bg-neutral-100 rounded-3xl overflow-hidden shadow-2xl">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <Link to={banners[currentIndex].link || '#'}>
            <img 
              src={banners[currentIndex].image_url} 
              alt={banners[currentIndex].title}
              className="w-full h-full object-cover"
            />
            {banners[currentIndex].title && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-8 md:p-12">
                <div className="text-white max-w-lg">
                   <h2 className="text-2xl md:text-5xl font-black mb-2 leading-tight uppercase tracking-tighter drop-shadow-lg">
                     {banners[currentIndex].title}
                   </h2>
                   <span className="inline-block bg-orange-600 text-xs md:text-sm font-bold px-4 py-2 rounded-full uppercase tracking-widest shadow-xl">
                     Shop Now
                   </span>
                </div>
              </div>
            )}
          </Link>
        </motion.div>
      </AnimatePresence>

      {banners.length > 1 && (
        <>
          <button 
            onClick={() => setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/20 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-black"
          >
            <ChevronLeft size={24} />
          </button>
          <button 
            onClick={() => setCurrentIndex((prev) => (prev + 1) % banners.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/20 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-black"
          >
            <ChevronRight size={24} />
          </button>
          
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${i === currentIndex ? 'bg-orange-600 w-8' : 'bg-white/40'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
