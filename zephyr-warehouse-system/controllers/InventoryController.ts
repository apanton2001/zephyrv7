import { inventoryModel, InventoryItem, InventoryMovement, StockAlert } from '@/models/InventoryModel';

/**
 * InventoryController class
 * Handles inventory-related operations and coordinates between models and presenters
 */
export class InventoryController {
  /**
   * Get all inventory items
   */
  async getAllItems(): Promise<InventoryItem[]> {
    try {
      return await inventoryModel.getAllItems();
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      throw new Error('Failed to fetch inventory items');
    }
  }

  /**
   * Get inventory item by ID
   */
  async getItemById(id: string): Promise<InventoryItem | null> {
    try {
      const item = await inventoryModel.getItemById(id);
      if (!item) {
        throw new Error(`Item with ID ${id} not found`);
      }
      return item;
    } catch (error) {
      console.error(`Error fetching item with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Search inventory items
   */
  async searchItems(query: string): Promise<InventoryItem[]> {
    try {
      return await inventoryModel.searchItems(query);
    } catch (error) {
      console.error('Error searching inventory items:', error);
      throw new Error('Failed to search inventory items');
    }
  }

  /**
   * Get inventory items by category
   */
  async getItemsByCategory(category: string): Promise<InventoryItem[]> {
    try {
      return await inventoryModel.getItemsByCategory(category);
    } catch (error) {
      console.error(`Error fetching items in category ${category}:`, error);
      throw new Error(`Failed to fetch items in category ${category}`);
    }
  }

  /**
   * Add new inventory item
   */
  async addItem(itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<InventoryItem> {
    try {
      // Validate item data
      this.validateItemData(itemData);
      
      // Add item to inventory
      const newItem = await inventoryModel.addItem(itemData);
      
      // Could trigger additional actions here, like notifications
      
      return newItem;
    } catch (error) {
      console.error('Error adding inventory item:', error);
      throw error;
    }
  }

  /**
   * Update inventory item
   */
  async updateItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> {
    try {
      // Check if item exists
      const existingItem = await inventoryModel.getItemById(id);
      if (!existingItem) {
        throw new Error(`Item with ID ${id} not found`);
      }
      
      // Validate updates
      if (updates.quantity !== undefined && updates.quantity < 0) {
        throw new Error('Quantity cannot be negative');
      }
      
      // Update item
      const updatedItem = await inventoryModel.updateItem(id, updates);
      if (!updatedItem) {
        throw new Error(`Failed to update item with ID ${id}`);
      }
      
      return updatedItem;
    } catch (error) {
      console.error(`Error updating item with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete inventory item
   */
  async deleteItem(id: string): Promise<boolean> {
    try {
      // Check if item exists
      const existingItem = await inventoryModel.getItemById(id);
      if (!existingItem) {
        throw new Error(`Item with ID ${id} not found`);
      }
      
      // Delete item
      const result = await inventoryModel.deleteItem(id);
      if (!result) {
        throw new Error(`Failed to delete item with ID ${id}`);
      }
      
      return true;
    } catch (error) {
      console.error(`Error deleting item with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Record inventory movement (in, out, transfer)
   */
  async recordMovement(movementData: Omit<InventoryMovement, 'id' | 'timestamp'>): Promise<InventoryMovement> {
    try {
      // Validate movement data
      this.validateMovementData(movementData);
      
      // Record movement
      const movement = await inventoryModel.recordMovement(movementData);
      
      // Could trigger additional actions here, like notifications
      
      return movement;
    } catch (error) {
      console.error('Error recording inventory movement:', error);
      throw error;
    }
  }

  /**
   * Get movement history for an item
   */
  async getItemMovements(itemId: string): Promise<InventoryMovement[]> {
    try {
      // Check if item exists
      const existingItem = await inventoryModel.getItemById(itemId);
      if (!existingItem) {
        throw new Error(`Item with ID ${itemId} not found`);
      }
      
      return await inventoryModel.getItemMovements(itemId);
    } catch (error) {
      console.error(`Error fetching movements for item with ID ${itemId}:`, error);
      throw error;
    }
  }

  /**
   * Get all active alerts
   */
  async getActiveAlerts(): Promise<StockAlert[]> {
    try {
      return await inventoryModel.getActiveAlerts();
    } catch (error) {
      console.error('Error fetching active alerts:', error);
      throw new Error('Failed to fetch active alerts');
    }
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string): Promise<StockAlert> {
    try {
      const alert = await inventoryModel.resolveAlert(alertId);
      if (!alert) {
        throw new Error(`Alert with ID ${alertId} not found`);
      }
      return alert;
    } catch (error) {
      console.error(`Error resolving alert with ID ${alertId}:`, error);
      throw error;
    }
  }

  /**
   * Get items that need reordering
   */
  async getItemsToReorder(): Promise<InventoryItem[]> {
    try {
      return await inventoryModel.getItemsToReorder();
    } catch (error) {
      console.error('Error fetching items to reorder:', error);
      throw new Error('Failed to fetch items to reorder');
    }
  }

  /**
   * Calculate inventory value
   */
  async calculateInventoryValue(): Promise<{ totalCost: number; totalRetail: number }> {
    try {
      return await inventoryModel.calculateInventoryValue();
    } catch (error) {
      console.error('Error calculating inventory value:', error);
      throw new Error('Failed to calculate inventory value');
    }
  }

  /**
   * Generate inventory report
   */
  async generateInventoryReport(): Promise<any> {
    try {
      // Get all inventory data
      const items = await inventoryModel.getAllItems();
      const value = await inventoryModel.calculateInventoryValue();
      const itemsToReorder = await inventoryModel.getItemsToReorder();
      const alerts = await inventoryModel.getActiveAlerts();
      
      // Compile report data
      const report = {
        totalItems: items.length,
        totalValue: value,
        itemsByCategory: this.groupItemsByCategory(items),
        lowStockItems: itemsToReorder,
        activeAlerts: alerts.length,
        generatedAt: new Date()
      };
      
      return report;
    } catch (error) {
      console.error('Error generating inventory report:', error);
      throw new Error('Failed to generate inventory report');
    }
  }

  /**
   * Group items by category
   */
  private groupItemsByCategory(items: InventoryItem[]): Record<string, number> {
    const categories: Record<string, number> = {};
    
    items.forEach(item => {
      if (!categories[item.category]) {
        categories[item.category] = 0;
      }
      categories[item.category]++;
    });
    
    return categories;
  }

  /**
   * Validate item data
   */
  private validateItemData(item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>): void {
    if (!item.sku || item.sku.trim() === '') {
      throw new Error('SKU is required');
    }
    
    if (!item.name || item.name.trim() === '') {
      throw new Error('Name is required');
    }
    
    if (item.quantity < 0) {
      throw new Error('Quantity cannot be negative');
    }
    
    if (item.unitCost < 0) {
      throw new Error('Unit cost cannot be negative');
    }
    
    if (item.unitPrice < 0) {
      throw new Error('Unit price cannot be negative');
    }
  }

  /**
   * Validate movement data
   */
  private validateMovementData(movement: Omit<InventoryMovement, 'id' | 'timestamp'>): void {
    if (!movement.itemId) {
      throw new Error('Item ID is required');
    }
    
    if (!movement.type) {
      throw new Error('Movement type is required');
    }
    
    if (movement.quantity <= 0) {
      throw new Error('Quantity must be positive');
    }
    
    if (movement.type === 'transfer' && (!movement.fromLocation || !movement.toLocation)) {
      throw new Error('From and to locations are required for transfers');
    }
  }
}

// Export a singleton instance
export const inventoryController = new InventoryController();