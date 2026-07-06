import { MessageCircleQuestion, Recycle, Shirt } from 'lucide-react';

const features = [
  {
    desc: '100s of brands and trends to try. Minimize ownership and maximize newness.',
    icon: Recycle,
    title: 'Thousands of Styles to Discover',
  },
  {
    desc: 'Made to fit more bodies than any other pre-loved marketplace.',
    icon: Shirt,
    title: 'Sizes for Everyone — XXS to 5X, Plus, Petite & More',
  },
  {
    desc: "Our team is always here to help. Don't stress — just message us.",
    icon: MessageCircleQuestion,
    title: 'Support When You Need It',
  },
];

export default function WhyShopWithUs() {
  return (
    <section className="container py-20">
      {/* ← Old: rounded yellow card wrapper */}
      <div className="rounded-3xl bg-[hsl(var(--surface-yellow))] p-8 md:p-12">
        <div className="text-center">
          <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
            Why Shop Pre-Loved with Us?
          </h2>
        </div>

        {/* ← Old: grid with bg-primary/10 cards */}
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {features.map(({ desc, icon: Icon, title }) => (
            <div key={title} className="rounded-2xl bg-primary/10 p-6 text-left">
              <Icon className="h-6 w-6 text-primary" strokeWidth={1.75} />
              <h3 className="mt-4 font-heading text-base font-semibold text-foreground">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ← Old: blockquote section same */}
      <div className="mt-20 flex flex-col items-center text-center">
        <blockquote className="max-w-2xl font-heading text-2xl italic leading-snug text-foreground md:text-3xl">
          "This is the self-care practice I didn't know I needed."
        </blockquote>
        <p className="mt-4 text-xs font-medium tracking-[0.2em] text-muted-foreground">
          — NIKKI
        </p>
      </div>
    </section>
  );
}