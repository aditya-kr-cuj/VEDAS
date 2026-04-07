"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: "exam" | "holiday" | "meeting" | "event";
  start_date: string;
  end_date: string;
  location: string | null;
  creator_name: string | null;
  created_at: string;
}

const eventTypeColors: Record<string, { bg: string; dot: string; text: string; border: string }> = {
  exam: { bg: "bg-red-500/10", dot: "bg-red-400", text: "text-red-400", border: "border-red-500/20" },
  holiday: { bg: "bg-emerald-500/10", dot: "bg-emerald-400", text: "text-emerald-400", border: "border-emerald-500/20" },
  meeting: { bg: "bg-blue-500/10", dot: "bg-blue-400", text: "text-blue-400", border: "border-blue-500/20" },
  event: { bg: "bg-violet-500/10", dot: "bg-violet-400", text: "text-violet-400", border: "border-violet-500/20" },
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

function eventOverlapsDay(event: CalendarEvent, day: Date): boolean {
  const start = new Date(event.start_date);
  const end = new Date(event.end_date);
  const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59);
  return start <= dayEnd && end >= dayStart;
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function formatFullDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Add event form
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formType, setFormType] = useState("event");
  const [formStart, setFormStart] = useState("");
  const [formEnd, setFormEnd] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [saving, setSaving] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const from = new Date(year, month, 1).toISOString();
      const to = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
      const res = await api.get("/calendar/events", { params: { from, to } });
      setEvents(res.data.events ?? []);
    } catch {
      console.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const calendarDays: (Date | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(new Date(year, month, d));

  const selectedDayEvents = selectedDay ? events.filter((e) => eventOverlapsDay(e, selectedDay)) : [];

  const handleAddEvent = async () => {
    if (!formTitle || !formStart || !formEnd) return;
    setSaving(true);
    try {
      await api.post("/calendar/events", {
        title: formTitle,
        description: formDesc || undefined,
        event_type: formType,
        start_date: new Date(formStart).toISOString(),
        end_date: new Date(formEnd).toISOString(),
        location: formLocation || undefined,
      });
      setShowForm(false);
      setFormTitle(""); setFormDesc(""); setFormType("event"); setFormStart(""); setFormEnd(""); setFormLocation("");
      fetchEvents();
    } catch {
      console.error("Failed to create event");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/calendar/events/${id}`);
      setSelectedEvent(null);
      fetchEvents();
    } catch {
      console.error("Failed to delete event");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Event Calendar</h2>
          <p className="mt-1 text-sm text-slate-400">Schedule and track institute events</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            {Object.entries(eventTypeColors).map(([type, c]) => (
              <span key={type} className="flex items-center gap-1 mr-2">
                <span className={`inline-block h-2 w-2 rounded-full ${c.dot}`} />
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </span>
            ))}
          </div>
          <Button id="add-event-btn" size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "+ Add Event"}
          </Button>
        </div>
      </div>

      {/* Add Event Form */}
      {showForm && (
        <Card>
          <CardContent className="space-y-4 p-6">
            <h3 className="text-sm font-medium text-slate-400">New Event</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-slate-500">Title</label>
                <Input id="event-title" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Event title" className="bg-slate-900/80" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">Type</label>
                <select id="event-type" value={formType} onChange={(e) => setFormType(e.target.value)} className="h-9 w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 text-sm text-slate-200 outline-none transition focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/40">
                  <option value="event">Event</option>
                  <option value="exam">Exam</option>
                  <option value="holiday">Holiday</option>
                  <option value="meeting">Meeting</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">Start Date &amp; Time</label>
                <Input id="event-start" type="datetime-local" value={formStart} onChange={(e) => setFormStart(e.target.value)} className="bg-slate-900/80" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">End Date &amp; Time</label>
                <Input id="event-end" type="datetime-local" value={formEnd} onChange={(e) => setFormEnd(e.target.value)} className="bg-slate-900/80" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">Location (optional)</label>
                <Input id="event-location" value={formLocation} onChange={(e) => setFormLocation(e.target.value)} placeholder="e.g. Room 101" className="bg-slate-900/80" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">Description (optional)</label>
                <Input id="event-desc" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Brief description" className="bg-slate-900/80" />
              </div>
            </div>
            <Button id="save-event-btn" onClick={handleAddEvent} disabled={saving || !formTitle || !formStart || !formEnd}>
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Saving…
                </span>
              ) : "Create Event"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-6">
          {/* Month Navigation */}
          <div className="mb-6 flex items-center justify-between">
            <Button id="cal-prev-month" variant="ghost" size="sm" onClick={prevMonth}>
              ← Prev
            </Button>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white">{MONTHS[month]} {year}</h3>
              <button onClick={goToday} className="mt-0.5 text-xs text-[var(--accent)] hover:underline">Today</button>
            </div>
            <Button id="cal-next-month" variant="ghost" size="sm" onClick={nextMonth}>
              Next →
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-[var(--accent)]" />
            </div>
          ) : (
            <>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {DAYS.map((d) => (
                  <div key={d} className="py-2 text-center text-xs font-medium uppercase tracking-wider text-slate-500">{d}</div>
                ))}
              </div>

              {/* Calendar cells */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, i) => {
                  if (!day) return <div key={`e-${i}`} className="h-24 rounded-lg bg-white/[0.01]" />;

                  const dayEvents = events.filter((e) => eventOverlapsDay(e, day));
                  const isToday = isSameDay(day, today);
                  const isSelected = selectedDay && isSameDay(day, selectedDay);

                  return (
                    <button
                      key={day.getDate()}
                      onClick={() => setSelectedDay(isSelected ? null : day)}
                      className={`group relative flex h-24 flex-col rounded-lg border p-1.5 text-left transition ${
                        isSelected
                          ? "border-[var(--accent)]/50 bg-[var(--accent)]/5"
                          : isToday
                          ? "border-white/20 bg-white/[0.04]"
                          : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]"
                      }`}
                    >
                      <span className={`text-xs font-medium ${isToday ? "flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] text-white" : "text-slate-400"}`}>
                        {day.getDate()}
                      </span>
                      <div className="mt-1 flex flex-col gap-0.5 overflow-hidden">
                        {dayEvents.slice(0, 3).map((ev) => {
                          const c = eventTypeColors[ev.event_type] ?? eventTypeColors.event;
                          return (
                            <div key={ev.id} className={`truncate rounded px-1 py-px text-[10px] font-medium ${c.bg} ${c.text}`}>
                              {ev.title}
                            </div>
                          );
                        })}
                        {dayEvents.length > 3 && (
                          <span className="text-[10px] text-slate-500">+{dayEvents.length - 3} more</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Selected Day Events */}
      {selectedDay && (
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-4 text-sm font-medium text-slate-400">
              Events on {formatFullDate(selectedDay.toISOString())}
            </h3>
            {selectedDayEvents.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">No events on this day</p>
            ) : (
              <div className="space-y-3">
                {selectedDayEvents.map((ev) => {
                  const c = eventTypeColors[ev.event_type] ?? eventTypeColors.event;
                  return (
                    <button
                      key={ev.id}
                      onClick={() => setSelectedEvent(ev)}
                      className={`flex w-full items-start gap-3 rounded-xl border ${c.border} ${c.bg} p-4 text-left transition hover:ring-1 hover:ring-white/10`}
                    >
                      <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${c.dot}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-200">{ev.title}</p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {formatTime(ev.start_date)} – {formatTime(ev.end_date)}
                          {ev.location && ` · ${ev.location}`}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${c.text} ${c.bg}`}>
                        {ev.event_type}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSelectedEvent(null)}>
          <div className="mx-4 w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const c = eventTypeColors[selectedEvent.event_type] ?? eventTypeColors.event;
              return (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${c.bg} ${c.text} border ${c.border}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                        {selectedEvent.event_type}
                      </span>
                      <h3 className="mt-3 text-xl font-semibold text-white">{selectedEvent.title}</h3>
                    </div>
                    <button onClick={() => setSelectedEvent(null)} className="rounded-lg p-1 text-slate-400 hover:bg-white/5 hover:text-white transition">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-slate-400">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      {formatFullDate(selectedEvent.start_date)} {formatTime(selectedEvent.start_date)} – {formatFullDate(selectedEvent.end_date)} {formatTime(selectedEvent.end_date)}
                    </div>
                    {selectedEvent.location && (
                      <div className="flex items-center gap-2 text-slate-400">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        {selectedEvent.location}
                      </div>
                    )}
                    {selectedEvent.creator_name && (
                      <div className="flex items-center gap-2 text-slate-400">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        Created by {selectedEvent.creator_name}
                      </div>
                    )}
                    {selectedEvent.description && (
                      <p className="mt-2 rounded-lg bg-white/[0.03] p-3 text-slate-300">{selectedEvent.description}</p>
                    )}
                  </div>
                  <div className="mt-6 flex justify-end gap-2">
                    <Button id="event-detail-delete" variant="destructive" size="sm" onClick={() => handleDelete(selectedEvent.id)}>
                      Delete
                    </Button>
                    <Button id="event-detail-close" variant="outline" size="sm" onClick={() => setSelectedEvent(null)}>
                      Close
                    </Button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
