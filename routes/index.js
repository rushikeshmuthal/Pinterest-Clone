var express = require('express');
var router = express.Router();
const userModel = require("./users")
const postModel = require("./posts")
const LocalStrategy = require("passport-local").Strategy;
const passport = require('passport');
const upload = require('./multer');
passport.use(new LocalStrategy(userModel.authenticate()))


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
router.get('/login', function(req, res) {
  // console.log(req.flash("error"));
  res.render('login',{error: req.flash("error")});
});

router.get("/profile", isloggedIn,async function(req,res,next){
  const user =await userModel.findOne({
    username:req.session.passport.user
  })
  .populate('posts')
  console.log(user);
  res.render('profile',{user});

})
router.get('/feed', function(req, res) {
  res.render('feed');
});

router.post('/upload',isloggedIn, upload.single('file'),async(req,res)=> {
  if(!req.file){
    return res.status(400).send('No files were uploaded')
  }
  //getting hold of the user who is logged in, to associate it with new post
  const user = await userModel.findOne({username : req.session.passport.user})

  //creating the  new Post object with file name and owner info
 const post = await postModel.create({
    image:req.file.filename,
    postText:req.body.filedescription,
    user:user._id
  })
  //pushing this newly created post into users posts array
   user.posts.push(post._id)
   await user.save()
  res.redirect("/profile")
})

router.post("/register", function(req,res){
  const { username, email, fullName } = req.body;
  const userData = new userModel({ username,  email, fullName });

  userModel.register(userData,req.body.password)
  .then(function(){
    passport.authenticate('local')(req,res,function(){
      res.redirect('/profile')
    }
    )  })
  
})
router.post("/login", passport.authenticate('local',{
  successRedirect:"/profile",
  failureRedirect:"/login",
  failureFlash:true
}),function(req,res){})

router.get("/logout", function(req,res){
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
})
 
function isloggedIn(req,res,next){
  if(req.isAuthenticated()) return next();
  res.redirect("/login")
}

module.exports = router;
