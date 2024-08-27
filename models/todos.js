const mongoose = require('mongoose');

const todos = new mongoose.Schema({
    user_id:{
        required: true,
        type: String
    },
    todo: {
        required: true,
        type: String
    },
    description: {
        required: true,
        type: String
    },
    priority: {
        required: true,
        type: Number,
        min:0,
        max:5
    }
})
module.exports = mongoose.model('Todos', todos)