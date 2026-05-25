import { useState } from "react";
import { useDispatch } from "react-redux";

import { setField } from "../store/interactionSlice";

const specialties = ["Cardiology", "Endocrinology", "Oncology", "Neurology", "Primary Care", "Other"];

function HCPSelectionModal({ onCancel, onContinue }) {
  const dispatch = useDispatch();
  const [hcp, setHcp] = useState({
    name: "Dr. Smith",
    id: "HCP-1001",
    specialty: "Cardiology",
    organization: "CityCare Medical Center",
    previousInteractions: "3 recorded interactions",
    lastInteraction: "Recent field visit",
  });

  const update = (field, value) => {
    setHcp((current) => ({ ...current, [field]: value }));
  };

  const handleContinue = () => {
    const selectedHcp = {
      ...hcp,
      name: hcp.name.trim() || "Selected HCP",
      id: hcp.id.trim() || "HCP-0000",
    };

    sessionStorage.setItem("selected_hcp_context", JSON.stringify(selectedHcp));
    dispatch(setField({ field: "hcp_name", value: selectedHcp.name }));
    onContinue(selectedHcp);
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="hcp-modal" role="dialog" aria-modal="true" aria-labelledby="hcp-modal-title">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Workspace context</p>
            <h2 id="hcp-modal-title">Select Healthcare Professional</h2>
          </div>
          <button className="icon-button" type="button" onClick={onCancel} aria-label="Close HCP selection">
            x
          </button>
        </div>

        <div className="modal-form">
          <label>
            HCP Name
            <input value={hcp.name} onChange={(event) => update("name", event.target.value)} placeholder="Enter HCP name" />
          </label>
          <label>
            HCP ID
            <input value={hcp.id} onChange={(event) => update("id", event.target.value)} placeholder="Enter HCP ID" />
          </label>
          <label>
            Specialty
            <select value={hcp.specialty} onChange={(event) => update("specialty", event.target.value)}>
              {specialties.map((specialty) => (
                <option key={specialty}>{specialty}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="modal-preview">
          <span>Selected workspace</span>
          <strong>{hcp.name || "Healthcare Professional"}</strong>
          <p>{hcp.specialty} | {hcp.id || "HCP ID pending"}</p>
        </div>

        <div className="modal-actions">
          <button className="secondary-button" type="button" onClick={onCancel}>Cancel</button>
          <button type="button" onClick={handleContinue}>Continue</button>
        </div>
      </div>
    </div>
  );
}

export default HCPSelectionModal;
