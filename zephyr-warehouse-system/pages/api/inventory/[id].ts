import type { NextApiRequest, NextApiResponse } from 'next';
import { inventoryController } from '@/controllers/InventoryController';
import { inventoryPresenter } from '@/presenters/InventoryPresenter';

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
    const { id } = req.query;
    
    if (!id || Array.isArray(id)) {
      return res.status(400).json({ success: false, error: 'Invalid item ID' });
    }
    
    switch (req.method) {
      case 'GET':
        return await handleGet(id, req, res);
      case 'PUT':
        return await handlePut(id, req, res);
      case 'DELETE':
        return await handleDelete(id, req, res);
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ success: false, error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}

/**
 * Handle GET request for a specific inventory item
 * GET /api/inventory/[id]
 */
async function handleGet(
  id: string,
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    const item = await inventoryPresenter.getItemById(id);
    
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    
    return res.status(200).json({ success: true, data: item });
  } catch (error: any) {
    console.error(`Error fetching item with ID ${id}:`, error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to fetch item' });
  }
}

/**
 * Handle PUT request to update a specific inventory item
 * PUT /api/inventory/[id]
 */
async function handlePut(
  id: string,
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    // Check if item exists
    const existingItem = await inventoryController.getItemById(id);
    
    if (!existingItem) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    
    // Update item
    const updatedItem = await inventoryController.updateItem(id, req.body);
    
    // Transform for UI
    const uiItem = await inventoryPresenter.getItemById(id);
    
    return res.status(200).json({ success: true, data: uiItem });
  } catch (error: any) {
    console.error(`Error updating item with ID ${id}:`, error);
    return res.status(400).json({ success: false, error: error.message || 'Failed to update item' });
  }
}

/**
 * Handle DELETE request to remove a specific inventory item
 * DELETE /api/inventory/[id]
 */
async function handleDelete(
  id: string,
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    // Check if item exists
    const existingItem = await inventoryController.getItemById(id);
    
    if (!existingItem) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    
    // Delete item
    await inventoryController.deleteItem(id);
    
    return res.status(200).json({ success: true, data: { id } });
  } catch (error: any) {
    console.error(`Error deleting item with ID ${id}:`, error);
    return res.status(400).json({ success: false, error: error.message || 'Failed to delete item' });
  }
}