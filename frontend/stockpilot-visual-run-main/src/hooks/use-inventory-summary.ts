import { useState, useEffect } from 'react';
import { getFullInventory, getInventorySummary, getInventoryByProduct } from '@/components/services/inventory';

interface InventorySummaryData {
  totalProducts: number;
  totalLots: number;
  uniqueProducts: number;
  riskLots: number;
  availableProducts: number;
  loading: boolean;
  error: string | null;
}

export const useInventorySummary = () => {
  const [data, setData] = useState<InventorySummaryData>({
    totalProducts: 0,
    totalLots: 0,
    uniqueProducts: 0,
    riskLots: 0,
    availableProducts: 0,
    loading: true,
    error: null
  });

  useEffect(() => {
    const loadInventoryData = async () => {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }));
        
        const [inventoryData, summaryData, inventoryByProductData] = await Promise.all([
          getFullInventory(),
          getInventorySummary(),
          getInventoryByProduct()
        ]);

        // Calculate risk lots (expiring in less than 3 days)
        const today = new Date();
        const threeDaysFromNow = new Date(today.getTime() + (3 * 24 * 60 * 60 * 1000));
        
        const riskLots = inventoryData.filter(item => {
          const expirationDate = new Date(item.caducidad);
          return expirationDate <= threeDaysFromNow;
        }).length;

        // Calculate unique products
        const uniqueProducts = new Set(inventoryData.map(item => item.product_name)).size;

        setData({
          totalProducts: summaryData.total_products,
          totalLots: summaryData.total_lots,
          uniqueProducts: uniqueProducts,
          riskLots: riskLots,
          availableProducts: summaryData.total_products,
          loading: false,
          error: null
        });
      } catch (err) {
        console.error('Failed to load inventory summary:', err);
        setData(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load inventory data'
        }));
      }
    };

    loadInventoryData();
  }, []);

  return data;
};
