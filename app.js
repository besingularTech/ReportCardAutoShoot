const express = require('express');
const fs = require('fs');
var cronjob = require("cron-job");
const readline = require('readline');
const {google} = require('googleapis');
const app = express();
const credentials = require('./credentials.json');
var async = require("async");
var mailer =  require('./mail');
var mongoClient = require('./database');
app.set("view engine","ejs")
app.use ((req,res,next)=>{
  res.setHeader("Allow-Control-Allow-Origin","*");
  next();
})
// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive','https://www.googleapis.com/auth/drive.readonly','https://www.googleapis.com/auth/drive.metadata.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';
var authUrl;
var oAuth2Client
function authorize (callback ,db){
  const {client_secret, client_id, redirect_uris} = credentials.web;
   oAuth2Client = new google.auth.OAuth2(
  client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    
    if (err) {
      console.log("nothing to read");  
      getAccessToken(oAuth2Client, callback);
      return 
    }
    
    console.log("i am out");
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client,db);

    
  });
}
function getAccessToken(oAuth2Client, callback) {
  authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  
}
app.get("/",(req,res)=>{
  res.render("index" ,{url:authUrl});
})
app.get('/google/callback',(req,res)=>{
    const code = req.query.code;
    oAuth2Client.getToken(code, function (err, tokens) {
      if (err) {
        console.log("Error authenticating");
        console.log(err);
      } else {
        console.log("Successfully authenticated");
        console.log(tokens)
        oAuth2Client.setCredentials(tokens);
        fs.writeFile(TOKEN_PATH, JSON.stringify(tokens), (err) => {
          if (err) return console.error(err);
          console.log('Token stored to', TOKEN_PATH);
          listFiles(oAuth2Client)
        });
       res.redirect("/");
      }
    })
})  

function listFiles(auth,db) {
  console.log("In list files");

  const drive = google.drive({version: 'v3', auth});
  var pageToken = null;
  // Using the NPM module 'async'
  async.doWhilst(function (callback) {
    drive.files.list({
      q: "mimeType='application/pdf'",
     q: "name contains 'besingular0'",
      fields: 'nextPageToken, files(id, name)',
      spaces: 'drive',
      pageToken: pageToken
    },  (err, res) =>{
      if (err) {
        // Handle error
        console.error(err);
        callback(err)
      } else {
            if(res.data.files.length == 0 ){
              console.log("No Files");
            }
            else{
            console.log(res.data);
            
          res.data.files.forEach(function (file) {
            downloadFile(drive,file).then((fileName)=>{ 
              console.log("In then operator");
              mailer.getDatabase(db,fileName) 
            }).catch((err)=>{
              console.log(err);
            })
          console.log('Found file: ', file.name, file.id);
       }) 
            }
      } 
    });
  }, function () {
    return !!pageToken;
  }, function (err) {
    if (err) {
      // Handle error
      console.error(err);
    } else {
      // All pages fetched
    }
  })
}

function downloadFile(drive,file ) {
    var fileId = file.id
    let progress = 0;
    var fileName = file.name+".pdf";
    var dest = fs.createWriteStream(fileName);
     return new Promise ((resolve,reject)=>{
    
      drive.files.get(
        { fileId:fileId,
          alt: 'media'
        }, { responseType: 'stream' }).then(res=>{
          console.log("in downloadin");
          res.data.on('end',()=>{
            resolve(fileName) 
            console.log("downloading done");
          }).on('error',err=>{
            console.log("In error");
            console.log(err);
          }).on('data', d => { 
            progress += d.length;
            if (process.stdout.isTTY) {
              process.stdout.clearLine();
              process.stdout.cursorTo(0);
              process.stdout.write(`Downloaded ${progress} bytes`);
            }
           
          })
          .pipe(dest)
        }).catch(err =>{
          console.log("i error");
          console.log(err);
        })


     }) 

}  
var first_time = cronjob.date_util.getNowTimestamp()+5;//timestamp,unit is seconds
var timegap = 60*5;//seconds
// var options = {//method's parameters
//     param1:'1',
//     param2:'2'
// };
var job =  ()=>{
  mongoClient.mongoClient(db=>{
      authorize(listFiles,db)
    })
 
}
app.listen(process.env.PORT || 3000,()=>{  
  cronjob.startJobEveryTimegap(first_time+5,timegap,job);
})