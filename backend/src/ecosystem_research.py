import asyncio
from typing import Dict, List, Optional
from llama_index.llms.openai_like import OpenAILike
import os

class StarknetEcosystemResearcher:
    def __init__(self):
        self.research_llm = OpenAILike(
            api_base="https://openrouter.ai/api/v1",
            api_key=os.getenv("OPENROUTER_API_KEY"),
            model="perplexity/sonar-pro",
            is_chat_model=True,
            context_window=200000,
            max_tokens=800
        )

    async def research_ecosystem_updates(self, founder_space: str) -> Dict[str, any]:
        """Research latest Starknet ecosystem developments relevant to founder's space"""
        
        research_query = f"""
        Research the latest Starknet ecosystem developments (last 3 months) specifically relevant to {founder_space}. 
        Focus on:
        1. New protocol launches and updates
        2. Funding announcements and partnerships
        3. Technical improvements and upgrades
        4. Developer tooling updates
        5. Community initiatives and programs
        
        Prioritize information from official Starknet channels, Twitter updates, and ecosystem announcements.
        Provide specific dates, amounts, and actionable insights for founders building in this space.
        """
        
        try:
            response = await self.research_llm.acomplete(research_query)
            return {
                "updates": response.text,
                "timestamp": "recent",
                "relevance_score": "high",
                "sources": "Starknet ecosystem, Twitter, official announcements"
            }
        except Exception as e:
            return {
                "updates": f"Unable to fetch latest updates: {str(e)}",
                "timestamp": "error",
                "relevance_score": "unknown",
                "sources": "error"
            }

    async def research_successful_cases(self) -> Dict[str, List[Dict]]:
        """Research AVNU and Ekubo case studies"""
        
        case_studies_query = """
        Provide detailed case studies for these successful Starknet projects:
        
        1. AVNU (DeFi aggregator with gasless trading):
        - Business model and value proposition
        - Key metrics and achievements
        - Innovative features (especially Paymaster)
        - Growth strategy and market positioning
        - Lessons for other founders
        
        2. Ekubo (Advanced AMM):
        - Technical innovations and capital efficiency
        - Market capture and competitive advantages  
        - Token launch strategy (High Float Low FDV)
        - Community building and ecosystem integration
        - Success factors that can be replicated
        
        Focus on actionable insights and specific strategies that other Starknet founders can learn from.
        Include recent developments and current status of both projects.
        """
        
        try:
            response = await self.research_llm.acomplete(case_studies_query)
            
            # Parse response into structured case studies
            case_studies = {
                "avnu": {
                    "name": "AVNU",
                    "category": "DeFi Aggregator",
                    "key_innovation": "Gasless trading with Paymaster",
                    "insights": response.text[:len(response.text)//2],  # First half for AVNU
                    "applicable_lessons": []
                },
                "ekubo": {
                    "name": "Ekubo", 
                    "category": "AMM/DEX",
                    "key_innovation": "Advanced capital efficiency + High Float Low FDV tokenomics",
                    "insights": response.text[len(response.text)//2:],  # Second half for Ekubo
                    "applicable_lessons": []
                }
            }
            
            return case_studies
            
        except Exception as e:
            return {
                "error": f"Unable to fetch case studies: {str(e)}"
            } 