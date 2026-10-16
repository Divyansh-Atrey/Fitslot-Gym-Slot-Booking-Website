const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : 'https://fitslot-gym-slot-booking-website.onrender.com';

document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    
    // Check if user is logged in
    if (!token) {
        window.location.href = 'index.html';
        return;
    }
    
    loadMyBookings();
});

async function loadMyBookings() {
    const container = document.getElementById('my-bookings-list');
    container.innerHTML = '<p style="text-align: center;">Loading your bookings...</p>';

    try {
        const response = await fetch(`${API_URL}/api/my-bookings`, {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });

        const bookings = await response.json();

        if (!response.ok) {
            container.innerHTML = '<p style="text-align: center; color: red;">Failed to load bookings</p>';
            return;
        }

        if (bookings.length === 0) {
            container.innerHTML = '<p style="text-align: center;">You have no confirmed bookings.</p>';
            return;
        }

        let htmlContent = '';
        const now = new Date();

        // Simple for loop like a beginner would write
        for (let i = 0; i < bookings.length; i++) {
            let item = bookings[i];
            
            let sessionDate = item.sessions.date;
            let sessionHour = item.sessions.start_hour;
            
            // Check if session time has passed
            let sessionDateTime = new Date(sessionDate + 'T' + sessionHour + ':00:00');
            let isPast = now > sessionDateTime;

            htmlContent += '<div class="session-card">';
            htmlContent += '<h3>' + item.sessions.name + '</h3>';
            htmlContent += '<p>Date: ' + sessionDate + '</p>';
            htmlContent += '<p>Time: ' + sessionHour + ':00</p>';

            // Show Session Completed if time is over, otherwise show code and cancel button
            if (isPast) {
                htmlContent += '<p style="color: #4ade80; font-weight: bold; margin-top: 10px;">Session Completed</p>';
            } else {
                htmlContent += '<p style="font-weight: bold; color: #007bff;">Check-In Code: ' + item.check_in_code + '</p>';
                htmlContent += '<button onclick="cancelBooking(\'' + item.session_id + '\')" class="book-btn" style="background-color: #dc3545; margin-top: 10px;">Cancel Booking</button>';
            }

            htmlContent += '</div>';
        }

        container.innerHTML = htmlContent;

    } catch (err) {
        container.innerHTML = '<p style="text-align: center; color: red;">Error loading bookings</p>';
    }
}

async function cancelBooking(sessionId) {
    let check = confirm('Are you sure you want to cancel this booking?');
    if (check === false) {
        return;
    }

    try {
        let response = await fetch(`${API_URL}/api/bookings/` + sessionId, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });

        let data = await response.json();

        if (response.ok) {
            alert(data.message);
            loadMyBookings();
        } else {
            alert(data.error);
        }

    } catch (err) {
        alert('Failed to cancel booking');
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = 'index.html';
}