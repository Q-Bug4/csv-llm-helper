"""
数据加载器模块
负责CSV文件的加载和基础验证
"""

import pandas as pd
import logging
from typing import Tuple, Optional
from io import StringIO

logger = logging.getLogger(__name__)


class DataLoader:
    """CSV数据加载器"""
    
    def __init__(self):
        """初始化数据加载器"""
        self.data = None
        self.file_info = {}
    
    def load_from_string(self, csv_content: str, encoding: str = 'utf-8') -> Tuple[bool, str]:
        """
        从字符串加载CSV数据
        
        Args:
            csv_content: CSV文件内容字符串
            encoding: 文件编码
            
        Returns:
            (success, message): 加载结果和消息
        """
        try:
            # 使用StringIO包装字符串内容
            csv_file = StringIO(csv_content)
            
            # 尝试读取CSV
            self.data = pd.read_csv(csv_file, encoding=encoding)
            
            # 记录文件基本信息
            self.file_info = {
                'rows': len(self.data),
                'columns': len(self.data.columns),
                'column_names': list(self.data.columns),
                'encoding': encoding
            }
            
            logger.info(f"成功加载CSV数据: {self.file_info['rows']}行, {self.file_info['columns']}列")
            
            # 基础验证
            if self.data.empty:
                return False, "CSV文件为空"
            
            if len(self.data.columns) == 0:
                return False, "CSV文件没有列"
                
            return True, f"成功加载 {self.file_info['rows']} 行数据"
            
        except UnicodeDecodeError as e:
            error_msg = f"文件编码错误: {str(e)}"
            logger.error(error_msg)
            return False, error_msg
            
        except pd.errors.EmptyDataError:
            error_msg = "CSV文件为空或格式错误"
            logger.error(error_msg)
            return False, error_msg
            
        except pd.errors.ParserError as e:
            error_msg = f"CSV解析错误: {str(e)}"
            logger.error(error_msg)
            return False, error_msg
            
        except Exception as e:
            error_msg = f"加载CSV文件时发生未知错误: {str(e)}"
            logger.error(error_msg)
            return False, error_msg
    
    def get_data(self) -> Optional[pd.DataFrame]:
        """获取加载的数据"""
        return self.data
    
    def get_file_info(self) -> dict:
        """获取文件信息"""
        return self.file_info.copy()
    
    def get_sample_data(self, n: int = 5) -> Optional[pd.DataFrame]:
        """
        获取样本数据
        
        Args:
            n: 样本行数
            
        Returns:
            样本数据DataFrame
        """
        if self.data is None:
            return None
        return self.data.head(n)
    
    def validate_data_structure(self) -> Tuple[bool, str]:
        """
        验证数据结构
        
        Returns:
            (valid, message): 验证结果和消息
        """
        if self.data is None:
            return False, "未加载数据"
        
        # 检查是否有重复的列名
        duplicate_cols = self.data.columns[self.data.columns.duplicated()].tolist()
        if duplicate_cols:
            return False, f"发现重复的列名: {duplicate_cols}"
        
        # 检查是否有空的列名
        empty_cols = [col for col in self.data.columns if pd.isna(col) or str(col).strip() == '']
        if empty_cols:
            return False, f"发现空的列名: {empty_cols}"
        
        return True, "数据结构验证通过"
