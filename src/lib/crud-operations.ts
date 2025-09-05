
import { createPostgrestClient } from "./postgrest";
import { validateEnv } from "./api-utils";
import { ENABLE_AUTH, DEFAULT_DEV_USER_ID } from "@/constants/auth";

/**
 * Enhanced utility class for common CRUD operations with PostgREST
 * Includes better error handling and connection validation
 * HARDENED: Removed all mock data fallbacks except for demo workspace
 */
export default class CrudOperations {
  constructor(private tableName: string, private token?: string) {}

  private get client() {
    return createPostgrestClient(this.token);
  }

  /**
   * Test database connection for this table
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      validateEnv();
      
      const { error } = await this.client
        .from(this.tableName)
        .select('id')
        .limit(1);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown connection error' 
      };
    }
  }

  /**
   * Fetches multiple records with optional filtering, sorting, and pagination
   * HARDENED: No mock data fallbacks - real database or error
   */
  async findMany(
    filters?: Record<string, any>,
    params?: {
      limit?: number;
      offset?: number;
      orderBy?: {
        column: string;
        direction: "asc" | "desc";
      };
    },
  ) {
    // Test connection first
    const connectionTest = await this.testConnection();
    if (!connectionTest.success) {
      throw new Error(`Database connection failed for ${this.tableName}: ${connectionTest.error}`);
    }

    const { limit, offset, orderBy } = params || {};

    let query = this.client
      .from(this.tableName)
      .select("*")

    if (orderBy) {
      query = query.order(orderBy.column, {
        ascending: orderBy.direction === "asc",
      });
    }

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
    }

    if (limit && offset !== undefined) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Database query failed for ${this.tableName}: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Fetches a single record by its ID
   * HARDENED: No mock data fallbacks - real database or error
   */
  async findById(id: string | number) {
    const connectionTest = await this.testConnection();
    if (!connectionTest.success) {
      throw new Error(`Database connection failed for ${this.tableName}: ${connectionTest.error}`);
    }

    const { data, error } = await this.client
      .from(this.tableName)
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Database query failed for ${this.tableName}: ${error.message}`);
    }

    return data;
  }

  /**
   * Creates a new record in the table with validation
   * HARDENED: No mock data fallbacks - real database or error
   */
  async create(data: Record<string, any>) {
    const connectionTest = await this.testConnection();
    if (!connectionTest.success) {
      throw new Error(`Database connection failed for ${this.tableName}: ${connectionTest.error}`);
    }

    // Validate required fields based on table
    this.validateCreateData(data);

    const res = await this.client
      .from(this.tableName)
      .insert([data])
      .select()
      .single();

    const { data: result, error } = res;

    if (error) {
      throw new Error(`Database insert failed for ${this.tableName}: ${error.message}`);
    }

    return result;
  }

  /**
   * Updates an existing record by ID with validation
   * HARDENED: No mock data fallbacks - real database or error
   */
  async update(
    id: string | number,
    data: Record<string, any>
  ) {
    const connectionTest = await this.testConnection();
    if (!connectionTest.success) {
      throw new Error(`Database connection failed for ${this.tableName}: ${connectionTest.error}`);
    }

    const { data: result, error } = await this.client
      .from(this.tableName)
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Database update failed for ${this.tableName}: ${error.message}`);
    }

    return result;
  }

  /**
   * Deletes a record by ID
   * HARDENED: No mock data fallbacks - real database or error
   */
  async delete(id: string | number) {
    const connectionTest = await this.testConnection();
    if (!connectionTest.success) {
      throw new Error(`Database connection failed for ${this.tableName}: ${connectionTest.error}`);
    }

    const { error } = await this.client.from(this.tableName).delete().eq("id", id);

    if (error) {
      throw new Error(`Database delete failed for ${this.tableName}: ${error.message}`);
    }

    return { id };
  }

  /**
   * Validate data before creating records
   */
  private validateCreateData(data: Record<string, any>) {
    switch (this.tableName) {
      case 'posts':
        if (!data.content || !data.user_id) {
          throw new Error('Posts require content and user_id');
        }
        break;
      case 'platform_connections':
        if (!data.platform_type || !data.connection_name || !data.user_id) {
          throw new Error('Platform connections require platform_type, connection_name, and user_id');
        }
        break;
      case 'user_notifications':
        if (!data.user_id || !data.type || !data.title || !data.message) {
          throw new Error('Notifications require user_id, type, title, and message');
        }
        break;
    }
  }
}
