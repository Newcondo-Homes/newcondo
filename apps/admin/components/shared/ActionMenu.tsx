"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, LucideIcon } from "lucide-react";

interface Action<T> {
  label: string;
  icon?: LucideIcon;
  onClick: (item: T) => void;
  variant?: "default" | "destructive";
  separator?: boolean;
}

interface ActionMenuProps<T> {
  item: T;
  actions: Action<T>[];
}

export default function ActionMenu<T>({ item, actions }: ActionMenuProps<T>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {actions.map((action, index) => (
          <div key={index}>
            <DropdownMenuItem
              onClick={() => action.onClick(item)}
              className={
                action.variant === "destructive" ? "text-red-600" : ""
              }
            >
              {action.icon && <action.icon className="mr-2 h-4 w-4" />}
              {action.label}
            </DropdownMenuItem>
            {action.separator && <DropdownMenuSeparator />}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}