
// Import package

var mongodb = require('mongodb');
var ObjectID = mongodb.ObjectID;
var crypto = require('crypto');
var express = require('express');
var bodyParser = require('body-parser');

var five =require('johnny-five');
var board=new five.Board();

board.on('ready',function(){
    var led=new five.Led(13);
    led.blink(500);});

class Event {

    constructor(eventId, userId, text, date){
        this.eventId = eventId;
        this.userId = userId;
        this.text = text;
        this.date = date;
    }
}

//Password ultils
//create fucntion to random salt
var getRandomString = function(lenght){
    return crypto.randomBytes(Math.ceil(lenght/2)).toString('hex').slice(0, lenght); //convert to hexa format
};

var sha512 = function(password, salt){
    var hash = crypto.createHmac('sha512', salt);
    hash.update(password);
    var value = hash.digest('hex');
    return {
        salt: salt,
        passwordHash: value
    };
};

function saltHashPassword(userPassword){
    var salt = getRandomString(16); //Create 16 random character
    var passwordData = sha512(userPassword, salt);
    return passwordData;
}

function checkHashPassword(userPassword, salt){
    var passwordData = sha512(userPassword, salt);
    return passwordData;
}

function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

//Create Express Service
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

//Create MongoDB Client
var MongoClient = mongodb.MongoClient;

//Connection URL
var url = 'mongodb://localhost:27017' //27017 is default post

MongoClient.connect(url, {useUnifiedTopology: true}, function(err, client){
    if(err)
        console.log('Unable to connect to the mongoDB server.Error', err);
    else{

        //Register

        app.post('/register', (request, response, next)=> {
            var post_data = request.body;

            var plaint_password = post_data.password;
            var hash_data = saltHashPassword(plaint_password);

            var password = hash_data.passwordHash; // Save password hash
            var salt = hash_data.salt; //Save salt

            var name = post_data.name;
            var email = post_data.email;

            var insertJson = {
                'email': email,
                'password': password,
                'salt': salt,
                'name': name
            };

            var db = client.db('cocoworkingdb');

            //check exists email
            db.collection('user').find({'email' : email}).count(function(err, number) {
                if (number != 0){
                    response.json('Email già utilizzata');
                    console.log('Email già utilizzata');
                }
                else if(validateEmail(email) == false){
                    response.json('Email non valida');
                    console.log('Email non è valida');
                }
                else if(db.collection('user').find({'name' : name}) == true) {
                    response.json('Nome utente non disponibile');
                    console.log('Nome utente non disponibile');
                }
                else {
                    db.collection('user').insertOne(insertJson,function(error, res){
                        response.json('Registrazione avvenuta');
                        console.log('Registrazione avvenuta');
                    })
                }
            })

        });

        app.post('/login', (request, response, next)=> {
            var post_data = request.body;

            var email = post_data.email;
            var userPassword = post_data.password;

            var db = client.db('cocoworkingdb');

            //check exists email
            db.collection('user').find({'email' : email}).count(function(err, number) {
                if (number == 0){
                    var responseJson = {
                        '_id': "",
                        'email' : "",
                        'name': "",
                        'message': 'Email not exists',
                        'flag': 0
                    }
                    response.json(responseJson);
                    console.log('' + responseJson.flag + '');
                    console.log('Email not exists');
                }
                else {
                    db.collection('user').findOne({'email' : email}, function(err, user){
                        var salt = user.salt; //get salt from user
                        var hashed_password = checkHashPassword(userPassword, salt).passwordHash; // Hash paswword with salt
                        var encrypted_password = user.password;
                        if(hashed_password == encrypted_password){
                            var responseJson = {
                                '_id': user._id,
                                'email' : user.email,
                                'name': user.name,
                                'message': 'Login success',
                                'flag': 1
                            }
                            response.json(responseJson);
                            console.log('Login success');
                        }
                        else {
                            var responseJson = {
                                '_id': "",
                                'email' : "",
                                'name': "",
                                'message': 'Wrong password',
                                'flag': 0
                            }
                            response.json(responseJson);
                            console.log('Wrong password');
                        }
                    })
                }
            })

        });

        app.post('/updateEvents', (request, response, next)=> {
            var post_data = request.body;

            var idAccount = post_data.idAccount;
            var eventId = post_data.eventId;
            var userId = post_data.userId;
            var text = post_data.text;
            var date = post_data.date;

            var dateMillis = new Date(date);
            console.log(`inserted date: ${dateMillis.toISOString()}`)


            var eventJson = {
                'eventId': eventId,
                'userId': userId,
                'text': text,
                'date': dateMillis
                //'date': `ISODate(${date})00`
            };

            var db = client.db('cocoworkingdb');
            console.log('' + eventId + '');

            db.collection('events').insertOne(eventJson, function (error, res) {
                //let evento = new Event(eventJson.eventId, eventJson.userId, eventJson.text, eventJson.date);
                //console.log(Event);
                //console.log('' + evento.text + '');
                response.json('Event updated');
                console.log('Event updated');

            });
        })

        app.post('/takeEvents', (request, response, next)=> {
            var post_data = request.body;

            var idAccount = post_data.idAccount;
            var eventId = post_data.eventId;
            var userId = post_data.userId;
            var text = post_data.text;
            var date = post_data.date;


            var eventJson = {
                'eventId': eventId,
                'userId': userId,
                'text': text,
                'date': date
            };

            var db = client.db('cocoworkingdb');
            console.log('' + eventId + '');

            db.collection('events').find({}).toArray(function (error, res) {
                //let evento = new Event(eventJson.eventId, eventJson.userId, eventJson.text, eventJson.date);
                //console.log(Event);
                //res.forEach(e => console.log(e));
                console.log(res);
                response.json(res);
                //res.forEach(e => response.json(e));
                //console.log('Event updated');

            });
        })

        app.post('/deleteEvents', (request, response, next)=> {
            var post_data = request.body;

            var eventId = post_data.eventId;
            var userId = post_data.userId;
            var text = post_data.text;
            var date = post_data.date;


            var deleteJson = {
                'eventId': eventId,
                'userId': userId,
                'text': text,
                'date': date
            };

            var db = client.db('cocoworkingdb');
            console.log('' + eventId + '');

            db.collection('events').deleteOne(deleteJson, function (err,res) {

                //let evento = new Event(eventJson.eventId, eventJson.userId, eventJson.text, eventJson.date);
                //console.log(Event);
                //res.forEach(e => console.log(e));
                console.log("Event deleted");
                response.json("Event deleted");
                //res.forEach(e => response.json(e));
                //console.log('Event updated');

            });
        })

        Date.prototype.addHours = function(h) {
            this.setTime(this.getTime() + (h*60*60*1000));
            return this;
        }

        //Check event dates in database

        function checkDate(){
            var currentDate = new Date();
            const fullDate = currentDate.toISOString();
            var db = client.db('cocoworkingdb');
            const today = fullDate.slice(0,10);
            console.log(today);
            //currentDate.toISOString()
            regex = RegExp(String.raw`^${today}`);
            var query = {date: regex };
            console.log(`${currentDate.addHours(-1000).toDateString()} è diverso di ${new Date(2020,8,16)}`)
            //const eventsRightNow = db.collection('events').find({"date": {"$gte": currentDate.addHours(-1000), "$lt": currentDate.addHours(2000)}}).toArray(function (err,result){
            const eventsRightNow = db.collection('events').find({"date": {"$gte": (new Date()).addHours(-1000), "$lt": (new Date()).addHours(1000)}}).toArray(function (err,result){
                if(err) throw err;
                else{
                    console.log("voila le probleeeme");
                    console.log(result);
                }
                db.close;
            });
            //console.log(`Voilà le problème: ${eventsRightNow.toString()}`)
            /*db.collection('events').find(query).toArray(function (err,result){
                if(err) throw err;
                else{
                    //console.log(result);
                }
                db.close;
            });*/
            //console.log(eventsRightNow.toString())

        }

        setInterval(checkDate, 5000);

        //Start Web Server
        app.listen(3000, ()=> {
            console.log('Connected to MongoDB Server , WebService running on port 3000');
        })
    }
});
