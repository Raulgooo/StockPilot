import time

lecturas = [4.8, 4.5, 3.9, 5.0, 4.7]  # pesos en kg

class SistemaPesajeSimulado:
    def __init__(self, peso_unitario, cantidad_inicial, lecturas):
        self.peso_unitario = peso_unitario
        self.cantidad_inicial = cantidad_inicial
        self.peso_inicial = peso_unitario * cantidad_inicial
        self.lecturas = iter(lecturas)
        self.cooldown = False
        self.tiempo_cooldown = 7

    def leer_sensor(self):
        try:
            return next(self.lecturas)
        except StopIteration:
            return self.peso_inicial

    def verificar_retiro(self, cantidad_retirada_esperada):
        if self.cooldown:
            return 0
        peso_actual = self.leer_sensor()
        peso_retirado = self.peso_inicial - peso_actual
        articulos_retirados = peso_retirado / self.peso_unitario
        if abs(articulos_retirados - cantidad_retirada_esperada) < 0.2:
            return 1
        else:
            self.cooldown = True
            time.sleep(self.tiempo_cooldown)
            self.cooldown = False
            return -1

# Ejemplo
sistema = SistemaPesajeSimulado(0.5, 10, lecturas)
while True:
    print(sistema.verificar_retiro(3))
