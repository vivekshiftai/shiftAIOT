// Test authentication flow
console.log('Testing authentication...');

// Check if user is logged in
const token = localStorage.getItem('token');
const user = localStorage.getItem('user');

console.log('Token exists:', !!token);
console.log('User exists:', !!user);

if (token) {
  console.log('Token:', token.substring(0, 20) + '...');
}

if (user) {
  try {
    const userObj = JSON.parse(user);
    console.log('User email:', userObj.email);
    console.log('User role:', userObj.role);
  } catch (e) {
    console.error('Failed to parse user:', e);
  }
}

// Test API call
fetch('/api/users', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('API Response status:', response.status);
  return response.json();
})
.then(data => {
  console.log('API Response data:', data);
})
.catch(error => {
  console.error('API Error:', error);
});
