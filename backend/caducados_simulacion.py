from datetime import datetime, timedelta
import random
import time

# ------------------- Clases -------------------
class Producto:
    def __init__(self, codigo, caducidad, cantidad):
        self.codigo = codigo
        self.caducidad = caducidad
        self.cantidad = cantidad

    def rango_caducidad(self, hoy=None):
        hoy = hoy or datetime.today()
        dias = (self.caducidad - hoy).days
        if dias < 5:
            return "Corta"
        elif dias < 15:
            return "Proxima"
        else:
            return "Lejana"

class Inventario:
    def __init__(self):
        self.productos = []

    def agregar_producto(self, producto):
        self.productos.append(producto)

    def retirar_producto(self, cantidad=1):
        # Filtrar productos con stock
        disponibles = [p for p in self.productos if p.cantidad > 0]
        if not disponibles:
            return False  # inventario vacío

        # Elegir el producto más próximo a caducar
        producto_a_retirar = min(disponibles, key=lambda p: p.caducidad)

        # Retirar cantidad
        if producto_a_retirar.cantidad >= cantidad:
            producto_a_retirar.cantidad -= cantidad
        else:
            cantidad -= producto_a_retirar.cantidad
            producto_a_retirar.cantidad = 0
            return self.retirar_producto(cantidad)  # retirar restante recursivamente

        return True

    def rotacion_automatica(self):
        """Reordena internamente los productos por caducidad (más próximo primero)."""
        self.productos.sort(key=lambda p: p.caducidad)

    def estado_inventario(self):
        """Devuelve un resumen por rango de caducidad."""
        resumen = {"Corta": 0, "Proxima": 0, "Lejana": 0}
        for p in self.productos:
            resumen[p.rango_caducidad()] += p.cantidad
        return resumen

# ------------------- Simulación -------------------

hoy = datetime.today()
inventario = Inventario()

# Crear productos simulados con caducidades aleatorias y cantidades aleatorias
codigos = ["A1", "A2", "A3", "B1", "B2", "C1", "C2"]
for codigo in codigos:
    dias_caducidad = random.randint(1, 25)  # entre 1 y 25 días
    cantidad = random.randint(3, 10)        # entre 3 y 10 unidades
    inventario.agregar_producto(Producto(codigo, hoy + timedelta(days=dias_caducidad), cantidad))

# Mostrar estado inicial
print("Estado inicial:")
for p in inventario.productos:
    print(f"{p.codigo}: caduca en {p.caducidad.date()} | cantidad {p.cantidad} | rango {p.rango_caducidad()}")

print("\n--- Simulación de retiros automáticos ---\n")
# Simulación de 15 retiros automáticos
for i in range(15):
    exito = inventario.retirar_producto(1)
    if not exito:
        print("Inventario vacío. Fin de simulación.")
        break
    inventario.rotacion_automatica()
    resumen = inventario.estado_inventario()
    print(f"Paso {i+1} - estado por rango: {resumen}")
    time.sleep(0.2)  # simula tiempo entre retiros
