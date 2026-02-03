import { net } from 'electron'
import { getSettings } from './settingsService'

interface AiResponse {
  success: boolean
  content?: string
  error?: string
}

export async function getAiExplanation(
  question: string,
  answer: string,
  onStream?: (chunk: string) => void
): Promise<AiResponse> {
  const settings = getSettings()
  const { baseUrl, apiKey, model } = settings.aiConfig

  if (!apiKey) {
    return {
      success: false,
      error: 'API密钥缺失，请在设置中配置。',
    }
  }

  const prompt = `请详细解析以下题目：

**题目：**
${question}

**正确答案：**
${answer}

**解析要求：**
请按照以下结构提供详细的中文解析：

## 📝 正确答案
简要说明正确答案及其关键要点

## 🎯 核心知识点
说明本题考查的核心知识点和概念

## 💡 详细解析
1. **答案推理过程**：详细解释为什么选择这个答案，包括逻辑推理步骤
2. **关键依据**：列出支持该答案的关键依据和证据
3. **思路分析**：说明解题的思路和方法

## 📚 相关知识拓展
补充相关的背景知识、注意事项或易混淆点

## ⚠️ 常见误区
如有必要，说明其他常见错误选项及其错误原因

请使用清晰的Markdown格式，包括标题、列表、加粗等，让解析结构分明、易于理解。`

  return new Promise((resolve) => {
    try {
      // Clean up base URL to ensure no double slashes or missing protocol
      let url = baseUrl
      if (!url.startsWith('http')) {
        url = `https://${url}`
      }
      if (url.endsWith('/')) {
        url = url.slice(0, -1)
      }
      
      // OpenAI compatible chat completions endpoint
      const endpoint = `${url}/chat/completions`

      const request = net.request({
        method: 'POST',
        url: endpoint,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
      })

      const useStream = !!onStream
      const body = JSON.stringify({
        model: model,
        messages: [
          { 
            role: 'system', 
            content: `你是一位资深的专业题目解析助手，具有以下特点：

**角色定位：**
- 深厚的学科知识背景
- 善于用通俗易懂的语言解释复杂概念
- 注重培养学生的解题思维和方法

**解析风格：**
- 使用中文进行所有解析
- 结构清晰、层次分明
- 善用Markdown格式增强可读性
- 注重知识点的系统性和关联性
- 既讲"是什么"，也讲"为什么"

**解析原则：**
1. 准确性：确保知识点准确无误
2. 全面性：涵盖核心知识和拓展内容
3. 易懂性：使用简洁明了的语言
4. 实用性：注重解题方法和技巧
5. 启发性：培养独立思考能力

请严格遵循用户要求的解析结构，提供高质量的中文解析内容。` 
          },
          { role: 'user', content: prompt },
        ],
        stream: useStream,
      })

      request.write(body)

      request.on('response', (response) => {
        let data = ''
        let fullContent = ''

        response.on('data', (chunk) => {
          const chunkStr = chunk.toString()
          
          if (useStream) {
            // Handle SSE stream format
            const lines = chunkStr.split('\n')
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const jsonStr = line.slice(6).trim()
                if (jsonStr === '[DONE]') continue
                
                try {
                  const parsed = JSON.parse(jsonStr)
                  const content = parsed.choices?.[0]?.delta?.content
                  if (content) {
                    fullContent += content
                    onStream?.(content)
                  }
                } catch (e) {
                  // Skip invalid JSON chunks
                }
              }
            }
          } else {
            data += chunkStr
          }
        })

        response.on('end', () => {
          if (response.statusCode >= 200 && response.statusCode < 300) {
            try {
              if (useStream) {
                resolve({
                  success: true,
                  content: fullContent || '未生成解析内容。',
                })
              } else {
                const parsed = JSON.parse(data)
                const content = parsed.choices?.[0]?.message?.content
                resolve({
                  success: true,
                  content: content || '未生成解析内容。',
                })
              }
            } catch (e) {
              resolve({
                success: false,
                error: '解析API响应失败。',
              })
            }
          } else {
            resolve({
              success: false,
              error: `API请求失败，状态码 ${response.statusCode}: ${data}`,
            })
          }
        })
      })

      request.on('error', (error) => {
        resolve({
          success: false,
          error: `网络错误: ${error.message}`,
        })
      })

      request.end()
    } catch (error) {
      resolve({
        success: false,
        error: `请求失败: ${error instanceof Error ? error.message : String(error)}`,
      })
    }
  })
}
