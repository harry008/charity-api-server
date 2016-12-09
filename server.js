// Useful for debugging node.js code that has been bundled with Webpack.
// https://github.com/evanw/node-source-map-support
require('babel-register');
import 'source-map-support/register';
import http from 'http';
import path from 'path';
import helmet from 'helmet';
import mongoose from 'mongoose';
import graphQLHTTP from 'express-graphql';


// Express deps
import express from 'express';
import logger from 'morgan';
import bodyParser from 'body-parser';
import multer from 'multer';
// import session from 'express-session';
// import lusca from 'lusca';
import dotenv from 'dotenv';
// import ConnectMongo from 'connect-mongo';
// import passport from 'passport';
import expressValidator from 'express-validator';
import errorHandler from 'errorhandler';

// JWT Authentication middleware
import authenticate from './config/auth';

// Admin Check for admin user for admin control panel
import isAdmin from './config/adminCheck';

// Controllers
import * as userController from './controllers/user';
import contactController from './controllers/contact';
import * as campaignsController from './controllers/campaign';
import donationController from './controllers/donation';



/**
 * GraphQL Schema
 */
import schema from './graphql/schema';

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.config({ path: './.env' });
// const MongoStore = ConnectMongo(session);
const app = express();

// Choose native Promise as the mongoose Promise
mongoose.Promise = global.Promise;

/**
 * Connect to MongoDB.
 */
const MongoConnectionOptions = {
  server: {
    socketOptions: {
      keepAlive: 300000,
      connectionTimeoutMS: 10000
    }
  }
};
let conn;
if (process.env.NODE_ENV === 'development') {
  conn = process.env.MONGODB_URI;
} else {
  conn = process.env.MONGOLAB_URI;
}

// // console.log('Connection string ', conn);
// mongoose.connect(conn, MongoConnectionOptions);
// mongoose.connection.on('error', (err) => {
//   console.log('MongoDB Connection Error. Please make sure that MongoDB is running.', err);
//   // process.exit(1);
// });

// // Close db connection on application exit
// process.on('SIGINT', _ => {
//   mongoose.connection.close(_ => {
//     console.log('Mongoose connection closed');
//     process.exit(0);
//   });
// });

const server = http.createServer(app);
app.use(helmet.hidePoweredBy()); // Disable 'x-powered-by' header
app.use(logger('dev'));
// app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());
app.use(graphQLHTTP({
  schema,
  graphiql: true,
}));


/**
 * App Routes
 */
app.post('/api/login', userController.postLogin);
// app.get('/api/user', authenticate, userController.getUser);
app.post('/api/signup', userController.postSignup);
app.get('/api/logout', userController.logout);
app.post('/api/forgot', userController.postForgot);
app.get('/reset/:token', userController.getReset);
app.post('/api/reset/:token', userController.postReset);
// app.get('/api/account', authenticate, userController.getAccount);

app.post('/api/account/profile', authenticate, userController.postUpdateProfile);
app.post('/api/account/upload', authenticate, userController.uploadProfilePic);
app.post('/api/account/password', authenticate, userController.postUpdatePassword);
app.post('/api/account/delete', authenticate, userController.postDeleteAccount);

// Contact us
app.post('/api/contact', contactController);

// Handle Donation
app.post('/api/donate', authenticate, donationController);

// Campaigns
// Admin Stuff
// Create Campaign
app.post('/api/campaigns', authenticate, isAdmin, campaignsController.postCampaign);
// Update Campaign details
app.post('/api/campaigns/:id', authenticate, isAdmin, campaignsController.updateCampaign);

// Normal user stuff
// GET Campaigns
app.get('/api/campaigns', authenticate, campaignsController.getCampaigns);

// Register to campaign (Doctor/Patient)
app.post('/api/campaigns/:id/register', authenticate, campaignsController.registerCampaign);
// Get individual component for(Viewing/Edit) [Admin/User]
app.get('/api/campaigns/:id', authenticate, campaignsController.getCampign);

// injectTapEventPlugin();

// app.get('*', (req, res) => {
//   if (__DEV__) {
//     webpackIsomorphicTools.refresh();
//   }

//   const memoryHistory = createMemoryHistory(req.originalUrl);
//   const location = memoryHistory.createLocation(req.originalUrl);
//   const store = configureStore(memoryHistory);
//   const history = syncHistoryWithStore(memoryHistory, store);

//   function hydrateOnClient() {
//     const staticMarkup = ReactDOM.renderToStaticMarkup(
//       <Html
//         assets={ webpackIsomorphicTools.assets() }
//         store={ store }
//       />);
//     res.send(`<!doctype html>
//                   ${staticMarkup}`);
//   }

//   if (__DISABLE_SSR__) {
//     hydrateOnClient();
//     return;
//   }

//   match({ history, routes: getRoutes(store), location }, (error, redirectLocation, renderProps) => {
//     if (redirectLocation) {
//       res.redirect(redirectLocation.pathname + redirectLocation.search);
//     } else if (error) {
//       res.status(500);
//       hydrateOnClient();
//     } else if (renderProps) {
//       const { dispatch, getState } = store;

//       const locals = {
//         path: renderProps.location.pathname,
//         query: renderProps.location.query,
//         params: renderProps.params,
//         dispatch,
//         getState
//       };

//       const { components } = renderProps;

//       trigger('fetch', components, locals).then(() => {
//         const muiTheme = getMuiTheme({
//           userAgent: req.headers['user-agent'],
//         });

//         const component = (
//           <MuiThemeProvider muiTheme={ muiTheme }>
//             <Provider store={ store } key="provider">
//               <RouterContext { ...renderProps } />
//             </Provider>
//           </MuiThemeProvider>
//         );

//         res.status(200);
//         global.navigator = { userAgent: req.headers['user-agent'] };
//         res.send('<!doctype html>\n' + // eslint-disable-line
//           ReactDOM.renderToString(
//             <Html
//               assets={ webpackIsomorphicTools.assets() }
//               component={ component }
//               store={ store }
//             />
//           ));
//       }).catch((mountError) => {
//         debug(mountError.stack);
//         return res.status(500);
//       });
//     } else {
//       res.status(404).send('Not found');
//     }
//   });
// });

/**
 * Error Handler.
 */
app.use(errorHandler());

const PORT = 4500;
server.listen(PORT, (err) => {
  console.log(`🚀  Web server listening in ${process.env.NODE_ENV} mode on port:${PORT}`);
});
