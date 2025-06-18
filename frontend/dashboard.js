const API_URL = 'http://localhost:5000/api';
let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!verifyAuth()) return;

  await fetchCurrentUser();
  await loadFriendRequests();
  setupEventListeners();
});

function verifyAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.replace('/');
    return false;
  }
  return true;
}

async function fetchCurrentUser() {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch(`${API_URL}/users/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    currentUser = await response.json();
    document.getElementById('welcomeMessage').textContent = `Welcome back, ${currentUser.username}`;
    renderFriends(currentUser.friends);
  } catch (err) {
    console.error('Failed to fetch user:', err);
    logout();
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  currentUser = null;
  window.location.replace('/');
}

function setupEventListeners() {
  document.getElementById('searchBtn').addEventListener('click', searchUsers);
  document.getElementById('logoutBtn').addEventListener('click', logout);

  document.getElementById('requestsList').addEventListener('click', async (e) => {
    if (e.target.classList.contains('accept-btn')) {
      await handleRequest(e.target.dataset.id, 'accept');
    } else if (e.target.classList.contains('decline-btn')) {
      await handleRequest(e.target.dataset.id, 'decline');
    }
  });
}

async function searchUsers() {
  const searchTerm = document.getElementById('searchInput').value.trim();
  if (!searchTerm) return;

  try {
    const response = await fetch(`${API_URL}/users/search?username=${searchTerm}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const users = await response.json();
    displaySearchResults(users);
  } catch (err) {
    console.error('Search failed:', err);
  }
}

function displaySearchResults(users) {
  const resultsContainer = document.getElementById('searchResults');
  resultsContainer.innerHTML = '';

  users.forEach(user => {
    if (user._id === currentUser._id) return;

    const userElement = document.createElement('div');
    userElement.className = 'search-result';
    const isFriend = currentUser.friends.some(friend => friend._id === user._id);

    userElement.innerHTML = `
      <p>${user.username}</p>
      ${
        isFriend ? '<span>Already friends</span>' :
        `<button class="send-request" data-id="${user._id}">Send Request</button>`
      }
    `;
    resultsContainer.appendChild(userElement);
  });

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
    searchUsers();
  } catch (err) {
    console.error('Failed to send request:', err);
  }
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
      const div = document.createElement('div');
      div.className = 'request-item';
      div.innerHTML = `
        <p>${request.senderUsername}</p>
        <button class="accept-btn" data-id="${request.senderId}">Accept</button>
        <button class="decline-btn" data-id="${request.senderId}">Decline</button>
      `;
      requestsList.appendChild(div);
    });
  } catch (err) {
    console.error('Failed to load requests:', err);
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
    await fetchCurrentUser(); // refresh user and friends
    await loadFriendRequests(); // refresh inbox
    await searchUsers(); // refresh search UI
  } catch (err) {
    console.error(`Failed to ${action} request:`, err);
  }
}

function renderFriends(friends) {
  const container = document.getElementById('friendsList');
  container.innerHTML = '';

  if (!friends || friends.length === 0) {
    container.textContent = 'No friends yet.';
    return;
  }

  friends.forEach(friend => {
    const div = document.createElement('div');
    div.className = 'friend-item';
    div.textContent = friend.username;
    container.appendChild(div);
  });
}
