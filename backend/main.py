from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
from uuid import uuid4

app = FastAPI(
    title="SkySupply API",
    description="Backend base para gestión de vuelos y productos de catering (fase pre-sensores).",
    version="0.1.0"
)


class Product(BaseModel):
    id: str
    name: str
    category: str
    quantity: int


class Flight(BaseModel):
    id: str
    flight_number: str
    origin: str
    destination: str
    departure_time: str
    products: List[Product]


class FlightInput(BaseModel):
    flight_number: str
    origin: str
    destination: str
    departure_time: str
    products: List[Dict]


# -----------------------------
# 💾 "BASE DE DATOS" TEMPORAL EN MEMORIA
# -----------------------------
flights_db: Dict[str, Flight] = {}


# -----------------------------
# ✈️ ENDPOINTS PRINCIPALES
# -----------------------------

@app.post("/flights/upload", summary="Subir dataset de vuelos")
def upload_flights(data: List[FlightInput]):
    """
    Recibe una lista de vuelos en formato JSON y los guarda en memoria.
    Cada vuelo contiene su lista de productos (snacks, bebidas, etc.)
    """

    flights_db.clear()  # limpiar dataset anterior (para demo/hackathon)
    for f in data:
        flight_id = str(uuid4())
        products = [
            Product(
                id=str(uuid4()),
                name=p.get("name", "Unnamed Product"),
                category=p.get("category", "General"),
                quantity=p.get("quantity", 0)
            )
            for p in f.products
        ]
        flights_db[flight_id] = Flight(
            id=flight_id,
            flight_number=f.flight_number,
            origin=f.origin,
            destination=f.destination,
            departure_time=f.departure_time,
            products=products
        )
    return {"message": "Flights uploaded successfully", "count": len(flights_db)}


@app.get("/flights", response_model=List[Flight], summary="Obtener todos los vuelos cargados")
def get_all_flights():
    """Devuelve todos los vuelos actualmente cargados."""
    return list(flights_db.values())


@app.get("/flights/{flight_id}", response_model=Flight, summary="Obtener detalles de un vuelo específico")
def get_flight(flight_id: str):
    """Devuelve la información completa de un vuelo, incluyendo sus productos."""
    flight = flights_db.get(flight_id)
    if not flight:
        raise HTTPException(status_code=404, detail="Flight not found")
    return flight


@app.get("/flights/{flight_id}/products", response_model=List[Product], summary="Obtener lista de productos de un vuelo")
def get_flight_products(flight_id: str):
    """
    Devuelve la lista de productos necesarios para ese vuelo.
    Esta lista se usa para cargar los carritos del empleado.
    """
    flight = flights_db.get(flight_id)
    if not flight:
        raise HTTPException(status_code=404, detail="Flight not found")
    return flight.products


# -----------------------------
# 🧪 ENDPOINT EJEMPLO DE TEST
# -----------------------------
@app.get("/", summary="Estado del servidor")
def root():
    return {"status": "✅ SkySupply API running", "flights_loaded": len(flights_db)}


# -----------------------------
# 🧠 NOTAS FUTURAS
# -----------------------------
"""
📦 Próximos pasos (fase 2):
- Integrar sensores de peso:
    - Recibir actualizaciones (JSON o WebSocket)
    - Monitorear decrementos de peso y detectar completitud
    - Triggers para TTS mediante ElevenLabs API
- Agregar capa de persistencia real (SQLite o PostgreSQL)
- Integrar autenticación de usuarios (empleados)
- Crear endpoints para configuración de tiempo de alerta, etc.
"""

