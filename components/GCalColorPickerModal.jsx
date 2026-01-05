"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { GCAL_COLORS } from "@/app/consts";
import { Input } from "./ui/input";

function buildDefaultColorMap(subjects) {
  const map = {};
  subjects.forEach((sub, i) => {
    map[sub] = GCAL_COLORS[i % GCAL_COLORS.length].id;
  });
  return map;
}

function buildEditableNameMap(subjects) {
  const map = {};
  subjects.forEach((s) => {
    map[s] = s;
  });
  return map;
}

export default function GCalColorPickerModal({
  open,
  onClose,
  subjects,
  onConfirm,
}) {
  const [colorMap, setColorMap] = useState({});
  const [nameMap, setNameMap] = useState({});

  useEffect(() => {
    if (!open) return;

    setColorMap(buildDefaultColorMap(subjects));
    setNameMap(buildEditableNameMap(subjects));
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pick colors & names for subjects</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {subjects.map((originalSub) => {
            const currentColor =
              GCAL_COLORS.find((c) => c.id === colorMap[originalSub]) ??
              GCAL_COLORS[0];

            return (
              <div
                key={originalSub}
                className="flex items-center justify-between gap-3"
              >
                <Input
                  className="text-sm max-w-[220px]"
                  value={nameMap[originalSub] ?? ""}
                  onChange={(e) =>
                    setNameMap((prev) => ({
                      ...prev,
                      [originalSub]: e.target.value,
                    }))
                  }
                />

                <Select
                  value={String(colorMap[originalSub] ?? 1)}
                  onValueChange={(v) =>
                    setColorMap((prev) => ({
                      ...prev,
                      [originalSub]: Number(v),
                    }))
                  }
                >
                  <SelectTrigger className="w-36">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: currentColor.hex }}
                        />
                        <span>{currentColor.name}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>

                  <SelectContent>
                    {GCAL_COLORS.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        <div className="flex items-center gap-2">
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: c.hex }}
                          />
                          <span>{c.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </div>

        <Button
          className="mt-4"
          onClick={() => {
            onConfirm(nameMap, colorMap);
          }}
        >
          Continue
        </Button>
      </DialogContent>
    </Dialog>
  );
}
