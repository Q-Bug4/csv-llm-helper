/**
 * 配置表单组件
 * 用于设置CSV处理的各项参数
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Card,
  Typography,
  Space,
  Divider,
  Modal,
  List,
  message,
  Tooltip,
  Row,
  Col,
  Switch,
  Upload
} from 'antd';
import {
  SettingOutlined,
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  FolderOpenOutlined,
  QuestionCircleOutlined,
  ExportOutlined,
  ImportOutlined
} from '@ant-design/icons';
import { getSupportedModels } from '../utils/api';
import { 
  saveConfig, 
  getConfigs, 
  getConfig, 
  deleteConfig,
  saveCurrentConfig,
  getCurrentConfig,
  exportConfig,
  importConfig
} from '../utils/storage';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const ConfigForm = ({ onConfigChange, previewData }) => {
  const [form] = Form.useForm();
  const [outputSchema, setOutputSchema] = useState([{ name: '', description: '' }]);
  const [supportedModels, setSupportedModels] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [savedConfigs, setSavedConfigs] = useState({});
  const [importModalVisible, setImportModalVisible] = useState(false);

  // 默认配置
  const defaultConfig = {
    chunk_size: 40,
    processing_logic: '',
    llm_provider: 'custom',
    llm_model: '',
    api_key: '',
    api_base_url: '',
    max_retries: 3,
    timeout: 30
  };

  // 初始化
  useEffect(() => {
    initializeForm();
    loadSupportedModels();
    loadSavedConfigs();
  }, []);

  // 监听表单变化
  const handleFormChange = useCallback(() => {
    const values = form.getFieldsValue();
    const config = {
      ...values,
      output_schema: outputSchema.filter(item => item.name && item.description)
    };
    
    // 保存当前配置到本地存储
    saveCurrentConfig(config);
    
    // 通知父组件
    onConfigChange(config);
  }, [form, outputSchema, onConfigChange]);

  // 监听表单值变化
  useEffect(() => {
    handleFormChange();
  }, [outputSchema, handleFormChange]);

  // 初始化表单
  const initializeForm = () => {
    // 尝试加载之前保存的配置
    const savedConfig = getCurrentConfig();
    
    if (savedConfig) {
      form.setFieldsValue(savedConfig);
      if (savedConfig.output_schema) {
        setOutputSchema(savedConfig.output_schema);
      }
    } else {
      form.setFieldsValue(defaultConfig);
    }
  };

  // 加载支持的模型
  const loadSupportedModels = async () => {
    try {
      const models = await getSupportedModels();
      setSupportedModels(models);
    } catch (error) {
      console.error('加载模型列表失败:', error);
    }
  };

  // 加载已保存的配置
  const loadSavedConfigs = () => {
    const configs = getConfigs();
    setSavedConfigs(configs);
  };

  // 添加输出列
  const addOutputColumn = () => {
    setOutputSchema([...outputSchema, { name: '', description: '' }]);
  };

  // 删除输出列
  const removeOutputColumn = (index) => {
    const newSchema = outputSchema.filter((_, i) => i !== index);
    setOutputSchema(newSchema);
  };

  // 更新输出列
  const updateOutputColumn = (index, field, value) => {
    const newSchema = [...outputSchema];
    newSchema[index] = { ...newSchema[index], [field]: value };
    setOutputSchema(newSchema);
  };

  // 保存配置
  const handleSaveConfig = () => {
    Modal.confirm({
      title: '保存配置',
      content: (
        <Input
          placeholder="请输入配置名称"
          id="config-name-input"
          style={{ marginTop: 8 }}
        />
      ),
      onOk: () => {
        const nameInput = document.getElementById('config-name-input');
        const name = nameInput?.value?.trim();
        
        if (!name) {
          message.error('请输入配置名称');
          return false;
        }
        
        try {
          const currentValues = form.getFieldsValue();
          const config = {
            ...currentValues,
            output_schema: outputSchema.filter(item => item.name && item.description)
          };
          
          saveConfig(name, config);
          loadSavedConfigs();
          message.success('配置保存成功');
        } catch (error) {
          message.error('保存失败: ' + error.message);
          return false;
        }
      }
    });
  };

  // 加载配置
  const handleLoadConfig = (name) => {
    try {
      const config = getConfig(name);
      if (config) {
        form.setFieldsValue(config);
        if (config.output_schema) {
          setOutputSchema(config.output_schema);
        }
        message.success('配置加载成功');
        setConfigModalVisible(false);
      }
    } catch (error) {
      message.error('加载失败: ' + error.message);
    }
  };

  // 删除配置
  const handleDeleteConfig = (name) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除配置"${name}"吗？`,
      onOk: () => {
        try {
          deleteConfig(name);
          loadSavedConfigs();
          message.success('配置删除成功');
        } catch (error) {
          message.error('删除失败: ' + error.message);
        }
      }
    });
  };

  // 导出配置
  const handleExportConfig = (name) => {
    try {
      exportConfig(name);
      message.success('配置导出成功');
    } catch (error) {
      message.error('导出失败: ' + error.message);
    }
  };

  // 导入配置
  const handleImportConfig = (file) => {
    importConfig(file)
      .then((config) => {
        form.setFieldsValue(config);
        if (config.output_schema) {
          setOutputSchema(config.output_schema);
        }
        message.success('配置导入成功');
        setImportModalVisible(false);
      })
      .catch((error) => {
        message.error('导入失败: ' + error.message);
      });
    
    return false; // 阻止自动上传
  };

  // 根据预览数据生成建议的输出schema
  const generateSuggestedSchema = useCallback(() => {
    if (!previewData?.column_names) return;
    
    Modal.confirm({
      title: '生成建议配置',
      content: '根据CSV文件结构生成建议的输出列配置？这将覆盖当前配置。',
      onOk: () => {
        const suggested = previewData.column_names.map(colName => ({
          name: `processed_${colName.toLowerCase().replace(/\s+/g, '_')}`,
          description: `处理后的${colName}字段`
        }));
        
        setOutputSchema(suggested);
        message.success('已生成建议配置');
      }
    });
  }, [previewData]);

  return (
    <Card>
      <Title level={4}>
        <SettingOutlined /> 处理配置
      </Title>

      <Space style={{ marginBottom: 16 }}>
        <Button icon={<SaveOutlined />} onClick={handleSaveConfig}>
          保存配置
        </Button>
        <Button icon={<FolderOpenOutlined />} onClick={() => setConfigModalVisible(true)}>
          加载配置
        </Button>
        <Button icon={<ImportOutlined />} onClick={() => setImportModalVisible(true)}>
          导入配置
        </Button>
        {previewData && (
          <Button type="dashed" onClick={generateSuggestedSchema}>
            生成建议配置
          </Button>
        )}
      </Space>

      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleFormChange}
      >
        {/* 基础配置 */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={
                <Space>
                  分块大小
                  <Tooltip title="每次发送给AI的数据行数，建议20-100行">
                    <QuestionCircleOutlined />
                  </Tooltip>
                </Space>
              }
              name="chunk_size"
              rules={[
                { required: true, message: '请输入分块大小' },
                { type: 'number', min: 1, max: 1000, message: '分块大小应在1-1000之间' }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="建议20-100"
                min={1}
                max={1000}
              />
            </Form.Item>
          </Col>
          
          <Col span={12}>
            <Form.Item
              label="LLM提供商"
              name="llm_provider"
              rules={[{ required: true, message: '请选择LLM提供商' }]}
            >
              <Select placeholder="选择提供商">
                <Option value="custom">自定义</Option>
                <Option value="openai">OpenAI</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="LLM模型"
              name="llm_model"
              rules={[{ required: true, message: '请选择LLM模型' }]}
            >
              {form.getFieldValue('llm_provider') === 'openai' ? (
                <Select placeholder="选择模型">
                  {supportedModels.providers?.openai?.models?.map(model => (
                    <Option key={model} value={model}>{model}</Option>
                  )) || [
                    <Option key="gpt-3.5-turbo" value="gpt-3.5-turbo">gpt-3.5-turbo</Option>,
                    <Option key="gpt-4" value="gpt-4">gpt-4</Option>
                  ]}
                </Select>
              ) : (
                <Input placeholder="输入模型名称" />
              )}
            </Form.Item>
          </Col>
          
          <Col span={12}>
            <Form.Item
              label="API密钥"
              name="api_key"
              rules={[{ required: true, message: '请输入API密钥' }]}
            >
              <Input.Password placeholder={`输入${form.getFieldValue('llm_provider') === 'openai' ? 'OpenAI' : ''}API Key`} />
            </Form.Item>
          </Col>
        </Row>

        {/* API基础URL - 对自定义提供商显示在基础配置区 */}
        {form.getFieldValue('llm_provider') === 'custom' && (
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="API基础URL"
                name="api_base_url"
                tooltip="自定义LLM提供商的API基础URL"
                rules={[
                  { required: true, message: '自定义提供商时API基础URL为必填项' }
                ]}
              >
                <Input placeholder="输入API基础URL，如: https://api.deepseek.com/v1" />
              </Form.Item>
            </Col>
          </Row>
        )}

        <Form.Item
          label={
            <Space>
              处理逻辑描述
              <Tooltip title="用自然语言描述希望AI如何处理数据">
                <QuestionCircleOutlined />
              </Tooltip>
            </Space>
          }
          name="processing_logic"
          rules={[
            { required: true, message: '请输入处理逻辑描述' },
            { min: 10, message: '描述至少需要10个字符' }
          ]}
        >
          <TextArea
            rows={4}
            placeholder="例如：请将每条用户问题分类为'同比分析'、'占比分析'、'趋势分析'、'其他'之一。如果是同比分析，请提取涉及的年份区间..."
            showCount
            maxLength={1000}
          />
        </Form.Item>

        {/* 高级配置 */}
        <div style={{ marginBottom: 16 }}>
          <Switch
            checked={showAdvanced}
            onChange={setShowAdvanced}
            style={{ marginRight: 8 }}
          />
          <Text>显示高级配置</Text>
        </div>

        {showAdvanced && (
          <>
            <Divider>高级配置</Divider>
            {/* OpenAI提供商在高级配置中显示API基础URL */}
            <Row gutter={16}>
              {form.getFieldValue('llm_provider') === 'openai' && (
                <Col span={8}>
                  <Form.Item
                    label="API基础URL"
                    name="api_base_url"
                    tooltip="自定义OpenAI API基础URL，留空使用默认"
                  >
                    <Input placeholder="https://api.openai.com/v1" />
                  </Form.Item>
                </Col>
              )}
              
              <Col span={8}>
                <Form.Item
                  label="最大重试次数"
                  name="max_retries"
                  rules={[{ type: 'number', min: 1, max: 10 }]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={1}
                    max={10}
                  />
                </Form.Item>
              </Col>
              
              <Col span={8}>
                <Form.Item
                  label="请求超时(秒)"
                  name="timeout"
                  rules={[{ type: 'number', min: 5, max: 300 }]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={5}
                    max={300}
                  />
                </Form.Item>
              </Col>
            </Row>
          </>
        )}

        {/* 输出列配置 */}
        <Divider>输出列配置</Divider>
        {outputSchema.map((column, index) => (
          <Row key={index} gutter={16} style={{ marginBottom: 8 }}>
            <Col span={8}>
              <Input
                placeholder="列名"
                value={column.name}
                onChange={(e) => updateOutputColumn(index, 'name', e.target.value)}
              />
            </Col>
            <Col span={12}>
              <Input
                placeholder="列的意义说明"
                value={column.description}
                onChange={(e) => updateOutputColumn(index, 'description', e.target.value)}
              />
            </Col>
            <Col span={4}>
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => removeOutputColumn(index)}
                disabled={outputSchema.length === 1}
              />
            </Col>
          </Row>
        ))}
        
        <Button
          type="dashed"
          onClick={addOutputColumn}
          style={{ width: '100%', marginTop: 8 }}
          icon={<PlusOutlined />}
        >
          添加输出列
        </Button>
      </Form>

      {/* 配置管理Modal */}
      <Modal
        title="配置管理"
        open={configModalVisible}
        onCancel={() => setConfigModalVisible(false)}
        footer={null}
        width={600}
      >
        <List
          dataSource={Object.entries(savedConfigs)}
          renderItem={([name, config]) => (
            <List.Item
              actions={[
                <Button size="small" onClick={() => handleLoadConfig(name)}>
                  加载
                </Button>,
                <Button 
                  size="small" 
                  icon={<ExportOutlined />}
                  onClick={() => handleExportConfig(name)}
                >
                  导出
                </Button>,
                <Button 
                  size="small" 
                  danger 
                  onClick={() => handleDeleteConfig(name)}
                >
                  删除
                </Button>
              ]}
            >
              <List.Item.Meta
                title={name}
                description={`创建时间: ${new Date(config.createdAt).toLocaleString()}`}
              />
            </List.Item>
          )}
        />
      </Modal>

      {/* 导入配置Modal */}
      <Modal
        title="导入配置"
        open={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        footer={null}
      >
        <Upload
          accept=".json"
          beforeUpload={handleImportConfig}
          showUploadList={false}
        >
          <Button icon={<ImportOutlined />} style={{ width: '100%' }}>
            选择JSON配置文件
          </Button>
        </Upload>
      </Modal>
    </Card>
  );
};

export default ConfigForm;
