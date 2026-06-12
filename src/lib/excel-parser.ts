import * as XLSX from "xlsx";
import type { Participant } from "./types";

export function parseExcelFile(buffer: Buffer): Participant[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error("Excel file contains no sheets");
  }

  const sheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
  });

  if (rawData.length === 0) {
    throw new Error("Excel file is empty");
  }

  const headerRow = rawData[0] as unknown[];
  if (!headerRow || headerRow.length === 0) {
    throw new Error("Excel file has no headers");
  }

  const normalizedHeaders = headerRow.map((h) =>
    String(h || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "")
  );

  const snoIdx = normalizedHeaders.findIndex(
    (h) => h === "sno" || h === "serialno" || h === "srno" || h === "slno"
  );
  const rollIdx = normalizedHeaders.findIndex(
    (h) =>
      h.includes("roll") ||
      h.includes("rollnumber") ||
      h.includes("rollno") ||
      h === "regno" ||
      h.includes("registration")
  );
  const nameIdx = normalizedHeaders.findIndex(
    (h) => h.includes("name") || h === "participantname" || h === "studentname"
  );
  const deptIdx = normalizedHeaders.findIndex(
    (h) => h.includes("dept") || h === "department" || h === "branch"
  );
  const yearIdx = normalizedHeaders.findIndex(
    (h) =>
      h.includes("year") ||
      h.includes("semester") ||
      h === "class" ||
      h === "section"
  );

  if (nameIdx === -1) {
    throw new Error(
      "Could not find a 'Name' column in Excel file. Headers found: " +
        headerRow.map((h) => String(h || "")).join(", ")
    );
  }

  const participants: Participant[] = [];
  const dataRows = rawData.slice(1);

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i] as unknown[];
    if (!row || row.length === 0) continue;

    const name = String(row[nameIdx] || "").trim();
    if (!name) continue;

    const sno =
      snoIdx !== -1
        ? Number(row[snoIdx]) || participants.length + 1
        : participants.length + 1;
    const rollNumber =
      rollIdx !== -1 ? String(row[rollIdx] || "").trim() : "";
    const department =
      deptIdx !== -1 ? String(row[deptIdx] || "").trim() : "";
    const year = yearIdx !== -1 ? String(row[yearIdx] || "").trim() : "";

    participants.push({
      sno,
      rollNumber,
      name,
      department,
      year,
    });
  }

  if (participants.length === 0) {
    throw new Error("No valid participant data found in Excel file");
  }

  const seen = new Set<string>();
  const unique: Participant[] = [];
  for (const p of participants) {
    const key = `${p.name.toLowerCase()}|${p.rollNumber.toLowerCase()}|${p.department.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(p);
    }
  }

  return unique.map((p, i) => ({ ...p, sno: i + 1 }));
}
