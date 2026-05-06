// Admin Dashboard JavaScript

let allTickets = [];
let filteredTickets = [];
let currentFilter = 'all';

// DOM Elements
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const filterBtns = document.querySelectorAll('.filter-btn');
const ticketsTableBody = document.getElementById('tickets-tbody');
const ticketsCount = document.getElementById('tickets-count');
const refreshBtn = document.getElementById('refresh-btn');

// Stats elements
const totalCount = document.getElementById('total-count');
const openCount = document.getElementById('open-count');
const inProgressCount = document.getElementById('in-progress-count');
const resolvedCount = document.getElementById('resolved-count');

// Modal elements
const ticketModal = document.getElementById('ticket-modal');
const ticketModalClose = document.getElementById('modal-close');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');

const statusModal = document.getElementById('status-modal');
const statusModalClose = document.getElementById('status-modal-close');
const statusTicketId = document.getElementById('status-ticket-id');
const statusCancel = document.getElementById('status-cancel');
const statusUpdate = document.getElementById('status-update');

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    loadTickets();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    // Filter buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.dataset.filter;
            setActiveFilter(filter);
            applyFilters();
        });
    });

    // Refresh button
    refreshBtn.addEventListener('click', loadTickets);

    // Modal close buttons
    ticketModalClose.addEventListener('click', () => ticketModal.style.display = 'none');
    statusModalClose.addEventListener('click', () => statusModal.style.display = 'none');

    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === ticketModal) {
            ticketModal.style.display = 'none';
        }
        if (e.target === statusModal) {
            statusModal.style.display = 'none';
        }
    });

    // Status update modal buttons
    statusCancel.addEventListener('click', () => statusModal.style.display = 'none');
    statusUpdate.addEventListener('click', handleStatusUpdate);
}

// Load tickets from API
async function loadTickets() {
    try {
        showLoadingState();

        const response = await fetch('/api/tickets');
        const data = await response.json();

        if (response.ok) {
            allTickets = data.tickets || [];
            filteredTickets = [...allTickets];
            updateStats(data);
            renderTickets(filteredTickets);
        } else {
            showError('Failed to load tickets');
        }
    } catch (error) {
        console.error('Error loading tickets:', error);
        showError('Error loading tickets. Please try again.');
    }
}

// Update statistics
function updateStats(data) {
    totalCount.textContent = data.total || 0;
    openCount.textContent = data.open || 0;

    // Calculate other stats
    const inProgress = allTickets.filter(ticket => ticket.status === 'in-progress').length;
    const resolved = allTickets.filter(ticket => ticket.status === 'resolved').length;

    inProgressCount.textContent = inProgress;
    resolvedCount.textContent = resolved;
}

// Render tickets table
function renderTickets(tickets) {
    if (tickets.length === 0) {
        ticketsTableBody.innerHTML = `
            <tr>
                <td colspan="10" class="loading-row">No tickets found</td>
            </tr>
        `;
        ticketsCount.textContent = 'No tickets found';
        return;
    }

    const html = tickets.map(ticket => `
        <tr>
            <td><code>${ticket.id}</code></td>
            <td>${ticket.name}</td>
            <td>${ticket.email}</td>
            <td>${ticket.department || 'N/A'}</td>
            <td>${ticket.category}</td>
            <td><span class="priority-badge ${ticket.priority}">${ticket.priority}</span></td>
            <td>${ticket.subject}</td>
            <td><span class="status-badge ${ticket.status}">${formatStatus(ticket.status)}</span></td>
            <td>${formatDate(ticket.created_at)}</td>
            <td>
                <button class="action-btn view" onclick="viewTicket('${ticket.id}')">View</button>
                <button class="action-btn update" onclick="updateTicketStatus('${ticket.id}')">Update</button>
            </td>
        </tr>
    `).join('');

    ticketsTableBody.innerHTML = html;
    ticketsCount.textContent = `Showing ${tickets.length} ticket${tickets.length !== 1 ? 's' : ''}`;
}

// Handle search
function handleSearch() {
    const query = searchInput.value.toLowerCase().trim();

    if (!query) {
        filteredTickets = [...allTickets];
    } else {
        filteredTickets = allTickets.filter(ticket =>
            ticket.id.toLowerCase().includes(query) ||
            ticket.name.toLowerCase().includes(query) ||
            ticket.email.toLowerCase().includes(query) ||
            ticket.subject.toLowerCase().includes(query) ||
            ticket.description.toLowerCase().includes(query)
        );
    }

    applyFilters();
}

// Set active filter
function setActiveFilter(filter) {
    currentFilter = filter;
    filterBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
}

// Apply filters
function applyFilters() {
    let tickets = [...filteredTickets];

    if (currentFilter !== 'all') {
        tickets = tickets.filter(ticket => ticket.status === currentFilter);
    }

    renderTickets(tickets);
}

// View ticket details
async function viewTicket(ticketId) {
    try {
        const response = await fetch(`/api/tickets/${ticketId}`);
        const ticket = await response.json();

        if (response.ok) {
            showTicketModal(ticket);
        } else {
            alert('Failed to load ticket details');
        }
    } catch (error) {
        console.error('Error loading ticket:', error);
        alert('Error loading ticket details');
    }
}

// Show ticket modal
function showTicketModal(ticket) {
    modalTitle.textContent = `Ticket ${ticket.id}`;
    modalBody.innerHTML = `
        <div class="ticket-detail">
            <div class="detail-row">
                <div class="detail-label">Ticket ID</div>
                <div class="detail-value"><code>${ticket.id}</code></div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Name</div>
                <div class="detail-value">${ticket.name}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Email</div>
                <div class="detail-value">${ticket.email}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Department</div>
                <div class="detail-value">${ticket.department || 'N/A'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Category</div>
                <div class="detail-value">${ticket.category}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Priority</div>
                <div class="detail-value"><span class="priority-badge ${ticket.priority}">${ticket.priority}</span></div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Status</div>
                <div class="detail-value"><span class="status-badge ${ticket.status}">${formatStatus(ticket.status)}</span></div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Created</div>
                <div class="detail-value">${formatDate(ticket.created_at)}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Updated</div>
                <div class="detail-value">${formatDate(ticket.updated_at)}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Subject</div>
                <div class="detail-value">${ticket.subject}</div>
            </div>
            <div class="detail-description">
                <div class="detail-label">Description</div>
                <div class="detail-value">${ticket.description}</div>
            </div>
        </div>
    `;

    ticketModal.style.display = 'block';
}

// Update ticket status
function updateTicketStatus(ticketId) {
    statusTicketId.textContent = ticketId;

    // Reset radio buttons
    const radios = document.querySelectorAll('input[name="status"]');
    radios.forEach(radio => radio.checked = false);

    statusModal.style.display = 'block';
}

// Handle status update
async function handleStatusUpdate() {
    const ticketId = statusTicketId.textContent;
    const selectedStatus = document.querySelector('input[name="status"]:checked');

    if (!selectedStatus) {
        alert('Please select a status');
        return;
    }

    try {
        const response = await fetch(`/api/tickets/${ticketId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: selectedStatus.value })
        });

        const result = await response.json();

        if (response.ok) {
            statusModal.style.display = 'none';
            loadTickets(); // Refresh the data
            alert('Ticket status updated successfully!');
        } else {
            alert('Failed to update ticket status');
        }
    } catch (error) {
        console.error('Error updating ticket:', error);
        alert('Error updating ticket status');
    }
}

// Utility functions
function formatStatus(status) {
    const statusMap = {
        'open': 'Open',
        'in-progress': 'In Progress',
        'resolved': 'Resolved',
        'closed': 'Closed'
    };
    return statusMap[status] || status;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function showLoadingState() {
    ticketsTableBody.innerHTML = `
        <tr>
            <td colspan="10" class="loading-row">Loading tickets...</td>
        </tr>
    `;
    ticketsCount.textContent = 'Loading tickets...';
}

function showError(message) {
    ticketsTableBody.innerHTML = `
        <tr>
            <td colspan="10" class="loading-row">${message}</td>
        </tr>
    `;
    ticketsCount.textContent = message;
}