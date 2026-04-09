const supabase = require('../config/supabase');

/**
 * Log a call summary into the conversations table.
 * @param {object} params
 */
async function logCallSummary({ call_id, phone, summary, organization_id, duration_seconds }) {
  // Try to find patient by phone if provided
  let patientId = null;

  if (phone) {
    const { data: patient } = await supabase
      .from('patients')
      .select('id')
      .eq('phone', phone)
      .limit(1)
      .single();

    if (patient) {
      patientId = patient.id;
    }
  }

  // Insert conversation log
  const { data: conversation, error } = await supabase
    .from('conversations')
    .insert({
      call_id: call_id || null,
      patient_id: patientId,
      organization_id: organization_id || null,
      summary: summary,
      duration_seconds: duration_seconds || null,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error || !conversation) {
    throw new Error('Failed to log call summary.');
  }

  return {
    conversation_id: conversation.id,
    call_id: conversation.call_id,
    summary: conversation.summary,
    message: 'Call summary logged successfully.',
  };
}

module.exports = { logCallSummary };