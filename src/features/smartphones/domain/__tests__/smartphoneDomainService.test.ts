import { SmartphoneDomainService } from '../domain/smartphoneDomainService';
import { Smartphone, PhoneBrand, PhoneSortOption } from '@features/shared/domain/types';

describe('SmartphoneDomainService', () => {
  let service: SmartphoneDomainService;
  let testPhones: Smartphone[];

  beforeEach(() => {
    service = new SmartphoneDomainService();
    testPhones = [
      {
        id: '1',
        brand: 'Samsung' as PhoneBrand,
        name: 'Galaxy S21',
        model: 'S21',
        price: 799,
        description: 'Flagship phone',
        imageUrl: 'url',
        purchaseLink: 'url',
        features: {
          cpu: 'Snapdragon 888',
          ram: '8GB',
          storage: '128GB',
          display: '6.2" AMOLED',
          camera: {
            main: '64',
            ultrawide: '12',
            telephoto: '8'
          },
          battery: '4000',
          features: ['5G', 'Wireless Charging']
        },
        price_source_url: 'url',
        shopee_url: 'url',
        tiktok_url: null,
        score: 90,
        os: 'Android',
        why: 'Great all-around flagship',
        scores: {
          performance: 90,
          camera: 85,
          features: 88,
          battery: 85,
          value: 82
        }
      },
      {
        id: '2',
        brand: 'Apple' as PhoneBrand,
        name: 'iPhone 13',
        model: '13',
        price: 999,
        description: 'Premium flagship',
        imageUrl: 'url',
        purchaseLink: 'url',
        features: {
          cpu: 'A15 Bionic',
          ram: '6GB',
          storage: '256GB',
          display: '6.1" Super Retina XDR',
          camera: {
            main: '12',
            ultrawide: '12'
          },
          battery: '3240',
          features: ['5G', 'MagSafe']
        },
        price_source_url: 'url',
        shopee_url: 'url',
        tiktok_url: null,
        score: 95,
        os: 'iOS',
        why: 'Best iOS experience',
        scores: {
          performance: 95,
          camera: 92,
          features: 90,
          battery: 88,
          value: 85
        }
      }
    ];
  });

  describe('filterByBrand', () => {
    it('should return all phones when brand is All', () => {
      const result = service.filterByBrand(testPhones, 'All');
      expect(result).toHaveLength(2);
    });

    it('should filter phones by brand', () => {
      const result = service.filterByBrand(testPhones, 'Samsung');
      expect(result).toHaveLength(1);
      expect(result[0].brand).toBe('Samsung');
    });
  });

  describe('filterByPriceRange', () => {
    it('should filter phones within price range', () => {
      const result = service.filterByPriceRange(testPhones, 700, 900);
      expect(result).toHaveLength(1);
      expect(result[0].price).toBe(799);
    });

    it('should return all phones when no price range is specified', () => {
      const result = service.filterByPriceRange(testPhones);
      expect(result).toHaveLength(2);
    });
  });

  describe('searchPhones', () => {
    it('should find phones by search terms', () => {
      const result = service.searchPhones(testPhones, 'galaxy');
      expect(result).toHaveLength(1);
      expect(result[0].name).toContain('Galaxy');
    });

    it('should handle multiple search terms', () => {
      const result = service.searchPhones(testPhones, 'samsung flagship');
      expect(result).toHaveLength(1);
      expect(result[0].brand).toBe('Samsung');
    });
  });

  describe('sortPhones', () => {
    it('should sort by price ascending', () => {
      const result = service.sortPhones(testPhones, 'price_asc');
      expect(result[0].price).toBe(799);
      expect(result[1].price).toBe(999);
    });

    it('should sort by price descending', () => {
      const result = service.sortPhones(testPhones, 'price_desc');
      expect(result[0].price).toBe(999);
      expect(result[1].price).toBe(799);
    });

    it('should sort by name', () => {
      const result = service.sortPhones(testPhones, 'name_asc' as PhoneSortOption);
      expect(result[0].name).toBe('Galaxy S21');
      expect(result[1].name).toBe('iPhone 13');
    });

    it('should sort by score', () => {
      const result = service.sortPhones(testPhones, 'score_desc');
      expect(result[0].score).toBe(95);
      expect(result[1].score).toBe(90);
    });
  });

  describe('calculateFeatureScore', () => {
    it('should calculate feature score correctly', () => {
      const score = service.calculateFeatureScore(testPhones[0].features);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('compareSmartphones', () => {
    it('should compare two smartphones and determine a winner', () => {
      const comparison = service.compareSmartphones(testPhones[0], testPhones[1]);
      expect(comparison.winner).toBeDefined();
      expect(comparison.categories).toHaveLength(7); // Price, CPU, RAM, Storage, Camera, Battery, Overall
    });

    it('should calculate category differences correctly', () => {
      const comparison = service.compareSmartphones(testPhones[0], testPhones[1]);
      const priceCategory = comparison.categories.find(c => c.category === 'Price');
      expect(priceCategory).toBeDefined();
      expect(priceCategory!.difference).toBe('$200');
    });
  });
});