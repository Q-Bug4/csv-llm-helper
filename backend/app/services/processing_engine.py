"""
CSV处理引擎主服务
整合所有核心模块，提供完整的CSV处理流程
"""

import logging
import pandas as pd
import tempfile
import os
from typing import Tuple, Optional, Generator, Dict, Any
from io import StringIO

from ..models.config import ProcessingConfig, ProcessingResult
from ..core import DataLoader, DataChunker, PromptGenerator, LLMCaller, ResultAggregator

logger = logging.getLogger(__name__)


class CSVProcessingEngine:
    """CSV处理引擎"""
    
    def __init__(self):
        """初始化处理引擎"""
        self.data_loader = None
        self.chunker = None
        self.prompt_generator = None
        self.llm_caller = None
        self.aggregator = None
        self.config = None
        self.temp_files = []  # 存储临时文件路径
    
    def process_csv(self, csv_content: str, config: ProcessingConfig) -> ProcessingResult:
        """
        处理CSV数据的主要方法
        
        Args:
            csv_content: CSV文件内容
            config: 处理配置
            
        Returns:
            处理结果
        """
        try:
            self.config = config
            logger.info("开始CSV处理流程")
            
            # 1. 加载数据
            success, message = self._load_data(csv_content)
            if not success:
                return ProcessingResult(
                    success=False,
                    message=f"数据加载失败: {message}",
                    error_details=message
                )
            
            # 2. 初始化处理组件
            self._initialize_components()
            
            # 3. 验证配置
            success, message = self._validate_processing_config()
            if not success:
                return ProcessingResult(
                    success=False,
                    message=f"配置验证失败: {message}",
                    error_details=message
                )
            
            # 4. 处理数据
            result = self._process_data_chunks()
            
            logger.info("CSV处理流程完成")
            return result
            
        except Exception as e:
            error_msg = f"处理过程中发生未知错误: {str(e)}"
            logger.error(error_msg)
            return ProcessingResult(
                success=False,
                message="处理失败",
                error_details=error_msg
            )
        finally:
            # 不立即清理临时文件，让用户有时间下载
            # 文件将在下载完成后或系统重启时清理
            pass
    
    def _load_data(self, csv_content: str) -> Tuple[bool, str]:
        """加载CSV数据"""
        try:
            self.data_loader = DataLoader()
            success, message = self.data_loader.load_from_string(csv_content)
            
            if not success:
                return False, message
            
            # 验证数据结构
            valid, validation_message = self.data_loader.validate_data_structure()
            if not valid:
                return False, f"数据结构验证失败: {validation_message}"
            
            logger.info(f"数据加载成功: {message}")
            return True, message
            
        except Exception as e:
            error_msg = f"加载数据时出错: {str(e)}"
            logger.error(error_msg)
            return False, error_msg
    
    def _initialize_components(self):
        """初始化处理组件"""
        # 初始化分块器
        self.chunker = DataChunker(self.config.chunk_size)
        
        # 初始化提示词生成器
        self.prompt_generator = PromptGenerator(self.config)
        
        # 初始化LLM调用器
        self.llm_caller = LLMCaller(self.config)
        
        # 初始化结果汇总器
        expected_columns = [schema.name for schema in self.config.output_schema]
        self.aggregator = ResultAggregator(expected_columns)
        
        logger.info("处理组件初始化完成")
    
    def _validate_processing_config(self) -> Tuple[bool, str]:
        """验证处理配置"""
        try:
            # 验证分块大小
            data = self.data_loader.get_data()
            valid, message, suggested_size = self.chunker.validate_chunk_size(data)
            
            if not valid:
                if suggested_size:
                    return False, f"{message}，建议使用分块大小: {suggested_size}"
                else:
                    return False, message
            
            # 生成样本提示词验证长度
            sample_data = self.data_loader.get_sample_data(min(self.config.chunk_size, 5))
            sample_prompt = self.prompt_generator.generate_prompt(sample_data)
            
            valid, message = self.prompt_generator.validate_prompt_length(sample_prompt)
            if not valid:
                return False, f"提示词长度验证失败: {message}"
            
            logger.info("配置验证通过")
            return True, "配置验证通过"
            
        except Exception as e:
            error_msg = f"验证配置时出错: {str(e)}"
            logger.error(error_msg)
            return False, error_msg
    
    def _process_data_chunks(self) -> ProcessingResult:
        """处理数据分块"""
        try:
            data = self.data_loader.get_data()
            
            # 获取总分块信息
            total_chunks = (len(data) + self.config.chunk_size - 1) // self.config.chunk_size
            processed_chunks = 0
            failed_chunks = 0
            
            logger.info(f"开始分块处理，总共 {total_chunks} 块")
            
            # 分块处理
            for chunk_index, chunk_data in self.chunker.chunk_dataframe(data):
                try:
                    # 生成提示词
                    prompt = self.prompt_generator.generate_prompt(chunk_data, chunk_index)
                    
                    # 调用LLM
                    success, message, result_df = self.llm_caller.call_llm(prompt, chunk_index)
                    
                    if success and result_df is not None:
                        # 添加结果到汇总器
                        if self.aggregator.add_result(chunk_index, result_df):
                            processed_chunks += 1
                        else:
                            failed_chunks += 1
                    else:
                        # 记录失败的块
                        self.aggregator.add_failed_chunk(chunk_index, message)
                        failed_chunks += 1
                        
                except Exception as e:
                    error_msg = f"处理第{chunk_index + 1}块时出错: {str(e)}"
                    logger.error(error_msg)
                    self.aggregator.add_failed_chunk(chunk_index, error_msg)
                    failed_chunks += 1
            
            # 获取最终结果
            success, message, final_df = self.aggregator.get_final_result()
            
            if success and final_df is not None:
                # 保存结果文件
                download_url = self._save_result_file(final_df)
                
                return ProcessingResult(
                    success=True,
                    message=message,
                    total_chunks=total_chunks,
                    processed_chunks=processed_chunks,
                    failed_chunks=failed_chunks,
                    download_url=download_url
                )
            else:
                return ProcessingResult(
                    success=False,
                    message=f"结果汇总失败: {message}",
                    total_chunks=total_chunks,
                    processed_chunks=processed_chunks,
                    failed_chunks=failed_chunks,
                    error_details=message
                )
                
        except Exception as e:
            error_msg = f"分块处理过程中出错: {str(e)}"
            logger.error(error_msg)
            return ProcessingResult(
                success=False,
                message="分块处理失败",
                error_details=error_msg
            )
    
    def _save_result_file(self, result_df: pd.DataFrame) -> str:
        """保存结果文件并返回下载链接"""
        try:
            # 创建临时文件
            temp_file = tempfile.NamedTemporaryFile(
                mode='w', 
                suffix='.csv', 
                delete=False,
                encoding='utf-8'
            )
            
            # 保存DataFrame为CSV
            result_df.to_csv(temp_file.name, index=False, encoding='utf-8')
            temp_file.close()
            
            # 记录临时文件用于后续清理
            self.temp_files.append(temp_file.name)
            
            # 返回文件路径作为下载链接（实际项目中可能需要转换为URL）
            logger.info(f"结果文件已保存: {temp_file.name}")
            return temp_file.name
            
        except Exception as e:
            logger.error(f"保存结果文件时出错: {str(e)}")
            return None
    
    def _cleanup_temp_files(self):
        """清理临时文件"""
        for file_path in self.temp_files:
            try:
                if os.path.exists(file_path):
                    os.unlink(file_path)
                    logger.debug(f"已清理临时文件: {file_path}")
            except Exception as e:
                logger.warning(f"清理临时文件失败 {file_path}: {str(e)}")
        
        self.temp_files.clear()
    
    def get_processing_progress(self) -> Dict[str, Any]:
        """获取处理进度信息"""
        if self.chunker and self.aggregator:
            progress_info = self.chunker.get_progress_info()
            stats = self.aggregator.get_processing_stats()
            return {**progress_info, **stats}
        return {}
    
    def get_data_preview(self, n: int = 10) -> Optional[Dict[str, Any]]:
        """
        获取数据预览
        
        Args:
            n: 预览行数
            
        Returns:
            包含数据预览信息的字典
        """
        if not self.data_loader:
            return None
        
        try:
            sample_data = self.data_loader.get_sample_data(n)
            file_info = self.data_loader.get_file_info()
            
            return {
                'file_info': file_info,
                'sample_data': sample_data.to_dict('records') if sample_data is not None else [],
                'column_names': file_info.get('column_names', [])
            }
            
        except Exception as e:
            logger.error(f"获取数据预览时出错: {str(e)}")
            return None
