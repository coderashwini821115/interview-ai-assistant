import {createSlice} from '@reduxjs/toolkit';

const initialState = {
    profile: {name: '', email: '', phone: ''},
    chatHistory: [],
    currentQuestionIndex: 0,
    answers: [],
    score: null,
    isPaused: false,
};

const candidateSlice = createSlice({
    name: 'candidate',
    initialState,
    reducers: { 
        setProfile(state, action) {
            state.profile = {...state.profile, ...action.payload};
        },
        addChatMessage(state, action) {
            state.chatHistory.push(action.payload);
        },
        setCurrentQuestionIndex(state, action) {
            state.currentQuestionIndex = action.payload;
        },
        addAnswer(state, action) {
            state.answers.push(action.payload);
        },
        setScore(state, action) {
            state.score = action.payload;
        },
        setPause(state, action) {
            state.isPaused = action.payload;
        },
        reset(state) {
            return initialState;
        },
    },
});

export const {
    setProfile,
    addChatMessage, setCurrentQuestionIndex,
    addAnswer, setScore,
    setPause, reset
} = candidateSlice.actions;     
export default candidateSlice.reducer;