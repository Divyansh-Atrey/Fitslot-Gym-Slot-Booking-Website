document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('fname').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message || 'Registration successful!');
            window.location.href = 'login.html';
        } else {
            alert('Error: ' + (data.error || 'Registration failed'));
        }
    } catch (err) {
        console.error('Registration error:', err);
        alert('An unexpected error occurred. Please check your connection.');
    }
});