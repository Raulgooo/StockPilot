export interface Flight {
  flightNumber: string;
  destination: string;
  departureTime: string;
}

export interface Product {
  productName: string;
  category: string;
  categoryQuantity: number;
  priorityLot: string;
}

export interface FlightDetails {
  flightNumber: string;
  destination: string;
  departureTime: string;
  products: Product[];
}
