const mongoDb = require('mongodb');
var  _db;

const uri = "mongodb+srv://Rish_178:amannisha178@demo.x2f1s.mongodb.net/besingular?retryWrites=true&w=majority";
const client = new mongoDb.MongoClient(uri, { useNewUrlParser: true });
const mongoClient = (cb) => {
   console.log("connection");
    client.connect(err => {
        if(err){
            console.log(err);
            return
        }
        _db = client.db("reportcard");
        cb(_db)
     //   client.close();
      });

}
const getDb = () =>{
    console.log("in getdb");
    if(_db)
    {
       return _db;
    }
    throw "No Database found"
}
exports.mongoClient = mongoClient;
exports.getDb = getDb;