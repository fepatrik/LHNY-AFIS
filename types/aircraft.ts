export type AircraftState = 
  | 'apron'
  | 'taxiing'
  | 'holdingPoint'
  | 'visualCircuit'
  | 'trainingBox'
  | 'crossCountry'
  | 'localIR';

export type AircraftStatus = 'DUAL' | 'SOLO';
export type AircraftTGStatus = 'T/G' | 'F/S';

export interface AircraftTimestamps {
  takeoff?: string;
  landed?: string;
}

export interface LocalIRDetails {
  procedure: string;
  height: string;
  clearance: string;
}

export interface TrainingBoxDetails {
  taskHeight: string;
}

export interface FlightLogEntry {
  serial: number;
  reg: string;
  takeoff: string | "";
  landed: string | "";
  squawk: string;
  crew: string;
  soloAtLanding?: boolean;
}

export interface MovementConfig {
  from: AircraftState;
  to: AircraftState;
  onMove?: (reg: string, context: MovementContext) => void;
  resetTimestamp?: boolean;
}

export interface MovementContext {
  timestamps: { [reg: string]: AircraftTimestamps };
  aircraftStatuses: { [reg: string]: AircraftStatus };
  aircraftTGStatus: { [reg: string]: AircraftTGStatus };
  localIRDetails: { [reg: string]: LocalIRDetails };
  trainingBox: { [reg: string]: string };
  foreignAircrafts: Set<string>;
  isNightMode: boolean;
  edgeLights: { [reg: string]: boolean };
  approachLights: { [reg: string]: boolean };
  getCurrentTime: () => string;
  updateLandingTime: (reg: string, landed: string) => void;
  addFlightLog: (reg: string, takeoff: string | "", landed: string | "", squawk: string, crew: string) => void;
}

