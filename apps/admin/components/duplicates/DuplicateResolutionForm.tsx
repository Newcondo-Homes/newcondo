"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";

interface DuplicateResolutionFormProps {
  duplicateId: string;
  onSubmit: (data: ResolutionData) => Promise<void>;
  onCancel: () => void;
}

interface ResolutionData {
  decision: "CONFIRMED_DUPLICATE" | "NOT_DUPLICATE";
  action: "KEEP_ORIGINAL" | "KEEP_DUPLICATE" | "MERGE_PROPERTIES" | "NONE";
  notes: string;
}

export default function DuplicateResolutionForm({
  duplicateId,
  onSubmit,
  onCancel,
}: DuplicateResolutionFormProps) {
  const [decision, setDecision] = useState<"CONFIRMED_DUPLICATE" | "NOT_DUPLICATE" | "">(
    ""
  );
  const [action, setAction] = useState<
    "KEEP_ORIGINAL" | "KEEP_DUPLICATE" | "MERGE_PROPERTIES" | "NONE" | ""
  >("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!decision || !notes.trim()) {
      return;
    }

    if (decision === "CONFIRMED_DUPLICATE" && !action) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        decision,
        action: action || "NONE",
        notes: notes.trim(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = () => {
    if (!decision || !notes.trim()) return false;
    if (decision === "CONFIRMED_DUPLICATE" && !action) return false;
    return true;
  };

  return (
    <div className="space-y-6">
      {/* Decision Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Resolution Decision
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup value={decision} onValueChange={(v) => setDecision(v as any)}>
            <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4 cursor-pointer hover:bg-accent">
              <RadioGroupItem value="CONFIRMED_DUPLICATE" id="duplicate" />
              <Label htmlFor="duplicate" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="font-semibold">Confirmed Duplicate</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  These properties represent the same physical property and one should be
                  removed or merged.
                </p>
              </Label>
            </div>

            <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4 cursor-pointer hover:bg-accent">
              <RadioGroupItem value="NOT_DUPLICATE" id="not-duplicate" />
              <Label htmlFor="not-duplicate" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-semibold">Not a Duplicate</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  These are different properties. The similarity is coincidental or they are
                  different units in the same building.
                </p>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Action Section (only if confirmed duplicate) */}
      {decision === "CONFIRMED_DUPLICATE" && (
        <Card>
          <CardHeader>
            <CardTitle>Recommended Action</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup value={action} onValueChange={(v) => setAction(v as any)}>
              <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4 cursor-pointer hover:bg-accent">
                <RadioGroupItem value="KEEP_ORIGINAL" id="keep-original" />
                <Label htmlFor="keep-original" className="flex-1 cursor-pointer">
                  <span className="font-semibold">Keep Original, Remove Duplicate</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    Delist the duplicate property and notify the owner. The original listing
                    will remain active.
                  </p>
                </Label>
              </div>

              <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4 cursor-pointer hover:bg-accent">
                <RadioGroupItem value="KEEP_DUPLICATE" id="keep-duplicate" />
                <Label htmlFor="keep-duplicate" className="flex-1 cursor-pointer">
                  <span className="font-semibold">Keep Duplicate, Remove Original</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    Delist the original property (if duplicate has better information) and
                    keep the duplicate listing active.
                  </p>
                </Label>
              </div>

              <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4 cursor-pointer hover:bg-accent">
                <RadioGroupItem value="MERGE_PROPERTIES" id="merge" />
                <Label htmlFor="merge" className="flex-1 cursor-pointer">
                  <span className="font-semibold">Merge Properties</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    Combine information from both listings into one comprehensive property
                    listing. Notify both owners.
                  </p>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      {/* Resolution Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Resolution Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Provide detailed notes explaining your decision. This will be visible to property owners and in audit logs."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground mt-2">
            {notes.length} characters (minimum 20 required)
          </p>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={!isValid() || isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Resolution"}
        </Button>
      </div>
    </div>
  );
}