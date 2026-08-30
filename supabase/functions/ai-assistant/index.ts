import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt, user_context, mode, chat_history } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Read Gemini API key securely from Supabase Edge Function secrets
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({
          error: 'GEMINI_API_KEY is not set in Supabase Edge Function secrets.',
          fallback_needed: true
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build system instruction with Fintech Platform domain context & user's real numbers
    let userContextStr = 'No real-time user financial data available yet.';
    if (user_context) {
      const p = user_context.personal || {};
      const m = p.metrics || {};
      const port = user_context.portfolio || {};
      const cred = user_context.credit || {};

      userContextStr = `
CURRENT USER FINANCIAL DATA:
- Monthly Net Income: ₹${(m.monthlyNetIncome || 0).toLocaleString('en-IN')}
- Liquid Savings Buffer: ₹${(m.liquidSavings || 0).toLocaleString('en-IN')}
- Emergency Fund: ₹${(m.emergencyFund || 0).toLocaleString('en-IN')} (${m.emergencyCoverageMonths || 0} months coverage)
- Total Monthly Expenses: ₹${(m.totalExpenses || 0).toLocaleString('en-IN')} (Essential: ₹${(m.essentialExpenses || 0).toLocaleString('en-IN')}, Discretionary: ₹${(m.discretionaryExpenses || 0).toLocaleString('en-IN')})
- Monthly Debt Obligations (EMI): ₹${(m.monthlyDebtPayments || 0).toLocaleString('en-IN')}
- Total Outstanding Debt: ₹${(m.totalDebt || 0).toLocaleString('en-IN')}
- Debt-to-Income (DTI) Ratio: ${m.dtiRatio || 0}% (Platform target threshold: ≤36%)
- Savings Rate: ${m.savingsRate || 0}%
- Net Monthly Cash Flow: ₹${(m.netCashFlow || 0).toLocaleString('en-IN')}
- Overall Financial Risk Score: ${p.overallScore || 0}/100 (Level: ${p.overallLevel || 'Low Risk'})
- Portfolio Total Asset Value: ₹${(port.totalValue || 0).toLocaleString('en-IN')}
- Portfolio 1-Day Historical VaR (95%): ${port.metrics?.historicalVaR1DayPct || 0}%
- Portfolio 1-Day CVaR / Expected Shortfall: ${port.metrics?.cvar1DayPct || 0}%
- Credit Score: ${cred.creditScore || 720} (Tier: ${cred.tier || 'Good'}, Estimated Default Probability: ${cred.probDefault || 8}%)
`;
    }

    const systemInstruction = `You are the AI Risk Assistant for the Finance Risk Analytics Platform (built for personal risk analysis, portfolio risk assessment, credit scoring, and what-if stress simulation).
Your role:
1. Explain financial risk concepts clearly and concisely with rigorous fintech terminology (DTI ratio, Value at Risk / VaR, Conditional VaR / Expected Shortfall, Sharpe Ratio, Gaussian Parametric VaR, Monte Carlo Geometric Brownian Motion, Debt Service).
2. When the user asks about their own numbers, risk status, or financial health, ALWAYS ground your answer in their actual loaded data:
${userContextStr}
3. Give actionable, mathematically sound advice (e.g. reducing high-interest debt to improve DTI below 36%, boosting emergency reserves to 6 months, rebalancing volatile assets).
4. Use neat markdown with bullet points and bold highlights for readability.
5. Format currency in Indian Rupees (₹ / Lakhs / Crores) or USD ($) depending on user context.`;

    // Try Gemini 2.5 Flash first, then fallback to Gemini 1.5 Flash if needed
    const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
    let geminiData = null;
    let usedModel = models[0];

    for (const model of models) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;
        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemInstruction}\n\nUser Question: ${prompt}` }]
              }
            ],
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 1000
            }
          })
        });

        if (response.ok) {
          geminiData = await response.json();
          usedModel = model;
          break;
        }
      } catch (e) {
        console.error(`Gemini call error for ${model}:`, e);
      }
    }

    if (!geminiData || !geminiData.candidates || !geminiData.candidates[0]?.content?.parts?.[0]?.text) {
      throw new Error('Gemini API returned an invalid response or rate limit.');
    }

    const replyText = geminiData.candidates[0].content.parts[0].text;

    return new Response(
      JSON.stringify({
        reply: replyText,
        model: usedModel,
        grounded: true,
        status: 'success'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Edge Function Error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal AI service error', fallback_needed: true }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
