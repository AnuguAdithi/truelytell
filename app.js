const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const catchAsync = require('./utils/catchAsyn'); //error handling part
const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override');
const Movie = require('./models/movie');

mongoose.connect('mongodb://localhost:27017/truely-tell',{
	useNewUrlParser : true,
	useCreateIndex: true,
	useUnifiedTopology:true
});

const db = mongoose.connection;
db.on("error",console.error.bind(console,"connection error:"));
db.once("open",()=>{
	console.log("Database connected");
});

app.engine('ejs',ejsMate) // for templates
app.set('view engine','ejs'); //no need of explicitly specifyinh .ejs
app.set('views',path.join(__dirname,'views'))//access views folder directly

app.use(express.urlencoded({extended:true}))
app.use(methodOverride('_method'));


app.get('/',(req,res)=>{
	res.render('home');
});

app.get('/movies',catchAsync(async(req,res,next)=>{
	const movies = await Movie.find({});
	res.render('movies/index',{movies})
}));
app.get('/movies/new',catchAsync(async(req,res,next)=>{
	res.render('movies/new');
}));

app.post('/movies',catchAsync(async(req,res,next)=>{
	
	if(!req.body.movies) throw new ExpressError('Invalid Movie Review ',400); //for missing data
	const movie = new Movie(req.body.movie);
	await movie.save();
	res.redirect(`/movies/${movie._id}`)
}));

app.get('/movies/:id',catchAsync(async(req,res,next)=>{
	const findMovie = await Movie.findById(req.params.id);
	res.render('movies/show',{movie:findMovie});
}));

app.get('/movies/:id/edit',catchAsync(async(req,res,next)=>{
	const findMovie = await Movie.findById(req.params.id);
	res.render('movies/edit',{movie:findMovie});
}));

app.put('/movies/:id',catchAsync(async(req,res,next)=>{
	// res.send("It worked!!");
	const{id} = req.params;
	const movie = await Movie.findByIdAndUpdate(id,{...req.body.movie});
	res.redirect(`/movies/${movie._id}`)
}));

app.delete('/movies/:id', catchAsync(async(req,res,next)=>{
	const{id}=req.params;
	await Movie.findByIdAndDelete(req.params.id);
	res.redirect('/movies');
}));

app.all('*',(req,res,next)=>{
	next(new ExpressError('Page not found',404));
})

app.use((err,req,res,next)=>{
	// res.send("Error page!!!");
	const { statusCode=500, message="Something went wrong!!!"} = err;

	res.status(statusCode).render('error',{err});
	
})


app.listen(3000,()=>{
	console.log("Serving on port 3000");
});