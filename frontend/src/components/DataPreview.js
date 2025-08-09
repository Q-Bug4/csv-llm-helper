/**
 * 数据预览组件
 * 显示CSV文件的结构和样本数据
 */

import React, { useState } from 'react';
import {
  Card,
  Table,
  Typography,
  Descriptions,
  Tag,
  Space,
  Button,
  Collapse,
  Empty,
  Statistic,
  Row,
  Col
} from 'antd';
import {
  TableOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  BarChartOutlined,
  FileTextOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

const DataPreview = ({ previewData }) => {
  const [expandedKeys, setExpandedKeys] = useState(['1']);

  if (!previewData) {
    return (
      <Card>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="请先上传CSV文件并点击预览"
        />
      </Card>
    );
  }

  const { file_info, sample_data, column_names } = previewData;

  // 生成表格列配置
  const columns = column_names?.map((col, index) => ({
    title: col,
    dataIndex: col,
    key: col,
    ellipsis: true,
    render: (text) => (
      <Text style={{ fontSize: '12px' }}>
        {text !== null && text !== undefined ? String(text) : '-'}
      </Text>
    ),
    width: 150
  })) || [];

  // 为表格数据添加key
  const tableData = sample_data?.map((row, index) => ({
    ...row,
    key: index
  })) || [];

  // 分析数据类型
  const analyzeDataTypes = () => {
    if (!sample_data || sample_data.length === 0) return {};
    
    const analysis = {};
    
    column_names?.forEach(col => {
      const values = sample_data.map(row => row[col]).filter(val => val !== null && val !== undefined && val !== '');
      
      if (values.length === 0) {
        analysis[col] = { type: '空值', samples: [] };
        return;
      }
      
      const samples = values.slice(0, 3);
      
      // 简单的类型检测
      const allNumbers = values.every(val => !isNaN(val) && !isNaN(parseFloat(val)));
      const allDates = values.every(val => !isNaN(Date.parse(val)));
      
      if (allNumbers) {
        analysis[col] = { type: '数值', samples };
      } else if (allDates && !allNumbers) {
        analysis[col] = { type: '日期', samples };
      } else {
        analysis[col] = { type: '文本', samples };
      }
    });
    
    return analysis;
  };

  const dataAnalysis = analyzeDataTypes();

  return (
    <Card>
      <Title level={4}>
        <TableOutlined /> 数据预览
      </Title>

      <Collapse 
        activeKey={expandedKeys} 
        onChange={setExpandedKeys}
        style={{ marginBottom: 16 }}
      >
        <Panel header={
          <Space>
            <InfoCircleOutlined />
            <span>文件信息</span>
          </Space>
        } key="1">
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="总行数"
                value={file_info?.rows || 0}
                prefix={<FileTextOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="总列数"
                value={file_info?.columns || 0}
                prefix={<BarChartOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="文件编码"
                value={file_info?.encoding || 'UTF-8'}
                formatter={(value) => <Tag color="blue">{value}</Tag>}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="预览行数"
                value={sample_data?.length || 0}
                prefix={<EyeOutlined />}
              />
            </Col>
          </Row>
        </Panel>

        <Panel header={
          <Space>
            <BarChartOutlined />
            <span>列信息分析</span>
          </Space>
        } key="2">
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {column_names?.map((col, index) => {
              const analysis = dataAnalysis[col];
              return (
                <div key={col} style={{ marginBottom: 12, padding: 8, backgroundColor: '#f9f9f9', borderRadius: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text strong>{col}</Text>
                    <Tag color={
                      analysis?.type === '数值' ? 'blue' :
                      analysis?.type === '日期' ? 'green' : 'default'
                    }>
                      {analysis?.type || '未知'}
                    </Tag>
                  </div>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    样本值: {analysis?.samples?.join(', ') || '无数据'}
                  </Text>
                </div>
              );
            })}
          </div>
        </Panel>
      </Collapse>

      {/* 数据表格 */}
      <div style={{ marginTop: 16 }}>
        <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong>样本数据 (前 {sample_data?.length || 0} 行)</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            * 表格可水平滚动查看更多列
          </Text>
        </div>
        
        <div style={{ border: '1px solid #f0f0f0', borderRadius: 6, overflow: 'hidden' }}>
          <Table
            columns={columns}
            dataSource={tableData}
            pagination={false}
            scroll={{ x: 'max-content', y: 400 }}
            size="small"
            bordered
            style={{ margin: 0 }}
          />
        </div>
      </div>

      {/* 数据建议 */}
      {file_info && (
        <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6 }}>
          <Text strong style={{ color: '#52c41a' }}>💡 处理建议:</Text>
          <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
            <li>
              <Text>建议分块大小: {Math.min(Math.max(Math.ceil((file_info.rows || 0) / 20), 20), 100)} 行</Text>
            </li>
            <li>
              <Text>预计处理时间: {Math.ceil((file_info.rows || 0) / 100)} - {Math.ceil((file_info.rows || 0) / 50)} 分钟</Text>
            </li>
            {file_info.rows > 1000 && (
              <li>
                <Text type="warning">数据量较大，建议适当增加分块大小以提高效率</Text>
              </li>
            )}
          </ul>
        </div>
      )}
    </Card>
  );
};

export default DataPreview;
