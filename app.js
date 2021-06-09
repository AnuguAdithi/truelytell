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
const Community = require('./models/community');

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

mongoose.connect('mongodb://localhost:27017/truely-tell',{
	useNewUrlParser : true,
	useCreateIndex: true,
	useUnifiedTopology:true
});
mongoose.set('useFindAndModify', false);

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




app.get('/',isLoggedIn,async(req,res)=>{
	
	
// 	const findMovie = await Movie.findById(req.params.id).populate({
// 		path: 'comments',
// 		populate: {
// 			path: 'author'
// 		}
// 	}).populate('author');
	
	
	
	
	// const community = await Community.find().populate({
	// 	path: 'users',
	// 	populate:{
	// 		path: 'username'
	// 	}
	// }).populate('author');
	// res.send("hi");
	// res.render('home',{user:req.user,community:community});
	Community.find({}).
	populate({
		path : 'users',
	})
		.populate('author')
		.exec(function(err,comm){
		if(err) res.send(err);
		else{
			// console.log(comm)
			res.render('home',{user:req.user,community:comm});
		}
	});
	
	
	
	
	
});

// app.get('/fakeUser',async(req,res)=>{
// 	const user = new User({
// 		email:'aaa@gmail1.com',
// 		username:'xyz'
// 	});
// 	const newUser = await User.register(user,'advitha');
// 	res.send(newUser);
// })


app.get('/books',isLoggedIn,catchAsync(async(req,res,next)=>{
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

app.get('/logout',isLoggedIn, (req, res) => {
    req.logout();
    res.redirect('/login');
	// res.rendirect('home',{user:req.user});
})

app.post('/register', (req, res) => {
	// res.send(req.body.username);
    User.register(new User({ username: req.body.username }), req.body.password, (err, user) => {
        if (err) {
            console.log(err)
            return res.render('register')
        }
        passport.authenticate("local")(req, res, () => {
            res.redirect('/')
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

app.get('/movies/new/:comId',isLoggedIn,catchAsync(async(req,res,next)=>{
	res.render('movies/new',{communityId:req.params.comId});                    //new movie changed
}));

app.get('/movies/:comId',isLoggedIn,catchAsync(async(req,res,next)=>{  
	const movies = await Movie.find({});
	Community.findById(req.params.comId).
	populate({
		path : 'moviePosts'
	}).exec(function(err,comm){
		if(err) res.send(err);
		else
		{
			res.render('movies/index',{movies,community:comm});           //changed
		}
	})
	
}));

app.get('/create',isLoggedIn,catchAsync(async(req,res,next)=>{
	// res.send(User);
	res.render('createCommunity');
}));

app.get('/join',isLoggedIn,catchAsync(async(req,res,next)=>{
	res.render('joinCommunity');
}));

app.post('/join',isLoggedIn,catchAsync(async(req,res,next)=>{
	// res.send("join page");
	const community = await Community.find({
		'title' : req.body.title
	});	
	community[0].users.push(req.user);
	await community[0].save();
	// res.send(community[0]);
	res.redirect(`/`);
}));

app.post('/create',isLoggedIn,catchAsync(async(req,res,next)=>{
	// res.send("done");
	const community = new Community({
		title : req.body.title,
		password : req.body.password,
		author : req.user._id
	});
	await community.save();
	// req.user.groups.push(community);
	await req.user.save();
	// console.log(community,req.user);
	res.redirect(`/`);
}));
//leaving a community
app.delete('/community/:id/:userId',isLoggedIn,catchAsync(async(req,res)=>{
	const{id,userId}=req.params;
	// // const {id} = req.params;
	const com = await Community.findById(id);
	const user = await User.findById(userId);
	// console.log(userId,com.author._id);
	const def = await User.find({
	username : 'default'
});
	console.log(def[0]._id) ;
	if(userId == com.author._id)
	{
		await Community.findByIdAndUpdate(id,{author:def[0]._id});
	}
	else
	{
		await Community.findByIdAndUpdate(id,{$pull: {users: userId}});
	}
	
	res.redirect('/');
}));
//deleting a community
app.delete('/community/:id',isLoggedIn,catchAsync(async(req,res)=>{
	
	
	// const{id}=req.params;
	// const {id} = req.params;
	// const moviE = await Movie.findById(id);
	// if(!moviE.author._id.equals(req.user._id)) throw new ExpressError('You need permissions to do that',400);
	// await Movie.findByIdAndDelete(req.params.id);
	// res.redirect('/movies');
	
	
	const{id}=req.params;
	const com = await Community.findById(id);
	if(!com.author._id.equals(req.user._id)) throw new ExpressError('You need permissions to do that',400);
	await Community.findByIdAndDelete(req.params.id);
	res.redirect('/');
}));




app.post('/movies/:comId',isLoggedIn,catchAsync(async(req,res,next)=>{
	
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
	
	// console.log(req.body);
	
	const movie = new Movie({
	name : req.body.name,
	image : req.body.image,
	review : req.body.review,
	author: req.user._id
	});
	const com = await Community.findById(req.params.comId);
	console.log(com);
	com.moviePosts.push(movie);    // changed post movie
	
	await movie.save();
	await com.save();
	// console.log(com);
	res.redirect(`/movies/post/${movie._id}/${com._id}`);
}));

app.get('/movies/post/:id/:comId',isLoggedIn,catchAsync(async(req,res,next)=>{
	const findMovie = await Movie.findById(req.params.id).populate({
		path: 'comments',
		populate: {
			path: 'author'
		}
	}).populate('author');
	// console.log(findMovie);
	// console.log(findMovie);
	
	res.render('movies/show',{movie:findMovie,check:req.user,comId : req.params.comId});
}));

app.get('/movies/:comId/:id/edit',isLoggedIn,catchAsync(async(req,res,next)=>{
	const {id} = req.params;
	const moviE = await Movie.findById(id);
	if(!moviE.author._id.equals(req.user._id)) throw new ExpressError('You need permissions to do that',400);
	// const {id} = req.params;
	
	
	const findMovie = await Movie.findById(req.params.id);
	res.render('movies/edit',{movie:findMovie,communityId : req.params.comId});
	// res.render('movies/new',{communityId:req.params.comId});  
		

}));

app.put('/movies/:comId/:id',isLoggedIn,catchAsync(async(req,res,next)=>{
	// res.send("It worked!!");
	// const{id} = req.params.id;
	// console.log(req.params.id,req.body);
	const {id} = req.params;
	const moviE = await Movie.findById(id);
	if(!moviE.author._id.equals(req.user._id)) throw new ExpressError('You need permissions to do that',400);
	
	const movie = {
		name : req.body.name,
		image : req.body.image,
		review : req.body.review
	};
	
	const Updatedmovie = await Movie.findByIdAndUpdate(req.params.id,movie);      // ----------try
	// console.log(Updatedmovie);
	await Community.findByIdAndUpdate(req.params.comId,{moviePosts:req.params.id});
	res.redirect(`/movies/post/${req.params.id}/${req.params.comId}`);
}));

app.delete('/movies/:comId/:id',isLoggedIn,catchAsync(async(req,res,next)=>{
	// const{id}=req.params;
	const {id} = req.params;
	const moviE = await Movie.findById(id);
	if(!moviE.author._id.equals(req.user._id)) throw new ExpressError('You need permissions to do that',400);
	await Community.findByIdAndUpdate(req.params.comId,{$pull: {moviePosts: req.params.id}});
	
	for(let comment of moviE.comments)
	{
		await Comment.findByIdAndDelete(comment);
	}
	
	await Movie.findByIdAndDelete(req.params.id);
	
	res.redirect(`/movies/${req.params.comId}`);
}));

app.post('/movies/:comId/:id/comments',isLoggedIn,catchAsync(async(req,res)=>{
	// res.send("You made it!!");

	const movie = await Movie.findById(req.params.id);
	const comment = new Comment({
		body : req.body.body,
		rating : req.body.rating,
		author : req.user._id
	});
	
	movie.comments.push(comment);
	// await Community.findByIdAndUpdate(id,{author:def[0]._id});
	
	
	// await Community.findByIdAndUpdate(req.params.comId,{$pull: {moviePosts: req.params.id}});
																					//post-comment-community
	
	// console.log(req.body,comment);
	await comment.save();
	await movie.save();
	await Community.findByIdAndUpdate(req.params.comId,{moviePosts:req.params.id});
	// console.log(movie);
	const com =await Community.findById(req.params.comId);
	console.log(com[0],com);

	// res.redirect(`/movies/${movie._id}`);
	res.redirect(`/movies/post/${req.params.id}/${req.params.comId}`);
}))

app.delete('/movies/:comId/:id/comments/:commentId',isLoggedIn,catchAsync(async(req,res)=>{
	
	const {id,commentId} = req.params;
	const commenT = await Comment.findById(commentId);
	if(!commenT.author._id.equals(req.user._id)) throw new ExpressError('You need permissions to do that',400);
	
	// const {id1} = req.params.commentId;
	const comment = await Comment.findById(commentId);
	if(!comment.author._id.equals(req.user._id)) throw new ExpressError('You need permissions to do that',400);
	
	// const {id,commentId} = req.params;
	await Movie.findByIdAndUpdate(id,{$pull: {comments: commentId}});
	await Comment.findByIdAndDelete(commentId);
	await Community.findByIdAndUpdate(req.params.comId,{moviePosts:req.params.id});
	res.redirect(`/movies/post/${req.params.id}/${req.params.comId}`);
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