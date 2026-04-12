export function getAnswerComparePrompt(answers: { question: string; userAnswer: string }[]): string {
  const questionsBlock = answers.map((a, i) => `### 문제 ${i + 1}
**질문:** ${a.question}
**학생의 답변:** ${a.userAnswer}`).join('\n\n');

  return `당신은 학습 평가 전문가입니다. 학생의 답변을 분석하고 각 문제에 대한 모범답안과 비교해주세요.

## 문제 및 학생 답변
${questionsBlock}

## 요청사항
각 문제에 대해:
1. 이상적인 모범답안을 작성하세요.
2. 학생의 답변과 모범답안을 비교 분석하세요.
3. 학생의 답변에서 빠진 핵심 포인트를 구체적으로 나열하세요.
4. 종합 피드백을 제공하세요.

## 응답 형식
반드시 다음 JSON 형식으로만 응답하세요 (다른 텍스트 없이):

\`\`\`json
{
  "results": [
    {
      "questionIndex": 1,
      "question": "질문 내용",
      "modelAnswer": "모범답안 전체 내용 (마크다운 형식으로 상세하게, **볼드**, 리스트 등 활용)",
      "gaps": ["빠진 핵심 포인트 1", "빠진 핵심 포인트 2"],
      "feedback": "종합 피드백 (강점과 개선점 모두 포함)"
    }
  ]
}
\`\`\`

## 중요 규칙
- 모든 내용은 한국어로 작성
- 모범답안은 마크다운 형식으로 충분히 상세하게 작성 (제목, 리스트, 코드블록 등 활용)
- gaps는 구체적이고 실행 가능한 포인트로 작성
- 학생의 답변이 좋은 경우에도 보완할 수 있는 점을 제시
- results 배열의 순서는 문제 순서와 동일하게`;
}
