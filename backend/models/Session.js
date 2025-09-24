const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sessionName: {type:String, required:true},
  studyMins: {type: Number, required:true},
  breakMins: {type: Number, required:true},
  numCycles: {type:Number, required:true},
  isCompleted: {type:Boolean, default:false, required:true}
});
    
    
    
module.exports = mongoose.model('Session', sessionSchema);
