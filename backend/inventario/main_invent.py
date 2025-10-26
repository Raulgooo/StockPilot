from invent import C_lote, R_lote, D_lote

def main():
    # Ejemplo de creación de un lote
    lote_nuevo = C_lote(
        lot_id="LOTE001",    # ID del lote
        cantidad=5,          # Cantidad de productos
        dias_caducidad=30    # Días hasta caducidad
    )
    print("\nLote creado:", lote_nuevo)

    # Ejemplo de consulta de un lote
    info_lote = R_lote("LOTE001")
    print("\nInformación del lote:", info_lote)

    # Ejemplo de eliminación de un lote
    inventario_actualizado = D_lote("LOTE001")
    print("\nInventario después de eliminar:", inventario_actualizado)

if __name__ == "__main__":
    main()