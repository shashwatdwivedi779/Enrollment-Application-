const student_data = require('../model/forms') ;


exports.GetSubmit = async (req, res, next) => {
    res.render('acceptenace', { student_data }) ;
}


