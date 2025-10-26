// src/services/flights.js
import api from "./api";
import { mockFlights, mockFlightDetails } from "@/data/mockData";

// Adapt backend flight format to frontend format
function adaptFlight(flight) {
  return {
    flightNumber: flight.flight_number,
    destination: flight.destination,
    departureTime: flight.departure_time,
  };
}

// Adapt backend product format to frontend format
function adaptProduct(product) {
  // Generate category based on product name
  const getCategory = (productName) => {
    const name = productName.toLowerCase();
    if (name.includes('sandwich') || name.includes('wrap') || name.includes('ensalada')) {
      return 'Comida Fría';
    }
    if (name.includes('agua') || name.includes('jugo') || name.includes('coca') || name.includes('sprite')) {
      return 'Bebidas';
    }
    if (name.includes('café') || name.includes('té')) {
      return 'Bebidas Calientes';
    }
    if (name.includes('galleta') || name.includes('papas') || name.includes('snack')) {
      return 'Snacks';
    }
    if (name.includes('yogurt') || name.includes('leche')) {
      return 'Lácteos';
    }
    if (name.includes('pan') || name.includes('croissant')) {
      return 'Panadería';
    }
    if (name.includes('fruta') || name.includes('vegetal')) {
      return 'Snacks Saludables';
    }
    if (name.includes('cerveza') || name.includes('vino')) {
      return 'Bebidas Alcohólicas';
    }
    if (name.includes('pasta') || name.includes('hamburguesa') || name.includes('burrito')) {
      return 'Comida Caliente';
    }
    if (name.includes('helado') || name.includes('brownie') || name.includes('postre')) {
      return 'Postres';
    }
    return 'Otros';
  };

  // Generate priority lot based on product name hash
  const generatePriorityLot = (productName) => {
    let hash = 0;
    for (let i = 0; i < productName.length; i++) {
      const char = productName.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const letterCode = Math.abs(hash) % 26;
    return String.fromCharCode(65 + letterCode);
  };

  return {
    productName: product.product_name,
    category: getCategory(product.product_name),
    categoryQuantity: product.category_quantity,
    priorityLot: generatePriorityLot(product.product_name),
  };
}

// -------------------------------
// Flight endpoints
// -------------------------------
export async function fetchFlights() {
  try {
    const data = await api.get("/flights");
    return data.map(adaptFlight);
  } catch (err) {
    console.warn("⚠️ Using mock flights due to backend error:", err.message);
    return mockFlights;
  }
}

export async function fetchFlightDetails(flightNumber) {
  try {
    const data = await api.get(`/flights/${flightNumber}`);
    // Get flight info from the flights endpoint
    const flights = await api.get("/flights");
    const flight = flights.find(f => f.flight_number === flightNumber);
    
    return {
      flightNumber,
      destination: flight ? flight.destination : "Unknown",
      departureTime: flight ? flight.departure_time : new Date().toISOString(),
      products: data.map(adaptProduct),
    };
  } catch (err) {
    console.warn("⚠️ Using mock flight details due to backend error:", err.message);
    return mockFlightDetails[flightNumber];
  }
}

// -------------------------------
// Sensor/Run endpoints
// -------------------------------
export async function startRun(flightNumber) {
  try {
    return await api.post(`/run/start/${flightNumber}`);
  } catch (err) {
    console.error("Failed to start run:", err.message);
    throw err;
  }
}

export async function takeOne(productName) {
  try {
    return await api.post(`/run/take_one/${productName}`);
  } catch (err) {
    console.error("Failed to take product:", err.message);
    throw err;
  }
}

export async function putOne(productName) {
  try {
    return await api.post(`/run/put_one/${productName}`);
  } catch (err) {
    console.error("Failed to put product:", err.message);
    throw err;
  }
}

export async function getRunStatus() {
  try {
    return await api.get("/run/status");
  } catch (err) {
    console.error("Failed to get run status:", err.message);
    throw err;
  }
}
