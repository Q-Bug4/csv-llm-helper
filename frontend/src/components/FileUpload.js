/**
 * 文件上传组件
 * 支持拖拽上传和点击上传CSV文件
 */

import React, { useState, useCallback } from 'react';
import { Upload, message, Button, Card, Typography, Spin } from 'antd';
import { InboxOutlined, FileTextOutlined, EyeOutlined } from '@ant-design/icons';
import { previewCSV } from '../utils/api';
import { addRecentFile } from '../utils/storage';

const { Dragger } = Upload;
const { Title, Text, Paragraph } = Typography;

const FileUpload = ({ onFileSelect, onPreviewData }) => {
  const [uploading, setUploading] = useState(false);
  const [fileInfo, setFileInfo] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // 处理文件选择
  const handleFileSelect = useCallback(async (file) => {
    setUploading(true);
    
    try {
      // 验证文件类型
      if (!file.name.toLowerCase().endsWith('.csv')) {
        message.error('请选择CSV格式的文件');
        return false;
      }

      // 验证文件大小（50MB限制）
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        message.error('文件大小不能超过50MB');
        return false;
      }

      // 设置文件信息
      const info = {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        sizeFormatted: formatFileSize(file.size)
      };
      
      setFileInfo(info);
      setSelectedFile(file); // 保存文件对象
      
      // 添加到最近文件
      addRecentFile(info);
      
      // 回调父组件
      onFileSelect(file);
      
      message.success(`文件 ${file.name} 上传成功`);
      
    } catch (error) {
      console.error('文件选择失败:', error);
      message.error('文件选择失败: ' + error.message);
    } finally {
      setUploading(false);
    }
    
    return false; // 阻止自动上传
  }, [onFileSelect]);

  // 预览文件数据
  const handlePreview = useCallback(async () => {
    if (!fileInfo || !selectedFile || !onPreviewData) return;
    
    setPreviewLoading(true);
    
    try {
      // 直接使用保存的文件对象
      const file = selectedFile;
      
      if (!file) {
        message.error('请重新选择文件');
        return;
      }
      
      const response = await previewCSV(file, 10);
      
      if (response.success) {
        onPreviewData(response.data);
        message.success('文件预览成功');
      } else {
        message.error('预览失败: ' + response.message);
      }
      
    } catch (error) {
      console.error('预览失败:', error);
      message.error('预览失败: ' + error.message);
    } finally {
      setPreviewLoading(false);
    }
  }, [fileInfo, selectedFile, onPreviewData]);

  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="upload-card">
      <Title level={4}>
        <FileTextOutlined /> 上传CSV文件
      </Title>
      
      <Dragger
        name="file"
        multiple={false}
        accept=".csv"
        beforeUpload={handleFileSelect}
        showUploadList={false}
        className="upload-dragger"
      >
        <div className="upload-content">
          <p className="ant-upload-drag-icon">
            <InboxOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
          </p>
          <p className="ant-upload-text">
            点击或拖拽CSV文件到此区域上传
          </p>
          <p className="ant-upload-hint">
            支持单个文件上传，文件大小限制50MB
          </p>
        </div>
      </Dragger>

      {uploading && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Spin /> <Text>正在处理文件...</Text>
        </div>
      )}

      {fileInfo && !uploading && (
        <Card 
          size="small" 
          style={{ marginTop: 16, backgroundColor: '#f9f9f9' }}
          title="已选择文件"
          extra={
            <Button
              type="link"
              icon={<EyeOutlined />}
              loading={previewLoading}
              onClick={handlePreview}
            >
              预览数据
            </Button>
          }
        >
          <div className="file-info">
            <Paragraph>
              <Text strong>文件名: </Text>
              <Text code>{fileInfo.name}</Text>
            </Paragraph>
            <Paragraph>
              <Text strong>文件大小: </Text>
              <Text>{fileInfo.sizeFormatted}</Text>
            </Paragraph>
            <Paragraph>
              <Text strong>修改时间: </Text>
              <Text>{new Date(fileInfo.lastModified).toLocaleString()}</Text>
            </Paragraph>
          </div>
        </Card>
      )}
    </Card>
  );
};

export default FileUpload;
