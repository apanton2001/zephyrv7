document.addEventListener('DOMContentLoaded', function() {
  // Action buttons in task list
  const iconButtons = document.querySelectorAll('.icon-btn');
  iconButtons.forEach(button => {
    button.addEventListener('click', () => {
      const action = button.getAttribute('title');
      const row = button.closest('tr');
      const taskId = row.querySelector('td:first-child').textContent;
      console.log(`${action} clicked for task ${taskId}`);
      // Implement actual edit/complete/view functionality here
    });
  });
});
