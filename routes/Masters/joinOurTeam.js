const express = require('express');
const router = express.Router();
const joinOurTeamService = require('../../services/Masters/joinOurTeam.js');

router
    .post('/get', joinOurTeamService.get)
    .post('/getById', joinOurTeamService.getById)
    .post('/create', joinOurTeamService.validate(), joinOurTeamService.create)
    .post('/createWithResume', joinOurTeamService.createWithResume)
    .put('/update', joinOurTeamService.validate(), joinOurTeamService.update)
    .delete('/delete', joinOurTeamService.delete)
module.exports = router;
	