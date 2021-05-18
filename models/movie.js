const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const movieSchema = new Schema({
	name:String,
	image:String,
	review:String
})

module.exports = mongoose.model('movie',movieSchema);