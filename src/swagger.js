import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SendIt Cycles E-commerce API',
      version: '1.0.0',
      description: 'Complete REST API for SendIt Cycles bike shop with bulk operations support',
      contact: {
        name: 'SendIt Cycles Support',
        email: 'support@senditcycles.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for authentication'
        }
      },
      schemas: {
        Category: {
          type: 'object',
          required: ['name'],
          properties: {
            id: {
              type: 'integer',
              description: 'Category ID'
            },
            name: {
              type: 'string',
              description: 'Category name'
            },
            description: {
              type: 'string',
              description: 'Category description'
            }
          }
        },
        Product: {
          type: 'object',
          required: ['category_id', 'name', 'price', 'stock_quantity'],
          properties: {
            id: {
              type: 'integer',
              description: 'Product ID'
            },
            category_id: {
              type: 'integer',
              description: 'Category ID'
            },
            name: {
              type: 'string',
              description: 'Product name'
            },
            description: {
              type: 'string',
              description: 'Product description'
            },
            price: {
              type: 'number',
              format: 'float',
              description: 'Product price'
            },
            stock_quantity: {
              type: 'integer',
              description: 'Available stock'
            },
            image_url: {
              type: 'string',
              description: 'Product image URL'
            },
            has_sizes: {
              type: 'boolean',
              description: 'Whether product has size options'
            },
            available_sizes: {
              type: 'string',
              description: 'Comma-separated available sizes'
            },
            features: {
              type: 'string',
              description: 'Product features'
            },
            specs: {
              type: 'object',
              description: 'Product specifications'
            },
            geometry: {
              type: 'object',
              description: 'Product geometry details'
            }
          }
        },
        Order: {
          type: 'object',
          properties: {
            id: {
              type: 'integer'
            },
            user_id: {
              type: 'integer'
            },
            total_price: {
              type: 'number'
            },
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']
            },
            items: {
              type: 'array',
              items: {
                type: 'object'
              }
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string'
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js', './src/index.js']
};

export const specs = swaggerJsdoc(options);
