import { Recycle, Shirt, MessageCircleQuestion } from "lucide-react";

const features = [
  {
    icon: Recycle,
    title: "Thousands of Styles to Discover",
    desc: "100s of brands and trends to try. Minimize ownership and maximize newness.",
  },
  {
    icon: Shirt,
    title: "Sizes for Everyone — XXS to 5X, Plus, Petite & More",
    desc: "Made to fit more bodies than any other pre-loved marketplace.",
  },
  {
    icon: MessageCircleQuestion,
    title: "Support When You Need It",
    desc: "Our team is always here to help. Don't stress — just message us.",
  },
];

const WhyShopWithUs = () => (
  <section className="container py-20">
    <div className="text-center">
      <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
        Why Shop Pre-Loved with Us?
      </h2>
    </div>

    <div className="mt-12 grid gap-10 md:grid-cols-3">
      {features.map(({ icon: Icon, title, desc }) => (
        <div key={title} className="flex flex-col items-center text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="h-8 w-8" strokeWidth={1.5} />
          </div>
          <h3 className="font-heading text-base font-semibold text-foreground">
            {title}
          </h3>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">{desc}</p>
        </div>
      ))}
    </div>

    <div className="mt-20 flex flex-col items-center text-center">
      <blockquote className="font-heading text-2xl italic text-foreground md:text-3xl max-w-2xl leading-snug">
        “This is the self-care practice I didn't know I needed.”
      </blockquote>
      <p className="mt-4 text-xs font-medium tracking-[0.2em] text-muted-foreground">
        — NIKKI
      </p>
    </div>
  </section>
);

export default WhyShopWithUs;
