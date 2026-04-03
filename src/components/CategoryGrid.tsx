import { Link } from "react-router-dom";
import { PARENT_CATEGORIES, SUBCATEGORIES } from "@/lib/constants";
import { motion } from "framer-motion";

const CategoryGrid = () => (
  <section className="container py-16">
    <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
      Shop by Category
    </h2>
    <div className="mt-8 space-y-10">
      {PARENT_CATEGORIES.map((parent, pi) => (
        <motion.div
          key={parent.value}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: pi * 0.08 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">{parent.icon}</span>
            <h3 className="font-heading text-xl font-semibold text-foreground">{parent.label}</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SUBCATEGORIES.map((sub) => (
              <Link
                key={sub.value}
                to={`/listings?category=${parent.value}-${sub.value}`}
                className="group flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-5 transition-all hover:border-primary hover:shadow-md"
              >
                <span className="text-2xl">{sub.icon}</span>
                <span className="text-sm font-medium text-card-foreground">{sub.label}</span>
              </Link>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  </section>
);

export default CategoryGrid;
