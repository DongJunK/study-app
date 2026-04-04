export function getSessionSummaryPrompt(messages: string): string {
  return `Based on this learning session, create a summary in Korean:

${messages}

Format as JSON (wrapped in \`\`\`json code block):
\`\`\`json
{
  "learned": ["오늘 배운 핵심 개념들"],
  "uncertain": ["아직 불확실한 부분"],
  "nextSteps": ["다음에 학습할 내용"]
}
\`\`\`

Return ONLY the JSON, no other text.`;
}
