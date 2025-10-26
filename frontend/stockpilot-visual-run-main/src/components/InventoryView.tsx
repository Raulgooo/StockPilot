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
  

  // Load inventory data
               };
        

