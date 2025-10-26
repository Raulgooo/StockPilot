import api from "./api";

// -------------------------------
// Runs endpoints
// -------------------------------
export async function getRunsStats() {
  try {
    return await api.get("/runs/stats");
  } catch (err) {
    console.error("Failed to get runs stats:", err.message);
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
