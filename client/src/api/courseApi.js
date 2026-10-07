import api from './axios';

export const getCourses = async (params) => {
  const response = await api.get('/courses', { params });
  return response.data;
};

export const getCourseById = async (id) => {
  const response = await api.get(`/courses/${id}`);
  return response.data;
};

export const createCourse = async (courseData) => {
  const response = await api.post('/courses', courseData);
  return response.data;
};

export const updateCourse = async (id, courseData) => {
  const response = await api.put(`/courses/${id}`, courseData);
  return response.data;
};

export const deleteCourse = async (id) => {
  const response = await api.delete(`/courses/${id}`);
  return response.data;
};

export const addUnit = async (courseId, unitData) => {
  const response = await api.post(`/courses/${courseId}/units`, unitData);
  return response.data;
};

export const updateUnit = async (courseId, unitId, unitData) => {
  const response = await api.put(`/courses/${courseId}/units/${unitId}`, unitData);
  return response.data;
};

export const deleteUnit = async (courseId, unitId) => {
  const response = await api.delete(`/courses/${courseId}/units/${unitId}`);
  return response.data;
};

export const addManualStudent = async (id, studentData) => {
  const response = await api.post(`/courses/${id}/manual-students`, studentData);
  return response.data;
};

export const deleteManualStudent = async (id, studentIndex) => {
  const response = await api.delete(`/courses/${id}/manual-students/${studentIndex}`);
  return response.data;
};

export const getCourseScores = async (id) => {
  const response = await api.get(`/courses/${id}/scores`);
  return response.data;
};

export const saveBulkScores = async (id, data) => {
  const response = await api.post(`/courses/${id}/scores/bulk`, data);
  return response.data;
};

export const getCourseSummary = async (id) => {
  const response = await api.get(`/courses/${id}/summary`);
  return response.data;
};