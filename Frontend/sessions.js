document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        alert("Firstly Register of Login to View Sessions.You can also view it on Main HomePage.")
        window.location.href = 'index.html';
        return;
    }
    loadSessions();
});

async function loadSessions() {
    const dateFilter = document.getElementById('dateFilter').value;
    const listContainer = document.getElementById('sessions-list');
    listContainer.innerHTML = '<p style="text-align: center;">Loading sessions...</p>';

    try {
        let url = 'http://localhost:3000/api/sessions';
        if (dateFilter) {
            url += `?date=${dateFilter}`;
        }

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const sessions = await response.json();

        if (!response.ok) {
            throw new Error(sessions.error || 'Failed to load sessions');
        }

        if (sessions.length === 0) {
            listContainer.innerHTML = '<p style="text-align: center;">No sessions available.</p>';
            return;
        }

        listContainer.innerHTML = sessions.map(session => `
            <div class="session-card">
                <h3>Session Time: ${session.startHour}:00</h3>
                <p>Date: ${session.date}</p>
                <p>Booked: ${session.booked} / ${session.capacity} | Waitlist: ${session.waitlistCount}</p>
                <button onclick="bookSession('${session.id}')" class="book-btn">Book Now</button>
            </div>
        `).join('');

    } catch (err) {
        listContainer.innerHTML = `<p style="text-align: center; color: red;">Error: ${err.message}</p>`;
    }
}

async function bookSession(sessionId) {
    try {
        const response = await fetch('http://localhost:3000/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ sessionId })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error);
        }

        if (data.status === 'confirmed') {
            alert(`Booking Confirmed! Your Check-In Code is: ${data.checkInCode}`);
        } else {
            alert(data.message);
        }

        loadSessions();

    } catch (err) {
        alert('Booking failed: ' + err.message);
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = 'index.html';
}