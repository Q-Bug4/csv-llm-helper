/**
 * 主应用组件
 * 整合所有功能组件
 */

import React, { useState, useEffect } from 'react';
import {
  Layout,
  Typography,
  Row,
  Col,
  Space,
  Divider,
  FloatButton,
  message
} from 'antd';
import {
  FileTextOutlined,
  SettingOutlined,
  RocketOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';

import FileUpload from './components/FileUpload';
import ConfigForm from './components/ConfigForm';
import DataPreview from './components/DataPreview';
import ProcessingPanel from './components/ProcessingPanel';
import { healthCheck } from './utils/api';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [config, setConfig] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [serverStatus, setServerStatus] = useState('checking');

  // 检查服务器状态
  useEffect(() => {
    checkServerHealth();
  }, []);

  const checkServerHealth = async () => {
    try {
      const response = await healthCheck();
      if (response.status === 'healthy') {
        setServerStatus('healthy');
        message.success('后端服务连接正常', 2);
      } else {
        setServerStatus('error');
        message.error('后端服务状态异常', 3);
      }
    } catch (error) {
      setServerStatus('error');
      message.error('无法连接到后端服务，请检查服务是否启动', 5);
      console.error('健康检查失败:', error);
    }
  };

  // 处理文件选择
  const handleFileSelect = (file) => {
    setSelectedFile(file);
    // 清除之前的预览数据
    setPreviewData(null);
  };

  // 处理配置变化
  const handleConfigChange = (newConfig) => {
    setConfig(newConfig);
  };

  // 处理预览数据
  const handlePreviewData = (data) => {
    setPreviewData(data);
  };

  return (
    <Layout className="app-container" style={{ minHeight: '100vh' }}>
      <Header style={{
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Space>
            <FileTextOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
            <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
              CSV大模型处理引擎
            </Title>
          </Space>
          
          <Space>
            <div style={{
              padding: '4px 12px',
              borderRadius: '12px',
              background: serverStatus === 'healthy' ? '#f6ffed' : '#fff2f0',
              border: `1px solid ${serverStatus === 'healthy' ? '#b7eb8f' : '#ffccc7'}`
            }}>
              <Text style={{
                fontSize: '12px',
                color: serverStatus === 'healthy' ? '#52c41a' : '#ff4d4f'
              }}>
                ● {serverStatus === 'healthy' ? '服务正常' : '服务异常'}
              </Text>
            </div>
            <Text type="secondary">v1.0.0</Text>
          </Space>
        </div>
      </Header>

      <Content className="main-content">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* 页面标题和说明 */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <Title level={2} style={{ color: 'white', marginBottom: '8px' }}>
              基于大语言模型的通用CSV数据处理平台
            </Title>
            <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px' }}>
              上传CSV文件，配置处理逻辑，让AI帮您自动处理数据
            </Text>
          </div>

          {/* 主要内容区域 */}
          <div className="content-card">
            <Row gutter={[24, 24]}>
              {/* 左侧：文件上传和数据预览 */}
              <Col xs={24} lg={12}>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <FileUpload
                    onFileSelect={handleFileSelect}
                    onPreviewData={handlePreviewData}
                  />
                  
                  <DataPreview previewData={previewData} />
                </Space>
              </Col>

              {/* 右侧：配置和处理 */}
              <Col xs={24} lg={12}>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <ConfigForm
                    onConfigChange={handleConfigChange}
                    previewData={previewData}
                  />
                  
                  <ProcessingPanel
                    file={selectedFile}
                    config={config}
                    previewData={previewData}
                  />
                </Space>
              </Col>
            </Row>
          </div>

          {/* 使用说明 */}
          <div style={{ marginTop: '32px', padding: '24px', background: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px' }}>
            <Title level={4} style={{ marginBottom: '16px' }}>
              📋 使用步骤
            </Title>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <div style={{ textAlign: 'center', padding: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: '#1890ff',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                    fontSize: '20px',
                    fontWeight: 'bold'
                  }}>
                    1
                  </div>
                  <Title level={5}>上传CSV文件</Title>
                  <Text type="secondary">支持拖拽上传，文件大小限制50MB</Text>
                </div>
              </Col>
              
              <Col xs={24} sm={12} md={6}>
                <div style={{ textAlign: 'center', padding: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: '#52c41a',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                    fontSize: '20px',
                    fontWeight: 'bold'
                  }}>
                    2
                  </div>
                  <Title level={5}>预览数据</Title>
                  <Text type="secondary">查看文件结构和样本数据</Text>
                </div>
              </Col>
              
              <Col xs={24} sm={12} md={6}>
                <div style={{ textAlign: 'center', padding: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: '#faad14',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                    fontSize: '20px',
                    fontWeight: 'bold'
                  }}>
                    3
                  </div>
                  <Title level={5}>配置处理</Title>
                  <Text type="secondary">设置处理逻辑和输出格式</Text>
                </div>
              </Col>
              
              <Col xs={24} sm={12} md={6}>
                <div style={{ textAlign: 'center', padding: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: '#f5222d',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                    fontSize: '20px',
                    fontWeight: 'bold'
                  }}>
                    4
                  </div>
                  <Title level={5}>开始处理</Title>
                  <Text type="secondary">AI自动处理并下载结果</Text>
                </div>
              </Col>
            </Row>
          </div>
        </div>
      </Content>

      <Footer style={{ textAlign: 'center', background: 'transparent', color: 'rgba(255, 255, 255, 0.6)' }}>
        <Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
          CSV大模型处理引擎 ©2025 - 让AI处理您的数据
        </Text>
      </Footer>

      {/* 浮动按钮 */}
      <FloatButton.Group
        trigger="hover"
        type="primary"
        style={{ right: 24 }}
        icon={<QuestionCircleOutlined />}
      >
        <FloatButton
          icon={<RocketOutlined />}
          tooltip="快速开始"
          onClick={() => {
            message.info('滚动到页面顶部开始使用');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
        <FloatButton
          icon={<SettingOutlined />}
          tooltip="检查服务状态"
          onClick={checkServerHealth}
        />
      </FloatButton.Group>
    </Layout>
  );
}

export default App;
