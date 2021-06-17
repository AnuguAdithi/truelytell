const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const passportLocalMongoose = require("passport-local-mongoose");

// const userSchema = new Schema({
// 	email:{
// 		type:String,
// 		required:true,
// 		unique:true
// 	}
// });


var userSchema = mongoose.Schema({
	username: String,
	password: String,
	requests:[
		{
			type:Schema.Types.ObjectId,
			ref: 'request'
		}
	]
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User',userSchema);
