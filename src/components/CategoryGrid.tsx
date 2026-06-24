import { Link } from "react-router-dom";
import { useCategories } from "@/hooks/useCategories";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const CategoryGrid = () => {
  const { data: categories = [], isLoading } = useCategories();

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
      <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
        Shop by Category
      </h2>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <Link
              to={`/listings?parent=${cat.value}`}
              className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary hover:shadow-lg sm:gap-3 sm:p-8"
            >
              <span className="text-3xl sm:text-5xl">{cat.icon}</span>
              <span className="font-heading text-sm font-semibold text-card-foreground sm:text-xl">
                {cat.label}
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default CategoryGrid;
