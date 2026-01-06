import { motion } from 'framer-motion';
import { Category } from '@/types';
import { Link } from 'react-router-dom';

interface CategoryGridProps {
  categories: Category[];
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export const CategoryGrid = ({ categories }: CategoryGridProps) => {
  return (
    <div className="px-4">
      <h2 className="text-lg font-bold text-foreground mb-4">Shop by Category</h2>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-3"
      >
        {categories.map((category) => (
          <Link key={category.id} to={`/category/${category.slug}`}>
            <motion.div
              variants={item}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center gap-2 cursor-pointer group"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-secondary flex items-center justify-center text-2xl md:text-3xl transition-all group-hover:shadow-elevated group-hover:bg-secondary/80">
                {category.icon}
              </div>
              <span className="text-xs md:text-sm text-center font-medium text-foreground line-clamp-2">
                {category.name}
              </span>
            </motion.div>
          </Link>
        ))}
      </motion.div>
    </div>
  );
};
