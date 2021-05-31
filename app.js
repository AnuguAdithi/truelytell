const express = require('express');
const app = express();
// const session = require('express-session');
const path = require('path');
var cookieParser = require('cookie-parser'); // form input 
const mongoose = require('mongoose');
var bodyParser = require('body-parser'); // form input
const ejsMate = require('ejs-mate'); //boilerplates

const Joi = require('joi'); //for server side validations

const catchAsync = require('./utils/catchAsyn'); //error handling part
const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override');
const Movie = require('./models/movie');
const User = require('./models/user');
const Comment = require('./models/comment');

// for authentication
const passport = require('passport');
var LocalStatergy = require('passport-local'); //middle-eare for authentucation
var passportLocalMongoose = require('passport-local-mongoose');


mongoose.connect('mongodb://localhost:27017/truely-tell',{
	useNewUrlParser : true,
	useCreateIndex: true,
	useUnifiedTopology:true
});
mongoose.set('useFindAndModify', false);

const db = mongoose.connection;
db.on("error",console.error.bind(console,"connection error:"));
db.once("open",()=>{
	console.log("Database connected");
});

app.engine('ejs',ejsMate) // for templates
app.set('view engine','ejs'); //no need of explicitly specifying .ejs

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(cookieParser());
app.set('views',path.join(__dirname,'views'))//access views folder directly

app.use(express.urlencoded({extended:true}))
app.use(methodOverride('_method'));

//server side validations middleware
// const validateMovie = (req,res,next)=>{
// 	const movieSchema = Joi.object({
// 		movie : Joi.object({
// 			name: Joi.string().required(),
// 			image: Joi.string().required(),
// 			review: Joi.string().required().min(1),
// 		}).required()
// 	})
// 	const error = movieSchema.validate(req.body);
// 	if(error){
// 		const msg = error.details.map(el => el.message).join(',');
// 		throw new ExpressError(msg,400);
// 	}
// 	else{
// 		next();
// 	}
// }


// const sessionConfig={
// 	secret: 'secret',
// 	resave: false,
// 	saveUninitialized: true,
// 	cookie:{
// 		httpOnly: true,
// 		expires: Date.now()+1000*60*60*24*7,
// 		maxAge: 1000*60*60*24*7
// 	}
// }

// app.use(session(sessionConfig));


app.use(require("express-session")({
	secret : "nothing",
	resave: false,
	saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStatergy(User.authenticate()));
//getting the user into and out
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.get('/',isLoggedIn,(req,res)=>{
	res.render('home');
	
});

// app.get('/fakeUser',async(req,res)=>{
// 	const user = new User({
// 		email:'aaa@gmail1.com',
// 		username:'xyz'
// 	});
// 	const newUser = await User.register(user,'advitha');
// 	res.send(newUser);
// })


app.get('/books',catchAsync(async(req,res,next)=>{
	res.send("Page Yet to design!!!");
}));

app.get('/register',catchAsync(async(req,res,next)=>{
	res.render('register');
}));


// app.get("/home",isLoggedIn,function(req,res){
// 	res.render("home");
// })

app.get('/login', (req, res) => {
    res.render('login');
})

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
})

app.post('/register', (req, res) => {
	// res.send(req.body.username);
    User.register(new User({ username: req.body.username }), req.body.password, (err, user) => {
        if (err) {
            console.log(err)
            return res.render('register')
        }
        passport.authenticate("local")(req, res, () => {
            res.redirect('/movies')
        })
    })
})

app.post('/login', passport.authenticate("local", {
    successRedirect: '/',
    failureRedirect: '/register'
}), (req, res) => { })


function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect('/login');
};

app.get('/movies/new',catchAsync(async(req,res,next)=>{
	res.render('movies/new');
}));

app.get('/movies',catchAsync(async(req,res,next)=>{
	const movies = await Movie.find({});
	res.render('movies/index',{movies})
}));

app.post('/movies',catchAsync(async(req,res,next)=>{
	
	// if(!req.body.movies) throw new ExpressError('Invalid Movie Review ',400); //for missing data
	// const movieSchema = Joi.object({
	// 	movie : Joi.object({
	// 		name: Joi.string().required(),
	// 		image: Joi.string().required(),
	// 		review: Joi.string().required().min(1),
	// 	}).required()
	// })
	// const result = movieSchema.validate(req.body);
	// console.log(result);
	
	console.log(req.body);
	const movie = new Movie({
	name : req.body.name,
	image : req.body.image,
	review : req.body.review
	});
	await movie.save();
	res.redirect(`/movies/${movie._id}`);
}));

app.get('/movies/:id',catchAsync(async(req,res,next)=>{
	const findMovie = await Movie.findById(req.params.id).populate('comments');
	// console.log(findMovie);
	res.render('movies/show',{movie:findMovie});
}));

app.get('/movies/:id/edit',catchAsync(async(req,res,next)=>{
	const findMovie = await Movie.findById(req.params.id);
	res.render('movies/edit',{movie:findMovie});
}));

app.put('/movies/:id',catchAsync(async(req,res,next)=>{
	// res.send("It worked!!");
	// const{id} = req.params.id;
	// console.log(req.params.id,req.body);
	
	const movie = {
		name : req.body.name,
		image : req.body.image,
		review : req.body.review
	};
	
	const Updatedmovie = await Movie.findByIdAndUpdate(req.params.id,movie);
	// console.log(Updatedmovie);
	res.redirect(`/movies/${Updatedmovie._id}`);
}));

app.delete('/movies/:id', catchAsync(async(req,res,next)=>{
	const{id}=req.params;
	await Movie.findByIdAndDelete(req.params.id);
	res.redirect('/movies');
}));

app.post('/movies/:id/comments',catchAsync(async(req,res)=>{
	// res.send("You made it!!");
	const movie = await Movie.findById(req.params.id);
	const comment = new Comment({
		body : req.body.body,
		rating : req.body.rating
	});
	
	movie.comments.push(comment);
	// console.log(req.body,comment);
	await comment.save();
	await movie.save();
	// console.log(movie);
	res.redirect(`/movies/${movie._id}`);
}))

app.delete('/movies/:id/comments/:commentId',catchAsync(async(req,res)=>{
	const {id,commentId} = req.params;
	await Movie.findByIdAndUpdate(id,{$pull: {comments: commentId}});
	await Comment.findByIdAndDelete(commentId);
	res.redirect(`/movies/${id}`);
	// res.send("Delete Me!!");
}))

app.all('*',(req,res,next)=>{
	next(new ExpressError('Page not found',404));
});

app.use((err,req,res,next)=>{
	// res.send("Error page!!!");
	const { statusCode=500, message="Something went wrong!!!"} = err;
	res.status(statusCode).render('error',{err});
});


app.listen(process.env.PORT || 3000,()=>{
	console.log("Serving on port 3000");
});