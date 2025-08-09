"""
API路由定义
定义所有的API端点和处理逻辑
"""

import logging
import os
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, Request
from fastapi.responses import FileResponse, JSONResponse
from typing import Optional, Dict, Any

from ..models.config import ProcessingRequest, ProcessingResult, ProcessingConfig
from ..services.processing_engine import CSVProcessingEngine

logger = logging.getLogger(__name__)

router = APIRouter()

# 全局处理引擎实例
processing_engine = CSVProcessingEngine()


@router.post("/process", response_model=ProcessingResult)
async def process_csv(
    file: UploadFile = File(..., description="CSV文件"),
    config_json: str = Form(None, description="配置JSON字符串")
):
    """
    处理CSV文件的主要端点
    
    Args:
        file: 上传的CSV文件
        config_json: JSON格式的配置字符串
        
    Returns:
        处理结果
    """
    try:
        logger.info(f"接收到CSV处理请求，文件: {file.filename}")
        
        # 验证文件类型
        if not file.filename.lower().endswith('.csv'):
            raise HTTPException(
                status_code=400,
                detail="只支持CSV格式的文件"
            )
        
        # 读取文件内容
        try:
            csv_content = await file.read()
            csv_content = csv_content.decode('utf-8')
        except UnicodeDecodeError:
            try:
                # 尝试其他编码
                csv_content = csv_content.decode('gbk')
            except UnicodeDecodeError:
                raise HTTPException(
                    status_code=400,
                    detail="文件编码不支持，请确保文件为UTF-8或GBK编码"
                )
        
        # 解析配置
        logger.info(f"接收到的配置: config_json={config_json}")
        
        if not config_json:
            logger.error("请求中没有提供配置信息")
            raise HTTPException(
                status_code=400,
                detail="缺少配置信息"
            )
        
        try:
            import json
            config_dict = json.loads(config_json)
            logger.info(f"解析后的配置: {json.dumps(config_dict, ensure_ascii=False)}")
            
            # 检查配置结构
            if not isinstance(config_dict, dict):
                logger.error(f"配置格式错误，应为对象，实际为: {type(config_dict)}")
                raise HTTPException(
                    status_code=400,
                    detail="配置格式错误，应为JSON对象"
                )
            
            # 检查是否有config字段
            if 'config' not in config_dict:
                logger.error("配置中缺少'config'字段")
                raise HTTPException(
                    status_code=400,
                    detail="缺少'config'字段"
                )
            
            config_data = config_dict['config']
            
            # 检查必填字段
            required_fields = {
                'chunk_size': '分块大小',
                'processing_logic': '处理逻辑',
                'output_schema': '输出列定义',
                'llm_provider': 'LLM提供商',
                'llm_model': 'LLM模型',
                'api_key': 'API密钥'
            }
            
            # 只检查实际缺失的字段
            missing_fields = [
                field for field in required_fields
                if field not in config_data or config_data[field] is None or config_data[field] == ""
            ]
            
            # 对于自定义提供商，检查是否提供了API基础URL
            if (config_data.get('llm_provider', '').lower() == 'custom' and 
                (not config_data.get('api_base_url') or config_data['api_base_url'].strip() == '')):
                missing_fields.append('api_base_url')
            
            if missing_fields:
                error_msg = f"缺少字段: {missing_fields[0]}"
                logger.error(f"配置验证失败: {error_msg}")
                raise HTTPException(
                    status_code=400,
                    detail=error_msg
                )
            
            config = ProcessingConfig(**config_data)
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON解析错误: {str(e)}, 原始数据: {config_json}")
            raise HTTPException(
                status_code=400,
                detail=f"JSON格式错误: {str(e)}"
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"配置验证失败: {str(e)}, 配置数据: {json.dumps(config_dict, ensure_ascii=False)}")
            raise HTTPException(
                status_code=400,
                detail=f"配置验证失败: {str(e)}"
            )
        
        # 处理CSV
        result = processing_engine.process_csv(csv_content, config)
        
        logger.info(f"CSV处理完成，成功: {result.success}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"处理CSV时发生错误: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"处理失败: {str(e)}"
        )


@router.post("/preview")
async def preview_csv(
    file: UploadFile = File(..., description="CSV文件"),
    n: int = 10
):
    """
    预览CSV文件内容
    
    Args:
        file: 上传的CSV文件
        n: 预览行数
        
    Returns:
        CSV预览信息
    """
    try:
        logger.info(f"接收到CSV预览请求，文件: {file.filename}")
        
        # 验证文件类型
        if not file.filename.lower().endswith('.csv'):
            raise HTTPException(
                status_code=400,
                detail="只支持CSV格式的文件"
            )
        
        # 读取文件内容
        try:
            csv_content = await file.read()
            csv_content = csv_content.decode('utf-8')
        except UnicodeDecodeError:
            try:
                csv_content = csv_content.decode('gbk')
            except UnicodeDecodeError:
                raise HTTPException(
                    status_code=400,
                    detail="文件编码不支持，请确保文件为UTF-8或GBK编码"
                )
        
        # 创建临时处理引擎进行预览
        temp_engine = CSVProcessingEngine()
        success, message = temp_engine._load_data(csv_content)
        
        if not success:
            raise HTTPException(
                status_code=400,
                detail=f"文件加载失败: {message}"
            )
        
        # 获取预览数据
        preview_data = temp_engine.get_data_preview(n)
        
        if preview_data is None:
            raise HTTPException(
                status_code=500,
                detail="获取预览数据失败"
            )
        
        logger.info("CSV预览完成")
        return {
            "success": True,
            "message": "预览成功",
            "data": preview_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"预览CSV时发生错误: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"预览失败: {str(e)}"
        )


@router.get("/download/{file_path:path}")
async def download_result(file_path: str):
    """
    下载处理结果文件
    
    Args:
        file_path: 文件路径
        
    Returns:
        文件下载响应
    """
    try:
        # 验证文件存在
        if not os.path.exists(file_path):
            raise HTTPException(
                status_code=404,
                detail="文件不存在"
            )
        
        # 验证文件安全性（防止路径遍历攻击）
        if not os.path.abspath(file_path).startswith(os.path.abspath('/tmp')):
            raise HTTPException(
                status_code=403,
                detail="文件访问被拒绝"
            )
        
        logger.info(f"下载文件: {file_path}")
        
        # 创建响应对象
        response = FileResponse(
            path=file_path,
            filename="processed_result.csv",
            media_type="text/csv"
        )
        
        # 在响应头中添加清理标记（可选）
        response.headers["X-Cleanup-After-Download"] = "true"
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"下载文件时发生错误: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"下载失败: {str(e)}"
        )


@router.post("/validate-config")
async def validate_config(config: ProcessingConfig):
    """
    验证处理配置
    
    Args:
        config: 处理配置
        
    Returns:
        验证结果
    """
    try:
        logger.info("接收到配置验证请求")
        
        # 这里可以添加更多的配置验证逻辑
        # 目前主要依赖Pydantic的自动验证
        
        return {
            "success": True,
            "message": "配置验证通过",
            "config": config.dict()
        }
        
    except Exception as e:
        logger.error(f"验证配置时发生错误: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"配置验证失败: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """
    健康检查端点
    
    Returns:
        服务状态信息
    """
    return {
        "status": "healthy",
        "message": "CSV处理引擎运行正常",
        "version": "1.0.0"
    }


@router.get("/models")
async def list_supported_models():
    """
    获取支持的LLM模型列表
    
    Returns:
        支持的模型列表
    """
    return {
        "providers": {
            "openai": {
                "models": [
                    "gpt-3.5-turbo",
                    "gpt-3.5-turbo-16k",
                    "gpt-4",
                    "gpt-4-32k"
                ],
                "default": "gpt-3.5-turbo"
            }
        }
    }
