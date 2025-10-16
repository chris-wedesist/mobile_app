import { supabase } from '@/lib/supabase';

/**
 * Test if the users table has the required fields for email confirmation
 */
export async function testUsersTableSchema(): Promise<{ success: boolean; error?: string; fields?: string[] }> {
  try {
    console.log('🔍 Testing users table schema...');
    
    // Try to select the required fields
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, username, email_confirmed, confirmation_code, confirmation_code_expires_at')
      .limit(1);

    if (error) {
      console.error('❌ Users table schema test failed:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Users table schema test passed');
    return { 
      success: true, 
      fields: ['id', 'email', 'full_name', 'username', 'email_confirmed', 'confirmation_code', 'confirmation_code_expires_at']
    };
  } catch (error) {
    console.error('❌ Users table schema test exception:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Test if we can create a user profile
 */
export async function testUserProfileCreation(userId: string, email: string, fullName: string, username: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🔍 Testing user profile creation...');
    
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email: email,
        full_name: fullName,
        username: username,
        created_at: new Date().toISOString(),
        email_confirmed: false,
      }, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ User profile creation test failed:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ User profile creation test passed');
    return { success: true };
  } catch (error) {
    console.error('❌ User profile creation test exception:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
