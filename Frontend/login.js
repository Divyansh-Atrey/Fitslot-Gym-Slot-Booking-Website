document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    if (form) {
        form.addEventListener('submit', handleLogin);
    }
});

async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Dynamically choose between local and live Render backend
    const API_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:3000' 
        : 'https://fitslot-gym-slot-booking-website.onrender.com';

    try {
        const response = await fetch(
            `${API_URL}/api/login`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error);
        }

        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);

        alert('Login successful!');

        if (data.role === 'admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'dashboard.html';
        }

    } catch (err) {
        alert('Login failed: ' + err.message);
    }
}