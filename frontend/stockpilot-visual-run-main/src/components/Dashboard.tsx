import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plane, Clock, MapPin, AlertCircle, Package } from "lucide-react";
import { Flight } from "@/types/flight";

interface DashboardProps {
  flights: Flight[];
  onStartPickRun: (flightNumber: string) => void;
}

export const Dashboard = ({ flights, onStartPickRun }: DashboardProps) => {
  // Sort flights by departure time to identify priority
  const sortedFlights = [...flights].sort(
    (a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
  );

  const isPriority = (flightNumber: string) => {
    return sortedFlights[0]?.flightNumber === flightNumber;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">
            PickRun Navigator
          </h1>
          <p className="text-lg text-muted-foreground">Centro de Operaciones</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Section - Flights */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
                <Plane className="h-6 w-6 text-primary" />
                Vuelos Pendientes
              </h2>
              <Badge variant="secondary" className="text-sm">
                {flights.length} vuelos
              </Badge>
            </div>

            <div className="grid gap-4">
              {sortedFlights.map((flight, index) => (
                <Card
                  key={flight.flightNumber}
                  className={`p-6 transition-all duration-300 hover:scale-[1.02] animate-fade-in-up ${
                    isPriority(flight.flightNumber)
                      ? "border-[hsl(var(--priority-high))] border-2 shadow-[0_0_30px_hsl(var(--priority-high)/0.3)]"
                      : "border-border"
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {isPriority(flight.flightNumber) && (
                    <Badge className="mb-4 bg-[hsl(var(--priority-high))] text-background font-bold">
                      PRIORIDAD
                    </Badge>
                  )}

                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <Plane className="h-8 w-8 text-primary" />
                        <h3 className="text-3xl font-bold text-foreground">
                          {flight.flightNumber}
                        </h3>
                      </div>

                      <div className="flex flex-wrap gap-4 text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-accent" />
                          <span className="text-sm font-medium">{flight.destination}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-accent" />
                          <span className="text-sm font-medium">
                            Salida: {formatTime(flight.departureTime)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      size="lg"
                      onClick={() => onStartPickRun(flight.flightNumber)}
                      className={`w-full md:w-auto font-bold ${
                        isPriority(flight.flightNumber)
                          ? "bg-[hsl(var(--priority-high))] hover:bg-[hsl(var(--priority-high)/0.9)] text-background"
                          : "bg-primary hover:bg-primary/90"
                      }`}
                    >
                      INICIAR PICK RUN
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar - Inventory Summary */}
          <div className="space-y-4">
            <Card className="p-6 border-border">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="h-6 w-6 text-primary" />
                  <h3 className="text-xl font-semibold text-foreground">
                    Resumen de Inventario
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-[hsl(var(--status-alert)/0.1)] border border-[hsl(var(--status-alert)/0.3)] rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-[hsl(var(--status-alert))]" />
                      <span className="text-sm font-medium text-muted-foreground">
                        Lotes en Riesgo
                      </span>
                    </div>
                    <p className="text-3xl font-bold text-foreground">12</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Caducidad {"<"} 3 días
                    </p>
                  </div>

                  <div className="p-4 bg-[hsl(var(--status-pick)/0.1)] border border-[hsl(var(--status-pick)/0.3)] rounded-lg">
                    <span className="text-sm font-medium text-muted-foreground block mb-2">
                      Productos Disponibles
                    </span>
                    <p className="text-3xl font-bold text-foreground">248</p>
                    <p className="text-xs text-muted-foreground mt-1">En 6 categorías</p>
                  </div>

                  <div className="p-4 bg-[hsl(var(--status-confirm)/0.1)] border border-[hsl(var(--status-confirm)/0.3)] rounded-lg">
                    <span className="text-sm font-medium text-muted-foreground block mb-2">
                      Runs Completados Hoy
                    </span>
                    <p className="text-3xl font-bold text-foreground">18</p>
                    <p className="text-xs text-muted-foreground mt-1">96% eficiencia</p>
                  </div>
                </div>

                <Button variant="outline" className="w-full mt-4">
                  Ver Inventario Completo
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
