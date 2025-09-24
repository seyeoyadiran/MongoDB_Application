require('dotenv').config();

const express = require('express');
const expressLayout = require('express-ejs-layouts');
const methodOverride = require('method-override')
const cookieParser = require('cookie-parser'); 
const session = require('express-session')

const { isActiveRoute } = require('./server/helpers/routeHelpers')

const app = express();
const PORT = process.env.PORT || 3000;

// 🚨 TEMPORARILY DISABLE DATABASE CONNECTION
console.log('🚀 App starting without database connection (temporary fix)');

// Middleware
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(methodOverride('_method'))
app.use(cookieParser());

// Simplified session (no MongoDB store)
app.use(session({
    secret: process.env.SESSION_SECRET || 'keyboard-cat',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        maxAge: 3600000,
        secure: process.env.NODE_ENV === 'production'
    }
}))

app.use(express.static('public'));

// Templating Engine
app.use(expressLayout);
app.set('layout', './layouts/main');
app.set('view engine' , 'ejs');

app.locals.isActiveRoute = isActiveRoute;

// Simple routes without database dependencies
app.get('/', (req, res) => {
    const locals = {
        title: "Oluwaseye Oyadiran - Tech Professional & Entrepreneur",
        description: "Welcome to my blog"
    };
    
    res.render('index', {
        locals,
        data: [], // Empty data for now
        current: 1,
        nextPage: null,
        currentRoute: '/'
    });
});

app.get('/about', (req, res) => {
    res.render('about', {
        currentRoute: '/about'
    });
});

app.get('/contact', (req, res) => {
    res.render('contact', {
        currentRoute: '/contact'
    });
});

// Simple 404 handler without rendering a view
app.use('*', (req, res) => {
    res.status(404).send(`
        <html>
            <head><title>404 - Page Not Found</title></head>
            <body>
                <h1>404 - Page Not Found</h1>
                <p><a href="/">Go Home</a></p>
            </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`✅ App successfully running on port ${PORT}`);
    console.log(`🌐 Site should be live on Render soon!`);
});
// require('dotenv').config();

// const express = require('express');
// const expressLayout = require('express-ejs-layouts');
// const methodOverride = require('method-override')
// const cookieParser = require('cookie-parser'); 
// const MongoStore = require('connect-mongo');
// const session = require('express-session')


// const connectDB = require('./server/config/db');
// const { isActiveRoute } = require('./server/helpers/routeHelpers')
// const adminRoutes = require("./server/routes/admin");

// // app.use(express.static('public'));

// const app = express();
// const PORT = 3000 || process.env.PORT;

// //Connecting to Database
// connectDB();

// //middleware
// app.use(express.urlencoded({extended: true}));
// app.use(express.json());
// app.use(methodOverride('_method'))
// app.use(cookieParser());
// app.use(session({
//     secret: 'keyboard cat',
//     resave: false,
//     saveUninitialized: true,
//     store: MongoStore.create({
//         mongoUrl: process.env.MONGODB_URI
//     }),
//     // cookie: {maxAge: new Date (Date.now() + (3600000))}
// }))
// app.use(express.static('public'));
// app.use("/admin", adminRoutes);
// //Templating Engine
// app.use(expressLayout);
// app.set('layout', './layouts/main');
// app.set('view engine' , 'ejs');

// app.locals.isActiveRoute = isActiveRoute;

//  app.use('/', require('./server/routes/main')); 
//  app.use('/', require('./server/routes/admin')); 
 

// app.listen(PORT, ()=> {
//     console.log(`App listening on port ${PORT}`);
// })