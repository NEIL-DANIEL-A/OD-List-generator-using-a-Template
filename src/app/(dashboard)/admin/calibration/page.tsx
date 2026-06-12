"use client";

import { useState, useRef } from "react";
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
import { Loader2, Download } from "lucide-react";

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
];

export default function CalibrationPage() {
  const [rowCount, setRowCount] = useState(10);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  async function generatePreview() {
    setGenerating(true);
    try {
      const participants = SAMPLE_PARTICIPANTS.slice(0, rowCount);

      const res = await fetch("/api/calibration-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participants }),
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
        <h1 className="text-3xl font-bold tracking-tight">Template Preview</h1>
        <p className="text-muted-foreground">
          Preview the attendance sheet with sample data
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preview Settings</CardTitle>
              <CardDescription>
                Adjust the number of sample rows to preview
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Label className="w-28 text-sm">Row Count</Label>
                <Input
                  type="number"
                  min={1}
                  max={17}
                  value={rowCount}
                  onChange={(e) =>
                    setRowCount(Math.min(17, Math.max(1, Number(e.target.value) || 1)))
                  }
                  className="w-24"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button onClick={generatePreview} disabled={generating} className="flex-1">
              {generating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Generate Preview
            </Button>
            {pdfUrl && (
              <Button variant="outline" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            )}
          </div>
        </div>

        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle>PDF Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {pdfUrl ? (
              <iframe
                ref={iframeRef}
                src={pdfUrl}
                className="h-[700px] w-full rounded-lg border"
                title="PDF Preview"
              />
            ) : (
              <div className="flex h-[700px] items-center justify-center rounded-lg border border-dashed">
                <p className="text-muted-foreground">
                  Click &quot;Generate Preview&quot; to see the result
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
