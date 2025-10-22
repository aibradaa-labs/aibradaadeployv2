import { create } from "zustand";
import { Laptop, LaptopPlatform, LaptopBrand, LaptopSortOption } from "@features/shared/domain/types";
import { LaptopDomainService } from "../domain/laptopDomainService";
import { LaptopRepository, ApiLaptopRepository } from "./laptopRepository";

interface LaptopState {
  laptops: Laptop[];
  filteredLaptops: Laptop[];
  selectedLaptop: Laptop | null;
  selectedPlatform: LaptopPlatform;
  selectedBrand: LaptopBrand;
  sortOption: LaptopSortOption;
  priceRange: { min: number | undefined; max: number | undefined };
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchLaptops: () => Promise<void>;
  fetchLaptopById: (id: string) => Promise<void>;
  setPlatform: (platform: LaptopPlatform) => void;
  setBrand: (brand: LaptopBrand) => void;
  setSortOption: (option: LaptopSortOption) => void;
  setPriceRange: (min?: number, max?: number) => void;
  setSearchQuery: (query: string) => void;
  applyFilters: () => void;
}

export const createLaptopStore = (
  repository: LaptopRepository,
  domainService: LaptopDomainService
) => {
  return create<LaptopState>((set, get) => ({
    laptops: [],
    filteredLaptops: [],
    selectedLaptop: null,
    selectedPlatform: "All",
    selectedBrand: "All",
    sortOption: "score_desc",
    priceRange: { min: undefined, max: undefined },
    searchQuery: "",
    isLoading: false,
    error: null,

    fetchLaptops: async () => {
      set({ isLoading: true, error: null });
      try {
        const laptops = await repository.getLaptops();
        set({ laptops, filteredLaptops: laptops });
        get().applyFilters();
      } catch (error) {
        set({ error: error instanceof Error ? error.message : "Failed to fetch laptops" });
      } finally {
        set({ isLoading: false });
      }
    },

    fetchLaptopById: async (id: string) => {
      set({ isLoading: true, error: null });
      try {
        const laptop = await repository.getLaptopById(id);
        set({ selectedLaptop: laptop });
      } catch (error) {
        set({ error: error instanceof Error ? error.message : "Failed to fetch laptop" });
      } finally {
        set({ isLoading: false });
      }
    },

    setPlatform: (platform) => {
      set({ selectedPlatform: platform });
      get().applyFilters();
    },

    setBrand: (brand) => {
      set({ selectedBrand: brand });
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
      let filtered = [...state.laptops];

      // Apply platform filter
      filtered = domainService.filterByPlatform(filtered, state.selectedPlatform);

      // Apply brand filter
      filtered = domainService.filterByBrand(filtered, state.selectedBrand);

      // Apply price range filter
      filtered = domainService.filterByPriceRange(
        filtered,
        state.priceRange.min,
        state.priceRange.max
      );

      // Apply search
      if (state.searchQuery) {
        filtered = domainService.searchLaptops(filtered, state.searchQuery);
      }

      // Apply sorting
      filtered = domainService.sortLaptops(filtered, state.sortOption);

      set({ filteredLaptops: filtered });
    }
  }));
};

// Export a singleton instance with default configuration
const defaultRepository = new ApiLaptopRepository(process.env.REACT_APP_API_URL || "");
const defaultDomainService = new LaptopDomainService();
export const useLaptopStore = createLaptopStore(defaultRepository, defaultDomainService);