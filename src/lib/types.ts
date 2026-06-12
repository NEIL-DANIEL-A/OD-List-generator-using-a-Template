export interface Participant {
  sno: number;
  rollNumber: string;
  name: string;
  department: string;
  year: string;
}

export interface TemplateConfig {
  tableX: number;
  tableY: number;
  tableWidth: number;
  rowHeight: number;
  columnWidths: number[];
  rowsPerPage: number;
}
