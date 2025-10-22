import { Camera, CameraType, CameraBrand, CameraSortOption } from "@features/shared/domain/types";

export class CameraDomainService {
  filterByType(cameras: Camera[], type: CameraType): Camera[] {
    if (type === "All") return cameras;
    return cameras.filter(camera => camera.type === type);
  }

  filterByBrand(cameras: Camera[], brand: CameraBrand): Camera[] {
    if (brand === "All") return cameras;
    return cameras.filter(camera => camera.brand === brand);
  }

  filterByPriceRange(cameras: Camera[], min?: number, max?: number): Camera[] {
    return cameras.filter(camera => {
      if (min && camera.price < min) return false;
      if (max && camera.price > max) return false;
      return true;
    });
  }

  sortCameras(cameras: Camera[], sortOption: CameraSortOption): Camera[] {
    const sorted = [...cameras];
    
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

  searchCameras(cameras: Camera[], query: string): Camera[] {
    const searchTerms = query.toLowerCase().split(" ");
    return cameras.filter(camera => {
      const searchText = `${camera.brand} ${camera.model} ${camera.type} ${camera.sensorSize} ${camera.resolution}`.toLowerCase();
      return searchTerms.every(term => searchText.includes(term));
    });
  }

  calculateOverallScore(camera: Camera): number {
    const weights = {
      imageQuality: 0.35,
      features: 0.25,
      value: 0.20,
      handling: 0.20
    };

    return Object.entries(weights).reduce((total, [metric, weight]) => {
      return total + (camera.scores[metric] || 0) * weight;
    }, 0);
  }

  getBrandedExplanation(camera: Camera): string {
    const explanation = [];
    const brandPersonality = this.getBrandPersonality(camera.brand);

    explanation.push(
      `The ${camera.brand} ${camera.model} is a ${brandPersonality} choice for photography.`,
      camera.why,
      `Key specifications include:`,
      `• ${camera.type} camera`,
      `• ${camera.sensorSize} sensor`,
      `• ${camera.resolution} resolution`,
      `• ${camera.lens_mount} mount`,
      `• Notable features: ${camera.features.join(", ")}`
    );

    return explanation.join("\n");
  }

  private getBrandPersonality(brand: string): string {
    const personalities: Record<string, string> = {
      "Canon": "trusted and versatile",
      "Nikon": "professional and reliable",
      "Sony": "innovative and cutting-edge",
      "Fujifilm": "stylish and quality-focused",
      "Panasonic": "video-centric and feature-rich",
      "Olympus": "compact and travel-friendly",
      "Other": "unique and specialized"
    };

    return personalities[brand] || "quality";
  }
}