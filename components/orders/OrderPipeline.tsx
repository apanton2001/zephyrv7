import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export type OrderStatus = 
  | "pending"
  | "processing"
  | "picked"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned";

export interface Order {
  id: string;
  orderNumber: string;
  customer: {
    id: string;
    name: string;
    email?: string;
  };
  status: OrderStatus;
  items: {
    id: string;
    productId: string;
    name: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  createdAt: string;
  updatedAt: string;
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  priority: "low" | "normal" | "high" | "urgent";
  notes?: string;
  assignedTo?: {
    id: string;
    name: string;
  };
  estimatedDelivery?: string;
  trackingNumber?: string;
}

interface OrderPipelineProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  orders: Order[];
  stages?: OrderStatus[];
  onOrderClick?: (order: Order) => void;
  onStatusChange?: (order: Order, newStatus: OrderStatus) => void;
  onAssign?: (order: Order, userId: string) => void;
  onPriorityChange?: (order: Order, newPriority: Order["priority"]) => void;
  staff?: { id: string; name: string }[];
  loading?: boolean;
}

export function OrderPipeline({
  className,
  title = "Order Pipeline",
  description,
  orders,
  stages = ["pending", "processing", "picked", "packed", "shipped", "delivered"],
  onOrderClick,
  onStatusChange,
  onAssign,
  onPriorityChange,
  staff = [],
  loading = false,
  ...props
}: OrderPipelineProps) {
  // Group orders by status
  const ordersByStage = React.useMemo(() => {
    const result: Record<string, Order[]> = {};
    
    // Initialize all stages with empty arrays
    stages.forEach((stage) => {
      result[stage] = [];
    });
    
    // Add orders to their respective stages
    orders.forEach((order) => {
      if (stages.includes(order.status)) {
        result[order.status].push(order);
      }
    });
    
    return result;
  }, [orders, stages]);
  
  // Handle drag and drop
  const [draggingOrderId, setDraggingOrderId] = React.useState<string | null>(null);

  const handleDragStart = (order: Order) => {
    setDraggingOrderId(order.id);
  };

  const handleDragEnd = () => {
    setDraggingOrderId(null);
  };

  const handleDrop = (targetStage: OrderStatus) => {
    if (draggingOrderId && onStatusChange) {
      const order = orders.find((o) => o.id === draggingOrderId);
      if (order && order.status !== targetStage) {
        onStatusChange(order, targetStage);
      }
    }
  };

  // Get the color for priority badge
  const getPriorityColor = (priority: Order["priority"]) => {
    switch (priority) {
      case "low":
        return "bg-blue-50 text-blue-700";
      case "normal":
        return "bg-green-50 text-green-700";
      case "high":
        return "bg-amber-50 text-amber-700";
      case "urgent":
        return "bg-red-50 text-red-700";
      default:
        return "bg-gray-50 text-gray-700";
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Card className={cn("template-order-pipeline h-full", className)} {...props}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-40">
            <div className="template-loading-spinner h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="mt-4 text-sm text-[--template-gray-500]">Loading orders...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {stages.map((stage) => (
              <div 
                key={stage} 
                className="template-pipeline-stage"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDrop(stage);
                }}
              >
                <div className="bg-muted p-3 rounded-t-md border border-border">
                  <h3 className="font-medium text-sm capitalize">{stage}</h3>
                  <div className="text-xs text-muted-foreground mt-1">
                    {ordersByStage[stage]?.length || 0} order{ordersByStage[stage]?.length !== 1 ? 's' : ''}
                  </div>
                </div>
                
                <div className="template-pipeline-orders bg-card border-x border-b border-border rounded-b-md p-2 min-h-[300px]">
                  {ordersByStage[stage]?.length === 0 ? (
                    <div className="flex items-center justify-center h-20 text-sm text-[--template-gray-400]">
                      No orders
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {ordersByStage[stage]?.map((order) => (
                        <div
                          key={order.id}
                          className={cn(
                            "template-pipeline-order p-3 bg-background rounded-md border shadow-sm",
                            draggingOrderId === order.id && "opacity-50",
                            onOrderClick && "cursor-pointer"
                          )}
                          onClick={() => onOrderClick?.(order)}
                          draggable={Boolean(onStatusChange)}
                          onDragStart={() => handleDragStart(order)}
                          onDragEnd={handleDragEnd}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="font-medium text-sm">#{order.orderNumber}</div>
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded-full",
                              getPriorityColor(order.priority)
                            )}>
                              {order.priority.charAt(0).toUpperCase() + order.priority.slice(1)}
                            </span>
                          </div>
                          
                          <div className="text-xs text-[--template-gray-500] mb-2">
                            {order.customer.name} • {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {formatCurrency(order.total)}
                            </span>
                            {order.assignedTo ? (
                              <div className="flex items-center text-xs">
                                <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center mr-1 text-[10px]">
                                  {order.assignedTo.name.charAt(0)}
                                </span>
                                <span className="text-[--template-gray-500]">{order.assignedTo.name}</span>
                              </div>
                            ) : (
                              staff.length > 0 && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // In a real app, you'd show a staff selection dropdown
                                    onAssign?.(order, staff[0].id);
                                  }}
                                >
                                  Assign
                                </Button>
                              )
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
