document.addEventListener('DOMContentLoaded', function() {
  const clientSearchInput = document.getElementById('clientSearch');
  const clientTableBody = document.getElementById('clientTableBody');

  clientSearchInput.addEventListener('input', function() {
    const filter = this.value.toLowerCase();
    const rows = clientTableBody.querySelectorAll('tr');

    rows.forEach(row => {
      const companyName = row.cells[1].textContent.toLowerCase();
      const contactName = row.cells[2].textContent.toLowerCase();
      const contactEmail = row.cells[3].textContent.toLowerCase();

      if (companyName.includes(filter) || contactName.includes(filter) || contactEmail.includes(filter)) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  });

  // Action buttons in client list
  const iconButtons = document.querySelectorAll('.icon-btn');
  iconButtons.forEach(button => {
    button.addEventListener('click', () => {
      const action = button.getAttribute('title');
      const row = button.closest('tr');
      const clientId = row.querySelector('td:first-child').textContent;
      console.log(`${action} clicked for client ${clientId}`);
      // Implement actual view/edit functionality here
    });
  });
});
