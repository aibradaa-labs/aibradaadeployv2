import { Laptop, LaptopPlatform, LaptopBrand } from "@features/shared/domain/types";

export interface LaptopRepository {
  getLaptops(): Promise<Laptop[]>;
  getLaptopById(id: string): Promise<Laptop | null>;
  searchLaptops(query: string): Promise<Laptop[]>;
  filterLaptops(options: {
    platform?: LaptopPlatform;
    brand?: LaptopBrand;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<Laptop[]>;
}

export class ApiLaptopRepository implements LaptopRepository {
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string) {
    this.apiBaseUrl = apiBaseUrl;
  }

  async getLaptops(): Promise<Laptop[]> {
    const response = await fetch(`${this.apiBaseUrl}/laptops`);
    if (!response.ok) {
      throw new Error(`Failed to fetch laptops: ${response.statusText}`);
    }
    return response.json();
  }

  async getLaptopById(id: string): Promise<Laptop | null> {
    const response = await fetch(`${this.apiBaseUrl}/laptops/${id}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to fetch laptop: ${response.statusText}`);
    }
    return response.json();
  }

  async searchLaptops(query: string): Promise<Laptop[]> {
    const response = await fetch(
      `${this.apiBaseUrl}/laptops/search?q=${encodeURIComponent(query)}`
    );
    if (!response.ok) {
      throw new Error(`Failed to search laptops: ${response.statusText}`);
    }
    return response.json();
  }

  async filterLaptops(options: {
    platform?: LaptopPlatform;
    brand?: LaptopBrand;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<Laptop[]> {
    const params = new URLSearchParams();
    if (options.platform) params.append("platform", options.platform);
    if (options.brand) params.append("brand", options.brand);
    if (options.minPrice) params.append("minPrice", options.minPrice.toString());
    if (options.maxPrice) params.append("maxPrice", options.maxPrice.toString());

    const response = await fetch(
      `${this.apiBaseUrl}/laptops/filter?${params.toString()}`
    );
    if (!response.ok) {
      throw new Error(`Failed to filter laptops: ${response.statusText}`);
    }
    return response.json();
  }
}

export class LocalLaptopRepository implements LaptopRepository {
  private laptops: Laptop[] = [];

  constructor(initialData: Laptop[] = []) {
    this.laptops = initialData;
  }

  async getLaptops(): Promise<Laptop[]> {
    return Promise.resolve(this.laptops);
  }

  async getLaptopById(id: string): Promise<Laptop | null> {
    const laptop = this.laptops.find(l => l.id === id);
    return Promise.resolve(laptop || null);
  }

  async searchLaptops(query: string): Promise<Laptop[]> {
    const terms = query.toLowerCase().split(" ");
    const filtered = this.laptops.filter(laptop => {
      const searchText = `${laptop.brand} ${laptop.model} ${laptop.cpu} ${laptop.gpu}`.toLowerCase();
      return terms.every(term => searchText.includes(term));
    });
    return Promise.resolve(filtered);
  }

  async filterLaptops(options: {
    platform?: LaptopPlatform;
    brand?: LaptopBrand;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<Laptop[]> {
    let filtered = [...this.laptops];

    if (options.platform && options.platform !== "All") {
      filtered = filtered.filter(l => l.platform === options.platform);
    }

    if (options.brand && options.brand !== "All") {
      filtered = filtered.filter(l => l.brand === options.brand);
    }

    if (options.minPrice !== undefined) {
      filtered = filtered.filter(l => l.price >= options.minPrice!);
    }

    if (options.maxPrice !== undefined) {
      filtered = filtered.filter(l => l.price <= options.maxPrice!);
    }

    return Promise.resolve(filtered);
  }
}