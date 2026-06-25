import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { isMockDataEnabled } from '@/lib/mockConfig';

export interface HelpCategory {
  key: string;
  id: string;
  blurb: string;
  icon: string;
  label: string;
  sort_order: number;
}

export interface HelpFaq {
  id: string;
  answer: string;
  category_key: string;
  question: string;
  sort_order: number;
}

export interface HelpTutorial {
  id: string;
  cta_label: string;
  cta_to: string;
  icon: string;
  sort_order: number;
  steps: string[];
  title: string;
}

export const MOCK_HELP_CATEGORIES: HelpCategory[] = [
  { key: 'buying', id: 'cat-1', blurb: 'How to find and purchase items', icon: 'shopping-bag', label: 'Buying', sort_order: 1 },
  { key: 'selling', id: 'cat-2', blurb: 'List items and manage your sales', icon: 'package', label: 'Selling', sort_order: 2 },
  { key: 'shipping', id: 'cat-3', blurb: 'Couriers, tracking and delivery', icon: 'truck', label: 'Shipping', sort_order: 3 },
  { key: 'payments', id: 'cat-4', blurb: 'Payouts, refunds and billing', icon: 'credit-card', label: 'Payments', sort_order: 4 },
  { key: 'account', id: 'cat-5', blurb: 'Profile, settings and security', icon: 'user', label: 'Account', sort_order: 5 },
  { key: 'returns', id: 'cat-6', blurb: 'Disputes, returns and complaints', icon: 'undo-2', label: 'Returns', sort_order: 6 },
];

export const MOCK_HELP_FAQS: HelpFaq[] = [
  { id: 'faq-1', answer: 'Open any listing and tap \'Make Offer\'. Enter your price and the seller will accept, decline, or counter within 24 hours.', category_key: 'buying', question: 'How do I make an offer on a listing?', sort_order: 1 },
  { id: 'faq-2', answer: 'Yes — add items from different sellers to your cart and check out in one go. Each seller ships their items separately.', category_key: 'buying', question: 'Can I buy multiple items in one checkout?', sort_order: 2 },
  { id: 'faq-3', answer: 'Click \'Create Listing\' in the navbar, fill in the item details, upload photos, set a price, and publish. Your item goes live instantly.', category_key: 'selling', question: 'How do I create a listing?', sort_order: 1 },
  { id: 'faq-4', answer: 'Go to your profile, open the \'Sold\' tab, expand the order, and tap \'Mark as Shipped\'. Enter the courier and tracking number.', category_key: 'selling', question: 'How do I mark an item as shipped?', sort_order: 2 },
  { id: 'faq-5', answer: 'We support PostNet, The Courier Guy, Aramex, PUDO, Pargo, Fastway, DHL, SA Post Office, and Hand Delivery.', category_key: 'shipping', question: 'Which couriers are supported?', sort_order: 1 },
  { id: 'faq-6', answer: 'You have 12 hours after the expected delivery date to raise a concern. Go to the order in your profile and tap \'Item Not Received\'.', category_key: 'shipping', question: 'What if my item hasn\'t arrived?', sort_order: 2 },
  { id: 'faq-7', answer: 'Your payout is released once the buyer confirms delivery (or after the auto-complete window). Funds arrive in your linked bank account within 2–3 business days.', category_key: 'payments', question: 'When do I get paid as a seller?', sort_order: 1 },
  { id: 'faq-8', answer: 'Go to your Profile page and click \'Add details\' under Payout Details. Enter your account holder name, bank, account number, IBAN, and SWIFT/BIC.', category_key: 'payments', question: 'How do I add my bank account for payouts?', sort_order: 2 },
  { id: 'faq-9', answer: 'Within 12 hours of delivery, open the order in your profile and tap \'Raise Concern\'. Attach photos and describe the issue — our team will review it.', category_key: 'returns', question: 'How do I raise a quality complaint?', sort_order: 1 },
  { id: 'faq-10', answer: 'Click \'Edit Profile\' on your profile page to update your name, bio, location, phone number, and avatar.', category_key: 'account', question: 'How do I edit my profile?', sort_order: 1 },
];

export const MOCK_HELP_TUTORIALS: HelpTutorial[] = [
  { id: 'tut-1', cta_label: 'Create a listing', cta_to: '/create-listing', icon: 'package', sort_order: 1, steps: ['Click \'Create Listing\' in the top navbar.', 'Upload clear photos of your item.', 'Fill in title, brand, condition, size, and price.', 'Hit \'Publish\' — your listing is live!'], title: 'List your first item' },
  { id: 'tut-2', cta_label: 'Browse listings', cta_to: '/listings', icon: 'shopping-bag', sort_order: 2, steps: ['Browse listings or search for what you need.', 'Tap \'Buy Now\' or make an offer.', 'Enter your shipping address and pay securely.', 'Track your order from your profile.'], title: 'Buy an item safely' },
  { id: 'tut-3', cta_label: 'View sold items', cta_to: '/profile', icon: 'truck', sort_order: 3, steps: ['Go to your Profile and open the \'Sold\' tab.', 'Expand the order and tap \'Mark as Shipped\'.', 'Choose a courier and enter the tracking number.', 'The buyer is notified automatically.'], title: 'Ship a sold item' },
];

export const helpQueryKey = {
  categories: () => ['help-categories'] as const,
  faqs: () => ['help-faqs'] as const,
  topFaqs: () => ['top-faqs'] as const,
  tutorials: () => ['help-tutorials'] as const,
};

export function getHelpCategoriesOptions() {
  return queryOptions({
    queryFn: async () => {
      if (isMockDataEnabled)
        return MOCK_HELP_CATEGORIES;
      const { data, error } = await supabase
        .from('help_categories')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true });
      if (error)
        throw error;
      return data as HelpCategory[];
    },
    queryKey: helpQueryKey.categories(),
  });
}

export function getHelpFaqsOptions() {
  return queryOptions({
    queryFn: async () => {
      if (isMockDataEnabled)
        return MOCK_HELP_FAQS;
      const { data, error } = await supabase
        .from('help_faqs')
        .select('*')
        .eq('published', true)
        .order('category_key', { ascending: true })
        .order('sort_order', { ascending: true });
      if (error)
        throw error;
      return data as HelpFaq[];
    },
    queryKey: helpQueryKey.faqs(),
  });
}

export function getTopFaqsOptions() {
  return queryOptions({
    queryFn: async () => {
      if (isMockDataEnabled)
        return MOCK_HELP_FAQS;
      const { data, error } = await supabase
        .from('help_faqs')
        .select('*')
        .eq('published', true)
        .order('sort_order', { ascending: true })
        .limit(6);
      if (error)
        throw error;
      return data as HelpFaq[];
    },
    queryKey: helpQueryKey.topFaqs(),
  });
}

export function getHelpTutorialsOptions() {
  return queryOptions({
    queryFn: async () => {
      if (isMockDataEnabled)
        return MOCK_HELP_TUTORIALS;
      const { data, error } = await supabase
        .from('help_tutorials')
        .select('*')
        .eq('published', true)
        .order('sort_order', { ascending: true });
      if (error)
        throw error;
      return data as HelpTutorial[];
    },
    queryKey: helpQueryKey.tutorials(),
  });
}
