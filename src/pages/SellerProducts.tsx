import { useState, useEffect } from 'react';
import { db, storage } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';
import { Plus, Trash2, Edit3, Camera, X, CheckCircle2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function SellerProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    discount_price: '',
    category: 'Electronics',
    stock: 1,
    delivery_type: 'Nationwide',
    condition: 'New',
    delivery_charges: '0'
  });
  const [images, setImages] = useState<File[]>([]);

  const fetchProducts = async () => {
    if (!user) return;
    setLoading(true);
    const path = 'products';
    try {
      const q = query(collection(db, path), where('seller_id', '==', user.id));
      const snapshot = await getDocs(q);
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setUploading(true);

    try {
      const imageUrls = [];
      for (const file of images) {
        const storageRef = ref(storage, `products/${user.id}/${Date.now()}-${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        imageUrls.push(url);
      }

      const productData = {
        ...formData,
        price: Number(formData.price),
        discount_price: formData.discount_price ? Number(formData.discount_price) : null,
        stock: Number(formData.stock),
        delivery_charges: Number(formData.delivery_charges),
        seller_id: user.id,
        shop_name: user.shop_name || user.name,
        seller_whatsapp: user.whatsapp || '',
        images: imageUrls,
        status: 'available',
        is_approved: false, // Must be approved by admin
        created_at: serverTimestamp()
      };

      await addDoc(collection(db, 'products'), productData);
      setShowAddModal(false);
      setImages([]);
      setFormData({
        title: '', description: '', price: '', discount_price: '', 
        category: 'Electronics', stock: 1, delivery_type: 'Nationwide', 
        condition: 'New', delivery_charges: '0'
      });
      fetchProducts();
    } catch (err) {
      alert('Upload failed. Check your connection.');
    } finally {
      setUploading(false);
    }
  };

  const setStockStatus = async (id: string, status: string) => {
     try {
        await updateDoc(doc(db, 'products', id), { status });
        setProducts(products.map(p => p.id === id ? { ...p, status } : p));
     } catch (err) {
        alert('Update failed');
     }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanent delete?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      setProducts(products.filter(p => p.id !== id));
    } catch (err) {
      alert('Delete failed');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-white p-8 rounded-3xl border border-neutral-100">
        <div>
           <h1 className="text-3xl font-bold text-neutral-900">Your Inventory</h1>
           <p className="text-neutral-500">Manage your product listings and availability.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-neutral-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-black transition-all shadow-xl shadow-neutral-200"
        >
          <Plus size={20} />
          New Product
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((p) => (
          <div key={p.id} className="bg-white border border-neutral-100 rounded-2xl overflow-hidden flex flex-col group hover:shadow-lg transition-all border-l-4 border-l-orange-500">
            <div className="relative aspect-video bg-neutral-100">
               <img src={p.images?.[0]} className="w-full h-full object-cover" />
               <div className="absolute top-2 right-2 flex gap-1">
                  {p.is_approved ? (
                    <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 size={10} /> APPROVED
                    </span>
                  ) : (
                    <span className="bg-yellow-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                      <Clock size={10} /> PENDING
                    </span>
                  )}
               </div>
            </div>
            <div className="p-5 flex-1 flex flex-col gap-3">
               <div className="flex justify-between items-start">
                  <div>
                     <h3 className="font-bold text-lg line-clamp-1">{p.title}</h3>
                     <p className="text-xs text-neutral-400 font-medium">{p.category}</p>
                  </div>
                  <p className="font-bold text-orange-600">Rs. {p.price}</p>
               </div>
               
               <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => setStockStatus(p.id, p.status === 'available' ? 'out_of_stock' : 'available')}
                    className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${p.status === 'available' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}
                  >
                    {p.status === 'available' ? 'Mark Out of Stock' : 'Mark In Stock'}
                  </button>
               </div>

               <div className="flex gap-2 pt-4 mt-auto border-t border-neutral-50">
                  <button className="flex-1 py-2 bg-neutral-50 text-neutral-600 rounded-xl hover:bg-neutral-100 text-xs font-bold transition-all flex items-center justify-center gap-2">
                     <Edit3 size={14} /> Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(p.id)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  >
                     <Trash2 size={14} />
                  </button>
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Product Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowAddModal(false)}
               className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">New Product Listing</h2>
                <button onClick={() => setShowAddModal(false)}><X className="text-neutral-400" /></button>
              </div>

              <form onSubmit={handleCreate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Product Title</label>
                    <input 
                      required 
                      className="w-full px-4 py-3 bg-neutral-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500/20" 
                      placeholder="e.g. iPhone 13 Pro Max"
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Description (Urdu/English)</label>
                    <textarea 
                      required 
                      className="w-full px-4 py-3 bg-neutral-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500/20 h-24" 
                      placeholder="Describe your product..."
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Price (Rs.)</label>
                    <input 
                      required type="number" 
                      className="w-full px-4 py-3 bg-neutral-50 border-none rounded-xl" 
                      value={formData.price}
                      onChange={e => setFormData({...formData, price: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Discount Price (Optional)</label>
                    <input 
                      type="number" 
                      className="w-full px-4 py-3 bg-neutral-50 border-none rounded-xl" 
                      value={formData.discount_price}
                      onChange={e => setFormData({...formData, discount_price: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Category</label>
                    <select 
                      className="w-full px-4 py-3 bg-neutral-50 border-none rounded-xl"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                    >
                      <option>Electronics</option>
                      <option>Fashion</option>
                      <option>Home & Garden</option>
                      <option>Groceries</option>
                      <option>Beauty</option>
                      <option>Sports</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Stock Quantity</label>
                    <input 
                      required type="number" 
                      className="w-full px-4 py-3 bg-neutral-50 border-none rounded-xl" 
                      value={formData.stock}
                      onChange={e => setFormData({...formData, stock: Number(e.target.value) as any})}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                   <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Product Images</label>
                   <div className="flex flex-wrap gap-4">
                      {images.map((img, idx) => (
                        <div key={idx} className="w-24 h-24 rounded-2xl bg-neutral-100 flex items-center justify-center relative">
                           <img src={URL.createObjectURL(img)} className="w-full h-full object-cover rounded-2xl" />
                           <button 
                             type="button" 
                             onClick={() => setImages(images.filter((_, i) => i !== idx))}
                             className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                           >
                             <X size={12} />
                           </button>
                        </div>
                      ))}
                      <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center text-neutral-400 cursor-pointer hover:border-orange-500 hover:text-orange-500 transition-all">
                        <Camera size={24} />
                        <span className="text-[10px] font-bold mt-1">Add Image</span>
                        <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                      </label>
                   </div>
                </div>

                <button 
                  type="submit" 
                  disabled={uploading || images.length === 0}
                  className="w-full py-4 bg-orange-600 text-white font-bold rounded-2xl hover:bg-orange-700 transition-all shadow-xl shadow-orange-200 disabled:opacity-50"
                >
                  {uploading ? 'Publishing...' : 'Submit for Approval'}
                </button>
                <p className="text-[10px] text-center text-neutral-400 font-bold uppercase tracking-widest">Note: Product will go live after admin verification.</p>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
