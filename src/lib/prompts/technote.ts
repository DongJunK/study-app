import type { LearningSession } from '@/types/session';
import type { TestResult } from '@/types/test';
import type { DiagnosisData } from '@/lib/data/roadmapManager';

export function getTechNoteFromSessionPrompt(session: LearningSession, topicName: string): string {
  // Extract assistant messages as the main learning content
  const contentMessages = session.messages
    .filter((m) => m.role === 'assistant')
    .map((m) => m.content)
    .join('\n\n---\n\n');

  // Truncate if too long (keep under ~8000 chars for prompt)
  const truncated = contentMessages.length > 8000
    ? contentMessages.slice(0, 8000) + '\n\n... (이하 생략)'
    : contentMessages;

  return `당신은 기술 블로그 작성 전문가입니다. 아래 학습 세션 내용을 기반으로 **빠르게 복습할 수 있는 기술 정리 문서**를 마크다운으로 작성하세요.

## 주제: ${topicName}
## 학습 세션 요약: ${session.summary || '없음'}

## 학습 내용:
${truncated}

## 작성 규칙:
1. 핵심 개념을 간결하게 정리 (불필요한 서론 없이 바로 본론)
2. 코드 예시가 있으면 반드시 포함 (실무에서 바로 쓸 수 있는 형태)
3. 빠르게 훑어볼 수 있도록 불릿포인트와 표를 적극 활용
4. 한국어로 작성
5. **절대 다이어그램, ASCII art, 도식을 사용하지 마세요.** 구조나 관계는 반드시 표(table) 또는 불릿포인트 텍스트로 설명하세요.

## 출력 형식:
\`\`\`
# [핵심 주제 제목]

## 핵심 개념
- 불릿포인트로 핵심만

## 상세 설명
(개념별 간결한 설명)

## 코드 예시 (해당하는 경우)
(실제 사용 가능한 코드)

## 핵심 요약
> 한 줄 요약

---
\`\`\`json
{ "title": "문서 제목", "tags": ["태그1", "태그2", "태그3"] }
\`\`\`
\`\`\`

마크다운 문서 마지막에 반드시 위 JSON 블록을 포함하세요. title은 30자 이내, tags는 3~5개로 작성하세요.
마크다운만 출력하세요. 다른 설명은 불필요합니다.`;
}

export function getTechNoteFromDiagnosisPrompt(
  diagnosis: DiagnosisData,
  sessionMessages: string | null,
  topicName: string
): string {
  const levelLabel = diagnosis.level === 'beginner' ? '초급' : diagnosis.level === 'intermediate' ? '중급' : '고급';

  const sessionContent = sessionMessages
    ? `\n## 진단 대화 내용:\n${sessionMessages.length > 8000 ? sessionMessages.slice(0, 8000) + '\n\n... (이하 생략)' : sessionMessages}`
    : '';

  return `당신은 기술 블로그 작성 전문가입니다. 아래 수준진단 결과를 기반으로 **현재 실력을 파악하고 빠르게 복습할 수 있는 기술 정리 문서**를 마크다운으로 작성하세요.

## 주제: ${topicName}
## 진단 수준: ${levelLabel}
## 진단 요약: ${diagnosis.summary}

## 강점:
${diagnosis.strengths.map((s) => '- ' + s).join('\n')}

## 약점:
${diagnosis.weaknesses.map((w) => '- ' + w).join('\n')}
${sessionContent}

## 작성 규칙:
1. 진단에서 파악된 강점과 약점을 중심으로 정리
2. 약점 부분은 보충 설명과 함께 학습 포인트를 제시
3. 강점 부분은 간결하게 핵심만 정리
4. 빠르게 훑어볼 수 있도록 불릿포인트와 표를 적극 활용
5. 한국어로 작성
6. **절대 다이어그램, ASCII art, 도식을 사용하지 마세요.** 구조나 관계는 반드시 표(table) 또는 불릿포인트 텍스트로 설명하세요.

## 출력 형식:
\`\`\`
# [핵심 주제 제목]

## 현재 수준 요약
(진단 결과 핵심 정리)

## 강점 정리
(이미 잘 알고 있는 부분)

## 보완이 필요한 부분
(약점별 핵심 개념 + 보충 설명)

## 코드 예시 (해당하는 경우)
(실제 사용 가능한 코드)

## 학습 로드맵
(다음에 집중할 부분)

## 핵심 요약
> 한 줄 요약

---
\`\`\`json
{ "title": "문서 제목", "tags": ["태그1", "태그2", "태그3"] }
\`\`\`
\`\`\`

마크다운 끝에 반드시 위 JSON 블록을 포함하세요. title은 30자 이내, tags는 3~5개.
마크다운만 출력하세요.`;
}

export function getTechNoteFromTestPrompt(test: TestResult, topicName: string): string {
  const questionsContent = test.answers
    .map((a, i) => {
      return `### 문제 ${i + 1} (${a.passed ? '정답' : '오답'}, ${a.score}/${a.maxScore}점)
**질문:** ${a.question}
**내 답변:** ${a.userAnswer}
**모범 답변:** ${a.modelAnswer}
**피드백:** ${a.feedback}`;
    })
    .join('\n\n');

  // Truncate if too long
  const truncated = questionsContent.length > 8000
    ? questionsContent.slice(0, 8000) + '\n\n... (이하 생략)'
    : questionsContent;

  const typeLabel = test.type === 'multiple-choice' ? '객관식' : test.type === 'short-answer' ? '주관식' : '심화학습';

  return `당신은 기술 블로그 작성 전문가입니다. 아래 테스트 결과를 기반으로 **빠르게 복습할 수 있는 기술 정리 문서**를 마크다운으로 작성하세요.

## 주제: ${topicName}
## 테스트 유형: ${typeLabel}
## 점수: ${test.totalScore}/${test.maxTotalScore}점

## 테스트 내용:
${truncated}

## 작성 규칙:
1. 테스트에서 다룬 개념들을 체계적으로 정리
2. 특히 틀린 문제의 개념은 더 자세히 설명
3. 코드 예시가 있으면 반드시 포함
4. 빠르게 훑어볼 수 있도록 불릿포인트와 표를 적극 활용
5. 한국어로 작성
6. **절대 다이어그램, ASCII art, 도식을 사용하지 마세요.** 구조나 관계는 반드시 표(table) 또는 불릿포인트 텍스트로 설명하세요.

## 출력 형식:
\`\`\`
# [핵심 주제 제목]

## 핵심 개념
- 불릿포인트로 핵심만

## 상세 설명
(개념별 간결한 설명, 틀린 부분 강조)

## 코드 예시 (해당하는 경우)
(실제 사용 가능한 코드)

## 주의할 점
(틀리기 쉬운 부분, 오개념 정리)

## 핵심 요약
> 한 줄 요약

---
\`\`\`json
{ "title": "문서 제목", "tags": ["태그1", "태그2", "태그3"] }
\`\`\`
\`\`\`

마크다운 문서 마지막에 반드시 위 JSON 블록을 포함하세요. title은 30자 이내, tags는 3~5개로 작성하세요.
마크다운만 출력하세요. 다른 설명은 불필요합니다.`;
}
