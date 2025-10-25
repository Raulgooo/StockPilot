import { useState, useEffect } from "react";
import { Dashboard } from "@/components/Dashboard";
import { PreparationView } from "@/components/PreparationView";
import { PickExperience } from "@/components/PickExperience";
import { fetchFlights, fetchFlightDetails, startRun } from "@/components/services/flights";
import { FlightDetails, Flight } from "@/types/flight";

type View = "dashboard" | "preparation" | "picking";

const Index = () => {
  const [currentView, setCurrentView] = useState<View>("dashboard");
  const [selectedFlight, setSelectedFlight] = useState<FlightDetails | null>(null);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load flights on component mount
  useEffect(() => {
    const loadFlights = async () => {
      try {
        setLoading(true);
        const flightsData = await fetchFlights();
        setFlights(flightsData);
        setError(null);
      } catch (err) {
        setError("Failed to load flights");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadFlights();
  }, []);

  const handleStartPickRun = async (flightNumber: string) => {
    try {
      const flightDetails = await fetchFlightDetails(flightNumber);
      setSelectedFlight(flightDetails);
      setCurrentView("preparation");
    } catch (err) {
      console.error("Failed to load flight details:", err);
    }
  };

  const handleStartRun = async () => {
    if (!selectedFlight) return;
    
    try {
      await startRun(selectedFlight.flightNumber);
      setCurrentView("picking");
    } catch (err) {
      console.error("Failed to start run:", err);
    }
  };

  const handleComplete = () => {
    setCurrentView("dashboard");
    setSelectedFlight(null);
  };

  const handleBack = () => {
    if (currentView === "preparation") {
      setCurrentView("dashboard");
      setSelectedFlight(null);
    } else if (currentView === "picking") {
      setCurrentView("preparation");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg">Loading flights...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">
            Make sure your backend server is running on http://localhost:8000
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {currentView === "dashboard" && (
        <Dashboard flights={flights} onStartPickRun={handleStartPickRun} />
      )}
      {currentView === "preparation" && selectedFlight && (
        <PreparationView
          flightDetails={selectedFlight}
          onBack={handleBack}
          onStartRun={handleStartRun}
        />
      )}
      {currentView === "picking" && selectedFlight && (
        <PickExperience
          flightDetails={selectedFlight}
          onComplete={handleComplete}
          onBack={handleBack}
        />
      )}
    </>
  );
};

export default Index;
