import { inventoryController } from '@/controllers/InventoryController';
import { InventoryItem, InventoryMovement, StockAlert } from '@/models/InventoryModel';

// Types for UI-specific data structures
export interface InventoryItemUI extends Omit<InventoryItem, 'createdAt' | 'updatedAt' | 'lastRestocked'> {
  createdAt: string;
  updatedAt: string;
  lastRestocked: string;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  valueTotal: number;
}

export interface InventoryMovementUI extends Omit<InventoryMovement, 'timestamp'> {
  timestamp: string;
  itemName?: string;
  itemSku?: string;
}

export interface StockAlertUI extends Omit<StockAlert, 'createdAt' | 'resolvedAt'> {
  createdAt: string;
  resolvedAt?: string;
  itemName?: string;
  itemSku?: string;
  severity: 'low' | 'medium' | 'high';
}

export interface InventoryFilterOptions {
  category?: string;
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';
  location?: string;
  minQuantity?: number;
  maxQuantity?: number;
  supplier?: string;
}

export interface InventorySortOptions {
  field: keyof InventoryItemUI;
  direction: 'asc' | 'desc';
}

export interface InventoryReportUI {
  totalItems: number;
  totalValue: {
    totalCost: number;
    totalRetail: number;
    profit: number;
    profitMargin: string;
  };
  itemsByCategory: {
    category: string;
    count: number;
    percentage: string;
  }[];
  lowStockItems: InventoryItemUI[];
  activeAlerts: number;
  generatedAt: string;
}

/**
 * InventoryPresenter class
 * Prepares inventory data for UI consumption and handles UI-specific logic
 */
export class InventoryPresenter {
  /**
   * Get all inventory items formatted for UI
   */
  async getAllItems(
    filters?: InventoryFilterOptions,
    sort?: InventorySortOptions
  ): Promise<InventoryItemUI[]> {
    try {
      // Get items from controller
      let items = await inventoryController.getAllItems();
      
      // Apply filters if provided
      if (filters) {
        items = this.filterItems(items, filters);
      }
      
      // Transform items for UI
      let uiItems = items.map(item => this.transformItemForUI(item));
      
      // Apply sorting if provided
      if (sort) {
        uiItems = this.sortItems(uiItems, sort);
      }
      
      return uiItems;
    } catch (error) {
      console.error('Error in presenter while getting inventory items:', error);
      throw error;
    }
  }

  /**
   * Get inventory item by ID formatted for UI
   */
  async getItemById(id: string): Promise<InventoryItemUI | null> {
    try {
      const item = await inventoryController.getItemById(id);
      if (!item) return null;
      
      return this.transformItemForUI(item);
    } catch (error) {
      console.error(`Error in presenter while getting item with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Search inventory items and format for UI
   */
  async searchItems(query: string): Promise<InventoryItemUI[]> {
    try {
      const items = await inventoryController.searchItems(query);
      return items.map(item => this.transformItemForUI(item));
    } catch (error) {
      console.error('Error in presenter while searching inventory items:', error);
      throw error;
    }
  }

  /**
   * Get inventory items by category formatted for UI
   */
  async getItemsByCategory(category: string): Promise<InventoryItemUI[]> {
    try {
      const items = await inventoryController.getItemsByCategory(category);
      return items.map(item => this.transformItemForUI(item));
    } catch (error) {
      console.error(`Error in presenter while getting items in category ${category}:`, error);
      throw error;
    }
  }

  /**
   * Get unique categories for filter options
   */
  async getCategories(): Promise<string[]> {
    try {
      const items = await inventoryController.getAllItems();
      const categories = new Set<string>();
      
      items.forEach(item => {
        categories.add(item.category);
      });
      
      return Array.from(categories).sort();
    } catch (error) {
      console.error('Error in presenter while getting categories:', error);
      throw error;
    }
  }

  /**
   * Get unique locations for filter options
   */
  async getLocations(): Promise<string[]> {
    try {
      const items = await inventoryController.getAllItems();
      const locations = new Set<string>();
      
      items.forEach(item => {
        locations.add(item.location);
      });
      
      return Array.from(locations).sort();
    } catch (error) {
      console.error('Error in presenter while getting locations:', error);
      throw error;
    }
  }

  /**
   * Get unique suppliers for filter options
   */
  async getSuppliers(): Promise<string[]> {
    try {
      const items = await inventoryController.getAllItems();
      const suppliers = new Set<string>();
      
      items.forEach(item => {
        suppliers.add(item.supplier);
      });
      
      return Array.from(suppliers).sort();
    } catch (error) {
      console.error('Error in presenter while getting suppliers:', error);
      throw error;
    }
  }

  /**
   * Get movement history for an item formatted for UI
   */
  async getItemMovements(itemId: string): Promise<InventoryMovementUI[]> {
    try {
      const movements = await inventoryController.getItemMovements(itemId);
      const item = await inventoryController.getItemById(itemId);
      
      return movements.map(movement => ({
        ...movement,
        timestamp: this.formatDate(movement.timestamp),
        itemName: item?.name,
        itemSku: item?.sku
      }));
    } catch (error) {
      console.error(`Error in presenter while getting movements for item with ID ${itemId}:`, error);
      throw error;
    }
  }

  /**
   * Get all active alerts formatted for UI
   */
  async getActiveAlerts(): Promise<StockAlertUI[]> {
    try {
      const alerts = await inventoryController.getActiveAlerts();
      const uiAlerts: StockAlertUI[] = [];
      
      for (const alert of alerts) {
        const item = await inventoryController.getItemById(alert.itemId);
        
        uiAlerts.push({
          ...alert,
          createdAt: this.formatDate(alert.createdAt),
          resolvedAt: alert.resolvedAt ? this.formatDate(alert.resolvedAt) : undefined,
          itemName: item?.name,
          itemSku: item?.sku,
          severity: this.getAlertSeverity(alert)
        });
      }
      
      return uiAlerts;
    } catch (error) {
      console.error('Error in presenter while getting active alerts:', error);
      throw error;
    }
  }

  /**
   * Get items that need reordering formatted for UI
   */
  async getItemsToReorder(): Promise<InventoryItemUI[]> {
    try {
      const items = await inventoryController.getItemsToReorder();
      return items.map(item => this.transformItemForUI(item));
    } catch (error) {
      console.error('Error in presenter while getting items to reorder:', error);
      throw error;
    }
  }

  /**
   * Generate inventory report formatted for UI
   */
  async generateInventoryReport(): Promise<InventoryReportUI> {
    try {
      const report = await inventoryController.generateInventoryReport();
      const lowStockItems = await inventoryController.getItemsToReorder();
      
      // Calculate profit and profit margin
      const profit = report.totalValue.totalRetail - report.totalValue.totalCost;
      const profitMargin = (profit / report.totalValue.totalRetail * 100).toFixed(2) + '%';
      
      // Format categories for UI
      const itemsByCategory = Object.entries(report.itemsByCategory).map(([category, count]) => ({
        category,
        count: count as number,
        percentage: (((count as number) / report.totalItems) * 100).toFixed(2) + '%'
      }));
      
      return {
        totalItems: report.totalItems,
        totalValue: {
          totalCost: report.totalValue.totalCost,
          totalRetail: report.totalValue.totalRetail,
          profit,
          profitMargin
        },
        itemsByCategory,
        lowStockItems: lowStockItems.map(item => this.transformItemForUI(item)),
        activeAlerts: report.activeAlerts,
        generatedAt: this.formatDate(report.generatedAt)
      };
    } catch (error) {
      console.error('Error in presenter while generating inventory report:', error);
      throw error;
    }
  }

  /**
   * Transform inventory item for UI consumption
   */
  private transformItemForUI(item: InventoryItem): InventoryItemUI {
    // Determine stock status
    let stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
    
    if (item.quantity <= 0) {
      stockStatus = 'out_of_stock';
    } else if (item.quantity <= item.minimumStockLevel) {
      stockStatus = 'low_stock';
    } else {
      stockStatus = 'in_stock';
    }
    
    // Calculate total value
    const valueTotal = item.quantity * item.unitCost;
    
    return {
      ...item,
      createdAt: this.formatDate(item.createdAt),
      updatedAt: this.formatDate(item.updatedAt),
      lastRestocked: this.formatDate(item.lastRestocked),
      stockStatus,
      valueTotal
    };
  }

  /**
   * Filter items based on provided filter options
   */
  private filterItems(items: InventoryItem[], filters: InventoryFilterOptions): InventoryItem[] {
    return items.filter(item => {
      // Filter by category
      if (filters.category && item.category !== filters.category) {
        return false;
      }
      
      // Filter by stock status
      if (filters.stockStatus) {
        if (filters.stockStatus === 'out_of_stock' && item.quantity > 0) {
          return false;
        }
        if (filters.stockStatus === 'low_stock' && (item.quantity <= 0 || item.quantity > item.minimumStockLevel)) {
          return false;
        }
        if (filters.stockStatus === 'in_stock' && (item.quantity <= item.minimumStockLevel)) {
          return false;
        }
      }
      
      // Filter by location
      if (filters.location && item.location !== filters.location) {
        return false;
      }
      
      // Filter by quantity range
      if (filters.minQuantity !== undefined && item.quantity < filters.minQuantity) {
        return false;
      }
      if (filters.maxQuantity !== undefined && item.quantity > filters.maxQuantity) {
        return false;
      }
      
      // Filter by supplier
      if (filters.supplier && item.supplier !== filters.supplier) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Sort items based on provided sort options
   */
  private sortItems(items: InventoryItemUI[], sort: InventorySortOptions): InventoryItemUI[] {
    return [...items].sort((a, b) => {
      const aValue = a[sort.field];
      const bValue = b[sort.field];
      
      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sort.direction === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      // Handle number comparison
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sort.direction === 'asc' 
          ? aValue - bValue 
          : bValue - aValue;
      }
      
      return 0;
    });
  }

  /**
   * Format date for UI display
   */
  private formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Determine alert severity based on alert type and other factors
   */
  private getAlertSeverity(alert: StockAlert): 'low' | 'medium' | 'high' {
    if (alert.type === 'low_stock') {
      // Could check quantity vs minimum stock level to determine severity
      return 'medium';
    } else if (alert.type === 'overstock') {
      return 'low';
    } else if (alert.type === 'expiring') {
      // Could check how soon the item is expiring
      return 'high';
    }
    
    return 'medium';
  }
}

// Export a singleton instance
export const inventoryPresenter = new InventoryPresenter();