import axios from "axios";

export const storeAxiosInstance = axios.create({
    baseURL: process.env.BACKEND_BASE_URL
})