const API_URL = 'http://localhost:5000/api';

// Auth check on page load
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token && window.location.pathname !== '/') {
    window.location.replace('/');
  }
});

// Login handler
if (document.getElementById('loginBtn')) {
  document.getElementById('loginBtn').addEventListener('click', async () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', username);
        window.location.replace('/dashboard.html');
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (error) {
      alert('Login error: ' + error.message);
    }
  });
}