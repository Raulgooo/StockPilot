import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { generateAIInventoryReportFile } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

export default function AIReportButton(): JSX.Element {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleClick = async () => {
    if (loading) return;
    try {
      setLoading(true);
      const { blob, filename } = await generateAIInventoryReportFile();
      // trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'report';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: "Descarga iniciada", description: `Descargando ${filename}` });
    } catch (err: any) {
      toast({ title: "Error", description: String(err?.message || err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleClick} disabled={loading} title="Generar reporte de inventario con IA">
      {loading ? "Generando..." : "Generar reporte IA"}
    </Button>
  );
}
