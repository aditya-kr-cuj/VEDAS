"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TimeSlot = {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  slot_number: number;
};

type Availability = {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  reason: string | null;
};

type Props = {
  timeSlots: TimeSlot[];
  availability: Availability[];
  onMarkUnavailable: (slot: TimeSlot, reason: string) => void;
  onMarkAvailable: (availabilityId: string) => void;
};

const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export function AvailabilityGrid({ timeSlots, availability, onMarkUnavailable, onMarkAvailable }: Props) {
  const [selected, setSelected] = useState<TimeSlot | null>(null);
  const [reason, setReason] = useState("");

  const byDay = useMemo(() => {
    return days.map((day) => ({
      day,
      slots: timeSlots.filter((slot) => slot.day_of_week === day),
    }));
  }, [timeSlots]);

  const availabilityMap = useMemo(() => {
    const map = new Map<string, Availability>();
    availability.forEach((item) => {
      map.set(`${item.day_of_week}-${item.start_time}-${item.end_time}`, item);
    });
    return map;
  }, [availability]);

  const handleSelect = (slot: TimeSlot) => {
    setSelected(slot);
    setReason("");
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-7">
        {byDay.map((day) => (
          <div key={day.day} className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs uppercase text-slate-400">{day.day}</p>
            <div className="mt-3 space-y-2">
              {day.slots.length === 0 ? (
                <p className="text-xs text-slate-500">No slots</p>
              ) : (
                day.slots.map((slot) => {
                  const key = `${slot.day_of_week}-${slot.start_time}-${slot.end_time}`;
                  const record = availabilityMap.get(key);
                  const isUnavailable = record ? !record.is_available : false;
                  return (
                    <button
                      key={slot.id}
                      onClick={() => handleSelect(slot)}
                      className={`w-full rounded-lg px-2 py-2 text-xs text-left ${
                        isUnavailable ? "bg-red-500/30 text-red-100" : "bg-emerald-500/20 text-emerald-100"
                      }`}
                    >
                      <div className="font-semibold">
                        Slot {slot.slot_number}: {slot.start_time} - {slot.end_time}
                      </div>
                      <div className="text-[11px]">
                        {isUnavailable ? record?.reason ?? "Unavailable" : "Available"}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-semibold text-white">
            Selected: {selected.day_of_week} {selected.start_time} - {selected.end_time}
          </p>
          <div className="mt-3 space-y-2">
            <Label>Reason (optional)</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="On leave / Meeting" />
          </div>
          <div className="mt-3 flex gap-2">
            <Button onClick={() => onMarkUnavailable(selected, reason)}>Mark Unavailable</Button>
            <Button
              variant="ghost"
              onClick={() => {
                const record = availabilityMap.get(
                  `${selected.day_of_week}-${selected.start_time}-${selected.end_time}`
                );
                if (record) onMarkAvailable(record.id);
              }}
            >
              Mark Available
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
