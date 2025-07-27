from typing import Dict, List
from llama_index.llms.openai_like import OpenAILike
import os

class CompetitorAnalyzer:
    def __init__(self):
        self.analysis_llm = OpenAILike(
            api_base="https://openrouter.ai/api/v1",
            api_key=os.getenv("OPENROUTER_API_KEY"),
            model="perplexity/sonar-pro",
            is_chat_model=True,
            context_window=200000,
            max_tokens=1000
        )

    async def analyze_competitors(self, project_description: str, starknet_focus: bool = True) -> Dict:
        """Analyze competitors for a given project in the Starknet ecosystem"""
        
        scope = "Starknet ecosystem and broader blockchain/DeFi space" if starknet_focus else "blockchain and traditional tech space"
        
        analysis_query = f"""
        Analyze competitors for this project: {project_description}
        
        Focus on the {scope}. Provide:
        
        1. DIRECT COMPETITORS (same solution, same market):
        - Project names and descriptions
        - Market positioning and differentiation
        - Strengths and weaknesses
        - Market share/traction data
        
        2. INDIRECT COMPETITORS (different solution, same problem):
        - Alternative approaches to solving the same problem
        - Why users might choose them instead
        - Market gaps they don't address
        
        3. COMPETITIVE ANALYSIS:
        - Market positioning opportunities
        - Differentiation strategies
        - Competitive advantages to emphasize
        - Potential threats and how to address them
        
        4. STARKNET-SPECIFIC ADVANTAGES:
        - How Starknet's features create competitive moats
        - Ecosystem synergies and integrations
        - Cost/performance advantages
        
        Be specific with project names, metrics, and actionable insights. Focus on recent developments and current market dynamics.
        """
        
        try:
            response = await self.analysis_llm.acomplete(analysis_query)
            
            # Parse and structure the analysis
            return {
                "analysis": response.text,
                "direct_competitors": self._extract_competitors(response.text, "direct"),
                "indirect_competitors": self._extract_competitors(response.text, "indirect"),
                "competitive_advantages": self._extract_advantages(response.text),
                "recommended_positioning": self._extract_positioning(response.text),
                "timestamp": "current"
            }
        except Exception as e:
            return {
                "error": f"Unable to complete competitor analysis: {str(e)}",
                "analysis": "",
                "direct_competitors": [],
                "indirect_competitors": [],
                "competitive_advantages": [],
                "recommended_positioning": ""
            }

    def _extract_competitors(self, text: str, competitor_type: str) -> List[Dict]:
        # Simple extraction logic - in production, use more sophisticated NLP
        competitors = []
        lines = text.split('\n')
        
        # Look for competitor mentions
        for line in lines:
            if any(word in line.lower() for word in ['competitor', 'alternative', 'project']):
                if '-' in line or '•' in line:
                    # Extract project name (first part before description)
                    parts = line.strip(' -•').split(':')
                    if len(parts) >= 2:
                        competitors.append({
                            'name': parts[0].strip(),
                            'description': parts[1].strip()
                        })
        
        return competitors[:5]  # Limit to top 5

    def _extract_advantages(self, text: str) -> List[str]:
        # Extract competitive advantages
        advantages = []
        lines = text.split('\n')
        
        for line in lines:
            if any(phrase in line.lower() for phrase in ['advantage', 'strength', 'benefit', 'moat']):
                if '-' in line or '•' in line:
                    advantages.append(line.strip(' -•').strip())
        
        return advantages[:5]  # Limit to top 5

    def _extract_positioning(self, text: str) -> str:
        # Extract positioning recommendations
        positioning_keywords = ['positioning', 'strategy', 'differentiation', 'focus']
        lines = text.split('\n')
        
        for line in lines:
            if any(keyword in line.lower() for keyword in positioning_keywords):
                return line.strip()
        
        return "Focus on unique Starknet advantages and ecosystem synergies" 