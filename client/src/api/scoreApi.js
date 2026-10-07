import api from './axios';

export const getScoresByCourse = async (courseId) => {
  const response = await api.get(`/scores/course/${courseId}`);
  return response.data;
};

export const getScoresByUnit = async (unitId) => {
  const response = await api.get(`/scores/unit/${unitId}`);
  return response.data;
};

export const getScoresByStudent = async (studentId) => {
  const response = await api.get(`/scores/student/${studentId}`);
  return response.data;
};

export const createScore = async (scoreData) => {
  const response = await api.post('/scores', scoreData);
  return response.data;
};

export const createBulkScores = async (bulkData) => {
  const response = await api.post('/scores/bulk', bulkData);
  return response.data;
};

export const updateScore = async (id, scoreData) => {
  const response = await api.put(`/scores/${id}`, scoreData);
  return response.data;
};

export const deleteScore = async (id) => {
  const response = await api.delete(`/scores/${id}`);
  return response.data;
};