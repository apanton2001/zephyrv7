import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  location: string;
  status: "in-stock" | "low-stock" | "out-of-stock" | "reserved";
  lastUpdated: string;
  thresholds?: {
    low: number;
    critical: number;
  };
}

interface InventoryGridProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  items: InventoryItem[];
  categories?: string[];
  locations?: string[];
  onItemClick?: (item: InventoryItem) => void;
  onFilterChange?: (filters: Record<string, any>) => void;
  onSearch?: (term: string) => void;
  batchOperationsEnabled?: boolean;
  onBatchOperation?: (operation: string, selectedItems: string[]) => void;
  loading?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
}

export function InventoryGrid({
  className,
  title,
  description,
  items,
  categories = [],
  locations = [],
  onItemClick,
  onFilterChange,
  onSearch,
  batchOperationsEnabled = false,
  onBatchOperation,
  loading = false,
  pagination,
  ...props
}: InventoryGridProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("");
  const [locationFilter, setLocationFilter] = React.useState<string>("");
  const [statusFilter, setStatusFilter] = React.useState<string>("");
  const [selectedItems, setSelectedItems] = React.useState<string[]>([]);
  const [sortConfig, setSortConfig] = React.useState<{
    key: keyof InventoryItem;
    direction: "asc" | "desc";
  } | null>(null);

  // Handle search input
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  // Handle filter changes
  const handleFilterChange = (type: string, value: string) => {
    switch (type) {
      case "category":
        setCategoryFilter(value);
        break;
      case "location":
        setLocationFilter(value);
        break;
      case "status":
        setStatusFilter(value);
        break;
    }

    if (onFilterChange) {
      onFilterChange({
        category: type === "category" ? value : categoryFilter,
        location: type === "location" ? value : locationFilter,
        status: type === "status" ? value : statusFilter,
      });
    }
  };

  // Handle sorting
  const requestSort = (key: keyof InventoryItem) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Get sorted items
  const sortedItems = React.useMemo(() => {
    let itemsToSort = [...items];
    if (sortConfig !== null) {
      itemsToSort.sort((a, b) => {
        const key = sortConfig.key;
        const direction = sortConfig.direction;
        
        // TypeScript safe comparison - convert to string for comparison if needed
        const aValue = String(a[key] || '');
        const bValue = String(b[key] || '');
        
        if (aValue < bValue) {
          return direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return itemsToSort;
  }, [items, sortConfig]);

  // Handle item selection
  const handleItemSelect = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id)
        ? prev.filter((itemId) => itemId !== id)
        : [...prev, id]
    );
  };

  // Handle batch operations
  const handleBatchOperation = (operation: string) => {
    if (onBatchOperation) {
      onBatchOperation(operation, selectedItems);
    }
    // Reset selection after operation
    setSelectedItems([]);
  };

  // Get the status color styling
  const getStatusStyles = (status: InventoryItem["status"]) => {
    switch (status) {
      case "in-stock":
        return "text-green-500 bg-green-50";
      case "low-stock":
        return "text-amber-500 bg-amber-50";
      case "out-of-stock":
        return "text-red-500 bg-red-50";
      case "reserved":
        return "text-blue-500 bg-blue-50";
      default:
        return "text-gray-500 bg-gray-50";
    }
  };

  return (
    <Card
      className={cn("template-inventory-grid h-full overflow-hidden", className)}
      {...props}
    >
      <CardHeader>
        <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="w-full sm:w-auto max-w-sm">
            <Input
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={handleSearch}
              className="template-search-input"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="w-full sm:w-auto">
            <Select
              value={categoryFilter}
              onValueChange={(value) => handleFilterChange("category", value)}
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-full sm:w-auto">
            <Select
              value={locationFilter}
              onValueChange={(value) => handleFilterChange("location", value)}
            >
              <option value="">All Locations</option>
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-full sm:w-auto">
            <Select
              value={statusFilter}
              onValueChange={(value) => handleFilterChange("status", value)}
            >
              <option value="">All Statuses</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
              <option value="reserved">Reserved</option>
            </Select>
          </div>
        </div>

        {/* Batch Operations */}
        {batchOperationsEnabled && selectedItems.length > 0 && (
          <div className="flex items-center justify-between bg-muted p-2 rounded-md mb-4">
            <div className="text-sm">
              <span className="font-medium">{selectedItems.length}</span> items
              selected
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBatchOperation("move")}
              >
                Move Items
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBatchOperation("adjust")}
              >
                Adjust Quantity
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBatchOperation("label")}
              >
                Print Labels
              </Button>
            </div>
          </div>
        )}

        {/* Inventory Table */}
        <div className="overflow-x-auto">
          <table className="template-table w-full">
            <thead>
              <tr className="template-table-header">
                {batchOperationsEnabled && (
                  <th className="w-10">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems(items.map((item) => item.id));
                        } else {
                          setSelectedItems([]);
                        }
                      }}
                      checked={
                        selectedItems.length > 0 &&
                        selectedItems.length === items.length
                      }
                      className="template-checkbox"
                    />
                  </th>
                )}
                <th
                  className="cursor-pointer"
                  onClick={() => requestSort("sku")}
                >
                  SKU
                  {sortConfig && sortConfig.key === "sku" && (
                    <span>{sortConfig.direction === "asc" ? " ↑" : " ↓"}</span>
                  )}
                </th>
                <th
                  className="cursor-pointer"
                  onClick={() => requestSort("name")}
                >
                  Name
                  {sortConfig && sortConfig.key === "name" && (
                    <span>{sortConfig.direction === "asc" ? " ↑" : " ↓"}</span>
                  )}
                </th>
                <th
                  className="cursor-pointer"
                  onClick={() => requestSort("category")}
                >
                  Category
                  {sortConfig && sortConfig.key === "category" && (
                    <span>{sortConfig.direction === "asc" ? " ↑" : " ↓"}</span>
                  )}
                </th>
                <th
                  className="cursor-pointer"
                  onClick={() => requestSort("quantity")}
                >
                  Quantity
                  {sortConfig && sortConfig.key === "quantity" && (
                    <span>{sortConfig.direction === "asc" ? " ↑" : " ↓"}</span>
                  )}
                </th>
                <th
                  className="cursor-pointer"
                  onClick={() => requestSort("location")}
                >
                  Location
                  {sortConfig && sortConfig.key === "location" && (
                    <span>{sortConfig.direction === "asc" ? " ↑" : " ↓"}</span>
                  )}
                </th>
                <th
                  className="cursor-pointer"
                  onClick={() => requestSort("status")}
                >
                  Status
                  {sortConfig && sortConfig.key === "status" && (
                    <span>{sortConfig.direction === "asc" ? " ↑" : " ↓"}</span>
                  )}
                </th>
                <th
                  className="cursor-pointer"
                  onClick={() => requestSort("lastUpdated")}
                >
                  Last Updated
                  {sortConfig && sortConfig.key === "lastUpdated" && (
                    <span>{sortConfig.direction === "asc" ? " ↑" : " ↓"}</span>
                  )}
                </th>
                <th className="w-16">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={batchOperationsEnabled ? 9 : 8}
                    className="text-center py-8"
                  >
                    <div className="flex justify-center">
                      <div className="template-loading-spinner h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                    <div className="mt-2 text-sm text-[--template-gray-500]">
                      Loading inventory data...
                    </div>
                  </td>
                </tr>
              ) : sortedItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={batchOperationsEnabled ? 9 : 8}
                    className="text-center py-8"
                  >
                    <div className="text-[--template-gray-500]">
                      No inventory items found.
                    </div>
                  </td>
                </tr>
              ) : (
                sortedItems.map((item) => (
                  <tr
                    key={item.id}
                    className={cn(
                      "template-table-row",
                      onItemClick && "cursor-pointer"
                    )}
                    onClick={() => onItemClick && onItemClick(item)}
                  >
                    {batchOperationsEnabled && (
                      <td
                        onClick={(e) => {
                          e.stopPropagation();
                          handleItemSelect(item.id);
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={() => {}}
                          className="template-checkbox"
                        />
                      </td>
                    )}
                    <td>{item.sku}</td>
                    <td className="font-medium">{item.name}</td>
                    <td>{item.category}</td>
                    <td className="text-right">{item.quantity}</td>
                    <td>{item.location}</td>
                    <td>
                      <span
                        className={cn(
                          "inline-block px-2 py-1 rounded-full text-xs font-medium",
                          getStatusStyles(item.status)
                        )}
                      >
                        {item.status
                          .split("-")
                          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(" ")}
                      </span>
                    </td>
                    <td>{item.lastUpdated}</td>
                    <td>
                      <div className="flex items-center space-x-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <span className="sr-only">Edit</span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4"
                          >
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                            <path d="m15 5 4 4"/>
                          </svg>
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <span className="sr-only">More</span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4"
                          >
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="19" cy="12" r="1" />
                            <circle cx="5" cy="12" r="1" />
                          </svg>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-[--template-gray-500]">
              Showing{" "}
              <span className="font-medium">
                {(pagination.page - 1) * pagination.pageSize + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(
                  pagination.page * pagination.pageSize,
                  pagination.total
                )}
              </span>{" "}
              of <span className="font-medium">{pagination.total}</span> items
            </div>
            <div className="flex space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                disabled={
                  pagination.page * pagination.pageSize >= pagination.total
                }
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
