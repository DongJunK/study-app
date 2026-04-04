export function getRoadmapPrompt(
  topicName: string,
  diagnosisResult: string
): string {
  return `Based on this diagnosis for "${topicName}":
${diagnosisResult}

Generate a learning roadmap in this EXACT JSON format (wrapped in \`\`\`json code block):
\`\`\`json
{
  "items": [
    { "title": "항목 제목", "order": 1, "description": "간단한 설명" },
    ...
  ]
}
\`\`\`

Rules:
- Skip concepts the user already knows well
- Focus on weak areas first
- Order from prerequisite to advanced
- 8-15 items total
- All text in Korean
- Include a mix of concept learning and practical application
- Return ONLY the JSON, no other text`;
}
