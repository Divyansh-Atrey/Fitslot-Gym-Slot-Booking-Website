const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : 'https://fitslot-gym-slot-booking-website.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    
    document.getElementById('create-session-form').addEventListener('submit', createSession);
    document.getElementById('check-in-form').addEventListener('submit', processCheckIn);
});

function checkAdminAuth() {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token || role !== 'admin') {
        alert('Access Denied. Admins only.');
        window.location.href = 'login.html';
    }
}

async function createSession(e) {
    e.preventDefault();
    const date = document.getElementById('session-date').value;
    const startHour = parseInt(document.getElementById('session-hour').value);
    const token = localStorage.getItem('token');

    try {
        const res = await fetch(`${API_URL}/api/admin/sessions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ date, startHour, capacity: 20 })
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create session');
        
        alert('Session created successfully!');
        document.getElementById('create-session-form').reset();
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

async function processCheckIn(e) {
    e.preventDefault();
    const checkInCode = document.getElementById('check-in-code').value.trim();
    const token = localStorage.getItem('token');
    const resultDiv = document.getElementById('check-in-result');
    
    resultDiv.style.color = '#E2E8F0';
    resultDiv.textContent = 'Verifying code...';

    try {
        const res = await fetch(`${API_URL}/api/admin/check-in`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ checkInCode })
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Check-in failed');
        
        resultDiv.style.color = '#34D399';
        resultDiv.textContent = data.message;
        document.getElementById('check-in-form').reset();
    } catch (err) {
        resultDiv.style.color = '#F87171';
        resultDiv.textContent = 'Check-in failed: ' + err.message;
    }
}

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}