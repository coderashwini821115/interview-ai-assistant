import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['candidate', 'interviewer'], required: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' },
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
export default User;
