/**
 * API请求工具模块
 * 封装所有与后端的通信逻辑
 */

import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api/v1',
  timeout: 300000, // 5分钟超时
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    console.log('发送请求:', config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    console.log('收到响应:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('响应错误:', error.response?.status, error.message);
    
    // 统一错误处理
    if (error.response) {
      // 服务器返回错误状态码
      const { status, data } = error.response;
      let message = data?.message || data?.detail || '服务器错误';
      
      switch (status) {
        case 400:
          message = '请求参数错误: ' + message;
          break;
        case 401:
          message = '未授权访问';
          break;
        case 403:
          message = '访问被拒绝';
          break;
        case 404:
          message = '请求的资源不存在';
          break;
        case 500:
          message = '服务器内部错误: ' + message;
          break;
        default:
          message = `服务器错误 (${status}): ${message}`;
      }
      
      error.message = message;
    } else if (error.request) {
      // 请求发送失败
      error.message = '网络连接失败，请检查网络设置';
    }
    
    return Promise.reject(error);
  }
);

/**
 * 处理CSV文件
 * @param {File} file - CSV文件
 * @param {Object} config - 处理配置
 * @returns {Promise} 处理结果
 */
export const processCSV = async (file, config) => {
  // 创建包含文件和配置的multipart请求
  const formData = new FormData();
  formData.append('file', file);
  formData.append('config_json', JSON.stringify({ config }));
  
  // 发送请求
  const response = await api.post('/process', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    }
  });
  
  return response.data;
};

/**
 * 预览CSV文件
 * @param {File} file - CSV文件
 * @param {number} n - 预览行数
 * @returns {Promise} 预览数据
 */
export const previewCSV = async (file, n = 10) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post(`/preview?n=${n}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

/**
 * 验证配置
 * @param {Object} config - 处理配置
 * @returns {Promise} 验证结果
 */
export const validateConfig = async (config) => {
  const response = await api.post('/validate-config', config);
  return response.data;
};

/**
 * 下载结果文件
 * @param {string} filePath - 文件路径
 * @returns {Promise} 文件blob
 */
export const downloadResult = async (filePath) => {
  // 对文件路径进行处理，将路径分段编码
  const encodedPath = filePath.split('/').map(segment => encodeURIComponent(segment)).join('/');
  const response = await api.get(`/download/${encodedPath}`, {
    responseType: 'blob',
  });
  
  return response.data;
};

/**
 * 健康检查
 * @returns {Promise} 服务状态
 */
export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

/**
 * 获取支持的模型列表
 * @returns {Promise} 模型列表
 */
export const getSupportedModels = async () => {
  const response = await api.get('/models');
  return response.data;
};

export default api;
