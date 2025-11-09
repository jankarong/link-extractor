// Simplified Gemini API client for Chrome extensions
class GeminiAPI {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    }

    async generateContent(prompt, model = 'gemini-2.5-flash', retries = 3) {
        let lastError = null;

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                console.log(`[GeminiAPI] Attempt ${attempt}/${retries} - Calling ${model}`);

                const response = await fetch(`${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: prompt
                            }]
                        }],
                        generationConfig: {
                            temperature: 0.7,
                            topK: 40,
                            topP: 0.95,
                            maxOutputTokens: 1024,
                        },
                        safetySettings: [
                            {
                                category: "HARM_CATEGORY_HARASSMENT",
                                threshold: "BLOCK_ONLY_HIGH"
                            },
                            {
                                category: "HARM_CATEGORY_HATE_SPEECH",
                                threshold: "BLOCK_ONLY_HIGH"
                            },
                            {
                                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                                threshold: "BLOCK_ONLY_HIGH"
                            },
                            {
                                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                                threshold: "BLOCK_ONLY_HIGH"
                            }
                        ]
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    const errorMsg = errorData.error?.message || response.statusText;
                    const statusCode = response.status;

                    lastError = new Error(`API returned ${statusCode}: ${errorMsg}`);
                    console.warn(`[GeminiAPI] Attempt ${attempt} failed:`, {
                        status: statusCode,
                        message: errorMsg,
                        willRetry: attempt < retries
                    });

                    // 只在非身份验证错误时重试
                    if (statusCode === 401 || statusCode === 403) {
                        throw lastError; // 不重试身份验证错误
                    }

                    if (attempt < retries) {
                        // 指数退避：第1次等待1秒，第2次等待2秒
                        const waitTime = Math.pow(2, attempt - 1) * 1000;
                        console.log(`[GeminiAPI] Waiting ${waitTime}ms before retry...`);
                        await new Promise(resolve => setTimeout(resolve, waitTime));
                        continue;
                    }

                    throw lastError;
                }

                const data = await response.json();

                // 检查API是否因安全过滤而拒绝生成内容
                if (!data.candidates || data.candidates.length === 0) {
                    lastError = new Error('API blocked content due to safety filters');
                    console.warn(`[GeminiAPI] Attempt ${attempt} - Content blocked by safety filters`);

                    if (attempt < retries) {
                        const waitTime = Math.pow(2, attempt - 1) * 1000;
                        await new Promise(resolve => setTimeout(resolve, waitTime));
                        continue;
                    }

                    throw lastError;
                }

                const candidate = data.candidates[0];

                // 检查是否有内容
                if (!candidate.content || !candidate.content.parts || !candidate.content.parts[0]) {
                    lastError = new Error('API response missing content');
                    console.warn(`[GeminiAPI] Attempt ${attempt} - Missing content in response`);

                    if (attempt < retries) {
                        const waitTime = Math.pow(2, attempt - 1) * 1000;
                        await new Promise(resolve => setTimeout(resolve, waitTime));
                        continue;
                    }

                    throw lastError;
                }

                const content = candidate.content.parts[0].text;
                console.log(`[GeminiAPI] Success on attempt ${attempt}`);

                return {
                    text: content,
                    raw: data,
                    attempt: attempt
                };

            } catch (error) {
                lastError = error;
                console.error(`[GeminiAPI] Attempt ${attempt} error:`, {
                    message: error.message,
                    stack: error.stack.split('\n')[0]
                });

                if (error.message.includes('401') || error.message.includes('403')) {
                    throw error; // 立即抛出身份验证错误
                }

                if (attempt < retries) {
                    const waitTime = Math.pow(2, attempt - 1) * 1000;
                    console.log(`[GeminiAPI] Waiting ${waitTime}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                } else {
                    throw lastError;
                }
            }
        }

        throw lastError || new Error('All retry attempts failed');
    }

    // 辅助方法：从文本中提取JSON对象
    _extractJSON(text) {
        // 尝试找到完整的JSON对象，正确处理字符串中的括号
        let braceCount = 0;
        let jsonStart = -1;
        let jsonEnd = -1;
        let inString = false;
        let escapeNext = false;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];

            // 处理转义字符
            if (escapeNext) {
                escapeNext = false;
                continue;
            }

            // 处理字符串转义
            if (char === '\\') {
                escapeNext = true;
                continue;
            }

            // 切换字符串状态
            if (char === '"') {
                inString = !inString;
                continue;
            }

            // 只在字符串外统计括号
            if (!inString) {
                if (char === '{') {
                    if (jsonStart === -1) {
                        jsonStart = i;
                    }
                    braceCount++;
                } else if (char === '}') {
                    braceCount--;
                    if (braceCount === 0 && jsonStart !== -1) {
                        jsonEnd = i + 1;
                        break;
                    }
                }
            }
        }

        if (jsonStart !== -1 && jsonEnd !== -1) {
            const extracted = text.substring(jsonStart, jsonEnd);
            console.log('[GeminiAPI] Extracted JSON length:', extracted.length);
            return extracted;
        }

        console.warn('[GeminiAPI] Could not extract valid JSON from response');
        console.warn('[GeminiAPI] Response text (first 300 chars):', text.substring(0, 300));
        return null;
    }

    async analyzeWebsite(websiteContent, url, contentLanguage = 'en') {
        const isEnglish = contentLanguage === 'en';

        const prompt = isEnglish ?
            `Analyze the following website content and extract product information. Please return in standard JSON format only, without any other text:

Website URL: ${url}
Website content: ${websiteContent.substring(0, 4000)}

Please return strictly in the following JSON format:
{
    "productName": "Product name (in English)",
    "website": "Main product/company website URL",
    "tagline": "Product tagline/slogan (concise and impactful, in English)",
    "description": "Product description (within 100 words, suitable for directory submission, in English)",
    "features": "Main product features (3-5 key features, separated by commas, in English)",
    "category": "A single concise category for this product (e.g., Photo Editing, Project Management, AI Tool)",
    "comment": "Brief casual explanation of why this product should be recommended (1-2 sentences, natural tone, in English)",
    "logoUrl": "Complete URL of the website logo (if found)"
}

Requirements:
1. Return JSON only, no other text
2. Information should accurately reflect the main product or service of the website
3. All content should be in English and suitable for international directory submissions
4. Description should be concise and practical for link building
5. Category must be a short, general term (1-3 words), not a sentence
5. Provide the clearest logo URL using absolute URL` :

            `请分析以下网站内容，提取产品信息。请务必以标准JSON格式返回，不要包含任何其他文字或格式：

网站URL: ${url}
网站内容: ${websiteContent.substring(0, 4000)}

请严格按照以下JSON格式返回：
{
    "productName": "产品名称（中文）",
    "website": "主要产品/公司网站URL",
    "tagline": "产品标语/口号（简短有力，中文）",
    "description": "产品描述（100字内，适合外链提交使用，中文）",
    "features": "主要产品功能（3-5个核心功能，用逗号分隔，中文）",
    "category": "产品分类（尽量简短的通用类目，例如：图片处理、项目管理、AI工具）",
    "comment": "简单说明为什么推荐这个产品（1-2句话，语气轻松自然，中文）",
    "logoUrl": "网站logo的完整URL地址（如果能找到）"
}

要求：
1. 只返回JSON，不要任何其他文字
2. 信息要准确反映网站的主要产品或服务
3. 所有内容使用中文，描述要简洁实用
4. 分类必须为简短通用类目（1-4个字），不要句子
4. logoUrl请提供最清晰的logo地址，使用绝对URL`;

        try {
            const result = await this.generateContent(prompt);
            console.log('[GeminiAPI] Raw API response:', result.text.substring(0, 200));

            // 使用改进的JSON提取方法
            const jsonString = this._extractJSON(result.text);
            if (!jsonString) {
                throw new Error('No valid JSON object found in API response');
            }

            console.log('[GeminiAPI] Extracted JSON string:', jsonString.substring(0, 200));

            const analysis = JSON.parse(jsonString);

            // 验证返回的数据结构
            if (typeof analysis === 'object' && analysis !== null) {
                const validatedData = {
                    productName: analysis.productName || '',
                    website: analysis.website || url,
                    tagline: analysis.tagline || '',
                    description: analysis.description || '',
                    features: analysis.features || '',
                    category: analysis.category || '',
                    comment: analysis.comment || '',
                    logoUrl: analysis.logoUrl || ''
                };

                console.log('[GeminiAPI] Analysis completed successfully:', validatedData.productName);
                return validatedData;
            }

            throw new Error('Parsed JSON is not a valid object');

        } catch (error) {
            console.error('[GeminiAPI] Website analysis failed:', {
                message: error.message,
                url: url,
                timestamp: new Date().toISOString(),
                errorStack: error.stack
            });

            // 提供更详细的错误信息，帮助用户理解问题
            let userMessage = error.message;
            if (error.message.includes('No valid JSON object found')) {
                userMessage = 'Gemini API响应格式不正确。这可能是由于：1) API返回了意外内容，2) 网络连接问题，3) API服务异常。请检查您的API Key并重试。';
            } else if (error.message.includes('Parsed JSON is not a valid object')) {
                userMessage = 'API返回的JSON格式无效。请重试或检查网络连接。';
            }

            throw new Error(userMessage);
        }
    }

    async testConnection() {
        try {
            const result = await this.generateContent('Please reply with "Connection successful"');
            return result.text.includes('Connection successful') || result.text.includes('successful');
        } catch (error) {
            throw new Error(`API connection test failed: ${error.message}`);
        }
    }
}

// Export for use by other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GeminiAPI;
} else if (typeof window !== 'undefined') {
    window.GeminiAPI = GeminiAPI;
}