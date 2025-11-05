import mongoose, { Schema } from "mongoose";

const chargingSessionSchema = new Schema(
  {
    stationId: { type: Schema.Types.ObjectId, ref: "ChargingStation", required: true },
    pointIdentifier: { type: String }, // Ví dụ: CP-01
    startedAt: { type: Date, required: true },
    endedAt: { type: Date },
    energyKWh: { type: Number, default: 0 },
    unitPrice: { type: Number, default: 0 }, // giá/kWh
    amount: { type: Number, default: 0 }, // tổng tiền; nếu không truyền sẽ tính = energyKWh * unitPrice
    status: { type: String, enum: ["completed", "canceled"], default: "completed" },
    deleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

chargingSessionSchema.pre("save", function (next) {
  // @ts-ignore
  if (!this.amount) {
    // @ts-ignore
    this.amount = (this.energyKWh || 0) * (this.unitPrice || 0);
  }
  next();
});

const ChargingSession = mongoose.model(
  "ChargingSession",
  chargingSessionSchema,
  "charging_sessions"
);

export default ChargingSession;
