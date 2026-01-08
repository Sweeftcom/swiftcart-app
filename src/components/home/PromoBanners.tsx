import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface SimpleBanner {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  backgroundColor: string;
  deepLink?: string;
}

interface PromoBannersProps {
  banners: SimpleBanner[];
}

export const PromoBanners = ({ banners }: PromoBannersProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [banners.length]);

  return (
    <div className="relative overflow-hidden">
      <div className="flex gap-3 overflow-x-auto hide-scrollbar snap-x snap-mandatory px-4">
        {banners.map((banner, index) => (
          <motion.div
            key={banner.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="snap-center flex-shrink-0 w-[85%] md:w-[45%] lg:w-[30%]"
          >
            <div
              className="relative h-36 md:h-44 rounded-2xl overflow-hidden cursor-pointer group"
              style={{ backgroundColor: banner.backgroundColor }}
            >
              <div className="absolute inset-0 p-5 flex flex-col justify-center">
                <motion.h3
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl md:text-2xl font-bold text-primary-foreground"
                >
                  {banner.title}
                </motion.h3>
                {banner.subtitle && (
                  <motion.p
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-sm md:text-base text-primary-foreground/80 mt-1"
                  >
                    {banner.subtitle}
                  </motion.p>
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="mt-3 px-4 py-1.5 rounded-full bg-card text-foreground text-sm font-medium w-fit"
                >
                  Shop Now
                </motion.button>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary-foreground/10 -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 right-8 w-20 h-20 rounded-full bg-primary-foreground/5" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Dots indicator */}
      <div className="flex justify-center gap-1.5 mt-3">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex
                ? 'bg-primary w-6'
                : 'bg-muted-foreground/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
