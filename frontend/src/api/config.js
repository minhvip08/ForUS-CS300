import axios from "axios";

// Set config defaults when creating the instance
const instance = axios.create({
  baseURL: "http://localhost:5000",
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

export { instance };