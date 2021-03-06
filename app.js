if(process.env.NODE_ENV !== "production"){
	require('dotenv').config();
}
// console.log(process.env.SECRET);

const express = require('express');
const app = express();
const session = require('express-session');
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
const Request = require('./models/request');
var moment = require('moment');


// for cloudinary
const multer = require('multer');
const {storage} = require('./cloudinary');
const upload = multer({storage});
var { cloudinary } = require('./cloudinary');


// for authentication
const passport = require('passport');
var LocalStatergy = require('passport-local'); //middle-eare for authentucation
var passportLocalMongoose = require('passport-local-mongoose');

// const MongoDBStore = require('connect-mongo')(session);
const dbUrl = process.env.DB_URL||'mongodb://localhost:27017/truely-tell';



// 'mongodb://localhost:27017/truely-tell'
mongoose.connect(dbUrl,{
// mongoose.connect('mongodb://localhost:27017/truely-tell',{
	// useNewUrlParser : true,
	// useCreateIndex: true,
	// useUnifiedTopology:true,
	
	useNewUrlParser: true,
	useCreateIndex: true,
	useUnifiedTopology: true,
	useFindAndModify: false,
	
});
mongoose.set('useFindAndModify', false);

const db = mongoose.connection;
db.on("error",console.error.bind(console,"connection error:"));
db.once("open",()=>{
	console.log("Database connected");
});

// mongoose.connect('mongodb://localhost:27017/truely-tell',{
// 	useNewUrlParser : true,
// 	useCreateIndex: true,
// 	useUnifiedTopology:true
// });
// mongoose.set('useFindAndModify', false);

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

// const store = new MongoStore({
// 	url:dbUrl,
// 	secret : "nothing",
// 	touchAfter: 24*60*60
// });
// store.on("error",function(e){
// 	console.log("Session store error!!");;
// })

const secret = process.env.SECRET || "nothing";

app.use(require("express-session")({
	// store,
	secret ,
	resave: false,
	saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStatergy(User.authenticate()));
//getting the user into and out
passport.serializeUser(User.serializeUser());

passport.deserializeUser(User.deserializeUser());

app.use(async function(req,res,next) {
	if(req.user)
	{
		User.findById(req.user._id).
	populate({
		path : 'requests',
	}).exec(function(err,comm){
			if(err) 
				res.send(err);
			else{
				// console.log(comm);
				res.locals.user = comm;
				res.locals.currentUser = req.user;
	res.locals.moment = require('moment');
				next();
		}
	});
	
	}
	else{
		res.locals.user = await User.find({
			username : 'default'
		})[0];

		res.locals.currentUser = req.user;
	res.locals.moment = require('moment');
	
		next();

	}
});

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
			// res.locals.comm = comm;
			res.render('home',{community:comm});
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

//request routes
app.get('/movies/request/:comId',isLoggedIn,catchAsync(async(req,res,next)=>{
	
	
	Community.findById(req.params.comId).
	populate({
		path : 'users'
	}).
	populate({
		path : 'author'
	}).exec(function(err,comm){
		if(err) res.send(err);
		else
		{
			Community.find({})
			.populate('author')
				.exec(function(err,comm1){
				if(err) res.send(err);
				else{
					
					res.render('movies/request',{community:comm,comm:comm1,communityId:req.params.comId,userr:req.user,msg:"place a request to know review!!"});
				 }
			});
			// res.render('movies/index',{movies,community:comm});           //changed
		}
	});
	
	
	// res.render('movies/request',{communityId:req.params.comId});   
}));

app.post('/movies/request/:comId',isLoggedIn,catchAsync(async(req,res,next)=>{
	const community = await Community.findById(req.params.comId);
	
		const request = new Request({
		title : req.body.title,
		author : req.user._id,
		group : req.params.comId
		// date :
		});

	// console.log(community);
	const com = await Community.findById(community._id).populate({
		path : 'moviePosts',
	}).populate('author');
	// console.log(com);
	for(let post of com.moviePosts)
	{
		if(post.name.trim().toLowerCase() == request.title.trim().toLowerCase())
		{
			res.redirect(`/movies/post/${post._id}/${req.params.comId}`)
		}
	}
	
	const searchReq = await Request.find({
		title : req.body.title
	});
	console.log(searchReq.length);
	if(searchReq.length != 0)
	{
		Community.findById(req.params.comId).
	populate({
		path : 'users'
	}).
	populate({
		path : 'author'
	}).exec(function(err,comm){
		if(err) res.send(err);
		else
		{
			Community.find({})
			.populate('author')
				.exec(function(err,comm1){
				if(err) res.send(err);
				else{
					
					res.render('movies/request',{community:comm,comm:comm1,communityId:req.params.comId,userr:req.user,msg:`request for ${req.body.title} is already made`});
				 }
			});
			// res.render('movies/index',{movies,community:comm});           //changed
		}
	});	
	
	}
	else{
	
	
	
	
	for(let id of community.users)
	{
		// if(req.user._id != id)
		// {
		
			const user = await User.findById(id);
		
			user.requests.push(request);
			await user.save();
		// }
	}
	// if(req.user._id != community.author._id)
	// {
		const user = await User.findById( community.author._id);
		user.requests.push(request);
		await user.save();
	// }
		await request.save(); 
	res.redirect(`/movies/${req.params.comId}`);
	}
}));

////////////delete request

app.delete('/movies/:comId/request/:reqId',isLoggedIn,catchAsync(async(req,res)=>{
	
	
// 	const {id,commentId} = req.params;
// 	const commenT = await Comment.findById(commentId);
// 	if(!commenT.author._id.equals(req.user._id)) throw new ExpressError('You need permissions to do that',400);
	
// 	// const {id1} = req.params.commentId;
// 	const comment = await Comment.findById(commentId);
// 	if(!comment.author._id.equals(req.user._id)) throw new ExpressError('You need permissions to do that',400);
	
// 	// const {id,commentId} = req.params;
// 	await Movie.findByIdAndUpdate(id,{$pull: {comments: commentId}});
// 	await Comment.findByIdAndDelete(commentId);
// 	await Community.findByIdAndUpdate(req.params.comId,{moviePosts:req.params.id});
// 	res.redirect(`/movies/post/${req.params.id}/${req.params.comId}`);
// 	// res.send("Delete Me!!");
	
	
	
	// console.log(req.user);
	const {comId,reqId} = req.params;
	const request = await Request.findById(reqId);
	

	await User.findByIdAndUpdate(req.user._id,{$pull: {requests: reqId}});
	// await Request.findByIdAndDelete(reqId);
	// console.log(req.user,request);
	res.redirect(`/movies/${comId}`);
	
}));



app.get('/movies/:comId',isLoggedIn,catchAsync(async(req,res,next)=>{
	
	// const movieName = req.body.title;
	// console.log(req.body.title);
	const movies = await Movie.find({});
	
	
	const findMovie = await Movie.find({}).populate({
		path: 'comments',
		populate: {
			path: 'author',
		}
	}).populate('author');
	// console.log(findMovie);
	
	// if(movieName)
	// {
	// 	movies = await Movie.find({
	// 		name:movieName                                                                   // TO BE CHANGED
	// 	});
	// 	// console.log(movies);
	// }
	// console.log(movieName,movies);
	
	const users = await User.find({});
	// console.log("index page!!");
	Community.findById(req.params.comId).
	populate({
		path : 'moviePosts',
		// path : 'users'
	}).
	populate({
		path : 'users'
	}).
	populate({
		path : 'author'
	}).exec(function(err,comm){
		if(err) res.send(err);
		else
		{
			
			Community.find({})
			.populate('author')
				.exec(function(err,comm1){
				if(err) res.send(err);
				else{
					
					// console.log(comm);
					res.render('movies/index',{community:comm,comm:comm1,userr:req.user,users,movies,checkingId:req.params.comId});
				}
			});
			// res.render('movies/index',{movies,community:comm});           //changed
		}
	})
}));



app.post('/movies/:comId/search',isLoggedIn,catchAsync(async(req,res,next)=>{
	
	const movieName = req.body.title.trim().toLowerCase();
	// console.log(req.body.title);
	let movies = await Movie.find({});
	let movieSearch =[];
	if(movieName)
	{
		
		// movies = await Movie.find({
		// 	name:movieName
		// });
		// console.log(movies);
		// console.log(movies);
		
		
		for(let post of movies)
		{
			if(post.name.trim().toLowerCase() == movieName)
			{
				movieSearch.push(post);
			}
		}
	}
	// console.log(movieName,movies);
	// if(movies.length!=0)
	// {
		// console.log(movies,movies.length);
	const users = await User.find({});
	// console.log("index page!!");
	Community.findById(req.params.comId).
	populate({
		path : 'moviePosts'
	}).
	populate({
		path : 'users'
	}).
	populate({
		path : 'author'
	}).exec(function(err,comm){
		if(err) res.send(err);
		else
		{
			Community.find({})
			.populate('author')
				.exec(function(err,comm1){
				if(err) res.send(err);
				else{
					// console.log(movieSearch);
					res.render('movies/index',{community:comm,comm:comm1,userr:req.user,users,movies:movieSearch,checkingId:req.params.comId});
				}
			});
			// res.render('movies/index',{movies,community:comm});           //changed
		}
	})
	// }
	// else{
		// res.send("No movies!!!");
	// }
}));


app.get('/create',isLoggedIn,catchAsync(async(req,res,next)=>{
	// res.send(User);
	res.render('createCommunity',{msg:"Create a community to request for a review or share a review"});
}));

app.get('/join',isLoggedIn,catchAsync(async(req,res,next)=>{
	res.render('joinCommunity',{msg:"Join a community to request for a review or share a review"});
}));

app.post('/join',isLoggedIn,catchAsync(async(req,res,next)=>{
	// res.send("join page");
	const community = await Community.find({
		'title' : req.body.title
	});	
	
	// console.log(community[0].password);
	
	// console.log(community[0].users,community[0].author,req.user._id);
	
	if(community.length == 0)
		res.render('joinCommunity',{msg:"No such community exists, enter correct details"});
		
	else if(community[0].users.includes(req.user._id) || community[0].author==req.user._id)
		res.redirect('/');
	
	else if(community[0].password==(req.body.password))
	{
		community[0].users.push(req.user);
	await community[0].save();
		res.redirect(`/`);
		// res.render('joinCommunity',{msg:"incorrect details, enter correct details to join a community"});
	}
	else{
		res.render('joinCommunity',{msg:"Incorrect community name or password.Try again"});
	}
	
}));

app.post('/create',isLoggedIn,catchAsync(async(req,res,next)=>{
	// res.send("done");
	const community = new Community({
		title : req.body.title,
		password : req.body.password,
		author : req.user._id
	});
	const community1 = await Community.find({
		'title' : req.body.title
	});	
	
	if(community1.length == 0)
		{
			await community.save();
			await req.user.save();
			res.redirect(`/`);
			
		}
	else{
		res.render('createCommunity',{msg:`community already exists with ${req.body.title} name`});
	}
		
	
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
	// console.log(def[0]._id) ;
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

//removing a person from community
app.delete('/movies/:comId/:userId',isLoggedIn,catchAsync(async(req,res)=>{
	var com = await Community.findById(req.params.comId);
	// const {id,userId} = req.params;
	await Community.findByIdAndUpdate(req.params.comId,{$pull: {users: req.params.userId}});
	
	res.redirect(`/movies/${req.params.comId}`);
	
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


//movie - post route

app.post('/movies/:comId',isLoggedIn,upload.single('image'),catchAsync(async(req,res,next)=>{	
	// console.log(req.body,req.file);
	// res.send("done");
	
	const movie = new Movie({
	name : req.body.name.trim(),
	image : {
		url:req.file.path,
		filename:req.file.filename
	},
	review : req.body.review,
	author: req.user._id,
	date: new Date()
	});
	// console.log(movie);
	const com = await Community.findById(req.params.comId);
	com.moviePosts.push(movie);   
	
	
	const request = await Request.find().populate({
		path: 'groups',
		populate:{
			path: 'title'
		}
	});
	
	const community = await Community.findById(com._id).populate({
		path : 'users',
	}).populate('author');
	
	// console.log(community);
	
	
	for(let req of request)
	{
		if(req.title.trim().toLowerCase() == movie.name.trim().toLowerCase() && req.group.equals(com._id))
		{
			await Request.findByIdAndDelete(req._id);
			for(let delUser of community.users)
			{
				await User.findByIdAndUpdate(delUser._id,{$pull: {requests: req._id}});
			}
			await User.findByIdAndUpdate(community.author._id,{$pull: {requests: req._id}});
			break;
		}
	}
	
	
	
	await movie.save();
	await com.save();
	res.redirect(`/movies/post/${movie._id}/${com._id}`);
}));

app.get('/movies/post/:id/:comId',isLoggedIn,catchAsync(async(req,res,next)=>{
	const findMovie = await Movie.findById(req.params.id).populate({
		path: 'comments',
		populate: {
			path: 'author',
		}
	}).populate('author');
	// console.log(findMovie);
	// console.log(findMovie);
	// console.log("required page!!!!!");                    ////////required page!!!!!!!!!!!!!!!!1
	res.render('movies/show',{movie:findMovie,comId : req.params.comId}); //check ->user
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

app.put('/movies/post/:comId/:id',isLoggedIn,upload.single('image'),catchAsync(async(req,res,next)=>{
	// res.send("It worked!!");
	// const{id} = req.params.id;
	// console.log(req.params.id,req.body);
	const {comId,id} = req.params;
	const moviE = await Movie.findById(id);
	
	if(!moviE.author._id.equals(req.user._id)) throw new ExpressError('You need permissions to do that',400);
	
	const movie = {
		name : req.body.name,
		image : {
		url:req.file.path,
		filename:req.file.filename
	},
		review : req.body.review
	};
	
	const Updatedmovie = await Movie.findByIdAndUpdate(id,movie);      // ----------try
	// console.log(Updatedmovie);

	
	// let movies = await Community.findById(comId).moviePosts;
	
	let community = await Community.findById(comId);
	// console.log(community.moviePosts);
	// await Community.findByIdAndUpdate(comId,{moviePosts:Updatedmovie});
	
	res.redirect(`/movies/post/${id}/${comId}`);
}));

app.delete('/movies/post/:comId/:id',isLoggedIn,catchAsync(async(req,res,next)=>{
	// const{id}=req.params;
	const {id} = req.params;
	
	const moviE = await Movie.findById(id);
	if(!moviE.author._id.equals(req.user._id)) throw new ExpressError('You need permissions to do that',400);
	await Community.findByIdAndUpdate(req.params.comId,{$pull: {moviePosts: req.params.id}});
	
	for(let comment of moviE.comments)
	{
		await Comment.findByIdAndDelete(comment);
	}
	await cloudinary.uploader.destroy(moviE.image.filename);
	await Movie.findByIdAndDelete(req.params.id);
	
	res.redirect(`/movies/${req.params.comId}`);
}));

app.post('/movies/:comId/:id/comments',isLoggedIn,catchAsync(async(req,res)=>{
	// res.send("You made it!!");

	const movie = await Movie.findById(req.params.id);
	const comment = new Comment({
		body : req.body.body,
		rating : req.body.rating,
		author : req.user._id,
		date: new Date()
	});
	
	movie.comments.push(comment);
	// await Community.findByIdAndUpdate(id,{author:def[0]._id});
	
	
	// await Community.findByIdAndUpdate(req.params.comId,{$pull: {moviePosts: req.params.id}});
																					//post-comment-community
	
	// console.log(req.body,comment);
	await comment.save();
	await movie.save();
	// await Community.findByIdAndUpdate(req.params.comId,{moviePosts:req.params.id});
	// console.log(movie);
	const com =await Community.findById(req.params.comId);
	// console.log(com[0],com);

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
	// await Community.findByIdAndUpdate(req.params.comId,{moviePosts:req.params.id});
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

const port = process.env.PORT || 3000;

app.listen(port,()=>{
	console.log(`Serving on port ${port}`);
});