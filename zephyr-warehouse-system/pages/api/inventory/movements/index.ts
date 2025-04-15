import type { NextApiRequest, NextApiResponse } from 'next';
import { inventoryController } from '@/controllers/InventoryController';
import { inventoryPresenter } from '@/presenters/InventoryPresenter';
import { InventoryMovement } from '@/models/InventoryModel';

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
 * Handle GET requests for inventory movements
 * GET /api/inventory/movements?itemId=123 - Get movements for a specific item
 */
async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    const { itemId } = req.query;
    
    if (!itemId || Array.isArray(itemId)) {
      return res.status(400).json({ success: false, error: 'Item ID is required' });
    }
    
    const movements = await inventoryPresenter.getItemMovements(itemId);
    
    return res.status(200).json({ success: true, data: movements });
  } catch (error: any) {
    console.error('Error fetching inventory movements:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to fetch inventory movements' });
  }
}

/**
 * Handle POST requests to record inventory movements
 * POST /api/inventory/movements - Record a new inventory movement
 */
async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    const movementData = req.body;
    
    // Validate required fields
    const requiredFields = ['itemId', 'type', 'quantity', 'reason', 'performedBy'];
    for (const field of requiredFields) {
      if (!movementData[field]) {
        return res.status(400).json({ success: false, error: `Missing required field: ${field}` });
      }
    }
    
    // Validate movement type
    const validTypes = ['in', 'out', 'transfer', 'adjustment'];
    if (!validTypes.includes(movementData.type)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid movement type. Must be one of: ${validTypes.join(', ')}` 
      });
    }
    
    // Validate transfer-specific fields
    if (movementData.type === 'transfer' && (!movementData.fromLocation || !movementData.toLocation)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Transfer movements require fromLocation and toLocation fields' 
      });
    }
    
    // Record the movement
    const movement = await inventoryController.recordMovement(movementData);
    
    // Get the updated item
    const updatedItem = await inventoryPresenter.getItemById(movementData.itemId);
    
    return res.status(201).json({ 
      success: true, 
      data: { 
        movement,
        item: updatedItem
      } 
    });
  } catch (error: any) {
    console.error('Error recording inventory movement:', error);
    return res.status(400).json({ success: false, error: error.message || 'Failed to record inventory movement' });
  }
}