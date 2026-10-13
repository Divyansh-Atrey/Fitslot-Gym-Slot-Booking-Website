require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const app = express();

app.use(express.static(path.join(__dirname, '../Frontend')));
app.use(cors());
app.use(express.json());

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthenticated' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Forbidden' });
        req.user = user;
        next();
    });
};

const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    next();
};

app.get('/api/sessions', async (req, res) => {
    try {
        const { date } = req.query;
        let query = supabase.from('sessions').select('*, bookings(status), waitlist(id)');
        if (date) query = query.eq('date', date);

        const { data, error } = await query;
        if (error) return res.status(400).json({ error: error.message });

        const formatted = data.map(session => ({
            id: session.id,
            name: session.name || 'Gym Session',
            date: session.date,
            startHour: session.start_hour,
            capacity: session.capacity,
            booked: session.bookings.filter(b => b.status === 'confirmed').length,
            waitlistCount: session.waitlist ? session.waitlist.length : 0
        }));

        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/bookings', authenticateToken, async (req, res) => {
    try {
        const { sessionId } = req.body;
        const userId = req.user.id;

        const { data: existingRecords } = await supabase
            .from('bookings')
            .select('*')
            .eq('user_id', userId)
            .eq('session_id', sessionId)
            .limit(1);

        const existingRecord = existingRecords && existingRecords.length > 0 ? existingRecords[0] : null;

        if (existingRecord && existingRecord.status === 'confirmed') {
            return res.status(400).json({ 
                error: 'You have already booked this session!', 
                checkInCode: existingRecord.check_in_code 
            });
        }

        const { data: sessionData, error: sError } = await supabase
            .from('sessions')
            .select('date, start_hour, capacity')
            .eq('id', sessionId)
            .single();

        if (sError || !sessionData) return res.status(404).json({ error: 'Session not found' });

        const sessionDateTime = new Date(`${sessionData.date}T${String(sessionData.start_hour).padStart(2, '0')}:00:00`);
        if (new Date() > sessionDateTime) {
            return res.status(400).json({ error: 'This session time has already passed!' });
        }

        const maxCapacity = sessionData.capacity || 20;

        const { data: bookings, error: bError } = await supabase
            .from('bookings')
            .select('*')
            .eq('session_id', sessionId)
            .eq('status', 'confirmed');

        if (bError) return res.status(400).json({ error: bError.message });

        if (bookings.length < maxCapacity) {
            const checkInCode = crypto.randomBytes(3).toString('hex').toUpperCase();

            const { error } = await supabase
                .from('bookings')
                .upsert([{ 
                    user_id: userId, 
                    session_id: sessionId, 
                    status: 'confirmed', 
                    check_in_code: checkInCode,
                    short_code: checkInCode 
                }], { onConflict: 'user_id,session_id' });

            if (error) {
                return res.status(400).json({ error: error.message });
            }
            return res.status(201).json({ message: 'Session booked successfully!', status: 'confirmed', checkInCode });
        } else {
            const { error } = await supabase
                .from('waitlist')
                .upsert([{ user_id: userId, session_id: sessionId }], { onConflict: 'user_id,session_id' });

            if (error) return res.status(400).json({ error: error.message });
            return res.status(200).json({ message: 'Session is full. Added to waitlist.', status: 'waitlist' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/api/bookings/:sessionId', authenticateToken, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.id;

        const { error: updateError } = await supabase
            .from('bookings')
            .update({ status: 'cancelled' })
            .eq('session_id', sessionId)
            .eq('user_id', userId);

        if (updateError) return res.status(400).json({ error: 'Could not cancel booking' });

        const { data: waitlistEntries } = await supabase
            .from('waitlist')
            .select('*')
            .eq('session_id', sessionId)
            .order('joined_at', { ascending: true })
            .limit(1);

        if (waitlistEntries && waitlistEntries.length > 0) {
            const nextUser = waitlistEntries[0];
            const checkInCode = crypto.randomBytes(3).toString('hex').toUpperCase();

            await supabase.from('bookings').upsert([{
                user_id: nextUser.user_id,
                session_id: sessionId,
                status: 'confirmed',
                check_in_code: checkInCode,
                short_code: checkInCode
            }], { onConflict: 'user_id,session_id' });

            await supabase.from('waitlist').delete().eq('id', nextUser.id);
        }

        res.json({ message: 'Booking cancelled successfully. Waitlist updated.' });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/my-bookings', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const { data, error } = await supabase
            .from('bookings')
            .select('*, sessions(name, date, start_hour)')
            .eq('user_id', userId)
            .eq('status', 'confirmed');

        if (error) return res.status(400).json({ error: error.message });

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/admin/check-in', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { checkInCode } = req.body;
        const { data: booking, error } = await supabase
            .from('bookings')
            .select('*, users(name), sessions(start_hour, date)')
            .eq('check_in_code', checkInCode)
            .eq('status', 'confirmed')
            .single();

        if (error || !booking) return res.status(404).json({ error: 'Invalid or already used check-in code' });

        res.json({ message: `Checked in successfully for ${booking.users.name}` });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/admin/sessions', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, date, startHour, capacity } = req.body;

        const { data, error } = await supabase
            .from('sessions')
            .insert([{ 
                name: name || 'Gym Session', 
                date, 
                start_hour: startHour, 
                capacity: capacity || 20 
            }])
            .select()
            .single();

        if (error) return res.status(400).json({ error: error.message });

        res.status(201).json({ message: 'Session created successfully!', data });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const { data: user, error } = await supabase.from('users').select('*').eq('email', email).single();
        if (error || !user) return res.status(400).json({ error: 'Invalid email or password' });

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(400).json({ error: 'Invalid email or password' });

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, role: user.role, message: 'Logged in successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const { data, error } = await supabase
            .from('users')
            .insert([{ 
                name, 
                email, 
                password_hash: hashedPassword, 
                role: 'member' 
            }])
            .select();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.status(201).json({ message: 'Registration successful! You can now log in.' });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/', (req, res) => {
    res.send('Fitslot Backend Running');
});

app.listen(3000, () => {
    console.log('Fitslot server running on port 3000');
});