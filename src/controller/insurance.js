const pool = require('../db/connect')

const createInsuranceController = async (req, res) => {
    try {
        const createTablesQuery = `
    CREATE TABLE IF NOT EXISTS insurance_details (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        date_of_birth DATE NOT NULL,
        street VARCHAR(255) NOT NULL,
        city VARCHAR(255) NOT NULL,
        state VARCHAR(255) NOT NULL,
        zip_code INTEGER NOT NULL,
        price DECIMAL(10, 2),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS vehicles (
        id SERIAL PRIMARY KEY,
        insurance_id INTEGER NOT NULL,
        vin VARCHAR(255) NOT NULL,
        year INTEGER NOT NULL,
        make VARCHAR(255) NOT NULL,
        model VARCHAR(255) NOT NULL,
        FOREIGN KEY (insurance_id) REFERENCES insurance_details (id)
    );
`;
        // Create the insurance_details and vehicles tables if they don't exist
        await pool.query(createTablesQuery);

        const {
            first_name,
            last_name,
            date_of_birth,
            street,
            city,
            state,
            zip_code,
            vehicles,
        } = req.body;

        const currentDate = new Date();
        const birthDate = new Date(date_of_birth);
        const ageDiff = currentDate.getFullYear() - birthDate.getFullYear();
        const isOldEnough =
            ageDiff > 16 ||
            (ageDiff === 16 &&
                currentDate.getMonth() >= birthDate.getMonth() &&
                currentDate.getDate() >= birthDate.getDate());

        if (!isOldEnough) {
            return res
                .status(400)
                .json({ message: 'Date of birth must be at least 16 years ago' });
        }

        if (vehicles?.length > 3) {
            return res
                .status(400)
                .json({ message: 'You can not add more than 3 vehicles' });
        }

        const insertInsuranceDetailsQuery = `INSERT INTO insurance_details (first_name, last_name, date_of_birth, street, city, state, zip_code) 
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id`;

        const insuranceResult = await pool.query(insertInsuranceDetailsQuery, [
            first_name,
            last_name,
            date_of_birth,
            street,
            city,
            state,
            zip_code,
        ]);

        const insuranceId = insuranceResult.rows[0].id;

        const insertVehicleQuery = `INSERT INTO vehicles (insurance_id, vin, year, make, model) 
            VALUES ($1, $2, $3, $4, $5)`;

        for (const vehicle of vehicles) {
            await pool.query(insertVehicleQuery, [
                insuranceId,
                vehicle.vin,
                vehicle.year,
                vehicle.make,
                vehicle.model,
            ]);
        }
        const insuranceData = {
            id: insuranceResult.rows[0].id,
            ...req.body
        };
        return res.status(201).json({
            message: 'Insurance created successfully',
            data: insuranceData,
        });
    } catch (error) {
        console.log(error, 'error');
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getAllInsuranceController = async (req, res) => {
    try {
        const getInsuranceQuery = `
        SELECT insurance_details.*, 
        json_agg(vehicles.*) AS vehicles
 FROM insurance_details
 LEFT JOIN vehicles ON insurance_details.id = vehicles.insurance_id
 GROUP BY insurance_details.id
        `;
        const { rows: insuranceRows } = await pool.query(getInsuranceQuery);
        return res.status(200).json({
            message: 'All insurance data retrieved successfully',
            data: insuranceRows,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const getSingleInsuranceController = async (req, res) => {
    try {
        const getInsuranceQuery = `
        SELECT insurance_details.*, 
        json_agg(vehicles.*) AS vehicles
        FROM insurance_details
        LEFT JOIN vehicles ON insurance_details.id = vehicles.insurance_id
        GROUP BY insurance_details.id
        `;
        const { rows: insuranceRows } = await pool.query(getInsuranceQuery);
        const insuranceId = req.params.id;
        const data = insuranceRows.filter((item) => {
            console.log(typeof insuranceId, typeof item.id);
            return String(item.id) === String(insuranceId);
        });

        return res.status(200).json({
            message: `Get the data of this insurance id = ${insuranceId}`,
            data
        });
    } catch (error) {

    }
}

const updateInsuranceController = async (req, res) => {
    try {
        const insuranceId = req.params.id;
        const {
            first_name,
            last_name,
            date_of_birth,
            street,
            city,
            state,
            zip_code,
            vehicles
        } = req.body;

        console.log(vehicles,"modelmodelmodel");
        vehicles.map((item) => {
            pool.query(
                `UPDATE vehicles SET 
            vin = COALESCE(NULLIF($1, ''), vin), 
            year = $2,
            make= COALESCE(NULLIF($3, ''), make),
            model=COALESCE(NULLIF($4, ''), model)
            WHERE id = $5`,
                [item.vin,
                item.year,
                item.make,
                item.model,
                item.id
                ],
            )
        })

        pool.query(
            `UPDATE insurance_details SET 
        first_name = COALESCE(NULLIF($1, ''), first_name), 
        last_name = COALESCE(NULLIF($2, ''), last_name), 
        date_of_birth=$3,
        street=COALESCE(NULLIF($4, ''), street),
        city=COALESCE(NULLIF($5, ''), city),
        state=COALESCE(NULLIF($6, ''), state),
        zip_code=$7 
        WHERE id = $8`,
            [first_name,
                last_name,
                date_of_birth,
                street,
                city,
                state,
                zip_code,
                insuranceId],
            (error, results) => {
                if (error) {
                    console.log(error);
                    return res.status(500).json({ message: 'Failed to update insurance details' });
                }
                return res.status(200).json({ status: 'updated successfully' });
            }
        )

        // if (result.length === 0) {
        //   return res.status(404).json({ message: 'Insurance details not found' });
        // }


        //     const updateQuery = `
        //   UPDATE insurance_details 
        //   SET
        //     first_name = COALESCE(NULLIF($1::text, first_name)),
        //     last_name = COALESCE(NULLIF($2::text, last_name)),
        //     date_of_birth = COALESCE(
        //       NULLIF(
        //         CASE
        //           WHEN $3 = '' THEN null
        //           ELSE to_date($3, 'YYYY-MM-DD')
        //         END, date_of_birth), date_of_birth),
        //     street = COALESCE(NULLIF($4::text, street)),
        //     city = COALESCE(NULLIF($5::text, city)),
        //     state = COALESCE(NULLIF($6::text, state)),
        //     zip_code = COALESCE(NULLIF($7, zip_code))
        //   WHERE id = $8
        // `;

        // const values = [
        //   first_name,
        //   last_name || '',
        //   date_of_birth || '',
        //   street || null,
        //   city || null,
        //   state || null,
        //   zip_code || null,
        //   insuranceId
        // ];

        // console.log('updateQuery -->>', updateQuery);
        // console.log('values ----------->>>', values);
        // const { rows: updatedInsurances } = await pool.query(updateQuery, values);



        //       console.log('updatedInsurances -->>', updatedInsurances);

        //     if (updatedInsurances.length === 0) {
        //       return res.status(500).json({ message: 'Failed to update insurance details' });
        //     }

        //     return res.status(200).json({ status: 'success', updatedInsurance: updatedInsurances[0] });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const validateInsuranceController = async (req,res) => {
    try {
        const id = req.params.id;
        // Find data by ID using PostgreSQL query
        const selectQuery = 'SELECT * FROM insurance_details WHERE id = $1';
        const selectResult = await pool.query(selectQuery, [id]);
        const data = selectResult.rows[0];
    
        // Add a "price" field with a random value
        const price = Math.floor(Math.random() * 1000)
        data.price = price;
    
        // Update the record in the database with the new price value
        const updateQuery = 'UPDATE insurance_details SET price = $1 WHERE id = $2';
        await pool.query(updateQuery, [price, id]);
    
        res.json({
            message : "Insurance validate successfullyy",
            data
        });
      } catch (error) {
        console.error('Error retrieving data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
}







module.exports = { createInsuranceController, getAllInsuranceController, getSingleInsuranceController, updateInsuranceController,validateInsuranceController }

