import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const ActivitiesSchema = new Schema({
    url: {
        type: Schema.Types.ObjectId,
        ref: 'Links'
    },
    requestTime: {
        type: Number,
    },
    createdUtc: {
        type: Date,
        default: Date.now
    }
});

const Activities = mongoose.model('Activities', ActivitiesSchema);
export default Activities;