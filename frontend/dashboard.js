const API_URL = 'http://localhost:5000/api';
let currentUser = null;

function verifyAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.replace('/');
        return false;
    }
    return true;
}

// Single DOMContentLoaded handler
document.addEventListener('DOMContentLoaded', async () => {
    if (!verifyAuth()) return;
    
    await fetchCurrentUser();
    loadFriendRequests();
    setupEventListeners();
});

async function fetchCurrentUser() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.replace('/');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/users/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        currentUser = await response.json();
        document.getElementById('welcomeMessage').textContent = `Welcome back, ${currentUser.username}`;
    } catch (error) {
        console.error('Failed to fetch user:', error);
        logout();
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    currentUser = null;
    window.location.replace('/');
}

async function loadFriendRequests() {
    try {
        const response = await fetch(`${API_URL}/users/requests`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const requests = await response.json();
        
        document.getElementById('requestsCount').textContent = `Requests (${requests.length})`;
        const requestsList = document.getElementById('requestsList');
        requestsList.innerHTML = '';

        requests.forEach(request => {
            const requestElement = document.createElement('div');
            requestElement.className = 'request-item';
            requestElement.innerHTML = `
                <p>${request.senderUsername}</p>
                <button class="accept-btn" data-id="${request.senderId}">Accept</button>
                <button class="decline-btn" data-id="${request.senderId}">Decline</button>
            `;
            requestsList.appendChild(requestElement);
        });
    } catch (error) {
        console.error('Failed to load requests:', error);
    }
}

function setupEventListeners() {
    // Search functionality
    document.getElementById('searchBtn').addEventListener('click', searchUsers);
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Delegated event listeners for accept/decline buttons
    document.getElementById('requestsList').addEventListener('click', async (e) => {
        if (e.target.classList.contains('accept-btn')) {
            await handleRequest(e.target.dataset.id, 'accept');
        } else if (e.target.classList.contains('decline-btn')) {
            await handleRequest(e.target.dataset.id, 'decline');
        }
    });
}

async function searchUsers() {
    const searchTerm = document.getElementById('searchInput').value;
    if (!searchTerm) return;

    try {
        const response = await fetch(`${API_URL}/users/search?username=${searchTerm}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const users = await response.json();
        displaySearchResults(users);
    } catch (error) {
        console.error('Search failed:', error);
    }
}

function displaySearchResults(users) {
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = '';

    users.forEach(user => {
        if (user._id === currentUser._id) return; // Don't show current user
        
        const userElement = document.createElement('div');
        userElement.className = 'search-result';
        userElement.innerHTML = `
            <p>${user.username}</p>
            ${currentUser.friends.includes(user._id) ? 
                '<span>Already friends</span>' : 
                `<button class="send-request" data-id="${user._id}">Send Request</button>`
            }
        `;
        resultsContainer.appendChild(userElement);
    });

    // Add event listeners to new buttons
    document.querySelectorAll('.send-request').forEach(btn => {
        btn.addEventListener('click', async () => {
            await sendFriendRequest(btn.dataset.id);
        });
    });
}

async function sendFriendRequest(recipientId) {
    try {
        const response = await fetch(`${API_URL}/users/friend-request`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ recipientId })
        });
        const result = await response.json();
        alert(result.message || 'Request sent');
        searchUsers(); // Refresh search results
    } catch (error) {
        console.error('Failed to send request:', error);
    }
}

async function handleRequest(senderId, action) {
    try {
        const response = await fetch(`${API_URL}/users/${action}-request`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ senderId })
        });
        const result = await response.json();
        alert(result.message || `Request ${action}ed`);
        loadFriendRequests(); // Refresh requests list
    } catch (error) {
        console.error(`Failed to ${action} request:`, error);
    }
}



