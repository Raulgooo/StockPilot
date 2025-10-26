import api from "./api";

// -------------------------------
// Supplier endpoints
// -------------------------------
export async function getSupplierProducts() {
  try {
    return await api.get("/supplier/products");
  } catch (err) {
    console.error("Failed to get supplier products:", err.message);
    throw err;
  }
}

export async function createOrder(productName, quantity) {
  try {
    return await api.post("/supplier/orders", {
      product_name: productName,
      quantity: quantity
    });
  } catch (err) {
    console.error("Failed to create order:", err.message);
    throw err;
  }
}

export async function getOrders() {
  try {
    return await api.get("/supplier/orders");
  } catch (err) {
    console.error("Failed to get orders:", err.message);
    throw err;
  }
}

export async function receiveOrder(orderId) {
  try {
    return await api.post(`/supplier/orders/${orderId}/receive`);
  } catch (err) {
    console.error("Failed to receive order:", err.message);
    throw err;
  }
}

export async function placeOrder(orderId) {
  try {
    return await api.post(`/supplier/orders/${orderId}/place`);
  } catch (err) {
    console.error("Failed to place order:", err.message);
    throw err;
  }
}

export async function deleteOrder(orderId) {
  try {
    return await api.delete(`/supplier/orders/${orderId}`);
  } catch (err) {
    console.error("Failed to delete order:", err.message);
    throw err;
  }
}

// -------------------------------
// Simulation settings endpoints
// -------------------------------
export async function getSimulationSettings() {
  try {
    return await api.get("/simulation/settings");
  } catch (err) {
    console.error("Failed to get simulation settings:", err.message);
    throw err;
  }
}

export async function updateSimulationSettings(settings) {
  try {
    return await api.post("/simulation/settings", settings);
  } catch (err) {
    console.error("Failed to update simulation settings:", err.message);
    throw err;
  }
}
