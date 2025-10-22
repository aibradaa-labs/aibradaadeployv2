import { create } from "zustand";
import { Camera, CameraType, CameraBrand, CameraSortOption } from "@features/shared/domain/types";
import { CameraDomainService } from "../domain/cameraDomainService";
import { CameraRepository, ApiCameraRepository } from "./cameraRepository";

interface CameraState {
  cameras: Camera[];
  filteredCameras: Camera[];
  selectedCamera: Camera | null;
  selectedType: CameraType;
  selectedBrand: CameraBrand;
  sortOption: CameraSortOption;
  priceRange: { min: number | undefined; max: number | undefined };
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchCameras: () => Promise<void>;
  fetchCameraById: (id: string) => Promise<void>;
  setType: (type: CameraType) => void;
  setBrand: (brand: CameraBrand) => void;
  setSortOption: (option: CameraSortOption) => void;
  setPriceRange: (min?: number, max?: number) => void;
  setSearchQuery: (query: string) => void;
  applyFilters: () => void;
}

export const createCameraStore = (
  repository: CameraRepository,
  domainService: CameraDomainService
) => {
  return create<CameraState>((set, get) => ({
    cameras: [],
    filteredCameras: [],
    selectedCamera: null,
    selectedType: "All",
    selectedBrand: "All",
    sortOption: "score_desc",
    priceRange: { min: undefined, max: undefined },
    searchQuery: "",
    isLoading: false,
    error: null,

    fetchCameras: async () => {
      set({ isLoading: true, error: null });
      try {
        const cameras = await repository.getCameras();
        set({ cameras, filteredCameras: cameras });
        get().applyFilters();
      } catch (error) {
        set({ error: error instanceof Error ? error.message : "Failed to fetch cameras" });
      } finally {
        set({ isLoading: false });
      }
    },

    fetchCameraById: async (id: string) => {
      set({ isLoading: true, error: null });
      try {
        const camera = await repository.getCameraById(id);
        set({ selectedCamera: camera });
      } catch (error) {
        set({ error: error instanceof Error ? error.message : "Failed to fetch camera" });
      } finally {
        set({ isLoading: false });
      }
    },

    setType: (type) => {
      set({ selectedType: type });
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
      let filtered = [...state.cameras];

      // Apply type filter
      filtered = domainService.filterByType(filtered, state.selectedType);

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
        filtered = domainService.searchCameras(filtered, state.searchQuery);
      }

      // Apply sorting
      filtered = domainService.sortCameras(filtered, state.sortOption);

      set({ filteredCameras: filtered });
    }
  }));
};

// Export a singleton instance with default configuration
const defaultRepository = new ApiCameraRepository(process.env.REACT_APP_API_URL || "");
const defaultDomainService = new CameraDomainService();
export const useCameraStore = createCameraStore(defaultRepository, defaultDomainService);