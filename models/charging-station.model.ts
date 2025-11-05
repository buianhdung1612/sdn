import mongoose, { Schema } from "mongoose";

const chargingPointSchema = new Schema(
  {
    identifier: { type: String, required: true }, // Mã điểm sạc (ví dụ: CP-01)
    status: {
      type: String,
      enum: ["online", "offline", "occupied", "maintenance"],
      default: "offline",
    },
    powerKW: { type: Number, default: 0 }, // Công suất hiện tại (kW)
    lastHeartbeatAt: { type: Date },
  },
  { _id: true }
);

const chargingStationSchema = new Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    region: { type: String }, // Khu vực (ví dụ: HCMC, Hanoi, South, North)
    location: {
      address: { type: String },
      lat: { type: Number },
      lng: { type: Number },
    },
    status: {
      type: String,
      enum: ["online", "offline", "maintenance"],
      default: "offline",
    },
    chargingPoints: [chargingPointSchema],
    deleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

const ChargingStation = mongoose.model(
  "ChargingStation",
  chargingStationSchema,
  "charging_stations"
);

export default ChargingStation;
