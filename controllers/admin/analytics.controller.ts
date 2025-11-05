import { Request, Response } from "express";
import mongoose from "mongoose";
import ChargingSession from "../../models/charging-session.model";

// GET /admin/analytics/revenue
// query: groupBy=station|region|time, period=day|week|month, start, end
export const getRevenue = async (req: Request, res: Response) => {
  try {
    const groupBy = (req.query.groupBy as string) || "station";
    const period = (req.query.period as string) || "day"; // for groupBy=time
    const start = req.query.start ? new Date(req.query.start as string) : undefined;
    const end = req.query.end ? new Date(req.query.end as string) : undefined;

    const match: any = { deleted: false, status: "completed" };
    if (start || end) {
      match.startedAt = {};
      if (start) match.startedAt.$gte = start;
      if (end) match.startedAt.$lte = end;
    }

    const pipeline: any[] = [{ $match: match }];

    if (groupBy === "station") {
      pipeline.push(
        {
          $group: {
            _id: "$stationId",
            totalAmount: { $sum: "$amount" },
            totalEnergyKWh: { $sum: "$energyKWh" },
            sessions: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: "charging_stations",
            localField: "_id",
            foreignField: "_id",
            as: "station",
          },
        },
        { $unwind: "$station" },
        {
          $project: {
            _id: 0,
            stationId: "$station._id",
            stationName: "$station.name",
            stationCode: "$station.code",
            region: "$station.region",
            totalAmount: 1,
            totalEnergyKWh: 1,
            sessions: 1,
          },
        }
      );
    } else if (groupBy === "region") {
      pipeline.push(
        {
          $lookup: {
            from: "charging_stations",
            localField: "stationId",
            foreignField: "_id",
            as: "station",
          },
        },
        { $unwind: "$station" },
        {
          $group: {
            _id: "$station.region",
            totalAmount: { $sum: "$amount" },
            totalEnergyKWh: { $sum: "$energyKWh" },
            sessions: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            region: "$_id",
            totalAmount: 1,
            totalEnergyKWh: 1,
            sessions: 1,
          },
        }
      );
    } else if (groupBy === "time") {
      let dateFormat = "%Y-%m-%d";
      if (period === "month") dateFormat = "%Y-%m";
      // For week, compose year-week as string
      if (period === "week") {
        pipeline.push(
          {
            $addFields: {
              isoWeekYear: { $isoWeekYear: "$startedAt" },
              isoWeek: { $isoWeek: "$startedAt" },
            },
          },
          {
            $group: {
              _id: { year: "$isoWeekYear", week: "$isoWeek" },
              totalAmount: { $sum: "$amount" },
              totalEnergyKWh: { $sum: "$energyKWh" },
              sessions: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              period: {
                $concat: [
                  { $toString: "$_id.year" },
                  "-W",
                  { $toString: "$_id.week" },
                ],
              },
              totalAmount: 1,
              totalEnergyKWh: 1,
              sessions: 1,
            },
          },
          { $sort: { period: 1 } }
        );
      } else {
        pipeline.push(
          {
            $group: {
              _id: { $dateToString: { format: dateFormat, date: "$startedAt" } },
              totalAmount: { $sum: "$amount" },
              totalEnergyKWh: { $sum: "$energyKWh" },
              sessions: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              period: "$_id",
              totalAmount: 1,
              totalEnergyKWh: 1,
              sessions: 1,
            },
          },
          { $sort: { period: 1 } }
        );
      }
    } else {
      return res.status(400).json({ success: false, message: "groupBy không hợp lệ" });
    }

    const data = await ChargingSession.aggregate(pipeline as any);
    return res.json({ success: true, message: "Thống kê doanh thu", data });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Đã có lỗi xảy ra, vui lòng thử lại sau!" });
  }
};

// GET /admin/analytics/usage
// query: start, end
export const getUsage = async (req: Request, res: Response) => {
  try {
    const start = req.query.start ? new Date(req.query.start as string) : undefined;
    const end = req.query.end ? new Date(req.query.end as string) : undefined;
    const match: any = { deleted: false, status: "completed" };
    if (start || end) {
      match.startedAt = {};
      if (start) match.startedAt.$gte = start;
      if (end) match.startedAt.$lte = end;
    }

    // Usage by station
    const byStation = await ChargingSession.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$stationId",
          sessions: { $sum: 1 },
          totalEnergyKWh: { $sum: "$energyKWh" },
        },
      },
      {
        $lookup: {
          from: "charging_stations",
          localField: "_id",
          foreignField: "_id",
          as: "station",
        },
      },
      { $unwind: "$station" },
      {
        $project: {
          _id: 0,
          stationId: "$station._id",
          stationName: "$station.name",
          stationCode: "$station.code",
          region: "$station.region",
          sessions: 1,
          totalEnergyKWh: 1,
        },
      },
      { $sort: { sessions: -1 } },
    ] as any);

    // Peak hours across the range
    const peakHours = await ChargingSession.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $hour: "$startedAt" },
          sessions: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          hour: "$_id",
          sessions: 1,
        },
      },
      { $sort: { sessions: -1 } },
    ] as any);

    return res.json({
      success: true,
      message: "Thống kê tần suất sử dụng & giờ cao điểm",
      data: { byStation, peakHours },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Đã có lỗi xảy ra, vui lòng thử lại sau!" });
  }
};
