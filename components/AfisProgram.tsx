'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";

const AfisProgram = () => {
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  // Ensure the component runs only on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null; // Prevent rendering on the server
  }

  // Helper function to save data to the URL
  const saveDataToUrl = (key: string, value: string) => {
    const queryParams = new URLSearchParams(window.location.search);
    queryParams.set(key, value);
    router.replace(`?${queryParams.toString()}`, undefined, { shallow: true });
  };

  // Helper function to read data from the URL
  const readDataFromUrl = (key: string): string | null => {
    const queryParams = new URLSearchParams(window.location.search);
    return queryParams.get(key);
  };

  // State initialization with default values
  const [taxiing, setTaxiing] = useState<string[]>(() => {
    const data = readDataFromUrl('taxiing');
    return data ? JSON.parse(data) : [];
  });

  const [holdingPoint, setHoldingPoint] = useState<string[]>(() => {
    const data = readDataFromUrl('holdingPoint');
    return data ? JSON.parse(data) : [];
  });

  const [visualCircuit, setVisualCircuit] = useState<string[]>(() => {
    const data = readDataFromUrl('visualCircuit');
    return data ? JSON.parse(data) : [];
  });

  const [trainingBox, setTrainingBox] = useState<{ [key: string]: string }>(() => {
    const data = readDataFromUrl('trainingBox');
    return data ? JSON.parse(data) : {};
  });

  const [crossCountry, setCrossCountry] = useState<string[]>(() => {
    const data = readDataFromUrl('crossCountry');
    return data ? JSON.parse(data) : [];
  });

  const [apron, setApron] = useState<string[]>(() => {
    const data = readDataFromUrl('apron');
    return data
      ? JSON.parse(data)
      : ["TUR", "TUP", "TUQ", "BEC", "BED", "BEZ", "BJD", "BAK"];
  });

  const [newReg, setNewReg] = useState<string>("");
  const [localIR, setLocalIR] = useState<string[]>(() => {
    const data = readDataFromUrl('localIR');
    return data ? JSON.parse(data) : [];
  });

  const [localIRDetails, setLocalIRDetails] = useState<{ [key: string]: { procedure: string; height: string; clearance: string } }>(() => {
    const data = readDataFromUrl('localIRDetails');
    return data ? JSON.parse(data) : {};
  });

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedAircraft, setSelectedAircraft] = useState<string>("");

  const [crossCountryFrequency, setCrossCountryFrequency] = useState<{ [key: string]: boolean }>({});
  const [timestamps, setTimestamps] = useState<{ [key: string]: { takeoff?: string; landed?: string } }>({});
  const [uiScale, setUiScale] = useState<number>(1);

  // Move between states
  const moveToLocalIRFromTrainingBox = (reg: string) => {
    setTrainingBox((prev) => {
      const updatedTrainingBox = { ...prev };
      delete updatedTrainingBox[reg];
      return updatedTrainingBox;
    });

    setLocalIR((prev) => [...prev, reg]);
    setLocalIRDetails((prev) => ({
      ...prev,
      [reg]: { procedure: "---", height: "", clearance: "" }
    }));
  };

  const resetStates = () => {
    setTaxiing([]);
    setHoldingPoint([]);
    setVisualCircuit([]);
    setTrainingBox({});
    setCrossCountry([]);
    setApron(["TUR", "TUP", "TUQ", "BEC", "BED", "BEZ", "BJD", "BAK"]);
    setNewReg("");
    setLocalIR([]);
    setLocalIRDetails({});
    saveDataToUrl('taxiing', JSON.stringify([]));
    saveDataToUrl('holdingPoint', JSON.stringify([]));
    saveDataToUrl('visualCircuit', JSON.stringify([]));
    saveDataToUrl('trainingBox', JSON.stringify({}));
    saveDataToUrl('crossCountry', JSON.stringify([]));
    saveDataToUrl('apron', JSON.stringify(["TUR", "TUP", "TUQ", "BEC", "BED", "BEZ", "BJD", "BAK"]));
    saveDataToUrl('localIR', JSON.stringify([]));
    saveDataToUrl('localIRDetails', JSON.stringify({}));
  };

  const handleScalingChange = (scale: number) => {
    setUiScale(scale);
  };

  // Sync data with URL
  useEffect(() => {
    saveDataToUrl('taxiing', JSON.stringify(taxiing));
    saveDataToUrl('holdingPoint', JSON.stringify(holdingPoint));
    saveDataToUrl('visualCircuit', JSON.stringify(visualCircuit));
    saveDataToUrl('trainingBox', JSON.stringify(trainingBox));
    saveDataToUrl('crossCountry', JSON.stringify(crossCountry));
    saveDataToUrl('apron', JSON.stringify(apron));
    saveDataToUrl('localIR', JSON.stringify(localIR));
    saveDataToUrl('localIRDetails', JSON.stringify(localIRDetails));
  }, [taxiing, holdingPoint, visualCircuit, trainingBox, crossCountry, apron, localIR, localIRDetails]);

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const moveToHoldingPoint = (reg: string) => {
    setTaxiing(taxiing.filter((r) => r !== reg));
    setHoldingPoint([...holdingPoint, reg]);
    setTimestamps((prev) => {
      const updatedTimestamps = { ...prev };
      delete updatedTimestamps[reg];
      return updatedTimestamps;
    });
  };

  const moveBackToTaxiing = (reg: string) => {
    setHoldingPoint(holdingPoint.filter((r) => r !== reg));
    setTaxiing([...taxiing, reg]);
    setTimestamps((prev) => {
      const updatedTimestamps = { ...prev };
      delete updatedTimestamps[reg];
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
      const updated = [...apron, newReg];
      setApron(updated);
      saveDataToUrl('apron', JSON.stringify(updated));
      setNewReg("");
    }
  };

	  const moveToTaxiFromApron = (reg: string) => {
    const updatedApron = apron.filter((r) => r !== reg);
    const updatedTaxiing = [...taxiing, reg];
    setApron(updatedApron);
    setTaxiing(updatedTaxiing);
    saveDataToUrl('apron', JSON.stringify(updatedApron));
    saveDataToUrl('taxiing', JSON.stringify(updatedTaxiing));
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
	  handleLocalIRToTrainingBox(selectedAircraft, box);
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
  <div
    style={{
      display: "flex",
      gap: `${uiScale * 15}px`,        // Scaled gap
      flexWrap: "wrap",
      justifyContent: "flex-start",
      marginBottom: `${uiScale * 20}px`,  // Scaled margin-bottom
      fontSize: `${uiScale * 18}px` // Scale font-size
    }}
  >
    {regs.map((reg, index) => {
      const onFreq = crossCountryFrequency[reg] ?? true;
      const isInLocalIR = localIR.includes(reg);
      const isInTrainingBox = trainingBox[reg];
      const isInVisualCircuit = visualCircuit.includes(reg);
      const borderColor = isCrossCountry
        ? onFreq
          ? 'limegreen'
          : 'red'
        : isInLocalIR || isInTrainingBox || isInVisualCircuit
        ? 'limegreen'
        : 'white';

      return (
        <div
          key={reg}
          style={{
            width: `${uiScale * 180}px`,  // Scaled width
            minHeight: `${uiScale * 200}px`,  // Scaled height
            border: `3px solid ${borderColor}`,
            borderRadius: `${uiScale * 15}px`,  // Scaled border-radius
            padding: `${uiScale * 12}px`,  // Scaled padding
            margin: `${uiScale * 5}px`,  // Scaled margin
            textAlign: "center",
            boxSizing: "border-box",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            color: "white",
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            fontSize: `${uiScale * 18}px`,  // Keep font scale consistent
            animation: pulsing ? "pulse 2s infinite" : undefined,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            opacity: isCrossCountry && !onFreq ? 0.5 : 1
          }}
        >
          <div style={{ fontWeight: "bold", fontSize: `${uiScale * 24}px`, marginBottom: `${uiScale * 10}px` }}>
            {index + 1}. {reg}
          </div>

          {isCrossCountry && (
            <div style={{ marginBottom: `${uiScale * 10}px` }}>
              <label style={{ fontSize: `${uiScale * 14}px` }}>
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
                  style={{ marginLeft: `${uiScale * 8}px`, transform: `scale(${uiScale * 1.5})` }}
                />
              </label>
            </div>
          )}

          {trainingBox[reg] && (
           <div style={{ fontSize: `${uiScale * 20}px`, color: "rgb(204, 204, 204)", marginBottom: `${uiScale * 10}px` }}>

              {trainingBox[reg] === "Proceeding to VC" ? "PROCEEDING TO VC" : `TB ${trainingBox[reg]}`}
              <input
                type="text"
                placeholder="Task, height"
                style={{
                  padding: `${uiScale * 6}px`,
                  borderRadius: `${uiScale * 6}px`,
                  color: 'black',
                  marginTop: `${uiScale * 8}px`,
                  width: '100%',
                }}
              />
            </div>
          )}

          {localIR.includes(reg) && (
            <>
              <select
                value={localIRDetails[reg]?.procedure || "---"}
                onChange={(e) => handleLocalIRChange(reg, 'procedure', e.target.value)}
                style={{ marginBottom: `${uiScale * 8}px`, padding: `${uiScale * 6}px`, borderRadius: `${uiScale * 6}px` }}
              > ```typescript
                {["---", "NDB Traffic Pattern", "Holding over NYR", "Holding over PQ", "RNP Z", "RNP Y", "RNP Y Circle to Land", "RNP Z Circle to Land", "VOR APP", "NDB APP"].map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <input
                type="text"
                value={localIRDetails[reg]?.height || ""}
                onChange={(e) => handleLocalIRChange(reg, 'height', e.target.value)}
                placeholder="Height"
                style={{
                  padding: `${uiScale * 6}px`,
                  borderRadius: `${uiScale * 6}px`,
                  color: 'black',
                  marginBottom: `${uiScale * 8}px`
                }}
              />
              <input
                type="text"
                value={localIRDetails[reg]?.clearance || ""}
                onChange={(e) => handleLocalIRChange(reg, 'clearance', e.target.value)}
                placeholder="Clearance"
                style={{
                  padding: `${uiScale * 6}px`,
                  borderRadius: `${uiScale * 6}px`,
                  color: 'black'
                }}
              />
            </>
          )}

          {extraContent && extraContent(reg, index)}

          {/* Take-off és Landed idő kijelzése */}
          {timestamps[reg]?.takeoff && (
            <div style={{
              fontSize: `${uiScale * 14}px`,
              color: "white",
              backgroundColor: "black",
              borderRadius: `${uiScale * 6}px`,
              padding: `${uiScale * 6}px`,
              fontWeight: "bold",
              marginTop: `${uiScale * 8}px`,
              boxShadow: "0px 0px 10px rgba(0, 255, 0, 0.6)",
            }}>
              Take-off: {timestamps[reg].takeoff}
            </div>
          )}
          {timestamps[reg]?.landed && (
            <div style={{
              fontSize: `${uiScale * 14}px`,
              color: "white",
              backgroundColor: "black",
              borderRadius: `${uiScale * 6}px`,
              padding: `${uiScale * 6}px`,
              fontWeight: "bold",
              marginTop: `${uiScale * 8}px`,
              boxShadow: "0px 0px 10px rgba(0, 0, 255, 0.6)",
            }}>
              Landed: {timestamps[reg].landed}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: `${uiScale * 6}px`, marginTop: `${uiScale * 10}px` }}>
            {actions.map(({ label, onClick }) => (
              <button
                key={label}
                style={{
                  width: "100%",
                  padding: `${uiScale * 10}px`,
                  backgroundColor: label.includes("<--") || label.includes("Vacated") || label.includes("Apron") ? "rgb(220, 53, 69)" : "rgb(40, 167, 69)"
,
                  color: "white",
                  fontSize: `${uiScale * 16}px`,
                  fontWeight: "bold",
                  borderRadius: `${uiScale * 10}px`,
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
            <div style={{ marginTop: `${uiScale * 10}px`, display: "flex", justifyContent: "space-between" }}>
              <button onClick={() => moveLeft(reg)} style={{ padding: `${uiScale * 5}px`, fontSize: `${uiScale * 20}px`, borderRadius: `${uiScale * 6}px` }}>←</button>
              <button onClick={() => moveRight(reg)} style={{ padding: `${uiScale * 5}px`, fontSize: `${uiScale * 20}px`, borderRadius: `${uiScale * 6}px` }}>→</button>
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
        }
        html {
          font-size: calc(16px * var(--ui-scale));  // A way to scale font 
        }`}
      </style>

<Section title="LHNY AFIS - Ludwig Schwarz Software Company">
  <div style={{ marginBottom: "20px", width: "800px" }}>
    <label style={{ fontSize: "16px", display: "flex", alignItems: "center" }}>
      Page size:
      <input
        type="range"
        min="0.2"
        max="1.5"
        step="0.001"
        value={uiScale}
        onChange={(e) => handleScalingChange(parseFloat(e.target.value))}
        style={{
          marginLeft: "15px",
          flex: "1",
        }}
      />
    </label>
    <button
      onClick={resetStates}
      style={{
        marginTop: "10px",
        padding: "10px 16px",
        fontSize: "16px",
        backgroundColor: "rgb(220, 53, 69)",
        color: "white",
        borderRadius: "8px",
        cursor: "pointer",
        border: "none",
      }}
    >
      Reset everything
    </button>
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



 <Container>
 <Section title={`Local IR (${localIR.length})`}>
    {renderAircraft(localIR, [
      { label: "Joining Visual Circuit", onClick: moveToVisualCircuitFromLocalIR },
      { label: "Proceed to Training Box", onClick: openTrainingBoxModal },
    ])}
  </Section>

<Section title="Training Box">
  {renderAircraft(
    Object.keys(trainingBox),
    [
      { label: "Joining Visual Circuit", onClick: moveToVisualFromTrainingBox },
      { label: "Proceed to Local IR", onClick: moveToLocalIRFromTrainingBox } // Update this line
    ]
  )}
</Section>
    </Container>

      <Section title={`Visual Circuit (${visualCircuit.length})`}>
        {renderAircraft(visualCircuit, [
          { label: "Runway Vacated", onClick: moveToTaxiingFromVisual },
          { label: "Proceed to TB", onClick: openModal },
          { label: "Proceed to Local IR", onClick: moveToLocalIR },
          { label: "Proceed to Cross Country", onClick: moveToCrossCountry }
        ])}
      </Section>

    <Container>
      <Section title={`Holding Point (${holdingPoint.length})`}>
        {renderAircraft(holdingPoint, [
          { label: "--> Visual Circuit", onClick: moveToVisualFromHolding },
          { label: "<-- Return to stand", onClick: moveBackToTaxiing },
        ], true)}
      </Section>

      <Section title={`Taxiing Aircraft (${taxiing.length})`}>
        {renderAircraft(taxiing, [
          { label: "--> Holding Point", onClick: moveToHoldingPoint },
          { label: "<-- Apron", onClick: moveBackToApron },
        ])}
      </Section>
    </Container>

      <Section title="Apron">
        {renderAircraft(apron, [{ label: "->>Taxi", onClick: moveToTaxiFromApron }])}
        <div style={{ marginTop: "var(--ui-margin)" }}>
          <input
            type="text"
            value={newReg}
            onChange={(e) => setNewReg(e.target.value)}
            placeholder="Új lajstrom"
            style={{ padding: "var(--ui-padding)", borderRadius: "8px", fontSize: "var(--ui-font-size)", color: "black" }}
          />
<button
  onClick={addAircraftToApron}
  style={{ padding: "var(--ui-padding) 16px", fontSize: "var(--ui-font-size)", backgroundColor: "rgb(40, 167, 69)", color: "white", borderRadius: "8px", cursor: "pointer", border: "none" }}
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
  style={{ marginTop: "14px", padding: "10px 20px", fontSize: "16px", backgroundColor: "rgb(220, 53, 69)", color: "white", borderRadius: "8px", border: "none", cursor: "pointer" }}
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
