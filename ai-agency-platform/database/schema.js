// MongoDB Schema Definitions for AI Agency Platform

// User collection schema
const UserSchema = {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["username", "email", "createdAt"],
      properties: {
        username: {
          bsonType: "string",
          description: "Username - required and must be unique"
        },
        email: {
          bsonType: "string",
          description: "Email address - required and must be unique",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
        },
        password: {
          bsonType: "string",
          description: "Hashed password"
        },
        fullName: {
          bsonType: "string",
          description: "User's full name"
        },
        role: {
          bsonType: "string",
          description: "User role (admin, user, client)",
          enum: ["admin", "user", "client"]
        },
        profileImage: {
          bsonType: "string",
          description: "URL to profile image"
        },
        createdAt: {
          bsonType: "date",
          description: "Account creation timestamp"
        },
        updatedAt: {
          bsonType: "date",
          description: "Account last update timestamp"
        },
        lastLogin: {
          bsonType: "date",
          description: "Last login timestamp"
        },
        isActive: {
          bsonType: "bool",
          description: "Whether the user account is active"
        }
      }
    }
  },
  indexes: [
    { key: { username: 1 }, unique: true },
    { key: { email: 1 }, unique: true },
    { key: { createdAt: 1 } }
  ]
};

// Project collection schema
const ProjectSchema = {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "ownerId", "createdAt"],
      properties: {
        name: {
          bsonType: "string",
          description: "Project name - required"
        },
        description: {
          bsonType: "string",
          description: "Project description"
        },
        ownerId: {
          bsonType: "objectId",
          description: "User ID of the project owner - required"
        },
        templateId: {
          bsonType: ["objectId", "null"],
          description: "Template ID if the project was created from a template"
        },
        status: {
          bsonType: "string",
          description: "Project status",
          enum: ["active", "archived", "completed", "deleted"]
        },
        tags: {
          bsonType: "array",
          description: "Project tags for organization",
          items: {
            bsonType: "string"
          }
        },
        collaborators: {
          bsonType: "array",
          description: "User IDs of collaborators",
          items: {
            bsonType: "objectId"
          }
        },
        createdAt: {
          bsonType: "date",
          description: "Project creation timestamp"
        },
        updatedAt: {
          bsonType: "date",
          description: "Project last update timestamp"
        },
        settings: {
          bsonType: "object",
          description: "Project-specific settings"
        }
      }
    }
  },
  indexes: [
    { key: { ownerId: 1 } },
    { key: { collaborators: 1 } },
    { key: { createdAt: 1 } },
    { key: { status: 1 } }
  ]
};

// Template collection schema
const TemplateSchema = {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "category", "createdAt"],
      properties: {
        name: {
          bsonType: "string",
          description: "Template name - required"
        },
        description: {
          bsonType: "string",
          description: "Template description"
        },
        category: {
          bsonType: "string",
          description: "Template category - required",
          enum: ["Scraping", "Monitoring", "Research", "Analysis", "Automation", "Other"]
        },
        config: {
          bsonType: "object",
          description: "Template configuration"
        },
        previewImage: {
          bsonType: "string",
          description: "URL to template preview image"
        },
        createdAt: {
          bsonType: "date",
          description: "Template creation timestamp"
        },
        updatedAt: {
          bsonType: "date",
          description: "Template last update timestamp"
        },
        createdBy: {
          bsonType: "objectId",
          description: "User ID of the template creator"
        },
        isPublic: {
          bsonType: "bool",
          description: "Whether the template is publicly available"
        },
        usageCount: {
          bsonType: "int",
          description: "Number of times the template has been used"
        }
      }
    }
  },
  indexes: [
    { key: { category: 1 } },
    { key: { createdAt: 1 } },
    { key: { isPublic: 1 } },
    { key: { usageCount: 1 } }
  ]
};

// ScrapingTask collection schema
const ScrapingTaskSchema = {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["projectId", "status", "createdAt"],
      properties: {
        projectId: {
          bsonType: "objectId",
          description: "Project ID this task belongs to - required"
        },
        status: {
          bsonType: "string",
          description: "Task status - required",
          enum: ["pending", "running", "completed", "failed", "cancelled"]
        },
        targetUrl: {
          bsonType: "string",
          description: "Target URL for scraping"
        },
        config: {
          bsonType: "object",
          description: "Scraping configuration"
        },
        resultId: {
          bsonType: ["objectId", "null"],
          description: "ID of the result in the ScrapingResult collection"
        },
        createdAt: {
          bsonType: "date",
          description: "Task creation timestamp"
        },
        startedAt: {
          bsonType: "date",
          description: "Task start timestamp"
        },
        completedAt: {
          bsonType: "date",
          description: "Task completion timestamp"
        },
        createdBy: {
          bsonType: "objectId",
          description: "User ID of the task creator"
        },
        error: {
          bsonType: "string",
          description: "Error message if task failed"
        },
        retryCount: {
          bsonType: "int",
          description: "Number of retries"
        },
        stats: {
          bsonType: "object",
          description: "Task statistics"
        }
      }
    }
  },
  indexes: [
    { key: { projectId: 1 } },
    { key: { status: 1 } },
    { key: { createdAt: 1 } },
    { key: { createdBy: 1 } }
  ]
};

// ScrapingResult collection schema
const ScrapingResultSchema = {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["taskId", "createdAt"],
      properties: {
        taskId: {
          bsonType: "objectId",
          description: "ID of the ScrapingTask - required"
        },
        data: {
          bsonType: ["array", "object"],
          description: "Scraped data"
        },
        format: {
          bsonType: "string",
          description: "Data format",
          enum: ["json", "csv", "xml"]
        },
        stats: {
          bsonType: "object",
          description: "Scraping statistics"
        },
        filePath: {
          bsonType: "string",
          description: "Path to saved output file"
        },
        createdAt: {
          bsonType: "date",
          description: "Result creation timestamp"
        }
      }
    }
  },
  indexes: [
    { key: { taskId: 1 }, unique: true },
    { key: { createdAt: 1 } }
  ]
};

// ScheduledTask collection schema
const ScheduledTaskSchema = {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["taskType", "status", "scheduleTime", "createdAt"],
      properties: {
        taskType: {
          bsonType: "string",
          description: "Type of task - required",
          enum: ["scraping", "processing", "report", "notification", "cleanup"]
        },
        status: {
          bsonType: "string",
          description: "Task status - required",
          enum: ["scheduled", "running", "completed", "failed", "cancelled"]
        },
        scheduleTime: {
          bsonType: "date",
          description: "Scheduled execution time - required"
        },
        params: {
          bsonType: "object",
          description: "Task parameters"
        },
        priority: {
          bsonType: "int",
          description: "Task priority"
        },
        projectId: {
          bsonType: "objectId",
          description: "Project ID this task belongs to"
        },
        createdBy: {
          bsonType: "objectId",
          description: "User ID of the task creator"
        },
        createdAt: {
          bsonType: "date",
          description: "Task creation timestamp"
        },
        startedAt: {
          bsonType: "date",
          description: "Task start timestamp"
        },
        completedAt: {
          bsonType: "date",
          description: "Task completion timestamp"
        },
        result: {
          bsonType: "object",
          description: "Task result"
        },
        error: {
          bsonType: "string",
          description: "Error message if task failed"
        },
        retryCount: {
          bsonType: "int",
          description: "Number of retries"
        },
        maxRetries: {
          bsonType: "int",
          description: "Maximum number of retries"
        }
      }
    }
  },
  indexes: [
    { key: { status: 1 } },
    { key: { scheduleTime: 1 } },
    { key: { taskType: 1 } },
    { key: { projectId: 1 } },
    { key: { createdAt: 1 } }
  ]
};

// Analytics collection schema
const AnalyticsSchema = {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "projectId", "timestamp", "eventType"],
      properties: {
        userId: {
          bsonType: "objectId",
          description: "User ID - required"
        },
        projectId: {
          bsonType: "objectId",
          description: "Project ID - required"
        },
        timestamp: {
          bsonType: "date",
          description: "Event timestamp - required"
        },
        eventType: {
          bsonType: "string",
          description: "Event type - required",
          enum: ["login", "project_create", "task_create", "task_complete", "resource_usage"]
        },
        details: {
          bsonType: "object",
          description: "Event details"
        },
        sessionId: {
          bsonType: "string",
          description: "Session ID"
        },
        ipAddress: {
          bsonType: "string",
          description: "IP address"
        },
        userAgent: {
          bsonType: "string",
          description: "User agent string"
        }
      }
    }
  },
  indexes: [
    { key: { userId: 1 } },
    { key: { projectId: 1 } },
    { key: { timestamp: 1 } },
    { key: { eventType: 1 } }
  ]
};

// Database initialization function
async function initializeDatabase(db) {
  try {
    // Create collections with validation
    await db.createCollection("users", UserSchema);
    await db.createCollection("projects", ProjectSchema);
    await db.createCollection("templates", TemplateSchema);
    await db.createCollection("scrapingTasks", ScrapingTaskSchema);
    await db.createCollection("scrapingResults", ScrapingResultSchema);
    await db.createCollection("scheduledTasks", ScheduledTaskSchema);
    await db.createCollection("analytics", AnalyticsSchema);
    
    // Create indexes
    const collections = {
      users: UserSchema.indexes,
      projects: ProjectSchema.indexes,
      templates: TemplateSchema.indexes,
      scrapingTasks: ScrapingTaskSchema.indexes,
      scrapingResults: ScrapingResultSchema.indexes,
      scheduledTasks: ScheduledTaskSchema.indexes,
      analytics: AnalyticsSchema.indexes
    };
    
    for (const [collection, indexes] of Object.entries(collections)) {
      for (const index of indexes) {
        await db.collection(collection).createIndex(index.key, { unique: index.unique || false });
      }
    }
    
    console.log("Database initialized successfully");
    return true;
  } catch (error) {
    console.error("Error initializing database:", error);
    return false;
  }
}

// Add sample templates for demonstration
async function createSampleTemplates(db) {
  const templates = [
    {
      name: "E-commerce Scraper",
      description: "Extract product data from major e-commerce platforms",
      category: "Scraping",
      config: {
        selectors: {
          product_title: ".product-title",
          product_price: ".product-price",
          product_description: ".product-description"
        },
        proxy_rotation: true,
        captcha_handling: true
      },
      previewImage: "/images/templates/ecommerce.png",
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: true,
      usageCount: 0
    },
    {
      name: "Social Media Monitor",
      description: "Track mentions and sentiment across social platforms",
      category: "Monitoring",
      config: {
        platforms: ["twitter", "instagram", "facebook"],
        keywords: ["ai", "artificial intelligence"],
        sentiment_analysis: true
      },
      previewImage: "/images/templates/social-media.png",
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: true,
      usageCount: 0
    },
    {
      name: "Market Research Tool",
      description: "Gather competitive intelligence and market trends",
      category: "Research",
      config: {
        sources: ["news", "blogs", "reports"],
        topics: ["market trends", "competitor analysis"],
        frequency: "daily"
      },
      previewImage: "/images/templates/market-research.png",
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: true,
      usageCount: 0
    }
  ];
  
  try {
    await db.collection("templates").insertMany(templates);
    console.log("Sample templates created successfully");
    return true;
  } catch (error) {
    console.error("Error creating sample templates:", error);
    return false;
  }
}

module.exports = {
  schemas: {
    UserSchema,
    ProjectSchema,
    TemplateSchema,
    ScrapingTaskSchema,
    ScrapingResultSchema,
    ScheduledTaskSchema,
    AnalyticsSchema
  },
  initializeDatabase,
  createSampleTemplates
};
