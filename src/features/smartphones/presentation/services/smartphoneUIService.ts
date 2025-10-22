import { 
  Smartphone, 
  PhoneSortOption, 
  SmartphoneFeatures 
} from "@features/shared/domain/types";
import { SmartphoneDomainService } from "../domain/smartphoneDomainService";
import { SmartphoneRepository } from "../infrastructure/smartphoneRepository";
import { useTranslation } from "react-i18next";

export interface SmartphoneUIService {
  formatPrice(price: number): string;
  formatScore(score: number): string;
  formatSpecs(phone: Smartphone): string[];
  getCameraDetails(camera: SmartphoneFeatures['camera']): string[];
  getSortOptions(): Array<{
    value: PhoneSortOption;
    label: string;
  }>;
}

export class SmartphoneUIServiceImpl implements SmartphoneUIService {
  constructor(
    private domainService: SmartphoneDomainService,
    private repository: SmartphoneRepository,
    private t: ReturnType<typeof useTranslation>['t']
  ) {}

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  }

  formatScore(score: number): string {
    return `${score}/100`;
  }

  formatSpecs(phone: Smartphone): string[] {
    const specs: string[] = [];

    if (phone.features.cpu) {
      specs.push(`CPU: ${phone.features.cpu}`);
    }

    if (phone.features.ram) {
      specs.push(`RAM: ${phone.features.ram}GB`);
    }

    if (phone.features.storage) {
      specs.push(`${this.t('storage')}: ${phone.features.storage}GB`);
    }

    if (phone.features.battery) {
      specs.push(`${this.t('battery')}: ${phone.features.battery}mAh`);
    }

    return specs;
  }

  getCameraDetails(camera: SmartphoneFeatures['camera']): string[] {
    const details: string[] = [];

    if (camera.main) {
      details.push(`${this.t('mainCamera')}: ${camera.main}MP`);
    }

    if (camera.ultrawide) {
      details.push(`${this.t('ultrawideCamera')}: ${camera.ultrawide}MP`);
    }

    if (camera.telephoto) {
      details.push(`${this.t('telephotoCamera')}: ${camera.telephoto}MP`);
    }

    return details;
  }

  getSortOptions(): Array<{ value: PhoneSortOption; label: string }> {
    return [
      { value: 'price_asc', label: this.t('priceLowToHigh') },
      { value: 'price_desc', label: this.t('priceHighToLow') },
      { value: 'name_asc', label: this.t('nameAZ') },
      { value: 'name_desc', label: this.t('nameZA') },
      { value: 'score_asc', label: this.t('scoreLowToHigh') },
      { value: 'score_desc', label: this.t('scoreHighToLow') },
    ];
  }
}