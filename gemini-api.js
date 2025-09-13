// Simplified Gemini API client for Chrome extensions
class GeminiAPI {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    }

    async generateContent(prompt, model = 'gemini-1.5-flash') {
        try {
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
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_HATE_SPEECH",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        }
                    ]
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`API request failed: ${response.status} - ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();

            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                throw new Error('API returned invalid data format');
            }

            const content = data.candidates[0].content.parts[0].text;
            return {
                text: content,
                raw: data
            };

        } catch (error) {
            console.error('Gemini API call failed:', error);
            throw error;
        }
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

            // Try to parse JSON
            const jsonMatch = result.text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const analysis = JSON.parse(jsonMatch[0]);

                // Validate returned data structure
                if (typeof analysis === 'object' && analysis !== null) {
                    return {
                        productName: analysis.productName || '',
                        website: analysis.website || url, // If AI doesn't return, use input URL
                        tagline: analysis.tagline || '',
                        description: analysis.description || '',
                        features: analysis.features || '',
                        category: analysis.category || '',
                        comment: analysis.comment || '',
                        logoUrl: analysis.logoUrl || ''
                    };
                }
            }

            throw new Error('AI returned invalid data format');

        } catch (error) {
            console.error('Website analysis failed:', error);
            throw new Error(`Website analysis failed: ${error.message}`);
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