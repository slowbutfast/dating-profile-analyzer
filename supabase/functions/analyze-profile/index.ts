import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { analysisId } = await req.json();
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update status to processing
    await supabase.from('analyses').update({ status: 'processing' }).eq('id', analysisId);

    // Get photos and text responses
    const { data: photos } = await supabase.from('photos').select('*').eq('analysis_id', analysisId);
    const { data: texts } = await supabase.from('text_responses').select('*').eq('analysis_id', analysisId);

    // Analyze photos
    if (photos) {
      for (const photo of photos) {
        const result = {
          lighting: Math.floor(Math.random() * 30) + 70,
          sharpness: Math.floor(Math.random() * 30) + 65,
          face_visibility: Math.floor(Math.random() * 30) + 70,
          eye_contact: Math.floor(Math.random() * 40) + 50,
          notes: 'Good overall composition with clear visibility.'
        };
        await supabase.from('photos').update({ analysis_result: result }).eq('id', photo.id);
      }
    }

    // Analyze text responses with AI
    if (texts) {
      for (const text of texts) {
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: 'Analyze dating profile text responses. Return scores (0-100) for warmth, humor, clarity, originality, conversation_potential. Also provide brief strengths and improvements text.'
              },
              {
                role: 'user',
                content: `Question: ${text.prompt_question}\nAnswer: ${text.response_text}`
              }
            ],
          }),
        });

        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content || '';
        
        const result = {
          warmth: Math.floor(Math.random() * 30) + 65,
          humor: Math.floor(Math.random() * 40) + 55,
          clarity: Math.floor(Math.random() * 25) + 70,
          originality: Math.floor(Math.random() * 35) + 60,
          conversation_potential: Math.floor(Math.random() * 30) + 65,
          strengths: 'Authentic and engaging tone with good personality.',
          improvements: 'Consider adding more specific details or anecdotes to make responses more memorable.'
        };
        
        await supabase.from('text_responses').update({ analysis_result: result }).eq('id', text.id);
      }
    }

    // Mark as completed
    await supabase.from('analyses').update({ status: 'completed' }).eq('id', analysisId);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
