const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
    header: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    section: {
        type: String,
        required: true,
    },
    date: {
        type: String,
        required: true,
    },
    hideDate: {
        type: Boolean,
        required: false,
    },  
    text: {
        type: String,
        required: true,
    },
    time: {
        type: Date,
        default: Date.now
    },
    author: {
        type: String,
        required: true,
    },
    img: {
        type: String,
    },
    pdf: {
        type: String
    }
});

module.exports = mongoose.model('Article', articleSchema);