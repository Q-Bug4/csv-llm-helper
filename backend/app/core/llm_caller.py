"""
LLM调用器模块
负责调用各种LLM API并解析结果
"""

import logging
import time
import pandas as pd
from typing import Optional, Tuple, Dict, Any
from io import StringIO
import requests
import json
from ..models.config import ProcessingConfig

logger = logging.getLogger(__name__)


class LLMCaller:
    """LLM调用器"""
    
    def __init__(self, config: ProcessingConfig):
        """
        初始化LLM调用器
        
        Args:
            config: 处理配置
        """
        self.config = config
        self.client = None
        self._setup_client()
    
    def _setup_client(self):
        """设置LLM客户端"""
        try:
            if self.config.llm_provider.lower() == "openai":
                # 客户端将在请求时动态创建
                logger.info(f"已配置OpenAI客户端，模型: {self.config.llm_model}")
            elif self.config.llm_provider.lower() == "custom":
                # 自定义提供商，使用OpenAI兼容的API
                logger.info(f"已配置自定义LLM提供商，模型: {self.config.llm_model}")
            else:
                logger.warning(f"未明确支持的LLM提供商: {self.config.llm_provider}，将尝试使用OpenAI兼容格式")
                
        except Exception as e:
            logger.error(f"设置LLM客户端时出错: {str(e)}")
            raise
    
    def call_llm(self, prompt: str, chunk_index: int = 0) -> Tuple[bool, str, Optional[pd.DataFrame]]:
        """
        调用LLM处理数据
        
        Args:
            prompt: 提示词
            chunk_index: 块索引
            
        Returns:
            (success, message, result_df): 成功标志、消息和结果DataFrame
        """
        for attempt in range(self.config.max_retries):
            try:
                logger.info(f"第{chunk_index + 1}块，第{attempt + 1}次尝试调用LLM")
                
                # 调用LLM
                response = self._make_llm_request(prompt)
                
                if not response:
                    continue
                
                # 解析响应
                success, message, result_df = self._parse_llm_response(response, chunk_index)
                
                if success:
                    logger.info(f"第{chunk_index + 1}块处理成功")
                    return True, message, result_df
                else:
                    logger.warning(f"第{chunk_index + 1}块解析失败: {message}")
                    if attempt < self.config.max_retries - 1:
                        time.sleep(2 ** attempt)  # 指数退避
                        continue
                    
            except Exception as e:
                error_msg = f"调用LLM时出错: {str(e)}"
                logger.error(error_msg)
                
                if attempt < self.config.max_retries - 1:
                    logger.info(f"第{attempt + 2}次重试...")
                    time.sleep(2 ** attempt)  # 指数退避
                    continue
        
        return False, f"第{chunk_index + 1}块处理失败，已达到最大重试次数", None
    
    def _make_llm_request(self, prompt: str) -> Optional[str]:
        """
        发起LLM请求
        
        Args:
            prompt: 提示词
            
        Returns:
            LLM响应内容
        """
        try:
            if self.config.llm_provider.lower() in ["openai", "custom"]:
                # 使用OpenAI兼容的客户端API
                from openai import OpenAI
                
                # 设置基础URL，如果是custom且有api_base_url则使用，否则使用默认
                base_url = None
                if self.config.api_base_url:
                    base_url = self.config.api_base_url
                elif self.config.llm_provider.lower() == "openai":
                    base_url = "https://api.openai.com/v1"
                
                client = OpenAI(
                    api_key=self.config.api_key,
                    base_url=base_url,
                    timeout=self.config.timeout
                )
                
                # 构建请求体
                request_data = {
                    "model": self.config.llm_model,
                    "messages": [
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.1
                }
                
                # 记录请求详情
                logger.info(f"=== LLM请求开始 ===")
                logger.info(f"提供商: {self.config.llm_provider}")
                logger.info(f"模型: {self.config.llm_model}")
                logger.info(f"API地址: {base_url}")
                logger.info(f"请求体: {request_data}")
                logger.info(f"提示词内容:\n{prompt}")
                logger.info(f"=== LLM请求结束 ===")
                
                response = client.chat.completions.create(**request_data)
                
                # 记录响应详情
                response_content = response.choices[0].message.content.strip()
                logger.info(f"=== LLM响应开始 ===")
                logger.info(f"响应状态: 成功")
                logger.info(f"响应内容:\n{response_content}")
                logger.info(f"=== LLM响应结束 ===")
                
                return response_content
            
            else:
                # 对于其他提供商，也尝试使用OpenAI兼容格式
                logger.info(f"尝试使用OpenAI兼容格式调用提供商: {self.config.llm_provider}")
                from openai import OpenAI
                
                client = OpenAI(
                    api_key=self.config.api_key,
                    base_url=self.config.api_base_url,
                    timeout=self.config.timeout
                )
                
                # 构建请求体
                request_data = {
                    "model": self.config.llm_model,
                    "messages": [
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.1
                }
                
                # 记录请求详情
                logger.info(f"=== LLM请求开始 ===")
                logger.info(f"提供商: {self.config.llm_provider}")
                logger.info(f"模型: {self.config.llm_model}")
                logger.info(f"API地址: {self.config.api_base_url}")
                logger.info(f"请求体: {request_data}")
                logger.info(f"提示词内容:\n{prompt}")
                logger.info(f"=== LLM请求结束 ===")
                
                response = client.chat.completions.create(**request_data)
                
                # 记录响应详情
                response_content = response.choices[0].message.content.strip()
                logger.info(f"=== LLM响应开始 ===")
                logger.info(f"响应状态: 成功")
                logger.info(f"响应内容:\n{response_content}")
                logger.info(f"=== LLM响应结束 ===")
                
                return response_content
                
        except Exception as e:
            # 检查是否是速率限制错误
            if "rate limit" in str(e).lower():
                logger.warning(f"API调用频率限制: {str(e)}")
                time.sleep(60)  # 等待1分钟
                raise
            
            # 检查是否是API错误  
            if "api" in str(e).lower():
                logger.error(f"API错误: {str(e)}")
                raise
            
            logger.error(f"LLM请求失败: {str(e)}")
            raise
    
    def _parse_llm_response(self, response: str, chunk_index: int) -> Tuple[bool, str, Optional[pd.DataFrame]]:
        """
        解析LLM响应
        
        Args:
            response: LLM响应内容
            chunk_index: 块索引
            
        Returns:
            (success, message, result_df): 解析结果
        """
        try:
            # 清理响应内容，移除可能的markdown标记
            cleaned_response = self._clean_response(response)
            
            # 尝试解析为CSV
            try:
                csv_io = StringIO(cleaned_response)
                result_df = pd.read_csv(csv_io)
                
                # 验证结果DataFrame
                success, message = self._validate_result_dataframe(result_df)
                
                if success:
                    return True, f"成功解析 {len(result_df)} 行结果", result_df
                else:
                    return False, message, None
                    
            except pd.errors.ParserError as e:
                return False, f"CSV解析错误: {str(e)}", None
                
            except Exception as e:
                return False, f"解析响应时出错: {str(e)}", None
        
        except Exception as e:
            return False, f"处理LLM响应时出错: {str(e)}", None
    
    def _clean_response(self, response: str) -> str:
        """
        清理LLM响应内容
        
        Args:
            response: 原始响应
            
        Returns:
            清理后的响应
        """
        # 移除可能的markdown代码块标记
        lines = response.split('\n')
        cleaned_lines = []
        in_code_block = False
        
        for line in lines:
            line = line.strip()
            
            # 跳过markdown代码块标记
            if line.startswith('```'):
                in_code_block = not in_code_block
                continue
            
            # 如果在代码块中，或者不是空行，则保留
            if in_code_block or line:
                cleaned_lines.append(line)
        
        return '\n'.join(cleaned_lines)
    
    def _validate_result_dataframe(self, df: pd.DataFrame) -> Tuple[bool, str]:
        """
        验证结果DataFrame
        
        Args:
            df: 结果DataFrame
            
        Returns:
            (valid, message): 验证结果和消息
        """
        if df is None or df.empty:
            return False, "结果为空"
        
        # 检查列名是否匹配期望
        expected_columns = [schema.name for schema in self.config.output_schema]
        actual_columns = list(df.columns)
        
        # 检查是否包含所有期望的列
        missing_columns = set(expected_columns) - set(actual_columns)
        if missing_columns:
            return False, f"缺少期望的列: {missing_columns}"
        
        # 检查是否有额外的列
        extra_columns = set(actual_columns) - set(expected_columns)
        if extra_columns:
            logger.warning(f"结果包含额外的列: {extra_columns}")
        
        # 检查数据行数
        if len(df) == 0:
            return False, "结果没有数据行"
        
        return True, f"验证通过，包含 {len(df)} 行数据"
