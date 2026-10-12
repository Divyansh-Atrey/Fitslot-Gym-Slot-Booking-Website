// Frontend app.js - Runs in the browser

async function fetchLiveSessions() {
    try {
        const response = await fetch('/api/sessions');
        if (!response.ok) throw new Error('Failed to fetch sessions');
        const sessions = await response.json();
        renderLiveQueue(sessions);
    } catch (error) {
        const container = document.getElementById('live-session-queue');
        if (container) {
            container.innerHTML = '<p style="color: #F87171;">Error loading live queue. Please try again later.</p>';
        }
    }
}

function renderLiveQueue(sessions) {
    const container = document.getElementById('live-session-queue');
    if (!container) return;
    
    container.innerHTML = '';
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentDate = now.toISOString().split('T')[0];
    
    let activeSessionsCount = 0;

    sessions.forEach(session => {
        const isToday = session.date === currentDate;
        const sessionEndHour = session.startHour + 1;
        
        if (isToday && currentHour >= sessionEndHour) {
            return; 
        }

        activeSessionsCount++;
        const isLiveNow = isToday && (currentHour >= session.startHour && currentHour < sessionEndHour);
        const remainingSpaces = session.capacity - session.booked;
        const isFull = remainingSpaces <= 0;
        
        const item = document.createElement('div');
        item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-bottom: 1px solid rgba(255,255,255,0.1);';
        
        item.innerHTML = `
            <div>
                <span style="font-weight: 600; color: #FFFFFF; font-size: 18px; display: block; margin-bottom: 4px;">
                    ${session.name || 'Gym Session'} 
                    ${isLiveNow ? '<span style="color: #34D399; font-size: 12px; background: rgba(52,211,153,0.15); padding: 2px 8px; border-radius: 4px; margin-left: 8px; border: 1px solid rgba(52,211,153,0.3);">LIVE NOW</span>' : ''}
                </span>
                <span style="font-size: 14px; color: #94A3B8;">Time: ${session.startHour}:00 - ${sessionEndHour}:00</span>
            </div>
            <div style="text-align: right;">
                <span style="font-size: 15px; font-weight: 600; color: ${isFull ? '#F87171' : '#34D399'}; display: block; margin-bottom: 4px;">
                    ${isFull ? 'Session Full (Waitlist Active)' : `${remainingSpaces} Spaces Remaining`}
                </span>
                <span style="font-size: 13px; color: #94A3B8;">
                    Booked: ${session.booked}/${session.capacity} ${session.waitlistCount > 0 ? `| Waitlist: ${session.waitlistCount}` : ''}
                </span>
            </div>
        `;
        container.appendChild(item);
    });

    if (activeSessionsCount === 0) {
        container.innerHTML = '<p style="color: #94A3B8;">No more active or upcoming sessions remaining for today.</p>';
    }
}

// Poll backend every 10 seconds
setInterval(fetchLiveSessions, 10000);
document.addEventListener('DOMContentLoaded', fetchLiveSessions);