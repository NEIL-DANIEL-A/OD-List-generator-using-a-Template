"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure your attendance generator settings
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>PDF Generation</CardTitle>
            <CardDescription>
              PDF layout is generated from an HTML template — edit
              <code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">
                src/lib/html-template.ts
              </code>
              to customize colors, fonts, or columns.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>File Upload Settings</CardTitle>
            <CardDescription>Configure file upload restrictions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="maxSize">Max File Size (MB)</Label>
              <Input id="maxSize" type="number" defaultValue={10} />
            </div>
            <div className="space-y-2">
              <Label>Allowed File Types</Label>
              <div className="flex gap-2">
                <span className="rounded bg-muted px-2 py-1 text-sm">
                  .xlsx
                </span>
                <span className="rounded bg-muted px-2 py-1 text-sm">
                  .xls
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
