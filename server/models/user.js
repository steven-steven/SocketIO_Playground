const mongoose = require('mongoose');
const validator = require('validator');

var User = mongoose.model('User', { //document model
    email:{
        type: String,
        required: true,
        minLength: 1,//no empty string
        trim: true,
        unique: true,
        validate: {
            //validator: (value)=>{
            //    return validator.isEmail(value);
            //},
            validator: validator.isEmail,
            message: '{VALUE} is not valid email'
        }
    },
    password: {
        type: String,
        required: true,
        minLength: 6
    },
    tokens: [{                  //array with 1 obj's property definitions
        access: {
            type: String,
            required: true
        },
        token: {
            type: String,
            required: true
        }
    }]
})

module.exports = {User};