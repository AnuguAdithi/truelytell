const mongoose = require('mongoose');
const Comment = require('./comment');
const Schema = mongoose.Schema;


const movieSchema = new Schema({
	name:String,
	image:{
		url:String,
		filename:String
	},
	review:String,
	date : Date,
	author:{
		type:Schema.Types.ObjectId,
		ref:'User'
	},
	
	comments:[
		{
			type:Schema.Types.ObjectId,
			ref: 'Comment'
		}
	]
});

// movieSchema.post('findOneAndDelete',async function(doc){
// 	// console.log("you reached!!")
// 	if(doc){
// 		await Comment.remove({
// 			_id:{
// 				$in: doc.comments
// 			}
// 		})
// 	}
// })

module.exports = mongoose.model('movie',movieSchema);