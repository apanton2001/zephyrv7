import * as React from "react";
import { cn } from "@/lib/utils";

import {
  Card as ShadcnCard,
  CardHeader as ShadcnCardHeader,
  CardFooter as ShadcnCardFooter,
  CardTitle as ShadcnCardTitle,
  CardDescription as ShadcnCardDescription,
  CardContent as ShadcnCardContent,
} from "@/components/ui/card";

// Enhanced card that combines Shadcn UI structure with template styling

interface TemplateCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "dashboard" | "gradient" | "hover";
  status?: "success" | "warning" | "error" | "info";
  borderPosition?: "left" | "top" | "right" | "bottom" | "none";
}

const TemplateCard = React.forwardRef<HTMLDivElement, TemplateCardProps>(
  ({ className, variant = "default", status, borderPosition = "none", ...props }, ref) => {
    // Build variant classes
    const variantClasses = {
      default: "template-card",
      dashboard: "template-dashboard-card",
      gradient: "template-gradient-bg",
      hover: "template-card template-card-hover",
    };

    // Build status classes
    const statusClasses = {
      success: "border-[--template-success]",
      warning: "border-[--template-warning]",
      error: "border-[--template-error]",
      info: "border-[--template-info]",
    };

    // Build border position classes
    const borderClasses = {
      left: "border-l-4",
      top: "border-t-4",
      right: "border-r-4",
      bottom: "border-b-4",
    };

    return (
      <ShadcnCard
        ref={ref}
        className={cn(
          variantClasses[variant],
          status ? statusClasses[status] : null,
          borderPosition !== "none" ? borderClasses[borderPosition] : null,
          className
        )}
        {...props}
      />
    );
  }
);
TemplateCard.displayName = "TemplateCard";

const TemplateCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <ShadcnCardHeader
    ref={ref}
    className={cn("template-card-header", className)}
    {...props}
  />
));
TemplateCardHeader.displayName = "TemplateCardHeader";

const TemplateCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement> & { as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" }
>(({ className, as: Comp = "h3", ...props }, ref) => {
  return React.createElement(
    Comp,
    {
      ref,
      className: cn(
        "text-xl font-bold tracking-tight text-[--template-gray-900]",
        className
      ),
      ...props,
    }
  );
});
TemplateCardTitle.displayName = "TemplateCardTitle";

const TemplateCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <ShadcnCardDescription
    ref={ref}
    className={cn("text-[--template-gray-500]", className)}
    {...props}
  />
));
TemplateCardDescription.displayName = "TemplateCardDescription";

const TemplateCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <ShadcnCardContent ref={ref} className={cn(className)} {...props} />
));
TemplateCardContent.displayName = "TemplateCardContent";

const TemplateCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <ShadcnCardFooter
    ref={ref}
    className={cn("border-t border-[--template-card-border-color] mt-4 pt-4", className)}
    {...props}
  />
));
TemplateCardFooter.displayName = "TemplateCardFooter";

// Specialized dashboard metric card
interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  format?: "currency" | "percentage" | "number";
}

const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  ({ 
    className, 
    title, 
    value, 
    change, 
    icon,
    trend = "neutral",
    format = "number",
    ...props 
  }, ref) => {
    // Format the value based on the specified format
    const formattedValue = React.useMemo(() => {
      if (typeof value === 'string') return value;
      
      switch (format) {
        case 'currency':
          return `$${value.toLocaleString()}`;
        case 'percentage':
          return `${value}%`;
        case 'number':
        default:
          return value.toLocaleString();
      }
    }, [value, format]);

    // Determine trend indicator and class
    const trendClass = trend === 'up' ? 'template-trend-up' : trend === 'down' ? 'template-trend-down' : '';
    
    const trendIndicator = trend === 'neutral' ? '' : (
      <span className={cn("template-trend", trendClass)}>
        {trend === 'up' ? '↑' : '↓'} {Math.abs(change || 0)}%
      </span>
    );

    return (
      <TemplateCard
        ref={ref}
        variant="dashboard"
        className={cn(className)}
        {...props}
      >
        <TemplateCardHeader>
          <div className="flex justify-between items-center">
            <TemplateCardTitle>{title}</TemplateCardTitle>
            {icon && <div className="text-[--template-gray-500]">{icon}</div>}
          </div>
        </TemplateCardHeader>
        <TemplateCardContent>
          <div className="template-metric">{formattedValue}</div>
          {(change !== undefined) && trendIndicator}
        </TemplateCardContent>
      </TemplateCard>
    );
  }
);
MetricCard.displayName = "MetricCard";

export {
  TemplateCard,
  TemplateCardHeader,
  TemplateCardFooter,
  TemplateCardTitle,
  TemplateCardDescription,
  TemplateCardContent,
  MetricCard,
};
