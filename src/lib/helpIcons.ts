import {
  ShoppingBag,
  Tag,
  MessageCircle,
  ShieldCheck,
  CreditCard,
  Truck,
  BookOpen,
  HelpCircle,
  Sparkles,
  Heart,
  Star,
  Package,
  type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  ShoppingBag,
  Tag,
  MessageCircle,
  ShieldCheck,
  CreditCard,
  Truck,
  BookOpen,
  HelpCircle,
  Sparkles,
  Heart,
  Star,
  Package,
};

export const HELP_ICON_OPTIONS = Object.keys(MAP);

export const getHelpIcon = (name: string | null | undefined): LucideIcon =>
  (name && MAP[name]) || BookOpen;
