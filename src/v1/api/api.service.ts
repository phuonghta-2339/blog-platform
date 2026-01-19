import { Injectable } from '@nestjs/common';

/**
 * Service for V1 API endpoints
 * Provides business logic for version 1 features
 */
@Injectable()
export class ApiService {
  /**
   * Get API information for version 1
   * @returns API information object
   */
  getApiInfo(): {
    version: string;
    name: string;
    description: string;
    features: string[];
  } {
    return {
      version: '1.0',
      name: 'Blog Platform API',
      description:
        'A production-ready RESTful API for a blog platform (Medium clone)',
      features: [
        'User authentication and authorization',
        'User profile management',
        'Article CRUD operations',
        'Comments on articles',
        'Article favorites',
        'User following',
        'Tag-based article filtering',
      ],
    };
  }

  /**
   * Get welcome message for version 1
   * @returns Welcome message
   */
  getWelcome(): string {
    return 'Welcome to Blog Platform API v1!';
  }
}
