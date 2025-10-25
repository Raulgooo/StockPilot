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
  const { toast } = useToast();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryByProduct, setInventoryByProduct] = useState<ProductGroup[]>([]);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [viewMode, setViewMode] = useState<'detailed' | 'grouped'>('grouped');
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [expandedLots, setExpandedLots] = useState<Set<string>>(new Set());
  const [newLot, setNewLot] = useState({
    lotId: "",
    cantidad: 1,
    diasCaducidad: 30,
    productName: ""
  });

  // Load inventory data
  useEffect(() => {
    const loadInventory = async () => {
      try {
        setLoading(true);
        const [inventoryData, summaryData, groupedData] = await Promise.all([
          getFullInventory(),
          getInventorySummary(),
          getInventoryByProduct()
        ]);
        setInventory(inventoryData);
        setSummary(summaryData);
        setInventoryByProduct(groupedData);
        setError(null);
      } catch (err) {
        setError("Failed to load inventory");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadInventory();
  }, []);

  const handleCreateLot = async () => {
    if (!newLot.lotId.trim() || !newLot.productName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a lot ID and product name",
        variant: "destructive",
      });
      return;
    }

    try {
      await createLot(newLot.lotId, newLot.cantidad, newLot.diasCaducidad, newLot.productName);
      toast({
        title: "Success",
        description: `Lot ${newLot.lotId} created with ${newLot.cantidad} products`,
      });
      
      // Reload inventory
      const [inventoryData, summaryData, groupedData] = await Promise.all([
        getFullInventory(),
        getInventorySummary(),
        getInventoryByProduct()
      ]);
      setInventory(inventoryData);
      setSummary(summaryData);
      setInventoryByProduct(groupedData);
      
      // Reset form
      setNewLot({ lotId: "", cantidad: 1, diasCaducidad: 30, productName: "" });
      setShowCreateForm(false);
    } catch (err) {
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
        description: `${identifier} deleted successfully`,
      });
      
      // Reload inventory
      const [inventoryData, summaryData, groupedData] = await Promise.all([
        getFullInventory(),
        getInventorySummary(),
        getInventoryByProduct()
      ]);
      setInventory(inventoryData);
      setSummary(summaryData);
      setInventoryByProduct(groupedData);
    } catch (err) {
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
    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiration < 0) {
      return { status: "expired", color: "destructive", text: "Expired" };
    } else if (daysUntilExpiration <= 3) {
      return { status: "warning", color: "destructive", text: `${daysUntilExpiration} days` };
    } else if (daysUntilExpiration <= 7) {
      return { status: "caution", color: "secondary", text: `${daysUntilExpiration} days` };
    } else {
      return { status: "good", color: "default", text: `${daysUntilExpiration} days` };
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
          <h2 className="text-2xl font-bold mb-2">Error Loading Inventory</h2>
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
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </Button>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  Gestión de Inventario
                </h1>
                <p className="text-muted-foreground">
                  Control completo de lotes y productos
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === 'grouped' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grouped')}
                >
                  Agrupado
                </Button>
                <Button
                  variant={viewMode === 'detailed' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('detailed')}
                >
                  Detallado
                </Button>
              </div>
              <Button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Lote
              </Button>
            </div>
          </div>
        </div>

        {/* Create Lot Form */}
        {showCreateForm && (
          <Card className="p-6 mb-6 border-primary">
            <h3 className="text-lg font-semibold mb-4">Crear Nuevo Lote</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">ID del Lote</label>
                <input
                  type="text"
                  value={newLot.lotId}
                  onChange={(e) => setNewLot({ ...newLot, lotId: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  placeholder="Ej: LOTE001"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nombre del Producto</label>
                <input
                  type="text"
                  value={newLot.productName}
                  onChange={(e) => setNewLot({ ...newLot, productName: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  placeholder="Ej: Coca-Cola"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Cantidad</label>
                <input
                  type="number"
                  min="1"
                  value={newLot.cantidad}
                  onChange={(e) => setNewLot({ ...newLot, cantidad: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Días hasta Caducidad</label>
                <input
                  type="number"
                  min="1"
                  value={newLot.diasCaducidad}
                  onChange={(e) => setNewLot({ ...newLot, diasCaducidad: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={handleCreateLot} className="flex-1">
                  Crear
                </Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Summary Cards */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="h-6 w-6 text-primary" />
                  <h3 className="text-xl font-semibold text-foreground">
                    Resumen del Inventario
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <span className="text-sm font-medium text-muted-foreground block mb-2">
                      Total de Productos
                    </span>
                    <p className="text-3xl font-bold text-foreground">{summary?.total_products || 0}</p>
                  </div>

                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <span className="text-sm font-medium text-muted-foreground block mb-2">
                      Total de Lotes
                    </span>
                    <p className="text-3xl font-bold text-foreground">{summary?.total_lots || 0}</p>
                  </div>

                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <span className="text-sm font-medium text-muted-foreground block mb-2">
                      Productos Únicos
                    </span>
                    <p className="text-3xl font-bold text-foreground">{inventoryByProduct.length}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Inventory Content */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-foreground">
                  {viewMode === 'grouped' ? 'Inventario por Producto' : 'Inventario Detallado'}
                </h3>
                <Badge variant="secondary">
                  {viewMode === 'grouped' ? inventoryByProduct.length : inventory.length} {viewMode === 'grouped' ? 'productos' : 'items'}
                </Badge>
              </div>

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

              {inventory.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay productos en el inventario</p>
                  <p className="text-sm">Crea tu primer lote para comenzar</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

interface InventoryItem {
  lot_id: string;
  id_individual: string;
  caducidad: string;
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

export const InventoryView = ({ onBack }: InventoryViewProps) => {
  const { toast } = useToast();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newLot, setNewLot] = useState({
    lotId: "",
    cantidad: 1,
    diasCaducidad: 30
  });

  // Load inventory data
  useEffect(() => {
    const loadInventory = async () => {
      try {
        setLoading(true);
        const [inventoryData, summaryData] = await Promise.all([
          getFullInventory(),
          getInventorySummary()
        ]);
        setInventory(inventoryData);
        setSummary(summaryData);
        setError(null);
      } catch (err) {
        setError("Failed to load inventory");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadInventory();
  }, []);

  const handleCreateLot = async () => {
    if (!newLot.lotId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a lot ID",
        variant: "destructive",
      });
      return;
    }

    try {
      await createLot(newLot.lotId, newLot.cantidad, newLot.diasCaducidad);
      toast({
        title: "Success",
        description: `Lot ${newLot.lotId} created with ${newLot.cantidad} products`,
      });
      
      // Reload inventory
      const [inventoryData, summaryData] = await Promise.all([
        getFullInventory(),
        getInventorySummary()
      ]);
      setInventory(inventoryData);
      setSummary(summaryData);
      
      // Reset form
      setNewLot({ lotId: "", cantidad: 1, diasCaducidad: 30 });
      setShowCreateForm(false);
    } catch (err) {
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
        description: `${identifier} deleted successfully`,
      });
      
      // Reload inventory
      const [inventoryData, summaryData] = await Promise.all([
        getFullInventory(),
        getInventorySummary()
      ]);
      setInventory(inventoryData);
      setSummary(summaryData);
    } catch (err) {
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
    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiration < 0) {
      return { status: "expired", color: "destructive", text: "Expired" };
    } else if (daysUntilExpiration <= 3) {
      return { status: "warning", color: "destructive", text: `${daysUntilExpiration} days` };
    } else if (daysUntilExpiration <= 7) {
      return { status: "caution", color: "secondary", text: `${daysUntilExpiration} days` };
    } else {
      return { status: "good", color: "default", text: `${daysUntilExpiration} days` };
    }
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
          <h2 className="text-2xl font-bold mb-2">Error Loading Inventory</h2>
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
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </Button>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  Gestión de Inventario
                </h1>
                <p className="text-muted-foreground">
                  Control completo de lotes y productos
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear Lote
            </Button>
          </div>
        </div>

        {/* Create Lot Form */}
        {showCreateForm && (
          <Card className="p-6 mb-6 border-primary">
            <h3 className="text-lg font-semibold mb-4">Crear Nuevo Lote</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">ID del Lote</label>
                <input
                  type="text"
                  value={newLot.lotId}
                  onChange={(e) => setNewLot({ ...newLot, lotId: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  placeholder="Ej: LOTE001"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Cantidad</label>
                <input
                  type="number"
                  min="1"
                  value={newLot.cantidad}
                  onChange={(e) => setNewLot({ ...newLot, cantidad: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Días hasta Caducidad</label>
                <input
                  type="number"
                  min="1"
                  value={newLot.diasCaducidad}
                  onChange={(e) => setNewLot({ ...newLot, diasCaducidad: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={handleCreateLot} className="flex-1">
                  Crear
                </Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Summary Cards */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="h-6 w-6 text-primary" />
                  <h3 className="text-xl font-semibold text-foreground">
                    Resumen del Inventario
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <span className="text-sm font-medium text-muted-foreground block mb-2">
                      Total de Productos
                    </span>
                    <p className="text-3xl font-bold text-foreground">{summary?.total_products || 0}</p>
                  </div>

                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <span className="text-sm font-medium text-muted-foreground block mb-2">
                      Total de Lotes
                    </span>
                    <p className="text-3xl font-bold text-foreground">{summary?.total_lots || 0}</p>
                  </div>

                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <span className="text-sm font-medium text-muted-foreground block mb-2">
                      Lotes por Caducidad
                    </span>
                    <div className="space-y-2">
                      {summary?.lots.slice(0, 3).map((lot) => {
                        const status = getExpirationStatus(lot.fecha_caducidad_mas_temprana);
                        return (
                          <div key={lot.lot_id} className="flex justify-between items-center">
                            <span className="text-sm">{lot.lot_id}</span>
                            <Badge variant={status.color as any}>{status.text}</Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Inventory Table */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-foreground">
                  Inventario Completo
                </h3>
                <Badge variant="secondary">
                  {inventory.length} productos
                </Badge>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
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

              {inventory.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay productos en el inventario</p>
                  <p className="text-sm">Crea tu primer lote para comenzar</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
