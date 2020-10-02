
// Import package

var mongodb = require('mongodb');
var ObjectID = mongodb.ObjectID;
var crypto = require('crypto');
var express = require('express');
var bodyParser = require('body-parser');

var five =require('johnny-five');
var board=new five.Board();
var loggedUser = "00000";

/*class Event {

    constructor(eventId, userId, text, date){
        this.eventId = eventId;
        this.userId = userId;
        this.text = text;
        this.date = date;
    }
}*/

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

function checkPassword(str)
{
    // at least one number, one lowercase and one uppercase letter
    // at least six characters
    var re = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
    return re.test(str);
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
/*
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

        });*/
        //Register

        app.post('/register', (request, response, next)=> {
            var post_data = request.body;

            if(checkPassword(post_data.password)){
                var plaint_password = post_data.password;
                var hash_data = saltHashPassword(plaint_password);
                var password = hash_data.passwordHash; // Save password hash
                var salt = hash_data.salt; //Save salt
            }


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
                else if(checkPassword(post_data.password) == false){
                    response.json('Password non valida');
                    console.log('Password non   valida');
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
                        'message': 'Email inesistente',
                        'flag': 0
                    }
                    response.json(responseJson);
                    console.log('' + responseJson.flag + '');
                    console.log('Email inesistente');
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
                                'message': 'Login riuscito',
                                'flag': 1
                            }
                            response.json(responseJson);
                            loggedUser = user.name;
                            console.log('Login riuscito');
                        }
                        else {
                            var responseJson = {
                                '_id': "",
                                'email' : "",
                                'name': "",
                                'message': 'Password sbagliata',
                                'flag': 0
                            }
                            response.json(responseJson);
                            console.log('Password sbagliata');
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


            var eventJson = {
                'eventId': eventId,
                'userId': userId,
                'text': text,
                'date': new Date(date)
            };

            var db = client.db('cocoworkingdb');
            console.log('data salvata', date);
            console.log('data salvata', new Date(date));

            db.collection('events').insertOne(eventJson, function(err, user){
                response.json('Evento salvato');
                console.log('Evento salvato');
            })

            //let evento = new Event(eventJson.eventId, eventJson.userId, eventJson.text, eventJson.date);
            //console.log(Event);
            //console.log('' + evento.text + '');
        });



        app.post('/checkFreeDate', (request, response, next)=> {
            var date = request.body.date;
            console.log(date)
            var newdate = new Date(date)

            var db = client.db('cocoworkingdb');

            var dataOccupataJson = {
                'message' : 'Orario occupato',
                'flag' : 0
            }

            var dataDisponibileJson = {
                'message' : 'Orario disponibile',
                'flag' : 1
            }

            var dateJson = {
                'date': new Date(date)
            };

            db.collection('events').find({"date": {"$gte": (new Date(date).addSeconds(-3599)), "$lt": (new Date(date).addSeconds(3599))}}).count(function(err, number) {
                if (number != 0){
                    response.json(dataOccupataJson);
                    console.log('Orario occupato');
                    console.log(number);
                    console.log(new Date(date));
                }
                else {
                    response.json(dataDisponibileJson);
                    console.log('Orario disponibile');
                    console.log(number);
                    console.log(new Date(date));
                }
                //let evento = new Event(eventJson.eventId, eventJson.userId, eventJson.text, eventJson.date);
                //console.log(Event);
                //console.log('' + evento.text + '');
            });
        });

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
        });

        app.post('/deleteEvents', (request, response, next)=> {
            var post_data = request.body;

            var eventId = post_data.eventId;


            var deleteJson = {'eventId': eventId};

            var db = client.db('cocoworkingdb');
            console.log('' + eventId + '');
            console.log(deleteJson);

            db.collection('events').deleteOne(deleteJson, function (err,res) {

                //let evento = new Event(eventJson.eventId, eventJson.userId, eventJson.text, eventJson.date);
                //console.log(Event);
                //res.forEach(e => console.log(e));
                if (err) throw err;
                console.log("Evento eliminato");
                response.json("Evento eliminato");
                //res.forEach(e => response.json(e));
                //console.log('Event updated');

            });
        })

        Date.prototype.addSeconds = function(s) {
            this.setTime(this.getTime() + (s*1000));
            return this;
        }

        //Check event dates in database

        bloard.on('ready',function(){
                var greenLed = new five.Led(9);
                var yelowLed = new five.Led(11);
            var redLed = new five.Led(13);

        function checkDate(){
            var db = client.db('cocoworkingdb');
            db.collection('events').find({"date": {"$gte": (new Date()).addSeconds(-15), "$lt": (new Date())}}).count(function (err,number){
                 console.log(number);
                 if(number != 0){
                     console.log('quelque chose');
                     greenLed.on();
                     yellowLed.stop().off();
                     redLed.off();
                }
                else {
                     greenLed.off();
                     yellowLed.stop().off();
                     redLed.off();
                 }
                db.close;
            });

           db.collection('events').find({"date": {"$gte": (new Date().addSeconds(-30)), "$lt": (new Date().addSeconds(-15))}}).count(function (err,number){
                console.log(number);
                if(number != 0){
                    console.log('quelque chose attention');
                    greenLed.off();
                    yellowLed.blink(500);
                    redLed.off();
                }
                else {}
                db.close;
            });

            db.collection('events').find({"date": {"$gte": (new Date().addSeconds(-30)), "$lt": (new Date())}}).count(function (err,number){
                console.log(number);
                if(number == 0){
                    console.log('rien');
                    greenLed.off();
                    yellowLed.stop().off();
                    redLed.on();
                }
                else {}
                db.close;
            });


        }
            setInterval(checkDate, 5000);
        })

        // Controllo per l'invio di una notifica a l'utente quando una riunione sta per iniziare
/*
        function checkEvents(){
            var db = client.db('cocoworkingdb');
            console.log(loggedUser);
            db.collection('events').
            findOne(
                {"date": {"$gte": (new Date()).addSeconds(5), "$lt": (new Date()).addSeconds(60)}},
                { projection: {"_id": 0, "userId": 1} },
                function(err, result){
                    if (err) throw err;
                    console.log(result);
                    if (result != null) {
                        if (result.userId == loggedUser) {
                            console.log('//////Hai una riunione !!!///////');
                        } else {
                            console.log('Nessuna riunone');
                        }
                    }

                db.close;
            });
        }

        setInterval(checkEvents,10000);*/

        //Start Web Server
        app.listen(3000, ()=> {
            console.log('Connected to MongoDB Server , WebService running on port 3000');
        })
    }
});
