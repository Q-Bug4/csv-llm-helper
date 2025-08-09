"""
动态提示词生成器模块
根据配置和数据动态生成LLM提示词
"""

import pandas as pd
import json
import logging
from typing import List, Dict, Any, Tuple
from ..models.config import ProcessingConfig, OutputSchema

logger = logging.getLogger(__name__)


class PromptGenerator:
    """动态提示词生成器"""
    
    def __init__(self, config: ProcessingConfig):
        """
        初始化提示词生成器
        
        Args:
            config: 处理配置
        """
        self.config = config
        self.output_columns = [schema.name for schema in config.output_schema]
    
    def generate_prompt(self, chunk_data: pd.DataFrame, chunk_index: int = 0) -> str:
        """
        为数据块生成提示词
        
        Args:
            chunk_data: 数据块
            chunk_index: 块索引
            
        Returns:
            生成的提示词
        """
        try:
            # 构建系统提示
            system_prompt = self._build_system_prompt()
            
            # 构建数据描述
            data_description = self._build_data_description(chunk_data)
            
            # 构建任务描述
            task_description = self._build_task_description()
            
            # 构建输出格式说明
            output_format = self._build_output_format()
            
            # 构建数据内容
            data_content = self._build_data_content(chunk_data)
            
            # 组合完整提示词
            full_prompt = f"""{system_prompt}

{data_description}

{task_description}

{output_format}

{data_content}

请严格按照上述要求处理数据，直接返回CSV格式的结果，不要包含任何其他文本。"""
            
            logger.debug(f"为第{chunk_index + 1}块生成提示词，长度: {len(full_prompt)}")
            
            return full_prompt
            
        except Exception as e:
            logger.error(f"生成提示词时出错: {str(e)}")
            raise
    
    def _build_system_prompt(self) -> str:
        """构建系统提示"""
        return """你是一个专业的数据分析助手，需要根据用户的要求处理CSV数据。
请仔细阅读以下任务描述和数据，按照指定的格式输出结果。"""
    
    def _build_data_description(self, chunk_data: pd.DataFrame) -> str:
        """构建数据描述"""
        column_info = []
        for col in chunk_data.columns:
            # 获取列的数据类型和样本值
            dtype = str(chunk_data[col].dtype)
            sample_values = chunk_data[col].dropna().head(3).tolist()
            sample_str = ", ".join([str(v) for v in sample_values])
            
            column_info.append(f"- {col} ({dtype}): 样本值 [{sample_str}]")
        
        return f"""## 数据描述
当前数据包含 {len(chunk_data)} 行，{len(chunk_data.columns)} 列。

列信息：
{chr(10).join(column_info)}"""
    
    def _build_task_description(self) -> str:
        """构建任务描述"""
        return f"""## 任务描述
{self.config.processing_logic}"""
    
    def _build_output_format(self) -> str:
        """构建输出格式说明"""
        schema_descriptions = []
        for schema in self.config.output_schema:
            schema_descriptions.append(f"- {schema.name}: {schema.description}")
        
        return f"""## 输出格式要求
请输出CSV格式的数据，包含以下列：
{chr(10).join(schema_descriptions)}

输出格式要求：
1. 第一行必须是列名（表头）
2. 使用逗号分隔
3. 如果字段值包含逗号或换行符，请用双引号包围
4. 不要输出行号（index）
5. 确保每一行的列数与表头一致"""
    
    def _build_data_content(self, chunk_data: pd.DataFrame) -> str:
        """构建数据内容"""
        # 将DataFrame转换为CSV字符串
        csv_content = chunk_data.to_csv(index=False)
        
        return f"""## 待处理数据
```csv
{csv_content}
```"""
    
    def validate_prompt_length(self, prompt: str, max_length: int = 8000) -> Tuple[bool, str]:
        """
        验证提示词长度
        
        Args:
            prompt: 提示词
            max_length: 最大长度限制
            
        Returns:
            (valid, message): 验证结果和消息
        """
        prompt_length = len(prompt)
        
        if prompt_length > max_length:
            return False, f"提示词过长 ({prompt_length} > {max_length})，建议减少chunk_size"
        
        return True, f"提示词长度合适 ({prompt_length} characters)"
    
    def get_expected_output_columns(self) -> List[str]:
        """获取期望的输出列名"""
        return self.output_columns.copy()
