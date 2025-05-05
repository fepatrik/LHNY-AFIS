'use client';

import React, { useState } from "react";

const AfisProgram = () => {
  const [taxiing, setTaxiing] = useState<string[]>([]);
  const [holdingPoint, setHoldingPoint] = useState<string[]>([]);
  const [visualCircuit, setVisualCircuit] = useState<string[]>([]);
  const [trainingBox, setTrainingBox] = useState<{ [key: string]: string }>({});
  const [crossCountry, setCrossCountry] = useState<string[]>([]);
  const [apron, setApron] = useState(["TUR", "TUP", "TUQ", "BEC", "BED", "BEZ", "BJD", "BAK", "BFI", "BFJ", "BJA", "BJC", "BFK", "BEY", "BFE", "BIY", "SKV", "SJK", "SUK", "PPL", "BAF", "SLW"]);
  const [newReg, setNewReg] = useState<string>("");
  const [localIR, setLocalIR] = useState<string[]>([]);
  const [localIRDetails, setLocalIRDetails] = useState<{ [key: string]: { procedure: string; height: string; clearance: string } }>({});
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedAircraft, setSelectedAircraft] = useState<string>("");
  const [crossCountryFrequency, setCrossCountryFrequency] = useState<{ [key: string]: boolean }>({});
  const [timestamps, setTimestamps] = useState<{ [key: string]: { takeoff?: string; landed?: string } }>({});


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
  <div style={{ display: "flex", gap: "15px", flexWrap: "wrap", justifyContent: "flex-start", marginBottom: "20px" }}>
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
          style={{
            width: "180px",
            minHeight: "200px",
            border: `3px solid ${borderColor}`,
            borderRadius: "15px",
            padding: "12px",
            margin: "5px",
            textAlign: "center",
            boxSizing: "border-box",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            color: "white",
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            fontSize: "18px",
            animation: pulsing ? "pulse 2s infinite" : undefined,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            opacity: isCrossCountry && !onFreq ? 0.5 : 1 // halvány ha nincs frekin
          }}
        >
          <div style={{ fontWeight: "bold", fontSize: "24px", marginBottom: "10px" }}>{index + 1}. {reg}</div>

          {isCrossCountry && (
            <div style={{ marginBottom: "10px" }}>
              <label style={{ fontSize: "14px" }}>
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
                  style={{ marginLeft: "8px", transform: "scale(1.5)" }}
                />
              </label>
            </div>
          )}

{trainingBox[reg] && (
  <div
    style={{ fontSize: "20px", color: "#ccc", marginBottom: "10px", cursor: "pointer" }}
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
                style={{ marginBottom: '8px', padding: '6px', borderRadius: '6px' }}
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
                style={{ padding: '6px', borderRadius: '6px', color: 'black', marginBottom: '8px' }}
              />
              <input
                type="text"
                value={localIRDetails[reg]?.clearance || ""}
                onChange={(e) => handleLocalIRChange(reg, 'clearance', e.target.value)}
                placeholder="Remark"
                style={{ padding: '6px', borderRadius: '6px', color: 'black' }}
              />
            </>
          )}

          {extraContent && extraContent(reg, index)}

          {/* Take-off és Landed idő kijelzése */}
          {timestamps[reg]?.takeoff && (
  <div style={{
    fontSize: "14px",
    color: "white",
    backgroundColor: "black",
    borderRadius: "6px",
    padding: "6px",
    fontWeight: "bold",
    marginTop: "8px",
    boxShadow: "0px 0px 10px rgba(0, 255, 0, 0.6)",
  }}>
    Take-off: {timestamps[reg].takeoff}
  </div>
)}
{timestamps[reg]?.landed && (
  <div style={{
    fontSize: "14px",
    color: "white",
    backgroundColor: "black",
    borderRadius: "6px",
    padding: "6px",
    fontWeight: "bold",
    marginTop: "8px",
    boxShadow: "0px 0px 10px rgba(0, 0, 255, 0.6)",
  }}>
    Landed: {timestamps[reg].landed}
  </div>
)}

          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "10px" }}>
            {actions.map(({ label, onClick }) => (
              <button
                key={label}
style={{
  width: "100%",
  padding: "10px",
  backgroundColor:
    label === "Proceed to TB" || label === "Proceed to Local IR" || label === "Proceed to Cross Country"
      ? "#28a745" // Green for "Proceed to TB", "Proceed to Local IR", and "Proceed to Cross Country"
      : label.includes("<--") || label.includes("Vacated") || label.includes("Apron")
      ? "#dc3545" // Red for specific actions
      : "#28a745", // Green for default actions
  color: "white",
  fontSize: "16px",
  fontWeight: "bold",
  borderRadius: "10px",
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

          {visualCircuit.includes(reg) && (
            <div style={{ marginTop: "10px", display: "flex", justifyContent: "space-between" }}>
              <button onClick={() => moveLeft(reg)} style={{ padding: "5px", fontSize: "20px", borderRadius: "6px" }}>←</button>
              <button onClick={() => moveRight(reg)} style={{ padding: "5px", fontSize: "20px", borderRadius: "6px" }}>→</button>
            </div>
          )}
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