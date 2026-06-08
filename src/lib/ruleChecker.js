function formatFactions(factions) {
  if (!factions || factions.length === 0) return '未設定'
  return factions
    .filter((f) => f.name || f.winCondition)
    .map((f) => `- ${f.name || '名前なし'}：${f.winCondition || '勝利条件なし'}`)
    .join('\n') || '未設定'
}

function formatPhases(phases) {
  if (!phases || phases.length === 0) return '未設定'
  return phases
    .filter((p) => p.name || p.content)
    .map((p, i) => `${i + 1}. ${p.name || '名前なし'}\n   内容：${p.content || '未記入'}\n   終了条件：${p.endCondition || 'なし'}`)
    .join('\n') || '未設定'
}

function formatSpecialRules(specialRules) {
  if (!specialRules || specialRules.length === 0) return 'なし'
  return specialRules
    .filter((r) => r.title || r.description)
    .map((r) => `- ${r.title || 'タイトルなし'}：${r.description || '説明なし'}`)
    .join('\n') || 'なし'
}

function buildPrompt(rules) {
  return `あなたはボードゲームのルールデザインの専門家です。
以下のボードゲームのルールを読んで、フィードバックをしてください。

ゲーム名：${rules.gameTitle || '未設定'}
プレイ人数：${rules.players?.min || '?'}〜${rules.players?.max || '?'}人
プレイ時間：${rules.duration || '未設定'}
テーマ：${rules.theme || '未設定'}

【勝利条件】
${formatFactions(rules.factions)}

【ゲームの流れ】
${formatPhases(rules.phases)}

【特殊ルール】
${formatSpecialRules(rules.specialRules)}

以下の観点でフィードバックしてください。
必ずJSON形式で返してください。他のテキストは不要です。

{
  "overall": "全体的な印象を2〜3文で（ポジティブな点から始める）",
  "issues": [
    {
      "type": "error|warning|suggestion",
      "title": "問題のタイトル",
      "description": "具体的な説明",
      "suggestion": "改善案"
    }
  ],
  "strengths": ["良い点1", "良い点2"],
  "missing": ["未記入で必要な項目1", "未記入で必要な項目2"]
}

typeの意味：
- error: ゲームが成立しない致命的な問題
- warning: プレイヤーが混乱しそうな曖昧な点
- suggestion: あると面白くなる改善提案`
}

export async function checkRules(rulesData) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey || apiKey === 'your_api_key_here') {
    throw new Error('VITE_ANTHROPIC_API_KEY が設定されていません。.env.local にAPIキーを設定してください。')
  }

  const prompt = buildPrompt(rulesData)

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`API Error (${response.status}): ${err}`)
  }

  const data = await response.json()
  const text = data.content[0].text

  // Parse JSON from response (handle markdown code blocks)
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/)
  const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text

  try {
    return JSON.parse(jsonStr)
  } catch {
    return {
      overall: text,
      issues: [],
      strengths: [],
      missing: [],
    }
  }
}
