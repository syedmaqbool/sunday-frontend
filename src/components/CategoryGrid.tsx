import { Link } from "react-router-dom";
import { CATEGORIES } from "@/lib/constants";
import { motion } from "framer-motion";

const CategoryGrid = () => (
  <section className="container py-16">
    <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
      Shop by Category
    </h2>
    <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
      {CATEGORIES.map((cat, i) => (
        <motion.div
          key={cat.value}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.06 }}
        >
          <Link
            to={`/listings?category=${cat.value}`}
            className="group flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-6 transition-all hover:border-primary hover:shadow-md"
          >
            <span className="text-3xl">{cat.icon}</span>
            <span className="text-sm font-medium text-card-foreground">{cat.label}</span>
          </Link>
        </motion.div>
      ))}
    </div>
  </section>
);

export default CategoryGrid;
