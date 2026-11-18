import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getHealth = async () => {
  const res = await api.get('/health');
  return res.data;
};

export const getAnalysisSummary = async () => {
  const res = await api.get('/analysis/summary');
  return res.data;
};

export const getEntities = async (params = {}) => {
  const res = await api.get('/analysis/entities', { params });
  return res.data;
};

export const getEntityDetail = async (id) => {
  const res = await api.get(`/entities/${id}`);
  return res.data;
};

export const updateInvestigationStatus = async (id, status, notes = '') => {
  const res = await api.post(`/entities/${id}/investigate`, { status, notes });
  return res.data;
};

export const loadSampleDataset = async (numEntities = 50, inconsistencyRate = 0.35) => {
  const res = await api.post(`/sample/load?num_entities=${numEntities}&inconsistency_rate=${inconsistencyRate}`);
  return res.data;
};

export const uploadFiles = async (formData) => {
  const res = await api.post('/upload/files', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

export const runEvaluation = async (numEntities = 60, inconsistencyRate = 0.35, threshold = 25) => {
  const res = await api.get('/evaluation/run', {
    params: { num_entities: numEntities, inconsistency_rate: inconsistencyRate, threshold },
  });
  return res.data;
};

export const getExportCsvUrl = (severity = '') => {
  return `/api/reports/export/csv${severity ? `?severity=${severity}` : ''}`;
};

export const getExportPdfUrl = (unifiedEntityId) => {
  return `/api/reports/export/pdf/${unifiedEntityId}`;
};

export default api;
