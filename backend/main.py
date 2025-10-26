from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import sqlite3
import csv
import os
import time
import threading
from inventory import C_lote, R_lote, D_lote, init_db as init_inventory_db


# ---------- CONFIG ----------
DB_PATH = "flights.db"
CSV_PATH = "flights_data.csv"
SUPPLIER_CSV_PATH = "supplier_products.csv"
ORDERS_DB_PATH = "orders.db"

# ---------- APP ----------
app = FastAPI(title="Catering Logistics API", version="0.3")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)


# ---------- PYDANTIC MODELS ----------
class CreateLotRequest(BaseModel):
    lot_id: str
    cantidad: int
    dias_caducidad: int
    product_name: str = "Producto"

class ProductResponse(BaseModel):
    id_individual: str
    caducidad: str
    product_name: str

class LotResponse(BaseModel):
    lot_id: str
    cantidad: int
    product_name: str
    productos: List[ProductResponse]

class InventoryItem(BaseModel):
    lot_id: str
    id_individual: str
    caducidad: str
    product_name: str

class SupplierProduct(BaseModel):
    product_name: str
    weight_kg: float
    price_per_unit: float
    delivery_time_days: int
    min_order_quantity: int
    description: str

class OrderRequest(BaseModel):
    product_name: str
    quantity: int  # Must be multiple of 50

class OrderResponse(BaseModel):
    order_id: str
    product_name: str
    quantity: int
    status: str
    order_date: str
    expected_delivery: str
    lot_id: str = None
    qr_code: str = None

class SimulationSettings(BaseModel):
    delivery_time_multiplier: float = 1.0  # Multiplier for delivery times
    auto_place_orders: bool = True  # Auto-place orders when received

# ---------- MODELS ----------
class Product:
    """Represents a single product item for a flight"""
    def __init__(self, flight_number: str, product_name: str, category_quantity: int, weight_kg: float):
        self.flight_number = flight_number
        self.product_name = product_name
        self.category_quantity = category_quantity
        self.weight_kg = weight_kg

    def to_dict(self):
        return {
            "flight_number": self.flight_number,
            "product_name": self.product_name,
            "category_quantity": self.category_quantity,
            "weight_kg": self.weight_kg
        }

class Products:
    """Collection of Product objects"""
    def __init__(self, items=None):
        self.items = items or []

    def add(self, product: Product):
        self.items.append(product)

    def filter_by_flight(self, flight_number: str):
        filtered = [p for p in self.items if p.flight_number == flight_number]
        return Products(filtered)

    def to_dict_list(self):
        return [p.to_dict() for p in self.items]


# ---------- DB UTILS ----------
def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("""
        CREATE TABLE IF NOT EXISTS flights (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            flight_number TEXT,
            origin TEXT,
            destination TEXT,
            departure_time TEXT
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            flight_number TEXT,
            product_name TEXT,
            category_quantity INTEGER,
            weight_kg REAL,
            FOREIGN KEY (flight_number) REFERENCES flights(flight_number)
        )
    """)
    conn.commit()
    conn.close()


def load_csv():
    """Reads CSV and loads it into SQLite database"""
    if not os.path.exists(CSV_PATH):
        print(f"❌ CSV file not found at {CSV_PATH}")
        return
    
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("DELETE FROM flights")
    cur.execute("DELETE FROM products")

    with open(CSV_PATH, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            flight_number = row["flight_number"]
            origin = row["origin"]
            destination = row["destination"]
            departure_time = row["departure_time"]
            product_name = row["product_name"]
            category_quantity = int(row["category_quantity"])
            weight_kg = float(row["weight_kg"])

            # Insert flight if not exists
            cur.execute("SELECT 1 FROM flights WHERE flight_number = ?", (flight_number,))
            if cur.fetchone() is None:
                cur.execute("""
                    INSERT INTO flights (flight_number, origin, destination, departure_time)
                    VALUES (?, ?, ?, ?)
                """, (flight_number, origin, destination, departure_time))

            # Insert product
            cur.execute("""
                INSERT INTO products (flight_number, product_name, category_quantity, weight_kg)
                VALUES (?, ?, ?, ?)
            """, (flight_number, product_name, category_quantity, weight_kg))

    conn.commit()
    conn.close()
    print("✅ CSV successfully loaded into SQLite database.")


# ---------- ROUTES ----------
@app.on_event("startup")
def startup():
    init_db()
    init_inventory_db()  # Initialize inventory database
    init_orders_db()  # Initialize orders database
    load_supplier_products()  # Load supplier products
    load_csv()


@app.get("/")
def root():
    return {"status": "ok", "message": "Catering Logistics API running."}


@app.get("/flights")
def get_flights():
    conn = get_db_connection()
    flights = conn.execute("SELECT * FROM flights").fetchall()
    conn.close()
    return [dict(f) for f in flights]


@app.get("/flights/{flight_number}")
def get_flight_products(flight_number: str):
    conn = get_db_connection()
    rows = conn.execute(
        "SELECT flight_number, product_name, category_quantity, weight_kg FROM products WHERE flight_number = ?",
        (flight_number,)
    ).fetchall()
    conn.close()

    if not rows:
        raise HTTPException(status_code=404, detail="No products found for this flight")

    products = Products([
        Product(r["flight_number"], r["product_name"], r["category_quantity"], r["weight_kg"])
        for r in rows
    ])

    return products.to_dict_list()

TRIGGER_TIMEOUT = 5  # segundos después del último cambio de peso
SENSOR_POLL_INTERVAL = 1  # cada cuánto actualizamos el estado (segundos)


class Sensor:
    def __init__(self, product: Product):
        self.product = product
        self.expected_weight = product.weight_kg * product.category_quantity
        self.current_weight = self.expected_weight
        self.weight_unit = product.weight_kg
        self.units_remaining = product.category_quantity
        self.last_change_time = time.time()
        self.color = "white"
        self.active = False

    def activate(self):
        self.active = True
        self.color = "green"
        self.last_change_time = time.time()

    def deactivate(self):
        self.active = False
        self.color = "white"

    def _check_stability(self):
        """Valida si el peso actual es múltiplo del unitario"""
        diff = self.expected_weight - self.current_weight
        # margen de error flotante pequeño
        if abs(diff) < 0.05:
            return True
        # dentro de múltiplos de peso_unitario
        return abs(diff / self.weight_unit - round(diff / self.weight_unit)) < 0.1

    def take_one(self):
        """Simula que el usuario quita una unidad"""
        if self.units_remaining <= 0:
            self.color = "red"
            return False
        self.units_remaining -= 1
        self.current_weight -= self.weight_unit
        self.last_change_time = time.time()
        self.color = "green" if self._check_stability() else "red"
        return True

    def put_one(self):
        """Simula que el usuario devuelve una unidad"""
        self.units_remaining += 1
        self.current_weight += self.weight_unit
        self.last_change_time = time.time()
        self.color = "green" if self._check_stability() else "red"
        return True

    def check_timeout(self):
        if not self.active:
            return
        elapsed = time.time() - self.last_change_time
        if elapsed > TRIGGER_TIMEOUT and not self._check_stability():
            self.color = "red"


class SensorController:
    def __init__(self):
        self.sensors = {}
        self.running = False
        self._thread = None
        self.basket = {}

    def start_run(self, products: list[Product]):
        self.sensors = {p.product_name: Sensor(p) for p in products}
        self.basket = {p.product_name: 0 for p in products}
        for s in self.sensors.values():
            s.activate()
        self.running = True
        self._thread = threading.Thread(target=self._monitor_loop, daemon=True)
        self._thread.start()

    def _monitor_loop(self):
        while self.running:
            for s in self.sensors.values():
                s.check_timeout()
            time.sleep(SENSOR_POLL_INTERVAL)

    def stop(self):
        self.running = False
        for s in self.sensors.values():
            s.deactivate()

    def take_one(self, product_name: str):
        if product_name not in self.sensors:
            raise KeyError("Sensor not found for product")
        sensor = self.sensors[product_name]
        ok = sensor.take_one()
        if ok:
            self.basket[product_name] += 1
        return ok

    def put_one(self, product_name: str):
        if product_name not in self.sensors:
            raise KeyError("Sensor not found for product")
        sensor = self.sensors[product_name]
        ok = sensor.put_one()
        if ok and self.basket[product_name] > 0:
            self.basket[product_name] -= 1
        return ok

    def get_status(self):
        return {
            "sensors": {
                name: {
                    "color": s.color,
                    "current_weight": round(s.current_weight, 2),
                    "expected_weight": s.expected_weight,
                    "units_remaining": s.units_remaining,
                    "active": s.active
                }
                for name, s in self.sensors.items()
            },
            "basket": self.basket
        }


# instancia global
sensor_controller = SensorController()

# Global simulation settings
simulation_settings = SimulationSettings()

# Supplier products cache
supplier_products = []

# ---------- UTILITY FUNCTIONS ----------
def load_supplier_products():
    """Load supplier products from CSV"""
    global supplier_products
    try:
        with open(SUPPLIER_CSV_PATH, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            supplier_products = [SupplierProduct(**row) for row in reader]
    except FileNotFoundError:
        supplier_products = []

def init_orders_db():
    """Initialize orders database"""
    conn = sqlite3.connect(ORDERS_DB_PATH)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            order_id TEXT PRIMARY KEY,
            product_name TEXT,
            quantity INTEGER,
            status TEXT,
            order_date TEXT,
            expected_delivery TEXT,
            actual_delivery TEXT,
            lot_id TEXT,
            qr_code TEXT
        )
    """)
    conn.commit()
    conn.close()

def generate_order_id():
    """Generate unique order ID"""
    return f"ORD_{int(time.time())}_{hash(time.time()) % 10000:04d}"

# ---------- INVENTORY ROUTES ----------
@app.post("/inventory/lots", response_model=LotResponse)
def create_lot(request: CreateLotRequest):
    """Crear un nuevo lote con productos individuales"""
    try:
        lot_data = C_lote(request.lot_id, request.cantidad, request.dias_caducidad, request.product_name)
        return LotResponse(
            lot_id=lot_data["lot_id"],
            cantidad=lot_data["cantidad"],
            product_name=lot_data["product_name"],
            productos=[ProductResponse(**product) for product in lot_data["productos"]]
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error creating lot: {str(e)}")

@app.get("/inventory/lots/{lot_id}", response_model=LotResponse)
def get_lot(lot_id: str):
    """Obtener información de un lote específico"""
    lot_data = R_lote(lot_id)
    if not lot_data:
        raise HTTPException(status_code=404, detail="Lot not found")
    
    return LotResponse(
        lot_id=lot_data["lot_id"],
        cantidad=lot_data["cantidad"],
        product_name=lot_data["product_name"],
        productos=[ProductResponse(**product) for product in lot_data["productos"]]
    )

@app.delete("/inventory/lots/{identifier}")
def delete_lot_or_product(identifier: str):
    """Eliminar un lote completo o un producto individual"""
    try:
        inventory = D_lote(identifier)
        return {
            "status": "success",
            "message": f"Deleted {identifier}",
            "remaining_inventory": len(inventory)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error deleting: {str(e)}")

@app.get("/inventory", response_model=List[InventoryItem])
def get_full_inventory():
    """Obtener el inventario completo"""
    try:
        init_inventory_db()
        conn = sqlite3.connect("inventory.db")
        cur = conn.cursor()
        cur.execute("SELECT lot_id, id_individual, caducidad, product_name FROM inventory ORDER BY product_name, lot_id, id_individual")
        rows = cur.fetchall()
        conn.close()
        
        return [InventoryItem(lot_id=r[0], id_individual=r[1], caducidad=r[2], product_name=r[3]) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving inventory: {str(e)}")

@app.get("/inventory/by-product")
def get_inventory_by_product():
    """Obtener inventario agrupado por producto"""
    try:
        init_inventory_db()
        conn = sqlite3.connect("inventory.db")
        cur = conn.cursor()
        
        # Obtener inventario agrupado por producto
        cur.execute("""
            SELECT 
                product_name,
                lot_id,
                COUNT(*) as cantidad,
                MIN(caducidad) as fecha_caducidad_mas_temprana,
                GROUP_CONCAT(id_individual) as ids_individuales
            FROM inventory 
            GROUP BY product_name, lot_id 
            ORDER BY product_name, lot_id
        """)
        rows = cur.fetchall()
        conn.close()
        
        # Agrupar por producto
        products = {}
        for row in rows:
            product_name = row[0]
            lot_id = row[1]
            cantidad = row[2]
            fecha_caducidad = row[3]
            ids_individuales = row[4].split(',')
            
            if product_name not in products:
                products[product_name] = {
                    "product_name": product_name,
                    "total_quantity": 0,
                    "lots": []
                }
            
            products[product_name]["lots"].append({
                "lot_id": lot_id,
                "cantidad": cantidad,
                "fecha_caducidad_mas_temprana": fecha_caducidad,
                "ids_individuales": ids_individuales
            })
            products[product_name]["total_quantity"] += cantidad
        
        return list(products.values())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving inventory by product: {str(e)}")

@app.get("/inventory/summary")
def get_inventory_summary():
    """Obtener un resumen del inventario por lotes"""
    try:
        init_inventory_db()
        conn = sqlite3.connect("inventory.db")
        cur = conn.cursor()
        
        # Obtener resumen por lotes
        cur.execute("""
            SELECT lot_id, COUNT(*) as cantidad, MIN(caducidad) as fecha_caducidad_mas_temprana
            FROM inventory 
            GROUP BY lot_id 
            ORDER BY lot_id
        """)
        lot_summary = cur.fetchall()
        
        # Obtener total de productos
        cur.execute("SELECT COUNT(*) FROM inventory")
        total_products = cur.fetchone()[0]
        
        # Obtener total de lotes únicos
        cur.execute("SELECT COUNT(DISTINCT lot_id) FROM inventory")
        total_lots = cur.fetchone()[0]
        
        conn.close()
        
        return {
            "total_products": total_products,
            "total_lots": total_lots,
            "lots": [
                {
                    "lot_id": lot[0],
                    "cantidad": lot[1],
                    "fecha_caducidad_mas_temprana": lot[2]
                }
                for lot in lot_summary
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving inventory summary: {str(e)}")

# ---------- SENSOR ROUTES ----------
@app.post("/run/start/{flight_number}")
def start_run(flight_number: str):
    """Inicializa sensores para un vuelo"""
    conn = get_db_connection()
    rows = conn.execute(
        "SELECT flight_number, product_name, category_quantity, weight_kg FROM products WHERE flight_number = ?",
        (flight_number,)
    ).fetchall()
    conn.close()

    if not rows:
        raise HTTPException(status_code=404, detail="No products found for this flight")

    products = [Product(r["flight_number"], r["product_name"], r["category_quantity"], r["weight_kg"]) for r in rows]
    sensor_controller.start_run(products)
    return {"status": "ok", "message": f"Run started for flight {flight_number}"}


@app.post("/run/take_one/{product_name}")
def take_one(product_name: str):
    """El usuario toma una unidad del producto"""
    try:
        ok = sensor_controller.take_one(product_name)
        if not ok:
            raise HTTPException(status_code=400, detail="No more units available.")
        
        # Subtract from inventory when taking a product
        try:
            init_inventory_db()
            conn = sqlite3.connect("inventory.db")
            cur = conn.cursor()
            
            # Find the first available item of this product
            cur.execute(
                "SELECT id_individual FROM inventory WHERE product_name = ? ORDER BY caducidad ASC LIMIT 1",
                (product_name,)
            )
            result = cur.fetchone()
            
            if result:
                # Remove the item from inventory
                cur.execute(
                    "DELETE FROM inventory WHERE id_individual = ?",
                    (result[0],)
                )
                conn.commit()
                conn.close()
                return {"status": "ok", "message": f"Taken one {product_name} from inventory"}
            else:
                conn.close()
                return {"status": "ok", "message": f"Taken one {product_name} (no inventory item found)"}
        except Exception as e:
            # If inventory update fails, still return success for the sensor
            return {"status": "ok", "message": f"Taken one {product_name} (inventory update failed: {str(e)})"}
            
    except KeyError:
        raise HTTPException(status_code=404, detail="Sensor not found")


@app.post("/run/put_one/{product_name}")
def put_one(product_name: str):
    """El usuario devuelve una unidad del producto"""
    try:
        ok = sensor_controller.put_one(product_name)
        return {"status": "ok", "message": f"Put one {product_name}"}
    except KeyError:
        raise HTTPException(status_code=404, detail="Sensor not found")


@app.get("/run/status")
def get_run_status():
    """Devuelve el estado actual de sensores y basket"""
    return sensor_controller.get_status()


@app.get("/runs/stats")
def get_runs_stats():
    """Obtener estadísticas de runs completados"""
    try:
        # Por ahora retornamos datos mockup, pero esto se puede conectar a una base de datos real
        # donde se guarden los runs completados
        return {
            "completed_today": 18,
            "efficiency": 96,
            "total_runs_this_week": 45,
            "average_time_per_run": 12.5
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving runs stats: {str(e)}")

# ---------- SUPPLIER ROUTES ----------
@app.get("/supplier/products")
def get_supplier_products():
    """Get available supplier products"""
    return supplier_products

@app.post("/supplier/orders", response_model=OrderResponse)
def create_order(request: OrderRequest):
    """Create a new supplier order"""
    try:
        # Validate quantity is multiple of 50
        if request.quantity % 50 != 0:
            raise HTTPException(status_code=400, detail="Quantity must be multiple of 50")
        
        # Find supplier product
        supplier_product = next((p for p in supplier_products if p.product_name == request.product_name), None)
        if not supplier_product:
            raise HTTPException(status_code=404, detail="Product not found in supplier catalog")
        
        # Check minimum order quantity
        if request.quantity < supplier_product.min_order_quantity:
            raise HTTPException(status_code=400, detail=f"Minimum order quantity is {supplier_product.min_order_quantity}")
        
        # Create order
        order_id = generate_order_id()
        order_date = datetime.now().isoformat()
        delivery_days = int(supplier_product.delivery_time_days * simulation_settings.delivery_time_multiplier)
        expected_delivery = (datetime.now() + timedelta(days=delivery_days)).isoformat()
        
        # Save to database
        conn = sqlite3.connect(ORDERS_DB_PATH)
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO orders (order_id, product_name, quantity, status, order_date, expected_delivery)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (order_id, request.product_name, request.quantity, "in_delivery", order_date, expected_delivery))
        conn.commit()
        conn.close()
        
        return OrderResponse(
            order_id=order_id,
            product_name=request.product_name,
            quantity=request.quantity,
            status="in_delivery",
            order_date=order_date,
            expected_delivery=expected_delivery
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating order: {str(e)}")

@app.get("/supplier/orders")
def get_orders():
    """Get all orders"""
    try:
        conn = sqlite3.connect(ORDERS_DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT * FROM orders ORDER BY order_date DESC")
        rows = cur.fetchall()
        conn.close()
        
        orders = []
        for row in rows:
            orders.append({
                "order_id": row[0],
                "product_name": row[1],
                "quantity": row[2],
                "status": row[3],
                "order_date": row[4],
                "expected_delivery": row[5],
                "actual_delivery": row[6],
                "lot_id": row[7],
                "qr_code": row[8]
            })
        
        return orders
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving orders: {str(e)}")

@app.post("/supplier/orders/{order_id}/receive")
def receive_order(order_id: str):
    """Mark order as received and generate lot"""
    try:
        conn = sqlite3.connect(ORDERS_DB_PATH)
        cur = conn.cursor()
        
        # Get order details
        cur.execute("SELECT * FROM orders WHERE order_id = ?", (order_id,))
        order = cur.fetchone()
        if not order:
            conn.close()
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Update order status
        actual_delivery = datetime.now().isoformat()
        lot_id = f"LOT_{order_id}_{int(time.time())}"
        
        cur.execute("""
            UPDATE orders 
            SET status = ?, actual_delivery = ?, lot_id = ?
            WHERE order_id = ?
        """, ("received", actual_delivery, lot_id, order_id))
        
        conn.commit()
        conn.close()
        
        # Generate QR code for the lot
        from inventory import generate_qr
        lot_data = {
            "lot_id": lot_id,
            "cantidad": order[2],  # quantity
            "product_name": order[1],  # product_name
            "productos": []  # Will be populated when placed
        }
        qr_filename = f"QR_{lot_id}.png"
        generate_qr(lot_data, qr_filename)
        
        return {"status": "ok", "message": f"Order {order_id} received", "lot_id": lot_id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error receiving order: {str(e)}")

@app.post("/supplier/orders/{order_id}/place")
def place_order(order_id: str):
    """Place order in intelligent shelves (add to inventory)"""
    try:
        conn = sqlite3.connect(ORDERS_DB_PATH)
        cur = conn.cursor()
        
        # Get order details
        cur.execute("SELECT * FROM orders WHERE order_id = ?", (order_id,))
        order = cur.fetchone()
        if not order:
            conn.close()
            raise HTTPException(status_code=404, detail="Order not found")
        
        if order[3] != "received":  # status
            conn.close()
            raise HTTPException(status_code=400, detail="Order must be received before placing")
        
        # Create lot in inventory
        from inventory import C_lote
        lot_data = C_lote(
            lot_id=order[7],  # lot_id
            cantidad=order[2],  # quantity
            dias_caducidad=30,  # Default 30 days
            product_name=order[1]  # product_name
        )
        
        # Update order status
        cur.execute("UPDATE orders SET status = ? WHERE order_id = ?", ("available", order_id))
        conn.commit()
        conn.close()
        
        return {"status": "ok", "message": f"Order {order_id} placed in inventory", "lot_data": lot_data}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error placing order: {str(e)}")

@app.delete("/supplier/orders/{order_id}")
def delete_order(order_id: str):
    """Delete completed order"""
    try:
        conn = sqlite3.connect(ORDERS_DB_PATH)
        cur = conn.cursor()
        
        # Check if order exists and is available
        cur.execute("SELECT status FROM orders WHERE order_id = ?", (order_id,))
        result = cur.fetchone()
        if not result:
            conn.close()
            raise HTTPException(status_code=404, detail="Order not found")
        
        if result[0] != "available":
            conn.close()
            raise HTTPException(status_code=400, detail="Can only delete available orders")
        
        # Delete order
        cur.execute("DELETE FROM orders WHERE order_id = ?", (order_id,))
        conn.commit()
        conn.close()
        
        return {"status": "ok", "message": f"Order {order_id} deleted"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting order: {str(e)}")

# ---------- SIMULATION SETTINGS ROUTES ----------
@app.get("/simulation/settings")
def get_simulation_settings():
    """Get current simulation settings"""
    return simulation_settings

@app.post("/simulation/settings")
def update_simulation_settings(settings: SimulationSettings):
    """Update simulation settings"""
    global simulation_settings
    simulation_settings = settings
    return {"status": "ok", "message": "Settings updated", "settings": simulation_settings}

