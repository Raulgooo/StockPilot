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
import { Plane, ArrowLeft, Play, Package, AlertTriangle } from "lucide-react";
import { FlightDetails } from "@/types/flight";

interface PreparationViewProps {
  flightDetails: FlightDetails;
  onBack: () => void;
  onStartRun: () => void;
}

export const PreparationView = ({
  flightDetails,
  onBack,
  onStartRun,
}: PreparationViewProps) => {
  const totalItems = flightDetails.products.reduce(
    (sum, product) => sum + product.categoryQuantity,
    0
  );

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
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

          <div className="flex items-center gap-4 mb-2">
            <Plane className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Preparación: Vuelo {flightDetails.flightNumber}
              </h1>
              <p className="text-lg text-muted-foreground mt-1">
                Destino: {flightDetails.destination}
              </p>
            </div>
          </div>
        </div>

        {/* Products List */}
        <Card className="p-6 mb-6 border-border">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-semibold text-foreground">
                Lista de Productos
              </h2>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {totalItems} unidades totales
            </Badge>
          </div>

          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-foreground font-semibold">Producto</TableHead>
                  <TableHead className="text-foreground font-semibold">Categoría</TableHead>
                  <TableHead className="text-center text-foreground font-semibold">
                    Cantidad
                  </TableHead>
                  <TableHead className="text-foreground font-semibold">
                    Prioridad FEFO
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flightDetails.products.map((product, index) => (
                  <TableRow
                    key={index}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="font-medium text-foreground">
                      {product.productName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.category}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-bold">
                        {product.categoryQuantity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-[hsl(var(--status-pick)/0.2)] text-[hsl(var(--status-pick))] border border-[hsl(var(--status-pick)/0.5)]">
                        LOT {product.priorityLot}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Confirmation Section */}
        <Card className="p-6 border-[hsl(var(--status-pick))] border-2">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-6 w-6 text-[hsl(var(--status-pick))] mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Sistema Listo
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Los sensores de las torres se activarán en modo FEFO. Siga las luces{" "}
                  <span className="text-[hsl(var(--status-pick))] font-bold">VERDES</span>{" "}
                  para seleccionar los productos correctos. Las luces{" "}
                  <span className="text-[hsl(var(--status-confirm))] font-bold">AZULES</span>{" "}
                  indicarán la cantidad a tomar.
                </p>
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <p className="text-sm text-muted-foreground">
                ✓ {flightDetails.products.length} productos diferentes
              </p>
              <p className="text-sm text-muted-foreground">
                ✓ {totalItems} unidades totales a pickear
              </p>
              <p className="text-sm text-muted-foreground">
                ✓ Lotes priorizados por sistema FEFO
              </p>
            </div>

            <Button
              size="lg"
              onClick={onStartRun}
              className="w-full bg-[hsl(var(--status-pick))] hover:bg-[hsl(var(--status-pick)/0.9)] text-background font-bold text-lg h-14 animate-pulse-glow"
            >
              <Play className="h-5 w-5 mr-2" />
              CONFIRMAR Y ACTIVAR SENSORES (Start Run)
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
