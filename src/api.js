import axios from "axios";

const API = axios.create({
  baseURL: "https://shaurya-tools-backend.onrender.com",
  timeout: 30000
});

export const generateAI = async (tool, input) => {
  return API.post("/api/ai", { tool, input });
};
