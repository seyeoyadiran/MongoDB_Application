const mongoose = require('mongoose');

const siteVisitSchema = new mongoose.Schema({
    date: {
        type: String,
        required: true,
        unique: true
    },
    count: {
        type: Number,
        default: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('SiteVisit', siteVisitSchema);