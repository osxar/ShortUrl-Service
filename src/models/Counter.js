import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const CounterSchema = new Schema({
    counter: {
        type: Number,
    }
});

const Counter = mongoose.model('Counter', CounterSchema);

export default Counter;