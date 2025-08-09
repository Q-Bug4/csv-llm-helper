"""
配置数据模型定义
定义系统所需的配置结构和验证规则
"""

from typing import List, Optional
from pydantic import BaseModel, Field, validator


class OutputSchema(BaseModel):
    """输出列定义"""
    name: str = Field(..., description="列名")
    description: str = Field(..., description="列的意义说明")


class ProcessingConfig(BaseModel):
    """处理配置模型"""
    chunk_size: int = Field(..., gt=0, le=1000, description="每批处理的记录数")
    processing_logic: str = Field(..., min_length=10, description="处理逻辑描述")
    output_schema: List[OutputSchema] = Field(..., min_items=1, description="输出列定义")
    llm_provider: str = Field(default="custom", description="LLM提供商")
    llm_model: str = Field(..., description="LLM模型")
    api_key: str = Field(..., description="API密钥")
    api_base_url: Optional[str] = Field(None, description="API基础URL")
    max_retries: int = Field(default=3, ge=1, le=10, description="最大重试次数")
    timeout: int = Field(default=30, ge=5, le=300, description="请求超时时间")
    
    @validator('chunk_size')
    def validate_chunk_size(cls, v):
        """验证分块大小"""
        if v <= 0:
            raise ValueError('chunk_size必须大于0')
        if v > 1000:
            raise ValueError('chunk_size不能超过1000，避免超出LLM上下文限制')
        return v
    
    @validator('processing_logic')
    def validate_processing_logic(cls, v):
        """验证处理逻辑"""
        if not v.strip():
            raise ValueError('处理逻辑不能为空')
        return v.strip()


class ProcessingRequest(BaseModel):
    """处理请求模型"""
    config: ProcessingConfig = Field(..., description="处理配置")
    
    class Config:
        """Pydantic配置"""
        json_schema_extra = {
            "example": {
                "config": {
                    "chunk_size": 40,
                    "processing_logic": "请将每条用户问题分类为'同比分析'、'占比分析'、'趋势分析'、'其他'之一",
                    "output_schema": [
                        {"name": "question_id", "description": "原始数据中的问题编号"},
                        {"name": "category", "description": "问题类型"}
                    ],
                    "llm_provider": "openai",
                    "llm_model": "gpt-3.5-turbo",
                    "api_key": "your-api-key",
                    "max_retries": 3,
                    "timeout": 30
                }
            }
        }


class ProcessingResult(BaseModel):
    """处理结果模型"""
    success: bool = Field(..., description="处理是否成功")
    message: str = Field(..., description="处理结果消息")
    total_chunks: int = Field(default=0, description="总分块数")
    processed_chunks: int = Field(default=0, description="已处理分块数")
    failed_chunks: int = Field(default=0, description="失败分块数")
    download_url: Optional[str] = Field(None, description="结果文件下载链接")
    error_details: Optional[str] = Field(None, description="错误详情")
