import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, getDocs, addDoc, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';
import { Plus, Trash2, Edit2, CheckCircle, XCircle, Image as ImageIcon, Megaphone, Layout, Sliders, Calendar } from 'lucide-react';
import { Banner, Campaign, PopupAd } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminPromotions() {
  const [activeTab, setActiveTab] = useState<'banners' | 'campaigns' | 'popups'>('banners');
  const [loading, setLoading] = useState(true);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [popups, setPopups] = useState<PopupAd[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const bSnap = await getDocs(collection(db, 'banners'));
      setBanners(bSnap.docs.map(d => ({ id: d.id, ...d.data() } as Banner)));

      const cSnap = await getDocs(collection(db, 'campaigns'));
      setCampaigns(cSnap.docs.map(d => ({ id: d.id, ...d.data() } as Campaign)));

      const pSnap = await getDocs(collection(db, 'popup_ads'));
      setPopups(pSnap.docs.map(d => ({ id: d.id, ...d.data() } as PopupAd)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleActive = async (collectionName: string, id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, collectionName, id), { active: !currentStatus });
      fetchData();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, collectionName);
    }
  };

  const handleDelete = async (collectionName: string, id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await deleteDoc(doc(db, collectionName, id));
      fetchData();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, collectionName);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = Object.fromEntries(formData.entries());
    
    // Process types
    data.active = data.active === 'on';
    if (activeTab === 'banners') data.order = parseInt(data.order || '0');
    
    try {
      const collectionName = activeTab === 'banners' ? 'banners' : activeTab === 'campaigns' ? 'campaigns' : 'popup_ads';
      if (editingItem) {
        await updateDoc(doc(db, collectionName, editingItem.id), data);
      } else {
        await addDoc(collection(db, collectionName), { ...data, created_at: serverTimestamp() });
      }
      setShowModal(false);
      setEditingItem(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Megaphone className="text-orange-600" />
            Marketing & Promotions
          </h1>
          <p className="text-neutral-500 text-sm mt-1">Manage banners, seasonal sales, and popup advertisements.</p>
        </div>
        <button 
          onClick={() => { setEditingItem(null); setShowModal(true); }}
          className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-orange-700 transition-all shadow-lg shadow-orange-200"
        >
          <Plus size={20} />
          Add New {activeTab.slice(0, -1)}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-neutral-100 w-fit">
        <button
          onClick={() => setActiveTab('banners')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'banners' ? 'bg-orange-600 text-white shadow-md' : 'text-neutral-500 hover:bg-neutral-50'}`}
        >
          <Layout size={18} />
          Banners
        </button>
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'campaigns' ? 'bg-orange-600 text-white shadow-md' : 'text-neutral-500 hover:bg-neutral-50'}`}
        >
          <Calendar size={18} />
          Campaigns
        </button>
        <button
          onClick={() => setActiveTab('popups')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'popups' ? 'bg-orange-600 text-white shadow-md' : 'text-neutral-500 hover:bg-neutral-50'}`}
        >
          <Megaphone size={18} />
          Popups
        </button>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {activeTab === 'banners' && banners.map(banner => (
            <PromoCard 
              key={banner.id} 
              item={banner} 
              onEdit={() => { setEditingItem(banner); setShowModal(true); }}
              onToggle={() => handleToggleActive('banners', banner.id, banner.active)}
              onDelete={() => handleDelete('banners', banner.id)}
            />
          ))}
          {activeTab === 'campaigns' && campaigns.map(camp => (
            <PromoCard 
              key={camp.id} 
              item={camp} 
              onEdit={() => { setEditingItem(camp); setShowModal(true); }}
              onToggle={() => handleToggleActive('campaigns', camp.id, camp.active)}
              onDelete={() => handleDelete('campaigns', camp.id)}
            />
          ))}
          {activeTab === 'popups' && popups.map(popup => (
            <PromoCard 
              key={popup.id} 
              item={popup} 
              onEdit={() => { setEditingItem(popup); setShowModal(true); }}
              onToggle={() => handleToggleActive('popup_ads', popup.id, popup.active)}
              onDelete={() => handleDelete('popup_ads', popup.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative"
          >
            <h2 className="text-2xl font-bold mb-6">
              {editingItem ? 'Edit' : 'Add New'} {activeTab.slice(0, -1)}
            </h2>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-1.5">Image URL</label>
                <input 
                  name="image_url" 
                  defaultValue={editingItem?.image_url}
                  required
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-1.5">Title</label>
                <input 
                  name="title" 
                  defaultValue={editingItem?.title}
                  placeholder="Banner/Campaign Title"
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                />
              </div>

              {activeTab === 'banners' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-neutral-700 mb-1.5">Order</label>
                    <input 
                      name="order" 
                      type="number"
                      defaultValue={editingItem?.order || 0}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-neutral-700 mb-1.5">Type</label>
                    <select name="type" defaultValue={editingItem?.type || 'home'} className="w-full px-4 py-3 rounded-xl border border-neutral-200">
                      <option value="home">Homepage</option>
                      <option value="category">Category</option>
                      <option value="video">Video</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'campaigns' && (
                <div>
                  <label className="block text-sm font-bold text-neutral-700 mb-1.5">Discount Text</label>
                  <input 
                    name="discount_text" 
                    defaultValue={editingItem?.discount_text}
                    placeholder="e.g. 50% OFF"
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200"
                  />
                </div>
              )}

              {activeTab === 'popups' && (
                <div>
                  <label className="block text-sm font-bold text-neutral-700 mb-1.5">Button Text</label>
                  <input 
                    name="button_text" 
                    defaultValue={editingItem?.button_text}
                    placeholder="Shop Now"
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-1.5">Link URL</label>
                <input 
                  name={activeTab === 'popups' ? 'button_link' : 'link'} 
                  defaultValue={editingItem?.link || editingItem?.button_link}
                  placeholder="/category/electronics"
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200"
                />
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  name="active" 
                  id="active"
                  defaultChecked={editingItem ? editingItem.active : true}
                  className="w-5 h-5 rounded text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="active" className="text-sm font-bold text-neutral-700">Display this promotion</label>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 rounded-xl border border-neutral-200 font-bold hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-700 shadow-lg shadow-orange-100 transition-all"
                >
                  {editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function PromoCard({ item, onEdit, onToggle, onDelete }: any) {
  return (
    <motion.div 
      layout
      className="bg-white border border-neutral-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all group"
    >
      <div className="relative aspect-video bg-neutral-100 overflow-hidden">
        <img src={item.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        <div className="absolute top-4 right-4">
          <button 
            onClick={onToggle}
            className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md transition-all ${
              item.active 
              ? 'bg-green-500/80 text-white' 
              : 'bg-neutral-500/80 text-white'
            }`}
          >
            {item.active ? 'Active' : 'Disabled'}
          </button>
        </div>
      </div>
      <div className="p-6">
        <h3 className="font-bold text-neutral-900 truncate mb-1">{item.title || 'No Title'}</h3>
        <p className="text-xs text-neutral-400 truncate mb-4">{item.link || item.button_link || 'No link'}</p>
        
        <div className="flex items-center justify-between pt-4 border-t border-neutral-50">
          <div className="flex gap-2">
             <button onClick={onEdit} className="p-2 text-neutral-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all">
                <Edit2 size={18} />
             </button>
             <button onClick={onDelete} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                <Trash2 size={18} />
             </button>
          </div>
          {item.discount_text && (
            <span className="text-orange-600 font-bold px-3 py-1 bg-orange-50 rounded-lg text-xs">
              {item.discount_text}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
