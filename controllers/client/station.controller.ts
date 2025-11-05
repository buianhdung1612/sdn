import { Response } from "express";
import mongoose from "mongoose";
import ChargingStation from "../../models/charging-station.model";
import IncidentReport from "../../models/incident-report.model";
import { RequestClient } from "../../interfaces/request.interface";
import { reportIncidentSchema } from "../../validates/client/station.validate";

// GET /api/client/station/:stationId/status
export const getStationStatus = async (req: RequestClient, res: Response) => {
  try {
    const { stationId } = (req as any).params as { stationId: string };

    if (!mongoose.isValidObjectId(stationId)) {
      return res.status(400).json({ success: false, message: "stationId không hợp lệ" });
    }

    const station = await ChargingStation.findOne({
      _id: new mongoose.Types.ObjectId(stationId),
      deleted: false,
    });

    if (!station) {
      return res.status(404).json({ success: false, message: "Không tìm thấy trạm sạc" });
    }

    // Tính toán tổng quan nhanh
    const totalPoints = station.chargingPoints?.length || 0;
    const onlinePoints = station.chargingPoints?.filter((p: any) => p.status === "online").length || 0;
    const occupiedPoints = station.chargingPoints?.filter((p: any) => p.status === "occupied").length || 0;

    return res.json({
      success: true,
      message: "Lấy tình trạng trạm sạc thành công",
      data: {
        station: {
          id: station._id.toString(),
          name: station.name,
          code: station.code,
          status: station.status,
          location: station.location,
          totalPoints,
          onlinePoints,
          occupiedPoints,
        },
        chargingPoints: (station as any).chargingPoints?.map((p: any) => ({
          id: p._id.toString(),
          identifier: p.identifier,
          status: p.status,
          powerKW: p.powerKW,
          lastHeartbeatAt: p.lastHeartbeatAt,
        })) || [],
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Đã có lỗi xảy ra, vui lòng thử lại sau!" });
  }
};

// POST /api/client/station/:stationId/incidents
export const reportIncident = async (req: RequestClient, res: Response) => {
  try {
    const { stationId } = (req as any).params as { stationId: string };
    const reporterId = req.userId;

    if (!reporterId) {
      return res.status(401).json({ success: false, message: "Không xác định người dùng" });
    }

    if (!mongoose.isValidObjectId(stationId)) {
      return res.status(400).json({ success: false, message: "stationId không hợp lệ" });
    }

    // Validate body
    const { value, error } = reportIncidentSchema.validate((req as any).body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors: error.details.map((d: any) => d.message),
      });
    }

    // Đảm bảo trạm tồn tại
    const station = await ChargingStation.findOne({
      _id: new mongoose.Types.ObjectId(stationId),
      deleted: false,
    }).select("_id");
    if (!station) {
      return res.status(404).json({ success: false, message: "Không tìm thấy trạm sạc" });
    }

    const created = await IncidentReport.create({
      stationId: station._id,
      reporterId,
      type: value.type,
      description: value.description,
      severity: value.severity,
      images: value.images || [],
      status: "open",
    });

    return res.status(201).json({
      success: true,
      message: "Gửi báo cáo sự cố thành công",
      data: {
        id: created._id.toString(),
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Đã có lỗi xảy ra, vui lòng thử lại sau!" });
  }
};
