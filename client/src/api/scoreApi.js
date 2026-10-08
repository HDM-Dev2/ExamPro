import api from './axios';

export const getScoresByClass = async (classId) => {
  const response = await api.get(`/scores/class/${classId}`);
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

export const saveBulkScores = async (data) => {
  const response = await api.post('/scores/bulk', data);
  return response.data;
};

export const unlockScores = async (classId, unitId) => {
  const response = await api.post('/scores/unlock', { classId, unitId });
  return response.data;
};

export const updateScore = async (id, data) => {
  const response = await api.put(`/scores/${id}`, data);
  return response.data;
};

export const deleteScore = async (id) => {
  const response = await api.delete(`/scores/${id}`);
  return response.data;
};