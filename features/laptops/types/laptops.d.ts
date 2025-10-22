interface Laptop {
  id: string;
  name: string;
  brand: string;
  price: number;
  specs: {
    cpu: string;
    ram: string;
    storage: string;
    display: string;
  };
  image?: string;
}

interface LaptopState {
  laptops: Laptop[];
  loading: boolean;
  error: string | null;
  selectedLaptop: Laptop | null;
}

interface LaptopApi {
  fetchLaptops(): Promise<Laptop[]>;
  getLaptopById(id: string): Promise<Laptop>;
  addLaptop(laptop: Omit<Laptop, 'id'>): Promise<Laptop>;
  updateLaptop(id: string, updates: Partial<Laptop>): Promise<Laptop>;
  deleteLaptop(id: string): Promise<void>;
}