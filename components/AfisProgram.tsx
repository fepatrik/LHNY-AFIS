'use client';

import React, { useEffect, useRef, useState } from "react";
import { AIRSPACES, Airspace } from "../config/airspace";
import { CROSS_COUNTRY_DESTINATIONS } from "../config/crossCountryDestinations";
// Move localIRDetails state definition to the top-level (outside the component) to persist between renders
const localIRDetailsStore: { [key: string]: { procedure: string; height: string; clearance: string } } = {};
const DEFAULT_APRON = ["TUR", "TUP", "TUQ", "BEC", "BED", "BEZ", "BJD", "BAK", "BFI", "BFJ", "BJC", "BJA","BEY", "BFE", "BIY", "SKV", "SJK", "SUK", "PPL", "BAF", "SLW"];

const AfisProgram = () => {
  const [taxiing, setTaxiing] = useState<string[]>([]);
  const [holdingPoint, setHoldingPoint] = useState<string[]>([]);
  const [visualCircuit, setVisualCircuit] = useState<string[]>([]);
  const [trainingBox, setTrainingBox] = useState<{ [key: string]: string }>({});
  const [crossCountry, setCrossCountry] = useState<string[]>([]);
  const [apron, setApron] = useState(DEFAULT_APRON);
  const [newReg, setNewReg] = useState<string>("");
  const [localIR, setLocalIR] = useState<string[]>([]);
  const [localIRDetails, setLocalIRDetails] = useState<{ [key: string]: { procedure: string; height: string; clearance: string } }>(() => ({ ...localIRDetailsStore }));
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedAircraft, setSelectedAircraft] = useState<string>("");
  const [crossCountryFrequency, setCrossCountryFrequency] = useState<{ [key: string]: boolean }>({});
  const [timestamps, setTimestamps] = useState<{ [key: string]: { takeoff?: string; landed?: string } }>({});
  const [scale, setScale] = useState(1); // Új állapot a csúszka értékéhez
  const [searchTerm, setSearchTerm] = useState<string>(""); // Keresési kifejezés
  const [boxWidth, setBoxWidth] = useState(180); // Alapértelmezett szélesség 180px
  const [qnh, setQnh] = useState<number>(1013); // QNH állapot
  const [trainingBoxDetails, setTrainingBoxDetails] = useState<{ [reg: string]: { taskHeight: string } }>({});
  const [showTable, setShowTable] = useState(true);
  const [flightLog, setFlightLog] = useState<{ reg: string; takeoff: string | ""; landed: string | "" }[]>([]);
  const [aircraftStatuses, setAircraftStatuses] = useState<{ [key: string]: 'DUAL' | 'SOLO' }>({});
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
  const [aircraftTGStatus, setAircraftTGStatus] = useState<{ [key: string]: 'T/G' | 'F/S' }>({});
  const [isCrewSquawkModalOpen, setIsCrewSquawkModalOpen] = useState(false);
  const [modalReg, setModalReg] = useState<string>("");
  const [modalCrew, setModalCrew] = useState<string>("");
  const [modalSquawk, setModalSquawk] = useState<string>("");
  const [timeOffset, setTimeOffset] = useState<number>(2); // Időzóna korrekció, alapból +2
  const [isTakeoffModalOpen, setIsTakeoffModalOpen] = useState(false);
  const [modalTakeoffReg, setModalTakeoffReg] = useState<string>("");
  const [modalTakeoffValue, setModalTakeoffValue] = useState<string>("");
  const [isAddForeignAircraftModalOpen, setIsAddForeignAircraftModalOpen] = useState(false);
  const [foreignAircraftReg, setForeignAircraftReg] = useState("");
  const [foreignAircraftOnFreq, setForeignAircraftOnFreq] = useState(true);
  const [foreignAircrafts, setForeignAircrafts] = useState<Set<string>>(new Set());
  // Dinamikus légterek állapota - a config/airspace.ts fájlból származik
  const [airspaceStatuses, setAirspaceStatuses] = useState<{ [key: string]: boolean }>(() => {
    const initial: { [key: string]: boolean } = {};
    AIRSPACES.forEach(airspace => {
      initial[airspace.id] = false;
    });
    return initial;
  });
  const [isNightMode, setIsNightMode] = useState(false);
  const [edgeLights, setEdgeLights] = useState<{ [reg: string]: boolean }>({});
  const [approachLights, setApproachLights] = useState<{ [reg: string]: boolean }>({});
  const [showTimeDisplay, setShowTimeDisplay] = useState(true); // Kapcsoló a takeoff/landed idő kijelzéséhez
  const [crossCountryProceedingTo, setCrossCountryProceedingTo] = useState<{ [reg: string]: string }>({});
  const [ccAutocompleteOpenFor, setCcAutocompleteOpenFor] = useState<string | null>(null);
  const [destinationUsage, setDestinationUsage] = useState<{ [destination: string]: number }>({});
  const [actionLog, setActionLog] = useState<number[]>([]); // Timestamp-ek (UTC ms), majd timeOffset-tel korrigáljuk
  const [hoveredWorkloadPoint, setHoveredWorkloadPoint] = useState<number | null>(null); // Hover state a workload grafikonhoz
  const [workloadIntervalMinutes, setWorkloadIntervalMinutes] = useState<number>(10); // Átlagolási intervallum percekben (5, 10, 15, 30)

  // Persistens "Proceeding to" használati statisztika (localStorage)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("afis2.ccDestinationUsage");
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== "object") return;
      setDestinationUsage(parsed as { [destination: string]: number });
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("afis2.ccDestinationUsage", JSON.stringify(destinationUsage));
    } catch {
      // ignore
    }
  }, [destinationUsage]);

  const openAddForeignAircraftModal = () => {
    setIsAddForeignAircraftModalOpen(true);
    setForeignAircraftReg("");
    setForeignAircraftOnFreq(true);
  };

  const closeAddForeignAircraftModal = () => {
    setIsAddForeignAircraftModalOpen(false);
    setForeignAircraftReg("");
    setForeignAircraftOnFreq(true);
  };

  const handleAddForeignAircraft = () => {
    if (!foreignAircraftReg.trim()) return;
    
    const regToAdd = foreignAircraftReg.toUpperCase();

    // Check all possible lists for duplicate registration
    if (
      crossCountry.includes(regToAdd) ||
      apron.includes(regToAdd) ||
      taxiing.includes(regToAdd) ||
      holdingPoint.includes(regToAdd) ||
      visualCircuit.includes(regToAdd) ||
      localIR.includes(regToAdd) ||
      Object.keys(trainingBox).includes(regToAdd)
    ) {
      alert("This registration already exists dumbass!");
      return;
    }
    
    setCrossCountry(prev => [...prev, regToAdd]);
    setCrossCountryFrequency(prev => ({
      ...prev,
      [regToAdd]: foreignAircraftOnFreq
    }));
    setForeignAircrafts(prev => new Set(prev).add(regToAdd));
    closeAddForeignAircraftModal();
  };

  const openCrewSquawkModal = (reg: string) => {
    setModalReg(reg);
    setModalCrew(detailedFlightLog.find((entry) => entry.reg === reg)?.crew || "");
    setModalSquawk(detailedFlightLog.find((entry) => entry.reg === reg)?.squawk || "");
    setIsCrewSquawkModalOpen(true);
  };

  const closeCrewSquawkModal = () => {
    setIsCrewSquawkModalOpen(false);
    setModalReg("");
    setModalCrew("");
    setModalSquawk("");
  };

  const saveCrewSquawk = () => {
    setDetailedFlightLog((prevLog) =>
      prevLog.map((entry) =>
        entry.reg === modalReg
          ? {
              ...entry,
              crew: entry.crew || modalCrew, // Only update if crew is empty
              squawk: entry.squawk || modalSquawk, // Only update if squawk is empty
            }
          : entry
      )
    );
    closeCrewSquawkModal();
  };

  const [detailedFlightLog, setDetailedFlightLog] = useState<{
    serial: number;
    reg: string;
    takeoff: string | "";
    landed: string | "";
    squawk: string;
    crew: string;
    soloAtLanding?: boolean; // Új mező: SOLO volt-e a leszálláskor
  }[]>([]);

  const [startNumber, setStartNumber] = useState(1); // State for starting number
  const [isStartNumberModalOpen, setIsStartNumberModalOpen] = useState(false); // State for modal visibility

  const handleStartNumberChange = (value: string) => {
    const parsedValue = parseInt(value, 10);
    if (!isNaN(parsedValue) && parsedValue > 0) {
      setStartNumber(parsedValue);
    }
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const addFlightLog = (reg: string, takeoff: string | "", landed: string | "", squawk: string, crew: string) => {
    setDetailedFlightLog((prevLog) => [
      ...prevLog,
      {
        serial: prevLog.length + 1,
        reg,
        takeoff,
        landed,
        squawk,
        crew,
      },
    ]);
  };
  
  const updateLandingTime = (reg: string, landed: string) => {
    setDetailedFlightLog((prevLog) =>
      prevLog.map((entry) =>
        entry.reg === reg && !entry.landed // Csak ha még nincs landolási idő
          ? { ...entry, landed, soloAtLanding: aircraftStatuses[reg] === 'SOLO' } // SOLO állapot mentése
          : entry // Egyébként érintetlenül hagyjuk
      )
    );
  };

  // --- UNDO (utolsó cselekedet visszavonása) ---
  type UndoSnapshot = {
    taxiing: string[];
    holdingPoint: string[];
    visualCircuit: string[];
    trainingBox: { [key: string]: string };
    crossCountry: string[];
    apron: string[];
    localIR: string[];
    localIRDetails: { [key: string]: { procedure: string; height: string; clearance: string } };
    crossCountryFrequency: { [key: string]: boolean };
    timestamps: { [key: string]: { takeoff?: string; landed?: string } };
    trainingBoxDetails: { [reg: string]: { taskHeight: string } };
    detailedFlightLog: any[];
    aircraftStatuses: { [key: string]: 'DUAL' | 'SOLO' };
    aircraftTGStatus: { [key: string]: 'T/G' | 'F/S' };
    foreignAircrafts: string[];
    airspaceStatuses: { [key: string]: boolean };
    isNightMode: boolean;
    edgeLights: { [reg: string]: boolean };
    approachLights: { [reg: string]: boolean };
    qnh: number;
    timeOffset: number;
    showTimeDisplay: boolean;
    crossCountryProceedingTo: { [reg: string]: string };
    destinationUsage: { [destination: string]: number };
  };

  const undoStackRef = useRef<UndoSnapshot[]>([]);
  const UNDO_LIMIT = 50;

  const pushUndoSnapshot = () => {
    const snap: UndoSnapshot = {
      taxiing: [...taxiing],
      holdingPoint: [...holdingPoint],
      visualCircuit: [...visualCircuit],
      trainingBox: { ...trainingBox },
      crossCountry: [...crossCountry],
      apron: [...apron],
      localIR: [...localIR],
      localIRDetails: { ...localIRDetails },
      crossCountryFrequency: { ...crossCountryFrequency },
      timestamps: { ...timestamps },
      trainingBoxDetails: { ...trainingBoxDetails },
      detailedFlightLog: [...detailedFlightLog],
      aircraftStatuses: { ...aircraftStatuses },
      aircraftTGStatus: { ...aircraftTGStatus },
      foreignAircrafts: Array.from(foreignAircrafts),
      airspaceStatuses: { ...airspaceStatuses },
      isNightMode,
      edgeLights: { ...edgeLights },
      approachLights: { ...approachLights },
      qnh,
      timeOffset,
      showTimeDisplay,
      crossCountryProceedingTo: { ...crossCountryProceedingTo },
      destinationUsage: { ...destinationUsage },
    };

    undoStackRef.current.push(snap);
    if (undoStackRef.current.length > UNDO_LIMIT) {
      undoStackRef.current = undoStackRef.current.slice(-UNDO_LIMIT);
    }
  };

  const undoLastAction = () => {
    const snap = undoStackRef.current.pop();
    if (!snap) return;

    setTaxiing(snap.taxiing);
    setHoldingPoint(snap.holdingPoint);
    setVisualCircuit(snap.visualCircuit);
    setTrainingBox(snap.trainingBox);
    setCrossCountry(snap.crossCountry);
    setApron(snap.apron);
    setLocalIR(snap.localIR);

    Object.assign(localIRDetailsStore, snap.localIRDetails);
    setLocalIRDetails({ ...localIRDetailsStore });

    setCrossCountryFrequency(snap.crossCountryFrequency);
    setTimestamps(snap.timestamps);
    setTrainingBoxDetails(snap.trainingBoxDetails);
    setDetailedFlightLog(snap.detailedFlightLog as any);
    setAircraftStatuses(snap.aircraftStatuses);
    setAircraftTGStatus(snap.aircraftTGStatus);
    setForeignAircrafts(new Set(snap.foreignAircrafts));
    setAirspaceStatuses(snap.airspaceStatuses);
    setIsNightMode(snap.isNightMode);
    setEdgeLights(snap.edgeLights);
    setApproachLights(snap.approachLights);
    setQnh(snap.qnh);
    setTimeOffset(snap.timeOffset);
    setShowTimeDisplay(snap.showTimeDisplay);
    setCrossCountryProceedingTo(snap.crossCountryProceedingTo);
    setDestinationUsage(snap.destinationUsage);
  };

  // Unified aircraft movement system - consolidates all moveto functions
  const moveAircraft = (
    reg: string,
    from: 'apron' | 'taxiing' | 'holdingPoint' | 'visualCircuit' | 'trainingBox' | 'crossCountry' | 'localIR',
    to: 'apron' | 'taxiing' | 'holdingPoint' | 'visualCircuit' | 'trainingBox' | 'crossCountry' | 'localIR',
    options?: {
      resetTimestamp?: boolean;
      handleLanding?: boolean;
      handleTakeoff?: boolean;
      squawk?: string;
      crew?: string;
      trainingBoxValue?: string;
      resetStatuses?: boolean;
      initializeNightLights?: boolean;
      setCrossCountryFreq?: boolean;
    }
  ) => {
    pushUndoSnapshot();
    // Log action for workload tracking (UTC timestamp, majd timeOffset-tel korrigáljuk)
    try {
      setActionLog((prev) => [...prev, Date.now()]);
    } catch (e) {
      // ignore errors in logging
    }
    // Remove from source
    const stateSetters: Record<string, any> = {
      apron: setApron,
      taxiing: setTaxiing,
      holdingPoint: setHoldingPoint,
      visualCircuit: setVisualCircuit,
      trainingBox: setTrainingBox,
      crossCountry: setCrossCountry,
      localIR: setLocalIR,
    };

    if (from === 'trainingBox') {
      setTrainingBox((prev) => {
        const copy = { ...prev };
        delete copy[reg];
        return copy;
      });
    } else {
      stateSetters[from]((prev: string[]) => prev.filter((r) => r !== reg));
    }

    // Add to target
    if (to === 'trainingBox' && options?.trainingBoxValue) {
      setTrainingBox((prev) => ({ ...prev, [reg]: options.trainingBoxValue! }));
    } else if (to !== 'trainingBox') {
      stateSetters[to]((prev: string[]) => [...prev, reg]);
    }

    // Handle options
    if (options?.resetTimestamp) {
      setTimestamps((prev) => {
        const updated = { ...prev };
        delete updated[reg];
        return updated;
      });
    }

    if (options?.handleLanding) {
      const landedTime = getCurrentTime();
      setTimestamps((prev) => ({
        ...prev,
        [reg]: { ...prev[reg], landed: landedTime },
      }));
      if (foreignAircrafts.has(reg)) {
        addFlightLog(reg, '', landedTime, '', '');
      } else {
        updateLandingTime(reg, landedTime);
      }
    }

    if (options?.handleTakeoff) {
      const takeoffTime = getCurrentTime();
      setTimestamps((prev) => ({
        ...prev,
        [reg]: { ...prev[reg], takeoff: takeoffTime },
      }));
      if (!foreignAircrafts.has(reg)) {
        addFlightLog(reg, takeoffTime, '', options.squawk || '', options.crew || '');
      } else {
        setDetailedFlightLog((prevLog) =>
          prevLog.map((entry) =>
            entry.reg === reg && !entry.takeoff
              ? { ...entry, takeoff: takeoffTime }
              : entry
          )
        );
      }
    }

    if (options?.resetStatuses) {
      setAircraftStatuses((prev) => ({ ...prev, [reg]: 'DUAL' }));
      setAircraftTGStatus((prev) => ({ ...prev, [reg]: 'T/G' }));
    }

    if (options?.initializeNightLights && isNightMode) {
      setEdgeLights((prev) => ({ ...prev, [reg]: true }));
      setApproachLights((prev) => ({ ...prev, [reg]: true }));
    }

    if (options?.setCrossCountryFreq) {
      setCrossCountryFrequency((prev) => ({ ...prev, [reg]: true }));
    }
  };

  // Refactored movement functions using the unified system
  const moveToTaxiingFromCrossCountry = (reg: string) => {
    moveAircraft(reg, 'crossCountry', 'taxiing', {
      handleLanding: true,
      resetStatuses: true,
    });
  };

  const moveFirstToLast = () => {
    pushUndoSnapshot();
    setVisualCircuit((prev) => {
      if (prev.length === 0) return prev; // Ha üres, ne csináljon semmit
      const updated = [...prev];
      const first = updated.shift(); // Az első elem eltávolítása
      if (first) updated.push(first); // Az elsőt a lista végére helyezzük
      return updated;
    });
  };

  const handleSquawkChange = (serial: number, newSquawk: string) => {
    setDetailedFlightLog((prevLog) =>
      prevLog.map((entry) =>
        entry.serial === serial ? { ...entry, squawk: newSquawk } : entry
      )
    );
  };

  const handleCrewChange = (serial: number, newCrew: string) => {
    setDetailedFlightLog((prevLog) =>
      prevLog.map((entry) =>
        entry.serial === serial ? { ...entry, crew: newCrew } : entry
      )
    );
  };

  const toggleTGFSStatus = (reg: string) => {
    pushUndoSnapshot();
    setAircraftTGStatus((prevStatuses) => {
      const currentStatus = prevStatuses[reg] || 'T/G';
      const newStatus = currentStatus === 'T/G' ? 'F/S' : 'T/G';
      return {
        ...prevStatuses,
        [reg]: newStatus,
      };
    });
  };


// Function to toggle the status of an aircraft
const toggleAircraftStatus = (reg: string) => {
  pushUndoSnapshot();
  setAircraftStatuses((prevStatuses) => {
    const currentStatus = prevStatuses[reg] || 'DUAL';
    const newStatus = currentStatus === 'DUAL' ? 'SOLO' : 'DUAL';
    return {
      ...prevStatuses,
      [reg]: newStatus,
    };
  });
};


const styles = {
  container:
  {
    display: "flex",
    gap: `${15 * scale}px`,
    flexWrap: "wrap",
    justifyContent: "flex-start",
    marginBottom: `${2 * scale}px`,
  } as React.CSSProperties,
  aircraftCard: {
    flexBasis: "unset", // Eltávolítjuk a százalékos flexBasis-t
    width: `${boxWidth}px`, // Fix szélesség minden kártyára
    maxWidth: `${boxWidth}px`,
    minWidth: `${boxWidth}px`,
    minHeight: `${20 * scale}px`,
    border: `${3 * scale}px solid white`,
    borderRadius: `${15 * scale}px`,
    padding: `${10 * scale}px`,
    margin: `${5 * scale}px`,
    textAlign: "center",
    boxSizing: "border-box",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    color: "white",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    fontSize: `${18 * scale}px`,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  } as React.CSSProperties,
};

// Idő eltolás segédfüggvény
const getOffsetTime = (time: string) => {
  if (!time) return "";
  // Feltételezzük, hogy a time formátuma HH:MM
  const [h, m] = time.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return time;
  let newHour = h + timeOffset;
  if (newHour < 0) newHour += 24;
  if (newHour > 23) newHour -= 24;
  return `${newHour.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
};

  const moveToCrossCountryFromApron = (reg: string) => {
    moveAircraft(reg, 'apron', 'crossCountry');
  };

  const moveToHoldingPointFromApron = (reg: string) => {
    moveAircraft(reg, 'apron', 'holdingPoint', { resetTimestamp: true });
  };

  const moveToLocalIRFromTrainingBox = (reg: string) => {
    moveAircraft(reg, 'trainingBox', 'localIR');
    setLocalIRDetails((prev) => ({
      ...prev,
      [reg]: { procedure: 'Local IR', height: '', clearance: '' },
    }));
  };

  const moveToHoldingPoint = (reg: string) => {
    moveAircraft(reg, 'taxiing', 'holdingPoint', { resetTimestamp: true });
  };

  const moveBackToTaxiing = (reg: string) => {
    moveAircraft(reg, 'holdingPoint', 'taxiing', { resetTimestamp: true });
  };

  const moveToVisualFromHolding = (reg: string, squawk: string, crew: string) => {
    moveAircraft(reg, 'holdingPoint', 'visualCircuit', {
      handleTakeoff: true,
      squawk,
      crew,
      initializeNightLights: true,
    });
  };

  const moveToTaxiingFromLocalIR = (reg: string) => {
    moveAircraft(reg, 'localIR', 'taxiing', {
      handleLanding: true,
      resetStatuses: true,
    });
  };

  const moveToTaxiingFromVisual = (reg: string) => {
    moveAircraft(reg, 'visualCircuit', 'taxiing', {
      handleLanding: true,
      resetStatuses: true,
    });
  };

const resetSizes = () => {
  setScale(1);     // Alapértelmezett skála
  setBoxWidth(180); // Alapértelmezett szélesség
};

  const resetForNewDay = () => {
    const ok = window.confirm("This will clear ALL displayed data and start a new day. Continue?");
    if (!ok) return;

    // Clear persisted storage
    try {
      localStorage.removeItem("afis2.appState.v1");
      localStorage.removeItem("afis2.ccDestinationUsage");
    } catch {
      // ignore
    }

    // Clear undo history
    undoStackRef.current = [];

    // Reset all operational state
    setTaxiing([]);
    setHoldingPoint([]);
    setVisualCircuit([]);
    setTrainingBox({});
    setCrossCountry([]);
    setApron([...DEFAULT_APRON]);
    setNewReg("");
    setLocalIR([]);

    Object.keys(localIRDetailsStore).forEach((k) => delete localIRDetailsStore[k]);
    setLocalIRDetails({});

    setCrossCountryFrequency({});
    setTimestamps({});
    setTrainingBoxDetails({});
    setCrossCountryProceedingTo({});
    setDestinationUsage({});

    setShowTable(true);
    setDetailedFlightLog([]);
    setAircraftStatuses({});
    setAircraftTGStatus({});
    setForeignAircrafts(new Set());
    setForeignAircraftReg("");
    setForeignAircraftOnFreq(true);
    setIsAddForeignAircraftModalOpen(false);

    setMisappState({});

    // Reset airspace / night / lights
    setAirspaceStatuses(() => {
      const initial: { [key: string]: boolean } = {};
      AIRSPACES.forEach((airspace) => {
        initial[airspace.id] = false;
      });
      return initial;
    });
    setIsNightMode(false);
    setEdgeLights({});
    setApproachLights({});

    // Reset common controls
    setQnh(1013);
    setTimeOffset(2);
    setShowTimeDisplay(true);
    
    // Reset workload log
    setActionLog([]);

    // Close modals
    setIsModalOpen(false);
    setSelectedAircraft("");
    setIsHelpModalOpen(false);
    setIsCrewSquawkModalOpen(false);
    setModalReg("");
    setModalCrew("");
    setModalSquawk("");
    setIsTakeoffModalOpen(false);
    setModalTakeoffReg("");
    setModalTakeoffValue("");
    setIsStartNumberModalOpen(false);
    setStartNumber(1);
    setCcAutocompleteOpenFor(null);
  };

  const moveToVisualCircuitFromLocalIR = (reg: string) => {
    moveAircraft(reg, 'localIR', 'visualCircuit', {
      initializeNightLights: true,
    });
  };

const addAircraftToApron = () => {
  if (!newReg) return; // Ha nincs megadva lajstrom, ne csináljon semmit

  // Ellenőrizze, hogy létezik-e már a lajstrom
  if (apron.includes(newReg)) {
    alert("This registration already exists you dumbass!");
    return;
  }

  // Ha nem létezik, adjuk hozzá
  setApron([...apron, newReg]);
  setNewReg(""); // Törölje az input mezőt
};

  const moveToTaxiFromApron = (reg: string) => {
    moveAircraft(reg, 'apron', 'taxiing', { resetTimestamp: true });
  };

  const moveBackToApron = (reg: string) => {
    moveAircraft(reg, 'taxiing', 'apron', { resetTimestamp: true });
  };

  const moveToTrainingBox = (reg: string, box: string) => {
    // Remove from multiple states
    setVisualCircuit((prev) => prev.filter((r) => r !== reg));
    setLocalIR((prev) => prev.filter((r) => r !== reg));
    moveAircraft(reg, 'visualCircuit', 'trainingBox', { trainingBoxValue: box });
  };

  const moveToLocalIR = (reg: string) => {
    moveAircraft(reg, 'visualCircuit', 'localIR');
    if (!localIRDetails[reg]) {
      const updated = { ...localIRDetails, [reg]: { procedure: '---', height: '', clearance: '' } };
      persistLocalIRDetails(updated);
    }
  };

  const moveToCrossCountry = (reg: string) => {
    // Remove from all states
    setTrainingBox((prev) => {
      const copy = { ...prev };
      delete copy[reg];
      return copy;
    });
    setVisualCircuit((prev) => prev.filter((r) => r !== reg));
    setLocalIR((prev) => prev.filter((r) => r !== reg));
    setHoldingPoint((prev) => prev.filter((r) => r !== reg));
    setTaxiing((prev) => prev.filter((r) => r !== reg));
    moveAircraft(reg, 'visualCircuit', 'crossCountry', { setCrossCountryFreq: true });
  };

  const moveToLocalIRFromCrossCountry = (reg: string) => {
    moveAircraft(reg, 'crossCountry', 'localIR');
    if (!localIRDetails[reg]) {
      const updated = { ...localIRDetails, [reg]: { procedure: '---', height: '', clearance: '' } };
      persistLocalIRDetails(updated);
    }
  };

  const moveToVisualFromTrainingBox = (reg: string) => {
    moveAircraft(reg, 'trainingBox', 'visualCircuit', {
      initializeNightLights: true,
    });
  };

  const moveToVisualFromCrossCountry = (reg: string) => {
    moveAircraft(reg, 'crossCountry', 'visualCircuit', {
      initializeNightLights: true,
    });
  };

  const removeAircraftCompletely = (reg: string) => {
    pushUndoSnapshot();

    // Remove from all locations (safe even if not present)
    setTaxiing((prev) => prev.filter((r) => r !== reg));
    setHoldingPoint((prev) => prev.filter((r) => r !== reg));
    setVisualCircuit((prev) => prev.filter((r) => r !== reg));
    setCrossCountry((prev) => prev.filter((r) => r !== reg));
    setApron((prev) => prev.filter((r) => r !== reg));
    setLocalIR((prev) => prev.filter((r) => r !== reg));

    setTrainingBox((prev) => {
      const copy = { ...prev };
      delete copy[reg];
      return copy;
    });

    // Clear per-aircraft data maps
    setCrossCountryFrequency((prev) => {
      const copy = { ...prev };
      delete copy[reg];
      return copy;
    });
    setCrossCountryProceedingTo((prev) => {
      const copy = { ...prev };
      delete copy[reg];
      return copy;
    });
    // NOTE: timestamps/log idők maradjanak meg (kérésre), ezért nem töröljük őket itt
    setTrainingBoxDetails((prev) => {
      const copy = { ...prev };
      delete copy[reg];
      return copy;
    });
    setAircraftStatuses((prev) => {
      const copy = { ...prev };
      delete copy[reg];
      return copy;
    });
    setAircraftTGStatus((prev) => {
      const copy = { ...prev };
      delete copy[reg];
      return copy;
    });
    setEdgeLights((prev) => {
      const copy = { ...prev };
      delete copy[reg];
      return copy;
    });
    setApproachLights((prev) => {
      const copy = { ...prev };
      delete copy[reg];
      return copy;
    });
    setMisappState((prev) => {
      const copy = { ...prev };
      delete copy[reg];
      return copy;
    });

    // Remove from localIR details store/state
    if (localIRDetailsStore[reg]) {
      delete localIRDetailsStore[reg];
      setLocalIRDetails({ ...localIRDetailsStore });
    }

    // NOTE: logokat nem törlünk (kérésre), hogy a fel-/leszállási idők megmaradjanak

    // Remove from foreign set (if present)
    setForeignAircrafts((prev) => {
      const next = new Set(prev);
      next.delete(reg);
      return next;
    });
  };

  // Helper to persist localIRDetails to the store and state
  const persistLocalIRDetails = (newDetails: { [key: string]: { procedure: string; height: string; clearance: string } }) => {
    Object.assign(localIRDetailsStore, newDetails);
    setLocalIRDetails({ ...localIRDetailsStore });
  };

  // Update handleLocalIRChange to use persistLocalIRDetails
  const handleLocalIRChange = (reg: string, field: 'procedure' | 'height' | 'clearance', value: string) => {
    const updated = {
      ...localIRDetails,
      [reg]: {
        ...localIRDetails[reg],
        [field]: value
      }
    };
    persistLocalIRDetails(updated);
  };

  const openModal = (reg: string) => {
    setSelectedAircraft(reg);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAircraft("");
  };

  const handleTrainingBoxSelection = (box: string) => {
    moveToTrainingBox(selectedAircraft, box);
    closeModal();
  };

  const moveLeft = (reg: string) => {
    pushUndoSnapshot();
    const idx = visualCircuit.indexOf(reg);
    if (idx > 0) {
      const newVC = [...visualCircuit];
      [newVC[idx - 1], newVC[idx]] = [newVC[idx], newVC[idx - 1]];
      setVisualCircuit(newVC);
    }
  };

  const moveRight = (reg: string) => {
    pushUndoSnapshot();
    const idx = visualCircuit.indexOf(reg);
    if (idx < visualCircuit.length - 1) {
      const newVC = [...visualCircuit];
      [newVC[idx + 1], newVC[idx]] = [newVC[idx], newVC[idx + 1]]; // A sorrend megcserélve
      setVisualCircuit(newVC);
    }
  };

// Add these functions before renderAircraft

const openTakeoffModal = (reg: string) => {
  setModalTakeoffReg(reg);
  // Always show the corrected (local) time in the modal input
  const raw = timestamps[reg]?.takeoff || "";
  let local = raw;
  if (raw && raw.match(/^\d{2}:\d{2}$/)) {
    const [h, m] = raw.split(":").map(Number);
    let localHour = h + timeOffset;
    if (localHour < 0) localHour += 24;
    if (localHour > 23) localHour -= 24;
    local = `${localHour.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  }
  setModalTakeoffValue(local);
  setIsTakeoffModalOpen(true);
};

const closeTakeoffModal = () => {
  setIsTakeoffModalOpen(false);
  setModalTakeoffReg("");
  setModalTakeoffValue("");
};

const saveTakeoffModal = () => {
  if (!modalTakeoffReg) return;

  // Convert modalTakeoffValue (which is in corrected time) back to UTC (uncorrected) before saving
  let corrected = modalTakeoffValue;
  if (corrected && corrected.match(/^\d{2}:\d{2}$/)) {
    const [h, m] = corrected.split(":").map(Number);
    let utcHour = h - timeOffset;
    if (utcHour < 0) utcHour += 24;
    if (utcHour > 23) utcHour -= 24;
    corrected = `${utcHour.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  }

  setTimestamps((prev) => ({
    ...prev,
    [modalTakeoffReg]: {
      ...prev[modalTakeoffReg],
      takeoff: corrected,
    },
  }));
  setDetailedFlightLog((prevLog) => {
    const lastIdx = [...prevLog]
      .map((entry, idx) => ({ ...entry, idx }))
      .filter(entry => entry.reg === modalTakeoffReg && entry.takeoff)
      .map(entry => entry.idx)
      .pop();
    if (lastIdx === undefined) return prevLog;
    return prevLog.map((entry, idx) =>
      idx === lastIdx
        ? { ...entry, takeoff: corrected }
        : entry
    );
  });
  closeTakeoffModal();
};

const [misappState, setMisappState] = useState<{ [reg: string]: number }>({});
const misappStates = ["MISSED APP", "HOLDING", "OUTBOUND", "ON FINAL", "2/3 MILES"];

  // --- Persistens app state (ne vesszen el refresh után) ---
  const APP_STATE_KEY = "afis2.appState.v1";
  const hasLoadedAppStateRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(APP_STATE_KEY);
      if (!raw) {
        hasLoadedAppStateRef.current = true;
        return;
      }
      const parsed = JSON.parse(raw) as any;
      if (!parsed || typeof parsed !== "object") {
        hasLoadedAppStateRef.current = true;
        return;
      }

      if (Array.isArray(parsed.taxiing)) setTaxiing(parsed.taxiing);
      if (Array.isArray(parsed.holdingPoint)) setHoldingPoint(parsed.holdingPoint);
      if (Array.isArray(parsed.visualCircuit)) setVisualCircuit(parsed.visualCircuit);
      if (parsed.trainingBox && typeof parsed.trainingBox === "object") setTrainingBox(parsed.trainingBox);
      if (Array.isArray(parsed.crossCountry)) setCrossCountry(parsed.crossCountry);
      if (Array.isArray(parsed.apron)) setApron(parsed.apron);
      if (Array.isArray(parsed.localIR)) setLocalIR(parsed.localIR);

      if (parsed.localIRDetails && typeof parsed.localIRDetails === "object") {
        Object.assign(localIRDetailsStore, parsed.localIRDetails);
        setLocalIRDetails({ ...localIRDetailsStore });
      }

      if (parsed.crossCountryFrequency && typeof parsed.crossCountryFrequency === "object") {
        setCrossCountryFrequency(parsed.crossCountryFrequency);
      }
      if (parsed.timestamps && typeof parsed.timestamps === "object") setTimestamps(parsed.timestamps);
      if (parsed.trainingBoxDetails && typeof parsed.trainingBoxDetails === "object") setTrainingBoxDetails(parsed.trainingBoxDetails);
      if (typeof parsed.showTable === "boolean") setShowTable(parsed.showTable);
      if (typeof parsed.startNumber === "number" && parsed.startNumber > 0) setStartNumber(parsed.startNumber);

      if (Array.isArray(parsed.detailedFlightLog)) setDetailedFlightLog(parsed.detailedFlightLog);
      if (parsed.aircraftStatuses && typeof parsed.aircraftStatuses === "object") setAircraftStatuses(parsed.aircraftStatuses);
      if (parsed.aircraftTGStatus && typeof parsed.aircraftTGStatus === "object") setAircraftTGStatus(parsed.aircraftTGStatus);
      if (Array.isArray(parsed.foreignAircrafts)) setForeignAircrafts(new Set(parsed.foreignAircrafts));

      if (parsed.airspaceStatuses && typeof parsed.airspaceStatuses === "object") setAirspaceStatuses(parsed.airspaceStatuses);
      if (typeof parsed.isNightMode === "boolean") setIsNightMode(parsed.isNightMode);
      if (parsed.edgeLights && typeof parsed.edgeLights === "object") setEdgeLights(parsed.edgeLights);
      if (parsed.approachLights && typeof parsed.approachLights === "object") setApproachLights(parsed.approachLights);

      if (typeof parsed.qnh === "number") setQnh(parsed.qnh);
      if (typeof parsed.timeOffset === "number") setTimeOffset(parsed.timeOffset);
      if (typeof parsed.showTimeDisplay === "boolean") setShowTimeDisplay(parsed.showTimeDisplay);

      if (parsed.crossCountryProceedingTo && typeof parsed.crossCountryProceedingTo === "object") {
        setCrossCountryProceedingTo(parsed.crossCountryProceedingTo);
      }
      if (parsed.destinationUsage && typeof parsed.destinationUsage === "object") {
        setDestinationUsage(parsed.destinationUsage);
      }
      if (parsed.misappState && typeof parsed.misappState === "object") {
        setMisappState(parsed.misappState);
      }

      hasLoadedAppStateRef.current = true;
    } catch {
      hasLoadedAppStateRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedAppStateRef.current) return;

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(() => {
      try {
        const payload = {
          taxiing,
          holdingPoint,
          visualCircuit,
          trainingBox,
          crossCountry,
          apron,
          localIR,
          localIRDetails: localIRDetailsStore,
          crossCountryFrequency,
          timestamps,
          trainingBoxDetails,
          showTable,
          startNumber,
          detailedFlightLog,
          aircraftStatuses,
          aircraftTGStatus,
          foreignAircrafts: Array.from(foreignAircrafts),
          airspaceStatuses,
          isNightMode,
          edgeLights,
          approachLights,
          qnh,
          timeOffset,
          showTimeDisplay,
          crossCountryProceedingTo,
          destinationUsage,
          misappState,
        };
        localStorage.setItem(APP_STATE_KEY, JSON.stringify(payload));
      } catch {
        // ignore
      }
    }, 200);

    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [
    taxiing,
    holdingPoint,
    visualCircuit,
    trainingBox,
    crossCountry,
    apron,
    localIR,
    localIRDetails,
    crossCountryFrequency,
    timestamps,
    trainingBoxDetails,
    showTable,
    startNumber,
    detailedFlightLog,
    aircraftStatuses,
    aircraftTGStatus,
    foreignAircrafts,
    airspaceStatuses,
    isNightMode,
    edgeLights,
    approachLights,
    qnh,
    timeOffset,
    showTimeDisplay,
    crossCountryProceedingTo,
    destinationUsage,
    misappState,
  ]);

const renderAircraft = (
  regs: string[],
  actions:
    | Array<{ label: string; onClick: (reg: string) => void }>
    | ((reg: string) => Array<{ label: string; onClick: (reg: string) => void }>),
  pulsing: boolean = false,
  extraContent?: (reg: string, index?: number) => React.ReactNode,
  isCrossCountry: boolean = false
) => (
  <div className="container" style={styles.container}>
    {regs.map((reg, index) => {
      const resolvedActions = typeof actions === "function" ? actions(reg) : actions;
      // Determine the "On Frequency" status and default if not set
      const onFreq = crossCountryFrequency[reg] ?? true; // Default to true

      // Determine the DUAL/SOLO status and default to DUAL
      const isDual = aircraftStatuses[reg] === 'DUAL' || !aircraftStatuses[reg];

      // Set the border color based on the state
      let borderColor;
      if (isCrossCountry) {
        borderColor = onFreq ? 'limegreen' : 'red'; // Green if "On Frequency" is checked, red otherwise
      } else {
        borderColor = isDual ? 'limegreen' : 'blue'; // Green for DUAL, Blue for SOLO in other cases
      }


      return (
        <div
          key={reg}
          className="aircraftCard"
          style={{
            ...styles.aircraftCard,
            maxWidth: `${boxWidth}px`, // Ensure maxWidth dynamically adjusts to boxWidth
            border: `3px solid ${borderColor}`,
            animation: pulsing ? "pulse 2s infinite" : undefined,
            opacity: isCrossCountry && !onFreq ? 0.5 : 1, // Reduce opacity if not "On Frequency"
          }}
        >
		
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: `${10 * scale}px` }}>
            <div style={{
  fontWeight: "bold",
  fontSize: `${20 * scale}px`,
  flex: 1,
  textAlign: "center",
  cursor: "default", // Change cursor to default
}}
>
  {regs === visualCircuit ? `${index + 1}. ` : ""}{reg}
</div>


			
<button
  onClick={() => toggleTGFSStatus(reg)}
  style={{
    padding: `${4 * scale}px`,
    backgroundColor: aircraftTGStatus[reg] === 'T/G' || !aircraftTGStatus[reg] ? 'green' : 'red',
    color: 'white',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: `${12 * scale}px`,
    marginLeft: `${5 * scale}px`,
  }}
>
  {aircraftTGStatus[reg] || 'T/G'}
</button>
			
            <button
              onClick={() => toggleAircraftStatus(reg)}
              style={{
                padding: `${4 * scale}px`, // Kisebb padding
                backgroundColor: isDual ? 'limegreen' : 'blue',
                color: 'white',
                borderRadius: '4px', // Kisebb border-radius
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: `${12 * scale}px`, // Kisebb betűméret
                marginLeft: `${5 * scale}px`, // Távolság a lajstromtól
              }}
            >
              {isDual ? 'DUAL' : 'SOLO'}
            </button>
          </div>
		  
          {isNightMode && regs === visualCircuit && (
            <div style={{ display: "flex", gap: "5px", marginBottom: "10px" }}>
              <button
                onClick={() => setEdgeLights(prev => ({
                  ...prev,
                  [reg]: !prev[reg]
                }))}
                style={{
                  padding: `${4 * scale}px`,
                  backgroundColor: edgeLights[reg] ? 'green' : 'red',
                  color: 'white',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: `${16 * scale}px`,
                  flex: 1
                }}
              >
                Edge Light
              </button>
              <button
                onClick={() => setApproachLights(prev => ({
                  ...prev,
                  [reg]: !prev[reg]
                }))}
                style={{
                  padding: `${4 * scale}px`,
                  backgroundColor: approachLights[reg] ? 'green' : 'red',
                  color: 'white',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: `${16 * scale}px`,
                  flex: 1
                }}
              >
                Approach Light
              </button>
            </div>
          )}

          {isCrossCountry && (
            <div style={{ marginBottom: `${10 * scale}px` }}>
              <label style={{ fontSize: `${14 * scale}px` }}>
                On Frequency
                <input
                  type="checkbox"
                  checked={onFreq}
                  onChange={() =>
  setCrossCountryFrequency((prev) => {
    const currentStatus = prev[reg] ?? true; // Alapértelmezés: true
    return {
      ...prev,
      [reg]: !currentStatus, // Állapot váltása
    };
  })
}
                  style={{ marginLeft: `${8 * scale}px`, transform: `scale(${1.5 * scale})` }}
                />
              </label>
            </div>
          )}

{trainingBox[reg] && (
  <>
    <div
      style={{ fontSize: `${20 * scale}px`, color: "#ccc", marginBottom: `${10 * scale}px`, cursor: "pointer" }}
      onClick={() => openModal(reg)}
      title="Click to change training box"
    >
      {trainingBox[reg] === "Proceeding to VC" ? "PROCEEDING TO VC" : `TB ${trainingBox[reg]}`}
    </div>

    <input
      type="text"
      placeholder="Task, height"
      value={trainingBoxDetails[reg]?.taskHeight || ""}
      onChange={(e) =>
        setTrainingBoxDetails((prev) => ({
          ...prev,
          [reg]: { ...prev[reg], taskHeight: e.target.value },
        }))
      }
      style={{
        padding: `${6 * scale}px`,
        borderRadius: `${6 * scale}px`,
        color: "black",
        marginBottom: `${8 * scale}px`,
        fontSize: `${20 * scale}px`, // Increased font size
        width: `calc(100% - ${12 * scale}px)`, // Mindkét oldalra 6px margó
        marginLeft: `${6 * scale}px`,
        marginRight: `${6 * scale}px`,
        boxSizing: "border-box",
      }}
    />
  </>
)}


          {localIR.includes(reg) && (
            <>
              <select
                value={localIRDetails[reg]?.procedure || "Local IR"}
                onChange={(e) => handleLocalIRChange(reg, 'procedure', e.target.value)}
                style={{ marginBottom: `${8 * scale}px`, padding: `${6 * scale}px`, borderRadius: `${6 * scale}px`, fontSize: `${16 * scale}px` }}
              >
                {["Local IR", "RNP Z", "RNP Z Circle to Land", "RNP Y", "RNP Y Circle to Land", "VOR", "VOR Circle to Land", "VOR TEMPO", "VOR TEMPO  Circle to Land", "NDB", "NDB Circle to Land", "BOR", "BOR Circle to Land", "NDB NCS", "PERIT 3D", "PERIT 1D", "PERIT 1N", "PERIT 1A", "PERIT1 S", "SENYO 1D","SENYO 2D","KABAL 1D","KABAL 2D"].map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <input
                type="text"
                value={localIRDetails[reg]?.height || ""}
                onChange={(e) => handleLocalIRChange(reg, 'height', e.target.value.toUpperCase())}
                placeholder="Additional remark"
                style={{ 
                  padding: `${6 * scale}px`, 
                  borderRadius: `${6 * scale}px`, 
                  color: 'black', 
                  marginBottom: `${8 * scale}px`, 
                  fontSize: `${20 * scale}px`,
                  textTransform: 'uppercase'
                }}
                onInput={(e) => {
                  const target = e.target as HTMLInputElement;
                  target.value = target.value.toUpperCase();
                }}
              />
              {/* MISAPP/HOLDING/OUTBOUND/ON FINAL/3 MILES button */}
              {["RNP Z", "RNP Y", "VOR", "BOR", "NDB", "VOR TEMPO", "NDB NCS"].includes(localIRDetails[reg]?.procedure) && (
                <button
                  style={{
                    width: "100%",
                    marginBottom: `${8 * scale}px`,
                    padding: `${10 * scale}px`,
                    fontSize: `${18 * scale}px`,
                    fontWeight: "bold",
                    backgroundColor: "#444",
                    color: "white",
                    border: "2px solid #fff",
                    borderRadius: `${8 * scale}px`,
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    setMisappState((prev) => ({
                      ...prev,
                      [reg]: ((prev[reg] ?? 0) + 1) % misappStates.length,
                    }))
                  }
                >
                  {misappStates[misappState[reg] ?? 0]}
                </button>
              )}
            </>
          )}

          {extraContent && extraContent(reg, index)}

          {/* Take-off és Landed idő kijelzése - csak akkor jelenik meg, ha a kapcsoló be van kapcsolva */}
          {showTimeDisplay && timestamps[reg]?.takeoff && (
            <div
              style={{
                fontSize: `${14 * scale}px`,
                color: "white",
                backgroundColor: "black",
                borderRadius: `${6 * scale}px`,
                padding: `${6 * scale}px`,
                fontWeight: "bold",
                marginTop: `${8 * scale}px`,
                boxShadow: "0px 0px 10px rgba(0, 255, 0, 0.6)",
                cursor: "pointer",
                // textDecoration: "underline", // Eltávolítva, hogy ne legyen aláhúzva
              }}
              title="Click to edit takeoff time"
              onClick={() => openTakeoffModal(reg)}
            >
              Take-off: {getOffsetTime(timestamps[reg].takeoff)}
            </div>
          )}
          {showTimeDisplay && timestamps[reg]?.landed && (
            <div style={{
              fontSize: `${14 * scale}px`,
              color: "white",
              backgroundColor: "black",
              borderRadius: `${6 * scale}px`,
              padding: `${6 * scale}px`,
              fontWeight: "bold",
              marginTop: `${8 * scale}px`,
              boxShadow: "0px 0px 10px rgba(0, 0, 255, 0.6)",
            }}>
              Landed: {getOffsetTime(timestamps[reg].landed)}
            </div>
          )}

<div style={{
  display: "grid",
  gridTemplateColumns: "1fr 1fr", // 2 oszlop
  gap: `${6 * scale}px`, // Távolság a gombok között
  marginTop: `${10 * scale}px`
}}>
  {resolvedActions.map(({ label, onClick }, index) => (
    <button
      key={label}
      style={{
        padding: `${8 * scale}px`, // Csökkentett padding
        backgroundColor:
          label === "Return to Stand" ? "#dc3545" :
          label === "Proceed to TB" || label === "Proceed to Local IR" || label === "Proceed to Cross Country" ? "#28a745" :
          label.includes("<--") || label.includes("Vacated") || label.includes("Apron") ? "#dc3545" : "#28a745",
        color: "white",
        fontSize: `${14 * scale}px`, // Csökkentett betűméret
        fontWeight: "bold",
        borderRadius: `${8 * scale}px`, // Csökkentett border-radius
        border: "none",
        cursor: "pointer",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        gridColumn: resolvedActions.length === 1 || resolvedActions.length % 2 !== 0 && index === resolvedActions.length - 1 ? "span 2" : undefined, // Ha egy gomb van, vagy utolsó gomb páratlan számban, töltsön ki két oszlopot
      }}
      onClick={() => onClick(reg)}
    >
      {label}
    </button>
  ))}
</div>
        </div>
      );
    })}
  </div>
);

const getAircraftGroup = (reg: string) => {
  const piperAircraft = ["BAK", "BED", "BJA", "BEC", "BEY","BEZ","BFE","BIY","BJC","BJD","TUP","TUQ","TUR"];
  const cessnaAircraft = ["SUK", "SKV", "SJK", "BAF", "SLW","PPL"];
  const multiAircraft = ["BFJ", "BFI"];

  if (piperAircraft.includes(reg)) return "Piper";
  if (cessnaAircraft.includes(reg)) return "Cessna";
  if (multiAircraft.includes(reg)) return "Multi";
  return "Other";
};

  return (
    <>
      <style>
        {`@keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); }
          50% { box-shadow: 0 0 10px 5px rgba(255, 255, 255, 0.8); }
          100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); }
        }`}
      </style>



<Section title="LHNY AFIS - by Ludwig Schwarz" noMinHeight>
  <div style={{ display: "flex", alignItems: "center", gap: "20px", justifyContent: "space-between" }}>
    {/* Left side: controls */}
    <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
      <div>
        <label style={{ fontWeight: "bold", fontSize: "18px", marginRight: "8px" }}>Timezone correction:</label>
        <input
          type="number"
          min={-9}
          max={9}
          step={1}
          value={timeOffset}
          onChange={e => setTimeOffset(Math.max(-9, Math.min(9, Number(e.target.value))))}
          style={{ width: "60px", fontSize: "18px", textAlign: "center", borderRadius: "6px", padding: "4px" }}
        />
      </div>
      <div>
  <h2>Size:</h2>
  <input
    type="range"
    style={{ width: '150px' }} // Fix szélesség, nem hat a skála
    min="0.5" // 10%-nak megfelelő alsó érték
    max="1.2" // 110%-nak megfelelő felső érték
    step="0.001" // Nagyon finom lépések
    value={scale}
    onChange={(e) => setScale(parseFloat(e.target.value))} // A skálaérték frissítése
  />
</div>
<div>
  <h2>Width:</h2>
   <input
    type="range"
    style={{ width: '600px' }}
    min="150" // Minimum érték 100px
    max="300" // Maximum érték 300px
    step="1" // Lépésköz 1px
    value={boxWidth}
    onChange={(e) => setBoxWidth(parseInt(e.target.value))} // boxWidth frissítése
  />
</div>
    </div>
  </div>
  <p><strong>Changelog: Data is now stored, even after restarting the computer! Start the day with the reset button. Also you can undo the last 50 actions you made. Arriving foreign ACFT working now, and you can remove them after added.</strong></p>
  <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "10px", justifyContent: "space-between" }}>
    {/* Reset/Help buttons left */}
    <div style={{ display: "flex", gap: "6px" }}>
      <button
        style={{
          padding: "6px 12px",
          fontSize: "14px",
          backgroundColor: "#007BFF",
          color: "white",
          borderRadius: "6px",
          border: "none",
          cursor: "pointer",
        }}
        onClick={resetSizes}
      >
        Reset size to default
      </button>

      <button
        style={{
          padding: "6px 12px",
          fontSize: "14px",
          backgroundColor: "#28a745",
          color: "white",
          borderRadius: "6px",
          border: "none",
          cursor: "pointer",
        }}
        onClick={() => setIsHelpModalOpen(true)}
      >
        Help
      </button>
	        <button
        style={{
          padding: "6px 12px",
          fontSize: "14px",
          backgroundColor: "#ff9800",
          color: "black",
          borderRadius: "6px",
          border: "none",
          cursor: "pointer",
          fontWeight: 700,
        }}
        onClick={resetForNewDay}
        title="Clear all data and start a new day"
      >
        New day (reset)
      </button>
      <button
        style={{
          padding: "6px 14px",
          fontSize: "14px",
          letterSpacing: "0.3px",
          backgroundColor: undoStackRef.current.length > 0 ? "#ff3b3b" : "#555",
          color: "white",
          borderRadius: "6px",
          border: undoStackRef.current.length > 0 ? "2px solid rgba(255,255,255,0.65)" : "2px solid rgba(255,255,255,0.2)",
          cursor: undoStackRef.current.length > 0 ? "pointer" : "not-allowed",
          fontWeight: 700,
          textTransform: "uppercase",
          boxShadow: undoStackRef.current.length > 0
            ? "0 4px 12px rgba(255, 0, 0, 0.3), 0 0 0 2px rgba(255, 59, 59, 0.2)"
            : "none",
          transform: undoStackRef.current.length > 0 ? "translateY(-1px)" : "none",
        }}
        onClick={() => {
          if (undoStackRef.current.length === 0) return;
          undoLastAction();
        }}
        title="Undo last action"
      >
        UNDO LAST ACTION
      </button>

    </div>
    {/* QNH and Airspace section */}
    <div style={{ display: "flex", alignItems: "center", gap: "16px", marginLeft: "auto" }}>
      {/* Dinamikusan generált légterek gombjai - a config/airspace.ts fájlból */}
      {AIRSPACES.map((airspace: Airspace) => (
        <button
          key={airspace.id}
          style={{
            padding: "8px 16px",
            fontSize: "16px",
            borderRadius: "8px",
            border: "none",
            background: airspaceStatuses[airspace.id] ? "#28a745" : "#dc3545",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            minWidth: "120px"
          }}
          onClick={() => setAirspaceStatuses((prev) => ({
            ...(pushUndoSnapshot(), {}),
            ...prev,
            [airspace.id]: !prev[airspace.id]
          }))}
        >
          <span style={{ marginBottom: "4px" }}>{airspace.displayName}</span>
          <span>{airspaceStatuses[airspace.id] ? "ACTIVE" : "NOT ACTIVE"}</span>
        </button>
      ))}

      <span style={{ fontWeight: "bold", fontSize: "32px", letterSpacing: "2px" }}>QNH</span>
      <button
        style={{
          padding: "4px 14px",
          fontSize: "24px",
          borderRadius: "8px 0 0 8px",
          border: "2px solid #007BFF",
          background: "#222",
          color: "white",
          fontWeight: "bold",
          cursor: "pointer",
          outline: "none",
        }}
        onClick={() => {
          pushUndoSnapshot();
          setQnh(q => Math.max(900, Number(q) - 1));
        }}
        tabIndex={-1}
      >-</button>
      <input
        type="text"
        value={qnh}
        maxLength={4}
        pattern="\d{4}"
        onChange={e => {
          const val = e.target.value.replace(/\D/g, "").slice(0, 4);
          // Ha van érték, akkor parseInt, ha nincs, akkor marad 1013
          setQnh(val ? parseInt(val, 10) : 1013);
        }}
        style={{
          width: "90px",
          fontSize: "28px",
          textAlign: "center",
          borderRadius: "0",
          padding: "6px",
          background: "#fff",
          color: "#222",
          fontWeight: "bold",
          borderTop: "2px solid #007BFF",
          borderBottom: "2px solid #007BFF",
          borderLeft: "none",
          borderRight: "none",
          outline: "none",
        }}
        inputMode="numeric"
        placeholder="----"
      />
      <button
        style={{
          padding: "4px 14px",
          fontSize: "24px",
          borderRadius: "0 8px 8px 0",
          border: "2px solid #007BFF",
          background: "#222",
          color: "white",
          fontWeight: "bold",
          cursor: "pointer",
          outline: "none",
        }}
        onClick={() => {
          pushUndoSnapshot();
          setQnh(q => Math.min(1100, Number(q) + 1));
        }}
        tabIndex={-1}
      >+</button>
      <button
        style={{
          padding: "8px 16px",
          fontSize: "16px",
          borderRadius: "8px",
          border: "none",
          background: isNightMode ? "#28a745" : "#dc3545",
          color: "white",
          fontWeight: "bold",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minWidth: "120px"
        }}
        onClick={() => {
          pushUndoSnapshot();
          setIsNightMode(!isNightMode);
        }}
      >
        <span style={{ marginBottom: "4px" }}>NIGHT MODE</span>
        <span>{isNightMode ? "ON" : "OFF"}</span>
      </button>
      <button
        style={{
          padding: "8px 16px",
          fontSize: "16px",
          borderRadius: "8px",
          border: "none",
          background: showTimeDisplay ? "#28a745" : "#dc3545",
          color: "white",
          fontWeight: "bold",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minWidth: "120px"
        }}
        onClick={() => {
          pushUndoSnapshot();
          setShowTimeDisplay(!showTimeDisplay);
        }}
      >
        <span style={{ marginBottom: "4px" }}>DISPLAY T.O. TIME</span>
        <span>{showTimeDisplay ? "ON" : "OFF"}</span>
      </button>
    </div>
  </div>
</Section>

<Section title={
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
    <span>Cross Country</span>
    <button
      style={{
        padding: "10px 20px",
        fontSize: "16px",
        backgroundColor: "#007BFF",
        color: "white",
        borderRadius: "8px",
        border: "none",
        cursor: "pointer",
        marginLeft: "20px"
      }}
      onClick={openAddForeignAircraftModal}
    >
      Add arriving foreign aircraft
    </button>
  </div>
}>
  {renderAircraft(
    crossCountry,
    (reg) => {
      const base = [
        { label: "Join VC", onClick: (r: string) => moveToVisualFromCrossCountry(r) },
        { label: "Approach", onClick: (r: string) => moveToLocalIRFromCrossCountry(r) },
        { label: "Vacated", onClick: (r: string) => moveToTaxiingFromCrossCountry(r) },
      ];
      if (foreignAircrafts.has(reg)) {
        base.push({ label: "Remove", onClick: (r: string) => removeAircraftCompletely(r) });
      }
      return base;
    },
    false,
    (reg) => (
      <div style={{ position: "relative", marginTop: `${8 * scale}px` }}>
        <textarea
          style={{
            padding: `${6 * scale}px`,
            borderRadius: `${6 * scale}px`,
            color: "black",
            fontSize: `${20 * scale}px`,
            textTransform: "uppercase",
            width: "100%",
            boxSizing: "border-box",
          }}
          placeholder="Proceeding to..."
          value={crossCountryProceedingTo[reg] || ""}
          onChange={(e) => {
            const val = e.target.value.toUpperCase();
            setCrossCountryProceedingTo((prev) => ({ ...prev, [reg]: val }));
          }}
          onFocus={(e) => {
            setCcAutocompleteOpenFor(reg);
            // Kijelöli az egész szöveget amikor fókuszba kerül
            e.target.select();
          }}
          onBlur={() => {
            // kis késleltetés, hogy kattintás (onMouseDown) még lefusson
            setTimeout(() => {
              setCcAutocompleteOpenFor((cur) => (cur === reg ? null : cur));
            }, 120);
          }}
        />

        {ccAutocompleteOpenFor === reg &&
          (crossCountryProceedingTo[reg] || "").trim().length > 0 && (() => {
            const query = (crossCountryProceedingTo[reg] || "").trim().toUpperCase();
            const suggestions = CROSS_COUNTRY_DESTINATIONS
              .filter((city) => city.toUpperCase().includes(query))
              .sort((a, b) => {
                const au = a.toUpperCase();
                const bu = b.toUpperCase();

                // 1) elsődlegesen: melyik kezdete hasonlít jobban (prefix előre)
                const aPrefix = au.startsWith(query) ? 1 : 0;
                const bPrefix = bu.startsWith(query) ? 1 : 0;
                if (bPrefix !== aPrefix) return bPrefix - aPrefix;

                // 2) másodlagosan: használati gyakoriság
                const ac = destinationUsage[au] || 0;
                const bc = destinationUsage[bu] || 0;
                if (bc !== ac) return bc - ac;

                // 3) végül: név szerint
                return a.localeCompare(b, "hu");
              })
              .slice(0, 10);

            if (suggestions.length === 0) return null;

            return (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  zIndex: 50,
                  marginTop: `${4 * scale}px`,
                  backgroundColor: "#111",
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.25)",
                  borderRadius: `${6 * scale}px`,
                  overflow: "hidden",
                  boxShadow: "0 10px 20px rgba(0,0,0,0.35)",
                  maxHeight: `${220 * scale}px`,
                  overflowY: "auto",
                  // legyen olyan széles, hogy minden kiférjen (ha kell, szélesebb a textarea-nál)
                  width: "max-content",
                  minWidth: "100%",
                  maxWidth: "90vw",
                  whiteSpace: "nowrap",
                  overflowX: "auto",
                }}
              >
                {suggestions.map((city) => (
                  <div
                    key={city}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      const picked = city.toUpperCase();
                      setCrossCountryProceedingTo((prev) => ({ ...prev, [reg]: picked }));
                      setDestinationUsage((prev) => ({
                        ...prev,
                        [picked]: (prev[picked] || 0) + 1,
                      }));
                      setCcAutocompleteOpenFor(null);
                    }}
                    style={{
                      padding: `${8 * scale}px`,
                      cursor: "pointer",
                      fontSize: `${18 * scale}px`,
                      borderBottom: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    {city}
                  </div>
                ))}
              </div>
            );
          })()}
      </div>
    ),
    true
  )}
</Section>

{/* Add this modal component near the other modals */}
  {isAddForeignAircraftModalOpen && (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
    }}
    tabIndex={-1}
    onKeyDown={(e) => {
      if (e.key === "Enter") handleAddForeignAircraft();
      if (e.key === "Escape") closeAddForeignAircraftModal();
    }}
    >
      <div style={{
        backgroundColor: "#222",
        padding: "20px",
        borderRadius: "12px",
        textAlign: "center",
        minWidth: "320px",
        color: "white",
        maxWidth: "75vw",
        width: "100%",
        margin: "0 auto",
        boxSizing: "border-box",
      }}>
        <h3 style={{ fontSize: "20px", marginBottom: "16px" }}>Add Foreign Aircraft</h3>
        <input
          type="text"
          value={foreignAircraftReg}
          onChange={(e) => setForeignAircraftReg(e.target.value.toUpperCase())}
          placeholder="Registration"
          style={{
            padding: "10px",
            borderRadius: "4px",
            fontSize: "16px",
            width: "30%", // Changed from 80% to 300px fixed width
            marginBottom: "15px",
            textAlign: "center",
          }}
          autoFocus
        />
        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontSize: "16px" }}>
            <input
              type="checkbox"
              checked={foreignAircraftOnFreq}
              onChange={(e) => setForeignAircraftOnFreq(e.target.checked)}
              style={{ marginRight: "8px", transform: "scale(1.2)" }}
            />
            On Frequency
          </label>
        </div>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <button
            onClick={handleAddForeignAircraft}
            style={{
              padding: "10px 20px",
              backgroundColor: "#28a745",
              color: "white",
              borderRadius: "4px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Add
          </button>
          <button
            onClick={closeAddForeignAircraftModal}
            style={{
              padding: "10px 20px",
              backgroundColor: "#dc3545",
              color: "white",
              borderRadius: "4px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )}

<div style={{ display: "flex", width: "100%", marginBottom: "15px" }}>
  <div style={{ flex: 1, marginRight: "10px" }}>
<Section title="Local IR and Approach">
  {renderAircraft(localIR, [
    { label: "Join VC", onClick: moveToVisualCircuitFromLocalIR },
    { label: "TB", onClick: openModal }, // Új gomb hozzáadása
	{ label: "XC", onClick: moveToCrossCountry }, // Új gomb hozzáadása
	{ label: "Vacated", onClick: moveToTaxiingFromLocalIR }
  ])}
</Section>
  </div>

  <div style={{ flex: 1, marginLeft: "10px" }}>
    <Section title="Training Box">
  {renderAircraft(
    Object.keys(trainingBox),
    [
      { label: "Join VC", onClick: moveToVisualFromTrainingBox },
      { label: "Local IR", onClick: moveToLocalIRFromTrainingBox },
      { label: "Vacated", onClick: (reg: string) => {
          setTrainingBox((prev) => {
            const copy = { ...prev };
            delete copy[reg]; // Remove the aircraft from the Training Box
            return copy;
          });

          const landedTime = getCurrentTime(); // Get the current time

          setTaxiing((prev) => [...prev, reg]); // Move the aircraft to Taxiing

          setTimestamps((prev) => ({
            ...prev,
            [reg]: {
              ...prev[reg],
              landed: landedTime, // Save landing time
            },
          }));

          // Update the detailed flight log with the landing time
          updateLandingTime(reg, landedTime);

          // Reset to default states
          setAircraftStatuses((prev) => ({
            ...prev,
            [reg]: 'DUAL',
          }));
          setAircraftTGStatus((prev) => ({
            ...prev,
            [reg]: 'T/G',
          }));
        }
      }
    ]
  )}
</Section>
  </div>
</div>

<Section title="">
  <div style={{ display: "flex", alignItems: "center", marginBottom: "10px", justifyContent: "space-between", marginTop: 0 }}>
    <h2 style={{ fontSize: "22px", fontWeight: "bold", margin: 0 }}>Visual Circuit ({visualCircuit.length})</h2>
    <button
      onClick={moveFirstToLast}
      style={{
        padding: "10px 20px",
        fontSize: "16px",
        backgroundColor: "#28a745",
        color: "white",
        borderRadius: "8px",
        border: "none",
        cursor: "pointer",
      }}
    >
      Move Number 1 to Last
    </button>
  </div>
  {renderAircraft(visualCircuit, [
    { label: "← Left", onClick: moveLeft },
    { label: "Right →", onClick: moveRight },
    { label: "Local IR", onClick: moveToLocalIR },
    { label: "TB", onClick: openModal },
    { label: "XC", onClick: moveToCrossCountry },
    { label: "Vacated", onClick: moveToTaxiingFromVisual }
  ])}
</Section>

<div style={{ display: "flex", width: "100%", marginBottom: "15px" }}>
  <div style={{ flex: 1, marginRight: "10px" }}>
    <Section title="Holding Point">
      {renderAircraft(holdingPoint, [
{ label: "Visual Circuit", onClick: (reg: string) => moveToVisualFromHolding(reg, "", "") },
        { label: "Return to Stand", onClick: moveBackToTaxiing },
      ], true)}
    </Section>
  </div>

  <div style={{ flex: 1, marginLeft: "10px" }}>
    <Section title="Taxiing Aircraft">
      {renderAircraft(taxiing, [
        { label: "Holding Point", onClick: moveToHoldingPoint },
        { label: "Apron", onClick: moveBackToApron },
      ])}
    </Section>
  </div>
</div>

<Section title="Apron">
<input
  type="text"
  placeholder="Search by registration"
  onChange={(e) => setSearchTerm(e.target.value.toUpperCase())} // Állapot frissítése nagybetűs formában
  style={{
    padding: "8px",
    borderRadius: "8px",
    fontSize: "16px",
    marginBottom: "10px",
    width: "40%",
    minWidth: "300px", // Minimum szélesség
  }}
/>
  {/* Group headers */}
  {["Piper", "Cessna", "Multi", "Other"].map(groupName => {
    const groupAircraft = [...apron]
      .filter(reg => reg.includes(searchTerm))
      .filter(reg => getAircraftGroup(reg) === groupName)
      .sort((a, b) => a.localeCompare(b));

    if (groupAircraft.length === 0) return null;

    return (
      <div key={groupName} style={{ marginBottom: "20px" }}>
        <h3 style={{ 
          color: "white", 
          borderBottom: "2px solid white",
          paddingBottom: "5px",
          marginBottom: "10px" 
        }}>
          {groupName}
        </h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {renderAircraft(
            groupAircraft,
            [
              { label: "Holding Point", onClick: moveToHoldingPointFromApron },
              { label: "Taxi", onClick: moveToTaxiFromApron },
            ]
          )}
        </div>
      </div>
    );
  })}

  <div className="flex gap-2" style={{ marginTop: "10px" }}>
    <input
      type="text"
      value={newReg}
      onChange={(e) => setNewReg(e.target.value.toUpperCase())} // Kisbetűk nagybetűvé alakítása
      placeholder="New registration"
      style={{
        padding: "8px",
        borderRadius: "8px",
        fontSize: "16px",
        color: "black",
        textTransform: "uppercase", // Megjelenítés: mindig nagybetűs
      }}
    />
    <button
      onClick={addAircraftToApron}
      style={{
        padding: "8px 16px",
        fontSize: "16px",
        backgroundColor: "#28a745",
        color: "white",
        borderRadius: "8px",
        cursor: "pointer",
        border: "none",
      }}
    >
      Add aircraft to apron
    </button>
  </div>
</Section>

<Section title="Flight Log" noMinHeight>
  <div style={{ marginBottom: "10px", display: "flex", gap: "10px" }}>
    <button
      onClick={() => setShowTable((prev) => !prev)}
      style={{
        padding: "10px 20px",
        fontSize: "16px",
        backgroundColor: "#007BFF",
        color: "white",
        borderRadius: "8px",
        border: "none",
        cursor: "pointer",
      }}
    >
      {showTable ? "Hide Table" : "Show Table"}
    </button>
    <button
      onClick={() => setIsStartNumberModalOpen(true)}
      style={{
        padding: "10px 20px",
        fontSize: "16px",
        backgroundColor: "#28a745",
        color: "white",
        borderRadius: "8px",
        border: "none",
        cursor: "pointer",
      }}
    >
      Start numbering from...
    </button>
  </div>

  {showTable && (() => {
    const tables = [];
    detailedFlightLog.forEach((entry, index) => {
      const tableIndex = Math.floor(index / 33);
      if (!tables[tableIndex]) tables[tableIndex] = [];
      tables[tableIndex].push(entry);
    });

    // Állapot a felugró ablakhoz
    const [deleteRowIndex, setDeleteRowIndex] = useState<{ tableIndex: number; rowIndex: number } | null>(null);

    const handleAddRow = (tableIndex: number, rowIndex: number, position: 'above' | 'below') => {
      const newEntry = {
        serial: detailedFlightLog.length + 1,
        reg: "",
        takeoff: "",
        landed: "",
        squawk: "",
        crew: "",
        isNew: true,
      };
      const updatedLog = [...detailedFlightLog];
      const insertIndex = tableIndex * 33 + rowIndex + (position === 'below' ? 1 : 0);
      updatedLog.splice(insertIndex, 0, newEntry);
      setDetailedFlightLog(
        updatedLog.map((entry, idx) => ({ ...entry, serial: idx + 1 }))
      );
    };

    const handleDeleteRow = () => {
      if (deleteRowIndex) {
        const { tableIndex, rowIndex } = deleteRowIndex;
        const updatedLog = [...detailedFlightLog];
        updatedLog.splice(tableIndex * 33 + rowIndex, 1);
        setDetailedFlightLog(
          updatedLog.map((entry, idx) => ({ ...entry, serial: idx + 1 }))
        );
        setDeleteRowIndex(null); // Modal bezárása
      }
    };

    return (
      <>
        {tables.map((tableRows, tableIndex) => (
          <table
            key={tableIndex}
            style={{
              width: "60%",
              marginLeft: "0",
              borderCollapse: "collapse",
              fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
              color: "white",
              marginBottom: "20px",
              fontSize: "20px",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}>
                <th style={{ padding: "10px", border: "1px solid white" }}>#</th>
                <th style={{ padding: "10px", border: "1px solid white" }}>Registration</th>
                <th style={{ padding: "10px", border: "1px solid white" }}>Squawk</th>
                <th style={{ padding: "10px", border: "1px solid white" }}>Takeoff Time</th>
                <th style={{ padding: "10px", border: "1px solid white" }}>Crew</th>
                <th style={{ padding: "10px", border: "1px solid white" }}>Landing Time</th>
                <th style={{ padding: "10px", border: "1px solid white" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map(({ serial, reg, squawk, takeoff, crew, landed, isNew }, rowIndex) => (
                <tr
                  key={serial}
                  style={{
                    backgroundColor: serial % 2 === 0 ? "rgba(0, 0, 0, 0.7)" : "rgba(50, 50, 50, 0.7)",
                  }}
                >
                  <td style={{ padding: "10px", border: "1px solid white", textAlign: "center" }}>
                    {startNumber + tableIndex * 33 + rowIndex}
                  </td>
                  <td style={{ padding: "10px", border: "1px solid white", textAlign: "center" }}>
                    {isNew ? (
                      <input
                        type="text"
                        value={reg}
                        onChange={(e) =>
                          setDetailedFlightLog((prevLog) =>
                            prevLog.map((entry) =>
                              entry.serial === serial ? { ...entry, reg: e.target.value } : entry
                            )
                          )
                        }
                        style={{
                          width: "80%",
                          padding: "8px",
                          borderRadius: "6px",
                          textAlign: "center",
                          border: "1px solid #ccc",
                          backgroundColor: "#fff",
                          fontSize: "14px",
                          fontWeight: "bold",
                          color: "#333",
                        }}
                      />
                    ) : (
                      <>
                        {reg}
                        {typeof serial !== "undefined" && detailedFlightLog.find(e => e.serial === serial)?.soloAtLanding ? " (SOLO)" : ""}
                      </>
                    )}
                  </td>
                  <td style={{ padding: "10px", border: "1px solid white", textAlign: "center" }}>
                    <input
                      type="text"
                      value={squawk || ""}
                      onChange={(e) =>
                        setDetailedFlightLog((prevLog) =>
                          prevLog.map((entry) =>
                            entry.serial === serial ? { ...entry, squawk: e.target.value } : entry
                          )
                        )
                      }
                      style={{
                        width: "80%",
                        padding: "8px",
                        borderRadius: "6px",
                        textAlign: "center",
                        border: "1px solid #ccc",
                        backgroundColor: "#fff",
                        fontSize: "14px",
                        fontWeight: "bold",
                        color: "#333",
                      }}
                    />
                  </td>
                  <td style={{ padding: "10px", border: "1px solid white", textAlign: "center" }}>
                    {isNew ? (
                      <input
                        type="text"
                        value={takeoff}
                        onChange={(e) =>
                          setDetailedFlightLog((prevLog) =>
                            prevLog.map((entry) =>
                              entry.serial === serial ? { ...entry, takeoff: e.target.value } : entry
                            )
                          )
                        }
                        style={{
                          width: "80%",
                          padding: "8px",
                          borderRadius: "6px",
                          textAlign: "center",
                          border: "1px solid #ccc",
                          backgroundColor: "#fff",
                          fontSize: "14px",
                          fontWeight: "bold",
                          color: "#333",
                        }}
                      />
                    ) : (
                      getOffsetTime(takeoff)
                    )}
                  </td>
                  <td style={{ padding: "10px", border: "1px solid white", textAlign: "center" }}>
                    <input
                      type="text"
                      value={crew || ""}
                      onChange={(e) =>
                        setDetailedFlightLog((prevLog) =>
                          prevLog.map((entry) =>
                            entry.serial === serial ? { ...entry, crew: e.target.value } : entry
                          )
                        )
                      }
                      style={{
                        width: "80%",
                        padding: "8px",
                        borderRadius: "6px",
                        textAlign: "center",
                        border: "1px solid #ccc",
                        backgroundColor: "#fff",
                        fontSize: "14px",
                        fontWeight: "bold",
                        color: "#333",
                      }}
                    />
                  </td>
                  <td style={{ padding: "10px", border: "1px solid white", textAlign: "center" }}>
                    {isNew ? (
                      <input
                        type="text"
                        value={landed}
                        onChange={(e) =>
                          setDetailedFlightLog((prevLog) =>
                            prevLog.map((entry) =>
                              entry.serial === serial ? { ...entry, landed: e.target.value } : entry
                            )
                          )
                        }
                        style={{
                          width: "80%",
                          padding: "8px",
                          borderRadius: "6px",
                          textAlign: "center",
                          border: "1px solid #ccc",
                          backgroundColor: "#fff",
                          fontSize: "14px",
                          fontWeight: "bold",
                          color: "#333",
                        }}
                      />
                    ) : (
                      getOffsetTime(landed)
                    )}
                  </td>
                  <td style={{ padding: "10px", border: "1px solid white", textAlign: "center" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: "5px",
                      }}
                    >
                      <button
                        onClick={() => handleAddRow(tableIndex, rowIndex, 'above')}
                        style={{
                          padding: "5px 10px",
                          backgroundColor: "green",
                          color: "white",
                          borderRadius: "4px",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                        title="Add row above"
                      >
                        ↑ Add row above
                      </button>
                      <button
                        onClick={() => handleAddRow(tableIndex, rowIndex, 'below')}
                        style={{
                          padding: "5px 10px",
                          backgroundColor: "green",
                          color: "white",
                          borderRadius: "4px",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                        title="Add row below"
                      >
                        ↓ Add row below
                      </button>
                      <button
                        onClick={() => setDeleteRowIndex({ tableIndex, rowIndex })}
                        style={{
                          padding: "5px 10px",
                          backgroundColor: "red",
                          color: "white",
                          borderRadius: "4px",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                      >
                        🗑 Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}
        {deleteRowIndex && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backdropFilter: "blur(8px)", // Elmosás hozzáadva
              WebkitBackdropFilter: "blur(8px)", // Safari támogatás
            }}
          >
            <div
              style={{
                backgroundColor: "black",
                padding: "20px",
                borderRadius: "8px",
                textAlign: "center",
                maxWidth: "60vw", // Max szélesség 75%
                width: "100%",
                margin: "0 auto",
                boxSizing: "border-box",
              }}
            >
              <p style={{ fontSize: "16px", marginBottom: "20px" }}>
                Are you fully sure to delete the row???
              </p>
              <button
                onClick={handleDeleteRow}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "green",
                  color: "white",
                  borderRadius: "4px",
                  border: "none",
                  cursor: "pointer",
                  marginRight: "10px",
                }}
              >
                Confirm
              </button>
              <button
                onClick={() => setDeleteRowIndex(null)}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "red",
                  color: "white",
                  borderRadius: "4px",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </>
    );
  })()}

  {isStartNumberModalOpen && (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
        backdropFilter: "blur(8px)", // Elmosás hozzáadva
        WebkitBackdropFilter: "blur(8px)", // Safari támogatás
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          setIsStartNumberModalOpen(false); // Close the modal on Enter
        } else if (e.key === "Escape") {
          setIsStartNumberModalOpen(false); // Close the modal on Escape
        }
      }}
      tabIndex={-1} // Make the div focusable for key events
    >
      <div
        style={{
          backgroundColor: "black",
          padding: "20px",
          borderRadius: "4px",
          textAlign: "center",
          color: "white",
          maxWidth: "75vw", // Max szélesség 75%
          width: "100%",
          margin: "0 auto",
          boxSizing: "border-box",
        }}
      >
        <h3 style={{ marginBottom: "10px" }}>Set Starting Number</h3>
        <input
          type="number"
          min="1"
          value={startNumber}
          onChange={(e) => handleStartNumberChange(e.target.value)}
          ref={(input) => {
            if (input && !input.dataset.initialized) {
              input.focus(); // Automatically focus the input
              input.select(); // Automatically select the entire input value
              input.dataset.initialized = "true"; // Mark as initialized to prevent re-selection
            }
          }}
          style={{
            padding: "10px",
            borderRadius: "4px",
            fontSize: "16px",
            width: "100px",
            textAlign: "center",
          }}
          inputMode="numeric" // Ensures numeric keyboard on touch devices
        />
        <div style={{ marginTop: "10px", display: "flex", gap: "10px", justifyContent: "center" }}>
          <button
            onClick={() => setIsStartNumberModalOpen(false)}
            style={{
              padding: "10px 20px",
              backgroundColor: "#28a745",
              color: "white",
              borderRadius: "4px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Confirm
          </button>
          <button
            onClick={() => setIsStartNumberModalOpen(false)}
            style={{
              padding: "10px 20px",
              backgroundColor: "#dc3545",
              color: "white",
              borderRadius: "4px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )}
</Section>

<Section title="AFIS Log" noMinHeight>
  <table
    style={{
      width: "60%",
      marginLeft: "0",
      borderCollapse: "collapse",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      color: "white",
      marginBottom: "20px",
      fontSize: "18px",
    }}
  >
    <thead>
      <tr style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}>
        <th style={{ padding: "10px", border: "1px solid white" }}>Registration</th>
        <th style={{ padding: "10px", border: "1px solid white" }}>First Takeoff</th>
        <th style={{ padding: "10px", border: "1px solid white" }}>Last Landing</th>
      </tr>
    </thead>
    <tbody>
      {/* Regular aircraft entries */}
      {Object.entries(
        detailedFlightLog
          .filter(entry => !foreignAircrafts.has(entry.reg))
          .reduce((acc, { reg, takeoff, landed }) => {
            if (!acc[reg]) {
              acc[reg] = { takeoff, landed };
            } else {
              if (takeoff && (!acc[reg].takeoff || takeoff < acc[reg].takeoff)) {
                acc[reg].takeoff = takeoff;
              }
              if (landed && (!acc[reg].landed || landed > acc[reg].landed)) {
                acc[reg].landed = landed;
              }
            }
            return acc;
          }, {} as { [reg: string]: { takeoff: string; landed: string } })
      )
        .sort(([, a], [, b]) => (a.takeoff || "").localeCompare(b.takeoff || ""))
        .map(([reg, { takeoff, landed }]) => (
          <tr
            key={reg}
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.7)",
            }}
          >
            <td style={{ padding: "10px", border: "1px solid white", textAlign: "center" }}>{reg}</td>
            <td style={{ padding: "10px", border: "1px solid white", textAlign: "center" }}>{getOffsetTime(takeoff) || "---"}</td>
            <td style={{ padding: "10px", border: "1px solid white", textAlign: "center" }}>{getOffsetTime(landed) || "---"}</td>
          </tr>
        ))}
    </tbody>
  </table>

  {/* Foreign Aircraft Table */}
  {Array.from(foreignAircrafts).length > 0 && (
    <>
      <h3 style={{ marginTop: "30px", marginBottom: "15px" }}>Foreign AFIS Log</h3>
      <table
        style={{
          width: "60%",
          marginLeft: "0",
          borderCollapse: "collapse",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          color: "white",
          marginBottom: "20px",
          fontSize: "18px",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}>
            <th style={{ padding: "10px", border: "1px solid white" }}>Registration</th>
            <th style={{ padding: "10px", border: "1px solid white" }}>First Takeoff</th>
            <th style={{ padding: "10px", border: "1px solid white" }}>Last Landing</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(
            detailedFlightLog
              .filter(entry => foreignAircrafts.has(entry.reg))
              .reduce((acc, { reg, takeoff, landed }) => {
                if (!acc[reg]) {
                  acc[reg] = { takeoff, landed };
                } else {
                  if (takeoff && (!acc[reg].takeoff || takeoff < acc[reg].takeoff)) {
                    acc[reg].takeoff = takeoff;
                  }
                  if (landed && (!acc[reg].landed || landed > acc[reg].landed)) {
                    acc[reg].landed = landed;
                  }
                }
                return acc;
              }, {} as { [reg: string]: { takeoff: string; landed: string } })
          )
            .sort(([, a], [, b]) => (a.takeoff || "").localeCompare(b.takeoff || ""))
            .map(([reg, { takeoff, landed }]) => (
              <tr
                key={reg}
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                }}
              >
                <td style={{ padding: "10px", border: "1px solid white", textAlign: "center" }}>{reg}</td>
                <td style={{ padding: "10px", border: "1px solid white", textAlign: "center" }}>{getOffsetTime(takeoff) || "---"}</td>
                <td style={{ padding: "10px", border: "1px solid white", textAlign: "center" }}>{getOffsetTime(landed) || "---"}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </>
  )}
</Section>

<Section title={
  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', justifyContent: 'space-between', width: '100%' }}>
    <span>Workload Monitor (07:00-22:00)</span>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontSize: '14px', color: 'white' }}>Interval:</span>
      {[5, 10, 15, 30].map((mins) => (
        <button
          key={mins}
          onClick={() => setWorkloadIntervalMinutes(mins)}
          style={{
            padding: '4px 12px',
            fontSize: '13px',
            backgroundColor: workloadIntervalMinutes === mins ? '#28a745' : '#555',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: workloadIntervalMinutes === mins ? 'bold' : 'normal',
          }}
        >
          {mins} min
        </button>
      ))}
    </div>
  </div>
} noMinHeight>
  {(() => {
    try {
      if (!actionLog || !Array.isArray(actionLog) || actionLog.length === 0) {
        return <div style={{ color: 'white', padding: '20px', textAlign: 'center' }}>No actions recorded yet</div>;
      }

      // Dinamikus intervallumok 07:00-22:00 között (választható percekben)
      const intervals: { time: string; count: number }[] = [];
      const startHour = 7;
      const endHour = 22;
      const intervalMinutes = workloadIntervalMinutes;
      
      for (let h = startHour; h < endHour; h++) {
        for (let m = 0; m < 60; m += intervalMinutes) {
          intervals.push({ time: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`, count: 0 });
        }
      }

      // Számolás: UTC timestamp -> helyi idő (timeOffset-tel korrigálva)
      actionLog.forEach((utcTimestamp) => {
        try {
          const date = new Date(utcTimestamp);
          if (isNaN(date.getTime())) return;
          const localHour = date.getUTCHours() + timeOffset;
          const localMinute = date.getUTCMinutes();
          
          // Csak 07:00-22:00 közötti actionöket számoljuk
          if (localHour >= startHour && localHour < endHour) {
            const roundedMinute = Math.floor(localMinute / intervalMinutes) * intervalMinutes;
            const timeStr = `${localHour.toString().padStart(2, '0')}:${roundedMinute.toString().padStart(2, '0')}`;
            const interval = intervals.find((i) => i.time === timeStr);
            if (interval) {
              interval.count++;
            }
          }
        } catch (e) {
          // skip invalid timestamp
        }
      });

      const counts = intervals.map((i) => i.count);
      const maxCount = counts.length > 0 ? Math.max(...counts, 1) : 1;
      const nonZeroCounts = counts.filter((c) => c > 0);
      const minCount = nonZeroCounts.length > 0 ? Math.min(...nonZeroCounts) : 0;
      const countRange = maxCount - minCount || 1;

      // SVG vonaldiagram - responsive szélesség
      const containerWidth = typeof window !== 'undefined' ? window.innerWidth - 100 : 1200; // Teljes szélesség mínusz padding
      const width = Math.max(containerWidth, 800); // Minimum 800px
      const height = 300;
      const padding = { top: 40, right: 40, bottom: 60, left: 60 };
      const chartWidth = width - padding.left - padding.right;
      const chartHeight = height - padding.top - padding.bottom;
      const stepX = chartWidth / intervals.length;

      // Pontok számítása - Y tengelyen az actionök száma alapján emelkedik (0-tól maxCount-ig)
      const points: Array<{ x: number; y: number; count: number; time: string }> = intervals.map((interval, idx) => {
        const x = padding.left + idx * stepX + stepX / 2;
        // Y pozíció: alulról felfelé, az actionök száma alapján
        // Ha count = 0, akkor a legalsó pozícióban (padding.top + chartHeight)
        // Ha count = maxCount, akkor a legfelső pozícióban (padding.top)
        // 0-tól maxCount-ig normalizálunk
        const normalizedCount = maxCount > 0 ? interval.count / maxCount : 0;
        const y = padding.top + chartHeight - (normalizedCount * chartHeight);
        return { x, y, count: interval.count, time: interval.time };
      });

      // Path string a vonalhoz - smooth curve (cubic bezier)
      let pathData = '';
      if (points.length === 0) {
        pathData = '';
      } else if (points.length === 1) {
        pathData = `M ${points[0].x} ${points[0].y}`;
      } else {
        let path = `M ${points[0].x} ${points[0].y}`;
        
        // Smooth curve generálása control point-okkal
        for (let i = 1; i < points.length; i++) {
          const prev = points[i - 1];
          const curr = points[i];
          const next = points[i + 1];
          
          if (i === 1) {
            // Első görbe: kezdőponttól első control point-ig
            const cp1x = prev.x + (curr.x - prev.x) / 3;
            const cp1y = prev.y;
            const cp2x = curr.x - (next ? (next.x - curr.x) / 3 : (curr.x - prev.x) / 3);
            const cp2y = curr.y;
            path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
          } else if (next) {
            // Köztes görbék: smooth curve
            const smoothCp2x = curr.x - (next.x - curr.x) / 2;
            const smoothCp2y = curr.y;
            path += ` S ${smoothCp2x} ${smoothCp2y}, ${curr.x} ${curr.y}`;
          } else {
            // Utolsó görbe
            path += ` S ${curr.x} ${prev.y}, ${curr.x} ${curr.y}`;
          }
        }
        
        pathData = path;
      }

      // Szín számítás (zöld -> piros)
      const getColor = (count: number): string => {
        if (count === 0) return '#28a745'; // zöld
        const ratio = (count - minCount) / countRange;
        const r = Math.round(255 * ratio);
        const g = Math.round(255 * (1 - ratio));
        return `rgb(${r}, ${g}, 0)`;
      };

      return (
        <div style={{ width: '100%', marginTop: '20px' }}>
          <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', borderRadius: '8px', display: 'block' }}>
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = padding.top + ratio * chartHeight;
              return (
                <line
                  key={ratio}
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + chartWidth}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth="1"
                />
              );
            })}

            {/* X-axis labels (óránként) */}
            {intervals
              .filter((_, idx) => {
                // Óránkénti címkék: 60 / intervalMinutes intervallumonként
                const intervalsPerHour = 60 / intervalMinutes;
                return idx % intervalsPerHour === 0;
              })
              .map((interval, idx) => {
                const intervalsPerHour = 60 / intervalMinutes;
                const x = padding.left + idx * intervalsPerHour * stepX + stepX / 2;
                return (
                  <text
                    key={interval.time}
                    x={x}
                    y={height - padding.bottom + 20}
                    fill="white"
                    fontSize="12"
                    textAnchor="middle"
                  >
                    {interval.time}
                  </text>
                );
              })}

            {/* Y-axis labels */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = padding.top + ratio * chartHeight;
              const value = Math.round(maxCount - ratio * countRange);
              return (
                <g key={ratio}>
                  <line
                    x1={padding.left - 5}
                    y1={y}
                    x2={padding.left}
                    y2={y}
                    stroke="rgba(255, 255, 255, 0.3)"
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 10}
                    y={y + 4}
                    fill="white"
                    fontSize="11"
                    textAnchor="end"
                  >
                    {value}
                  </text>
                </g>
              );
            })}

            {/* Vonaldiagram */}
            <path
              d={pathData}
              fill="none"
              stroke="#28a745"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Invisible hover areas - érték hover-re jelenik meg */}
            {points.map((point, idx) => {
              const hoverAreaSize = stepX * 0.8; // Hover zóna szélessége
              const isHovered = hoveredWorkloadPoint === idx;
              return (
                <g key={idx}>
                  {/* Invisible hover area */}
                  <rect
                    x={point.x - hoverAreaSize / 2}
                    y={padding.top}
                    width={hoverAreaSize}
                    height={chartHeight}
                    fill="transparent"
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredWorkloadPoint(idx)}
                    onMouseLeave={() => setHoveredWorkloadPoint(null)}
                  />
                  {/* Tooltip - csak hover-re látható */}
                  {isHovered && point.count > 0 && (
                    <g>
                      {/* Pont a vonalon */}
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="5"
                        fill={getColor(point.count)}
                        stroke="white"
                        strokeWidth="2"
                      />
                      {/* Tooltip háttér */}
                      <rect
                        x={point.x - 50}
                        y={point.y - 35}
                        width="100"
                        height="25"
                        fill="rgba(0, 0, 0, 0.9)"
                        stroke="white"
                        strokeWidth="1"
                        rx="4"
                      />
                      {/* Tooltip szöveg */}
                      <text
                        x={point.x}
                        y={point.y - 18}
                        fill="white"
                        fontSize="12"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {point.time}: {point.count}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Címkék */}
            <text
              x={width / 2}
              y={padding.top - 10}
              fill="white"
              fontSize="16"
              fontWeight="bold"
              textAnchor="middle"
            >
              Actions per set minutes
            </text>
            <text
              x={padding.left - 30}
              y={height / 2}
              fill="white"
              fontSize="14"
              textAnchor="middle"
              transform={`rotate(-90, ${padding.left - 30}, ${height / 2})`}
            >
              Action count
            </text>
          </svg>
        </div>
      );
    } catch (error) {
      return <div style={{ color: 'white', padding: '20px', textAlign: 'center' }}>Error loading workload chart</div>;
    }
  })()}
</Section>
	  
	  
	  
	  {isHelpModalOpen && (
  <div style={{
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    backdropFilter: "blur(8px)", // Elmosás hozzáadva
    WebkitBackdropFilter: "blur(8px)", // Safari támogatás
  }}
  tabIndex={-1}
  onKeyDown={(e) => {
    if (e.key === "Escape") setIsHelpModalOpen(false);
  }}
>
    <div style={{
      backgroundColor: "#222",
      padding: "20px",
      borderRadius: "12px",
      textAlign: "center",
      minWidth: "320px",
      color: "white",
      maxWidth: "75vw", // Max szélesség 75%
      width: "100%",
      margin: "0 auto",
      boxSizing: "border-box",
    }}>
      <h3 style={{ fontSize: "20px", marginBottom: "16px" }}>Help</h3>
      
<p style={{ fontSize: "16px", marginBottom: "16px" }}> In the <strong>Apron</strong> section, you'll find all Tréner airplanes. You can add foreign aircraft at the bottom, such as a police helicopter (R902). Click the <strong>TAXI</strong> or <strong>HOLDING POINT</strong> button to move the aircraft to the corresponding group. Can't find the plane? Use the search bar. </p>


<p style={{ fontSize: "16px", marginBottom: "16px" }}> When selecting <strong>VISUAL CIRCUIT</strong>, the aircraft is moved automatically, and its take-off time is recorded. Click on the takeoff time to change it if you need! In the Visual Circuit section, you can rearrange aircraft by moving them left or right to set the correct sequence. Click the <strong>DUAL</strong> button to switch the plane to <strong>SOLO</strong> mode, indicating it is a solo student. You can also click the "T/G" button to mark a full stop landing — it will then turn red and display "F/S". With the <strong>Move Number 1 to Last</strong> button, you can set the first plane to be the last, indicating the correct sequence on the visual circuit after a touch and go.</p>
<p style={{ fontSize: "16px", marginBottom: "16px" }}> From the Visual Circuit, aircraft can proceed to <strong>Local IR</strong>, <strong>Training Box (TB)</strong> or <strong>Cross Country (XC)</strong></p> <p style={{ fontSize: "16px", marginBottom: "16px" }}> In the <strong>Local IR</strong> section, you can choose the task from the first drop-down menu. You can also add additional remarks—such as altitude, task details, or position—in the text input field. </p>
<p style={{ fontSize: "16px", marginBottom: "16px" }}> When selecting <strong>Training Box (TB)</strong>, a pop-up window will appear where you can select the appropriate TB. If the aircraft changes TB, simply click the displayed TB (e.g., "TB 6") to update it. There’s also an option to select <strong>TB Proceeding to Visual Circuit</strong>, indicating that the aircraft is returning. To actually move the plane back, click the <strong>JOIN VC</strong> button. Selecting “TB Proceeding to Visual Circuit” is optional—it’s just for situational awareness, not required for moving the aircraft. </p>
<p style={{ fontSize: "16px", marginBottom: "16px" }}> In the <strong>Cross Country</strong> section, you can leave a remark indicating where the aircraft is headed. The checkbox allows you to mark whether the aircraft is on frequency. </p>
<p style={{ fontSize: "16px", marginBottom: "16px" }}> It is recommended that once an aircraft calls you, you move it from the Apron section to the Taxiing section. This way, it will be easier to find when the aircraft reaches the holding point and is ready for departure, saving you time and avoiding unnecessary searching. </p>
<p style={{ fontSize: "16px", marginBottom: "16px" }}> At the bottom of the page, you’ll find the Flight Log and AFIS Log sections.
The Flight Log records all takeoffs and landings, just like a traditional paper log. If a student pilot was flying solo, the word “Solo” will appear next to the aircraft registration after landing.
The AFIS Log summarizes the day’s operations by listing the first takeoff and last landing time for each aircraft used during the day. </p>
<p style={{ fontSize: "16px", marginBottom: "16px" }}> Clicking the green plus button adds a new row above, while clicking the red trash icon deletes the current row.

 </p>
      <button
        onClick={() => setIsHelpModalOpen(false)}
        style={{
          marginTop: "14px",
          padding: "10px 20px",
          fontSize: "16px",
          backgroundColor: "#dc3545",
          color: "white",
          borderRadius: "8px",
          border: "none",
          cursor: "pointer",
        }}
      >
        Close
      </button>
    </div>
  </div>
)}

      {isModalOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          backdropFilter: "blur(8px)", // Elmosás hozzáadva
          WebkitBackdropFilter: "blur(8px)", // Safari támogatás
        }}>
          <div style={{
            backgroundColor: "#222",
            padding: "20px",
            borderRadius: "12px",
            textAlign: "center",
            minWidth: "320px",
            color: "white",
            maxWidth: "75vw", // Max szélesség 75%
            width: "100%",
            margin: "0 auto",
            boxSizing: "border-box",
          }}>
            <h3 style={{ fontSize: "20px", marginBottom: "16px" }}>Choose TB for {selectedAircraft}:</h3>
            {["1", "2", "3", "4", "5", "6","7", "5-6","1-2","2-3","1-2-3", "100","TO VC","TO DOWNWIND","TO BASE","TO O.T.", "TO FINAL","TO CROSSWIND"].map((box) => (
              (() => {
                const getBoxParts = (b: string): string[] => {
                  // Csak a számozott TB-khez csinálunk átfedés-ellenőrzést.
                  // Példák: "1", "1-2", "2-3", "1-2-3", "5-6", "100"
                  // Nem példák: "TO VC", "TO DOWNWIND", stb. -> []
                  const trimmed = b.trim().toUpperCase();
                  const numericLike = trimmed.match(/^\d+(-\d+)*$/);
                  if (!numericLike) return [];
                  return trimmed.split("-").filter(Boolean);
                };

                const targetParts = getBoxParts(box);
                const overlaps = (a: string[], b: string[]) =>
                  a.length > 0 && b.length > 0 && a.some((x) => b.includes(x));

                const occupiedBy = Object.entries(trainingBox).find(([reg, assigned]) => {
                  if (reg === selectedAircraft) return false;
                  const assignedParts = getBoxParts(assigned);
                  // Ha bármelyik oldalon nem számozott TB van, ne tekintsük ütközésnek
                  // (ezek "útvonal" jellegű TB-k).
                  return overlaps(targetParts, assignedParts);
                })?.[0];

                const isOccupied = Boolean(occupiedBy);
                return (
              <button
                key={box}
                onClick={() => handleTrainingBoxSelection(box)}
                style={{ 
                  margin: "6px", 
                  padding: "10px 20px", 
                  fontSize: "16px", 
                  backgroundColor: isOccupied ? "#dc3545" : "#007BFF", 
                  color: "white", 
                  borderRadius: "8px", 
                  border: isOccupied ? "2px solid rgba(255,255,255,0.6)" : "none", 
                  cursor: "pointer" 
                }}
                title={isOccupied ? `Occupied by ${occupiedBy}` : undefined}
              >
                TB {box}
              </button>
                );
              })()
            ))}
            <div>
              <button
                onClick={closeModal}
                style={{ marginTop: "14px", padding: "10px 20px", fontSize: "16px", backgroundColor: "#dc3545", color: "white", borderRadius: "8px", border: "none", cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
	  
	  {isCrewSquawkModalOpen && (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      backgroundColor: "rgba(0,  0, 0, 0.6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
    }}
  >
    <div
      style={{
        backgroundColor: "#222",
        padding: "20px",
        borderRadius: "12px",
        textAlign: "center",
        minWidth: "320px",
        color: "white",
        maxWidth: "75vw",
        width: "100%",
        margin: "0 auto",
        boxSizing: "border-box",
      }}
    >
      <h3 style={{ fontSize: "20px", marginBottom: "16px" }}>Crew és Squawk</h3>
      <input
        type="text"
        value={modalCrew}
        onChange={(e) => setModalCrew(e.target.value)}
        placeholder="Crew"
        style={{
          padding: "10px",
          borderRadius: "4px",
          fontSize: "16px",
          width: "80%",
          marginBottom: "10px",
        }}
      />
      <input
        type="text"
        value={modalSquawk}
        onChange={(e) => setModalSquawk(e.target.value)}
        placeholder="Squawk"
        style={{
          padding: "10px",
          borderRadius: "4px",
          fontSize: "16px",
          width: "80%",
          marginBottom: "10px",
        }}
      />
      <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
        <button
          onClick={saveCrewSquawk}
          style={{
            padding: "10px 20px",
            backgroundColor: "#28a745",
            color: "white",
            borderRadius: "4px",
            border: "none",
            cursor: "pointer",
          }}
        >
          Save
        </button>
        <button
          onClick={closeCrewSquawkModal}
          style={{
            padding: "10px 20px",
            backgroundColor: "#dc3545",
            color: "white",
            borderRadius: "4px",
            border: "none",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

{isTakeoffModalOpen && (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
    }}
    tabIndex={-1}
    onKeyDown={(e) => {
      if (e.key === "Escape") closeTakeoffModal();
      if (e.key === "Enter") saveTakeoffModal();
    }}
  >
    <div
      style={{
        backgroundColor: "#222",
        padding: "20px",
        borderRadius: "12px",
        textAlign: "center",
        minWidth: "320px",
        color: "white",
        maxWidth: "75vw",
        width: "100%",
        margin: "0 auto",
        boxSizing: "border-box",
      }}
    >
      <h3 style={{ fontSize: "20px", marginBottom: "16px" }}>
        Edit Takeoff Time for {modalTakeoffReg}
      </h3>
      <input
        type="time"
        value={modalTakeoffValue
          // Only convert to local time for display if the modal just opened, not on every render
          // So, always store and edit the local (corrected) value in modalTakeoffValue
        }
        onChange={(e) => setModalTakeoffValue(e.target.value)}
        style={{
          padding: "10px",
          borderRadius: "4px",
          fontSize: "16px",
          width: "80%",
          marginBottom: "10px",
          textAlign: "center",
        }}
        autoFocus
        step={60}
      />
      <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
        <button
          onClick={saveTakeoffModal}
          style={{
            padding: "10px 20px",
            backgroundColor: "#28a745",
            color: "white",
            borderRadius: "4px",
            border: "none",
            cursor: "pointer",
          }}
        >
          Save
        </button>
        <button
          onClick={closeTakeoffModal}
          style={{
            padding: "10px 20px",
            backgroundColor: "#dc3545",
            color: "white",
            borderRadius: "4px",
            border: "none",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}
    </>
  );
};

const Section: React.FC<{ 
  title: string | React.ReactNode; // Módosítva hogy elfogadjon React.ReactNode-ot is
  children: React.ReactNode; 
  noMinHeight?: boolean;
}> = ({ title, children, noMinHeight }) => (
  <div
    style={{
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      borderRadius: "12px",
      padding: "15px",
      marginBottom: "15px",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      color: "white",
      minHeight: noMinHeight ? undefined : "330px",
      display: "flex",
      flexDirection: "column",
    }}
  >
    <h2 style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "10px", marginTop: 0 }}>
      {title}
    </h2>
    <div style={{ flex: 1 }}>{children}</div>
  </div>
);

export default AfisProgram;
