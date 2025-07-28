from typing import Dict, List, Optional

from pydantic import BaseModel

from .prompts import AgentType


class AnalysisResult(BaseModel):
    missing_sections: List[str]
    suggested_actions: List[Dict[str, str]]
    help_tooltips: Dict[str, str]
    next_steps: List[str]


class PitchDeckAnalyzer:
    def __init__(self):
        self.vc_rubric = {
            "team": {
                "keywords": [
                    "founder",
                    "team",
                    "experience",
                    "background",
                    "CEO",
                    "CTO",
                    "leadership",
                ],
                "help_text": "Investors need to know why YOU are the right team to solve this problem. Include founding team backgrounds, relevant experience, and unique insights.",
                "missing_action": "Upload a team slide or answer: What unique experience qualifies your team to solve this problem?",
            },
            "market": {
                "keywords": [
                    "TAM",
                    "market size",
                    "billion",
                    "opportunity",
                    "market",
                    "addressable",
                ],
                "help_text": "VCs want to see a large, growing market. Show Total Addressable Market (TAM), Serviceable Available Market (SAM), and your target market size.",
                "missing_action": "Provide market sizing data or answer: What's your TAM? How fast is the market growing? What's your target market?",
            },
            "traction": {
                "keywords": [
                    "users",
                    "revenue",
                    "growth",
                    "MRR",
                    "customers",
                    "metrics",
                    "retention",
                ],
                "help_text": "Traction proves market demand. Show user growth, revenue metrics, retention rates, and key partnerships.",
                "missing_action": "Share your traction metrics or answer: How many users/customers do you have? What's your monthly growth rate? What's your retention?",
            },
            "economics": {
                "keywords": [
                    "CAC",
                    "LTV",
                    "unit economics",
                    "margin",
                    "profitability",
                    "monetization",
                ],
                "help_text": "Unit economics show path to profitability. Include Customer Acquisition Cost (CAC), Lifetime Value (LTV), and gross margins.",
                "missing_action": "Define your unit economics: What's your CAC and LTV? How do you make money per customer?",
            },
            "competition": {
                "keywords": [
                    "competitors",
                    "competitive",
                    "advantage",
                    "differentiation",
                    "moat",
                ],
                "help_text": "Show understanding of competitive landscape and your defensible advantages.",
                "missing_action": "Analyze your competition: Who are your main competitors and what's your unique advantage?",
            },
            "problem": {
                "keywords": [
                    "problem",
                    "pain point",
                    "challenge",
                    "issue",
                    "frustration",
                ],
                "help_text": "Clearly articulate the problem you're solving and why it matters to customers.",
                "missing_action": "Define the problem: What specific pain point are you solving? How painful is it?",
            },
        }

        self.pm_rubric = {
            "persona": {
                "keywords": [
                    "user persona",
                    "JTBD",
                    "customer profile",
                    "target user",
                    "user research",
                ],
                "help_text": "Clear user personas drive product decisions. Define who your users are, their pain points, and jobs-to-be-done.",
                "missing_action": "Create user personas or answer: Who exactly is your target user? What job are they hiring your product to do?",
            },
            "problem": {
                "keywords": [
                    "problem",
                    "pain point",
                    "user frustration",
                    "workflow",
                    "friction",
                ],
                "help_text": "Deep problem understanding is crucial. Map user workflows and identify specific friction points.",
                "missing_action": "Detail the problem: What specific workflow breaks? What happens when users can't solve this?",
            },
            "solution": {
                "keywords": [
                    "solution",
                    "feature",
                    "product",
                    "functionality",
                    "user experience",
                ],
                "help_text": "Product solution should directly address user pain points with clear value proposition.",
                "missing_action": "Describe your solution: How exactly does your product solve the user's problem? What's the user flow?",
            },
            "metrics": {
                "keywords": [
                    "metrics",
                    "KPI",
                    "engagement",
                    "retention",
                    "conversion",
                    "success",
                ],
                "help_text": "Define success metrics that prove product-market fit and user value.",
                "missing_action": "Define success metrics: How do you measure user success? What are your key engagement metrics?",
            },
            "roadmap": {
                "keywords": [
                    "roadmap",
                    "timeline",
                    "milestone",
                    "development",
                    "iteration",
                ],
                "help_text": "Product roadmap shows strategic thinking and prioritization framework.",
                "missing_action": "Share your roadmap: What are your next 3 major product milestones? How do you prioritize features?",
            },
        }

    def analyze_document_gaps(
        self, content: str, agent_type: AgentType
    ) -> AnalysisResult:
        rubric = self.vc_rubric if agent_type == AgentType.SHARK_VC else self.pm_rubric
        missing_sections = []
        suggested_actions = []
        help_tooltips = {}

        for section_id, section_data in rubric.items():
            # Check if section is covered in content
            keywords_found = sum(
                1
                for keyword in section_data["keywords"]
                if keyword.lower() in content.lower()
            )

            if keywords_found < 2:  # Threshold for "covered"
                missing_sections.append(section_id)
                suggested_actions.append(
                    {
                        "section": section_id,
                        "action": section_data["missing_action"],
                        "priority": "high"
                        if section_id in ["team", "market", "traction", "problem"]
                        else "medium",
                    }
                )

            help_tooltips[section_id] = section_data["help_text"]

        return AnalysisResult(
            missing_sections=missing_sections,
            suggested_actions=suggested_actions,
            help_tooltips=help_tooltips,
            next_steps=self._generate_next_steps(missing_sections, agent_type),
        )

    def _generate_next_steps(
        self, missing_sections: List[str], agent_type: AgentType
    ) -> List[str]:
        if agent_type == AgentType.SHARK_VC:
            priorities = [
                "team",
                "market",
                "traction",
                "economics",
                "competition",
                "problem",
            ]
        else:
            priorities = ["persona", "problem", "solution", "metrics", "roadmap"]

        next_steps = []
        for priority in priorities:
            if priority in missing_sections:
                next_steps.append(
                    f"Focus on {priority} - this is critical for {agent_type.value}"
                )
                if len(next_steps) >= 3:  # Limit to top 3 priorities
                    break

        return next_steps
