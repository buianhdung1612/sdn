import { Request, Response } from "express";
import mongoose from "mongoose";
import axios from "axios";
import ChargingSession from "../../models/charging-session.model";
import ChargingStation from "../../models/charging-station.model";

type DailyPoint = { date: string; sessions: number; avgDurationMin: number };

function linearRegression(y: number[]): { slope: number; intercept: number } {
  const n = y.length;
  if (n === 0) return { slope: 0, intercept: 0 };
  const xs = Array.from({ length: n }, (_, i) => i);
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXX = xs.reduce((a, b) => a + b * b, 0);
  const sumXY = xs.reduce((acc, xi, i) => acc + xi * y[i], 0);
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n };
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

function dateToWeekday(dateStr: string): number {
  return new Date(dateStr).getUTCDay(); // 0..6
}

function addDays(d: Date, days: number): Date {
  const nd = new Date(d);
  nd.setUTCDate(nd.getUTCDate() + days);
  return nd;
}

function ymd(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const da = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

export const forecastDemand = async (req: Request, res: Response) => {
  try {
    const { stationId, horizonDays, targetUtilization, includeLLMExplanation } = (req as any).body || {};
    const horizon = Number(horizonDays) > 0 ? Number(horizonDays) : 14;
    const target = Number(targetUtilization) > 0 && Number(targetUtilization) <= 1 ? Number(targetUtilization) : 0.7;

    if (!stationId || !mongoose.isValidObjectId(stationId)) {
      return res.status(400).json({ success: false, message: "stationId không hợp lệ hoặc thiếu" });
    }

    // Load station with current capacity
    const station = await ChargingStation.findOne({ _id: new mongoose.Types.ObjectId(stationId), deleted: false });
    if (!station) {
      return res.status(404).json({ success: false, message: "Không tìm thấy trạm sạc" });
    }
    const points = (station as any).chargingPoints?.length || 0;

    // Aggregate historical daily sessions (last 120 days)
    const startHist = addDays(new Date(), -120);
    const hist = (await ChargingSession.aggregate([
      {
        $match: {
          deleted: false,
          status: "completed",
          stationId: new mongoose.Types.ObjectId(stationId),
          startedAt: { $gte: startHist },
        },
      },
      {
        $addFields: {
          durationMin: {
            $cond: [
              { $and: [ { $ifNull: ["$endedAt", false] }, { $ifNull: ["$startedAt", false] } ] },
              { $dateDiff: { startDate: "$startedAt", endDate: "$endedAt", unit: "minute" } },
              60,
            ],
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$startedAt" } },
          sessions: { $sum: 1 },
          avgDurationMin: { $avg: "$durationMin" },
        },
      },
      { $project: { _id: 0, date: "$_id", sessions: 1, avgDurationMin: 1 } },
      { $sort: { date: 1 } },
    ]) as DailyPoint[]);

    if (!hist || hist.length === 0) {
      return res.json({
        success: true,
        message: "Chưa đủ dữ liệu lịch sử để dự báo",
        data: { forecast: [], suggestions: { points, recommendedAdditionalPoints: 0 }, station: { id: station._id, name: (station as any).name } },
      });
    }

    // Build arrays
    const seriesY = hist.map((h) => Math.max(0, h.sessions));
    const avgDurMin = hist.reduce((acc, h) => acc + (h.avgDurationMin || 60), 0) / hist.length;
    const avgDurHours = avgDurMin / 60;
    const overallAvg = seriesY.reduce((a, b) => a + b, 0) / seriesY.length;

    // Seasonal factors by weekday
    const weekdayBuckets: Record<number, number[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] } as any;
    hist.forEach((h) => {
      weekdayBuckets[dateToWeekday(h.date)].push(h.sessions);
    });
    const weekdayAvg: Record<number, number> = {} as any;
    for (let d = 0; d < 7; d++) {
      const arr = weekdayBuckets[d];
      weekdayAvg[d] = arr && arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : overallAvg || 1;
    }
    const weekdayFactor: Record<number, number> = {} as any;
    for (let d = 0; d < 7; d++) {
      weekdayFactor[d] = overallAvg > 0 ? weekdayAvg[d] / overallAvg : 1;
    }

    // Trend
    const { slope, intercept } = linearRegression(seriesY);

    // Forecast next horizon days
    const lastDate = new Date(hist[hist.length - 1].date + "T00:00:00Z");
    const forecast: { date: string; sessions: number }[] = [];
    for (let i = 1; i <= horizon; i++) {
      const d = addDays(lastDate, i);
      const wd = d.getUTCDay();
      const trendVal = intercept + slope * (seriesY.length + i);
      const base = Math.max(0, trendVal);
      const pred = Math.max(0, base * (weekdayFactor[wd] || 1));
      forecast.push({ date: ymd(d), sessions: Math.round(pred) });
    }

    // Capacity suggestion
    const maxDailySessions = forecast.reduce((m, f) => Math.max(m, f.sessions), 0);
    const requiredHoursAtPeak = maxDailySessions * (avgDurHours || 1);
    const capacityHours = points * 24;
    const currentUtilAtPeak = capacityHours > 0 ? requiredHoursAtPeak / capacityHours : Infinity;
    const requiredPointsForTarget = target > 0 ? Math.ceil(requiredHoursAtPeak / (target * 24)) : points;
    const recommendedAdditionalPoints = Math.max(0, requiredPointsForTarget - points);

    // Optional LLM explanation
    let llmExplanation: string | undefined = undefined;
    try {
      if (includeLLMExplanation && process.env.GEMINI_API_KEY) {
        const prompt = `Bạn là chuyên gia quy hoạch trạm sạc. Dựa trên dữ liệu: số phiên sạc/ ngày lịch sử (trung bình ${overallAvg.toFixed(
          2
        )}/ngày), thời lượng trung bình ${(avgDurHours || 1).toFixed(2)} giờ/phiên, số cổng hiện tại ${points}, dự báo ${horizon} ngày tới với đỉnh ${maxDailySessions} phiên/ngày. Hãy đề xuất nâng cấp hạ tầng để giữ mức sử dụng <= ${(target * 100).toFixed(
          0
        )}% tại giờ cao điểm, kèm lập luận ngắn gọn và rủi ro cần lưu ý.`;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
        const body = {
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        };
        const resp = await axios.post(url, body, { timeout: 8000 });
        llmExplanation = resp.data?.candidates?.[0]?.content?.parts?.[0]?.text || undefined;
      }
    } catch (e) {
      // do not fail the endpoint if LLM call fails
      llmExplanation = undefined;
    }

    return res.json({
      success: true,
      message: "Dự báo nhu cầu và gợi ý nâng cấp",
      data: {
        station: { id: (station as any)._id, name: (station as any).name, code: (station as any).code, region: (station as any).region, points },
        horizonDays: horizon,
        forecast,
        stats: {
          overallAvgDailySessions: overallAvg,
          avgSessionDurationHours: avgDurHours,
          currentUtilAtPeak,
        },
        suggestions: {
          requiredPointsForTarget,
          recommendedAdditionalPoints,
          targetUtilization: target,
        },
        explanation: llmExplanation,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Đã có lỗi xảy ra, vui lòng thử lại sau!" });
  }
};
