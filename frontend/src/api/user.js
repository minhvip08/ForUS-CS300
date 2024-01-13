import { instance } from "./config";

const infoUser = async () => {
  try {
    const response = await instance.get("/users/info");
    return response;
  } catch (error) {
    console.error(error);
    return error.response;
  }

  return null;
};

const logout = async () => {
  try {
    const response = await instance.post("/users/logout");
    return response;
  } catch (error) {
    console.error(error);
    return error.response;
  }
};

const updateProfile = async (data) => {
  try {
    const response = await instance.put("/users/update-profile", data);
    return response;
  } catch (error) {
    console.error(error);
    return error.response;
  }
};

const forgotPassword = async (data) => {
  try {
    const response = await instance.post("/users/forgot-password", data);
    return response;
  } catch (error) {
    console.error(error);
    return error.response;
  }
};

const resetPassword = async (data) => {
  try {
    const response = await instance.put("/users/reset-password", data);
    return response;
  } catch (error) {
    console.error(error);
    return error.response;
  }
};

const updatePassword = async (data) => {
  try {
    const response = await instance.put("/users/update-password", data);
    return response;
  } catch (error) {
    console.error(error);
    return error.response;
  }
};

const login = async (data) => {
  try {
    const response = await instance.post("/users/login", data);
    return response;
  } catch (error) {
    console.error(error);
    return error.response;
  }
};

const getNotification = async () => {
  try {
    const response = instance.get("/users/notification");
    return response;
  } catch (error) {
    console.error(error);
    return error.response;
  }
};

const updateAllNotificationIsRead = async () => {
  try {
    const response = instance.put("/users/notification");
    return response;
  } catch (error) {
    console.error(error);
    return error.response;
  }
};

const getAllUsers = async () => {
  try {
    const response = await instance.get("/users/all-info");
    return response;
  } catch (error) {
    console.error("Error fetching users:", error.response);
  }

  return null;
};

const getThreadHistory = async (ID) => {
  try {
    const response = await instance.get("/users/thread-history?user_id=" + ID);
    return response;
  } catch (error) {
    console.error("Error fetching users:", error.response);
  }

  return null;
};

export {
  logout,
  infoUser,
  updateProfile,
  forgotPassword,
  resetPassword,
  updatePassword,
  login,
  getNotification,
  updateAllNotificationIsRead,
  getAllUsers,
  getThreadHistory,
};
