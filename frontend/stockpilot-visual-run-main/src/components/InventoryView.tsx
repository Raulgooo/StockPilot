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
import AIReportButton from "@/components/AIReportButton";

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
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    getInventorySummary()
      .then((s) => mounted && setSummary(s))
      .catch((e) =>
        toast({
          title: "Error cargando inventario",
          description: String(e),
          variant: "destructive",
        })
      );
    return () => {
      mounted = false;
    };
  }, [toast]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onBack} aria-label="Volver">
            <ArrowLeft />
          </Button>
          <h2 className="text-lg font-semibold">Inventario</h2>
        </div>

        <div className="flex items-center gap-2">
          <AIReportButton />
          <Button onClick={() => toast({ title: 'Agregar lote', description: 'Funcionalidad no implementada en demo' })}>
            <Plus />
          </Button>
        </div>
      </div>

      <Card>
        <div className="p-4">
          {summary ? (
            <div className="flex items-center gap-4">
              <Badge variant="secondary">{summary.total_products} productos</Badge>
              <Badge variant="secondary">{summary.total_lots} lotes</Badge>
            </div>
          ) : (
            <div>Cargando resumen...</div>
          )}
        </div>
      </Card>

      {/* Tabla y resto de UI puede permanecer o implementarse según necesidad */}
    </div>
  );
};


