import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { useQuery } from '@tanstack/react-query';

import { ArrowRight, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utilities';
import { getTopFaqsOptions } from '@/queries/help.query';

export default function TopFAQs() {
  const { data: faqs = [] } = useQuery(getTopFaqsOptions());

  if (faqs.length === 0)
    return null;

  return (
    <section className="
      container max-w-3xl py-14
      md:py-20
    "
    >
      <div className="mb-8 text-center">
        <h2 className="
          font-heading text-3xl font-semibold tracking-tight text-foreground
          md:text-4xl
        "
        >
          Frequently asked questions
        </h2>
      </div>

      <AccordionPrimitive.Root
        collapsible
        type="single"
        className="border-t border-border"
      >
        {faqs.map(faq => (
          <AccordionPrimitive.Item
            key={faq.id}
            value={faq.id}
            className="border-b border-border"
          >
            <AccordionPrimitive.Header className="flex">
              <AccordionPrimitive.Trigger
                className={cn(
                  `
                    group flex flex-1 items-center justify-between py-5 text-left text-base font-medium text-foreground transition-colors
                    hover:text-primary
                  `,
                )}
              >
                <span>{faq.question}</span>
                <Plus className="
                  h-5 w-5 shrink-0 text-primary transition-transform duration-300
                  group-data-[state=open]:rotate-45
                "
                />
              </AccordionPrimitive.Trigger>
            </AccordionPrimitive.Header>
            <AccordionPrimitive.Content className="
              overflow-hidden text-sm text-muted-foreground
              data-[state=closed]:animate-accordion-up
              data-[state=open]:animate-accordion-down
            "
            >
              <div className="whitespace-pre-line pb-5 pr-10 leading-relaxed">
                {faq.answer}
              </div>
            </AccordionPrimitive.Content>
          </AccordionPrimitive.Item>
        ))}
      </AccordionPrimitive.Root>

      <div className="mt-8 flex justify-center">
        <Link
          to="/help"
          className="
            inline-flex items-center gap-1.5 text-sm font-medium text-primary
            hover:underline
          "
        >
          View all FAQs
          {' '}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
