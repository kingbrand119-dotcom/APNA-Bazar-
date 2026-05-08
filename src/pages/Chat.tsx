import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  onSnapshot, 
  orderBy, 
  doc, 
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';
import { Send, User, Search, MessageSquare, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Chat() {
  const { otherId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!user) return;

    // Fetch conversations (unique users we've chatted with)
    // In a production app, we would have a specific 'conversations' collection
    // For this app, we'll derive it from messages
    const q = query(
      collection(db, 'messages'),
      where('sender_id', '==', user.id),
      orderBy('created_at', 'desc')
    );
    const q2 = query(
      collection(db, 'messages'),
      where('receiver_id', '==', user.id),
      orderBy('created_at', 'desc')
    );

    const unsub1 = onSnapshot(q, async (snap) => {
       // logic to extract unique users
    });

    return () => unsub1();
  }, [user]);

  useEffect(() => {
    if (!user || !otherId) return;

    // Fetch other user details
    const fetchOther = async () => {
       const d = await getDoc(doc(db, 'users', otherId));
       if (d.exists()) setOtherUser(d.data());
    };
    fetchOther();

    // Listen to messages (both directions)
    // NOTE: Firestore doesn't support complex OR queries easily for chat
    // Usually we use a composite field or separate collections
    // For this app, we'll listen to any message where user is sender or receiver
    // Filtered by otherId
    const q = query(
      collection(db, 'messages'),
      orderBy('created_at', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const filtered = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((m: any) => 
          (m.sender_id === user.id && m.receiver_id === otherId) ||
          (m.sender_id === otherId && m.receiver_id === user.id)
        );
      setMessages(filtered);
      setTimeout(scrollToBottom, 50);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'messages');
    });

    return () => unsubscribe();
  }, [user, otherId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !otherId) return;

    try {
      await addDoc(collection(db, 'messages'), {
        sender_id: user.id,
        receiver_id: otherId,
        content: newMessage,
        read: false,
        created_at: serverTimestamp()
      });
      setNewMessage('');
    } catch (err) {
      alert('Send failed');
    }
  };

  if (!otherId) {
    return (
      <div className="h-[70vh] flex items-center justify-center text-neutral-400 flex-col gap-4">
         <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center border border-neutral-100">
            <MessageSquare size={32} className="text-neutral-200" />
         </div>
         <p className="font-medium">Select a conversation to start chatting.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto h-[80vh] bg-white border border-neutral-100 rounded-[2.5rem] overflow-hidden flex shadow-2xl shadow-black/5">
      {/* Sidebar - Mobile hidden for now */}
      <div className="hidden lg:flex w-80 border-r border-neutral-50 flex-col bg-neutral-50/30">
         <div className="p-6 border-b border-neutral-50">
            <h2 className="text-xl font-bold">Messages</h2>
         </div>
         <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <div className="p-4 bg-orange-600 text-white rounded-2xl flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">
                  {otherUser?.name?.[0] || 'U'}
               </div>
               <div>
                  <p className="font-bold text-sm">{otherUser?.name || 'User'}</p>
                  <p className="text-[10px] opacity-70">Active Chat</p>
               </div>
            </div>
         </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Chat Header */}
        <div className="p-6 border-b border-neutral-50 flex justify-between items-center bg-white/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center font-bold text-orange-600">
              {otherUser?.name?.[0] || 'U'}
            </div>
            <div>
              <p className="font-bold text-neutral-900">{otherUser?.name || 'User'}</p>
              <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest flex items-center gap-1">
                 <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Online
              </p>
            </div>
          </div>
          <div className="flex gap-2">
             <button className="p-2.5 text-neutral-400 hover:text-neutral-900 transition-colors">
                <Search size={20} />
             </button>
             <button className="p-2.5 text-neutral-400 hover:text-neutral-900 transition-colors">
                <Phone size={20} />
             </button>
          </div>
        </div>

        {/* Message Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-none">
          <AnimatePresence>
            {messages.map((m, idx) => (
              <motion.div 
                key={m.id || idx}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${m.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] space-y-1 ${m.sender_id === user?.id ? 'items-end' : 'items-start flex flex-col'}`}>
                   <div className={`px-5 py-3.5 rounded-3xl text-sm font-medium leading-relaxed ${
                    m.sender_id === user?.id 
                      ? 'bg-neutral-900 text-white rounded-br-none shadow-lg shadow-neutral-100' 
                      : 'bg-neutral-100 text-neutral-800 rounded-bl-none'
                   }`}>
                    {m.content}
                  </div>
                  <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-tighter px-2">
                    {m.created_at?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Footer Input */}
        <div className="p-6 bg-white">
          <form onSubmit={handleSend} className="flex gap-2 p-2 bg-neutral-100/50 rounded-[2rem] border border-neutral-100 focus-within:border-orange-500/30 focus-within:ring-4 focus-within:ring-orange-500/5 transition-all">
            <input 
              type="text" 
              placeholder="اپنی بات لکھیں..."
              className="flex-1 bg-transparent border-none focus:ring-0 px-4 text-sm font-medium"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
            />
            <button 
              type="submit"
              className="p-3 bg-neutral-900 text-white rounded-full hover:bg-black transition-all shadow-lg"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
