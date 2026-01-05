import { eq, and, inArray, gte, lte } from "drizzle-orm";
import { transactions, properties } from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import PDFDocument from "pdfkit";
import { Readable } from "stream";

const exportFinancialStatementSchema = z.object({
  propertyId: z.number().int().positive().optional(),
  startDate: z.string(),
  endDate: z.string(),
  period: z.enum(["monthly", "quarterly", "annual"]),
});

export const pdfExportRouter = router({
  // Export financial statement as PDF
  exportFinancialStatement: protectedProcedure
    .input(exportFinancialStatementSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get all properties owned by the user
      const userProperties = await db
        .select()
        .from(properties)
        .where(eq(properties.ownerId, ctx.user!.id));

      const propertyIds = userProperties.map(p => p.id);

      if (propertyIds.length === 0) {
        throw new Error("No properties found");
      }

      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);

      // Fetch transactions
      let transactionsQuery = db
        .select()
        .from(transactions)
        .where(
          and(
            input.propertyId
              ? eq(transactions.propertyId, input.propertyId)
              : inArray(transactions.propertyId, propertyIds),
            gte(transactions.date, startDate),
            lte(transactions.date, endDate)
          )
        );

      const allTransactions = await transactionsQuery;

      // Calculate totals
      let totalIncome = 0;
      let totalExpenses = 0;
      const incomeByCategory: Record<string, number> = {};
      const expensesByCategory: Record<string, number> = {};

      for (const txn of allTransactions) {
        const amount = parseFloat(txn.amount.toString());

        if (txn.type === "income") {
          totalIncome += amount;
          incomeByCategory[txn.category] = (incomeByCategory[txn.category] || 0) + amount;
        } else {
          totalExpenses += amount;
          expensesByCategory[txn.category] = (expensesByCategory[txn.category] || 0) + amount;
        }
      }

      const netProfit = totalIncome - totalExpenses;

      // Create PDF
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
      });

      // Header
      doc.fontSize(24).font("Helvetica-Bold").text("Rentala", { align: "center" });
      doc.fontSize(12).font("Helvetica").text("Financial Statement", { align: "center" });
      doc.moveDown(0.5);

      // Report info
      const propertyName = input.propertyId
        ? userProperties.find(p => p.id === input.propertyId)?.name || "All Properties"
        : "All Properties";

      doc.fontSize(10).text(`Property: ${propertyName}`, { align: "left" });
      doc.text(`Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, { align: "left" });
      doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, { align: "left" });
      doc.moveDown(1);

      // Summary section
      doc.fontSize(14).font("Helvetica-Bold").text("Financial Summary", { underline: true });
      doc.moveDown(0.3);

      doc.fontSize(11).font("Helvetica");
      doc.text(`Total Income:        R ${totalIncome.toFixed(2)}`, { align: "left" });
      doc.text(`Total Expenses:      R ${totalExpenses.toFixed(2)}`, { align: "left" });
      doc.fontSize(12).font("Helvetica-Bold");
      doc.text(`Net Profit/Loss:     R ${netProfit.toFixed(2)}`, { align: "left" });
      doc.moveDown(1);

      // Income breakdown
      if (Object.keys(incomeByCategory).length > 0) {
        doc.fontSize(14).font("Helvetica-Bold").text("Income Breakdown", { underline: true });
        doc.moveDown(0.3);

        doc.fontSize(10).font("Helvetica");
        for (const [category, amount] of Object.entries(incomeByCategory)) {
          const percentage = ((amount / totalIncome) * 100).toFixed(1);
          doc.text(`${category.charAt(0).toUpperCase() + category.slice(1)}: R ${amount.toFixed(2)} (${percentage}%)`, {
            align: "left",
          });
        }
        doc.moveDown(1);
      }

      // Expense breakdown
      if (Object.keys(expensesByCategory).length > 0) {
        doc.fontSize(14).font("Helvetica-Bold").text("Expense Breakdown", { underline: true });
        doc.moveDown(0.3);

        doc.fontSize(10).font("Helvetica");
        for (const [category, amount] of Object.entries(expensesByCategory)) {
          const percentage = ((amount / totalExpenses) * 100).toFixed(1);
          doc.text(`${category.charAt(0).toUpperCase() + category.slice(1)}: R ${amount.toFixed(2)} (${percentage}%)`, {
            align: "left",
          });
        }
        doc.moveDown(1);
      }

      // Transactions detail
      if (allTransactions.length > 0) {
        doc.fontSize(14).font("Helvetica-Bold").text("Transaction Details", { underline: true });
        doc.moveDown(0.3);

        // Table header
        const tableTop = doc.y;
        const col1 = 50;
        const col2 = 150;
        const col3 = 300;
        const col4 = 450;

        doc.fontSize(9).font("Helvetica-Bold");
        doc.text("Date", col1, tableTop);
        doc.text("Description", col2, tableTop);
        doc.text("Category", col3, tableTop);
        doc.text("Amount", col4, tableTop);

        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        // Table rows
        doc.fontSize(8).font("Helvetica");
        let currentY = tableTop + 25;

        for (const txn of allTransactions) {
          const amount = txn.type === "income" ? `+R ${txn.amount}` : `-R ${txn.amount}`;
          doc.text(new Date(txn.date).toLocaleDateString(), col1, currentY);
          doc.text(txn.description || "", col2, currentY);
          doc.text(txn.category, col3, currentY);
          doc.text(amount, col4, currentY);
          currentY += 15;

          // Add new page if needed
          if (currentY > 750) {
            doc.addPage();
            currentY = 50;
          }
        }
      }

      // Footer
      doc.fontSize(8).text("This is an automatically generated financial statement from Rentala Property Management System.", 50, 750, {
        align: "center",
      });

      // Convert to buffer
      return new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        doc.on("data", (chunk: Buffer) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);
        doc.end();
      });
    }),
});
