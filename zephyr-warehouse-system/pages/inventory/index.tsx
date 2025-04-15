import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  ArrowDownIcon, 
  ArrowUpIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { InventoryItemUI } from '@/presenters/InventoryPresenter';

// Mock data for initial development
const mockCategories = ['All Categories', 'Electronics', 'Clothing', 'Books', 'Tools', 'Food'];
const mockLocations = ['All Locations', 'A-12-3', 'A-14-2', 'B-03-1', 'C-05-4', 'D-08-2'];
const mockStockStatuses = [
  { value: '', label: 'All Stock Statuses' },
  { value: 'in_stock', label: 'In Stock' },
  { value: 'low_stock', label: 'Low Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' }
];

const InventoryPage: React.FC = () => {
  const router = useRouter();
  const [inventoryItems, setInventoryItems] = useState<InventoryItemUI[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [selectedLocation, setSelectedLocation] = useState<string>('All Locations');
  const [selectedStockStatus, setSelectedStockStatus] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  
  // Sorting states
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Fetch inventory data
  useEffect(() => {
    const fetchInventory = async () => {
      setLoading(true);
      try {
        // Build query parameters
        const params = new URLSearchParams();
        
        if (searchQuery) {
          params.append('search', searchQuery);
        }
        
        if (selectedCategory !== 'All Categories') {
          params.append('category', selectedCategory);
        }
        
        if (selectedLocation !== 'All Locations') {
          params.append('location', selectedLocation);
        }
        
        if (selectedStockStatus) {
          params.append('stockStatus', selectedStockStatus);
        }
        
        // Add sorting
        params.append('sortBy', sortField);
        params.append('sortDir', sortDirection);
        
        // Fetch data from API
        const response = await fetch(`/api/inventory?${params.toString()}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch inventory data');
        }
        
        setInventoryItems(data.data);
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching inventory data');
        console.error('Error fetching inventory:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInventory();
  }, [searchQuery, selectedCategory, selectedLocation, selectedStockStatus, sortField, sortDirection]);

  // Handle sort toggle
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle item click to view details
  const handleItemClick = (id: string) => {
    router.push(`/inventory/${id}`);
  };

  // Render sort indicator
  const renderSortIndicator = (field: string) => {
    if (sortField !== field) return null;
    
    return sortDirection === 'asc' 
      ? <ArrowUpIcon className="h-4 w-4 ml-1" /> 
      : <ArrowDownIcon className="h-4 w-4 ml-1" />;
  };

  // Get stock status badge class
  const getStockStatusBadge = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'badge badge-success';
      case 'low_stock':
        return 'badge badge-warning';
      case 'out_of_stock':
        return 'badge badge-error';
      default:
        return 'badge';
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <>
      <Head>
        <title>Inventory Management | Zephyr WMS</title>
      </Head>
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Inventory Management</h1>
          <button 
            className="btn btn-primary flex items-center"
            onClick={() => router.push('/inventory/new')}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Item
          </button>
        </div>
        
        {/* Search and Filters */}
        <div className="card p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                className="input pl-10 w-full"
                placeholder="Search inventory..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Filter Toggle */}
            <button 
              className="btn btn-outline flex items-center"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filters
            </button>
            
            {/* Refresh */}
            <button 
              className="btn btn-outline flex items-center"
              onClick={() => {
                setLoading(true);
                // This would trigger the useEffect by changing its dependencies
                // In a real app, we might want to implement a more direct refresh mechanism
                setTimeout(() => setLoading(false), 500);
              }}
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Refresh
            </button>
          </div>
          
          {/* Expanded Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  className="input w-full"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {mockCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Location Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Location
                </label>
                <select
                  className="input w-full"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                >
                  {mockLocations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Stock Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Stock Status
                </label>
                <select
                  className="input w-full"
                  value={selectedStockStatus}
                  onChange={(e) => setSelectedStockStatus(e.target.value)}
                >
                  {mockStockStatuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
        
        {/* Inventory Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="w-16 h-16 border-t-4 border-b-4 border-primary-500 rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="p-4 text-center text-error-DEFAULT">
              <p>{error}</p>
              <button 
                className="btn btn-outline mt-2"
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  // This would trigger the useEffect
                  setTimeout(() => setLoading(false), 500);
                }}
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-dark-600">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('sku')}
                    >
                      <div className="flex items-center">
                        SKU
                        {renderSortIndicator('sku')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center">
                        Name
                        {renderSortIndicator('name')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('category')}
                    >
                      <div className="flex items-center">
                        Category
                        {renderSortIndicator('category')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('quantity')}
                    >
                      <div className="flex items-center">
                        Quantity
                        {renderSortIndicator('quantity')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('location')}
                    >
                      <div className="flex items-center">
                        Location
                        {renderSortIndicator('location')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('stockStatus')}
                    >
                      <div className="flex items-center">
                        Status
                        {renderSortIndicator('stockStatus')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('unitPrice')}
                    >
                      <div className="flex items-center">
                        Price
                        {renderSortIndicator('unitPrice')}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-dark-700 divide-y divide-gray-200 dark:divide-dark-600">
                  {inventoryItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        No inventory items found
                      </td>
                    </tr>
                  ) : (
                    inventoryItems.map((item) => (
                      <tr 
                        key={item.id} 
                        className="hover:bg-gray-50 dark:hover:bg-dark-600 cursor-pointer"
                        onClick={() => handleItemClick(item.id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {item.sku}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {item.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {item.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {item.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={getStockStatusBadge(item.stockStatus)}>
                            {item.stockStatus === 'in_stock' && 'In Stock'}
                            {item.stockStatus === 'low_stock' && 'Low Stock'}
                            {item.stockStatus === 'out_of_stock' && 'Out of Stock'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {formatCurrency(item.unitPrice)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default InventoryPage;