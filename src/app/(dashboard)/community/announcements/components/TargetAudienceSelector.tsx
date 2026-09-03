"use client";

import React, { useMemo } from "react";
import {
  IconBuildingCommunity,
  IconBuilding,
  IconDoor,
  IconCheck,
  IconInfoCircle,
  IconLayersLinked,
} from "@tabler/icons-react";
import { PropertyOption, TargetScope, AppUserRole } from "../types";

interface TargetAudienceSelectorProps {
  targetScope: TargetScope;
  onChangeScope: (scope: TargetScope) => void;
  targetPropertyId?: string;
  onChangePropertyId: (propertyId: string) => void;
  targetUnitIds?: string[];
  onChangeUnitIds: (unitIds: string[]) => void;
  properties: PropertyOption[];
  userRole: AppUserRole;
  disabled?: boolean;
}

export const TargetAudienceSelector: React.FC<TargetAudienceSelectorProps> = ({
  targetScope,
  onChangeScope,
  targetPropertyId,
  onChangePropertyId,
  targetUnitIds = [],
  onChangeUnitIds,
  properties,
  userRole,
  disabled = false,
}) => {
  const isHousekeeping = userRole === "HOUSEKEEPING";

  // Selected property object
  const selectedProperty = useMemo(() => {
    return properties.find((p) => p.id === targetPropertyId);
  }, [properties, targetPropertyId]);

  // Group units by floor for easy selection
  const unitsByFloor = useMemo(() => {
    if (!selectedProperty || !selectedProperty.units) return {};
    const map: Record<number, typeof selectedProperty.units> = {};
    for (const u of selectedProperty.units) {
      const floor = u.floor || 1;
      if (!map[floor]) map[floor] = [];
      map[floor].push(u);
    }
    return map;
  }, [selectedProperty]);

  // Handle unit selection toggle
  const toggleUnit = (unitId: string) => {
    if (disabled) return;
    if (targetUnitIds.includes(unitId)) {
      onChangeUnitIds(targetUnitIds.filter((id) => id !== unitId));
    } else {
      onChangeUnitIds([...targetUnitIds, unitId]);
    }
  };

  // Select all units in selected property
  const selectAllUnits = () => {
    if (disabled || !selectedProperty) return;
    onChangeUnitIds(selectedProperty.units.map((u) => u.id));
  };

  // Clear all unit selections
  const clearAllUnits = () => {
    if (disabled) return;
    onChangeUnitIds([]);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-foreground mb-1.5">
          Target Penerima Pengumuman
        </label>
        <p className="text-xs text-muted-foreground mb-3">
          Tentukan jangkauan pengumuman agar pesan hanya diterima oleh pihak yang relevan.
        </p>

        {/* Radio Option Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* 1. All Properties */}
          <div
            onClick={() => {
              if (!disabled && !isHousekeeping) {
                onChangeScope("ALL_PROPERTIES");
              }
            }}
            className={`relative flex flex-col p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
              isHousekeeping
                ? "opacity-50 cursor-not-allowed bg-muted/40 border-border"
                : targetScope === "ALL_PROPERTIES"
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border hover:border-border/80 bg-card hover:bg-accent/40"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div
                className={`p-2 rounded-lg ${
                  targetScope === "ALL_PROPERTIES"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <IconBuildingCommunity className="w-5 h-5" />
              </div>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  targetScope === "ALL_PROPERTIES"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/40"
                }`}
              >
                {targetScope === "ALL_PROPERTIES" && <IconCheck className="w-3 h-3 stroke-[3]" />}
              </div>
            </div>
            <span className="text-sm font-semibold text-foreground">Semua Kamar</span>
            <span className="text-xs text-muted-foreground mt-0.5">
              Broadcast ke seluruh properti Anda
            </span>
            {isHousekeeping && (
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-1">
                (Khusus Akun Owner)
              </span>
            )}
          </div>

          {/* 2. Specific Property */}
          <div
            onClick={() => {
              if (!disabled) {
                onChangeScope("SPECIFIC_PROPERTY");
                if (!targetPropertyId && properties.length > 0) {
                  onChangePropertyId(properties[0].id);
                }
              }
            }}
            className={`relative flex flex-col p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
              targetScope === "SPECIFIC_PROPERTY"
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border hover:border-border/80 bg-card hover:bg-accent/40"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div
                className={`p-2 rounded-lg ${
                  targetScope === "SPECIFIC_PROPERTY"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <IconBuilding className="w-5 h-5" />
              </div>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  targetScope === "SPECIFIC_PROPERTY"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/40"
                }`}
              >
                {targetScope === "SPECIFIC_PROPERTY" && <IconCheck className="w-3 h-3 stroke-[3]" />}
              </div>
            </div>
            <span className="text-sm font-semibold text-foreground">Satu Properti</span>
            <span className="text-xs text-muted-foreground mt-0.5">
              Kirim ke seluruh unit di 1 properti
            </span>
          </div>

          {/* 3. Specific Units */}
          <div
            onClick={() => {
              if (!disabled) {
                onChangeScope("SPECIFIC_UNITS");
                if (!targetPropertyId && properties.length > 0) {
                  onChangePropertyId(properties[0].id);
                }
              }
            }}
            className={`relative flex flex-col p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
              targetScope === "SPECIFIC_UNITS"
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border hover:border-border/80 bg-card hover:bg-accent/40"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div
                className={`p-2 rounded-lg ${
                  targetScope === "SPECIFIC_UNITS"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <IconDoor className="w-5 h-5" />
              </div>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  targetScope === "SPECIFIC_UNITS"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/40"
                }`}
              >
                {targetScope === "SPECIFIC_UNITS" && <IconCheck className="w-3 h-3 stroke-[3]" />}
              </div>
            </div>
            <span className="text-sm font-semibold text-foreground">Kamar Tertentu</span>
            <span className="text-xs text-muted-foreground mt-0.5">
              Pilih satu atau beberapa unit kamar
            </span>
          </div>
        </div>
      </div>

      {/* Property Selector Dropdown (Shown when SPECIFIC_PROPERTY or SPECIFIC_UNITS) */}
      {targetScope !== "ALL_PROPERTIES" && (
        <div className="p-3.5 bg-muted/30 rounded-xl border border-border space-y-3">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Pilih Properti Tujuan <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <select
                disabled={disabled}
                value={targetPropertyId || ""}
                onChange={(e) => {
                  onChangePropertyId(e.target.value);
                  onChangeUnitIds([]); // Reset selected units when property changes
                }}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              >
                <option value="" disabled>
                  -- Pilih Properti --
                </option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.units?.length || 0} unit kamar)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Unit Selector (Shown when SPECIFIC_UNITS) */}
          {targetScope === "SPECIFIC_UNITS" && selectedProperty && (
            <div className="pt-2 border-t border-border space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <IconLayersLinked className="w-4 h-4 text-primary" />
                  Pilih Unit Kamar ({targetUnitIds.length} dipilih):
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllUnits}
                    disabled={disabled}
                    className="text-[11px] text-primary hover:underline font-medium"
                  >
                    Pilih Semua
                  </button>
                  <span className="text-muted-foreground text-xs">|</span>
                  <button
                    type="button"
                    onClick={clearAllUnits}
                    disabled={disabled}
                    className="text-[11px] text-muted-foreground hover:text-foreground font-medium"
                  >
                    Batal Semua
                  </button>
                </div>
              </div>

              {selectedProperty.units?.length === 0 ? (
                <div className="p-3 bg-muted rounded-lg text-xs text-muted-foreground text-center">
                  Tidak ada unit kamar terdaftar pada properti ini.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {Object.entries(unitsByFloor).map(([floor, units]) => (
                    <div key={floor} className="space-y-1.5">
                      <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Lantai {floor}
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5">
                        {units.map((unit) => {
                          const isSelected = targetUnitIds.includes(unit.id);
                          return (
                            <button
                              key={unit.id}
                              type="button"
                              onClick={() => toggleUnit(unit.id)}
                              disabled={disabled}
                              className={`flex items-center justify-center py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors ${
                                isSelected
                                  ? "border-primary bg-primary text-primary-foreground shadow-xs"
                                  : "border-border bg-card text-foreground hover:bg-accent"
                              }`}
                            >
                              Kamar {unit.unitNumber}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {targetUnitIds.length === 0 && (
                <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                  <IconInfoCircle className="w-4 h-4 shrink-0" />
                  <span>Silakan pilih minimal 1 unit kamar untuk menerbitkan pengumuman.</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
