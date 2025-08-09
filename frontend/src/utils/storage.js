/**
 * 本地存储工具模块
 * 管理配置数据的本地存储
 */

const STORAGE_KEYS = {
  CONFIGS: 'csv_processor_configs',
  CURRENT_CONFIG: 'csv_processor_current_config',
  USER_PREFERENCES: 'csv_processor_preferences',
  RECENT_FILES: 'csv_processor_recent_files'
};

/**
 * 保存配置到本地存储
 * @param {string} name - 配置名称
 * @param {Object} config - 配置对象
 */
export const saveConfig = (name, config) => {
  try {
    const configs = getConfigs();
    configs[name] = {
      ...config,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem(STORAGE_KEYS.CONFIGS, JSON.stringify(configs));
    console.log('配置已保存:', name);
  } catch (error) {
    console.error('保存配置失败:', error);
    throw new Error('保存配置失败');
  }
};

/**
 * 获取所有保存的配置
 * @returns {Object} 配置对象集合
 */
export const getConfigs = () => {
  try {
    const configs = localStorage.getItem(STORAGE_KEYS.CONFIGS);
    return configs ? JSON.parse(configs) : {};
  } catch (error) {
    console.error('读取配置失败:', error);
    return {};
  }
};

/**
 * 获取单个配置
 * @param {string} name - 配置名称
 * @returns {Object|null} 配置对象
 */
export const getConfig = (name) => {
  const configs = getConfigs();
  return configs[name] || null;
};

/**
 * 删除配置
 * @param {string} name - 配置名称
 */
export const deleteConfig = (name) => {
  try {
    const configs = getConfigs();
    delete configs[name];
    localStorage.setItem(STORAGE_KEYS.CONFIGS, JSON.stringify(configs));
    console.log('配置已删除:', name);
  } catch (error) {
    console.error('删除配置失败:', error);
    throw new Error('删除配置失败');
  }
};

/**
 * 保存当前配置
 * @param {Object} config - 配置对象
 */
export const saveCurrentConfig = (config) => {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_CONFIG, JSON.stringify(config));
  } catch (error) {
    console.error('保存当前配置失败:', error);
  }
};

/**
 * 获取当前配置
 * @returns {Object|null} 配置对象
 */
export const getCurrentConfig = () => {
  try {
    const config = localStorage.getItem(STORAGE_KEYS.CURRENT_CONFIG);
    return config ? JSON.parse(config) : null;
  } catch (error) {
    console.error('读取当前配置失败:', error);
    return null;
  }
};

/**
 * 保存用户偏好设置
 * @param {Object} preferences - 偏好设置
 */
export const saveUserPreferences = (preferences) => {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
  } catch (error) {
    console.error('保存用户偏好失败:', error);
  }
};

/**
 * 获取用户偏好设置
 * @returns {Object} 偏好设置
 */
export const getUserPreferences = () => {
  try {
    const preferences = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
    return preferences ? JSON.parse(preferences) : {
      theme: 'light',
      language: 'zh',
      autoSave: true,
      showAdvanced: false
    };
  } catch (error) {
    console.error('读取用户偏好失败:', error);
    return {};
  }
};

/**
 * 添加到最近文件列表
 * @param {Object} fileInfo - 文件信息
 */
export const addRecentFile = (fileInfo) => {
  try {
    const recentFiles = getRecentFiles();
    const newFile = {
      ...fileInfo,
      timestamp: new Date().toISOString()
    };
    
    // 移除重复项
    const filtered = recentFiles.filter(file => file.name !== fileInfo.name);
    
    // 添加到开头，限制最大数量
    const updated = [newFile, ...filtered].slice(0, 10);
    
    localStorage.setItem(STORAGE_KEYS.RECENT_FILES, JSON.stringify(updated));
  } catch (error) {
    console.error('添加最近文件失败:', error);
  }
};

/**
 * 获取最近文件列表
 * @returns {Array} 最近文件列表
 */
export const getRecentFiles = () => {
  try {
    const recentFiles = localStorage.getItem(STORAGE_KEYS.RECENT_FILES);
    return recentFiles ? JSON.parse(recentFiles) : [];
  } catch (error) {
    console.error('读取最近文件失败:', error);
    return [];
  }
};

/**
 * 清空最近文件列表
 */
export const clearRecentFiles = () => {
  try {
    localStorage.setItem(STORAGE_KEYS.RECENT_FILES, JSON.stringify([]));
  } catch (error) {
    console.error('清空最近文件失败:', error);
  }
};

/**
 * 导出配置到JSON文件
 * @param {string} name - 配置名称
 */
export const exportConfig = (name) => {
  const config = getConfig(name);
  if (!config) {
    throw new Error('配置不存在');
  }
  
  const dataStr = JSON.stringify(config, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name}_config.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * 从JSON文件导入配置
 * @param {File} file - JSON文件
 * @returns {Promise<Object>} 配置对象
 */
export const importConfig = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target.result);
        resolve(config);
      } catch (error) {
        reject(new Error('无效的JSON文件'));
      }
    };
    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.readAsText(file);
  });
};

/**
 * 清空所有存储数据
 */
export const clearAllData = () => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    console.log('所有数据已清空');
  } catch (error) {
    console.error('清空数据失败:', error);
  }
};

/**
 * 获取存储使用情况
 * @returns {Object} 存储统计信息
 */
export const getStorageStats = () => {
  try {
    let totalSize = 0;
    const stats = {};
    
    Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
      const data = localStorage.getItem(storageKey);
      const size = data ? new Blob([data]).size : 0;
      stats[key] = { size, data: data ? JSON.parse(data) : null };
      totalSize += size;
    });
    
    return {
      totalSize,
      totalSizeFormatted: formatBytes(totalSize),
      details: stats
    };
  } catch (error) {
    console.error('获取存储统计失败:', error);
    return { totalSize: 0, details: {} };
  }
};

/**
 * 格式化字节数
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的字符串
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
