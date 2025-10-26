import sqlite3
import json
import requests
from datetime import datetime

OPENROUTER_API_KEY = "TU_API_KEY_DE_OPENROUTER"

def generate_ai_inventory_report_openrouter():
    """
    Genera un reporte de inventario inteligente con ayuda de IA,
    usando la API de OpenRouter.
    """
    try:
        # 1️⃣ Leer los datos del inventario
        conn = sqlite3.connect("inventory.db")
        cur = conn.cursor()
        cur.execute("""
            SELECT product_name, COUNT(*) as cantidad, MIN(caducidad) as caducidad_mas_cercana
            FROM inventory
            GROUP BY product_name
            ORDER BY caducidad_mas_cercana ASC
        """)
        rows = cur.fetchall()
        conn.close()

        if not rows:
            return {"status": "error", "message": "Inventario vacío."}

        # 2️⃣ Convertir los datos a formato JSON
        inventory_data = [
            {
                "product_name": r[0],
                "cantidad": r[1],
                "caducidad_mas_cercana": r[2]
            }
            for r in rows
        ]

        # 3️⃣ Crear el prompt para la IA
        prompt = f"""
        Eres un asistente experto en control de inventario.
        Analiza los siguientes productos, su cantidad y fecha de caducidad:

        {json.dumps(inventory_data, indent=2)}

        Reglas:
        - Un producto está en riesgo si tiene menos de 10 unidades o si caduca en menos de 7 días.
        - Genera un reporte en formato JSON con:
            - product_name
            - estado (Normal, Bajo stock, Próxima caducidad, Crítico)
            - sugerencia (por ejemplo: 'Reabastecer urgente', 'Revisar proveedor', etc.)
        - Al final, incluye un objeto 'resumen_final' con:
            - total_productos_en_riesgo
            - recomendacion_general
        """

        # 4️⃣ Llamar a la API de OpenRouter
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "gpt-4o-mini",  # puedes usar otros modelos como claude-3, llama-3, etc.
            "messages": [
                {"role": "system", "content": "Eres un analista de inventario profesional."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3
        }

        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=payload
        )

        if response.status_code != 200:
            return {"status": "error", "message": f"Error IA: {response.text}"}

        ai_reply = response.json()["choices"][0]["message"]["content"]

        # 5️⃣ Guardar reporte localmente
        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M")
        filename = f"reporte_inventario_{timestamp}.json"
        with open(filename, "w", encoding="utf-8") as f:
            f.write(ai_reply)

        # Intentar parsear JSON limpio
        try:
            parsed_report = json.loads(ai_reply)
        except:
            parsed_report = {"reporte": ai_reply}

        return {
            "status": "ok",
            "reporte": parsed_report,
            "archivo": filename
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}


