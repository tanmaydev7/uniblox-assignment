import axios from "axios";
import { CartItem } from "../store/cartStore";

export const storeAxiosInstance = axios.create({
    baseURL: process.env.BACKEND_BASE_URL
});

interface CartItemResponse {
  id: number;
  productId: number;
  name: string;
  price: number;
  stock: number;
  image: string | null;
  quantity: number;
}

interface CartResponse {
  data: {
    items: CartItemResponse[];
    mobileNo: string;
  };
}

export const fetchCartFromAPI = async (mobileNo: string): Promise<CartItem[]> => {
  try {
    const response = await storeAxiosInstance.get<CartResponse>('/api/v1/store/cart', {
      params: { mobileNo },
    });

    // Transform API response to CartItem format
    return response.data.data.items.map((item) => ({
      id: item.id, // id is already productId from the API
      name: item.name,
      price: item.price,
      stock: item.stock,
      image: item.image,
      quantity: item.quantity,
    }));
  } catch (error) {
    console.error('Failed to fetch cart:', error);
    throw error;
  }
};