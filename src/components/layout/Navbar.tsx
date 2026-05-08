import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { ShoppingCart, User, LogOut, Store, MessageSquare, Package } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();

  return (
    <nav className="bg-white border-b border-neutral-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-2xl font-bold tracking-tighter text-orange-600">
              Apna Bazar
            </Link>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-600">
              <Link to="/" className="hover:text-orange-600 transition-colors">Browse</Link>
              {(user?.role === 'seller' || user?.role === 'admin') && (
                <Link to="/seller" className="hover:text-orange-600 transition-colors">Seller Panel</Link>
              )}
              {user?.role === 'admin' && (
                <Link to="/admin" className="hover:text-orange-600 transition-colors">Admin Board</Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/chat" className="p-2 text-neutral-600 hover:text-orange-600 transition-colors relative">
              <MessageSquare size={20} />
            </Link>
            
            <Link to="/cart" className="p-2 text-neutral-600 hover:text-orange-600 transition-colors relative">
              <ShoppingCart size={20} />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {count}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center gap-4 ml-4 pl-4 border-l border-neutral-200">
                <Link to="/profile" className="flex items-center gap-2 hover:text-orange-600 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center border border-neutral-200 overflow-hidden">
                    {user.profile_image ? (
                        <img src={user.profile_image} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                        <User size={16} />
                    )}
                  </div>
                  <span className="hidden sm:block text-sm font-medium">{user.name}</span>
                </Link>
                <button 
                  onClick={logout}
                  className="p-2 text-neutral-400 hover:text-red-500 transition-colors"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link 
                to="/auth" 
                className="ml-4 px-4 py-2 text-sm font-semibold bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
