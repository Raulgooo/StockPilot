# 📦 Endpoints de Inventario - StockPilot

He creado los endpoints CRUD para los lotes basados en tu `inventory.py`. Aquí está la documentación completa:

## 🚀 Nuevos Endpoints

### 1. **Crear Lote** - `POST /inventory/lots`
Crea un nuevo lote con productos individuales y genera un código QR.

**Request Body:**
```json
{
  "lot_id": "LOTE001",
  "cantidad": 5,
  "dias_caducidad": 30
}
```

**Response:**
```json
{
  "lot_id": "LOTE001",
  "cantidad": 5,
  "productos": [
    {
      "id_individual": "69fd4d81",
      "caducidad": "2025-11-24"
    },
    {
      "id_individual": "598cff47", 
      "caducidad": "2025-11-24"
    }
  ]
}
```

### 2. **Consultar Lote** - `GET /inventory/lots/{lot_id}`
Obtiene información detallada de un lote específico.

**Response:**
```json
{
  "lot_id": "LOTE001",
  "cantidad": 5,
  "productos": [
    {
      "id_individual": "69fd4d81",
      "caducidad": "2025-11-24"
    }
  ]
}
```

### 3. **Eliminar Lote/Producto** - `DELETE /inventory/lots/{identifier}`
Elimina un lote completo o un producto individual.

**Response:**
```json
{
  "status": "success",
  "message": "Deleted LOTE001",
  "remaining_inventory": 4
}
```

### 4. **Inventario Completo** - `GET /inventory`
Obtiene todos los productos del inventario.

**Response:**
```json
[
  {
    "lot_id": "LOTE001",
    "id_individual": "69fd4d81",
    "caducidad": "2025-11-24"
  },
  {
    "lot_id": "LOTE001", 
    "id_individual": "598cff47",
    "caducidad": "2025-11-24"
  }
]
```

### 5. **Resumen de Inventario** - `GET /inventory/summary`
Obtiene un resumen estadístico del inventario.

**Response:**
```json
{
  "total_products": 8,
  "total_lots": 2,
  "lots": [
    {
      "lot_id": "LOTE001",
      "cantidad": 5,
      "fecha_caducidad_mas_temprana": "2025-11-24"
    },
    {
      "lot_id": "LOTE002",
      "cantidad": 3,
      "fecha_caducidad_mas_temprana": "2025-11-09"
    }
  ]
}
```

## 🧪 Pruebas Realizadas

✅ **Crear lotes**: Funciona correctamente
✅ **Consultar lotes**: Retorna información detallada
✅ **Eliminar productos individuales**: Funciona
✅ **Eliminar lotes completos**: Funciona
✅ **Inventario completo**: Lista todos los productos
✅ **Resumen estadístico**: Muestra estadísticas por lotes

## 🔧 Características Implementadas

### **Funcionalidades CRUD:**
- ✅ **Create**: Crear lotes con productos individuales
- ✅ **Read**: Consultar lotes específicos y inventario completo
- ✅ **Delete**: Eliminar lotes completos o productos individuales

### **Funcionalidades Adicionales:**
- ✅ **Generación de QR**: Cada lote genera un código QR automáticamente
- ✅ **IDs únicos**: Cada producto tiene un ID individual único
- ✅ **Fechas de caducidad**: Calculadas automáticamente
- ✅ **Resumen estadístico**: Estadísticas por lotes y totales
- ✅ **Validación de errores**: Manejo de errores con HTTP status codes

### **Base de Datos:**
- ✅ **SQLite**: Base de datos `inventory.db` separada
- ✅ **Tabla inventory**: `lot_id`, `id_individual`, `caducidad`
- ✅ **Inicialización automática**: Se crea automáticamente al iniciar

## 🚀 Cómo Usar

### **1. Crear un lote:**
```bash
curl -X POST "http://localhost:8000/inventory/lots" \
  -H "Content-Type: application/json" \
  -d '{
    "lot_id": "LOTE001",
    "cantidad": 10,
    "dias_caducidad": 30
  }'
```

### **2. Consultar inventario completo:**
```bash
curl "http://localhost:8000/inventory"
```

### **3. Obtener resumen:**
```bash
curl "http://localhost:8000/inventory/summary"
```

### **4. Eliminar un lote:**
```bash
curl -X DELETE "http://localhost:8000/inventory/lots/LOTE001"
```

## 📊 Integración con Frontend

Los endpoints están listos para ser integrados con tu frontend React. Puedes usar los mismos servicios que ya tienes:

```javascript
// En tu flights.js o crear un nuevo inventory.js
export async function createLot(lotId, cantidad, diasCaducidad) {
  return await api.post("/inventory/lots", {
    lot_id: lotId,
    cantidad: cantidad,
    dias_caducidad: diasCaducidad
  });
}

export async function getInventory() {
  return await api.get("/inventory");
}

export async function getInventorySummary() {
  return await api.get("/inventory/summary");
}
```

## 🎯 Próximos Pasos

1. **Integrar con frontend**: Crear componentes para gestión de inventario
2. **Dashboard de inventario**: Mostrar estadísticas en tiempo real
3. **Alertas de caducidad**: Notificar productos próximos a caducar
4. **Códigos QR**: Mostrar/descargar códigos QR generados
5. **Reportes**: Generar reportes de inventario por fechas

¡Los endpoints están funcionando perfectamente y listos para usar! 🎉
