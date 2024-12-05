import express from 'express';
import morgan from "morgan";
import cors from "cors"
import rateLimit from "express-rate-limit";
import xssClean from "xss-clean";
import mongoSanitize from "express-mongo-sanitize";
import dotenv from 'dotenv';
dotenv.config();

import userRouter from './routes/auth.routes.js';
import expenseRouter from './routes/expense.routes.js';
import budgetRouter from './routes/budget.routes.js';

const app = express();
app.use(cors());
app.options('*', cors())

if (process.env.NODE_ENV === "development") {
    app.use(morgan('dev'));
  }


app.use(morgan("dev"))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// XSS protection middleware
app.use(xssClean());

  
app.get('/', (req, res) => {
    res.send('Welcome to Trackeet!')
});

// Define rate limiter options
const limiter = rateLimit({
    windowMs: 10 * 1000, // 10 seconds
    max: 7, // maximum of 5 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
    keyGenerator: function (req, res) {
      // Generate a unique key using the user token (assuming it's stored in the request header)
      return req.headers.authorization || req.ip;
    },
  });
  
  // Apply rate limiter middleware to endpoints matching the prefix
  app.use("/api/v1/*", limiter);

// MongoDB query sanitizer middleware
app.use(mongoSanitize());


app.use('/api/v1/user', userRouter);
app.use('/api/v1/expense', expenseRouter);
app.use('/api/v1/budget', budgetRouter);

export default app;






































// import userRoute from './resources/user/routes/userRoutes.js';
// const app = express();




// app.get("/", (req, res) => {
//   res.send("Welcome to Project X ");
// });


// app.get("/", (req, res) => {
//   res.send("Welcome to Project X");
// });



// app.use("/api/v1/user", userRoute);



