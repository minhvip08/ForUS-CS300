import axios from "axios";

// Set config defaults when creating the instance
const instance = axios.create({
  withCredentials: true,
  baseURL: "https://forus-cs300.onrender.com/",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: localStorage.getItem("token")
  },
});

export { instance };