import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface CellData {
  id: string;
  x: number;
  y: number;
  utilization: number; // 0-100 percentage
  category?: string;
  items?: number;
}

interface WarehouseHeatmapProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  data: CellData[];
  gridSize: { width: number; height: number };
  legend?: boolean;
  interactive?: boolean;
  colorScale?: string[];
  onCellClick?: (cell: CellData) => void;
  footer?: React.ReactNode;
}

export function WarehouseHeatmap({
  className,
  title,
  data,
  gridSize,
  legend = true,
  interactive = true,
  colorScale = ["#ecfdf5", "#d1fae5", "#a7f3d0", "#6ee7b7", "#34d399", "#10b981", "#059669", "#047857", "#065f46", "#064e3b"],
  onCellClick,
  footer,
  ...props
}: WarehouseHeatmapProps) {
  const [selectedCell, setSelectedCell] = React.useState<CellData | null>(null);
  
  // Build the grid for rendering
  const grid = React.useMemo(() => {
    const result: (CellData | null)[][] = Array(gridSize.height)
      .fill(null)
      .map(() => Array(gridSize.width).fill(null));
    
    // Place cells in the grid
    data.forEach((cell) => {
      if (cell.x < gridSize.width && cell.y < gridSize.height) {
        result[cell.y][cell.x] = cell;
      }
    });
    
    return result;
  }, [data, gridSize]);
  
  // Get color based on utilization
  const getColor = (utilization: number) => {
    if (utilization === 0) return colorScale[0];
    const index = Math.min(
      Math.floor((utilization / 100) * (colorScale.length - 1)), 
      colorScale.length - 1
    );
    return colorScale[index];
  };
  
  // Handle cell click
  const handleCellClick = (cell: CellData) => {
    setSelectedCell(cell);
    if (onCellClick) {
      onCellClick(cell);
    }
  };
  
  return (
    <Card 
      className={cn(
        "template-dashboard-card h-full overflow-hidden",
        className
      )} 
      {...props}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="template-heatmap-container">
          <div 
            className="template-heatmap-grid"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${gridSize.width}, 1fr)`,
              gridTemplateRows: `repeat(${gridSize.height}, 1fr)`,
              gap: "2px",
              aspectRatio: `${gridSize.width} / ${gridSize.height}`,
              width: "100%",
              height: "auto"
            }}
          >
            {grid.flat().map((cell, index) => (
              <div
                key={cell?.id || `empty-${index}`}
                className={cn(
                  "template-heatmap-cell",
                  interactive && cell && "cursor-pointer",
                  selectedCell?.id === cell?.id && "template-heatmap-cell-selected border-2 border-primary"
                )}
                style={{
                  backgroundColor: cell ? getColor(cell.utilization) : "#f9fafb",
                  minHeight: "20px",
                }}
                onClick={() => cell && interactive && handleCellClick(cell)}
                aria-label={cell ? `Zone with ${cell.utilization}% utilization` : "Empty zone"}
              />
            ))}
          </div>
          
          {selectedCell && (
            <div className="mt-4 p-3 border rounded-md bg-muted/50">
              <h4 className="text-sm font-medium mb-1">Zone Details</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>Utilization:</div>
                <div className="font-medium">{selectedCell.utilization}%</div>
                {selectedCell.category && (
                  <>
                    <div>Category:</div>
                    <div className="font-medium">{selectedCell.category}</div>
                  </>
                )}
                {selectedCell.items !== undefined && (
                  <>
                    <div>Items:</div>
                    <div className="font-medium">{selectedCell.items}</div>
                  </>
                )}
                <div>Location:</div>
                <div className="font-medium">({selectedCell.x}, {selectedCell.y})</div>
              </div>
            </div>
          )}
          
          {legend && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs text-[--template-gray-500]">Low</div>
              <div className="flex-1 mx-2 h-2 rounded-full" style={{ 
                background: `linear-gradient(to right, ${colorScale.join(", ")})` 
              }} />
              <div className="text-xs text-[--template-gray-500]">High</div>
            </div>
          )}
        </div>
        
        {footer && (
          <div className="mt-4 pt-4 border-t border-[--template-card-border-color]">
            {footer}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
