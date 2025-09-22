

// This script should only run on dashboard pages, not login page
document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard JavaScript loaded');
    
    // Add any dashboard-specific JavaScript here
    // For example: post management, editing, etc.
    
    // Search functionality (if needed)
    const searchBtn = document.querySelector('.searchBtn');
    const searchBar = document.querySelector('.searchBar');
    
    if (searchBtn && searchBar) {
        searchBtn.addEventListener('click', () => {
            searchBar.classList.toggle('open');
        });
    }
});