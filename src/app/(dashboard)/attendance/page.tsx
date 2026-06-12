"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  FileSpreadsheet,
  FileText,
  Download,
  RefreshCw,
  Trash2,
  Loader2,
  Image,
  Upload as UploadIcon,
} from "lucide-react";
import type { TemplateConfig } from "@/lib/types";

interface Event {
  id: string;
  name: string;
}

interface Participant {
  sno: number;
  rollNumber: string;
  name: string;
  department: string;
  year: string;
}

export default function AttendancePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [useCustomTemplate, setUseCustomTemplate] = useState(false);
  const [templateImage, setTemplateImage] = useState<string | null>(null);
  const [templateFileName, setTemplateFileName] = useState<string>("");
  const [templateConfig, setTemplateConfig] = useState<TemplateConfig>({ tableX: 40, tableY: 200, tableWidth: 714, rowHeight: 30, columnWidths: [6, 18, 42, 14, 20], rowsPerPage: 17 });
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => setEvents(data.events || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setError("");
    setSuccess("");
    setParsing(true);
    setUploadedFile(file);
    setPdfBlob(null);
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload-excel", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to parse Excel file");
      }

      setParticipants(data.participants);
      setSuccess(
        `Successfully parsed ${data.participants.length} participants`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse file");
    } finally {
      setParsing(false);
    }
  }, [pdfUrl]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const onTemplateDrop = useCallback((accepted: File[]) => {
    const file = accepted[0];
    if (!file) return;
    setTemplateFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setTemplateImage(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const {
    getRootProps: getTemplateRootProps,
    getInputProps: getTemplateInputProps,
    isDragActive: isTemplateDragActive,
  } = useDropzone({
    onDrop: onTemplateDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg"] },
    maxFiles: 1,
    multiple: false,
  });

  function loadTemplateConfig() {
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
            setTemplateConfig(parsed);
          }
        } catch { /* ignore */ }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  function clearTemplate() {
    setTemplateImage(null);
    setTemplateFileName("");
    setUseCustomTemplate(false);
    setTemplateConfig({ tableX: 40, tableY: 200, tableWidth: 714, rowHeight: 30, columnWidths: [6, 18, 42, 14, 20], rowsPerPage: 17 });
  }

  async function handleGenerate() {
    if (!uploadedFile) return;

    setGenerating(true);
    setError("");
    setSuccess("");

    try {
      const selectedEvent = events.find((e) => e.id === selectedEventId);
      const formData = new FormData();
      formData.append("file", uploadedFile);
      if (selectedEvent) {
        formData.append("eventName", selectedEvent.name);
      }
      if (useCustomTemplate && templateImage) {
        const res = await fetch(templateImage);
        const blob = await res.blob();
        const ext = templateFileName.split(".").pop() || "png";
        const file = new File([blob], `template.${ext}`, { type: blob.type });
        formData.append("templateImage", file);
        formData.append("templateConfig", JSON.stringify(templateConfig));
      }

      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate PDF");
      }

      const blob = await res.blob();
      setPdfBlob(blob);

      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);

      setSuccess("PDF generated successfully!");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate PDF"
      );
    } finally {
      setGenerating(false);
    }
  }

  function handleDownload() {
    if (!pdfBlob) return;

    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${Date.now()}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function handleRegenerate() {
    setPdfBlob(null);
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl("");
    handleGenerate();
  }

  function clearFile() {
    setUploadedFile(null);
    setParticipants([]);
    setPdfBlob(null);
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl("");
    setError("");
    setSuccess("");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Attendance Generator
        </h1>
        <p className="text-muted-foreground">
          Upload an Excel file and generate attendance sheet PDFs
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Event (Optional)</CardTitle>
              <CardDescription>
                Choose an event or leave unselected
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedEventId}
                onValueChange={setSelectedEventId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Event (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                Custom Template (Optional)
              </CardTitle>
              <CardDescription>
                Upload a template image and overlay the table on it
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useCustomTemplate}
                    onChange={(e) => {
                      setUseCustomTemplate(e.target.checked);
                      if (!e.target.checked) clearTemplate();
                    }}
                    className="h-4 w-4 rounded border-gray-300 accent-primary"
                  />
                  <span className="text-sm">Enable custom template</span>
                </label>
              </div>

              {useCustomTemplate && (
                <>
                  <div
                    {...getTemplateRootProps()}
                    className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-colors ${
                      isTemplateDragActive
                        ? "border-primary bg-primary/5"
                        : "border-muted-foreground/25 hover:border-primary/50"
                    }`}
                  >
                    <input {...getTemplateInputProps()} />
                    {templateFileName ? (
                      <div className="text-center">
                        <p className="text-sm font-medium">{templateFileName}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearTemplate();
                          }}
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <UploadIcon className="mx-auto mb-1 h-6 w-6 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                          Drop template image or click to upload
                        </p>
                      </div>
                    )}
                  </div>

                  <Button variant="outline" size="sm" className="w-full" onClick={loadTemplateConfig}>
                    <UploadIcon className="mr-1 h-3 w-3" />
                    Load Calibration Config (.json)
                  </Button>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">X</Label>
                      <Input
                        type="number"
                        value={templateConfig.tableX}
                        onChange={(e) => setTemplateConfig((c) => ({ ...c, tableX: Number(e.target.value) }))}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Y</Label>
                      <Input
                        type="number"
                        value={templateConfig.tableY}
                        onChange={(e) => setTemplateConfig((c) => ({ ...c, tableY: Number(e.target.value) }))}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Width</Label>
                      <Input
                        type="number"
                        value={templateConfig.tableWidth}
                        onChange={(e) => setTemplateConfig((c) => ({ ...c, tableWidth: Number(e.target.value) }))}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  <p className="text-[10px] text-muted-foreground text-center">
                    Use the <a href="/admin/calibration" className="underline text-primary">Calibration Tool</a> to get precise coordinates
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upload Excel File</CardTitle>
              <CardDescription>
                Drag and drop your .xlsx or .xls file
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
                  isDragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50"
                }`}
              >
                <input {...getInputProps()} />
                {parsing ? (
                  <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
                ) : uploadedFile ? (
                  <FileSpreadsheet className="mb-4 h-8 w-8 text-green-600" />
                ) : (
                  <Upload className="mb-4 h-8 w-8 text-muted-foreground" />
                )}
                {uploadedFile ? (
                  <div className="text-center">
                    <p className="font-medium">{uploadedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(uploadedFile.size / 1024).toFixed(1)} KB
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFile();
                      }}
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Drop your Excel file here, or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Supports .xlsx and .xls (max 10MB)
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {participants.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Participants ({participants.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-60 overflow-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted">
                      <tr>
                        <th className="p-2 text-left">S.No</th>
                        <th className="p-2 text-left">Roll No</th>
                        <th className="p-2 text-left">Name</th>
                        <th className="p-2 text-left">Dept</th>
                        <th className="p-2 text-left">Year</th>
                      </tr>
                    </thead>
                    <tbody>
                      {participants.slice(0, 50).map((p) => (
                        <tr key={p.sno} className="border-t">
                          <td className="p-2">{p.sno}</td>
                          <td className="p-2">{p.rollNumber}</td>
                          <td className="p-2">{p.name}</td>
                          <td className="p-2">{p.department}</td>
                          <td className="p-2">{p.year}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {participants.length > 50 && (
                    <p className="p-2 text-center text-xs text-muted-foreground">
                      Showing 50 of {participants.length} participants
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                className="w-full"
                size="lg"
                onClick={handleGenerate}
                disabled={!uploadedFile || generating}
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Attendance PDF
                  </>
                )}
              </Button>

              {pdfBlob && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleDownload}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleRegenerate}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Regenerate
                  </Button>
                </div>
              )}

              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-700">
                  {success}
                </div>
              )}
            </CardContent>
          </Card>

          {pdfUrl && (
            <Card>
              <CardHeader>
                <CardTitle>PDF Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <iframe
                  ref={iframeRef}
                  src={pdfUrl}
                  className="h-[600px] w-full rounded-lg border"
                  title="PDF Preview"
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
