export interface HeroImageValue {
  alt: string;
  badgeText: string;
  headlineLine1: string;
  headlineLine1Color: string;
  headlineLine2: string;
  headlineLine2Color: string;
  mobileUrl: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
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
