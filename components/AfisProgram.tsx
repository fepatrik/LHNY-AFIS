'use client';

import React, { useState } from "react";

const AfisProgram = () => {
  const [taxiing, setTaxiing] = useState<string[]>([]);
  const [holdingPoint, setHoldingPoint] = useState<string[]>([]);
  const [visualCircuit, setVisualCircuit] = useState<string[]>([]);
  const [trainingBox, setTrainingBox] = useState<{ [key: string]: string }>({});
  const [crossCountry, setCrossCountry] = useState<string[]>([]);
  const [apron, setApron] = useState(["TUR", "TUP", "TUQ", "BEC", "BED", "BEZ", "BJD", "BAK", "BFI", "BFJ", "BJC", "BFK", "BEY", "BFE", "BIY", "SKV", "SJK", "SUK", "PPL", "BAF", "SLW"]);
  const [newReg, setNewReg] = useState<string>("");
  const [localIR, setLocalIR] = useState<string[]>([]);
  const [localIRDetails, setLocalIRDetails] = useState<{ [key: string]: { procedure: string; height: string; clearance: string } }>({});
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedAircraft, setSelectedAircraft] = useState<string>("");
  const [crossCountryFrequency, setCrossCountryFrequency] = useState<{ [key: string]: boolean }>({});
  const [timestamps, setTimestamps] = useState<{ [key: string]: { takeoff?: string; landed?: string } }>({});
const [scale, setScale] = useState(1); // Új állapot a csúszka értékéhez

  const styles = {
    container: {
      display: "flex",
      gap: `${15 * scale}px`,
      justifyContent: "flex-start",
      marginBottom: `${20 * scale}px`,
    },
    aircraftCard: {
      flexBasis: `${22 * scale}%`,
      maxWidth: `${220 * scale}px`,
      minHeight: `${200 * scale}px`,
      border: `${3 * scale}px solid white`,
      borderRadius: `${15 * scale}px`,
      padding: `${12 * scale}px`,
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
    },
    mediaQueries: `
      @media (max-width: ${1024 * scale}px) {
        .aircraftCard {
          flex-basis: ${45 * scale}%;
          max-width: 100%;
        }
        .container {
          gap: ${10 * scale}px;
        }
      }
    `,
  };


const getCurrentTime = () => {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};

const moveToLocalIRFromTrainingBox = (reg: string) => {
  setTrainingBox((prev) => {
    const copy = { ...prev };
    delete copy[reg]; // Törli a gépet a Training Box-ból
    return copy;
  });
  setLocalIR((prev) => [...prev, reg]); // Hozzáadja a gépet a Local IR-hez
  setLocalIRDetails((prev) => ({
    ...prev,
    [reg]: { procedure: "---", height: "", clearance: "" }, // Default értékek a Local IR-hez
  }));
};

const moveToHoldingPoint = (reg: string) => {
  setTaxiing(taxiing.filter((r) => r !== reg));
  setHoldingPoint([...holdingPoint, reg]);
  setTimestamps((prev) => {
    const updatedTimestamps = { ...prev };
    delete updatedTimestamps[reg]; // Reset timestamp when moving to Holding Point
    return updatedTimestamps;
  });
};

const moveBackToTaxiing = (reg: string) => {
  setHoldingPoint(holdingPoint.filter((r) => r !== reg));
  setTaxiing([...taxiing, reg]);
  setTimestamps((prev) => {
    const updatedTimestamps = { ...prev };
    delete updatedTimestamps[reg]; // Reset timestamp when moving back to Taxiing
    return updatedTimestamps;
  });
};

  const moveToVisualFromHolding = (reg: string) => {
  setHoldingPoint((prev) => prev.filter((r) => r !== reg));
  setVisualCircuit((prev) => [...prev, reg]);
  setTimestamps((prev) => ({
    ...prev,
    [reg]: {
      ...prev[reg],
      takeoff: getCurrentTime()
    }
  }));
};

const moveToTaxiingFromLocalIR = (reg: string) => {
  setLocalIR(localIR.filter((r) => r !== reg));
  setTaxiing([...taxiing, reg]);
  setTimestamps((prev) => ({
    ...prev,
    [reg]: {
      ...prev[reg],
      landed: getCurrentTime(),
    }
  }));
};

const moveToTaxiingFromVisual = (reg: string) => {
  setVisualCircuit((prev) => prev.filter((r) => r !== reg));
  setTaxiing((prev) => [...prev, reg]);
  setTimestamps((prev) => ({
    ...prev,
    [reg]: {
      ...prev[reg],
      landed: getCurrentTime()
    }
  }));
};

  const moveToVisualCircuitFromLocalIR = (reg: string) => {
    setLocalIR(localIR.filter((r) => r !== reg));
    setVisualCircuit([...visualCircuit, reg]);
    const updatedDetails = { ...localIRDetails };
    delete updatedDetails[reg];
    setLocalIRDetails(updatedDetails);
  };

  const addAircraftToApron = () => {
    if (newReg) {
      setApron([...apron, newReg]);
      setNewReg("");
    }
  };

const moveToTaxiFromApron = (reg: string) => {
  setApron(apron.filter((r) => r !== reg));
  setTaxiing([...taxiing, reg]);
  setTimestamps((prev) => {
    const updatedTimestamps = { ...prev };
    delete updatedTimestamps[reg]; // Reset timestamp when moving from Apron to Taxiing
    return updatedTimestamps;
  });
};

const moveBackToApron = (reg: string) => {
  setTaxiing(taxiing.filter((r) => r !== reg));
  setApron([...apron, reg]);
  setTimestamps((prev) => {
    const updatedTimestamps = { ...prev };
    delete updatedTimestamps[reg]; // Reset timestamp when moving back to Apron
    return updatedTimestamps;
  });
};

  const moveToTrainingBox = (reg: string, box: string) => {
    setVisualCircuit(visualCircuit.filter((r) => r !== reg));
    setTrainingBox({ ...trainingBox, [reg]: box });
  };

  const moveToLocalIR = (reg: string) => {
    setVisualCircuit(visualCircuit.filter((r) => r !== reg));
    setLocalIR([...localIR, reg]);
    setLocalIRDetails({ ...localIRDetails, [reg]: { procedure: "---", height: "", clearance: "" } });
  };

const moveToCrossCountry = (reg: string) => {
  setTrainingBox((prev) => {
    const copy = { ...prev };
    delete copy[reg];
    return copy;
  });
  setVisualCircuit((prev) => prev.filter((r) => r !== reg));
  setLocalIR((prev) => prev.filter((r) => r !== reg));
  setHoldingPoint((prev) => prev.filter((r) => r !== reg));
  setTaxiing((prev) => prev.filter((r) => r !== reg));
  setCrossCountry((prev) => [...prev, reg]);
  setCrossCountryFrequency((prev) => ({ ...prev, [reg]: true })); // << EZ AZ ÚJ SOR
};

  const moveToVisualFromTrainingBox = (reg: string) => {
    setTrainingBox((prev) => {
      const copy = { ...prev };
      delete copy[reg];
      return copy;
    });
    setVisualCircuit([...visualCircuit, reg]);
  };

  const moveToVisualFromCrossCountry = (reg: string) => {
    setCrossCountry(crossCountry.filter((r) => r !== reg));
    setVisualCircuit([...visualCircuit, reg]);
  };

  const handleLocalIRChange = (reg: string, field: 'procedure' | 'height' | 'clearance', value: string) => {
    setLocalIRDetails(prev => ({
      ...prev,
      [reg]: {
        ...prev[reg],
        [field]: value
      }
    }));
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
    const idx = visualCircuit.indexOf(reg);
    if (idx > 0) {
      const newVC = [...visualCircuit];
      [newVC[idx - 1], newVC[idx]] = [newVC[idx], newVC[idx - 1]];
      setVisualCircuit(newVC);
    }
  };

  const moveRight = (reg: string) => {
    const idx = visualCircuit.indexOf(reg);
    if (idx < visualCircuit.length - 1) {
      const newVC = [...visualCircuit];
      [newVC[idx], newVC[idx + 1]] = [newVC[idx + 1], newVC[idx]];
      setVisualCircuit(newVC);
    }
  };

const renderAircraft = (
  regs: string[],
  actions: { label: string; onClick: (reg: string) => void }[],
  pulsing: boolean = false,
  extraContent?: (reg: string, index?: number) => React.ReactNode,
  isCrossCountry: boolean = false
) => (
  <div className="container" style={styles.container}>
    {regs.map((reg, index) => {
      const onFreq = crossCountryFrequency[reg] ?? true; // default true
      const isInLocalIR = localIR.includes(reg);
      const isInTrainingBox = trainingBox[reg];
      const isInVisualCircuit = visualCircuit.includes(reg);
      const borderColor = isCrossCountry
        ? onFreq
          ? 'limegreen'
          : 'red'
        : isInLocalIR || isInTrainingBox || isInVisualCircuit
        ? 'limegreen' // green border for local IR, training box, or visual circuit
        : 'white'; // default to white border

      return (
        <div
          key={reg}
          className="aircraftCard"
          style={{
            ...styles.aircraftCard,
            border: `3px solid ${borderColor}`,
            animation: pulsing ? "pulse 2s infinite" : undefined,
            opacity: isCrossCountry && !onFreq ? 0.5 : 1, // halvány ha nincs frekin
            fontSize: `${18 * scale}px`, // Betűméret szorzása a scale értékével
          }}
        >
          <div style={{ fontWeight: "bold", fontSize: `${24 * scale}px`, marginBottom: `${10 * scale}px` }}>
            {index + 1}. {reg}
          </div>

          {isCrossCountry && (
            <div style={{ marginBottom: `${10 * scale}px` }}>
              <label style={{ fontSize: `${14 * scale}px` }}>
                On Frequency
                <input
                  type="checkbox"
                  checked={onFreq}
                  onChange={() =>
                    setCrossCountryFrequency((prev) => ({
                      ...prev,
                      [reg]: !prev[reg]
                    }))
                  }
                  style={{ marginLeft: `${8 * scale}px`, transform: `scale(${1.5 * scale})` }}
                />
              </label>
            </div>
          )}

          {trainingBox[reg] && (
            <div
              style={{ fontSize: `${20 * scale}px`, color: "#ccc", marginBottom: `${10 * scale}px`, cursor: "pointer" }}
              onClick={() => openModal(reg)}
              title="Click to change training box"
            >
              {trainingBox[reg] === "Proceeding to VC" ? "PROCEEDING TO VC" : `TB ${trainingBox[reg]}`}
            </div>
          )}

          {localIR.includes(reg) && (
            <>
              <select
                value={localIRDetails[reg]?.procedure || "---"}
                onChange={(e) => handleLocalIRChange(reg, 'procedure', e.target.value)}
                style={{ marginBottom: `${8 * scale}px`, padding: `${6 * scale}px`, borderRadius: `${6 * scale}px` }}
              >
                {["---", "NDB Traffic Pattern", "Holding NYR", "Holding PQ", "RNP Z", "RNP Y", "RNP Y Circle to Land", "RNP Z Circle to Land", "VOR APP", "NDB APP"].map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <input
                type="text"
                value={localIRDetails[reg]?.height || ""}
                onChange={(e) => handleLocalIRChange(reg, 'height', e.target.value)}
                placeholder="Height"
                style={{ padding: `${6 * scale}px`, borderRadius: `${6 * scale}px`, color: 'black', marginBottom: `${8 * scale}px` }}
              />
              <input
                type="text"
                value={localIRDetails[reg]?.clearance || ""}
                onChange={(e) => handleLocalIRChange(reg, 'clearance', e.target.value)}
                placeholder="Remark"
                style={{ padding: `${6 * scale}px`, borderRadius: `${6 * scale}px`, color: 'black' }}
              />
            </>
          )}

          {extraContent && extraContent(reg, index)}

          {/* Take-off és Landed idő kijelzése */}
          {timestamps[reg]?.takeoff && (
            <div style={{
              fontSize: `${14 * scale}px`,
              color: "white",
              backgroundColor: "black",
              borderRadius: `${6 * scale}px`,
              padding: `${6 * scale}px`,
              fontWeight: "bold",
              marginTop: `${8 * scale}px`,
              boxShadow: "0px 0px 10px rgba(0, 255, 0, 0.6)",
            }}>
              Take-off: {timestamps[reg].takeoff}
            </div>
          )}
          {timestamps[reg]?.landed && (
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
              Landed: {timestamps[reg].landed}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: `${6 * scale}px`, marginTop: `${10 * scale}px` }}>
            {actions.map(({ label, onClick }) => (
              <button
                key={label}
                style={{
                  width: "100%",
                  padding: `${10 * scale}px`,
                  backgroundColor:
                    label === "Proceed to TB" || label === "Proceed to Local IR" || label === "Proceed to Cross Country"
                      ? "#28a745" // Green for "Proceed to TB", "Proceed to Local IR", and "Proceed to Cross Country"
                      : label.includes("<--") || label.includes("Vacated") || label.includes("Apron")
                      ? "#dc3545" // Red for specific actions
                      : "#28a745", // Green for default actions
                  color: "white",
                  fontSize: `${16 * scale}px`,
                  fontWeight: "bold",
                  borderRadius: `${10 * scale}px`,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
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




  return (
    <>
      <style>
        {`@keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); }
          50% { box-shadow: 0 0 10px 5px rgba(255, 255, 255, 0.8); }
          100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); }
        }`}
      </style>

      <style>{styles.mediaQueries}</style>

<Section title="AFIS Program - by Ludwig Schwarz Software Company">
  <input
    type="range"
    style={{ width: '600px' }} // Fix szélesség, nem hat a skála
    min="0.5" // 10%-nak megfelelő alsó érték
    max="1.2" // 110%-nak megfelelő felső érték
    step="0.001" // Nagyon finom lépések
    value={scale}
    onChange={(e) => setScale(parseFloat(e.target.value))} // A skálaérték frissítése
  />
  <div
    style={{
      marginTop: '20px', // Fix margin, nem változik a skálával
      padding: '10px', // Fix padding, nem változik a skálával
      fontSize: '16px', // Fix betűméret, nem változik a skálával
    }}
  >
    Adjust scaling with the slider. Click on active training box to switch selected training box. Data is lost after refreshing the page!
  </div>
</Section>


<Section title="Cross Country">
  {renderAircraft(
    crossCountry,
    [{ label: "Joining Visual Circuit", onClick: moveToVisualFromCrossCountry }],
    false,
    (reg) => (
      <textarea
        style={{ marginTop: "8px", padding: "6px", borderRadius: "8px", color: "black" }}
        placeholder="Proceeding to..."
      />
    ),
    true // << EZ AZ ÚJ FLAG: isCrossCountry
  )}
</Section>

<div style={{ display: "flex", width: "100%", marginBottom: "25px" }}>
  <div style={{ flex: 1, marginRight: "10px" }}>
<Section title="Local IR">
  {renderAircraft(localIR, [
    { label: "Join VC", onClick: moveToVisualCircuitFromLocalIR },
    { label: "Runway Vacated", onClick: moveToTaxiingFromLocalIR }, // Add the new button here
  ])}
</Section>
  </div>

  <div style={{ flex: 1, marginLeft: "10px" }}>
    <Section title="Training Box">
{renderAircraft(
  Object.keys(trainingBox),
  [
    { label: "Join VC", onClick: moveToVisualFromTrainingBox },
    { label: "Local IR", onClick: moveToLocalIRFromTrainingBox }
  ]
)}
    </Section>
  </div>
</div>

      <Section title={`Visual Circuit (${visualCircuit.length})`}>
        {renderAircraft(visualCircuit, [
          { label: "Runway Vacated", onClick: moveToTaxiingFromVisual },
          { label: "Training Box", onClick: openModal },
          { label: "Local IR", onClick: moveToLocalIR },
          { label: "Cross Country", onClick: moveToCrossCountry }
        ])}
      </Section>

<div style={{ display: "flex", width: "100%", marginBottom: "25px" }}>
  <div style={{ flex: 1, marginRight: "10px" }}>
    <Section title="Holding Point">
      {renderAircraft(holdingPoint, [
        { label: "Visual Circuit", onClick: moveToVisualFromHolding },
        { label: "Return to stand", onClick: moveBackToTaxiing },
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
  {renderAircraft(
    [...apron].sort((a, b) => a.localeCompare(b)), // Sort the array alphabetically
    [{ label: "Taxi", onClick: moveToTaxiFromApron }]
  )}
  <div className="flex gap-2" style={{ marginTop: "10px" }}>
    <input
      type="text"
      value={newReg}
      onChange={(e) => setNewReg(e.target.value)}
      placeholder="Új lajstrom"
      style={{ padding: "8px", borderRadius: "8px", fontSize: "16px", color: "black" }}
    />
    <button
      onClick={addAircraftToApron}
      style={{ padding: "8px 16px", fontSize: "16px", backgroundColor: "#28a745", color: "white", borderRadius: "8px", cursor: "pointer", border: "none" }}
    >
      Hozzáadás
    </button>
  </div>
</Section>
	  
	  
	  
	  

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
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
        }}>
          <div style={{
            backgroundColor: "#222",
            padding: "20px",
            borderRadius: "12px",
            textAlign: "center",
            minWidth: "320px",
            color: "white"
          }}>
            <h3 style={{ fontSize: "20px", marginBottom: "16px" }}>Choose TB for {selectedAircraft}:</h3>
            {["1", "2", "3", "4", "5", "6","7", "5-6","1-2","2-3","1-2-3", "100",].map((box) => (
              <button
                key={box}
                onClick={() => handleTrainingBoxSelection(box)}
                style={{ margin: "6px", padding: "10px 20px", fontSize: "16px", backgroundColor: "#007BFF", color: "white", borderRadius: "8px", border: "none", cursor: "pointer" }}
              >
                TB {box}
              </button>
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
    </>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", borderRadius: "12px", padding: "15px", marginBottom: "25px", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", color: "white" }}>
    <h2 style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "10px" }}>{title}</h2>
    {children}
  </div>
);

export default AfisProgram;