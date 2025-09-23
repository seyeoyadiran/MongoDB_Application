const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

const adminLayout = '../views/layouts/admin';
const loginLayout = '../views/layouts/login';
const jwtSecret = process.env.JWT_SECRET; 
const SiteVisit = require('../models/Sitevisit');


// =======================
// Multer Configuration
// =======================
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: function (req, file, cb) {
        // Allow all image and video files
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image and video files are allowed'), false);
        }
    }
});

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
        currentRoute: req.path,
        layout: loginLayout
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
            layout: adminLayout,
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
        layout: adminLayout,
        locals: { title: 'Add Post', description: 'Create a new post' },
        currentRoute: req.path
    });
});

// =======================
// Add Post POST (Updated with media removal handling)
// =======================
router.post('/add-post', authMiddleware, upload.single('featuredMedia'), async (req, res) => {
    try {
        let featuredImage = '';
        let mediaType = null;

        // Check if media was removed before submission
        const mediaRemoved = req.body.mediaRemoved === 'true';
        
        // Only set media if a file was actually uploaded AND not removed
        if (req.file && !mediaRemoved) {
            featuredImage = '/uploads/' + req.file.filename;
            
            // Determine if it's an image or video
            if (req.file.mimetype.startsWith('image/')) {
                mediaType = 'image';
            } else if (req.file.mimetype.startsWith('video/')) {
                mediaType = 'video';
            }
        }

        await Post.create({ 
            title: req.body.title, 
            body: req.body.body,
            featuredImage: featuredImage,
            mediaType: mediaType
        });
        res.redirect('/dashboard?status=success&message=Post created successfully');
    } catch (err) {
        console.error(err);
        res.redirect('/add-post?status=error&message=Error creating post');
    }
});


// =======================
// Edit Post Page
// =======================
router.get('/edit-post/:id', authMiddleware, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        res.render('admin/edit-post', {
            layout: adminLayout,
            locals: { title: 'Edit Post', description: 'Editing Post' },
            data: post,
            currentRoute: req.path
        });
    } catch (err) {
        console.error(err);
        res.redirect('/dashboard');
    }
});

// =======================
// Edit Post PUT
// =======================

// =======================
// Edit Post PUT (Updated with media removal)
// =======================
router.put('/edit-post/:id', authMiddleware, upload.single('featuredMedia'), async (req, res) => {
    try {
        const updateData = {
            title: req.body.title,
            body: req.body.body,
            updatedAt: Date.now()
        };

        // Handle media removal
        if (req.body.removeMedia === 'true') {
            updateData.featuredImage = '';
            updateData.mediaType = null;
        } 
        // Handle new file upload
        else if (req.file) {
            updateData.featuredImage = '/uploads/' + req.file.filename;
            
            if (req.file.mimetype.startsWith('image/')) {
                updateData.mediaType = 'image';
            } else if (req.file.mimetype.startsWith('video/')) {
                updateData.mediaType = 'video';
            }
        }

        await Post.findByIdAndUpdate(req.params.id, updateData);
        res.redirect(`/edit-post/${req.params.id}?status=success&message=Post updated successfully`);
    } catch (err) {
        console.error(err);
        res.redirect(`/edit-post/${req.params.id}?status=error&message=Error updating post`);
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
// Real-time Analytics API
// =======================
router.get("/api/analytics", authMiddleware, async (req, res) => {
    try {
        const posts = await Post.find({});
        const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);

        // Get last 7 days of site visits
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            last7Days.push(date.toISOString().split('T')[0]);
        }

        // Get site visits for the last 7 days
        const siteVisitsData = await SiteVisit.find({
            date: { $in: last7Days }
        });

        // Create a map for easy lookup
        const visitsMap = {};
        siteVisitsData.forEach(visit => {
            visitsMap[visit.date] = visit.count;
        });

        // Fill in missing days with 0
        const visitsByDay = last7Days.map(date => ({
            _id: date,
            count: visitsMap[date] || 0
        }));

        // Calculate total site visits (last 30 days for better overview)
        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 30);
        const totalSiteVisits = await SiteVisit.aggregate([
            { $match: { date: { $gte: last30Days.toISOString().split('T')[0] } } },
            { $group: { _id: null, total: { $sum: "$count" } } }
        ]);

        const siteVisits = totalSiteVisits.length > 0 ? totalSiteVisits[0].total : 0;

        // Get today's visits for real-time display
        const today = new Date().toISOString().split('T')[0];
        const todayVisit = await SiteVisit.findOne({ date: today });
        const todayVisits = todayVisit ? todayVisit.count : 0;

        res.json({
            totalPosts: posts.length,
            totalViews,
            siteVisits,
            todayVisits,
            visitsByDay
        });
    } catch (err) {
        console.error("Analytics fetch failed:", err);
        res.status(500).json({ error: "Analytics fetch failed" });
    }
});

// =======================
// Top Posts API
// =======================
router.get("/api/top-posts", authMiddleware, async (req, res) => {
    try {
        const topPosts = await Post.find({})
            .sort({ views: -1 })
            .limit(10)
            .select('title views');
        
        res.json(topPosts);
    } catch (err) {
        console.error("Failed to fetch top posts:", err);
        res.status(500).json({ error: "Failed to fetch top posts" });
    }
});



// =======================
// Logout
// =======================
router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/admin');
});

// =======================
// Error Handling Middleware for Multer
// =======================
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).send('File too large. Maximum size is 50MB.');
        }
    } else if (error) {
        // This catches our custom file filter errors
        return res.status(400).send(error.message);
    }
    next();
});

module.exports = router;
