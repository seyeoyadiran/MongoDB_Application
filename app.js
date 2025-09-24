require('dotenv').config();

const express = require('express');
const expressLayout = require('express-ejs-layouts');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser'); 
const MongoStore = require('connect-mongo');
const session = require('express-session');

const connectDB = require('./server/config/db');
const { isActiveRoute } = require('./server/helpers/routeHelpers');

const adminRoutes = require("./server/routes/admin");
const mainRoutes = require("./server/routes/main");

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Connect to Database
connectDB().catch(err => {
  console.error("❌ MongoDB connection error:", err.message);
  process.exit(1);
});

// ✅ Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET || 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
  }),
}));

app.use(express.static('public'));

// ✅ Provide currentRoute + helper globally
app.use((req, res, next) => {
  res.locals.currentRoute = req.path;
  res.locals.isActiveRoute = isActiveRoute;
  next();
});

// ✅ Templating Engine
app.use(expressLayout);
app.set('layout', './layouts/main');
app.set('view engine', 'ejs');

// ✅ Routes
app.use('/', mainRoutes);
app.use('/admin', adminRoutes);

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 App listening on port ${PORT}`);
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