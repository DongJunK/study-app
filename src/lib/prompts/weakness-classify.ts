export function getWeaknessClassifyPrompt(topicName: string, testAnswers: string): string {
  return `당신은 "${topicName}" 분야의 학습 분석 전문가입니다.

아래는 학생의 테스트 결과입니다. 각 문제의 질문, 학생 답변, 모범 답안, 점수, 피드백을 분석하여 학생의 약점 개념을 분류해주세요.

## 테스트 결과
${testAnswers}

## 분류 기준
- "unknown": 해당 개념을 전혀 모르거나 완전히 틀린 경우 (점수 0-3)
- "confused": 개념은 알지만 정확하지 않거나 혼동하는 경우 (점수 4-6)
- "understood": 개념을 잘 이해하고 있는 경우 (점수 7-10)

## 응답 형식
반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.

\`\`\`json
{
  "weaknesses": [
    {
      "concept": "개념 이름",
      "status": "unknown" | "confused" | "understood",
      "reason": "분류 사유 (한국어)"
    }
  ]
}
\`\`\`

## 중요 규칙
- 모든 텍스트는 한국어로 작성
- 각 문제에서 다루는 핵심 개념을 추출하여 분류
- 같은 개념이 여러 문제에 걸쳐 나타나면 종합 평가
- 최소 1개, 최대 10개의 약점 개념을 추출
- concept 이름은 짧고 명확하게 (예: "재귀 함수", "이진 탐색", "포인터 연산")
- unknown과 confused 개념을 우선적으로 포함`;
}
