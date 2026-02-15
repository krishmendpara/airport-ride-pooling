// src/config/swagger.ts
import swaggerJsdoc from "swagger-jsdoc";
import dotenv from "dotenv";

dotenv.config();

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Smart Airport Ride Pooling API",
      version: "1.0.0",
      description: "Backend system for shared airport ride pooling with intelligent matching and dynamic pricing",
      contact: {
        name: "API Support",
        email: "support@airportpooling.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: "Development server",
      },
      {
        url: "https://api.airportpooling.com",
        description: "Production server",
      },
    ],
    tags: [
      {
        name: "Rides",
        description: "Ride request and management endpoints",
      },
      {
        name: "Cabs",
        description: "Cab fleet management",
      },
      {
        name: "Cancel",
        description: "Ride cancellation",
      },
    ],
    components: {
      schemas: {
        Location: {
          type: "object",
          required: ["type", "coordinates"],
          properties: {
            type: {
              type: "string",
              enum: ["Point"],
              description: "GeoJSON type",
            },
            coordinates: {
              type: "array",
              items: {
                type: "number",
              },
              minItems: 2,
              maxItems: 2,
              description: "[longitude, latitude]",
              example: [72.8777, 19.0760],
            },
          },
        },
        RideRequest: {
          type: "object",
          required: ["user", "pickupLocation", "dropLocation", "luggageCount", "seatCount"],
          properties: {
            user: {
              type: "string",
              format: "objectId",
              example: "65f1a2b3c4d5e6f789012345",
            },
            pickupLocation: {
              $ref: "#/components/schemas/Location",
            },
            dropLocation: {
              $ref: "#/components/schemas/Location",
            },
            luggageCount: {
              type: "number",
              minimum: 0,
              maximum: 10,
              example: 2,
            },
            seatCount: {
              type: "number",
              minimum: 1,
              maximum: 4,
              example: 1,
            },
            detourTolerance: {
              type: "number",
              minimum: 0,
              maximum: 60,
              example: 15,
              description: "Maximum acceptable detour in minutes",
            },
            status: {
              type: "string",
              enum: ["PENDING", "MATCHED", "CANCELLED", "COMPLETED"],
              example: "PENDING",
            },
          },
        },
        RideResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            data: {
              type: "object",
              properties: {
                _id: {
                  type: "string",
                  example: "65f1a2b3c4d5e6f789012345",
                },
                user: {
                  type: "string",
                  example: "65f1a2b3c4d5e6f789012346",
                },
                pickupLocation: {
                  $ref: "#/components/schemas/Location",
                },
                dropLocation: {
                  $ref: "#/components/schemas/Location",
                },
                status: {
                  type: "string",
                  example: "MATCHED",
                },
                fare: {
                  type: "number",
                  example: 285.5,
                },
                pool: {
                  type: "string",
                  nullable: true,
                  example: "65f1a2b3c4d5e6f789012347",
                },
                createdAt: {
                  type: "string",
                  format: "date-time",
                },
                updatedAt: {
                  type: "string",
                  format: "date-time",
                },
              },
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            error: {
              type: "string",
              example: "Ride not found",
            },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;