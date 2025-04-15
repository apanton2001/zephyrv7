import type { NextApiRequest, NextApiResponse } from 'next';
import { inventoryController } from '@/controllers/InventoryController';
import { inventoryPresenter } from '@/presenters/InventoryPresenter';
import { InventoryItem } from '@/models/InventoryModel';

type ResponseData = {
  success: boolean;
  data?: any;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handlePost(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ success: false, error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}

/**
 * Handle GET requests
 * GET /api/inventory - Get all inventory items
 * GET /api/inventory?category=Electronics - Get items by category
 * GET /api/inventory?search=keyword - Search items
 */
async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    const { category, search, stockStatus, location, supplier, minQuantity, maxQuantity, sortBy, sortDir } = req.query;
    
    // Prepare filter options
    const filters: any = {};
    if (category) filters.category = category as string;
    if (stockStatus) filters.stockStatus = stockStatus as 'in_stock' | 'low_stock' | 'out_of_stock';
    if (location) filters.location = location as string;
    if (supplier) filters.supplier = supplier as string;
    if (minQuantity) filters.minQuantity = parseInt(minQuantity as string);
    if (maxQuantity) filters.maxQuantity = parseInt(maxQuantity as string);
    
    // Prepare sort options
    const sort = sortBy
      ? {
          field: sortBy as string as keyof import('@/presenters/InventoryPresenter').InventoryItemUI,
          direction: (sortDir as string || 'asc') as 'asc' | 'desc'
        }
      : undefined;
    
    // Handle search query
    if (search) {
      const items = await inventoryPresenter.searchItems(search as string);
      return res.status(200).json({ success: true, data: items });
    }
    
    // Get items with filters and sorting
    const items = await inventoryPresenter.getAllItems(
      Object.keys(filters).length > 0 ? filters : undefined,
      sort
    );
    
    return res.status(200).json({ success: true, data: items });
  } catch (error) {
    console.error('Error handling GET request:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch inventory items' });
  }
}

/**
 * Handle POST requests
 * POST /api/inventory - Create a new inventory item
 */
async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    const itemData = req.body;
    
    // Validate required fields
    const requiredFields = ['sku', 'name', 'category', 'quantity', 'location', 'unitCost', 'unitPrice', 'supplier'];
    for (const field of requiredFields) {
      if (!itemData[field]) {
        return res.status(400).json({ success: false, error: `Missing required field: ${field}` });
      }
    }
    
    // Create new item
    const newItem = await inventoryController.addItem(itemData);
    
    // Transform for UI
    const uiItem = await inventoryPresenter.getItemById(newItem.id);
    
    return res.status(201).json({ success: true, data: uiItem });
  } catch (error: any) {
    console.error('Error handling POST request:', error);
    return res.status(400).json({ success: false, error: error.message || 'Failed to create inventory item' });
  }
}