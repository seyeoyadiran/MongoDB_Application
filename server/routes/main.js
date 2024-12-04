const express = require('express');
const router = express.Router();


//Routes

router.get('', (req, res) => {
    const locals = {
        title: "Oluwaseye's Blog" , 
        description: "Simple Blog Creatd with NodeJs, Express, and Mongodb"
    }

    res.render('index', {locals});
});

router.get('/about', (req, res) => {
    res.render('about')
})

module.exports = router; 