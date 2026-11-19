import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-5 pointer-events-auto bg-background", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "space-y-5",
        caption: "flex justify-center relative items-center h-12 mb-2",
        caption_label: "text-base font-bold text-foreground tracking-tight",
        nav: "flex items-center gap-1",
        nav_button: cn(
          "inline-flex items-center justify-center",
          "h-9 w-9 rounded-full",
          "bg-muted/50 hover:bg-primary hover:text-primary-foreground",
          "text-muted-foreground hover:text-primary-foreground",
          "border-0 shadow-sm",
          "transition-all duration-200 ease-out",
          "hover:scale-110 active:scale-95"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse",
        head_row: "flex mb-2",
        head_cell: cn(
          "w-11 h-9 flex items-center justify-center",
          "text-xs font-semibold uppercase tracking-wider",
          "text-muted-foreground/70"
        ),
        row: "flex w-full",
        cell: cn(
          "relative h-11 w-11 text-center text-sm p-0.5",
          "focus-within:relative focus-within:z-20",
          "[&:has([aria-selected].day-range-end)]:rounded-r-xl",
          "[&:has([aria-selected].day-outside)]:bg-primary/10",
          "[&:has([aria-selected])]:bg-primary/10",
          "first:[&:has([aria-selected])]:rounded-l-xl",
          "last:[&:has([aria-selected])]:rounded-r-xl"
        ),
        day: cn(
          "h-10 w-10 p-0 font-medium rounded-xl",
          "flex items-center justify-center",
          "text-foreground/80 hover:text-foreground",
          "transition-all duration-200 ease-out",
          "hover:bg-accent hover:scale-110",
          "focus:outline-hidden focus:ring-2 focus:ring-primary/30 focus:ring-offset-1",
          "aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected: cn(
          "bg-gradient-to-br from-primary to-primary/80",
          "text-primary-foreground font-bold",
          "shadow-lg shadow-primary/30",
          "hover:from-primary hover:to-primary/80",
          "hover:text-primary-foreground hover:scale-110",
          "focus:from-primary focus:to-primary/80",
          "focus:text-primary-foreground"
        ),
        day_today: cn(
          "bg-accent/80 text-accent-foreground font-bold",
          "ring-2 ring-primary/40 ring-offset-1 ring-offset-background"
        ),
        day_outside: cn(
          "day-outside text-muted-foreground/30",
          "aria-selected:bg-primary/10 aria-selected:text-muted-foreground/50"
        ),
        day_disabled: "text-muted-foreground/20 cursor-not-allowed hover:bg-transparent hover:scale-100",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-5 w-5" strokeWidth={2.5} />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
