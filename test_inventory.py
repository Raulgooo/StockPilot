#!/usr/bin/env python3
"""
Script de prueba para los endpoints de inventario
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

def test_inventory_endpoints():
    print("🧪 Probando endpoints de inventario...")
    
    # 1. Crear un lote
    print("\n1. Creando lote 'LOTE001' con 5 productos...")
    create_data = {
        "lot_id": "LOTE001",
        "cantidad": 5,
        "dias_caducidad": 30
    }
    
    try:
        response = requests.post(f"{BASE_URL}/inventory/lots", json=create_data)
        if response.status_code == 200:
            lot_data = response.json()
            print(f"✅ Lote creado: {lot_data['lot_id']} con {lot_data['cantidad']} productos")
            print(f"   Productos: {[p['id_individual'] for p in lot_data['productos']]}")
        else:
            print(f"❌ Error creando lote: {response.text}")
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return
    
    # 2. Crear otro lote
    print("\n2. Creando lote 'LOTE002' con 3 productos...")
    create_data2 = {
        "lot_id": "LOTE002",
        "cantidad": 3,
        "dias_caducidad": 15
    }
    
    response = requests.post(f"{BASE_URL}/inventory/lots", json=create_data2)
    if response.status_code == 200:
        lot_data2 = response.json()
        print(f"✅ Lote creado: {lot_data2['lot_id']} con {lot_data2['cantidad']} productos")
    
    # 3. Consultar un lote específico
    print("\n3. Consultando lote 'LOTE001'...")
    response = requests.get(f"{BASE_URL}/inventory/lots/LOTE001")
    if response.status_code == 200:
        lot_info = response.json()
        print(f"✅ Lote encontrado: {lot_info['lot_id']} con {lot_info['cantidad']} productos")
        print(f"   Fecha de caducidad: {lot_info['productos'][0]['caducidad']}")
    else:
        print(f"❌ Error consultando lote: {response.text}")
    
    # 4. Consultar inventario completo
    print("\n4. Consultando inventario completo...")
    response = requests.get(f"{BASE_URL}/inventory")
    if response.status_code == 200:
        inventory = response.json()
        print(f"✅ Inventario completo: {len(inventory)} productos totales")
        print("   Primeros 3 productos:")
        for i, item in enumerate(inventory[:3]):
            print(f"   - {item['lot_id']}: {item['id_individual']} (caduca: {item['caducidad']})")
    else:
        print(f"❌ Error consultando inventario: {response.text}")
    
    # 5. Consultar resumen del inventario
    print("\n5. Consultando resumen del inventario...")
    response = requests.get(f"{BASE_URL}/inventory/summary")
    if response.status_code == 200:
        summary = response.json()
        print(f"✅ Resumen:")
        print(f"   - Total productos: {summary['total_products']}")
        print(f"   - Total lotes: {summary['total_lots']}")
        print("   - Lotes:")
        for lot in summary['lots']:
            print(f"     * {lot['lot_id']}: {lot['cantidad']} productos (caduca: {lot['fecha_caducidad_mas_temprana']})")
    else:
        print(f"❌ Error consultando resumen: {response.text}")
    
    # 6. Eliminar un producto individual
    if inventory:
        product_to_delete = inventory[0]['id_individual']
        print(f"\n6. Eliminando producto individual '{product_to_delete}'...")
        response = requests.delete(f"{BASE_URL}/inventory/lots/{product_to_delete}")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Producto eliminado. Inventario restante: {result['remaining_inventory']} productos")
        else:
            print(f"❌ Error eliminando producto: {response.text}")
    
    # 7. Eliminar un lote completo
    print("\n7. Eliminando lote completo 'LOTE002'...")
    response = requests.delete(f"{BASE_URL}/inventory/lots/LOTE002")
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Lote eliminado. Inventario restante: {result['remaining_inventory']} productos")
    else:
        print(f"❌ Error eliminando lote: {response.text}")
    
    # 8. Consultar resumen final
    print("\n8. Resumen final del inventario...")
    response = requests.get(f"{BASE_URL}/inventory/summary")
    if response.status_code == 200:
        summary = response.json()
        print(f"✅ Resumen final:")
        print(f"   - Total productos: {summary['total_products']}")
        print(f"   - Total lotes: {summary['total_lots']}")
        if summary['lots']:
            print("   - Lotes restantes:")
            for lot in summary['lots']:
                print(f"     * {lot['lot_id']}: {lot['cantidad']} productos")
        else:
            print("   - No hay lotes restantes")
    
    print("\n🎉 Pruebas completadas!")

if __name__ == "__main__":
    test_inventory_endpoints()
