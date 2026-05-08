import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Campaign } from '../../types';
import { motion } from 'motion/react';
import { Gift, Zap } from 'lucide-react';

export default function CampaignSection() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const q = query(collection(db, 'campaigns'), where('active', '==', true));
        const snap = await getDocs(q);
        setCampaigns(snap.docs.map(d => ({ id: d.id, ...d.data() } as Campaign)));
      } catch (err) {
        console.error('Error fetching campaigns:', err);
      }
    };
    fetchCampaigns();
  }, []);

  if (campaigns.length === 0) return null;

  return (
    <div className="py-12 space-y-8">
      <div className="flex items-end justify-between">
         <div>
            <div className="flex items-center gap-2 text-orange-600 font-bold mb-1">
               <Gift size={20} />
               <span className="text-xs uppercase tracking-[0.2em]">Limited Time Offers</span>
            </div>
            <h2 className="text-3xl font-black text-neutral-900 uppercase tracking-tighter italic">Seasonal Sales</h2>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {campaigns.map((camp, idx) => (
          <motion.div
            key={camp.id}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="group relative h-80 rounded-[2.5rem] overflow-hidden shadow-xl"
          >
            <img 
              src={camp.image_url} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent flex items-center p-12">
               <div className="text-white space-y-4">
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20">
                     <Zap size={16} className="text-orange-400" />
                     <span className="text-xs font-bold uppercase tracking-widest leading-none">Flash Sale</span>
                  </div>
                  <h3 className="text-4xl font-black uppercase tracking-tighter leading-none italic">{camp.title}</h3>
                  <div className="text-orange-400 text-6xl font-black tracking-tighter leading-none drop-shadow-2xl">
                     {camp.discount_text}
                  </div>
                  <button className="bg-white text-black font-bold px-8 py-3 rounded-2xl hover:bg-orange-600 hover:text-white transition-all shadow-xl">
                     Claim Deals
                  </button>
               </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
