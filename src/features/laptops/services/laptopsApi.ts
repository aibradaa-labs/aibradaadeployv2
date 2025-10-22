import { Laptop } from '../types/laptops';

interface FetchLaptopsParams {
  page: number;
  pageSize: number;
}

export const fetchLaptops = async ({ page, pageSize }: FetchLaptopsParams): Promise<Laptop[]> => {
  const response = await fetch(`/api/laptops?page=${page}&pageSize=${pageSize}`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};