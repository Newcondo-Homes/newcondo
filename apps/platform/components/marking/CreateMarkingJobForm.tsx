// apps/platform/components/marking/CreateMarkingJobForm.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@newcondo/ui/components/card";
import { Button } from "@newcondo/ui/components/button";
import { Input } from "@newcondo/ui/components/input";
import { Textarea } from "@newcondo/ui/components/textarea";
import { Label } from "@newcondo/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@newcondo/ui/components/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@newcondo/ui/components/select";
import { Calendar } from "@newcondo/ui/components/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@newcondo/ui/components/popover";
import { CalendarIcon, User, Users, Building2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const createMarkingJobSchema = z.object({
  markingOption: z.enum(["self", "someone_i_know", "newcondo_admin", "assign_agents"]),
  contactPersonName: z.string().min(2, "Name must be at least 2 characters"),
  contactPersonPhone: z.string().regex(/^(\+234|0)[789]\d{9}$/, "Invalid Nigerian phone number"),
  accessInstructions: z.string().optional(),
  preferredDate: z.date().optional(),
  urgencyLevel: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
  shareableLink: z.string().optional(),
});

type CreateMarkingJobFormData = z.infer<typeof createMarkingJobSchema>;

interface CreateMarkingJobFormProps {
  propertyId: string;
  propertyTitle: string;
  onSubmit: (data: CreateMarkingJobFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function CreateMarkingJobForm({
  propertyId: _propertyId,
  propertyTitle,
  onSubmit,
  isSubmitting = false,
}: CreateMarkingJobFormProps) {
  const [markingOption, setMarkingOption] = useState<string>("assign_agents");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateMarkingJobFormData>({
    resolver: zodResolver(createMarkingJobSchema),
    defaultValues: {
      markingOption: "assign_agents",
      urgencyLevel: "NORMAL",
    },
  });

  const selectedDate = watch("preferredDate");

  const markingOptions = [
    {
      value: "self",
      title: "Mark it Myself",
      description: "I'll mark the property boundaries myself",
      icon: User,
      fee: "Free",
    },
    {
      value: "someone_i_know",
      title: "Someone I Know",
      description: "Send a link to someone to mark the property",
      icon: Users,
      fee: "Free",
    },
    {
      value: "newcondo_admin",
      title: "Newcondo Admin",
      description: "Let Newcondo team handle the marking",
      icon: Building2,
      fee: "₦25,000",
    },
    {
      value: "assign_agents",
      title: "Assign to Agents",
      description: "Available agents nearby will be notified",
      icon: Users,
      fee: "₦20,000",
    },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Property Info */}
      <Card>
        <CardHeader>
          <CardTitle>Property Marking Request</CardTitle>
          <CardDescription>{propertyTitle}</CardDescription>
        </CardHeader>
      </Card>

      {/* Marking Option Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Choose Marking Option</CardTitle>
          <CardDescription>Select how you want the property to be marked</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={markingOption}
            onValueChange={(value) => {
              setMarkingOption(value);
              setValue("markingOption", value as CreateMarkingJobFormData["markingOption"]);
            }}
            className="space-y-4"
          >
            {markingOptions.map((option) => {
              const Icon = option.icon;
              return (
                <div key={option.value}>
                  <RadioGroupItem
                    value={option.value}
                    id={option.value}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={option.value}
                    className={cn(
                      "flex items-start gap-4 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer",
                      "peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    )}
                  >
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold">{option.title}</p>
                        <span className="text-sm font-medium text-primary">{option.fee}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
          {errors.markingOption && (
            <p className="text-sm text-red-600 mt-2">{errors.markingOption.message}</p>
          )}
        </CardContent>
      </Card>

      {/* Contact Person Details */}
      {(markingOption !== "self") && (
        <Card>
          <CardHeader>
            <CardTitle>Contact Person Details</CardTitle>
            <CardDescription>
              {markingOption === "someone_i_know"
                ? "Person who will receive the marking link"
                : "On-site contact for property access"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contactPersonName">Full Name *</Label>
              <Input
                id="contactPersonName"
                placeholder="Enter full name"
                {...register("contactPersonName")}
              />
              {errors.contactPersonName && (
                <p className="text-sm text-red-600">{errors.contactPersonName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPersonPhone">Phone Number *</Label>
              <Input
                id="contactPersonPhone"
                placeholder="+234 or 0 followed by 10 digits"
                {...register("contactPersonPhone")}
              />
              {errors.contactPersonPhone && (
                <p className="text-sm text-red-600">{errors.contactPersonPhone.message}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Access Instructions */}
      {(markingOption === "assign_agents" || markingOption === "newcondo_admin") && (
        <Card>
          <CardHeader>
            <CardTitle>Access Instructions</CardTitle>
            <CardDescription>Help the agent locate and access the property</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accessInstructions">Special Instructions (Optional)</Label>
              <Textarea
                id="accessInstructions"
                placeholder="e.g., Gate code, landmark details, best time to visit..."
                rows={4}
                {...register("accessInstructions")}
              />
              {errors.accessInstructions && (
                <p className="text-sm text-red-600">{errors.accessInstructions.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferredDate">Preferred Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => setValue("preferredDate", date)}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="urgencyLevel">Urgency Level</Label>
              <Select
                onValueChange={(value) => setValue("urgencyLevel", value as CreateMarkingJobFormData["urgencyLevel"])}
                defaultValue="NORMAL"
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low - No rush</SelectItem>
                  <SelectItem value="NORMAL">Normal - Standard priority</SelectItem>
                  <SelectItem value="HIGH">High - Needs attention soon</SelectItem>
                  <SelectItem value="URGENT">Urgent - ASAP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Important Notice */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm space-y-2">
              <p className="font-semibold text-yellow-900">Important Information</p>
              <ul className="list-disc list-inside space-y-1 text-yellow-800">
                <li>Payment is required before marking job begins</li>
                <li>You have 2-3 days to confirm marking after completion</li>
                <li>Agent receives 25% of the marking fee (₦5,000)</li>
                <li>Ensure contact person is available for property access</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1" disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? "Processing..." : "Continue to Payment"}
        </Button>
      </div>
    </form>
  );
}