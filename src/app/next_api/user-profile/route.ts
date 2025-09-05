
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, validateRequestBody } from "@/lib/api-utils";

// GET request - fetch user profile
export const GET = requestMiddleware(async (request, context) => {
  try {
    const profilesCrud = new CrudOperations("user_profiles", context.token);
    const user_id = context.payload?.sub;
    
    const profiles = await profilesCrud.findMany({ user_id });
    let profile = profiles?.[0];
    
    // If no profile exists, create a default one
    if (!profile) {
      const defaultProfile = {
        user_id,
        display_name: '',
        timezone: 'UTC',
        preferred_language: 'en',
        notification_preferences: {
          push: true,
          email: true,
          schedule_reminders: true
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      profile = await profilesCrud.create(defaultProfile);
    }
    
    return createSuccessResponse(profile);
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    return createErrorResponse({
      errorMessage: "Failed to fetch user profile",
      status: 500,
    });
  }
}, true);

// PUT request - update user profile
export const PUT = requestMiddleware(async (request, context) => {
  try {
    const body = await validateRequestBody(request);
    const profilesCrud = new CrudOperations("user_profiles", context.token);
    const user_id = context.payload?.sub;
    
    const profiles = await profilesCrud.findMany({ user_id });
    let profile = profiles?.[0];
    
    const updateData = {
      ...body,
      updated_at: new Date().toISOString()
    };
    
    if (profile) {
      // Update existing profile
      const data = await profilesCrud.update(profile.id, updateData);
      return createSuccessResponse(data);
    } else {
      // Create new profile
      const profileData = {
        ...updateData,
        user_id,
        created_at: new Date().toISOString()
      };
      const data = await profilesCrud.create(profileData);
      return createSuccessResponse(data, 201);
    }
  } catch (error) {
    console.error('Failed to update user profile:', error);
    return createErrorResponse({
      errorMessage: "Failed to update user profile",
      status: 500,
    });
  }
}, true);
