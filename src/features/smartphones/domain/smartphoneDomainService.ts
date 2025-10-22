import { 
  Smartphone,
  PhoneSortOption,
  PhoneBrand,
  PhoneOS,
  SmartphoneFeatures
} from "@features/shared/domain/types";

export class SmartphoneDomainService {
  filterByOS(phones: Smartphone[], os: PhoneOS): Smartphone[] {
    if (os === "All") return phones;
    return phones.filter(phone => phone.os === os);
  }

  filterByBrand(phones: Smartphone[], brand: PhoneBrand): Smartphone[] {
    if (brand === "All") return phones;
    return phones.filter(phone => phone.brand === brand);
  }

  filterByPriceRange(phones: Smartphone[], min?: number, max?: number): Smartphone[] {
    return phones.filter(phone => {
      if (min && phone.price < min) return false;
      if (max && phone.price > max) return false;
      return true;
    });
  }

  sortPhones(phones: Smartphone[], sortOption: PhoneSortOption): Smartphone[] {
    const sorted = [...phones];
    
    switch (sortOption) {
      case "score_desc":
        return sorted.sort((a, b) => b.score - a.score);
      case "score_asc":
        return sorted.sort((a, b) => a.score - b.score);
      case "price_desc":
        return sorted.sort((a, b) => b.price - a.price);
      case "price_asc":
        return sorted.sort((a, b) => a.price - b.price);
      case "name_asc":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case "name_desc":
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      default:
        return sorted;
    }
  }

  searchPhones(phones: Smartphone[], query: string): Smartphone[] {
    const searchTerms = query.toLowerCase().split(" ");
    return phones.filter(phone => {
      const searchText = `${phone.brand} ${phone.name} ${phone.model} ${phone.os} ${phone.features.cpu} ${phone.features.camera.main}MP`.toLowerCase();
      return searchTerms.every(term => searchText.includes(term));
    });
  }

  calculateFeatureScore(features: SmartphoneFeatures): number {
    let score = 0;
    
    // CPU Score (0-25 points)
    if (features.cpu) {
      const cpuScore = this.calculateCpuScore(features.cpu);
      score += cpuScore * 25;
    }

    // RAM Score (0-20 points)
    if (features.ram) {
      const ramGB = parseInt(features.ram);
      score += Math.min(ramGB / 16, 1) * 20; // Max points at 16GB
    }

    // Storage Score (0-15 points)
    if (features.storage) {
      const storageGB = parseInt(features.storage);
      score += Math.min(storageGB / 512, 1) * 15; // Max points at 512GB
    }

    // Camera Score (0-20 points)
    if (features.camera?.main) {
      const mpMain = parseInt(features.camera.main);
      score += Math.min(mpMain / 108, 1) * 20; // Max points at 108MP
    }

    // Battery Score (0-20 points)
    if (features.battery) {
      const mAh = parseInt(features.battery);
      score += Math.min(mAh / 5000, 1) * 20; // Max points at 5000mAh
    }

    return Math.round(score);
  }

  calculateOverallScore(phone: Smartphone): number {
    const weights = {
      performance: 0.25,
      camera: 0.25,
      features: 0.20,
      battery: 0.15,
      value: 0.15
    };

    return Object.entries(weights).reduce((total, [metric, weight]) => {
      return total + (phone.scores[metric] || 0) * weight;
    }, 0);
  }

  getBrandedExplanation(phone: Smartphone): string {
    const explanation = [];
    const brandPersonality = this.getBrandPersonality(phone.brand);

    explanation.push(
      `The ${phone.brand} ${phone.model} is a ${brandPersonality} smartphone choice.`,
      phone.why,
      `Key specifications include:`,
      `• ${phone.os} operating system`,
      `• ${phone.features.cpu} processor`,
      `• ${phone.features.ram} RAM`,
      `• ${phone.features.storage} storage`,
      `• ${phone.features.display} display`,
      `• ${phone.features.camera.main}MP main camera` + 
        (phone.features.camera.ultrawide ? `, ${phone.features.camera.ultrawide}MP ultrawide` : "") +
        (phone.features.camera.telephoto ? `, ${phone.features.camera.telephoto}MP telephoto` : ""),
      `• ${phone.features.battery} battery`,
      `• Notable features: ${phone.features.features.join(", ")}`
    );

    return explanation.join("\n");
  }

  private getBrandPersonality(brand: PhoneBrand): string {
    const personalities: Record<PhoneBrand, string> = {
      "Samsung": "feature-rich and versatile",
      "Apple": "premium and ecosystem-integrated",
      "Xiaomi": "value-focused and innovative",
      "OPPO": "camera-centric and stylish",
      "vivo": "camera-focused and sleek",
      "HONOR": "balanced and competitive",
      "Other": "unique and specialized",
      "All": "comprehensive"
    };

    return personalities[brand];
  }

  calculateCpuScore(cpu: string): number {
    const cpuLower = cpu.toLowerCase();
    
    // High-end processors
    if (cpuLower.includes('snapdragon 8') || 
        cpuLower.includes('a15') || 
        cpuLower.includes('a16')) {
      return 1.0;
    }
    
    // Mid-high processors
    if (cpuLower.includes('snapdragon 7') || 
        cpuLower.includes('dimensity 9') || 
        cpuLower.includes('a14')) {
      return 0.8;
    }
    
    // Mid-range processors
    if (cpuLower.includes('snapdragon 6') || 
        cpuLower.includes('dimensity 8') || 
        cpuLower.includes('a13')) {
      return 0.6;
    }
    
    // Mid-low processors
    if (cpuLower.includes('snapdragon 4') || 
        cpuLower.includes('dimensity 7') || 
        cpuLower.includes('a12')) {
      return 0.4;
    }
    
    // Budget processors
    if (cpuLower.includes('helio') || 
        cpuLower.includes('snapdragon 2')) {
      return 0.2;
    }
    
    // Unknown/Other processors
    return 0.1;
  }

  compareSmartphones(phone1: Smartphone, phone2: Smartphone): {
    winner: Smartphone;
    categories: Array<{
      category: string;
      winner: string;
      difference: string;
    }>;
  } {
    const categories = [];
    let totalScore1 = 0;
    let totalScore2 = 0;

    // Price comparison
    categories.push({
      category: 'Price',
      winner: phone1.price < phone2.price ? phone1.name : phone2.name,
      difference: `$${Math.abs(phone1.price - phone2.price).toLocaleString()}`
    });
    totalScore1 += phone1.price < phone2.price ? 1 : 0;
    totalScore2 += phone2.price < phone1.price ? 1 : 0;

    // Performance score comparison
    const cpu1Score = this.calculateCpuScore(phone1.features.cpu);
    const cpu2Score = this.calculateCpuScore(phone2.features.cpu);
    categories.push({
      category: 'CPU Performance',
      winner: cpu1Score > cpu2Score ? phone1.name : phone2.name,
      difference: `${Math.abs(cpu1Score - cpu2Score) * 100}%`
    });
    totalScore1 += cpu1Score > cpu2Score ? 1 : 0;
    totalScore2 += cpu2Score > cpu1Score ? 1 : 0;

    // RAM comparison
    const ram1 = parseInt(phone1.features.ram);
    const ram2 = parseInt(phone2.features.ram);
    categories.push({
      category: 'RAM',
      winner: ram1 > ram2 ? phone1.name : phone2.name,
      difference: `${Math.abs(ram1 - ram2)}GB`
    });
    totalScore1 += ram1 > ram2 ? 1 : 0;
    totalScore2 += ram2 > ram1 ? 1 : 0;

    // Storage comparison
    const storage1 = parseInt(phone1.features.storage);
    const storage2 = parseInt(phone2.features.storage);
    categories.push({
      category: 'Storage',
      winner: storage1 > storage2 ? phone1.name : phone2.name,
      difference: `${Math.abs(storage1 - storage2)}GB`
    });
    totalScore1 += storage1 > storage2 ? 1 : 0;
    totalScore2 += storage2 > storage1 ? 1 : 0;

    // Main camera comparison
    const camera1 = parseInt(phone1.features.camera.main);
    const camera2 = parseInt(phone2.features.camera.main);
    categories.push({
      category: 'Main Camera',
      winner: camera1 > camera2 ? phone1.name : phone2.name,
      difference: `${Math.abs(camera1 - camera2)}MP`
    });
    totalScore1 += camera1 > camera2 ? 1 : 0;
    totalScore2 += camera2 > camera1 ? 1 : 0;

    // Battery comparison
    const battery1 = parseInt(phone1.features.battery);
    const battery2 = parseInt(phone2.features.battery);
    categories.push({
      category: 'Battery',
      winner: battery1 > battery2 ? phone1.name : phone2.name,
      difference: `${Math.abs(battery1 - battery2)}mAh`
    });
    totalScore1 += battery1 > battery2 ? 1 : 0;
    totalScore2 += battery2 > battery1 ? 1 : 0;

    // Overall score comparison
    const overallScore1 = this.calculateOverallScore(phone1);
    const overallScore2 = this.calculateOverallScore(phone2);
    categories.push({
      category: 'Overall Score',
      winner: overallScore1 > overallScore2 ? phone1.name : phone2.name,
      difference: `${Math.abs(overallScore1 - overallScore2).toFixed(1)} points`
    });
    totalScore1 += overallScore1 > overallScore2 ? 1 : 0;
    totalScore2 += overallScore2 > overallScore1 ? 1 : 0;

    return {
      winner: totalScore1 >= totalScore2 ? phone1 : phone2,
      categories
    };
  }
}