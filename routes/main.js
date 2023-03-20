const mongoose = require('mongoose')
const Developer = require('../model/developer')
const Article = require('../model/article')
const nodemailer = require('nodemailer')
const fs = require('fs')
const router = require('express').Router();
const bodyParser = require('body-parser')
const jsonParser = bodyParser.json()
const urlencodedParser = bodyParser.urlencoded({ extended: false })

router.get("/", (req, res) => {
    path = absolutepath("index.html")
    console.log(path)
    res.sendFile(path)
})

router.get("/html/:id", (req, res) => {
    path = absolutepath(req.params.id + ".html")
    console.log(path)
    res.sendFile(path)
})

router.get("/css", (req, res) => {
    console.log("css req from", req.get('Referrer'))
    path = absolutepath("style.css")
    res.sendFile(path)
})

router.get("/dev", (req, res) => {
    res.sendFile(absolutepath("login.html"))
});

router.get("/img/banner/:path", (req, res) => {
    path = absolutepath("img/banner/" + req.params.path)
    res.sendFile(path)
});

router.get("/img/collection/:path", (req, res) => {
    path = absolutepath("img/collection/" + req.params.path)
    res.sendFile(path)
});

router.get("/dev/img/collection/:path", (req, res) => {
    path = absolutepath("img/collection/" + req.params.path)
    res.sendFile(path)
});

router.get("/delete/:postid/:devid", async (req, res) => {
    try {
        console.log("deleting post")
        const checkpost = await Article.findById(req.params.postid)
        if (checkpost.author == req.params.devid) {
            await Article.deleteOne({ "_id": req.params.postid })
            res.send({ msg: "deleted" })
            return
        }
        res.sendStatus(403)
    } catch {
        res.send("did not work for you")
    }
})

router.post("/article", urlencodedParser, async (req, res) => {
    try {
        const valid = await isValid(req.body._id)
        if (!valid) {
            res.send("etwas ist schief gegangen, du hast vielleicht keine Berechtigung. Es wurde nichts geposted")
            return;
        }

        const dev = await Developer.findById(req.body._id);
        if (dev.permissions.includes(req.body.section)) {
            if (req.body.section == "devs") {
                permissions = []
                if (req.body.start == "start") { permissions.push("start") }
                if (req.body.dates == "dates") { permissions.push("dates") }
                if (req.body.about == "about") { permissions.push("about") }
                if (req.body.contact == "contact") { permissions.push("contact") }
                if (req.body.gallery == "gallery") { permissions.push("gallery") }
                const newDev = new Developer({
                    "name": req.body.title,
                    "email": req.body.category,
                    "permissions": permissions,
                })
                savedDev = await newDev.save();
                console.log("added as developer", savedDev)
                var subject = 'Dein rvssn.de Editor-Dashboard'
                var text =
                    'Hey ' + savedDev.name + ', ' + dev.name + ' hat dich berechtigt Bearbeitungen auf unserer Website zu machen.\n' +
                    'Klicke einfach auf den Link und leg los: ' + req.body.link + "/dev/edit?" + savedDev._id + '\n' +
                    'Danke für deinen Einsatz.\n\n' +
                    'Mit besten Grüßen\n' +
                    'das Website-Team des RVSSN\n\n' + req.body.link
                sendMail(savedDev.email, subject, text, function onload(info) {
                    console.log('Email sent to', savedDev.email, 'with notification:', info.response);
                    res.send("<link rel='stylesheet' href='/css'><body class='dev'><div class='main dev'><div class='container response'>" +
                        "<p>Erfolgreich hinzugefügt. " + savedDev.email + " wurde per email über die Berechtigungen: [" + savedDev.permissions + "] benachrichtigt.</p></div></div></body>");
                    return
                },
                    function onerror(error) {
                        console.log('email konnte nicht gesendet werden:', error);
                        res.send('Erfolgreich hinzugefügt aber leider hat die benachrichtigung nicht geklappt.')
                        return
                    }
                );
                return;
            }
            if (req.body.imgnme) {
                console.log(req.body.imgnme)
                const stringLength = decodeBase64Image(req.body.imgsrc).data.length - 'data:image/png;base64,'.length;
                console.log("Filesize:", 4 * Math.ceil((stringLength / 3)) * 0.5624896334383812, ("bytes"))
            }
            let articleDict = {
                "section": req.body.section,
                "header": req.body.title,
                "category": req.body.category,
                "date": req.body.date,
                "hideDate": req.body.hideDate = "on", "text": req.body.text,
                "author": req.body._id,
            }
            if (req.body.hideDate == "on") {
                articleDict["hideDate"] = true
            }
            try {
                req.files.pdf.mv(absolutepath('/files/' + req.files.pdf.name))
                fs.writeFile(absolutepath("/img/collection/" + req.body.imgnme), decodeBase64Image(req.body.imgsrc).data, 'base64', function (err) {
                    if (err) {
                        console.log("while saving encoded image err: " + err);
                    } else {
                        console.log("encoded image successfully")
                    }
                });
                articleDict["pdf"] = req.files.pdf.name
                articleDict["img"] = req.body.imgnme


            } catch (err) {
                if (req.body.imgnme) {

                    fs.writeFile(absolutepath("/img/collection/" + req.body.imgnme), decodeBase64Image(req.body.imgsrc).data, 'base64', function (err) {
                        if (err) {
                            console.log("while saving encoded image err: " + err);
                        } else { console.log("encoded image successfully") }
                    });
                    articleDict["img"] = req.body.imgnme
                } else {
                    if (req.files != null) {

                        req.files.pdf.mv(absolutepath('/files/' + req.files.pdf.name))

                        articleDict["pdf"] = req.files.pdf.name
                        articleDict["img"] = "logo-blue_white1x1background.png"
                    } else {
                        articleDict["img"] = "logo-blue_white1x1background.png"
                    }
                }
            }
            const newArticle = new Article(articleDict)
            savedPost = await newArticle.save();
            res.send("<link rel='stylesheet' href='/css'><body class='dev'><div class='main dev'><div class='container response'>" +
                "<p>erfolgreich in Datenbank geposted, der Artikel ist jetzt auf der Website</p>" +
                "<div class='details'><a id='website'>gehe zur Website</a><a id='editor'>zurück zum Dashboard</a></div></div></div></body>" +
                "<script>document.getElementById('website').href=window.location.protocol + '//' + window.location.host + '?" + req.body.section + "';" +
                "document.getElementById('editor').href=window.location.protocol + '//' + window.location.host + '/dev/edit?" + req.body._id + "';</script>")
        } else {
            res.send("Diesen Bereich darfst du leider nicht bearbeiten")
        }
    } catch (err) {
        console.log("err posting")
        console.log(err)
        res.send(err)
    }
});

router.get("/items/:section", async (req, res) => {
    allPosts = await Article.find({ "section": req.params.section }).sort({ "time": -1 })
    res.send(allPosts)
})

router.get("/items/id/:id", async (req, res) => {
    console.log("serving his articles")
    allPosts = await Article.find({ "author": req.params.id }).sort({ "time": -1 })
    res.send(allPosts)
})

router.get("/dev/edit", (req, res) => {
    res.sendFile(absolutepath('edit.html'))
})

router.get("/dev/edit/:id", async (req, res) => {
    const developer = await Developer.findById(req.params.id)
    res.send(developer)
})

router.get("/pdf/:id", (req, res) => {
    console.log("asked to serve:", req.params.id)
    res.sendFile(absolutepath('files/' + req.params.id))
})

router.get("/file/:id", (req, res) => {
    console.log(req.params.id)
    fileName = req.params.id.replace(/\s/, '%20')
    fileName = fileName.replace(/\s/, '%20')
    console.log(fileName)
    pdfurl = "https://rvssn.de/pdf/" + fileName;
    console.log(pdfurl)
    res.send('<body style="margin:0px;padding:0px;overflow:hidden;"><iframe id="iframe" style="width:100%;" frameborder="0"></iframe>' +

        '<script>document.getElementById("iframe").setAttribute("src", "https://docs.google.com/gview?url=' + pdfurl + '&embedded=true");</script>' +
        '<script>document.getElementById("iframe").style.height = window.innerHeight</script>' +
        '</body>')
})

router.post("/login", urlencodedParser, async (req, res) => {
    const devs = await Developer.find()
    const email = req.body.email
    var berechtigt = false;
    for (i in devs) {
        if (devs[i].email == email) {
            berechtigt = true;
            var subject = 'Dein rvssn.de Editor-Dashboard'
            var text =
                'Hey ' + devs[i].name + ', du bist berechtigt Bearbeitungen auf unserer Website zu machen.\n' +
                'Klicke einfach auf den Link und leg los: ' + req.body.link + "/dev/edit?" + devs[i]._id + '\n' +
                'Danke für deinen Einsatz.\n\n' +
                'Mit besten Grüßen\n' +
                'das Website-Team des RVSSN\n\n' + req.body.link
            sendMail(email, subject, text, function onload(info) {
                console.log('Email sent to', email, 'with notification:', info.response);
                res.send("<link rel='stylesheet' href='/css'><body class='dev'><div class='main dev'><div class='container response'>" +
                    "<p>email mit link zur bearbeitung wurde gesendet an: " + email + "</p></div></div></body>");
                return
            },
                function onerror(error) {
                    console.log('email konnte nicht gesendet werden:', error);
                    res.send('sorry unsere server haben leider gerade ein Problem')
                    return
                }
            );

        }
    }
    if (!berechtigt) {
        res.send("<link rel='stylesheet' href='/css'><body class='dev'><div class='main dev'><div class='container response'>" +
            "<p>diese email adresse wurde von dem Besitzer der Seite noch nicht approved</p>" +
            "<p>frage jetzt hier die Rechte ganz einfach an:</p>" +
            "<div class='details'><a id='whatsapp'>per WhatsApp (schnelle Antwort)</a><a href='/rights/" + email + "'>per email</a></div></div></div></body>" +
            "<script>document.getElementById('whatsapp').href = 'https://api.whatsapp.com/send?phone=4915751611508&text=Hey,%20kannst%20du%20mir%20(" + email + ")%20bitte%20Bearbeitungsrechte%20für%20die%20RVSSN-Website%20geben?'</script>")
    }
});

router.get("/dev/edit/get/sections", (req, res) => {
    res.json([
        { name: "Startseite", value: "start" },
        { name: "Kontakt", value: "contact" },
        { name: "Über uns", value: "about" },
        { name: "Termine", value: "dates" },
        { name: "Gallerie", value: "gallery" },
    ])
});

router.get("/rights/:email", (req, res) => {
    address = process.env.ADMIN_EMAIL
    subject = "RVSSN-add-rights"
    text = "bitte gebe " + req.params.email + " bearbeitungsrechte"
    sendMail(address, subject, text,
        function onload(info) {
            console.log('Email sent to', address, 'with notification:', info);
            res.send("<link rel='stylesheet' href='/css'><body class='dev'><div class='main dev'><div class='container response'>" +
                "<p>email wurde gesendet, wir werden ggf. auf dich zukommen</p></div></div></body>");
            return
        }, function onerror(error) {
            console.log('email konnte nicht gesendet werden:', error);
            res.send('sorry unsere server haben leider gerade ein Problem')
            return
        }
    );
});

router.get("/favicon.ico", (req, res) => {
    res.sendFile(absolutepath("/img/icons/favicon.png"))
})

router.get("/icons/:img", (req, res) => {
    res.sendFile(absolutepath("/img/icons/" + req.params.img))
})

module.exports = router;

async function isValid(id) {
    const devs = await Developer.find()
    for (i in devs) {
        if (id == devs[i]._id) {
            return true;
        }
    }
    return false;
}

function sendMail(address, betreff, message, onload, onerror) {
    var transporter = nodemailer.createTransport({
        host: "smtp.web.de",
        port: 587,
        auth: {
            user: process.env.EMAILUSER,
            pass: process.env.EMAILPSWD
        }
    });
    var mailOptions = {
        from: process.env.EMAILUSER,
        to: address,
        subject: betreff,
        text: message
    };

    transporter.sendMail(mailOptions, function (error, info) {

        if (error) {
            onerror(error)
            return
        } else {
            onload(info)
            return
        }
    });
}

function absolutepath(relativepath) {
    dirname = __dirname
    while (dirname.charCodeAt(dirname.length - 1) != 92 && dirname.charCodeAt(dirname.length - 1) != 47) {
        dirname = dirname.slice(0, -1)
        if (dirname.length == 1) break
    }
    return dirname + relativepath
}

function decodeBase64Image(dataString) {
    dataString.substring(0, 100)
    var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    var response = {};
    if (matches.length !== 3) {
        return new Error('Invalid input string');
    }

    response.type = matches[1];
    response.data = Buffer.from(matches[2], 'base64');

    return response;
}