document.addEventListener('DOMContentLoaded', function() {
  // Example: Action buttons in location management table
  const iconButtons = document.querySelectorAll('.icon-btn');
  iconButtons.forEach(button => {
    button.addEventListener('click', () => {
      const action = button.getAttribute('title');
      const row = button.closest('tr');
      const locationId = row.querySelector('td:first-child').textContent;
      console.log(`${action} clicked for location ${locationId}`);
      // Implement actual edit/delete functionality here
    });
  });
});
