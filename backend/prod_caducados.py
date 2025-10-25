'''CODIGO EN MAIN

hoy = datetime.today()
inventario = Inventario()

# Agregar productos (cada uno con su caducidad individual)
inventario.agregar_producto(Producto("A1", hoy + timedelta(days=3), 5))
inventario.agregar_producto(Producto("A2", hoy + timedelta(days=7), 8))
inventario.agregar_producto(Producto("A3", hoy + timedelta(days=20), 10))
inventario.agregar_producto(Producto("A4", hoy + timedelta(days=12), 6))

# Retirar productos automáticamente
inventario.retirar_producto(3)  # retira 3 del más próximo a caducar

# Rotación automática (solo reordena lista interna)
inventario.rotacion_automatica()

# Consultar estado por rango
estado = inventario.estado_inventario()
print(estado)

'''



from datetime import datetime, timedelta

class Producto:
    def __init__(self, codigo, caducidad, cantidad):
        self.codigo = codigo
        self.caducidad = caducidad  # datetime object
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
        """
        Retira la cantidad indicada del producto más próximo a caducar.
        Devuelve True si se pudo retirar, False si no hay stock.
        """
        # Filtrar productos con stock
        disponibles = [p for p in self.productos if p.cantidad > 0]
        if not disponibles:
            return False

        # Seleccionar el producto más próximo a caducar
        producto_a_retirar = min(disponibles, key=lambda p: p.caducidad)

        # Retirar cantidad
        if producto_a_retirar.cantidad >= cantidad:
            producto_a_retirar.cantidad -= cantidad
        else:
            # Si no hay suficiente, retirar lo que quede
            cantidad -= producto_a_retirar.cantidad
            producto_a_retirar.cantidad = 0
            return self.retirar_producto(cantidad)  # retirar la cantidad restante recursivamente

        return True

    def estado_inventario(self):
        """Devuelve un resumen por rango y cantidad total"""
        resumen = {"Corta": 0, "Proxima": 0, "Lejana": 0}
        for p in self.productos:
            rango = p.rango_caducidad()
            resumen[rango] += p.cantidad
        return resumen

    def rotacion_automatica(self):
        """
        Reordena la lista de productos de manera que los más próximos a caducar
        estén al frente, sin mover físicamente las estanterías.
        """
        self.productos.sort(key=lambda p: p.caducidad)
