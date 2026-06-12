"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Pencil,
  Trash2,
  Calendar,
  MapPin,
} from "lucide-react";

interface Event {
  id: string;
  name: string;
  date: string;
  venue: string | null;
  createdAt: string;
  _count?: { files: number };
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [form, setForm] = useState({ name: "", date: "", venue: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      const res = await fetch("/api/events");
      const data = await res.json();
      setEvents(data.events || []);
    } catch {
      console.error("Failed to fetch events");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const body = {
        name: form.name,
        date: form.date,
        venue: form.venue || null,
      };

      if (editingEvent) {
        await fetch(`/api/events/${editingEvent.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      setDialogOpen(false);
      setEditingEvent(null);
      setForm({ name: "", date: "", venue: "" });
      fetchEvents();
    } catch {
      console.error("Failed to save event");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteEvent(id: string) {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      await fetch(`/api/events/${id}`, { method: "DELETE" });
      fetchEvents();
    } catch {
      console.error("Failed to delete event");
    }
  }

  function openEditDialog(event: Event) {
    setEditingEvent(event);
    setForm({
      name: event.name,
      date: new Date(event.date).toISOString().split("T")[0],
      venue: event.venue || "",
    });
    setDialogOpen(true);
  }

  function openCreateDialog() {
    setEditingEvent(null);
    setForm({ name: "", date: "", venue: "" });
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground">
            Manage your events and their details
          </p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open: boolean) => {
            setDialogOpen(open);
            if (!open) {
              setEditingEvent(null);
              setForm({ name: "", date: "", venue: "" });
            }
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingEvent ? "Edit Event" : "Create Event"}
                </DialogTitle>
                <DialogDescription>
                  {editingEvent
                    ? "Update the event details below."
                    : "Fill in the details to create a new event."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Event Name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    placeholder="e.g., Annual Tech Conference 2026"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Event Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm({ ...form, date: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="venue">Venue (Optional)</Label>
                  <Input
                    id="venue"
                    value={form.venue}
                    onChange={(e) =>
                      setForm({ ...form, venue: e.target.value })
                    }
                    placeholder="e.g., Main Auditorium"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  {submitting
                    ? "Saving..."
                    : editingEvent
                    ? "Update Event"
                    : "Create Event"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-24" />
              <CardContent className="h-16" />
            </Card>
          ))}
        </div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">No events yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first event to get started
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Card key={event.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">{event.name}</span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(event)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteEvent(event.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(event.date).toLocaleDateString()}
                  </div>
                  {event.venue && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {event.venue}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
