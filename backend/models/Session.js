const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sessionName: {type:String, required:true},
  studyMins: {type: Number, required:true},
  breakMins: {type: Number, required:true},
  numCycles: {type:Number, required:true},
  shouldRepeat: {type: Boolean, required:true},
  status: {
    type: String, 
    enum: ['pending', 'active', 'completed', 'cancelled'],
    default: 'pending'
  },
  longBreakMins: {type:Number}
});
    
    
    
module.exports = mongoose.model('Session', sessionSchema);
