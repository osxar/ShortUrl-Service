import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const LinksSchema = new Schema({
    longUrl: {
        type: String
    },
    shortUrl: {
        type: String,
        unique: true 
    },
    counterNumber: {
        type: Number,
    },
    createdUtc: {
        type: Date,
        default: Date.now
    }
});

const Links = mongoose.model('Links', LinksSchema);

export default Links;