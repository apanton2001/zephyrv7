document.addEventListener('DOMContentLoaded', function() {
    // Sidebar Toggle Functionality
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    const content = document.getElementById('content');
    
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            content.classList.toggle('expanded');
        });
    }
    
    // Document Import Modal Functionality
    const invoiceImportModal = document.getElementById('importInvoiceModal');
    const closeModalBtn = document.querySelector('.close-modal');
    const cancelBtn = document.querySelector('.modal-footer .secondary-btn');
    
    // Function to open modal (this would be attached to import invoice buttons)
    window.openImportModal = function() {
        if (invoiceImportModal) {
            invoiceImportModal.style.display = 'flex';
        }
    };
    
    // Function to close modal
    const closeModal = function() {
        if (invoiceImportModal) {
            invoiceImportModal.style.display = 'none';
        }
    };
    
    // Close modal with the close button
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }
    
    // Close modal with the cancel button
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModal);
    }
    
    // Close modal when clicking outside the modal content
    if (invoiceImportModal) {
        invoiceImportModal.addEventListener('click', function(e) {
            if (e.target === invoiceImportModal) {
                closeModal();
            }
        });
    }
    
    // Document Type Selection in Modal
    const typeCards = document.querySelectorAll('.type-card');
    
    typeCards.forEach(card => {
        card.addEventListener('click', function() {
            // Remove selected class from all cards
            typeCards.forEach(c => c.classList.remove('selected'));
            // Add selected class to clicked card
            this.classList.add('selected');
        });
    });
    
    // Extraction Method Toggle
    const extractionToggle = document.querySelector('.extraction-method input[type="checkbox"]');
    const toggleLabels = document.querySelectorAll('.toggle-labels span');
    
    if (extractionToggle) {
        extractionToggle.addEventListener('change', function() {
            // Toggle active class on labels
            toggleLabels.forEach(label => label.classList.toggle('active'));
        });
    }
    
    // Supplier Selection
    const suppliers = document.querySelectorAll('.supplier');
    
    suppliers.forEach(supplier => {
        supplier.addEventListener('click', function() {
            // Remove selected class from all suppliers
            suppliers.forEach(s => s.classList.remove('selected'));
            // Add selected class to clicked supplier
            this.classList.add('selected');
        });
    });
    
    // File Upload Zone Click Functionality
    const uploadZone = document.querySelector('.upload-zone');
    
    if (uploadZone) {
        uploadZone.addEventListener('click', function() {
            // Trigger file input click (in a real implementation)
            console.log('File browser would open here');
        });
    }
    
    // "Browse" link click in upload zone
    const browseLink = document.querySelector('.browse-link');
    
    if (browseLink) {
        browseLink.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent bubbling to uploadZone click handler
            // Trigger file input click (in a real implementation)
            console.log('File browser would open here from browse link');
        });
    }
    
    // Simulated File Drop Functionality
    if (uploadZone) {
        uploadZone.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.style.borderColor = 'var(--accent-primary)';
            this.style.backgroundColor = 'rgba(74,111,211,0.05)';
        });
        
        uploadZone.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.style.borderColor = 'var(--border-color)';
            this.style.backgroundColor = 'var(--bg-tertiary)';
        });
        
        uploadZone.addEventListener('drop', function(e) {
            e.preventDefault();
            this.style.borderColor = 'var(--border-color)';
            this.style.backgroundColor = 'var(--bg-tertiary)';
            
            // In a real implementation, you would process the dropped files
            console.log('Files would be processed here');
        });
    }
    
    // Simulate Process Document Button
    const processBtn = document.querySelector('.modal-footer .primary-btn');
    
    if (processBtn) {
        processBtn.addEventListener('click', function() {
            // In a real implementation, this would process the document
            console.log('Processing document...');
            
            // Simulate processing delay
            this.textContent = 'Processing...';
            this.disabled = true;
            
            setTimeout(() => {
                closeModal();
                // Reset button state
                this.textContent = 'Process Document';
                this.disabled = false;
                
                // Show success notification (simulated)
                showNotification('Document processed successfully!', 'success');
            }, 2000);
        });
    }
    
    // Reorder Buttons Functionality
    const reorderBtns = document.querySelectorAll('.reorder-btn');
    
    reorderBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const product = this.closest('tr').querySelector('td:nth-child(2)').textContent;
            console.log(`Reordering ${product}...`);
            
            // Simulate reorder process
            this.textContent = 'Processing...';
            this.disabled = true;
            
            setTimeout(() => {
                this.textContent = 'Reordered';
                this.classList.add('success');
                showNotification(`Reorder initiated for ${product}`, 'success');
            }, 1500);
        });
    });
    
    // Notification System
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
            </div>
            <div class="notification-message">${message}</div>
            <button class="notification-close"><i class="fas fa-times"></i></button>
        `;
        
        document.body.appendChild(notification);
        
        // Show notification with animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
        
        // Close button functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', function() {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
    }
    
    // Add notification styling
    const notificationStyles = document.createElement('style');
    notificationStyles.textContent = `
        .notification {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background-color: var(--bg-secondary);
            border-left: 4px solid var(--info);
            border-radius: var(--border-radius);
            padding: 15px;
            display: flex;
            align-items: center;
            box-shadow: var(--shadow-md);
            transform: translateX(120%);
            transition: transform 0.3s ease;
            z-index: 1000;
            max-width: 350px;
        }
        
        .notification.show {
            transform: translateX(0);
        }
        
        .notification.success {
            border-left-color: var(--success);
        }
        
        .notification.warning {
            border-left-color: var(--warning);
        }
        
        .notification.error {
            border-left-color: var(--danger);
        }
        
        .notification-icon {
            margin-right: 12px;
            font-size: 1.2rem;
        }
        
        .notification.success .notification-icon {
            color: var(--success);
        }
        
        .notification.warning .notification-icon {
            color: var(--warning);
        }
        
        .notification.error .notification-icon {
            color: var(--danger);
        }
        
        .notification-message {
            flex-grow: 1;
            font-size: 0.9rem;
        }
        
        .notification-close {
            background: none;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            padding: 5px;
            margin-left: 10px;
            font-size: 0.8rem;
        }
        
        .notification-close:hover {
            color: var(--text-primary);
        }
    `;
    document.head.appendChild(notificationStyles);
    
    // Demo notifications (for testing)
    // setTimeout(() => showNotification('Welcome to Zephyr Warehouse Management System', 'info'), 1000);
});

// Global Utility Functions
function toggleModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        if (modal.style.display === 'flex') {
            modal.style.display = 'none';
        } else {
            modal.style.display = 'flex';
        }
    }
}
