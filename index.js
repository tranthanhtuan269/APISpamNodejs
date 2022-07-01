const Joi = require('joi');
const express = require('express');
const mysql = require('mysql');
const app = express();

app.use(express.json());

function getConnection(){
    return mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'spamapi',
        multipleStatements: true
    });
}

const courses = [
    { id:1, name: 'course1'},
    { id:2, name: 'course2'},
    { id:3, name: 'course3'},
    { id:4, name: 'course4'},
    { id:5, name: 'course5'},
]

app.get('/', (req, res) => {
    res.send('Hello world');
});

app.get('/api/jobs', (req, res) => {
    const conn = getConnection();
    conn.connect(error => {
        if(!!error){
            console.log('Error');
        }else{
            conn.query("SELECT id, name, parent_id FROM jobs where parent_id = 0", function(error, rows, fields){
                if(!!error){
                    console.log('Error in the query');
                }else{
                    console.log('Successful query');
                    console.log(rows)
                }
                conn.end();
                res.send({
                    "status": 1,
                    "message": "OK",
                    "data": rows
                })
            });
        }
    })
});

app.get('/api/jobs/:id', (req, res) => {
    const conn = getConnection();
    conn.connect(error => {
        if(!!error){
            console.log('Error');
        }else{
            conn.query("SELECT id, name, parent_id FROM jobs where parent_id = " + req.params.id, function(error, rows, fields){
                if(!!error){
                    console.log('Error in the query');
                }else{
                    console.log('Successful query');
                    console.log(rows)
                }
                conn.end();
                res.send({
                    "status": 1,
                    "message": "OK",
                    "data": rows
                })
            });
        }
    })
});

app.get('/api/get-user-profile', (req, res) => {
    if(req.query.phone_number){
        const conn = getConnection();
        conn.connect(error => {
            if(!!error){
                console.log('Error');
            }else{
                conn.query("SELECT users.id, users.name, users.email, users.first_name, users.last_name, users.birthday, users.gender, users.street, users.company, users.about, users.website, users.security, jobs.name as job, users.city, users.country FROM users LEFT JOIN jobs ON users.job_id = jobs.id where users.phone = " + req.query.phone_number, function(error, rows, fields){
                    if(!!error){
                        console.log('Error in the query');
                    }else{
                        console.log('Successful query');
                        console.log(rows)
                    }
                    conn.end();
                    res.send({
                        "status": 1,
                        "message": "OK",
                        "data": rows
                    })
                });
            }
        })
    }else{
        console.log('Phone is required')
    }
});

app.get('/api/spams/get-top', (req, res) => {
    if(req.query.limit){
        const conn = getConnection();
        conn.connect(error => {
            if(!!error){
                console.log('Error');
            }else{
                conn.query("SELECT spams.id, spams.reported_name, spams.report_number, users.phone FROM spams join users on users.id = spams.reported_id order by spams.report_number DESC limit " + req.query.limit, function(error, rows, fields){
                    if(!!error){
                        console.log('Error in the query');
                    }else{
                        console.log('Successful query');
                        console.log(rows)
                    }
                    conn.end();
                    res.send({
                        "status": 1,
                        "message": "OK",
                        "data": rows
                    })
                });
            }
        })
    }else{
        console.log('Limit is required')
    }
});

app.post('/api/reports', (req, res) => {
    if(!req.body.phone_number || req.body.phone_number.length < 10){
        // 400 bad request
        res.status(400).send('Phone Number is required and should be minimum 10 charaters');
        return;
    }
    if(!req.body.user_type){
        // 400 bad request
        res.status(400).send('User type is required');
        return;
    }
    if(!req.body.spam_type){
        // 400 bad request
        res.status(400).send('Spam type is required');
        return;
    }
    if(!req.body.reported_name){
        // 400 bad request
        res.status(400).send('Name is required');
        return;
    }

    var user = null;
    var spam = null;
    var report = null;
    var userID = 0;
    var spamID = 0;
    var reportID = 0;

    const conn = getConnection();
    conn.connect(error => {
        if(!!error){
            console.log('Error');
        }else{
            conn.query("SELECT id, name FROM users where phone = " + req.body.phone_number + " limit 1", function(error, rows, fields){
                if(!!error){
                    console.log('Error in the query');
                }else{
                    if(rows.length > 0){
                        console.log('User existed');
                        conn.end();
                        userID = rows[0].id

                        const conn5 = getConnection();
                        conn5.connect(error => {
                            if(!!error){
                                console.log('Error');
                            }else{
                                conn5.query("SELECT id, reported_name FROM spams where reported_id = " + userID, function(error, rows, fields){
                                    if(!!error){
                                        console.log('Error in the query');
                                        conn5.end();
                                    }else{
                                        if(rows.length > 0){
                                            console.log('Spam existed');
                                            conn5.end();
                                            spamID = rows[0].id;

                                            const conn6 = getConnection();
                                            conn6.connect(error => {
                                                if(!!error){
                                                    console.log('Error');
                                                }else{
                                                    conn6.query(`SELECT id, reported_name FROM reports where reported_id = ${userID} AND reporter_id = 1`, function(error, rows, fields){
                                                        if(!!error){
                                                            console.log('Error in the query');
                                                            conn6.end();
                                                        }else{
                                                            if(rows.length > 0){
                                                                console.log('Report existed');
                                                                conn6.end();
                                                                reportID = rows[0].id;
                                                                // existed report then update
                                                                const conn8 = getConnection();
                                                                conn8.connect(error => {
                                                                    if(!!error){
                                                                        console.log('Error');
                                                                        conn8.end();
                                                                    }else{
                                                                        conn8.query(`UPDATE reports SET user_type = ${req.body.user_type}, spam_type = ${req.body.spam_type} where reported_id = ${userID} AND reporter_id = 1`, function(error, rows, fields){
                                                                            if(!!error){
                                                                                console.log('Error in the query');
                                                                            }else{
                                                                                console.log('Successful query');
                                                                                console.log(rows)
                                                                                reportID = rows.insertId; 
                                                                            }
                                                                            conn8.end();
                                                                        });
                                                                    }
                                                                })
                                                            }else{
                                                                conn6.end();
                                                                // not existed then add new 
                                                                console.log('Report add new');
                                                                const conn7 = getConnection();
                                                                conn7.connect(error => {
                                                                    if(!!error){
                                                                        console.log('Error');
                                                                        conn7.end();
                                                                    }else{
                                                                        conn7.query(`INSERT INTO reports (spam_id, reporter_id, reported_id, comment, user_type, spam_type) VALUES ('${spamID}', 1, '${userID}', '${req.body.comment}', '${req.body.user_type}', '${req.body.spam_type}')`, function(error, rows, fields){
                                                                            if(!!error){
                                                                                console.log('Error in the query');
                                                                            }else{
                                                                                console.log('Successful query');
                                                                                console.log(rows)
                                                                                reportID = rows.insertId; 
                                                                            }
                                                                            conn7.end();
                                                                        });
                                                                    }
                                                                })
                                                            }
                                                        }
                                                    });
                                                }
                                            })
                                        }else{
                                            conn5.end();

                                            const conn8 = getConnection();
                                            conn8.connect(error => {
                                                if(!!error){
                                                    console.log('Error');
                                                    conn8.end();
                                                }else{

                                                    conn8.query(`INSERT INTO spams (reported_id, user_type, spam_type, reported_name) VALUES ('${userID}', '${req.body.user_type}', '${req.body.spam_type}', '${req.body.reported_name}')`, function(error, rows, fields){
                                                        if(!!error){
                                                            console.log('Error in the query');
                                                            conn8.end();
                                                        }else{
                                                            conn8.end();
                                                            console.log('Successful query');
                                                            console.log(rows)
                                                            spamID = rows.insertId; 

                                                            const conn9 = getConnection();
                                                            conn9.connect(error => {
                                                                if(!!error){
                                                                    console.log('Error');
                                                                    conn9.end();
                                                                }else{
                                                                    conn9.query(`INSERT INTO reports (spam_id, reporter_id, reported_id, comment, user_type, spam_type) VALUES ('${spamID}', 1, '${userID}', '${req.body.comment}', '${req.body.user_type}', '${req.body.spam_type}')`, function(error, rows, fields){
                                                                        if(!!error){
                                                                            console.log('Error in the query');
                                                                        }else{
                                                                            console.log('Successful query');
                                                                            console.log(rows)
                                                                            reportID = rows.insertId; 
                                                                        }
                                                                        conn9.end();
                                                                    });
                                                                }
                                                            })

                                                            res.send('success');
                                                        }
                                                    });
                                                }
                                            })
                                        }
                                    }
                                });
                            }
                        })
                    }else{
                        conn.end();

                        const conn2 = getConnection();
                        conn2.connect(error => {
                            if(!!error){
                                console.log('Error');
                            }else{
                                conn2.query(`INSERT INTO users (name, phone, email) VALUES ('', '${req.body.phone_number}', '')`, function(error, rows, fields){
                                    if(!!error){
                                        console.log('Error in the query');
                                        conn2.end();
                                    }else{
                                        conn2.end();
                                        console.log('Successful query');
                                        console.log(rows)
                                        userID = rows.insertId;

                                        const conn3 = getConnection();
                                        conn3.connect(error => {
                                            if(!!error){
                                                console.log('Error');
                                            }else{
                                                conn3.query(`INSERT INTO spams (reported_id, user_type, spam_type, reported_name) VALUES ('${userID}', '${req.body.user_type}', '${req.body.spam_type}', '${req.body.reported_name}')`, function(error, rows, fields){
                                                    if(!!error){
                                                        console.log('Error in the query');
                                                        conn3.end();
                                                    }else{
                                                        conn3.end();
                                                        console.log('Successful query');
                                                        console.log(rows)
                                                        spamID = rows.insertId; 

                                                        const conn4 = getConnection();
                                                        conn4.connect(error => {
                                                            if(!!error){
                                                                console.log('Error');
                                                                conn4.end();
                                                            }else{
                                                                conn4.query(`INSERT INTO reports (spam_id, reporter_id, reported_id, comment, user_type, spam_type) VALUES ('${spamID}', 1, '${userID}', '${req.body.comment}', '${req.body.user_type}', '${req.body.spam_type}')`, function(error, rows, fields){
                                                                    if(!!error){
                                                                        console.log('Error in the query');
                                                                    }else{
                                                                        console.log('Successful query');
                                                                        console.log(rows)
                                                                        reportID = rows.insertId; 
                                                                    }
                                                                    conn4.end();
                                                                });
                                                            }
                                                        })

                                                        res.send('success');
                                                    }
                                                });
                                            }
                                        })
                                    }
                                });
                            }
                        })
                    }
                }
            });
        }
    })
});

app.post('/api/reports/suggest-name', (req, res) => {
    if(!req.body.phone_number || req.body.phone_number.length < 10){
        // 400 bad request
        res.status(400).send('Phone Number is required and should be minimum 10 charaters');
        return;
    }
    if(!req.body.user_type){
        // 400 bad request
        res.status(400).send('User type is required');
        return;
    }
    if(!req.body.reported_name){
        // 400 bad request
        res.status(400).send('Name is required');
        return;
    }

    var user = null;
    var spam = null;
    var report = null;
    var userID = 0;
    var spamID = 0;
    var reportID = 0;

    const conn = getConnection();
    conn.connect(error => {
        if(!!error){
            console.log('Error');
        }else{
            conn.query("SELECT id, name FROM users where phone = " + req.body.phone_number + " limit 1", function(error, rows, fields){
                if(!!error){
                    console.log('Error in the query');
                }else{
                    if(rows.length > 0){
                        console.log('User existed');
                        conn.end();
                        userID = rows[0].id

                        const conn5 = getConnection();
                        conn5.connect(error => {
                            if(!!error){
                                console.log('Error');
                            }else{
                                conn5.query("SELECT id, reported_name FROM spams where reported_id = " + userID, function(error, rows, fields){
                                    if(!!error){
                                        console.log('Error in the query');
                                        conn5.end();
                                    }else{
                                        if(rows.length > 0){
                                            console.log('Spam existed');
                                            conn5.end();
                                            spamID = rows[0].id;

                                            const conn6 = getConnection();
                                            conn6.connect(error => {
                                                if(!!error){
                                                    console.log('Error');
                                                }else{
                                                    conn6.query(`SELECT id, reported_name FROM reports where reported_id = ${userID} AND reporter_id = 1`, function(error, rows, fields){
                                                        if(!!error){
                                                            console.log('Error in the query');
                                                            conn6.end();
                                                        }else{
                                                            if(rows.length > 0){
                                                                console.log('Report existed');
                                                                conn6.end();
                                                                reportID = rows[0].id;
                                                                // existed report then update
                                                                const conn8 = getConnection();
                                                                conn8.connect(error => {
                                                                    if(!!error){
                                                                        console.log('Error');
                                                                        conn8.end();
                                                                    }else{
                                                                        conn8.query(`UPDATE reports SET user_type = ${req.body.user_type}, reported_name = ${req.body.name} where reported_id = ${userID} AND reporter_id = 1`, function(error, rows, fields){
                                                                            if(!!error){
                                                                                console.log('Error in the query');
                                                                            }else{
                                                                                console.log('Successful query');
                                                                                console.log(rows)
                                                                                reportID = rows.insertId; 
                                                                            }
                                                                            conn8.end();
                                                                            res.send({
                                                                                "status": 1,
                                                                                "message": "OK"
                                                                            })
                                                                        });
                                                                    }
                                                                })
                                                            }else{
                                                                conn6.end();
                                                                // not existed then add new 
                                                                console.log('Report add new');
                                                                const conn7 = getConnection();
                                                                conn7.connect(error => {
                                                                    if(!!error){
                                                                        console.log('Error');
                                                                        conn7.end();
                                                                    }else{
                                                                        conn7.query(`INSERT INTO reports (spam_id, reporter_id, reported_id, user_type, suggest_name) VALUES ('${spamID}', 1, '${userID}', '${req.body.user_type}', '${req.body.name}')`, function(error, rows, fields){
                                                                            if(!!error){
                                                                                console.log('Error in the query');
                                                                            }else{
                                                                                console.log('Successful query');
                                                                                console.log(rows)
                                                                                reportID = rows.insertId; 
                                                                            }
                                                                            conn7.end();
                                                                            res.send({
                                                                                "status": 1,
                                                                                "message": "OK"
                                                                            })
                                                                        });
                                                                    }
                                                                })
                                                            }
                                                        }
                                                    });
                                                }
                                            })
                                        }else{
                                            conn5.end();

                                            const conn8 = getConnection();
                                            conn8.connect(error => {
                                                if(!!error){
                                                    console.log('Error');
                                                    conn8.end();
                                                }else{

                                                    conn8.query(`INSERT INTO spams (reported_id, reported_name) VALUES ('${userID}', '${req.body.name}')`, function(error, rows, fields){
                                                        if(!!error){
                                                            console.log('Error in the query');
                                                            conn8.end();
                                                        }else{
                                                            conn8.end();
                                                            console.log('Successful query');
                                                            console.log(rows)
                                                            spamID = rows.insertId; 

                                                            const conn9 = getConnection();
                                                            conn9.connect(error => {
                                                                if(!!error){
                                                                    console.log('Error');
                                                                    conn9.end();
                                                                }else{
                                                                    conn9.query(`INSERT INTO reports (spam_id, reporter_id, reported_id, user_type, suggest_name) VALUES ('${spamID}', 1, '${userID}', '${req.body.user_type}', '${req.body.name}')`, function(error, rows, fields){
                                                                        if(!!error){
                                                                            console.log('Error in the query');
                                                                        }else{
                                                                            console.log('Successful query');
                                                                            console.log(rows)
                                                                            reportID = rows.insertId; 
                                                                        }
                                                                        conn9.end();
                                                                    });
                                                                }
                                                            })

                                                            res.send({
                                                                "status": 1,
                                                                "message": "OK"
                                                            })
                                                        }
                                                    });
                                                }
                                            })
                                        }
                                    }
                                });
                            }
                        })
                    }else{
                        conn.end();

                        const conn2 = getConnection();
                        conn2.connect(error => {
                            if(!!error){
                                console.log('Error');
                            }else{
                                conn2.query(`INSERT INTO users (name, phone, email) VALUES ('', '${req.body.phone_number}', '')`, function(error, rows, fields){
                                    if(!!error){
                                        console.log('Error in the query');
                                        conn2.end();
                                    }else{
                                        conn2.end();
                                        console.log('Successful query');
                                        console.log(rows)
                                        userID = rows.insertId;

                                        const conn3 = getConnection();
                                        conn3.connect(error => {
                                            if(!!error){
                                                console.log('Error');
                                            }else{
                                                conn3.query(`INSERT INTO spams (reported_id, user_type, reported_name) VALUES ('${userID}', '${req.body.user_type}', '${req.body.reported_name}')`, function(error, rows, fields){
                                                    if(!!error){
                                                        console.log('Error in the query');
                                                        conn3.end();
                                                    }else{
                                                        conn3.end();
                                                        console.log('Successful query');
                                                        console.log(rows)
                                                        spamID = rows.insertId; 

                                                        const conn4 = getConnection();
                                                        conn4.connect(error => {
                                                            if(!!error){
                                                                console.log('Error');
                                                                conn4.end();
                                                            }else{
                                                                conn4.query(`INSERT INTO reports (spam_id, reporter_id, reported_id, user_type, suggest_name) VALUES ('${spamID}', 1, '${userID}', '${req.body.user_type}', '${req.body.name}')`, function(error, rows, fields){
                                                                    if(!!error){
                                                                        console.log('Error in the query');
                                                                    }else{
                                                                        console.log('Successful query');
                                                                        console.log(rows)
                                                                        reportID = rows.insertId; 
                                                                    }
                                                                    conn4.end();
                                                                });
                                                            }
                                                        })

                                                        res.send({
                                                            "status": 1,
                                                            "message": "OK"
                                                        })
                                                    }
                                                });
                                            }
                                        })
                                    }
                                });
                            }
                        })
                    }
                }
            });
        }
    })
});

app.post('/api/reports/suggest-job', (req, res) => {
    if(!req.body.phone_number || req.body.phone_number.length < 10){
        // 400 bad request
        res.status(400).send('Phone Number is required and should be minimum 10 charaters');
        return;
    }
    if(!req.body.user_type){
        // 400 bad request
        res.status(400).send('User type is required');
        return;
    }
    if(!req.body.job_id){
        // 400 bad request
        res.status(400).send('Job is required');
        return;
    }

    var user = null;
    var spam = null;
    var report = null;
    var userID = 0;
    var spamID = 0;
    var reportID = 0;

    const conn = getConnection();
    conn.connect(error => {
        if(!!error){
            console.log('Error');
        }else{
            conn.query("SELECT id, name FROM users where phone = " + req.body.phone_number + " limit 1", function(error, rows, fields){
                if(!!error){
                    console.log('Error in the query');
                }else{
                    if(rows.length > 0){
                        console.log('User existed');
                        conn.end();
                        userID = rows[0].id

                        const conn5 = getConnection();
                        conn5.connect(error => {
                            if(!!error){
                                console.log('Error');
                            }else{
                                conn5.query("SELECT id, reported_name FROM spams where reported_id = " + userID, function(error, rows, fields){
                                    if(!!error){
                                        console.log('Error in the query');
                                        conn5.end();
                                    }else{
                                        if(rows.length > 0){
                                            console.log('Spam existed');
                                            conn5.end();
                                            spamID = rows[0].id;

                                            const conn6 = getConnection();
                                            conn6.connect(error => {
                                                if(!!error){
                                                    console.log('Error');
                                                }else{
                                                    conn6.query(`SELECT id, reported_name FROM reports where reported_id = ${userID} AND reporter_id = 1`, function(error, rows, fields){
                                                        if(!!error){
                                                            console.log('Error in the query');
                                                            conn6.end();
                                                        }else{
                                                            if(rows.length > 0){
                                                                console.log('Report existed');
                                                                conn6.end();
                                                                reportID = rows[0].id;
                                                                // existed report then update
                                                                const conn8 = getConnection();
                                                                conn8.connect(error => {
                                                                    if(!!error){
                                                                        console.log('Error');
                                                                        conn8.end();
                                                                    }else{
                                                                        conn8.query(`UPDATE reports SET user_type = ${req.body.user_type}, job_id = ${req.body.job_id} where reported_id = ${userID} AND reporter_id = 1`, function(error, rows, fields){
                                                                            if(!!error){
                                                                                console.log('Error in the query');
                                                                            }else{
                                                                                console.log('Successful query');
                                                                                console.log(rows)
                                                                                reportID = rows.insertId; 
                                                                            }
                                                                            conn8.end();
                                                                            res.send({
                                                                                "status": 1,
                                                                                "message": "OK"
                                                                            })
                                                                        });
                                                                    }
                                                                })
                                                            }else{
                                                                conn6.end();
                                                                // not existed then add new 
                                                                console.log('Report add new');
                                                                const conn7 = getConnection();
                                                                conn7.connect(error => {
                                                                    if(!!error){
                                                                        console.log('Error');
                                                                        conn7.end();
                                                                    }else{
                                                                        conn7.query(`INSERT INTO reports (spam_id, reporter_id, reported_id, user_type, job_id) VALUES ('${spamID}', 1, '${userID}', '${req.body.user_type}', '${req.body.job_id}')`, function(error, rows, fields){
                                                                            if(!!error){
                                                                                console.log('Error in the query');
                                                                            }else{
                                                                                console.log('Successful query');
                                                                                console.log(rows)
                                                                                reportID = rows.insertId; 
                                                                            }
                                                                            conn7.end();
                                                                            res.send({
                                                                                "status": 1,
                                                                                "message": "OK"
                                                                            })
                                                                        });
                                                                    }
                                                                })
                                                            }
                                                        }
                                                    });
                                                }
                                            })
                                        }else{
                                            conn5.end();

                                            const conn8 = getConnection();
                                            conn8.connect(error => {
                                                if(!!error){
                                                    console.log('Error');
                                                    conn8.end();
                                                }else{

                                                    conn8.query(`INSERT INTO spams (reported_id, job_id) VALUES ('${userID}', '${req.body.job_id}')`, function(error, rows, fields){
                                                        if(!!error){
                                                            console.log('Error in the query');
                                                            conn8.end();
                                                        }else{
                                                            conn8.end();
                                                            console.log('Successful query');
                                                            console.log(rows)
                                                            spamID = rows.insertId; 

                                                            const conn9 = getConnection();
                                                            conn9.connect(error => {
                                                                if(!!error){
                                                                    console.log('Error');
                                                                    conn9.end();
                                                                }else{
                                                                    conn9.query(`INSERT INTO reports (spam_id, reporter_id, reported_id, user_type, job_id) VALUES ('${spamID}', 1, '${userID}', '${req.body.user_type}', '${req.body.job_id}')`, function(error, rows, fields){
                                                                        if(!!error){
                                                                            console.log('Error in the query');
                                                                        }else{
                                                                            console.log('Successful query');
                                                                            console.log(rows)
                                                                            reportID = rows.insertId; 
                                                                        }
                                                                        conn9.end();
                                                                    });
                                                                }
                                                            })

                                                            res.send({
                                                                "status": 1,
                                                                "message": "OK"
                                                            })
                                                        }
                                                    });
                                                }
                                            })
                                        }
                                    }
                                });
                            }
                        })
                    }else{
                        conn.end();

                        const conn2 = getConnection();
                        conn2.connect(error => {
                            if(!!error){
                                console.log('Error');
                            }else{
                                conn2.query(`INSERT INTO users (name, phone, email) VALUES ('', '${req.body.phone_number}', '')`, function(error, rows, fields){
                                    if(!!error){
                                        console.log('Error in the query');
                                        conn2.end();
                                    }else{
                                        conn2.end();
                                        console.log('Successful query');
                                        console.log(rows)
                                        userID = rows.insertId;

                                        const conn3 = getConnection();
                                        conn3.connect(error => {
                                            if(!!error){
                                                console.log('Error');
                                            }else{
                                                conn3.query(`INSERT INTO spams (reported_id, user_type, job_id) VALUES ('${userID}', '${req.body.user_type}', '${req.body.job_id}')`, function(error, rows, fields){
                                                    if(!!error){
                                                        console.log('Error in the query');
                                                        conn3.end();
                                                    }else{
                                                        conn3.end();
                                                        console.log('Successful query');
                                                        console.log(rows)
                                                        spamID = rows.insertId; 

                                                        const conn4 = getConnection();
                                                        conn4.connect(error => {
                                                            if(!!error){
                                                                console.log('Error');
                                                                conn4.end();
                                                            }else{
                                                                conn4.query(`INSERT INTO reports (spam_id, reporter_id, reported_id, user_type, job_id) VALUES ('${spamID}', 1, '${userID}', '${req.body.user_type}', '${req.body.job_id}')`, function(error, rows, fields){
                                                                    if(!!error){
                                                                        console.log('Error in the query');
                                                                    }else{
                                                                        console.log('Successful query');
                                                                        console.log(rows)
                                                                        reportID = rows.insertId; 
                                                                    }
                                                                    conn4.end();
                                                                });
                                                            }
                                                        })

                                                        res.send({
                                                            "status": 1,
                                                            "message": "OK"
                                                        })
                                                    }
                                                });
                                            }
                                        })
                                    }
                                });
                            }
                        })
                    }
                }
            });
        }
    })
});

app.post('/api/users/update-user-profile', (req, res) => {
    const conn8 = getConnection();
    conn8.connect(error => {
        if(!!error){
            console.log('Error');
            conn8.end();
        }else{
            conn8.query(`UPDATE reports SET name = ${req.body.name}, email = ${req.body.email}, second_phone_number = ${req.body.second_phone_number}, first_name = ${req.body.first_name}, last_name = ${req.body.last_name}, birth_day = ${req.body.birth_day}, gender = ${req.body.gender}, street = ${req.body.street}, city = ${req.body.city}, country = ${req.body.country}, company = ${req.body.company}, about = ${req.body.about}, website = ${req.body.website}, security = ${req.body.security}, avatar = ${req.body.avatar}`, function(error, rows, fields){
                if(!!error){
                    console.log('Error in the query');
                }else{
                    console.log('Successful query');
                    console.log(rows)
                }
                conn8.end();
                res.send({
                    "status": 1,
                    "message": "OK"
                })
            });
        }
    })
});

app.post('/api/users/update-security', (req, res) => {
    const conn8 = getConnection();
    conn8.connect(error => {
        if(!!error){
            console.log('Error');
            conn8.end();
        }else{
            conn8.query(`UPDATE users SET security = '${req.body.security}' where id = 1`, function(error, rows, fields){
                if(!!error){
                    console.log('Error in the query');
                }else{
                    console.log('Successful query');
                    console.log(rows)
                }
                conn8.end();
                res.send({
                    "status": 1,
                    "message": "OK"
                })
            });
        }
    })
});


app.get('/api/courses/:id', (req, res) => {
    const course = courses.find(c => c.id === parseInt(req.params.id))
    if(!course) res.status(404).send('The course with the given ID was not found')
    res.send(course)
});

app.get('/api/courses/:month/:year', (req, res) => {
    res.send(req.query);
    // res.send(req.params);
});

app.post('/api/courses', (req, res) => {
    if(!req.body.name || req.body.name.length < 3){
        // 400 bad request
        res.status(400).send('Name is required and should be minimum 3 charaters');
        return;
    }

    const course = {
        id: courses.length + 1,
        name: req.body.name 
    }
    courses.push(course)
    res.send(courses)
});



// PORT
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}`));