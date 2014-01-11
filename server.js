#!/bin/env node
//  OpenShift sample Node application
var restify = require('restify');
var mongojs = require("mongojs");

var ip_addr = process.env.OPENSHIFT_NODEJS_IP   || '127.0.0.1';
var port    = process.env.OPENSHIFT_NODEJS_PORT || '8080';

var db_name = process.env.OPENSHIFT_APP_NAME || "lendo2";

var connection_string = '';
// if OPENSHIFT env variables are present, use the available connection info:
if(process.env.OPENSHIFT_MONGODB_DB_PASSWORD){
  connection_string = process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
  process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
  process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
  process.env.OPENSHIFT_MONGODB_DB_PORT + '/' +
  process.env.OPENSHIFT_APP_NAME;
}

console.log('ConnectionString ' + connection_string);
console.log('Db name ' + db_name);

var db = mongojs(connection_string, [db_name]);
var lendo = db.collection("lendo2foo");


var server = restify.createServer({
    name : "lendo2"
});

server.pre(restify.pre.userAgentConnection());
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());
server.use(restify.CORS());

function findAllPeople(req, res , next){
    res.setHeader('Access-Control-Allow-Origin','*');
    lendo.find().limit(20).sort({postedOn : -1} , function(err , success){
        console.log('Response success '+success);
        console.log('Response error '+err);
        if(success){
            res.send(200 , success);
            return next();
        }else{
            return next(err);
        }
        
    });
    
}

function findPerson(req, res , next){
    res.setHeader('Access-Control-Allow-Origin','*');
    lendo.findOne({_id:mongojs.ObjectId(req.params.personId)} , function(err , success){
        console.log('Response success '+success);
        console.log('Response error '+err);
        if(success){
            res.send(200 , success);
            return next();
        }
        return next(err);
    })
}

function postNewPerson(req , res , next){
    var person = {};
    person.name = req.params.name;
    person.postedOn = new Date();

    res.setHeader('Access-Control-Allow-Origin','*');
    
    lendo.save(person , function(err , success){
        console.log('Response success '+success);
        console.log('Response error '+err);
        if(success){
            res.send(201 , person);
            return next();
        }else{
            return next(err);
        }
    });
}

function deletePerson(req , res , next){
    res.setHeader('Access-Control-Allow-Origin','*');
    lendo.remove({_id:mongojs.ObjectId(req.params.personId)} , function(err , success){
        console.log('Response success '+success);
        console.log('Response error '+err);
        if(success){
            res.send(204);
            return next();      
        } else{
            return next(err);
        }
    })
    
}

var PATH = '/lendo'

server.get({path : PATH , version : '0.0.1'} , findAllPeople);
server.get({path : PATH +'/:personId' , version : '0.0.1'} , findPerson);
server.post({path : PATH , version: '0.0.1'} ,postNewPerson);
server.del({path : PATH +'/:personId' , version: '0.0.1'} ,deletePerson);


server.listen(port ,ip_addr, function(){
    console.log('%s listening at %s ', server.name , server.url);
})

