import { Laptop, LaptopPlatform, LaptopBrand, LaptopSortOption } from "@features/shared/domain/types";

export class LaptopDomainService {
  filterByPlatform(laptops: Laptop[], platform: LaptopPlatform): Laptop[] {
    if (platform === "All") return laptops;
    return laptops.filter(laptop => laptop.platform === platform);
  }

  filterByBrand(laptops: Laptop[], brand: LaptopBrand): Laptop[] {
    if (brand === "All") return laptops;
    return laptops.filter(laptop => laptop.brand === brand);
  }

  filterByPriceRange(laptops: Laptop[], min?: number, max?: number): Laptop[] {
    return laptops.filter(laptop => {
      if (min && laptop.price < min) return false;
      if (max && laptop.price > max) return false;
      return true;
    });
  }

  sortLaptops(laptops: Laptop[], sortOption: LaptopSortOption): Laptop[] {
    const sorted = [...laptops];
    
    switch (sortOption) {
      case "score_desc":
        return sorted.sort((a, b) => b.score - a.score);
      case "score_asc":
        return sorted.sort((a, b) => a.score - b.score);
      case "price_desc":
        return sorted.sort((a, b) => b.price - a.price);
      case "price_asc":
        return sorted.sort((a, b) => a.price - b.price);
      default:
        return sorted;
    }
  }

  searchLaptops(laptops: Laptop[], query: string): Laptop[] {
    const searchTerms = query.toLowerCase().split(" ");
    return laptops.filter(laptop => {
      const searchText = `${laptop.brand} ${laptop.model} ${laptop.specs.cpu} ${laptop.specs.gpu}`.toLowerCase();
      return searchTerms.every(term => searchText.includes(term));
    });
  }

  calculateOverallScore(laptop: Laptop): number {
    const weights = {
      performance: 0.35,
      value: 0.25,
      quality: 0.20,
      features: 0.20
    };

    return Object.entries(weights).reduce((total, [metric, weight]) => {
      return total + (laptop.scores[metric] || 0) * weight;
    }, 0);
  }

  getBrandedExplanation(laptop: Laptop): string {
    const explanation = [];
    const brandPersonality = this.getBrandPersonality(laptop.brand);

    explanation.push(
      `The ${laptop.brand} ${laptop.model} is a ${brandPersonality} choice for your needs.`,
      laptop.why,
      `Key specifications include:`,
      `• ${laptop.specs.cpu} processor`,
      `• ${laptop.specs.gpu} graphics`,
      `• ${laptop.specs.ram} RAM`,
      `• ${laptop.specs.storage} storage`,
      `• ${laptop.specs.display} display`
    );

    return explanation.join("\n");
  }

  private getBrandPersonality(brand: string): string {
    const personalities: Record<string, string> = {
      "ASUS": "reliable and innovative",
      "Acer": "value-oriented and practical",
      "Dell": "professional and dependable",
      "HP": "versatile and balanced",
      "Lenovo": "business-focused and durable",
      "Apple": "premium and ecosystem-integrated",
      "MSI": "performance-driven and gaming-focused",
      "Other": "unique and specialized"
    };

    return personalities[brand] || "quality";
  }
}