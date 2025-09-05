
// Real mention and role resolution for platform destinations
import CrudOperations from './crud-operations';
import { generateAdminUserToken } from './auth';

export interface MentionResolution {
  mention: string;
  type: 'user' | 'role' | 'channel' | 'unknown';
  resolved: boolean;
  platformId?: string;
  displayName?: string;
  warning?: string;
}

export interface RoleValidation {
  role: string;
  platform: string;
  exists: boolean;
  permissions?: string[];
  warning?: string;
}

export class MentionResolver {
  private adminToken: string | null = null;

  async initialize() {
    this.adminToken = await generateAdminUserToken();
  }

  async resolveMentions(
    content: string,
    platformType: string,
    connectionId: number
  ): Promise<MentionResolution[]> {
    if (!this.adminToken) {
      await this.initialize();
    }

    const mentions = this.extractMentions(content, platformType);
    const resolutions: MentionResolution[] = [];

    for (const mention of mentions) {
      const resolution = await this.resolveSingleMention(mention, platformType, connectionId);
      resolutions.push(resolution);
    }

    return resolutions;
  }

  private extractMentions(content: string, platformType: string): string[] {
    const mentions: string[] = [];

    switch (platformType) {
      case 'discord':
        // Discord mentions: @username, @role, #channel, <@123>, <@&456>, <#789>
        const discordMentions = content.match(/@\w+|<@[!&]?\d+>|<#\d+>/g) || [];
        mentions.push(...discordMentions);
        break;
        
      case 'telegram':
        // Telegram mentions: @username, @channel
        const telegramMentions = content.match(/@\w+/g) || [];
        mentions.push(...telegramMentions);
        break;
        
      case 'whop':
        // Whop mentions: @username
        const whopMentions = content.match(/@\w+/g) || [];
        mentions.push(...whopMentions);
        break;
    }

    return [...new Set(mentions)]; // Remove duplicates
  }

  private async resolveSingleMention(
    mention: string,
    platformType: string,
    connectionId: number
  ): Promise<MentionResolution> {
    try {
      const connectionsCrud = new CrudOperations('platform_connections'); // Use service role key only
      const connection = await connectionsCrud.findById(connectionId);

      if (!connection) {
        return {
          mention,
          type: 'unknown',
          resolved: false,
          warning: 'Platform connection not found'
        };
      }

      switch (platformType) {
        case 'discord':
          return await this.resolveDiscordMention(mention, connection);
        case 'telegram':
          return await this.resolveTelegramMention(mention, connection);
        case 'whop':
          return await this.resolveWhopMention(mention, connection);
        default:
          return {
            mention,
            type: 'unknown',
            resolved: false,
            warning: 'Unsupported platform type'
          };
      }
    } catch (error) {
      return {
        mention,
        type: 'unknown',
        resolved: false,
        warning: `Resolution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async resolveDiscordMention(
    mention: string,
    connection: any
  ): Promise<MentionResolution> {
    // Discord ID mention format: <@123>, <@&456>, <#789>
    if (mention.startsWith('<@') && mention.endsWith('>')) {
      const isRole = mention.includes('&');
      const isChannel = mention.startsWith('<#');
      const id = mention.replace(/[<>@&#]/g, '');

      if (isChannel) {
        return {
          mention,
          type: 'channel',
          resolved: true,
          platformId: id,
          displayName: `#channel-${id}`,
          warning: 'Channel mention - verify channel exists in target server'
        };
      } else if (isRole) {
        return {
          mention,
          type: 'role',
          resolved: true,
          platformId: id,
          displayName: `@role-${id}`,
          warning: 'Role mention - verify role exists and bot has permissions'
        };
      } else {
        return {
          mention,
          type: 'user',
          resolved: true,
          platformId: id,
          displayName: `@user-${id}`,
          warning: 'User mention - verify user is in target server'
        };
      }
    }

    // Username mention format: @username
    if (mention.startsWith('@')) {
      const username = mention.substring(1);
      return {
        mention,
        type: 'user',
        resolved: false,
        warning: `Username @${username} cannot be resolved without Discord API access. Use user ID format <@123> for reliable mentions.`
      };
    }

    return {
      mention,
      type: 'unknown',
      resolved: false,
      warning: 'Unrecognized mention format'
    };
  }

  private async resolveTelegramMention(
    mention: string,
    connection: any
  ): Promise<MentionResolution> {
    if (mention.startsWith('@')) {
      const username = mention.substring(1);
      
      // Check if it's a channel/group
      if (username === connection.api_credentials?.chat_id?.substring(1)) {
        return {
          mention,
          type: 'channel',
          resolved: true,
          displayName: username,
          warning: 'Self-reference to current channel'
        };
      }

      return {
        mention,
        type: 'user',
        resolved: false,
        warning: `Username @${username} cannot be verified. Ensure the user exists and is accessible in your Telegram context.`
      };
    }

    return {
      mention,
      type: 'unknown',
      resolved: false,
      warning: 'Unrecognized Telegram mention format'
    };
  }

  private async resolveWhopMention(
    mention: string,
    connection: any
  ): Promise<MentionResolution> {
    if (mention.startsWith('@')) {
      const username = mention.substring(1);
      
      return {
        mention,
        type: 'user',
        resolved: false,
        warning: `Username @${username} cannot be verified without Whop API access. Mentions may not work as expected.`
      };
    }

    return {
      mention,
      type: 'unknown',
      resolved: false,
      warning: 'Unrecognized Whop mention format'
    };
  }

  async validateRoles(
    content: string,
    platformType: string,
    connectionId: number
  ): Promise<RoleValidation[]> {
    const roleRegex = /@(\w+)/g;
    const roles = [...content.matchAll(roleRegex)].map(match => match[1]);
    
    if (roles.length === 0) {
      return [];
    }

    const validations: RoleValidation[] = [];

    for (const role of roles) {
      validations.push({
        role: `@${role}`,
        platform: platformType,
        exists: false,
        warning: `Role @${role} cannot be verified. Ensure it exists and your bot has permission to mention it.`
      });
    }

    return validations;
  }
}

// Global mention resolver instance
let mentionResolver: MentionResolver | null = null;

export async function getMentionResolver(): Promise<MentionResolver> {
  if (!mentionResolver) {
    mentionResolver = new MentionResolver();
    await mentionResolver.initialize();
  }
  return mentionResolver;
}
