export interface HeroImageValue {
  alt: string;
  badgeIconUrl: string;
  badgeText: string;
  headlineLine1: string;
  headlineLine1Color: string;
  headlineLine2: string;
  headlineLine2Color: string;
  mobileUrl: string;
  primaryCtaBg: string;
  primaryCtaLabel: string;
  primaryCtaTextColor: string;
  secondaryCtaBorderColor: string;
  secondaryCtaLabel: string;
  secondaryCtaTextColor: string;
  siteLogoUrl: string;
  subtitle: string;
  subtitleColor: string;
  url: string;
}

export interface SiteSetting<T = Record<string, unknown>> {
  key: string;
  value: T;
}

export interface UploadedAsset {
  id: string;
  filename: string;
  mimetype: string;
  size: number;
  url: string;
}
