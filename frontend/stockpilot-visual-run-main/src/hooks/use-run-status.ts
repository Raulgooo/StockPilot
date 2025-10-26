import { useState, useEffect } from 'react';
import { getRunStatus, takeOneProduct, putOneProduct } from '@/components/services/run-status';
import { getFullInventory } from '@/components/services/inventory';

interface RunStatus {
  sensors: {
    [productName: string]: {
      color: 'red' | 'green' | 'white';
      current_weight: number;
      expected_weight: number;
      units_remaining: number;
      active: boolean;
    };
  };
  basket: {
    [productName: string]: number;
  };
}

interface InventoryItem {
  lot_id: string;
  id_individual: string;
  caducidad: string;
  product_name: string;
}

interface ProductStatus {
  productName: string;
  color: 'red' | 'green' | 'white';
  unitsRemaining: number;
  unitsInBasket: number;
  isInFlight: boolean;
  inventoryItems: InventoryItem[];
  needsMore: number; // positive = needs more, negative = has excess
}

export const useRunStatus = (flightProducts: string[]) => {
  const [runStatus, setRunStatus] = useState<RunStatus | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [productStatuses, setProductStatuses] = useState<ProductStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [runData, inventoryData] = await Promise.all([
          getRunStatus(),
          getFullInventory()
        ]);
        
        setRunStatus(runData);
        setInventory(inventoryData);
        
        // Calculate product statuses
        const statuses: ProductStatus[] = flightProducts.map(productName => {
          const sensor = runData.sensors[productName];
          const basketCount = runData.basket[productName] || 0;
          const inventoryItems = inventoryData.filter(item => item.product_name === productName);
          
          // Calculate how many more items are needed
          const expectedQuantity = sensor?.expected_weight / (sensor?.current_weight / sensor?.units_remaining) || 0;
          const needsMore = expectedQuantity - basketCount;
          
          return {
            productName,
            color: sensor?.color || 'white',
            unitsRemaining: sensor?.units_remaining || 0,
            unitsInBasket: basketCount,
            isInFlight: flightProducts.includes(productName),
            inventoryItems,
            needsMore: Math.round(needsMore)
          };
        });
        
        setProductStatuses(statuses);
        setError(null);
      } catch (err) {
        console.error('Failed to load run status:', err);
        setError('Failed to load run status');
      } finally {
        setLoading(false);
      }
    };

    loadData();
    
    // Poll for updates every 2 seconds
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, [flightProducts]);

  const takeOne = async (productName: string) => {
    try {
      await takeOneProduct(productName);
      // Refresh data after taking one
      const [runData, inventoryData] = await Promise.all([
        getRunStatus(),
        getFullInventory()
      ]);
      setRunStatus(runData);
      setInventory(inventoryData);
    } catch (err) {
      console.error('Failed to take one product:', err);
      throw err;
    }
  };

  const putOne = async (productName: string) => {
    try {
      await putOneProduct(productName);
      // Refresh data after putting one back
      const [runData, inventoryData] = await Promise.all([
        getRunStatus(),
        getFullInventory()
      ]);
      setRunStatus(runData);
      setInventory(inventoryData);
    } catch (err) {
      console.error('Failed to put one product:', err);
      throw err;
    }
  };

  return {
    runStatus,
    inventory,
    productStatuses,
    loading,
    error,
    takeOne,
    putOne
  };
};
