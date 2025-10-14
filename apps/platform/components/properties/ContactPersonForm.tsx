"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@newcondo/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@newcondo/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@newcondo/ui/form";
import { Input } from "@newcondo/ui/input";
import { Textarea } from "@newcondo/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@newcondo/ui/select";
import { Calendar } from "@newcondo/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@newcondo/ui/popover";
import { User, Phone, Calendar as CalendarIcon, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@newcondo/ui/lib/utils";

const contactPersonSchema = z.object({
  contactPersonName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters"),
  contactPersonPhone: z
    .string()
    .regex(/^(\+234|0)[789]\d{9}$/, "Please enter a valid Nigerian phone number"),
  accessInstructions: z
    .string()
    .max(500, "Instructions must not exceed 500 characters")
    .optional(),
  preferredDate: z.date({
    required_error: "Please select a preferred date",
  }),
  preferredTimeSlot: z.enum(["MORNING", "AFTERNOON", "EVENING"], {
    required_error: "Please select a time slot",
  }),
  urgencyLevel: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
});

type ContactPersonFormData = z.infer<typeof contactPersonSchema>;

interface ContactPersonFormProps {
  onSubmit: (data: ContactPersonFormData) => void;
  isLoading?: boolean;
  defaultValues?: Partial<ContactPersonFormData>;
}

export function ContactPersonForm({
  onSubmit,
  isLoading = false,
  defaultValues,
}: ContactPersonFormProps) {
  const [date, setDate] = useState<Date | undefined>(defaultValues?.preferredDate);

  const form = useForm<ContactPersonFormData>({
    resolver: zodResolver(contactPersonSchema),
    defaultValues: {
      contactPersonName: defaultValues?.contactPersonName || "",
      contactPersonPhone: defaultValues?.contactPersonPhone || "",
      accessInstructions: defaultValues?.accessInstructions || "",
      preferredDate: defaultValues?.preferredDate,
      preferredTimeSlot: defaultValues?.preferredTimeSlot,
      urgencyLevel: defaultValues?.urgencyLevel || "NORMAL",
    },
  });

  const timeSlots = [
    { value: "MORNING", label: "Morning (8:00 AM - 12:00 PM)" },
    { value: "AFTERNOON", label: "Afternoon (12:00 PM - 4:00 PM)" },
    { value: "EVENING", label: "Evening (4:00 PM - 7:00 PM)" },
  ];

  const urgencyLevels = [
    {
      value: "LOW",
      label: "Low Priority",
      description: "Can be scheduled within 7-14 days",
    },
    {
      value: "NORMAL",
      label: "Normal Priority",
      description: "Preferred within 3-5 days",
    },
    {
      value: "HIGH",
      label: "High Priority",
      description: "Needed within 1-2 days",
    },
    {
      value: "URGENT",
      label: "Urgent",
      description: "Same day or next day",
    },
  ];

  const handleSubmit = (data: ContactPersonFormData) => {
    onSubmit(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Person Details</CardTitle>
        <CardDescription>
          Provide contact information for the person who will grant access to the property
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Contact Person Name */}
            <FormField
              control={form.control}
              name="contactPersonName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Person Name *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="John Doe"
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Full name of the person who will be present at the property
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contact Person Phone */}
            <FormField
              control={form.control}
              name="contactPersonPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Phone Number *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="+234 812 345 6789"
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Phone number the agent can use to coordinate access
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Preferred Date */}
            <FormField
              control={form.control}
              name="preferredDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Preferred Date *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    When would you like the agent to visit?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Preferred Time Slot */}
            <FormField
              control={form.control}
              name="preferredTimeSlot"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Time Slot *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a time slot" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {timeSlots.map((slot) => (
                        <SelectItem key={slot.value} value={slot.value}>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {slot.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the time window when the contact person will be available
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Urgency Level */}
            <FormField
              control={form.control}
              name="urgencyLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {urgencyLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{level.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {level.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Higher priority jobs may incur additional fees
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Access Instructions */}
            <FormField
              control={form.control}
              name="accessInstructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Access Instructions (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="E.g., Use the side gate, call 30 minutes before arrival, ask for the caretaker..."
                      className="min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide any specific instructions to help the agent locate and access the
                    property (max 500 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Important Notice */}
            <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-900">Important</p>
                <p className="text-sm text-blue-700">
                  Please ensure the contact person will be available at the specified time. The
                  agent will have a 3-hour window to complete the marking once they arrive.
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Submitting..." : "Continue to Payment"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}