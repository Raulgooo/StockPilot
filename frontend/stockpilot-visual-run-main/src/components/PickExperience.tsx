import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ShoppingCart, Package, CheckCircle, XCircle, Pause, ArrowLeft, AlertTriangle } from "lucide-react";
import { FlightDetails, Product } from "@/types/flight";
import { useToast } from "@/hooks/use-toast";
import { takeOne, putOne, getRunStatus } from "@/components/services/flights";
import { useRunStatus } from "@/hooks/use-run-status";

interface PickExperienceProps {
  flightDetails: FlightDetails;
  onComplete: () => void;
  onBack: () => void;
}

interface Shelf {
  id: number;
  product: Product;
  status: "inactive" | "active" | "complete" | "error";
  side: "left" | "right";
}

export const PickExperience = ({
  flightDetails,
  onComplete,
  onBack,
}: PickExperienceProps) => {
  const { toast } = useToast();
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [currentPickIndex, setCurrentPickIndex] = useState(0);
  const [completedPicks, setCompletedPicks] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  // Get flight product names
  const flightProductNames = flightDetails.products.map(p => p.productName);
  
  // Use the new hook for run status and inventory integration
  const { productStatuses, loading: runLoading, takeOne, putOne } = useRunStatus(flightProductNames);

  useEffect(() => {
    // Initialize shelves from products
    const initialShelves: Shelf[] = flightDetails.products.map((product, index) => ({
      id: index,
      product,
      status: index === 0 ? "active" : "inactive",
      side: index % 2 === 0 ? "left" : "right",
    }));
    setShelves(initialShelves);
  }, [flightDetails]);

  const progress = (completedPicks / flightDetails.products.length) * 100;

  const handleShelfClick = async (shelfId: number) => {
    if (isPaused) return;

    const shelf = shelves[shelfId];
    const productStatus = productStatuses.find(p => p.productName === shelf.product.productName);

    if (shelf.status === "active") {
      try {
        // Call the real backend API to take one item
        await takeOne(shelf.product.productName);
        
        // Update local state
        setShelves((prev) =>
          prev.map((s) =>
            s.id === shelfId
              ? { ...s, status: "complete" }
              : s.id === shelfId + 1
              ? { ...s, status: "active" }
              : s
          )
        );

        setCompletedPicks((prev) => prev + 1);
        setCurrentPickIndex((prev) => prev + 1);

        toast({
          title: "Pick Exitoso",
          description: `${shelf.product.productName} - ${shelf.product.categoryQuantity} unidades`,
        });

        // Check if all picks are complete
        if (shelfId === shelves.length - 1) {
          setTimeout(() => {
            toast({
              title: "Run Completado",
              description: "Todos los productos han sido pickeados exitosamente",
            });
            onComplete();
          }, 1000);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo tomar el producto",
          variant: "destructive",
        });
      }
    } else if (shelf.status === "inactive" || shelf.status === "error") {
      // Error pick
      toast({
        variant: "destructive",
        title: "ALERTA DE SEGURIDAD",
        description: "Lote no asignado. Siga las luces VERDES.",
      });

      setShelves((prev) =>
        prev.map((s) => (s.id === shelfId ? { ...s, status: "error" } : s))
      );

      // Reset error after 2 seconds
      setTimeout(() => {
        setShelves((prev) =>
          prev.map((s) =>
            s.id === shelfId && s.status === "error" ? { ...s, status: "inactive" } : s
          )
        );
      }, 2000);
    }
  };

  const handleProductClick = async (productName: string) => {
    if (isPaused) return;

    const productStatus = productStatuses.find(p => p.productName === productName);
    
    if (!productStatus) return;

    try {
      if (productStatus.color === 'green' && productStatus.isInFlight) {
        // Take one item
        await takeOne(productName);
        toast({
          title: "Producto Tomado",
          description: `Se tomó 1 unidad de ${productName}`,
        });
      } else if (productStatus.unitsInBasket > 0) {
        // Put one back
        await putOne(productName);
        toast({
          title: "Producto Devuelto",
          description: `Se devolvió 1 unidad de ${productName}`,
        });
      } else {
        toast({
          title: "Acción No Permitida",
          description: "Este producto no está en el carrito o no está activo",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo realizar la acción",
        variant: "destructive",
      });
    }
  };

  const getShelfStyles = (status: Shelf["status"]) => {
    switch (status) {
      case "active":
        return "bg-[hsl(var(--status-pick)/0.2)] border-[hsl(var(--status-pick))] border-2 animate-pulse-glow cursor-pointer";
      case "complete":
        return "bg-[hsl(var(--status-complete)/0.1)] border-[hsl(var(--status-complete))] opacity-50";
      case "error":
        return "bg-[hsl(var(--status-alert)/0.2)] border-[hsl(var(--status-alert))] border-2 animate-pulse";
      default:
        return "bg-muted border-border opacity-30";
    }
  };

  const getProductStyles = (productStatus: any) => {
    if (!productStatus) return "bg-muted border-border opacity-30";
    
    const baseStyles = "transition-all duration-300 cursor-pointer hover:scale-105";
    
    if (productStatus.color === 'green' && productStatus.isInFlight) {
      return `${baseStyles} bg-green-100 border-green-500 border-2 animate-pulse-glow`;
    } else if (productStatus.color === 'red') {
      return `${baseStyles} bg-red-100 border-red-500 border-2 animate-pulse`;
    } else if (!productStatus.isInFlight) {
      return `${baseStyles} bg-gray-100 border-gray-300 border-2 opacity-50`;
    } else {
      return `${baseStyles} bg-yellow-100 border-yellow-500 border-2`;
    }
  };

  const activeShelf = shelves.find((s) => s.status === "active");

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Header */}
      <div className="bg-card border-b border-border p-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Salir
            </Button>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Vuelo {flightDetails.flightNumber}
              </h2>
              <p className="text-sm text-muted-foreground">
                {completedPicks} de {flightDetails.products.length} completados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-3xl font-bold text-foreground">{Math.round(progress)}%</p>
              <p className="text-xs text-muted-foreground">Progreso</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPaused(!isPaused)}
              className={isPaused ? "border-[hsl(var(--status-alert))]" : ""}
            >
              <Pause className="h-4 w-4 mr-2" />
              {isPaused ? "Reanudar" : "Pausar"}
            </Button>
          </div>
        </div>

        <Progress value={progress} className="mt-4 h-2" />
      </div>

      {/* Main Pick Area */}
      <div className="relative h-[calc(100vh-140px)] flex items-center justify-center p-8">
        {/* Left Shelves - All Inventory Products */}
        <div className="flex-1 space-y-4 pr-8">
          {productStatuses
            .filter((_, index) => index % 2 === 0)
            .map((productStatus, index) => (
              <Card
                key={productStatus.productName}
                onClick={() => handleProductClick(productStatus.productName)}
                className={`p-6 transition-all duration-300 ${getProductStyles(productStatus)} animate-slide-shelf`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground mb-1">
                      {productStatus.productName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {productStatus.isInFlight ? "En vuelo" : "No en vuelo"}
                    </p>
                    {productStatus.needsMore !== 0 && (
                      <p className={`text-sm font-medium ${
                        productStatus.needsMore > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {productStatus.needsMore > 0 
                          ? `Faltan ${productStatus.needsMore} unidades`
                          : `Sobran ${Math.abs(productStatus.needsMore)} unidades`
                        }
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {productStatus.color === 'green' && productStatus.isInFlight && (
                      <Badge className="bg-green-500 text-white mb-2">
                        {productStatus.unitsRemaining} disponibles
                      </Badge>
                    )}
                    {productStatus.color === 'red' && (
                      <AlertTriangle className="h-6 w-6 text-red-500" />
                    )}
                    {productStatus.unitsInBasket > 0 && (
                      <Badge className="bg-blue-500 text-white mb-2">
                        {productStatus.unitsInBasket} en carrito
                      </Badge>
                    )}
                    {!productStatus.isInFlight && (
                      <XCircle className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                </div>
              </Card>
            ))}
        </div>

        {/* Center Cart */}
        <div className="flex-shrink-0 relative">
          <div className="w-48 h-64 bg-card border-4 border-primary rounded-lg shadow-[0_0_40px_hsl(var(--primary)/0.4)] flex items-center justify-center">
            <ShoppingCart className="h-24 w-24 text-primary" />
          </div>
          <Badge className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-primary text-background px-6 py-2 text-lg">
            CARRO DE CATERING
          </Badge>
        </div>

        {/* Right Shelves - All Inventory Products */}
        <div className="flex-1 space-y-4 pl-8">
          {productStatuses
            .filter((_, index) => index % 2 === 1)
            .map((productStatus, index) => (
              <Card
                key={productStatus.productName}
                onClick={() => handleProductClick(productStatus.productName)}
                className={`p-6 transition-all duration-300 ${getProductStyles(productStatus)} animate-slide-shelf`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    {productStatus.color === 'green' && productStatus.isInFlight && (
                      <Badge className="bg-green-500 text-white mb-2">
                        {productStatus.unitsRemaining} disponibles
                      </Badge>
                    )}
                    {productStatus.color === 'red' && (
                      <AlertTriangle className="h-6 w-6 text-red-500" />
                    )}
                    {productStatus.unitsInBasket > 0 && (
                      <Badge className="bg-blue-500 text-white mb-2">
                        {productStatus.unitsInBasket} en carrito
                      </Badge>
                    )}
                    {!productStatus.isInFlight && (
                      <XCircle className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 text-right">
                    <h3 className="font-bold text-foreground mb-1">
                      {productStatus.productName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {productStatus.isInFlight ? "En vuelo" : "No en vuelo"}
                    </p>
                    {productStatus.needsMore !== 0 && (
                      <p className={`text-sm font-medium ${
                        productStatus.needsMore > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {productStatus.needsMore > 0 
                          ? `Faltan ${productStatus.needsMore} unidades`
                          : `Sobran ${Math.abs(productStatus.needsMore)} unidades`
                        }
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
        </div>

        {/* Active Pick Instruction */}
        {activeShelf && !isPaused && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-md">
            <Card className="p-6 bg-[hsl(var(--status-pick)/0.1)] border-[hsl(var(--status-pick))] border-2 animate-pulse-glow">
              <div className="flex items-center gap-4">
                <Package className="h-8 w-8 text-[hsl(var(--status-pick))] flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">SIGUIENTE PICK:</p>
                  <h3 className="text-xl font-bold text-foreground">
                    {activeShelf.product.productName}
                  </h3>
                  <p className="text-[hsl(var(--status-confirm))] font-bold mt-2">
                    Tome {activeShelf.product.categoryQuantity} unidades
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {isPaused && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center backdrop-blur-sm">
            <Card className="p-8 text-center">
              <Pause className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-foreground mb-2">Run Pausado</h3>
              <p className="text-muted-foreground mb-4">
                Presione "Reanudar" para continuar
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
