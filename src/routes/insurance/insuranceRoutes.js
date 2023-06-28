const express = require('express')
const {createInsuranceController,getAllInsuranceController, getSingleInsuranceController, updateInsuranceController, validateInsuranceController} = require('../../controller/insurance')
const router = express.Router()


router.post('/',createInsuranceController)
router.get('/',getAllInsuranceController)
router.get('/:id',getSingleInsuranceController)
router.put('/:id',updateInsuranceController)
router.post('/validate/:id',validateInsuranceController)

module.exports = router