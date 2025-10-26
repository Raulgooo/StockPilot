import api from "./api";

// -------------------------------
// Run status endpoints
// -------------------------------
export async function getRunStatus() {
  try {
    return await api.get("/run/status");
  } catch (err) {
    console.error("Failed to get run status:", err.message);
    throw err;
  }
}

export async function takeOneProduct(productName) {
  try {
    return await api.post(`/run/take_one/${productName}`);
  } catch (err) {
    console.error("Failed to take one product:", err.message);
    throw err;
  }
}

export async function putOneProduct(productName) {
  try {
    return await api.post(`/run/put_one/${productName}`);
  } catch (err) {
    console.error("Failed to put one product:", err.message);
    throw err;
  }
}
