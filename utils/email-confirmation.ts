import { supabase } from '@/lib/supabase';

// Email confirmation API functions
export interface EmailConfirmationData {
  email: string;
  username: string;
  userId: string;
}

export interface ConfirmEmailData {
  email: string;
  code: string;
}

export interface VerifyCodeData {
  email: string;
  code: string;
}

/**
 * Send confirmation email using custom email service
 */
export async function sendConfirmationEmail(data: EmailConfirmationData): Promise<{ success: boolean; error?: string }> {
  try {
    // Generate 6-digit confirmation code
    const confirmationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store confirmation code in database
    console.log('🔍 Updating user with confirmation code:', data.userId);
    const { error: codeError } = await supabase
      .from('users')
      .update({
        confirmation_code: confirmationCode,
        confirmation_code_expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
        email_confirmed: false,
      })
      .eq('id', data.userId);

    console.log('🔍 Code update result:', { codeError, confirmationCode });

    if (codeError) {
      console.error('Error storing confirmation code:', codeError);
      return { success: false, error: 'Failed to create confirmation code' };
    }

    // Call your custom email service with the code
    const response = await fetch('https://desist-server.vercel.app/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: data.email,
        username: data.username,
        confirmationCode: confirmationCode,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || 'Failed to send email' };
    }

    return { success: true };
  } catch (error) {
    console.error('Send confirmation email error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Verify confirmation code and confirm email
 */
export async function verifyConfirmationCode(data: VerifyCodeData): Promise<{ success: boolean; error?: string }> {
  try {
    // Find user by email and verify code
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, confirmation_code, confirmation_code_expires_at, email_confirmed')
      .eq('email', data.email)
      .eq('confirmation_code', data.code)
      .single();

    if (userError || !userData) {
      return { success: false, error: 'Invalid confirmation code' };
    }

    // Check if code is expired
    const now = new Date();
    const expiresAt = new Date(userData.confirmation_code_expires_at);
    
    if (now > expiresAt) {
      return { success: false, error: 'Confirmation code has expired' };
    }

    // Check if already confirmed
    if (userData.email_confirmed) {
      return { success: false, error: 'Email is already confirmed' };
    }

    // Update user's email_confirmed status
    const { error: updateError } = await supabase
      .from('users')
      .update({
        email_confirmed: true,
        confirmation_code: null, // Clear the code after successful verification
        confirmation_code_expires_at: null,
      })
      .eq('id', userData.id);

    if (updateError) {
      console.error('Error updating user confirmation:', updateError);
      return { success: false, error: 'Failed to confirm email' };
    }

    // Note: We don't update Supabase auth user email confirmation here because:
    // 1. The admin API requires server-side service role key
    // 2. Our app logic uses the email_confirmed field in the users table
    // 3. Users can sign in after email confirmation using our custom logic

    return { success: true };
  } catch (error) {
    console.error('Email confirmation error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Resend confirmation email
 */
export async function resendConfirmationEmail(email: string, username: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Find user by email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, email_confirmed')
      .eq('email', email)
      .single();

    if (userError || !userData) {
      return { success: false, error: 'User not found' };
    }

    // Check if user is already confirmed
    if (userData.email_confirmed) {
      return { success: false, error: 'Email is already confirmed' };
    }

    // Generate new 6-digit confirmation code
    const confirmationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Update confirmation code in database
    const { error: codeError } = await supabase
      .from('users')
      .update({
        confirmation_code: confirmationCode,
        confirmation_code_expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
      })
      .eq('id', userData.id);

    if (codeError) {
      console.error('Error updating confirmation code:', codeError);
      return { success: false, error: 'Failed to create confirmation code' };
    }

    // Call your custom email service with the new code
    const response = await fetch('https://desist-server.vercel.app/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        username: username || userData.full_name || email.split('@')[0],
        confirmationCode: confirmationCode,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || 'Failed to send email' };
    }

    return { success: true };
  } catch (error) {
    console.error('Resend confirmation email error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
