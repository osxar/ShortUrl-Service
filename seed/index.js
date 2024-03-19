import mongoose from 'mongoose';
import Counter from '../src/models/Counter.js';
import config from '../config.js';
config
mongoose.connect(config.db_uri, {
   ...config.db_options
});
    
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});


const seedDB = async () => {
    await Counter.deleteMany();
    
    const counter = new Counter(
        {
            counter: 100000000000
        }
    );
    await counter.save(); 
}

seedDB().then(() => {
    mongoose.connection.close();
})
