document.addEventListener('DOMContentLoaded', function() {
    // Inventory Value Chart
    const inventoryChartCanvas = document.getElementById('inventoryValueChart');
    
    if (inventoryChartCanvas) {
        // Sample data for categories
        const categories = ['Tools', 'Electronics', 'Safety Gear', 'Packaging', 'Office Supplies'];
        const values = [142500, 98750, 76300, 45289, 65000]; // in dollars
        
        // Create the chart
        const inventoryChart = new Chart(inventoryChartCanvas, {
            type: 'bar',
            data: {
                labels: categories,
                datasets: [{
                    label: 'Inventory Value by Category',
                    data: values,
                    backgroundColor: [
                        'rgba(74, 111, 211, 0.7)',
                        'rgba(122, 74, 211, 0.7)',
                        'rgba(249, 177, 21, 0.7)',
                        'rgba(46, 184, 92, 0.7)',
                        'rgba(51, 153, 255, 0.7)'
                    ],
                    borderColor: [
                        'rgba(74, 111, 211, 1)',
                        'rgba(122, 74, 211, 1)',
                        'rgba(249, 177, 21, 1)',
                        'rgba(46, 184, 92, 1)',
                        'rgba(51, 153, 255, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        },
                        ticks: {
                            color: 'rgba(179, 179, 179, 0.8)', // --text-secondary
                            callback: function(value) {
                                if (value >= 1000) {
                                    return '$' + value / 1000 + 'k';
                                }
                                return '$' + value;
                            }
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        },
                        ticks: {
                            color: 'rgba(179, 179, 179, 0.8)' // --text-secondary
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(30, 30, 30, 0.9)', // --bg-secondary
                        titleColor: 'rgba(255, 255, 255, 0.9)', // --text-primary
                        bodyColor: 'rgba(179, 179, 179, 0.9)', // --text-secondary
                        borderColor: 'rgba(51, 51, 51, 0.9)', // --border-color
                        borderWidth: 1,
                        cornerRadius: 6, // --border-radius
                        displayColors: true,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label = '';
                                }
                                if (context.parsed.y !== null) {
                                    label += new Intl.NumberFormat('en-US', { 
                                        style: 'currency', 
                                        currency: 'USD',
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0
                                    }).format(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Add Product Modal Functionality
    const addProductModal = document.getElementById('addProductModal');
    const addProductBtn = document.querySelector('.add-btn');
    const closeAddProductModalBtn = document.querySelector('#addProductModal .close-modal');
    const cancelAddProductBtn = document.querySelector('#addProductModal .secondary-btn');
    
    // Function to open add product modal
    window.openAddProductModal = function() {
        if (addProductModal) {
            addProductModal.style.display = 'flex';
        }
    };
    
    // Function to close add product modal
    const closeAddProductModal = function() {
        if (addProductModal) {
            addProductModal.style.display = 'none';
        }
    };
    
    // Close modal with close button
    if (closeAddProductModalBtn) {
        closeAddProductModalBtn.addEventListener('click', closeAddProductModal);
    }
    
    // Close modal with cancel button
    if (cancelAddProductBtn) {
        cancelAddProductBtn.addEventListener('click', closeAddProductModal);
    }
    
    // Close modal when clicking outside the modal content
    if (addProductModal) {
        addProductModal.addEventListener('click', function(e) {
            if (e.target === addProductModal) {
                closeAddProductModal();
            }
        });
    }
    
    // Add Product Submit Functionality
    const addProductSubmitBtn = document.querySelector('#addProductModal .primary-btn');
    
    if (addProductSubmitBtn) {
        addProductSubmitBtn.addEventListener('click', function() {
            // Get form values (in a real application, this would be validated)
            const productName = document.getElementById('productName').value;
            const productCategory = document.getElementById('productCategory').value;
            const productPrice = document.getElementById('productPrice').value;
            const productQuantity = document.getElementById('productQuantity').value;
            const productLocation = document.getElementById('productLocation').value;
            
            // Validate (simple validation for demo)
            if (!productName) {
                alert('Please enter a product name');
                return;
            }
            
            // In a real app, you would send this data to a server
            console.log('Adding product:', {
                name: productName,
                category: productCategory,
                price: productPrice,
                quantity: productQuantity,
                location: productLocation
            });
            
            // Simulate success
            const showNotification = window.showNotification || function(){};
            showNotification(`Product "${productName}" added successfully`, 'success');
            
            // Close modal
            closeAddProductModal();
            
            // Reset form (in a real application)
            document.getElementById('productName').value = '';
            document.getElementById('productCategory').value = '';
            document.getElementById('productPrice').value = '';
            document.getElementById('productQuantity').value = '';
            document.getElementById('productLocation').value = '';
        });
    }
    
    // Inventory Table Controls
    
    // Filter Button Toggle
    const filterBtn = document.querySelector('.filter-btn');
    const filterMenu = document.querySelector('.filter-menu');
    
    if (filterBtn && filterMenu) {
        let filterMenuVisible = false;
        
        filterBtn.addEventListener('click', function() {
            filterMenuVisible = !filterMenuVisible;
            filterMenu.style.display = filterMenuVisible ? 'block' : 'none';
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (filterMenuVisible && !filterBtn.contains(e.target) && !filterMenu.contains(e.target)) {
                filterMenuVisible = false;
                filterMenu.style.display = 'none';
            }
        });
        
        // Filter Apply Button
        const applyFilterBtn = document.querySelector('.filter-actions .primary-btn');
        if (applyFilterBtn) {
            applyFilterBtn.addEventListener('click', function() {
                // Get filter values
                const categoryFilter = document.querySelector('.filter-group:nth-child(1) select').value;
                const statusFilter = document.querySelector('.filter-group:nth-child(2) select').value;
                const locationFilter = document.querySelector('.filter-group:nth-child(3) select').value;
                
                // In a real app, you would apply these filters to the table
                console.log('Applying filters:', {
                    category: categoryFilter,
                    status: statusFilter,
                    location: locationFilter
                });
                
                // For demo purposes, show a notification
                const showNotification = window.showNotification || function(){};
                showNotification('Filters applied', 'info');
                
                // Close filter menu
                filterMenuVisible = false;
                filterMenu.style.display = 'none';
            });
        }
        
        // Filter Reset Button
        const resetFilterBtn = document.querySelector('.filter-actions .secondary-btn');
        if (resetFilterBtn) {
            resetFilterBtn.addEventListener('click', function() {
                // Reset filter selects
                document.querySelectorAll('.filter-group select').forEach(select => {
                    select.value = '';
                });
                
                // In a real app, you would reset the table
                console.log('Filters reset');
                
                // For demo purposes, show a notification
                const showNotification = window.showNotification || function(){};
                showNotification('Filters reset', 'info');
            });
        }
    }
    
    // View Selector (List/Grid Toggle)
    const viewButtons = document.querySelectorAll('.view-selector button');
    
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            viewButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // In a real application, you would toggle the table view
            console.log('View changed to:', this.querySelector('i').classList.contains('fa-list') ? 'list' : 'grid');
        });
    });
    
    // Table Select All Checkbox
    const selectAllCheckbox = document.querySelector('.select-all');
    const itemCheckboxes = document.querySelectorAll('.select-item');
    
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            const isChecked = this.checked;
            itemCheckboxes.forEach(checkbox => {
                checkbox.checked = isChecked;
            });
        });
    }
    
    // Update select all when individual items change
    itemCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const allChecked = [...itemCheckboxes].every(cb => cb.checked);
            const someChecked = [...itemCheckboxes].some(cb => cb.checked);
            
            if (allChecked) {
                selectAllCheckbox.checked = true;
                selectAllCheckbox.indeterminate = false;
            } else if (someChecked) {
                selectAllCheckbox.checked = false;
                selectAllCheckbox.indeterminate = true;
            } else {
                selectAllCheckbox.checked = false;
                selectAllCheckbox.indeterminate = false;
            }
        });
    });
    
    // Pagination
    const paginationButtons = document.querySelectorAll('.pagination-btn');
    
    paginationButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (this.classList.contains('active') || this.querySelector('i')) return;
            
            paginationButtons.forEach(btn => {
                if (!btn.querySelector('i')) {
                    btn.classList.remove('active');
                }
            });
            
            this.classList.add('active');
            
            // In a real app, you would load the corresponding page of data
            console.log('Page changed to:', this.textContent);
            
            // Update showing info
            document.querySelector('.showing-info').textContent = `Showing ${(parseInt(this.textContent) - 1) * 5 + 1}-${parseInt(this.textContent) * 5} of 248 products`;
        });
    });
    
    // Action Buttons in Table
    const actionButtons = document.querySelectorAll('.action-icons .icon-btn');
    
    actionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const action = this.getAttribute('title');
            const row = this.closest('tr');
            const productName = row.querySelector('.product-name').textContent;
            
            // In a real app, you would perform the corresponding action
            console.log(`${action} for ${productName}`);
            
            // For demo purposes
            if (action === 'Edit Product') {
                // Simulate opening edit modal
                openAddProductModal();
                document.getElementById('productName').value = productName;
                
                // Set product SKU as not auto-generated
                const skuInput = document.getElementById('productSKU');
                skuInput.value = row.querySelector('td:nth-child(2)').textContent;
                skuInput.disabled = false;
                
                // Update modal title and button
                document.querySelector('#addProductModal .modal-header h3').textContent = 'Edit Product';
                document.querySelector('#addProductModal .primary-btn').textContent = 'Save Changes';
            }
            else if (action === 'View Details') {
                // For demo, we'll just show a notification
                const showNotification = window.showNotification || function(){};
                showNotification(`Viewing details for ${productName}`, 'info');
            }
        });
    });
    
    // Image Upload Area
    const imageUploadArea = document.querySelector('.image-upload-area');
    const browseLink = document.querySelector('.image-upload-area .browse-link');
    
    if (imageUploadArea) {
        imageUploadArea.addEventListener('click', function() {
            // In a real app, you would trigger a file input
            console.log('Opening file browser for image upload');
        });
    }
    
    if (browseLink) {
        browseLink.addEventListener('click', function(e) {
            e.stopPropagation();
            // In a real app, you would trigger a file input
            console.log('Opening file browser from browse link');
        });
    }
});

// Global function to expose the showNotification function from main.js
function showNotification(message, type) {
    if (window.showNotification) {
        window.showNotification(message, type);
    } else {
        console.log(`${type.toUpperCase()}: ${message}`);
    }
}
