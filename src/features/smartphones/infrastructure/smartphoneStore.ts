import { create } from "zustand";
import { Smartphone, PhoneBrand, PhoneType, PhoneSortOption } from "@features/shared/domain/types";
import { SmartphoneDomainService } from "../domain/smartphoneDomainService";
import { SmartphoneRepository, ApiSmartphoneRepository } from "./smartphoneRepository";

interface SmartphoneState {
  smartphones: Smartphone[];
  filteredSmartphones: Smartphone[];
  selectedSmartphone: Smartphone | null;
  selectedBrand: PhoneBrand;
  selectedType: PhoneType;
  sortOption: PhoneSortOption;
  priceRange: { min: number | undefined; max: undefined };
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchSmartphones: () => Promise<void>;
  fetchSmartphoneById: (id: string) => Promise<void>;
  setBrand: (brand: PhoneBrand) => void;
  setType: (type: PhoneType) => void;
  setSortOption: (option: PhoneSortOption) => void;
  setPriceRange: (min?: number, max?: number) => void;
  setSearchQuery: (query: string) => void;
  applyFilters: () => void;
}

export const createSmartphoneStore = (
  repository: SmartphoneRepository,
  domainService: SmartphoneDomainService
) => {
  return create<SmartphoneState>((set, get) => ({
    smartphones: [],
    filteredSmartphones: [],
    selectedSmartphone: null,
    selectedBrand: "All",
    selectedType: "All",
    sortOption: "score_desc",
    priceRange: { min: undefined, max: undefined },
    searchQuery: "",
    isLoading: false,
    error: null,

    fetchSmartphones: async () => {
      set({ isLoading: true, error: null });
      try {
        const smartphones = await repository.getSmartphones();
        set({ smartphones, filteredSmartphones: smartphones });
        get().applyFilters();
      } catch (error) {
        set({ error: error instanceof Error ? error.message : "Failed to fetch smartphones" });
      } finally {
        set({ isLoading: false });
      }
    },

    fetchSmartphoneById: async (id: string) => {
      set({ isLoading: true, error: null });
      try {
        const smartphone = await repository.getSmartphoneById(id);
        set({ selectedSmartphone: smartphone });
      } catch (error) {
        set({ error: error instanceof Error ? error.message : "Failed to fetch smartphone" });
      } finally {
        set({ isLoading: false });
      }
    },

    setBrand: (brand) => {
      set({ selectedBrand: brand });
      get().applyFilters();
    },

    setType: (type) => {
      set({ selectedType: type });
      get().applyFilters();
    },

    setSortOption: (option) => {
      set({ sortOption: option });
      get().applyFilters();
    },

    setPriceRange: (min, max) => {
      set({ priceRange: { min, max } });
      get().applyFilters();
    },

    setSearchQuery: (query) => {
      set({ searchQuery: query });
      get().applyFilters();
    },

    applyFilters: () => {
      const state = get();
      let filtered = [...state.smartphones];

      // Apply brand filter
      filtered = domainService.filterByBrand(filtered, state.selectedBrand);

      // Apply type filter
      // Type filtering is not implemented for smartphones yet

      // Apply price range filter
      filtered = domainService.filterByPriceRange(
        filtered,
        state.priceRange.min,
        state.priceRange.max
      );

      // Apply search
      if (state.searchQuery) {
        filtered = domainService.searchPhones(filtered, state.searchQuery);
      }

      // Apply sorting
      filtered = domainService.sortPhones(filtered, state.sortOption);

      set({ filteredSmartphones: filtered });
    }
  }));
};

// Export a singleton instance with default configuration
const defaultRepository = new ApiSmartphoneRepository(process.env.REACT_APP_API_URL || "");
const defaultDomainService = new SmartphoneDomainService();
export const useSmartphoneStore = createSmartphoneStore(defaultRepository, defaultDomainService);