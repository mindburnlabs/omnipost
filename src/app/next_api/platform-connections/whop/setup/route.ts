

import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, validateRequestBody } from "@/lib/api-utils";
import CrudOperations from '@/lib/crud-operations';

// POST request - setup Whop connection
export const POST = requestMiddleware(async (request, context) => {
  try {
    const body = await validateRequestBody(request);
    const { connection_name } = body;
    
    const apiKey = process.env.WHOP_API_KEY;
    const companyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID;
    const appId = process.env.NEXT_PUBLIC_WHOP_APP_ID;
    
    if (!apiKey || !companyId || !appId) {
      return createErrorResponse({
        errorMessage: "Whop API credentials not configured",
        status: 500,
      });
    }

    const connectionsCrud = new CrudOperations("platform_connections", context.token);
    const user_id = context.payload?.sub;
    
    // Test the Whop API connection
    try {
      const testResponse = await fetch(`https://api.whop.com/api/v2/companies/${companyId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!testResponse.ok) {
        const errorText = await testResponse.text();
        throw new Error(`Whop API error: ${testResponse.status} ${testResponse.statusText} - ${errorText}`);
      }

      const companyData = await testResponse.json();
      
      const connectionData = {
        user_id,
        platform_type: 'whop',
        connection_name: connection_name || `Whop - ${companyData.name || 'Company'}`,
        api_credentials: {
          company_id: companyId,
          app_id: appId,
          company_name: companyData.name,
          api_key: 'configured' // Don't store the actual key
        },
        connection_status: 'active',
        last_sync_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const connection = await connectionsCrud.create(connectionData);
      
      return createSuccessResponse({
        message: 'Whop connection created successfully',
        connection: {
          id: connection.id,
          platform_type: connection.platform_type,
          connection_name: connection.connection_name,
          connection_status: connection.connection_status,
          company_name: companyData.name
        }
      });
    } catch (error) {
      return createErrorResponse({
        errorMessage: `Failed to test Whop connection: ${error instanceof Error ? error.message : 'Unknown error'}`,
        status: 400,
      });
    }
  } catch (error) {
    console.error('Failed to create Whop connection:', error);
    return createErrorResponse({
      errorMessage: "Failed to create Whop connection",
      status: 500,
    });
  }
}, true);

