const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const requestSchema = new Schema({
	title:String,
	author:{
		type:Schema.Types.ObjectId,
		ref:'User'
	},
	group:{
		type:Schema.Types.ObjectId,
		ref:'community'
	}
});


module.exports = mongoose.model('request',requestSchema);