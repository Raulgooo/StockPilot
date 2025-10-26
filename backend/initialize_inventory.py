import inventory
import csv
import json

def init_demo_inventory():
    """Initialize demo inventory with products from supplier_products.csv"""
    # Read products from CSV
    with open('supplier_products.csv', 'r') as file:
        csv_reader = csv.DictReader(file)
        products = list(csv_reader)

    # Initialize inventory with random quantities and expiration days
    for idx, product in enumerate(products, 1):
        lot_id = f"LOT{idx:03d}"
        quantity = 10  # Reduced quantity to avoid QR code size issues
        expiry_days = 180  # Set 6 months expiration for all products
        
        try:
            # Create lot in inventory
            inventory.C_lote(
                lot_id=lot_id,
                cantidad=quantity,
                dias_caducidad=expiry_days,
                product_name=product['product_name']
            )
            print(f"Created inventory lot {lot_id} for {product['product_name']}")
        except Exception as e:
            print(f"Error creating lot {lot_id}: {str(e)}")
            continue

if __name__ == "__main__":
    print("Initializing demo inventory...")
    init_demo_inventory()
    print("Demo inventory initialization complete!")