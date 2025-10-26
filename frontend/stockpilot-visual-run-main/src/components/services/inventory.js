// src/components/services/inventory.js
import api from "./api";

// -------------------------------
// Inventory endpoints
// -------------------------------
export async function createLot(lotId, cantidad, diasCaducidad, productName = "Producto") {
  try {
    return await api.post("/inventory/lots", {
      lot_id: lotId,
      cantidad: cantidad,
      dias_caducidad: diasCaducidad,
      product_name: productName
    });
  } catch (err) {
    console.error("Failed to create lot:", err.message);
    throw err;
  }
}

export async function getInventoryByProduct() {
  try {
    return await api.get("/inventory/by-product");
  } catch (err) {
    console.error("Failed to get inventory by product:", err.message);
    throw err;
  }
}

export async function getLot(lotId) {
  try {
    return await api.get(`/inventory/lots/${lotId}`);
  } catch (err) {
    console.error("Failed to get lot:", err.message);
    throw err;
  }
}

export async function deleteLotOrProduct(identifier) {
  try {
    return await api.delete(`/inventory/lots/${identifier}`);
  } catch (err) {
    console.error("Failed to delete:", err.message);
    throw err;
  }
}

export async function getFullInventory() {
  try {
    return await api.get("/inventory");
  } catch (err) {
    console.error("Failed to get inventory:", err.message);
    throw err;
  }
}

export async function getInventorySummary() {
  try {
    return await api.get("/inventory/summary");
  } catch (err) {
    console.error("Failed to get inventory summary:", err.message);
    throw err;
  }
}
