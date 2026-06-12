"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Trash2, FileText, Loader2 } from "lucide-react";

interface GeneratedPdf {
  id: string;
  filename: string;
  filepath: string;
  eventId: string;
  eventName: string;
  createdAt: string;
  participantCount: number;
}

export default function GeneratedPdfsPage() {
  const [pdfs, setPdfs] = useState<GeneratedPdf[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchPdfs();
  }, []);

  async function fetchPdfs() {
    try {
      const res = await fetch("/api/generated-pdfs");
      const data = await res.json();
      setPdfs(data.pdfs || []);
    } catch {
      console.error("Failed to fetch PDFs");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(pdf: GeneratedPdf) {
    try {
      const res = await fetch(
        `/api/download-pdf?id=${pdf.id}`
      );
      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = pdf.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      console.error("Download failed");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this PDF?")) return;

    setDeleting(id);
    try {
      await fetch(`/api/download-pdf?id=${id}`, { method: "DELETE" });
      fetchPdfs();
    } catch {
      console.error("Delete failed");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Generated PDFs</h1>
        <p className="text-muted-foreground">
          View and download all generated attendance sheets
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Generated PDFs</CardTitle>
          <CardDescription>
            {pdfs.length} PDF{pdfs.length !== 1 ? "s" : ""} generated
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : pdfs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="mb-4 h-12 w-12" />
              <p className="text-lg font-medium">No PDFs generated yet</p>
              <p className="text-sm">
                Generate your first attendance sheet from the Attendance
                Generator page
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PDF Name</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Participants</TableHead>
                    <TableHead>Generated Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pdfs.map((pdf) => (
                    <TableRow key={pdf.id}>
                      <TableCell className="font-medium">
                        {pdf.filename}
                      </TableCell>
                      <TableCell>{pdf.eventName}</TableCell>
                      <TableCell>{pdf.participantCount}</TableCell>
                      <TableCell>
                        {new Date(pdf.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(pdf)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(pdf.id)}
                            disabled={deleting === pdf.id}
                          >
                            {deleting === pdf.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
