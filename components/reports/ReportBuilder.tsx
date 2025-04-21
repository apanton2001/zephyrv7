import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

// Types for report configuration
export type ReportType = 
  | "inventory"
  | "orders"
  | "sales"
  | "returns"
  | "performance"
  | "custom";

export type ReportTimeframe = 
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "yearly"
  | "custom";

export type ReportFormat = 
  | "table" 
  | "csv" 
  | "pdf" 
  | "excel";

export interface ReportField {
  id: string;
  name: string;
  type: "string" | "number" | "date" | "boolean" | "currency";
  category: string;
  required?: boolean;
}

export interface SavedReport {
  id: string;
  name: string;
  description?: string;
  type: ReportType;
  timeframe: ReportTimeframe;
  fields: string[]; // Array of field IDs
  filters: Record<string, any>;
  createdAt: string;
  createdBy: string;
  scheduled?: {
    frequency: "daily" | "weekly" | "monthly";
    day?: number; // Day of the week (0-6) or day of the month (1-31)
    time: string; // 24-hour format, e.g., "14:30"
    recipients: string[]; // Email addresses
    format: ReportFormat;
  };
}

interface ReportBuilderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  reportTypes?: { id: ReportType; name: string }[];
  timeframes?: { id: ReportTimeframe; name: string }[];
  availableFields?: ReportField[];
  savedReports?: SavedReport[];
  onSaveReport?: (report: Omit<SavedReport, "id" | "createdAt">) => void;
  onRunReport?: (config: {
    type: ReportType;
    timeframe: ReportTimeframe;
    fields: string[];
    filters: Record<string, any>;
    format: ReportFormat;
  }) => void;
  onScheduleReport?: (report: SavedReport) => void;
  onDeleteReport?: (reportId: string) => void;
  onEditReport?: (reportId: string) => void;
}

export function ReportBuilder({
  className,
  title = "Report Builder",
  description = "Create and customize reports",
  reportTypes = [
    { id: "inventory", name: "Inventory Report" },
    { id: "orders", name: "Orders Report" },
    { id: "sales", name: "Sales Report" },
    { id: "returns", name: "Returns Report" },
    { id: "performance", name: "Performance Report" },
    { id: "custom", name: "Custom Report" },
  ],
  timeframes = [
    { id: "daily", name: "Daily" },
    { id: "weekly", name: "Weekly" },
    { id: "monthly", name: "Monthly" },
    { id: "quarterly", name: "Quarterly" },
    { id: "yearly", name: "Yearly" },
    { id: "custom", name: "Custom Range" },
  ],
  availableFields = [],
  savedReports = [],
  onSaveReport,
  onRunReport,
  onScheduleReport,
  onDeleteReport,
  onEditReport,
  ...props
}: ReportBuilderProps) {
  // State for report configuration
  const [reportName, setReportName] = React.useState("");
  const [reportDescription, setReportDescription] = React.useState("");
  const [selectedType, setSelectedType] = React.useState<ReportType>("inventory");
  const [selectedTimeframe, setSelectedTimeframe] = React.useState<ReportTimeframe>("monthly");
  const [selectedFields, setSelectedFields] = React.useState<string[]>([]);
  const [selectedFormat, setSelectedFormat] = React.useState<ReportFormat>("table");
  const [customDateRange, setCustomDateRange] = React.useState({ 
    start: "", 
    end: "" 
  });
  const [activeTab, setActiveTab] = React.useState<"builder" | "saved">("builder");
  const [showAdvancedOptions, setShowAdvancedOptions] = React.useState(false);

  // Filtered fields based on selected report type
  const filteredFields = React.useMemo(() => {
    // In a real implementation, we would filter fields based on the selected report type
    return availableFields;
  }, [availableFields, selectedType]);
  
  // Group fields by category
  const fieldsByCategory = React.useMemo(() => {
    const categories: Record<string, ReportField[]> = {};
    
    filteredFields.forEach((field) => {
      if (!categories[field.category]) {
        categories[field.category] = [];
      }
      categories[field.category].push(field);
    });
    
    return categories;
  }, [filteredFields]);
  
  // Handle field selection toggle
  const toggleField = (fieldId: string) => {
    setSelectedFields((prev) =>
      prev.includes(fieldId)
        ? prev.filter((id) => id !== fieldId)
        : [...prev, fieldId]
    );
  };
  
  // Reset the form
  const resetForm = () => {
    setReportName("");
    setReportDescription("");
    setSelectedType("inventory");
    setSelectedTimeframe("monthly");
    setSelectedFields([]);
    setSelectedFormat("table");
    setCustomDateRange({ start: "", end: "" });
    setShowAdvancedOptions(false);
  };
  
  // Handle save report
  const handleSaveReport = () => {
    if (!reportName) return;
    
    onSaveReport?.({
      name: reportName,
      description: reportDescription,
      type: selectedType,
      timeframe: selectedTimeframe,
      fields: selectedFields,
      filters: {}, // In a real application, this would contain actual filters
      createdBy: "current-user", // In a real application, this would be the current user ID
      scheduled: undefined, // Not scheduled by default
    });
    
    // Optionally reset the form after saving
    resetForm();
  };
  
  // Handle run report
  const handleRunReport = () => {
    onRunReport?.({
      type: selectedType,
      timeframe: selectedTimeframe,
      fields: selectedFields,
      filters: {}, // In a real application, this would contain actual filters
      format: selectedFormat,
    });
  };

  return (
    <Card className={cn("template-report-builder", className)} {...props}>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex space-x-1 bg-muted p-1 rounded-md">
            <Button
              variant={activeTab === "builder" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("builder")}
            >
              Build Report
            </Button>
            <Button
              variant={activeTab === "saved" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("saved")}
            >
              Saved Reports
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activeTab === "builder" ? (
          <div className="space-y-6">
            {/* Report details */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="report-name">
                  Report Name
                </label>
                <Input
                  id="report-name"
                  placeholder="Enter report name"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="report-description">
                  Description (Optional)
                </label>
                <Input
                  id="report-description"
                  placeholder="Enter report description"
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                />
              </div>
            </div>

            {/* Report type and timeframe */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="report-type">
                  Report Type
                </label>
                <Select
                  value={selectedType}
                  onValueChange={(value) => setSelectedType(value as ReportType)}
                >
                  {reportTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="timeframe">
                  Timeframe
                </label>
                <Select
                  value={selectedTimeframe}
                  onValueChange={(value) => setSelectedTimeframe(value as ReportTimeframe)}
                >
                  {timeframes.map((timeframe) => (
                    <option key={timeframe.id} value={timeframe.id}>
                      {timeframe.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Custom date range (shown only if custom timeframe is selected) */}
            {selectedTimeframe === "custom" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="start-date">
                    Start Date
                  </label>
                  <Input
                    id="start-date"
                    type="date"
                    value={customDateRange.start}
                    onChange={(e) => 
                      setCustomDateRange((prev) => ({ ...prev, start: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="end-date">
                    End Date
                  </label>
                  <Input
                    id="end-date"
                    type="date"
                    value={customDateRange.end}
                    onChange={(e) =>
                      setCustomDateRange((prev) => ({ ...prev, end: e.target.value }))
                    }
                  />
                </div>
              </div>
            )}

            {/* Field selection */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Select Fields</h3>
                {selectedFields.length > 0 && (
                  <span className="text-xs text-[--template-gray-500]">
                    {selectedFields.length} field{selectedFields.length !== 1 ? 's' : ''} selected
                  </span>
                )}
              </div>
              
              <div className="border rounded-md divide-y">
                {Object.entries(fieldsByCategory).map(([category, fields]) => (
                  <div key={category} className="template-field-category">
                    <div className="px-4 py-2 bg-muted/50">
                      <h4 className="text-sm font-medium">{category}</h4>
                    </div>
                    <div className="p-2 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {fields.map((field) => (
                        <label 
                          key={field.id}
                          className={cn(
                            "flex items-center space-x-2 p-2 rounded-md cursor-pointer hover:bg-muted/50",
                            selectedFields.includes(field.id) && "bg-muted/50"
                          )}
                        >
                          <input
                            type="checkbox"
                            className="template-checkbox"
                            checked={selectedFields.includes(field.id)}
                            onChange={() => toggleField(field.id)}
                          />
                          <span className="text-sm">
                            {field.name}
                            {field.required && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Advanced options toggle */}
            <div>
              <Button
                variant="ghost"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="p-0 h-auto text-sm text-[--template-gray-500] hover:text-[--template-gray-900]"
              >
                {showAdvancedOptions ? "Hide" : "Show"} Advanced Options
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={cn(
                    "ml-1 h-4 w-4 transition-transform",
                    showAdvancedOptions && "transform rotate-180"
                  )}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </Button>
              
              {showAdvancedOptions && (
                <div className="mt-4 space-y-4">
                  {/* Export format selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="format">
                      Export Format
                    </label>
                    <Select
                      value={selectedFormat}
                      onValueChange={(value) => setSelectedFormat(value as ReportFormat)}
                    >
                      <option value="table">Table (view online)</option>
                      <option value="csv">CSV</option>
                      <option value="pdf">PDF</option>
                      <option value="excel">Excel</option>
                    </Select>
                  </div>
                  
                  {/* In a real implementation, we would have more advanced options here */}
                  <div className="p-4 border rounded-md bg-muted/50">
                    <h4 className="text-sm font-medium mb-2">Scheduling (coming soon)</h4>
                    <p className="text-sm text-[--template-gray-500]">
                      In the future, you'll be able to schedule reports to be generated and sent automatically.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            {/* Saved reports list */}
            {savedReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 text-[--template-gray-400]"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                </div>
                <h3 className="text-lg font-medium">No saved reports</h3>
                <p className="text-sm text-[--template-gray-500] mt-2 max-w-md">
                  You haven't saved any reports yet. Build a report and click "Save Report" to save it for later use.
                </p>
                <Button
                  className="mt-4"
                  onClick={() => setActiveTab("builder")}
                >
                  Create Report
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {savedReports.map((report) => (
                  <div
                    key={report.id}
                    className="border rounded-md p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{report.name}</h3>
                        {report.description && (
                          <p className="text-sm text-[--template-gray-500] mt-1">
                            {report.description}
                          </p>
                        )}
                        <div className="flex items-center mt-2 space-x-2">
                          <span className="text-xs px-2 py-1 bg-muted rounded-full">
                            {reportTypes.find((t) => t.id === report.type)?.name || report.type}
                          </span>
                          <span className="text-xs px-2 py-1 bg-muted rounded-full">
                            {timeframes.find((t) => t.id === report.timeframe)?.name || report.timeframe}
                          </span>
                          {report.scheduled && (
                            <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                              Scheduled
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onRunReport?.({
                            type: report.type,
                            timeframe: report.timeframe,
                            fields: report.fields,
                            filters: report.filters,
                            format: "table",
                          })}
                        >
                          Run
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditReport?.(report.id)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => onDeleteReport?.(report.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      {activeTab === "builder" && (
        <CardFooter className="flex flex-col-reverse sm:flex-row justify-between sm:space-x-2 space-y-2 sm:space-y-0 pt-6">
          <div className="flex space-x-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={resetForm}
              className="flex-1 sm:flex-none"
            >
              Reset
            </Button>
            <Button
              variant="default"
              onClick={handleSaveReport}
              disabled={!reportName || selectedFields.length === 0}
              className="flex-1 sm:flex-none"
            >
              Save Report
            </Button>
          </div>
          <Button
            variant="default"
            onClick={handleRunReport}
            disabled={selectedFields.length === 0}
            className="w-full sm:w-auto"
          >
            Generate Report
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
