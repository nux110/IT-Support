const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration. Please check your .env file.');
  console.error('Required: SUPABASE_URL and SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Test Supabase connection
async function testConnection() {
  try {
    const { data, error } = await supabase.from('tickets').select('count').limit(1);
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is fine
      throw error;
    }
    console.log('✅ Connected to Supabase successfully');
  } catch (error) {
    console.error('❌ Failed to connect to Supabase:', error.message);
    console.error('Please check your Supabase configuration and ensure the tickets table exists.');
    process.exit(1);
  }
}

// API Routes

// Submit a new ticket
app.post('/api/tickets', async (req, res) => {
  try {
    const { name, email, department, category, priority, subject, description } = req.body;

    // Basic validation
    if (!name || !email || !category || !subject || !description) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['name', 'email', 'category', 'subject', 'description']
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({ error: 'Invalid priority level' });
    }

    // Generate ticket ID
    const ticketId = `TICK-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Create ticket object
    const ticket = {
      id: ticketId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      department: department || null,
      category,
      priority,
      subject: subject.trim(),
      description: description.trim(),
      status: 'open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Save ticket to Supabase
    const { data, error } = await supabase
      .from('tickets')
      .insert([ticket])
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ error: 'Failed to save ticket' });
    }

    console.log(`✅ New ticket created: ${ticketId} - ${subject}`);

    // Return success response
    res.status(201).json({
      ticketId,
      message: 'Ticket submitted successfully',
      status: 'open'
    });

  } catch (error) {
    console.error('❌ Error creating ticket:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all tickets (for admin purposes)
app.get('/api/tickets', async (req, res) => {
  try {
    // In production, add authentication and authorization
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase select error:', error);
      return res.status(500).json({ error: 'Failed to fetch tickets' });
    }

    const total = tickets.length;
    const open = tickets.filter(t => t.status === 'open').length;

    res.json({
      tickets,
      total,
      open
    });
  } catch (error) {
    console.error('❌ Error fetching tickets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific ticket by ID
app.get('/api/tickets/:id', async (req, res) => {
  try {
    const { data: ticket, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Ticket not found' });
      }
      console.error('Supabase select error:', error);
      return res.status(500).json({ error: 'Failed to fetch ticket' });
    }

    res.json(ticket);
  } catch (error) {
    console.error('❌ Error fetching ticket:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update ticket status (for admin)
app.patch('/api/tickets/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['open', 'in-progress', 'resolved', 'closed'];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateData = {
      status: status || 'open',
      updated_at: new Date().toISOString()
    };

    const { data: ticket, error } = await supabase
      .from('tickets')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Ticket not found' });
      }
      console.error('Supabase update error:', error);
      return res.status(500).json({ error: 'Failed to update ticket' });
    }

    res.json(ticket);
  } catch (error) {
    console.error('❌ Error updating ticket:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    const { data, error } = await supabase
      .from('tickets')
      .select('count')
      .limit(1);

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    console.error('❌ Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// Serve the main HTML file for any unmatched routes (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(require('path').join(__dirname, 'helpdesk.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
async function startServer() {
  try {
    // Test Supabase connection before starting server
    await testConnection();

    app.listen(PORT, () => {
      console.log('🚀 TechDesk Backend Server running on port', PORT);
      console.log('🌐 Frontend available at: http://localhost:' + PORT);
      console.log('🗄️  Database: Supabase PostgreSQL');
      console.log('');
      console.log('📋 API endpoints:');
      console.log('  POST   /api/tickets      - Submit new ticket');
      console.log('  GET    /api/tickets      - Get all tickets');
      console.log('  GET    /api/tickets/:id  - Get specific ticket');
      console.log('  PATCH  /api/tickets/:id  - Update ticket status');
      console.log('  GET    /api/health       - Health check');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();