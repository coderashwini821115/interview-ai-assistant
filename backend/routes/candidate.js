// backend/routes/candidates.js
import express from 'express';
import Candidate from '../models/Candidate.js';
import { requireAuth, loadUser } from '../middleware/auth.js';

const router = express.Router();

// GET /candidates - interviewer: list all; candidate: return own record
router.get('/', requireAuth, loadUser, async (req, res) => {
  try {
    const user = req.userDoc;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    if (user.role === 'interviewer') {
      const candidates = await Candidate.find({}).sort({ finalScore: -1 });
      return res.json(candidates);
    }

    if (user.role === 'candidate') {
      if (!user.candidateId) return res.status(404).json({ error: 'Candidate record not found' });
      const cand = await Candidate.findById(user.candidateId);
      return res.json(cand ? [cand] : []);
    }

    return res.status(403).json({ error: 'Forbidden' });
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
