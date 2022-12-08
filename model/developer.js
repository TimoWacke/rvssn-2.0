const mongoose = require('mongoose');

const devSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        min: 4,
        max: 255
    },
    email: {
        type: String,
        required: true,
        min: 6,
        max: 255
    },
    permissions: {
        type: Array,
        required: true,
        default: ["Start"]
    }
});
module.exports = mongoose.model('Developer', devSchema);