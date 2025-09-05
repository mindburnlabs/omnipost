import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { validateRequestBody } from '@/lib/api-utils';
import CrudOperations from '@/lib/crud-operations';
import { generateToken, generateAdminUserToken } from '@/lib/auth';

// POST request - authenticate Whop user
export const POST = async (request: NextRequest) => {
  try {
    const body = await validateRequestBody(request);
    const { whop_user, company_id, app_id, access_granted } = body;

    if (!whop_user?.id || !whop_user?.email) {
      return createErrorResponse({
        errorMessage: "Invalid Whop user data",
        status: 400,
      });
    }

    // Use service role key to manage users
    const usersCrud = new CrudOperations("users"); // Use service role key only
    const activitiesCrud = new CrudOperations("user_activities");

    try {
      // Find existing user by Whop ID or email
      let existingUsers = await usersCrud.findMany({ 
        email: whop_user.email 
      });
      
      let user = existingUsers[0];
      
      if (!user) {
        // Create new user for Whop
        const userData = {
          email: whop_user.email,
          password: 'WHOP_USER', // Whop users don't need passwords
          role: 'app20250904195901yvsuhcayno_v1_user',
          profile: {
            username: whop_user.username || whop_user.email.split('@')[0],
            whop_user_id: whop_user.id,
            whop_company_id: company_id,
            whop_app_id: app_id,
            access_level: access_granted ? 'full' : 'limited',
            source: 'whop'
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        user = await usersCrud.create(userData);
        
        // Log user creation activity
        await activitiesCrud.create({
          user_id: user.id,
          activity_type: 'user_created',
          activity_description: 'User created from Whop authentication',
          metadata: {
            whop_user_id: whop_user.id,
            company_id,
            app_id,
            access_granted
          },
          created_at: new Date().toISOString()
        });
      } else {
        // Update existing user with latest Whop context
        const updatedProfile = {
          ...user.profile,
          whop_user_id: whop_user.id,
          whop_company_id: company_id,
          whop_app_id: app_id,
          access_level: access_granted ? 'full' : 'limited',
          last_whop_login: new Date().toISOString()
        };

        await usersCrud.update(user.id, {
          profile: updatedProfile,
          updated_at: new Date().toISOString()
        });

        // Log login activity
        await activitiesCrud.create({
          user_id: user.id,
          activity_type: 'whop_login',
          activity_description: 'User authenticated via Whop',
          metadata: {
            whop_user_id: whop_user.id,
            company_id,
            app_id,
            access_granted,
            previous_access_level: user.profile?.access_level
          },
          created_at: new Date().toISOString()
        });
      }

      // Generate session token for the user
      const sessionToken = await generateToken({ sub: user.id.toString(), email: user.email, role: user.role });
      
      return createSuccessResponse({
        message: 'Whop authentication successful',
        user: {
          id: user.id,
          email: user.email,
          profile: user.profile,
          access_granted,
          whop_context: {
            user_id: whop_user.id,
            company_id,
            app_id,
            access_level: access_granted ? 'full' : 'limited'
          }
        },
        token: sessionToken
      });

    } catch (dbError) {
      console.error('Database error during Whop auth:', dbError);
      return createErrorResponse({
        errorMessage: "Failed to create or update user session",
        status: 500,
      });
    }

  } catch (error) {
    console.error('Whop authentication failed:', error);
    return createErrorResponse({
      errorMessage: "Whop authentication failed",
      status: 500,
    });
  }
};

// GET request - verify Whop session
export const GET = async (request: NextRequest) => {
  try {
    const url = new URL(request.url);
    const whopUserId = url.searchParams.get('whop_user_id');
    const companyId = url.searchParams.get('company_id');

    if (!whopUserId) {
      return createErrorResponse({
        errorMessage: "Missing Whop user ID",
        status: 400,
      });
    }

    const usersCrud = new CrudOperations("users"); // Use service role key only

    // Find user by Whop user ID
    const users = await usersCrud.findMany({});
    const user = users.find(u => u.profile?.whop_user_id === whopUserId);

    if (!user) {
      return createErrorResponse({
        errorMessage: "Whop user not found",
        status: 404,
      });
    }

    return createSuccessResponse({
      message: 'Whop session verified',
      user: {
        id: user.id,
        email: user.email,
        profile: user.profile,
        access_level: user.profile?.access_level || 'limited'
      }
    });

  } catch (error) {
    console.error('Whop session verification failed:', error);
    return createErrorResponse({
      errorMessage: "Session verification failed",
      status: 500,
    });
  }
};
