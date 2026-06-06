import Groq from 'groq-sdk';

const CATEGORIES = [
  'Technology', 'IT & Software', 'Finance', 'Healthcare', 'Education',
  'Retail & E-commerce', 'Marketing & Media', 'Manufacturing', 'Real Estate',
  'Construction', 'Logistics & Transportation', 'Hospitality & Travel',
  'Professional Services', 'Telecommunications', 'Energy & Utilities',
  'Agriculture', 'Government', 'Non-Profit', 'Automotive', 'Food & Beverage', 'Other',
];

export const getCategory = async (
  companyName: string,
  keywords: string[] = []
): Promise<{ suggested_category: string; confidence: number; reason: string; needs_review: boolean }> => {
  if (!companyName && keywords.length === 0) {
    return { suggested_category: '', confidence: 0, reason: 'No data', needs_review: true };
  }

  if (process.env.GROQ_API_KEY) {
    try {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const res = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: `Company: "${companyName}"\n\nWhich category does this company belong to? Pick exactly one from this list:\n${CATEGORIES.join(', ')}\n\nReply with only the category name. Nothing else.` }],
        max_tokens: 10,
      });
      const aiResponse = res.choices[0]?.message?.content?.trim() || '';
      const match = CATEGORIES.find(c => c.toLowerCase() === aiResponse.toLowerCase());
      if (match) return { suggested_category: match, confidence: 0.85, reason: 'AI classification', needs_review: false };
    } catch { /* fall through */ }
  }

  return { suggested_category: '', confidence: 0, reason: 'Could not determine', needs_review: true };
};
