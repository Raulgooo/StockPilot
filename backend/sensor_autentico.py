import time
from hx711 import HX711

class SistemaPesaje:
    def __init__(self, peso_unitario, cantidad_inicial, pin_dt=5, pin_sck=6):
        self.peso_unitario = peso_unitario
        self.cantidad_inicial = cantidad_inicial
        self.peso_inicial = peso_unitario * cantidad_inicial
        self.cooldown = False
        self.tiempo_cooldown = 7  # segundos

        # Inicializar el sensor HX711
        self.hx = HX711(dout_pin=pin_dt, pd_sck_pin=pin_sck)
        self.hx.reset()
        self.hx.tare()  # establece el peso base en cero

    def leer_sensor(self, muestras=10):
        """
        Lee el promedio de varias muestras del sensor HX711 para suavizar la señal.
        Devuelve el peso actual en kilogramos (ajusta el factor de escala según tu calibración).
        """
        # El valor crudo que devuelve HX711 depende de la calibración
        # El 'factor' debe obtenerse empíricamente pesando algo conocido
        factor_calibracion = 420.0  # ejemplo
        valor_medio = self.hx.get_weight_mean(muestras)
        peso_kg = valor_medio / factor_calibracion
        return peso_kg

    def verificar_retiro(self, cantidad_retirada_esperada):
        """
        Retorna:
          1 -> éxito (cantidad correcta)
          0 -> en cooldown
         -1 -> error (cantidad incorrecta)
        """
        if self.cooldown:
            return 0

        peso_actual = self.leer_sensor()
        peso_retirado = self.peso_inicial - peso_actual
        articulos_retirados = peso_retirado / self.peso_unitario

        if abs(articulos_retirados - cantidad_retirada_esperada) < 0.2:
            return 1  # éxito
        else:
            self.cooldown = True
            time.sleep(self.tiempo_cooldown)
            self.cooldown = False
            return -1  # error
