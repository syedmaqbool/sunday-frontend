export interface HeroImageValue {
  url: string;
  mobileUrl: string;
  alt: string;
  badgeText: string;
  headlineLine1: string;
  headlineLine1Color: string;
  headlineLine2: string;
  headlineLine2Color: string;
  subtitle: string;
  subtitleColor: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
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
