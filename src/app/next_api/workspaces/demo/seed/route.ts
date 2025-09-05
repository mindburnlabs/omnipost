
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware } from "@/lib/api-utils";

// POST request - seed demo workspace with sample data
export const POST = requestMiddleware(async (request, context) => {
  try {
    const user_id = context.payload?.sub;
    
    if (!user_id) {
      return createErrorResponse({
        errorMessage: "User ID is required",
        status: 400,
      });
    }

    // Initialize CRUD operations
    const workspacesCrud = new CrudOperations("workspaces", context.token);
    const postsCrud = new CrudOperations("posts", context.token);
    const connectionsCrud = new CrudOperations("platform_connections", context.token);
    const contentTemplatesCrud = new CrudOperations("content_templates", context.token);
    const activitiesCrud = new CrudOperations("user_activities", context.token);

    // Create or find sandbox workspace
    let sandboxWorkspace;
    const existingSandbox = await workspacesCrud.findMany({ 
      user_id, 
      slug: 'sandbox' 
    });

    if (existingSandbox.length > 0) {
      sandboxWorkspace = existingSandbox[0];
    } else {
      sandboxWorkspace = await workspacesCrud.create({
        user_id,
        name: 'Sandbox Workspace',
        slug: 'sandbox',
        description: 'Safe sandbox environment for testing OmniPost features',
        is_demo: true,
        whop_experience_id: 'exp_sandbox',
        settings: {
          sandbox_mode: true,
          sandbox_publishing: true
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    // Create sandbox platform connections
    const sandboxConnections = [
      {
        user_id,
        platform_type: 'discord',
        connection_name: 'Sandbox Discord Server',
        api_credentials: {
          webhook_url: 'https://discord.com/api/webhooks/sandbox/webhook',
          server_name: 'Sandbox Server',
          sandbox: true
        },
        connection_status: 'active',
        last_sync_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        user_id,
        platform_type: 'telegram',
        connection_name: 'Sandbox Telegram Channel',
        api_credentials: {
          chat_id: '@sandbox_channel',
          chat_type: 'channel',
          sandbox: true
        },
        connection_status: 'active',
        last_sync_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        user_id,
        platform_type: 'whop',
        connection_name: 'Sandbox Whop Community',
        api_credentials: {
          company_id: 'sandbox_company_id',
          app_id: 'sandbox_app_id',
          sandbox: true
        },
        connection_status: 'active',
        last_sync_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ];

    const createdConnections = [];
    for (const connectionData of sandboxConnections) {
      const connection = await connectionsCrud.create(connectionData);
      createdConnections.push(connection);
    }

    // Create sandbox posts
    const sandboxPosts = [
      {
        user_id,
        title: "Welcome to OmniPost Sandbox",
        content: "🎉 Welcome to OmniPost! This is a sandbox post to show you how the platform works. You can edit, schedule, or delete this post safely.",
        content_type: 'text',
        status: 'draft',
        metadata: { 
          sandbox: true,
          platforms: createdConnections.map(c => c.id)
        },
        tags: ['welcome', 'sandbox', 'getting-started'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        user_id,
        title: "Sample Scheduled Post",
        content: "📅 This is an example of a scheduled post. In the real app, this would be published to your connected platforms at the scheduled time.",
        content_type: 'text',
        status: 'scheduled',
        scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        metadata: { 
          sandbox: true,
          platforms: [createdConnections[0].id, createdConnections[1].id]
        },
        tags: ['sandbox', 'scheduled', 'example'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        user_id,
        title: "Published Sandbox Post",
        content: "✅ This post represents a successfully published post. In sandbox mode, no actual publishing occurs - it's all simulated safely.",
        content_type: 'text',
        status: 'published',
        published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        metadata: { 
          sandbox: true,
          platforms: createdConnections.map(c => c.id)
        },
        tags: ['sandbox', 'published', 'success'],
        created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      }
    ];

    const createdPosts = [];
    for (const postData of sandboxPosts) {
      const post = await postsCrud.create(postData);
      createdPosts.push(post);
    }

    // Create sandbox templates
    const sandboxTemplates = [
      {
        user_id,
        name: "Weekly Update Template",
        description: "Template for weekly team updates",
        template_content: "🗓️ **Weekly Update - [Week of DATE]**\n\n📈 **This Week's Highlights:**\n• [Achievement 1]\n• [Achievement 2]\n• [Achievement 3]\n\n🎯 **Next Week's Focus:**\n• [Goal 1]\n• [Goal 2]\n\n💬 Questions? Drop them below! 👇",
        template_type: "update",
        platform_specific: { sandbox: true },
        usage_count: 0,
        is_favorite: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        user_id,
        name: "Product Announcement",
        description: "Template for product launches and announcements",
        template_content: "🚀 **Exciting News!**\n\nWe're thrilled to announce [PRODUCT NAME] - [BRIEF DESCRIPTION]\n\n✨ **Key Features:**\n• [Feature 1]\n• [Feature 2]\n• [Feature 3]\n\n🎉 **Special Launch Offer:** [OFFER DETAILS]\n\n👉 Get started: [LINK]\n\n#ProductLaunch #Innovation",
        template_type: "announcement",
        platform_specific: { sandbox: true },
        usage_count: 0,
        is_favorite: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ];

    const createdTemplates = [];
    for (const templateData of sandboxTemplates) {
      const contentTemplate = await contentTemplatesCrud.create(templateData);
      createdTemplates.push(contentTemplate);
    }

    // Log seeding activity
    await activitiesCrud.create({
      user_id,
      activity_type: 'workspace_seeded',
      activity_description: 'Sandbox workspace seeded with sample data',
      metadata: {
        sandbox: true,
        seed_timestamp: new Date().toISOString(),
        created_items: {
          workspace: 1,
          connections: createdConnections.length,
          posts: createdPosts.length,
          templates: createdTemplates.length
        }
      },
      created_at: new Date().toISOString()
    });

    return createSuccessResponse({
      message: 'Sandbox workspace seeded successfully',
      workspace: {
        id: sandboxWorkspace.id,
        name: sandboxWorkspace.name,
        slug: sandboxWorkspace.slug
      },
      created_items: {
        connections: createdConnections.length,
        posts: createdPosts.length,
        templates: createdTemplates.length
      },
      data_purity_status: 'OK'
    });
  } catch (error) {
    console.error('Failed to seed sandbox workspace:', error);
    return createErrorResponse({
      errorMessage: "Failed to seed sandbox workspace",
      status: 500,
    });
  }
}, true);
