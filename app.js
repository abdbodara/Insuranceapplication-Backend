require('dotenv').config();
// express
const express = require('express')
const app = express()
// rest of pachage
const morgan = require('morgan')
const cors = require('cors')
// database
const pool = require('./src/db/connect');

// routes
const insuranceRouter = require('./src/routes/insurance/insuranceRoutes')

app.use(morgan('tiny'))
app.use(cors())
app.use(express.json())

// routes
app.get('/api/v1', (req, res) => {
    res.send("back-end is running...")
})

app.use('/api/v1/insurance', insuranceRouter)


const start = async () => {
    try {
        await pool.connect();
        app.listen(8000, () => {
            console.log(`Server is listening on port 8000...`);
        });
    } catch (error) {
        console.log(error);
    }
};

start()