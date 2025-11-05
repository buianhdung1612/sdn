import mongoose, { Schema } from "mongoose";

const incidentReportSchema = new Schema(
  {
    stationId: { type: Schema.Types.ObjectId, ref: "ChargingStation", required: true },
    reporterId: { type: String, required: true }, // id người báo cáo (từ token)
    type: { type: String, required: true }, // loại sự cố
    description: { type: String, required: true },
    severity: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },
    images: [{ type: String }],
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved"],
      default: "open",
    },
    deleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

const IncidentReport = mongoose.model(
  "IncidentReport",
  incidentReportSchema,
  "incident_reports"
);

export default IncidentReport;
