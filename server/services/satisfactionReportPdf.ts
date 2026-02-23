import { TenantSatisfactionTrend } from "./propertyAnalytics";

export type ReportMetric = "overall" | "cleanliness" | "maintenance" | "communication" | "responsiveness" | "value" | "surveys" | "recommendations";

/**
 * Generate satisfaction report PDF as buffer using pdfkit with metric selection
 */
export async function generateSatisfactionReportPDFBuffer(
  propertyName: string,
  satisfactionData: TenantSatisfactionTrend[],
  months: number = 12,
  selectedMetrics: ReportMetric[] = ["overall", "cleanliness", "maintenance", "communication", "responsiveness", "value", "surveys", "recommendations"]
): Promise<Buffer> {
  try {
    // Use pdfkit for server-side PDF generation
    const PDFDocument = require("pdfkit");

    const doc = new PDFDocument({
      size: "A4",
      margin: 40,
    });

    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    // Header
    doc.fontSize(24).font("Helvetica-Bold").text("Tenant Satisfaction Report", { underline: true });
    doc.fontSize(12).font("Helvetica").text(`Property: ${propertyName}`, { underline: false });
    doc.text(`Period: Last ${months} Months`);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`);
    doc.moveDown();

    // Summary Section
    doc.fontSize(14).font("Helvetica-Bold").text("Report Summary");
    doc.fontSize(10).font("Helvetica");

    const totalSurveys = satisfactionData.reduce((sum, item) => sum + item.surveyCount, 0);
    const avgSatisfaction =
      satisfactionData.length > 0
        ? (satisfactionData.reduce((sum, item) => sum + item.averageSatisfaction, 0) / satisfactionData.length).toFixed(1)
        : "N/A";
    const avgRecommendation =
      satisfactionData.length > 0
        ? Math.round(satisfactionData.reduce((sum, item) => sum + item.recommendPercentage, 0) / satisfactionData.length)
        : 0;

    if (selectedMetrics.includes("surveys")) {
      doc.text(`Total Surveys Collected: ${totalSurveys}`);
    }
    if (selectedMetrics.includes("overall")) {
      doc.text(`Average Satisfaction Score: ${avgSatisfaction} / 5.0`);
    }
    if (selectedMetrics.includes("recommendations")) {
      doc.text(`Would Recommend (Average): ${avgRecommendation}%`);
    }
    doc.moveDown();

    // Monthly Trends Table
    if (selectedMetrics.includes("overall") || selectedMetrics.includes("surveys") || selectedMetrics.includes("recommendations")) {
      doc.fontSize(14).font("Helvetica-Bold").text("Monthly Satisfaction Trends");
      doc.fontSize(9).font("Helvetica");

      const tableTop = doc.y + 10;
      const col1X = 50;
      const col2X = 180;
      const col3X = 280;
      const col4X = 380;
      const rowHeight = 20;

      doc.y = tableTop;
      doc.text("Month", col1X, doc.y);
      if (selectedMetrics.includes("overall")) {
        doc.text("Satisfaction", col2X, tableTop);
      }
      if (selectedMetrics.includes("surveys")) {
        doc.text("Surveys", col3X, tableTop);
      }
      if (selectedMetrics.includes("recommendations")) {
        doc.text("Recommend %", col4X, tableTop);
      }
      doc.moveTo(50, tableTop + rowHeight).lineTo(550, tableTop + rowHeight).stroke();

      let currentY = tableTop + rowHeight + 5;
      satisfactionData.forEach((item) => {
        doc.text(item.month, col1X, currentY);
        if (selectedMetrics.includes("overall")) {
          doc.text(item.averageSatisfaction.toFixed(1), col2X, currentY);
        }
        if (selectedMetrics.includes("surveys")) {
          doc.text(item.surveyCount.toString(), col3X, currentY);
        }
        if (selectedMetrics.includes("recommendations")) {
          doc.text(`${item.recommendPercentage}%`, col4X, currentY);
        }
        currentY += rowHeight;
      });

      doc.moveDown(2);
    }

    // Category Ratings
    const categoryMetrics = ["cleanliness", "maintenance", "communication", "responsiveness", "value"];
    if (categoryMetrics.some((m) => selectedMetrics.includes(m as ReportMetric))) {
      doc.fontSize(14).font("Helvetica-Bold").text("Category Ratings (Average)");
      doc.fontSize(9).font("Helvetica");

      if (satisfactionData.length > 0) {
        const categories = [
          { name: "Cleanliness", key: "averageCleanliness", metric: "cleanliness" },
          { name: "Maintenance", key: "averageMaintenance", metric: "maintenance" },
          { name: "Communication", key: "averageCommunication", metric: "communication" },
          { name: "Responsiveness", key: "averageResponsiveness", metric: "responsiveness" },
          { name: "Value for Money", key: "averageValueForMoney", metric: "value" },
        ];

        categories.forEach((cat) => {
          if (selectedMetrics.includes(cat.metric as ReportMetric)) {
            const avg = (satisfactionData.reduce((sum, item) => sum + (item as any)[cat.key], 0) / satisfactionData.length).toFixed(1);
            doc.text(`${cat.name}: ${avg} / 5.0`);
          }
        });
      }
    }

    doc.moveDown(2);

    // Footer
    doc.fontSize(8).text("Rentala Property Management System - Confidential Report", { align: "center" });
    doc.text("This report contains proprietary tenant satisfaction data.", { align: "center" });

    doc.end();

    return new Promise((resolve, reject) => {
      doc.on("finish", () => {
        resolve(Buffer.concat(chunks));
      });
      doc.on("error", reject);
    });
  } catch (error) {
    console.error("Failed to generate satisfaction report PDF:", error);
    throw error;
  }
}
