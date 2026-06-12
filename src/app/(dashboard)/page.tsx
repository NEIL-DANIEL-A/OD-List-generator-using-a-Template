"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, FileText, File } from "lucide-react";

interface Stats {
  totalEvents: number;
  totalFiles: number;
  totalPdfs: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalEvents: 0,
    totalFiles: 0,
    totalPdfs: 0,
  });
  const [recentEvents, setRecentEvents] = useState<Array<{
    id: string;
    name: string;
    date: string;
    venue: string | null;
  }>>([]);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        if (data.stats) setStats(data.stats);
        if (data.recentEvents) setRecentEvents(data.recentEvents);
      })
      .catch(() => {});
  }, []);

  const statCards = [
    {
      title: "Total Events",
      value: stats.totalEvents,
      icon: Calendar,
      description: "All created events",
    },
    {
      title: "Uploaded Files",
      value: stats.totalFiles,
      icon: FileText,
      description: "Excel files uploaded",
    },
    {
      title: "Generated PDFs",
      value: stats.totalPdfs,
      icon: File,
      description: "Attendance sheets generated",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to the Attendance PDF Generator
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <CardDescription>{stat.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
          <CardDescription>Your latest created events</CardDescription>
        </CardHeader>
        <CardContent>
          {recentEvents.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <div className="text-center">
                <Calendar className="mx-auto mb-2 h-8 w-8" />
                <p>No events yet. Create your first event to get started.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium">{event.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.date).toLocaleDateString()}{" "}
                      {event.venue && `- ${event.venue}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
