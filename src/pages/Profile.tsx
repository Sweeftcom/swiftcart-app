import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  User as UserIcon, 
  MapPin, 
  CreditCard, 
  Bell, 
  Gift, 
  HelpCircle, 
  Shield, 
  LogOut,
  ChevronRight,
  Crown,
  Heart,
  Settings,
  Package,
  ShoppingBag
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { blink } from '@/lib/blink';
import { useState, useEffect } from 'react';

const Profile = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [stats, setStats] = useState({ orders: 0, saved: 0, referrals: 0 });

  useEffect(() => {
    if (user) {
      blink.db.orders.count({ where: { userId: user.id } }).then(count => {
        setStats(prev => ({ ...prev, orders: count }));
      });
    }
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const menuSections = [
    {
      title: 'Your Activity',
      items: [
        { icon: Package, label: 'My Orders', description: 'View and track orders', path: '/orders' },
        { icon: MapPin, label: 'Saved Addresses', description: 'Manage delivery locations' },
        { icon: Heart, label: 'Favorites', description: 'Your saved products' },
      ],
    },
    {
      title: 'SweeftCom Benefits',
      items: [
        { icon: Crown, label: 'QuickPass Subscription', description: 'Free delivery on all orders', badge: 'NEW' },
        { icon: Gift, label: 'Refer & Earn', description: 'Earn ₹100 per referral' },
      ],
    },
    {
      title: 'Settings & Support',
      items: [
        { icon: Bell, label: 'Notifications', description: 'Manage alerts and offers' },
        { icon: HelpCircle, label: 'Help & Support', description: 'FAQs and live chat' },
        { icon: Shield, label: 'Privacy & Security', description: 'Data and account settings' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="bg-primary pb-20 pt-6">
        <div className="container">
          <div className="flex items-center gap-4 mb-6">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/home')}
              className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <h1 className="text-xl font-black text-white tracking-tight uppercase">MY PROFILE</h1>
          </div>
        </div>
      </div>

      {/* Profile Card */}
      <div className="container -mt-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-[2rem] p-6 shadow-xl border border-primary/5"
        >
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-[1.5rem] bg-secondary flex items-center justify-center border-4 border-background overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-10 h-10 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-black text-2xl text-foreground truncate">{profile?.name || user?.displayName || 'User'}</h2>
              <p className="text-sm text-muted-foreground font-medium">{user?.email || 'No email'}</p>
              <p className="text-xs text-primary font-bold mt-1 uppercase tracking-wider">{profile?.role || 'Customer'}</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-primary"
            >
              <Settings className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-dashed border-border">
            <div className="text-center">
              <p className="text-2xl font-black text-primary">{stats.orders}</p>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Orders</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-primary">₹{stats.saved}</p>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Saved</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-primary">{stats.referrals}</p>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Rewards</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Menu Sections */}
      <main className="container py-6 space-y-6">
        {menuSections.map((section, sectionIndex) => (
          <div key={section.title} className="space-y-3">
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] px-2">{section.title}</h3>
            <div className="bg-card rounded-[2rem] overflow-hidden shadow-sm border border-border/40">
              {section.items.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.label}
                    whileTap={{ scale: 0.99, backgroundColor: 'hsl(var(--secondary) / 0.5)' }}
                    onClick={() => item.path && navigate(item.path)}
                    className={`w-full flex items-center gap-4 p-5 text-left transition-colors ${
                      index !== section.items.length - 1 ? 'border-b border-border/40' : ''
                    }`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{item.label}</span>
                        {item.badge && (
                          <span className="px-2 py-0.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-black">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-medium mt-0.5">{item.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground/40" />
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Business Apps */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] px-2">Business</h3>
          <div className="grid grid-cols-2 gap-4">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/vendor/inventory')}
              className="flex flex-col items-center justify-center p-6 rounded-[2rem] bg-blue-500/10 border border-blue-500/20 text-blue-600"
            >
              <ShoppingBag className="w-8 h-8 mb-2" />
              <span className="font-black text-xs uppercase tracking-tighter">Vendor Hub</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/rider/earnings')}
              className="flex flex-col items-center justify-center p-6 rounded-[2rem] bg-green-500/10 border border-green-500/20 text-green-600"
            >
              <Truck className="w-8 h-8 mb-2" />
              <span className="font-black text-xs uppercase tracking-tighter">Rider Hub</span>
            </motion.button>
          </div>
        </div>

        {/* Logout Button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 p-5 rounded-[1.5rem] bg-destructive/5 text-destructive font-black text-sm uppercase tracking-widest border border-destructive/10 mt-4"
        >
          <LogOut className="w-5 h-5" />
          <span>LOG OUT</span>
        </motion.button>

        <p className="text-center text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest py-4">
          SweeftCom v2.5.0 • Aurangabad Pilot
        </p>
      </main>

      <BottomNav />
    </div>
  );
};

export default Profile;
