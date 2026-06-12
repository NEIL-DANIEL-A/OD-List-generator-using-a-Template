"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Download, Move, Maximize2, RotateCcw, Save, ZoomIn, ZoomOut, Trash2 } from "lucide-react";
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
  const [zoom, setZoom] = useState(1.0);
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
    <div className="h-screen flex overflow-hidden bg-background p-3">
      {/* Left Panel — Controls (fixed, not scrollable) */}
      <div className="w-[420px] min-w-[420px] border-r overflow-hidden p-5 space-y-4 flex flex-col">
        <h1 className="text-lg font-bold tracking-tight">Template Calibration</h1>

        {/* Template Upload */}
        <div className="space-y-1">
          <Label className="text-xs font-semibold uppercase text-muted-foreground">Template Image</Label>
          <div
            {...getRootProps()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-3 transition-colors ${
              isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            {templateFileName ? (
              <p className="text-xs font-medium">{templateFileName}</p>
            ) : (
              <p className="text-xs text-muted-foreground">Drop template or click</p>
            )}
          </div>
        </div>

        {/* Excel Upload */}
        <div className="space-y-1">
          <Label className="text-xs font-semibold uppercase text-muted-foreground">Excel Data</Label>
          <div
            {...getExcelRootProps()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-3 transition-colors ${
              isExcelDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
            }`}
          >
            <input {...getExcelInputProps()} />
            {parsing ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : excelFileName ? (
              <div className="text-center">
                <p className="text-xs font-medium">{excelFileName}</p>
                <p className="text-[10px] text-muted-foreground">{participants.length} rows</p>
                <Button variant="ghost" size="sm" className="mt-0.5 h-5 px-2 text-[10px]" onClick={(e) => { e.stopPropagation(); clearExcel(); }}>
                  <Trash2 className="mr-1 h-2.5 w-2.5" />Remove
                </Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Drop Excel or click</p>
            )}
          </div>
        </div>

        {/* Position & Size */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1"><Move className="h-3 w-3" /> Position & Size</Label>
          {[
            { label: "X", key: "tableX" as const, max: A4_WIDTH_PX },
            { label: "Y", key: "tableY" as const, max: A4_HEIGHT_PX },
            { label: "Width", key: "tableWidth" as const, max: A4_WIDTH_PX },
            { label: "Row Height", key: "rowHeight" as const, max: 80 },
          ].map(({ label, key, max }) => (
            <div key={key} className="flex items-center gap-2">
              <Label className="text-xs w-16">{label}</Label>
              <input
                type="range"
                min={0}
                max={max}
                value={config[key]}
                onChange={(e) => setConfig((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                className="flex-1 h-1 accent-primary"
              />
              <Input
                type="number"
                min={0}
                max={max}
                value={config[key]}
                onChange={(e) => setConfig((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                className="w-16 h-7 text-xs font-mono"
              />
            </div>
          ))}
          <div className="flex items-center gap-2">
            <Label className="text-xs w-16">Rows</Label>
            <Input
              type="number"
              min={1}
              value={config.rowsPerPage}
              onChange={(e) => setConfig((prev) => ({ ...prev, rowsPerPage: Math.max(1, Number(e.target.value) || 1) }))}
              className="w-16 h-7 text-xs"
            />
          </div>
        </div>

        {/* Column Widths */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase text-muted-foreground">Column Widths (%)</Label>
          {COLUMN_HEADERS.map((h, i) => (
            <div key={h} className="flex items-center gap-1.5">
              <Label className="text-[11px] w-20 truncate">{h}</Label>
              <input
                type="range"
                min={2}
                max={60}
                value={config.columnWidths[i]}
                onChange={(e) => {
                  const nw = [...config.columnWidths];
                  nw[i] = Number(e.target.value);
                  setConfig((prev) => ({ ...prev, columnWidths: nw }));
                }}
                className="flex-1 h-1 accent-primary"
              />
              <Input
                type="number"
                min={2}
                max={60}
                value={config.columnWidths[i]}
                onChange={(e) => {
                  const nw = [...config.columnWidths];
                  nw[i] = Number(e.target.value);
                  setConfig((prev) => ({ ...prev, columnWidths: nw }));
                }}
                className="w-14 h-7 text-[11px] font-mono"
              />
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-1">
          <div className="flex gap-2">
            <Button onClick={generatePreview} disabled={generating} className="flex-1 h-8" size="sm">
              {generating ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
              Generate
            </Button>
            {pdfUrl && (
              <Button variant="outline" size="sm" className="h-8 px-2" onClick={handleDownload}>
                <Download className="h-3 w-3" />
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resetConfig} className="flex-1 h-7 text-[11px]">
              <RotateCcw className="mr-1 h-2.5 w-2.5" />Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Right Panel — Canvas + PDF Preview below */}
      <div className="flex-1 min-w-0 overflow-y-auto p-4 space-y-4">
        {/* Visual Canvas */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold flex items-center gap-1"><Maximize2 className="h-3 w-3" /> Visual Canvas</span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-6 w-6 p-0" onClick={() => setZoom((z) => Math.max(0.2, z - 0.05))}>
                <ZoomOut className="h-3 w-3" />
              </Button>
              <span className="text-[10px] text-muted-foreground w-10 text-center font-mono">{Math.round(zoom * 100)}%</span>
              <Button variant="outline" size="sm" className="h-6 w-6 p-0" onClick={() => setZoom((z) => Math.min(1.5, z + 0.05))}>
                <ZoomIn className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div className="flex justify-center overflow-auto rounded-lg border bg-gray-100 p-3">
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
              {templateImage && (
                <img src={templateImage} alt="" className="absolute inset-0 pointer-events-none" style={{ width: "100%", height: "100%", objectFit: "fill" }} />
              )}
              <svg className="absolute inset-0 pointer-events-none" style={{ width: "100%", height: "100%" }}>
                {Array.from({ length: Math.floor(A4_WIDTH_PX / 50) + 1 }, (_, i) => (
                  <g key={`v${i}`}>
                    <line x1={i * 50 * zoom} y1={0} x2={i * 50 * zoom} y2={A4_HEIGHT_PX * zoom} stroke="#e5e7eb" strokeWidth={0.5} strokeDasharray="4,4" />
                    <text x={i * 50 * zoom + 2} y={10} fill="#9ca3af" fontSize={8} fontFamily="monospace">{i * 50}</text>
                  </g>
                ))}
                {Array.from({ length: Math.floor(A4_HEIGHT_PX / 50) + 1 }, (_, i) => (
                  <g key={`h${i}`}>
                    <line x1={0} y1={i * 50 * zoom} x2={A4_WIDTH_PX * zoom} y2={i * 50 * zoom} stroke="#e5e7eb" strokeWidth={0.5} strokeDasharray="4,4" />
                    <text x={2} y={i * 50 * zoom - 2} fill="#9ca3af" fontSize={8} fontFamily="monospace">{i * 50}</text>
                  </g>
                ))}
              </svg>
              <div
                className="absolute cursor-move"
                style={{ left: config.tableX * zoom, top: config.tableY * zoom, width: config.tableWidth * zoom, zIndex: 10 }}
                onMouseDown={handleDragStart}
              >
                <div className="flex bg-blue-100/80 border border-blue-400/60 text-[10px] font-semibold" style={{ height: config.rowHeight }}>
                  {COLUMN_HEADERS.map((h, i) => (
                    <div key={h} className="px-1 flex items-center justify-center border-r border-blue-400/40 last:border-r-0" style={{ width: `${config.columnWidths[i]}%` }}>{h}</div>
                  ))}
                </div>
                {Array.from({ length: config.rowsPerPage }, (_, r) => (
                  <div key={r} className={`flex border border-blue-400/40 border-t-0 text-[9px] ${r % 2 === 0 ? "bg-blue-50/60" : "bg-white/60"}`} style={{ height: config.rowHeight }}>
                    {config.columnWidths.map((w, ci) => (
                      <div key={ci} className="px-1 flex items-center justify-center border-r border-blue-400/30 last:border-r-0 truncate" style={{ width: `${w}%` }}>{ci === 0 ? r + 1 : ""}</div>
                    ))}
                  </div>
                ))}
                <div className="absolute -right-1 top-0 bottom-0 w-2 cursor-ew-resize bg-blue-400/40 hover:bg-blue-500/60 rounded" onMouseDown={handleResizeStart} />
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-2 h-2 border border-blue-500 rounded-full bg-blue-200" />
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-2 h-2 border border-blue-500 rounded-full bg-blue-200" />
              </div>
              <div className="absolute text-[9px] font-mono text-blue-600 bg-blue-100/80 px-1 rounded" style={{ left: config.tableX * zoom, top: (config.tableY + (config.rowsPerPage + 1) * config.rowHeight + 10) * zoom }}>
                {config.tableWidth}x{Math.round((config.rowsPerPage + 1) * config.rowHeight)}px
              </div>
            </div>
          </div>
        </div>

        {/* PDF Preview — appears below after generating */}
        {pdfUrl && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">PDF Preview</span>
              <Button variant="outline" size="sm" className="h-7" onClick={handleDownload}>
                <Download className="mr-1 h-3 w-3" /> Download
              </Button>
            </div>
            <iframe ref={iframeRef} src={pdfUrl} className="w-full rounded-lg border" style={{ height: "800px" }} title="PDF Preview" />
          </div>
        )}
      </div>
    </div>
  );
}
