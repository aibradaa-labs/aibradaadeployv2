import {
  LaptopsStateManager,
  Laptop,
  Platform,
  Brand,
  AppState
} from "../src/features/laptops/domain/laptopsState";
import { SecurityError } from "../src/error-handling";

describe("LaptopsStateManager", () => {
  let store: LaptopsStateManager;
  let initialState: AppState;
  let testLaptop: Laptop;

  beforeEach(() => {
    initialState = {
      data: {
        allLaptops: [],
        sortedByRank: [],
        fallbackLaptops: []
      },
      ui: {
        app: {
          price: 0,
          platform: "All" as Platform,
          brand: "All" as Brand,
          sort: "score_desc",
          radarSelection: []
        }
      }
    };
    store = new LaptopsStateManager(initialState);
    testLaptop = {
      brand: "Other",
      model: "TestModel",
      price: 1000,
      imageUrl: "test.jpg",
      specs: {
        cpu: "Test CPU",
        gpu: "Test GPU",
        ram: "8GB",
        storage: "256GB",
        display: "15.6",
      },
      price_source_url: "test.com",
      shopee_url: "shopee.com",
      score: 8.5,
      platform: "Windows",
      why: "Test reason",
      scores: { performance: 8, value: 9 }
    };
  });

  test("initializes with default state", () => {
    const state = store.getState();
    expect(state).toEqual(initialState);
  });

  test("updates state successfully", () => {
    const result = store.updateState((state) => ({
      success: true,
      data: {
        ...state,
        ui: {
          ...state.ui,
          app: {
            ...state.ui.app,
            price: 1500
          }
        }
      }
    }));

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ui.app.price).toBe(1500);
    }
  });

  test("handles platform update", () => {
    const result = store.updateState((state) => ({
      success: true,
      data: {
        ...state,
        ui: {
          ...state.ui,
          app: {
            ...state.ui.app,
            platform: "MacOS"
          }
        }
      }
    }));

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ui.app.platform).toBe("MacOS");
    }
  });

  test("handles error state", () => {
    const result = store.updateState(() => {
      throw new SecurityError("Test error");
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(SecurityError);
      expect(result.error.message).toBe("Test error");
    }
  });
});
