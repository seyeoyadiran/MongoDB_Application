require('dotenv').config();

const express = require('express');
const expressLayout = require('express-ejs-layouts');
const methodOverride = require('method-override')
const cookieParser = require('cookie-parser'); 
const MongoStore = require('connect-mongo');
const session = require('express-session')

const connectDB = require('./server/config/db');
const { isActiveRoute } = require('./server/helpers/routeHelpers')
const adminRoutes = require("./server/routes/admin");

const app = express();

// FIX: Use environment port first, then 3000 for local
const PORT = process.env.PORT || 3000;

// Connecting to Database
connectDB();

// Middleware
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(methodOverride('_method'))
app.use(cookieParser());

// Session configuration with better error handling
app.use(session({
    secret: process.env.SESSION_SECRET || 'keyboard-cat', // Use env variable
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        // Add MongoStore options for better handling
        mongoOptions: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }
    }),
    cookie: { 
        maxAge: 3600000,
        secure: process.env.NODE_ENV === 'production' // Set based on environment
    }
}))

app.use(express.static('public'));
app.use("/admin", adminRoutes);

// Templating Engine
app.use(expressLayout);
app.set('layout', './layouts/main');
app.set('view engine', 'ejs');

app.locals.isActiveRoute = isActiveRoute;

// Routes
app.use('/', require('./server/routes/main')); 

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(500).render('error', {
        title: 'Server Error',
        message: 'Something went wrong!'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).render('404', {
        title: 'Page Not Found',
        currentRoute: req.originalUrl
    });
});

app.listen(PORT, () => {
    console.log(`✅ App listening on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
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