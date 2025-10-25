import { useState } from "react";
import { Dashboard } from "@/components/Dashboard";
import { PreparationView } from "@/components/PreparationView";
import { PickExperience } from "@/components/PickExperience";
import { mockFlights, mockFlightDetails } from "@/data/mockData";
import { FlightDetails } from "@/types/flight";

type View = "dashboard" | "preparation" | "picking";

const Index = () => {
  const [currentView, setCurrentView] = useState<View>("dashboard");
  const [selectedFlight, setSelectedFlight] = useState<FlightDetails | null>(null);

  const handleStartPickRun = (flightNumber: string) => {
    const flightDetails = mockFlightDetails[flightNumber];
    if (flightDetails) {
      setSelectedFlight(flightDetails);
      setCurrentView("preparation");
    }
  };

  const handleStartRun = () => {
    setCurrentView("picking");
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

  return (
    <>
      {currentView === "dashboard" && (
        <Dashboard flights={mockFlights} onStartPickRun={handleStartPickRun} />
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
