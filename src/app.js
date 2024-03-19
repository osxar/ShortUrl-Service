import express from 'express';
import shortUrlRoutes from './routes/short.url.js'
import mongoose from 'mongoose';
import config from "../config.js";
import cors from 'cors';

const connectToDB = async () => {
    try {
        await mongoose.connect(config.db_uri, {...config.db_options})
    }catch (e) {
        console.log(e);
        process.exit(1)
    }
}

const app = express();

//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: '*',
  })
);

app.use(shortUrlRoutes);

await connectToDB();

export default app;