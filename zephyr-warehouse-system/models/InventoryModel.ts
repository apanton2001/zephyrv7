import { v4 as uuidv4 } from 'uuid';

// Types
export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  quantity: number;
  location: string;
  minimumStockLevel: number;
  reorderPoint: number;
  unitCost: number;
  unitPrice: number;
  supplier: string;
  lastRestocked: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryMovement {
  id: string;
  itemId: string;
  type: 'in' | 'out' | 'transfer' | 'adjustment';
  quantity: number;
  fromLocation?: string;
  toLocation?: string;
  reason: string;
  referenceNumber?: string;
  performedBy: string;
  timestamp: Date;
}

export interface StockAlert {
  id: string;
  itemId: string;
  type: 'low_stock' | 'overstock' | 'expiring';
  message: string;
  isResolved: boolean;
  createdAt: Date;
  resolvedAt?: Date;
}

// Mock data for development
const mockInventoryItems: InventoryItem[] = [
  {
    id: uuidv4(),
    sku: 'ELEC-001',
    name: 'Wireless Headphones',
    description: 'Premium noise-cancelling wireless headphones',
    category: 'Electronics',
    quantity: 45,
    location: 'A-12-3',
    minimumStockLevel: 10,
    reorderPoint: 20,
    unitCost: 85.00,
    unitPrice: 149.99,
    supplier: 'AudioTech Inc.',
    lastRestocked: new Date('2025-03-15'),
    createdAt: new Date('2024-12-01'),
    updatedAt: new Date('2025-03-15')
  },
  {
    id: uuidv4(),
    sku: 'ELEC-002',
    name: 'Smartphone Charger',
    description: 'Fast charging USB-C smartphone charger',
    category: 'Electronics',
    quantity: 120,
    location: 'A-14-2',
    minimumStockLevel: 30,
    reorderPoint: 50,
    unitCost: 8.50,
    unitPrice: 19.99,
    supplier: 'TechSupplies Co.',
    lastRestocked: new Date('2025-04-01'),
    createdAt: new Date('2024-11-15'),
    updatedAt: new Date('2025-04-01')
  },
  {
    id: uuidv4(),
    sku: 'CLOTH-001',
    name: 'Men\'s T-Shirt',
    description: 'Cotton crew neck t-shirt, medium size',
    category: 'Clothing',
    quantity: 85,
    location: 'B-03-1',
    minimumStockLevel: 20,
    reorderPoint: 40,
    unitCost: 7.50,
    unitPrice: 24.99,
    supplier: 'FashionWholesale Ltd.',
    lastRestocked: new Date('2025-03-20'),
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-03-20')
  },
  {
    id: uuidv4(),
    sku: 'BOOK-001',
    name: 'Business Strategy Guide',
    description: 'Hardcover business strategy and management book',
    category: 'Books',
    quantity: 18,
    location: 'C-05-4',
    minimumStockLevel: 5,
    reorderPoint: 10,
    unitCost: 12.75,
    unitPrice: 29.99,
    supplier: 'Global Publishing House',
    lastRestocked: new Date('2025-02-10'),
    createdAt: new Date('2024-10-05'),
    updatedAt: new Date('2025-02-10')
  },
  {
    id: uuidv4(),
    sku: 'TOOL-001',
    name: 'Power Drill Set',
    description: 'Cordless power drill with accessories',
    category: 'Tools',
    quantity: 12,
    location: 'D-08-2',
    minimumStockLevel: 3,
    reorderPoint: 5,
    unitCost: 65.00,
    unitPrice: 129.99,
    supplier: 'ToolMasters Inc.',
    lastRestocked: new Date('2025-03-05'),
    createdAt: new Date('2024-09-20'),
    updatedAt: new Date('2025-03-05')
  }
];

/**
 * InventoryModel class
 * Handles all inventory-related data operations and business logic
 */
export class InventoryModel {
  private items: Map<string, InventoryItem>;
  private movements: InventoryMovement[];
  private alerts: StockAlert[];

  constructor() {
    // Initialize with mock data for development
    this.items = new Map();
    mockInventoryItems.forEach(item => {
      this.items.set(item.id, item);
    });
    this.movements = [];
    this.alerts = [];
  }

  /**
   * Get all inventory items
   */
  async getAllItems(): Promise<InventoryItem[]> {
    return Array.from(this.items.values());
  }

  /**
   * Get inventory item by ID
   */
  async getItemById(id: string): Promise<InventoryItem | null> {
    return this.items.get(id) || null;
  }

  /**
   * Get inventory items by category
   */
  async getItemsByCategory(category: string): Promise<InventoryItem[]> {
    return Array.from(this.items.values()).filter(item => item.category === category);
  }

  /**
   * Search inventory items
   */
  async searchItems(query: string): Promise<InventoryItem[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.items.values()).filter(item => 
      item.name.toLowerCase().includes(lowerQuery) || 
      item.sku.toLowerCase().includes(lowerQuery) || 
      item.description.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Add new inventory item
   */
  async addItem(item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<InventoryItem> {
    const now = new Date();
    const newItem: InventoryItem = {
      ...item,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now
    };
    
    this.items.set(newItem.id, newItem);
    
    // Check if we need to create a stock alert
    this.checkStockLevels(newItem);
    
    return newItem;
  }

  /**
   * Update inventory item
   */
  async updateItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem | null> {
    const item = this.items.get(id);
    if (!item) return null;
    
    const updatedItem: InventoryItem = {
      ...item,
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date()
    };
    
    this.items.set(id, updatedItem);
    
    // Check if we need to create a stock alert
    this.checkStockLevels(updatedItem);
    
    return updatedItem;
  }

  /**
   * Delete inventory item
   */
  async deleteItem(id: string): Promise<boolean> {
    return this.items.delete(id);
  }

  /**
   * Record inventory movement (in, out, transfer)
   */
  async recordMovement(movement: Omit<InventoryMovement, 'id' | 'timestamp'>): Promise<InventoryMovement> {
    const item = this.items.get(movement.itemId);
    if (!item) {
      throw new Error(`Item with ID ${movement.itemId} not found`);
    }
    
    const newMovement: InventoryMovement = {
      ...movement,
      id: uuidv4(),
      timestamp: new Date()
    };
    
    // Update item quantity based on movement type
    let newQuantity = item.quantity;
    
    switch (movement.type) {
      case 'in':
        newQuantity += movement.quantity;
        break;
      case 'out':
        if (item.quantity < movement.quantity) {
          throw new Error(`Insufficient stock for item ${item.sku}`);
        }
        newQuantity -= movement.quantity;
        break;
      case 'transfer':
        if (item.quantity < movement.quantity) {
          throw new Error(`Insufficient stock for item ${item.sku}`);
        }
        // Quantity doesn't change for transfers, just the location
        break;
      case 'adjustment':
        newQuantity = movement.quantity; // Direct adjustment to specific quantity
        break;
    }
    
    // Update the item
    const updatedItem: InventoryItem = {
      ...item,
      quantity: newQuantity,
      location: movement.type === 'transfer' ? movement.toLocation || item.location : item.location,
      updatedAt: new Date()
    };
    
    this.items.set(item.id, updatedItem);
    this.movements.push(newMovement);
    
    // Check stock levels after movement
    this.checkStockLevels(updatedItem);
    
    return newMovement;
  }

  /**
   * Get movement history for an item
   */
  async getItemMovements(itemId: string): Promise<InventoryMovement[]> {
    return this.movements.filter(movement => movement.itemId === itemId);
  }

  /**
   * Get all active alerts
   */
  async getActiveAlerts(): Promise<StockAlert[]> {
    return this.alerts.filter(alert => !alert.isResolved);
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string): Promise<StockAlert | null> {
    const alertIndex = this.alerts.findIndex(alert => alert.id === alertId);
    if (alertIndex === -1) return null;
    
    const updatedAlert: StockAlert = {
      ...this.alerts[alertIndex],
      isResolved: true,
      resolvedAt: new Date()
    };
    
    this.alerts[alertIndex] = updatedAlert;
    return updatedAlert;
  }

  /**
   * Get items that need reordering
   */
  async getItemsToReorder(): Promise<InventoryItem[]> {
    return Array.from(this.items.values()).filter(item => 
      item.quantity <= item.reorderPoint
    );
  }

  /**
   * Calculate inventory value
   */
  async calculateInventoryValue(): Promise<{ totalCost: number; totalRetail: number }> {
    let totalCost = 0;
    let totalRetail = 0;
    
    this.items.forEach(item => {
      totalCost += item.unitCost * item.quantity;
      totalRetail += item.unitPrice * item.quantity;
    });
    
    return { totalCost, totalRetail };
  }

  /**
   * Check stock levels and create alerts if necessary
   */
  private checkStockLevels(item: InventoryItem): void {
    // Check for low stock
    if (item.quantity <= item.minimumStockLevel) {
      this.createStockAlert({
        itemId: item.id,
        type: 'low_stock',
        message: `Low stock alert: ${item.name} (${item.sku}) has only ${item.quantity} units remaining, which is below the minimum stock level of ${item.minimumStockLevel}.`,
        isResolved: false,
        createdAt: new Date()
      });
    }
    
    // Could add more checks here (overstock, expiring, etc.)
  }

  /**
   * Create a stock alert
   */
  private createStockAlert(alert: Omit<StockAlert, 'id'>): StockAlert {
    const newAlert: StockAlert = {
      ...alert,
      id: uuidv4()
    };
    
    this.alerts.push(newAlert);
    return newAlert;
  }
}

// Export a singleton instance
export const inventoryModel = new InventoryModel();