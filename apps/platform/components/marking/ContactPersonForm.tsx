// apps/platform/components/marking/ContactPersonForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@newcondo/ui/card";
import { Button } from "@newcondo/ui/button";
import { Input } from "@newcondo/ui/input";
import { Label } from "@newcondo/ui/label";
import { Textarea } from "@newcondo/ui/textarea";
import { User, Phone, Info } from "lucide-react";

const contactPersonSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(/^(\+234|0)[789]\d{9}$/, "Invalid Nigerian phone number"),
  relationship: z.string().optional(),
  alternativePhone: z.string().regex(/^(\+234|0)[789]\d{9}$/, "Invalid phone number").optional().or(z.literal("")),
  additionalNotes: z.string().optional(),
});

type ContactPersonFormData = z.infer<typeof contactPersonSchema>;

interface ContactPersonFormProps {
  onSubmit: (data: ContactPersonFormData) => void;
  defaultValues?: Partial<ContactPersonFormData>;
  isSubmitting?: boolean;
}

export function ContactPersonForm({
  onSubmit,
  defaultValues,
  isSubmitting = false,
}: ContactPersonFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactPersonFormData>({
    resolver: zodResolver(contactPersonSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Contact Person Details
          </CardTitle>
          <CardDescription>
            Provide details of someone who can grant access to the property
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g., John Doe"
              {...register("name")}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Primary Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">
              Phone Number <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                placeholder="+234 or 0 followed by 10 digits"
                className={`pl-9 ${errors.phone ? "border-red-500" : ""}`}
                {...register("phone")}
              />
            </div>
            {errors.phone && (
              <p className="text-sm text-red-600">{errors.phone.message}</p>
            )}
          </div>

          {/* Relationship */}
          <div className="space-y-2">
            <Label htmlFor="relationship">
              Relationship (Optional)
            </Label>
            <Input
              id="relationship"
              placeholder="e.g., Caretaker, Tenant, Neighbor"
              {...register("relationship")}
            />
            <p className="text-xs text-muted-foreground">
              How is this person related to the property?
            </p>
          </div>

          {/* Alternative Phone */}
          <div className="space-y-2">
            <Label htmlFor="alternativePhone">
              Alternative Phone Number (Optional)
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="alternativePhone"
                placeholder="+234 or 0 followed by 10 digits"
                className="pl-9"
                {...register("alternativePhone")}
              />
            </div>
            {errors.alternativePhone && (
              <p className="text-sm text-red-600">{errors.alternativePhone.message}</p>
            )}
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="additionalNotes">
              Additional Notes (Optional)
            </Label>
            <Textarea
              id="additionalNotes"
              placeholder="Any special instructions for contacting this person..."
              rows={3}
              {...register("additionalNotes")}
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Why do we need this?</p>
                <p className="text-blue-800">
                  The marking agent will need to contact this person to gain access
                  to the property. Ensure they are aware and available to assist.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Contact Details"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}