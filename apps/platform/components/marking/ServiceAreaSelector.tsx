// apps/platform/components/marking/ServiceAreaSelector.tsx
"use client";

import { useState } from "react";
import { Card } from "@newcondo/ui/components/card";
import { Button } from "@newcondo/ui/components/button";
import { Input } from "@newcondo/ui/components/input";
import { Badge } from "@newcondo/ui/components/badge";
import { Checkbox } from "@newcondo/ui/components/checkbox";
import { Search, X, MapPin } from "lucide-react";

interface ServiceAreaSelectorProps {
  selectedAreas: string[];
  onAreasChange: (areas: string[]) => void;
}

// Nigerian states and major cities
const nigerianLocations = {
  Lagos: ["Ikeja", "VI", "Lekki", "Surulere", "Yaba", "Ikoyi", "Ajah", "Festac"],
  Abuja: ["Maitama", "Wuse", "Garki", "Asokoro", "Gwarinpa", "Kubwa", "Jabi"],
  "Rivers": ["Port Harcourt", "Obio-Akpor", "Eleme"],
  Oyo: ["Ibadan", "Ogbomoso", "Oyo"],
  Kano: ["Kano Municipal", "Nassarawa", "Fagge"],
  "Anambra": ["Awka", "Onitsha", "Nnewi"],
  "Delta": ["Warri", "Asaba", "Sapele"],
  "Edo": ["Benin City"],
  "Ogun": ["Abeokuta", "Ijebu-Ode", "Sagamu"],
  "Kaduna": ["Kaduna", "Zaria"],
};

export function ServiceAreaSelector({
  selectedAreas,
  onAreasChange,
}: ServiceAreaSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedStates, setExpandedStates] = useState<string[]>(["Lagos", "Abuja"]);

  const toggleState = (state: string) => {
    setExpandedStates((prev) =>
      prev.includes(state) ? prev.filter((s) => s !== state) : [...prev, state]
    );
  };

  const toggleArea = (area: string) => {
    onAreasChange(
      selectedAreas.includes(area)
        ? selectedAreas.filter((a) => a !== area)
        : [...selectedAreas, area]
    );
  };

  const toggleAllInState = (state: string) => {
    const cities = nigerianLocations[state as keyof typeof nigerianLocations];
    const allSelected = cities.every((city) =>
      selectedAreas.includes(`${state}-${city}`)
    );

    if (allSelected) {
      onAreasChange(
        selectedAreas.filter(
          (area) => !cities.some((city) => area === `${state}-${city}`)
        )
      );
    } else {
      const newAreas = cities
        .map((city) => `${state}-${city}`)
        .filter((area) => !selectedAreas.includes(area));
      onAreasChange([...selectedAreas, ...newAreas]);
    }
  };

  const removeArea = (area: string) => {
    onAreasChange(selectedAreas.filter((a) => a !== area));
  };

  const filteredLocations = Object.entries(nigerianLocations).reduce(
    (acc, [state, cities]) => {
      const matchingCities = cities.filter((city) =>
        city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        state.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (matchingCities.length > 0 || searchQuery === "") {
        acc[state] = searchQuery === "" ? cities : matchingCities;
      }
      return acc;
    },
    {} as Record<string, string[]>
  );

  return (
    <div className="space-y-4">
      {/* Selected Areas */}
      {selectedAreas.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">
              Selected Areas ({selectedAreas.length})
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAreasChange([])}
            >
              Clear All
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedAreas.map((area) => {
              const [state, city] = area.split("-");
              return (
                <Badge key={area} variant="secondary" className="gap-1">
                  <MapPin className="h-3 w-3" />
                  {city}, {state}
                  <button
                    onClick={() => removeArea(area)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search states or cities..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Location List */}
      <Card className="max-h-96 overflow-y-auto">
        <div className="divide-y">
          {Object.entries(filteredLocations).map(([state, cities]) => {
            const isExpanded = expandedStates.includes(state);
            const allSelected = cities.every((city) =>
              selectedAreas.includes(`${state}-${city}`)
            );

            return (
              <div key={state} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={() => toggleState(state)}
                    className="flex items-center gap-2 text-sm font-semibold hover:text-primary"
                  >
                    <span className={`transform transition-transform ${isExpanded ? "rotate-90" : ""}`}>
                      ▶
                    </span>
                    {state} State
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleAllInState(state)}
                  >
                    {allSelected ? "Deselect All" : "Select All"}
                  </Button>
                </div>

                {isExpanded && (
                  <div className="ml-6 space-y-2">
                    {cities.map((city) => {
                      const areaId = `${state}-${city}`;
                      const isSelected = selectedAreas.includes(areaId);

                      return (
                        <div
                          key={city}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={areaId}
                            checked={isSelected}
                            onCheckedChange={() => toggleArea(areaId)}
                          />
                          <label
                            htmlFor={areaId}
                            className="text-sm cursor-pointer flex-1"
                          >
                            {city}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {Object.keys(filteredLocations).length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              {`No locations found matching "${searchQuery}"`}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}