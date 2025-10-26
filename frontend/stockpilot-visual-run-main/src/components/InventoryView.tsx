import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ArrowLeft, Package, Plus, Trash2, AlertTriangle, CheckCircle, ChevronDown, ChevronRight } from "lucide-react";
import { getFullInventory, getInventorySummary, createLot, deleteLotOrProduct, getInventoryByProduct } from "@/components/services/inventory";
import { useToast } from "@/hooks/use-toast";

interface InventoryViewProps {
  onBack: () => void;
}

interface InventoryItem {
  lot_id: string;
  id_individual: string;
  caducidad: string;
  product_name: string;
}

interface LotSummary {
  lot_id: string;
  cantidad: number;
  fecha_caducidad_mas_temprana: string;
}

interface InventorySummary {
  total_products: number;
  total_lots: number;
  lots: LotSummary[];
}

interface ProductGroup {
  product_name: string;
  total_quantity: number;
  lots: Array<{
    lot_id: string;
    cantidad: number;
    fecha_caducidad_mas_temprana: string;
    ids_individuales: string[];
  }>;
}

export const InventoryView = ({ onBack }: InventoryViewProps) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryByProduct, setInventoryByProduct] = useState<ProductGroup[]>([]);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [viewMode, setViewMode] = useState<'grouped' | 'detailed'>('grouped');
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [expandedLots, setExpandedLots] = useState<Set<string>>(new Set());
  const [newLot, setNewLot] = useState({
    lotId: '',
    cantidad: 1,
    diasCaducidad: 30,
    productName: ''
  });

  const { toast } = useToast();

  // Load inventory data
  useEffect(() => {
    const loadInventory = async () => {
      try {
        setLoading(true);
        const [inventoryData, summaryData, inventoryByProductData] = await Promise.all([
          getFullInventory(),
          getInventorySummary(),
          getInventoryByProduct()
        ]);
        setInventory(inventoryData);
        setSummary(summaryData);
        setInventoryByProduct(inventoryByProductData);
        setError(null);
      } catch (err) {
        setError('Failed to load inventory');
        console.error(err);
        toast({
          title: "Error",
          description: "Failed to load inventory data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadInventory();
  }, [toast]);

  const handleCreateLot = async () => {
    if (!newLot.lotId || !newLot.productName) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await createLot(newLot.lotId, newLot.cantidad, newLot.diasCaducidad, newLot.productName);
      toast({
        title: "Success",
        description: "Lot created successfully",
      });
      setNewLot({ lotId: '', cantidad: 1, diasCaducidad: 30, productName: '' });
      setShowCreateForm(false);
      
      // Reload inventory data
      const [inventoryData, summaryData, inventoryByProductData] = await Promise.all([
        getFullInventory(),
        getInventorySummary(),
        getInventoryByProduct()
      ]);
      setInventory(inventoryData);
      setSummary(summaryData);
      setInventoryByProduct(inventoryByProductData);
    } catch (err) {
      console.error('Failed to create lot:', err);
      toast({
        title: "Error",
        description: "Failed to create lot",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (identifier: string) => {
    try {
      await deleteLotOrProduct(identifier);
      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
      
      // Reload inventory data
      const [inventoryData, summaryData, inventoryByProductData] = await Promise.all([
        getFullInventory(),
        getInventorySummary(),
        getInventoryByProduct()
      ]);
      setInventory(inventoryData);
      setSummary(summaryData);
      setInventoryByProduct(inventoryByProductData);
    } catch (err) {
      console.error('Failed to delete item:', err);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    }
  };

  const getExpirationStatus = (caducidad: string) => {
    const expirationDate = new Date(caducidad);
    const today = new Date();
    const diffTime = expirationDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: 'expired', text: 'Caducado', color: 'destructive' };
    } else if (diffDays <= 3) {
      return { status: 'warning', text: 'Próximo a caducar', color: 'destructive' };
    } else if (diffDays <= 7) {
      return { status: 'warning', text: 'Caduca pronto', color: 'secondary' };
    } else {
      return { status: 'good', text: 'Bueno', color: 'default' };
    }
  };

  const toggleProductExpansion = (productName: string) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productName)) {
      newExpanded.delete(productName);
    } else {
      newExpanded.add(productName);
    }
    setExpandedProducts(newExpanded);
  };

  const toggleLotExpansion = (lotId: string) => {
    const newExpanded = new Set(expandedLots);
    if (newExpanded.has(lotId)) {
      newExpanded.delete(lotId);
    } else {
      newExpanded.add(lotId);
    }
    setExpandedLots(newExpanded);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg">Loading inventory...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Inventory Management</h1>
              <p className="text-muted-foreground">Manage your inventory lots and products</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grouped' ? 'default' : 'outline'}
              onClick={() => setViewMode('grouped')}
            >
              Agrupado
            </Button>
            <Button
              variant={viewMode === 'detailed' ? 'default' : 'outline'}
              onClick={() => setViewMode('detailed')}
            >
              Detallado
            </Button>
            <Button onClick={() => setShowCreateForm(!showCreateForm)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Lote
            </Button>
          </div>
        </div>

        {/* Create Lot Form */}
        {showCreateForm && (
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Create New Lot</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Lot ID</label>
                <input
                  type="text"
                  value={newLot.lotId}
                  onChange={(e) => setNewLot({ ...newLot, lotId: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  placeholder="Enter lot ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Product Name</label>
                <input
                  type="text"
                  value={newLot.productName}
                  onChange={(e) => setNewLot({ ...newLot, productName: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  placeholder="Enter product name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Quantity</label>
                <input
                  type="number"
                  value={newLot.cantidad}
                  onChange={(e) => setNewLot({ ...newLot, cantidad: parseInt(e.target.value) || 1 })}
                  className="w-full p-2 border rounded-md"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Days to Expiration</label>
                <input
                  type="number"
                  value={newLot.diasCaducidad}
                  onChange={(e) => setNewLot({ ...newLot, diasCaducidad: parseInt(e.target.value) || 30 })}
                  className="w-full p-2 border rounded-md"
                  min="1"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleCreateLot}>Create Lot</Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>Cancel</Button>
            </div>
          </Card>
        )}

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Products</p>
                  <p className="text-2xl font-bold">{summary.total_products}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Lots</p>
                  <p className="text-2xl font-bold">{summary.total_lots}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Unique Products</p>
                  <p className="text-2xl font-bold">{inventoryByProduct.length}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Inventory Display */}
        {inventory.length === 0 ? (
          <Card className="p-8 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No inventory found</h3>
            <p className="text-muted-foreground mb-4">Create your first lot to get started</p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Lot
            </Button>
          </Card>
        ) : (
          <>
            {viewMode === 'grouped' ? (
              // Grouped View
              <div className="space-y-4">
                {inventoryByProduct.map((product) => {
                  const isExpanded = expandedProducts.has(product.product_name);
                  return (
                    <Collapsible key={product.product_name} open={isExpanded} onOpenChange={() => toggleProductExpansion(product.product_name)}>
                      <CollapsibleTrigger asChild>
                        <Card className="p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              <h4 className="font-semibold text-lg">{product.product_name}</h4>
                              <Badge variant="outline">{product.total_quantity} unidades</Badge>
                              <Badge variant="secondary">{product.lots.length} lotes</Badge>
                            </div>
                          </div>
                        </Card>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="ml-6 space-y-2">
                          {product.lots.map((lot) => {
                            const isLotExpanded = expandedLots.has(lot.lot_id);
                            const status = getExpirationStatus(lot.fecha_caducidad_mas_temprana);
                            return (
                              <Collapsible key={lot.lot_id} open={isLotExpanded} onOpenChange={() => toggleLotExpansion(lot.lot_id)}>
                                <CollapsibleTrigger asChild>
                                  <Card className="p-3 cursor-pointer hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        {isLotExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                        <span className="font-medium">{lot.lot_id}</span>
                                        <Badge variant="outline">{lot.cantidad} unidades</Badge>
                                        <Badge variant={status.color as any}>{status.text}</Badge>
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDelete(lot.lot_id);
                                        }}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </Card>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <div className="ml-6 mt-2">
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                      {lot.ids_individuales.map((id) => (
                                        <div key={id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                                          <span className="font-mono">{id}</span>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(id)}
                                            className="text-red-600 hover:text-red-700 p-1"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                            );
                          })}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>
            ) : (
              // Detailed View
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Lote ID</TableHead>
                      <TableHead>ID Individual</TableHead>
                      <TableHead>Fecha Caducidad</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventory.map((item, index) => {
                      const status = getExpirationStatus(item.caducidad);
                      return (
                        <TableRow key={`${item.lot_id}-${item.id_individual}`}>
                          <TableCell className="font-medium">{item.product_name}</TableCell>
                          <TableCell className="font-medium">{item.lot_id}</TableCell>
                          <TableCell className="font-mono text-sm">{item.id_individual}</TableCell>
                          <TableCell>{item.caducidad}</TableCell>
                          <TableCell>
                            <Badge variant={status.color as any}>
                              {status.status === "expired" && <AlertTriangle className="h-3 w-3 mr-1" />}
                              {status.status === "good" && <CheckCircle className="h-3 w-3 mr-1" />}
                              {status.text}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(item.id_individual)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
