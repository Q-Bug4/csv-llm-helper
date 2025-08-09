/**
 * 处理面板组件
 * 显示处理进度和结果
 */

import React, { useState } from 'react';
import {
  Card,
  Button,
  Progress,
  Typography,
  Alert,
  Descriptions,
  Space,
  Result,
  Divider,
  message,
  Spin
} from 'antd';
import {
  PlayCircleOutlined,
  DownloadOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { processCSV, downloadResult } from '../utils/api';

const { Title, Text, Paragraph } = Typography;

const ProcessingPanel = ({ file, config, previewData }) => {
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState({
    percent: 0,
    status: 'normal',
    current: 0,
    total: 0
  });

  // 开始处理
  const handleStartProcessing = async () => {
    if (!file) {
      message.error('请先选择CSV文件');
      return;
    }

    if (!config || !config.processing_logic) {
      message.error('请完善处理配置');
      return;
    }

    if (!config.output_schema || config.output_schema.length === 0) {
      message.error('请至少配置一个输出列');
      return;
    }

    setProcessing(true);
    setResult(null);
    setProgress({ percent: 0, status: 'active', current: 0, total: 0 });

    try {
      // 估算处理进度（简单模拟）
      const estimatedChunks = Math.ceil((previewData?.file_info?.rows || 100) / config.chunk_size);
      setProgress(prev => ({ ...prev, total: estimatedChunks }));

      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev.current < prev.total - 1) {
            const newCurrent = prev.current + 1;
            const newPercent = Math.round((newCurrent / prev.total) * 90); // 90%之前模拟
            return {
              ...prev,
              current: newCurrent,
              percent: newPercent
            };
          }
          return prev;
        });
      }, 2000);

      // 调用处理API
      const response = await processCSV(file, config);

      // 清除进度模拟
      clearInterval(progressInterval);

      if (response.success) {
        setProgress({
          percent: 100,
          status: 'success',
          current: response.total_chunks,
          total: response.total_chunks
        });
        
        setResult({
          ...response,
          type: 'success'
        });
        
        message.success('CSV处理完成！');
      } else {
        setProgress({
          percent: 100,
          status: 'exception',
          current: response.processed_chunks || 0,
          total: response.total_chunks || 0
        });
        
        setResult({
          ...response,
          type: 'error'
        });
        
        message.error('处理失败: ' + response.message);
      }

    } catch (error) {
      console.error('处理失败:', error);
      
      setProgress({
        percent: 100,
        status: 'exception',
        current: 0,
        total: 0
      });
      
      setResult({
        success: false,
        message: error.message,
        type: 'error'
      });
      
      message.error('处理失败: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  // 下载结果
  const handleDownload = async () => {
    if (!result?.download_url) {
      message.error('没有可下载的文件');
      return;
    }

    try {
      const blob = await downloadResult(result.download_url);
      
      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `processed_result_${new Date().getTime()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      message.success('文件下载开始');
    } catch (error) {
      console.error('下载失败:', error);
      message.error('下载失败: ' + error.message);
    }
  };

  // 重新处理
  const handleReprocess = () => {
    setResult(null);
    setProgress({ percent: 0, status: 'normal', current: 0, total: 0 });
  };

  // 验证是否可以开始处理
  const canStartProcessing = () => {
    return file && 
           config && 
           config.processing_logic && 
           config.output_schema && 
           config.output_schema.length > 0 &&
           config.api_key &&
           !processing;
  };

  return (
    <Card>
      <Title level={4}>
        <PlayCircleOutlined /> 处理控制
      </Title>

      {/* 处理前的信息展示 */}
      {previewData && !processing && !result && (
        <Alert
          message="准备就绪"
          description={
            <Space direction="vertical" size={4}>
              <Text>文件: {file?.name}</Text>
              <Text>数据行数: {previewData.file_info?.rows || 0}</Text>
              <Text>数据列数: {previewData.file_info?.columns || 0}</Text>
              <Text>预计分块数: {Math.ceil((previewData.file_info?.rows || 0) / (config?.chunk_size || 1))}</Text>
            </Space>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* 开始处理按钮 */}
      {!processing && !result && (
        <Button
          type="primary"
          size="large"
          icon={<PlayCircleOutlined />}
          onClick={handleStartProcessing}
          disabled={!canStartProcessing()}
          style={{ width: '100%', marginBottom: 16 }}
        >
          开始处理CSV文件
        </Button>
      )}

      {/* 处理中的进度显示 */}
      {processing && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <Spin size="small" style={{ marginRight: 8 }} />
            <Text strong>正在处理中...</Text>
          </div>
          
          <Progress
            percent={progress.percent}
            status={progress.status}
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#52c41a',
            }}
          />
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <Text type="secondary">
              进度: {progress.current} / {progress.total} 块
            </Text>
            <Text type="secondary">
              {progress.percent}%
            </Text>
          </div>
        </div>
      )}

      {/* 处理结果显示 */}
      {result && !processing && (
        <div className="fade-in">
          {result.type === 'success' ? (
            <Result
              status="success"
              title="处理完成"
              subTitle={result.message}
              extra={[
                <Button
                  key="download"
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={handleDownload}
                  disabled={!result.download_url}
                >
                  下载结果文件
                </Button>,
                <Button
                  key="reprocess"
                  icon={<ReloadOutlined />}
                  onClick={handleReprocess}
                >
                  重新处理
                </Button>
              ]}
            />
          ) : (
            <Result
              status="error"
              title="处理失败"
              subTitle={result.message}
              extra={[
                <Button
                  key="reprocess"
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={handleReprocess}
                >
                  重新尝试
                </Button>
              ]}
            />
          )}

          {/* 详细统计信息 */}
          {result.total_chunks > 0 && (
            <>
              <Divider />
              <Descriptions title="处理统计" bordered size="small">
                <Descriptions.Item label="总分块数">
                  {result.total_chunks}
                </Descriptions.Item>
                <Descriptions.Item label="成功分块数">
                  <Text type="success">
                    <CheckCircleOutlined /> {result.processed_chunks}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="失败分块数">
                  <Text type="danger">
                    <CloseCircleOutlined /> {result.failed_chunks}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="成功率">
                  {result.total_chunks > 0 
                    ? `${Math.round((result.processed_chunks / result.total_chunks) * 100)}%`
                    : '0%'
                  }
                </Descriptions.Item>
              </Descriptions>
            </>
          )}

          {/* 错误详情 */}
          {result.error_details && (
            <>
              <Divider />
              <Alert
                message="错误详情"
                description={
                  <Paragraph>
                    <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
                      {result.error_details}
                    </pre>
                  </Paragraph>
                }
                type="error"
                showIcon
              />
            </>
          )}
        </div>
      )}

      {/* 使用提示 */}
      {!file && (
        <Alert
          message="使用提示"
          description={
            <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
              <li>首先上传CSV文件</li>
              <li>配置处理逻辑和输出格式</li>
              <li>点击开始处理等待结果</li>
              <li>处理完成后下载结果文件</li>
            </ul>
          }
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}
    </Card>
  );
};

export default ProcessingPanel;
