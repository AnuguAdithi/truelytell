const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const communitySchema = new Schema({
	title:{
		type: String,
		unique:true
	},
	password:String,
	author:{
		type:Schema.Types.ObjectId,
		ref:'User'
	},
	users:[
		{
			type:Schema.Types.ObjectId,
			ref: 'User'
		}
	],
	moviePosts:[
		{
			type:Schema.Types.ObjectId,
			ref: 'movie'
		}
	]
});

module.exports = mongoose.model('community',communitySchema);