import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { PopupAd } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PopupAdComponent() {
  const [ad, setAd] = useState<PopupAd | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const fetchAd = async () => {
      // Check session storage so it only shows once per session
      const hasShown = sessionStorage.getItem('popup_shown');
      if (hasShown) return;

      try {
        const q = query(collection(db, 'popup_ads'), where('active', '==', true), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setAd({ id: snap.docs[0].id, ...snap.docs[0].data() } as PopupAd);
          // Show after a short delay
          setTimeout(() => {
            setShow(true);
            sessionStorage.setItem('popup_shown', 'true');
          }, 3000);
        }
      } catch (err) {
        console.error('Error fetching popup ad:', err);
      }
    };
    fetchAd();
  }, []);

  if (!ad || !show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-white rounded-[2.5rem] overflow-hidden max-w-lg w-full shadow-2xl"
      >
        <button 
          onClick={() => setShow(false)}
          className="absolute top-4 right-4 z-10 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-black transition-all shadow-xl"
        >
          <X size={20} />
        </button>

        <div className="relative aspect-video">
           <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-8">
              <div className="text-white">
                 <h2 className="text-3xl font-black mb-2 leading-tight uppercase tracking-tighter">{ad.title}</h2>
                 <p className="text-sm text-neutral-300 opacity-90 line-clamp-2 mb-6">{ad.description}</p>
                 
                 <Link 
                   to={ad.button_link || '#'}
                   onClick={() => setShow(false)}
                   className="inline-block bg-orange-600 text-white font-bold px-8 py-3 rounded-2xl hover:bg-orange-700 transition-all shadow-xl shadow-orange-900/40"
                 >
                   {ad.button_text || 'See Details'}
                 </Link>
              </div>
           </div>
        </div>
      </motion.div>
    </div>
  );
}
