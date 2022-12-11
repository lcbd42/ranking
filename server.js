const express = require('express')
const app = express();

const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({extended: true}))

const path = require('path')

// ejs
app.set('view engine','ejs')

// mongoDB
const MongoClient = require('mongodb').MongoClient


// 이미지 관련..
app.use(express.static("views"))

// 로그인 관련
const passport = require('passport')
const LocalStrategy = require('passport-local')
const session = require('express-session')
app.use(session({secret : '비밀코드' , resave : true, saveUninitialized: false}))
app.use(passport.initialize())
app.use(passport.session())

// mongoDB 세팅
var db;
  MongoClient.connect("mongodb+srv://admin:qwer1234@cluster0.3hfl8um.mongodb.net/?retryWrites=true&w=majority", function(err, client){
  if (err) return console.log(err)
  // 연결할 프로젝트
  db = client.db('TeamProj_1');

  app.listen(4000, function() {
    console.log('listening on 4000')
  })
}) 


app.get('/',(req,res)=>{
    res.render('index.ejs')
})

app.get('/login',(req,res)=>{
    res.render('login.ejs')
})

app.post('/register', function (req, res) {
    db.collection('Login').insertOne({ id: req.body.id, pw: req.body.pw }, function(err, result){
        res.redirect('/')
    })
})

// 아이디 비번 검증
app.post('/login', passport.authenticate('local', {
    failureRedirect: '/fail'
    }), (req,res) => {
    res.redirect('/user')
})

// 아이디와 비번이 맞는지 db 데이터와 비교
passport.use(new LocalStrategy({
    usernameField: 'id',
    passwordField: 'pw',
    session: true,
    passReqToCallback: false,
  }, function (입력한아이디, 입력한비번, done) {
    //console.log(입력한아이디, 입력한비번);
    db.collection('Login').findOne({ id: 입력한아이디 }, function (에러, 결과) {
      if (에러) return done(에러)
  
      if (!결과) return done(null, false, { message: '존재하지않는 아이디입니다.' })
      if (입력한비번 == 결과.pw) {
        return done(null, 결과)
      } else {
        return done(null, false, { message: '비밀번호가 틀렸습니다.' })
      }
    })
}));

app.get('/user', isLogin, (req,res)=>{
    console.log(req.user._id)
    db.collection('userData').findOne({ writer: req.user._id},(err,result)=>{
        if(result==null) res.render('user.ejs',{ 저장된: "", 사용자: req.user })
        else res.render('user.ejs',{ 저장된: result, 사용자: req.user })
    })

})

function isLogin(req,res,next){
    if(req.user){
        next()
    }else{
        res.send('로그인안하셨는데요?')
    }
}

// 세션을 저장시키는 코드(로그인 성공시 실행)
passport.serializeUser(function (user, done){
    // id를 이용해서 세션을 저장
    done(null, user.id)     
});

// 마이페이지 접속시 실행
passport.deserializeUser(function (아이디, done) {
    db.collection('Login').findOne({ id: 아이디}, (err,결과)=>{
        done(null, 결과)
    })
});


// 사용자 데이터 초기화 및 저장 <- 모든 데이터 다 저장할 수 없음
app.post('/add', (req,res)=>{
    // 전체 삭제
    var del = { writer : req.user._id }
    db.collection('userData').deleteMany(del, (err,result)=>{
        console.log('사용자데이터 초기화 완료')
        if(err) console.log(err)

        // 저장
        var save = { saved: req.body.input, writer: req.user._id }
        db.collection('userData').insertOne(save,function(err,result){
            console.log('사용자데이터 DB에 저장완료')
            res.redirect('/user')
        })
    })
})

app.get('/btn',(req,res)=>{
    res.render('btn.ejs')
})

app.get('/share',(req,res)=>{
    res.render('share.ejs')
})

app.post('/share',(req,res)=>{
    db.collection('shareData').insertOne({ title:req.body.title, idea:req.body.idea, comment:req.body.comment }, (err,result)=>{
        if(err) return console.log(err)
    })
    res.redirect('/btn')
})

app.get('/list',(req,res)=>{
    db.collection('shareData').find().toArray(function(err,result){
        // console.log(result)
        res.render('list.ejs',{ datas : result })
    });
})

app.post('/page',(req,res)=>{
    console.log(req.body)
    var id = 'ObjectId(\''+req.body._id+'\')'
    console.log(id)
    db.collection('shareData').findOne({ _id:id }, (err,result)=>{
        console.log(result)
        // res.render('page.ejs', { datas : result})
    })
})

app.get('/my',(req,res)=>{
    res.render('my.ejs')
})

app.get('/bro',(req,res)=>{
    res.render('bro.ejs')
})

app.get('/res',(req,res)=>{
    res.render('res.ejs')
})