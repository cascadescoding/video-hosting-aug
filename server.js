const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID
const { google } = require('googleapis');
const oauth2 = google.oauth2('v2');
const { getConnectionUrl, oAuth2Client } = require("./google-auth")





app.set("view engine", "pug");

app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({ extended: true }))

const connectionString = "mongodb+srv://Ankita:ankita33@cluster0.rpr6u.mongodb.net/videohosting?retryWrites=true&w=majority"

let authed = false;
let user = {};

function getUserDetails(code) {
    console.log(" Getting user detail " + code)
    if (code) {
        oAuth2Client.getToken(code, function (err, tokens) {
            if (err) {
                console.log("Error Authenticating")
                console.log(err);
                return err;

            }
            else {
                console.log("Successfully Authenticated" + tokens);
                oAuth2Client.setCredentials(tokens);
                google.options(({ auth: oAuth2Client }))

                oauth2.userinfo.get({ auth: oAuth2Client }, (err, response) => {
                    if (err) {
                        return err;
                    }
                    const data = response.data;
                    console.log("Logged in " + data);
                    authed = true;
                    user = data;
                    return data;
                });
            }
        });
    }
}
app.get('/logout', (req, res) => {
    authed = false;
    user = {};
    res.redirect("/");

});



app.get("/", (req, res) => {
    const code = req.query.code
    console.log("******************" + code + " ddd " + authed)
    if (!authed) getUserDetails(code);
    MongoClient.connect(connectionString, { useUnifiedTopology: true })
        .then(client => {
            const db = client.db('video-hosting')
            db.collection('videos').find().toArray()
                .then(results => {
                    console.log("Logged In---" + user + results)




                    res.render("index", {
                        title: "Premium Videos",
                        allVideos: results, //Retrieve from database
                        yourVideos: results,
                        loginFor: user

                    });
                })
        })
        .catch(error => console.error("getting error" + error))
});

app.get('/login', (req, res) => {
    if (!authed) {
        const url = getConnectionUrl();
        console.log("still in" + url);
        res.redirect(url);
        console.log("user is" + user);
    }
})

app.get("/video", (req, res) => {
    console.log(" Display Video " + req.query.id);
    MongoClient.connect(connectionString, { useUnifiedTopology: true })
        .then(client => {
            const db = client.db('video-hosting')
            db.collection('videos').findOne({ _id: ObjectID(req.query.id) }, function (err, document) {
                console.log(document)
                res.render("video", {
                    title: `About ${document.title}`,
                    vid: document,
                    loginFor: user


                });
            });
        })
        .catch(error => console.error(error))
});




app.get("/addVideo", (req, res) => {

    res.render("addVideo", {
        title: "MineCraft Tutorials",
    });
});


//This page commenting for now
/*app.get("/videos", (req, res) => {
    const vid = allvideos.videos.find(p => p.id === req.query.id);
    res.render("videos", {
        title: "New Videos",
    })
})*/
app.post('/video/add', (req, res) => {
    console.log(req.body)
    MongoClient.connect(connectionString, { useUnifiedTopology: true })
        .then(client => {
            console.log('Connected to database')
            const db = client.db('video-hosting')
            const videoCollection = db.collection('videos')
            videoCollection.insertOne(req.body)
                .then(result => {
                    console.log(result)
                    res.redirect("/")
                })
                .catch(error => console.error(error))




        })
})

app.get("/video/delete", (req, res) => {
    console.log(" Delete Video " + req.query.id);
    MongoClient.connect(connectionString, { useUnifiedTopology: true })
        .then(client => {
            const db = client.db('video-hosting')
            db.collection('videos').deleteOne({ _id: ObjectID(req.query.id) }).then(result => {
                res.redirect("/")
            })
                .catch(error => console.error(error))
        })
        .catch(error => console.error(error))
})

app.post('/video/purchase', (req, res) => {
    console.log(req.body)
    MongoClient.connect(connectionString, { useUnifiedTopology: true })
        .then(client => {
            console.log('Connected to Database')
            const db = client.db('video-hosting')
            const videoCollection = db.collection('access')
            videoCollection.insertOne({
                video_id: req.body.video_id,
                user_id: req.body.user,
                purchase_date: new Date(),



            })
                .then(result => {
                    console.log(result)
                    res.redirect("/")
                })
                .catch(error => console.error(error))

        })



})

const server = app.listen(7000, () => {
    console.log(`Express running`);
});

//This is a comment.