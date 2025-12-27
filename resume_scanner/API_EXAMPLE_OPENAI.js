/**
 * Gemini API – Resume Analysis
 * Replaces OpenAI completely
 */
// WARNING: Storing API keys in source files is insecure. Do not commit
// this key to version control. Prefer `chrome.storage.local` or an
// options page in production.
const GEMINI_API_KEY = 'AIzaSyA-0wtLOU3Drg7FBegvsqtVQKXW7YfHBks';

async function analyzeResume(jobDescription, resumeText) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'PUT_YOUR_GEMINI_API_KEY_HERE') {
    throw new Error('Gemini API key not configured. Please set GEMINI_API_KEY at the top of API_EXAMPLE_OPENAI.js');
  }

  let API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  // Try to detect a working model+method endpoint. This will attempt the
  // configured endpoint first, then call ListModels and try common methods
  // (`generateContent`, `generateText`, `generate`) on available models.
  async function detectWorkingEndpoint(apiKey, payload) {
    async function tryEndpoint(url) {
      try {
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        return resp;
      } catch (e) {
        return { ok: false, status: 0, _error: e };
      }
    }

    // First try the existing endpoint
    let resp = await tryEndpoint(API_ENDPOINT);
    if (resp && resp.ok) return API_ENDPOINT;

    // If the initial endpoint returned 404 or failed, list available models
    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    let listResp;
    try {
      listResp = await fetch(listUrl);
    } catch (e) {
      throw new Error(`Failed to call ListModels: ${e.message}`);
    }

    if (!listResp.ok) {
      const txt = await listResp.text().catch(() => '');
      throw new Error(`ListModels failed (${listResp.status}): ${txt}`);
    }

    const listData = await listResp.json();
    const models = (listData.models || []).map(m => m.name).filter(Boolean);

    // Prefer models that contain 'gemini'
    models.sort((a, b) => (a.includes('gemini') === b.includes('gemini') ? 0 : a.includes('gemini') ? -1 : 1));

    const methods = ['generateContent', 'generateText', 'generate'];
    let lastErrorText = null;

    for (const model of models) {
      for (const method of methods) {
        const url = `https://generativelanguage.googleapis.com/v1beta/${model}:${method}?key=${apiKey}`;
        resp = await tryEndpoint(url);
        if (resp && resp.ok) return url;
        try {
          lastErrorText = await (resp.text ? resp.text() : Promise.resolve(String(resp._error || '')));
        } catch (e) {
          lastErrorText = String(resp._error || e.message || 'unknown');
        }
        // continue trying other combinations
      }
    }

    throw new Error(`No compatible model/method found. Last error: ${lastErrorText}`);
  }

  if (!jobDescription || !jobDescription.trim()) {
    throw new Error('Job description is required');
  }

  if (!resumeText || !resumeText.trim()) {
    throw new Error('Resume text is required');
  }

  const prompt = `
You are an expert resume analyzer.

Analyze the resume against the job description and return ONLY valid JSON.

JOB DESCRIPTION:
${jobDescription.trim()}

RESUME:
${resumeText.trim()}

Return JSON in this exact format:
{
  "match_percentage": number between 0-100,
  "matched_skills": ["skill1", "skill2"],
  "missing_skills": ["skill3", "skill4"],
  "suggestions": "Specific, actionable suggestions"
}
`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ]
  };

  // Detect a working endpoint (may throw) and set API_ENDPOINT
  try {
    API_ENDPOINT = await detectWorkingEndpoint(GEMINI_API_KEY, payload);
  } catch (err) {
    throw new Error(`Gemini endpoint detection failed: ${err.message}`);
  }

  let response;
  try {
    response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    throw new Error(`Network error: ${err.message}`);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  const content =
    data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!content) {
    throw new Error('No content in Gemini response');
  }

  let analysis;
  try {
    analysis = JSON.parse(content);
  } catch {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      analysis = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('Could not parse JSON from Gemini response');
    }
  }

  return {
    matchPercentage: Math.max(
      0,
      Math.min(100, Number(analysis.match_percentage) || 0)
    ),
    matchedSkills: Array.isArray(analysis.matched_skills)
      ? analysis.matched_skills
      : [],
    missingSkills: Array.isArray(analysis.missing_skills)
      ? analysis.missing_skills
      : [],
    suggestions: analysis.suggestions || 'No suggestions available.'
  };
}
