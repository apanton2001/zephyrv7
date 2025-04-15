import { fetchAllCarrierRates, generateShippingLabel } from './carrier-integration.js';

document.addEventListener('DOMContentLoaded', function() {
  // Highlight current active stage
  const stages = document.querySelectorAll('.status-stages .stage');
  stages.forEach((stage, index) => {
    stage.addEventListener('click', () => {
      stages.forEach(s => s.classList.remove('active'));
      stage.classList.add('active');
      console.log(`Order status changed to: ${stage.textContent}`);
    });
  });

  // Action buttons in order list
  const iconButtons = document.querySelectorAll('.icon-btn');
  iconButtons.forEach(button => {
    button.addEventListener('click', () => {
      const action = button.getAttribute('title');
      const row = button.closest('tr');
      const orderId = row.querySelector('td:first-child').textContent;
      console.log(`${action} clicked for order ${orderId}`);
      // Implement actual view/edit functionality here
    });
  });

  // Carrier rate fetching and selection UI
  const orderRows = document.querySelectorAll('.orders-table tbody tr');
  orderRows.forEach(row => {
    const orderId = row.querySelector('td:first-child').textContent;
    const rateCell = document.createElement('td');
    rateCell.textContent = 'Loading rates...';
    row.appendChild(rateCell);

    // Mock order data for rate fetching
    const order = {
      id: orderId,
      weight: 5, // example weight in kg
      dimensions: { length: 10, width: 10, height: 10 },
      destination: '12345' // example postal code
    };

    fetchAllCarrierRates(order).then(rates => {
      rateCell.innerHTML = '';
      rates.forEach(rate => {
        const rateOption = document.createElement('div');
        rateOption.className = 'rate-option';
        rateOption.textContent = `${rate.carrier} - ${rate.service}: $${rate.cost.toFixed(2)} (${rate.estimatedDays} days)`;
        rateOption.style.cursor = 'pointer';
        rateOption.addEventListener('click', () => {
          alert(`Selected ${rate.carrier} ${rate.service} for order ${orderId}`);
          // Generate label (mock)
          const label = generateShippingLabel(order, rate.carrier);
          console.log(`Generated label: ${label}`);
        });
        rateCell.appendChild(rateOption);
      });
    }).catch(err => {
      rateCell.textContent = 'Error loading rates';
      console.error(err);
    });
  });
});
