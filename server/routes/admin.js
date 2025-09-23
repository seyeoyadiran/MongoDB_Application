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
// Add Post POST
// =======================
router.post('/add-post', authMiddleware, upload.single('featuredMedia'), async (req, res) => {
    try {
        let featuredImage = '';
        let mediaType = null;

        if (req.file) {
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
// Analytics API
// =======================
router.get("/api/analytics", async (req, res) => {
    try {
        const posts = await Post.find({});
        const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);

        // TODO: replace placeholders with real analytics
        const siteVisits = 1234;
        const visitsByDay = [
            { _id: "2025-09-16", count: 150 },
            { _id: "2025-09-17", count: 200 },
            { _id: "2025-09-18", count: 180 },
            { _id: "2025-09-19", count: 220 },
            { _id: "2025-09-20", count: 250 },
            { _id: "2025-09-21", count: 190 },
            { _id: "2025-09-22", count: 210 }
        ];

        res.json({
            totalPosts: posts.length,
            totalViews,
            siteVisits,
            visitsByDay
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Analytics fetch failed" });
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

// const express = require('express');
// const router = express.Router();
// const Post = require('../models/Post');
// const User = require('../models/User');
// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');
// const multer = require('multer');
// const path = require('path');

// const adminLayout = '../views/layouts/admin';
// const loginLayout = '../views/layouts/login';
// const jwtSecret = process.env.JWT_SECRET; 

// // =======================
// // Multer Configuration
// // =======================
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, 'public/uploads/');
//     },
//     filename: function (req, file, cb) {
//         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//         cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
//     }
// });

// const upload = multer({
//     storage: storage,
//     limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
//     fileFilter: function (req, file, cb) {
//         const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|webm/;
//         const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
//         const mimetype = allowedTypes.test(file.mimetype);
        
//         if (mimetype && extname) {
//             return cb(null, true);
//         } else {
//             cb(new Error('Only image and video files are allowed'));
//         }
//     }
// });

// // =======================
// // Auth Middleware
// // =======================
// const authMiddleware = (req, res, next) => {
//     const token = req.cookies.token;
//     if (!token) return res.redirect('/admin');

//     try {
//         const decoded = jwt.verify(token, jwtSecret);
//         req.userId = decoded.userId;
//         next();
//     } catch {
//         return res.redirect('/admin');
//     }
// };

// // =======================
// // Admin Login Page
// // =======================
// router.get('/admin', (req, res) => {
//     res.render('admin/index', {
//         locals: { title: 'Admin', description: 'Login Page' },
//         currentRoute: req.path,
//         layout: loginLayout
//     });
// });

// // =======================
// // Admin Login POST
// // =======================
// router.post('/admin', async (req, res) => {
//     const { username, password } = req.body;

//     try {
//         const user = await User.findOne({ username });
//         if (!user) return res.redirect('/admin');

//         const valid = await bcrypt.compare(password, user.password);
//         if (!valid) return res.redirect('/admin');

//         const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: '1h' });
//         res.cookie('token', token, { httpOnly: true });

//         return res.redirect('/dashboard');
//     } catch (err) {
//         console.error(err);
//         return res.redirect('/admin');
//     }
// });

// // =======================
// // Admin Dashboard
// // =======================
// router.get('/dashboard', authMiddleware, async (req, res) => {
//     try {
//         const posts = await Post.find();
//         res.render('admin/dashboard', {
//             layout: adminLayout,
//             locals: { title: 'Dashboard', description: 'Admin Dashboard' },
//             data: posts,
//             currentRoute: req.path
//         });
//     } catch (err) {
//         console.error(err);
//         res.redirect('/admin');
//     }
// });

// // =======================
// // Add Post Page
// // =======================
// router.get('/add-post', authMiddleware, (req, res) => {
//     res.render('admin/add-post', {
//         layout: adminLayout,
//         locals: { title: 'Add Post', description: 'Create a new post' },
//         currentRoute: req.path
//     });
// });

// // =======================
// // Add Post POST
// // =======================
// router.post('/add-post', authMiddleware, upload.single('featuredMedia'), async (req, res) => {
//     try {
//         let featuredImage = '';
//         let mediaType = null;

//         if (req.file) {
//             featuredImage = '/uploads/' + req.file.filename;
            
//             // Determine if it's an image or video
//             if (req.file.mimetype.startsWith('image/')) {
//                 mediaType = 'image';
//             } else if (req.file.mimetype.startsWith('video/')) {
//                 mediaType = 'video';
//             }
//         }

//         await Post.create({ 
//             title: req.body.title, 
//             body: req.body.body,
//             featuredImage: featuredImage,
//             mediaType: mediaType
//         });
//         res.redirect('/dashboard');
//     } catch (err) {
//         console.error(err);
//         res.redirect('/add-post');
//     }
// });

// // =======================
// // Edit Post Page
// // =======================
// router.get('/edit-post/:id', authMiddleware, async (req, res) => {
//     try {
//         const post = await Post.findById(req.params.id);
//         res.render('admin/edit-post', {
//             layout: adminLayout,
//             locals: { title: 'Edit Post', description: 'Editing Post' },
//             data: post,
//             currentRoute: req.path
//         });
//     } catch (err) {
//         console.error(err);
//         res.redirect('/dashboard');
//     }
// });

// // =======================
// // Edit Post PUT
// // =======================
// router.put('/edit-post/:id', authMiddleware, upload.single('featuredMedia'), async (req, res) => {
//     try {
//         const updateData = {
//             title: req.body.title,
//             body: req.body.body,
//             updatedAt: Date.now()
//         };

//         if (req.file) {
//             updateData.featuredImage = '/uploads/' + req.file.filename;
            
//             if (req.file.mimetype.startsWith('image/')) {
//                 updateData.mediaType = 'image';
//             } else if (req.file.mimetype.startsWith('video/')) {
//                 updateData.mediaType = 'video';
//             }
//         }

//         await Post.findByIdAndUpdate(req.params.id, updateData);
//         res.redirect(`/edit-post/${req.params.id}`);
//     } catch (err) {
//         console.error(err);
//         res.redirect('/dashboard');
//     }
// });

// // =======================
// // Delete Post
// // =======================
// router.delete('/delete-post/:id', authMiddleware, async (req, res) => {
//     try {
//         await Post.findByIdAndDelete(req.params.id);
//         res.redirect('/dashboard');
//     } catch (err) {
//         console.error(err);
//         res.redirect('/dashboard');
//     }
// });

// // =======================
// // Analytics API
// // =======================
// router.get("/api/analytics", async (req, res) => {
//     try {
//         const posts = await Post.find({});
//         const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);

//         // TODO: replace placeholders with real analytics
//         const siteVisits = 1234;
//         const visitsByDay = [
//             { _id: "2025-09-16", count: 150 },
//             { _id: "2025-09-17", count: 200 },
//             { _id: "2025-09-18", count: 180 },
//             { _id: "2025-09-19", count: 220 },
//             { _id: "2025-09-20", count: 250 },
//             { _id: "2025-09-21", count: 190 },
//             { _id: "2025-09-22", count: 210 }
//         ];

//         res.json({
//             totalPosts: posts.length,
//             totalViews,
//             siteVisits,
//             visitsByDay
//         });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: "Analytics fetch failed" });
//     }
// });

// // =======================
// // Logout
// // =======================
// router.get('/logout', (req, res) => {
//     res.clearCookie('token');
//     res.redirect('/admin');
// });

// module.exports = router;
