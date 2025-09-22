const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const adminLayout = '../views/layouts/admin';
const jwtSecret = process.env.JWT_SECRET; 

// =======================
// Auth Middleware
// =======================
const authMiddleware = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.redirect('/admin');

    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.userId = decoded.userId;
        next();
    } catch {
        return res.redirect('/admin');
    }
};

// =======================
// Admin Login Page
// =======================
router.get('/admin', (req, res) => {
    res.render('admin/index', {
        locals: { title: 'Admin', description: 'Login Page' },
        currentRoute: req.path
    });
});

// =======================
// Admin Login POST
// =======================
router.post('/admin', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) return res.redirect('/admin');

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.redirect('/admin');

        const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: '1h' });
        res.cookie('token', token, { httpOnly: true });

        return res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        return res.redirect('/admin');
    }
});

// =======================
// Admin Dashboard
// =======================
router.get('/dashboard', authMiddleware, async (req, res) => {
    try {
        const posts = await Post.find();
        res.render('admin/dashboard', {
            locals: { title: 'Dashboard', description: 'Admin Dashboard' },
            data: posts,
            currentRoute: req.path
        });
    } catch (err) {
        console.error(err);
        res.redirect('/admin');
    }
});

// =======================
// Add Post Page
// =======================
router.get('/add-post', authMiddleware, (req, res) => {
    res.render('admin/add-post', {
        locals: { title: 'Add Post', description: 'Create a new post' },
        currentRoute: req.path,
        layout: adminLayout
    });
});

// =======================
// Add Post POST
// =======================
router.post('/add-post', authMiddleware, async (req, res) => {
    try {
        await Post.create({ title: req.body.title, body: req.body.body });
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.redirect('/add-post');
    }
});

// =======================
// Edit Post Page
// =======================
router.get('/edit-post/:id', authMiddleware, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        res.render('admin/edit-post', {
            locals: { title: 'Edit Post', description: 'Editing Post' },
            data: post,
            currentRoute: req.path,
            layout: adminLayout
        });
    } catch (err) {
        console.error(err);
        res.redirect('/dashboard');
    }
});

// =======================
// Edit Post PUT
// =======================
router.put('/edit-post/:id', authMiddleware, async (req, res) => {
    try {
        await Post.findByIdAndUpdate(req.params.id, {
            title: req.body.title,
            body: req.body.body,
            updatedAt: Date.now()
        });
        res.redirect(`/edit-post/${req.params.id}`);
    } catch (err) {
        console.error(err);
        res.redirect('/dashboard');
    }
});

// =======================
// Delete Post
// =======================
router.delete('/delete-post/:id', authMiddleware, async (req, res) => {
    try {
        await Post.findByIdAndDelete(req.params.id);
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.redirect('/dashboard');
    }
});

// =======================
// Logout
// =======================
router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/admin');
});

module.exports = router;
