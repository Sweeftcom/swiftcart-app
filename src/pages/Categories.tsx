import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { mockCategories } from '@/data/mockData';
import { BottomNav } from '@/components/layout/BottomNav';
import { CartFloatingButton } from '@/components/cart/CartFloatingButton';

const Categories = () => {
  const navigate = useNavigate();

  const categoryColors = [
    'bg-green-100', 'bg-blue-100', 'bg-yellow-100', 'bg-purple-100',
    'bg-pink-100', 'bg-orange-100', 'bg-teal-100', 'bg-red-100',
    'bg-indigo-100', 'bg-amber-100'
  ];

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card shadow-card">
        <div className="container py-4 flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <h1 className="text-lg font-bold text-foreground">All Categories</h1>
        </div>
      </header>

      <main className="container py-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {mockCategories.map((category, index) => (
            <Link key={category.id} to={`/category/${category.slug}`}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`${categoryColors[index % categoryColors.length]} rounded-2xl p-4 aspect-square flex flex-col items-center justify-center gap-3 cursor-pointer transition-all hover:shadow-elevated`}
              >
                <span className="text-5xl">{category.icon}</span>
                <span className="font-semibold text-foreground text-center text-sm">
                  {category.name}
                </span>
              </motion.div>
            </Link>
          ))}
        </div>
      </main>

      <CartFloatingButton />
      <BottomNav />
    </div>
  );
};

export default Categories;
