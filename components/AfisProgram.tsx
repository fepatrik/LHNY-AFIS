'use client';

import React, { useState } from "react";

const AfisProgram = () => {
  const [taxiing, setTaxiing] = useState<string[]>([]);
  const [holdingPoint, setHoldingPoint] = useState<string[]>([]);
  const [visualCircuit, setVisualCircuit] = useState<string[]>([]);
  const [trainingBox, setTrainingBox] = useState<{ [key: string]: string }>({});
  const [crossCountry, setCrossCountry] = useState<string[]>([]);
  const [apron, setApron] = useState(["TUR", "TUP", "TUQ", "BEC", "BED", "BEZ", "BJD", "BAK", "BFI", "BFJ", "BJC", "BJA", "BFK", "BEY", "BFE", "BIY", "SKV", "SJK", "SUK", "PPL", "BAF", "SLW"]);
  const [newReg, setNewReg] = useState<string>("");
  const [localIR, setLocalIR] = useState<string[]>([]);
  const [localIRDetails, setLocalIRDetails] = useState<{ [key: string]: { procedure: string; height: string; clearance: string } }>({});
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedAircraft, setSelectedAircraft] = useState<string>("");
  const [crossCountryFrequency, setCrossCountryFrequency] = useState<{ [key: string]: boolean }>({});
  const [timestamps, setTimestamps] = useState<{ [key: string]: { takeoff?: string; landed?: string } }>({});
const [scale, setScale] = useState(1); // Új állapot a csúszka értékéhez
const [searchTerm, setSearchTerm] = useState<string>(""); // Keresési kifejezés
const [boxWidth, setBoxWidth] = useState(180); // Alapértelmezett szélesség 180px


const styles = {
  container: {
    display: "flex",
    gap: `${15 * scale}px`,
    flexWrap: "wrap",
    justifyContent: "flex-start",
    marginBottom: `${2 * scale}px`,
  } as React.CSSProperties,
  aircraftCard: {
    flexBasis: `${18 * scale}%`,
      maxWidth: `${boxWidth}px`, // Dinamikus szélesség
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


const getCurrentTime = () => {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};



const moveToCrossCountryFromApron = (reg: string) => {
  setApron((prev) => prev.filter((r) => r !== reg)); // Eltávolítja a gépet az Apron állapotból
  setCrossCountry((prev) => [...prev, reg]);        // Hozzáadja a gépet a Cross Country állapothoz
};

const moveToHoldingPointFromApron = (reg: string) => {
  setApron((prev) => prev.filter((r) => r !== reg)); // Eltávolítja a gépet az Apron állapotból
  setHoldingPoint((prev) => [...prev, reg]);        // Hozzáadja a gépet a Holding Point állapothoz
  setTimestamps((prev) => {
    const updatedTimestamps = { ...prev };
    delete updatedTimestamps[reg]; // Reset timestamp when moving from Apron to Holding Point
    return updatedTimestamps;
  });
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

const resetSizes = () => {
  setScale(1);     // Alapértelmezett skála
  setBoxWidth(180); // Alapértelmezett szélesség
};

  const moveToVisualCircuitFromLocalIR = (reg: string) => {
    setLocalIR(localIR.filter((r) => r !== reg));
    setVisualCircuit([...visualCircuit, reg]);
    const updatedDetails = { ...localIRDetails };
    delete updatedDetails[reg];
    setLocalIRDetails(updatedDetails);
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
  setLocalIR(localIR.filter((r) => r !== reg)); // Hozzáadott sor: törli a gépet a Local IR-ből
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

const moveToLocalIRFromCrossCountry = (reg: string) => {
  setCrossCountry((prev) => prev.filter((r) => r !== reg)); // Eltávolítja a Cross Country állapotból
  setLocalIR((prev) => [...prev, reg]); // Hozzáadja a Local IR állapothoz
  setLocalIRDetails((prev) => ({
    ...prev,
    [reg]: { procedure: "---", height: "", clearance: "" }, // Alapértelmezett értékek a Local IR-hez
  }));
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
          <div style={{ fontWeight: "bold", fontSize: `${20 * scale}px`, marginBottom: `${10 * scale}px` }}>
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

<div style={{
  display: "grid",
  gridTemplateColumns: "1fr 1fr", // 2 oszlop
  gap: `${6 * scale}px`, // Távolság a gombok között
  marginTop: `${10 * scale}px`
}}>
  {actions.map(({ label, onClick }, index) => (
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
        gridColumn: actions.length === 1 || actions.length % 2 !== 0 && index === actions.length - 1 ? "span 2" : undefined, // Ha egy gomb van, vagy utolsó gomb páratlan számban, töltsön ki két oszlopot
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



<Section title="LHNY AFIS - by Ludwig Schwarz Software Company">
    <h2>Size:</h2>
  <input
    type="range"
    style={{ width: '600px' }} // Fix szélesség, nem hat a skála
    min="0.5" // 10%-nak megfelelő alsó érték
    max="1.2" // 110%-nak megfelelő felső érték
    step="0.001" // Nagyon finom lépések
    value={scale}
    onChange={(e) => setScale(parseFloat(e.target.value))} // A skálaérték frissítése
  />

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
      <p>Adjust sizes with the slider. Click on active training box to switch selected training box. Data is lost after refreshing the page!</p>
<button
  style={{
    marginTop: '10px',
    padding: '10px 20px',
    fontSize: '16px',
    backgroundColor: '#007BFF',
    color: 'white',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer'
  }}
  onClick={resetSizes}
>
  Reset size to default
</button>
</Section>


<Section title="Cross Country">
  {renderAircraft(
    crossCountry,
    [
      { label: "Joining VC", onClick: moveToVisualFromCrossCountry },
      { label: "Local IR", onClick: moveToLocalIRFromCrossCountry }, // Új gomb hozzáadása
    ],
    false,
    (reg) => (
      <textarea
        style={{ marginTop: "8px", padding: "6px", borderRadius: "8px", color: "black" }}
        placeholder="Proceeding to..."
      />
    ),
    true // Flag indicating Cross Country state
  )}
</Section>

<div style={{ display: "flex", width: "100%", marginBottom: "25px" }}>
  <div style={{ flex: 1, marginRight: "10px" }}>
<Section title="Local IR">
  {renderAircraft(localIR, [
    { label: "Join VC", onClick: moveToVisualCircuitFromLocalIR },
    { label: "Training Box", onClick: openModal }, // Új gomb hozzáadása
	{ label: "Cross Country", onClick: moveToCrossCountry }, // Új gomb hozzáadása
	{ label: "Runway Vacated", onClick: moveToTaxiingFromLocalIR }
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
         { label: "Local IR", onClick: moveToLocalIR },         
		 { label: "Training Box", onClick: openModal },

          { label: "Cross Country", onClick: moveToCrossCountry },
		  { label: "Runway Vacated", onClick: moveToTaxiingFromVisual }
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
  {renderAircraft(
    [...apron]
      .filter((reg) => reg.includes(searchTerm)) // Szűrés a keresési feltétel alapján
      .sort((a, b) => a.localeCompare(b)), // Sort the array alphabetically
    [
      { label: "Holding Point", onClick: moveToHoldingPointFromApron },
	  { label: "Taxi", onClick: moveToTaxiFromApron },
      { label: "Cross Country", onClick: moveToCrossCountryFromApron } // Új gomb hozzáadása
    ]
  )}
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
            {["1", "2", "3", "4", "5", "6","7", "5-6","1-2","2-3","1-2-3", "100","PROCEEDING TO VC"].map((box) => (
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