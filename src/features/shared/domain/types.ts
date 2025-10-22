// Core domain types for laptops, cameras, and smartphones

// Laptop types
export interface Laptop {
  id?: string;  // Optional for new laptops
  brand: LaptopBrand;
  model: string;
  price: number;
  imageUrl: string;
  specs: {
    cpu: string;
    gpu: string;
    ram: string;
    storage: string;
    display: string;
  };
  price_source_url: string;
  shopee_url: string;
  tiktok_url?: string | null;
  score: number;
  platform: LaptopPlatform;
  why: string;
  scores: {
    performance: number;
    value: number;
    [key: string]: number;
  };
}

export type LaptopPlatform = "Windows" | "MacOS" | "Linux" | "CUDA" | "All";
export type LaptopBrand = "ASUS" | "Acer" | "Dell" | "HP" | "Lenovo" | "Apple" | "MSI" | "Other" | "All";
export type LaptopSortOption = "score_desc" | "score_asc" | "price_desc" | "price_asc";

// Phone types
export type PhoneOS = "Android" | "iOS" | "All";
export type PhoneBrand = "Samsung" | "Apple" | "Xiaomi" | "OPPO" | "vivo" | "HONOR" | "Other" | "All";
export type PhoneType = "Budget" | "Mid-range" | "Flagship" | "All";
export type PhoneSortOption = 
  | "score_desc" 
  | "score_asc" 
  | "price_desc" 
  | "price_asc" 
  | "name_asc" 
  | "name_desc";

export interface SmartphoneFeatures {
  cpu: string;
  ram: string;
  storage: string;
  display: string;
  camera: {
    main: string;
    ultrawide?: string;
    telephoto?: string;
  };
  battery: string;
  features: string[];
}

export interface Smartphone {
  id: string;
  brand: PhoneBrand;
  name: string;
  model: string;
  price: number;
  description: string;
  imageUrl: string;
  purchaseLink: string;
  features: SmartphoneFeatures;
  price_source_url: string;
  shopee_url: string;
  tiktok_url?: string | null;
  score: number;
  os: PhoneOS;
  type: PhoneType;
  why: string;
  scores: {
    performance: number;
    value: number;
    camera: number;
    battery: number;
    [key: string]: number;
  };
}

// Camera types
export interface Camera {
  id: string;
  brand: CameraBrand;
  model: string;
  price: number;
  imageUrl: string;
  type: CameraType;
  sensorSize: string;
  resolution: string;
  lens_mount: string;
  features: string[];
  price_source_url: string;
  shopee_url: string;
  tiktok_url?: string | null;
  score: number;
  why: string;
  scores: {
    performance: number;
    value: number;
    [key: string]: number;
  };
}

export type CameraType = "DSLR" | "Mirrorless" | "Point & Shoot" | "Action" | "All";
export type CameraBrand = "Canon" | "Nikon" | "Sony" | "Fujifilm" | "Panasonic" | "Olympus" | "Other" | "All";
export type CameraSortOption = "score_desc" | "score_asc" | "price_desc" | "price_asc";

// Shared types
export type ProductType = "laptop" | "camera" | "smartphone";
export type SortOrder = "asc" | "desc";

export interface PriceRange {
  min: number;
  max: number;
}