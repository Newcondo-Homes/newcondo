// apps/platform/components/marking/CompletionNotes.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@newcondo/ui/card";
import { Textarea } from "@newcondo/ui/textarea";
import { Label } from "@newcondo/ui/label";
import { Badge } from "@newcondo/ui/badge";
import { FileText, CheckCircle, AlertCircle } from "lucide-react";

interface CompletionNotesProps {
  notes: string;
  onNotesChange: (notes: string) => void;
  minLength?: number;
  maxLength?: number;
}

export function CompletionNotes({
  notes,
  onNotesChange,
  minLength = 20,
  maxLength = 1000,
}: CompletionNotesProps) {
  const characterCount = notes.length;
  const isValid = characterCount >= minLength && characterCount <= maxLength;
  const progress = Math.min((characterCount / minLength) * 100, 100);

  const suggestedPoints = [
    "Property location and accessibility",
    "Surrounding landmarks and identifying features",
    "Any challenges faced during marking",
    "Property condition and notable features",
    "Best access routes and timing",
    "Contact person cooperation and assistance",
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Completion Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="completionNotes">
              Detailed Notes <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="completionNotes"
              placeholder="Describe your experience marking this property..."
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              rows={8}
              maxLength={maxLength}
              className={
                characterCount > 0 && !isValid ? "border-red-500" : ""
              }
            />
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {isValid ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">Valid notes</span>
                  </>
                ) : characterCount > 0 ? (
                  <>
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-yellow-600">
                      {minLength - characterCount} more characters needed
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground">
                    Minimum {minLength} characters required
                  </span>
                )}
              </div>
              <Badge variant={isValid ? "default" : "secondary"}>
                {characterCount} / {maxLength}
              </Badge>
            </div>

            {characterCount > 0 && characterCount < minLength && (
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Suggestions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <p className="font-semibold text-blue-900 mb-3">
            What to include in your notes:
          </p>
          <ul className="space-y-2">
            {suggestedPoints.map((point, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-blue-800">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-green-900 mb-1">Pro Tips</p>
              <ul className="space-y-1 text-green-800">
                <li>• Be specific and detailed about property features</li>
                <li>• Mention any unique identifiers or landmarks</li>
                <li>• Note any issues that might affect future visits</li>
                <li>• Include time-of-day considerations (traffic, lighting)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}