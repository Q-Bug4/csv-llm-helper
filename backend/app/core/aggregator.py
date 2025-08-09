"""
结果汇总器模块
负责将多个批次的处理结果合并为最终结果
"""

import pandas as pd
import logging
from typing import List, Optional, Tuple, Dict, Any

logger = logging.getLogger(__name__)


class ResultAggregator:
    """结果汇总器"""
    
    def __init__(self, expected_columns: List[str]):
        """
        初始化汇总器
        
        Args:
            expected_columns: 期望的输出列名
        """
        self.expected_columns = expected_columns
        self.results = []
        self.failed_chunks = []
        self.processing_stats = {
            'total_chunks': 0,
            'processed_chunks': 0,
            'failed_chunks': 0,
            'total_rows': 0
        }
    
    def add_result(self, chunk_index: int, result_df: pd.DataFrame) -> bool:
        """
        添加一个批次的处理结果
        
        Args:
            chunk_index: 块索引
            result_df: 结果DataFrame
            
        Returns:
            是否成功添加
        """
        try:
            if result_df is None or result_df.empty:
                logger.warning(f"第{chunk_index + 1}块结果为空")
                self.failed_chunks.append(chunk_index)
                return False
            
            # 验证和清理结果
            cleaned_df = self._validate_and_clean_result(result_df, chunk_index)
            
            if cleaned_df is not None:
                self.results.append({
                    'chunk_index': chunk_index,
                    'data': cleaned_df,
                    'row_count': len(cleaned_df)
                })
                
                self.processing_stats['processed_chunks'] += 1
                self.processing_stats['total_rows'] += len(cleaned_df)
                
                logger.info(f"成功添加第{chunk_index + 1}块结果: {len(cleaned_df)}行")
                return True
            else:
                self.failed_chunks.append(chunk_index)
                return False
                
        except Exception as e:
            logger.error(f"添加第{chunk_index + 1}块结果时出错: {str(e)}")
            self.failed_chunks.append(chunk_index)
            return False
    
    def add_failed_chunk(self, chunk_index: int, error_message: str):
        """
        记录失败的块
        
        Args:
            chunk_index: 块索引
            error_message: 错误消息
        """
        self.failed_chunks.append(chunk_index)
        self.processing_stats['failed_chunks'] += 1
        logger.error(f"第{chunk_index + 1}块处理失败: {error_message}")
    
    def get_final_result(self) -> Tuple[bool, str, Optional[pd.DataFrame]]:
        """
        获取最终汇总结果
        
        Returns:
            (success, message, final_df): 成功标志、消息和最终DataFrame
        """
        try:
            if not self.results:
                return False, "没有成功处理的数据块", None
            
            # 按块索引排序
            self.results.sort(key=lambda x: x['chunk_index'])
            
            # 合并所有结果
            all_dataframes = [result['data'] for result in self.results]
            final_df = pd.concat(all_dataframes, ignore_index=True)
            
            # 最终验证
            success, message = self._validate_final_result(final_df)
            
            if success:
                logger.info(f"成功汇总结果: {len(final_df)}行，{len(final_df.columns)}列")
                return True, message, final_df
            else:
                return False, message, None
                
        except Exception as e:
            error_msg = f"汇总结果时出错: {str(e)}"
            logger.error(error_msg)
            return False, error_msg, None
    
    def _validate_and_clean_result(self, df: pd.DataFrame, chunk_index: int) -> Optional[pd.DataFrame]:
        """
        验证和清理单个结果
        
        Args:
            df: 结果DataFrame
            chunk_index: 块索引
            
        Returns:
            清理后的DataFrame或None
        """
        try:
            # 复制DataFrame避免修改原数据
            cleaned_df = df.copy()
            
            # 确保包含所有期望的列
            for col in self.expected_columns:
                if col not in cleaned_df.columns:
                    logger.warning(f"第{chunk_index + 1}块缺少列 '{col}'，将添加空值")
                    cleaned_df[col] = None
            
            # 只保留期望的列，按期望顺序排列
            cleaned_df = cleaned_df[self.expected_columns]
            
            # 清理数据类型
            cleaned_df = self._clean_data_types(cleaned_df)
            
            return cleaned_df
            
        except Exception as e:
            logger.error(f"清理第{chunk_index + 1}块结果时出错: {str(e)}")
            return None
    
    def _clean_data_types(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        清理数据类型
        
        Args:
            df: 输入DataFrame
            
        Returns:
            清理后的DataFrame
        """
        cleaned_df = df.copy()
        
        # 将所有列转换为字符串类型，便于CSV输出
        for col in cleaned_df.columns:
            cleaned_df[col] = cleaned_df[col].astype(str)
            # 将 'nan' 替换为空字符串
            cleaned_df[col] = cleaned_df[col].replace('nan', '')
        
        return cleaned_df
    
    def _validate_final_result(self, df: pd.DataFrame) -> Tuple[bool, str]:
        """
        验证最终结果
        
        Args:
            df: 最终DataFrame
            
        Returns:
            (valid, message): 验证结果和消息
        """
        if df is None or df.empty:
            return False, "最终结果为空"
        
        # 检查列数
        if len(df.columns) != len(self.expected_columns):
            return False, f"列数不匹配: 期望{len(self.expected_columns)}，实际{len(df.columns)}"
        
        # 检查列名
        actual_columns = list(df.columns)
        if actual_columns != self.expected_columns:
            return False, f"列名不匹配: 期望{self.expected_columns}，实际{actual_columns}"
        
        # 检查是否有数据
        if len(df) == 0:
            return False, "最终结果没有数据行"
        
        success_rate = (self.processing_stats['processed_chunks'] / 
                       (self.processing_stats['processed_chunks'] + self.processing_stats['failed_chunks']) * 100)
        
        message = (f"汇总完成: {len(df)}行数据，"
                  f"成功处理{self.processing_stats['processed_chunks']}块，"
                  f"失败{self.processing_stats['failed_chunks']}块，"
                  f"成功率{success_rate:.1f}%")
        
        return True, message
    
    def get_processing_stats(self) -> Dict[str, Any]:
        """获取处理统计信息"""
        stats = self.processing_stats.copy()
        stats['failed_chunk_indices'] = self.failed_chunks.copy()
        stats['success_rate'] = (stats['processed_chunks'] / 
                                (stats['processed_chunks'] + stats['failed_chunks']) * 100 
                                if (stats['processed_chunks'] + stats['failed_chunks']) > 0 else 0)
        return stats
    
    def reset(self):
        """重置汇总器状态"""
        self.results.clear()
        self.failed_chunks.clear()
        self.processing_stats = {
            'total_chunks': 0,
            'processed_chunks': 0,
            'failed_chunks': 0,
            'total_rows': 0
        }
