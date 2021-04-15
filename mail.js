const nodemailer =  require('nodemailer')
const getDb = require('./database').getDb;
const fs = require('fs')

var transport = nodemailer.createTransport({
    name: 'besingular.com',
    host : 'mail.besingular.com',
    port : 465,
    auth : {
        user: "crm@besingular.com", 
        pass: "_*1SIZ~}tXid" 
    }
})
sendMail = (fileName,emails)=>{
    console.log(emails); 
    if(emails.length>1){
        var mailOptions = {
            from: 'BeSingular LMS <crm@besingular.com>', // sender address
            to: [emails[0],emails[1]], // list of receivers
            subject: 'BeSingular Report', // Subject line
            text: "This is the report card",// plain text body
            attachments :[ {
                fileName : 'Report Card',
                path: fileName,
                contentType: 'application/pdf'
            }]
          };
    }
    else{ 
         mailOptions = {
        from: 'BeSingular LMS <crm@besingular.com>', // sender address
        to: emails[0], // list of receivers
        subject: 'Subject of your email', // Subject line
        text: "This is the report card",// plain text body
        attachments :[ {
            fileName : 'Report Card',
            path: fileName,
            contentType: 'application/pdf'
        }]
      };
    }
    transport.sendMail(mailOptions ,(err,info)=>{
        console.log("in send mail");
        if(err){
            console.log(err);
        }
        else{
            console.log(info);  
        }   
    })
}

exports.getDatabase = (db,fileName) =>{

   const filename =  fileName.split(".");
  db.collection("email table").findOne({"name":filename[0]}).then(res=>{
    console.log(res);
    sendMail(fileName,res.email)
  }).catch(err=>{
      console.log("No mail found ");
  })
}