const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : 'https://fitslot-gym-slot-booking-website.onrender.com';

document.addEventListener('DOMContentLoaded', fetchMyBookings);

async function fetchMyBookings() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        alert('Please log in to view your bookings.');
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/my-bookings`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to fetch bookings');
        
        const bookings = await response.json();
        renderBookings(bookings);
    } catch (err) {
        document.getElementById('my-bookings-container').innerHTML = 
            '<p class="section-desc" style="color: #F87171;">Could not load your bookings.</p>';
    }
}

function renderBookings(bookings) {
    const container = document.getElementById('my-bookings-container');
    container.innerHTML = '';

    if (bookings.length === 0) {
        container.innerHTML = '<p class="section-desc">You have no active bookings currently.</p>';
        return;
    }

    bookings.forEach(booking => {
        const card = document.createElement('div');
        card.className = 'booking-card'; // Uses styling from dashboard.css

        card.innerHTML = `
            <div>
                <h3>Session: ${booking.sessions.start_hour}:00 - ${booking.sessions.start_hour + 1}:00</h3>
                <p>Date: ${booking.sessions.date}</p>
                <span class="check-in-badge">
                    Check-in Code: <strong>${booking.check_in_code}</strong>
                </span>
            </div>
            <div>
                <button class="btn-danger" onclick="cancelBooking('${booking.session_id}')">
                    Cancel Booking
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

async function cancelBooking(sessionId) {
    if (!confirm('Are you sure you want to cancel this booking? This will release your seat.')) return;

    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/api/bookings/${sessionId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        alert(data.message);
        fetchMyBookings();
    } catch (err) {
        alert('Failed to cancel booking.');
    }
}

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}