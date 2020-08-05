const router = require('express').Router();
const bcrypt = require('bcryptjs');
const uuid = require('uuid');
const jwt = require('jsonwebtoken');
const db = require('../lib/db');
const userMiddleware = require('../middleware/users.js');

router.post('/register', userMiddleware.validateRegister, (req, res, next) => {
    // res.send("Register is called");
    db.query(
        `SELECT * FROM login WHERE LOWER(username) = LOWER(${db.escape(
            req.body.username
        )});`,
        (err, result) => {
            if (result.length) {
                return res.status(409).send({
                    msg: 'This username is already in use!'
                });
            } else {
                // username is available
                bcrypt.hash(req.body.password, 10, (err, hash) => {
                    if (err) {
                        return res.status(500).send({
                            msg: err
                        });
                    } else {
                        const uid=uuid.v4();
                        db.query(
                            `INSERT INTO login (id, username, password,email, registerdate) VALUES ('${uid}', ${db.escape(
                                req.body.username
                            )}, ${db.escape(hash)},${db.escape(
                                req.body.email
                            )}, now())`,
                            (err, result) => {
                                if (err) {
                                    throw err;
                                    return res.status(400).send({
                                        msg: err
                                    });
                                }
                                db.query(`INSERT INTO hackers (id,name,noChallengesSolved,expertLevel,ds,algo,cpp,java,python,votes) values ("${uid}","${req.body.name}",0,0,0,0,0,0,0,0)`,(err,response)=>{
                                    if(err)throw err;
                                    return res.status(201).send({
                                    msg: 'Registered!'
                                    });  
                                })
                            }
                        );
                    }
                });
            }
        }
    );
})

router.post('/login', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    db.query(`select * from login where email="${email}"`, (err, result) => {
        if (err) throw err;
        if (!result.length)
            return res.status(401).send({ msg: 'email or password is Invalid' })
        bcrypt.compare(password, result[0]['password'], (bErr, bResult) => {
            if (bErr) throw bErr;
            if (bResult) {
                console.log("Password matched")
                const token = jwt.sign({
                    username: result[0].username,
                    userId: result[0].id
                }, 'SECRETKEY', { expiresIn: '1m' });
                db.query(
                    `UPDATE login SET last_login = now() WHERE id = '${result[0].id}'`
                );
                return res.status(200).json({
                    msg: 'Logged in!',
                    token,
                    userId:result[0]['id'],
                    email:result[0]['email'],
                    username:result[0]['username']
                });
            }
            return res.status(401).send({
                msg: 'Username or password is incorrect!'
              });
        })
    })
    // res.send("Login is called")
})

router.get('/getAllHackers',(req,res)=>{
    id=req.query.id
    db.query(`select * from hackers`,(err,results)=>{
        if(err)throw err;
        res.send(JSON.stringify({"status":200,"error":null,"message":results}))
    })
})


router.get('/getHackerById',(req,res)=>{
    const id=req.query.id
    // console.log(req)
    // console.log("The id parameter is ")
    // console.log(req.params)
    db.query(`select * from hackers where id="${id}"`,(err,results)=>{
        if(err)throw err;
        res.send(JSON.stringify({"status":200,"error":null,"message":results}))
    })
})


router.get('/homeInfo',(req,res)=>{
    db.query(`select * from hackers order by votes and expertLevel desc`,(err,response)=>{
        if(err)throw err
        res.send(JSON.stringify({'message':response}))
    })
})


router.get('/voteById',(req,res)=>{
    const id=req.query.id;
    const voterId=req.query.voterId;
    console.log(id);

    db.query(`select * from voteDetails where voterId='${voterId}'`,(err,response)=>{
        if(err)throw err;
        if(response.length!=0)
        {
            return res.status(201).send({'msg':"You are already voted"})
        }else{
            db.query(`INSERT INTO voteDetails (voterId,userId) values ("${voterId}","${id}")`,(err,response)=>{
            if(err)throw err;
            db.query(`UPDATE hackers set votes=votes+1 where id='${id}'`,(err,response)=>{
                if(err)throw err;
                res.status(200).send({'msg':'Voted successfully'})
            })
        })    
        }
    })
})


router.post('/updateProfile',(req,res)=>{
    const id=req.body.id;
    db.query(`update hackers set expertLevel=${req.body.expertLevel},java=${req.body.java},python=${req.body.python},cpp=${req.body.cpp},ds=${req.body.ds},algo=${req.body.algo},noChallengesSolved=${req.body.noChallenges} where id='${id}'`,(err,response)=>{
        if(err)throw err;
        res.send({msg:'profile update success'})
    })
})
    



router.get('/secret-route', userMiddleware.isLoggedIn,(req,res, next) => {
    console.log(req.userData);
    res.send('This is the secret content. Only logged in users can see that!');
    // res.send('This is the secret content. Only logged in users can see that!');
});


module.exports = router;