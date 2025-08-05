import base64
import io
import json
import os
from typing import Dict, List, Optional, Tuple

import pdf2image
from PIL import Image
from llama_index.llms.openai_like import OpenAILike
from pydantic import BaseModel

from .prompts import AgentType


class AnalysisResult(BaseModel):
    missing_sections: List[str]
    suggested_actions: List[Dict[str, str]]
    help_tooltips: Dict[str, str]
    next_steps: List[str]


class EnhancedPitchDeckAnalyzer:
    def __init__(self):
        # Vision-capable model via OpenRouter
        self.vision_llm = OpenAILike(
            api_base="https://openrouter.ai/api/v1",
            api_key=os.getenv("OPENROUTER_API_KEY"),
            model="anthropic/claude-3-5-sonnet-20241022",  # Supports vision
            is_chat_model=True,
            context_window=200000,
            max_tokens=1000,
            temperature=0.3,
        )
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

    async def analyze_pitch_deck_comprehensive(
        self, 
        file_path: str, 
        agent_type: AgentType
    ) -> Dict:
        """Enhanced analysis combining text extraction + visual interpretation"""
        
        try:
            # Stage 1: Extract structured text (existing approach)
            text_content = self._extract_text_content(file_path)
            text_analysis = self.analyze_document_gaps(text_content, agent_type)
            
            # Stage 2: Visual analysis of each page
            visual_insights = await self._analyze_visual_content(file_path, agent_type)
            
            # Stage 3: Combine and synthesize insights
            comprehensive_analysis = self._synthesize_analysis(
                text_analysis, visual_insights, agent_type
            )
            
            return comprehensive_analysis
            
        except Exception as e:
            print(f"Comprehensive analysis failed: {e}")
            # Fallback to text-only analysis
            text_content = self._extract_text_content(file_path)
            return self.analyze_document_gaps(text_content, agent_type)

    def _extract_text_content(self, file_path: str) -> str:
        """Extract text content from PDF using existing pypdf approach"""
        import pypdf
        
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = pypdf.PdfReader(file)
                text = ""
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
                return text
        except Exception as e:
            print(f"Text extraction failed: {e}")
            return ""

    async def _analyze_visual_content(
        self, 
        file_path: str, 
        agent_type: AgentType
    ) -> Dict:
        """Analyze visual elements using OpenRouter vision models"""
        
        try:
            # Convert PDF pages to images (limit to first 8 pages for cost control)
            images = pdf2image.convert_from_path(file_path, dpi=150, first_page=1, last_page=8)
            
            visual_insights = {
                "charts_and_metrics": [],
                "visual_storytelling": [],
                "missing_visual_elements": [],
                "page_analysis": [],
                "key_visual_insights": []
            }
            
            for i, image in enumerate(images):
                # Convert PIL image to base64
                base64_image = self._image_to_base64(image)
                
                # Analyze each page visually
                page_analysis = await self._analyze_page_visual(
                    base64_image, i+1, agent_type
                )
                
                if page_analysis and not page_analysis.get("error"):
                    visual_insights["page_analysis"].append(page_analysis)
                    
                    # Extract specific visual elements
                    if page_analysis.get("has_charts"):
                        visual_insights["charts_and_metrics"].extend(
                            page_analysis.get("chart_insights", [])
                        )
                    
                    visual_insights["key_visual_insights"].extend(
                        page_analysis.get("key_findings", [])
                    )
            
            return visual_insights
            
        except Exception as e:
            print(f"Visual analysis failed: {e}")
            return {"error": str(e), "page_analysis": []}

    def _image_to_base64(self, image: Image.Image) -> str:
        """Convert PIL image to base64 string"""
        # Resize image to reduce token usage while maintaining readability
        max_size = (1024, 1024)
        image.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        buffer = io.BytesIO()
        image.save(buffer, format="PNG", optimize=True)
        image_bytes = buffer.getvalue()
        return base64.b64encode(image_bytes).decode()

    async def _analyze_page_visual(
        self, 
        base64_image: str, 
        page_num: int, 
        agent_type: AgentType
    ) -> Dict:
        """Analyze a single page using vision model"""
        
        # Craft prompt based on agent type (using Zinsser + beginner founder style)
        if agent_type == AgentType.SHARK_VC:
            prompt = f"""Analyze pitch deck page #{page_num} from a beginner founder perspective getting VC feedback.

LOOK FOR & EXTRACT:
1. **Numbers that matter**: Revenue, users, growth rates, market size
2. **Charts/graphs**: What story do they tell? Are trends going up?
3. **Team info**: Founder backgrounds, relevant experience
4. **Traction evidence**: Customer logos, growth curves, partnerships
5. **Visual problems**: Hard to read, confusing, missing key info

FOCUS ON BEGINNER FOUNDERS:
- What would confuse a first-time founder?
- What key investor info is missing?
- How can this slide be clearer?

Be specific. Not "needs improvement" but "add your MRR growth rate" or "show team backgrounds."

Extract key insights in simple bullet points."""

        else:  # Product Manager
            prompt = f"""Analyze pitch deck page #{page_num} from a product perspective for beginner founders.

LOOK FOR & EXTRACT:
1. **User insights**: Who uses this? What problem does it solve?
2. **Product features**: What does it do? How does it work?
3. **Market research**: Customer validation, user feedback
4. **Product metrics**: Usage, retention, feature adoption
5. **User journey**: How do people discover and use this?

FOCUS ON BEGINNER FOUNDERS:
- Is the user problem clear?
- Does the solution make sense?
- What product questions are unanswered?

Use Lenny Rachitsky frameworks when relevant. Give concrete next steps.

Extract key insights in simple bullet points."""

        try:
            # Create message for vision model
            messages = [
                {
                    "role": "user", 
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url", 
                            "image_url": {
                                "url": f"data:image/png;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ]
            
            # Get response from vision model
            response = await self.vision_llm.achat(messages)
            response_text = str(response)
            
            # Parse response
            return self._parse_visual_response(response_text, page_num)
            
        except Exception as e:
            print(f"Visual analysis failed for page {page_num}: {e}")
            return {"page": page_num, "error": str(e)}

    def _parse_visual_response(self, response: str, page_num: int) -> Dict:
        """Parse and structure the vision model response"""
        
        # Structure the text response
        key_findings = []
        chart_insights = []
        missing_elements = []
        
        lines = [line.strip() for line in response.split('\n') if line.strip()]
        
        for line in lines:
            if any(term in line.lower() for term in ["revenue", "users", "growth", "$", "%", "mrr", "arr", "metric"]):
                chart_insights.append(line)
            elif any(term in line.lower() for term in ["missing", "need", "add", "unclear", "confusing"]):
                missing_elements.append(line)
            elif line and not line.startswith('#') and len(line) > 10:
                key_findings.append(line)
        
        return {
            "page": page_num,
            "raw_response": response,
            "has_charts": any(term in response.lower() for term in ["chart", "graph", "metric", "data", "trend"]),
            "has_metrics": any(term in response.lower() for term in ["revenue", "users", "growth", "$", "%", "mrr", "arr"]),
            "key_findings": key_findings[:3],  # Top 3 insights
            "chart_insights": chart_insights[:2],  # Top 2 chart insights
            "missing_elements": missing_elements[:2]  # Top 2 missing elements
        }

    def _synthesize_analysis(
        self, 
        text_analysis: Dict, 
        visual_insights: Dict, 
        agent_type: AgentType
    ) -> Dict:
        """Combine text and visual analysis into comprehensive insights"""
        
        # Extract key insights from visual analysis
        visual_metrics = []
        visual_missing = []
        
        for page in visual_insights.get("page_analysis", []):
            if page.get("has_metrics"):
                visual_metrics.extend(page.get("chart_insights", []))
            visual_missing.extend(page.get("missing_elements", []))
        
        # Enhanced action items
        enhanced_actions = self._generate_enhanced_action_items(
            text_analysis, visual_insights, agent_type
        )
        
        return {
            "missing_sections": text_analysis.get("missing_sections", []),
            "suggested_actions": text_analysis.get("suggested_actions", []),
            "help_tooltips": text_analysis.get("help_tooltips", {}),
            "next_steps": enhanced_actions,
            "visual_insights": {
                "metrics_found": visual_metrics,
                "elements_missing": visual_missing,
                "total_pages_analyzed": len(visual_insights.get("page_analysis", [])),
                "pages_with_charts": len([p for p in visual_insights.get("page_analysis", []) if p.get("has_charts")])
            }
        }

    def _generate_enhanced_action_items(
        self, 
        text_analysis: Dict, 
        visual_insights: Dict, 
        agent_type: AgentType
    ) -> List[str]:
        """Generate concrete action items based on both text and visual analysis"""
        
        actions = []
        
        # Add original text-based actions
        actions.extend(text_analysis.get("next_steps", [])[:3])
        
        # Add visual-based actions
        chart_pages = [p for p in visual_insights.get("page_analysis", []) if p.get("has_charts")]
        if len(chart_pages) < 2:
            if agent_type == AgentType.SHARK_VC:
                actions.append("Add charts showing revenue growth, user acquisition, or market traction")
            else:
                actions.append("Include visuals showing user research data, product metrics, or customer feedback")
        
        metric_pages = [p for p in visual_insights.get("page_analysis", []) if p.get("has_metrics")]
        if len(metric_pages) < 1:
            actions.append("Include specific numbers - show your key metrics with actual data")
        
        # Agent-specific recommendations
        if agent_type == AgentType.SHARK_VC:
            actions.append("Make each slide answer: 'How does this prove market opportunity?'")
        else:
            actions.append("Show the user journey - how do people discover, try, and love your product?")
        
        return actions[:6]  # Limit to 6 most important actions
