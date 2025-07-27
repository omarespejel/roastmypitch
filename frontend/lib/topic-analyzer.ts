/**
 * Analyzes chat messages to determine which rubric items have been covered
 */

interface TopicKeywords {
  [key: string]: string[]
}

const SHARK_VC_KEYWORDS: TopicKeywords = {
  team: ['founder', 'team', 'experience', 'background', 'expertise', 'earned secret', 'why you'],
  market: ['TAM', 'market size', 'total addressable', 'billion', 'market opportunity', 'growth rate'],
  problem: ['problem', 'pain point', 'solution fit', 'customer need', 'workflow', 'broken'],
  traction: ['users', 'revenue', 'growth', 'retention', 'churn', 'MRR', 'ARR', 'customers'],
  economics: ['CAC', 'LTV', 'unit economics', 'payback', 'margin', 'burn rate', 'runway'],
  competition: ['competitors', 'competitive advantage', 'moat', 'differentiation', 'barrier'],
  model: ['business model', 'pricing', 'monetization', 'subscription', 'marketplace', 'SaaS'],
  funding: ['use of funds', 'funding', 'capital', 'milestone', 'budget', 'hire', 'spend'],
  exit: ['exit', 'acquisition', 'IPO', 'acquirer', 'strategic buyer', 'multiple'],
  risks: ['risk', 'challenge', 'threat', 'mitigation', 'what could kill', 'failure'],
}

const PRODUCT_PM_KEYWORDS: TopicKeywords = {
  market: ['market', 'TAM', 'segment', 'customer base', 'growth', 'opportunity'],
  persona: ['user persona', 'JTBD', 'jobs to be done', 'customer profile', 'who is the user'],
  problem: ['problem', 'pain point', 'hair on fire', 'urgent', 'critical', 'need'],
  solution: ['solution', 'feature', 'unique', 'differentiation', '10x better', 'alternative'],
  roadmap: ['roadmap', 'prioritization', 'RICE', 'next feature', 'timeline', 'milestone'],
  metrics: ['metric', 'KPI', 'north star', 'success', 'measure', 'analytics', 'tracking'],
  mvp: ['MVP', 'MLP', 'minimum viable', 'minimum lovable', 'iteration', 'evolution'],
  narrative: ['story', 'narrative', 'press release', 'vision', 'pitch', 'messaging'],
  experiments: ['experiment', 'test', 'hypothesis', 'learning', 'validation', 'A/B test'],
}

export function analyzeCompletedTopics(
  messages: Array<{ role: string; content: string }>,
  agentType: string
): string[] {
  const keywords = agentType === 'Product PM' ? PRODUCT_PM_KEYWORDS : SHARK_VC_KEYWORDS
  const completedTopics = new Set<string>()
  
  // Only analyze assistant messages (the bot's responses)
  const assistantMessages = messages
    .filter(m => m.role === 'assistant')
    .map(m => m.content.toLowerCase())
    .join(' ')

  // Check each topic to see if it's been discussed
  Object.entries(keywords).forEach(([topicId, topicKeywords]) => {
    const isDiscussed = topicKeywords.some(keyword => 
      assistantMessages.includes(keyword.toLowerCase())
    )
    
    if (isDiscussed) {
      // Additional check: topic should be discussed substantively (not just mentioned)
      const topicMentions = topicKeywords.filter(keyword => 
        assistantMessages.includes(keyword.toLowerCase())
      ).length
      
      // Consider topic covered if multiple keywords are mentioned or discussed at length
      if (topicMentions >= 2 || (topicKeywords[0] && assistantMessages.split(topicKeywords[0]).length > 2)) {
        completedTopics.add(topicId)
      }
    }
  })

  return Array.from(completedTopics)
} 