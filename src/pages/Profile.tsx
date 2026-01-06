import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  User, 
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
  Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/layout/BottomNav';

const Profile = () => {
  const navigate = useNavigate();

  const menuSections = [
    {
      title: 'Your Account',
      items: [
        { icon: User, label: 'Edit Profile', description: 'Name, email, phone' },
        { icon: MapPin, label: 'Saved Addresses', description: '3 addresses saved' },
        { icon: CreditCard, label: 'Payment Methods', description: 'UPI, Cards, Wallets' },
        { icon: Heart, label: 'Favorites', description: 'Your saved products' },
      ],
    },
    {
      title: 'Rewards & Benefits',
      items: [
        { icon: Crown, label: 'QuickPass Subscription', description: 'Free delivery on all orders', badge: 'NEW' },
        { icon: Gift, label: 'Refer & Earn', description: 'Earn ₹100 per referral' },
      ],
    },
    {
      title: 'Settings & Help',
      items: [
        { icon: Bell, label: 'Notifications', description: 'Order updates, offers' },
        { icon: HelpCircle, label: 'Help & Support', description: 'FAQs, Chat, Call' },
        { icon: Shield, label: 'Privacy & Security', description: 'Terms, data settings' },
        { icon: Settings, label: 'App Settings', description: 'Language, appearance' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-primary pb-16 pt-4">
        <div className="container">
          <div className="flex items-center gap-4 mb-6">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-primary-foreground" />
            </motion.button>
            <h1 className="text-lg font-bold text-primary-foreground">My Account</h1>
          </div>
        </div>
      </div>

      {/* Profile Card */}
      <div className="container -mt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-4 shadow-elevated"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-lg text-foreground">Rahul Sharma</h2>
              <p className="text-sm text-muted-foreground">+91 98765 43210</p>
              <p className="text-sm text-muted-foreground">rahul@email.com</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 rounded-lg bg-secondary text-primary text-sm font-medium"
            >
              Edit
            </motion.button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
            <div className="text-center">
              <p className="text-xl font-bold text-primary">24</p>
              <p className="text-xs text-muted-foreground">Orders</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-primary">₹2.4K</p>
              <p className="text-xs text-muted-foreground">Saved</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-primary">5</p>
              <p className="text-xs text-muted-foreground">Referrals</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Menu Sections */}
      <main className="container py-4 space-y-4">
        {menuSections.map((section, sectionIndex) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sectionIndex * 0.1 }}
            className="bg-card rounded-2xl overflow-hidden shadow-card"
          >
            <div className="p-4 pb-2">
              <h3 className="text-sm font-semibold text-muted-foreground">{section.title}</h3>
            </div>
            <div>
              {section.items.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.label}
                    whileTap={{ scale: 0.99 }}
                    className="w-full flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{item.label}</span>
                        {item.badge && (
                          <span className="px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-xs font-bold">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        ))}

        {/* Logout Button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-destructive/10 text-destructive font-medium"
        >
          <LogOut className="w-5 h-5" />
          <span>Log Out</span>
        </motion.button>

        <p className="text-center text-xs text-muted-foreground">
          App Version 2.1.0
        </p>
      </main>

      <BottomNav />
    </div>
  );
};

export default Profile;
