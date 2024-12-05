const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');

const adminLayout = '../views/layouts/admin'

/**
 * Get /
 * Admin - Login Page
 */

router.get('/admin', async (req, res) => {

    try {
        const locals = {
            title: "Admin" , 
            description: "Simple Blog Createf d with NodeJs, Express, and Mongodb"
        }

        res.render('admin/index', {locals , layout: adminLayout });
    }
     catch (error) {
        console.log(error);
    }
});

/**
 * POST /
 * Admin - Check Login
 */


router.post('/admin', async (req, res) => {

    try {
        
        const {username, password } = req.body;
        
        if(req.body.username ==='admin' && req.body.password ==='password'){
            res.send('You are logged in.');
        } else {
            res.send('Wrong username or password');
            alert('Wrong Username')
        }

        res.redirect('/admin');
    }
     catch (error) {
        console.log(error);
    }
});

 

module.exports = router;