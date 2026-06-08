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
  return `あなたはボードゲームのルール専門家です。
以下のルールを読んで、簡潔にフィードバックしてください。

ゲーム名：${rules.gameTitle || '未設定'}
人数：${rules.players?.min}〜${rules.players?.max}人
時間：${rules.duration || '未設定'}
テーマ：${rules.theme || '未設定'}

【勝利条件】
${formatFactions(rules.factions)}

【ゲームの流れ】
${formatPhases(rules.phases)}

【特殊ルール】
${formatSpecialRules(rules.specialRules)}

以下のJSON形式のみで返してください。説明文は不要です。

{
  "overall": "全体評価を1文で",
  "issues": [
    {
      "type": "error|warning|suggestion",
      "title": "10文字以内のタイトル",
      "fix": "改善策を1文で"
    }
  ],
  "strengths": ["良い点を1文で（最大2つ）"],
  "missing": ["不足している要素（最大3つ）"]
}

issuesは最大5件。最も重要な問題だけ挙げてください。`
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
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
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
    throw new Error('parse_failed')
  }
}
