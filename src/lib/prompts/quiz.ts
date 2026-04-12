export function getMCBulkGeneratePrompt(topicName: string, concepts: string[], strategic?: boolean, weaknesses?: string[], learnedConcepts?: string[]): string {
  const conceptList = concepts.length > 0 ? concepts.join(', ') : topicName;

  const strategicSection = strategic ? `
## 출제 우선순위 (실전 테스트)
1. 면접 빈출 개념 우선
2. 약점 영역: ${weaknesses?.join(', ') || '없음'}
3. 학습 완료 영역: ${learnedConcepts?.join(', ') || '없음'}
4. 미학습 중요 개념
` : '';

  return `당신은 "${topicName}" 분야의 객관식 퀴즈 출제 전문가입니다.

## 퀴즈 대상 개념
${conceptList}
${strategicSection}
## 요구사항
- 4지선다 객관식 문제 10개를 한번에 JSON으로 생성하세요.
- 난이도를 점진적으로 올려주세요.
- 모든 텍스트는 한국어로 작성하세요.
- 각 문제의 선택지는 그럴듯하게 만들어 변별력을 확보하세요.
- 정답은 골고루 분포시키세요 (1~4번이 편중되지 않게).

## 출력 형식
반드시 아래 JSON만 출력하세요. 다른 텍스트 없이 JSON만 반환하세요.

\`\`\`json
{
  "questions": [
    {
      "index": 1,
      "question": "문제 텍스트",
      "choices": ["선택지1", "선택지2", "선택지3", "선택지4"],
      "correctIndex": 0,
      "feedback": "정답 해설"
    }
  ]
}
\`\`\`

- correctIndex는 0부터 시작하는 정답 인덱스입니다.
- feedback은 왜 해당 선택지가 정답인지 설명합니다.
- 반드시 10문제를 생성하세요.`;
}

export function getMultipleChoicePrompt(topicName: string, concepts: string[], previousResults?: { question: string; score: number; maxScore: number }[], userLevel: string = 'beginner'): string {
  const conceptList = concepts.length > 0 ? concepts.join(', ') : topicName;

  const prevSection = previousResults && previousResults.length > 0 ? `
## 이전 테스트 결과 기반 출제 전략
아래는 이전 테스트에서 출제된 문제와 점수입니다. 이를 참고하여 출제하세요.

### 출제 규칙
| 이전 점수 | 전략 |
|-----------|------|
| 7점 이상 | 해당 개념은 제외하거나 더 심화된 관점으로 출제 |
| 4-6점 | 같은 개념을 다른 각도로 재출제 |
| 1-3점 | 같은 개념을 우선 재출제 |
| 미출제 | 새로운 개념으로 출제 |

### 이전 테스트 이력
${previousResults.map((r, i) => `${i + 1}. [${r.score}/${r.maxScore}점] ${r.question}`).join('\n')}
` : '';

  const levelLabel: Record<string, string> = { beginner: '초급', intermediate: '중급', advanced: '고급' };
  const levelSection = `
## 출제 난이도
현재 학생의 수준: **${levelLabel[userLevel] || '초급'}**

### 수준별 출제 기준
- **초급**: 기본 개념 이해, 용어 정의, 간단한 비교 문제
- **중급**: 개념 간 관계, 실무 적용, 동작 원리 문제
- **고급**: 내부 구현, 성능 최적화, 장애 대응, 아키텍처 설계 문제

학생의 수준에 맞는 난이도로 출제하세요.
각 문제 출제 시 난이도를 표시하세요: [초급], [중급], [고급]
`;

  return `당신은 "${topicName}" 분야의 객관식 퀴즈 출제 전문가입니다.

## 퀴즈 대상 개념
${conceptList}
${prevSection}${levelSection}
## 진행 방식
1. 4지선다 객관식 문제를 하나씩 출제하세요.
2. 총 10문제를 출제합니다.
3. 학생이 답(1, 2, 3, 4 중 하나)을 선택하면 정답/오답을 알려주지 말고 바로 다음 문제를 출제하세요.
4. 중간에 절대 채점하거나 정답을 공개하지 마세요. "다음 문제입니다" 정도만 말하세요.
5. 모든 10문제가 끝나면 한꺼번에 채점 결과를 JSON으로 제공하세요.

## 문제 형식
각 문제는 다음과 같이 출제하세요:

**문제 N.** [난이도]
[질문 내용]

1. [선택지 1]
2. [선택지 2]
3. [선택지 3]
4. [선택지 4]

## 중간 응답 형식
학생이 답을 선택하면:
- 정답 여부를 절대 알려주지 마세요
- "다음 문제입니다." 한 마디 후 바로 다음 문제를 출제하세요
- 해설이나 피드백을 제공하지 마세요

## 최종 채점 (모든 문제 완료 후)
10문제가 모두 끝나면 반드시 다음 JSON을 포함하세요 (\`\`\`json 코드 블록으로 감싸세요):

\`\`\`json
{
  "type": "final",
  "totalQuestions": 10,
  "summary": "종합 평가 내용",
  "results": [
    {
      "questionIndex": 1,
      "question": "출제한 문제 전체 텍스트",
      "correctAnswer": "정답 선택지 번호와 내용 (예: 2. Redis)",
      "userAnswer": "학생이 선택한 번호와 내용",
      "correct": true,
      "score": 10,
      "maxScore": 10,
      "feedback": "해설 내용"
    }
  ]
}
\`\`\`

- correct가 true이면 score: 10, false이면 score: 0
- results 배열에 10문제 전부 포함

## 중요 규칙
- 모든 대화는 한국어로 진행
- 문제는 한 번에 하나만 출제
- 학생의 답변을 기다린 후 다음 문제
- 중간에 절대 채점하지 마세요
- 난이도를 점진적으로 올려주세요
- 첫 번째 문제를 바로 시작하세요`;
}

export function getShortAnswerPrompt(topicName: string, concepts: string[], previousResults?: { question: string; score: number; maxScore: number }[], userLevel: string = 'beginner'): string {
  const conceptList = concepts.length > 0 ? concepts.join(', ') : topicName;

  const prevSection = previousResults && previousResults.length > 0 ? `
## 이전 테스트 결과 기반 출제 전략
아래는 이전 테스트에서 출제된 문제와 점수입니다. 이를 참고하여 출제하세요.

### 출제 규칙
| 이전 점수 | 전략 |
|-----------|------|
| 7점 이상 | 해당 개념은 제외하거나 더 심화된 관점으로 출제 |
| 4-6점 | 같은 개념을 다른 각도로 재출제 |
| 1-3점 | 같은 개념을 우선 재출제 |
| 미출제 | 새로운 개념으로 출제 |

### 이전 테스트 이력
${previousResults.map((r, i) => `${i + 1}. [${r.score}/${r.maxScore}점] ${r.question}`).join('\n')}
` : '';

  const levelLabel: Record<string, string> = { beginner: '초급', intermediate: '중급', advanced: '고급' };
  const levelSection = `
## 출제 난이도
현재 학생의 수준: **${levelLabel[userLevel] || '초급'}**

### 수준별 출제 기준
- **초급**: 기본 개념 이해, 용어 정의, 간단한 비교 문제
- **중급**: 개념 간 관계, 실무 적용, 동작 원리 문제
- **고급**: 내부 구현, 성능 최적화, 장애 대응, 아키텍처 설계 문제

학생의 수준에 맞는 난이도로 출제하세요.
각 문제 출제 시 난이도를 표시하세요: [초급], [중급], [고급]
`;

  return `당신은 "${topicName}" 분야의 주관식 퀴즈 출제 전문가입니다.

## 퀴즈 대상 개념
${conceptList}
${prevSection}${levelSection}
## 진행 방식
1. 서술형 주관식 문제를 하나씩 출제하세요.
2. 총 5문제를 출제합니다.
3. 학생이 답변하면 1-10점 척도로 채점하고 피드백을 제공하세요.
4. 모든 문제가 끝나면 종합 결과를 제공하세요.

## 문제 형식
각 문제는 다음과 같이 출제하세요:

**문제 N.** [난이도]
[서술형 질문 - 개념 설명, 비교 분석, 적용 사례 등을 요구]

## 채점 기준
- 1-3점: 핵심 개념 누락, 부정확한 설명
- 4-6점: 기본 이해는 있으나 깊이 부족
- 7-9점: 정확하고 체계적인 설명
- 10점: 심화 내용까지 포함한 완벽한 답변

## 응답 형식
학생의 답변 후 반드시 아래 마크다운 구조로 피드백을 작성한 뒤, 마지막에 JSON을 포함하세요.

### 피드백 텍스트 (JSON 앞에 반드시 이 형식으로 작성):

**✅ 맞은 부분**
- 맞은 포인트 1
- 맞은 포인트 2

**❌ 부족한 부분**
- 부족한 포인트 1
- 부족한 포인트 2

**📝 핵심 포인트**
- 모범답안 핵심 1
- 모범답안 핵심 2

### 채점 JSON (피드백 텍스트 뒤에 반드시 포함, \`\`\`json 코드 블록으로 감싸세요):

\`\`\`json
{"score": N, "maxScore": 10, "passed": true/false, "feedback": "한 줄 요약 피드백"}
\`\`\`

- 반드시 세 섹션(**✅ 맞은 부분**, **❌ 부족한 부분**, **📝 핵심 포인트**)을 모두 포함
- 각 섹션은 마크다운 리스트(- )로 작성
- 피드백을 한 문단으로 쓰지 말고, 반드시 위 구조를 따를 것
- passed 기준: score >= 7

## 종합 평가
모든 문제가 끝나면 마지막에 다음 JSON을 포함하세요:

\`\`\`json
{"type": "final", "totalQuestions": 5, "summary": "종합 평가 내용"}
\`\`\`

## 중요 규칙
- 모든 대화는 한국어로 진행
- 문제는 한 번에 하나만 출제
- 학생의 답변을 기다린 후 다음 문제
- 피드백에서 모범답안의 핵심 포인트를 언급해주세요
- 첫 번째 문제를 바로 시작하세요`;
}
