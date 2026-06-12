"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Download, Upload, Move, Maximize2, RotateCcw, Save, ZoomIn, ZoomOut, FileSpreadsheet, Trash2 } from "lucide-react";
import { useDropzone } from "react-dropzone";
import type { TemplateConfig, Participant } from "@/lib/types";

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;
const SAMPLE_PARTICIPANTS = [
  { sno: 1, rollNumber: "251801001", name: "V Y AARES", department: "CSE", year: "1" },
  { sno: 2, rollNumber: "251801002", name: "AASHISH DURAI M", department: "CSE", year: "1" },
  { sno: 3, rollNumber: "251801003", name: "ABIJITH K", department: "CSE", year: "1" },
  { sno: 4, rollNumber: "251801004", name: "ABIRAMI K", department: "CSE", year: "1" },
  { sno: 5, rollNumber: "251801005", name: "ABU SHAYAAN KHAN K", department: "CSE", year: "1" },
  { sno: 6, rollNumber: "251801006", name: "ADHITHYAN P", department: "CSE", year: "1" },
  { sno: 7, rollNumber: "251801007", name: "A ADHITYA", department: "CSE", year: "1" },
  { sno: 8, rollNumber: "251801008", name: "ADITHYA R", department: "AIDS", year: "1" },
  { sno: 9, rollNumber: "251801009", name: "ADITHYAN S", department: "AIDS", year: "2" },
  { sno: 10, rollNumber: "251801010", name: "AJAY PREETHAN K", department: "AIDS", year: "2" },
  { sno: 11, rollNumber: "251801011", name: "AJILESH M", department: "AIDS", year: "2" },
  { sno: 12, rollNumber: "251801012", name: "AKAASH PARI", department: "AIDS", year: "2" },
  { sno: 13, rollNumber: "251801013", name: "AKASH RAJ R", department: "AIDS", year: "2" },
  { sno: 14, rollNumber: "251801014", name: "AKHILAN PERUMAL P", department: "AIDS", year: "2" },
  { sno: 15, rollNumber: "251801015", name: "AKSHAYA C R", department: "AIDS", year: "2" },
  { sno: 16, rollNumber: "251801016", name: "AKSHAYA J", department: "AIDS", year: "2" },
  { sno: 17, rollNumber: "251801017", name: "AKSHYAA A", department: "IT", year: "2" },
];

const COLUMN_HEADERS = ["S.NO", "ROLL NUMBER", "NAME", "YEAR", "DEPT"];

export default function CalibrationPage() {
  const [templateImage, setTemplateImage] = useState<string | null>(null);
  const [templateFileName, setTemplateFileName] = useState<string>("");
  const [config, setConfig] = useState<TemplateConfig>({ tableX: 40, tableY: 200, tableWidth: 714, rowHeight: 30, columnWidths: [6, 18, 42, 14, 20], rowsPerPage: 17 });
  const [participants, setParticipants] = useState<Participant[]>(SAMPLE_PARTICIPANTS);
  const [excelFileName, setExcelFileName] = useState<string>("");
  const [parsing, setParsing] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const scale = zoom;

  const onDrop = useCallback((accepted: File[]) => {
    const file = accepted[0];
    if (!file) return;
    setTemplateFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setTemplateImage(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg"] },
    maxFiles: 1,
    multiple: false,
  });

  const onExcelDrop = useCallback(async (accepted: File[]) => {
    const file = accepted[0];
    if (!file) return;
    setParsing(true);
    setExcelFileName(file.name);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload-excel", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse");
      setParticipants(data.participants);
    } catch {
      setExcelFileName("");
    } finally {
      setParsing(false);
    }
  }, []);

  const { getRootProps: getExcelRootProps, getInputProps: getExcelInputProps, isDragActive: isExcelDragActive } = useDropzone({
    onDrop: onExcelDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  function clearExcel() {
    setExcelFileName("");
    setParticipants(SAMPLE_PARTICIPANTS);
    setConfig((prev) => ({ ...prev, rowsPerPage: 17 }));
  }

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();

      if (dragging) {
        const x = Math.round((e.clientX - rect.left) / scale - dragOffset.x);
        const y = Math.round((e.clientY - rect.top) / scale - dragOffset.y);
        setConfig((prev) => ({
          ...prev,
          tableX: Math.max(0, Math.min(A4_WIDTH_PX - prev.tableWidth, x)),
          tableY: Math.max(0, Math.min(A4_HEIGHT_PX - 200, y)),
        }));
      }

      if (resizing) {
        const w = Math.round((e.clientX - rect.left) / scale - config.tableX);
        setConfig((prev) => ({
          ...prev,
          tableWidth: Math.max(200, Math.min(A4_WIDTH_PX - prev.tableX, w)),
        }));
      }
    }

    function handleMouseUp() {
      setDragging(false);
      setResizing(false);
    }

    if (dragging || resizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, resizing, dragOffset, scale, config.tableX]);

  function handleDragStart(e: React.MouseEvent) {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    setDragOffset({ x: x - config.tableX, y: y - config.tableY });
    setDragging(true);
  }

  function handleResizeStart(e: React.MouseEvent) {
    e.stopPropagation();
    setResizing(true);
  }

  function resetConfig() {
    setConfig({ tableX: 40, tableY: 200, tableWidth: 714, rowHeight: 30, columnWidths: [6, 18, 42, 14, 20], rowsPerPage: 17 });
  }

  function saveConfig() {
    const json = JSON.stringify(config, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template-config.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function loadConfig() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result as string);
          if (parsed.tableX !== undefined && parsed.tableY !== undefined && parsed.tableWidth !== undefined) {
            setConfig({
              ...parsed,
              rowHeight: parsed.rowHeight || 30,
              columnWidths: parsed.columnWidths || [6, 18, 42, 14, 20],
              rowsPerPage: parsed.rowsPerPage || 17,
            });
          }
        } catch { /* ignore */ }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  async function generatePreview() {
    setGenerating(true);
    try {
      const body: Record<string, unknown> = { participants, rowCount: config.rowsPerPage };
      if (templateImage) {
        body.templateImage = templateImage;
        body.templateConfig = config;
      }

      const res = await fetch("/api/calibration-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate");
      }

      const blob = await res.blob();
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      if (iframeRef.current) {
        iframeRef.current.src = url;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  }

  function handleDownload() {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = "calibration-preview.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Template Calibration</h1>
        <p className="text-muted-foreground">
          Upload a template image and position the table overlay precisely
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* Left Panel - Controls (scrollable) */}
        <div className="space-y-4 lg:max-h-[calc(100vh-200px)] lg:overflow-y-auto lg:pr-2">
          {/* Template Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Template Image</CardTitle>
              <CardDescription>Upload PNG or JPG template</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer ${
                  isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                {templateFileName ? (
                  <p className="text-sm font-medium">{templateFileName}</p>
                ) : isDragActive ? (
                  <p className="text-sm text-primary">Drop the template here...</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Drag & drop or click to upload</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Excel Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Excel Data
              </CardTitle>
              <CardDescription>Upload .xlsx to use real data instead of samples</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                {...getExcelRootProps()}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-colors ${
                  isExcelDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
                }`}
              >
                <input {...getExcelInputProps()} />
                {parsing ? (
                  <Loader2 className="mb-2 h-6 w-6 animate-spin text-primary" />
                ) : excelFileName ? (
                  <div className="text-center">
                    <p className="text-sm font-medium">{excelFileName}</p>
                    <p className="text-xs text-muted-foreground">{participants.length} participants loaded</p>
                    <Button variant="ghost" size="sm" className="mt-1" onClick={(e) => { e.stopPropagation(); clearExcel(); }}>
                      <Trash2 className="mr-1 h-3 w-3" />Remove
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <FileSpreadsheet className="mx-auto mb-1 h-6 w-6 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Drop Excel or click to upload</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Coordinates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Move className="h-4 w-4" />
                Table Position
              </CardTitle>
              <CardDescription>Drag the table on the canvas or use sliders</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "X Position", key: "tableX" as const, max: A4_WIDTH_PX },
                { label: "Y Position", key: "tableY" as const, max: A4_HEIGHT_PX },
                { label: "Width", key: "tableWidth" as const, max: A4_WIDTH_PX },
                { label: "Row Height", key: "rowHeight" as const, max: 80 },
              ].map(({ label, key, max }) => (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">{label}</Label>
                    <span className="text-xs text-muted-foreground font-mono">{config[key]}px</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="range"
                      min={0}
                      max={max}
                      value={config[key]}
                      onChange={(e) => setConfig((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                      className="flex-1 h-2 accent-primary"
                    />
                    <Input
                      type="number"
                      min={0}
                      max={max}
                      value={config[key]}
                      onChange={(e) => setConfig((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                      className="w-20 text-xs font-mono"
                    />
                  </div>
                </div>
              ))}

              <div className="flex items-center gap-2 pt-2">
                <Label className="text-sm">Rows</Label>
                <Input
                  type="number"
                  min={1}
                  value={config.rowsPerPage}
                  onChange={(e) => setConfig((prev) => ({ ...prev, rowsPerPage: Math.max(1, Number(e.target.value) || 1) }))}
                  className="w-20 text-xs"
                />
              </div>

              <div className="pt-2 space-y-2">
                <Label className="text-sm">Column Widths (%)</Label>
                <p className="text-[10px] text-muted-foreground">Total must equal 100%</p>
                {COLUMN_HEADERS.map((h, i) => (
                  <div key={h} className="flex items-center gap-2">
                    <Label className="text-xs w-20 truncate">{h}</Label>
                    <Input
                      type="range"
                      min={2}
                      max={60}
                      value={config.columnWidths[i]}
                      onChange={(e) => {
                        const newWidths = [...config.columnWidths];
                        newWidths[i] = Number(e.target.value);
                        setConfig((prev) => ({ ...prev, columnWidths: newWidths }));
                      }}
                      className="flex-1 h-2 accent-primary"
                    />
                    <Input
                      type="number"
                      min={2}
                      max={60}
                      value={config.columnWidths[i]}
                      onChange={(e) => {
                        const newWidths = [...config.columnWidths];
                        newWidths[i] = Number(e.target.value);
                        setConfig((prev) => ({ ...prev, columnWidths: newWidths }));
                      }}
                      className="w-16 text-xs font-mono"
                    />
                  </div>
                ))}
                <p className={`text-[10px] font-mono ${config.columnWidths.reduce((a, b) => a + b, 0) === 100 ? "text-green-600" : "text-red-500"}`}>
                  Total: {config.columnWidths.reduce((a, b) => a + b, 0)}%
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="pt-4 space-y-2">
              <div className="flex gap-2">
                <Button onClick={generatePreview} disabled={generating} className="flex-1">
                  {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Generate Preview
                </Button>
                {pdfUrl && (
                  <Button variant="outline" onClick={handleDownload}>
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={resetConfig} className="flex-1">
                  <RotateCcw className="mr-1 h-3 w-3" />
                  Reset
                </Button>
                <Button variant="outline" size="sm" onClick={saveConfig} className="flex-1">
                  <Save className="mr-1 h-3 w-3" />
                  Export Config
                </Button>
                <Button variant="outline" size="sm" onClick={loadConfig} className="flex-1">
                  Import Config
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Coordinate Display */}
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded bg-muted p-2">
                  <p className="text-[10px] text-muted-foreground">X</p>
                  <p className="text-sm font-mono font-bold">{config.tableX}</p>
                </div>
                <div className="rounded bg-muted p-2">
                  <p className="text-[10px] text-muted-foreground">Y</p>
                  <p className="text-sm font-mono font-bold">{config.tableY}</p>
                </div>
                <div className="rounded bg-muted p-2">
                  <p className="text-[10px] text-muted-foreground">W</p>
                  <p className="text-sm font-mono font-bold">{config.tableWidth}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Visual Canvas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Maximize2 className="h-4 w-4" />
                Visual Canvas
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => setZoom((z) => Math.max(0.3, z - 0.1))}>
                  <ZoomOut className="h-3 w-3" />
                </Button>
                <span className="text-xs text-muted-foreground w-12 text-center font-mono">{Math.round(zoom * 100)}%</span>
                <Button variant="outline" size="sm" onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}>
                  <ZoomIn className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center overflow-auto rounded-lg border bg-gray-100 p-4" style={{ maxHeight: "750px" }}>
              <div
                ref={canvasRef}
                className="relative bg-white shadow-lg"
                style={{
                  width: A4_WIDTH_PX * zoom,
                  height: A4_HEIGHT_PX * zoom,
                  minWidth: A4_WIDTH_PX * zoom,
                  minHeight: A4_HEIGHT_PX * zoom,
                }}
              >
                {/* Template Background */}
                {templateImage && (
                  <img
                    src={templateImage}
                    alt="Template"
                    className="absolute inset-0 pointer-events-none"
                    style={{ width: "100%", height: "100%", objectFit: "fill" }}
                  />
                )}

                {/* Grid Lines */}
                <svg className="absolute inset-0 pointer-events-none" style={{ width: "100%", height: "100%" }}>
                  {/* Vertical ruler marks */}
                  {Array.from({ length: Math.floor(A4_WIDTH_PX / 50) + 1 }, (_, i) => (
                    <g key={`v${i}`}>
                      <line
                        x1={i * 50 * zoom}
                        y1={0}
                        x2={i * 50 * zoom}
                        y2={A4_HEIGHT_PX * zoom}
                        stroke="#e5e7eb"
                        strokeWidth={0.5}
                        strokeDasharray="4,4"
                      />
                      <text x={i * 50 * zoom + 2} y={10} fill="#9ca3af" fontSize={8} fontFamily="monospace">
                        {i * 50}
                      </text>
                    </g>
                  ))}
                  {/* Horizontal ruler marks */}
                  {Array.from({ length: Math.floor(A4_HEIGHT_PX / 50) + 1 }, (_, i) => (
                    <g key={`h${i}`}>
                      <line
                        x1={0}
                        y1={i * 50 * zoom}
                        x2={A4_WIDTH_PX * zoom}
                        y2={i * 50 * zoom}
                        stroke="#e5e7eb"
                        strokeWidth={0.5}
                        strokeDasharray="4,4"
                      />
                      <text x={2} y={i * 50 * zoom - 2} fill="#9ca3af" fontSize={8} fontFamily="monospace">
                        {i * 50}
                      </text>
                    </g>
                  ))}
                </svg>

                {/* Table Overlay */}
                <div
                  className="absolute cursor-move"
                  style={{
                    left: config.tableX * zoom,
                    top: config.tableY * zoom,
                    width: config.tableWidth * zoom,
                    zIndex: 10,
                  }}
                  onMouseDown={handleDragStart}
                >
                  {/* Header row */}
                  <div className="flex bg-blue-100/80 border border-blue-400/60 text-[10px] font-semibold" style={{ height: config.rowHeight }}>
                    {COLUMN_HEADERS.map((h, i) => (
                      <div
                        key={h}
                        className="px-1 flex items-center justify-center border-r border-blue-400/40 last:border-r-0"
                        style={{ width: `${config.columnWidths[i]}%` }}
                      >
                        {h}
                      </div>
                    ))}
                  </div>
                  {/* Data rows */}
                  {Array.from({ length: config.rowsPerPage }, (_, r) => (
                    <div
                      key={r}
                      className={`flex border border-blue-400/40 border-t-0 text-[9px] ${
                        r % 2 === 0 ? "bg-blue-50/60" : "bg-white/60"
                      }`}
                      style={{ height: config.rowHeight }}
                    >
                      {config.columnWidths.map((w, ci) => (
                        <div
                          key={ci}
                          className="px-1 flex items-center justify-center border-r border-blue-400/30 last:border-r-0 truncate"
                          style={{ width: `${w}%` }}
                        >
                          {ci === 0 ? r + 1 : ""}
                        </div>
                      ))}
                    </div>
                  ))}
                  {/* Resize handle */}
                  <div
                    className="absolute -right-1 top-0 bottom-0 w-2 cursor-ew-resize bg-blue-400/40 hover:bg-blue-500/60 rounded"
                    onMouseDown={handleResizeStart}
                  />
                  {/* Crosshair guides */}
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-2 h-2 border border-blue-500 rounded-full bg-blue-200" />
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-2 h-2 border border-blue-500 rounded-full bg-blue-200" />
                </div>

                {/* Dimension Labels */}
                <div
                  className="absolute text-[9px] font-mono text-blue-600 bg-blue-100/80 px-1 rounded"
                  style={{
                    left: config.tableX * zoom,
                    top: (config.tableY + (config.rowsPerPage + 1) * config.rowHeight + 10) * zoom,
                  }}
                >
                  {config.tableWidth}×{Math.round((config.rowsPerPage + 1) * config.rowHeight)}px
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PDF Preview */}
        {pdfUrl && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">PDF Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <iframe
                ref={iframeRef}
                src={pdfUrl}
                className="h-[700px] w-full rounded-lg border"
                title="PDF Preview"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
