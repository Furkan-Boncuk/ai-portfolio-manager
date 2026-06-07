export interface Asset {
  id: string;
  symbol: string;
  name: string;
  assetType: string;
  exchange: string;
}

export interface Portfolio {
  id: string;
  name: string;
  baseCurrency: string;
  isActive: boolean;
}
