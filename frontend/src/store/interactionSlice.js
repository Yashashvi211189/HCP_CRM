import { createSlice } from "@reduxjs/toolkit";

const pad = (value) => String(value).padStart(2, "0");

const buildInitialState = () => {
  const now = new Date();
  return {
    hcp_name: "",
    interaction_type: "Meeting",
    interaction_date: now.toISOString().slice(0, 10),
    interaction_time: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
    attendees: "",
    topics_discussed: "",
    materials_shared: "",
    samples_distributed: "",
    sentiment: "Neutral",
    outcomes: "",
    followup_actions: "",
    ai_suggested_followups: [],
    isSaving: false,
    savedId: null,
    saveError: null,
  };
};

const interactionSlice = createSlice({
  name: "interaction",
  initialState: buildInitialState(),
  reducers: {
    setField: (state, action) => {
      state[action.payload.field] = action.payload.value;
    },
    populateFromAI: (state, action) => {
      Object.entries(action.payload || {}).forEach(([field, value]) => {
        if (field in state && value !== null && value !== undefined) {
          state[field] = field === "ai_suggested_followups" && typeof value === "string" ? value.split("\n").filter(Boolean) : value;
        }
      });
    },
    setSuggestions: (state, action) => {
      state.ai_suggested_followups = action.payload || [];
    },
    setSaving: (state, action) => {
      state.isSaving = action.payload;
    },
    setSavedId: (state, action) => {
      state.savedId = action.payload;
      state.saveError = null;
    },
    setSaveError: (state, action) => {
      state.saveError = action.payload;
    },
    resetForm: () => buildInitialState(),
  },
});

export const { setField, populateFromAI, setSuggestions, setSaving, setSavedId, setSaveError, resetForm } =
  interactionSlice.actions;
export default interactionSlice.reducer;
