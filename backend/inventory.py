import sqlite3
import json
import uuid
import qrcode
from datetime import datetime, timedelta
import os

DB_PATH = "inventory.db"


# ---------- DB SETUP ----------
def init_db():
    """Inicializa la base de datos de inventario si no existe."""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS inventory (
            lot_id TEXT,
            id_individual TEXT PRIMARY KEY,
            caducidad TEXT
        )
    """)
    conn.commit()
    conn.close()


# ---------- UTILIDADES ----------
def generate_qr(data: dict, filename: str):
    """Genera un código QR con la información del lote."""
    qr = qrcode.make(json.dumps(data, indent=2))
    qr.save(filename)
    print(f"✅ QR guardado en: {filename}")


def generate_individual_id():
    """Genera un ID único corto para un producto individual."""
    return str(uuid.uuid4())[:8]


# ---------- FUNCIONES CRD ----------

def C_lote(lot_id: str, cantidad: int, dias_caducidad: int):
    """
    Crea un lote con productos individuales y genera un QR con su información.
    Args:
        lot_id: ID del lote (ingresado por el usuario)
        cantidad: número de productos en el lote
        dias_caducidad: días hasta la fecha de caducidad
    """
    init_db()

    fecha_cad = (datetime.now() + timedelta(days=dias_caducidad)).date().isoformat()

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    productos = []
    for _ in range(cantidad):
        id_individual = generate_individual_id()
        cur.execute(
            "INSERT INTO inventory (lot_id, id_individual, caducidad) VALUES (?, ?, ?)",
            (lot_id, id_individual, fecha_cad)
        )
        productos.append({
            "id_individual": id_individual,
            "caducidad": fecha_cad
        })

    conn.commit()
    conn.close()

    lote_data = {
        "lot_id": lot_id,
        "cantidad": cantidad,
        "productos": productos
    }

    # Generar QR con información del lote
    qr_filename = f"QR_{lot_id}.png"
    generate_qr(lote_data, qr_filename)

    return lote_data


def R_lote(lot_id: str):
    """
    Devuelve la información del lote en formato JSON.
    Args:
        lot_id: ID del lote a consultar
    Returns:
        dict con la información del lote o None si no existe
    """
    init_db()
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT * FROM inventory WHERE lot_id = ?", (lot_id,))
    rows = cur.fetchall()
    conn.close()

    if not rows:
        return None

    productos = [
        {"id_individual": r[1], "caducidad": r[2]}
        for r in rows
    ]
    lote_data = {
        "lot_id": lot_id,
        "cantidad": len(productos),
        "productos": sorted(productos, key=lambda x: x["id_individual"])
    }
    return lote_data


def D_lote(identifier: str):
    """
    Elimina un lote completo o un producto individual.
    Args:
        identifier: puede ser un 'lot_id' o un 'id_individual'
    Returns:
        inventario actualizado (lista de dicts)
    """
    init_db()
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Verificar si es un lote
    cur.execute("SELECT COUNT(*) FROM inventory WHERE lot_id = ?", (identifier,))
    count_lot = cur.fetchone()[0]

    if count_lot > 0:
        # Borrar lote completo
        cur.execute("DELETE FROM inventory WHERE lot_id = ?", (identifier,))
        print(f"🗑️ Lote '{identifier}' eliminado completamente.")
    else:
        # Intentar eliminar producto individual
        cur.execute("DELETE FROM inventory WHERE id_individual = ?", (identifier,))
        if cur.rowcount == 0:
            print(f"❌ No se encontró '{identifier}' en la base de datos.")
            conn.close()
            return []
        print(f"🗑️ Producto individual '{identifier}' eliminado.")

    conn.commit()

    # Devolver inventario actualizado
    cur.execute("SELECT * FROM inventory")
    rows = cur.fetchall()
    conn.close()

    inventario = [
        {"lot_id": r[0], "id_individual": r[1], "caducidad": r[2]}
        for r in rows
    ]
    return inventario
