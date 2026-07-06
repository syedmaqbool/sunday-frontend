import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getCategoriesOptions } from '@/hooks/useCategories';

const pillColors = [
  'bg-[hsl(230,90%,94%)] text-[hsl(230,40%,35%)]',
  'bg-[hsl(55,55%,90%)] text-[hsl(45,30%,30%)]',
  'bg-[hsl(350,80%,94%)] text-[hsl(350,40%,35%)]',
  'bg-[hsl(160,50%,90%)] text-[hsl(160,30%,28%)]',
  'bg-[hsl(280,60%,93%)] text-[hsl(280,35%,35%)]',
  'bg-[hsl(25,80%,92%)] text-[hsl(20,40%,32%)]',
];

export default function CategoryGrid() {
  const { data: categories = [], isLoading } = useQuery(getCategoriesOptions());

  if (isLoading) {
    return (
      <section className="container py-16">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </section>
    );
  }

  return (
    <section className="container py-16">
      <h2 className="
        text-center font-heading text-2xl font-bold text-foreground
        md:text-3xl
      "
      >
        Shop by Category
      </h2>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        {categories.map((cat, index) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 12 }}
            transition={{ delay: index * 0.1 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <Link
              to={`/listings?parent=${cat.value}`}
              className={`
                inline-flex min-w-[120px] items-center justify-center rounded-full px-8 py-3 font-heading text-sm font-medium transition-transform
                hover:scale-105
                ${pillColors[index % pillColors.length]}
              `}
            >
              {cat.label}
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
