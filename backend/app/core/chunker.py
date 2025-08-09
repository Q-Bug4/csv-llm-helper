"""
数据分块器模块
负责将大型CSV数据分割成适合LLM处理的小块
"""

import pandas as pd
import logging
from typing import Iterator, Tuple, Optional

logger = logging.getLogger(__name__)


class DataChunker:
    """数据分块器"""
    
    def __init__(self, chunk_size: int):
        """
        初始化分块器
        
        Args:
            chunk_size: 每块的行数
        """
        self.chunk_size = chunk_size
        self.total_chunks = 0
        self.current_chunk = 0
    
    def chunk_dataframe(self, df: pd.DataFrame) -> Iterator[Tuple[int, pd.DataFrame]]:
        """
        将DataFrame分块
        
        Args:
            df: 要分块的DataFrame
            
        Yields:
            (chunk_index, chunk_data): 分块索引和数据
        """
        if df is None or df.empty:
            logger.warning("尝试分块空的DataFrame")
            return
        
        # 计算总分块数
        self.total_chunks = (len(df) + self.chunk_size - 1) // self.chunk_size
        logger.info(f"开始分块处理，总行数: {len(df)}, 分块大小: {self.chunk_size}, 总分块数: {self.total_chunks}")
        
        # 分块处理
        for i in range(0, len(df), self.chunk_size):
            chunk_data = df.iloc[i:i + self.chunk_size].copy()
            chunk_index = i // self.chunk_size
            self.current_chunk = chunk_index + 1
            
            logger.debug(f"生成第 {self.current_chunk}/{self.total_chunks} 块，行范围: {i} - {min(i + self.chunk_size - 1, len(df) - 1)}")
            
            yield chunk_index, chunk_data
    
    def get_progress_info(self) -> dict:
        """
        获取处理进度信息
        
        Returns:
            包含进度信息的字典
        """
        return {
            'total_chunks': self.total_chunks,
            'current_chunk': self.current_chunk,
            'progress_percentage': (self.current_chunk / self.total_chunks * 100) if self.total_chunks > 0 else 0
        }
    
    def estimate_tokens_per_chunk(self, sample_chunk: pd.DataFrame) -> int:
        """
        估算每个分块的token数量
        
        Args:
            sample_chunk: 样本分块
            
        Returns:
            估算的token数量
        """
        try:
            # 将分块转换为CSV字符串
            csv_string = sample_chunk.to_csv(index=False)
            
            # 简单估算：每个字符约0.25个token（英文），中文约1个token
            # 这里使用保守估算，每个字符按1个token计算
            estimated_tokens = len(csv_string)
            
            logger.debug(f"分块token估算: 字符数={len(csv_string)}, 估算token数={estimated_tokens}")
            
            return estimated_tokens
            
        except Exception as e:
            logger.error(f"估算token数量时出错: {str(e)}")
            return 0
    
    def validate_chunk_size(self, df: pd.DataFrame, max_tokens: int = 3000) -> Tuple[bool, str, Optional[int]]:
        """
        验证分块大小是否合适
        
        Args:
            df: 数据DataFrame
            max_tokens: 最大token限制
            
        Returns:
            (valid, message, suggested_chunk_size): 验证结果、消息和建议的分块大小
        """
        if df is None or df.empty:
            return False, "数据为空", None
        
        # 取前几行作为样本
        sample_size = min(self.chunk_size, len(df))
        sample_chunk = df.head(sample_size)
        
        # 估算token数量
        estimated_tokens = self.estimate_tokens_per_chunk(sample_chunk)
        
        if estimated_tokens > max_tokens:
            # 计算建议的分块大小
            suggested_size = int(self.chunk_size * max_tokens / estimated_tokens * 0.8)  # 留20%余量
            suggested_size = max(1, suggested_size)  # 至少为1
            
            return False, f"当前分块大小可能超出token限制 ({estimated_tokens} > {max_tokens})", suggested_size
        
        return True, f"分块大小合适 (估算{estimated_tokens} tokens)", None
