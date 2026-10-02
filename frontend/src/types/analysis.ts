export type Provider = "local" | "openai" | "ollama";

export type ProductSpec = {
  name: string;
  brand: string;
  category: string;
  specs: Record<string, string>;
  price: string | null;
  url: string | null;
};

export type ReviewSummary = {
  overall: string;
  pros: string[];
  cons: string[];
  recommended_for: string[];
  sentiment_score: number;
};

export type HardwareAnalysisResult = {
  spec: ProductSpec;
  reviews: ReviewSummary;
  source: Provider;
  extractor: "parser" | "llm" | "crawl4ai";
  cached: boolean;
};

export type SpecComparisonRow = {
  key: string;
  label: string;
  values: string[];
  winner_index: number | null;
  note: string | null;
};

export type BuyingGuide = {
  headline: string;
  value_note: string;
  picks: string[];
  caveat: string;
};

export type CompareResponse = {
  id: string | null;
  products: HardwareAnalysisResult[];
  summary: string;
  guide: BuyingGuide;
  spec_rows: SpecComparisonRow[];
  provider: Provider;
  created_at: string | null;
};

export type HistoryItem = {
  id: string;
  title: string;
  urls: string[];
  provider: Provider;
  created_at: string;
};

export type Preset = {
  id: string;
  label: string;
  category: string;
  urls: string[];
};
