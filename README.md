# StockPilot 🛩️

Sistema de gestión de catering para vuelos de aerolíneas.

## 🚀 Descripción

StockPilot es una aplicación backend desarrollada con FastAPI que permite gestionar vuelos y sus productos de catering. El sistema está diseñado para optimizar el proceso de preparación de vuelos con productos específicos.

## ✨ Características

- **Gestión de Vuelos**: Carga y consulta de vuelos con sus productos
- **API REST**: Endpoints para subir datasets y consultar información
- **Modelos Pydantic**: Validación de datos robusta
- **Base de Datos en Memoria**: Para desarrollo rápido y testing

## 🛠️ Tecnologías

- **FastAPI**: Framework web moderno y rápido
- **Pydantic**: Validación de datos
- **Uvicorn**: Servidor ASGI
- **Python 3.8+**: Lenguaje de programación

## 📦 Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/StockPilot.git
cd StockPilot
```

### 2. Crear entorno virtual
```bash
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
```

### 3. Instalar dependencias
```bash
pip install -r requirements.txt
```

### 4. Ejecutar la aplicación
```bash
uvicorn backend.main:app --reload
```

La API estará disponible en: `http://localhost:8000`
Documentación interactiva: `http://localhost:8000/docs`

## 📋 Endpoints

### Principales
- `POST /flights/upload` - Subir dataset de vuelos
- `GET /flights` - Obtener todos los vuelos
- `GET /flights/{flight_id}` - Obtener vuelo específico
- `GET /flights/{flight_id}/products` - Obtener productos de un vuelo

### Utilidad
- `GET /` - Estado del servidor

## 🔧 Uso

### Subir vuelos
```bash
curl -X POST "http://localhost:8000/flights/upload" \
     -H "Content-Type: application/json" \
     -d '[
       {
         "flight_number": "AA123",
         "origin": "MEX",
         "destination": "LAX",
         "departure_time": "2024-01-15T10:30:00",
         "products": [
           {"name": "Coca Cola", "category": "Bebidas", "quantity": 50},
           {"name": "Sandwich", "category": "Comida", "quantity": 30}
         ]
       }
     ]'
```

### Consultar vuelos
```bash
curl "http://localhost:8000/flights"
```

## 🚧 Próximas Características

- [ ] Integración con sensores de peso
- [ ] WebSocket para actualizaciones en tiempo real
- [ ] Integración con ElevenLabs TTS
- [ ] Base de datos persistente (SQLite/PostgreSQL)
- [ ] Autenticación de usuarios
- [ ] Sistema de alertas configurable

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 👨‍💻 Autor

Desarrollado para hackathon 2025
