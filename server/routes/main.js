const express = require('express');
const router = express.Router();
const Post = require('../models/Post');


/*
Get / Home 
*/

router.get('', async (req, res) => {
    try {
        const locals = {
            title: "Oluwaseye's Blog" , 
            description: "Simple Blog Creatd with NodeJs, Express, and Mongodb"
        }

        let perPage = 10;
        let page = req.query.page || 1;

        const data = await Post.aggregate([ { $sort: { createdAt: -1 } }])
        .skip(perPage * page - perPage)
        .limit(perPage)
        .exec();

        
        const count = await Post.countDocuments();
        const nextPage = parseInt(page) + 1;
        const hasNextPage = nextPage <= Math.ceil(count / perPage);

        res.render('index', {
            locals,
             data,
             current: page, 
             nextPage: hasNextPage ? nextPage : null
            });

    } catch (error) {
        console.log(error);
    }
});


// router.get('', async (req, res) => {
//     const locals = {
//         title: "Oluwaseye's Blog" , 
//         description: "Simple Blog Creatd with NodeJs, Express, and Mongodb"
//     }

//     try {
//         const data = await Post.find();
//         res.render('index', {locals, data});
//     } catch (error) {
//         console.log(error);
//     }
// });






router.get('/about', (req, res) => {
    res.render('about')
})

router.get('/contact', (req, res) => {
    res.render('contact')
})

module.exports = router; 