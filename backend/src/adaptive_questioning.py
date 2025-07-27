from typing import Dict, List, Optional
from pydantic import BaseModel
import json

class AdaptiveQuestionEngine:
    def __init__(self):
        self.question_templates = {
            "missing_team": [
                "I notice your pitch doesn't mention the founding team. Can you tell me about your background and why you're uniquely positioned to solve this problem?",
                "What's your team's 'earned secret' - the unique insight or experience that gives you an unfair advantage?",
                "Who are the key team members and what relevant experience do they bring?"
            ],
            "unclear_market": [
                "Your market size seems unclear. Can you break down your TAM, SAM, and target market with specific numbers?",
                "How fast is your target market growing? What trends are driving this growth?",
                "Who exactly is your ideal customer? Can you describe a specific use case?"
            ],
            "weak_traction": [
                "I don't see strong traction metrics. What evidence do you have of product-market fit?",
                "What's your current user/revenue growth rate? What's driving that growth?",
                "Can you share retention curves or usage metrics that show user engagement?"
            ],
            "missing_economics": [
                "Your unit economics aren't clear. What's your customer acquisition cost (CAC) and lifetime value (LTV)?",
                "How do you make money? What's your gross margin and path to profitability?",
                "What are your key revenue drivers and how do they scale?"
            ],
            "undefined_problem": [
                "The problem statement could be sharper. What specific workflow breaks without your solution?",
                "How painful is this problem? What happens if customers don't solve it?",
                "What alternatives do customers use today and why are they insufficient?"
            ],
            "vague_solution": [
                "Your solution needs more specificity. What exactly does your product do?",
                "What's your key differentiator? Why is your approach 10x better than alternatives?",
                "Can you walk through the user experience step by step?"
            ],
            "missing_persona": [
                "Your user persona isn't clear. Who exactly are you building for?",
                "What job is your user trying to get done? What's their current workflow?",
                "Can you describe a day in the life of your target user?"
            ],
            "unclear_metrics": [
                "What success metrics will prove your product is working?",
                "How do you measure user engagement and value creation?",
                "What are your key retention and conversion benchmarks?"
            ],
            "missing_roadmap": [
                "What are your next 3 major product milestones?",
                "How do you prioritize features? What's your framework for product decisions?",
                "What's your timeline for reaching key product-market fit indicators?"
            ]
        }

    def generate_adaptive_questions(self, missing_sections: List[str], agent_type: str, context: str = "") -> List[Dict]:
        """Generate context-aware follow-up questions based on missing sections"""
        
        questions = []
        question_count = 0
        max_questions = 3  # Limit to avoid overwhelming
        
        # Prioritize questions based on agent type
        if agent_type == "Shark VC":
            priority_order = ["missing_team", "unclear_market", "weak_traction", "missing_economics"]
        else:  # Product PM
            priority_order = ["undefined_problem", "vague_solution", "missing_persona", "unclear_metrics", "missing_roadmap"]
        
        # Map missing sections to question templates
        section_to_template = {
            "team": "missing_team",
            "market": "unclear_market", 
            "traction": "weak_traction",
            "economics": "missing_economics",
            "problem": "undefined_problem",
            "solution": "vague_solution",
            "persona": "missing_persona",
            "metrics": "unclear_metrics",
            "roadmap": "missing_roadmap"
        }
        
        for section in missing_sections:
            template_key = section_to_template.get(section)
            if template_key and template_key in priority_order and question_count < max_questions:
                template_questions = self.question_templates.get(template_key, [])
                if template_questions:
                    questions.append({
                        "section": section,
                        "question": template_questions[0],  # Use first question as primary
                        "alternatives": template_questions[1:],  # Store alternatives
                        "priority": len(priority_order) - priority_order.index(template_key) if template_key in priority_order else 0  # Higher number = higher priority
                    })
                    question_count += 1
        
        return sorted(questions, key=lambda x: x["priority"], reverse=True)

    def contextualize_question(self, base_question: str, founder_context: str, document_content: str) -> str:
        """Personalize questions based on founder's specific context and uploaded documents"""
        
        # Simple contextualization - in production, use LLM for more sophisticated personalization
        if "fintech" in founder_context.lower() or "finance" in document_content.lower():
            base_question = base_question.replace("customers", "users or financial institutions")
        elif "defi" in founder_context.lower() or "protocol" in document_content.lower():
            base_question = base_question.replace("customers", "users and liquidity providers")
        elif "gaming" in founder_context.lower() or "game" in document_content.lower():
            base_question = base_question.replace("customers", "players and game developers")
        elif "ai" in founder_context.lower() or "artificial intelligence" in document_content.lower():
            base_question = base_question.replace("customers", "AI users and enterprises")
        elif "starknet" in founder_context.lower() or "cairo" in document_content.lower():
            base_question = base_question.replace("customers", "developers and protocols")
        
        return base_question 