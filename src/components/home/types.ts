import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  backgroundColor: string;
  deepLink?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  image: string;
}

export interface PromoBannersProps {
  banners: Banner[];
}

export interface CategoryGridProps {
  categories: Category[];
}
