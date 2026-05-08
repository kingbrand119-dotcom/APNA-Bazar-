import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus, ShieldCheck, Mail, Lock, User, Store } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    name: '', 
    role: 'buyer' as const,
    shop_name: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login, register, loginWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login({ email: formData.email, password: formData.password });
      } else {
        await register(formData);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
       await loginWithGoogle();
       navigate('/');
    } catch (err) {
       setError('Google Login failed');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white border border-neutral-100 rounded-[3rem] shadow-2xl shadow-black/5 overflow-hidden"
      >
        <div className="p-12">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-neutral-900 tracking-tighter mb-3">
               {isLogin ? 'Welcome Back.' : 'Join the Bazar.'}
            </h1>
            <p className="text-neutral-400 font-medium">Please enter your details to continue.</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 bg-red-50 text-red-600 text-xs font-bold rounded-2xl flex items-center gap-2"
            >
              <ShieldCheck size={16} />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={18} />
                  <input 
                    required 
                    className="w-full pl-12 pr-4 py-4 bg-neutral-50 border-none rounded-2xl focus:ring-4 focus:ring-orange-500/5 transition-all text-sm font-medium" 
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   <button 
                     type="button"
                     onClick={() => setFormData({...formData, role: 'buyer'})}
                     className={`py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest border-2 transition-all ${formData.role === 'buyer' ? 'border-orange-600 bg-orange-50 text-orange-600' : 'border-neutral-50 bg-neutral-50 text-neutral-400'}`}
                   >
                      Buying
                   </button>
                   <button 
                     type="button"
                     onClick={() => setFormData({...formData, role: 'seller'})}
                     className={`py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest border-2 transition-all ${formData.role === 'seller' ? 'border-orange-600 bg-orange-50 text-orange-600' : 'border-neutral-50 bg-neutral-50 text-neutral-400'}`}
                   >
                      Selling
                   </button>
                </div>

                {formData.role === 'seller' && (
                  <div className="relative">
                    <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={18} />
                    <input 
                      required 
                      className="w-full pl-12 pr-4 py-4 bg-neutral-50 border-none rounded-2xl focus:ring-4 focus:ring-orange-500/5 transition-all text-sm font-medium" 
                      placeholder="Shop Name"
                      value={formData.shop_name}
                      onChange={e => setFormData({...formData, shop_name: e.target.value})}
                    />
                  </div>
                )}
              </>
            )}

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={18} />
              <input 
                required 
                type="email" 
                className="w-full pl-12 pr-4 py-4 bg-neutral-50 border-none rounded-2xl focus:ring-4 focus:ring-orange-500/5 transition-all text-sm font-medium" 
                placeholder="Email Address"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
            
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={18} />
              <input 
                required 
                type="password" 
                className="w-full pl-12 pr-4 py-4 bg-neutral-50 border-none rounded-2xl focus:ring-4 focus:ring-orange-500/5 transition-all text-sm font-medium" 
                placeholder="Password"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-neutral-900 text-white font-bold rounded-2xl hover:bg-black transition-all shadow-xl shadow-neutral-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
                  {isLogin ? 'Sign In' : 'Create Account'}
                </>
              )}
            </button>
          </form>

          <div className="relative my-8 text-center">
             <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-neutral-100" /></div>
             <span className="relative px-4 bg-white text-[10px] font-bold text-neutral-300 uppercase tracking-widest">or continue with</span>
          </div>

          <button 
             onClick={handleGoogleLogin}
             className="w-full py-4 border-2 border-neutral-100 rounded-2xl flex items-center justify-center gap-3 hover:bg-neutral-50 transition-all font-bold text-sm"
          >
             <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5" />
             Google Login
          </button>

          <p className="mt-10 text-center text-sm font-medium text-neutral-400">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-orange-600 font-bold hover:underline"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
