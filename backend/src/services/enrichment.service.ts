export const extractKeywords = (companyName: string, rawText: string, emails: string[]): string[] => {
  const sources = [companyName, rawText];
  if (emails[0]) {
    const domain = emails[0].split('@')[1] || '';
    sources.push(domain.split('.')[0]);
  }
  const combined = sources.join(' ').toLowerCase();
  const words = combined.match(/\b[a-z]{3,}\b/g) || [];
  const stopWords = new Set(['and','the','for','with','from','that','this','have','will','your','our','are','was','not','but','can','all','any','its','has','been','more','also','into','than','then','them','they','their','there','these','those','when','what','which','who','how','why','where','each','both','few','more','most','other','some','such','only','same','just','like','well','even','back','after','use','two','how','its','our','out','who','oil','sit','now','him','his','her','she','him','his','her','she']);
  return [...new Set(words.filter(w => !stopWords.has(w)))].slice(0, 20);
};
