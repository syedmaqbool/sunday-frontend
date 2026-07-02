export type HeroImageValue = {
  alt?: string;
  badgeText?: string;
  badgeIconUrl?: string;          
  siteLogoUrl?: string;  
  headlineLine1?: string;
  headlineLine1Color?: string;
  headlineLine2?: string;
  headlineLine2Color?: string;
  mobileUrl?: string;
  primaryCtaLabel?: string;
  primaryCtaBg?: string;           
  primaryCtaTextColor?: string;    
  secondaryCtaLabel?: string;
  secondaryCtaBorderColor?: string; 
  secondaryCtaTextColor?: string;   
  subtitle?: string;
  subtitleColor?: string;
  url?: string;
};

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
