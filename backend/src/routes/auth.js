const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/database');
const { generateToken, authenticateToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/customer-quick-sign (Customer signs in with Name and Mobile Number)
router.post('/customer-quick-sign', (req, res, next) => {
  try {
    const { name, phone, address } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Please enter your name to continue.' });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({ error: 'Please enter your 10-digit mobile number.' });
    }

    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    if (!/^\d{10}$/.test(cleanPhone)) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number.' });
    }

    // Check if user or customer already exists with this phone number
    let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(cleanPhone);
    let customer = db.prepare('SELECT * FROM customers WHERE phone = ?').get(cleanPhone);

    if (user && !customer) {
      customer = db.prepare('SELECT * FROM customers WHERE user_id = ?').get(user.id);
    } else if (customer && !user && customer.user_id) {
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(customer.user_id);
    }

    const salt = bcrypt.genSaltSync(10);
    const dummyHash = bcrypt.hashSync('customer123', salt);

    if (!user) {
      // Create user & customer atomically
      const tx = db.transaction(() => {
        const dummyEmail = `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '')}${Date.now().toString().slice(-4)}@customer.local`;
        const userRes = db.prepare(`
          INSERT INTO users (name, email, phone, password_hash, role, status)
          VALUES (?, ?, ?, ?, 'customer', 'active')
        `).run(cleanName, dummyEmail, cleanPhone, dummyHash);

        const userId = userRes.lastInsertRowid;

        let customerId;
        if (customer) {
          db.prepare('UPDATE customers SET user_id = ?, name = ? WHERE id = ?').run(userId, cleanName, customer.id);
          customerId = customer.id;
        } else {
          const custRes = db.prepare(`
            INSERT INTO customers (user_id, name, phone, email, address)
            VALUES (?, ?, ?, ?, ?)
          `).run(userId, cleanName, cleanPhone, dummyEmail, address ? address.trim() : 'Local Delivery');
          customerId = custRes.lastInsertRowid;
        }

        return {
          id: userId,
          name: cleanName,
          email: dummyEmail,
          phone: cleanPhone,
          role: 'customer',
          customer_id: customerId,
          address: address ? address.trim() : (customer ? customer.address : null)
        };
      });

      user = tx();
    } else {
      // User exists, update name if needed and link customer profile
      if (cleanName && user.name !== cleanName) {
        db.prepare('UPDATE users SET name = ? WHERE id = ?').run(cleanName, user.id);
        user.name = cleanName;
      }

      if (!customer) {
        const custRes = db.prepare(`
          INSERT INTO customers (user_id, name, phone, email, address)
          VALUES (?, ?, ?, ?, ?)
        `).run(user.id, user.name, user.phone, user.email, address ? address.trim() : 'Local Delivery');
        user.customer_id = custRes.lastInsertRowid;
        user.address = address ? address.trim() : null;
      } else {
        if (cleanName && customer.name !== cleanName) {
          db.prepare('UPDATE customers SET name = ? WHERE id = ?').run(cleanName, customer.id);
        }
        if (address && address.trim() && !customer.address) {
          db.prepare('UPDATE customers SET address = ? WHERE id = ?').run(address.trim(), customer.id);
          customer.address = address.trim();
        }
        user.customer_id = customer.id;
        user.address = customer.address;
      }
    }

    const token = generateToken(user);

    res.json({
      message: `Welcome, ${user.name}!`,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: 'customer',
        customer_id: user.customer_id,
        address: user.address
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login (Unified Common Login with Automatic Role Detection)
router.post('/login', (req, res, next) => {
  try {
    const rawName = req.body.name || req.body.identifier;
    const rawSecret = req.body.secret || req.body.password || req.body.phone;
    const role = req.body.role;

    if (!rawName || !rawSecret) {
      return res.status(400).json({ error: 'Please enter both your name and phone number / password.' });
    }

    const cleanName = String(rawName).trim();
    const cleanSecret = String(rawSecret).trim();
    const cleanSecretDigits = cleanSecret.replace(/\D/g, '');

    // 1. ATTEMPT ADMIN AUTHENTICATION
    // Query admin user by Name, Email, or Phone
    const adminCandidates = db.prepare(`
      SELECT * FROM users 
      WHERE role = 'admin' AND (
        LOWER(name) = LOWER(?) OR 
        LOWER(email) = LOWER(?) OR 
        phone = ?
      )
    `).all(cleanName, cleanName, cleanName);

    for (const adminUser of adminCandidates) {
      const adminPhoneDigits = (adminUser.phone || '').replace(/\D/g, '');
      const phoneMatched = cleanSecretDigits.length >= 10 && (
        adminPhoneDigits.endsWith(cleanSecretDigits.slice(-10)) ||
        cleanSecretDigits.endsWith(adminPhoneDigits.slice(-10))
      );
      const passwordMatched = adminUser.password_hash && bcrypt.compareSync(cleanSecret, adminUser.password_hash);

      if (phoneMatched || passwordMatched) {
        if (adminUser.status !== 'active') {
          return res.status(403).json({ error: 'Your account has been deactivated. Please contact support.' });
        }

        if (role && role !== 'admin') {
          return res.status(403).json({ error: `Access restricted. You cannot log in as ${role}.` });
        }

        const token = generateToken(adminUser);
        return res.json({
          message: 'Admin login successful',
          token,
          user: {
            id: adminUser.id,
            name: adminUser.name,
            email: adminUser.email,
            phone: adminUser.phone,
            role: 'admin'
          },
          redirectTo: '/admin/dashboard'
        });
      }
    }

    if (adminCandidates.length > 0) {
      return res.status(401).json({
        error: 'Invalid admin credentials. Please check your phone number or password.'
      });
    }

    // 2. CUSTOMER AUTHENTICATION & SEAMLESS SIGN-IN
    // Customer enters Name & Phone Number -> auto-sign in and display Customer Dashboard
    if (cleanSecretDigits.length < 10) {
      return res.status(400).json({
        error: 'Please enter a valid 10-digit mobile phone number.'
      });
    }

    const cleanPhone = cleanSecretDigits.slice(-10);

    // Check if user or customer already exists with this phone number
    let user = db.prepare('SELECT * FROM users WHERE phone = ? OR phone LIKE ?').get(cleanPhone, `%${cleanPhone}`);
    let customer = db.prepare('SELECT * FROM customers WHERE phone = ? OR phone LIKE ?').get(cleanPhone, `%${cleanPhone}`);

    if (user && !customer) {
      customer = db.prepare('SELECT * FROM customers WHERE user_id = ?').get(user.id);
    } else if (customer && !user && customer.user_id) {
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(customer.user_id);
    }

    if (!user) {
      // Auto-register customer seamlessly
      const salt = bcrypt.genSaltSync(10);
      const dummyHash = bcrypt.hashSync('customer123', salt);
      const dummyEmail = `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '')}${Date.now().toString().slice(-4)}@customer.local`;

      const tx = db.transaction(() => {
        const userRes = db.prepare(`
          INSERT INTO users (name, email, phone, password_hash, role, status)
          VALUES (?, ?, ?, ?, 'customer', 'active')
        `).run(cleanName, dummyEmail, cleanPhone, dummyHash);

        const userId = userRes.lastInsertRowid;
        let customerId;
        if (customer) {
          db.prepare('UPDATE customers SET user_id = ?, name = ? WHERE id = ?').run(userId, cleanName, customer.id);
          customerId = customer.id;
        } else {
          const custRes = db.prepare(`
            INSERT INTO customers (user_id, name, phone, email, address)
            VALUES (?, ?, ?, ?, ?)
          `).run(userId, cleanName, cleanPhone, dummyEmail, 'Store Customer');
          customerId = custRes.lastInsertRowid;
        }

        return {
          id: userId,
          name: cleanName,
          email: dummyEmail,
          phone: cleanPhone,
          role: 'customer',
          status: 'active',
          customer_id: customerId,
          address: customer ? customer.address : null
        };
      });

      user = tx();
    } else {
      // User exists - update name if entered and link profile
      if (cleanName && user.name !== cleanName) {
        db.prepare('UPDATE users SET name = ? WHERE id = ?').run(cleanName, user.id);
        user.name = cleanName;
      }
      if (customer) {
        if (cleanName && customer.name !== cleanName) {
          db.prepare('UPDATE customers SET name = ? WHERE id = ?').run(cleanName, customer.id);
        }
        user.customer_id = customer.id;
        user.address = customer.address;
      } else {
        const custRes = db.prepare(`
          INSERT INTO customers (user_id, name, phone, email, address)
          VALUES (?, ?, ?, ?, ?)
        `).run(user.id, user.name, user.phone, user.email, 'Store Customer');
        user.customer_id = custRes.lastInsertRowid;
        user.address = null;
      }
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Your account has been deactivated. Please contact support.' });
    }

    const token = generateToken(user);
    return res.json({
      message: 'Customer sign in successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: 'customer',
        customer_id: user.customer_id,
        address: user.address
      },
      redirectTo: '/customer/products'
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/register
router.post('/register', (req, res, next) => {
  try {
    const { name, email, phone, password, address } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required.' });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({ error: 'Mobile number is required.' });
    }

    const cleanPhone = phone.trim();
    if (!/^\d{10}$/.test(cleanPhone)) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number.' });
    }

    const cleanName = name.trim();
    const cleanEmail = email ? email.trim().toLowerCase() : null;

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password || 'customer123', salt);

    const transaction = db.transaction(() => {
      const userStmt = db.prepare(`
        INSERT INTO users (name, email, phone, password_hash, role, status)
        VALUES (?, ?, ?, ?, 'customer', 'active')
      `);
      const userRes = userStmt.run(cleanName, cleanEmail, cleanPhone, password_hash);
      const userId = userRes.lastInsertRowid;

      const custStmt = db.prepare(`
        INSERT INTO customers (user_id, name, phone, email, address)
        VALUES (?, ?, ?, ?, ?)
      `);
      const custRes = custStmt.run(userId, cleanName, cleanPhone, cleanEmail, address ? address.trim() : null);

      return { userId, customerId: custRes.lastInsertRowid };
    });

    const { userId, customerId } = transaction();

    const newUser = {
      id: userId,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      role: 'customer'
    };

    const token = generateToken(newUser);

    res.status(201).json({
      message: `Welcome, ${cleanName}! Account created successfully.`,
      token,
      user: {
        ...newUser,
        customer_id: customerId,
        address: address ? address.trim() : null
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res, next) => {
  try {
    const user = db.prepare('SELECT id, name, email, phone, role, status, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    let customerProfile = null;
    if (user.role === 'customer') {
      customerProfile = db.prepare('SELECT * FROM customers WHERE user_id = ?').get(user.id);
    }

    res.json({
      user: {
        ...user,
        customer_id: customerProfile ? customerProfile.id : null,
        address: customerProfile ? customerProfile.address : null
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
